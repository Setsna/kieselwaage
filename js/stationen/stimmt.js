/* Kieselwaage: Station „Kann das stimmen?“ (Etappe 4).
   Klassisches Skript, trägt sich in KW.stationen.stimmt ein. Flint behauptet etwas über zwei Schalen. Das Kind sagt
   zuerst „Stimmt“ oder „Stimmt nicht“, dann prüft es mit der Waage (Riegel wie in „Massen vergleichen“).
   Ob die Behauptung stimmt, rechnet KW.waage (js/stationen/stimmt-aufgaben.js). Ein Versuch je Aufgabe, die Waage zeigt das Ergebnis.
   Texte von Ingo freigegeben am 16.11.2026.
   Gespeichert werden nur runden und stempel. Barrierefreiheit und Sicherheit wie in js/stationen/vergleichen.js. */
(() => {
  'use strict';
  const KW = window.KW = window.KW || {};
  KW.stationen = KW.stationen || {};
  const ID = 'stimmt';
  const C = () => KW.config;
  const A = () => KW.stimmtAufgaben;
  const ST = () => KW.stand;
  const T = () => KW.teile;
  const B = () => KW.waageBild;
  const STUFENNAME = { leicht: 'leicht', mittel: 'mittel', knifflig: 'knifflig' };

  let ctx = null, z = null, waage = null, hilfeStufe = 0;
  const esc = s => ctx.esc(s);
  const summe = l => l.reduce((a, d) => a + d.masse, 0);
  const ZEIGT = { '1': 'Die linke Schale ist schwerer.', '-1': 'Die rechte Schale ist schwerer.', '0': 'Die Waage ist im Gleichgewicht.' };

  const kopf = unterzeile => T().kopf(ctx, { titel: 'Kann das stimmen?', unterzeile, praefix: 'ks' });
  const SO_GEHTS = offen => T().aufklapper(ctx, { klasse: 'so-gehts', titel: "So geht's", offen, schritte: [
    'Lies, was Flint behauptet.', 'Tippe an: Stimmt oder Stimmt nicht.', 'Tippe auf Wiegen. Die Waage zeigt, ob du recht hast.'] });
  const AM_TISCH = offen => T().aufklapper(ctx, { klasse: 'am-tisch', titel: 'Am Tisch: Behauptungen prüfen', offen, schritte: [
    'Schreibt zu zweit drei Behauptungen auf, zum Beispiel: „Mein Mäppchen ist schwerer als mein Heft.“',
    'Tauscht die Zettel. Kreuzt an: stimmt oder stimmt nicht.',
    'Prüft jede Behauptung mit der Kleiderbügelwaage.',
    'Findet eine Behauptung, bei der fast alle falsch geraten haben.'] });

  function ansichtStufen() {
    z = null; waage = null;
    const erstesMal = T().erstesMal(ID);
    ctx.zeigen(`
      ${kopf('Behauptungen prüfen')}
      ${erstesMal ? '<p class="flint-satz">Ich behaupte manchmal Sachen, die nicht stimmen. Prüf mich mit der Waage!</p>' : ''}
      ${SO_GEHTS(erstesMal)}
      ${T().stufenListe(ctx, ID, 'ks')}
      ${AM_TISCH(false)}`, 'Kann das stimmen?');
  }

  function rundeStarten(stufe) { z = { stufe, aufgaben: A().runde(stufe), i: 0, geschafft: [], gespeichertFehler: false }; aufgabeZeigen(); }
  const aufgabe = () => z && z.aufgaben[z.i];

  function aufgabeZeigen() {
    const a = aufgabe();
    hilfeStufe = 0;
    a.zustand = { antwort: null, gewogen: false, fertig: false, geschafft: false, summenAn: false, rueck: '', ansage: '' };
    waage = B().neu({ bildStand: C().bildStand }).setze(a.links, a.rechts);
    ctx.zeigen(`
      ${kopf(`Stufe ${STUFENNAME[z.stufe]} · Aufgabe ${z.i + 1} von ${z.aufgaben.length}`)}
      <div class="station-flaeche">
        <div class="buehne buehne--waage" id="ks-buehne"></div>
        <section class="papier aufgabe" id="ks-aufgabe" aria-labelledby="ks-frage"></section>
      </div>`, `Aufgabe ${z.i + 1} – Kann das stimmen?`);
    zeichne();
  }

  function buehne() {
    const a = aufgabe(), s = a.zustand, b = ctx.app.querySelector('#ks-buehne');
    if (!b) return;
    b.textContent = '';
    const p = (k, t) => { const e = document.createElement('p'); e.className = k; e.textContent = t; return e; };
    const fig = document.createElement('figure'); fig.className = 'waage-figur';
    fig.appendChild(waage.el);
    const cap = document.createElement('figcaption');
    cap.appendChild(p('waage-figur__inhalt', waage.beschreibung()));
    if ((s.summenAn || s.gewogen) && a.art !== 'dinge' && a.art !== 'taeuscht') cap.appendChild(p('waage-figur__summe', `Zusammen: links ${summe(a.links)} g, rechts ${summe(a.rechts)} g.`));
    fig.appendChild(cap); b.appendChild(fig);
    b.appendChild(p('waage-ergebnis', s.ansage || 'Die Waage ist festgestellt.'));
  }

  function zeichne() {
    buehne();
    const a = aufgabe(), s = a.zustand, ziel = ctx.app.querySelector('#ks-aufgabe');
    ziel.innerHTML = `
      <div class="flint-aussage">${ctx.flintKlein}<div><p class="frage-klein" id="ks-frage">Flint behauptet:</p><p class="aussage">${esc(a.satz)}</p></div></div>
      <div class="antworten antworten--reihe antworten--zwei" role="group" aria-label="Kann das stimmen?">
        ${[['ja', 'Stimmt'], ['nein', 'Stimmt nicht']].map(([w, t]) => `<button type="button" class="knopf antwort-knopf${s.gewogen && (w === 'ja') === a.loesung ? ' ist-richtig' : ''}" data-ks="antwort" data-w="${w}" aria-pressed="${s.antwort === w}"${s.gewogen ? ' disabled' : ''}>${t}</button>`).join('')}
      </div>
      <p class="knopfreihe"><button type="button" class="knopf haupt wiegen-knopf" data-ks="wiegen"${s.antwort === null || s.gewogen ? ' disabled' : ''}>Wiegen</button></p>
      ${s.antwort === null ? '<p class="leise">Tippe zuerst an, was du denkst. Dann kannst du wiegen.</p>' : ''}
      <p class="rueckmeldung">${esc(s.rueck)}</p>
      ${s.fertig ? '<p class="knopfreihe"><button type="button" class="knopf haupt" data-ks="weiter">Weiter</button></p>' : ''}`;
    ziel.classList.toggle('loesung-gezeigt', s.fertig && !s.geschafft);
  }

  function fertig(a, ok) {
    const s = a.zustand;
    s.fertig = true;
    if (s.geschafft || !ok) return;
    s.geschafft = true; z.geschafft[z.i] = true;
    if (!ST().istVorschau && ST().rundeGeschafft(ID, z.stufe) === false) z.gespeichertFehler = true;
  }

  function antwort(w) { const s = aufgabe().zustand; if (s.gewogen) return; s.antwort = w; zeichne(); T().fokus(ctx, '[data-ks="wiegen"]'); }
  function wiegen() {
    const a = aufgabe(), s = a.zustand;
    if (s.antwort === null || s.gewogen) return;
    const r = waage.wiegen();
    s.gewogen = true; s.ansage = r.ansage;
    const ok = (s.antwort === 'ja') === a.loesung;
    const urteil = a.loesung ? 'Flints Satz stimmt.' : 'Flints Satz stimmt nicht.';
    let grund = '';
    if (a.art === 'taeuscht') grund = ' Der Luftballon ist groß, aber fast nur Luft. Groß heißt nicht schwer.';
    else if (a.art !== 'dinge') grund = ` Links liegen ${summe(a.links)} g, rechts ${summe(a.rechts)} g.`;
    s.rueck = `${ok ? 'Genau. ' : ''}${ZEIGT[String(r.vergleich)]}${grund} ${urteil}`;
    fertig(a, ok);
    zeichne(); ctx.ansagen(`${s.ansage} ${s.rueck}`); T().fokus(ctx, '[data-ks="weiter"]');
    if (s.geschafft) T().aufleuchten(ctx.app.querySelector('.ist-richtig'));
  }

  function weiter() { if (z.i + 1 < z.aufgaben.length) { z.i++; aufgabeZeigen(); } else rundenende(); }
  const stempelSvg = () => T().stempel('<path class="stempel__welle" d="M40 34Q40 26 50 26Q60 26 60 34Q60 41 50 44V52"/><circle class="stempel__kugel" cx="50" cy="62" r="4"/><path class="stempel__welle" d="M30 72H70"/>');
  function rundenende() {
    const r = T().rundenende(ctx, { id: ID, praefix: 'ks', stufe: z.stufe, geschafft: z.geschafft.filter(Boolean).length, anzahl: z.aufgaben.length, stempelSvg: stempelSvg(), gespeichertFehler: z.gespeichertFehler });
    waage = null;
    ctx.zeigen(`${kopf(`Stufe ${STUFENNAME[z.stufe]} · Rundenende`)}${r.html}${AM_TISCH(false)}`, 'Rundenende – Kann das stimmen?');
    ctx.ansagen(r.text);
    if (r.fehler) ctx.melden(ctx.speicherFehlt);
  }

  const TIPPS = {
    dinge: ['Stell dir beides in deinen Händen vor.', 'Lies genau: Steht da schwerer oder leichter?'],
    kiesel: ['Rechne zusammen, was auf jeder Schale liegt.', 'Unter der Waage steht jetzt, wie viel auf jeder Schale liegt.'],
    taeuscht: ['Ist ein großes Ding immer schwer?', 'Denk an einen Luftballon in deiner Hand.'],
    kilo: ['1 kg sind 1000 g. Ein halbes Kilogramm sind 500 g. Ein Viertel Kilogramm sind 250 g.', 'Unter der Waage steht jetzt, wie viel auf jeder Schale liegt.']
  };
  function hilfeZeigen() {
    const a = aufgabe();
    if (!a) { T().dialog(ctx, { titel: 'Tipp von Flint', inhalt: `<div class="tipp">${ctx.flintKlein}<p>Wähle eine Stufe. Bei einer Stufe steht: Flint empfiehlt diese Stufe.</p></div>`, knoepfe: '<button type="button" class="knopf haupt" data-dialog="zu">Ich probiere es</button>' }); return; }
    const s = a.zustand, liste = TIPPS[a.art], bis = Math.min(hilfeStufe, liste.length - 1);
    if ((a.art === 'kiesel' || a.art === 'kilo') && bis >= 1 && !s.summenAn && !s.fertig) { s.summenAn = true; buehne(); }
    T().tippDialog(ctx, { liste, bis, fertig: s.fertig, weiter: () => { hilfeStufe++; hilfeZeigen(); } });
  }
  const WOERTER = [
    ['schwerer als / leichter als', 'Das Buch ist schwerer als der Stift.'],
    ['genauso schwer wie', '1 kg ist genauso schwer wie 1000 g.'],
    ['das Gleichgewicht', 'Die Waage ist gerade. Beide Seiten sind gleich schwer.'],
    ['stimmt / stimmt nicht', 'Die Waage zeigt, ob eine Behauptung stimmt.']
  ];

  function bedienen(e) {
    const b = e.target.closest('[data-ks]');
    if (!b || b.disabled) return false;
    const was = b.dataset.ks;
    if (was === 'stufe') rundeStarten(b.dataset.stufe);
    else if (was === 'stufen') ansichtStufen();
    else if (was === 'hilfe') hilfeZeigen();
    else if (was === 'woerter') T().woerter(ctx, 'Wörter zum Wiegen', WOERTER);
    else if (was === 'antwort') antwort(b.dataset.w);
    else if (was === 'wiegen') wiegen();
    else if (was === 'weiter') weiter();
    else return false;
    return true;
  }

  KW.stationen[ID] = { id: ID, stempelSvg, oeffnen(c) { ctx = c; ansichtStufen(); }, bedienen, aufgabe, zustand: () => z, waage: () => waage };
})();
