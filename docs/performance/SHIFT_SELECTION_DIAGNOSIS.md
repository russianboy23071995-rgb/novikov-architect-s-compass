# Shift-Auswahlbewegung: Diagnose vom 08.10.2026

## Anlass und Ergebnis

PR172 wurde nach Nutzerfreigabe unverändert zusammengeführt (`main` 0bc64aa).
Die praktische Bewegung funktioniert; der Nutzer meldet gelegentliches Stehenbleiben
mit anschließendem Nachspringen bei gehaltenem Shift. Betroffen: zwei Wände einer
T-Verbindung einschließlich zweier Fenster. Kein Zurückspringen zur Ausgangslage.

**Status: offen, kein Produktfix und keine erfolgreiche Fehlerabnahme behauptet.**
Die Diagnose erweitert ausschließlich den separaten Entwicklungs-Harness.
Die gemeinsame Fang-/Vorschauarchitektur und Modellprüfung bleiben unverändert.

## Reproduzierbarer Aufbau

`npm run benchmark:browser`, dann `/benchmarks/browser.html` auf Port 8081:

1. Frische Seite, `T pair` wählen, optional `Hold Shift`.
2. `Load scenario`, Status `Loaded` abwarten, `Profile movement` starten.
3. Status `Movement complete` abwarten, `Report` zeigt die Rohdaten.
4. Für den Vergleich Seite neu laden und den Shift-Schalter umstellen.

Die Fixture enthält zwei rechtwinklige Wände (6 m und 3 m), Außenachsversatz
0,18 m, eine T-Verbindung und zwei Fenster. Sie bildet die gemeldete Konstellation
ab, ist aber keine Kopie der Nutzerprojektdatei. Im endgültigen Test werden beide
Wände **und beide Fenster ausdrücklich ausgewählt**. Frühe Rohmessungen wählen nur
die beiden Wände; deren Fenster folgen mit. Das Feld `explicitlySelectedWindows`
kennzeichnet die abschließenden Vierfachauswahlen.

21 sequenzielle Mausziele nach einem Aufwärmziel prüfen jeweils die gerenderte
Vorschau. Anschließend folgen 240 synthetische Pointer-Ereignisse mit angefordertem
4-ms-Timerabstand, ohne zwischen den Eingaben auf die Vorschau zu warten. Tatsächliche
Eingabeabstände, synchrone Handlerzeiten und RAF-Abstände werden getrennt gespeichert.
Browser-Timer und Rendering erreichen dabei **keine garantierten 250 Hz**.

Die letzte kontinuierliche Vorschau muss im DOM angekommen sein. Gerenderte
Wandkörper, Konturen und Fenster werden mit dem eingefrorenen vollständigen
Prüfpfad verglichen. Danach: Shift halten/lösen, Tab Länge/Winkel, 90°/2 m,
Abbruch ohne Historieneintrag, Mausplatzierung, genau ein Undo und Redo.
Der Vollpfad übersetzt die ausgewählten Hosts; ihre ausdrücklich mitgewählten
Fenster behalten dieselben relativen Positionen.

## Beobachtungen

Rohdaten: [Messordner](shift-preview-2026-10-08/).

- Sequenzielle Ausgangsmessung T-Paar: Median 17,9 ms mit Shift bzw. 19,6 ms
  ohne Shift. Das ist Ereignis bis geprüfter DOM-Vorschau, keine Hardwarelatenz.
- Erster Dauertest mit Shift: maximaler RAF-Abstand **236,3 ms**. Synchrone
  Pointer-Handler maximal 1,3 ms. Damit ist eine längere Pause beobachtet, aber
  noch keinem bestimmten Berechnungsschritt zugeordnet.
- Wiederholung mit Shift und Vergleich ohne Shift: maximal jeweils **34,8 ms**.
- Abschließende Vierfachauswahl: maximal ebenfalls **34,8 ms** mit und ohne Shift.
  240 Ereignisse verursachen jeweils 241 React-Commits. React benötigt insgesamt
  rund 2,55 s mit Shift bzw. 2,51 s ohne Shift; lokale Vorschau rund 115/114 ms,
  Fangabfragen rund 29/24 ms. Phasen sind teilweise geschachtelt, nicht addieren.
- Keine Vollprojektvalidierung oder Materialisierung im kontinuierlichen Pointerpfad.
  Alle ausgeführten Browserfälle bestehen die beschriebenen Geometrie- und
  Bedienprüfungen.

Windows/In-App-Chromium, Diagnose-Devserver, Viewport 1280×720. Frühe Dateien mit
`tPair: true` enthalten noch den ungenutzten UI-Wert `count: 100`; tatsächlich sind
es vier Elemente. Der Harness berichtet das inzwischen korrekt. Dateinamen
`before` bedeuten Ausgangsmessung, nicht einen anschließend implementierten Fix.

## Grenzen und nächster Auftrag

Synthetische Pointer-Ereignisse enthalten weder die echte Eingabewarteschlange
noch den Tastatur-Autorepeat des Nutzers. RAF-Abstände sind keine gemessenen
Bildschirmpräsentationszeiten. Der einmalige 236-ms-Ausreißer kann anhand der
aggregierten Daten weder Shift noch React, Garbage Collection oder dem Browser
sicher zugeordnet werden. Keine bewiesene Ursache aus dem zeitlichen Zusammenhang
ableiten und keinen zusätzlichen Modellcache auf Verdacht einführen.

**Nächster begrenzter Auftrag:** Den bestehenden Diagnose-Harness um eine manuell
bedienbare Aufzeichnung echter Auswahlbewegungen ergänzen: zeitlich korrelierte
Pointer-/Shift-Ereignisse, React-Commits und lange Hauptthread-Aufgaben, begrenzter
Speicher, expliziter Start/Stopp, ohne Produktmodelländerung. An derselben
T-Konstellation den Aussetzer zuordnen; erst anschließend den belegten Engpass im
gemeinsamen Eingabe-/Vorschaupfad korrigieren. Kein neuer Werkzeug-Sonderpfad.
Die atomare Bestätigung aus dem vorherigen Plan bleibt danach vorgesehen.

## Automatische Prüfung

639 Tests bestanden; Produkt- und Diagnose-TypeScript sowie Produktionsbuild
erfolgreich. Lint: 0 Fehler, 6 bekannte React-Refresh-Warnungen. Der Testlauf wurde
vollständig ausgeführt; beim anschließenden Drucken seiner Unicode-Ausgabe trat
im Python-Wrapper ein Konsolen-Encodingfehler auf. Die gespeicherte vollständige
Testausgabe bestätigt 639 bestanden, 0 fehlgeschlagen.
