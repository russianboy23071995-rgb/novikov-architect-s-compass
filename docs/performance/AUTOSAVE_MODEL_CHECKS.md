# Modellprüfung der Autosicherung ohne Wiederholungen (27.10.2026)

Änderungskarte „Modellprüfung der Autosicherung“ mit den Empfehlungen freigegeben (M1–M3): Ein schon geprüftes Projekt wird in einer Sicherung nicht noch einmal geprüft; fremde oder veränderbare Eingaben weiter vollständig, Wiederherstellen unverändert vollständig.

## Befund

Nach PR475 (docs/performance/AUTOSAVE_IMAGE_CHECKS.md) blieb je Sicherung reine Modellarbeit: dasselbe Projekt wurde fünfmal vollständig geprüft (Schreiber, zweimal beim Vorbereiten, Migration und Prüfung des gerade erzeugten Modells), die Modellgröße zweimal als JSON ermittelt und das Modell beim Versiegeln kopiert. Der Eingang ist fast immer ein eigener, unveränderlicher Projektstand (geprüft und tief eingefroren).

## Umsetzung

- **M1** `recovery-v2-writer.ts`, `recovery-codec.ts`: Ein eigener Projektstand (`isOwnedProjectSnapshot`) wird ohne erneutes `validateProject` übernommen – dieselbe Herkunftsgarantie, mit der Bearbeiten und Rückgängig schon auf eine Prüfung verzichten. Jede andere Eingabe wird wie bisher geprüft.
- **M2** Das von `prepare` erzeugte Modell wird tief eingefroren (`domain/project/frozen-data.ts`, Herkunft privat: Einfrieren durch den Aufrufer zählt nicht) und mit seinem geprüften Projekt gemerkt. Das Versiegeln teilt dieses Modell statt es zu kopieren. Die Prüfung beim Speichern (`prepared: true`) gibt für genau dieses Modellobjekt, wenn alle Bilder selbst vorbereitete sind, das geprüfte Projekt zurück, statt das Modell zu migrieren und erneut zu prüfen.
- **M3** Die Bytezahl des Modells wird je vorbereitetem Modellobjekt gemerkt; die zweite Berechnung bei der Prüfung entfällt. Alle Budgets (Modell, Bilder, Pixel, Projektgröße) gelten weiter für jede Sicherung.
- Unverändert: Speicherformat, Wiederherstellen, Startangebot, Statusanzeige, Aufräumen. Kein Code in `lib/bim`; keine neue Architektur-Ausnahme (die Merkliste liegt in der Domäne).

## Nachweis

- Tests (`src/application/project-files/own-commits.test.ts`): Ein eigener Stand ergibt dasselbe gespeicherte Dokument wie eine veränderbare Kopie, ungültige veränderbare Eingaben werden abgelehnt; die Speicherprüfung gibt das vorbereitete Projekt zurück und die volle Prüfung ergibt dasselbe Projekt; eine Kopie des Modells (wie aus dem Speicher), ein nicht selbst vorbereitetes Bild und ein beschädigtes Modell nehmen den vollen Weg bzw. werden abgelehnt; Modell- und Pixelbudget werden weiter abgelehnt; Versiegeln teilt nur ein vom Codec eingefrorenes Modell, ein vom Aufrufer eingefrorenes wird kopiert. 1313 Tests grün.
- Node (`benchmarks/autosave-model-profile.ts`, echter Schreiber und Codec, Speicher im Arbeitsspeicher mit denselben Prüfungen wie `publish`; Median aus 7, im Wechsel gegen main):

| je Sicherung, ms | vorher  | nachher |
| ---------------- | ------- | ------- |
| l                | 807–843 | 49      |
| s                | 272–279 | 13–14   |

- Browser, Diagnose-Build beider Stände, Sicherungslauf `saves=4` l (je 2 × 4 Sicherungen, `benchmarks/autosave-model-checks-results.json`):

| ms je Sicherung             | vorher  | nachher |
| --------------------------- | ------- | ------- |
| Modellprüfung Schreiber     | 76–85   | 0       |
| Vorbereiten                 | 184–229 | 43–57   |
| Versiegeln                  | 51–62   | 0       |
| Prüfung neuer Stand         | 211–343 | 0       |
| Schreiben (IndexedDB)       | 155–187 | 91–163  |
| **Summe**                   | 694–864 | 138–214 |
| Lange Aufgaben je Sicherung | 632–767 | 0–123   |

- Seit PR474 (vor PR475) zusammen: je Sicherung bei l etwa 1,1–1,3 s → 0,14–0,21 s.
- Vollständiger Schullauf l (je ein Lauf, gleiche Bedingungen): alle Schritte ok, keine Fehler, Neuladen und Wiederherstellen ok; Dauerlauf Median/p95 197/260 → 192/206 ms.

## Grenzen

- Übrig sind das Vorbereiten (Projektgröße, Modellbudget als JSON, Manifest, ≈ 50 ms) und das Schreiben in IndexedDB (≈ 0,1 s, überwiegend asynchron).
- Eine veränderbare (nicht eigene) Eingabe wird weiter vollständig geprüft; sie kommt im Produkt nur in Sonderwegen vor.
- Ein Rechner, Modell l (Browser), Diagnose-Build.
