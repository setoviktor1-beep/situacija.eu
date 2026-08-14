const cheerio = require('cheerio');

const SITE_URL = 'https://situacija.eu';

const LOCALES = {
  lt: { htmlLang: 'lt', schemaLang: 'lt-LT', ogLocale: 'lt_LT', label: 'LT' },
  pl: { htmlLang: 'pl', schemaLang: 'pl-PL', ogLocale: 'pl_PL', label: 'PL' },
  ru: { htmlLang: 'ru', schemaLang: 'ru-RU', ogLocale: 'ru_RU', label: 'RU' },
};

const PAGE_GROUPS = {
  home: {
    source: 'index.html',
    lt: '/',
    pl: '/pl/',
    ru: '/ru/',
  },
  gallery: {
    source: 'gallery.html',
    lt: '/gallery.html',
    pl: '/pl/galeria.html',
    ru: '/ru/galereya.html',
  },
  faq: {
    source: 'duk.html',
    lt: '/duk.html',
    pl: '/pl/faq.html',
    ru: '/ru/faq.html',
  },
  privacy: {
    source: 'privatumo-politika.html',
    lt: '/privatumo-politika.html',
    pl: '/pl/polityka-prywatnosci.html',
    ru: '/ru/politika-konfidencialnosti.html',
  },
  pabrade: {
    source: 'plyteliu-klojimas-pabrade.html',
    lt: '/plyteliu-klojimas-pabrade.html',
    pl: '/pl/ukladanie-plytek-pabrade.html',
    ru: '/ru/ukladka-plitki-pabrade.html',
  },
  svencionys: {
    source: 'plyteliu-klojimas-svencionys.html',
    lt: '/plyteliu-klojimas-svencionys.html',
    pl: '/pl/ukladanie-plytek-svencionys.html',
    ru: '/ru/ukladka-plitki-svencionys.html',
  },
  vilnius: {
    source: 'plyteliu-klojimas-vilnius.html',
    lt: '/plyteliu-klojimas-vilnius.html',
    pl: '/pl/ukladanie-plytek-wilno.html',
    ru: '/ru/ukladka-plitki-vilnius.html',
  },
};

const ROUTES = new Map();
for (const [pageKey, group] of Object.entries(PAGE_GROUPS)) {
  for (const locale of Object.keys(LOCALES)) {
    ROUTES.set(group[locale], { pageKey, locale, source: group.source, pathname: group[locale] });
  }
}

const META = {
  pl: {
    home: {
      title: 'Układanie płytek w Pabradė, Święcianach i Wilnie | Vladislav',
      description: 'Układanie płytek w Pabradė, Święcianach i Wilnie. Łazienki, hydroizolacja oraz płytki wielkoformatowe. Tel. +370 600 30288.',
    },
    gallery: {
      title: 'Galeria prac glazurniczych | Situacija.eu',
      description: 'Realizacje układania płytek, wykończenia łazienek, hydroizolacji i klinkieru w Pabradė, Święcianach i Wilnie.',
    },
    faq: {
      title: 'Najczęstsze pytania o układanie płytek | Situacija.eu',
      description: 'Odpowiedzi dotyczące cen, terminów, hydroizolacji i układania płytek w Pabradė, Święcianach oraz Wilnie.',
    },
    privacy: {
      title: 'Polityka prywatności | Situacija.eu',
      description: 'Informacje o przetwarzaniu danych kontaktowych, plikach cookies i Google Analytics w serwisie Situacija.eu.',
    },
    pabrade: {
      title: 'Układanie płytek w Pabradė (Podbrodziu) | Vladislav',
      description: 'Profesjonalne układanie płytek w Pabradė i okolicy. Łazienki, kuchnie, podłogi, tarasy i klinkier. Tel. +370 600 30288.',
    },
    svencionys: {
      title: 'Układanie płytek w Święcianach i Nowych Święcianach',
      description: 'Usługi glazurnicze w Święcianach, Nowych Święcianach i całym rejonie święciańskim. Fachowiec Vladislav. Tel. +370 600 30288.',
    },
    vilnius: {
      title: 'Układanie płytek w Wilnie i rejonie wileńskim | Vladislav',
      description: 'Dokładne układanie płytek oraz wykończenie łazienek i podłóg w Wilnie i rejonie wileńskim. Tel. +370 600 30288.',
    },
  },
  ru: {
    home: {
      title: 'Укладка плитки в Пабраде, Швенчёнисе и Вильнюсе | Владислав',
      description: 'Профессиональная укладка плитки в Пабраде, Швенчёнисе, Швенчёнеляе и Вильнюсе. Ванные, гидроизоляция, крупноформатная плитка. Тел. +370 600 30288.',
    },
    gallery: {
      title: 'Галерея работ по укладке плитки | Situacija.eu',
      description: 'Примеры укладки плитки, отделки ванных, гидроизоляции и клинкера в Пабраде, Швенчёнисе и Вильнюсе.',
    },
    faq: {
      title: 'Частые вопросы об укладке плитки | Situacija.eu',
      description: 'Ответы о стоимости, сроках, гидроизоляции и укладке плитки в Пабраде, Швенчёнисе и Вильнюсе.',
    },
    privacy: {
      title: 'Политика конфиденциальности | Situacija.eu',
      description: 'Информация об обработке контактных данных, файлах cookie и Google Analytics на сайте Situacija.eu.',
    },
    pabrade: {
      title: 'Укладка плитки в Пабраде и окрестностях | Владислав',
      description: 'Профессиональная укладка плитки в Пабраде. Ванные, кухни, полы, террасы и клинкер. Тел. +370 600 30288.',
    },
    svencionys: {
      title: 'Укладка плитки в Швенчёнисе и Швенчёнеляе',
      description: 'Плиточные и отделочные работы в Швенчёнисе, Швенчёнеляе и Швенчёнском районе. Мастер Владислав. Тел. +370 600 30288.',
    },
    vilnius: {
      title: 'Укладка плитки в Вильнюсе и районе | Владислав',
      description: 'Аккуратная укладка плитки, отделка ванных и полов в Вильнюсе и Вильнюсском районе. Тел. +370 600 30288.',
    },
  },
};

