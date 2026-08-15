import type { Metadata } from 'next';
import { GoogleAnalytics } from '@next/third-parties/google';
import './globals.css';
import { getGlobals } from '@/lib/directus';

export const metadata: Metadata = {
  metadataBase: new URL('https://situacija.eu'),
  title: { default: 'Situacija.eu', template: '%s | Situacija.eu' },
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    shortcut: '/icon.svg',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const globals = await getGlobals();
  const gaId = globals.google_analytics_id || 'G-MNR63Y36VB';
  return <html lang="lt"><body>{children}</body>{gaId ? <GoogleAnalytics gaId={gaId} /> : null}</html>;
}
