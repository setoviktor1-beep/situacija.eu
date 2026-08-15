// Patikimas <lastmod> sitemap'ui.
//
// Data keičiama TIK tada, kai realiai pasikeičia puslapio turinys: skaičiuojama
// turinio maiša ir lyginama su ankstesne. Jei maiša ta pati — data lieka sena.
// Taip išvengiama audito nurodytos klaidos, kai lastmod perrašomas kasdien ir
// Google nustoja juo tikėti.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const FILE = 'content/lastmod.json';

export function loadLastmod(root) {
  try {
    return JSON.parse(readFileSync(path.join(root, FILE), 'utf8'));
  } catch {
    return {};
  }
}

export function hashContent(value) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, 16);
}

/**
 * Atnaujina įrašus pagal turinio maišą.
 * @returns {{ store: object, changed: string[] }}
 */
export function applyLastmod(store, entries, today = new Date().toISOString().slice(0, 10)) {
  const changed = [];
  for (const [key, value] of Object.entries(entries)) {
    const hash = hashContent(value);
    const previous = store[key];
    if (!previous || previous.hash !== hash) {
      store[key] = { hash, date: today };
      changed.push(key);
    }
  }
  return { store, changed };
}

export function saveLastmod(root, store) {
  const sorted = Object.fromEntries(Object.entries(store).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(path.join(root, FILE), `${JSON.stringify(sorted, null, 1)}\n`, 'utf8');
}
