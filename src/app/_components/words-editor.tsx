'use client';

import { Plus, SortAsc, Trash2 } from 'lucide-react';
import { memo } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Word } from '@/lib/schemas';
import { useScriptStore } from '@/stores/script-store';

function WordCell({ wordId, word }: Readonly<{ wordId: string; word: string }>) {
  return (
    <TableCell>
      <Input
        key={word}
        defaultValue={word}
        onBlur={(e) => useScriptStore.getState().updateWordField(wordId, 'word', e.target.value)}
      />
    </TableCell>
  );
}

function ReadingCell({ wordId, reading }: Readonly<{ wordId: string; reading: string }>) {
  return (
    <TableCell>
      <Input
        key={reading}
        defaultValue={reading}
        onBlur={(e) => useScriptStore.getState().updateWordField(wordId, 'reading', e.target.value)}
      />
    </TableCell>
  );
}

function ActionsCell({ wordId }: Readonly<{ wordId: string }>) {
  return (
    <TableCell className='flex justify-center gap-4'>
      <Button
        size='icon'
        variant='outline'
        onClick={() => useScriptStore.getState().deleteWord(wordId)}
      >
        <Trash2 />
      </Button>
    </TableCell>
  );
}

const WordEditor = memo(function WordEditor({ word }: Readonly<{ word: Word }>) {
  return (
    <TableRow>
      <WordCell wordId={word.id} word={word.word} />
      <ReadingCell wordId={word.id} reading={word.reading} />
      <ActionsCell wordId={word.id} />
    </TableRow>
  );
});

export function WordsEditor() {
  const words = useScriptStore((state) => state.script.words);

  const insertWord = useScriptStore((state) => state.insertWord);
  const sortWords = useScriptStore((state) => state.sortWords);

  return (
    <div className='p-2 flex flex-col gap-2'>
      <div className='flex items-center gap-4'>
        <Button title='単語を追加する' onClick={() => insertWord()}>
          <Plus data-icon='inline-start' />
          単語を追加
        </Button>

        <Button title='単語を昇順に並び替える' variant='outline' onClick={() => sortWords()}>
          <SortAsc data-icon='inline-start' />
          単語でソート
        </Button>
      </div>

      <Table>
        <TableCaption />
        <TableHeader>
          <TableRow>
            <TableHead>単語</TableHead>
            <TableHead>よみ</TableHead>
            <TableHead className='text-center'>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {words.map((word) => (
            <WordEditor key={word.id} word={word} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
