BEGIN;

CREATE TABLE IF NOT EXISTS redagavimo_instrukcija (
  id integer PRIMARY KEY,
  turinys text NOT NULL
);

INSERT INTO directus_collections (
  collection, icon, note, hidden, singleton, accountability, sort, collapse, versioning, status
) VALUES (
  'redagavimo_instrukcija', 'menu_book',
  'Paprasta Situacija.eu blokinio puslapių konstruktoriaus instrukcija.',
  false, true, 'all', 1, 'open', false, 'active'
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
  collection, field, interface, readonly, hidden, sort, width, required, searchable
)
SELECT 'redagavimo_instrukcija', 'id', 'numeric', true, true, 1, 'full', false, true
WHERE NOT EXISTS (
  SELECT 1 FROM directus_fields WHERE collection = 'redagavimo_instrukcija' AND field = 'id'
);

INSERT INTO directus_fields (
  collection, field, interface, options, readonly, hidden, sort, width, note, required, searchable
)
SELECT 'redagavimo_instrukcija', 'turinys', 'input-rich-text-html',
  '{"toolbar":["bold","italic","underline","h1","h2","h3","bullist","numlist","blockquote","link","hr"]}'::json,
  true, false, 2, 'full', 'Ši instrukcija yra tik skaitymui.', true, true
WHERE NOT EXISTS (
  SELECT 1 FROM directus_fields WHERE collection = 'redagavimo_instrukcija' AND field = 'turinys'
);

INSERT INTO redagavimo_instrukcija (id, turinys)
VALUES (1, $guide$
<h1>SITUACIJA.EU PUSLAPIŲ REDAGAVIMAS</h1>
<p><strong>Svetainė valdoma blokiniu konstruktoriumi. Techninių Key, Value ar JSON laukų redaguoti nebereikia.</strong></p>
<blockquote><p><strong>Kasdieniam darbui naudokite tik:</strong> Puslapiai, Paslaugos, Gallery ir Requests. Nelieskite Data Model, Flows, User Roles, Access Policies, Settings ir Extensions.</p></blockquote>

<h2>1. Pagrindinio puslapio redagavimas</h2>
<ol>
  <li>Kairėje pasirinkite <strong>Puslapiai</strong>.</li>
  <li>Atidarykite <strong>Pagrindinis puslapis</strong>.</li>
  <li>Lauke <strong>Puslapio sekcijos</strong> matysite visus puslapio blokus.</li>
  <li>Paspauskite norimą bloką, pakeiskite jo tekstą ar nuotrauką.</li>
  <li>Išsaugokite bloką, paskui išsaugokite patį puslapį.</li>
  <li>Atidarykite situacija.eu ir paspauskite <strong>Ctrl + F5</strong>.</li>
</ol>

<h2>2. Blokų paskirtis</h2>
<ul>
  <li><strong>Pagrindinė antraštė</strong> – pirmasis ekranas ir mygtukai.</li>
  <li><strong>Paslaugos</strong> – sekcijos antraštė; kortelės redaguojamos meniu Paslaugos.</li>
  <li><strong>Tekstas</strong> – laisvai redaguojamas tekstas apie meistrą.</li>
  <li><strong>Kortelės</strong> – regionų arba straipsnių kortelės.</li>
  <li><strong>Galerija</strong> – sekcijos tekstas ir rodomų nuotraukų skaičius.</li>
  <li><strong>D.U.K.</strong> – klausimai ir atsakymai.</li>
  <li><strong>Kontaktai</strong> – telefonas, el. paštas, Facebook ir formos antraštė.</li>
</ul>

<h2>3. Blokų tvarkos keitimas</h2>
<ol>
  <li>Atidarykite Pagrindinį puslapį.</li>
  <li>Laikykite bloko tempimo rankenėlę.</li>
  <li>Nutempkite bloką aukščiau arba žemiau.</li>
  <li>Paspauskite <strong>Save</strong>.</li>
</ol>

<h2>4. Naujos sekcijos pridėjimas</h2>
<ol>
  <li>Puslapio sekcijų apačioje pasirinkite <strong>Create New / Sukurti naują</strong>.</li>
  <li>Pasirinkite bloko tipą.</li>
  <li>Užpildykite laukus.</li>
  <li>Išsaugokite bloką ir puslapį.</li>
</ol>

<h2>5. Paslaugų kortelės</h2>
<ol>
  <li>Kairėje atidarykite <strong>Paslaugos</strong>.</li>
  <li>Atidarykite kortelę arba sukurkite naują.</li>
  <li>Įrašykite pavadinimą, aprašymą, nuotrauką ir nuorodą.</li>
  <li>Laukas Eiliškumas: 1 rodoma pirma, 2 – antra ir t. t.</li>
  <li>Norėdami rodyti pasirinkite <strong>Paskelbta</strong>; paslėpti – <strong>Juodraštis</strong>.</li>
</ol>

<h2>6. SEO ir Google</h2>
<ol>
  <li>Atidarykite <strong>Puslapiai → Pagrindinis puslapis</strong>.</li>
  <li>Atverkite <strong>SEO ir Google nustatymai</strong>.</li>
  <li>Keiskite Google pavadinimą, meta aprašymą, pagrindinį raktažodį ar dalinimosi nuotrauką.</li>
  <li><strong>No Index palikite išjungtą</strong>, nes jį įjungus Google puslapio nerodys.</li>
  <li>Paspauskite Save.</li>
</ol>

<h2>7. Jei pakeitimo nematyti</h2>
<ol>
  <li>Patikrinkite, ar paspaudėte Save.</li>
  <li>Patikrinkite, ar būsena yra Paskelbta.</li>
  <li>Palaukite 30 sekundžių.</li>
  <li>Svetainėje paspauskite Ctrl + F5.</li>
</ol>

<blockquote><p><strong>Jeigu abejojate – netrinkite. Pasirinkite Juodraštis arba kreipkitės į administratorių.</strong></p></blockquote>
$guide$)
ON CONFLICT (id) DO UPDATE SET turinys = EXCLUDED.turinys;

COMMIT;
