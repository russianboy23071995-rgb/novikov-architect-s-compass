# Entwicklungsplan NOVIKOV CAD

## Guide-Etappe 2a: gemeinsame Fanggrundlage - 02.10.2026

Die reine Engine `src/constraints/snapping/engine.ts` liefert Modellpunkte und Fangkandidaten mit Art, Quelle, Bildschirmabstand und Priorität. Der Application-Adapter `src/application/snapping/project-references.ts` leitet Wandachsenden und vorhandene Linien-/Polylinienpunkte aus dem einzigen Project ab. React stellt nur Ansichtskontext und Anzeige bereit. Als erster Verbraucher nutzt das Linienwerkzeug (einschließlich Polylinien) diese API. Endpunkte innerhalb von 10 CSS-Pixeln haben Vorrang vor dem bisherigen 0,10-m-Raster; gleiche Kandidaten werden deterministisch entschieden. Ortho darf keinen projizierten Punkt als echten Endpunkt ausgeben. Marker und Beschriftung zeigen den wirksamen Fang. Kamera-/Werkzeugwechsel verwerfen veraltete Hoverpositionen.

Prüfung: 124 Tests bestehen, einschließlich sechs neuer Tests zu Rasterpriorität, Zoomabständen, konkurrierenden Kandidaten, Ortho, ungültigen Eingaben, Modelladapter, Undo/Redo und JSON. TypeScript und Produktionsbuild erfolgreich; ESLint ohne Fehler, sechs bekannte React-Refresh-Warnungen. Browser: Linie beginnt nach Klick neben dem Wandende exakt bei 3,037 m statt am Raster; Undo entfernt sie, Redo stellt dieselben Koordinaten wieder her. Endpunktmarker bei rund 105 und 200 px/m geprüft; Escape verwirft einen begonnenen Linienzug.

Praktische Abnahme: Wandlänge auf 3,037 m ändern, Linienwerkzeug und Snap aktivieren, nahe der Mitte der Stirnseite auf das Achsende zeigen. „Endpunkt“ erscheint; dort starten und den zweiten Punkt setzen. Undo/Redo prüfen und denselben Fang bei verändertem Zoom wiederholen.

Grenzen: erste gemeinsame Grundlage, keine vollständige Raster-/Hilfslinienengine. Wandzeichnen und direkte Bearbeitung verwenden noch ihren bisherigen Fangweg. Referenzen werden linear durchsucht; große Projekte, räumlicher Index und Hysterese sind noch nicht geprüft. Mittelpunkte, Schnittpunkte, Hoveraktivierung, Hilfslinien, 3D-Arbeitsebene, laufende Entwurfsvertices und ein Fang-Einstellungsdialog folgen separat. Wandreferenzen sind Achsenden, keine Außenkanten. Das Raster bleibt außerhalb der Endpunkttoleranz der bisherige flächige Fallback.

Nächster kleiner Schritt: Wandzeichnen als zweiten Verbraucher an dieselbe Engine anschließen, ohne Fanglogik zu duplizieren. Prüfen: Wand an bestehendem Linien-/Wandendpunkt, Ortho, Zoom, Abbruch, genau ein Undo sowie Projektdateirundlauf. Danach direkte Bearbeitung und weitere Fangarten schrittweise anbinden.

## Formatbereinigung abgeschlossen – 02.10.2026

`.gitattributes` legt für automatisch erkannte Textdateien LF im Checkout fest; `.prettierrc` verlangt ausdrücklich LF. Die lokalen UTF-8-Textdateien wurden ohne Änderung ihrer Inhalte von CRLF auf LF normalisiert. Prettier hat die noch abweichende Formatierung in ToolRail, den beiden Routendateien und styles.css vereinheitlicht. Binärdateien bleiben unverändert. Keine CAD-Funktion oder Fanglogik wurde geändert.

Prüfung: vollständiges ESLint erfolgreich mit null Fehlern, auch erneut nach dem Produktionsbuild. 118 Tests, TypeScript und Build erfolgreich; keine CRLF-/gemischten Textdateien mehr im geprüften Checkout. Sechs bestehende `react-refresh/only-export-components`-Warnungen bleiben in badge, button, form, navigation-menu, sidebar und toggle sichtbar. Sie betreffen gemischte Komponenten-/Hilfsexporte, keine Formatfehler; ihre strukturelle Bereinigung ist nicht Teil dieses Format-PRs. Keine Lint-Regel wurde abgeschaltet.

