import { Separator } from '@/components/ui/separator';

import { AppBar } from './_components/app-bar';
import { FullAudio } from './_components/full-audio';
import { LogViewer } from './_components/log-viewer';
import { MainTabs } from './_components/main-tabs';

export default function Home() {
  return (
    <div className='w-full h-full flex flex-col'>
      <AppBar />

      <MainTabs />

      <Separator />

      <div className='flex flex-col md:flex-row'>
        <LogViewer className='flex-3 min-w-80 h-30 min-h-30 max-h-30 md:h-40 md:min-h-40 md:max-h-40' />

        {/* 区切り線 */}
        <div className='min-h-px min-w-px shrink-0 bg-border' />

        <FullAudio className='flex-1 min-w-80' />
      </div>
    </div>
  );
}
