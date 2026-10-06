# Abnahme: T-Hauptwand mit zwei Ecken

Erzeugen: `node --experimental-strip-types scripts/generate-two-corner-t-fixtures.mjs <Ausgabeordner>`.

Der Generator erzeugt ein Rechteck mit Achsmaßen 6 x 4 m, vier Eckanschlüssen,
einer 2-m-Nebenwand mittig an der Südwand und einem Fenster. Alle Wände:
0,36 m stark und 2,80 m hoch, mittige Achse. Fenster: 1,20 x 1,35 m,
Brüstung 0,90 m, Mitte 1,50 m ab Südwandanfang.

- before-t.project.json: fünf Wände, noch ohne T-Relation.
- two-corner-t.project.json: gleicher Aufbau mit expliziter T-Relation.
- two-corner-t.ifc: regulärer IFC4-Export des verbundenen Projekts.

## Nachweis 06.10.2026

PR158 in main d2d3af9 integriert. Im Browser before-t geladen; zusätzliche Wand
mit dem Wandwerkzeug bei x=4 von y=2 zur Südwandachse gezeichnet und mit Enter
abgeschlossen. Die Hauptwandkontur hat danach die erwartete Unterbrechung an der
T-Kontaktfläche x=4 bis 4,36; keine Anzahl-Fehlermeldung. Fenster anschließend
über On-Demand „Fenster entlang Wand“ von Position 0,25 auf ca. 0,823 bewegt,
also über diesen T-Kontakt hinweg. Undo/Redo und 3D-Aufruf erfolgreich.
Der Browser-Prüfstand enthält diese zusätzliche sechste Wand; die ausgelieferte
IFC-Datei ist bewusst der reproduzierbare Fünfwand-Aufbau des Generators.

Save project meldete Erstellung/Download angefordert; der automatisierte Download-
Event lief in einen Timeout. Eine neue heruntergeladene Browserdatei konnte damit
nicht verifiziert werden. Projekt-Roundtrip ist durch bestehende Integrationstests
abgesichert. Das ist kein Nachweis eines fehlgeschlagenen manuellen Downloads.

IfcOpenShell 0.8.5: Schema ohne Meldungen; fünf IfcWall, ein IfcWindow; trianguliertes
Wandvolumen 21,41136 m³. Unabhängiger Sollwert: 20*0,36*2,80 +
1,82*0,36*2,80 - 1,20*1,35*0,36. Archicad selbst wurde nicht ausgeführt.

## Praktische Archicad-Abnahme

IFC importieren. Vier geschlossene Ecken und mittigen T-Abschluss in 2D/3D prüfen.
Fenstermaße, Brüstung und Hostwand kontrollieren. Keine zusätzliche Trennfläche
oder Überlappung am T erwarten; die Öffnung liegt links vom T. Dateiformat bleibt
Schema 8; ältere NOVIKOV-Versionen können diese Kombination ablehnen.
