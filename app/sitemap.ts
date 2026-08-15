import type { MetadataRoute } from 'next';
import lastmod from '@/content/lastmod.json';
import { SITE_URL } from '@/content/site';
import { LOCALES } from '@/content/types';
import { allRoutes } from '@/lib/site-routing';

const abs = (path: string) => new URL(path, SITE_URL).toString();

const LASTMOD = lastmod as Record<string, { hash: string; date: string }>;

/**
 * Sitemap su hreflang alternatyvomis ir patikimu <lastmod>.
 *
 * Datos imamos iš content/lastmod.json — jos keičiamos tik tada, kai realiai
 * pasikeičia puslapio turinys (lyginama turinio maiša). Auditas pastebėjo, kad
 * anksčiau <lastmod> buvo perrašomas kasdien, todėl prarasdavo signalo vertę.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return allRoutes().map(({ path, match }) => {
    const languages: Record<string, string> = {};
    for (const code of LOCALES) languages[code] = abs(match.alternates[code]);
    // Lietuvių versija — numatytoji nenurodytos kalbos lankytojams
    languages['x-default'] = abs(match.alternates.lt);

    const isHome = match.kind === 'home';
    const isPost = match.kind === 'post';

    const key = isHome ? 'home' : isPost ? `post:${match.ltSlug}` : match.pageKey;
    const modified = LASTMOD[key]?.date;

    return {
      url: abs(path),
      ...(modified ? { lastModified: new Date(modified) } : {}),
      changeFrequency: isHome ? 'weekly' : isPost ? 'yearly' : 'monthly',
      priority: isHome ? 1 : isPost ? 0.5 : 0.8,
      alternates: { languages },
    };
  });
}