const PL = {
  'Paslaugos': 'Usługi',
  'Apie Meistrą': 'O fachowcu',
  'Apie meistrą': 'O fachowcu',
  'Veiklos Regionai': 'Obsługiwany obszar',
  'Veiklos regionai': 'Obsługiwany obszar',
  'Darbų Galerija': 'Galeria prac',
  'Darbų galerija': 'Galeria prac',
  'Darbų galerija (40+ nuotraukų)': 'Galeria prac (ponad 40 zdjęć)',
  'D.U.K.': 'FAQ',
  'D.U.K. (Pilnas puslapis)': 'FAQ (pełna strona)',
  'Kontaktai': 'Kontakt',
  'Kontaktai ir Sąmata': 'Kontakt i wycena',
  'Kontaktai ir sąmata': 'Kontakt i wycena',
  '📞 Skambinti +370 600 30288': '📞 Zadzwoń +370 600 30288',
  'Skambinti: +370 600 30288': 'Zadzwoń: +370 600 30288',
  'Skambinti +370 600 30288': 'Zadzwoń +370 600 30288',
  'Aukščiausios Klasės Apdailos Meistras': 'Najwyższa jakość prac wykończeniowych',
  'Profesionalus Plytelių Klijavimas ir Apdaila': 'Profesjonalne układanie płytek i wykończenia',
  'Aukščiausios kokybės plytelių klojimas, paviršių išlyginimas, hidroizoliacija bei klinkerio apdaila. Pagrindiniai veiklos rajonai:': 'Najwyższej jakości układanie płytek, wyrównywanie podłoża, hydroizolacja i wykończenie klinkierem. Główne obszary działania:',
  'ir pagal užimtumą': 'oraz, zależnie od dostępności,',
  '📞 Skambinti: +370 600 30288': '📞 Zadzwoń: +370 600 30288',
  'Žiūrėti Darbų Galeriją': 'Zobacz galerię prac',
  'Metų Patirtis Apdailoje': 'Lat doświadczenia',
  'Preciziškos 45° Siūlės': 'Precyzyjne narożniki 45°',
  'Atliktų Projektų': 'Zrealizowanych projektów',
  'Garancija': 'Gwarancja',
  'Atliktiems Darbams': 'Na wykonane prace',
  'Aukščiausi Standartai': 'Najwyższe standardy',
  'Atliekamos Paslaugos': 'Zakres usług',
  'Specializuojamės visų tipų plytelių klojime – nuo smulkios mozaikos iki didelio formato akmens masės plytelių.': 'Specjalizujemy się we wszystkich rodzajach płytek – od drobnej mozaiki po wielkoformatowy gres.',
  'Vonios Kambarių Įrengimas': 'Kompleksowe łazienki',
  'Pilnas vonios kambario plytelių klijavimas, teptinė hidroizoliacija, kampinių juostų montavimas, dušo nuolydžių formavimas ir išorinių kampų suleidimas 45° kampu.': 'Kompleksowe układanie płytek w łazience, hydroizolacja, taśmy narożne, formowanie spadków prysznica i narożniki szlifowane pod kątem 45°.',
  'Virtuvės Prijuostės ir Grindys': 'Ściany kuchenne i podłogi',
  'Virtuvės sienelių ir grindų klijavimas. Tikslus rozečių išpjovimas vandens pjovimo technika, raštų bei geometrijos suderinimas.': 'Układanie płytek na ścianach i podłogach kuchennych. Dokładne wycięcia pod gniazdka oraz dopasowanie wzoru i geometrii.',
  'Didelio Formato Akmens Masė': 'Płytki wielkoformatowe',
  'Didelių matmenų (60x120, 80x80, 120x120 cm) plytelių klojimas svetainėse, koridoriuose, lauko terasose su specialia plytelių lyginimo sistema (TLS).': 'Układanie dużych płytek 60x120, 80x80 i 120x120 cm w salonach, korytarzach i na tarasach z użyciem systemu poziomowania TLS.',
  'Fasadų Apdaila Klinkeriu': 'Elewacje z klinkieru',
  'Fasadų, cokolio, tvorų ir židinių klijavimas klinkerio plytelėmis. Klinkerio siūlių rievėjimas ir apsauginis impregnavimas nuo drėgmės.': 'Okładanie elewacji, cokołów, ogrodzeń i kominków płytkami klinkierowymi, fugowanie oraz impregnacja przed wilgocią.',
  'Patirtis ir Kokybė': 'Doświadczenie i jakość',
  'Apie Meistrą ir Taikomas Technologijas': 'O fachowcu i stosowanych technologiach',
  'Kokybiškas plytelių klojimas reikalauja ne tik ilgametės patirties, bet ir šiuolaikinių įrankių bei griežto technologinių procesų laikymosi.': 'Dobre układanie płytek wymaga doświadczenia, nowoczesnych narzędzi i dokładnego przestrzegania technologii.',
  'Meistras Vladislav Finažonok – Nemokama Sąmata ir Atsakingas Požiūris': 'Vladislav Finažonok – bezpłatna wycena i odpowiedzialne podejście',
  'Kiekvienas būsto remontas ar naujos statybos įrengimas prasideda nuo tinkamo pasiruošimo. Dirbu': 'Każdy remont lub wykończenie nowego domu zaczyna się od właściwego przygotowania. Pracuję w',
  'Kiekvienam objektui suteikiu nemokamą pirminę konsultaciją, padedu tiksliai apskaičiuoti reikiamą plytelių, klijų, hidroizoliacijos bei glaisto kiekį.': 'Dla każdego obiektu oferuję bezpłatną konsultację i pomagam dokładnie obliczyć ilość płytek, kleju, hydroizolacji i fugi.',
  'Dirbant naudojami tik aukščiausios klasės įrankiai: deimantiniai pjovimo diskai, elektrinės šlapio pjovimo staklės, lazeriniai nivelyrai bei plytelių lyginimo sistemos (TLS), kurios užtikrina idealiai lygų paviršių be jokių aukščių skirtumų tarp plytelių.': 'Używam profesjonalnych narzędzi: tarcz diamentowych, przecinarek na mokro, laserów i systemów poziomowania TLS, które zapewniają równą powierzchnię bez uskoków.',
  '45° Kampų Suleidimas:': 'Narożniki 45°:',
  'Išoriniai kampai šlifuojami deimantinėmis lėkštėmis be plastikinių kampukų.': 'Narożniki zewnętrzne są szlifowane diamentowo, bez plastikowych listew.',
  'Sertifikuota Hidroizoliacija:': 'Certyfikowana hydroizolacja:',
  'Dušo ir vonios zonos apsaugomos 2 sluoksnių elastinga hidroizoliacija su sandarinimo juostomis.': 'Strefy prysznica i wanny zabezpieczane są dwiema warstwami elastycznej hydroizolacji z taśmami uszczelniającymi.',
  'Epoksidinis ir Cementinis Glaistymas:': 'Fugi epoksydowe i cementowe:',
  'Siūlių užpildymas drėgmei ir nešvarumams atspariais glaistais.': 'Spoiny wypełniane są fugami odpornymi na wilgoć i zabrudzenia.',
  'Tvarka ir Švara:': 'Porządek i czystość:',
  'Po kiekvienos darbo dienos objektas paliekamas tvarkingas, surinktos statybinės atliekos.': 'Po każdym dniu pracy obiekt pozostaje uporządkowany, a odpady budowlane są zebrane.',
  'Plytelių Klojimo Darbų Eiga nuo A iki Ž': 'Etapy układania płytek od A do Z',
  'Objekto Apžiūra': 'Oględziny obiektu',
  'Paviršių lygumo patikra lazeriu, drėgmės matavimas, tiksli sąmata ir medžiagų rekomendacijos.': 'Kontrola równości laserem, pomiar wilgotności, dokładna wycena i dobór materiałów.',
  'Paruošimas ir Hidroizoliacija': 'Przygotowanie i hydroizolacja',
  'Sienų ir grindų lyginimas, gruntavimas gilaus skverbimosi gruntu, hidroizoliacijos teptinis padengimas.': 'Wyrównanie ścian i podłóg, gruntowanie oraz nakładanie hydroizolacji.',
  'Pjovimas ir Klijavimas': 'Cięcie i klejenie',
  'Tikslus plytelių pjovimas, kampų 45° miter pjovimas ir klijavimas naudojant elastingus C2TE/S1 klijus.': 'Precyzyjne cięcie, narożniki 45° i klejenie elastycznym klejem C2TE/S1.',
  'Glaistymas ir Hermetizavimas': 'Fugowanie i uszczelnianie',
  'Siūlių valymas, užpildymas pasirinktu glaistu bei vidinių kampų sandarinimas sanitarijos silikonu.': 'Czyszczenie i fugowanie spoin oraz uszczelnianie narożników silikonem sanitarnym.',
  'Geografija': 'Obszar działania',
  'Veiklos Teritorija ir Regionai': 'Obsługiwane miejscowości',
  'Aptarnaujame klientus Švenčionių rajone bei esant laisvam grafikui vykstame į Vilnių ir jo apylinkes.': 'Obsługujemy rejon święciański, a przy wolnych terminach również Wilno i okolice.',
  'Pabradė ir Pabradės Sen.': 'Pabradė (Podbrodzie) i okolice',
  'Pagrindinė veiklos lokacija. Operatyvus atvykimas matavimams, lankstus prisitaikymas prie užsakovo grafiko.': 'Główny obszar pracy. Szybki dojazd na pomiary i elastyczne terminy.',
  'Skaityti apie paslaugas Pabradėje →': 'Usługi w Pabradė →',
  'Švenčionys ir Švenčionėliai': 'Święciany i Nowe Święciany',
  'Atliekame visus plytelių klojimo bei vidaus apdailos darbus butuose, individualiuose namuose ir sodybose Švenčionių r.': 'Wykonujemy układanie płytek i prace wykończeniowe w mieszkaniach, domach i gospodarstwach rejonu święciańskiego.',
  'Skaityti apie paslaugas Švenčionyse →': 'Usługi w Święcianach →',
  'Vilnius ir Vilniaus Rajonas': 'Wilno i rejon wileński',
  'Pagal išankstinį susitarimą ir užimtumą priimame užsakymus Vilniaus mieste bei aplinkinėse gyvenvietėse.': 'Po wcześniejszym uzgodnieniu przyjmujemy zlecenia w Wilnie i okolicznych miejscowościach.',
  'Skaityti apie paslaugas Vilniuje →': 'Usługi w Wilnie →',
  'Plačiau apie paslaugą →': 'Więcej o usłudze →',
  'Plačiau apie paslaugą': 'Więcej o usłudze',
  'Plačiau →': 'Więcej →',
  'Vonios plytelių klijavimas →': 'Układanie płytek w łazience →',
  'Virtuvės plytelių klijavimas →': 'Układanie płytek w kuchni →',
  'Didelio formato plytelės →': 'Płytki wielkoformatowe →',
  'Klinkerio klijavimas →': 'Układanie klinkieru →',
  'Realiai Atlikti Darbai': 'Prawdziwe realizacje',
  'Peržiūrėkite mūsų atliktų vonios kambarių, virtuvių bei klinkerio fasadų nuotraukas. Paspauskite ant nuotraukos norėdami padidinti.': 'Zobacz wykonane łazienki, kuchnie i elewacje klinkierowe. Kliknij zdjęcie, aby je powiększyć.',
  'Žiūrėti Visas 40+ Darbų Nuotraukas →': 'Zobacz ponad 40 zdjęć realizacji →',
  'Naudinga Žinoti': 'Warto wiedzieć',
  'Dažniausiai Užduodami Klausimai (D.U.K.)': 'Najczęściej zadawane pytania',
  'Atsakymai į svarbiausius klausimus apie plytelių klojimo kainas, terminus ir technologijas.': 'Odpowiedzi na najważniejsze pytania o ceny, terminy i technologie.',
  'Skaityti Pilną D.U.K. Puslapį →': 'Zobacz wszystkie pytania →',
  'Susisiekite su Meistru': 'Skontaktuj się z fachowcem',
  'Nori sužinoti tikslią darbų sąmatą ar pasitarti dėl plytelių klojimo Pabradėje, Švenčionyse ar Vilniuje? Tiesiogiai susisiekite su meistru.': 'Chcesz poznać dokładną cenę lub omówić układanie płytek w Pabradė, Święcianach albo Wilnie? Skontaktuj się bezpośrednio z fachowcem.',
  'Telefonas:': 'Telefon:',
  'El. paštas:': 'E-mail:',
  'Meistras:': 'Fachowiec:',
  'Gauti Nemokamą Sąmatą': 'Otrzymaj bezpłatną wycenę',
  'Jūsų Vardas *': 'Imię *',
  'Vardas': 'Imię',
  'Telefonas *': 'Telefon *',
  'Miestas ir Darbų Aprašymas': 'Miejscowość i opis prac',
  'Siųsti Užklausą Meistrui': 'Wyślij zapytanie',
  'Visos teisės saugomos.': 'Wszelkie prawa zastrzeżone.',
  'Grįžti į Pradžią': 'Powrót na stronę główną',
  'Grįžti į pradžią': 'Powrót na stronę główną',
  'Susisiekti dėl darbų': 'Zapytaj o realizację',
  'Atlikti plytelių klojimo darbai': 'Wykonane prace glazurnicze',
  'Vonios, virtuvės, grindų ir klinkerio apdailos darbų pavyzdžiai.': 'Przykłady wykończenia łazienek, kuchni, podłóg i klinkieru.',
  'Skaidrumas ir Informacija': 'Przejrzyste informacje',
  'Viskas, ką reikia žinoti apie plytelių klojimo paslaugas, kainodarą, terminus bei technologijas Pabradėje, Švenčionyse ir Vilniuje.': 'Wszystko, co warto wiedzieć o usługach, cenach, terminach i technologii układania płytek w Pabradė, Święcianach i Wilnie.',
  'Kiek kainuoja plytelių klojimas Pabradėje, Švenčionyse ar Vilniuje?': 'Ile kosztuje układanie płytek w Pabradė, Święcianach lub Wilnie?',
  'Kokiose vietovėse ir rajonuose teikiate paslaugas?': 'W jakich miejscowościach świadczycie usługi?',
  'Ar atliekate vonios kambario hidroizoliacijos darbus?': 'Czy wykonujecie hydroizolację łazienek?',
  'Kaip formuojami išoriniai plytelių kampai?': 'Jak wykańczane są zewnętrzne narożniki płytek?',
  'Ar klojate didelio formato plyteles (60x120 cm, 80x80 cm ir didesnes)?': 'Czy układacie płytki wielkoformatowe 60x120, 80x80 cm i większe?',
  'Koks skirtumas tarp cementinio ir epoksidinio glaisto?': 'Czym różni się fuga cementowa od epoksydowej?',
  'Kiek laiko trunka vonios kambario plytelių klojimas?': 'Ile trwa układanie płytek w łazience?',
  'Ar padedate išsirinkti ir pristatyti statybines medžiagas?': 'Czy pomagacie wybrać i dostarczyć materiały?',
  'Plytelių klojimo kaina skaičiuojama už kvadratinį metrą (m²) arba už visą objektą. Kaina priklauso nuo plytelių formato (didelio formato plytelės reikalauja papildomų lyginimo sistemų), paviršiaus būklės (ar reikia lyginti sienas/grindis), 45° kampų pjovimo kiekio bei pasirinkto glaisto (cementinis ar epoksidinis). Tikslią sąmatą pateikiame po pirminio įvertinimo. Skambinkite tel.': 'Cena jest ustalana za metr kwadratowy (m²) lub za cały obiekt. Zależy od formatu płytek, stanu podłoża, liczby narożników 45° oraz rodzaju fugi. Dokładną wycenę przedstawiamy po wstępnej ocenie. Zadzwoń:',
  'Pagrindinė meistro veiklos teritorija yra': 'Główny obszar działania to',
  'Taip pat pagal susitarimą ir laisvą grafiką atliekame darbus': 'Po uzgodnieniu i przy wolnych terminach pracujemy także',
  'Taip, hidroizoliacija yra būtina kiekvienam vonios kambariui ar dušo zonai. Naudojame sertifikuotas teptines hidroizoliacijos mastikas bei elastingas sandarinimo juostas kampams ir vamzdžių įvadams, kas užkerta kelią bet kokiam drėgmės pratekėjimui.': 'Tak. Hydroizolacja jest niezbędna w każdej łazience i strefie prysznica. Stosujemy certyfikowane masy oraz elastyczne taśmy do narożników i przejść rurowych.',
  'Išorinius plytelių kampus pjauname ir šlifuojame 45 laipsnių kampu (angl.': 'Zewnętrzne narożniki tniemy i szlifujemy pod kątem 45° (ang.',
  'Tai leidžia išvengti pigiai atrodančių plastikinių ar metalinių kampukų naudojimo – kampai atrodo estetiškai, lygiai ir moderniai.': 'Pozwala to uniknąć plastikowych i metalowych listew, a narożniki wyglądają estetycznie i nowocześnie.',
  'Taip, specializuojamės visų matmenų plytelių klojime – nuo smulkių mozaikų iki didelio formato akmens masės plytelių (60x120 cm, 80x80 cm, 120x120 cm). Naudojame specialias vakuumines pritraukimo rankenas, šlapio pjovimo stakles bei TLS plytelių lyginimo sistemas, užtikrinančias nepriekaištingą paviršių.': 'Tak, układamy wszystkie formaty – od mozaiki po gres 60x120, 80x80 i 120x120 cm. Używamy przyssawek, przecinarek na mokro i systemu poziomowania TLS.',
  'Cementinis glaistymas yra standartinis sprendimas, o epoksidinis glaistas yra 100% neįgeriantis vandens, purvo bei riebalų. Epoksidinis glaistas rekomenduojamas dušo zonoms ir virtuvės grindims, nes laikui bėgant nekinta jo spalva ir nesiveisia pelėsis.': 'Fuga cementowa jest rozwiązaniem standardowym, natomiast epoksydowa nie chłonie wody, brudu ani tłuszczu. Polecamy ją do pryszniców i podłóg kuchennych.',
  'Vidutinio dydžio vonios kambario (5–8 m²) pilna apdaila su paruošimu, hidroizoliacija, klijavimu ir glaistymu paprastai trunka nuo 5 iki 9 darbo dienų.': 'Kompleksowe wykończenie łazienki 5–8 m² z przygotowaniem, hydroizolacją i fugowaniem trwa zwykle 5–9 dni roboczych.',
  'Taip, padedame tiksliai apskaičiuoti reikalingų klijų, hidroizoliacijos, grunto bei glaisto kiekius. Esant poreikiui, rekomenduojame patikrintų gamintojų medžiagas (Mapei, Ceresit, Knauf) ir padedame organizuoti atvežimą.': 'Tak, pomagamy obliczyć ilość kleju, hydroizolacji, gruntu i fugi, polecamy sprawdzone materiały oraz pomagamy zorganizować dostawę.',
  'Plytelių Klojimas Pabradėje': 'Układanie płytek w Pabradė (Podbrodziu)',
  'Kokybiškos ir patikimos plytelių klijavimo paslaugos Pabradės mieste ir apylinkėse. Meistras Vladislav Finažonok.': 'Solidne usługi glazurnicze w Pabradė i okolicy. Fachowiec Vladislav Finažonok.',
  'Paslaugos Pabradėje': 'Usługi glazurnicze w Pabradė',
  'Vonios Kambariai Pabradėje': 'Łazienki w Pabradė',
  'Pilna vonios kambario apdaila, plytelių klijavimas, kampų pjovimas 45° kampu, hidroizoliacija.': 'Kompleksowe wykończenie łazienki, płytki, narożniki 45° i hydroizolacja.',
  'Virtuvės Sienelės ir Grindys': 'Ściany kuchenne i podłogi',
  'Virtuvės prijuosčių klijavimas, raštų derinimas ir pedantiškas siūlių glaistymas.': 'Układanie płytek kuchennych, dopasowanie wzoru i dokładne fugowanie.',
  'Didelio Formato Plytelės': 'Płytki wielkoformatowe',
  'Akmens masės didelių matmenų plytelių klojimas svetainėse, holuose ir terasose.': 'Układanie wielkoformatowego gresu w salonach, holach i na tarasach.',
  'Plytelių Klojimas Švenčionyse ir Rajone': 'Układanie płytek w Święcianach i rejonie',
  'Profesionalūs apdailos darbai Švenčionyse, Švenčionėliuose ir aplinkiniuose kaimuose.': 'Profesjonalne prace wykończeniowe w Święcianach, Nowych Święcianach i okolicznych miejscowościach.',
  'Apdailos Paslaugos Švenčionių Rajone': 'Usługi wykończeniowe w rejonie święciańskim',
  'Vonios ir Dušo Zonos': 'Łazienki i strefy prysznica',
  'Vidinių paviršių hidroizoliacija, nuolydžių formavimas ir plytelių suleidimas 45 laipsnių kampu.': 'Hydroizolacja, formowanie spadków i narożniki płytek szlifowane pod kątem 45°.',
  'Fasadai ir Klinkeris': 'Elewacje i klinkier',
  'Cokolio, tvorų bei fasadų klijavimas klinkerio plytelėmis.': 'Okładanie cokołów, ogrodzeń i elewacji płytkami klinkierowymi.',
  'Grindų Plytelių Klojimas': 'Układanie płytek podłogowych',
  'Skirtingų gabaritų akmens masės ir keraminių plytelių klojimas.': 'Układanie gresu i płytek ceramicznych w różnych formatach.',
  'Plytelių Klojimas Vilniuje ir Rajone': 'Układanie płytek w Wilnie i rejonie',
  'Pagal galimybes ir grafiką priimame užsakymus Vilniuje ir Vilniaus rajone.': 'W zależności od terminów przyjmujemy zlecenia w Wilnie i rejonie wileńskim.',
};

