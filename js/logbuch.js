/* Kieselwaage: Logbuch (Etappe 4) mit Stempel-Tafel, „Das kann ich schon“ und Urkunde.
   Übernommen aus der Chancenbucht (js/logbuch.js, 15.11.2026), Sätze neu geschrieben.
   Klassisches Skript, legt window.KW.logbuch an. Braucht KW.config, KW.stand, KW.teile, KW.stationen (stempelSvg), KW.urkunde.
   Texte von Ingo freigegeben am 16.11.2026.
   Gelesen wird nur stempel. Es gibt keine Zahlen (keine Aufgaben, keine Zeit, wie in der Chancenbucht).
   Urkunde ab leicht und mittel in allen vier Stationen (8 Stempel, wie in der Chancenbucht; Ingo 16.11.2026).
   Der Vorname kommt nur über textContent auf die Seite und nur in die Urkunde auf dem Gerät. */
(() => {
  'use strict';
  const KW = window.KW = window.KW || {};
  const C = () => KW.config;
  const ST = () => KW.stand;
  const T = () => KW.teile;
  const URKUNDE_STUFEN = ['leicht', 'mittel'];

  const SAETZE = {
    vergleichen: { leicht: 'Ich sage voraus, welches Ding schwerer ist, und prüfe es mit der Waage.', mittel: 'Ich rechne zusammen, was auf jeder Schale liegt, und erkenne das Gleichgewicht.', knifflig: 'Ich ordne Dinge nach ihrer Masse, nur mit der Waage.' },
    gleichgewicht: { leicht: 'Ich bringe eine Waage mit Gewichtssteinen ins Gleichgewicht.', mittel: 'Ich finde mehr als einen Weg, eine Masse mit Steinen zu legen.', knifflig: 'Ich finde heraus, wie schwer ein Kiesel ist, ohne seine Zahl zu kennen.' },
    gramm: { leicht: 'Ich lese an den Gewichtssteinen ab, wie schwer etwas ist. Ich weiß, ob etwas Gramm oder Kilogramm wiegt.', mittel: 'Ich ergänze bis 1 kg. Ein halbes Kilogramm sind 500 g.', knifflig: 'Ich rechne um: 1 kg 250 g sind 1250 g.' },
    stimmt: { leicht: 'Ich prüfe Behauptungen mit der Waage.', mittel: 'Ich weiß: Groß heißt nicht immer schwer.', knifflig: 'Ich weiß: 1 kg und 1000 g sind gleich schwer.' }
  };

  const anzahlStempel = () => ST().SCHLUESSEL.filter(k => { const [s, st] = k.split(':'); return ST().hatStempel(s, st); }).length;
  const fehlend = () => C().stationen.flatMap(s => URKUNDE_STUFEN.filter(st => !ST().hatStempel(s.id, st)).map(st => `${s.name} (${st})`));
  const urkundeBereit = () => fehlend().length === 0;
  const verdienteSaetze = () => C().stationen.flatMap(s => C().stufen.filter(st => ST().hatStempel(s.id, st)).map(st => ({ station: s.id, stufe: st, satz: SAETZE[s.id][st] })));

  let ctx = null, urkundeUrl = null, urkundeDatei = null;
  function zeigen(c) {
    ctx = c;
    const esc = ctx.esc;
    const stationen = C().stationen;
    const motiv = id => (KW.stationen && KW.stationen[id] && KW.stationen[id].stempelSvg) ? KW.stationen[id].stempelSvg() : T().stempel('');
    const saetze = verdienteSaetze();
    const fehlt = fehlend();
    /* B14: Die Urkunde steht oben, sobald sie bereit ist; vorher unten mit dem, was noch fehlt */
    const urkundeHtml = `
      <section class="papier logbuch" aria-labelledby="lb-urkunde">
        <h2 id="lb-urkunde">Urkunde</h2>
        ${fehlt.length ? `<p>Die Urkunde gibt es, wenn du in jeder Station leicht und mittel geschafft hast.</p><p>Dir fehlen noch: ${esc(fehlt.join(', '))}.</p>`
          : `<p>Du hast in jeder Station leicht und mittel geschafft. Du kannst dir eine Urkunde machen.</p>
             <p class="knopfreihe"><button type="button" class="knopf haupt" data-lb="urkunde">Urkunde erstellen</button></p>
             <p id="lb-status" role="status"></p>
             <p class="knopfreihe" id="lb-fertig" hidden>
               <a class="knopf haupt" id="lb-ansehen" href="#" target="_blank" rel="noopener">Urkunde ansehen</a>
               <button type="button" class="knopf" data-lb="teilen" id="lb-teilen" hidden>Teilen</button>
             </p>
             <p class="leise">Die Urkunde macht das Gerät selbst. Sie wird nicht gespeichert und nicht verschickt.</p>`}
      </section>`;
    ctx.zeigen(`
      <header class="kopf kopf--station">
        <div class="kopf__reihe">
          ${T().PFEIL}
          <div class="kopf__mitte">
            <h1>Mein Logbuch</h1>
            <p class="unterzeile">Hier steht, was du schon kannst.</p>
          </div>
          <div class="kopf__werkzeug"></div>
        </div>
      </header>
      ${fehlt.length ? '' : urkundeHtml}
      <section class="papier logbuch" aria-labelledby="lb-stempel">
        <h2 id="lb-stempel">Meine Stempel</h2>
        <ul class="logbuch__tafel">
          ${stationen.map(s => `
            <li class="logbuch__zeile">
              <h3 class="logbuch__station">${esc(s.name)}</h3>
              <ul class="logbuch__stempel" aria-label="${esc(s.name)}: ${C().stufen.map(st => `${st} ${ST().hatStempel(s.id, st) ? 'geschafft' : 'noch offen'}`).join(', ')}">
                ${C().stufen.map(st => `<li class="logbuch__stufe${ST().hatStempel(s.id, st) ? ' logbuch__stufe--voll' : ''}" aria-hidden="true">
                  <span class="logbuch__bild">${ST().hatStempel(s.id, st) ? motiv(s.id) : ''}</span>
                  <span class="logbuch__wort">${esc(st)}</span>
                  ${ST().hatStempel(s.id, st) ? '' : '<span class="logbuch__offen">noch offen</span>'}
                </li>`).join('')}
              </ul>
              <button type="button" class="knopf logbuch__hin" data-aktion="station" data-id="${esc(s.id)}">Zur Station</button>
            </li>`).join('')}
        </ul>
      </section>
      <section class="papier logbuch" aria-labelledby="lb-kann">
        <h2 id="lb-kann">Das kann ich schon</h2>
        ${saetze.length ? `<ul class="logbuch__kann">${stationen.filter(s => saetze.some(x => x.station === s.id)).map(s => `
          <li><h3>${esc(s.name)}</h3><ul>${saetze.filter(x => x.station === s.id).map(x => `<li>${esc(x.satz)}</li>`).join('')}</ul></li>`).join('')}</ul>`
          : '<p>Hier stehen bald deine ersten Sätze. Such dir eine Station aus.</p>'}
      </section>
      ${fehlt.length ? urkundeHtml : ''}`, 'Mein Logbuch');
  }

  async function urkundeErstellen(knopf) {
    if (!urkundeBereit()) return;
    const status = ctx.app.querySelector('#lb-status'), fertig = ctx.app.querySelector('#lb-fertig');
    const ansehen = ctx.app.querySelector('#lb-ansehen'), teilen = ctx.app.querySelector('#lb-teilen');
    knopf.disabled = true;
    status.textContent = 'Deine Urkunde wird gemacht …';
    try {
      const k = ST().aktiv();
      const r = await KW.urkunde.erstellen({
        name: (k && k.name) || 'Forscherin oder Forscher', datum: new Date(),
        stationen: C().stationen.map(s => ({ id: s.id, name: s.name })), stufen: C().stufen.slice(),
        hat: (id, st) => ST().hatStempel(id, st), saetze: verdienteSaetze(),
        flintSrc: `bilder/flint-512.jpg?b=${C().bildStand}`,
        motiv: id => (KW.stationen && KW.stationen[id] && KW.stationen[id].stempelSvg) ? KW.stationen[id].stempelSvg() : null
      });
      if (urkundeUrl) URL.revokeObjectURL(urkundeUrl);
      urkundeUrl = URL.createObjectURL(r.blob);
      ansehen.href = urkundeUrl;
      ansehen.setAttribute('download', r.dateiname);
      urkundeDatei = typeof File === 'function' ? new File([r.blob], r.dateiname, { type: 'application/pdf' }) : null;
      teilen.hidden = !(urkundeDatei && navigator.canShare && navigator.canShare({ files: [urkundeDatei] }));
      fertig.hidden = false;
      status.textContent = 'Deine Urkunde ist fertig.';
      KW.urkunde.letzte = r;   /* nur für den Rauchtest */
      ansehen.focus();
    } catch (e) {
      status.textContent = 'Die Urkunde konnte gerade nicht gemacht werden. Versuch es noch einmal.';
    }
    knopf.disabled = false;
  }
  async function urkundeTeilen() {
    const status = ctx.app.querySelector('#lb-status');
    if (!urkundeDatei || !navigator.share) return;
    try { await navigator.share({ files: [urkundeDatei], title: 'Meine Urkunde' }); status.textContent = 'Geteilt.'; }
    catch (e) { if (!e || e.name !== 'AbortError') status.textContent = 'Teilen klappt hier gerade nicht. Tippe auf „Urkunde ansehen“.'; }
  }

  function bedienen(e) {
    const b = e.target.closest('[data-lb]');
    if (!b || b.disabled) return false;
    if (b.dataset.lb === 'urkunde') urkundeErstellen(b);
    else if (b.dataset.lb === 'teilen') urkundeTeilen();
    else return false;
    return true;
  }

  KW.logbuch = { SAETZE, URKUNDE_STUFEN, zeigen, bedienen, anzahlStempel, fehlend, urkundeBereit, verdienteSaetze };
})();
