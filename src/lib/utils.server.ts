import 'server-only';

import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';

import mime from 'mime-types';
import { NextRequest, NextResponse } from 'next/server';

import { ErrorResponseBody } from '@/lib/schemas';

export function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return Error.isError(error) && ('errno' in error || 'code' in error || 'path' in error || 'syscall' in error);
}

export type RouteHandler = (request: NextRequest, ctx: RouteContext<any>) => Promise<NextResponse>;

export function iteratorToStream<T extends Uint8Array>(iterator: AsyncIterator<T>): ReadableStream<T> {
  return new ReadableStream<T>({
    async pull(controller) {
      try {
        const { value, done } = await iterator.next();
        if (done) {
          controller.close();
        } else {
          controller.enqueue(value);
        }
      } catch (e) {
        controller.error(e);
      }
    },

    async cancel() {
      await iterator.return?.();
    },
  });
}

/**
 *  RFC 9457 の仕様に従ったエラーレスポンスを返す。
 */
export function createErrorResponse(
  body: ErrorResponseBody,
  init?: Omit<NonNullable<Parameters<typeof NextResponse.json>[1]>, 'status'>,
): NextResponse<ErrorResponseBody> {
  const response = NextResponse.json(body, { ...init, status: body.status });
  response.headers.set('content-type', 'application/problem+json');
  return response;
}

export function withErrorHandler(handler: RouteHandler): RouteHandler {
  return async (request: NextRequest, ctx) => {
    try {
      return await handler(request, ctx);
    } catch (e) {
      console.error('An unexpected error occurred:', e);
      return createErrorResponse({
        status: 500,
        title: 'Internal Server Error',
        detail: 'An unexpected error occurred.',
        instance: request.url,
        errors: [e instanceof Error ? e.message : String(e)],
      });
    }
  };
}

/**
 * Server-Sent Events の仕様に従ったレスポンスを返す。
 */
export function withSSE<T>(handler: (request: NextRequest) => AsyncIterator<T>): RouteHandler {
  return async (request) => {
    const iterator = handler(request);
    const encoder = new TextEncoder();

    async function* dataGenerator(): AsyncGenerator<Uint8Array> {
      try {
        while (true) {
          const { value, done } = await iterator.next();
          if (done) return;
          yield encoder.encode(`data: ${JSON.stringify(value)}\n\n`);
        }
      } catch (e) {
        console.error('An unexpected error occurred during SSE stream:', e);

        const data = {
          status: 500,
          title: 'Internal Server Error',
          detail: 'An unexpected error occurred while streaming data.',
          instance: request.url,
          errors: [e instanceof Error ? e.message : String(e)],
        };

        yield encoder.encode('event: error\n');
        yield encoder.encode(`data: ${JSON.stringify(data)}\n\n`);
      }
    }

    const generator = dataGenerator();
    const stream = iteratorToStream(generator);

    return new NextResponse(stream, {
      headers: {
        'content-type': 'text/event-stream',
        // ブラウザやプロキシサーバーなどに対して、キャッシュしないように要求する。
        // リバースプロキシなどに対して、圧縮等を勝手にしないことを要求する。
        'cache-control': 'no-cache, no-transform',
        // TCP接続を維持するように要求する。
        'connection': 'keep-alive',
        // nginxなどのリバースプロキシに対して、レスポンスデータのバッファリングをしないように要求する。
        'x-accel-buffering': 'no',
      },
    });
  };
}

export type RangeParseResult
  = | { type: 'satisfiable'; start: number; end: number }
    | { type: 'invalid' }
    | { type: 'unsatisfiable' };