const RU = {
  'Paslaugos': 'Услуги',
  'Apie Meistrą': 'О мастере',
  'Apie meistrą': 'О мастере',
  'Veiklos Regionai': 'Районы работы',
  'Veiklos regionai': 'Районы работы',
  'Darbų Galerija': 'Галерея работ',
  'Darbų galerija': 'Галерея работ',
  'Darbų galerija (40+ nuotraukų)': 'Галерея работ (40+ фото)',
  'D.U.K.': 'Вопросы',
  'D.U.K. (Pilnas puslapis)': 'Все вопросы',
  'Kontaktai': 'Контакты',
  'Kontaktai ir Sąmata': 'Контакты и смета',
  'Kontaktai ir sąmata': 'Контакты и смета',
  '📞 Skambinti +370 600 30288': '📞 Позвонить +370 600 30288',
  'Skambinti: +370 600 30288': 'Позвонить: +370 600 30288',
  'Skambinti +370 600 30288': 'Позвонить +370 600 30288',
  'Aukščiausios Klasės Apdailos Meistras': 'Мастер отделки высшего класса',
  'Profesionalus Plytelių Klijavimas ir Apdaila': 'Профессиональная укладка плитки и отделка',
  'Aukščiausios kokybės plytelių klojimas, paviršių išlyginimas, hidroizoliacija bei klinkerio apdaila. Pagrindiniai veiklos rajonai:': 'Качественная укладка плитки, выравнивание поверхностей, гидроизоляция и отделка клинкером. Основные районы работы:',
  'ir pagal užimtumą': 'и, при наличии свободного времени,',
  '📞 Skambinti: +370 600 30288': '📞 Позвонить: +370 600 30288',
  'Žiūrėti Darbų Galeriją': 'Смотреть галерею работ',
  'Metų Patirtis Apdailoje': 'Лет опыта в отделке',
  'Preciziškos 45° Siūlės': 'Точные углы 45°',
  'Atliktų Projektų': 'Выполненных проектов',
  'Garancija': 'Гарантия',
  'Atliktiems Darbams': 'На выполненные работы',
  'Aukščiausi Standartai': 'Высокие стандарты',
  'Atliekamos Paslaugos': 'Наши услуги',
  'Specializuojamės visų tipų plytelių klojime – nuo smulkios mozaikos iki didelio formato akmens masės plytelių.': 'Укладываем плитку любых типов — от мелкой мозаики до крупноформатного керамогранита.',
  'Vonios Kambarių Įrengimas': 'Комплексная отделка ванных',
  'Pilnas vonios kambario plytelių klijavimas, teptinė hidroizoliacija, kampinių juostų montavimas, dušo nuolydžių formavimas ir išorinių kampų suleidimas 45° kampu.': 'Полная облицовка ванной, гидроизоляция, герметизирующие ленты, формирование уклонов душа и внешние углы под 45°.',
  'Virtuvės Prijuostės ir Grindys': 'Кухонные фартуки и полы',
  'Virtuvės sienelių ir grindų klijavimas. Tikslus rozečių išpjovimas vandens pjovimo technika, raštų bei geometrijos suderinimas.': 'Укладка плитки на кухонные стены и полы, точные вырезы под розетки, совмещение рисунка и геометрии.',
  'Didelio Formato Akmens Masė': 'Крупноформатный керамогранит',
  'Didelių matmenų (60x120, 80x80, 120x120 cm) plytelių klojimas svetainėse, koridoriuose, lauko terasose su specialia plytelių lyginimo sistema (TLS).': 'Укладка плитки 60x120, 80x80 и 120x120 см в гостиных, коридорах и на террасах с системой выравнивания TLS.',
  'Fasadų Apdaila Klinkeriu': 'Отделка фасадов клинкером',
  'Fasadų, cokolio, tvorų ir židinių klijavimas klinkerio plytelėmis. Klinkerio siūlių rievėjimas ir apsauginis impregnavimas nuo drėgmės.': 'Облицовка фасадов, цоколей, заборов и каминов клинкерной плиткой, расшивка швов и защита от влаги.',
  'Patirtis ir Kokybė': 'Опыт и качество',
  'Apie Meistrą ir Taikomas Technologijas': 'О мастере и технологиях',
  'Kokybiškas plytelių klojimas reikalauja ne tik ilgametės patirties, bet ir šiuolaikinių įrankių bei griežto technologinių procesų laikymosi.': 'Качественная укладка требует опыта, современного инструмента и строгого соблюдения технологии.',
  'Meistras Vladislav Finažonok – Nemokama Sąmata ir Atsakingas Požiūris': 'Мастер Владислав Финажонок — бесплатная смета и ответственный подход',
  'Kiekvienas būsto remontas ar naujos statybos įrengimas prasideda nuo tinkamo pasiruošimo. Dirbu': 'Любой ремонт или отделка нового дома начинается с правильной подготовки. Работаю в',
  'Kiekvienam objektui suteikiu nemokamą pirminę konsultaciją, padedu tiksliai apskaičiuoti reikiamą plytelių, klijų, hidroizoliacijos bei glaisto kiekį.': 'Для каждого объекта предлагаю бесплатную консультацию и помогаю рассчитать количество плитки, клея, гидроизоляции и затирки.',
  'Dirbant naudojami tik aukščiausios klasės įrankiai: deimantiniai pjovimo diskai, elektrinės šlapio pjovimo staklės, lazeriniai nivelyrai bei plytelių lyginimo sistemos (TLS), kurios užtikrina idealiai lygų paviršių be jokių aukščių skirtumų tarp plytelių.': 'Использую профессиональные алмазные диски, мокрые плиткорезы, лазерные уровни и системы TLS, обеспечивающие ровную поверхность без перепадов.',
  '45° Kampų Suleidimas:': 'Углы 45°:',
  'Išoriniai kampai šlifuojami deimantinėmis lėkštėmis be plastikinių kampukų.': 'Внешние углы шлифуются алмазным инструментом без пластиковых уголков.',
  'Sertifikuota Hidroizoliacija:': 'Сертифицированная гидроизоляция:',
  'Dušo ir vonios zonos apsaugomos 2 sluoksnių elastinga hidroizoliacija su sandarinimo juostomis.': 'Зоны душа и ванны защищаются двумя слоями эластичной гидроизоляции с герметизирующими лентами.',
  'Epoksidinis ir Cementinis Glaistymas:': 'Эпоксидная и цементная затирка:',
  'Siūlių užpildymas drėgmei ir nešvarumams atspariais glaistais.': 'Швы заполняются затирками, устойчивыми к влаге и загрязнениям.',
  'Tvarka ir Švara:': 'Порядок и чистота:',
  'Po kiekvienos darbo dienos objektas paliekamas tvarkingas, surinktos statybinės atliekos.': 'После каждого рабочего дня объект остаётся чистым, строительный мусор собирается.',
  'Plytelių Klojimo Darbų Eiga nuo A iki Ž': 'Этапы укладки плитки от А до Я',
  'Objekto Apžiūra': 'Осмотр объекта',
  'Paviršių lygumo patikra lazeriu, drėgmės matavimas, tiksli sąmata ir medžiagų rekomendacijos.': 'Проверка ровности лазером, измерение влажности, точная смета и рекомендации материалов.',
  'Paruošimas ir Hidroizoliacija': 'Подготовка и гидроизоляция',
  'Sienų ir grindų lyginimas, gruntavimas gilaus skverbimosi gruntu, hidroizoliacijos teptinis padengimas.': 'Выравнивание стен и пола, грунтование и нанесение гидроизоляции.',
  'Pjovimas ir Klijavimas': 'Резка и укладка',
  'Tikslus plytelių pjovimas, kampų 45° miter pjovimas ir klijavimas naudojant elastingus C2TE/S1 klijus.': 'Точная резка плитки, запил углов под 45° и укладка на эластичный клей C2TE/S1.',
  'Glaistymas ir Hermetizavimas': 'Затирка и герметизация',
  'Siūlių valymas, užpildymas pasirinktu glaistu bei vidinių kampų sandarinimas sanitarijos silikonu.': 'Очистка и заполнение швов, герметизация внутренних углов санитарным силиконом.',
  'Geografija': 'География',
  'Veiklos Teritorija ir Regionai': 'Районы работы',
  'Aptarnaujame klientus Švenčionių rajone bei esant laisvam grafikui vykstame į Vilnių ir jo apylinkes.': 'Работаем в Швенчёнском районе, а при наличии свободного времени — в Вильнюсе и окрестностях.',
  'Pabradė ir Pabradės Sen.': 'Пабраде и окрестности',
  'Pagrindinė veiklos lokacija. Operatyvus atvykimas matavimams, lankstus prisitaikymas prie užsakovo grafiko.': 'Основной район работы. Быстрый выезд на замеры и гибкий график.',
  'Skaityti apie paslaugas Pabradėje →': 'Услуги в Пабраде →',
  'Švenčionys ir Švenčionėliai': 'Швенчёнис и Швенчёнеляй',
  'Atliekame visus plytelių klojimo bei vidaus apdailos darbus butuose, individualiuose namuose ir sodybose Švenčionių r.': 'Выполняем укладку плитки и внутреннюю отделку в квартирах, домах и усадьбах Швенчёнского района.',
  'Skaityti apie paslaugas Švenčionyse →': 'Услуги в Швенчёнисе →',
  'Vilnius ir Vilniaus Rajonas': 'Вильнюс и Вильнюсский район',
  'Pagal išankstinį susitarimą ir užimtumą priimame užsakymus Vilniaus mieste bei aplinkinėse gyvenvietėse.': 'По предварительной договорённости принимаем заказы в Вильнюсе и ближайших населённых пунктах.',
  'Skaityti apie paslaugas Vilniuje →': 'Услуги в Вильнюсе →',
  'Plačiau apie paslaugą →': 'Подробнее об услуге →',
  'Plačiau apie paslaugą': 'Подробнее об услуге',
  'Plačiau →': 'Подробнее →',
  'Vonios plytelių klijavimas →': 'Укладка плитки в ванной →',
  'Virtuvės plytelių klijavimas →': 'Укладка плитки на кухне →',
  'Didelio formato plytelės →': 'Крупноформатная плитка →',
  'Klinkerio klijavimas →': 'Укладка клинкера →',
  'Realiai Atlikti Darbai': 'Реальные работы',
  'Peržiūrėkite mūsų atliktų vonios kambarių, virtuvių bei klinkerio fasadų nuotraukas. Paspauskite ant nuotraukos norėdami padidinti.': 'Посмотрите фотографии ванных, кухонь и клинкерных фасадов. Нажмите на фото для увеличения.',
  'Žiūrėti Visas 40+ Darbų Nuotraukas →': 'Смотреть более 40 фотографий →',
  'Naudinga Žinoti': 'Полезно знать',
  'Dažniausiai Užduodami Klausimai (D.U.K.)': 'Часто задаваемые вопросы',
  'Atsakymai į svarbiausius klausimus apie plytelių klojimo kainas, terminus ir technologijas.': 'Ответы на важные вопросы о ценах, сроках и технологии укладки плитки.',
  'Skaityti Pilną D.U.K. Puslapį →': 'Смотреть все вопросы →',
  'Susisiekite su Meistru': 'Связаться с мастером',
  'Nori sužinoti tikslią darbų sąmatą ar pasitarti dėl plytelių klojimo Pabradėje, Švenčionyse ar Vilniuje? Tiesiogiai susisiekite su meistru.': 'Хотите узнать точную стоимость или обсудить укладку плитки в Пабраде, Швенчёнисе или Вильнюсе? Свяжитесь с мастером напрямую.',
  'Telefonas:': 'Телефон:',
  'El. paštas:': 'Эл. почта:',
  'Meistras:': 'Мастер:',
  'Gauti Nemokamą Sąmatą': 'Получить бесплатную смету',
  'Jūsų Vardas *': 'Ваше имя *',
  'Vardas': 'Имя',
  'Telefonas *': 'Телефон *',
  'Miestas ir Darbų Aprašymas': 'Город и описание работ',
  'Siųsti Užklausą Meistrui': 'Отправить заявку',
  'Visos teisės saugomos.': 'Все права защищены.',
  'Grįžti į Pradžią': 'Вернуться на главную',
  'Grįžti į pradžią': 'Вернуться на главную',
  'Susisiekti dėl darbų': 'Обсудить работу',
  'Atlikti plytelių klojimo darbai': 'Выполненные работы по укладке плитки',
  'Vonios, virtuvės, grindų ir klinkerio apdailos darbų pavyzdžiai.': 'Примеры отделки ванных, кухонь, полов и клинкерных поверхностей.',
  'Skaidrumas ir Informacija': 'Открытая информация',
  'Viskas, ką reikia žinoti apie plytelių klojimo paslaugas, kainodarą, terminus bei technologijas Pabradėje, Švenčionyse ir Vilniuje.': 'Всё об услугах, ценах, сроках и технологии укладки плитки в Пабраде, Швенчёнисе и Вильнюсе.',
  'Kiek kainuoja plytelių klojimas Pabradėje, Švenčionyse ar Vilniuje?': 'Сколько стоит укладка плитки в Пабраде, Швенчёнисе или Вильнюсе?',
  'Kokiose vietovėse ir rajonuose teikiate paslaugas?': 'В каких городах и районах вы работаете?',
  'Ar atliekate vonios kambario hidroizoliacijos darbus?': 'Выполняете ли вы гидроизоляцию ванной?',
  'Kaip formuojami išoriniai plytelių kampai?': 'Как оформляются внешние углы плитки?',
  'Ar klojate didelio formato plyteles (60x120 cm, 80x80 cm ir didesnes)?': 'Укладываете ли вы крупноформатную плитку 60x120, 80x80 см и больше?',
  'Koks skirtumas tarp cementinio ir epoksidinio glaisto?': 'Чем цементная затирка отличается от эпоксидной?',
  'Kiek laiko trunka vonios kambario plytelių klojimas?': 'Сколько времени занимает укладка плитки в ванной?',
  'Ar padedate išsirinkti ir pristatyti statybines medžiagas?': 'Помогаете ли вы выбрать и доставить материалы?',
  'Plytelių klojimo kaina skaičiuojama už kvadratinį metrą (m²) arba už visą objektą. Kaina priklauso nuo plytelių formato (didelio formato plytelės reikalauja papildomų lyginimo sistemų), paviršiaus būklės (ar reikia lyginti sienas/grindis), 45° kampų pjovimo kiekio bei pasirinkto glaisto (cementinis ar epoksidinis). Tikslią sąmatą pateikiame po pirminio įvertinimo. Skambinkite tel.': 'Цена рассчитывается за квадратный метр (м²) или за весь объект. Она зависит от формата плитки, состояния основания, количества углов 45° и вида затирки. Точная смета составляется после предварительной оценки. Позвоните:',
  'Pagrindinė meistro veiklos teritorija yra': 'Основной район работы мастера —',
  'Taip pat pagal susitarimą ir laisvą grafiką atliekame darbus': 'По договорённости и при свободном графике работаем также',
  'Taip, hidroizoliacija yra būtina kiekvienam vonios kambariui ar dušo zonai. Naudojame sertifikuotas teptines hidroizoliacijos mastikas bei elastingas sandarinimo juostas kampams ir vamzdžių įvadams, kas užkerta kelią bet kokiam drėgmės pratekėjimui.': 'Да. Гидроизоляция необходима в каждой ванной и душевой зоне. Используем сертифицированные мастики и эластичные ленты для углов и проходов труб.',
  'Išorinius plytelių kampus pjauname ir šlifuojame 45 laipsnių kampu (angl.': 'Внешние углы плитки режем и шлифуем под 45° (англ.',
  'Tai leidžia išvengti pigiai atrodančių plastikinių ar metalinių kampukų naudojimo – kampai atrodo estetiškai, lygiai ir moderniai.': 'Это позволяет отказаться от пластиковых и металлических профилей — углы выглядят ровно и современно.',
  'Taip, specializuojamės visų matmenų plytelių klojime – nuo smulkių mozaikų iki didelio formato akmens masės plytelių (60x120 cm, 80x80 cm, 120x120 cm). Naudojame specialias vakuumines pritraukimo rankenas, šlapio pjovimo stakles bei TLS plytelių lyginimo sistemas, užtikrinančias nepriekaištingą paviršių.': 'Да, укладываем плитку всех размеров — от мозаики до керамогранита 60x120, 80x80 и 120x120 см. Используем вакуумные присоски, мокрые плиткорезы и систему TLS.',
  'Cementinis glaistymas yra standartinis sprendimas, o epoksidinis glaistas yra 100% neįgeriantis vandens, purvo bei riebalų. Epoksidinis glaistas rekomenduojamas dušo zonoms ir virtuvės grindims, nes laikui bėgant nekinta jo spalva ir nesiveisia pelėsis.': 'Цементная затирка — стандартное решение, а эпоксидная не впитывает воду, грязь и жир. Она особенно подходит для душевых и кухонных полов.',
  'Vidutinio dydžio vonios kambario (5–8 m²) pilna apdaila su paruošimu, hidroizoliacija, klijavimu ir glaistymu paprastai trunka nuo 5 iki 9 darbo dienų.': 'Полная отделка ванной 5–8 м² с подготовкой, гидроизоляцией и затиркой обычно занимает 5–9 рабочих дней.',
  'Taip, padedame tiksliai apskaičiuoti reikalingų klijų, hidroizoliacijos, grunto bei glaisto kiekius. Esant poreikiui, rekomenduojame patikrintų gamintojų medžiagas (Mapei, Ceresit, Knauf) ir padedame organizuoti atvežimą.': 'Да, помогаем рассчитать количество клея, гидроизоляции, грунта и затирки, рекомендуем проверенные материалы и организуем доставку.',
  'Plytelių Klojimas Pabradėje': 'Укладка плитки в Пабраде',
  'Kokybiškos ir patikimos plytelių klijavimo paslaugos Pabradės mieste ir apylinkėse. Meistras Vladislav Finažonok.': 'Качественная и надёжная укладка плитки в Пабраде и окрестностях. Мастер Владислав Финажонок.',
  'Paslaugos Pabradėje': 'Услуги в Пабраде',
  'Vonios Kambariai Pabradėje': 'Ванные комнаты в Пабраде',
  'Pilna vonios kambario apdaila, plytelių klijavimas, kampų pjovimas 45° kampu, hidroizoliacija.': 'Полная отделка ванной, укладка плитки, запил углов 45° и гидроизоляция.',
  'Virtuvės Sienelės ir Grindys': 'Кухонные стены и полы',
  'Virtuvės prijuosčių klijavimas, raštų derinimas ir pedantiškas siūlių glaistymas.': 'Укладка кухонного фартука, совмещение рисунка и аккуратная затирка.',
  'Didelio Formato Plytelės': 'Крупноформатная плитка',
  'Akmens masės didelių matmenų plytelių klojimas svetainėse, holuose ir terasose.': 'Укладка крупноформатного керамогранита в гостиных, холлах и на террасах.',
  'Plytelių Klojimas Švenčionyse ir Rajone': 'Укладка плитки в Швенчёнисе и районе',
  'Profesionalūs apdailos darbai Švenčionyse, Švenčionėliuose ir aplinkiniuose kaimuose.': 'Профессиональная отделка в Швенчёнисе, Швенчёнеляе и близлежащих населённых пунктах.',
  'Apdailos Paslaugos Švenčionių Rajone': 'Отделочные услуги в Швенчёнском районе',
  'Vonios ir Dušo Zonos': 'Ванные и душевые зоны',
  'Vidinių paviršių hidroizoliacija, nuolydžių formavimas ir plytelių suleidimas 45 laipsnių kampu.': 'Гидроизоляция, формирование уклонов и запил плитки под 45°.',
  'Fasadai ir Klinkeris': 'Фасады и клинкер',
  'Cokolio, tvorų bei fasadų klijavimas klinkerio plytelėmis.': 'Облицовка цоколей, заборов и фасадов клинкерной плиткой.',
  'Grindų Plytelių Klojimas': 'Укладка напольной плитки',
  'Skirtingų gabaritų akmens masės ir keraminių plytelių klojimas.': 'Укладка керамогранита и керамической плитки разных форматов.',
  'Plytelių Klojimas Vilniuje ir Rajone': 'Укладка плитки в Вильнюсе и районе',
  'Pagal galimybes ir grafiką priimame užsakymus Vilniuje ir Vilniaus rajone.': 'В зависимости от графика принимаем заказы в Вильнюсе и Вильнюсском районе.',
};

