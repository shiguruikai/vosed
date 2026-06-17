import path from 'node:path';

import { NextResponse } from 'next/server';

import { getSettings } from '@/lib/env.server';
import { createFileStreamResponse, withErrorHandler } from '@/lib/utils.server';

/**
 * 出力フォルダから対象のファイルを取得して返す。
 */
export const GET = withErrorHandler(async (request, ctx: RouteContext<'/output/[...filePath]'>) => {
  const { filePath } = await ctx.params;

  const { outputDir } = getSettings();

  const targetPath = path.resolve(outputDir, ...filePath);

  // ディレクトリトラバーサル対策
  if (!targetPath.startsWith(outputDir)) {
    return new NextResponse(null, { status: 404 });
  }

  return createFileStreamResponse(targetPath, request);
});
