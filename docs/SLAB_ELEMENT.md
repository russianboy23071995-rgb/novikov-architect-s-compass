# Decke als Bauteil, Teil A (28.10.2026)

Basis: main `58b9dae`, Branch `feat/slab-element`. Bezug: N47 (Decken mit Stärke/Höhe), R26-03 (Bauteile einzeln mit Undo, Migration, Dateirundlauf), A08 (Höhen und geschossübergreifende Einflüsse), Aufgabenliste L03.

## Nutzerentscheidungen (28.10.2026)

- **Lage:** Eine Decke, die in einem Geschoss platziert wird, ist die Decke dieses Geschosses. Ihre Oberkante liegt auf dem Rohfußboden des Geschosses darüber (OK Rohfußboden = Kote des oberen Geschosses, im Modell `upperElevation`) plus einem Versatz (Standard 0).
- **Bezugskante oben:** Wie die Wand eine Hauptachse hat, hat die Decke ihre Oberkante als Bezug. Eine Änderung der Stärke (z. B. 0,20 → 0,30 m) behält die Oberkante und verschiebt die Unterkante.
- **Höhenbezüge der Wände:** Wandbezüge sollen sich grundsätzlich auf die Geschosshöhen beziehen, nicht auf Decken. Die bisherige Bindung „bis UK Rohdecke“ mit angenommenen 0,20 m (N22, Schema 26) war ein Zwischenschritt, um eine dazwischenliegende Decke sichtbar anzudeuten. Decken einzubeziehen bleibt erlaubt, ist aber nicht die Zielrichtung. Die Umstellung der Wandbindung ist ein eigener späterer Schritt (Teil C, neu gefasst) und in Teil A nicht enthalten.
- Empfehlungen der Änderungskarte übernommen: Standardstärke 0,20 m, frei änderbar; Polygon, Rechteck und geschlossene Kontur als Erstellung; im Grundriss dünner gestrichelter Umriss mit leichter Füllung, über die Ebene „Decke“ ausblendbar; L- und andere nicht-konvexe Formen erlaubt, keine Löcher.

## Umsetzung Teil A

- `domain/elements/slab/model.ts`: Schema (Umriss als einfaches Polygon, `thickness` > 0, `topOffset`), Standardwerte, abgeleitete Höhen (`slabLevels`, `storeySlabLevels`) und Fläche. Es wird keine Höhe gespeichert; eine neue Geschosshöhe verschiebt die Decke mit. Bei unbekannter Geschosshöhe ist die Höhe `null` (keine erfundene Lage).
- `domain/elements/registry.ts`: Bauteil `slab` („Decke“, Liste `slabs`). Auswahl, Sichtbarkeit, Ebenenzuordnung, Löschen und Navigator laufen über die Registry.
- `domain/project/schema.ts`, `format.ts`, `interop/project-file/load.ts`: Schema 29 mit optionaler Liste `slabs` je Geschoss; Ebenenprüfung, eindeutige IDs, Wiederverwendung bekannter Elemente bei der Geschossprüfung. Migration 28 → 29 ohne Decken; eingeschmuggelte Decken in Schema-28-Dateien werden abgelehnt (strenges v28-Schema).
- `application/slabs/actions.ts`: `addSlab`/`updateSlab` mit eigenem geprüftem Stand (`validateLike`), Standardebene „Decke“. `application/drawing/actions.ts`: `createDrawing` kennt `kind: "slab"` (gemeinsamer Weg für Werkzeug und künftig Text/Sprache/AI).
- Grundriss: `rendering/viewport/layer-display.ts`/`plan-scene.ts` (Decken als erste Zeichenschicht unter Schraffuren und Wänden), `components/cad/PlanSceneRun.tsx`.
- Oberfläche: Werkzeug „Decke“ (Taste S) mit `SlabToolFields` (Erstellung wie Schraffur, Stärke, Versatz OK); `SlabProperties` (OK/UK, Fläche, Stärke, Versatz); Kontextmenü mit Zusammenfassung und Löschen.
- Bewusst gesperrt in Teil A: Verschieben und Umrissbearbeitung von Decken (Kontextmenü ohne Bearbeitungsbefehle, Gruppenbewegung lehnt Decken mit Meldung ab, Direktbearbeitung nimmt keine Decken an). Kein neuer Code in `lib/bim`.

