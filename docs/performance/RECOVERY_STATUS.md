# 3D und Autosicherung nach einer Bearbeitung (26.10.2026)

Änderungskarte „3D und Autosicherung nach einer Bearbeitung“ mit den Empfehlungen freigegeben: eigene, abgeschlossene Schreibtransaktion gilt als Beleg für „aktuell“; Picking-Index und Türziehen zuerst messen, nur klare kleine Korrekturen sofort.

## Befund (Browser-Profil, Schulmodell l, Umschalten auf 3D nach einer Bearbeitung)

| Anteil an der belegten Zeit | Ursache                                                                                                                                                  |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ≈ 21 %                      | Statusanzeige liest nach jeder Autosicherung den ganzen Stand zurück: Bilder dekodieren, SHA-256, Modell prüfen (`restoreCheckedSnapshot`, `payloadKey`) |
| ≈ 21 %                      | Wandfuß-Fangquellen prüfen das ganze Projekt neu und extrudieren das Arbeitsgeschoss ein zweites Mal (`getWallFootSources` → `buildSolid`)               |
| ≈ 20 %                      | Picking-Index für die 3D-Auswahl, im Hintergrund in 4-ms-Scheiben (`buildWorldPicking`)                                                                  |
| ≈ 20 %                      | Gebäudeteil des geänderten Geschosses (seit Teil B nur noch dieses)                                                                                      |

Türziehen in 3D (l): Start 227 ms, danach median ≈ 17 ms je Mausbewegung (an die Bildrate gebunden). Die früher gemessenen ≈ 2 s waren der Szenenaufbau nach der Bearbeitung, nicht das Ziehen.

## Umsetzung

- **E1** `application/project-files/own-commits.ts`, `recovery-v2-writer.ts`, `recovery-catalog.ts`, `recovery-status.ts`: Die Sitzung merkt sich je Projekt die Revision ihrer letzten eigenen Sicherung und den gesicherten Stand (bei eigenem Snapshot dasselbe Objekt). Nur die Statusanzeige ruft `readProjectRecovery(…, { trustOwnCommit: true })`; steht im Speicher noch genau diese Revision, wird der Stand ohne Dekodieren und Hashen übernommen. Eine fremde Revision (anderer Tab) und jede Wiederherstellung lesen und prüfen weiterhin vollständig.
- **E2 (Teilkorrektur)** `rendering/viewport/building-solid.ts` (`workingStoreySolid`), `wall-foot-sources.ts`: Die Wandfuß-Fangquellen nutzen den Geschossteil der Gebäudeszene statt `buildSolid` (keine zweite Projektprüfung, keine zweite Extrusion). Architektur-Ausnahme rendering → lib/bim/geometry für diese Datei entfällt.
- **E2 (Picking-Index)**: nicht umgesetzt. Er blockiert nicht (4-ms-Scheiben im Hintergrund); eine Wiederverwendung je Geschoss ist ein eigener Auftrag.
- **E3**: keine Korrektur nötig (siehe Befund).

## Nachweis

- `own-commits.test.ts`: eigene Sicherung wird ohne Wiederherstellung bestätigt, Inhalt gleich der vollen Wiederherstellung; fremde Revision wird vollständig gelesen; beschädigtes Bild wird bei der Wiederherstellung abgelehnt. Gegenprobe: ohne Vertrauen wird wiederhergestellt.
- `working-storey-solid.test.ts` und Vergleich über alle 15 Geschosse der Schulmodelle s/l/x: `workingStoreySolid` identisch zu `buildSolid`; nach der Gebäudeszene dasselbe Objekt.
- `benchmarks/recovery-status-profile.ts` (Node, Modell l, 21 MB Bilder): Statuslesen nach eigener Sicherung 327 ms → ≈ 0 ms.
- 1270 Tests, Typen, Architektur-Check, Lint.

## Grenzen

- Browser-Vergleich main/neu im Schullauf stand aus (Fenster verdeckt); am 26.10.2026 nachgeholt, siehe unten.
- Die Statusanzeige vertraut einer eigenen, abgeschlossenen Schreibtransaktion. Eine spätere Beschädigung des Browserspeichers bei gleicher Revision zeigt sie nicht an; sie fällt beim Wiederherstellen auf (immer vollständig geprüft) und nach einem Neustart der Seite, weil eine neue Sitzung keine eigenen Sicherungen kennt.
- Picking-Index je Geschoss offen.

