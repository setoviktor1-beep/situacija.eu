// Vienkartinis įrankis: iš senų statinių HTML puslapių išpjauna struktūrizuotą
// turinį į JSON, kad jį būtų galima perkelti į TS turinio modulius nekeičiant teksto.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import * as cheerio from 'cheerio';

const PUBLIC_DIR = path.join(process.cwd(), 'legacy-html');

const files = [
  'vonios-kambario-plyteliu-klijavimas.html',
  'virtuves-plyteliu-klijavimas.html',
  'didelio-formato-plyteliu-klojimas.html',
  'klinkerio-klijavimas-fasadai.html',
  'kriaukles-is-plyteliu.html',
  'plyteliu-klojimas-pabrade.html',
  'plyteliu-klojimas-svencionys.html',
  'plyteliu-klojimas-vilnius.html',
  'gallery.html',
  'duk.html',
  'blogas.html',
  'privatumo-politika.html',
  ...readdirSync(path.join(PUBLIC_DIR, 'blogas')).map((f) => `blogas/${f}`),
];

const out = {};

for (const file of files) {
  const html = readFileSync(path.join(PUBLIC_DIR, file), 'utf8');
  const $ = cheerio.load(html);

  const meta = {
    title: $('title').text().trim(),
    description: $('meta[name="description"]').attr('content') || '',
    canonical: $('link[rel="canonical"]').attr('href') || '',
    ogType: $('meta[property="og:type"]').attr('content') || '',
  };

  const jsonLd = $('script[type="application/ld+json"]')
    .map((_, el) => {
      try {
        return JSON.parse($(el).contents().text());
      } catch {
        return null;
      }
    })
    .get()
    .filter(Boolean);

  // Nuosekli turinio seka: antraštės, pastraipos, sąrašai, nuotraukos
  const nodes = [];
  $('main, body')
    .first()
    .find('h1, h2, h3, h4, p, li, img, .faq-question, .faq-answer, .gallery-caption')
    .each((_, el) => {
      const $el = $(el);
      const tag = el.tagName.toLowerCase();

      // Praleidžiam header/footer/nav elementus
      if ($el.closest('header, footer, nav, .mobile-nav-panel').length) return;

      if (tag === 'img') {
        nodes.push({
          type: 'img',
          src: $el.attr('src'),
          alt: $el.attr('alt') || '',
          width: $el.attr('width') || null,
          height: $el.attr('height') || null,
        });
        return;
      }

      const text = $el.text().replace(/\s+/g, ' ').trim();
      if (!text) return;

      const cls = $el.attr('class') || '';
      const kind = cls.includes('faq-question')
        ? 'faq-q'
        : cls.includes('faq-answer')
          ? 'faq-a'
          : cls.includes('gallery-caption')
            ? 'caption'
            : tag;

      // Nesaugom pastraipų, kurios tik apgaubia jau įrašytą tekstą
      const last = nodes[nodes.length - 1];
      if (last && last.text === text) return;

      nodes.push({ type: kind, text, html: $el.html()?.trim() });
    });

  out[file] = { meta, jsonLd, nodes };
}

writeFileSync(
  path.join(process.cwd(), 'scripts', 'extracted-content.json'),
  JSON.stringify(out, null, 2),
  'utf8',
);

console.log(
  Object.entries(out)
    .map(([f, v]) => `${f}: ${v.nodes.length} nodes, ${v.jsonLd.length} json-ld`)
    .join('\n'),
);
