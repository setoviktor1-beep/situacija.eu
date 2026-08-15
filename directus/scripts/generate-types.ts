import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { readCollections, readFields } from '@directus/sdk';
import { createAdminClient } from './client.js';

const cmsCollections = new Set([
  'pages', 'seo', 'globals', 'navigation', 'navigation_items', 'forms_submissions',
  'page_sections', 'faq_items', 'block_gallery_files', 'services', 'gallery',
  'block_hero', 'block_richtext', 'block_text_image', 'block_features', 'block_gallery',
  'block_cta', 'block_faq', 'block_testimonials', 'block_pricing',
  'block_contact_form', 'block_map', 'block_spacer',
]);

function tsType(type: string, special?: string[] | null) {
  if (special?.includes('m2a') || special?.includes('m2m') || special?.includes('o2m')) return 'unknown[]';
  if (special?.includes('m2o') || special?.includes('file')) return 'string | number | Record<string, unknown>';
  if (type === 'integer' || type === 'bigInteger' || type === 'float' || type === 'decimal') return 'number';
  if (type === 'boolean') return 'boolean';
  if (type === 'json') return 'unknown';
  if (type === 'alias') return 'unknown';
  return 'string';
}

function name(value: string) {
  return value.split('_').map((part) => part[0]?.toUpperCase() + part.slice(1)).join('');
}

async function main() {
  const client = await createAdminClient();
  const [collections, fields] = await Promise.all([client.request(readCollections()), client.request(readFields())]);
  const active = collections.map((item) => String(item.collection)).filter((item) => cmsCollections.has(item));
  const definitions = active.map((collection) => {
    const rows = fields.filter((field) => field.collection === collection);
    const lines = rows.map((field) => { const meta = field.meta as any; return `  ${JSON.stringify(String(field.field))}?: ${tsType(String(field.type), meta?.special as string[] | null)} | null;`; });
    return `export interface ${name(collection)} {\n${lines.join('\n')}\n}`;
  });
  const schema = `// Sugeneruota automatiškai iš Directus schemos. Neredaguokite rankomis.\n\n${definitions.join('\n\n')}\n\nexport interface DirectusSchema {\n${active.map((collection) => `  ${JSON.stringify(collection)}: ${name(collection)}[];`).join('\n')}\n}\n`;
  const target = path.resolve('types/directus.generated.ts');
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, schema, 'utf8');
  console.log(JSON.stringify({ status: 'TYPES_GENERATED', collections: active.length, target }, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
