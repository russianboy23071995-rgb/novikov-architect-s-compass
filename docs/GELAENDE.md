# Gelände (L43, ab 05.11.2026)

Nutzerwunsch 02.11.2026, Änderungskarte am 05.11.2026 mit „Go“ freigegeben.

| Teil | Inhalt                                                | Stand    |
| ---- | ----------------------------------------------------- | -------- |
| G1   | Modell, Dreiecksnetz, 3D-Körper, Dateiformat 64       | erledigt |
| G2   | Werkzeug, Grundriss, Höhenlinien, Einstellungen, Fang | offen    |
| G3   | Schnitt, Ansicht, IFC                                 | offen    |

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

**Grenzen G1:** Noch kein Werkzeug, das Gelände entsteht bisher nur über das Modell. Eine Browserabnahme folgt mit G2.
