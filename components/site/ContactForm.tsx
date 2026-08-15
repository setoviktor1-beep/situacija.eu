'use client';

import Link from 'next/link';
import { useId, useState } from 'react';
import { routeFor } from '@/content/routes';
import type { Locale } from '@/content/types';
import { getUi } from '@/content/ui';
import { ButtonElement } from './ui';

export function ContactForm({ locale }: { locale: Locale }) {
  const ui = getUi(locale);
  const ids = useId();
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setState('sending');
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.get('name'),
          phone: data.get('phone'),
          message: data.get('message'),
        }),
      });
      if (!response.ok) throw new Error('request failed');
      setState('sent');
      form.reset();
    } catch {
      setState('error');
    }
  }

  const field =
    'w-full rounded-xl border border-ink-200 bg-white px-4 py-3 text-base text-ink-900 placeholder:text-ink-400 transition-colors focus:border-brand-600 focus:ring-2 focus:ring-brand-600/25 focus:outline-none';
  const label = 'block text-sm font-bold text-ink-800';

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate={false}>
      <h3 className="text-xl font-extrabold text-ink-950">{ui.form.title}</h3>

      <div>
        <label htmlFor={`${ids}-name`} className={label}>
          {ui.form.name}
        </label>
        <input
          id={`${ids}-name`}
          name="name"
          type="text"
          required
          autoComplete="name"
          placeholder={ui.form.namePlaceholder}
          className={`mt-2 ${field}`}
        />
      </div>

      <div>
        <label htmlFor={`${ids}-phone`} className={label}>
          {ui.form.phone}
        </label>
        <input
          id={`${ids}-phone`}
          name="phone"
          type="tel"
          required
          autoComplete="tel"
          placeholder={ui.form.phonePlaceholder}
          className={`mt-2 ${field}`}
        />
      </div>

      <div>
        <label htmlFor={`${ids}-message`} className={label}>
          {ui.form.message}
        </label>
        <textarea
          id={`${ids}-message`}
          name="message"
          rows={4}
          placeholder={ui.form.messagePlaceholder}
          className={`mt-2 ${field} resize-y`}
        />
      </div>

      <ButtonElement type="submit" disabled={state === 'sending'} className="w-full disabled:opacity-70">
        {state === 'sending' ? ui.form.sending : ui.form.submit}
      </ButtonElement>

      {/* aria-live — pranešimas perskaitomas ekrano skaitytuvu iškart po išsiuntimo */}
      <p aria-live="polite" className="min-h-6 text-sm font-semibold">
        {state === 'sent' ? <span className="text-brand-700">{ui.form.success}</span> : null}
        {state === 'error' ? <span className="text-clay-600">{ui.form.error}</span> : null}
      </p>

      <p className="text-xs leading-relaxed text-ink-500">
        {ui.form.consent}{' '}
        <Link
          href={routeFor('privacy', locale)}
          className="font-semibold text-brand-700 underline underline-offset-2"
        >
          {ui.footer.privacy}
        </Link>
      </p>
    </form>
  );
}
