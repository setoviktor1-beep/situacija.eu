import { Inter } from 'next/font/google';
import Script from 'next/script';
import { GoogleAnalytics } from '@next/third-parties/google';
import type { ReactNode } from 'react';
import { LOCALE_META } from '@/content/site';
import type { Locale } from '@/content/types';
import { CookieConsent } from './CookieConsent';
import '@/app/globals.css';

// Šriftas talpinamas savame domene — nereikia preconnect į Google Fonts
// ir dingsta renderį blokuojanti išorinė užklausa (audito pastaba).
const inter = Inter({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  display: 'swap',
  variable: '--font-inter',
});

const GA_ID = process.env.NEXT_PUBLIC_GA_ID || 'G-MNR63Y36VB';

export function RootHtml({ locale, children }: { locale: Locale; children: ReactNode }) {
  return (
    <html lang={LOCALE_META[locale].htmlLang} className={inter.variable}>
      <body>
        {/* Consent Mode: analitika išjungta, kol lankytojas nesutinka */}
        <Script id="consent-default" strategy="beforeInteractive">
          {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}
gtag('consent','default',{analytics_storage:'denied',ad_storage:'denied',wait_for_update:500});
try{if(localStorage.getItem('situacija-consent')==='granted'){gtag('consent','update',{analytics_storage:'granted'})}}catch(e){}`}
        </Script>

        {children}
        <CookieConsent locale={locale} />
        {GA_ID ? <GoogleAnalytics gaId={GA_ID} /> : null}
      </body>
    </html>
  );
}
