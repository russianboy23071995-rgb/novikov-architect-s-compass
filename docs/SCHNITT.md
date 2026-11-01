# Werkzeug „Schnitt“

Nutzervorgabe (01.11.2026): Ein 2D-Werkzeug, das eine Schnittzeichnung erzeugt. Der Schnitt wird an beliebiger Stelle durch eine Schnittlinie im Grundriss gezeichnet, gleich in welchem Geschoss. Schnitte haben einen Namen und eine Kennung und werden im Navigator in einem eigenen Ordner „Schnitte“ abgelegt und verwaltet. Vorher wird der Canvas zu Tabs, damit später zum Beispiel eine Schnittzeichnung und eine 3D-Ansicht als zwei Tabs offen sein können.

Schritte:

| Schritt | Inhalt | Stand |
| --- | --- | --- |
| SC1 | Canvas-Tabs, Ordner „Schnitte“ im Navigator | erledigt |
| SC2 | Werkzeug „Schnitt“: Schnittlinie, Name, Kennung, Blickrichtung, Einträge im Ordner, Schnitt als Tab | erledigt |
| SC3 | Schnittzeichnung aus dem Modell erzeugen und im Schnitt-Tab zeigen | erledigt |
| SC4 | Größe des Schnittsymbols (mm Papier / m Modell), geschnittene Bauteile am Linienende geschlossen | erledigt |

## SC1 – Canvas-Tabs und Ordner „Schnitte“

- Über dem Canvas (oben mittig im freien Bereich) liegt eine Tab-Leiste. Jeder Tab ist eine Ansicht: „Grundriss \<Arbeitsgeschoss\>“ oder „3D-Ansicht“. Der aktive Tab ist die aktuelle Ansicht.
- „+“ öffnet eine Ansicht als Tab; ist sie schon offen, wird ihr Tab aktiviert („(offen)“ im Menü). Auch der bisherige 2D/3D-Schalter der Werkzeugleiste und jeder andere Wechsel der Ansicht öffnet den passenden Tab.
- Ein Tab lässt sich mit × schließen; der letzte Tab bleibt offen. Wird der aktive Tab geschlossen, wird der rechte Nachbar aktiv, am Ende der linke.
- Es wird nur der aktive Tab gezeichnet. Aufteilungen (zwei bis vier Ansichten) gehören weiterhin zum Modell-Tab.
- Die offenen Tabs sind Sitzungszustand: kein Teil des Projekts, kein Rückgängig-Schritt, nach dem Neuladen wieder nur der Grundriss.
- In einem Abbild bleibt der Grundriss-Tab aktiv; der 3D-Tab meldet wie bisher „Dieses Abbild ist ein 2D-Grundriss.“
- Navigator, Bereich „Gebäudestruktur“: neuer Ordner **„Schnitte“** unter den Geschossen, vorerst leer. Ein Klick darauf ändert weder Auswahl noch Geschoss.

Umsetzung:

- `src/application/views/canvas-tabs.ts`: Ansichten, Bezeichnungen, `withCanvasTab`, `closeCanvasTab`. SC2 ergänzt die Art „Schnitt“.
- `src/components/cad/CanvasTabs.tsx`: Tab-Leiste mit Schließen und „+“-Menü.
- `src/components/cad/CadWorkspace.tsx`: Tab-Zustand; ein Moduswechsel ohne Tab öffnet einen; `changeMode` ist der gemeinsame Weg für Werkzeugleiste und Tabs.
- `src/components/cad/ProjectNavigator.tsx`: Ordner `SECTIONS_FOLDER_ID`.

Nachweis: Test `src/application/views/canvas-tabs.test.ts` (2 Tests). 1425 Tests grün, Typprüfung beider Projekte, Architektur und Lint sauber, 14-Modell-Hash unverändert (`089f79e4…97017b3`).

