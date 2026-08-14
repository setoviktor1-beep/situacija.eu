const express = require('express');
const compression = require('compression');
const cheerio = require('cheerio');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const {
  LOCALES,
  resolveRoute,
  routeFor,
  localizeHtml,
  translateGalleryTitle,
} = require('./i18n');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const SITE_URL = 'https://situacija.eu';
const ASSET_VERSION = '20260814f';
const GOOGLE_TAG_ID = 'G-MNR63Y36VB';
const DEFAULT_OG_IMAGE = `${SITE_URL}/images/img1.jpg`;
const DIRECTUS_URL = (process.env.DIRECTUS_URL || 'http://situacija-directus-app:8055').replace(/\/$/, '');
const DIRECTUS_ADMIN_URL = process.env.DIRECTUS_ADMIN_URL || 'https://situacija.sitestudio.lt/admin';
const DIRECTUS_TOKEN = process.env.DIRECTUS_STATIC_TOKEN
  ? crypto.createHash('sha256').update(process.env.DIRECTUS_STATIC_TOKEN).digest('hex')
  : null;
const REQUEST_WINDOW_MS = 15 * 60 * 1000;
const REQUEST_LIMIT = 5;
const requestAttempts = new Map();
const pageBuilderCache = new Map();
const PAGE_BUILDER_CACHE_MS = 30 * 1000;

const PAGE_OVERRIDES = {
  '/': {
    title: 'Plytelių klojimas Pabradėje ir Švenčionyse | Vladislav',
    canonical: `${SITE_URL}/`,
  },
  '/gallery.html': {
    title: 'Plytelių klojimo darbų galerija | Situacija.eu',
    description: 'Meistro Vladislav atlikti plytelių klojimo, vonios apdailos, hidroizoliacijos ir klinkerio darbai Pabradėje, Švenčionyse ir Vilniuje.',
  },
  '/kriaukles-is-plyteliu.html': {
    title: 'Kriauklės iš plytelių pagal individualų projektą | Situacija.eu',
    description: 'Individualių kriauklių iš plytelių įrengimas: konstrukcija, hidroizoliacija, nuolydžiai, išleidimo mazgas ir tikslios 45° briaunos.',
  },
};

app.disable('x-powered-by');
app.set('trust proxy', true);
app.use(compression({ threshold: 1024 }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https://www.google-analytics.com",
    "connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com",
    'upgrade-insecure-requests',
  ].join('; '));

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

function directusAssetId(value) {
  return typeof value === 'object' && value ? value.id : value;
}

function builderImageUrl(value, fallback = '') {
  const id = directusAssetId(value);
  return id ? `/api/assets/${encodeURIComponent(id)}` : fallback;
}

async function loadBuilderPage(slug = 'home') {
  const cached = pageBuilderCache.get(slug);
  if (cached && Date.now() - cached.time < PAGE_BUILDER_CACHE_MS) return cached.value;

  const pageQuery = new URLSearchParams({
    limit: '1',
    fields: 'id,title,slug,status,seo,blocks.*',
    'filter[slug][_eq]': slug,
    'filter[status][_eq]': 'published',
  });
  const pageResult = await directus(`/items/pages?${pageQuery}`);
  const page = pageResult.data?.[0];
  if (!page) return null;

  const blocks = await Promise.all((page.blocks || [])
    .sort((left, right) => (left.sort || 0) - (right.sort || 0))
    .map(async (link) => {
      const fields = link.collection === 'block_cards' ? '*,cards.*'
        : link.collection === 'block_faq' ? '*,items.*'
          : link.collection === 'block_hero' ? '*,background_image.*'
            : '*';
      const result = await directus(`/items/${encodeURIComponent(link.collection)}/${encodeURIComponent(link.item)}?fields=${encodeURIComponent(fields)}`);
      const block = { type: link.collection, sort: link.sort, ...result.data };
      if (link.collection === 'block_services') {
        const services = await directus('/items/services?fields=*,image.*&filter[status][_eq]=published&sort=sort&limit=-1');
        block.items = services.data || [];
      }
      if (link.collection === 'block_gallery') {
        const images = await directus(`/items/gallery?fields=id,image,title,description&filter[status][_eq]=published&sort=-date_created&limit=${Number(block.limit) || 6}`);
        block.items = images.data || [];
      }
      return block;
    }));
  const value = { ...page, blocks };
  pageBuilderCache.set(slug, { time: Date.now(), value });
  return value;
}

