> **Zentrale Dokumentation seit 10.10.2026:** [NOVIKOV_MASTERPLAN.md](NOVIKOV_MASTERPLAN.md) enthält Mission, aktuellen Architekturvertrag, bestätigten Stand und genau einen nächsten Auftrag. [NOVIKOV_REQUIREMENTS_REGISTER.md](NOVIKOV_REQUIREMENTS_REGISTER.md) erhält detaillierte Anforderungen, Altkennungen und Quellen. Diese Datei bleibt als historische Detail-/Nachweisquelle erhalten; alte Status-, Schema- und Folgeauftragsformulierungen sind keine aktuelle Reihenfolge. Neue Anforderungen/Entscheidungen/Status in den zentralen Dateien pflegen. Bei Konflikten gelten die dort festgehaltenen neueren Nutzerentscheidungen.

NOVIKOV CAD Entwicklungsleitfaden für die Arbeit mit Codex
Stand 2. Oktober 2026
Dieser Guide übersetzt deine Funktionswünsche in eine Reihenfolge, die das gemeinsame CAD-Modell schrittweise erweitert. Du arbeitest die Etappen einzeln mit Codex durch. Jede Etappe endet mit einer funktionierenden, überprüften Version. Bereits vorhandene Funktionen werden geprüft und weiterverwendet.
Beginne mit Etappe 0. Gib Codex anschließend immer nur einen Teilauftrag. Der Guide ist eine Arbeitsanleitung, keine Aufforderung, alle Funktionen in einem Durchlauf zu bauen.
1 Grundlage und Grenzen dieses Guides
Die Funktionsanforderungen stammen aus deiner Anlage 0.Where it all Begins.(1).docx. Die Architekturgrundlage stammt aus dem hier sichtbaren Gespräch über ARCHITECTURE.md und AGENTS.md. Die tatsächlichen Repository-Dateien und der aktuelle Quellcode waren bei der Erstellung nicht verfügbar. Aussagen über vorhandene Funktionen sind daher berichteter Stand und müssen in Etappe 0 überprüft werden.
Laut Gespräch bestehen bereits Bereiche für Wände, Fenster, Linien, Modellvalidierung, History, Commands, Direct Edit, 2D/3D, Projektdateien, IFC und Sprache. Welche davon im aktuellen Arbeitszweig vollständig funktionieren, entscheidet die Bestandsaufnahme.
Im Repository ist die tatsächliche ARCHITECTURE.md maßgeblich. Dieser Guide ergänzt sie um eine Entwicklungsreihenfolge. Codex soll Abweichungen benennen und den Plan an die gültigen Regeln anpassen. Er darf den Architekturvertrag nicht stillschweigend ändern, nur damit eine Implementierung leichter wird.
Die Grid-Anforderung in der Anlage endet unvollständig bei „Eine Gridfunktion, welche sich an vorhandene“. Endpunkt-, Mittelpunkt- und Schnittpunktfang sowie Hover-Referenzen, Parallel-, Lot- und Winkelerkennung stammen aus dem sichtbaren Projektgespräch. Konkrete Bedienwerte sind Vorschläge und keine bereits bestätigten Anforderungen.
2 Die Regeln in einfacher Sprache
Eine Wand, Linie oder ein Raum existiert einmal im Projektmodell. Grundriss, 3D, Eigenschaften und Export lesen dieses Modell. Berechnete Darstellungen und Zwischenspeicher dürfen daraus entstehen; sie dürfen keine unabhängige zweite Wahrheit bilden.
Bereich	Aufgabe	Beispiel
core	Allgemeine Grundlagen	Stabile IDs und gemeinsame technische Verträge
geometry	Fachunabhängige Mathematik	Abstand, Projektion, Schnittpunkt, Polygon
domain	Bauteile und fachliche Regeln	Wand, Raum, Geschoss, Ebene
application	Aktionen koordinieren	Verschieben, Eigenschaften ändern, Undo
constraints	Fang und geometrische Führung	Snap, Hilfslinien, Richtungserkennung
rendering	Modell darstellen und treffen	Grundriss, 3D, Picking
interop	Dateien hinein und hinaus übertragen	Projektdatei, Referenzimport, IFC, Berichtsexport
ai	Text und Sprache in Aktionen übersetzen	Vorschau eines Skalierbefehls
ui	Bedienen und anzeigen	Menüs, Navigator, Inspector


