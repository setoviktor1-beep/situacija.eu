import {
  createPermission,
  createPolicy,
  createRole,
  readPermissions,
  readPolicies,
  readRoles,
  updatePermission,
  updatePolicy,
  updateRole,
} from '@directus/sdk';
import { createAdminClient } from './client.js';

type Crud = 'create' | 'read' | 'update' | 'delete';

async function main() {
  const client = await createAdminClient();

  async function ensureRole(name: string, icon: string, description: string) {
    const roles = await client.request(readRoles({ filter: { name: { _eq: name } }, limit: 1 } as any));
    if (roles[0]) {
      await client.request(updateRole(String(roles[0].id), { icon, description } as any));
      return roles[0];
    }
    return client.request(createRole({ name, icon, description } as any));
  }

  async function ensurePolicy(name: string, icon: string, description: string) {
    const policies = await client.request(readPolicies({ filter: { name: { _eq: name } }, limit: 1 } as any));
    const values = { icon, description, app_access: true, admin_access: false, enforce_tfa: false };
    if (policies[0]) {
      await client.request(updatePolicy(String(policies[0].id), values as any));
      return policies[0];
    }
    return client.request(createPolicy({ name, ...values } as any));
  }

  async function ensurePermission(policy: string, collection: string, action: Crud, fields: string[] = ['*']) {
    const existing = await client.request(readPermissions({
      filter: { _and: [{ policy: { _eq: policy } }, { collection: { _eq: collection } }, { action: { _eq: action } }] },
      limit: 1,
    } as any));
    const values = {
      policy,
      collection,
      action,
      permissions: null,
      validation: null,
      presets: null,
      fields,
    };
    if (existing[0]) {
      await client.request(updatePermission(Number(existing[0].id), values as any));
      return;
    }
    await client.request(createPermission(values as any));
  }

  async function ensureRolePolicy(role: string, policy: string) {
    const existing = await client.request((() => ({
      path: '/access',
      method: 'GET',
      params: { filter: { _and: [{ role: { _eq: role } }, { policy: { _eq: policy } }] }, limit: 1 },
    })) as any) as Array<{ id: string }>;
    if (existing[0]) return existing[0];
    return client.request((() => ({
      path: '/access',
      method: 'POST',
      body: JSON.stringify({ role, policy, sort: 1 }),
      headers: { 'Content-Type': 'application/json' },
    })) as any);
  }

  const klientasRole = await ensureRole(
    'Klientas', 'person',
    'Gali saugiai redaguoti svetainės turinį, bet negali keisti sistemos nustatymų ar trinti turinio.',
  );
  const redaktoriusRole = await ensureRole(
    'Redaktorius', 'edit',
    'Gali redaguoti puslapius, blokus, paslaugas ir galeriją, bet nemato bendrų nustatymų bei meniu.',
  );
  const klientasPolicy = await ensurePolicy(
    'CMS klientas', 'person',
    'Ribota prieiga prie turinio, failų, užklausų ir ataskaitų. Sistemos administravimas neleidžiamas.',
  );
  const redaktoriusPolicy = await ensurePolicy(
    'CMS redaktorius', 'edit',
    'Turinio redagavimas be prieigos prie bendrų svetainės nustatymų ir navigacijos.',
  );

  const klientasRoleId = String(klientasRole.id);
  const redaktoriusRoleId = String(redaktoriusRole.id);
  const klientasPolicyId = String(klientasPolicy.id);
  const redaktoriusPolicyId = String(redaktoriusPolicy.id);

  await ensureRolePolicy(klientasRoleId, klientasPolicyId);
  await ensureRolePolicy(redaktoriusRoleId, redaktoriusPolicyId);

  const blocks = [
    'block_hero', 'block_richtext', 'block_text_image', 'block_features',
    'block_gallery', 'block_cta', 'block_faq', 'block_testimonials',
    'block_pricing', 'block_contact_form', 'block_map', 'block_spacer',
    'page_sections', 'block_gallery_files', 'faq_items', 'seo',
  ];
  const sharedContent = ['pages', 'services', 'gallery', ...blocks];

  for (const policy of [klientasPolicyId, redaktoriusPolicyId]) {
    for (const collection of sharedContent) {
      for (const action of ['create', 'read', 'update'] as Crud[]) {
        await ensurePermission(policy, collection, action);
      }
    }
    await ensurePermission(policy, 'directus_files', 'create');
    await ensurePermission(policy, 'directus_files', 'read');
    await ensurePermission(policy, 'directus_files', 'update');
    await ensurePermission(policy, 'directus_folders', 'read');
    await ensurePermission(policy, 'forms_submissions', 'read');
    await ensurePermission(policy, 'redagavimo_instrukcija', 'read');
    await ensurePermission(policy, 'directus_dashboards', 'read');
    await ensurePermission(policy, 'directus_panels', 'read');
    await ensurePermission(policy, 'directus_activity', 'read');
    await ensurePermission(policy, 'directus_revisions', 'read');
    await ensurePermission(policy, 'directus_versions', 'create');
    await ensurePermission(policy, 'directus_versions', 'read');
    await ensurePermission(policy, 'directus_versions', 'update');
  }

  for (const collection of ['globals', 'navigation', 'navigation_items']) {
    for (const action of ['create', 'read', 'update'] as Crud[]) {
      await ensurePermission(klientasPolicyId, collection, action);
    }
  }

  console.log(JSON.stringify({
    status: 'ROLES_READY',
    roles: [
      { id: klientasRoleId, name: 'Klientas', policy: klientasPolicyId },
      { id: redaktoriusRoleId, name: 'Redaktorius', policy: redaktoriusPolicyId },
    ],
    deletePermissionsCreated: false,
    adminAccess: false,
    appAccess: true,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
