/* Kieselwaage: Station „Massen vergleichen“ (Etappe 2c).
   Klassisches Skript, trägt sich in KW.stationen.vergleichen ein. Braucht KW.config, KW.waage, KW.waageBild,
   KW.vergleichenAufgaben, KW.stand, KW.teile. Die App ruft oeffnen(ctx) und bedienen(e).
   Texte nach Dateien/Beispiele-Entwuerfe/vergleichen.md (von Ingo freigegeben am 15.11.2026).

   Kern (Mini-Spec Etappe 2): Die Waage ist festgestellt. Das Kind vermutet zuerst, dann tippt es „Wiegen“,
   der Riegel geht auf und die Waage zeigt das Ergebnis. Die Vermutung bleibt daneben stehen.
   - Was die Waage zeigt, rechnet KW.waage. Lösungen kommen aus den Aufgaben, die sie auch über KW.waage berechnen.
   - Leicht und mittel: kein zweiter Versuch (die Waage zeigt das Ergebnis). Geschafft = Vermutung passt.
   - Knifflig: Muscheln ordnen, nur mit der Waage. Erster falscher Versuch: Hinweis. Zweiter: Lösung mit Gramm.
   - Gespeichert werden nur runden und stempel (kw_stand). Vermutungen, gelegte Muscheln, Reihen nicht.
   Barrierefreiheit: alles über echte Knöpfe (auch die Muscheln), Ergebnis sichtbar und im aria-live-Bereich,
   was auf den Schalen liegt steht als Text unter der Waage, ein h1 je Ansicht, Dialoge mit Fokus zurück.
   Sicherheit: Texte nur aus eigenen Daten, trotzdem durch esc(). Keine style-Attribute. */
