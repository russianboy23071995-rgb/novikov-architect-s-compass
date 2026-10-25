# Speicher und Verlauf – Heap-Nachweis (25.10.2026)

Schritt 1 der Änderungskarte „Speicher und Verlauf“. Anlass: Basislinie Schulmodell (docs/acceptance/SCHOOL_RUN.md), Heap wächst je Bearbeitung um ≈ 15 / 55 / 240 MB (s / l / x).

## Messung

`node --experimental-strip-types --expose-gc benchmarks/history-memory.ts benchmarks/history-memory-results.json`

- Schulmodell s/l (Plan-Fixture) und x (`schoolFixture(20000)`, Arbeitsgeschoss s2), ohne Abbilder (Bilder werden nach Identität geteilt).
- 50 Befehle „Wandlänge auf …“ über denselben Weg wie die Befehlsleiste (`previewSelectionCommand` → `applySelectionCommand` → `commitProject`), danach jeweils die Ableitungen, die der Arbeitsbereich pro Stand anfordert.
- Jede Bearbeitung als eigene Task wie im Browser (ohne das hält `WeakRef` im Gebäude-Cache alle Ziele bis Jobende fest – erster Lauf dadurch verfälscht und verworfen).
- `heapUsed` nach GC vor und nach den 50 Bearbeitungen; jede Variante in eigenem Prozess.

## Ergebnis (MiB je Bearbeitung)

| Variante                                      |        s |         l |         x |
| --------------------------------------------- | -------: | --------: | --------: |
| nur Modell (Verlauf ohne Ableitungen)         |     0,25 |      0,85 |      1,59 |
| + Auswahl-Index                               |     0,25 |      0,85 |      1,59 |
| + Fang-Index (`getLocalSnapSources`)          |     2,72 |      8,94 |      8,86 |
| + Fangpunkte (`getProjectSnapReferences`)     |     2,82 |      9,73 |      3,63 |
| + Gebäude-Geometrie 3D (`buildBuildingSolid`) |     2,61 |      7,96 |     59,68 |
| + Wandfuß-Quellen (`getWallFootSources`)      |     0,49 |      1,70 |      9,18 |
| + Wandkörper (`connectedWallSolids`)          |     0,60 |      1,91 |     10,79 |
| **alle Ableitungen, mit Verlauf**             | **8,27** | **26,84** | **84,68** |
| alle Ableitungen, **ohne** Verlauf            |     0,12 |      0,55 |      3,47 |

## Bewertung

- **Hypothese bestätigt:** 97–98 % des Zuwachses sind abgeleitete Daten, die über ihre Verlaufsstände am Leben bleiben (`WeakMap<Project, …>`). Ohne Verlauf bleibt fast nichts liegen; das Modell selbst kostet nur 0,25–1,6 MiB je Schritt (Teilung wirkt).
- Größte Posten: Fang-Index und Fangpunkte bei s/l, Gebäude-Geometrie bei x (60 MiB je Schritt).
- Auswahl-Index praktisch kostenlos – bleibt unverändert.
- Browser-Werte liegen höher (≈ 15 MB bei s), weil dort zusätzlich Vorschau- und Renderdaten entstehen und `usedJSHeapSize` Müll enthält (Vermutung; im Browser nicht einzeln gemessen).
- Erwartung nach Schritt 3: Zuwachs je Bearbeitung ≈ Modellanteil, also ≥ 90 % weniger (Abnahmeschwelle der Änderungskarte).
- Speicherbudget (Schritt 4): Bei 1,6 MiB Modelldaten je Schritt (x) erreicht der Verlauf mit 100 Schritten ≈ 160 MiB; das Budget greift damit erst bei großen Bilder- oder Massenänderungen.

# Umsetzung und Abnahme (Schritte 2–5, 25.10.2026)

Nutzerfreigabe mit den vier Empfehlungen: Budget 256 MB, älteste Schritte mit Hinweis verwerfen, ≥ 90 % weniger Zuwachs je Bearbeitung (Undo/Redo-Median ≤ 2× Basislinie), Verlauf und Gebäude-Geometrie aus lib/bim verlegen.

## Änderungen

