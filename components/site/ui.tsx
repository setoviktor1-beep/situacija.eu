import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';

export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}

export function Container({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn('mx-auto w-full max-w-6xl px-5 sm:px-6 lg:px-8', className)}>{children}</div>;
}

export function Section({
  id,
  children,
  className,
  tone = 'light',
}: {
  id?: string;
  children: ReactNode;
  className?: string;
  tone?: 'light' | 'sand' | 'dark';
}) {
  const tones = {
    light: 'bg-white',
    sand: 'bg-sand-50 border-y border-ink-100',
    dark: 'bg-ink-950 text-ink-100',
  };
  return (
    <section id={id} className={cn('scroll-mt-24 py-20 md:py-28', tones[tone], className)}>
      {children}
    </section>
  );
}

export function Badge({
  children,
  tone = 'light',
}: {
  children: ReactNode;
  tone?: 'light' | 'dark';
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold tracking-wide uppercase',
        tone === 'dark'
          ? 'bg-brand-400/15 text-brand-300 ring-1 ring-brand-400/30'
          : 'bg-brand-50 text-brand-800 ring-1 ring-brand-200',
      )}
    >
      {children}
    </span>
  );
}

/** Sekcijos antraštės blokas: ženkliukas + H2 + paaiškinimas. */
export function SectionHeading({
  badge,
  title,
  subtitle,
  tone = 'light',
  align = 'center',
  as: Heading = 'h2',
}: {
  badge?: string;
  title: string;
  subtitle?: string;
  tone?: 'light' | 'dark';
  align?: 'center' | 'left';
  as?: 'h1' | 'h2';
}) {
  return (
    <div className={cn('max-w-3xl', align === 'center' && 'mx-auto text-center')}>
      {badge ? <Badge tone={tone}>{badge}</Badge> : null}
      <Heading
        className={cn(
          'mt-5 text-balance text-3xl leading-[1.1] font-extrabold tracking-tight sm:text-4xl md:text-5xl',
          tone === 'dark' ? 'text-white' : 'text-ink-950',
        )}
      >
        {title}
      </Heading>
      {subtitle ? (
        <p
          className={cn(
            'mt-5 text-pretty text-lg leading-relaxed',
            tone === 'dark' ? 'text-ink-300' : 'text-ink-500',
          )}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'onDark';

const BUTTON_STYLES: Record<ButtonVariant, string> = {
  // brand-700 = #0f766e, 5,47:1 ant balto — atitinka WCAG AA (audito P1 #12)
  primary: 'bg-brand-700 text-white hover:bg-brand-800 shadow-tile',
  outline: 'ring-2 ring-brand-700 text-brand-800 hover:bg-brand-50',
  ghost: 'text-ink-700 hover:bg-ink-50',
  onDark: 'bg-white text-ink-950 hover:bg-ink-100',
};

const BUTTON_BASE =
  'inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-base font-bold transition-colors duration-200 ease-out-tile';

export function Button({
  href,
  variant = 'primary',
  className,
  children,
  ...rest
}: {
  href: string;
  variant?: ButtonVariant;
  className?: string;
  children: ReactNode;
} & Omit<ComponentProps<typeof Link>, 'href' | 'className'>) {
  const styles = cn(BUTTON_BASE, BUTTON_STYLES[variant], className);

  // Išorinės nuorodos (tel:, mailto:, http) — paprastas <a>
  if (/^(?:https?:|tel:|mailto:)/.test(href)) {
    return (
      <a href={href} className={styles}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={styles} {...rest}>
      {children}
    </Link>
  );
}

export function ButtonElement({
  variant = 'primary',
  className,
  children,
  ...rest
}: {
  variant?: ButtonVariant;
  className?: string;
  children: ReactNode;
} & ComponentProps<'button'>) {
  return (
    <button className={cn(BUTTON_BASE, BUTTON_STYLES[variant], className)} {...rest}>
      {children}
    </button>
  );
}

export function Card({
  children,
  className,
  as: Tag = 'div',
}: {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'article' | 'li';
}) {
  return (
    <Tag
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-tile bg-white ring-1 ring-ink-100',
        'shadow-tile transition-all duration-300 ease-out-tile hover:-translate-y-1 hover:shadow-lift hover:ring-brand-200',
        className,
      )}
    >
      {children}
    </Tag>
  );
}

/** Rodyklė nuorodose — atskirta, kad tekstas liktų nepakeistas. */
export function ArrowRight({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      className={cn('size-4 transition-transform duration-200 group-hover:translate-x-1', className)}
    >
      <path
        d="M4 10h12m0 0-4.5-4.5M16 10l-4.5 4.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Paveldėtas HTML iš turinio modulių (pastraipos su <strong>, <a> ir pan.).
 * Turinys yra mūsų pačių, ne vartotojo įvestis.
 */
export function RichText({ html, className }: { html: string; className?: string }) {
  return (
    <div
      className={cn(
        'text-pretty leading-relaxed [&_a]:font-semibold [&_a]:text-brand-700 [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-brand-800 [&_strong]:font-bold [&_strong]:text-ink-900',
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