(() => {
  'use strict';
  const KW = window.KW = window.KW || {};
  KW.stationen = KW.stationen || {};
  const ID = 'vergleichen';
  const C = () => KW.config;
  const A = () => KW.vergleichenAufgaben;
  const ST = () => KW.stand;
  const T = () => KW.teile;
  const B = () => KW.waageBild;
  const STUFENNAME = { leicht: 'leicht', mittel: 'mittel', knifflig: 'knifflig' };

  let ctx = null;
  let z = null;          /* Zustand der laufenden Runde */
  let waagen = [];       /* Waagen der aktuellen Aufgabe (bleiben beim Neuzeichnen erhalten) */
  let hilfeStufe = 0;
  const esc = s => ctx.esc(s);
  const gross = s => s.charAt(0).toUpperCase() + s.slice(1);
  const summe = liste => liste.reduce((x, d) => x + d.masse, 0);

  /* ---------- Wörter ---------- */
  const VERMUTUNG = { '1': 'links sinkt', '-1': 'rechts sinkt', '0': 'gleich schwer' };
  const ZEIGT = { '1': 'links sinkt', '-1': 'rechts sinkt', '0': 'gleich schwer, die Waage ist im Gleichgewicht' };
  const MUSCHEL_MIT_ARTIKEL = { herz: 'die Herzmuschel', jakobs: 'die Jakobsmuschel', schnecke: 'das Schneckenhaus', mies: 'die Miesmuschel' };
  const DER = { radiergummi: 'Der Radiergummi', klebestift: 'Der Klebestift', apfel: 'Der Apfel' };
  const ABC = 'ABC';
  /* Kleine Waage als Zeichen auf den Vermutungs-Knöpfen (links sinkt: negativ gedreht wie die große Waage) */
  const zeichen = w => `<svg class="vermutung-zeichen" viewBox="0 0 48 32" aria-hidden="true" focusable="false"><g transform="rotate(${w} 24 14)"><path d="M6 14H42"/><path d="M2 14H12M36 14H46"/></g><path d="M24 14V29M16 29H32"/></svg>`;
  const ZEICHEN = { '1': zeichen(-16), '-1': zeichen(16), '0': zeichen(0) };

  /* ---------- Teile ---------- */
  const kopf = unterzeile => T().kopf(ctx, { titel: 'Massen vergleichen', unterzeile, praefix: 'vg' });
  const SO_GEHTS = (offen, knifflig) => T().aufklapper(ctx, { klasse: 'so-gehts', titel: "So geht's", offen, schritte: knifflig
    ? ['Lege zwei Muscheln auf die Waage und tippe auf Wiegen.', 'Wiege so oft, wie du willst.', 'Lege die Muscheln in eine Reihe: von leicht nach schwer.']
    : ['Schau dir an, was auf den Schalen liegt.', 'Vermute: Welche Seite sinkt?', 'Tippe auf Wiegen. Die Waage zeigt, ob du richtig vermutet hast.'] });
  const AM_TISCH = offen => T().aufklapper(ctx, { klasse: 'am-tisch', titel: 'Am Tisch: Baue eine Kleiderbügelwaage', offen, schritte: [
    'Du brauchst: einen Kleiderbügel, zwei gleiche Beutel, zwei Schnüre.',
    'Häng die Beutel an die Enden. Häng den Bügel an einen Haken oder an die Stuhllehne.',
    'Lege in jeden Beutel etwas aus deiner Schultasche.',
    'Sagt zuerst beide: Welche Seite sinkt? Dann lasst los.',
    'Schwerer: Ordne vier Dinge von leicht nach schwer. Du darfst nur den Bügel benutzen.'] });

  /* ---------- Stufenwahl ---------- */
  function ansichtStufen() {
    z = null; waagen = [];
    const erstesMal = T().erstesMal(ID);
    ctx.zeigen(`
      ${kopf('Was ist schwerer?')}
      ${erstesMal ? '<p class="flint-satz">Bei meiner Waage ist ein Riegel davor. Erst vermutest du, welche Seite sinkt. Dann öffnest du den Riegel und wiegst.</p>' : ''}
      ${SO_GEHTS(erstesMal, false)}
      ${T().stufenListe(ctx, ID, 'vg')}
      ${AM_TISCH(false)}`, 'Massen vergleichen');
  }

  /* ---------- Runde ---------- */
  function rundeStarten(stufe) {
    z = { stufe, aufgaben: A().runde(stufe), i: 0, geschafft: [], gespeichertFehler: false };
    aufgabeZeigen();
  }
  const aufgabe = () => z && z.aufgaben[z.i];

  function aufgabeZeigen() {
    const a = aufgabe();
    hilfeStufe = 0;
    a.zustand = { vermutung: null, wahl: null, gewogen: false, fertig: false, geschafft: false, summenAn: false, versuche: 0,
      auswahl: null, links: null, rechts: null, reihe: a.art === 'ordnen' ? a.muscheln.map(() => null) : [], ansage: '', rueck: '' };
    /* Waagen anlegen und belegen; der Riegel ist zu */
    const bs = C().bildStand;
    if (a.art === 'welche') waagen = a.waagen.map(w => B().neu({ klein: true, bildStand: bs }).setze(w.links, w.rechts));
    else if (a.art === 'ordnen') waagen = [B().neu({ bildStand: bs }).setze([], [])];
    else waagen = [B().neu({ bildStand: bs }).setze(a.links, a.rechts)];
    const unter = `Stufe ${STUFENNAME[z.stufe]} · Aufgabe ${z.i + 1} von ${z.aufgaben.length}`;
    ctx.zeigen(`
      ${kopf(unter)}
      ${z.i === 0 && z.stufe === 'knifflig' && !ST().runden(ID, 'knifflig') ? SO_GEHTS(true, true) : ''}
      <div class="station-flaeche${a.art === 'welche' ? ' station-flaeche--breit' : ''}">
        <div class="buehne buehne--waage" id="vg-buehne"></div>
        <section class="papier aufgabe" id="vg-aufgabe" aria-labelledby="vg-frage"></section>
      </div>`, `Aufgabe ${z.i + 1} – Massen vergleichen`);
    zeichne();
  }

  /* ---------- Bühne: Waage(n), was darauf liegt, Ergebnis ---------- */
  function buehne() {
    const a = aufgabe(), s = a.zustand;
    const b = ctx.app.querySelector('#vg-buehne');
    if (!b) return;
    b.textContent = '';
    const text = (klasse, inhalt) => { const p = document.createElement('p'); p.className = klasse; p.textContent = inhalt; return p; };
    if (a.art === 'welche') {
      const reihe = document.createElement('div');
      reihe.className = 'waagen-reihe';
      waagen.forEach((w, i) => {
        const fig = document.createElement('figure');
        fig.className = 'waage-figur waage-figur--klein';
        fig.appendChild(w.el);
        const cap = document.createElement('figcaption');
        const l = summe(a.waagen[i].links), r = summe(a.waagen[i].rechts);
        cap.appendChild(text('waage-figur__name', `Waage ${ABC[i]}`));
        cap.appendChild(text('waage-figur__inhalt', `${w.beschreibung()}`));
        if (s.summenAn || s.gewogen) cap.appendChild(text('waage-figur__summe', `Zusammen: links ${l} g, rechts ${r} g.`));
        fig.appendChild(cap);
        reihe.appendChild(fig);
      });
      b.appendChild(reihe);
    } else {
      const w = waagen[0];
      const fig = document.createElement('figure');
      fig.className = 'waage-figur';
      fig.appendChild(w.el);
      const cap = document.createElement('figcaption');
      cap.appendChild(text('waage-figur__inhalt', w.beschreibung()));
      if (a.art === 'summe' && (s.summenAn || s.gewogen)) cap.appendChild(text('waage-figur__summe', `Zusammen: links ${summe(a.links)} g, rechts ${summe(a.rechts)} g.`));
      fig.appendChild(cap);
      b.appendChild(fig);
    }
    b.appendChild(text('waage-ergebnis', s.ansage || (waagen.every(w => w.riegelZu()) ? 'Die Waage ist festgestellt.' : '')));
  }

  /* ---------- Rechte Seite: Frage, Knöpfe, Rückmeldung ---------- */
  function zeichne() {
    buehne();
    const a = aufgabe(), s = a.zustand;
    const ziel = ctx.app.querySelector('#vg-aufgabe');
    if (a.art === 'ordnen') ziel.innerHTML = ordnenHtml(a, s);
    else if (a.art === 'welche') ziel.innerHTML = welcheHtml(a, s);
    else ziel.innerHTML = vermutenHtml(a, s);
    ziel.classList.toggle('loesung-gezeigt', s.fertig && !s.geschafft);
  }

  const weiterKnopf = s => s.fertig ? '<p class="knopfreihe"><button type="button" class="knopf haupt" data-vg="weiter">Weiter</button></p>' : '';
  const rueck = s => `<p class="rueckmeldung">${esc(s.rueck)}</p>`;

  function vermutenHtml(a, s) {
    return `
      <p class="auftrag" id="vg-frage">${esc(a.frage)}</p>
      <p class="frage-klein">Deine Vermutung:</p>
      <div class="antworten antworten--reihe vermutungen" role="group" aria-label="Deine Vermutung">
        ${['1', '-1', '0'].map(w => `<button type="button" class="knopf vermutung-knopf${s.gewogen && Number(w) === a.loesung ? ' ist-richtig' : ''}" data-vg="vermuten" data-wert="${w}" aria-pressed="${String(s.vermutung) === w}"${s.gewogen ? ' disabled' : ''}>${ZEICHEN[w]}<span>${esc(gross(VERMUTUNG[w]))}</span></button>`).join('')}
      </div>
      <p class="knopfreihe"><button type="button" class="knopf haupt wiegen-knopf" data-vg="wiegen"${s.vermutung === null || s.gewogen ? ' disabled' : ''}>Wiegen</button></p>
      ${s.vermutung === null && !s.gewogen ? '<p class="leise">Tippe zuerst deine Vermutung an. Dann kannst du wiegen.</p>' : ''}
      ${rueck(s)}
      ${s.gewogen ? `<p class="erklaerung">Du hast vermutet: ${esc(VERMUTUNG[String(s.vermutung)])}. Die Waage zeigt: ${esc(ZEIGT[String(a.loesung)])}.</p>` : ''}
      ${weiterKnopf(s)}`;
  }

  function welcheHtml(a, s) {
    return `
      <p class="auftrag" id="vg-frage">${esc(a.frage)}</p>
      <div class="antworten antworten--reihe" role="group" aria-label="Welche Waage?">
        ${a.waagen.map((_, i) => `<button type="button" class="knopf antwort-knopf${s.gewogen && i === a.loesung ? ' ist-richtig' : ''}" data-vg="waehle" data-i="${i}" aria-pressed="${s.wahl === i}"${s.gewogen ? ' disabled' : ''}>Waage ${ABC[i]}</button>`).join('')}
      </div>
      <p class="knopfreihe"><button type="button" class="knopf haupt wiegen-knopf" data-vg="wiegen"${s.wahl === null || s.gewogen ? ' disabled' : ''}>Alle wiegen</button></p>
      ${s.wahl === null && !s.gewogen ? '<p class="leise">Tippe zuerst eine Waage an. Dann kannst du wiegen.</p>' : ''}
      ${rueck(s)}
      ${weiterKnopf(s)}`;
  }

  function ordnenHtml(a, s) {
    const M = a.muscheln;
    const wo = k => s.links === k ? 'liegt links auf der Waage' : s.rechts === k ? 'liegt rechts auf der Waage' : '';
    const name = k => B().MUSCHELN[M[k].form];
    const gramm = k => s.fertig ? ` (${M[k].masse} g)` : '';
    const zu = s.fertig;
    const beide = s.links !== null && s.rechts !== null;
    return `
      <p class="auftrag" id="vg-frage">${esc(a.frage)}</p>
      <p class="frage-klein" id="vg-muscheln">Die Muscheln</p>
      <ul class="muscheln" aria-labelledby="vg-muscheln">
        ${M.map((m, k) => `<li><button type="button" class="knopf muschel-knopf" data-vg="muschel" data-k="${k}" aria-pressed="${s.auswahl === k}"${zu ? ' disabled' : ''}>${B().muschelSymbol(m.form)}<span>${esc(name(k))}${esc(gramm(k))}</span>${wo(k) ? `<span class="muschel-knopf__wo">${esc(wo(k))}</span>` : ''}</button></li>`).join('')}
      </ul>
      <p class="leise">${zu ? '' : s.auswahl === null ? 'Tippe eine Muschel an. Dann lege sie auf die Waage oder in die Reihe.' : `Du hast ${esc(MUSCHEL_MIT_ARTIKEL[M[s.auswahl].form])} gewählt.`}</p>
      <p class="knopfreihe">
        <button type="button" class="knopf" data-vg="schale" data-seite="links"${s.auswahl === null || zu ? ' disabled' : ''}>Auf die linke Schale</button>
        <button type="button" class="knopf" data-vg="schale" data-seite="rechts"${s.auswahl === null || zu ? ' disabled' : ''}>Auf die rechte Schale</button>
        <button type="button" class="knopf haupt wiegen-knopf" data-vg="wiegen"${!beide || !waagen[0].riegelZu() || zu ? ' disabled' : ''}>Wiegen</button>
      </p>
      <p class="frage-klein" id="vg-reihe">Die Reihe: von leicht nach schwer</p>
      <ol class="reihe" aria-labelledby="vg-reihe">
        ${s.reihe.map((k, p) => `<li><button type="button" class="knopf reihe-platz${k === null ? ' reihe-platz--leer' : ''}" data-vg="platz" data-p="${p}" aria-label="Platz ${p + 1}: ${k === null ? 'leer' : esc(name(k))}${p === 0 ? ', am leichtesten' : p === s.reihe.length - 1 ? ', am schwersten' : ''}"${zu ? ' disabled' : ''}><span class="reihe-platz__nr" aria-hidden="true">${p + 1}</span>${k === null ? '<span class="reihe-platz__leer" aria-hidden="true">leer</span>' : `${B().muschelSymbol(M[k].form)}<span aria-hidden="true">${esc(name(k))}${esc(gramm(k))}</span>`}</button></li>`).join('')}
      </ol>
      <p class="reihe-rand" aria-hidden="true"><span>leicht</span><span>schwer</span></p>
      <p class="knopfreihe"><button type="button" class="knopf haupt" data-vg="pruefen"${s.reihe.includes(null) || zu ? ' disabled' : ''}>Prüfen</button></p>
      ${rueck(s)}
      ${weiterKnopf(s)}`;
  }

  /* ---------- Geschafft und speichern ---------- */
  function fertig(a, geschafft) {
    const s = a.zustand;
    s.fertig = true;
    if (s.geschafft || !geschafft) return;
    s.geschafft = true;
    z.geschafft[z.i] = true;
    if (!ST().istVorschau && ST().rundeGeschafft(ID, z.stufe) === false) z.gespeichertFehler = true;
  }

  /* ---------- Vermuten und wiegen (leicht, mittel) ---------- */
  function vermuten(wert) {
    const s = aufgabe().zustand;
    if (s.gewogen) return;
    s.vermutung = Number(wert);
    zeichne();
    T().fokus(ctx, '[data-vg="wiegen"]');
  }
  function waehle(i) {
    const s = aufgabe().zustand;
    if (s.gewogen) return;
    s.wahl = i;
    zeichne();
    T().fokus(ctx, '[data-vg="wiegen"]');
  }

  function wiegen() {
    const a = aufgabe(), s = a.zustand;
    if (a.art === 'ordnen') { muschelnWiegen(a, s); return; }
    if (s.gewogen) return;
    if (a.art === 'welche') {
      if (s.wahl === null) return;
      waagen.forEach(w => w.wiegen());
      s.gewogen = true;
      const g = a.loesung, l = summe(a.waagen[g].links);
      const ok = s.wahl === g;
      s.ansage = `Waage ${ABC[g]} ist im Gleichgewicht.`;
      s.rueck = ok ? `Genau. Bei Waage ${ABC[g]} liegen auf beiden Seiten ${l} g. Sie ist im Gleichgewicht.`
        : `Schau genau hin: Waage ${ABC[g]} ist im Gleichgewicht. Auf beiden Seiten liegen ${l} g.`;
      fertig(a, ok);
    } else {
      if (s.vermutung === null) return;
      const r = waagen[0].wiegen();
      s.gewogen = true;
      s.ansage = r.ansage;
      const ok = s.vermutung === r.vergleich;
      s.rueck = rueckmeldung(a, r.vergleich, ok);
      fertig(a, ok);
    }
    zeichne();
    ctx.ansagen(`${s.ansage} ${s.rueck}`);
    T().fokus(ctx, '[data-vg="weiter"]');
    if (s.geschafft) T().aufleuchten(ctx.app.querySelector('.ist-richtig'));
  }

  /* Rückmeldung nach dem Wiegen (Texte aus dem Entwurf) */
  function rueckmeldung(a, v, ok) {
    const seite = v > 0 ? 'Die linke Schale ist unten, also ist links schwerer.' : 'Die rechte Schale ist unten, also ist rechts schwerer.';
    if (a.art === 'paar') {
      const [schwer, leicht] = v > 0 ? [a.links[0], a.rechts[0]] : [a.rechts[0], a.links[0]];
      const satz = `${gross(schwer.name)} ist schwerer als ${leicht.name}.`;
      return ok ? `Genau. ${satz}` : `Die Waage zeigt etwas anderes. ${seite} ${satz}`;
    }
    if (a.art === 'taeuscht') {
      const anderes = a.links[0].id === 'luftballon' ? a.rechts[0] : a.links[0];
      return ok ? 'Genau. Der Luftballon ist groß, aber ganz leicht. Groß heißt nicht schwer.'
        : `Der Luftballon ist groß, aber fast nur Luft. ${DER[anderes.id] || gross(anderes.name)} ist klein und trotzdem schwerer.`;
    }
    /* summe */
    const l = summe(a.links), r = summe(a.rechts);
    if (v === 0) return ok ? `Genau. Auf beiden Seiten liegen ${l} g. Die Waage ist im Gleichgewicht.`
      : `Die Waage zeigt etwas anderes. Auf beiden Seiten liegen ${l} g. Die Waage ist im Gleichgewicht.`;
    const welche = v > 0 ? 'Links ist schwerer.' : 'Rechts ist schwerer.';
    return ok ? `Genau. Links liegen ${l} g, rechts ${r} g. ${welche}` : `Die Waage zeigt etwas anderes. ${seite} Links liegen ${l} g, rechts ${r} g.`;
  }

  /* ---------- Muscheln ordnen (knifflig) ---------- */
  function muschelWaehlen(k) {
    const s = aufgabe().zustand;
    if (s.fertig) return;
    s.auswahl = s.auswahl === k ? null : k;
    zeichne();
    T().fokus(ctx, `[data-vg="muschel"][data-k="${k}"]`);
  }
  function aufSchale(seite) {
    const a = aufgabe(), s = a.zustand;
    if (s.auswahl === null || s.fertig) return;
    const k = s.auswahl, andere = seite === 'links' ? 'rechts' : 'links';
    if (s[andere] === k) s[andere] = null;
    s[seite] = k;
    s.auswahl = null;
    const dinge = x => x === null ? [] : [a.muscheln[x]];
    waagen[0].setze(dinge(s.links), dinge(s.rechts));   /* Riegel wieder zu */
    s.ansage = '';
    zeichne();
    const ziel = s.links !== null && s.rechts !== null ? '[data-vg="wiegen"]' : `[data-vg="muschel"]:not([aria-pressed="true"])`;
    T().fokus(ctx, ziel);
  }
  function muschelnWiegen(a, s) {
    if (s.links === null || s.rechts === null || s.fertig || !waagen[0].riegelZu()) return;
    const r = waagen[0].wiegen();
    const L = MUSCHEL_MIT_ARTIKEL[a.muscheln[s.links].form], R = MUSCHEL_MIT_ARTIKEL[a.muscheln[s.rechts].form];
    s.ansage = r.vergleich > 0 ? `${gross(L)} ist schwerer als ${R}.` : r.vergleich < 0 ? `${gross(R)} ist schwerer als ${L}.` : `${gross(L)} und ${R} sind gleich schwer.`;
    zeichne();
    ctx.ansagen(s.ansage);
    T().fokus(ctx, '[data-vg="muschel"]');
  }
  function aufPlatz(p) {
    const a = aufgabe(), s = a.zustand;
    if (s.fertig) return;
    if (s.auswahl === null) {
      /* leerer Platz ohne Auswahl: nichts; belegter Platz: Muschel wieder aufnehmen */
      if (s.reihe[p] !== null) s.auswahl = s.reihe[p];
      zeichne();
      T().fokus(ctx, `[data-vg="platz"][data-p="${p}"]`);
      return;
    }
    const k = s.auswahl, alt = s.reihe.indexOf(k), dort = s.reihe[p];
    if (alt >= 0) s.reihe[alt] = dort;      /* tauschen, wenn die Muschel schon in der Reihe lag */
    s.reihe[p] = k;
    s.auswahl = null;
    s.rueck = '';
    zeichne();
    T().fokus(ctx, s.reihe.includes(null) ? '[data-vg="muschel"]' : '[data-vg="pruefen"]');
  }
  function pruefen() {
    const a = aufgabe(), s = a.zustand;
    if (s.fertig || s.reihe.includes(null)) return;
    const reihe = s.reihe.map(k => a.muscheln[k].form);
    const ok = reihe.join() === a.loesung.join();
    const mitGramm = () => a.loesung.map(f => `${B().MUSCHELN[f]} ${a.muscheln.find(m => m.form === f).masse} g`).join(', ');
    if (ok) {
      s.rueck = `Genau. So liegen die Muscheln richtig: ${mitGramm()}.`;
      fertig(a, true);
    } else if (s.versuche === 0) {
      s.versuche = 1;
      s.rueck = 'Zwei Muscheln stehen noch nicht richtig. Wiege sie noch einmal gegeneinander.';
    } else {
      s.rueck = `So ist die richtige Reihe: ${mitGramm()}.`;
      s.reihe = a.loesung.map(f => a.muscheln.findIndex(m => m.form === f));
      fertig(a, false);
    }
    zeichne();
    ctx.ansagen(s.rueck);
    T().fokus(ctx, s.fertig ? '[data-vg="weiter"]' : '[data-vg="muschel"]');
  }

  function weiter() {
    if (z.i + 1 < z.aufgaben.length) { z.i++; aufgabeZeigen(); return; }
    rundenende();
  }

  /* Stempel: kleine Waage im Stempelrahmen (Code-Grafik) */
  const stempelSvg = () => T().stempel('<path class="stempel__welle" d="M26 44H74M50 44V70M38 70H62"/><path class="stempel__welle" d="M20 44Q26 54 32 44M68 44Q74 54 80 44"/><circle class="stempel__kugel" cx="50" cy="36" r="4"/>');

  function rundenende() {
    const r = T().rundenende(ctx, { id: ID, praefix: 'vg', stufe: z.stufe, geschafft: z.geschafft.filter(Boolean).length, anzahl: z.aufgaben.length, stempelSvg: stempelSvg(), gespeichertFehler: z.gespeichertFehler });
    waagen = [];
    ctx.zeigen(`
      ${kopf(`Stufe ${STUFENNAME[z.stufe]} · Rundenende`)}
      ${r.html}
      ${AM_TISCH(false)}`, 'Rundenende – Massen vergleichen');
    ctx.ansagen(r.text);
    if (r.fehler) ctx.melden(ctx.speicherFehlt);
  }

  /* ---------- Hilfe von Flint, Wörter ---------- */
  const TIPPS = {
    paar: ['Stell dir vor, du hältst beides in der Hand.', 'Was würde deine Hand weiter nach unten ziehen?'],
    taeuscht: ['Stell dir vor, du hältst beides in der Hand.', 'Was würde deine Hand weiter nach unten ziehen?'],
    summe: ['Rechne zusammen, was auf jeder Schale liegt.', 'Unter der Waage steht jetzt, wie viel auf jeder Schale liegt.'],
    welche: ['Rechne bei jeder Waage zusammen, was auf jeder Schale liegt.', 'Unter jeder Waage steht jetzt, wie viel auf jeder Schale liegt.'],
    ordnen: ['Wiege immer zwei Muscheln gegeneinander.', 'Such zuerst die leichteste Muschel. Sie ist leichter als alle anderen.']
  };
  function hilfeZeigen() {
    const a = aufgabe();
    if (!a) {
      T().dialog(ctx, { titel: 'Tipp von Flint', inhalt: `<div class="tipp">${ctx.flintKlein}<p>Wähle eine Stufe. Bei einer Stufe steht: Flint empfiehlt diese Stufe.</p></div>`, knoepfe: '<button type="button" class="knopf haupt" data-dialog="zu">Ich probiere es</button>' });
      return;
    }
    const s = a.zustand, liste = TIPPS[a.art];
    const bis = Math.min(hilfeStufe, liste.length - 1);
    /* Zweiter Tipp in mittel: Summen unter die Waage schreiben (Hilfe für langsamere Kinder) */
    if ((a.art === 'summe' || a.art === 'welche') && bis >= 1 && !s.summenAn && !s.fertig) { s.summenAn = true; buehne(); }
    T().tippDialog(ctx, { liste, bis, fertig: s.fertig, weiter: () => { hilfeStufe++; hilfeZeigen(); } });
  }
  const WOERTER = [
    ['wiegt', 'Der Apfel wiegt 160 Gramm.'],
    ['schwerer als / leichter als', 'Das Buch ist schwerer als der Stift.'],
    ['genauso schwer wie', 'Beide Seiten sind genauso schwer.'],
    ['das Gleichgewicht', 'Die Waage ist gerade. Beide Seiten sind gleich schwer.'],
    ['die Masse', 'So schwer ist etwas. Wir messen sie in Gramm und Kilogramm.']
  ];
  const woerterZeigen = () => T().woerter(ctx, 'Wörter zum Wiegen', WOERTER);

  /* ---------- Bedienung (von der App weitergereicht) ---------- */
  function bedienen(e) {
    const b = e.target.closest('[data-vg]');
    if (!b || b.disabled) return false;
    const was = b.dataset.vg;
    if (was === 'stufe') rundeStarten(b.dataset.stufe);
    else if (was === 'stufen') ansichtStufen();
    else if (was === 'hilfe') hilfeZeigen();
    else if (was === 'woerter') woerterZeigen();
    else if (was === 'vermuten') vermuten(b.dataset.wert);
    else if (was === 'waehle') waehle(Number(b.dataset.i));
    else if (was === 'wiegen') wiegen();
    else if (was === 'muschel') muschelWaehlen(Number(b.dataset.k));
    else if (was === 'schale') aufSchale(b.dataset.seite);
    else if (was === 'platz') aufPlatz(Number(b.dataset.p));
    else if (was === 'pruefen') pruefen();
    else if (was === 'weiter') weiter();
    else return false;
    return true;
  }

  KW.stationen[ID] = {
    id: ID,
    stempelSvg,
    oeffnen(c) { ctx = c; ansichtStufen(); },
    bedienen,
    /* für Rauchtest und Vorschau */
    aufgabe, zustand: () => z, waagen: () => waagen
  };
})();
