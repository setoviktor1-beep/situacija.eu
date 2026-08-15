import type { Locale, Localized } from './types';
import { GENERATED_PAGES } from './generated/pages';

/** Puslapių raktai, turintys atskirą maršrutą kiekviena kalba. */
export type PageKey =
  | 'home'
  | 'gallery'
  | 'faq'
  | 'privacy'
  | 'blog'
  | 'pabrade'
  | 'svencionys'
  | 'vilnius'
  | 'bathroom'
  | 'kitchen'
  | 'largeFormat'
  | 'clinker'
  | 'sink';

export const ROUTES: Record<PageKey, Localized<string>> = {
  home: { lt: '/', pl: '/pl', ru: '/ru' },
  gallery: { lt: '/gallery.html', pl: '/pl/galeria.html', ru: '/ru/galereya.html' },
  faq: { lt: '/duk.html', pl: '/pl/faq.html', ru: '/ru/faq.html' },
  privacy: {
    lt: '/privatumo-politika.html',
    pl: '/pl/polityka-prywatnosci.html',
    ru: '/ru/politika-konfidencialnosti.html',
  },
  blog: { lt: '/blogas.html', pl: '/pl/blog.html', ru: '/ru/blog.html' },
  pabrade: {
    lt: '/plyteliu-klojimas-pabrade.html',
    pl: '/pl/ukladanie-plytek-pabrade.html',
    ru: '/ru/ukladka-plitki-pabrade.html',
  },
  svencionys: {
    lt: '/plyteliu-klojimas-svencionys.html',
    pl: '/pl/ukladanie-plytek-svencionys.html',
    ru: '/ru/ukladka-plitki-svencionys.html',
  },
  vilnius: {
    lt: '/plyteliu-klojimas-vilnius.html',
    pl: '/pl/ukladanie-plytek-wilno.html',
    ru: '/ru/ukladka-plitki-vilnius.html',
  },
  bathroom: {
    lt: '/vonios-kambario-plyteliu-klijavimas.html',
    pl: '/pl/ukladanie-plytek-lazienka.html',
    ru: '/ru/ukladka-plitki-vannaya.html',
  },
  kitchen: {
    lt: '/virtuves-plyteliu-klijavimas.html',
    pl: '/pl/ukladanie-plytek-kuchnia.html',
    ru: '/ru/ukladka-plitki-kuhnya.html',
  },
  largeFormat: {
    lt: '/didelio-formato-plyteliu-klojimas.html',
    pl: '/pl/ukladanie-plytek-wielkoformatowych.html',
    ru: '/ru/ukladka-krupnoformatnoy-plitki.html',
  },
  clinker: {
    lt: '/klinkerio-klijavimas-fasadai.html',
    pl: '/pl/plytki-klinkierowe-elewacja.html',
    ru: '/ru/klinkernaya-plitka-fasad.html',
  },
  sink: {
    lt: '/kriaukles-is-plyteliu.html',
    pl: '/pl/umywalki-z-plytek.html',
    ru: '/ru/rakoviny-iz-plitki.html',
  },
};

export const SERVICE_KEYS = ['bathroom', 'kitchen', 'largeFormat', 'clinker', 'sink'] as const;
export const REGION_KEYS = ['pabrade', 'svencionys', 'vilnius'] as const;

export function routeFor(key: PageKey, locale: Locale): string {
  return ROUTES[key][locale];
}

/** Blogo įrašo maršrutas pagal LT slug'ą. */
export function postRoute(ltSlug: string, locale: Locale): string | null {
  const page = GENERATED_PAGES[`post:${ltSlug}` as keyof typeof GENERATED_PAGES];
  return page ? page.routes[locale] : null;
}

/** Visi blogo įrašų LT slug'ai. */
export const POST_SLUGS = Object.values(GENERATED_PAGES)
  .filter((p) => p.isBlogPost && p.ltSlug)
  .map((p) => p.ltSlug as string);

/**
 * Senoji nuoroda (kaip ji užrašyta paveldėtame turinyje) -> puslapio raktas.
 * Leidžia turinio blokuose esančias nuorodas paversti tos pačios kalbos maršrutais.
 */
const LEGACY_HREF_TO_KEY: Record<string, PageKey> = {
  'index.html': 'home',
  '/index.html': 'home',
  'gallery.html': 'gallery',
  '/gallery.html': 'gallery',
  'duk.html': 'faq',
  '/duk.html': 'faq',
  'blogas.html': 'blog',
  '/blogas.html': 'blog',
  'privatumo-politika.html': 'privacy',
  '/privatumo-politika.html': 'privacy',
  'plyteliu-klojimas-pabrade.html': 'pabrade',
  'plyteliu-klojimas-svencionys.html': 'svencionys',
  'plyteliu-klojimas-vilnius.html': 'vilnius',
  'vonios-kambario-plyteliu-klijavimas.html': 'bathroom',
  'virtuves-plyteliu-klijavimas.html': 'kitchen',
  'didelio-formato-plyteliu-klojimas.html': 'largeFormat',
  'klinkerio-klijavimas-fasadai.html': 'clinker',
  'kriaukles-is-plyteliu.html': 'sink',
};

/**
 * Paverčia paveldėtą nuorodą tos pačios kalbos maršrutu.
 * Grąžina originalą, jei tai išorinė nuoroda (http, tel, mailto) ar inkaras.
 */
export function localizeHref(href: string, locale: Locale): string {
  if (!href || /^(?:https?:|tel:|mailto:|#)/.test(href)) return href;

  const [pathPart, hash] = href.split('#');
  const suffix = hash ? `#${hash}` : '';

  const key = LEGACY_HREF_TO_KEY[pathPart];
  if (key) return `${routeFor(key, locale)}${suffix}`;

  // Blogo įrašai: blogas/<slug>.html
  const postMatch = pathPart.match(/^\/?blogas\/(.+)\.html$/);
  if (postMatch) {
    const route = postRoute(postMatch[1], locale);
    if (route) return `${route}${suffix}`;
  }

  if (pathPart === 'sitemap.xml' || pathPart === '/sitemap.xml') return '/sitemap.xml';

  return href;
}

/** hreflang alternatyvos vienam puslapiui. */
export function alternatesFor(key: PageKey): Localized<string> {
  return ROUTES[key];
}
