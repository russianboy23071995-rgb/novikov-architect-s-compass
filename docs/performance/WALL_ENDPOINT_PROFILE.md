# K04a: Wandendpunkt-Vorschau

08.10.2026, Basis main 335546a, PR186 mit grüner CI zusammengeführt.
Nur Diagnose; keine Änderung an produktiven Werkzeugen oder Prüfregeln.

## Ablauf und Messgrenzen

`/benchmarks/wall-endpoint.html` → „Diagnose starten“. Je 100/1.000 Elemente aus
K03, mit 10/25 getrennten T-Gruppen und jeweils zwei Fenstern pro Gruppe. Für
„frei“ werden **alle** T-Anschlüsse der Fixture entfernt, Geometrie/Fenster bleiben.
Der Unterschied ist daher nicht ausschließlich der Preis eines einzelnen T.
Keine Bilder, alle Ebenen sichtbar. Acht Fälle, je 20 Cursorziele.

Gemessen: `editingReducer(begin)`, Aufbau von `editInteraction` und lokalem
Quellenindex, `createShiftSnapLock.resolve`, `previewEdit`, anschließend
`editingReducer(confirm)`. Vorbereitung umfasst nicht `createEditingState`.
Shift wird horizontal erworben; anschließend weicht der Cursor 0,5 m seitlich
ab, während das Ziel horizontal bleiben muss. Ohne Shift liegen die Ziele auf
der Achsverlängerung. Der Host wird verlängert; neue Anschlüsse, Verkürzung,
Schrägstellung, Nebenwand-Endpunkte und Lösevorgänge sind nicht abgedeckt.

Dies sind echte gemeinsame Application-/Snap-Funktionen im Browser, aber keine
DOM-Pointerereignisse, React-Rendering oder GPU-/Frame-Latenzen. Keine Aussage,
dass das frühere sporadische Shift-Ruckeln erledigt wäre. Es bleibt offen.
[Rohdaten und Einzelwerte](wall-endpoint-2026-10-08.json).

## Ergebnisse (Millisekunden)

| Elemente / Zustand | Vorschau Median ohne / mit Shift | p95 ohne / mit Shift | Bestätigung ohne / mit Shift |
|---|---:|---:|---:|
| 100 / ohne Anschlüsse | 0,60 / 0,50 | 1,00 / 0,90 | 2,70 / 1,70 |
| 100 / T-Gruppen | 3,10 / 2,90 | 5,40 / 3,80 | 9,00 / 11,40 |
| 1.000 / ohne Anschlüsse | 3,10 / 2,90 | 4,40 / 4,00 | 9,40 / 9,50 |
| 1.000 / T-Gruppen | 8,60 / 8,25 | 10,40 / 11,50 | 28,50 / 25,20 |

Fangmedian rund 0,1 ms in allen Fällen. Quellenaufbau 1,4–24,1 ms, Begin
0,4–10,9 ms. Ein lokaler Lauf mit fester Szenarienreihenfolge, keine allgemeine
Kapazitätsgarantie. Bestätigung jeweils nur eine Stichprobe, kein Median.

Alle acht Fälle: Vorschau vollständig gültig, Bestätigung identisch zur letzten
Vorschau, ein Undo-Schritt, Undo/Redo stellt Ausgang/Ergebnis exakt wieder her.
T-Anschlussanzahl bleibt 10/25; Shift hält die erworbene Richtung.
670 Tests, beide Typechecks, Build und Lint erfolgreich (sechs bekannte Warnungen).

## Einordnung und genau ein Folgeauftrag

Der statische Pfad führt von `previewEdit` über `editAtPointer`, `moveElementPoint`
und `updateWall` zur Gesamtprojektprüfung. Fang/Shift ist im isolierten Lauf nicht
der dominante Anteil. Eine neue Fang-Engine ist durch diese Befunde nicht begründet.

**K04b: begrenzter vorbereiteter Endpunkt-Pilot für axiale Verlängerung einer
T-Hauptwand.** Einmalige Basis-/Abhängigkeitsvorbereitung nach dem vorhandenen
Prepared-Preview-Prinzip; gemeinsame fachliche Wandänderungsregeln verwenden,
keine zweite Anschlusslogik. Vorschau gegen bisherigen Vollpfad vergleichen,
insbesondere Fensterpositionen, stationäre Nebenwände und fremde Endpunkte.
Nicht unterstützte Änderungen bleiben im Vollpfad. Bestätigung immer vollständig
prüfen und genau ein Undo-Schritt. Zunächst isolierter Pilot mit derselben Fixture,
keine pauschale Migration aller Wandwerkzeuge. Erst nach Gleichwertigkeits- und
Zeitnachweis über produktive Anbindung entscheiden. Übrige K-/V-Ziele bleiben.

Praktische Ergänzung: Im CAD einen Hauptwand-Endpunkt mit/ohne Shift verlängern,
T-Nebenwand und Fenster beobachten, bestätigen und Undo/Redo testen. Dieser
manuelle Renderer-/Eingabeabnahmetest wird hier nicht als durchgeführt behauptet.
