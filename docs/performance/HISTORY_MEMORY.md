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
