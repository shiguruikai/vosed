import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

const MAX_LOG_SIZE = 100;

export type LogLevel = 'info' | 'error';

export type Log = {
  logId: number;
  level: LogLevel;
  time: string;
  message: string;
};

export type LogsState = Readonly<{
  logs: Readonly<Log>[];
  addLog: (level: LogLevel, message: string) => void;
}>;

const zeroPad2 = (value: number) => String(value).padStart(2, '0');

let logId = 0;

export const useLogs = create<LogsState>()(
  immer((set) => ({
    logs: [],

    addLog: (level, message) =>
      set((state) => {
        const now = new Date();

        state.logs.push({
          logId: logId++,
          level,
          message,
          time: `${zeroPad2(now.getHours())}:${zeroPad2(now.getMinutes())}:${zeroPad2(now.getSeconds())}`,
        });

        if (state.logs.length > MAX_LOG_SIZE) {
          state.logs.shift();
        }
      }),
  })),
);
