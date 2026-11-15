/* Kieselwaage: alle Einstellungen an einer Stelle.
   Klassisches Skript, legt window.KW.config an. */
(() => {
  'use strict';
  const KW = window.KW = window.KW || {};

  KW.config = {
    name: 'Kieselwaage',
    unterzeile: 'Erst vermuten, dann wiegen.',
    maskottchen: 'Flint',

    /* Speicher im Browser (Baukasten js/konto-speicher.js):
       localStorage   kieselwaage-v1.k<kennung>            Stand samt Vorname (für die Anzeige ohne Netz)
                      kieselwaage-v1.k<kennung>.abgleich   zuletzt abgeglichener Stand
       sessionStorage kieselwaage-v1-wer                   welches Kind in diesem Tab angemeldet ist
       Die Kennung wird aus dem Code errechnet, der Code selbst steht nicht im Namen. */
    speicher: { schluessel: 'kieselwaage', schema: 1 },
    codeLaenge: 8,
    nameMaxLaenge: 20,

    /* Gemeinsames Konto: das Firebase-Projekt des Perlentauchers (dieselben Angaben wie in der Chancenbucht).
       Diese Angaben sind keine Geheimnisse, sie stehen bei jeder Firebase-Seite im Quelltext.
       Geschützt werden die Daten durch die Regeln in der Firebase-Konsole (Block kw_stand, veröffentlicht am 16.11.2026). */
    firebase: {
      apiKey: 'AIzaSyBX3MUJq69uFyejbEiJimGeAtHMER3OCdE',
      authDomain: 'lernplattform-44aa1.firebaseapp.com',
      projectId: 'lernplattform-44aa1',
      storageBucket: 'lernplattform-44aa1.firebasestorage.app',
      messagingSenderId: '213839225177',
      appId: '1:213839225177:web:4cf676269e50c708466c48'
    },
    cloud: {
      kinder: 'kinder',        /* kinder/<code>: Vorname, von der Lehrkraft angelegt (nur lesen) */
      stand: 'kw_stand',       /* kw_stand/<code>: der Stand dieses Kindes in der Kieselwaage */
      schreibPauseMs: 2500     /* so lange nach der letzten Änderung warten, dann gebündelt schreiben */
    },

    /* Stationen und Stufen (Mini-Spec Etappe 1, Ingo 15.11.2026). Die Ids sind Teil der Firebase-Regeln
       (feste Schlüssel 'station:stufe'). Eine neue Station oder Stufe braucht eine Regeländerung
       (Regel-Block kw_stand und tools/test/kw-gueltig.js). live: true erst, wenn das Modul fertig ist. */
    stationen: [
      { id: 'vergleichen', name: 'Massen vergleichen', kurz: 'Was ist schwerer?', live: true },
      { id: 'gleichgewicht', name: 'Gleichgewicht', kurz: 'Bring die Waage ins Lot', live: true },
      { id: 'gramm', name: 'Gramm und Kilogramm', kurz: 'Mit Gewichtssteinen wiegen', live: true },
      { id: 'stimmt', name: 'Kann das stimmen?', kurz: 'Behauptungen prüfen', live: true }
    ],
    stufen: ['leicht', 'mittel', 'knifflig'],

    /* Waage (Mini-Spec Etappe 1, Ingo 15.11.2026).
       Gewichtssteine: der Satz aus Denken und Rechnen 3, gedruckt S. 73 (zusammen 2000 g, jede ganze Zahl 1 bis 2000 legbar).
       Ausschlag: fester Winkel bei jeder Differenz ungleich 0, wie eine Tafelwaage am Anschlag. */
    waage: {
      gewichtssteine: [1000, 500, 200, 100, 100, 50, 20, 10, 10, 5, 2, 2, 1],
      neigungGrad: 12
    },

    /* Runde: 6 Aufgaben, Stempel ab 5 geschafften (Mini-Spec Etappe 2, Ingo 15.11.2026, wie Chancenbucht) */
    runde: { aufgaben: 6, stempelAb: 5 },

    /* Obergrenze für runden je Schlüssel (wie im Regel-Block) */
    rundenMax: 100000,

    /* Versionsnummer der Bilder, getrennt von ?v=N für js und css */
    bildStand: 3
  };
})();
