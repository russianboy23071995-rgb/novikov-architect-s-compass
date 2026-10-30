# Raum als Bauteil (N31–N34, N38, AUFGABENLISTE L08)

Ziel des Nutzers: ein „hochintelligentes“ Raumwerkzeug, das Höhenlinien eines geplanten Raumes (z. B. unter Dachschrägen) ausliest. Dafür wurde zuerst das Dach gebaut (docs/ROOF_ELEMENT.md). Umsetzung in vier PRs nach freigegebener Änderungskarte (29.10.2026).

| PR  | Inhalt                                                                                                                                      | Stand    |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| R1  | Raummodell, Nummer R-001, optionaler Fußbodenaufbau, Grundfläche, Schema 32 mit Migration, Aktionen                                         | erledigt |
| R2  | Werkzeug „Raum“ (Polygon, Rechteck, Kontur, Klick zwischen Wänden), Leiste und Einstellungsfenster, Raumstempel, Eigenschaften, Bearbeitung | erledigt |
| R3  | Höhenfeld (lichte Höhe), Höhenlinien (Standard 1,00/2,00 m), Grundfläche je Höhenzone                                                       | erledigt |
| R3b | Höhenlinien als eigene Einträge: Höhe, Farbe, Linienart, Unter- und Oberkante; Fläche ab Linie und Anteil                                    | erledigt |
| R4  | Raumliste als Abfrage, IfcSpace                                                                                                             | erledigt |

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

## Teil R3b: Höhenlinien mit Farbe, Linienart, Unter- und Oberkante (30.10.2026)

Nutzervorgabe: „Höhenlinie hinzufügen“, Höhe angeben, Farbe und Linienart (aus den in den Einstellungen erzeugten Linienarten) wählen, je Linie Unter- und Oberkante; Beispiel 2,30 m bis Außenkante Dachhaut als Grundlage für einen Geschossnachweis. Entscheidungen E–H wie empfohlen.

- Modell (Schema 34, `src/domain/elements/room/height-line.ts`): `heightLines` je Raum als Liste (höchstens 10) von Einträgen `{ id, height (0,10–10 m), color, style, lower, upper }`. `style` ist eine eingebettete, geprüfte Kopie der gewählten Linienart (wie bei Zeichenlinien), damit die Datei überall gleich aussieht; Linienarten mit fester Farbe erzwingen ihre Farbe. `lower`: OK Fußboden (mit Aufbau, falls vorhanden) oder OK Rohfußboden. `upper`: Unterseite (lichte Höhe) oder Außenkante Dachhaut (bei Decken deren Oberkante). Fehlt die Liste, gelten 1,00/2,00 m lichte Höhe, blau, gestrichelt; diese Standardliste wird nicht gespeichert.
- Migration: Schema 33 (Zahlenliste) → Einträge mit lichter Höhe im Standardaussehen; 31/32 ohne Linien laden unverändert.
- Berechnung (`roomHeightLineResults`): je Linie ein eigenes Höhenfeld mit ihrem Boden und ihrer Oberfläche (Dachoberseite = Unterseite + Stärke/cos Neigung); Ergebnis: Lage der Linie, Fläche ab der Linienhöhe, Fläche darunter, Anteil an der Grundfläche. Lichte Höhe von–bis und Fläche ohne Höhenquelle unverändert (`roomClearHeights`). Die bisherigen Zonenflächen entfallen (Entscheidung F).
- Werkzeugeinstellungen: Abschnitt „Höhenlinien“ im Fenster „Raum-Einstellungen“ mit Tabelle (Höhe, Farbe, Linienart, Unterkante, Oberkante, Löschen), „Höhenlinie hinzufügen“ (0,50 m über der höchsten) und „Standard wiederherstellen“. Die Leiste zeigt nur „Höhenlinien: 1,00 · 2,00 · 2,30 Dachhaut …“; der Knopf öffnet das Fenster direkt in diesem Abschnitt (Regel in AGENTS.md: Leiste = häufigste Einstellungen, Fenster = alle).
- Eigenschaften: „Höhenlinien bearbeiten…“ öffnet dasselbe Bearbeitungsfeld für den gewählten Raum; jede Änderung (auch Farbe, erst beim Schließen der Farbwahl) ist ein Undo-Schritt. Anzeige „ab 2,30 m (bis Dachhaut): 19,26 m² (43,1 %)“, ebenso im Kontextmenü.
- Grundriss: jede Linie in ihrer Farbe und Linienart (Muster 0,50 m je Wiederholung), Beschriftung in Linienfarbe, entlang der Linie versetzt, damit sie den Raumstempel nicht überdecken.

