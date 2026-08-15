import type { Globals, NavigationItem } from '@/types/cms';

function hrefFor(item: NavigationItem) {
  if (item.url) return item.url;
  if (typeof item.page === 'object' && item.page?.slug) return item.page.slug === 'home' ? '/' : `/${item.page.slug}`;
  return '#';
}

export function SiteHeader({ globals, navigation }: { globals: Globals; navigation: NavigationItem[] }) {
  const items = navigation.length ? navigation : [
    { id: 1, label: 'Paslaugos', url: '/#services' },
    { id: 2, label: 'Apie meistrą', url: '/#about' },
    { id: 3, label: 'Darbų galerija', url: '/gallery.html' },
    { id: 4, label: 'D.U.K.', url: '/duk.html' },
    { id: 5, label: 'Kontaktai', url: '/#contact' },
  ];
  return <header className="site-header"><div className="shell nav-shell">
    <a className="brand" href="/">{globals.site_name || 'Situacija'}<span>.eu</span></a>
    <nav aria-label="Pagrindinis meniu">{items.map((item) => <div className="nav-item" key={item.id}>
      <a href={hrefFor(item)} target={item.open_new_tab ? '_blank' : undefined} rel={item.open_new_tab ? 'noreferrer' : undefined}>{item.label}</a>
      {!!item.children?.length && <div className="submenu">{item.children.map((child) => <a href={hrefFor(child)} key={child.id}>{child.label}</a>)}</div>}
    </div>)}</nav>
    {globals.phone && <a className="phone" href={`tel:${globals.phone.replace(/\s/g, '')}`}>☎ {globals.phone}</a>}
  </div></header>;
}
