# Schnitt- und Ansichtszeichnungen je Geschossteil (03.11.2026)

Korrektur 1 aus dem Gesamtnachweis (docs/performance/GESAMTNACHWEIS_2026-11.md), Teil A der Änderungskarte „Schnittzeichnungen und Layoutbuch“. Freigabe durch den Nutzer am 03.11.2026. Teil B (Layoutbuch nur lesend, Aktualisierung auf Abruf) folgt in einem eigenen PR.

## Befund

- Eine Schnittzeichnung kostete etwa 10 µs je Fläche des Gebäudes: beim kleinen Gesamtmodell (14 000 Flächen) 0,13 s, beim großen (etwa 95 000 Flächen) 0,9 s.
- Der Gebäudekörper selbst lag schon fertig im Zwischenspeicher. Die Zeit steckte vollständig im Durchlauf über alle Flächen.
- Neu gerechnet wurde nach jeder Änderung, weil der Zwischenspeicher an das ganze Projektobjekt gebunden war. Das galt auch für Änderungen an Layouts, Texten oder der Projektinformation.

## Umsetzung

- `rendering/viewport/building-solid.ts`: `buildingParts(project)` liefert die Geschossteile des Gebäudes in der Reihenfolge seiner Flächen. Teile eines eigenen Snapshots behalten ihre Identität, solange ihr Geschoss unverändert ist; das gab es schon für 3D und Picking.
- `rendering/viewport/section-drawing.ts`:
  - **Je Geschossteil gemerkt**, über eine schwache Zuordnung zum Teil:
    - die Kantentabelle (Schlüssel jeder Flächenkante, Normalen, glatte Facetten). Sie gilt für alle Schnitte gleich.
    - je Schnittlinie: die verketteten Schnittflächen je Element und die sichtbaren Flächen mit ihren Kantenkandidaten.
  - **Über das ganze Gebäude entschieden**, nach dem Zusammenführen:
    - welche Kanten sichtbar sind; die Flächen an einer Kante können aus verschiedenen Geschossen stammen.
    - die Tiefenreihenfolge, stabil wie bisher.
    - die Wandschichten, die Geschossmarken und die Ausdehnung.
  - Eine Wandänderung rechnet nur ihr Geschoss neu, die übrigen kommen aus dem Speicher.
  - `rememberedSectionDrawing` verwendet die ganze Zeichnung weiter, solange sich nichts ändert, was sie liest: die Geschossteile, die Geschosse (Wände für Schichten, Namen, Höhen), Materialien, Wandaufbauten, Erdgeschoss und Bezugshöhe. Layouts, Planköpfe, Abbilder, Projektinformation und Ansichtseinstellungen gehören nicht dazu. Gemerkt wird nur für eigene Snapshots.
- `components/cad/section-graphic.ts`: `cachedSectionDrawing` ist jetzt diese gemerkte Zeichnung. Schnitt-Tab, Schnittfenster und Layouts nutzen sie unverändert.
- **Die Zeichnung bleibt gleich:**
  - `benchmarks/section-drawing-reference.ts` ist die eingefrorene bisherige Berechnung.
  - `benchmarks/section-parts.test.ts` vergleicht jede Zeichnung mit ihr: alle 8 Schnitte und Ansichten des Gesamtmodells, dieselben nach einer Wandänderung (gemischt aus gemerkten und neuen Teilen) und ein Projekt ohne eigenen Snapshot mit rundem Durchbruch (glatte Facetten).

## Ergebnis (Node, Gesamtmodell, alle 8 Schnitte und Ansichten, Median)

| Modell | nach einer Wandänderung vorher → nachher | nach einer Layoutänderung vorher → nachher |
| ------ | ---------------------------------------- | ------------------------------------------ |
| 3 000  | 924 → 142 ms                             | 924 → 0,7 ms                               |
| 10 000 | 3 356 → 534 ms                           | 3 356 → 2,3 ms                             |
| 20 000 | 7 286 → 1 114 ms                         | 7 286 → 4,3 ms                             |

- Rohdaten: `gesamtnachweis-2026-11/node-section-parts.json`; der Vorher-Stand steht in `node.json`.
- Die Messung „nach einer Wandänderung“ ändert jetzt vor jeder Probe wirklich eine Wand. Vorher maß sie wiederholt dasselbe Projekt, was mit der neuen Wiederverwendung nur noch Treffer im Speicher gemessen hätte.
- „Nach einer Layoutänderung“ ist neu: Eine Linie auf einem Layout wird gezeichnet, danach werden die Zeichnungen über `rememberedSectionDrawing` abgefragt.

## Grenzen

- **Eine Wandänderung kostet weiterhin etwa ein Fünftel der vollen Zeit je Zeichnung**, beim großen Modell etwa 140 ms je Zeichnung: Das geänderte Geschoss wird ganz neu gerechnet, das Zusammenführen läuft über alle Flächen. Weniger ginge nur mit Arbeit je Element statt je Geschoss.
- **Speicher:** Je Geschossteil liegen die Kantentabelle und je Schnitt die sichtbaren Flächen im Speicher. Sie gehen mit dem Geschossteil, der Gebäude-Zwischenspeicher hält bis zu 4 Stände je Geschoss. Nach der Messung lag der Heap im Bereich der ersten Messung, schwankt aber stark.
- **Projekte ohne eigenen Snapshot**, etwa Aktionen auf rohen Daten, rechnen wie bisher ohne Speicher.

## Nachweis

- **Prüfungen:** 1538 Tests grün (neu: `section-parts.test.ts`), Typprüfung (App und Benchmarks), Lint, Architekturprüfung; 14-Modell-Hash `e42aa36e…` unverändert.
- **Browser** (Entwicklungsserver, Gesamtmodell 3 000):
  - Schnitt-Tab D-D öffnen dauert 0,5 s. Die Wand `s2-b20` ist geschnitten von 6,40 bis 9,20 m.
  - Im Grundriss „Wandhöhe auf 2 m“: Im Schnitt-Tab reicht die Wand danach bis 8,40 m, die Nachbarwand `s2-b21` bleibt bei 9,20 m.
  - Strg+Z stellt im Schnitt 9,20 m wieder her.
  - Keine Konsolenfehler.