const ATTRIBUTE_TRANSLATIONS = {
  pl: {
    'Atidaryti meniu': 'Otwórz menu',
    'Nurodykite miestą (Pabradė / Švenčionys / Vilnius) bei kokie darbai domina (pvz. vonios kambarys 7m²)...': 'Podaj miejscowość (Pabradė / Święciany / Wilno) i opisz planowane prace, np. łazienka 7 m²...',
    'Didelio formato akmens masės plytelių klojimas vonios kambaryje Pabradėje - Meistras Vladislav': 'Układanie wielkoformatowego gresu w łazience w Pabradė – fachowiec Vladislav',
    'Pilna vonios kambario apdaila su 45 laipsnių kampų suleidimu Švenčionyse': 'Kompleksowe wykończenie łazienki z narożnikami 45° w Święcianach',
    'Virtuvės prijuostės akmens masės plytelių klijavimas Vilniuje': 'Układanie gresu na ścianie kuchennej w Wilnie',
    'Didelių matmenų grindų plytelių klojimas svetainėje Pabradėje': 'Układanie wielkoformatowych płytek podłogowych w salonie w Pabradė',
    'Namo fasado ir cokolio klijavimas klinkerio plytelėmis Švenčionių rajone': 'Okładzina elewacji i cokołu płytkami klinkierowymi w rejonie święciańskim',
    'Lauko terasos akmens masės plytelių klojimas su hidroizoliacija': 'Układanie gresu na tarasie z hydroizolacją',
  },
  ru: {
    'Atidaryti meniu': 'Открыть меню',
    'Nurodykite miestą (Pabradė / Švenčionys / Vilnius) bei kokie darbai domina (pvz. vonios kambarys 7m²)...': 'Укажите город (Пабраде / Швенчёнис / Вильнюс) и опишите работы, например ванная 7 м²...',
    'Didelio formato akmens masės plytelių klojimas vonios kambaryje Pabradėje - Meistras Vladislav': 'Укладка крупноформатного керамогранита в ванной в Пабраде — мастер Владислав',
    'Pilna vonios kambario apdaila su 45 laipsnių kampų suleidimu Švenčionyse': 'Полная отделка ванной с запилом углов 45° в Швенчёнисе',
    'Virtuvės prijuostės akmens masės plytelių klijavimas Vilniuje': 'Укладка керамогранита на кухонный фартук в Вильнюсе',
    'Didelių matmenų grindų plytelių klojimas svetainėje Pabradėje': 'Укладка крупноформатной напольной плитки в гостиной в Пабраде',
    'Namo fasado ir cokolio klijavimas klinkerio plytelėmis Švenčionių rajone': 'Облицовка фасада и цоколя клинкерной плиткой в Швенчёнском районе',
    'Lauko terasos akmens masės plytelių klojimas su hidroizoliacija': 'Укладка керамогранита на террасе с гидроизоляцией',
  },
};

