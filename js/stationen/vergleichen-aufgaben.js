/* Kieselwaage: Aufgaben der Station „Massen vergleichen“ (Etappe 2b). Klassisches Skript, legt KW.vergleichenAufgaben an.
   Inhalt nach Dateien/Beispiele-Entwuerfe/vergleichen.md (von Ingo freigegeben am 15.11.2026).
   Getestet in tools/aufgaben-test.html.

   Grundsätze:
   - Aufgaben werden erzeugt (KW.zufall, in Tests mit festem Startwert). Die LÖSUNG rechnet immer KW.waage
     aus den Massen; sie steht nirgends als Liste im Quelltext.
   - Gegenstände haben einen Bereich von–bis. Ein Paar kommt nur, wenn der schwerere auch im ungünstigsten Fall
     mindestens doppelt so schwer ist (bis × 2 ≤ von). So zeigt die Waage auch bei echten Dingen das Richtige.
   - Die Waage rechnet mit dem Rechenwert (wert). Massen der Gegenstände und Muscheln sieht das Kind nicht.

   Aufgabenformen (alle mit art, frage, loesung):
     paar      { links: [ding], rechts: [ding] }                 loesung: 1 | -1        (leicht)
     summe     { links: [kiesel…], rechts: [kiesel…] }           loesung: 1 | 0 | -1    (mittel)
     taeuscht  { links: [ding], rechts: [ding] }                 loesung: 1 | -1        (mittel, Luftballon)
     welche    { waagen: [{ links, rechts }, ×3] }               loesung: Index der Waage im Gleichgewicht (mittel)
     ordnen    { muscheln: [muschel…] }                          loesung: Formen von leicht nach schwer (knifflig) */