Grenzen: keine Bewertung nach Landesbauordnung (Vollgeschoss/Dachgeschoss) – nur Flächen und Anteile; Unter-/Oberkante nur aus den zwei angebotenen Bezügen; eigene Linienarten müssen in den Einstellungen angelegt sein (im Testbrowser waren nur die drei eingebauten vorhanden). Der Befund „Raum unter Dach/Decke per Klick nicht auswählbar“ (R3) bleibt offen.

Nachweis: Tests in `src/application/drawing/actions.test.ts` (lichte Höhe/offene Fläche; Standardlinien mit Fläche, Anteil, Lage; 2,30 m bis Dachhaut mit Dachstärke 0,20/cos 30° und Deckenoberkante; Fußbodenaufbau verschiebt nur Linien „OK Fußboden“; Linie nur an der Deckenkante; Hinzufügen, Grenze 10, Standarderkennung; feste Farbe und doppelte IDs abgelehnt; Planszene und Kontextmenü; ein Undo-Schritt; Standard wiederherstellen) und `src/interop/project-file/load.test.ts` (Schema 34, Prüfregeln, Migration 33 → 34, 32er/33er Dateien, untergeschobene Einträge). 1367 Tests grün, 14-Modell-Hash unverändert.

Browser-Abnahme (30.10.2026, Testdatei aus R3 als Schema 33 geladen): Leiste zeigt „Höhenlinien: 1,00 · 2,00 …“, Knopf öffnet „Raum-Einstellungen“ im Abschnitt Höhenlinien; „Höhenlinie hinzufügen“ ergibt 2,50, geändert auf 2,30, Oberkante Außenkante Dachhaut, durchgezogen, rot; Leiste „1,00 · 2,00 · 2,30 Dachhaut“. Klick in den Raum: Linie rot durchgezogen, 1,00/2,00 blau gestrichelt; Eigenschaften „ab 1,00 m: 33,63 m² (75,2 %) · ab 2,00 m: 20,19 m² (45,2 %) · ab 2,30 m (bis Dachhaut): 19,26 m² (43,1 %)“ – von Hand nachgerechnet (Linie bei y = 2,718 m; 1,782 · 7,76 + 0,70 · 7,76 = 19,26 m²). Fenster „Höhenlinien R-001“: Unterkante auf Rohfußboden ändert die Linie, ein Undo stellt sie wieder her. Keine Konsolenfehler.

## Teil R4: Raumliste und IfcSpace (30.10.2026)

Entscheidungen M–P wie empfohlen. Wohnflächenberechnung mit Abzügen/Zuschlägen (Fenster-/Türnischen, Schornstein u. a.) folgt später als eigener Schritt (N35).

