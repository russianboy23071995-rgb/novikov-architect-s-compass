# Polygon-Regeln (Nutzervorgabe 29.10.2026)

Sieben Regeln für Polygon-Elemente (Schraffur, Decke, Linie/Polylinie und künftige
Werkzeuge derselben Zeichenart). Umsetzung in vier PRs nach freigegebener Änderungskarte.

| PR  | Inhalt                                                 | Regeln  | Stand    |
| --- | ------------------------------------------------------ | ------- | -------- |
| A   | Standardgeschosse, Decke als Konturlinie, Decke in 3D  | 7, 5, 4 | erledigt |
| B   | Polygon schließen per Klick auf den Startpunkt         | 3       | offen    |
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
