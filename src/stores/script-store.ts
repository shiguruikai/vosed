import yaml from 'js-yaml';
import { temporal } from 'zundo';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import { Line, Script, ScriptSchema, Word } from '@/lib/schemas';
import { compareJapaneseNumeric } from '@/lib/utils';

type ScriptState = Readonly<{
  filename: string;
  script: Readonly<{
    words: Readonly<Word>[];
    lineIds: string[];
    linesById: Readonly<Record<string, Readonly<Line>>>;
  }>;

  setFilename: (filename: string) => void;
  setScript: (script: Script) => void;
  loadYaml: (content: string) => void;
  getYaml: () => string;
  getYamlWithoutId: () => string;
  getScript: () => Script;
  updateLineField: <K extends keyof Line>(id: string, field: K, value: Line[K]) => void;
  insertLine: (id?: string, line?: Line) => void;
  deleteLine: (id: string) => void;
  moveUpLine: (id: string) => void;
  moveDownLine: (id: string) => void;
  resetAllLineIds: () => void;
  removeAllLineFiles: () => void;
  updateWordField: <K extends keyof Word>(index: number, field: K, value: Word[K]) => void;
  insertWord: (index?: number, word?: Word) => void;
  deleteWord: (index: number) => void;
  sortWords: () => void;
}>;

// 履歴の最大保存数
const PAST_LIMIT = 100;

const createEmptyLine = (): Line => ({
  id: crypto.randomUUID(),
  voice: '',
  text: '',
  speed: 1,
  seed: -1,
  file: null,
});

const convertToYaml = (state: ScriptState, { excludeId }: { excludeId: boolean }) => {
  const lines = state.script.lineIds.map((id) => state.script.linesById[id]);

  const cleanLines = lines.map(({ id, voice, text, speed, seed, file }) => {
    return {
      ...(excludeId ? {} : { id }),
      voice,
      text,
      // 無効な速度および1（デフォルト値）は除外
      ...(Number.isFinite(speed) && speed != 1 ? { speed } : {}),
      // 無効なシード値および負の値は除外
      ...(Number.isFinite(seed) && seed >= 0 ? { seed } : {}),
      // 空のパスは除外
      ...(file ? { file } : {}),
    };
  });

  return yaml.dump(
    {
      words: state.script.words,
      lines: cleanLines,
    },
    {
      lineWidth: -1,
    },
  );
};

export const useScriptStore = create<ScriptState>()(
  temporal(immer((set, get) => ({
    filename: 'script.yaml',
    script: {
      words: [],
      lineIds: [],
      linesById: {},
    },

    setFilename: (filename) => set((state) => {
      state.filename = filename;
    }),

    setScript: (script) =>
      set((state) => {
        state.script.words = script.words;
        state.script.lineIds = script.lines.map((l) => l.id);
        state.script.linesById = Object.fromEntries(script.lines.map((l) => [l.id, l]));
      }),

    loadYaml: (content) => set((state) => {
      const loaded = yaml.load(content) as any;

      const parsed = ScriptSchema.safeParse({
        words: loaded?.words,
        lines: loaded?.lines,
      });

      if (parsed.error) {
        const issue = parsed.error.issues[0];
        throw new Error(`Invalid Yaml: [${issue.path}] ${issue.message}`);
      }

      const script = parsed.data;

      state.script.words = script.words;
      state.script.lineIds = script.lines.map((l) => l.id);
      state.script.linesById = Object.fromEntries(script.lines.map((l) => [l.id, l]));
    }),

    getYaml: () => {
      return convertToYaml(get(), { excludeId: false });
    },

    getYamlWithoutId: () => {
      return convertToYaml(get(), { excludeId: true });
    },

    getScript: () => {
      const state = get();
      return {
        words: state.script.words,
        lines: state.script.lineIds.map((id) => state.script.linesById[id]),
      };
    },

    updateLineField: (id, field, value) =>
      set((state) => {
        const line = state.script.linesById[id];
        line[field] = value;
      }),

    insertLine: (id, line) =>
      set((state) => {
        if (id === undefined) {
          line ??= createEmptyLine();
          state.script.lineIds.push(line.id);
          state.script.linesById[line.id] = line;
          return;
        }

        const index = state.script.lineIds.indexOf(id);
        if (index === -1) return;

        line ??= createEmptyLine();
        state.script.lineIds.splice(index + 1, 0, line.id);
        state.script.linesById[line.id] = line;
      }),

    deleteLine: (id) =>
      set((state) => {
        const index = state.script.lineIds.indexOf(id);
        if (index === -1) return;

        state.script.lineIds.splice(index, 1);
        delete state.script.linesById[id];
      }),

    moveUpLine: (id) =>
      set((state) => {
        const lineIds = state.script.lineIds;
        const index = lineIds.indexOf(id);
        if (index <= 0) return;

        [lineIds[index - 1], lineIds[index]] = [lineIds[index], lineIds[index - 1]];
      }),

    moveDownLine: (id) =>
      set((state) => {
        const lineIds = state.script.lineIds;
        const index = lineIds.indexOf(id);
        if (index === -1 || index >= lineIds.length - 1) return;

        [lineIds[index + 1], lineIds[index]] = [lineIds[index], lineIds[index + 1]];
      }),

    resetAllLineIds: () => set((state) => {
      state.script.lineIds = state.script.lineIds.map((id) => {
        const line = state.script.linesById[id];
        delete state.script.linesById[id];

        const newId = crypto.randomUUID();
        line.id = newId;
        state.script.linesById[newId] = line;
        return newId;
      });
    }),

    removeAllLineFiles: () => set((state) => {
      state.script.lineIds.forEach((id) => {
        state.script.linesById[id].file = null;
      });
    }),

    updateWordField: (index, field, value) =>
      set((state) => {
        state.script.words[index][field] = value;
      }),

    insertWord: (index, word) =>
      set((state) => {
        index ??= state.script.words.length - 1;
        word ??= { word: '', reading: '' };
        state.script.words.splice(index + 1, 0, word);
      }),

    deleteWord: (index) =>
      set((state) => {
        state.script.words.splice(index, 1);
      }),

    sortWords: () =>
      set((state) => {
        state.script.words.sort((a, b) => compareJapaneseNumeric(a.word, b.word));
      }),
  })),
  {
    limit: PAST_LIMIT,
  }),
);