const PRIVACY_CONTENT = {
  pl: `
    <section class="legal-page"><div class="container legal-content">
      <p class="badge">Ochrona danych</p><h1>Polityka prywatności</h1>
      <p class="legal-updated">Ostatnia aktualizacja: 14 sierpnia 2026 r.</p>
      <h2>1. Administrator danych</h2><p>Administratorem danych przekazywanych przez stronę Situacija.eu jest wykonawca usług wykończeniowych Vladislav Finažonok. Kontakt: <a href="mailto:v.finazonok@gmail.com">v.finazonok@gmail.com</a>, tel. <a href="tel:+37060030288">+370 600 30288</a>.</p>
      <h2>2. Jakie dane zbieramy</h2><p>Formularz kontaktowy może zbierać imię, numer telefonu, miejscowość i opis planowanych prac. Dane podajesz dobrowolnie, ale bez imienia i telefonu nie możemy odpowiedzieć na zapytanie.</p>
      <h2>3. Cel i podstawa przetwarzania</h2><p>Dane wykorzystujemy wyłącznie do odpowiedzi na zapytanie, przygotowania wyceny i uzgodnienia usług. Podstawą jest podjęcie działań na Twoje żądanie przed zawarciem umowy oraz prawnie uzasadniony interes polegający na obsłudze zapytań.</p>
      <h2>4. Czas przechowywania</h2><p>Zapytania przechowujemy tylko tak długo, jak jest to potrzebne do kontaktu, realizacji usługi oraz spełnienia obowiązków prawnych. Niepotrzebne zapytania są usuwane.</p>
      <h2>5. Google Analytics i pliki cookies</h2><p>Google Analytics uruchamia się dopiero po wybraniu opcji „Zezwól na analitykę”. Pomaga nam zrozumieć ogólne korzystanie ze strony. Możesz odmówić bez utraty dostępu do serwisu. Zgodę można zmienić przez usunięcie danych witryny lub cookies w ustawieniach przeglądarki.</p>
      <h2>6. Odbiorcy i przekazywanie danych</h2><p>Dane mogą być przetwarzane przez dostawcę hostingu oraz, po wyrażeniu zgody na analitykę, przez Google. Nie sprzedajemy danych i nie wykorzystujemy ich do niezamówionego marketingu.</p>
      <h2>7. Twoje prawa</h2><p>Możesz poprosić o dostęp, poprawienie, usunięcie lub ograniczenie przetwarzania danych, a także wnieść sprzeciw. Napisz na podany adres e-mail. Masz również prawo złożyć skargę do właściwego organu ochrony danych.</p>
      <h2>8. Bezpieczeństwo i zmiany</h2><p>Stosujemy HTTPS, ograniczony dostęp do panelu administracyjnego i techniczne zabezpieczenia serwera. Polityka może być aktualizowana po zmianie funkcji strony lub przepisów; aktualna wersja zawsze znajduje się pod tym adresem.</p>
    </div></section>`,
  ru: `
    <section class="legal-page"><div class="container legal-content">
      <p class="badge">Защита данных</p><h1>Политика конфиденциальности</h1>
      <p class="legal-updated">Последнее обновление: 14 августа 2026 г.</p>
      <h2>1. Оператор данных</h2><p>Оператором данных, передаваемых через сайт Situacija.eu, является мастер отделочных работ Vladislav Finažonok. Контакты: <a href="mailto:v.finazonok@gmail.com">v.finazonok@gmail.com</a>, тел. <a href="tel:+37060030288">+370 600 30288</a>.</p>
      <h2>2. Какие данные мы собираем</h2><p>Контактная форма может собирать имя, номер телефона, город и описание планируемых работ. Данные предоставляются добровольно, однако без имени и телефона мы не сможем ответить на запрос.</p>
      <h2>3. Цель и основание обработки</h2><p>Данные используются только для ответа, подготовки сметы и согласования услуг. Основанием является выполнение действий по вашему запросу до заключения договора и законный интерес по обработке обращений.</p>
      <h2>4. Срок хранения</h2><p>Обращения хранятся только столько, сколько необходимо для связи, выполнения услуги и соблюдения юридических обязанностей. Ненужные обращения удаляются.</p>
      <h2>5. Google Analytics и cookies</h2><p>Google Analytics включается только после выбора «Разрешить аналитику». Сервис помогает понять общее использование сайта. Отказ не ограничивает доступ к сайту. Согласие можно изменить, удалив данные сайта или cookies в настройках браузера.</p>
      <h2>6. Получатели данных</h2><p>Данные могут обрабатываться поставщиком хостинга и, при согласии на аналитику, компанией Google. Мы не продаём данные и не используем их для нежелательной рекламы.</p>
      <h2>7. Ваши права</h2><p>Вы можете запросить доступ, исправление, удаление или ограничение обработки данных, а также возразить против обработки. Напишите на указанный e-mail. Вы также можете обратиться с жалобой в компетентный орган по защите данных.</p>
      <h2>8. Безопасность и изменения</h2><p>Мы используем HTTPS, ограниченный доступ к панели и технические меры защиты сервера. Политика может обновляться при изменении функций сайта или законодательства; актуальная версия всегда доступна по этому адресу.</p>
    </div></section>`,
};

