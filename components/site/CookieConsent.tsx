'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { routeFor } from '@/content/routes';
import type { Locale } from '@/content/types';
import { getUi } from '@/content/ui';

const STORAGE_KEY = 'situacija-consent';

function updateConsent(granted: boolean) {
  // dataLayer tipą jau deklaruoja @next/third-parties
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push([
    'consent',
    'update',
    { analytics_storage: granted ? 'granted' : 'denied' },
  ]);
}

/**
 * Slapukų sutikimas su Google Consent Mode.
 * Abu mygtukai vienodo vizualinio svorio — auditas įvardijo ankstesnį
 * „Atmesti" kaip pabrauktą tekstą (švelnus dark pattern).
 * Juosta rodoma apačioje ir neuždengia hero CTA.
 */
export function CookieConsent({ locale }: { locale: Locale }) {
  const ui = getUi(locale);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch {
      // Privatus režimas be localStorage — juostos nerodom, analitika lieka išjungta
    }
  }, []);

  function decide(granted: boolean) {
    try {
      localStorage.setItem(STORAGE_KEY, granted ? 'granted' : 'denied');
    } catch {
      /* tyliai */
    }
    updateConsent(granted);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label={ui.cookie.text}
      className="fixed inset-x-0 bottom-0 z-90 border-t border-white/10 bg-ink-950/95 backdrop-blur-md"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-5 py-4 sm:px-6 lg:flex-row lg:items-center lg:gap-8 lg:px-8">
        <p className="flex-1 text-sm leading-relaxed text-ink-200">
          {ui.cookie.text}{' '}
          <Link
            href={routeFor('privacy', locale)}
            className="font-semibold text-brand-300 underline underline-offset-2 hover:text-brand-200"
          >
            {ui.cookie.policy}
          </Link>
        </p>
        <div className="flex shrink-0 gap-3">
          <button
            type="button"
            onClick={() => decide(false)}
            className="flex-1 rounded-xl px-5 py-2.5 text-sm font-bold text-white ring-1 ring-white/30 transition-colors hover:bg-white/10 lg:flex-none"
          >
            {ui.cookie.decline}
          </button>
          <button
            type="button"
            onClick={() => decide(true)}
            className="flex-1 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-500 lg:flex-none"
          >
            {ui.cookie.accept}
          </button>
        </div>
      </div>
    </div>
  );
}
