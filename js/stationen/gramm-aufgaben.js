/* Kieselwaage: Aufgaben der Station „Gramm und Kilogramm“ (Etappe 3b). Klassisches Skript, legt KW.grammAufgaben an.
   Nach Dateien/Beispiele-Entwuerfe/gleichgewicht-gramm.md (Entwurf 3a). Getestet in tools/aufgaben-test.html.
   Lösungen werden aus den Massen berechnet (KW.waage.summe), nie aus einer Liste gelesen.
   Aufgabenformen:
     ablesen   { ding, steine }                 leicht: Waage im Gleichgewicht, Zahl = Summe der Steine
     einheit   { satz, zahl, einheit }          leicht: „Gramm oder Kilogramm?“ (einheit 'g' | 'kg')
     ergaenzen { vorhanden, rest }              mittel: links 1 kg, rechts vorhanden; fehlend = 1000 − Summe (legen und eintippen)
     bruch     { wort, ziel, kiesel }           mittel: „Lege ein halbes Kilogramm.“ (jede passende Steinmenge zählt)
     kgg       { kg, g, ziel, kiesel }          knifflig: „Lege 1 kg 250 g.“, dann Gramm eintippen (ziel = 1000·kg + g)
     gkg       { ziel, kiesel }                 knifflig: „1350 g sind 1 kg und … g“: ausgleichen, dann den Gramm-Teil eintippen */
