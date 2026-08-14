BEGIN;

CREATE TABLE IF NOT EXISTS redagavimo_instrukcija (
  id integer PRIMARY KEY,
  turinys text NOT NULL
);

INSERT INTO directus_collections (
  collection, icon, note, hidden, singleton, accountability, sort, collapse, versioning, status
) VALUES (
  'redagavimo_instrukcija',
  'menu_book',
  'Labai paprasta Situacija.eu svetainės redagavimo instrukcija. Pradėkite čia.',
  false,
  true,
  'all',
  1,
  'open',
  false,
  'active'
)
ON CONFLICT (collection) DO UPDATE SET
  icon = EXCLUDED.icon,
  note = EXCLUDED.note,
  hidden = false,
  singleton = true,
  sort = 1,
  status = 'active';

UPDATE directus_collections
SET translations = '[{"language":"lt-LT","translation":"Redagavimo instrukcija","singular":"Redagavimo instrukcija","plural":"Redagavimo instrukcija"},{"language":"en-US","translation":"Redagavimo instrukcija","singular":"Redagavimo instrukcija","plural":"Redagavimo instrukcija"}]'::json
WHERE collection = 'redagavimo_instrukcija';

INSERT INTO directus_fields (
  collection, field, interface, readonly, hidden, sort, width, note, required, searchable
)
SELECT 'redagavimo_instrukcija', 'id', 'numeric', true, true, 1, 'full', NULL, false, true
WHERE NOT EXISTS (
  SELECT 1 FROM directus_fields WHERE collection = 'redagavimo_instrukcija' AND field = 'id'
);

INSERT INTO directus_fields (
  collection, field, interface, options, readonly, hidden, sort, width, note, required, searchable
)
SELECT
  'redagavimo_instrukcija',
  'turinys',
  'input-rich-text-html',
  '{"toolbar":["bold","italic","underline","h1","h2","h3","bullist","numlist","blockquote","link","hr"]}'::json,
  true,
  false,
  2,
  'full',
  'Ši instrukcija yra tik skaitymui.',
  true,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM directus_fields WHERE collection = 'redagavimo_instrukcija' AND field = 'turinys'
);

UPDATE directus_fields
SET translations = '[{"language":"lt-LT","translation":"Instrukcija"},{"language":"en-US","translation":"Instrukcija"}]'::json
WHERE collection = 'redagavimo_instrukcija' AND field = 'turinys';