function renderBuilderBlock(block) {
  const badge = block.badge ? `<span class="badge">${htmlEscape(block.badge)}</span>` : '';
  const intro = block.intro ? `<p class="section-subtitle">${htmlEscape(block.intro)}</p>` : '';

  if (block.type === 'block_hero') {
    const background = builderImageUrl(block.background_image);
    const backgroundStyle = background ? ` style="background-image:linear-gradient(rgba(6,15,35,.82),rgba(6,15,35,.88)),url('${htmlEscape(background)}')"` : '';
    return `<section class="hero" id="home" data-cms-block="block_hero:${block.id}"${backgroundStyle}>
      <div class="hero-overlay"></div><canvas id="heroCanvas"></canvas>
      <div class="container hero-content">${badge}<h1 id="hero-title">${htmlEscape(block.title || '')}</h1><p id="hero-subtitle">${htmlEscape(block.subtitle || '')}</p>
        <div class="hero-buttons">${block.primary_label && block.primary_url ? `<a href="${htmlEscape(block.primary_url)}" class="btn btn-primary">${htmlEscape(block.primary_label)}</a>` : ''}${block.secondary_label && block.secondary_url ? `<a href="${htmlEscape(block.secondary_url)}" class="btn btn-outline">${htmlEscape(block.secondary_label)}</a>` : ''}</div>
        <div class="stats-grid"><div class="stat-card"><div class="stat-number">10+</div><div class="stat-label">Metų patirtis</div></div><div class="stat-card"><div class="stat-number">100%</div><div class="stat-label">Preciziškos 45° siūlės</div></div><div class="stat-card"><div class="stat-number">300+</div><div class="stat-label">Atliktų projektų</div></div><div class="stat-card"><div class="stat-number">Garancija</div><div class="stat-label">Atliktiems darbams</div></div></div>
      </div></section>`;
  }

  if (block.type === 'block_services') {
    const fallbacks = ['/images/services/vonios-kambariai.webp', '/images/services/virtuves.webp', '/images/services/grindys-ir-terasos.webp', '/images/services/fasadu-apdaila-klinkeriu.webp', '/images/services/kriaukles-is-plyteliu.webp'];
    const cards = (block.items || []).map((item, index) => {
      const image = builderImageUrl(item.image, fallbacks[index] || '');
      return `<article class="service-card${image ? ' service-card-with-image' : ''}">${image ? `<img class="service-card-image" src="${htmlEscape(image)}" width="960" height="720" loading="lazy" alt="${htmlEscape(item.title || '')}">` : ''}<h3>${htmlEscape(item.title || '')}</h3><p>${htmlEscape(item.description || '')}</p>${item.link_url ? `<a class="service-card-link" href="${htmlEscape(item.link_url)}">${htmlEscape(item.link_label || 'Plačiau →')}</a>` : ''}</article>`;
    }).join('');
    return `<section class="services" id="services" data-cms-block="block_services:${block.id}"><div class="container">${badge}<h2 class="section-title">${htmlEscape(block.title || '')}</h2>${intro}<div class="services-grid" id="services-list">${cards}</div></div></section>`;
  }

  if (block.type === 'block_text') {
    const style = ['white', 'light', 'dark'].includes(block.style) ? block.style : 'light';
    return `<section id="about" class="builder-text builder-${style}" data-cms-block="block_text:${block.id}"><div class="container">${badge}<h2 class="section-title">${htmlEscape(block.title || '')}</h2><div class="rich-text-block">${block.content || ''}</div></div></section>`;
  }

  if (block.type === 'block_cards') {
    const cards = (block.cards || []).sort((a, b) => (a.sort || 0) - (b.sort || 0)).map((item) => {
      const fallback = item.link_url?.includes('kaip-pasirinkti') ? '/images/img1.avif' : item.link_url?.includes('hidroizoliacija') ? '/images/img3.avif' : item.link_url?.includes('didelio-formato') ? '/images/img2.avif' : '';
      const image = builderImageUrl(item.image, fallback);
      return `<article class="service-card${image ? ' service-card-with-image' : ''}">${image ? `<img class="service-card-image" src="${htmlEscape(image)}" width="960" height="720" loading="lazy" alt="${htmlEscape(item.title || '')}">` : item.icon ? `<div class="icon">${htmlEscape(item.icon)}</div>` : ''}<h3>${htmlEscape(item.title || '')}</h3><p>${htmlEscape(item.text || '')}</p>${item.link_url ? `<a class="service-card-link" href="${htmlEscape(item.link_url)}">${htmlEscape(item.link_label || 'Plačiau →')}</a>` : ''}</article>`;
    }).join('');
    const id = /region/i.test(block.title || '') ? 'regions' : /patarim|straipsn/i.test(block.title || '') ? 'blog' : `cards-${block.id}`;
    return `<section class="services" id="${id}" data-cms-block="block_cards:${block.id}"><div class="container">${badge}<h2 class="section-title">${htmlEscape(block.title || '')}</h2>${intro}<div class="services-grid" style="grid-template-columns:repeat(auto-fit,minmax(280px,1fr))">${cards}</div></div></section>`;
  }

  if (block.type === 'block_gallery') {
    const images = (block.items || []).map((item) => {
      const id = directusAssetId(item.image);
      const title = item.title || 'Plytelių klojimo darbai';
      return id ? `<div class="gallery-item"><img src="/darbai/${slugify(title)}/${encodeURIComponent(id)}.webp" alt="${htmlEscape(title)}" loading="lazy"><div class="gallery-caption">${htmlEscape(item.description || title)}</div></div>` : '';
    }).join('');
    return `<section class="gallery" id="gallery" data-cms-block="block_gallery:${block.id}"><div class="container">${badge}<h2 class="section-title">${htmlEscape(block.title || '')}</h2>${intro}<div class="gallery-grid">${images}</div>${block.button_url ? `<div style="text-align:center;margin-top:3rem"><a href="${htmlEscape(block.button_url)}" class="btn btn-primary">${htmlEscape(block.button_label || 'Žiūrėti galeriją')}</a></div>` : ''}</div></section>`;
  }

  if (block.type === 'block_faq') {
    const items = (block.items || []).sort((a, b) => (a.sort || 0) - (b.sort || 0)).map((item, index) => `<div class="faq-item"><button class="faq-question" type="button">${index + 1}. ${htmlEscape(item.question || '')}</button><div class="faq-answer">${item.answer || ''}</div></div>`).join('');
    return `<section class="faq-section" id="faq" data-cms-block="block_faq:${block.id}"><div class="container">${badge}<h2 class="section-title">${htmlEscape(block.title || '')}</h2>${intro}<div class="faq-grid">${items}</div><div style="text-align:center;margin-top:2.5rem"><a href="/duk.html" class="btn btn-outline" style="color:var(--primary-dark);border-color:var(--primary-dark)">Skaityti pilną D.U.K. puslapį →</a></div></div></section>`;
  }

  if (block.type === 'block_contact') {
    return `<section class="contact" id="contact" data-cms-block="block_contact:${block.id}"><div class="container contact-container"><div class="contact-info">${badge}<h2>${htmlEscape(block.title || '')}</h2><p>${htmlEscape(block.intro || '')}</p><ul>${block.phone_text ? `<li>📞 <strong>Telefonas:</strong> <a id="contact-phone" href="${htmlEscape(block.phone_url || '')}" style="color:#2dd4bf;font-weight:700">${htmlEscape(block.phone_text)}</a></li>` : ''}${block.email ? `<li>✉️ <strong>El. paštas:</strong> <a id="contact-email" href="mailto:${htmlEscape(block.email)}" style="color:var(--white)">${htmlEscape(block.email)}</a></li>` : ''}${block.facebook_url ? `<li><a id="contact-fb" href="${htmlEscape(block.facebook_url)}" target="_blank" rel="noopener" class="fb-btn">Facebook</a></li>` : ''}</ul></div><div class="contact-form-wrapper"><form class="contact-form" id="contactForm"><h3 style="font-size:1.4rem;font-weight:800;margin-bottom:1.25rem">${htmlEscape(block.form_title || 'Gauti nemokamą sąmatą')}</h3><div class="form-group"><label for="name">Jūsų vardas *</label><input type="text" id="name" placeholder="Vardas" required></div><div class="form-group"><label for="phone">Telefonas *</label><input type="tel" id="phone" placeholder="+370 600 00000" required></div><div class="form-group"><label for="message">Miestas ir darbų aprašymas</label><textarea id="message" rows="4" placeholder="Trumpai aprašykite planuojamus darbus"></textarea></div><button type="submit" class="btn btn-primary full-width">Siųsti užklausą</button></form></div></div></section>`;
  }

  return '';
}

