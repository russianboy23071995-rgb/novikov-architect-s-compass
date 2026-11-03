# Gesamtnachweis große Projekte (03.11.2026)

Anlass: externe Skalierungsprüfung vom 02.11.2026 (main `1a91ff9`). Sie fand sechs Risiken und empfahl, vor der Aussage „trägt große Projekte“ einen aktuellen Gesamtnachweis zu führen. Freigabe der Änderungskarte „Messauftrag“ am 03.11.2026.

Dieser Auftrag misst nur, es gibt keine Korrekturen und kein geänderter Produktcode. Stand: main `01adc3c` (nach PR607).

## Aufbau

- **Modell** `benchmarks/gesamt-fixture.ts`. Grundlage ist das Schulmodell der früheren Läufe (`schoolFixture`: Wände in L-Paaren, Fenster, Linien auf 5 Geschossen). Dazu kommt jede seither entstandene Funktion:
  - Geschoss 0: Wände an die Geschosshöhe gebunden, 7 Bildreferenzen mit je 4000 × 4000 px (112 der 128 Mpx Rasterbudget).
  - Geschoss 1: alle Wände mit Schichtaufbau.
  - Geschosse 0–3: je eine Decke mit 10 Deckendurchbrüchen.
  - Alle Geschosse: ein Raum in jedem L.
  - Geschoss 4: ein Dach über dem ganzen Geschoss, alle Wände daran getrimmt.
  - 4 Schnitte und 4 Ansichten.
  - 13 Abbilder: 5 Grundrisse und 8 Schnitte bzw. Ansichten.
  - 6 Layouts mit je 2 platzierten Zeichnungen.
- **Größen:** wie bisher 3 000, 10 000 und 20 000 Elemente der Grundlage. Beim großen Modell sind das 4 000 Wände (800 getrimmt), 2 000 Fenster, 14 000 Linien, 2 000 Räume, 4 Decken, 40 Durchbrüche, 1 Dach und 7 Bilder.
- **Datei:** 7 MB (Node) bzw. 6,3 MB (Browser). Die Bilder sind gestreifte Flächen und lassen sich gut komprimieren. Das Rasterbudget wird damit fast ausgeschöpft, die 128-MiB-Dateigrenze aber nicht belastet (siehe Grenzen).
- **Node-Messung** `benchmarks/gesamtnachweis-profile.ts`:
  - Gemessen werden echte Aktionen über den Bearbeitungs-Reducer der Oberfläche.
  - Je Schritt 1 Aufwärmlauf und 9 Messungen, bei schweren Schritten 3.
  - Dazu kommen Zähler: wie viele Geschosse die Prüfung wiederverwendet bzw. neu prüft, wie viele Elemente sie übernimmt, wie viele Geschossteile des Gebäudekörpers neu entstehen.
  - Rohdaten: `gesamtnachweis-2026-11/node.json`.
- **Browser-Messung:**
  - Seite `benchmarks/school-acceptance.html?size=g&run=1&fresh=1` im Produktionsbuild (`benchmarks/production-workspace.config.ts`).
  - Der bestehende Schullauf ist erweitert um die neue Größe `g` (Gesamtmodell, 20 000) und die Schritte Schnitt-Tab, Layout öffnen und PDF.
  - Die 3D-Schritte sind an die heutige Bedienung angepasst (3D über „Ansicht als Tab öffnen“).
  - Rohdaten: `gesamtnachweis-2026-11/browser.json`.

## Ergebnis Node (Median, ms)

| Schritt                                           |   3 000 |    10 000 |    20 000 |
| ------------------------------------------------- | ------: | --------: | --------: |
| Öffnen (Datei lesen, prüfen, Snapshot)            |     119 |       342 |       727 |
| Wand ändern (Geschoss 2)                          |      11 |        34 |        88 |
| Wand ändern + Gebäudekörper                       |      29 |        89 |       185 |
| Wand ändern im getrimmten Geschoss 4              |      10 |        34 |        78 |
| **Alle 8 Schnitte/Ansichten nach einer Änderung** | **924** | **3 356** | **7 286** |
| Linie auf einem Layout                            |      43 |       124 |       328 |
| Projektinformation ändern                         |      38 |       134 |       311 |
| `resolveRoofTrims` je Prüfung                     |     0,8 |       7,3 |        25 |
| `resolveBoundWallHeights` je Prüfung              |       0 |       0,1 |       0,2 |
| Undo / Redo (Reducer)                             |       0 |         0 |         0 |
| Geschosswechsel (Reducer)                         |       0 |         0 |         0 |
| Datei erzeugen (Autosicherung)                    |      59 |       193 |       374 |
| IFC                                               |     554 |     1 744 |     3 687 |

