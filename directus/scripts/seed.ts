import { createItem, readFiles, readItems, updateSingleton } from '@directus/sdk';
import { createAdminClient } from './client.js';

const guide = `
<h1>SITUACIJA.EU REDAGAVIMO INSTRUKCIJA</h1>
<p><strong>Ši instrukcija skirta žmogui, kuris pirmą kartą gyvenime atidarė svetainės valdymą.</strong> Atlikite veiksmus iš eilės ir viskas bus gerai.</p>
<blockquote><p><strong>Pati svarbiausia taisyklė:</strong> naudokite tik meniu „Puslapiai“, „Paslaugos“, „Galerija“, „Failai“, „Užklausos“ ir „Redagavimo instrukcija“. Jeigu mygtuko ar lauko nesuprantate – jo nelieskite.</p></blockquote>

<h2>1. Kaip pridėti naują sekciją</h2>
<ol>
  <li>Kairėje paspauskite <strong>Puslapiai</strong>.</li>
  <li>Paspauskite norimo puslapio pavadinimą.</li>
  <li>Atverkite grupę <strong>📝 Turinys</strong>.</li>
  <li>Lauke <strong>Puslapio sekcijos</strong> paspauskite <strong>Sukurti naują</strong>.</li>
  <li>Pasirinkite bloką pagal paskirtį. Pavyzdžiui, „🎬 Titulinis blokas“ skirtas pirmajam ekranui, o „❓ Klausimai ir atsakymai“ – D.U.K.</li>
  <li>Užpildykite laukus. Po kiekvienu lauku yra trumpas paaiškinimas.</li>
  <li>Viršuje dešinėje paspauskite <strong>Išsaugoti</strong>.</li>
  <li>Grįžę į puslapį dar kartą paspauskite <strong>Išsaugoti</strong>.</li>
</ol>
<p>Norėdami pakeisti sekcijų tvarką, laikykite tempimo rankenėlę kairėje ir nutempkite sekciją aukščiau arba žemiau.</p>

<h2>2. Ką reiškia būsenos</h2>
<ul>
  <li><strong>Juodraštis</strong> – darbą matote jūs per peržiūrą, tačiau svetainės lankytojai jo dar nemato.</li>
  <li><strong>Paskelbta</strong> – puslapį gali matyti visi lankytojai ir Google.</li>
  <li><strong>Archyvuota</strong> – puslapis saugiai paslėptas. Naudokite vietoje trynimo.</li>
</ul>
<blockquote><p>Jei abejojate, rinkitės <strong>Juodraštis</strong>. Puslapių netrinkite.</p></blockquote>

<h2>3. Peržiūra prieš paskelbiant</h2>
<ol>
  <li>Puslapį palikite būsenos <strong>Juodraštis</strong>.</li>
  <li>Išsaugokite pakeitimus.</li>
  <li>Puslapio viršuje įjunkite <strong>Peržiūra / Preview</strong>.</li>
  <li>Dešinėje pamatysite tikrą puslapį su dar nepaskelbtais pakeitimais.</li>
  <li>Jeigu viskas gerai, būseną pakeiskite į <strong>Paskelbta</strong> ir išsaugokite.</li>
</ol>

<h2>4. Nuotraukų taisyklės</h2>
<ul>
  <li>Geriausiai tinka <strong>JPG, PNG arba WEBP</strong>.</li>
  <li>Vienas failas turėtų būti <strong>iki 500 KB</strong>. Didelė nuotrauka lėtina svetainę.</li>
  <li>Hero fonui naudokite horizontalią nuotrauką, bent <strong>1920 × 1080 px</strong>.</li>
  <li>Kortelėms ir galerijai tinka maždaug <strong>1200 × 900 px</strong>.</li>
  <li>Failą pavadinkite aiškiai, pavyzdžiui <em>plyteliu-vonia-pabrade.webp</em>, o ne <em>IMG_9382.jpg</em>.</li>
  <li>Nekelkite tos pačios nuotraukos antrą kartą – pirmiausia paieškokite jos skiltyje <strong>Failai</strong>.</li>
</ul>

<h2>5. SEO laukų paaiškinimas</h2>
<ol>
  <li><strong>Google pavadinimas</strong> – mėlyna antraštė Google rezultate. Rašykite aiškiai, iki 60 simbolių.</li>
  <li><strong>Google aprašymas</strong> – trumpas tekstas po pavadinimu. Iki 160 simbolių.</li>
  <li><strong>Dalinimosi nuotrauka</strong> – rodoma, kai nuoroda dalinamasi Facebook ar žinutėje.</li>
  <li><strong>Slėpti nuo Google</strong> – beveik visada palikite išjungta. Įjungus Google puslapio nerodys.</li>
</ol>

<h2>6. Ką daryti, jei kažką sulaužiau</h2>
<ol>
  <li>Nepanikuokite ir nieko daugiau nekeiskite.</li>
  <li>Atidarykite tą patį puslapį ar bloką.</li>
  <li>Dešinėje atverkite <strong>Revisions / Pakeitimų istorija</strong>.</li>
  <li>Pasirinkite paskutinę versiją, kuri dar buvo teisinga.</li>
  <li>Palyginkite pakeitimus ir atkurkite ankstesnę versiją.</li>
  <li>Jeigu nesate tikri – uždarykite langą nieko neišsaugoję ir parašykite administratoriui.</li>
</ol>

<h2>7. Saugus kasdienio darbo patikrinimas</h2>
<ol>
  <li>Ar redagavote tinkamą puslapį?</li>
  <li>Ar antraštėje nėra klaidų?</li>
  <li>Ar nuotrauka aiški ir ne per didelė?</li>
  <li>Ar mygtuko nuoroda atsidaro?</li>
  <li>Ar peržiūra telefone atrodo gerai?</li>
  <li>Ar būseną pasirinkote sąmoningai?</li>
  <li>Tik tada spauskite <strong>Išsaugoti</strong>.</li>
</ol>`;