(() => {
  'use strict';
  const KW = window.KW = window.KW || {};
  const W = KW.waage;
  const SATZ = KW.config.waage.gewichtssteine;
  const gross = s => s.charAt(0).toUpperCase() + s.slice(1);

  /* Gegenstände aus Etappe 2, die sich mit dem Satz legen lassen (nicht die Schultasche) */
  const dingeAblesen = () => KW.vergleichenAufgaben.DINGE.filter(d => d.bis <= 2000);
  /* „Kilogramm oder Gramm?“: Gegenstände mit Rechenwert und fünf nur für diese Frage (Entwurf, Frage 1 an Ingo) */
  const EINHEIT_KG = [
    { name: 'ein Kind aus der 3. Klasse', zahl: 28 }, { name: 'eine Packung Mehl', zahl: 1 },
    { name: 'ein Fahrrad für Kinder', zahl: 10 }, { name: 'eine Wassermelone', zahl: 4 }, { name: 'ein voller Wassereimer', zahl: 10 }
  ];
  function einheitListe() {
    const D = KW.vergleichenAufgaben.DINGE;
    const g = ['bueroklammer', 'bleistift', 'radiergummi', 'apfel', 'lesebuch', 'trinkflasche'].map(id => D.find(d => d.id === id)).map(d => ({ name: d.name, zahl: d.masse, einheit: 'g' }));
    const kg = [{ name: D.find(d => d.id === 'schultasche').name, zahl: D.find(d => d.id === 'schultasche').masse / 1000 }, ...EINHEIT_KG].map(x => Object.assign({ einheit: 'kg' }, x));
    return [...g, ...kg].map(x => Object.assign(x, { akk: AKK[x.name] }));
  }
  /* Akkusativ für „viel zu schwer für …“ (Ingo 16.11.2026: Satz, der für jede Zahl stimmt) */
  const AKK = {
    'eine Büroklammer': 'eine Büroklammer', 'ein Bleistift': 'einen Bleistift', 'ein Radiergummi': 'einen Radiergummi',
    'ein Apfel': 'einen Apfel', 'ein Lesebuch': 'ein Lesebuch', 'eine volle Trinkflasche': 'eine volle Trinkflasche',
    'eine gepackte Schultasche': 'eine gepackte Schultasche', 'ein Kind aus der 3. Klasse': 'ein Kind aus der 3. Klasse',
    'eine Packung Mehl': 'eine Packung Mehl', 'ein Fahrrad für Kinder': 'ein Fahrrad für Kinder',
    'eine Wassermelone': 'eine Wassermelone', 'ein voller Wassereimer': 'einen vollen Wassereimer'
  };
  /* Mit bestimmtem Artikel für die Frage „Wie schwer ist …?“ */
  const BESTIMMT = { bueroklammer: 'die Büroklammer', luftballon: 'der Luftballon', bleistift: 'der Bleistift', murmel: 'die Murmel',
    radiergummi: 'der Radiergummi', klebestift: 'der Klebestift', heft: 'das Heft', schokolade: 'die Tafel Schokolade', apfel: 'der Apfel',
    brotdose: 'die leere Brotdose', turnschuh: 'der Turnschuh', lesebuch: 'das Lesebuch', trinkflasche: 'die volle Trinkflasche' };
  const BRUCH = [{ wort: 'ein halbes Kilogramm', ziel: 500 }, { wort: 'ein Viertel Kilogramm', ziel: 250 }, { wort: 'ein Kilogramm', ziel: 1000 }];

  function erzeuger(Z) {
    const zwischen = (a, b) => Z.zwischen(a, b);
    const kiesel = (m, verdeckt) => ({ art: 'kiesel', masse: m, verdeckt });
    const steine = liste => liste.map(m => ({ art: 'stein', masse: m }));

    function ablesen() {
      for (;;) {
        const d = Z.waehle(dingeAblesen());
        const m = zwischen(d.von, d.bis);
        const w = W.wenigste(m);
        if (!w || w.length > 4) continue;
        const ding = Object.assign({}, d, { masse: m });
        return { art: 'ablesen', ding, steine: steine(w), loesung: W.summe(w), frage: `Die Waage ist im Gleichgewicht. Wie schwer ist ${BESTIMMT[d.id]}?` };
      }
    }
    function einheit() {
      const x = Z.waehle(einheitListe());
      return { art: 'einheit', satz: `${gross(x.name)} wiegt ${x.zahl === 1 && x.einheit === 'kg' ? '1' : x.zahl} …`, zahl: x.zahl, einheit: x.einheit, akk: x.akk, loesung: x.einheit, frage: 'Gramm oder Kilogramm?' };
    }
    function ergaenzen() {
      const ohneKilo = SATZ.map((m, i) => i).filter(i => SATZ[i] !== 1000);
      for (;;) {
        const n = zwischen(2, 4);
        const wahl = Z.mische(ohneKilo).slice(0, n);
        const s = wahl.reduce((x, i) => x + SATZ[i], 0);
        if (s < 100 || s > 900) continue;
        const rest = ohneKilo.filter(i => !wahl.includes(i)).map(i => SATZ[i]);
        if (!W.loesungen(1000 - s, rest).length) continue;
        return { art: 'ergaenzen', vorhanden: wahl.slice().sort((a, b) => SATZ[b] - SATZ[a] || a - b), rest, loesung: 1000 - s, frage: 'Links liegt 1 kg. Wie viel fehlt rechts noch? Lege die fehlenden Steine. Dann tippe ein, wie viel gefehlt hat.' };
      }
    }
    function bruch(schon = []) {
      const b = Z.waehle(BRUCH.filter(x => !schon.includes(x.ziel)));
      schon.push(b.ziel);
      return { art: 'bruch', wort: b.wort, ziel: b.ziel, kiesel: kiesel(b.ziel, true), loesung: b.ziel, frage: `Lege ${b.wort} auf die rechte Schale.` };
    }
    function kgg() {
      const g = 10 * zwischen(1, 99);
      return { art: 'kgg', kg: 1, g, ziel: 1000 + g, kiesel: kiesel(1000 + g, true), loesung: 1000 + g, frage: `Lege 1 kg ${g} g auf die Waage. Wie viel Gramm sind das zusammen?` };
    }
    function gkg() {
      const ziel = 1000 + 10 * zwischen(1, 99);
      return { art: 'gkg', ziel, kiesel: kiesel(ziel, false), loesung: ziel - 1000, frage: `${ziel} g. Wie viel ist das in Kilogramm und Gramm? Bring die Waage ins Gleichgewicht. Dann tippe ein: 1 kg und … g.` };
    }
    function runde(stufe) {
      if (stufe === 'leicht') return Z.mische([ablesen(), ablesen(), ablesen(), ablesen(), einheit(), einheit()]);
      if (stufe === 'mittel') { const schon = []; return Z.mische([ergaenzen(), ergaenzen(), ergaenzen(), ergaenzen(), bruch(schon), bruch(schon)]); }
      if (stufe === 'knifflig') return Z.mische([kgg(), kgg(), kgg(), gkg(), gkg(), gkg()]);
      throw new Error('unbekannte Stufe: ' + stufe);
    }
    return { ablesen, einheit, ergaenzen, bruch, kgg, gkg, runde };
  }

  KW.grammAufgaben = Object.assign(erzeuger(KW.zufall), { mitZufall: erzeuger, einheitListe, BRUCH, EINHEIT_KG, BESTIMMT });
})();