| Zähler (20 000)                       | Wand ändern | Linie auf Layout | Projektinformation |
| ------------------------------------- | ----------: | ---------------: | -----------------: |
| Geschosse neu geprüft (von 5)         |           1 |            **5** |              **5** |
| Elemente übernommen                   |       3 601 |           18 021 |             18 012 |
| Geschossteile des Gebäudes neu gebaut |           1 |                0 |                  – |

Undo, Redo und Geschosswechsel kosten im Reducer nichts. Ihre Zeit im Browser entsteht in der Darstellung.

## Ergebnis Browser (Gesamtmodell 20 000, ms)

| Schritt                                 | Gesamtmodell `g` heute | Schulmodell `x` 27.10.2026 |
| --------------------------------------- | ---------------------: | -------------------------: |
| Öffnen: Datei prüfen + Projekt laden    |            815 + 1 173 |                  – + 1 123 |
| Geschosswechsel                         |                367–707 |         583–1 157 (25.10.) |
| Schnitt-Tab öffnen                      |                  1 356 |                          – |
| Layout öffnen (2 Zeichnungen)           |                  1 462 |                          – |
| Layout als PDF                          |                  1 652 |                          – |
| Wandlänge übernehmen                    |                    589 |                        490 |
| Löschen (Entf)                          |                    874 |                        749 |
| 2D → 3D                                 |                    832 |                      1 021 |
| Z-Bewegung: Start / Übernehmen          |          1 615 / 1 027 |                          – |
| Speichern                               |                    380 |                        448 |
| IFC                                     |                  2 216 |                          – |
| Wiederherstellung: Stand prüfen / laden |          1 335 / 1 112 |              1 471 / 1 124 |

| Serie                          | `g` heute median / p95 / max | `x` 27.10. median / p95 |
| ------------------------------ | ---------------------------- | ----------------------- |
| Fang (100 Bewegungen)          | 13,9 / 18,0 / 27,9           | 18,6 / 43,9             |
| Undo (20)                      | 13,9 / 613 / 613             | 13,9 / 492              |
| Redo (20)                      | 409 / 669 / 669              | 306 / 557               |
| Sitzung (50 Wandbearbeitungen) | 579 / 745 / 957              | 492 / 548               |

- **Speicher:** 362 MB vor der Sitzung, in der Sitzung bis 1 205 MB, Sägezahn mit Abwurf etwa alle 13 Bearbeitungen. Nach 5 s Leerlauf 825 MB, nach der Wiederherstellung 173 MB. Je Bearbeitung kommen etwa 60 MB hinzu.
- **Funktion:** Es gab keine Konsolenfehler. Datei und IFC waren nach Neuladen und Wiederherstellung identisch (Prüfsummen gleich).
- **Zwei Schritte liefen in eine Zeitüberschreitung; Messfehler, kein Programmfehler:**
  - „Schnitt-Tab erneut“: Die Prüfbedingung wartete darauf, dass der Grundriss verschwindet. Der Grundriss bleibt aber eingehängt. Die Bedingung ist für künftige Läufe korrigiert (aktiver Tab), dieser Wert fehlt also.
  - „Z: Achse und Vorschau“: Die Bewegung wurde danach normal übernommen und gespeichert.

## Bewertung der Befunde

