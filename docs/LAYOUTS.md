# Planlayouts (L13)

Nutzerauftrag 02.11.2026: Ein weiterer Reiter im Navigator sammelt alle Layouts im Standardordner „Layoutsammlung“, sortierbar in eigenen Ordnern. Zuerst entstehen leere Layouts; die Platzierung von Zeichnungen und der Plankopfplaner (mit automatischen Texten) folgen später. Neues Layout über Rechtsklick auf einen Ordner oder die freie Fläche; das Fenster bietet Größe, Hoch-/Querformat, Rand und Randabstand und vor allem die Zuordnung zu einem Masterlayout, die abgeschaltet werden kann. Normalerweise regelt das Masterlayout alle diese Einstellungen. Doppelklick öffnet ein Layout als eigenen Tab auf der Zeichenfläche.

Entscheidungen (Empfehlungen übernommen):

1. Masterlayouts im Reiter „Layouts“ als fester Bereich über der „Layoutsammlung“, im selben Fenster erstellt und bearbeitet; Doppelklick öffnet auch ein Masterlayout als Tab.
2. Größen DIN A0 bis A5 und „frei“ (Breite × Höhe in mm).
3. Vier Ränder (oben, rechts, unten, links) in mm; Vorgabe 10 mm, links 20 mm Heftrand.
4. Alles, was im Masterlayout gezeichnet ist, erscheint in jedem Layout, das ihm folgt (auch der Plankopf).

Reihenfolge: LA1 Datenmodell → LA2 Navigator-Reiter → LA3 Fenster „Neues Layout“ → LA4 Layout als Tab, je Schritt ein PR.

## LA1 – Datenmodell

- **Projektdatei Schema 44.** Neu am Projekt (alle optional): `layoutFolders`, `layouts`, `masterLayouts`. Dateien mit Schema 43 werden beim Öffnen übernommen; Layouts in einer Datei mit Schema 43 werden abgelehnt.
- **Vorgaben:** Solange ein Projekt nichts an seinen Layouts ändert, gelten der Ordner „Layoutsammlung“ und das Masterlayout „Standard A3 quer“ (A3 quer, Ränder 10/10/10 mm, links 20 mm). Erst die erste Änderung schreibt beides ins Projekt; unveränderte Projekte behalten ihre Datei (14-Modell-Prüfsumme gleich).
- **Blatt** (`Sheet`): Format A0–A5 oder frei, Hoch-/Querformat, beim freien Format Breite × Höhe (50–5000 mm, wie gezeichnet), vier Ränder (0–500 mm). Die Ränder müssen Platz auf dem Blatt lassen. DIN-Maße hochkant: A0 841 × 1189, A1 594 × 841, A2 420 × 594, A3 297 × 420, A4 210 × 297, A5 148 × 210 mm.
- **Masterlayout:** Name (eindeutig) und Blatt. Löschen nur, solange kein Layout ihm folgt.
- **Layout:** Name, Ordner und entweder ein Masterlayout, dem es folgt (Blatt vom Master), oder ein eigenes Blatt. Beim Umschalten auf ein Masterlayout entfällt das eigene Blatt.
- **Ordner:** „Layoutsammlung“ (fest, nicht umbenennbar, verschiebbar oder löschbar); alle anderen Ordner liegen darin, beliebig tief. Ein Ordner kann nicht in sich selbst oder einen eigenen Unterordner verschoben werden; gelöscht wird nur ein leerer Ordner.
- **Aktionen** (`changeLayouts`, je ein Rückgängig-Schritt): Ordner anlegen/umbenennen/verschieben/löschen, Layout anlegen/Einstellungen/umbenennen/verschieben/löschen, Masterlayout anlegen/Einstellungen/löschen.
- Code: `src/domain/views/layouts.ts` (Schema, Vorgaben, Blattgröße, Regeln), `src/application/views/layouts.ts` (Aktionen), Prüfung in `src/domain/project/schema.ts`, Migration in `src/interop/project-file/load.ts`.

Nachweis LA1: 1495 Tests grün (5 neu in `src/application/views/layouts.test.ts`: Vorgaben ohne Dateiänderung, A3 quer 420 × 297 mm, verschachtelte Ordner, Schleifen und nicht leere Ordner abgelehnt, eigenes Blatt und freies Format, Masterwechsel, Master in Benutzung, Schema 43 → 44 und geschmuggelte Layouts), Typprüfung beider Projekte, Architektur, Lint, Formatierung sauber, 14-Modell-Prüfsumme unverändert (`e42aa36e…`). Im Browser noch nichts zu sehen; die App startet nach dem Neuladen fehlerfrei mit Schema 44.

