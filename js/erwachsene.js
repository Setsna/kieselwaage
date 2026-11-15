/* Kieselwaage: Texte für den Erwachsenenbereich (zwei Aufklapper unter der Startseite).
   Aufbau wie in der Chancenbucht (js/erwachsene.js), damit alle Plattformen gleich aussehen.
   Abschnitte: titel, absaetze [Text], liste [[fett, Text]], tabelle { kopf: [..], zeilen: [[..]] }, datenschutzLink.
   Alles läuft in js/app.js durch esc(), es gibt kein HTML in den Texten.
   Von Ingo freigegeben am 16.11.2026.
   Seitenzahlen im Lehrkräfte-Teil: gedruckte Seiten von Denken und Rechnen 3 (PDF-Seite minus 2). */
(() => {
  'use strict';
  const KW = window.KW = window.KW || {};
  const DATEN = 'Die Kinder melden sich mit ihrem Zugangscode an. Es ist derselbe wie beim Perlentaucher. Gespeichert werden unter diesem Code nur die Stempel und die Zahl der geschafften Aufgaben je Station und Stufe. Vermutungen, gelegte Steine und eingetippte Zahlen werden nicht gespeichert. Der Stand liegt zusätzlich im Browser des Geräts, damit auch ohne Internet gearbeitet werden kann. Andere Kinder sehen ihn nicht, eine Auswertung für die Lehrkraft gibt es nicht. Löschen lassen können Sie den Stand über die Lehrkraft.';
  const DATEN_URKUNDE = 'Die Urkunde entsteht auf dem Gerät und wird weder gespeichert noch verschickt.';

  KW.erwachsene = {
    eltern: {
      titel: 'Für Eltern',
      abschnitte: [
        { titel: 'Worum es geht', absaetze: [
          'In der Kieselwaage üben Kinder der Klasse 3 das Wiegen. Sie vergleichen Dinge, bringen eine Waage mit Gewichtssteinen ins Gleichgewicht und rechnen mit Gramm und Kilogramm.',
          'Dabei vermuten sie zuerst und prüfen dann mit der Waage.'
        ] },
        { titel: 'Die vier Stationen', liste: [
          ['Massen vergleichen', 'Was ist schwerer? Erst vermuten, dann wiegen. Dinge nur mit der Waage ordnen.'],
          ['Gleichgewicht', 'Gewichtssteine legen, bis die Waage gerade ist.'],
          ['Gramm und Kilogramm', 'Steine ablesen, bis 1 kg ergänzen, Kilogramm in Gramm umrechnen.'],
          ['Kann das stimmen?', 'Flint behauptet etwas, Ihr Kind prüft es mit der Waage.']
        ] },
        { titel: 'Gut zu wissen', absaetze: [
          'Es gibt keinen Zeitdruck und keine Rangliste. Ihr Kind darf so oft wiegen, wie es möchte.',
          'Die Waage auf dem Bildschirm ersetzt nicht das Anfassen: Wie schwer 1 kg ist, spürt man nur in der Hand.'
        ] },
        { titel: 'Tipp für zu Hause', absaetze: [
          'Wiegen Sie gemeinsam in der Küche: Was ist schwerer, eine Tasse oder ein Löffel? Erst raten, dann mit der Küchenwaage prüfen.',
          'Halten Sie eine 1-kg-Packung Mehl oder Zucker in der Hand und suchen Sie Dinge, die ungefähr so schwer sind.'
        ] },
        { titel: 'Daten', absaetze: [DATEN, DATEN_URKUNDE], datenschutzLink: true },
        { titel: 'Der Code', absaetze: [
          'Der Code gehört Ihrem Kind. Wer ihn kennt, kann sich damit anmelden. Auf einem fremden Gerät am Ende bitte auf „Abmelden“ tippen.'
        ] }
      ]
    },
    lehrkraefte: {
      titel: 'Für Lehrkräfte',
      abschnitte: [
        { titel: 'Konzept', absaetze: [
          'Leitidee Größen und Messen, Größenbereich Masse: Massen vergleichen und ordnen, mit der Tafelwaage und Gewichtssteinen messen, Gramm und Kilogramm und ihre Beziehung (1 kg = 1000 g), Repräsentanten nutzen.',
          'Die Waage rechnet genau: ganze Gramm, Gleichgewicht nur bei genau gleicher Masse. Jede Lösung wird berechnet. Keine Kommazahlen, keine Tonne, keine Zeichen <, =, >, keine Platzhalter.'
        ] },
        { titel: 'Prinzip und Umsetzung', tabelle: { kopf: ['Prinzip', 'Umsetzung'], zeilen: [
          ['Erst vermuten, dann wiegen', 'Ein Riegel hält die Waage fest, bis das Kind vermutet hat. Die Vermutung bleibt neben dem Ergebnis stehen.'],
          ['Waage statt Rechnen allein', 'Die Waage zeigt, welche Seite schwerer ist. Rechnen hilft beim Vorhersagen, die Waage prüft.'],
          ['Mehrere Lösungen', 'Beim Ausgleichen zählt jede passende Steinmenge, geprüft per Rechnung. „Zwei Wege“ verlangt eine zweite, andere Lösung.'],
          ['Realistische Massen', 'Gegenstände haben einen Bereich. Paare kommen nur, wenn der schwerere auch im ungünstigsten Fall doppelt so schwer ist.'],
          ['Fehlvorstellungen prüfen', '„Groß heißt schwer“ oder „1 kg ist mehr als 1000 g“: Flint behauptet es, das Kind prüft es.'],
          ['Differenzierung', 'Drei Stufen je Station. Die Seite empfiehlt eine, das Kind wählt. Gestufte Tipps, Summen und Zwischensummen als Hilfe.'],
          ['Kein Zeitdruck', 'Beliebig oft wiegen. Keine Punkte, keine Rangliste.'],
          ['Am Tisch', 'Zu jeder Station eine Idee mit Kleiderbügelwaage, Büroklammern oder einer 1-kg-Packung.']
        ] } },
        { titel: 'Die Stationen und das Heft', absaetze: ['Denken und Rechnen 3, gedruckte Seiten.'], liste: [
          ['Massen vergleichen', 'Vergleichen, ordnen, Gleichgewicht. Knüpft an S. 72 an.'],
          ['Gleichgewicht', 'Mit Gewichtssteinen ausgleichen (S. 73), die Masse eines Kiesels durch Ausgleichen finden (S. 77).'],
          ['Gramm und Kilogramm', 'Steine ablesen und addieren (S. 73), halbes und Viertel Kilogramm, ergänzen bis 1 kg (S. 75), Kilogramm oder Gramm? (S. 77).'],
          ['Kann das stimmen?', 'Behauptungen mit der Waage prüfen. Knüpft an S. 73 und S. 77 an.']
        ] },
        { titel: 'Lehrplanbezug', absaetze: [
          'LP Thüringen Mathematik (Erprobungsfassung 2026), Leitidee Größen und Messen. „Größen vergleichen und ordnen (Masse)“ und die Einheiten kg und g stehen in der Spalte Klassenstufe 4, das Messen mit Messgeräten und die Beziehungen der Einheiten in beiden Spalten. Klasse 3 legt das Schulcurriculum fest.'
        ] },
        { titel: 'Einsatz', absaetze: [
          'Gut als Station im Wochenplan, am besten nach eigenen Versuchen mit einer echten Waage.',
          'Erst am Tisch wiegen, dann am Gerät üben und prüfen.'
        ] },
        { titel: 'Daten', absaetze: [DATEN, DATEN_URKUNDE], datenschutzLink: true }
      ]
    }
  };
})();
