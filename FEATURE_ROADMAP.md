# Fortlaufende Funktionsliste NOVIKOV CAD

Quelle: Nutzeranlage **0.Where it all Begins..docx**, am 30.09.2026 direkt aus dem verknüpften Chat **CAD Bauplan erstellen** gelesen. Die Anlage wird vom Nutzer fortgeschrieben. Neue Fassungen bei weiteren Hinweisen erneut lesen, abgleichen und diese Liste aktualisieren. Einträge sind freigegebene Wünsche zur passenden Entwicklungsphase, keine Behauptung bereits fertiger Funktionen.

## Aktuelle Grundlage

Parametrischer Wand-/Fensterkern, gemeinsame 2D-/3D-Ansichten, IFC4-Export und lokale Textbefehle sind implementiert. Der Nutzer bestätigt erfolgreichen IFC-Import in Archicad. Optionale Spracheingabe ist implementiert; beim Praxistest meldet der Nutzer Erkennungsfehler (siehe F11). Projekt-Speichern/Laden als JSON und Undo/Redo (bis 100 Modelländerungen) sind nun implementiert. Kein Autosave; die Historie bleibt auf die Sitzung begrenzt. Diese Grundlage geht den weiteren Zeichenwerkzeugen voraus.

Der Nutzerwunsch **anklicken → eindeutiger Befehlsbezug** gilt dauerhaft über stabile Bauteil-IDs. In diesem Schritt ergänzt die direkte Wandwahl im 3D die Auswahl im Grundriss/Navigator. Fenster bleiben in 3D über den Navigator auswählbar, da sie bisher nur Öffnungen ohne Rahmen/Glas sind.

## Anforderungen aus der Anlage und geeignete Schritte

| ID  | Anforderung                                                                                                                                                                                                                             | Einordnung und Abhängigkeiten                                                                                                                       |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| F01 | Linienwerkzeug Punkt zu Punkt, nur 2D; Voreinstellung Linie oder Polylinie; Farbpalette, Strichstärke, Strichart einschließlich gestrichelt und Abbruchlinie                                                                            | Umgesetzt: 2D-Linie/Polylinie, Palette, Stiftbreite, Durchgezogen/Gestrichelt/Abbruchlinie, Auswahl, JSON und Undo/Redo; siehe src/lib/bim/LINES.md |
| F02 | On-Demand-Menü nahe Cursor beim Auswählen eines erzeugten 2D-/3D-/sonstigen Elements; verschiebbar und solange Auswahl besteht sichtbar                                                                                                 | Umgesetzt: Menü nahe Auswahlklick, mit Maus/Pfeiltasten verschiebbar, an Fensterränder begrenzt; stabile ID, Maße und Info für Wand/Fenster/Linie   |
| F03 | On-Demand-Aktionen: gewählten Punkt verschieben, bewegen, Info anzeigen und Strecken entlang vorhandener Flucht, etwa lange Rechteck-/Schraffurseite                                                                                    | Teilweise umgesetzt: Info und numerisches Bewegen/Punktversetzen/Endpunktstrecken; direkte Mausgriffe, Vorschau und Seitenstreckung bleiben offen   |
| F04 | Maßstableiste unter Canvas mit Änderungsmöglichkeit                                                                                                                                                                                     | 2D-Kamera und definierter Modell-/Darstellungsmaßstab; Bildschirmzoom von Druckmaßstab unterscheiden                                                |
| F05 | Skalierwerkzeug für hochgeladene PDFs und weitere Referenzzeichnungen: Zeichnung wählen, Anfang/Ende einer bekannten Strecke markieren, neue Länge im On-Demand-Menü oder per Sprache angeben; gesamte Zeichnung proportional skalieren | Referenzimport, 2D-Auswahl und Transformationen; Dateitypen stufenweise festlegen                                                                   |
| F06 | Raumwerkzeug für geschlossene und teilweise umschlossene Wandflächen; eindeutige IDs ab R-001, Name, Fläche                                                                                                                             | Raumgrenzen/-topologie, bei offenen Grenzen nachvollziehbare Ergänzung; vorher Raum-/Geschossmodell ausbauen                                        |
| F07 | Lichte Raumhöhen und Höhenlinien; im Eigenschaftsfenster zwei Messbezüge definieren, z.B. Oberkante Fußboden Dachgeschoss bis Unterkante Dachschräge                                                                                    | Fußboden-/Dachgeometrie und Höhenbezüge; nicht aus dem jetzigen Wandkern ableiten oder schätzen                                                     |
| F08 | Automatische Wohnflächenberechnung nach WoFlV; Türnischen, Schornsteinabzüge, Vorbauwände und Höhenabzüge korrekt berücksichtigen                                                                                                       | Nach F06/F07; geltende Regeln gezielt recherchieren, nachvollziehbar implementieren und anhand fachlicher Beispiele prüfen                          |
| F09 | Wohnflächenbericht nach Vorlage als PDF, mit Rechenweg; Variablen Geschossanzahl, Raumzahl, Name und Adresse                                                                                                                            | Nach verlässlicher Berechnung; Berichtsvorlage und Eingabedaten erfassen                                                                            |
| F10 | 2D-Schraffurwerkzeug für Design/Verzierung; Farbe optional, Kontur optional, frei wählbare Deckkraft, Muster statt Farbe, z.B. Mauerwerk                                                                                                | Nach 2D-Polygon-/Polyliniengrundlage; Fläche, Stil und Transformation getrennt modellieren                                                          |

