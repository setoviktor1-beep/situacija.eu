const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const SITE_URL = 'https://situacija.eu';
const ASSET_VERSION = '20260803d';
const DEFAULT_OG_IMAGE = `${SITE_URL}/images/img1.jpg`;
const DIRECTUS_URL = (process.env.DIRECTUS_URL || 'http://situacija-directus-app:8055').replace(/\/$/, '');
const DIRECTUS_ADMIN_URL = process.env.DIRECTUS_ADMIN_URL || 'https://situacija.sitestudio.lt/admin';
const DIRECTUS_TOKEN = process.env.DIRECTUS_STATIC_TOKEN
  ? crypto.createHash('sha256').update(process.env.DIRECTUS_STATIC_TOKEN).digest('hex')
  : null;

const PAGE_OVERRIDES = {
  '/': {
    title: 'Plytelių klojimas Pabradėje, Švenčionyse, Vilniuje | Meistras Vladislav',
    canonical: `${SITE_URL}/`,
  },
  '/gallery.html': {
    title: 'Plytelių klojimo darbų galerija | Situacija.eu',
    description: 'Meistro Vladislav atlikti plytelių klojimo, vonios apdailos, hidroizoliacijos ir klinkerio darbai Pabradėje, Švenčionyse ir Vilniuje.',
  },
};

app.disable('x-powered-by');
app.set('trust proxy', true);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  if (req.hostname === 'www.situacija.eu') {
    return res.redirect(301, `${SITE_URL}${req.originalUrl}`);
  }
  next();
});

async function directus(pathname, options = {}) {
  const response = await fetch(`${DIRECTUS_URL}${pathname}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(DIRECTUS_TOKEN ? { Authorization: `Bearer ${DIRECTUS_TOKEN}` } : {}),
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload?.errors?.[0]?.message || 'Directus užklausa nepavyko');
    error.status = response.status;
    throw error;
  }
  return payload;
}

function htmlEscape(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function jsonLd(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function stripTags(value = '') {
  return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function absoluteUrl(value, pathname) {
  try {
    return new URL(value, `${SITE_URL}${pathname}`).href;
  } catch {
    return DEFAULT_OG_IMAGE;
  }
}

function pageMetadata(html, pathname) {
  const override = PAGE_OVERRIDES[pathname] || {};
  const title = override.title || stripTags(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]) || 'Situacija.eu';
  const description = override.description || html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i)?.[1]
    || 'Profesionalus plytelių klojimas ir apdaila Pabradėje, Švenčionyse ir Vilniuje.';
  const existingCanonical = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']*)["']/i)?.[1];
  const canonical = override.canonical || existingCanonical || `${SITE_URL}${pathname}`;
  const firstImage = html.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1];
  const image = firstImage ? absoluteUrl(firstImage, pathname) : DEFAULT_OG_IMAGE;
  const headline = stripTags(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]) || title;
  return { title, description, canonical, image, headline };
}

function breadcrumbSchema(pathname, metadata) {
  if (pathname === '/') return null;
  const items = [{ '@type': 'ListItem', position: 1, name: 'Pradžia', item: `${SITE_URL}/` }];
  if (pathname.startsWith('/blogas/')) {
    items.push({ '@type': 'ListItem', position: 2, name: 'Blogas', item: `${SITE_URL}/blogas.html` });
  }
  items.push({
    '@type': 'ListItem',
    position: items.length + 1,
    name: metadata.headline,
    item: metadata.canonical,
  });
  return { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items };
}

function articleSchema(pathname, metadata) {
  if (!pathname.startsWith('/blogas/')) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: metadata.headline,
    description: metadata.description,
    image: [metadata.image],
    mainEntityOfPage: metadata.canonical,
    datePublished: '2026-07-26',
    dateModified: '2026-08-03',
    inLanguage: 'lt-LT',
    author: { '@type': 'Person', name: 'Vladislav Finažonok', url: `${SITE_URL}/#about` },
    publisher: { '@type': 'Organization', name: 'Situacija.eu', url: SITE_URL },
  };
}

