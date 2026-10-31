# Einstellungsfenster für jedes Werkzeug (E1, E2)

Nutzervorgabe (31.10.2026): Jedes Werkzeug bekommt ein eigenes Einstellungsfenster mit allen Einstellungen, die es dafür gibt. Die Leiste oben bleibt für häufig geänderte Einstellungen; im Fenster kommen später viel mehr Einstellungen hinzu. Doppelklick auf eine Wand, ein Fenster usw. öffnet das Fenster für genau dieses Element. Regel in `AGENTS.md`. Entscheidungen Z1–Z4 wie empfohlen.

## E1 (umgesetzt)

- `src/components/cad/ToolSettingsWindow.tsx`: gemeinsamer Fensterrahmen (verschiebbares Fenster, Abschnitte links, Kopfzeile sagt, was bearbeitet wird).
- **Vorgaben-Modus:** Doppelklick auf einen Werkzeugknopf. Wand, Fenster und Tür öffnen das gemeinsame Fenster mit denselben Feldbausteinen wie die Leiste (`toolFields`): Fenster und Leiste zeigen und ändern dieselben Werte. Dach und Raum öffnen ihre vorhandenen Fenster. Decke, Linie, Schraffur folgen in E2.
- **Element-Modus:** Doppelklick auf ein Element im Grundriss oder in 3D im Auswahlzustand (Z4: beim Zeichnen/Platzieren beendet der Doppelklick wie bisher). Das Element wird ausgewählt (auch geschossübergreifend), das Fenster zeigt alle Eigenschaften dieses Elements (dieselbe Eigenschaftsanzeige wie die Leiste, `BimInspector`) und den Abschnitt „Ebene“. Jede Änderung wirkt sofort und ist ein Undo-Schritt (Z1). Gilt für alle Objektarten. Genau ein Element (Z2).
- Im Grundriss wird das Element beim Doppelklick geometrisch unter dem Mauszeiger ermittelt (wie bei der Tab-Auswahl), weil Achse und Griffe einer gewählten Wand obenauf liegen; eine Tab-Vorauswahl hat Vorrang.
- Rechtsklick „Werkzeugeinstellungen…“ (Z3): auf einem Element dessen Fenster, im Leeren das Vorgabenfenster des aktiven Werkzeugs.

Grenzen E1: Die Element-Abschnitte übernehmen die vorhandene Eigenschaftsanzeige unverändert (einzelne Beschriftungen noch englisch, z. B. „Width (m)“); feinere Gliederung in Abschnitte wächst mit neuen Einstellungen. Vorgabenfenster für Decke, Linie, Schraffur in E2.

Nachweis: 1374 Tests grün (reine Bedienänderung, Modell unverändert), 14-Modell-Hash unverändert. Browser-Abnahme (31.10.2026, Raum-Prüfhaus): Doppelklick auf Wand eg-w2 öffnet „Wand – Einstellungen“ (Abschnitte Wand, Ebene); Wandhöhe im Fenster auf 2,6 → Leiste und Fenster 2,6, Undo → 2,8. Doppelklick auf Fenster eg-f1 öffnet „Fenster – Einstellungen“ (Nummer, Breite, Höhe, Brüstung, Position). Doppelklick auf den Werkzeugknopf Wand öffnet die Vorgaben (Wandstärke, Wandhöhe, Achslage, Körperversatz, Ebene); Wandstärke im Fenster 0,24 → auch in der Leiste 0,24. In 3D öffnet der Doppelklick das Fenster der getroffenen Wand bzw. des Fensters im OG. Keine Konsolenfehler.

## E2 (umgesetzt, 31.10.2026, mit Nutzerrückmeldung)

- Doppelklick auf die Knöpfe Decke, Schraffur und Linie öffnet das Vorgabenfenster mit denselben Feldern wie die Leiste (`toolFields`; Zeichenfortschritt und „Zeichnen abbrechen“ nur in der Leiste).
- **Immer nur ein Einstellungsfenster** (Nutzerwunsch): Auch Dach und Raum laufen über denselben Fensterzustand wie alle anderen; ein neues Fenster ersetzt das vorige. Alle Fenster öffnen an derselben Stelle in derselben Größe (`SETTINGS_WINDOW`, 760 × 460, auch für „Höhenlinien bearbeiten“) und heißen einheitlich „… – Einstellungen“.
- Werkzeugleiste neu geordnet (Nutzervorgabe): Auswahl, Wand, Fenster, Tür, Decke, Dach, Raum, Linie, danach Schraffur. Tooltip „Doppelklick: Einstellungen“ bei allen Werkzeugen mit Fenster.
- Nebenbei: kaputte Pfeile im Winkel-Messhinweis repariert („Schenkelpunkt → Scheitel → Schenkelpunkt“).

Grenze: Das Unterfenster „Höhenlinien bearbeiten“ aus den Raum-Eigenschaften ist noch ein eigenes Fenster neben dem Fensterplatz.

Browser-Prüfung (31.10.2026, im offenen Fenster des Nutzers ohne Neuladen): Doppelklick nacheinander auf Dach, Raum, Fenster, Tür, Schraffur, Decke, Linie, Wand – jeweils genau ein Fenster offen, alle an derselben Stelle (120/140) mit 760 × 460; Leistenreihenfolge Select, Wall, Fenster, Tür, Decke, Dach, Raum, Line, Schraffur. Keine Konsolenfehler. 1374 Tests grün.
