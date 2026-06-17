'use client';

import { Editor, EditorProps, OnMount } from '@monaco-editor/react';
import { Check, Copy, Download, Maximize } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { saveAsYamlFile } from '@/lib/utils.client';
import { useLogs } from '@/stores/logs-store';
import { useScriptStore } from '@/stores/script-store';

export function YamlEditor() {
  const { resolvedTheme } = useTheme();
  const [isDragging, setIsDragging] = useState(false);
  const editorRef = useRef<Parameters<OnMount>[0]>(null);

  const script = useScriptStore((state) => state.script);
  const filename = useScriptStore((state) => state.filename);

  const addLog = useLogs((state) => state.addLog);
  const setFilename = useScriptStore((state) => state.setFilename);
  const loadYaml = useScriptStore((state) => state.loadYaml);

  useEffect(() => {
    if (!editorRef.current) return;
    editorRef.current.setValue(useScriptStore.getState().getYaml());
  }, [script]);

  const handleEditorDidMount: EditorProps['onMount'] = (editor) => {
    editorRef.current = editor;

    // 初期値をセット
    editor.setValue(useScriptStore.getState().getYaml());

    const domNode = editor.getDomNode();
    if (!domNode) return;

    // ドラッグ中のデフォルト挙動（ブラウザでのファイル開き）を禁止
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    // エディタの上にファイルが乗った時
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    };

    // エディタから外に外れた時
    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // 移動先の要素がエディタの外側の場合
      if (!domNode.contains(e.relatedTarget as Node | null)) {
        setIsDragging(false);
      }
    };

    // ファイルがドロップされた時
    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer?.files;
      if (!files?.length) return;

      const file = files[0];

      setFilename(file.name);

      const content = await file.text();
      editor.setValue(content);

      addLog('info', `ファイル ${file.name} の内容をエディタに入力しました。`);

      loadYamlFromEditor();
    };

    // イベントリスナーの登録
    domNode.addEventListener('dragover', handleDragOver);
    domNode.addEventListener('dragenter', handleDragEnter);
    domNode.addEventListener('dragleave', handleDragLeave);
    domNode.addEventListener('drop', handleDrop);

    // コンポーネント破棄時のクリーンアップ
    editor.onDidDispose(() => {
      domNode.removeEventListener('dragover', handleDragOver);
      domNode.removeEventListener('dragenter', handleDragEnter);
      domNode.removeEventListener('dragleave', handleDragLeave);
      domNode.removeEventListener('drop', handleDrop);
    });
  };

  const loadYamlFromEditor = () => {
    if (!editorRef.current) return;

    try {
      loadYaml(editorRef.current.getValue());
      addLog('info', 'エディタの内容を読み込みました。');
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      addLog('error', `エディタの内容の読み込みに失敗しました。: ${message}`);
    }
  };

  const copyToClipboard = async () => {
    if (!editorRef.current) return;

    await navigator.clipboard.writeText(editorRef.current.getValue());
    addLog('info', 'クリップボードにコピーしました。');
  };

  const downloadFile = () => {
    if (!editorRef.current) return;

    const value = editorRef.current.getValue();
    if (!value) return;

    saveAsYamlFile(value, filename);
  };

  const toggleFullscreen = () => {
    const editor = editorRef.current;
    if (!editor) return;

    const domNode = editor.getDomNode();
    if (!domNode) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      domNode.parentElement?.requestFullscreen().then(() => {
        editor.layout();
      });
    }
  };

  return (
    <div className='min-h-40 w-full h-full flex flex-col'>
      <div className='min-h-0 w-full h-full relative'>
        <Editor
          language='yaml'
          theme={resolvedTheme === 'dark' ? 'vs-dark' : 'vs'}
          options={{
            dragAndDrop: false,
            fontFamily: 'var(--font-mono)',
            minimap: { enabled: false },
            mouseWheelZoom: true,
            scrollBeyondLastLine: false,
            wordWrap: 'on',
          }}
          onMount={handleEditorDidMount}
          className='w-full h-full'
        />

        <div
          className={cn(
            'absolute inset-0 z-100 bg-foreground/20 flex items-center justify-center pointer-events-none transition-all duration-100',
            isDragging ? 'opacity-100 visible' : 'opacity-0 invisible',
          )}
        >
          <p className='p-2 bg-foreground text-background font-bold rounded-lg'>ここにファイルをドロップ</p>
        </div>
      </div>

      <div className='p-2 flex flex-wrap items-center gap-x-4 gap-y-2'>
        <Button onClick={loadYamlFromEditor} className='flex-3 min-w-50'>
          <Check data-icon='inline-start' />
          エディタの内容を読み込む
        </Button>

        <ButtonGroup className='flex-1'>
          <Input
            placeholder='ファイル名'
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            className='min-w-30'
          />
          <Button
            title='ファイルとしてダウンロード'
            size='icon'
            variant='outline'
            onClick={downloadFile}
          >
            <Download />
          </Button>
          <Button
            title='クリップボードにコピー'
            size='icon'
            variant='outline'
            onClick={copyToClipboard}
          >
            <Copy />
          </Button>
          <Button
            title='全画面で編集'
            size='icon'
            variant='outline'
            onClick={toggleFullscreen}
          >
            <Maximize />
          </Button>
        </ButtonGroup>
      </div>
    </div>
  );
}