function routeFor(pageKey, locale) {
  return PAGE_GROUPS[pageKey][locale];
}

function resolveRoute(pathname) {
  if (pathname === '/index.html') return ROUTES.get('/');
  return ROUTES.get(pathname) || null;
}

function languageAlternates(pageKey) {
  return Object.fromEntries(Object.keys(LOCALES).map((locale) => [locale, `${SITE_URL}${routeFor(pageKey, locale)}`]));
}

function translateTextNodes($, locale) {
  const dictionary = locale === 'pl' ? PL : RU;
  $('body *').contents().each((_, node) => {
    if (node.type !== 'text' || ['script', 'style'].includes(node.parent?.name)) return;
    const trimmed = node.data.trim();
    if (!trimmed) return;
    if (dictionary[trimmed]) {
      node.data = node.data.replace(trimmed, dictionary[trimmed]);
      return;
    }
    const numbered = trimmed.match(/^(\d+\.\s*)(.+)$/);
    if (numbered && dictionary[numbered[2]]) {
      node.data = node.data.replace(trimmed, `${numbered[1]}${dictionary[numbered[2]]}`);
    }
  });

  const attributes = ATTRIBUTE_TRANSLATIONS[locale];
  $('[placeholder], [aria-label], img[alt]').each((_, element) => {
    for (const attribute of ['placeholder', 'aria-label', 'alt']) {
      const value = $(element).attr(attribute);
      if (!value) continue;
      if (attributes[value]) $(element).attr(attribute, attributes[value]);
      else if (dictionary[value]) $(element).attr(attribute, dictionary[value]);
    }
  });
}

