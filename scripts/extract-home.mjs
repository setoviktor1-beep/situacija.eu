// Iš senojo index.html išpjauna STRUKTŪRIZUOTĄ pagrindinio puslapio turinį
// (korteles, statistiką, darbų eigą, D.U.K.) ir išverčia PL/RU esamu žodynu.
// Pagrindinio puslapio frazės žodyne padengtos pilnai — jos ir buvo verčiamos senojoje svetainėje.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { applyLastmod, loadLastmod, saveLastmod } from './lastmod.mjs';
import path from 'node:path';
import * as cheerio from 'cheerio';

const ROOT = process.cwd();
const $ = cheerio.load(readFileSync(path.join(ROOT, 'legacy-html/legacy-home.html'), 'utf8'));
const i18nSrc = readFileSync(path.join(ROOT, 'legacy-html/i18n.js'), 'utf8');

function grabObject(name) {
  const marker = `const ${name} = {`;
  const start = i18nSrc.indexOf(marker);
  const braceStart = i18nSrc.indexOf('{', start);
  let depth = 0;
  let inStr = null;
  for (let i = braceStart; i < i18nSrc.length; i++) {
    const ch = i18nSrc[i];
    if (inStr) {
      if (ch === inStr && i18nSrc[i - 1] !== '\\') inStr = null;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') inStr = ch;
    else if (ch === '{') depth++;
    else if (ch === '}' && --depth === 0) {
      // eslint-disable-next-line no-eval
      return eval(`(${i18nSrc.slice(braceStart, i + 1)})`);
    }
  }
}

const DICT = { lt: null, pl: grabObject('PL'), ru: grabObject('RU') };
const ATTRS = grabObject('ATTRIBUTE_TRANSLATIONS');
const missing = new Set();

/** Papildomi vertimai vidiniams tekstams; failo gali ir nebūti. */
let EXTRA = {};
try {
  EXTRA = JSON.parse(readFileSync(path.join(ROOT, 'content/translations.json'), 'utf8'));
} catch {
  console.warn('Įspėjimas: content/translations.json nerastas.');
}

function t(text, locale) {
  if (!text) return text;
  if (locale === 'lt') return text;
  const dict = DICT[locale];
  const trimmed = text.trim();
  if (dict[trimmed]) return dict[trimmed];
  if (EXTRA[trimmed]?.[locale]) return EXTRA[trimmed][locale];
  const numbered = trimmed.match(/^(\d+\.\s*)(.+)$/);
  if (numbered && dict[numbered[2]]) return `${numbered[1]}${dict[numbered[2]]}`;
  missing.add(trimmed);
  return text;
}

function tAttr(text, locale) {
  if (!text || locale === 'lt') return text;
  return (
    ATTRS[locale]?.[text] ||
    DICT[locale][text] ||
    EXTRA[text]?.[locale] ||
    (missing.add(text), text)
  );
}

/** Sukuria { lt, pl, ru } objektą iš vienos LT eilutės. */
const L = (text) => ({ lt: text, pl: t(text, 'pl'), ru: t(text, 'ru') });
const LAttr = (text) => ({ lt: text, pl: tAttr(text, 'pl'), ru: tAttr(text, 'ru') });

const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();
const stripArrow = (s) => clean(s).replace(/\s*(?:→|&rarr;)\s*$/, '');

// ---- Hero -------------------------------------------------------------
const hero = {
  badge: L(clean($('.hero .badge').first().text())),
  title: L(clean($('#hero-title').text())),
  subtitleHtml: L(clean($('#hero-subtitle').html())),
  stats: $('.hero .stat-card')
    .map((_, el) => ({
      number: L(clean($(el).find('.stat-number').text())),
      label: L(clean($(el).find('.stat-label').text())),
    }))
    .get(),
};

// ---- Paslaugos --------------------------------------------------------
const servicesSection = $('#services').first();
const services = {
  badge: L(clean(servicesSection.find('.badge').first().text())),
  title: L(clean(servicesSection.find('.section-title').first().text())),
  subtitle: L(clean(servicesSection.find('.section-subtitle').first().text())),
  items: servicesSection
    .find('.service-card')
    .map((_, el) => {
      const $el = $(el);
      const $img = $el.find('img').first();
      const $link = $el.find('a').first();
      return {
        image: $img.attr('src') ? `/${$img.attr('src')}` : null,
        alt: LAttr($img.attr('alt') || ''),
        width: Number($img.attr('width')) || null,
        height: Number($img.attr('height')) || null,
        title: L(clean($el.find('h3').text())),
        text: L(clean($el.find('p').first().text())),
        href: $link.attr('href') || null,
        linkLabel: L(stripArrow($link.text())),
      };
    })
    .get(),
};

// ---- Apie meistrą + darbų eiga ----------------------------------------
const about = {
  badge: L(clean($('#about .badge').first().text())),
  title: L(clean($('#about .section-title').first().text())),
  subtitle: L(clean($('#about .section-subtitle').first().text())),
  leadTitle: L(clean($('#about .rich-text-block h3').first().text())),
  paragraphs: $('#about .rich-text-block > p')
    .map((_, el) => L(clean($(el).html())))
    .get(),
  features: $('#about .feature-item')
    .map((_, el) => {
      const $el = $(el);
      const strong = clean($el.find('strong').text()).replace(/:$/, '');
      const full = clean($el.find('div').last().text());
      return {
        title: L(strong),
        text: L(clean(full.replace(/^.*?:\s*/, ''))),
      };
    })
    .get(),
  workflowTitle: L(clean($('#about h3').last().text())),
  workflow: $('#about .workflow-step')
    .map((_, el) => ({
      number: clean($(el).find('.step-number').text()),
      title: L(clean($(el).find('h4').text())),
      text: L(clean($(el).find('p').text())),
    }))
    .get(),
};

// ---- Regionai ---------------------------------------------------------
const regionsSection = $('#regions').first();
const regions = {
  badge: L(clean(regionsSection.find('.badge').first().text())),
  title: L(clean(regionsSection.find('.section-title').first().text())),
  subtitle: L(clean(regionsSection.find('.section-subtitle').first().text())),
  items: regionsSection
    .find('.service-card')
    .map((_, el) => {
      const $el = $(el);
      const $link = $el.find('a').first();
      return {
        icon: clean($el.find('.icon').text()),
        title: L(clean($el.find('h3').text())),
        text: L(clean($el.find('p').first().text())),
        href: $link.attr('href') || null,
        linkLabel: L(stripArrow($link.text())),
      };
    })
    .get(),
};

// ---- Galerija ---------------------------------------------------------
const gallerySection = $('#gallery').first();
const gallery = {
  badge: L(clean(gallerySection.find('.badge').first().text())),
  title: L(clean(gallerySection.find('.section-title').first().text())),
  subtitle: L(clean(gallerySection.find('.section-subtitle').first().text())),
  ctaLabel: L(stripArrow(gallerySection.find('.btn').last().text())),
  items: gallerySection
    .find('.gallery-item')
    .map((_, el) => {
      const $el = $(el);
      const $img = $el.find('img').first();
      return {
        src: `/${$img.attr('src')}`,
        alt: LAttr($img.attr('alt') || ''),
        caption: L(clean($el.find('.gallery-caption').text())),
      };
    })
    .get(),
};

// ---- Blogas -----------------------------------------------------------
const blogSection = $('#blog').first();
const blog = {
  badge: L(clean(blogSection.find('.badge').first().text())),
  title: L(clean(blogSection.find('.section-title').first().text())),
  subtitle: L(clean(blogSection.find('.section-subtitle').first().text())),
  ctaLabel: L(stripArrow(blogSection.find('.btn').last().text())),
  items: blogSection
    .find('.service-card')
    .map((_, el) => {
      const $el = $(el);
      const $img = $el.find('img').first();
      const $link = $el.find('a').first();
      return {
        src: `/${$img.attr('src')}`,
        alt: LAttr($img.attr('alt') || ''),
        tag: L(clean($el.find('.badge').text())),
        title: L(clean($el.find('h3').text())),
        text: L(clean($el.find('p').first().text())),
        href: $link.attr('href') || null,
      };
    })
    .get(),
};

// ---- D.U.K. -----------------------------------------------------------
const faqSection = $('#faq').first();
const faq = {
  badge: L(clean(faqSection.find('.badge').first().text())),
  title: L(clean(faqSection.find('.section-title').first().text())),
  subtitle: L(clean(faqSection.find('.section-subtitle').first().text())),
  ctaLabel: L(stripArrow(faqSection.find('.btn').last().text())),
  items: faqSection
    .find('.faq-item')
    .map((_, el) => {
      const $el = $(el);
      const q = clean($el.find('.faq-question').text()).replace(/^\d+\.\s*/, '');
      return {
        question: L(q),
        answerHtml: L(clean($el.find('.faq-answer').html())),
      };
    })
    .get(),
};

// ---- Kontaktai --------------------------------------------------------
const contactSection = $('#contact').first();
const contact = {
  title: L(clean(contactSection.find('h2').first().text())),
  text: L(clean(contactSection.find('.contact-info > p').first().text())),
};

const data = { hero, services, about, regions, gallery, blog, faq, contact };

mkdirSync(path.join(ROOT, 'content/generated'), { recursive: true });
writeFileSync(
  path.join(ROOT, 'content/generated/home.ts'),
  `// AUTOMATIŠKAI SUGENERUOTA — nekeisti ranka.
// Šaltinis: public/legacy-home.html + PL/RU žodynas (public/i18n.js).
// Perkurti: node scripts/extract-home.mjs
import type { HomeContent } from '../home-types';

export const HOME = ${JSON.stringify(data, null, 2)} as const satisfies HomeContent;
`,
  'utf8',
);

// <lastmod> pagrindiniam puslapiui — keičiasi tik pasikeitus jo turiniui
const lastmodStore = loadLastmod(ROOT);
const { changed: homeChanged } = applyLastmod(lastmodStore, { home: data });
saveLastmod(ROOT, lastmodStore);
if (homeChanged.length) console.log('Pagrindinio puslapio lastmod atnaujintas');

console.log(`Hero statistikų: ${hero.stats.length}`);
console.log(`Paslaugų: ${services.items.length}, regionų: ${regions.items.length}`);
console.log(`Galerijos: ${gallery.items.length}, blogo: ${blog.items.length}, D.U.K.: ${faq.items.length}`);
console.log(`Darbų eigos žingsnių: ${about.workflow.length}, privalumų: ${about.features.length}`);
if (missing.size) {
  writeFileSync(
    path.join(ROOT, 'scripts/home-missing-translations.json'),
    JSON.stringify([...missing], null, 2),
    'utf8',
  );
  console.log(`Be vertimo: ${missing.size} (įrašyta į scripts/home-missing-translations.json)`);
}