Diese Einordnung richtet sich nach technischen Abhängigkeiten. Die genaue Umsetzung erfolgt weiterhin in kleinen überprüfbaren Pull Requests. Rechtliche Berechnungsregeln sind hier nur als gewünschter Umfang erfasst, noch nicht implementiert oder bestätigt.

## Ergänzungen aus dem Entwicklungschat vom 30.09.2026

### F11 Spracherkennung robuster machen — offen, ausdrücklich für später

Der Nutzer hat das Mikrofon praktisch getestet: „Wandlänge auf sechs Meter“ wurde nicht korrekt erkannt; nach seiner Beobachtung wurde unter anderem nur „Wand“ verstanden. Die genaue Ursache (Transkription, Normalisierung oder Befehlsauswertung) ist noch nicht untersucht. Bei der späteren Verbesserung diese Stufen getrennt prüfen und den genannten Satz als Praxistest aufnehmen. Fehlerhafte oder unvollständige Erkennung darf keine ungewollte Modelländerung auslösen. Der Bezug auf die angeklickte stabile Element-ID bleibt erhalten.

### F12 Dezente Auswahlumrandung für alle Elementtypen — offen, ausdrücklich für später

Ein ausgewähltes Element soll in der 3D-Ansicht durch eine dezente Umrandung eindeutig erkennbar sein. Eine reine Farbänderung reicht dem Nutzer nicht aus. Die Auswahlvisualisierung als gemeinsame Funktion für alle aktuellen und künftigen Elementtypen planen: Linien, Fenster, Türen, Treppen, Wände, Decken und weitere Elemente. Jeden neuen Elementtyp an dieses gemeinsame Auswahlkonzept anbinden; die konkrete Darstellung an seine Geometrie anpassen. Auswahlwechsel und Abwahl müssen die Markierung entsprechend aktualisieren. Diese Anforderung bedeutet nicht, dass derzeit nur in 2D vorgesehene Elemente bereits in 3D dargestellt werden müssen.

Für F11 und F12 ist in diesem Schritt nur die Aufnahme in die To-do-Liste gewünscht, keine sofortige Implementierung.

### F13 Hilfliniensystem — offen, für einen geeigneten späteren Schritt

Die vollständige nachgereichte Spezifikation einschließlich aller acht Akzeptanztests ist in [F13_HILFLINIENSYSTEM.md](F13_HILFLINIENSYSTEM.md) abgelegt. Ziel ist ein eigenständiges intelligentes Raster-, Fang- und Tracking-System mit einem Bediengefühl wie in etablierten Architektur-CAD-Systemen. Status: geplant, noch nicht implementiert.

