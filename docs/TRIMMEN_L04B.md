# L04b – Wände an Dachflächen trimmen

Stand 30.10.2026. Vom Nutzer freigegeben („Du kannst mit L04b starten“), vorher K1 (PR513) und K2 (PR514) erledigt. Grundlage: Masterplan §8 (Entscheidung 29.10.2026: Die Wand hält einen Trimmverweis auf das Dach, der Schnitt wird jeweils aus dem aktuellen Dach abgeleitet, „Trimmung aufheben“ entfernt den Verweis; geschossübergreifend erlaubt, A08).

## Bedienablauf (Nutzervorgabe 30.10.2026)

1. Eine oder mehrere Wände und genau ein Dach auswählen – idealerweise in 3D (Strg/Cmd+Klick), im Grundriss auch mit der Tab-Auswahl.
2. Befehl „Trimmen…“ über das Rechtsklickmenü oder das Modify-Menü (beide Einträge existieren seit K1, noch ausgegraut).
3. Bestätigungsfenster, z. B. „2 Wände an Dach ‚og-dach' trimmen?“ mit [Trimmen] / [Abbrechen].
4. Nach Bestätigung trimmen, ein Undo-Schritt. „Trimmung aufheben“ im selben Menü und in den Wand-Eigenschaften („Getrimmt an: Dach …“).

## Entscheidungen (wie empfohlen freigegeben)

- **Q:** Getrimmt wird an der **Dachunterseite** (Wand endet unter dem Dach).
- **R:** **Bis zum Dach führen:** Die Wandoberkante folgt der Dachfläche (zu niedrige Wände werden hochgezogen, zu hohe gekappt). Die gespeicherte Wandhöhe bleibt und gilt wieder nach „Trimmung aufheben“.
- **S:** Würde ein Fenster/eine Tür über die Dachfläche ragen, wird die Änderung **mit Meldung abgelehnt** (auch beim späteren Verschieben/Ändern des Dachs) – nie stillschweigend abschneiden.
- **T:** Die Dachebene gilt für die **ganze Wandlänge** (gedachte Verlängerung); Trimmen nur innerhalb des Dachumrisses später.
- **U:** **Ein Dach je Wand**; mehrere Dächer (Giebel unter Satteldach) später, bis dahin Wand am First teilen.

## Teile und Aufwand

| Teil | Inhalt | Aufwand |
| --- | --- | --- |
| 1 | Schema 35: optionaler Trimmverweis der Wand auf ein Dach (auch anderes Geschoss); Prüfung, dass es existiert; Dach löschen entfernt seine Trimmungen atomar; Migration 34 → 35 | 15 % |
| 2 | Geometrie: allgemeiner Baustein „Körper an Ebene kappen“ für den Wandkörper mit Öffnungen, Schnittfläche geschlossen | 30 % |
| 3 | Einbindung 3D/Auswahl/Zwischenspeicher: Dachebene als ausdrückliche Eingabe der Wand, Teil jedes Wiederverwendungsschlüssels (wie `resolveBoundWallHeights`, Masterplan A08) | 15 % |
| 4 | Bedienung wie oben (Rechtsklick/Modify, Bestätigung, Eigenschaften) | 15 % |
| 5 | IFC: getrimmte Wände als facettierter Körper (wie Dach), Öffnungen bleiben; Archicad-Prüfdatei | 15 % |
| 6 | Tests, Browser-Abnahme, Doku, Status; 14-Modell-Hash muss unverändert bleiben | 10 % |

Vorschlag: zwei PRs – (1) Modell, Geometrie, 3D; (2) Bedienung, IFC, Archicad-Datei.

Nicht enthalten: Kniestock-Schnittdarstellung im Grundriss (Wand weiter bei 1 m geschnitten), Gast-Anzeige (L02), automatisches Trimmen ohne Auswahl.

Technische Ansatzpunkte: Wandkörper `src/domain/elements/wall/contour-solid.ts` (`extrudeProfileWithOpenings`), Höhenbindung `src/domain/elements/wall/height-binding.ts`, Dachebene `roofUndersideAt`/`roofFrame` in `src/domain/elements/roof/geometry.ts`, IFC-Wand in `src/interop/ifc/writer.ts` (heute Extrusion; Dach als `IFCFACETEDBREP` als Vorbild), Menüeinträge in `src/components/cad/CadWorkspace.tsx` (`contextEntries`, `later(...)`) und `TopToolbar.tsx` (Modify).

## Teil 1 umgesetzt (31.10.2026): Modell, Geometrie, 3D

