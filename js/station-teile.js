/* Kieselwaage: gemeinsame Teile der Stationen (Etappe 2c). Klassisches Skript, legt window.KW.teile an.
   Übernommen aus der Chancenbucht (js/station-teile.js, 15.11.2026): Kopf, Stufenwahl, Rundenende mit Stempel,
   Dialog (Hilfe, Wörter), Fokus. Nur Darstellung und Bedienhilfen, keine Fachlogik.
   Regeln: echte Knöpfe, Fokus in Dialoge hinein und zurück, keine style-Attribute, Texte durch esc(). */
(() => {
  'use strict';
  const KW = window.KW = window.KW || {};
  const C = () => KW.config;
  const ST = () => KW.stand;
  const STUFENNAME = { leicht: 'leicht', mittel: 'mittel', knifflig: 'knifflig' };

  const PFEIL = '<button type="button" class="pfeil-knopf" data-aktion="start" aria-label="Zurück zur Startseite"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M15 5l-7 7 7 7"/></svg></button>';

  /* Kopf einer Station: Zurück, h1, Unterzeile, Wörter, Hilfe. praefix = data-Attribut der Station (vg …) */
  function kopf(ctx, { titel, unterzeile, praefix }) {
    return `<header class="kopf kopf--station">
        <div class="kopf__reihe">
          ${PFEIL}
          <div class="kopf__mitte">
            <h1>${ctx.esc(titel)}</h1>
            ${unterzeile ? `<p class="unterzeile">${ctx.esc(unterzeile).replace(/(Aufgabe \d+ von \d+)/, '<span class="zusammen">$1</span>')}</p>` : ''}
          </div>
          <div class="kopf__werkzeug">
            <button type="button" class="knopf glas-knopf werkzeug-knopf" data-${praefix}="woerter" aria-haspopup="dialog">Wörter</button>
            <button type="button" class="knopf glas-knopf werkzeug-knopf hilfe-knopf" data-${praefix}="hilfe" aria-haspopup="dialog">${ctx.flintKlein}<span>Hilfe</span></button>
          </div>
        </div>
      </header>`;
  }

  /* Aufklapper (So geht's, Am Tisch) */
  function aufklapper(ctx, { klasse, titel, schritte, notiz, offen }) {
    return `
      <details class="papier ${klasse}"${offen ? ' open' : ''}>
        <summary><h2>${ctx.esc(titel)}</h2></summary>
        <ol>${schritte.map(s => `<li>${ctx.esc(s)}</li>`).join('')}</ol>
        ${notiz ? `<p class="leise">${ctx.esc(notiz)}</p>` : ''}
      </details>`;
  }

  /* Stufenwahl: Empfehlung = erste Stufe ohne Stempel */
  const empfohlen = id => C().stufen.find(st => !ST().hatStempel(id, st)) || 'knifflig';
  const erstesMal = id => C().stufen.every(st => !ST().runden(id, st));
  function stufenListe(ctx, id, praefix) {
    const emp = empfohlen(id);
    return `
      <section class="papier" aria-labelledby="h-stufe">
        <h2 id="h-stufe">Wähle eine Stufe</h2>
        <ul class="stufen-liste">
          ${C().stufen.map(st => `
            <li><button type="button" class="knopf stufe-knopf${st === emp ? ' stufe-knopf--empfohlen' : ''}" data-${praefix}="stufe" data-stufe="${st}">
              <span class="stufe-knopf__name">${ctx.esc(STUFENNAME[st])}</span>
              <span class="stufe-knopf__info">${ST().hatStempel(id, st) ? '<span class="stempel-punkt stempel-punkt--voll" aria-hidden="true"></span> Stempel geschafft' : '<span class="stempel-punkt" aria-hidden="true"></span> Noch kein Stempel'}${st === emp ? ' · Flint empfiehlt diese Stufe' : ''}</span>
            </button></li>`).join('')}
        </ul>
      </section>`;
  }

  /* Rundenende: Stempel geben (ab stempelAb geschafften), Text, Knöpfe. Gibt { html, text, fehler } zurück. */
  function rundenende(ctx, { id, praefix, stufe, geschafft, anzahl, stempelSvg, gespeichertFehler }) {
    const ab = C().runde.stempelAb;
    const hatteSchon = ST().hatStempel(id, stufe);
    let neu = false, fehler = gespeichertFehler;
    if (geschafft >= ab && !hatteSchon) {
      if (!ST().istVorschau && ST().stempelGeben(id, stufe) === false) fehler = true;
      neu = true;
    }
    const naechste = C().stufen[C().stufen.indexOf(stufe) + 1];
    let text;
    if (geschafft >= ab && neu) text = `Du hast ${geschafft} von ${anzahl} geschafft. Du bekommst den Stempel für die Stufe ${STUFENNAME[stufe]}.`;
    else if (geschafft >= ab) text = `Du hast ${geschafft} von ${anzahl} geschafft. Diesen Stempel hast du schon. Jede Runde übt trotzdem.`;
    else text = `Du hast ${geschafft} von ${anzahl} geschafft. Für den Stempel brauchst du ${ab}. Probier es noch einmal, die Aufgaben sind dann neu.`;
    const weiter = naechste && geschafft >= ab;
    const haupt = weiter ? { stufe: naechste, text: `Weiter mit ${STUFENNAME[naechste]}` } : { stufe, text: `Noch eine Runde ${STUFENNAME[stufe]}` };
    const html = `
      <section class="rundenende${geschafft >= ab ? ' rundenende--geschafft' : ''}" aria-labelledby="h-ende">
        <h2 id="h-ende" class="nurvorlesen">Rundenende</h2>
        <div class="stempel-gross${geschafft >= ab || hatteSchon ? ' stempel-gross--voll' : ''}${neu ? ' stempel-gross--neu' : ''}" aria-hidden="true">${stempelSvg}</div>
        <div class="rundenende__satz">${ctx.flintKlein}<p class="rundenende__text">${ctx.esc(text)}</p></div>
        <p class="knopfreihe knopfreihe--mitte">
          <button type="button" class="knopf haupt rundenende__haupt" data-${praefix}="stufe" data-stufe="${haupt.stufe}">${ctx.esc(haupt.text)}</button>
        </p>
        <p class="knopfreihe knopfreihe--mitte rundenende__weitere">
          ${weiter ? `<button type="button" class="knopf knopf--klein" data-${praefix}="stufe" data-stufe="${stufe}">Noch eine Runde ${ctx.esc(STUFENNAME[stufe])}</button>` : ''}
          <button type="button" class="knopf knopf--klein" data-${praefix}="stufen">Andere Stufe</button>
          <button type="button" class="knopf knopf--klein" data-aktion="start">Zur Startseite</button>
        </p>
      </section>`;
    return { html, text, fehler };
  }
  /* Stempelrahmen (Doppelkreis) um ein eigenes Motiv */
  const stempel = motiv => `<svg class="stempel-bild" viewBox="0 0 100 100" focusable="false"><circle class="stempel__rand" cx="50" cy="50" r="44"/><circle class="stempel__rand stempel__rand--innen" cx="50" cy="50" r="36"/>${motiv}</svg>`;

  /* ---------- Dialog (ein gemeinsamer <dialog>) ---------- */
  let opener = null, beiTipp = null;
  function dialog(ctx, { titel, inhalt, knoepfe, tipp }) {
    let d = document.getElementById('station-dialog');
    if (!d) {
      d = document.createElement('dialog');
      d.id = 'station-dialog';
      d.className = 'dialog';
      d.setAttribute('aria-labelledby', 'station-dialog-titel');
      document.body.appendChild(d);
      d.addEventListener('close', () => { if (opener && document.contains(opener)) opener.focus(); opener = null; });
      d.addEventListener('click', e => {
        const b = e.target.closest('[data-dialog]');
        if (!b) return;
        if (b.dataset.dialog === 'zu') d.close();
        if (b.dataset.dialog === 'tipp' && beiTipp) beiTipp();
      });
    }
    beiTipp = tipp || null;
    d.innerHTML = `<h2 id="station-dialog-titel">${ctx.esc(titel)}</h2>${inhalt}<p class="knopfreihe">${knoepfe}</p>`;
    if (!d.open) { opener = document.activeElement; d.showModal(); }
    const erster = d.querySelector('[data-dialog="tipp"]:not([disabled]), [data-dialog="zu"]');
    if (erster) erster.focus();
    return d;
  }
  /* Gestufte Tipps. liste: alle Tipps, bis: Index des letzten gezeigten */
  function tippDialog(ctx, { liste, bis, fertig, weiter }) {
    const zu = '<button type="button" class="knopf haupt" data-dialog="zu">Ich probiere es</button>';
    if (fertig) return dialog(ctx, { titel: 'Tipp von Flint', inhalt: `<div class="tipp">${ctx.flintKlein}<p>Du hast diese Aufgabe schon fertig. Tippe auf Weiter.</p></div>`, knoepfe: zu });
    const mehr = bis < liste.length - 1;
    return dialog(ctx, {
      titel: 'Tipp von Flint',
      inhalt: `<div class="tipp">${ctx.flintKlein}<ol class="tipp-liste">${liste.slice(0, bis + 1).map(t => `<li>${ctx.esc(t)}</li>`).join('')}</ol></div>`,
      knoepfe: `${mehr ? '<button type="button" class="knopf" data-dialog="tipp">Noch ein Tipp</button>' : ''}${zu}`,
      tipp: weiter
    });
  }
  /* Wortspeicher: zeilen [[Wort, Beispielsatz]] */
  function woerter(ctx, titel, zeilen) {
    return dialog(ctx, {
      titel,
      inhalt: `
      <div class="wortspeicher">
        <table class="wortspeicher__tabelle">
          <tbody>
            ${zeilen.map(([w, b]) => `<tr><th scope="row">${ctx.esc(w)}</th><td>${ctx.esc(b)}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>`,
      knoepfe: '<button type="button" class="knopf haupt" data-dialog="zu">Schließen</button>'
    });
  }

  function fokus(ctx, sel) {
    const el = ctx.app.querySelector(sel);
    if (el && !el.disabled) el.focus({ preventScroll: false });
  }

  /* Nach einer passenden Antwort leuchtet der richtige Knopf einmal ruhig auf (nur transform, nicht bei reduzierter Bewegung) */
  function aufleuchten(el) {
    const ruhig = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (el && !ruhig && typeof el.animate === 'function') {
      el.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.045)' }, { transform: 'scale(1)' }], { duration: 520, easing: 'cubic-bezier(0.2, 0.7, 0.3, 1)' });
    }
  }

  /* ---------- Steinkasten (Etappe 3): Satz aus dem Buch, jeder Stein so oft wie im Satz ----------
     gelegt: Liste der Indizes in KW.config.waage.gewichtssteine, die gerade auf der rechten Schale liegen. */
  function steinkasten(ctx, { praefix, gelegt, gesperrt = false }) {
    const satz = C().waage.gewichtssteine, B = KW.waageBild;
    const auf = gelegt.slice().sort((a, b) => satz[b] - satz[a] || a - b);
    return `
      <div class="steinkasten">
        <p class="frage-klein" id="steinkasten-titel">Deine Gewichtssteine</p>
        <ul class="steinkasten__liste" aria-labelledby="steinkasten-titel">
          ${satz.map((m, i) => `<li><button type="button" class="knopf stein-knopf" data-${praefix}="stein" data-i="${i}" aria-label="${gelegt.includes(i) ? `${ctx.esc(B.steinText(m))}, schon auf der Waage` : `${ctx.esc(B.steinText(m))} auf die rechte Schale legen`}"${gelegt.includes(i) || gesperrt ? ' disabled' : ''}>${B.steinSymbol(m)}<span aria-hidden="true">${ctx.esc(B.steinText(m))}</span></button></li>`).join('')}
        </ul>
        <p class="leise">${gelegt.length ? 'Auf der Schale. Tippe einen Stein an, um ihn zurückzulegen:' : 'Tippe einen Stein an. Er kommt auf die rechte Schale.'}</p>
        ${gelegt.length ? `<ul class="auf-schale">${auf.map(i => `<li><button type="button" class="knopf" data-${praefix}="zurueck" data-i="${i}" aria-label="${ctx.esc(B.steinText(satz[i]))} zurücklegen"${gesperrt ? ' disabled' : ''}>${ctx.esc(B.steinText(satz[i]))}</button></li>`).join('')}</ul>
        <p class="knopfreihe"><button type="button" class="knopf knopf--klein" data-${praefix}="alle-zurueck"${gesperrt ? ' disabled' : ''}>Alle Steine zurück</button></p>` : ''}
      </div>`;
  }
  /* Tap auf einen Stein der rechten Schale im Waagenbild (iPad-Befund Ingo 16.11.2026): Kinder tippen dort,
     nicht nur auf die Knöpfe darunter. Gibt den Index (in gelegt) des Steins zurück, der zurückgelegt wird, sonst -1.
     Nur selbst gelegte Steine (beim Ergänzen bleiben die vorgegebenen liegen). Die Knöpfe bleiben für Tastatur und VoiceOver. */
  function steinImBild(e, gelegt) {
    const st = e.target && e.target.closest ? e.target.closest('.wb-schale--rechts .wb-stein') : null;
    if (!st || !gelegt) return -1;
    const m = Number(st.getAttribute('data-masse')), satz = C().waage.gewichtssteine;
    const passend = gelegt.filter(i => satz[i] === m);
    return passend.length ? passend[passend.length - 1] : -1;
  }
  /* Ziffern-Tastatur (Etappe 3): eigene Tasten statt iPad-Tastatur, dazu ein normales Feld für Tastatur und Screenreader */
  function ziffern(ctx, { praefix, frage, einheit = 'g', gesperrt = false, wert = '' }) {
    return `
      <div class="ziffern" role="group" aria-labelledby="ziffern-frage">
        <p class="frage-klein" id="ziffern-frage">${ctx.esc(frage)}</p>
        <div class="ziffern__anzeige">
          <input type="text" id="ziffern-feld" class="ziffern__feld" inputmode="none" autocomplete="off" maxlength="4" pattern="[0-9]*" value="${ctx.esc(wert)}" aria-labelledby="ziffern-frage"${gesperrt ? ' disabled' : ''}>
          <span class="ziffern__einheit" aria-hidden="true">${ctx.esc(einheit)}</span>
        </div>
        <div class="ziffern__tasten">
          ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(z => `<button type="button" class="knopf" data-${praefix}="ziffer" data-z="${z}"${gesperrt ? ' disabled' : ''}>${z}</button>`).join('')}
          <button type="button" class="knopf" data-${praefix}="loeschen" aria-label="Letzte Ziffer löschen"${gesperrt ? ' disabled' : ''}>⌫</button>
          <button type="button" class="knopf" data-${praefix}="ziffer" data-z="0"${gesperrt ? ' disabled' : ''}>0</button>
          <button type="button" class="knopf" data-${praefix}="leeren" aria-label="Zahl löschen"${gesperrt ? ' disabled' : ''}>C</button>
          <button type="button" class="knopf haupt ziffern__fertig" data-${praefix}="fertig"${gesperrt ? ' disabled' : ''}>Fertig</button>
        </div>
      </div>`;
  }
  /* Tasten der Ziffern-Tastatur: ändern nur das Feld; Rückgabe: aktueller Wert (nur Ziffern) */
  function zifferTaste(ctx, was, z) {
    const f = ctx.app.querySelector('#ziffern-feld');
    if (!f) return '';
    let v = f.value.replace(/\D/g, '');
    if (was === 'ziffer' && v.length < 4) v = (v === '0' ? '' : v) + z;
    if (was === 'loeschen') v = v.slice(0, -1);
    if (was === 'leeren') v = '';
    f.value = v;
    return v;
  }
  /* Enter im Zahlenfeld = „Fertig“ (für Tastatur) */
  document.addEventListener('keydown', e => {
    if (e.key !== 'Enter' || !e.target || e.target.id !== 'ziffern-feld') return;
    const f = e.target.closest('.ziffern') && e.target.closest('.ziffern').querySelector('.ziffern__fertig');
    if (f && !f.disabled) { e.preventDefault(); f.click(); }
  });
  const zifferWert = ctx => { const f = ctx.app.querySelector('#ziffern-feld'); const v = f ? f.value.replace(/\D/g, '') : ''; return v === '' ? null : Number(v); };

  KW.teile = { steinkasten, steinImBild, ziffern, zifferTaste, zifferWert, PFEIL, STUFENNAME, kopf, aufklapper, empfohlen, erstesMal, stufenListe, rundenende, stempel, dialog, tippDialog, woerter, fokus, aufleuchten };
})();
