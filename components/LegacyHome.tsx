import { readFile } from 'node:fs/promises';
import path from 'node:path';
import Script from 'next/script';

export async function LegacyHome() {
  const html = await readFile(path.join(process.cwd(), 'public', 'legacy-home.html'), 'utf8');
  const body = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] || html;
  return <>
    <link rel="stylesheet" href="/style.css" />
    <div dangerouslySetInnerHTML={{ __html: body.replace(/<script[\s\S]*?<\/script>/gi, '') }} />
    <Script src="/i18n.js" strategy="afterInteractive" />
    <Script src="/script.js" strategy="afterInteractive" />
  </>;
}
