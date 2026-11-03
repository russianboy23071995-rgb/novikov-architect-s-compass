# Deckendurchbruch (L40, 03.11.2026)

Nutzerwunsch (02.11.2026): Werkzeug Deckendurchbruch, Öffnung in Decken, z. B. für Treppen und Schächte; Anforderung FUNKTIONEN Absatz 37 („Öffnung kann auch eingefügt werden, als Deckendurchbruch“, Ebene Decke), Register N48. Freigabe der Änderungskarte am 03.11.2026 mit allen Empfehlungen, Darstellung „gemäß Vorgabe“.

## Verhalten

- **Eigenes Bauteil** „Deckendurchbruch“ mit eigener ID, das in einer Decke desselben Geschosses sitzt wie ein Fenster in seiner Wand. Standardebene „Decke“. Auswahl, Löschen, Ebene, Navigator und Filter gelten wie bei jedem Bauteil (Registry).
- **Werkzeug** „Deckendurchbruch“ in der Gruppe 3D-Werkzeuge neben der Decke. Erstellung wie bei Decke und Schraffur: Rechteck über die Diagonale, Rechteck aus Seite und Höhe, Polygon per Klick oder geschlossene Kontur übernehmen. Die Decke, die den Umriss ganz enthält, wird selbst gefunden. Ohne passende Decke erscheint „Ein Deckendurchbruch muss ganz in einer Decke liegen.“
- **Einstellungsfenster:** Ein Doppelklick auf das Werkzeug öffnet die Standardwerte (Erstellung). Ein Doppelklick auf einen Durchbruch öffnet sein Elementfenster.
- **Regeln:** Ein Durchbruch liegt strikt innerhalb seiner Decke, ohne gemeinsame Kante oder Ecke mit dem Deckenrand. Zwei Durchbrüche einer Decke dürfen sich weder überschneiden noch berühren. Jeder Verstoß wird abgelehnt und das Modell bleibt unverändert. Das gilt beim Zeichnen, Verschieben, Bearbeiten, beim Textbefehl und beim Laden einer Datei. Auch eine Deckenkontur, die einen Durchbruch abschneiden würde, wird abgelehnt.
- **Mit der Decke:** Wird die Decke verschoben, wandern ihre Durchbrüche mit. Wird die Decke gelöscht, verschwinden auch ihre Durchbrüche, mit dem Hinweis „1 Deckendurchbruch der Decke wird mitgelöscht“. Das ist ein einziger Rückgängig-Schritt.
- **Bearbeiten im Grundriss** über den gemeinsamen Weg von Decke und Schraffur:
  - Eckgriffe „Durchbruchecke n“, Punkt frei bewegen, Punkt in Flucht strecken, Knicken, Seite strecken, Kontur versetzen (nur bei konvexen Umrissen).
  - Element frei bewegen sowie auf der X- oder Y-Achse bewegen.
  - Die Vorschau zeigt die Decke mit dem verschobenen Loch und lehnt eine Lage außerhalb der Decke schon während der Bewegung ab.
- **Eigenschaften:** Angezeigt werden die Decke, die Fläche und bei achsparallelen Rechtecken Breite × Tiefe. Breite X und Tiefe Y sind direkt änderbar, ausgehend von der linken unteren Ecke.
- **Textbefehl** bei ausgewählter Decke: „Deckendurchbruch 1,20 x 0,80“ (auch „Durchbruch …“, Einheiten m/cm/mm, z. B. „1,2 m x 80 cm“). Er legt ein Rechteck in die Mitte des Deckenumrisses. Liegt es dort nicht ganz in der Decke oder auf einem anderen Durchbruch, wird es abgelehnt.
- **Fang:** Ecken und Kantenmitten wie beim Deckenumriss, Beschriftung „Deckendurchbruch · Ecke n“.

## Darstellung

