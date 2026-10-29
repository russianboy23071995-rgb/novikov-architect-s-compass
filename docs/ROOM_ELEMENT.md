# Raum als Bauteil (N31–N34, N38, AUFGABENLISTE L08)

Ziel des Nutzers: ein „hochintelligentes“ Raumwerkzeug, das Höhenlinien eines geplanten Raumes (z. B. unter Dachschrägen) ausliest. Dafür wurde zuerst das Dach gebaut (docs/ROOF_ELEMENT.md). Umsetzung in vier PRs nach freigegebener Änderungskarte (29.10.2026).

| PR  | Inhalt                                                                                                                                      | Stand    |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| R1  | Raummodell, Nummer R-001, optionaler Fußbodenaufbau, Grundfläche, Schema 32 mit Migration, Aktionen                                         | erledigt |
| R2  | Werkzeug „Raum“ (Polygon, Rechteck, Kontur, Klick zwischen Wänden), Leiste und Einstellungsfenster, Raumstempel, Eigenschaften, Bearbeitung | erledigt |
| R3  | Höhenfeld (lichte Höhe), Höhenlinien (Standard 1,00/2,00 m), Grundfläche je Höhenzone                                                       | offen    |
| R4  | Raumliste als Abfrage, IfcSpace                                                                                                             | offen    |

## Nutzerentscheidungen (29.10.2026)

- Raum per Klick in einen von Wänden umschlossenen Bereich (Wandinnenseiten; Öffnungen sind keine Lücke) – R2.
- Höhenbezug unten: OK Rohfußboden plus **optionaler** Fußbodenaufbau je Raum. Im Einstellungsfenster des Raumwerkzeugs abwählbar; ohne Aufbau zählt der Rohfußboden.
- Höhenlinien standardmäßig bei 1,00 m und 2,00 m, je Raum änderbar – R3.
- Nummern R-001, R-002 … fortlaufend über das ganze Projekt, automatisch vergeben, von Hand änderbar, projektweit eindeutig; die interne ID bleibt getrennt.
- Virtuelle Grenzen (Küche/Essen) zunächst nur per Polygon von Hand.
- Erste Stufe: ein Raum liest nur Dächer und Decken seines eigenen Geschosses (A08).
- Arbeitsregel ab jetzt: jedes Werkzeug mit Werkzeugeinstellungen in der Leiste und passendem Einstellungsfenster (AGENTS.md).

## Teil R1: Modell

- `src/domain/elements/room/model.ts`: `roomSchema` (Schema 32): Umriss (einfaches Polygon), Name (frei, darf leer sein), Nummer, optional `floorBuildUp` (0–2 m). Keine gespeicherte Höhe: lichte Höhen werden in R3 aus Geschoss, Decken und Dächern abgeleitet. `roomArea` (Grundfläche, keine WoFlV), `nextRoomNumber`, `roomNumberKey`.
- Projektweite Eindeutigkeit der Nummern (getrimmt, Groß-/Kleinschreibung egal) in `validateProject`, in einem eigenen Durchlauf über alle Geschosse – auch über Geschosse, deren Prüfung sonst wiederverwendet wird.
- `src/application/rooms/actions.ts`: `addRoom` (nächste freie Nummer, leerer Name, Standardebene Raum), `updateRoom` (eine geprüfte Änderung; `floorBuildUp: undefined` entfernt den Aufbau), `nextProjectRoomNumber`, `defaultRoomLayerId`.
- Schema 32 (`rooms` je Geschoss, optional), Registry `room` (Raum), Migration 31 → 32 und 30 → 31 → 32 (gebundene Wände ohne gespeicherte Höhe wie bei D1); eine untergeschobene Raumliste in einer 31er Datei wird abgelehnt. In der Oberfläche ist ein Raum in R1 noch nicht auswählbar; Bearbeitungsaktionen schließen ihn aus, bis R2 sie anbietet.

Nachweis: Test in `src/interop/project-file/load.test.ts` (R-001/R-002, Fortsetzung nach R-010, Nummernschlüssel, Ebene Raum, Fläche 12 m², Eindeutigkeit über Geschosse und Schreibweise, Fußbodenaufbau setzen und entfernen, ungültige Werte, Speichern/Laden, 31er Datei, untergeschobene Räume, gebundene Wände aus Schema 30 und 31). 14-Modell-Hash unverändert. 1363 Tests grün. Keine Browser-Abnahme: In R1 gibt es noch nichts zu sehen.