Browser-Abnahme (01.11.2026, Port 8094): Start mit einem Tab „Grundriss Erdgeschoss“, Ordner „Schnitte“ im Navigator. „+“ → „3D-Ansicht“ öffnet den zweiten Tab und zeigt 3D. Klick auf den Grundriss-Tab schaltet zurück, Klick auf 3D wieder nach 3D. × am aktiven 3D-Tab schließt ihn und aktiviert den Grundriss. Der 3D-Schalter der Werkzeugleiste öffnet den 3D-Tab. Keine neuen Konsolenfehler mit der aktuell geladenen Modulversion.

## SC2 – Werkzeug „Schnitt“

- Modell: `project.sections` (Schema 41, Migration 40 → 41 ohne Änderung; ein Schema-40-Projekt mit untergeschobenen Schnitten wird abgelehnt). Ein Schnitt gehört zum Gebäude, nicht zu einem Geschoss: `id`, `name`, `mark` (Kennung), `start`, `end`, `look` (Blickseite links/rechts, von Anfang zu Ende gesehen). Die IDs zählen zur projektweiten Eindeutigkeitsprüfung.
- Werkzeug „Schnitt“ am Ende der Werkzeugleiste (2D): **Klick 1** Anfang, **Klick 2** Ende, **Klick 3** Blickseite (Seite des Zeigers). Ab Klick 1 zeigt die Vorschau die Schnittlinie mit der nächsten Kennung, nach Klick 2 klappen die Pfeile mit dem Zeiger. Fang wie bei den anderen Zeichenwerkzeugen. Esc bricht ab. Gezeichnet wird in jedem Grundriss; der Schnitt erscheint in allen Geschossen.
- Vorgaben (Leiste und Einstellungsfenster per Doppelklick auf das Werkzeug): Kennung als Buchstaben (A, B, … Z, AA, …) oder Zahlen (1, 2, …), Namensvorlage (Vorgabe „Schnitt“ → „Schnitt A-A“). Vergeben wird die erste freie Kennung. Die Vorgaben sind Sitzungszustand.
- Grundriss: dünne Strich-Punkt-Linie, kräftige Enden, an beiden Enden Pfeil zur Blickseite und die Kennung; Größen in Bildschirmpixeln.
- Elementfenster (Doppelklick auf die Schnittlinie oder auf den Eintrag im Navigator): Name, Kennung (eine doppelte Kennung wird gemeldet, nicht verhindert), Länge und Blickseite, „Blickrichtung umkehren“, „Als Tab öffnen“, „Schnitt löschen“. Jede Änderung ist ein Rückgängig-Schritt.
- Navigator: Ordner „Schnitte“ listet „A · Schnitt A-A“. Klick öffnet den Schnitt als Tab, Doppelklick sein Fenster.
- Schnitt-Tab: trägt den Namen des Schnitts und zeigt seit SC3 die Schnittzeichnung. Ein gelöschter (oder rückgängig gemachter) Schnitt verliert seinen Tab. Werkzeugwahl, Ansichtswechsel und Geschosswahl kehren zum Modell zurück.
- Nicht dabei: Auswahl, Verschieben und Punktbearbeiten der Schnittlinie im Grundriss (seit SC5 möglich); IFC (Schnitte sind Zeichnungsableitungen, keine Bauteile).

Umsetzung: `src/domain/views/sections.ts` (Schema, Kennungen, Blickseite), `src/application/sections/actions.ts` (anlegen, ändern, löschen, Vorgaben), `src/application/views/canvas-tabs.ts` (Schnitt-Tabs), `src/components/cad/SectionPlanGraphic.tsx`, `SectionFields.tsx`, `SectionProperties.tsx`, `BimPlan.tsx` (Darstellung, Vorschau, Doppelklick), `CadWorkspace.tsx` (Klickfolge, Tabs, Fenster), `ProjectNavigator.tsx`, `ToolRail.tsx`.

Nachweis: `src/application/sections/actions.test.ts` (4 Tests: Kennungsfolge, Blickseite, Anlegen/Ändern/doppelte Kennung/Löschen/Speichern, Migration und Ablehnung) und ein neuer Tab-Test. 1430 Tests grün, Typprüfung beider Projekte, Architektur und Lint sauber, 14-Modell-Hash unverändert.

