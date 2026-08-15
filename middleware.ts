import { NextResponse, type NextRequest } from 'next/server';

/**
 * Paieškos robotų lankymosi žurnalas.
 *
 * Traefik access logai šiame serveryje neįjungti, todėl apie robotų elgesį
 * nebuvo jokių duomenų. Čia rašoma viena JSON eilutė į stdout, matoma per
 * `docker logs`. Liečia tik situacija.eu — bendra serverio infrastruktūra
 * nekeičiama.
 */
const CRAWLERS: { name: string; test: RegExp }[] = [
  { name: 'googlebot', test: /googlebot/i },
  { name: 'bingbot', test: /bingbot|adidxbot/i },
  { name: 'yandex', test: /yandex(bot|images)/i },
  { name: 'duckduckgo', test: /duckduckbot/i },
  { name: 'applebot', test: /applebot/i },
  { name: 'facebook', test: /facebookexternalhit|facebot/i },
  // AI / atsakymų varikliai — svarbu AEO stebėsenai
  { name: 'gptbot', test: /gptbot/i },
  { name: 'oai-searchbot', test: /oai-searchbot/i },
  { name: 'chatgpt-user', test: /chatgpt-user/i },
  { name: 'claudebot', test: /claudebot|anthropic-ai/i },
  { name: 'perplexity', test: /perplexitybot/i },
  { name: 'ccbot', test: /ccbot/i },
];

function identify(userAgent: string): string | null {
  for (const crawler of CRAWLERS) {
    if (crawler.test.test(userAgent)) return crawler.name;
  }
  return null;
}

export function middleware(request: NextRequest) {
  const userAgent = request.headers.get('user-agent') ?? '';
  const bot = identify(userAgent);

  if (bot) {
    console.log(
      JSON.stringify({
        tag: 'crawler',
        bot,
        path: request.nextUrl.pathname,
        at: new Date().toISOString(),
      }),
    );
  }

  return NextResponse.next();
}

export const config = {
  // Neįtraukiam statinių resursų — domina tik puslapiai ir SEO failai
  matcher: ['/((?!_next/static|_next/image|images/).*)'],
};
