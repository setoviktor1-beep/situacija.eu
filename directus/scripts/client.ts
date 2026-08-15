import {
  authentication,
  createDirectus,
  rest,
  staticToken,
} from '@directus/sdk';

export type CmsSchema = Record<string, Record<string, unknown>[]>;

export async function createAdminClient() {
  const url = process.env.DIRECTUS_URL;
  if (!url) throw new Error('Trūksta DIRECTUS_URL aplinkos kintamojo.');

  if (process.env.DIRECTUS_ADMIN_TOKEN) {
    return createDirectus<CmsSchema>(url)
      .with(staticToken(process.env.DIRECTUS_ADMIN_TOKEN))
      .with(rest());
  }

  const email = process.env.DIRECTUS_ADMIN_EMAIL;
  const password = process.env.DIRECTUS_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error(
      'Nurodykite DIRECTUS_ADMIN_TOKEN arba DIRECTUS_ADMIN_EMAIL ir DIRECTUS_ADMIN_PASSWORD.',
    );
  }

  const client = createDirectus<CmsSchema>(url)
    .with(authentication('json'))
    .with(rest());
  await client.login({ email, password });
  return client;
}

export function lietuviskasPavadinimas(
  translation: string,
  singular = translation,
  plural = translation,
) {
  return [
    { language: 'lt-LT', translation, singular, plural },
    { language: 'en-US', translation, singular, plural },
  ];
}

export function lietuviskasLaukas(translation: string) {
  return [
    { language: 'lt-LT', translation },
    { language: 'en-US', translation },
  ];
}
