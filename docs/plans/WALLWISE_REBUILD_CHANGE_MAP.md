# Änderungskarte (Entwurf): Wandweiser Neuaufbau nach einer Bearbeitung – „Stufe B“ (27.10.2026)

Status: **Entwurf, nicht freigegeben.** Folgt auf Stufe A (PR483, docs/performance/UNDO_STOREY_REUSE.md). Nutzerwunsch 27.10.2026: ausführliche Karte wegen des höheren Risikos.

## 1. Kundenwunsch und Abnahme

**Wer soll was tun können:** Wer im großen Modell eine Wand ändert (Länge, Endpunkt, Dicke, Z-Versatz, Fenster/Tür daran), soll die Änderung in 2D und 3D ohne spürbare Pause sehen – auch bei 20 000 Elementen. Heute baut das Programm nach jeder Bearbeitung das ganze geänderte Geschoss für 3D neu und berechnet alle davon abgeleiteten Daten neu.

**Ist-Zustand (Node, Modell x, je Bearbeitung):**

| Teil                                               | ms        | Wo                                                                               |
| -------------------------------------------------- | --------- | -------------------------------------------------------------------------------- |
| Geschossteil neu bauen (alle Wände des Geschosses) | ≈ 150–170 | `storeyPart` → `buildPreviewSolid` (lib/bim/geometry.ts) → `connectedWallSolids` |
| Wandfuß-Fangquellen des Arbeitsgeschosses          | ≈ 390     | `getWallFootSources`: Kantenermittlung je Wand (`selectionEdges`) + Suchindex    |
| Bewegungsecken des Geschosses (bei Bewegungsstart) | ≈ 190     | `movementCorners`: wieder `selectionEdges` je Wand                               |
| Picking-Teilbaum des Geschosses (im Hintergrund)   | ≈ 100+    | `buildWorldPicking` je Geschossteil                                              |

Ursache: Ein neues Geschossobjekt erzeugt neue Flächenobjekte für **alle** Wände, auch unveränderte. Alle Zwischenspeicher, die an Flächen- oder Geschossidentität hängen, greifen dann nicht mehr.

**Szenarien (Abnahme):**

1. Normal: Im Schulmodell x die Länge einer Wand ändern → 3D zeigt nur die geänderte Wand und ihre Anschlussnachbarn neu; Ergebnis gleich dem vollständigen Neuaufbau; die Bearbeitung ist im Browser messbar schneller (Ziel siehe 5).
2. Grenzfall: Eine Wand mit T-Anschluss, Eckverbindung, Fenster und Tür bewegen, deren Dicke ändern, Z-Versatz setzen, Anschluss lösen, Fenster löschen, Undo/Redo – Flächen, Fangquellen, Ecken, Picking, IFC und Datei bleiben exakt gleich dem vollständigen Neuaufbau.

**Ausgeschlossen:** Änderungen an Fangregeln, Darstellung, Speicherformat, IFC-Inhalt; Mehrfachknoten oder neue Anschlussarten; GPU-/Native-Zeiten.

**Register-IDs:** AUD14-03 (3D-Ressourcen lokal), AUD14-04 (Vorschau/Validierung), AUD14-05 (Abhängigkeitsmenge).

## 2. Eigentümer und Datenquelle

- Autoritativ bleibt allein das validierte Projekt (Geschoss, Wände, Öffnungen, Anschlüsse). Wiederverwendet wird nur **abgeleitete, tief eingefrorene** Geometrie eigener Stände.
- Wandkörper: Domäne (`domain/elements/wall/connections.ts`, `contour-solid.ts`); Zusammenbau des Geschossteils: künftig `rendering/viewport/` (Umzug aus `lib/bim/geometry.ts`, siehe B0).
- Schlüssel für „Wand unverändert“: das eingefrorene Wandobjekt (Identität bei eigenen Ständen) **und** alle Eingaben ihres Körpers: Konturring (aus `connectedWallContours`, hängt von Nachbarn ab), die ihr zugeordneten Öffnungen (Identität), T-Kennzeichen, Höhe/Fuß, Geschosshöhe. Nur wenn alles gleich ist, wird die frühere Fläche übernommen.

