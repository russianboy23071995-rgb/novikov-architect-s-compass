# K04h: zweiter Abschnitt in gemeinsamer Zeichensitzung

08.10.2026. PR193 nach gruener CI zusammengefuehrt.

## Umsetzung

Der Pilot liegt jetzt in Application/drawing/prepared-chain-corner.ts; der
Benchmark exportiert diese Implementierung. previewWallChain verwendet den
bestehenden gemeinsamen WeakMap-Cache fuer ersten oder zweiten Kettenzustand.
Cachebindung umfasst Kettenobjekt, Vorschauobjekt, temporaere ID, Punkte und
Wand-IDs. Veraltete Modellbasis wird vor jeder Auswertung abgewiesen.

Die bestehenden begin/append/finish-Aktionen wurden unveraendert nach
wall-chain-actions.ts verschoben und aus wall-chain.ts weiter exportiert.
Dadurch koennen Vorbereitung und Vorschau dieselben Aktionen ohne zirkulaere
Imports nutzen. Keine per-Werkzeug- oder Renderer-Implementierung.

Nur der bereits belegte zweite freie rechtwinklige Abschnitt profitiert.
Fremdkontakte, Kandidaten, angeschlossene erste Wand, schraege Ziele und dritte
oder weitere Abschnitte bleiben beim Vollpfad. Platzierung bleibt appendWallChain,
Bestaetigung und History pruefen vollstaendig. Ganze Kette ein Undo. Verwerfen
entfernt den aktiven UI-Zustand; der schwache Cache publiziert nichts selbst.

## Nachweise

688 Tests bestanden, beide Typechecks, gezielter Lint und Produktionsbuild
bestanden. Bestehende Buildhinweise zu Chunkgroesse/Vite bleiben unveraendert.
Integrationstest vergleicht zweite rechte/schraege Vorschau, stale Basis, dritte
Strecke, neue Sitzung und gesamte Kette mit Undo/Redo gegen die volle Aktion.
Die fuenf Pilot-Tests verwenden weiterhin die gemeinsame Implementierung.

benchmarks/drawing-workspace.html: synthetischer DOM-Ablauf im echten CadWorkspace
mit drei Abschnitten bestanden, einschliesslich Maus/Shift, Enter, einem
Undo/Redo fuer alle drei, Escape und Werkzeugwechsel. Der Test zaehlt dargestellte
Waende; exakte Geometrie wird in den Application-Tests verglichen. Kein neuer
Hardware-/Frame-Latenznachweis und keine Abnahme des sporadischen Shift-Ruckelns.

## Praktischer Test

Wandwerkzeug: drei Seiten einer U-Form zeichnen, fuer rechte Winkel Shift nutzen,
mit Enter abschliessen. Undo entfernt die ganze Kette, Redo stellt sie wieder her.
Neue Kette beginnen und Escape oder Select waehlen: keine zusaetzliche Wand.

## Genau ein Folgeauftrag

K06a: zusammenhaengende Wandzuege und dichte T-Anschluesse mit vorhandenen Fixtures
profilieren. Groesse der betroffenen Komponente, Konturableitung und Fenster-
Zuordnung getrennt erfassen; bestehende validierte Ergebnisse als Referenz nutzen.
Erst daraus eine begrenzte gemeinsame Optimierung waehlen. Kein weiterer Cache,
Rendererwechsel oder automatische Ausweitung des K04-Piloten auf Vorrat.
