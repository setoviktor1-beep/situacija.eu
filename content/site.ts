import type { Locale, Localized } from './types';

export const SITE_URL = 'https://situacija.eu';

/** Vieninteliai verslo kontaktai — naudojami ir JSON-LD, ir UI (NAP nuoseklumas). */
export const BUSINESS = {
  name: 'Situacija.eu',
  legalName: 'Vladislav Finažonok',
  masterName: 'Vladislav Finažonok',
  phone: '+37060030288',
  phoneDisplay: '+370 600 30288',
  email: 'v.finazonok@gmail.com',
  facebook: 'https://www.facebook.com/share/1D7EM2oc7U/',
  priceRange: '€€',
  address: {
    locality: 'Pabradė',
    region: 'Švenčionių r.',
    country: 'LT',
  },
  geo: { lat: 54.9811, lng: 25.7628 },
} as const;

export const LOCALE_META: Record<
  Locale,
  { htmlLang: string; schemaLang: string; ogLocale: string; label: string; name: string }
> = {
  lt: { htmlLang: 'lt', schemaLang: 'lt-LT', ogLocale: 'lt_LT', label: 'LT', name: 'Lietuvių' },
  pl: { htmlLang: 'pl', schemaLang: 'pl-PL', ogLocale: 'pl_PL', label: 'PL', name: 'Polski' },
  ru: { htmlLang: 'ru', schemaLang: 'ru-RU', ogLocale: 'ru_RU', label: 'RU', name: 'Русский' },
};

/**
 * Veiklos teritorijos — vienas šaltinis OpenStreetMap žemėlapiui, JSON-LD
 * `areaServed` laukui ir tekstiniam sąrašui po žemėlapiu (GEO/AEO).
 * `radiusKm` žymi realią aptarnavimo zoną aplink tašką.
 */
export const SERVICE_AREAS = [
  {
    id: 'pabrade',
    lat: 54.9811,
    lng: 25.7628,
    radiusKm: 12,
    primary: true,
    schemaType: 'City',
    name: { lt: 'Pabradė', pl: 'Pabradė', ru: 'Пабраде' },
    note: {
      lt: 'Pagrindinė veiklos lokacija',
      pl: 'Główna lokalizacja działalności',
      ru: 'Основная локация работы',
    },
  },
  {
    id: 'svencionys',
    lat: 55.1333,
    lng: 26.1583,
    radiusKm: 10,
    primary: true,
    schemaType: 'City',
    name: { lt: 'Švenčionys', pl: 'Święciany', ru: 'Швенчёнис' },
    note: {
      lt: 'Nuolatinis aptarnavimas',
      pl: 'Stała obsługa',
      ru: 'Постоянное обслуживание',
    },
  },
  {
    id: 'svencioneliai',
    lat: 55.1667,
    lng: 26.0,
    radiusKm: 8,
    primary: true,
    schemaType: 'City',
    name: { lt: 'Švenčionėliai', pl: 'Nowo-Święciany', ru: 'Швенчёнеляй' },
    note: {
      lt: 'Nuolatinis aptarnavimas',
      pl: 'Stała obsługa',
      ru: 'Постоянное обслуживание',
    },
  },
  {
    id: 'vilnius',
    lat: 54.6872,
    lng: 25.2797,
    radiusKm: 18,
    primary: false,
    schemaType: 'City',
    name: { lt: 'Vilnius', pl: 'Wilno', ru: 'Вильнюс' },
    note: {
      lt: 'Pagal išankstinį susitarimą ir užimtumą',
      pl: 'Po wcześniejszym uzgodnieniu, zależnie od dostępności',
      ru: 'По предварительной договорённости, в зависимости от занятости',
    },
  },
] as const satisfies readonly {
  id: string;
  lat: number;
  lng: number;
  radiusKm: number;
  primary: boolean;
  schemaType: string;
  name: Localized<string>;
  note: Localized<string>;
}[];

/** Papildoma administracinė teritorija JSON-LD `areaServed` laukui. */
export const SERVICE_REGION = {
  schemaType: 'AdministrativeArea',
  name: { lt: 'Švenčionių rajonas', pl: 'Rejon święciański', ru: 'Швенчёнский район' },
} as const;
