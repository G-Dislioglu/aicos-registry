import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';

import { LanguageProvider } from '@/components/language-provider';
import { MayaStateProvider } from '@/components/maya-state-provider';
import '@/app/globals.css';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  title: 'Maya',
  description: 'Persönliche Assistenz für textbasiertes Denken mit sichtbarem Kontext.',
  applicationName: 'Maya',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/icons/icon-192.svg',
    apple: '/icons/icon-192.svg'
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Maya'
  },
  formatDetection: {
    telephone: false
  }
};

export const viewport: Viewport = {
  themeColor: '#020617',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de">
      <body className={inter.className}>
        <LanguageProvider>
          <MayaStateProvider>{children}</MayaStateProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
