import type { Globals } from '@/types/cms';

export function SiteFooter({ globals }: { globals: Globals }) {
  return <footer className="site-footer"><div className="shell footer-grid">
    <div><strong>{globals.site_name || 'Situacija.eu'}</strong><p>Profesionalūs plytelių klijavimo ir apdailos darbai.</p></div>
    <div><strong>Kontaktai</strong>{globals.phone && <a href={`tel:${globals.phone.replace(/\s/g, '')}`}>{globals.phone}</a>}{globals.email && <a href={`mailto:${globals.email}`}>{globals.email}</a>}{globals.address && <span>{globals.address}</span>}</div>
    <div><strong>Darbo laikas</strong><span>{globals.working_hours || 'Susisiekite telefonu'}</span></div>
  </div></footer>;
}