Die grundlegende Richtung lautet: UI → Application → Domain → Geometry/Core. Geometry kennt keine BIM-Bauteile, React-Komponenten oder Dateiformate. Renderer und Dateiadapter verwenden freigegebene Modellinformationen. Die genauen erlaubten Abhängigkeiten legt ARCHITECTURE.md fest.
Die Maus, der Inspector und die AI sollen dieselben fachlichen Aktionen auslösen. Eine Vorschau verändert das gespeicherte Modell noch nicht. Eine bestätigte Aktion erzeugt einen gültigen Modellzustand und einen passenden Undo-Schritt. Ein abgebrochener Vorgang hinterlässt keine halbfertigen Elemente.
CadWorkspace darf Ansichten und Bedienung zusammenführen. Gemeinsame Modellverwaltung, Snap-Mathematik und Bauteilregeln bekommen zuständige Module. Wir ziehen vorhandene Logik nur dann um, wenn der nächste Schritt sie benötigt. Die bisherige Snapshot-History bleibt zunächst erhalten.
3 So arbeitest du den Guide durch
1. Lege diesen Guide im Repository ab und lass Codex Etappe 0 durchführen.
2. Lass Codex pro Etappe einen kleinen, ausführbaren Teil auswählen. Beispielsweise zuerst Endpunktfang, anschließend Mittelpunkt- und Schnittpunktfang.
3. Codex implementiert diesen Teil, führt passende Prüfungen aus und aktualisiert den Fortschritt.
4. Du probierst das beschriebene Bedienbeispiel selbst aus. Ein grüner Test allein zeigt nicht, ob sich ein CAD-Werkzeug gut bedienen lässt.
5. Fehler werden im aktuellen Teil behoben. Erst anschließend folgt der nächste Teil.
Ein überschaubarer Teilauftrag sollte einen klaren Benutzerablauf fertigstellen: zum Beispiel „Eine Linie an einem Wandendpunkt beginnen, bestätigen und per Undo zurücknehmen“. Ordner anlegen allein ist kein fertiger Benutzerablauf.
Gemeinsamer Starttext für Implementierungsaufträge
Kopiere diesen Text zusammen mit dem Auftrag der jeweiligen Etappe:
Arbeite an NOVIKOV CAD. Lies zuerst die einschlägigen AGENTS.md-Dateien,
ARCHITECTURE.md, diesen Guide und den aktuellen DEVELOPMENT_PLAN.md.
Prüfe den aktuellen Branch, vorhandene Änderungen und bereits vorhandene
Implementierungen. Bewahre fremde Änderungen und funktionierende Abläufe.

Setze nur den unten genannten Teilauftrag um. Verwende das gemeinsame
Projektmodell, bestehende fachliche Aktionen und History. Baue neue gemeinsame
Logik in der zuständigen Schicht. Keine zweite Modellstruktur, keine große
Neuschreibung und kein vollständiger Ordnerumbau auf Vorrat.

Zeige vor der Umsetzung kurz die betroffenen Module, Abhängigkeiten und
Abnahmekriterien. Arbeite anschließend innerhalb des beschriebenen Umfangs
weiter. Frage nur nach, wenn eine fehlende fachliche Entscheidung die Umsetzung
tatsächlich blockiert. Kennzeichne sinnvolle vorläufige Annahmen.

Prüfe die neue Funktion mit passenden automatisierten Tests und den verfügbaren
Repository-Prüfungen. Dokumentiere nicht ausführbare Prüfungen und bestehende
Fehler getrennt. Aktualisiere den Entwicklungsplan mit Ergebnis und nächstem
Teilauftrag. Berichte am Ende verständlich: Was funktioniert, wie probiere ich
es aus, welche Grenzen bleiben und was kommt als Nächstes?
Wann ein Teilauftrag fertig ist
- Die beschriebene Bedienung funktioniert, einschließlich Abbruch und ungültiger Eingaben.
- Modelländerungen sind validiert und über Undo/Redo wiederholbar.
- Betroffene Ansichten und Eigenschaften zeigen denselben Zustand.
- Neue gespeicherte Daten überstehen Speichern und Laden; ältere Dateien werden durch eine passende Migration oder kompatible Ergänzung berücksichtigt.
- Relevante Tests sowie vorhandene Typ-, Lint- und Build-Prüfungen wurden ausgeführt; Ausnahmen sind konkret dokumentiert.
- Architekturgrenzen wurden eingehalten, und der Fortschritt ist nachvollziehbar festgehalten.
Nicht jede Etappe betrifft alle Punkte. Ein reiner Hover-Marker braucht keinen Undo-Schritt; ein dauerhaft angelegter Raum schon.
4 Überblick über die Reihenfolge
Etappe	Ergebnis	Voraussetzung
0	Verifizierter Stand und ausführbarer Plan	Aktuelles Repository
1	Gemeinsamer Weg für Modelländerungen	0
2	Geometrische Grundlagen und Fang	1
3	Hover-Referenzen und Hilfslinien	2
4	Ebenen und Sichtbarkeit	1; vor neuen Elementtypen
5	Linien, Polylinien und Schraffuren	2–4
6	Auswahlmenü und präzise Bearbeitung	1, 3–5
7	Maßstableiste und kalibrierbare Referenzpläne	2, 4, 6
8	Räume mit stabilen Begrenzungen	2, 4, 5
9	Raumhöhen und Höhenbereiche	8; passende Höhenquellen
10	Nachvollziehbare Wohnflächenberechnung	8–9; geprüfte Regeldefinition
11	PDF-Bericht und Vorlagen	10
12	Größere Projekte und zusammenhängende Prüfung	Wiederkehrend; Abschluss nach 11


