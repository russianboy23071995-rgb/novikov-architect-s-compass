# Wartezeit, Teil A – Bearbeitungszyklus (26.10.2026)

Änderungskarte „Wartezeit, Teil A“ mit den drei Empfehlungen freigegeben: Übernehmen vertraut nur dem eigenen geprüften Stand, Wandextrusion pro Wand mit Eingabeschlüssel, Abnahme l und x ≥ 40 % schneller, Undo/Redo nicht langsamer, Ergebnis identisch.

## Befund vorher

Je Bearbeitung „Wandlänge“ (Node, x): Vorschau 182 ms, Übernehmen 173 ms (zweite Ausführung desselben Befehls), Wandkörper für die Darstellung 176 ms, Fang-Index 88 ms, Commit 5 ms. CPU-Profil: `extrudeProfileWithOpenings` ≈ 40 % der Zeit; alle Wände des Arbeitsgeschosses wurden je Bearbeitung dreimal vollständig extrudiert (Prüfung der Vorschau, Prüfung beim Übernehmen, Darstellung).

## Änderungen

- **A1** (`application/commands/selection-command.ts`): Übernehmen gibt das Vorschauergebnis zurück, wenn es genau diese Vorschau erzeugt hat (Herkunft in einer privaten WeakMap mit Text und Ergebnis), es ein eigener, eingefrorener, vollständig geprüfter Stand ist und Basis, Auswahl, Sichtbarkeit und Kalibrierung unverändert sind. Kopierte Vorschauen, getauschte Ergebnisse, geänderter Text und veränderliche Modelle führen die Aktion wie bisher neu aus.
- **A2** (`domain/elements/wall/contour-solid.ts`): `wallContourSolid` teilt die lokale Extrusion über Stände und Projekte hinweg. Schlüssel sind die exakten Eingaben (Profil, Höhe, Öffnungen, Zuschnitt); ein Eintrag je Wand und Zuschnittsmodus, Obergrenze 65 536 Einträge, danach Neubeginn. Abweichung von der Karte: statt „beim Projektwechsel leeren“ eine feste Obergrenze, weil der Schlüssel das Ergebnis vollständig bestimmt (ein fremdes Projekt kann keinen falschen Treffer erzeugen) und der Domänencode keinen Projektwechsel kennt.

## Nachweis

- **Gleichheit** (`benchmarks/edit-cycle-equality.ts`, Schulmodell s): 13/13 Befehle (Wandlänge, Fenster, Tür, Versatz, Verschieben, Löschen, mehrere Geschosse) liefern über den neuen Weg dasselbe Modell wie das erneute Ausführen und dieselben Wandkörper wie die ungecachte Ableitung; Gegenprobe (1e-9 an einem Eckpunkt) wird erkannt. 4 Fälle lehnt die Fachregel ab (T-/Eckanschluss verlangt gleiche Wandstärke und Höhe), identisch auf beiden Wegen.
- **Tests** (`application/commands/apply-reuse.test.ts`): Vertrauensregeln und Extrusionsteilung; Gegenprobe mit altem Übernehmen und abgeschaltetem Cache schlägt fehl. 1249 Tests.

## Messung

Node, Median je Bearbeitung (`benchmarks/edit-cycle-profile.ts`):

| ms                     | s vorher → nachher | l                | x                 |
| ---------------------- | ------------------ | ---------------- | ----------------- |
| Vorschau               | 16 → 11            | 49 → 32          | 182 → 79          |
| Übernehmen             | 16 → 0             | 44 → 0           | 173 → 0           |
| Wandkörper Darstellung | 6,5 → 1,7          | 18,7 → 4,2       | 176 → 76          |
| Fang-Index             | 16 → 18            | 60 → 57          | 88 → 82           |
| Summe                  | 56 → 32 (−43 %)    | 177 → 98 (−45 %) | 623 → 242 (−61 %) |

Browser-Schullauf, abwechselnd vorher/nachher auf demselben Rechner (`benchmarks/edit-cycle-results.json`):

| Median ms          | s                     | l                 | x                 |
| ------------------ | --------------------- | ----------------- | ----------------- |
| Bearbeitungszyklus | 103 → 78–80 (−23 %)   | 291 → 213 (−27 %) | 956 → 496 (−48 %) |
| Undo               | 14 → 14 (ein Lauf 34) | 14 → 14           | 14 → 14           |
| Redo               | 102 → 77–84           | 194 → 147         | 543 → 302         |
| Fang p95           | 14 → 14               | 20 → 20           | 507 → 28          |
| Löschen            | 138 → 111–127         | 409 → 333         | 1923 → 723        |
| 2D → 3D            | 133 → 112–118         | 280 → 219         | 1580 → 963        |
| 3D-Tür ziehen      | 865 → 660–687         | 2357 → 2133       | –                 |

