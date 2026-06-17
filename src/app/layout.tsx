import './globals.css';

import type { Metadata } from 'next';
import { ReactNode } from 'react';

import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'vosc',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang='ja' suppressHydrationWarning>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
