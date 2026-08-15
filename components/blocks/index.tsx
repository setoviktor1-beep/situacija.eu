import type { ComponentType } from 'react';
import type { CmsBlock } from '@/types/cms';
import { Hero } from './Hero'; import { RichText } from './RichText'; import { TextImage } from './TextImage'; import { Features } from './Features'; import { Gallery } from './Gallery'; import { CallToAction } from './CallToAction'; import { Faq } from './Faq'; import { Testimonials } from './Testimonials'; import { Pricing } from './Pricing'; import { ContactForm } from './ContactForm'; import { MapBlock } from './Map'; import { Spacer } from './Spacer';

const registry: Record<string, ComponentType<{ block: CmsBlock }>> = {
  block_hero: Hero, block_richtext: RichText, block_text_image: TextImage,
  block_features: Features, block_gallery: Gallery, block_cta: CallToAction,
  block_faq: Faq, block_testimonials: Testimonials, block_pricing: Pricing,
  block_contact_form: ContactForm, block_map: MapBlock, block_spacer: Spacer,
};

export function BlockRenderer({ blocks }: { blocks: CmsBlock[] }) {
  return <>{blocks.map((block, index) => { const Component = registry[block.collection]; if (!Component) { console.warn(`Nežinomas Directus blokas: ${block.collection}`); return null; } return <Component block={block} key={`${block.collection}-${block.id}-${index}`} />; })}</>;
}
