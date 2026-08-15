import { GENERATED_PAGES } from '@/content/generated/pages';
import { ROUTES, type PageKey } from '@/content/routes';
import { LOCALES, type Locale, type Localized } from '@/content/types';

/** Ką reiškia konkretus URL. */
export type RouteMatch =
  | { kind: 'home'; locale: Locale; alternates: Localized<string> }
  | {
      kind: 'page';
      locale: Locale;
      pageKey: PageKey;
      alternates: Localized<string>;
    }
  | {
      kind: 'post';
      locale: Locale;
      ltSlug: string;
      alternates: Localized<string>;
    };

/** URL -> aprašas. Sudaromas kartą, modulio įkėlimo metu. */
const ROUTE_MAP = new Map<string, RouteMatch>();

for (const [key, localized] of Object.entries(ROUTES) as [PageKey, Localized<string>][]) {
  for (const locale of LOCALES) {
    const path = localized[locale];
    ROUTE_MAP.set(
      normalize(path),
      key === 'home'
        ? { kind: 'home', locale, alternates: localized }
        : { kind: 'page', locale, pageKey: key, alternates: localized },
    );
  }
}

for (const page of Object.values(GENERATED_PAGES)) {
  if (!page.isBlogPost || !page.ltSlug) continue;
  for (const locale of LOCALES) {
    ROUTE_MAP.set(normalize(page.routes[locale]), {
      kind: 'post',
      locale,
      ltSlug: page.ltSlug,
      alternates: page.routes,
    });
  }
}

/** Suvienodina kelią: be pradinio/galinio brūkšnio, kad „/pl/" ir „/pl" sutaptų. */
export function normalize(path: string): string {
  const trimmed = path.replace(/^\/+|\/+$/g, '');
  return trimmed === '' ? '' : trimmed;
}

/** Iš Next.js catch-all segmentų sudaro kelią. */
export function matchRoute(slug: string[] | undefined): RouteMatch | null {
  return ROUTE_MAP.get(normalize((slug ?? []).join('/'))) ?? null;
}

/** Visi maršrutai statiniam generavimui. */
export function allRouteParams(): { slug?: string[] }[] {
  return [...ROUTE_MAP.keys()].map((path) => (path === '' ? {} : { slug: path.split('/') }));
}

/**
 * Vienos kalbos maršrutai statiniam generavimui.
 * PL/RU atveju kalbos prefiksas nukerpamas, nes jis yra maršruto aplanko
 * pavadinime (app/(pl)/pl/[[...slug]]).
 */
export function localeRouteParams(locale: Locale): { slug?: string[] }[] {
  const prefix = locale === 'lt' ? null : locale;

  return [...ROUTE_MAP.entries()]
    .filter(([, match]) => match.locale === locale)
    .map(([path]) => {
      const segments = path === '' ? [] : path.split('/');
      const rest = prefix ? segments.slice(1) : segments;
      return rest.length ? { slug: rest } : {};
    });
}

/** Sudaro pilnus segmentus (su kalbos prefiksu) iš maršruto parametrų. */
export function withLocalePrefix(
  locale: Locale,
  slug: string[] | undefined,
): string[] | undefined {
  if (locale === 'lt') return slug;
  return [locale, ...(slug ?? [])];
}

/** Visi žinomi keliai su jų kalba — reikalingi sitemap generavimui. */
export function allRoutes(): { path: string; match: RouteMatch }[] {
  return [...ROUTE_MAP.entries()].map(([path, match]) => ({
    path: path === '' ? '/' : `/${path}`,
    match,
  }));
}