function applyBuilderPage(rawHtml, page) {
  const $ = cheerio.load(rawHtml, { decodeEntities: false });
  const sections = (page.blocks || []).map(renderBuilderBlock).join('\n');
  $('#home, #services, #about, #regions, #gallery, #blog, #faq, #contact').remove();
  $('footer').before(sections);
  if (page.seo?.title) $('title').text(page.seo.title);
  if (page.seo?.meta_description) $('meta[name="description"]').attr('content', page.seo.meta_description);
  return $.html();
}

function regionalDetailsHtml(locale, pageKey) {
  const place = {
    lt: { pabrade: 'Pabradėje ir aplinkinėse gyvenvietėse', svencionys: 'Švenčionyse, Švenčionėliuose ir rajone', vilnius: 'Vilniuje ir Vilniaus rajone' },
    pl: { pabrade: 'w Pabradė (Podbrodziu) i okolicy', svencionys: 'w Święcianach, Nowych Święcianach i rejonie', vilnius: 'w Wilnie i rejonie wileńskim' },
    ru: { pabrade: 'в Пабраде и окрестностях', svencionys: 'в Швенчёнисе, Швенчёнеляе и районе', vilnius: 'в Вильнюсе и Вильнюсском районе' },
  }[locale][pageKey];
  const copy = locale === 'pl' ? {
    title: `Jak przebiegają prace glazurnicze ${place}`,
    intro: `Każde zlecenie zaczyna się od rozmowy o pomieszczeniu, wybranych płytkach i oczekiwanym efekcie. Zakres może obejmować łazienkę, ścianę kuchenną, podłogę, taras, schody albo okładzinę klinkierową. Przed ustaleniem ceny sprawdzany jest format płytek, stan podłoża, liczba narożników i otworów oraz potrzeba hydroizolacji. Dzięki temu wycena odpowiada rzeczywistemu zakresowi, a nie tylko liczbie metrów kwadratowych.`,
    inspectTitle: 'Oględziny i jasna wycena',
    inspect: 'Podczas oględzin mierzone są powierzchnie, sprawdzane piony i poziomy oraz ustalany układ płytek. Omawiane są miejsca docinek, szerokość spoin, wykończenie narożników pod kątem 45° i kolejność prac. Klient otrzymuje informację, jakie materiały będą potrzebne i które prace przygotowawcze należy uwzględnić. Termin jest uzgadniany indywidualnie, z uwzględnieniem zakresu i aktualnego harmonogramu.',
    prepTitle: 'Przygotowanie podłoża i hydroizolacja',
    prep: 'Trwałość okładziny zależy od podłoża. Przed klejeniem oceniana jest jego nośność, równość i czystość; w razie potrzeby powierzchnia jest wyrównywana i gruntowana. W łazienkach oraz strefach prysznica wykonywana jest hydroizolacja, a narożniki i przejścia instalacyjne są uszczelniane odpowiednimi taśmami i elementami. Przy dużych płytkach szczególnie ważna jest płaszczyzna podłoża i równomierne podparcie płytki klejem.',
    materialsTitle: 'Materiały dopasowane do miejsca zastosowania',
    materials: 'Klej, grunt, fuga i uszczelnienie dobierane są do rodzaju płytki, podłoża i warunków użytkowania. Inne wymagania ma sucha ściana w kuchni, inne stale mokra strefa prysznica, ogrzewana podłoga lub taras narażony na mróz. Uwzględnienie tych różnic ogranicza ryzyko pękania, odspajania i przebarwień. Przed zakupem warto uzgodnić format, kalibrację, zapas materiału i kolor fugi, aby podczas prac nie zabrakło jednej serii produktu. Omawiana jest również późniejsza pielęgnacja powierzchni, szczególnie w przypadku fug epoksydowych, kamienia lub klinkieru. Dzięki temu klient wie, jakich środków używać i czego unikać po zakończeniu prac.',
    finishTitle: 'Dokładne wykończenie i odbiór',
    finish: 'Układ płytek planowany jest przed rozpoczęciem klejenia, aby uniknąć przypadkowych wąskich docinek w widocznych miejscach. Po związaniu kleju spoiny są czyszczone i fugowane, a narożniki wewnętrzne uszczelniane elastycznie. Na końcu powierzchnie są oczyszczane, a wykonane prace wspólnie oglądane. Aby otrzymać wstępną ocenę, wystarczy przesłać miejscowość, wymiary, kilka zdjęć i krótki opis planowanych prac.',
    cta: 'Zapytaj o wycenę',
  } : locale === 'ru' ? {
    title: `Как проходят плиточные работы ${place}`,
    intro: `Каждый заказ начинается с обсуждения помещения, выбранной плитки и желаемого результата. Работы могут включать ванную, кухонный фартук, пол, террасу, лестницу или облицовку клинкером. До расчёта цены оцениваются формат плитки, состояние основания, количество углов и отверстий, а также необходимость гидроизоляции. Поэтому смета учитывает реальный объём работ, а не только площадь в квадратных метрах.`,
    inspectTitle: 'Осмотр и понятная смета',
    inspect: 'Во время осмотра измеряются поверхности, проверяются вертикали и уровни, согласовывается раскладка плитки. Обсуждаются места подрезки, ширина швов, отделка внешних углов под 45° и последовательность этапов. Клиент получает список необходимых материалов и подготовительных работ. Срок выполнения согласовывается индивидуально с учётом объёма и текущего графика.',
    prepTitle: 'Подготовка основания и гидроизоляция',
    prep: 'Долговечность облицовки зависит от основания. Перед укладкой проверяются его прочность, ровность и чистота; при необходимости поверхность выравнивается и грунтуется. В ванных и душевых выполняется гидроизоляция, а углы и проходы труб герметизируются специальными лентами и элементами. Для крупноформатной плитки особенно важны ровная плоскость и равномерное заполнение клеем.',
    materialsTitle: 'Материалы с учётом условий эксплуатации',
    materials: 'Клей, грунтовка, затирка и герметик подбираются под вид плитки, основание и условия использования. Для сухой кухонной стены, постоянно мокрой душевой, тёплого пола и открытой террасы требования различаются. Правильный подбор уменьшает риск трещин, отслоения и изменения цвета. До покупки стоит согласовать формат, калибр, запас плитки и цвет затирки, чтобы во время работ не пришлось искать материал другой производственной партии. Отдельно обсуждается последующий уход за поверхностью, особенно при эпоксидной затирке, натуральном камне или клинкере. Клиент заранее знает, какие чистящие средства подходят и чего следует избегать.',
    finishTitle: 'Точная отделка и приёмка',
    finish: 'Раскладка планируется до начала укладки, чтобы избежать случайных узких подрезок на заметных местах. После схватывания клея швы очищаются и заполняются затиркой, а внутренние углы герметизируются эластичным материалом. В конце поверхности очищаются, и готовая работа осматривается вместе с клиентом. Для предварительной оценки достаточно указать населённый пункт, размеры, приложить несколько фотографий и кратко описать задачу.',
    cta: 'Запросить смету',
  } : {
    title: `Kaip vyksta plytelių klojimo darbai ${place}`,
    intro: `Kiekvienas užsakymas pradedamas pokalbiu apie patalpą, pasirinktas plyteles ir norimą rezultatą. Darbai gali apimti vonios kambarį, virtuvės sienelę, grindis, terasą, laiptus ar klinkerio apdailą. Prieš nustatant kainą įvertinamas plytelių formatas, pagrindo būklė, kampų ir angų kiekis bei hidroizoliacijos poreikis. Todėl sąmata priklauso nuo tikros darbų apimties, o ne vien kvadratinių metrų skaičiaus.`,
    inspectTitle: 'Objekto apžiūra ir aiški sąmata',
    inspect: 'Apžiūros metu išmatuojami paviršiai, patikrinami lygiai ir vertikalės, suderinamas plytelių išdėstymas. Aptariamos pjovimo vietos, siūlių plotis, išorinių kampų suleidimas 45° kampu ir darbų eiliškumas. Klientui paaiškinama, kokių medžiagų reikės ir kokius paruošimo darbus verta įtraukti. Atlikimo laikas suderinamas individualiai pagal apimtį ir esamą darbų grafiką.',
    prepTitle: 'Pagrindo paruošimas ir hidroizoliacija',
    prep: 'Apdailos ilgaamžiškumas priklauso nuo pagrindo. Prieš klijuojant įvertinamas jo tvirtumas, lygumas ir švara; prireikus paviršius lyginamas ir gruntuojamas. Vonios bei dušo zonose įrengiama hidroizoliacija, o kampai ir vamzdžių įvadai sandarinami tam skirtomis juostomis bei elementais. Didelio formato plytelėms ypač svarbi lygi plokštuma ir tolygus plytelės padengimas klijais.',
    materialsTitle: 'Pagal naudojimo vietą parinktos medžiagos',
    materials: 'Klijai, gruntas, glaistas ir sandarinimo medžiagos parenkami pagal plytelių rūšį, pagrindą ir naudojimo sąlygas. Sausai virtuvės sienelei, nuolat drėgnai dušo zonai, šildomoms grindims ar šalčio veikiamai terasai keliami skirtingi reikalavimai. Tinkamas suderinimas mažina skilimo, atšokimo ir spalvos pokyčių riziką. Prieš perkant verta suderinti formatą, kalibrą, plytelių atsargą ir siūlių spalvą, kad vykstant darbams nepritrūktų tos pačios gamybos partijos medžiagų. Atskirai aptariama vėlesnė paviršių priežiūra, ypač pasirinkus epoksidinį glaistą, natūralų akmenį ar klinkerį. Klientas iš anksto žino, kokias valymo priemones naudoti ir ko reikėtų vengti.',
    finishTitle: 'Tikslus užbaigimas ir darbų priėmimas',
    finish: 'Plytelių išdėstymas suplanuojamas prieš klijavimą, kad matomose vietose neliktų atsitiktinių siaurų atraižų. Klijams sukietėjus siūlės išvalomos ir glaistomos, o vidiniai kampai sandarinami elastingai. Pabaigoje paviršiai nuvalomi ir darbai apžiūrimi kartu su klientu. Pirminiam įvertinimui pakanka nurodyti miestą, matmenis, pridėti kelias nuotraukas ir trumpai aprašyti planuojamus darbus.',
    cta: 'Gauti darbų sąmatą',
  };
  return `<section class="regional-details"><div class="container legal-content"><h2>${copy.title}</h2><p>${copy.intro}</p><h3>${copy.inspectTitle}</h3><p>${copy.inspect}</p><h3>${copy.prepTitle}</h3><p>${copy.prep}</p><h3>${copy.materialsTitle}</h3><p>${copy.materials}</p><h3>${copy.finishTitle}</h3><p>${copy.finish}</p><p><a class="btn btn-primary" href="${routeFor('home', locale)}#contact">${copy.cta}</a></p></div></section>`;
}

