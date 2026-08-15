import type { CmsBlock } from '@/types/cms';
import { Html } from './shared';
export function RichText({ block }: { block: CmsBlock }) { return <section className={`block richtext width-${String(block.max_width || 'medium')} align-${String(block.align || 'left')}`}><div className="shell"><Html value={block.content} /></div></section>; }