## LA2 – Navigator-Reiter „Layouts“

- Dritter Reiter im Navigator neben „Gebäudestruktur“ und „Abbilder“. Die drei Reiter teilen sich die Breite (Gebäudestruktur etwas breiter), damit nichts seitlich hinausragt.
- Oben der feste Bereich **Masterlayouts**, darunter **Layoutsammlung** mit Ordnern beliebiger Tiefe und den Layouts.
- **Rechtsklick**
  - auf die Layoutsammlung, einen Ordner oder die freie Fläche: „Neues Layout“, „Neuer Ordner“ (im angeklickten Ordner, sonst in der Layoutsammlung); bei eigenen Ordnern zusätzlich „In Ordner verschieben“, „Ordner löschen“ (nur leer) und „Umbenennen“.
  - auf ein Layout: „Neues Layout“ und „Neuer Ordner“ im selben Ordner, „In Ordner verschieben“ (alle Ordner eingerückt), „Layout löschen“, „Umbenennen“.
  - auf die Masterlayouts: „Neues Masterlayout“, „Masterlayout löschen“ (gesperrt, solange Layouts ihm folgen, mit Anzahl), „Umbenennen“.
- Neue Einträge heißen „Layout“, „Layout 2“ …, „Masterlayout“ … bzw. „Neuer Ordner“; der Name ist sofort zum Überschreiben markiert. Ein neues Layout folgt dem ersten Masterlayout; ein neues Masterlayout übernimmt dessen Blatt. Das Fenster mit Größe, Format und Rändern folgt mit LA3.
- **F2** benennt um, **Enter** öffnet bzw. klappt Ordner auf und zu. Layouts und eigene Ordner lassen sich auf einen Ordner **ziehen**. Die Layoutsammlung bleibt fest.
- Ein Rechtsklick auf eine Zeile öffnet nur ihr eigenes Menü (nicht zusätzlich das der umgebenden Fläche).
- Jede Änderung ist ein Rückgängig-Schritt (Ereignis `layout` im Bearbeitungsablauf, `changeLayouts`). Fehler erscheinen als Meldung unter dem Baum.
- Code: `src/components/cad/LayoutNavigator.tsx`, Reiter in `ProjectNavigator.tsx`, Anbindung in `CadWorkspace.tsx` und `src/application/direct-edit/controller.ts`.

Nachweis LA2: 1495 Tests grün, Typprüfung beider Projekte, Architektur, Lint, Formatierung sauber, 14-Modell-Prüfsumme unverändert. Browser: Reiter „Layouts“ zeigt „Standard A3 quer“ und die Layoutsammlung; Ordner „Entwurf“ per Rechtsklick angelegt und benannt; darin Layout „Grundriss EG“; per „In Ordner verschieben“ in die Layoutsammlung und mit Rückgängig zurück; Masterlayout „A1 quer“ angelegt; „Standard A3 quer“ nicht löschbar („1 Layout folgt“). Dabei gefunden und behoben: Ein Rechtsklick öffnete auch das Menü der Fläche dahinter, das offen blieb (ein Enter legte dort einen zweiten Ordner an).

Nicht im Browser geprüft: Ziehen und Ablegen (die Testmaus löst kein HTML-Ziehen aus); es nutzt dieselben Aktionen wie „In Ordner verschieben“.

## LA3 – Fenster „Neues Layout“ und Einstellungen

- **Neues Layout** (Rechtsklick auf Ordner, Layout oder freie Fläche) und **Layouteinstellungen …** (Rechtsklick auf ein Layout) öffnen dasselbe Fenster:
  - Name, Ordner (alle Ordner eingerückt),
  - Bereich **Masterlayout**: Häkchen „Einstellungen vom Masterlayout übernehmen“ (bei neuen Layouts an) und Auswahl des Masterlayouts. Solange das Häkchen gesetzt ist, zeigen die Blattfelder die Werte des Masterlayouts und sind gesperrt; ein Hinweis sagt, dass auch dessen Zeichnung erscheint. Ohne Häkchen starten die eigenen Werte bei denen des Masterlayouts.
  - Bereich **Blatt**: Größe (DIN A0–A5, Frei), Format (Hoch-/Querformat; Drehen tauscht Breite und Höhe, auch beim freien Format), Breite und Höhe in mm (nur beim freien Format bearbeitbar), **Randabstand** oben, rechts, unten, links in mm (Dezimalkomma erlaubt).
  - Maßstäbliche **Blattvorschau** mit gestricheltem Randrahmen und den Maßen.
  - „Anlegen“ bzw. „Übernehmen“; Fehler (z. B. „Die Ränder lassen auf dem Blatt keinen Platz.“) erscheinen im Fenster, das dann offen bleibt.