function enrichSiteHtml(rawHtml, locale = 'lt', pageKey = null) {
  const $ = cheerio.load(rawHtml, { decodeEntities: false });
  const legal = locale === 'pl'
    ? { rights: 'Wszelkie prawa zastrzeżone.', faq: 'FAQ', privacy: 'Polityka prywatności', skip: 'Przejdź do treści', blog: 'Poradniki' }
    : locale === 'ru'
      ? { rights: 'Все права защищены.', faq: 'Вопросы', privacy: 'Политика конфиденциальности', skip: 'Перейти к содержанию', blog: 'Советы' }
      : { rights: 'Visos teisės saugomos.', faq: 'D.U.K.', privacy: 'Privatumo politika', skip: 'Pereiti prie turinio', blog: 'Blogas' };
  const navigationLabels = locale === 'pl'
    ? ['Usługi', 'O fachowcu', 'Obsługiwany obszar', 'Galeria prac', 'FAQ', 'Kontakt']
    : locale === 'ru'
      ? ['Услуги', 'О мастере', 'Районы работы', 'Галерея работ', 'Вопросы', 'Контакты']
      : ['Paslaugos', 'Apie meistrą', 'Veiklos regionai', 'Darbų galerija', 'D.U.K.', 'Kontaktai'];
  const home = routeFor('home', locale);
  const navigationLinks = [
    [`${home}#services`, navigationLabels[0]],
    [`${home}#about`, navigationLabels[1]],
    [`${home}#regions`, navigationLabels[2]],
    [routeFor('gallery', locale), navigationLabels[3]],
    [routeFor('faq', locale), navigationLabels[4]],
    [`${home}#contact`, navigationLabels[5]],
  ];

  const headerContent = $('header .header-content').first();
  if (headerContent.length) {
    const navigationList = navigationLinks.map(([href, label]) => `<li><a href="${href}">${label}</a></li>`).join('');
    let desktopNavigation = headerContent.find('.desktop-nav').first();
    if (!desktopNavigation.length) {
      headerContent.find('.logo').after('<nav class="desktop-nav"></nav>');
      desktopNavigation = headerContent.find('.desktop-nav').first();
    }
    desktopNavigation.attr('aria-label', navigationLabels[5]).html(`<ul>${navigationList}</ul>`);
    if (!$('#burgerBtn').length) headerContent.append('<button class="burger-btn" id="burgerBtn" aria-label="Atidaryti meniu"><span></span><span></span><span></span></button>');
    if (!$('#mobileNavPanel').length) $('header').append('<div class="mobile-nav-panel" id="mobileNavPanel"></div>');
    $('#mobileNavPanel').html(`<ul>${navigationList}</ul>`);
    if (!$('.language-switcher').length) {
      const languageLabel = locale === 'pl' ? 'Wybór języka' : locale === 'ru' ? 'Выбор языка' : 'Kalbos pasirinkimas';
      const switcher = ['lt', 'pl', 'ru'].map((language) => {
        const current = language === locale ? ' class="active" aria-current="page"' : '';
        return `<a href="${routeFor('home', language)}" hreflang="${language}" lang="${language}"${current}>${language.toUpperCase()}</a>`;
      }).join('');
      headerContent.find('.nav-btn').before(`<nav class="language-switcher" aria-label="${languageLabel}">${switcher}</nav>`);
    }
  }

  if ($('link[href*="fonts.googleapis.com"]').length) {
    if (!$('link[rel="preconnect"][href="https://fonts.googleapis.com"]').length) {
      $('head').prepend('<link rel="preconnect" href="https://fonts.googleapis.com">');
    }
    if (!$('link[rel="preconnect"][href="https://fonts.gstatic.com"]').length) {
      $('head').prepend('<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>');
    }
  }

  $('img[src]').each((_, element) => {
    const src = $(element).attr('src');
    if (!src) return;
    if (/(?:^|\/)images\/img[1-6]\.jpg$/i.test(src)) {
      $(element).attr('src', src.replace(/\.jpg$/i, '.avif'));
      if (!$(element).attr('width')) $(element).attr('width', '900');
      if (!$(element).attr('height')) $(element).attr('height', '1200');
    }
  });

  $('.faq-question').each((_, element) => {
    element.tagName = 'button';
    $(element).attr('type', 'button');
  });

  const contentTarget = $('main').first().length ? $('main').first() : $('header').nextAll('section').first();
  if (contentTarget.length) {
    contentTarget.attr('id', contentTarget.attr('id') || 'main-content');
    if (!$('.skip-link').length) $('body').prepend(`<a class="skip-link" href="#${contentTarget.attr('id')}">${legal.skip}</a>`);
  }

  const privacyUrl = routeFor('privacy', locale);
  const faqUrl = routeFor('faq', locale);
  const homeUrl = routeFor('home', locale);
  const footer = $('footer .footer-content').first();
  if (footer.length) {
    footer.html(`<p>&copy; 2024–2026 Situacija.eu. ${legal.rights} | <a href="${homeUrl}">Situacija.eu</a> | <a href="/blogas.html">${legal.blog}</a> | <a href="${faqUrl}">${legal.faq}</a> | <a href="/sitemap.xml">Sitemap</a> | <a href="${privacyUrl}">${legal.privacy}</a></p>`);
  }

  const contactForm = $('#contactForm');
  if (contactForm.length && !contactForm.find('.form-privacy-note').length) {
    const message = locale === 'pl'
      ? `Wysyłając formularz, zgadzasz się na użycie danych wyłącznie w celu odpowiedzi na zapytanie. <a href="${privacyUrl}">Polityka prywatności</a>.`
      : locale === 'ru'
        ? `Отправляя форму, вы соглашаетесь на использование данных только для ответа на запрос. <a href="${privacyUrl}">Политика конфиденциальности</a>.`
        : `Siųsdami formą sutinkate, kad duomenys būtų naudojami tik atsakyti į jūsų užklausą. <a href="${privacyUrl}">Privatumo politika</a>.`;
    contactForm.find('button[type="submit"]').after(`<p class="form-privacy-note">${message}</p>`);
  }

  if (['pabrade', 'svencionys', 'vilnius'].includes(pageKey) && !$('.regional-details').length) {
    $('footer').before(regionalDetailsHtml(locale, pageKey));
  }

  return $.html();
}