function locationServiceSchema(pathname, metadata) {
  if (!pathname.startsWith('/plyteliu-klojimas-')) return null;
  const location = pathname.includes('pabrade') ? 'Pabradė'
    : pathname.includes('svencionys') ? 'Švenčionys ir Švenčionėliai'
      : 'Vilnius ir Vilniaus rajonas';
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: metadata.headline,
    description: metadata.description,
    url: metadata.canonical,
    areaServed: { '@type': 'AdministrativeArea', name: location },
    provider: { '@id': `${SITE_URL}/#business` },
    serviceType: 'Plytelių klojimas ir apdaila',
  };
}

function homeSchemas() {
  return [{
    '@context': 'https://schema.org',
    '@graph': [
      ['Vonios kambarių įrengimas', 'Plytelių klojimas, hidroizoliacija ir 45° kampų suleidimas.'],
      ['Virtuvės plytelių klojimas', 'Virtuvės sienelių, prijuosčių ir grindų plytelių klojimas.'],
      ['Didelio formato plytelių klojimas', '60x120, 80x80 ir 120x120 cm akmens masės plytelių montavimas.'],
      ['Fasadų apdaila klinkeriu', 'Fasadų, cokolių, tvorų ir židinių apdaila klinkerio plytelėmis.'],
    ].map(([name, description]) => ({
      '@type': 'Service',
      name,
      description,
      provider: { '@id': `${SITE_URL}/#business` },
      areaServed: ['Pabradė', 'Švenčionys', 'Švenčionėliai', 'Vilnius'],
    })),
  }, {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'Plytelių klojimo darbų eiga',
    description: 'Profesionalaus plytelių klojimo darbų eiga nuo objekto apžiūros iki hermetizavimo.',
    totalTime: 'P9D',
    step: [
      ['Objekto apžiūra', 'Paviršių patikra, matavimai ir sąmata.'],
      ['Paruošimas ir hidroizoliacija', 'Lyginimas, gruntavimas ir hidroizoliacijos įrengimas.'],
      ['Pjovimas ir klijavimas', 'Tikslus pjovimas, 45° kampai ir klijavimas.'],
      ['Glaistymas ir hermetizavimas', 'Siūlių glaistymas ir kampų sandarinimas.'],
    ].map(([name, text], index) => ({ '@type': 'HowToStep', position: index + 1, name, text })),
  }, {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      ['Kiek kainuoja plytelių klojimas?', 'Kaina priklauso nuo plytelių formato, paviršiaus būklės ir darbų sudėtingumo. Tiksli sąmata pateikiama įvertinus objektą.'],
      ['Kur teikiamos paslaugos?', 'Pagrindinės vietovės yra Pabradė, Švenčionys, Švenčionėliai ir Švenčionių rajonas; pagal susitarimą – Vilnius.'],
      ['Ar atliekama hidroizoliacija?', 'Taip, atliekamas pilnas drėgnų zonų paruošimas ir dviejų sluoksnių hidroizoliacija.'],
      ['Ar klojamos didelio formato plytelės?', 'Taip, klojamos 60x120, 80x80, 120x120 cm ir kitų formatų plytelės.'],
    ].map(([name, text]) => ({ '@type': 'Question', name, acceptedAnswer: { '@type': 'Answer', text } })),
  }];
}

