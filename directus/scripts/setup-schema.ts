import {
  createCollection,
  createField,
  createFolder,
  createRelation,
  readCollection,
  readCollections,
  readField,
  readFolders,
  readRelation,
  updateCollection,
  updateField,
} from '@directus/sdk';
import { createAdminClient, lietuviskasLaukas, lietuviskasPavadinimas } from './client.js';

type AnyObject = Record<string, any>;

let client: Awaited<ReturnType<typeof createAdminClient>>;
let collectionNames = new Set<string>();

const STATUS_CHOICES = {
  choices: [
    { text: 'Juodraštis', value: 'draft', icon: 'edit_note', color: '#A2B5CD' },
    { text: 'Paskelbta', value: 'published', icon: 'check_circle', color: '#2ECDA7' },
    { text: 'Archyvuota', value: 'archived', icon: 'archive', color: '#E35169' },
  ],
};

const BLOCKS = [
  'block_hero',
  'block_richtext',
  'block_text_image',
  'block_features',
  'block_gallery',
  'block_cta',
  'block_faq',
  'block_testimonials',
  'block_pricing',
  'block_contact_form',
  'block_map',
  'block_spacer',
];

async function exists(run: () => Promise<unknown>) {
  try {
    await run();
    return true;
  } catch {
    // Directus grąžina 403 ir neegzistuojančiam sistemos resursui, net administratoriui.
    return false;
  }
}

async function ensureCollection(
  collection: string,
  label: string,
  icon: string,
  options: AnyObject = {},
) {
  const meta: AnyObject = {
    icon,
    color: options.color ?? null,
    note: options.note ?? null,
    display_template: options.display ?? '{{title}}',
    hidden: options.hidden ?? false,
    singleton: options.singleton ?? false,
    group: options.group ?? null,
    sort: options.sort ?? null,
    collapse: options.collapse ?? 'open',
    archive_field: options.archiveField ?? null,
    archive_value: options.archiveValue ?? null,
    unarchive_value: options.unarchiveValue ?? null,
    archive_app_filter: options.archiveField ? true : false,
    versioning: options.versioning ?? false,
    preview_url: options.previewUrl ?? null,
    accountability: 'all',
    translations: lietuviskasPavadinimas(label),
  };
  if (options.status) meta.status = options.status;

  if (collectionNames.has(collection)) {
    await client.request(updateCollection(collection, { meta } as any));
    return;
  }
  await client.request(createCollection({
    collection,
    meta,
    schema: options.folder ? null : { name: collection },
  } as any));
  collectionNames.add(collection);
}

async function ensureField(
  collection: string,
  field: string,
  type: string,
  label: string,
  meta: AnyObject = {},
  schema: AnyObject | null = {},
) {
  const fieldMeta = {
    interface: meta.interface ?? 'input',
    display: meta.display ?? null,
    special: meta.special ?? null,
    options: meta.options ?? null,
    display_options: meta.display_options ?? null,
    width: meta.width ?? 'full',
    group: meta.group ?? null,
    sort: meta.sort ?? null,
    hidden: meta.hidden ?? false,
    readonly: meta.readonly ?? false,
    required: meta.required ?? false,
    searchable: meta.searchable ?? true,
    note: meta.note ?? null,
    // Directus laukų validacija naudoja pilną filtro taisyklę: { laukas: { operatorius: reikšmė } }.
    // Vien operatoriaus objektas sukelia rekursinį Joi generavimą Directus 12.
    validation: meta.validation ? { [field]: meta.validation } : null,
    validation_message: meta.validationMessage ?? null,
    translations: lietuviskasLaukas(label),
  };
  const fieldSchema = schema === null ? null : {
    // DB laukas lieka nullable, kad naują privalomą lauką būtų saugu pridėti
    // jau duomenų turinčiai kolekcijai. Privalomumą užtikrina Studio validacija.
    is_nullable: true,
    ...schema,
  };

  if (await exists(() => client.request(readField(collection, field)))) {
    await client.request(updateField(collection, field, {
      meta: fieldMeta,
      ...(fieldSchema ? { schema: fieldSchema } : {}),
    } as any));
    return;
  }
  await client.request(createField(collection as never, {
    field,
    type,
    meta: fieldMeta,
    schema: fieldSchema,
  } as any));
}

async function ensureAlias(
  collection: string,
  field: string,
  label: string,
  special: string[],
  interfaceName: string,
  options: AnyObject = {},
  meta: AnyObject = {},
) {
  await ensureField(collection, field, 'alias', label, {
    interface: interfaceName,
    special,
    options,
    ...meta,
  }, null);
}

async function ensureRelation(
  collection: string,
  field: string,
  relatedCollection: string | null,
  relatedField: string | null = null,
  meta: AnyObject = {},
) {
  if (await exists(() => client.request(readRelation(collection, field)))) return;
  await client.request(createRelation({
    collection,
    field,
    related_collection: relatedCollection,
    schema: { on_delete: meta.one_deselect_action === 'delete' ? 'CASCADE' : 'SET NULL' },
    meta: { one_field: relatedField, ...meta },
  } as any));
}

async function ensureImageFolder() {
  const folders = await client.request(readFolders({
    filter: { name: { _eq: 'Svetainės nuotraukos' } },
    limit: 1,
  } as any));
  if (folders[0]) return folders[0].id;
  const folder = await client.request(createFolder({ name: 'Svetainės nuotraukos' } as any));
  return folder.id;
}

