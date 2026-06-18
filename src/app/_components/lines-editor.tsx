'use client';

import { DragDropProvider } from '@dnd-kit/react';
import { isSortable, useSortable } from '@dnd-kit/react/sortable';
import { ArrowDown, ArrowUp, ChevronDownIcon, ChevronUpIcon, Dices, Play, Plus, Trash2, X } from 'lucide-react';
import { FocusEvent, memo, useEffect, useId, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group';
import { Spinner } from '@/components/ui/spinner';
import { useKeyBind } from '@/hooks/key-bind';
import { fetchLineAudio, fetchVoices } from '@/lib/api.client';
import { cn } from '@/lib/utils';
import { useLinesExpandStore } from '@/stores/lines-expand-store';
import { useLogs } from '@/stores/logs-store';
import { useScriptStore } from '@/stores/script-store';

function VoicesDatalist({ id }: Readonly<{ id: string }>) {
  const [voices, setVoices] = useState<string[]>([]);

  useEffect(() => {
    fetchVoices().then((voices) => setVoices(voices));
  }, []);

  return (
    <datalist id={id}>
      {voices.map((voice) => <option key={voice} value={voice} />,
      )}
    </datalist>
  );
}

function LineVoiceField({ lineId, datalistId }: Readonly<{ lineId: string; datalistId: string }>) {
  const voice = useScriptStore((state) => state.script.linesById[lineId].voice);

  return (
    <Field className='flex-1 min-w-40'>
      <Input
        placeholder='話者'
        list={datalistId}
        key={voice}
        defaultValue={voice}
        onBlur={(e) => {
          useScriptStore.getState().updateLineField(lineId, 'voice', e.target.value);
        }}
      />
    </Field>
  );
}

const generateLineAudio = async (lineId: string) => {
  const { script, updateLineField } = useScriptStore.getState();
  const { addLog } = useLogs.getState();

  const line = script.linesById[lineId];

  addLog('info', `台詞の音声合成を開始: [${line.voice}] ${line.text}`);

  try {
    const res = await fetchLineAudio({
      id: line.id,
      voice: line.voice,
      speed: line.speed,
      seed: line.seed,
      text: line.text,
      words: script.words,
    });

    updateLineField(line.id, 'file', res.file);

    addLog('info', `台詞の音声合成を完了: ${res.file}`);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    addLog('error', `台詞の音声合成に失敗: ${message}`);
  }
};

function LineTextField({ lineId }: Readonly<{ lineId: string }>) {
  const text = useScriptStore((state) => state.script.linesById[lineId].text);
  const [prevText, setPrevText] = useState(text);
  const [value, setValue] = useState(text);

  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  if (text !== prevText) {
    setPrevText(text);
    setValue(text);
  }

  const updateText = () => {
    useScriptStore.getState().updateLineField(lineId, 'text', value);
  };

  const updateTextAndGenerateLineAudio = async () => {
    updateText();

    setIsLoading(true);
    try {
      await generateLineAudio(lineId);
    } finally {
      setIsLoading(false);
    }
  };

  useKeyBind({
    keys: 'ctrl+enter',
    disabled: isLoading || !value || !isFocused,
    action: async () => {
      await updateTextAndGenerateLineAudio();
    },
  });

  return (
    <Field className='flex-6 min-w-120'>
      <ButtonGroup>
        <Input
          placeholder='台詞テキスト'
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
          }}
          onFocus={() => {
            setIsFocused(true);
          }}
          onBlur={() => {
            setIsFocused(false);
            updateText();
          }}
        />
        <Button
          title='この台詞の音声を生成する'
          disabled={isLoading || !value}
          onClick={async () => {
            await updateTextAndGenerateLineAudio();
          }}
        >
          {isLoading ? <Spinner /> : <Play />}
        </Button>
      </ButtonGroup>
    </Field>
  );
}

const validateSpeed = (value: string): { message: string }[] | undefined => {
  const n = Number.parseFloat(value);
  if (!Number.isFinite(n) || n < 0.3 || n > 4) {
    return [{ message: '0.3以上4以下の数値を入力してください。' }];
  }
  return undefined;
};

