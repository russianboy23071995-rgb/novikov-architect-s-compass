# Gelände (L43, ab 05.11.2026)

Nutzerwunsch 02.11.2026, Änderungskarte am 05.11.2026 mit „Go“ freigegeben.

| Teil | Inhalt                                                | Stand    |
| ---- | ----------------------------------------------------- | -------- |
| G1   | Modell, Dreiecksnetz, 3D-Körper, Dateiformat 64       | erledigt |
| G2   | Werkzeug, Grundriss, Höhenlinien, Einstellungen, Fang | erledigt |
| G3   | Schnitt, Ansicht, IFC                                 | erledigt |

Entscheidungen aus der Karte:

- Ein Gelände je Projekt. Es liegt im Erdgeschoss-Datensatz, damit Auswahl, Ebene und Löschen wie bei allen Elementen funktionieren, gehört aber zum Gebäude. Das weicht in der Speicherung von der Karte ab, nicht in der Wirkung.
- Höhen zählen von ±0,00 des Projekts, nicht vom Geschoss.
- Das Gelände wird nicht am Gebäude ausgeschnitten.
- Höchstens 5.000 Punkte im Umriss und 5.000 Höhenpunkte.

## Teil G1: Modell und 3D

- **Modell** (`domain/elements/terrain/model.ts`): Umriss mit Höhe je Ecke, Höhenpunkte innerhalb des Umrisses, Tiefe des Körpers, Farbe, Abstand der Höhenlinien. Ein Umriss mit Kreuzungen und Punkte außerhalb werden abgelehnt.
- **Dreiecksnetz:** eigene Delaunay-Berechnung ohne neues Paket. Lange Umrisskanten werden unterteilt, damit das Netz auch einem nicht konvexen Umriss folgt. Dreiecke außerhalb fallen weg. Das Ergebnis ist je Gelände zwischengespeichert.
- **3D:** Oberfläche, Seiten entlang des Umrisses, flache Unterseite in der Tiefe unter dem niedrigsten Punkt. Das Gelände gehört zum Gebäudekörper und lässt sich in 3D anklicken.
- **Schema 64:** Liste `terrains` am Geschoss. Eine 63er Datei lädt unverändert, mit Gelände wird sie abgelehnt.

## Teil G2: Werkzeug und Grundriss

- **Werkzeug:** Ohne Gelände zeichnet es den Umriss, der Klick auf den ersten Punkt schließt. Danach setzt jeder Klick einen Höhenpunkt mit der eingestellten Höhe. Das geht nur im Erdgeschoss.
- **Felder:** Höhe neuer Punkte, Körpertiefe, Abstand der Höhenlinien, Farbe, Ebene. In der Werkzeugleiste und im Einstellungsfenster gleich.
- **Elementfenster:** Doppelklick auf den Umriss. Liste aller Ecken und Höhenpunkte mit Lage und Höhe, die Höhe ist änderbar, Höhenpunkte lassen sich löschen. Jede Änderung ist ein Rückgängig-Schritt.
- **Grundriss:** Umriss, Höhenlinien, Punkte mit Höhenangabe. Das Gelände liegt ganz unten. Nur der Umriss ist anklickbar, Klicks im Inneren bleiben frei für alles, was darauf liegt.
- **Fang:** Ecken, Kantenmitten und Höhenpunkte.
- **Pipette:** Übernimmt Tiefe, Farbe, Linienabstand und Ebene.

**Abnahme im Browser (05.11.2026):**

| Schritt                         | Ergebnis                                              |
| ------------------------------- | ----------------------------------------------------- |
| Vier Ecken, Klick auf die erste | Gelände mit vier Ecken auf +0,00                      |
| Höhe 2, zwei Klicks             | Zwei Punkte, Höhenlinien alle 50 cm                   |
| Doppelklick auf den Umriss      | Fenster mit vier Ecken, zwei Punkten, zweimal Löschen |
| 3D-Ansicht                      | Geschlossener Körper mit Hügel, Gebäude steckt darin  |

**Grenzen G2:** Punkte lassen sich nur in der Höhe ändern und löschen, nicht in der Lage verschieben, und Ecken nur in der Höhe. Das weicht von der Karte ab, dort stand „verschieben“. Das Gelände als Ganzes wird nicht bewegt. Im Browser sind Löschen und Ändern im Fenster nur angezeigt, nicht bedient.

## Teil G3: Schnitt, Ansicht, IFC

- **Schnitt und Ansicht:** Das Gelände gehört zum Gebäudekörper und erscheint dort wie jedes Bauteil, im Schnitt als geschnittene Fläche von der Oberfläche bis zur Unterkante. Ein Schnitt, der genau durch Höhenpunkte läuft, wird um einen Mikrometer versetzt berechnet, sonst zerfiele die Fläche.
- **IFC:** `IFCGEOGRAPHICELEMENT` (TERRAIN) mit dem geschlossenen Dreiecksnetz als `IFCTRIANGULATEDFACESET`.

**Abnahme im Browser (05.11.2026):** Gelände mit Höhenpunkt +2,00, Schnitt genau durch den Punkt: geschlossene Fläche von der Spitze bis zur Unterkante.

**Grenzen G3:** Der Geländekörper schneidet sich mit Bauteilen nicht, Wände und Keller stecken im Schnitt im Gelände. In Archicad ist das IFC nicht geprüft. Die Oberfläche hat keine eigene Schraffur, der Schnitt nutzt die Schnittfüllung.
