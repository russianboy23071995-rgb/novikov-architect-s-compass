# Entwicklungsabstimmung für NOVIKOV CAD vom 8. Oktober 2026

## Auftrag und Verbindlichkeit

Der Nutzer hat die aktualisierte Funktionsdatei hochgeladen und beauftragt, die
weitere Vorgehensweise mit dem programmierenden Codex an seinen Zielen und
Visionen auszurichten. Diese Übergabe ergänzt den Entwicklungsleitfaden,
N01–N60 und AI01–AI35. Sie ersetzt keine bestehenden Produktwünsche pauschal.
ARCHITECTURE.md bleibt der Architekturvertrag. Die Aufgabenreihenfolge hier
ersetzt ältere nächste-Auftrag-Texte für die unten behandelten Themen.

Quelle: [vollständige Texttranskription des Uploads](../requirements/FUNKTIONEN_2026-10-08_SOURCE.md).
Die Datei heißt weiterhin FUNKTIONEN 03.10.2026.docx, wurde aber am 08.10.2026
erneut bereitgestellt. Die Schlussabsätze werden unten als V01–V09 erfasst.
Ohne Vergleichs-DOCX wird nicht behauptet, dass jeder dieser Punkte erstmals neu ist.
Ältere N-/F-/AI-Kennungen bleiben unverändert.

