# Entwicklungsplan NOVIKOV CAD

## Guide-Etappe 2a: gemeinsame Fanggrundlage - 02.10.2026

Die reine Engine `src/constraints/snapping/engine.ts` liefert Modellpunkte und Fangkandidaten mit Art, Quelle, Bildschirmabstand und Priorit�t. Der Application-Adapter `src/application/snapping/project-references.ts` leitet Wandachsenden und vorhandene Linien-/Polylinienpunkte aus dem einzigen Project ab. React stellt nur Ansichtskontext und Anzeige bereit. Als erster Verbraucher nutzt das Linienwerkzeug (einschlie�lich Polylinien) diese API. Endpunkte innerhalb von 10 CSS-Pixeln haben Vorrang vor dem bisherigen 0,10-m-Raster; gleiche Kandidaten werden deterministisch entschieden. Ortho darf keinen projizierten Punkt als echten Endpunkt ausgeben. Marker und Beschriftung zeigen den wirksamen Fang. Kamera-/Werkzeugwechsel verwerfen veraltete Hoverpositionen.

Pr�fung: 124 Tests bestehen, einschlie�lich sechs neuer Tests zu Rasterpriorit�t, Zoomabst�nden, konkurrierenden Kandidaten, Ortho, ung�ltigen Eingaben, Modelladapter, Undo/Redo und JSON. TypeScript und Produktionsbuild erfolgreich; ESLint ohne Fehler, sechs bekannte React-Refresh-Warnungen. Browser: Linie beginnt nach Klick neben dem Wandende exakt bei 3,037 m statt am Raster; Undo entfernt sie, Redo stellt dieselben Koordinaten wieder her. Endpunktmarker bei rund 105 und 200 px/m gepr�ft; Escape verwirft einen begonnenen Linienzug.

Praktische Abnahme: Wandl�nge auf 3,037 m �ndern, Linienwerkzeug und Snap aktivieren, nahe der Mitte der Stirnseite auf das Achsende zeigen. "Endpunkt" erscheint; dort starten und den zweiten Punkt setzen. Undo/Redo pr�fen und denselben Fang bei ver�ndertem Zoom wiederholen.

Grenzen: erste gemeinsame Grundlage, keine vollst�ndige Raster-/Hilfslinienengine. Wandzeichnen und direkte Bearbeitung verwenden noch ihren bisherigen Fangweg. Referenzen werden linear durchsucht; gro�e Projekte, r�umlicher Index und Hysterese sind noch nicht gepr�ft. Mittelpunkte, Schnittpunkte, Hoveraktivierung, Hilfslinien, 3D-Arbeitsebene, laufende Entwurfsvertices und ein Fang-Einstellungsdialog folgen separat. Wandreferenzen sind Achsenden, keine Au�enkanten. Das Raster bleibt au�erhalb der Endpunkttoleranz der bisherige fl�chige Fallback.

N�chster kleiner Schritt: Wandzeichnen als zweiten Verbraucher an dieselbe Engine anschlie�en, ohne Fanglogik zu duplizieren. Pr�fen: Wand an bestehendem Linien-/Wandendpunkt, Ortho, Zoom, Abbruch, genau ein Undo sowie Projektdateirundlauf. Danach direkte Bearbeitung und weitere Fangarten schrittweise anbinden.

## Formatbereinigung abgeschlossen - 02.10.2026

`.gitattributes` legt f�r automatisch erkannte Textdateien LF im Checkout fest; `.prettierrc` verlangt ausdr�cklich LF. Die lokalen UTF-8-Textdateien wurden ohne �nderung ihrer Inhalte von CRLF auf LF normalisiert. Prettier hat die noch abweichende Formatierung in ToolRail, den beiden Routendateien und styles.css vereinheitlicht. Bin�rdateien bleiben unver�ndert. Keine CAD-Funktion oder Fanglogik wurde ge�ndert.

Pr�fung: vollst�ndiges ESLint erfolgreich mit null Fehlern, auch erneut nach dem Produktionsbuild. 118 Tests, TypeScript und Build erfolgreich; keine CRLF-/gemischten Textdateien mehr im gepr�ften Checkout. Sechs bestehende `react-refresh/only-export-components`-Warnungen bleiben in badge, button, form, navigation-menu, sidebar und toggle sichtbar. Sie betreffen gemischte Komponenten-/Hilfsexporte, keine Formatfehler; ihre strukturelle Bereinigung ist nicht Teil dieses Format-PRs. Keine Lint-Regel wurde abgeschaltet.