## 2a. Zukunftsfähigkeit: geschossübergreifende Einflüsse (Nutzerentscheidung 27.10.2026)

Nutzervision: Wände über mehrere Geschosse (z. B. EG bis 3. OG, 9 m, für Fensterfronten), gestapelte Wände, die am Geschossübergang optisch eine Wand bilden, Decken dazwischen, Dachtrimmung von Wänden (ein Giebel kann zwei Geschosse umfassen) und Anzeige solcher Wände als „Gast“ im Grundriss anderer Geschosse (Grundriss = horizontaler Schnitt ≈ 1 m über dem Geschossboden).

Heutige Annahme aller Geschoss-Zwischenspeicher (Stufe A, Picking je Geschoss PR472, Bewegungsecken je Geschoss PR482, Wandfuß-Fangquellen, geplant B1/B2): Der 3D-Körper einer Wand hängt nur von ihrem eigenen Geschoss ab (plus Geschosshöhe und Bildern). Für gebundene Wandhöhen ist das bereits sauber gelöst: Die Höhe aus dem oberen Geschoss wird bei der Prüfung in die Wand eingetragen (`resolveBoundWallHeights`), sodass eine Änderung oben ein neues Wandobjekt unten erzeugt.

**Verbindliche Regel:** Geschossübergreifende Einflüsse auf einen Wandkörper – Dachtrimmung, Stoß zur Wand darüber oder darunter, Deckenanschluss – werden als ausdrückliche Eingaben der Wand aufgelöst und sind Teil ihres Wiederverwendungsschlüssels, wie heute die gebundene Höhe. Kein Zwischenspeicher darf annehmen, dass ein Geschoss nur von sich selbst abhängt.

| Vision                                                                 | Folge                                                                                                                                                                                       |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Wand über mehrere Geschosse (Gehört einem Geschoss, ragt durch andere) | 3D unkritisch; Körper im Teil des Besitzergeschosses                                                                                                                                        |
| „Gast“-Wand im Grundriss anderer Geschosse                             | Eigene, geschossübergreifende Grundriss-/Fang-/Auswahlabfrage nach Höhenbereich; heute nicht vorhanden; kein Widerspruch zu Stufe B                                                         |
| Gestapelte Wände als eine Wand                                         | Untere Wand hängt von oberer ab → Einfluss als Wandeingabe auflösen (Regel)                                                                                                                 |
| Dachtrimmung, Giebel über zwei Geschosse                               | Wandkörper hängt von Dachfläche ab → Trimmung als Wandeingabe auflösen (Regel); offene Produktentscheidung „Dachtrimmen einmalig oder abhängig“ (Masterplan §8) vor dem Dach-Auftrag klären |
| Decke dazwischen                                                       | Je nach Fachregel gleiche Behandlung                                                                                                                                                        |

Folgen für diese Karte: B1-Schlüssel enthält ausdrücklich alle Eingaben eines Wandkörpers einschließlich künftiger geschossübergreifender Eingaben; sobald der erste solche Einfluss existiert, kommt die Gegenprobe „Einfluss aus einem anderen Geschoss erzwingt Neubau“ in den Differenztest. B0 ist von dieser Regel nicht betroffen (reiner Umzug) und schafft die zentrale Stelle, an der solche Eingaben später ausgewertet werden.

## 3. Gemeinsamer Weg

Kein neuer Bedienweg: Maus, Eigenschaften, Text, Sprache und Undo laufen über dieselben Aktionen wie heute. Die Wiederverwendung sitzt ausschließlich in der Ableitung (`storeyPart` und abgeleitete Zwischenspeicher). Vorbereitete Vorschauen (`selection-move-preview.ts`, `buildPreviewSolid` für Patches) bleiben unverändert oder nutzen denselben Baustein.