- **Neues Masterlayout** und **Masterlayout-Einstellungen …** (Rechtsklick auf ein Masterlayout) nutzen dasselbe Fenster mit Name und Blatt.
- Jede Übernahme ist ein Rückgängig-Schritt. Neue Ordner werden weiter direkt angelegt und umbenannt.
- Code: `src/components/cad/LayoutSettingsWindow.tsx`, Anbindung in `LayoutNavigator.tsx`.

Nachweis LA3: 1495 Tests grün, Typprüfung beider Projekte, Architektur, Lint, Formatierung sauber, 14-Modell-Prüfsumme unverändert. Browser: „Neues Layout“ zeigt die gesperrten Werte von „Standard A3 quer“ (420 × 297 mm, Ränder 10/10/10/20); Häkchen aus, DIN A4 Hochformat, Rand oben 15 mm, Name „Detail A4“ → angelegt; „Layouteinstellungen …“ zeigt die gespeicherten Werte (A4, hoch, 210 × 297, oben 15, links 20, ohne Master); Rand links 200 mm → Meldung „keinen Platz“; Häkchen wieder an → übernommen, das Masterlayout zeigt „1 Layout folgt“.

## LA4 – Layout als Tab

- **Doppelklick** (oder Enter) auf ein Layout oder Masterlayout im Navigator öffnet es als eigenen **Tab** auf der Zeichenfläche, neben „Grundriss …“ und den Schnitten. Der Tab trägt den Namen des Layouts; ein gelöschtes Layout verliert seinen Tab (auch nach Rückgängig). Das geöffnete Layout ist im Navigator markiert.
- Der Tab zeigt das **Blatt maßstäblich in mm**: weißes Papier mit Schatten und dem gestrichelten **Randrahmen**. Darüber eine Zeile mit Art und Name, Größe, Format, Maßen, Rändern und – bei Layouts – „folgt Masterlayout …“ bzw. „ohne Masterlayout“.
- **Mausrad** zoomt um den Mauszeiger, **Ziehen** verschiebt, **Einpassen** zeigt das ganze Blatt. **Einstellungen …** öffnet das Fenster aus LA3 für dieses Layout bzw. Masterlayout. Ändert sich das Blatt (z. B. das Masterlayout auf A2), folgt der Tab sofort.
- Der Tab ist Sitzungszustand (wie die Schnitt-Tabs), nicht Teil der Projektdatei und kein Rückgängig-Schritt. Die Zeichnung des Masterlayouts und platzierte Zeichnungen kommen in späteren Schritten auf das Blatt; der Plankopf wird im Masterlayout gezeichnet (Plankopfplaner).
- Navigator: Beim Doppelklick wird in der Zeile kein Text mehr markiert.
- Code: `src/components/cad/LayoutSheetView.tsx`, Tab-Art `layout:<id>` in `src/application/views/canvas-tabs.ts` (`layoutTab`, `tabLayoutId`, Name und Aufräumen), `CanvasTabs.tsx`, Anbindung in `CadWorkspace.tsx`; `layoutFolderTree` in `src/domain/views/layouts.ts` für Navigator und Fenster.

Nachweis LA4: 1496 Tests grün (neu: Layout-Tabs in `canvas-tabs.test.ts`, Ordnerbaum in `layouts.test.ts`), Typprüfung beider Projekte, Architektur, Lint, Formatierung sauber, 14-Modell-Prüfsumme unverändert. Browser: Doppelklick auf „Standard A3 quer“ öffnet den Tab mit A3 quer 420 × 297 mm und Rändern 10/10/10/20; „Einstellungen …“ → A2 → der Tab zeigt sofort 594 × 420 mm; neues Layout über das Fenster angelegt und per Doppelklick geöffnet („folgt Masterlayout“); Mausrad zoomt; Wechsel zurück auf „Grundriss Erdgeschoss“ zeigt den Grundriss, die Layout-Tabs bleiben offen.

## Stand L13

LA1–LA4 erledigt: leere Layouts mit Masterlayouts, Ordnern, Blatteinstellungen und eigenem Tab. Offen für die nächsten Schritte: Zeichnen im Masterlayout (Plankopf, Plankopfplaner mit automatischen Texten), Platzieren von Abbildern/Zeichnungen auf Layouts, maßhaltiger PDF-Export und Druck (L14).

## Nacharbeiten nach Rückmeldung (02.11.2026)

