import { assetUrl } from '@/lib/directus';
import type { CmsBlock, FileRef } from '@/types/cms';
import { CtaLink } from './shared';

export function Hero({ block }: { block: CmsBlock }) {
  const image = assetUrl(block.background_image as FileRef);
  const opacity = Math.min(100, Math.max(0, Number(block.overlay_opacity ?? 55))) / 100;
  return <section className={`block hero height-${String(block.height || 'medium')}`} style={image ? { backgroundImage: `linear-gradient(rgba(5,15,35,${opacity}),rgba(5,15,35,${opacity})),url(${image})` } : undefined}>
    <div className="shell hero-inner"><p className="eyebrow">Aukščiausios klasės apdailos meistras</p><h1>{String(block.headline || '')}</h1><p>{String(block.subheadline || '')}</p><div className="actions"><CtaLink label={block.cta_primary_label} url={block.cta_primary_url} /><CtaLink label={block.cta_secondary_label} url={block.cta_secondary_url} /></div></div>
  </section>;
}