## Nachweis

- Tests in `src/application/drawing/actions.test.ts` (keine neue Testdatei): Anlegen über `createDrawing` mit expliziter Rückkehr zum Startpunkt, Standardebene, Registry, Fläche, OK/UK aus der Geschosshöhe, Dateirundlauf in Schema 29; Stärke behält OK und verschiebt UK, Versatz verschiebt OK, neue Geschosshöhe verschiebt die Decke, unbekannte Geschosshöhe ergibt keine Höhe; Ablehnung von Schmetterlingsumriss, Stärke 0/NaN, doppelter ID, unbekannter Decke ohne Modelländerung; ein Undo je Änderung; Migration 28/27 → 29 und Ablehnung eingeschmuggelter Decken; Grundriss zeichnet Decken vor Schraffuren, Ebenenfilter blendet aus; Löschen; Gruppenbewegung abgelehnt; 3D-Flächen und IFC unverändert (Teil-A-Grenze). `layer-display.test.ts` um die Liste `slabs` ergänzt.
- Leistung (Node, `benchmarks/undo-reuse-profile.ts l`, Schulmodell ohne Decken): Ergebnis-Hash auf main und Branch gleich (`9307d03ffc7250e6`), Bearbeiten/Undo/Redo im Rauschen (Wandfuß-Fangquellen nach Bearbeitung main 31,6/31,8 ms, Branch 28,6–33,9 ms).
- 1337 Tests, Architekturprüfung ohne neue Ausnahme, Typprüfung (App und Benchmarks), Lint (nur bestehende Warnungen), Build.
- Browser (Entwicklungsserver dieses Branches): Werkzeug Decke, Rechteck per Diagonale gezeichnet; gestrichelter Umriss unter der Wand, Eigenschaften „Höhe unbekannt: Geschosshöhe festlegen · Fläche 7,36 m²“ (Beispielprojekt ohne Geschosshöhe); Stärke 0,3 übernommen; zwei Undo entfernen Stärkeänderung und Decke, zwei Redo stellen beide wieder her; Kontextmenü nur mit Werkzeugeigenschaften und Löschen; 3D-Ansicht ohne Fehler, Decke dort noch nicht dargestellt; keine Konsolenfehler.

## Grenzen und nächste Teile

- **Teil B:** Deckenkörper in 3D (Dreieckszerlegung für nicht-konvexe Umrisse; Flächen dürfen nicht als Wandflächen gelten – heute tragen alle 3D-Flächen eine `wallId`), 3D-Auswahl, IFC als `IfcSlab`, Text-/Sprachbefehle, Fangpunkte, Verschieben und Umrissbearbeitung über `application/direct-edit` (nicht über `lib/bim`).
- **Teil C (neu gefasst nach der Nutzerentscheidung):** Wandhöhenbindung auf Geschosshöhen ausrichten; Decken optional einbeziehen, dann als ausdrückliche geschossübergreifende Eingabe nach A08. Wand und Decke überschneiden sich dann im Volumen; Vorrang/Verschneidung für 3D, Mengen und IFC ist dort zu klären.
- Offen für später: Bodenplatte unter dem untersten Geschoss (heute über negativen Versatz darstellbar), Deckendurchbrüche (N48), Schichtaufbau/Material (N42/N47), Löcher, Decke aus Außenwänden.

## Teil B1: 3D-Körper und Auswahl (28.10.2026)

Änderungskarte Teil B mit allen Empfehlungen freigegeben (B1–B3 nacheinander).