Nächster Funktionsauftrag ist Guide-Etappe 2: eine gemeinsame, erweiterbare Raster- und Punktfang-Engine unter constraints/snapping, mit generischer Geometrie und Modelladaptern. Endpunktfang ist ihre erste Fangart, keine separat in Werkzeugen implementierte Logik. Ein expliziter Ansichtskontext liefert bildschirmbezogene Fangabstände; Ergebnisse bleiben Modellkoordinaten. Zunächst einen vollständigen Zeichenablauf integrieren, anschließend das zweite Werkzeug über dieselbe API. Raster, Mittelpunkt, Schnittpunkt und später Referenzen/Guides verwenden die gemeinsame Kandidaten-/Prioritätsstruktur. Leistungsoptimierungen folgen gemessenen Engpässen; beliebig große Projekte sind damit noch nicht nachgewiesen.

## Guide-Etappe 1a abgeschlossen – 02.10.2026

Der neue Application-Controller unter `src/application/direct-edit/controller.ts` koordiniert Start, Bestätigung, Abbruch und Snapshot-History. Die reine Vorschaufunktion verwendet weiterhin die vorhandene Direct-Edit-/Transformationslogik. `CadWorkspace` dispatcht Ereignisse; `BimPlan` meldet Sitzung und Zielpunkt statt selbst einen fertigen Modellzustand zu bestätigen. Bestehende Achs-/Punktaktionen nutzen denselben Lebenszyklus, ohne neue Geometrie. Eigenschaften, Zeichnen, Textbefehle und Laden behalten ihre bisherigen validierten Operationen und geben Ergebnisse an denselben History-Pfad weiter. Es gibt weiterhin genau ein Project.

Nachweise: 118 Tests bestanden, davon acht neue Application-Tests zu Vorschauen, Abbruch, veraltetem Kontext, ungültigen Zielen, No-op/Redo, Linienbewegung, Dateirundlauf, 3D und IFC. TypeScript, gezieltes ESLint der geänderten Dateien und Build erfolgreich. Browser: Vorschau/Abbruch ohne Undo, Wandbewegung mit einem Undo-Schritt, Redo, Linienbewegung und 3D-Wechsel; keine Konsolenfehler. Nach einer Modelländerung wird der alte angeklickte Bewegungsanker verworfen. Eine allgemeine automatische Importgrenzen-Prüfung ist noch nicht implementiert; das neue Modul wurde auf ausschließlich modell-/historybezogene Imports ohne React/DOM geprüft.

Praktische Abnahme: Wand mit Fenster auswählen, „Element frei bewegen“, Vorschau bewegen und Escape drücken. Erneut starten und Ziel anklicken. Einmal Undo muss die Bewegung vollständig zurücknehmen; Redo stellt sie wieder her. Danach denselben Ablauf mit einer Linie prüfen. Maße und Fensterzuordnung bleiben erhalten.

Nächster kleiner Wartungsschritt: Formatierung und Zeilenenden in einem separaten PR bereinigen, bevor weitere Fangfunktionen hinzukommen. LF-Regel für Git/Formatter abstimmen, nur Formatänderungen durchführen, vollständiges Lint sowie Tests/Build prüfen. Die 7.891 Formatfehler und sechs Warnungen aus der Bestandsaufnahme sind historische Ausgangswerte; die Gesamtbereinigung wurde hier nicht behauptet. Danach Guide-Etappe 2: zuerst gemeinsamer Endpunktfang für einen bestehenden Zeichenablauf, anschließend das zweite Werkzeug und weitere Fangarten. Kein freier KI-Parser, neue Elementtypen oder Ersatz für Snapshot-History in diesem Schritt.

## Guide-Etappe 0 abgeschlossen – 02.10.2026

Die aktuelle Bestandsaufnahme und vollständige Matrix für Guide-F01–F29 stehen in [GUIDE_BASELINE.md](GUIDE_BASELINE.md). Geprüft wurde Commit 635cde4 mit dem integrierten Funktionsstand aus PR #17 und Guide aus PR #18. 110 Tests, TypeScript und Build bestehen. Vollständiges Lint schlägt mit 7.891 Formatierungsfehlern und sechs Warnungen fehl; ohne Formatierungsregel null Fehler, sechs Warnungen. Keine CAD-Verhaltensänderung in dieser Etappe.

