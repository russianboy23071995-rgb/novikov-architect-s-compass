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
