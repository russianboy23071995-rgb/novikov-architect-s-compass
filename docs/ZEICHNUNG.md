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

- **Werkzeug „Zeichnung“** in der 2D-Gruppe der Werkzeugleiste (Symbol Rahmen). Es gibt es nur in Layouts und Masterlayouts; außerhalb meldet es „Zuerst ein Layout öffnen“. Die Werkzeugeigenschaften zeigen die Auswahl **Abbild** mit allen Abbildern (Name · Maßstab); Schnitte und Ansichten sind als „(folgt)“ gesperrt (ZW4), ebenso Abbilder ohne Ausschnitt.
- **Platzieren:** Der Ausschnitt folgt als Vorschau in Papiergröße dem Mauszeiger. Ein Klick setzt seine Mitte aufs Papier; der Fang arbeitet wie bei den übrigen Werkzeugen (Papier- und Randrahmenecken, Linien, andere Zeichnungen). Die erste Zeichnung trägt ihr Abbild ins Layout ein, wenn dort noch keins gewählt ist (Zeichnungsname und Maßstab im Plankopf). Das ist ein eigener Rückgängig-Schritt.
- **Darstellung:** Die Zeichnung zeigt das Geschoss des Abbilds mit seinen Ebenen-Sichtbarkeiten, maßstäblich verkleinert (1:100 = 1 m → 10 mm) und auf die Maske beschnitten. Die Maske ist ein dünner gestrichelter Rahmen; ausgewählt wird er blau.
- **Bewegen:** Auswählen → „Element frei bewegen“, „auf X-/Y-Achse“ oder „entlang Achse“ im Bedarfsmenü (Titel „Zeichnung“, Ausschnittgröße in mm). Die Größe bleibt fest.
- **Masterlayout:** Zeichnungen des Masterlayouts liegen unter jedem Layout, das ihm folgt. Dort sind sie nicht wählbar, ihre Maskenecken fangen aber.
- **Fang:** Ecken und Kantenmitten jeder Maske, auch der Zeichnungen aus dem Masterlayout.
- Code: `CadWorkspace.tsx` (Werkzeug, Platzieren, Ansichten), `BimPlan.tsx` (`placedDrawings`), `application/drawings/sources.ts`, Hintergrund in `views/title-block-space.ts`, Fang in `snapping/project-references.ts`, Bedarfsmenü in `demand-menu.ts`.

Nachweis ZW2: 1514 Tests grün (neu: Zeichnung des Masterlayouts unter dem Layout und fangbar, eigene Maskenecken fangen; Werkzeugleiste mit „Zeichnung“), Typprüfung, Architektur, Lint, Formatierung, 14-Modell-Prüfsumme unverändert. Browser: Abbild „Grundriss 1:100“ angelegt, Layout A3 angelegt, Werkzeug gewählt, Vorschau folgt dem Mauszeiger, Klick platziert (3-m-Wand ≈ 30 mm auf dem Papier), Auswahl blau gestrichelt, „Element frei bewegen“ versetzt die Zeichnung, Layout-Einstellungen zeigen danach „Abbild: Grundriss · 1:100“, im Grundriss wird das Werkzeug mit Hinweis abgelehnt. Behoben während der Abnahme: Der Fokusrahmen des Browsers füllte bei der ausgewählten Maske die ganze Ansicht orange (jetzt `outline-none` wie bei den übrigen wählbaren Formen).

Grenzen: Ziehen mit der Maus verschiebt nicht direkt, sondern wie bei allen Elementen über das Bedarfsmenü. Maskengriffe folgen mit ZW3, Schnitte und Ansichten mit ZW4.
