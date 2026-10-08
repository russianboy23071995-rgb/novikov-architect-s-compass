# K07g: gemeinsamer Trefferdienst fuer stabile 3D-Geometrie

Stand: 08.10.2026. PR204 nach erfolgreicher CI zusammengefuehrt.

## Umsetzung und Grenze

BimSolidView verwendet den gemeinsamen World-Picking-Dienst aus
`src/rendering/viewport`. Der Weltindex gehoert zur unveraenderlichen angezeigten
Geometrie inklusive sichtbarer Fenster. Kamera- und Auswahlwechsel behalten ihn.
Geometrie-/Sichtbarkeitswechsel beenden die alte Vorbereitung. Der Hook besitzt
nur den Lebenszyklus; Geometriepruefung und Fachaktionen bleiben unveraendert.
Der bisherige Vollscan bleibt waehrend Aufbau, Vorschau und bei Kontextabweichung
aktiv. Bestehende Fuss-/Achspunktprioritaeten vor dem Flaechentreffer bleiben bestehen.

Der Generator sammelt Dreiecke und partitioniert nach der Mitte der laengsten
Boxachse. Er gibt in kleinen Schritten Kontrolle ab. Der Scheduler prueft nach
jeweils 128 Schritten ein 4-ms-Budget; es ist keine harte Echtzeitgarantie.
Kamerawechsel bauen weder Weltindex noch Dreiecke erneut auf. Abbruch verwirft
Generator und Index und storniert geplante Arbeit. Fehler fallen auf Vollscan zurueck.
Die bisherige Diagnose importiert denselben Produktionscode statt einer Kopie.

## Nachweis

- 700 Tests bestanden, darunter Kontextabweichung, Kamerawechsel ohne Neuaufbau,
  verteilte Vorbereitung und Abbruch geplanter Arbeit.
- Typecheck einschliesslich Benchmark und Produktionscode, gezielter ESLint und
  Produktionsbuild bestanden. Bekannte Build-Warnungen zu Chunks/Pfaden bleiben.
- 180 Browser-Treffervergleiche gegen Vollscan bestanden: 25/100/500 Waende,
  jeweils zwei Kamerawinkel. Rohdaten: [shared-picking.json](shared-picking.json).
- Im echten Workspace per Canvas-Klick Wand wall-0 und Fenster window-wall-0
  ausgewaehlt; Eigenschaften und Navigator zeigten jeweils das richtige Element.

| Waende | Bereit nach (Wandzeit) | Arbeitsschritte | Groesster Schritt |
| --- | --- | --- | --- |
| 25 | 43,5 ms | 8 | 4,1 ms |
| 100 | 220,1 ms | 28 | 4,2 ms |
| 500 | 1007,7 ms | 120 | 4,3 ms |

Abfragen nach Vorbereitung liegen im Test bei etwa 0,1 ms. Verteilung verlaengert
bewusst die Zeit bis zur Bereitschaft gegenueber dem synchronen Pilotaufbau.
Bis dahin koennen Klicks weiterhin die Kosten des alten Vollscans verursachen.
Keine Aussage ueber Gesamt-FPS, Speichergrenzen oder alle dichten Geometrien.
Fuss-/Hoverabfragen sind nicht durch diesen Schritt beschleunigt. Das Feld
`tested` im Dienst-Benchmark ist ein Platzhalter (0), keine Kandidatenmessung.

## Praktische Abnahme

In 3D eine Wand und ein Fenster direkt anklicken, Ansicht drehen/zoomen und erneut
anklicken. Ebene ausblenden/wiederherstellen und eine Wand aendern/Undo verwenden:
Es duerfen keine unsichtbaren oder veralteten Elemente ausgewaehlt werden.
Die automatisierte Dienstpruefung deckt Invalidierung ab; die direkte Canvas-
Abnahme dieses Schritts pruefte Wand und Fenster, nicht jeden dieser Bedienablaeufe.

## Naechster begrenzter Auftrag

V01a: temporaeres Punkt-zu-Punkt-Messen in 2D mit vorhandener gemeinsamer
Fang-/Interaktionsinfrastruktur. Ergebnis in Metern, kein Modellelement und kein
Undo-Eintrag. Escape/Ansichtswechsel beenden die Messung. Flaechen, Winkel und
persistente Massketten bleiben Folgeumfang. Offene Leistungsgrenzen bleiben
im Backlog; K07g ist keine pauschale Skalierbarkeitsfreigabe.