- **Grundriss (Symbol ab 03.11.2026, siehe unten):** Umriss mit schwarzem Eckkeil; runder Durchbruch als Kreis, oben links zur Hälfte schwarz. Bis dahin (PR605) zeigte der Grundriss das Diagonalkreuz nach DIN 1356-1, das laut Nutzer eine Kernbohrung bezeichnet.
- In der Änderungskarte stand „gestrichelt wie die Decke“. Die Decke wird aber seit der Nutzerentscheidung vom 29.10.2026 als durchgezogene Kontur ohne Füllung gezeichnet, deshalb ist der Durchbruch ebenfalls durchgezogen.
- **3D:** Die Decke hat ein Loch durch die ganze Stärke, mit eigenen Laibungsflächen. Eine Decke ohne Durchbruch ist Fläche für Fläche unverändert (14-Modell-Hash `e42aa36e…` gleich).
- **Schnitt und Ansicht:** Die geschnittene Decke ist am Durchbruch unterbrochen, die Laibung dahinter ist sichtbar.
- **IFC:** je Durchbruch ein `IfcOpeningElement` (.OPENING.), als Extrusion des Umrisses über die Deckenstärke an der Lage der Decke, mit `IfcRelVoidsElement` an der `IfcSlab`.
- **Mengen:** Die Deckenfläche und das Volumen der Decke werden um die Durchbrüche verringert.

## Umsetzung

- `domain/elements/slab/opening.ts`: Schema, Prüfung `slabOpeningProblem` (strikt innen, getrennt), Fläche und Diagonalkreuz `slabOpeningCross`.
- Schema 51 (`domain/project/schema.ts`, `format.ts`, `interop/project-file/load.ts`):
  - Liste `slabOpenings` je Geschoss.
  - Ebenen- und Deckenbezug werden geprüft.
  - Migration 50 → 51 ohne Durchbrüche. Das strenge v50-Schema lehnt eingeschmuggelte Durchbrüche ab.
- `application/slabs/openings.ts`: `addSlabOpening` (mit `hostSlabId`), `updateSlabOpening`. `createDrawing` kennt `kind: "slabOpening"`. Textbefehl in `application/slabs/command.ts`.
- `geometry/polygons/triangulate.ts`: `triangulatePolygonWithHoles`. Jedes Loch wird über eine Brücke zur nächsten sichtbaren Umrissecke angebunden, dann wird wie bisher in Ohren zerlegt. Ohne Löcher wird die bisherige Funktion benutzt.
- `rendering/viewport/slab-solid.ts`, `storey-solid.ts`: Löcher im Deckenkörper.
- Löschen und Bewegen: `application/elements/delete.ts`, `domain/project/prepared-translation.ts`.
- Bearbeiten: `application/direct-edit/*` (Ziel `slabOpening` im gemeinsamen Konturweg).
- Grundriss: `rendering/viewport/plan-scene.ts`, `layer-display.ts`, `selection-shapes.ts`, `components/cad/PlanSceneRun.tsx`.
- Oberfläche: `SlabOpeningToolFields`, `SlabOpeningProperties`, `BimPlan` (Griffe), `DemandMenu`, `demand-menu.ts`, `CadWorkspace`, Werkzeugleiste, Symbol `SlabOpeningIcon`.
- IFC: `interop/ifc/writer.ts`. Mengen: `application/quantities/schedule.ts`. Fang: `application/snapping/project-references.ts`, `point-label.ts`.

## Grenzen

- **Geschoss darunter:** Seit Schema 53 ist eine Decke die Bodenplatte ihres Geschosses (docs/SLAB_ELEMENT.md). Der Durchbruch liegt damit im Geschoss, in dem er gezeichnet und gezeigt wird. Im Geschoss darunter wird er nicht dargestellt (Nutzerentscheidung 03.11.2026); ein eigener Luftraum entfällt.
- **Raumhöhen** über einem Durchbruch bleiben unverändert: Die Decke gilt dort weiter als oberer Abschluss.
- **Nicht durchgehende Aussparungen** (nach DIN mit einer Diagonale) gibt es nicht.
- **Keine Verknüpfung mit Treppen:** Ein Treppenloch wird von Hand gezeichnet.
- **3D:** Der Durchbruch selbst ist nicht wählbar, ein Klick trifft die Decke. Gewählt und bearbeitet wird er im Grundriss.
- Ein Durchbruch, der den Deckenrand berührt (eine Aussparung am Rand), wird abgelehnt. Dafür passt man den Deckenumriss an.
- **Archicad:** Die Prüfung der IFC-Datei durch den Nutzer steht noch aus.

## Nachweis

- **Neue Testdatei** `src/application/slabs/openings.test.ts` mit 5 Tests:
  - Anlegen über `createDrawing`, Decke gefunden, Ebene, Registry, Dateirundlauf in Schema 51, Migration 50 und Ablehnung eingeschmuggelter Durchbrüche, Filter.
  - Ablehnungen (außerhalb, am Rand, Überschneidung, doppelte ID, schrumpfende Decke) ohne Modelländerung.
  - Körper: 8 Seitenflächen, Deckfläche 23 m², Volumen, Laibung nach innen.
  - Schnitt: durch das Loch zwei Teile, daneben einer.
  - Mengen: 23 m².
  - IFC: `IfcOpeningElement` mit Void an der `IfcSlab`.
  - Zerlegung einer L-Decke mit drei Löchern.
  - Kreuz, Löschen mit der Decke, Bewegen mit der Decke und allein, Ablehnung außerhalb, Eckbearbeitung (Vorschau gleich Übernahme), Textbefehl, Fangpunkte.