Diese Reihenfolge ist eine Empfehlung. Etappe 4 kann nach dem gemeinsamen Änderungspfad vorgezogen werden. Leistungsprobleme werden behoben, sobald Messungen sie zeigen; sie müssen nicht bis Etappe 12 warten.
5 Die Etappen und Codex-Aufträge
Etappe 0 Den tatsächlichen Stand prüfen
Ziel: Wir wissen, welche Funktionen im aktuellen Zweig wirklich vorhanden sind und welche Architekturregeln gelten. Diese Etappe verändert zunächst die Planung, nicht das Verhalten des CAD.
Führe eine Bestandsaufnahme für diesen Guide durch. Lies ARCHITECTURE.md,
AGENTS.md, DEVELOPMENT_PLAN.md und die betroffenen Module. Prüfe insbesondere
Modell, History, Commands, Direct Edit, Linien, Picking, 2D/3D, Dateien, IFC,
AI/Voice sowie bereits vorhandenes Snap und Ebenen.

Führe die verfügbaren bestehenden Prüfungen aus. Unterscheide nachgewiesene
Funktionalität, teilweise Umsetzung und fehlende Funktionalität.

Erstelle beziehungsweise aktualisiere DEVELOPMENT_PLAN.md. Ordne die Wünsche
dieses Guides vorhandenen Modulen zu und dokumentiere Abhängigkeiten,
Teilaufträge und Abnahmekriterien. Lege eine Anforderungsmatrix an, in der
jeder Wunsch aus Abschnitt 6 eine ID und einen Status erhält.

Schreibe keine CAD-Funktion neu. Identifiziere den kleinsten sinnvollen Auftrag
für Etappe 1. Wenn ARCHITECTURE.md fehlt, dokumentiere das und rekonstruiere
keinen vermeintlich verbindlichen Vertrag aus Annahmen.
Abnahme: Jede Anforderung hat einen nachvollziehbaren Status und Bezug zum Code oder zu einer geplanten Etappe. Der nächste Auftrag ist konkret. Bereits fehlschlagende Prüfungen sind bekannt.
Etappe 1 Gemeinsame Modellaktionen herausarbeiten
Warum zuerst: Ein neues Menü und eine Sprachsteuerung dürfen nicht jeweils eigene Wege zum Verschieben oder Skalieren bauen.
Arbeite den kleinsten erforderlichen Application-Bereich für gemeinsame
Modelländerungen heraus. Verwende vorhandene Commands und Direct-Edit-Logik.
Beginne mit einer bereits funktionierenden Aktion, etwa dem Verschieben eines
Elements, und führe deren UI-Einstieg über den gemeinsamen Pfad.

Definiere Vorschau, Bestätigung, Abbruch, Validierung und History-Verhalten.
Ein bestätigter Bearbeitungsvorgang entspricht einem Undo-Schritt; einzelne
Mausbewegungen erzeugen keine History-Einträge. Behalte Snapshot-History.

Ziehe aus CadWorkspace nur die dafür nötige Orchestrierung heraus. Stelle sicher,
dass 2D, 3D, Inspector und bestehende Adapter weiter dieselbe Modellquelle lesen.
Füge eine zum Repository passende Prüfung unerlaubter Modulabhängigkeiten hinzu,
wenn sie mit geringem Aufwand die Architekturgrenzen zuverlässig absichert.
Abnahme: Dasselbe Element lässt sich über die vorhandenen Eingabewege konsistent ändern. Vorschau und Abbruch verändern keine gespeicherten Daten. Undo/Redo und vorhandene Stage-1-Abläufe funktionieren weiter.
Etappe 2 Geometry Foundation und SnapEngine
Warum jetzt: Alle späteren Zeichen- und Bearbeitungswerkzeuge brauchen dieselbe präzise Mathematik.
Extrahiere oder ergänze die für Fang benötigte fachunabhängige Geometrie:
Punkte, Vektoren, Segmente, Abstand, Projektion und Segmentschnittpunkte.
Dokumentiere Einheiten, Achsen und numerische Toleranzen. Geometry darf keine
BIM- oder React-Abhängigkeiten besitzen.

Baue eine testbare SnapEngine im zuständigen Constraints-Bereich. Sie erhält
geometrische Kandidaten über Adapter des bestehenden Modells sowie einen
expliziten Ansichtskontext. Der Fangradius wird in Bildschirm-Pixeln beurteilt;
Ergebnisse werden als Modellkoordinaten zurückgegeben.

