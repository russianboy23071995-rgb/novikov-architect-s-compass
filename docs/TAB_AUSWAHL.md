# Tab-Auswahl bei übereinanderliegenden Elementen

Nutzervorgabe (30.10.2026): Liegen unter dem Cursor mehrere Elemente übereinander (z. B. Dach, Decke und Raum, Wand und Fenster, Linie und Schraffur), erscheint ein kleines Hinweisfeld in der Größe der Fanganzeige. Tab schaltet die Vorauswahl einmal reihum weiter, das vorgewählte Element wird türkis umrandet (wichtig bei gleich benannten Elementen, die sich nur in der Form unterscheiden), ein Linksklick wählt genau dieses Element. Gilt für alle Objektarten, auch künftige. Die Werkzeugleiste bleibt unverändert.

## Ablauf

- Nur im Auswahlzustand: nicht beim Zeichnen, Platzieren, Bearbeiten, Verschieben der Ansicht oder bei der Referenzauswahl. Beim Zeichnen bleibt Tab der Wechsel Länge ↔ Winkel; in Eingabefeldern bleibt Tab unverändert.
- Ab zwei Elementen unter dem Cursor: Hinweisfeld neben dem Cursor mit allen Elementen (oberstes zuerst, Bezeichnung „Raum R-001 Wohnen“, „Fenster F7“, „Decke“), türkises Kästchen vor der Vorauswahl, Zeile „Tab: wechseln · Klick: auswählen“.
- Tab: nächstes Element, Shift+Tab: vorheriges, einmal reihum. Das vorgewählte Element bekommt eine türkise Umrandung in seiner tatsächlichen Form (Fläche leicht getönt, Linie als breiter Verlauf).
- Linksklick auf ein Element im Grundriss wählt die Vorauswahl (auch mit Strg/Cmd zum Hinzufügen). Klicks auf Griffe der Bearbeitung bleiben unberührt.
- Bewegt sich die Maus auf eine Stelle mit anderer Elementmenge, beginnt die Vorauswahl wieder oben; unter einem Element oder beim Verlassen des Grundrisses verschwindet der Hinweis; Esc blendet ihn aus.
- Ausgeblendete Ebenen zählen nicht (gleiche Formen wie die Rahmenauswahl).

## Umsetzung

- `src/rendering/viewport/selection-shapes.ts`: Grundrissform und Kurzbezeichnung **je Objektart über das Element-Register** (`PLAN_SHAPES`, `PLAN_CAPTIONS`, `PICK_RANK` als vollständige Zuordnung je `ElementKind`). Kommt eine neue Objektart ins Register, meldet die Typprüfung hier einen Fehler, bis sie Form, Bezeichnung und Rang liefert; danach kennen Tab-Auswahl und Rahmenauswahl sie automatisch. `shapesAt(shapes, punkt, toleranz)`: alle Elemente unter dem Punkt (innerhalb einer Fläche oder bis 6 Bildschirmpixel an Umriss/Linie), sortiert nach Zeichenreihenfolge (Linie, Fenster/Tür, Wand, Schraffur, Dach, Decke, Raum, Referenzbild; innerhalb einer Art das zuletzt gezeichnete zuerst).
- Nebenbefund behoben: Decken, Dächer und Räume fehlten in den Formen der Rahmenauswahl; sie sind jetzt dabei.
- `src/application/selection/cycle.ts`: Vorauswahl (`hoverCycle`, `stepCycle`, `cycleTarget`).
- `src/components/cad/useOverlapCycle.ts`: Zeigerbewegung (mit Umgrenzungsrechtecken vorgefiltert), Tab/Shift+Tab/Esc; `BimPlan.tsx`: Hinweisfeld, türkise Umrandung (#0d9488), Klick übernimmt die Vorauswahl; Grundriss-Elemente tragen `data-plan-pick`.

Grenzen: nur im Grundriss (3D ist ein eigener späterer Schritt); Elemente, die nicht im Grundriss gezeichnet werden, sind nicht dabei.

Nachweis: Test in `src/application/selection/state.test.ts` (Raum unter zwei gleichen Decken unter Dach: Dach, Decke, Decke, Raum; Wand mit Fenster; Linie über Schraffur; Toleranz am Umriss; Bezeichnungen; Tab vor/zurück, gleiche Menge behält, neue Menge beginnt oben; jede Registerart liefert eine Bezeichnung). 1368 Tests grün, 14-Modell-Hash unverändert.
