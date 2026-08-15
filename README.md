# Situacija.eu – Directus blokų CMS šablonas

Šis projektas yra pilnas lietuviškas Directus CMS ir Next.js svetainės šablonas. Netechninis klientas puslapius sudėlioja iš 12 saugių blokų, gali matyti juodraščio peržiūrą, atkurti ankstesnę versiją ir negali ištrinti puslapių ar keisti sistemos nustatymų.

## Kas įdiegta

- `pages` su M2A `sections`, SEO, versijomis ir Live Preview.
- `globals`, dviejų lygių `navigation`, `forms_submissions`, `services` ir `gallery`.
- 12 atskirų blokų: hero, rich text, tekstas su nuotrauka, privalumai, galerija, CTA, D.U.K., atsiliepimai, kainos, kontaktų forma, žemėlapis ir tarpas.
- Lietuviški laukų vardai, paprastos pastabos, validacijos, ikonos, spalvos ir suskleidžiamos grupės.
- Rolės `Klientas` ir `Redaktorius`, neturinčios trynimo ar administravimo teisių.
- Next.js App Router rendereris, Draft Mode, ISR ir Directus Flow valdomas `revalidatePath()`.
- Idempotentiški schemos, rolių, Flow, seed, tipų ir snapshot skriptai.

## Naujo kliento paleidimas per mažiau nei 30 minučių

### 1. Paruoškite aplinką (5 min.)

Nukopijuokite `.env.example` į `.env.local` ir užpildykite:

```env
DIRECTUS_URL=http://directus:8055
DIRECTUS_PUBLIC_URL=https://cms.klientas.lt
DIRECTUS_ADMIN_TOKEN=ADMIN_STATIC_TOKEN
DIRECTUS_STATIC_TOKEN=FRONTEND_READ_TOKEN
FRONTEND_URL=https://klientas.lt
PREVIEW_SECRET=ATSITIKTINIS_ILGAS_RAKTAS
REVALIDATE_SECRET=KITAS_ATSITIKTINIS_ILGAS_RAKTAS
```

Abu slaptus raktus galima sukurti komanda `openssl rand -hex 32`. Jų nedėkite į Git.

### 2. Įdiekite ir pritaikykite CMS (8 min.)

```bash
npm ci
npm run schema:apply
```

`schema:apply` iš eilės pritaiko kolekcijas, laukus, M2A ryšius, lietuvišką UI, roles, teises ir automatinio atnaujinimo Flow. Skriptą saugu paleisti pakartotinai.

Svarbu: skriptas netrina esamų įrašų. Šiame projekte seni techniniai rinkiniai tik išjungiami, nes savarankiškai talpinamo Directus Core licencija riboja aktyvių kolekcijų skaičių.

### 3. Įkelkite pavyzdžius (3 min.)

```bash
npm run seed
```

Sukuriamas atskiras juodraštis `site-builder-demo` su visais 12 blokų ir užpildoma `Redagavimo instrukcija`. Esamas `home` įrašas nekeičiamas. Pakartotinis paleidimas nedubliuoja duomenų.

### 4. Sugeneruokite tipus ir snapshot (3 min.)

```bash
npm run gen:types
npm run schema:snapshot
npm run schema:diff
```

- Tipai patenka į `types/directus.generated.ts`.
- Snapshot patenka į `directus/schema/snapshot.yaml`.
- `schema:diff` grąžina `identical: true`, kai serverio schema sutampa su Git snapshot.

### 5. Patikrinkite ir paleiskite (5–10 min.)

```bash
npm run typecheck
npm run build
npm start
```

Patikrinkite:

1. `/api/preview?...` su neteisingu raktu grąžina 401.
2. Directus `Puslapiai → Puslapių konstruktoriaus pavyzdys → Peržiūra` rodo juodraštį.
3. Pakeitus bloką, Directus Flow gauna sėkmingą atsakymą iš `/api/revalidate`.
4. Kliento paskyroje nematomi Settings, Data Model, Flows, Users ar Roles.
5. `npm run schema:verify` grąžina `VERIFY_OK`.

## Skriptai

| Komanda | Paskirtis |
|---|---|
| `npm run schema:apply` | Schema + lietuviškas UI + rolės + Flow |
| `npm run roles:apply` | Tik rolės ir teisės |
| `npm run flow:apply` | Tik cache atnaujinimo Flow |
| `npm run schema:verify` | Gyvos schemos ir teisių testas per API |
| `npm run seed` | Demo puslapis ir instrukcija |
| `npm run gen:types` | TypeScript tipai iš gyvos Directus schemos |
| `npm run schema:snapshot` | Gyvos schemos YAML snapshot |
| `npm run schema:diff` | Git snapshot palyginimas su serveriu |
| `npm run typecheck` | TypeScript patikra |
| `npm run build` | Produkcinis Next.js build |

## Pagrindinė struktūra

```text
app/
  [slug]/page.tsx
  api/preview/route.ts
  api/revalidate/route.ts
components/blocks/
  index.tsx
  Hero.tsx
  RichText.tsx
  ...
directus/scripts/
  setup-schema.ts
  setup-roles.ts
  setup-flow.ts
  seed.ts
  verify-setup.ts
directus/schema/snapshot.yaml
lib/directus.ts
types/directus.generated.ts
```

## Saugumo taisyklės

- Admin tokenas naudojamas tik serverio skriptuose ir Draft Mode; jis niekada nepatenka į naršyklę.
- `PREVIEW_SECRET` ir `REVALIDATE_SECRET` turi būti skirtingi ir laikomi tik aplinkos kintamuosiuose.
- Klientui puslapio trynimas nesuteiktas; turinys slepiamas būsena `Archyvuota`.
- Failų trynimas nesuteiktas.
- Nežinomas blokas ignoruojamas su `console.warn`, todėl puslapis nenulūžta.
- Prieš kiekvieną schemos migraciją pasidarykite DB ir `schema:snapshot` atsarginę kopiją.

## Senų puslapių suderinamumas

Esami `.html` SEO adresai ir jų failai palikti `public/`. Kol esamo `home` įrašo `sections` laukas tuščias, pradinis puslapis rodomas iš saugaus seno HTML fallback. Kai klientas Directus sudėlios ir patikrins naują `home` blokų turinį, Next.js automatiškai pradės naudoti blokų rendererį.
