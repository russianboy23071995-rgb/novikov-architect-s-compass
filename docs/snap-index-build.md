# Kalter Fangindex-Aufbau, 24.10.2026

## Änderungskarte vor Code
AUD14-04/A04: Aufbau von 10/100/1000 Konturen mit je100 Punkten aufschlüsseln.
Normale und ausgeblendete Quellen, lokale Abfragen und Cacheidentität vergleichen.
Constraints besitzt den Index; Application leitet Primitive aus dem autoritativen
Projekt ab. Optionale Messhülle um unveränderte kalte Phasen; keine Uhr/Telemetry
im normalen Pfad, keine neue Modell-/Rendererregel. Benchmark misst Ableitung,
Einfrieren, Lookup, Punkt- und Segmentbaum. Quellen/Abfragen exakt gegen normalen
Produktionsindex vergleichen. Commit/Undo/Datei/Recovery/IFC bleiben unberührt.
Kein Optimierungskandidat wird in diesem Diagnoseschritt produktiv eingeführt.
Basis PR43196d9639; Merge nur bei grüner CI. Native/Frames bleiben offen.

## Ergebnis und Abschlusskarte
PR431 nach grüner CI40033649336 in main da58c83 integriert.
Drei frische Fixtures pro Größe, je100 Punkte/Kontur. Node24.19.0;
benchmarks/snap-index-build-results.json. Zeitbereiche in ms:

| Konturen | Primitive | Freeze Referenzen | Freeze Segmente | Lookup | Punktindex | Segmentindex |
| --- | --- | --- | --- | --- | --- | --- |
| 10 | 1,51–4,63 | 1,63–3,54 | 0,96–2,45 | 1,40–2,58 | 2,32–7,80 | 1,20–3,47 |
| 100 | 10,99–23,86 | 17,03–21,50 | 12,02–13,98 | 18,44–25,54 | 20,13–30,38 | 7,81–15,47 |
| 1000 | 177–190 | 192–395 | 111–122 | 200–215 | 259–464 | 113–130 |

Indexphasen enthalten Bounds-Einträge und Baumaufbau, keine isolierte Sortiermessung.
Kein erzwungener GC; Streuung/Allokationen können einzelne Phasen beeinflussen.
Gemessener Index und normaler getLocalSnapSources-Pfad liefern identische
Segmentdaten, Anzahlen und72 lokale Abfrageergebnisse mit/ohne Filter.
Cacheidentität geprüft. Keine vollständige Inferenz-/Frame-/Native-Messung.

freezeData traversiert Referenzen und danach Segmentquellen erneut; gemeinsam
referenzierte Objekte werden innerhalb und zwischen den Traversierungen erneut
besucht. Das ist ein begrenzter Optimierungskandidat, kein bereits behobener Fehler.
Nächster Auftrag: aufbaulokale Besuchsmenge prüfen, die jedes Objekt einmal tief
besucht. Nicht blind Object.isFrozen überspringen: flach eingefrorene Objekte können
veränderliche Kinder enthalten. Vollständigen Mutationsschutz und Quellenidentität
bewahren, Speichermehrbedarf und Gesamtaufbau gegen bisherige Traversierung messen.
Die ebenfalls teuren Baum-/Lookupkosten bleiben offen.

Nur optionaler synchroner Messwrapper im bestehenden Constraints-Index; normaler
Pfad führt dieselben Operationen/Reihenfolge ohne Uhr oder Telemetrie aus.
Keine neue Produktionsabhängigkeit, Modellkopie oder geänderte Fachaktion.
1155 Tests, Benchmark-/App-Typen, Architektur, gezielter Lint und Build bestanden.
Keine UI-Verhaltensänderung; Browserabnahme daher hier nicht wiederholt.
Commit/Undo/Recovery/IFC unverändert. Einziger Folgeauftrag Masterplan §9.