Beginne mit Endpunktfang an vorhandenen Linien und Wänden. Ergänze danach
Mittelpunkt und Segmentschnittpunkt in getrennten Teilaufträgen. Definiere eine
nachvollziehbare Rangfolge und stabiles Verhalten bei konkurrierenden Kandidaten.
Grid-Fang bekommt einen eigenen Kandidatentyp und schaltbare Einstellungen.
Integriere zuerst ein Werkzeug, anschließend das zweite über dieselbe API.
Abnahme: Linien- und Wandwerkzeug verwenden dieselbe Engine. Der Fang verhält sich beim Zoomen und Verschieben der Ansicht nachvollziehbar. Tests behandeln auch nahezu parallele, sehr kurze, überlappende und entartete Segmente. Uneindeutige Schnittmengen werden explizit behandelt.
Dein Versuch: Zeichne eine Linie vom Wandendpunkt zu einem Linienmittelpunkt. Zoome heraus und wieder hinein. Prüfe Marker, bestätigte Koordinaten und Undo.
Etappe 3 Referenzpunkte und automatische Hilfslinien
Erweitere die SnapEngine um eine separate, testbare Verwaltung temporärer
Referenzen. Wird ein geeigneter Punkt innerhalb des Hover-Radius ausreichend
lange gehalten, markiere ihn und aktiviere Hilfslinien. Verwende eine explizite
Zeitquelle, damit Hover-Verhalten ohne echte Wartezeiten geprüft werden kann.

Implementiere zuerst horizontale und vertikale Führungen. Ergänze anschließend
Parallel-, Lot- und Winkelrichtungen sowie Fang an relevanten Guide-Schnittpunkten.
Referenzen auf Kanten liefern deren Richtung. Kennzeichne Herkunft und aktiven
Fang visuell. Begrenze aktive Referenzen und definiere Löschen, Escape, Toolwechsel
und Verhalten bei gelöschten oder verschobenen Bezugselementen.

Hilfslinien bleiben temporärer Interaktionszustand. Sie erzeugen keine BIM-Elemente
und keine History-Einträge. Nutze dieselbe Funktion in Linien- und Wandwerkzeug.
Vorläufige Bedienvorschläge: 600 ms Hover-Zeit und 10 px Fangradius als konfigurierbare Startwerte. Richtungsauswahl und Prioritäten werden im Bedienversuch angepasst. Das sind keine zugesicherten Optimalwerte.
Abnahme: Schnelles Vorbeifahren aktiviert keine Referenz. Ruhiges Hover aktiviert eine sichtbare Referenz. Hilfslinien flackern nicht zwischen gleichwertigen Kandidaten, und Escape räumt temporäre Zustände zuverlässig auf.
Etappe 4 Ebenen und Organisation
Interpretation der Anlage: „Jedes Element bekommt eine eigene Ebene“ wird als „jedes Element besitzt eine Ebenenzuordnung“ gelesen. Mehrere Elemente dürfen dieselbe Ebene verwenden. Eine separate Ebene für jedes einzelne Element würde die ebenfalls gewünschten Kategorien nicht sinnvoll abbilden.
Ergänze ein gemeinsames Layer-Modell mit stabiler ID und Namen sowie eine
layerId-Zuordnung für die betreffenden Projekt-Elemente. Verwende als Startbestand:
Außenwand, Innenwand, Dach, Decke, Fenster, Tür, Möblierung, Geländer, Gelände,
2D-Zeichnungen, Neutrale Ebene und Bemaßung.

Neue Wände erhalten standardmäßig Außenwand. Neue Linien, Rechtecke und
2D-Zeichnungen erhalten 2D-Zeichnungen. Bestehende Projekte bekommen diese
Zuordnung durch eine kompatible Dateianpassung oder Migration.

Baue Organisation > Ebenen als eigenes Fenster zum Erstellen und Bearbeiten
von Ebenen sowie einen kompakten Ebenenumschalter in der Menüleiste. Elemente
können anderen Ebenen zugeordnet werden. Definiere ausdrücklich, ob Sichtbarkeit
pro Ansicht oder gemeinsam gilt und wie sie gespeichert wird.

Ausgeblendete Elemente sollen im normalen Auswahl- und Fangmodus nicht getroffen
werden. Sie bleiben Teil des Projekts. Exportregeln werden getrennt von der
Bildschirmsichtbarkeit behandelt. Löschen einer belegten Ebene benötigt eine
definierte Neuzuordnung und darf keine Elemente unbemerkt entfernen.
Abnahme: Ebene erstellen, umbenennen, zuordnen und ausblenden funktioniert. Speichern/Laden erhält Zuordnungen. Modelländerungen sind rückgängig machbar. Ein ausgeblendetes Geschoss oder eine Ebene führt nicht versehentlich zu Datenverlust.
Etappe 5 Linien Polylinien und Schraffuren
Erweitere das bestehende 2D-Linienwerkzeug mit voreinstellbarem Modus Linie oder
Polylinie, Farbpalette, Strichstärke und Strichart einschließlich gestrichelt und
Abbruchlinie. Beginne mit Linienattributen, dann Polylinien. Lege reale Einheiten
und Darstellung der Strichstärke sowie Musterabstände ausdrücklich fest.

Erstellen erfolgt im Grundriss von Punkt zu Punkt mit gemeinsamer SnapEngine.
Definiere Abschluss, Escape, Nullsegmente und offene beziehungsweise geschlossene
Polylinien. Der Erstellungsmodus wird nicht in der 3D-Ansicht angeboten.

