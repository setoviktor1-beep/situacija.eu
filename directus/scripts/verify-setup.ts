import { readCollections, readField, readPermissions, readPolicies, readRoles } from '@directus/sdk';
import { createAdminClient } from './client.js';

const blockCollections = [
  'block_hero', 'block_richtext', 'block_text_image', 'block_features',
  'block_gallery', 'block_cta', 'block_faq', 'block_testimonials',
  'block_pricing', 'block_contact_form', 'block_map', 'block_spacer',
];

function invariant(value: unknown, message: string): asserts value {
  if (!value) throw new Error(`PATIKRA NEPAVYKO: ${message}`);
}

async function main() {
  const client = await createAdminClient();
  const [collections, roles, policies, permissions] = await Promise.all([
    client.request(readCollections()),
    client.request(readRoles()),
    client.request(readPolicies()),
    client.request(readPermissions()),
  ]);

  const byCollection = new Map(collections.map((item) => [String(item.collection), item as any]));
  for (const name of blockCollections) {
    const collection = byCollection.get(name);
    invariant(collection, `nerasta kolekcija ${name}`);
    invariant(collection.meta?.hidden === true, `${name} turi būti paslėpta šoninėje juostoje`);
    invariant(collection.meta?.icon, `${name} neturi ikonos`);
    invariant(collection.meta?.color, `${name} neturi spalvos`);
    invariant(collection.meta?.display_template?.includes('{{title}}'), `${name} sąraše nerodo pavadinimo`);
  }

  for (const group of ['content_group', 'appearance_group', 'seo_group', 'settings_group']) {
    const field = await client.request(readField('pages', group)) as any;
    invariant(field?.type === 'alias' && field.meta?.special?.includes('group'), `pages trūksta grupės ${group}`);
  }

  const klientasRole = roles.find((role) => role.name === 'Klientas');
  const redaktoriusRole = roles.find((role) => role.name === 'Redaktorius');
  const klientasPolicy = policies.find((policy) => policy.name === 'CMS klientas');
  const redaktoriusPolicy = policies.find((policy) => policy.name === 'CMS redaktorius');
  invariant(klientasRole && redaktoriusRole, 'nerastos abi redaktorių rolės');
  invariant(klientasPolicy && redaktoriusPolicy, 'nerastos abi ribotos politikos');
  invariant(klientasPolicy.app_access && !klientasPolicy.admin_access, 'Kliento politikos prieiga neteisinga');
  invariant(redaktoriusPolicy.app_access && !redaktoriusPolicy.admin_access, 'Redaktoriaus politikos prieiga neteisinga');

  const restrictedPolicyIds = new Set([String(klientasPolicy.id), String(redaktoriusPolicy.id)]);
  const restricted = permissions.filter((permission) => restrictedPolicyIds.has(String(permission.policy)));
  invariant(!restricted.some((permission) => permission.action === 'delete'), 'ribotai rolei suteikta trynimo teisė');
  invariant(!restricted.some((permission) => permission.collection === 'directus_users'), 'ribotai rolei matomi vartotojai');
  invariant(!restricted.some((permission) => permission.collection === 'directus_roles'), 'ribotai rolei matomos rolės');
  invariant(!restricted.some((permission) => permission.collection === 'directus_flows'), 'ribotai rolei matomi procesai');
  invariant(!permissions.some((permission) => String(permission.policy) === String(redaktoriusPolicy.id) && ['globals', 'navigation', 'navigation_items'].includes(String(permission.collection))), 'Redaktorius gavo prieigą prie bendrų nustatymų');

  const pageItems = await client.request((() => ({
    path: '/items/pages', method: 'GET', params: { fields: ['id', 'title', 'slug', 'status'], limit: -1 },
  })) as any) as Array<Record<string, unknown>>;

  console.log(JSON.stringify({
    status: 'VERIFY_OK',
    blockCollections: blockCollections.length,
    pageGroups: 4,
    roles: [klientasRole.name, redaktoriusRole.name],
    restrictedPermissions: restricted.length,
    deletePermissions: 0,
    existingPages: pageItems,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
