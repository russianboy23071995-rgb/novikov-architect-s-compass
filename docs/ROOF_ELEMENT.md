# Dach als Bauteil (N61, AUFGABENLISTE L04)

Einflächiges Steildach. Kein Walmdach, keine Dachlandschaft, kein automatisches Trimmen von Wänden (N62, V09). Umsetzung in fünf PRs nach freigegebener Änderungskarte (29.10.2026).

| PR  | Inhalt                                                                                                                    | Stand    |
| --- | ------------------------------------------------------------------------------------------------------------------------- | -------- |
| D1  | Modell, Flächen- und Ringgeometrie, Prüfung, Aktionen, Schema 31 mit Migration                                            | erledigt |
| D2  | geschlossener 3D-Körper, Auswahl/Fang in 3D, Mitwandern bei Geschosshöhe                                                  | erledigt |
| D3  | Werkzeug (Polygon, Diagonale, Seite + dritter Punkt, Kontur), Leiste und Doppelklick-Fenster, Eigenschaften, Umriss, Undo | erledigt |
| D4  | Grundriss im eigenen Geschoss: Schnitt bei 1 m kräftig, darunter dünn, darüber gestrichelt (Untersicht)                   | erledigt |
| D5  | Datei/Recovery, IFC mit Archicad-Testdatei, Browser-Abnahme, Leistung im Schulmodell                                      | erledigt |

## Nutzerentscheidungen (29.10.2026)

- **Bezugslinie und Höhe:** Der Nutzer zieht im Grundriss zuerst die Bezugslinie (zwei Punkte) und wählt die Seite, zu der das Dach ansteigt. Die Bezugshöhe beginnt mit 0,00 über dem eigenen Geschoss und ist später änderbar. Sie meint die **Unterseite** des Dachs an der Bezugslinie (Bezug für spätere Höhenlinien unter der Dachschräge, N33/N34).
- **Stärke:** senkrecht zur Dachfläche; die Oberseite liegt Stärke / cos(Neigung) über der Unterseite.
- **Umriss:** der **äußere Dachrand, von oben gesehen**. Bei nicht senkrechtem Abschluss liegt die innere Kante der Abschlussfläche weiter innen; nichts ragt über den gezeichneten Umriss hinaus.
- **Abschlüsse:** Traufe (Kante parallel zur Bezugslinie, Dach steigt nach innen) und obere Kante (parallel, Dach fällt nach innen) jeweils „vertikal“, „rechtwinklig zur Dachfläche“ oder „horizontal“; alle anderen Kanten (Ortgang, schräge Kanten) vertikal. „Horizontal“ gibt es nur an diesen parallelen Kanten.
- **Geschosshöhe:** Das Dach gehört genau einem Geschoss; ändert sich die Höhe eines Geschosses darunter, wandert es mit. Die Höhe des eigenen Geschosses ändert das Dach nicht.
- **Darstellung (D4):** nur im eigenen Geschoss, Schnittebene 1,00 m über dem Geschossboden. Andere Geschosse zeigen das Dach vorerst nicht (Gast-Anzeige N62/L02). Der heutige Grundriss ist kein echter Schnitt (Fenster werden unabhängig von der Brüstung gezeigt); die 1-m-Ebene gilt nur für das Dach.
- **Trimmen (später, V09):** Die Wand hält einen Trimmverweis auf das Dach; der Schnitt wird jeweils aus dem aktuellen Dach abgeleitet. „Trimmung aufheben“ entfernt den Verweis (Masterplan §8).

## Teil D1: Modell und Geometrie

Beispiel (Bezugslinie auf der X-Achse, Steigung nach +Y, 45°, Stärke d = 0,20 m, Bezugshöhe h):

- Unterseite z(y) = Geschosskote + h + y · tan 45°; Oberseite 0,20 / cos 45° = 0,283 m darüber.
- Zwei Meter von der Bezugslinie entfernt liegen Unter- und Oberseite je 2,00 m höher.

Abschlüsse an der Traufe (Umriss bei y = 0):

| Abschluss    | Oberseite endet bei | Unterseite endet bei  | Fläche                          |
| ------------ | ------------------- | --------------------- | ------------------------------- |
| vertikal     | y = 0               | y = 0                 | senkrecht, 0,283 m hoch         |
| rechtwinklig | y = 0               | y = d · sin = 0,141 m | rechtwinklig zur Fläche, 0,20 m |
| horizontal   | y = 0               | y = d / sin = 0,283 m | waagerechte Untersicht          |

