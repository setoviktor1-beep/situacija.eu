import { draftMode } from 'next/headers';
import { notFound } from 'next/navigation';
import { BlockRenderer } from '@/components/blocks';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { LegacyHome } from '@/components/LegacyHome';
import { getGlobals, getNavigation, getPage } from '@/lib/directus';

export async function CmsPageView({ slug, version }: { slug: string; version?: string }) {
  const draft = (await draftMode()).isEnabled;
  const [page, globals, navigation] = await Promise.all([getPage(slug, draft, version), getGlobals(draft), getNavigation(draft)]);
  if (!page) notFound();
  if (slug === 'home' && page.sections.length === 0) return <LegacyHome />;
  return <><SiteHeader globals={globals} navigation={navigation} /><main><BlockRenderer blocks={page.sections} /></main><SiteFooter globals={globals} /></>;
}
