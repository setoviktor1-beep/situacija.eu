import { draftMode } from 'next/headers';
import { redirect } from 'next/navigation';

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const secret = params.get('secret');
  const slug = params.get('slug') || 'home';
  const version = params.get('version');
  if (!process.env.PREVIEW_SECRET || secret !== process.env.PREVIEW_SECRET) return new Response('Neteisingas peržiūros raktas.', { status: 401 });
  (await draftMode()).enable();
  const path = slug === 'home' ? '/' : `/${encodeURIComponent(slug)}`;
  redirect(version ? `${path}?version=${encodeURIComponent(version)}` : path);
}