- **Angepasst:** Werkzeuggruppen (16 Werkzeuge), Grundrisslisten in `layer-display.test.ts`, Schemaversion 51 in den bestehenden Tests.
- **Prüfungen:** 1533 Tests grün, Typprüfung (App und Benchmarks), Architekturprüfung, Lint und Prettier sauber (`src/routes/README.md` war schon auf main beanstandet). 14-Modell-Hash `e42aa36e…` unverändert.
- **Browser** (Raum 6 × 4 m mit Decke, Geschosshöhe 3 m, Schnitt A-A):
  - Werkzeug und Rechteck per Diagonale ergeben einen Durchbruch mit Diagonalkreuz und Eckgriffen.
  - Eigenschaften „In Decke decke · Fläche 1,463 m²“. Breite 1,20 übernommen, Breite 10 abgelehnt mit „liegt nicht ganz in der Decke“.
  - Kontextmenü mit Kontur versetzen, Bewegen, X-/Y-Achse, Werkzeugeigenschaften, Löschen.
  - Schnitt A-A: Die Decke ist an der Öffnung unterbrochen (zwei Teilflächen).
  - 3D: Loch in der Decke sichtbar.
  - Doppelklick auf das Werkzeug öffnet „Deckendurchbruch – Einstellungen“, Doppelklick auf den Durchbruch sein Elementfenster.
  - Textbefehl „Deckendurchbruch 0,8 x 0,6 m“ auf der Decke abgelehnt, weil er sich mit dem vorhandenen Durchbruch überschneidet.
  - Decke löschen entfernt den Durchbruch mit, Strg+Z stellt beide her.
  - Datei mit zwei Durchbrüchen (Rechteck und Fünfeck) geladen, beide mit Kreuz.
  - Nach frischem Laden keine Konsolenfehler. Die Fehler davor kamen aus dem Modulwechsel des laufenden Servers, als noch ein Projekt mit Schema 50 im Speicher lag.

## Symbol nach Vorlage und runder Durchbruch (03.11.2026)

Nutzervorlage (Bild vom 03.11.2026): Rechteck mit schwarzer Ecke, Kreis mit schwarzem Anteil. Übernommen wird nur die Symbolik: keine Beschriftung, keine Kennung, kein Luftraum. Nach der ersten Fassung hat der Nutzer nachgeschärft: Der Keil soll symmetrisch sein, mit einem Knick als sauberem Versatz der Ecke; der Kreis soll zur Hälfte schwarz sein statt einer dünnen Sichel; im Schnitt soll die Rundung glatt sein.

### Verhalten

- **Eckiges Symbol:**
  - Ein dünner Umriss mit einem schwarzen Keil an der Ecke ganz links, bei zwei gleich weit linken Ecken an der oberen. Beim Rechteck ist das die Ecke oben links, bei einem spitzen Umriss nie die Spitze.
  - Beide Schenkel des Keils laufen gleich weit an den Seiten entlang, so weit wie die kürzere der beiden Seiten.
  - Der Knick ist die Ecke, nach innen versetzt auf der Winkelhalbierenden, mit 12 % der Schenkellänge Abstand zu beiden Seiten. Damit ist der Keil an der Winkelhalbierenden gespiegelt.
  - Fiele der Knick bei einem sehr schmalen Umriss heraus, gibt es keinen Keil.
- **Rundes Symbol:** ein Kreis, dessen obere linke Hälfte schwarz ist, begrenzt durch den Durchmesser von links unten nach rechts oben.
- **Runder Durchbruch (Schema 52):**
  - Erstellung „Kreis: Mittelpunkt und Rand“: erst den Mittelpunkt klicken, dann einen Punkt auf dem Rand.
  - Gespeichert werden Mittelpunkt und Durchmesser.
  - Bearbeiten: Der Durchmesser ist im Eigenschaftsfenster änderbar, bewegt wird der Kreis als Ganzes. Ecken gibt es nicht; Eckaktionen lehnen mit Hinweis ab.
  - Fang: Mittelpunkt und vier Quadrantenpunkte.
  - Textbefehl „Deckendurchbruch ø 20 cm“: legt den Kreis in die Mitte der Decke.
  - IFC als echtes Kreisprofil (`IfcCircleProfileDef`), Mengen mit π r².