- `geometry/polygons/triangulate.ts`: Ohrenschneiden für einfache Umrisse beider Drehrichtungen (L-Formen); gerade Zwischenpunkte ergeben kein Null-Dreieck.
- `rendering/viewport/slab-solid.ts`: geschlossener Deckenkörper – Ober- und Unterseite als Dreiecke, je Umrisskante eine Seitenfläche, Volumen = Fläche × Stärke. Ohne bekannte Geschosshöhe kein Körper.
- `rendering/viewport/storey-solid.ts`: Der Geschossteil enthält die Decken des Geschosses; OK = Geschosskote + Geschosshöhe + Versatz. Beides gehört zum Geschoss selbst und steckt schon im Schlüssel des Geschoss-Zwischenspeichers – keine neue geschossübergreifende Eingabe (A08 eingehalten). Deckenflächen tragen `slab: true`; Wandflächen bleiben unverändert (ohne Feld).
- Wandwege ausgenommen: Wandfuß-Fangquellen und Bewegungsecken überspringen Deckenflächen. Picking (`world-picking.ts`, `window-selection.ts`) liefert „Decke“ statt „Wand“; Verdeckung berücksichtigt Decken als Fläche. Farbe in 3D etwas heller als Wände; Auswahl blau hervorgehoben wie bei Wänden (`BimSolidView`).
- Nachweis: Gleichheits-Hash über 14 Modelle ohne Decke (Geschosskörper, Gebäude, IFC) unverändert `09528ac4…7823253` (`benchmarks/storey-solid-hash.ts`). Neue Tests in `simple-polygon.test.ts` (Zerlegung, Fläche, Drehrichtung) und `working-storey-solid.test.ts` (Wände unverändert, 14 Deckenflächen, OK 3,00/UK 2,80, Volumen, Stärke behält OK, Geschosshöhe verschiebt, unbekannte Höhe ohne Körper, Wandfuß-Quellen und Bewegungsecken unverändert, Picking von oben trifft „Decke“). 1340 Tests grün.
- Browser: Geschosshöhe 3,00 m gesetzt, L-Decke und Rechteckdecke gezeichnet (OK 3,00 · UK 2,80), in 3D heller über der Wand sichtbar, Klick wählt die Decke (blau, Eigenschaften „Decke“), Gegenprobe Klick auf die Wand wählt die Wand; keine Fehler in der Konsole.
- Grenzen: Eine Decke verdeckt in 3D Fangpunkte darunter wie Wände oberer Geschosse (Ebene „Decke“ ausblenden hilft). Wand und Decke überschneiden sich, wenn die Wand bis zur Geschosshöhe reicht (Teil C). Die Wiederherstellungs- und Datei-Übersicht nennt nur Wände/Fenster/Linien/Schraffuren/Bilder – Türen und Decken fehlen dort schon bisher (kleiner Folgepunkt).

## Teil B2: IFC (28.10.2026)

- `interop/ifc/writer.ts`: je Decke ein `IfcSlab` (PredefinedType FLOOR) im Geschoss, dem sie gehört; Platzierung an der Unterkante relativ zur Geschossplatzierung, Umriss (gegen den Uhrzeigersinn) als `IfcArbitraryClosedProfileDef`, nach oben um die Stärke extrudiert; im Geschoss enthalten (`IfcRelContainedInSpatialStructure`); Eigenschaften `NOVIKOV_BIM` mit SourceId, Thickness, TopOffset. Ohne bekannte Geschosshöhe kein `IfcSlab` (wie in 3D).
- Abnahmemodell `benchmarks/slab-ifc-acceptance.ts` über die normalen Aktionen: Erdgeschoss 3,00 m mit Rechteckdecke 0,20 m (8,30 × 6,30 m über die Außenkanten), 1. Obergeschoss 2,80 m mit L-förmiger Decke 0,25 m; Wände je bis Deckenunterkante, je ein Fenster. Datei: `node --experimental-strip-types scripts/generate-slab-acceptance-ifc.mjs <Ordner>` → `NOVIKOV-Decken-Test.ifc`.
- Nachweis: Test in `src/interop/ifc/door.test.ts` liest die Datei zurück (zwei `IfcSlab` FLOOR, Unterkante EG 2,80 / OG 2,55 über Geschoss, Extrusion = Stärke, 4 bzw. 6 Umrisspunkte, Enthaltensein im richtigen Geschoss, Eigenschaft Thickness; ohne Geschosshöhe kein `IfcSlab`). Gleichheits-Hash 14 Modelle ohne Decke unverändert.
- Befund bei der Umsetzung (Fehler aus B1/Teil A, mit behoben): Ein Geschoss nur mit Decke und ohne Wände bekam keinen 3D-Körper (Gebäudeaufbau übersprang Geschosse ohne Wände), und „Alles anzeigen“ im Grundriss ignorierte Decken. Beide Stellen zählen Decken jetzt mit; Tests in actions.test.ts und bim-view.test.ts.
- Offen: Archicad-Import durch den Nutzer (Datei übergeben). Kein Schichtaufbau/Material im IFC.

