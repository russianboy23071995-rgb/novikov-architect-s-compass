# Raum als Bauteil (N31–N34, N38, AUFGABENLISTE L08)

Ziel des Nutzers: ein „hochintelligentes“ Raumwerkzeug, das Höhenlinien eines geplanten Raumes (z. B. unter Dachschrägen) ausliest. Dafür wurde zuerst das Dach gebaut (docs/ROOF_ELEMENT.md). Umsetzung in vier PRs nach freigegebener Änderungskarte (29.10.2026).

| PR  | Inhalt                                                                                                                                      | Stand    |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| R1  | Raummodell, Nummer R-001, optionaler Fußbodenaufbau, Grundfläche, Schema 32 mit Migration, Aktionen                                         | erledigt |
| R2  | Werkzeug „Raum“ (Polygon, Rechteck, Kontur, Klick zwischen Wänden), Leiste und Einstellungsfenster, Raumstempel, Eigenschaften, Bearbeitung | offen    |
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
