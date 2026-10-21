# Getrennte Wandphasen – 21.10.2026

## Änderungskarte
AUD14-03/04; Basis PR413 74dcdd5 mit unverändertem Produktcode aus main dacfee1. Auftrag: Öffnungsraster, Flächentransformation und Bounds unterscheiden, bevor ein weiterer Pilot beginnt. Normale Szenen ohne/mit einem Fenster je zusätzlicher Wand; Grenzvarianten schräge Wände und signierte Höhenversätze. Eigentümer bleibt der Diagnoseadapter in benchmarks. Quelle: feste Fixture, validierte Owned-Snapshots mit stabilen Wand-/Host-IDs. Keine neuen Modellaktionen oder Änderungen an Vorschau/Commit/Undo, 2D/3D-Bedienung, Export, Recovery, AI oder Dateiformat. Keine neuen Produktabhängigkeiten. Abnahme: vollständiger Geometrieoracle, Instrumentierungsaufwand sichtbar, Typen/Lint, temporäres Modul zuverlässig entfernen.

## Verfahren
wall-phase-detail.ts erweitert den vorhandenen Phasenmesser in einem eigenen Diagnose-Einstieg. Produktquelle wird nur gelesen. Ein exklusiv erzeugtes temporäres Geschwistermodul enthält Timer an eindeutig geprüften Ankern; finally entfernt es. Zwei serielle Prozesse, je 42 Fälle: 0/100/1000 zusätzliche Wände, mit/ohne zusätzliche Fenster, sieben Trials. Die vier Basiswände bleiben verbunden und enthalten zwei Fenster; „ohne Fenster“ bezeichnet nur die Zusatzwände. Bei null Zusatzwänden wird deshalb keine freie Flächenerzeugung gemessen, fehlende Detailphasen sind nicht als Nullkosten dieses Algorithmus zu lesen.

Trial-Geometrie: Endpunkt-y plus 0/1/2 m, Höhenversatz -0,2 bzw. +0,15 m, Wandstärke variiert gegen Cachetreffer. Owned-Snapshot vor Zeitmessung. Kontroll- und instrumentierter Pfad wechseln pro Trial die Ausführungsreihenfolge; eigene Gebäude-Caches, gemeinsame untere Caches/JIT/GC bleiben Störfaktoren. Alle 84 vollständigen Flächen-/Normalen-/Volumen-/Bounds-Vergleiche bestanden; eingefrorene Ergebnisstruktur erhalten. Keine Fachregel verändert.

## Ergebnisse
Mediane in ms, jeweils Lauf 1 / Lauf 2. 1000 zusätzliche Wände:

| Phase | Zusatzwände ohne Fenster | Zusatzwände mit Fenster |
| --- | --- | --- |
| Öffnungsraster | 1,918 / 1,394 | 3,327 / 3,187 |
| Flächentransformation | 1,754 / 1,419 | 7,114 / 8,959 |
| Grenzberechnung | 0,993 / 1,155 | 6,723 / 6,499 |
| Instrumentierter Gesamtaufbau | 17,423 / 19,630 | 64,937 / 71,018 |
| Uninstrumentierter Gesamtaufbau | 17,747 / 15,988 | 56,425 / 56,688 |
| Median gepaarter Zeitdifferenzen | 5,453 / 3,641 | 12,320 / 16,120 |

Gepaarte Differenzmediane sind nicht Differenzen der Gesamtmediane. Messpunkte pro Fläche verändern den heißen Pfad, inklusive JIT/GC-Verhalten. Die Differenzen sind daher beobachteter Instrumentierungs-/Reihenfolge-/Systemeinfluss, keine exakt subtrahierbare Timerkostenkorrektur. Verschachtelte Phasen nicht aufsummieren. Zeiten nicht als Produktionskosten oder möglichen garantierten Gewinn ausgeben. Gesamtgeometrie umfasst zusätzliche Höhenanpassung und Freeze außerhalb der drei Detailphasen.

## Schluss
Öffnungsraster ist in dieser Fixture kleiner als Transformation und Bounds. Als nächster enger Pilot kommt ausschließlich die bestehende XYZ-Grenziteration in Betracht: Achsenarray/Iteration durch explizite Math.min/Math.max-Zuweisungen ersetzen; Transformation, lokale Punkte, Topologie und Freeze unverändert lassen. So lässt sich ein einzelner Faktor gegen unveränderten Produktionspfad messen. Erst zwei uninstrumentierte Vergleichsläufe inklusive kleiner Szenen entscheiden über Übernahme; bei instabilem Nutzen verwerfen. Kein neuer kombinierter Arrayumbau.

Rohdaten: benchmarks/wall-phase-detail-results.json und wall-phase-detail-repeat-results.json. Reproduktion: node --experimental-strip-types benchmarks/wall-phase-detail.ts. Benchmark-Typecheck und fokussiertes Lint bestanden. Keine neue Produktsuite/Browserprüfung für reine Diagnose; keine GPU-/Frame-/Native-, Recovery- oder IFC-Freigabe. Genau ein Folgeauftrag in Masterplan §9.