N�chster Funktionsauftrag ist Guide-Etappe 2: eine gemeinsame, erweiterbare Raster- und Punktfang-Engine unter constraints/snapping, mit generischer Geometrie und Modelladaptern. Endpunktfang ist ihre erste Fangart, keine separat in Werkzeugen implementierte Logik. Ein expliziter Ansichtskontext liefert bildschirmbezogene Fangabst�nde; Ergebnisse bleiben Modellkoordinaten. Zun�chst einen vollst�ndigen Zeichenablauf integrieren, anschlie�end das zweite Werkzeug �ber dieselbe API. Raster, Mittelpunkt, Schnittpunkt und sp�ter Referenzen/Guides verwenden die gemeinsame Kandidaten-/Priorit�tsstruktur. Leistungsoptimierungen folgen gemessenen Engp�ssen; beliebig gro�e Projekte sind damit noch nicht nachgewiesen.

## Guide-Etappe 1a abgeschlossen - 02.10.2026

Der neue Application-Controller unter `src/application/direct-edit/controller.ts` koordiniert Start, Best�tigung, Abbruch und Snapshot-History. Die reine Vorschaufunktion verwendet weiterhin die vorhandene Direct-Edit-/Transformationslogik. `CadWorkspace` dispatcht Ereignisse; `BimPlan` meldet Sitzung und Zielpunkt statt selbst einen fertigen Modellzustand zu best�tigen. Bestehende Achs-/Punktaktionen nutzen denselben Lebenszyklus, ohne neue Geometrie. Eigenschaften, Zeichnen, Textbefehle und Laden behalten ihre bisherigen validierten Operationen und geben Ergebnisse an denselben History-Pfad weiter. Es gibt weiterhin genau ein Project.

Nachweise: 118 Tests bestanden, davon acht neue Application-Tests zu Vorschauen, Abbruch, veraltetem Kontext, ung�ltigen Zielen, No-op/Redo, Linienbewegung, Dateirundlauf, 3D und IFC. TypeScript, gezieltes ESLint der ge�nderten Dateien und Build erfolgreich. Browser: Vorschau/Abbruch ohne Undo, Wandbewegung mit einem Undo-Schritt, Redo, Linienbewegung und 3D-Wechsel; keine Konsolenfehler. Nach einer Modell�nderung wird der alte angeklickte Bewegungsanker verworfen. Eine allgemeine automatische Importgrenzen-Pr�fung ist noch nicht implementiert; das neue Modul wurde auf ausschlie�lich modell-/historybezogene Imports ohne React/DOM gepr�ft.

Praktische Abnahme: Wand mit Fenster ausw�hlen, "Element frei bewegen", Vorschau bewegen und Escape dr�cken. Erneut starten und Ziel anklicken. Einmal Undo muss die Bewegung vollst�ndig zur�cknehmen; Redo stellt sie wieder her. Danach denselben Ablauf mit einer Linie pr�fen. Ma�e und Fensterzuordnung bleiben erhalten.

N�chster kleiner Wartungsschritt: Formatierung und Zeilenenden in einem separaten PR bereinigen, bevor weitere Fangfunktionen hinzukommen. LF-Regel f�r Git/Formatter abstimmen, nur Format�nderungen durchf�hren, vollst�ndiges Lint sowie Tests/Build pr�fen. Die 7.891 Formatfehler und sechs Warnungen aus der Bestandsaufnahme sind historische Ausgangswerte; die Gesamtbereinigung wurde hier nicht behauptet. Danach Guide-Etappe 2: zuerst gemeinsamer Endpunktfang f�r einen bestehenden Zeichenablauf, anschlie�end das zweite Werkzeug und weitere Fangarten. Kein freier KI-Parser, neue Elementtypen oder Ersatz f�r Snapshot-History in diesem Schritt.

## Guide-Etappe 0 abgeschlossen - 02.10.2026

Die aktuelle Bestandsaufnahme und vollst�ndige Matrix f�r Guide-F01-F29 stehen in [GUIDE_BASELINE.md](GUIDE_BASELINE.md). Gepr�ft wurde Commit 635cde4 mit dem integrierten Funktionsstand aus PR #17 und Guide aus PR #18. 110 Tests, TypeScript und Build bestehen. Vollst�ndiges Lint schl�gt mit 7.891 Formatierungsfehlern und sechs Warnungen fehl; ohne Formatierungsregel null Fehler, sechs Warnungen. Keine CAD-Verhaltens�nderung in dieser Etappe.