## Teil R2: Werkzeug, Stempel, Eigenschaften

- Werkzeug „Raum“ in der Werkzeugleiste (Doppelklick öffnet „Raum-Einstellungen“). Leiste und Fenster bearbeiten denselben Entwurf (`useToolDefaults`, nicht im Undo): Name, Fußbodenaufbau an/aus mit Wert (Standard 0,12 m), Ebene, Erstellungsart. Die Leiste zeigt die nächste Nummer.
- Erstellungsarten: Klick in einen von Wänden umschlossenen Bereich (Standard), Polygon, Rechteck per Diagonale, gedrehtes Rechteck, geschlossene Kontur übernehmen. Polygone schließen über den Startpunkt wie bei allen Flächenwerkzeugen.
- Klick zwischen Wänden: `src/geometry/polygons/enclosed-face.ts` (`enclosedFace`) baut aus den Wandkörpern im Grundriss (mit Anschlüssen, `connectedWallContours`) einen ebenen Graphen, teilt alle Kanten an Schnitt-, Berühr- und Überlappungspunkten und verfolgt dessen Flächen; die kleinste beschränkte Fläche um den Klickpunkt ist der Raum. Öffnungen öffnen die Grenze nicht. Klick in eine Wand oder ins Freie: lesbare Meldung, kein Raum. Freistehende Wände innerhalb eines Raumes werden noch nicht ausgespart. `src/application/rooms/enclosure.ts` (`enclosedRoomOutline`).
- Plan: eigene Zeichenschicht (nach Referenzbildern, vor Decken), leichte Füllung, auswählbares Inneres, gestrichelter Umriss bei Auswahl. Raumstempel mit Name, Nummer und Grundfläche; der Stempelpunkt liegt auch bei L- und U-Formen im Raum (`roomLabelPoint`).
- Bearbeitung wie eine Decke: Ecke ziehen, Kante verschieben, Punkt einfügen, Versatz, Ecke auf Ecke löschen, Verschieben allein oder mit Wänden (vorbereiteter Verschiebepfad), Löschen; Fangpunkte „Raum · Ecke n“.
- Eigenschaften (`RoomProperties`): Name, Nummer (projektweit eindeutig, doppelte Nummer wird abgelehnt), Fußbodenaufbau an/aus und Wert, Ebene, Grundfläche zur Anzeige; jede Änderung ist ein Undo-Schritt. Kontextmenü: „Raum R-001 · Name“ mit Grundfläche und Fußbodenaufbau.
- Datei- und Wiederherstellungsübersichten zählen Räume.

Nachweis: Test in `src/application/drawing/actions.test.ts` (Raum 7,76 × 5,76 m aus vier Wänden, Fenster ohne Einfluss, Trennwand teilt in 3,76 × 5,76 m, Klick in Wand und ins Freie abgelehnt, R-001/R-002 mit Name und optionalem Aufbau, Ebene Raum, Zeichenschicht, Menütext, Stempelpunkt in L- und U-Form, Ecke und Versatz behalten Nummer und Name, doppelte Nummer abgelehnt, Aufbau entfernbar, Verschieben allein und mit Wand, Löschen); angepasste Übersichtstests. 14-Modell-Hash unverändert (`09528ac4…7823253`). 1364 Tests grün.

Browser-Abnahme (29.10.2026, Port 8094): Testdatei mit vier Außenwänden, Trennwand und Fenster geladen (Ladedialog zählt „0 Räume“). Werkzeug Raum, Name „Wohnen“, Fußbodenaufbau an: Klick in den linken Bereich ergibt R-001 „Wohnen“, 21,66 m², Aufbau 0,12; Klick rechts R-002; Klick in die Trennwand wird mit Meldung abgelehnt; Leiste zeigt danach R-003. Doppelklick öffnet „Raum-Einstellungen“ mit denselben Werten. Eigenschaften: Umbenennen per Enter ändert den Stempel, doppelte Nummer „r-001“ wird mit „Raumnummer r-001 ist bereits vergeben.“ abgelehnt, Fußbodenaufbau abwählbar; zwei Undo-Schritte nehmen beide Änderungen einzeln zurück. Keine Konsolenfehler.
