'use client';

import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useActiveTab } from '@/stores/active-tab-store';
import { useScriptStore } from '@/stores/script-store';

import { LinesEditor } from './lines-editor';
import { WordsEditor } from './words-editor';
import { YamlEditor } from './yaml-editor';

export function MainTabs() {
  const activeTab = useActiveTab((state) => state.activeTab);
  const linesLength = useScriptStore((state) => state.script.lineIds.length);
  const wordsLength = useScriptStore((state) => state.script.words.length);
  const setActiveTab = useActiveTab((state) => state.setActiveTab);

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => setActiveTab(value)}
      className='h-full gap-0 overflow-hidden '
    >
      <TabsList variant='line' size='lg' className='w-full'>
        <TabsTrigger value='editor'>コードエディタ</TabsTrigger>
        <TabsTrigger value='lines'>{`台詞一覧 (${linesLength}件)`}</TabsTrigger>
        <TabsTrigger value='words'>{`読み替え辞書 (${wordsLength}件)`}</TabsTrigger>
      </TabsList>

      <Separator />

      <TabsContent value='editor' className='overflow-auto'>
        <YamlEditor />
      </TabsContent>

      <TabsContent value='lines' className='overflow-auto'>
        <LinesEditor />
      </TabsContent>
      <TabsContent value='words' className='overflow-auto w-full max-w-200 self-center-safe'>
        <WordsEditor />
      </TabsContent>
    </Tabs>
  );
}
