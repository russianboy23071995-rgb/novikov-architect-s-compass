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
