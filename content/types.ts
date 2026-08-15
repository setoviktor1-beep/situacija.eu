export const LOCALES = ['lt', 'pl', 'ru'] as const;
export type Locale = (typeof LOCALES)[number];

export type Localized<T> = Record<Locale, T>;

export interface PageMeta {
  title: string;
  description: string;
}

export type ContentBlock =
  | { type: 'heading'; level: number; text: string }
  | { type: 'paragraph'; text: string; html: string }
  | { type: 'list'; items: string[] }
  | { type: 'caption'; text: string }
  | { type: 'image'; src: string; alt: string; width: number | null; height: number | null }
  | { type: 'faq'; items: { q: string; a: string }[] };

export interface GeneratedPage {
  key: string;
  isBlogPost: boolean;
  ltSlug: string | null;
  routes: Localized<string>;
  meta: Localized<PageMeta>;
  blocks: Localized<readonly ContentBlock[]>;
  jsonLd: readonly unknown[];
}