Nächster einzelner Auftrag: Guide-Etappe 1a, gemeinsame Application-Orchestrierung der vorhandenen freien Elementbewegung (Start, Vorschau, Bestätigung, Abbruch und genau ein Undo-Schritt). Zuständigkeiten und konkrete Abnahmekriterien in GUIDE_BASELINE.md. Bestehende Modell-/Transformations-/History-Funktionen weiterverwenden. Erst danach gemeinsamer Endpunktfang, anschließend weitere Fangarten als getrennte Schritte.

Die folgenden Einträge zur noch offenen Bestandsaufnahme beschreiben den Zustand vor diesem Abschlussnachtrag.

## Aktive Planungsgrundlage ab 02.10.2026

DEVELOPMENT_GUIDE.md enthält den vollständig und unverändert abgelegten neuen Nutzerleitfaden. Er ersetzt die Anlage „0.Where it all Begins“ und die bisherige Etappenreihenfolge als aktive Planungsgrundlage. ARCHITECTURE.md bleibt für Architekturgrenzen maßgeblich. Die nachfolgenden älteren Etappen und Abschlussnachträge bleiben als Nachweise erhalten; ihre Nummern sind historisch und dürfen nicht mit Guide-Etappen 0–12 oder Guide-F01–F29 verwechselt werden.

Aktueller gesicherter Funktionsstand: feat/plan-camera, Commit 2bca281, PR #17 (offen). 110 Tests, TypeScript, gezieltes ESLint, Build und dokumentierte Browserprüfung bestanden. Dies ersetzt noch nicht die vollständige Anforderungszuordnung nach Guide-Etappe 0. Der vorgezogene Bildschirmmaßstab deckt einen Teil von Guide-Etappe 7/F10 ab; Referenzimport, Kalibrierung und Ausgabemaßstab fehlen weiterhin.

Nächster begrenzter Auftrag: Guide-Etappe 0. Aktuellen Code und Prüfungen abgleichen; Matrix für Guide-F01–F29 mit Status, zuständigem Modul und konkretem Nachweis erstellen; vorhandene Funktionen von Teilumsetzungen und fehlenden Funktionen trennen. Insbesondere prüfen, ob vor Endpunktfang ein kleiner gemeinsamer Application-Schritt nötig ist. Keine neue CAD-Funktion in dieser Bestandsaufnahme. Abnahme: alle 29 Wünsche zugeordnet, offene Prüfungen benannt und genau ein ausführbarer Folgeauftrag mit Abnahmekriterien festgelegt.

Übergreifende Gesprächswünsche bleiben bestehen: sichtbare Auswahlumrandung für alle künftigen Elementtypen, Verbesserung der Spracherkennung, Eigenschaften oben und Bewegungsaktionen am Zeiger. Sie werden bei Etappe 0 gesondert zugeordnet. Die ältere Detailspezifikation F13_HILFLINIENSYSTEM.md gehört zu Guide-F14. Vorgeschlagene 600 ms Hover und 10 px Fangradius sind vorläufige, konfigurierbare Werte.

Dieser Dokumentationsschritt archiviert und verankert den Guide; Etappe 0 ist noch nicht abgeschlossen. Danach jeweils ein kleiner Benutzerablauf mit Tests, praktischer Abnahme und aktualisiertem Plan. Bereits geprüfte Funktionen werden wiederverwendet. Keine Änderungen am Architekturvertrag oder am CAD-Verhalten.

## Historischer Entwicklungsplan und Nachweise

Verbindliche Reihenfolge aus dem Nutzerauftrag vom 01.10.2026. Dieser Plan ersetzt die bisherige technische Reihenfolge in FEATURE_ROADMAP.md; die dort erfassten Einzelanforderungen F01–F14 bleiben erhalten. Bereits funktionierende Modell-, UI-, History- und Exportfunktionen werden weiterverwendet. Pro Änderung eine überschaubare, prüfbare Teil-Etappe.

## Etappe 1 Gesamtstand prüfen und stabilisieren

Alle bisherigen Funktionen gemeinsam auf einem eindeutig bezeichneten Entwicklungszweig prüfen. Vollständiger Ablauf: Wand zeichnen → Fenster einsetzen → Maße ändern → Bauteile verschieben → Undo/Redo → speichern → wieder öffnen → IFC exportieren. Gefundene Fehler beheben. Grundriss, 3D, Eigenschaften und Export müssen denselben Modellzustand verwenden. Grenzen dokumentieren und einen geprüften Zwischenstand sichern.