async function main() {
client = await createAdminClient();
collectionNames = new Set((await client.request(readCollections())).map((item: any) => item.collection));
console.log(`Aptikta ${collectionNames.size} esamų kolekcijų.`);
console.log(`CMS grupės: ${['cms_content', 'cms_blocks', 'cms_settings'].map((name) => `${name}=${collectionNames.has(name)}`).join(', ')}`);
const imageFolder = await ensureImageFolder();

// Šoninės juostos grupės.
await ensureCollection('cms_content', '📄 Turinys', 'article', { folder: true, sort: 1, collapse: 'open' });
await ensureCollection('cms_blocks', '🧩 Blokai', 'dashboard_customize', { folder: true, sort: 2, hidden: true, collapse: 'closed' });
await ensureCollection('cms_settings', '⚙️ Nustatymai', 'settings', { folder: true, sort: 3, collapse: 'open' });

// Directus Core leidžia 25 aktyvias kolekcijas. Seni builderio rinkiniai paliekami
// duomenų bazėje, tačiau išjungiami, nes juos pakeičia žemiau esanti nauja schema.
for (const legacyCollection of [
  'block_cards', 'block_contact', 'block_services', 'block_text',
  'builder_cards', 'page_blocks', 'requests', 'site_content',
]) {
  if (await exists(() => client.request(readCollection(legacyCollection)))) {
    await client.request(updateCollection(legacyCollection, {
      meta: {
        status: 'inactive', hidden: true,
        note: 'Senas techninis rinkinys. Duomenys išsaugoti, bet naujas CMS jo nebenaudoja.',
      },
    } as any));
  }
}

await ensureCollection('pages', 'Puslapiai', 'web', {
  group: 'cms_content', sort: 1, color: '#6644FF', versioning: true,
  archiveField: 'status', archiveValue: 'archived', unarchiveValue: 'draft',
  previewUrl: `${process.env.FRONTEND_URL ?? 'https://situacija.eu'}/api/preview?secret=${process.env.PREVIEW_SECRET ?? 'NUSTATYKITE_PREVIEW_SECRET'}&slug={{slug}}&id={{id}}&version={{$version}}`,
  note: 'Čia kuriami ir iš sekcijų sudėliojami svetainės puslapiai.',
});
await ensureCollection('services', 'Paslaugos', 'design_services', {
  group: 'cms_content', sort: 2, color: '#149C95',
  note: 'Svetainėje rodomos paslaugos, jų aprašymai, nuotraukos ir nuorodos.',
});
await ensureCollection('gallery', 'Galerija', 'photo_library', {
  group: 'cms_content', sort: 3, color: '#E58A2B', note: 'Atliktų darbų nuotraukos.',
});
await ensureCollection('seo', 'SEO nustatymai', 'search', {
  hidden: true, group: 'cms_blocks', display: '{{meta_title}}', color: '#4285F4',
});
await ensureCollection('globals', 'Bendri nustatymai', 'public', {
  group: 'cms_settings', sort: 1, singleton: true, display: '{{site_name}}',
  note: 'Telefono numeris, logotipas, kontaktai ir analitikos kodai visai svetainei.',
});
await ensureCollection('navigation', 'Meniu', 'menu', {
  group: 'cms_settings', sort: 2, display: '{{title}}', note: 'Viršutinio ir apatinio svetainės meniu nustatymai.',
});
await ensureCollection('navigation_items', 'Meniu punktai', 'link', { hidden: true, group: 'cms_blocks', display: '{{label}}' });
await ensureCollection('forms_submissions', 'Užklausos', 'mail', {
  sort: 4, color: '#E35169', display: '{{date_created}} — {{name}}',
  note: 'Iš svetainės formų gautos klientų užklausos.',
});
await ensureCollection('redagavimo_instrukcija', 'Redagavimo instrukcija', 'menu_book', {
  sort: 5, color: '#7C5CFC', singleton: true,
  note: 'Labai paprasta instrukcija, kaip saugiai redaguoti svetainę.',
});

const blockCollections: Array<[string, string, string, string]> = [
  ['block_hero', '🎬 Titulinis blokas', 'movie', '#6644FF'],
  ['block_richtext', '📝 Teksto blokas', 'subject', '#3F51B5'],
  ['block_text_image', '🖼️ Tekstas su nuotrauka', 'view_sidebar', '#2196F3'],
  ['block_features', '✨ Privalumai', 'auto_awesome', '#00A86B'],
  ['block_gallery', '📸 Nuotraukų galerija', 'photo_library', '#E58A2B'],
  ['block_cta', '📣 Kvietimas veikti', 'campaign', '#E35169'],
  ['block_faq', '❓ Klausimai ir atsakymai', 'quiz', '#8E44AD'],
  ['block_testimonials', '💬 Klientų atsiliepimai', 'format_quote', '#16A085'],
  ['block_pricing', '💶 Kainų planai', 'payments', '#F39C12'],
  ['block_contact_form', '✉️ Kontaktų forma', 'contact_mail', '#2980B9'],
  ['block_map', '📍 Žemėlapis', 'map', '#27AE60'],
  ['block_spacer', '↕️ Tarpas', 'height', '#7F8C8D'],
];
for (const [collection, label, icon, color] of blockCollections) {
  await ensureCollection(collection, label, icon, {
    hidden: true, group: 'cms_blocks', color, display: '{{title}}',
    note: `${label}. Šis blokas į puslapį įdedamas per lauką „Sekcijos“.`,
  });
}

for (const [collection, label, display] of [
  ['page_sections', 'Puslapio sekcijų ryšiai', '{{collection}} — {{item}}'],
  ['block_gallery_files', 'Galerijos nuotraukų ryšiai', '{{directus_files_id.filename_download}}'],
] as const) {
  await ensureCollection(collection, label, 'account_tree', { hidden: true, group: 'cms_blocks', display });
}

// Puslapio grupės ir laukai.
await ensureAlias('pages', 'content_group', '📝 Turinys', ['group'], 'group-detail', { start: 'open' }, { sort: 1 });
await ensureAlias('pages', 'appearance_group', '🎨 Išvaizda', ['group'], 'group-detail', { start: 'closed' }, { sort: 10 });
await ensureAlias('pages', 'seo_group', '🔍 SEO', ['group'], 'group-detail', { start: 'closed' }, { sort: 20 });
await ensureAlias('pages', 'settings_group', '⚙️ Nustatymai', ['group'], 'group-detail', { start: 'closed' }, { sort: 30 });
await ensureField('pages', 'status', 'string', 'Būsena', {
  group: 'content_group', sort: 1, interface: 'select-dropdown', options: STATUS_CHOICES, required: true,
  note: 'Juodraštis lankytojams nerodomas. Paskelbta – matoma svetainėje. Archyvuota – saugiai paslėpta.',
  validation: { _in: ['draft', 'published', 'archived'] }, validationMessage: 'Pasirinkite vieną iš trijų būsenų.',
}, { default_value: 'draft', max_length: 32 });
await ensureField('pages', 'sort', 'integer', 'Eiliškumas', { group: 'settings_group', sort: 1, interface: 'input', note: 'Mažesnis skaičius rodomas aukščiau sąraše.' });
await ensureField('pages', 'title', 'string', 'Puslapio pavadinimas', {
  group: 'content_group', sort: 2, required: true,
  note: 'Vidinis ir lankytojams matomas puslapio pavadinimas.',
  validation: { _nempty: true }, validationMessage: 'Įrašykite puslapio pavadinimą.',
}, { max_length: 255 });
await ensureField('pages', 'slug', 'string', 'Puslapio adresas', {
  group: 'content_group', sort: 3, interface: 'input', options: { slug: true, template: '{{title}}' }, required: true,
  note: 'Sukuriamas automatiškai iš pavadinimo. Naudokite tik mažąsias raides, skaičius ir brūkšnelius.',
  validation: { _regex: '^[a-z0-9]+(?:-[a-z0-9]+)*$' }, validationMessage: 'Adrese galima naudoti tik mažąsias raides, skaičius ir brūkšnelius.',
}, { max_length: 255, is_unique: true });
await ensureAlias('pages', 'sections', 'Puslapio sekcijos', ['m2a'], 'directus-labs-experimental-m2a-interface', {
  enableCreate: true, enableSelect: true,
}, { group: 'content_group', sort: 4, note: 'Pridėkite blokus ir keiskite jų tvarką tempdami už rankenėlės.' });
await ensureField('pages', 'seo_id', 'integer', 'SEO nustatymai', {
  group: 'seo_group', sort: 1, interface: 'select-dropdown-m2o', special: ['m2o'],
  note: 'Google paieškos pavadinimas, aprašymas ir dalinimosi nuotrauka.',
});
for (const [field, type, label, special, sort] of [
  ['user_created', 'uuid', 'Sukūrė', ['user-created'], 1],
  ['date_created', 'timestamp', 'Sukurta', ['date-created'], 2],
  ['user_updated', 'uuid', 'Atnaujino', ['user-updated'], 3],
  ['date_updated', 'timestamp', 'Atnaujinta', ['date-updated'], 4],
] as const) {
  await ensureField('pages', field, type, label, {
    group: 'settings_group', sort, special, readonly: true, interface: field.startsWith('user') ? 'select-dropdown-m2o' : 'datetime',
    note: 'Šį lauką Directus užpildo automatiškai.',
  });
}

await ensureField('seo', 'meta_title', 'string', 'Google pavadinimas', {
  required: true, options: { softLength: 60 }, note: 'Paieškos rezultato antraštė. Rekomenduojama iki 60 simbolių.',
  validation: { _regex: '^.{1,60}$' }, validationMessage: 'Google pavadinimas turi būti nuo 1 iki 60 simbolių.',
}, { max_length: 60 });
await ensureField('seo', 'meta_description', 'text', 'Google aprašymas', {
  interface: 'input-multiline', options: { softLength: 160 }, note: 'Trumpas puslapio aprašymas. Rekomenduojama iki 160 simbolių.',
  validation: { _regex: '^[\\s\\S]{0,160}$' }, validationMessage: 'Google aprašymas negali būti ilgesnis nei 160 simbolių.',
});
await ensureField('seo', 'og_image', 'uuid', 'Dalinimosi nuotrauka', {
  interface: 'file-image', special: ['file'], options: { folder: imageFolder }, note: 'Rodoma dalinantis puslapiu socialiniuose tinkluose. Rekomenduojama 1200 × 630 px.',
});
await ensureField('seo', 'no_index', 'boolean', 'Slėpti nuo Google', {
  interface: 'boolean', special: ['cast-boolean'], note: 'Įjunkite tik jei puslapis neturi būti rodomas paieškoje.',
}, { default_value: false });

// Bendri visų blokų laukai ir grupės.
for (const collection of BLOCKS) {
  await ensureAlias(collection, 'content_group', '📝 Turinys', ['group'], 'group-detail', { start: 'open' }, { sort: 1 });
  await ensureAlias(collection, 'appearance_group', '🎨 Išvaizda', ['group'], 'group-detail', { start: 'closed' }, { sort: 20 });
  await ensureAlias(collection, 'seo_group', '🔍 SEO', ['group'], 'group-detail', { start: 'closed' }, { sort: 25 });
  await ensureAlias(collection, 'settings_group', '⚙️ Nustatymai', ['group'], 'group-detail', { start: 'closed' }, { sort: 30 });
  await ensureField(collection, 'title', 'string', 'Vidinis bloko pavadinimas', {
    group: 'settings_group', sort: 1, required: true, options: { softLength: 100 },
    note: 'Šį pavadinimą matysite sekcijų sąraše. Svetainėje jis nerodomas.',
    validation: { _regex: '^.{1,100}$' }, validationMessage: 'Įrašykite aiškų pavadinimą iki 100 simbolių.',
  }, { max_length: 100 });
}

const imageField = (collection: string, field: string, label: string, note: string, group = 'content_group', sort = 10) =>
  ensureField(collection, field, 'uuid', label, { group, sort, interface: 'file-image', special: ['file'], options: { folder: imageFolder, crop: true }, note });
const textField = (collection: string, field: string, label: string, note: string, sort: number, group = 'content_group', required = false) =>
  ensureField(collection, field, 'string', label, { group, sort, required, note, validation: required ? { _nempty: true } : null, validationMessage: required ? `Užpildykite lauką „${label}“.` : null }, { max_length: 255 });
const richText = (collection: string, field: string, label: string, note: string, sort: number, group = 'content_group') =>
  ensureField(collection, field, 'text', label, { group, sort, interface: 'input-rich-text-html', options: { toolbar: ['h2', 'h3', 'bold', 'italic', 'bullist', 'numlist', 'link'] }, note });

await textField('block_hero', 'headline', 'Pagrindinė antraštė', 'Svarbiausia puslapio antraštė. Rekomenduojama iki 60 simbolių, kad gerai atrodytų telefone.', 1, 'content_group', true);
await ensureField('block_hero', 'subheadline', 'text', 'Papildomas tekstas', { group: 'content_group', sort: 2, interface: 'input-multiline', note: 'Vienu ar dviem sakiniais paaiškinkite pagrindinę mintį.' });
await ensureAlias('block_hero', 'cta_primary', 'Pagrindinis mygtukas', ['group'], 'group-detail', { start: 'open' }, { group: 'content_group', sort: 3 });
await textField('block_hero', 'cta_primary_label', 'Mygtuko tekstas', 'Trumpas veiksmas, pavyzdžiui „Gauti pasiūlymą“.', 1, 'cta_primary');
await textField('block_hero', 'cta_primary_url', 'Mygtuko nuoroda', 'Vidinis adresas, telefono nuoroda arba pilnas interneto adresas.', 2, 'cta_primary');
await ensureAlias('block_hero', 'cta_secondary', 'Antrinis mygtukas', ['group'], 'group-detail', { start: 'closed' }, { group: 'content_group', sort: 4 });
await textField('block_hero', 'cta_secondary_label', 'Mygtuko tekstas', 'Palikite tuščią, jei antro mygtuko nereikia.', 1, 'cta_secondary');
await textField('block_hero', 'cta_secondary_url', 'Mygtuko nuoroda', 'Kur turi nuvesti antras mygtukas.', 2, 'cta_secondary');
await imageField('block_hero', 'background_image', 'Fono nuotrauka', 'Didelė horizontali nuotrauka, rekomenduojama bent 1920 × 1080 px.', 'appearance_group', 1);
await ensureField('block_hero', 'background_video', 'uuid', 'Fono vaizdo įrašas', { group: 'appearance_group', sort: 2, interface: 'file', special: ['file'], options: { folder: imageFolder }, note: 'Nebūtina. Naudokite trumpą optimizuotą MP4 failą.' });
await ensureField('block_hero', 'overlay_opacity', 'integer', 'Fono patamsinimas', { group: 'appearance_group', sort: 3, interface: 'slider', options: { min: 0, max: 100, step: 5 }, note: '0 – nepatamsinta, 100 – visiškai tamsu.', validation: { _between: [0, 100] }, validationMessage: 'Pasirinkite skaičių nuo 0 iki 100.' }, { default_value: 55 });
await ensureField('block_hero', 'height', 'string', 'Bloko aukštis', { group: 'appearance_group', sort: 4, interface: 'select-dropdown', options: { choices: [{ text: 'Pilnas ekranas', value: 'full', icon: 'fullscreen' }, { text: 'Vidutinis', value: 'medium', icon: 'crop_landscape' }, { text: 'Kompaktiškas', value: 'compact', icon: 'compress' }] }, note: 'Pasirinkite, kiek vietos ekrane užims titulinis blokas.' }, { default_value: 'medium', max_length: 20 });

await richText('block_richtext', 'content', 'Tekstas', 'Naudokite antraštes, pastraipas, sąrašus ir nuorodas. Šriftų dydžių bei spalvų keisti nereikia.', 1);
await ensureField('block_richtext', 'max_width', 'string', 'Teksto plotis', { group: 'appearance_group', sort: 1, interface: 'select-dropdown', options: { choices: [{ text: 'Siauras', value: 'narrow' }, { text: 'Vidutinis', value: 'medium' }, { text: 'Platus', value: 'wide' }] }, note: 'Siauresnį tekstą lengviau skaityti.' }, { default_value: 'medium', max_length: 20 });
await ensureField('block_richtext', 'align', 'string', 'Lygiavimas', { group: 'appearance_group', sort: 2, interface: 'select-dropdown', options: { choices: [{ text: 'Kairėje', value: 'left', icon: 'format_align_left' }, { text: 'Centre', value: 'center', icon: 'format_align_center' }] }, note: 'Ilgesniam tekstui rekomenduojamas lygiavimas kairėje.' }, { default_value: 'left', max_length: 20 });

await textField('block_text_image', 'headline', 'Antraštė', 'Trumpai įvardykite šios sekcijos temą.', 1, 'content_group', true);
await richText('block_text_image', 'content', 'Tekstas', 'Aprašykite paslaugą ar svarbiausią informaciją.', 2);
await imageField('block_text_image', 'image', 'Nuotrauka', 'Rekomenduojama horizontali arba kvadratinė WEBP/JPG nuotrauka iki 500 KB.', 'content_group', 3);
await ensureField('block_text_image', 'image_position', 'string', 'Nuotraukos vieta', { group: 'appearance_group', sort: 1, interface: 'select-dropdown', options: { choices: [{ text: 'Kairėje', value: 'left', icon: 'view_sidebar' }, { text: 'Dešinėje', value: 'right', icon: 'vertical_split' }] }, note: 'Telefone nuotrauka visada bus rodoma virš teksto.' }, { default_value: 'right', max_length: 20 });
await ensureAlias('block_text_image', 'cta', 'Mygtukas', ['group'], 'group-detail', { start: 'closed' }, { group: 'content_group', sort: 4 });
await textField('block_text_image', 'cta_label', 'Mygtuko tekstas', 'Palikite tuščią, jei mygtuko nereikia.', 1, 'cta');
await textField('block_text_image', 'cta_url', 'Mygtuko nuoroda', 'Kur turi nuvesti mygtukas.', 2, 'cta');

for (const collection of ['block_features', 'block_gallery', 'block_faq', 'block_testimonials', 'block_pricing', 'block_contact_form']) {
  await textField(collection, 'headline', 'Sekcijos antraštė', 'Aiški antraštė, paaiškinanti sekcijos turinį.', 1, 'content_group', true);
}
await ensureField('block_features', 'subheadline', 'text', 'Papildomas tekstas', { group: 'content_group', sort: 2, interface: 'input-multiline', note: 'Nebūtinas trumpas paaiškinimas po antrašte.' });
await ensureField('block_features', 'columns', 'integer', 'Stulpelių skaičius', { group: 'appearance_group', sort: 1, interface: 'select-dropdown', options: { choices: [2, 3, 4].map((value) => ({ text: `${value} stulpeliai`, value })) }, note: 'Telefone elementai vis tiek bus sudėti vienas po kitu.' }, { default_value: 3 });
await ensureField('block_features', 'items', 'json', 'Privalumų sąrašas', {
  group: 'content_group', sort: 3, interface: 'list',
  options: { fields: [
    { field: 'icon', name: 'Piktograma', type: 'string', meta: { interface: 'input', width: 'half', note: 'Emoji arba piktogramos pavadinimas.' } },
    { field: 'title', name: 'Pavadinimas', type: 'string', meta: { interface: 'input', width: 'half', required: true } },
    { field: 'description', name: 'Aprašymas', type: 'text', meta: { interface: 'input-multiline', width: 'full' } },
    { field: 'link', name: 'Nuoroda', type: 'string', meta: { interface: 'input', width: 'full' } },
  ] }, note: 'Pridėkite ir tempdami surikiuokite privalumus.',
});

await ensureAlias('block_gallery', 'images', 'Nuotraukos', ['m2m'], 'files', { folder: imageFolder, template: '{{directus_files_id.filename_download}}' }, { group: 'content_group', sort: 2, note: 'Pasirinkite nuotraukas ir tempdami pakeiskite jų tvarką.' });
await ensureField('block_gallery', 'layout', 'string', 'Galerijos išdėstymas', { group: 'appearance_group', sort: 1, interface: 'select-dropdown', options: { choices: [{ text: 'Tinklelis', value: 'grid', icon: 'grid_view' }, { text: 'Mozaika', value: 'masonry', icon: 'view_quilt' }, { text: 'Karuselė', value: 'carousel', icon: 'view_carousel' }] }, note: 'Pasirinkite, kaip lankytojams rodyti nuotraukas.' }, { default_value: 'grid', max_length: 20 });
await ensureField('block_gallery', 'columns', 'integer', 'Stulpelių skaičius', { group: 'appearance_group', sort: 2, interface: 'select-dropdown', options: { choices: [2, 3, 4].map((value) => ({ text: `${value} stulpeliai`, value })) }, note: 'Taikoma tinklelio ir mozaikos rodiniams.' }, { default_value: 3 });

await textField('block_cta', 'headline', 'Antraštė', 'Trumpas ir aiškus kvietimas veikti.', 1, 'content_group', true);
await ensureField('block_cta', 'text', 'text', 'Tekstas', { group: 'content_group', sort: 2, interface: 'input-multiline', note: 'Paaiškinkite, kodėl lankytojas turėtų paspausti mygtuką.' });
await textField('block_cta', 'button_label', 'Mygtuko tekstas', 'Pavyzdžiui „Gauti nemokamą sąmatą“.', 3, 'content_group', true);
await textField('block_cta', 'button_url', 'Mygtuko nuoroda', 'Vidinis puslapio adresas, telefono nuoroda arba pilnas URL.', 4, 'content_group', true);
await ensureField('block_cta', 'background_style', 'string', 'Fono stilius', { group: 'appearance_group', sort: 1, interface: 'select-dropdown', options: { choices: [{ text: 'Pagrindinė spalva', value: 'primary' }, { text: 'Tamsus', value: 'dark' }, { text: 'Šviesus', value: 'light' }, { text: 'Su gradientu', value: 'gradient' }] }, note: 'Pasirinkite iš anksto paruoštą saugų stilių.' }, { default_value: 'primary', max_length: 20 });

await ensureAlias('block_faq', 'items', 'Klausimai ir atsakymai', ['o2m'], 'list-o2m', { template: '{{question}}', enableCreate: true, enableSelect: false }, { group: 'content_group', sort: 2, note: 'Pridėkite klausimus ir tempdami nustatykite jų tvarką.' });
await ensureField('block_testimonials', 'items', 'json', 'Atsiliepimai', { group: 'content_group', sort: 2, interface: 'list', options: { fields: [
  { field: 'quote', name: 'Atsiliepimas', type: 'text', meta: { interface: 'input-multiline', width: 'full', required: true } },
  { field: 'author', name: 'Autorius', type: 'string', meta: { interface: 'input', width: 'half', required: true } },
  { field: 'role', name: 'Pareigos ar vietovė', type: 'string', meta: { interface: 'input', width: 'half' } },
  { field: 'avatar', name: 'Nuotraukos failo ID', type: 'string', meta: { interface: 'input', width: 'half', note: 'Nebūtina. Failą pasirinkti padės administratorius.' } },
  { field: 'rating', name: 'Įvertinimas 1–5', type: 'integer', meta: { interface: 'input', width: 'half' } },
] }, note: 'Pridėkite tikrus klientų atsiliepimus ir tempdami juos surikiuokite.' });
await ensureField('block_pricing', 'plans', 'json', 'Kainų planai', { group: 'content_group', sort: 2, interface: 'list', options: { fields: [
  { field: 'name', name: 'Plano pavadinimas', type: 'string', meta: { interface: 'input', width: 'half', required: true } },
  { field: 'price', name: 'Kaina', type: 'string', meta: { interface: 'input', width: 'half', required: true } },
  { field: 'period', name: 'Vienetas', type: 'string', meta: { interface: 'input', width: 'half' } },
  { field: 'features', name: 'Kas įskaičiuota', type: 'json', meta: { interface: 'tags', width: 'full' } },
  { field: 'cta_label', name: 'Mygtuko tekstas', type: 'string', meta: { interface: 'input', width: 'half' } },
  { field: 'cta_url', name: 'Mygtuko nuoroda', type: 'string', meta: { interface: 'input', width: 'half' } },
  { field: 'highlighted', name: 'Išryškinti', type: 'boolean', meta: { interface: 'boolean', width: 'half' } },
] }, note: 'Pridėkite pasiūlymus ir tempdami nustatykite jų tvarką.' });
await ensureField('block_contact_form', 'fields', 'json', 'Formos laukai', { group: 'content_group', sort: 2, interface: 'list', options: { fields: [
  { field: 'label', name: 'Lauko pavadinimas', type: 'string', meta: { interface: 'input', width: 'half', required: true } },
  { field: 'type', name: 'Lauko tipas', type: 'string', meta: { interface: 'select-dropdown', width: 'half', options: { choices: [{ text: 'Trumpas tekstas', value: 'text' }, { text: 'El. paštas', value: 'email' }, { text: 'Telefonas', value: 'tel' }, { text: 'Ilgas tekstas', value: 'textarea' }] } } },
  { field: 'required', name: 'Privalomas', type: 'boolean', meta: { interface: 'boolean', width: 'half' } },
] }, note: 'Nurodykite, kokios informacijos prašyti iš lankytojo.' });
await textField('block_contact_form', 'recipient_email', 'Gavėjo el. paštas', 'Šiuo adresu bus siunčiamos užklausos.', 3, 'settings_group', true);
await ensureField('block_contact_form', 'success_message', 'text', 'Sėkmės pranešimas', { group: 'content_group', sort: 4, interface: 'input-multiline', note: 'Šis tekstas rodomas sėkmingai išsiuntus formą.' });

await textField('block_map', 'address', 'Adresas', 'Pilnas adresas, rodomas prie žemėlapio.', 1, 'content_group', true);
await ensureField('block_map', 'lat', 'decimal', 'Platuma', { group: 'settings_group', sort: 2, interface: 'input', note: 'Geografinė platuma, pavyzdžiui 54.9812.', validation: { _between: [-90, 90] }, validationMessage: 'Platuma turi būti nuo -90 iki 90.' }, { numeric_precision: 10, numeric_scale: 7 });
await ensureField('block_map', 'lng', 'decimal', 'Ilguma', { group: 'settings_group', sort: 3, interface: 'input', note: 'Geografinė ilguma, pavyzdžiui 25.7611.', validation: { _between: [-180, 180] }, validationMessage: 'Ilguma turi būti nuo -180 iki 180.' }, { numeric_precision: 10, numeric_scale: 7 });
await ensureField('block_map', 'zoom', 'integer', 'Žemėlapio priartinimas', { group: 'appearance_group', sort: 1, interface: 'slider', options: { min: 1, max: 20, step: 1 }, note: 'Didesnis skaičius rodo mažesnę teritoriją.', validation: { _between: [1, 20] }, validationMessage: 'Pasirinkite skaičių nuo 1 iki 20.' }, { default_value: 14 });
await ensureField('block_spacer', 'height', 'string', 'Tarpo dydis', { group: 'appearance_group', sort: 1, interface: 'select-dropdown', options: { choices: [{ text: 'Mažas', value: 'small' }, { text: 'Vidutinis', value: 'medium' }, { text: 'Didelis', value: 'large' }] }, required: true, note: 'Naudokite tarpą tik tada, kai sekcijoms trūksta oro.' }, { default_value: 'medium', max_length: 20 });

await ensureField('block_gallery_files', 'block_gallery_id', 'integer', 'Galerijos blokas', { interface: 'select-dropdown-m2o', special: ['m2o'], hidden: true });
await ensureField('block_gallery_files', 'directus_files_id', 'uuid', 'Nuotrauka', { interface: 'file-image', special: ['file'], options: { folder: imageFolder }, required: true, note: 'Pasirinkite nuotrauką iš svetainės failų.' });
await ensureField('block_gallery_files', 'sort', 'integer', 'Eiliškumas', { interface: 'input', hidden: true });

await ensureField('faq_items', 'question', 'string', 'Klausimas', { required: true, note: 'Klausimą rašykite taip, kaip jį užduotų klientas.', validation: { _nempty: true }, validationMessage: 'Įrašykite klausimą.' }, { max_length: 255 });
await ensureField('faq_items', 'answer', 'text', 'Atsakymas', { interface: 'input-rich-text-html', options: { toolbar: ['h2', 'h3', 'bold', 'italic', 'bullist', 'numlist', 'link'] }, required: true, note: 'Atsakykite trumpai ir aiškiai.', validation: { _nempty: true }, validationMessage: 'Įrašykite atsakymą.' });
await ensureField('faq_items', 'block_faq_id', 'integer', 'Klausimų blokas', { interface: 'select-dropdown-m2o', special: ['m2o'], hidden: true });
await ensureField('faq_items', 'sort', 'integer', 'Eiliškumas', { interface: 'input', hidden: true });

await ensureField('redagavimo_instrukcija', 'turinys', 'text', 'Instrukcija', {
  interface: 'input-rich-text-html', readonly: true,
  options: { toolbar: ['h1', 'h2', 'h3', 'bold', 'italic', 'bullist', 'numlist', 'blockquote', 'link'] },
  note: 'Šią instrukciją tik skaitykite. Jos redaguoti nereikia.',
});

// Meniu ir bendri nustatymai.
for (const [field, type, label, meta, schema] of [
  ['site_name', 'string', 'Svetainės pavadinimas', { required: true, note: 'Rodomas antraštėje ir naršyklės pavadinime.' }, { max_length: 120 }],
  ['logo', 'uuid', 'Logotipas', { interface: 'file-image', special: ['file'], options: { folder: imageFolder }, note: 'Rekomenduojamas SVG arba skaidrus PNG.' }, {}],
  ['favicon', 'uuid', 'Naršyklės piktograma', { interface: 'file-image', special: ['file'], options: { folder: imageFolder }, note: 'Kvadratinė SVG arba PNG piktograma.' }, {}],
  ['phone', 'string', 'Telefono numeris', { note: 'Naudokite tarptautinį formatą, pavyzdžiui +370 600 00000.' }, { max_length: 64 }],
  ['email', 'string', 'El. paštas', { note: 'Viešai rodomas kontaktinis el. pašto adresas.' }, { max_length: 255 }],
  ['address', 'text', 'Adresas', { interface: 'input-multiline', note: 'Viešai rodomas veiklos ar biuro adresas.' }, {}],
  ['working_hours', 'text', 'Darbo laikas', { interface: 'input-multiline', note: 'Pavyzdžiui „I–V 8:00–18:00“.' }, {}],
  ['social_links', 'json', 'Socialinių tinklų nuorodos', { interface: 'list', options: { fields: [{ field: 'platform', name: 'Platforma', type: 'string', meta: { interface: 'select-dropdown', options: { choices: ['Facebook', 'Instagram', 'LinkedIn', 'YouTube', 'TikTok'].map((text) => ({ text, value: text.toLowerCase() })) } } }, { field: 'url', name: 'Nuoroda', type: 'string', meta: { interface: 'input' } }] }, note: 'Pridėkite tik naudojamų paskyrų nuorodas.' }, {}],
  ['google_analytics_id', 'string', 'Google Analytics ID', { note: 'Pavyzdžiui G-XXXXXXXXXX. Palikite tuščią, jei nenaudojama.' }, { max_length: 32 }],
  ['meta_pixel_id', 'string', 'Meta Pixel ID', { note: 'Skaitinis Meta reklamos paskyros kodas. Palikite tuščią, jei nenaudojama.' }, { max_length: 64 }],
] as any[]) await ensureField('globals', field, type, label, meta, schema);

await textField('navigation', 'title', 'Meniu pavadinimas', 'Pavyzdžiui „Pagrindinis meniu“ arba „Apatinis meniu“.', 1, null as any, true);
await ensureAlias('navigation', 'items', 'Meniu punktai', ['o2m'], 'list-o2m', { template: '{{label}}', enableCreate: true, enableSelect: false }, { sort: 2, note: 'Pridėkite ir tempdami surikiuokite meniu punktus.' });
for (const [field, type, label, meta, schema] of [
  ['navigation_id', 'integer', 'Meniu', { interface: 'select-dropdown-m2o', special: ['m2o'], hidden: true }, {}],
  ['parent_id', 'integer', 'Aukštesnis meniu punktas', { interface: 'select-dropdown-m2o', special: ['m2o'], note: 'Pasirinkite tik jei šis punktas turi būti antro lygio submeniu.' }, {}],
  ['sort', 'integer', 'Eiliškumas', { interface: 'input', hidden: true }, {}],
  ['label', 'string', 'Pavadinimas', { required: true, note: 'Trumpas tekstas, matomas meniu.', validation: { _nempty: true }, validationMessage: 'Įrašykite meniu punkto pavadinimą.' }, { max_length: 100 }],
  ['url', 'string', 'Nuoroda', { note: 'Pildykite, jei nuoroda neveda į Directus puslapį.' }, { max_length: 500 }],
  ['page_id', 'integer', 'Puslapis', { interface: 'select-dropdown-m2o', special: ['m2o'], note: 'Pasirinkus puslapį jo adresas bus naudojamas automatiškai.' }, {}],
  ['open_new_tab', 'boolean', 'Atidaryti naujame lange', { interface: 'boolean', special: ['cast-boolean'], note: 'Naudokite tik nuorodoms į kitas svetaines.' }, { default_value: false }],
] as any[]) await ensureField('navigation_items', field, type, label, meta, schema);

for (const [field, type, label, meta, schema] of [
  ['status', 'string', 'Būsena', { interface: 'select-dropdown', options: { choices: [{ text: 'Nauja', value: 'new', color: '#E35169' }, { text: 'Peržiūrėta', value: 'read', color: '#F39C12' }, { text: 'Atsakyta', value: 'answered', color: '#2ECDA7' }] }, note: 'Pažymėkite, kai užklausa peržiūrėta arba atsakyta.' }, { default_value: 'new', max_length: 20 }],
  ['name', 'string', 'Vardas', { readonly: true }, { max_length: 255 }],
  ['email', 'string', 'El. paštas', { readonly: true }, { max_length: 255 }],
  ['phone', 'string', 'Telefonas', { readonly: true }, { max_length: 64 }],
  ['message', 'text', 'Žinutė', { interface: 'input-multiline', readonly: true }, {}],
  ['page', 'string', 'Puslapis', { readonly: true }, { max_length: 500 }],
  ['date_created', 'timestamp', 'Gauta', { interface: 'datetime', special: ['date-created'], readonly: true }, {}],
] as any[]) await ensureField('forms_submissions', field, type, label, meta, schema);

// M2A, O2M, M2M ir failų ryšiai.
for (const [collection, field] of [
  ['seo', 'og_image'], ['globals', 'logo'], ['globals', 'favicon'],
  ['block_hero', 'background_image'], ['block_hero', 'background_video'],
  ['block_text_image', 'image'],
] as const) await ensureRelation(collection, field, 'directus_files');
await ensureRelation('pages', 'seo_id', 'seo');
await ensureRelation('pages', 'user_created', 'directus_users');
await ensureRelation('pages', 'user_updated', 'directus_users');

await ensureField('page_sections', 'pages_id', 'integer', 'Puslapis', { interface: 'select-dropdown-m2o', special: ['m2o'], hidden: true });
await ensureField('page_sections', 'collection', 'string', 'Bloko tipas', { interface: 'input', hidden: true }, { max_length: 64 });
await ensureField('page_sections', 'item', 'string', 'Blokas', { interface: 'input', hidden: true }, { max_length: 255 });
await ensureField('page_sections', 'sort', 'integer', 'Eiliškumas', { interface: 'input', hidden: true });
await ensureRelation('page_sections', 'pages_id', 'pages', 'sections', { junction_field: 'item', sort_field: 'sort', one_deselect_action: 'delete' });
await ensureRelation('page_sections', 'item', null, null, {
  one_collection_field: 'collection', one_allowed_collections: BLOCKS,
  junction_field: 'pages_id', sort_field: 'sort', one_deselect_action: 'delete',
});

await ensureRelation('block_gallery_files', 'block_gallery_id', 'block_gallery', 'images', { junction_field: 'directus_files_id', sort_field: 'sort', one_deselect_action: 'delete' });
await ensureRelation('block_gallery_files', 'directus_files_id', 'directus_files', null, { junction_field: 'block_gallery_id', sort_field: 'sort' });
await ensureRelation('faq_items', 'block_faq_id', 'block_faq', 'items', { sort_field: 'sort', one_deselect_action: 'delete' });
await ensureRelation('navigation_items', 'navigation_id', 'navigation', 'items', { sort_field: 'sort', one_deselect_action: 'delete' });
await ensureRelation('navigation_items', 'parent_id', 'navigation_items');
await ensureRelation('navigation_items', 'page_id', 'pages');

// Senų laukų duomenys paliekami, bet jie nerodomi klientui naujoje redagavimo formoje.
for (const [collection, fields] of [
  ['pages', ['seo', 'blocks']],
  ['block_hero', ['badge', 'subtitle', 'primary_label', 'primary_url', 'secondary_label', 'secondary_url']],
  ['block_gallery', ['badge', 'intro', 'limit', 'button_label', 'button_url']],
  ['block_faq', ['badge', 'intro']],
] as const) {
  for (const field of fields) {
    if (await exists(() => client.request(readField(collection, field)))) {
      await client.request(updateField(collection, field, { meta: { hidden: true } } as any));
    }
  }
}

// Kasdien naudojamų Paslaugų ir Galerijos formos taip pat sutvarkomos lietuviškai.
for (const collection of ['services', 'gallery']) {
  await ensureAlias(collection, 'content_group', '📝 Turinys', ['group'], 'group-detail', { start: 'open' }, { sort: 1 });
  await ensureAlias(collection, 'settings_group', '⚙️ Nustatymai', ['group'], 'group-detail', { start: 'closed' }, { sort: 20 });
}
for (const [field, label, note, group, sort] of [
  ['status', 'Būsena', 'Juodraštis nerodomas svetainėje, paskelbta – rodoma.', 'content_group', 1],
  ['title', 'Paslaugos pavadinimas', 'Trumpas ir aiškus paslaugos pavadinimas.', 'content_group', 2],
  ['description', 'Aprašymas', 'Vienu ar dviem sakiniais paaiškinkite paslaugą.', 'content_group', 3],
  ['image', 'Nuotrauka', 'Rekomenduojama WEBP arba JPG nuotrauka iki 500 KB.', 'content_group', 4],
  ['link_label', 'Nuorodos tekstas', 'Pavyzdžiui „Plačiau apie paslaugą“.', 'content_group', 5],
  ['link_url', 'Nuorodos adresas', 'Vidinis svetainės adresas, prasidedantis / ženklu.', 'content_group', 6],
  ['sort', 'Eiliškumas', 'Mažesnis skaičius rodomas anksčiau.', 'settings_group', 1],
] as const) {
  if (await exists(() => client.request(readField('services', field)))) {
    await client.request(updateField('services', field, { meta: { group, sort, note, translations: lietuviskasLaukas(label) } } as any));
  }
}
for (const [field, label, note, group, sort] of [
  ['status', 'Būsena', 'Juodraštis nerodomas svetainėje, paskelbta – rodoma.', 'content_group', 1],
  ['title', 'Nuotraukos pavadinimas', 'Trumpai aprašykite, kas atlikta.', 'content_group', 2],
  ['description', 'Papildomas aprašymas', 'Nebūtinas paaiškinimas apie darbą ar vietovę.', 'content_group', 3],
  ['image', 'Nuotrauka', 'Naudokite WEBP arba JPG, rekomenduojama iki 500 KB.', 'content_group', 4],
  ['sort', 'Eiliškumas', 'Mažesnis skaičius rodomas anksčiau.', 'settings_group', 1],
  ['date_created', 'Įkelta', 'Directus užpildo automatiškai.', 'settings_group', 2],
] as const) {
  if (await exists(() => client.request(readField('gallery', field)))) {
    await client.request(updateField('gallery', field, { meta: { group, sort, note, translations: lietuviskasLaukas(label) } } as any));
  }
}

console.log(JSON.stringify({
  status: 'SCHEMA_READY',
  collections: ['pages', 'seo', 'globals', 'navigation', 'forms_submissions', ...BLOCKS],
  preservedExistingPageItems: true,
}, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
