# V06b: Gemeinsame Werkzeugvorgabenuebernahme

Stand 08.10.2026. Ersetzt den V06a-Entwurf nach ausdruecklicher Nutzerpraezisierung.

## Verbindlicher Ablauf

Schneller Doppelt-Rechtsklick auf ein sichtbares Element aktiviert sein Werkzeug
und uebernimmt dessen Erstellungswerte einschliesslich Ebene. Kein eigener Button,
kein Menuebefehl. Vorgaben sind vor dem Zeichnen in Werkzeugeigenschaften editierbar.
ID, Geometrie und Verbindungen werden nicht kopiert. Quelle und History bleiben
bei der Uebernahme unveraendert. Erst neue Geometrie erzeugt einen Modell-Undo-Schritt.

## Umsetzung und Grenzen

- application/input/double-secondary.ts: gemeinsame Geste (450 ms, 6 CSS-Pixel;
  technische Parameter). Gleiches Element und gleicher Interaktionskontext;
  andere Klicks/Tastatur, Kontextwechsel und gesperrte Bearbeitungen verwerfen.
- application/tools/pickup.ts: stabile Ziel-ID und aktuelle Sichtbarkeit pruefen;
  explizite eigene Werte-Kopie. Erster Adapter Schraffur. Kein pauschales Entity-Spread.
- useToolDefaults: sitzungsbezogener UI-Zustand, getrennt von Modell und History.
  Geloeschte Zielebene faellt auf Projektvorgabe zurueck.
- Schraffur: Fill, Hintergrund, Kontur UND Ebene. Alle vier Modi speisen createDrawing
  und previewHatch. Alte Aufrufer ohne zusaetzliche Werte behalten die bisherigen Defaults.
- PlanSceneRun/BimPlan verbinden die gemeinsame Geste mit dem Application-Adapter.
  Waehrend laufender Zeichnung, Platzierung, Direct Edit, Referenzauswahl und Pan
  keine Uebernahme. Ein inaktives Zeichnungswerkzeug ohne ersten Punkt erlaubt sie.
- Nur 2D-Schraffuren sind in diesem Piloten angeschlossen. Waende, Fenster, Linien
  und spaetere Elemente bekommen deklarierte Adapter, keine kopierte Bedienlogik.
  Kein Preset-Katalog, Dateiformatwechsel oder separate AI-Modelllogik.

## Nachweis

715 Tests bestanden. Neue Tests pruefen eigene Werte-Kopie, abweichende Quell-Ebene,
alle vier Konturkonstruktionen mit identischen Vorgaben, neue IDs, ein Undo beim
Zeichnen, keine Quellaenderung sowie veraltete/verdeckte/geloeschte/falsche Ziele.
Geste: Zeit, Entfernung, Ziel, Kontext und Reset. Typecheck, gezielter Lint und Build.
Browser: Schraffur mit 63 % Deckkraft, Kontur und Innenwand-Ebene erstellt;
Vorgaben auf 20 %/2D-Zeichnungen geaendert; Doppelt-Rechtsklick stellt 63 %,
Kontur und Innenwand wieder her und aktiviert Schraffur. Praktische Nutzerabnahme
bleibt offen; keine pauschale Freigabe fuer noch nicht angebundene Elemente.

## Naechster begrenzter Auftrag

V06c Fenster an dieselbe Uebernahmegrenze anbinden: Breite, Hoehe, Bruestung,
Ebene. Keine Host-ID/Position. Gemeinsame Platzierung und Validierung beibehalten.
