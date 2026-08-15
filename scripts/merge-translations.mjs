// Sulieja vertimų partiją į content/translations.json.
// Naudojimas: node scripts/merge-translations.mjs <pradinis-indeksas> <partijos.json>
//
// Partijos failas — masyvas ["lenkiškai", "rusiškai"] porų, tokia pat tvarka kaip
// scripts/todo-translations.json nuo nurodyto indekso. Raktai imami iš todo failo,
// todėl lietuviškos eilutės niekada neperrašomos ranka ir lieka baitas į baitą.
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const [startArg, batchPath] = process.argv.slice(2);
const start = Number(startArg);

const todo = JSON.parse(readFileSync(path.join(ROOT, 'scripts/todo-translations.json'), 'utf8'));
const batch = JSON.parse(readFileSync(path.join(ROOT, batchPath), 'utf8'));
const target = path.join(ROOT, 'content/translations.json');

const translations = JSON.parse(readFileSync(target, 'utf8'));

let added = 0;
batch.forEach((pair, offset) => {
  const key = todo[start + offset];
  if (key === undefined) throw new Error(`Nėra eilutės ties indeksu ${start + offset}`);
  const [pl, ru] = pair;
  if (!pl || !ru) throw new Error(`Tuščias vertimas ties indeksu ${start + offset}: ${key.slice(0, 60)}`);
  translations[key] = { pl, ru };
  added++;
});

writeFileSync(target, `${JSON.stringify(translations, null, 1)}\n`, 'utf8');

const remaining = todo.filter((s) => !(s in translations)).length;
console.log(`Pridėta ${added}. Iš viso ${Object.keys(translations).length}. Liko ${remaining}.`);