(() => {
  'use strict';
  const KW = window.KW = window.KW || {};
  const W = KW.waage;

  /* Gegenstände (Entwurf Abschnitt 1). von/bis/wert in Gramm. */
  const DINGE = [
    { id: 'bueroklammer', name: 'eine Büroklammer', von: 1, bis: 2, wert: 1 },
    { id: 'luftballon', name: 'ein Luftballon', von: 2, bis: 5, wert: 3, gross: true },
    { id: 'bleistift', name: 'ein Bleistift', von: 4, bis: 7, wert: 5 },
    { id: 'murmel', name: 'eine Murmel', von: 4, bis: 6, wert: 5 },
    { id: 'radiergummi', name: 'ein Radiergummi', von: 15, bis: 30, wert: 20 },
    { id: 'klebestift', name: 'ein Klebestift', von: 15, bis: 45, wert: 25 },
    { id: 'heft', name: 'ein Heft', von: 60, bis: 100, wert: 80 },
    { id: 'schokolade', name: 'eine Tafel Schokolade', von: 100, bis: 100, wert: 100 },
    { id: 'apfel', name: 'ein Apfel', von: 120, bis: 220, wert: 160 },
    { id: 'brotdose', name: 'eine leere Brotdose', von: 100, bis: 250, wert: 150 },
    { id: 'turnschuh', name: 'ein Turnschuh', von: 200, bis: 350, wert: 250 },
    { id: 'lesebuch', name: 'ein Lesebuch', von: 350, bis: 600, wert: 400 },
    { id: 'trinkflasche', name: 'eine volle Trinkflasche', von: 550, bis: 750, wert: 600 },
    { id: 'schultasche', name: 'eine gepackte Schultasche', von: 2500, bis: 5000, wert: 3000 }
  ].map(d => Object.freeze(Object.assign({ art: 'ding', masse: d.wert }, d)));
  const DING = Object.fromEntries(DINGE.map(d => [d.id, d]));

  /* Ist schwer sicher mindestens doppelt so schwer wie leicht? */
  const sicherDoppelt = (leicht, schwer) => leicht.bis * 2 <= schwer.von;
  /* Paare für „leicht“: ohne den Luftballon (der gehört zu „Größe täuscht“) */
  const PAARE = [];
  for (const a of DINGE) for (const b of DINGE) if (a !== b && !a.gross && !b.gross && sicherDoppelt(a, b)) PAARE.push([a, b]);
  /* „Größe täuscht“: der Luftballon gegen kleine, schwerere Dinge */
  const TAEUSCHT = ['radiergummi', 'klebestift', 'apfel'].map(id => DING[id]).filter(d => sicherDoppelt(DING.luftballon, d));

  const KIESEL_WERTE = [10, 20, 50, 100, 200, 250, 300, 500];
  const MAX_SCHALE = 1000;
  const MUSCHEL_FORMEN = ['herz', 'jakobs', 'schnecke', 'mies'];
  const kiesel = m => ({ art: 'kiesel', masse: m });
  const massen = liste => liste.map(x => x.masse);
  const loesungVon = (l, r) => W.vergleiche(massen(l), massen(r));

  /* Alle Schalen aus 1 bis 3 Kieseln (Wiederholung erlaubt), Summe höchstens 1000 g, absteigend sortiert */
  const SCHALEN = [];
  (function sammle(start, bisher) {
    if (bisher.length) { if (bisher.reduce((a, b) => a + b, 0) <= MAX_SCHALE) SCHALEN.push(bisher.slice()); }
    if (bisher.length === 3) return;
    for (let i = start; i < KIESEL_WERTE.length; i++) { bisher.push(KIESEL_WERTE[KIESEL_WERTE.length - 1 - i]); sammle(i, bisher); bisher.pop(); }
  })(0, []);
  const summe = l => l.reduce((a, b) => a + b, 0);

  function erzeuger(Z) {
    const seiten = (a, b) => Z.zahl(2) === 0 ? [a, b] : [b, a];

    function paar(schon = new Set()) {
      let p, schl;
      for (let i = 0; i < 50; i++) { p = Z.waehle(PAARE); schl = p.map(d => d.id).sort().join('|'); if (!schon.has(schl)) break; }
      schon.add(schl);
      const [l, r] = seiten([p[0]], [p[1]]);
      return { art: 'paar', frage: `Was ist schwerer: ${l[0].name} oder ${r[0].name}?`, links: l, rechts: r, loesung: loesungVon(l, r) };
    }

    function summeAufgabe(gleich) {
      for (;;) {
        const l = Z.waehle(SCHALEN);
        const kandidaten = SCHALEN.filter(r => gleich ? (summe(r) === summe(l) && r.join() !== l.join()) : summe(r) !== summe(l));
        if (!kandidaten.length) continue;
        const r = Z.waehle(kandidaten);
        const L = l.map(kiesel), R = r.map(kiesel);
        return { art: 'summe', frage: 'Welche Seite sinkt?', links: L, rechts: R, loesung: loesungVon(L, R) };
      }
    }

    function kleineWaage(gleich) {
      for (;;) {
        const l = Z.waehle(SCHALEN.filter(s => s.length <= 2));
        const kand = SCHALEN.filter(r => r.length <= 2 && (gleich ? summe(r) === summe(l) && r.join() !== l.join() : summe(r) !== summe(l)));
        if (kand.length) return { links: l.map(kiesel), rechts: Z.waehle(kand).map(kiesel) };
      }
    }
    function welche() {
      const ziel = Z.zahl(3);
      const waagen = [0, 1, 2].map(i => kleineWaage(i === ziel));
      /* Lösung aus den Massen berechnet, nicht aus „ziel“ übernommen */
      const im = waagen.map((w, i) => loesungVon(w.links, w.rechts) === 0 ? i : -1).filter(i => i >= 0);
      return { art: 'welche', frage: 'Welche Waage ist im Gleichgewicht? Tippe sie an.', waagen, loesung: im.length === 1 ? im[0] : null };
    }

    function taeuscht() {
      const d = Z.waehle(TAEUSCHT);
      const [l, r] = seiten([DING.luftballon], [d]);
      return { art: 'taeuscht', frage: 'Der Luftballon ist viel größer. Ist er auch schwerer?', links: l, rechts: r, loesung: loesungVon(l, r) };
    }

    function ordnen(n) {
      const formen = Z.mische(MUSCHEL_FORMEN).slice(0, n);
      /* verschiedene Massen, Vielfache von 5 zwischen 10 und 90 g (mindestens 5 g Abstand) */
      const werte = Z.mische(Array.from({ length: 17 }, (_, i) => 10 + 5 * i)).slice(0, n);
      const muscheln = formen.map((form, i) => ({ art: 'muschel', form, masse: werte[i] }));
      /* Lösung: nur mit der Waage sortiert (paarweise vergleichen), nicht über die Zahlen selbst */
      /* vergleiche(a, b) = -1, wenn a leichter ist: dann kommt a zuerst */
      const reihe = muscheln.slice().sort((a, b) => W.vergleiche([a.masse], [b.masse]));
      return { art: 'ordnen', frage: 'Ordne die Muscheln: von leicht nach schwer.', muscheln, loesung: reihe.map(m => m.form) };
    }

    /* Eine Runde mit 6 Aufgaben */
    function runde(stufe) {
      if (stufe === 'leicht') { const schon = new Set(); return Array.from({ length: 6 }, () => paar(schon)); }
      if (stufe === 'mittel') {
        const gleich = 1 + Z.zahl(2);   /* 1 oder 2 der 4 Summen-Aufgaben im Gleichgewicht */
        const summen = Array.from({ length: 4 }, (_, i) => summeAufgabe(i < gleich));
        return Z.mische([...summen, welche(), taeuscht()]);
      }
      if (stufe === 'knifflig') return [3, 3, 3, 4, 4, 4].map(ordnen);
      throw new Error('unbekannte Stufe: ' + stufe);
    }
    return { paar, summe: summeAufgabe, welche, taeuscht, ordnen, runde };
  }

  KW.vergleichenAufgaben = Object.assign(erzeuger(KW.zufall), {
    mitZufall: erzeuger,
    DINGE, PAARE, TAEUSCHT, KIESEL_WERTE, MAX_SCHALE, sicherDoppelt
  });
})();
