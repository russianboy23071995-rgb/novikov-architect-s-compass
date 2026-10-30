# Wiederaufnahme nach einer Windows-Neuinstallation

Stand 30.10.2026 (main nach PR514). Kurzanleitung, damit du nach einem neu aufgesetzten Windows genau hier weiterarbeiten kannst.

## Was sicher ist (liegt auf GitHub)

- Der gesamte Code, alle Dokumente, Masterplan, Register, `ZWISCHENSTAND.md`, `AUFGABENLISTE.md` und die Arbeitsweise (`AGENTS.md`) im Repository `russianboy23071995-rgb/novikov-architect-s-compass`.
- Die Browser-Startkonfiguration `.claude/launch.json`.
- Alle gemergten PRs. Der Zweig `fix/hover-reference-idempotent` (Ordner `novikov-hover-loop`) ist ebenfalls hochgeladen.

## Was du vorher sichern solltest

1. **Projekte aus dem Programm:** Jedes Projekt, das du behalten willst, als JSON-Projektdatei speichern. Die automatische Wiederherstellung und die globale Muster-/Stiftbibliothek liegen nur im Speicher des Browsers und gehen verloren.
2. **Ordner `Desktop\Claude_Ablage_Code`** ohne die Unterordner `node_modules`: vor allem die Abnahmeordner (`NOVIKOV-Decken-Abnahme-…`, `NOVIKOV-T-Abnahme-…`) mit den IFC-Testdateien. Die Repository-Ordner selbst lassen sich neu herunterladen.
3. **Optional `C:\Users\cnovi\.claude`:** Verlauf und Notizen der Claude-Sitzungen. Nicht nötig zum Weiterarbeiten, aber praktisch zum Nachlesen.
4. Deine Zugangsdaten (GitHub, Claude) kennst du selbst; sie werden nicht gesichert und nicht in Dateien abgelegt.

## Nach der Neuinstallation

1. Installieren: Git, Node.js 24, Bun, GitHub CLI (`gh`), die Claude-Desktop-App.
2. Bei GitHub anmelden: `gh auth login`.
3. Repository holen: in `Desktop\Claude_Ablage_Code` den Befehl `git clone https://github.com/russianboy23071995-rgb/novikov-architect-s-compass.git` ausführen.
4. Abhängigkeiten installieren: im Repository-Ordner `bun install`.
5. Kurz prüfen: `npm test` muss grün sein.
6. In der Claude-App eine Sitzung mit dem Repository-Ordner öffnen und sagen: „Lies AGENTS.md, ZWISCHENSTAND.md, AUFGABENLISTE.md und docs/TRIMMEN_L04B.md und mach mit L04b weiter.“ Den Browser startet Claude über `.claude/launch.json`.

## Aktueller Stand (30.10.2026)

- Zuletzt erledigt: Raumwerkzeug R1–R4 (PR507–512, in Archicad bestätigt), Tab-Auswahl (PR511), K1 Rechtsklickmenü/Modify-Menü/Zwischenablage (PR513), K2 Darstellungsreihenfolge (PR514).
- **Nächster freigegebener Auftrag: L04b – Wände an Dachflächen trimmen.** Karte mit allen Entscheidungen (Q–U) und dem Bedienablauf (Wände + Dach wählen, „Trimmen…“, Bestätigung) in `docs/TRIMMEN_L04B.md`.
- Arbeitsweise und alle Regeln (Änderungskarte → Freigabe → Branch → Nachweis → Doku → PR → Merge → Status; Browser nur nach Rückfrage, wenn du dort klickst; Werkzeugleiste = häufige Einstellungen, Fenster = alle) stehen in `AGENTS.md`.
- Vollsicherung vom 30.10.2026 (Projektordner, Chatverlauf, Claude-Gedächtnis, App-Daten) auf `D:NOVIKOV-Sicherung-2026-10-30` mit eigener Anleitung „So geht es weiter.md“.
