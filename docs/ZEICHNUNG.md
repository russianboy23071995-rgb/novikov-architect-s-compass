# 2D-Werkzeug „Zeichnung“: Abbilder auf Layouts platzieren

Nutzerauftrag 02.11.2026: Ein weiteres 2D-Werkzeug „Zeichnung“. Angeklickt bietet es alle erstellten Abbilder an; eines wird gewählt und im geöffneten Layout aufs Papier gesetzt. Dort lässt sich die Zeichnung bewegen und über eine Maske mit vier Rändern zuschneiden. Die Größe ist fest – sie wird vorher im Abbild bzw. in der Gebäudestruktur bestimmt. Ein Layout kann mehrere Zeichnungen tragen.

Entscheidungen (Empfehlungen übernommen): Maske als Rechteck mit vier Rändern; Strichstärken vorerst wie im Grundriss (papiergenau mit dem PDF-Export); die erste platzierte Zeichnung setzt das Abbild des Layouts für Zeichnungsname und Maßstab im Plankopf, sofern noch keins gewählt ist.

Reihenfolge: ZW1 Datenmodell → ZW2 Werkzeug und Darstellung → ZW3 Bearbeiten und Maskengriffe → ZW4 Schnitte und Ansichten.

## ZW1 – Datenmodell

- **Projektdatei Schema 50.** Neues Element **Zeichnung** (`drawings`) im Zeichenblatt eines Layouts oder Masterlayouts: Abbild (`documentId`), Ebene, Lage (`position`: wo die Mitte des Abbild-Ausschnitts auf dem Papier liegt, Papier-Meter 1:1) und Maske (`mask`: Rechteck relativ zur Lage, muss eine Fläche haben). Die Größe auf dem Papier ergibt sich aus Ausschnitt ÷ Maßstab (12 × 8 m bei 1:100 = 120 × 80 mm); die Anfangsmaske ist genau dieser Ausschnitt. Dateien mit Schema 49 werden übernommen.
- Zeichnungen gibt es **nur auf Layouts**: Ein Geschoss des Gebäudes und ein Plankopf tragen keine. Das Abbild muss existieren; ein platziertes Abbild lässt sich nicht löschen („Das Abbild liegt als Zeichnung auf einem Layout.“). IDs sind projektweit eindeutig.
- Im Elementregister als Art „Zeichnung“: Auswahlform ist die Maske, Rang unter Linien und Texten. Verschieben (frei, X/Y) bewegt die Lage; Maske und Größe bleiben. Punkt- und Kantenbearbeitung gibt es nicht (Maskengriffe folgen mit ZW3).
- **Aktionen** (`src/application/drawings/actions.ts`): `placeDrawing` (im Zeichenraum des Layouts, Ausschnitt und Maßstab aus dem echten Projekt), `setDrawingMask`.
- Code: `src/domain/elements/drawing/model.ts`, Schema 50 in `src/domain/project/schema.ts`, Migration in `load.ts`, Register, Verschieben in `prepared-translation.ts`, Auswahlformen in `selection-shapes.ts`, Löschsperre in `views/documents.ts`.

Nachweis ZW1: 1513 Tests grün (neu `src/application/drawings/actions.test.ts`: 120 × 80 mm aus 12 × 8 m bei 1:100, Lage der Maskenecke, nur im Layoutblatt, Dateirundlauf, Löschsperre, Ablehnung im Geschoss, Maske ändern und leere Maske abgelehnt, Rückgängig, Schema 49), Typprüfung, Architektur, Lint, Formatierung, 14-Modell-Prüfsumme unverändert. Browser: App startet unverändert. Noch keine Oberfläche (ZW2).

## ZW2 – Werkzeug und Darstellung

- **Werkzeug „Zeichnung“** in der 2D-Gruppe der Werkzeugleiste (Symbol Rahmen). Es gibt es nur in Layouts und Masterlayouts; außerhalb meldet es „Zuerst ein Layout öffnen“. Die Werkzeugeigenschaften zeigen die Auswahl **Abbild** mit allen Abbildern (Name · Maßstab); Abbilder ohne Ausschnitt sind als „(ohne Ausschnitt)“ gesperrt. Schnitte und Ansichten kamen mit ZW4 dazu.
- **Platzieren:** Der Ausschnitt folgt als Vorschau in Papiergröße dem Mauszeiger. Ein Klick setzt seine Mitte aufs Papier; der Fang arbeitet wie bei den übrigen Werkzeugen (Papier- und Randrahmenecken, Linien, andere Zeichnungen). Die erste Zeichnung trägt ihr Abbild ins Layout ein, wenn dort noch keins gewählt ist (Zeichnungsname und Maßstab im Plankopf). Das ist ein eigener Rückgängig-Schritt.
- **Darstellung:** Die Zeichnung zeigt das Geschoss des Abbilds mit seinen Ebenen-Sichtbarkeiten, maßstäblich verkleinert (1:100 = 1 m → 10 mm) und auf die Maske beschnitten. Die Maske ist ein dünner gestrichelter Rahmen; ausgewählt wird er blau.
- **Bewegen:** Auswählen → „Element frei bewegen“, „auf X-/Y-Achse“ oder „entlang Achse“ im Bedarfsmenü (Titel „Zeichnung“, Ausschnittgröße in mm). Die Größe bleibt fest.
- **Masterlayout:** Zeichnungen des Masterlayouts liegen unter jedem Layout, das ihm folgt. Dort sind sie nicht wählbar, ihre Maskenecken fangen aber.
- **Fang:** Ecken und Kantenmitten jeder Maske, auch der Zeichnungen aus dem Masterlayout.
- Code: `CadWorkspace.tsx` (Werkzeug, Platzieren, Ansichten), `BimPlan.tsx` (`placedDrawings`), `application/drawings/sources.ts`, Hintergrund in `views/title-block-space.ts`, Fang in `snapping/project-references.ts`, Bedarfsmenü in `demand-menu.ts`.

