import { WORK_PHOTOS, photoAlt, photoCaption } from '@/content/gallery-static';
import type { Locale } from '@/content/types';

export interface GalleryItem {
  id: string;
  src: string;
  alt: string;
  caption: string;
  category: string;
  width: number;
  height: number;
}

const directusUrl = (process.env.DIRECTUS_URL || 'http://situacija-directus-app:8055').replace(
  /\/$/,
  '',
);
const publicUrl = (process.env.DIRECTUS_PUBLIC_URL || 'https://situacija.sitestudio.lt').replace(
  /\/$/,
  '',
);

/**
 * Galerijos pavadinimų vertimai — perimti iš senosios public/i18n.js
 * `translateGalleryTitle`, kad tekstai sutaptų su tuo, kas jau publikuota.
 * Pavadinimai turi „– NN" priesagą, todėl taikoma dalinė pakaita.
 */
const TITLE_REPLACEMENTS: Record<Exclude<Locale, 'lt'>, Record<string, string>> = {
  pl: {
    'Virtuvės ir grindų plytelių klijavimas': 'Układanie płytek w kuchni i na podłodze',
    'Didelio formato plytelių klojimas': 'Układanie płytek wielkoformatowych',
    'Dušo zonos hidroizoliacija ir plytelių apdaila': 'Hydroizolacja i płytki w strefie prysznica',
    'Vonios kambario plytelių klojimas Pabradėje': 'Układanie płytek w łazience w Pabradė',
    'Klinkerio ir plytelių apdailos darbai': 'Wykończenie klinkierem i płytkami',
    'Plytelių apdaila Švenčionių rajone': 'Wykończenie płytkami w rejonie święciańskim',
  },
  ru: {
    'Virtuvės ir grindų plytelių klijavimas': 'Укладка плитки на кухне и полу',
    'Didelio formato plytelių klojimas': 'Укладка крупноформатной плитки',
    'Dušo zonos hidroizoliacija ir plytelių apdaila': 'Гидроизоляция и плитка в душевой',
    'Vonios kambario plytelių klojimas Pabradėje': 'Укладка плитки в ванной в Пабраде',
    'Klinkerio ir plytelių apdailos darbai': 'Отделка клинкером и плиткой',
    'Plytelių apdaila Švenčionių rajone': 'Плиточная отделка в Швенчёнском районе',
  },
};

function translateTitle(title: string, locale: Locale): string {
  if (locale === 'lt') return title;
  let result = title;
  for (const [from, to] of Object.entries(TITLE_REPLACEMENTS[locale])) {
    result = result.replace(from, to);
  }
  return result;
}

interface DirectusGalleryRow {
  id: number;
  image: string;
  title: string | null;
  category: string | null;
  description: string | null;
  source_filename: string | null;
}

/**
 * Galerija: pagrindas — manifesto nuotraukos (SEO pavadinimai, trikalbiai alt
 * tekstai), papildomai prijungiamos tos Directus nuotraukos, kurių manifeste dar
 * nėra. Taip klientas gali pats įkelti naujų darbų per CMS, o jau turimos
 * nuotraukos išlaiko optimizuotus failus ir vertimus.
 *
 * Directus neprieinamumas nieko nelaužo — lieka manifesto sąrašas.
 */
export async function getGalleryItems(locale: Locale): Promise<GalleryItem[]> {
  const base = staticFallback(locale);
  const known = new Set(
    WORK_PHOTOS.map((photo) => photo.original.split('/').pop()).filter(Boolean) as string[],
  );

  try {
    const token = process.env.DIRECTUS_STATIC_TOKEN;
    const query = new URLSearchParams({
      'filter[status][_eq]': 'published',
      fields: 'id,image,title,category,description,source_filename',
      sort: 'sort,id',
      limit: '100',
    });

    const response = await fetch(`${directusUrl}/items/gallery?${query}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      next: { revalidate: 300, tags: ['directus-content'] },
    });
    if (!response.ok) throw new Error(`Directus ${response.status}`);

    const rows = ((await response.json()).data ?? []) as DirectusGalleryRow[];

    // Praleidžiam tas, kurios jau yra manifeste — kitaip nuotrauka dubliuotųsi
    const extra = rows
      .filter((row) => !row.source_filename || !known.has(row.source_filename))
      .map((row) => {
        const title = translateTitle(row.title ?? '', locale);
        return {
          id: `cms-${row.id}`,
          // Directus perdaro dydį ir formatą — kopijų repozitorijoje laikyti nereikia
          src: `${publicUrl}/assets/${row.image}?width=1200&format=webp&quality=78`,
          alt: title,
          caption: title,
          category: row.category ?? '',
          width: 1200,
          height: 900,
        };
      });

    return [...base, ...extra];
  } catch {
    return base;
  }
}

/**
 * Atsarginis variantas: visos 40 darbų nuotraukos iš manifesto — su SEO
 * pavadinimais ir trikalbiais alt tekstais. Naudojamas, kai Directus nepasiekiamas.
 */
function staticFallback(locale: Locale): GalleryItem[] {
  return WORK_PHOTOS.map((photo) => ({
    id: photo.id,
    src: photo.avif,
    alt: photoAlt(photo, locale),
    caption: photoCaption(photo, locale),
    category: photo.category,
    width: photo.width,
    height: photo.height,
  }));
}
