# Abnahmelauf Schulmodell – Basislinie (25.10.2026)

Nutzerfreigabe 25.10.2026: drei Größen (s ≈ 3 k „realistisch“, l ≈ 10 k „groß“, x = 20 k synthetisch zum Vergleich), je Geschoss ein Abbild ≈ 5 MB, **keine Zielwerte** (erste Basislinie), automatisiertes Skript auf einer Messseite, im Browser beobachtet.

## Aufbau

- **Modell** `benchmarks/school-plan-fixture.ts`: fünf Geschosse (EG, 1.–4. OG), je Flügel 50 × 20 m, 2,5 m Mittelflur, 6 Klassen je Seite. Außenwände an den Ecken verbunden, Flurwände als Hauptwände, Trennwände mit T-Anschluss an den Flur, eine Tür je Klasse am Flur, zwei Fenster je Klasse an der Fassade, Schraffur je Raum und Flur, Tische als geschlossene Polylinien. Wände unter dem obersten Geschoss an die Deckenunterseite des darüberliegenden Geschosses gebunden. Positionsnummern wie nach dem Setzen (`withOpeningMarks`).
  - s: 1 Flügel, 44 Tische/Raum → 80 Wände, 120 Fenster, 60 Türen, 2640 Linien, 65 Schraffuren, 5 Abbilder = 2970 Elemente, Datei 28,8 MB (davon 22 MB Bilder).
  - l: 3 Flügel, 50 Tische/Raum → 240 / 360 / 180 / 9000 / 195 / 5 = 9980 Elemente, 30,7 MB.
  - x: bestehendes `schoolFixture(20000)` (synthetisch, ohne Türen) + 5 Abbilder, 31,1 MB.
- **Messseite** `benchmarks/school-acceptance.html?size=s|l|x&images=1&run=1` im Produktionsbuild (`benchmarks/production-workspace.config.ts`, Vorschau Port 8085). Echter `CadWorkspace`, Bedienung nur über Oberfläche (Dateiauswahl, Navigator, Auswahl-Schaltflächen, Befehlsleiste, Tasten, Zeigerereignisse). Beobachtet: `console.error`, unbehandelte Fehler, Long Tasks, `performance.memory`. Downloads werden im Speicher abgefangen, nicht gespeichert.
- **Ablauf:** Öffnen → 5 Geschosswechsel → Wandlänge/Fensterbreite/Tür DIN per Befehl (Vorschau + Übernehmen) → Tür setzen → Tür entlang Wand → Linie löschen (Entf) → 100 Fangbewegungen (Linienwerkzeug) → 2D→3D, Tür in 3D ziehen, 3D→2D → 20× Undo, 20× Redo → Speichern, neu öffnen → 50 Wandbearbeitungen (Sitzung) → 5 s Leerlauf → Autosicherung abwarten → Neuladen → Wiederherstellung.
- Messwert je Schritt: Aktion bis sichtbarer Zielzustand plus zwei Frames. Rohdaten `benchmarks/school-acceptance-results.json`.

## Ergebnis

Alle Schritte in allen drei Läufen erfolgreich. **Keine Konsolenfehler, kein Error-Boundary** (auch nicht in 3D; der offene Fall vom 24.10. wurde nicht reproduziert).

| Schritt (ms)                         |   s (3 k) |  l (10 k) |        x (20 k) |
| ------------------------------------ | --------: | --------: | --------------: |
| Öffnen: Datei prüfen + Projekt laden | 313 + 289 | 559 + 640 |     1616 + 2022 |
| Geschosswechsel                      |   173–271 |   398–470 |        583–1157 |
| Auswahl                              |     21–84 |    35–223 |           59–70 |
| Befehlsvorschau                      |     20–27 |    47–116 |         128–146 |
| Befehl übernehmen                    |    94–113 |   271–389 |        578–1013 |
| Tür setzen                           |       205 |       485 |               – |
| Tür entlang Wand                     |       250 |       517 |               – |
| Löschen (Entf)                       |       136 |       515 |            1349 |
| 2D → 3D                              |       468 |       831 |            1708 |
| 3D: Tür ziehen                       |       954 |      1598 | – (keine Türen) |
| 3D → 2D                              |       105 |       164 |             237 |
| Speichern                            |       216 |       306 |             670 |
| Neu öffnen (prüfen + laden)          | 300 + 237 | 427 + 634 |     1125 + 1793 |
| Autosicherung (Long Task)            |         – |         – |            3196 |
| Wiederherstellung ab Laden           |       988 |      1794 |            3810 |

