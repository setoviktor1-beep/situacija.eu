// Surenka visas LT eilutes, kurioms PL/RU vertimo dar nėra, į vieną failą vertimui.
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const src = readFileSync(path.join(ROOT, 'content/generated/pages.ts'), 'utf8');
const marker = 'export const GENERATED_PAGES = ';
const json = JSON.parse(
  src.slice(src.indexOf(marker) + marker.length, src.lastIndexOf(' as const satisfies')),
);

const strings = new Set();

function walk(block) {
  switch (block.type) {
    case 'heading':
    case 'caption':
      strings.add(block.text);
      break;
    case 'paragraph':
      strings.add(block.html || block.text);
      break;
    case 'list':
      block.items.forEach((i) => strings.add(i));
      break;
    case 'faq':
      block.items.forEach((i) => {
        strings.add(i.q);
        strings.add(i.a);
      });
      break;
    case 'image':
      if (block.alt) strings.add(block.alt);
      break;
  }
}

for (const page of Object.values(json)) {
  // Palyginam LT su PL: jei sutampa, vertimo nėra
  page.blocks.lt.forEach((ltBlock, idx) => {
    const plBlock = page.blocks.pl[idx];
    if (JSON.stringify(ltBlock) === JSON.stringify(plBlock)) walk(ltBlock);
  });
  strings.add(page.meta.lt.title);
  strings.add(page.meta.lt.description);
}

const list = [...strings].filter(Boolean).sort();
writeFileSync(path.join(ROOT, 'scripts/untranslated.json'), JSON.stringify(list, null, 2), 'utf8');
console.log(`Eilučių vertimui: ${list.length}`);
console.log(`Simbolių iš viso: ${list.join('').length}`);
