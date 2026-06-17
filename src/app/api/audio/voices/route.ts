import { NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/utils.server';

import { fetchVoices } from '../../../../lib/api.server';

export const GET = withErrorHandler(async () => {
  const voices = await fetchVoices();
  return NextResponse.json({ voices });
});
