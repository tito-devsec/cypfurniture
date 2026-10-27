import type { Metadata } from 'next';
import type { CSSProperties, ReactNode } from 'react';
import { Jost, Marcellus } from 'next/font/google';
import { AdminGate } from '@/components/admin/admin-gate';
import './globals.css';

const marcellus = Marcellus({ weight: '400', subsets: ['latin'], display: 'swap' });
const jost = Jost({ subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'CYP Admin', template: '%s · CYP Admin' },
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const fontVars = { '--font-display-family': marcellus.style.fontFamily, '--font-body-family': jost.style.fontFamily } as CSSProperties;
  return (
    <html lang="en" className="h-full" style={fontVars}>
      <body className="flex min-h-full flex-col">
        <AdminGate>{children}</AdminGate>
      </body>
    </html>
  );
}