Prüfstand: main dcb19e8 nach PR178. Zum Zeitpunkt dieser Abstimmung liegt bereits
[PR179](https://github.com/russianboy23071995-rgb/novikov-architect-s-compass/pull/179)
mit dem kontrollierten A/B-Vergleich vor, Kopf 78f2d9d vor dieser Dokumentergänzung.
Seine Diagnoseergebnisse werden berücksichtigt, sein offener Status bleibt sichtbar.
Diese Übergabe ergänzt den laufenden PR dokumentarisch; sie ist keine Bestätigung,
dass ein anderer Codex-Chat sie schon gelesen oder akzeptiert hat.

## Produktziel

Ein gemeinsames, verlässlich bearbeitbares BIM-Modell versorgt Grundriss, 3D,
Schnitte, modellgebundene Abbilder, Layouts, Auswertungen und Export.
Große Projekte und Referenzpläne sollen innerhalb benannter, gemessener Grenzen
funktionieren. AI mit Text, Sprache und Skizzen ist ein zentrales Bedienziel.
Jede neue fachliche Aktion bekommt deshalb früh einen gemeinsamen typisierten
Vertrag; AI interpretiert die Eingabe und verwendet diese geprüfte Aktion.

Windows und macOS bleiben Zielplattformen. Browser oder installierbare Anwendung
sind weiterhin offen. Modell, Dateivertrag und Aktionen bleiben unabhängig von
Dateidialogen und Betriebssystemintegration. Es wird jetzt weder ein neues
Framework noch ein neuer Renderer, eine Datenbank oder eine Programmiersprache
festgelegt.

## Ergänzte Funktionen V01–V09

Soll-Anforderungen, keine Fertigmeldung. Vor Umsetzung vorhandene Teilfähigkeiten
wiederverwenden. Die Kennungen gelten für diese Ergänzung vom 08.10.2026.

| ID | Nutzerwunsch | Einordnung und Abnahmegrenze |
| --- | --- | --- |
| V01 | Live Strecken, Flächen und Winkel messen | Gemeinsames Fang-/Geometriesystem; temporäre Messung ohne Modellkopie oder History je Mausziel. Dauerhafte assoziative Maßketten bleiben N46 als eigener Schritt. |
| V02 | Bereich in 2D/3D auswählen, darauf skizzieren und per Sprache/Text Änderungen beschreiben | Ergänzt AI10/AI26/AI31. Ansicht, stabile Ziel-IDs und Modellrevision binden; Änderungsvorschau mit Annahme und Undo über vorhandene Aktionen. Eigenes Modelltraining ist keine festgelegte Voraussetzung. |
| V03 | Live-3D-Schnitt | An N05 anbinden. Zunächst Schnittdarstellung als Ansichtsoperation konzipieren; tatsächliches Beschneiden des Fachmodells ist V09. Umfang der Schnittebenen/Schnittbox vor Umsetzung klären. |
| V04 | First-Person mit WASD und Maus | Kameranavigation pro Ansicht; keine Modelländerung oder Modell-History pro Kamerabewegung. Perspektive, Eingabekonflikte und große Szenen gesondert abnehmen. |
| V05 | Kontextmenü mit Kopieren, Einfügen, Importieren, Spiegeln und Darstellungsreihenfolge | N09/N10/N54 ergänzen; zentrale typisierte Aktionen mit Zulässigkeitsprüfung. Bedeutung der Darstellungsreihenfolge in 3D und erlaubte Spiegeloperationen sind noch offen. |
| V06 | Doppelter Rechtsklick aktiviert das Werkzeug samt Eigenschaften des Elements | Werkzeugvorgaben übernehmen, ohne Quelle zu verändern oder ein neues Element automatisch zu erzeugen. Keine IDs/Anschlüsse kopieren. Eigenschaftenumfang vor Umsetzung festlegen. Das ist nicht automatisch eine Aktion zum Ändern anderer vorhandener Elemente. |
| V07 | Schraffuren verwalten, erstellen und bearbeiten | N39/N40 erweitern; wiederverwendbare Musterdefinitionen von ihren Anwendungen trennen. Änderungen und Variantenbildung ausdrücklich regeln. |
| V08 | Gemeinsame Werkzeugeigenschaften einheitlich zuerst anzeigen | N53 erweitern; Fähigkeiten und fachlich passende Felder verwenden. Kein Universalobjekt, das jedem Typ Breite, Höhe, Länge und Geschoss aufzwingt. |
| V09 | 3D-Objekte vereinfacht trimmen, etwa Wand an Satteldach | N26/N27 und Dachfunktion verbinden. Fachliche Operation mit Abhängigkeiten, geprüfter Vorschau, einem Commit und Undo; kein ausschließlich im Renderer abgeschnittenes Ersatzmodell. |

Zusätzlich bleiben die Wünsche nach mehreren Geschossen, Höhenbezügen,
Dachfläche/Walmdach/Gauben, mehrschichtigen Bauteilen, Räumen/Wohnflächen,
PDF-Zerlegung, verbundenen Abbildern, parallelen Canvasfenstern und Exportlayouts
gültig. Die bestehende AI-Vision wird durch V02 konkretisiert, nicht ersetzt.

BIM-/3D-Elemente werden niemals proportional skaliert, auch nicht im Grundriss.
Zulässig bleiben echte 2D-Skalierungen sowie Kalibrierung importierter PDF- und
gemäß Präzisierung vom 07.10. auch PNG/JPEG-Referenzen.
Zoom, Ausgabemaßstab und Modellmaße sind getrennte Begriffe.

## Befunde und passende Aufgaben

| ID / Priorität | Befund und Belegqualität | Begrenzter Auftrag |
| --- | --- | --- |
| K01 / P1 | planBounds übergibt alle Extents per Spread an Math.min/max. Isolierter Original-Funktionskörper unter Node 24: 20 Polylinien mit je 10.000 Punkten, etwa 3,48 MB JSON-Testdaten, RangeError. Kein vollständiger Browser-/Projektvalidator-Test dieses Datensatzes. | Grenzen iterativ bestimmen; leere/kleine/große Fälle erhalten; gültige große Fixture und Browser-Einpassen nachweisen. |
| K02 / P1 | 10-MiB-Gesamtprojektgrenze greift auch beim Commit; Base64-Bilder liegen im Projekt; JPEG-Import normalisiert nach PNG. Harte Produktgrenze aus size.ts/history.ts/import.ts. | Kapazitätsziel und versionierten Modell-/Asset-Speichervertrag anhand K03 festlegen, bevor das Limit erhöht wird. Portable Weitergabe, Altdateimigration und Windows/macOS-Adapter berücksichtigen. |
| K03 / P1 | Kein vollständiger Nachweis für Dateigröße, Gesamtpixel, Spitzenspeicher und lange History. 16 MP ist nur ein Budget pro Bild; URL-Cache begrenzt Strings, nicht den gesamten decodierten Bild-/GPU-Speicher. | Begrenzte Kapazitätsdiagnose; mehrere Rasterreferenzen, 1/10/50/100 Undo-Stände, Import/Platzierung/Bestätigung/Laden/Speichern und 2D/3D getrennt messen. |
| K04 / P1 | Auswahlbewegung ist lokal vorbereitet, andere Vorschauen laufen weiterhin über Gesamtprojektprüfungen, u. a. Wandbearbeitung, Wandzeichnen und Bildplatzierung. Statischer Codebefund. | Häufigen verbleibenden Consumer messen, anschließend einzeln an dieselbe Infrastruktur anschließen; keine neue Interaktions-/History-Engine pro Werkzeug. |
| K05 / P1 | Bestätigung laut SESSION_WALL_EXTRUSION bei 1.000 Elementen etwa 504–512 ms in einzelnen Klickmessungen, eine Materialisierung, fünf Vollvalidierungen. | Commit separat profilieren; redundante Arbeit an derselben unveränderlichen Revision begrenzt reduzieren. Vollständige Datei-/öffentliche Eingangsprüfung und sichere Veröffentlichung erhalten. |
| K06 / P2 | Betroffene Wandmenge umfasst konservativ die ganze verbundene Komponente; doppelte Konturableitung und Fensterfilter pro Wand bleiben Kandidaten. Statisch belegt, kein neuer isolierter Zeitnachweis. | Zusammenhängenden Wandzug und dichte Anschlüsse messen, Größe der betroffenen Menge protokollieren. Fachlich sichere Grenzen/Host-Indizes und gemeinsame Ableitung erst am Befund verbessern. |
| K08 / P2 | IFC-Export enthält weitere Vollprüfungen, Fensterfilter pro Wand und vollständige Ausgabestrings im Speicher. Statischer Befund, keine neue Exportzeit. | In K03 Exportzeit/Spitzenspeicher aufnehmen; Host-Index und wiederverwendbare geprüfte Ableitungen erst anhand des Profils verbessern. |
| K07 / P2 vor großem 3D-Ausbau | BimSolidView projiziert beim Draw alle Vertices auf der CPU und lädt Geometriepuffer neu; Picking durchsucht Flächen. Kein neuer 3D-Lasttest. | Kamera/Picking/mehrere Ansichten vermessen; GPU-Geometrie wiederverwenden, räumliche Suche und gezielte Aktualisierung prüfen. Kein vorab beschlossener Rendererwechsel. |

Quellen im geprüften Stand:
- src/components/cad/bim-view.ts, planBounds
- src/interop/project-file/size.ts; src/lib/bim/history.ts
- src/interop/images/import.ts; src/domain/elements/reference/model.ts
- src/application/references/actions.ts; src/domain/project/prepared-translation.ts
- src/components/cad/BimSolidView.tsx; src/rendering/viewport/wall-depth.ts
- [Pilot](../performance/PREPARED_SELECTION_PREVIEW.md),
  [Extrusionsmessung](../performance/SESSION_WALL_EXTRUSION.md),
  [PR179 A/B-Vergleich](../performance/SELECTION_EXTRUSION_AB.md)

Der alte 5.000-Objekt-Engpass darf nicht erneut als gegenwärtiger Pointerpfad
der vorbereiteten Auswahlbewegung beschrieben werden. Snap verwendet weiterhin
lokale Suche und Dichtebegrenzung. Atomare Auswahlbestätigung ist bereits umgesetzt.
Im PR179-A/B-Vergleich profitiert die große Auswahl insgesamt, beim kleinen
T-Paar ist weitere Extrusionsoptimierung kein belegter Haupthebel. Seine
React-Unterbaumdiagnose bleibt als begrenzter Auftrag erhalten.

## Angepasste Reihenfolge

1. **Laufenden PR179 geordnet abschließen.** Vorhandene paarweise A/B-Nachweise
   prüfen und übernehmen, wenn der bestehende Reviewprozess abgeschlossen ist.
   Diese Planung verlangt keine Wiederholung identischer bereits belegter Tests.
   Noch offene manuelle Shift-Abnahme bleibt ausdrücklich offen.
2. **Nächster neuer Implementierungsauftrag: K01 planBounds.** Den konkreten
   Großdatenabsturz beheben, ohne zusätzliche Renderer-/Dateiformatänderung.
3. **K03 Kapazität erfassen.** Ein benanntes Zielprofil für realistische Projekte
   dokumentieren; vorhandene 100/1.000/5.000-Fixtures wiederverwenden und um
   komplexe Punktmengen, verbundene Wände und mehrere Rasterpläne ergänzen.
   Geometrieanzahl, Punkte, Dateibytes und Bildpixel
   getrennt betrachten; kalte Vorbereitung, Pointer, Bestätigung, History und
   Export unterscheiden. Produktmessungen respektieren 10 MiB; größere Daten nur
   ausdrücklich im Diagnoseharness untersuchen. Unter Speicher-/Zeitbudget
   abbrechen und den erreichten Stand berichten, keinen Absturz erzwingen.
4. **Aus K03 genau einen Folgeauftrag wählen.** Vorrang hat ein nachgewiesener
   Blocker des gewünschten Projektumfangs: K02 Speicherung/Assets, K05 Commit
   oder K04 verbliebener Preview-Consumer. Für das offene kleine Shift-Szenario
   den in PR179 vorgesehenen React-Anteil begrenzt aufschlüsseln; keinen
   weiteren Extrusionscache ohne neuen Befund. K06/K07 bleiben gezielte Profile.
5. **Fachmodell bei den nächsten Funktionen erweitern.** Mehrgeschossigkeit
   und Höhenbezüge als eigener kleiner Modell-/Migrationsschritt; Ansichts-
   identität und Annotation-Scope bei der ersten gespeicherten Ableitung.
   DrawingDocument/Layout folgen dem konkreten Plan-/Exportablauf.
6. **Neue Funktionen nach ihren tatsächlichen Voraussetzungen anschließen.**
   Dachgeometrie und V09 benötigen Höhen-/Abhängigkeitsregeln. V03/V04 benötigen
   passende Ansicht/Projektion und 3D-Leistungsabnahme. V02 kann zunächst
   vorhandene Aktionen verwenden und wächst mit deren geprüften Fähigkeiten.

Nicht alle Funktionswünsche müssen auf ein vollständiges Fundamentprojekt warten.
Nach abgeschlossenen Stabilitätsaufträgen sind V01 als flüchtige Messung und V06
als Werkzeugvorgabenübernahme mögliche kleine Produktfortschritte.
Ein vollständiges Layoutsystem ist weder Voraussetzung für Messung noch für
ein erstes Dach. Ein AI-Skizzenprototyp über vorhandenen Aktionen kann früh
entstehen; neue fachliche Aktionen werden dadurch nicht vorgetäuscht.
Codex erhält trotzdem jeweils nur einen begrenzten aktiven Implementierungsauftrag.

## Architekturentscheidungen vor der jeweiligen Funktion

- Geschoss/Höhe: vorhandene feste Wandhöhen dürfen bei Migration nicht
  stillschweigend an Geschosshöhen gebunden werden.
- Ansichten: ModelView, DrawingDocument, Annotation-Scope, Layout und
  ViewportBinding gemäß bestehendem Vertrag; keine Bauteilkopie pro Fenster.
- Live-Schnitt vs. Trimmen: Schnittdarstellung verändert zunächst die Sicht.
  Ob ein Wandzuschnitt dauerhaft am Dach hängt oder einmalig ist, entscheidet
  der Nutzer vor V09; Abhängigkeiten und Lösch-/Änderungsfälle dann mitprüfen.
- AI: markierter Bereich braucht Ansicht/Arbeitsebene, Ziel-IDs und Revision.
  Skizze/Transkript sind Eingaben; Vorschau und Übernahme erfolgen mit denselben
  Fachregeln wie manuelle Bearbeitung. Kein eigenes Training voraussetzen.
- Große Dateien: Grenze erst nach Kapazitätsnachweis ändern. Snapshot-History
  nicht pauschal auf Delta-History umstellen; tatsächlichen Speicherbedarf messen.
- V05/V06/V07: 3D-Zeichenreihenfolge, konkrete übernommene Eigenschaften und
  Auswirkungen einer Schraffurdefinition auf ihre Anwendungen bleiben bis zum
  jeweiligen Teilauftrag offen. D versus Strg+D bleibt ebenfalls offen.

## Konkreter Codex-Auftrag nach Abschluss des laufenden PR

Lies AGENTS.md, den aktuellen DEVELOPMENT_PLAN.md und diese Abstimmung.
Prüfe zunächst, ob K01 inzwischen bereits behoben wurde. Falls nicht:
Reproduziere den planBounds-Fehler mit einem gültigen Projekt mit vielen Punkten.
Ersetze die unbeschränkten Math.min/Math.max-Spread-Aufrufe durch eine
fortlaufende Grenzberechnung. Erhalte Modell-/SVG-Koordinaten, Ränder,
Bildreferenzen und Verhalten leerer Projekte. Prüfe Gleichheit an kleinen
gemischten Fällen und den großen auslösenden Fall; öffne diesen im Browser,
passe die Ansicht ein und kontrolliere Darstellung/Zoom. Keine neue Geometrie,
kein neues Dateiformat und keine pauschale Datenlimit-Erhöhung.
Berichte tatsächliche Tests und Grenzen; aktualisiere den Entwicklungsplan.
Danach genau einen Auftrag für die K03-Kapazitätsdiagnose konkretisieren.
