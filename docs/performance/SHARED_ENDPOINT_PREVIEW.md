# Gemeinsame Endpunkt-Vorschau (K04c)

Stand: 08.10.2026. Aufbauend auf dem geprueften PR188-Piloten.

## Umsetzung und Sicherheitsgrenze

`src/application/direct-edit/prepared-endpoint.ts` ist die gemeinsame Application-
Implementierung; der bisherige Benchmark importiert sie nur noch. `previewEdit`
bindet die Vorbereitung per WeakMap an die EditSession und kontrolliert Basis
und Auswahl. Grundriss, 3D und numerische Eingabe nutzen den bestehenden Vertrag.
Keine zusaetzliche Fachlogik in Renderern oder pro Werkzeug.

Nur Punktbewegung des Achsendes (Index 1, identischer Ursprung) einer T-Hauptwand
kann den vorbereiteten Pfad nutzen. Exakte axiale Verlaengerung ohne Eckverbund
bleibt die enge Optimierungsgrenze. Schraegbewegung, Kuerzung, fremde Endpunkte
und geaenderte Anschlussstruktur verwenden den Vollpfad. Andere Griffe behalten
ihr bisheriges Verhalten. Bestehende Fachregeln werden wiederverwendet.

Bestaetigung verwendet ausdruecklich den vollstaendigen editAtPointer-Pfad samt
Anschlusspruefung, aktiver Sitzung und History. Vorschau erzeugt keinen Commit.
Abbruch oder eine ersetzte Sitzung koennen keine alte Bestaetigung veroeffentlichen.

## Nachweis

677 Tests bestanden, einschliesslich Vergleich mit Vollpfad, einem Undo-Schritt,
Abbruch, veralteter Modellbasis, Auswahlwechsel, ersetzter Sitzung und anderen
Griffen. Die bisherigen vier Pilot-Tests laufen durch dieselbe Implementierung.

`benchmarks/endpoint-workspace.html` rendert den echten CadWorkspace. Der Button
Maus/Shift testen sendet synthetische DOM-Ereignisse durch die UI. Zwei Laeufe:
T-Paar mit Fenstern und freie Waende (`?free`). Beide PASS: Griffauswahl,
Shift-Vorschau, Abbruch ohne Modellveraenderung, Klick-Platzierung, Undo/Redo,
3D/2D-Wechsel. SVG-Achskoordinaten werden geprueft; keine direkte Modellmutation
im Testtreiber. Die Diagnose ist kein Produktions-Bedienelement.

Grenze: synthetische Ereignisse belegen keine Hardware-Eingabelatenz oder
Bildrate. Das zuvor sporadisch berichtete Shift-Ruckeln ist nicht als behoben
abgenommen. Die Pilot-Zeitmessungen werden nicht als neue UI-Messung ausgegeben.

## Praktische Abnahme

T-Hauptwand waehlen, Achsende greifen, Punkt frei bewegen. In Achsrichtung
verlaengern, Shift halten und Maus seitlich wegbewegen. Vorschau kontrollieren,
einmal abbrechen, erneut bewegen und per Klick platzieren. Undo und Redo testen.
Fenster und Nebenwand muessen die bestehenden Regeln behalten. Danach eine
schraege Bewegung und Kuerzung als unveraenderten Vollpfad pruefen.

## Naechster Auftrag

K04d: Wandzeichnen-/Wandketten-Vorschau bei 100/1.000 Elementen profilieren,
Phasen trennen und erst daraus den naechsten begrenzten Optimierungsschritt
ableiten. Weitere Funktionen und Anforderungen bleiben im Entwicklungsplan.
