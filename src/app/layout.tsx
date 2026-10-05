import type { Metadata, Viewport } from 'next';
import { Inter, Outfit } from 'next/font/google';
import { DemoStoreProvider } from '../lib/demo-store';
import { SessionProvider } from '../lib/session';
import './globals.css';

const sans = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const display = Outfit({ subsets: ['latin'], variable: '--font-display', display: 'swap' });

export const metadata: Metadata = {
  title: 'Assign Home Solutions · Operations',
  description: 'Internal operations platform for Assign Home Solutions.'
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${display.variable} font-sans antialiased`}>
        <SessionProvider>
          <DemoStoreProvider>{children}</DemoStoreProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