function localizeLinks($, locale) {
  const replacements = {
    'index.html': routeFor('home', locale),
    '/index.html': routeFor('home', locale),
    'gallery.html': routeFor('gallery', locale),
    '/gallery.html': routeFor('gallery', locale),
    'duk.html': routeFor('faq', locale),
    '/duk.html': routeFor('faq', locale),
    'plyteliu-klojimas-pabrade.html': routeFor('pabrade', locale),
    'plyteliu-klojimas-svencionys.html': routeFor('svencionys', locale),
    'plyteliu-klojimas-vilnius.html': routeFor('vilnius', locale),
    'privatumo-politika.html': routeFor('privacy', locale),
    '/privatumo-politika.html': routeFor('privacy', locale),
    'sitemap.xml': '/sitemap.xml',
    '/sitemap.xml': '/sitemap.xml',
    'vonios-kambario-plyteliu-klijavimas.html': '/vonios-kambario-plyteliu-klijavimas.html',
    'virtuves-plyteliu-klijavimas.html': '/virtuves-plyteliu-klijavimas.html',
    'didelio-formato-plyteliu-klojimas.html': '/didelio-formato-plyteliu-klojimas.html',
    'klinkerio-klijavimas-fasadai.html': '/klinkerio-klijavimas-fasadai.html',
    'kriaukles-is-plyteliu.html': '/kriaukles-is-plyteliu.html',
  };

  $('a[href]').each((_, element) => {
    if ($(element).closest('.language-switcher').length) return;
    const href = $(element).attr('href');
    if (!href || /^(?:https?:|tel:|mailto:|#)/.test(href)) return;
    const [pathPart, hash] = href.split('#');
    if (replacements[pathPart]) $(element).attr('href', `${replacements[pathPart]}${hash ? `#${hash}` : ''}`);
  });

  $('a[href^="index.html#"]').each((_, element) => {
    const hash = $(element).attr('href').split('#')[1];
    $(element).attr('href', `${routeFor('home', locale)}#${hash}`);
  });
}

function ensureNavigation($, route) {
  const locale = route.locale;
  const labels = locale === 'pl'
    ? ['Usługi', 'O fachowcu', 'Obsługiwany obszar', 'Galeria prac', 'FAQ', 'Kontakt']
    : locale === 'ru'
      ? ['Услуги', 'О мастере', 'Районы работы', 'Галерея работ', 'Вопросы', 'Контакты']
      : ['Paslaugos', 'Apie Meistrą', 'Veiklos Regionai', 'Darbų Galerija', 'D.U.K.', 'Kontaktai'];
  const home = routeFor('home', locale);
  const links = [
    [`${home}#services`, labels[0]],
    [`${home}#about`, labels[1]],
    [`${home}#regions`, labels[2]],
    [routeFor('gallery', locale), labels[3]],
    [routeFor('faq', locale), labels[4]],
    [`${home}#contact`, labels[5]],
  ];
  const list = links.map(([href, label]) => `<li><a href="${href}">${label}</a></li>`).join('');
  const nav = $('header .header-content nav').first();
  if (nav.length) nav.addClass('desktop-nav').attr('aria-label', labels[5]).html(`<ul>${list}</ul>`);
  else $('header .header-content .logo').after(`<nav class="desktop-nav" aria-label="${labels[5]}"><ul>${list}</ul></nav>`);

  if (!$('#burgerBtn').length) {
    $('header .header-content').append('<button class="burger-btn" id="burgerBtn" aria-label="Atidaryti meniu"><span></span><span></span><span></span></button>');
  }
  if (!$('#mobileNavPanel').length) $('header .header-content').after('<div class="mobile-nav-panel" id="mobileNavPanel"></div>');
  $('#mobileNavPanel').html(`<ul>${list}</ul>`);

  $('.language-switcher').remove();
  const languageLabel = locale === 'pl' ? 'Wybór języka' : locale === 'ru' ? 'Выбор языка' : 'Kalbos pasirinkimas';
  const switcher = Object.keys(LOCALES).map((lang) => {
    const active = lang === locale ? ' class="active" aria-current="page"' : '';
    return `<a href="${routeFor(route.pageKey, lang)}" hreflang="${lang}" lang="${lang}"${active}>${LOCALES[lang].label}</a>`;
  }).join('');
  $('header .header-content .nav-btn').before(`<nav class="language-switcher" aria-label="${languageLabel}">${switcher}</nav>`);
  if (!$('.language-switcher').length) $('header .header-content').append(`<nav class="language-switcher" aria-label="${languageLabel}">${switcher}</nav>`);
}

function absolutizeAssets($) {
  $('link[rel="stylesheet"]').each((_, element) => {
    const href = $(element).attr('href');
    if (href && !/^(?:https?:|\/)/.test(href)) $(element).attr('href', `/${href.replace(/^\.\.\//, '')}`);
  });
  $('script[src], img[src]').each((_, element) => {
    const src = $(element).attr('src');
    if (src && !/^(?:https?:|\/|data:)/.test(src)) $(element).attr('src', `/${src.replace(/^\.\.\//, '')}`);
  });
}

function localizeHtml(rawHtml, route) {
  const $ = cheerio.load(rawHtml, { decodeEntities: false });
  const locale = route.locale;
  const config = LOCALES[locale];
  const meta = locale === 'lt' ? null : META[locale][route.pageKey];

  $('html').attr('lang', config.htmlLang);
  ensureNavigation($, route);
  if (route.pageKey === 'privacy' && locale !== 'lt') $('main').html(PRIVACY_CONTENT[locale]);
  if (locale !== 'lt') {
    translateTextNodes($, locale);
    localizeLinks($, locale);
    $('#blog').remove();
    $('a[href="blogas.html"], a[href^="blogas/"]').closest('li').remove();
    $('script[type="application/ld+json"]').remove();
  }
  absolutizeAssets($);

  if (!$('script[src="/script.js"]').length && !$('script[src$="script.js"]').length) $('body').append('<script src="/script.js"></script>');
  if (meta) {
    $('title').text(meta.title);
    $('meta[name="description"]').attr('content', meta.description);
  }
  $('link[rel="canonical"]').remove();
  $('link[rel="alternate"][hreflang]').remove();
  $('head').append(`<link rel="canonical" href="${SITE_URL}${route.pathname}">`);
  for (const [lang, href] of Object.entries(languageAlternates(route.pageKey))) {
    $('head').append(`<link rel="alternate" hreflang="${lang}" href="${href}">`);
  }
  $('head').append(`<link rel="alternate" hreflang="x-default" href="${SITE_URL}${routeFor(route.pageKey, 'lt')}">`);

  return {
    html: $.html(),
    metadata: meta,
    alternates: languageAlternates(route.pageKey),
    config,
  };
}

function translateGalleryTitle(title, locale) {
  if (locale === 'lt') return title;
  const replacements = locale === 'pl' ? {
    'Virtuvės ir grindų plytelių klijavimas': 'Układanie płytek w kuchni i na podłodze',
    'Didelio formato plytelių klojimas': 'Układanie płytek wielkoformatowych',
    'Dušo zonos hidroizoliacija ir plytelių apdaila': 'Hydroizolacja i płytki w strefie prysznica',
    'Vonios kambario plytelių klojimas Pabradėje': 'Układanie płytek w łazience w Pabradė',
    'Klinkerio ir plytelių apdailos darbai': 'Wykończenie klinkierem i płytkami',
    'Plytelių apdaila Švenčionių rajone': 'Wykończenie płytkami w rejonie święciańskim',
  } : {
    'Virtuvės ir grindų plytelių klijavimas': 'Укладка плитки на кухне и полу',
    'Didelio formato plytelių klojimas': 'Укладка крупноформатной плитки',
    'Dušo zonos hidroizoliacija ir plytelių apdaila': 'Гидроизоляция и плитка в душевой',
    'Vonios kambario plytelių klojimas Pabradėje': 'Укладка плитки в ванной в Пабраде',
    'Klinkerio ir plytelių apdailos darbai': 'Отделка клинкером и плиткой',
    'Plytelių apdaila Švenčionių rajone': 'Плиточная отделка в Швенчёнском районе',
  };
  let translated = title;
  for (const [from, to] of Object.entries(replacements)) translated = translated.replace(from, to);
  return translated;
}

module.exports = {
  LOCALES,
  PAGE_GROUPS,
  resolveRoute,
  routeFor,
  localizeHtml,
  languageAlternates,
  translateGalleryTitle,
};
