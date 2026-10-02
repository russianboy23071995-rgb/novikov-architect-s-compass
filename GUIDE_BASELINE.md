# Guide-Etappe 0 – Bestandsaufnahme vom 02.10.2026

## Stand und Belegqualität

Geprüfte Basis: docs/development-guide, Commit 635cde48dc5c1892b9a882bb5da4cb1ebe71972e, enthält den gesamten Entwicklungsstand bis PR #18 einschließlich Kamera aus PR #17. Arbeitszweig dieser Dokumentation: docs/guide-stage-zero. Keine Zusammenführung nach main. Die bereits vorhandene Änderung an src/routeTree.gen.ts hat keinen inhaltlichen Git-Diff (Zeilenenden); sie wird nicht veröffentlicht.

ARCHITECTURE.md bleibt maßgeblich; DEVELOPMENT_GUIDE.md liefert die aktive Reihenfolge. Keine CAD-Implementierung in dieser Etappe. Nachweise sind aktueller Code und heute ausgeführte automatisierte Prüfungen. Bediennachweise aus STABILIZATION.md und dem Kamera-Abschluss wurden zuvor erhoben; heute kein neuer Browser- oder Live-Mikrofontest. Historische Modul-README-Dateien enthalten teilweise überholte Aussagen (z.B. Undo oder Griffe noch geplant); der aktuelle Code ist maßgeblich.

## Prüfungen

