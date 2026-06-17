import { createStore } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export const COMMAND_IDS = [
  'undo',
  'redo',
  'recreateAllLineIds',
  'removeAllLineFiles',
  'copyToClipboard',
  'copyToClipboardWithoutId',
  'openAndLoadYamlFile',
  'downloadYamlFile',
  'downloadYamlFileWithoutId',
  'changeToLightTheme',
  'changeToDarkTheme',
] as const;

export const COMMAND_CATEGORIES = [
  '編集',
  'ファイル',
  '操作',
  '見た目',
] as const;

export const COMMAND_ICONS = [
  'CopyIcon',
  'Download',
  'Eraser',
  'Moon',
  'Redo',
  'RotateCcwKey',
  'Sun',
  'Undo',
  'Upload',
] as const;

export type CommandId = typeof COMMAND_IDS[number];
export type CommandCategory = typeof COMMAND_CATEGORIES[number];
export type CommandIcon = typeof COMMAND_ICONS[number];

export type CommandConfig = {
  id: CommandId;
  category: CommandCategory;
  icon: CommandIcon;
  title: string;
  shortcut?: string;
  disabled?: boolean;
  action: () => void;
};

export type CommandConfigsProps = Readonly<{
  commands: Record<CommandId, Readonly<CommandConfig>>;
}>;

export type CommandConfigsState = Readonly<CommandConfigsProps & {
  enableCommand: (id: CommandId) => void;
  disableCommand: (id: CommandId) => void;
}>;

export type CommandConfigsStore = ReturnType<typeof createCommandConfigsStore>;

export const createCommandConfigsStore = (initProps: CommandConfigsProps) => {
  return createStore<CommandConfigsState>()(
    immer((set) => ({
      ...initProps,

      enableCommand: (id) =>
        set((state) => {
          state.commands[id].disabled = false;
        }),

      disableCommand: (id) =>
        set((state) => {
          state.commands[id].disabled = true;
        }),
    })),
  );
};
