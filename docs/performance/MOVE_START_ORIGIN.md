# Start der Gruppenbewegung bei großem Modell (27.10.2026)

Änderungskarte „Start der Gruppenbewegung bei großem Modell“ mit den Empfehlungen freigegeben (G1–G3): schnellerer Start von „Element frei bewegen“ in 3D bei gleichen Fangergebnissen (Ecken, Rangfolge, Radius, Verdeckung).

## Befund

Schullauf x (PR480/481): „Z: Bewegung starten, Ursprung wählen“ 2,5–3,3 s, „Z: Achse und Vorschau“ ≈ 1 s. Node, Modell x (92 000 Gebäudeflächen, 4 000 Wände, 88 000 Ecken), Aufbau der Ursprungsabfrage (`rendering/viewport/movement-origin.ts`):

| Teil                                      | ms (x)                     | Wann                                                 |
| ----------------------------------------- | -------------------------- | ---------------------------------------------------- |
| Gebäudeecken aller Geschosse              | 967, nach Bearbeitung 1236 | nach jeder Bearbeitung neu (Cache am ganzen Gebäude) |
| davon Kanten je Wand / Duplikate per JSON | 741 / 197                  |                                                      |
| Box-Index der projizierten Ecken          | 420                        | bei jedem Start                                      |
| Sichtbarkeitsindex über alle Flächen      | 497                        | bei jedem Start                                      |

Die Z-Arbeitsebene (`wall-preview-context.ts`, Zweig auf abweichender Höhe) nutzt dieselben Ecken und dieselbe Ursprungsabfrage.

## Umsetzung

- **G1** `movementCorners`: Ecken je Geschossteil (`buildingFacePart`, wie Picking je Geschoss PR472) berechnet und schwach gemerkt; nach einer Bearbeitung nur das geänderte Geschoss neu. Duplikate per Zahlenschlüssel statt `JSON.stringify`. Flächen ohne wiederverwendbaren Geschossteil oder nicht zusammenhängende Teile: wie bisher in einem Durchgang.
- **G2** `createMovementOriginQuery`: Bildschirmraster (32-px-Zellen, Aufbau in Linearzeit) statt Box-Index; liefert genau die Indizes der endlichen Punkte im geschlossenen Abfragefenster, danach unveränderte Sortierung, Abstand, Radius, Höhenfilter, Verdeckung. Sehr große Fenster oder Zellnummern jenseits exakter Ganzzahlschritte (sehr große Koordinaten) werden per Durchlauf beantwortet.
- **G3** Sichtbarkeitsindex bei Bedarf (`lazyAnchorVisibility`, PR474): erst bei der ersten Verdeckungsprüfung. Abweichung von der Karte: keine Wiederverwendung über mehrere Starts, weil die sichtbare Flächenliste je Start neu entsteht (Schlüssel bräuchte die Identität des Ebenenfilters).

## Nachweis

- Tests (`src/rendering/viewport/wall-point-candidates.test.ts`): Ecken gleich der bisherigen Ableitung (Orakel im Test), auch nach Bearbeitung und Undo; unveränderte Geschosse behalten ihre Eckobjekte, die geänderte Wand bekommt neue. Ursprungsabfrage gleich der bisherigen (Box-Index + sofortiger Sichtbarkeitsindex) auf einem Punktraster mit zwei Blickrichtungen, allen bzw. ausgeblendeten Wänden, Radien 4/10/25/2000 und Höhenfilter (> 150 Treffer). 1329 Tests grün.
- Während der Umsetzung fiel ein Endlosfall auf: Bei Koordinaten jenseits 2^53 zählt eine Zellschleife nicht weiter. Der bestehende Test mit großen Koordinaten blieb hängen; abgesichert durch den Durchlauf bei nicht sicher ganzzahligen Zellnummern.
- Node (`benchmarks/move-start-profile.ts`, Median nach Bearbeitung; Ergebnis-Hash über 3600 Abfragen vorher/nachher gleich):

| ms                               | l vorher | l nachher | x vorher | x nachher |
| -------------------------------- | -------- | --------- | -------- | --------- |
| Ecken nach Bearbeitung           | 122      | 23        | 890      | 189       |
| Ursprungsabfrage aufbauen        | 69       | 6         | 862      | 49        |
| erste Abfrage (mit Sichtbarkeit) | 0,4      | 38        | 1,4      | 476       |

- Browser-Schullauf (Produktionsbuild, je ein Lauf vorher/nachher, alle Schritte ok, Inhalt nach Wiederherstellung gleich):

| ms                                   | l vorher | l nachher | x vorher | x nachher |
| ------------------------------------ | -------- | --------- | -------- | --------- |
| Z: Bewegung starten, Ursprung wählen | 200      | 112       | 2622     | 1529      |
| Z: Achse und Vorschau +0,5 m         | 100      | 49        | 1024     | 141       |
| Summe                                | 300      | 161       | 3646     | 1670      |

## Grenzen

- Bei x bleibt der Start im Browser ≈ 1,5 s: der Sichtbarkeitsindex (≈ 0,5 s) fällt beim ersten Hovern an, dazu Ecken des geänderten Geschosses und Darstellung; nicht weiter zugeordnet.
- Sichtbarkeitsindex über den Picking-Index der 3D-Ansicht einzusparen bleibt ein eigener Auftrag (andere Trefferregeln, Fenster eingeschlossen).
- Je ein Browserlauf vorher/nachher; Node-Werte als Hauptbeleg.
