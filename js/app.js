/* Kieselwaage: Ansichten und Bedienung.
   Etappe 1a: Anmeldung mit dem Code, Startseite mit den Stationen (alle „bald“), Abmelden, Erwachsenenbereich.
   Aufbau übernommen aus der Chancenbucht js/app.js (15.11.2026), ohne Stationen und Logbuch.
   Stationen tragen sich später als Modul in KW.stationen[id] ein (js/stationen/<name>.js) und bekommen ctx.
   Sicherheit: Fremde Werte (Vorname, Stand, Adresse) kommen nie ungeprüft in innerHTML.
   Feste Texte laufen durch esc(), der Vorname wird mit textContent gesetzt. */
(() => {
  'use strict';
  const KW = window.KW;
  const C = KW.config;
  const ST = KW.stand;
  const S = ST.S;
  const cloud = ST.cloud;

  const app = document.getElementById('app');
  const meldung = document.getElementById('meldung');
  const live = document.getElementById('live');
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  KW.esc = esc;

  /* Sichtbare Meldung unten, wird von Screenreadern angesagt (role=status). */
  let meldungUhr = 0;
  function melden(text) {
    clearTimeout(meldungUhr);
    meldung.textContent = '';
    if (!text) return;
    setTimeout(() => { meldung.textContent = text; }, 30);
    if (text.length < 80) meldungUhr = setTimeout(() => { meldung.textContent = ''; }, 9000);
  }
  /* Nur für Screenreader: z. B. „Die linke Schale ist schwerer.“ */
  function ansagen(text) {
    live.textContent = '';
    setTimeout(() => { live.textContent = text; }, 30);
  }
  KW.melden = melden;
  KW.ansagen = ansagen;

  const SPEICHER_FEHLT = 'Dein Stand konnte gerade nicht gespeichert werden. Vielleicht ist der Speicher voll oder ausgeschaltet. Bitte sag deiner Lehrkraft Bescheid.';
  const LADEN_FEHLT = 'Der gespeicherte Stand auf diesem Gerät konnte nicht gelesen werden. Damit nichts verloren geht, speichert die Seite gerade nichts. Bitte sag deiner Lehrkraft Bescheid.';
  const MOMENT = 'Einen Moment …';

  /* ---------- Ansichten ---------- */
  let ersterAufruf = true;
  let ansicht = '';
  function zeigen(html, titel) {
    melden('');
    app.innerHTML = html;
    document.title = titel ? `${titel} – ${C.name}` : C.name;
    const h1 = app.querySelector('h1');
    if (h1 && !ersterAufruf) { h1.tabIndex = -1; h1.focus({ preventScroll: true }); }
    ersterAufruf = false;
    window.scrollTo(0, 0);
  }

  const WELLE = '<svg class="welle" viewBox="0 0 62 14" aria-hidden="true" focusable="false"><path d="M2 5c5-4 9-4 14 0s9 4 14 0 9-4 14 0 9 4 14 0M10 11c4-3 8-3 12 0s8 3 12 0 8-3 12 0" fill="none" stroke-width="1.6" stroke-linecap="round"/></svg>';
  /* Flint (Canva, von Ingo gewählt am 15.11.2026) */
  const FLINT = `<picture><source srcset="bilder/flint-512.webp?b=${C.bildStand}" type="image/webp"><img class="otter" src="bilder/flint-512.jpg?b=${C.bildStand}" alt="Flint, ein brauner Seeotter, treibt auf dem Rücken im Wasser. Auf dem Bauch hält er einen glatten grauen Kiesel." width="512" height="512"></picture>`;
  function kopf(titel, mitFlint = false) {
    return `<header class="kopf">
        <p class="wortmarke">${esc(C.name)}${WELLE}</p>
        <h1>${titel}</h1>
        ${mitFlint ? FLINT : ''}
      </header>`;
  }

  /* Ergebnis von cloud.anmelden() oder cloud.start() anzeigen */
  function nachAnmelden(r) {
    if (!r.ok) {
      if (ansicht === 'code' && app.querySelector('#code')) {
        app.querySelector('#code-form button[type="submit"]').disabled = false;
        app.querySelector('#code-hinweis').textContent = r.grund || '';
        app.querySelector('#code').focus();
      } else ansichtCode(r.grund);
      return;
    }
    ansichtStart();
    if (r.gespeichert === false) melden(SPEICHER_FEHLT);
  }

  function ansichtCode(hinweis = '') {
    zeigen(`
      ${kopf(esc(C.unterzeile), true)}
      <section class="papier" aria-labelledby="h-code">
        <p>Ich bin ${esc(C.maskottchen)}, ein Seeotter. Hier wiegen wir Kiesel, Muscheln und Gewichtssteine. Du vermutest zuerst, dann zeigt dir die Waage, ob es stimmt.</p>
        <h2 id="h-code">Wie lautet dein Code?</h2>
        <form id="code-form" novalidate>
          <label for="code">Dein Code</label>
          <input type="text" id="code" name="code" class="code-feld" autocomplete="off" autocapitalize="characters" autocorrect="off" spellcheck="false" maxlength="${C.codeLaenge + 4}" aria-describedby="code-hinweis code-info">
          <p id="code-hinweis" class="hinweis-feld" aria-live="polite"></p>
          <p class="knopfreihe"><button type="submit" class="knopf haupt">Weiter</button></p>
        </form>
        <p id="code-info" class="leise">Dein Code hat ${C.codeLaenge} Zeichen: Buchstaben und Zahlen. Es ist derselbe Code wie beim Perlentaucher.</p>
      </section>
      ${erwachsene()}`, '');
    ansicht = 'code';
    app.querySelector('#code-hinweis').textContent = hinweis || '';
    app.querySelector('#code-form').addEventListener('submit', e => {
      e.preventDefault();
      const knopf = e.target.querySelector('button[type="submit"]');
      if (knopf.disabled) return;
      knopf.disabled = true;
      app.querySelector('#code-hinweis').textContent = MOMENT;
      cloud.anmelden(app.querySelector('#code').value).then(nachAnmelden, () => nachAnmelden({ ok: false, grund: cloud.TEXT.sonst }));
    });
  }

  /* Zeile auf der Startseite, wenn der Stand gerade nicht in der Datenbank ankommt */
  function netzText() {
    const z = cloud.zustand().art;
    if (z === 'lokal') return 'Gerade ohne Internet. Dein Stand bleibt auf diesem Gerät und wird später abgeglichen.';
    if (z === 'fehler') return 'Dein Stand konnte gerade nicht im Internet gespeichert werden. Er bleibt auf diesem Gerät. Bitte sag deiner Lehrkraft Bescheid.';
    return '';
  }
  cloud.beiZustand(() => {
    const p = app.querySelector('#netz-zeile');
    if (p) { p.textContent = netzText(); p.hidden = !p.textContent; }
  });

  const BUCH = '<svg class="buch" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 5c3-1.5 5.5-1.5 8 0v14c-2.5-1.5-5-1.5-8 0z"/><path d="M12 5c2.5-1.5 5-1.5 8 0v14c-3-1.5-5.5-1.5-8 0"/></svg>';
  const SCHLOSS = '<svg class="schloss" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';

  /* Live ist eine Station, wenn config.js es sagt und ihr Modul geladen ist (KW.stationen[id]) */
  /* Stationsbilder: gemalte Canva-Bilder (Ingo 16.11.2026, statt Linien-Zeichen), reine Zierde: alt="" */
  const stationsbild = id => `<img class="station__bild" src="bilder/karten/${esc(id)}.webp?b=${C.bildStand}" alt="" width="480" height="360" loading="lazy" decoding="async">`;
  const istLive = s => !!(s.live && KW.stationen && KW.stationen[s.id]);
  /* Stempel als Form (gefüllter oder leerer Kreis je Stufe), nicht als Zahl */
  function stempelPunkte(id) {
    return `<span class="stempel-punkte" aria-hidden="true">${C.stufen.map(st => `<span class="stempel-punkt${ST.hatStempel(id, st) ? ' stempel-punkt--voll' : ''}"></span>`).join('')}</span>`;
  }
  function stempelText(id) {
    const n = C.stufen.filter(st => ST.hatStempel(id, st)).length;
    return n ? `${n} von ${C.stufen.length} Stempeln.` : 'Noch kein Stempel.';
  }

  /* Startseite: Begrüßung, Stationen, Abmelden */
  function ansichtStart() {
    const k = ST.aktiv();
    if (!k) { ansichtCode(); return; }
    zeigen(`
      ${kopf('Hallo, <span id="vorname"></span>!')}
      <p id="netz-zeile" class="netz-zeile" role="status" hidden></p>
      <section aria-labelledby="h-stationen">
        <h2 id="h-stationen" class="nurvorlesen">Stationen</h2>
        <ul class="stationen">
          ${C.stationen.map(s => istLive(s) ? `
            <li>
              <button type="button" class="station station--live" data-aktion="station" data-id="${esc(s.id)}" aria-label="${esc(s.name)}: ${esc(s.kurz)}. ${stempelText(s.id)}">
                <span class="station__name">${esc(s.name)}</span>
                <span class="station__linie" aria-hidden="true"></span>
                <span class="station__kurz">${esc(s.kurz)}</span>
                ${stationsbild(s.id)}
                ${stempelPunkte(s.id)}
              </button>
            </li>` : `
            <li>
              <div class="station station--bald">
                <h3 class="station__name">${esc(s.name)}</h3>
                <span class="station__linie" aria-hidden="true"></span>
                <p class="station__kurz">${esc(s.kurz)}</p>
                ${stationsbild(s.id)}
                <p class="station__bald">${SCHLOSS}Kommt bald</p>
              </div>
            </li>`).join('')}
        </ul>
      </section>
      <p class="knopfreihe knopfreihe--mitte"><button type="button" class="knopf glas-knopf logbuch-knopf" data-aktion="logbuch">${BUCH}<span>Mein Logbuch</span><span class="logbuch-knopf__zahl">${KW.logbuch.anzahlStempel()} von ${ST.SCHLUESSEL.length} Stempeln</span></button></p>
      ${ST.istVorschau ? '' : '<p class="knopfreihe knopfreihe--mitte"><button type="button" class="knopf glas-knopf" data-aktion="abmelden">Abmelden</button></p>'}
      ${erwachsene()}`, '');
    app.querySelector('#vorname').textContent = k.name || 'du';
    const n = app.querySelector('#netz-zeile');
    n.textContent = netzText(); n.hidden = !n.textContent;
    ansicht = 'start';
    aktiveStation = null;
    adresse('');
  }

  /* ---------- Stationen ---------- */
  /* Adresse mitführen (#vergleichen), damit Neuladen dort bleibt */
  function adresse(h) {
    try { history.replaceState(null, '', location.pathname + location.search + (h ? '#' + h : '')); } catch (e) { /* egal */ }
  }
  let aktiveStation = null;
  /* Was eine Station von der App braucht */
  const ctx = {
    app, esc, zeigen: (h, t) => zeigen(h, t), melden: t => melden(t), ansagen: t => ansagen(t), adresse,
    zurueck: () => ansichtStart(),
    speicherFehlt: SPEICHER_FEHLT,
    flintKlein: `<picture><source srcset="bilder/flint-160.webp?b=${C.bildStand}" type="image/webp"><img class="flint-klein" src="bilder/flint-160.jpg?b=${C.bildStand}" alt="" width="160" height="160"></picture>`,
    welle: WELLE
  };
  function stationOeffnen(id) {
    const s = KW.stationen && KW.stationen[id];
    if (!s || !ST.aktiv()) { ansichtStart(); return; }
    aktiveStation = s;
    ansicht = 'station';
    adresse(id);
    s.oeffnen(ctx);
  }

  /* Logbuch: eigene Ansicht #logbuch, Klicks gehen an KW.logbuch (Urkunde) */
  function logbuchOeffnen() {
    if (!ST.aktiv()) { ansichtStart(); return; }
    aktiveStation = KW.logbuch;
    ansicht = 'logbuch';
    adresse('logbuch');
    KW.logbuch.zeigen(ctx);
  }

  function abmelden(knopf) {
    knopf.disabled = true;
    cloud.abmelden().then(() => { ansichtCode(); }, () => { ansichtCode(); });
  }

  /* ---------- Erwachsenenbereich: zwei Aufklapper (Texte in js/erwachsene.js), Darstellung wie Chancenbucht ---------- */
  function erwachsenenTeil(bereich, klasse) {
    const abschnitt = x => `
        <h3>${esc(x.titel)}</h3>
        ${(x.absaetze || []).map(t => `<p>${esc(t)}</p>`).join('')}
        ${x.liste ? `<ul class="erwachsene__liste">${x.liste.map(([f, t]) => `<li><b>${esc(f)}:</b> ${esc(t)}</li>`).join('')}</ul>` : ''}
        ${x.tabelle ? `<div class="erwachsene__tabelle"><table><thead><tr>${x.tabelle.kopf.map(k => `<th scope="col">${esc(k)}</th>`).join('')}</tr></thead><tbody>${x.tabelle.zeilen.map(([p, u]) => `<tr><th scope="row">${esc(p)}</th><td>${esc(u)}</td></tr>`).join('')}</tbody></table></div>` : ''}
        ${x.datenschutzLink ? '<p>Mehr steht unter <a href="datenschutz.html">Datenschutz</a>.</p>' : ''}`;
    return `
      <details class="papier erwachsene ${klasse}">
        <summary><h2>${esc(bereich.titel)}</h2></summary>
        ${bereich.abschnitte.map(abschnitt).join('')}
      </details>`;
  }
  function erwachsene() {
    const E = KW.erwachsene;
    return erwachsenenTeil(E.eltern, 'erwachsene--eltern') + erwachsenenTeil(E.lehrkraefte, 'erwachsene--lehrkraefte');
  }

  /* ---------- Bedienung ---------- */
  app.addEventListener('click', e => {
    if (aktiveStation && aktiveStation.bedienen && aktiveStation.bedienen(e)) return;
    const b = e.target.closest('[data-aktion]');
    if (!b || b.disabled) return;
    const a = b.dataset.aktion;
    if (a === 'abmelden') abmelden(b);
    else if (a === 'start') ansichtStart();
    else if (a === 'station') stationOeffnen(b.dataset.id);
    else if (a === 'logbuch') logbuchOeffnen();
  });

  /* ---------- Start ---------- */
  if (ST.istVorschau) {
    const h = document.getElementById('vorschau-hinweis');
    h.textContent = 'Vorschau: Hier wird nichts gespeichert.';
    h.hidden = false;
  }

  /* Die Lehrkraft hat den Stand zurückgesetzt: Das Gerät hat seinen Stand verworfen (js/konto-cloud.js). */
  cloud.beiNeustart(() => {
    if (ansicht === 'start') ansichtStart();
    melden('Deine Lehrkraft hat deine Kieselwaage neu gestartet. Du fängst von vorn an.');
  });

  /* Was das Gerät schon weiß, steht sofort da. Die Antwort aus dem Netz kommt nach.
     Gewechselt wird nur auf der Code- oder Startseite, nie mitten in einer Aufgabe. */
  const darfWechseln = () => ['code', 'start'].includes(ansicht);
  function anzeigen() {
    const ziel = location.hash.slice(1);
    if (ST.aktiv()) {
      if (KW.stationen && KW.stationen[ziel] && C.stationen.some(s => s.id === ziel && s.live)) stationOeffnen(ziel);
      else if (ziel === 'logbuch') logbuchOeffnen();
      else ansichtStart();
    } else ansichtCode();
    if (ST.zustand.ladeFehler) melden(LADEN_FEHLT);
  }
  function starten() {
    if (ST.istVorschau) { anzeigen(); return; }
    const LA = window.LagunenKonto.adresse;
    const qr = LA.code(), spur = LA.spur();
    LA.saeubern();
    if (qr) {
      /* Ein gescannter Code hat Vorrang vor dem Kind, das auf dem Gerät noch angemeldet ist. */
      if (ST.aktiv() && ST.code() !== qr) S.abmelden();
      if (ST.aktiv()) ansichtStart(); else ansichtCode(MOMENT);
      cloud.anmelden(qr).then(r => { if (darfWechseln()) { if (!r.ok) ansichtCode(r.grund); else nachAnmelden(r); } }, () => {});
      return;
    }
    anzeigen();
    if (spur && ansicht === 'code') app.querySelector('#code-hinweis').textContent = 'Der Code wurde nicht ganz gelesen. Tippe ihn bitte ein.';
    const gemerkt = ST.code();
    cloud.start().then(r => {
      if (r.ok) { if (darfWechseln()) nachAnmelden(r); return null; }
      if (r.grund) return r;
      /* Firebase kennt niemanden, der Tab aber schon: mit dem gemerkten Code anmelden */
      return gemerkt && ST.code() === gemerkt ? cloud.anmelden(gemerkt) : null;
    }).then(r => {
      if (!r) return;
      if (r.ok) { if (ansicht === 'start' && darfWechseln()) ansichtStart(); return; }
      /* Die Lehrkraft hat den Code gesperrt: nicht auf dem Gerät weiterarbeiten lassen */
      if (r.grund === cloud.TEXT.gesperrt && ST.aktiv()) { S.abmelden(); if (darfWechseln()) ansichtCode(r.grund); }
    }, () => {});
  }
  starten();

  /* Für Rauchtest und Vorschau */
  window.KW.bereit = true;
})();
