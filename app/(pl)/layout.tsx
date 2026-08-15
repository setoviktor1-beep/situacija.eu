import type { Metadata } from 'next';
import { RootHtml } from '@/components/site/RootHtml';
import { SITE_URL } from '@/content/site';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <RootHtml locale="pl">{children}</RootHtml>;
}