- Geometrische Fangpunkte erkennen: Start-/End-/Eck-/Mittel-/Segmentmittelpunkte, Schnittpunkte, Kreis-/Bogenmittelpunkte, Tangential-/Lotpunkte, Punkte auf Kanten, Raster- und benutzerdefinierte Referenzpunkte.
- Referenzpunkte ohne Klick durch Hover und konfigurierbare Verweildauer aktivieren (beispielsweise 300–500 ms). Mehrere Referenzen gleichzeitig halten und ihre Hilfslinienschnittpunkte exakt berechnen, etwa horizontal von A und vertikal von B.
- Temporäre horizontale, vertikale, parallele, lotrechte und kollineare Führungen, Verlängerungen, Fluchten, Achsen, Winkel, Tangenten und Abstandsbezüge anbieten. Mausbewegung erkennt die Absicht; das berechnete Ergebnis muss mathematisch exakt sein.
- Kandidaten nach Abstand, Winkelabweichung, Bewegungsrichtung, zuletzt aktivierten Referenzen, Geometrienähe, Relevanz und Werkzeug priorisieren. Konfigurierbare Fangprioritäten, Toleranzen und Hysterese mit größerem Release-Radius verhindern Springen und Flackern.
- Winkeltracking mit 0°, 30°, 45°, 60°, 90°, 120°, 135°, 150°, 180° und 270°; beliebige Intervalle und benutzerdefinierte Winkel unterstützen.
- Klare, dezente Symbole für erkannte/aktivierte Punkte, Hilfslinien, bevorzugte Beziehungen und resultierende Fang-/Schnittpunkte. Nur relevante Hilfen anzeigen; temporäre Hilfen bleiben visuell von Modellgeometrie unterscheidbar. Die Kontrolle bleibt beim Benutzer.
- Zentrale, werkzeugunabhängige Snap-/Tracking-Engine mit getrennter Geometriesuche, Kandidatenerkennung, Referenzverwaltung, Constraints, Winkeltracking, Bewertung, Darstellung und Einstellungen. Ausgabe unter anderem Roh-/Fangposition, Fangtyp, Quell-Element-/Punkt-ID, Referenz, Constraint, Winkel, Abstand, Priorität und visuelle Hilfen; keine endgültige Modellgeometrie erzeugen.
- Räumlicher Index und lokale Abfragen statt vollständiger Modellsuche bei jeder Mausbewegung. Pixelbasierte Fangtoleranzen bleiben zoomunabhängig; Modellpositionen bleiben exakt.
- Explizite Zustände von IDLE bis SNAP_LOCKED und Regeln zum Entfernen temporärer Referenzen bei Abschluss, Escape, Werkzeugwechsel, explizitem Löschen, Timeout oder Referenzlimit. Zentrale Schalter und Einstellungen für Fangarten, Tracking, Radien, Hoverzeit, Sichtbarkeit, Winkeltoleranz, eigene Winkel und maximale Referenzanzahl.
- Erweiterbarkeit für 3D-, Ebenen-/Flächenfang, BIM-Achsraster, temporäre Maßketten, Abstandstracking, Bogenverlängerungen, Tangentialkonstruktionen, Wandachsen, Geschoss-/Höhenbezüge, Z-Tracking und Fangfilter vorsehen.

Geeignete Umsetzung: zunächst vorhandene Geometrie-, Pointer-, Viewport-, Werkzeug- und Rendering-Systeme analysieren und wiederverwenden. Danach reale Engine und Zustandslogik entwickeln und testen, erst anschließend visuelles Feedback anbinden. Die 2D-Grundlage bei der weiteren Präzisionsbearbeitung (F03/F04) einplanen; Kreis-/Bogen- und 3D-Funktionen mit den jeweils benötigten Geometrien stufenweise ergänzen. Keine parallelen Ersatzsysteme oder Mock-Geometrie. Diese Einordnung ist eine Entwicklungsplanung, keine Einschränkung der vollständigen Anforderungen.

Abnahme umfasst mindestens Hover-Aktivierung an einer Wandecke, Schnittpunkt zweier Referenzen, exakte Parallel-/Lot-/45°-Konstruktion, stabile Auswahl konkurrierender Fangpunkte, gleichbleibende Bildschirmtoleranz bei Zoom sowie flüssige Bedienung großer Modelle. Einzelne Teilimplementierungen nicht als vollständigen Abschluss von F13 markieren.

## Bedienungsnachtrag

Polylinien werden auf Nutzerwunsch per Doppelklick am letzten Punkt abgeschlossen; der Abschlussbutton entfällt. Enter ist die Tastaturalternative. Das beendet den Linienzug, schließt ihn aber nicht automatisch zu einer Fläche.

F02: Das Elementmenü folgt der gemeinsamen Auswahl in Grundriss, 3D und Navigator, bleibt bei Eigenschaftenänderungen an seiner verschobenen Position und verschwindet bei Abwahl/Zeichnen. Die Toolbar kann es ausblenden. Info öffnet die vorhandenen Eigenschaften. Die Menüposition ist nur Sitzungszustand.

