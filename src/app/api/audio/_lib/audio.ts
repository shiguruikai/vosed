import 'server-only';

import { spawn } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

import { getSettings } from '@/lib/env.server';
import { Line, NormalizedLine, Word } from '@/lib/schemas';
import { isNodeError } from '@/lib/utils.server';

import { fetchTTS } from '../../../../lib/api.server';

export function getOutputRelativeUrl(filePath: string): string {
  const { outputDir } = getSettings();
  return path.relative(outputDir, filePath).replaceAll('\\', '/');
}

export function normalizeLines(lines: Partial<Line>[], words: Word[]): NormalizedLine[] {
  const { outputDir } = getSettings();

  const mapping: Record<string, string> = {};
  for (const w of words) {
    if (w.word) mapping[w.word] = w.reading;
  }

  const keys = Object.keys(mapping);
  const pattern = keys.length > 0 ? new RegExp(keys.map((key) => RegExp.escape(key)).join('|'), 'g') : null;

  const normalized: NormalizedLine[] = [];

  for (const line of lines) {
    let text = line.text?.trim();
    if (!text) continue;

    if (pattern) {
      text = text.replace(pattern, (match) => mapping[match]);
    }

    const id = line.id || crypto.randomUUID();

    const voice = line.voice?.trim() || 'none';

    const speed = line.speed ?? 1;

    let seed = line.seed;
    if (!seed || seed < 0) {
      seed = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
    }

    let file = line.file;
    if (!file) {
      file = path.join(outputDir, `${id}.wav`);
    } else if (!path.isAbsolute(file)) {
      file = path.resolve(outputDir, file.replace(/^[/\\]+/, ''));
    }

    normalized.push({
      id,
      voice,
      text,
      speed,
      seed,
      file,
    });
  }

  return normalized;
}

export async function generateLineAudioFile(line: NormalizedLine): Promise<string> {
  const data = await fetchTTS(line);

  let filePath = line.file;

  const dir = path.dirname(filePath);
  const ext = path.extname(filePath);
  const stem = path.basename(filePath, ext);

  let counter = 1;
  while (true) {
    try {
      filePath = path.join(dir, `${stem}_${counter.toString().padStart(3, '0')}${ext}`);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, Buffer.from(data), { flag: 'wx' });
      return filePath;
    } catch (e) {
      // ファイルが既に存在する場合、ファイル名の連番をカウントアップして再試行
      if (isNodeError(e) && e.code === 'EEXIST') {
        counter++;
        continue;
      }

      throw e;
    }
  }
}

export async function concatAudioFiles(inputFiles: string[], outputFile: string): Promise<void> {
  const filesTextPath = path.join(
    path.dirname(outputFile),
    `${crypto.randomUUID()}.txt`,
  );

  const filesTextContent = inputFiles
    .map((p) => `file '${path.resolve(p)}'`)
    .join('\n');

  await fs.writeFile(filesTextPath, filesTextContent, 'utf-8');

  return new Promise((resolve, reject) => {
    const isWav = outputFile.toLowerCase().endsWith('.wav');
    const codecArgs = isWav ? ['-c', 'copy'] : [];

    const args = [
      '-y',
      '-f', 'concat',
      '-safe', '0',
      '-i', filesTextPath,
      ...codecArgs,
      outputFile,
    ];

    const process = spawn('ffmpeg', args, { stdio: 'ignore' });

    process.on('close', async (code) => {
      await fs.rm(filesTextPath, { force: true });
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Failed to concatenate audio files. ffmpeg returned exit code ${code}.`));
      }
    });

    process.on('error', async (err) => {
      await fs.rm(filesTextPath, { force: true });
      reject(new Error(`Failed to start ffmpeg: ${err.message}`));
    });
  });
}