Implementiere danach ein 2D-Schraffurwerkzeug mit geschlossener Begrenzung:
Füllung ein/aus, Kontur ein/aus, wählbare Farbe und Deckkraft sowie alternativ
Musterfüllung, zunächst Mauerwerk. Prüfe Polygone auf ungültige Selbstschnitte;
berücksichtige Aussparungen, sobald die Begrenzungslogik sie unterstützt.
Schraffuren sind gespeicherte 2D-Elemente mit Ebenenzuordnung und History.
Abnahme: Bearbeitung, Dateirundlauf und Undo funktionieren für alle neuen Attribute. Bei Zoom bleiben Stricharten und Deckkraft sinnvoll. Ungültige Begrenzungen erzeugen eine verständliche Rückmeldung.
Etappe 6 Bewegliches Auswahlmenü und Direct Edit
Baue das On-Demand-Menü für ausgewählte Elemente auf vorhandener Selection und
Application-Logik auf. Es erscheint nahe der Auswahl beziehungsweise des Cursors,
bleibt während der Auswahl bestehen und lässt sich zur Seite verschieben.
Begrenze seine Position auf den sichtbaren Bereich und erhalte Tastaturbedienung.

Biete Info anzeigen, Bewegen, gewählten Punkt verschieben und Strecken an, soweit
der ausgewählte Elementtyp die Aktion unterstützt. Sichtbare Griffe identifizieren
den gewählten Punkt eindeutig. Info verwendet dieselben Daten wie der Inspector.

Setze zunächst Bewegen und Punkt verschieben für vorhandene Linien und Wände um.
Ergänze Strecken für klar definierte Polygon- oder Rechteckkanten: Eine gewählte
Kante wird parallel versetzt, Nachbarkanten werden entsprechend angepasst.
Definiere Verhalten für ungültige Ergebnisse. Wiederverwende die Snap-/Guide-API.
Abnahme: Das Menü bleibt erreichbar und verdeckt die Arbeit nicht dauerhaft. Nicht unterstützte Aktionen sind nachvollziehbar deaktiviert. Fenster an einer bearbeiteten Wand bleiben gültig oder die Änderung wird abgewiesen. Jeder bestätigte Vorgang hat genau einen Undo-Schritt.
Etappe 7 Maßstableiste und Referenzpläne kalibrieren
Zwei verschiedene Aufgaben: Der Ansichtsmaßstab verändert die Darstellung beziehungsweise die Ausgabe. Kalibrieren verändert die Größe einer importierten Referenz im Modell. Die Maße einer Wand ändern sich durch Zoomen oder Umschalten des Ansichtsmaßstabs nicht.
Baue zunächst die Maßstableiste unter dem Canvas. Trenne Ansichtszoom,
Ausgabemaßstab und reale Modellmaße. Definiere die Bedeutung der Anzeige bei
Bildschirmdarstellung, ohne eine physisch exakte Größe auf beliebigen Displays
zu versprechen. Nutze vorhandene Ansichtstransformationen.

Ergänze anschließend importierte Referenzzeichnungen als eigenen Elementtyp
mit stabiler ID, Ebene, Asset-Verweis und Transformation. Starte mit einer
PDF-Seite oder einem Bild. Unterstützte Formate und PDF-Vektorzugriff müssen
explizit ausgewiesen werden; beliebige Dateitypen sind kein erster Teilauftrag.
Stelle sicher, dass Projekte nach erneutem Öffnen weiterhin auf ihre Assets
zugreifen können. Temporäre Browser-URLs reichen dafür nicht.

Implementiere Kalibrieren: Referenz auswählen, zwei Punkte einer bekannten
Strecke markieren, tatsächliche Länge mit Einheit eingeben, Vorschau bestätigen.
Skalierfaktor = Ziellänge / aktuelle Länge in Modellkoordinaten. Verwende vorerst
einheitliche Skalierung mit dem ersten Messpunkt als festem Anker.

Frage die Länge über das On-Demand-Menü ab. Ergänze anschließend Text/Voice als
Adapter derselben Application-Aktion mit Vorschau. Verändere nur die ausgewählte
Referenz. Fang auf PDF-Geometrie nur anbieten, wenn echte Geometrie verfügbar ist.
Abnahme: Eine auf 5 m kalibrierte Teststrecke bleibt nach Zoom, Speichern/Laden und erneutem Messen 5 m lang. Nullstrecken, negative Längen, fehlende Einheiten und fehlende Assets werden behandelt. Undo stellt die vorherige Transformation wieder her.
Etappe 8 Räume und Raumbegrenzungen
Warum in zwei Schritten: Ein manuell gesetztes Raumpolygon macht Daten und Berechnung überprüfbar. Automatische Erkennung ergänzt danach dieselbe Raumstruktur.
Implementiere zunächst Räume mit stabiler interner ID, sichtbarer Kennung ab
R-001, Name, Geschossbezug, Ebene und Polygonbegrenzung mit optionalen Aussparungen.
Interne Identität und sichtbare Raumnummer sind getrennt. Definiere den
Nummerierungsbereich, vermeide doppelte Nummern und erhalte sie beim Dateirundlauf.

