import Image from 'next/image';
import { assetUrl } from '@/lib/directus';
import type { FileRef } from '@/types/cms';

export function CmsImage({ file, alt, className = '' }: { file: FileRef; alt: string; className?: string }) {
  const src = assetUrl(file);
  if (!src) return null;
  return <Image className={className} src={src} alt={alt} width={1600} height={1000} sizes="(max-width: 800px) 100vw, 50vw" />;
}

export function Html({ value }: { value?: unknown }) {
  return <div className="rich-html" dangerouslySetInnerHTML={{ __html: typeof value === 'string' ? value : '' }} />;
}

export function CtaLink({ label, url }: { label?: unknown; url?: unknown }) {
  if (typeof label !== 'string' || typeof url !== 'string' || !label || !url) return null;
  return <a className="button" href={url}>{label}</a>;
}
