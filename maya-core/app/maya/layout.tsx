import type { ReactNode } from 'react';
import { Lora, IBM_Plex_Mono } from 'next/font/google';
import './maya.css';

const lora = Lora({
  subsets: ['latin'],
  variable: '--font-maya-serif',
  display: 'swap'
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-maya-mono',
  display: 'swap'
});

export default function MayaLayout({ children }: { children: ReactNode }) {
  return (
    <div className={[lora.variable, ibmPlexMono.variable, 'maya-scope'].join(' ')}>
      {children}
    </div>
  );
}
