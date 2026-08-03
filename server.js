const express = require('express');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const DIRECTUS_URL = (process.env.DIRECTUS_URL || 'http://situacija-directus-app:8055').replace(/\/$/, '');
const DIRECTUS_ADMIN_URL = process.env.DIRECTUS_ADMIN_URL || 'https://situacija.sitestudio.lt/admin';
const DIRECTUS_TOKEN = process.env.DIRECTUS_STATIC_TOKEN
  ? crypto.createHash('sha256').update(process.env.DIRECTUS_STATIC_TOKEN).digest('hex')
  : null;

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

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

app.get('/sitemap.xml', (req, res) => res.sendFile(path.join(__dirname, 'sitemap.xml')));
app.get('/robots.txt', (req, res) => res.sendFile(path.join(__dirname, 'robots.txt')));
app.get('/blogas', (req, res) => res.sendFile(path.join(__dirname, 'blogas.html')));
app.get('/duk', (req, res) => res.sendFile(path.join(__dirname, 'duk.html')));
app.get('/plyteliu-klojimas-pabrade', (req, res) => res.sendFile(path.join(__dirname, 'plyteliu-klojimas-pabrade.html')));
app.get('/plyteliu-klojimas-svencionys', (req, res) => res.sendFile(path.join(__dirname, 'plyteliu-klojimas-svencionys.html')));
app.get('/plyteliu-klojimas-vilnius', (req, res) => res.sendFile(path.join(__dirname, 'plyteliu-klojimas-vilnius.html')));

// The old one-password CRM is retired. Administration now uses Directus accounts.
app.get(['/crm', '/crm.html'], (req, res) => res.redirect(302, DIRECTUS_ADMIN_URL));

app.post('/api/requests', async (req, res) => {
  const { name, phone, message = '' } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ error: 'Vardas ir telefonas yra privalomi!' });
  }

  try {
    const result = await directus('/items/requests', {
      method: 'POST',
      body: JSON.stringify({ name, phone, message, status: 'new' }),
    });
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
    res.json(result.data.map((item) => ({
      id: item.id,
      file_id: item.image,
      filename: item.image,
      category: item.category,
      title: item.title,
      description: item.description,
      uploaded_at: item.date_created,
    })));
  } catch (error) {
    console.error('Directus gallery read failed:', error.message);
    res.status(502).json({ error: 'Nepavyko užkrauti nuotraukų.' });
  }
});

app.get('/api/assets/:id', async (req, res) => {
  try {
    const response = await fetch(`${DIRECTUS_URL}/assets/${encodeURIComponent(req.params.id)}`, {
      headers: DIRECTUS_TOKEN ? { Authorization: `Bearer ${DIRECTUS_TOKEN}` } : {},
    });
    if (!response.ok) return res.sendStatus(response.status);
    const contentType = response.headers.get('content-type');
    const cacheControl = response.headers.get('cache-control');
    if (contentType) res.setHeader('Content-Type', contentType);
    if (cacheControl) res.setHeader('Cache-Control', cacheControl);
    const body = Buffer.from(await response.arrayBuffer());
    res.send(body);
  } catch (error) {
    console.error('Directus asset read failed:', error.message);
    res.sendStatus(502);
  }
});

app.get('/api/content', async (req, res) => {
  try {
    const result = await directus('/items/site_content?limit=-1&fields=key,value');
    const content = Object.fromEntries(result.data.map(({ key, value }) => [key, value]));
    res.json(content);
  } catch (error) {
    console.error('Directus content read failed:', error.message);
    res.status(502).json({ error: 'Nepavyko užkrauti svetainės turinio.' });
  }
});

app.use(express.static(__dirname));

app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Serveris veikia ant porto ${PORT}; turinys valdomas per Directus.`);
});
