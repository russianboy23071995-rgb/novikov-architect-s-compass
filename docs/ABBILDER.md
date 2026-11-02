# Abbilder für Schnitte und Ansichten, Pflichtangaben aller Abbilder

Nutzerauftrag 02.11.2026: Schnitte und Ansichten müssen wie Grundrisse als Abbild gesichert werden können. Für **alle** Abbilder – Grundriss, Schnitt, Ansicht und jede künftige Art – gilt von nun an: Der **Zeichnungsname** (der Name, den das Abbild bekommt) und der **Maßstab** sind immer hinterlegt. Beide werden später als automatische Texte im Planlayout (Plankopf) übernommen.

Entscheidungen (Empfehlungen übernommen):

1. Ein Schnitt bzw. eine Ansicht mit Abbildern lässt sich erst löschen, wenn die Abbilder gelöscht sind.
2. Vorgabe-Maßstab eines neuen Schnitt-/Ansichts-Abbilds: der aktuelle Projektmaßstab.
3. Ebenen-Sichtbarkeit bei Schnitt-/Ansichts-Abbildern vorerst nicht (sie zeigen alles wie der Schnitt-Tab).
4. Der Ausschnitt eines Schnitt-Abbilds wird vorerst nicht gespeichert; es öffnet eingepasst.

Reihenfolge: AB1 Datenmodell → AB2 Oberfläche.

## AB1 – Datenmodell

- **Projektdatei Schema 46.** Die Modellansicht eines Abbilds ist **Grundriss** (`floor-plan`, Geschoss) oder **Schnitt/Ansicht** (`section`, verweist auf den Schnitt; ob Schnitt oder Ansicht, ergibt sich aus dem Schnitt). Je Schnitt gibt es eine Modellansicht, die alle seine Abbilder teilen. Dateien mit Schema 45 werden übernommen, ihre Grundriss-Abbilder bleiben unverändert; Schnitt-Modellansichten in einer Datei mit Schema 45 werden abgelehnt.
- **Pflichtangaben für jedes Abbild:** Zeichnungsname (1–120 Zeichen) und Maßstab (positiv). Geprüft für alle Arten; ein Schnitt-Abbild wird zusätzlich auf seinen Ordner und seine Ebenenliste geprüft, und sein Schnitt muss existieren.
- **`drawingInfo(project, documentId)`** (`src/application/views/drawing-info.ts`): die gemeinsame Auskunft jedes Abbilds – Art (Grundriss/Schnitt/Ansicht), Zeichnungsname, Maßstab als „1:50“, gezeigtes Geschoss bzw. gezeigter Schnitt. Die automatischen Texte lesen hier; jede künftige Abbildart muss diese Abfrage bedienen.
- **Aktion** „Schnitt-/Ansichts-Abbild anlegen“ (`create-section` in `changeDrawingDocument`): Name, Maßstab, Ordner. Die bestehenden Aktionen (umbenennen, Maßstab, Einstellungen, Ordner, löschen) gelten für alle Arten.
- **Schnitt löschen** wird abgelehnt, solange Abbilder ihn zeigen („Wird von 1 Abbild verwendet. Bitte zuerst die Abbilder löschen.“); danach verschwindet auch seine Modellansicht.
- Öffnen eines Schnitt-Abbilds aus dem Navigator öffnet vorerst den Tab seines Schnitts (vollständig mit AB2).

Nachweis AB1: 1506 Tests grün (3 neu in `src/application/views/drawing-info.test.ts`: Grundriss-, Schnitt- und Ansichts-Abbild mit Name und Maßstab, gemeinsame Modellansicht, Pflichtangaben, Dateirundlauf; Löschsperre und Aufräumen; Schema 45 → 46), Typprüfung beider Projekte, Architektur, Lint, Formatierung sauber, 14-Modell-Prüfsumme unverändert (`e42aa36e…`). Browser: nur Startprüfung (App lädt mit Schema 46 ohne Fehler); weitere Browser-Schritte abgebrochen, weil während der Tests in der Browser-Ansicht geklickt wurde.
