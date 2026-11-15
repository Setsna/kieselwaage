/* Kieselwaage: Zufall für das Erzeugen von Aufgaben. Klassisches Skript, legt window.KW.zufall an.
   Technik übernommen aus der Chancenbucht (js/zufall.js, 15.11.2026), gekürzt auf das, was die Aufgaben brauchen.
   - Quelle crypto.getRandomValues, Math.random nur als Notlösung (dann quelle = 'Math.random').
   - Ganze Zahlen ohne Schieflage (Verwerfen statt Rest-Rechnung).
   - Fester Startwert (mulberry32) nur für Tests (mitStartwert) und auf localhost über ?startwert=N.
   Der Zufall wählt nur, WELCHE Aufgabe kommt. Die Lösung rechnet immer die Waage (js/waage.js). */
(() => {
  'use strict';
  const KW = window.KW = window.KW || {};
  const ZWEI32 = 4294967296;

  function cryptoQuelle() {
    const puffer = new Uint32Array(256);
    let i = puffer.length;
    return () => {
      if (i >= puffer.length) { crypto.getRandomValues(puffer); i = 0; }
      return puffer[i++];
    };
  }
  function startwertQuelle(startwert) {
    let a = (Number(startwert) >>> 0) || 1;
    return () => {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0);
    };
  }
  const notQuelle = () => () => Math.floor(Math.random() * ZWEI32) >>> 0;

  function baue(quelle, name) {
    /* Ganze Zahl in [0, n) */
    function zahl(n) {
      if (!Number.isInteger(n) || n < 1 || n > ZWEI32) throw new Error('zahl(n): n muss eine ganze Zahl von 1 bis 2^32 sein');
      const grenze = ZWEI32 - (ZWEI32 % n);
      let x;
      do { x = quelle(); } while (x >= grenze);
      return x % n;
    }
    /* Ganze Zahl von a bis b (beide eingeschlossen) */
    const zwischen = (a, b) => a + zahl(b - a + 1);
    /* Ein Element aus einer Liste */
    function waehle(liste) {
      if (!liste || !liste.length) throw new Error('waehle: leere Liste');
      return liste[zahl(liste.length)];
    }
    /* Neue, gemischte Liste (Fisher-Yates) */
    function mische(liste) {
      const a = liste.slice();
      for (let i = a.length - 1; i > 0; i--) { const j = zahl(i + 1); [a[i], a[j]] = [a[j], a[i]]; }
      return a;
    }
    return { quelle: name, zahl, zwischen, waehle, mische };
  }

  const hatCrypto = typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function';
  let standard = hatCrypto ? baue(cryptoQuelle(), 'crypto') : baue(notQuelle(), 'Math.random');
  const LOKAL = typeof location !== 'undefined' && ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
  const sw = LOKAL ? new URLSearchParams(location.search).get('startwert') : null;
  if (sw !== null && /^\d{1,9}$/.test(sw)) standard = baue(startwertQuelle(Number(sw)), 'startwert');

  KW.zufall = Object.assign({}, standard, {
    mitStartwert: n => baue(startwertQuelle(n), 'startwert')
  });
})();
