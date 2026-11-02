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

## PK3 – Unterlage, Einpassen, Planköpfe im Navigator

- **Papierunterlage** im Plankopfplaner: weißes Blatt in echter Größe (1:1) mit gestricheltem Randrahmen, unter der Zeichnung und ohne Klicks. Der **Bezugspunkt** (Nullpunkt) ist die rechte untere Ecke des Randrahmens; dort sitzt die rechte untere Ecke des Plankopfs (`titleBlockUnderlay`).
- Beim Öffnen und bei jeder Änderung der Unterlage wird die Ansicht auf das Blatt **eingepasst**; „Alles anzeigen“ passt ebenfalls auf das Blatt ein.
- **Leiste im Tab** „Plankopf Name · Unterlage [DIN A0–A5] [Hoch-/Querformat] · Maße · Bezugspunkt“. Jede Änderung der Unterlage ist ein Rückgängig-Schritt am Plankopf.
- **Reiter „Layouts“ → Bereich „Planköpfe“** (zwischen Masterlayouts und Layoutsammlung): Rechtsklick „Neuer Plankopf“ (Name „Plankopf“, „Plankopf 2“ … sofort zum Überschreiben markiert), „Im Plankopfplaner öffnen“, „Umbenennen“ (auch F2), „Plankopf löschen“; **Doppelklick** oder Enter öffnet den Tab. Der geöffnete Plankopf ist markiert. Löschen schließt seinen Tab.
- Neues Ereignis `title-block` im Bearbeitungsablauf: Plankopf-Aktionen wirken immer auf das echte Projekt, auch aus dem Zeichenraum heraus.
- Code: `titleBlockUnderlay` in `src/application/views/title-blocks.ts`, `underlay` in `BimPlan.tsx` und Einpassen in `CadViewport.tsx`, `src/components/cad/TitleBlockBar.tsx`, Bereich „Planköpfe“ in `LayoutNavigator.tsx`, Anbindung in `ProjectNavigator.tsx` und `CadWorkspace.tsx`, Ereignis in `src/application/direct-edit/controller.ts`.

Nachweis PK3: 1503 Tests grün (neu: Lage der Unterlage A3 quer zum Bezugspunkt), Typprüfung beider Projekte, Architektur, Lint, Formatierung sauber, 14-Modell-Prüfsumme unverändert. Browser: Organisation → Plankopfplaner öffnet „Plankopf“ mit eingepasster A3-quer-Unterlage und Randrahmen; Linie vom Randrahmen nach links gezeichnet: 0,20 m; Unterlage auf A4 → Hochformat: Blatt eingepasst, die 20-cm-Linie ragt über den 180 mm breiten Randrahmen hinaus; im Reiter „Layouts“ Bereich „Planköpfe“ mit „Plankopf“; „Neuer Plankopf“ → „Plankopf Ausführung“; Doppelklick öffnet einen eigenen Tab mit eigener A3-Unterlage.

## Stand und Grenzen

- Plankopf zeichnen, ablegen (mit dem Projekt speichern) und bearbeiten ist umgesetzt (PK1–PK3).
- Der **Rasterfang** steht wie im Grundriss auf 0,1 m; für Plankopf-Maße empfiehlt sich ein feineres Raster (unten in der Statusleiste) oder die Eingabe von Länge/Winkel.
- Eingaben in m (0,18 = 18 cm), Maßstab fest 1:1.
- Noch offen: automatische Texte (nächster Schritt), der Plankopf im Masterlayout/Layout.

## PK4 – Plankopf im Masterlayout

Entscheidungen (Empfehlungen übernommen): Ein verwendeter Plankopf ist nicht löschbar; Layouts ohne Masterlayout bekommen vorerst keinen Plankopf; Lage fest an der rechten unteren Ecke des Randrahmens.

- **Projektdatei Schema 48.** Ein Masterlayout kann einen Plankopf tragen (`titleBlockId`). Dateien mit Schema 47 werden übernommen; ein Plankopf-Verweis in einer Datei mit Schema 47 wird abgelehnt. Der Verweis muss auf einen vorhandenen Plankopf zeigen.
- **Auswahl:** Fenster „Masterlayout-Einstellungen“ (bzw. „Neues Masterlayout“) mit dem Feld **Plankopf** („Ohne“ oder einer der Planköpfe). Umbenennen eines Masterlayouts behält den Plankopf.
- **Darstellung:** Der Plankopf erscheint im **Masterlayout** unter dessen eigener Zeichnung und in **jedem Layout, das dem Masterlayout folgt**, zusammen mit der Masterzeichnung, jeweils unter der eigenen Zeichnung. Seine rechte untere Ecke (der Bezugspunkt im Plankopfplaner) liegt auf der rechten unteren Ecke des Randrahmens. Er ist nicht anwählbar; Änderungen im Plankopfplaner erscheinen sofort auf allen Blättern. Maßketten eines Plankopfs werden auf dem Blatt (noch) nicht mitgezeigt.
- **Fang:** Die Rasterengine fängt Ecken, Endpunkte und Kanten des Plankopfs und der Masterzeichnung auf dem Blatt.
- **Löschen:** Ein Plankopf, den ein Masterlayout verwendet, lässt sich nicht löschen („Der Plankopf wird von Masterlayout „…“ verwendet.“).
- Code: `masterLayoutV48Schema` in `src/domain/views/layouts.ts`, Prüfung und Schema 48 in `src/domain/project/schema.ts`, Migration in `load.ts`, `titleBlockId` in den Layout-Aktionen, Löschsperre in `title-blocks.ts`, `spaceBackdrop` in `src/application/views/title-block-space.ts` (Masterzeichnung und verschobener Plankopf, Ids mit „@bg:“), Fang über `sheet-frames.ts`/`project-references.ts`, Feld in `LayoutSettingsWindow.tsx`, Anbindung in `CadWorkspace.tsx`.

