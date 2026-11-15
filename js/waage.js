/* Kieselwaage: der Waagenbaustein (Etappe 1b). Nur Rechnung, keine Darstellung.
   Klassisches Skript, legt window.KW.waage an. Getestet in tools/waage-test.html.

   Fachregeln (CLAUDE.md, „leicht zu zerstören“):
   - Massen sind ganze Zahlen in Gramm, mindestens 1. Alles andere ist ein Fehler, es wird nie still gerundet.
   - Die schwerere Seite sinkt. Gleichgewicht nur bei GENAU gleicher Masse, ohne Toleranz.
   - Der Ausschlag hängt nur vom Vorzeichen der Differenz ab, nie vom Zufall und nie von ihrer Größe
     (fester Winkel, Ingo 15.11.2026).
   - Lösungen werden berechnet, nicht aus einer Liste gelesen. Gleich große Steine zählen als gleich:
     „100 g + 100 g“ ist eine Lösung, egal welcher der beiden 100er-Steine zuerst liegt.

   Eine Schale ist eine Liste von Massen in Gramm, z. B. [200, 50, 5]. Eine leere Liste ist eine leere Schale.
   Richtung: vergleiche() gibt 1, wenn die LINKE Schale schwerer ist, -1 bei rechts, 0 bei Gleichgewicht.
   neigung() gibt den Drehwinkel des Balkens in Grad, wie ihn SVG versteht (positiv = im Uhrzeigersinn,
   die rechte Seite sinkt). Links schwerer heißt also negativer Winkel. */
(() => {
  'use strict';
  const KW = window.KW = window.KW || {};
  const C = KW.config.waage;

  /* Eine Masse prüfen: ganze Zahl, mindestens 1 Gramm */
  function masse(x) {
    if (typeof x !== 'number' || !Number.isInteger(x) || x < 1) {
      throw new Error(`Keine gültige Masse: ${String(x)} (erlaubt sind ganze Gramm ab 1)`);
    }
    return x;
  }

  /* Gesamtmasse einer Schale */
  function summe(schale) {
    if (!Array.isArray(schale)) throw new Error('Eine Schale ist eine Liste von Massen.');
    let s = 0;
    for (const x of schale) s += masse(x);
    if (!Number.isSafeInteger(s)) throw new Error('Masse zu groß.');
    return s;
  }

  /* 1: links schwerer, -1: rechts schwerer, 0: Gleichgewicht (genau gleich) */
  function vergleiche(links, rechts) {
    const d = summe(links) - summe(rechts);
    return d > 0 ? 1 : d < 0 ? -1 : 0;
  }

  /* Drehwinkel des Balkens in Grad (SVG: positiv = rechte Seite sinkt). 0 statt -0. */
  function neigung(links, rechts) {
    const v = vergleiche(links, rechts);
    return v === 0 ? 0 : -v * C.neigungGrad;
  }

  /* Text für den aria-live-Bereich */
  function ansage(links, rechts) {
    const v = vergleiche(links, rechts);
    if (v > 0) return 'Die linke Schale ist schwerer.';
    if (v < 0) return 'Die rechte Schale ist schwerer.';
    return 'Die Waage ist im Gleichgewicht.';
  }

  /* Alle Möglichkeiten, aus den Steinen genau die Zielmasse zu legen.
     Jede Lösung ist eine absteigend sortierte Liste. Gleich große Steine zählen als gleich.
     Die Reihenfolge ist fest: Lösungen mit möglichst vielen großen Steinen zuerst. */
  function loesungen(ziel, steine = C.gewichtssteine) {
    masse(ziel);
    steine.forEach(masse);
    /* Steine nach Größe zählen: [[1000, 1], [500, 1], [200, 1], [100, 2], …] */
    const anzahl = new Map();
    for (const s of steine) anzahl.set(s, (anzahl.get(s) || 0) + 1);
    const sorten = [...anzahl.entries()].sort((a, b) => b[0] - a[0]);
    /* Was ab Sorte i noch höchstens zusammenkommt (zum frühen Abbrechen) */
    const rest = sorten.map((_, i) => sorten.slice(i).reduce((s, [w, n]) => s + w * n, 0));
    const aus = [];
    (function suche(i, offen, gewaehlt) {
      if (offen === 0) { aus.push(gewaehlt.slice()); return; }
      if (i >= sorten.length || rest[i] < offen) return;
      const [w, n] = sorten[i];
      const max = Math.min(n, Math.floor(offen / w));
      for (let k = max; k >= 0; k--) {
        for (let j = 0; j < k; j++) gewaehlt.push(w);
        suche(i + 1, offen - k * w, gewaehlt);
        gewaehlt.length -= k;
      }
    })(0, ziel, []);
    return aus;
  }

  /* Lässt sich die Masse mit den Steinen legen? */
  const legbar = (ziel, steine = C.gewichtssteine) => loesungen(ziel, steine).length > 0;

  /* Eine Lösung mit möglichst wenigen Steinen (für Tipps). null, wenn es keine gibt. */
  function wenigste(ziel, steine = C.gewichtssteine) {
    let beste = null;
    for (const l of loesungen(ziel, steine)) if (!beste || l.length < beste.length) beste = l;
    return beste;
  }

  /* Ist eine gelegte Schale eine richtige Lösung? Geprüft wird per Rechnung:
     nur Steine aus dem Satz (nicht mehr als vorhanden) und genau die Zielmasse. */
  function istLoesung(schale, ziel, steine = C.gewichtssteine) {
    masse(ziel);
    const vorrat = new Map();
    for (const s of steine) vorrat.set(masse(s), (vorrat.get(masse(s)) || 0) + 1);
    for (const s of schale) {
      const n = vorrat.get(masse(s)) || 0;
      if (!n) return false;
      vorrat.set(s, n - 1);
    }
    return summe(schale) === ziel;
  }

  KW.waage = { masse, summe, vergleiche, neigung, ansage, loesungen, legbar, wenigste, istLoesung, SATZ: C.gewichtssteine.slice() };
})();