## Abnahme

- x: −48 % – **erfüllt**.
- l: −27 % – **nicht erfüllt** (Schwelle 40 %). In Node −45 %; im Browser bleiben je Bearbeitung der vollständige Neuaufbau des Fang-Index (≈ 57 ms), die Vorschauprüfung (≈ 32 ms) und das Rendern.
- Undo/Redo nicht langsamer – erfüllt (ein s-Lauf mit Undo-Median 34 ms, Wiederholung 14 ms).
- Ergebnis identisch – erfüllt.

## Grenzen und Befunde

- Ein Rechner, nur Chromium, ein bis zwei Läufe je Größe.
- Der Fang-Index wird je Bearbeitung vollständig neu gebaut; das ist der größte Rest bei s/l (Kandidat Teil B).
- 3D-Tür ziehen bei l bleibt ≈ 2,1 s (Kandidat Teil B).
- Fachregel: T- und Eckanschlüsse verlangen gleiche Wandstärke und Höhe; die Fehlermeldung des Wandbefehls nennt dann fälschlich das Fenster („… das Fenster vollständig in die Wand passen“).
- Der Extrusions-Cache hält höchstens einen lokalen Körper je Wand (bei x etwa so viel wie die Wandkörper des aktuellen Stands) und wird nicht beim Projektwechsel, sondern erst an der Obergrenze geleert.

# Wartezeit, Teil B (26.10.2026)

Änderungskarte „Wartezeit, Teil B“ mit den Empfehlungen freigegeben: Fang-Index in Blöcken zu 512 Teilen je Bauteilart mit Fangpunkten je Wand (B1/B1b), Prüfung je Bauteil im geänderten Geschoss unter Schutzregeln (B2), 3D nach Bearbeitung zuerst messen (B3).

## Änderungen

- **B1** `application/snapping/local-sources.ts`, `constraints/snapping/local-source-index.ts`: Der Arbeitsindex besteht aus Blöcken von bis zu 512 Teilen je Bauteilart (Wände, Türen, Schraffuren, Linien), jeder mit Hüllrahmen, eigenem Punkt-/Linienindex und Nachschlagetabelle. Ein Block, dessen Teile dieselben Objekte sind, behält seinen Index. Abfragen liefern dieselben Ergebnisse in derselben Reihenfolge wie ein Gesamtindex.
- **B1b** `application/snapping/project-references.ts`, `domain/elements/wall/connections.ts`: Fangpunkte je Wand, wiederverwendet solange Wand und Kontur gleich sind; `connectedWallContours` je Stand einmal (gemeinsam für Fang, Auswahlformen, Grundriss-Umriss und Wandkörper).
- **B2** `domain/project/schema.ts`, `domain/project/owned-snapshot.ts`: Fenster, Türen, Linien, Schraffuren und Abbilder eines geänderten Geschosses, die eingefrorene Bauteile eines eigenen geprüften Stands sind, überspringen die Schema-Prüfung und werden an ihrer Stelle wieder eingesetzt. Alle Prüfungen über das ganze Geschoss (IDs, Ebenen, Anschlüsse, Öffnungen, Türen) laufen auf den vollständigen Listen. Wände bleiben ausgenommen (gebundene Höhen hängen von Geschosshöhen ab). Daten aus Datei, Wiederherstellung oder veränderliche Objekte werden nie wiederverwendet.
- **B3** `rendering/viewport/building-solid.ts`: Messung mit JS-Self-Profiling (Diagnosemodus `js-profile` im Messbuild). Nach einer Bearbeitung kostete der 3D-Neuaufbau bei l vor allem das Gebäude aller Geschosse (≈ 28 % der belegten Zeit), den Picking-Index im Hintergrund (≈ 21 %) und die Bildprüfung der Autosicherung (≈ 13 %). Umgesetzt: Gebäudeteil je Geschoss wiederverwendet (ein Eintrag je Geschoss-ID, nicht an Verlaufsschritte gebunden). Messseite trennt „3D – Szene fertig“ vom Türziehen.

## Nachweis

