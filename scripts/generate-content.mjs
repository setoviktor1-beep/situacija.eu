// Generatorius: iš senų statinių HTML puslapių (scripts/extracted-content.json)
// ir esamo PL/RU žodyno (public/i18n.js) sukuria tipizuotus turinio modulius.
//
// Esminė taisyklė: TEKSTAS NEKEIČIAMAS. LT tekstas perkeliamas pažodžiui,
// PL/RU verčiamas tuo pačiu frazių žodynu, kurį naudojo senoji svetainė,
// todėl vertimų turinys sutampa su tuo, kas jau buvo publikuota.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const extracted = JSON.parse(readFileSync(path.join(ROOT, 'scripts/extracted-content.json'), 'utf8'));
const i18nSrc = readFileSync(path.join(ROOT, 'legacy-html/i18n.js'), 'utf8');

/** Ištraukia objekto literalą iš i18n.js pagal kintamojo vardą. */
function grabObject(name) {
  const marker = `const ${name} = {`;
  const start = i18nSrc.indexOf(marker);
  if (start === -1) throw new Error(`Nerastas ${name} i18n.js faile`);
  const braceStart = i18nSrc.indexOf('{', start);
  let depth = 0;
  let inStr = null;
  for (let i = braceStart; i < i18nSrc.length; i++) {
    const ch = i18nSrc[i];
    const prev = i18nSrc[i - 1];
    if (inStr) {
      if (ch === inStr && prev !== '\\') inStr = null;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') inStr = ch;
    else if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        // eslint-disable-next-line no-eval
        return eval(`(${i18nSrc.slice(braceStart, i + 1)})`);
      }
    }
  }
  throw new Error(`Nepavyko perskaityti ${name}`);
}

const PL = grabObject('PL');
const RU = grabObject('RU');
const META = grabObject('META');
const ATTRS = grabObject('ATTRIBUTE_TRANSLATIONS');

const DICT = { lt: null, pl: PL, ru: RU };

/**
 * Papildomi vertimai (content/translations.json) — jie padengia vidinius
 * puslapius, kurių senasis žodynas nevertė. Failo gali ir nebūti.
 */
let EXTRA = {};
try {
  EXTRA = JSON.parse(readFileSync(path.join(ROOT, 'content/translations.json'), 'utf8'));
} catch {
  console.warn('Įspėjimas: content/translations.json nerastas — PL/RU liks dalinai lietuviški.');
}

/** Verčia vieną tekstą tuo pačiu principu kaip senoji i18n.js (tiksli frazė + „N. " prefiksas). */
function translate(text, locale) {
  if (locale === 'lt' || !text) return text;
  const dict = DICT[locale];
  const trimmed = text.trim();
  if (dict[trimmed]) return dict[trimmed];
  if (EXTRA[trimmed]?.[locale]) return EXTRA[trimmed][locale];
  if (EXTRA[text]?.[locale]) return EXTRA[text][locale];
  const numbered = trimmed.match(/^(\d+\.\s*)(.+)$/);
  if (numbered && dict[numbered[2]]) return `${numbered[1]}${dict[numbered[2]]}`;
  // „+" priesaga atsirasdavo iš FAQ akordeono ikonos
  const noPlus = trimmed.replace(/\+$/, '').trim();
  if (dict[noPlus]) return dict[noPlus];
  return text;
}

function translateAttr(text, locale) {
  if (locale === 'lt' || !text) return text;
  return ATTRS[locale]?.[text] || DICT[locale][text] || EXTRA[text]?.[locale] || text;
}

/**
 * URL struktūra. Esami LT adresai paliekami NEPAKEISTI (SEO tęstinumas —
 * auditas juos įvertino teigiamai). PL/RU adresai imami iš i18n.js ten, kur
 * jie jau buvo apibrėžti; paslaugoms ir blogui sukuriami tos pačios stilistikos.
 */
