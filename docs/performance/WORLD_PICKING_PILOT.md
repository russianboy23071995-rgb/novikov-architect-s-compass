# K07f: modellgebundener Picking-Gegenpilot

08.10.2026. PR203 nach erfolgreicher CI zusammengefuehrt. Produkt-Picking unveraendert.

## Ansatz

Ein unveraenderlicher raeumlicher Baum ueber Welt-Dreiecke von Waenden und
Fenster-Trefferflaechen. Medianaufteilung entlang der laengsten Boxachse, maximal
acht Dreiecke pro Blatt. Abfrage projiziert nur besuchte Boxecken mit der aktuellen
bestehenden Projektion; anschliessend werden Kandidaten in Originalreihenfolge
mit triangleDepth geprueft. Keine neue Kamera-Inverse, Ray-/Fachgeometrie oder
Treffertoleranz. Weltboxen sind um die vorhandene baryzentrische Randtoleranz und
numerische Reserve erweitert. Tiefe und Gleichstandsreihenfolge bleiben erhalten.

Index bindet Solid-/Window-Snapshotidentitaet; Kameraaenderung ist erlaubt,
Geometrie-/Sichtbarkeitswechsel invalidiert. Punkte/IDs sind kopierte Ableitungen.
Der spaetere Canvas muss weiterhin die aktuell angezeigte Projektion garantieren.
Der Pilot ist noch kein Zugriffsdienst fuer Modell oder Hover.

## Nachweise

699 Tests, Diagnose-Typecheck inklusive src, gezielter ESLint und Produktionsbuild
bestanden. Bestehende Buildwarnungen bleiben. Gegen Vollscan: Ziel und Tiefe fuer
Eck-/T-Fixtures, Kamerawinkel, Verdeckung, ausgeblendete Hosts, Vertices/Flaechen-
zentren, Randtoleranz, Tie-Reihenfolge, NaN und ungueltigen Modellkontext.

/benchmarks/world-picking.html: je 25/100/500 Waende mit Fenstern, einmaliger
Indexaufbau vor beiden Kamerawinkeln. 180 Zielvergleiche bestanden, Treffer und
Nulltreffer eingeschlossen. [Rohdaten](world-picking.json).

| Waende | Einmaliger Aufbau ms | Vollscan Median ms | Pilot Median ms | Erste Abfrage nach zweitem Winkel ms |
| --- | --- | --- | --- | --- |
| 25 | 13,6 | 0,6-1,1 | ca. 0,1 | ca. 0,1 |
| 100 | 31,7 | 3,7-3,9 | ca. 0,1 | ca. 0,1 |
| 500 | 152,8 | 18,5-19,0 | ca. 0,1 | ca. 0,1 |

500: Median 20-25 exakte Kandidatendreiecke statt kompletter Flaechensuche.
Der erste Klick nach Indexaufbau ebenfalls ca. 0,1 ms. Matrix/ProjectionState-
Erstellung liegt ausserhalb der Abfragezeit, der teure Index bleibt derselbe.
Timeraufloesung begrenzt kleine Werte. Reihenfolge Vollscan/Pilot nicht alterniert;
kein genauer globaler Speedup-Faktor. Kein GPU-/Frame- oder Speichernachweis.
Dichte ueberlagerte Geometrie kann wesentlich mehr Kandidaten liefern.

## Entscheidung und genau ein Folgeauftrag

Der Weltindex ist fuer Kamerawechsel vorzuziehen: Die vorherigen 42-57 ms
Vorbereitung je Projektion entfallen. Dafuer ist der einmalige Modellaufbau mit
153 ms relevant und darf nicht in jeder Vorschau/Pointerbewegung wiederkehren.
Ein synchroner Aufbau ist noch kein nachgewiesen fluessiger Eingabepfad.

K07g: Begrenzten gemeinsamen 3D-Trefferdienst fuer stabile Display-Geometrie
anbinden. Indexlebenszeit explizit am unveraenderlichen Geometriestand, nicht an
Kamera oder React-Render binden. Vorschau-/Modell-/Sichtbarkeitswechsel und Aufbau-
zeit sichtbar messen; fuer wechselnde Vorschauen konservativen Vollscan erhalten.
Wand-/Fenster-ID, Kontextverlust und Auswahl im Canvas vergleichen. Kein separater
Index pro Werkzeug, keine pauschale Hover-/Fusspunkt-Ausweitung ohne Vergleich.
Andere K-/V-Ziele bleiben erhalten.