INSERT INTO redagavimo_instrukcija (id, turinys)
VALUES (1, $guide$
<h1>SITUACIJA.EU REDAGAVIMO INSTRUKCIJA</h1>
<p><strong>Skirta žmogui, kuris pirmą kartą gyvenime atidarė svetainės valdymą.</strong></p>

<blockquote>
<p><strong>PATI SVARBIAUSIA TAISYKLĖ:</strong> keiskite tik tai, kas aprašyta šioje instrukcijoje. Nelieskite meniu punktų <strong>Data Model, Flows, User Roles, Access Policies, Settings, AI, Extensions</strong>. Jie valdo visos sistemos veikimą.</p>
</blockquote>

<h2>1. Kur prisijungti</h2>
<ol>
  <li>Atidarykite interneto naršyklę, pavyzdžiui, Google Chrome.</li>
  <li>Viršuje esančioje adreso eilutėje įrašykite: <strong>https://situacija.sitestudio.lt/admin</strong></li>
  <li>Įrašykite savo el. pašto adresą ir slaptažodį.</li>
  <li>Paspauskite <strong>Sign In / Prisijungti</strong>.</li>
  <li>Prisijungę kairėje pasirinkite aplanko arba kubelio piktogramą <strong>Content</strong>.</li>
</ol>
<p><strong>Niekam nesiųskite slaptažodžio.</strong> Jei slaptažodžio nežinote arba pamiršote, nespauskite atsitiktinių nustatymų – paprašykite administratoriaus jį atkurti.</p>

<h2>2. Ką galima redaguoti</h2>
<p>Turinio meniu yra tik trys kasdieniam darbui reikalingos vietos:</p>
<ul>
  <li><strong>Requests / Klientų užklausos</strong> – klientų atsiųsti vardai, telefonai ir žinutės.</li>
  <li><strong>Gallery / Darbų galerija</strong> – svetainėje rodomos darbų nuotraukos.</li>
  <li><strong>Site Content / Svetainės turinys</strong> – pagrindinio puslapio antraštė, kontaktai ir paslaugų sąrašas.</li>
</ul>
<p><strong>Prieš ką nors keičiant:</strong> atsidarykite situacija.eu kitame naršyklės skirtuke. Po pakeitimo ten patikrinsite rezultatą.</p>

<h2>3. Kaip išsaugoti pakeitimą</h2>
<ol>
  <li>Atidarykite norimą įrašą.</li>
  <li>Pakeiskite tik reikiamą lauką.</li>
  <li>Viršutiniame dešiniajame kampe paspauskite <strong>Save / Išsaugoti</strong> mygtuką.</li>
  <li>Palaukite, kol mygtukas nustos rodyti išsaugojimą.</li>
  <li>Atidarykite situacija.eu ir paspauskite klaviatūroje <strong>Ctrl + F5</strong>. Telefone uždarykite puslapį ir atidarykite iš naujo.</li>
</ol>
<p>Jeigu nepaspausite <strong>Save</strong>, pakeitimas nebus išsaugotas. Jei išeinant rodomas perspėjimas apie neišsaugotus pakeitimus, pasirinkite grįžti ir paspauskite <strong>Save</strong>.</p>

<h2>4. Klientų užklausos</h2>
<ol>
  <li>Kairėje atidarykite <strong>Requests</strong>.</li>
  <li>Paspauskite ant norimos eilutės.</li>
  <li>Matysite kliento vardą, telefoną, žinutę ir gavimo datą.</li>
  <li>Paspaudę telefono numerį telefone galite skambinti klientui.</li>
  <li>Lauke <strong>Status</strong> pasirinkite:
    <ul>
      <li><strong>New</strong> – dar nesusisiekėte;</li>
      <li><strong>In progress</strong> – jau kalbėjote arba derinate darbus;</li>
      <li><strong>Done</strong> – užklausa užbaigta.</li>
    </ul>
  </li>
  <li>Lauke <strong>Notes</strong> galite parašyti sau pastabą, pavyzdžiui: „Skambinta 14 d., laukia kainos“.</li>
  <li>Paspauskite <strong>Save</strong>.</li>
</ol>
<blockquote><p><strong>Netrinkite tikrų užklausų.</strong> Trinti galima tik aiškų šlamštą arba bandomąją užklausą. Ištrynus gali būti neįmanoma jos susigrąžinti.</p></blockquote>

<h2>5. Naujos nuotraukos įkėlimas į galeriją</h2>
<ol>
  <li>Kairėje atidarykite <strong>Gallery</strong>.</li>
  <li>Viršuje dešinėje paspauskite <strong>+</strong> arba <strong>Create Item</strong>.</li>
  <li>Lauke <strong>Status</strong> iš pradžių pasirinkite <strong>Draft</strong>. Taip nebaigta nuotrauka dar nebus rodoma svetainėje.</li>
  <li>Lauke <strong>Image</strong> paspauskite pasirinkimo mygtuką.</li>
  <li>Pasirinkite <strong>Upload File</strong>, tada pasirinkite nuotrauką savo telefone arba kompiuteryje.</li>
  <li>Palaukite, kol nuotrauka visiškai įsikels.</li>
  <li>Lauke <strong>Category</strong> įrašykite vieną aiškią kategoriją, pavyzdžiui: <em>Vonios kambariai</em>, <em>Virtuvės</em>, <em>Grindys ir terasos</em>, <em>Klinkerio fasadai</em> arba <em>Kriauklės iš plytelių</em>.</li>
  <li>Lauke <strong>Title</strong> parašykite, kas matoma ir kur atliktas darbas. Geras pavyzdys: <em>Vonios kambario plytelių klojimas Pabradėje</em>.</li>
  <li>Lauke <strong>Description</strong> galima trumpai parašyti darbo detales. Pavyzdys: <em>Dušo zona, hidroizoliacija ir 60 × 120 cm plytelės.</em></li>
  <li>Patikrinkite nuotrauką ir tekstą.</li>
  <li>Pakeiskite <strong>Status</strong> į <strong>Published</strong>.</li>
  <li>Paspauskite <strong>Save</strong>.</li>
  <li>Po kelių minučių atidarykite situacija.eu galeriją ir patikrinkite rezultatą.</li>
</ol>

<h3>Kokią nuotrauką rinktis</h3>
<ul>
  <li>Nuotrauka turi būti ryški, tiesi ir gerai apšviesta.</li>
  <li>Geriausia naudoti JPG, PNG arba WEBP failą.</li>
  <li>Nekelkite ekrano nuotraukos su telefono meniu, žinutėmis ar kitais užrašais.</li>
  <li>Nekelkite kliento veido, dokumentų, namo numerio ar kitos privačios informacijos be leidimo.</li>
  <li>Nekelkite tos pačios nuotraukos kelis kartus.</li>
  <li>Pavadinime nerašykite vien „foto“, „darbas“ arba „IMG_1234“. Aprašykite tikrą darbą.</li>
</ul>

<h2>6. Kaip paslėpti arba pašalinti blogą nuotrauką</h2>
<p><strong>Saugiausias būdas – jos netrinti.</strong></p>
<ol>
  <li>Atidarykite nuotraukos įrašą galerijoje.</li>
  <li>Lauke <strong>Status</strong> pasirinkite <strong>Draft</strong>.</li>
  <li>Paspauskite <strong>Save</strong>.</li>
</ol>
<p>Nuotrauka dings iš svetainės, bet liks sistemoje ir ją bus galima vėl paskelbti. Šiukšliadėžės mygtuką naudokite tik tada, kai tikrai žinote, kad failo daugiau niekada nereikės.</p>

<h2>7. Pagrindinio puslapio tekstų keitimas</h2>
<ol>
  <li>Kairėje atidarykite <strong>Site Content</strong>.</li>
  <li>Pamatysite eilutes su laukais <strong>Key</strong> ir <strong>Value</strong>.</li>
  <li><strong>Key niekada nekeiskite.</strong> Tai yra techninis pavadinimas, pagal kurį svetainė suranda tekstą.</li>
  <li>Keisti galima tik lauką <strong>Value</strong>.</li>
  <li>Atidarykite reikiamą eilutę, pakeiskite <strong>Value</strong> ir paspauskite <strong>Save</strong>.</li>
</ol>

<h3>Ką reiškia kiekvienas Key</h3>
<ul>
  <li><strong>hero_title</strong> – didžiausias pagrindinio puslapio užrašas.</li>
  <li><strong>hero_subtitle</strong> – sakinys po didžiuoju užrašu.</li>
  <li><strong>contact_phone_text</strong> – gražiai rodomas telefono numeris, pavyzdžiui, <em>+370 600 30288</em>.</li>
  <li><strong>contact_phone_href</strong> – numeris skambinimo mygtukui. Rašomas be tarpų: <em>+37060030288</em>.</li>
  <li><strong>contact_email</strong> – el. pašto adresas.</li>
  <li><strong>contact_fb_url</strong> – visa Facebook nuoroda, prasidedanti <em>https://</em>.</li>
  <li><strong>contact_fb_text</strong> – svetainėje rodomas Facebook profilio pavadinimas.</li>
  <li><strong>services</strong> – techninis paslaugų sąrašas. Jį keiskite tik labai atsargiai pagal kitą skyrių.</li>
</ul>

<h2>8. Labai atsargiai: services laukas</h2>
<blockquote><p><strong>Jeigu reikia tik pakeisti vieną žodį, nelieskite skliaustų, kabučių, kablelių, žodžių icon, title, desc ir href.</strong></p></blockquote>
<p><strong>services</strong> reikšmė yra JSON sąrašas. Vienas netyčia ištrintas kablelis ar kabutė gali paslėpti visas paslaugų korteles.</p>
<ol>
  <li>Atidarykite <strong>services</strong> įrašą.</li>
  <li>Prieš redaguodami pažymėkite visą <strong>Value</strong> tekstą ir nukopijuokite jį į paprastą tekstinį failą. Tai bus atsarginė kopija.</li>
  <li>Keiskite tik tekstą tarp kabučių po <strong>title</strong> arba <strong>desc</strong>.</li>
  <li>Neįterpkite paprastų kabučių <strong>"</strong> į aprašymo vidurį.</li>
  <li>Neištrinkite ženklų <strong>[ ] { } , :</strong>.</li>
  <li>Paspauskite <strong>Save</strong>.</li>
  <li>Iškart patikrinkite paslaugų korteles situacija.eu.</li>
</ol>
<p>Jeigu reikia pridėti arba pašalinti visą paslaugą, geriau kreipkitės į svetainės administratorių.</p>

<h2>9. Ko negalima redaguoti per šį skydelį</h2>
<p>Atskiri paslaugų puslapiai, D.U.K., tinklaraščio straipsniai, SEO antraštės, sitemap, dizainas ir programinis kodas nėra paprasti turinio laukai. Jų nebandykite keisti per <strong>Data Model</strong>, <strong>Settings</strong> ar <strong>AI</strong>. Tokiems pakeitimams kreipkitės į svetainės administratorių.</p>

<h2>10. Kaip naudoti AI Assistant saugiai</h2>
<ul>
  <li>AI galite paprašyti pasiūlyti trumpesnį pavadinimą, pataisyti lietuvių kalbą arba sukurti nuotraukos aprašymą.</li>
  <li>Kasdieniams darbams rinkitės <strong>Gemini 3.5 Flash Lite</strong>.</li>
  <li><strong>Gemini 3.6 Flash</strong> ir <strong>Gemini 3.7 Flash</strong> turi mažesnius dienos limitus, todėl naudokite juos tik sudėtingesniam tekstui.</li>
  <li>Niekada neduokite AI slaptažodžių, API raktų, klientų telefonų ar privačių žinučių.</li>
  <li>AI pasiūlytas tekstas nėra automatiškai teisingas. Prieš išsaugodami visada perskaitykite.</li>
  <li>Neleiskite AI trinti kolekcijų, laukų, naudotojų ar nustatymų.</li>
</ul>

<h2>11. Ką daryti, jei kažkas nepavyko</h2>
<h3>Pakeitimas svetainėje nesimato</h3>
<ol>
  <li>Patikrinkite, ar paspaudėte <strong>Save</strong>.</li>
  <li>Galerijos įraše patikrinkite, ar statusas yra <strong>Published</strong>.</li>
  <li>Svetainėje paspauskite <strong>Ctrl + F5</strong>.</li>
  <li>Palaukite 5 minutes ir patikrinkite dar kartą.</li>
</ol>

<h3>Paslaugų kortelės dingo</h3>
<ol>
  <li>Daugiau nieko nekeiskite.</li>
  <li>Jeigu turite prieš redagavimą nukopijuotą <strong>services</strong> tekstą, įklijuokite seną tekstą atgal ir išsaugokite.</li>
  <li>Jeigu atsarginės kopijos neturite, kreipkitės į administratorių.</li>
</ol>

<h3>Netyčia atidariau Settings arba Data Model</h3>
<p>Nieko nespauskite. Kairėje grįžkite į <strong>Content</strong>. Vien tik puslapio atidarymas nieko nesugadina.</p>

<h3>Netyčia kažką ištryniau</h3>
<p>Nedarykite daugiau pakeitimų ir kuo greičiau pasakykite administratoriui: ką ištrynėte, kuriame skyriuje ir maždaug kuriuo laiku. Kuo mažiau papildomų veiksmų atliksite, tuo lengviau bus atkurti.</p>

<h2>12. Penkių punktų patikra prieš baigiant</h2>
<ol>
  <li>Ar pakeičiau tik tą lauką, kurį norėjau?</li>
  <li>Ar paspaudžiau <strong>Save</strong>?</li>
  <li>Ar nuotraukos statusas <strong>Published</strong>, jei ji turi būti rodoma?</li>
  <li>Ar patikrinau rezultatą situacija.eu kompiuteryje arba telefone?</li>
  <li>Ar atsijungiau, jei dirbau svetimame kompiuteryje?</li>
</ol>

<blockquote><p><strong>Jeigu abejojate – sustokite ir paklauskite. Geriau vienas klausimas negu netyčia sugadintas puslapis.</strong></p></blockquote>
$guide$)
ON CONFLICT (id) DO UPDATE SET turinys = EXCLUDED.turinys;

COMMIT;