1. **Verlegung (gleiches Verhalten):** `application/history/project-history.ts` (Verlauf), `rendering/viewport/building-solid.ts` (`buildBuildingSolid` mit Cache). `lib/bim/history.ts` bleibt nur Datei-Brücke (`readProjectFile`). Architektur-Ausnahmen 67 → 57 (eine verschobene Kante application/history → interop/project-file/size.ts, gleiche Schuld wie vorher in lib/bim).
2. **Ableitungen nur für den aktuellen Stand:** `domain/project/derived-cache.ts` registriert die Caches pro Stand (Fang-Index, Fangpunkte, Auswahl-Index, Gebäude-Geometrie, Wandfuß-Quellen, Wandkörper). Commit, Undo und Redo geben die Einträge aller gehaltenen Schritte frei; Undo/Redo baut sie für den neuen aktuellen Stand einmal neu.
3. **Speicherbudget:** `historyModelBytes` zählt Geschosse und Bilder des Verlaufs je einmal (geteilte zählen einfach); über 256 MB fallen die ältesten Schritte weg, `trimmed` markiert den Verlauf, der Undo-Knopf zeigt „Verlauf gekürzt (Speichergrenze)“.
4. **Gefundener Fehler, behoben (nicht Teil der Karte, aber Ursache im selben Pfad):** Mit bekannter Musterbibliothek ersetzte der Editor nach jedem Commit, Laden, Undo und Redo den aktuellen Stand durch das veränderliche Ergebnis des Musterabgleichs (`controller.ts`). Danach teilte kein Commit mehr Geschosse: jeder Schritt war eine volle Modellkopie mit voller Prüfung. Im Abnahmelauf trat das nach „Neu öffnen“ ein, also im ganzen Dauerlauf. Jetzt behält der Verlauf seinen eigenen Snapshot; nur ein tatsächlich geänderter Undo/Redo-Stand übernimmt das Abgleichsergebnis. Test mit Gegenprobe.

## Nachweis Node (MiB je Bearbeitung, `benchmarks/history-memory-results-after.json`)

|                              | s vorher → nachher | l            | x            |
| ---------------------------- | ------------------ | ------------ | ------------ |
| alle Ableitungen mit Verlauf | 8,27 → ≈ 0         | 26,84 → 0,11 | 84,68 → 2,01 |
| Rückgang                     | ≈ 100 %            | 99,6 %       | 97,6 %       |

Rest bei x: Fangteile pro Bauteil (bewusst an geteilte Bauteile gebunden).

## Nachweis Browser (Schullauf, `benchmarks/school-acceptance-results-after.json`)

A/B am selben Nachmittag auf demselben Rechner (s): Basislinie a24e63c 288 / 284 ms, nur Verlegung ca89aab 284 ms, mit Schritt 3/4 ohne Fix 4 368–372 ms (Budget rechnete wegen Fehler 4 alle Schritte neu, bis 140 ms je Commit), mit Fix 4 103 / 105 ms.

| Median ms                  | s vorher → nachher | l           | x           |
| -------------------------- | ------------------ | ----------- | ----------- |
| Bearbeitungszyklus (50×)   | 304 → 103          | 862 → 284   | 3219 → 946  |
| Undo                       | 14,7 → 13,9        | 13,9 → 13,9 | 14,0 → 13,9 |
| Redo                       | 98,7 → 102         | 199 → 240   | 613 → 528   |
| Fang p95                   | 21 → 14            | 22 → 20     | 475 → 527   |
| Autosicherung (Long Task)  | –                  | –           | 3196 → 0    |
| Wiederherstellung ab Laden | 988 → 938          | 1794 → 1447 | 3810 → 3134 |

Speicher: `usedJSHeapSize` enthält Müll; belastbar sind die Tiefpunkte nach großen GC-Läufen. Bei x stiegen sie vorher von 808 auf 1279 MB über 45 Bearbeitungen (≈ 10 MB je Schritt), jetzt bleiben sie bei 499 → 543 → 543 → 545 MB. Bei s und l lief im Dauerlauf (5 bzw. 15 s) zu selten ein großer GC für eine Aussage; die Leerlaufwerte schwanken zwischen Läufen (s 468/746, l 441/1271 MB) und sind deshalb nur Hinweis.

**Abnahme:** ≥ 90 % weniger Zuwachs je Bearbeitung – erfüllt (Node s/l/x, Browser x). Undo-Median unverändert, Redo-Median höchstens 1,21× (l) – erfüllt. Alle Schritte ohne Fehler.

## Grenzen

- Ein Rechner, nur Chromium; je Größe ein bis zwei Läufe.
- Fang bei 20 k (p95 ≈ 0,5 s) und 3D-Ziehen bei l (2 s) unverändert – eigener Auftrag „Wartezeit“.
- Budget im Browser nicht ausgelöst (Verlauf blieb weit unter 256 MB); Kürzung nur per Test nachgewiesen.
- Musterabgleich bei Undo/Redo mit tatsächlich aktualisierten Mustern liefert weiterhin einen veränderlichen Stand (selten; danach teilt der nächste Commit nicht).
