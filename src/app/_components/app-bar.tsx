'use client';

import { ChevronDownIcon, ChevronUpIcon, EllipsisVertical, Moon, Redo, Sun, Undo } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { useActiveTab } from '@/stores/active-tab-store';
import { useCommandPaletteStore } from '@/stores/commands-palette-store';
import { useLinesExpandStore } from '@/stores/lines-expand-store';
import { useScriptStore } from '@/stores/script-store';

function ThemeButton() {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <Button size='icon' variant='ghost' title='テーマを切り替える' onClick={toggleTheme}>
      {resolvedTheme === 'dark' ? <Moon /> : <Sun />}
    </Button>
  );
}

function UndoRedoButton() {
  const [disabledUndo, setDisabledUndo] = useState(!useScriptStore.temporal.getState().pastStates.length);
  const [disabledRedo, setDisabledRedo] = useState(!useScriptStore.temporal.getState().futureStates.length);

  useEffect(() => {
    const unsubscribe = useScriptStore.temporal.subscribe((state) => {
      setDisabledUndo(!state.pastStates.length);
      setDisabledRedo(!state.futureStates.length);
    });
    return () => unsubscribe();
  }, []);

  return (
    <>
      <Button
        title='元に戻す'
        size='icon'
        variant='ghost'
        onClick={() => {
          useScriptStore.temporal.getState().undo();
        }}
        disabled={disabledUndo}
      >
        <Undo />
      </Button>
      <Button
        title='やり直す'
        size='icon'
        variant='ghost'
        onClick={() => {
          useScriptStore.temporal.getState().redo();
        }}
        disabled={disabledRedo}
      >
        <Redo />
      </Button>
    </>
  );
}

// 台詞一覧の詳細設定を一括で開閉するボタン
const LinesExpandToggleButton = () => {
  const isExpanded = useLinesExpandStore((state) => state.isExpanded);
  const toggleExpand = useLinesExpandStore((state) => state.toggleExpand);

  return (
    <Button
      size='icon'
      variant='ghost'
      title={isExpanded ? 'すべての詳細設定を閉じる' : 'すべての詳細設定を開く'}
      onClick={() => toggleExpand()}
    >
      {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
    </Button>
  );
};

function OpenCommandPaletteButton() {
  const setOpen = useCommandPaletteStore((state) => state.setOpen);

  return (
    <Button size='icon' variant='ghost' onClick={() => setOpen(true)}>
      <EllipsisVertical />
    </Button>
  );
}

export function AppBar() {
  const activeTab = useActiveTab((state) => state.activeTab);

  return (
    <div className='px-2 py-1 flex items-center justify-between bg-primary text-primary-foreground'>
      <div className='flex items-center gap-2'>
        <h1 className='text-xl font-bold tracking-wide'>vosed</h1>
      </div>

      <div className='flex gap-1'>
        {activeTab === 'lines' && <LinesExpandToggleButton />}
        <UndoRedoButton />
        <ThemeButton />
        <OpenCommandPaletteButton />
      </div>
    </div>
  );
}
