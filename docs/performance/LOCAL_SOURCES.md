# Lokaler Quellensuchdienst — 04.10.2026

Reproduktion: `node --experimental-strip-types scripts/benchmark-local-sources.mjs > local.json`. Gleiche deterministische Fixture wie Baseline: 100/1000/5000 Elemente, je Hälfte Wand/Linie, getrennte kreuzende Paare auf 4-m-Raster. v24.19.0 auf win32, AMD Ryzen 5 3600 6-Core Processor, 12 logische CPUs; laufender Desktop/Entwicklungsserver, keine isolierte CPU/GC.

Indexbau und Modellwechsel je 2 Warm-ups/9 Messungen; lokale Abfrage 30 Warm-ups/150 Messungen. P95 bei 9 Messungen ist das Maximum. Der vollständige Quellenindex enthält 500/5000/25000 primitive Referenzen, keine vorberechneten Kreuzungen. Prüfung der Quellen-/Segmentzahlen und einer lokalen Kreuzung pro Anfrage durch Assertions; die Abfragezeit enthält diese kleine Assertion. Modellwechsel verschiebt Quellen um 0,125 m. Rohdaten in local-sources-2026-10-04.json.

| Elemente | Aufbau Median ms | Aufbau P95 ms | Neuaufbau Median ms | lokale Abfrage Median ms | lokale Abfrage P95 ms | max. lokale Paare |
|---:|---:|---:|---:|---:|---:|---:|
| 100 | 2.03 | 2.69 | 1.82 | 0.0102 | 0.0240 | 1 |
| 1000 | 23.60 | 29.02 | 20.20 | 0.0113 | 0.0194 | 1 |
| 5000 | 121.75 | 163.17 | 136.04 | 0.0143 | 0.0389 | 1 |

Der kalte Aufbau bei 5000 Elementen sinkt gegenüber der historischen Vollaufbereitung (3403 ms) auf rund 122 ms. Das ist keine identische Datenmenge: Kreuzungen werden jetzt erst lokal berechnet, genau die geplante Verlagerung. Die lokale Abfrage enthält Punkt-/Segmentindexsuche, Quellenausschluss, lokale Schnittprüfung und Radiusfilter; keine aktive Guide-Auswertung, Rangfolge, Rendering oder History. Deshalb nicht mit den früheren vollständigen Fangabfragen als direkter Geschwindigkeitsfaktor vergleichen.

Unveränderte produktive UI: Der neue Dienst wird erst im nächsten Schritt integriert. Kein allgemeiner Leistungsnachweis für dichte Kreuzungen oder lange überlappende Segmentboxen. Bei k lokalen Segmenten bleiben k(k−1)/2 Prüfungen möglich; keine Trefferkappung. Quellen-Lookup ist modellweit und unveränderlich; aktive Referenzen werden in diesem Dienst noch nicht ausgewertet. Speicherbedarf und vollständige Browserlatenz sind nicht gemessen.
