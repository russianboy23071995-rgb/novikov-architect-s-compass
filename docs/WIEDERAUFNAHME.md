# Wiederaufnahme nach einer Windows-Neuinstallation

Stand 29.10.2026. Kurzanleitung, damit du nach einem neu aufgesetzten Windows genau hier weiterarbeiten kannst.

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
6. In der Claude-App eine Sitzung mit dem Repository-Ordner öffnen und sagen: „Lies AGENTS.md, ZWISCHENSTAND.md und AUFGABENLISTE.md und mach weiter.“ Den Browser startet Claude über `.claude/launch.json`.
