# Wandbearbeitung und Wandbefehle aus lib/bim gelöst (25.10.2026)

Basis: main ec9acf7 (nach Merge von PR447–PR457). Änderungskarte freigegeben, Variante B
(Importe umstellen, keine Weiterleitung aus `lib/bim`), Zusammenfassung im Tür-Stil.

## Änderungen

- **Wandaktionen:** `addWall` und `updateWall` unverändert von `lib/bim/model.ts` nach
  `application/walls/actions.ts` verschoben (nur Fachcode-Abhängigkeiten).
- **Wandbefehle:** `application/walls/command.ts` (`previewWallCommand`) mit unveränderter
  Grammatik (Wandlänge/Wandhöhe/Wandstärke auf Zahl m/cm/mm), Grenzen und Meldungen;
  Zusammenfassung „wall-1 · Wandlänge: 3 → 6 m“. Verteilung: Tür → Fenster → Wand → Versatz.
- **Rückbau `lib/bim`:** `lib/bim/commands.ts` enthält nur noch den Versatzbefehl und
  `applyCommand`; `lib/bim/model.ts` 202 → 116 Zeilen. Insgesamt −209 Zeilen in `lib/bim`.
- **Importe:** 95 Dateien (Produktiv, Tests, Benchmarks) per Skript auf
  `application/walls/actions` umgestellt; die Architektur-Ausnahme
  `application/walls/body-offset.ts → lib/bim/model.ts` entfällt. Keine neue Ausnahme.
- **Tests:** Wandbefehlstests nach `application/walls/command.test.ts` umgezogen; Sprach-,
  Linien- und Auswahlbefehlstests rufen den neuen Wandbefehl.

## Nachweis

- **Gleichheit:** Vor dem Umzug 124 Fälle festgehalten (6 Modelle inkl. T-Paar, Kette,
  T-Gruppe, Rohdeckenbezug: Endpunkt formen/verschieben, Stärke, Achslage, Höhe, eigener
  Snapshot, Bindungsänderung, Wand anfügen verbunden/frei, unbekannte Wand; 8 Wandbefehle über
  den gemeinsamen Befehlsweg). Danach: 124/124 identisch, einschließlich 56 Ablehnungen mit
  gleicher Meldung. Gegenprobe (ohne T-Anschluss-Abgleich): 24 Abweichungen.
- 1237 Tests, Architektur-Check PASS (eine Ausnahme weniger), beide Typprüfungen, Lint
  (0 Fehler), Build.

## Offen

- `lib/bim/model.ts` enthält weiter `createProject`, Fenster- und Linienaktionen,
  `windowCentre` und `serializeProject`; weitere Schritte nach demselben Muster.

## Nachtrag 25.10.2026: restliche Aktionen aus lib/bim/model.ts

Änderungskarte freigegeben (Speichern/Laden bleibt vorerst als Brücke). Branch
feat/model-actions-out-of-lib, Basis feat/wall-actions-out-of-lib.

- **Verlegt (unverändert):** `createProject` → `application/projects/create.ts`; `addWindow`,
  `windowCentre` → `application/windows/actions.ts` (das doppelte `updateWindow` aus `lib/bim`
  entfällt); `addLine`, `updateLine` → `application/lines/actions.ts`.
- **Weiterleitungen aufgelöst:** `validateProject`, `wallLength` und die Typen werden direkt aus
  `domain/project/schema` importiert.
- **Brücke:** `lib/bim/model.ts` enthält nur noch `serializeProject` und die Weiterleitung von
  `deserializeProject` (13 Zeilen), weil die Anwendungsschicht nicht auf interop zugreifen darf.
- **Importe:** 197 Dateien per Skript umgestellt (plus vier dynamische Importe von Hand).
- **Architektur:** Ausnahmen von 103 auf 67 Kanten gesunken (36 entfallen, die Gruppe
  `application/snapping` ganz); keine neue Ausnahme.
- **Nachweis:** 39 Fälle vor dem Umzug festgehalten (Projekt anlegen inkl. leerer ID; Fenster
  anlegen mit Ebene/Nummer, zu breit, ohne Wand, doppelte ID; Fenster ändern inkl. zu hoch,
  Nummer, unbekannt; Fenstermitte; Linie anlegen/ungültig/ändern/unbekannt), danach 39/39
  identisch inkl. 17 Ablehnungen; Gegenprobe (Ebenenvorgabe vertauscht): 2 Abweichungen.
  1240 Tests, Architektur-Check PASS, beide Typprüfungen, Lint (0 Fehler), Build.
