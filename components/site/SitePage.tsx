import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { GENERATED_PAGES } from '@/content/generated/pages';
import { HOME } from '@/content/generated/home';
import { POST_SLUGS, ROUTES, localizeHref, postRoute, routeFor } from '@/content/routes';
import type { ContentBlock, Locale } from '@/content/types';
import { getUi } from '@/content/ui';
import { getGalleryItems } from '@/lib/gallery';
import { matchRoute, type RouteMatch } from '@/lib/site-routing';
import {
  articleSchema,
  breadcrumbSchema,
  buildMetadata,
  businessSchema,
  faqSchema,
  imageGallerySchema,
  serviceSchema,
  websiteSchema,
} from '@/lib/seo';
import { JsonLd } from './JsonLd';
import { SiteHeader } from './SiteHeader';
import { SiteFooter } from './SiteFooter';
import { ContentBlocks, PageCta, PageHero } from './InnerPage';
import {
  AboutSection,
  BlogSection,
  ContactSection,
  FaqSection,
  GallerySection,
  HeroSection,
  RegionsSection,
  ServicesSection,
} from './sections';
import { ArrowRight, Badge, Card, Container, Section } from './ui';

/** Iš bloku sąrašo išskiria H1 ir įžangą — jie rodomi puslapio antraštėje. */
function splitHero(blocks: readonly ContentBlock[]) {
  const heading = blocks.find((b) => b.type === 'heading' && b.level === 1);
  const title = heading && 'text' in heading ? heading.text : '';
  const headingIndex = blocks.indexOf(heading!);
  const next = headingIndex >= 0 ? blocks[headingIndex + 1] : undefined;
  const lead = next?.type === 'paragraph' ? next.text : undefined;

  const rest = blocks.filter((block, index) => {
    if (index === headingIndex) return false;
    if (lead && index === headingIndex + 1) return false;
    return true;
  });

  return { title, lead, rest };
}

export function buildPageMetadata(slug: string[] | undefined): Metadata {
  const match = matchRoute(slug);
  if (!match) return {};

  const { locale } = match;

  if (match.kind === 'home') {
    return buildMetadata({
      locale,
      title: HOME_META[locale].title,
      description: HOME_META[locale].description,
      path: ROUTES.home[locale],
      alternates: match.alternates,
    });
  }

  const key = match.kind === 'post' ? `post:${match.ltSlug}` : match.pageKey;
  const page = GENERATED_PAGES[key as keyof typeof GENERATED_PAGES];
  if (!page) return {};

  const firstImage = page.blocks[locale].find((b) => b.type === 'image');

  return buildMetadata({
    locale,
    title: page.meta[locale].title,
    description: page.meta[locale].description,
    path: page.routes[locale],
    alternates: match.alternates,
    ogType: match.kind === 'post' ? 'article' : 'website',
    image: firstImage && 'src' in firstImage ? firstImage.src : undefined,
  });
}

/** Pagrindinio puslapio meta — perimta iš senojo legacy-home.html / i18n META. */
const HOME_META: Record<Locale, { title: string; description: string }> = {
  lt: {
    title: 'Plytelių klojimas Pabradėje ir Švenčionyse | Vladislav',
    description:
      'Plytelių klojimas ir kriauklės iš plytelių Pabradėje, Švenčionyse bei Vilniuje. Hidroizoliacija, 45° kampai. Tel. +370 600 30288.',
  },
  pl: {
    title: 'Układanie płytek Pabradė, Święciany, Wilno | Vladislav',
    description:
      'Profesjonalne układanie płytek w Pabradė, Święcianach, Nowo-Święcianach i Wilnie. Łazienki, hydroizolacja, gres. Tel. +370 600 30288.',
  },
  ru: {
    title: 'Укладка плитки в Пабраде и Швенчёнисе | Владислав',
    description:
      'Профессиональная укладка плитки в Пабраде, Швенчёнисе, Швенчёнеляе и Вильнюсе. Ванные, гидроизоляция, керамогранит. Тел. +370 600 30288.',
  },
};

export async function SitePage({ slug }: { slug: string[] | undefined }) {
  const match = matchRoute(slug);
  if (!match) notFound();

  const { locale } = match;

  return (
    <>
      <SiteHeader locale={locale} alternates={match.alternates} />
      <main id="main">{await renderBody(match)}</main>
      <SiteFooter locale={locale} />
    </>
  );
}

