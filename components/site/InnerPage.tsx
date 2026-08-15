import Image from 'next/image';
import Link from 'next/link';
import { localizeHref, routeFor } from '@/content/routes';
import type { ContentBlock, Locale } from '@/content/types';
import { getUi } from '@/content/ui';
import { ArrowRight, Badge, Button, Container, RichText, Section } from './ui';
import { BUSINESS } from '@/content/site';

/** Viršutinė vidinio puslapio juosta: naršymo kelias, H1 ir įžanga. */
export function PageHero({
  locale,
  title,
  lead,
  badge,
}: {
  locale: Locale;
  title: string;
  lead?: string;
  badge?: string;
}) {
  const ui = getUi(locale);

  return (
    <section className="relative isolate overflow-hidden bg-ink-950">
      <div className="absolute inset-0 bg-tile-grid opacity-50" aria-hidden="true" />
      <div
        className="absolute inset-0 bg-radial-[at_30%_0%] from-brand-900/40 to-transparent"
        aria-hidden="true"
      />

      <Container className="relative py-16 md:py-24">
        <nav aria-label="Breadcrumb" className="text-sm">
          <ol className="flex flex-wrap items-center gap-2 text-ink-400">
            <li>
              <Link href={routeFor('home', locale)} className="transition-colors hover:text-white">
                {ui.breadcrumb.home}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-ink-200">{title}</li>
          </ol>
        </nav>

        <div className="mt-8 max-w-3xl">
          {badge ? <Badge tone="dark">{badge}</Badge> : null}
          <h1 className="mt-5 text-balance text-3xl leading-[1.1] font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl">
            {title}
          </h1>
          {lead ? (
            <p className="mt-6 text-pretty text-lg leading-relaxed text-ink-300">{lead}</p>
          ) : null}
        </div>
      </Container>
    </section>
  );
}

/**
 * Renderina paveldėtus turinio blokus. Tekstas nekeičiamas — keičiasi tik
 * pateikimas; nuorodos viduje pritaikomos aktyviai kalbai.
 */
export function ContentBlocks({
  blocks,
  locale,
}: {
  blocks: readonly ContentBlock[];
  locale: Locale;
}) {
  return (
    <div className="space-y-7">
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'heading': {
            if (block.level === 2) {
              return (
                <h2
                  key={index}
                  className="mt-14 text-balance text-2xl font-extrabold tracking-tight text-ink-950 first:mt-0 sm:text-3xl"
                >
                  {block.text}
                </h2>
              );
            }
            if (block.level === 3) {
              return (
                <h3 key={index} className="mt-10 text-xl font-extrabold text-ink-950">
                  {block.text}
                </h3>
              );
            }
            return (
              <h4 key={index} className="mt-8 text-lg font-bold text-ink-950">
                {block.text}
              </h4>
            );
          }

          case 'paragraph':
            return (
              <RichText
                key={index}
                html={localizeHtmlLinks(block.html, locale)}
                className="text-lg text-ink-600"
              />
            );

          case 'list':
            return (
              <ul key={index} className="space-y-3">
                {block.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="flex gap-3 text-lg text-ink-600">
                    <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-brand-600" aria-hidden="true" />
                    <span className="text-pretty">{item}</span>
                  </li>
                ))}
              </ul>
            );

          case 'image':
            return (
              <Image
                key={index}
                src={block.src}
                alt={block.alt}
                width={block.width ?? 960}
                height={block.height ?? 720}
                sizes="(min-width: 768px) 720px, 100vw"
                className="my-10 w-full rounded-tile object-cover ring-1 ring-ink-100"
              />
            );

          case 'caption':
            return (
              <p key={index} className="text-sm text-ink-500 italic">
                {block.text}
              </p>
            );

          case 'faq':
            return (
              <div key={index} className="mt-8 space-y-3">
                {block.items.map((item, itemIndex) => (
                  <details
                    key={itemIndex}
                    className="group overflow-hidden rounded-tile bg-sand-50 ring-1 ring-ink-100 open:bg-white open:shadow-tile"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-bold text-ink-950 [&::-webkit-details-marker]:hidden">
                      <span className="text-pretty">{item.q}</span>
                      <span
                        className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700 transition-transform duration-300 group-open:rotate-45"
                        aria-hidden="true"
                      >
                        <svg viewBox="0 0 20 20" fill="none" className="size-4">
                          <path
                            d="M10 4v12M4 10h12"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                          />
                        </svg>
                      </span>
                    </summary>
                    <p className="px-5 pb-5 text-ink-600">{item.a}</p>
                  </details>
                ))}
              </div>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}

/** Perrašo href reikšmes paveldėtame HTML į aktyvios kalbos maršrutus. */
function localizeHtmlLinks(html: string, locale: Locale): string {
  return html.replace(/href="([^"]+)"/g, (match, href: string) => {
    const localized = localizeHref(href, locale);
    return localized === href ? match : `href="${localized}"`;
  });
}

/** Bendra vidinio puslapio pabaiga — kvietimas susisiekti. */
export function PageCta({ locale }: { locale: Locale }) {
  const ui = getUi(locale);

  return (
    <Section tone="dark" className="relative isolate overflow-hidden py-16 md:py-20">
      <div className="absolute inset-0 bg-tile-grid opacity-40" aria-hidden="true" />
      <Container className="relative">
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-extrabold text-balance text-white sm:text-3xl">
              {ui.form.title}
            </h2>
            <p className="mt-3 text-ink-300">
              {ui.contact.phone}{' '}
              <a
                href={`tel:${BUSINESS.phone}`}
                className="font-bold text-brand-300 hover:text-brand-200"
              >
                {BUSINESS.phoneDisplay}
              </a>
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button href={`tel:${BUSINESS.phone}`}>
              {ui.cta.call}: {BUSINESS.phoneDisplay}
            </Button>
            <Button
              href={`${routeFor('home', locale)}#contact`}
              variant="onDark"
              className="group bg-white/10 text-white ring-1 ring-white/25 hover:bg-white/20"
            >
              {ui.cta.freeQuote}
              <ArrowRight />
            </Button>
          </div>
        </div>
      </Container>
    </Section>
  );
}
