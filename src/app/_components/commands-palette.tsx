'use client';

import { CopyIcon, Download, Eraser, Moon, Redo, RotateCcwKey, Sun, Undo, Upload } from 'lucide-react';
import { useContext } from 'react';
import { useStore } from 'zustand';

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '@/components/ui/command';
import { Kbd, KbdGroup } from '@/components/ui/kbd';
import { useKeyBind } from '@/hooks/key-bind';
import { CommandConfig } from '@/stores/command-configs-store';
import { useCommandPaletteStore } from '@/stores/commands-palette-store';

import { CommandsContext } from './commands-provider';

const ICON_MAP = {
  CopyIcon,
  Download,
  Eraser,
  Moon,
  Redo,
  RotateCcwKey,
  Sun,
  Undo,
  Upload,
} as const;

type CommandLabelProps = Pick<CommandConfig, 'icon' | 'title' | 'shortcut'>;

function CommandLabel({ icon, title, shortcut }: Readonly<CommandLabelProps>) {
  const IconComponent = ICON_MAP[icon];
  return (
    <>
      <IconComponent />
      <span>{title}</span>
      {shortcut && (
        <CommandShortcut>
          <KbdGroup>
            {...shortcut.split('+').map((key, index) => (
              <>
                {!!index && <span>+</span>}
                <Kbd className='capitalize'>{key}</Kbd>
              </>
            ))}
          </KbdGroup>
        </CommandShortcut>
      )}
    </>
  );
}

export function CommandPalette() {
  const commandsStore = useContext(CommandsContext);
  if (!commandsStore) throw new Error('Missing CommandsContext');

  const commands = useStore(commandsStore, (state) => state.commands);

  const open = useCommandPaletteStore((state) => state.open);
  const setOpen = useCommandPaletteStore((state) => state.setOpen);

  useKeyBind({ keys: 'ctrl+shift+a', action: () => setOpen(true) });
  useKeyBind({ keys: 'ctrl+shift+p', action: () => setOpen(true) });

  // 非表示の場合は描画しない。
  if (!open) return null;

  const groupedCommands = [...Map.groupBy(Object.values(commands), (c) => c.category)];

  return (
    <CommandDialog
      title='コマンドパレット'
      description='実行するコマンドを検索します。'
      open={open}
      onOpenChange={setOpen}
      className='sm:max-w-xl' // デフォルトより横幅を広くする。
    >
      <Command>
        <CommandInput placeholder='コマンドを検索' />
        <CommandList>
          <CommandEmpty>検索結果が見つかりませんでした。</CommandEmpty>
          {groupedCommands.map(([category, commands]) => (
            <CommandGroup
              key={category}
              heading={category}
            >
              {commands.map((command) => (
                <CommandItem
                  key={command.id}
                  keywords={[command.id]}
                  onSelect={() => {
                    command.action();
                    setOpen(false);
                  }}
                >
                  <CommandLabel
                    icon={command.icon}
                    title={command.title}
                    shortcut={command.shortcut}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
