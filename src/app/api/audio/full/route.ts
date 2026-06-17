import { existsSync } from 'node:fs';
import path from 'node:path';

import { getSettings } from '@/lib/env.server';
import { FullAudioRequestSchema, FullAudioSSEData } from '@/lib/schemas';
import { withErrorHandler, withSSE } from '@/lib/utils.server';

import { concatAudioFiles, generateLineAudioFile, getOutputRelativeUrl, normalizeLines } from '../_lib/audio';

export const POST = withErrorHandler(withSSE<FullAudioSSEData>(async function* (request) {
  try {
    const body = await request.json();
    const parsed = FullAudioRequestSchema.parse(body);

    const lines = normalizeLines(parsed.lines, parsed.words);

    if (!parsed.lines.length) {
      yield {
        status: 'error',
        message: '台詞が1つも含まれていません。',
      };
      return;
    }

    const { outputDir } = getSettings();

    // ディレクトリトラバーサル対策
    for (const line of lines) {
      if (!line.file.startsWith(outputDir)) {
        yield {
          status: 'error',
          message: '不正なファイルパスが含まれているため処理を終了しました。',
        };
        return;
      }
    }

    const outputFile = path.resolve(outputDir, parsed.file.replace(/^[/\\]+/, ''));

    // ディレクトリトラバーサル対策
    if (!outputFile.startsWith(outputDir)) {
      yield {
        status: 'error',
        message: '不正なファイルパスが含まれているため処理を終了しました。',
      };
      return;
    }

    yield {
      status: 'info',
      message: '音声の生成を開始します。',
    };

    const targetLines = lines.filter((line) => !existsSync(line.file));

    if (targetLines.length) {
      for (let i = 0; i < targetLines.length; i++) {
        const line = targetLines[i];

        line.file = await generateLineAudioFile(line);

        yield {
          status: 'progress',
          message: `[${i + 1}/${targetLines.length}] 台詞の音声を生成しました。`,
          id: line.id,
          file: getOutputRelativeUrl(line.file),
        };
      }
    } else {
      yield {
        status: 'info',
        message: 'すべての台詞の音声が生成済みです。',
      };
    }

    yield {
      status: 'info',
      message: '台詞の音声を結合します。',
    };

    const inputFiles = lines.map((l) => l.file);
    await concatAudioFiles(inputFiles, outputFile);

    const relativePath = path.relative(outputDir, outputFile).replaceAll('\\', '/');

    yield {
      status: 'success',
      message: '音声の生成が完了しました。',
      file: relativePath,
    };
  } catch (e) {
    console.error('An unexpected error occurred:', e);
    yield {
      status: 'error',
      message: `サーバーで予期せぬエラーが発生しました。原因: ${e instanceof Error ? e.message : e}`,
    };
  }
}));