function requestLimitExceeded(ip) {
  const now = Date.now();
  const recent = (requestAttempts.get(ip) || []).filter((time) => now - time < REQUEST_WINDOW_MS);
  recent.push(now);
  requestAttempts.set(ip, recent);
  return recent.length > REQUEST_LIMIT;
}

async function notifyAdminAboutRequest(requestId) {
  const currentUser = await directus('/users/me?fields=id');
  const recipient = currentUser?.data?.id;
  if (!recipient) throw new Error('Directus administratoriaus gavėjas nerastas');

  await directus('/notifications', {
    method: 'POST',
    body: JSON.stringify({
      recipient,
      subject: 'Nauja Situacija.eu užklausa',
      message: `Gauta nauja užklausa iš situacija.eu kontaktinės formos. [Atidaryti užklausą](${DIRECTUS_ADMIN_URL}/content/requests/${requestId}).`,
      collection: 'requests',
      item: String(requestId),
    }),
  });
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
  // Social crawlers do not all support AVIF reliably yet, so keep the
  // optimized AVIF for the page while publishing its JPEG source in OG tags.
  const image = firstImage ? absoluteUrl(firstImage, pathname).replace(/\.avif$/i, '.jpg') : DEFAULT_OG_IMAGE;
  const headline = stripTags(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]) || title;
  return { title, description, canonical, image, headline };
}