function LineSpeedField({ lineId }: Readonly<{ lineId: string }>) {
  const speed = useScriptStore((state) => state.script.linesById[lineId].speed);
  const [prevSpeed, setPrevSpeed] = useState(speed);
  const [value, setValue] = useState(String(speed));

  if (speed !== prevSpeed) {
    setPrevSpeed(speed);
    setValue(String(speed));
  }

  const errors = validateSpeed(value);

  return (
    <Field className='flex-1 min-w-20'>
      <FieldLabel>速度</FieldLabel>
      <Input
        placeholder='例: 1.0'
        type='number'
        min={0.3}
        max={4}
        step={0.1}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
        }}
        onBlur={() => {
          if (errors) return;
          useScriptStore.getState().updateLineField(lineId, 'speed', Number.parseFloat(value));
        }}
        aria-invalid={!!errors}
      />
      <FieldError errors={errors} />
    </Field>
  );
}

const MIN_SEED_VALUE = -1;
const MAX_SEED_VALUE = Number.MAX_SAFE_INTEGER;
const validateSeed = (value: string): { message: string }[] | undefined => {
  if (!/^-?\d+$/.test(value)) return [{ message: '整数を入力してください。' }];
  const n = Number.parseInt(value, 10);
  if (n < MIN_SEED_VALUE) return [{ message: `${MIN_SEED_VALUE}以上の整数を入力してください。` }];
  if (n > MAX_SEED_VALUE) return [{ message: `${MAX_SEED_VALUE}以下の整数を入力してください。` }];
  return undefined;
};
const getRandomSeed = (): number => Math.trunc(Math.random() * MAX_SEED_VALUE);

function LineSeedField({ lineId }: Readonly<{ lineId: string }>) {
  const seed = useScriptStore((state) => state.script.linesById[lineId].seed);
  const [prevSeed, setPrevSeed] = useState(seed);
  const [value, setValue] = useState(String(seed));

  if (seed !== prevSeed) {
    setPrevSeed(seed);
    setValue(String(seed));
  }

  const errors = validateSeed(value);

  return (
    <Field className='flex-1 min-w-50'>
      <FieldLabel>シード</FieldLabel>
      <ButtonGroup>
        <Input
          placeholder='例: 123'
          type='number'
          min={MIN_SEED_VALUE}
          max={MAX_SEED_VALUE}
          step={1}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
          }}
          onBlur={() => {
            if (errors) return;
            useScriptStore.getState().updateLineField(lineId, 'seed', Number.parseInt(value, 10));
          }}
          aria-invalid={!!errors}
        />
        <Button
          title='ランダムなシード値を生成'
          variant='outline'
          onClick={() => {
            useScriptStore.getState().updateLineField(lineId, 'seed', getRandomSeed());
          }}
        >
          <Dices />
        </Button>
      </ButtonGroup>
      <FieldError errors={errors} />
    </Field>
  );
}

function LineAudioFileField({ lineId }: Readonly<{ lineId: string }>) {
  const file = useScriptStore((state) => state.script.linesById[lineId].file ?? '');

  return (
    <Field className='flex-3 min-w-90'>
      <FieldLabel>ファイル名</FieldLabel>
      <InputGroup>
        <InputGroupInput
          placeholder='例: output.wav'
          key={file}
          defaultValue={file}
          onBlur={(e) => {
            useScriptStore.getState().updateLineField(lineId, 'file', e.target.value || null);
          }}
        />
        <InputGroupAddon align='inline-end'>
          {/* 入力クリアボタン */}
          <InputGroupButton
            size='icon-sm'
            onClick={() => {
              useScriptStore.getState().updateLineField(lineId, 'file', null);
            }}
          >
            <X />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </Field>
  );
}

function LineAudio({ lineId }: Readonly<{ lineId: string }>) {
  const file = useScriptStore((state) => state.script.linesById[lineId].file);

  return (
    <audio
      src={file ? `/output/${file}` : undefined}
      controls
      preload='metadata'
      className={cn(
        'ml-auto h-8 flex-1 min-w-60 max-w-90',
        !file && 'invisible',
      )}
    />
  );
}

type LineEditorProps = {
  lineId: string;
  index: number;
  voicesDatalistId: string;
};