N�chster einzelner Auftrag: Guide-Etappe 1a, gemeinsame Application-Orchestrierung der vorhandenen freien Elementbewegung (Start, Vorschau, Best�tigung, Abbruch und genau ein Undo-Schritt). Zust�ndigkeiten und konkrete Abnahmekriterien in GUIDE_BASELINE.md. Bestehende Modell-/Transformations-/History-Funktionen weiterverwenden. Erst danach gemeinsamer Endpunktfang, anschlie�end weitere Fangarten als getrennte Schritte.

Die folgenden Eintr�ge zur noch offenen Bestandsaufnahme beschreiben den Zustand vor diesem Abschlussnachtrag.

## Aktive Planungsgrundlage ab 02.10.2026

DEVELOPMENT_GUIDE.md enth�lt den vollst�ndig und unver�ndert abgelegten neuen Nutzerleitfaden. Er ersetzt die Anlage "0.Where it all Begins" und die bisherige Etappenreihenfolge als aktive Planungsgrundlage. ARCHITECTURE.md bleibt f�r Architekturgrenzen ma�geblich. Die nachfolgenden �lteren Etappen und Abschlussnachtr�ge bleiben als Nachweise erhalten; ihre Nummern sind historisch und d�rfen nicht mit Guide-Etappen 0-12 oder Guide-F01-F29 verwechselt werden.

Aktueller gesicherter Funktionsstand: feat/plan-camera, Commit 2bca281, PR #17 (offen). 110 Tests, TypeScript, gezieltes ESLint, Build und dokumentierte Browserpr�fung bestanden. Dies ersetzt noch nicht die vollst�ndige Anforderungszuordnung nach Guide-Etappe 0. Der vorgezogene Bildschirmma�stab deckt einen Teil von Guide-Etappe 7/F10 ab; Referenzimport, Kalibrierung und Ausgabema�stab fehlen weiterhin.

N�chster begrenzter Auftrag: Guide-Etappe 0. Aktuellen Code und Pr�fungen abgleichen; Matrix f�r Guide-F01-F29 mit Status, zust�ndigem Modul und konkretem Nachweis erstellen; vorhandene Funktionen von Teilumsetzungen und fehlenden Funktionen trennen. Insbesondere pr�fen, ob vor Endpunktfang ein kleiner gemeinsamer Application-Schritt n�tig ist. Keine neue CAD-Funktion in dieser Bestandsaufnahme. Abnahme: alle 29 W�nsche zugeordnet, offene Pr�fungen benannt und genau ein ausf�hrbarer Folgeauftrag mit Abnahmekriterien festgelegt.

�bergreifende Gespr�chsw�nsche bleiben bestehen: sichtbare Auswahlumrandung f�r alle k�nftigen Elementtypen, Verbesserung der Spracherkennung, Eigenschaften oben und Bewegungsaktionen am Zeiger. Sie werden bei Etappe 0 gesondert zugeordnet. Die �ltere Detailspezifikation F13_HILFLINIENSYSTEM.md geh�rt zu Guide-F14. Vorgeschlagene 600 ms Hover und 10 px Fangradius sind vorl�ufige, konfigurierbare Werte.

Dieser Dokumentationsschritt archiviert und verankert den Guide; Etappe 0 ist noch nicht abgeschlossen. Danach jeweils ein kleiner Benutzerablauf mit Tests, praktischer Abnahme und aktualisiertem Plan. Bereits gepr�fte Funktionen werden wiederverwendet. Keine �nderungen am Architekturvertrag oder am CAD-Verhalten.

## Historischer Entwicklungsplan und Nachweise

Verbindliche Reihenfolge aus dem Nutzerauftrag vom 01.10.2026. Dieser Plan ersetzt die bisherige technische Reihenfolge in FEATURE_ROADMAP.md; die dort erfassten Einzelanforderungen F01-F14 bleiben erhalten. Bereits funktionierende Modell-, UI-, History- und Exportfunktionen werden weiterverwendet. Pro �nderung eine �berschaubare, pr�fbare Teil-Etappe.

## Etappe 1 Gesamtstand pr�fen und stabilisieren

Alle bisherigen Funktionen gemeinsam auf einem eindeutig bezeichneten Entwicklungszweig pr�fen. Vollst�ndiger Ablauf: Wand zeichnen  Fenster einsetzen  Ma�e �ndern  Bauteile verschieben  Undo/Redo  speichern  wieder �ffnen  IFC exportieren. Gefundene Fehler beheben. Grundriss, 3D, Eigenschaften und Export m�ssen denselben Modellzustand verwenden. Grenzen dokumentieren und einen gepr�ften Zwischenstand sichern.

