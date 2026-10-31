# Text als 2D-Werkzeug (L12, ab 31.10.2026)

Nutzervorgabe 31.10.2026: Ein Werkzeug „Text“, um in 2D zu beschriften. Schriftart, Größe, später Umrandung, Hinterlegung mit weißem Rand, Kontur; Größe wahlweise als **Papiermaß** oder **Modellmaß**, damit spätere Maßstabswechsel die erwartete Wirkung haben. Die feste Schrift der Maßkette bleibt.

| PR | Inhalt | Stand |
| --- | --- | --- |
| T1 | Element Text, Werkzeug mit Eingabefeld, Schrift, Größe Papier/Modell, Ausrichtung, Bezug, Drehung, Farbe, Ebene; Bearbeiten | erledigt |
| T2 | Fett/kursiv/unterstrichen, Hinterlegung, Umrandung, Freistellung (weißer Rand um die Buchstaben) | erledigt |

## Schriftarten und Rechte (Einordnung, keine Rechtsberatung)

- Windows-Schriften (Arial, Calibri, Segoe …) dürfen auf dem Rechner benutzt, aber nicht mit NOVIKOV ausgeliefert werden.
- Freie Schriften (SIL Open Font License, Apache: z. B. Inter, Source Sans, Roboto; Normschrift osifont nach ISO 3098, GPL mit Font-Ausnahme) dürfen mitgeliefert und später in PDFs eingebettet werden.
- Kaufschriften brauchen eine eigene Lizenz.
- T1 nutzt daher nur die **Schriftfamilien des Systems** (Serifenlos, Mit Serifen, Nicht proportional); freie Schriften werden später mit Zustimmung des Nutzers eingebunden (spätestens für den PDF-Export L14).

## Teil T1

- `src/domain/elements/text/model.ts`: `textSchema` (Schema 39) – Einfügepunkt, Inhalt (mehrzeilig), Schrift, Größe `{ unit: "paper" | "model", value }` (Papier in mm, Modell in m), Ausrichtung (links/Mitte/rechts), Bezug (unten/Mitte/oben), Drehung (Grad), Farbe. `textHeight` (Papiermaß folgt dem Ausgabemaßstab des Geschosses, Modellmaß nicht), `textBox` (Textblock für Auswahl), `convertTextSize` (beim Umschalten Papier ↔ Modell bleibt die sichtbare Größe gleich, z. B. 2,5 mm bei 1:100 → 0,25 m).
- `src/application/texts/actions.ts`: `addText`, `updateText`; Standardebene „Textelemente“ (gab es schon). Register `text` („Text“): Auswahl, Löschen, Kopieren, Ebenen.
- **Werkzeug „Text“** (Werkzeugleiste nach „Maßkette“): Klick setzt den Einfügepunkt, dort öffnet sich ein Eingabefeld – Enter neue Zeile, Strg+Enter oder daneben klicken setzt den Text, Esc bricht ab. Leiste und Einstellungsfenster mit denselben Feldern.
- Grundriss (`TextGraphic`): Zeilen mit 1,25-fachem Zeilenabstand, ausgerichtet und gedreht wie gespeichert; Auswahl über den Textblock (gestrichelt bei Auswahl).
- Gewählter Text: Leiste und Fenster (Doppelklick) mit Inhalt und allen Einstellungen, jede abgeschlossene Änderung ein Rückgängig-Schritt; On-Demand-Menü mit Bewegen (frei, X, Y), Werkzeugeigenschaften, Löschen; Pipette übernimmt alle Einstellungen außer Inhalt und Lage.
- `planDenominator` (`domain/views/scale.ts`): Ausgabemaßstab des Arbeitsgeschosses, gemeinsam für Auswahl und Darstellung.
- Dateiformat 39; 38er Dateien laden unverändert, untergeschobene Texte werden abgelehnt. Texte gehen nicht ins IFC.

Nachweis T1: 1407 Tests grün (5 neu in `src/application/texts/actions.test.ts`), Typprüfung/Lint/Architektur sauber, 14-Modell-Hash unverändert. Browser: zweizeiliger Text „Wohnen / EG 24,5 m²“ gesetzt, Leiste mit allen Werten, On-Demand-Menü, Umschalten Papier → Modell ändert die Größe nicht (0,25 m); Testtext zurückgenommen. Beim Testen hing der Dateiwächter des Dev-Servers (lieferte alte Module aus) – Neustart des Servers, kein Fehler im Code.

## Teil T2: Gestaltung

- Schema (weiter Version 39, T1 war erst kurz veröffentlicht; ältere 39er Texte sind gültig): optionale Felder `bold`, `italic`, `underline`; `background` (Farbe, Rand als Vielfaches der Schrifthöhe, Vorgabe weiß, 0,3), `frame` (Farbe, Linienstärke in mm Papier, Vorgabe schwarz, 0,25 mm), `halo` (Farbe, Breite als Vielfaches der Schrifthöhe, Vorgabe weiß, 0,15).
- Leiste und Fenster (`TextDecorationFields`): F/K/U zum Ankreuzen; **Hinterlegung**, **Umrandung**, **Freistellung** einschalten (mit Vorgaben) und färben; Umrandung mit Linienstärke 0,13–0,7 mm. Jede Wahl wirkt sofort und ist ein Rückgängig-Schritt.
- Darstellung: Hinterlegung als gefülltes Feld, Umrandung als Rahmen darum (ohne Hinterlegung mit kleinem Abstand), Freistellung als Rand um die Buchstaben (`paint-order: stroke`). Die Textbreite wird im Browser mit der echten Schrift gemessen (`text-measure.ts`, Canvas); Feld, Rahmen und Auswahl passen so zum Text. Ohne Canvas (Tests) bleibt die Schätzung.
- `textBlock` (`domain/elements/text/model.ts`): Textblock mit gemessener Breite und Rand, Unterlängen der letzten Zeile berücksichtigt.

Nachweis T2: 1409 Tests grün (2 neu), Typprüfung/Lint/Architektur sauber, 14-Modell-Hash unverändert. Browser: Text „AW 36“ auf der schwarzen Wand – fett mit weißer Hinterlegung und schwarzem Rahmen passgenau zur Textbreite; Hinterlegung aus, Freistellung an: weißer Rand um die Buchstaben; alle Schritte einzeln rückgängig, Testtext entfernt.

## Eingabefeld mit allen Einstellungen (31.10.2026)

Nutzervorgabe: Das Feld, das beim Klick auf die Zeichenfläche aufgeht, soll alles enthalten, was den Text steuert – kompakt. Das Eingabefeld (`TextEditorOverlay`) enthält jetzt unter dem Text dieselben Felder wie Leiste und Fenster: Schrift, Größe mit Papier-/Modellmaß, Ausrichtung, Bezug, Drehung, Farbe, Ebene, F/K/U, Hinterlegung, Umrandung, Freistellung jeweils mit Farbe. Der Text erscheint beim Tippen als Vorschau im Plan mit allen Einstellungen. Klicks auf die Einstellungen schließen das Feld nicht; erst Strg+Enter oder ein Klick außerhalb setzt den Text, Esc bricht ab. Hier geänderte Einstellungen bleiben Vorgabe für den nächsten Text.

Nachweis: 1409 Tests grün, Typprüfung/Lint/Architektur sauber, 14-Modell-Hash unverändert. Browser: Feld mit allen Einstellungen, Fett und Hinterlegung im Feld eingeschaltet ohne zu schließen, Vorschau live, Strg+Enter setzt; Klick daneben setzt den Text und öffnet am neuen Punkt das nächste Feld; Testtexte zurückgenommen.