Nachweis ZW2: 1514 Tests grün (neu: Zeichnung des Masterlayouts unter dem Layout und fangbar, eigene Maskenecken fangen; Werkzeugleiste mit „Zeichnung“), Typprüfung, Architektur, Lint, Formatierung, 14-Modell-Prüfsumme unverändert. Browser: Abbild „Grundriss 1:100“ angelegt, Layout A3 angelegt, Werkzeug gewählt, Vorschau folgt dem Mauszeiger, Klick platziert (3-m-Wand ≈ 30 mm auf dem Papier), Auswahl blau gestrichelt, „Element frei bewegen“ versetzt die Zeichnung, Layout-Einstellungen zeigen danach „Abbild: Grundriss · 1:100“, im Grundriss wird das Werkzeug mit Hinweis abgelehnt. Behoben während der Abnahme: Der Fokusrahmen des Browsers füllte bei der ausgewählten Maske die ganze Ansicht orange (jetzt `outline-none` wie bei den übrigen wählbaren Formen).

Grenzen: Ziehen mit der Maus verschiebt nicht direkt, sondern wie bei allen Elementen über das Bedarfsmenü. Maskengriffe folgen mit ZW3, Schnitte und Ansichten mit ZW4.

## ZW3 – Bearbeiten und Maskengriffe

- **Randgriffe:** Eine ausgewählte Zeichnung zeigt in der Mitte jedes Maskenrands einen Griff (links, rechts, unten, oben). Ziehen verschiebt nur diesen Rand senkrecht zu ihm, mit Vorschau und Fang der Rasterengine. Lage und Maßstab bleiben, Loslassen ist ein Rückgängig-Schritt, Escape bricht das Ziehen ab.
- **Grenzen:** Die Maske bleibt mindestens 5 × 5 mm groß und reicht höchstens bis zum Ausschnitt des Abbilds („Die Maske braucht mindestens 5 × 5 mm.“ / „… höchstens bis zum Ausschnitt des Abbilds.“).
- **Fenster „Zeichnung“** (Doppelklick auf die Zeichnung oder Rechtsklick „Werkzeugeinstellungen…“) und dieselben Felder in der Werkzeugeigenschaften-Leiste, dort einzeilig (UI1):
  - Abbild mit Name und Maßstab (nur Anzeige)
  - Ebene
  - Beschnitt links/rechts/unten/oben in mm vom Rand des Ausschnitts, eintippbar (Enter oder Verlassen des Felds)
  - Angabe „Ausschnitt … × … mm von … × … mm“
  - „Maske zurücksetzen“ auf den vollen Ausschnitt
- **Vorgabenfenster des Werkzeugs** (Doppelklick auf den Werkzeugknopf, AGENTS.md): Abbild und Ebene für neue Zeichnungen, dieselben Felder wie in der Leiste. Damit hat „Zeichnung“ das in ZW2 fehlende Einstellungsfenster.
- Code: `domain/elements/drawing/model.ts` (`MASK_EDGES`, `MIN_MASK`, `maskEdgeGrip`, `dragMaskEdge`, `maskProblem`, `maskCrop`, `maskFromCrop`), `application/drawings/actions.ts` (`setDrawing` ersetzt `setDrawingMask`), Griffe in `BimPlan.tsx` (`onDrawingMask`), `DrawingFields.tsx`, Vorgaben in `useToolDefaults.ts`, Anbindung in `CadWorkspace.tsx`.

Nachweis ZW3: 1521 Tests grün (neu: Rand ziehen mit Grenze am Ausschnitt und 5 mm Abstand, Beschnitt hin und zurück, Griffmitte, Änderung im Layoutblatt mit Rückgängig, Ablehnung über den Ausschnitt und unter 5 mm). Typprüfung, Architektur, Lint, Formatierung, 14-Modell-Prüfsumme unverändert.

Browser:

- Vorgabenfenster öffnet sich; Abbild dort gewählt = Abbild in der Leiste
- Zeichnung platziert und ausgewählt, vier Griffe
- rechten Rand gezogen (22,8 mm Beschnitt), oberen Rand gezogen (12,7 mm)
- 10 mm links eingetippt: übernommen
- 500 mm rechts: abgelehnt mit Meldung, Werte bleiben
- „Maske zurücksetzen“ → 0/0/0/0, Strg+Z → wieder 115,7 × 38,3 mm von 125,7 × 51 mm
- Doppelklick öffnet „Zeichnung – Einstellungen“ mit denselben Werten