Browser-Abnahme (01.11.2026, Port 8094): Werkzeug „Schnitt“, Leiste zeigt „Nächster: Schnitt A-A“; drei Klicks quer über eine Wand im Erdgeschoss, Vorschau mit Kennung A und Pfeilen zur Zeigerseite; danach „A · Schnitt A-A“ im Navigator, Leiste zeigt B-B. Klick auf den Eintrag öffnet den Tab „Schnitt A-A“ mit Hinweis; im Fenster umbenannt in „Längsschnitt“ (Tab und Navigator folgen), Blickrichtung umgekehrt. Im 1. Obergeschoss ist der Schnitt sichtbar, Doppelklick auf die Linie öffnet das Fenster; „Schnitt löschen“ entfernt Linie und Tab, Undo stellt ihn wieder her. Keine Konsolenfehler der aktuell geladenen Modulversion (ältere Fehler stammen aus dem Hot-Reload mit dem Schema-Wechsel vor dem Neuladen).

## SC3 – Schnittzeichnung

- Erzeugt aus dem 3D-Körper des ganzen Gebäudes (`buildBuildingSolid`: Wände mit Öffnungen, Decken, Dächer, Stützen, Treppen), bei jeder Modelländerung neu, solange der Schnitt-Tab offen ist. Nichts davon wird gespeichert.
- Schnittebene: senkrecht auf der Schnittlinie. Waagerechte Ausdehnung = Länge der Schnittlinie; Blick zur gewählten Seite, rechts in der Zeichnung ist rechts für den Betrachter (bei „Blick rechts“ gespiegelt).
- **Geschnittene Bauteile:** Schnittkanten je Bauteil zu geschlossenen Umrissen verbunden, gefüllt mit der Schnittfarbe aus „Darstellung“ (Grau, Schwarz, Weiß, eigene Farbe), kräftige Kontur. Nicht schließende Stücke werden nur als Linie gezeichnet.
- **Ansicht dahinter:** Flächen hinter der Ebene, die zum Betrachter zeigen, von hinten nach vorne gemalt (Maleralgorithmus) mit Hintergrundfüllung; gezeichnet werden nur ihre sichtbaren Kanten (Kanten zwischen Flächen derselben Ebene entfallen). Was vor der Ebene liegt, fehlt. Durch Öffnungen sieht man die Laibungen dahinter.
- **Geschosse:** gestrichelte Höhenlinien je Geschoss mit Kote (±0,00 / +3,00) und Namen, bezogen auf OK RFB Erdgeschoss.
- Bedienung im Tab: Mausrad zoomt um den Zeiger, Ziehen verschiebt, „Einpassen“ zeigt alles, „Schnitt-Fenster“ öffnet das Elementfenster. Trifft die Linie nichts, steht dort ein Hinweis.

Grenzen: keine Fenster- und Türkörper (Öffnungen bleiben leer, es gibt im 3D-Körper keine Rahmen/Gläser); keine Tiefenbegrenzung; der Maleralgorithmus kann bei sich durchdringenden schrägen Flächen (Dächer) einzelne Kanten falsch überdecken; Kanten, die nur teilweise an einer gleich ausgerichteten Nachbarfläche liegen, können als Linie erscheinen; keine Bemaßung, Beschriftung oder Ablage als Abbild/Layout.

Umsetzung: `src/rendering/viewport/section-drawing.ts` (Ebene, Schnittkanten verketten, Abschneiden mit Kantenherkunft, sichtbare Kanten, Geschosse), `src/components/cad/SectionDrawingView.tsx` (SVG mit Zoom/Pan), `CadWorkspace.tsx` (Schnitt-Tab).

