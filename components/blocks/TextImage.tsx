import type { CmsBlock, FileRef } from '@/types/cms';
import { CmsImage, CtaLink, Html } from './shared';
export function TextImage({ block }: { block: CmsBlock }) { return <section className={`block text-image image-${String(block.image_position || 'right')}`}><div className="shell two-col"><div><h2>{String(block.headline || '')}</h2><Html value={block.content} /><CtaLink label={block.cta_label} url={block.cta_url} /></div><CmsImage file={block.image as FileRef} alt={String(block.headline || '')} /></div></section>; }