const LineEditor = memo(function LineEditor({ lineId, index, voicesDatalistId }: Readonly<LineEditorProps>) {
  const containerRef = useRef<HTMLDivElement>(null);

  const { ref: sortableRef, handleRef, isDragging } = useSortable({ id: lineId, index });

  // グローバル開閉状態
  const isAllExpanded = useLinesExpandStore((state) => state.isExpanded);

  // 前回のグローバル開閉状態
  const [isPrevAllExpanded, setIsPrevAllExpanded] = useState(isAllExpanded);

  // ローカル開閉状態
  const [isExpanded, setIsExpanded] = useState(isAllExpanded);

  // ローカル開閉状態を優先させるため、グローバル開閉状態が前回から変化した場合にのみ、ローカル開閉状態に同期する。
  if (isAllExpanded !== isPrevAllExpanded) {
    setIsExpanded(isAllExpanded);
    setIsPrevAllExpanded(isAllExpanded);
  }

  const [isFocused, setIsFocused] = useState(false);

  useKeyBind({ keys: 'Ctrl+Shift+ArrowUp', disabled: !isFocused, action: () => moveUpLine(lineId) });
  useKeyBind({ keys: 'Ctrl+Shift+ArrowDown', disabled: !isFocused, action: () => moveDownLine(lineId) });

  const insertLine = useScriptStore((state) => state.insertLine);
  const moveUpLine = useScriptStore((state) => state.moveUpLine);
  const moveDownLine = useScriptStore((state) => state.moveDownLine);
  const deleteLine = useScriptStore((state) => state.deleteLine);

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = (e: FocusEvent) => {
    // フォーカス先が子要素の場合、無視する。
    if (containerRef.current?.contains(e.relatedTarget)) return;
    setIsFocused(false);
  };

  return (
    <div
      ref={(e) => {
        containerRef.current = e;
        sortableRef(e);
      }}
      tabIndex={0} // フォーカス可能にする。
      className={cn(
        'p-2 flex gap-2 items-center [&:has(+_*)]:border-b bg-background content-auto',
        // 子要素を含むフォーカス時にアウトラインを付ける。
        !isDragging && isFocused && 'outline-3 outline-primary/30 border-transparent',
        // ドラッグ時に影を付ける。
        isDragging && 'drag-preview',
      )}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      <div
        ref={handleRef}
        title='ドラッグ＆ドロップで移動'
        className='min-w-10 max-w-fit flex-1 self-stretch flex items-center'
      >
        <span className='mr-0.5'>#</span>
        <span>{index + 1}</span>
      </div>

      <div className='flex-1 flex flex-col gap-2'>
        <div className='flex flex-wrap items-center gap-2'>
          <LineVoiceField lineId={lineId} datalistId={voicesDatalistId} />
          <LineTextField lineId={lineId} />
        </div>

        <div className='flex gap-4'>
          <ButtonGroup>
            <Button
              size='icon'
              variant='outline'
              title='上へ移動'
              onClick={() => moveUpLine(lineId)}
            >
              <ArrowUp />
            </Button>
            <Button
              size='icon'
              variant='outline'
              title='下へ移動'
              onClick={() => moveDownLine(lineId)}
            >
              <ArrowDown />
            </Button>
          </ButtonGroup>
          <Button
            size='icon'
            variant='outline'
            title='台詞を追加'
            onClick={() => insertLine(lineId)}
          >
            <Plus />
          </Button>
          <Button
            size='icon'
            variant='outline'
            title='台詞を削除'
            onClick={() => deleteLine(lineId)}
          >
            <Trash2 />
          </Button>
          <Button
            size='icon'
            variant='outline'
            title={`詳細設定を${isExpanded ? '閉じる' : '開く'}`}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
          </Button>

          <LineAudio lineId={lineId} />
        </div>

        {isExpanded && (
          <div className='p-3 flex flex-col gap-2 border rounded-lg'>
            <div>詳細設定</div>
            <div className='flex flex-wrap gap-2'>
              <LineSpeedField lineId={lineId} />
              <LineSeedField lineId={lineId} />
              <LineAudioFileField lineId={lineId} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export function LinesEditor() {
  const lineIds = useScriptStore((state) => state.script.lineIds);
  const voicesDatalistId = useId();

  const insertLine = useScriptStore((state) => state.insertLine);
  const moveLine = useScriptStore((state) => state.moveLine);

  return (
    <div className='p-2 flex flex-col gap-2'>
      <VoicesDatalist id={voicesDatalistId} />

      <div className='flex flex-col'>
        <DragDropProvider
          onDragEnd={(event) => {
            if (event.canceled) return;

            const { source } = event.operation;

            if (!isSortable(source) || source.initialIndex === source.index) return;

            moveLine(source.initialIndex, source.index);
          }}
        >
          {lineIds.map((lineId, index) => (
            <LineEditor
              key={lineId}
              lineId={lineId}
              index={index}
              voicesDatalistId={voicesDatalistId}
            />
          ))}
        </DragDropProvider>
      </div>

      <Button variant='secondary' onClick={() => insertLine()}>
        <Plus data-icon='inline-start' />
        台詞を追加
      </Button>
    </div>
  );
}
