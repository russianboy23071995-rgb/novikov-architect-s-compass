# Dachtrimmung je Prüfung (03.11.2026)

Korrektur 4 aus dem Gesamtnachweis (docs/performance/GESAMTNACHWEIS_2026-11.md): 25 ms je Prüfung bei 800 getrimmten Wänden. Freigabe der Änderungskarte durch den Nutzer am 03.11.2026.

## Befund

- `resolveRoofTrims` läuft bei jeder Prüfung, also bei jeder Bearbeitung in jedem Geschoss. Dabei rechnet es alle Trimmungen neu.
- Der größte Teil der Zeit ist `checkOpenings`: Für jede getrimmte Wand wurden alle Fenster und Türen des Geschosses durchsucht. Bei 20 000 Elementen sind das 800 Wände × 400 Fenster.
- `resolveBoundWallHeights` läuft vor der Trimmung und legte jedes Geschoss neu an, auch ohne Änderung. Ein unverändertes Geschoss kam deshalb nie als dasselbe Objekt bei der Trimmung an.

## Umsetzung

- **Öffnungen je Wand vorab zuordnen:** Fenster und Türen eines Geschosses werden einmal nach Wand gruppiert (`domain/elements/wall/roof-trim.ts`). Die Reihenfolge bleibt gleich: erst die Fenster, dann die Türen. Die Fehlermeldungen bleiben deshalb wörtlich gleich.
- **Unveränderte Geschosse überspringen:** Für jedes getrimmte Geschoss wird gemerkt, woraus es berechnet wurde:
  - das Geschossobjekt (Wände, Fenster, Türen),
  - seine Höhenlage,
  - jedes Dach, an dem seine Wände getrimmt sind, mit dessen Höhenlage.

  Stimmt das alles beim nächsten Mal überein, wird das Ergebnis übernommen. Gemerkt wird nur ein erfolgreiches Ergebnis. Owned Snapshots melden ihre eingefrorenen Geschosse an (`rememberRoofTrims`), denn genau diese Objekte kommen bei der nächsten Prüfung wieder herein. Ändert sich an keiner Wand etwas, bleibt das Geschossobjekt dasselbe.

- **Geschosshöhen-Bindung** (`height-binding.ts`): Geschosse und Wände, deren Höhe gleich bleibt, behalten ihre Identität.

## Ergebnis (Node, Gesamtmodell, Median aus 15)

Rohdaten: `roof-trim/before.json`, `roof-trim/after.json`.

| Modell | getrimmte Wände | Trimmung, Geschoss neu vorher → nachher | Trimmung, Geschoss unverändert | Wandänderung anderes Geschoss | Wandänderung Dachgeschoss |
| ------ | --------------- | --------------------------------------- | ------------------------------ | ----------------------------- | ------------------------- |
| 3 000  | 120             | 0,80 → 0,69 ms                          | 0,82 → 0,12 ms                 | 12,0 → 11,0 ms                | 12,6 → 15,4 ms            |
| 10 000 | 400             | 6,83 → 1,17 ms                          | 6,53 → 0,26 ms                 | 43,2 → 36,1 ms                | 45,7 → 42,1 ms            |
| 20 000 | 800             | 27,05 → 1,94 ms                         | 26,65 → 0,52 ms                | 86,1 → 62,7 ms                | 78,7 → 75,1 ms            |

- **Abnahme:**
  - Höchstens 5 ms nach einer Änderung im Dachgeschoss: erfüllt mit 1,9 ms.
  - Nahezu 0 ms nach einer Änderung in einem anderen Geschoss: 0,5 ms. Übrig bleiben die Höhenlagen und die Suche nach getrimmten Wänden.
- **Wandänderung im Dachgeschoss:** Dort wird weiter neu getrimmt. Die übrige Prüfung des geänderten Geschosses überwiegt.
- **Kleines Modell (3 000):** Die Messwerte schwanken stark. In je drei weiteren Läufen lag die Wandänderung im Dachgeschoss vorher bei 12,6–17,1 ms und nachher bei 13,6–21,1 ms. Die Bereiche überlappen; ein Gewinn ist dort nicht belegt. Die Trimmung selbst sank von 0,9 auf 0,5 ms.

## Nachweis

- **`benchmarks/roof-trim.test.ts`, erster Test:** Am Gesamtmodell werden nacheinander geändert:
  - eine Wand im Dachgeschoss,
  - die Dachhöhe,
  - die Höhe eines Geschosses darunter,
  - eine Wand in einem anderen Geschoss.

  Nur beim letzten Schritt wird die Trimmung übernommen. Nach jedem Schritt ist der Stand gleich einer vollen Prüfung ohne Wiederverwendung. Ohne Änderung kommt dasselbe Geschossobjekt zurück.

- **Zweiter Test:** Ein schon berechnetes Dachgeschoss wird trotzdem abgelehnt, wenn ein Fenster über die Dachfläche ragt, das Dach fehlt oder die Dachfläche unter dem Wandfuß liegt.
- **Prüfungen:**
  - 1550 Tests grün,
  - Typprüfung, Lint, Architekturprüfung ohne Befund,
  - 14-Modell-Hash `e42aa36e…` unverändert.
- **Browser** (Gesamtmodell 3 000, Geschoss 4):
  - Brüstung eines Fensters auf 2 m gesetzt. Abgelehnt mit „Fenster s4-win0 ragt über die Dachfläche; so kann die Wand s4-a0 nicht getrimmt werden.“
  - Danach 1 m: übernommen, keine Konsolenfehler.

## Grenzen

- Ein Rechner, Node; je Größe ein Lauf, beim kleinen Modell weitere drei.
- **Wiederverwendung im Merkspeicher:** Der Merkspeicher setzt voraus, dass gemerkte Geschoss- und Dachobjekte nicht verändert werden. Das gilt für owned Snapshots, die eingefroren sind. Eine Prüfung ohne owned Snapshot bekommt frisch gelesene Objekte und findet deshalb nichts Gemerktes.
