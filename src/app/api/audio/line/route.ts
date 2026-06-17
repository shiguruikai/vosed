import { NextResponse } from 'next/server';

import { JsonStringSchema, LineAudioRequestSchema } from '@/lib/schemas';
import { createErrorResponse, withErrorHandler } from '@/lib/utils.server';

import { generateLineAudioFile, getOutputRelativeUrl, normalizeLines } from '../_lib/audio';

export const POST = withErrorHandler(async (request) => {
  const bodyText = await request.text();
  const parsed = JsonStringSchema.pipe(LineAudioRequestSchema).safeParse(bodyText);

  if (parsed.error) {
    return createErrorResponse({
      status: 400,
      title: 'Invalid Payload',
      detail: parsed.error.message,
      instance: request.url,
      errors: parsed.error.issues.map((issue) => issue.message),
    });
  }

  const line = normalizeLines(
    [
      {
        id: parsed.data.id,
        voice: parsed.data.voice,
        text: parsed.data.text,
        speed: parsed.data.speed,
        seed: parsed.data.seed,
      },
    ],
    parsed.data.words,
  )[0];

  line.file = await generateLineAudioFile(line);

  return NextResponse.json({ file: getOutputRelativeUrl(line.file) });
});