An der oberen Kante umgekehrt: Die Unterseite endet am Umriss, die Oberseite um d · sin bzw. d / sin weiter innen. Reicht die Tiefe des Dachs für die Versätze nicht, meldet das Programm „Das Dach ist für die gewählten Abschlüsse zu schmal …“ statt einen falschen Körper zu bilden.

Umsetzung:

- `src/domain/elements/roof/geometry.ts`: `roofFrame`, `roofUndersideAt`, `roofTopAt` (Höhen über dem Geschossboden), `roofFaceRings` (Grundrissringe von Ober- und Unterseite gegen den Uhrzeigersinn, Kantenrollen Traufe/obere Kante/Ortgang, Versatz je Kante mit Schnitt der versetzten Kantenlinien, Prüfung auf gültige, nicht umgeklappte Ringe).
- `src/domain/elements/roof/model.ts`: `roofSchema` (Schema 31; jedes gespeicherte Dach ergibt einen gültigen Körper), `ROOF_DEFAULTS` (35°, 0,24 m, Bezugshöhe 0, vertikale Abschlüsse), `roofStoreyElevation` (Geschosskote, nie gespeichert).
- `src/application/roofs/actions.ts`: `addRoof` (Standardebene Dach), `updateRoof` (eine geprüfte Änderung; ungültig = Projekt unverändert).
- Schema 31 (`roofs` je Geschoss, optional), Registry `roof`, Migration 30 → 31 (Dateien ohne Dächer; eine untergeschobene Dachliste in einer 30er Datei wird abgelehnt). Schema 29 lädt direkt nach 31.
- In der Oberfläche ist ein Dach in D1 nicht auswählbar; Bearbeitungsaktionen schließen es ausdrücklich aus, bis D3 sie anbietet.

Nachweis: Tests in `src/domain/storeys/heights.test.ts` (Prüffall 45°, Steigseite und Linienrichtung, alle Abschlüsse gegen von Hand gerechnete Werte inkl. Länge und Rechtwinkligkeit der Abschlussfläche, L-Form, Umlaufsinn, zu schmal, ungültige Eingaben, Aktionen, Ebene, Geschosshöhe EG/OG) und `src/interop/project-file/load.test.ts` (Migration 30 → 31 inkl. gebundener Wände ohne gespeicherte Höhe, untergeschobene Dächer, Speichern/Laden mit Dach). IFC-Export der Decken-Testdatei byteweise unverändert. 1358 Tests grün.

Befund beim Nachweis: Der Migrationsschritt 30 → 31 musste die abgeleiteten Höhen gebundener Wände wie die Schritte 26–28 vor der Endprüfung entfernen (`withoutBoundHeights`); ohne diesen Schritt hätten echte 30er Dateien mit gebundenen Wänden nicht geladen.

## Teil D2: 3D-Körper

- `src/rendering/viewport/roof-solid.ts` (`roofBody`): geschlossener Körper aus den Ringen von D1. Ober- und Unterseite liegen auf ihren geneigten Ebenen (Ohrenschneiden für nicht konvexe Umrisse), je Umrisskante eine ebene Viereckfläche (Ortgang senkrecht, Traufe und obere Kante nach Abschluss). Volumen über den Gaußschen Satz aus der geschlossenen Hülle.
- Im Geschossteil nach den Decken (`storey-solid.ts`); Höhen nur aus Geschosskote und eigenen Dachwerten, also gilt jeder bisherige Geschoss-Zwischenspeicher weiter (A08). Geschosse nur mit Dach erhalten einen Körper.
- Dachflächen tragen `roof`: eigene warmgraue Farbe, Darstellungsvorrang wie die Decke (C3 Variante A), nicht im Wandfuß-Fang; Auswahl per Klick in 3D wählt das Dach, Hervorhebung wie bei Wand und Decke. Dachecken sind wie Deckenecken 3D-Bewegungsecken.
- Bis D3: Kontextmenü zeigt beim Dach nur „Löschen“ (Löschen läuft generisch über die Registry, Undo inklusive). Verschieben einer Auswahl mit Dach meldet „Dächer lassen sich noch nicht verschieben …“ statt das Dach still zu übergehen; Z-Bewegung nimmt ohnehin nur Wände/Fenster.
- Grundriss-Fangpunkte an Dachecken kommen mit D4, wenn der Grundriss das Dach zeichnet.