- Abfrage `roomSchedule` (`src/application/rooms/schedule.ts`): je Geschoss alle Räume (nach Nummer sortiert) mit Nummer, Name, Grundfläche, Fußbodenaufbau, lichter Höhe von–bis, je Höhenlinie Fläche ab Linie und Anteil, Fläche „Höhe offen“; Summen je Geschoss und Projekt. Eine Spalte je vorkommender Linie (gleiche Höhe mit gleicher Unter-/Oberkante); fehlt einem Raum eine Linie, bleibt das Feld leer. Gedacht auch für spätere Text-/KI-Abfragen.
- `roomScheduleCsv`: Semikolon, Dezimalkomma, UTF-8 mit BOM (Excel öffnet Umlaute richtig), Summenzeilen je Geschoss und Projekt.
- Fenster „Raumliste“ über Menü *Organisation → Raumliste*: Tabelle nach Geschoss gruppiert mit Summen, Klick oder Enter auf eine Zeile wechselt ins Geschoss und wählt den Raum; „Als CSV speichern“. Die Liste ändert das Modell nie.
- Geschosszuordnung eines gewählten Elements (`workingStoreyForTarget`) läuft jetzt über das Element-Register statt über eine feste Liste (Wand, Fenster, Tür): Räume und künftige Objektarten anderer Geschosse werden gefunden; Decken, Dächer, Linien usw. anderer Geschosse wechseln bei Auswahl damit ebenfalls ins richtige Geschoss.
- IFC: je Raum ein **IfcSpace** (Name = Nummer, LongName = Name, `.ELEMENT.`, `.INTERNAL.`, ElevationWithFlooring = Fußbodenaufbau), Körper = Umriss vom Rohfußboden bis zur Geschosshöhe (Entscheidung M; ohne Geschosshöhe kein Körper), über `IfcRelAggregates` dem Geschoss zugeordnet. `Qto_SpaceBaseQuantities`: NetFloorArea, GrossFloorArea (beide Grundfläche), Height (Geschosshöhe), FinishCeilingHeight (größte lichte Höhe). NOVIKOV-Eigenschaften: Number, RoomName, FloorBuildUp, ClearHeightMin/Max, AreaWithoutHeightSource, je Höhenlinie `AreaFrom …` und `ShareFrom …` (z. B. „AreaFrom 2.30 m OuterSkin FinishedFloor“).
- Archicad-Prüfdatei: `benchmarks/room-ifc-acceptance.ts`, `scripts/generate-room-acceptance-ifc.mjs` → `NOVIKOV-Raum-Test.ifc` (Dach-Abnahmehaus; EG „Wohnen“ R-001 mit Aufbau 0,12 m, lichte Höhe 2,68 m; OG „Dachraum“ R-002 unter dem Pultdach mit zusätzlicher Linie 2,30 m bis Dachhaut).

Grenzen: Raumkörper im IFC ist ein Quader bis Geschosshöhe (unter der Dachschräge abgeschnittener Körper später); kein 3D-Raumkörper in der Ansicht; keine WoFlV/Landesbauordnung. Archicad-Import durch den Nutzer steht aus.

Nachweis: Test in `src/lib/bim/ifc.test.ts` (Abfrage mit Räumen, Spalten, lichten Höhen 2,68 m, Summen; Geschosszuordnung über das Register; CSV mit BOM, Dezimalkomma, leeren Feldern und Summen; IfcSpace mit Nummer/Name/Aufbau, Zuordnung zum Geschoss, Mengen und Höhenwerten; ohne Räume kein IfcSpace). 1369 Tests grün, 14-Modell-Hash unverändert.

Browser-Abnahme R4 (30.10.2026, Port 8094): Prüfprojekt aus `benchmarks/room-ifc-acceptance.ts` geladen (Ladedialog „2 Räume“). *Organisation → Raumliste*: Erdgeschoss R-001 Wohnen 43,89 m², Aufbau 0,12 m, lichte Höhe 2,68–2,68 m; 1. Obergeschoss R-002 Dachraum 43,89 m², 2,63–4,16 m; Spalten „ab 1,00 m“, „ab 2,00 m“, „ab 2,30 m (bis Dachhaut)“ (bei R-001 leer); Summen je Geschoss und Projekt 87,78 m². Klick auf R-001 bei aktivem Obergeschoss wechselt ins Erdgeschoss und wählt den Raum. „Als CSV speichern“ (Inhalt im Browser abgefangen, keine Datei gespeichert): Dateiname `novikov-raumliste.csv`, Typ text/csv, UTF-8-BOM (EF BB BF), Semikolon, Dezimalkomma, Summenzeilen. Keine Konsolenfehler.
