# Gemeinsame Ebenensichtbarkeit — Entwurf 05.10.2026

Basis: 48a896f nach freigegebenem PR #89. Reiner Planungsauftrag zu Guide
Etappe 4, F28/F29 und N17; keine Sichtbarkeit implementiert.

## Codeabgleich

- domain/project/schema.ts: Schema 2 mit Ebenen, keine gespeicherten ModelViews
  oder Sichtbarkeitsfelder. Standard- und belegte Ebenen sind loeschgeschuetzt.
- CadWorkspace/CadViewport: fluechtiger Pane-Index und Bildschirmaufteilung;
  ein Pane-Index ist keine dauerhaft stabile ModelView-ID.
- application/snapping/local-sources.ts cached Geometrie nach Project.
  constraints/snapping/local-source-index.ts hat bereits einen allowed-Filter
  fuer Punkte und Segmente VOR Paaranzahl und Schnittpunktberechnung.
- BimSolidView erstellt Solids aus dem vollstaendigen Projekt. Darstellung,
  Picking und Verdeckung muessen denselben wirksamen Kontext erhalten.

## Verbindliche bestehende Architekturgrenzen

Eine Application-Policy entscheidet gemeinsam fuer Darstellung, Picking und Fang.
Keine Filter je Werkzeug und keine gefilterte zweite Project-Wahrheit. Reale
Fensteroeffnungen bleiben auch bei ausgeblendeter Fensterebene in der Wand.
IFC-Umfang bleibt unabhaengig von Bildschirmfiltern.

Den Geometrieindex weiterverwenden und Eligibility bei jeder Abfrage anwenden.
Sichtbarkeitskontext/Revision in die Gueltigkeit laufender Abfragen aufnehmen.
Entfernte aktive Referenzen und alle Quellen erzeugter Konstruktionspunkte
ebenfalls filtern: verborgene Quellen liefern keine Fluchten/Schnittpunkte.
3D-Verdeckung bleibt eine zusaetzliche Rendering-Pruefung.

## Bestaetigte Nutzerentscheidungen — 05.10.2026

1. Zwei getrennte Sichtbarkeitsbereiche: BIM-Projekt und Ausschnitte/Abbilder.
   Das rohe Modell und seine Arbeitsansichten, Schnitte und Grundrisse teilen
   den BIM-Projektfilter. Ausschnitte (DrawingDocuments) erhalten eigenstaendige
   Filter. Der BIM-Filter ist KEINE vorgelagerte Sperre fuer Ausschnitte: eine
   dort ausgeblendete Ebene kann im Ausschnitt/Layoutbuch sichtbar bleiben.
   Layoutdarstellungen beziehen den Filter ihres gebundenen Ausschnitts.
2. Sichtbarkeit im Projekt speichern; alte Dateien zeigen alle Ebenen.
   Explizite Migration statt stiller Erweiterung des strikten Schema 2.
3. Verborgene Ziele abwaehlen und betroffene Vorschau abbrechen; keine unsichtbare
   Bestaetigung. Navigator darf verborgene Ziele nicht still zur Bearbeitung waehlen.
4. Fenster nur bei sichtbarer Fensterebene UND sichtbarer Host-Wand darstellen.
5. IFC bleibt vollstaendig, unabhaengig von beiden Sichtbarkeitsbereichen.

Diese Regeln ersetzen den urspruenglichen Vorschlag einer getrennten Sichtbarkeit
je ModelView. Ein Ausschnitt bleibt ein Verweis auf das gemeinsame Modell, keine
Bauteilkopie. ModelView/ViewportBinding aus ARCHITECTURE.md beachten.
Noch offen: Startfilter eines neu erstellten Ausschnitts und Undo-Verhalten der
Sichtbarkeitsaenderung. Vorschlag: Startkopie des BIM-Filters, danach unabhaengig;
gespeicherte Ansichtsaktion mit Undo/Redo. Nicht als Nutzerentscheidung behandeln.

## Genau ein naechster begrenzter Auftrag

Eine reine gemeinsame Eligibility-Policy gemaess bestaetigten Produktregeln in
application/layers implementieren und testen. Eingaben: vollstaendiges Project,
expliziter unveraenderlicher Sichtbarkeitskontext und stabile Element-ID.
Der Kontext unterscheidet BIM-Projekt und DrawingDocument-ID; ein Ausschnitt
wird direkt mit seinem eigenen Filter ausgewertet, ohne AND mit dem BIM-Filter.
Ausgabe: Teilnahmeentscheidung und Grund. Fehlende/veraltete Ziele ablehnen.
Wand, Fenster und Linie samt Host-Regel abdecken. Keine React-Abhaengigkeit und
keine separate AI-Modelllogik; spaetere Adapter pinnen Projekt, Ansicht und Ziel.

Noch keine Checkbox, Schemaaenderung oder neue Ansichtsverwaltung in diesem
ersten Auftrag. Integration/Persistenz danach separat begrenzen. Keine leeren Klassen.
Tests: alle Host-/Fensterebenen-Kombinationen, unbekannte IDs, zwei Kontexte auf
demselben Project, unveraenderte Geometrie und IFC. Spaetere Integration muss auch
Paarzahlen, entfernte Guides, Abbruch, Undo, Dateimigration und zwei Ansichten pruefen.

Pruefung dieses Entwurfs: Codepfade und Filtereinstieg gelesen, Architekturgrenzen
abgeglichen. Keine neuen Tests oder Browserabnahme behauptet.
