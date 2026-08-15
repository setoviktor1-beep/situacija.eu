import type { Metadata } from 'next';
import { BUSINESS, LOCALE_META, SERVICE_AREAS, SERVICE_REGION, SITE_URL } from '@/content/site';
import { ROUTES, SERVICE_KEYS } from '@/content/routes';
import { GENERATED_PAGES } from '@/content/generated/pages';
import { LOCALES, type Locale, type Localized } from '@/content/types';

const abs = (path: string) => new URL(path, SITE_URL).toString();

/** Meta antraštės ilgio riba, kurią nurodė auditas (SERP kerpa ties ~60). */
const TITLE_MAX = 60;
const DESCRIPTION_MAX = 160;

function clamp(text: string, max: number): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

export function buildMetadata({
  locale,
  title,
  description,
  path,
  alternates,
  ogType = 'website',
  image,
  publishedTime,
}: {
  locale: Locale;
  title: string;
  description: string;
  path: string;
  alternates: Localized<string>;
  ogType?: 'website' | 'article';
  image?: string;
  publishedTime?: string;
}): Metadata {
  const url = abs(path);
  const ogImage = abs(image ?? '/images/img1.jpg');

  const languages: Record<string, string> = {};
  for (const code of LOCALES) languages[code] = abs(alternates[code]);
  languages['x-default'] = abs(alternates.lt);

  return {
    title: clamp(title, TITLE_MAX),
    description: clamp(description, DESCRIPTION_MAX),
    alternates: { canonical: url, languages },
    openGraph: {
      type: ogType,
      url,
      siteName: BUSINESS.name,
      title: clamp(title, TITLE_MAX),
      description: clamp(description, DESCRIPTION_MAX),
      locale: LOCALE_META[locale].ogLocale,
      alternateLocale: LOCALES.filter((l) => l !== locale).map((l) => LOCALE_META[l].ogLocale),
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
      ...(publishedTime ? { publishedTime } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: clamp(title, TITLE_MAX),
      description: clamp(description, DESCRIPTION_MAX),
      images: [ogImage],
    },
  };
}

/* ------------------------------------------------------------- JSON-LD */

/**
 * Pagrindinis verslo subjektas. Vienas `@id` visoje svetainėje, kad kiti
 * schema tipai galėtų į jį nurodyti (`provider`, `publisher`).
 */
export function businessSchema(locale: Locale) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HomeAndConstructionBusiness',
    '@id': `${SITE_URL}/#business`,
    name: BUSINESS.name,
    legalName: BUSINESS.legalName,
    url: abs(ROUTES.home[locale]),
    image: abs('/images/img1.jpg'),
    telephone: BUSINESS.phone,
    email: BUSINESS.email,
    priceRange: BUSINESS.priceRange,
    inLanguage: LOCALE_META[locale].schemaLang,
    address: {
      '@type': 'PostalAddress',
      addressLocality: BUSINESS.address.locality,
      addressRegion: BUSINESS.address.region,
      addressCountry: BUSINESS.address.country,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: BUSINESS.geo.lat,
      longitude: BUSINESS.geo.lng,
    },
    areaServed: [
      ...SERVICE_AREAS.map((area) => ({
        '@type': area.schemaType,
        name: area.name[locale],
        ...(area.primary
          ? {
              geo: {
                '@type': 'GeoCircle',
                geoMidpoint: {
                  '@type': 'GeoCoordinates',
                  latitude: area.lat,
                  longitude: area.lng,
                },
                geoRadius: area.radiusKm * 1000,
              },
            }
          : {}),
      })),
      { '@type': SERVICE_REGION.schemaType, name: SERVICE_REGION.name[locale] },
    ],
    makesOffer: SERVICE_KEYS.map((key) => {
      const page = GENERATED_PAGES[key];
      const heading = page.blocks[locale].find((b) => b.type === 'heading' && b.level === 1);
      return {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: heading && 'text' in heading ? heading.text : page.meta[locale].title,
          url: abs(ROUTES[key][locale]),
        },
      };
    }),
    founder: { '@type': 'Person', name: BUSINESS.masterName },
    sameAs: [BUSINESS.facebook],
  };
}

export function websiteSchema(locale: Locale) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    url: abs(ROUTES.home[locale]),
    name: BUSINESS.name,
    inLanguage: LOCALE_META[locale].schemaLang,
    publisher: { '@id': `${SITE_URL}/#business` },
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: abs(item.path),
    })),
  };
}

export function faqSchema(items: { question: string; answer: string }[], locale: Locale) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: LOCALE_META[locale].schemaLang,
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        // AEO: atsakymas be HTML žymų — tiksliai tai, ką cituoja pokalbių varikliai
        text: item.answer.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(),
      },
    })),
  };
}

export function serviceSchema({
  name,
  description,
  path,
  locale,
}: {
  name: string;
  description: string;
  path: string;
  locale: Locale;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    description,
    url: abs(path),
    inLanguage: LOCALE_META[locale].schemaLang,
    provider: { '@id': `${SITE_URL}/#business` },
    areaServed: SERVICE_AREAS.map((area) => ({
      '@type': area.schemaType,
      name: area.name[locale],
    })),
  };
}

export function articleSchema({
  headline,
  description,
  path,
  locale,
  image,
}: {
  headline: string;
  description: string;
  path: string;
  locale: Locale;
  image?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline,
    description,
    url: abs(path),
    mainEntityOfPage: abs(path),
    inLanguage: LOCALE_META[locale].schemaLang,
    image: abs(image ?? '/images/img1.jpg'),
    author: { '@type': 'Person', name: BUSINESS.masterName },
    publisher: { '@id': `${SITE_URL}/#business` },
  };
}

/**
 * Nuotraukos schema — kad kiekviena darbų nuotrauka turėtų SEO reikšmę
 * (Google Images: caption, aprašymas, autorius).
 */
export function imageObjectSchema({
  url,
  caption,
  description,
}: {
  url: string;
  caption: string;
  description?: string;
}) {
  return {
    '@type': 'ImageObject',
    contentUrl: abs(url),
    caption,
    ...(description ? { description } : {}),
    creator: { '@type': 'Person', name: BUSINESS.masterName },
    creditText: BUSINESS.name,
  };
}

export function imageGallerySchema({
  name,
  path,
  locale,
  images,
}: {
  name: string;
  path: string;
  locale: Locale;
  images: { url: string; caption: string }[];
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ImageGallery',
    name,
    url: abs(path),
    inLanguage: LOCALE_META[locale].schemaLang,
    associatedMedia: images.map((image) => imageObjectSchema(image)),
  };
}
