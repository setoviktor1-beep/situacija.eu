'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { BUSINESS, LOCALE_META } from '@/content/site';
import { routeFor } from '@/content/routes';
import type { Locale, Localized } from '@/content/types';
import { getUi } from '@/content/ui';
import { cn } from './ui';

/**
 * Vieninga antraštė visuose puslapiuose (audito P1 #10 — meniu ir kalbų
 * perjungiklis anksčiau trūko dalyje vidinių puslapių).
 */
export function SiteHeader({
  locale,
  alternates,
}: {
  locale: Locale;
  /** Šio paties puslapio adresai kitomis kalbomis (hreflang atitikmenys). */
  alternates: Localized<string>;
}) {
  const ui = getUi(locale);
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const home = routeFor('home', locale);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Užrakina foną, kai atidarytas mobilus meniu
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const nav = [
    { href: `${home}#services`, label: ui.nav.services },
    { href: `${home}#about`, label: ui.nav.about },
    { href: `${home}#regions`, label: ui.nav.regions },
    { href: routeFor('gallery', locale), label: ui.nav.gallery },
    { href: routeFor('faq', locale), label: ui.nav.faq },
    { href: `${home}#contact`, label: ui.nav.contact },
  ];

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-100 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:font-bold focus:text-ink-950"
      >
        {ui.skipToContent}
      </a>

      <header
        className={cn(
          'sticky top-0 z-50 transition-all duration-300 ease-out-tile',
          scrolled
            ? 'bg-ink-950/90 shadow-lg backdrop-blur-md supports-backdrop-filter:bg-ink-950/75'
            : 'bg-ink-950',
        )}
      >
        <div className="mx-auto flex h-18 w-full max-w-6xl items-center gap-4 px-5 sm:px-6 lg:px-8">
          <Link
            href={home}
            className="text-xl font-extrabold tracking-tight text-white sm:text-2xl"
            onClick={() => setOpen(false)}
          >
            Situacija<span className="text-brand-400">.eu</span>
          </Link>

          <nav aria-label={ui.nav.services} className="ml-auto hidden lg:block">
            <ul className="flex items-center gap-7">
              {nav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-[15px] font-semibold text-ink-200 transition-colors hover:text-brand-300"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <LanguageSwitcher locale={locale} alternates={alternates} label={ui.languageLabel} />

          <a
            href={`tel:${BUSINESS.phone}`}
            className="hidden shrink-0 items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-500 sm:inline-flex"
          >
            <PhoneIcon />
            <span className="hidden xl:inline">{BUSINESS.phoneDisplay}</span>
            <span className="xl:hidden">{ui.cta.call}</span>
          </a>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? ui.closeMenu : ui.openMenu}
            className="-mr-2 inline-flex size-11 items-center justify-center rounded-lg text-white lg:hidden"
          >
            <BurgerIcon open={open} />
          </button>
        </div>

        <div
          id="mobile-nav"
          hidden={!open}
          className="border-t border-white/10 bg-ink-950 lg:hidden"
        >
          <nav aria-label={ui.nav.services} className="px-5 py-4 sm:px-6">
            <ul className="flex flex-col">
              {nav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="block border-b border-white/5 py-3.5 text-lg font-semibold text-ink-100 transition-colors hover:text-brand-300"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <a
              href={`tel:${BUSINESS.phone}`}
              className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3.5 text-base font-bold text-white"
            >
              <PhoneIcon />
              {BUSINESS.phoneDisplay}
            </a>
          </nav>
        </div>
      </header>
    </>
  );
}

function LanguageSwitcher({
  locale,
  alternates,
  label,
}: {
  locale: Locale;
  alternates: Localized<string>;
  label: string;
}) {
  return (
    <div className="ml-auto flex items-center gap-0.5 lg:ml-0" role="group" aria-label={label}>
      {(Object.keys(LOCALE_META) as Locale[]).map((code) => {
        const active = code === locale;
        return (
          <Link
            key={code}
            href={alternates[code]}
            hrefLang={code}
            aria-current={active ? 'true' : undefined}
            className={cn(
              'rounded-md px-2 py-1.5 text-xs font-bold transition-colors',
              active ? 'bg-white/15 text-white' : 'text-ink-300 hover:bg-white/10 hover:text-white',
            )}
          >
            {LOCALE_META[code].label}
          </Link>
        );
      })}
    </div>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="size-4">
      <path d="M2 4.5A2.5 2.5 0 0 1 4.5 2h1.2a1.5 1.5 0 0 1 1.44 1.09l.55 1.9a1.5 1.5 0 0 1-.4 1.5l-.9.9a11.5 11.5 0 0 0 4.72 4.72l.9-.9a1.5 1.5 0 0 1 1.5-.4l1.9.55A1.5 1.5 0 0 1 18 12.8V14a2.5 2.5 0 0 1-2.5 2.5h-.5C7.82 16.5 2 10.68 2 3.5v-.5Z" />
    </svg>
  );
}

function BurgerIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="size-6">
      <path
        d={open ? 'M6 6l12 12M18 6L6 18' : 'M3 6h18M3 12h18M3 18h18'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