Behoben: Die Abbild-Wahl im Werkzeug sprang zurück, weil die Vorgaben das Abbild gegen den Zeichenraum des Layouts prüften, der keine Abbilder kennt.

Nicht im Browser geprüft: Escape während des Ziehens (der Testbrowser zieht in einem Zug) und das Einrasten eines Rands an einem Fangpunkt; beides läuft über dieselben Wege wie bei den Griffen der Schnittlinie.

## ZW4 – Schnitte und Ansichten

- **Abbild wählen:** Im Werkzeug „Zeichnung“ sind jetzt auch Schnitt- und Ansichts-Abbilder wählbar. Gesperrt („ohne Ausschnitt“) bleiben Grundriss-Abbilder ohne gespeicherten Ausschnitt und Schnitte oder Ansichten, die keine Bauteile sehen.
- **Ausschnitt:** Ein Schnitt hat keinen gespeicherten Kamera-Ausschnitt. Sein Ausschnitt ist die ganze Schnittzeichnung mit den Geschosskoten neben dem Rand, so wie „Einpassen“ im Schnitt-Tab sie zeigt (`sectionExtent`): die Linienlänge plus Rand für die Koten links und rechts, 1 m über und unter Bauteilen und Geschossen. Bei 1:100 wird ein 10-m-Schnitt also 100 mm breit plus Koten.
- **Darstellung:** Auf dem Layout zeichnet dieselbe Grafik wie im Schnitt-Tab (`SectionGraphic`): Ansicht dahinter, Geschosslinien mit Höhenkoten, geschnittene Bauteile in der Schnittfüllung mit Schichten, Rand an beiden Linienenden, dazu die gesetzten Höhenkoten. Beschnitt auf die Maske, Griffe, Element-Fenster und Bedarfsmenü funktionieren wie beim Grundriss. Die Zeichnung folgt jeder Modelländerung; sie wird je Projektstand einmal berechnet.
- **PDF:** Schnitte und Ansichten kommen ohne Zusatzarbeit ins PDF, wie alle übrigen Inhalte des Blatts.
- **Nebenbefund behoben:** Die Schnitt- und Ansichtssymbole des Gebäudes wurden auch auf Layouts und Planköpfen gezeichnet, im Maßstab 1:1 der Papiermeter (z. B. eine 10-m-Linie über das ganze Blatt hinaus). Sie erscheinen jetzt nur noch im Grundriss.
- **Code:** `src/components/cad/SectionGraphic.tsx` (gemeinsame Grafik, vorher Teil von `SectionDrawingView.tsx`), `src/components/cad/section-graphic.ts` (Zwischenspeicher, Ausschnitt), `sectionExtent` in `src/rendering/viewport/section-drawing.ts`, `PlacedDrawingView.content` (Grundriss oder Schnitt) in `BimPlan.tsx`, Quelle in `CadWorkspace.tsx`.

Nachweis ZW4: 1522 Tests grün (neu: Ausschnitt eines Schnitts mit Linie, Bauteilen, Geschossen und Kotenrand, ebenso ohne Bauteile). Typprüfung, Architektur, Lint, Formatierung, 14-Modell-Prüfsumme unverändert.

Browser: Raum 10 × 6 m mit 0,3-m-Wänden (2,8 m hoch), Schnitt A-A quer durch, vier Ansichten, Abbilder „Schnitt A-A“ und „Ansicht N“ (je 1:100), Layout A3.

- Beide Abbilder in der Auswahl wählbar, beide aufs Layout gesetzt
- Gemessen auf dem Papier: Schnittlinie 10 m = **100 mm**, geschnittene Wände je **3 × 28 mm**, Nordansicht-Linie 12,6 m = 126 mm, Fassade 10,3 m = 103 mm
- Schnitt ausgewählt: vier Griffe, Leiste zeigt „Abbild Schnitt A-A · 1:100“; 20 mm Beschnitt links eingetippt, die linken Koten verschwinden
- PDF „Schnitte.pdf“: A3, zwei Beschnittpfade, Wände 3 × 28 mm, Koten „±0,00 Erdgeschoss“ und „+3,00 1. Obergeschoss“ als Text; keine Linie mehr größer als das Blatt
- Schnitt-Tab nach dem Umbau unverändert

Grenzen:

- Der Ausschnitt eines Schnitts wächst mit dem Modell. Wird das Gebäude höher, verschiebt sich die Zeichnung auf dem Papier um die halbe Höhenänderung nach unten, und die gespeicherte Maske schneidet oben ab. Ein fester Ausschnitt für Schnitte wäre ein eigener Schritt.
- Gefangen werden wie beim Grundriss nur Ecken und Kanten der Maske, nicht die Linien im Schnitt.
- Ausgeblendete Ebenen des Abbilds gelten für Schnitte nicht; der Schnitt-Tab kennt sie ebenfalls nicht.
