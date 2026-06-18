import { z } from 'zod';

export const JsonStringSchema = z.string().transform((str, ctx) => {
  try {
    return JSON.parse(str);
  } catch {
    ctx.addIssue({
      code: 'custom',
      message: 'Invalid JSON',
    });
    return z.NEVER;
  }
});

export const WordSchema = z.object({
  id: z.preprocess(() => crypto.randomUUID(), z.string().default('')),
  word: z.coerce.string().default(''),
  reading: z.coerce.string().default(''),
});

export const LineSchema = z.object({
  id: z.preprocess(
    (v) => v === '' ? undefined : v,
    z.coerce.string().default(() => crypto.randomUUID()),
  ),
  voice: z.coerce.string().default(''),
  text: z.coerce.string().default(''),
  speed: z.coerce.number().default(1),
  seed: z.coerce.number().default(-1),
  file: z.coerce.string().nullable().default(null),
});

export const ScriptSchema = z.object({
  words: z.array(WordSchema).default([]),
  lines: z.array(LineSchema).default([]),
});

export const LineAudioRequestSchema = z.object({
  id: z.string().optional().default(() => crypto.randomUUID()),
  voice: z.string().min(1),
  text: z.string().min(1),
  speed: z.number().min(0.25).max(4).default(1),
  seed: z.number().min(-1).max(Number.MAX_SAFE_INTEGER).default(-1),
  words: z.array(WordSchema).default([]),
});

export const FullAudioRequestSchema = z.object({
  lines: z.array(LineSchema),
  words: z.array(WordSchema).default([]),
  file: z.string(),
});

export const ErrorResponseBodySchema = z.object({
  type: z.string().optional(),
  status: z.number(),
  title: z.string(),
  detail: z.string(),
  instance: z.string().optional(),
  errors: z.array(z.json()).optional(),
});

export type Word = z.infer<typeof WordSchema>;
export type Line = z.infer<typeof LineSchema>;
export type Script = z.infer<typeof ScriptSchema>;
export type LineAudioRequest = z.infer<typeof LineAudioRequestSchema>;
export type LineAudioRequestInput = z.input<typeof LineAudioRequestSchema>;
export type FullAudioRequest = z.infer<typeof FullAudioRequestSchema>;
export type FullAudioRequestInput = z.input<typeof FullAudioRequestSchema>;
export type ErrorResponseBody = z.infer<typeof ErrorResponseBodySchema>;

export type NormalizedLine = {
  id: string;
  voice: string;
  text: string;
  speed: number;
  seed: number;
  file: string;
};

export type LineAudioResponse = {
  file: string;
};

export type FullAudioSSEDataInfo = {
  status: 'info';
  message: string;
};

export type FullAudioSSEDataProgress = {
  status: 'progress';
  message: string;
  id: string;
  file: string;
};

export type FullAudioSSEDataSuccess = {
  status: 'success';
  message: string;
  file: string;
};

export type FullAudioSSEDataError = {
  status: 'error';
  message: string;
};

export type FullAudioSSEData
  = | FullAudioSSEDataInfo
    | FullAudioSSEDataProgress
    | FullAudioSSEDataSuccess
    | FullAudioSSEDataError;