Prüfung dieses Schritts: 84 automatisierte Tests bestanden; TypeScript, gezieltes ESLint und Produktionsbuild erfolgreich. Browserprüfung: Doppelklick auf neuen Endpunkt ergibt drei Punkte ohne Duplikat; Abschluss mit nur einem Punkt bleibt ohne Modelländerung; Enter-Alternative; Undo/Redo als eine Änderung; Menü für Wand/Fenster/Polylinie, Verschieben mit Maus und Pfeiltasten, Info öffnet Navigator auch aus Vollbild; 3D-Wandklick liefert dieselbe ID; Maßänderung aktualisiert Info ohne Menüversatz. Fenster werden in 3D weiterhin über den Navigator ausgewählt. F03 Bewegen/Strecken sowie F11/F12 bleiben offen.

## Aktualisierung: Werkzeugeigenschaften und Linienbedienung

Auf Nutzerwunsch gibt es unter der Hauptmenüleiste eine zweite, feste Leiste **Werkzeugeigenschaften**. Alle bestehenden Eigenschaften ausgewählter Wände, Fenster, Linien und Polylinien werden dort bearbeitet; auch die Voreinstellungen des Linienwerkzeugs liegen dort. Der Navigator enthält nur noch die Projektstruktur. Die Leiste bleibt bei geschlossenem Navigator und im Vollbild zugänglich und kann bei wenig Platz umbrechen bzw. scrollen. Künftige Elementtypen sollen ihre Eigenschaften ebenfalls dort bereitstellen.

Dies aktualisiert F02/F03: Das schwebende Elementmenü ist standardmäßig aus und bleibt über die Toolbar optional erreichbar. Es enthält keine duplizierten Maße mehr; sein Eigenschaften-Verweis fokussiert die obere Leiste. Die automatische große Einblendung bei Auswahl entfällt. Geometrisches Bewegen/Strecken bleibt offen.

Linienauswahl: Der zusätzliche Browser-Fokusrahmen des SVG-Treffpfads wird unterdrückt; eine dezente Auswahlmarkierung bleibt erhalten. Strichstärken lassen sich mit Dezimalkomma oder Dezimalpunkt eingeben, ohne Zwischenwerte beim Tippen umzuschreiben. Ungültige/unvollständige Werte werden beim Übernehmen abgewiesen. Farbe, Strichstärke und Strichart werden gemeinsam übernommen und bleiben über Undo/Redo und JSON erhalten.

Validierung: 86 automatisierte Tests bestanden, TypeScript, gezieltes ESLint und Produktionsbuild erfolgreich. Browserprüfung: Linienauswahl ohne automatisches Menü und ohne SVG-Fokusrahmen; Farbe/Strichstärke/Strichart gemeinsam übernommen; Komma-/Punkteingaben; ungültiger Zwischenwert abgewiesen; Undo/Redo; Wand-/Fensteränderung oben; Eigenschaften bei geschlossenem Navigator und im Vollbild; optionaler Menüverweis fokussiert die Leiste.

## F03 – numerische Geometriebearbeitung (01.10.2026)

Erster Teil umgesetzt in **Werkzeugeigenschaften → Aktion**:

- **Element bewegen:** ausgewählte Wand, Linie oder Polylinie um X/Y in Metern verschieben. Wandfenster behalten ihre relative Lage und folgen der Wand. IDs und Linienstile bleiben erhalten.
- **Punkt versetzen:** Anfang, Ende oder Polylinienstützpunkt wählen und absolute X/Y-Koordinaten eingeben. Bei geschlossenen Polylinien bleibt der gemeinsame Anfangs-/Endpunkt geschlossen.
- **Endpunkt strecken:** Anfang oder Ende einer Wand bzw. offenen Linie/Polylinie wählen und die neue Länge des angrenzenden Segments eingeben. Die bisherige Richtung bleibt erhalten, der andere Segmentpunkt bleibt fest. Geschlossene Polylinien haben keine freien Endpunkte; ihre Seitenstreckung folgt später.
- **Fenster entlang Wand bewegen:** vorzeichenbehafteten Abstand in Metern angeben. Positiv Richtung Wandende, negativ Richtung Wandanfang; die Öffnung darf die Wandgrenzen nicht überschreiten.

