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

- Browser-Vergleich main/neu im Schullauf steht aus: Das App-Fenster war während der Messung verdeckt (etwa 1 Bild pro Sekunde, Messung verworfen).
- Die Statusanzeige vertraut einer eigenen, abgeschlossenen Schreibtransaktion; eine spätere Beschädigung des Browserspeichers bei gleicher Revision fällt erst beim Wiederherstellen oder nach Fokuswechsel/Neustart auf (dann wird vollständig gelesen, sobald die Sitzung neu beginnt).
- Picking-Index je Geschoss offen.