- **Geometrie des Kreises:**
  - 3D, Schnitt und die Prüfung „liegt in der Decke“ rechnen mit einem 96-Eck, das den Kreis umschließt. Seine Kanten berühren den Kreis, sodass die Prüfung nie einen Kreis durchlässt, der den Deckenrand oder einen anderen Durchbruch berührt.
  - Die Ecken des 96-Ecks liegen einen halben Schritt neben den Achsen. Ein Schnitt durch die Mitte in x- oder y-Richtung trifft deshalb nie genau eine Ecke.
- **Glatte Rundung:** Die Laibungsflächen eines runden Durchbruchs sind als glatt markiert. Zwischen zwei glatten Flächen zeichnen Schnitt und Ansicht keine Kante; zu sehen sind nur Ober- und Unterkante der Laibung.
- Bestehende Dateien mit Schema 51 laden unverändert. Das strenge v51-Schema lehnt eingeschmuggelte Kreise ab.

### Befunde und Korrekturen

- **Naht in 3D:**
  - Liegt die Brücke von einem Loch zur Deckenecke genau auf der Verlängerung einer Lochkante, entfernte die Dreieckszerlegung einen Punkt als „gerade“, den ein anderes Dreieck noch benutzte. Das ergab eine T-Kreuzung (ein Punkt mitten auf einer Dreieckskante), die als Linie über die Decke sichtbar war.
  - Jetzt nimmt ein strenger Durchgang keine neue Kante durch einen anderen Punkt an und entfernt keinen geraden Punkt, den ein Dreieck schon nutzt oder der als Brückenende noch zweimal im Ring steht.
  - Nur wenn sonst kein Schritt möglich ist, gelten die alten Regeln.
- **Schnitt durch die Kreismitte:** Eine Ecke des Kreisvielecks lag genau auf der Schnittebene. Eine Kante in der Schnittebene liefert der Schnitt aber nicht als Schnittlinie, deshalb schloss sich die geschnittene Decke nicht und blieb ungefüllt. Behoben durch die Lage der Ecken neben den Achsen.

### Grenzen

- Ein Schnitt, der genau durch eine Ecke eines Umrisses läuft, kann die Schnittfläche weiterhin offen lassen. Das ist eine Schwäche der Schnittberechnung bei Kanten in der Schnittebene, sie betrifft alle Bauteile. Beim Kreis tritt sie für Schnitte durch die Mitte nicht mehr auf.
- Das Symbol hat feste Verhältnisse (12 %, Hälfte) und keine Einstellungen.

### Nachweis

- **Tests** in `openings.test.ts`, jetzt 8:
  - Symmetrie des Keils (Quadrat, langes Rechteck, Polygon: gleiche Schenkel, gleicher Abstand des Knicks zu beiden Seiten).
  - Halbkreis.
  - Runder Durchbruch: Laden, Schema 51/52, 96 glatte Laibungsflächen, keine Fugenkanten in der Ansicht, Mengen, IFC-Kreisprofil, Ablehnungen, Bewegen, Durchmesser, Textbefehl, Fang.
  - T-Kreuzung: Jede Innenkante wird von genau zwei Dreiecken geteilt.
  - Schnitt durch die Kreismitte in beiden Achsen: zwei geschlossene Teile. Dieser Test schlägt ohne die Korrektur fehl.
- **Prüfungen:** 1536 Tests grün, Typprüfung, Lint und Architekturprüfung sauber, 14-Modell-Hash `e42aa36e…` unverändert.
- **Browser** (Decke 6 × 4 m mit Rechteck 1,5 × 1 m, Fünfeck und Kreis ø 0,80 m, Schnitt K-K durch die Kreismitte):
  - Grundriss: symmetrische Keile und Halbkreis.
  - Ein Kreis lässt sich mit dem Werkzeug zeichnen, der Durchmesser ist im Eigenschaftsfenster änderbar.
  - Schnitt K-K: Die Decke ist schwarz gefüllt und am Kreis unterbrochen, die Laibung erscheint ohne Fugenlinien.
  - 3D: alle drei Löcher, keine Linie mehr neben dem Fünfeck.
  - Nach frischem Laden keine Konsolenfehler.
