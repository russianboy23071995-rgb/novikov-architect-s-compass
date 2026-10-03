# Fangengine: reproduzierbare Baseline (03.10.2026)

Anwendungscode: main nach PR #50 (91e4095). Unveränderte Dienste; keine Optimierung.

## Reproduktion

`node --experimental-strip-types scripts/benchmark-snapping.mjs > snap-baseline.json`

Node v24.19.0, win32/x64, AMD Ryzen 5 3600 6-Core Processor, 12 logische CPUs, 15.95 GiB RAM. Lokaler Windows-Desktop, andere Programme einschließlich Entwicklungsserver liefen weiter. Kein CPU-Pinning, keine erzwungene GC, kein isolierter Laborlauf.

## Verfahren

Deterministische, voneinander getrennte kreuzende Segmentpaare auf einem 4-m-Raster: je Paar eine 2-m-Wand und eine 2-m-Linie, je ein Schnittpunkt. Somit 50 % Wände/50 % Linien, keine Fenster. Validierung und Fixture-Erzeugung außerhalb der Messung. 100/1000/5000 Elemente liefern 550/5500/27500 Referenzen; diese Zahl wird geprüft. Der Modellwechsel verschiebt das ganze Projekt um 0,125 m; neue Referenzen und Unverändertheit des Ausgangsmodells werden geprüft.

Aufbau und Neuaufbau jeweils 2 Warm-ups + 9 Messungen. P95 nach nearest-rank entspricht bei 9 Messungen dem Maximum und ist nur eine grobe Streuungsangabe. Werkzeug-Quellenfilter separat: 5 Warm-ups + 30 Messungen. Fangabfragen je Modus: 30 Warm-ups + 150 Messungen; deterministischer Cursorpfad nahe Kreuzungen, 100 px/m, Fangradius 10 px, Raster 0,1 m, Shift/Ortho aus. Zeichnen und freie Wandpunktbewegung verwenden resolveToolSnap und die vorhandenen Policies. Jeweils ohne aktive Referenzen und mit Ursprung plus drei Segmentmittelpunkten. Zeitmessung mit performance.now; Rohwerte und Kontrollsummen in der begleitenden JSON-Datei. Direct Edit enthält die vorhandene zusätzliche Quellenfilterung im Resolver. Die Vorbereitung gehört nicht zur ausgewiesenen Abfragezeit.

## Ergebnisse

Alle Zeitspalten: Median / P95 in Millisekunden. Abfragen hier mit vier aktiven Referenzen. Weitere Modi und Rohwerte stehen im JSON.

| Elemente | Referenzen | Aufbau | Modellwechsel: Neuaufbau | Zeichnen/Abfrage | Direct Edit/Abfrage |
|---:|---:|---:|---:|---:|---:|
| 100 | 550 | 3.03 / 4.30 | 2.90 / 3.24 | 0.49 / 0.77 | 0.53 / 0.72 |
| 1000 | 5500 | 107.12 / 112.33 | 127.88 / 179.16 | 6.86 / 8.62 | 6.68 / 8.25 |
| 5000 | 27500 | 3403.17 / 3518.15 | 4094.15 / 4194.64 | 35.67 / 47.27 | 39.79 / 49.57 |

## Befund und Grenzen

Der gemeinsame Referenzaufbau ruft segmentIntersectionReferences auf: vollständige Paarprüfung mit n(n−1)/2 Kombinationen, bei 5000 Segmenten 12.497.500. Das passt zum gemessenen starken Anstieg. BimPlan baut Referenzen derzeit bei Änderungen von project **oder snapping** neu auf; auch ein Interaktionswechsel kann den Aufbau auslösen. Die langsamen laufenden Abfragen bleiben ein zweiter, gesondert zu untersuchender Engpass.

Kein Browser-Framerate-, Hover-Timer-, Rendering-, Commit-/History- oder Speicherbenchmark. Kein dichtes Worst-Case-Projekt mit quadratisch vielen tatsächlichen Schnittpunkten. Keine allgemeine Zusage für beliebige BIM-Projekte. Die Baseline zeigt dennoch mehrsekündige synchrone Vorbereitung und Abfragen im zweistelligen Millisekundenbereich bei 5000 Elementen. Keine belastbare universelle Zeitgrenze aus einem einzelnen Rechnerlauf ableiten.

## Nächster begrenzter Auftrag

In segmentIntersectionReferences eine geometrisch konservative räumliche Vorauswahl für Segmentpaare ergänzen. Bestehende intersectSegments-Prüfung, numerische Toleranzen, stabile Reihenfolge, Quellenabhängigkeiten und Quellenausschlüsse beibehalten. Gegen die bisherige vollständige Paarprüfung mit schrägen, berührenden, überlappenden und beinahe parallelen Segmenten vergleichen; dieselbe Baseline wiederholen. Keine gleichzeitige Änderung der laufenden Fangabfrage oder History. Falls viele Segmente tatsächlich überlappen, bleibt quadratischer Aufwand möglich und muss dokumentiert bleiben.


Update 04.10.2026: The next-task recommendation above is superseded by docs/LOCAL_SNAP_QUERY_PLAN.md. Keep this report as the measured historical baseline; the new target is local geometry queries plus separately validated active references, not a faster global intersection precomputation.
