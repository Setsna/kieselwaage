/* Kieselwaage: Station „Gramm und Kilogramm“ (Etappe 3d).
   Klassisches Skript, trägt sich in KW.stationen.gramm ein. Texte nach Dateien/Beispiele-Entwuerfe/gleichgewicht-gramm.md
   (Entwurf 3a, von Ingo freigegeben am 16.11.2026).
   Arten (js/stationen/gramm-aufgaben.js): ablesen, einheit (leicht) · ergaenzen, bruch (mittel) · kgg, gkg (knifflig).
   - Ablesen: Waage im Gleichgewicht, Zahl eintippen (zwei Versuche).
   - Einheit: Gramm oder Kilogramm (ein Versuch, die Antwort wird erklärt).
   - Legen-Arten: Steine legen bis zum Gleichgewicht (beliebig oft wiegen, „Zeig mir eine Lösung“ nach dem dritten Wiegen),
     danach bei ergaenzen, kgg, gkg die Zahl eintippen (zwei Versuche). Bei bruch reicht das Gleichgewicht.
   Gespeichert werden nur runden und stempel. Barrierefreiheit und Sicherheit wie in js/stationen/vergleichen.js. */
(() => {
  'use strict';
  const KW = window.KW = window.KW || {};
  KW.stationen = KW.stationen || {};
  const ID = 'gramm';
  const C = () => KW.config;
  const A = () => KW.grammAufgaben;
  const ST = () => KW.stand;
  const T = () => KW.teile;
  const B = () => KW.waageBild;
  const W = () => KW.waage;
  const SATZ = () => C().waage.gewichtssteine;
  const KILO = () => SATZ().indexOf(1000);
  const STUFENNAME = { leicht: 'leicht', mittel: 'mittel', knifflig: 'knifflig' };
  const LEGEN = ['ergaenzen', 'bruch', 'kgg', 'gkg'];

  let ctx = null, z = null, waage = null, hilfeStufe = 0;
  const esc = s => ctx.esc(s);
  const g = m => B().steinText(m);
  const liste = ms => ms.length === 1 ? g(ms[0]) : `${ms.slice(0, -1).map(g).join(', ')} und ${g(ms[ms.length - 1])}`;
  const und = ms => ms.map(g).join(' und ');
  const gross = s => s.charAt(0).toUpperCase() + s.slice(1);

  const kopf = unterzeile => T().kopf(ctx, { titel: 'Gramm und Kilogramm', unterzeile, praefix: 'gr' });
  const SO_GEHTS = offen => T().aufklapper(ctx, { klasse: 'so-gehts', titel: "So geht's", offen, schritte: [
    'Schau dir die Gewichtssteine an. Auf jedem steht, wie viel er wiegt.',
    'Rechne zusammen oder lege Steine auf die Waage.',
    'Tippe deine Zahl mit den Zifferntasten ein.'] });
  const AM_TISCH = offen => T().aufklapper(ctx, { klasse: 'am-tisch', titel: 'Am Tisch: Ein Kilogramm in der Hand', offen, schritte: [
    'Du brauchst: eine 1-kg-Packung (Mehl, Zucker oder Salz), eine leere Tüte, Kastanien oder kleine Steine.',
    'Halte die Packung in einer Hand. So schwer ist 1 kg.',
    'Fülle die Tüte, bis sie sich genauso schwer anfühlt.',
    'Prüft mit der Schulwaage: Wie viel Gramm sind es? Wie viel fehlt bis 1000 g?'] });

  function ansichtStufen() {
    z = null; waage = null;
    const erstesMal = T().erstesMal(ID);
    ctx.zeigen(`
      ${kopf('Mit Gewichtssteinen wiegen')}
      ${erstesMal ? '<p class="flint-satz">Hier wiegst du mit Gewichtssteinen wie auf einer echten Tafelwaage. 1 kg sind 1000 g.</p>' : ''}
      ${SO_GEHTS(erstesMal)}
      ${T().stufenListe(ctx, ID, 'gr')}
      ${AM_TISCH(false)}`, 'Gramm und Kilogramm');
  }

  function rundeStarten(stufe) {
    z = { stufe, aufgaben: A().runde(stufe), i: 0, geschafft: [], gespeichertFehler: false };
    aufgabeZeigen();
  }
  const aufgabe = () => z && z.aufgaben[z.i];

  /* Was links liegt und was rechts fest liegt (nicht zurücklegbar) */
  function links(a) {
    if (a.art === 'ablesen') return [a.ding];
    if (a.art === 'ergaenzen') return [{ art: 'stein', masse: 1000 }];
    return [a.kiesel];
  }
  const festRechts = a => a.art === 'ablesen' ? a.steine.map(s => s.masse) : a.art === 'ergaenzen' ? a.vorhanden.map(i => SATZ()[i]) : [];
  /* Steine, die das Kind nicht nehmen darf (liegen schon fest oder links) */
  const gesperrteSteine = a => a.art === 'ergaenzen' ? [...a.vorhanden, KILO()] : [];

  function aufgabeZeigen() {
    const a = aufgabe();
    hilfeStufe = 0;
    a.zustand = { gelegt: [], wiegungen: 0, gewogen: false, phase: LEGEN.includes(a.art) ? 'legen' : a.art === 'ablesen' ? 'zahl' : 'wahl', zahlVersuche: 0, hilfeAn: false, loesungGezeigt: false, fertig: false, geschafft: false, wahl: null, rueck: '', ansage: '' };
    waage = a.art === 'einheit' ? null : B().neu({ bildStand: C().bildStand });
    if (waage) {
      waage.setze(links(a), festRechts(a).map(m => ({ art: 'stein', masse: m })));
      if (a.art === 'ablesen') { const r = waage.wiegen(); a.zustand.ansage = r.ansage; }
    }
    ctx.zeigen(`
      ${kopf(`Stufe ${STUFENNAME[z.stufe]} · Aufgabe ${z.i + 1} von ${z.aufgaben.length}`)}
      <div class="station-flaeche">
        <div class="buehne buehne--waage" id="gr-buehne"></div>
        <section class="papier aufgabe" id="gr-aufgabe" aria-labelledby="gr-frage"></section>
      </div>`, `Aufgabe ${z.i + 1} – Gramm und Kilogramm`);
    zeichne();
  }

  const gelegtMassen = s => s.gelegt.map(i => SATZ()[i]);
  const rechtsMassen = (a, s) => [...festRechts(a), ...gelegtMassen(s)].sort((x, y) => y - x);
  const summe = ms => ms.reduce((x, y) => x + y, 0);
  /* Zwischensummen für Tipp 3: „100 g, 150 g, 170 g, 175 g“ */
  const zwischen = ms => { let s = 0; return ms.map(m => `${(s += m)} g`).join(', '); };

  function buehne() {
    const a = aufgabe(), s = a.zustand, b = ctx.app.querySelector('#gr-buehne');
    if (!b) return;
    b.textContent = '';
    const p = (k, t) => { const e = document.createElement('p'); e.className = k; e.textContent = t; return e; };
    if (a.art === 'einheit') {
      b.appendChild(p('einheit-satz', a.satz));
      return;
    }
    const fig = document.createElement('figure'); fig.className = 'waage-figur';
    fig.appendChild(waage.el);
    const cap = document.createElement('figcaption');
    cap.appendChild(p('waage-figur__inhalt', waage.beschreibung()));
    const r = rechtsMassen(a, s);
    if (s.hilfeAn && r.length) cap.appendChild(p('waage-figur__summe', `Zusammenrechnen: ${zwischen(r)}.`));
    fig.appendChild(cap); b.appendChild(fig);
    b.appendChild(p('waage-ergebnis', s.ansage || (waage.riegelZu() ? 'Die Waage ist festgestellt.' : '')));
  }

  function zahlFrage(a) {
    if (a.art === 'ablesen') return `${gross(A().BESTIMMT[a.ding.id])} wiegt …`;
    if (a.art === 'ergaenzen') return 'Wie viel hat gefehlt?';
    if (a.art === 'kgg') return `1 kg ${a.g} g sind zusammen …`;
    return `${a.ziel} g sind 1 kg und …`;
  }

  function zeichne() {
    buehne();
    const a = aufgabe(), s = a.zustand, ziel = ctx.app.querySelector('#gr-aufgabe');
    const legen = s.phase === 'legen' && !s.fertig;
    let mitte = '';
    if (a.art === 'einheit') {
      mitte = `<div class="antworten antworten--reihe" role="group" aria-label="Gramm oder Kilogramm?">
        ${['g', 'kg'].map(e => `<button type="button" class="knopf antwort-knopf${s.fertig && e === a.loesung ? ' ist-richtig' : ''}" data-gr="einheit" data-e="${e}" aria-pressed="${s.wahl === e}"${s.fertig ? ' disabled' : ''}>${e === 'g' ? 'Gramm (g)' : 'Kilogramm (kg)'}</button>`).join('')}
      </div>`;
    } else if (LEGEN.includes(a.art)) {
      mitte = `${T().steinkasten(ctx, { praefix: 'gr', gelegt: s.gelegt, gesperrt: !legen })}
      <p class="knopfreihe">
        <button type="button" class="knopf haupt wiegen-knopf" data-gr="wiegen"${!legen || !s.gelegt.length || s.gewogen ? ' disabled' : ''}>Wiegen</button>
        ${legen && s.wiegungen >= 3 ? '<button type="button" class="knopf knopf--klein" data-gr="loesung">Zeig mir eine Lösung</button>' : ''}
      </p>`;
    }
    ziel.innerHTML = `
      <p class="auftrag" id="gr-frage">${esc(a.frage)}</p>
      ${mitte}
      <p class="rueckmeldung">${esc(s.rueck)}</p>
      ${s.phase === 'zahl' && !s.fertig ? T().ziffern(ctx, { praefix: 'gr', frage: zahlFrage(a) }) : ''}
      ${s.fertig ? '<p class="knopfreihe"><button type="button" class="knopf haupt" data-gr="weiter">Weiter</button></p>' : ''}`;
    ziel.classList.toggle('loesung-gezeigt', s.fertig && !s.geschafft);
    /* Gesperrte Steine (ergaenzen: liegen schon rechts, 1 kg liegt links) nicht anbieten */
    for (const i of gesperrteSteine(a)) { const k = ziel.querySelector(`[data-gr="stein"][data-i="${i}"]`); if (k) { k.disabled = true; k.setAttribute('aria-label', `${g(SATZ()[i])}, liegt schon auf der Waage`); } }
  }

  function fertig(a, ok) {
    const s = a.zustand;
    s.fertig = true;
    if (s.geschafft || !ok || s.loesungGezeigt) return;
    s.geschafft = true;
    z.geschafft[z.i] = true;
    if (!ST().istVorschau && ST().rundeGeschafft(ID, z.stufe) === false) z.gespeichertFehler = true;
  }

  function neuBelegen(a) {
    const s = a.zustand;
    waage.setze(links(a), rechtsMassen(a, s).map(m => ({ art: 'stein', masse: m })));
    s.gewogen = false; s.ansage = '';
  }
  function legeStein(i) {
    const a = aufgabe(), s = a.zustand;
    if (s.phase !== 'legen' || s.fertig || s.gelegt.includes(i) || gesperrteSteine(a).includes(i)) return;
    s.gelegt.push(i); neuBelegen(a); zeichne(); T().fokus(ctx, '[data-gr="wiegen"]');
    ctx.ansagen(`${g(SATZ()[i])} liegt auf der rechten Schale.`);
  }
  function zurueck(i) {
    const a = aufgabe(), s = a.zustand;
    if (s.phase !== 'legen' || s.fertig) return;
    s.gelegt = s.gelegt.filter(x => x !== i); neuBelegen(a); zeichne(); T().fokus(ctx, `[data-gr="stein"][data-i="${i}"]`);
    ctx.ansagen(`${g(SATZ()[i])} liegt wieder im Kasten.`);
  }
  function alleZurueck() {
    const a = aufgabe(), s = a.zustand;
    if (s.phase !== 'legen' || s.fertig) return;
    s.gelegt = []; neuBelegen(a); zeichne(); T().fokus(ctx, '[data-gr="stein"]:not([disabled])');
  }

  /* Text nach dem Ausgleichen je Art */
  function nachAusgleich(a, s) {
    const ms = gelegtMassen(s).sort((x, y) => y - x);
    if (a.art === 'bruch') {
      const satz = a.ziel === 1000 ? 'Ein Kilogramm sind 1000 g.' : a.ziel === 500 ? 'Ein halbes Kilogramm sind 500 g.' : 'Ein Viertel Kilogramm sind 250 g.';
      s.rueck = `Genau. ${satz} Deine Steine: ${liste(ms)}.`;
      fertig(a, true);
    } else {
      s.phase = 'zahl';
      s.rueck = a.art === 'ergaenzen' ? `Die Waage ist im Gleichgewicht. Du hast ${liste(ms)} dazugelegt.` : 'Die Waage ist im Gleichgewicht. Jetzt tippe die Zahl ein.';
    }
  }
  function wiegen() {
    const a = aufgabe(), s = a.zustand;
    if (s.phase !== 'legen' || s.fertig || !s.gelegt.length || s.gewogen) return;
    const r = waage.wiegen();
    s.gewogen = true; s.wiegungen++; s.ansage = r.ansage;
    if (r.vergleich > 0) s.rueck = 'Die linke Schale ist noch schwerer. Lege mehr dazu.';
    else if (r.vergleich < 0) s.rueck = 'Jetzt ist die rechte Schale schwerer. Nimm etwas weg.';
    else nachAusgleich(a, s);
    zeichne(); ctx.ansagen(`${s.ansage} ${s.rueck}`);
    T().fokus(ctx, s.fertig ? '[data-gr="weiter"]' : s.phase === 'zahl' ? '#ziffern-feld' : '[data-gr="stein"]:not([disabled])');
  }
  function loesungZeigen() {
    const a = aufgabe(), s = a.zustand;
    if (s.phase !== 'legen' || s.fertig) return;
    const fehlt = a.art === 'ergaenzen' ? a.loesung : a.ziel;
    const verboten = gesperrteSteine(a);
    const frei = SATZ().map((m, i) => i).filter(i => !verboten.includes(i));
    const sol = W().wenigste(fehlt, frei.map(i => SATZ()[i]));
    const gelegt = [];
    for (const m of sol) gelegt.push(frei.find(j => SATZ()[j] === m && !gelegt.includes(j)));
    s.gelegt = gelegt; s.loesungGezeigt = true;
    neuBelegen(a); const r = waage.wiegen(); s.gewogen = true; s.ansage = r.ansage;
    const loesungstext = { ergaenzen: `Es fehlen ${a.loesung} g.`, bruch: '', kgg: `Das sind ${a.ziel} g.`, gkg: `${a.ziel} g sind 1 kg und ${a.loesung} g.` }[a.art];
    s.rueck = `So geht es zum Beispiel: ${liste(sol)}. ${loesungstext}`.trim();
    fertig(a, false);
    zeichne(); ctx.ansagen(s.rueck); T().fokus(ctx, '[data-gr="weiter"]');
  }

  function zahlFertig() {
    const a = aufgabe(), s = a.zustand;
    if (s.phase !== 'zahl' || s.fertig) return;
    const v = T().zifferWert(ctx);
    if (v === null) { s.rueck = 'Tippe zuerst eine Zahl ein.'; zeichne(); T().fokus(ctx, '#ziffern-feld'); return; }
    const r = rechtsMassen(a, s);
    /* Texte als Funktionen: nur die passende Art wird gerechnet (sonst fehlt z. B. a.ding) */
    const richtig = {
      ablesen: () => `Genau. ${und(r)} sind zusammen ${a.loesung} g. ${gross(A().BESTIMMT[a.ding.id])} wiegt ${a.loesung} g.`,
      ergaenzen: () => `Genau. ${summe(festRechts(a))} g und ${a.loesung} g sind zusammen 1000 g, also 1 kg.`,
      kgg: () => `Genau. 1 kg ${a.g} g sind ${a.ziel} g. Denn 1 kg sind 1000 g.`,
      gkg: () => `Genau. ${a.ziel} g sind 1 kg und ${a.loesung} g. Denn 1 kg sind 1000 g.`
    }[a.art]();
    const erster = { ablesen: 'Rechne die Steine noch einmal zusammen. Fang beim größten an.', ergaenzen: 'Rechne zusammen, was du dazugelegt hast.', kgg: '1 kg sind 1000 g. Rechne die Gramm dazu.', gkg: '1 kg sind 1000 g. Wie viel bleibt übrig?' }[a.art];
    const loesung = {
      ablesen: () => `Die Steine wiegen zusammen ${a.loesung} g. Also wiegt ${A().BESTIMMT[a.ding.id]} ${a.loesung} g.`,
      ergaenzen: () => `Es fehlten ${a.loesung} g. ${summe(festRechts(a))} g und ${a.loesung} g sind 1000 g.`,
      kgg: () => `1 kg ${a.g} g sind ${a.ziel} g.`,
      gkg: () => `${a.ziel} g sind 1 kg und ${a.loesung} g.`
    }[a.art]();
    if (v === a.loesung) { s.rueck = richtig; fertig(a, true); }
    else if (++s.zahlVersuche < 2) s.rueck = erster;
    else { s.rueck = loesung; fertig(a, false); }
    zeichne(); ctx.ansagen(s.rueck); T().fokus(ctx, s.fertig ? '[data-gr="weiter"]' : '#ziffern-feld');
  }

  /* Gramm oder Kilogramm? */
  function einheitWaehlen(e) {
    const a = aufgabe(), s = a.zustand;
    if (s.fertig) return;
    s.wahl = e;
    const satz = a.satz.replace(' …', '');
    if (e === a.loesung) s.rueck = `Genau. ${satz} ${a.loesung === 'g' ? 'Gramm' : 'Kilogramm'}.`;
    /* Satz, der für jede Zahl stimmt (Ingo 16.11.2026, statt Pony und Radiergummi) */
    else {
      /* Ohne Umrechnung („160000 Gramm“ läge weit über dem Zahlenraum bis 1000 in Klasse 3) */
      const waere = a.zahl === 1 ? 'wäre' : 'wären', sind = a.zahl === 1 ? 'ist' : 'sind';
      s.rueck = a.loesung === 'g'
        ? `${a.zahl} Kilogramm ${waere} viel zu schwer für ${a.akk}. Es ${sind} ${a.zahl} Gramm.`
        : `${a.zahl} Gramm ${waere} viel zu leicht für ${a.akk}. Es ${sind} ${a.zahl} Kilogramm.`;
    }
    fertig(a, e === a.loesung);
    zeichne(); ctx.ansagen(s.rueck); T().fokus(ctx, '[data-gr="weiter"]');
  }

  function weiter() { if (z.i + 1 < z.aufgaben.length) { z.i++; aufgabeZeigen(); } else rundenende(); }
  const stempelSvg = () => T().stempel('<rect class="stempel__kugel" x="38" y="40" width="24" height="24" rx="3"/><rect class="stempel__kugel" x="45" y="31" width="10" height="9" rx="3"/><path class="stempel__welle" d="M30 72H70"/>');
  function rundenende() {
    const r = T().rundenende(ctx, { id: ID, praefix: 'gr', stufe: z.stufe, geschafft: z.geschafft.filter(Boolean).length, anzahl: z.aufgaben.length, stempelSvg: stempelSvg(), gespeichertFehler: z.gespeichertFehler });
    waage = null;
    ctx.zeigen(`${kopf(`Stufe ${STUFENNAME[z.stufe]} · Rundenende`)}${r.html}${AM_TISCH(false)}`, 'Rundenende – Gramm und Kilogramm');
    ctx.ansagen(r.text);
    if (r.fehler) ctx.melden(ctx.speicherFehlt);
  }

  const TIPPS = ['Rechne die Steine zusammen. Fang beim größten an.', '1 kg sind 1000 g.', 'Unter der Waage stehen jetzt die Zwischensummen.'];
  const TIPPS_EINHEIT = ['Stell dir das Ding in deiner Hand vor.', '1 Gramm ist so leicht wie eine Büroklammer. 1 Kilogramm ist so schwer wie eine Packung Mehl.'];
  function hilfeZeigen() {
    const a = aufgabe();
    if (!a) { T().dialog(ctx, { titel: 'Tipp von Flint', inhalt: `<div class="tipp">${ctx.flintKlein}<p>Wähle eine Stufe. Bei einer Stufe steht: Flint empfiehlt diese Stufe.</p></div>`, knoepfe: '<button type="button" class="knopf haupt" data-dialog="zu">Ich probiere es</button>' }); return; }
    const s = a.zustand, liste2 = a.art === 'einheit' ? TIPPS_EINHEIT : TIPPS, bis = Math.min(hilfeStufe, liste2.length - 1);
    if (a.art !== 'einheit' && bis >= 2 && !s.hilfeAn && !s.fertig) { s.hilfeAn = true; buehne(); }
    T().tippDialog(ctx, { liste: liste2, bis, fertig: s.fertig, weiter: () => { hilfeStufe++; hilfeZeigen(); } });
  }
  const WOERTER = [
    ['der Gewichtsstein', 'Ein Stein mit fester Masse. Auf ihm steht, wie viel er wiegt.'],
    ['die Tafelwaage', 'Eine Waage mit zwei Schalen. Sie zeigt, welche Seite schwerer ist.'],
    ['das Gramm (g)', 'Eine Büroklammer wiegt etwa 1 Gramm.'],
    ['das Kilogramm (kg)', '1 Kilogramm sind 1000 Gramm. 1 kg = 1000 g'],
    ['ein halbes Kilogramm', '500 Gramm'],
    ['ein Viertel Kilogramm', '250 Gramm']
  ];

  function bedienen(e) {
    const b = e.target.closest('[data-gr]');
    if (!b || b.disabled) return false;
    const was = b.dataset.gr;
    if (was === 'stufe') rundeStarten(b.dataset.stufe);
    else if (was === 'stufen') ansichtStufen();
    else if (was === 'hilfe') hilfeZeigen();
    else if (was === 'woerter') T().woerter(ctx, 'Wörter zum Wiegen', WOERTER);
    else if (was === 'stein') legeStein(Number(b.dataset.i));
    else if (was === 'zurueck') zurueck(Number(b.dataset.i));
    else if (was === 'alle-zurueck') alleZurueck();
    else if (was === 'wiegen') wiegen();
    else if (was === 'loesung') loesungZeigen();
    else if (was === 'einheit') einheitWaehlen(b.dataset.e);
    else if (['ziffer', 'loeschen', 'leeren'].includes(was)) T().zifferTaste(ctx, was, b.dataset.z);
    else if (was === 'fertig') zahlFertig();
    else if (was === 'weiter') weiter();
    else return false;
    return true;
  }

  KW.stationen[ID] = { id: ID, stempelSvg, oeffnen(c) { ctx = c; ansichtStufen(); }, bedienen, aufgabe, zustand: () => z, waage: () => waage };
})();
