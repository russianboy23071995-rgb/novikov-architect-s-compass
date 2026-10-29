# Raum als Bauteil (N31–N34, N38, AUFGABENLISTE L08)

Ziel des Nutzers: ein „hochintelligentes“ Raumwerkzeug, das Höhenlinien eines geplanten Raumes (z. B. unter Dachschrägen) ausliest. Dafür wurde zuerst das Dach gebaut (docs/ROOF_ELEMENT.md). Umsetzung in vier PRs nach freigegebener Änderungskarte (29.10.2026).

| PR  | Inhalt                                                                                                                                      | Stand    |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| R1  | Raummodell, Nummer R-001, optionaler Fußbodenaufbau, Grundfläche, Schema 32 mit Migration, Aktionen                                         | erledigt |
| R2  | Werkzeug „Raum“ (Polygon, Rechteck, Kontur, Klick zwischen Wänden), Leiste und Einstellungsfenster, Raumstempel, Eigenschaften, Bearbeitung | erledigt |
| R3  | Höhenfeld (lichte Höhe), Höhenlinien (Standard 1,00/2,00 m), Grundfläche je Höhenzone                                                       | erledigt |
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

## Teil R3: lichte Höhe, Höhenlinien, Fläche je Höhenzone

- `src/domain/elements/room/heights.ts`: `storeyCeilingSources` liest Decken (Unterseite = Geschosshöhe + Versatz − Stärke) und Dächer (Unterseitenebene) **nur des eigenen Geschosses** (A08). `roomHeightField` liefert Boden (Fußbodenaufbau oder 0 = Rohfußboden), kleinste/größte lichte Höhe, Fläche je Zone (unter der ersten Linie … ab der letzten), Fläche und Teilflächen ohne Höhenquelle und die Höhenlinien.
- Rechenweg (exakt, kein Abtasten): Der Raum wird trianguliert, jedes Dreieck an allen Kanten der Höhenquellen und an den Geraden geteilt, an denen eine Dachunterseite eine Höhenlinie erreicht. Jedes konvexe Teilstück liegt damit unter einer festen Menge von Quellen und in genau einer Zone; Flächen sind exakt, kleinste/größte Höhe liegen an Eckpunkten, Höhenlinien sind die Teilstückkanten zwischen Zonen (zusammengefasst, wenn sie fluchten). Abweichung von der Karte: Statt den Flächenverschnitt aus R2 (`enclosedFace`) zu verallgemeinern, wird konvex geteilt – das vermeidet Löcher im Flächennetz (Quelle ganz innerhalb des Raumes); der Baustein aus R2 bleibt unverändert.
- Ohne Decke und Dach darüber bleibt die Höhe **offen** (Entscheidung A, N34): eigene Fläche, im Grundriss gelb markiert, in Eigenschaften und Kontextmenü genannt; nie geschätzt.
- Schema 33: optionale `heightLines` je Raum (0–5 Werte, 0,10–10 m, aufsteigend, verschieden). Fehlt das Feld, gelten 1,00/2,00 m; leer = keine Linien. Dateien aus 31/32 laden ohne Änderung; Höhenlinien in einer 32er Datei werden abgelehnt.
- Werkzeugleiste und „Raum-Einstellungen“: Feld „Höhenlinien (m)“ (Text „1,00; 2,00“, Komma oder Punkt, Übernahme mit Enter/Verlassen, lesbare Ablehnung). Neue Räume übernehmen die Werte; Standardwerte werden nicht gespeichert.
- Eigenschaften: Höhenlinien je Raum (ein Undo-Schritt), lichte Höhe von–bis über Rohfußboden bzw. Fußbodenaufbau, Fläche je Zone (Grundfläche, keine WoFlV-Faktoren, Entscheidung B), Hinweis „Ohne Decke/Dach (Höhe offen)“. Kontextmenü mit denselben Angaben.
- Grundriss (Entscheidung D): Höhenlinien dünn gestrichelt mit Beschriftung „1,00“, keine Zonenfüllung. Während einer vorbereiteten Verschiebevorschau ohne Geschosshöhe fehlen Deckenquellen.

Grenzen: Die Dachunterseite gilt im ganzen gezeichneten Dachumriss (Abschlussschnitte an Traufe/oberer Kante verkleinern die Unterseite nicht). Kein 3D-Raumkörper, kein IFC (R4). **Offener Befund aus der Abnahme:** Liegt ein Dach oder eine Decke über dem Raum, wählt ein Klick ins Rauminnere das Dach bzw. die Decke (deren Inneres liegt in der Zeichenreihenfolge darüber); der Raum ist dort per Klick nicht auswählbar (Ausweichwege nicht geprüft). Lösung braucht eine Nutzerentscheidung.

Nachweis: Tests in `src/application/drawing/actions.test.ts` (Pultdach 30° mit Unterseite 0,50 m, Deckenstreifen, offener Rest: Zonen 8·0,866 / 8·1,732 / 8·2,402+4 m², offen 4 m², Linien bei y = 0,866 und 2,598, min/max; Fußbodenaufbau verschiebt die Linien; eigene Linien, keine Linien; ohne Quellen alles offen; Planszene und Kontextmenü; Texteingabe; ein Undo-Schritt) und `src/interop/project-file/load.test.ts` (Schema 33, Prüfregeln, 32er Dateien, untergeschobene Linien). 1366 Tests grün, 14-Modell-Hash unverändert.

Browser-Abnahme (29.10.2026): Testdatei Raum 8 × 6 m, Pultdach bis y = 4,5, Deckenstreifen bis y = 5,2. Klick in den Raum ergibt R-001 mit Linien 1,00 und 2,00 und gelber Restfläche; Eigenschaften „Lichte Höhe 0,57–3,10 m über Rohfußboden“, „unter 1,00 m: 5,79 m² · 1,00–2,00 m: 13,44 m² · ab 2,00 m: 20,19 m²“, „Höhe offen: 5,28 m²“ (Summe 44,70 m² = Grundfläche; von Hand nachgerechnet). Höhenlinien „1,5“ ergibt eine Linie 1,50 und neue Zonen; Undo stellt 1,00/2,00 wieder her; „2; 2“ wird abgelehnt. Keine Konsolenfehler.
