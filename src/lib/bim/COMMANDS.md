# Modellbefehle: erster Schritt zum Copiloten

Nach dem IFC-Export hat der Nutzer den erfolgreichen Import in die aktuellste bei ihm eingesetzte Archicad-Version bestätigt (30.09.2026; genaue Versionsnummer nicht erfasst). Der vereinbarte nächste Abschnitt ist KI/Sprachsteuerung.

Dieser kleine Schritt ersetzt die simulierte Befehlsvorschau durch lokale, deterministische Textbefehle. Er verwendet keinen KI-Dienst. Optionale browserbasierte Spracheingabe ist inzwischen ergänzt (siehe unten). Freie natürliche Sprache, neue Bauteile per Befehl und Undo/Redo bleiben spätere Schritte.

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

## Spracheingabe

Ein Bauteil im 2D-Grundriss oder Navigator auswählen, dann das Mikrofon unten anklicken. Beispiel: **Wandlänge auf sechs Meter** oder **Wandhöhe auf drei Komma fünf Meter**. Das Ergebnis wird als editierbarer Text mit derselben Modellvorschau angezeigt; erst **Übernehmen** ändert das Bauteil. Es gibt keine automatische Ausführung und keine freie KI-Interpretation.

Die beim Start ausgewählte stabile ID ist der Bezug. Modell- oder Auswahlwechsel und das Schließen der Befehlsleiste brechen die Aufnahme ab; verspätete Ergebnisse werden ignoriert. Ohne Auswahl startet keine Aufnahme. Die Aufnahme endet nach einem Ergebnis oder spätestens nach 20 Sekunden und kann jederzeit über denselben Mikrofonknopf abgebrochen werden.

Die Browser-API SpeechRecognition/webkitSpeechRecognition ist optional und nicht in allen Browsern verfügbar. Bei fehlender Unterstützung bleibt das Mikrofon deaktiviert und Text bleibt nutzbar. Browserberechtigung, Mikrofonhardware und gegebenenfalls Internetzugriff auf den Erkennungsdienst sind erforderlich. Der Browser kann Audiodaten an seinen Dienst übertragen; darauf wird vor dem Start sichtbar hingewiesen. Die App speichert keine Audiodateien. Quelle: https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition

Erkanntes Deutsch wird begrenzt normalisiert: Meter/Zentimeter/Millimeter, einfache Zahlwörter null bis zwölf und Dezimalkomma. Komplexe Zahlwörter und freie Formulierungen bleiben außerhalb dieses Schritts. Fehlerhaften Text vor der erneuten Prüfung korrigieren.

57 Tests bestehen, darunter acht zusätzliche Tests mit einem simulierten Erkennungsadapter für Endergebnis, Abbruch, verspätete Antworten, Berechtigungs-/Netzwerkfehler, Zeitlimit und eindeutige Auswahl bei 301 Wänden. Das ersetzt keinen erfolgreichen Test mit realem Mikrofon und Browserdienst. Wände können inzwischen auch direkt in 3D ausgewählt werden; für Fenster dort den Navigator verwenden.

Browserprüfung dieses Schritts: Nach vollständigem Laden erkennt der integrierte Testbrowser die SpeechRecognition-API. Der Mikrofonknopf und der sichtbare Hinweis wurden geprüft; ein Textbefehl auf das ausgewählte Fenster änderte dessen Breite von 1,20 auf 1,40 m. Ein Live-Mikrofontest in einem unterstützten Browser steht aus.
