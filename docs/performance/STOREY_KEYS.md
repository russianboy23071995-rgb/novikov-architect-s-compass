# Geschossprüfung eingrenzen (`storeyKeys`, 03.11.2026)

Korrektur 2 aus dem Gesamtnachweis (docs/performance/GESAMTNACHWEIS_2026-11.md). Freigabe der Änderungskarte durch den Nutzer am 03.11.2026.

## Befund

- Die Prüfung eines Geschosses (`validateStoreyScope`) liest neben dem Geschoss nur wenige Werte:
  - Projekt-ID, Ebenen und Standardebenen,
  - Bilder und Schraffurmuster,
  - Abbildordner,
  - Arbeitsansichten, Grundriss-Ansichten und Abbilder dieses Geschosses,
  - die Ebenensichtbarkeit.
- Der Schlüssel zur Wiederverwendung (`storeyKeys`) enthielt aber jeden Projektwert. Ändert sich eine Layoutlinie, eine Projektinformation oder ein Schnitt, wurden deshalb alle Geschosse neu geprüft (20 000 Elemente: 310–330 ms).
- Zweiter Befund bei der Umsetzung: Eine Änderung im Layout- oder Plankopf-Bereich schrieb Ebenen, Bilder und Muster als neue Objekte ins Projekt zurück, auch wenn sie inhaltlich gleich waren. Der Grund: Der Bereich wird als eigener Snapshot angelegt (`spaceLens`), und `fromSpaceLens` baute die Musterliste immer neu. Deshalb half das Eingrenzen des Schlüssels allein noch nicht.

## Umsetzung

- `domain/project/schema.ts`:
  - **Schlüssel eingrenzen:** `storeyKeys` nimmt nur noch die Felder aus `STOREY_SCOPE_FIELDS` auf (`id`, `layers`, `defaultLayerIds`, `assets`, `hatchPatterns`, `documentFolders`). Dazu kommen die Arbeitsansichten, Grundriss-Ansichten und deren Abbilder des jeweiligen Geschosses, je Objekt. Ein neues Feld, das die Geschossprüfung liest, muss in diese Liste; der Kommentar an der Liste sagt das.
  - **Sichtbarkeit einmal je Projekt:** Ob die ausgeblendeten Ebenen existieren, prüft `validateProject` jetzt einmal für das Projekt. Die Geschossprüfung prüft es weiter mit, die Sichtbarkeit steht aber nicht im Schlüssel. Ein wiederverwendetes Geschoss wird so trotzdem abgesichert.
- `application/views/title-block-space.ts`:
  - `spaceLens` legt den Bereich mit dem echten Projekt als Basis an (`createProjectSnapshot(…, undefined, real)`), unveränderte gemeinsame Werte behalten so ihre Objekte.
  - `fromSpaceLens` behält die Musterliste des Projekts, wenn kein Muster neu oder geändert ist.

## Ergebnis (Node, Gesamtmodell, Median)

| Modell | Layoutlinie vorher → nachher | Projektinformation vorher → nachher | Geschosse neu geprüft |
| ------ | ---------------------------- | ----------------------------------- | --------------------- |
| 3 000  | 43 → 3,4 ms                  | 38 → 2,7 ms                         | 5 → 0                 |
| 10 000 | 124 → 10,7 ms                | 134 → 10,7 ms                       | 5 → 0                 |
| 20 000 | 328 → 32 ms                  | 311 → 31 ms                         | 5 → 0                 |

- Eine Wandänderung bleibt wie bisher bei 1 neu geprüften Geschoss (20 000: 91 ms), Öffnen bei etwa 0,7 s.
- Rohdaten: `gesamtnachweis-2026-11/node-storey-keys.json`, der Vorher-Stand steht in `node.json`.

## Nachweis

- **`benchmarks/storey-keys.test.ts`, erster Test:** Am Gesamtmodell werden nacheinander ausgeführt:
  - Linie auf einem Layout (0 Geschosse neu),
  - Projektinformation (0),
  - Schnitt verschieben (0),
  - Maßstab eines Schnitt-Abbilds (0),
  - Maßstab des Grundriss-Abbilds des 2. OG (1),
  - Wandänderung (1).

  Nach jedem Schritt ist der Stand gleich einer vollen Prüfung derselben Datei ohne Wiederverwendung.

- **Zweiter Test:** Ungültige Werte werden trotz Wiederverwendung abgelehnt: unbekannte ausgeblendete Ebene, eine von Wänden genutzte Ebene gelöscht, unbekannter Abbildordner eines Grundriss-Abbilds.
- **Prüfungen:** 1543 Tests grün, Typprüfung, Lint, Architekturprüfung; 14-Modell-Hash `e42aa36e…` unverändert.
- **Browser** (Gesamtmodell 3 000): Auf Plan 1 eine Linie gezeichnet und mit Strg+Z entfernt. Kein Aktualisierungssymbol, keine Meldung, keine Konsolenfehler.

## Grenzen

- **Ebenensichtbarkeit:** Sie steht nicht mehr im Schlüssel. Ihre Änderungen gehen aber meist über einen eigenen Verlauf (`visibility`) ohne Modellprüfung. Hier wurde nichts zusätzlich gemessen.
- **Gemeinsame Werte:** Ändert man Ebenen, Muster oder Bilder, werden weiterhin alle Geschosse neu geprüft. Das ist richtig, denn jede Geschossprüfung liest sie.
