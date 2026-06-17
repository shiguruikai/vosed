'use client';

import { Layers } from 'lucide-react';
import { ComponentPropsWithoutRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { fetchFullAudioEventDataStream } from '@/lib/api.client';
import { cn } from '@/lib/utils';
import { useLogs } from '@/stores/logs-store';
import { useScriptStore } from '@/stores/script-store';

const validateFilename = (value: string): { message: string }[] | undefined => {
  if (!value) return undefined;
  if (!/\.(wav|mp3|aac|m4a|ogg|flac)$/i.test(value)) {
    return [{ message: '拡張子（.wav, .mp3, .aac, .m4a, .ogg, .flac）が必要です。' }];
  }
  return undefined;
};

export function FullAudio({ className, ...props }: Readonly<ComponentPropsWithoutRef<'div'>>) {
  const [filename, setFilename] = useState<string>('output.mp3');
  const [fullAudioFile, setFullAudioFile] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const appendLog = useLogs((state) => state.addLog);
  const updateLineField = useScriptStore((state) => state.updateLineField);

  const handleGenerateButtonClick = async () => {
    setIsLoading(true);
    setFullAudioFile(null);
    try {
      const script = useScriptStore.getState().getScript();

      const stream = fetchFullAudioEventDataStream({
        lines: script.lines.map((l) => ({
          id: l.id,
          voice: l.voice,
          text: l.text,
          speed: l.speed,
          seed: l.seed,
          file: l.file,
        })),
        words: script.words.map((w) => ({
          word: w.word,
          reading: w.reading,
        })),
        file: filename,
      });

      for await (const data of stream) {
        if (data.status === 'info') {
          appendLog('info', data.message);
        } else if (data.status === 'progress') {
          updateLineField(data.id, 'file', data.file);
          appendLog('info', data.message);
        } else if (data.status === 'success') {
          appendLog('info', data.message);
          setFullAudioFile(data.file);
        } else if (data.status === 'error') {
          appendLog('error', data.message);
        }
      }
    } catch (e) {
      appendLog('error', e instanceof Error ? e.message : String(e));
    } finally {
      setIsLoading(false);
    }
  };

  const errors = validateFilename(filename);

  return (
    <div
      className={cn(
        'p-2 flex flex-col gap-2',
        className,
      )}
      {...props}
    >
      <Field>
        <FieldLabel>出力ファイル</FieldLabel>
        <Input
          value={filename}
          onChange={(e) => setFilename(e.target.value)}
          aria-invalid={!!errors}
        />
        <FieldError errors={errors} />
      </Field>

      <Button
        size='lg'
        disabled={isLoading || !!errors}
        onClick={handleGenerateButtonClick}
      >
        {isLoading ? <Spinner data-icon='inline-start' /> : <Layers data-icon='inline-start' />}
        全体音声合成・結合
      </Button>

      {fullAudioFile && (
        <audio
          src={`/output/${fullAudioFile}`}
          controls
          preload='metadata'
          className='m-auto w-full h-8'
        />
      )}
    </div>
  );
}
