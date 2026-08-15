import {
  createFlow,
  createOperation,
  readFlows,
  readOperations,
  updateFlow,
  updateOperation,
} from '@directus/sdk';
import { createAdminClient } from './client.js';

const FLOW_NAME = 'Atnaujinti svetainę pakeitus turinį';
const OPERATION_KEY = 'atnaujinti_svetaines_turini';

async function main() {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) throw new Error('Trūksta REVALIDATE_SECRET aplinkos kintamojo.');
  const frontendUrl = (process.env.FRONTEND_URL || 'https://situacija.eu').replace(/\/$/, '');
  const client = await createAdminClient();

  const existingFlows = await client.request(readFlows({ filter: { name: { _eq: FLOW_NAME } }, limit: 1 } as any));
  const flowValues = {
    name: FLOW_NAME,
    icon: 'published_with_changes',
    color: '#149C95',
    description: 'Automatiškai atnaujina lankytojams rodomą puslapį, kai išsaugomas CMS turinys.',
    status: 'active',
    trigger: 'event',
    accountability: '$full',
    options: {
      type: 'action',
      scope: ['items.create', 'items.update', 'items.promote'],
      collections: [
        'pages', 'page_sections', 'globals', 'navigation', 'navigation_items',
        'services', 'gallery', 'seo', 'faq_items',
        'block_hero', 'block_richtext', 'block_text_image', 'block_features',
        'block_gallery', 'block_cta', 'block_faq', 'block_testimonials',
        'block_pricing', 'block_contact_form', 'block_map', 'block_spacer',
      ],
    },
  };
  const flow = existingFlows[0]
    ? await client.request(updateFlow(String(existingFlows[0].id), flowValues as any))
    : await client.request(createFlow(flowValues as any));
  const flowId = String(flow.id);

  const existingOperations = await client.request(readOperations({
    filter: { _and: [{ flow: { _eq: flowId } }, { key: { _eq: OPERATION_KEY } }] }, limit: 1,
  } as any));
  const operationValues = {
    name: 'Atnaujinti svetainės podėlį',
    key: OPERATION_KEY,
    type: 'request',
    flow: flowId,
    position_x: 19,
    position_y: 1,
    options: {
      method: 'POST',
      url: `${frontendUrl}/api/revalidate`,
      headers: [{ header: 'x-revalidate-secret', value: secret }],
      body: {
        collection: '{{$trigger.collection}}',
        keys: '{{$trigger.keys}}',
        event: '{{$trigger.event}}',
      },
    },
  };
  const operation = existingOperations[0]
    ? await client.request(updateOperation(String(existingOperations[0].id), operationValues as any))
    : await client.request(createOperation(operationValues as any));
  await client.request(updateFlow(flowId, { operation: String(operation.id) } as any));

  console.log(JSON.stringify({
    status: 'FLOW_READY', flow: FLOW_NAME, active: true,
    scopes: flowValues.options.scope, collections: flowValues.options.collections.length,
    endpoint: `${frontendUrl}/api/revalidate`,
  }, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
