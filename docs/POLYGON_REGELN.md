# Polygon-Regeln (Nutzervorgabe 29.10.2026)

Sieben Regeln für Polygon-Elemente (Schraffur, Decke, Linie/Polylinie und künftige
Werkzeuge derselben Zeichenart). Umsetzung in vier PRs nach freigegebener Änderungskarte.

| PR  | Inhalt                                                 | Regeln  | Stand    |
| --- | ------------------------------------------------------ | ------- | -------- |
| A   | Standardgeschosse, Decke als Konturlinie, Decke in 3D  | 7, 5, 4 | erledigt |
| B   | Polygon schließen per Klick auf den Startpunkt         | 3       | erledigt |
| C   | Ecke anklicken = bewegen, Ecke auf Ecke = Ecke löschen | 1, 2    | offen    |
| D   | Nummerierte Fangpunkte statt „Endpunkt“                | 6       | offen    |

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
