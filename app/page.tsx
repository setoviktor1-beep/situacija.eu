import type { Metadata } from 'next';
import { CmsPageView } from './cms-page';
import { getPage } from '@/lib/directus';

export async function generateMetadata(): Promise<Metadata> { const page = await getPage('home'); const seo = typeof page?.seo_id === 'object' ? page.seo_id : null; return { title: seo?.meta_title || page?.title || 'Plytelių klojimas', description: seo?.meta_description, robots: seo?.no_index ? { index: false, follow: false } : undefined }; }
export default async function Home({ searchParams }: { searchParams: Promise<{ version?: string }> }) { const { version } = await searchParams; return <CmsPageView slug="home" version={version} />; }
