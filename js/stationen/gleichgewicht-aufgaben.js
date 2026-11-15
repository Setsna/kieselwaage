/* Kieselwaage: Aufgaben der Station „Gleichgewicht“ (Etappe 3b). Klassisches Skript, legt KW.gleichgewichtAufgaben an.
   Nach Dateien/Beispiele-Entwuerfe/gleichgewicht-gramm.md (Entwurf 3a; Mini-Spec Etappe 3 von Ingo freigegeben).
   Getestet in tools/aufgaben-test.html.
   - Links liegt ein Kiesel (leicht/mittel mit Zahl, knifflig verdeckt). Das Kind legt Steine aus dem Satz rechts.
   - Richtig ist JEDE Steinmenge aus dem Satz mit genau der Masse des Kiesels (KW.waage.istLoesung), nicht eine Musterlösung.
   Aufgabenformen:
     ausgleich  { ziel, kiesel }              leicht, mittel
     zweiwege   { ziel, kiesel, anzahl }      mittel: zwei verschiedene Lösungen nötig (anzahl = Zahl aller Lösungen, mind. 2)
     unbekannt  { ziel, kiesel (verdeckt) }   knifflig: ausgleichen, dann Masse eintippen */
(() => {
  'use strict';
  const KW = window.KW = window.KW || {};
  const W = KW.waage;
  const zehner = (a, b) => Array.from({ length: (b - a) / 10 + 1 }, (_, i) => a + 10 * i);
  const mitHoechstens = (n) => z => { const w = W.wenigste(z); return w && w.length <= n; };
  const LEICHT = zehner(100, 500).filter(mitHoechstens(3));
  const MITTEL = zehner(10, 1000).filter(mitHoechstens(5));
  const ZWEI = zehner(20, 500).filter(z => W.loesungen(z).length >= 2);
  const KNIFFLIG = Array.from({ length: 1000 }, (_, i) => i + 1);

  function erzeuger(Z) {
    const kiesel = (ziel, verdeckt = false) => ({ art: 'kiesel', masse: ziel, verdeckt });
    const ausgleich = (liste) => { const ziel = Z.waehle(liste); return { art: 'ausgleich', ziel, kiesel: kiesel(ziel), frage: 'Bring die Waage ins Gleichgewicht.' }; };
    const zweiwege = () => { const ziel = Z.waehle(ZWEI); return { art: 'zweiwege', ziel, kiesel: kiesel(ziel), anzahl: W.loesungen(ziel).length, frage: 'Bring die Waage ins Gleichgewicht.' }; };
    const unbekannt = () => { const ziel = Z.waehle(KNIFFLIG); return { art: 'unbekannt', ziel, kiesel: kiesel(ziel, true), frage: 'Wie schwer ist der Kiesel? Bring die Waage ins Gleichgewicht. Dann tippe ein, wie viel der Kiesel wiegt.' }; };
    function runde(stufe) {
      if (stufe === 'leicht') return Array.from({ length: 6 }, () => ausgleich(LEICHT));
      if (stufe === 'mittel') return Z.mische([...Array.from({ length: 4 }, () => ausgleich(MITTEL)), zweiwege(), zweiwege()]);
      if (stufe === 'knifflig') return Array.from({ length: 6 }, unbekannt);
      throw new Error('unbekannte Stufe: ' + stufe);
    }
    return { ausgleich: () => ausgleich(MITTEL), zweiwege, unbekannt, runde };
  }

  /* Prüfen einer gelegten Schale (Liste von Massen) gegen die Aufgabe */
  const passt = (a, schale) => W.istLoesung(schale, a.ziel);
  /* Zwei Lösungen sind verschieden, wenn sie als Menge von Massen verschieden sind (gleich große Steine zählen als gleich) */
  const schluessel = schale => schale.slice().sort((x, y) => y - x).join('+');

  KW.gleichgewichtAufgaben = Object.assign(erzeuger(KW.zufall), { mitZufall: erzeuger, passt, schluessel, LEICHT, MITTEL, ZWEI });
})();