- **Hintergrund des Layout-Tabs** deckend grau wie eine Arbeitsfläche; vorher war die Fläche nur zu 68 % deckend, sodass beim Herauszoomen der Grundriss durchschien.
- **Neu angelegt = sofort geöffnet:** Ein neues Layout oder Masterlayout öffnet nach „Anlegen“ direkt als Tab, ein neuer Plankopf direkt im Plankopfplaner.
- **Geschoss im Navigator** schließt Layout-, Schnitt- und Plankopf-Ansicht und zeigt den Grundriss dieses Geschosses (vorher blieb das Layout stehen, ein Weg zurück fehlte). Die anderen Tabs bleiben offen.
- **Eine Grundriss-Kamera für alle Geschosse:** Zoom und Lage bleiben beim Wechsel EG ↔ OG gleich (vorher wurde die Ansicht je Geschoss neu eingepasst). Abbilder behalten ihren gespeicherten Ausschnitt, der Plankopfplaner seine Unterlage.

Nachweis: 1506 Tests grün, Typprüfung, Architektur, Lint, Formatierung, 14-Modell-Prüfsumme unverändert. Browser: Neues Layout → „Anlegen“ öffnet den Tab, graue Arbeitsfläche ohne Grundriss; Gebäudestruktur → Erdgeschoss zeigt den Grundriss, Tab „Layout“ bleibt offen; Grundriss auf 360,7 % gezoomt, Wechsel ins 1. Obergeschoss: weiterhin 360,7 %.

## LZ1 – Zeichnen in Layouts und Masterlayouts

Nutzerwunsch 02.11.2026: In allen Layouts zeichnen und schreiben – Linien, Polylinien, Texte, Schraffuren –, um vor dem Export letzte Dinge von Hand zu korrigieren; keine Maßketten, nichts vermessen. Entscheidungen: Nullpunkt in der linken unteren Papierecke, kein Raster im Layout.

- **Projektdatei Schema 47.** Neu (optional): `layoutDrawings`, je Layout bzw. Masterlayout ein Zeichenblatt in Geschossform (`layoutId`, `storey`; die Blatt-ID ist `sheet-<Layout-ID>`). Nur **Linien, Texte, Schraffuren**; Maßketten und alles vom Gebäude werden abgelehnt. Ein Layout ohne Zeichnung hat keinen Eintrag; wird alles gelöscht, verschwindet der Eintrag wieder. Mit dem Layout bzw. Masterlayout wird seine Zeichnung gelöscht. Dateien mit Schema 46 werden übernommen.
- **Layout-Tab = Zeichenfläche:** Ein Layout oder Masterlayout öffnet als Zeichenraum mit derselben Umleitung wie der Plankopfplaner (`spaceLens`, `fromSpaceLens`, Raumart `layout`): Papier in echter Größe (1:1) mit Randrahmen auf grauer Arbeitsfläche, ohne Raster; die Ansicht passt sich auf das Blatt ein (auch nach Änderung von Größe/Format). Jeder Schritt ist ein Rückgängig-Schritt im Projekt; das Gebäude bleibt unberührt.
- **Werkzeuge im Layout:** Auswahl, Linie (auch Polylinie), Text, Schraffur. Maßkette, Messen und alle Gebäudewerkzeuge sind ausgegraut; ein Tastenkürzel bringt „Im Layout gibt es nur Linie, Text und Schraffur.“
- **Leiste im Tab:** „Layout Name · DIN A3 quer · 420 × 297 mm · Ränder … · folgt Masterlayout … · Einstellungen …“ (Fenster aus LA3).
- Die bisherige reine Blattansicht (`LayoutSheetView`) entfällt.
- Code: `layoutDrawings` in `src/domain/project/schema.ts` (gemeinsame Blattprüfung `drawingSheetPatterns` für Planköpfe und Layouts), `src/application/views/title-block-space.ts` (Räume `title-block` und `layout`), `layoutUnderlay` in `src/application/views/layouts.ts`, `src/components/cad/LayoutBar.tsx`, Arbeitsfläche in `BimPlan.tsx`, Anbindung in `CadWorkspace.tsx`.

Nachweis LZ1: 1507 Tests grün (neu: Linie im Layout und im Masterlayout je auf eigenem Blatt, Rückgängig, leeres Blatt ohne Eintrag, Löschen des Layouts nimmt die Zeichnung mit, keine Maßketten), Typprüfung beider Projekte, Architektur, Lint, Formatierung sauber, 14-Modell-Prüfsumme unverändert. Browser: neues Layout öffnet als Zeichenfläche (graue Fläche, A3-Papier, 1:1, Maßkette ausgegraut); Linie und Text „Hinweis: Maße am Bau prüfen“ gezeichnet; im Grundriss nicht sichtbar, zurück im Layout wieder da.

Offen (LZ2): Die Zeichnung des Masterlayouts erscheint noch nicht in den Layouts, die ihm folgen.
