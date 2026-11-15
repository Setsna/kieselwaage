/* Kieselwaage: die Waage als Bild (SVG), Etappe 2b. Klassisches Skript, legt window.KW.waageBild an.
   Getestet in tools/waage-bild-test.html.

   Eine Tafelwaage wie im Buch (Denken und Rechnen 3, S. 73): zwei Schalen oben, in der Mitte ein Zeiger.
   - Was die Waage zeigt, rechnet nur KW.waage (js/waage.js). Hier wird nur gezeichnet.
   - Riegel: Solange er zu ist, bleibt alles waagerecht, egal was auf den Schalen liegt (Mini-Spec Etappe 2).
   - Bewegung nur über transform (CSS), 220 ms. Bei prefers-reduced-motion oder { ohneBewegung: true }
     springt die Waage sofort in die Endlage. Keine Inline-Stile im Markup (CSP); gesetzt wird über CSSOM.
   - Das Bild ist für Screenreader ausgeblendet (aria-hidden). Was auf den Schalen liegt und was die Waage zeigt,
     steht als Text daneben (beschreibung(), ansage()), das setzt die Station.

   Dinge auf der Schale:
     { art: 'kiesel', masse }                       Zahl gut lesbar, Form und Muster je Masse (nie nur Farbe)
     { art: 'muschel', form, masse }                form: herz | jakobs | schnecke | mies; Masse wird NICHT gezeigt
     { art: 'ding', id, name, masse }               Bild bilder/dinge/<id>.webp im runden Rahmen; Masse wird NICHT gezeigt */