function transformHtml(rawHtml, pathname, { noindex = false } = {}) {
  let html = rawHtml
    .replace(/href="((?:\.\.\/)?style\.css)(?:\?[^"#]*)?"/g, `href="$1?v=${ASSET_VERSION}"`)
    .replace(/src="((?:\.\.\/)?script\.js)(?:\?[^"#]*)?"/g, `src="$1?v=${ASSET_VERSION}"`)
    .replace(/id="burgerBtn"(?![^>]*aria-expanded)/g, 'id="burgerBtn" aria-controls="mobileNavPanel" aria-expanded="false"');
  const metadata = pageMetadata(html, pathname);
  const isArticle = pathname.startsWith('/blogas/');
  const tags = [
    '<meta name="theme-color" content="#0b1329">',
    '<link rel="icon" href="/favicon.svg" type="image/svg+xml">',
    '<link rel="apple-touch-icon" href="/apple-touch-icon.png">',
    '<link rel="manifest" href="/site.webmanifest">',
    ...(html.includes('name="description"') ? [] : [`<meta name="description" content="${htmlEscape(metadata.description)}">`]),
    ...(html.includes('rel="canonical"') ? [] : [`<link rel="canonical" href="${htmlEscape(metadata.canonical)}">`]),
    ...(noindex ? ['<meta name="robots" content="noindex,follow">'] : []),
    `<meta property="og:locale" content="lt_LT">`,
    `<meta property="og:type" content="${isArticle ? 'article' : 'website'}">`,
    `<meta property="og:site_name" content="Situacija.eu">`,
    `<meta property="og:title" content="${htmlEscape(metadata.title)}">`,
    `<meta property="og:description" content="${htmlEscape(metadata.description)}">`,
    `<meta property="og:image" content="${htmlEscape(metadata.image)}">`,
    `<meta property="og:image:alt" content="${htmlEscape(metadata.headline)}">`,
    `<meta property="og:url" content="${htmlEscape(metadata.canonical)}">`,
    '<meta name="twitter:card" content="summary_large_image">',
    `<meta name="twitter:title" content="${htmlEscape(metadata.title)}">`,
    `<meta name="twitter:description" content="${htmlEscape(metadata.description)}">`,
    `<meta name="twitter:image" content="${htmlEscape(metadata.image)}">`,
  ];
  const schemas = [breadcrumbSchema(pathname, metadata), articleSchema(pathname, metadata), locationServiceSchema(pathname, metadata)];
  if (pathname === '/') schemas.push(...homeSchemas());
  for (const schema of schemas.filter(Boolean)) {
    tags.push(`<script type="application/ld+json">${jsonLd(schema)}</script>`);
  }
  return html.replace('</head>', `    ${tags.join('\n    ')}\n</head>`);
}

function sendHtml(res, relativePath, pathname, status = 200, options = {}) {
  const absolutePath = path.join(__dirname, relativePath);
  const raw = fs.readFileSync(absolutePath, 'utf8');
  res.status(status);
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.type('html').send(transformHtml(raw, pathname, options));
}

function slugify(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 72) || 'plyteliu-klojimo-darbai';
}

app.get('/sitemap.xml', (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.sendFile(path.join(__dirname, 'sitemap.xml'));
});
app.get('/robots.txt', (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.sendFile(path.join(__dirname, 'robots.txt'));
});
app.get(['/llms.txt', '/llms-full.txt'], (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.type('text/plain').sendFile(path.join(__dirname, req.path.slice(1)));
});

const canonicalRedirects = new Map([
  ['/blogas', '/blogas.html'],
  ['/duk', '/duk.html'],
  ['/galerija', '/gallery.html'],
  ['/gallery', '/gallery.html'],
  ['/plyteliu-klojimas-pabrade', '/plyteliu-klojimas-pabrade.html'],
  ['/plyteliu-klojimas-svencionys', '/plyteliu-klojimas-svencionys.html'],
  ['/plyteliu-klojimas-vilnius', '/plyteliu-klojimas-vilnius.html'],
  ['/kontaktai', '/#contact'],
  ['/kontaktai.html', '/#contact'],
  ['/apie-mus', '/#about'],
  ['/apie-mus.html', '/#about'],
]);
for (const [from, to] of canonicalRedirects) app.get(from, (req, res) => res.redirect(301, to));

app.get(['/crm', '/crm.html'], (req, res) => res.redirect(301, DIRECTUS_ADMIN_URL));

app.post('/api/requests', async (req, res) => {
  const { name, phone, message = '' } = req.body;
  if (!name || !phone) return res.status(400).json({ error: 'Vardas ir telefonas yra privalomi!' });
  try {
    const result = await directus('/items/requests', {
      method: 'POST',
      body: JSON.stringify({ name, phone, message, status: 'new' }),
    });
    res.setHeader('Cache-Control', 'no-store');
    res.status(201).json({ success: true, id: result.data.id });
  } catch (error) {
    console.error('Directus request create failed:', error.message);
    res.status(502).json({ error: 'Nepavyko išsaugoti užklausos.' });
  }
});

app.get('/api/images', async (req, res) => {
  try {
    const query = new URLSearchParams({
      fields: 'id,image,category,title,description,date_created',
      sort: '-date_created',
      'filter[status][_eq]': 'published',
      limit: '-1',
    });
    const result = await directus(`/items/gallery?${query}`);
    const images = result.data.map((item, index) => {
      const file = typeof item.image === 'object' ? item.image : { id: item.image };
      const title = item.title || `Plytelių klojimo darbai Pabradėje – ${String(index + 1).padStart(2, '0')}`;
      const slug = slugify(title);
      return {
        id: item.id,
        file_id: file.id,
        filename: `${slug}.webp`,
        url: `/darbai/${slug}/${file.id}.webp`,
        width: file.width || 1536,
        height: file.height || 2048,
        category: item.category,
        title,
        description: item.description,
        uploaded_at: item.date_created,
      };
    });
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=3600');
    res.json(images);
  } catch (error) {
    console.error('Directus gallery read failed:', error.message);
    res.status(502).json({ error: 'Nepavyko užkrauti nuotraukų.' });
  }
});

async function sendDirectusImage(req, res) {
  try {
    const assetUrl = `${DIRECTUS_URL}/assets/${encodeURIComponent(req.params.id)}?width=1200&fit=inside&format=webp&quality=78&withoutEnlargement=true`;
    const response = await fetch(assetUrl, {
      headers: DIRECTUS_TOKEN ? { Authorization: `Bearer ${DIRECTUS_TOKEN}` } : {},
    });
    if (!response.ok) return res.sendStatus(response.status);
    res.setHeader('Content-Type', response.headers.get('content-type') || 'image/webp');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Content-Disposition', `inline; filename="${slugify(req.params.slug || 'plyteliu-klojimo-darbai')}.webp"`);
    res.send(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    console.error('Directus asset read failed:', error.message);
    res.sendStatus(502);
  }
}
app.get('/darbai/:slug/:id.webp', sendDirectusImage);
app.get('/api/assets/:id', sendDirectusImage);

app.get('/api/content', async (req, res) => {
  try {
    const result = await directus('/items/site_content?limit=-1&fields=key,value');
    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    res.json(Object.fromEntries(result.data.map(({ key, value }) => [key, value])));
  } catch (error) {
    console.error('Directus content read failed:', error.message);
    res.status(502).json({ error: 'Nepavyko užkrauti svetainės turinio.' });
  }
});

app.use('/api', (req, res) => res.status(404).json({ error: 'API endpoint not found' }));

const extensionlessPages = new Map([
  ['/', 'index.html'],
]);
app.get('*', (req, res, next) => {
  const relative = decodeURIComponent(req.path).replace(/^\/+/, '');
  const target = extensionlessPages.get(req.path) || relative;
  if (!target || !target.endsWith('.html')) return next();
  const normalized = path.posix.normalize(target);
  if (normalized.startsWith('../')) return next();
  const absolute = path.join(__dirname, normalized);
  if (!fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) return next();
  sendHtml(res, normalized, req.path === '/index.html' ? '/' : req.path);
});

app.use(express.static(__dirname, {
  index: false,
  fallthrough: true,
  maxAge: '1y',
  immutable: true,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache');
  },
}));

app.use((req, res) => {
  if (req.method === 'GET' || req.method === 'HEAD') {
    return sendHtml(res, '404.html', req.path, 404, { noindex: true });
  }
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`Serveris veikia ant porto ${PORT}; turinys valdomas per Directus.`);
});