function breadcrumbSchema(pathname, metadata, locale = 'lt', pageKey = null) {
  if (pageKey === 'home' || pathname === '/') return null;
  const homeName = locale === 'pl' ? 'Strona główna' : locale === 'ru' ? 'Главная' : 'Pradžia';
  const homeUrl = locale === 'lt' ? `${SITE_URL}/` : `${SITE_URL}/${locale}/`;
  const items = [{ '@type': 'ListItem', position: 1, name: homeName, item: homeUrl }];
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

function locationServiceSchema(pathname, metadata, locale = 'lt', pageKey = null) {
  if (!['pabrade', 'svencionys', 'vilnius'].includes(pageKey) && !pathname.startsWith('/plyteliu-klojimas-')) return null;
  const location = pageKey === 'pabrade' || pathname.includes('pabrade') ? 'Pabradė'
    : pageKey === 'svencionys' || pathname.includes('svencionys') ? 'Švenčionys ir Švenčionėliai'
      : 'Vilnius ir Vilniaus rajonas';
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: metadata.headline,
    description: metadata.description,
    url: metadata.canonical,
    areaServed: { '@type': 'AdministrativeArea', name: location },
    provider: { '@id': `${SITE_URL}/#business` },
    serviceType: locale === 'pl' ? 'Układanie płytek i wykończenia'
      : locale === 'ru' ? 'Укладка плитки и отделочные работы'
        : 'Plytelių klojimas ir apdaila',
    inLanguage: LOCALES[locale].schemaLang,
  };
}