## 4. Schritte

| Schritt                                     | Inhalt                                                                                                                                                                                                                                            | Anteil | Risiko |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------ |
| **B0 Umzug (eigener PR)**                   | `buildPreviewSolid` samt Typen `Solid/Face/Vec3` nach `rendering/viewport/storey-solid.ts` verschieben; `lib/bim/geometry.ts` re-exportiert nur noch (kein neuer Code in lib/bim). Verhalten unverändert.                                         | 15 %   | gering |
| **B1 Wandweiser Geschossteil**              | Beim Neubau eines Geschossteils den letzten Stand desselben Geschosses (Stufe A) heranziehen; je Wand mit unverändertem Schlüssel (Abschnitt 2) die früheren Flächenobjekte übernehmen, sonst neu extrudieren. Reihenfolge der Flächen wie heute. | 30 %   | mittel |
| **B2 Ableitungen je Wand**                  | `selectionEdges` je Wand-Flächenliste merken (schwach) und in Wandfuß-Quellen, Bewegungsecken und Auswahlumriss nutzen; Wandfuß-Suchindex blockweise wie die lokalen Fangquellen (PR464).                                                         | 20 %   | mittel |
| **B3 Nachweis**                             | siehe 6                                                                                                                                                                                                                                           | 25 %   | –      |
| **B4 Doku, PR, Merge, Masterplan/Register** |                                                                                                                                                                                                                                                   | 10 %   | –      |

Optional später (nicht Teil dieser Karte): Konturen nur für die betroffene Anschlussgruppe neu berechnen (`connectedWallContours` rechnet heute das ganze Geschoss); Picking-Teilbaum je Wand statt je Geschoss.

## 5. Erwartung (Node, Modell x, je Bearbeitung)

| Teil                            | heute      | Ziel                                         |
| ------------------------------- | ---------- | -------------------------------------------- |
| Geschossteil                    | 150–170 ms | ≈ 30–60 ms (Konturen des Geschosses bleiben) |
| Wandfuß-Fangquellen             | ≈ 390 ms   | ≈ 40–80 ms                                   |
| Bewegungsecken nach Bearbeitung | ≈ 190 ms   | ≈ 10–30 ms                                   |

Im Browser: Bearbeitung/Dauerlauf bei x sichtbar kürzer (heute Median ≈ 410–490 ms); konkrete Zielwerte erst nach B0/B1-Messung.

## 6. Nachweis

- **Gleichheit (Kern):** Differenztest mit mehreren hundert zufälligen Bearbeitungen (Länge, Endpunkt, Dicke, Höhe, Z, Fenster/Tür setzen/ändern/löschen, Anschluss verbinden/lösen, Geschosswechsel, Undo/Redo) auf Schulmodell s/l: Flächen des wandweise gebauten Geschossteils **byte-gleich** (JSON, Reihenfolge) zum vollständigen Neuaufbau; ebenso Wandfuß-Quellen (alle Merkmale), Bewegungsecken, Auswahlumrisse, Picking-Treffer an Punktraster, IFC-Export und Projektdatei.
- **Gegenproben:** Nachbarwand einer geänderten Wand (Kontur ändert sich) wird neu gebaut; Öffnung an unveränderter Wand ändern → Wand neu; ein manipulierter Schlüssel (anderes Konturpunkt-Bit) erzwingt Neubau; nicht eigene (veränderbare) Stände nutzen keine Wiederverwendung.
- **Leistung:** Node-Profil vorher/nachher (s/l/x); Browser-Schullauf l/x (Wandlänge übernehmen, Dauerlauf, Z übernehmen/Undo/Redo, Tür ziehen) je zwei Läufe.
- **Zukunftsfähigkeit (Abschnitt 2a):** Der Schlüssel ist als Liste aller Körpereingaben dokumentiert; ein Test belegt, dass jede bisherige Eingabe (Kontur, Öffnungen, T-Kennzeichen, Höhe, Fuß, Geschosshöhe) einzeln einen Neubau erzwingt.
- **Bestehende Tests** und Architekturprüfung grün; keine neue Architektur-Ausnahme.