const ROUTES = {
  home: { lt: '/', pl: '/pl', ru: '/ru' },
  gallery: { lt: '/gallery.html', pl: '/pl/galeria.html', ru: '/ru/galereya.html' },
  faq: { lt: '/duk.html', pl: '/pl/faq.html', ru: '/ru/faq.html' },
  privacy: {
    lt: '/privatumo-politika.html',
    pl: '/pl/polityka-prywatnosci.html',
    ru: '/ru/politika-konfidencialnosti.html',
  },
  pabrade: {
    lt: '/plyteliu-klojimas-pabrade.html',
    pl: '/pl/ukladanie-plytek-pabrade.html',
    ru: '/ru/ukladka-plitki-pabrade.html',
  },
  svencionys: {
    lt: '/plyteliu-klojimas-svencionys.html',
    pl: '/pl/ukladanie-plytek-svencionys.html',
    ru: '/ru/ukladka-plitki-svencionys.html',
  },
  vilnius: {
    lt: '/plyteliu-klojimas-vilnius.html',
    pl: '/pl/ukladanie-plytek-wilno.html',
    ru: '/ru/ukladka-plitki-vilnius.html',
  },
  blog: { lt: '/blogas.html', pl: '/pl/blog.html', ru: '/ru/blog.html' },
  bathroom: {
    lt: '/vonios-kambario-plyteliu-klijavimas.html',
    pl: '/pl/ukladanie-plytek-lazienka.html',
    ru: '/ru/ukladka-plitki-vannaya.html',
  },
  kitchen: {
    lt: '/virtuves-plyteliu-klijavimas.html',
    pl: '/pl/ukladanie-plytek-kuchnia.html',
    ru: '/ru/ukladka-plitki-kuhnya.html',
  },
  largeFormat: {
    lt: '/didelio-formato-plyteliu-klojimas.html',
    pl: '/pl/ukladanie-plytek-wielkoformatowych.html',
    ru: '/ru/ukladka-krupnoformatnoy-plitki.html',
  },
  clinker: {
    lt: '/klinkerio-klijavimas-fasadai.html',
    pl: '/pl/plytki-klinkierowe-elewacja.html',
    ru: '/ru/klinkernaya-plitka-fasad.html',
  },
  sink: {
    lt: '/kriaukles-is-plyteliu.html',
    pl: '/pl/umywalki-z-plytek.html',
    ru: '/ru/rakoviny-iz-plitki.html',
  },
};

/** Blogo straipsniai — LT slug'as jau egzistuoja, PL/RU sukuriami pagal jį. */
const BLOG_SLUG_TRANSLATIONS = {
  'didelio-formato-plyteliu-klojimo-ypatumai': {
    pl: 'ukladanie-plytek-wielkoformatowych-specyfika',
    ru: 'osobennosti-ukladki-krupnoformatnoy-plitki',
  },
  'didelio-formato-plyteliu-montavimas-ir-klaidos': {
    pl: 'montaz-plytek-wielkoformatowych-bledy',
    ru: 'montazh-krupnoformatnoy-plitki-oshibki',
  },
  'kaip-pasirinkti-plyteles-voniai': {
    pl: 'jak-wybrac-plytki-do-lazienki',
    ru: 'kak-vybrat-plitku-dlya-vannoy',
  },
  'klinkerio-fasado-ir-cokolio-apdaila': {
    pl: 'elewacja-i-cokol-z-klinkieru',
    ru: 'otdelka-fasada-i-tsokolya-klinkerom',
  },
  'plyteliu-klijavimo-kainos-samata-pabrade-svencionys': {
    pl: 'wycena-ukladania-plytek-pabrade-svencionys',
    ru: 'smeta-ukladki-plitki-pabrade-svencionys',
  },
  'plyteliu-klojimo-kaina-pabrade-svencionys-vilnius': {
    pl: 'cena-ukladania-plytek-pabrade-svencionys-wilno',
    ru: 'tsena-ukladki-plitki-pabrade-svencionys-vilnius',
  },
  'vonios-hidroizoliacija-kodel-butina': {
    pl: 'hydroizolacja-lazienki-dlaczego-konieczna',
    ru: 'gidroizolyatsiya-vannoy-zachem-nuzhna',
  },
  'vonios-kambario-plyteliu-klojimas-vadovas': {
    pl: 'ukladanie-plytek-w-lazience-poradnik',
    ru: 'ukladka-plitki-v-vannoy-rukovodstvo',
  },
};

/** Failas -> puslapio raktas */
const FILE_TO_KEY = {
  'vonios-kambario-plyteliu-klijavimas.html': 'bathroom',
  'virtuves-plyteliu-klijavimas.html': 'kitchen',
  'didelio-formato-plyteliu-klojimas.html': 'largeFormat',
  'klinkerio-klijavimas-fasadai.html': 'clinker',
  'kriaukles-is-plyteliu.html': 'sink',
  'plyteliu-klojimas-pabrade.html': 'pabrade',
  'plyteliu-klojimas-svencionys.html': 'svencionys',
  'plyteliu-klojimas-vilnius.html': 'vilnius',
  'gallery.html': 'gallery',
  'duk.html': 'faq',
  'blogas.html': 'blog',
  'privatumo-politika.html': 'privacy',
};

const LOCALES = ['lt', 'pl', 'ru'];