| Befund der Prüfung            | Messung                                                                                                                                                                                                                                                                                                                                   | Einordnung                                                                                                                                   |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **P2 Schnitte und Ansichten** | Nach jeder Modelländerung braucht jede gezeigte Schnittzeichnung etwa 0,9 s neu (20 000), alle 8 zusammen 7,3 s. Das wächst linear mit dem Gebäude. Grund: Der Zwischenspeicher gilt je Projektobjekt, und eine Schnittzeichnung läuft über alle Flächen des Gebäudes. Im Browser kostet schon das erste Öffnen eines Schnitt-Tabs 1,4 s. | **Größter Posten, zuerst angehen.** Bei einem Layout mit zwei Schnitten kostet jede Bearbeitung zusätzlich etwa 1,8 s, solange es offen ist. |
| **P1 storeyKeys**             | Eine Linie auf einem Layout oder eine Projektinformation prüft alle 5 Geschosse neu: 310–330 ms statt 88 ms bei einer Wandänderung, also das 3,5-Fache. Die Elementübernahme greift dabei, sonst wäre es teurer.                                                                                                                          | **Bestätigt, zweiter Schritt.** Betrifft jede Arbeit an Layouts, Planköpfen, Ebenen und Projektdaten.                                        |
| **P1 Dachtrimmung**           | 25 ms je Prüfung bei 800 getrimmten Wänden, etwa ein Viertel einer Wandänderung. Eine Wandänderung im getrimmten Geschoss ist nicht langsamer als in einem anderen. Die Geschosshöhen-Bindung ist vernachlässigbar (0,2 ms).                                                                                                              | **Messbar, aber nachrangig.** Erst bei deutlich mehr Trimmungen oder Öffnungen je Wand relevant.                                             |
| **P1 Alter Messlauf**         | Mit allen neuen Funktionen sind Sitzung (p95 745 statt 548 ms) und Redo (Median 409 statt 306 ms) gegenüber dem Lauf vom 27.10. um etwa 20–35 % langsamer. Fang und 2D → 3D sind schneller. Geschosswechsel und Wiederherstellung liegen gleich oder besser.                                                                              | Ein großes Projekt bleibt bedienbar. Die Wartezeit je Bearbeitung von 0,6–0,9 s bei 20 000 Elementen ist aber spürbar.                       |
| **P2 Dateigröße**             | Dieser Lauf belastet die 128-MiB-Grenze nicht: Die Bilder komprimieren gut, die Datei hat 7 MB.                                                                                                                                                                                                                                           | **Offen.** Ein Lauf mit realen Planscans fehlt.                                                                                              |
| **P3 CadWorkspace**           | Nicht Teil der Messung (4 505 Zeilen).                                                                                                                                                                                                                                                                                                    | Änderungsrisiko, kein gemessener Engpass.                                                                                                    |

**Empfohlene Reihenfolge der Korrekturen**, jeweils mit eigener Änderungskarte:

1. **Schnitt- und Ansichtszeichnungen nur neu rechnen, wenn sich etwas ändert, das die Zeichnung zeigt.** Möglich ist das über einen Schlüssel aus den Geschossteilen des Gebäudes statt dem Projektobjekt, oder über die schon vorhandene Wiederverwendung der Geschossteile.
2. **`storeyKeys` auf die Werte eingrenzen, die die Geschossprüfung wirklich liest.** Das sind Ebenen, Muster, Bilder, Materialien und Aufbauten; Layouts, Planköpfe, Abbilder und Projektinformation gehören nicht dazu.
3. **Speicherzuwachs je Bearbeitung** (etwa 60 MB) mit dem Verlaufsbefund aus `docs/performance/HISTORY_MEMORY.md` abgleichen.
   Erledigt am 03.11.2026 (`docs/performance/EDIT_MEMORY.md`): Schnittzeichnungen gehaltener Verlaufsstände werden freigegeben, 20 000: 50 → 8,5 MB je Bearbeitung.
4. **Dachtrimmung:** Öffnungen je Wand vorab zuordnen, statt sie für jede getrimmte Wand neu zu suchen. Das erst angehen, wenn 1–3 erledigt sind.

## Grenzen

- **Die Messung ist synthetisch.** Das Modell wiederholt dieselbe Geometrie und ist kein echter Schulplan. Echte Grundrisse haben mehr Anschlüsse und unregelmäßige Räume.
- **Die Bilder belasten das Rasterbudget, nicht die Dateigröße.** Node und Browser erzeugen sie verschieden (zlib bzw. Canvas), daher weichen die Dateigrößen leicht ab.
- **PDF** ist nur für ein Layout mit 2 Zeichnungen gemessen. **Layoutwechsel** zwischen mehreren Layouts sind nicht gemessen.
- **Node-Zeiten** enthalten keine Darstellung, **Browser-Zeiten** nur einen Lauf ohne Wiederholung. `performance.memory` ist eine Schätzung von Chromium.
- Der Wert „Schnitt-Tab erneut“ fehlt (siehe oben).
- Gemessen auf dem Rechner des Nutzers, während andere Programme liefen. Absolute Werte schwanken daher.

## Wiederholen

```bash
node --experimental-strip-types benchmarks/gesamtnachweis-profile.ts 3000,10000,20000 docs/performance/gesamtnachweis-2026-11/node.json
node node_modules/vite/bin/vite.js build --config benchmarks/production-workspace.config.ts
node node_modules/vite/bin/vite.js preview --config benchmarks/production-workspace.config.ts --port 8085
```

Danach `http://localhost:8085/benchmarks/school-acceptance.html?size=g&run=1&fresh=1` öffnen, warten, bis `schoolRun` gesetzt ist, und `JSON.stringify(window.schoolRun)` sichern. Während des Laufs nicht in das Fenster klicken.