Komma und Punkt sind als Dezimaltrenner möglich. **Geometrie übernehmen** bestätigt eine einzelne Undo/Redo-Änderung. Ungültige Geometrie wird atomar abgewiesen; JSON und bestehende 3D-/IFC-Geometrie verwenden die geänderten Modellkoordinaten. Noch nicht übernommene Eingaben anderer Eigenschaftsbereiche werden nicht mit angewendet.

F03 bleibt teilweise offen: direkte Punktgriffe/Mausverschiebung mit Vorschau sowie Strecken ganzer Rechteck-/Schraffurseiten. Diese Bedienung auf dem gemeinsamen Transformationskern und später F13 aufbauen. F13 selbst ist noch nicht implementiert. Der nächste passende Teilschritt sind sichtbare Punktgriffe und interaktive Vorschau.

Validierung: 96 automatisierte Tests einschließlich zehn Transformationsprüfungen, TypeScript, gezieltes ESLint und Produktionsbuild. Tests umfassen Translation/3D-Lage, ID-/Stilerhalt, Punktänderung/geschlossene Polylinie, diagonales Strecken beider Enden, Endsegmentstreckung, Fensterbindung, ungültige Maße/IDs/Indizes, Undo/Redo, JSON und Dezimaleingaben.

Browserprüfung bestanden: Wandtranslation mit Kommaeingabe, Strecken auf 6 m, zu kurze Wand abgewiesen, Undo/Redo, Fensterposition entlang Wand, Polylinienstützpunkt auf absolute Koordinaten gesetzt, Anfangssegment auf 4 m gestreckt. Eigenschaftenbereiche bleiben nach wiederholten Änderungen eindeutig.

## F03 – direkte Bearbeitung am Zeiger (01.10.2026)

Dieser Nachtrag ersetzt die numerische Aktionsbedienung des vorigen Schritts: Bewegung wird im automatisch eingeblendeten On-Demand-Menü gewählt. Die Aktionsfelder in Werkzeugeigenschaften entfallen; Maße und Darstellung bleiben dort.

Im Grundriss erscheinen an ausgewählten Wänden Eckgriffe und an Linien/Polylinien Punktgriffe. Griff anklicken, „Punkt frei bewegen“ oder „Punkt in Flucht strecken“ wählen, Ziel mit der Maus bestimmen und per Klick übernehmen. Das ganze Element lässt sich frei, entlang seiner Achse oder entlang X/Y bewegen. Bei Polylinien bezieht sich die Achse auf das angrenzende vorherige Segment, am ersten Punkt auf das erste Segment. Wandgriffe bearbeiten das zugehörige Wandende bei konstanter Stärke. Fenster bleiben an ihre Wand gebunden und lassen sich entlang dieser verschieben.

Die Vorschau verwendet stets den Ausgangszustand und erzeugt erst beim Zielklick eine Undo/Redo-Änderung. Escape, Abbrechen und Werkzeugwechsel verwerfen sie. Ungültige Ziele werden markiert und nicht übernommen; insbesondere bleiben Fenstergrenzen geprüft. Auswahl über 3D oder Navigator verwendet dieselben IDs; eine Bearbeitungsaktion wechselt zum Grundriss. Räumliches Ziehen in 3D, ganze Flächenseiten und F13 bleiben offen.

Validierung: 104 automatisierte Tests einschließlich acht neuer Prüfungen für Punktbewegung, Achsprojektion, Vorschau, veralteten Modellzustand, geschlossene Linien und Fensterbindung. Browserprüfung: Strecken von 3,00 auf 3,80 m, Vorschau ohne vorzeitige Übernahme, Escape sowie Undo/Redo.

## Priorität geändert: Gesamtstand stabilisieren (01.10.2026)

Vor weiteren Funktionen den vollständigen Wand-Fenster-Ablauf prüfen. Ergebnisse und verbindlicher Ausgangscommit stehen in STABILIZATION.md. Segmentgriffe sind separat gesichert und zurückgestellt. Danach Präzisionszeichnen/F13 auf einer definierten 2D-Kamera ausbauen; Räume, Wandverbindungen, Höhen und Wohnflächen folgen nach verlässlicher Grundrissgrundlage. Geprüfte Änderungen zuerst als PR, kein automatisches Zusammenführen oder Release.
