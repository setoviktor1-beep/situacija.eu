import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import YAML from 'yaml';
import { schemaSnapshot } from '@directus/sdk';
import { createAdminClient } from './client.js';

async function main() {
  const client = await createAdminClient();
  const snapshot = await client.request(schemaSnapshot());
  const target = path.resolve('directus/schema/snapshot.yaml');
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, YAML.stringify(snapshot), 'utf8');
  console.log(JSON.stringify({ status: 'SNAPSHOT_SAVED', target, collections: snapshot.collections.length }, null, 2));
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