- 110/110 Tests erfolgreich: node --experimental-strip-types --test src/lib/bim/*.test.ts src/components/cad/*.test.ts src/rendering/viewport/*.test.ts.
- TypeScript: tsc --noEmit erfolgreich.
- Produktionsbuild: vite build erfolgreich. Hinweise zu vite-tsconfig-paths und inlineDynamicImports bleiben vorhanden.
- Vollständiges eslint .: fehlgeschlagen, 7.891 Fehler der Regel prettier/prettier und sechs react-refresh/only-export-components-Warnungen. Viele Fehler betreffen CRLF-Zeilenenden. Kein pauschales Formatieren im Bestandsaufnahme-PR.
- Ergänzende Diagnose mit ausschließlich deaktivierter prettier/prettier-Regel: null Fehler, sechs Warnungen in badge, button, form, navigation-menu, sidebar, toggle. Diese Diagnose ersetzt keine bestandene vollständige Lint-Prüfung.
- Lokale Logs: outputs/guide-stage0-tests.log, guide-stage0-lint.log, guide-stage0-lint-functional.log, guide-stage0-build.log (außerhalb des Repository-Verzeichnisses).

## Vorhandene Module und Grenzen

Ein Project aus history.present ist die Modellquelle für Grundriss, 3D, Eigenschaften, Dateien und IFC. model.ts validiert stabile globale IDs, Meter, ein Geschoss, gerade Wände, gehostete Fenster und optionale 2D-Linien. Fenstergrenzen und Höhen werden geprüft; Überlappungen mehrerer Fenster, Wandanschlüsse, mehrere Geschosse, Decken und Dächer sind nicht fachlich umgesetzt. Der Slab-Tool-Eintrag ist kein Deckenmodell.

history.ts bietet validierte Snapshot-History (100 Schritte), No-op-Erkennung und validierten JSON-Import bis 10 MB. workflow.test.ts prüft Wand/Fenster, Maße, Verschiebung, Undo/Redo, JSON, 3D-Geometrie und IFC. Geometrie und Picking liegen noch im Übergangsbereich lib/bim. IFC exportiert Wände/Fenster, keine 2D-Linien. Ein bestätigter Archicad-Import ist historischer Nutzernachweis, kein heute wiederholter Importtest.

commands.ts und voice.ts bieten begrenzte deterministische Maßbefehle mit stabiler Auswahl, Vorschau und Schutz vor veraltetem Kontext. Kein frei interpretierender KI-Dienst. Reale Erkennungsprobleme bleiben offen. Direct Edit verwendet transforms.ts und validiert gegen den Ausgangszustand. BimPlan berechnet die Vorschau; CadWorkspace koordiniert EditSession, Auswahl und History-Commit. Genau diese Orchestrierung ist der nächste begrenzte Migrationspunkt.

bim-view.ts enthält nur 0,10-m-Rasterrundung und Ortho. Es existieren keine gemeinsame SnapEngine, geometrischen Fangkandidaten, Hover-Referenzen oder Layer. rendering/viewport/plan-camera.ts ist bereits von BIM und React unabhängige Kameramathematik; geometry/primitives/point.ts liefert Point2. Weitere generische Geometrie und zentrale Toleranzen müssen bedarfsbezogen ergänzt werden.

## Anforderungsmatrix

IDs entsprechen ausschließlich Abschnitt 6 des neuen Guides. „Vorhanden“ gilt für den ausdrücklich genannten heutigen Umfang; künftige Elementtypen sind nicht mitgeprüft. „Teilweise“ kennzeichnet fehlende Teilfunktionen oder Nachweise. Geplante Module sind Zielverantwortlichkeiten, keine bereits existierenden Dateien.

| ID | Wunsch | Status und Code/Nachweis | Nächste Zuordnung / Abnahme |
| --- | --- | --- | --- |
| F01 | Wohnfläche und Rechenweg | Fehlt; model.ts hat keine Räume/Flächenergebnisse | 8–10: gültige Räume, Höhen, geprüftes Regelprofil; unabhängige Beispielrechnung |
| F02 | Nischen, Schornsteine, Vorbauwände | Fehlt; keine Korrekturflächen | 8/10: domain Raum/Korrekturflächen; Abzüge mit Herkunft und Begründung |
| F03 | PDF nach Vorlage | Fehlt; ifc.ts ist kein Berichtsexport | 11: interop Bericht; gerenderte mehrseitige Abnahme |
| F04 | Berichtskopfdaten und Zählungen | Fehlt; Project hat keine Adresse/Berichtsdaten | 11: definiertes Berichtsdatenmodell und nachvollziehbarer Umfang |
| F05 | Verschiebbares Auswahlmenü | Vorhanden für Wand/Fenster/Linie: DemandMenu, demand-menu; Positions-/Auswahltests und frühere Bedienprüfung | 6: erhalten; mit neuen Typen erneut prüfen |
| F06 | Gewählten Punkt verschieben | Vorhanden für Wandenden/Linienpunkte: direct-edit, transforms, BimPlan; direct-edit.test und transforms.test | 1/6: gemeinsamer Application-Pfad, später Snap/Guides |
| F07 | Bewegen | Vorhanden für Wände/Linien und Fenster entlang Host; gleiche Module und workflow.test | 1: Vorschau/Commit/Abbruch als gemeinsame Application-Aktion absichern |
| F08 | Info anzeigen | Vorhanden: DemandMenu öffnet Werkzeugeigenschaften, BimInspector liest Project; demand-menu.test prüft Zusammenfassung | 6: Datenkonsistenz erhalten; keine zweite Info-Datenquelle |
| F09 | Gewählte Seite strecken | Teilweise: Punktstrecken entlang Achse vorhanden; kein paralleles Versetzen einer ganzen Polygonkante | 6 nach Guides: Kante/Nachbarkanten, ungültige Ergebnisse, ein Undo-Schritt |
| F10 | Änderbare Maßstableiste | Teilweise: CadViewport/plan-camera, fünf Kameratests und Browsernachweis; CSS-px/m und Meterleiste, kein Ausgabemaßstab | 7: Ausgabe gesondert definieren; Zoom verändert keine Modellmaße |
| F11 | Referenz über zwei Punkte skalieren | Fehlt; kein Referenzmodell/Assetimport | 7 nach 2/4/6: interop Import, domain Referenz, application Kalibrierung |
| F12 | Neue Länge per Menü/AI-Sprache | Teilweise: Wandmaße per Inspector/Text/Voice; keine Referenzkalibrierung | 7: dieselbe Kalibrieraktion für Menü und Text/Voice; Vorschau/staler Kontext |
| F13 | Gesamte gewählte Referenz skalieren | Fehlt; bestehende Kamera skaliert nur die Ansicht | 7: einheitliche Transformation, erster Messpunkt fest; Dateirundlauf/Undo |
| F14 | Grid, Snap, Hilfslinien | Teilweise: Raster, Rasterrundung/Ortho, Kamera; bim-view.test/plan-camera.test | 2–3: zuerst Endpunktfang, dann Mittelpunkt/Schnittpunkt, anschließend Hover/Guides |
| F15 | 2D-Punkt-zu-Punkt-Linie | Vorhanden: CadWorkspace, BimPlan, model/lines; lines.test; Werkzeug wechselt nach 2D | 2/5: gemeinsame SnapEngine integrieren; kein Erstellen von 3D-Linien behaupten |
| F16 | Linie/Polylinie voreinstellen | Vorhanden: lineKind in CadWorkspace, Abschluss per Doppelklick/Enter; Linien- und historische Bedientests | 5: erhalten; Escape/Nullsegmente und Snap-Anbindung prüfen |
| F17 | Farbe, Stärke, Stricharten | Vorhanden: LineControls, BimInspector, lines.ts/model.ts; lines.test | 5: mm-Stiftbreite/CSS-Darstellung dokumentiert; Druckdarstellung separat |
| F18 | Geschlossene/teiloffene Räume | Fehlt; keine Raum- oder virtuelle Grenzstruktur | 8: zuerst manuelle Polygone, danach innere Wandflächen/ausdrückliche Grenzen |
| F19 | R-001, Name, Fläche | Fehlt | 8: domain Räume; interne ID getrennt von Nummer, eindeutige Nummern/Dateirundlauf |
| F20 | Lichte Höhen/Höhenlinien | Fehlt; Wandhöhe ist keine Raumhöhenverteilung | 9: zunächst definierte Quellen; analytische geneigte Testfläche |
| F21 | Unterer/oberer Bezug | Fehlt | 9: Quellen speichern, Änderungen/Löschen sichtbar behandeln |
| F22 | Höhen in Wohnfläche | Fehlt | 9–10: Höhenbereiche an versionierten Berechnungsdienst übergeben |
| F23 | Schraffur Füllung/Kontur | Fehlt; keine Schraffurentität | 5 nach 2–4: geschlossene validierte Kontur, Layer, History und JSON |
| F24 | Schraffurfarbe/Deckkraft/Mauerwerk | Fehlt; Linienfarbe erfüllt keine Schraffuranforderung | 5: gleicher Schraffurtyp; Darstellungs- und Rundlauftests |
| F25 | Standardebenen | Fehlt; kein Layer-Modell | 4 nach 1: alle zwölf Guide-Ebenen mit stabilen IDs |
| F26 | Standardzuordnung | Fehlt; kein layerId | 4: Außenwand/2D-Zeichnungen, kompatible Migration alter Projekte |
| F27 | Ebenen erstellen/ändern/zuordnen | Fehlt | 4: domain Layer, application Aktionen; belegte Ebene nur mit Neuzuordnung löschen |
| F28 | Organisation > Ebenen | Fehlt; Toolbar enthält keine funktionierende Ebenenverwaltung | 4: eigenes UI-Fenster über denselben Aktionen |
| F29 | Ebenenumschalter/Sichtbarkeit | Fehlt; Grid-Schalter ist keine Ebenensichtbarkeit | 4: Sichtbarkeitsumfang festlegen, Auswahl/Fang filtern, Export separat behandeln |

## Zusätzliche direkte Gesprächsanforderungen

- C01: gemeinsame dezente 3D-Auswahlumrandung für alle Elementtypen bleibt offen. BimSolidView hebt gegenwärtig die Wandfarbe hervor; Fensterwahl markiert den Host. Geplante Zuständigkeit rendering/solid und gemeinsames Picking; stabile IDs beibehalten.
- C02: reale deutsche Sprachbefehle zuverlässiger erkennen bleibt offen. voice.test deckt simulierte Ergebnisse ab, keine Mikrofonqualität. Vor Erweiterung reproduzierbare erkannte Transkripte gegen Parser prüfen.
- C03: Eigenschaften oben, Bewegungsaktionen am Zeiger sind vorhanden (CadWorkspace/BimInspector/DemandMenu); diese Anordnung erhalten.
- C04: Polygonabschluss per Doppelklick ist für Polylinien vorhanden; schließt den Umriss nicht automatisch. Künftige Flächenwerkzeuge brauchen eigene gültige Abschlussregeln.
- Frühere Wünsche nach Wandanschlüssen, mehreren Geschossen/Decken bleiben als fachliche Abhängigkeiten erfasst. Vor automatischer Raum-/Höhenableitung den nötigen Umfang ausdrücklich planen; kein vollständiges Dachwerkzeug still hinzufügen.

## Genau ein nächster Teilauftrag: Guide-Etappe 1a

Einen testbaren Application-Ablauf für die bestehende Aktion „Element frei bewegen“ herausarbeiten. Ziel: Wand oder Linie auswählen → Bewegungsvorschau → bestätigen oder abbrechen → Undo/Redo. Bestehende transforms.ts, editAtPointer und commitProject wiederverwenden; keine neue Geometrie, kein neuer Sprachbefehl, keine neue History-Technik.

Betroffene Grenzen: neues application/direct-edit-Modul hält Start, Vorschau, Bestätigung und Abbruch einer Bewegung; CadWorkspace und BimPlan binden es ein. Auswahl über stabile ID/Typ; Project bleibt history.present. Die Application darf weder Komponenten noch DOM importieren. Vorhandene Maßeingaben und Textbefehle bleiben auf ihren geprüften Modelloperationen; keine umfassende Migration in diesem Teilauftrag. Eine kleine Importgrenzen-Prüfung nur dann ergänzen, wenn sie tatsächliche Importauflösung zuverlässig erfasst.

Abnahmekriterien:
1. Vorschau verändert weder Project noch History; viele Pointerbewegungen erzeugen keinen Undo-Schritt.
2. Bestätigung validiert Ausgangsmodell und Ziel-ID und erzeugt genau einen Undo-Schritt. No-op bleibt ohne Änderung.
3. Escape, Werkzeug-/Auswahlwechsel und ungültiges Ziel hinterlassen keine Teiländerung. Veraltete Vorschau kann nicht auf ein anderes Modell angewendet werden.
4. Wandfenster behalten Host und relative Position; 2D/3D/Eigenschaften, JSON und IFC lesen weiterhin denselben Zustand. Bestehende 110 Tests sowie neue Application-Tests bestehen.
5. Bedienversuch: Wand mit Fenster frei bewegen, abbrechen, erneut bewegen/bestätigen, Undo/Redo; anschließend Linie bewegen. Maße und IDs kontrollieren.

Das ist der nächste Implementierungsauftrag, noch keine Umsetzung in Etappe 0. Endpunktfang folgt nach diesem nachgewiesenen Application-Schritt. Bestehende volle Lint-Fehler sind ein separater bekannter Prüfpunkt und dürfen nicht als neue Regression oder erfolgreiche Gesamtprüfung ausgegeben werden.