Nachweis: Test in `src/rendering/viewport/working-storey-solid.test.ts` (Hülle geschlossen und gleichsinnig orientiert für Rechteck, rechtwinklige Abschlüsse und L-Form; Volumen gegen 16 · d/cos bzw. 4 · d · (4 − d·sin)/cos; tiefster/höchster Punkt im OG; horizontale Traufe als nach unten weisende waagerechte Fläche; EG-Höhe hebt das Dach, eigene Geschosshöhe nicht; Vorrang und Farbe; Auswahl von oben trifft das Dach; Verschieben gesperrt). Gleichheits-Hash der 14 Modelle (Geschossteile, Gebäudekörper, IFC) unverändert `09528ac4…7823253`. 1359 Tests grün. Browser: Projektdatei mit Pultdach (20°, Traufe horizontal, obere Kante rechtwinklig) über den normalen Ladedialog geöffnet; Dach in 3D auf OK Rohfußboden OG, Klick wählt und hebt es hervor, Menü „Dach · Löschen“, Löschen und Undo; keine Konsolenfehler. Aufgefallen: Der Ladedialog zählt Dächer noch nicht (D5).

## Teil D3: Werkzeug, Eigenschaften, Bearbeitung

**Werkzeug „Dach“** (eigener Knopf; noch ohne Buchstaben, da D/Strg+D laut Masterplan §8 für Drehen offen sind):

1. Bezugslinie: zwei Punkte (gemeinsamer Zeichenweg mit Fang und Zahleneingabe).
2. Steigseite: Klick auf die Seite der Bezugslinie, zu der das Dach ansteigt; ein Pfeil folgt der Maus.
3. Umriss (äußerer Dachrand) mit den gemeinsamen Zeichenarten: Polygon per Klick (Schließen am Startpunkt, Doppelklick, Enter), Rechteck über die Diagonale, **gedrehtes Rechteck über Seite + dritten Punkt** (die drei Punkte bestimmen keine drei Dachhöhen; so auch in Leiste und Fenster beschriftet), geschlossene Kontur übernehmen.

Esc oder Werkzeugwechsel bricht ab und verwirft Bezugslinie und Steigseite. Ein abgelehntes Dach (z. B. zu schmal für die Abschlüsse) zeigt die deutsche Meldung der Prüfung; nichts wird angelegt. Kein zweiter Polygon- oder Fangweg.

**Werkzeugvorgaben:** Neigung, Stärke, Bezugshöhe (Unterseite), Abschluss Traufe und obere Kante, Ebene (`useToolDefaults`, nicht im Projekt und nicht im Undo-Verlauf). Werkzeugleiste und das Fenster „Dach-Einstellungen“ (Doppelklick auf den Knopf, `FloatingPanel` + `SettingsSections`, Bereiche Form, Abschlüsse, Erstellung) bearbeiten denselben Entwurf; ein Feld folgt Änderungen aus dem anderen. Ein Einfachklick wählt weiterhin nur das Werkzeug. Doppelklick-Fenster für andere Werkzeuge ist ein eigener späterer Schritt.

**Eigenschaften eines gewählten Dachs** (`RoofProperties`): Neigung, Stärke, Bezugshöhe (gemeinsam übernommen), Abschluss Traufe/obere Kante, Ebene, „Steigseite umkehren“ und Anzeige der Unterseitenhöhe an der Bezugslinie. Jede Änderung ein `updateRoof`, ein Undo-Schritt; abgelehnte Werte zeigen die Meldung und ändern nichts.

**Grundriss (vorläufig, D4 ersetzt die Darstellung):** Umriss gestrichelt in Wandkonturstärke (Untersicht, über der späteren Schnittebene), Inneres anklickbar wie bei der Decke, in der Zeichenreihenfolge nach der Decke. Bei Auswahl Bezugslinie (Strichpunkt) und Steigpfeil. Eckgriffe „Dachecke n“, Fangpunkte „Dach · Ecke n“ und Kantenmitten.

