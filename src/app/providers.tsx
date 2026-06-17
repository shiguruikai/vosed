import { ThemeProvider } from 'next-themes';
import { ReactNode } from 'react';

import { CommandsProvider } from './_components/commands-provider';

export function Providers({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <ThemeProvider
      attribute='class'
      defaultTheme='system'
      enableSystem
      disableTransitionOnChange
    >
      <CommandsProvider>
        {children}
      </CommandsProvider>
    </ThemeProvider>
  );
}