(() => {
  'use strict';
  const KW = window.KW = window.KW || {};
  const NS = 'http://www.w3.org/2000/svg';
  const W = KW.waage;

  /* Maße im SVG (viewBox 0 0 480 300) */
  const DREH = { x: 240, y: 252 };     /* Drehpunkt des Zeigers */
  const ARM = 120;                     /* halber Abstand der Schalen: so weit liegt jede Schale vom Drehpunkt */
  const SCHALE_Y = 168;                /* Höhe der Schalen in Ruhe */
  const SCHALE_X = { links: DREH.x - ARM, rechts: DREH.x + ARM };

  /* Form und Muster der Kiesel je Masse: zwei Kiesel mit verschiedener Masse unterscheiden sich immer in Form oder Muster */
  const KIESEL = {
    10: ['rund', 'glatt'], 20: ['oval', 'streifen'], 50: ['flach', 'punkte'], 100: ['rund', 'streifen'],
    200: ['oval', 'punkte'], 250: ['flach', 'glatt'], 300: ['rund', 'punkte'], 500: ['oval', 'glatt']
  };
  const MUSCHELN = { herz: 'Herzmuschel', jakobs: 'Jakobsmuschel', schnecke: 'Schneckenhaus', mies: 'Miesmuschel' };

  let zaehler = 0;
  const neuesEl = (name, attr = {}, kinder = []) => {
    const el = document.createElementNS(NS, name);
    for (const [k, v] of Object.entries(attr)) el.setAttribute(k, String(v));
    for (const k of kinder) el.appendChild(k);
    return el;
  };

  /* Muster für Kiesel und Muscheln, je Waage eigene ids */
  function muster(id) {
    return neuesEl('defs', {}, [
      neuesEl('pattern', { id: `${id}-streifen`, width: 6, height: 6, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' },
        [neuesEl('line', { class: 'wb-muster', x1: 0, y1: 0, x2: 0, y2: 6 })]),
      neuesEl('pattern', { id: `${id}-punkte`, width: 7, height: 7, patternUnits: 'userSpaceOnUse' },
        [neuesEl('circle', { class: 'wb-muster-punkt', cx: 3.5, cy: 3.5, r: 1.3 })]),
      neuesEl('clipPath', { id: `${id}-rund` }, [neuesEl('circle', { cx: 0, cy: 0, r: 34 })])
    ]);
  }

  /* Gewichtsstein wie im Buch (S. 73): Zylinder mit Griff, größer je schwerer, Masse darauf. Fuß bei y = 0. */
  const STEIN_BREITE = { 1000: 62, 500: 52, 200: 44, 100: 40, 50: 34, 20: 30, 10: 27, 5: 24, 2: 22, 1: 20 };
  const steinText = m => m >= 1000 && m % 1000 === 0 ? `${m / 1000} kg` : `${m} g`;
  function steinBild(masse) {
    const b = STEIN_BREITE[masse] || 30, h = Math.round(b * 0.8), griff = Math.round(b * 0.32);
    const g = neuesEl('g', { class: `wb-stein${masse >= 100 ? ' wb-stein--gross' : ''}`, 'data-masse': masse });
    g.appendChild(neuesEl('rect', { class: 'wb-stein__griff', x: -griff / 2, y: -h - griff * 0.7, width: griff, height: griff, rx: griff / 2.5 }));
    g.appendChild(neuesEl('rect', { class: 'wb-stein__koerper', x: -b / 2, y: -h, width: b, height: h, rx: 4 }));
    g.appendChild(neuesEl('path', { class: 'wb-stein__kante', d: `M${-b / 2 + 3} ${-h + 4}H${b / 2 - 3}` }));
    const t = neuesEl('text', { class: 'wb-stein__zahl', x: 0, y: -h / 2 + (b >= 34 ? 5 : 4) });
    if (b < 34) t.classList.add('wb-stein__zahl--klein');
    t.textContent = steinText(masse);
    g.appendChild(t);
    return { g, breite: b + 3, hoehe: h + griff * 0.7, fuss: true };
  }

  /* Ein Kiesel mit Zahl (oder „?“, wenn verdeckt), Mittelpunkt (0, 0) */
  function kieselBild(masse, id, verdeckt) {
    const [form, mu] = verdeckt ? ['rund', 'punkte'] : (KIESEL[masse] || ['rund', 'glatt']);
    const umriss = form === 'rund' ? ['circle', { cx: 0, cy: 0, r: 28 }]
      : form === 'oval' ? ['ellipse', { cx: 0, cy: 0, rx: 30, ry: 21 }]
      : ['rect', { x: -32, y: -17, width: 64, height: 34, rx: 16 }];
    const g = neuesEl('g', { class: `wb-kiesel wb-kiesel--${form}`, 'data-masse': masse });
    g.appendChild(neuesEl(umriss[0], Object.assign({ class: 'wb-kiesel__grund' }, umriss[1])));
    if (mu !== 'glatt') g.appendChild(neuesEl(umriss[0], Object.assign({ class: 'wb-kiesel__muster', fill: `url(#${id}-${mu})` }, umriss[1])));
    g.appendChild(neuesEl(umriss[0], Object.assign({ class: 'wb-kiesel__rand' }, umriss[1])));
    const t = neuesEl('text', { class: 'wb-kiesel__zahl', x: 0, y: 6 });
    t.textContent = verdeckt ? '?' : `${masse} g`;
    g.appendChild(t);
    return { g, breite: form === 'rund' ? 60 : 66, hoehe: form === 'flach' ? 34 : form === 'rund' ? 56 : 44 };
  }

  /* Muschelformen als einfache Pfade, Mittelpunkt (0, 0), etwa 60 breit */
  const MUSCHEL_PFAD = {
    herz: 'M0 24C-18 24-30 6-28-10C-26-22-12-26 0-18C12-26 26-22 28-10C30 6 18 24 0 24Z',
    jakobs: 'M0 26L-30-6C-28-20-14-26 0-26S28-20 30-6Z',
    schnecke: 'M-26 14C-30-4-18-24 2-24C20-24 30-10 26 4C22 18 4 24-14 22C-20 21-24 18-26 14Z',
    mies: 'M-30 4C-30-10-14-18 6-18C22-18 32-10 30 0C28 10 14 16-6 16C-20 16-30 12-30 4Z'
  };
  const MUSCHEL_LINIEN = {
    herz: 'M0 22V-16M-10 20L-14-14M10 20L14-14M-20 12L-24-8M20 12L24-8',
    jakobs: 'M0 24V-24M-8 20L-14-24M8 20L14-24M-16 12L-24-18M16 12L24-18',
    schnecke: 'M2-4C8-4 10 2 6 6C0 10-8 6-8 0C-8-10 4-16 12-12C20-8 22 4 16 12',
    mies: 'M-26 4C-10 0 10-2 28-2M-24 10C-8 8 10 6 24 6'
  };
  function muschelBild(form) {
    const g = neuesEl('g', { class: `wb-muschel wb-muschel--${form}` });
    g.appendChild(neuesEl('path', { class: 'wb-muschel__grund', d: MUSCHEL_PFAD[form] }));
    g.appendChild(neuesEl('path', { class: 'wb-muschel__linien', d: MUSCHEL_LINIEN[form] }));
    g.appendChild(neuesEl('path', { class: 'wb-muschel__rand', d: MUSCHEL_PFAD[form] }));
    return { g, breite: 66, hoehe: 52 };
  }

  /* Ein Gegenstand: Bild im runden Rahmen */
  function dingBild(ding, id, bildStand) {
    const g = neuesEl('g', { class: 'wb-ding', 'data-id': ding.id });
    g.appendChild(neuesEl('circle', { class: 'wb-ding__grund', cx: 0, cy: 0, r: 34 }));
    const bild = neuesEl('image', { href: `bilder/dinge/${ding.id}.webp?b=${bildStand}`, x: -34, y: -34, width: 68, height: 68, 'clip-path': `url(#${id}-rund)`, preserveAspectRatio: 'xMidYMid slice' });
    g.appendChild(bild);
    g.appendChild(neuesEl('circle', { class: 'wb-ding__rand', cx: 0, cy: 0, r: 34 }));
    return { g, breite: 76, hoehe: 70 };
  }

  function name(ding) {
    if (ding.art === 'kiesel' && ding.verdeckt) return 'ein Kiesel, dessen Masse du nicht kennst';
    if (ding.art === 'kiesel') return `ein Kiesel mit ${ding.masse} Gramm`;
    if (ding.art === 'stein') return `ein Gewichtsstein mit ${steinText(ding.masse)}`;
    if (ding.art === 'muschel') return `ein${ding.form === 'schnecke' ? ' ' : 'e '}${MUSCHELN[ding.form]}`;
    return ding.name;
  }
  function beschreibeSchale(liste) {
    if (!liste.length) return 'nichts';
    /* Nur Kiesel: kurz, damit Kinder es lesen können („300 g und 100 g“) */
    if (liste.every(d => (d.art === 'kiesel' && !d.verdeckt) || d.art === 'stein')) {
      const g = liste.map(d => steinText(d.masse));
      return g.length === 1 ? g[0] : `${g.slice(0, -1).join(', ')} und ${g[g.length - 1]}`;
    }
    return liste.map(name).join(', ');
  }

  /* Die Waage. Rückgabe: Objekt mit el (das SVG) und den Steuerfunktionen. */
  function neu({ ohneBewegung = false, klein = false, bildStand = 1 } = {}) {
    const id = `wb${++zaehler}`;
    const svg = neuesEl('svg', { class: `waage-bild${klein ? ' waage-bild--klein' : ''}${ohneBewegung ? ' waage-bild--ruhig' : ''}`, viewBox: '0 0 480 300', 'aria-hidden': 'true', focusable: 'false' });
    svg.appendChild(muster(id));

    /* Gehäuse der Tafelwaage */
    svg.appendChild(neuesEl('path', { class: 'wb-gehaeuse', d: 'M52 206H428Q446 206 446 224V270Q446 282 434 282H46Q34 282 34 270V224Q34 206 52 206Z' }));
    svg.appendChild(neuesEl('path', { class: 'wb-gehaeuse-kante', d: 'M52 206H428' }));
    /* Skalenfenster mit Mitte */
    svg.appendChild(neuesEl('path', { class: 'wb-fenster', d: 'M196 214H284Q290 214 290 220V246Q290 252 284 252H196Q190 252 190 246V220Q190 214 196 214Z' }));
    svg.appendChild(neuesEl('path', { class: 'wb-skala', d: 'M240 214V224M222 216L224 224M258 216L256 224' }));

    /* Zeiger: dreht sich um DREH */
    const zeiger = neuesEl('g', { class: 'wb-zeiger' });
    zeiger.appendChild(neuesEl('path', { class: 'wb-zeiger__nadel', d: `M${DREH.x} ${DREH.y}L${DREH.x - 3} ${DREH.y - 6}L${DREH.x} ${DREH.y - 40}L${DREH.x + 3} ${DREH.y - 6}Z` }));
    svg.appendChild(zeiger);
    svg.appendChild(neuesEl('circle', { class: 'wb-drehpunkt', cx: DREH.x, cy: DREH.y, r: 5 }));

    /* Riegel: Querbalken über dem Zeiger */
    const riegelEl = neuesEl('g', { class: 'wb-riegel' }, [
      neuesEl('rect', { class: 'wb-riegel__balken', x: DREH.x - 22, y: DREH.y - 30, width: 44, height: 9, rx: 4.5 }),
      neuesEl('circle', { class: 'wb-riegel__knopf', cx: DREH.x + 22, cy: DREH.y - 25.5, r: 6 })
    ]);
    svg.appendChild(riegelEl);

    /* Schalen mit Stütze; die Gruppe bewegt sich nur senkrecht */
    const schalen = {};
    for (const seite of ['links', 'rechts']) {
      const x = SCHALE_X[seite];
      const gruppe = neuesEl('g', { class: `wb-schale wb-schale--${seite}`, 'data-seite': seite });
      gruppe.appendChild(neuesEl('rect', { class: 'wb-stuetze', x: x - 5, y: SCHALE_Y + 6, width: 10, height: 34, rx: 3 }));
      gruppe.appendChild(neuesEl('path', { class: 'wb-schale__teller', d: `M${x - 92} ${SCHALE_Y}H${x + 92}Q${x + 86} ${SCHALE_Y + 12} ${x + 70} ${SCHALE_Y + 12}H${x - 70}Q${x - 86} ${SCHALE_Y + 12} ${x - 92} ${SCHALE_Y}Z` }));
      const inhalt = neuesEl('g', { class: 'wb-inhalt' });
      gruppe.appendChild(inhalt);
      svg.appendChild(gruppe);
      schalen[seite] = { gruppe, inhalt, liste: [] };
    }

    let riegelZu = true;
    let winkel = 0;

    function belege(seite, liste) {
      const s = schalen[seite];
      s.liste = liste.slice();
      while (s.inhalt.firstChild) s.inhalt.removeChild(s.inhalt.firstChild);
      const bilder = s.liste.map(d => d.art === 'stein' ? steinBild(d.masse) : d.art === 'kiesel' ? kieselBild(d.masse, id, d.verdeckt) : d.art === 'muschel' ? muschelBild(d.form) : dingBild(d, id, bildStand));
      /* In Reihen legen: was nicht mehr auf den Teller passt, kommt in eine Reihe darüber (schwere Steine unten) */
      const PLATZ = 184, reihen = [[]];
      let breite = 0;
      for (const b of bilder) {
        if (breite + b.breite > PLATZ && reihen[reihen.length - 1].length) { reihen.push([]); breite = 0; }
        reihen[reihen.length - 1].push(b); breite += b.breite;
      }
      let boden = SCHALE_Y - 1;
      for (const reihe of reihen) {
        const gesamt = reihe.reduce((a, b) => a + b.breite, 0);
        const hoch = Math.max(...reihe.map(b => b.hoehe));
        let x = SCHALE_X[seite] - gesamt / 2;
        for (const b of reihe) {
          const y = b.fuss ? boden : boden - b.hoehe / 2;
          b.g.setAttribute('transform', `translate(${x + b.breite / 2} ${y})`);
          s.inhalt.appendChild(b.g);
          x += b.breite;
        }
        boden -= hoch + 2;
      }
    }

    /* Den gezeichneten Zustand setzen. Winkel in Grad (SVG: positiv = rechte Seite sinkt). */
    function zeichne(w) {
      winkel = w;
      const versatz = Math.sin(w * Math.PI / 180) * ARM;   /* rechte Schale: +versatz (nach unten), linke: -versatz */
      zeiger.style.transform = `rotate(${w}deg)`;
      schalen.links.gruppe.style.transform = `translateY(${-versatz}px)`;
      schalen.rechts.gruppe.style.transform = `translateY(${versatz}px)`;
      svg.setAttribute('data-neigung', String(w));
    }

    function riegel(zu) {
      riegelZu = !!zu;
      riegelEl.classList.toggle('wb-riegel--offen', !riegelZu);
      svg.setAttribute('data-riegel', riegelZu ? 'zu' : 'offen');
      if (riegelZu) zeichne(0);
    }

    const api = {
      el: svg,
      /* Was liegt wo. Setzt den Riegel zu, die Waage steht waagerecht. */
      setze(links, rechts) {
        belege('links', links || []);
        belege('rechts', rechts || []);
        riegel(true);
        return api;
      },
      riegel,
      /* Riegel auf, die Waage zeigt das Ergebnis. Rückgabe: { vergleich, ansage, neigung } aus KW.waage. */
      wiegen() {
        const l = schalen.links.liste.map(d => d.masse), r = schalen.rechts.liste.map(d => d.masse);
        riegel(false);
        const n = W.neigung(l, r);
        zeichne(n);
        return { vergleich: W.vergleiche(l, r), ansage: W.ansage(l, r), neigung: n };
      },
      /* Für Tests: der gezeichnete Winkel und die Höhen der Schalen (aus dem gerenderten SVG) */
      winkel: () => winkel,
      riegelZu: () => riegelZu,
      inhalt: seite => schalen[seite].liste.slice(),
      beschreibung: () => `Links: ${beschreibeSchale(schalen.links.liste)}. Rechts: ${beschreibeSchale(schalen.rechts.liste)}.`
    };
    zeichne(0);
    riegel(true);
    return api;
  }

  /* Kleines Muschel-Zeichen für Knöpfe (feste Formen, keine fremden Werte) */
  const muschelSymbol = form => `<svg class="muschel-symbol muschel-symbol--${form}" viewBox="-34 -30 68 60" aria-hidden="true" focusable="false"><path class="wb-muschel__grund" d="${MUSCHEL_PFAD[form]}"/><path class="wb-muschel__linien" d="${MUSCHEL_LINIEN[form]}"/><path class="wb-muschel__rand" d="${MUSCHEL_PFAD[form]}"/></svg>`;

  /* Kleines Stein-Zeichen für die Knöpfe im Steinkasten (Größe wie auf der Waage) */
  function steinSymbol(masse) {
    const b = STEIN_BREITE[masse] || 30, h = Math.round(b * 0.8), griff = Math.round(b * 0.32);
    const H = h + griff;
    return `<svg class="stein-symbol" viewBox="${-34} ${-H - 2} 68 ${H + 4}" aria-hidden="true" focusable="false"><rect class="wb-stein__griff" x="${-griff / 2}" y="${-h - griff * 0.7}" width="${griff}" height="${griff}" rx="${griff / 2.5}"/><rect class="wb-stein__koerper" x="${-b / 2}" y="${-h}" width="${b}" height="${h}" rx="4"/></svg>`;
  }

  KW.waageBild = { neu, KIESEL, MUSCHELN, STEIN_BREITE, name, muschelSymbol, steinSymbol, steinText };
})();
