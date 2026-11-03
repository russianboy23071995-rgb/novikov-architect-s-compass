# Speicherzuwachs je Bearbeitung (03.11.2026)

Korrektur 3 aus dem Gesamtnachweis (docs/performance/GESAMTNACHWEIS_2026-11.md: etwa 60 MB je Bearbeitung beim Gesamtmodell 20 000, bis 1,2 GB in der Sitzung). Freigabe der Änderungskarte durch den Nutzer am 03.11.2026.

## Befund

- Der Verlauf hält bis zu 100 Projektstände. Abgeleitete Daten dieser Stände gibt er frei, wenn ihr Zwischenspeicher bei `domain/project/derived-cache.ts` angemeldet ist (docs/performance/HISTORY_MEMORY.md).
- Der Zwischenspeicher der Schnittzeichnungen (`rememberedSectionDrawing`) war nicht angemeldet. Jeder gehaltene Stand behielt deshalb alle Schnitte und Ansichten, die zu ihm gezeichnet wurden. Die Flächen je Geschoss werden seit Korrektur 1 geteilt, die zusammengesetzte Zeichnung aber ist je Stand neu.
- Bei 20 000 Elementen waren das 47 von 50 MB je Bearbeitung.
- Weitere Zwischenspeicher je Projektstand waren ebenfalls nicht angemeldet. Sie sind im Messlauf klein, wachsen beim Arbeiten im Layout aber genauso:
  - Quellen eingefügter Grundrisse (`documentSource`), an denen ihre Planszene hängt,
  - Fangteile des Blatts (`sheetParts`),
  - Layout- und Plankopfbereich (`spaceLens`) mit allem, was aus ihm abgeleitet wird,
  - Hintergrund eines Layouts (`spaceBackdrop`).

## Umsetzung

- `rendering/viewport/section-drawing.ts`: Schnittzeichnungen je Stand als `createDerivedCache`. Nach Undo oder Redo wird die Zeichnung einmal neu zusammengesetzt; die Flächen je Geschoss und Schnitt (`PartSection`) bleiben dabei wiederverwendet.
- `application/drawings/sources.ts`, `application/snapping/project-references.ts` (`sheetPartCache`), `application/views/title-block-space.ts` (`lenses`, `backdrops`): ebenfalls `createDerivedCache`. Der Layoutbereich des aktuellen Stands behält seine Identität; nur gehaltene Stände bauen ihn bei Bedarf neu.
- Nicht angemeldet, mit Grund (Liste im Test):
  - Freigabebasis des Verlaufs,
  - Blattrahmen (hängen am Bereich, gehen mit ihm),
  - Planszenen (hängen an der Quelle, gehen mit ihr),
  - je eine Zahl pro Stand (Formularschlüssel, Geschosshöhe).

## Ergebnis (Node, `benchmarks/edit-memory.ts`)

30 Wandänderungen über `editingReducer`, danach die Ableitungen, die der Arbeitsbereich je Stand anfordert: Grundriss (Fang, Auswahl, Wandkörper), 3D-Gebäude, alle Schnitte und Ansichten. Gemessen wird `heapUsed` nach GC, jede Variante läuft in einem eigenen Prozess. Rohdaten: `edit-memory/before.json` (main 3b366af) und `edit-memory/after.json`.

| MB je Bearbeitung, alles zusammen | 3 000       | 10 000       | 20 000       |
| --------------------------------- | ----------- | ------------ | ------------ |
| vorher → nachher                  | 7,56 → 1,38 | 25,57 → 4,63 | 49,95 → 8,54 |
| Rückgang                          | 82 %        | 82 %         | 83 %         |
| nur Schnitte vorher → nachher     | 7,07 → 0,90 | 23,78 → 3,00 | 47,35 → 5,78 |
| zum Vergleich: ohne Verlauf       | 1,25        | 3,86         | 7,44         |

- **Was bleibt:**
  - Die Werte nach der Änderung liegen nah am Wert ohne Verlauf. Der Rest ist überwiegend begrenzt; er stammt aus den Versionsspeichern (4 Versionen je Geschoss, Teile je Bauteil).
  - Bei 20 000 Elementen bleiben insgesamt 212 MB nach 10, 256 MB nach 30 und 293 MB nach 60 Bearbeitungen. Über lange Sitzungen kommen damit etwa 1,2 MB je Bearbeitung hinzu, vorher waren es 50 MB.
- **Undo** (Median über 9 Schritte, mit den Ableitungen des neuen Stands):

  | Modell | vorher  | nachher | Faktor |
  | ------ | ------- | ------- | ------ |
  | 3 000  | 131 ms  | 227 ms  | 1,7×   |
  | 10 000 | 959 ms  | 1362 ms | 1,4×   |
  | 20 000 | 3675 ms | 4223 ms | 1,15×  |

  Der Großteil davon ist schon auf main der neu aufgebaute Fang-Index des Grundrisses (20 000: 3,3 s). Im Browser fällt er erst bei der ersten Fangabfrage an.

## Nachweis

- `benchmarks/edit-memory.test.ts`:
  - **Erster Test:** Nach einer Bearbeitung leitet der gehaltene Stand Schnitt, Layoutbereich und Grundrissquelle neu ab. Nach Undo gleicht die Schnittzeichnung der vorherigen und einer frischen Berechnung.
  - **Zweiter Test:** Jeder `WeakMap<Project, …>` im Quelltext steht in der Ausnahmeliste mit Grund; ein neuer Zwischenspeicher je Projektstand muss angemeldet oder dort begründet werden.
  - Beide Tests schlagen ohne die Änderung fehl.
- **Prüfungen:** 1545 Tests grün, Typprüfung, Lint, Architekturprüfung; 14-Modell-Hash `e42aa36e…` unverändert.
- **Browser** (Gesamtmodell 3 000, Südansicht als Tab):
  - Wand in Geschoss 2 von 4 auf 3,6 m gekürzt, die Ansicht ändert sich.
  - Nach Undo ist die Geometrie der Ansicht gleich der einer frisch geladenen Datei; nach Redo gleich dem geänderten Stand (jeweils ohne Auswahl, die Auswahl hebt die Wand in der Ansicht hervor).
  - Keine Konsolenfehler.

## Grenzen

- Gemessen in Node; im Browser enthält `usedJSHeapSize` auch Müll. Der Browserlauf g des Gesamtnachweises wurde nicht wiederholt, der dortige Wert von etwa 60 MB stammt noch von vor Korrektur 1.
- Undo wird bei 3 000 Elementen bis 1,7× langsamer, weil die Schnitte des neuen Stands neu zusammengesetzt werden. Das liegt innerhalb der Abnahmegrenze von 2×.
- Der verbleibende Zuwachs von etwa 1,2 MB je Bearbeitung über lange Sitzungen (20 000) ist nicht weiter zerlegt.