const blocks = [
  ['block_hero', { title: '🎬 Demo – pirmasis ekranas', headline: 'Meistriškai išklotos plytelės jūsų namams', subheadline: 'Vonios, virtuvės, terasos ir individualios plytelių kriauklės Pabradėje, Švenčionyse ir Vilniuje.', cta_primary_label: 'Gauti pasiūlymą', cta_primary_url: '#contact', cta_secondary_label: 'Peržiūrėti darbus', cta_secondary_url: '/gallery.html', overlay_opacity: 58, height: 'medium' }],
  ['block_richtext', { title: '📝 Demo – įžanginis tekstas', content: '<h2>Plytelių darbai be nemalonių staigmenų</h2><p>Prieš pradėdami darbą aptariame pagrindo paruošimą, hidroizoliaciją, išdėstymą ir terminus. Kiekvienas kampas bei siūlė suplanuojami iš anksto.</p>', max_width: 'medium', align: 'left' }],
  ['block_text_image', { title: '🖼️ Demo – tekstas su nuotrauka', headline: 'Tikslumas nuo pagrindo iki paskutinės siūlės', content: '<p>Dirbame su didelio formato plytelėmis, akmens mase ir klinkeriu. Naudojame patikimas medžiagas ir laikomės technologinių reikalavimų.</p>', image_position: 'right', cta_label: 'Apžiūrėti galeriją', cta_url: '/gallery.html' }],
  ['block_features', { title: '✨ Demo – privalumai', headline: 'Kodėl klientai renkasi mus', subheadline: 'Aiškus procesas, profesionalus atlikimas ir atsakomybė už rezultatą.', columns: 3, items: [{ icon: '📐', title: 'Tikslūs matavimai', description: 'Iš anksto suplanuojamos siūlės, pjūviai ir mazgai.' }, { icon: '🛡️', title: 'Patikima hidroizoliacija', description: 'Šlapiose zonose naudojama pilna hidroizoliacijos sistema.' }, { icon: '✅', title: 'Darbų garantija', description: 'Už atliktus darbus atsakome ir po projekto pabaigos.' }] }],
  ['block_gallery', { title: '📸 Demo – darbų galerija', headline: 'Naujausi darbai', layout: 'grid', columns: 3 }],
  ['block_cta', { title: '📣 Demo – kvietimas veikti', headline: 'Turite projektą? Aptarkime jį', text: 'Atsiųskite patalpų nuotraukas ir trumpą aprašymą – pateiksime pirminį įvertinimą.', button_label: 'Skambinti +370 600 30288', button_url: 'tel:+37060030288', background_style: 'gradient' }],
  ['block_faq', { title: '❓ Demo – dažni klausimai', headline: 'Dažniausiai užduodami klausimai' }],
  ['block_testimonials', { title: '💬 Demo – atsiliepimai', headline: 'Ką sako klientai', items: [{ quote: 'Darbas atliktas labai tvarkingai, terminai išlaikyti, o rezultatas pranoko lūkesčius.', author: 'Tomas', role: 'Pabradė', rating: 5 }, { quote: 'Meistras padėjo parinkti išdėstymą ir paaiškino kiekvieną sprendimą.', author: 'Rasa', role: 'Švenčionys', rating: 5 }] }],
  ['block_pricing', { title: '💶 Demo – kainų planai', headline: 'Orientaciniai pasiūlymai', plans: [{ name: 'Konsultacija', price: 'Nemokamai', period: '', features: ['Pirminis įvertinimas', 'Medžiagų rekomendacijos'], cta_label: 'Susisiekti', cta_url: '#contact', highlighted: false }, { name: 'Pilnas įrengimas', price: 'Pagal sąmatą', period: '', features: ['Pagrindo paruošimas', 'Hidroizoliacija', 'Plytelių klijavimas'], cta_label: 'Gauti sąmatą', cta_url: '#contact', highlighted: true }] }],
  ['block_contact_form', { title: '✉️ Demo – kontaktų forma', headline: 'Gaukite darbų įvertinimą', fields: [{ label: 'Vardas', type: 'text', required: true }, { label: 'Telefonas', type: 'tel', required: true }, { label: 'El. paštas', type: 'email', required: false }, { label: 'Trumpai aprašykite darbą', type: 'textarea', required: true }], recipient_email: 'norbe@situacija.eu', success_message: 'Ačiū! Užklausą gavome ir netrukus susisieksime.' }],
  ['block_map', { title: '📍 Demo – veiklos teritorija', address: 'Pabradė, Švenčionių r., Lietuva', lat: 54.9812, lng: 25.7611, zoom: 12 }],
  ['block_spacer', { title: '↕️ Demo – tarpas tarp sekcijų', height: 'small' }],
] as const;