**Bearbeitung wie bei der Decke:** Ecke anklicken = Punkt frei bewegen, Ecke auf Ecke = Ecke löschen, Rechtsklick = Punktmenü, Seite strecken, Knicken, Kontur versetzen (konvex), Element frei bewegen, auf X-/Y-Achse; in 3D nur als Ganzes. Umrissänderungen behalten die Bezugslinie; Verschieben nimmt sie mit. Die Vorschau des Dachs nutzt den vollständigen Prüfweg (kein vorbereiteter Teilweg wie bei Schraffur/Decke).

Befund beim Nachweis: Die Gruppenbewegung über mehrere Geschosse sammelte ihre Elemente und schrieb das bewegte Geschoss jeweils ohne Dächer zurück. „Element frei bewegen“ wäre mit „Ungültige Bewegungsauswahl“ gescheitert bzw. hätte nur die Vorschau bewegt. Beides ist ergänzt und im Test abgedeckt.

Nachweis: Tests in `src/application/drawing/actions.test.ts` (Zeichnen über `createDrawing` inkl. Rücksprung zum Start, Ebene Dach, Ablehnung „zu schmal“; Ecke, Seite, Knicken, Versatz behalten die Bezugslinie; ein Undo-Schritt für Bearbeitung und Eigenschaft) und `src/rendering/viewport/working-storey-solid.test.ts` (Gruppenbewegung Vorschau = Übernahme mit Bezugslinie, Einzelbewegung gleich, Eckbearbeitung behält Bezugslinie), `layer-display.test.ts` (Planliste `roofs`). Gleichheits-Hash der 14 Modelle unverändert `09528ac4…7823253`. 1360 Tests grün.

Browser: Werkzeug Dach gewählt (Leiste zeigt Phase 1 und alle Vorgaben), Bezugslinie mit zwei Punkten, Phase 2 mit Pfeil zur Maus („Klick: steigt hierhin“), Klick oberhalb der Linie, Umriss als Polygon per Klick auf den Startpunkt geschlossen; Dach gewählt mit Eigenschaften, gestricheltem Umriss, Bezugslinie, Steigpfeil, Eck- und Kantengriffen, Menü mit Versetzen/Bewegen/X/Y/Löschen. Neigung 35 → 45 in den Eigenschaften übernommen; 3D zeigt das geneigte Dach, Menü in 3D nur Bewegen/X/Y/Löschen. Doppelklick auf den Knopf öffnet „Dach-Einstellungen“; Neigung 40 im Fenster erscheint sofort in der Leiste. Ecke 3 per Klick bewegt, Bezugslinie unverändert. Drei Undo-Schritte (Ecke, Neigung, Dach), danach Rückgängig gesperrt – die Werkzeugvorgabe ist nicht im Verlauf. Keine Konsolenfehler.

## Teil D4: Grundriss mit Schnitt bei 1,00 m

Darstellung im eigenen Geschoss (`src/rendering/viewport/roof-plan.ts`, in der Planszene je Dach einmal abgeleitet):

- **Schnitt:** Die waagerechte Ebene 1,00 m über dem Geschossboden (`PLAN_CUT_HEIGHT`) schneidet den echten geschlossenen Dachkörper aus D2 (`sectionLoops`: Schnittpunkte der Körperkanten, zu geschlossenen Konturen verkettet, Zwischenpunkte auf geraden Kanten entfernt). So stimmen auch rechtwinklige/waagerechte Abschlüsse und L-Formen. Dargestellt wie eine geschnittene Wand: Füllung `var(--muted-foreground)` 55 %, Kontur in Wandkonturstärke.
- **Darunter** (Teil des Umrisses, dessen Oberseite unter 1,00 m liegt; von oben gesehen): dünne durchgezogene Linie.
- **Darüber** (Teil des Umrisses, dessen Unterseite über 1,00 m liegt; Untersicht): dünn gestrichelt.
- Das Innere bleibt ohne sichtbare Kontur anklickbar; Griffe, Fangpunkte, Bezugslinie und Steigpfeil wie in D3.
- Höhen relativ zum Geschossboden: Eine geänderte Geschosshöhe darunter hebt das Dach in 3D, das Grundrissbild im eigenen Geschoss bleibt gleich. Andere Geschosse zeigen das Dach nicht (Gast-Anzeige N62/L02). Wände bleiben unverändert dargestellt (der Grundriss ist kein echter Schnitt).
- Noch nicht: innere Kanten nicht senkrechter Abschlüsse als eigene Linie, weitere Schnitthöhen oder Höhenlinien (Raumwerkzeug), Ansichtseinstellung für Untersicht/Überkopfkonturen.