Stand: PR #14 sichert den bisherigen Browserablauf und korrigiert die Mausvorschau, PR #15 erg�nzt nur die Liste. Verschiebungen wurden bisher separat gepr�ft; die durchgehende automatisierte Pr�fung wird jetzt um Wand- und Fensterverschiebung, Modellkoordinaten, 3D-Geometrie und IFC-Platzierung erg�nzt. Lokale Git-Synchronisierung und die praktische kombinierte Verschiebeabnahme bleiben ausdr�cklich Abschlussbedingungen. Keine automatische Zusammenf�hrung oder Release-Markierung.

## Etappe 2 Pr�zises Zeichnen und Fanghilfen

Zuerst Endpunkte, Mittelpunkte und Schnittpunkte fangen. Anschlie�end horizontale/vertikale Hilfslinien, Parallelen, Lotrechte und definierte Winkel. Referenzpunkte sichtbar markieren und nach einstellbarer Hover-Verweildauer aktivieren. Bildschirmbezogene Fangabst�nde und eindeutige Anzeige der aktiven Fanghilfe verwenden. Mit 2D beginnen, danach Verhalten auf einer aktiven 3D-Arbeitsebene definieren. Fangpriorit�ten, konkurrierende Referenzen, Abbruch und pr�zise Ma�eingaben pr�fen.

F13 bleibt die ausf�hrliche Spezifikation. F04 (2D-Kamera/Zoom/Pan/Ma�stableiste) als kleine technische Voraussetzung in diese Etappe einordnen. Erster Fangschritt soll vorhandene Geometrie und Werkzeuge nutzen, keine parallele Modellstruktur. Weitere Fangarten erst nach Pr�fung der ersten Arten erg�nzen.

## Etappe 3 Wandanschl�sse und �ffnungen

Saubere Eck- und T-Verbindungen gerader W�nde. Nachvollziehbare Regeln f�r Achsen, verschiedene Wandst�rken und �nderungen verbundener W�nde. Mehrere Fenster, Randabst�nde und �berschneidungen pr�fen; unzul�ssige �nderungen verst�ndlich melden. Kleinen geschlossenen Grundriss bearbeiten, speichern und als IFC exportieren. Die bisherige geometrische Vereinigung �berlappender �ffnungen ist keine abgeschlossene fachliche �ffnungsvalidierung.

## Etappe 4 Geschosse und Decken

Mehrere Geschosse mit stabilen IDs, Namen und H�hen; eindeutige Bauteilzuordnung. Einfache horizontale Decken mit Kontur, St�rke und H�henlage. Zweigeschossiges Beispiel in 2D, 3D, Projektdatei und IFC abgleichen. Migration vorhandener Projektdateien bei Format�nderungen ber�cksichtigen.

## Etappe 5 R�ume und geometrische Fl�chen

R�ume mit stabilen IDs, Namen und eindeutigen Grenzen, zun�chst in geschlossenen Grundrissen. Teilweise umschlossene R�ume ben�tigen eine ausdr�ckliche Begrenzung. Geometrische Fl�che berechnen und verwendete Kontur zeigen; �nderungen begrenzender W�nde pr�fen. Geometrische Raumfl�che und Wohnfl�che nach WoFlV als getrennte Auswertungen f�hren. F06 und passende Teile von F07 hier einordnen.

## Etappe 6 D�cher lichte H�hen und Wohnfl�chen

Einfache Dachschr�gen und lichte H�hen zwischen fertigem Fu�boden und begrenzender Oberfl�che. Wohnfl�chenregeln anhand der zum Umsetzungszeitpunkt geltenden WoFlV recherchieren und mit fachlich gepr�ften Beispielen absichern. H�henbereiche und relevante Abz�ge ber�cksichtigen. Bericht mit Raumdaten, Fl�chenanteilen, Annahmen und Rechenweg, danach PDF-Export gem�� F08/F09.

## Weitere Funktionen

- On-Demand-Men� mit den jeweiligen gepr�ften Bearbeitungsaktionen weiterentwickeln; Eigenschaften bleiben oben, Bewegungsaktionen am Zeiger.
- Schraffuren und Referenzimport/-skalierung jeweils als eigene kleine Etappen nach grundlegenden Fang- und Ma�eingabefunktionen. PDF/Bild anhand zweier Punkte und bekannter L�nge skalieren (F05/F10).
- Text- und Sprachbefehle nur auf bereits gepr�fte Modellfunktionen erweitern. Maus, Ma�eingabe und Copilot verwenden dieselben validierten Aktionen. F11 bleibt offen.
- F12 (gemeinsame Auswahlumrandung) und F14 (Ebenensystem) bleiben geplant. Ebenensichtbarkeit bei Fangfiltern ber�cksichtigen und Ebenen vor gr��eren Projekten einordnen, ohne die sechs Etappen umzudeuten.

