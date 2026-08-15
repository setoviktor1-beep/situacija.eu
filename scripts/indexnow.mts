/**
 * IndexNow: praneša Bing / Yandex apie pasikeitusius adresus, užuot laukus crawl'o.
 *
 * Siunčiami tik tie puslapiai, kurių turinys realiai pasikeitė — palyginama
 * content/lastmod.json maiša su paskutinio siuntimo būsena
 * (content/indexnow-state.json). Taip protokolas nepiktnaudžiaujamas.
 *
 * Naudojimas:
 *   npx tsx scripts/indexnow.ts          — siunčia pasikeitusius
 *   npx tsx scripts/indexnow.ts --all    — siunčia visus (pvz. pirmą kartą)
 *   npx tsx scripts/indexnow.ts --dry    — tik parodo, ko siųstų
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { SITE_URL } from '../content/site';
import { LOCALES } from '../content/types';
import { allRoutes } from '../lib/site-routing';

const ROOT = process.cwd();
const KEY = '7457fe59b58ee02f0fcb3770cd468a1e';
const ENDPOINT = 'https://api.indexnow.org/indexnow';
const STATE_FILE = path.join(ROOT, 'content/indexnow-state.json');

type LastmodStore = Record<string, { hash: string; date: string }>;
type StateStore = Record<string, string>;

const lastmod: LastmodStore = JSON.parse(
  readFileSync(path.join(ROOT, 'content/lastmod.json'), 'utf8'),
);

let state: StateStore = {};
try {
  state = JSON.parse(readFileSync(STATE_FILE, 'utf8'));
} catch {
  // Pirmas paleidimas — būsenos dar nėra
}

const all = process.argv.includes('--all');
const dry = process.argv.includes('--dry');

/** Puslapio raktas -> visų kalbų adresai. */
const urlsByKey = new Map<string, string[]>();
for (const { path: routePath, match } of allRoutes()) {
  const key =
    match.kind === 'home' ? 'home' : match.kind === 'post' ? `post:${match.ltSlug}` : match.pageKey;
  const list = urlsByKey.get(key) ?? [];
  list.push(new URL(routePath, SITE_URL).toString());
  urlsByKey.set(key, list);
}

const changedKeys = Object.keys(lastmod).filter(
  (key) => all || state[key] !== lastmod[key].hash,
);

const urlList = changedKeys.flatMap((key) => urlsByKey.get(key) ?? []);

if (!urlList.length) {
  console.log('Pasikeitusių adresų nėra — nieko nesiunčiam.');
  process.exit(0);
}

console.log(`Puslapių pasikeitė: ${changedKeys.length}, adresų (${LOCALES.length} kalbos): ${urlList.length}`);

if (dry) {
  urlList.slice(0, 10).forEach((url) => console.log('  ', url));
  if (urlList.length > 10) console.log(`   … dar ${urlList.length - 10}`);
  process.exit(0);
}

const host = new URL(SITE_URL).hostname;

const response = await fetch(ENDPOINT, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({
    host,
    key: KEY,
    keyLocation: `${SITE_URL}/${KEY}.txt`,
    urlList,
  }),
});

// 200 = priimta, 202 = priimta, raktas dar tikrinamas
if (response.status !== 200 && response.status !== 202) {
  console.error(`IndexNow atmetė: ${response.status} ${await response.text()}`);
  process.exit(1);
}

for (const key of changedKeys) state[key] = lastmod[key].hash;
writeFileSync(STATE_FILE, `${JSON.stringify(state, null, 1)}\n`, 'utf8');

console.log(`IndexNow atsakė ${response.status}. Būsena išsaugota.`);
