# Modellbefehle: erster Schritt zum Copiloten

Nach dem IFC-Export hat der Nutzer den erfolgreichen Import in die aktuellste bei ihm eingesetzte Archicad-Version bestätigt (30.09.2026; genaue Versionsnummer nicht erfasst). Der vereinbarte nächste Abschnitt ist KI/Sprachsteuerung.

Dieser kleine Schritt ersetzt die simulierte Befehlsvorschau durch lokale, deterministische Textbefehle. Er verwendet keinen KI-Dienst und kein Mikrofon. Freie natürliche Sprache, Sprachaufnahme, neue Bauteile per Befehl und Undo/Redo bleiben spätere Schritte.

## Testen

Wand oder Fenster auswählen, unten einen Befehl eingeben und **Befehl prüfen** drücken. Die Vorschau zeigt Bauteil-ID, bisheriges und neues Maß. Erst **Übernehmen** ändert das gemeinsame Modell und damit Grundriss, 3D, Inspector und nachfolgende IFC-Exporte. **Abbrechen** verwirft die Vorschau.

- `Wandlänge auf 6 m`
- `Setze Wandhöhe auf 3,50 m`
- `Wandstärke 360 mm`
- `Fensterbreite auf 120 cm`
- `Fensterhöhe 1,35 m`
- `Brüstungshöhe auf 0,90 m`
- `Fenster zentrieren`

Dezimalkomma und Dezimalpunkt, m/cm/mm und Groß-/Kleinschreibung werden unterstützt. Eine explizite Einheit ist erforderlich. Ein Befehl ändert jeweils eine Eigenschaft des ausgewählten Bauteils. Mehrere Anweisungen, unbekannter Text, negative/ungültige Maße, falsche Auswahl und geometrisch unzulässige Änderungen werden vollständig abgewiesen. Brüstungshöhe null ist zulässig.

Vorschauen verändern das Modell nicht. Die Übernahme prüft erneut, ob Modell und Auswahl noch zur Vorschau passen. Wandlängenänderungen erhalten Anfangspunkt und Richtung sowie die relative Fensterposition. Änderungen sind weiterhin nur für diese Sitzung gespeichert.

## Prüfung

49 automatisierte Tests einschließlich neun Befehlstests: Vorschau ohne Mutation, Zentrierung, Maßeinheiten, Fenstermaße, ungültige Geometrie und Syntax, Auswahlprüfung, veraltete Vorschau, diagonale Wände. Dazu TypeScript, gezieltes ESLint, Produktionsbuild und Browserprüfung der Bedienung.
