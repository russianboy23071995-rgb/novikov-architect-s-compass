# Bildprüfung der Autosicherung nur für geänderte Bilder (27.10.2026)

Änderungskarte „Bildprüfung der Autosicherung nur für geänderte Bilder“ mit den Empfehlungen freigegeben (B1–B4): Bilder, die diese Sitzung schon geprüft und gehasht hat, werden beim Speichern nicht erneut dekodiert, gehasht, kopiert oder verglichen; neue und geänderte Bilder weiter vollständig.

## Befund

Jede Sicherung (`recovery-v2-storage.ts` `publish`) kopierte den ganzen Stand samt Bilddaten, stellte den neuen und den vorigen Stand je vollständig wieder her (alle Bilder dekodieren, SHA-256, Modellprüfung) und las beim Schreiben jedes Bild aus IndexedDB zurück, um es zeichenweise zu vergleichen. Das Vorbereiten hasht schon nur neue Bilder (Zwischenspeicher je Bild). Schulmodell l mit fünf Bildern (~21 MB): rund 1,1–1,2 s Rechenzeit je Sicherung, auch wenn sich kein Bild geändert hatte.

## Umsetzung

- **B1** `interop/project-file/recovery-codec.ts`: Bilder, die das Vorbereiten selbst geprüft und gehasht hat (eingefroren), werden mit ihrem Inhaltsschlüssel gemerkt.
- **B2** Prüfung beim Speichern (`prepared: true`, nur aus `publish`): Ein solches Bild unter seinem Schlüssel wird über seine Identität verknüpft statt erneut dekodiert und gehasht. Modell, Budgets und alle anderen Bilder werden weiter vollständig geprüft. Wiederherstellen, Startangebot, Statusanzeige und Aufräumen setzen das nie; Stände aus dem Speicher bestehen immer aus neuen Objekten.
- **B3** `application/project-files/recovery-v2.ts`: Sicherungsstände werden versiegelt (tief eingefrorene Kopie, eingefrorene Bilder geteilt). Ein versiegelter Stand, der in dieser Sitzung die Prüfung bestanden hat, wird nicht erneut geprüft – das betrifft den vorigen Stand jeder weiteren Sicherung. Der Sicherungsschreiber versiegelt seinen Stand selbst und behält ihn als Vorgänger; `plainCopy` gibt versiegelte Stände unverändert zurück.
- **B4** `publish`: Die Kopie umfasst nur noch Nicht-Bilddaten (Versiegeln); ein schon gespeichertes Bild wird nur auf Vorhandensein seines SHA-256-Schlüssels geprüft (`getKey`), nicht mehr gelesen und verglichen.
- Unverändert: Speicherformat, Wiederherstellen und Startangebot (immer vollständig), erste Prüfung fremder Stände, Aufräumen.

## Nachweis

- Tests (`src/application/project-files/own-commits.test.ts`, Abschnitt „Autosave checks only images…“): Speicherprüfung verknüpft vorbereitete Bilder und ergibt dasselbe Projekt wie die volle Prüfung; ein geändertes Bild wird gehasht, Wiederherstellen dekodiert weiter alle; Gegenproben: Kopie gleichen Inhalts, beschädigte Kopie, vertauschte Schlüssel werden auch auf dem Speicherweg vollständig geprüft bzw. abgelehnt; Versiegeln teilt eingefrorene Bilder, kopiert alles andere, spätere Änderungen erreichen den versiegelten Stand nicht; nur versiegelte Stände können als geprüft gelten; Wiederherstellen eines versiegelten Stands prüft alle Bilder. 1310 Tests grün. Ein bestehender Test beschädigte im Testspeicher das gemeinsame Bildobjekt von aktuellem und vorigem Stand; er ersetzt jetzt nur das Bild des aktuellen Stands (im echten Speicher liegt ein Bild ohnehin einmal unter seinem Schlüssel).
- Neue Testdatei vermieden: eine weitere Datei in `npm test` überschreitet unter Windows die Befehlszeilenlänge.
- Browser, Diagnose-Build `recovery-profile` beider Stände, Sicherungslauf `school-acceptance.html?saves=4` (je zwei Läufe à vier Sicherungen, `benchmarks/autosave-image-checks-results.json`):

| ms je Sicherung (Bereich)   | vorher    | nachher            |
| --------------------------- | --------- | ------------------ |
| Kopie / Versiegeln          | 89–113    | 38–48 (Versiegeln) |
| Prüfung neuer Stand         | 293–362   | 181–273            |
| Prüfung voriger Stand       | 314–403   | 0                  |
| Schreiben                   | 156–187   | 131–207            |
| Modellprüfung, Vorbereiten  | 219–266   | 220–257            |
| **Summe**                   | 1097–1270 | 571–706            |
| Lange Aufgaben je Sicherung | 634–863   | 507–640            |

- Vollständiger Schullauf l (nachher): alle Schritte ok, keine Fehler; Neuladen und Wiederherstellen aus der neuen Sicherung funktionieren; Dauerlauf p95 193 → 177 ms (je ein Lauf).

## Grenzen

- Die Summe sinkt um etwa 45 %, nicht auf 0,2–0,3 s wie erwartet: Modellprüfung beim Speichern, Vorbereiten (Modell prüfen, Budget) und die Modellprüfung des neuen Stands bleiben (zusammen ≈ 0,4 s bei l). Sie hängen nicht an den Bildern.
- Ein im Browserspeicher beschädigtes Bild wird beim Speichern nicht mehr bemerkt, sondern beim Wiederherstellen (dort abgelehnt, Rückfall auf den vorigen Stand).
- Die erste Sicherung nach einem fremden Stand prüft dessen Vorgänger weiter vollständig.
- Ein Rechner, Modell l, Diagnose-Build.