Nachweis: `src/rendering/viewport/section-drawing.test.ts` (2 Tests: geschnittene Wand als geschlossener Umriss 0,24 × 2,80 m an der richtigen Stelle, Wand dahinter als Ansicht 4 × 2,80 m auf die Linienlänge beschnitten, Geschosskote; Gegenrichtung gespiegelt ohne die Wand davor; Linie neben dem Gebäude trifft nichts). 1432 Tests grün, Typprüfung beider Projekte, Architektur und Lint sauber, 14-Modell-Hash unverändert. Messung am Schulmodell (2000 Elemente, 5 Geschosse, 9200 Flächen): rund 100 ms je Schnitt, alle Schnittumrisse geschlossen.

Browser-Abnahme (01.11.2026, Port 8094): Startprojekt (Wand mit Fenster), Schnitt quer durch das Fenster; Tab „Schnitt A-A“ zeigt die geschnittene Wand oben und unten in der Schnittfarbe, dazwischen die Fensteröffnung mit der Laibung dahinter, Geschosslinien „±0,00 Erdgeschoss“ und „+3,00 1. Obergeschoss“. Mausrad zoomt, „Einpassen“ stellt die Ansicht wieder her.

## SC4 – Größe des Schnittsymbols, Korrektur geschnittener Bauteile am Linienende

- **Symbolgröße:** Kennung, Pfeile und Endstriche der Schnittlinie im Grundriss haben eine feste Größe, die mit dem Modell zoomt, statt einer festen Bildschirmgröße. Einstellbar wie beim Text: Buchstabenhöhe in „mm Papier“ (folgt dem Ausgabemaßstab) oder „m Modell“. Vorgabe 5 mm Papier, bei 1:100 also 0,50 m. Pfeil und Endstriche wachsen anteilig mit (Pfeilspitze 1,25 h vor der Linie, Kennung 1,1 h hinter dem Ende); Strichstärken und die Doppelklick-Fangzone bleiben in Bildschirmpixeln.
- Eingabe im Werkzeugfenster (Doppelklick auf „Schnitt“, gilt für neue Schnitte) und im Schnitt-Fenster (je Schnitt, ein Undo-Schritt). Beim Wechsel der Einheit wird so umgerechnet, dass die sichtbare Größe beim aktuellen Maßstab gleich bleibt.
- Datenmodell: `section.symbolSize { unit: "paper" | "model", value }` optional; Schnitte ohne Angabe (aus SC2/SC3) zeigen die Vorgabe. Schema bleibt 41.
- **Korrektur Schnittzeichnung:** Beginnt oder endet die Schnittlinie in einem Bauteil, blieb sein Schnitt bisher offen und damit ungefüllt (sichtbar bei Decke und Wand im Obergeschoss, wenn die Linie in der Wand ansetzt). Jetzt werden die Schnittumrisse erst vollständig gebildet und dann als Fläche auf die Linienlänge beschnitten; sie bleiben geschlossen und erhalten die Schnittfarbe. Das gilt für alle Geschosse und Bauteilarten.

Umsetzung: `src/domain/views/sections.ts` (Symbolgröße, Umrechnung), `src/application/sections/actions.ts` (Vorgabe), `src/components/cad/SectionSizeField.tsx` (Feld Größe und Maß), `SectionFields.tsx`, `SectionProperties.tsx`, `SectionPlanGraphic.tsx`, `BimPlan.tsx`, `CadWorkspace.tsx`; `src/rendering/viewport/section-drawing.ts` (Umrisse erst schließen, dann beschneiden).

Nachweis: neuer Test in `src/application/sections/actions.test.ts` (Vorgabe, Höhe bei 1:100 und 1:50, Umrechnung Papier ↔ Modell, Laden ohne und mit Größe, Ablehnung von 0) und in `section-drawing.test.ts` (Linie beginnt in Wand und Decke, darüber Wand im Obergeschoss: alle drei geschlossen mit den erwarteten Flächen). 1434 Tests grün, Typprüfung beider Projekte, Architektur, Lint und Prettier sauber, 14-Modell-Hash unverändert. Die Laufzeit am Schulmodell wurde nicht neu gemessen; zusätzlich gesammelt werden nur die Schnittkanten außerhalb der Linienlänge, die danach weggeschnitten werden.