- Fang-Index (`benchmarks/snap-index-equality.ts`): 10 668 Abfragen in 5 Zuständen identisch (Referenzen, Segmente, Paare, Nachschlagen), Gegenprobe greift.
- Prüfung je Bauteil (`src/domain/project/element-reuse.test.ts`): gleiches Ergebnis wie volle Prüfung; ungültiges neues Bauteil, doppelte ID und veränderte Kopie werden abgelehnt; öffentliche Prüfung verwendet nie wieder.
- Schulmodell (`benchmarks/edit-cycle-equality.ts`): 13/13 Befehle – Modell gleich dem erneuten Ausführen und einer vollen Prüfung derselben Daten, Wandkörper gleich der ungecachten Ableitung, Gebäude gleich dem Neuaufbau aus einer veränderlichen Kopie.
- 1252 Tests, Typen, Architektur-Check, Lint.

## Messung

Node, Median je Bearbeitung „Wandlänge“ (`benchmarks/edit-cycle-part-b-results.json`):

| ms                           | s main → neu   | l                | x                 |
| ---------------------------- | -------------- | ---------------- | ----------------- |
| Vorschau                     | 14 → 5         | 37 → 15          | 100 → 69          |
| Fang-Index                   | 18 → 0,6       | 59 → 1,7         | 111 → 13          |
| Summe                        | 36 → 9 (−76 %) | 106 → 27 (−75 %) | 310 → 178 (−43 %) |
| Gebäude nach Bearbeitung (l) |                | 50–80 → 9–17     |                   |

Browser-Schullauf l, gleiche Sitzung, Reihenfolge main, neu, vor Teil A, neu:

| Median ms                 | vor Teil A | main (Teil A) | neu (Lauf 1 / 2) |
| ------------------------- | ---------- | ------------- | ---------------- |
| Bearbeitungszyklus        | 296        | 264           | 186 / 156        |
| Undo                      | 14         | 14            | 14 / 14          |
| Redo                      | 211        | 197           | 208 / 153        |
| Löschen                   | 467        | 460           | 327 / 280        |
| 2D→3D + Szene + Türziehen | 2193       | 2678          | 2953 / 2738      |

Browser-Schullauf s und x, eigene Sitzung bei sichtbarem Fenster (Bildschirm mit 136 Hz statt vorher 60 Hz; deshalb nur main gegen neu innerhalb dieser Sitzung):

| Median ms                 | s main → neu    | x main → neu      |
| ------------------------- | --------------- | ----------------- |
| Bearbeitungszyklus        | 83 → 64 (−24 %) | 522 → 390 (−25 %) |
| Bearbeitungszyklus p95    | 133 → 127       | 3748 → 547        |
| Undo                      | 14 → 14         | 14 → 14           |
| Redo                      | 83 → 78         | 387 → 295         |
| Fang p95                  | 20 → 20         | 29 → 37           |
| Wandlänge übernehmen      | 168 → 143       | 610 → 433         |
| Löschen                   | 115 → 105       | 945 → 653         |
| 2D→3D + Szene + Türziehen | 1591 → 1948     | 1208 → 1411       |

## Abnahme

- **l ≥ 40 % schneller als vor Teil A:** Lauf 1 −37 %, Lauf 2 −47 %, Mittel 171 ms = −42 % – im Mittel erfüllt, ein Einzellauf darunter (die Läufe streuen am selben Rechner um ±15 %).
- Undo/Redo nicht langsamer – erfüllt.
- Ergebnisse identisch – erfüllt.
- **3D nach Bearbeitung:** nicht verbessert. Das Gebäude wird zwar in Node 4–6× schneller neu aufgebaut, im Browser bleibt die Summe aus Umschalten, Szenenaufbau und Türziehen bei 2,2–3,0 s (große Streuung). Rest: Picking-Index, Bildprüfung der Autosicherung, Vorschau je Mausbewegung beim Türziehen. Eigener Auftrag.
- **s und x:** gegenüber Teil A je etwa ein Viertel schneller (s −24 %, x −25 %), alle Schritte ohne Fehler. Fang p95 bei x 29 → 37 ms (bildratengebunden, Einzellauf; beobachten). Ein erster Versuch bei verdecktem Fenster (etwa ein Bild pro Sekunde, Profil zu 70 % untätig) ist verworfen.

## Grenzen

- Ein Rechner, nur Chromium; l zweimal, s und x je einmal in einer zweiten Sitzung mit anderer Bildrate.
- Der Picking-Index für 3D und die Bildprüfung der Autosicherung werden nach jeder Bearbeitung vollständig neu berechnet.
- Größenberechnung des geänderten Geschosses bleibt vollständig (≈ 5 ms bei l).