Nachweis: Test in `src/rendering/viewport/working-storey-solid.test.ts` gegen von Hand gerechnete Lagen (45°: Schnitt y = 1 − 0,2·√2 … 1; 30°; Stärke 0,40 m; Bezugshöhe −3 m mit Schnitt an der oberen Kante; Bezugshöhe 1,50 m ganz darüber; L-Form nur im oberen Flügel; Längen der Teile darunter/darüber; Geschosshöhe ändert das eigene Bild nicht; anderes Geschoss ohne Dach). Gleichheits-Hash der 14 Modelle unverändert. 1361 Tests grün. Browser: Dach im EG mit 35°, 0,24 m, Bezugshöhe 0 gezeichnet; dünne Linien zur Traufe, grauer Schnittstreifen 0,418 m tief (= 0,24 / cos 35° / tan 35°), gestrichelte Untersicht; Undo; keine Konsolenfehler.

## Teil D5: Datei, Wiederherstellung, IFC, Leistung, Schlussabnahme

- **Übersichten:** Ladedialog („Projektdatei laden?“) und Wiederherstellung zählen Dächer (`projectElementCounts`, `recoveryContentSummary`).
- **Datei und Wiederherstellung:** Ein Projekt mit Dach übersteht Speichern/Laden und den Wiederherstellungs-Codec unverändert (Test).
- **IFC:** je Dach ein `IfcRoof` (`.SHED_ROOF.`, im Geschoss enthalten), das eine `IfcSlab` `.ROOF.` aggregiert. Deren Körper ist der geschlossene Dachkörper als `IfcFacetedBrep` (dieselben Flächen wie in 3D, gemeinsame Punkte, Koordinaten relativ zur Geschossplatzierung). Satz `NOVIKOV_BIM`: PitchDegrees, Thickness, ReferenceHeight, Rise, EaveCut, TopCut. Die Körperberechnung liegt dafür jetzt in der Domain (`domain/elements/roof/body.ts`); 3D nutzt sie unverändert. Projekte ohne Dach exportieren byteweise gleich (Decken-Testdatei vom 28.10.).
- **Archicad-Prüfdatei:** `NOVIKOV-Dach-Test.ifc` (`scripts/generate-roof-acceptance-ifc.mjs`, `benchmarks/roof-ifc-acceptance.ts`): Decken-Abnahmehaus, im OG statt der Decke ein Pultdach auf den OG-Wänden (Unterseite 2,55 m an der Außenfläche), 0,50 m Überstand, 15°, 0,24 m, Traufe horizontal, obere Kante rechtwinklig. Ein unabhängiger Viewer ist hier nur über den Archicad-Import des Nutzers möglich; bis dahin gilt der IFC-Weg als technisch geprüft, nicht als in Archicad bestätigt.
- **Leistung** (`benchmarks/roof-performance.ts`, Schulmodell mit 3 Flügeln, 240 Wände, 20 Dächer à 34 × 5 m im obersten Geschoss, Median kalt): Gebäudekörper 151 → 152 ms, Grundriss OG 49 → 50 ms, IFC 389 → 381 ms. Dächer verursachen keinen messbaren Mehraufwand.
- **Grenzen des ersten Dachs:** kein Walmdach, keine Dachlandschaft, keine Gauben oder Löcher (N62); kein Trimmen von Wänden (V09, Entscheidung in Masterplan §8); Dach nur im eigenen Geschoss sichtbar (Gast-Anzeige N62/L02); keine Materialschichten oder Dachmengen.

Nachweis: Tests in `recovery-catalog.test.ts` (Übersichten, Datei- und Wiederherstellungsrundlauf mit Dach) und `src/interop/ifc/door.test.ts` (IfcRoof/IfcSlab ROOF/Aggregation/Enthaltensein, geschlossene Hülle mit jeder Kante genau einmal je Richtung, Höhen gleich dem Dachkörper, Eigenschaften, alle Verweise vorhanden). 14-Modell-Hash unverändert. 1362 Tests grün. Browser: Abnahmehaus über den Ladedialog geöffnet („… 1 Decken · 1 Dächer …“), OG-Grundriss zeigt das Dach ganz über der Schnittebene gestrichelt, 3D zeigt das Pultdach auf den OG-Wänden; Laden per Undo zurückgenommen; keine Konsolenfehler.
