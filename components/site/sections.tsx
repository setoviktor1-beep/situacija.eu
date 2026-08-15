import Image from 'next/image';
import Link from 'next/link';
import { HOME } from '@/content/generated/home';
import { BUSINESS, SERVICE_AREAS } from '@/content/site';
import { localizeHref, routeFor } from '@/content/routes';
import type { Locale } from '@/content/types';
import { getUi } from '@/content/ui';
import { ContactForm } from './ContactForm';
import { HeroCanvas } from './HeroCanvas';
import { ServiceAreaMap } from './ServiceAreaMap';
import { ArrowRight, Badge, Button, Card, Container, RichText, Section, SectionHeading } from './ui';

/* ------------------------------------------------------------------ Hero */

export function HeroSection({ locale }: { locale: Locale }) {
  const ui = getUi(locale);
  const { hero } = HOME;

  return (
    <section className="relative isolate overflow-hidden bg-ink-950">
      <HeroCanvas className="absolute inset-0 size-full" />
      {/* Gradientas išryškina tekstą virš animacijos */}
      <div
        className="absolute inset-0 bg-radial-[at_50%_20%] from-ink-900/40 via-ink-950/85 to-ink-950"
        aria-hidden="true"
      />

      <Container className="relative py-24 md:py-32 lg:py-40">
        <div className="mx-auto max-w-4xl text-center">
          <Badge tone="dark">{hero.badge[locale]}</Badge>

          <h1 className="mt-6 text-balance text-4xl leading-[1.05] font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
            {hero.title[locale]}
          </h1>

          <RichText
            html={hero.subtitleHtml[locale]}
            className="mx-auto mt-7 max-w-2xl text-lg text-ink-200 sm:text-xl [&_strong]:text-brand-300"
          />

          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <Button href={`tel:${BUSINESS.phone}`} className="text-lg">
              {ui.cta.call}: {BUSINESS.phoneDisplay}
            </Button>
            <Button
              href={`${routeFor('home', locale)}#gallery`}
              variant="onDark"
              className="group bg-white/10 text-white ring-1 ring-white/25 backdrop-blur-sm hover:bg-white/20"
            >
              {ui.cta.viewGallery}
              <ArrowRight />
            </Button>
          </div>

          <dl className="mx-auto mt-16 grid max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-tile bg-white/10 ring-1 ring-white/15 lg:grid-cols-4">
            {hero.stats.map((stat) => (
              <div key={stat.label.lt} className="bg-ink-950/60 px-4 py-6 backdrop-blur-sm">
                <dt className="sr-only">{stat.label[locale]}</dt>
                <dd>
                  <span className="block text-2xl font-extrabold text-brand-300 sm:text-3xl">
                    {stat.number[locale]}
                  </span>
                  <span className="mt-1.5 block text-xs leading-snug font-medium text-ink-300 sm:text-sm">
                    {stat.label[locale]}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </Container>
    </section>
  );
}

/* -------------------------------------------------------------- Paslaugos */

export function ServicesSection({ locale }: { locale: Locale }) {
  const ui = getUi(locale);
  const { services } = HOME;

  return (
    <Section id="services" tone="light">
      <Container>
        <SectionHeading
          badge={services.badge[locale]}
          title={services.title[locale]}
          subtitle={services.subtitle[locale]}
        />

        <ul className="mt-16 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {services.items.map((item) => {
            const href = item.href ? localizeHref(item.href, locale) : null;
            return (
              <Card key={item.title.lt} as="li">
                {item.image ? (
                  <div className="relative aspect-4/3 overflow-hidden bg-ink-100">
                    <Image
                      src={item.image}
                      alt={item.alt[locale]}
                      width={item.width ?? 960}
                      height={item.height ?? 720}
                      sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
                      className="size-full object-cover transition-transform duration-500 ease-out-tile group-hover:scale-105"
                    />
                  </div>
                ) : null}

                <div className="flex flex-1 flex-col p-7">
                  <h3 className="text-xl font-extrabold text-ink-950">{item.title[locale]}</h3>
                  <p className="mt-3 flex-1 text-pretty leading-relaxed text-ink-600">
                    {item.text[locale]}
                  </p>
                  {href ? (
                    <Link
                      href={href}
                      className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-brand-700 transition-colors hover:text-brand-800"
                    >
                      {ui.cta.readMoreService}
                      <ArrowRight />
                    </Link>
                  ) : null}
                </div>
              </Card>
            );
          })}
        </ul>
      </Container>
    </Section>
  );
}

