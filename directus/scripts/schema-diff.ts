import { readFile } from 'node:fs/promises';
import path from 'node:path';
import YAML from 'yaml';
import { schemaDiff } from '@directus/sdk';
import { createAdminClient } from './client.js';

async function main() {
  const target = path.resolve('directus/schema/snapshot.yaml');
  const snapshot = YAML.parse(await readFile(target, 'utf8'));
  const client = await createAdminClient();
  const result = await client.request(schemaDiff(snapshot, { mode: 'merge' }));
  console.log(JSON.stringify(result
    ? { status: 'DIFF_READY', identical: false, hash: result.hash, diff: result.diff }
    : { status: 'DIFF_READY', identical: true, diff: null }, null, 2));
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