export function parseRange(header: string, size: number): RangeParseResult {
  if (!Number.isSafeInteger(size) || size < 0) return { type: 'invalid' };

  if (!header.startsWith('bytes=')) return { type: 'invalid' };

  // 複数範囲はサポートしない (RFC 9110 非準拠)
  if (header.includes(',')) return { type: 'invalid' };

  const parts = header.slice(6).split('-');

  if (parts.length !== 2) return { type: 'invalid' };

  const startStr = parts[0].trim();
  const endStr = parts[1].trim();

  if (!startStr && !endStr) return { type: 'invalid' };

  const digitsRegex = /^\d+$/;
  if (startStr && !digitsRegex.test(startStr)) return { type: 'invalid' };
  if (endStr && !digitsRegex.test(endStr)) return { type: 'invalid' };

  let start = startStr ? Number.parseInt(startStr, 10) : -1;
  let end = endStr ? Number.parseInt(endStr, 10) : -1;

  if (startStr && !endStr) {
    // 例: bytes=500- (末尾まで)
    end = size - 1;
  } else if (!startStr && endStr) {
    // 例: bytes=-500 (末尾からNバイト)
    start = Math.max(0, size - end);
    end = size - 1;
  }

  // 範囲が矛盾している場合
  if (start > end) return { type: 'invalid' };

  // start がファイルサイズを超えている場合、416 Range Not Satisfiable の対象
  if (start >= size) return { type: 'unsatisfiable' };

  // end がファイルサイズを超えている場合、ファイルサイズ内に収める。
  if (end >= size) {
    end = size - 1;
  }

  return { type: 'satisfiable', start, end };
}

/**
 * ファイルのデータストリームをレスポンスで返す。
 * 引数で指定した`request`にRangeヘッダーがある場合、HTTP Range Requestsの仕様に従ったレスポンスを返す。
 */
export async function createFileStreamResponse(filePath: string, request?: NextRequest): Promise<NextResponse> {
  try {
    // メタデータの取得とMIMEタイプの動的決定
    const stat = await fs.stat(filePath);
    const fileSize = stat.size;
    const lastModified = stat.mtime.toUTCString();
    const contentType = mime.lookup(path.extname(filePath)) || 'application/octet-stream';

    const responseHeaders: Record<string, string> = {
      'Accept-Ranges': 'bytes',
      'Content-Type': contentType,
      'Last-Modified': lastModified,
    };

    const range = request?.headers?.get('range');
    const parseResult = range ? parseRange(range, fileSize) : null;

    // Rangeヘッダーがない、または、正常にパースできなかった場合、200 OK で全データを返す。
    if (!parseResult || parseResult.type === 'invalid') {
      const stream = Readable.toWeb(createReadStream(filePath)) as ReadableStream;
      return new NextResponse(stream, {
        status: 200,
        headers: {
          ...responseHeaders,
          'Content-Length': `${fileSize}`,
        },
      });
    }

    // Rangeヘッダー指定されたファイルサイズの範囲外の場合、416 Range Not Satisfiable を返す。
    if (parseResult.type === 'unsatisfiable') {
      return createErrorResponse({
        status: 416,
        title: 'Requested Range Not Satisfiable',
        detail: 'Invalid range of request headers.',
      }, {
        headers: {
          'Accept-Ranges': 'bytes',
          'Content-Range': `bytes */${fileSize}`,
        },
      });
    }

    const { start, end } = parseResult;
    const chunkSize = end - start + 1;

    // 該当範囲のみのストリームを作成し、206 Partial Content を返す。
    const stream = Readable.toWeb(createReadStream(filePath, { start, end })) as ReadableStream;
    return new NextResponse(stream, {
      status: 206,
      headers: {
        ...responseHeaders,
        'Content-Length': `${chunkSize}`,
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      },
    });
  } catch (e) {
    // 以下のいずれかに該当する場合、404 Not Found を返す。
    // ・ファイルが存在しない
    // ・アクセス権限がない
    // ・ファイルではなくディレクトリだった
    if (isNodeError(e) && (e.code === 'ENOENT' || e.code === 'EACCES' || e.code === 'EISDIR')) {
      return new NextResponse(null, { status: 404 });
    }

    throw e;
  }
}
