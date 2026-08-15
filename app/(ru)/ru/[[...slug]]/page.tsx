import type { Metadata } from 'next';
import { SitePage, buildPageMetadata } from '@/components/site/SitePage';
import { localeRouteParams, withLocalePrefix } from '@/lib/site-routing';

// Nežinomi adresai grąžina 404, o ne bandomi generuoti vykdymo metu
export const dynamicParams = true;

export function generateStaticParams() {
  return localeRouteParams('ru');
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return buildPageMetadata(withLocalePrefix('ru', slug));
}

export default async function Page({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params;
  return <SitePage slug={withLocalePrefix('ru', slug)} />;
}
