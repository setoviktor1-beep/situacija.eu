import { createHash } from 'node:crypto';
import type { CmsBlock, CmsPage, FileRef, Globals, NavigationItem } from '@/types/cms';

const directusUrl = (process.env.DIRECTUS_URL || 'http://situacija-directus-app:8055').replace(/\/$/, '');
const publicUrl = (process.env.DIRECTUS_PUBLIC_URL || 'https://situacija.sitestudio.lt').replace(/\/$/, '');

function tokens() {
  const token = process.env.DIRECTUS_STATIC_TOKEN;
  if (!token) return [null];
  return [token, createHash('sha256').update(token).digest('hex')];
}

async function directusFetch<T>(path: string, options: RequestInit & { draft?: boolean } = {}): Promise<T> {
  let lastError = 'Directus užklausa nepavyko';
  for (const token of tokens()) {
    const response = await fetch(`${directusUrl}${path}`, {
      ...options,
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
      cache: options.draft ? 'no-store' : options.cache,
      next: options.draft ? undefined : { revalidate: 300, tags: ['directus-content'] },
    } as RequestInit);
    if (response.ok) return (await response.json()).data as T;
    lastError = `${response.status} ${await response.text()}`;
    if (response.status !== 401 && response.status !== 403) break;
  }
  throw new Error(lastError);
}

function normalizeSections(value: unknown): CmsBlock[] {
  if (!Array.isArray(value)) return [];
  return value
    .slice()
    .sort((a, b) => Number(a?.sort || 0) - Number(b?.sort || 0))
    .flatMap((relation) => {
      const collection = String(relation?.collection || '');
      const item = relation?.item;
      if (!collection || !item || typeof item !== 'object') return [];
      return [{ ...item, collection } as CmsBlock];
    });
}

export async function getPage(slug: string, draft = false, version?: string | null): Promise<CmsPage | null> {
  const query = new URLSearchParams({
    limit: '1',
    fields: 'id,title,slug,status,seo_id.*,sections.id,sections.sort,sections.collection,sections.item.*.*',
    'filter[slug][_eq]': slug,
  });
  if (!draft) query.set('filter[status][_eq]', 'published');
  if (version) query.set('version', version);
  const pages = await directusFetch<Array<Omit<CmsPage, 'sections'> & { sections?: unknown }>>(`/items/pages?${query}`, { draft });
  if (!pages[0]) return null;
  return { ...pages[0], sections: normalizeSections(pages[0].sections) };
}

export async function getGlobals(draft = false): Promise<Globals> {
  try {
    return await directusFetch<Globals>('/items/globals?fields=*', { draft });
  } catch {
    return {};
  }
}

export async function getNavigation(draft = false): Promise<NavigationItem[]> {
  try {
    const rows = await directusFetch<Array<{ items?: NavigationItem[] }>>('/items/navigation?fields=items.*,items.page.slug&limit=1', { draft });
    const items = rows?.[0]?.items || [];
    const roots = items.filter((item) => !item.parent);
    return roots.map((item) => ({ ...item, children: items.filter((child) => String(child.parent) === String(item.id)) }));
  } catch {
    return [];
  }
}

export function assetUrl(file: FileRef, width = 1600) {
  const id = typeof file === 'object' && file ? file.id : file;
  return id ? `${publicUrl}/assets/${encodeURIComponent(id)}?width=${width}&format=webp&quality=82` : null;
}

export async function submitContact(payload: Record<string, unknown>) {
  return directusFetch('/items/forms_submissions', { method: 'POST', body: JSON.stringify(payload), cache: 'no-store' });
}
