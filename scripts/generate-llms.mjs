// Generuoja public/llms.txt iš to paties turinio šaltinio kaip ir svetainė (AEO).
// Įžanga perkelta pažodžiui iš ankstesnės versijos — turinys nekeičiamas.
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const src = readFileSync(path.join(ROOT, 'content/generated/pages.ts'), 'utf8');
const marker = 'export const GENERATED_PAGES = ';
const PAGES = JSON.parse(
  src.slice(src.indexOf(marker) + marker.length, src.lastIndexOf(' as const satisfies')),
);

const SITE = 'https://situacija.eu';

const INTRO = `# Situacija.eu

> Meistro Vladislav Finažonok plytelių klojimo ir apdailos paslaugos Pabradėje, Švenčionyse, Švenčionėliuose ir Vilniuje. 10+ metų patirtis, 300+ atliktų projektų.

Situacija.eu yra individualaus meistro Vladislav Finažonok verslo svetainė, teikianti profesionalias plytelių klijavimo, hidroizoliacijos ir apdailos paslaugas Lietuvoje, daugiausia Švenčionių rajone (Pabradė, Švenčionys, Švenčionėliai) ir Vilniuje bei jo apylinkėse pagal susitarimą.

Pagrindinės paslaugos:
- Vonios kambarių įrengimas: plytelių klijavimas, teptinė hidroizoliacija, dušo nuolydžių formavimas, 45° kampų suleidimas
- Virtuvės prijuostės ir grindys: sienelių/grindų klijavimas, tikslus rozečių išpjovimas vandens pjovimo technika
- Didelio formato akmens masės plytelių klojimas (60x120, 80x80, 120x120 cm) su TLS lyginimo sistema
- Individualios kriauklės iš plytelių: konstrukcija, hidroizoliacija, nuolydžiai, išleidimo mazgas ir 45° briaunos
- Fasadų, cokolio, tvorų ir židinių apdaila klinkerio plytelėmis

Veiklos teritorija: Pabradė (pagrindinė lokacija), Švenčionys, Švenčionėliai, visas Švenčionių rajonas; Vilnius ir Vilniaus rajonas pagal išankstinį susitarimą.

Kontaktai: tel. +370 600 30288, el. paštas v.finazonok@gmail.com

Svetainė veikia trimis kalbomis: lietuvių (/), lenkų (/pl) ir rusų (/ru).
`;

const ORDER = [
  ['bathroom', 'Paslaugos'],
  ['kitchen', 'Paslaugos'],
  ['largeFormat', 'Paslaugos'],
  ['clinker', 'Paslaugos'],
  ['sink', 'Paslaugos'],
  ['pabrade', 'Veiklos regionai'],
  ['svencionys', 'Veiklos regionai'],
  ['vilnius', 'Veiklos regionai'],
  ['gallery', 'Kita'],
  ['faq', 'Kita'],
  ['blog', 'Kita'],
  ['privacy', 'Kita'],
];

const sections = new Map();
for (const [key, group] of ORDER) {
  const page = PAGES[key];
  if (!page) continue;
  const h1 = page.blocks.lt.find((b) => b.type === 'heading' && b.level === 1);
  const title = h1?.text || page.meta.lt.title;
  if (!sections.has(group)) sections.set(group, []);
  sections.get(group).push(`- [${title}](${SITE}${page.routes.lt}): ${page.meta.lt.description}`);
}

const posts = Object.values(PAGES)
  .filter((p) => p.isBlogPost)
  .map((p) => {
    const h1 = p.blocks.lt.find((b) => b.type === 'heading' && b.level === 1);
    return `- [${h1?.text || p.meta.lt.title}](${SITE}${p.routes.lt}): ${p.meta.lt.description}`;
  });

let out = `${INTRO}
## Pagrindinis puslapis

- [Pagrindinis puslapis](${SITE}/): paslaugų apžvalga, patirtis, darbų eiga, veiklos geografija su žemėlapiu, galerija, D.U.K. ir kontaktai
`;

for (const [group, lines] of sections) {
  out += `\n## ${group}\n\n${lines.join('\n')}\n`;
}

out += `\n## Straipsniai\n\n${posts.join('\n')}\n`;

writeFileSync(path.join(ROOT, 'public/llms.txt'), out, 'utf8');
console.log(`llms.txt atnaujintas: ${out.split('\n').length} eilučių`);
