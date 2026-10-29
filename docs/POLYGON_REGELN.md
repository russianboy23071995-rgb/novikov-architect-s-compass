# Polygon-Regeln (Nutzervorgabe 29.10.2026)

Sieben Regeln für Polygon-Elemente (Schraffur, Decke, Linie/Polylinie und künftige
Werkzeuge derselben Zeichenart). Umsetzung in vier PRs nach freigegebener Änderungskarte.

| PR  | Inhalt                                                 | Regeln  | Stand    |
| --- | ------------------------------------------------------ | ------- | -------- |
| A   | Standardgeschosse, Decke als Konturlinie, Decke in 3D  | 7, 5, 4 | erledigt |
| B   | Polygon schließen per Klick auf den Startpunkt         | 3       | erledigt |
| C   | Ecke anklicken = bewegen, Ecke auf Ecke = Ecke löschen | 1, 2    | erledigt |
| D   | Nummerierte Fangpunkte statt „Endpunkt“                | 6       | erledigt |

Vorgaben für B und C: als gemeinsamer Baustein für alle Polygon-Werkzeuge, nicht pro
Werkzeug. Ein künftiges Werkzeug, das Punkte per Klick setzt bzw. einen geschlossenen Umriss
hat, erhält beide Regeln ohne eigenen Code.

## Teil A

**Regel 7 – Gebäudestruktur nie leer.** Neue Projekte (Programmstart ohne Datei) beginnen
mit „Erdgeschoss“ und „1. Obergeschoss“, beide 3,00 m hoch
(`createStandardProject` in `src/application/projects/create.ts`, Startprojekt
`createStartProject` in `src/components/cad/bim-view.ts`). Geschosse lassen sich nicht
löschen; mindestens ein Geschoss bleibt damit immer erhalten. Geladene und
wiederhergestellte Projekte bleiben unverändert. `createProject` (ein Geschoss ohne Höhe) und
das Testmodell `createExampleProject` bleiben für Migrationen, Tests und Benchmarks
unverändert.

**Regel 4 – Decke in 3D.** Ursache: Eine Decke liegt auf der OK Rohfußboden des Geschosses
darüber; ohne Geschosshöhe ist diese unbekannt und die Decke bleibt (ohne erfundene Höhe)
aus dem 3D-Körper. Mit Regel 7 hat jedes Geschoss eines neuen Projekts eine Höhe; die Decke
erscheint sofort. Ein eigener Hinweis entfällt (Nutzerentscheidung).

**Regel 5 – Decke ohne Füllung.** Im Grundriss nur die durchgezogene Konturlinie in der
Wandkonturfarbe (`var(--primary)`, im hellen Modus schwarz) und -stärke aus
„Canvas-Darstellung“; der Abschnitt dort heißt jetzt „Konturlinien (Wand, Decke)“. Das
Innere bleibt anklickbar (Auswahl der Decke).

Nachweis: 1348 Tests grün (neu: Startprojekt mit zwei Geschossen, Höhen 0/3/6 m, Decke im
3D-Körper mit OK 3,00 / UK 2,80 m). Browser: Navigator zeigt beide Geschosse, gezeichnete
Decke ohne Füllung mit durchgezogener Linie, Klick ins Innere wählt sie, 3D zeigt sie auf
der Wand; keine Konsolenfehler nach Neuladen.

## Teil B

**Regel 3 – Schließen am Startpunkt.** Gemeinsamer Baustein
`src/application/drawing/path-closure.ts`; jedes Werkzeug, das Punkte per Klick setzt,
erklärt nur seine Schließart:

| Schließart | Werkzeuge heute                            | Klick auf den Startpunkt                         |
| ---------- | ------------------------------------------ | ------------------------------------------------ |
| polygon    | Schraffur, Decke (Erstellung „Polygon“)    | übernimmt die Fläche wie gezeichnet              |
| polyline   | Linie im Modus Polylinie                   | wiederholt den Start am Ende: geschlossene Linie |
| none       | Rechteck-Konstruktionen, Einzellinie, Wand | kein Schließen per Klick                         |

- Ab drei gezeichneten Punkten (`MIN_CLOSING_POINTS`); vorher wird der Klick ein normaler
  Punkt. Doppelklick und Enter schließen weiterhin ab.
- Der Startpunkt hat Vorrang vor jedem anderen Fang (Hilfslinien, Winkel, Raster): Liegt der
  Mauszeiger höchstens 10 px davon entfernt (wie der Eckenfang), zielen Vorschau und Klick
  exakt auf den Start (`capturedStart`). Grund: Ohne diesen Vorrang gewann im Browser ein
  30°-Winkelfang, und der Klick setzte einen Punkt 5 cm neben den Start.
- Der Startpunkt ist beim Zeichnen als Kreis markiert und wird gefüllt, sobald ein Klick
  schließen würde.
- Neues Werkzeug derselben Art: Schließart im Arbeitsbereich angeben (`pathClosure` in
  `CadWorkspace.tsx`), sonst nichts.

Nachweis: 1349 Tests grün (neu: Schließarten, Nahbereich, Mindestpunktzahl, übernommene
Punkte für Decke, Schraffur und geschlossene Polylinie). Browser: Decke mit 4 Ecken per Klick
auf den Start geschlossen (Start nicht doppelt), Polylinie mit schnellem Klick ~4 px neben dem
Start geschlossen (6 Punkte inkl. wiederholtem Start), Klick ~13 px daneben setzt korrekt einen
normalen Punkt; keine Konsolenfehler. Schraffur nutzt denselben Weg wie die Decke und ist im
Browser nicht eigens geprüft.

