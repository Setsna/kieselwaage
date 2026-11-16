/* Kieselwaage: Station „Gleichgewicht“ (Etappe 3c).
   Klassisches Skript, trägt sich in KW.stationen.gleichgewicht ein. Texte nach Dateien/Beispiele-Entwuerfe/gleichgewicht-gramm.md
   (Entwurf 3a, von Ingo freigegeben am 16.11.2026).
   - Links ein Kiesel, rechts legt das Kind Gewichtssteine aus dem Satz. Wiegen so oft es will (kein Zeitdruck).
   - Geschafft = Waage im Gleichgewicht (KW.waage, genau gleich). Nach dem dritten Wiegen gibt es „Zeig mir eine Lösung“;
     wer sie nutzt, bekommt die Aufgabe nicht als geschafft (Ingo, Mini-Spec Etappe 3, Frage 1).
   - „Zwei Wege“: zweite, andere Lösung nötig (gleich große Steine zählen als gleich).
   - knifflig: Kiesel ohne Zahl; nach dem Ausgleichen tippt das Kind die Masse ein (zwei Versuche).
   Gespeichert werden nur runden und stempel. Barrierefreiheit und Sicherheit wie in js/stationen/vergleichen.js. */
(() => {
  'use strict';
  const KW = window.KW = window.KW || {};
  KW.stationen = KW.stationen || {};
  const ID = 'gleichgewicht';
  const C = () => KW.config;
  const A = () => KW.gleichgewichtAufgaben;
  const ST = () => KW.stand;
  const T = () => KW.teile;
  const B = () => KW.waageBild;
  const W = () => KW.waage;
  const SATZ = () => C().waage.gewichtssteine;
  const STUFENNAME = { leicht: 'leicht', mittel: 'mittel', knifflig: 'knifflig' };

  let ctx = null, z = null, waage = null, hilfeStufe = 0;
  const esc = s => ctx.esc(s);
  const g = m => B().steinText(m);
  const liste = ms => ms.length === 1 ? g(ms[0]) : `${ms.slice(0, -1).map(g).join(', ')} und ${g(ms[ms.length - 1])}`;

  const kopf = unterzeile => T().kopf(ctx, { titel: 'Gleichgewicht', unterzeile, praefix: 'gg' });
  const SO_GEHTS = offen => T().aufklapper(ctx, { klasse: 'so-gehts', titel: "So geht's", offen, schritte: [
    'Links liegt ein Kiesel. Lege Gewichtssteine auf die rechte Schale.',
    'Tippe auf Wiegen. Die Waage zeigt, welche Seite schwerer ist.',
    'Lege Steine dazu oder nimm welche weg, bis die Waage gerade ist.'] });
  const AM_TISCH = offen => T().aufklapper(ctx, { klasse: 'am-tisch', titel: 'Am Tisch: Wie viele Büroklammern?', offen, schritte: [
    'Du brauchst: deine Kleiderbügelwaage, eine Schachtel Büroklammern, einen Radiergummi.',
    'Lege den Radiergummi in einen Beutel.',
    'Schätze zuerst: Wie viele Büroklammern wiegen so viel?',
    'Lege Klammern in den anderen Beutel, bis der Bügel gerade hängt.',
    'Zähle nach. Wie nah war deine Schätzung?'] });

  function ansichtStufen() {
    z = null; waage = null;
    const erstesMal = T().erstesMal(ID);
    ctx.zeigen(`
      ${kopf('Bring die Waage ins Lot')}
      ${erstesMal ? '<p class="flint-satz">Hier legst du Gewichtssteine auf die Waage, bis sie gerade ist. Du darfst so oft wiegen, wie du willst.</p>' : ''}
      ${SO_GEHTS(erstesMal)}
      ${T().stufenListe(ctx, ID, 'gg')}
      ${AM_TISCH(false)}`, 'Gleichgewicht');
  }

  function rundeStarten(stufe) {
    z = { stufe, aufgaben: A().runde(stufe), i: 0, geschafft: [], gespeichertFehler: false };
    aufgabeZeigen();
  }
  const aufgabe = () => z && z.aufgaben[z.i];

  function aufgabeZeigen() {
    const a = aufgabe();
    hilfeStufe = 0;
    a.zustand = { gelegt: [], wiegungen: 0, gewogen: false, wege: [], phase: 'legen', zahlVersuche: 0, summeAn: false, loesungGezeigt: false, fertig: false, geschafft: false, rueck: '', ansage: '', frage: a.frage };
    waage = B().neu({ bildStand: C().bildStand }).setze([a.kiesel], []);
    ctx.zeigen(`
      ${kopf(`Stufe ${STUFENNAME[z.stufe]} · Aufgabe ${z.i + 1} von ${z.aufgaben.length}`)}
      <div class="station-flaeche">
        <div class="buehne buehne--waage" id="gg-buehne"></div>
        <section class="papier aufgabe" id="gg-aufgabe" aria-labelledby="gg-frage"></section>
      </div>`, `Aufgabe ${z.i + 1} – Gleichgewicht`);
    zeichne();
  }

  const massen = s => s.gelegt.map(i => SATZ()[i]).sort((x, y) => y - x);
  const summe = ms => ms.reduce((x, y) => x + y, 0);

  function buehne() {
    const a = aufgabe(), s = a.zustand, b = ctx.app.querySelector('#gg-buehne');
    if (!b) return;
    b.textContent = '';
    const p = (k, t) => { const e = document.createElement('p'); e.className = k; e.textContent = t; return e; };
    const fig = document.createElement('figure'); fig.className = 'waage-figur';
    fig.appendChild(waage.el);
    const cap = document.createElement('figcaption');
    cap.appendChild(p('waage-figur__inhalt', waage.beschreibung()));
    if (s.summeAn && s.gelegt.length) cap.appendChild(p('waage-figur__summe', `Deine Steine wiegen zusammen ${summe(massen(s))} g.`));
    fig.appendChild(cap); b.appendChild(fig);
    b.appendChild(p('waage-ergebnis', s.ansage || (waage.riegelZu() ? 'Die Waage ist festgestellt.' : '')));
  }

  function zeichne() {
    buehne();
    const a = aufgabe(), s = a.zustand, ziel = ctx.app.querySelector('#gg-aufgabe');
    const legen = s.phase === 'legen' && !s.fertig;
    ziel.innerHTML = `
      <p class="auftrag" id="gg-frage">${esc(s.frage)}</p>
      ${T().steinkasten(ctx, { praefix: 'gg', gelegt: s.gelegt, gesperrt: !legen })}
      <p class="knopfreihe">
        <button type="button" class="knopf haupt wiegen-knopf" data-gg="wiegen"${!legen || !s.gelegt.length || s.gewogen ? ' disabled' : ''}>Wiegen</button>
        ${legen && s.wiegungen >= 3 ? '<button type="button" class="knopf knopf--klein" data-gg="loesung">Zeig mir eine Lösung</button>' : ''}
      </p>
      <p class="rueckmeldung">${esc(s.rueck)}</p>
      ${s.phase === 'zahl' && !s.fertig ? T().ziffern(ctx, { praefix: 'gg', frage: 'Wie viel wiegt der Kiesel?' }) : ''}
      ${s.fertig ? '<p class="knopfreihe"><button type="button" class="knopf haupt" data-gg="weiter">Weiter</button></p>' : ''}`;
    ziel.classList.toggle('loesung-gezeigt', s.fertig && !s.geschafft);
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
    waage.setze([a.kiesel], massen(s).map(m => ({ art: 'stein', masse: m })));
    s.gewogen = false; s.ansage = ''; s.rueck = '';   /* iPad-Befund Ingo 16.11.2026: alter Satz passte nicht mehr zur festgestellten Waage */
  }
  function legeStein(i) {
    const a = aufgabe(), s = a.zustand;
    if (s.phase !== 'legen' || s.fertig || s.gelegt.includes(i)) return;
    s.gelegt.push(i); neuBelegen(a); zeichne();
    T().fokus(ctx, '[data-gg="wiegen"]');
    ctx.ansagen(`${g(SATZ()[i])} liegt auf der rechten Schale.`);
  }
  function zurueck(i, ausBild = false) {
    const a = aufgabe(), s = a.zustand;
    if (s.phase !== 'legen' || s.fertig) return;
    s.gelegt = s.gelegt.filter(x => x !== i); neuBelegen(a); zeichne();
    if (!ausBild) T().fokus(ctx, `[data-gg="stein"][data-i="${i}"]`);
    ctx.ansagen(`${g(SATZ()[i])} liegt wieder im Kasten.`);
  }
  function alleZurueck() {
    const a = aufgabe(), s = a.zustand;
    if (s.phase !== 'legen' || s.fertig) return;
    s.gelegt = []; neuBelegen(a); zeichne(); T().fokus(ctx, '[data-gg="stein"]');
  }

  function wiegen() {
    const a = aufgabe(), s = a.zustand;
    if (s.phase !== 'legen' || s.fertig || !s.gelegt.length || s.gewogen) return;
    const r = waage.wiegen();
    s.gewogen = true; s.wiegungen++; s.ansage = r.ansage;
    const ms = massen(s);
    if (r.vergleich !== 0) {
      s.rueck = r.vergleich > 0 ? 'Die linke Schale ist noch schwerer. Lege mehr dazu.' : 'Jetzt ist die rechte Schale schwerer. Nimm etwas weg.';
    } else if (a.art === 'zweiwege') {
      const k = A().schluessel(ms);
      if (!s.wege.length) { s.wege.push(k); s.rueck = `Super. ${liste(ms)} wiegen zusammen ${a.ziel} g.`; s.frage = 'Findest du noch einen anderen Weg? Nimm andere Steine.'; }
      else if (s.wege.includes(k)) s.rueck = 'Die Waage ist im Gleichgewicht. Das ist aber derselbe Weg wie vorher. Nimm andere Steine.';
      else { s.wege.push(k); s.rueck = `Genau. Zwei Wege: ${s.wege.map(w => liste(w.split('+').map(Number))).join(', und ')}. Beide wiegen ${a.ziel} g.`; fertig(a, true); }
    } else if (a.art === 'unbekannt') {
      s.phase = 'zahl'; s.rueck = 'Die Waage ist im Gleichgewicht. Wie viel wiegt der Kiesel?';
    } else {
      s.rueck = `Genau. ${ms.length > 1 ? `${liste(ms)} sind zusammen ${a.ziel} g` : `Der Stein wiegt ${g(a.ziel)}`}. Die Waage ist im Gleichgewicht.`;
      fertig(a, true);
    }
    zeichne();
    ctx.ansagen(`${s.ansage} ${s.rueck}`);
    T().fokus(ctx, s.fertig ? '[data-gg="weiter"]' : s.phase === 'zahl' ? '#ziffern-feld' : '[data-gg="stein"]:not([disabled])');
  }

  /* „Zeig mir eine Lösung“: eine passende Steinmenge legen (bei „Zwei Wege“ eine andere als die schon gefundene) */
  function loesungZeigen() {
    const a = aufgabe(), s = a.zustand;
    if (s.phase !== 'legen' || s.fertig) return;
    const alle = W().loesungen(a.ziel);
    const sol = alle.find(l => !s.wege.includes(A().schluessel(l))) || W().wenigste(a.ziel);
    const frei = SATZ().map((m, i) => i), gelegt = [];
    for (const m of sol) { const i = frei.find(j => SATZ()[j] === m && !gelegt.includes(j)); gelegt.push(i); }
    s.gelegt = gelegt; s.loesungGezeigt = true;
    neuBelegen(a); const r = waage.wiegen(); s.gewogen = true; s.ansage = r.ansage;
    s.rueck = `So geht es zum Beispiel: ${liste(sol)}.${a.art === 'unbekannt' ? ` Der Kiesel wiegt also ${a.ziel} g.` : ''}`;
    fertig(a, false);
    zeichne(); ctx.ansagen(s.rueck); T().fokus(ctx, '[data-gg="weiter"]');
  }

  function zahlFertig() {
    const a = aufgabe(), s = a.zustand;
    if (s.phase !== 'zahl' || s.fertig) return;
    const v = T().zifferWert(ctx);
    if (v === null) { s.rueck = 'Tippe zuerst eine Zahl ein.'; zeichne(); T().fokus(ctx, '#ziffern-feld'); return; }
    if (v === a.ziel) { s.rueck = `Genau. Der Kiesel wiegt ${a.ziel} g, genauso viel wie deine Steine.`; fertig(a, true); }
    else if (++s.zahlVersuche < 2) s.rueck = 'Rechne die Steine auf der Schale noch einmal zusammen.';
    else { s.rueck = `Deine Steine wiegen zusammen ${a.ziel} g. Also wiegt der Kiesel ${a.ziel} g.`; fertig(a, false); }
    zeichne(); ctx.ansagen(s.rueck); T().fokus(ctx, s.fertig ? '[data-gg="weiter"]' : '#ziffern-feld');
  }

  function weiter() { if (z.i + 1 < z.aufgaben.length) { z.i++; aufgabeZeigen(); } else rundenende(); }
  const stempelSvg = () => T().stempel('<path class="stempel__welle" d="M26 44H74M50 44V70M38 70H62"/><rect class="stempel__kugel" x="62" y="30" width="12" height="10" rx="2"/><circle class="stempel__kugel" cx="32" cy="36" r="6"/>');
  function rundenende() {
    const r = T().rundenende(ctx, { id: ID, praefix: 'gg', stufe: z.stufe, geschafft: z.geschafft.filter(Boolean).length, anzahl: z.aufgaben.length, stempelSvg: stempelSvg(), gespeichertFehler: z.gespeichertFehler });
    waage = null;
    ctx.zeigen(`${kopf(`Stufe ${STUFENNAME[z.stufe]} · Rundenende`)}${r.html}${AM_TISCH(false)}`, 'Rundenende – Gleichgewicht');
    ctx.ansagen(r.text);
    if (r.fehler) ctx.melden(ctx.speicherFehlt);
  }

  const TIPPS = ['Ist die linke Seite noch schwerer? Dann leg mehr dazu.', 'Fang mit dem größten Stein an, der noch passt.', 'Unter der Waage steht jetzt, wie viel deine Steine zusammen wiegen.'];
  function hilfeZeigen() {
    const a = aufgabe();
    if (!a) { T().dialog(ctx, { titel: 'Tipp von Flint', inhalt: `<div class="tipp">${ctx.flintKlein}<p>Wähle eine Stufe. Bei einer Stufe steht: Flint empfiehlt diese Stufe.</p></div>`, knoepfe: '<button type="button" class="knopf haupt" data-dialog="zu">Ich probiere es</button>' }); return; }
    const s = a.zustand, bis = Math.min(hilfeStufe, TIPPS.length - 1);
    if (bis >= 2 && !s.summeAn && !s.fertig) { s.summeAn = true; buehne(); }
    T().tippDialog(ctx, { liste: TIPPS, bis, fertig: s.fertig, weiter: () => { hilfeStufe++; hilfeZeigen(); } });
  }
  const WOERTER = [
    ['der Gewichtsstein', 'Ein Stein mit fester Masse. Auf ihm steht, wie viel er wiegt.'],
    ['die Tafelwaage', 'Eine Waage mit zwei Schalen. Sie zeigt, welche Seite schwerer ist.'],
    ['das Gleichgewicht', 'Die Waage ist gerade. Beide Seiten sind gleich schwer.'],
    ['genauso schwer wie', 'Der Kiesel ist genauso schwer wie die Steine.'],
    ['das Gramm (g)', 'Eine Büroklammer wiegt etwa 1 Gramm.'],
    ['das Kilogramm (kg)', '1 Kilogramm sind 1000 Gramm. 1 kg = 1000 g']
  ];

  function bedienen(e) {
    const imBild = aufgabe() ? T().steinImBild(e, aufgabe().zustand.gelegt) : -1;
    if (imBild >= 0) { zurueck(imBild, true); return true; }
    const b = e.target.closest('[data-gg]');
    if (!b || b.disabled) return false;
    const was = b.dataset.gg;
    if (was === 'stufe') rundeStarten(b.dataset.stufe);
    else if (was === 'stufen') ansichtStufen();
    else if (was === 'hilfe') hilfeZeigen();
    else if (was === 'woerter') T().woerter(ctx, 'Wörter zum Wiegen', WOERTER);
    else if (was === 'stein') legeStein(Number(b.dataset.i));
    else if (was === 'zurueck') zurueck(Number(b.dataset.i));
    else if (was === 'alle-zurueck') alleZurueck();
    else if (was === 'wiegen') wiegen();
    else if (was === 'loesung') loesungZeigen();
    else if (['ziffer', 'loeschen', 'leeren'].includes(was)) T().zifferTaste(ctx, was, b.dataset.z);
    else if (was === 'fertig') zahlFertig();
    else if (was === 'weiter') weiter();
    else return false;
    return true;
  }

  KW.stationen[ID] = { id: ID, stempelSvg, oeffnen(c) { ctx = c; ansichtStufen(); }, bedienen, aufgabe, zustand: () => z, waage: () => waage };
})();