function homeSchemas(locale = 'lt') {
  if (locale !== 'lt') {
    const content = locale === 'pl' ? {
      services: [
        ['Kompleksowe łazienki', 'Układanie płytek, hydroizolacja i narożniki 45°.'],
        ['Płytki w kuchni', 'Układanie płytek na ścianach i podłogach kuchennych.'],
        ['Płytki wielkoformatowe', 'Montaż gresu 60x120, 80x80 i 120x120 cm.'],
        ['Elewacje z klinkieru', 'Wykończenie elewacji, cokołów, ogrodzeń i kominków.'],
      ],
      howTo: ['Etapy układania płytek', 'Przebieg prac od oględzin do uszczelnienia.', [['Oględziny', 'Pomiary i wycena.'], ['Przygotowanie', 'Wyrównanie i hydroizolacja.'], ['Cięcie i klejenie', 'Precyzyjne cięcie i montaż.'], ['Fugowanie', 'Fugowanie i uszczelnienie narożników.']]],
      faq: [['Ile kosztuje układanie płytek?', 'Cena zależy od formatu, podłoża i zakresu prac.'], ['Gdzie świadczone są usługi?', 'Pabradė, Święciany, Nowe Święciany oraz po uzgodnieniu Wilno.'], ['Czy wykonujecie hydroizolację?', 'Tak, wykonujemy pełne przygotowanie stref mokrych.'], ['Czy układacie duże płytki?', 'Tak, układamy płytki 60x120, 80x80 i 120x120 cm.']],
    } : {
      services: [
        ['Комплексная отделка ванных', 'Укладка плитки, гидроизоляция и углы 45°.'],
        ['Плитка на кухне', 'Укладка плитки на кухонных стенах и полах.'],
        ['Крупноформатная плитка', 'Монтаж керамогранита 60x120, 80x80 и 120x120 см.'],
        ['Отделка клинкером', 'Отделка фасадов, цоколей, заборов и каминов.'],
      ],
      howTo: ['Этапы укладки плитки', 'Процесс работ от осмотра до герметизации.', [['Осмотр', 'Замеры и смета.'], ['Подготовка', 'Выравнивание и гидроизоляция.'], ['Резка и укладка', 'Точная резка и монтаж.'], ['Затирка', 'Заполнение швов и герметизация углов.']]],
      faq: [['Сколько стоит укладка плитки?', 'Цена зависит от формата, основания и объёма работ.'], ['Где вы работаете?', 'Пабраде, Швенчёнис, Швенчёнеляй и по договорённости Вильнюс.'], ['Выполняете ли вы гидроизоляцию?', 'Да, выполняем полную подготовку мокрых зон.'], ['Укладываете ли вы крупную плитку?', 'Да, укладываем плитку 60x120, 80x80 и 120x120 см.']],
    };
    return [{
      '@context': 'https://schema.org',
      '@graph': content.services.map(([name, description]) => ({
        '@type': 'Service', name, description, provider: { '@id': `${SITE_URL}/#business` },
        areaServed: ['Pabradė', 'Švenčionys', 'Švenčionėliai', 'Vilnius'],
      })),
    }, {
      '@context': 'https://schema.org', '@type': 'HowTo', name: content.howTo[0], description: content.howTo[1],
      inLanguage: LOCALES[locale].schemaLang,
      step: content.howTo[2].map(([name, text], index) => ({ '@type': 'HowToStep', position: index + 1, name, text })),
    }, {
      '@context': 'https://schema.org', '@type': 'FAQPage', inLanguage: LOCALES[locale].schemaLang,
      mainEntity: content.faq.map(([name, text]) => ({ '@type': 'Question', name, acceptedAnswer: { '@type': 'Answer', text } })),
    }];
  }
  return [{
    '@context': 'https://schema.org',
    '@graph': [
      ['Vonios kambarių įrengimas', 'Plytelių klojimas, hidroizoliacija ir 45° kampų suleidimas.', '/vonios-kambario-plyteliu-klijavimas.html'],
      ['Virtuvės plytelių klojimas', 'Virtuvės sienelių, prijuosčių ir grindų plytelių klojimas.', '/virtuves-plyteliu-klijavimas.html'],
      ['Didelio formato plytelių klojimas', '60x120, 80x80 ir 120x120 cm akmens masės plytelių montavimas.', '/didelio-formato-plyteliu-klojimas.html'],
      ['Kriauklės iš plytelių', 'Individualios plytelėmis formuojamos kriauklės su hidroizoliacija, nuolydžiais ir tiksliomis 45° briaunomis.', '/kriaukles-is-plyteliu.html'],
      ['Fasadų apdaila klinkeriu', 'Fasadų, cokolių, tvorų ir židinių apdaila klinkerio plytelėmis.', '/klinkerio-klijavimas-fasadai.html'],
    ].map(([name, description, url]) => ({
      '@type': 'Service',
      name,
      description,
      url: `${SITE_URL}${url}`,
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
      ['Ar įrengiamos kriauklės iš plytelių?', 'Taip, įrengiamos individualios plytelių kriauklės su suderinta konstrukcija, hidroizoliacija, nuolydžiais ir išleidimo mazgu.'],
    ].map(([name, text]) => ({ '@type': 'Question', name, acceptedAnswer: { '@type': 'Answer', text } })),
  }];
}

function transformHtml(rawHtml, pathname, { noindex = false, route: suppliedRoute = null } = {}) {
  const route = suppliedRoute || resolveRoute(pathname);
  const locale = route?.locale || 'lt';
  const pageKey = route?.pageKey || null;
  let html = route ? localizeHtml(rawHtml, route).html : rawHtml;
  html = enrichSiteHtml(html, locale, pageKey);
  html = html
    .replace(/href="((?:\.\.\/|\/)?style\.css)(?:\?[^"#]*)?"/g, `href="$1?v=${ASSET_VERSION}"`)
    .replace(/src="((?:\.\.\/|\/)?script\.js)(?:\?[^"#]*)?"/g, `src="$1?v=${ASSET_VERSION}"`)
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
    `<meta property="og:locale" content="${LOCALES[locale].ogLocale}">`,
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
  const schemas = [
    breadcrumbSchema(pathname, metadata, locale, pageKey),
    articleSchema(pathname, metadata),
    locationServiceSchema(pathname, metadata, locale, pageKey),
  ];
  if (pageKey === 'home' || pathname === '/') {
    if (locale !== 'lt') {
      schemas.push({
        '@context': 'https://schema.org',
        '@type': 'HomeAndConstructionBusiness',
        '@id': `${SITE_URL}/#business`,
        name: locale === 'pl' ? 'Situacija.eu – układanie płytek' : 'Situacija.eu — укладка плитки',
        url: metadata.canonical,
        telephone: '+37060030288',
        email: 'v.finazonok@gmail.com',
        image: DEFAULT_OG_IMAGE,
        areaServed: ['Pabradė', 'Švenčionys', 'Švenčionėliai', 'Vilnius'],
        inLanguage: LOCALES[locale].schemaLang,
      });
    }
    schemas.push(...homeSchemas(locale));
  }
  if (pageKey === 'faq' && locale !== 'lt') schemas.push(homeSchemas(locale)[2]);
  for (const schema of schemas.filter(Boolean)) {
    tags.push(`<script type="application/ld+json">${jsonLd(schema)}</script>`);
  }
  const googleTag = `
    <!-- Google tag (gtag.js) with Consent Mode -->
    <script>
      window.dataLayer = window.dataLayer || [];
      window.gtag = window.gtag || function(){ dataLayer.push(arguments); };
      gtag('consent', 'default', {
        analytics_storage: localStorage.getItem('situacija_analytics_consent') === 'granted' ? 'granted' : 'denied',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        functionality_storage: 'granted',
        security_storage: 'granted'
      });
      gtag('js', new Date());
      gtag('config', '${GOOGLE_TAG_ID}');
    </script>
    <script async src="https://www.googletagmanager.com/gtag/js?id=${GOOGLE_TAG_ID}"></script>`;
  return html
    .replace('<head>', `<head>${googleTag}`)
    .replace('</head>', `    ${tags.join('\n    ')}\n</head>`);
}

async function sendHtml(res, relativePath, pathname, status = 200, options = {}) {
  const absolutePath = path.join(__dirname, relativePath);
  let raw = fs.readFileSync(absolutePath, 'utf8');
  const route = options.route || resolveRoute(pathname);
  if ((pathname === '/' || pathname === '/index.html') && (!route || route.locale === 'lt')) {
    try {
      const builderPage = await loadBuilderPage('home');
      if (builderPage) raw = applyBuilderPage(raw, builderPage);
    } catch (error) {
      console.error('Directus page builder read failed; using static fallback:', error.message);
    }
  }
  res.status(status);
  res.setHeader('Cache-Control', 'no-cache, must-revalidate');
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
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.sendFile(path.join(__dirname, 'sitemap.xml'));
});
app.get('/favicon.ico', (req, res) => res.redirect(301, '/favicon.svg'));
app.get('/robots.txt', (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.sendFile(path.join(__dirname, 'robots.txt'));
});
app.get(['/llms.txt', '/llms-full.txt'], (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.type('text/plain').sendFile(path.join(__dirname, req.path.slice(1)));
});

const canonicalRedirects = new Map([
  ['/index.html', '/'],
  ['/blogas', '/blogas.html'],
  ['/duk', '/duk.html'],
  ['/galerija', '/gallery.html'],
  ['/gallery', '/gallery.html'],
  ['/plyteliu-klojimas-pabrade', '/plyteliu-klojimas-pabrade.html'],
  ['/plyteliu-klojimas-svencionys', '/plyteliu-klojimas-svencionys.html'],
  ['/plyteliu-klojimas-vilnius', '/plyteliu-klojimas-vilnius.html'],
  ['/kriaukles-is-plyteliu', '/kriaukles-is-plyteliu.html'],
  ['/privatumo-politika', '/privatumo-politika.html'],
  ['/vonios-kambario-plyteliu-klijavimas', '/vonios-kambario-plyteliu-klijavimas.html'],
  ['/virtuves-plyteliu-klijavimas', '/virtuves-plyteliu-klijavimas.html'],
  ['/didelio-formato-plyteliu-klojimas', '/didelio-formato-plyteliu-klojimas.html'],
  ['/klinkerio-klijavimas-fasadai', '/klinkerio-klijavimas-fasadai.html'],
  ['/kontaktai', '/#contact'],
  ['/kontaktai.html', '/#contact'],
  ['/apie-mus', '/#about'],
  ['/apie-mus.html', '/#about'],
  ['/pl', '/pl/'],
  ['/ru', '/ru/'],
  ['/pl/index.html', '/pl/'],
  ['/ru/index.html', '/ru/'],
  ['/pl/sitemap.xml', '/sitemap.xml'],
  ['/ru/sitemap.xml', '/sitemap.xml'],
  ['/pl/crm.html', '/pl/'],
  ['/ru/crm.html', '/ru/'],
]);
for (const [from, to] of canonicalRedirects) {
  app.get(from, (req, res, next) => (req.path === from ? res.redirect(301, to) : next()));
}

app.get(['/crm', '/crm.html'], (req, res) => res.redirect(301, DIRECTUS_ADMIN_URL));

app.post('/api/requests', async (req, res) => {
  const { lang = 'lt' } = req.body;
  const locale = ['pl', 'ru'].includes(lang) ? lang : 'lt';
  const errors = locale === 'pl'
    ? { required: 'Imię i telefon są wymagane.', invalid: 'Sprawdź długość podanych danych.', limited: 'Zbyt wiele prób. Spróbuj ponownie za 15 minut.', save: 'Nie udało się zapisać zapytania.' }
    : locale === 'ru'
      ? { required: 'Имя и телефон обязательны.', invalid: 'Проверьте длину введённых данных.', limited: 'Слишком много попыток. Повторите через 15 минут.', save: 'Не удалось сохранить заявку.' }
      : { required: 'Vardas ir telefonas yra privalomi!', invalid: 'Patikrinkite įvestų duomenų ilgį.', limited: 'Per daug bandymų. Pamėginkite po 15 minučių.', save: 'Nepavyko išsaugoti užklausos.' };
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
  const phone = typeof req.body.phone === 'string' ? req.body.phone.trim() : '';
  const message = typeof req.body.message === 'string' ? req.body.message.trim() : '';
  if (!name || !phone) return res.status(400).json({ error: errors.required });
  if (name.length > 100 || phone.length > 40 || message.length > 3000) {
    return res.status(400).json({ error: errors.invalid });
  }
  if (requestLimitExceeded(req.ip || req.socket.remoteAddress || 'unknown')) {
    return res.status(429).json({ error: errors.limited });
  }
  try {
    const result = await directus('/items/requests', {
      method: 'POST',
      body: JSON.stringify({ name, phone, message, status: 'new' }),
    });
    try {
      await notifyAdminAboutRequest(result.data.id);
    } catch (notificationError) {
      console.error('Directus request notification failed:', notificationError.message);
    }
    res.setHeader('Cache-Control', 'no-store');
    res.status(201).json({ success: true, id: result.data.id });
  } catch (error) {
    console.error('Directus request create failed:', error.message);
    res.status(502).json({ error: errors.save });
  }
});

app.get('/api/images', async (req, res) => {
  try {
    const locale = ['pl', 'ru'].includes(req.query.lang) ? req.query.lang : 'lt';
    const query = new URLSearchParams({
      fields: 'id,image,category,title,description,date_created',
      sort: '-date_created',
      'filter[status][_eq]': 'published',
      limit: '-1',
    });
    const result = await directus(`/items/gallery?${query}`);
    const images = result.data.map((item, index) => {
      const file = typeof item.image === 'object' ? item.image : { id: item.image };
      const sourceTitle = item.title || `Plytelių klojimo darbai Pabradėje – ${String(index + 1).padStart(2, '0')}`;
      const title = translateGalleryTitle(sourceTitle, locale);
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
app.get('*', async (req, res, next) => {
  const localizedRoute = resolveRoute(req.path);
  if (localizedRoute) {
    try {
      return await sendHtml(res, localizedRoute.source, localizedRoute.pathname, 200, { route: localizedRoute });
    } catch (error) {
      return next(error);
    }
  }
  const relative = decodeURIComponent(req.path).replace(/^\/+/, '');
  const target = extensionlessPages.get(req.path) || relative;
  if (!target || !target.endsWith('.html')) return next();
  const normalized = path.posix.normalize(target);
  if (normalized.startsWith('../')) return next();
  const absolute = path.join(__dirname, normalized);
  if (!fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) return next();
  try {
    await sendHtml(res, normalized, req.path === '/index.html' ? '/' : req.path);
  } catch (error) {
    next(error);
  }
});

app.use(express.static(__dirname, {
  index: false,
  fallthrough: true,
  maxAge: '1y',
  immutable: true,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache');
    if (filePath.endsWith('.avif')) res.setHeader('Content-Type', 'image/avif');
  },
}));

app.use(async (req, res) => {
  if (req.method === 'GET' || req.method === 'HEAD') {
    return await sendHtml(res, '404.html', req.path, 404, { noindex: true });
  }
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`Serveris veikia ant porto ${PORT}; turinys valdomas per Directus.`);
});
