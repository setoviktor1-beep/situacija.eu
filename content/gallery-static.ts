import manifest from './gallery-manifest.json';
import type { Locale, Localized } from './types';

export interface WorkPhoto {
  id: string;
  avif: string;
  webp: string;
  original: string;
  width: number;
  height: number;
  category: string;
  alt: Localized<string>;
  caption: Localized<string>;
  featured: boolean;
}

/**
 * Darbų nuotraukos su SEO pavadinimais ir trikalbiais alt tekstais.
 * Šaltinis — content/gallery-manifest.json (generuojamas iš originalų).
 */
export const WORK_PHOTOS = manifest as WorkPhoto[];

/** Pagrindiniam puslapiui atrinktos nuotraukos. */
export const FEATURED_PHOTOS = WORK_PHOTOS.filter((photo) => photo.featured);

export function photoAlt(photo: WorkPhoto, locale: Locale): string {
  return photo.alt[locale] || photo.alt.lt;
}

export function photoCaption(photo: WorkPhoto, locale: Locale): string {
  return photo.caption[locale] || photo.caption.lt;
}
