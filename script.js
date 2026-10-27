/* ==========================================================================
   LP Europejskie — landing page behaviour
   · EN / PL language switch (English is the source text in the HTML)
   · EUR / PLN price conversion (live NBP rate, with a fallback)
   · Search tabs + chips, mobile menu, valuation sheet, scroll reveal
   No dependencies.
   ========================================================================== */
(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const store = {
    get(key) { try { return localStorage.getItem(key); } catch { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch { /* storage unavailable */ } },
  };
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

  /* ── Config ─────────────────────────────────────────────────────────────── */
  const FALLBACK_RATE = 4.41;          // EUR → PLN, indicative (27 Oct 2026). Used if the live rate can't be fetched.
  const RATE_TTL = 12 * 60 * 60 * 1000; // re-check the live rate every 12 hours
  const PRICE_RANGES = {               // search filter ranges, in EUR
    buy:  [[0, 500000], [500000, 1000000], [1000000, 2000000], [2000000, null]],
    rent: [[0, 1500], [1500, 3000], [3000, 6000], [6000, null]],              // per month
  };

  /* ── Polish copy (keys match data-i18n attributes in index.html) ────────── */
  const PL = {
    'skip': 'Przejdź do treści',
    'cities': 'Warszawa · Kraków · Gdańsk · Algarve · Douro',
    'valuation': 'Wycena nieruchomości',
    'aria.lang': 'Język', 'aria.currency': 'Waluta', 'aria.primary': 'Nawigacja główna', 'aria.menu': 'Menu',
    'aria.finder': 'Wyszukiwarka nieruchomości', 'aria.mode': 'Tryb wyszukiwania', 'aria.type': 'Typ nieruchomości',
    'aria.legal': 'Informacje prawne', 'aria.close': 'Zamknij',

    'nav.buy': 'Kup', 'nav.sell': 'Sprzedaj', 'nav.developments': 'Inwestycje', 'nav.destinations': 'Kierunki',
    'nav.about': 'O nas', 'nav.contact': 'Kontakt', 'cta.sell': 'Sprzedaj z nami',

    'hero.eyebrow': 'Luksusowe nieruchomości · Polska i Europa',
    'hero.title': 'Wyjątkowe nieruchomości.<br><em>Europejska perspektywa.</em>',
    'hero.lede': 'Butikowa firma łącząca międzynarodowych inwestorów z wyjątkowymi domami i aktywami o trwałej wartości w Polsce i Portugalii.',
    'hero.cta1': 'Poznaj nieruchomości', 'hero.cta2': 'Nowe inwestycje', 'hero.alt': 'Panorama Warszawy o zachodzie słońca',

    'tab.buy': 'Kup', 'tab.rent': 'Wynajmij', 'finder.dev': 'Zobacz inwestycje →',
    'type.apartments': 'Apartamenty', 'type.houses': 'Domy', 'type.penthouses': 'Penthousy', 'type.villas': 'Wille golfowe', 'type.land': 'Działki',
    'f.location': 'Lokalizacja', 'f.bedrooms': 'Sypialnie', 'f.price': 'Cena', 'f.search': 'Szukaj',
    'loc.all': 'Wszystkie rynki', 'loc.warsaw': 'Warszawa', 'loc.krakow': 'Kraków', 'loc.gdansk': 'Gdańsk i Sopot',
    'loc.wroclaw': 'Wrocław', 'loc.algarve': 'Algarve', 'loc.douro': 'Dolina Douro', 'beds.any': 'Dowolnie',

    'feat.eyebrow': 'Wyróżnione nieruchomości', 'feat.title': 'Wybrane przez naszych doradców',
    'feat.all': 'Zobacz wszystkie nieruchomości', 'feat.note': 'Przykładowe oferty do podglądu projektu',
    'p1.meta': 'Willa · Algarve, Vilamoura', 'p1.title': 'Willa przy polu golfowym, blisko wybrzeża',
    'p1.alt': 'Biała willa z basenem przy polu golfowym w Vilamourze, Algarve',
    'p2.meta': 'Rezydencja · Algarve, Estoi', 'p2.title': 'Rezydencja z reprezentacyjnymi ogrodami',
    'p2.alt': 'Rezydencja ze strzyżonymi żywopłotami i formalnymi ogrodami w Estoi, Algarve',
    'p3.meta': 'Quinta · Douro, Pinhão', 'p3.title': 'Quinta na wzgórzu nad rzeką',
    'p3.alt': 'Duża biała quinta na zboczu w dolinie Douro',
    'p4.meta': 'Winnica · Douro, Peso da Régua', 'p4.title': 'Winnica wśród tarasów',
    'p4.alt': 'Tarasowe winnice w dolinie Douro pod błękitnym niebem',
    'p5.meta': 'Willa · Porto, Serralves', 'p5.title': 'Willa Art Déco z basenem w ogrodzie',
    'p5.alt': 'Willa w stylu Art Déco z basenem, Porto',
    'p6.meta': 'Dom · Douro, Lamego', 'p6.title': 'Dom na wzgórzu z widokiem na rzekę',
    'p6.alt': 'Dom na zielonym wzgórzu nad rzeką Douro',

    'dev.eyebrow': 'Nowe inwestycje', 'dev.title': 'Wartość długoterminowa, zbudowana na lata',
    'dev.all': 'Wszystkie inwestycje', 'dev.from': 'Od',
    'd1.region': 'Warszawa', 'd1.alt': 'Pałac Kultury i Nauki górujący nad centrum Warszawy',
    'd2.region': 'Algarve', 'd2.alt': 'Willa z basenem z widokiem na pole golfowe na Algarve',
    'd3.region': 'Gdańsk', 'd3.alt': 'Widok z lotu ptaka na domy nad wodą w Gdańsku',

    'dest.eyebrow': 'Kierunki', 'dest.title': 'Sześć rynków, jeden standard',
    'dest.lede': 'Od panoramy Warszawy po pola golfowe Algarve – każdy rynek obsługuje doradca, który tam mieszka i pracuje.',
    'dest.warsaw': 'Życie w stolicy, widoki na panoramę miasta, największy popyt inwestorów',
    'dest.krakow': 'Apartamenty w historycznym centrum i odrestaurowane kamienice',
    'dest.gdansk': 'Domy i rezydencje wakacyjne nad Bałtykiem',
    'dest.wroclaw': 'Miejski styl życia z designem, nad rzeką',
    'dest.algarve': 'Wille golfowe i rezydencje z widokiem na morze w Portugalii',
    'dest.douro': 'Winnice i quinty z widokiem na rzekę w Portugalii',

    'priv.eyebrow': 'Prywatne poszukiwanie', 'priv.title': 'Nie możesz znaleźć odpowiedniej nieruchomości?',
    'priv.lede': 'Wiele naszych domów nigdy nie jest reklamowanych. Opisz, czego szukasz, a doradca odpowie w ciągu jednego dnia roboczego.',
    'priv.label': 'Czego szukasz?', 'priv.email': 'E-mail',
    'priv.note': 'Wysyłając to zapytanie, akceptujesz naszą politykę prywatności.', 'priv.send': 'Wyślij zapytanie',
    'form.thanks': 'Dziękujemy. Doradca skontaktuje się z Tobą w ciągu jednego dnia roboczego.',

    'about.eyebrow': 'O LP Europejskie',
    'about.title': 'Zaufany partner w zakresie nieruchomości premium i inwestycji w styl życia',
    'about.lede': 'Lokalna wiedza, globalna perspektywa i osobiste podejście – od pierwszej rozmowy po finalizację transakcji.',
    'about.alt': 'Złociste klify spotykające błękitne morze na wybrzeżu Algarve',
    'v1.name': 'Zaufanie', 'v1.desc': 'Długoterminowe relacje budują prawdziwą wartość.',
    'v2.name': 'Doskonałość', 'v2.desc': 'W każdym szczególe, od poszukiwań po finalizację.',
    'v3.name': 'Uczciwość', 'v3.desc': 'Przejrzyście, uczciwie, zawsze.',
    'v4.name': 'Globalna wizja', 'v4.desc': 'Łączymy rynki, tworzymy możliwości.',
    'v5.name': 'Zrównoważony rozwój', 'v5.desc': 'Inwestujemy w lepszą przyszłość.',

    'news.title': 'Nowe oferty, zanim staną się publiczne', 'news.note': 'Jedna wiadomość miesięcznie. Zrezygnuj w dowolnym momencie.',
    'news.label': 'Adres e-mail', 'news.ph': 'Twój adres e-mail', 'news.btn': 'Zapisz się', 'news.thanks': 'Dziękujemy za zapisanie się.',

    'foot.tagline': 'Wyjątkowe nieruchomości. Europejska perspektywa.', 'foot.contact': '[Adres] · [Telefon] · [E-mail]',
    'foot.dest': 'Kierunki', 'foot.gdansk': 'Gdańsk', 'foot.company': 'Firma', 'foot.about': 'O nas', 'foot.dev': 'Inwestycje',
    'foot.sell': 'Sprzedaj z nami', 'foot.careers': 'Kariera', 'foot.contact2': 'Kontakt', 'foot.follow': 'Obserwuj',
    'foot.terms': 'Regulamin', 'foot.privacy': 'Polityka prywatności', 'foot.cookies': 'Pliki cookie', 'foot.complaints': 'Reklamacje',

    'sheet.title': 'Zamów wycenę nieruchomości',
    'sheet.lede': 'Opisz swoją nieruchomość, a doradca odpowie w ciągu jednego dnia roboczego.',
    'sheet.address': 'Adres nieruchomości', 'sheet.phone': 'Telefon (opcjonalnie)', 'sheet.submit': 'Zamów wycenę',
  };

  /* ── State ──────────────────────────────────────────────────────────────── */
  const state = {
    lang: store.get('lp.lang') === 'pl' ? 'pl' : 'en',
    currency: store.get('lp.currency') === 'PLN' ? 'PLN' : 'EUR',
    rate: FALLBACK_RATE,
    live: false,
    mode: 'buy',
  };

  /* ── i18n ───────────────────────────────────────────────────────────────── */
  const EN = new Map(); // English source strings, captured from the HTML the first time we see them
  function pick(id, current, key) {
    if (!EN.has(id)) EN.set(id, current);
    return state.lang === 'pl' && PL[key] != null ? PL[key] : EN.get(id);
  }

  function applyLang() {
    document.documentElement.lang = state.lang;
    $$('[data-i18n]').forEach((el) => {
      const key = el.dataset.i18n;
      el.textContent = pick(`t:${key}`, el.textContent, key);
    });
    $$('[data-i18n-html]').forEach((el) => {
      const key = el.dataset.i18nHtml;
      el.innerHTML = pick(`h:${key}`, el.innerHTML, key); // strings come from this file only
    });
    ['alt', 'aria-label', 'placeholder'].forEach((attr) => {
      $$(`[data-i18n-${attr}]`).forEach((el) => {
        const key = el.getAttribute(`data-i18n-${attr}`);
        el.setAttribute(attr, pick(`a:${attr}:${key}`, el.getAttribute(attr) || '', key));
      });
    });
  }

  const pluralRules = new Intl.PluralRules('pl');
  function plPlural(n, [one, few, many]) {
    const c = pluralRules.select(n);
    return c === 'one' ? one : c === 'few' ? few : many;
  }

  function applySpecs() {
    const pl = state.lang === 'pl';
    $$('[data-beds]').forEach((el) => {
      const beds = Number(el.dataset.beds);
      const baths = Number(el.dataset.baths);
      const area = el.dataset.area;
      el.textContent = pl
        ? `${beds} ${plPlural(beds, ['sypialnia', 'sypialnie', 'sypialni'])} · ${baths} ${plPlural(baths, ['łazienka', 'łazienki', 'łazienek'])} · ${area} m²`
        : `${beds} ${beds === 1 ? 'bedroom' : 'bedrooms'} · ${baths} ${baths === 1 ? 'bathroom' : 'bathrooms'} · ${area} m²`;
    });
    $$('[data-bed-min]').forEach((el) => {
      const min = Number(el.dataset.bedMin);
      const max = Number(el.dataset.bedMax);
      const year = el.dataset.year;
      el.textContent = pl
        ? `${min}–${max} ${plPlural(max, ['sypialnia', 'sypialnie', 'sypialni'])} · Ukończenie ${year}`
        : `${min} – ${max} bedrooms · Completion ${year}`;
    });
  }

  /* ── Currency ───────────────────────────────────────────────────────────── */
  const nf = { en: new Intl.NumberFormat('en-GB'), pl: new Intl.NumberFormat('pl-PL') };

  function roundPln(value) {
    if (value >= 100000) return Math.round(value / 1000) * 1000;
    if (value >= 1000) return Math.round(value / 100) * 100;
    return Math.round(value / 10) * 10;
  }

  // nice = round to 2 significant digits (clean thresholds for the search filter, e.g. 2,200,000 zł)
  function money(eur, nice = false) {
    const pl = state.lang === 'pl';
    if (state.currency === 'PLN') {
      const raw = eur * state.rate;
      return `${(pl ? nf.pl : nf.en).format(nice ? Number(raw.toPrecision(2)) : roundPln(raw))} zł`;
    }
    return pl ? `${nf.pl.format(eur)} €` : `€${nf.en.format(eur)}`;
  }

  function buildPriceOptions() {
    const select = $('#f-price');
    if (!select) return;
    const pl = state.lang === 'pl';
    const keep = Math.max(select.selectedIndex, 0);
    const per = state.mode === 'rent' ? (pl ? ' / mies.' : ' / month') : '';
    const labels = [pl ? 'Dowolna cena' : 'Any price'];
    PRICE_RANGES[state.mode].forEach(([min, max]) => {
      if (min === 0) labels.push(`${pl ? 'Do' : 'Up to'} ${money(max, true)}${per}`);
      else if (max == null) labels.push(pl ? `Od ${money(min, true)}${per}` : `${money(min, true)}+${per}`);
      else labels.push(`${money(min, true)} – ${money(max, true)}${per}`);
    });
    select.replaceChildren(...labels.map((label, i) => new Option(label, i === 0 ? '' : String(i))));
    select.selectedIndex = keep;
  }

  function applyRateNote() {
    const el = $('[data-rate-note]');
    if (!el) return;
    const rate = new Intl.NumberFormat(state.lang === 'pl' ? 'pl-PL' : 'en-GB', {
      minimumFractionDigits: 4, maximumFractionDigits: 4,
    }).format(state.rate);
    el.textContent = state.lang === 'pl'
      ? `Ceny w PLN są orientacyjne i przeliczone po kursie 1 EUR = ${rate} PLN${state.live ? '' : ' (kurs przykładowy)'}.`
      : `Prices in PLN are indicative, converted at 1 EUR = ${rate} PLN${state.live ? '' : ' (sample rate)'}.`;
  }

  function applyMoney() {
    $$('[data-eur]').forEach((el) => { el.textContent = money(Number(el.dataset.eur)); });
    buildPriceOptions();
    applyRateNote();
  }

  async function loadRate() {
    const cached = store.get('lp.rate');
    if (cached) {
      try {
        const { v, t } = JSON.parse(cached);
        if (Date.now() - t < RATE_TTL && v > 2 && v < 8) { state.rate = v; state.live = true; return; }
      } catch { /* ignore bad cache */ }
    }
    const timeout = () => (AbortSignal.timeout ? { signal: AbortSignal.timeout(5000) } : {});
    const sources = [
      async () => (await (await fetch('https://api.nbp.pl/api/exchangerates/rates/a/eur/?format=json', timeout())).json()).rates[0].mid,
      async () => (await (await fetch('https://api.frankfurter.dev/v1/latest?base=EUR&symbols=PLN', timeout())).json()).rates.PLN,
    ];
    for (const source of sources) {
      try {
        const value = Number(await source());
        if (value > 2 && value < 8) {
          state.rate = value; state.live = true;
          store.set('lp.rate', JSON.stringify({ v: value, t: Date.now() }));
          return;
        }
      } catch { /* try the next source */ }
    }
  }

  /* ── Segmented switches (language, currency) ────────────────────────────── */
  function syncSeg(name, value) {
    const seg = $(`[data-seg="${name}"]`);
    if (!seg) return;
    $$('button', seg).forEach((button, i) => {
      const on = button.dataset.value === value;
      button.setAttribute('aria-pressed', String(on));
      if (on) seg.style.setProperty('--i', i);
    });
  }

  function setLang(lang) {
    state.lang = lang;
    store.set('lp.lang', lang);
    syncSeg('lang', lang);
    applyLang(); applySpecs(); applyMoney(); placeBar();
  }

  function setCurrency(currency) {
    state.currency = currency;
    store.set('lp.currency', currency);
    syncSeg('currency', currency);
    applyMoney();
  }

  $$('[data-seg] button').forEach((button) => {
    button.addEventListener('click', () => {
      const name = button.closest('[data-seg]').dataset.seg;
      if (name === 'lang') setLang(button.dataset.value);
      else setCurrency(button.dataset.value);
    });
  });

  /* ── Search panel: Buy/Rent tabs, type chips ────────────────────────────── */
  const tabs = $('[data-tabs]');

  function placeBar() {
    if (!tabs) return;
    const active = $('button[aria-pressed="true"]', tabs);
    if (!active) return;
    tabs.style.setProperty('--x', `${active.offsetLeft}px`);
    tabs.style.setProperty('--w', `${active.offsetWidth}px`);
  }

  if (tabs) {
    $$('button', tabs).forEach((button) => {
      button.addEventListener('click', () => {
        state.mode = button.dataset.mode;
        $$('button', tabs).forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
        placeBar();
        buildPriceOptions();
      });
    });
  }

  const chips = $('[data-chips]');
  if (chips) {
    $$('.chip', chips).forEach((chip) => {
      chip.addEventListener('click', () => {
        $$('.chip', chips).forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
      });
    });
  }

  const searchForm = $('[data-search]');
  if (searchForm) {
    searchForm.addEventListener('submit', (event) => {
      event.preventDefault(); // visual only for now: jump to the listings
      $('#featured').scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'start' });
    });
  }

  /* ── Header: scroll-edge effect ─────────────────────────────────────────── */
  const header = $('.site-header');
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      header.classList.toggle('is-scrolled', window.scrollY > 4);
      ticking = false;
    });
  }, { passive: true });

  /* ── Mobile menu (materialises from the button, same path back) ─────────── */
  const menuButton = $('.menu-toggle');
  const menu = $('#menu');
  let menuTimer;

  function setMenu(open) {
    clearTimeout(menuTimer);
    if (open) {
      menu.hidden = false;
      void menu.offsetWidth; // commit the starting style so the transition runs
      menu.classList.add('is-open');
    } else {
      menu.classList.remove('is-open');
      menuTimer = setTimeout(() => { if (!menu.classList.contains('is-open')) menu.hidden = true; }, reduceMotion.matches ? 0 : 340);
    }
    menuButton.setAttribute('aria-expanded', String(open));
  }

  menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', (event) => { if (event.target.closest('a')) setMenu(false); });
  document.addEventListener('click', (event) => {
    if (menuButton.getAttribute('aria-expanded') === 'true' && !event.target.closest('.site-header')) setMenu(false);
  });
  window.addEventListener('resize', () => { if (window.innerWidth > 1023 && !menu.hidden) setMenu(false); placeBar(); });

  /* ── Valuation sheet ────────────────────────────────────────────────────── */
  const sheet = $('#sheet');
  let sheetTimer;

  function openSheet() {
    setMenu(false);
    clearTimeout(sheetTimer);
    if (!sheet.open) sheet.showModal();
    void sheet.offsetWidth;
    sheet.classList.add('is-open');
    const field = $('#s-address');
    if (field) field.focus({ preventScroll: true });
  }

  function closeSheet() {
    sheet.classList.remove('is-open');
    clearTimeout(sheetTimer);
    sheetTimer = setTimeout(() => { if (!sheet.classList.contains('is-open') && sheet.open) sheet.close(); }, reduceMotion.matches ? 0 : 300);
  }

  sheet.addEventListener('cancel', (event) => { event.preventDefault(); closeSheet(); });
  sheet.addEventListener('click', (event) => { if (event.target === sheet) closeSheet(); }); // backdrop

  document.addEventListener('click', (event) => {
    const opener = event.target.closest('[data-open-sheet]');
    if (opener) { event.preventDefault(); openSheet(); return; }
    if (event.target.closest('[data-close-sheet]')) { closeSheet(); return; }
    const placeholder = event.target.closest('a[href="#"]');
    if (placeholder) event.preventDefault(); // placeholder links until real pages exist
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') { setMenu(false); menuButton.focus(); }
  });

  /* ── Demo forms (no back-end yet) ───────────────────────────────────────── */
  $$('form[data-demo-form]').forEach((form) => {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      const status = $('.form-status', form);
      form.reset();
      if (status) status.hidden = false;
      if (form.closest('dialog')) setTimeout(() => { closeSheet(); if (status) status.hidden = true; }, 2200);
    });
    form.addEventListener('input', () => { const status = $('.form-status', form); if (status) status.hidden = true; });
  });

  /* ── Scroll reveal ──────────────────────────────────────────────────────── */
  const revealTargets = $$('[data-reveal]');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add('is-in'); io.unobserve(entry.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealTargets.forEach((el) => io.observe(el));
  } else {
    revealTargets.forEach((el) => el.classList.add('is-in'));
  }

  /* ── Images: if a placeholder photo fails to load, fall back to the brand colour ── */
  $$('img[src^="https://images.unsplash.com"]').forEach((img) => {
    const fail = () => img.classList.add('is-broken');
    img.addEventListener('error', fail);
    if (img.complete && img.naturalWidth === 0) fail();
  });

  /* ── Init ───────────────────────────────────────────────────────────────── */
  syncSeg('lang', state.lang);
  syncSeg('currency', state.currency);
  applyLang(); applySpecs(); applyMoney(); placeBar();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(placeBar);
  requestAnimationFrame(() => requestAnimationFrame(() => document.documentElement.classList.add('is-ready')));
  loadRate().then(applyMoney); // swap in the live rate when it arrives
})();
