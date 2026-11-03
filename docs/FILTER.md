# Filter (L45, 03.11.2026)

Nutzerwunsch (02.11.2026): „Filter funktioniert z. B. so: wähle alles aus, was blau ist, oder alles was Innenwand ist, oder alles was mit einer gewissen Linie gezeichnet wurde. Dies ist aber kein Werkzeug, sondern eine Funktion.“ Entscheidung (03.11.2026): nur im Grundriss, im Schnitt und in der Ansicht.

## Verhalten

- **Aufruf:** Knopf „Filter“ (Trichter) in der oberen Leiste neben „Messen“. Das Fenster ist ein frei verschiebbares Hilfsfenster und bleibt offen, während man die Ansicht wechselt.
- **Kriterien:** Elementart, Ebene (z. B. Innenwand), Farbe, Linienart, Stiftbreite. Angeboten werden nur Werte, die im Bereich vorkommen, jeweils mit Anzahl. Innerhalb eines Kriteriums genügt einer der angekreuzten Werte; mehrere Kriterien müssen alle zutreffen. Ein Kriterium ohne Haken gilt nicht.
- **Bereich:** im Grundriss „Aktuelles Geschoss“ oder „Alle Geschosse“; im Schnitt bzw. in der Ansicht die Elemente, die diese Zeichnung zeigt (geschnitten oder dahinter sichtbar).
- **Ergebnis:** „Auswahl ersetzen“, „Hinzufügen“ oder „Entfernen“; die Zeile darunter zeigt laufend die Treffer und wie viele danach ausgewählt sind. „Auswählen“ übernimmt.
- **Kein Werkzeug:** Der Filter ändert nur die Auswahl, nie das Modell; er ist kein Rückgängig-Schritt. Ausgeblendete Ebenen bleiben draußen wie bei jeder Auswahl.
- **Im Layout und in 3D** zeigt das Fenster „Der Filter wirkt nur im Grundriss, Schnitt oder Ansicht.“
- **Strg+A** wählt im Grundriss alle sichtbaren Elemente des aktuellen Geschosses.
- **Kontextmenü „Ähnliche auswählen“** (nur Grundriss): Elemente derselben Art und Ebene im aktuellen Geschoss, bei Elementen mit eigener Farbe zusätzlich derselben Farbe.
- **Schnitt und Ansicht** zeigen ausgewählte Elemente türkis: geschnittene Teile gefüllt, Teile dahinter mit Kanten und heller Fläche.

## Umsetzung

- `src/application/selection/filter.ts`: `filterElements`, `filterOptions`, `applyFilter`, `similarCriteria` – reine Funktionen über dem Modell; Tests in `filter.test.ts`.
- `src/rendering/viewport/section-drawing.ts`: jede sichtbare Fläche (`SectionView`) trägt jetzt die ID ihres Elements; `sectionShownIds` liefert alle IDs einer Zeichnung. Die Geometrie bleibt gleich (14-Modell-Hash `e42aa36e…` unverändert).
- `src/components/cad/SectionGraphic.tsx`: `selectedIds` färbt ausgewählte Teile; auch auf Layouts nutzbar, dort derzeit nicht gesetzt.
- `src/components/cad/FilterWindow.tsx`, Anbindung in `CadWorkspace.tsx` und `TopToolbar.tsx`.

## Grenzen

- **Farbe** haben in Stufe 1 nur Elemente mit eigener Farbe: Linien, Schraffuren (Füllung und sichtbare Kontur) und Texte. Wände, Decken usw. bekommen ihre Farbe über Material bzw. Wandaufbau; „alle blauen Wände“ wäre eine zweite Stufe.
- **Linienart und Stiftbreite** gibt es nur bei Linien.
- **„Sichtbar in diesem Schnitt“** heißt: in der Zeichnung enthalten. Teile, die ganz hinter anderen liegen (z. B. Innenwände hinter der Südfassade), zählen mit, weil die Zeichnung nicht prüft, was verdeckt ist.
- Ein Fenster ohne eingesetztes Fensterelement ist nur eine Öffnung in der Wand und erscheint in Schnitt und Ansicht nicht als eigenes Element.
- Im Schnitt kann man Bauteile weiterhin nicht anklicken; Auswahl dort nur über den Filter. Filtervorlagen werden nicht gespeichert.

## Nachweis

1528 Tests grün, Typprüfung, Architekturprüfung und Lint sauber, 14-Modell-Hash unverändert. Browser (Testprojekt mit 6 Wänden, Fenster, 4 Linien, Schnitt A-A und vier Ansichten):

- Grundriss, Ebene Innenwand: genau die beiden Innenwände ausgewählt; im Schnitt A-A beide türkis (die geschnittene gefüllt, die dahinter flächig).
- Südansicht, Ebene Außenwand: die vier Außenwände türkis.
- Farbe #2563eb: die zwei blauen Linien; Gestrichelt: die zwei gestrichelten; Hinzufügen 0,25 mm: vier Linien; Entfernen #dc2626: drei.
- Strg+A: alle 11 Elemente; „Ähnliche auswählen“ auf einer Innenwand: beide Innenwände.
- 3D-Tab: Fenster zeigt den Sperrhinweis. Im Layout nicht im Browser geprüft (gleicher Zweig im Code).
