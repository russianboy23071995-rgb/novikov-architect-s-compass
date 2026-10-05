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

## Offene Produktvorschlaege — keine Nutzerentscheidungen

1. Sichtbarkeit je gespeicherter ModelView statt global. Zwei Pane-Bindings
   derselben ModelView teilen deren Filter; verschiedene ModelViews sind getrennt.
2. Sichtbarkeit im Projekt speichern; alte Dateien zeigen alle Ebenen.
   Explizite Migration statt stiller Erweiterung des strikten Schema 2.
3. Verborgene Ziele abwaehlen und betroffene Vorschau abbrechen; keine unsichtbare
   Bestaetigung. Navigator darf verborgene Ziele nicht still zur Bearbeitung waehlen.
4. Fenster nur bei sichtbarer Fensterebene UND sichtbarer Host-Wand darstellen.
5. Gespeicherte Sichtbarkeitsaenderungen mit Undo/Redo; IFC bleibt vollstaendig.

Global/ansichtsbezogen sowie Speicherung, Host und Abbruch wurden dem Nutzer
zur Auswahl vorgelegt. Ohne Antwort gelten sie nicht als beschlossen. Undo-Regel
vor UI-Implementierung ebenfalls klaeren. Bei globaler Entscheidung denselben
Kontextvertrag mit gemeinsamem Filter verwenden. ModelView/ViewportBinding aus
ARCHITECTURE.md beachten, keinen kompletten Layouteditor vorziehen.

## Genau ein naechster begrenzter Auftrag

Nach Klaerung der Produktregeln eine reine gemeinsame Eligibility-Policy in
application/layers implementieren und testen. Eingaben: vollstaendiges Project,
expliziter unveraenderlicher Sichtbarkeitskontext und stabile Element-ID.
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