## Teil B3: Bearbeiten (28.10.2026)

- Verschieben: Decken nehmen an der gemeinsamen Gruppenbewegung teil (`domain/project/prepared-translation.ts`): allein oder mit Wänden, in 2D und 3D, frei oder auf X-/Y-Achse, Maus und Zahleneingabe, ein Undo-Schritt. Die Vorschau-Geometrie trägt die Geschosshöhe (`ModelGeometry` erlaubt sie optional), damit die bewegte Decke in der 3D-Vorschau sichtbar bleibt. Kontextmenü der Decke: Element frei bewegen, X-/Y-Achse, Werkzeugeigenschaften, Löschen.
- Textbefehle (`application/slabs/command.ts`, im gemeinsamen Befehlsweg): „Deckenstärke 25 cm“, „Deckenversatz auf -5 cm“ (m/cm/mm), nur bei ausgewählter Decke; Stärke ≤ 0 abgelehnt.
- Fang: Deckenecken und Kantenmitten als Fangpunkte wie ein Schraffurumriss (`project-references.ts`, angehängt nach den bisherigen Arten, deren Reihenfolge unverändert bleibt); Deckenecken sind Ursprünge der 3D-Bewegung (`movement-origin.ts`). Wandfuß-Fangquellen bleiben ohne Decken.
- Noch nicht: einzelne Eckpunkte verschieben, Kante strecken, Kontur versetzen (Bearbeitungstyp liegt in `lib/bim/direct-edit.ts`; eigener Umbau-PR).
- Nachweis: Tests in `actions.test.ts` (Verschieben allein und mit Wand, Undo, Befehle mit Einheiten und Fehlern, 6 Ecken + 6 Kantenmitten als Fangpunkte) und `working-storey-solid.test.ts` (Wandecken unverändert, zusätzlich 12 Deckenecken). Bewegungsprofile l gegen main: Ergebnis-Hashes gleich (Z/XY-Übernehmen `4ead4b38…`/`2000f758…`, Bewegungsstart `98d360b0…`). Gleichheits-Hash 14 Modelle unverändert. 1342 Tests. Browser: Decke über Menü „Element auf X-Achse“ per Zahleneingabe 2 m verschoben; Befehl „Deckenstärke 25 cm“ mit Vorschau 0,2 → 0,25 m übernommen; keine Konsolenfehler.

## Teil C1: Wandhöhe an Geschoss gebunden (29.10.2026)

Nutzerentscheidung 29.10.2026: Die Bindung ist eine Einstellung der Wand. Gebunden = Oberkante auf OK Rohfußboden des darüberliegenden Geschosses (eigene Geschosskote + eigene Geschosshöhe) plus Zusatzhöhe (z. B. +0,50 m Attika); frei = Höhe per Eingabe. Decken haben keinen Einfluss mehr auf die Wandhöhe. Eine eingegebene Wandhöhe löst die Bindung.