Berechne die geometrische Grundfläche aus gültigen Polygonen. Kennzeichne sie
als geometrische Fläche; sie ist noch keine geprüfte Wohnfläche. Beginne mit
manueller Begrenzung über das gemeinsame Zeichen- und Fangsystem.

Ergänze danach automatische Erkennung geschlossener Räume anhand der relevanten
inneren Wandflächen. Berücksichtige Wanddicken und geprüfte Toleranzen. Bei
teilweise umschlossenen Räumen kann der Benutzer explizite virtuelle Grenzen
setzen und die vorgeschlagene Fläche bestätigen. Schließe große Lücken nicht
unbemerkt. Rechne nach relevanten Wandänderungen neu und zeige Konflikte an.
Abnahme: Ein rechteckiger Raum mit bekannten Innenmaßen liefert die erwartete Fläche. Tests decken Aussparungen, getrennte Räume, kleine Lücken und widersprüchliche Begrenzungen ab. Wandänderungen erzeugen aktualisierte oder sichtbar ungültige Räume, keine still veralteten Werte.
Etappe 9 Lichte Höhen und Höhenbereiche
Ergänze eine gemeinsame Abfrage der lichten Raumhöhe. Die untere Bezugshöhe kann
beispielsweise Oberkante Fertigfußboden sein, die obere Unterkante Dachschräge
oder einer geeigneten Decke. Speichere die gewählten Quellen nachvollziehbar.

Prüfe zuerst, welche Dach-, Decken- und Geschossgeometrie tatsächlich vorhanden
ist. Falls automatische Höhenquellen fehlen, unterstütze ausdrücklich manuelle
Bezugsebenen beziehungsweise begrenzte geneigte Flächen. Stelle dies nicht als
automatische Dacherkennung dar. Ergänze echte Modelladapter erst mit den dafür
benötigten Bauteilen.

Zwei Punkte können eine einzelne Messstrecke festlegen; daraus folgt noch keine
vollständige Höhenverteilung im Raum. Verwende für flächige Auswertung eine
definierte obere und untere Oberfläche. Berechne deren Höhenunterschied über
der Raumfläche und leite Höhenlinien beziehungsweise Flächenbereiche ab.
Ermögliche die Konfiguration im Raumeigenschaftenfenster.

Definiere Neuberechnung, wenn Bezugsflächen geändert oder gelöscht werden.
Kennzeichne fehlende Höheninformationen und verwende keine erfundenen Ersatzwerte.
Abnahme: Für einen Raum unter einer einfachen geneigten Fläche stimmen Höhe an Testpunkten und Flächenbereiche mit einer analytischen Beispielrechnung überein. Änderungen der Quellen aktualisieren die Ergebnisse. Fehlende Quellen sind im Raumstatus sichtbar.
Etappe 10 Wohnflächenberechnung mit nachvollziehbaren Regeln
Wichtige Voraussetzung: Die Anlage schreibt „Wo-FIV“; hier wird angenommen, dass die Wohnflächenverordnung gemeint ist. Die konkrete Regeldefinition wird vor Umsetzung anhand aktueller amtlicher Quellen geprüft. Dieser Guide enthält keine fertige rechtliche Berechnungsregel.
Erstelle zuerst eine fachliche Spezifikation für die gewünschte Berechnung nach
der Wohnflächenverordnung. Prüfe aktuelle amtliche Quellen und dokumentiere
Quelle, Stand, Anwendungsbereich, Flächenarten, Höhenkategorien, Anrechnungen,
Ausschlüsse und noch offene Auslegungsfragen. Verwende keine Regeln aus Erinnerung.

Ordne Türnischen, Schornsteine, Vorbauwände und andere relevante Abzüge ausdrücklich
zu. Erfasse fehlende Modellinformationen als benannte manuelle Korrekturflächen
mit Begründung. Stelle ein unvollständiges Modell nicht als abschließend geprüfte
Berechnung dar.

Implementiere danach einen von UI und PDF unabhängigen Berechnungsdienst mit
versioniertem Regelprofil. Ergebnis pro Raum: Grundfläche, Teilflächen,
Höhenzuordnung, Anrechnungsfaktoren, Abzüge, Ergebnis und Datenherkunft.
Lege Rundung und Summenbildung fest. Abgeleitete Werte werden nach relevanten
Modelländerungen aktualisiert oder als veraltet markiert.

Prüfe gegen unabhängig gerechnete Beispiele für normalen Raum, Dachschräge,
Nischen, Abzüge und unvollständige Daten. Ergänze Geschoss- und Projektsummen.
Abnahme: Der Benutzer kann jede Summe auf Teilflächen und Regeln zurückführen. Manuelle Korrekturen sind sichtbar. Wiederholte Berechnungen desselben Modellzustands liefern dasselbe Ergebnis. Rechtskonformität wird erst behauptet, wenn Regeln und entsprechende Fälle fachlich geprüft sind.
Etappe 11 Wohnflächenbericht als PDF
Erstelle einen Berichtsexport aus dem geprüften Wohnflächenergebnis. Die PDF-
Erstellung darf keine eigene Flächenberechnung besitzen. Verwende ein definiertes
Berichtsdatenmodell, das auch unabhängig von der Darstellung geprüft werden kann.