| Serie (ms)                     | s median / p95 / max | l                  | x                  |
| ------------------------------ | -------------------- | ------------------ | ------------------ |
| Fang (100 Bewegungen)          | 17,9 / 21,1 / 22,7   | 14,7 / 22,1 / 40,1 | 20,4 / 475 / 1647  |
| Undo (20)                      | 14,7 / 219 / 219     | 13,9 / 266 / 266   | 14,0 / 649 / 649   |
| Redo (20)                      | 98,7 / 192 / 192     | 199 / 466 / 466    | 613 / 1512 / 1512  |
| Sitzung (50 Wandbearbeitungen) | 304 / 414 / 482      | 862 / 1370 / 1825  | 3219 / 4093 / 4463 |

| Speicher (usedJSHeapSize, MB)                |       s |        l |        x |
| -------------------------------------------- | ------: | -------: | -------: |
| nach Öffnen                                  |     198 |      220 |      374 |
| vor Sitzung (nach 3D, Speichern, neu öffnen) |     503 |      785 |      985 |
| Sitzung min–max                              | 382–906 | 531–2480 | 529–2606 |
| Zuwachs je Bearbeitung                       |    ≈ 15 |     ≈ 55 |    ≈ 240 |
| nach 5 s Leerlauf                            |     883 |     1465 |     2866 |
| nach Wiederherstellung + Leerlauf            |    1232 |     2048 |     2465 |

## Bewertung

1. **Speicher ist das größte Risiko.** Jede Bearbeitung hält ≈ 15 MB (s) bis ≈ 240 MB (x); die Sägezahnkurve fällt nur durch GC-Läufe zurück, das Niveau danach steigt. Hypothese: Verlaufseinträge (bis 100) halten neben dem Modell abgeleitete Daten (Geometrie-/Fangcaches, Vorschau-Ausschnitte) fest. Nach Wiederherstellung liegt der Leerlaufwert über dem vor dem Neuladen (zweite Kopie des Projekts im Speicher?). Nicht nachgewiesen – Folgeauftrag mit Heap-Snapshot.
2. **Wartezeit skaliert etwa linear mit dem Gesamtmodell, nicht mit dem Geschoss.** Befehl übernehmen 0,1 s (s) → 0,3 s (l) → 1 s (x); Sitzungszyklus 0,3 → 0,9 → 3,2 s. Bei 20 k bricht der Fang ein (p95 475 ms) und die Autosicherung blockiert 3,2 s am Stück.
3. **3D:** Umschalten 0,5–1,7 s, Tür ziehen 1–1,6 s inklusive Bestätigung; kein Fehler.
4. **Fachgrenze gefunden:** Eine Trennwand darf derzeit nur einen T-Anschluss haben und nicht zugleich Hauptwand sein („Eine Nebenwand darf vorerst nur einen T-Anschluss haben …“). Trennwände, die an Fassade _und_ Flur anschließen, sind nicht modellierbar; das Modell endet daher stumpf an der Fassade.

## Grenzen

- Ein Lauf je Größe, ein Rechner, nur Chromium (eingebauter Browser der Desktop-App).
- `usedJSHeapSize` enthält nicht eingesammelten Müll; Werte sind Näherungen, kein Peak-/Native-Speicher.
- Fangwerte sind frame-gebunden (Untergrenze ≈ 14–17 ms).
- Geometrie synthetisch (regelmäßiges Raster, keine Treppen, keine Decken als Bauteil); x ohne Türen, daher dort kein 3D-Türziehen.
- Wandendpunkt-Ziehen nicht automatisiert; Tür- und Fangbewegung über Zeigerereignisse.