/* ------------------------------------------------------- Apie + darbų eiga */

export function AboutSection({ locale }: { locale: Locale }) {
  const { about } = HOME;

  return (
    <Section id="about" tone="sand">
      <Container>
        <SectionHeading
          badge={about.badge[locale]}
          title={about.title[locale]}
          subtitle={about.subtitle[locale]}
        />

        <div className="mt-16 grid gap-12 lg:grid-cols-2 lg:items-start lg:gap-16">
          <div>
            <h3 className="text-2xl font-extrabold text-balance text-ink-950">
              {about.leadTitle[locale]}
            </h3>
            <div className="mt-6 space-y-5">
              {about.paragraphs.map((paragraph, index) => (
                <RichText key={index} html={paragraph[locale]} className="text-ink-600" />
              ))}
            </div>
          </div>

          <ul className="space-y-4">
            {about.features.map((feature) => (
              <li
                key={feature.title.lt}
                className="flex gap-4 rounded-tile bg-white p-6 ring-1 ring-ink-100"
              >
                <span
                  className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-700 text-white"
                  aria-hidden="true"
                >
                  <svg viewBox="0 0 20 20" fill="none" className="size-4">
                    <path
                      d="m5 10.5 3.5 3.5L15 7"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <div>
                  <strong className="block font-bold text-ink-950">{feature.title[locale]}</strong>
                  <span className="mt-1 block text-pretty leading-relaxed text-ink-600">
                    {feature.text[locale]}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <h3 className="mt-20 text-center text-2xl font-extrabold text-balance text-ink-950 sm:text-3xl">
          {about.workflowTitle[locale]}
        </h3>

        <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {about.workflow.map((step) => (
            <li
              key={step.number}
              className="relative rounded-tile bg-white p-7 ring-1 ring-ink-100"
            >
              <span className="flex size-11 items-center justify-center rounded-xl bg-ink-950 text-lg font-extrabold text-brand-300">
                {step.number}
              </span>
              <h4 className="mt-5 font-extrabold text-ink-950">{step.title[locale]}</h4>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">{step.text[locale]}</p>
            </li>
          ))}
        </ol>
      </Container>
    </Section>
  );
}

/* -------------------------------------------------- Regionai + žemėlapis */

export function RegionsSection({ locale }: { locale: Locale }) {
  const ui = getUi(locale);
  const { regions } = HOME;

  return (
    <Section id="regions" tone="light">
      <Container>
        <SectionHeading
          badge={regions.badge[locale]}
          title={regions.title[locale]}
          subtitle={regions.subtitle[locale]}
        />

        <ul className="mt-16 grid gap-7 md:grid-cols-3">
          {regions.items.map((item) => {
            const href = item.href ? localizeHref(item.href, locale) : null;
            return (
              <Card key={item.title.lt} as="li" className="p-7">
                <span className="text-3xl" aria-hidden="true">
                  {item.icon}
                </span>
                <h3 className="mt-4 text-xl font-extrabold text-ink-950">{item.title[locale]}</h3>
                <p className="mt-3 flex-1 text-pretty leading-relaxed text-ink-600">
                  {item.text[locale]}
                </p>
                {href ? (
                  <Link
                    href={href}
                    className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-brand-700 transition-colors hover:text-brand-800"
                  >
                    {item.linkLabel[locale]}
                    <ArrowRight />
                  </Link>
                ) : null}
              </Card>
            );
          })}
        </ul>

        <div className="mt-16">
          <h3 className="text-xl font-extrabold text-ink-950">{ui.map.heading}</h3>
          <p className="mt-2 max-w-2xl text-ink-600">{ui.map.intro}</p>

          <div className="mt-7">
            <ServiceAreaMap locale={locale} />
          </div>

          {/* Tekstinis dublikatas — pasiekiamas be JS ir robotams (GEO/AEO) */}
          <h4 className="mt-10 text-sm font-bold tracking-wide text-ink-500 uppercase">
            {ui.map.listHeading}
          </h4>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {SERVICE_AREAS.map((area) => (
              <li key={area.id} className="rounded-xl bg-sand-50 px-4 py-3 ring-1 ring-ink-100">
                <span className="block font-bold text-ink-900">{area.name[locale]}</span>
                <span className="mt-0.5 block text-sm text-ink-500">{area.note[locale]}</span>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </Section>
  );
}

/* --------------------------------------------------------------- Galerija */

export function GallerySection({ locale }: { locale: Locale }) {
  const ui = getUi(locale);
  const { gallery } = HOME;

  return (
    <Section id="gallery" tone="sand">
      <Container>
        <SectionHeading
          badge={gallery.badge[locale]}
          title={gallery.title[locale]}
          subtitle={gallery.subtitle[locale]}
        />

        <ul className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {gallery.items.map((item, index) => (
            <li
              key={item.src}
              className="group relative overflow-hidden rounded-tile bg-ink-100 ring-1 ring-ink-100"
            >
              <figure>
                <Image
                  src={item.src}
                  alt={item.alt[locale]}
                  width={800}
                  height={600}
                  sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
                  loading={index < 3 ? undefined : 'lazy'}
                  priority={false}
                  className="aspect-4/3 size-full object-cover transition-transform duration-500 ease-out-tile group-hover:scale-105"
                />
                <figcaption className="absolute inset-x-0 bottom-0 bg-linear-to-t from-ink-950/90 via-ink-950/60 to-transparent p-5 text-sm font-semibold text-white">
                  {item.caption[locale]}
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>

        <div className="mt-12 text-center">
          <Button href={routeFor('gallery', locale)} className="group">
            {gallery.ctaLabel[locale]}
            <ArrowRight />
          </Button>
        </div>
      </Container>
    </Section>
  );
}

/* ------------------------------------------------------------------ Blogas */

export function BlogSection({ locale }: { locale: Locale }) {
  const { blog } = HOME;

  return (
    <Section id="blog" tone="light">
      <Container>
        <SectionHeading
          badge={blog.badge[locale]}
          title={blog.title[locale]}
          subtitle={blog.subtitle[locale]}
        />

        <ul className="mt-16 grid gap-7 md:grid-cols-3">
          {blog.items.map((item) => {
            const href = item.href ? localizeHref(item.href, locale) : null;
            return (
              <Card key={item.title.lt} as="li">
                <div className="relative aspect-16/9 overflow-hidden bg-ink-100">
                  <Image
                    src={item.src}
                    alt={item.alt[locale]}
                    width={600}
                    height={340}
                    sizes="(min-width: 768px) 380px, 100vw"
                    className="size-full object-cover transition-transform duration-500 ease-out-tile group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-1 flex-col p-7">
                  <Badge>{item.tag[locale]}</Badge>
                  <h3 className="mt-4 text-lg font-extrabold text-balance text-ink-950">
                    {href ? (
                      <Link href={href} className="after:absolute after:inset-0">
                        {item.title[locale]}
                      </Link>
                    ) : (
                      item.title[locale]
                    )}
                  </h3>
                  <p className="mt-2.5 flex-1 text-sm leading-relaxed text-ink-600">
                    {item.text[locale]}
                  </p>
                </div>
              </Card>
            );
          })}
        </ul>

        <div className="mt-12 text-center">
          <Button href={routeFor('blog', locale)} variant="outline" className="group">
            {blog.ctaLabel[locale]}
            <ArrowRight />
          </Button>
        </div>
      </Container>
    </Section>
  );
}

/* ------------------------------------------------------------------ D.U.K. */

export function FaqSection({ locale }: { locale: Locale }) {
  const { faq } = HOME;

  return (
    <Section id="faq" tone="sand">
      <Container>
        <SectionHeading
          badge={faq.badge[locale]}
          title={faq.title[locale]}
          subtitle={faq.subtitle[locale]}
        />

        {/* <details>/<summary> — natyviai prieinama klaviatūra ir ekrano
            skaitytuvams; auditas P2 #18 to ir prašė vietoj <div> akordeono. */}
        <div className="mx-auto mt-14 max-w-3xl space-y-3">
          {faq.items.map((item, index) => (
            <details
              key={index}
              className="group overflow-hidden rounded-tile bg-white ring-1 ring-ink-100 transition-shadow open:shadow-tile"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-6 font-bold text-ink-950 marker:hidden [&::-webkit-details-marker]:hidden">
                <span className="text-pretty">{item.question[locale]}</span>
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
              <RichText html={item.answerHtml[locale]} className="px-6 pb-6 text-ink-600" />
            </details>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Button href={routeFor('faq', locale)} variant="outline" className="group">
            {faq.ctaLabel[locale]}
            <ArrowRight />
          </Button>
        </div>
      </Container>
    </Section>
  );
}

/* --------------------------------------------------------------- Kontaktai */

export function ContactSection({ locale }: { locale: Locale }) {
  const ui = getUi(locale);
  const { contact } = HOME;

  return (
    <Section id="contact" tone="dark" className="relative isolate overflow-hidden">
      <div className="absolute inset-0 bg-tile-grid opacity-40" aria-hidden="true" />

      <Container className="relative">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-start lg:gap-16">
          <div>
            <h2 className="text-3xl font-extrabold text-balance text-white sm:text-4xl md:text-5xl">
              {contact.title[locale]}
            </h2>
            <p className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-ink-300">
              {contact.text[locale]}
            </p>

            <dl className="mt-10 space-y-5">
              <div className="flex flex-wrap items-baseline gap-x-3">
                <dt className="font-bold text-white">{ui.contact.phone}</dt>
                <dd>
                  <a
                    href={`tel:${BUSINESS.phone}`}
                    className="text-xl font-extrabold text-brand-300 transition-colors hover:text-brand-200"
                  >
                    {BUSINESS.phoneDisplay}
                  </a>
                </dd>
              </div>
              <div className="flex flex-wrap items-baseline gap-x-3">
                <dt className="font-bold text-white">{ui.contact.email}</dt>
                <dd>
                  <a
                    href={`mailto:${BUSINESS.email}`}
                    className="text-ink-200 underline underline-offset-2 transition-colors hover:text-white"
                  >
                    {BUSINESS.email}
                  </a>
                </dd>
              </div>
              <div className="flex flex-wrap items-baseline gap-x-3">
                <dt className="font-bold text-white">{ui.contact.master}</dt>
                <dd className="text-ink-200">{BUSINESS.masterName}</dd>
              </div>
            </dl>

            <a
              href={BUSINESS.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex items-center gap-2.5 rounded-xl bg-white/10 px-5 py-3 font-semibold text-white ring-1 ring-white/20 transition-colors hover:bg-white/20"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-5">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              {BUSINESS.masterName} (Facebook)
            </a>
          </div>

          <div className="rounded-tile bg-white p-7 shadow-lift sm:p-9">
            <ContactForm locale={locale} />
          </div>
        </div>
      </Container>
    </Section>
  );
}
