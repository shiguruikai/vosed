import 'client-only';

import { FullAudioRequestInput, FullAudioSSEData, LineAudioRequestInput, LineAudioResponse } from './schemas';

async function handleError(response: Response) {
  if (response.ok) return;
  throw new Error(await response.text());
}

export async function fetchLineAudio(
  request: LineAudioRequestInput,
): Promise<LineAudioResponse> {
  const response = await fetch('/api/audio/line', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  await handleError(response);

  return await response.json();
}

export async function* fetchFullAudioEventDataStream(
  request: FullAudioRequestInput,
): AsyncGenerator<FullAudioSSEData> {
  const response = await fetch('/api/audio/full', {
    method: 'POST',
    headers: {
      'Accept': 'text/event-stream',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  await handleError(response);

  if (response.body === null) {
    throw new Error('null body');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;

      yield JSON.parse(line.slice(6));
    }
  }
}

export async function fetchVoices(): Promise<string[]> {
  const response = await fetch('/api/audio/voices');

  await handleError(response);

  return (await response.json()).voices;
}
