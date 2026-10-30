# L04b – Wände an Dachflächen trimmen (freigegebene Karte, noch nicht umgesetzt)

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
