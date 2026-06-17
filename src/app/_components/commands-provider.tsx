'use client';

import { useTheme } from 'next-themes';
import { createContext, ReactNode, useState } from 'react';
import { useStore } from 'zustand';

import { useKeyBind, UseKeyBindProps } from '@/hooks/key-bind';
import { openYamlFileDialog, saveAsYamlFile } from '@/lib/utils.client';
import { useActiveTab } from '@/stores/active-tab-store';
import { CommandConfigsStore, createCommandConfigsStore } from '@/stores/command-configs-store';
import { useLogs } from '@/stores/logs-store';
import { useScriptStore } from '@/stores/script-store';

import { CommandPalette } from './commands-palette';

export const CommandsContext = createContext<CommandConfigsStore | null>(null);

function KeyBind(props: UseKeyBindProps) {
  useKeyBind(props);
  return null;
}

export function CommandsProvider({ children }: Readonly<{ children: ReactNode }>) {
  const { setTheme } = useTheme();
  const addLog = useLogs.getState().addLog;
  const setActiveTab = useActiveTab((state) => state.setActiveTab);

  useKeyBind({ keys: 'alt+1', action: () => setActiveTab('editor') });
  useKeyBind({ keys: 'alt+2', action: () => setActiveTab('lines') });
  useKeyBind({ keys: 'alt+3', action: () => setActiveTab('words') });

  const [commandsStore] = useState(() => createCommandConfigsStore({
    commands: {
      undo: {
        id: 'undo',
        category: '編集',
        icon: 'Undo',
        title: '元に戻す',
        shortcut: 'ctrl+z',
        action: () => {
          useScriptStore.temporal.getState().undo();
        },
      },
      redo: {
        id: 'redo',
        category: '編集',
        icon: 'Redo',
        title: 'やり直す',
        shortcut: 'ctrl+shift+z',
        action: () => {
          useScriptStore.temporal.getState().redo();
        },
      },
      recreateAllLineIds: {
        id: 'recreateAllLineIds',
        category: '編集',
        icon: 'RotateCcwKey',
        title: 'すべての台詞の「ID」を再作成',
        action: () => {
          useScriptStore.getState().resetAllLineIds();
          addLog('info', 'すべての台詞の「ID」を再作成しました。');
        },
      },
      removeAllLineFiles: {
        id: 'removeAllLineFiles',
        category: '編集',
        icon: 'Eraser',
        title: 'すべての台詞の「ファイル名」を削除',
        action: () => {
          useScriptStore.getState().removeAllLineFiles();
          addLog('info', 'すべての台詞の「ファイル名」を削除しました。');
        },
      },
      copyToClipboard: {
        id: 'copyToClipboard',
        category: '操作',
        icon: 'CopyIcon',
        title: '台本の内容をクリップボードにコピー',
        shortcut: 'ctrl+shift+c',
        action: async () => {
          await navigator.clipboard.writeText(useScriptStore.getState().getYaml());
        },
      },
      copyToClipboardWithoutId: {
        id: 'copyToClipboardWithoutId',
        category: '操作',
        icon: 'CopyIcon',
        title: '台本の内容をクリップボードにコピー（IDは除く）',
        shortcut: 'ctrl+shift+d',
        action: async () => {
          await navigator.clipboard.writeText(useScriptStore.getState().getYamlWithoutId());
        },
      },
      openAndLoadYamlFile: {
        id: 'openAndLoadYamlFile',
        category: 'ファイル',
        icon: 'Upload',
        title: '台本ファイルを選択して読み込む',
        shortcut: 'ctrl+o',
        action: async () => {
          const file = await openYamlFileDialog();
          if (!file) return;

          try {
            useScriptStore.getState().loadYaml(await file.text());
            addLog('info', `選択したファイル ${file.name} を正常に読み込みました。`);
            useScriptStore.getState().setFilename(file.name);
          } catch (e) {
            const message = e instanceof Error ? e.message : String(e);
            addLog('error', `選択したファイル ${file.name} の読み込みに失敗しました。${message}`);
          }
        },
      },
      downloadYamlFile: {
        id: 'downloadYamlFile',
        category: 'ファイル',
        icon: 'Download',
        title: '台本ファイルをダウンロード',
        shortcut: 'ctrl+s',
        action: async () => {
          const filename = useScriptStore.getState().filename;
          const content = useScriptStore.getState().getYaml();
          saveAsYamlFile(content, filename);
        },
      },
      downloadYamlFileWithoutId: {
        id: 'downloadYamlFileWithoutId',
        category: 'ファイル',
        icon: 'Download',
        title: '台本ファイルをダウンロード（IDは除く）',
        shortcut: 'ctrl+shift+s',
        action: async () => {
          const filename = useScriptStore.getState().filename;
          const content = useScriptStore.getState().getYamlWithoutId();
          saveAsYamlFile(content, filename);
        },
      },
      changeToLightTheme: {
        id: 'changeToLightTheme',
        category: '見た目',
        icon: 'Sun',
        title: 'ライトテーマに変更',
        action: () => {
          setTheme('light');
        },
      },
      changeToDarkTheme: {
        id: 'changeToDarkTheme',
        category: '見た目',
        icon: 'Moon',
        title: 'ダークテーマに変更',
        action: () => {
          setTheme('dark');
        },
      },
    },
  }));

  const commands = useStore(commandsStore, (state) => state.commands);

  return (
    <CommandsContext value={commandsStore}>
      {Object.entries(commands).map(([id, command]) => (
        (command.shortcut
          && (
            <KeyBind
              key={id}
              keys={command.shortcut}
              action={command.action}
              disabled={command.disabled}
            />
          ))
      ))}
      <CommandPalette />
      {children}
    </CommandsContext>
  );
}
