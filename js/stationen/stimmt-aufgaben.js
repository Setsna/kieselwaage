/* Kieselwaage: Aufgaben der Station „Kann das stimmen?“ (Etappe 4). Klassisches Skript, legt KW.stimmtAufgaben an.
   Nach Mini-Spec Etappe 1 (Station 4) und Buch S. 73/77 („Kann das stimmen?“), eigene Sätze. Entwurf der Texte:
   dem Textentwurf zu Etappe 4 (von Ingo freigegeben am 16.11.2026).
   Jede Behauptung vergleicht zwei Seiten einer Waage: links ist schwerer / leichter / genauso schwer wie rechts.
   Ob sie stimmt, rechnet KW.waage aus den Massen (loesung: true | false), nie aus einer Liste.
     leicht    Gegenstände (nur Paare, die sicher doppelt so schwer sind)
     mittel    Kiesel mit Zahl (Summen, auch Gleichgewicht) und einmal „Größe täuscht“ (Luftballon)
     knifflig  1 kg, ein halbes Kilogramm, ein Viertel Kilogramm gegen Gewichtssteine in Gramm */
(() => {
  'use strict';
  const KW = window.KW = window.KW || {};
  const W = KW.waage;
  const gross = s => s.charAt(0).toUpperCase() + s.slice(1);
  const BEZ = { '1': 'schwerer als', '-1': 'leichter als', '0': 'genauso schwer wie' };
  const steinText = m => m >= 1000 ? `${m / 1000} kg` : `${m} g`;
  const aufzaehlen = ms => ms.length === 1 ? steinText(ms[0]) : `${ms.slice(0, -1).map(steinText).join(', ')} und ${steinText(ms[ms.length - 1])}`;
  const WORT = { 1000: '1 kg', 500: 'ein halbes Kilogramm', 250: 'ein Viertel Kilogramm' };
  const SATZ = KW.config.waage.gewichtssteine;

  function erzeuger(Z) {
    const masse = l => l.map(x => x.masse);
    /* behauptet: 1 | -1 | 0 („links ist … als rechts“); loesung = stimmt die Behauptung? */
    const fertig = (o, behauptet) => Object.assign(o, { behauptet, loesung: W.vergleiche(masse(o.links), masse(o.rechts)) === behauptet });
    /* Etwa die Hälfte soll stimmen (sonst lohnt „immer stimmt nicht“): erst entscheiden, dann die Behauptung wählen.
       Ob sie stimmt, rechnet danach trotzdem fertig() aus den Massen. */
    const behauptung = o => { const v = W.vergleiche(masse(o.links), masse(o.rechts)); return Z.zahl(2) ? v : Z.waehle([1, -1, 0].filter(b => b !== v)); };

    function dinge() {
      const [leicht, schwer] = Z.waehle(KW.vergleichenAufgaben.PAARE);
      const [l, r] = Z.zahl(2) ? [leicht, schwer] : [schwer, leicht];
      const b = Z.zahl(2) ? 1 : -1;   /* Gegenstände sind nie gleich schwer: schwerer/leichter, je zur Hälfte wahr */
      return fertig({ art: 'dinge', links: [l], rechts: [r], satz: `${gross(l.name)} ist ${BEZ[b]} ${r.name}.` }, b);
    }
    function kiesel() {
      const werte = KW.vergleichenAufgaben.KIESEL_WERTE.filter(w => w <= 300);
      const n = () => Z.zwischen(1, 2), liste = () => Array.from({ length: n() }, () => Z.waehle(werte)).sort((a, b) => b - a);
      let l = liste(), r = liste();
      if (Z.zahl(3) === 0) {   /* etwa jede dritte: wirklich gleich schwer */
        const s = l.reduce((a, b) => a + b, 0);
        const g = werte.find(w => w === s) ? [s] : werte.filter(w => w < s && werte.includes(s - w)).map(w => [w, s - w])[0];
        if (g && aufzaehlen(g) !== aufzaehlen(l)) r = g.slice().sort((a, b) => b - a);
      }
      const L = l.map(m => ({ art: 'kiesel', masse: m })), R = r.map(m => ({ art: 'kiesel', masse: m }));
      const b = behauptung({ links: L, rechts: R });
      const vorn = l.length > 1 ? `${aufzaehlen(l)} sind zusammen` : `${aufzaehlen(l)} ist`;
      return fertig({ art: 'kiesel', links: L, rechts: R, satz: `${vorn} ${BEZ[b]} ${aufzaehlen(r)}.` }, b);
    }
    function taeuscht() {
      const D = KW.vergleichenAufgaben.DINGE, ballon = D.find(d => d.id === 'luftballon');
      const anderes = Z.waehle(KW.vergleichenAufgaben.TAEUSCHT);
      return fertig({ art: 'taeuscht', links: [ballon], rechts: [anderes], satz: `Der Luftballon ist viel größer als ${anderes.name.replace(/^ein /, 'der ').replace(/^eine /, 'die ')}. Also ist er auch schwerer.` }, 1);
    }
    function kilo() {
      const T = Z.waehle([1000, 500, 250]);
      const ohneKilo = SATZ.filter(m => m !== 1000);
      /* rechts: Steine mit Summe T (gleich) oder T ± 10 bis 50 g */
      let ziel = T;
      if (Z.zahl(3) !== 0) ziel = T + Z.waehle([-50, -20, -10, 10, 20, 50]);
      const steine = W.loesungen(ziel, ohneKilo).filter(l => l.length >= 2 && l.length <= 5);
      if (!steine.length) return kilo();
      const r = Z.waehle(steine);
      const links = T === 1000 ? [{ art: 'stein', masse: 1000 }] : [{ art: 'kiesel', masse: T, verdeckt: true }];
      const b = behauptung({ links, rechts: r.map(m => ({ masse: m })) });
      return fertig({ art: 'kilo', wort: WORT[T], links, rechts: r.map(m => ({ art: 'stein', masse: m })), satz: `${gross(WORT[T])} ist ${BEZ[b]} ${aufzaehlen(r)} zusammen.` }, b);
    }
    function runde(stufe) {
      if (stufe === 'leicht') return Array.from({ length: 6 }, dinge);
      if (stufe === 'mittel') return Z.mische([kiesel(), kiesel(), kiesel(), kiesel(), kiesel(), taeuscht()]);
      if (stufe === 'knifflig') return Array.from({ length: 6 }, kilo);
      throw new Error('unbekannte Stufe: ' + stufe);
    }
    return { dinge, kiesel, taeuscht, kilo, runde };
  }

  KW.stimmtAufgaben = Object.assign(erzeuger(KW.zufall), { mitZufall: erzeuger, BEZ, WORT });
})();
