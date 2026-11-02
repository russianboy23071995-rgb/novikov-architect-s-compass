# Plankopfplaner (L13, Teil 2)

Nutzerauftrag 02.11.2026: Ein Plankopfplaner, aufrufbar über das Layoutbuch (Reiter „Layouts“) oder über **Organisation**. Er öffnet ein Zeichenfenster wie ein Layout, mit einem Blatt A4, A3 … als Unterlage zur Größeneinschätzung. Darin wird mit allen vorhandenen Werkzeugen gezeichnet: Rahmen, Titel, Texte. Automatische Texte folgen im nächsten Schritt; zuerst den Rahmen zeichnen und speichern. Der Planer bekommt einen eigenen Tab „Plankopfplaner“. Später verwendet das Layout den Plankopf.

Entscheidungen (Empfehlungen übernommen):

1. Ein Plankopf ist ein eigener 2D-Zeichenraum im Projekt, nicht Teil des Gebäudes. Im Tab arbeiten die vorhandenen Werkzeuge auf ihm (Umleitung), gezeichnet wird 1:1 in Papiergröße.
2. Bezugspunkt: die rechte untere Ecke des Plankopfs liegt auf der rechten unteren Ecke des Randrahmens der Unterlage.
3. Längen werden wie gewohnt in m eingegeben (0,18 für 18 cm).
4. Beliebig viele Planköpfe; „Organisation → Plankopfplaner“ öffnet den zuletzt bearbeiteten bzw. legt „Plankopf“ an.

Reihenfolge: PK1 Datenmodell → PK2 Zeichenraum mit Werkzeug-Umleitung → PK3 Tab, Unterlage, Aufruf.

## PK1 – Datenmodell

- **Projektdatei Schema 45.** Neu am Projekt (optional): `titleBlocks`, je Plankopf Name (eindeutig), Unterlage (`sheet`, wie bei Layouts: DIN A0–A5 oder frei, hoch/quer, Ränder) und ein **Zeichenblatt** in Geschossform (`storey`, dessen ID die Plankopf-ID ist). Dateien mit Schema 44 werden beim Öffnen übernommen; Planköpfe in einer Datei mit Schema 44 werden abgelehnt. Projekte ohne Plankopf behalten ihre Datei.
- Das Zeichenblatt enthält nur **Linien, Texte, Schraffuren und Maßketten**. Wände, Öffnungen, Decken, Dächer, Räume, Stützen, Treppen, Bildreferenzen und Anschlüsse werden abgelehnt. Es wird wie ein Geschoss geprüft (Geometrie, Ebenen, Schraffurmuster), gehört aber nie zum Gebäude: keine Höhen, kein 3D, kein IFC, keine Mengen. IDs sind über Gebäude und Planköpfe eindeutig; Schraffurmuster, die nur ein Plankopf nutzt, bleiben erhalten.
- **Aktionen** (`changeTitleBlocks`, je ein Rückgängig-Schritt): anlegen (Unterlage wie das erste Masterlayout, normalerweise A3 quer), umbenennen (auch das Zeichenblatt), Unterlage ändern, löschen.
- Code: `titleBlocks` in `src/domain/project/schema.ts` (Schema und Prüfung), `src/application/views/title-blocks.ts`, Migration in `src/interop/project-file/load.ts`.

Nachweis PK1: 1499 Tests grün (3 neu in `src/application/views/title-blocks.test.ts`: anlegen mit Unterlage des Masterlayouts, eindeutige Namen, umbenennen, Unterlage, löschen, Dateirundlauf; Linie im Zeichenblatt gültig und nicht im Gebäude, Wand abgelehnt, doppelte ID abgelehnt, unbekannte Ebene abgelehnt; Schema 44 → 45, geschmuggelte Planköpfe abgelehnt), Typprüfung beider Projekte, Architektur, Lint, Formatierung sauber, 14-Modell-Prüfsumme unverändert (`e42aa36e…`). Noch keine Oberfläche (PK2, PK3).

## PK2 – Zeichenraum mit Werkzeug-Umleitung

- **Umleitung (Lens):** Ist der Tab „Plankopfplaner – Name“ aktiv, sieht die Zeichenfläche ein Projekt, dessen einziges Geschoss das Zeichenblatt des Plankopfs ist, im Maßstab **1:1**. Alle Zeichen- und Bearbeitungsschritte der vorhandenen Werkzeuge laufen darüber; jede Änderung wird als **ein Rückgängig-Schritt** in den Plankopf des echten Projekts zurückgeschrieben. Gemeinsame Einstellungen (Ebenen, Sichtbarkeit, Stifte, Schraffurmuster) wirken wie gewohnt. Das Gebäude, seine Geschosse und sein Maßstab bleiben unberührt.
- Projektweite Schritte – Rückgängig/Wiederholen, Laden, Geschosse, Abbilder, Layouts – wirken immer auf das echte Projekt. Verschwindet der Plankopf (z. B. Rückgängig seines Anlegens), schließt sein Zeichenraum.
- **Werkzeuge im Plankopfplaner:** Auswahl, Linie, Text, Schraffur, Maßkette, Messen. Wand, Tür, Fenster, Decke, Dach, Stütze, Treppe, Raum, Schnitt und Ansicht sind ausgegraut; ein Tastenkürzel dafür bringt einen Hinweis.
- **Aufruf (vorläufig):** **Organisation → Plankopfplaner** öffnet den zuletzt bearbeiteten Plankopf, sonst den ersten, ohne Plankopf wird „Plankopf“ angelegt und geöffnet. Der Tab wechselt wie die anderen; ein anderer Tab oder ein Geschoss im Navigator verlässt den Zeichenraum.
- Speichern, IFC-Export, Autosicherung, Navigator, Raum- und Bauteilliste arbeiten immer mit dem echten Projekt.
- Code: `src/application/views/title-block-space.ts` (`titleBlockLens`, `fromTitleBlockLens`, `spaceEditingReducer`), `useProjectEditing.ts`, Tab-Art `titleblock:<id>` in `canvas-tabs.ts`, `CadWorkspace.tsx` (Zeichenraum, Werkzeugsperre, Menü), `ToolRail.tsx` (`allowed`), `TopToolbar.tsx`.

Nachweis PK2: 1502 Tests grün (3 neu in `src/application/views/title-block-space.test.ts`: Lens nur mit dem Zeichenblatt, 1:1 und stabil; Linie landet im Plankopf, Gebäude und Maßstab unverändert, Rückgängig nimmt sie heraus, Verlassen des Raums; Rückgängig des Anlegens schließt den Raum), Typprüfung beider Projekte, Architektur, Lint, Formatierung sauber, 14-Modell-Prüfsumme unverändert. Browser: Organisation → Plankopfplaner legt „Plankopf“ an und öffnet den Tab (Maßstab 1:1, Gebäudewerkzeuge ausgegraut); Linie gezeichnet; im Tab „Grundriss Erdgeschoss“ nur die Wand, keine Linie; zurück im Plankopf ist die Linie da; Text „Bauvorhaben“ gesetzt und mit Rückgängig entfernt, der Plankopf-Tab bleibt aktiv.

Grenze PK2: Die Ansicht ist noch nicht auf Papiergröße eingepasst und es gibt noch keine Unterlage (PK3).