async function main() {
  const client = await createAdminClient();
  await client.request(updateSingleton('redagavimo_instrukcija' as never, { turinys: guide } as any));

  const existing = await client.request(readItems('pages', { filter: { slug: { _eq: 'site-builder-demo' } }, fields: ['id'], limit: 1 } as any));
  if (existing[0]) {
    console.log(JSON.stringify({ status: 'SEED_READY', page: 'site-builder-demo', created: false, instructionUpdated: true }, null, 2));
    return;
  }

  const seo = await client.request(createItem('seo', {
    meta_title: 'Puslapių konstruktoriaus pavyzdys | Situacija.eu',
    meta_description: 'Visų Situacija.eu puslapių konstruktoriaus blokų pavyzdžiai viename juodraščio puslapyje.',
    no_index: true,
  } as any));
  const page = await client.request(createItem('pages', {
    status: 'draft', title: 'Puslapių konstruktoriaus pavyzdys', slug: 'site-builder-demo', seo_id: seo.id,
  } as any));

  const fileRows = await client.request(readFiles({ filter: { type: { _starts_with: 'image/' } }, fields: ['id'], sort: ['-uploaded_on'], limit: 6 } as any));
  const imageIds = fileRows.map((file) => String(file.id));
  const created: Array<{ collection: string; id: string | number }> = [];
  for (const [collection, values] of blocks) {
    const payload: Record<string, unknown> = { ...values };
    if (collection === 'block_hero' && imageIds[0]) payload.background_image = imageIds[0];
    if (collection === 'block_text_image' && imageIds[1]) payload.image = imageIds[1];
    const item = await client.request(createItem(collection, payload as any)) as any;
    created.push({ collection, id: item.id });
    await client.request(createItem('page_sections', { pages_id: page.id, collection, item: String(item.id), sort: created.length } as any));

    if (collection === 'block_gallery') {
      for (const [index, fileId] of imageIds.entries()) await client.request(createItem('block_gallery_files', { block_gallery_id: item.id, directus_files_id: fileId, sort: index + 1 } as any));
    }
    if (collection === 'block_faq') {
      for (const [index, faq] of [
        { question: 'Kiek laiko trunka vonios plytelių darbai?', answer: '<p>Dažniausiai 2–4 savaites, priklausomai nuo pagrindo būklės, plytelių formato ir darbų apimties.</p>' },
        { question: 'Ar padedate apskaičiuoti plytelių kiekį?', answer: '<p>Taip. Įvertiname plotą, raštą, pjovimus ir rekomenduojamą atsargą.</p>' },
      ].entries()) await client.request(createItem('faq_items', { block_faq_id: item.id, sort: index + 1, ...faq } as any));
    }
  }

  console.log(JSON.stringify({ status: 'SEED_READY', page: 'site-builder-demo', created: true, blocks: created.length, statusValue: 'draft', existingPagesChanged: false, instructionUpdated: true }, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
