import Link from 'next/link';
import { BUSINESS } from '@/content/site';
import { REGION_KEYS, ROUTES, SERVICE_KEYS, routeFor } from '@/content/routes';
import { GENERATED_PAGES } from '@/content/generated/pages';
import type { Locale } from '@/content/types';
import { getUi } from '@/content/ui';
import { Container } from './ui';

/**
 * Poraštė. Pagal auditą čia NĖRA viešos „CRM Login" nuorodos (P0 #3 —
 * ji atskleisdavo administravimo panelės adresą) ir yra privatumo politika (P0 #1).
 */
export function SiteFooter({ locale }: { locale: Locale }) {
  const ui = getUi(locale);
  const home = routeFor('home', locale);

  const serviceLinks = SERVICE_KEYS.map((key) => ({
    href: ROUTES[key][locale],
    label: GENERATED_PAGES[key].blocks[locale].find((b) => b.type === 'heading' && b.level === 1)
      ?.text as string | undefined,
  })).filter((l) => l.label);

  const regionLinks = REGION_KEYS.map((key) => ({
    href: ROUTES[key][locale],
    label: GENERATED_PAGES[key].blocks[locale].find((b) => b.type === 'heading' && b.level === 1)
      ?.text as string | undefined,
  })).filter((l) => l.label);

  return (
    <footer className="bg-ink-950 text-ink-300">
      <div className="h-1 bg-miter bg-brand-700/40" aria-hidden="true" />
      <Container className="py-14 md:py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href={home} className="text-2xl font-extrabold tracking-tight text-white">
              Situacija<span className="text-brand-400">.eu</span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-ink-400">
              {BUSINESS.masterName} — {BUSINESS.address.locality}, {BUSINESS.address.region}
            </p>
            <a
              href={BUSINESS.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-white/5 px-3.5 py-2 text-sm font-semibold text-ink-200 transition-colors hover:bg-white/10 hover:text-white"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-4">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Facebook
            </a>
          </div>

          <FooterColumn heading={ui.footer.servicesHeading} links={serviceLinks} />
          <FooterColumn heading={ui.nav.regions} links={regionLinks} />

          <div>
            <h2 className="text-sm font-bold tracking-wide text-white uppercase">
              {ui.footer.contactHeading}
            </h2>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <a
                  href={`tel:${BUSINESS.phone}`}
                  className="font-bold text-brand-300 transition-colors hover:text-brand-200"
                >
                  {BUSINESS.phoneDisplay}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${BUSINESS.email}`}
                  className="transition-colors hover:text-white"
                >
                  {BUSINESS.email}
                </a>
              </li>
            </ul>

            <h2 className="mt-8 text-sm font-bold tracking-wide text-white uppercase">
              {ui.footer.navHeading}
            </h2>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <Link href={routeFor('blog', locale)} className="transition-colors hover:text-white">
                  {ui.nav.blog}
                </Link>
              </li>
              <li>
                <Link href={routeFor('faq', locale)} className="transition-colors hover:text-white">
                  {ui.nav.faq}
                </Link>
              </li>
              <li>
                <Link
                  href={routeFor('privacy', locale)}
                  className="transition-colors hover:text-white"
                >
                  {ui.footer.privacy}
                </Link>
              </li>
              <li>
                <a href="/sitemap.xml" className="transition-colors hover:text-white">
                  {ui.footer.sitemap}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <p className="mt-12 border-t border-white/10 pt-8 text-sm text-ink-400">
          &copy; 2024–{new Date().getFullYear()} Situacija.eu. {ui.footer.rights}
        </p>
      </Container>
    </footer>
  );
}

function FooterColumn({
  heading,
  links,
}: {
  heading: string;
  links: { href: string; label?: string }[];
}) {
  return (
    <div>
      <h2 className="text-sm font-bold tracking-wide text-white uppercase">{heading}</h2>
      <ul className="mt-4 space-y-3 text-sm">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="transition-colors hover:text-white">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