Baue zunächst eine klare Standardvorlage mit Name, Adresse, Geschossen, Räumen,
Raumkennungen, Flächen, Höhenanteilen, Abzügen, Summen und sichtbarem Rechenweg.
Geschossanzahl und Raumzahl werden aus dem ausgewählten Berichtsumfang abgeleitet.
Ergänze Datum, Regelstand und Hinweise auf manuelle oder fehlende Daten.

Kennzeichne den Bericht bei relevanten Änderungen als veraltet und erzeuge ihn
erst nach erneuter Berechnung. Lege Erweiterungspunkte für weitere Vorlagen an,
ohne sofort einen Vorlageneditor zu entwickeln. Falls eine konkrete Vorlage
später bereitgestellt wird, passe die Ausgabe daran an.

Prüfe kurze und mehrseitige Berichte durch PDF-Rendering und Sichtkontrolle.
Summen müssen mit der UI und dem verwendeten Berechnungsergebnis übereinstimmen.
Abnahme: Lange Namen, Umlaute, viele Räume und Seitenumbrüche funktionieren. Rechenweg und Ergebnis bleiben lesbar. Der ausgewählte Berichtsumfang ist eindeutig; unvollständige Räume werden nicht unbemerkt übersprungen.
Etappe 12 Stabilität und größere Projekte nachweisen
Prüfe einen zusammenhängenden Ablauf: Wände und Linien erstellen, Snap/Guides
verwenden, Ebenen zuordnen, Elemente bearbeiten, Referenzplan kalibrieren, Raum
anlegen, Höhen zuweisen, Wohnfläche berechnen, Bericht exportieren, speichern,
laden und relevante Aktionen rückgängig machen beziehungsweise wiederholen.
Prüfe weiterhin die vorhandenen IFC- und Stage-1-Abläufe auf Regressionen.

Erstelle reproduzierbare kleine, mittlere und große Testprojekte. Messe auf
dokumentierter Hardware und Umgebung Fanglatenz, Bearbeitungsreaktion, Raum-
Neuberechnung, Dateirundlauf und History-Speicherbedarf. Definiere mit gemessener
Baseline sinnvolle Budgets. Dokumentiere Umfang und Messmethode.

Optimiere zuerst nachgewiesene Engpässe: räumliche Kandidatensuche, gezielte
Neuberechnung oder invalidierbare Caches. Index und Cache bleiben aus dem
Projektmodell abgeleitet. Nach Modelländerung, Undo und Laden dürfen sie keine
veralteten Treffer liefern. Ändere Snapshot-History erst, wenn der gemessene
Speicherbedarf das rechtfertigt.
Abnahme: Messwerte und Grenzen sind dokumentiert. Relevante Regressionen sind behoben. Das Projekt funktioniert unter den geprüften Bedingungen; ein allgemeines Versprechen für beliebig große BIM-Projekte wird daraus nicht abgeleitet.
6 Vollständige Zuordnung deiner Funktionswünsche
Codex übernimmt diese Matrix in die Projektplanung und ergänzt Status, Modul und Nachweis. Vorgeschlagene technische Ergänzungen wie IDs, Migrationen und Validierung dienen den genannten Funktionen; sie sind keine zusätzlichen Produktwünsche.
ID	Wunsch aus Anlage beziehungsweise Gespräch	Etappe
F01	Automatische Wohnflächenberechnung und sichtbarer Rechenweg	8–10
F02	Türnischen, Schornsteinabzüge und Vorbauwände berücksichtigen	8, 10
F03	Wohnflächenbericht nach Vorlage als PDF	11
F04	Name, Adresse, Geschossanzahl und Raumzahl im Bericht	11
F05	On-Demand-Menü nahe Cursor, verschiebbar, bleibt bei Auswahl	6
F06	Gewählten Punkt verschieben	6
F07	Bewegen	1, 6
F08	Info anzeigen	6
F09	Strecken einer gewählten Seite	6
F10	Maßstableiste unter Canvas mit Änderungsmöglichkeit	7
F11	Skalierwerkzeug für importierte Zeichnung mit zwei Messpunkten	7
F12	Neue Länge per Menü oder AI-Sprachbefehl	7
F13	Gesamte ausgewählte Referenz anhand der Messstrecke skalieren	7
F14	Grid sowie Snap und Hilfslinien aus dem Gespräch	2–3
F15	2D-Linienwerkzeug Punkt zu Punkt, kein Erstellen in 3D	5
F16	Voreinstellung Linie oder Polylinie	5
F17	Farbpalette, Strichstärke und Stricharten	5
F18	Räume in geschlossenen oder teilweise umschlossenen Wänden	8
F19	Raumkennung ab R-001, Name und Fläche	8
F20	Lichte Raumhöhen erkennen und Höhenlinien konfigurieren	9
F21	Unteren und oberen Messbezug wählen	9
F22	Höheninformationen in Wohnflächenberechnung verwenden	9–10
F23	Schraffur mit optionaler Füllung und Kontur	5
F24	Wählbare Farbe und Deckkraft oder Muster wie Mauerwerk	5
F25	Alle genannten Standardebenen	4
F26	Außenwand als Standard für Wände, 2D-Zeichnungen für 2D	4
F27	Elemente frei zuordnen, Ebenen erstellen und bearbeiten	4
F28	Organisation > Ebenen als eigenes Fenster	4
F29	Ebenenumschalter in Menüleiste, ein- und ausblenden	4


