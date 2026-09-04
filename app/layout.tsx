import type { Metadata } from 'next';
import './globals.css';
import PwaRegister from './pwa-register';

export const metadata: Metadata = {
  title: 'Together Forever | PMA 56 Long Course',
  description: 'Together Forever — Brotherhood Forged, Legacy Eternal',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/tf-icon.svg', apple: '/tf-icon.svg' },
  themeColor: '#06150d',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body><PwaRegister/>{children}</body>
    </html>
  );
}
