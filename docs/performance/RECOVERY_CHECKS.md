# Vollständige Sicherungsprüfungen zuordnen und vermeiden (26.10.2026)

Änderungskarte „Sicherungsprüfungen zuordnen und gezielt vermeiden“ mit den Empfehlungen freigegeben: erst Aufrufer messen, dann nur die tatsächlich teuren gezielt korrigieren; Vertrauen nur gegenüber Ständen, die diese Sitzung selbst geschrieben oder schon vollständig geprüft hat.

Eine vollständige Prüfung (`restoreCheckedSnapshot`) dekodiert alle Bilder des Sicherungsstands, berechnet ihre Prüfsummen neu und prüft das Modell (Schulmodell l: etwa 21 MB Bilder, 0,5–1,2 s).

## S1 – Zuordnung

Diagnosemodus `recovery-profile` (`benchmarks/recovery-read-instrumentation.ts`, `recovery-read-trace.ts`): jede vollständige Prüfung wird mit Aufrufer, Zeitpunkt und Dauer in `globalThis.recoveryChecks` geschrieben, dazu die Entscheidungen der Autosicherung (Projektwechsel, Schreiber angefordert, Sicherung mit/ohne vorhandenen Schreiber). Nur Messbuild; das Programm bleibt unverändert.

Schullauf l, erste Phase (main `29f8ea6`):

| Aufrufer                     | Anlass                                                                   | ms   |
| ---------------------------- | ------------------------------------------------------------------------ | ---- |
| Statusanzeige                | nach „Öffnen“: Stand aus dem vorigen Lauf (fremde Revision)              | 1223 |
| Sicherungsschreiber          | nach „Öffnen“: derselbe Stand noch einmal                                | 535  |
| Sicherungsschreiber          | „Redo“: Undo führt über das Datei-Öffnen ins vorige Projekt, Redo zurück | 713  |
| Sicherungsschreiber          | „Neu öffnen“ derselben Datei: eigener, gerade geschriebener Stand        | 513  |
| Aufräumen / Wiederherstellen | –                                                                        | –    |

Befund: Bei Bearbeitungen selbst gibt es keine vollständigen Prüfungen, und die Statusanzeige erkennt eigene Sicherungen (1 ms). Die früher im Profil während Bearbeitung und 3D gesehenen Prüfungen waren diese asynchronen Prüfungen, die zeitlich überlappten. Ursache: Jeder Wechsel des Projekts oder Ladekontexts bereitet einen neuen Sicherungsschreiber vor, und der prüfte den vorhandenen Stand immer vollständig – auch den eigenen oder einen eben schon geprüften.

## S2 – Umsetzung

- `application/project-files/own-commits.ts`: Die Sitzung merkt sich je Projekt eine Revision, die sie selbst geschrieben **oder vollständig geprüft** hat, mit dem geprüften Projekt und einer privaten Kopie des gültigen Snapshots (Behälter kopiert, Bilddaten-Zeichenketten geteilt; bei einem Rückfall auf den Vorgänger dieser und `fallback`).
- `recovery-v2-writer.ts`: Ein neu vorbereiteter Schreiber übernimmt eine solche Revision ohne vollständige Prüfung; Struktur und Version des gespeicherten Datensatzes werden weiterhin geprüft. Als Rückfallstand für die nächste Sicherung dient die private Kopie, nicht der gespeicherte Datensatz – eine Änderung im Speicher bei gleicher Revision kann so keinen ungültigen Rückfallstand erzeugen. Nach einer vollständigen Prüfung merkt er sich die Revision.
- `recovery-catalog.ts` (`readProjectRecovery`): Nach einer vollständigen Prüfung wird die Revision gemerkt; mit `trustOwnCommit` (nur Statusanzeige) wird sie übernommen, einschließlich `fallback`.
- Unverändert: Wiederherstellen und Startangebot prüfen immer vollständig; eine Revision aus einem anderen Tab oder einer früheren Sitzung wird beim ersten Mal vollständig geprüft; das Aufräumen alter Stände prüft wie bisher alle Stände vor dem Löschen.

## S3 – Nachweis

- `own-commits.test.ts`: Schreiber nach eigener Sicherung ohne Prüfung, nächste Sicherung behält den früheren Stand als Rückfall und ist vollständig wiederherstellbar; einmal vollständig geprüfte Revision wird von Status und Schreiber nicht erneut geprüft, Wiederherstellen prüft weiter; geprüfter Rückfall behält den gültigen Vorgänger für Status und Schreiber. Gegenproben: fremde Revision wird geprüft, beschädigte Revision abgelehnt, unbekannte Version abgelehnt, beschädigter gespeicherter Stand bei gleicher Revision wird nicht zum Rückfallstand (`benchmarks/recovery-v2-writer.test.ts`).
- Diagnose nachher: im ganzen Lauf eine vollständige Prüfung (Statusanzeige, Stand des vorigen Laufs, 935 ms) statt vier (≈ 2,98 s).
- Browser-Schullauf l, drei Wechselpaare nach Aufwärmlauf (Median ms, `benchmarks/recovery-checks-results.json`):

| Median ms                   | main             | neu              | Änderung |
| --------------------------- | ---------------- | ---------------- | -------- |
| Redo                        | 145              | 111              | −23 %    |
| Redo p95                    | 303              | 257              | −15 %    |
| Wandlänge übernehmen        | 192              | 153              | −20 %    |
| Bearbeitungszyklus p95      | 247              | 192              | −22 %    |
| Bearbeitungszyklus          | 160              | 158              | ≈ 0      |
| Neu öffnen – Projekt laden  | 313              | 291              | ≈ 0      |
| 2D → 3D / Szene / Türziehen | 158 / 818 / 1624 | 154 / 867 / 1667 | Streuung |
| Undo                        | 14               | 14               | 0        |

Die Gewinne liegen dort, wo vorher eine Prüfung im Hintergrund mitlief (Redo, Bearbeitung kurz nach dem Öffnen, Ausreißer im Bearbeitungszyklus).

## Grenzen

- Die Statusanzeige und der Schreiber vertrauen einer in dieser Sitzung geschriebenen oder geprüften Revision. Eine spätere Beschädigung des Browserspeichers bei gleicher Revision zeigt die Statusanzeige nicht an; sie fällt beim Wiederherstellen auf (immer vollständig) und nach einem Neustart der Seite.
- Starten Statusanzeige und Schreiber gleichzeitig für eine noch ungeprüfte Revision, prüfen beide (keine gemeinsame laufende Prüfung).
- Ein Rechner, eine Sitzung, Modell l.
