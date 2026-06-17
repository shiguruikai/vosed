import 'server-only';

import { getSettings } from '@/lib/env.server';
import { NormalizedLine } from '@/lib/schemas';
import { compareJapaneseNumeric } from '@/lib/utils';

export async function fetchTTS(line: NormalizedLine): Promise<ArrayBuffer> {
  const { ttsApiBaseUrl } = getSettings();
  const url = `${ttsApiBaseUrl}/v1/audio/speech`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'irodori-tts',
      input: line.text,
      voice: line.voice,
      speed: line.speed,
      response_format: 'wav',
      irodori: { seed: line.seed },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`TTS API Error (${response.status}): ${errorText}`);
  }

  return response.arrayBuffer();
}

export async function fetchVoices(): Promise<string[]> {
  const { ttsApiBaseUrl } = getSettings();

  const voicesUrl = `${ttsApiBaseUrl}/v1/audio/voices`;

  const response = await fetch(voicesUrl);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`TTS API Error (${response.status}): ${errorText}`);
  }

  const body: { data: { id: string }[] } = await response.json();
  const voices = body.data.map((item) => item.id).sort(compareJapaneseNumeric);
  return voices;
}
