import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/content/site';
import { LOCALES } from '@/content/types';
import { allRoutes } from '@/lib/site-routing';

const abs = (path: string) => new URL(path, SITE_URL).toString();

/**
 * Sitemap su hreflang alternatyvomis kiekvienam įrašui.
 * `lastModified` nenaudojamas kasdien kintančios reikšmės — auditas pastebėjo,
 * kad kasdien perrašomas <lastmod> praranda signalo vertę.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return allRoutes().map(({ path, match }) => {
    const languages: Record<string, string> = {};
    for (const code of LOCALES) languages[code] = abs(match.alternates[code]);
    // Lietuvių versija — numatytoji nenurodytos kalbos lankytojams
    languages['x-default'] = abs(match.alternates.lt);

    const isHome = match.kind === 'home';
    const isPost = match.kind === 'post';

    return {
      url: abs(path),
      changeFrequency: isHome ? 'weekly' : isPost ? 'yearly' : 'monthly',
      priority: isHome ? 1 : isPost ? 0.5 : 0.8,
      alternates: { languages },
    };
  });
}
