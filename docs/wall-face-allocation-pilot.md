# Wand-Flächenerzeugung: Pilot nicht übernommen – 21.10.2026

## Änderungskarte
AUD14-03/04, main dacfee1 nach PR412 (CI39638854913 grün). Ziel: freie Wandextrusion mit weniger temporären Arrays bei exakt gleicher Geometrie. Normalfall: freie Wand mit Fenster; Grenzfälle: schräge Wand, mehrere/überlappende Öffnungen, großer Koordinatenursprung und negativer Höhenversatz. Bestehender Solidableitungsbaustein bleibt Eigentümer; gemeinsame validierte Projekt-/Vorschauscopes und stabile Wand-/Host-IDs bleiben Quelle. Keine neue Application-Aktion, Cache- oder Modellkopie, kein Eingriff in Freeze, Commit, Undo, Datei, Recovery, IFC oder AI. Pilot ersetzte lokale Punktarrays und Achseniteration durch direkte Weltpunkte und skalare Bounds-Aktualisierung; Flächen-/Rechenreihenfolge blieb gleich.

## Befund und Entscheidung
Exaktgleichheit bestanden, Performance-Nutzen nicht hinreichend robust: Produktänderung deshalb gemäß §9 verworfen. src/lib/bim/geometry.ts entspricht wieder unverändert main. Der Kandidat bleibt ausschließlich als Textfixture wall-face-pilot.txt für einen reproduzierbaren Diagnosevergleich erhalten. Kein Produktimport dieser Fixture.

Mediane des vollständigen Gebäudeaufbaus, ms; zwei ausgewählte Wände, große Szene 1004 Wände/1002 Fenster. Restwände je Trial teils schräg und mit signiertem Höhenversatz; daher kein direkter Zeitvergleich zu den horizontalen Fixtures aus PR412.

| Lauf / zusätzliche Wände | Alt | Pilot |
| --- | --- | --- |
| erste gespeicherte Serie / 1000 | 96,664 | 73,980 |
| Wiederholung / 1000 | 76,547 | 80,865 |
| nach Tests/Build / 0 | 1,356 | 1,710 |
| nach Tests/Build / 100 | 10,510 | 9,254 |
| nach Tests/Build / 1000 | 81,541 | 69,809 |
| abschließende Wiederholung / 0 | 2,189 | 3,043 |
| abschließende Wiederholung / 100 | 14,091 | 8,666 |
| abschließende Wiederholung / 1000 | 92,046 | 90,099 |

Die zunächst günstigeren explorativen Zahlen wurden nicht als Freigabe verwendet. Die gespeicherten Läufe zeigen auch eine Regression; letzte große Gewinne reichen von rund 2 bis 14 %, kleine Szenen werden langsamer. JIT/GC/Systemlast und sieben Proben je Größe erlauben keine belastbare allgemeine Gewinnzusage. Das Gate verlangt einen nachgewiesenen Nutzen, nicht nur weniger Arrays im Quelltext.

## Nachweise / Reproduktion
`node --experimental-strip-types benchmarks/wall-face-comparison.ts` erzeugt exklusiv ein temporäres Geschwistermodul mit Kandidatblock, prüft Anker und entfernt es in finally. Unverändertes Produktionsmodul ist der Altpfad. Je Lauf 21 alternierende Vorher-/Nachhervergleiche vollständiger Flächen, Normalen, Volumen und Bounds. Zusätzlich sechs ungemessene Scopefälle: keine/eine/überlappende Öffnungen, schräge Wände, 1e9-Koordinaten, Höhe 3,5 m mit -0,2 m Versatz; Eingabe bleibt unverändert. Überlappung ist hier bewusst ein Solid-Scopefall, keine Änderung der Application-Platzierungsregeln.

Rohdaten unter benchmarks: wall-face-results.json, wall-face-repeat-results.json, wall-face-idle-results.json, wall-face-idle-repeat-results.json. Diese vier Läufe hatten den Kandidaten vorübergehend als Produktmodul und Altcode als temporäres Modul. wall-face-archived-replay.json prüft die anschließend archivierte Variante mit umgekehrten Modulrollen; nur Reproduktionsnachweis, keine zusätzliche Performanceentscheidung. Insgesamt 135 Vergleichsfälle über die fünf gespeicherten Läufe bestanden.

Vor Rücknahme: 1137/1137 Tests, App-/Benchmark-Typecheck, fokussiertes Lint, Architekturcheck (keine neuen Rückgriffe/Zyklen) und Produktbuild bestanden. Erster Sandbox-Testversuch konnte keine Kindprozesse starten; regulär wiederholt und bestanden. Nach Archivierung: Vergleichsreplay, Benchmark-Typecheck und Lint bestanden. Produkt unverändert; kein neuer Browser-/GPU-/Frame-/Native-, Recovery- oder IFC-Nachweis behauptet. Bestehende Browserabnahme aus PR411 bleibt Basis.

## Abschlusskarte
Keine Produktänderung verbleibt. Keine neue Laufzeitabhängigkeit oder Modellregel. Erhalten sind Diagnose, Kandidatfixture und vollständige Rohdaten, keine Scheinerfolgsmeldung. Nächster einzelner Auftrag ausschließlich Masterplan §9: freie Wandextrusion genauer in Öffnungsraster, Transformation und Bounds zerlegen, bevor ein neuer Optimierungspilot beginnt.