async function renderBody(match: RouteMatch) {
  const { locale } = match;
  const ui = getUi(locale);

  if (match.kind === 'home') {
    return (
      <>
        <JsonLd
          schema={[
            businessSchema(locale),
            websiteSchema(locale),
            faqSchema(
              HOME.faq.items.map((item) => ({
                question: item.question[locale],
                answer: item.answerHtml[locale],
              })),
              locale,
            ),
          ]}
        />
        <HeroSection locale={locale} />
        <ServicesSection locale={locale} />
        <AboutSection locale={locale} />
        <RegionsSection locale={locale} />
        <GallerySection locale={locale} />
        <BlogSection locale={locale} />
        <FaqSection locale={locale} />
        <ContactSection locale={locale} />
      </>
    );
  }

  const key = match.kind === 'post' ? `post:${match.ltSlug}` : match.pageKey;
  const page = GENERATED_PAGES[key as keyof typeof GENERATED_PAGES];
  if (!page) notFound();

  const blocks = page.blocks[locale];
  const { title, lead, rest } = splitHero(blocks);
  const path = page.routes[locale];

  const schemas: unknown[] = [
    businessSchema(locale),
    breadcrumbSchema([
      { name: ui.breadcrumb.home, path: ROUTES.home[locale] },
      { name: title, path },
    ]),
  ];

  const faqBlock = blocks.find((b) => b.type === 'faq');
  if (faqBlock && 'items' in faqBlock) {
    schemas.push(
      faqSchema(
        faqBlock.items.map((item) => ({ question: item.q, answer: item.a })),
        locale,
      ),
    );
  }

  if (match.kind === 'post') {
    const firstImage = blocks.find((b) => b.type === 'image');
    schemas.push(
      articleSchema({
        headline: title,
        description: page.meta[locale].description,
        path,
        locale,
        image: firstImage && 'src' in firstImage ? firstImage.src : undefined,
      }),
    );
  } else if (['bathroom', 'kitchen', 'largeFormat', 'clinker', 'sink'].includes(match.pageKey)) {
    schemas.push(
      serviceSchema({
        name: title,
        description: page.meta[locale].description,
        path,
        locale,
      }),
    );
  }

  const isGallery = match.kind === 'page' && match.pageKey === 'gallery';
  const isBlogIndex = match.kind === 'page' && match.pageKey === 'blog';

  return (
    <>
      <JsonLd schema={schemas} />
      <PageHero locale={locale} title={title} lead={lead} />

      <Section tone="light">
        <Container className="max-w-3xl">
          <ContentBlocks blocks={rest} locale={locale} />
        </Container>
      </Section>

      {isGallery ? <GalleryGrid locale={locale} path={path} title={title} /> : null}
      {isBlogIndex ? <BlogList locale={locale} /> : null}

      <PageCta locale={locale} />
    </>
  );
}

/* --------------------------------------------------- Galerijos puslapis */

async function GalleryGrid({
  locale,
  path,
  title,
}: {
  locale: Locale;
  path: string;
  title: string;
}) {
  const items = await getGalleryItems(locale);
  if (!items.length) return null;

  return (
    <Section tone="sand" className="pt-0">
      <Container>
        <JsonLd
          schema={imageGallerySchema({
            name: title,
            path,
            locale,
            images: items.map((item) => ({ url: item.src, caption: item.caption })),
          })}
        />

        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => (
            <li
              key={item.id}
              className="group relative overflow-hidden rounded-tile bg-ink-100 ring-1 ring-ink-100"
            >
              <figure>
                <Image
                  src={item.src}
                  alt={item.alt}
                  width={item.width}
                  height={item.height}
                  sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
                  loading={index < 6 ? undefined : 'lazy'}
                  className="aspect-4/3 size-full object-cover transition-transform duration-500 ease-out-tile group-hover:scale-105"
                />
                {item.caption ? (
                  <figcaption className="absolute inset-x-0 bottom-0 bg-linear-to-t from-ink-950/90 via-ink-950/55 to-transparent p-4 text-sm font-semibold text-white">
                    {item.caption}
                  </figcaption>
                ) : null}
              </figure>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}

/* ------------------------------------------------------- Blogo sąrašas */

function BlogList({ locale }: { locale: Locale }) {
  const ui = getUi(locale);

  const posts = POST_SLUGS.map((ltSlug) => {
    const page = GENERATED_PAGES[`post:${ltSlug}` as keyof typeof GENERATED_PAGES];
    const blocks = page.blocks[locale];
    const heading = blocks.find((b) => b.type === 'heading' && b.level === 1);
    const paragraph = blocks.find((b) => b.type === 'paragraph');
    const image = blocks.find((b) => b.type === 'image');
    return {
      ltSlug,
      href: postRoute(ltSlug, locale) ?? '#',
      title: heading && 'text' in heading ? heading.text : page.meta[locale].title,
      excerpt: paragraph && 'text' in paragraph ? paragraph.text : page.meta[locale].description,
      image: image && 'src' in image ? image.src : '/images/img1.jpg',
    };
  });

  return (
    <Section tone="sand" className="pt-0">
      <Container>
        {/* Sutvarko audito radinį: 3 straipsniai anksčiau buvo „našlaičiai" —
            be nė vienos vidinės nuorodos. Dabar sąraše yra visi. */}
        <ul className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Card key={post.ltSlug} as="li">
              <div className="relative aspect-16/9 overflow-hidden bg-ink-100">
                <Image
                  src={post.image}
                  alt={post.title}
                  width={600}
                  height={340}
                  sizes="(min-width: 1024px) 380px, (min-width: 768px) 50vw, 100vw"
                  className="size-full object-cover transition-transform duration-500 ease-out-tile group-hover:scale-105"
                />
              </div>
              <div className="flex flex-1 flex-col p-7">
                <h3 className="text-lg font-extrabold text-balance text-ink-950">
                  <Link href={post.href} className="after:absolute after:inset-0">
                    {post.title}
                  </Link>
                </h3>
                <p className="mt-2.5 line-clamp-3 flex-1 text-sm leading-relaxed text-ink-600">
                  {post.excerpt}
                </p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-brand-700">
                  {ui.cta.readArticle}
                  <ArrowRight />
                </span>
              </div>
            </Card>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
