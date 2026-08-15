import type { Metadata } from 'next';
import { CmsPageView } from '../cms-page';
import { getPage } from '@/lib/directus';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const { slug } = await params; const page = await getPage(slug); const seo = typeof page?.seo_id === 'object' ? page.seo_id : null; return { title: seo?.meta_title || page?.title, description: seo?.meta_description, robots: seo?.no_index ? { index: false, follow: false } : undefined }; }
export default async function Page({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ version?: string }> }) { const [{ slug }, { version }] = await Promise.all([params, searchParams]); return <CmsPageView slug={slug} version={version} />; }