# Browser-Vergleich 3D und Autosicherung (26.10.2026)

Änderungskarte „Browser-Vergleich 3D und Autosicherung“ mit den Empfehlungen freigegeben: reine Messung, keine Korrektur in diesem Auftrag. Vorher = main `fba664d` (vor PR467), nachher = main `8534bf7`. Browser-Schullauf (`benchmarks/school-acceptance.html`, mit Bildern), Fenster sichtbar, alle Schritte ok, keine Fehler. Rohdaten: `benchmarks/recovery-status-browser-results.json`.

## Ergebnis Modell l (Median aus 3 Wechselpaaren; Paar 1 als Aufwärmlauf verworfen)

| Median ms                        | vorher | nachher | Änderung |
| -------------------------------- | ------ | ------- | -------- |
| 2D → 3D                          | 230    | 153     | −77      |
| 3D – Szene fertig                | 715    | 808     | +93      |
| 3D: Tür entlang Wand ziehen      | 1758   | 1783    | ≈ 0      |
| Summe 3D (Umschalten bis Ziehen) | 2715   | 2741    | ≈ 0      |
| 3D → 2D                          | 140    | 103     | −37      |
| Autosicherung aktuell            | 7      | 5       | ≈ 0      |
| Bearbeitungszyklus               | 163    | 174     | ≈ 0      |
| Undo / Redo                      | 14/178 | 14/174  | ≈ 0      |

Der Aufwärmlauf (erster Lauf, kalter Browser) lag vorher bei 1271/2396/767 ms und ist nicht vergleichbar.

Modelle s und x (je ein Paar, Einzelwerte): Summe 3D s 2074 → 2315 ms, x 1472 → 1297 ms; 2D → 3D s 123 → 95, x 975 → 794 ms. Die übrigen Schritte liegen innerhalb der Streuung eines Einzellaufs (±15 %).

## Profil (Modell l, Fenster 2D → 3D bis Undo, 10-ms-Stichproben)

| Stichproben (inklusive)  | vorher | nachher |
| ------------------------ | ------ | ------- |
| belegt                   | 177    | 147     |
| `validateProject`        | 56     | 18      |
| `buildWorldPicking`      | 27     | 26      |
| `restoreCheckedSnapshot` | 20     | 18      |

## Bewertung

- **3D:** Spürbar schneller ist nur das Umschalten (−77 ms bei l, −180 ms bei x). Der Rest wird in den nächsten Schritt verschoben: Bis zum Ende des Türziehens ist die Zeit gleich, weil das Ziehen an die Bildrate gebunden ist und Picking-Index und Sicherungsprüfung im Hintergrund weiterlaufen. Die belegte Rechenzeit sinkt um etwa 17 %; die zweite Projektprüfung der Wandfuß-Fangquellen ist weg (`validateProject` 56 → 18).
- **Autosicherung:** Die Statusanzeige ist in beiden Ständen nach der Leerlaufzeit sofort „aktuell“. Die vollständige Prüfung eines Sicherungsstands (`restoreCheckedSnapshot`: Bilder dekodieren, Hash, Modellprüfung) läuft aber auch nachher weiter nach Bearbeitungen und Geschosswechseln (im Profil verteilt auf Geschosswechsel, Wandlänge, 3D und Redo). Der Vertrauenspfad für eigene Sicherungen (E1) greift damit im Browserlauf nicht für diese Prüfungen; welcher Aufrufer sie auslöst (Statusanzeige mit fremder Revision, neu vorbereiteter Sicherungsschreiber oder Wartung), ist im asynchronen Profil nicht eindeutig zuzuordnen.
- **Keine Korrektur in diesem Auftrag** (Nutzerentscheidung). Nächster Kandidat: die verbleibenden vollständigen Sicherungsprüfungen mit dem vorhandenen Diagnosemodus `recovery-profile` ihrem Aufrufer zuordnen, danach Picking-Index je Geschoss.

## Grenzen

- Ein Rechner, eine Sitzung; s und x nur je ein Paar.
- Das Profil umfasst je einen Lauf; Stichprobenzahlen sind Richtwerte.
