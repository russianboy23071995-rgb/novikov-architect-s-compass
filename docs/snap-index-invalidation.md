# Fangindex-Invalidierung, 24.10.2026

## Änderungskarte vor Code
AUD14-04/A04: tatsächlichen Application-Commit einer Linien-/Schraffur-Streckung
bei festem Ziel und wachsendem Restmodell mit Vorschau, Werkzeug-/Sichtbarkeits-
und Geschosskontext vergleichen. Zeit nur getLocalSnapSources, Commit separat.
Stabile Quellenkennungen/Daten und Elementidentitäten inventarisieren; keine
Cacheänderung. Vorhandene gemeinsamen Aktionen und History verwenden, veraltete
Vorschau ablehnen, Undo/Redo auf Indexidentität prüfen. Keine Fach-/UI-/Datei-
Recovery-/IFC-Änderung. Node-Diagnose, keine Browser-/Framefreigabe.
Basis PR4350fa04f0; Merge nur bei grüner CI. Ergebnis bestimmt begrenzten Folgeauftrag.

## Ergebnis und Nachweis
PR435 (`0fa04f0`) nach erfolgreicher CI40035319650 in main `aab56c7` übernommen.
Diagnose ausschließlich in benchmarks; keine Produktdatei geändert. Node v24.19.0,
Windows, ein Durchlauf je Größe und Zielart; Rohdaten `benchmarks/snap-index-invalidation-results.json`.

| Unveränderte Schraffuren, je 100 Punkte | Index nach Linienpunktänderung | Index nach Schraffurpunktänderung |
| --- | ---: | ---: |
| 10 | 14,9 ms | 12,1 ms |
| 100 | 101,6 ms | 88,8 ms |
| 1.000 | 1.098,3 ms | 1.112,3 ms |

Jeweils nur fünf geänderte/neue Referenzen unter stabilen Quellenkennungen; sämtliche
Referenzen der anderen Elemente exakt unverändert. Im größten Fall 200.004/200.009
bzw. 200.003/200.008 Referenzen identisch (über 99,99 %). Dies ist ein Vergleich der
Referenzdaten, keine Aussage über unveränderte Speicheradressen. Keine einzige der
unveränderten Schraffuren behält ihre Objektidentität nach dem echten Commit.
Der Commit kostet separat 1.209,5/1.672,4 ms im großen Fall; diese Kosten sind durch
Fangindexreuse nicht automatisch beseitigt. Keine Aussage über Gesamtframes,
Browserreaktionszeiten, Peak-RAM oder universelle Laufzeiten aus diesen Einzelmessungen.

## Aufrufer und Invalidierungsgrenzen
- `application/snapping/local-sources.ts`: WeakMap nach vollständiger Project-Identität;
  ein neuer Snapshot erzeugt alle Primitive und den gesamten räumlichen Index erneut.
- `BimPlan.tsx`: committed Projekt als useMemo-Abhängigkeit. Mausvorschau ersetzt diese
  Basis nicht. Drei Vorschaukontrollen je Szenario erhalten dieselbe Indexidentität.
- `application/tools/snapping.ts`: Sichtbarkeit und editSnapPolicy filtern dieselbe
  Quellenbasis. Beide Filtervarianten erhalten den Index; verstecktes Ziel fehlt.
- `useReferenceSelection.ts`: Referenzauswahl nutzt denselben Projektindex.
- `rendering/viewport/wall-point-candidates.ts` und `wall-preview-context.ts`: gemeinsame
  Quellen aus dem viewportModel/prepared-Basismodell. Keine separate neue Cachelogik.
- Alle sechs realen Bestätigungen erzeugen einen neuen Index; Undo und Redo erhalten
  jeweils den Index ihres ursprünglichen Snapshots. Alte Vorschau wird nach Commit
  abgewiesen. Rückkehr zur Basis bleibt ein Treffer.
- Geschosswechsel über `snapshotWithWorkingStorey` verwendet einen anderen Index;
  oberes leeres Geschoss liefert null Quellen. Die Fixture setzt die EG-Höhe auf 3 m,
  damit dessen Höhe aufgelöst ist. Der erste ungültige Testaufbau wurde korrekt durch
  Domainvalidierung abgewiesen; keine Produktkorrektur erforderlich.

## Konsequenz und Abnahmegrenze
Belegt ist vollständiger Neuaufbau trotz nahezu unveränderter Referenzdaten. Eine
WeakMap je Elementobjekt reicht wegen der Commitkopien nicht aus. Nächster begrenzter
Kandidat: abgeleitete Primitive unveränderter Linien/Schraffuren anhand stabiler IDs
und exakt verglichener Geometrieeingaben wiederverwenden; keinerlei Validierung
überspringen. Speicher begrenzen, Projekt-/Geschosswechsel sowie Löschung behandeln.
Wände/Anschlussabhängigkeiten bleiben auf dem Vollpfad. Gesamten Indexaufbau messen,
nicht nur Primitive; räumlicher Neuaufbau bleibt zunächst ausdrücklich bestehen.
Erst nach Ergebnisgleichheit und Nettovorteil eine Produktübernahme erwägen.

Benchmark-Typecheck (`benchmarks/tsconfig.json`) und gezieltes ESLint bestanden.
Alle Diagnoseassertionen bestanden. Keine Änderung an Imports/Abhängigkeiten der
Produktion, Modell, Renderer, UI, Datei, Recovery, IFC oder AI-Aktionen; deshalb keine
erneute UI-/Export-Gesamtabnahme behauptet. Die grünen Produktprüfungen von PR435
bleiben Basisbeleg, nicht als hier erneut ausgeführte Tests ausgewiesen.