7 Entscheidungen rechtzeitig festhalten
Diese Punkte blockieren die Bestandsaufnahme nicht. Codex klärt sie vor der jeweiligen Implementierung, verwendet bei reversiblen Details nachvollziehbare Startwerte und hält die Entscheidung im Entwicklungsplan fest.
Entscheidung	Vor Etappe	Vorgeschlagener Start
Ergänzung der abgebrochenen Grid-Anforderung	2–3	Gesprächsanforderungen verwenden und als Ergänzung markieren
Hover-Zeit, Fangradius und Richtungen	3	Konfigurierbare Werte, im Bedienversuch anpassen
Ebenensichtbarkeit je Ansicht oder gemeinsam	4	Eine klare Variante für alle ersten Abläufe festlegen
Strichstärken und Muster in Modell oder Papiermaßen	5	Einheiten ausdrücklich dokumentieren
Welche Elemente welche Bearbeitung unterstützen	6	Aktionen zunächst für vorhandene Elementtypen
Bedeutung der Maßstabanzeige und unterstützte Importformate	7	Ansichts-/Ausgabemaßstab trennen; PDF-Seite und Bild zuerst
Raumkennungen und Umgang mit teiloffenen Grenzen	8	Projektweit eindeutige Kennungen und explizite virtuelle Grenzen
Verfügbare Dach- und Deckenquellen	9	Automatisch nur aus tatsächlicher Modellgeometrie
Regelprofil, Korrekturen und fachliche Prüfung	10	Amtliche Quelle prüfen, Annahmen offen dokumentieren
Konkrete Berichtsvorlage und Berichtsumfang	11	Standardvorlage, später bereitgestellte Vorlage übernehmen


Ein vollständiges Dach- oder Deckenwerkzeug ist hier keine heimlich hinzugefügte Etappe. Wenn vorhandene Geometrie für deine Höhenanforderungen nicht ausreicht, wird der nötige Umfang als eigener abhängiger Auftrag geplant. Ebenso wird aus „sonstige Dateitypen“ eine konkrete Formatliste, bevor weitere Importer gebaut werden.
8 Kurze Prompts für Prüfung und Fortsetzung
Wenn Codex einen Teil als fertig meldet
Prüfe den zuletzt umgesetzten Teil gegen seine Abnahmekriterien. Nenne konkrete
Nachweise und fehlende Nachweise. Kontrolliere Modellkonsistenz, Undo/Redo,
Dateirundlauf, ungültige Eingaben und die betroffenen Architekturgrenzen.
Behebe Fehler im aktuellen Umfang. Gib mir anschließend einen kurzen
Bedienversuch, den ich selbst durchführen kann. Beginne noch keine neue Etappe.
Wenn du den Bedienversuch abgeschlossen hast
Der letzte Bedienversuch ist abgeschlossen. Lies den aktuellen Entwicklungsplan
und wähle den nächsten noch offenen Teilauftrag dieses Guides, dessen
Voraussetzungen erfüllt sind. Überspringe nachgewiesen fertige Teile.
Setze diesen einen Teil mit dem gemeinsamen Starttext um und aktualisiere
anschließend Status, Nachweise und nächsten Schritt.
Wenn eine Funktion nicht funktioniert
Behebe zuerst diesen Fehler im aktuellen Teilauftrag:
[Meine Schritte, erwartetes Verhalten und tatsächlich beobachtetes Verhalten]
Ermittle die Ursache, korrigiere sie im zuständigen Modul und prüfe den
betroffenen Ablauf einschließlich seiner Nachbarsysteme. Ergänze einen
Regressionstest, wenn er den Fehler sinnvoll absichert. Starte kein neues Feature.
9 Dein nächster Schritt
Gib Codex diesen Guide und den Auftrag aus Etappe 0. Danach sollte Codex dir sagen können: „Diese Bereiche funktionieren nachweislich, diese Teile fehlen, und dies ist der nächste kleine Auftrag.“ So wird aus der Funktionsliste ein prüfbarer Entwicklungsprozess.
Die erste sichtbare neue Funktion nach dem nötigen Fundament ist voraussichtlich der gemeinsame Endpunktfang. Ob vorher noch ein kleiner Application-Schritt erforderlich ist, entscheidet der aktuelle Code und nicht die Vermutung aus unserem bisherigen Gespräch.