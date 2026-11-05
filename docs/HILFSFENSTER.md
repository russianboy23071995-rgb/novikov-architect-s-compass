# Hilfsfenster: On-Demand-Menü und Eingabe Winkel/Länge (31.10.2026)

Nutzervorgaben: Das On-Demand-Menü soll kleiner sein und sich die Position merken, wenn man es verschiebt – unabhängig davon, wann es geöffnet wird (P1: auch nach dem Neuladen; P2: Doppelklick auf die Titelzeile setzt zurück). Dasselbe für das Eingabefenster für Winkel und Länge; dort entfallen die Knöpfe „Übernehmen“, „Maus“, „Abbrechen“ (Enter, Tab, Esc ersetzen sie) und der Infotext (z. B. „Versatz senkrecht zur Seite“). Piktogramme für die Menüeinträge liefert der Nutzer später selbst.

- `src/components/cad/useRememberedPosition.ts`: gemeinsamer Baustein. Nach dem ersten Verschieben merkt sich das Fenster die Stelle im Browser (`novikov.demand-menu.position`, `novikov.precision-input.position`); bis dahin erscheint es am Mauszeiger. Passt die Stelle nicht ins Fenster, wird es an den Rand geschoben; die Befehlszeile bleibt frei. Doppelklick auf die Titelzeile vergisst die Stelle.
- On-Demand-Menü (`DemandMenu.tsx`): 144 statt 176 px breit, kleinere Schrift und Abstände, Einträge ohne Rahmen; jeder Eintrag mit fester Kennung `data-command` (z. B. `offset`, `move`, `point`, `stretch`, `axis`, `delete`) für die späteren Piktogramme.
- Eingabe Winkel/Länge (`PrecisionInput.tsx`): 170 statt 230 px breit, Titel „Eingabe“, nur noch die Felder; Enter übernimmt, Tab wechselt Länge ↔ Winkel, Esc bricht ab. Die Hinweise (Achse, „Winkel fixiert · leeren löst“, Mausziel, Tasten) stehen im Tooltip der Titelzeile. Ein Feld leeren entspricht dem früheren „Maus“.

Nachweis: 1374 Tests grün, Typprüfung/Lint sauber, 14-Modell-Hash unverändert.