- Fachmodell (`domain/elements/wall/height-binding.ts`, `heights.ts`): Bindung `{ kind: "storey", topOffset }` ohne gespeicherte Deckenstärke und ohne Verweis auf ein anderes Geschoss. Gelesen wird nur die eigene Geschosshöhe (A08 ohne Sonderfall); dadurch lässt sich auch das oberste Geschoss binden, und ein darüber eingefügtes Geschoss ändert nichts. Ohne bekannte Geschosshöhe keine Bindung.
- Schema 30 mit Migration: „UK Rohdecke, Versatz x, Stärke d“ (Schema 26–29) wird „Geschoss, Zusatzhöhe x − d“; jede Wand behält ihre Oberkante. Ein Bezug, der nicht auf das unmittelbar darüberliegende Geschoss zeigt, wird wie bisher abgelehnt.
- Befund (Fehler aus Schema 26, mit behoben): Dateien mit Schema 26/27 und gebundenen Wänden ließen sich nicht laden, weil die schrittweise Migration die abgeleitete Platzhalterhöhe 0 erneut prüfte. Die Migration lässt diese Höhe jetzt bei jedem Zwischenschritt weg (`load.ts`); auf main nachgestellt und bestätigt.
- Anwendung: `setWallHeightRule` mit `fixed` oder `storey`; `updateWall` mit neuer Höhe löst die Bindung statt abzulehnen; Z-Verschieben verschiebt die Zusatzhöhe mit (Höhe unverändert).
- Oberfläche (`WallHeightProperties`): Höhenmodus „Feste Höhe / An Geschoss gebunden“, Feld „Zusatzhöhe (m)“, Feld „Wandhöhe (m)“ immer sichtbar, Bezug „OK Rohfußboden darüber“ und berechnete Höhe.
- Nachweis: Gleichheits-Hash 14 Modelle unverändert `09528ac4…7823253`. Drei Modelle mit 4, 6 und 64 gebundenen Wänden: Wandhöhen, Gebäudekörper und IFC nach Laden der auf main gespeicherten Schema-29-Dateien und nach Neuaufbau identisch zu main. Z- und XY-Verschieben in drei Modellen (192, 64 und 4 gebundene Wände): Ergebnis von main (migriert) gleich Ergebnis des Branches. Neue Tests in `heights.test.ts` (Regel, Attika im obersten Geschoss, Einfügen eines Geschosses, Lösen per Höheneingabe, Migration aus Schema 26–29, Ablehnung vermischter Formate). 1343 Tests grün.
- Browser: Geschosshöhe 3,00 m, Wand gebunden → 3,00 m; Zusatzhöhe 0,5 → 3,50 m (oberstes Geschoss); Wandhöhe 2,6 eingegeben → frei 2,60 m; erneut gebunden, Undo/Redo; Geschosshöhe 3,20 m → Wand 3,20 m. Keine Konsolenfehler nach Neuladen.
- Offen (C3, eigene Karte): Mit Zusatzhöhe 0 ragt die Wand in die Decke; Vorrang/Verschneidung für 3D, Mengen und IFC. C2 (Decke als optionaler Bezug) zurückgestellt.

## Nachtrag: Übersichten zählen Türen und Decken (29.10.2026)

- `projectElementCounts` (Dialog „Projektdatei laden?“) und `recoveryContentSummary` (Wiederherstellung) zählen zusätzlich Türen und Decken über alle Geschosse; die in Teil B genannte Lücke ist geschlossen.
- Nachweis: Test in `recovery-catalog.test.ts` (Abnahmehaus mit zwei Decken und einer Tür im OG, Arbeitsgeschoss EG); 1344 Tests grün. Browser: Wiederherstellung zeigt „… 1 Fenster · 0 Türen · 1 Decken“. Der Ladedialog wurde nicht im Browser geöffnet (Dateiauswahl), er nutzt dieselbe geprüfte Zählung.