## Teil C

Gemeinsame Bausteine für jedes Element mit Eckenliste (heute Schraffur, Decke, Linie/Polylinie;
Wände ausgenommen, ihre Endpunkte haben eigene Anschlussregeln):

- `isVertexTarget` / `vertexShape` (`src/application/direct-edit/transforms.ts`): welches
  Element eine Eckenliste hat und ob sie ein Ring (Fläche) oder ein Pfad (Linie) ist. Ein neues
  Element dieser Art wird dort ergänzt und erhält beide Regeln.
- `mergeOntoVertex` / `moveVertex` (`src/geometry/polygons/vertex-merge.ts`): reine
  Geometrieregel, genutzt vom Übernehmen (`moveElementPoint`) und von beiden vorbereiteten
  Vorschauen (Fläche, Linie) – Vorschau = Übernahme.

**Regel 1 – Ecke anklicken = bewegen.** Linksklick auf eine Ecke des gewählten Elements startet
sofort „Punkt frei bewegen“; der nächste Klick setzt die Ecke (Fang, Zahleneingabe, ein
Undo-Schritt wie gewohnt). Rechtsklick auf die Ecke öffnet wie bisher das Menü mit allen
Punktaktionen (z. B. „Punkt in Flucht strecken“). Abweichung von der Änderungskarte: Das Menü
bleibt während der Bewegung nicht offen, weil es bei laufender Bearbeitung grundsätzlich
ausgeblendet ist. Enter auf einem Eckgriff öffnet weiterhin das Menü.

**Regel 2 – Ecke auf Ecke = Ecke löschen.** Landet die bewegte Ecke auf einer anderen Ecke
desselben Elements, verschwindet die bewegte Ecke.

- Gilt für jede andere Ecke, nicht nur die Nachbarecke.
- Flächen und geschlossene Polylinien behalten mindestens 3 Ecken; sonst Ablehnung mit
  „Mindestens drei Ecken müssen bleiben …“, das Modell bleibt unverändert.
- Ausnahme offene Polylinie: Endpunkt auf den anderen Endpunkt schließt die Linie (wie bisher).
- Die anderen Ecken des Elements haben beim Bewegen im Umkreis von 10 px Vorrang vor allen
  anderen Fängen (`capturedVertex`). Grund: Im Browser gewann sonst „Lotrecht“ knapp neben der
  Ecke, und die Kontur wurde als kollabiert abgelehnt statt die Ecke zu löschen.
- Früher galt eine Ecke auf der Nachbarecke als ungültige Kontur; zwei ältere Tests wurden auf
  die neue Regel umgestellt (Schraffur-Arbeitsablauf, Polylinie in `transforms.test.ts`).

Nachweis: 1350 Tests grün (neu: Geometrieregel für Ring, offenen und geschlossenen Pfad;
Decke und Schraffur mit Übernahme = vorbereiteter Vorschau = Patch und einem Undo-Schritt;
Dreieck abgelehnt in Übernahme und Vorschau; Polylinie; Eckenvorrang). Browser: Klick auf
Deckenecke startet die Bewegung ohne Menü, Ecke auf Nachbarecke löscht sie (1,98 → 0,99 m²),
Klick 11 px daneben verschiebt nur, Rechtsklick öffnet das Punktmenü, Dreieck lehnt das Löschen
mit Meldung ab, Undo stellt her; keine Konsolenfehler. Schraffur und Polylinie laufen über
dieselben Bausteine und sind im Browser nicht eigens geprüft.

## Teil D

**Regel 6 – Fangpunkte benennen.** Nutzerentscheidung 29.10.2026: Muster „Element · Ecke n“.
Gemeinsamer Baustein `snapPointLabel` (`src/application/snapping/point-label.ts`) liest
Element-ID und Merkmal des Fangpunkts; Zählung ab 1 wie bei den Eckgriffen.

| Fangpunkt                    | Anzeige                                                  |
| ---------------------------- | -------------------------------------------------------- |
| Ecke einer Decke / Schraffur | Decke · Ecke 3, Schraffur · Ecke 1                       |
| Punkt einer Linie/Polylinie  | Linie · Punkt 2 (geschlossene Linie: Endpunkt = Punkt 1) |
| Wandachse                    | Wand · Anfang, Wand · Ende                               |
| Wandecke (Körper)            | Wand · Ecke Anfang, Wand · Ecke Ende                     |
| Tür-/Fensterlaibung          | Tür · Laibung                                            |
| beim Zeichnen                | Startpunkt, Letzter Punkt                                |
| Hilfspunkt aus Hilfslinien   | Hilfspunkt (unverändert)                                 |
| sonst                        | Endpunkt (unverändert)                                   |

Ein neues Element erhält Namen über einen Eintrag in `ELEMENT_NAMES`.

Nachweis: 1351 Tests grün (neu: Benennung aller Fälle, jede vom Fang angebotene Ecke erhält
einen Namen). Browser: „Decke · Ecke 3“ an der Deckenecke, „Wand · Ecke Anfang“ an der
Wandecke; keine Konsolenfehler.
