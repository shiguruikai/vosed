'use client';

import { ComponentPropsWithoutRef, useEffect, useRef } from 'react';

import { cn } from '@/lib/utils';
import { Log, useLogs } from '@/stores/logs-store';

function LogEntry({ log }: Readonly<{ log: Log }>) {
  return (
    <div className='text-sm font-mono leading-[1.2] wrap-anywhere break-all'>
      <span>{`[${log.time}]`}</span>
      <span
        className={cn(
          'mx-1 inline-block w-[5ch] uppercase',
          log.level === 'info' && 'text-sidebar-primary',
          log.level === 'error' && 'text-destructive',
        )}
      >
        {log.level}
      </span>
      <span>
        {log.message}
      </span>
    </div>
  );
}

export function LogViewer({ className, ...props }: Readonly<ComponentPropsWithoutRef<'div'>>) {
  const logs = useLogs((state) => state.logs);
  const logEndRef = useRef<HTMLDivElement>(null);

  // ログの自動スクロール
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div
      className={cn(
        'flex flex-col',
        className,
      )}
      {...props}
    >
      <div className='px-2 py-0.5 bg-sidebar border-b text-sm'>ログ</div>
      <div
        className='p-2 flex flex-col gap-0.5 overflow-y-auto'

      >
        {logs.map((log) => (
          <LogEntry key={log.logId} log={log} />
        ))}
        <div ref={logEndRef} />
      </div>
    </div>
  );
}
