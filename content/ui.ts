import type { Locale } from './types';

/**
 * Sąsajos (chrome) eilutės. PL/RU reikšmės paimtos iš jau publikuoto
 * public/i18n.js žodyno ten, kur jos egzistavo — kad tekstas nesikeistų.
 */
export interface UiStrings {
  skipToContent: string;
  openMenu: string;
  closeMenu: string;
  languageLabel: string;
  nav: {
    services: string;
    about: string;
    regions: string;
    gallery: string;
    faq: string;
    blog: string;
    contact: string;
  };
  cta: {
    call: string;
    viewGallery: string;
    freeQuote: string;
    readMoreService: string;
    fullFaq: string;
    allArticles: string;
    readArticle: string;
    allPhotos: string;
    backHome: string;
  };
  form: {
    title: string;
    name: string;
    namePlaceholder: string;
    phone: string;
    phonePlaceholder: string;
    message: string;
    messagePlaceholder: string;
    submit: string;
    sending: string;
    success: string;
    error: string;
    consent: string;
  };
  contact: {
    master: string;
    email: string;
    phone: string;
  };
  map: {
    heading: string;
    intro: string;
    primaryLegend: string;
    secondaryLegend: string;
    attribution: string;
    listHeading: string;
  };
  gallery: {
    filterAll: string;
    open: string;
    close: string;
    prev: string;
    next: string;
    counter: string;
  };
  cookie: {
    text: string;
    accept: string;
    decline: string;
    policy: string;
  };
  footer: {
    rights: string;
    privacy: string;
    sitemap: string;
    navHeading: string;
    servicesHeading: string;
    contactHeading: string;
  };
  breadcrumb: {
    home: string;
  };
  notFound: {
    title: string;
    text: string;
  };
}