Stand: PR #14 sichert den bisherigen Browserablauf und korrigiert die Mausvorschau, PR #15 ergänzt nur die Liste. Verschiebungen wurden bisher separat geprüft; die durchgehende automatisierte Prüfung wird jetzt um Wand- und Fensterverschiebung, Modellkoordinaten, 3D-Geometrie und IFC-Platzierung ergänzt. Lokale Git-Synchronisierung und die praktische kombinierte Verschiebeabnahme bleiben ausdrücklich Abschlussbedingungen. Keine automatische Zusammenführung oder Release-Markierung.

## Etappe 2 Präzises Zeichnen und Fanghilfen

Zuerst Endpunkte, Mittelpunkte und Schnittpunkte fangen. Anschließend horizontale/vertikale Hilfslinien, Parallelen, Lotrechte und definierte Winkel. Referenzpunkte sichtbar markieren und nach einstellbarer Hover-Verweildauer aktivieren. Bildschirmbezogene Fangabstände und eindeutige Anzeige der aktiven Fanghilfe verwenden. Mit 2D beginnen, danach Verhalten auf einer aktiven 3D-Arbeitsebene definieren. Fangprioritäten, konkurrierende Referenzen, Abbruch und präzise Maßeingaben prüfen.

F13 bleibt die ausführliche Spezifikation. F04 (2D-Kamera/Zoom/Pan/Maßstableiste) als kleine technische Voraussetzung in diese Etappe einordnen. Erster Fangschritt soll vorhandene Geometrie und Werkzeuge nutzen, keine parallele Modellstruktur. Weitere Fangarten erst nach Prüfung der ersten Arten ergänzen.

## Etappe 3 Wandanschlüsse und Öffnungen

Saubere Eck- und T-Verbindungen gerader Wände. Nachvollziehbare Regeln für Achsen, verschiedene Wandstärken und Änderungen verbundener Wände. Mehrere Fenster, Randabstände und Überschneidungen prüfen; unzulässige Änderungen verständlich melden. Kleinen geschlossenen Grundriss bearbeiten, speichern und als IFC exportieren. Die bisherige geometrische Vereinigung überlappender Öffnungen ist keine abgeschlossene fachliche Öffnungsvalidierung.

## Etappe 4 Geschosse und Decken

Mehrere Geschosse mit stabilen IDs, Namen und Höhen; eindeutige Bauteilzuordnung. Einfache horizontale Decken mit Kontur, Stärke und Höhenlage. Zweigeschossiges Beispiel in 2D, 3D, Projektdatei und IFC abgleichen. Migration vorhandener Projektdateien bei Formatänderungen berücksichtigen.

## Etappe 5 Räume und geometrische Flächen

Räume mit stabilen IDs, Namen und eindeutigen Grenzen, zunächst in geschlossenen Grundrissen. Teilweise umschlossene Räume benötigen eine ausdrückliche Begrenzung. Geometrische Fläche berechnen und verwendete Kontur zeigen; Änderungen begrenzender Wände prüfen. Geometrische Raumfläche und Wohnfläche nach WoFlV als getrennte Auswertungen führen. F06 und passende Teile von F07 hier einordnen.

## Etappe 6 Dächer lichte Höhen und Wohnflächen

Einfache Dachschrägen und lichte Höhen zwischen fertigem Fußboden und begrenzender Oberfläche. Wohnflächenregeln anhand der zum Umsetzungszeitpunkt geltenden WoFlV recherchieren und mit fachlich geprüften Beispielen absichern. Höhenbereiche und relevante Abzüge berücksichtigen. Bericht mit Raumdaten, Flächenanteilen, Annahmen und Rechenweg, danach PDF-Export gemäß F08/F09.

## Weitere Funktionen

- On-Demand-Menü mit den jeweiligen geprüften Bearbeitungsaktionen weiterentwickeln; Eigenschaften bleiben oben, Bewegungsaktionen am Zeiger.
- Schraffuren und Referenzimport/-skalierung jeweils als eigene kleine Etappen nach grundlegenden Fang- und Maßeingabefunktionen. PDF/Bild anhand zweier Punkte und bekannter Länge skalieren (F05/F10).
- Text- und Sprachbefehle nur auf bereits geprüfte Modellfunktionen erweitern. Maus, Maßeingabe und Copilot verwenden dieselben validierten Aktionen. F11 bleibt offen.
- F12 (gemeinsame Auswahlumrandung) und F14 (Ebenensystem) bleiben geplant. Ebenensichtbarkeit bei Fangfiltern berücksichtigen und Ebenen vor größeren Projekten einordnen, ohne die sechs Etappen umzudeuten.