/** Iš plokščio mazgų sąrašo sudaro semantinius blokus. */
function buildBlocks(nodes) {
  const blocks = [];
  let faqBuffer = null;

  for (const node of nodes) {
    if (node.type === 'faq-q') {
      if (!faqBuffer) faqBuffer = { type: 'faq', items: [] };
      faqBuffer.items.push({ q: node.text.replace(/\+$/, '').trim(), a: '' });
      continue;
    }
    if (node.type === 'faq-a') {
      if (faqBuffer?.items.length) {
        faqBuffer.items[faqBuffer.items.length - 1].a = node.text;
      }
      continue;
    }
    if (faqBuffer) {
      blocks.push(faqBuffer);
      faqBuffer = null;
    }

    if (node.type === 'img') {
      blocks.push({
        type: 'image',
        src: node.src?.startsWith('/') ? node.src : `/${node.src}`,
        alt: node.alt,
        width: node.width ? Number(node.width) : null,
        height: node.height ? Number(node.height) : null,
      });
      continue;
    }
    if (node.type === 'caption') {
      blocks.push({ type: 'caption', text: node.text });
      continue;
    }
    if (/^h[1-4]$/.test(node.type)) {
      blocks.push({ type: 'heading', level: Number(node.type[1]), text: node.text });
      continue;
    }
    if (node.type === 'p') {
      blocks.push({ type: 'paragraph', text: node.text, html: node.html ?? node.text });
      continue;
    }
    if (node.type === 'li') {
      const last = blocks[blocks.length - 1];
      if (last?.type === 'list') last.items.push(node.text);
      else blocks.push({ type: 'list', items: [node.text] });
      continue;
    }
  }
  if (faqBuffer) blocks.push(faqBuffer);
  return blocks;
}

/** Išverčia bloką į nurodytą kalbą. */
function localizeBlock(block, locale) {
  switch (block.type) {
    case 'heading':
      return { ...block, text: translate(block.text, locale) };
    case 'paragraph':
      return { ...block, text: translate(block.text, locale), html: translate(block.html, locale) };
    case 'list':
      return { ...block, items: block.items.map((i) => translate(i, locale)) };
    case 'caption':
      return { ...block, text: translate(block.text, locale) };
    case 'image':
      return { ...block, alt: translateAttr(block.alt, locale) };
    case 'faq':
      return {
        ...block,
        items: block.items.map((i) => ({
          q: translate(i.q, locale),
          a: translate(i.a, locale),
        })),
      };
    default:
      return block;
  }
}

const pages = {};
let untranslated = { pl: 0, ru: 0, total: 0 };

for (const [file, data] of Object.entries(extracted)) {
  const isBlogPost = file.startsWith('blogas/');
  const ltSlug = isBlogPost ? path.basename(file, '.html') : null;
  const key = isBlogPost ? `post:${ltSlug}` : FILE_TO_KEY[file];
  if (!key) continue;

  const routes = isBlogPost
    ? {
        lt: `/blogas/${ltSlug}.html`,
        pl: `/pl/blog/${BLOG_SLUG_TRANSLATIONS[ltSlug].pl}.html`,
        ru: `/ru/blog/${BLOG_SLUG_TRANSLATIONS[ltSlug].ru}.html`,
      }
    : ROUTES[key];

  const ltBlocks = buildBlocks(data.nodes);

  const metaKey = FILE_TO_KEY[file];
  const meta = {};
  const blocks = {};
  for (const locale of LOCALES) {
    const fromDict = META[locale]?.[metaKey];
    meta[locale] = {
      title: fromDict?.title || translate(data.meta.title.replace(/\s*\|\s*Situacija\.eu$/, ''), locale),
      description: fromDict?.description || translate(data.meta.description, locale),
    };
    blocks[locale] = ltBlocks.map((b) => localizeBlock(b, locale));

    if (locale !== 'lt') {
      for (let i = 0; i < ltBlocks.length; i++) {
        const before = JSON.stringify(ltBlocks[i]);
        const after = JSON.stringify(blocks[locale][i]);
        if (before === after && ltBlocks[i].type !== 'image') untranslated[locale]++;
        if (ltBlocks[i].type !== 'image') untranslated.total++;
      }
    }
  }

  pages[key] = { key, isBlogPost, ltSlug, routes, meta, blocks, jsonLd: data.jsonLd };
}

mkdirSync(path.join(ROOT, 'content/generated'), { recursive: true });

const header = `// AUTOMATIŠKAI SUGENERUOTA — nekeisti ranka.
// Šaltinis: senieji statiniai HTML puslapiai (public/*.html) + PL/RU žodynas (public/i18n.js).
// Perkurti: node scripts/extract-content.mjs && node scripts/generate-content.mjs
import type { GeneratedPage } from '../types';

export const GENERATED_PAGES = `;

writeFileSync(
  path.join(ROOT, 'content/generated/pages.ts'),
  `${header}${JSON.stringify(pages, null, 2)} as const satisfies Record<string, GeneratedPage>;\n`,
  'utf8',
);

console.log(`Sugeneruota puslapių: ${Object.keys(pages).length}`);
console.log(`Blokų be vertimo: PL ${untranslated.pl}/${untranslated.total / 2}, RU ${untranslated.ru}/${untranslated.total / 2}`);