Nachweis PK4: 1509 Tests grün (neu: Plankopflinie im Layout und im Masterlayout um (0,41 | 0,01) m verschoben bei A3 quer, fangbar, nicht im eigenen Blatt; Löschsperre; Umbenennen behält den Plankopf; Dateirundlauf; Schema 47 lehnt den Verweis ab), Typprüfung, Architektur, Lint, Formatierung, 14-Modell-Prüfsumme unverändert. Browser: im Plankopfplaner eine Linie von der Randrahmen-Ecke gezeichnet; im Masterlayout „Standard A3 quer“ als Plankopf gewählt → die Linie sitzt an der rechten unteren Ecke des Randrahmens; neues Layout → Linie ebenfalls da, „Endpunkt“ wird gefangen.

## Automatische Texte

Nutzerauftrag 02.11.2026, Entscheidungen (Empfehlungen übernommen): Felder wie vorgeschlagen; bis Zeichnungen platziert werden können, wählt jedes Layout sein Abbild; Datum ist das heutige Datum. Reihenfolge AT1 Datenmodell → AT2 Eingabe → AT3 Anzeige auf den Blättern.

Ein Text im Plankopfplaner enthält Platzhalter in geschweiften Klammern, z. B. „M {Maßstab}“. Auf jedem Blatt stehen dort die Werte dieses Layouts.

| Gruppe    | Platzhalter                                                 | Wert                                                                                  |
| --------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Zeichnung | {Zeichnungsname}, {Maßstab}, {Zeichnungsart}                | Abbild des Layouts (über `drawingInfo`, AB1): Name, „1:50“, Grundriss/Schnitt/Ansicht |
| Layout    | {Layoutname}, {Plannummer}, {Index}, {Blattgröße}           | Layout: Name, Plannummer, Index, „DIN A3“ bzw. „Breite × Höhe mm“                     |
| Projekt   | {Projektname}, {Bauherr}, {Projektadresse}, {Planverfasser} | Projektinformationen                                                                  |
| Datum     | {Datum}                                                     | heutiges Datum, „02.11.2026“                                                          |

## AT1 – Datenmodell

- **Projektdatei Schema 49.** Neu (optional): `projectInfo` (Projektname, Bauherr, Projektadresse, Planverfasser) und am Layout `planNumber`, `index`, `documentId` (das gezeigte Abbild). Dateien mit Schema 48 werden übernommen. Ein Layout darf nur auf ein vorhandenes Abbild zeigen; ein Abbild, das ein Layout zeigt, lässt sich nicht löschen („Das Abbild wird von Layout „…“ verwendet.“).
- **Layoutaktionen:** Plannummer, Index, Abbild beim Anlegen und in den Einstellungen; fehlt die Angabe, bleibt der Wert, leer entfernt ihn. **Projektinformationen** (`setProjectInfo`) als ein Rückgängig-Schritt; leere Felder werden entfernt.
- **Auflösung** (`src/application/views/auto-texts.ts`): `autoTextValues` liefert die Werte eines Layouts oder Masterlayouts, `resolveAutoText` setzt sie ein. Fehlt ein Wert, bleibt die Stelle leer; im Masterlayout bleibt der Platzhalter sichtbar. Unbekannte Klammern bleiben, wie getippt.
- Die Zeichenräume (Plankopf, Layout) blenden Abbild- und Plankopfverweise aus und schreiben Layouts und Masterlayouts nie zurück; die ändern sich nur über Projektschritte.

Nachweis AT1: 1511 Tests grün (2 neu in `src/application/views/auto-texts.test.ts`: alle Gruppen mit Werten, leere und sichtbare fehlende Werte, unbekannte Klammern, Datum; Felder behalten/ändern/leeren, Löschsperre des Abbilds, Dateirundlauf, Schema 48 → 49), Typprüfung, Architektur, Lint, Formatierung, 14-Modell-Prüfsumme unverändert. Noch keine Oberfläche (AT2, AT3).

## AT2 – Eingabe

- **Texteditor auf Papier** (Plankopfplaner, Layout, Masterlayout): Auswahl **„Automatischer Text einfügen …“** mit allen Platzhaltern nach Gruppen (Zeichnung, Layout, Projekt, Datum); der Platzhalter kommt an die Schreibmarke, z. B. „Projekt: {Projektname}“. Im Grundriss gibt es die Auswahl nicht.
- **Organisation → Projektinformationen:** Projektname, Bauherr, Projektadresse, Planverfasser, je mit ihrem Platzhalter; „Übernehmen“ ist ein Rückgängig-Schritt (Ereignis `project-info`, wirkt immer auf das echte Projekt, auch aus einem Zeichenraum).
- **Layoutfenster:** Bereich „Plankopf-Angaben“ mit Plannummer, Index und **Abbild** (liefert Zeichnungsname und Maßstab; Liste aller Abbilder mit Maßstab).
- Code: `TextEditorOverlay.tsx` (`autoTexts`), `src/components/cad/ProjectInfoWindow.tsx`, Menü in `TopToolbar.tsx`, Felder in `LayoutSettingsWindow.tsx`, Ereignis in `controller.ts`, Anbindung in `CadWorkspace.tsx`.

Nachweis AT2: 1511 Tests grün, Typprüfung, Architektur, Lint, Formatierung, 14-Modell-Prüfsumme unverändert. Browser: Projektinformationen „Haus am See“ übernommen; im Plankopfplaner Text „Projekt: “ getippt, „Projektname“ aus der Auswahl eingefügt → „Projekt: {Projektname}“ gesetzt. Die Layoutfelder werden mit AT3 im Browser geprüft.
