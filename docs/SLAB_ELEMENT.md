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