## 7. Risiken und Gegenmaßnahmen

| Risiko                                                                   | Gegenmaßnahme                                                                                                                                     |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Veraltete Fläche wird übernommen (falsche Geometrie in 3D/IFC)           | Konservativer Schlüssel inkl. Konturwerten; Differenztest; im Zweifel Neubau; Rückfall auf vollständigen Neuaufbau bei jedem unerwarteten Zustand |
| Reihenfolge der Flächen ändert sich (Picking-Gleichstand, Pufferpatches) | Reihenfolge explizit wie heute aufbauen; Byte-Vergleich der Flächenliste                                                                          |
| Umzug aus lib/bim ändert Verhalten                                       | B0 als eigener PR, nur Verschieben, Byte-Gleichheit aller Testmodelle                                                                             |
| Speicher (zusätzliche Flächenobjekte)                                    | Nur letzte Stände (Stufe A), schwache Zwischenspeicher                                                                                            |
| Komplexität / Wartbarkeit                                                | Ein Baustein (`storey-solid.ts`), dokumentierter Schlüssel, Diagnosezähler „wiederverwendet/neu“                                                  |

**Rücknahme:** Jeder Schritt ist ein eigener PR; B1/B2 lassen sich durch Zurücksetzen des PR vollständig entfernen, ohne Datenformat- oder Bedienänderung.

## 8. Offene Entscheidungen für den Nutzer

1. **Reihenfolge:** B0 als eigener PR vorab (empfohlen), dann B1+B2 gemeinsam – oder alles in einem PR?
2. **Umfang Konturen:** Konturen weiter für das ganze Geschoss berechnen (empfohlen für diese Stufe) oder gleich anschlussgruppenweise (mehr Gewinn, mehr Risiko)?
3. **Abnahmeschwelle:** Reicht der Differenztest mit mehreren hundert Bearbeitungen plus Browserlauf, oder zusätzlich eine Archicad-Prüfung der IFC nach einer Bearbeitungsserie?

## 9. Ergebnis B0 (27.10.2026, umgesetzt)

- `src/rendering/viewport/storey-solid.ts` enthält `Vec3/Face/Solid`, `buildSolid` und `buildPreviewSolid` wortgleich zu `lib/bim/geometry.ts` auf main (Textvergleich der verschobenen Zeilen: identisch). `lib/bim/geometry.ts` behält nur `Camera`, `initialCamera`, `projectPoint` (Parameter jetzt `ProjectionBounds` statt `Solid`, gleiche Rechnung).
- **Abweichung von der Karte:** kein Re-Export aus `lib/bim/geometry.ts`, weil die Architekturregel `legacy → rendering` (auch Typimporte) verbietet. Stattdessen alle Importe umgestellt (3 Produktionsdateien, Tests, Benchmarks, `scripts/generate-ifc-fixtures.mjs`); die drei Ausnahmen `rendering/viewport/{building-solid,layer-display,selection-move-preview}.ts → lib/bim/geometry.ts` entfallen, keine neue Ausnahme. Historische Probe-Benchmarks, die den Quelltext kopieren, lesen jetzt `storey-solid.ts` (nicht erneut ausgeführt).
- Nachweis: `benchmarks/storey-solid-hash.ts` (buildSolid/buildPreviewSolid je Geschoss, Gebäudekörper und IFC-Export von 14 Modellen: Beispiel, Schule s/l/x, T-Abnahme mit Varianten) auf main und Branch gleich `09528ac4…7823253`. 1331 Tests grün, Typprüfung (App, Benchmarks), Lint (nur bestehende Warnungen in `components/ui`), Architekturprüfung, Build.