## Arbeitsweise und Abnahme

Für jeden Teil-Schritt: aktuellen Code und Abhängigkeiten prüfen; kleinen Umfang festlegen; implementieren und passende Tests ausführen; praktische Abnahmeanleitung liefern; Ergebnis und Einschränkungen dokumentieren. NOVIKOV Glass Flow erhalten und Bedienabläufe mit bestehenden Werkzeugen abstimmen. Entwicklungszweige und Pull Requests verwenden; Übernahme nach main erst nach Prüfung.

Nächste Abnahme für Etappe 1: neue 3-m-Wand mit mittigem 1,20-m-Fenster erstellen, auf 6 m verlängern, ganze Wand über On-Demand-Menü verschieben, Fenster entlang der Wand verschieben, beide Schritte einzeln rückgängig/wiederherstellen, speichern, Maße verändern, gespeichertes Projekt laden und IFC exportieren. Grundriss/3D/Hostzuordnung und Exportplatzierung abgleichen. Automatisierte Prüfung ersetzt diese abschließende Bedienabnahme nicht.

### Abschlussnachtrag Etappe 1

Git-Synchronisierung und kombinierte praktische Verschiebeabnahme sind am 01.10.2026 abgeschlossen; Nachweis in STABILIZATION.md. Etappe 1 ist damit technisch geprüft, die Übernahme nach main bleibt der PR-Prüfung vorbehalten. Die frühere Aufzählung offener Abschlussbedingungen beschreibt den Stand vor diesem Nachtrag. Etappe 2 kann auf dem gesicherten Gesamtstand beginnen.

### Etappe 2a – 2D-Ansichtsnavigation (02.10.2026)

F04 als Voraussetzung für bildschirmbezogene Fangabstände umgesetzt: Zoom am Mauszeiger, Plus/Minus, Pan per mittlerer Maustaste oder Pan-Schalter, Fit/Reset und Bildschirmmaßstab mit grafischer Meterleiste. Das Raster liegt in Modellkoordinaten und passt seinen sichtbaren Abstand dem Zoom an. Auswahlgriffe bleiben 10 CSS-Pixel groß. Die irreführende feste Fit-Anzeige der globalen Statusleiste entfällt.

Architektur: reine Kameramathematik unter src/rendering/viewport, generischer Point2 unter src/geometry/primitives. Kamera ist flüchtiger Zustand je Ansicht. Das bestehende Project bleibt die einzige Modellquelle; keine Modellaktion, History-Änderung, Dateimigration oder IFC-Anpassung durch Navigation. Alle bestehenden Modellbearbeitungen verwenden weiterhin die geprüften Operationen.

Prüfung: 110 Tests bestanden (105 bestehende, 5 Kamera-Tests), TypeScript, gezieltes ESLint und Produktionsbuild erfolgreich. Browser: Zoomanker bleibt bis auf numerisches Rauschen fest; Pan erzeugt keinen Undo-Eintrag; 300 Pixel bei 100 px/m ergeben 3 m; direktes Strecken um 100 Pixel ergibt 4 m; Undo stellt 3 m, Redo 4 m wieder her. Wechsel zu 3D erfolgreich.

Praktische Abnahme: 2D öffnen, über einer Wandecke mit dem Mausrad zoomen; die Ecke bleibt unter dem Zeiger. Pan aktivieren und ziehen, danach Escape drücken. Maße müssen gleich bleiben. Fit view zeigt das ganze Modell. 100 px/m wählen und zeichnen/bearbeiten; anschließend Undo/Redo prüfen.

Grenzen: px/m ist ein Bildschirmmaßstab, kein Druckmaßstab. Rasterdarstellung ist adaptiv; das bisherige optionale Rasterfangen bleibt ausdrücklich bei 0,10 m. Kameras werden nicht in Projektdateien gespeichert und beim Wechsel des Viewport-Layouts neu initialisiert. Geometrisches Fangen, Referenzaktivierung und Hilfslinien sind noch offen. Nächster Schritt: gemeinsame Endpunkt-/Mittelpunkt-/Schnittpunkt-Kandidaten unter constraints/snapping gemäß ARCHITECTURE.md und F13.
