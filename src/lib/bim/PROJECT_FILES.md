# Projektdateien und Änderungshistorie

**Save project** lädt das aktuelle validierte Modell als `novikov-project.json` herunter. Die Datei enthält Version 1, Meter als Einheit, Projekt/Geschoss und alle Wand-/Fensterparameter sowie optionale 2D-Linien/Polylinien einschließlich Stil und stabilen IDs. Nicht übernommene Formulareingaben, Auswahl, Kamera und Undo-Historie sind nicht enthalten. Die Anwendung meldet den angeforderten Download, nicht einen bestätigten Schreibvorgang auf der Festplatte.

**Open project** öffnet eine JSON-Datei bis 10 MB. Erst nach vollständiger Validierung zeigt ein Dialog Dateiname und Bauteilanzahlen. **Projekt laden** ersetzt das Modell; **Abbrechen** behält es. Fehlerhafte Dateien, falsche Versionen/Einheiten und ungültige Geometrie werden abgewiesen. IFC-Dateien sind Austauschdateien und können hier nicht geladen werden.

**Undo** und **Redo** arbeiten auf vollständigen Modellständen, einschließlich Wand-/Fenstererstellung, Eigenschaftsänderungen, übernommenen Befehlen und geladenen Projekten. Auswahl wird bei Undo/Redo gelöscht, damit keine veraltete Element-ID Ziel weiterer Befehle bleibt. Zeichenvorgänge werden abgebrochen. Kamera und reine Auswahländerungen gehören nicht zur Historie. Eine neue Modelländerung nach Undo verwirft die Redo-Zukunft; unveränderte Übernahmen erzeugen keinen zusätzlichen Eintrag. Maximal 100 Änderungen werden gehalten.

Dateien werden ausschließlich vom Nutzer geöffnet oder heruntergeladen. Es gibt weiterhin kein automatisches Speichern und keinen Server. Nach Neuladen die gespeicherte JSON-Datei erneut öffnen. Änderungen vor einem Reload deshalb über Save sichern. Die Historie gilt nur für die laufende Sitzung.

Acht Tests ergänzen die bisherigen 64: Dateirundlauf und Bearbeitbarkeit, vollständiges Undo/Redo, Bauteilerstellung, neue Historienzweige/No-ops, rückgängig machbares Laden, Fehler/Größenlimit, Historienlimit und Schutz vor Mutation durch Aufrufer. TypeScript, gezieltes ESLint und Produktionsbuild gehören zur Prüfung.
