# Picking-Index je Geschoss (26.10.2026)

Änderungskarte „Picking-Index je Geschoss“ mit den Empfehlungen freigegeben: messen, Teilindex je Geschoss umsetzen, Gleichheit der Treffer nachweisen; Zuordnung aus der Gebäudeansicht, ohne Änderung an der Ebenen-Filterung.

Der Picking-Index findet in der 3D-Ansicht bei einem Klick das getroffene Bauteil. Er wurde nach jeder Bearbeitung vollständig neu aufgebaut, mit allen Flächen aller Geschosse, im Hintergrund in 4-ms-Scheiben. Bis er fertig ist, prüft jeder Klick alle Flächen (Vollsuche).

## P1 – Messung (Node, `benchmarks/picking-storey-profile.ts`, nach einer Wandbearbeitung)

| Modell                | s           | l             | x              |
| --------------------- | ----------- | ------------- | -------------- |
| Flächen / Dreiecke    | 3640 / 7560 | 10920 / 22680 | 92000 / 180000 |
| Neuaufbau vollständig | 65 ms       | 314 ms        | 3615 ms        |
| Klick mit Vollsuche   | 4,5 ms      | 14 ms         | 114 ms         |
| Klick mit Index       | 0,07 ms     | 0,03 ms       | 0,25 ms        |

Ergebnis: Bei l ist der Index nach etwa einem Drittel Sekunde Rechenzeit fertig, Klicks in der Zwischenzeit kosten 14 ms. Bei x dauert der Neuaufbau 3,6 s, und jeder Klick in dieser Zeit 114 ms – dort ist der Gewinn spürbar.

## P2 – Umsetzung

- `rendering/viewport/building-solid.ts`: `buildingFacePart(face)` liefert den Geschossteil einer Gebäudefläche (schwache Zuordnung beim Erzeugen eines wiederverwendbaren Geschossteils; Flächen bleiben unverändert).
- `rendering/viewport/world-picking.ts`: `buildWorldPicking(solid, windows, groupOf)` bildet aus aufeinanderfolgenden Flächen desselben Geschossteils je einen Teilbaum. Ein Teilbaum wird wiederverwendet, solange dieser Teil dieselben Flächen in derselben Reihenfolge zeigt (Ebenen-Sichtbarkeit eingeschlossen); sonst wird nur er neu gebaut. Fenster und Türen bilden einen eigenen Teil. Kandidaten werden in der bisherigen Reihenfolge (Flächen, dann Öffnungen) entschieden, gleich tiefe Treffer also wie bisher. Ein Teilbaum je Geschossteil, schwach gehalten: er verschwindet mit dem Geschossteil.
- `solid-picking-service.ts`: nutzt die Zuordnung standardmäßig; Häppchen-Aufbau, Vollsuche bis „fertig“ und Prüfung auf veralteten Stand unverändert.

## P3 – Nachweis

- `src/rendering/viewport/picking-per-storey.test.ts`: nach einer Bearbeitung vier von fünf Geschossteilen wiederverwendet, ein Teil neu; jeder Treffer (Ziel und Tiefe) an 300 Punkten aus drei Blickrichtungen gleich der Vollsuche und dem ungeteilten Index, auch nach Rückgängig; ausgeblendete Wände: nur der betroffene Teil neu, Treffer gleich. Gegenproben: gleich tiefe Treffer in verschiedenen Teilen in Flächenreihenfolge; veralteter Stand wird abgewiesen.
- Bestehende Picking-Tests (`benchmarks/world-picking.test.ts`, `solid-picking-service.test.ts`, Türauswahl) unverändert grün.
- Node nach einer Bearbeitung (Median aus 5): Neuaufbau s 65 → 12 ms, l 314 → 53 ms, x 3615 → 581 ms; je Modell 768 Klickpunkte, 0 Abweichungen zur Vollsuche.
- Browser-Schullauf l (drei Wechselpaare gegen main `14f6681`, Median ms, `benchmarks/picking-per-storey-results.json`):

| Median ms                   | main     | neu      |
| --------------------------- | -------- | -------- |
| 3D: Tür entlang Wand ziehen | 1753     | 1599     |
| 2D → 3D                     | 158      | 166      |
| 3D – Szene fertig           | 832      | 845      |
| 3D → 2D                     | 138      | 126      |
| Bearbeitungszyklus          | 160      | 159      |
| Undo / Redo                 | 14 / 111 | 14 / 111 |

Profil (je ein Lauf): Index-Aufbau im 3D-Fenster 29 → 23 Stichproben; nach dem Türziehen (Bearbeitung in 3D) nur noch 1. Der erste Aufbau beim Umschalten auf 3D bleibt vollständig, weil der Lauf vorher nicht in 3D war. 2D-Schritte sind nicht betroffen (der Index läuft nur in 3D); ihre Abweichungen liegen in der Streuung.

## Grenzen

- Der erste Aufbau nach dem Öffnen oder dem ersten Umschalten auf 3D bleibt vollständig.
- Geschossteile entstehen nur aus eigenen (geprüften) Projektständen; sonst wird wie bisher alles neu gebaut.
- Fenster und Türen werden nach jeder Änderung vollständig neu indiziert (bei l 540 Öffnungen, gering).
