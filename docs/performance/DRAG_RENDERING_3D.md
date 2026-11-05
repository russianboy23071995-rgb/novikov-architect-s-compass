# 3D-Darstellung beim Türziehen (27.10.2026)

Änderungskarte „3D-Darstellung beim Türziehen messen“ mit den Empfehlungen freigegeben: nur messen, Messaufbau nur in `benchmarks/`, Modelle s und l, Grafikkarten-Zeit in einem eigenen Lauf, Vergleich mit und ohne Sicherungsprüfung im Hintergrund. Kein Produktcode geändert.

Anlass: Im Schullauf l dauerte „3D: Tür entlang Wand ziehen“ (30 Mausbewegungen) 1,6–2,0 s. Das JavaScript-Profil zeigte nur etwa 1 s Rechenzeit; die Türberechnung je Bewegung kostet 4–6 ms. Offen war, ob der Rest Grafikkarte, Neuzeichnen oder Warten ist.

## Messaufbau

- `benchmarks/render-instrumentation.ts` (Build-Modus `render-profile`, nur Diagnose): Zeitmarken um Türberechnung (`evaluate`), Fangen (`inference.resolve`), Rückmeldung an den Arbeitsbereich, Neuzeichnen der 3D-Ansicht (Anzahl), Puffer-Aktualisierung mit hochgeladener Datenmenge und Zeichenaufruf. `benchmarks/render-trace.ts` sammelt sie; mit `gpu=1` folgt jedem Zeichnen ein 1-Pixel-Lesen, das auf die Grafikkarte wartet.
- `benchmarks/school-acceptance.html?drag=1`: nur Öffnen, Tür auswählen, 2D → 3D, ruhige Szene, dann fünfmal 30 Bewegungen; Auswertung je Bewegung, dazu Chromes Long-Animation-Frames. `fresh=1` leert vorher den Speicher der Messseite.
- Ergebnisse: `benchmarks/drag-rendering-3d-results.json`.

## Ergebnis je Bewegung (Median über 150 Bewegungen je Lauf)

| ms                                  | s     | l     |
| ----------------------------------- | ----- | ----- |
| Bewegung bis nächstes Bild          | 16    | 16–17 |
| davon Türberechnung                 | 2,6   | 2,3   |
| davon Fangen (Ereignis)             | 0,2   | 0,2   |
| Neuzeichnen React bis Zeichenaufruf | –     | 7,7   |
| Puffer aktualisieren                | 0,7   | 0,5   |
| Zeichenaufruf (Prozessor)           | 0,1   | 0,1   |
| Grafikkarte (`gpu=1`, eigener Lauf) | 3     | 5,5   |
| 30 Bewegungen (Median aus 5)        | 0,5 s | 0,7 s |

- Eine normale Bewegung passt in ein Bild (16,7 ms bei 60 Hz). Die Grafikkarte braucht bei l etwa 5,5 ms (höchstens 9,8 ms) für das ganze Gebäude mit 21 584 Dreiecken und ist **nicht** der Engpass. Das vermutete Warten auf die Grafikkarte trifft nicht zu; das „untätige“ Drittel im früheren Profil ist das Warten auf das nächste Bild.
- Hochladen: Ändert sich die Dreieckszahl (bei s 40 von 150 Bewegungen, Öffnungsschnitt springt), wird der ganze Puffer neu geladen (~0,5 MB, 1,6 ms); sonst nur Teilstücke oder nichts. Unkritisch.

## Die eigentlichen Ausreißer: Fangen an bestimmten Stellen (l)

In jedem Durchgang bei l dauern genau die Bewegungen 14, 20, 21, 26 und 27 jeweils 45–67 ms statt 16 ms (25 von 150):

| Median ms                     | langsame Bewegung | normale Bewegung |
| ----------------------------- | ----------------- | ---------------- |
| Fangen im Mausereignis        | 16,6              | 0,2              |
| Ereignis bis Neuzeichnen      | 6,8               | 6,1              |
| Neuzeichnen bis Zeichenaufruf | 23,8              | 7,7              |
| Türberechnung                 | 1,6–2,9           | 2,3              |

Das Fangen an diesen Mauspositionen kostet 15–20 ms, und das folgende Neuzeichnen in React ist dreimal so teuer wie sonst; zusammen fallen zwei bis drei Bilder aus. Bei s treten keine solchen Stellen auf. Welche Fangquelle an diesen Stellen so teuer ist, ist nicht gemessen.

## Vollständiger Schullauf l zum Vergleich

Im vollständigen Lauf (mit allen vorherigen Schritten) dauerte der Ziehschritt 1113 ms (lange Aufgaben 245 ms). Die 30 Zeichnungen lagen in 805 ms; die Abstände über 45 ms (79, 61, 49, 62, 51, 66 ms) liegen an denselben Mauspositionen wie die langsamen Fang-Bewegungen. Der Rest des Schritts sind Menü, Vorbereitung der ersten Bewegung und Abschluss.

## Hintergrundarbeit

- Ohne frischen Speicher lief die Sicherungsprüfung des vorigen Laufs im Schritt „Szene fertig“ (1082 statt ~500 ms) und nicht im Ziehen; das Ziehen selbst war gleich schnell (Median 639 ms).
- In frischen Läufen fällt in einen der ersten Durchgänge eine einmalige lange Arbeit nach dem Zeichnen (s 340–440 ms, l 580–800 ms), gefolgt von einigen Bewegungen mit ~40 ms Zusatzarbeit. Sie gehört nicht zum Ziehen; vermutlich ist es die erste Autosicherung nach dem Öffnen (nicht zugeordnet).

## Folgerung

- Ein Umbau der Darstellung (nur das bewegte Bauteil zeichnen) lohnt nicht: Zeichnen und Grafikkarte zusammen liegen bei l unter 6 ms je Bild.
- Spürbaren Gewinn verspricht nur das Fangen beim Türziehen in 3D an den teuren Stellen (15–20 ms im Ereignis und rund 16 ms zusätzlich im Neuzeichnen). Ein Kandidat für eine eigene Änderungskarte: erst die teure Fangquelle zuordnen, dann gezielt beschleunigen.

## Grenzen

- Ein Rechner, Chrome, 60 Hz; Grafikkarten-Zeit über erzwungenes Warten gemessen (enthält Synchronisationskosten, eher zu hoch).
- Modell x nicht gemessen (Empfehlung der Karte).
