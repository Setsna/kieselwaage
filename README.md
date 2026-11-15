# Kieselwaage

Lernplattform zum Wiegen für die Klasse 3 (8 bis 9 Jahre).
Die Kinder vergleichen Dinge auf einer Tafelwaage, bringen sie mit Gewichtssteinen ins Gleichgewicht, rechnen mit Gramm und Kilogramm und prüfen Behauptungen. Sie vermuten zuerst und wiegen dann.
Begleiter ist Flint, ein Seeotter. Es gibt keine Punkte, keinen Zeitdruck und keine Ranglisten.

**Adresse:** https://setsna.github.io/kieselwaage/

Schwesterseite der [Lernlagune](https://lernlagune.de), zusammen mit Perlentaucher, KI-Korallenriff, Riff-Akten, Flaschenpost, Seesternwerkstatt, Zahlenschwarm und Chancenbucht.

## Stationen

Jede Station hat drei Stufen (leicht, mittel, knifflig). Eine Runde hat sechs Aufgaben, ab fünf geschafften gibt es einen Stempel.

| Station | Was geübt wird |
|---|---|
| Massen vergleichen | erst vermuten, dann wiegen; Kiesel mit Zahl zusammenrechnen; „Welche Waage ist im Gleichgewicht?“; Muscheln nur mit der Waage ordnen |
| Gleichgewicht | Gewichtssteine legen, bis die Waage gerade ist; zwei Wege zur gleichen Masse; die Masse eines Kiesels ohne Zahl finden |
| Gramm und Kilogramm | Steine ablesen und addieren, Gramm oder Kilogramm?, ergänzen bis 1 kg, halbes und Viertel Kilogramm, umrechnen |
| Kann das stimmen? | Flint behauptet etwas, das Kind prüft es mit der Waage |

Dazu ein Logbuch mit allen Stempeln und „Das kann ich schon“ und eine Urkunde als PDF, die auf dem Gerät entsteht.

Grundlage ist der Lehrplan Thüringen Mathematik Grundschule (Leitidee Größen und Messen). Inhaltliche Vorlage für Art und Stufe der Aufgaben ist das Lehrwerk Denken und Rechnen 3. Alle Texte und Aufgaben sind selbst geschrieben.

## Fachliche Grundsätze

- Massen sind ganze Gramm. Gleichgewicht nur bei genau gleicher Masse, ohne Toleranz.
- Der Ausschlag hängt nur davon ab, welche Seite schwerer ist (fester Winkel, wie eine Tafelwaage am Anschlag).
- Lösungen werden aus den Massen berechnet, nie aus einer Liste gelesen. Beim Ausgleichen zählt jede passende Steinmenge.
- Gewichtssteine wie im Buch: 1 kg, 500 g, 200 g, 100 g, 100 g, 50 g, 20 g, 10 g, 10 g, 5 g, 2 g, 2 g, 1 g.
- Keine Kommazahlen, keine Tonne, keine Zeichen <, =, >, keine Platzhalter.

## Was liegt wo?

| Datei | Inhalt |
|---|---|
| `index.html` | Grundgerüst der Seite (eine Seite für Anmeldung, Startseite, Stationen, Logbuch) |
| `js/config.js` | Alle Einstellungen: Stationen, Stufen, Gewichtssteine, Aufgaben je Runde |
| `js/waage.js` | Rechnen mit der Waage: Summe, Vergleich, Ausschlag, alle Lösungen |
| `js/waage-bild.js` | Die Tafelwaage als SVG mit Riegel, Kieseln, Muscheln, Gewichtssteinen |
| `js/zufall.js` | Zufall für das Erzeugen der Aufgaben |
| `js/stationen/` | je Station ein Aufgabengenerator und die Station selbst |
| `js/station-teile.js` | gemeinsame Teile: Kopf, Stufenwahl, Rundenende, Tipps, Steinkasten, Zifferntasten |
| `js/logbuch.js`, `js/urkunde.js` | Logbuch und Urkunde (PDF ohne Bibliothek) |
| `js/kw-stand.js`, `js/konto-*.js` | Stand des Kindes und gemeinsames Konto der Lernlagune |
| `js/app.js`, `js/erwachsene.js` | Ansichten, Bedienung, Erwachsenenbereich |
| `css/` | Farben und Maße (`tokens.css`), Seite, Stationen und Waage |
| `bilder/`, `schriften/` | Flint, Kelpwald, Gegenstände, App-Symbole; Andika und Libre Caslon Text (OFL, Lizenztexte liegen bei) |

## Anmeldung und Daten

Die Kinder melden sich mit demselben Zugangscode an wie im Perlentaucher. Gespeichert werden in Firebase (`kw_stand/<code>`) nur Stempel und die Zahl der geschafften Aufgaben je Station und Stufe, kein Vorname, keine Vermutungen, keine gelegten Steine, keine eingetippten Zahlen. Die Datenbankregeln erlauben genau die 12 festen Schlüssel. Zurücksetzen und Löschen gehen über den Lehrerbereich des Perlentauchers. Einzelheiten stehen in `datenschutz.html`.

## Veröffentlichen

- Hinter jeder lokalen `js`- und `css`-Datei steht `?v=N`. Bei jeder Änderung wird die Zahl in allen HTML-Dateien hochgezählt, sonst laden Geräte alte Fassungen. Bilder haben eine eigene Nummer (`?b=N`).
- Die `.gitignore` sperrt alles und gibt nur die fertige Seite frei. Neue Dateien oder Ordner auf oberster Ebene dort eintragen.
- Werkzeuge und Tests liegen außerhalb dieses Repositorys und gehen nicht ins Netz.

## Stand

- 15.11.2026: alle vier Stationen, Logbuch und Urkunde lokal fertig.
- 16.11.2026: veröffentlicht (`?v=4`).
