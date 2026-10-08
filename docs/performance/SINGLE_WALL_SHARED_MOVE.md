# K06d: Einzelwand nutzt gemeinsame Auswahlbewegung

08.10.2026. PR197 nach erfolgreicher CI zusammengefuehrt.

## Umsetzung

Element frei bewegen fuer eine einzelne Wand im Grundriss startet jetzt den
vorhandenen useSelectionMove-Adapter. Dieser akzeptiert optional einen bereits
gewaehlten Ursprung. Ohne Vorgabe bleibt seine bisherige Ursprungsauswahl erhalten.
Der Einzelwandaufruf reicht den angeklickten Punkt oder den bisherigen editAnchor
weiter. Fanghilfen, Shift, Laenge/Winkel und Kontextbindung laufen damit ueber
bestehende gemeinsame ToolInteraction und SelectionMove. Kein zweiter Algorithmus.
Platzierung behaelt vollstaendige Validierung und genau einen Undo-Schritt.

Die K06c-Optimierung ist dadurch auch ueber diesen 2D-Einzelwandbefehl erreichbar.
Ihre engen Geometriebedingungen und der konservative Fallback bleiben erhalten.
3D-Direct-Edit und andere Bearbeitungsaktionen bleiben unveraendert. Kein neuer
Performancegewinn gemessen; K06c-Messwerte sind kein Nachweis kompletter Framezeit.

## Nachweis

694 Tests bestanden. Neuer Vergleich gegen den bisherigen editAtPointer-Pfad
prueft Eckketten/T-Verbindungen mit Fenstern, verschiedene Urspruenge und veraltete
Basis. Beide Typechecks, gezielter Lint und Produktionsbuild erfolgreich.
Bestehende Vite-/Chunkwarnungen bleiben.

Browserdiagnose chain-move-workspace: Einzelwand mit gewaehltem Achsanfang,
Shift-Vorschau, Abbruch, Klickplatzierung, ein Undo/Redo und 3D/2D-Wechsel bestanden.
Synthetische DOM-Ereignisse, keine gemessene Hardware-Eingabelatenz. Der erste
Testklick ohne Koordinaten hatte einen falschen Ursprung simuliert; der Treiber
waehlt jetzt ausdruecklich den Achsanfang. Kein Produktfehler daraus abgeleitet.

## Praktischer Test

Eine einzelne Endwand einer verbundenen Eckkette anklicken, Achsanfang waehlen,
Element frei bewegen. Maus bewegen, Shift halten, seitlich weiterfahren und
platzieren. Die Richtung bleibt fixiert. Undo stellt Wand und Anschluss wieder her.
Danach Laenge/Winkel im gemeinsamen Hilfseingabefenster ausprobieren.

## Genau ein Folgeauftrag

K07a: Bestehenden 3D-Pfad mit Kamera, Picking und mehreren Ansichten profilieren.
Geometrieableitung, Projektion, Pufferaktualisierung und Picking getrennt messen;
Vergleichsgeometrie und IDs sichern. Erst danach einen begrenzten Engpass waehlen.
Kein Rendererwechsel und keine weitere Cache-Implementierung auf Verdacht.