## Arbeitsweise und Abnahme

F�r jeden Teil-Schritt: aktuellen Code und Abh�ngigkeiten pr�fen; kleinen Umfang festlegen; implementieren und passende Tests ausf�hren; praktische Abnahmeanleitung liefern; Ergebnis und Einschr�nkungen dokumentieren. NOVIKOV Glass Flow erhalten und Bedienabl�ufe mit bestehenden Werkzeugen abstimmen. Entwicklungszweige und Pull Requests verwenden; �bernahme nach main erst nach Pr�fung.

N�chste Abnahme f�r Etappe 1: neue 3-m-Wand mit mittigem 1,20-m-Fenster erstellen, auf 6 m verl�ngern, ganze Wand �ber On-Demand-Men� verschieben, Fenster entlang der Wand verschieben, beide Schritte einzeln r�ckg�ngig/wiederherstellen, speichern, Ma�e ver�ndern, gespeichertes Projekt laden und IFC exportieren. Grundriss/3D/Hostzuordnung und Exportplatzierung abgleichen. Automatisierte Pr�fung ersetzt diese abschlie�ende Bedienabnahme nicht.

### Abschlussnachtrag Etappe 1

Git-Synchronisierung und kombinierte praktische Verschiebeabnahme sind am 01.10.2026 abgeschlossen; Nachweis in STABILIZATION.md. Etappe 1 ist damit technisch gepr�ft, die �bernahme nach main bleibt der PR-Pr�fung vorbehalten. Die fr�here Aufz�hlung offener Abschlussbedingungen beschreibt den Stand vor diesem Nachtrag. Etappe 2 kann auf dem gesicherten Gesamtstand beginnen.

### Etappe 2a - 2D-Ansichtsnavigation (02.10.2026)

F04 als Voraussetzung f�r bildschirmbezogene Fangabst�nde umgesetzt: Zoom am Mauszeiger, Plus/Minus, Pan per mittlerer Maustaste oder Pan-Schalter, Fit/Reset und Bildschirmma�stab mit grafischer Meterleiste. Das Raster liegt in Modellkoordinaten und passt seinen sichtbaren Abstand dem Zoom an. Auswahlgriffe bleiben 10 CSS-Pixel gro�. Die irref�hrende feste Fit-Anzeige der globalen Statusleiste entf�llt.

Architektur: reine Kameramathematik unter src/rendering/viewport, generischer Point2 unter src/geometry/primitives. Kamera ist fl�chtiger Zustand je Ansicht. Das bestehende Project bleibt die einzige Modellquelle; keine Modellaktion, History-�nderung, Dateimigration oder IFC-Anpassung durch Navigation. Alle bestehenden Modellbearbeitungen verwenden weiterhin die gepr�ften Operationen.

Pr�fung: 110 Tests bestanden (105 bestehende, 5 Kamera-Tests), TypeScript, gezieltes ESLint und Produktionsbuild erfolgreich. Browser: Zoomanker bleibt bis auf numerisches Rauschen fest; Pan erzeugt keinen Undo-Eintrag; 300 Pixel bei 100 px/m ergeben 3 m; direktes Strecken um 100 Pixel ergibt 4 m; Undo stellt 3 m, Redo 4 m wieder her. Wechsel zu 3D erfolgreich.

Praktische Abnahme: 2D �ffnen, �ber einer Wandecke mit dem Mausrad zoomen; die Ecke bleibt unter dem Zeiger. Pan aktivieren und ziehen, danach Escape dr�cken. Ma�e m�ssen gleich bleiben. Fit view zeigt das ganze Modell. 100 px/m w�hlen und zeichnen/bearbeiten; anschlie�end Undo/Redo pr�fen.

Grenzen: px/m ist ein Bildschirmma�stab, kein Druckma�stab. Rasterdarstellung ist adaptiv; das bisherige optionale Rasterfangen bleibt ausdr�cklich bei 0,10 m. Kameras werden nicht in Projektdateien gespeichert und beim Wechsel des Viewport-Layouts neu initialisiert. Geometrisches Fangen, Referenzaktivierung und Hilfslinien sind noch offen. N�chster Schritt: gemeinsame Endpunkt-/Mittelpunkt-/Schnittpunkt-Kandidaten unter constraints/snapping gem�� ARCHITECTURE.md und F13.