- Schema 35 (`src/domain/project/schema.ts`): Wand mit optionalem `roofTrim: { roofId }`. Der Schnitt `trimPlane` (Ebene a + b·x + c·y über dem Wandfuß, höchster/niedrigster Wert über den Wandkörperecken) wird bei jeder Modellprüfung neu aus dem aktuellen Dach berechnet (`resolveRoofTrims`, `src/domain/elements/wall/roof-trim.ts`), auch geschossübergreifend, und nie gespeichert (`storage-data.ts` entfernt ihn). Dateien aus Schema 34 laden unverändert; ein untergeschobener Trimmverweis in einer 34er Datei wird abgelehnt.
- Prüfungen: Dach muss existieren; die Dachfläche muss über der ganzen Wand mindestens 0,10 m über dem Wandfuß liegen; kein Fenster und keine Tür darf über die Dachfläche ragen (Entscheidung S, auch wenn später das Dach verschoben wird). Ein Fenster oberhalb der gespeicherten, aber unter der getrimmten Wandhöhe ist erlaubt (`effectiveWallHeight`).
- Geometrie (`src/geometry/solids/plane-trim.ts`, `trimExtrusionBelowPlane`): Der Wandkörper wird bis zum höchsten Punkt der Dachebene über seinem Umriss hochgezogen (Entscheidung R) und an der Ebene gekappt; jede Fläche wird geschnitten, oben schließt der auf die Ebene gehobene Umriss den Körper. Verbundene und freistehende Wände nutzen denselben Weg; ungetrimmte Wände bleiben unverändert (14-Modell-Hash gleich).
- Aktionen (`src/application/walls/roof-trim.ts`): `trimWallsToRoof`, `untrimWalls` (je ein Undo-Schritt). Dach löschen hebt seine Trimmungen im selben Schritt auf („1 Wandtrimmung wird aufgehoben“).
- Noch nicht: Bedienung (Menü, Bestätigung, Eigenschaften), IFC-Export der schrägen Wand (bis Teil 2 exportiert IFC getrimmte Wände noch als Quader mit gespeicherter Höhe), Archicad-Prüfdatei.

Nachweis: Tests in `src/domain/elements/wall/heights.test.ts` (freistehende Wand unter 30°-Dach: Ebene, Volumen exakt 0,2 · 6 · (2 + 3·tan 30°), Oberkante 2 + 6·tan 30°; Fenster über gespeicherter Höhe erlaubt, über Dach abgelehnt; Dach verschieben geprüft und neu berechnet; Dach unter Wandfuß und unbekanntes Dach abgelehnt; Speichern nur mit Verweis, Laden identisch; Schema-34-Dateien; Aufheben; Dach löschen; EG-Giebel am OG-Dach mit 3,50 m Ebenenhöhe). 1373 Tests grün, 14-Modell-Hash unverändert.

Browser-Abnahme (31.10.2026): Dach-Prüfhaus, alle OG-Wände an „og-dach“ getrimmt (über die Aktion, da die Bedienung erst in Teil 2 kommt): Traufwand 2,55–2,63 m, Giebel schräg 2,59–4,20 m, Rückwand auf 4,16–4,24 m hochgezogen; in 3D reicht der Giebel lückenlos bis unter die Dachfläche. Keine Konsolenfehler.

## Teil 2 umgesetzt (31.10.2026): Bedienung, IFC, Archicad-Datei

- „Trimmen…“ im Rechtsklick- und Modify-Menü, aktiv bei Wänden und genau einem Dach (sonst ausgegraut mit Grund). Bestätigungsfenster „n Wände an Dach ‚…' trimmen?“ [Trimmen]/[Abbrechen]; danach Hinweis „n Wände getrimmt“, ein Undo-Schritt.
- „Trimmung aufheben“ im Rechtsklick- und Modify-Menü (aktiv bei ausgewählten getrimmten Wänden) und in den Wand-Eigenschaften („Getrimmt an: Dach … · Oberkante von–bis m“ mit Knopf).
- IFC: getrimmte Wände als `IFCFACETEDBREP` im Wandkoordinatensystem, derselbe Schnitt wie in 3D (`localTrimPlane`, `trimExtrusionBelowPlane`); Öffnungen weiterhin als `IfcOpeningElement`; Eigenschaften `TrimmedAtRoof`, `TrimmedTopMin/Max`. Ungetrimmte Wände bleiben Extrusionen.
- Archicad-Prüfdatei: `benchmarks/trim-ifc-acceptance.ts`, `scripts/generate-trim-acceptance-ifc.mjs` → `NOVIKOV-Trimm-Test.ifc` (Dach-Prüfhaus, alle OG-Wände an „og-dach“ getrimmt).

Nachweis: Test in `src/lib/bim/ifc.test.ts` (alle Eckpunkte jeder getrimmten, verbundenen Wand unter ihrer Ebene, Körper reicht bis an die Ebene, Volumen > 0; IFC: B-rep je getrimmter Wand plus Dach, Trimmangaben, EG-Wand weiter SweptSolid). 1374 Tests grün, 14-Modell-Hash unverändert.

Browser-Abnahme (31.10.2026): Dach-Prüfhaus im OG. Giebelwand og-w2, Strg+Klick og-w4 und Dach: Rechtsklick „3 Elemente“, „Trimmen…“ aktiv, „Trimmung aufheben“ ausgegraut. „Trimmen…“ öffnet „2 Wände an Dach ‚og-dach' trimmen?“, [Trimmen] → „2 Wände getrimmt“; Wand-Eigenschaften „Getrimmt an: Dach og-dach · Oberkante 2,59–4,198 m“; in 3D reichen die Giebel bis unter das Dach. Modify-Menü bei getrimmter Wand: „Trimmen…“ ausgegraut, „Trimmung aufheben“ aktiv → „Trimmung aufgehoben“. Keine Konsolenfehler.

Archicad-Import (31.10.2026, Nutzer): erfolgreich, getrimmte Wände korrekt (Giebel schräg unter dem Dach, Rückwand hochgezogen). Die Protokollmeldung „Importieren des Elements fehlgeschlagen … fehlende Geometrie“ betrifft das Fenster og-f1 (IfcWindow bewusst ohne Körper, nur die Öffnung hat Geometrie; L21), nicht die Wände.
