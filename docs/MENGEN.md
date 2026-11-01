# Mengen- und Bauteillisten (L16)

Entscheidungen des Nutzers vom 01.11.2026 (Empfehlungen übernommen):

1. Wandmengen einfach über die Achse, nachvollziehbar, statt aus dem 3D-Körper.
2. Ein Fenster „Bauteilliste“ mit einem Reiter je Bauteilart.
3. Fenster und Türen: eine Zeile je Element, mit Summe „Stück“.
4. L38 (Lint-Warnungen) vorab als eigener PR (PR571).

## ML1 – Mengenabfrage

`src/application/quantities/schedule.ts`, `quantitySchedule(project)`: eine reine Abfrage über das ganze Projekt. Das Modell und die Projektdatei bleiben unverändert. Je Bauteilart entsteht eine Tabelle mit Spalten (Bezeichnung, Einheit, Nachkommastellen, summierbar ja/nein) und Zeilen, gruppiert nach Geschoss. Dazu kommen Summen je Geschoss und für das Projekt. Jedes Element liest nur sein eigenes Geschoss (A08). Die Bauteilliste (ML2), ihre CSV-Dateien und spätere Textfragen (L17) nutzen dieselbe Abfrage.

| Liste       | Spalten                                                                                  | Rechenweg                                                                                                                                                     |
| ----------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Wände       | Aufbau, Bauzustand, Stärke, Länge, Höhe, Fläche brutto, Öffnungen, Fläche netto, Volumen | Achslänge × Höhe; Öffnungen = Fenster und Türen der Wand, begrenzt auf die Wandhöhe; Volumen = netto × Stärke                                                 |
| Fenster     | Pos., Breite, Höhe, Brüstung, Fläche, Wand, Stück                                        | Rohbaumaße der Öffnung; „Wand“ = Name des Aufbaus, sonst die Stärke in cm                                                                                     |
| Türen       | Pos., Breite, Höhe, Unterkante, Fläche, Wand, Stück                                      | wie Fenster                                                                                                                                                   |
| Stützen     | Querschnitt, Bauzustand, Höhe, Querschnittsfläche, Volumen, Stück                        | Rechteck b × t, Kreis π d²/4 (genau, nicht das 32-Eck der Darstellung); Höhe vom Fuß bis zur gebundenen oder festen Oberkante                                 |
| Decken      | Fläche, Dicke, Volumen, Stück                                                            | Grundfläche des Umrisses × Dicke                                                                                                                              |
| Dächer      | Neigung, Stärke, Grundfläche, Dachfläche, Volumen, Stück                                 | Grundfläche der Oberseite in der Draufsicht; Dachfläche = Grundfläche / cos(Neigung); Volumen des geschlossenen Dachkörpers                                   |
| Treppen     | Form, Laufbreite, Steigungen, Steigung, Auftritt, Lauflänge, Volumen, Stück              | Werte wie im Treppenwerkzeug (`stairGeometry`), Volumen aus Läufen und Podesten (`stairBody`)                                                                 |
| Materialien | Material, Fläche, Volumen                                                                | Jede Schicht einer Wand mit Aufbau über die Nettofläche der Wand; Volumen = Fläche × Schichtdicke; gleiche Materialien zusammengezählt (Putz innen und außen) |

Ist die Geschosshöhe unbekannt, bleiben die Höhen gebundener Stützen und Treppen leer und werden nicht summiert. Listen ohne Elemente haben keine Gruppe.

**CSV** (`quantityCsv`), wie bei der Raumliste für Excel: Semikolon, Dezimalkomma, UTF-8 mit BOM. In der ersten Zeile stehen Titel und Rechenweg, danach die Kopfzeile mit Einheiten, eine Zeile je Element, eine Summenzeile je Geschoss und „Summe Projekt“. Die Materialliste hat keine Geschossspalte und keine Summenzeilen.

### Grenzen

- Wände über die Achse: Ecken und Anschlüsse werden nicht verschnitten. Treffen sich die gezeichneten Linien zweier Wände im Eckpunkt und liegen sie in Wandmitte, ist das Volumen einer Gehrungsecke genau. Liegt die Linie an einer Wandseite oder endet eine Wand an einem T-Anschluss auf der Linie der durchlaufenden Wand, zählt ein Streifen in der Größe von halber Stärke × Wandstärke doppelt oder fehlt. Eine Dachtrimmung wird nicht abgezogen, die Wand zählt mit voller Höhe.
- Decken: Durchdringungen mit Wänden und Stützen werden nicht abgezogen.
- Keine Abrechnungsregeln, z. B. kein Übermessen kleiner Öffnungen nach VOB/C oder Flächen nach DIN 277. Wie bei der WoFlV (N35) ist das ein eigener Schritt.
- Die Mengen stehen nicht im IFC-Export (eigener Folgeschritt).

Nachweis ML1: 4 Tests in `src/application/quantities/schedule.test.ts`, Werte von Hand nachgerechnet: Wand 3 × 2,8 m mit Fenster 1,2 × 1,35 → netto 6,78 m², Tür und Fenster in einer zweiten Wand, Rechteck- und Rundstütze, Decke 4 × 5 m, Materialauszug für „KS 17,5 + WDVS 16“ (Putz zweimal), CSV-Zeilen. 1487 Tests grün, Typprüfung beider Projekte, Architektur, Lint und Prettier sauber, 14-Modell-Hash unverändert (`e42aa36e…`). Im Browser ist ML1 noch nicht sichtbar, die Abnahme dort folgt mit ML2.