export const UI: Record<Locale, UiStrings> = {
  lt: {
    skipToContent: 'Pereiti prie turinio',
    openMenu: 'Atidaryti meniu',
    closeMenu: 'Uždaryti meniu',
    languageLabel: 'Kalba',
    nav: {
      services: 'Paslaugos',
      about: 'Apie Meistrą',
      regions: 'Veiklos Regionai',
      gallery: 'Darbų Galerija',
      faq: 'D.U.K.',
      blog: 'Blogas',
      contact: 'Kontaktai',
    },
    cta: {
      call: 'Skambinti',
      viewGallery: 'Žiūrėti Darbų Galeriją',
      freeQuote: 'Gauti Nemokamą Sąmatą',
      readMoreService: 'Plačiau apie paslaugą',
      fullFaq: 'Skaityti Pilną D.U.K. Puslapį',
      allArticles: 'Visi Meistro Straipsniai ir Patarimai',
      readArticle: 'Skaityti straipsnį',
      allPhotos: 'Žiūrėti Visas 40+ Darbų Nuotraukas',
      backHome: 'Grįžti į pradžią',
    },
    form: {
      title: 'Gauti Nemokamą Sąmatą',
      name: 'Jūsų Vardas *',
      namePlaceholder: 'Vardas',
      phone: 'Telefonas *',
      phonePlaceholder: '+370 600 00000',
      message: 'Miestas ir Darbų Aprašymas',
      messagePlaceholder:
        'Nurodykite miestą (Pabradė / Švenčionys / Vilnius) bei kokie darbai domina (pvz. vonios kambarys 7m²)...',
      submit: 'Siųsti Užklausą Meistrui',
      sending: 'Siunčiama…',
      success: 'Ačiū! Užklausa gauta — meistras susisieks artimiausiu metu.',
      error: 'Nepavyko išsiųsti. Paskambinkite tel. +370 600 30288.',
      consent: 'Siųsdami užklausą sutinkate su privatumo politika.',
    },
    contact: { master: 'Meistras:', email: 'El. paštas:', phone: 'Telefonas:' },
    map: {
      heading: 'Veiklos teritorija žemėlapyje',
      intro:
        'Žemėlapyje pažymėtos vietovės, kuriose atliekami plytelių klojimo ir apdailos darbai.',
      primaryLegend: 'Pagrindinė veiklos zona',
      secondaryLegend: 'Pagal susitarimą',
      attribution: 'Žemėlapio duomenys',
      listHeading: 'Aptarnaujamos vietovės',
    },
    gallery: {
      filterAll: 'Visi darbai',
      open: 'Padidinti nuotrauką',
      close: 'Uždaryti',
      prev: 'Ankstesnė nuotrauka',
      next: 'Kita nuotrauka',
      counter: 'Nuotrauka',
    },
    cookie: {
      text: 'Naudojame slapukus svetainės analitikai. Analitika įjungiama tik jums sutikus.',
      accept: 'Leisti analitiką',
      decline: 'Atmesti',
      policy: 'Privatumo politika',
    },
    footer: {
      rights: 'Visos teisės saugomos.',
      privacy: 'Privatumo politika',
      sitemap: 'Svetainės žemėlapis',
      navHeading: 'Navigacija',
      servicesHeading: 'Paslaugos',
      contactHeading: 'Kontaktai',
    },
    breadcrumb: { home: 'Pradžia' },
    notFound: {
      title: 'Puslapis nerastas',
      text: 'Tokio puslapio nėra arba jis buvo perkeltas. Grįžkite į pradžią arba skambinkite meistrui.',
    },
  },

  pl: {
    skipToContent: 'Przejdź do treści',
    openMenu: 'Otwórz menu',
    closeMenu: 'Zamknij menu',
    languageLabel: 'Język',
    nav: {
      services: 'Usługi',
      about: 'O fachowcu',
      regions: 'Obsługiwany obszar',
      gallery: 'Galeria prac',
      faq: 'FAQ',
      blog: 'Blog',
      contact: 'Kontakt',
    },
    cta: {
      call: 'Zadzwoń',
      viewGallery: 'Zobacz galerię prac',
      freeQuote: 'Otrzymaj bezpłatną wycenę',
      readMoreService: 'Więcej o usłudze',
      fullFaq: 'Zobacz wszystkie pytania',
      allArticles: 'Wszystkie porady fachowca',
      readArticle: 'Przeczytaj artykuł',
      allPhotos: 'Zobacz wszystkie zdjęcia prac',
      backHome: 'Wróć na stronę główną',
    },
    form: {
      title: 'Otrzymaj bezpłatną wycenę',
      name: 'Imię *',
      namePlaceholder: 'Imię',
      phone: 'Telefon *',
      phonePlaceholder: '+370 600 00000',
      message: 'Miejscowość i opis prac',
      messagePlaceholder:
        'Podaj miejscowość (Pabradė / Święciany / Wilno) i opisz planowane prace, np. łazienka 7 m²...',
      submit: 'Wyślij zapytanie',
      sending: 'Wysyłanie…',
      success: 'Dziękujemy! Zapytanie zostało wysłane — fachowiec wkrótce się skontaktuje.',
      error: 'Nie udało się wysłać. Zadzwoń: +370 600 30288.',
      consent: 'Wysyłając zapytanie, akceptujesz politykę prywatności.',
    },
    contact: { master: 'Fachowiec:', email: 'E-mail:', phone: 'Telefon:' },
    map: {
      heading: 'Obszar działania na mapie',
      intro: 'Na mapie zaznaczono miejscowości, w których wykonywane są prace glazurnicze.',
      primaryLegend: 'Główny obszar działania',
      secondaryLegend: 'Po uzgodnieniu',
      attribution: 'Dane mapy',
      listHeading: 'Obsługiwane miejscowości',
    },
    gallery: {
      filterAll: 'Wszystkie prace',
      open: 'Powiększ zdjęcie',
      close: 'Zamknij',
      prev: 'Poprzednie zdjęcie',
      next: 'Następne zdjęcie',
      counter: 'Zdjęcie',
    },
    cookie: {
      text: 'Używamy plików cookies do analityki. Analityka włącza się dopiero po Twojej zgodzie.',
      accept: 'Zezwól na analitykę',
      decline: 'Odrzuć',
      policy: 'Polityka prywatności',
    },
    footer: {
      rights: 'Wszelkie prawa zastrzeżone.',
      privacy: 'Polityka prywatności',
      sitemap: 'Mapa strony',
      navHeading: 'Nawigacja',
      servicesHeading: 'Usługi',
      contactHeading: 'Kontakt',
    },
    breadcrumb: { home: 'Strona główna' },
    notFound: {
      title: 'Nie znaleziono strony',
      text: 'Taka strona nie istnieje lub została przeniesiona. Wróć na stronę główną albo zadzwoń.',
    },
  },

  ru: {
    skipToContent: 'Перейти к содержимому',
    openMenu: 'Открыть меню',
    closeMenu: 'Закрыть меню',
    languageLabel: 'Язык',
    nav: {
      services: 'Услуги',
      about: 'О мастере',
      regions: 'Районы работы',
      gallery: 'Галерея работ',
      faq: 'Вопросы',
      blog: 'Блог',
      contact: 'Контакты',
    },
    cta: {
      call: 'Позвонить',
      viewGallery: 'Смотреть галерею работ',
      freeQuote: 'Получить бесплатную смету',
      readMoreService: 'Подробнее об услуге',
      fullFaq: 'Смотреть все вопросы',
      allArticles: 'Все советы мастера',
      readArticle: 'Читать статью',
      allPhotos: 'Смотреть все фото работ',
      backHome: 'Вернуться на главную',
    },
    form: {
      title: 'Получить бесплатную смету',
      name: 'Ваше имя *',
      namePlaceholder: 'Имя',
      phone: 'Телефон *',
      phonePlaceholder: '+370 600 00000',
      message: 'Город и описание работ',
      messagePlaceholder:
        'Укажите город (Пабраде / Швенчёнис / Вильнюс) и опишите работы, например ванная 7 м²...',
      submit: 'Отправить заявку',
      sending: 'Отправка…',
      success: 'Спасибо! Заявка получена — мастер свяжется с вами в ближайшее время.',
      error: 'Не удалось отправить. Позвоните: +370 600 30288.',
      consent: 'Отправляя заявку, вы соглашаетесь с политикой конфиденциальности.',
    },
    contact: { master: 'Мастер:', email: 'Эл. почта:', phone: 'Телефон:' },
    map: {
      heading: 'Районы работы на карте',
      intro: 'На карте отмечены населённые пункты, где выполняются работы по укладке плитки.',
      primaryLegend: 'Основная зона работы',
      secondaryLegend: 'По договорённости',
      attribution: 'Данные карты',
      listHeading: 'Обслуживаемые населённые пункты',
    },
    gallery: {
      filterAll: 'Все работы',
      open: 'Увеличить фото',
      close: 'Закрыть',
      prev: 'Предыдущее фото',
      next: 'Следующее фото',
      counter: 'Фото',
    },
    cookie: {
      text: 'Мы используем cookies для аналитики. Аналитика включается только с вашего согласия.',
      accept: 'Разрешить аналитику',
      decline: 'Отклонить',
      policy: 'Политика конфиденциальности',
    },
    footer: {
      rights: 'Все права защищены.',
      privacy: 'Политика конфиденциальности',
      sitemap: 'Карта сайта',
      navHeading: 'Навигация',
      servicesHeading: 'Услуги',
      contactHeading: 'Контакты',
    },
    breadcrumb: { home: 'Главная' },
    notFound: {
      title: 'Страница не найдена',
      text: 'Такой страницы нет или она была перенесена. Вернитесь на главную или позвоните мастеру.',
    },
  },
};

export function getUi(locale: Locale): UiStrings {
  return UI[locale];
}
