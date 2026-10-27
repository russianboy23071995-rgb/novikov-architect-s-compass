# Undo/Redo ohne Neuaufbau des Geschosses (27.10.2026)

Änderungskarte „3D-Neuaufbau des geänderten Geschosses“, Stufe A mit den Empfehlungen freigegeben: Undo und Redo finden Geschossteil und Wandfuß-Fangquellen früherer Stände wieder. Stufe B (wandweiser Neuaufbau nach einer Bearbeitung) folgt als eigene, ausführliche Karte.

## Befund

Node, Modell x, je Bearbeitung/Undo/Redo: Geschossaufbau für 3D (`storeyPart`) ≈ 150–170 ms, Wandfuß-Fangquellen des Arbeitsgeschosses (`getWallFootSources`) 235–300 ms (davon Kantenermittlung ≈ 155 ms, Suchindex ≈ 60 ms), lokale Fangquellen ≈ 60 ms. Ursache bei Undo/Redo: Der Geschoss-Zwischenspeicher hielt je Geschoss nur den letzten Stand; die Wandfuß-Quellen hingen am ganzen Projekt. Die lokalen Fangquellen verwenden ihre Blöcke schon seit PR464 über Undo hinweg wieder (unverändert).

## Umsetzung

- **A1** `rendering/viewport/building-solid.ts`: je Geschoss die letzten 4 Stände (gleiches Geschossobjekt, gleiche Höhe, gleiche Bildliste) statt nur des letzten; Gesamtgrenze wie bisher. Ältere Verlaufsschritte bauen ihr Geschoss wie bisher neu.
- **A2** `rendering/viewport/wall-foot-sources.ts`: Wandfuß-Fangquellen zusätzlich je wiederverwendbarem Geschossteil gemerkt (schwach, verschwinden mit dem Teil); nur für eigene Stände, deren Flächen zum Teil gehören.

## Nachweis

- Tests (`src/rendering/viewport/working-storey-solid.test.ts`): nach Undo/Redo dasselbe Geschossteil und dieselben Fangquellen wie vor der Bearbeitung bzw. danach; Flächen und Wandfuß-Quellen gleich einer frischen Berechnung aus einer veränderbaren Kopie; Gegenprobe: eine Bearbeitung liefert neue Teile und geänderte Quellen; Begrenzung: fünf Bearbeitungen später ist der älteste Stand neu gebaut (inhaltsgleich). 1331 Tests grün.
- Node (`benchmarks/undo-reuse-profile.ts`, Median aus 5, Ergebnis-Hash vorher/nachher gleich):

| ms (x)               | Undo vorher | Undo nachher | Redo vorher | Redo nachher |
| -------------------- | ----------- | ------------ | ----------- | ------------ |
| Gebäude/Geschossteil | 160         | 6            | 153         | 7            |
| Wandfuß-Fangquellen  | 283         | 0,1          | 257         | 0,1          |
| lokale Fangquellen   | 57          | 59           | 60          | 59           |

l: Undo Gebäude 13 → 0,5 ms, Wandfuß 27 → 0 ms. Nach einer neuen Bearbeitung unverändert (Gebäude dort schon durch das Übernehmen gebaut; Wandfuß x ≈ 390 ms) – das ist Stufe B.

- Browser-Schullauf (Produktionsbuild, je ein Lauf vorher/nachher, alle Schritte ok, Inhalt nach Wiederherstellung gleich):

| ms                | l vorher | l nachher | x vorher | x nachher |
| ----------------- | -------- | --------- | -------- | --------- |
| Z: Undo (3D)      | 235      | 155       | 682      | 366       |
| Z: Redo (3D)      | 211      | 136       | 666      | 356       |
| Redo 2D, Median   | 178      | 127       | 325      | 288       |
| Dauerlauf, Median | 212      | 171       | 492      | 413       |

## Grenzen

- Nur die letzten 4 Stände je Geschoss; weiter zurückliegende Undo-Schritte (bis 100 möglich) bauen neu. Speicher: bis zu 3 zusätzliche Geschossteile je Geschoss.
- Nach einer neuen Bearbeitung wird das geänderte Geschoss weiter vollständig neu gebaut und die Wandfuß-Quellen neu berechnet (Stufe B).
- Anteil außerhalb von JavaScript (Grafikkarte, Zusammensetzen) unberührt und ungemessen.
- Je ein Browserlauf; Verbesserungen bei 2D-Redo und Dauerlauf nicht eigens zugeordnet (Streuung möglich).
