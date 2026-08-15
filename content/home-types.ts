import type { Localized } from './types';

type L = Localized<string>;

export interface HomeContent {
  hero: {
    badge: L;
    title: L;
    subtitleHtml: L;
    stats: readonly { number: L; label: L }[];
  };
  services: {
    badge: L;
    title: L;
    subtitle: L;
    items: readonly {
      image: string | null;
      alt: L;
      width: number | null;
      height: number | null;
      title: L;
      text: L;
      href: string | null;
      linkLabel: L;
    }[];
  };
  about: {
    badge: L;
    title: L;
    subtitle: L;
    leadTitle: L;
    paragraphs: readonly L[];
    features: readonly { title: L; text: L }[];
    workflowTitle: L;
    workflow: readonly { number: string; title: L; text: L }[];
  };
  regions: {
    badge: L;
    title: L;
    subtitle: L;
    items: readonly {
      icon: string;
      title: L;
      text: L;
      href: string | null;
      linkLabel: L;
    }[];
  };
  gallery: {
    badge: L;
    title: L;
    subtitle: L;
    ctaLabel: L;
    items: readonly { src: string; alt: L; caption: L }[];
  };
  blog: {
    badge: L;
    title: L;
    subtitle: L;
    ctaLabel: L;
    items: readonly {
      src: string;
      alt: L;
      tag: L;
      title: L;
      text: L;
      href: string | null;
    }[];
  };
  faq: {
    badge: L;
    title: L;
    subtitle: L;
    ctaLabel: L;
    items: readonly { question: L; answerHtml: L }[];
  };
  contact: { title: L; text: L };
}