Browser-Abnahme (01.11.2026, Port 8094): Im Fenster des Nutzers war ein Schnitt mit Linienbeginn in der Wand zu sehen; Decke und Obergeschosswand erschienen nur als offene Linien (vor der Korrektur, im DOM nachgewiesen). Nach der Korrektur im Startprojekt: Schnitt mit Beginn in der Wand, Wandschnitt gefüllt. Symbol 5 mm Papier bei 1:100 zoomt mit dem Modell (Kennung im Verhältnis zur Wand gleich bei 220 % und 121 %); im Schnitt-Fenster 2,5 eingegeben → Symbol halb so groß; Einheit auf Modellmaß → 0,25 m, Größe unverändert.

## SC5 – Schnittlinie im Grundriss bearbeiten

Nutzervorgabe (01.11.2026): Die gezeichnete Schnittlinie muss anklickbar bleiben und sich im Grundriss bewegen, verlängern und kürzen lassen. Fenster- und Türkörper im Schnitt werden ausdrücklich nicht erfunden: Solange es nur Öffnungen gibt, zeigt der Schnitt die Öffnung.

- **Auswählen:** Mit dem Pfeil-Werkzeug wählt ein Klick auf die Linie den Schnitt aus, in jedem Geschoss. Er wird blau hervorgehoben, ebenso der Eintrag im Navigator. Ein Klick ins Leere, Esc, ein Werkzeugwechsel, Undo oder die Auswahl eines Bauteils heben die Auswahl auf. Entf löscht den gewählten Schnitt (ein Undo-Schritt). Ein Doppelklick öffnet weiterhin das Fenster und wählt den Schnitt dabei aus.
- **Griffe:** Anfang und Ende verlängern, kürzen oder drehen die Linie; der mittlere Griff verschiebt sie als Ganzes. Gefangen wird wie beim Zeichnen (Punkte, Wände, Raster). Mit Shift bleibt beim Ziehen eines Endes die Richtung erhalten, es ändert sich nur die Länge; die Linie schrumpft nie auf einen Punkt und kippt nicht um. Während des Ziehens folgt die Vorschau (Linie, Pfeile, Kennung); beim Loslassen entsteht ein Undo-Schritt, die Schnittzeichnung im Tab folgt.
- **Fenster:** „Länge (m, vom Anfang aus)“ setzt die Länge als Zahl; das Ende wandert in gleicher Richtung.
- Schema unverändert (41); geändert werden nur `start` und `end` des Schnitts.

Umsetzung: `src/application/sections/actions.ts` (`sectionGripPoint`, `dragSectionGrip`, `withSectionLength`), `src/components/cad/BimPlan.tsx` (Auswahlklick, Griffe, Ziehen mit Fang und Vorschau), `CadWorkspace.tsx` (Auswahlzustand, Entf, Navigator, Übernahme), `SectionProperties.tsx` (Längenfeld).

Nachweis: neuer Test in `src/application/sections/actions.test.ts` (Ende verlängern, Anfang drehen, verschieben, Shift nur Länge an beiden Enden, kein Punkt und kein Umkippen, Länge aus dem Fenster, Kennung bleibt). 1435 Tests grün, Typprüfung beider Projekte, Architektur, Lint und Prettier sauber, 14-Modell-Hash unverändert.

Browser-Abnahme (01.11.2026, Port 8094, Startprojekt): Schnitt gezeichnet, mit dem Pfeil-Werkzeug angeklickt – blau mit drei Griffen, Navigatoreintrag markiert. Ende mit der Maus gezogen (Linie gedreht und verlängert), mittleren Griff gezogen (ganze Linie verschoben, am Raster gefangen); Strg+Z stellt jeweils den vorigen Stand her. Entf löscht den gewählten Schnitt, Strg+Z holt ihn zurück. Im Fenster Länge 3 eingegeben – die Linie verlängert sich vom Anfang aus. Shift beim Ziehen nur im Test geprüft, nicht im Browser.
