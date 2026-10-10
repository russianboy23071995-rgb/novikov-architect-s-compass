# NOVIKOV CAD – zentrales Anforderungsregister

Stand 10.10.2026, main 6abcf7c32821d1cf92237c3cdffe92a4312fe6a9 (PR237).

Dieses Register gehört zum NOVIKOV_MASTERPLAN.md. Es erhält alte Kennungen und detaillierte Inhalte. Aktuelle Statuszeilen oben und der Masterplan sind maßgeblich. Die gekennzeichneten Quellenkapseln weiter unten bewahren Detailanforderungen und historische Nachweise; dort genannte alte „nächste Aufgaben“, Schemaversionen und offene Entscheidungen sind niemals allein ein neuer Auftrag. Der aktuelle Code-/PR-Abgleich im Masterplan hat Vorrang. Unbekannt ist nicht implementiert.

## Navigation

1. N01–N60: ursprünglicher Funktionskatalog mit aktuellem Teilstatus und Abnahme.
2. Guide-F01–F29: verlustfreie Zuordnung des Entwicklungsleitfadens.
3. AI01–AI35: strategischer AI-Katalog und ausführliche Originalstrategie.
4. V01–V09 / R26-01–08 / K01–K08 / C01–C04 / UX01–03 / MS: Ergänzungen, Risiken und Maßstab.
5. RC01–10 / SB01–07 / HP01–05: Produktverantwortung, SBOM und Homepage; sechs laufende Register.
6. Detailverträge: zusammengeführte Spezifikationen mit Herkunft und Gültigkeitsgrenzen.
7. Quelleninventar und historische offene Prüfkandidaten. Alle ursprünglichen Quellen bleiben erhalten.

Für einen Auftrag nur seine Kennungen/Detailkapsel lesen; nicht das ganze Register in jeden Kontext laden. Neue Entscheidungen/Status direkt im betreffenden Eintrag aktualisieren. Altkennungen nicht neu vergeben. Historische FEATURE_ROADMAP-F-Kennungen sind ausdrücklich von Guide-F-Kennungen verschieden.

## 1. N01–N60 – aktuelle Einordnung

Gemeinsame Abnahme jedes persistenten Teilauftrags: stabile IDs, zulässiger Scope/Host, gemeinsame typisierte Action/Query, deterministische Fachprüfung, gültige Vorschau/Abbruch, atomarer Commit/Undo, betroffene 2D/3D-Ableitungen, Migration/Dateirundlauf und einschlägiger Export. Kein Elementtyp gilt allein wegen eines Toolbar-Eintrags als implementiert. Die folgenden Statusmeldungen gelten nur für den genannten Umfang.


### N01 – Gemeinsames BIM-Modell für komplexe geometrische Entwürfe

- **Stand:** Teilweise: ein autoritatives Modell, aber ein Geschoss und begrenzte Bauteilfamilien.
- **Zuständigkeit:** M, E → domain/project, geometry/solids
- **Altzuordnung:** Architekturvertrag; Stage 1
- **Abnahme/Abhängigkeiten:** Neue Elementverträge, robuste Geometrie, Migration; keine Leistungszusage für Großprojekte. Ältere Schema-/Statusannahmen daraus gelten nur historisch; Masterplan und aktueller Code prüfen.
- **Quelle:** FUNKTIONEN-Transkript 08.10., Funktionsarchitektur/Abgleich 03.10.; neuere Präzisierungen im Masterplan.


### N02 – PDF-Pläne, 3D-Modelle, IFC und DXF exportieren

- **Stand:** Teilweise: JSON und IFC-Wände/Fenster; PDF/DXF/DWG/separater 3D-Export fehlen.
- **Zuständigkeit:** IO → interop/ifc, pdf, dxf, 3d
- **Altzuordnung:** Guide-F03; Gespräch IFC
- **Abnahme/Abhängigkeiten:** N05/N59 für Pläne, N36 für Bericht; 3D-Format und DXF-Inhalte offen. Ältere Schema-/Statusannahmen daraus gelten nur historisch; Masterplan und aktueller Code prüfen.
- **Quelle:** FUNKTIONEN-Transkript 08.10., Funktionsarchitektur/Abgleich 03.10.; neuere Präzisierungen im Masterplan.


### N03 – Darstellung von 2D/3D ändern, Farbe oder Schraffur

- **Stand:** Teilweise: Linien-/Schraffurstile und Anzeigeeinstellungen; allgemeine 2D/3D-Overrides je Bauteil fehlen.
- **Zuständigkeit:** UI, Vw → rendering/styles, domain/views
- **Altzuordnung:** Guide-F17/F23/F24
- **Abnahme/Abhängigkeiten:** N16/N39/N40, Trennung Material vs Darstellung und Dokument-Scope. Ältere Schema-/Statusannahmen daraus gelten nur historisch; Masterplan und aktueller Code prüfen.
- **Quelle:** FUNKTIONEN-Transkript 08.10., Funktionsarchitektur/Abgleich 03.10.; neuere Präzisierungen im Masterplan.


### N04 – Maßstab von Canvas, Grundriss, Schnitt und Ansicht

- **Stand:** Teilweise: Arbeitsmaßstab gespeichert, Schraffuren Modell/Papier; Schnitt-/Ansichts-/Layoutausgabe fehlt.
- **Zuständigkeit:** Vw → ModelView, DrawingDocument
- **Altzuordnung:** Guide-F10
- **Abnahme/Abhängigkeiten:** N05/N57; Modellmetres, Bildschirmzoom, Papiermaßstab getrennt. Ältere Schema-/Statusannahmen daraus gelten nur historisch; Masterplan und aktueller Code prüfen.
- **Quelle:** FUNKTIONEN-Transkript 08.10., Funktionsarchitektur/Abgleich 03.10.; neuere Präzisierungen im Masterplan.


### N05 – Schnitt- und Ansichtswerkzeuge erzeugen 2D-Ableitungen

- **Stand:** Geplant: keine generierten Schnitte/Ansichten in main.
- **Zuständigkeit:** Ziel domain/views, geometry/projections, rendering
- **Altzuordnung:** Gespräch gemeinsame Ansichten; neu konkretisiert
- **Abnahme/Abhängigkeiten:** N21/N47 für erweiterte Geometrie; Feature-ID-Zuordnung, Schnittdefinition. Ältere Schema-/Statusannahmen daraus gelten nur historisch; Masterplan und aktueller Code prüfen.
- **Quelle:** FUNKTIONEN-Transkript 08.10., Funktionsarchitektur/Abgleich 03.10.; neuere Präzisierungen im Masterplan.


### N06 – Abgeleitete 2D-Dokumente bearbeiten

- **Stand:** Teilweise vorhanden: PR238 ist in main (927dfcf). Bearbeitbare Grundriss-Abbilder verwenden dasselbe Modell und gemeinsame Geschosszeichnungen; Linien/Schraffuren aus Abbildern sind seit Nutzerkorrektur nicht abbildlokal. Schnitte/Ansichten und weitere Annotationen bleiben offen.
- **Zuständigkeit:** Ziel domain/documents, application/document-actions
- **Altzuordnung:** Neu; Guide-F23/F24 als Ergänzungen
- **Abnahme/Abhängigkeiten:** N05/N57, Annotation-Scope, Modus Modellaktion vs Dekoration. Ältere Schema-/Statusannahmen daraus gelten nur historisch; Masterplan und aktueller Code prüfen.
- **Quelle:** FUNKTIONEN-Transkript 08.10., Funktionsarchitektur/Abgleich 03.10.; neuere Präzisierungen im Masterplan.


### N07 – Fang in 3D und Hilfsflächen für X/Y/Z

- **Stand:** Teilweise: z=0-Wand-Fußpunkte, gemeinsame Inferenz und Wandbearbeitung; freie XYZ-Ebenen fehlen.
- **Zuständigkeit:** Vw, S → geometry/Point3/Ray/Plane, constraints
- **Altzuordnung:** Guide-F14; F13_HILFLINIENSYSTEM
- **Abnahme/Abhängigkeiten:** Explizite Arbeitsebene, Bildschirmabstand, N29 und Capability-Kontext. Ältere Schema-/Statusannahmen daraus gelten nur historisch; Masterplan und aktueller Code prüfen.
- **Quelle:** FUNKTIONEN-Transkript 08.10., Funktionsarchitektur/Abgleich 03.10.; neuere Präzisierungen im Masterplan.


### N08 – Hochwertige Raster und Hilfslinien auf Bedarf

- **Stand:** Teilweise: gemeinsamer End-/Mittel-/Schnittpunktfang, Guides, lokale Suche/Dichtebegrenzung; nicht alle Raum-/3D-Quellen.
- **Zuständigkeit:** S, E, Vw → gemeinsame constraints
- **Altzuordnung:** Guide-F14; Gespräch Ring/Mehrfachreferenz
- **Abnahme/Abhängigkeiten:** Rekursive Kandidatenabfragen beseitigen; Mittelpunkt, echte Segmentschnitte, allgemeine Guides, Hysterese fehlen. Ältere Schema-/Statusannahmen daraus gelten nur historisch; Masterplan und aktueller Code prüfen.
- **Quelle:** FUNKTIONEN-Transkript 08.10., Funktionsarchitektur/Abgleich 03.10.; neuere Präzisierungen im Masterplan.


### N09 – Bewegliches On-Demand-Menü bei Elementauswahl

- **Stand:** Vorhanden für aktuelle unterstützte Typen: bewegliches Auswahlmenü; weitere Capability-Adapter nötig.
- **Zuständigkeit:** UI/DemandMenu, E → UI plus application capabilities
- **Altzuordnung:** Guide-F05/F08; C03
- **Abnahme/Abhängigkeiten:** Neue Typen nur mit geprüften Aktionen; Menüposition und Tastatur erhalten. Ältere Schema-/Statusannahmen daraus gelten nur historisch; Masterplan und aktueller Code prüfen.
- **Quelle:** FUNKTIONEN-Transkript 08.10., Funktionsarchitektur/Abgleich 03.10.; neuere Präzisierungen im Masterplan.


### N10 – Gesamtes Element bewegen

- **Stand:** Teilweise: gemeinsame Element-/Auswahlbewegung, Fenster am Host, begrenzte 3D-Wandaktionen; neue Typen offen.
- **Zuständigkeit:** E → application/actions
- **Altzuordnung:** Guide-F07
- **Abnahme/Abhängigkeiten:** Neue Typen/N29 benötigen Capability- und Kontextverträge; kein 3D-Move bisher. Ältere Schema-/Statusannahmen daraus gelten nur historisch; Masterplan und aktueller Code prüfen.
- **Quelle:** FUNKTIONEN-Transkript 08.10., Funktionsarchitektur/Abgleich 03.10.; neuere Präzisierungen im Masterplan.


### N11 – Punkt einfügen oder vorhandenen Punkt verschieben

- **Stand:** Teilweise: bestehende Wandenden/2D-Vertices; Topologieänderungen nur im zulässigen Typumfang.
- **Zuständigkeit:** E, M → application/topology
- **Altzuordnung:** Guide-F06
- **Abnahme/Abhängigkeiten:** N08, stabile Feature-Bezüge; gerade Wand nicht beliebig knicken. Ältere Schema-/Statusannahmen daraus gelten nur historisch; Masterplan und aktueller Code prüfen.
- **Quelle:** FUNKTIONEN-Transkript 08.10., Funktionsarchitektur/Abgleich 03.10.; neuere Präzisierungen im Masterplan.


### N12 – Linie knicken oder Polygon um weiteren Eckpunkt erweitern

- **Stand:** Teilweise: Polylinien und 2D-Konturbearbeitung; keine beliebige geknickte BIM-Wand.
- **Zuständigkeit:** M, UI → application/topology, geometry
- **Altzuordnung:** Guide-F15/F16
- **Abnahme/Abhängigkeiten:** N11, line→polyline-Regel, Nullsegmente und Selbstschnitte behandeln. Ältere Schema-/Statusannahmen daraus gelten nur historisch; Masterplan und aktueller Code prüfen.
- **Quelle:** FUNKTIONEN-Transkript 08.10., Funktionsarchitektur/Abgleich 03.10.; neuere Präzisierungen im Masterplan.


### N13 – Ganze Polygonkante versetzen und Fläche verbreitern

- **Stand:** Teilweise: konvexe 2D-Konturkante/Offset über gemeinsame Geometrie; allgemeine konkave/Aussparungsfälle prüfen.
- **Zuständigkeit:** E → geometry/offset, application/edge-edit
- **Altzuordnung:** Guide-F09
- **Abnahme/Abhängigkeiten:** Gültige Polygonkontur, N08/N39, Nachbarkanten/Aussparungen. Ältere Schema-/Statusannahmen daraus gelten nur historisch; Masterplan und aktueller Code prüfen.
- **Quelle:** FUNKTIONEN-Transkript 08.10., Funktionsarchitektur/Abgleich 03.10.; neuere Präzisierungen im Masterplan.


### N14 – Letzte Menüaktion bei kompatibler Geometrie vormerken

- **Stand:** Geplant bzw. weiterer Nachweis nötig: gemerkte letzte kompatible Aktion, ohne automatische Mutation.
- **Zuständigkeit:** Ziel application/capabilities, UI/preferences
- **Altzuordnung:** Neu gegenüber Guide-F05
- **Abnahme/Abhängigkeiten:** N09/N11; nur Modus vorwählen, keine automatische Modelländerung. Ältere Schema-/Statusannahmen daraus gelten nur historisch; Masterplan und aktueller Code prüfen.
- **Quelle:** FUNKTIONEN-Transkript 08.10., Funktionsarchitektur/Abgleich 03.10.; neuere Präzisierungen im Masterplan.


### N15 – Maßstab in unterer Leiste ändern

- **Stand:** Vorhanden: Selector neben Zoom, Presets/freies S, persistenter Arbeitskontext; Drucknachweis separat.
- **Zuständigkeit:** Vw/CadViewport → UI/view-scale
- **Altzuordnung:** Guide-F10
- **Abnahme/Abhängigkeiten:** N04; Ausgabe 1:n gesondert, keine Modellskalierung. Ältere Schema-/Statusannahmen daraus gelten nur historisch; Masterplan und aktueller Code prüfen.
- **Quelle:** FUNKTIONEN-Transkript 08.10., Funktionsarchitektur/Abgleich 03.10.; neuere Präzisierungen im Masterplan.


### N16 – Alle Elementtypen einer Organisationsebene zuordnen

- **Stand:** Vorhanden für aktuelle Typen: Ebenendaten/Zuordnung/Management und Migration; neue Typen anschließen.
- **Zuständigkeit:** M → domain/layers, application/layers
- **Altzuordnung:** Guide-F25/F26/F27
- **Abnahme/Abhängigkeiten:** Migration aller vorhandenen Typen; künftige Annotationen und Möbel einbeziehen. Ältere Schema-/Statusannahmen daraus gelten nur historisch; Masterplan und aktueller Code prüfen.
- **Quelle:** FUNKTIONEN-Transkript 08.10., Funktionsarchitektur/Abgleich 03.10.; neuere Präzisierungen im Masterplan.


### N17 – Ebenen einzeln, alle oder als Ausnahmeauswahl schalten

- **Stand:** Vorhanden für aktuelle BIM-Arbeitsansichten: gemeinsame Eligibility und gespeicherter Filter; Abbildfilter in PR238.
- **Zuständigkeit:** Ziel application/visibility, ModelView/ViewOverrides
- **Altzuordnung:** Guide-F28/F29
- **Abnahme/Abhängigkeiten:** N16; Filter gemeinsam für Rendering/Picking/Snap, Exportumfang getrennt. Ältere Schema-/Statusannahmen daraus gelten nur historisch; Masterplan und aktueller Code prüfen.
- **Quelle:** FUNKTIONEN-Transkript 08.10., Funktionsarchitektur/Abgleich 03.10.; neuere Präzisierungen im Masterplan.


### N18 – AI und Sprache als zentraler Bedienzugang

- **Stand:** Teilweise: begrenzte deutsche Text-/Sprachbefehle, Auswahlkontext und Vorschau; generative AI fehlt.
- **Zuständigkeit:** A, E → ai/commands, voice, context
- **Altzuordnung:** Guide-F12; C02; stabile Auswahl aus Gespräch
- **Abnahme/Abhängigkeiten:** Für jede neue geprüfte Aktion typisierter Adaptervertrag; Transkriptqualität separat. Ältere Schema-/Statusannahmen daraus gelten nur historisch; Masterplan und aktueller Code prüfen.
- **Quelle:** FUNKTIONEN-Transkript 08.10., Funktionsarchitektur/Abgleich 03.10.; neuere Präzisierungen im Masterplan.


### N19 – Wände, Türen, Fenster, Decken, Dächer per Sprache/Text

- **Stand:** Geplant: vollständige Bauteilerzeugung über Sprache/AI; nur vorhandene geprüfte Aktionen dürfen angeboten werden.
- **Zuständigkeit:** A → application creation actions, domain
- **Altzuordnung:** Gespräch BIM/AI; neu konkretisiert
- **Abnahme/Abhängigkeiten:** N18 und jeweils vorhandener Typ/Host/Geschoss, kein erfundener Zieldatensatz. Ältere Schema-/Statusannahmen daraus gelten nur historisch; Masterplan und aktueller Code prüfen.
- **Quelle:** FUNKTIONEN-Transkript 08.10., Funktionsarchitektur/Abgleich 03.10.; neuere Präzisierungen im Masterplan.


### N20 – Bemaßung per Sprache/Text

- **Stand:** Geplant: AI-/Sprachmaßketten nach persistentem Dimensionsmodell.
- **Zuständigkeit:** Ziel application/dimensions, ai adapters
- **Altzuordnung:** Neu
- **Abnahme/Abhängigkeiten:** N46 zuerst, dann geprüfte Intents/Feature-Kontext. Ältere Schema-/Statusannahmen daraus gelten nur historisch; Masterplan und aktueller Code prüfen.
- **Quelle:** FUNKTIONEN-Transkript 08.10., Funktionsarchitektur/Abgleich 03.10.; neuere Präzisierungen im Masterplan.


### N21 – Geschosse im Navigator frei erstellen und Höhen definieren

- **Stand:** Geplant: Schema16 besitzt genau ein storey, keine freie Mehrgeschossanlage.
- **Zuständigkeit:** M, UI/Navigator → domain/storeys
- **Altzuordnung:** Gespräch mehrere Geschosse
- **Abnahme/Abhängigkeiten:** Migration Schema 1, Namen/Höhen/Bezüge, N16; 2D/3D/IFC-Rundlauf. Ältere Schema-/Statusannahmen daraus gelten nur historisch; Masterplan und aktueller Code prüfen.
- **Quelle:** FUNKTIONEN-Transkript 08.10., Funktionsarchitektur/Abgleich 03.10.; neuere Präzisierungen im Masterplan.


### N22 – Wände, Stützen und andere Bauteile kennen Geschosshöhen

- **Stand:** Geplant: feste/geschossgebundene Höhen und Stützen; Migration erhält bisher feste Höhe.
- **Zuständigkeit:** M → domain/height-binding
- **Altzuordnung:** Gespräch Geschosse/Höhen
- **Abnahme/Abhängigkeiten:** N21, fester vs gebundener Modus, atomare Prüfung abhängiger Öffnungen. Ältere Schema-/Statusannahmen daraus gelten nur historisch; Masterplan und aktueller Code prüfen.
- **Quelle:** FUNKTIONEN-Transkript 08.10., Funktionsarchitektur/Abgleich 03.10.; neuere Präzisierungen im Masterplan.


### N23 – Deutsch als erste Programmsprache

- **Stand:** Teilweise: deutsche Befehle/Teile der UI, vollständige deutsche Bedienung noch prüfen.
- **Zuständigkeit:** UI, A → gemeinsame Texte/Units-Adapter
- **Altzuordnung:** Gespräch deutsche Bedienung; neu explizit
- **Abnahme/Abhängigkeiten:** Lokalisierung aller UI-/Fehlermeldungen; nicht mit TypeScript als Programmiersprache verwechseln. Ältere Schema-/Statusannahmen daraus gelten nur historisch; Masterplan und aktueller Code prüfen.
- **Quelle:** FUNKTIONEN-Transkript 08.10., Funktionsarchitektur/Abgleich 03.10.; neuere Präzisierungen im Masterplan.


### N24 – Modelllängen in Metern

- **Stand:** Vorhanden: Modellmeter, endliche Zahlen und Einheitenparser; Papier-UI explizit mm.
- **Zuständigkeit:** M, A, LineControls → Units
- **Altzuordnung:** Stage 1; Guide-F10/F12
- **Abnahme/Abhängigkeiten:** Alle neuen Eingaben/Importe normieren; Stift-mm/Papiermaße bleiben Darstellungseinheiten. Ältere Schema-/Statusannahmen daraus gelten nur historisch; Masterplan und aktueller Code prüfen.
- **Quelle:** FUNKTIONEN-Transkript 08.10., Funktionsarchitektur/Abgleich 03.10.; neuere Präzisierungen im Masterplan.


### N25 – Ausschließlich 2D-Elemente und importierte PDF-Dateien proportional per Messlinie skalieren

- **Stand:** Teilweise: PNG/JPEG-Zweipunktkalibrierung vorhanden; PDF und allgemeine Scale2D-Aktion offen. BIM verboten.
- **Zuständigkeit:** Ziel application/Scale2DSelection, interop/pdf
- **Altzuordnung:** Guide-F11/F12/F13, neue Einschränkung
- **Abnahme/Abhängigkeiten:** N16/N08, echte 2D-/PDF-Typen; Application-Guard vor Vorschau/Commit, BIM auch im Grundriss verbieten. Ältere Schema-/Statusannahmen daraus gelten nur historisch; Masterplan und aktueller Code prüfen.
- **Quelle:** FUNKTIONEN-Transkript 08.10., Funktionsarchitektur/Abgleich 03.10.; neuere Präzisierungen im Masterplan.


### N26 – Boolesche Operationen für komplexe 3D-Modelle

- **Stand:** Geplant: allgemeiner Solid-/Boolean-Kern; bestehende Wandextrusion ist kein solcher Kernel.
- **Zuständigkeit:** Ziel geometry/solids, domain/features
- **Altzuordnung:** Neu
- **Abnahme/Abhängigkeiten:** Separater Machbarkeitsnachweis, Toleranzen, N27, abgeleitete Meshes nicht autoritativ. Ältere Schema-/Statusannahmen daraus gelten nur historisch; Masterplan und aktueller Code prüfen.
- **Quelle:** FUNKTIONEN-Transkript 08.10., Funktionsarchitektur/Abgleich 03.10.; neuere Präzisierungen im Masterplan.


### N27 – Wände schneiden und aussparen

- **Stand:** Teilweise: echte rechteckige Fensteröffnungen; freie Wandcuts/Abhängigkeiten fehlen.
- **Zuständigkeit:** M, Vw/geometry → domain/cut-features
- **Altzuordnung:** Gespräch Öffnungen
- **Abnahme/Abhängigkeiten:** N26 für freie Körperoperationen; Host-Abhängigkeit, Invalidierung, IFC. Ältere Schema-/Statusannahmen daraus gelten nur historisch; Masterplan und aktueller Code prüfen.
- **Quelle:** FUNKTIONEN-Transkript 08.10., Funktionsarchitektur/Abgleich 03.10.; neuere Präzisierungen im Masterplan.


### N28 – Hochgeladene PDFs in 2D-Elemente zerlegen

- **Stand:** Geplant: PDF-Seitenimport und Vektorzerlegung; PNG/JPEG ist kein PDF-Import.
- **Zuständigkeit:** Ziel interop/pdf, domain/references, application/import
- **Altzuordnung:** Guide-F11 (Import), Zerlegung neu
- **Abnahme/Abhängigkeiten:** Vektor/Raster unterscheiden, N25, Assets/Einheiten/Importbericht, keine automatische BIM-Erkennung behaupten. Ältere Schema-/Statusannahmen daraus gelten nur historisch; Masterplan und aktueller Code prüfen.
- **Quelle:** FUNKTIONEN-Transkript 08.10., Funktionsarchitektur/Abgleich 03.10.; neuere Präzisierungen im Masterplan.


### N29 – Modell im Grundriss, Schnitt, Ansicht und 3D bearbeiten

- **Stand:** Teilweise: gleiches Modell in 2D/3D und begrenzte Wandbearbeitung z=0; Schnitt/Ansicht noch fehlt.
- **Zuständigkeit:** E, Vw, A → application/view-context
- **Altzuordnung:** Architekturvertrag; Gespräch
- **Abnahme/Abhängigkeiten:** N05/N07, Treffer→stabile IDs/zulässige Features, gemeinsame Aktionen. Ältere Schema-/Statusannahmen daraus gelten nur historisch; Masterplan und aktueller Code prüfen.
- **Quelle:** FUNKTIONEN-Transkript 08.10., Funktionsarchitektur/Abgleich 03.10.; neuere Präzisierungen im Masterplan.


### N30 – Wände/Fenster verschieben und Elemente löschen

- **Stand:** Teilweise: bestehende Verschiebeaktionen; allgemeine geprüfte Lösch-/Abhängigkeitsaktionen offen.
- **Zuständigkeit:** E, M → application/delete
- **Altzuordnung:** Guide-F07; Gespräch
- **Abnahme/Abhängigkeiten:** N10; Löschregeln für Hosts/Öffnungen/Annotationen, atomare History. Ältere Schema-/Statusannahmen daraus gelten nur historisch; Masterplan und aktueller Code prüfen.
- **Quelle:** FUNKTIONEN-Transkript 08.10., Funktionsarchitektur/Abgleich 03.10.; neuere Präzisierungen im Masterplan.


### N31 – Räume in geschlossenen oder teiloffenen Wandbereichen

- **Stand:** Geplant: Raummodell, virtuelle Grenzen und Zuordnung; Live-Flächenmessung ersetzt es nicht.
- **Zuständigkeit:** Ziel domain/room, geometry/polygon, application
- **Altzuordnung:** Guide-F18
- **Abnahme/Abhängigkeiten:** N16/N39, manuelle geschlossene/virtuelle Grenzen; später N44 für Ableitung. Ältere Schema-/Statusannahmen daraus gelten nur historisch; Masterplan und aktueller Code prüfen.
- **Quelle:** FUNKTIONEN-Transkript 08.10., Funktionsarchitektur/Abgleich 03.10.; neuere Präzisierungen im Masterplan.


### N32 – Raumname, Kennung ab R-001 und Fläche

- **Stand:** Geplant: Raumname/Nummer R-001/Fläche; stabile interne ID getrennt von Nutzernummer.
- **Zuständigkeit:** Ziel domain/room, application/area
- **Altzuordnung:** Guide-F19
- **Abnahme/Abhängigkeiten:** N31; stabile interne ID getrennt von R-001, Nummerierungsbereich festlegen. Ältere Schema-/Statusannahmen daraus gelten nur historisch; Masterplan und aktueller Code prüfen.
- **Quelle:** FUNKTIONEN-Transkript 08.10., Funktionsarchitektur/Abgleich 03.10.; neuere Präzisierungen im Masterplan.


### N33 – Lichte Raumhöhen und konfigurierbare Höhenlinien

- **Stand:** Geplant: lichte Höhenverteilung und Höhenlinien aus Quellen; zwei Punkte ersetzen kein Höhenfeld.
- **Zuständigkeit:** Ziel geometry/height-query, domain/room
- **Altzuordnung:** Guide-F20/F22
- **Abnahme/Abhängigkeiten:** N31/N34, definierte obere/untere Flächen; zwei Messpunkte sind kein Höhenfeld. Ältere Schema-/Statusannahmen daraus gelten nur historisch; Masterplan und aktueller Code prüfen.
- **Quelle:** FUNKTIONEN-Transkript 08.10., Funktionsarchitektur/Abgleich 03.10.; neuere Präzisierungen im Masterplan.


### N34 – Messbezug Fußbodenoberkante und Dachunterkante

- **Stand:** Geplant: FFB-/Dachunterkantenbezüge, sichtbare ungelöste Quellen.
- **Zuständigkeit:** Ziel domain/height-sources
- **Altzuordnung:** Guide-F21
- **Abnahme/Abhängigkeiten:** N21/N47 und Dach oder explizite manuelle Flächen; fehlende Quelle sichtbar melden. Ältere Schema-/Statusannahmen daraus gelten nur historisch; Masterplan und aktueller Code prüfen.
- **Quelle:** FUNKTIONEN-Transkript 08.10., Funktionsarchitektur/Abgleich 03.10.; neuere Präzisierungen im Masterplan.


### N35 – Wohnfläche mit Nischen, Schornstein- und Vorwandabzügen

- **Stand:** Geplant: versionierter WoFlV-Regelservice, Abzüge/Korrekturen, unabhängige Fachprüfung.
- **Zuständigkeit:** Ziel application/area-rules, domain/corrections
- **Altzuordnung:** Guide-F01/F02/F22
- **Abnahme/Abhängigkeiten:** N31–N34; amtliche WoFlV erst vor Umsetzung prüfen, Korrekturen/Rundung versionieren. Ältere Schema-/Statusannahmen daraus gelten nur historisch; Masterplan und aktueller Code prüfen.
- **Quelle:** FUNKTIONEN-Transkript 08.10., Funktionsarchitektur/Abgleich 03.10.; neuere Präzisierungen im Masterplan.


### N36 – Berichtsvorlage und PDF mit nachvollziehbarem Rechenweg

- **Stand:** Geplant: Wohnflächen-PDF mit Rechenweg; IFC ist kein Bericht.
- **Zuständigkeit:** Ziel interop/reports/pdf
- **Altzuordnung:** Guide-F03
- **Abnahme/Abhängigkeiten:** N35/N37, unabhängige Berichtsdaten ohne zweite Berechnung, Renderprüfung. Ältere Schema-/Statusannahmen daraus gelten nur historisch; Masterplan und aktueller Code prüfen.
- **Quelle:** FUNKTIONEN-Transkript 08.10., Funktionsarchitektur/Abgleich 03.10.; neuere Präzisierungen im Masterplan.


### N37 – Geschossanzahl, Raumzahl, Name und Adresse im Bericht

- **Stand:** Geplant: Berichtskopf/Adresse und aus Scope abgeleitete Zählungen.
- **Zuständigkeit:** M → domain/project-metadata, application/report-scope
- **Altzuordnung:** Guide-F04
- **Abnahme/Abhängigkeiten:** N21/N32/N36; Zählungen aus gewähltem Umfang. Ältere Schema-/Statusannahmen daraus gelten nur historisch; Masterplan und aktueller Code prüfen.
- **Quelle:** FUNKTIONEN-Transkript 08.10., Funktionsarchitektur/Abgleich 03.10.; neuere Präzisierungen im Masterplan.


### N38 – Räume standardmäßig auf Ebene Raum

- **Stand:** Geplant: Standard-Raumebene passend zur ersten Raumimplementation; vorhandene Ebenen nicht ersetzen.
- **Zuständigkeit:** Ziel domain/layers, room defaults
- **Altzuordnung:** Guide-F25/F26 erweitert
- **Abnahme/Abhängigkeiten:** N16/N31; bisherige zwölf Guide-Ebenen nicht ersetzen. Ältere Schema-/Statusannahmen daraus gelten nur historisch; Masterplan und aktueller Code prüfen.
- **Quelle:** FUNKTIONEN-Transkript 08.10., Funktionsarchitektur/Abgleich 03.10.; neuere Präzisierungen im Masterplan.


### N39 – Rechtecke/Polygone für Gestaltung und Schraffur

- **Stand:** Teilweise: validierte 2D-Schraffurkonturen und vier Erstellungsmodi; allgemeine Aussparungen separat.
- **Zuständigkeit:** M/lines → domain/drawing-polygon/hatch
- **Altzuordnung:** Guide-F15/F16/F23
- **Abnahme/Abhängigkeiten:** N16, Polygonvalidierung/Aussparungen, Annotation-Scope. Ältere Schema-/Statusannahmen daraus gelten nur historisch; Masterplan und aktueller Code prüfen.
- **Quelle:** FUNKTIONEN-Transkript 08.10., Funktionsarchitektur/Abgleich 03.10.; neuere Präzisierungen im Masterplan.


### N40 – Optionale Farbe/Kontur, Deckkraft, Muster wie Mauerwerk

- **Stand:** Vorhanden: Fill/Hintergrund/Kontur/Farbe/Deckkraft/Muster im aktuellen Schraffurumfang.
- **Zuständigkeit:** UI/LineControls, Vw → rendering/appearance
- **Altzuordnung:** Guide-F17/F23/F24
- **Abnahme/Abhängigkeiten:** N39, Papier-/Modellgrößen der Muster und Stil-Scope. Ältere Schema-/Statusannahmen daraus gelten nur historisch; Masterplan und aktueller Code prüfen.
- **Quelle:** FUNKTIONEN-Transkript 08.10., Funktionsarchitektur/Abgleich 03.10.; neuere Präzisierungen im Masterplan.


### N41 – Wanddicke und geschossabhängige oder alternative Höhe

- **Stand:** Teilweise: feste Wandhöhe/-stärke und Körperoffset; Geschosshöhenbindung fehlt.
- **Zuständigkeit:** M, BimInspector → domain/wall/height-binding
- **Altzuordnung:** Stage 1; Gespräch
- **Abnahme/Abhängigkeiten:** N21/N22; Moduswechsel und Öffnungen atomar validieren. Ältere Schema-/Statusannahmen daraus gelten nur historisch; Masterplan und aktueller Code prüfen.
- **Quelle:** FUNKTIONEN-Transkript 08.10., Funktionsarchitektur/Abgleich 03.10.; neuere Präzisierungen im Masterplan.


### N42 – Monolithische oder mehrschichtige Wand, eigene Schichten

- **Stand:** Geplant: Assembly-Schichten/Materialaufbau und unabhängige Organisations-Layer.
- **Zuständigkeit:** Ziel domain/assembly/materials
- **Altzuordnung:** Neu
- **Abnahme/Abhängigkeiten:** N41/N45; AssemblyLayer getrennt von Layer; Summe statt widersprüchlicher Dicken. Ältere Schema-/Statusannahmen daraus gelten nur historisch; Masterplan und aktueller Code prüfen.
- **Quelle:** FUNKTIONEN-Transkript 08.10., Funktionsarchitektur/Abgleich 03.10.; neuere Präzisierungen im Masterplan.


### N43 – Einzelwand oder fortlaufende Wände mit Doppelklickabschluss

- **Stand:** Vorhanden im unterstützten Umfang: Wandkette mit Abschluss und einem Undo; ungültige Fortsetzung ablehnen.
- **Zuständigkeit:** UI/CadWorkspace → application/wall-tool
- **Altzuordnung:** C04 erweitert; Gespräch Wandzeichnen
- **Abnahme/Abhängigkeiten:** N08/N44; Undo pro Segment oder Kette offen, Abbruch/Nullsegmente definieren. Ältere Schema-/Statusannahmen daraus gelten nur historisch; Masterplan und aktueller Code prüfen.
- **Quelle:** FUNKTIONEN-Transkript 08.10., Funktionsarchitektur/Abgleich 03.10.; neuere Präzisierungen im Masterplan.


### N44 – Saubere Wandanschlüsse an Ecken und T-Verbindungen

- **Stand:** Teilweise: persistente schräge Ecken/T/gewisse Kombinationen; ungleiche Querschnitte/allgemeine Netze offen.
- **Zuständigkeit:** Ziel domain/wall-joins, geometry
- **Altzuordnung:** Gespräch Wandanschlüsse
- **Abnahme/Abhängigkeiten:** N45 umgesetzt; Eckgriff korrigiert; explizites Verbinden, automatisches Lösen bei Einzelwandbewegung; N42/Endzonen offen. Ältere Schema-/Statusannahmen daraus gelten nur historisch; Masterplan und aktueller Code prüfen.
- **Quelle:** FUNKTIONEN-Transkript 08.10., Funktionsarchitektur/Abgleich 03.10.; neuere Präzisierungen im Masterplan.


### N45 – Verschiebbare Hauptachse im Wandaufbau

- **Stand:** Vorhanden im definierten Umfang: fixe Zeichenachse, Körperoffset, 2D/3D-Achsanzeige; Legacykonversion separat.
- **Zuständigkeit:** M, E → domain/wall-reference
- **Altzuordnung:** Neu
- **Abnahme/Abhängigkeiten:** Nutzerentscheidung physische Lage vs Zeichenachse; N42, Fenster-/Join-Abhängigkeiten. Ältere Schema-/Statusannahmen daraus gelten nur historisch; Masterplan und aktueller Code prüfen.
- **Quelle:** FUNKTIONEN-Transkript 08.10., Funktionsarchitektur/Abgleich 03.10.; neuere Präzisierungen im Masterplan.


### N46 – Wände, Fenster und andere Elemente bemaßen, Maßketten

- **Stand:** Geplant: gespeicherte assoziative Bemaßung mit Featurebezügen, Scope und Modell/Papiergröße.
- **Zuständigkeit:** Vw → domain/dimensions, application
- **Altzuordnung:** Neu; Guide-F25 Ebene Bemaßung
- **Abnahme/Abhängigkeiten:** N16, stabile Feature-Referenzen, Annotation-Scope, ungültige Referenzen. Ältere Schema-/Statusannahmen daraus gelten nur historisch; Masterplan und aktueller Code prüfen.
- **Quelle:** FUNKTIONEN-Transkript 08.10., Funktionsarchitektur/Abgleich 03.10.; neuere Präzisierungen im Masterplan.


### N47 – Decken mit Schichten, Material, Darstellung, Höhe/Stärke

- **Stand:** Geplant: Deckenmodell, Aufbau/Höhe/Stärke und gemeinsame Ansichten/IFC.
- **Zuständigkeit:** Ziel domain/slab/assembly, geometry
- **Altzuordnung:** Gespräch Geschosse/Decken
- **Abnahme/Abhängigkeiten:** N16/N21/N22/N39/N42; Stärke/Höhenlage, 2D/3D/IFC. Ältere Schema-/Statusannahmen daraus gelten nur historisch; Masterplan und aktueller Code prüfen.
- **Quelle:** FUNKTIONEN-Transkript 08.10., Funktionsarchitektur/Abgleich 03.10.; neuere Präzisierungen im Masterplan.


### N48 – Deckendurchbrüche einfügen

- **Stand:** Geplant: geprüfte Deckendurchbrüche am Host, nach N47.
- **Zuständigkeit:** Ziel domain/openings, application
- **Altzuordnung:** Neu
- **Abnahme/Abhängigkeiten:** N47, gültiges Öffnungsprofil/Host, Rand-/Überschneidungsregeln. Ältere Schema-/Statusannahmen daraus gelten nur historisch; Masterplan und aktueller Code prüfen.
- **Quelle:** FUNKTIONEN-Transkript 08.10., Funktionsarchitektur/Abgleich 03.10.; neuere Präzisierungen im Masterplan.


### N49 – Text mit Hochstellung, Farbe, Größe, Schrift und Hervorhebung

- **Stand:** Geplant: gespeichertes Textwerkzeug mit Formatierung und Modell-/Papiergröße.
- **Zuständigkeit:** Ziel domain/annotations, rendering/text
- **Altzuordnung:** Neu
- **Abnahme/Abhängigkeiten:** N16; Annotation-Scope, Font/Einheiten/Export, eigene Aktion plus AI-Vertrag. Ältere Schema-/Statusannahmen daraus gelten nur historisch; Masterplan und aktueller Code prüfen.
- **Quelle:** FUNKTIONEN-Transkript 08.10., Funktionsarchitektur/Abgleich 03.10.; neuere Präzisierungen im Masterplan.


### N50 – Text mit farbiger Umrandung und Hintergrund

- **Stand:** Geplant: Textumrandung/Hintergrund im passenden Annotationsscope.
- **Zuständigkeit:** Ziel domain/text-style, rendering
- **Altzuordnung:** Neu
- **Abnahme/Abhängigkeiten:** N49, Scope und Farbe/Deckkraft, keine BIM-Geometrie. Ältere Schema-/Statusannahmen daraus gelten nur historisch; Masterplan und aktueller Code prüfen.
- **Quelle:** FUNKTIONEN-Transkript 08.10., Funktionsarchitektur/Abgleich 03.10.; neuere Präzisierungen im Masterplan.


### N51 – Elemente nach Typ oder Eigenschaften filtern

- **Stand:** Geplant: strukturierte Typ-/Eigenschaftsfilter; Ebenensichtbarkeit ist eine andere Funktion.
- **Zuständigkeit:** Ziel application/query-selection
- **Altzuordnung:** Neu
- **Abnahme/Abhängigkeiten:** N16/N17 und zentrale Capabilities; sichtbare/gefilterte Ziele eindeutig. Ältere Schema-/Statusannahmen daraus gelten nur historisch; Masterplan und aktueller Code prüfen.
- **Quelle:** FUNKTIONEN-Transkript 08.10., Funktionsarchitektur/Abgleich 03.10.; neuere Präzisierungen im Masterplan.


### N52 – Pipette für Farbauswahl im Filter

- **Stand:** Geplant: Pipette/Filterfarbe; gespeicherte und dargestellte Farbe unterscheiden.
- **Zuständigkeit:** Ziel UI/pipette → application/query
- **Altzuordnung:** Neu
- **Abnahme/Abhängigkeiten:** N51/N03; gespeicherte vs dargestellte Farbe vor Umsetzung unterscheiden. Ältere Schema-/Statusannahmen daraus gelten nur historisch; Masterplan und aktueller Code prüfen.
- **Quelle:** FUNKTIONEN-Transkript 08.10., Funktionsarchitektur/Abgleich 03.10.; neuere Präzisierungen im Masterplan.


### N53 – Eine Eigenschaftenleiste für Werkzeugvorgaben und Auswahl

- **Stand:** Teilweise: obere gemeinsame Eigenschaften, Tooldefaults und Pickup; umfassende Capability-UI für neue Typen offen.
- **Zuständigkeit:** UI/BimInspector/LineControls → schema-/capability-UI
- **Altzuordnung:** Guide-F08/F16/F17; C03
- **Abnahme/Abhängigkeiten:** Neue geprüfte Aktionen/Typen, keine zweiten Modellparameter in UI. Ältere Schema-/Statusannahmen daraus gelten nur historisch; Masterplan und aktueller Code prüfen.
- **Quelle:** FUNKTIONEN-Transkript 08.10., Funktionsarchitektur/Abgleich 03.10.; neuere Präzisierungen im Masterplan.


### N54 – E bewegen, Strg+E kopieren/bewegen, D drehen, Strg+D drehen

- **Stand:** Geplant/zu konkretisieren: E/Strg+E/D/Strg+D; D-Bedeutung nicht erfinden, Ctrl/Command und Eingabefokus beachten.
- **Zuständigkeit:** UI-Keyhandler → application/shortcuts
- **Altzuordnung:** Neu
- **Abnahme/Abhängigkeiten:** N10, Kopier-/Rotationsaktionen; D/Strg+D offen, Texteingaben/Browserkonflikte abfangen. Ältere Schema-/Statusannahmen daraus gelten nur historisch; Masterplan und aktueller Code prüfen.
- **Quelle:** FUNKTIONEN-Transkript 08.10., Funktionsarchitektur/Abgleich 03.10.; neuere Präzisierungen im Masterplan.


### N55 – Rotation mit Kreis als Fang-/Bedienhilfe

- **Stand:** Geplant: RotateSession/Pivot/Rotationshilfe und gemeinsame geprüfte Rotation.
- **Zuständigkeit:** Ziel application/rotate, S, rendering/overlay
- **Altzuordnung:** Neu
- **Abnahme/Abhängigkeiten:** N54, Pivot/Feature-Kontext, echte Rotation über gemeinsame Aktion. Ältere Schema-/Statusannahmen daraus gelten nur historisch; Masterplan und aktueller Code prüfen.
- **Quelle:** FUNKTIONEN-Transkript 08.10., Funktionsarchitektur/Abgleich 03.10.; neuere Präzisierungen im Masterplan.


### N56 – Navigator für Geschosse, Schnitte, Ansichten und 3D

- **Stand:** Teilweise vorhanden: Gebäudestruktur/Abbilder-Tabs und Ordner mit PR238 in main. Folgebranch feat/document-context-management ergänzt Rechtsklick-Ordnerzuordnung und Abbildlöschung, neben Umbenennen und Doppelklick-Öffnen. 809 Tests und Browserabnahme einschließlich Undo/Redo bestanden. PR240 ist zusammengeführt. Ergänzung feat/document-settings-menu: Rechtsklick auch im leeren Verzeichnis für neues Abbild/neuen Ordner; Abbildeinstellungen als atomare Aktion (Name, Maßstab, Ordner), leere Ordner löschbar. 811 Tests und Browserprüfung bestanden. Nichtleere Ordner löschen: Nutzerentscheidung noch ausstehend, vorerst geschützt. Drag-and-drop-Ergänzung in PR241: Abbilder auf Ordner ziehen; Ziel wird hervorgehoben und nach Ablage geöffnet. Dieselbe assign-folder-Aktion mit ursprünglichem Projektkontext, ein Undo-Schritt; Abbruch und gleicher Zielordner erzeugen keine Änderung. Browsernachweis Quelle → Ziel → Undo → Quelle → Redo erfolgreich. 14 fokussierte Abbildtests, Typecheck, Lint und Build bestanden.
- **Zuständigkeit:** UI/ProjectNavigator → ModelView/Storey-Verweise
- **Altzuordnung:** Gespräch Navigator
- **Abnahme/Abhängigkeiten:** N21/N05; benannte 3D-Views, keine Inhaltskopien. Ältere Schema-/Statusannahmen daraus gelten nur historisch; Masterplan und aktueller Code prüfen.
- **Quelle:** FUNKTIONEN-Transkript 08.10., Funktionsarchitektur/Abgleich 03.10.; neuere Präzisierungen im Masterplan.


### N57 – Aktualisierbare Abbilder mit eigener Ebenendarstellung

- **Stand:** Teilweise vorhanden in main seit PR238: modellgebundene Grundriss-Abbilder mit eigenem Maßstab/Filter und Startzoom, gesamtes Modell erreichbar. Anlage/Löschung/Ordnerzuordnung verwenden normales Projekt-Undo; Sichtbarkeit den gemeinsamen Ebenenumschalter mit kontextbezogener History. Schema20 und Migrationen erhalten Modell und Zeichnungen. Weitere Ansichtsarten bleiben offen.
- **Zuständigkeit:** Ziel domain/DrawingDocument, application
- **Altzuordnung:** Neu
- **Abnahme/Abhängigkeiten:** N05/N16/N17; Quelle ModelView-ID, Overrides/Invalidierung/Migration. Ältere Schema-/Statusannahmen daraus gelten nur historisch; Masterplan und aktueller Code prüfen.
- **Quelle:** FUNKTIONEN-Transkript 08.10., Funktionsarchitektur/Abgleich 03.10.; neuere Präzisierungen im Masterplan.


### N58 – Ausschnitte und zusätzliche Gestaltung/Text in Abbildern

- **Stand:** Teilweise vorhanden: Startansicht/Zoom in PR238, ohne Modellbeschnitt. Nutzerkorrektur 10.10.2026: Linien und Schraffuren aus Abbildern gehören zur gemeinsamen Geschosszeichnung. Zuschnitt erst im Layoutbuch; Texte und weitere Annotationstypen bleiben geplant.
- **Zuständigkeit:** Ziel DrawingDocument, Annotation-Scope
- **Altzuordnung:** Guide-F23/F24 ergänzt; Texte neu
- **Abnahme/Abhängigkeiten:** N57/N39/N49; Dokumentaktionen getrennt von Modellaktionen. Ältere Schema-/Statusannahmen daraus gelten nur historisch; Masterplan und aktueller Code prüfen.
- **Quelle:** FUNKTIONEN-Transkript 08.10., Funktionsarchitektur/Abgleich 03.10.; neuere Präzisierungen im Masterplan.


### N59 – Abbilder in Master-/Exportlayouts mit A4/A3/A2 und Plankopf

- **Stand:** Geplant: Papierlayout/Master/Plankopf, Formate A4/A3/A2 etc., Placement und Export.
- **Zuständigkeit:** Ziel domain/layout, application, interop/pdf
- **Altzuordnung:** Neu; Guide-F03 betrifft anderen Bericht
- **Abnahme/Abhängigkeiten:** N57/N58/N04; A4/A3/A2, Placement/Einheiten, Template-Abhängigkeiten. Ältere Schema-/Statusannahmen daraus gelten nur historisch; Masterplan und aktueller Code prüfen.
- **Quelle:** FUNKTIONEN-Transkript 08.10., Funktionsarchitektur/Abgleich 03.10.; neuere Präzisierungen im Masterplan.


### N60 – Bildschirm teilen, Fenster aktivieren und Inhalt zuweisen

- **Stand:** Teilweise: Bildschirmaufteilung/Arbeitskontext mit unabhängigen Kameras; Dokumentbinding im offenen PR238.
- **Zuständigkeit:** UI/CadViewport, cad-types → application/ViewportBinding
- **Altzuordnung:** Gespräch Mehrfachansichten
- **Abnahme/Abhängigkeiten:** N56–N59; aktives Fenster, Kamera pro Pane, gemeinsame Auswahl, keine Projektkopie. Ältere Schema-/Statusannahmen daraus gelten nur historisch; Masterplan und aktueller Code prüfen.
- **Quelle:** FUNKTIONEN-Transkript 08.10., Funktionsarchitektur/Abgleich 03.10.; neuere Präzisierungen im Masterplan.


## 2. Guide-F01–F29 – Kennungen erhalten

Ein Mapping ist keine Fertigmeldung. Status/Abnahme folgen den referenzierten N-Anforderungen.

| Kennung | Ursprünglicher Wunsch | Weitergeführt unter |
| --- | --- | --- |
| Guide-F01 | Automatische Wohnflächenberechnung und sichtbarer Rechenweg | N35 |
| Guide-F02 | Türnischen, Schornsteinabzüge und Vorbauwände berücksichtigen | N35 |
| Guide-F03 | Wohnflächenbericht nach Vorlage als PDF | N36 |
| Guide-F04 | Name, Adresse, Geschossanzahl und Raumzahl im Bericht | N37 |
| Guide-F05 | On-Demand-Menü nahe Cursor, verschiebbar, bleibt bei Auswahl | N09 |
| Guide-F06 | Gewählten Punkt verschieben | N11 |
| Guide-F07 | Bewegen | N10/N30 |
| Guide-F08 | Info anzeigen | N09/N53 |
| Guide-F09 | Strecken einer gewählten Seite | N13 |
| Guide-F10 | Maßstableiste unter Canvas mit Änderungsmöglichkeit | N04/N15/MS |
| Guide-F11 | Skalierwerkzeug für importierte Zeichnung mit zwei Messpunkten | N25/N28 |
| Guide-F12 | Neue Länge per Menü oder AI-Sprachbefehl | N18/N25 |
| Guide-F13 | Gesamte ausgewählte Referenz anhand der Messstrecke skalieren | N25 |
| Guide-F14 | Grid sowie Snap und Hilfslinien aus dem Gespräch | N07/N08 |
| Guide-F15 | 2D-Linienwerkzeug Punkt zu Punkt, kein Erstellen in 3D | N12/N39 |
| Guide-F16 | Voreinstellung Linie oder Polylinie | N12/N53 |
| Guide-F17 | Farbpalette, Strichstärke und Stricharten | N03/N40/N53 |
| Guide-F18 | Räume in geschlossenen oder teilweise umschlossenen Wänden | N31 |
| Guide-F19 | Raumkennung ab R-001, Name und Fläche | N32 |
| Guide-F20 | Lichte Raumhöhen erkennen und Höhenlinien konfigurieren | N33 |
| Guide-F21 | Unteren und oberen Messbezug wählen | N34 |
| Guide-F22 | Höheninformationen in Wohnflächenberechnung verwenden | N33/N35 |
| Guide-F23 | Schraffur mit optionaler Füllung und Kontur | N39/N40/N58 |
| Guide-F24 | Wählbare Farbe und Deckkraft oder Muster wie Mauerwerk | N40 |
| Guide-F25 | Alle genannten Standardebenen | N16/N38 |
| Guide-F26 | Außenwand als Standard für Wände, 2D-Zeichnungen für 2D | N16 |
| Guide-F27 | Elemente frei zuordnen, Ebenen erstellen und bearbeiten | N16 |
| Guide-F28 | Organisation > Ebenen als eigenes Fenster | N16/N17 |
| Guide-F29 | Ebenenumschalter in Menüleiste, ein- und ausblenden | N17 |

## 3. AI01–AI35 – Hauptvision und Ausbaukatalog

**Stand:** Zukunftsanforderungen; vorhandene begrenzte Text-/Sprachactions sind kein Nachweis generativen Designs. A03/A11 des Masterplans sind ab sofort bindend. Die folgende Tabelle erhält jede einzelne Kennung.


| ID | Funktion | Erwarteter Inhalt |
| --- | --- | --- |
| AI01 | Intent-based CAD | Entwurfsabsicht in Raumprogramm, Randbedingungen und überprüfbare BIM-Varianten übersetzen. |
| AI02 | AI Design Agent | Varianten analysieren, Fachwerkzeuge nutzen und begründete Verbesserungen vorschlagen. |
| AI03 | Conversational BIM | Modellabfragen und Änderungen durch Text und Sprache mit eindeutiger BIM-Semantik. |
| AI04 | AI Command Layer | Kontrollierte, validierte CAD-Befehle über die gemeinsamen Application-Aktionen bereitstellen. |
| AI05 | Generatives Gebäudedesign | Entwurfsvarianten unter Grundstücks-, Raum-, Budget- und Fachbedingungen vergleichen. |
| AI06 | AI Space Planning | Räume, Erschließung und Nutzungen anhand von Größen und Nachbarschaften anordnen. |
| AI07 | Echtzeit-Regelprüfung | Projektbezogene Regelprobleme markieren und geprüfte Änderungsvorschläge anbieten. |
| AI08 | Building Code Copilot | Vorschrift, Fundstelle, Geltungsbereich, betroffene Bauteile und Lösungsvorschlag verbinden. |
| AI09 | Scan / Bild / PDF → BIM | Quellen in editierbare BIM-Elemente übersetzen und Genauigkeit sowie unbekannte Eigenschaften ausweisen. |
| AI10 | Sketch-to-BIM | Handskizzen in einen ersten editierbaren Grundriss übertragen; Maßstab und Unsicherheiten klären. |
| AI11 | AI-Objektgenerator | Parametrische, klassifizierte BIM-Objekte mit belegbaren Eigenschaften erzeugen. |
| AI12 | Semantic Materials | Materialdaten einschließlich Technik, Kosten und Umweltwirkung mit nachvollziehbarer Herkunft verknüpfen. |
| AI13 | AI Facade Generator | Parametrische Fassadenvarianten erzeugen und technische Ziele prüfen. |
| AI14 | Environmental Simulation | Interaktive Näherungen und validierte Fachsimulationen für Umwelt- und Energiefragen unterscheiden. |
| AI15 | AI Cost Designer | Modellmengen mit Preisquellen und Unsicherheiten verbinden; Einsparvarianten vorschlagen. |
| AI16 | Explain my building | Modellbezogene Erklärungen auf Bauteile, Mengen und Analyseergebnisse zurückführen. |
| AI17 | Architecture Knowledge Graph | Stabile Beziehungen zwischen Räumen, Bauteilen, Materialien, Anforderungen und Analysen zugänglich machen. |
| AI18 | Branching wie Git | Semantische Modellvarianten vergleichen; Zusammenführung und Konflikte fachlich regeln. |
| AI19 | Change Impact Analysis | Auswirkungen einer vorgeschlagenen Änderung auf abhängige Bereiche vorab darstellen. |
| AI20 | Autonomous Documentation | Modellbasierte Pläne, Listen, Raumbücher und Exporte nach Vorlagen vorbereiten. |
| AI21 | Drawing QA Agent | Modell und tatsächlich ausgegebene Pläne auf Vollständigkeit und Widersprüche prüfen. |
| AI22 | Coordination Agent | Geometrische und funktionale Konflikte zwischen Fachmodellen nachvollziehbar melden. |
| AI23 | Natural-Language BIM Query | Sprachliche Fragen in strukturierte Abfragen mit IDs, Einheiten und Modellrevision übersetzen. |
| AI24 | Spatial AI | Räumliche Nutzbarkeit, Bewegungsflächen und Wartbarkeit mit geeigneten Prüfungen beurteilen. |
| AI25 | Design Critic | Entwürfe anhand offener Kriterien und Gewichtungen aus mehreren Perspektiven bewerten. |
| AI26 | Multimodale Eingabe | Text, Sprache, Skizzen, Bilder und markierte Modellbereiche eindeutig mit Kontext verbinden. |
| AI27 | AI Rendering im Modell | Visualisierungsvarianten erzeugen und die geforderte Geometrie-/Kameratreue prüfen. |
| AI28 | Open BIM / offene Schnittstellen | Austauschprofile, APIs und Formate bedarfsgerecht integrieren und testen. |
| AI29 | Cloud-native / Local-first | Betriebsformen, Offline-Verhalten, Synchronisation und projektbezogene Rechte definieren. |
| AI30 | Performance-Anforderungen | Laufzeit, Reaktion und große Modelle auf definierter Referenzhardware messen. |
| AI31 | Non-destructive AI | Änderungen als Vorschau und Diff mit Annahme, Anpassung, Ablehnung und vollständiger Rücknahme. |
| AI32 | AI Confidence | Gesicherte, unsichere und nicht prüfbare Ergebnisse unterscheiden; keine erfundenen Konfidenzwerte. |
| AI33 | AI Provenance | Quellen, Regelwerksstand, Modellrevision, Annahmen, Zeitpunkt und verwendetes Modell dokumentieren. |
| AI34 | Spezialisierte Agents | Aufgaben bei belegtem Nutzen verteilen und eindeutige Schreibzuständigkeiten erhalten. |
| AI35 | Design Goal Memory | Freigegebene Entwurfsziele versionieren und bei Änderungen auf Widersprüche prüfen. |



### Architekturvorgaben für spätere Umsetzung

- AI interpretiert Absichten und verwendet definierte Werkzeuge. Geometriekernel, BIM-Regeln und Fachengines berechnen und validieren Ergebnisse.
- Alle Modelländerungen laufen über dieselben Application-Aktionen wie Maus, Eigenschaften und präzise Eingabe. Keine separate AI-Modellhaltung oder direkte UI-/Mesh-Mutation.
- Ziel-IDs, Einheiten, Projekt-/Auswahlkontext und erwartete Modellrevision sind explizit. Veraltete oder mehrdeutige Ziele dürfen keine Änderung auslösen.
- Vorschau, nachvollziehbarer Änderungsvergleich, Nutzerannahme und Undo/Rollback gehören zum späteren AI-Änderungsablauf. Ein JSON-Schema allein ersetzt keine fachliche Prüfung.
- Fachwissen wird mit Quelle, Geltungsbereich und Version angebunden. Dokumentinhalte sind Daten und verleihen keine Werkzeugrechte.
- Sprachmodell und Anbieter sollen austauschbar bleiben. Ein eigenes Grundmodell oder Fine-Tuning ist keine Voraussetzung.
- Modellabfragen liefern strukturierte Daten. Ein späterer Knowledge Graph ergänzt den autoritativen Modellstand; er darf keine unabhängige editierbare BIM-Wahrheit schaffen.
- Das bestehende Skalierverbot für BIM-/3D-Elemente bleibt gültig. Skalierung ist nur für echte 2D-Elemente und importierte PDF-Referenzen vorgesehen.
- Quellen-, Produkt- und Anbieterangaben in der PDF sind vor der jeweiligen technischen Umsetzung neu zu prüfen. Beispielgrenzen und Performancewerte sind keine bereits nachgewiesenen Fähigkeiten oder allgemeingültigen Normwerte.

### Vorgeschlagene spätere Entwicklungsfolge

1. **Lesen:** strukturierte Modellabfragen mit überprüfbaren Treffern.
2. **Prüfen:** Projektwissen, Quellen und ausgewählte deterministische Qualitätsprüfungen.
3. **Ändern:** wenige klar begrenzte Aktionen mit Vorschau, Diff, Freigabe und Undo.
4. **Entwerfen:** Varianten, generative Planung und Fachanalysen nach Aufbau ihrer Modell- und Werkzeuggrundlagen.

Dies ist die Reihenfolge innerhalb des zukünftigen AI-Ausbaus. Die Eingliederung in den Gesamtplan erfolgt später als eigener begrenzter Planungsauftrag. Der aktuelle nächste CAD-Auftrag bleibt maßgeblich.



### Ausführliche AI-Originalstrategie (Anlage vom 04.10.)

Quellentranskription. Beispielwerte, Anbieterangaben, Schwellen und Empfehlungen sind keine übernommenen Zusicherungen oder automatisch beschlossenen Technologien. Hauptvision vom 10.10. hat Vorrang.

```text
INNOVATIONSKATALOG + AI-STRATEGIE



CAD / BIM 2026


Architektursoftware mit AI
35 innovative Funktionen und Anforderungen für eine CAD-/BIM-Plattform im Jahr 2026. Ergänzt um
eine praktische Strategie für Integration, Wissen, Training und einen ersten Prototyp.




Die zentrale Idee
Der Mensch formuliert Entwurfsabsichten. AI übersetzt sie in überprüfbare Aufgaben. Ein
geometrischer Kernel, BIM-Semantik, Regeln und Simulationen erzeugen und prüfen das
Gebäudemodell.

  Mensch → Absicht → AI + Constraints + Simulation → Gebäude




Meine Empfehlung für deinen Einstieg
Nutze ein vorhandenes leistungsfähiges Modell über eine API und entwickle deine eigene
CAD-/BIM-Werkzeugschicht. Beginne mit Modellabfragen, Qualitätsprüfung und kontrollierten
Änderungen. Ein eigenes Grundmodell ist dafür nicht erforderlich.




Einordnung
Dieses Dokument bündelt alle 35 Punkte aus unserer Unterhaltung in redaktionell verdichteter Form. Es ist ein
Anforderungskatalog und eine Produktvision, keine Behauptung, dass sämtliche Funktionen bereits serienreif verfügbar
sind. Die Umsetzungsstrategie ist eine technische Empfehlung.

Alle Beispielwerte für Fluchtwege, Türbreiten, Raumhöhen, Kosten, CO₂, Energie und Geschwindigkeit sind illustrative
Projekt- oder Produktziele. Ihre Gültigkeit muss für das konkrete Projekt, Regelwerk und Messverfahren bestimmt werden.




CAD / BIM 2026 • Konzept & AI-Integration • 04.10.2026                                                                 1


ÜBERBLICK



Orientierung
Leseführung

 Seiten         Inhalt

 3-9            Alle 35 Funktionen und Anforderungen, jeweils mit Nutzen und Umsetzungskern

 10             Die ursprünglichen Top-10 und ein realistischer Startumfang

 11             Empfohlene Systemarchitektur und kontrollierter Änderungsablauf

 12             Eigene AI, API oder selbst betriebenes Modell?

 13             Wissen anbinden und Modelle gezielt trainieren

 14             Prototyp, Qualitätsmessung und Ausbau

 15             Quellen, Status und Begriffe




Was dieses Konzept zusammenhält
1. Ein echtes BIM-Modell. Räume, Bauteile und Materialien besitzen stabile Identitäten,
Beziehungen und Eigenschaften. Ein Bild oder ein unstrukturiertes Mesh genügt nicht.

2. Nachprüfbare Werkzeuge. Die AI schlägt Befehle vor. Deine Software prüft Berechtigungen,
Parameter, Modellzustand und das Ergebnis.

3. Ein kontrollierter Arbeitsablauf. Vorschau, Änderungsvergleich, Freigabe und Rücknahme
gehören zur Modellierung.

4. Messbare Qualität. Modelltreue, geometrische Gültigkeit und Quellenbezug sind wichtiger als
überzeugend formulierte Antworten.

Astra im Konzept
GPT-6 Astra ist als mögliches Modell für komplexe Interpretation und mehrstufige Aufgaben
berücksichtigt [S1]. Die Gesamtarchitektur sollte jedoch austauschbare Modelle unterstützen. Die
allgemeine Leistungsfähigkeit eines Modells belegt noch keine zuverlässige CAD-, Brandschutz- oder
Tragwerkskompetenz.




CAD / BIM 2026 • Konzept & AI-Integration • 04.10.2026                                           2


35 PUNKTE · PRODUKTVISION UND ANFORDERUNGEN



Funktionen 01-05
01 Intent-based CAD
Aus Zielen wie „zweigeschossiger Kindergarten für 80 Kinder, viel Tageslicht und Gruppenräume
zum Garten“ entsteht ein parametrisches BIM statt nur einer Visualisierung.

Umsetzungskern: Absicht in Raumprogramm, Randbedingungen und messbare Ziele zerlegen; Varianten erzeugen,
prüfen und dokumentieren.


02 AI Design Agent
Ein Agent analysiert eine Variante, prüft Raumprogramm und Konflikte, nutzt Analysen und schlägt
bessere Alternativen vor.

Umsetzungskern: Ein Modell wie Astra plant Arbeitsschritte; Fachwerkzeuge liefern belastbare Ergebnisse. Änderungen
werden als Varianten mit Kennzahlen vorgelegt.


03 Conversational BIM
Sprache steuert Modellabfragen und Änderungen: Türen unter einer Breite finden, einen Kern
verschieben oder ein Bürogeschoss in Wohnungen umplanen.

Umsetzungskern: Semantik von Gebäude, Geschoss, Zone, Raum, Bauteil, Material, System, Eigenschaft und Regel;
AI-Interpretation vom Geometriekernel trennen.


04 AI Command Layer
Alle relevanten CAD-Funktionen werden über kontrollierte Befehle erreichbar: Wände, Räume,
Geschosse, Materialien, Analysen, Pläne und IFC-Export.

Umsetzungskern: Befehle wie create_wall(), move_element() und export_ifc() mit validierten Parametern, Undo/Redo,
Berechtigungen und Audit Trail [S2].


05 Generatives Gebäudedesign
Grundstück, Raumprogramm, Baurecht, Budget, Tragwerksraster, Energie- und Gestaltungsziele
bilden einen Variantenraum.

Umsetzungskern: Beispielsweise 50-500 Varianten als Zielumfang; BGF, Flächeneffizienz, Tageslicht, Energie, CO₂,
Kosten und Erschließung im Pareto Explorer vergleichen.




CAD / BIM 2026 • Konzept & AI-Integration • 04.10.2026                                                              3


35 PUNKTE · PRODUKTVISION UND ANFORDERUNGEN



Funktionen 06-10
06 AI Space Planning
Ein Grundrissgenerator verteilt Räume, Verkehrsflächen, Kerne, Treppen, Aufzüge, Sanitär,
Schächte, Fluchtwege und Möblierung.

Umsetzungskern: Raumgrößen, Tiefen, Kapazitäten und Nachbarschaften modellieren: OP nahe Aufwachraum, Küche
nahe Anlieferung, ruhige Räume weg von der Straße.


07 Echtzeit-Regelprüfung
Probleme werden beim Entwerfen direkt im Modell markiert: Wege, Türmaße oder Raumhöhen. „Fix
with AI“ erzeugt Lösungsvorschläge.

Umsetzungskern: Regeln müssen Nutzung, Ort, Ausnahmen und Regelwerksversion berücksichtigen. Beispielgrenzen
aus der Unterhaltung sind keine universellen Vorgaben.


08 AI Building Code Copilot
Zu einem Problem erscheinen Vorschrift, Fundstelle, Interpretation, betroffene Bauteile und
Lösungsvorschlag.

Umsetzungskern: LBO, MBO, DIN, VDI, ASR, GEG, Sonderbauvorschriften und Satzungen getrennt und versioniert
verwalten. Quellenrecherche und formale Prüfung unterscheiden.


09 Scan / Bild / PDF → BIM
Laserscans, LiDAR, Drohnenbilder, Fotos, alte Pläne und DWGs werden in editierbare Wände,
Öffnungen, Decken, Räume und Geschosse übersetzt.

Umsetzungskern: Messgenauigkeit, Klassifikation und unbekannte Eigenschaften dokumentieren. Eine
LOD-300-Anforderung braucht definierte Modellierungs- und Prüfregeln.


10 Sketch-to-BIM
Eine fotografierte Handskizze liefert einen ersten editierbaren Grundriss mit erkannten Räumen,
Türen, Wänden und Beschriftungen.

Umsetzungskern: Maßstab und Referenzmaße erfragen; Unsicherheiten sichtbar lassen. Aus einer unbemaßten Skizze
entsteht keine automatisch gesicherte Maßhaltigkeit.




CAD / BIM 2026 • Konzept & AI-Integration • 04.10.2026                                                           4


35 PUNKTE · PRODUKTVISION UND ANFORDERUNGEN



Funktionen 11-15
11 AI-Objektgenerator
Text oder Bild erzeugt ein parametrisches BIM-Objekt, etwa einen Konferenztisch mit Abmessungen,
Material und Klassifikation.

Umsetzungskern: Editierbare Parameter und IFC-Klasse statt bloßer Mesh-Geometrie. Hersteller-, Kosten- und
CO₂-Daten nur übernehmen, wenn ihre Herkunft belegt ist.


12 Semantic Materials
Materialien verbinden Optik mit Dichte, Wärmeleitfähigkeit, Brandschutz, Akustik, Kosten, EPD,
Lebensdauer und Recyclingfähigkeit.

Umsetzungskern: Vergleichbare Datensätze und Bilanzgrenzen verwenden. So werden Alternativen mit ähnlicher Optik
und geringerer Umweltwirkung suchbar.


13 AI Facade Generator
Aus Fensteranteil, Raster und Gestaltungsabsicht entstehen Fenster, Brüstungen, Paneele,
Verschattung, Balkone und konstruktive Ordnung.

Umsetzungskern: Parametrik mit Tageslicht, Überhitzung, Kosten, CO₂ und Herstellbarkeit verknüpfen; gestalterische
Varianten technisch überprüfen.


14 Instant Environmental Simulation
Sonne, Wind, Lärm, Tageslicht, Überhitzung, Energie und CO₂ fließen schon während der
Modellierung in Entscheidungen ein.

Umsetzungskern: Schnelle Näherungen für interaktive Vorschauen und validierte Fachsimulationen getrennt
kennzeichnen. Ergebnisse inkrementell aktualisieren.


15 AI Cost Designer
Änderungen erhalten Kosten-, Lebenszyklus-, Energie- und CO₂-Feedback. Die AI sucht
Einsparvarianten unter festen Entwurfsbedingungen.

Umsetzungskern: Mengen aus dem Modell und nachvollziehbare Preisquellen verbinden; Preisstand, Region,
Leistungsumfang und Unsicherheit ausweisen.




CAD / BIM 2026 • Konzept & AI-Integration • 04.10.2026                                                               5


35 PUNKTE · PRODUKTVISION UND ANFORDERUNGEN



Funktionen 16-20
16 Explain my building
Die AI erklärt Kostentreiber, ungünstige Spannweiten, große Fassadenanteile oder uneinheitliche
Systeme am konkreten Modell.

Umsetzungskern: Erklärungen mit Bauteilen, Mengen und Analyseergebnissen verknüpfen. Hypothesen und
nachgewiesene Ursachen unterscheiden.


17 Architecture Knowledge Graph
Das Gebäude wird als Netz aus Räumen, Bauteilen, Materialien, Nutzungen, Anforderungen und
Analysen zugänglich.

Umsetzungskern: Stabile IDs und Beziehungen wie „liegt auf“, „grenzt an“ und „beeinflusst“ pflegen. Das kann
bestehende Modellformate ergänzen; es muss sie nicht ersetzen.


18 Branching wie Git
Fassaden-, Tragwerks- und Investorenvarianten werden parallel entwickelt, verglichen und bei
Bedarf zusammengeführt.

Umsetzungskern: Semantische Unterschiede und Abhängigkeiten auswerten. Konflikte zwischen Bauteilen und
Fachmodellen benötigen eigene Merge-Regeln.


19 AI Change Impact Analysis
Vor dem Verschieben eines Kerns erscheinen Auswirkungen auf Statik, Brandschutz, TGA, Flächen,
Kosten, Pläne und Details.

Umsetzungskern: Abhängigkeiten und betroffene Elemente ermitteln; geschätzte Auswirkungen klar von neu
berechneten Ergebnissen unterscheiden.


20 Autonomous Documentation
Grundrisse, Schnitte, Ansichten, Details, Bemaßungen, Beschriftungen, Raumbücher, Listen, IFC und
PDF werden vorbereitet.

Umsetzungskern: Ein Plansatz aus Modell, Bürovorlage und Projektvorgaben erzeugen. Abgabestand und
Vollständigkeit fachlich prüfen.




CAD / BIM 2026 • Konzept & AI-Integration • 04.10.2026                                                         6


35 PUNKTE · PRODUKTVISION UND ANFORDERUNGEN



Funktionen 21-25
21 Drawing QA Agent
Vor Abgabe erkennt die Software fehlende Maße, widersprüchliche Namen, unreferenzierte Schnitte,
Textüberlagerungen und falsche Maßstäbe.

Umsetzungskern: Modellregeln und Prüfung der tatsächlich ausgegebenen Blätter kombinieren; Probleme mit Plan und
Position verknüpfen.


22 AI Coordination Agent
Architektur, Tragwerk und TGA werden auf geometrische und funktionale Konflikte geprüft, etwa
versperrte Wartungszugänge.

Umsetzungskern: Föderierte Fachmodelle, Zuständigkeiten, Toleranzen und Wartungsräume berücksichtigen;
nachvollziehbare Koordinationsfälle erzeugen.


23 Natural-Language BIM Query
Fragen wie „Fenster auf der Südseite über 4 m²“ oder „Bauteile ohne IFC-Klassifikation“ werden zu
strukturierten Abfragen.

Umsetzungskern: Filter, Einheiten und räumliche Orientierung ausdrücklich definieren. Treffer mit IDs, Eigenschaften
und Modellrevision zurückgeben.


24 Spatial AI
Räumliche Nutzbarkeit wird beurteilt: Tür- und Möbelbewegungen, Bewegungsflächen, Wartbarkeit
und Auffindbarkeit des Eingangs.

Umsetzungskern: Geometrische Prüfungen mit Nutzungsmodellen kombinieren. Gestalterische Einschätzungen bleiben
begründete Vorschläge.


25 AI Design Critic
Optionale Kritiker prüfen Nachhaltigkeit, Kosten, Barrierefreiheit und räumliche Qualität aus
unterschiedlichen Perspektiven.

Umsetzungskern: Kriterien, Gewichtungen und Konflikte offenlegen. Die architektonische Entscheidung bleibt beim
Planer.




CAD / BIM 2026 • Konzept & AI-Integration • 04.10.2026                                                                 7


35 PUNKTE · PRODUKTVISION UND ANFORDERUNGEN



Funktionen 26-30
26 Multimodale Eingabe
Text, Sprache, Tablet-Skizzen, Referenzbilder und eingekreiste Modellbereiche werden gemeinsam
verstanden.

Umsetzungskern: Eingaben eindeutig mit Auswahl, Kamera und Modellrevision verbinden. Mehrdeutige Änderungen
vor Ausführung klären.


27 AI Rendering direkt im Modell
Visualisierungen verändern Atmosphäre, Licht, Wetter, Menschen und Vegetation, während
Entwurfsgeometrie erhalten bleibt.

Umsetzungskern: Geometrie, Kamera und Materialien gezielt sperren. Strikte Geometrietreue durch geeignete
Rendering-Pipeline und Vergleich prüfen.


28 Open-BIM und offene Schnittstellen
IFC, BCF, IDS, glTF, DWG/DXF, PDF, Punktwolken, Energieaustausch, API, SDK und Webhooks
ermöglichen Zusammenarbeit.

Umsetzungskern: IFC-Profile und Versionen projektbezogen testen, einschließlich IFC 4.3. BCF unterstützt Issues, IDS
Informationsanforderungen [S6-S8]. Python und C#/C++ nach Bedarf anbinden.


29 Cloud-native, Local-first möglich
Ein schneller lokaler CAD-Kernel arbeitet mit Cloud-Diensten für Projektgraph, Zusammenarbeit, AI,
Simulation und Versionierung.

Umsetzungskern: Offline-Verhalten, Synchronisation, Konfliktlösung und Zugriffsrechte definieren; vertrauliche Projekte
auch in passenden lokalen Betriebsformen ermöglichen.


30 Performance-Anforderungen
Zielbild: Start unter 5 s, UI-Reaktion unter 100 ms, frühe AI-Vorschau unter 2 s und sehr große
föderierte Modelle.

Umsetzungskern: 10+ Mio. Elemente als ambitioniertes Lastszenario definieren. GPU-Rendering, Streaming, Multicore
und inkrementelle Neuberechnung; Ziele auf Referenzhardware messen.




CAD / BIM 2026 • Konzept & AI-Integration • 04.10.2026                                                                 8


35 PUNKTE · PRODUKTVISION UND ANFORDERUNGEN



Funktionen 31-35
31 AI muss non-destructive sein
Jede Modelländerung folgt Vorschau, Änderungsvergleich und Annahme. Neue, gelöschte und
geänderte Elemente werden sichtbar.

Umsetzungskern: Accept / Modify / Reject, isolierte Varianten, atomare Transaktionen und vollständige Rücknahme.
Keine versteckten Schreibaktionen.


32 AI Confidence
Das System zeigt, welche Aussagen gesichert, unsicher oder mangels Daten nicht prüfbar sind.

Umsetzungskern: Keine erfundenen Prozentwerte. „99 %“ oder „72 %“ sind nur bei kalibrierter Messung sinnvoll;
Datenlücken wie unbekannte Raumnutzung explizit anzeigen.


33 AI Provenance
Jede wesentliche Aussage enthält Quelle, Regelwerksstand, Modellrevision, Zeitpunkt, Annahmen
und verwendetes AI-Modell.

Umsetzungskern: Reproduzierbare Prüfberichte und Audit Trail; veraltete Ergebnisse nach Modelländerungen
kennzeichnen.


34 Mehrere spezialisierte Agents
Kosten-, Regelwerks-, Energie-, Tragwerks-, TGA-, Nachhaltigkeits-, Dokumentations-,
Visualisierungs- und Beschaffungsagenten arbeiten zusammen.

Umsetzungskern: Ein Orchestrator verteilt Aufgaben und führt Ergebnisse zusammen. Erst bei nachgewiesenem
Nutzen auf mehrere Agenten ausbauen; eindeutige Schreibzuständigkeiten.


35 Design Goal Memory
Die ursprüngliche Entwurfsabsicht bleibt erhalten: Geschosszahl, Innenhof, Holztragwerk, Tageslicht
und Budget werden bei Änderungen berücksichtigt.

Umsetzungskern: Ziele versioniert mit Priorität, Herkunft und Freigabe speichern. Widersprüche melden und
Zieländerungen bewusst beschließen.




CAD / BIM 2026 • Konzept & AI-Integration • 04.10.2026                                                             9


PRIORISIERUNG



Die Top-10 und der Einstieg
 Priorität      Funktion

 1              Natural Language → echtes BIM

 2              Agentischer CAD-Assistent à la Astra

 3              Generatives Gebäude- und Grundrissdesign

 4              Permanente Building-Code-Prüfung

 5              AI Change Impact Analysis

 6              Building Knowledge Graph

 7              Kosten + CO₂ + Energie im Entwurf

 8              Git-artige Modellversionierung

 9              Autonomous Documentation und QA

 10             Sketch / Image / Scan → BIM


Vision und Entwicklungsreihenfolge
Die Top-10 beschreiben den gewünschten Produktwert. Für einen ersten Prototyp würde ich die
Reihenfolge ändern: zunächst Modellabfragen und QA, dann wenige reversible Änderungen und erst
danach generative Entwürfe und umfassende Fachprüfungen.

Ein konkreter erster Anwendungsfall
„Finde alle Türen, deren lichte Durchgangsbreite unter dem im Projekt hinterlegten Zielwert liegt.
Markiere sie, erkläre fehlende Daten und schlage passende Alternativen vor.“

Das bündelt semantische Abfragen, Projektwissen, Quellenbezug und einen prüfbaren
Änderungsvorschlag. Es ist deutlich besser abgrenzbar als ein vollständig automatisch entworfenes
Gebäude.




CAD / BIM 2026 • Konzept & AI-Integration • 04.10.2026                                               10


TECHNISCHE EMPFEHLUNG



So kommt AI in die Software
Bausteine der empfohlenen Architektur

 Baustein                        Aufgabe

 CAD-/BIM-Anbindung              Native API oder Plugin liest Modell, Auswahl und Eigenschaften; führt genehmigte
                                 Transaktionen aus.

 Eigener AI-Service              Verwaltet Nutzerrechte, Aufgaben, Kontext, Tool-Aufrufe, Protokolle und
                                 Modelladapter.

 Sprachmodell / Astra            Interpretiert Absichten, plant Schritte und erklärt Werkzeugergebnisse.

 Projektwissen / RAG             Liefert passende, versionierte Dokumentpassagen und Quellen.

 Fachengines                     Berechnen Geometrie, Mengen, Kollisionen, Regeln, Kosten und Simulationen.

 Prüfung und Freigabe            Validiert Änderung, zeigt Diff und ermöglicht vollständiges Undo.


Ein Beispiel vom Wunsch zur Änderung
1. Nutzer wählt Außenwände und formuliert ein Materialziel.
2. Der Service liest Bauteile, Aufbauten und Projektbedingungen.
3. Das Modell ruft Werkzeuge zur Suche und Bewertung auf.
4. Deine Software prüft Einheiten, Materialdaten und Modellrevision.
5. Die Änderung entsteht in einer isolierten Vorschau.
6. Der Nutzer sieht Bauteil-Diff und berechnete Auswirkungen.
7. Nach Annahme erfolgt eine atomare Änderung mit Audit Trail.

Was die Werkzeugschicht absichern muss
Stabile Bauteil-IDs, eindeutige Einheiten, Parametergrenzen, Rechte, erwartete Modellrevision,
wiederholbare Aufrufe und Rollback. Ein korrektes JSON-Schema allein beweist keine technisch
richtige Änderung.

Function Calling verbindet Modelle mit eigenen Funktionen [S2]. Native CAD-APIs sind für belastbare Schreibvorgänge
vorzuziehen; Bildschirmsteuerung kann Lücken überbrücken, ist aber empfindlicher gegenüber UI-Änderungen.




CAD / BIM 2026 • Konzept & AI-Integration • 04.10.2026                                                                11


ENTSCHEIDUNGSHILFE



Eigene AI oder bestehendes Modell?
Muss ich eine eigene AI haben?
Nein, du brauchst kein selbst trainiertes Grundmodell. Du brauchst eine eigene
Anwendungsschicht, die ein vorhandenes Modell mit deinen CAD-Werkzeugen und Projektdaten
verbindet. Dadurch wird das System fachlich nützlich.

 Weg                        Wann sinnvoll?                               Meine Empfehlung

 Modell über API            Schneller Einstieg, anspruchsvolle Sprache   Für den Prototyp bevorzugen; Qualität,
                            und multimodale Aufgaben.                    Latenz, Kosten und Datenanforderungen
                                                                         messen.

 Selbst betriebenes         Offline-Betrieb oder Anforderungen, die      Bei konkretem Bedarf vergleichen;
 Modell mit offenen         externe Verarbeitung ausschließen.           Infrastruktur, Lizenz und Wartung
 Gewichten                                                               berücksichtigen.

 Fine-Tuning eines          Wiederkehrende Fehler bei engen Aufgaben     Später gezielt prüfen; Modell- und
 vorhandenen Modells        trotz guter Tools und Kontext.               Anbieterunterstützung voraussetzen.

 Grundmodell von            Eigener Forschungsschwerpunkt, große         Für den Einstieg in CAD-AI nicht
 Grund auf trainieren       Daten- und Rechenressourcen.                 empfehlen.


Wie ich Astra einsetzen würde
Als Kandidat für komplexe Aufgabenplanung und mehrstufige Analyse, nicht als Ersatz für
Geometriekernel oder Fachsimulation. Einfache Klassifikation und Abfragen können kleinere Modelle
übernehmen, sofern deine Tests deren Qualität bestätigen [S1].

Du besitzt das Produkt und seine Werkzeuge; die Modellgewichte können beim Anbieter liegen. Ein
selbst betriebenes Modell gibt dir Betriebssteuerung, verursacht aber zusätzliche Infrastruktur- und
Evaluationsarbeit.

Anbieter austauschbar halten
Ein gemeinsamer interner Werkzeugvertrag reduziert Abhängigkeit. Wähle das Modell anhand deiner
CAD-Testfälle und der verfügbaren API-Funktionen, nicht allein anhand allgemeiner Benchmarks.




CAD / BIM 2026 • Konzept & AI-Integration • 04.10.2026                                                         12


ENTWICKLUNG



Wissen anbinden, gezielt trainieren
Vier unterschiedliche Dinge

 Methode               Was wird verändert?                             Wofür?

 Prompting             Instruktionen und Beispiele im aktuellen        Begriffe, Ablauf, Ausgabe und Rückfragen.
                       Aufruf.

 RAG /                 Passende Dokumentstellen werden als Kontext     Projektvorgaben, Handbücher und
 Wissenssuche          abgerufen.                                      versionierte Fachquellen [S3].

 Tool-Anbindung        Das Modell darf definierte Softwarefunktionen   Aktuelle BIM-Daten lesen und kontrollierte
                       aufrufen.                                       Aktionen auslösen.

 Fine-Tuning           Gewichte eines unterstützten Basismodells       Eng begrenzte wiederkehrende Verhaltens-
                       werden angepasst.                               oder Klassifikationsaufgaben.


Projektwissen sauber aufbauen
Dokumente strukturieren, Text und Tabellen erfassen und mit Quelle, Datum, Region, Nutzung und
Version versehen. Die Suche muss diese Metadaten berücksichtigen. CAD-Geometrie über
strukturierte Abfragen bereitstellen; nicht nur lange Modelltexte in eine Wissensdatenbank laden.

Wenn gezieltes Training später nötig wird
1. Einen messbaren Fehler festlegen, etwa falsche Bauteilklassifikation.
2. Fachlich geprüfte Eingaben, Soll-Ausgaben und Tool-Sequenzen sammeln.
3. Trainings- und Testdaten nach Projekten trennen, um Datenleckage zu vermeiden.
4. Basismodell mit Prompting und RAG als Vergleich messen.
5. Ein unterstütztes Modell trainieren und auf ungesehenen Projekten testen.
6. Nur bei messbarer Verbesserung ausrollen und Rückfalloption behalten.

Aktueller Anbieterhinweis
OpenAI dokumentiert am 04.10.2026 den Rückbau der Fine-Tuning-Plattform; neue Nutzer erhalten
dort keinen Zugang [S4]. Fine-Tuning bleibt ein technischer Ansatz bei passenden Anbietern oder
selbst betriebenen Modellen, sollte aber keine Voraussetzung deiner Architektur sein.

Das Hochladen von Dokumenten für RAG ist kein Training der Modellgewichte. Auch Fine-Tuning macht wechselnde
Vorschriften nicht automatisch aktuell.




CAD / BIM 2026 • Konzept & AI-Integration • 04.10.2026                                                              13


VORGEHENSWEISE UND QUALITÄT



Vom Prototyp zum Produkt
Ein realistischer Ausbau in vier Stufen

 Stufe             Lieferumfang                                   Abnahmekriterium

 1 · Lesen         Eine CAD-Software anbinden; Räume, Türen und   Ergebnisse stimmen mit den
                   Eigenschaften abfragen.                        Referenzmodellen überein.

 2 · Prüfen        Projektwissen, Quellen, QA und wenige          Fehlende Daten werden erkannt;
                   deterministische Prüfungen.                    Fundstellen sind nachvollziehbar.

 3 · Ändern        Wenige Schreibbefehle mit Vorschau, Diff und   Keine Änderungen außerhalb des Umfangs;
                   Undo.                                          Rollback stellt den Zustand wieder her.

 4 · Entwerfen     Varianten, Kosten-/Umweltanalysen,             Varianten erfüllen definierte Constraints;
                   Grundrissgenerator, weitere Fachagenten.       Kennzahlen sind vergleichbar.


Qualität vor Umfang
Als Startvorschlag: 50-100 fachlich geprüfte Testfälle aus mehreren Projekten. Dazu unvollständige
Modelle, falsche Einheiten, mehrdeutige Wünsche, widersprüchliche Quellen und Änderungen
während eines Agentenlaufs. Diese Zahl ist ein Pilotumfang, kein statistischer Qualitätsnachweis.

Messen: Abfragegenauigkeit, falsche Warnungen, übersehene Probleme, Quellenrichtigkeit,
geometrische Gültigkeit, Rollback-Erfolg, Laufzeit und Kosten je erfolgreicher Aufgabe. Bei
Modellwechsel dieselben Fälle erneut prüfen [S5].

Betrieb und Projektdaten
Zugriff projektbezogen begrenzen, Schlüssel im Backend halten und vertrauliche Inhalte nur in
geeignete Dienste geben. Dokumentinhalte sind Daten und dürfen keine Werkzeugrechte ändern.
Für Normtexte Nutzungsrechte prüfen; für den Betrieb Datenhaltung, Aufbewahrung und Löschung
festlegen.

Was du tatsächlich aufbauen musst
CAD-/BIM-Integration, Backend und Werkzeugvertrag, Fachregeln und Datenmodell, einfache UI für
Vorschau und Freigabe sowie ein gemeinsames Testset mit Architekten. Beginne als Plugin oder
angebundener Service; ein eigener CAD-Kernel erhöht den Entwicklungsumfang erheblich.




CAD / BIM 2026 • Konzept & AI-Integration • 04.10.2026                                                         14


NACHSCHLAGEN



Quellen und Einordnung
Quellen und Aktualität
Primärquellen, geprüft am 04.10.2026. Die 35 Produktanforderungen stammen aus der bereitgestellten Unterhaltung. Die
Architektur, Priorisierung und Umsetzungsschritte sind eigene Empfehlungen; daraus folgt keine zugesicherte
Produktfähigkeit.

[S1] OpenAI: GPT-6 Astra Model

https://developers.openai.com/api/docs/models/gpt-6-astra

[S2] OpenAI: Function calling

https://developers.openai.com/api/docs/guides/function-calling

[S3] OpenAI: File search

https://developers.openai.com/api/docs/guides/tools-file-search

[S4] OpenAI: Model optimization; aktueller Fine-Tuning-Hinweis

https://developers.openai.com/api/docs/guides/model-optimization

[S5] OpenAI: Working with evals (Legacy-Dokumentation)

https://developers.openai.com/api/docs/guides/evals

[S6] buildingSMART: IFC 4.3.2.0 - Introduction

https://standards.buildingsmart.org/IFC/RELEASE/IFC4_3/HTML/content/introduction.htm

[S7] buildingSMART: Information Delivery Specification

https://www.buildingsmart.org/standards/bsi-standards/information-delivery-specification-ids/

[S8] buildingSMART: BIM Collaboration Format

https://technical.buildingsmart.org/standards/bcf/


Begriffe
BIM: semantisches Gebäudemodell. CAD-Kernel: Geometrie- und Modellierungsengine. RAG: passende Wissensquellen
für eine Antwort abrufen. Agent: ein System, das Aufgaben über mehrere Werkzeugschritte bearbeitet. Fine-Tuning:
Anpassung eines vorhandenen Modells. Diff: sichtbarer Änderungsvergleich. Pareto: Varianten, bei denen ein Ziel nicht
ohne Nachteile bei anderen Zielen verbessert werden kann.


Technische und fachliche Grenzen
IDS prüft spezifizierte Informationsanforderungen und ersetzt keine vollständige baurechtliche Prüfung.
BIM-Interoperabilität muss mit den konkreten Austauschprofilen getestet werden. Prozentuale Verbesserungen aus
Beispielen brauchen eine definierte Baseline und Messmethode.




CAD / BIM 2026 • Konzept & AI-Integration • 04.10.2026                                                             15
```


## 4. Ergänzungskataloge und aktueller Umfang


### V01–V09

Die ursprüngliche Anforderung/Abnahme bleibt erhalten. Historische Befundzahlen sind keine aktuelle Messung. Prioritäten/Reihenfolge und erledigte Teilaufträge nach Masterplan bewerten.

| Kennung | Anforderung/Befund der Quelle | Abnahme/Architektur |
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

### R26-01–08

Die ursprüngliche Anforderung/Abnahme bleibt erhalten. Historische Befundzahlen sind keine aktuelle Messung. Prioritäten/Reihenfolge und erledigte Teilaufträge nach Masterplan bewerten.

| Kennung | Anforderung/Befund der Quelle | Abnahme/Architektur |
| --- | --- | --- |
| R26-01 / P0 | **Große Projektdateien und Referenzen sicher handhaben.** K02/K03 und der bereits vermerkte Wunsch nach verknüpfbaren Bildern konkretisieren. Heute gilt die 10-MiB-Gesamtprojektgrenze; Bilddaten sind eingebettet. | Kapazitätsprofil mit Modellgröße, Bildpixeln, Datei- und Speicherbedarf sowie Öffnen, Bearbeiten, Undo und Speichern messen. Versionierten Modell-/Asset-Vertrag und verknüpfte **oder** portable eingebettete Referenzen mit fehlenden/verschobenen Dateien, Pfadauflösung, Umzug und Austausch prüfen. Keine pauschale Limitanhebung und keine Festlegung auf Datenbank, Desktop oder Browser vor Messung/Vertrag. |
| R26-02 / P0 | **Datensicherheit und Wiederherstellung.** Neu als ausdrückliche Produktaufgabe. | Atomar speichern, sichere Vorgängerversion/Backup und Wiederaufnahme nach unerwartetem Abbruch konzipieren. Einen unterbrochenen Schreibvorgang und beschädigte/fehlende Assets praktisch prüfen: zuletzt gesichertes Projekt bleibt lesbar; Wiederherstellung zeigt klar an, welchen Stand sie anbietet. Undo ersetzt kein Backup. Plattformadapter bleiben austauschbar. |
| R26-03 / P1 | **Gebäudekern zu einem nutzbaren Projekt erweitern.** Bereits gewünschte Mehrgeschossigkeit, Höhenbezüge, Türen, Decken, Dächer, Treppen und Räume bündeln; pro Bauteil kleine Schritte. | Gemeinsame stabile Elementidentitäten, Geschoss-/Höhenbezug und fachliche Abhängigkeiten. Änderung eines Bauteils aktualisiert betroffene Anschlüsse, Öffnungen, Räume und Ableitungen nachvollziehbar; Migration, Undo und Dateirundlauf prüfen. Fach-/3D-Elemente werden niemals proportional skaliert; Kalibrierung bleibt auf 2D/PDF/PNG/JPEG-Referenzen beschränkt. |
| R26-04 / P1 | **Modellgebundene Dokumentation.** Vorhandener Wunsch nach Schnitten, Ansichten, Abbildern, unabhängiger Ansichtsdarstellung, Layouts und Plankopf. | Planansichten und Schnitte aus demselben BIM-Modell ableiten; Annotationen im richtigen Ansichts-/Dokumentkontext verwalten. Änderung am Modell aktualisiert abhängige Zeichnungen; Layout und PDF-Ausgabe behalten Ausschnitt, Maßstab, Sichtbarkeit und Beschriftung. Keine kopierten Bauteile als zweite Wahrheit. |
| R26-05 / P1 | **Nachvollziehbare Auswertungen.** Räume/Wohnfläche sind bereits gewünscht; neue Ergänzung sind Tür-, Fenster-, Flächen- und Materiallisten. | Bauteillisten aus denselben validierten Modell-IDs und Eigenschaften ableiten. Jede Zahl nennt Umfang/Regelprofil und lässt ihre Quellen erkennen; Änderungen, Ausschlüsse, Rundung und nicht auswertbare Elemente werden sichtbar. Wohnflächenregeln bleiben ein eigenes, versioniertes Profil, keine implizite allgemeine Flächensumme. |
| R26-06 / P2, früher falls Pilotprojekt blockiert | **Interoperabilität in beide Richtungen.** IFC-Export existiert; IFC-Import bzw. verknüpfte IFC-Referenz und konkret benötigte DWG/DXF-/PDF-Wege sind als Anschlussaufträge zu prüfen. | Erst Austauschfall, unterstützten IFC-Umfang, Einheiten/Koordinaten, GUIDs, unbekannte Bauteile und erneutes Laden festlegen. „IFC unterstützt“ erst behaupten, wenn der konkrete Import-/Exportfall mit Fremddatei reproduzierbar funktioniert. DWG/DXF und PDF sind eigene Teilaufträge, kein pauschales Vollformatversprechen. |
| R26-07 / P2 | **Planstände und Revisionen.** Neue ausdrückliche Produktaufgabe; an R26-04 anbinden. | Ausgegebene Planversion mit Datum/Stand unveränderlich referenzieren; Änderungen am Modell gegenüber dieser Ausgabe kenntlich machen. Planindex, Revisionsvermerk und reproduzierbarer erneuter Export werden pro Plan geprüft. Modell-History und veröffentlichte Planstände bleiben getrennte Begriffe. |
| R26-08 / P2 | **Modellqualität und Zusammenarbeit.** Neue ausdrückliche Aufgabe: prüfbare Regeln und später BCF-Aufgaben; IDS nur bei realem IFC-Austauschbedarf. | Vor Ausgabe fehlende Eigenschaften, ungültige Beziehungen und offene Warnungen mit stabilen Element-IDs anzeigen. BCF-Themen an Ansicht/Elemente/Modellrevision binden, importieren und exportieren, sobald ein konkreter Fachplanerablauf feststeht. Prüfregeln dürfen Änderungen nicht heimlich am Modell vornehmen. |

### K01–K08

Die ursprüngliche Anforderung/Abnahme bleibt erhalten. Historische Befundzahlen sind keine aktuelle Messung. Prioritäten/Reihenfolge und erledigte Teilaufträge nach Masterplan bewerten.

| Kennung | Anforderung/Befund der Quelle | Abnahme/Architektur |
| --- | --- | --- |
| K01 / P1 | planBounds übergibt alle Extents per Spread an Math.min/max. Isolierter Original-Funktionskörper unter Node 24: 20 Polylinien mit je 10.000 Punkten, etwa 3,48 MB JSON-Testdaten, RangeError. Kein vollständiger Browser-/Projektvalidator-Test dieses Datensatzes. | Grenzen iterativ bestimmen; leere/kleine/große Fälle erhalten; gültige große Fixture und Browser-Einpassen nachweisen. |
| K02 / P1 | 10-MiB-Gesamtprojektgrenze greift auch beim Commit; Base64-Bilder liegen im Projekt; JPEG-Import normalisiert nach PNG. Harte Produktgrenze aus size.ts/history.ts/import.ts. | Kapazitätsziel und versionierten Modell-/Asset-Speichervertrag anhand K03 festlegen, bevor das Limit erhöht wird. Portable Weitergabe, Altdateimigration und Windows/macOS-Adapter berücksichtigen. |
| K03 / P1 | Kein vollständiger Nachweis für Dateigröße, Gesamtpixel, Spitzenspeicher und lange History. 16 MP ist nur ein Budget pro Bild; URL-Cache begrenzt Strings, nicht den gesamten decodierten Bild-/GPU-Speicher. | Begrenzte Kapazitätsdiagnose; mehrere Rasterreferenzen, 1/10/50/100 Undo-Stände, Import/Platzierung/Bestätigung/Laden/Speichern und 2D/3D getrennt messen. |
| K04 / P1 | Auswahlbewegung ist lokal vorbereitet, andere Vorschauen laufen weiterhin über Gesamtprojektprüfungen, u. a. Wandbearbeitung, Wandzeichnen und Bildplatzierung. Statischer Codebefund. | Häufigen verbleibenden Consumer messen, anschließend einzeln an dieselbe Infrastruktur anschließen; keine neue Interaktions-/History-Engine pro Werkzeug. |
| K05 / P1 | Bestätigung laut SESSION_WALL_EXTRUSION bei 1.000 Elementen etwa 504–512 ms in einzelnen Klickmessungen, eine Materialisierung, fünf Vollvalidierungen. | Commit separat profilieren; redundante Arbeit an derselben unveränderlichen Revision begrenzt reduzieren. Vollständige Datei-/öffentliche Eingangsprüfung und sichere Veröffentlichung erhalten. |
| K06 / P2 | Betroffene Wandmenge umfasst konservativ die ganze verbundene Komponente; doppelte Konturableitung und Fensterfilter pro Wand bleiben Kandidaten. Statisch belegt, kein neuer isolierter Zeitnachweis. | Zusammenhängenden Wandzug und dichte Anschlüsse messen, Größe der betroffenen Menge protokollieren. Fachlich sichere Grenzen/Host-Indizes und gemeinsame Ableitung erst am Befund verbessern. |
| K08 / P2 | IFC-Export enthält weitere Vollprüfungen, Fensterfilter pro Wand und vollständige Ausgabestrings im Speicher. Statischer Befund, keine neue Exportzeit. | In K03 Exportzeit/Spitzenspeicher aufnehmen; Host-Index und wiederverwendbare geprüfte Ableitungen erst anhand des Profils verbessern. |
| K07 / P2 vor großem 3D-Ausbau | BimSolidView projiziert beim Draw alle Vertices auf der CPU und lädt Geometriepuffer neu; Picking durchsucht Flächen. Kein neuer 3D-Lasttest. | Kamera/Picking/mehrere Ansichten vermessen; GPU-Geometrie wiederverwenden, räumliche Suche und gezielte Aktualisierung prüfen. Kein vorab beschlossener Rendererwechsel. |


### Aktuelle Statusüberlagerung der Ergänzungskataloge

| ID | Stand / Restauftrag |
| --- | --- |
| V01 | Temporäre 2D-Distanz/Fläche/Winkel implementiert. Persistente Maße/Räume bleiben eigene Anforderungen. |
| V02 | Geplant: markierter Bereich/Skizzenoverlay + Sprache/Text + gleiche Actions, kein Pflichttraining. |
| V03 | Geplant: Live-3D-Schnitt als Anzeige, getrennt von V09-Fachcut. |
| V04 | Geplant: First-Person/Perspektive und Navigation. |
| V05 | Geplant/Teilfähigkeiten separat: Kontext-Copy/Paste/Import/Mirror/Reihenfolge. |
| V06 | 2D-Pickup für Schraffur/Wand/Fenster/Linie/Polylinie implementiert, inklusive Ebene. 3D ausgeschlossen. |
| V07 | Bibliothek/Creator/Revision/portable Anwendungen/Winkel und Modell-/Papiermaß implementiert; Musterupload/PAT, konkurrierende Publikation und zusätzliche Formate offen. |
| V08 | Bestehende Felder/Defaults gemeinsam, zukünftige Capability-Adapter und Strukturierung offen. |
| V09 | Geplant: fachliches 3D-Trimmen, Abhängigkeit zum Dach vorher klären. |
| K01 | Großpunkt-Spread-Absturz behoben, nicht erneut als unimplementierten Auftrag starten. |
| K02 | Vertrag/Pilot, geprüfte Identitätshandles und zentrale Eingangsgrenzen produktiv; Inline-Format/10MiB/Linkrefs bleiben. |
| K03 | Erste Kapazitätsbaseline vorhanden; keine umfassende Spitzenspeicher-/Langhistory-/GPU-/Großdateiabnahme. |
| K04 | Vorbereitete Auswahl-/Endpunkt-/Wandzeichenpiloten vorhanden; restliche Consumer individuell messen/anschließen. |
| K05 | Strukturierter Modellvergleich und atomare Bestätigung verbessert; globale Commit-/Dateiprüfung nicht abgeschafft. |
| K06 | Kettenendwand-/Extrusionsreuse begrenzt integriert; allgemeine verbundene Komponenten/Öffnungsindizes offen. |
| K07 | Persistente GPU-Puffer/Kameramatrix und gemeinsamer Welt-Picking-Index produktiv; Erstaufbau/Fallback/Mehrfensterlast bleiben. |
| K08 | Exportprofil/Spitzenspeicher und weitere begründete Verbesserungen bleiben offen. |

### C01–C04 – direkte Gesprächsanforderungen

| ID | Inhalt / aktueller Umfang | Abnahme |
| --- | --- | --- |
| C01 | Dezente 3D-Auswahlumrandung. Für Wandflächen implementiert; weitere Typen später über gemeinsame Edge-Ableitung. | Verdeckungsrichtig, keine Dreiecks-/Zellnähte, Fensterselektion markiert nicht fälschlich Host. |
| C02 | Reale Mikrofon-/Transkriptqualität verbessern, z.B. „Wandlänge auf sechs Meter“. | Tatsächliche Sprachtests auf Zielsystemen; simulierte Transkripte ersetzen sie nicht. |
| C03 | Glass Flow, obere Werkzeugeigenschaften, bewegliche Actions nahe Zeiger. | Keine doppelten Modelparameter; gleiche Eigenschaftsactions und FloatingPanel. |
| C04 | Polylinie Doppelklick/Enter; Wandkette jetzt ein Undo/Redo. | Abbruch, Null-/ungültige Segmente, Abschluss und noch gültiger Kontext. |

### UX01–UX03 – zusätzlich bestätigte Wünsche vom 08.10.

| ID | Anforderung | Abnahme / offene Entscheidung |
| --- | --- | --- |
| UX01 | Anschlüsse ungleicher Wandstärken und weitere zulässige Anschlussarten | Abschlussregeln vorher festlegen; beide Achsrichtungen, Öffnungen, Plan/3D/IFC, Edit/Undo/Dateirundlauf. |
| UX02 | Allgemeine 3D-Perspektive zusätzlich zur Axonometrie, in Einstellungen wählbar | Kamera/Projektion/Picking/Fang konsistent; Parameter/Persistenz/UI konkretisieren. |
| UX03 | Settings nach Benutzer/Projekt/Ansicht/Werkzeug ordnen | Ein Besitzer-/Speichervertrag, gemeinsame Fensterhülle, keine widersprüchlichen Defaults. |

### MS – Maßstab und Abbilder

MS-01: gemeinsamer Kontext/Selector; MS-02: Größen-/Schraffurpilot; MS-03: persistenter Arbeitsmaßstab außerhalb Modell-Undo; MS-03a: produktive Schraffurmodell-/Papiermaße; MS-04a: gespeicherter Ansichtsvertrag; MS-04b: gemeinsamer Arbeitskontext. Alle im genannten Umfang vorhanden. MS-04c: gespeicherte bearbeitbare Grundriss-Abbilder mit PR238 in main (927dfcf), Schema20, gemeinsame Linien/Schraffuren und unabhängige Filter. Kontextverwaltung im Folgebranch feat/document-context-management, 809 Tests bestanden. Weitere Scope-, Schnitt-, Annotations-/Layout- und Ausgabeanforderungen bleiben N05/06/20/46/49/50/57–60. Detailverträge unten.


## 5. Produktverantwortung – neue Anforderungen vom 10.10.

Der technische CAD-Strang und der begleitende Produktstrang sind gemeinsam zu pflegen. Keine Bestätigung rechtlicher Konformität; keine fertigen Rechtstexte. Rechtsquellen/Termine der Anlagen bleiben vor Release aktuell zu prüfen. Sechs Register werden als Abschnitte dieser Datei geführt, damit keine sechs zusätzlichen Planungsdateien nötig sind. Maschinelle SBOM, Distributionstexte oder Security-Meldeeinstieg dürfen bei Umsetzung separate technische Artefakte sein und verweisen auf dieses Register.


| ID | Anforderung | Status |
| --- | --- | --- |
| RC01 | Dependencies und Code-/Assetrechte inventarisieren, eigene Werke nachweisen, kommerzielle Weitergabe-/Attributions-/Quellcodepflichten tatsächlich prüfen. | Aufgenommen; technische Umsetzung/Freigaben nicht nachgewiesen |
| RC02 | Bedrohungsmodell, Import-/Archiv-/Plugin-/Lizenz-/Updategrenzen, Secret-Schutz, Schwachstellenkontakt/-prozess, sichere Updates und Supportzeitraum. | Aufgenommen; technische Umsetzung/Freigaben nicht nachgewiesen |
| RC03 | Releasegebundene tatsächliche SBOM, ergänzt um native/eingebettete Komponenten; keine Lizenz-/Sicherheitszertifizierung. | Aufgenommen; technische Umsetzung/Freigaben nicht nachgewiesen |
| RC04 | Local-first CAD, getrennte Lizenz-/Privacy-Adapter; Konto/Offlineaktivierung/Geräte/Offlinefristen/kommerzielles Modell offen. | Aufgenommen; technische Umsetzung/Freigaben nicht nachgewiesen |
| RC05 | Diagnose und Crash getrennt, aus/Opt-in/Widerruf, minimierte Daten; kostenlose klar bezeichnete Public Beta, Dauer/Folgemodell offen. | Aufgenommen; technische Umsetzung/Freigaben nicht nachgewiesen |
| RC06 | Nach Ablauf und Lizenzserverausfall unterstützte Projekte lesen/exportieren/drucken, laufende Arbeit sicher erhalten; keine Projektlöschung/-verschlüsselung. | Aufgenommen; technische Umsetzung/Freigaben nicht nachgewiesen |
| RC07 | P0-Dateisicherheit: Snapshot, Tempdatei/Prüfung/atomare Veröffentlichung, gültigen Vorgänger, Autosave/Backups/Recovery, Migration/Concurrency und Fehlertests. | Aufgenommen; technische Umsetzung/Freigaben nicht nachgewiesen |
| RC08 | Geometrie vs. Normberechnung/Produktversprechen trennen; unabhängige Referenzfälle/Einheiten/Toleranzen/große Koordinaten/Roundtrip. | Aufgenommen; technische Umsetzung/Freigaben nicht nachgewiesen |
| RC09 | Sechs laufende Register mit konkreten Nachweisen aktualisieren; externe Freigabe nicht erfinden. | Aufgenommen; technische Umsetzung/Freigaben nicht nachgewiesen |
| RC10 | Zehn vorbereitende Arbeitsbereiche und Definition of Done aus Anlage erhalten; P0 vor Komfort/externem Test, Rechts-/Steuerprüfung vor Vertrieb. | Aufgenommen; technische Umsetzung/Freigaben nicht nachgewiesen |
| SB01 | Reale Laufzeit-/transitive/native/nachgeladene Komponenten und getrennte Build-Tools erfassen. | Aufgenommen; technische Umsetzung/Freigaben nicht nachgewiesen |
| SB02 | Releaseversion/Commit/Build/Plattform/Architektur/Hash und SBOM-Generator/Schema/Zeit/ID dokumentieren. | Aufgenommen; technische Umsetzung/Freigaben nicht nachgewiesen |
| SB03 | Komponenten exakt aufgelöste Version/Herkunft/Referenz/Paketkennung/Lizenz und Beziehungen/Integrität/Lücken; Unbekanntes nicht schätzen. | Aufgenommen; technische Umsetzung/Freigaben nicht nachgewiesen |
| SB04 | Generator SPDX-JSON oder CycloneDX-JSON passend zu tatsächlichem Stack auswählen und schema-validieren. | Aufgenommen; technische Umsetzung/Freigaben nicht nachgewiesen |
| SB05 | Nach Build/Packaging erzeugen; fehlende/ungültige SBOM und ungeklärte Lizenzen blockieren externen Release. | Aufgenommen; technische Umsetzung/Freigaben nicht nachgewiesen |
| SB06 | SBOM/Notices/Hashes/Prüfbericht archivieren, realen Komponentenbestand stichprobenweise und neue Dependency im Neubuild prüfen. | Aufgenommen; technische Umsetzung/Freigaben nicht nachgewiesen |
| SB07 | Änderungs-/Schwachstellenabgleich mit betroffenen Novikov-Releases, Verantwortlichkeiten/Kontakt/Support vor Verteilung. | Aufgenommen; technische Umsetzung/Freigaben nicht nachgewiesen |
| HP01 | Anbieteridentität/Rechtsform/Anschrift/Märkte/B2B-B2C/Accounts/Lizenzen/Dienste vor Homepage klären. | Aufgenommen; technische Umsetzung/Freigaben nicht nachgewiesen |
| HP02 | Passende Anbieter-/Datenschutz-/EULA-/gegebenenfalls AGB-/Preis-/Support-/Beta-/Rechte-/Security-Inhalte veröffentlichen. | Aufgenommen; technische Umsetzung/Freigaben nicht nachgewiesen |
| HP03 | Anwendbaren Checkout/Verbraucherwiderruf/Vertragsbestätigung/Kündigung/Barrierefreiheit aktuell fachlich prüfen und umsetzen. | Aufgenommen; technische Umsetzung/Freigaben nicht nachgewiesen |
| HP04 | Transparente Beta/kein überraschender Zahlungseintritt, nach Ablauf Lese-/Export-/Druckzugriff, keine erzwungene Projektcloud, getrennte Opt-ins, belegte Marketingaussagen. | Aufgenommen; technische Umsetzung/Freigaben nicht nachgewiesen |
| HP05 | Platzhalter auflösen, rechtliche/steuerliche Freigabe sowie Download/Opt-in/Widerruf/Kontakt/Ablauf/ggf. Kauf/Kündigung praktisch prüfen und Version/Freigabedatum dokumentieren. | Aufgenommen; technische Umsetzung/Freigaben nicht nachgewiesen |

### Vollständige neue Anlagen – Detailanforderungen erhalten

Die folgenden drei Quellen werden inhaltlich unverändert aufgenommen. Ihr damaliger Hinweis „Repository nicht geprüft“ beschreibt die Erstellung der Anlage, nicht diesen Konsolidierungsauftrag. Stack/CI sind jetzt im Masterplan bekannt; aufgelöste Dependency-/Buildinventare und juristische Freigaben bleiben ungeprüft.


#### Anlage: NOVIKOV_CODEX_RELEASE_COMPLIANCE.md

 NOVIKOV CAD – Ergänzung für Codex: Release und Produktverantwortung

Stand: 10.10.2026. Grundlage: Entscheidungen des Projektinhabers in diesem Gespräch.
Status: Verbindliche Entwicklungsanforderungen und offene Entscheidungen, keine Bescheinigung rechtlicher Konformität. Die bestehende Projekt-MD und der Quellcode lagen bei Erstellung nicht vor. Dieser Nachtrag wurde noch nicht in das Repository integriert; technische Funktionen sind damit noch nicht implementiert.

#### Integration in den bestehenden Entwicklungsplan

Codex: Diesen Nachtrag vor Änderungen an Persistenz, Dependencies, Netzwerk, Telemetrie, Lizenzierung und Releases lesen. Bestehende Architektur und Dokumentation zuerst prüfen. Inhalte in passende vorhandene Dokumente integrieren, statt parallele widersprüchliche Register zu pflegen. In der zentralen Projektanweisung auf diesen Nachtrag und NOVIKOV_SBOM_KONZEPT.md verweisen. Bestehende Nutzeränderungen erhalten.

Ein technischer Entwicklungsstrang (Core, Geometrie, UI, Dateien, Rendering, Werkzeuge) und ein begleitender Produktstrang (Lizenzen, Security, Datenschutz, Tests, Veröffentlichung) werden gemeinsam gepflegt. Dokumentation muss tatsächliche Implementierung, geplante Anforderungen und ungeprüfte Annahmen unterscheiden. Keine erfundenen Komponenten, Testergebnisse oder Freigaben.

#### Festgehaltene Entscheidungen

| Gesprächspunkt | Vorgabe | Status |
|---|---|---|
| 8 | Eigene Modelle/Schraffuren bevorzugen; Herkunft und Fremdbestandteile dokumentieren | Prüfregel aufgenommen |
| 10 | Security von Anfang an dokumentieren und in Architektur berücksichtigen | beschlossen |
| 11 | SBOM-Verfahren und Release-Zuordnung aufbauen | beschlossen; separates Konzept |
| 12 | Lokale Projektdaten bevorzugen; Konto- und Lizenzmodell separat entscheiden | Kontoentscheidung offen |
| 13 | Freiwillige, transparente Diagnose und Crashberichte | beschlossen |
| 14 | Klar gekennzeichnete kostenlose Public Beta zur Stabilisierung | beschlossen; Termin offen |
| 15 | Dauer, Ende und kostenpflichtiges Folgemodell später festlegen | ausdrücklich offen |
| 16 | Nach Lizenzablauf Projekte weiter öffnen, exportieren und drucken | beschlossen |
| 19 | Homepage-Anforderungen separat vorbereiten | separate Datei |
| 22 | Dateisicherheit und Wiederherstellung haben höchste Priorität | beschlossen |
| 24/25 | Produktanforderungen laufend pflegen; sechs Register führen | beschlossen |
| 30 | Zehn vorbereitende Arbeitsbereiche in den Plan aufnehmen | unten konkretisiert |

#### 1. Dependencies und Lizenzregister

Jede neue Bibliothek, transitive Abhängigkeit und externe Ressource erfassen. Eigener Code wird durch diese Anweisung nicht unter eine Open-Source-Lizenz gestellt. Vor Auslieferung tatsächliche Bedingungen prüfen, einschließlich Weitergabe, Änderungen, Verlinkung, Attribution, Lizenztexten und möglichen Quellcodepflichten.

Eigene 3D-Modelle und Schraffuren reduzieren den Bedarf an Fremdlizenzen, sofern sie eigenständig geschaffen sind und keine fremden geschützten Bestandteile enthalten. Selbst nachmodellierte Designmöbel, nachgezeichnete Muster, fremde Texturen, Logos und aus anderen CAD-Produkten exportierte Bibliotheken gelten nicht automatisch als frei. Auch Nutzungsbedingungen eingesetzter Erstellungswerkzeuge prüfen. Kein pauschales Freigeben allein wegen „selbst erstellt“.

Für eigene Assets Entstehungsdateien, Autor, Datum, Vorlagen und verwendete Fremdbestandteile dokumentieren. Einfache geometrische Muster nicht pauschal als schutzfähig oder schutzfrei einstufen. Eine SBOM ersetzt das Asset- und Lizenzregister nicht.

#### 2. Security und sichere Updates

Security-Dokumentation proportional zum Entwicklungsstand führen. Bedrohungsmodell mindestens für Projektimporte, Archive, Parser, Plugins/Skripte, Exporte, Lizenzprüfung und Updates erstellen. Netzwerkgrenzen, externe Dienste, gespeicherte Geheimnisse und Vertrauensannahmen sichtbar machen.

- Fremde Dateien als nicht vertrauenswürdig behandeln; Größen-, Pfad-, Ressourcen- und Schema-Prüfungen vorsehen.
- Keine Zugangsdaten oder privaten Signaturschlüssel in Repository, Client oder Logs ablegen.
- Release- und Update-Integrität prüfen; fehlerhafte oder manipulierte Updates ablehnen. Wiederherstellung nach Updatefehlern planen.
- Abhängigkeiten regelmäßig auf bekannte Schwachstellen prüfen; Treffer bewerten, statt automatisch jedes Paket unkontrolliert zu aktualisieren.
- Sicherheitsmeldungen erfassen, priorisieren, betroffene Versionen zuordnen, beheben und dokumentieren. Kontaktweg vor externer Bereitstellung festlegen.
- Supportzeitraum und Verfahren für Sicherheitsupdates vor Veröffentlichung festlegen; nicht mit Beta-Laufzeit gleichsetzen.

CRA-Anwendungsbereich, Übergangsregeln, Produktkategorie, mögliche Meldepflichten und spätere Konformitätsanforderungen vor externer Bereitstellung fachlich prüfen. Kostenlosigkeit oder die Bezeichnung Beta nicht als automatische Ausnahme behandeln. Die EU nennt 11.09.2026 für Meldepflichten und 11.12.2027 für die Hauptpflichten. Diese Dokumente allein erfüllen die gesetzlichen Anforderungen nicht.

#### 3. SBOM

Das beigefügte NOVIKOV_SBOM_KONZEPT.md ist Teil dieses Nachtrags. Vor dem ersten verteilten Build aus realen Build- und Paketdaten eine maschinenlesbare Komponentenliste erzeugen. Bis das Repository geprüft wurde, bleibt die Komponentenliste ausdrücklich unbefüllt.

#### 4. Datenschutz, Local First und Konten

Projektbearbeitung und Projektspeicherung sollen grundsätzlich lokal möglich sein. Ein Lizenzkonto erfordert keine Cloudspeicherung von CAD-Dateien. Lizenzierung als separaten Dienst/Adapter anlegen; Geometrie, Dateiformat und Wiederherstellung dürfen keine versteckte Kontoabhängigkeit erhalten.

Noch zu entscheiden: signierte Offline-Lizenzdatei, Online-Aktivierung ohne dauerhaftes Konto oder Konto mit Lizenzverwaltung. Ebenso offen: Gerätebindung, Gerätewechsel, Offline-Frist, Abo/Dauerlizenz und Umgang mit Betriebseinstellung. Keine Kontopflicht, Preise, Fristen oder Zahlungsumstellung erfinden.

Für jede Datenverarbeitung Zweck, Datenfelder, Empfänger, Rechtsgrundlage, Speicherfrist und Löschverfahren festhalten. Lizenzdaten und Diagnosedaten trennen. Keine Projektinhalte für Lizenzprüfung übertragen. Beim Einsatz externer Anbieter Datenschutzrollen, Verträge und Übermittlungen prüfen.

#### 5. Freiwillige Diagnose und Beta

Nutzungsdiagnosen und Crashberichte getrennt anbieten, standardmäßig deaktiviert. Einwilligungsbasierte optionale Übertragung erst nach aktiver Zustimmung; Widerruf leicht erreichbar. Keine Nachteile für normale CAD-Nutzung bei Ablehnung.

Vor Versand offenlegen, welche Daten übertragen werden. Dateipfade, Nutzernamen, Tokens, Projektinhalte und Speicherabbilder können sensible Inhalte enthalten: vermeiden oder vor Versand bereinigen; technische Grenzen dokumentieren. „Anonym“ nur verwenden, wenn dies tatsächlich nachgewiesen ist; pseudonyme Daten nicht als anonym bezeichnen. Manuelle Fehlerberichte ermöglichen.

Kostenlose Public Beta deutlich als Vorabversion kennzeichnen. Bekannte Einschränkungen, unterstützte Systeme, Dateikompatibilität und Rückmeldeweg dokumentieren. Reale Projekte nur unter klar kommunizierten Testbedingungen verwenden; Backups und Wiederherstellungsverfahren müssen vorher funktionieren. Vorgelagerte kleine Testgruppe als Planungsoption, keine festgelegte Nutzerzahl.

Der Übergang zu kostenpflichtigen Lizenzen bleibt offen. Keine automatische Zahlungspflicht oder überraschende Projektsperre implementieren. Vor Start der Beta müssen die konkret verwendeten Bedingungen bekannt sein.

#### 6. Zugriff nach Lizenzablauf

Lesen, Exportieren und Drucken vorhandener unterstützter Projekte bleiben ohne aktive Bearbeitungslizenz möglich. Bearbeiten und Neuanlegen dürfen nach später festzulegenden Lizenzbedingungen eingeschränkt werden. Diese Trennung auf Anwendungsebene durchsetzen und testen; Projekte nicht durch Lizenzablauf verschlüsseln, löschen oder verändern.

Lesen/Export/Druck müssen auch bei ausgefallenem Lizenzserver funktionieren. Unterstützte Exportformate und mögliche Informationsverluste vor Release festlegen. Eine laufende Arbeit bei Statuswechsel nicht abrupt verwerfen; sichere Speicherung/Wiederherstellung ermöglichen.

#### 7. Dateisicherheit und Versionierung – höchste technische Priorität

Speichern soll einen konsistenten Projektzustand erfassen, in eine temporäre Datei am geeigneten Speicherort schreiben, deren Integrität prüfen und erst anschließend die Zieldatei atomar ersetzen, soweit das Zielsystem dies unterstützt. Persistenzgarantien pro Plattform und Dateisystem prüfen; atomare Umbenennung allein garantiert keine Sicherheit bei Stromausfall.

- Letzten gültigen Stand erhalten; fehlgeschlagene Speicherung darf ihn nicht überschreiben.
- Autosaves getrennt von der Hauptdatei schreiben und Wiederherstellung nach Absturz anbieten.
- Versionierte Sicherungen, Aufbewahrung, Wiederherstellungsdialog und verständliche Fehlermeldungen vorsehen.
- Format-/Schemaversion, Einheiten, Koordinatenkonventionen und Integritätsprüfung definieren.
- Migrationen versioniert und getestet ausführen; Original vor Migration sichern. Unbekannte neuere Formate nicht destruktiv überschreiben.
- Gleichzeitige Schreibzugriffe erkennen; Netzwerk- und synchronisierte Speicherorte gesondert betrachten.

Abnahmetests: Abbruch während Speicherung, voller Datenträger, fehlende Rechte, beschädigte/trunkierte Datei, konkurrierender Zugriff und fehlgeschlagene Migration. Erfolg bedeutet: letzter gültiger Stand bleibt nutzbar oder kann nachvollziehbar wiederhergestellt werden. Backup und Recovery auch praktisch testen.

#### 8. Geometrie, fachliche Berechnungen und Product Claims

Geometrische Berechnung von normbezogener Fachauswertung trennen. Polygonfläche ist keine zugesicherte Wohnfläche nach WoFlV. Keine Behauptungen über Statik, Brandschutz, Zertifizierung oder Normkonformität ohne passenden Umfang, Prüfung und Nachweis.

Für kritische Geometrie unabhängige Referenzfälle testen: Einheiten, Maßstäbe, Rundung, große Koordinaten, kleine Abstände, degenerierte Geometrien sowie Import-/Export-Rundläufe. Numerischen Datentyp nicht mit garantierter Messgenauigkeit gleichsetzen; Toleranzen und Gültigkeitsbereich ausweisen.

#### 9. Die sechs laufenden Register

Bei Integration unter docs/product/ anlegen oder vorhandene gleichwertige Dateien ergänzen. Die folgenden Tabellen sind Startvorlagen, keine bereits geprüfte Bestandsaufnahme.

##### 01_DEPENDENCIES.md

| Komponente/Version | Quelle/Lockfile | direkt/transitiv | Einsatzbereich | ausgeliefert? | Security-Status/Nachweis |
|---|---|---|---|---|---|
| Noch aus Repository zu ermitteln | offen | offen | offen | offen | ungeprüft |

##### 02_LICENSE_REGISTER.md

| Code/Asset/Version | Autor/Quelle | Lizenz/Rechtenachweis | geändert? | Verteilung/kommerzielle Nutzung | Pflichten | Freigabestatus |
|---|---|---|---|---|---|---|
| Noch zu inventarisieren | offen | offen | offen | zu prüfen | zu prüfen | ungeprüft |

##### 03_SECURITY.md

| Risiko/Schwachstelle | betroffene Version | Auswirkung | Maßnahme | Verantwortlich | Termin | Nachweis/Status |
|---|---|---|---|---|---|---|
| Erstes Bedrohungsmodell erstellen | offen | offen | Datenflüsse und Angriffsflächen prüfen | Projektinhaber | vor externem Test | geplant |

##### 04_PRIVACY.md

| Verarbeitung | Zweck/Daten | Empfänger | Rechtsgrundlage | Aufbewahrung/Löschung | Einwilligung/Widerruf | Status |
|---|---|---|---|---|---|---|
| Lizenzverwaltung | Modell offen | offen | zu prüfen | zu definieren | modellabhängig | offen |
| Optionale Diagnose | minimierte Fehlerdaten | offen | zu prüfen | zu definieren | getrenntes Opt-in | beschlossen, nicht implementiert |

##### 05_RELEASE_REQUIREMENTS.md

| Freigabekriterium | Nachweis | Status |
|---|---|---|
| Speicher-/Recovery- und Migrationstests erfolgreich | Testbericht je Build | offen |
| Kritische Geometrie geprüft | Referenztests und Toleranzen | offen |
| Rechte und Notices geklärt | Register und ausgelieferte Lizenztexte | offen |
| SBOM passt zum Artefakt | Build-ID, Hash, validierte SBOM | offen |
| Security-Bewertung und Updateweg geprüft | Risikobewertung/Testprotokoll | offen |
| Datenschutz/Beta/Lizenzbedingungen passend | fachliche Prüfung | offen |
| Lesen/Export/Druck nach Ablauf und offline möglich | Abnahmetests | offen |

##### 06_PRODUCT_CLAIMS.md

| Funktion/Aussage | tatsächlicher Status | Norm/Version | Gültigkeitsbereich/Toleranz | Testnachweis | zulässige Kommunikation |
|---|---|---|---|---|---|
| Bestand aus Code ermitteln | ungeprüft | offen | offen | fehlt | bis Prüfung keine Zusicherung |

Ergänzend SECURITY.md als Einstieg für Sicherheitsmeldungen, THREAT_MODEL.md, RELEASE_PROCESS.md und VULNERABILITY_PROCESS.md erstellen, soweit nicht bereits gleichwertig vorhanden. Inhalte verlinken statt duplizieren. THIRD_PARTY_NOTICES und erforderliche Lizenztexte aus dem geprüften Register für die Distribution bereitstellen.

#### 10. Arbeitsreihenfolge und Definition of Done

1. Vorhandenen Code und Projektplan sichten; Status der zehn Bereiche aus Punkt 30 erfassen: Dependencies/Lizenzen, Security, Local First, Persistenz, Berechnungstrennung, Geometrietests, Releases/Versionierung, Claims, Beta/Telemetrie, externe Rechts-/Steuerprüfung.
2. Register und Security-Einstieg integrieren; echte Abhängigkeiten ermitteln und SBOM-Erzeugung passend zum Stack auswählen.
3. Dateisicherheit und kritische Geometrietests priorisieren; Risiken vor neuen Komfortfunktionen bearbeiten.
4. Konto-/Lizenzentscheidung vorbereiten, ohne jetzt einen Anbieter oder kommerzielle Konditionen festzulegen.
5. Vor Public Beta technische Freigabekriterien erfüllen und relevante Bedingungen sowie steuerliche/gewerbliche Fragen fachlich prüfen lassen.

Jede einschlägige Änderung aktualisiert die betroffenen Register und liefert angemessene Tests/Nachweise. Datenverlust und unerkannte falsche Maße sind Freigabeblocker. Sicherheitsbefunde nach tatsächlichem Risiko bewerten. Codex darf technische Arbeit umsetzen und dokumentieren, aber keine rechtliche Prüfung oder Produktfreigabe als erfolgt ausgeben, wenn der Nachweis fehlt.

#### Quellen und Einordnung

Arbeitsstand Deutschland/EU, keine individuelle Rechtsberatung; Rechtsprüfung vor Veröffentlichung aktualisieren.

- UrhG § 23: https://www.gesetze-im-internet.de/urhg/__23.html
- DesignG § 38: https://www.gesetze-im-internet.de/geschmmg_2004/__38.html
- EU-Kommission, CRA: https://digital-strategy.ec.europa.eu/en/policies/cyber-resilience-act

Die frühere Aussage zum konkreten deutschen Produkthaftungs-Gesetzgebungsverfahren wird hier nicht als geprüfte Tatsache übernommen. Anwendbares Haftungsrecht vor Release gesondert prüfen.



#### Anlage: NOVIKOV_HOMEPAGE_ANFORDERUNGEN.md

 NOVIKOV CAD – Anforderungen für die spätere Homepage

Stand: 10.10.2026. Separates Planungsdokument zu Gesprächspunkt 19.
Status: Checkliste für spätere Umsetzung; keine fertigen AGB, EULA oder Datenschutzerklärung. Website, Verkauf und Accounts werden durch diese Datei nicht aktiviert. Rechtslage und konkretes Geschäftsmodell vor Veröffentlichung erneut prüfen.

#### Vor der Umsetzung zu klären

- Anbieteridentität, Rechtsform, Geschäftsanschrift und Kontakt.
- Zielmärkte und B2B/B2C-Ausrichtung; keine Entscheidung vorwegnehmen.
- Konto-, Aktivierungs-, Geräte- und Lizenzmodell.
- Beta-Dauer, Ablaufregelung, späterer Preis und Vertragslaufzeit: ausdrücklich offen.
- Zahlungs-, Hosting-, Support- und sonstige Dienstleister sowie deren Datenflüsse.

#### Seiten und Inhalte

| Bereich | Anforderung | Freigabe/Nachweis |
|---|---|---|
| Impressum | Anbieterangaben und Kontakt leicht auffindbar, unmittelbar erreichbar, dauerhaft verfügbar; zusätzliche Angaben je Anbieterform | Angaben fachlich geprüft |
| Datenschutz | Tatsächliche Verarbeitung durch Website, Accounts, Zahlung, Support und Diagnose beschreiben; Daten, Zwecke, Rechtsgrundlagen, Empfänger, Fristen und Rechte | Datenflussprüfung und passende Erklärung |
| Lizenzbedingungen/EULA | Umfang der Nutzung, Geräte, Laufzeit, Updates, Support, Beta-Einschränkungen und Folgen des Ablaufs | Prüfung für tatsächliches Modell |
| AGB, sofern eingesetzt | Vertragsregeln passend zu Angebot und Zielgruppe; zugänglich und wirksam einbezogen | rechtliche Prüfung |
| Preise/Lizenzen | Gesamtpreis und anwendbare Steuern, Zahlungsrhythmus, Dauer, Verlängerung/Kündigung sowie Funktionsumfang transparent | endgültiges Modell beschlossen |
| Support/Updates | Kontakt, unterstützte Systeme/Versionen, Updateversorgung und Supportzeitraum nachvollziehbar erklären | technisch und organisatorisch leistbar |
| Beta-Download | Vorabstatus, Einschränkungen, Kompatibilität, Backup-Hinweise, Bedingungen und Feedbackweg | Beta-Freigabe |
| Rechtehinweise | Drittanbieter-Lizenzen und erforderliche Attributionen zugänglich machen | geprüftes Lizenzregister |
| Sicherheit | Meldeweg für Schwachstellen und unterstützte Versionen bereitstellen | funktionierender Meldeprozess |

#### Checkout und Verbraucherfunktionen – soweit anwendbar

Vor Vertragsschluss erforderliche Produkt-, Preis- und Vertragsinformationen bereitstellen. Bei zahlungspflichtiger Verbraucherbestellung eindeutige Bestätigung der Zahlungspflicht vorsehen. Widerrufsbelehrung, Formular und gegebenenfalls Zustimmung zum vorzeitigen Beginn digitaler Bereitstellung einschließlich Kenntnisbestätigung und Vertragsbestätigung rechtlich passend umsetzen. Kein pauschaler Satz „Software ist vom Widerruf ausgeschlossen“.

Bei Abonnements die jeweils erforderlichen Kündigungs-/Widerrufsfunktionen und weitere aktuelle Verbraucherpflichten gesondert prüfen. Auch Barrierefreiheitsanforderungen und etwaige Ausnahmen für das konkrete Angebot prüfen. Diese Checkliste ist nicht abschließend.

#### Produktentscheidungen, die die Homepage abbilden muss

- Kostenlose Public Beta wird klar als Vorabversion bezeichnet.
- Keine Umstellung auf Zahlung ohne zuvor geklärte und transparent vereinbarte Bedingungen.
- Nach Lizenzablauf bleiben vorhandene unterstützte Projekte lesbar, exportierbar und druckbar.
- Keine Cloudspeicherung von Projekten allein wegen eines Lizenzkontos voraussetzen.
- Optionale Nutzungsdiagnose und Crashberichte getrennt und standardmäßig ausgeschaltet; keine vorangekreuzten Zustimmungen.
- Marketingaussagen müssen dem geprüften Funktionsstand entsprechen. Keine pauschalen Genauigkeits-, Normkonformitäts- oder Zertifizierungsversprechen.
- Rechtlich erforderliche Einwilligungen für optionale Tracking-Technologien vor deren Einsatz einholen; keine unnötigen Tracker als Standard einbauen.

#### Freigabe vor Veröffentlichung

Alle Platzhalter auflösen. Bedingungen, Datenschutzstruktur und Vertrieb durch fachkundige Beratung prüfen lassen; Gewerbe-/Steuerfragen mit Steuerberatung klären. Download, Opt-in/Widerruf, Kontakt, Lizenzablauf und gegebenenfalls Kauf-/Kündigungsprozess praktisch testen. Textversionen und Freigabedatum dokumentieren. Keine ungeprüften Rechtstexte als produktionsreif behandeln.

#### Offizielle Ausgangsquellen

- Impressum: https://www.gesetze-im-internet.de/ddg/__5.html
- Elektronischer Geschäftsverkehr mit Verbrauchern: https://www.gesetze-im-internet.de/bgb/__312j.html
- Widerruf bei digitalen Inhalten: https://www.gesetze-im-internet.de/bgb/__356.html

Diese Quellen ersetzen nicht die Prüfung weiterer anwendbarer Vorschriften zum tatsächlichen Veröffentlichungszeitpunkt.



#### Anlage: NOVIKOV_SBOM_KONZEPT.md

 NOVIKOV CAD – SBOM-Konzept und Umsetzungsvorgabe

Stand: 10.10.2026. Zugehörig: NOVIKOV_CODEX_RELEASE_COMPLIANCE.md.
Status: Konzept angelegt; keine fertige SBOM. Ohne Repository, Paketauflösung und Build-Artefakte können keine tatsächlichen Komponenten oder Versionen angegeben werden.

#### Ziel

Für jeden extern verteilten Build eine maschinenlesbare Software Bill of Materials erzeugen und mit dem tatsächlichen Release archivieren. Sie unterstützt Sicherheitsanalyse, Lizenzprüfung und die Zuordnung betroffener Produktversionen. Eine Komponentenliste ist kein Sicherheits- oder Konformitätszertifikat.

#### Umfang

Direkte und transitive Laufzeitabhängigkeiten, native Bibliotheken, eingebettete Laufzeiten, gebündelte SDKs und separat mitgelieferte Programme berücksichtigen. Entwicklungs-/Build-Werkzeuge getrennt kennzeichnen. Dynamisch nachgeladene Komponenten und Plugins mit ihrem eigenen Versions-/Auslieferungsstand erfassen. Assets zusätzlich im Lizenzregister pflegen; ein Paketmanager sieht nicht alle Fonts, Texturen und Modelle.

#### Erforderliche Angaben

| Ebene | Felder |
|---|---|
| Release | Produktversion, Commit, Build-ID, Plattform/Architektur, Zeitpunkt, Hash des ausgelieferten Artefakts |
| SBOM | Format und Schemaversion, Generator/Version, Erstellungszeitpunkt, eindeutige Dokumentkennung |
| Komponente | Name, exakt aufgelöste Version, Herkunft/Lieferant soweit bekannt, eindeutige Referenz, Paketkennung soweit verfügbar |
| Beziehungen | direkte/transitive Abhängigkeiten und Zuordnung zum Produkt |
| Integrität | Hashes der tatsächlich vorliegenden Komponenten/Artefakte, soweit ermittelbar |
| Rechte | erkannte/deklarierte Lizenz mit Herkunft; geprüfte Bewertung separat im Lizenzregister |
| Einschränkungen | fehlende Daten, nicht erfasste Komponenten und ungeprüfte Befunde ausdrücklich nennen |

Unbekannte Lizenz oder Version nicht schätzen. Erkannte Metadaten sind keine juristische Freigabe.

#### Codex-Arbeitsauftrag für das Repository

1. Paketmanager, Lockfiles, native Builds, Verpackung und Zielplattformen feststellen.
2. Einen zum Stack passenden Generator für CycloneDX-JSON oder SPDX-JSON auswählen; Entscheidung und Version dokumentieren. Schema erst bei Integration konkret festlegen und validieren.
3. Aus aufgelösten Abhängigkeiten und dem tatsächlich verpackten Build generieren; reine Manifest-Auswertung nicht als vollständige Erfassung ausgeben.
4. Fehlende eingebettete Komponenten ergänzen und Abhängigkeitsbeziehungen überprüfen.
5. CI-Schritt nach Build/Packaging einführen. Fehlende/ungültige SBOM verhindert externen Release; unklare Lizenzen werden vor Auslieferung geklärt.
6. SBOM, Lizenztexte, Build-Zuordnung und Release-Prüfbericht gemeinsam archivieren. Zugang und Veröffentlichungsumfang separat festlegen; keine Geheimnisse oder privaten Pfade aufnehmen.
7. Änderungen zur vorherigen Version prüfen und Komponenten regelmäßig mit Schwachstelleninformationen abgleichen; Betroffenheit dokumentiert bewerten.

#### Abnahme

- Schema-valides Dokument ist vorhanden und eindeutig dem verteilten Artefakt zugeordnet.
- Stichproben bestätigen, dass reale direkte, transitive und native Komponenten erfasst sind.
- Neu hinzugefügte Dependency erscheint nach erneutem Build in der SBOM.
- Nicht automatisch erkennbare Bestandteile sind ergänzt oder als Lücke ausgewiesen und vor Freigabe bewertet.
- Ein bekannter Komponentenbefund lässt sich betroffenen NOVIKOV-Releases zuordnen.
- Keine nicht vorhandenen Komponenten und keine pauschale Behauptung „alle Lizenzen geprüft“.

#### Noch offen

Technologiestack, Generator, Schema-Version, CI-System, Artefaktablage und Verantwortungs-/Prüfablauf. Diese Angaben erst nach Sichtung des Repositories ausfüllen. Sicherheitskontakt und Supportzeitraum gemeinsam mit dem Release-Prozess festlegen.




### Laufende Produktregister – zunächst bewusst ohne erfundene Befunde

#### Register 01 – Dependencies

| Komponente/Version | Quelle | direkt/transitiv | ausgeliefert | Security/Nachweis |
| --- | --- | --- | --- | --- |
| Stack festgestellt, tatsächliche Paketauflösung noch zu inventarisieren | package.json / bun.lock, main-Referenz | offen | Packaging offen | Keine SBOM oder Lizenzfreigabe erzeugt |

#### Register 02 – Code-/Assetlizenzen

| Code/Asset/Version | Autor/Quelle | Rechte/Lizenz | Änderung/Weitergabe/Pflichten | Freigabe |
| --- | --- | --- | --- | --- |
| Tatsächlichen Bestand inventarisieren | offen | ungeprüft | vor Distribution klären | offen |

#### Register 03 – Security

| Risiko | betroffene Version | Maßnahme | Verantwortlicher/Termin | Nachweis |
| --- | --- | --- | --- | --- |
| Imports/Parser/Archive, Persistenz, Updates, Plugins, Lizenzdienste | Architekturflächen; kein hier nachgewiesener Exploit | Erstes konkretes Bedrohungsmodell/Trust-Grenzen | Projektverantwortung zuordnen; vor externem Test | geplant |

#### Register 04 – Datenschutz

| Verarbeitung | Zweck/Daten | Empfänger/Rechtsgrundlage | Frist/Löschung/Zustimmung | Status |
| --- | --- | --- | --- | --- |
| Lizenzverwaltung | separat zu definieren; keine Projektinhalte | Modell/Anbieter offen | modellabhängig | Entscheidung offen |
| Optionale Diagnose/Crash | getrennt/minimiert, sensible Inhalte bereinigen | zu definieren/prüfen | aus, getrenntes Opt-in/Widerruf, Fristen offen | Anforderung beschlossen, nicht implementiert |
| Externe AI/Dokumentanalyse | genau zu definierende projektbezogene Übermittlung | Provider/Datenrollen offen | Rechte/Zustimmung/Fristen vor Pilot klären | geplant |

#### Register 05 – Externe Releasefreigabe

| Gate | benötigter Nachweis | Status |
| --- | --- | --- |
| Dateisicherheit/Recovery/Migration | Abbruch, voller Datenträger, Rechte, beschädigte Datei, Konkurrenz, fehlerhafte Migration; letzter gültiger Stand | offen |
| Fachgeometrie/Toleranzen/Claims | unabhängige Referenzfälle und definierter Gültigkeitsbereich | Teiltests vorhanden; gesamte Releasefreigabe offen |
| Rechte/Notices | vollständiges geprüftes Code-/Assetregister und ausgelieferte Hinweise | offen |
| SBOM/Integrität | reales Artefakt, Build-ID/Hash, schema-valide SBOM | offen |
| Security/Updates/Support | Risikobewertung, Update-/Recoverytest, Kontakt/Zeitraum | offen |
| Datenschutz/Beta/Lizenzen/Homepage | tatsächliche Datenflüsse/Bedingungen, fachliche Prüfung | offen |
| Ablauf-/Offlinezugriff | Lesen/Export/Druck ohne gültige Bearbeitungslizenz oder erreichbaren Server | offen |

#### Register 06 – Produktversprechen

| Aussage/Funktion | tatsächlicher Umfang | Regel/Toleranz | Beleg | zulässige Kommunikation |
| --- | --- | --- | --- | --- |
| Aktueller Entwicklungsprototyp | Bestand im Masterplan §4 | kein allgemeines Norm-/Großdatenversprechen | dortige Commit-/Testquellen | nur konkret vorhandenen Umfang benennen |
| Autonome AI-CAD-Entwürfe | Hauptvision, nicht implementiert | Quellen/Unsicherheit/Fachregeln erst aufbauen | Zielabnahme A11/AI | als Entwicklungsziel kennzeichnen |
| Automatische Wohnfläche | nicht implementiert | geprüftes versioniertes WoFlV-Profil fehlt | N35/Guide-F01 | keine fertige Wohnflächen-/Normzusage |
| Große Dateien | 10MiB-Produktlimit, begrenzte Diagnoseprofile | keine 200–300MB-Zusage | K03/CAPACITY_BASELINE historisch | gemessene Szenarien/Hardware nennen |


## 6. Zusammengeführte Detailverträge

Diese Quellenkapseln erhalten die präzisen Regeln, Grenzen, offenen Wünsche und Akzeptanzfälle. Jede Kapsel ist ein datierter Originaltext; der Masterplan und aktuelle Statusüberlagerungen oben bestimmen, welche Passagen weiter gelten. Alte Folgeaufträge, Planungsstatus und Schemaangaben sind historische Evidenz. Inhaltliche Pflege künftig im passenden Registerabschnitt; ursprüngliche Datei als Herkunft, keine zweite aktiv gepflegte Prioritätenquelle.


### Detail D01 – F13_HILFLINIENSYSTEM.md

Herkunft: `F13_HILFLINIENSYSTEM.md`, Snapshot main/PR237. Altstatus nicht als aktuelle Fertigmeldung lesen.

#### F13 Hilfliniensystem

Status: aufgenommen, noch nicht implementiert. Umsetzung gemäß Nutzerwunsch zu einem geeigneten späteren Zeitpunkt. Die folgenden Anforderungen sind der vollständig übernommene Nutzerinhalt aus der Anlage „Eingefügter Text.txt“. Imperative darin beschreiben die spätere Implementierung und starten sie nicht automatisch.

#### Vollständige Anforderungen

Implementiere für NOVIKOV CAD ein professionelles, intelligentes Raster-, Fang- und Hilfsliniensystem für präzises geometrisches Zeichnen.

Orientiere dich beim Bediengefühl an etablierten Architektur-CAD-Systemen wie Archicad und Allplan. Die konkrete Implementierung soll eigenständig sein. Ziel ist kein einfaches sichtbares Raster, sondern ein intelligentes CAD-Tracking-System, das die wahrscheinliche geometrische Absicht des Benutzers erkennt und während des Zeichnens dynamisch passende Fangpunkte und temporäre Hilfslinien anbietet.

#### 1. Grundprinzip

Das System soll permanent die Position des Mauszeigers in Relation zur vorhandenen Geometrie analysieren.

Es soll relevante geometrische Punkte und Beziehungen erkennen, darunter insbesondere:

- Endpunkte
- Startpunkte
- Mittelpunkte
- Segmentmittelpunkte
- Schnittpunkte
- Eckpunkte
- Kreismittelpunkte
- Bogenmittelpunkte
- Tangentialpunkte
- Lotpunkte
- Punkte auf vorhandenen Linien oder Kanten
- Rasterpunkte
- benutzerdefinierte Referenzpunkte

Befindet sich der Mauszeiger innerhalb eines definierten Fangradius um einen relevanten Punkt, soll dieser Punkt visuell hervorgehoben werden.

Verweilt der Mauszeiger für eine konfigurierbare Zeit X in der Nähe dieses Punktes, wird der Punkt automatisch als temporärer Tracking-/Referenzpunkt aktiviert.

Wichtig:

Der Benutzer muss den Punkt dafür nicht anklicken.

Hover + kurze Verweildauer reichen aus.

Beispiel:

1. Maus bewegt sich in die Nähe einer Wandecke.
2. Die Ecke wird als Fangpunkt erkannt und markiert.
3. Der Benutzer verweilt beispielsweise 300–500 ms in deren Nähe.
4. Der Punkt wird als temporärer Referenzpunkt gespeichert.
5. Bewegt der Benutzer anschließend die Maus weg, entstehen aus diesem Punkt automatisch geometrisch sinnvolle Hilfslinien.

Die Hover-Zeit muss später über eine zentrale CAD-Einstellung konfigurierbar sein.

#### 2. Intelligente temporäre Hilfslinien

Aus aktivierten Referenzpunkten sollen dynamisch Hilfslinien entstehen.

Das System soll insbesondere folgende Beziehungen erkennen:

- horizontal
- vertikal
- parallel zu vorhandener Geometrie
- lotrecht / orthogonal zu vorhandener Geometrie
- Verlängerung vorhandener Linien
- Winkelbeziehungen
- Tangenten
- Fluchten
- Achsen
- Schnittpunkte mehrerer Hilfslinien
- definierte Winkelraster
- Abstände zu Referenzpunkten

Die Hilfslinien existieren nur temporär und sollen automatisch verschwinden, sobald sie für die aktuelle Zeichenoperation nicht mehr relevant sind.

#### 3. Automatische Erkennung der Zeichenabsicht

Das System soll nicht einfach alle mathematisch möglichen Hilfslinien gleichzeitig anzeigen.

Es soll anhand der Mausbewegung priorisieren, welche geometrische Beziehung der Benutzer wahrscheinlich herstellen möchte.

Beispiele:

Bewegt sich der Cursor annähernd horizontal von einem aktivierten Referenzpunkt weg, soll die horizontale Hilfslinie bevorzugt werden.

Bewegt sich der Cursor annähernd vertikal, soll die vertikale Hilfslinie bevorzugt werden.

Bewegt sich der Cursor annähernd parallel zu einer vorhandenen Wand oder Linie, soll eine Parallelführung angeboten werden.

Bewegt sich der Cursor ungefähr im rechten Winkel zu einer vorhandenen Kante, soll automatisch eine lotrechte Führung angeboten werden.

Befindet sich der Cursor in der Nähe einer sinnvollen Winkelbeziehung, soll der entsprechende Winkel erkannt und angeboten werden.

Die Priorisierung soll aus einer Kombination folgender Faktoren entstehen:

- Abstand des Cursors zur möglichen Fangposition
- Winkelabweichung
- Bewegungsrichtung des Cursors
- zuletzt aktivierte Referenzpunkte
- Nähe vorhandener Geometrie
- geometrische Relevanz
- aktuell verwendetes Werkzeug

Vermeide visuelles Flackern oder permanentes Umschalten zwischen konkurrierenden Fangmöglichkeiten.

Verwende dafür sinnvolle Toleranzen und Hysterese.

#### 4. Winkel-Tracking

Implementiere dynamisches Winkeltracking.

Standardmäßig sollen unter anderem folgende Winkel einfach fangbar sein:

0°
30°
45°
60°
90°
120°
135°
150°
180°
270°

Die Architektur muss jedoch beliebige Winkelintervalle und benutzerdefinierte Winkel unterstützen.

Wird ein Winkel erkannt, soll eine temporäre Hilfslinie vom aktuellen Referenzpunkt in diese Richtung angezeigt werden.

Der erkannte Winkel soll optional direkt am Cursor angezeigt werden.

#### 5. Parallel- und Lot-Erkennung

Bewegt sich der Cursor relativ zu einer bestehenden Linie, Kante oder Wand, soll das System erkennen können, ob der Benutzer wahrscheinlich:

- parallel dazu zeichnen möchte
- lotrecht dazu zeichnen möchte
- die Linie verlängern möchte
- deren Flucht übernehmen möchte

Diese Beziehungen sollen visuell eindeutig unterschieden werden können.

Die mathematische Beziehung muss exakt sein.

Die Mausbewegung dient lediglich dazu, die gewünschte Beziehung zu erkennen. Sobald die Beziehung aktiv ist, muss die daraus berechnete Geometrie mathematisch exakt parallel, orthogonal oder kollinear sein.

#### 6. Mehrere Referenzpunkte

Das System muss mehrere temporär aktivierte Referenzpunkte gleichzeitig unterstützen.

Beispiel:

Der Benutzer aktiviert durch Hover Punkt A.

Danach aktiviert er Punkt B.

Beim weiteren Bewegen des Cursors können Hilfslinien aus A und B entstehen.

Schneiden sich zwei aktive Hilfslinien, muss deren Schnittpunkt automatisch als temporärer Fangpunkt erkannt werden.

Damit müssen Konstruktionen möglich sein wie:

„Horizontal von Punkt A und vertikal von Punkt B.“

Der resultierende Schnittpunkt muss exakt berechnet und fangbar sein.

#### 7. Visuelles Feedback

Jeder Zustand muss für den Benutzer sofort verständlich sein.

Unterscheide visuell zwischen:

- erkanntem Fangpunkt
- aktiviertem Trackingpunkt
- temporärer Hilfslinie
- aktuell bevorzugter Hilfslinie
- resultierendem Fangpunkt
- Schnittpunkt mehrerer Hilfslinien

Fangpunkte sollen durch kleine, klare CAD-typische Symbole dargestellt werden.

Hilfslinien sollen deutlich sichtbar, aber gegenüber echter Modellgeometrie visuell untergeordnet sein.

Sie dürfen niemals wie echte gezeichnete Elemente wirken.

Zusätzlich können kleine kontextabhängige Hinweise erscheinen, beispielsweise:

„Endpunkt“

„Mittelpunkt“

„Schnittpunkt“

„Parallel“

„Lotrecht“

„45°“

„Verlängerung“

Diese Hinweise sollen nur erscheinen, wenn sie hilfreich sind, und das Interface nicht überladen.

#### 8. Fanglogik und Prioritäten

Wenn mehrere mögliche Fangpunkte nahe beieinanderliegen, darf der Cursor nicht unkontrolliert zwischen ihnen springen.

Implementiere ein Prioritätssystem.

Hohe Priorität sollen beispielsweise echte geometrische Punkte erhalten:

1. expliziter Schnittpunkt
2. End-/Eckpunkt
3. Mittelpunkt
4. aktiver Tracking-Schnittpunkt
5. Lot-/Tangentialpunkt
6. Punkt auf Element
7. Winkel-/Rasterfang

Die Priorisierung soll später konfigurierbar sein.

Zusätzlich muss eine Hysterese vorhanden sein:

Ein bereits erkannter Fangpunkt bleibt bevorzugt, solange der Cursor sich innerhalb eines etwas größeren Release-Radius befindet.

Dadurch entsteht ein ruhiges und präzises CAD-Gefühl.

#### 9. Snap Pipeline

Baue die Funktion nicht als einzelne UI-Funktion, sondern als zentrale Snap-/Tracking-Engine.

Die Verarbeitung sollte logisch ungefähr folgender Pipeline folgen:

Pointer Input
→ Nearby Geometry Query
→ Candidate Detection
→ Snap Candidate Generation
→ Hover Tracking
→ Reference Point Activation
→ Constraint Generation
→ Candidate Scoring
→ Hysteresis / Stabilization
→ Best Candidate
→ Visual Feedback
→ Tool Constraint Output

Die Snap Engine soll keine endgültige Modellgeometrie erzeugen.

Sie liefert dem aktuell aktiven Werkzeug lediglich präzise Informationen wie:

- snappedPosition
- rawPointerPosition
- snapType
- sourceEntityId
- sourcePointId
- referencePoint
- activeConstraint
- angle
- distance
- confidence / priority
- visualGuides

Dadurch können später Wand-, Linien-, Decken-, Achsen-, Objekt- und andere Werkzeuge dieselbe Snap Engine verwenden.

#### 10. Performance

Die Erkennung muss während jeder Mausbewegung flüssig funktionieren.

Vermeide deshalb vollständige Suchen über die gesamte Modellgeometrie.

Plane eine räumliche Suche ein, beispielsweise über:

- Spatial Index
- BVH
- Quadtree
- Octree
- Bounding-Box-Abfragen

Es sollen nur Elemente untersucht werden, die sich innerhalb eines relevanten Bereichs um Cursor oder aktive Referenzpunkte befinden.

Die Architektur muss auch bei großen BIM-Modellen performant bleiben.

#### 11. Zustandsmodell

Verwende klare Zustände, beispielsweise:

IDLE

CANDIDATE_DETECTED

HOVER_PENDING

REFERENCE_ACQUIRED

TRACKING

SNAP_LOCKED

Nach Verlassen eines Fangpunkts darf der erworbene Referenzpunkt weiterhin temporär aktiv bleiben.

Definiere Regeln dafür, wann Trackingpunkte wieder entfernt werden, beispielsweise:

- Abschluss der aktuellen Zeichenoperation
- Escape
- Werkzeugwechsel
- explizites Löschen
- Timeout
- Überschreiten einer maximalen Anzahl aktiver Referenzpunkte

#### 12. Einstellungen

Bereite zentrale Einstellungen vor für:

snapEnabled
trackingEnabled
gridSnapEnabled
angleSnapEnabled
parallelSnapEnabled
perpendicularSnapEnabled
extensionSnapEnabled
intersectionSnapEnabled
tangentSnapEnabled

Zusätzlich:

snapRadiusPx
releaseRadiusPx
trackingHoverDelayMs
guideVisibility
angleToleranceDeg
customAngles
maxTrackingPoints

Pixelbasierte Bildschirmtoleranzen müssen unabhängig vom aktuellen Zoomlevel funktionieren.

Die daraus resultierende Modellposition muss trotzdem mathematisch exakt berechnet werden.

#### 13. Bediengefühl

Das wichtigste Qualitätskriterium ist das Bediengefühl.

Die Funktion soll sich so verhalten, dass der Benutzer beim Zeichnen nicht bewusst „Hilfslinien erzeugen“ muss.

Er zeigt dem System lediglich durch seine Mausbewegung und kurzes Verweilen, welche vorhandenen Punkte oder Elemente für die nächste Konstruktion relevant sind.

Das CAD erkennt daraus automatisch die wahrscheinlich gewünschte geometrische Beziehung und bietet sie an.

Dabei gilt:

Weniger, aber relevante Hilfslinien sind besser als viele gleichzeitig sichtbare Hilfslinien.

Die Automatik darf niemals gegen den Benutzer kämpfen.

Sie soll Vorschläge machen und präzises Zeichnen unterstützen, aber die Kontrolle muss jederzeit beim Benutzer bleiben.

#### 14. Architektur für spätere Erweiterungen

Entwickle das System modular.

Trenne mindestens:

SnapEngine
SnapCandidateProvider
GeometryQuery
TrackingPointManager
ConstraintResolver
AngleTracker
GuideManager
SnapScorer
SnapRenderer
SnapSettings

Werkzeugspezifische Logik darf nicht fest in der Snap Engine implementiert werden.

Ein Wandwerkzeug, Linienwerkzeug oder späteres BIM-Werkzeug soll lediglich Snap-Kontext an die Engine übergeben und das berechnete Ergebnis verwenden.

Berücksichtige bereits zukünftige Erweiterungen wie:

- 3D-Snapping
- Ebenen-/Flächenfang
- BIM-Achsraster
- temporäre Maßketten
- Abstandstracking
- Verlängerungen von Bögen
- Tangentialkonstruktionen
- intelligente Wandachsen
- Geschoss- und Höhenbezüge
- Z-Achsen-Tracking
- benutzerdefinierte Fangfilter

#### Akzeptanztests

Die Implementierung gilt erst als abgeschlossen, wenn mindestens folgende Situationen zuverlässig funktionieren:

Test 1:
Cursor kurz über eine Wandecke halten → Punkt wird erkannt → nach Hover-Zeit aktiviert → Cursor wegbewegen → horizontale und vertikale Trackingmöglichkeiten entstehen.

Test 2:
Punkt A aktivieren → Punkt B aktivieren → horizontal von A und vertikal von B bewegen → exakter Schnittpunkt wird erkannt.

Test 3:
Cursor entlang der Richtung einer vorhandenen Wand bewegen → Parallelbeziehung wird erkannt → resultierende Linie ist mathematisch exakt parallel.

Test 4:
Cursor ungefähr 90° zu einer vorhandenen Kante bewegen → Lotrecht-Beziehung wird erkannt → resultierende Konstruktion ist exakt 90°.

Test 5:
Cursor ungefähr in 45°-Richtung bewegen → 45°-Tracking wird aktiviert → resultierende Geometrie liegt exakt auf 45°.

Test 6:
Mehrere Fangmöglichkeiten liegen nahe beieinander → System wählt stabil den sinnvollsten Kandidaten und flackert nicht zwischen Fangpunkten.

Test 7:
Stark hinein- oder herauszoomen → visuelle Fangtoleranz bleibt für den Benutzer ungefähr gleich, während die Modellkoordinaten weiterhin exakt sind.

Test 8:
Großes Modell mit vielen Elementen → Cursorbewegung und Snap-Berechnung bleiben flüssig.

Implementiere zunächst die zugrunde liegende Engine und Zustandslogik sauber und modular. Erst danach das visuelle Feedback anbinden.

Keine Demo- oder Mock-Logik verwenden, wenn die reale geometrische Berechnung bereits implementiert werden kann.

Bestehende Architektur und vorhandene Funktionen von NOVIKOV CAD nicht unnötig umbauen. Neue Komponenten sauber in die bestehende Core-/Engine-Struktur integrieren.

Vor der Implementierung zuerst die bestehende Codebasis analysieren und feststellen, welche Geometry-, Pointer-, Viewport-, Tool- und Rendering-Systeme bereits vorhanden sind. Bestehende Funktionen wiederverwenden, statt parallele Systeme zu erzeugen.



### Detail D02 – docs/3D_INTERACTION_CONTRACT.md

Herkunft: `docs/3D_INTERACTION_CONTRACT.md`, Snapshot main/PR237. Altstatus nicht als aktuelle Fertigmeldung lesen.

#### Horizontale 3D-Arbeitsebene: Integrations- und Bedienentwurf

Stand 04.10.2026, geprüft auf 509d133 nach Freigabe von PR #70. Dieser Auftrag ändert nur Dokumentation. Die Produktvorschläge unten sind noch keine Nutzerentscheidungen.

#### Codebefund

- BimSolidView zeichnet mit createProjectionFrame(solid) und gerundetem Backbuffer-Aspect. PointerUp ruft pickWall dagegen mit CSS-Breite/CSS-Höhe auf. Bei ungeraden Größen und DPR können beide geringfügig abweichen. Kein im Browser nachgewiesener Fehlklick, aber eine konkrete Abweichung im Code.
- pickWall prüft sichtbare Dreiecke samt Tiefe und Fensteröffnungen, liefert jedoch nur eine Wand-ID. Der an onSelect übergebene anchor sind Client-Pixel für das Menü, kein Modellpunkt.
- Linksziehen dreht derzeit die Kamera, im Pan-Modus verschiebt es die Ansicht. Ein Klick bis vier CSS-Pixel Bewegung wählt auf PointerUp; Pfeiltasten drehen, Rad und +/- zoomen. PointerCancel und Capture-Verlust beenden die Geste.
- CadWorkspace startet Wand-/Linienwerkzeuge teils ausdrücklich in 2D; Moduswechsel brechen Entwürfe ab. BimSolidView hat keine ToolInteraction-Anbindung und keinen Ebenen-Cursor.
- Gemeinsame Projektion, Inverse, lokale Suche, Ranking, Führungen, Hover und Referenz-Picking unterstützen jetzt ScreenMetric. Das ist noch keine vollständige 3D-Integration: Overlaypositionen, Quellensichtbarkeit, Gestenzuständigkeit und Projektionsrahmen müssen angeschlossen werden.
- buildSolid zeichnet Wände mit Öffnungen, keine allgemeinen Linien. Unsichtbare Linien dürfen nicht unbemerkt als neue 3D-Ziele angeboten werden. Das aktuelle XY-Modell unterstützt keine freie Fußpunkthöhe; erster Integrationsbereich bleibt z=0.

#### Verbindliche technische Regeln

Ein Modell und dieselben validierten Application-Aktionen bleiben maßgeblich. Bauteilselektion, geometrischer Ursprung und Menüposition sind unterschiedliche Daten. Eine Wand-ID oder ein Bildschirmanker darf nicht als ausgewählter Modellpunkt ausgegeben werden. Ein später gewählter Ursprung wird sofort in der gemeinsamen Referenzverwaltung geschützt.

Renderer, Picking und Ebeneninverse müssen denselben Rahmen, Kamerastand und Render-Aspect verwenden. CSS bestimmt Zeigerkoordinaten und Fangradius; DPR nur die Auflösung. Vorschaugeometrie darf den gebundenen Rahmen eines Vorgangs nicht verändern. Eine ungültige Inverse liefert keinen bestätigbaren Punkt. Navigation und Wiederherstellung eines gültigen Blicks bleiben möglich. Modell-/History-/Ebenenwechsel invalidieren alte Ziele; Kameranavigation erhält Modellreferenzen und suspendiert den Erwerb.

Sichtbarkeit und Fangbarkeit müssen zusammenpassen. Navigation darf niemals zugleich eine Modellaktion bestätigen. Tab/Winkel/Länge verwenden weiterhin ToolInteraction; Modellwinkel werden nicht durch Bildschirmwinkel ersetzt. Keine zweite 3D- oder AI-Modelllogik.

#### Produktvorschläge und offene Entscheidungen

| Thema | Empfehlung zur späteren Abstimmung | Alternative / Folge |
| --- | --- | --- |
| Ebene erkennen | Während eines Ebenenvorgangs dezente Kennzeichnung „XY · z=0“, temporäre Hilfslinien und hohle silbergraue Anker im bestehenden Stil | Dauerhaftes Ebenengitter möglich, aber visuell dichter; noch nicht beschlossen |
| Bewegungsursprung | Ausgewähltes Element bietet eindeutig benannte Fußpunkte auf z=0; erst deren Wahl startet den Vorgang | Wandflächenklick allein bleibt Elementauswahl; Oberpunkte nicht still nach unten projizieren |
| Verdeckte Ziele | Standardmäßig nur sichtbare Anker anbieten; gesonderter, ausdrücklich aktivierter Referenzmodus könnte verdeckte Quellen anzeigen | X-Ray oder durchscheinende Ebene müssen erkennbar und abschaltbar sein; keine automatische Freigabe |
| Kamera während Bearbeitung | Werkzeugklick und Navigation über expliziten Navigationsmodus trennen; nach Navigation Entwurf fortsetzen | Mitteltaste/Modifier wären schneller, benötigen aber ein einheitliches Konzept für 2D, 3D und Touch |
| Kein Werkzeug aktiv | Bestehendes Wand-Picking und Linksziehen zunächst erhalten | Eine globale neue Gestenbelegung wäre ein eigener Auftrag |
| Fast seitliche Ebene | Kleiner Hinweis „Arbeitsebene aus diesem Blick nicht eindeutig“, Cursorziel pausieren | Kein automatisches Drehen, kein erfundener Ersatzpunkt |

Diese Empfehlungen werden durch Freigabe des Dokumentations-PRs nicht automatisch zu einer Gesten- oder X-Ray-Entscheidung. Vor dem entsprechenden UI-Auftrag sind die betroffenen offenen Punkte konkret zu klären. Der folgende technische Schritt benötigt diese Entscheidungen nicht.

#### Genau nächstes Umsetzungspaket: gemeinsamer Projektionsstand

Im Rendering-Adapter einen konkreten unveränderlichen Projektionsstand aus Rahmen, Kamera, CSS-Rechteck und tatsächlichen Backbuffer-Abmessungen erzeugen. BimSolidView soll für einen dargestellten Stand exakt diesen Rahmen/Aspect für Darstellung und Wand-Picking verwenden; die horizontale Inverse muss denselben Stand beziehen können. Bestehendes pickWall kompatibel halten, keine zweite Projektionsformel und keine leere allgemeine Szenenverwaltung.

Bei Resize, DPR- oder Kameraänderung Stand zusammenhängend erneuern. Bei verlorener Grafikdarstellung oder nicht passendem Stand keinen alten Treffer bestätigen. Der künftige Vorgangsrahmen muss als expliziter Eingabewert möglich sein; noch keine 3D-Modellaktion anschließen.

Abnahme: ungerade CSS-Größen, DPR 1/1,25/2, Hoch-/Querformat, Pan/Zoom/Orbit und Resize; projizierte bekannte Wandpunkte und Öffnungen müssen mit Picking übereinstimmen. Snapshot bleibt trotz Mutation externer Eingaben unverändert. Bestehende Inversen-/Pickingtests, gesamte Tests, TypeScript, Build und Lint bestehen. Browser: Wand wählen, durch Öffnung klicken, navigieren und Ansicht ändern. Keine geänderte Gestenbelegung, Fangoberfläche, Persistenz oder Modellmutation.

#### Spätere Freischaltungskriterien

Vor 3D-Bearbeitung zusätzlich prüfen: sichtbare Quellen und Overlay, expliziter Ursprung, gemeinsame Quellenfilter, 600-ms-Erwerb/Lösen, Referenzerhalt bei Kameraänderung, ungültige Inverse, Modal-/Escape-Priorität und eine bestätigte Aktion mit Undo/Redo. Diese Liste ist kein paralleler Folgeauftrag; die Reihenfolge wird nach dem Projektionspaket neu abgeglichen.

#### Preview decision accepted and implemented (2026-10-04)

After PR #74 the user explicitly instructed continuation of the presented proposal. For the first read-only preview: Snap enables visible z=0 wall footpoints even without a drawing tool; immediate hollow silver-grey ring, shared 600ms acquire/toggle; hidden targets are not acquired; navigation suspends acquisition and retains references; existing wall click and left-drag orbit/pan remain. Escape clears the preview. This resolves those preview decisions only. Future model-movement gestures and a hidden-reference mode are not implicitly approved.

Projection state, visibility and local candidates described above are implemented by PRs #72-74. The first visible preview now uses them and the shared hover state machine. No full 3D editing or generated guide-intersection acquisition is claimed.




### Detail D03 – docs/3D_WORKPLANE_PLAN.md

Herkunft: `docs/3D_WORKPLANE_PLAN.md`, Snapshot main/PR237. Altstatus nicht als aktuelle Fertigmeldung lesen.

#### Aktive horizontale 3D-Arbeitsebene — Arbeitsvertrag

Aktualisierung nach PR #70: Die historische Bestandsaufnahme unten beschreibt den Ausgangsstand. Projektion und ScreenMetric-Anschlüsse sind inzwischen umgesetzt. Aktueller Integrationsbefund, offene Produktvorschläge und genau nächstes Paket: [3D_INTERACTION_CONTRACT.md](3D_INTERACTION_CONTRACT.md). Die historische Tabelle ist keine Liste weiterhin fehlender Metrikfunktionen.

Stand: 04.10.2026. Codebasis: `acc5c44` (PR #63, noch offen).
Dieser Auftrag verändert ausschließlich Dokumentation. Die nachfolgend vorgeschlagenen Schnittstellen und Bedienregeln sind nicht implementiert und keine vom Nutzer bereits entschiedenen Produktdetails.

#### 1. Nachgewiesener Bestand

| Bereich | Vorhanden | Für eine Arbeitsebene fehlt |
| --- | --- | --- |
| `src/lib/bim/model.ts` | Meter, eine Geschoss-ID, XY-Wände und Linien; Wandhöhe und Fensterbrüstung | Geschosshöhe, beliebige Z-Koordinate für einen Wandfuß oder Zeichnungspunkt |
| `src/lib/bim/geometry.ts` | `buildSolid`, Z nach oben, orthographisches `projectPoint`; Zentrierung und Maßstab aus Solid-Grenzen | inverse Projektion auf eine Ebene, unabhängiger Projektionsrahmen |
| `src/components/cad/BimSolidView.tsx` | WebGL-Wände mit Öffnungen, Orbit/Pan/Zoom, Auswählen per Wand-ID | Arbeitsebenen-Cursor, Fangoverlay, ToolInteraction-Anbindung; Linien werden nicht als 3D-Geometrie gezeichnet |
| `src/lib/bim/picking.ts` | `pickWall` prüft projizierte Dreiecke und Tiefe, respektiert Öffnungen | kein Welt-Trefferpunkt; Wand-ID allein ist kein Bewegungsursprung |
| `src/application/tools/interaction.ts`, `snapping.ts` | gemeinsamer Ursprung, validierte Vorschau/Bestätigung, Werkzeugausschlüsse und Fangresolver | Rendering-Adapter für Ebenenkoordinaten aus 3D-Zeigerposition |
| `src/application/snapping/local-sources.ts` | Modell-Snapshotcache, lokale XY-Primitivsuche, volle Quellenvalidierung | projektionsabhängiges Suchgebiet und exakte CSS-Metrik |
| `src/constraints/snapping/*`, `inference/segment-hover.ts`, `src/rendering/viewport/reference-picking.ts` | Ranking, Hover und Picking mit skalarem Pixel-pro-Meter-Faktor | anisotrope Bildschirmabstände einer schräg gesehenen Ebene |
| `src/components/cad/CadViewport.tsx`, `CadWorkspace.tsx` | aktive Ansicht, getrennte 2D-/3D-Kamera, gemeinsames Modell | 3D ist heute primär Darstellung/Auswahl; Werkzeugstart/Einzelansicht und Moduswechsel führen teils zurück nach 2D bzw. brechen Entwürfe ab |

Der Stand ist keine perspektivische Kamera und kein 3D-Flächenmodellierer. Bestehende stabile Bauteil-IDs, Undo/Redo, Projektdateien und IFC bleiben maßgeblich. `pickWall` und Punktfang beantworten verschiedene Fragen: welches Bauteil ausgewählt wird und welcher geometrische Zielpunkt gemeint ist.

#### 2. Verbindliche Grenzen aus der bestehenden Architektur

- Es bleibt genau ein autoritatives Modell. Arbeitsebene, projizierte Fangziele und Overlay sind abgeleitete Interaktionsdaten, keine zweite Bauteilkopie.
- Eine gemeinsame Fang-/Inferenzpipeline und dieselben validierten Application-Aktionen für Maus, Maßeingabe, Text/Voice/AI. Ein 3D-Adapter übersetzt Koordinaten und bindet den stabilen Zielkontext; keine eigene AI- oder 3D-Modellmutation.
- Meter und geometrische Winkel gelten in der Arbeitsebene. Ein in 3D verkürzt dargestellter rechter Winkel bleibt fachlich 90 Grad.
- Modellpunkte werden nicht durch Bildschirmrundung, UI-Pixel oder Rendererdreiecke ersetzt. Quellen tragen stabile Element-ID und Snapshot-Feature; zusammengesetzte Referenzen behalten ihre Abhängigkeiten.
- Geometrie kennt weder React noch BIM. Rendering verantwortet Kamera/Pixel/Picking, Application die zulässigen Quellen und Aktionen, Constraints das gemeinsame Fangverhalten.
- Keine neuen Geschosse, schrägen Ebenen, Bauteilarten, Persistenzversionen oder freien Z-Transformationen in diesem Paket. Das Skalierverbot für BIM bleibt unverändert.

#### 3. Vorgeschlagener Ebenenvertrag für den ersten Einsatz

Start mit einer viewportbezogenen horizontalen XY-Ebene: Ursprung O=(0,0,0), U=(1,0,0), V=(0,1,0), N=(0,0,1). Ebenenkoordinaten (u,v) entsprechen damit heutigen Modellkoordinaten (x,y). Keine zusätzliche Höhensteuerung. Die Ebene bekommt eine stabile temporäre Identität; Kameraänderungen ändern diese nicht.

Die Mathematik darf eine feste horizontale Höhe h als Parameter testen. Produktiv ist zunächst ausschließlich h=0 zulässig: Das aktuelle Modell kann andere Fußpunkthöhen nicht ausdrücken. Eine spätere Geschossebene verwendet echte Geschossdaten und ist ein eigener Modellauftrag. Es gibt keinen stillen Rückfall einer nicht unterstützten Ebene auf z=0.

Ein `WorkplaneProjection`-ähnlicher Datensatz (Name vorgeschlagen, noch kein API) enthält: Ebenenidentität, Weltbasis, eingefrorenen Projektionsrahmen, CSS-Viewportgröße, denselben Aspect wie der Renderer, vorwärts/invers nutzbare affine Abbildung und einen strukturierten Gültigkeitsstatus. Kameraparameter sind nicht Teil der Modell- oder Ebenen-ID.

Für eine spätere Aktion bleibt die vorhandene `ToolInteraction` zunächst bei `Point2`: Bei h=0 liefert der Rendering-Adapter (u,v)=(x,y), dann folgen `resolveToolSnap`, Vorschau, `validate` und `commit`. Ausgewähltes Element, Modell-Snapshot und Ursprung werden bei Vorgangsbeginn gebunden. Eine Wandfläche anklicken liefert heute noch keinen exakten Ursprung: Erst ein sichtbarer, eindeutiger Fußpunkt/Arbeitsebenenanker darf diesen setzen; kein stilles Herunterprojizieren eines Wandoberpunkts.

#### 4. Projektion und Zeigerabbildung

Die bestehende orthographische Projektion ist auf einer festen horizontalen Ebene affin:

`screen(u,v) = b + A * [u,v]` (CSS-Pixel, relativ zur Zeichenfläche).

A besteht aus den projizierten Einheitsrichtungen U und V; b ist der projizierte Ebenenursprung. NDC nach CSS: x=(ndcX+1)*Breite/2, y=(1-ndcY)*Höhe/2. Nur diese Darstellung kehrt Y um. Welt und Ebenenkoordinaten bleiben rechtshändig und in Metern.

Für invertierbares A wird die Mausposition durch `A^-1*(screen-b)` zurückgeführt. Kein Ray-Mesh-Treffer und keine Dreiecksebene als Ersatz. Die Begriffe Strahl/Ebene dürfen später dieselbe Schnittstelle erweitern; perspektivische Kameras sind jetzt nicht vorgesehen.

Renderer und Inverse müssen denselben Mittelpunkt, Radius, Aspect und Kamerastand verwenden. Aktuell stammen Mittelpunkt/Radius aus `Solid.min/max`; Vorschaugeometrie kann diese Grenzen verändern. Während eines Entwurfs ist deshalb ein gemeinsamer Projektionsrahmen zu binden, sonst wandert die Mauszuordnung mit der Vorschau. Bewusstes Fit/Modellwechsel erzeugt einen neuen Rahmen, Kameranavigation nur eine neue Abbildung innerhalb desselben Rahmens. Leere bzw. reine Linienprojekte brauchen definierte Grenzen; der heutige Solid-Fallback [0,0,0]–[1,1,1] ist darstellbar, aber keine automatische Zusage, dass entfernte Linien eingerahmt sind.

CSS-Pixel bestimmen Fangabstände. DevicePixelRatio bestimmt nur die Renderauflösung. Der Renderer nutzt derzeit gerundete Backbuffer-Abmessungen und deren Aspect: Die gemeinsame Abbildung muss exakt diesen Aspect berücksichtigen oder beide Verbraucher konsistent auf CSS-Aspect umstellen; getrennte Näherungen sind ausgeschlossen.

Bei seitlicher Ansicht kollabiert die XY-Ebene: In der aktuellen Kamera ist `pitch=0` singulär. Kein Clamp auf eine willkürliche Zielkoordinate. Vorgeschlagene Statusfälle: gültig, entartete/zu schlecht konditionierte Projektion, ungültige Parameter. Dann keine Punktbestätigung; Navigation bleibt möglich und vorhandene Referenzen werden lediglich pausiert. Ein numerischer Grenzwert für schlechte Konditionierung wird erst anhand Fehlerbudget und Tests festgelegt, nicht als Nutzerentscheidung erfunden.

Lesende Rechnung mit vorhandener `projectPoint`, Testgrundriss `docs/fixtures/reference-selection.json`, 800×600 CSS-Pixel, initialem Yaw/Zoom: Bei pitch=0 ist det(A)=0; bei pitch=0,3 rad sind die projizierten Einheitsachsen ungefähr 112,61 bzw. 63,13 Pixel lang. Dies belegt die ungleichen Maßstäbe, ist kein Performancebenchmark und kein neuer Projektionstest im Repository.

#### 5. Gemeinsame Fangengine: notwendige Erweiterung, noch nicht Umsetzungspaket

Ein einziger Faktor `pixelsPerMetre` genügt in schräger Ansicht nicht. Der gemeinsame Resolver benötigt später einen rein numerischen Screen-Metric-Vertrag, etwa Vorwärtsabbildung, exakten CSS-Abstand und konservative Suchgrenzen. React/Kameraobjekte gehören nicht in Constraints. Der bisherige 2D-Faktor bleibt als isotroper Adapter mit identischen Ergebnissen erhalten.

Abhängigkeiten dieser späteren Integration:

1. Lokale Suche: Inverses Bild des CSS-Fangquadrats konservativ in ein Ebenen-AABB umschließen. Alternativ ist r/sigmaMin(A) eine sichere grobe Radiusgrenze. Diese dient nur der Vorauswahl; sie darf nicht Ranking oder exakten Fangradius ersetzen. Lange Segmente und Fangradiusrandfälle müssen enthalten bleiben.
2. Vor Dichtezählung und Paarbildung tatsächliche Bildschirmnähe der Segmentabschnitte prüfen. Sonst erzeugen stark verkürzte Ansichten falsche Dichtepausen oder unnötige Paarmengen. Keine globale Schnittpunktliste.
3. End-/Mittelpunkte und exakte Schnittpunkte bleiben Ebenengeometrie. Ranking, Hover-Erwerb/-Entfernung und manuelles Picking verwenden einheitliche CSS-Abstände. Bei einer Führung liefert eine euklidische Ebenenprojektion nicht zwingend den nächsten Bildschirmpunkt: für freie Näheprojektion auf Richtung d ist die Metrik G=AᵀA zu berücksichtigen, t=(dᵀG(p-o))/(dᵀGd). Fachliche Achsen, genaue Längen und Winkel bleiben in Modellmetern und sind keine Pixelprojektionen.
4. Shift-45°, Parallelen und Lotrechte meinen Modellrichtungen. Richtungswahl und Hysterese nicht auf Bildschirmwinkel umdeuten. Erst danach wird die wirksame Führung projiziert und ihre Nähe bewertet.
5. Entfernte aktive Referenzen separat über vollständige Snapshot-Quellen validieren. Dichtepause (>32, Rückkehr <=24/250 ms) und 600-ms-Erwerb sind unterschiedliche Regeln und bleiben gemeinsam implementiert. Vier zusätzliche Referenzen und separater Bewegungsursprung bleiben bestehen.

Alle Entfernungspfade erfassen: `candidates.ts`, Achsenkandidaten in `engine.ts`, lokale `near`-Prüfung, Segment-Hover, Referenz-Picking und Overlaypositionen. Nur einen neuen Abstand im Renderer einzubauen wäre unvollständig.

#### 6. Lebenszyklus und Eingabe — vorgeschlagene Fortführung

| Ereignis | Verhalten beim späteren Anschluss |
| --- | --- |
| Ebenenbezogenen Vorgang starten | Modell/Element-ID/Ebene binden; exakten gewählten Ursprung sofort als geschützte Referenz setzen |
| Mausbewegung | CSS → Ebene → gemeinsame lokale Suche plus aktive Referenzen → Vorschau/Overlay |
| Tab, Winkel/Länge, Shift | bestehende ToolInteraction und Hilfseingabe; keine zweite Eingabeleiste oder Kopie der Tab-Logik |
| Orbit/Pan/Zoom/Resize | Erwerb während Navigation suspendieren, Cursor anschließend neu berechnen; Modellreferenzen behalten, Gültigkeit der Abbildung prüfen |
| Fast seitlicher Blick | keine Bestätigung aus ungültiger Inverse; Entwurf/Referenzen erhalten; gültiger Blick setzt fort |
| Ebene/aktive Ansicht/Layout wechseln | Entwurf abbrechen, temporäre Quellen verwerfen; kein Übertragen in eine andere Ebene ohne ausdrücklichen Vorgang |
| Modell/Undo/Redo/Laden | bestehende Snapshot-Invalidierung; alte Ereignisse nicht mehr übernehmen |
| Snap aus/ein | heutiger Vertrag: zusätzliche Referenzen löschen, geschützten Ursprung bei aktiver Aktion wieder anbieten; numerische Eingabe bleibt fachlich validiert |
| Escape | zuerst modaler Dialog, dann Mehrdeutigkeitsliste, dann Referenzauswahl, schließlich Werkzeugentwurf; keine doppelte Bestätigung/Abbruchwirkung |

Heute nutzt die 3D-Navigation Linksziehen und PointerUp zur Wandselektion. Die spätere Arbeitsebenenbedienung benötigt explizite gegenseitige Zuständigkeit: Navigationsgeste bestätigt nie ein Modell, Werkzeugklick ersetzt keine stabile Zielselektion. Konkrete Gestenwahl ist noch offen; bevor eine 3D-Modellaktion freigeschaltet wird, muss sie zur vorhandenen 2D-Bedienung passen. Die Ausblendung inaktiver Auswahlpanels aus PR #63 bleibt gültig.

#### 7. Offene Produktdetails und spätere Grenzen

- Kennzeichnung/Einblenden der Ebene und ihrer Fußpunktanker; keine jetzt eingeführte permanente Leiste.
- Verdeckte bzw. hinter der Wand liegende Ebenenanker: Sichtbarkeit und Auswahl müssen zusammenpassen. Kein automatischer Fang unsichtbarer Punkte als stillschweigende Entscheidung. Auswahlmodus/X-Ray oder strikte Sichtprüfung sind Alternativen, hier nicht beschlossen.
- Kamera-Gesten während einer Aktion und Verhalten beim absichtlichen Fit. Der Projektionsrahmenvertrag ist technisch erforderlich; die konkrete Bedienung noch abzustimmen.
- Konkrete Schwelle für fast entartete Projektionen; abhängig von robustem Inversentest und maximal vertretbarer Weltkoordinatenabweichung.
- Perspektive, frei geneigte Ebenen, echte Z-Änderung, Geschosshöhen und Raumflächen gehören nicht zum ersten Anschluss. Keine neue Entscheidung über ältere offene Themen wie Wandachsenwechsel oder D/Strg+D.

Diese Fragen blockieren das nächste reine Projektionspaket nicht. Sie müssen vor Freischaltung der entsprechenden 3D-Modellbedienung geklärt sein.

#### 8. Abgeschlossenes Umsetzungspaket

**Orthographische Vorwärts-/Rückprojektion für eine horizontale Ebene als gemeinsame, getestete Grundlage.**

- Vorhandene Projektionsrechnung ohne Verhaltensänderung aus `lib/bim/geometry.ts` in einen fachunabhängigen numerischen Projektionsbaustein unter `geometry/projections` überführen. `projectPoint` bleibt als kompatibler Wrapper und nutzt diesen Baustein; keine zweite Kameraformel im Arbeitsebenenadapter.
- Rendering-Adapter unter `rendering/viewport` bindet denselben Rahmen, Aspect und CSS-Rechteck an die horizontale Ebene und liefert Vorwärtsabbildung, Inverse und strukturierten Ungültigkeitsstatus. Eine konkrete numerische Fehlerschranke begründen und testen. Keine leeren Klassen oder neue allgemeine Ebenenverwaltung.
- Tests: Vorwärtswerte/Depth identisch zum bisherigen Renderer; Ebene→CSS→Ebene bei mehreren Yaw/Pitch/Zoom/Pan, Hoch-/Querformat, negativen Koordinaten, CSS-/Backbuffer-Verhältnissen und h=0 sowie festem h; pitch=0, NaN/Infinity, Nullabmessungen und beinahe singuläre Fälle sicher ablehnen. Konservatives inverses CSS-Suchrechteck auf enthaltene Randpunkte prüfen. Modellmutation ausgeschlossen.
- Bestehende Geometrie-/Pickingtests und gesamte Testsuite, TypeScript, Build, Lint. Browserabnahme beschränkt sich auf unveränderte 3D-Wanddarstellung/-Auswahl und Navigation, da der neue Arbeitsebenenadapter noch keinen UI-Verbraucher hat.
- Noch keine neue 3D-Modellaktion, kein Fang-Overlay und keine Erweiterung aller Fangmetriken in diesem Paket. Der Vorwärtsbaustein wird bereits produktiv vom existierenden Renderer verwendet; die geprüfte Inverse ist die konkrete Grundlage für die spätere gemeinsame Metrik-Anbindung.

Planungsabnahme: Keine Änderung unter `src` oder am Dateiformat; vorhandene 2D-/3D-Abläufe bleiben unverändert. Dokumentation und Pfade prüfen. Die 257 bestandenen Tests beziehen sich auf PR #63, nicht auf neu implementierte 3D-Funktionen.

#### 9. Implementierungsnachweis — 04.10.2026

Abschnitt 8 ist umgesetzt: `geometry/projections/orthographic.ts` ist die gemeinsame Vorwärtsrechnung; `rendering/viewport/horizontal-workplane.ts` bindet den horizontalen Adapter. Renderer und Picking erzeugen den Rahmen einmal pro Aufruf. Der Adapter kopiert Kamera/Rechteck und friert seinen Rahmen ein; Vorschauen können ihn nicht nachträglich verändern. Ein späterer Verbraucher muss denselben festgehaltenen Rahmen und den tatsächlichen Renderer-Aspect liefern. Es gibt noch keinen 3D-Interaktionsverbraucher.

Die normalisierte 2x2-Matrix verhindert unnötigen Determinantenüberlauf. Das Verhältnis der Singulärwerte darf höchstens 1e6 sein; seitlicher Blick wird abgelehnt. Pro Rückrechnung wird zusätzlich 32 * Maschinen-Epsilon * (CSS-Größenordnung * Unendlichnorm der Inversen + Welt-Größenordnung) als konservative Rundungsreserve geschätzt. Sie berücksichtigt die Größen der Subtraktionen und die Verstärkung durch die Inverse; Ergebnisse über 1e-6 m werden abgelehnt. Der Sicherheitsfaktor deckt die kurze arithmetische Rechenkette in den getesteten Bereichen ab, ist aber kein formaler Intervallbeweis für beliebige IEEE-754-Eingaben. Gerätegenauigkeit, CSS-Quantisierung und ungenaue Quelldaten sind ausdrücklich nicht enthalten. Diese Grenze ist kein Fangradius und verändert keine Modellvalidierung.

Die vier inversen Ecken des CSS-Suchquadrats bilden dessen affines Parallelogramm. Seine um die Rundungsreserve erweiterte AABB ist nur Kandidaten-Vorauswahl; genaue Abstände müssen anschließend in CSS geprüft werden. Tests decken Randpunkte, negative Koordinaten, verschiedene Kameras, Zoom/Pan, CSS-Backbuffer-Rundung, h=0/h=3,2, Snapshot-Isolation und bewusst abgelehnte Extremwerte ab. 264 Tests/TypeScript/Build erfolgreich, ESLint ohne Fehler (sechs bekannte Warnungen); Browserprüfung der bisherigen Wanddarstellung und Auswahl bestanden. Der einzige aktive Folgeauftrag steht in DEVELOPMENT_PLAN.md.




### Detail D04 – docs/AUTOMATIC_WALL_CONNECTIONS.md

Herkunft: `docs/AUTOMATIC_WALL_CONNECTIONS.md`, Snapshot main/PR237. Altstatus nicht als aktuelle Fertigmeldung lesen.

#### Automatische Wandanschluesse — Abnahme 05.10.2026

#### Bedienung

1. Zwei gleich hohe und gleich starke Waende rechtwinklig zeichnen. Ein Achsende
   muss genau auf dem Achsende der anderen Wand einrasten. SNAP einschalten.
2. Alternativ eine bestehende Wand ueber ihren Achsgriff und das On-Demand-Menue
   bewegen. Beim Zusammenfuehren entstehen passende Wandkoerper ohne Dialog.
3. Die Eigenschaften melden "Wandanschluss aktiv". Grundriss und 3D vergleichen.
4. Eine Wand wegbewegen: beide betroffenen Enden werden gerade. Undo stellt den
   Anschluss zusammen mit der alten Position wieder her; Redo loest ihn erneut.
5. Projekt speichern/laden und normal ueber Export IFC ausgeben.

Reproduzierbares numerisches Beispiel: A (0,0)–(3,0), B (4,0)–(4,3), jeweils
0,36 m stark, 2,80 m hoch, Koerperversatz +0,18 m. B ueber Element frei bewegen
um 1 m bei 180 Grad verschieben. A-Ende und B-Anfang liegen danach auf (3,0).
Fenster je 1,20 x 1,35 m, Bruestung 0,90 m, Position 0,5 bleiben ausgeschnitten.

#### Gespeicherter Zustand und Grenzen

Schema 6 speichert Wand-ID/Achsende-Paare, keine zweite Koerperkopie. Versionen
1–5 bleiben ladbar und werden ohne neue Verbindungen migriert. Reines Laden,
Hoehenaendern oder ein unveraendertes altes Achsende erzeugt keine neue Beziehung.
Koordinatenkontakt ist exakt; Zoomen oder bloss nahe Punkte erzeugen keinen Join.
Die bestehende Fangengine liefert die exakten Zielpunkte.

Nur rechtwinklige Paare gleicher Hoehe/Staerke; beide Wandenden duerfen je einen
Partner haben. T-/Mehrfachanschluesse, spitze Winkel und unterschiedliche Staerken
sind noch nicht implementiert. Kontakt mit der Mitte einer Achse verbindet nicht.
Ungeeigneter Endkontakt wird mit Meldung abgewiesen. Die physische Geometrie
bleibt erhalten, wenn ein Nachbar nur ausgeblendet wird.

Fensterkontakt mit der schraegen Endbegrenzung ist gemaess Nutzerentscheidung
unzulässig; keine erfundenen pauschalen Mindestabstaende. Fenster in der Mitte
und bestaetigte bestehende Oeffnungsregeln bleiben erhalten. Eine einzelne
Eigenschaftsaenderung, welche die Gleichheit von Hoehe/Staerke verletzt, wird
zunaechst abgewiesen. Gemeinsam eine Ecke bzw. eine Wandgruppe bearbeiten ist
noch ein eigener Auftrag. Zum Bearbeiten einer verbundenen Wand bleiben ihre
Achsgriffe aktiv; abgeleitete Gehrungsecken sind Fangziele, keine freien Griffe.

#### Nachweise

458 Tests bestanden. Neue Tests sichern automatische Erstellung/Bewegung,
atomare History, Loesen, Vier-Wand-Ring, Fensterkontakt, Mehrdeutigkeit,
Altdateien/ungueltige Relationen, Sichtbarkeit und abgeleitete Fangkonturen.
Browserabnahme umfasst 1-m-Bewegung, 2D/3D, Undo/Redo und Loesen/Wiederherstellen.

Mit Node (TypeScript stripping):

```powershell
node --experimental-strip-types scripts/generate-automatic-corner-fixtures.mjs <ausgabeordner>
python scripts/validate-ifc.py <ausgabeordner>
```

Generator erzeugt start.project.json, zwei verbundene Projektdateien und deren
regulaere IFC-Exporte samt Erwartungsdaten. Unabhaengige Pruefung mit
IfcOpenShell 0.8.5: IFC4/EXPRESS, Host/Oeffnungsbeziehungen, Weltplatzierungen und
Nettovolumina fuer Ecke und geschlossenen Grundriss bestanden. Der neue reguläre
Export muss noch in Archicad praktisch abgenommen werden; die fruehere Abnahme
des expliziten Eck-Testexports bleibt als separater Nachweis bestehen.




### Detail D05 – docs/LAYER_CONTRACT.md

Herkunft: `docs/LAYER_CONTRACT.md`, Snapshot main/PR237. Altstatus nicht als aktuelle Fertigmeldung lesen.

#### Ebenenvertrag und Dateimigration

#### Umsetzung vom 04.10.2026

Der nachfolgende Planungsstand bleibt als Herleitung erhalten. Schema 2 ist jetzt
implementiert: Project.layers, layerId je Wand/Fenster/Linie und zusätzlich
defaultLayerIds mit wall/window/line. Diese expliziten ID-Verweise verhindern,
dass Umbenennen oder kollisionsbedingt abweichende IDs Erzeugungsvorgaben brechen.
Schema und Validierung liegen in domain/project/schema.ts, Standardebenen in
domain/layers/model.ts, Migration in interop/project-file/load.ts, Zuordnung in
application/layers/actions.ts. Bestehende Modell-Exporte bleiben kompatibel.

335 Tests bestanden, TypeScript/Build erfolgreich, Lint 0 Fehler/6 bekannte
Warnungen. Acht neue Tests decken Migration mit/ohne Linien, ID-Kollisionen,
defekte Alt-/Neudateien, zentrale Erzeugungsvorgaben, atomare Zuordnung,
veraltete Ziele, Undo/Redo, JSON und unveränderte Geometrie/IFC ab. Historische
Test-Fixtures wurden auf das aktuelle Schema angepasst; die Laufzeitvalidierung
akzeptiert keine alten Snapshots. Keine Sichtbarkeits-/UI-Funktion hinzugefügt.

Praktisch prüfen: alte Version-1-Projektdatei öffnen, Maße und Positionen in 2D/3D
vergleichen, als neue Datei speichern und wieder öffnen. Die neue Datei enthält
schemaVersion 2, Ebenen und Zuordnungen. Ältere Programmversionen lesen Schema 2
nicht. Die native Dateidialog-Abnahme wurde hier nicht erneut durchgeführt;
der automatisierte Dateirundlauf ist bestanden. Der aktive nächste Auftrag steht
am Ende von DEVELOPMENT_PLAN.md.

Stand: 04.10.2026; geprüfte Basis 26987d1 (Integrationszweig nach PR #83).
Dieser Auftrag ist Planung. Schema, Bedienung und Produktionscode bleiben unverändert.

#### Bestand und Anforderungen

`src/lib/bim/model.ts` validiert strikt Schema 1 mit einem Geschoss, Wänden,
Fenstern und optionalen Linien. Es gibt weder Layer noch layerId. IDs sind
projektweit eindeutig. `history.ts` validiert Snapshots und lädt über
deserializeProject; seine Fehlermeldung nennt ausdrücklich Version 1.
`application/direct-edit/controller.ts` verwendet diese gemeinsame History.
`application/snapping/local-sources.ts` cached Geometrie nach unveränderlichem
Project; Sichtbarkeit ist bisher kein Ebenenfilter. Die Sichtbarkeitsprüfung der
3D-Fußpunkte behandelt Verdeckung durch Material, nicht Organisationsebenen.

| Quelle | Erhaltener Umfang | Abhängigkeit / Verantwortung |
| --- | --- | --- |
| Guide F25–F27, N16 | Standardebenen, stabile Zuordnung, frei zuordnen/erstellen/umbenennen | domain/layers, Project-Validierung; application/layers und gemeinsame History |
| Guide F28–F29, N17 | Organisation > Ebenen; Umschalter, einzeln/alle/außer Auswahl schalten | gemeinsamer Sichtbarkeitskontext vor Rendering, Auswahl und Fang; UI erst danach |
| N38 | Räume standardmäßig auf Raum | zusätzliche Ebene; Raumtyp bleibt späterer Auftrag |
| N39, N46, N49 | 2D-Ergänzungen, Bemaßung und Textelemente | Annotation-Scope bleibt eigenständiger Bezug; keine implizite Scope-Änderung durch Layer |
| N42, N47 | Wand-/Deckenaufbau | AssemblyLayer ist Materialschicht, keine Organisationsebene |
| N05–N06, N57–N60 | Ansichten und Abbilder mit eigener Darstellung | ModelView/DrawingDocument referenzieren dieselben Layer- und Element-IDs |
| N18–N19, N29, N53 | gleiche Aktionen aus Maus, Eigenschaften, Text/AI/Voice und Ansichten | stabile Ziel-ID und aktueller Projektkontext; keine zweite Mutation |
| N02, N21–N22, N25, N31 | Export, Geschosse/Höhen, Skalieren, Räume | Layer ändert weder Exportumfang, Höhenbezug noch Bauteil-Capability |

Die vollständige historische N01–N60-Matrix bleibt in
`FUNCTION_REQUIREMENTS_2026-10-03.md` erhalten. Dieser Abgleich aktualisiert den
Ebenenumfang, behauptet keine Neuabnahme aller dortigen historischen Statuswerte.
Andere Wünsche, insbesondere Wandachse, Sprachqualität, PDF/Bildreferenzen und
Auswahlumrandungen für weitere Typen, werden nicht verdrängt.

#### Verbindliche technische Grenzen

- Eine Organisationsebene besitzt stabile ID und Namen; mehrere Elemente teilen
  sie. Umbenennen verändert keine Referenz. Layer-IDs nehmen an der vorhandenen
  projektweiten Eindeutigkeitsprüfung teil. Layer und AssemblyLayer bleiben getrennt.
- Der kanonische neue Projektzustand muss für jede Wand, jedes Fenster und jede
  Linie eine gültige layerId haben. Keine zweite Bauteilkopie und kein zweiter
  Modellzustand für verborgene Elemente. Fenster behalten ihren wallId-Host.
- Fachliche Invarianten und Layer-Definitionen gehören nach domain/layers;
  gemeinsame Änderungen nach application/layers. Das bestehende model.ts bleibt
  vorerst der Integrationspunkt. Reine Dateimigration gehört nach
  interop/project-file; kein Domain-Import einer Datei-/UI-Abhängigkeit.
- Die Datei-Ladegrenze unterscheidet alte und aktuelle Version ausdrücklich.
  validateProject validiert den aktuellen Laufzeitzustand; es darf nicht bei jeder
  Bearbeitung stillschweigend alte Dateien migrieren. Bestehende Exportnamen können
  als kompatible Fassade erhalten bleiben, ohne zirkuläre Modulabhängigkeiten.
- Migration validiert die alte Datei vollständig vor der Umwandlung und danach
  den neuen Zustand. Unbekannte Versionen, defekte Hosts, doppelte IDs und ungültige
  Maße bleiben Fehler. Kein stilles Entfernen unbekannter Felder oder Bauteile.
- Migration verändert keine vorhandenen IDs, Meterkoordinaten, Öffnungsparameter
  oder Linienstile. Sie ist deterministisch und mutationsfrei. Laden ersetzt erst
  nach Erfolg den Zustand; eine fehlgeschlagene Migration erhält die offene Arbeit.
- Layer-Zuordnung ist eine atomare validierte Aktion; alle Ziele müssen existieren.
  Ungültige oder veraltete Ziele bewirken weder Teiländerung noch History-Eintrag.
  Erfolgreiche Änderungen verwenden die vorhandene Snapshot-History. AI/Text/Voice
  erhalten denselben Aktionsvertrag und keine eigene Zuordnungslogik.
- Spätere Sichtbarkeit muss dieselbe Berechtigungsentscheidung für Darstellung,
  Picking und Fang liefern. Quellen vor Schnittpunkt-/Dichteauswertung filtern;
  keine teure Gesamtberechnung mit nachträglichem Wegfiltern. Bereits aktive
  Referenzen auf verborgene Quellen dürfen keine verborgenen Führungen liefern.
  Cache-Schlüssel berücksichtigen wirksamen Kontext oder der Filter wird bei jeder
  lokalen Abfrage angewendet; ein reiner Project-Cache genügt nicht für View-Filter.
- Ausblenden ändert kein Modell, keine Öffnungsgeometrie und keinen IFC-Umfang.
  Exportauswahl ist ein eigener ausdrücklicher Vertrag. Löschen belegter Ebenen
  benötigt eine validierte Neuzuordnung; niemals zugehörige Elemente mitlöschen.

#### Begrenzter Entwurf für den ersten Implementierungsschritt

Vorgeschlagenes Schema 2 ergänzt `Project.layers` mit `{ id, name }` und `layerId`
an vorhandenen Elementen. Noch keine Sichtbarkeitsfelder und kein Assembly-Schema.
Die zwölf geforderten Standardnamen bleiben exakt erhalten:
Außenwand, Innenwand, Dach, Decke, Fenster, Tür, Möblierung, Geländer, Gelände,
2D-Zeichnungen, Neutrale Ebene, Bemaßung.
Raum und Textelemente ergänzen sie aus N38/N49. Die Bezeichnung 2D-Ergänzungen
aus N39 ersetzt 2D-Zeichnungen nicht; ihre mögliche eigene Kategorie bleibt offen.

Migration und Neuanlage verwenden dieselbe zentrale Standarddefinition. Wände
erhalten Außenwand, Linien/Polylinien 2D-Zeichnungen (Guide). Fenster erhalten als
dokumentierten technischen Startwert Fenster, ohne automatische Host-Vererbung.
Die vorhandene Fenster-Ebene begründet diesen Vorschlag; eine ausdrückliche
Nutzerentscheidung über Vererbung liegt nicht vor. Der erste Schritt verändert
keine Sichtbarkeit und hängt deshalb nicht von deren Entscheidung ab.

IDs dürfen nicht aus frei umbenennbaren Anzeigenamen laufend neu berechnet werden.
Die Migration erzeugt sie aus festen internen Schlüsseln; bei Kollision mit alten
Projekt-/Geschoss-/Element-IDs verwendet sie eine deterministische freie Variante.
Kein Überschreiben alter Identitäten. Nur der Version-1-Loader vergibt fehlende
Zuordnungen; eine Version-2-Datei mit fehlender/falscher layerId wird abgelehnt.
Version 2 wird anschließend geschrieben; ältere Programmstände können sie nicht
lesen. Kein automatisches Überschreiben der ursprünglichen Datei und kein
stiller verlustbehafteter Rückexport als Version 1.

#### Offene Produktentscheidungen vor dem Sichtbarkeitsschritt

- Global gemeinsame Sichtbarkeit oder pro ModelView? Wo werden erste Einstellungen
  gespeichert, solange echte gespeicherte ModelViews noch fehlen? Vorschlag:
  einen expliziten View-Kontext vorbereiten; noch kein globales Feld festschreiben.
- Wie erscheinen Fenster bei ausgeblendeter Host-Wand und umgekehrt? Die reale
  Öffnung darf durch einen Darstellungsfilter nicht aus der Wand verschwinden.
- Was geschieht mit aktueller Auswahl und laufender Bearbeitung beim Ausblenden
  ihrer Ebene? Vorschlag: Bearbeitung kontrolliert abbrechen, niemals unsichtbar
  weiterbestätigen; Entscheidung und Tests vor der UI-Einführung festhalten.
- Eigene Kategorie 2D-Ergänzungen oder Alias/Zuordnung zu 2D-Zeichnungen?
- Lösch-/Schutzregeln für Standardebenen und Verhalten gleichnamiger Ebenen vor
  Einführung von Erstellen/Umbenennen/Löschen konkretisieren.

Diese Fragen blockieren den reinen Migrations-/Zuordnungsschritt nicht. Keine
Antwort gilt durch diesen Entwurf als Nutzerfreigabe.

#### Genau ein Folgeauftrag: Ebenendaten und Version-1-Migration

Schema 2 mit zentralen Standardebenen und layerId für vorhandene Wände, Fenster
und Linien implementieren; gültige Version-1-Dateien an der Ladegrenze migrieren.
Eine gemeinsame Aktion zur Zuordnung vorhandener Element-IDs zu einer existierenden
Layer-ID ergänzen, mit Projekt-/Zielkontext für spätere UI-, Text- und Voice-Adapter.
Bestehende Erzeugungsaktionen zentral mit Standardzuordnungen versorgen, keine
Ebenenregeln in einzelne Werkzeuge kopieren. Keine neue Ebenen-UI, Sichtbarkeit,
Layer-Löschfunktion, Bauteile oder vollständige Ansichtsverwaltung in diesem Auftrag.

Abnahme: alte Dateien mit/ohne Linien; kollidierende neue Standard-IDs; fehlerhafte
alte und neue Dateien; unbekannte Version; wiederholtes Laden mit identischem
Ergebnis; unveränderte Geometrie/IFC und Host-Beziehungen; Zuordnung von Wand,
Fenster und Linie; atomare Ablehnung gemischter gültiger/ungültiger Ziele; stale
context; No-op ohne History; Undo/Redo und Schema-2-Dateirundlauf. Vorhandene 327
Tests erhalten/anpassen, Build/TypeScript/Lint ausführen. Praktisch anschließend:
altes Projekt öffnen, Maße/Positionen vergleichen, neu speichern und wieder öffnen.
Die native Dateidialog-Abnahme aus PR #83 bleibt bis zu einem echten Bediennachweis offen.




### Detail D06 – docs/LAYER_VISIBILITY_PLAN.md

Herkunft: `docs/LAYER_VISIBILITY_PLAN.md`, Snapshot main/PR237. Altstatus nicht als aktuelle Fertigmeldung lesen.

#### Gemeinsame Ebenensichtbarkeit — Entwurf 05.10.2026

Basis: 48a896f nach freigegebenem PR #89. Reiner Planungsauftrag zu Guide
Etappe 4, F28/F29 und N17; keine Sichtbarkeit implementiert.

#### Codeabgleich

- domain/project/schema.ts: Schema 2 mit Ebenen, keine gespeicherten ModelViews
  oder Sichtbarkeitsfelder. Standard- und belegte Ebenen sind loeschgeschuetzt.
- CadWorkspace/CadViewport: fluechtiger Pane-Index und Bildschirmaufteilung;
  ein Pane-Index ist keine dauerhaft stabile ModelView-ID.
- application/snapping/local-sources.ts cached Geometrie nach Project.
  constraints/snapping/local-source-index.ts hat bereits einen allowed-Filter
  fuer Punkte und Segmente VOR Paaranzahl und Schnittpunktberechnung.
- BimSolidView erstellt Solids aus dem vollstaendigen Projekt. Darstellung,
  Picking und Verdeckung muessen denselben wirksamen Kontext erhalten.

#### Verbindliche bestehende Architekturgrenzen

Eine Application-Policy entscheidet gemeinsam fuer Darstellung, Picking und Fang.
Keine Filter je Werkzeug und keine gefilterte zweite Project-Wahrheit. Reale
Fensteroeffnungen bleiben auch bei ausgeblendeter Fensterebene in der Wand.
IFC-Umfang bleibt unabhaengig von Bildschirmfiltern.

Den Geometrieindex weiterverwenden und Eligibility bei jeder Abfrage anwenden.
Sichtbarkeitskontext/Revision in die Gueltigkeit laufender Abfragen aufnehmen.
Entfernte aktive Referenzen und alle Quellen erzeugter Konstruktionspunkte
ebenfalls filtern: verborgene Quellen liefern keine Fluchten/Schnittpunkte.
3D-Verdeckung bleibt eine zusaetzliche Rendering-Pruefung.

#### Bestaetigte Nutzerentscheidungen — 05.10.2026

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

#### Genau ein naechster begrenzter Auftrag

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

#### Integrationsstand 05.10.2026

Die vorbereitenden Auftraege sind in PR #91–#93 umgesetzt und integriert. Auf feat/viewport-layer-visibility konsumieren nun bestehende 2D-/3D-Adapter, lokale Fangabfrage, 3D-Fussquellen und explizite Referenzwahl die gemeinsame Policy. CadWorkspace nimmt einen optionalen unveraenderlichen layerVisibility-Kontext entgegen; Standard bleibt all-visible. Modell und IFC bleiben vollstaendig. Verborgene Auswahl/Bearbeitung wird verworfen, aktive Referenzen werden vor Shift-Richtungsauswahl geprueft. Vorschaugeometrie nutzt dieselben Rendererfilter. Dies ist noch kein gespeichertes Sichtbarkeitsfeature.

358 automatisierte Tests bestanden; TypeScript/Build erfolgreich. Visuelle Browserabnahme wegen Lade-Timeouts offen. Naechster begrenzter Auftrag ist die BIM-Bedienung samt Dateimigration gemaess DEVELOPMENT_PLAN.md; vorher Undo-Semantik klaeren und Browserabnahme nachholen. Startfilter neuer Ausschnitte bleibt offen. Die vorherige Rubrik "Genau ein naechster begrenzter Auftrag" dokumentiert den inzwischen abgeschlossenen ersten Policy-Schritt.

#### Nutzerentscheidung und Umsetzung: getrennte Verlaeufe — 05.10.2026

Der Nutzer hat entschieden: globales Undo/Redo betrifft nur Modellveraenderungen; die Ebenenpalette bietet eigenes Undo/Redo fuer Sichtbarkeit. Schema 3 speichert den aktuellen BIM-Filter, nicht die sitzungsbezogenen Verlaufseintraege. V1/V2 werden strikt migriert und starten all-visible. Der Startfilter zukuenftiger Ausschnitte ist weiterhin offen.

Die Palette nutzt die gemeinsame Application-Aktion; der Renderer erhaelt den gespeicherten Filter. 363 Tests bestanden; Browserabnahme ist wegen Verbindungs-Timeouts noch offen. Der einzige naechste Auftrag ist die praktische Gesamtabnahme gemaess letztem Abschnitt in DEVELOPMENT_PLAN.md. Fruehere Rubriken mit Folgeauftraegen sind historische Zwischenstaende.




### Detail D07 – docs/LOCAL_SNAP_QUERY_PLAN.md

Herkunft: `docs/LOCAL_SNAP_QUERY_PLAN.md`, Snapshot main/PR237. Altstatus nicht als aktuelle Fertigmeldung lesen.

#### Lokale Fangabfrage: Codeabgleich und Migrationsplan

Stand: 04.10.2026. Planungsauftrag, keine neue Engine implementiert.
Basis: PR #53 (6a5f47a), zuvor lokal f55912e. Der Wiederverwendungsschritt ist unverändert veröffentlicht. #51–53 sind offen; keine Merge-Freigabe abgeleitet.

#### Verbindliche Zielregeln

- Sofortiger Fang auf nahe Endpunkte, Mittelpunkte und echte Segmentschnittpunkte. Die 600 ms steuern ausschließlich Referenzaktivierung/-lösung, nicht die Verfügbarkeit eines Fangtreffers.
- Räumliche Suche umfasst Punkte **und vollständige Segmentausdehnungen**: lange Linien mit weit entfernten Enden müssen an einer Kreuzung nahe der Maus gefunden werden.
- Nur lokale Segmentpaare erzeugen unmittelbare Schnittpunktkandidaten. Kein globales Schnittpunktverzeichnis im Produktionspfad auf Vorrat.
- Aktive, auch entfernte Referenzen und ihre Fluchten werden getrennt von lokalen Geometrietreffern ausgewertet. Der sofort gepinnte Bewegungsursprung bleibt erhalten.
- Eine gemeinsame Kandidatenrangfolge, gemeinsame Quellenausschlüsse und dieselben validierten Modellaktionen für Zeichnen und Direct Edit. Keine Werkzeugkopien.
- Fangabstand in CSS-Pixeln; Umrechnung in Modellmeter pro Abfrage. Zoom verändert den Suchbereich, nicht den geometrischen Index oder gültige Referenzen.
- Index und Quellenverzeichnis sind abgeleitete Daten des unveränderlichen Modellstands, nie eine zweite Modellhaltung und kein Bestandteil von JSON/IFC.

#### Iststand und konkrete Änderungen

| Vorhandenes Modul | Befund | Geplante Verantwortung |
|---|---|---|
| application/snapping/project-references.ts | Baut Punkte/Segmente und über segmentIntersectionReferences alle Kreuzungen. WeakMap hält den fertigen Satz je Project. | Primitive Quellen und Segmentgeometrie ohne globale Kreuzungen ableiten; Snapshot mit Index und stabilem Quellenverzeichnis wiederverwenden. |
| constraints/snapping/segment-references.ts | Vollständige Paarprüfung, kanonische Quellenreihenfolge und Abhängigkeiten. | Dieselbe exakte Schnittprüfung nur auf lokalen Segmenten; bisherige Vollprüfung als Testoracle behalten. |
| geometry/intersections/segments.ts und tolerances/model.ts | Geprüfte Schnitt- und Toleranzregeln. | Unverändert für endgültige Trefferentscheidung; konservative Suchboxen dürfen keine hier akzeptierten Treffer verlieren. |
| application/tools/snapping.ts, direct-edit/snapping.ts | Gemeinsamer Einstieg, Eigen-/Host-Ausschlüsse, feste Achsen. | Suchsnapshot und Quellenerlaubnis weitergeben; beide Blätter eines Schnittpunkts prüfen. Keine globale Listenfilterung pro Mausbewegung. |
| constraints/snapping/candidates.ts | Durchläuft alle Punktquellen; activeSources baut pro Abfrage eine vollständige Map. | Lokale Punkte getrennt von aktiven Quellen auswerten; Gültigkeit aktiver Quellen über Snapshot-Lookup prüfen. |
| constraints/inference/construction-reference.ts | Prüft Blattabhängigkeiten gegen vollständige Basisliste; acquisitionReference sucht Kandidaten in dieser Liste. | Identität und Blattgeometrie über Quellenverzeichnis prüfen; lokal erzeugte Schnittreferenz direkt übernehmen können. Kein räumlicher Ausschluss gültiger entfernter Blätter. |
| constraints/inference/hover-reference.ts | sameHoverSession hängt an Array-Identität. | Modell-/Policy-/Reset-Identität statt wechselnder lokaler Ergebnisliste; Mausbewegung darf Timer und Referenzen nicht pauschal zurücksetzen. |
| useHoverReference.ts, segment-hover.ts | Zweite querySnap-Abfrage und linearer Segmentscan für Referenzerwerb. | Dieselbe lokale Geometriesuche nutzen; bestehende getrennte Hover-Semantik und Zeitquelle erhalten. Hover-Abfrage muss nicht dieselben Achsbeschränkungen wie der Commit haben. |
| BimPlan.tsx | Liefert Kamera, Pointer, Policy, Hover und Darstellung. | Liefert Abfragekontext; enthält weder Indexbau noch eigene Schnittmathematik. Vorschau und Bestätigung verwenden dieselbe Auflösung. |

#### Gemeinsamer Abfragevertrag (Semantik verbindlich, Namen Vorschlag)

Modellaufbereitung liefert `SnapSourceSnapshot`: Modellidentität, primitive Punkt-/Segmentquellen, räumlicher Index und `lookup(sourceKey)`. Der Lookup enthält gespeicherte Blattquellen, keine vorsorglich erzeugten Kreuzungen. Der Index kennt nur Geometrie und opake Schlüssel; keine Wand-, Fenster- oder React-Typen.

Eine Abfrage erhält Mausposition, CSS-Maßstab/Fangradien, Snapshot, Werkzeug-Quellenerlaubnis, feste Achse/Shift/Ortho, aktive Referenzen und deren Richtungszustand. Ergebnis: lokale Punkt- und Segmentquellen, lokal berechnete Schnittreferenzen sowie davon getrennte gültige aktive Quellen. Die bestehende Engine erzeugt daraus Fang-/Guide-Kandidaten und verwendet ranking.ts. Hover darf denselben lokalen Suchdienst für Segmenttracking verwenden, ohne seine Auswahl künstlich auf die Commit-Achse zu beschränken.

Suchbox: um die Maus mit Radius `radiusPx / pixelsPerMetre`, konservativ um numerische Modellkompatibilität erweitert. Bei verschiedenen Hover-/Fangradien beide Abfragen beziehungsweise die größere Box mit nachträglicher exakter Prüfung verwenden. Bounding-Box-Überlappung ist nur Vorauswahl. Punktabstand, Segmentabstand, tatsächlicher Schnittpunkt und Kreisradius werden danach geprüft. Originalsegmente nicht auf die Suchbox zuschneiden: Das könnte künstliche Endpunkte und andere Toleranzentscheidungen erzeugen.

Lokale Schnittpunkte tragen weiterhin beide originalen Blattquellen, kanonisch sortierte Identität und Richtungen. Zuerst Quellenausschlüsse anwenden, dann lokale Paare schneiden, duplizierte Treffer deterministisch behandeln. Mehrere Paare am selben Ort nicht allein nach Koordinate zusammenwerfen: Herkunft und Ausschlüsse bleiben entscheidend. Räumliche Traversierungsreihenfolge darf das Ranking nicht beeinflussen.

Aktive Quellen werden über vollständige Identität/Geometriesnapshot und erlaubte Blätter validiert, nicht über Anwesenheit in der Suchbox und nicht allein über Element-ID. Pinned Origins gehören zur aktuellen Sitzung; konstruierte Punkte bleiben temporär mit abgeflachten Blattabhängigkeiten. Entfernte aktive Referenzen können lokale Fluchten und Flucht-Flucht-Schnittpunkte liefern. Eine zusätzliche neue Fangart „beliebige Flucht schneidet beliebiges Segment“ ist nicht Teil dieser Migration.

#### Lebenszyklus und vorgeschlagene Umsetzung

Verbindlich: neues unveränderliches Project erzeugt einen passenden Index; Werkzeug-/Ursprungswechsel und Zoom nicht. Undo/Redo dürfen einen Index des passenden historischen Snapshots wiederverwenden. Neu geladene Projekte mit gleichen IDs sind neue Snapshots. Abbruch ändert das Modell nicht; bestehende Regeln für Session-Ende und Referenz-Reset bleiben erhalten. WeakMap-Schlüssel vermeiden künstliches Festhalten gelöschter Projekte; während Snapshot-History ältere Modelle hält, können deren Indexdaten allerdings ebenfalls Speicher belegen. Dies ist zu messen, keine feste Speicherzusage.

Vorschlag für die erste Implementierung: statischer balancierter AABB-Baum mit konservativen Boxen für Punkt-/Segmentprimitive in geometry/spatial, gebaut je Modell-Snapshot. Er vermeidet die Vervielfachung sehr langer Segmente in vielen Rasterzellen. Application hält Zuordnung zu Modellquellen und Snapshot-Lookup; Constraints führt Fangabfrage und Rangfolge aus. Exakter Baumaufbau, Blattgröße und API-Namen sind Implementierungsentscheidungen, keine festgelegten Nutzerwünsche. Keine neue Bibliothek verbindlich gewählt.

Zunächst vollständiger Neuaufbau des **Primitivindex** bei Modelländerung; inkrementelle Indexupdates erst nach Messung und belastbarem Änderungsvertrag. Das ist bereits grundsätzlich anders als der bisherige vollständige Schnittpunktaufbau. Sehr dichte lokale Geometrie kann weiterhin viele Paare erfordern; keine harte Kandidatenkappung mit still verlorenem Fang.

#### Geordnete Migration

1. Reiner, funktionierender lokaler Quellensuchdienst mit Index, Lookup und lokalen Schnittpunkten; gegen bisherigen Vollaufbau vergleichen. Noch keine UI-Umschaltung. Dies ist der einzige jetzt ausführbare Folgeauftrag unten.
2. Danach gemeinsamen Engine-/Hover-Vertrag integrieren: lokale Geometrie und entfernte aktive Quellen trennen, Sitzungsidentität stabilisieren und Acquisition umstellen. Zeichnen, Idle-Hover und Direct Edit gemeinsam umschalten; keine Werkzeugkopien und kein Produktionsfallback, der unbemerkt global alle Kreuzungen erzeugt.
3. Danach praktische Abnahme und identische Größenklassen messen. Altes globales Verfahren bleibt nur Testoracle/alte Baseline; nicht behaupten, die bisherige kalte Messung sei schon der neue Produktionspfad.

Die Schritte 2–3 sind Abhängigkeiten, keine parallelen Aufträge. Kein Komplettumbau, keine leeren Interfaces/Klassen auf Vorrat.

#### Nachweise für die spätere Integration

- Sofortiger Fang bei 0/599 ms; Aktivieren/Lösen erst bei 600 ms, einmal pro Besuch.
- Lange kreuzende Segmente mit beiden Enden außerhalb der Suchbox, schräge/fast parallele Linien, Endberührung, kollineare Überlappung, kurze/entartete Geometrie, negative und große Koordinaten, Suchbox- und Fangradiusgrenzen.
- Gleiche Gewinner, Herkunft und Prioritäten gegenüber Vollprüfung bei mehreren Zoomstufen und unabhängig von Indexreihenfolge. Zoom darf lokale Treffer ändern, aber keine erworbene Referenz löschen.
- Entfernte aktive Referenzen und erworbene Schnittpunkte bleiben gültig, solange ihre Blätter gültig sind. Geänderte/gelöschte Quelle, gleiche IDs nach Laden, Undo/Redo und Session-Ende prüfen.
- Eigenmodell-/Fensterhost-Ausschlüsse, abhängige Schnittpunkte, feste Achsen, Shift/Ortho, Snap aus, Rasterfallback sowie gleiche Vorschau/Commit-Koordinaten erhalten.
- Modellaufbereitung, lokale Suche, lokale Schnittprüfung, aktive Guides und gesamte Abfrage getrennt messen; Kandidaten-/Paarzahlen zählen. 100/1000/5000 Elemente und zusätzlich dichte lokale Kreuzungen. Speicher und Wiederaufbau getrennt berichten, keine Browser-FPS aus Node-Zeiten ableiten.

#### Genau ein ausführbarer Folgeauftrag

Den reinen lokalen Quellensuchdienst implementieren: primitive Modellableitung ohne Kreuzungen, unveränderlicher räumlicher Index mit Quellen-Lookup, CSS-Radiusabfrage für Punkte und lange Segmente sowie lokale Schnittreferenzen mit bestehender Identität/Toleranz. Differentialtests gegen vollständigen Referenzaufbau im Suchradius und ein reproduzierbarer Messlauf für 100/1000/5000 Elemente. Keine UI-/Hover-Umschaltung, keine neue Fangart, kein globaler Index aller Kreuzungen. Der Dienst muss tatsächlich abfragbar und getestet sein, nicht nur aus Platzhaltertypen bestehen. Erst auf diesem Nachweis die gemeinsame Integration planen.




### Detail D08 – docs/PERSISTENT_T_RELATIONS.md

Herkunft: `docs/PERSISTENT_T_RELATIONS.md`, Snapshot main/PR237. Altstatus nicht als aktuelle Fertigmeldung lesen.

#### Dauerhafte T-Verbindungen: Implementierungsvertrag

Stand 06.10.2026, geprüft gegen 0939d01 (PR131).
Aktualisierung 06.10.2026: Schema 8 und gemeinsame Application-Aktionen sind
implementiert. Dieser Vertrag bleibt Grundlage; die frühere Kerntrennung und
Persistenzvorbereitung sind abgeschlossen. Automatische Erzeugung beim Fangen
ist der nächste begrenzte Auftrag in DEVELOPMENT_PLAN.md.

Fortschritt 06.10.2026: Die am Ende geplante Kerntrennung ist umgesetzt.
`t-pair.ts` arbeitet ohne Projektvalidierung, die öffentlichen Einstiege prüfen
weiterhin den vollständigen Snapshot. Aktueller Folgeauftrag: DEVELOPMENT_PLAN.md.

#### Bestätigte Bedienregeln

- Automatische Achsenanschlüsse sind das Ziel; das Diagnosefenster ist kein
  künftiger Pflichtschritt zum Verbinden.
- Einzelwandbewegung löst die Verbindung. Die andere Wand wird nicht mitgezogen.
- Nutzerantwort 06.10.2026: Beim Verlängern/Verkürzen eines Hauptwandendes bleibt
  der T-Anschluss an seiner bisherigen Weltposition. Liegt der Anschlusspunkt
  nicht mehr im Inneren der Hauptachse, löst sich die Verbindung. Nebenwand und
  Fensterpositionen werden nicht zur Erhaltung des Anschlusses verschoben.
- Fenster dürfen im T-Fall berühren, aber nicht überschneiden. Die strengeren
  Eckregeln bleiben unverändert. Eine Wandkette bildet weiterhin einen Undo-Schritt.

Ein Punkt weiterhin innerhalb der Achse bedeutet noch keine gültige Kontaktfläche:
Wenn die Kontaktbreite nach einer Kürzung über die Endkappe reicht, bleibt die
geometrische Prüfung erforderlich. Vorschlag für diese erste Integration:
Änderung atomar ablehnen, statt einen unzulässigen Körper zu speichern. Das ist
keine Freigabe für das Abschneiden von Kontaktflächen oder Fensteröffnungen.

#### Technische Entscheidung für die begrenzte Umsetzung

Erstes Ziel: isoliertes rechtwinkliges T-Paar gleicher Stärke/Höhe; Hauptwand
bleibt ein Bauteil. Mehrere Ts an einer Wand und Kombinationen mit Eckanschlüssen
bleiben vorerst ausgeschlossen, bis ihre Komposition geprüft ist.

Schema 8 ergänzen um storey.wallTJunctions mit Einträgen:

```
{ hostWallId, incoming: { wallId, endpoint: 0 | 1 } }
```

Keine separate Weltkoordinate, kein relativer Anker und kein zweites Profil
speichern: Der referenzierte Nebenachs-Endpunkt ist bereits der feste Weltanker.
Ändert sich die Hauptwandlänge, bleibt dieser Punkt unverändert. Beziehung über
IDs und Endindex, nie Navigatornummern. Doppelte, fehlende, selbstreferenzierende
oder konkurrierende Beziehungen strikt abweisen. Ein isoliertes Paar darf nicht
zusätzlich durch wallJoins gebunden sein. Die Reihenfolge der Relation ist
semantisch: Hauptwand und Nebenwand sind nicht austauschbar.

Bei Kürzung außerhalb des Achssegments wird die Relation im Änderungsvorgang
entfernt, der Nebenwandkörper bekommt wieder sein ungekürztes Ende. Ein solcher
Zustand darf nicht erst beim Laden repariert werden. Ungültige Beziehungen in
Dateien werden abgewiesen, nicht still gelöscht.

#### Codegrenzen und Integrationsreihenfolge

1. Domain t-openings in reinen Geometrie-/Öffnungskern und validierenden öffentlichen
   Einstieg trennen. Heute ruft inspectTOpenings validateProject auf. Dieser
   Aufruf darf nicht aus connectedWallSolids erfolgen, denn validateProject
   ruft connectedWallSolids bereits auf. Keine rekursive Projektvalidierung.
   Der interne Kern erhält aufgelöste Wandparameter/Fenster; die öffentliche
   Vorschau prüft weiterhin Projektzugehörigkeit und Kontext.
2. schema.ts: Schema 7 als strikten Altvertrag erhalten, Schema 8 ergänzen.
   load.ts: V7 erst validieren, dann wallTJunctions: [] ergänzen. V1–V6 weiter
   über explizite Migration führen. Bestehende IDs, Geometrie, Eckbezüge und
   Sichtbarkeit unverändert erhalten. Niemals beim Laden neue Ts erkennen.
3. connectedWallSolids: bestehende Ecken weiter ableiten; isolierte Ts über
   denselben Domain-Kern hinzufügen. wallContourSolid bleibt gemeinsame
   Extrusion. Bestehende Verbraucher für Grundriss, 3D, Picking, Fang und normalen
   IFC-Export sollen die gespeicherten Ts über diesen Pfad erhalten.
4. Gemeinsame Application-Aktion zum Anlegen/Lösen mit Quellprojekt, Host-ID,
   Neben-ID und Endindex. Vorschau validieren, Bestätigung genau ein Commit;
   veraltete Ziele abweisen. Keine per-Werkzeug-Mutation.
5. Die Auflösung bei Bearbeitung braucht Aktionsabsicht: Elementbewegung und
   Endpunkt-/Längenänderung unterscheiden. updateWall sieht nur neue Koordinaten;
   daraus darf nicht geraten werden, welcher Bedienvorgang stattfand. Expliziten
   Änderungskontext vom vorhandenen Direct-Edit-/Command-Pfad übergeben. Beim
   Lösen im selben Vorgang nicht sofort automatisch neu verbinden, auch wenn
   eine verschobene Hauptachse noch durch den Nebenpunkt verläuft.
6. Automatisches Erzeugen anschließend an vorhandenen Fangkontext anbinden:
   explizite Zielachse, stabiler Quellstand und passender Nebenendpunkt. Ein
   Fangradius ist keine Domain-Identität. Mehrdeutige Hosts nicht per Listenfolge
   wählen; bestehende Referenzauswahl nutzen. Keine globalen Wandpaarabfragen
   pro Mausbewegung. Normales Ändern/Laden darf keine neue Nachbarsuche auslösen.

#### Modellaktionen und Fenster

Änderungen an Stärke, Höhe oder Körperversatz durch dieselbe Validierung führen.
Solange gleiche Querschnitte Voraussetzung sind, unzulässige Änderungen atomar
abweisen; keine automatische Größenübernahme auf Nachbarwände erfinden.
Fensteränderungen müssen die gespeicherte T-Kontaktprüfung ausführen, auch bei
unsichtbaren Fenstern. Keine verdeckten Durchdringungen durch Layerfilter.

Maus, Eigenschaften, Text und Voice verwenden dieselben Aktionen einschließlich
Änderungskontext. Sprachbefehle beziehen sich auf stabile Auswahl-IDs; kein
separates Verbindungsmodell. Undo/Redo stellt Geometrie und Beziehung gemeinsam
wieder her; Sichtbarkeit bleibt in ihrer unabhängigen History.

#### Abnahmetests

- V1–V7 laden ohne zusätzliche T-Verknüpfungen; Schema-8-Rundlauf mit festen IDs.
- Hauptwandende verlängern: Nebenpunkt unverändert. Kürzen hinter den Nebenpunkt:
  Relation weg, Nebenwand unverändert, gerade Kappe, Undo/Redo stellt alles wieder her.
- Einzelwand bewegen: Relation lösen, keine Mitnahme und kein sofortiges Rejoin.
- Ungültiger Endrandkontakt, fehlende IDs, Duplikate, Mehrfachbezüge, konkurrierende
  Ecken und Fensterüberschneidungen: atomare Ablehnung, Eingaben unverändert.
- Freie/berührende Fenster, Achslagen, Endpunktumkehr und unveränderte GUIDs.
- Gleiche Konturen in Plan, 3D, Dateirundlauf und regulärem IFC; unabhängige
  IFC-Prüfung und Archicad-Abnahme. Der separate IFC-Test aus PR131 ist noch
  kein Nachweis einer gespeicherten T-Relation. Nutzerabnahme steht weiterhin aus.

#### Implementierungsnachweis und praktischer Test

500 Tests einschließlich 12 neuer Integrationsfälle; TypeScript/Build bestanden,
Lint ohne Fehler (6 bekannte FastRefresh-Warnungen). Generator:

```
node --experimental-strip-types scripts/generate-t-ifc-fixtures.mjs <Zielordner> --persistent
```

Erzeugt drei Schema-8-Projekte und reguläre IFC-Exporte (frei, berührend,
berührend/gedreht). IfcOpenShell 0.8.5 bestätigt IFC4/EXPRESS, Profile,
Zuordnungen, Platzierungen und analytische Nettovolumina aller drei Dateien.
Der Modus ohne --persistent bleibt separater Abnahmeexport ohne gespeicherte T.

1. t-free.project.json über Open project laden, 2D und 3D ansehen.
2. Wall 1 auswählen und Länge von 6 auf 8 m ändern: Nebenwand bleibt stehen,
   T bleibt erhalten. Mit Undo den Ausgangsstand wiederherstellen.
3. Wall 1 auf 2 m kürzen: Verbindung löst sich, Nebenwand behält ihre Position.
   Undo/Redo stellt Beziehung und Geometrie gemeinsam wieder her.
4. Eine Wand frei verschieben: Verbindung löst sich ohne Mitnahme der anderen.
5. Speichern, erneut öffnen und den normalen IFC-Button verwenden.
6. t-touch.project.json prüft erlaubte Fensterberührung; Änderung der Host-
   Fensterposition zur Mitte muss die Überschneidung ablehnen.

Browser-Laden und 3D-Darstellung geprüft. Save und IFC melden erfolgreiche
Erstellung/Downloadanforderung; der Automations-Downloadpfad blieb aus, daher
keine Behauptung eines geprüften Browser-Download-Dateirundlaufs. Dieser ist
als manueller Abnahmeschritt offen, JSON-Rundlauf ist durch Tests abgesichert.
Archicad-Abnahme dieser regulären T-Dateien bleibt ebenfalls offen.

#### Anbindung an Achsenfang

Der gemeinsame 2D-Endpunktpfad ist jetzt angebunden: eindeutiger lokaler
Achsenfang übergibt Hauptwand-ID und Ziel an Vorschau/Commit. Bewegung und
T-Relation werden gemeinsam übernommen. Numerische Ziele ohne Fangabsicht
und ganze Elementbewegungen erzeugen keine neue Verbindung. Mehrdeutige Hosts
lassen sich über die vorhandene Referenzauswahl eingrenzen. Browsernachweis:
2,30-m-Nebenwand auf Hauptachse gesetzt, 3,00-m-Achse / 2,82-m-Körperprofil,
Undo/Redo und 3D korrekt. 509 Tests bestanden.

#### Nächster Auftrag

Den vorhandenen 3D-Arbeitsebenen-Endpunktpfad an denselben Kandidatentransport
anbinden; gemeinsame Application-Aktion wiederverwenden. Aktueller Detailauftrag
steht in DEVELOPMENT_PLAN.md. Keine zweite Geometrie und keine Pflichtbedienung
im Diagnosefenster.




### Detail D09 – docs/REFERENCE_SELECTION_PLAN.md

Herkunft: `docs/REFERENCE_SELECTION_PLAN.md`, Snapshot main/PR237. Altstatus nicht als aktuelle Fertigmeldung lesen.

#### Gemeinsamer Vertrag: optionale Referenzauswahl

Stand 04.10.2026. Ausgearbeiteter Umsetzungsvorschlag, keine bereits implementierte Funktion. Nutzerziel: gezielte Kontrolle bei außergewöhnlich vielen Fangquellen; Häufigkeit in echten Projekten unbekannt. Bestehende Architekturregeln bleiben verbindlich. Zahlen und neue Bedienregeln unten sind vorläufige technische Vorschläge.

#### Auslösung und unveränderte Grundfunktionen

Nach AABB-Suche, geometrischem Nähefilter und Werkzeug-/Hostausschluss N tatsächlich nahe Segmente zählen, bevor Paare gebildet werden. Vorschlag: bei N > 32 automatische lokale Segmentschnittpunkte aussetzen. Bis 32 entstehen höchstens 496 Paare; der gemessene Fall mit 100 Segmenten benötigte bereits etwa 28 ms. Die Schwelle ist eine vorsichtige Startkonfiguration, kein gemessener Latenznachweis für 32 Segmente. Im Umsetzungsschritt 24/32/33/48 Segmente messen und den Wert gegebenenfalls begründet anpassen.

Eintritt sofort vor teurer Arbeit; Wiederaufnahme erst bei N <= 24 für 250 ms kontinuierlich gültiger Abfragen. Bei Zwischenwerten Zustand halten. Verlassen des Canvas unterbricht diese Zeit; im Hintergrund keine Paarberechnung. Kameraänderung setzt nur den Wiederaufnahme-Timer zurück. Die 600-ms-Regel bleibt ausschließlich für Hover-Referenzen zuständig.

Hinweis: „Viele mögliche Fangziele – automatische Schnittpunkte pausiert“ mit Aktion „Referenzen auswählen“. Er erscheint im betroffenen Viewport, ohne Dialog oder Fokusentzug. Endpunkte, Mittelpunkte, Raster, feste Achsen und die begrenzten aktiven Hilfsführungen bleiben nutzbar. Ohne Auswahl kann der Nutzer damit weiterarbeiten. Keine stillschweigend ausgeblendeten Schnittpunkte und keine Teilmenge zufällig zuerst gefundener Paare.

#### Auswahl und Zustände

Dichtezustand (normal/pausiert) und Auswahlzustand (automatisch/auswählen/eingeschränkt) getrennt führen. Ein zentraler reiner Application-Controller verwaltet Ereignisse, keine Zustandsschalter in jedem Werkzeug.

| Ereignis | Wirkung |
|---|---|
| Referenzen auswählen | Entwurf/letzte Vorschau einfrieren, vorhandene bestätigte Auswahl als Arbeitskopie übernehmen, übrige Geometrie dezent abblenden |
| Klick auf Segment | Segment in Arbeitskopie umschalten; keine Modellselektion, kein Bewegungsklick |
| Klick auf vorhandenen Punkt | Explizite Hilfsreferenz vormerken; keine Null-Längen-Linie und kein Segmentpaar erzeugen |
| Übernehmen / Enter | Nichtleere gültige Arbeitskopie bestätigen; Auswahlmodus verlassen und denselben Entwurf fortsetzen |
| Abbrechen / Escape | Arbeitskopie verwerfen, vorherige Auswahl und Entwurf erhalten; Escape nicht zusätzlich ans Werkzeug weiterreichen |
| Auswahl aufheben | Automatischen Modus wiederherstellen; bei weiter dichter Geometrie bleiben automatische Schnittpunkte sichtbar pausiert |
| Vorgang bestätigen/abbrechen, Werkzeugwechsel, Modellwechsel/Undo/Redo/Laden | Auswahl und suspendierten Kontext verwerfen, vorhandenen gemeinsamen Sitzungsreset verwenden |

Keine automatische Bestätigung nach dem zweiten Klick. Eine einzelne Linie oder ein Punkt ist als Hilfsreferenz sinnvoll; ein einzelnes Segment erzeugt keine lokale Kreuzung. Entfernte aktive Referenzen und Ursprung bleiben beim Eintritt erhalten. Hover-Erwerb/-Entfernung und Richtungsupdates während der Auswahl suspendieren; angezeigte Führungen einfrieren. Nach Rückkehr beginnt eine neue Hover-Verweildauer, ohne gespeicherte Referenzen zu löschen.

Punktübernahme verwendet den vorhandenen Referenzvertrag und dessen Kapazitäts-/Verdrängungsregeln, kein unbegrenzter zweiter Hilfsreferenzsatz. Vor Bestätigung anzeigen, falls dadurch ältere unfixierte Referenzen ersetzt werden. Segmentauswahl schränkt die automatischen Paare ein; Paralleltracking bleibt im bestehenden Hover-System.

#### Quellenfilter und Identität

Auswahl besteht aus stabiler Element-ID, Quellfeature/Segment-ID und gebundenem Project-Snapshot. Der bisherige referenceKey enthält Koordinaten und darf nicht als dauerhaft modellübergreifende ID missverstanden werden. Polylinien: einzelne Teilsegmente auswählen, nicht automatisch alle Segmente des Elements. Zwei geradlinige Segmente bedeuten ein Paar.

Reihenfolge: lokale Quellen suchen → geometrisch verfeinern → Werkzeugregeln anwenden → ausgewählte Segmentmenge schneiden → Dichte prüfen → zulässige Paare berechnen → bestehende Kandidatenrangfolge. End-/Mittelpunkte bleiben auch von nicht ausgewählten Elementen verfügbar. Aktive entfernte Führungen werden getrennt über vollständigen Lookup validiert; sie ziehen keine zusätzlichen Modellsegmente in die Paarbildung. Damit entsteht kein unbeabsichtigtes ausgewählt-mal-alle.

Wenn die manuelle Auswahl selbst zu viele nahe Segmente enthält, bleibt Paarbildung ausgesetzt und der Hinweis fordert Reduzierung. Keine verdeckte Trunkierung. Nach Auswahlbestätigung Dichte neu auswerten; eine kleine gültige Menge darf sofort wieder rechnen, die Hysterese betrifft automatische Wechsel bei Mausbewegung.

#### Lebenszyklus und Eingaben

Zoom/Pan erhalten bestätigte Auswahl und aktive Referenzen; sie ändern nur lokale Kandidatenzahl und sichtbare Marker. Während der Auswahl dürfen Navigation und Kandidatenhighlight arbeiten, aber weder numerisches Übernehmen noch Text-/Sprachaktion den suspendierten Vorgang bestätigen. Modale Dialoge behalten ihre vorhandene Priorität. Nach Modelländerung durch einen anderen Eingang wird die Auswahl ungültig, verspätete Ereignisse werden abgewiesen.

Die ToolInteraction.identity wechselt beim nächsten Polylinienpunkt. Daher Auswahl an eine explizite übergeordnete Vorgangsidentität binden: gesamte Wand-/Linienzeichnung oder EditSession; Ursprung darf innerhalb desselben Zeichenvorgangs wechseln. Kein globaler persistenter Filter. Idle-Hover erhält eine viewportbezogene temporäre Sitzung, endet bei Werkzeugstart, Modellwechsel oder Aufheben; keine Übernahme in einen neuen Vorgang.

Überlappende Treffer: gemeinsames Picking liefert eine deterministisch sortierte Trefferliste mit stabilen Quellidentitäten. Bei Mehrdeutigkeit kleine Liste nahe dem Zeiger mit Elementname, Teilsegment und Hervorhebung; kein stilles Wählen nach SVG-Reihenfolge. Esc schließt zuerst diese Liste, dann erst beim nächsten Esc den Auswahlmodus. Tab navigiert im Auswahlpanel und darf nicht die pausierte Längen-/Winkeleingabe aktivieren.

#### Abgleich mit vorhandenem Code

- application/snapping/local-sources.ts berechnet aktuell Paare direkt in query. Für die geplante Schranke primitive lokale Abfrage und Paarbildung trennen; keine nachträgliche Filterung. Vollständigen Lookup und Snapshotcache behalten.
- application/tools/snapping.ts bleibt gemeinsamer Einstieg für alle Tools. Auswahl/Dichte als expliziter Kontext und strukturiertes Ergebnis mit Pausenstatus führen. querySnap darf keine versteckten Zustandsänderungen auslösen; reine Abfragen können mehrfach pro Pointerereignis laufen.
- constraints/snapping/engine.ts behält Geometrie und Ranking. Keine React-, Dialog- oder Projektzustände dort.
- useHoverReference.ts und BimPlan.tsx müssen dasselbe aufgelöste Quellen-/Pausenergebnis verwenden. Eine unabhängige Hover-Abfrage darf die teuren Paare nicht erneut starten. sameHoverSession darf durch Dichtehinweis oder Auswahlpanel nicht versehentlich Referenzen verlieren.
- useToolInteraction.ts erhält gemeinsame Suspend-/Resume-Semantik. BimPlan leitet Auswahlklicks vor den vorhandenen Zeichen-, Doppelclick-, Edit- und normalen Selektionshandlern um. Keine neue Bedienlogik in einzelnen Wall-/Line-Adaptern.
- Rendering liefert Treffer/Highlight, Application prüft Auswahlzulässigkeit. Auswahlpanel bleibt getrennt von fachlichen Werkzeugeigenschaften; dort keine Bauteileigenschaften duplizieren.

#### Genau ein nächstes Umsetzungspaket

Gemeinsame Dichteschranke mit sichtbarem Viewportstatus implementieren, zunächst ohne Referenzauswahl-Picking. Lokale primitive Abfrage von Paarbildung trennen und expliziten Pausenstatus gemeinsam an Zeichnen, Direct Edit und Hover liefern. Timer/Hysterese durch einen Controller mit injizierter Zeit; keine Seiteneffekte in querySnap. Hinweis zunächst ehrlich „Viele Fangziele – automatische Schnittpunkte pausiert; Ansicht vergrößern“, ohne funktionslosen Auswahlbutton. Schwellenfälle messen; alle aktuellen Funktionen erhalten. Danach ist die Auswahloberfläche ein separates kleines Paket auf demselben Vertrag.

Abnahmetests für dieses Paket: 32/33 und 24/25 Grenzfälle; genau 250 ms Wiederaufnahme; keine Paarfunktion im pausierten Pfad; End-/Mittelpunkt und entfernte Führungen bleiben verfügbar; Eigen-/Hostausschluss vor Zählung; identischer Fang unterhalb der Schranke; Zoom erhält Referenzen; Snap aus, Abbruch und Modellwechsel; Zeichnen/Direct Edit/Hover ohne Umgehung; sichtbarer Status stimmt mit tatsächlich ausgeführter Suche überein. Keine allgemeine Performancezusage.

Spätere Auswahltests: Klick bestätigt niemals Modellaktion, Arbeitskopie/Cancel und frühere Auswahl, Polylinienpunktwechsel, mehrdeutiges Picking, Punktkapazität, Idle-Sitzung, Modal/Tab/Escape, veraltete Bestätigung. Keine vollständige Auswahlimplementierung im ersten Paket.

#### Umsetzungsstand 04.10.2026

Erstes Paket umgesetzt: gemeinsame Dichteschranke und sichtbarer Status. Startwerte 32/24/250 ms durch Grenztests und Messung geprüft; siehe performance/SNAP_DENSITY.md. Auswahl-Picking weiterhin Vorschlag. Nächstes Paket: temporäre Segmentauswahl gemäß DEVELOPMENT_PLAN; Punktübernahme separat.


#### Zweites Paket umgesetzt: Segmentauswahl

Temporärer Application-Zustand und Segmentfilter sind integriert. Rendering liefert deterministische Treffer, React bindet Auswahlpanel und suspendiert die gemeinsame ToolInteraction. Bestätigte Auswahl überlebt Zoom und Polylinienpunkte, endet bei Modell-/Vorgangswechsel. Segmentidentitäten sind an den aktuellen Modellsnapshot gebunden, keine persistierten Bauteil-IDs. End-/Mittelpunkte und aktive Referenzen bleiben vom Paarfilter unberührt. 250 Tests sowie Browserabnahme gemäß DEVELOPMENT_PLAN. Explizite Punktübernahme und ihre Kapazitätsanzeige bleiben der nächste begrenzte Auftrag.




### Detail D10 – docs/T_WALL_CONNECTION_PLAN.md

Herkunft: `docs/T_WALL_CONNECTION_PLAN.md`, Snapshot main/PR237. Altstatus nicht als aktuelle Fertigmeldung lesen.

#### T-Wandanschluss: begrenzter Arbeitsentwurf

Stand 06.10.2026, geprüft gegen Integrationscommit 41f17ba (PR125).
Dies ist ein Arbeitsentwurf, keine implementierte persistente T-Verbindung.

Fortschritt 06.10.2026: Der zuletzt beschriebene reine Geometriehelfer ist in
`src/domain/elements/wall/t-junction.ts` implementiert und getestet. Die übrigen
Vorschläge bleiben unverändert offen. Der aktuelle Folgeauftrag steht im
DEVELOPMENT_PLAN.md; die folgende Planung bleibt als fachlicher Kontext erhalten.

#### Bestand und verbindliche Grundlagen

- `src/domain/elements/wall/connections.ts` speichert derzeit ausschließlich
  Endpunktpaare. `reconcileWallJoins` sucht identische Achsenden; eine Berührung
  mitten auf einer Wandachse erzeugt ausdrücklich keinen Anschluss.
- `connectedWallContours` kombiniert zwei Endkonturen, prüft Fenster und leitet
  über `contour-solid.ts` dieselben Körper für Grundriss, 3D und IFC ab.
- `src/domain/project/schema.ts` und `src/interop/project-file/load.ts` validieren
  Schema 7 streng. Ein T-Anschluss ist mit zwei `WallEnd`-Werten nicht darstellbar.
- `src/application/snapping/project-references.ts` liefert Achsen als Segmente.
  Die gemeinsame Fangengine bleibt zuständig; weder Werkzeug noch Wand-Domain
  bekommt einen eigenen Mausabstand oder eine eigene Hover-Logik.
- `src/geometry/solids/profile-openings.ts` extrudiert konvexe Konturen mit
  Durchgangsöffnungen. Ein rechtwinkliger stumpfer Anschluss benötigt zunächst
  keine allgemeinen Booleschen Operationen.
- Nutzerentscheidung: Achsenanschlüsse sollen automatisch entstehen; einzelne
  wegbewegte Wände lösen Verbindungen. Wandketten bilden einen Undo-Schritt.
  Für T-spezifische Folgeregeln liegt noch keine Nutzerentscheidung vor.

Verbindliche Architekturgrenzen: stabile Bauteil-IDs, keine zweite Modellkopie,
Vorschau ohne Modellmutation, gemeinsame Application-Aktionen und Validierung,
keine autoritative Geometrie in React oder im IFC-Adapter. Sichtbarkeit verändert
weder Verbindungen noch den vollständigen IFC-Export.

#### Vorgeschlagene erste Geometrie

Zunächst ein rechtwinkliges T aus zwei geraden Wänden gleicher Höhe und Stärke:
Die Achse der ankommenden Wand endet im Inneren des Achssegments der Hauptwand.
Die Hauptwand bleibt ein Bauteil mit unveränderter ID, Achse und Kontur. Der
ankommende Wandkörper endet an der zugewandten Körperfläche der Hauptwand.
Die Körper berühren sich dort ohne Volumenüberdeckung. Die Zeichenachse darf
bis zur Hauptwandachse reichen; sie ist kein zusätzliches physisches Bauteil.

Die Anschlussseite wird aus der vom Knoten wegführenden Richtung der ankommenden
Wand bestimmt, nicht aus Bildschirmorientierung oder einer geratenen Reihenfolge.
Alle drei Achslagen und beide Zeichenrichtungen müssen dasselbe physische
Ergebnis ergeben. Die ganze Breite des Anschlusses muss innerhalb einer geraden
Seite der Hauptwand liegen. Randkontakt, Übergriff über deren Enden, zu kurze
ankommende Wände, parallele oder schräge T-Achsen werden zunächst abgewiesen.
Bestehende Eckanschlüsse am jeweils anderen Ende dürfen nicht überschrieben
werden; ihre Kombination ist vor produktiver Integration gesondert zu prüfen.

Vorschlag Öffnungen: Fenster der ankommenden Wand dürfen den neuen Abschluss
nicht berühren oder überschreiten. An der Hauptwand darf im Anschlussbereich
kein Fenster liegen oder dessen Rand berührt werden. Die Schutzprüfung erfolgt
mit der vollständigen Kontaktbreite, nicht nur dem Achsknoten. Kein frei erfundener
Zentimeterabstand: zunächst geometrischer Nichtkontakt nach Modell-Toleranzen.
Höhenabhängige Sonderfälle und Durchdringungen bleiben außerhalb dieses Schritts.

Beispiel: Hauptachse (0,0)–(6,0), Stärke 0,36 m, mittige Achse; Nebenachse
(3,-3)–(3,0), ebenfalls 0,36 m und Höhe 2,80 m. Der Nebenwandkörper endet bei
y=-0,18. Ohne Öffnungen beträgt das Gesamtvolumen
(6*0,36 + 2,82*0,36)*2,80 = 8,89056 m³. Beide IDs bleiben erhalten.

#### Persistenz und Bedienung: Vorschläge, noch nicht festgelegt

Eine spätere Relation benötigt mindestens ankommende Wand-ID und Endindex,
Hauptwand-ID sowie einen eindeutig definierten Anker auf deren Achse. Ob der
Anker relativ oder als Abstand gespeichert wird, hängt vom Änderungsverhalten
ab und bleibt offen. Keine zusätzliche editable Kontur speichern.

Die spätere Schemaerweiterung muss bestehende Endpunktpaare unverändert lesen.
Alte Dateien erhalten keine T-Verbindungen allein durch Laden. Die Migration
muss nach altem Vertrag prüfen und anschließend explizit konvertieren; keine
Umdeutung bisher überlappender Wände. Noch keine Schemaänderung in diesem Auftrag.

Zu entscheiden vor automatischer Bedienintegration:

1. Ändert sich die Hauptwandlänge: soll der T-Anker relativ mitwandern, einen
   Abstand vom Anfang behalten oder sich lösen? Keine Variante ist bestätigt.
2. Wird die Hauptwand bewegt: soll die Nebenwand folgen oder die Verbindung
   gemäß der Einzelwandregel gelöst werden? Vorschlag: lösen, nicht mitziehen.
3. Mehrere mögliche Hauptwände: Vorschlag explizite Zielwahl über den vorhandenen
   Referenzkontext; niemals still die erste Wand auswählen.
4. Fenster am Hauptwandanschluss: vorgeschlagene Nichtkontaktregel bestätigen.
5. Mehrere T-Anschlüsse und vorhandene Eckgehrungen: Kontakte dürfen sich nicht
   überschneiden. Diese Kombination erst nach dem einzelnen T integrieren.

Der geänderte Endpunkt muss auf das konkrete Achssegment gefangen/projiziert
werden. Fangradius dient der Auswahl, nicht der Modellidentität. Keine pauschale
Suche nach beliebigen nahen Wänden beim Speichern oder Laden. Für einen späteren
Commit müssen Quellprojekt, Ziel-ID und gültiges Achssegment weiterhin passen.

#### Gemeinsame Aktionen, Text und Sprache

Text/Voice sind gemäß Leitfaden begleitende Adapter bereits geprüfter Aktionen.
Die letzte Nutzer-Rückfrage ist kein Auftrag, Sprache generell zurückzustellen.
PR124 (Offset-Textadapter) ist separat offen; Freigabe von PR125 führt PR124 nicht
mit zusammen. Der vorgesehene Sprachadapter kann auf dessen geprüftem Aktionspfad
aufbauen, sobald der Abhängigkeitsstand übernommen ist.

Auch künftige T-Befehle verwenden dieselbe Application-Aktion wie Maus/Inspector.
Zielkontext enthält stabile IDs beider Wände, Endindex, Quellstand und den
bestätigten Achsanker. Erkennung normalisiert Eingaben; sie berechnet weder
Wandgeometrie noch Verbindungen. Fehlende Hauptwand wird erfragt, nicht geraten.
Vorschau, Bestätigung, Abbruch, stale-context-Prüfung und Undo bleiben gemeinsam.
Für den zunächst reinen Geometriehelfer gibt es noch keine neue Sprachaktion.

#### Nachweise vor Bedienfreigabe

- Geometrie: obiges analytisches Volumen, exakter Flächenkontakt ohne Überlappung,
  beide Anschlussseiten, Achslagen, Endpunktumkehr, Rotation und Translation;
  Grenzfälle kurzer Wände und Kontakte nahe Endkappen.
- Öffnungen: beide Wände, knapp frei/berührend/überlappend, unveränderte Eingaben
  bei Ablehnung. Geprüfte rechte und schräge Eckanschlüsse bleiben erhalten.
- Integration: zeichnen und verschieben auf einen Achspunkt, Abbruch, Ablehnung,
  Auflösen und Undo/Redo; Wandkette weiterhin atomar. ID und Fensterzuordnung
  der ungeteilten Hauptwand bleiben stabil.
- Dateien: alte Projekte unverändert; neue Relation rundlaufstabil; veraltete,
  unbekannte oder widersprüchliche Bezüge werden abgewiesen.
- Darstellung/Export: identische gemeinsame Konturen und Netto-Volumina in Plan,
  3D und IFC; IfcOpenShell-Prüfung plus anschließend Nutzerabnahme in Archicad.
- Große Modelle: Kandidatensuche über bestehende räumliche Infrastruktur, keine
  globalen Wandpaarvergleiche bei jedem Mausereignis.

#### Genau ein ausführbarer Folgeauftrag

Implementiere und teste einen reinen Domain-Geometriehelfer für das oben
beschriebene rechtwinklige T ohne Fenster und ohne weitere Anschlüsse an diesen
beiden Wänden. Er nimmt zwei explizite Wandparameter und den Endindex entgegen,
validiert die begrenzte Geometrie und liefert unveränderte Hauptkontur,
gekürzte Nebenkontur und Kontaktsegment als abgeleitetes Ergebnis. Nutze
bestehende Körper-, Projektions- und Polygonprüfungen, keine neue Modellstruktur.
Prüfe analytisches Volumen, beide Seiten/Achslagen/Orientierungen sowie ungültige
und kurze Eingaben. Keine Persistenz, automatischen Verbindungen, UI oder neuen
Befehle in diesem Teilauftrag. Seine Prüfung benötigt keine Entscheidung über
das noch offene Verhalten beim späteren Verschieben der Hauptwand.

#### Konkretisierung der Öffnungsprüfung — 06.10.2026

Siehe [T-Fensterprüfung](T_WINDOW_VALIDATION.md) für zuständige Module,
Kontaktintervalle und konkrete Grenztests. Die Berührungsregel ist angefragt,
noch nicht bestätigt; automatische T-Verbindungen bleiben unverändert offen.




### Detail D11 – docs/WALL_CORNER_PLAN.md

Herkunft: `docs/WALL_CORNER_PLAN.md`, Snapshot main/PR237. Altstatus nicht als aktuelle Fertigmeldung lesen.

#### Erster Wand-Eckanschluss: Arbeitsentwurf

#### Aktueller verbindlicher Stand — 05.10.2026

Die folgenden historischen Abschnitte sind durch automatische rechtwinklige
Anschluesse (Schema 6) ergaenzt/ersetzt: gleiche Achsenden beim Erstellen oder
Bewegen verbinden ohne Menuebestaetigung. Nutzer hat Oeffnungsberuehrung am
Anschluss abgelehnt und gerade Enden beim automatischen Loesen bestaetigt.
Regulaere 2D/3D-/IFC-Ausgabe, History und Dateimigration sind integriert.
Details/Grenzen: [Automatische Wandanschluesse](AUTOMATIC_WALL_CONNECTIONS.md).
Naechster Schritt ist Wandkettenzeichnen; Undo soll laut Nutzerentscheidung die
gesamte Kette zuruecknehmen. Die alte explizite Menuepflicht gilt nicht mehr.

Stand: 05.10.2026. Codebasis: Integrationszweig `fix/reference-selection-lifecycle`,
Commit `39b5b81` nach Merge von PR #111. Dieser Auftrag aktualisiert die Planung;
Anschlussgeometrie ist weiterhin nicht implementiert. Die unten datierten
Nutzerentscheidungen sind verbindlich; technische Vorschlaege bleiben getrennt.

#### Nachgewiesener Stand

| Bereich | Vorhandener Pfad | Bedeutung fuer Anschluesse |
| --- | --- | --- |
| Parameter und Validierung | `src/domain/project/schema.ts` | Wand hat Achsanfang/-ende, Staerke, Hoehe, Ebene und bodyOffset. Schema 5; keine Anschlussrelation. |
| Aenderungen | `src/lib/bim/model.ts`, `src/application/direct-edit/transforms.ts` | Validierte immutable Snapshots. Ganzelementbewegung erhaelt relative Fensterpositionen. Einzelne Wand wird geaendert; Nachbarwand folgt nicht automatisch. |
| Grundriss | `src/components/cad/BimPlan.tsx`, `src/rendering/viewport/layer-display.ts` | Rotiertes Rechteck pro Wand, getrennte Fensterdarstellung. Keine gemeinsame Anschlusskontur. |
| 3D | `src/lib/bim/geometry.ts` | `buildSolid` erzeugt je Wand belegte Zellen um Oeffnungen. Keine wanduebergreifende Vereinigung; ueberlappende Wandvolumen werden mehrfach summiert. |
| IFC | `src/lib/bim/ifc.ts` | Eigenes rechteckiges Extrusionsprofil je Wand, separate Oeffnung/Voids. Eine reine 3D-Korrektur wuerde IFC nicht mitkorrigieren. |
| Fang und Griffe | `src/application/snapping/project-references.ts`, `src/rendering/viewport/wall-foot-sources.ts` | Achsenden/Mitte bleiben fest; Koerperecken aus domain/elements/wall/body.ts enthalten bodyOffset +/- halbe Staerke; reale 3D-Fusskanten aus Flaechen. Nach Anschlussaenderung gemeinsam aktualisieren. |
| History/Datei | `src/lib/bim/history.ts`, `src/interop/project-file/load.ts` | Validierte Snapshots, Migration. Dauerhafte Anschlussdaten benoetigen eine ausdrueckliche Schemaentscheidung. |

Fenster passen heute in die Achslaenge und Wandhoehe. Ueberlappende Fenster werden
im 3D-Volumen als Vereinigung ausgeschnitten; fachliches Verbot von Ueberlappung,
Randabstaende und Anschlusszonen sind noch nicht allgemein geregelt. Dies nicht
mit bereits implementierter Oeffnungsvalidierung verwechseln.

#### Verbindliche vorhandene Grenzen

- Eine Wand bleibt ein Bauteil mit stabiler ID. Eine berechnete Anschlusskontur ist
  eine Ableitung, keine zweite bearbeitbare Wand.
- Geometrische Hilfsfunktionen kennen keine BIM-/React-/IFC-Typen. Fachliche
  Anschlussregeln gehoeren in Domain; Aenderung/Validierung/History in Application.
  Renderer und IFC lesen dieselbe fachlich abgeleitete Geometrie.
- Sichtbarkeit veraendert keine physische Anschlussgeometrie: erst vollstaendig
  ableiten, danach filtern. Versteckte Nachbarn bleiben physisch vorhanden.
- Modell-Metertoleranz und Bildschirm-Fangradius sind getrennt. Die bestehende
  `pointsCompatible`-Funktion ist numerische Kompatibilitaet, keine Anweisung,
  benachbarte Wandenden automatisch zu verbinden oder zu verschieben.
- Maus, Eigenschaften und spaetere Text-/Voice-/AI-Adapter verwenden dieselben
  validierten Aktionen mit stabilen Ziel-IDs und Snapshot-Pruefung.
- N45 bleibt erhalten: ausgewaehlte Wandachse zuerst sichtbar machen, spaeter
  verschiebbar. Entscheidung 05.10.2026: Beim Versatz bleibt die Zeichenachse fest, der Wandkoerper bewegt sich relativ dazu; Numerischer Versatz inzwischen implementiert (Schema 5).

#### Vorschlag fuer den ersten Anschlussversuch – noch keine Produktentscheidung

Kleinstes Beispiel: genau zwei gerade, rechtwinklige Waende mit identischem
Achs-Endpunkt, gleicher Staerke und Hoehe auf z=0, ohne Oeffnung im Anschlussbereich.
Eine gemeinsame Gehrungsgrenze teilt den Eckbereich auf beide Wand-IDs auf.
Beispielachsen A (0,0)–(3,0), B (3,0)–(3,3), Staerke 0.36 m: moegliche gemeinsame
Grenze von (2.82,0.18) bis (3.18,-0.18). Dies ist ein geometrischer Entwurf,
keine Freigabe einer automatischen Verbindung bei bloss gleichem Endpunkt.

Vorgeschlagener Datenfluss: Domain leitet aus Parametern und einer noch
festzulegenden Anschlussregel gepruefte Konturen/Endbegrenzungen pro Wand-ID ab.
Eine generische Geometriefunktion berechnet Schnitte; Grundriss, Volumenkoerper,
Mengen, Fangquellen und IFC konsumieren dieselben Begrenzungen. Ob dies spaeter
als Kontur oder Endebene repraesentiert wird, ist eine technische Folgeentscheidung.
Keine Klassen, Caches oder Interfaces auf Vorrat einfuehren.

IFC benoetigt fuer eine Gehrung ein geeignetes nichtrechteckiges Profil oder eine
andere normkonforme Repraesentation. Das konkrete Format erst bei Implementierung
an Primaerquellen pruefen und mit dem bestehenden Archicad-Import abnehmen.
Die aktuelle Rechteck-Exportfunktion nicht als ausreichenden Nachweis ansehen.

Vorlaeufig vom ersten Versuch ausschliessen: T-/Mehrfachknoten, spitze Winkel,
verschiedene Staerken/Hoehen, Schichtaufbau, nicht gemeinsame Achsenden und Oeffnungen in der
veraenderten Endzone. Solche Faelle muessen erkennbar unbehandelt bleiben; keine
heimliche Reparatur oder Loeschung. Keine neuen pauschalen Randabstaende erfinden.

#### Vor Anschlussimplementierung offene Entscheidungen

| Frage | Noch festzulegen |
| --- | --- |
| Achsenwechsel N45 | Entschieden 05.10.2026: Zeichenachse bleibt fest, Wandkoerper wird quer dazu versetzt. |
| Anschlussabsicht | Entschieden 05.10.2026: bewusst mit „Ecke verbinden“. Gespeicherte Relation ist technischer Vorschlag, noch nicht implementiert. |
| Verbundene Bearbeitung | Entschieden 05.10.2026: Einzelwandbewegung loest Verbindung automatisch. Verhalten einer explizit gemeinsam bearbeiteten Ecke bleibt separat festzulegen. |
| Unterschiedliche Staerken | Gehrung, durchlaufende Wand oder andere fachliche Prioritaet; Ebenen sind keine AssemblyLayer. |
| Wandgriff bei Drehung | Fuer unabhaengige Waende korrigiert: endpointAtOffsetTarget trifft die Koerperecke auch mit bodyOffset (PR #110, Regressionstest). Ein kuenftiger Gehrungsgriff ist noch kein vorhandener Einzelwandgriff. |
| Oeffnungs-Endzone | Welche Oeffnungen sind dort zulaessig, wie wird eine kollidierende Aenderung behandelt? |

#### Geplante Anschluss-Abnahmekriterien

Bei spaeterer Umsetzung: obiges 3.00/0.36/2.80-m-Beispiel sowie vertauschte
Wandreihenfolge liefern dieselbe physische Kontur. Bei umgekehrter Achsrichtung
muss auch das Offsetvorzeichen wechseln, um dieselbe physische Wand zu vergleichen;
keine Luecke, keine doppelt belegte Eckflaeche. Gemeinsame Konturgrenzen stimmen in
2D/3D/IFC ueberein. Laengen-/Staerkenaenderung, Undo/Redo, Speichern/Laden,
Sichtbarkeitsfilter und veralteter Zielkontext werden geprueft. Fenster ausserhalb
der Anschlusszone behalten ID und relative Position. Degenerierte/mehrdeutige
Faelle werden nachvollziehbar gemeldet. IFC-Abnahme erfordert neuen Importtest;
der bisher erfolgreiche Rechteckimport belegt keine Gehrung.

#### Historischer Folgeauftrag – mit PR #108 umgesetzt

**Zentrierte Wandachse bei Auswahl im 2D-Grundriss sichtbar machen.**

Vorhandene `start`/`end`-Parameter als dezente gestrichelte, bildschirmbezogen
breite Achslinie darstellen. Kein eigenes Modellobjekt und kein neuer Fangpunkt;
vorhandene Achsquellen bleiben massgeblich. Overlay ist pointer-transparent,
folgt gueltiger Vorschaugeometrie, Auswahl und Ebenensichtbarkeit und verdeckt
keine Eckgriffe. Keine Achsverschiebung, neue Menueaktion oder Anschlussgeometrie.

Pruefung: horizontale/schraege Wand, Auswahlwechsel, Zoom, Ausblenden, Vorschau,
Abbruch und Undo; Achse liegt sichtbar mittig. Modell/JSON/IFC bleiben unveraendert.
3D-Achsdarstellung ist inzwischen umgesetzt (N45).
Dieser Einstieg erfuellt eine explizite Nutzeranforderung und macht die Bezugsgeometrie
sichtbar, ohne die offenen Anschlussentscheidungen vorwegzunehmen.


Numerischer Wandkoerperversatz ist durchgaengig implementiert; Anschlussfragen bleiben offen. Der einzige aktive Folgeauftrag steht am Anfang von DEVELOPMENT_PLAN.md (Anschlussentwurf gegen Koerperversatz pruefen).

#### Abgleich mit Koerperversatz und Nutzerentscheidungen — 05.10.2026

#### Verbindliche Bedienentscheidungen

1. Eine Verbindung wird bewusst ueber **Ecke verbinden** erzeugt. Gleiche Endpunkte,
   Hover, Fang oder reine Naehe erzeugen keine Anschlussrelation.
2. Eine **Einzelwandbewegung loest ihre Verbindung automatisch**. Sie verlangt
   keinen vorgeschalteten Befehl „Verbindung loesen“. Die andere Wand wird dadurch
   nicht automatisch mitbewegt. Der Vorschlag „erst manuell loesen“ ist verworfen.
3. Bestehende Entscheidung N45 bleibt: Offsetaenderung haelt die Zeichenachse fest.

Technische Konsequenz fuer eine spaetere Application-Aktion: Loesen aller
betroffenen Relationen und Verschieben gehoeren in denselben validierten
Vorschau-/Commit-Snapshot und einen Undo-Schritt. Escape/ungueltiges Ziel laesst
Relationen und Geometrie unveraendert; Undo stellt auch die Verbindungen wieder her.
Kein vorzeitiges Loesen beim blossen Beginn der Mausgeste. Stabile Wand-IDs und
Fensterbindungen bleiben bestehen. Text/Voice/AI muessen dieselbe Aktion aufrufen.

Nicht durch diese Antwort entschieden: gemeinsamer Eckgriff, Aendern eines einzelnen
Achs-Endpunkts, Laengen-/Staerken-/Offsetaenderung verbundener Waende, Loeschen sowie
Form der verbleibenden Endkappen beim Loesen. Rechteckige Einzelwandkappen koennen
beim Loesen auch den sichtbaren Abschluss der unbewegten Wand veraendern. Das muss
in der spaeteren Vorschau erkennbar sein, bevor diese Aktion produktiv wird.

#### Rechenbeispiel: tatsaechliche Seiten statt gemeinsamer Achspunkt

Alle Masse in Metern, ohne Fenster. A: (0;0) nach (3;0), B: (3;0) nach (3;3),
beide 0,36 stark und 2,80 hoch. Der Achsknoten C=(3;0) bleibt immer fest.
a ist bodyOffset von A, b von B, h=0,18. Positive Offsets liegen links der
jeweiligen Zeichenrichtung: A nach oben, B nach links.

Die Seiten von A liegen bei y=a-h und y=a+h, die von B bei x=3-b-h und x=3-b+h.
Der vorgeschlagene Gehrungsabschnitt verbindet:

- innere Ecke I=(3-b-h; a+h), Schnitt der inneren Seiten;
- aeussere Ecke O=(3-b+h; a-h), Schnitt der aeusseren Seiten.

I und O werden aus unendlich verlaengerten Seiten bestimmt, nicht aus den heutigen
endlichen Rechteckkanten. Die benoetigte Verlaengerung/Verkuerzung der Wandkoerper
wird erst durch die ausdrueckliche Verbindung zugelassen. start/end bleiben C bzw.
die entfernten Endpunkte; Achslaenge und Koerperseitenlaengen sind unterschiedlich.

| a | b | I | O | Summe Grundflaechen m² |
| --- | --- | --- | --- | --- |
| -0.18 | -0.18 | (3.00; 0.00) | (3.36; -0.36) | 2.2896 |
| -0.18 | 0.00 | (2.82; 0.00) | (3.18; -0.36) | 2.2248 |
| -0.18 | 0.18 | (2.64; 0.00) | (3.00; -0.36) | 2.1600 |
| 0.00 | -0.18 | (3.00; 0.18) | (3.36; -0.18) | 2.2248 |
| 0.00 | 0.00 | (2.82; 0.18) | (3.18; -0.18) | 2.1600 |
| 0.00 | 0.18 | (2.64; 0.18) | (3.00; -0.18) | 2.0952 |
| 0.18 | -0.18 | (3.00; 0.36) | (3.36; 0.00) | 2.1600 |
| 0.18 | 0.00 | (2.82; 0.36) | (3.18; 0.00) | 2.0952 |
| 0.18 | 0.18 | (2.64; 0.36) | (3.00; 0.00) | 2.0304 |

Vorgeschlagene Konturen (gegen Uhrzeigersinn):
A=[(0;a-h), O, I, (0;a+h)], B=[O, (3-b+h;3), (3-b-h;3), I].
Ihre Innenflaechen liegen auf entgegengesetzten Seiten derselben Naht O–I.
Flaeche A=0,36*(3-b), B=0,36*(3-a); Volumen ohne Fenster=Summe*2,80.
Die Mengen sind Sollwerte fuer diese kuenftigen Konturen, keine Messung der
aktuellen ungejointen Rechteckkoerper. Eine reine Vereinigung der bisherigen
Rechtecke reicht nicht: Je nach Offset muss die Ecke Material ergaenzen.

#### Begrenzung und Datenfluss des naechsten Geometrieschritts (Vorschlag)

- Genau zwei Waende, gleiche Staerke/Hoehe, gemeinsamer Achs-Endpunkt, 90 Grad.
  Fuer den ersten Schritt |bodyOffset| <= halbe Staerke; Null und gemischte
  Vorzeichen explizit testen. Andere Offsets bleiben im bestehenden Modell erlaubt,
  sind lediglich noch nicht fuer diesen vorgeschlagenen Anschluss unterstuetzt.
- Endpunktindizes stabil adressieren, nicht die Array-Reihenfolge als Identitaet
  verwenden. In lokale einlaufende/auslaufende Richtungen normalisieren; beim
  Richtungswechsel Vorzeichen und linke/rechte Seite korrekt umordnen.
- Domain kennt Wandparameter/Anschlussabsicht und liefert valide Konturen je ID.
  Geometry liefert nur Linien-/Polygonmathematik. Keine Renderer-Sonderkorrektur.
- Technischer Vorschlag: spaeter explizite Relation mit Wand-IDs und Endpunktindizes
  persistieren, statt Verbindung nach jedem Modellwechsel aus Naehe zu erraten.
  Konkretes Schema erst mit der Application-Aktion festlegen; jetzt Schema 5 behalten.
- Zuerst reine Konturableitung ohne Produktiv-Anbindung. Anschliessend muessen
  Grundriss, Solid/Mengen, Picking/Fang, Griffe und IFC gemeinsam angebunden werden,
  bevor „Ecke verbinden“ im UI aktiviert wird. Oeffnungsprofile duerfen nicht
  unveraendert in bereits weggeschnittenes Material reichen.

#### Ergaenzte Abnahme und verbleibende Fragen

Geometrienachweis fuer den Folgeauftrag: neun Tabellenfaelle, Rotation/Translation,
vertauschte Wandreihenfolge und richtungsumgekehrte Eingaben mit negiertem Offset.
Einfache positive Konturen, gleiche Naht, disjunkte Innenflaechen, korrekte Mengen,
keine Aenderung von IDs/start/end/Offset. Zu kurze Waende oder degenerierte Konturen
muessen scheitern, nicht geklemmt oder automatisch repariert werden. T-/Mehrfach-
knoten, ungleiche Staerken/Hoehen und Oeffnungen im Anschlussbereich bleiben offen.

Vor UI-Anbindung festzulegen: gemeinsame Eckbearbeitung und Endkappen beim Loesen;
Oeffnungs-Endzonen und zulassige Aenderungen verbundener Waende. Die aktuelle
Fenster-Achslaengenpruefung beweist keinen Abstand zur schraegen Endbegrenzung.

Planungsnachweis am 05.10.2026: Alle neun Rechenbeispiele per Node und vorhandenem
validateSimplePolygon geprueft, Flaechenformeln und entgegengesetzte Seiten der Naht
bestaetigt. Lokales Pruefskript outputs/corner-offset-check.mjs ausserhalb des Repos.
Das ist noch kein Test einer Anschlussimplementierung. Keine Laufzeitdatei geaendert;
409 Tests/TypeScript/Build und Lint 0 Fehler/6 Warnungen bleiben der Nachweis aus
PR #111, nicht erneut ausgefuehrte Pruefungen dieses Dokumentationsauftrags.

#### Umsetzung des reinen Geometrieschritts — 05.10.2026

deriveRightAngleCorner in src/domain/elements/wall/corner.ts setzt die oben
beschriebene Bruttokonturableitung um. Zwei explizite Wand-/Endpunktreferenzen
liefern nach Wand-ID sortierte Konturen (positive Umlaufrichtung), Flaechen und
eine gemeinsame Naht. Keine Eingabemutation, Verbindungsspeicherung, Oeffnungs-
behandlung oder Anzeige. Gleiche Parameter, rechter Winkel, gueltige Endpunkte,
Offsetgrenze und ausreichend lange Wandseiten werden validiert. Rechenfehler
oder entartete Konturen werden abgewiesen; keine automatische Reparatur.

11 neue Tests bestaetigen neun Tabellenfaelle, Eingabe-Unveraenderlichkeit,
getrennte Innenflaechen, Reihenfolge und 216 Kombinationen aus Offset, Endpunkt-
umkehr, Rotation, Spiegelung und Translation. Gesamt 420 Tests bestanden,
TypeScript/Build erfolgreich, ESLint 0 Fehler/6 bekannte Warnungen. Diese Zahlen
ersetzen nicht die noch fehlende 2D-/3D-/IFC-Abnahme einer produktiven Verbindung.
Der einzige aktive Folgeauftrag steht oben in DEVELOPMENT_PLAN.md: geometrischer
Oeffnungsbefund gegen die abgeleiteten Konturen.

#### Geometrischer Oeffnungsbefund implementiert — 05.10.2026

inspectCornerOpenings (corner-openings.ts) klassifiziert volle Fenstergrundflaechen
gegen die Gehrung und weitere Konturbegrenzungen. Ergebnis pro Fenster mit ID,
Footprint und Abstand je Begrenzung: contained/touching/outside. Kein boolescher
Produktentscheid; eine spaetere Application-Aktion muss daraus ihre Zulassung
ableiten. Seitlicher Durchbruch allein zaehlt nicht als Endberuehrung.

Beispiel ohne Versatz: Wand A (0;0) bis (3;0), Staerke 0,36. Fensterbreite 1,20,
Mitte bei 1,50: contained. Mitte bei 2,22: touching, weil eine Ecke x=2,82
erreicht. Mitte bei 2,30: outside, obwohl der Fenstermittelpunkt noch im Wandkoerper
liegt. Bei Fensterbeginn x=0 wird Beruehrung am entfernten Ende separat gemeldet.
Numerische Toleranz ist kein zusaetzlicher fachlicher Mindestabstand.

426 Tests bestanden, TypeScript/Build erfolgreich; ESLint 0 Fehler/6 Warnungen.
Keine gespeicherte Verbindung und keine sichtbare Anschlussfunktion. Offen bzw.
im Nutzerchat angefragt: genaue Beruehrung zulassen; gerade oder erhaltene schraege
Endkappen beim automatischen Loesen. Der naechste geometrische Schritt steht oben
in DEVELOPMENT_PLAN.md.

#### Abgeleitete 3D-Eckkoerper — 05.10.2026

corner-solid.ts und geometry/solids/profile-openings.ts extrudieren die geprueften
Konturen mit voll enthaltenen Fensteroeffnungen. Pro Wand stabile ID, Kontur,
polygonale Flaechen mit Normalen und Volumen. Ueberlappende Oeffnungen werden als
Vereinigung abgezogen; keine innenliegenden Zelltrennflaechen. Eigene Wandkoerper
behalten ihre jeweilige geschlossene Stirnflaeche an der gemeinsamen Gehrungsnaht.
Diese beiden Grenzflaechen bedeuten kein doppelt belegtes Volumen.

Nicht enthalten: UI-Aktion, persistente Verbindung, Anwendung auf normale
Darstellung oder IFC. Endberuehrende und ueberstehende Oeffnungen sind noch nicht
unterstuetzt. Kantenkontakte zwischen Oeffnungen, die eine unregulaere Huelle
erzeugen, werden ebenfalls gemeldet; bestehende Modellvalidierung bleibt gleich.
Sehr nahe, numerisch nicht getrennt darstellbare Zellgrenzen werden nicht vereint
oder repariert. 433 Tests bestanden; Mesh-Volumen und geschlossene Kanteninzidenz
unabhaengig geprueft. TypeScript/Build erfolgreich; Lint 0 Fehler/6 Warnungen.
Naechster Auftrag: isolierter IFC-Abnahmenachweis derselben fachlichen Geometrie,
wie oben in DEVELOPMENT_PLAN.md festgelegt.

#### Isolierter IFC-Abnahmenachweis — 05.10.2026

Der explizite Testexport in interop/ifc/corner.ts verwendet die lokalen Konturen
von corner-solid.ts und den gemeinsamen IFC-Writer. Zwoelf Testdateien bestanden
IfcOpenShell-Pruefung inklusive Nettovolumen. Noch keine produktive Verbindung;
Archicad-Import dieses Testmodells bleibt separat zu bestaetigen.
Anleitung und Grenzen: [IFC-Eckabnahme](CORNER_IFC_ACCEPTANCE.md).
Der aktuelle einzelne Folgeauftrag steht oben in DEVELOPMENT_PLAN.md.

#### Gemeinsame temporaere Vorschau — 05.10.2026

Nachtraegliche Nutzerkorrektur: "Ecke verbinden" als notwendige Menueaktion ist
verworfen. Automatischer Anschluss durch zusammengefuehrte Achsenden ist das
Ziel, gefolgt von fortlaufenden Wandketten. Die folgende Vorschau bleibt ein
Pruefwerkzeug. Umgesetzte Achsenkorrektur und konkreter Folgeauftrag stehen
oben in DEVELOPMENT_PLAN.md. Alte Aussagen zur expliziten Menuepflicht sind
historisch, nicht mehr verbindlich.

Der Nutzer hat den Archicad-Import einschliesslich Fenster und rechtwinkligem
Anschluss bestaetigt. Die explizite Paargeometrie ist jetzt ueber
Werkzeugeigenschaften > Wandanschluss vorschauen in 2D und 3D pruefbar.
Beide Ansichten verwenden die gleichen Domain-Ergebnisse; keine zweite
Gehrungsberechnung. Fenster bleiben ausgeschnitten. Escape/Schliessen verwirft,
falsche Achsenden ergeben eine Meldung, Modellwechsel invalidiert die Vorschau.
449 Tests, TypeScript und Build bestanden; Lint 0 Fehler/6 bekannte Warnungen.
Browserpruefung mit zwei 3-m-Waenden und je einem Fenster bestanden.

Noch keine gespeicherte Verbindung oder Aenderung des normalen IFC-Exports.
Exakte Oeffnungsberuehrung sowie gerade oder erhaltene schraege Endkappen beim
automatischen Loesen bleiben offene Nutzerentscheidungen; erneut angefragt.
Die momentane Ablehnung beruehrender Oeffnungen ist eine technische Grenze.




### Detail D12 – docs/planning/HATCH_PAPER_SCALE.md

Herkunft: `docs/planning/HATCH_PAPER_SCALE.md`, Snapshot main/PR237. Altstatus nicht als aktuelle Fertigmeldung lesen.

#### V07j: Modellmaß, Papiermaß und Zoom

Stand 09.10.2026, Codebasis main 0407ad5 nach PR228. Dokumentationsauftrag;
Papiermaß ist noch keine verfügbare Produktfunktion.

#### Bestand und Zuständigkeiten

| Bereich | Nachgewiesener Stand | Konsequenz |
| --- | --- | --- |
| `src/domain/elements/hatch/model.ts` | Anwendung akzeptiert ausschließlich `mode: "model"`, Ursprung und optionalen Winkel. | Papiermaß benötigt später eine explizite Formaterweiterung, keine Umdeutung vorhandener Werte. |
| `src/domain/elements/hatch/pattern.ts` | Definition besitzt lokale metrische Zellmaße und maximal 256 Linien. | Bibliotheksgeometrie bleibt unverändert; Maßbezug gehört zur Anwendung. |
| `src/application/hatches/actions.ts` | Zuweisung setzt Modellmaß; Vorschau/Commit validieren Projekt und Ausgangskontext. | Neue Eigenschaften müssen durch diese gemeinsame Grenze, ebenso künftig Text/Voice. |
| `src/rendering/viewport/hatch-pattern.ts` | Kachel verwendet Definitionsmaße direkt, Ursprung und Drehung bleiben getrennt. | Gemeinsame Umrechnung vor dem Erzeugen der Kachel vorsehen. |
| `src/components/cad/HatchPattern.tsx` | SVG wiederholt ohne erzeugte Modelllinien; Strichbreite derzeit 1 CSS-Pixel. | Zellskalierung muss auch die lokale Strichbreitenumrechnung berücksichtigen. Papierabstand entscheidet nicht automatisch über Druckstifte. |
| `src/rendering/viewport/plan-camera.ts`, `src/components/cad/CadViewport.tsx` | Kamera in CSS-Pixeln pro Meter; 100 % in 2D bedeutet 100 CSS-Pixel/m. | Zoom bleibt Navigation, ohne physische Bildschirmgrößengarantie. |
| `src/domain/project/schema.ts` | Produktionsschema 14; kein ModelView-/DrawingDocument-Ausgabemaßstab implementiert. | Noch keine Quelle für einen impliziten Maßstab 1:50 vorhanden. |

Der Architekturvertrag ordnet gespeicherte Ausgabemaßstäbe DrawingDocument und
Layout-Platzierung zu. Ein ModelView liefert die Modellableitung. Für die reine
Arbeitsansicht besitzt nach PR230 und dessen bestätigtem Review der fachliche
Ansichtskontext den Maßstab; Bildschirmfenster referenzieren ihn und besitzen Zoom.
Interne Papierlängen bleiben Meter, UI-Werte Millimeter. Standard 1:100 und
Bedienung neben Zoom sind festgelegt; persistente History bleibt offen.
Kein Projektmaßstab wird vorsorglich als globaler Singleton in CadWorkspace eingeführt.

#### Technischer Vertrag für die Ableitung

Die Nutzerentscheidung bleibt: Modell- und Papiermaß bei Schraffuren wählbar.
Die folgenden Regeln konkretisieren die Ableitung; sie führen noch keine UI,
neuen Projektfelder oder Dokumentklassen ein.

- Modellmaße bleiben Meter. Ein Ausgabemaßstab ist ein expliziter positiver,
  endlicher Nenner S für 1:S, unabhängig von Kamera und Gerätepixeldichte.
- Im Modellmaß gilt weiterhin Faktor 1 zur Definition; Altprojekte bleiben gleich.
- Für Papiermaß erhält die Anwendung eine positive Papier-Zellbreite p in Metern
  (UI später in mm). Bei Definitionsbreite w ist der gleichförmige Faktor
  `k = p * S / w`. Zellhöhe und alle lokalen Linien skalieren mit k; kein Verzerren.
  Papier-Zellbreite beschreibt die Wiederholungszelle, nicht notwendigerweise
  den Abstand zweier Linien innerhalb der Zelle.
- Allgemein gilt für einen Papierabstand a: Modellabstand = a * S. Beispiel:
  2 mm entsprechen bei 1:50 0,1 m, bei 1:100 0,2 m. Beim Export ergeben beide
  wieder 2 mm. Bei festem S vergrößert Bildschirmzoom auch Papiermuster sichtbar.
- Ursprung bleibt ein Modellpunkt. Kachelunterkante liegt weiterhin dort:
  SVG-y = -origin.y - skalierte Zellhöhe. Rotation bleibt gegen den Uhrzeigersinn;
  lokale Creator-Koordinaten bleiben x-rechts/y-unten. Keine Konturtransformation.
- Definition, IDs, Bibliotheksrevision, Kontur und Fanggeometrie bleiben unverändert.
  Ableitungen dürfen keine Wiederholungslinien im Projekt speichern.
- Fehlender/ungültiger Maßstab im Papiermodus ist ein ausdrückliches Ergebnis,
  kein Fallback auf Zoom oder 1:1. Modellmodus braucht keinen Ausgabemaßstab.
  Auch Überlauf/Unterlauf und nicht positive abgeleitete Maße werden abgewiesen.
- Bildschirmstriche bleiben im Pilot 1 CSS-Pixel. Bei lokaler Kachelskalierung k
  entspricht dies lokal `1 / (pixelsPerMetre * k)`; Rotation ändert k nicht.
  Physische Druckstrichbreiten und Exportstifte sind ein eigener Vertrag.
- Unterschiedliche Ansichten können dieselbe Schraffur mit unterschiedlichem S
  ableiten. S gehört nicht in jede Schraffur oder in die globale Musterbibliothek.

#### Offene Produktintegration — keine erfundenen Nutzerentscheidungen

Vor Einführung der Papiermaß-Auswahl: gespeicherten Ansichtskontext und dessen
History-Regel umsetzen. Initialwert 1:100 und Eigentümer sind inzwischen im
[allgemeinen Maßstabsvertrag](VIEW_SCALE_CONTRACT.md) festgelegt. Spätere Layout-Platzierungen müssen
einen explizit aufgelösten effektiven Maßstab liefern; keine unklare Kombination aus
Dokumentmaßstab und zusätzlicher Vergrößerung. Der spätere Moduswechsel sollte die
aktuelle Darstellung bei bekanntem S erhalten (Vorschlag, noch keine Bedienregel).
Minimal-/Maximalwerte für Größen in der UI, Mustergrößen-Voreinstellungen und Druckstiftbreiten bleiben offen.
Ausgabemaßstab verändert nie BIM-Geometrie, Kalibrierung oder gemessene Längen.

#### Nachgelagerter Anwendungsfall: V07k innerhalb MS-02

Nach PR230 und Nutzerbestätigung beginnt zuerst MS-01 aus dem allgemeinen
Maßstabsvertrag. Die folgende Schraffurprüfung bleibt als nachgelagerter
Anwendungsfall erhalten; sie ist kein zweiter gleichzeitig aktiver Auftrag.

Den allgemeinen Größenresolver aus MS-01 für Modell-/Papier-Zellmaße unter
`src/rendering/viewport/` verwenden und an die gemeinsame Kachelableitung
anbinden. Der Pilot nimmt explizite Darstellungsparameter entgegen; die bestehende
Produktanwendung bleibt Modellmaß. Keine Erweiterung des persistenten Hatch-Typs,
keine Freischaltung eines Papiermodus ohne Ansichtsvertrag, keine leeren Klassen.
Den bisherigen Modellpfad auf dieselbe Umrechnung mit Faktor 1 führen. Ein isoliertes
Browserbeispiel außerhalb des Produktflows nutzt denselben Resolver und dieselbe
SVG-Darstellung, zeigt eine Definition bei 1:50/1:100 und veränderlichem Zoom.

Abnahme und Tests:

1. Bestehende Modell-Kacheln bleiben numerisch identisch, einschließlich Ursprung,
   asymmetrischer Creator-Geometrie und Rotation 0/45/90 Grad.
2. Papierbreite 0,002 m: Modellbreite 0,1 m bei 1:50 und 0,2 m bei 1:100;
   rechteckige Definitionszelle behält ihr Seitenverhältnis.
3. Zoom 25/100/400 CSS-Pixel/m beeinflusst nur Bildschirmgröße/Strichumrechnung,
   nicht k, S oder Kontur. Keine Anzahl von Wiederholungen wird als Geometrie erzeugt.
4. Fehlender Nenner, Null, negative Werte, NaN/Infinity sowie extreme Produkte
   liefern ein eindeutiges Fehlerergebnis. Eingabedefinitionen bleiben unverändert.
5. Browservergleich für Orientierung, Zoom und konstante Bildschirmstriche;
   passende Tests, Typecheck, Lint und Build. Kein PDF-/Drucknachweis behaupten.

Danach erst einen eigenen Integrationsauftrag für gespeicherten Ansichtskontext,
Schema-Migration, Eigenschaften, Defaults/Pickup und atomare Modell-History planen.
Dieser Folgeauftrag ist hier nicht gleichzeitig aktiv.

#### MS-02/V07k acceptance — 2026-10-09

Rendering pilot implemented: explicit paper sizing uses the shared resolver and SVG
component; production remains model-only/schema 14. 786 tests, typecheck and build
pass. Browser verified nine zoom/rotation combinations on the isolated
benchmarks/hatch-scale.html page, without changing contour geometry. No print proof.

Next active task is MS-03 view-scale persistence in DEVELOPMENT_PLAN.md. User has
confirmed that this setting stays outside model Undo/Redo. Product hatch paper-mode
integration remains subsequent work; do not combine it into that persistence task.

#### Persistenzvoraussetzung erfüllt — 10.10.2026

MS-03 speichert den Arbeitsmaßstab mit Schema 15 außerhalb Modell-Undo. Die
Papiermodus-Integration kann als nächster einzelner Auftrag folgen. Die Regel für
den Moduswechsel bleibt vorab zu klären; es ist noch keine Papiermodus-Freischaltung.

#### Produktintegration umgesetzt — 10.10.2026

Schema 16: Papiermaß mit paperWidthMetres, Modellmaß mit optionaler modelWidthMetres.
Ohne explizite Modellbreite gilt weiterhin Faktor 1 zur Definition. Nutzer bestätigt:
Moduswechsel erhält sichtbare Zellgröße am aktuellen S. Der gemeinsame Domain-Resolver
liefert Umrechnung, Application besitzt Moduswechsel und validierte Aktionen. Größen
bleiben Eigenschaften der einzelnen Anwendung, nicht globale Bibliotheksänderungen.
2D-Eigenschaften, Defaults, Pickup, Vorschau, Dateirundlauf und Modell-History sind
angebunden; 792 Tests, Typprüfung, Build und Browserprüfung bestanden. Druck/PDF und
physische Druckstifte bleiben offen. Nächster Einzelauftrag siehe DEVELOPMENT_PLAN.md.




### Detail D13 – docs/planning/HATCH_PATTERN_LIBRARY.md

Herkunft: `docs/planning/HATCH_PATTERN_LIBRARY.md`, Snapshot main/PR237. Altstatus nicht als aktuelle Fertigmeldung lesen.

#### V07a Schraffurverwaltung und Linien-Creator

Stand 08.10.2026. Abgleich und begrenzter Folgeauftrag; noch keine neue Bedienfunktion.
Nutzer bestaetigt die praktische V06-2D-Abnahme. PR213 ist zusammengefuehrt.

#### Bestaetigte Anforderungen

Tools > Schraffurenverwaltung. Vorhandene Muster als Liste mit kleiner Vorschau.
Von dort zum Schraffurcreator: Muster selbst mit Linien zeichnen, anlegen und
als Raster wiederholen. Musterdateien hochladen. Uploadformat noch offen:
Nutzer recherchiert; PAT/SVG/PNG/JPEG sind keine getroffene Formatentscheidung.
Aeltere Wuensche nach Mauerwerk, Farbe/Deckkraft, Hintergrund, Kontur, vier
Erstellungsarten und eigener Ebenenzuordnung bleiben gueltig.

#### Bestand und Architektur

Hatch ist heute eine geschlossene 2D-Kontur mit Fill, Hintergrund, Kontur und Ebene.
Es gibt noch keine Musterdefinitionen oder Referenzen darauf. Tools ist im Toolbar
noch kein Verwaltungsmenue. Bestehende Zeichen-/Fangdienste und validierte Aktionen
werden wiederverwendet. Die 2D-Uebernahme bleibt der gemeinsame Vorgabenadapter.

Verbindlich: Musterdefinition und Musteranwendung sind unterschiedliche Daten.
Eine Definition enthaelt stabile ID, Namen und Liniengeometrie in einer lokalen
Wiederholungszelle. Eine Anwendung bleibt die vorhandene Schraffurkontur; sie
referenziert ein Muster. Renderer erzeugt die geklippten Wiederholungen daraus,
keine tausend kopierten Modelllinien. Musterduplikate erhalten neue IDs. Creator-
Vorschau und Entwurf sind transient; Speichern/Anwenden gehen durch Application.
Keine Musterberechnung oder Modellmutation ausschliesslich in React.
Import spaeter ueber Interop-Adapter in denselben validierten Definitionsvertrag.
AI/Text/Voice spaeter ueber dieselben Aktionen mit stabilem Zielkontext.

Vorschlag fuer den ersten Creator: rechteckige positive Wiederholungszelle,
Liniensegmente in lokalen Metern, Vorschau eines begrenzten 3x3-Rasters.
Interne Meter sind gesetzt; sichtbare Musterabstaende in Modell- oder Papiermass
und spaetere Skalierung benoetigen eine ausdrueckliche Festlegung. Noch keine
Entscheidung ueber globale Bibliothek versus projektgebundene Bibliothek,
assoziatives Aendern aller Anwendungen, Importformate oder endlose Linienfamilien.
Vorerst kein neues Projektdateiformat ohne geprueften Migrationsauftrag.

#### Genau ein naechster Auftrag: V07b Linien-Creator als Entwurf

Unter Tools > Schraffurenverwaltung einen funktionierenden Einstieg zum Creator
bauen. Einen rechteckigen lokalen Linienmuster-Entwurf zeichnen und unmittelbar
mit einer 3x3-Wiederholung pruefen. Gemeinsame Punkt-/Fanggeometrie verwenden;
separater Entwurfskontext ohne BIM-Auswahl oder BIM-Modellkopie. Zellenmasse und
Linien validieren (endlich, positive Zelle, keine Nullsegmente, begrenzte Menge).
Werkzeugeigenschaften im vorhandenen UI-Konzept behalten. Keine inaktive Upload-
Schaltflaeche als vorgetaeuschte Funktion. Import bleibt bis Formatentscheidung offen.

Dieser erste Auftrag demonstriert den Creator; permanente Bibliothek, Bearbeiten
bestehender Definitionen und Fuellen einer Projektkontur folgen im naechsten
abgegrenzten Auftrag nach Bibliotheks-/Einheitenentscheidung. Keine Zusage einer
vollstaendigen Bibliothek oder Dateimigration durch diesen Entwurf.
Abnahme: zwei Linien zeichnen, Zelle aendern, Wiederholung ansehen, letzte Linie
im Entwurf rueckgaengig, abbrechen: BIM-Modell und dessen Undo bleiben unveraendert.
Geometrie-/Grenztests, Typecheck/Build und praktische Browser-Abnahme.

#### Pruefung dieses Abgleichs

Guide Etappe 5, V07 und Quelltext abgeglichen. Reine Dokumentationsaenderung;
Diff-Pruefung, keine erneut ausgefuehrten Produktions-Tests oder Builds.

#### V07b Umsetzung

Lokaler Creator unter Tools, Linienentwurf, Zellmaße, eigene Undo-Liste,
gemeinsame querySnap-Abfrage und 3x3-SVG-Musterwiederholung implementiert.
Keine Bibliothekspersistenz, kein Upload und keine Anwendung auf Projektkonturen.
722 Tests, Typecheck, gezielter Lint und Build erfolgreich. Browser-Abnahme
wegen Browser-Sandbox-Startfehler offen. Nächster Auftrag: V07c Vertrag zur
Bibliothekspersistenz und Musteranwendung mit den offenen Nutzerentscheidungen.

#### V07c Bibliothek: Nutzerentscheidung vom 08.10.2026

Verbindlich: Die Musterbibliothek soll von Anfang an global und projektübergreifend
sein. Die frühere Frage projektgebunden versus global ist damit beantwortet.
Verbindlich: Modellmaß und Papiermaß sind in den Werkzeugeigenschaften bei
Schraffuren wählbar. Der Maßbezug gehört zur Anwendung, nicht zur Musterdefinition.
Verbindlich: Bearbeiten eines verwendeten Musters aktualisiert gemeinsam alle
Anwendungen dieses Musters. Uploadformat bleibt offen.

Technischer Vorschlag (noch keine Nutzerentscheidung): globale Bibliothek über
plattformneutralen Storage-Adapter; Projektdateien führen die tatsächlich
verwendeten Definitionen mit, sodass die Darstellung ohne globale Installation
reproduzierbar bleibt. IDs allein dürfen keine stille Musterersetzung bewirken.
Anwendungsdaten bleiben im Projekt; Wiederholung/Clipping sind abgeleitet.
Kein Speichersystem oder Projektformatwechsel vor dem begrenzten Migrationsauftrag.

V07c abgeschlossen als Vertrag; praktische Creator-Abnahme bleibt offen.

Technischer Vorschlag zur Synchronisation: stabile globale Muster-ID mit Revision;
Anwendungen referenzieren diese ID. Geöffnete Projekte übernehmen Änderungen über
eine gemeinsame validierte Aktion; geschlossene Dateien werden nicht heimlich
umgeschrieben. Synchronisation beim Öffnen, Offline-Konflikte und Bedeutung von
Undo für projektübergreifende Musteränderungen müssen vor diesem Ausbau geklärt
werden. Eingebettete Definitionen sichern reproduzierbare Offline-Darstellung.
Papiermaß benötigt einen expliziten Maßstab der Ansicht; Zoom allein ist kein
Planmaßstab. Das ist noch keine implementierte Synchronisationsfunktion.

Genau ein nächster Auftrag V07d: eine globale lokale Musterbibliothek mit
Storage-Adapter, validierten Definitionen/IDs/Namen, Liste mit Vorschauen und
Speichern eines Creator-Entwurfs implementieren. Laden nach Neustart prüfen;
keine Anwendung, Projektmigration, Synchronisation oder Upload in diesem Schritt.
Anwendungs-/Maßstabs- und Aktualisierungsregeln folgen als eigener Auftrag.


#### V07d Umsetzung - 09.10.2026

Globale lokale Bibliothek mit Storage-Adapter und Domain-Validierung umgesetzt.
Speichern mit stabiler neuer ID, Namen, Zellmaßen und lokalen Linien; Liste mit
Vorschauen und als neuen Entwurf laden. Neustart-Wiederladen durch frischen
Storage-Consumer getestet. Bibliothek gilt für Browserprofil/Origin über Projekte;
noch keine Geräte-Synchronisation oder Musteranwendung. Alte Daten werden bei
Lesefehlern nicht überschrieben; Schreibfehler lassen die Liste unverändert.
741 Tests, Typecheck, Lint/Build erfolgreich. Browser-Abnahme offen.
Nächster Auftrag V07e: Musteranwendungs-/Aktualisierungsvertrag am vorhandenen
Projektformat konkretisieren; offene Konflikt- und globale Undo-Regeln klären.

#### V07e Musteranwendungs- und Aktualisierungsvertrag - 09.10.2026

#### Geprüfter Bestand

PR221 (38b571e) mit erfolgreicher GitHub-CI nach Nutzerfreigabe zusammengeführt.
Produktionsschema 10 enthält noch keine Musterzuweisung an Hatch. Hatch besitzt
Kontur, Fill, Hintergrund, Konturfarbe und Ebene (domain/elements/hatch/model.ts).
previewHatch/commitHatch validieren am aktuellen Projektsnapshot und bieten einen
Commit/Undo-Schritt (application/hatches/actions.ts). PlanSceneRun zeichnet heute
die Fläche; project-file/load.ts migriert die älteren Formate. Die Musterbibliothek
v1 speichert Definitionen mit ID, Namen und Zellgeometrie, noch ohne Revisionen
oder globale Bearbeitung. Es existiert kein implementierter ModelView-/DrawingDocument-
Maßstabsvertrag; Bildschirmzoom ist Kamerazustand, kein Ausgabe-Maßstab.
Projekt-History speichert Projektsnapshots und hält bereits Ebenensichtbarkeit
außerhalb des Modell-Undo. Dieses Prinzip ist kein Beweis einer Muster-History.

#### Verbindliche Nutzerentscheidungen

- Bibliothek global und projektübergreifend; aktuell lokal pro Profil/Origin.
- Modellmaß und Papiermaß sind bei Schraffuren wählbar, nicht bei allen Werkzeugen.
- Bearbeiten einer Definition aktualisiert alle Anwendungen dieser Definition.
- Antwort vom 09.10.2026: beim Öffnen älterer Projekte aktuelle verfügbare Muster
  automatisch übernehmen; keine Bestätigungsfrage für reguläre neue Revisionen.
- Antwort vom 09.10.2026: Bibliothek besitzt eigene Undo/Redo-History. Projekt-Undo
  nimmt Zuweisung und Modellaktionen zurück, verändert niemals die globale Bibliothek.
- Uploadformat bleibt offen. Linienarten und Schraffurmuster bleiben getrennte Systeme.

#### Technische Entscheidungen für den schrittweisen Ausbau

**Definitionen und Referenzen:** Das nächste Projektformat erhält eine projektweite
Tabelle tatsächlich verwendeter Musterdefinitionen, referenziert über stabile ID.
Eine Schraffur enthält die Musterreferenz und Anwendungsparameter, keine weitere
Bauteilkopie und keine einzeln gespeicherten Wiederholungslinien. Die Tabelle
ermöglicht portable Darstellung ohne installierte Bibliothek und ein gemeinsames
Aktualisieren aller Referenzen. Bestehende Schema-10-Projekte behalten Vollflächen;
Migration ergänzt eine leere Tabelle, niemals automatisch ein Muster.

**Anwendung:** Maßbezug gehört zur Schraffur. Im Modellmaß bleiben Zellabstände in
Metern. Der Pattern-Anker ist ein expliziter Punkt in derselben 2D-Ebene wie die
Kontur; Translation bewegt ihn mit, Konturbearbeitung erzeugt ihn nicht laufend
neu. Initialer Anker kann der untere linke Kontur-Bounding-Box-Punkt sein. Diese
Vorgabe ist eine technische Initialisierung, keine neue Nutzer-Geste. Übernahme
per Doppel-Rechtsklick kopiert Muster-/Darstellungsvorgaben, keine ID, Kontur oder
positionsabhängigen Anker. Bestehende Fill-Farbe/Deckkraft steuern zunächst die
Musterstriche; Hintergrund und Kontur bleiben unabhängige bestehende Eigenschaften.

**Papiermaß:** Eine explizite positive Ausgabe-Skalenzahl S für 1:S muss vom
ModelView/DrawingDocument bzw. Layout-Kontext kommen; nicht von pixelsPerMetre
oder einem Zoomprozent. Papierlängen werden im Adapter in Meter umgerechnet:
Beispiel 2 mm bei 1:50 entsprechen 0,1 m Modellabstand. Die Definition bleibt in
lokalen Metern; Anwendungsparameter bestimmen die Papier-Zellgröße. Ohne gültigen
Maßstab ist eine Papiermaß-Aktion nicht zulässig. Der erste Pilot bietet nur
Modellmaß; Papiermaß bleibt als geforderte Fähigkeit offen und bekommt keinen
funktionslosen Auswahlpunkt. Kein Layouteditor oder Ersatz-Ansichtsmodell hierfür.

**Revisionen und Auflösung:** Vor der Bearbeitung verwendeter Definitionen wird
die globale Bibliothek versioniert um monotone Revisionen ergänzt (v1 -> Revision 1).
Die eingebettete Tabelle nennt die verwendete Revision. Regulär neuere verfügbare
Revisionen werden beim Öffnen automatisch validiert übernommen; alle Referenzen
im geöffneten Projekt verwenden dann denselben Stand. Kein implizites Schreiben
in geschlossene Projektdateien. Das Projekt wird als geändert markiert und erst
beim normalen Speichern dauerhaft aktualisiert. Fehlende Bibliothek oder dort
ältere Revision: eingebettete Definition beibehalten, kein Downgrade. Gleiche
ID/Revision mit anderem Inhalt ist ein Integritätskonflikt: keine stille Ersetzung,
Diagnose und vorhandene portable Darstellung erhalten. Fehler bei Validierung oder
Dateigrenzen dürfen keine teilweise aktualisierte Projekttabelle veröffentlichen.

**Getrennte Histories:** Globale Änderungen bekommen eine eigene Bibliotheks-History.
Bibliotheks-Undo veröffentlicht den früheren Inhalt als neue monotone Revision,
nicht als Zurücksetzen der Revisionsnummer. Geöffnete Projekte gleichen diese
Revision über dieselbe Application-Aktion ab. Projekt-Undo/Redo verändert die
Zuweisung und Kontur, aber darf eine bereits global aktualisierte Definition nicht
über alte Projektsnapshots zurückdrehen. Beim Wiederherstellen eines Snapshots
muss dieselbe zentrale Auflösung die verfügbaren Definitionen berücksichtigen.
Gleichzeitig laufende Vorschauen werden bei geänderter Basis verworfen. Keine
Zusicherung einer atomaren Transaktion über Browser-Tabs oder geschlossene Dateien;
Updates benötigen stabile Revisionen, erneute Validierung und sichtbare Fehler.
Diese globale Bearbeitung/History ist noch nicht implementiert.

**Abhängigkeiten:** Domain prüft Definition, Referenzintegrität und Anwendungswerte;
Application führt Zuweisen/Entfernen und später Revision-Abgleich aus. Interop
migriert Dateien und stellt Storage bereit. Rendering nutzt begrenzte SVG-Kacheln
und Kontur-Clipping; keine Allocation je sichtbarer Wiederholung. UI-Felder bleiben
in Werkzeugeigenschaften. Maus, Eigenschaften, Vorgabenübernahme und spätere
Text/AI/Voice-Adapter verwenden denselben typisierten Aktionsvertrag mit Projekt-ID,
Hatch-ID und gebundenem aktuellen Snapshot. Geometrie/Fanglogik bleibt gemeinsam.

#### Genau ein ausführbarer Folgeauftrag V07f

**Portabler Modellmaß-Pilot für vorhandene Schraffurkonturen.** Projektformat
inkrementell erweitern; tatsächliche verwendete Definitionen einmal pro Projekt
speichern, referenzierte IDs und Maßwerte validieren. Zuweisen/Entfernen über die
vorhandene snapshotgebundene Hatch-Application-Aktion in den Eigenschaften sowie
Vorgaben für neue Schraffuren und Doppel-Rechtsklick ergänzen. Pattern im Modellmaß
geklippt rendern, Fill/Hintergrund/Kontur erhalten; Translation/Undo/Dateirundlauf
mit gemeinsamem Anker prüfen. Katalogeinträge nur auswählen, nicht bearbeiten.

Abnahme: zwei Schraffuren mit gleicher Muster-ID, davon eine konkav, zuweisen;
zoomen, bewegen, Kontur ändern, rückgängig/wiederholen, speichern/öffnen. Frischer
Storage ohne Bibliothek muss die eingebettete Darstellung reproduzieren. Kein
Datenverlust bei älteren Projekten, ungültiger ID, beschädigter Definition oder
Speichergrenze. Dichte Wiederholung darf Modell-/DOM-Größe nicht vervielfachen.
Tests für Migration, Referenzen, Snapshots, Aktionsschutz, Undo und Renderableitung;
Typecheck, Lint, Build sowie praktische Sichtprüfung. Papiermaß, globale Bearbeitung,
Revision-Abgleich, globale History, Upload und Layout bleiben separate Folgeaufträge.

Dieser V07e-Auftrag ändert ausschließlich Dokumentation. Keine neuen Test-/Build-
Ergebnisse behauptet; die 741 Tests und CI gehören zum überprüften PR221-Commit.

#### V07f Umsetzung - 09.10.2026

Modellmaß-Zuweisung in Werkzeugeigenschaften/Inspector, gemeinsame Erstellung und
Doppel-Rechtsklick-Vorgaben, begrenzte SVG-Darstellung inklusive Vorschau umgesetzt.
Schema 11: eine Definitionstabelle pro Projekt, stabile Referenzen/Ursprung je Kontur;
strikte Migration 1–10. Bewegung nimmt Ursprung mit, Konturbearbeitung behält ihn.
746 Tests, Typecheck, Lint/Build erfolgreich; Browser-Sichtprüfung wegen Sandboxfehler
offen. Globale Bibliotheksbearbeitung/-History, Revision-Synchronisation und Papiermaß
bleiben offen. Nächster Auftrag V07g: Revisions-/Bibliotheks-History-Kern und zentrale
Auflösung als getestete Domain-/Application-Aktionen, vor UI-/Tab-Synchronisation.

#### V07g Umsetzung - 09.10.2026

Bibliothek v2 mit monotonem Revisionszähler, verlustfreies Lesen von v1 und getrennte
sitzungsbezogene Bibliotheks-History umgesetzt. Bearbeiten prüft ID, Zielrevision und
Speichertoken; Undo/Redo veröffentlicht neuen Revisionsstand. 20 Schritte und vier
Millionen serialisierte Zeichen begrenzen die History. Zentrale Projektauflösung
übernimmt neuere Definitionen gemeinsam, erhält fehlende/ältere und meldet gleiche
Revision mit abweichendem Inhalt. Speicherfehler und veraltete Aktionen schreiben
keinen neuen Aktionszustand. Keine atomare Mehrtab-Sicherheit zugesichert.

753 Tests, Typecheck, Build erfolgreich; Lint ohne Fehler mit sechs bekannten
Warnungen. Projektformat 11 besitzt noch keine persistierten Revisionen: Auflösung
verwendet expliziten Kontext und ist noch nicht automatisch beim Laden/Undo aktiv.
Nächster begrenzter Auftrag V07h: portabler Revisionskontext mit strikter Migration
und gemeinsamer Auflösung beim Öffnen/Wiederherstellen. Globale Bearbeitungs-UI,
Papiermaß, Upload und Tab-Synchronisation bleiben nachgelagert.

#### V07h Umsetzung - 09.10.2026

Projektformat 12 hält bekannte Revisionen direkt in der einmaligen Mustertabelle.
Altdateien 1–11 behalten unbekannte Herkunft, ohne erfundene Revisionsnummer.
Projektöffnung/-übernahme und Undo/Redo verwenden den zentralen Resolver. Der Browser-
Adapter liest Storage vor Dispatch; Domain/Reducer bleiben frei von Speicherzugriffen.
Keine Bibliotheksschreibvorgänge und keine zusätzlichen Modell-Undo-Schritte. Fehlende
Bibliothek erhält portable Inhalte; gleichversionige Konflikte werden gemeldet.
Wiederherstellen desselben Projekts erhält dessen neueren bekannten Musterstand auch
bei inzwischen fehlender Bibliothek. 758 Tests sowie Typecheck und Build bestanden.

Abnahme: Musterschraffur speichern/öffnen; Erscheinungsbild ändern, Undo/Redo und
erneuter Dateirundlauf. Neue globale Versionen sind noch nicht über die UI bearbeitbar.
Genau ein Folgeauftrag V07i: Bearbeiten und eigene Bibliotheks-History im vorhandenen
FloatingPanel anbinden, aktives Projekt ohne Modell-History-Schritt zentral auflösen.
Papiermaß, Upload und vollständige Mehrtab-Synchronisation bleiben getrennte Schritte.

#### V07i Umsetzung - 09.10.2026

Muster bearbeiten mit stabiler ID und gebundener Ausgangsrevision, eigene Bibliotheks-
Undo/Redo-Pfeile und reversible Neuanlage im vorhandenen FloatingPanel umgesetzt.
Entwurfslinien sind einzeln entfernbar. Kopie/Neuer Entwurf erzeugen neue Identität;
Speichern eines gerade angelegten Musters bearbeitet danach dieses. Fenster schließen
behält History; Neu laden setzt sie zurück und erhält den unveröffentlichten Entwurf.
Externe Änderungen erzwingen Neu laden; ein veralteter Zielentwurf bleibt gesperrt
durch den Revisionsschutz, bis das aktuelle Muster bewusst wieder geöffnet wird.

Gemeinsame Storage-Ereignisse aktualisieren das aktive Projekt ohne Modell-History-
Schritt. Past/Future bleiben erhalten; tatsächliche Basisänderung beendet direkte
Vorschau. Werkzeugvorgaben folgen dem aufgelösten Projekt-/Bibliotheksstand. Fehlende
oder ältere Definitionen erhalten portable Inhalte; Konflikte werden angezeigt.
Geschlossene Dateien werden nicht geschrieben; Abgleich erfolgt beim Öffnen.
Atomare parallele Tab-Schreibvorgänge und Bibliothekslöschung bleiben ausstehend.

765 Tests, Typecheck, Build und Lint ohne Fehler (sechs bekannte Warnungen). Browser-
Abnahme wegen Sandbox-Kernelstartfehler offen. Abnahme: zwei Schraffuren zuweisen,
Muster bearbeiten, speichern, beide prüfen; Bibliotheks-Undo/Redo und Projekt-Undo
getrennt testen, Fenster schließen/öffnen, Kopie und Entwurfslinien entfernen.
Genau ein Folgeauftrag V07j: Papiermaß-/Ansichtsmaßstab-Vertrag anhand Code/Architektur
prüfen und einen begrenzten Umsetzungspiloten planen. Keine Zoom-basierte Ersatzregel.
Upload wartet weiterhin auf die Nutzerentscheidung zum konkreten Austauschformat.




### Detail D14 – docs/planning/HATCH_PRESET_PICKUP.md

Herkunft: `docs/planning/HATCH_PRESET_PICKUP.md`, Snapshot main/PR237. Altstatus nicht als aktuelle Fertigmeldung lesen.

#### V06b: Gemeinsame Werkzeugvorgabenuebernahme

Stand 08.10.2026. Ersetzt den V06a-Entwurf nach ausdruecklicher Nutzerpraezisierung.

#### Verbindlicher Ablauf

Schneller Doppelt-Rechtsklick auf ein sichtbares Element aktiviert sein Werkzeug
und uebernimmt dessen Erstellungswerte einschliesslich Ebene. Kein eigener Button,
kein Menuebefehl. Vorgaben sind vor dem Zeichnen in Werkzeugeigenschaften editierbar.
ID, Geometrie und Verbindungen werden nicht kopiert. Quelle und History bleiben
bei der Uebernahme unveraendert. Erst neue Geometrie erzeugt einen Modell-Undo-Schritt.

#### Umsetzung und Grenzen

- application/input/double-secondary.ts: gemeinsame Geste (450 ms, 6 CSS-Pixel;
  technische Parameter). Gleiches Element und gleicher Interaktionskontext;
  andere Klicks/Tastatur, Kontextwechsel und gesperrte Bearbeitungen verwerfen.
- application/tools/pickup.ts: stabile Ziel-ID und aktuelle Sichtbarkeit pruefen;
  explizite eigene Werte-Kopie. Erster Adapter Schraffur. Kein pauschales Entity-Spread.
- useToolDefaults: sitzungsbezogener UI-Zustand, getrennt von Modell und History.
  Geloeschte Zielebene faellt auf Projektvorgabe zurueck.
- Schraffur: Fill, Hintergrund, Kontur UND Ebene. Alle vier Modi speisen createDrawing
  und previewHatch. Alte Aufrufer ohne zusaetzliche Werte behalten die bisherigen Defaults.
- PlanSceneRun/BimPlan verbinden die gemeinsame Geste mit dem Application-Adapter.
  Waehrend laufender Zeichnung, Platzierung, Direct Edit, Referenzauswahl und Pan
  keine Uebernahme. Ein inaktives Zeichnungswerkzeug ohne ersten Punkt erlaubt sie.
- Nur 2D-Schraffuren sind in diesem Piloten angeschlossen. Waende, Fenster, Linien
  und spaetere Elemente bekommen deklarierte Adapter, keine kopierte Bedienlogik.
  Kein Preset-Katalog, Dateiformatwechsel oder separate AI-Modelllogik.

#### Nachweis

715 Tests bestanden. Neue Tests pruefen eigene Werte-Kopie, abweichende Quell-Ebene,
alle vier Konturkonstruktionen mit identischen Vorgaben, neue IDs, ein Undo beim
Zeichnen, keine Quellaenderung sowie veraltete/verdeckte/geloeschte/falsche Ziele.
Geste: Zeit, Entfernung, Ziel, Kontext und Reset. Typecheck, gezielter Lint und Build.
Browser: Schraffur mit 63 % Deckkraft, Kontur und Innenwand-Ebene erstellt;
Vorgaben auf 20 %/2D-Zeichnungen geaendert; Doppelt-Rechtsklick stellt 63 %,
Kontur und Innenwand wieder her und aktiviert Schraffur. Praktische Nutzerabnahme
bleibt offen; keine pauschale Freigabe fuer noch nicht angebundene Elemente.

#### Naechster begrenzter Auftrag

V06c Fenster an dieselbe Uebernahmegrenze anbinden: Breite, Hoehe, Bruestung,
Ebene. Keine Host-ID/Position. Gemeinsame Platzierung und Validierung beibehalten.




### Detail D15 – docs/planning/SAVED_DRAWING_VIEWS.md

Herkunft: `docs/planning/SAVED_DRAWING_VIEWS.md`, Snapshot main/PR237. Altstatus nicht als aktuelle Fertigmeldung lesen.

#### Gespeicherte Ausschnitte — MS-04a

Stand 10.10.2026. Planung, keine neue Laufzeitfunktion. Codebasis: PR234,
Commit `2db018c`, nach erfolgreicher CI regulär zusammengeführt.
Maßgebend: [Architektur §29](../../ARCHITECTURE.md),
[Maßstabsvertrag](VIEW_SCALE_CONTRACT.md) und
[Entwicklungsabstimmung](DEVELOPMENT_ALIGNMENT_2026-10-08.md).

#### Befund am vorhandenen Code

| Bereich | Nachgewiesener Stand | Noch fehlend |
| --- | --- | --- |
| `src/domain/project/schema.ts` | Schema 16, ein Geschoss, optionale workingViews mit höchstens einem working-plan-Eintrag; fehlend bedeutet 1:100 | Persistente ModelViews/DrawingDocuments und Referenzvalidierung |
| `src/application/views/project-scale.ts`, `src/domain/views/scale.ts` | Identität aus Projekt/Geschoss, validierter Maßstab, gemeinsame metrische Größenauflösung | Auflösung eines gespeicherten Dokumentziels; ScaleContext kennt nur working-plan |
| `src/application/layers/visibility.ts` | Gemeinsame Sichtbarkeitsregel einschließlich Fenster/Host; drawing-document-Scope als Token | Existenz eines Dokuments wird ausdrücklich noch nicht geprüft; Token ist kein gespeicherter Ausschnitt |
| `src/application/layers/visibility-actions.ts` | Projektfilter mit eigener Paletten-History | Aktionen/History für unabhängige Dokumentfilter |
| `src/components/cad/CadViewport.tsx`, `BimPlan.tsx`, `CadWorkspace.tsx` | Arbeitsmaßstab und Sichtbarkeit sind an mehreren Stellen verbunden; BimPlan rekonstruiert working-plan | Gemeinsame Auflösung von Bindung, Maßstab und Sichtbarkeit vor Übergabe an Renderer |
| `src/lib/bim/history.ts`, `src/domain/project/model-equality.ts` | Modell-Undo erhält aktuelle workingViews/bimVisibility | Bewusste Regel für Dokumentanlage, Löschung, Ausschnittänderung und Dokumentmaßstab |

Die vorhandenen Größenresolver und Sichtbarkeitspolicies werden weiterverwendet.
Eine zusätzliche Rendering-Engine, Datenbank oder neue BIM-History ist hierfür
nicht begründet. Neue Kontexte dürfen insbesondere nicht still auf den
Arbeitsmaßstab oder den Arbeitsfilter zurückfallen.

#### Verbindliche Regeln aus bestätigten Anforderungen

- Ein Bauteil existiert einmal. ModelView beschreibt die Ableitung aus dem Projekt,
  DrawingDocument referenziert diese Definition und besitzt eigenen Ausschnitt,
  Maßstab und Ebenensichtbarkeit. Änderungen am Modell erscheinen in allen
  zugehörigen Dokumenten; ein eingefrorener Export ist ein separates Ausgabeprodukt.
- Stabile IDs statt Listenpositionen: Projekt → ModelView → DrawingDocument.
  Eine Bildschirmbelegung referenziert das Ziel über ViewportBinding und besitzt
  nur ihre Kamera/Navigation. Zwei Fenster eines Dokuments teilen dessen Maßstab
  und Filter, behalten aber unabhängigen Zoom.
- Rohes BIM und abgeleitete Arbeitsansichten teilen den BIM-Sichtbarkeitskontext.
  Dokumentfilter sind eigenständig und werden nicht mit dem BIM-Filter geschnitten.
  Layoutplatzierungen lesen den Dokumentkontext. Verdeckte Elemente sind dort weder
  auswählbar noch fangbar; Fenster benötigen im jeweiligen Kontext sichtbare Hosts.
  IFC bleibt vollständig.
- Bei Dokumentanlage wird der Arbeitsmaßstab vorgeschlagen, bleibt aber frei
  wählbar. Spätere Arbeitsmaßstabsänderungen verändern Dokumentmaßstäbe nicht.
  Papiergrößen bleiben intern Meter; der gemeinsame Resolver verwendet den
  effektiven Dokumentmaßstab. BIM-Geometrie und Messwerte bleiben unverändert.
- Bestehende Linien/Schraffuren behalten ihren Geschoss-Scope. Neue dokumenteigene
  Annotationen brauchen explizite Besitzer-IDs. Sichtbarkeit ist keine Kopieraktion
  und verschiebt keine Annotation in einen anderen Scope.
- Arbeitsmaßstab bleibt außerhalb Modell-Undo; Ebenensichtbarkeit hat ihre eigene
  History. Daraus folgt noch keine Entscheidung über Dokumentanlage/-löschung.
- Alle späteren Modellaktionen aus Dokumenten lösen stabile Quell-IDs auf und
  nutzen dieselben Application-Aktionen wie der Arbeitsgrundriss. Generierte Kanten
  sind nicht automatisch bearbeitbare Bauteilpunkte. AI/Text/Voice erhalten denselben
  Ziel-, Ansichts- und Revisionskontext; keine zweite AI-Modelllogik.

#### Technische Konkretisierung des Vertrags

Dies sind Architekturregeln, keine behaupteten neuen Bedienentscheidungen:

1. Application löst eine Bindung gegen den aktuellen unveränderlichen Projektsnapshot
   auf. Ergebnis enthält Quellansicht, effektiven Maßstab, Sichtbarkeit und Fähigkeiten.
   Renderer erhalten dieses Ergebnis, keine erratene working-plan-Identität.
2. Fehlende/fremde IDs, unbekannte Zielarten und veraltete Kontexte werden ausdrücklich
   abgewiesen. Ein später gelöschtes Ziel ersetzt sich nicht durch den Hauptgrundriss.
   Das Schließen eines Bildschirmfensters löscht kein Dokument.
3. Dokumente werden im versionierten Projekt gespeichert. Erst ihre tatsächliche
   Einführung erweitert das Schema, mit strikter Migration aller bisher unterstützten
   Versionen. Alte Projekte behalten ihren Arbeitsmaßstab, Filter und Annotationen;
   es werden keine Ausschnitte automatisch erfunden.
4. Löschen von referenzierten Definitionen erfordert geprüfte Abhängigkeiten. Kein
   stilles kaskadierendes Löschen von Dokumenten, Annotationen oder Layoutplatzierungen.
   Wie der Nutzer Abhängigkeiten löst, bleibt eine spätere Bedienentscheidung.
5. Abgeleitete Daten sind wegwerfbar. Cache-Schlüssel müssen Modellrevision und
   relevante Dokumentdefinition berücksichtigen; Pointer und Kamera gehören nicht
   in die Identität der gespeicherten Definition. Keine Vollvalidierung pro Mausbewegung.
6. Ein späterer Layout-Override braucht genau einen effektiven Ausgabemaßstab;
   Dokumentmaßstab und Platzierung dürfen nicht unbeabsichtigt doppelt skalieren.
   Perspektivische 3D-Ansichten haben keinen global konstanten 1:S-Maßstab.

#### Offene Bedienentscheidungen und Vorschläge

| Offen | Vorschlag, noch nicht beschlossen | Vor welchem Schritt erforderlich |
| --- | --- | --- |
| Anfangsfilter | Entschieden: aktuelle Ebenensichtbarkeit einmal übernehmen, danach unabhängig ändern und speichern | Dokumentanlage |
| Dokumentaktionen: History | Keine eigene Abbild-History (Nutzerentscheidung). Die Zuordnung von Anlage/Löschung zum bestehenden Projekt-Undo ist dadurch noch nicht ausdrücklich entschieden. Ebenensichtbarkeit bleibt beim vorhandenen Ebenenumschalter. | Persistente Dokumentaktionen |
| Wahl/Änderung des Ausschnittbereichs | Rechteck in Modellkoordinaten; Fit/Zoom verändert ihn nicht | Sichtbarer Ausschnittpilot |
| Bearbeitungsmodus im Ausschnitt | Erster Pilot nur Ansicht, spätere Modell-/Annotationsbearbeitung klar trennen | Ausschnitt-UI |
| Neue/gelöschte Ebenen in Dokumentfiltern | Hidden-ID-Modell wiederverwenden; neue Ebenen sichtbar, gelöschte IDs bereinigen | Dokumentfilter-Persistenz |

Diese Punkte blockieren den untenstehenden Vorbereitungsschritt nicht. Sie werden
vor der jeweils abhängigen Umsetzung entschieden, nicht als Nutzerfreigabe erfunden.
Layouteditor, Schnitterzeugung, neue Annotationstypen und gedruckte Ausgabe bleiben
außerhalb dieses Auftrags. Ältere N-/F-/V-/AI-Anforderungen bleiben erhalten.

#### Genau ein ausführbarer Folgeauftrag: MS-04b — gemeinsamen Arbeitsansichtskontext anbinden

Ein begrenzter Refactoring-Pilot am vorhandenen Arbeitsgrundriss, ohne neue
Dokumentklassen oder Dateiformatänderung:

- Einen Application-Resolver für die tatsächliche working-plan-Bindung einführen,
  der existierende Maßstabs- und Sichtbarkeitsdienste zusammenführt. Gegen Projekt
  und Geschoss validieren; unbekannte Dokumentziele ausdrücklich ablehnen.
- CadViewport/BimPlan und den zugehörigen Maßstabsselektor aus demselben aufgelösten
  Kontext versorgen. Der Renderer rekonstruiert keine working-plan-Identität mehr.
  Bestehende explizite Test-/Sichtbarkeitskontexte nicht unbemerkt überschreiben.
- Pointer/Zoom dürfen den fachlichen Kontext nicht neu aufbauen. Bestehende
  Sichtbarkeits-, Picking-, Snap- und History-Wege bleiben gemeinsam; kein Umbau
  der kompletten Workspace- oder 3D-Architektur.

Abnahme: zwei Bildschirmfenster desselben Grundrisses teilen 1:50 und den Filter,
behalten unabhängigen Zoom; Papiermuster verwenden überall denselben Maßstab.
Ausgeblendete Wand samt Fenster ist weder sichtbar noch auswählbar/fangbar.
Maßstabs-/Filterwechsel, Modell-Undo/Redo und Speichern/Öffnen behalten die bisherigen
Regeln. Fremdes Projekt/Geschoss, unbekanntes Dokumentziel und veraltete Bindung
werden abgewiesen. Automatisierte Regressionstests, Typprüfung, Build und praktischer
Browservergleich; keine Geschwindigkeitszusage ohne Messung.

Dieser konkrete Abbau der aktuellen mehrfachen Kontextverdrahtung bereitet den
Ausschnittpilot vor, ohne offene Dokument-Bedienregeln vorwegzunehmen. Nach MS-04b
wird genau ein neuer Auftrag im Entwicklungsplan festgelegt.


#### MS-04b umgesetzt — 10.10.2026

Gemeinsamer Resolver und produktive Verdrahtung implementiert, 796 Tests und Build
bestanden; Browservergleich der geteilten Ansicht erfolgreich. Siehe aktuellen
DEVELOPMENT_PLAN.md für Nachweis und den einzigen Folgeauftrag MS-04c. Die obige
Pilotbeschreibung ist damit historisch; die offenen Dokumententscheidungen bleiben
offen, bis die angefragten Nutzerantworten vorliegen.


#### Nutzerpräzisierung: Abbilder und Navigator — 10.10.2026

Verbindlich für den nächsten Pilot:

- Nutzerbezeichnung **Abbild**, Mehrzahl **Abbilder**. Die bisherigen Begriffe
  Ausschnitt/Zuschnitt bezeichnen hier dieselbe modellgebundene Funktion;
  der technische Architekturbegriff DrawingDocument bleibt erhalten.
- Ein neues Abbild übernimmt zunächst die aktuelle Ebenensichtbarkeit. Danach
  können Ebenensichtbarkeiten im Abbild angepasst und gespeichert werden, unabhängig
  vom Arbeitsmodell und anderen Abbildern.
- **Keine eigene Undo-/Redo-History für Abbilder.** Ebenensichtbarkeit wird mit
  demselben Ebenenumschalter wie im Canvas gesteuert. Die vorhandenen Ebenen-Undo-/
  Redo-Bedienungen werden wiederverwendet; kein zusätzliches Abbild-History-Fenster.
  Eine Sichtbarkeitsaktion muss eindeutig den aktiven BIM- oder Abbildkontext treffen,
  niemals unbeabsichtigt den Filter eines anderen Kontextes ändern.
- Der Navigator erhält zwei Tabs: **Gebäudestruktur** (bisheriger Inhalt) und
  **Abbilder** (vorhandene Abbilder anzeigen, öffnen und verwalten). Damit ist der
  Zugriffsort festgelegt. Tabwechsel und Öffnen eines Abbilds sind getrennte Vorgänge.

Dies dokumentiert Bedienanforderungen, keine bereits implementierte Oberfläche.
Keine eigene Abbild-History bedeutet nicht automatisch, dass Anlage/Löschung niemals
rückgängig gemacht werden dürfen; diese konkrete Zuordnung wird vor Umsetzung geprüft.




### Detail D16 – docs/planning/VIEW_SCALE_CONTRACT.md

Herkunft: `docs/planning/VIEW_SCALE_CONTRACT.md`, Snapshot main/PR237. Altstatus nicht als aktuelle Fertigmeldung lesen.

#### Bauplan: Ansichtsmaßstab im Bearbeitungsmodus und in Ausschnitten

Stand: 10.10.2026. Architekturvertrag und Fortschrittsnachweis.
MS-01 bis MS-03a sind umgesetzt: Arbeitsmaßstab gespeichert außerhalb Modell-Undo,
Schraffuren mit Modell-/Papiermaß in Schema 16. Gespeicherte Ausschnitte sind noch
nicht implementiert. Für ihren Codeabgleich und den nächsten begrenzten Pilot gilt
[SAVED_DRAWING_VIEWS.md](SAVED_DRAWING_VIEWS.md), ergänzend zu
[ARCHITECTURE.md §29](../../ARCHITECTURE.md). Ältere Fortschrittsabsätze unten
beschreiben den damaligen Stand; der aktuelle Auftrag steht im Entwicklungsplan.

#### 1. Begriffe und Geltungsbereich

| Begriff | Bedeutung und Eigentümer |
| --- | --- |
| **Bearbeitungsmodus / Arbeitsansicht** | Der gegenwärtige Canvas, in dem das gemeinsame BIM-Modell über Geschosse, Grundriss und weitere Arbeitsansichten bearbeitet wird. Er hat einen **Arbeitsmaßstab** für die Darstellung maßstabsabhängiger 2D-Anmerkungen. Beim neuen Projekt ist er **1:100**. Er ist keine Maßangabe für BIM-Geometrie. |
| **Ausschnitt / Abbild** | Eine später gespeicherte, weiterhin modellgebundene Sicht auf z. B. ein Geschoss, einen Schnitt oder eine Ansicht. Nach §29: ModelView beschreibt die Modellableitung; DrawingDocument speichert Ausschnitt, Sichtbarkeit, ergänzende Annotation und **seinen eigenen Ausgabemaßstab**. Kein kopiertes, unabhängig bearbeitbares Gebäude. |
| **Ansichts-/Ausgabemaßstab 1:S** | Expliziter positiver, endlicher Nenner S für die Darstellung im jeweiligen 2D-Kontext. 1:100 im Bearbeitungsmodus ist die Anfangsvorgabe; ein Ausschnitt erhält beim Erstellen seinen frei wählbaren eigenen Wert und kann ihn später ändern. Änderung einer Ansicht ändert keinen anderen Maßstab. |
| **Zoom/Kamera** | Bildschirmnavigation in CSS-Pixeln pro Modellmeter, einschließlich Fit/Pan/Mausrad. Sie ändert nur die Bildschirmvergrößerung. Die vorhandene Zoom-Prozentanzeige und die grafische Meterleiste sind **keine** 1:S-Ausgabe. |
| **Modellmaß / Papiermaß** | Eigenschaft der **Größe/Strichabstände** einer darstellenden Annotationsanwendung, nicht ihres geometrischen Messwerts. Beide Modi speichern intern Meter, mit explizitem Maßbezug. Papiermaße werden in der Bedienung in mm angezeigt/eingegeben und an dieser Grenze umgerechnet. |

Ein Maßstab in 1:S ist für maßhaltige 2D-/orthografische Darstellungen
definiert. Eine perspektivische 3D-Kamera hat keinen über das ganze Bild
konstanten Zeichenmaßstab. Für spätere gespeicherte 3D-Perspektiven getrennt
Kamera und Ausgabeart festlegen; die 1:S-Auswahl dort nicht als fachlich
korrekte Papierbemaßung ausgeben. Das verhindert nicht, 3D-Ansichten zu
speichern.

#### 2. Verbindliches Verhalten

1. Unten im Canvas **neben dem vorhandenen Zoom** einen eindeutig mit
   `Maßstab` bezeichneten Selektor `1:100` anbieten. Er betrifft den
   gerade fokussierten geeigneten Bearbeitungs- oder Ausschnitt-Viewport.
   Er muss einen frei eingegebenen gültigen Wert `1:S` zulassen.
   Beim neuen Bearbeitungsprojekt ist `1:100` aktiv. Zoom und Meterleiste
   bleiben eigenständige Bedienungen.
2. Im Bearbeitungsmodus wirkt S vorerst auf darstellende 2D-Inhalte
   (Beschriftungstexte, Maß-/Zahlentext, Pfeile und später
   Papier-Schraffuren), **soweit deren Größe auf Papier bezogen ist**.
   Modellmaß-Inhalte behalten ihre Modellgröße. UI-Texte wie Menüs,
   Statuszeile und Koordinatenanzeige werden dadurch nicht verändert.
   Noch nicht implementierte Werkzeuge werden nicht als schon vorhanden
   dargestellt.
3. Jedes künftige Text-, Bemaßungs- und sonstige Werkzeug mit
   größenrelevanten Texten/Zahlen bietet in seinen
   **Werkzeugeigenschaften** die Wahl `Modellmaß` oder `Papiermaß`
   für die jeweilige Größe. Bestehende Elemente brauchen eine
   ausdrückliche Migrations-/Defaultregel, keine heimliche Umdeutung.
   Tool-Defaults und vorhandene Anwendungen folgen derselben
   validierten Application-Grenze. Fachliche Werte wie `3,00 m`,
   Fläche oder Winkel bleiben aus Modellgeometrie berechnet und
   ändern sich beim Umschalten von 1:100 auf 1:50 nicht.
4. Ein Ausschnitt übernimmt bei Erstellung eine **vorgeschlagene**
   Anfangseinstellung aus dem aktuellen Arbeitsmaßstab, aber die
   Person kann **bei der Erstellung** frei `1:S` wählen. Anschließend
   ist sein Wert eigenständig gespeichert. Eine Änderung des
   Bearbeitungsmaßstabs oder eines anderen Ausschnitts darf ihn nicht
   überschreiben. Zwei Ausschnitte desselben Geschosses können z. B.
   1:50 und 1:200 besitzen und bleiben beide an dasselbe BIM-Modell
   gebunden.
5. Weder die Änderung von S noch die Wahl Modellmaß/Papiermaß
   verändert Modellkoordinaten, Wand-/Fenster-/Dachabmessungen,
   Anschlussregeln, Fangpunkte, Messwerte oder IFC-Geometrie.
   Proportionale Skalierung von BIM-/3D-Elementen bleibt verboten.
   2D-Skalierung bzw. Kalibrierung importierter PDF-/PNG-/JPEG-Referenzen
   sind **andere Aktionen** mit eigenen Regeln.
6. Gedruckte Ausgabe nutzt den expliziten effektiven Maßstab der
   Zeichnungsplatzierung. Eine spätere Layout-Platzierung darf nicht
   unbemerkt den Ausschnitt nochmals skalieren. Abweichungen zwischen
   DrawingDocument-S und Layout-S müssen im Ausgabekontext aufgelöst
   oder als expliziter Override sichtbar sein. Noch keine konkrete
   Layout-UI oder Druckzusage aus dieser Planungsdatei ableiten.

#### 3. Gemeinsame Größenauflösung

In 2D ist `S` der explizite Nenner, `z` die aktuelle Zahl
CSS-Pixel pro Modellmeter. `paperMetres` ist die intern gespeicherte Papiergröße;
`paperMillimetres` ist ausschließlich der Ein-/Ausgabewert der Bedienung.

- **UI → interne Länge:** `paperMetres = paperMillimetres / 1000`.
- **Papiermaß:** `modelMetres = paperMetres * S`.
- **Modellmaß:** `modelMetres = storedModelMetres`.
- **Bildschirm:** `screenCssPixels = modelMetres * z`.
- **Papierausgabe:** `paperMetres = modelMetres / S`; für Anzeige in mm mal 1000.

Nutzerbestätigung nach Review von PR230 (09.10.2026): interne Längeneinheit
auch für Papiergrößen Meter; keine gemischten mm-/m-Werte unter demselben
Parameternamen. Persistente Daten und gemeinsame Resolver verwenden Meter;
UI-/Exportadapter benennen abweichende Einheiten ausdrücklich.

Beispiel: Ein Papiertext mit 2 mm Höhe wird in 1:100 als 0,20 m
Modelläquivalent, in 1:50 als 0,10 m dargestellt; auf beiden
ausgegebenen Plänen bleibt er 2 mm hoch. Ein Text mit Modellhöhe
0,20 m bleibt im Modell gleich hoch und wäre auf Papier 2 mm bei
1:100 bzw. 4 mm bei 1:50. Browser-Zoom verändert die Anzeige
beider Texte in Pixeln, nicht S oder den gespeicherten Größenmodus.

Textanker, Bemaßungsbezüge und Schraffurkonturen verbleiben an
Modellkoordinaten. Textumbruch, Zeilenabstand, Pfeilgröße,
Schraffurzelle und Strichbreite werden jeweils durch einen
gemeinsamen typisierten Resolver für den jeweiligen Inhalt
abgeleitet; bloßes CSS-Transform auf alle DOM-Elemente ist kein
fachlicher Maßstabsvertrag. Ungültige/fehlende S-Werte im
Papiermodus ergeben einen klaren Fehler, keinen Zoom- oder
1:1-Fallback. Technische Grenzen müssen endliche, positive
Zwischenergebnisse sicherstellen.

#### 4. Zuständigkeit und Speicherung

- Der fachliche Ansichtskontext besitzt Maßstab und stabile Identität;
  für Ausschnitte ist dies später `DrawingDocument.outputScale`.
  Ein Bildschirmfenster besitzt Kamera/Zoom und referenziert den fachlichen
  Kontext über ViewportBinding. Es besitzt keinen zweiten Ausgabemaßstab.
  Zwei Fenster desselben Kontextes teilen S, behalten aber unabhängigen Zoom.
  Zwei unterschiedliche Kontexte haben unabhängige Maßstäbe. Beim Wechsel der
  Fensterbelegung wird S aus dem Zielkontext gelesen; ein Fenstermaßstab wird
  niemals auf die neu angezeigte Ansicht übertragen. Diese Eigentümerregel
  folgt der Nutzerbestätigung nach Review von PR230 am 09.10.2026.
  Der Arbeitsmaßstab ist eine **Ansichtseinstellung**, kein globales
  Feld im Bauteil und keine Eigenschaft jeder einzelnen Annotation.
  Der Arbeitsmaßstab ist seit MS-03 im Projekt gespeichert (workingViews);
  fehlende Einträge und Altprojekte starten mit 1:100.
- Application prüft Änderungen an gespeicherten Ansichtseinstellungen
  mit gültiger Kontext-/View-ID und unveränderter Revision;
  Annotationen-/Dokumentaktionen nutzen die bestehende validierte
  Preview-/Commit-/Undo-Grenze. Arbeitsmaßstab erzeugt nach Nutzerentscheidung
  **keinen Modell-Undo-Schritt**; Modell-Undo erhält den aktuellen Maßstab.
  Navigation/Zoom allein erzeugen keinen BIM-Undo-Schritt.
- Rendering erhält den **effektiven ScaleContext** als Eingabe.
  Es leitet CSS-/SVG-/Papiergrößen aus einem einzigen Resolver ab.
  `CadWorkspace`, `StatusBar` und `CadViewport` verbinden
  fokussierten Viewport und Selector, halten aber nicht die
  fachliche Umrechnung oder eine zweite Modellwahrheit.
- Dateiformat: Sobald Arbeitsmaßstab oder Ausschnitt gespeichert
  werden, strikte Versionierung/Migration, Altdatei-Rundlauf und
  referenzielle Validierung. Gespeicherte Ausschnitte teilen das
  BIM-Modell und behalten ihr eigenes S; Änderungen am Hauptcanvas
  schreiben sie nicht um. Bildschirm-Zoom muss nicht aus S
  rekonstruiert werden.
- Schraffuren nutzen seit MS-03a diesen ScaleContext mit Modell-/Papiermaß
  im Produktionsschema 16. Alte Modellmuster bleiben unverändert; beim
  Moduswechsel bleibt die sichtbare Größe erhalten. Siehe HATCH_PAPER_SCALE.md.

#### 5. Kleine, abhängige Aufträge für Codex

| Schritt | Umfang | Abnahme |
| --- | --- | --- |
| **MS-01 Vertrag und Maßstab-UI** | Gemeinsamen typisierten ScaleContext/Größenresolver in Domain/Rendering und sitzungsbezogene Kontextänderung in Application anbinden; keine Umrechnung pro Werkzeug. Selector **unten neben Zoom** im fokussierten 2D-Bearbeitungs-Canvas mit initial 1:100. Noch keine Persistenz oder Modell-History; dieser Pilot entscheidet nicht die spätere History-Regel. | Auswahl und freie Eingabe funktionieren; ungültige Werte verändern nichts; Wechsel 1:100 → 1:50 lässt Zoom %, Meterleiste, Geometrie, Fang, Messung und BIM-Undo unverändert. Zwei Fenster derselben fachlichen Ansicht teilen S, nicht Zoom; Fensterwechsel/Schließen verliert oder überträgt S nicht. Unterschiedliche Kontexte bleiben unabhängig. |
| **MS-02 Papier-/Modellgröße als Pilot** | Ein vorhandenes geeignetes Zeichnungselement bzw. den V07k-Musterpiloten über denselben ScaleContext anbinden; der späteren Text-/Maßketten-Werkzeugeigenschaft einen typisierten Vertrag geben, wenn das Werkzeug implementiert wird. | Das 2-mm-/0,20-m-Beispiel bei 1:50 und 1:100; Zoom und unterschiedliche Browsergrößen liefern die gleichen Modellwerte; bestehende Modellmuster bleiben identisch. Keine leeren Text-/Bemaßungs-Klassen als Vorleistung. |
| **MS-03 gespeicherte Arbeitsansicht** | Per-Projekt-Persistenz des Arbeitsmaßstabs und Undo-Regel begrenzt entscheiden/implementieren; Migration 1:100 für Altprojekte. | Speichern/Öffnen erhält eigene gültige Wahl, alte Datei öffnet 1:100; keine Änderung an Modellgeometrie, History-/Undo-Verhalten dokumentiert. |
| **MS-04 eigenständige Ausschnitte** | Erst beim tatsächlichen ModelView-/DrawingDocument-Schritt: frei wählbares S bei Erstellung, gespeicherte Änderung und unabhängige Darstellung. | Arbeitsansicht 1:100 plus zwei modellgebundene Abbilder 1:50/1:200; Bearbeitungsmaßstab und Zoom beliebig ändern; Abbildwerte, Modell-IDs, eigene Annotationen, Dateirundlauf und Ausgabe-Ableitung bleiben korrekt. |

Die Tabelle ist eine **Folge begrenzter Aufträge**, keine Aufforderung,
MS-01–MS-04 gleichzeitig zu bauen oder den laufenden Auftrag des
DEVELOPMENT_PLAN.md zu verdrängen. Nach jedem Schritt dort Status,
Testnachweis, Grenzen und den nächsten **einen** Auftrag eintragen.

Abgleich nach Nutzerfreigabe von PR229: MS-01 ist nun der nächste einzelne
Auftrag im Entwicklungsplan. V07k wird als Schraffur-Anwendungsfall in MS-02
eingeordnet, nicht als paralleler Resolver. Der allgemeine Größenresolver wird
in MS-01 mit 0,002 m Papiergröße bei S=50/100, Modellgröße 0,20 m, getrenntem
Zoom sowie fehlenden/ungültigen/extremen Eingaben geprüft. Eigene Text- oder
Bemaßungsklassen werden erst bei deren tatsächlicher Implementierung erstellt.

#### Fortschritt und verbindliche History-Regel — 09.10.2026

MS-01 ist mit PR231 zusammengeführt; MS-02/V07k ist als isolierter Schraffurpilot
geprüft. Nächster einzelner Auftrag ist MS-03 gemäß DEVELOPMENT_PLAN.md.
Nutzerentscheidung: Arbeitsmaßstab außerhalb des normalen Modell-Undo speichern.
Modell-Undo/Redo darf den aktuellen Ansichtsmaßstab nicht zurücksetzen. Die
Persistenz mit Altdatei-Migration bleibt MS-03; sie ist noch nicht implementiert.

#### MS-03 umgesetzt — 10.10.2026

Schema 15 speichert workingViews am Projekt, strikt an den vorhandenen Arbeitsgrundriss
gebunden. Fehlender Eintrag/Altdateien ergeben 1:100. Application publiziert außerhalb
des Modell-Undo; Undo/Redo erhält den aktuellen Maßstab. Sitzungs-Map entfernt.
Nutzervorgaben: 1:50, 1:100, 1:200, 1:500, 1:1000, 1:2500, 1:5000 und Individuell
mit freier Eingabe 1:S. Nächster Einzelauftrag laut Entwicklungsplan ist die
Schraffur-Papiermodus-Integration, nicht der vollständige MS-04-Ausschnitteditor.

#### Erster produktiver Papiermaß-Verbraucher — 10.10.2026

Schraffurmuster verwenden nun den gespeicherten Kontext (Schema 16). Der metrische
Resolver liegt in domain/views, damit Validierung und Anwendungsaktionen dieselben
Regeln wie Rendering verwenden. Modell-/Papiermoduswechsel erhält die sichtbare Größe
(Nutzerentscheidung); gezeichnete Konturen werden nie skaliert. MS-04a konkretisiert
als nächster begrenzter Planungsauftrag gespeicherte Ausschnitte gemäß Entwicklungsplan.




### Detail D17 – docs/references/IMAGE_REFERENCE_PLAN.md

Herkunft: `docs/references/IMAGE_REFERENCE_PLAN.md`, Snapshot main/PR237. Altstatus nicht als aktuelle Fertigmeldung lesen.

#### Bildreferenzen und Zweipunkt-Kalibrierung

Stand: 07.10.2026. Bestandsaufnahme auf main d18990d nach PR160.
Dies ist ein technischer Arbeitsentwurf, keine implementierte Funktion.
Grundlagen: DEVELOPMENT_GUIDE.md, Etappe 7; ARCHITECTURE.md, Abschnitte 29/30,
Plattformgrenze, gemeinsame Auswahl und ToolInteraction.

#### Verbindlich und noch offen

Verbindlich: ein Modell, stabile IDs, Meter, gemeinsame Aktionen, unveränderte
BIM-Skalierungssperre, atomare History und getrennte Sichtbarkeit von BIM-Projekt
und späteren DrawingDocuments. Zoom verändert keine Modellmaße.
Der Guide beschreibt zwei Messpunkte, eine bekannte Länge mit Einheit und den
ersten Messpunkt als festen Skalierungsanker.

Verbindliche Nutzerentscheidung vom 07.10.2026: Auch importierte PNG-/JPEG-Bilder
dürfen mittels Zweipunkt-Kalibrierung skaliert werden. Dies ersetzt ausschließlich
die Bitmap-Ausnahme aus Architekturabschnitt 30. BIM-Bauteile bleiben gesperrt.
Keine Entscheidung zu PDF-Vektorzerlegung, Desktop-Plattform oder konkreten
Asset-Grenzwerten wird daraus abgeleitet.

#### Nachgewiesener Bestand und Anschlussstellen

| Aufgabe | Vorhanden | Erforderliche Ergänzung |
| --- | --- | --- |
| Projekt | src/domain/project/schema.ts: striktes Schema 8, ein Geschoss; Wände, Fenster, Linien, Schraffuren | Referenztyp, Asset-Tabelle, eindeutige IDs und geprüfte Verweise |
| Datei | src/interop/project-file/load.ts: Migration 1–8; src/lib/bim/model.ts: serializeProject | Versionierte Migration und dauerhafte Bilddaten, kein gespeichertes blob: URL |
| History | src/lib/bim/history.ts: commitProject, Undo/Redo, 100 Snapshots, 10 MiB Dateileselimit | Atomarer Import; Kalibrierung nur Transformation, Asset nicht erneut dekodieren |
| Aktionen | src/application/hatches/actions.ts: snapshotgebundene Vorschau/Commit | Eigener Referenzadapter nach gleichem Vertrag; keine neue Logik im Workspace |
| Auswahl | src/application/selection/target.ts und state.ts; rendering/viewport/selection-shapes.ts | Typed reference-Ziel und abgeleitetes Viereck für Klick/Strg/Marquee |
| Ebenen | src/application/layers/actions.ts und visibility.ts | Referenzen bei Belegung, Zuweisung und Eligibility berücksichtigen |
| Eingabe/Fang | application/tools/interaction.ts, tools/snapping.ts, useToolInteraction | Verbraucher derselben Engine; kein eigener Fang oder Tab-Handler |
| Einheiten | src/core/units/metres.ts parst numerischen Metertext | Explizite Einheit für Kalibrierstrecke prüfen; vorhandene Befehlsparser gezielt abgleichen |
| IFC/3D | Vorhandene Wand-/Öffnungsexporte und Solids | Referenz bleibt 2D; kein Bildkörper oder IfcWall-Ersatz |

Es gibt aktuell weder Bild-Asset-Schema noch Referenzimport oder Kalibrieraktion.
DrawingDocument ist Architekturvertrag, noch kein persistenter Besitzer im Schema.
Die Typaufzählungen für Auswahl/Ebenen sind explizit: Ein neuer Typ muss dort
angebunden werden, aber nicht als Kopie der Interaktionsengine pro Werkzeug.

#### Vorgeschlagener Datenvertrag

Erster Umfang: statische PNG/JPEG-Bilder, keine SVGs, URLs, PDFs oder Animationen.
Ein StoreyReference gehört zunächst ausdrücklich zum vorhandenen Geschoss:
`id`, `kind: image-reference`, `layerId`, `assetId`, `origin: {x,y}` in Metern,
`rotation` in Radiant und positiver einheitlicher `metresPerPixel`.
Keine Scherung, Spiegelung oder unabhängige X/Y-Skalierung. Vorschlag für die
Ablage: storey.references, projektweite assets-Tabelle. Spätere Dokumentreferenzen
bekommen einen ausdrücklich validierten Scope, keine stillschweigende Übernahme.

ImageAsset: stabile ID, geprüfter MIME-Typ, positive ganzzahlige Pixelmaße und
Base64-Nutzdaten. Dateiname ist nur Anzeigeinformation, niemals ein Zugriffspfad.
Importadapter dekodiert lokal, prüft tatsächliches Format und Maße und normalisiert
JPEG-Orientierung einmal. Domain kennt keine DOM-Bilder oder Browser-Handles.
Renderer erzeugt flüchtige URLs/Bildobjekte und gibt sie beim Freigeben wieder frei.

Vorschlag Koordinaten: Bildpunkt (u,v) ab linker oberer Ecke entspricht
origin + R(rotation) * (metresPerPixel*u, -metresPerPixel*v).
Kontur und Trefferflächen werden aus genau dieser Transformation abgeleitet.
Importplatzierung fragt Breite in Metern ab; Pixel oder DPI werden nicht als
bereits bekannte reale Größe ausgegeben. Unkalibriert bleibt sichtbar erkennbar.

#### Dateigröße, Migration und Undo

Kleinster portabler Vorschlag: Bilddaten einmal in der Projekt-JSON einbetten.
Base64 vergrößert die Nutzdaten um etwa ein Drittel. Vor Import-Commit UND Export
die tatsächliche UTF-8-Größe einschließlich Metadaten gegen bestehende 10 MiB
prüfen. Keine Datei erzeugen, die derselbe Loader wegen ihrer Größe ablehnt.
Zusätzlich dekodierte Pixelzahl begrenzen, bevor großer Bildspeicher angelegt
wird. Konkretes Pixelbudget gehört in den Implementierungsauftrag mit Messung,
nicht als angebliche Nutzerentscheidung in diesen Vertrag.

Nächste freie Schema-Version zum Implementierungszeitpunkt wählen (derzeit 9).
Alte Dateien validieren und zu leeren assets/references migrieren. Fehlende oder
beschädigte Assets, kollidierende IDs, unbekannte Ebenen und ungültige Transformationen
atomar ablehnen. UI muss das bestehende Modell erhalten. Ältere Builds werden die
neue Version ablehnen; keine stillschweigende Entfernung von Referenzen.

Import fügt Asset und Referenz gemeinsam in einem History-Schritt hinzu. Abbruch
nach Dateiauswahl oder ein später Decoder-Callback nach Modellwechsel committen
nichts. Kalibrierung ändert nur Transformation; immutable Asset-Strings wiederverwenden.
Keine Canvas-Bitmaps in History. Speicherverhalten mit wiederholtem Undo prüfen,
bevor größere Bildlimits oder externe Asset-Pakete freigegeben werden.

#### Gemeinsamer Aktionsvertrag für die spätere Kalibrierung

Request bindet Projekt-ID, unveränderte Basisrevision, typed Ziel-ID, beide
Messpunkte im lokalen Bildraum sowie positive Ziellänge in Metern. UI hält die
explizite Eingabeeinheit fest; AI/Text/Voice darf keine fehlende Länge erraten.
Application löst den echten Zieltyp auf, prüft Berechtigung und Asset/Sichtbarkeit,
berechnet Vorschau und validiert beim Bestätigen erneut. Nur genau eine erlaubte
Referenz; gemischte oder BIM-Auswahl vollständig ablehnen, keine erste-ID-Abkürzung.
PNG/JPEG sind gemäß obiger Entscheidung erlaubt; unbekannte Typen bleiben gesperrt.

Für Weltpunkte p1/p2: d = Abstand(p1,p2), f = Ziellänge/d;
neuer Maßstab = alter Maßstab*f; neuer Ursprung = p1 + f*(alter Ursprung-p1).
Rotation bleibt gleich. Punkt p1 bleibt unverändert. Nullstrecke, nichtendliche
Werte, Überlauf und numerisch nicht darstellbare Geometrie werden abgewiesen.
Generische Mathematik gehört nach geometry/transforms, Berechtigungen nach
application/references, gespeicherte Regeln nach domain, Dateidekodierung nach interop.
Vorschlag API: previewReferenceCalibration(base,current,request) und
commitReferenceCalibration(history,base,request), mit einem Undo-Schritt.

Punktaufnahme und Hilfsanzeige konsumieren ToolInteraction und die vorhandene
Fang-Engine. Rasterpixel liefern keine echten Linien/Schnittpunkte. Anfangs nur
Rahmengeometrie als explizite Fangquelle; Bildinhalt wird visuell abgelesen.
On-Demand löst die Aktion aus; Eigenschaften bleiben in Werkzeugeigenschaften.
Text/Voice/AI müssen später denselben Request mit stabiler Zielrevision erstellen,
keine eigene Skalierung und keinen ungeprüften automatischen Commit.

#### Abnahmeplan

- Importiertes PNG/JPEG sichtbar, auswählbar, auf eine Ebene zugewiesen;
  ausgeblendete Ebene weder pickbar noch fangbar; belegte Ebene nicht löschbar.
- Datei speichern, Browser neu laden, Projekt öffnen: Bild und Transformation
  bleiben vorhanden, auch ohne ursprüngliche Quelldatei oder Blob-URL.
- Import abbrechen, ungültiges Bild, zu große Datei, fehlendes Asset, spätes
  Decoding nach Modellwechsel: keine Teiländerung; Undo/Redo atomar.
- Bekannte Strecke auf 5 m kalibrieren, p1 bleibt
  fest; gedrehtes Bild ebenso; Zoom ohne Maßänderung; JSON und Undo/Redo erhalten
  identische Transformation. Vorschau ist nicht der gespeicherte Zustand.
- Nullstrecke, negative/fehlende Einheit, NaN/Infinity, fremde Revision sowie
  BIM- und gemischte Ziele direkt über Application ablehnen.
- IFC der vorhandenen BIM-Elemente bleibt unverändert; kein Asset wird exportiert.

#### Genau ein nächster ausführbarer Auftrag

Persistenten Referenz-Datenkern implementieren, noch ohne Canvas-Importbedienung:
ImageAsset und StoreyReference mit PNG/JPEG-Whitelist, Transformation und
Verweisprüfung; Migration bisheriger Dateien; atomare Application-Erstellung
für bereits geprüfte Asset-Daten; Größenprüfung für lesbare Projektdateien;
Roundtrip-, Fehlereingaben- und History-Tests. Auswahltypen noch nicht als bedienbare
Funktion exponieren. Noch keine Kalibrieraktion; keine Bilddekodierung durch Domain.
Das schafft eine überprüfbare Grundlage für den anschließenden Importadapter,
ohne leere Klassen, zweite History oder komplette Dokumentarchitektur anzulegen.




### Detail D18 – docs/walls/CORNER_T_COMBINATION_PLAN.md

Herkunft: `docs/walls/CORNER_T_COMBINATION_PLAN.md`, Snapshot main/PR237. Altstatus nicht als aktuelle Fertigmeldung lesen.

#### Eck- und T-Anschluss an derselben Hauptwand

#### Umsetzungshinweis — 06.10.2026

Der nachfolgende Text bleibt als freigegebener Planungsnachweis erhalten.
Der entfernte T-Zulauf an einem Host mit genau einer rechtwinkligen Ecke ist
jetzt implementiert; die fruehere pauschale Sperre gilt dafuer nicht mehr.
Kontaktgrenzen und Eckpartner werden anhand der erhaltenen Kontur geprueft.
Schema 8 bleibt bestehen, da keine Datenfelder oder deren Interpretation wechseln;
aeltere Builds lehnen die neu erlaubte Kombination ab statt Relationen zu verlieren.

Nutzerentscheidung 06.10.2026, ersetzt den bisherigen Folgeauftrag: Keine eigene
Aktion zum gemeinsamen Verschieben eines Eckpunkts entwickeln. Der Nutzer will
beide betroffenen Waende auswaehlen und gemeinsam als ganze Elemente bewegen.
Mehrfachauswahl und Gruppenbewegung werden als naechster begrenzter Auftrag
zunaechst gegen den vorhandenen Stand geprueft. Einzelendpunktbewegung kann
weiterhin die Ecke loesen. Historische Aussagen unten zur gemeinsamen Eckaktion
sind damit ueberholt. Nachweise zur Ecke-T-Kombination stehen im DEVELOPMENT_PLAN.

#### Historischer Planungsstand

Stand: 06.10.2026. Planungsstand nach PR143, Basis main 3340195.
Dieser Auftrag implementiert keine neue Anschlussgeometrie. Die aktuelle Sperre bleibt bestehen.

#### Nachgewiesener Ist-Stand

- `src/domain/elements/wall/t-relations.ts`, `tConnectionContours`: lehnt jede
  T-Beteiligung einer Wand mit Eckanschluss ab; mehrere getrennte Ts an einem
  Host sind bereits erlaubt. Nebenwand darf nicht selbst Host oder doppelt T-gebunden sein.
- `src/domain/elements/wall/connections.ts`, `connectedWallContours`: setzt
  Eckkonturen endpunktweise zusammen, prüft Kontur und Eckfenster, übernimmt
  danach die T-Konturen mittels `contours.set(id, ring)`.
- `t-junction.ts`, `deriveRightAngleTJunction`: erzeugt für den Host eine volle
  rechteckige Körperkontur. Nur die Nebenwand erhält einen beschnittenen Abschluss.
  Bloßes Entfernen der Sperre würde daher die zuvor berechnete Host-Ecke ersetzen.
- `connectedWallSolids`, `lib/bim/geometry.ts` und `lib/bim/ifc.ts` verwenden die
  gemeinsamen abgeleiteten Konturen. `wall-plan-outline.ts` entfernt sichtbare
  Kontaktlinien nur zwischen gespeicherten, sichtbaren Partnern.
- `previewTConnection`, `connectWallAtTAxis`, `appendWallChain` und
  `previewWallChain` sind die vorhandenen Application-Einstiegspunkte.
  Schema 8 speichert Eck- und T-Relationen getrennt anhand stabiler IDs.

Lesender Modellversuch: die unten aufgeführten Wände H, E und N lassen sich
anlegen; H/E haben genau eine Eckrelation. Hinzufügen von T(H,N,Ende 1)
wirft die vorhandene Eckanschluss-Meldung. Serialisiertes Modell bleibt gleich.
Die abgeleitete H-Kontur vor T lautet:
`(-0.36,0), (6,0), (6,0.36), (0,0.36)`.
Dies ist ein Nachweis der heutigen Sperre, kein bestandener Kombinationstest.

#### Bestehende verbindliche Regeln

- Ein Bauteil bleibt ein Modellobjekt. Grundriss, 3D, Projektdatei und IFC lesen
  dieselben gespeicherten Relationen und daraus abgeleitete Konturen.
- Sichtbare, ausdrücklich gefangene Achsen liefern Anschlussabsicht. Keine neue
  Nachbarschaftssuche beim Laden und kein T allein aus numerisch gleichen Koordinaten.
- Einzelwandbewegung löst deren Verbindungen automatisch. Bestehende Regeln zur
  gemeinsamen Eckpunktbewegung bleiben erhalten. Beim Verlängern/Kürzen eines
  Hosts bleibt ein T-Anker am Weltpunkt; entfällt er, wird die T-Relation gelöst.
- Fenster dürfen T-Kontakte auf ihrer eigenen Wand überqueren. Sie dürfen weiterhin
  keinen schrägen Eckabschluss berühren/überschreiten. Kein Wechsel der Host-ID,
  keine automatische Öffnung in einer Nachbarwand.
- Gesamte Wandkette ist ein Undo-Schritt. Vorschau/Abbruch ändern weder Historie
  noch Projekt. AI/Text/Voice bleiben Adapter derselben geprüften Aktionen mit
  festem Zielkontext; keine separate Anschlusslogik.

#### Vorschlag für den ersten begrenzten Fall

Ein gerader Host hat einen vorhandenen rechtwinkligen Eckpartner an einem Ende
und einen rechtwinkligen T-Zulauf in seinem ungestörten Seitenbereich. Alle drei
Wände haben gleiche Stärke und Höhe. Vorhandene Achsversätze bleiben erhalten.
Die Nebenwand hat keine weitere Verbindung. Dieser Umfang ist ein technischer
Umsetzungsvorschlag; die bisherige Sperre wird erst durch einen Implementierungs-PR ersetzt.

Nicht Teil dieses ersten Falls: T-Nebenwand mit eigener Ecke, T und Ecke am selben
Knoten, T-Kontakt am Gehrungsbereich, beidseitig T-gebundene Nebenwand,
unterschiedliche Querschnitte, schräge T-Winkel, allgemeine Netz-/Boolean-Lösung.
Bereits funktionierende reine Eckketten und Mehrfach-Ts bleiben erhalten.

#### Kleiner Testgrundriss (Meter)

| ID | Achsanfang | Achsende | Stärke | Höhe | Körperversatz | Beziehung |
|---|---|---|---|---|---|---|
| H | (0,0) | (6,0) | 0.36 | 2.80 | +0.18 | Hauptwand |
| E | (0,0) | (0,3) | 0.36 | 2.80 | +0.18 | Ecke H/0–E/0 |
| N | (3,-3) | (3,0) | 0.36 | 2.80 | +0.18 | T auf H, N/1 |

Optionales Fenster F auf H: Breite 1.20, Höhe 1.20, Brüstung 0.90,
relative Position 0.5. Es liegt über dem T-Bereich und entfernt sich deutlich
von der Ecke. Die Koordinaten beschreiben einen Prüfaufbau, keine neue Nutzerpräferenz.
Varianten spiegeln N auf die andere Seite und drehen/verschieben den gesamten Aufbau;
H/E-Knoten bleibt jeweils unverändert. Keine bereits gültige Kombinations-Projektdatei
vortäuschen: der aktuelle Loader muss eine solche Relation weiterhin zurückweisen.

#### Technischer Umsetzungsvorschlag

1. Vorhandene Eckkonturen zuerst vollständig ableiten. Der Host behält diese
   Kontur; eine T-Relation darf sie nicht mit ihrem Rechteck überschreiben.
2. T-Kern für Nebenwandabschluss und Kontakt weiterhin verwenden. Kontakt nur
   zulassen, wenn seine volle Breite auf dem verbliebenen geraden Host-Seitenstück
   liegt und die Nebenwand den Eckkörper nicht überlappt. Achsanker im Segmentinneren
   allein genügt nicht. Abstand aus realen Konturen und vorhandenen Modelltoleranzen
   ableiten; kein erfundener fester Zentimeterabstand.
3. Kontakt am Endpunkt des Seitenstücks oder im Eckbereich im ersten Umfang
   ausdrücklich abweisen. Grund nennen und Vorschau/Commit gleich behandeln.
4. Finale zusammengesetzte Kontur einmal fachlich prüfen; Eckfensterprüfung darf
   durch das für T erlaubte Öffnungs-Clipping nicht umgangen werden.
5. Application-Aktionen und Zeichnungsvorschau wiederverwenden. Sonderfall nicht
   in BimPlan, Inspector, IFC oder Sprachadapter nachbauen. Cache bleibt snapshotgebunden.
6. Bestehende Relationsfelder voraussichtlich ausreichend. Vor Festlegung der
   Dateikompatibilität prüfen: alte Schema-8-Programme lehnen Kombinationen ab.
   Neue Dateien niemals beim Laden still reparieren. Versionsentscheidung im
   Implementierungs-PR ausdrücklich begründen; hier keine neue Version beschlossen.

#### Akzeptanzmatrix für die Umsetzung

| Fall | Erwartung |
|---|---|
| H/E zuerst, dann N per T-Fang | Ecke bleibt geometrisch identisch; N endet an richtiger Host-Seite |
| H/N zuerst, dann E | Gleiches Ergebnis, unabhängig von Erzeugungsreihenfolge |
| N von gegenüberliegender Seite; gedrehter Aufbau | Analoger Abschluss ohne Lücke/Überlappung |
| Kontakt nahe Gehrung, nur teilweise auf gerader Seite | Verständliche Ablehnung; kein Commit |
| Gleicher Knoten für Ecke und T | Ablehnung, kein automatischer Mehrfachknoten |
| Schräger T oder verschiedene Stärke/Höhe | Bestehende Ablehnung bleibt |
| Nebenwand mit Ecke oder zwei T-Enden | Weiterhin ausgeschlossen |
| F über T verschieben | Frei auf H; Eckgrenze bleibt wirksam |
| F berührt schrägen Eckabschluss | Ablehnung trotz T-Clipping |
| Host entlang Achse verlängern/kürzen | T-Weltanker bleibt; außerhalb liegender Anker löst sich |
| Ganze H oder N verschieben | Betroffene Verbindungen lösen nach bestehender Regel, übrige bleiben |
| Gemeinsame Ecke bewegen | Bestehende Eckaktion; alle betroffenen Ts atomar neu prüfen |
| Kombination kippt während Bearbeitung in nicht unterstützte Geometrie | Keine Teiländerung; Abbruch erhält Ausgangsprojekt |
| Vorschau und Platzierung | Identische Kontur für dasselbe Ziel; Entwurfs-ID ist nicht persistent |
| Undo/Redo, JSON-Roundtrip | Gleiche IDs/Relationen/Konturen, atomare Historie |
| Grundriss/3D/IFC | Gleiche Profile, geschlossene Körper, plausible Volumina, separate Bauteil-IDs |
| Ebene eines Partners ausgeblendet | Darstellungskontakt korrekt; gespeicherte Verbindung bleibt bestehen |
| Bestehende reine Ecke/reine Ts | Kein Verlust bereits nachgewiesener Abläufe |

#### Genau ein ausführbarer Folgeauftrag

Implementiere den beschriebenen entfernten rechtwinkligen T-Zulauf auf einer
Hauptwand mit genau einem rechtwinkligen Eckanschluss: Konturkomposition und
Kontaktprüfung in Domain/Geometry, Anschluss über vorhandene Application-Aktion,
zugehörige Matrixfälle als Regressionen, Build/Tests und praktische 2D-/3D-/IFC-Abnahme.
Keine Erweiterung auf die ausdrücklich ausgeschlossenen Topologien. Falls die
geometrische Prüfung neue Bedienentscheidungen erfordert, konkret dokumentieren
statt still neue Nutzerregeln zu erfinden.


#### Erweiterung 06.10.2026: zwei Ecken an der T-Hauptwand
Verbindlicher implementierter Stand: Beide Hostenden dürfen rechtwinklige
Eckanschlüsse besitzen. Die gemeinsame Prüfung berücksichtigt jeden Eckpartner
und die zusammengesetzte Hostkontur. Kontakt/Überlappung mit einem Eckpartner
bleibt verboten. Historische Begrenzungen auf genau einen Host-Eckanschluss
sind damit überholt; andere Topologiegrenzen bleiben bestehen. Kein Schemawechsel.




### Detail D19 – docs/walls/SELECTION_MOVE_PLAN.md

Herkunft: `docs/walls/SELECTION_MOVE_PLAN.md`, Snapshot main/PR237. Altstatus nicht als aktuelle Fertigmeldung lesen.

#### Gemeinsamer Auswahlbaustein und spaetere Gruppenbewegung

Stand 06.10.2026, gepruefte Basis main c8a205c (PR145 integriert).
Nutzerkorrektur ersetzt den vorherigen wandbezogenen Umsetzungsumfang von PR146.
Umgesetzt auf feat/shared-selection: allgemeine 2D-Auswahl fuer alle vorhandenen
Typen. Aktuelle Nachweise und Folgeauftrag stehen oben im DEVELOPMENT_PLAN.
Die Bestandsaufnahme unten beschreibt die Ausgangsbasis vor diesem Schritt.
Bedienregeln umgesetzt: Ctrl/Cmd toggelt, normaler Klick ersetzt, Leerklick leert;
Rahmen auf freier Flaeche im Auswahlmodus schliesst vollstaendige Konturen ein.
Update 06.10.2026: PR147 integriert. Gemeinsame freie Gruppenbewegung im Grundriss
implementiert; aktueller Nachweis und genau ein Folgeauftrag oben im DEVELOPMENT_PLAN.
Interne Ecken/Ts erhalten, externe loesen, Hostfenster folgen einmal. Fenster ohne
Host in der Auswahl werden fuer freie Gruppenbewegung abgewiesen. Maus und Zahlen
verwenden dieselbe Action/ToolInteraction. Ursprung ausdruecklich per Canvas-Klick.
Keine neue 3D-Auswahlgeste. Die nachstehenden Vorstudien bleiben als Historie erhalten.

#### Verbindliche Anforderungen

Die Auswahl ist ein gemeinsamer, werkzeugunabhaengiger Application-Baustein fuer
alle heutigen und zukuenftigen Elementtypen. Schon der erste 2D-Schritt umfasst
Waende, Fenster, Linien/offene und geschlossene Polylinien sowie Schraffuren,
einschliesslich gemischter Auswahlen. Spaetere Decken, Daecher, Treppen, Moebel usw.
liefern passende Treffergeometrie und Faehigkeiten, keine eigene Auswahlengine.

- Klick: einzelnes Element auswaehlen.
- Strg + Klick: Mehrfachauswahl. Cmd als macOS-Entsprechung bleibt ein Vorschlag.
- Mit der Maus einen rechteckigen Rahmen ziehen: enthaltene Elemente auswaehlen.
  Auswahl auf allen eingeblendeten Ebenen. Nutzerklaerung: aktiv bedeutet hier
  eingeblendet; kein zusaetzlicher Aktiv-/Sperrstatus.
- Keine eigene Aktion zum gemeinsamen Ziehen eines Eckpunkts. Spaeter stattdessen
  betroffene ganze Elemente gemeinsam auswaehlen und verschieben.

Die Auswahl darf nicht davon abhaengen, ob ein Element eine Bewegungsaktion
unterstuetzt. Eine gemischte Auswahl darf nicht still auf bewegliche Ziele oder
auf das erste Element reduziert werden. Auswahl und Modellbearbeitung sind
getrennte Faehigkeiten; Aktionen validieren ihre gesamte Zielmenge.

#### Nachgewiesener Stand

| Stelle | Befund und Konsequenz |
|---|---|
| `src/application/selection/target.ts`, `src/components/cad/bim-view.ts` | Ein `ElementTarget` oder null, keine Auswahlmenge. |
| `src/components/cad/CadWorkspace.tsx` | `requestedSelection` und `showSelection` ersetzen ein einzelnes Ziel; Auswahlanzahl ist 0 oder 1. |
| `src/components/cad/TopToolbar.tsx` | Window selection / Filter rufen `onAction` auf; Workspace bindet `showNotice`. Sichtbare Schaltflaechen sind keine implementierte Mehrfachauswahl. |
| `src/components/cad/BimPlan.tsx` | Picking liefert ein Ziel mit Ursprung/Griff; keine additive Auswahl. |
| `src/application/direct-edit/controller.ts` | Session bindet Basisprojekt und ein Ziel; Vorschau prueft dessen Aktualitaet. |
| `src/application/direct-edit/transforms.ts`, `src/lib/bim/model.ts` | `moveElement` bewegt eine Wand; `updateWall` mit intent move entfernt beteiligte Ts und gleicht Ecken danach ab. |
| `src/application/tools/interaction.ts`, `adapters.ts` | Wiederverwendbarer Vertrag fuer Ursprung, Fangregeln, Zahlenvorschau, Validierung, Commit und Abbruch. |
| `src/application/direct-edit/snapping.ts`, `src/application/tools/snapping.ts` | Bewegtes Ziel und Abhaengigkeiten aus Fangquellen ausschliessen; fuer eine Auswahlmenge auf alle bewegten IDs erweitern. Raeumlichen Index weiterverwenden. |
| `src/lib/bim/history.ts` | Ein vollstaendiger validierter Snapshot kann mit einem History-Schritt uebernommen werden. |

Lesender Modellversuch mit H/E/N aus corner-t-demo: nacheinander alle drei
Waende um (1,0) bewegen. Vorher 1 Ecke/1 T; danach 1 Ecke/0 T. Ausgangsprojekt
unveraendert. Somit darf Gruppenbewegung nicht als Schleife ueber Einzelbewegungen
implementiert werden: Zwischenzustaende loesen interne Beziehungen.
58 bestehende Tests fuer Direct Edit, ToolInteraction und Ecke/T bestanden.

#### Zustaendigkeiten und Wiederverwendung

`application/selection` verwaltet die einzige Auswahlmenge aus stabilen typisierten
Element-IDs: Ersetzen, Ergaenzen, Entfernen, Leeren, Aktualitaet und Berechtigung.
Canvas, Navigator, Eigenschaften, On-Demand-Menue und Text/Voice beziehen ihren
Zielkontext daraus. Keine einzelnen Auswahlzustandsautomaten je Zeichenwerkzeug.
Auswahl ist sitzungsbezogen und keine Modellkopie oder Modell-Undo-Aktion.

Rendering/Picking liefert Treffer mit derselben Projektion wie die sichtbare
Geometrie. Typadapter liefern lediglich Element-ID, Treffer-/Konturgeometrie und
unterstuetzte Aktionen. Fachunabhaengige Rahmen-/Geometriepruefung gehoert nach
Geometry/Rendering, nicht in Wall/Line/Hatch oder CadWorkspace. Ein gemeinsamer
Pointer-Ablauf steuert Klick, Modifier und Rahmenvorschau.

Die bestehende LayerVisibilityPolicy bildet die gemeinsame Sichtbarkeitspruefung.
Ein Fenster mit unsichtbarer Hostwand bleibt ausgeschlossen. Berechtigung wird
vor Trefferauswahl und erneut bei Uebernahme geprueft. Versteckte/geloeschte Ziele
werden aus der Auswahl entfernt; betroffene aktive Bearbeitung wird abgebrochen.
Die Nutzerklaerung setzt aktive Ebenen mit eingeblendeten Ebenen gleich; nicht
auf eine einzige Zeichenebene beschraenken und keinen Sperrstatus hinzufuegen.

Werkzeugunabhaengigkeit bedeutet gemeinsame Infrastruktur. Sie definiert noch
nicht, ob ein laufender Zeichenvorgang durch Klick/Rahmen abgebrochen, pausiert
oder weitergefuehrt wird. Auswahl-/Zeichen-/Pan-Ereignisse duerfen nicht gleichzeitig
wirken; diese Eingaberegel vor der Anbindung festlegen. Bestehende Shift-Fuehrung
und mittlere Maustaste fuer Pan erhalten.

#### Noch offene Details und Vorschlaege

- Ebenensemantik ist geklaert: alle eingeblendeten Ebenen. Bestehende
  bimVisibility.hiddenLayerIds und LayerVisibilityPolicy wiederverwenden.
- Rahmen: Aus "alles was darin ist" wird als Vorschlag vollstaendige geometrische
  Einschliessung abgeleitet, nicht bloss Bounding-Box-Ueberlappung. Teilberuehrung
  und eine richtungsabhaengige Crossing-Auswahl sind nicht beschlossen.
- Strg-Klick auf bereits ausgewaehltes Ziel: Entfernen als Vorschlag. Einfacher
  Klick ersetzt die Menge; Klick ins Leere leert sie. Rahmen ersetzt standardmaessig
  die Auswahl; additive Rahmenauswahl ist noch keine Nutzerentscheidung.
- Reihenfolge der Treffer bei Ueberlagerung sowie 3D-Verdeckung und 3D-Rahmen sind
  explizit fuer die spaetere Viewport-Anbindung festzulegen. Der erste Schritt ist
  2D; der Auswahlzustand bleibt ansichts- und werkzeugunabhaengig.

#### Akzeptanz des gemeinsamen Auswahlbausteins

1. Einzelklick, Strg-Klick und Rahmen funktionieren mit jedem bestehenden Typ und
   gemischten Mengen; Identitaeten sind stabil, mehrfach getroffene IDs nur einmal.
2. Sichtbare/aktive und ausgeblendete/inaktive Ebenen im selben Rahmen: nur erlaubte
   Elemente; ausgeblendete Hostwand schliesst Fenster aus. Statuswechsel bereinigt
   Auswahl und verwirft betroffene Bearbeitung ohne Modellmutation.
3. Rahmenrichtung, Zoom/Pan/Projektion, Randfaelle, kleine/duenne Elemente, offene
   Linien und geschlossene Flaechen pruefen. Auswahlvorschau und uebernommene Menge
   identisch; Abbruch/Escape hinterlaesst keine halbe Auswahltransaktion.
4. Auswahlmarkierung und Anzahl stimmen in Canvas/Navigator/Eigenschaften ueberein.
   Gruppenaktionen nie still auf erstes Ziel reduzieren; keine irrefuehrenden
   Einzelwerte oder Sprachbefehle bei mehreren Zielen.
5. Neue Elementtypen integrieren sich ueber Treffer-/Faehigkeitsadapter; zentrale
   Modifier-, Rahmen- und Ebenenregeln werden nicht pro Werkzeug kopiert.
6. Bestehendes Zeichnen, On-Demand, Fang-/Shift-/Tab-Verhalten sowie Modell-History
   bleiben unveraendert. Auswahl setzt keine Geometrie und erzeugt keinen Modell-Undo.

#### Spaeterer Verbraucher: Gruppenverschiebung

Erst nach diesem Auswahlbaustein folgt die gemeinsame Bewegung. ToolInteraction,
useToolInteraction, InteractionInput und Rasterengine bleiben gemeinsam. Alle
Ziele werden in einem Snapshot verschoben und zusammen validiert, nicht in einer
Schleife ueber Einzelbewegungen. Vorschlag: interne Wandanschluesse erhalten,
externe loesen, Fenster auf bewegten Hosts genau einmal mitfuehren. Ein gemeinsamer
Ursprung, Preview/Cancel, gepinnte Zielmenge und ein Undo-Schritt. Regeln fuer
beliebige gemischte Mengen separat pruefen; Auswahlbarkeit verspricht keine noch
nicht implementierte Gruppenaktion. Keine BIM-Skalierung.

#### Folgeauftrag nach Umsetzung der Auswahl

Gemeinsame freie Verschiebung als Verbraucher der zentralen Auswahlmenge gemaess
dem aktuellen DEVELOPMENT_PLAN umsetzen. Die Auswahl bleibt typunabhaengig;
Bewegungsfaehigkeiten und Host-Abhaengigkeiten werden von Aktionen validiert.




### Detail D20 – docs/walls/TWO_CORNER_T_ACCEPTANCE.md

Herkunft: `docs/walls/TWO_CORNER_T_ACCEPTANCE.md`, Snapshot main/PR237. Altstatus nicht als aktuelle Fertigmeldung lesen.

#### Abnahme: T-Hauptwand mit zwei Ecken

Erzeugen: `node --experimental-strip-types scripts/generate-two-corner-t-fixtures.mjs <Ausgabeordner>`.

Der Generator erzeugt ein Rechteck mit Achsmaßen 6 x 4 m, vier Eckanschlüssen,
einer 2-m-Nebenwand mittig an der Südwand und einem Fenster. Alle Wände:
0,36 m stark und 2,80 m hoch, mittige Achse. Fenster: 1,20 x 1,35 m,
Brüstung 0,90 m, Mitte 1,50 m ab Südwandanfang.

- before-t.project.json: fünf Wände, noch ohne T-Relation.
- two-corner-t.project.json: gleicher Aufbau mit expliziter T-Relation.
- two-corner-t.ifc: regulärer IFC4-Export des verbundenen Projekts.

#### Nachweis 06.10.2026

PR158 in main d2d3af9 integriert. Im Browser before-t geladen; zusätzliche Wand
mit dem Wandwerkzeug bei x=4 von y=2 zur Südwandachse gezeichnet und mit Enter
abgeschlossen. Die Hauptwandkontur hat danach die erwartete Unterbrechung an der
T-Kontaktfläche x=4 bis 4,36; keine Anzahl-Fehlermeldung. Fenster anschließend
über On-Demand „Fenster entlang Wand“ von Position 0,25 auf ca. 0,823 bewegt,
also über diesen T-Kontakt hinweg. Undo/Redo und 3D-Aufruf erfolgreich.
Der Browser-Prüfstand enthält diese zusätzliche sechste Wand; die ausgelieferte
IFC-Datei ist bewusst der reproduzierbare Fünfwand-Aufbau des Generators.

Save project meldete Erstellung/Download angefordert; der automatisierte Download-
Event lief in einen Timeout. Eine neue heruntergeladene Browserdatei konnte damit
nicht verifiziert werden. Projekt-Roundtrip ist durch bestehende Integrationstests
abgesichert. Das ist kein Nachweis eines fehlgeschlagenen manuellen Downloads.

IfcOpenShell 0.8.5: Schema ohne Meldungen; fünf IfcWall, ein IfcWindow; trianguliertes
Wandvolumen 21,41136 m³. Unabhängiger Sollwert: 20*0,36*2,80 +
1,82*0,36*2,80 - 1,20*1,35*0,36. Archicad selbst wurde nicht ausgeführt.

#### Praktische Archicad-Abnahme

IFC importieren. Vier geschlossene Ecken und mittigen T-Abschluss in 2D/3D prüfen.
Fenstermaße, Brüstung und Hostwand kontrollieren. Keine zusätzliche Trennfläche
oder Überlappung am T erwarten; die Öffnung liegt links vom T. Dateiformat bleibt
Schema 8; ältere NOVIKOV-Versionen können diese Kombination ablehnen.

#### Ergänzung: tatsächlicher Browser-Datei-Roundtrip 07.10.2026

Geprüfter Code: main 49f960e, unverändert gegenüber PR159.
Nach Serverneustart erzeugte Save project zunächst novikov-project (8).json
(07.10.2026 10:23:46, 1125 Bytes) für das Startmodell. Der Download-Event der
Browserautomation lief trotzdem nach zehn Sekunden ab. Die Dateierzeugung ist
somit unabhängig von diesem Automationssignal nachgewiesen.

Anschließend two-corner-t.project.json über Open project geladen und bestätigt.
Save project erzeugte novikov-project (9).json (10:24:27, 2076 Bytes). Beide
Dateien als JSON vollständig verglichen: identisch, einschließlich IDs,
Verbindungen, Fenster und Ebenensichtbarkeit. Danach Undo: Navigator wieder
beim Startmodell mit zwei Elementen. Tatsächlich heruntergeladene Datei (9)
über Open project geladen: Bestätigungsdialog erfolgreich, Meldung
„Projektdatei geladen“, fünf Wände und ein Fenster wieder im Navigator und Plan.
Screenshot lokal: outputs/two-corner-t/browser-roundtrip.png.

Die Lücke des Browser-Datei-Roundtrips ist damit geschlossen. Keine Anpassung an
Save project erforderlich. Der Timeout bleibt eine Einschränkung des verwendeten
Automationssignals. Dies ersetzt weiterhin keine Archicad-Abnahme.




### Vollständige Nutzer-Funktionsquelle vom 08.10.

Explizite neuere Präzisierungen (BIM-Skalierverbot, 2D-only Pickup, kein Pflichttraining, Maßstab und unabhängige Abbildfilter) im Masterplan haben Vorrang.

#### Funktionsquelle vom 8. Oktober 2026

Texttranskription der am 08.10.2026 hochgeladenen Datei `FUNKTIONEN 03.10.2026.docx`. Der Dateiname trägt weiterhin den 03.10.; die Quelle dieses Ergänzungsstands ist der Upload vom 08.10. Absätze entsprechen der DOCX-Reihenfolge; leere Absätze sind ausgelassen. Es wurde keine frühere DOCX-Version als Vergleich herangezogen.

SHA-256 der DOCX: `8b9ed3ff6a61952042093167382f7927fb4dc62f15ef92fa58533646a9fcd3e2`.

Die folgende Transkription bewahrt den Wortlaut. Bestehende Präzisierungen aus ARCHITECTURE.md gelten weiter, insbesondere das Skalierverbot für BIM/3D und die zusätzlich erlaubte PNG/JPEG-Kalibrierung. Die Einordnung und Reihenfolge steht in [der Entwicklungsabstimmung](../planning/DEVELOPMENT_ALIGNMENT_2026-10-08.md).

#### Absatz 1

Funktionen von NOVIKOV CAD:

basierend auf ein 3D Modell, aufgebaut als BIM soll diese Software im Grund komplexe geometrische Entwürfe herstellen, und sowohl als PDF-Pläne, 3D Modelle, oder IFC Modelle, DXF etc. exportieren können. Der Nutzer hat die Möglichkeit, das Design der 3D und 2D Darstellungen zu ändern (z.B. Darstellung der wände in Form von Schraffur oder Farbe), Die Fähigkeit, den Maßstab des Canvas zu ändern, so wie der Grundrisspläne, Schnitte, Ansichten etc.
Das Programm hat die Fähigkeit, Mittels Schnitt oder Ansichtswerkzeugen, entsprechende Schnitte bzw. Ansichten zu generieren und vom Model abzuleiten, als 2D Dokumente, welche ebenfalls bearbeitet werden können. Also alle zeichnungen, werden vom 3d Model abgeleitet.

#### Absatz 2

Die Rasterengine soll aber auch in 3D Fenster funktionieren. Denn das Modell kann auch in 3D bearbeitet werden. Dort käme zu den Rastern jegliche Hilfsflächen hinzu. (X Y Z achsen).

#### Absatz 4

Um die Entwicklung des 3D Modells zu vereinfachen, gibt es hochqualitative Rastersysteme und Hilflinien on demand, die sogenannte Rasterengine. Um die Bedienbarkeit weiterhin zu vereinfachen, wird ein „On Demand Menü“ hinzugefügt.
Dieses Menü popt im Canvas auf, sofern ein Element ausgewählt wird und lässt sich, wie bereits vorhanden - bewegen. Darin befinden sich die Buttons für die folgenden Funktionen:
1.Gesamtes Element bewegen 

#### Absatz 5

2.Einzelnen Punk erstellen und Bewegen [falls punkt an der Stelle vorhanden, dann lediglich Punkt bewegen] das ist sowie „linie Knicken“ geknickt kann eine Rechteckseite werden -> wird zu fünfeck. Oder eine Linie -> wird zu Linie mit knick

#### Absatz 6

3.verschieben/ Verbreitern einer ganzen Seite eines 2D Elements (Z.B. bei einem Rechteck, man wähle dir obere Kante, und verschiebt diese nach oben oder unten, dabei verändert sich die Höhe des Rechtecks. Diese Funktion ist bei jeglichen Seiten von Polygonen, Dreiecken, Rechtecken, etc. Für Linien kommt es selbstverständlich nicht zum Einsatz.

#### Absatz 7

Eine zuvor ausgewählte Funktion bleibt wird vorgemerkt, und beim nächsten Öffnen des Menüs bereits aktiv, sofern die ausgewählte Geometrie diese Funktion nutzen kann.

#### Absatz 9

Canvas hat einen Maßstab, Grundriss auch. Dieser kann in dem Leisten ganz unten geändert werden. Jegliche Wände, Schraffuren, Texte, Linien, Kreise, Möbeldarstellungen oder sonst welche Dinge sollen alle einer Ebene hinzugefügt werden. Die genannten Ebenen sollen mit Hilfe eines Ebenen Umschalters jederzeit sichtbar und unsichtbar geschaltet werden. Der Ebenen Umschalter erlaubt auch Funktionen wie „Alle außer diese Ebenen“ unsichtbar machen, oder eben andersrum. Außerdem sollen ALLE ebenen ausgeblendet und wieder eingeblendete werden können.


#### Absatz 10

Idealerweise lässt sich das Programm mit Hilfe einer AI sowie Spracheingabe bedienen. Dies soll der wichtigste Indikator der Software sein. Das Zeichnen von Wänden, hinzufügen von Türen, Fenstern, decken und Dächern, sowie das anschließende Vermaßen soll langfristig durch Spracheingabe oder Texteingabe zuverlässig funktionieren können.

#### Absatz 12

Das Modell wird einer Gebäudestruktur zugeordnet. Der Nutzer kann über den Navigator Anzahl der Geschosse frei erstellen, sowie die Höhenpunkte dieses Definierens. 

#### Absatz 13

Wände, Stützen, oder sonstige Bauteile, welche in der Höhe eines geschosses gebaut werden können, wissen somit die Geschosshöhe, des Geschosses, in dem Sie sich befinden. 

#### Absatz 14

Das Gesamte Programm ist zunächst auf Deutsch. Jegliche Einheiten in Metern.

#### Absatz 15

Es gibt ein Skallierwerkzeug, welches vorhandene Elemente anhand einer gezeichneten Linie in der Größe proportional skalieren lässt.

#### Absatz 16

Um komplexe 3D-Modelle erstellen zu können, werden Boolische Operationen eingefügt. Wände können nach beliebig geschnitten und ausgespart werden.

#### Absatz 17

Hochgeladene PDF-Dateien sollen in 2d Elemente zerlegt werden können.

#### Absatz 18

Anpassungen am Modell sollen entweder in 2D am Grundriss, in der Ansicht, im Schnitt, oder aber auch in 3D ausgeführt werden. (z.B. Verschieben der Wände, verschieben der Fenster, Löschen von Elementen, etc. 

#### Absatz 19

Raumwerkzeug zum Definieren von „Räumen“ innerhalb von geschlossenen oder teil umschlossenen Wandflächen. Räume haben die folgenden Eigenschaften: Namen, eindeutige ID (beginnend mit R-001), einem Namen, eine Fläche. 

#### Absatz 20

Das Raumwerkzeug erkennt die lichten Raumhöhen und erkennt die „Höhenlinien“, welche ebenfalls im Raumeigenschaften Fenster erstellt werden können. Die Höhenlinien erkennen „an dieser Stelle im Raum beträgt die Raumhöhe x,xx m“ Dabei können die beiden Messpunkte definiert werden. 

#### Absatz 21

Beispiel: Messpunkt 1: Oberkante Fußboden Dachgeschoss

#### Absatz 22

Messpunkt 2: Unterkante Dachschräge.

#### Absatz 23

Daraufhin kann die korrekte Wohnflächenberechnung inkl. Abzüge aufgestellt werden.

#### Absatz 25

Erkennen von Raumflächen, und daraus eine Wohnfläche nach Wo-FIV erstellen. (Türnischen, Schornsteinabzüge, Vorbauwände etc. korrekt beachten.) Erstellen eines Wohnflächenberichts nach einer Vorlage. PDF, Variablen: Geschossanzahl, Raumzahl, Name, Adresse. Darstellung eines Rechenweges.

#### Absatz 26

Hilfswerkzeug: Raum (Definition im gesonderten Punkt) (Raumwerkzeug: Zuordnung zur Ebene: Raum)

#### Absatz 28

2D-Tool, als Rechteck, Polygon, etc. welches für Design, Schraffur, Verzierung, etc. verwendet werden kann. (Zuordnung zur Ebene 2D-Ergänzungen)

#### Absatz 29

Eigenschaften: Farbe ja oder nein, Kontur ja oder nein, Farbe Deckkraft frei wählbar, oder anstelle Farbe Muster, wie z.B. Mauerwerksschraffur.

#### Absatz 31

Differenzieren jeglicher Zeichenwerkzeuge
1. Wandwerkzeug Auswahl -> öffnen der Funktionen im Eigenschaftenpanel: da kann ausgewählt werden wie dick eine wand ist, ob diese die Geschosshöhe, oder alternative Höhe aufweist (änderbar), ob diese eine Monolithische Wand ist, oder ob diese aus verschiedenen Schichten besteht (Schichten müssen auch auswählbar oder selbstherstellbar sein.)
Es kann auch ausgewählt werden, ob per Wandwerkzeug Auswahl nur eine Wand gezeichnet wird, oder ob dieses Werkzeug mit jedem Klick wände zeichnet, so lange bis mit einem doppelklick der Abschluss signalisiert wird.

#### Absatz 32

Wände, die einander berühren, z.B. Ecken oder „T“ Kreuzungen, müssen dementsprechend richtig dargestellt werden.

#### Absatz 33

Eine Jede Wand bekommt eine Hauptachse, an der Sich jeder wand ausrichtet. Diese Hauptachse kann von außen nach innen verlagert werden -> im Eigenschaftenmenü.

#### Absatz 35

Bemaßung: Wände, Fenster, alles kann und muss bemaßt werden können. Einn maßkettenwerkzeug wird, wenn es so weit ist, detailliert ausgearbeitet. (Zuordnung zur Ebene Bemaßung)

#### Absatz 37

Deckenwerkzeug: ebenfalls wie Wand, Aufbau aus schichten möglich, Auswahl Material und Darstellung, anpassen d. Höhe, stärke. Öffnung kann auch eingefügt werden, als Deckendurchbruch. (Zuordnung zur Ebene Decke)

#### Absatz 38

Textwerkzeug: Texte schreiben, Hochschreibweise für Zahlen, Farbauswahl, Größenauswahl, Schriftartauswahl, Fett, kursiv, Unterstrichen, Umrandung möglich inkl. Farbauswahl, Hintergrundfläche mit Farbauswahl. (Zuordnung zur Ebene Textelemente) 

#### Absatz 39

Filter: Das aktive Suchen von Elementen. Z.B auswählen aller Schraffuren, aller Wände, aller Decken, oder aller Schraffuren, welche die Farbe XX haben (Pipetten Werkzeug zur Auswahl ergänzen im Menü.

#### Absatz 41

ALLGEMEINES: Die Eigenschaftenleiste unterhalb des Menüs zeigt immer die Eigenschaften vom ausgewählten Werkzeug.

#### Absatz 42

Bedeutet: Ich wähle das Wandwerkzeug aus, und im genannten Menü erscheinen jegliche Eigenschaften, welche ich anpassen kann, bevor ich anfange zu zeichnen. Ebene, Stärke, Höhe, Material, Darstellung etc.
Dasselbe Menü erscheint auch, wenn ich eine bereits gezeichnete Wand anklicke, nur halt mit den Eigenschaften der spezifischen Wand.
Dieses wollen wir für alle Werkzeuge einführen. 

#### Absatz 43

Menü-Eigenschaftenleiste gehört den Werkzeugen!

#### Absatz 46

Allgemeine Steuerung:

#### Absatz 47

Es sollen Hotkeys eingeführt werden:
z.B.:	E -> ausgewähltes Element bewegen

#### Absatz 48

 	STRG+ E -> ausgewähltes Element kopieren + Bewegen

#### Absatz 49

	D-> ausgewähltes Element drehen

#### Absatz 50

	STRG+ D – ausgewähltes Element drehen.

#### Absatz 51

(Drehung erfolgt mit Hilfe des Raster engine, da wird ein kreis dargestellt, als Hilfe)

#### Absatz 54

Layouts:
Das Navigationsfensteer beinhaltet „Geschosse, Schnitte, Ansichten, 3D-Ansichten.

#### Absatz 55

Aus diesen Kann ein Abbild erstellt werden. Z.B kann ich Ein Abbild vom Geschoss erstellen, daraufhin wird in einem externen Abbildverzeichniss (Dargestellt ebenfalls im Navigator, nur in eigene Sektion, z.B. darunter) entsteht ein Abbild von Geschoss x. Dieses Abbild gilt als Ableitung, jedoch kann darin die darstellung der ebenen variabel geändert werden. Dieses Abbild ist keine Kopie vom Geschoss x. Es reagiert weiterhin auf jegliche Änderungen am Modell. Allerdings kann ich im Abbild Ebenen unabhängig aktivieren und deaktivieren, ohne dass dies Einfluss auf das Hauptmodell hat. 
Diese Funktion hat den Zweck, einen Abschnitt eines Geschosses zu erstellen, dort Extra ebenen auszufüllen wie Gestaltungen, textliche Anmerkungen etc., und den Plan für den Export vorzubereiten. 

Dieses Abbild erstellen, soll mit allen Geschossen, Schnitten und Ansichten möglich sein.

#### Absatz 57

Ein Abbild, kann später in die EXPORT Layouts eingefügt werden. Ein Exportlayout kann anhand eines Masterlayouts vorbereitet werden. A4, hochkant, querkamt, A3, A2, etc…

#### Absatz 58

Dazu kommt ein Plankopf, und dann kann dies exportiert werden. Die Layouts erhalten ebenfalls ein eigene Sektion im Navigator.

#### Absatz 60

Später wird es so sein: Ein Nutzer zeichnet in 2D, wechselt rüber zu 3D, und wechselt rüber in ein 2D Abbild. Hierfür muss die UI passen. 
Es wäre sinnvoll, wie bereits im UI vorgesehen, den Bildschirm spaltbar zu machen. Jedes der ausgewählten Fenster kann aktiviert werden und eine Zeichnung dem zugewiesen. Ein Ablauf könnte so sein: Doppelklick auf ein Canvasfenster -> Klick auf z.B. Erggeschossabbild -> im Canvasfenster 1 ist das Erdgeschoss. Im Anderen Fenster das 3D Model.

#### Absatz 62

Dachfunktion: Es soll in  ein Dach gezeichnet werden, welches in den Einstellungen voreingestellt oder live geändert werden kann. Beginntn vereinfacht mit einer Dachfläche. Später soll ein Walmdach hinzukommen.
Gaubenfunktion: Ähnlich wie Dach, in 2D angeordnet, in 3d dargestellt.

#### Absatz 64

In der Menüleiste kommen weitere Funktionen mit einem Piktogrammaritgen button hinzu: Maßwerkzeug. Damit können live messungen von Strecken oder Flächen oder winkeln getätigt werden. Punkt zu punkt misst Strecke, Punkt zu Puknkt zu Punkt erstellt eine temporäre fläche und zeigt die Fläche an.

AI: Ein Bereich in 3D oder 2D ansicht soll ausgewählt werden können, und ein „Skizzenpapier“ artiges Oveerlay erhalten. In diesem Skizzenpapier kann mit der maus skizziert und gezeichnet werden, gleichzeitig aber auch gesprochen und „gepromtet“ Das System soll erkennen, welche änderung an diesen Bereich gewünscht ist, und diese im Anschluss umändern. Diese funktion wird trainiert werden müssen.

3D-Schnitt – Live 3D Schnitt

#### Absatz 65

3D-First Person ansicht, bewegung mit WASD und Maus.

#### Absatz 66


Rechtsklick in 3D oder 2D - > Kopieren, einfügen, importieren, Spiegeln, Reihenfolge der Darstellung ändern.

Schneller doppelter Rechtsklick auf ein jegliches Element: Übernahme des Objekts, bzw. des Werkzeuges mit denselben Eigenschaften.

Schrauffurübersicht – Ein Bereich, in dem Schraffuren bearbeitet erstellt und hinzugefügt werden können.


Grundsätzlich: 
Die Werkzeuge haben die folgenden Eigenschaften: Ebenenzuordnung, breite, Höhe, Länge, Farbe, Kontur,  Geschosszuordnung. 
Wir werden später herauskristallisieren, welcher Eigenschaften durch die Werkzeuge gemeinsam geteilt werden. Die am meisten geteilten Eigenschaften werden in Eigenschaftenmenü d. Werkzeuge an erster Stelle angezeigt, absteigend.

Trimmen bzw. Beschneiden von 3D Objekten. Ähnlich wie  Boolisch Operationen, nur dass mit weniger input gearbeitet wird. Sinnvoll wenn eine Wand auf ein Satteldachzugeschnitten werden muss. 



### Frühe Anlage – nur nicht zurückgenommene Wünsche erhalten

Der Guide vom 02.10. ersetzt diese Anlage als Reihenfolgenquelle; keine erneute Anfrage nach dieser Datei nötig. N/Guide-F-Katalog enthält die fortgeltenden Wünsche.

```text
Geplante Funktionen
Allgemeine Funktionen
 
1.1
Wohnflächenberechnung automatisiert
Erkennen von Raumflächen, und daraus eine Wohnfläche nach Wo-FIV erstellen. (Türnischen, Schornsteinabzüge, Vorbauwände etc. korrekt beachten.) Erstellen eines Wohnflächenberichts nach einer Vorlage. PDF, Variablen: Geschossanzahl, Raumzahl, Name, Adresse. Darstellung eines Rechenweges.
Hilf
s
werkzeug: Raum (
D
efinition im gesonderten Punkt)
1.2
On Demand – Mov
e
able Men
ü
Ein Menü, welches in der Nähe des Cursors aufpoppt,
 (jedoch auch zur Seite bewegt werden kann, falls ungünstig aufgepoppt, und es bleibt bestehen, 
sobald ein Bauteil, 3D Element, 2D 
E
lement, oder sonstiges, geschaffenes Element an
g
eklickt wird
 und markiert bleibt.
Inhalt: 
Funktion: „gewählten punkt verschieben“
Funktion: „bewegen“
Funktion: „Info Anzeigen“
Funktion: „Strecken“ (eine Lange Seite eines Rechtecks, Schraffur, oder vom sonstigen Element in vorhandener Flucht variable bewegen“
1.3
Maßstableiste – unter den Canvas
Änderungen am Maßstab ermöglichen
1.4
Skalier-Werkzeug in der Menüleiste
Hochgeladene PDF-Elemente (oder sonstige Dateitypen) sollen skaliert werden können. Das Skalier-Werkzeug funktioniert wie folgt: 
Maßstabuntreue Zeichnung wird markiert.
Ein eingebettetes „linienwerkzeug als Supp-werkzeug zeichnet eine zu skalierende Linie ein, mittels anfangs und Endpunkt.
Es wird das „On Demand – Menü“ erscheinen, wo per Eingabe (oder auch AI Sprachbefehl) die neue Länge der soeben zeigten Linie abgefragt werden soll.
Die gesamte Zeichnung wird entsprechend der Linie skaliert.
1.5
Grid Funktion
Eine Gridfunktion, welche sich an vorhandene
Werkzeuge
Linienwerkzeug
Linienwerkzeug.
Erstell eine Linie (Punkt zu Punkt) (nicht in 3D Ansicht)
Eigenschaften des Werkzeugs: 
Voreinstellung, ob Linienwerkzeug, oder Polylinie erstellt werden soll. 
Farbe aus einer Farbpalette
Strichstärke 
Strichart (gestrichelt, Abbruchlinie etc.)
Raumwerkzeug
Definieren von „Räumen“ innerhalb von geschlossenen oder teil umschlossenen Wandflächen. Räume haben die folgenden Eigenschaften: Namen, eindeutige ID (beginnend mit R-001), einem Namen, eine Fläche. 
Das Raumwerkzeug erkennt die lichten Raumhöhen und erkennt die „Höhenlinien“, welche ebenfalls im Raumeigenschaften Fenster erstellt werden können. Die Höhenlinien erkennen „an dieser Stelle im Raum beträgt die 
R
aumhöhe x,xx m“ Dabei können die beiden Messpunkte definiert werden. 
Beispiel: Messpunkt 1: Oberkante Fu
ß
boden
 Dachgeschoss
Messpunkt 2: Unterkante Dachschräge.
Daraufhin kann die korrekte Wohnflächenberechnung inkl. Abzüge aufgestellt werden.
Schraffur Werkzeug
2D-Tool, welches für Design, Schraffur, Verzierung, etc. verwendet werden kann. 
Eigenschaften: Farbe ja oder nein, Kontur ja oder nein, Farbe Deckkraft frei wählbar, oder anstelle Farbe Muster, wie z.B. Mauerwerksschraffur.
 
Ebenen
Jedes Element bekommt eine eigene Ebene.
Ebenen sind: Außenwand, Innenwand, Dach, Decke, Fenster, Tür, Möblierung, Geländer, Gelände, 2D-Zeichnungen, Neutrale Ebene, Bemaßung
Wände liegen standartweise in der wandebene als außenwand.
2D-Linien, rechtecke, zeichnungen liegen standartweise in „2D-Zeichnungen“
Es die Elemente können aber beliebig anderen Ebenen zugeordnet werden. Neue Ebenen können hergestellt und erstellt werden.
Erstelle in de Menüleiste einen Punkt mit dem Namen „Organisation“ und 
darin ist der Unterpunkt Ebene zu öffnen. Dies erscheint als ein eigenes Fenster mit Darstellung der Ebenen. Inkl. Buttons für das herstellen neuer Ebenen und das Bearbeiten vorhandener Ebenen.
In der Menüleiste soll außerdem ein Ebenenumschalter als kleines Fenster dargestellt werden. Dort können ausgewählte ebenen Ausgeblendet oder angezeigt werden.
```

### Historische Roadmap – Kennungen nicht mit Guide-F verwechseln

Historische Reihenfolge/Status nicht mehr aktiv. Jede alte Tabellenanforderung bleibt suchbar, auch wenn der heutige Funktionsumfang darüber hinausgeht.

| ID  | Anforderung                                                                                                                                                                                                                             | Einordnung und Abhängigkeiten                                                                                                                       |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| F01 | Linienwerkzeug Punkt zu Punkt, nur 2D; Voreinstellung Linie oder Polylinie; Farbpalette, Strichstärke, Strichart einschließlich gestrichelt und Abbruchlinie                                                                            | Umgesetzt: 2D-Linie/Polylinie, Palette, Stiftbreite, Durchgezogen/Gestrichelt/Abbruchlinie, Auswahl, JSON und Undo/Redo; siehe src/lib/bim/LINES.md |
| F02 | On-Demand-Menü nahe Cursor beim Auswählen eines erzeugten 2D-/3D-/sonstigen Elements; verschiebbar und solange Auswahl besteht sichtbar                                                                                                 | Umgesetzt: Menü nahe Auswahlklick, mit Maus/Pfeiltasten verschiebbar, an Fensterränder begrenzt; stabile ID, Maße und Info für Wand/Fenster/Linie   |
| F03 | On-Demand-Aktionen: gewählten Punkt verschieben, bewegen, Info anzeigen und Strecken entlang vorhandener Flucht, etwa lange Rechteck-/Schraffurseite                                                                                    | Teilweise umgesetzt: direkte Punktgriffe, On-Demand-Bewegen/Strecken und Mausvorschau; ganze Seiten zurückgestellt, siehe STABILIZATION.md          |
| F04 | Maßstableiste unter Canvas mit Änderungsmöglichkeit                                                                                                                                                                                     | 2D-Kamera und definierter Modell-/Darstellungsmaßstab; Bildschirmzoom von Druckmaßstab unterscheiden                                                |
| F05 | Skalierwerkzeug für hochgeladene PDFs und weitere Referenzzeichnungen: Zeichnung wählen, Anfang/Ende einer bekannten Strecke markieren, neue Länge im On-Demand-Menü oder per Sprache angeben; gesamte Zeichnung proportional skalieren | Referenzimport, 2D-Auswahl und Transformationen; Dateitypen stufenweise festlegen                                                                   |
| F06 | Raumwerkzeug für geschlossene und teilweise umschlossene Wandflächen; eindeutige IDs ab R-001, Name, Fläche                                                                                                                             | Raumgrenzen/-topologie, bei offenen Grenzen nachvollziehbare Ergänzung; vorher Raum-/Geschossmodell ausbauen                                        |
| F07 | Lichte Raumhöhen und Höhenlinien; im Eigenschaftsfenster zwei Messbezüge definieren, z.B. Oberkante Fußboden Dachgeschoss bis Unterkante Dachschräge                                                                                    | Fußboden-/Dachgeometrie und Höhenbezüge; nicht aus dem jetzigen Wandkern ableiten oder schätzen                                                     |
| F08 | Automatische Wohnflächenberechnung nach WoFlV; Türnischen, Schornsteinabzüge, Vorbauwände und Höhenabzüge korrekt berücksichtigen                                                                                                       | Nach F06/F07; geltende Regeln gezielt recherchieren, nachvollziehbar implementieren und anhand fachlicher Beispiele prüfen                          |
| F09 | Wohnflächenbericht nach Vorlage als PDF, mit Rechenweg; Variablen Geschossanzahl, Raumzahl, Name und Adresse                                                                                                                            | Nach verlässlicher Berechnung; Berichtsvorlage und Eingabedaten erfassen                                                                            |
| F10 | 2D-Schraffurwerkzeug für Design/Verzierung; Farbe optional, Kontur optional, frei wählbare Deckkraft, Muster statt Farbe, z.B. Mauerwerk                                                                                                | Nach 2D-Polygon-/Polyliniengrundlage; Fläche, Stil und Transformation getrennt modellieren                                                          |

## 7. Quelleninventar und offene historische Prüfkandidaten

99 Markdown-Dateien aus einem konsistenten Repository-Snapshot, zusätzlich Anlagen und lokale frühere Guides. Dateihashes machen den zugrunde liegenden Stand nachvollziehbar. Einzelne Diagnosen/Annahmetests sind Evidenz, keine zusätzlichen aktiven Leitfäden. Keine Quelldatei gelöscht.

| Quelle | Rolle | SHA-256 des gelesenen Inhalts |
| --- | --- | --- |
| .lovable/plan/novikov-cad-frontend-prototype-2026-09-29.md | Guide/Regel/Funktionsquelle; zentral zugeordnet | `304bfcdeeceb778a6ec11438af515c99ca51482f4b14f4bdc3dc5a3c4df1538c` |
| AGENTS.md | Guide/Regel/Funktionsquelle; zentral zugeordnet | `3e569f9104b69b9172434f4e2d87b3228c526d08b040bc18d0d584584a51035a` |
| ARCHITECTURE.md | Guide/Regel/Funktionsquelle; zentral zugeordnet | `ad3ee4ffb059508c60a5af978ef4b8c2a45d48d7f80659ac89d821ee75ab9855` |
| DEVELOPMENT_GUIDE.md | Guide/Regel/Funktionsquelle; zentral zugeordnet | `84d55c51f07591b8ecb667295e125d47685a2f7d40c8d141ac91832306795dc0` |
| DEVELOPMENT_PLAN.md | Guide/Regel/Funktionsquelle; zentral zugeordnet | `e221b2d156ee3d5af2ff66bae49e3f6cf375300a0b1589ef0ab0227b55938654` |
| F13_HILFLINIENSYSTEM.md | Guide/Regel/Funktionsquelle; zentral zugeordnet | `d01e2109278d9cdf56f6bd6e662e03674161e0a744de40401f3f54f973b28703` |
| FEATURE_ROADMAP.md | Guide/Regel/Funktionsquelle; zentral zugeordnet | `e406699aa2afbe7b3730fa4fc45e5456e93b3e6332c0031a9ac90ce4cdd91aaa` |
| FUNCTION_REQUIREMENTS_2026-10-03.md | Guide/Regel/Funktionsquelle; zentral zugeordnet | `604714d6808e94f792655def583dad14ab0c7285678e2311d43879975a7f81b5` |
| GUIDE_BASELINE.md | Guide/Regel/Funktionsquelle; zentral zugeordnet | `8558b6e2c622b90386bc73af31d7b8f7b64b6cbf84a821a99080055a786a753d` |
| NOVIKOV_ARCHITEKTUR_REVIEW_UND_FUNKTIONSMAP.md | Guide/Regel/Funktionsquelle; zentral zugeordnet | `0b777dc0191168ed8406ac8135773c06ec0063002b8dff6fb3119b7900d971be` |
| NOVIKOV_FUNKTIONSARCHITEKTUR_2026-10-03.md | Guide/Regel/Funktionsquelle; zentral zugeordnet | `4f992519b16c6fe00fd5918308adff7099e86b31814e9fbe9ed045630091288b` |
| README.md | Guide/Regel/Funktionsquelle; zentral zugeordnet | `365563b6236d3a7b8f138e23c64be99c179225fed0c8f8d1f7476d2833749883` |
| STABILIZATION.md | Guide/Regel/Funktionsquelle; zentral zugeordnet | `69c7cd70aa28f83ee884b7795d8bf6eace80151b9e5456fbdf0f987436ac2729` |
| benchmarks/README.md | Diagnose-/Testevidenz | `ffdc2fa9be0d3687f6826189dbd7bb0b837dd7ce6b76daf87e551a288146ada8` |
| docs/3D_INTERACTION_CONTRACT.md | Guide/Regel/Funktionsquelle; zentral zugeordnet | `b45c3d90af6194488049f014803848fbfb181a2119daf7f66dcc3a6aaa088f79` |
| docs/3D_WORKPLANE_PLAN.md | Guide/Regel/Funktionsquelle; zentral zugeordnet | `128592b35fa4eef643959ebec1cf7f486eddbe2048c207db59aabd6065fefd48` |
| docs/AUTOMATIC_WALL_CONNECTIONS.md | Guide/Regel/Funktionsquelle; zentral zugeordnet | `ab5c6367d4c071c626d04dc46067170a022ca0a3da21c2a764a8571749853ef1` |
| docs/CONTOUR_EDGE_PERFORMANCE.md | Guide/Regel/Funktionsquelle; zentral zugeordnet | `2ef4317ee8c0301beb9f4183cb6b00af3d5456914e6efa8ee743b56821524e7d` |
| docs/CORNER_IFC_ACCEPTANCE.md | Guide/Regel/Funktionsquelle; zentral zugeordnet | `bee41e5e4e7be5a17d8889f6b821e39329b6956775325b83e4e5d54acc8d9e53` |
| docs/LAYER_CONTRACT.md | Guide/Regel/Funktionsquelle; zentral zugeordnet | `f5aab51a6959587bf697efec3c131229d7fe577d74ed6aa524d3efb4db7f0899` |
| docs/LAYER_VISIBILITY_PLAN.md | Guide/Regel/Funktionsquelle; zentral zugeordnet | `dd1208f5abbd703f68b11d6cac8f3f8ed75ce062699cbf9dffde2572d30005cb` |
| docs/LOCAL_SNAP_QUERY_PLAN.md | Guide/Regel/Funktionsquelle; zentral zugeordnet | `502d122271d20173e561f21eeb0bc679833f7fafa3cc9926c7642780ac6a49b4` |
| docs/PERSISTENT_T_RELATIONS.md | Guide/Regel/Funktionsquelle; zentral zugeordnet | `a718140109c7508ff532e07f24df919baf3ea2aaef712757639cfdf39ea77a1d` |
| docs/REFERENCE_SELECTION_PLAN.md | Guide/Regel/Funktionsquelle; zentral zugeordnet | `ef2acc729f61d82bc853a9e19566b3150ffdcebc1fb1298c9b1f31efcd10452a` |
| docs/T_IFC_ACCEPTANCE.md | Guide/Regel/Funktionsquelle; zentral zugeordnet | `df6ff37799ed1bf00f37743084a951a85f1fa7f39ff192149bb0f6842c889ce5` |
| docs/T_WALL_CONNECTION_PLAN.md | Guide/Regel/Funktionsquelle; zentral zugeordnet | `2b180d9d2922edccebac5c5c230b03679ac609ddb367508a88794de8171cde84` |
| docs/T_WINDOW_VALIDATION.md | Guide/Regel/Funktionsquelle; zentral zugeordnet | `0eeaaebd390225c9906429810f81f3602fa01c8d5a182e021170272367759ef6` |
| docs/WALL_CORNER_PLAN.md | Guide/Regel/Funktionsquelle; zentral zugeordnet | `04789c887283a3e7fb5065a574a383c17fe7781e696b861001abea9b7a0a4afd` |
| docs/acceptance/2026-10-04-parallel-workflow.md | Diagnose-/Testevidenz | `3ca6bec5b6e7a03f2433e61d7b924cddf4d4d7467c9075dc1525828c144da763` |
| docs/ai/AI_CAD_PRIMARY_VISION.md | Guide/Regel/Funktionsquelle; zentral zugeordnet | `7d1bb2e72b2c25dfb011c5e741f93b4be692ba1d1ba4c8dd707580d23beb66b1` |
| docs/ai/AI_FUTURE_VISION.md | Guide/Regel/Funktionsquelle; zentral zugeordnet | `dc2ba9ec6123692ffa7eef8c39cbfe35f35df52445bb0a2a2c8b8acecf3cce65` |
| docs/performance/A03_COMMIT_VALIDATION.md | Diagnose-/Testevidenz | `50e2e4af2b515c17c637252b2645aba5c515bdefed54ead19deb0f3ca6248bcf` |
| docs/performance/ACTIVE_MOVEMENT_PROFILE.md | Diagnose-/Testevidenz | `1b3b51ab0fb0843d7b13a050500b05c89775ec209783a6d1aae15d7c5e628a8f` |
| docs/performance/ARCHITECTURE_REVIEW_2026-10-07.md | Diagnose-/Testevidenz | `5a29d2383faa2e2af2b5c6636801fa4c8839f1c3f193e0af6ad3b88c471ed6d8` |
| docs/performance/ASSET_INGRESS.md | Diagnose-/Testevidenz | `82d5781d7540b33d2be19fe1bd0f8c1c67d459c6e3e6148b082ef866af8bfe05` |
| docs/performance/ATOMIC_SELECTION_CONFIRMATION.md | Diagnose-/Testevidenz | `8da980c785d291e26b2b7269c7cf6282936395f874261b4efa53c0d583e842e8` |
| docs/performance/CAPACITY_BASELINE.md | Diagnose-/Testevidenz | `a33fa2e4c361eabcff7c63ba18fbc8102fa84ce80d52b58b0a34e8bdbf63e45b` |
| docs/performance/COMMIT_PHASE_PROFILE.md | Diagnose-/Testevidenz | `fd6c4abc3fdaf5bcf35c54b7834360289ec8b7eea8e54149719b647992a51dcd` |
| docs/performance/CONNECTED_WALLS_PROFILE.md | Diagnose-/Testevidenz | `3b60dc92471de05656ffb32461f36fa33beb2ed333c8b592cb092bbdc0b41ad8` |
| docs/performance/DENSE_SNAPPING.md | Diagnose-/Testevidenz | `ffe92fd0fbf9f68089d7a118c48c13a2894f2e32c7775b2ae868b45f6ea5aa1b` |
| docs/performance/IMAGE_URL_REUSE.md | Diagnose-/Testevidenz | `0a8795ffa03aa7992841c77770fb9c550aaca3b42c4be876a7ae560b170f5c98` |
| docs/performance/LARGE_PLAN_BOUNDS.md | Diagnose-/Testevidenz | `9ebb224f3253e22c87914053532db217532ed2cab77a077cec6071c282e80bf8` |
| docs/performance/LOCAL_INTEGRATION.md | Diagnose-/Testevidenz | `07c987860553c319b84e82d2b2fc7a3dee1c35c65e73bf0880c00e87dd5eaee3` |
| docs/performance/LOCAL_PROXIMITY.md | Diagnose-/Testevidenz | `2e19514a0c6b61d740a0e2e80944e6332c7e7ad53df49b3411c59a5f67bfe14a` |
| docs/performance/LOCAL_SOURCES.md | Diagnose-/Testevidenz | `c5fb0f4ac76fc72abcbff76a09b2c345f8ff6483d225830f8ee527fe03d8f6a7` |
| docs/performance/MANUAL_MOVEMENT_TRACE.md | Diagnose-/Testevidenz | `7d03c2ae1237de232f6f550bc0f09022353e728e19279472817bbb462c856bfb` |
| docs/performance/MODEL_ASSET_CONTRACT.md | Diagnose-/Testevidenz | `73e65eb26bbd55d70797c185de4daf463e8115df02d305e752670ea853f28454` |
| docs/performance/MODEL_COMPARISON.md | Diagnose-/Testevidenz | `ebf6940d0c4a324712f14b8e1c61b96af3d10937de271b8a46eda5db4a6b3944` |
| docs/performance/P0_BROWSER_BASELINE.md | Diagnose-/Testevidenz | `e4a9db058a54a382e2692495cddebe7ccc20b7ad13cca5578f28a18d1dbebf04` |
| docs/performance/PREPARED_CHAIN_CORNER.md | Diagnose-/Testevidenz | `f92dae6c23735dce2150633503bf907b9d8e63434205219292455b7f1c08c118` |
| docs/performance/PREPARED_CHAIN_MOVE.md | Diagnose-/Testevidenz | `4ae85240c7610e92998f2b2f4055156b0d0d9c4572f68c169cdbebe972d9ff00` |
| docs/performance/PREPARED_ENDPOINT_PILOT.md | Diagnose-/Testevidenz | `258508a9062aabf5d51e61c4b4e3510bbf6c5591eea7d806c774a08fe677a4d5` |
| docs/performance/PREPARED_SELECTION_PREVIEW.md | Diagnose-/Testevidenz | `59f3252e0ff7c195a17643a6f5765fa1086df99cc3c4f36444c27701d8c7cc74` |
| docs/performance/PREPARED_WALL_DRAWING.md | Diagnose-/Testevidenz | `4cea62874dd6a5e045c758b42be1b8934a4dbc33daf00138279cc68e8d6b754d` |
| docs/performance/PROJECTED_PICKING_PILOT.md | Diagnose-/Testevidenz | `f4d83457ecad877627cb2f43e643960b6bedbbf2928c5a1c16ac065604a72f61` |
| docs/performance/SELECTION_EXTRUSION_AB.md | Diagnose-/Testevidenz | `f16f3a6831155fb3538d7a0b867207140c2e02449c406cb934555a61dfd19042` |
| docs/performance/SELECTION_PREVIEW_REUSE.md | Diagnose-/Testevidenz | `1aff34219dd6ec9da9405565e579e27b59aa200e1d1c42f25045ace8142fda22` |
| docs/performance/SELECTION_SCALE_PROFILE.md | Diagnose-/Testevidenz | `976a7710bb723cacfe84ef7022ef205d258e281aafc7d2257a2d3eba3bd3a8c1` |
| docs/performance/SESSION_WALL_EXTRUSION.md | Diagnose-/Testevidenz | `7796eeff58b57b993bfc14d405e5d54d90b4ac0248a38909772f4c9d5c5ba4fe` |
| docs/performance/SHARED_CHAIN_CORNER.md | Diagnose-/Testevidenz | `b967e84c9367a8819b0e3f10664406fb4802de0036eaca48cfb5c351e5199fb7` |
| docs/performance/SHARED_CHAIN_MOVE.md | Diagnose-/Testevidenz | `dac3b7c98eb10ce5003610b76719dcb3a61a3b1a7efc2117a4e3a8d79032be78` |
| docs/performance/SHARED_ENDPOINT_PREVIEW.md | Diagnose-/Testevidenz | `f648f7a03f6e5f1df9bc031287f842bfe635e76296af2317ddd3a8c9feee8905` |
| docs/performance/SHARED_SOLID_PICKING.md | Diagnose-/Testevidenz | `840fea65ce5056f5a7d72513ff9f76b21531b34ccda4fa1e431f0c20308280b9` |
| docs/performance/SHARED_WALL_DRAWING.md | Diagnose-/Testevidenz | `2f9dbf85141bea0025937f34b90b22535e46d318ef280fa9e8604f4ea85b187d` |
| docs/performance/SHIFT_REPEAT_INPUT.md | Diagnose-/Testevidenz | `2d50b991dedc43441102ff80f7f24b7d24106967a5b821891dc12e1b7d8546fd` |
| docs/performance/SHIFT_SELECTION_DIAGNOSIS.md | Diagnose-/Testevidenz | `e4c2d82db28484197128a48c1911c5d8f14082f2b891b64bccd2dde5b1e74800` |
| docs/performance/SINGLE_WALL_SHARED_MOVE.md | Diagnose-/Testevidenz | `16a67ff28bcbea316cdefd51388f33e6cba14b1e1b07940bd488263330c75610` |
| docs/performance/SNAP_BASELINE.md | Diagnose-/Testevidenz | `e4c5cefd77884004fbf970f6b590a4e077e4f542a7a8eae6e2f403729e3437e0` |
| docs/performance/SNAP_DENSITY.md | Diagnose-/Testevidenz | `fb7660ebc7c4c156529a1dbd327f58d28370b24103889de56c005f192ea273eb` |
| docs/performance/SOLID_CAMERA_PROFILE.md | Diagnose-/Testevidenz | `7fe746c6568e75de9d6ea4d47c1007be16ac4f2bfc11bf29174ce8cb1b061c71` |
| docs/performance/SOLID_LIFECYCLE_PILOT.md | Diagnose-/Testevidenz | `50542ece21c2c4b78b599a501005d29e5707792f5a5289c75d7e1bd0c2f55b8b` |
| docs/performance/SOLID_MATRIX_PILOT.md | Diagnose-/Testevidenz | `b62f17e62efa7f8f750ac671b7478220c0f594df3630ea31dfb272da97ee25d2` |
| docs/performance/SOLID_RENDERER_INTEGRATION.md | Diagnose-/Testevidenz | `5f21fe1f0454016eca0d75b56dddacd2a5c438114ef13ca3000d80f67a834f10` |
| docs/performance/VALIDATED_ASSET_HANDLES.md | Diagnose-/Testevidenz | `1ee83d5725247b9c23df2ffea858b62756f9c4fa6df3e67cb72bdf801ecf3b79` |
| docs/performance/WALL_DRAWING_PROFILE.md | Diagnose-/Testevidenz | `686405a8107efd64e1ce241cd6e9b1574e2243f1ed688d30dcb317c9972d9557` |
| docs/performance/WALL_ENDPOINT_PROFILE.md | Diagnose-/Testevidenz | `7ed973b082a139843fdf6352dcc54801594c5ece213fa78bf3bf1f461b76def5` |
| docs/performance/WORLD_PICKING_PILOT.md | Diagnose-/Testevidenz | `7d1808e76964bee9be9781c994bbdd5bb86850b14dd397f744d0c26db6b914d4` |
| docs/planning/DEVELOPMENT_ALIGNMENT_2026-10-08.md | Guide/Regel/Funktionsquelle; zentral zugeordnet | `239d021acf7ceb210bc40d4834bf4a2dd23cddbb9e2ff86bed0c10060d427ab9` |
| docs/planning/HATCH_PAPER_SCALE.md | Guide/Regel/Funktionsquelle; zentral zugeordnet | `b53f1bfd2ba6dbbb86d17f2cb2e2b2d67b008a3794062ff65121a111d6eb3e15` |
| docs/planning/HATCH_PATTERN_LIBRARY.md | Guide/Regel/Funktionsquelle; zentral zugeordnet | `8b4311e4cab5709c78ff6b4f30cdfefee0510133699e42dd151f5537567b23be` |
| docs/planning/HATCH_PRESET_PICKUP.md | Guide/Regel/Funktionsquelle; zentral zugeordnet | `bff36ed5a2547db5cc2a545ac9022e0ec600aa6709eb350673139e252960d1a6` |
| docs/planning/SAVED_DRAWING_VIEWS.md | Guide/Regel/Funktionsquelle; zentral zugeordnet | `9f2e41a7a97a8e8d5da3b81647bb8b27423329d396b80e50291941d9787d4a14` |
| docs/planning/VIEW_SCALE_CONTRACT.md | Guide/Regel/Funktionsquelle; zentral zugeordnet | `0dcdc68d9e5d9e9d98cffb17f18a976d20d59660e576581381784a72ea6b0dfe` |
| docs/references/IMAGE_REFERENCE_PLAN.md | Guide/Regel/Funktionsquelle; zentral zugeordnet | `6916dfe68f74585c6a185f354c0b5450ed721a525e2972a539a46dc404e40c12` |
| docs/requirements/FUNKTIONEN_2026-10-08_SOURCE.md | Guide/Regel/Funktionsquelle; zentral zugeordnet | `9e5d6460cd2c03100bd6b3ac80cf423b091b29ec26cfe001250126be7272c14d` |
| docs/validation/HATCH_CONSTRUCTION_MODES.md | Diagnose-/Testevidenz | `d25511f19aab082282c171fe4789c9c877d5dbcac5473560d8215db0f4425bb9` |
| docs/validation/LIVE_ANGLE_MEASUREMENT.md | Diagnose-/Testevidenz | `6783e991438838a794ad5f0a43a4b62dbe2c6e097f93b9d8cd66c93b78688481` |
| docs/validation/LIVE_AREA_MEASUREMENT.md | Diagnose-/Testevidenz | `ee810c4a679cdbd1791fbe9e45a34146be3d8a9f55fc67275480b622ac86fa4b` |
| docs/validation/LIVE_DISTANCE_MEASUREMENT.md | Diagnose-/Testevidenz | `4c4765a39f329779b3b038fc099be47af2e9bb7399c3e8007246d2948c577990` |
| docs/walls/CORNER_T_COMBINATION_PLAN.md | Guide/Regel/Funktionsquelle; zentral zugeordnet | `4f2957b75957359f97eb3e99dfa818011421fe654643d8fc311a68dd94e70b8c` |
| docs/walls/SELECTION_MOVE_PLAN.md | Guide/Regel/Funktionsquelle; zentral zugeordnet | `e5dec4b83e74bee60bf769f1ac0793c732ecc33b097be0f7775c2814f75f20de` |
| docs/walls/TWO_CORNER_T_ACCEPTANCE.md | Guide/Regel/Funktionsquelle; zentral zugeordnet | `14283bd6a9e790b01dbef95e1eb5098ab67b16a51f3a6c98201f0e048b5fd17c` |
| src/components/cad/BIM_UI.md | Guide/Regel/Funktionsquelle; zentral zugeordnet | `b7912759a1f13f95336dae487359e66dadc4144ebc5d4ce7735ac8841d0eab80` |
| src/lib/bim/COMMANDS.md | Guide/Regel/Funktionsquelle; zentral zugeordnet | `1a4ff6190583433862a7ee07d355e068ac39d3ca111e71f8170fae2cfdaf236e` |
| src/lib/bim/IFC.md | Guide/Regel/Funktionsquelle; zentral zugeordnet | `bd8e96fbec05e9a460dc9ba3df51fae908bc284c8b5fdf905198489cbaa693a1` |
| src/lib/bim/LINES.md | Guide/Regel/Funktionsquelle; zentral zugeordnet | `722e2b2b28b98d9917fe34fcfd730d66608da22e091ab0f459419e3c4c13e21e` |
| src/lib/bim/PROJECT_FILES.md | Guide/Regel/Funktionsquelle; zentral zugeordnet | `a02fc92cb017a8b882c5196c1e90ff997f25355dc4e554c833d28bf05c23ad2c` |
| src/lib/bim/README.md | Guide/Regel/Funktionsquelle; zentral zugeordnet | `ad405208ec953b5c201e540b65ecc4b3db14ce5021cdc21878e94a87a5cd3052` |
| src/routes/README.md | Guide/Regel/Funktionsquelle; zentral zugeordnet | `2486f50763c31c0cfe0f7282bba9a14a7e2c031988dfc0c8df5f88b9e172b736` |


### Erhaltene Prüfkandidaten aus übrigen Quellen

Diese Liste schützt vor Verlust kleiner offener Aufgaben in Diagnose-/Historienquellen. **Sie ist keine aktive To-do-Reihenfolge und kein Beweis, dass der Punkt heute noch offen ist.** Vor Auswahl gegen neuere Implementierung prüfen. Fertige Arbeit nicht erneut starten. Originale Folgeaufträge innerhalb alter Texte bleiben historisch. K-IDs/R26/A-Regeln übernehmen aktive fachliche Aufgaben; weitere Befunde erst bei aktuellem Profil konkretisieren.


#### Herkunft: AGENTS.md

Status: historische ungeordnete Prüfkandidaten, gegen zentrale aktuelle Einträge abzugleichen.


**Q0001**

- `ARCHITECTURE.md` is the architectural source of truth for NOVIKOV CAD. Read it before architecture-sensitive implementation work and follow its dependency rules, migration policy and layer responsibilities.
- Before choosing the next task, read `docs/planning/DEVELOPMENT_ALIGNMENT_2026-10-08.md` and its source transcript `docs/requirements/FUNKTIONEN_2026-10-08_SOURCE.md`. The user requested this updated coordination on 2026-10-08. It supplements N01–N60 and AI01–AI35 with V01–V09 and supersedes older next-task wording for the covered priorities. Respect already completed/current PR evidence; do not restart the A/B study or treat the prepared preview as unimplemented. Keep one bounded implementation task active and update DEVELOPMENT_PLAN.md with evidence and the next step.
- For view/output-scale work, read `docs/planning/VIEW_SCALE_CONTRACT.md`. User decisions of 2026-10-09: the working 2D canvas has a scale selector beside Zoom, initially 1:100; future model-linked DrawingDocuments have independent selectable scales; text, dimensions and numeric annotations expose model versus paper sizing. Internal paper lengths use metres, UI paper sizes use millimetres. Semantic view contexts own output scale; screen panes reference them and own independent zoom. Preserve the BIM/3D scaling prohibition. MS-01/02 and persisted working scale MS-03 are implemented. Scale is stored outside model Undo/Redo. Follow the latest single task in `DEVELOPMENT_PLAN.md`; hatch integration must reuse this context/resolver.
- Read `DEVELOPMENT_GUIDE.md` (user guide dated 2026-10-02) before planning work. It replaces the earlier user attachment `0.Where it all Begins` as the requirements and sequence source. `DEVELOPMENT_PLAN.md` records the verified progress and next bounded task against this guide. Guide stage numbers and F01–F29 IDs differ from historical numbering; always qualify old references. Feature-specific specifications such as `F13_HILFLINIENSYSTEM.md` define detailed behaviour but must not override the architectural boundaries in `ARCHITECTURE.md` unless an explicit architecture decision updates that document.
- **Primary product vision (user decision 2026-10-10):** Read `docs/ai/AI_CAD_PRIMARY_VISION.md` before choosing architecture for new CAD capabilities. NOVIKOV CAD aims for autonomous, speech-driven design of complex buildings from site data, gross building volumes, storeys, rooms and source-backed Bebauungsplan analysis. Every new domain capability should be accessible through a typed validated Application action or structured query where applicable; the AI must reuse the same model rules as manual UI. Preserve multi-step planning, sources/uncertainty, preview/diff and bounded acceptance without making the language model a second geometry engine. This is the top-level product direction, not a claim of implementation or an instruction to abandon the current bounded task in DEVELOPMENT_PLAN.md.
- Future AI/CAD requirements supplied by the user are indexed in `docs/ai/AI_FUTURE_VISION.md`; the unchanged source is `docs/ai/CAD_BIM_2026_AI_Strategie.pdf`. Read them when planning or implementing AI features. Treat AI01–AI35 as future requirements, not completed capabilities or an instruction to replace the current next task. Keep shared validated Application actions, preview/acceptance/undo and the existing BIM scaling prohibition. The original PDF's provider claims and example thresholds must be rechecked for the concrete implementation.
- Preserve the validated Stage-1 workflow and migrate incrementally. Do not perform broad rewrites merely to match the target folder structure.
- `src/lib/bim` is a transitional location for the existing BIM vertical slice, not the permanent home for every CAD subsystem. Generic geometry, snapping, guides, constraints, tool runtime, transactions and similar reusable infrastructure must be placed according to `ARCHITECTURE.md` instead of automatically being added under `src/lib/bim`.
- `CadWorkspace` may coordinate layout and ephemeral presentation state, but it must not continue growing into the permanent owner of project/domain logic. Authoritative project state, committed selection, edit history and model-changing operations belong behind application/domain boundaries as described in `ARCHITECTURE.md`.
- Target platforms are Windows and macOS. Browser versus installable desktop delivery remains undecided. Keep the project format, CAD/domain logic and validated Application actions reusable across both; isolate filesystem, storage, dialogs and OS integration behind appropriate adapters. Account for Ctrl/Command and mouse/trackpad input without inventing gestures. Do not select a desktop framework, minimum OS/browser version, offline scope or packaging strategy without a concrete follow-up decision. See ARCHITECTURE.md, Platform targets and delivery decision.
- Define CAD tools and viewport layouts as typed data so future tool and BIM additions do not require restructuring the shell.
- Selected-element context is authoritative for text, AI and voice commands: clicking a component binds commands to its stable ID, never its list position or a guessed nearby element. Show the target, pin it for each voice session and reject stale context when selection/model changes. Direct 3D wall selection, 2D and Navigator selection feed the shared context.
- All model-changing interaction paths — mouse tools, properties, direct edit, text commands, AI and voice — must converge on shared validated application/model operations rather than implementing separate mutation logic.
- 2D, 3D, properties, project files and IFC must derive from the same authoritative model state. Do not introduce parallel editable representations of the same project entities.
- Rendering data is derived and disposable. React components, SVG/WebGL/CSS representations and renderer meshes must never become the authoritative BIM model.
- Reuse generic geometry and constraint services across tools. Do not implement separate snapping, projection, intersection or inference logic independently inside Wall, Line, Slab or future tools.
- `FEATURE_ROADMAP.md` is a historical record, not the active sequence. Do not consult or request updates to the superseded `0.Where it all Begins` attachment. Preserve explicit conversation requirements not withdrawn by the user, including 3D selection outlines and speech-recognition improvements; map them during guide Stage 0.
- Put all selected-element properties in the fixed Werkzeugeigenschaften bar below the main toolbar. The Navigator is for project structure/selection. Open contextual movement actions automatically near the pointer on element/point selection and avoid duplicating property fields there; new element types must use the shared properties bar.


**Q0002**

- Every interactive movement must immediately pin the chosen point as a shared construction origin: point/element movement, stretch and axis actions alike. New element adapters must participate in the same snapping/inference pipeline; do not make origin activation a per-tool opt-in. Preserve explicit host/axis constraints and the user Snap toggle. See ARCHITECTURE.md, Universal movement origin.


**Q0003**

- New precision-input consumers must use the ToolInteraction contract and shared useToolInteraction/InteractionInput lifecycle. Keep element-specific validation in application/domain adapters; do not add numeric preview switches or per-tool form/Tab handlers to CadWorkspace or BimPlan. Preserve existing geometric snapping services.


#### Herkunft: ARCHITECTURE.md

Status: historische ungeordnete Prüfkandidaten, gegen zentrale aktuelle Einträge abzugleichen.


**Q0004**

Technical direction, not an implemented paper-mode feature: model metres, output
scale 1:S and camera CSS pixels/metre remain separate. A rendering context supplies
the effective finite positive S; it is never inferred from camera zoom. Existing
DrawingDocument/Layout scale ownership remains binding; storage/history/defaults
for the raw working view are now clarified by the user's PR230 review answers:
the semantic view context owns S, while ViewportBinding routes a pane to it.
Panes own independent cameras, never independent copies of the same context's S.
Working contexts start at 1:100; the selector sits beside Zoom. Future persistence
is per semantic context within the project; history semantics are now fixed: working scale stays outside model Undo/Redo.
All internal lengths, including paper sizes, use metres. UI paper-size fields use
millimetres with an explicit boundary conversion, never an ambiguous unitless value.
Paper hatch applications will specify a paper cell width in metres. A shared
rendering resolver derives uniform factor paperWidth * S / definition.width;
legacy model applications retain factor 1; explicit application widths may override it (MS-03a below). Origin stays in model coordinates, rotation
and creator orientation are preserved, and contour/model geometry never scales.
Missing scale for paper rendering must be explicit, not silently replaced by 1:1.
Screen stroke conversion must account for the tile factor; physical print pens
remain undecided. Definitions and repeat lines are not copied into model entities.
The next MS-01 pilot establishes the shared context/resolver and session-local
selector without changing production schema 14 or enabling paper hatch properties.
V07k follows as its hatch consumer within MS-02, not a separate scale implementation.
See [general contract](docs/planning/VIEW_SCALE_CONTRACT.md) and
[hatch-specific acceptance](docs/planning/HATCH_PAPER_SCALE.md).


**Q0005**

Implemented: domain/views identifies the existing semantic working plan by project
and storey, not pane index. Application/views owns immutable session scale changes
and strict 1:S input parsing. ViewportManager hosts the session above pane lifetimes;
all panes bound to that plan read the same ScaleContext, retaining separate cameras.
The active 2D pane exposes the selector beside Zoom. No storage/model-history write
occurs; reload starts at 1:100. rendering/viewport/display-size resolves explicit
model/paper metric sizes and separate screen metrics, rejecting invalid contexts
and non-positive/non-finite results. Product hatches remain model-space; MS-02 will
consume this resolver rather than introduce another one. Production schema stays 14.


**Q0006**

User decision: opened CAD windows follow the Ebenen palette: draggable, no
background dimming, Glass Flow styling. FloatingPanel owns the shared shell,
header pointer/keyboard movement, viewport clamping, close and scoped Escape.
Window contents own their application/draft actions and validation. Existing
layer, line creator, hatch creator, display settings, connection preview and
project-load confirmation use this shell. New CAD windows must reuse it rather
than copying drag logic or introducing a modal overlay.


**Q0007**

User clarification: Tools > Linien Creator manages line styles for line tools,
independently of Tools > Schraffurenverwaltung and its area-pattern creator.
Line-style library version 2 stores named, colored segment structures in a local
one-dimensional repeat period, plus an inventory of at most ten distinct existing
style IDs. Version 1 dash/gap definitions migrate to segments on load without a
write. Built-in library entries can now be edited/deleted by explicit user request;
deletions persist and remove inventory references atomically in the same payload.
The drawing editor uses shared querySnap and transient draft state. Storage and
validation remain behind Application and a replaceable adapter. Browser
storage is profile/origin-local across projects, not cross-device synchronization.
User decisions (2026-10-09): custom line patterns use model-space sizing;
deleting a catalog style preserves existing lines. Schema 10 therefore stores an
owned validated pattern definition and repeatLength in metres with each custom
line application. These are immutable application snapshots, not extra editable
vertices. Schema 1–9 files migrate at the file boundary; legacy appearance stays
unchanged. Drawing, inspector and 2D pickup share the same appearance contract.
Inventory changes update shared UI subscriptions; renderer derives SVG tiles with
continuous phase around polyline vertices and no repeat-count geometry allocation.
Global catalog edits affect future explicit style assignments; cross-project
propagation for line styles is not implemented by this snapshot pilot. Hatch
update-all semantics remain the separately agreed future requirement.


**Q0008**

Pattern definitions and contour applications are distinct. Repetition and clipping
are derived rendering data, never duplicated editable project lines. Creator drafts
have a local drawing context and use shared geometry/snapping and Application
validation. User decisions (2026-10-08): library is global across projects;
hatch applications offer model-space or paper-space spacing in tool properties;
editing a pattern updates all applications of that pattern. The spacing mode
belongs to the application, not the reusable definition. Pattern identity must
remain stable across updates. Import format remains undecided. Persistence and
cross-project synchronization use platform adapters and validated Application
actions; React does not own the library. Embedded project definitions, revisions,
offline resolution and update/undo policy remain technical proposals, not yet
implemented decisions. Paper-space rendering needs an explicit view scale.
See [requirements, proposals and next task](docs/planning/HATCH_PATTERN_LIBRARY.md).


**Q0009**

The user's clarified contract supersedes V06a: rapid double-secondary-click on an
existing visible element activates its tool and copies its creation defaults,
INCLUDING layer. There is no pickup toolbar button or menu command. Geometry,
identity and connections are excluded. Each supported type declares its fields;
a shared gesture and Application capability boundary serve all adapters.
Defaults remain editable in Werkzeugeigenschaften before drawing. Pickup itself
never mutates the source or model history. Creation uses existing validated actions.
The first implemented adapter is hatch: fill, background, contour, layer. All four
construction modes use the same defaults. Window pickup now copies width, height,
sill height and layer through that same boundary (2D). Host and position are chosen
afresh by the existing validated placement action. Line/polyline pickup now uses
the same boundary for color, pen width, style and layer (2D). The current drawing
mode is retained; source vertices and identity are excluded. Wall pickup (2D) now
shares that boundary for thickness, height, body offset and layer. These defaults
are owned and pinned when a chain begins, feeding both prepared and full preview
paths and final creation; source joins/windows/endpoints are excluded.
Other element adapters remain future work. The user explicitly excluded 3D
pickup on 2026-10-08: tool-default pickup is a 2D-only workflow.
[Contract and evidence](docs/planning/HATCH_PRESET_PICKUP.md).


**Q0010**

The rendering/viewport world index is derived disposable data bound to immutable
visible surface/window identities. Camera and selection changes reuse it. The
React adapter owns cancellation and lifetime only. Cooperative preparation must
retain the existing full scan until ready; previews and identity mismatches use
that same fallback. Displayed-projection validity and footpoint priority remain
with BimSolidView. No second editable model or per-tool picking implementation.
See [evidence and limits](docs/performance/SHARED_SOLID_PICKING.md).


**Q0011**

BimSolidView delegates GPU resources to rendering/viewport/solid-renderer.
Camera matrices derive from the shared orthographic projection. Display snapshot,
local origin and selection changes invalidate buffers; camera changes retain them.
Canvas alone owns context-loss/restoration and displayed-projection validity.
CPU picking, stable model IDs and validated model actions remain unchanged.
The old renderer is retained only as a diagnostic oracle under benchmarks.
See [integration evidence](docs/performance/SOLID_RENDERER_INTEGRATION.md).


**Q0012**

The shared asset schema may preserve an asset only when its exact object identity
was registered after full storage validation and freezing of an owned copy.
Caller IDs, hashes, frozen flags and deserialized/cloned objects confer no trust.
All project geometry/reference checks and file-size/undo rules remain mandatory.
PNG/JPEG import and schema-9 project loading now issue fresh handles (K02c).
File storage validation is not a claim of full image decoding at project load.
See [pilot evidence and limits](docs/performance/VALIDATED_ASSET_HANDLES.md).


**Q0013**

Stable logical asset IDs and immutable payload identity are separate concerns.
Shared Application actions and authoritative geometry remain the only mutation
boundary. Commit validation and atomic undo remain mandatory. Reusing payload
verification requires an immutable, trusted handle; it must never trust arbitrary
caller-supplied hashes or skip geometry/reference validation.


**Q0014**

The [K02 contract and measurements](docs/performance/MODEL_ASSET_CONTRACT.md)
define an isolated versioned experiment. Pool layout, portable container,
retention/GC and budgets are proposals, not a production schema migration.
Schema 9, current limits, history and rendering remain unchanged.


**Q0015**

Preserve the prepared shared action boundary. Transient measurement/sketch
overlays and camera/section-display state are distinct from model edits.
A permanent cut is a validated domain operation; its dependency on a roof must
be decided before implementation. Saved views/documents/layouts retain the
existing shared-model and annotation-scope contract. Common properties use
capabilities without imposing every field on every element type.
AI/Text/Voice use the same typed actions and revision-bound preview/acceptance.
BIM scaling remains forbidden; existing allowed 2D and PDF/PNG/JPEG reference
calibration is unchanged. No new renderer, language, storage technology or
desktop packaging is selected by this planning update.


**Q0016**

Prepared selection translation may retain one derived local extrusion per pinned
wall in its dependency closure. Reuse requires unchanged serialized local profile,
height, opening rectangles and clipping policy; no new tolerance or ID-only trust.
Every target still derives/checks connection contours and world coordinates, checks
foreign endpoints and window rules. Stationary neighbours remain in the closure.
The cache is private to the prepared session and exposes fresh world-space output;
public derivation and full confirmation/history validation remain independent.
See [evidence and limits](docs/performance/SESSION_WALL_EXTRUSION.md).


**Q0017**

ToolInteraction may supply `confirm` for an atomic validated publication. The
shared confirmInteraction calls it exclusively; adapters without it retain the
validate/commit sequence. Atomic confirmation must check pinned context, derive
and fully validate the final model afresh, and publish through the guarded
history boundary. This is not a trusted-preview bypass or a cache of validation.
The selection translation adapter is the first consumer: it shares one function
between atomic confirm and direct commit. Explicit validate remains available
for compatibility; normal mouse/numeric confirmation materializes only once.
History still validates independently, and the UI's latest-context publication
guard remains unchanged. Text/voice keep using the same full selection action.
Other adapters are not migrated by this change.


**Q0018**

This section sets the direction for A-04 and supersedes the proposed next
base64-schema cache in the historical development log. The
[architecture review](docs/performance/ARCHITECTURE_REVIEW_2026-10-07.md) records
code evidence, reproducible diagnostics, alternatives and the single next pilot.
Existing product rules and the dependency direction UI → Application → Domain →
Geometry/Core remain binding.


**Q0019**

Tool-specific settings, properties and option hints belong exclusively in the
Werkzeugeigenschaften area, not the top application toolbar. TopToolbar has no
active-tool option model; global project/view/layer controls remain there.


**Q0020**

`application/drawing/window-placement.ts` derives host/relative position from a
visible physical wall body and uses existing `addWindow` validation for preview
and commit. `useWindowPlacement` binds immutable project/visibility and a stable
new ID; `useToolInteraction` and the generic plan placement binding own interaction.
The shared snap resolver receives the host's physical longitudinal axis. This
creation starts without a pinned movement origin or polar input; ToolInteraction
accepts an unanchored ToolSnapPolicy, while movement adapters explicitly retain
AnchoredToolInteraction. Existing movement-origin requirements are unchanged.
Draft window rendering uses its actual layer and host visibility, never a fake
committed entity. New selection requests accompanying a model commit are validated
against that new snapshot; ordinary clicks still validate the current snapshot.
No project schema change. Initial placement uses the existing 1.20 x 1.35 m window
with 0.90 m sill as defaults; one click commits once, Escape discards. Properties remain shared.
The placement hook retains editable width/height/sill text for the current workspace
session. Application parses metre values (decimal comma or point) and applies the
same dimensions through preview and addWindow. Each immutable draft revision binds
a new interaction; old preview/commit callbacks reject a changed revision. Invalid
or incomplete fields cannot fall back to earlier valid dimensions. These tool
preferences do not mutate existing entities or create model history/file fields.


**Q0021**

Window centre bounds are derived once per action by the shared domain wall/window-range
function, used by both placement and movement. Pointer/precision targets beyond
those bounds are capped before validated addWindow/updateWindow. Bounds include
corner seams with numerical clearance and deliberately ignore T junctions. Invalid
sizes and unavailable hosts remain errors; model validation is not relaxed.


**Q0022**

User requirement: selection is a tool-independent Application capability for all
current and future element types, including mixed sets. Support click, Ctrl-click
and rectangular marquee. User clarification: active means visible; all shown layers
are eligible. Reuse existing visibility policy, including hidden-host exclusion for
windows. Do not introduce a separate activation/lock state for this requirement.


**Q0023**

Application owns one typed stable-ID selection set and eligibility rules. Viewport
adapters supply projected hit geometry; common picking/marquee logic and pointer
handling are reused, not reimplemented per tool. Selection capability is independent
of movement support. Actions validate the full pinned target set; never silently
act on just its first member. Properties, Navigator, On-Demand and AI/Text/Voice
consume the same context. A selected host does not implicitly select its windows;
future transformations must account for dependencies without double movement.


**Q0024**

Implemented first delivery: shared 2D selection for walls, windows, lines/polylines
and hatches, including mixed sets. `application/selection/state.ts` owns typed-ID
transitions, eligibility and the model-bound index. `useElementSelection` binds
that state to React; renderers and Navigator consume it. Only a singleton supplies
a legacy action/AI target. No first-item fallback for mixed sets.
`planSelectionShapes` supplies disposable contours; `enclosedTargets` applies full
rectangle containment to all vertices (including boundary), independently of type.
`useSelectionMarquee` owns the pointer gesture. Click replaces, Ctrl/Cmd-click
toggles, empty click clears; a frame replaces. Start the frame on empty canvas in
Select mode, after 3 CSS pixels of movement. Drawing, editing, reference selection
and navigation retain precedence. Escape/pointer cancellation/model or visibility
change cancel the frame; selection creates no model history.
3D wall surface and foot-anchor clicks now forward Ctrl/Cmd to the same selection
transition as the plan. Existing depth/visibility and drag-vs-click gates remain.
Selected wall outlines share the central set; no separate 3D selection store.
`rendering/viewport/window-selection.ts` derives opening hit rectangles on the
physical wall centre plane and outlines on both opening rims. These are disposable
selection geometry, not glazing or exported model material. Windows and wall
surfaces compete in the same projected depth space; hidden windows/hosts are
excluded. A visible opening now targets its window instead of a wall behind it.
The adapter returns the same typed targets for plain and Ctrl/Cmd selection.
No 3D marquee or group-movement gesture is added.
Implemented consumer: `application/selection/move.ts` pins a complete typed target
set and base project, translates one proposed snapshot, then validates it once per
proposal. Internal corner/T relations survive; relations crossing the selected-wall
boundary detach. Host windows retain relative parameters and follow exactly once.
A selected window without its host rejects the complete free translation. No new
joins are inferred, no scaling or file-schema change is introduced.
`useSelectionMove` binds the session and checks current context again at commit.
`ToolInteraction`, shared polar input and snap policies own precision and inference;
the viewport's generic placement binding only supplies pointer intent and displays
the returned preview. Exclude moving entities and hosted windows from snap sources,
pin the chosen origin immediately. Context changes and cancellation discard the
preview; commit creates one model history entry. First delivery is 2D. Text/Voice
must consume this same validated action with pinned whole-selection context, never
fall back to a single target. See the [selection plan](docs/walls/SELECTION_MOVE_PLAN.md).


**Q0025**

`application/commands/selection-command.ts` adapts a bounded translation grammar
to the shared selection-movement action and polar service. The UI supplies the full
typed selection, immutable base and visibility policy. Textual previews disclose
all targets and relationship effects; they never mutate the model. Acceptance
checks context again and reruns the validated action rather than trusting editable
preview geometry. Singleton legacy commands use the same context gate; mixed sets
never fall back to their first element. Pure vector translation uses a neutral
coordinate origin, not an inferred element anchor. This does not alter the pinned
origin rule for interactive pointer movement. `selection-voice.ts` now binds browser recognition to an immutable context revision
containing the complete selection, project and visibility policy. UI cleanup aborts
on revision changes; callback-time revision checks reject late results before
cleanup as well. Returning to the same IDs is still a new revision. Recognition
only supplies normalized text and the shared command preview, never a commit.
Invalid transcripts remain editable; explicit acceptance retains action validation.
The existing browser recognition lifecycle supplies timeout, cancellation and errors.


**Q0026**

A host may combine exactly one right-angle corner with remote perpendicular T
contacts. The incoming wall must have no corner and cannot also be a host or
have a second T. Existing equal cross-section and T-overlap checks still apply.
`connectedWallContours` retains composed corner profiles. `validateCornerTContact`
checks the full contact against the actual remaining longitudinal side and rejects
contact with the corner partner. No fixed clearance margin is introduced.
Corner-window validation runs before T opening clipping; crossing a T does not
permit crossing a miter. All interaction and export paths share this derivation.


**Q0027**

Schema 8 is retained: relation fields, units, identity and interpretation are
unchanged; this extends admissible topology. Older builds reject mixed files
under their stricter validation. Loading never deletes relations to make them
fit an older implementation. Existing schema-8 files remain valid.


**Q0028**

Correction to the planning assumption: current single-endpoint edits detach an
end join when endpoints cease to coincide; no shared corner-move action exists.
User decision (2026-10-06): a dedicated joint corner-move action is not wanted.
The intended workflow is to select both affected walls and translate the selected
whole elements together. Do not implicitly move an unselected neighbour.
Selection-set translation must reuse the shared interaction pipeline and atomic
history; its implementation and connection handling still require verification.
Individual whole-wall translation retains its existing automatic-detachment rule.
See [combination plan](docs/walls/CORNER_T_COMBINATION_PLAN.md).


**Q0029**

ToolInteraction may expose previewProject for a disposable model snapshot. The
wall adapter uses previewWallChain/appendWallChain for both that snapshot and
confirmation validation. BimPlan only renders the returned model or reports the
Application error. Numeric targets carry no hover candidate, matching commit.
Draft wall visibility follows its assigned layer; committed picking, snap sources
and history remain bound to the authoritative project. New draft IDs are never
added to that project. Invalid targets retain already accepted draft segments,
show the precise validation error and do not display an invalid body. The current
slice is the 2D plan; shared 3D drawing preview is not introduced here.


**Q0030**

Wall drawing reuses Application findTAxisReference/queryTAxisSnap and
connectWallAtTAxis with direct editing. The plan carries the exact candidate
through ToolInteraction validation and appendWallChain. Numeric input discards
mouse intent. Only finishWallChain commits history; cancel discards the draft.
The current slice ends a new segment on an existing visible host axis. A chain
ending at a T must be finished before drawing again; corner/T combinations
remain unsupported. Starting on a host axis does not yet create a T relation.


**Q0031**

Binding user clarification: windows stay on their original wall and ignore T
contacts while moving. This supersedes the earlier overlap prohibition for T
openings only. Original wall-axis extent, dimensions and opening-overlap rules
remain; corner rules are unchanged. Moving a window neither transfers its host
nor cuts a neighbouring wall. Geometric contact reports remain diagnostic.


**Q0032**

Binding decision following the user's multi-side T workflow: a host may have
multiple right-angle incoming walls on either side, including opposite branches
at the same axis point. This supersedes the disjoint-pair restriction below.
An incoming wall may have only one T relation and may not also act as a host.
Corner/T combinations and differing cross-sections remain unsupported. Same-side
contact intervals must not overlap; all window/contact checks remain mandatory.
Schema 8 fields are unchanged; validation accepts this broader topology. Existing
files retain their exact relations. Earlier builds may reject new multi-T files.
An endpoint already participating in a T is excluded from automatic corner
acquisition, preventing a false corner between opposite incoming branches.


**Q0033**

Rendering wallPlanOutlines removes coincident contact strokes only between
persisted, visible partners using the authoritative derived contours. It does
not discover relations from proximity or merge BIM entities. Hiding a partner
restores the remaining wall's cap. Fill is uniform; selection uses a subtle neutral exposed contour (1.25 CSS px).
Turquoise is reserved for the authoritative drawing axis and its handles (2.5 CSS px axis). Separate hit geometry, stable IDs and IFC entities
remain intact. This is a ground-plan display rule, not a solid boolean union.
The existing temporary pair-preview overlay remains separately outlined.


**Q0034**

Application t-axis-snap derives an endpoint target from nearby eligible axis
segments supplied by the shared source query. It projects the fixed opposite
endpoint onto the host axis for the supported right-angle T; the target must be
inside the segment and within the CSS snap radius. Ambiguous hosts produce no
connection intent; existing reference selection can restrict sources. No global
wall-pair search, no inference of a connection from a numeric coordinate alone.
Only axis-endpoint point/stretch interactions participate in this first slice.


**Q0035**

ToolInteraction carries an optional SnapCandidate through shared validation and
commit. previewEdit combines the endpoint edit with the existing T Application
action, with the same pinned session/model and one history commit. Plan preview
and mouse confirmation pass the same candidate; numeric overrides discard it.
Explicit axes/held Shift remain authoritative. Viewport capability
includeInteractionTargets keeps 3D unmodified until its target transport is
integrated; it is a generic carrier, not geometry logic in the renderer.
The existing isolated/equal-cross-section/right-angle relation limits still apply.


**Q0036**

Shift now latches the acquired construction direction for the current interaction,
not the nearest angle on every pointer movement. Application createShiftSnapLock
owns the transient origin/direction; useShiftSnapLock supplies shared keyboard
press/release/blur lifecycle for plan and 3D workplane adapters. Existing explicit
edit axes and host restrictions still win. Recognised oblique guides can be held;
otherwise the first direction uses the existing 45-degree acquisition. Exact
compatible snap targets remain eligible along the held axis. Releasing Shift
permits recalibration; a new interaction/reset discards the latch; view zoom does
not. This state is neither project data nor model history.


**Q0037**

Application t-connections provides snapshot-bound preview/commit connect and
disconnect actions, stable IDs and one model-history transaction. Future mouse,
text and voice adapters use this boundary, never a second relation model.
Direct-edit translation passes explicit move intent through updateWall and
removes a participating T without moving its neighbour or rediscovering joins.
Reshaping retains a relation while the incoming world anchor remains on the host
interior; otherwise it detaches. An end shortened exactly to the anchor does not
silently become a corner. Invalid remaining contact geometry rejects atomically.
Windows may touch T contact but cannot overlap it, including hidden windows.
No automatic T creation or additional UI workflow is introduced in this slice.


**Q0038**

Domain t-pair owns inspection and solid derivation from resolved Wall parameters,
endpoint index and schema-valid windows from one snapshot. It has no runtime
Project/schema validation dependency. Internal project validation may call this
kernel after structural/identity checks; it must enforce relation eligibility.
Public resolveIsolatedTPair validates/copies the full Project and resolves stable
IDs and the current isolated-pair restriction. inspectTOpenings and deriveTSolids
use this boundary then delegate to the same kernel. No caller-provided stale
contours and no second geometry implementation. Application preview and isolated
IFC export retain their existing public interfaces and strict validation.
Schema remains 7; persistence/automatic T relations are not implemented here.


**Q0039**

User confirmed: changing one host endpoint keeps the incoming endpoint at its
world position; when that point leaves the host interior, detach without moving
the incoming wall. Individual element movement detaches, without propagation.
[Persistent T contract](docs/PERSISTENT_T_RELATIONS.md) defines the bounded
implementation plan: IDs/end index identify the anchor; do not store redundant
coordinates or a proportional anchor. Schema 8 is planned, not implemented.
Separate validated public entry points from pure internal derivation before
connecting T solids to validateProject, avoiding recursive validation. Movement
intent must be explicit; coordinate differences alone are not the action type.


**Q0040**

contour-solid reconciles numerically compatible local profile X coordinates and
opening bounds after world/local conversion, preventing spurious tiny extrusion
cells at a transverse cap. This affects derived geometry only, within existing
model tolerances. No project mutation or persisted opening resize. T relations
remain temporary; save/ordinary IFC still use the unchanged model. Further joins
on either wall remain unsupported by the diagnostic T path.


**Q0041**

This pure helper knows no Project, windows, other joins, persistence or UI.
Callers must verify those preconditions separately. It never mutates axes or
adds a relation. Contact width touching a host end, insufficient incoming length,
non-right angles and invalid inputs reject. Existing automatic endpoint joins
remain unchanged. No schema migration, new command or duplicated renderer path.
The planned anchor/host-movement policies remain open.


**Q0042**

[The bounded T-connection draft](docs/T_WALL_CONNECTION_PLAN.md) records the
current endpoint-pair limitation and proposes an unbroken host wall with a
trimmed incoming wall. It is not an implemented connection or a settled anchor
policy. Preserve common contours, IDs and validated Application actions. Host
movement/anchor behavior and host opening clearance remain explicit proposals.
The next geometry-only helper introduces no persistence, UI or command path.
Text/voice remain companion adapters of verified actions per the guide; there
is no blanket deferral based on the user's priority question.


**Q0043**

The automatic connection path now uses Domain deriveWallCorner for non-collinear
axis-end pairs, including acute and obtuse corners. This supersedes the historical
right-angle-only restriction below. The existing line intersection service and
contour validation are shared; no angle-specific renderer or IFC implementation.
The strict deriveRightAngleCorner entry remains for the older diagnostic preview.
That dialog is still limited to right angles; automatic drawing/editing does not
require it. Equal thickness/height, exact endpoint identity, two ends per node,
valid composed profiles and opening clearance remain mandatory. Parallel axes,
numerically unresolved seams and miters reaching the opposite cap reject.


**Q0044**

Schema 7 is unchanged: joins still store only IDs/end indices. Existing valid
right-angle projects retain their geometry. The admissible geometry is expanded;
older releases may reject newly saved oblique joins. All views, snap references
and ordinary IFC export consume connectedWallSolids. A complete wall chain still
forms one undo action. T contacts, collinear subdivision and unequal wall sections
remain outside this step. Future text/voice adapters use existing validated wall
actions and stable target context, not a separate corner mutation path.


**Q0045**

Application direct-edit/offset accepts only closed 2D lines and hatches, using
closedContour as its capability gate. BIM is rejected here even in plan views.
Existing editInteraction, origin, snap resolver and signed axis input serve both
kinds; no copied form, mouse handler or snapping engine. The selected side (or
first side when selected as an element) supplies the outward normal; the chosen
point remains the pinned origin. Shared previewEdit checks model/selection;
existing confirmation creates one history entry. Cancellation never changes the
model. Style, layer and stable ID are preserved; file schema remains 7. Future
text/voice adapters use these same actions. Offset is not uniform scaling.


**Q0046**

Interop strictly validates V1–V6 before migration to schema 7. Legacy paints are
initialized hidden (white background, slate contour), preserving old appearance.
No silent runtime defaults: schema-7 snapshots require both valid paints. The
legacy V6 validator checks its original strict shape and reuses current wall-join
validation on a disposable converted view. Creation defaults live in Domain;
Application previewHatch/commitHatch owns updates by stable project/hatch ID,
with stale-context validation and one normal model-history commit. Future
text/voice adapters must call this same action; no separate appearance mutation.
The fixed properties bar edits all three paints; no pattern engine is implied.


**Q0047**

Schema 6 requires storey.wallJoins, each relating two stable wall IDs and endpoint
indices. V1–V5 migration initializes no joins: old touching geometry is preserved.
No separate editable miter geometry is stored. Shared addWall/updateWall reconcile
new or moved endpoints before returning a validated snapshot. An unchanged old
endpoint does not acquire a new connection merely because another property or
the opposite endpoint changes. End coordinates must match exactly (the shared
snap engine supplies exact targets); model tolerance is not an identity radius.
Candidate lookup scans only the changed wall's ends, not all wall pairs.


**Q0048**

User decisions now confirmed: openings must not touch the joined end boundary;
moving a wall away removes the relation and restores straight ends on both sides.
The movement and relation change share one history commit. Connected walls with
unequal height/thickness, non-right angles, multiple ends at a node or invalid
opening/profile geometry reject atomically. A T contact is not an endpoint join.
Editing one connected wall's height/thickness may therefore require detachment
first; propagation to a whole group remains future work.


**Q0049**

Domain connections.ts composes both end contours per wall and validates openings.
It shares contour-solid.ts with the earlier explicit-pair path. Immutable project
identity caches disposable derived solids. Plan profiles, 3D material/picking,
snap corners and ordinary IFC export consume these results before visibility
filtering. Joined physical corners are snap references, not independent endpoint
grips; authoritative axis grips remain editable through existing EditSessions.
Persisted file relations undergo the same geometry validation. No UI-only joins.
The previous temporary dialog remains diagnostic, not a commit requirement.


**Q0050**

Wall-chain transaction implemented 2026-10-06: application/drawing/wall-chain
owns an ephemeral snapshot-bound draft. Each accepted point uses createDrawing
and existing Domain join validation; stable wall IDs survive completion. The
plan renders the draft only as a disposable preview. Authoritative project,
navigator, save and IFC remain unchanged until finishWallChain supplies one
history commit. Undo/Redo affects the whole chain as explicitly requested.
Escape/tool changes discard the draft; changed project identity prevents stale
completion. Shared drawingInteraction supplies precision, construction origins
and path references, with no separate snapping or polar calculation.
Click appends, Enter on the canvas or double-click completes. Numeric Enter in
the shared form accepts the next point. One-segment chains are valid. Invalid
continuations preserve prior accepted segments. Current right-angle join limits
still apply; collinear subdivision and arbitrary-angle connections are deferred.


**Q0051**

The new user direction supersedes explicit-menu-only connections: snapping wall
axes together is to connect their bodies automatically. Continuous wall chains
are the subsequent drawing goal. The pair-preview dialog is a diagnostic aid,
not the required future modelling workflow. Automatic joins and chain drawing
are not implemented by this axis correction.


**Q0052**

Application createDrawing places new wall bodies left of the directed axis
(bodyOffset = thickness/2): the axis is the right edge. Existing placements stay
unchanged. Low-level addWall retains its centred compatibility default. New
explicit placements are limited to half-width by Domain axis-position; thickness
changes retain relative axis placement through shared updateWall. Historical V5
files with outside axes still load without relocating bodies/windows; new axis
placements cannot reproduce them. An explicit legacy conversion is future work.


**Q0053**

Application walls/corner-preview owns validation and the snapshot-bound derived
result for one explicitly chosen pair of wall ends. It invokes the existing
domain corner-solid service. Changing the source project invalidates the result;
there is no automatic pair search, mutation, history entry or persisted join.
The UI dialog selects stable wall IDs/endpoints and presents existing plan and
solid viewports. Closing/Escape discards the preview. Ordinary model views and
the normal IFC export remain unchanged.


**Q0054**

The plan consumes the exact derived local profiles. The solid display adapter
replaces the two original wall surfaces with domain-derived opening-cut faces;
unrelated walls remain intact. Display faces may be convex planar polygons.
Rendering and depth picking share Geometry's triangle-fan iterator so neither
silently drops vertices after the fourth. This is not a general triangulator
for concave polygons. Renderer meshes never become model or export authority.
Currently unsupported corner-opening contacts remain a limitation, not a new
product policy. Persistent connections await the outstanding end-contact and
detachment decisions documented in docs/WALL_CORNER_PLAN.md.


**Q0055**

This section supersedes the preparation-only status below. Existing plan/solid
viewports consume the shared visibility policy for geometry, picking, snapping,
active references and 3D occlusion. The BIM palette now supplies the persisted
working filter; explicit DrawingDocument contexts remain independent.


**Q0056**

Canonical runtime/file schema is 3, with required bimVisibility.hiddenLayerIds.
The file adapter strictly validates V1/V2 before explicit all-visible migration;
runtime validation does not migrate or silently repair snapshots. Save preserves
the current filter; history stacks are not serialized. Full geometry, real wall
openings and IFC scope remain independent of display filtering. New drawing
filter initialization is still undecided. Browser acceptance remains outstanding;
automated migration/history/rendering checks do not substitute for it.


**Q0057**

This adapter is tested but not yet consumed by BimPlan/BimSolidView. Viewport
binding, gesture cancellation and the remaining source/picking consumers must be
integrated before visibility switches are exposed. No UI or file format change.


**Q0058**

application/tools/snapping.ts now offers createVisibleToolSourceQuery bound to
Project, the shared visibility policy/context and the existing tool policy.
It reuses the cached primitive index. Eligibility applies before density and
intersection enumeration and to remote active sources and flattened dependencies.
Derived reference IDs are not treated as model element IDs. The exact pinned
interaction origin remains available independently of excluded model targets;
stale project/context bindings suppress even that origin. Consumers must replace
the query on model/filter changes, never on zoom. Existing callers without an
eligibility binding retain their all-visible behavior.


**Q0059**

application/layers/visibility.ts supplies a pure snapshot-bound policy for current
walls, windows and lines. Its frozen context has an explicit bim-project or
drawing-document scope and independent hidden layer IDs. Drawing filters never
intersect a BIM working filter. A hidden host makes its window ineligible.
The policy validates once, builds ID maps once and returns a reason for each
decision; mismatched Project or context identity and unknown targets fail closed.
Callers must use immutable Project snapshots and rebuild on model/filter changes.
The document ID is a binding token, not a claim that schema 2 contains documents:
future binding adapters must validate document existence. No UI, persisted filter,
export filtering or per-tool implementation is introduced in this slice.


**Q0060**

The BIM project and its derived working plans, sections, elevations and 3D views
share one layer visibility context. DrawingDocuments (Ausschnitte/Abbilder) have
independent layer visibility contexts. A layout rendering of a DrawingDocument
uses that document's context. BIM-project visibility is not an upstream mask:
a layer hidden in the working model can remain visible in a DrawingDocument.
All contexts reference the same authoritative elements; no building copies.


**Q0061**

Persist these settings in the project. Hidden elements are ineligible for normal
picking and snapping; hiding an edit target cancels its pending edit without
committing the preview. Window display requires both its own layer and its host
wall to be visible in the effective context. Real wall openings and the complete
IFC export remain unchanged. One Application eligibility policy serves all views
and tools. This resolves the earlier open scope, persistence and host questions.
Initial filters for newly created DrawingDocuments remain open. Update 2026-10-10:
BIM visibility is implemented with separate palette Undo/Redo, outside model history.
Document lifecycle/history is not decided by that working-view rule. See
docs/planning/SAVED_DRAWING_VIEWS.md for the current code/contract distinction.


**Q0062**

The canonical runtime is now schema 2. domain/project/schema.ts owns current and
legacy validation with shared geometry/identity invariants; domain/layers/model.ts
owns the standard layer catalogue. Project stores layers, explicit defaultLayerIds
for wall/window/line creation, and a required layerId on each existing element.
Default IDs, rather than editable names or array positions, drive creation.
interop/project-file/load.ts validates schema 1 before deterministic migration and
validates schema 2 afterwards; current files are never silently repaired. The old
lib/bim/model exports remain a compatibility facade, without a dependency cycle.


**Q0063**

application/layers/actions.ts provides previewLayerAssignment and
commitLayerAssignment for stable element IDs and a pinned project snapshot.
Missing targets, stale context and invalid layers reject the entire request;
successful changes use existing snapshot history and no-ops keep history unchanged.
Existing creation paths receive defaults at addWall/addWindow/addLine, not in each
tool. This step adds no visibility filter, layer management UI or language parser.
Future UI/Text/Voice adapters must use these actions. Organisation has no effect
on wall material, hosted openings, coordinates or current IFC output.


**Q0064**

The schema-2 addition defaultLayerIds makes defaults survive renaming and
migration-ID collisions. Windows default to the separate Fenster layer; no host
membership inheritance is introduced. Visibility decisions below remain open.


**Q0065**

The bounded [layer contract](docs/LAYER_CONTRACT.md) records the inspected schema-1
baseline, retained requirements and the next migration task. No layer code exists
at this decision point. Organisation layers have stable project-wide IDs; element
membership must resolve to those IDs and must not be inferred from mutable names.
Layer membership does not change AssemblyLayer, annotation scope, host relations,
height binding or editing capabilities. File migration validates old input before
conversion and the current model afterwards; runtime validation must not silently
migrate snapshots during editing. Preserve existing element IDs and geometry.


**Q0066**

Future layer visibility is one application-level eligibility policy consumed by
rendering, picking and local snapping, including active reference dependencies.
Apply it before local intersection enumeration. Model-only geometry caches remain
derived; view-specific eligibility must not leak between panes or outlive a changed
visibility context. Visibility never changes wall openings or the export scope.
Global versus per-view visibility, persistence of that preference and host/window
display combinations remain open product decisions. The schema-2 field proposal
and window default in the linked contract are implementation proposals, not claims
of user decisions or implemented behaviour.


**Q0067**

Projection fitting uses the committed model, never the moving preview. Camera/viewport changes rebuild the shared projection independently of geometry preview. A left click during movement fixes direction or confirms through ToolInteraction; it cannot also navigate. Explicit Pan suspends pointer targeting and never confirms on release. Wheel and keyboard camera navigation remain available. Invalid/stale projection blocks pointer targeting. Model/selection validation and one-step Undo/Redo remain application responsibilities. Free Z movement, point deformation and further element adapters are not included in this step.


**Q0068**

The wall-source adapter now resolves its known axis-end/corner feature identity to endpoint index 0 or 1. A midpoint or unknown feature has no endpoint index and must not become a point-edit grip. The clicked physical model-space corner remains the anchor; it is not replaced by the wall axis. BimSolidView forwards the stable wall ID, endpoint index and anchor to the existing selection/Direct Edit contract. The `point` action consumes the same workplane inference, projection frame and ToolInteraction as whole-wall movement; its existing click contract confirms the target directly. Corner offset correction, retained wall thickness/opposite endpoint, hosted opening validation and history stay in the existing shared application/model operations. Other constrained actions still use their previous 2D entry until explicitly integrated.


**Q0069**

The existing stretch/axis/x/y actions now enter the same 3D workplane interaction as move/point. `supportsWallWorkplaneEdit` is the single application capability check used at entry and by the viewport: only walls, and point/stretch require endpoint index 0 or 1. An explicitly selected footpoint is required for every entry. No axis solver or numeric widget was added. `editDirection`, `resolveEditSnap`/fixedAxis and numericMoveAxis remain authoritative for direction and signed distance; explicit axes take precedence over Shift/Ortho and remain constraints with Snap disabled. Stretch retains the opposite endpoint and checks hosted openings, while axis/x/y translate the whole wall. Existing Pan/confirmation isolation and transaction history are reused.


**Q0070**

The shared hoveredSegment/useHoverReference path owns 600ms activation, revisit removal, capacity and navigation suspension. Parallel directions and guides use the existing shared functions. SolidSnapPreview adds a dashed hover edge and stronger active edge behind wall pixels; the existing midpoint ring remains. No model or history action is introduced. Current scope is lower material edges on z=0, not wall axes, top edges or arbitrary 3D workplanes. Future adapters supply sources to these same services.


**Q0071**

`rendering/viewport/selection-outline.ts` derives boundary and crease segments from the selected entity's displayed polygon faces. It is independent of domain IDs and React; BimSolidView supplies the faces of the current selected wall, including edit preview geometry. No persisted selection or model copy is introduced. Equal-coordinate shared edges with matching unit normals are omitted, removing cell seams and triangle diagonals while retaining opening reveals. The input contract is a conforming mesh with identical shared vertex coordinates, as produced by buildSolid; future nonconforming adapters must subdivide T-junctions first.


**Q0072**

Edges are cached by displayed geometry/selection and projected through the existing ProjectionState. CSS-width triangle ribbons (1.5px) use the same WebGL depth buffer as walls, with depth writes disabled and a 1e-6 NDC depth bias to avoid coincidence flicker. Hidden segments remain occluded; this is not X-ray selection. Depth bias is a rendering tolerance, not a model or snap tolerance. Current styling is a subtle light grey-blue border accompanying existing selection tint. Only an actual wall selection gets the border; selecting a window does not falsely outline its entire host as the selected object. Other element types need their displayed-face adapter when implemented, not separate outline algorithms. No large-scene, nonconforming-mesh or general solid topology support is claimed.


**Q0073**

The rules in this document apply to all new implementation work unless a later documented architecture decision explicitly replaces them.


**Q0074**

The current working system must not be rewritten merely to match folder names in this document. Migration is incremental: preserve working behaviour, tests and validated Stage-1 workflows while moving responsibilities behind clearer boundaries.


**Q0075**

NOVIKOV CAD shall be designed for long-term growth, not only for the next visible feature.


**Q0076**

The architecture must support, without fundamental redesign:


**Q0077**

- large architectural projects
- 2D and 3D model views
- walls, openings, slabs, roofs, columns, stairs, rooms and future BIM element types
- stable element identity
- parametric editing
- snapping, inference, temporary guides and constraints
- precise drawing tools
- undo/redo and transactions
- project serialization and schema migration
- IFC and future interoperability formats
- multiple storeys and building structure
- selection and direct manipulation
- AI, text and voice commands
- automated tests
- later plugin/extensibility mechanisms


**Q0078**

Features must communicate through explicit interfaces and application actions instead of reaching across unrelated layers.


**Q0079**

A low-level module must never import a higher-level presentation concern.


**Q0080**

These features are assets and must be preserved.


**Q0081**

New generic systems such as snapping, guide inference, geometric primitives, transactions or tool runtime must not automatically be added to `src/lib/bim`.


**Q0082**

Core must not know about React, IFC, toolbar state, wall rendering or voice commands.


**Q0083**

Future dependency graphs and transaction systems belong here when they become necessary.


**Q0084**

It must not be implemented as BIM-specific wall code.


**Q0085**

Later solid/mesh operations may extend this subsystem.


**Q0086**

But geometry primitives must never import `Wall`, `Window`, `Slab` or other BIM entities.


**Q0087**

Numerical tolerances must be centralized instead of scattering arbitrary epsilon values throughout tools and geometry code.


**Q0088**

Domain models must contain architectural meaning and validated parameters, not React components, Lucide icons, CSS state, Three/WebGL objects or IFC entities.


**Q0089**

NOVIKOV CAD must have exactly one authoritative project/model state for a running document.


**Q0090**

The following must derive from the same model state:


**Q0091**

Derived rendering data may be cached, but it must be disposable and reproducible from the authoritative model.


**Q0092**

- mouse tools
- keyboard shortcuts
- properties inspector
- direct-edit UI
- AI text commands
- voice commands
- future macros or plugins


**Q0093**

AI/text/voice commands must bind to stable selected IDs and must reject stale context if the project or selection changed after preview.


**Q0094**

Natural-language interpretation must not silently guess a target when selection/context is ambiguous.


**Q0095**

However, future architecture must permit migration toward explicit transactions/change sets when model size makes complete snapshots inefficient.


**Q0096**

A future transaction may represent operations such as:


**Q0097**

Undo/redo belongs to the application/core boundary and must not be implemented independently by UI components.


**Q0098**

Tools may request snapping and geometry services, but they must not duplicate them.


**Q0099**

All input surfaces must use stable entity IDs.


**Q0100**

2D plan selection, 3D picking, Navigator selection, Inspector context, AI context and direct-edit context must converge on the same selection abstraction.


**Q0101**

A renderer may report a picked render primitive, but it must map that result back to a stable domain entity ID before editing commands execute.


**Q0102**

The Stage-2 snapping and guide system must be implemented as a reusable subsystem, not embedded in individual tools or React components.


**Q0103**

Snap priority and visual indication must be deterministic and testable.


**Q0104**

The snapping subsystem must use the existing authoritative model and shared geometry primitives. It must not create a parallel CAD model.


**Q0105**

UI components must not become the authoritative owners of BIM geometry.


**Q0106**

2D and 3D views must represent the same project entities.


**Q0107**

Model geometry and architectural properties remain shared.


**Q0108**

The domain model must not be designed around IFC implementation details.


**Q0109**

IFC export must read the same authoritative project state used by the UI and renderer.


**Q0110**

Loading must validate:


**Q0111**

When future features change the file model, introduce migrations instead of silently interpreting incompatible files.


**Q0112**

Temporary UI state such as hover, active menu or current tooltip must not be stored as architectural project data.


**Q0113**

Every relevant capability exposes a typed Application action or structured
model query reusable by manual UI, text, voice and future AI. The AI can plan
many internal steps, but geometry, quantities and constraints remain with the
CAD/domain engines. Imported plan statements retain document/page/region,
version, applicability and uncertainty; an ambiguous or unverified rule cannot
silently become a satisfied design constraint. Multi-step proposals require
revision-bound context, model diff, explicit publication boundary and Undo.
A CAD button itself is not the AI integration surface; no direct UI automation
or second editable AI model is authoritative.


**Q0114**

`CadWorkspace` may orchestrate layout and temporary UI state, but long-term project editing responsibilities must migrate to application/domain services rather than continuously enlarging `CadWorkspace.tsx`.


**Q0115**

Browser/manual acceptance tests remain valuable for interaction quality, but they do not replace lower-level deterministic tests.


**Q0116**

1. Which layer owns the feature?
2. Which existing model is authoritative?
3. Which application command/action changes the model?
4. Which geometry service is reused?
5. How does undo/redo work?
6. How do 2D and 3D remain synchronized?
7. How does selection identify targets?
8. Does save/load preserve the result?
9. Does IFC need to reflect it?
10. What automated tests prove the core behaviour?


**Q0117**

The next precision-drawing stage must strengthen the architecture rather than add isolated UI behaviour.


**Q0118**

Wall, line and future slab/roof tools should consume these shared capabilities.


**Q0119**

##### 28. Rule for Codex and Future Contributors


**Q0120**

- **ModelView** defines a model-derived floor plan, section, elevation or 3D view, with stable identity and explicit definition (e.g. storey or section plane). It references the authoritative project; it owns no duplicate building elements.
- **DrawingDocument** references a ModelView by ID and owns saved crop, output scale, visibility/style overrides and document-scoped additions. Its building projection is regenerated from the current model. A frozen export is an output artifact, never an independently editable building copy. Missing source references must be surfaced, not silently replaced.
- **Annotation scope** must be explicit and validated: a storey-scoped 2D addition, a particular ModelView, a DrawingDocument or a Layout. The owner is identified by stable ID; no implicit propagation between scopes. Dimensions may reference stable model features independently of their display scope; deletion or topology change must expose unresolved references. Existing storey lines retain their current scope during migration. Text and hatch schema details remain proposals.
- **Layout / MasterLayout** describe paper composition and reusable page format/title-block definitions. A layout placement (working name LayoutViewport) references a DrawingDocument and stores placement/crop/output-scale settings; it does not embed its elements. Deleting a referenced master/document requires explicit dependency handling. Paper units and output scale are distinct from model metres and screen pixels.
- **ViewportBinding** routes one on-screen pane to a ModelView, DrawingDocument or Layout through a typed ID reference. Each pane has an independent camera/navigation context; focus determines the receiving pane. Project, committed selection and application actions remain shared. Screen panes and paper LayoutViewports are different concepts. Persistence of pane arrangements is not decided here.


**Q0121**

Saved definitions and annotations may initially share the versioned Project file and existing snapshot history. Hover, temporary guides and open menus remain ephemeral. Model actions and document actions are distinct typed operations through the same validated application/history boundary; no second BIM history or state store is introduced by a canvas pane. New persistent types require reference validation, migration from schemaVersion 1, round-trip and undo tests before release. Navigation alone must not produce model history entries.


**Q0122**

Application resolves a typed viewport target against the current project snapshot,
including source definition, effective scale, visibility and supported capabilities.
Renderers consume that context; they must not reconstruct a working-plan identity
for a DrawingDocument or silently fall back to working scale/visibility. Missing,
foreign or stale references are explicit failures. Closing a pane does not delete
its saved definition. Document visibility is independent of the BIM visibility mask.
Derived caches include relevant model/definition identity, not pointer or camera.


**Q0123**

Schema 16 currently has workingViews only; the drawing-document visibility token
is not proof of document persistence or existence validation. The bounded next
pilot consolidates the existing working-plan wiring, without creating unused
ModelView/Document classes. Document initialization, crop interaction and lifecycle
history remain proposals until decided. Existing storey annotations retain scope.
See [saved-view contract and single pilot](docs/planning/SAVED_DRAWING_VIEWS.md).


**Q0124**

**Binding technical rules for future implementations:**


**Q0125**

1. Plan, section, elevation and 3D hits resolve to a stable source element ID and supported feature plus view/work-plane context. They invoke the same validated application action. A generated section edge is not automatically an editable wall vertex. Document-decoration mode must be distinguishable from model editing; changing a view override never changes a material or component.
2. **Layer** is organisation/visibility; **AssemblyLayer** is a material/construction stratum within an assembly. Their IDs, operations and meanings must remain distinct. Elements may reference both. Display overrides cannot alter assembly thickness. Standard organisational layers from the previous guide remain requirements; additions do not rename them implicitly.
3. **Height binding** distinguishes fixed dimensions from storey-bound lower/upper references with offsets. Storey changes affect bound components, not fixed-height components by accident. Derived height must not become an independently editable duplicate. Validate dependent openings and other affected elements atomically before committing. Existing numeric wall heights migrate without silently acquiring storey bindings. Exact schema, defaults and user choices for new components remain open.
4. Each new checked model or document action must expose a typed parameter/target contract for mouse, properties, shortcuts and AI/Text/Voice adapters. Context includes stable target IDs, target kind/scope, originating view/work plane when relevant, and a model/document revision or equivalent snapshot identity. Preview and apply reject changed targets or stale context. Ambiguity is clarified, never resolved by guessing another nearby element. Creation uses explicit container/host IDs; it cannot require a pre-existing created-element ID.
5. Action acceptance includes adapter tests for the supported text intent and simulated voice transcript, invalid parameters and stale context; real speech-recognition quality is a separate test. An unsupported intent is reported explicitly. Neither AI nor speech components contain geometry, validation or independent model mutation.


**Q0126**

**Binding user restriction and required application guard for N25:** proportional scaling is allowed only for genuine 2D entities and imported PDF references. BIM/3D objects (including walls, windows, doors, slabs and roofs) remain forbidden even when rendered in a 2D view or DrawingDocument. The future scaling action must resolve authoritative target types/capabilities and validate _every_ target before preview or commit. If any target is forbidden or unresolved, reject the entire selection without partial changes or a history entry. Hiding a toolbar command is insufficient; direct action calls, AI/Text/Voice and imported/reloaded references must pass the same guard. Validate finite positive lengths, nonzero measurement baseline, anchor and target revision. Uniform scale and an explicit anchor form the proposed calibration contract; text/style scaling semantics need separate definition.


**Q0127**

**Open user meanings — no default invented:** D versus Ctrl+D; whether a wall-axis switch preserves physical wall position or the drawn reference axis; the 3D export format/contents; undo grouping for wall chains. These block only their respective implementation. Detailed field names, folder layout, PDF decomposition approach, solid-library choice, per-annotation styling and layout-template linkage mechanics remain proposals until separately decided.


**Q0128**

Tool adapters supply origin and current aim, validate tool-specific constraints and confirm through existing model/application actions. Line drawing rejects zero length and changed model context; direct edit retains its pinned selection, axis and opening constraints. Numeric targets take precedence over mouse snapping. There is one helper component and one draft hook, not a copied form/state machine per tool. The existing workspace coordinates these consumers; migration of its remaining legacy drawing orchestration is incremental. AI/Text/Voice must use the same validated actions, not React draft state or separate model logic.


**Q0129**

Currently connected: element/point movement, point stretching, single straight-line drawing and straight-wall drawing. Polyline segments also consume this contract; other tools remain future precision-input consumers.


**Q0130**

Every interactive movement starts with a pinned construction reference at the chosen point, immediately and without hover dwell. This applies to point movement, whole-element movement, stretching and axis-constrained movement, including hosted elements. Future slabs, roofs, stairs, furniture and other elements must use the same interaction/constraint pipeline; origin activation is not an optional per-tool feature.


**Q0131**

The origin stays at the original model-space position during preview and zoom. Shared inference supplies cursor-dependent guides, additional hover references and intersections. Do not display every possible guide simultaneously. Explicit axis/host constraints and model validation still take precedence; a window remains on its wall. User-controlled Snap disable remains respected. Completion/cancellation removes the session origin without committing construction geometry. Future 3D movements must supply the active work-plane context to this same system.


**Q0132**

PrecisionInput centrally handles Tab during an active interaction: from the viewport into length, then angle, then length. On first entry the current mouse direction is captured at full precision through the input adapter, not from the rounded display hint. Enter confirms, Escape cancels. Unrelated text fields keep their normal keyboard behaviour. Explicit axis constraints retain a read-only angle. All future consumers must use this shared keyboard contract. Free point movement now consumes the same polar adapter as whole-element movement.


**Q0133**

Drawing actions for straight walls and lines/polylines now converge on application/drawing/actions.ts. It validates the pinned model context and delegates creation to existing addWall/addLine domain operations. Mouse and numeric confirmation use the same action and history path. previewDrawingInput shares the polar text adapter; the former line-input export remains compatible. CadWorkspace still coordinates pointer collection and presentation, but no longer calls addWall/addLine directly. Defaults for a drawn wall remain 0.36 m thickness and 2.80 m height. Drawing preview is a 2D axis guide; the confirmed wall supplies the existing 3D rendering.


**Q0134**

application/tools/adapters.ts adapts existing Direct Edit and Drawing actions to this contract. Fixed axes, window constraints and the distinction between point and element mutation belong here or in the existing validated model actions. They must not be reimplemented in the input component or viewport click handler.


**Q0135**

useToolInteraction runs one shared draft/preview/pick/confirm/cancel lifecycle. InteractionInput binds it to the single PrecisionInput, including shared Tab behaviour. CadWorkspace selects an adapter and connects existing project/history actions; it no longer owns the tool-specific numeric preview switch or form confirmation branches. BimPlan forwards picked targets without deciding which edit action locks a direction. Existing shared snapping, hover references, origins and geometric projection services remain in place.


**Q0136**

Migration limits: legacy point collection for drawing and rendering/edit-session plumbing still exist. This change does not claim a complete universal tool framework or a 3D work-plane runtime. Future input consumers implement the small adapter contract; adding one must not require copied Tab, hover, polar-input or form-confirmation logic.


**Q0137**

Polyline reuse verified (2026-10-03): each last draft vertex supplies the existing drawingInteraction identity/origin. The same runtime, PrecisionInput, Tab and snapping services are unchanged. Numeric confirmation adds a draft vertex; completion uses one createDrawing/history commit. Invalid explicit input must not be silently discarded by double-click/viewport Enter completion.


**Q0138**

Modal dialogs own Tab and application shortcuts while open. PrecisionInput must not intercept navigation outside its own panel inside a dialog/alertdialog; workspace tool shortcuts likewise yield to modal content. Cancelling project-file confirmation preserves the suspended draft. Confirmed project replacement and history navigation clear edit/drawing context through the existing shared reset; Undo restores committed model state, never an old interaction session. Session identity checks reject delayed confirmations even after returning to an earlier model snapshot.


**Q0139**

Decision: replace production-wide intersection precomputation with local point/segment retrieval and local segment intersections. Reuse immutable model-space primitive data, a spatial index and a full source-identity lookup; do not index all potential intersections. The existing cached reference list is a transitional optimization, not this target implementation. CSS-pixel radii are converted per query; zoom and tool changes do not rebuild the model index. Long segments are indexed by their full extent, not just endpoints. Exact existing geometry, tolerances, ranking and tool source exclusions remain authoritative.


**Q0140**

Immediate point/intersection snapping is independent of the 600 ms reference acquisition/removal delay. Active and pinned references are processed separately from local geometry; validate their original source dependencies against the complete snapshot lookup, never only the local result list. Local result-array changes must not reset hover sessions. Model changes/load/history must resolve the matching snapshot and preserve existing session invalidation rules. One shared query path serves drawing, Direct Edit and hover acquisition; no per-tool spatial engines.


**Q0141**

Module responsibilities, integration hazards and acceptance cases: docs/LOCAL_SNAP_QUERY_PLAN.md. A static AABB tree, concrete API names and a full primitive-index rebuild on a new snapshot are proposals for the first implementation; incremental updates and index tuning remain evidence-driven choices. The former plan to accelerate a global all-pairs intersection build is superseded. Implementation status and measured limits are recorded below and in docs/performance/LOCAL_INTEGRATION.md and DENSE_SNAPPING.md.


**Q0142**

Existing binding rules remain: one authoritative model, one shared snapping/inference pipeline, stable selected-entity context and the same validated application actions for mouse, numeric input and AI/Text/Voice. Work-plane coordinates and overlays are derived interaction data; no renderer mesh or second model becomes authoritative.


**Q0143**

The working proposal in [docs/3D_WORKPLANE_PLAN.md](docs/3D_WORKPLANE_PLAN.md) starts with the XY plane at z=0, matching the current model. It requires a shared orthographic forward/inverse projection and later a shared CSS-screen metric for foreshortened views; a single pixels-per-metre factor is insufficient. A plane/model operation scope is distinct from camera navigation. Gesture allocation, occlusion policy and numerical conditioning thresholds are explicitly proposals/open issues, not implemented or user-approved product decisions. The next package is only projection extraction and tested inversion, preserving current rendering and picking; no new 3D editing UI or model mutation is authorized by this planning document.


**Q0144**

`rendering/viewport/horizontal-workplane.ts` captures immutable bounds/camera/viewport values and maps a fixed horizontal plane to client CSS pixels and back. Callers must supply the exact rendered aspect, including backing-buffer rounding, separately from the CSS rectangle. Its inverse search AABB is a conservative prefilter, never a substitute for exact CSS-distance ranking. Invalid input, poor conditioning and excessive estimated roundoff return explicit failure statuses; consumers must not confirm an invalid point. The current numeric guards (condition <= 1e6 and estimated roundoff <= 1e-6 m) are implementation safeguards, not model tolerances or guarantees of pointer accuracy. See the plan for their limits.


**Q0145**

This adapter has no interaction consumer yet. Supporting a mathematical height does not add model storeys or Z movement. Shared snapping metrics, origin acquisition, occlusion and gestures must be completed before enabling 3D editing. Product decisions still open in the planning boundary remain open; the numerical guards above supersede only the previously undecided conditioning threshold.


**Q0146**

`application/snapping/local-sources.ts` accepts either this metric or the compatible numeric 2D scale. Numeric callers use the same service through an isotropic adapter, preserving point-distance arithmetic. Candidate segments pass AABB, segment-box and CSS-distance checks before density counting or pair construction. Model-tolerance and roundoff padding retain uncertain contacts for existing exact intersection validation; they do not widen final point acceptance. Unlike the former square-only test, segments near square corners but outside the CSS radius no longer contribute false density. Source identities, full extents, snapshot caching and remote reference lookup remain intact.


**Q0147**

The rest of the resolver still uses its existing 2D metric. The affine query API is not a complete 3D snapping path and must not be used to enable that UI yet. Ranking, guide projection, hover and explicit reference picking must converge on this contract in subsequent bounded changes.


**Q0148**

SnapContext now optionally carries ScreenMetric. querySnap supplies the isotropic adapter for legacy numeric callers and forwards the same instance to the shared source query. The Application adapter uses it for local filtering and density; point candidates use it for radius acceptance and distance ranking. Existing priority, activation and stable source tie-break rules remain unchanged. Non-finite point distances are rejected.


**Q0149**

This supersedes the point-ranking limitation above only. Guide generation/projection, guide distances, Shift/Ortho direction selection, hover and explicit picking retain their current model/2D contracts. Affine point support alone must not enable a mixed-metric 3D interaction. Model angles and lengths remain model quantities.


**Q0150**

Direction selection/hysteresis, explicit Shift/Ortho and fixed-axis constraints remain model-space operations. Intersections remain exact model geometry. A candidate must still satisfy the model constraint; projection does not move or duplicate its source. This supersedes the guide-distance/projection limitation above. Hover, acquisition and explicit reference picking still require metric integration before 3D interaction can be enabled.


**Q0151**

Dwell, toggle-on-revisit, suspension, capacity and pinned-reference rules remain in the existing inference state machine. No per-tool hover state or alternate reference store is introduced. This supersedes the hover-metric limitation above; explicit reference picking and later 3D UI/visibility/navigation integration remain pending.


**Q0152**

[docs/3D_INTERACTION_CONTRACT.md](docs/3D_INTERACTION_CONTRACT.md) records the current viewport audit and separates binding technical requirements from proposed product behavior. Element ID, client-space menu anchor and geometric movement origin are distinct. The next implementation binds rendering, wall picking and plane inversion to one immutable projection state; it does not authorize a gesture change or hidden-target acquisition. Current CSS versus rounded-backbuffer aspect usage differs at the call sites and must be unified. Proposed plane presentation, visibility and gesture policies require explicit resolution before their UI implementation.


**Q0153**

Implemented in rendering/viewport/projection-state.ts: an immutable copy of frame, camera, CSS viewport and actual rounded backbuffer size supplies projection, client-to-NDC conversion and horizontal workplane inversion. BimSolidView rendering and wall picking consume the same displayed snapshot. Camera/layout/DPR changes invalidate stale selection; resize, scroll and resolution changes request redraw. Existing pickWall remains compatible through pickWallInProjection. An optional explicit frame supports later operation-pinned framing; current editing callers do not yet pin it.


**Q0154**

This completes the projection-state implementation above, without enabling 3D snapping or deciding gestures/occlusion. Rendering remains derived state. Visibility classification is a separate rendering concern; product policy must not be hidden in geometry or duplicated per tool.


**Q0155**

This is continuous geometric visibility against current opaque wall faces, not exact GPU pixel coverage/MSAA/depth-buffer quantization. No policy for hidden reference activation is implied. No new caches or per-tool implementations; the current query scans faces, so high-frequency batch use requires profiling and shared projected-scene reuse before scaling to large projects. No slabs or future element occluders are claimed until those renderer adapters exist.


**Q0156**

This adapter supports existing wall axis ends, corners and axis midpoints only. It does not reinterpret annotation lines or window coordinates as 3D points, compute new intersections, or process active guides. Queries pause on invalid/ill-conditioned inverse. Application project snapshots must remain immutable. The adapter is not yet connected to viewport events and does not define X-ray or navigation policy. Visibility still scans current wall faces per candidate; no large-scene performance claim.


**Q0157**

The user accepted the concrete proposal after PR #74: immediate hollow silver-grey rings for visible wall footpoints with Snap enabled, including no active drawing tool; shared 600ms acquire/revisit-toggle; navigation suspends acquisition and retains references; wall selection and left-drag navigation remain unchanged. This supersedes the pending approval for these preview rules only, not future 3D movement gestures or X-ray modes.


**Q0158**

SolidSnapPreview connects the displayed projection to wall-preview-context and the existing useHoverReference state machine. HoverContext.acceptReference is an optional view eligibility predicate: ineligible active sources cannot win acquisition ranking, while stored references remain intact across view changes. Timers, capacity, direction hysteresis and dwell removal stay shared. Only real visible z=0 wall points are eligible in this slice; generated construction intersections remain a later connection.


**Q0159**

The 3D preview now uses querySnap for immediate markers as well as the shared hover acquisition path. wall-preview-context supplies remote active origins and flattened original dependencies alongside local sources, using the existing model source lookup and withConstructionReferences. Construction points must have current wall-source dependencies and visible finite z=0 positions. Optional SnapContext.acceptCandidate filters ranked geometric candidates before ranking, so hidden targets cannot mask valid alternatives. Explicit axis/Shift and grid fallback behavior are unchanged; this preview does not use those modes.


**Q0160**

No new intersection algorithm or timer is introduced. Shared acquisitionReference, reference capacity, 600ms toggle and model-session invalidation remain authoritative. Decorative SVG floor and guide layers are conservative behind-wall overlays, not general depth-tested scene surfaces. Existing limitations for 3D movement and non-wall sources remain.


**Q0161**

User decision: NOVIKOV CAD shall support Windows and macOS. Whether the product is delivered through a browser, as an installable desktop application, or through both remains open. No desktop framework or distribution channel has been selected. These targets are requirements, not a claim that the current application has been accepted on both platforms.


**Q0162**

The authoritative project format, geometry/domain logic and shared validated Application actions shall be reusable across delivery forms. Filesystem access, storage, native dialogs and operating-system integration belong to explicit adapters at the appropriate application/interop/platform boundary. Browser or desktop dependencies must not leak into the CAD kernel or domain. Reuse and extract existing boundaries incrementally; this decision does not require empty interfaces, a parallel model, or an immediate rewrite.


**Q0163**

Input adapters must account for Windows Ctrl and macOS Command conventions, mouse and trackpad use. Exact gestures remain subject to the shared interaction contract. Rendering and dependency choices must be evaluated for both target platforms; code-level portability alone is not a performance or compatibility acceptance test.


**Q0164**

Minimum OS/browser versions, supported browsers and hardware, CPU architectures, offline behavior, installation, signing, distribution and updates will be defined for the concrete delivery package. Essential acceptance scenarios shall include editing a representative larger project, saving/loading and export on Windows and macOS; offline acceptance is required only after its scope is decided. Browser/desktop prototypes and measured file, input and graphics behavior should inform the later delivery decision.


**Q0165**

Canonical runtime/file schema is now 4. storey.hatches is required (empty for old
projects). Each hatch has a stable project-wide ID, kind hatch, layerId, one simple
implicitly closed ring in model-space metres, and a solid fill with RGB hex color
and opacity 0..1. domain/elements/hatch uses the shared geometry polygon validator.
No holes, repeated closing vertex, BIM volume, pattern or contour-pen definition
is included yet. Optional fill/outline and configurable patterns remain requirements.
The initial ownership is the existing storey's model-space 2D drawing scope;
DrawingDocument-local annotations are not implicitly introduced.


**Q0166**

The file adapter validates V1/V2/V3 before explicit migration to V4; it preserves
existing IDs, geometry and V3 visibility. Runtime validation never migrates.
application/hatches supplies snapshot-bound create/update preview and commits
through existing model history. UI and future AI/Text/Voice adapters must use
these same actions and stable targets. Shared layer assignment, occupied-layer
protection and eligibility include hatches. Rendering, picking, snapping and
interactive tool adapters are pending, so no canvas capability is claimed here.
IFC remains the existing building export; 2D hatches are stored in project JSON,
not converted into BIM solids. Existing BIM scaling prohibition remains unchanged.


**Q0167**

The Hatch tool shares the existing multi-point drawing state, drawingInteraction,
precision input and local source query. createDrawing delegates hatch creation to
previewHatch; only the drawing adapter removes an explicit repeated closing point.
Domain validation remains strict. Double-click/Enter finish the accumulated points;
Escape discards the draft. Closure must remain possible after the final click resets
the numeric preview to a zero-length segment; validity belongs to the creation action.


**Q0168**

Selection now uses application/selection/ElementTarget, separately from the narrower
Direct Edit capability. Hatch selection exposes fill and layer properties, not
unsupported movement grips/actions. Commands keep the actual selected hatch ID but
reject unsupported wall/window commands; no target fallback or AI mutation path.
Hatch vertices and all closed edges feed the same primitive index and layer-filtered
query. Plan bounds, display lists and Navigator include hatches. SVG fill is drawn
behind walls/lines, with a thin selection border; 3D geometry/IFC remain unchanged.
The current UI offers solid fill only. Patterns, contour pens, holes and hatch
Direct Edit remain pending. Automated checks do not constitute browser acceptance.


**Q0169**

Hatch targets now participate in EditSession/ToolInteraction. The selected vertex
is the pinned construction origin; the existing inference, precision input,
preview/commit and history paths remain shared with walls and lines. Whole-element
move, X/Y and axis translation preserve every vertex offset. Point and stretch
change only the selected vertex, validated by previewHatch and the simple polygon
validator. Self-intersection and collapsed contours cannot commit.


**Q0170**

application/snapping/grid-settings.ts defines the shared enabled/spacing preference
and validates positive finite metre input. CadWorkspace owns this transient UI
preference only; it is not Project state, serialized data or model history.
GridControls edits it once. Plan drawing/direct edit and existing horizontal-plane
3D wall editing feed the same spacing/null value to the established resolver.
SNAP remains the master switch. Disabling only grid fallback preserves feature
snapping and inference; visible zoom-adaptive grid display is independent.
Explicit numeric targets and existing axis/Shift precedence remain unchanged.
No per-tool rounding, new model actions or alternative snapping engine is added.


**Q0171**

BimPlan now overlays the selected visible wall's start/end centre axis from its
current validated display/preview snapshot. The dashed line has screen-constant
stroke and ignores pointer events. It introduces no model entity, snap source or
mutation. Axis offsets, 3D axis display and wall-join decisions remain open.


**Q0172**

The user explicitly chose: the wall body moves relative to the drawing axis.
This supersedes earlier statements that the choice was still open. start/end
remain the drawing-axis endpoints when changing the offset; the physical wall,
its openings and hosted windows translate perpendicular to that axis together.
Axis length, thickness, height, IDs and relative opening positions are preserved.
This is not whole-element translation and does not approve automatic wall joins.


**Q0173**

Implement body coordinates once in a domain wall-geometry adapter backed by
existing generic geometry. Keep axis coordinates distinct from body coordinates.
Plan geometry, bounds, 3D solids, openings, hit testing, corner grips and snapping,
windowCentre/edit anchors and IFC must consume that same derivation. The selected
axis overlay continues to display start/end. Do not create another editable Wall
or store renderer/IFC geometry as authoritative data.


**Q0174**

A snapshot-bound Application action must validate a finite offset and all derived
coordinates, return a disposable preview, reject stale target/context, and commit
one undo step. Properties and future mouse/Text/Voice/AI adapters must call it.
Reject non-finite/overflow geometry; do not silently clamp or round the value.
Changing the offset itself leaves the axis fixed. Other endpoint edits retain the
stored signed offset relative to the resulting direction; reversing direction
and deliberately keeping the body fixed is not introduced as a new command.


**Q0175**

Persist the offset with an explicit new project schema version and validated
migration of older files to zero; no permissive runtime default for malformed
new-version snapshots. Layer and visibility semantics stay unchanged. The next
implementation must cover all consumers before exposing the numeric field.
3D axis overlay, interactive offset dragging, side presets, wall joins and
material-layer priorities remain separate work.


**Q0176**

The preceding offset decision is implemented. Wall.bodyOffset is required and
finite in runtime schema 5. Project-file loading strictly validates legacy versions
and migrates them to zero offset; creation defaults only new wall inputs to zero.
domain/elements/wall/body.ts derives physical centres/corners once, including
finite-coordinate checks. Plan, bounds, solids, snapping, corner editing, window
anchors and IFC use this derivation; the selected plan axis retains start/end.
Application previewWallOffset/commitWallOffset enforce current snapshot and stable
project/wall selection, with one model-history commit and no-op preservation.
The properties form keeps draft text locally until explicit acceptance; cancellation
discards text, not a model change. The Application preview is disposable, not yet a
live viewport preview from the form. Future Text/Voice/AI adapters reuse this action.
Hosted openings retain longitudinal position and move with the physical body.
IFC placement uses physical body coordinates and records BodyOffset as a property.
No join semantics or 3D axis overlay are introduced in this step.


**Q0177**

The user chose explicit creation through "Ecke verbinden"; shared endpoints or
snap proximity alone do not create joins. Moving an individual connected wall
automatically detaches its joins, without requiring a preceding manual detach.
Application preview/commit must treat detachment and movement atomically, with
one undo step and no mutation on cancellation or invalid input. No join is
implemented yet. Shared-corner editing, endpoint/property edits and cap geometry
after detachment remain separate unresolved behaviours. See docs/WALL_CORNER_PLAN.md
for offset examples and the bounded pure contour-derivation proposal. Persisted
join relations are a technical proposal, not an existing schema capability.


**Q0178**

domain/elements/wall/corner.ts derives gross contours and a shared seam from an
explicit pair of wall endpoint references. It has no project/selection ownership,
opening processing, persistence or automatic neighbour detection. Membership,
other joins and opening eligibility remain caller responsibilities for future
Application integration. Stable-ID ordering makes pair order deterministic;
endpoint directions and offset signs are normalized locally without mutation.
wallBody and existing generic line intersection/polygon validation are reused.
Equal thickness/height are exact parameter requirements; endpoint compatibility
uses the existing metre tolerance, not screen snapping. Right-angle dot-product
tolerance is dimensionless 1e-10. Invalid/too-short geometry throws; no clamping.
Contours have positive winding and local computed area; converted world geometry
is validated too. No runtime consumers, schema changes or UI command yet.


**Q0179**

geometry/solids/profile-openings.ts extrudes convex CCW profiles along Z with
rectangular X/Z through-openings. X/Z partitioning subtracts opening unions once;
only boundary faces are emitted. Coplanar external faces may remain subdivided.
Slab intersections use original edges for identical shared vertices. Directed
edge incidence is checked; non-manifold opening contacts and numerically
inseparable cuts fail closed instead of silently dropping material. Faces have
variable polygon vertex counts, not the legacy renderer's fixed quad contract.


**Q0180**

domain/elements/wall/corner-solid.ts validates and derives an explicit pair from
one Project using existing contours/opening inspection. It returns disposable
per-wall geometry and volumes, without changing Project, visibility or history.
Local parametric side/cap coordinates are restored within model tolerance after
world/local conversion; authoritative model parameters are never changed.
Only contained openings are supported in this path. Rejection of touching is an
implementation boundary, not a settled product rule. Existing buildSolid and
normal project export are unchanged. Future renderer/IFC adapters must consume
this shared domain derivation rather than calculate separate joins.


**Q0181**

The STEP writer now lives in interop/ifc/writer.ts. lib/bim/ifc.ts retains its public
API and invokes it without profile overrides; ordinary UI export behaviour is
unchanged. No renderer data is accepted as export authority.
interop/ifc/corner.ts is an isolated acceptance path for an explicit temporary
pair. It validates a snapshot and consumes the exact local gross profiles from
domain/elements/wall/corner-solid.ts; the writer emits closed polygon sweeps and
uses the existing semantic opening/fill relationships from that same snapshot.
No alternate miter calculation or persisted join is introduced. Unknown or
invalid profiles fail before asynchronous identity generation. IDs retain the
existing project/kind/source-ID namespace. The acceptance path rejects currently
unsupported end-contact openings without deciding the future product policy.
See docs/CORNER_IFC_ACCEPTANCE.md for independent validation and import limits.


**Q0182**

prepareContourEdge reuses this preparation across pointer targets. Orientation
roots, event order, first-valid-interval restriction, collapse rules and numerical
margin remain intact. Preparation and derived results never mutate model geometry.
Application owns a WeakMap per immutable EditSession, guards its base/target/index/
anchor binding and reuses the last raw or bounded target result. Mouse snapping,
numeric preview and contour preview share this resolver. No tool-specific copy.
A cancelled or replaced session is not reused by subsequent operations.
Full contour/project validation still runs through the existing preview/commit
adapters. No trusted-preview bypass, schema change or relaxed commit validation.
See docs/CONTOUR_EDGE_PERFORMANCE.md for timings and remaining limits.


**Q0183**

Blue edge arrows are an input shortcut to the existing edge EditSession, not a
second stretch implementation. BimPlan captures the pointer on the stable SVG;
rendering/viewport/anchor-drag.ts translates pointer displacement to the pinned
model anchor and applies a 3px screen drag threshold. It has no model mutation.
CadWorkspace forwards a begin intent to the existing editing reducer. Snap,
precision input, cap and commit continue through the shared edit interaction.
Pointer-up suppresses its following click; simple click/keyboard activation
leaves the standard edit active. Capture loss/cancel aborts; session/model binding
prevents stale drags. Other on-demand edge and insertion actions remain available.


**Q0184**

See [image-reference plan](docs/references/IMAGE_REFERENCE_PLAN.md) for the verified
schema-8 integration points and proposed embedded-asset/transform/action contract.
No reference schema or calibration action is implemented by this documentation.
Binding user decision: imported PNG/JPEG images may be calibrated using two
points and a known length. This extends Section 30's permitted reference types;
all BIM exclusions and whole-target Application guards remain binding. Asset-backed storey references are not DrawingDocuments or copied
BIM elements. Browser decoders and disposable URLs belong to adapters; project
files must preserve assets independently of their original local files. Proposed
field names and embedded storage are an incremental design, not user decisions.


**Q0185**

Runtime schema 9 adds project assets and storey.references. The reference domain
module validates the storage shape, canonical base64, MIME whitelist, pixel metadata,
finite noncollapsed transforms and linked asset/layer IDs. It deliberately does not
decode images; future file/browser adapters must verify actual content, orientation
and decoded dimensions before rendering/import. No bitmap is trusted as executable
markup. Migration 1–8 belongs solely to the file adapter and adds empty collections.
Image bytes are stored once per asset; no blob URLs or decoded images enter history.


**Q0186**

application/references/actions.ts binds import to project ID and base snapshot,
validates an independent preview and commits asset/reference in one history step.
The shared file-size guard now also protects serialization, import and direct JSON
loading (10 MiB UTF-8). Storage metadata has a provisional 16-million-pixel budget
and 16384-pixel edge limit; this is a conservative implementation bound, not a
measured browser capacity promise. Renderer/decoder resource checks remain pending.
Layer assignment, occupancy and eligibility include references. Selection/rendering
and calibration are not yet exposed; existing BIM IFC output ignores these 2D data.


**Q0187**

`useReferenceCalibration` is a ToolInteraction adapter: shared point capture and
snapping, no separate engine. ReferenceCalibrationControls owns the On-Demand
length form; CadWorkspace only coordinates it. A session pins project, visibility,
selected reference and two world points. Context changes invalidate it; preview
does not mutate project/assets and acceptance produces one model history entry.
Text/Voice adapters are the next bounded task and must reuse this action.


**Q0188**

SelectionMove now translates image-reference origin alongside the selected BIM
and drawing geometry in one validated snapshot. Scale, rotation and embedded
assets remain unchanged. The singleton reference invokes the existing
useSelectionMove/ToolInteraction consumer; mixed selections and text/voice use
the same Application action. No image-specific movement engine or pixel snapping.
Host-window restrictions, visibility eligibility, stale-context guards and
relationship detachment rules remain binding.


**Q0189**

Form reset keys use immutable project identity (weak revision token) and selected
kind/ID. They never serialize or retain embedded assets. Same snapshot/selection
keeps drafts across presentation renders; model/selection changes reset them.
The initialProject prop only seeds the normal validated editing reducer; it is
not a second controlled model. A separate development-only benchmark entry mounts
the actual workspace and calls existing Application actions. It is not a product
route and its React/heap measurements must not be treated as production guarantees.


**Q0190**

The separate benchmark Vite configuration may wrap explicit existing functions in
memory to observe snap, precision/selection preview, full validation, wall solids
and plan derivation. Source-anchor mismatches fail visibly. These wrappers and
the diagnostic driver are never imported by the product build. No parallel model
or alternate action path is introduced: the driver selects real Navigator targets
and sends synthetic DOM pointer/click events through the existing plan handlers.
Acceptance compares the observed preview with rendered geometry, then verifies
cancel, one committed group move, Undo and Redo. Timing is synthetic-dispatch to
a frame opportunity with DOM verification, not OS input or guaranteed GPU display.
Nested inclusive phases must not be summed as exclusive costs.


**Q0191**

`application/tools/point-preview.ts` is a disposable one-entry cache scoped to a
bound interaction adapter, with exact point coordinates and guards before every
hit. New immutable context requires a new instance; changed targets, failures,
cancellation and confirmation clear it. Selection movement shares this result
between precision evaluation and plan rendering. Its origin, model, selection and
visibility guards remain active; validate/commit derive fresh snapshots instead of
trusting presentation output. The UI latest-context guard remains authoritative
for late callbacks. No global project cache or per-element UI branch is introduced.
Unconstrained polar input preserves the exact already-resolved aim; explicit
angle/length constraints and finite-distance guards retain their contracts.


**Q0192**

LineStyleDefinition.colorEditable defaults to true for legacy definitions. When
false, the embedded pattern color is authoritative; domain project validation
rejects divergent line colors. UI disables the color control. Renderer converts
system pen width explicitly using viewport pixels per metre and pattern scale.
Definitions remain portable project snapshots; catalog edits do not silently
rewrite existing project lines.


**Q0193**

V07d: named definitions with stable IDs and local metric cell geometry are validated
in Domain; Application owns version-1 library loading and append-only saving via
HatchPatternStorage. Interop uses localStorage per browser profile/origin across
projects (no cross-device or cross-origin synchronization). Reads are validated,
limited in size and count; failed reads/writes do not reset existing data. Saving
rereads current storage before adding a new definition. Opening a stored pattern
as a draft creates a copy; saving assigns a fresh ID. Existing-definition editing
and global application updates remain a separate action/contract. Library state
is independent of project history and production schema 10 remains unchanged.
React owns the transient draft and list presentation; previews are derived paths,
not copied project elements. Pattern usage, model/paper scale, portable embedded
snapshots, revisions and update/undo conflicts remain pending V07e.


**Q0194**

Technical decisions for the next incremental feature: embed used definitions once
in a project table, reference stable IDs from hatch applications, validate referential
integrity and keep an explicit local-plane anchor. Model sizing uses metres; paper
sizing requires an explicit output scale from the future view/document contract,
never camera zoom. The first assignment pilot is model-space only. Legacy hatches
retain their solid appearance. Repetition/clipping are derived bounded rendering.


**Q0195**

Before global editing, add monotone library revisions and central Application
resolution. Newer valid definitions update all matching applications on load and
mark the project changed without silently saving closed files. Missing/older library
entries retain embedded content; equal identity/revision with divergent content is
a reported integrity conflict, not an implicit replacement. Library Undo publishes
restored content under a new revision. Project snapshot restoration must use the
same resolution rather than rewinding global content. Multi-tab transaction safety
is not implied by localStorage. These mechanisms remain future implementation.


**Q0196**

Production schema 11 embeds used definitions once per project in hatchPatterns.
Applications hold patternId, model-space mode and explicit origin. Domain validates
references/definition identity and finite extents; normalization removes unused
definitions. Versions 1–10 migrate strictly at file ingress with an empty table,
retaining solid appearances. Used definitions remain portable without local storage.
HatchRequest accepts an owned definition for shared assignment/removal; conflicting
same-ID content is rejected until the revision action exists. Drawing and default
pickup use this action; pickup copies definition/appearance, never contour or anchor.
Single and prepared group translation move origins; contour edits retain them.
SVG pattern tiles and polygon clipping provide bounded rendering and draft preview.
No model geometry is allocated per repetition. Fill color/opacity control strokes,
background and contour remain independent. Global revision editing/History, automatic
library reconciliation, paper-space sizing and uploads remain unimplemented.


**Q0197**

The central resolver takes an explicit project snapshot and embedded/available
revision records. Newer records update one definition table for all applications;
missing or older records retain embedded content. Equal revision with different
content reports a conflict. Full project and file-size validation precedes return.
These are implemented Domain/Application contracts. Production schema 11 still
does not persist revision metadata; automatic load/History resolution and global
editing UI remain future integration, starting with portable revision context V07h.


**Q0198**

Production schema 12 adds an optional positive safe-integer revision to each used
embedded definition. Omission means unknown provenance; strict versions 1–11 migrate
at file ingress without inventing a revision. Definition identity and content remain
stored once per project, never per hatch. Schema 11 still rejects revision metadata.


**Q0199**

Opening, project adoption and project Undo/Redo use the central Application resolver.
The browser adapter reads library records before dispatch; reducers do not access
storage. Newer content is adopted; missing/older content retains embedded rendering.
Equal revision with divergent content reports a conflict. An unreadable library is
reported while the valid portable project remains usable. Project restoration also
retains newer known definitions from the same current project if the library is
missing or older. It never writes the library or adds a reconciliation Undo step.
File decoding itself remains platform-neutral and does not consult global storage.
Live cross-tab updates and the global editing UI are still future work.


**Q0200**

One storage notification adapter feeds both catalog consumers and active-project
reconciliation. A deterministic patterns-changed Application event updates only
present, preserves model past/future and invalidates a direct preview when its base
actually changes. Defaults follow the resolved project definition, then the catalog.
Missing/older definitions retain portable content; conflicts are reported. Other
project files update on opening, not through hidden filesystem writes. Notifications
and optimistic session guards do not constitute atomic multi-tab publication.
Production schema remains 12. Paper-space applications still require an explicit
view/output scale contract, independent of interactive camera zoom.


**Q0201**

Implemented contract: Creator pattern cells use local x-right/y-down coordinates.
The shared preview/committed SVG tile preserves those coordinates and anchors the
cell bottom-left at the application's model-space origin. It must not reflect local
line geometry again when mapping the model's y-up contour into SVG.


**Q0202**

Production schema 13 adds optional rotation in degrees to the hatch application,
not to the shared library definition. Positive angles rotate the complete pattern
lattice counter-clockwise around its application origin; contour geometry stays
unchanged. Domain validation accepts finite 0–360; Application actions normalize
360 to omitted zero, avoiding false model History entries. Strict ingress migration
of versions 1–12 preserves definitions and treats missing rotation as zero. Earlier
schemas reject the new field. Defaults, pickup, movement and global revision
reconciliation retain this application property. Paper-space scale remains pending
V07j and must not be inferred from camera zoom.


**Q0203**

Implemented: domain/pens owns strict named color/set/inventory data. Application/pens
validates catalog publication through a replaceable storage interface and project
palette assignment against a pinned snapshot. Interop owns local browser persistence.
Global here means one browser profile/origin across projects, not account/cloud sync.
Schema 14 embeds an optional owned palette snapshot; strict versions 1–13 migrate at
file ingress. Selecting a package never recolors model elements. User decision: element
colors remain independent HEX values after catalog changes or deletion. Inventory is
ordered and limited to ten existing unique pen IDs. Reapplying a package refreshes the
project snapshot; library writes never occur during project Undo/Redo.


**Q0204**

Shared ColorField/ColorPicker and FloatingPanel serve all existing color entry points;
free palette gestures remain local until release. Shared PropertyForm owns discrete
choice commits and text/number blur/Enter commits, cancels scheduled work on unmount,
and preserves Domain/Application validation. Incomplete values remain drafts. It does
not introduce alternative element mutation logic or remove confirmation from creation
editors, precision operations or AI proposals. Palette context is presentation state;
the project and Application actions remain authoritative. Browser visual acceptance
is still required; automated checks do not claim a verified pointer workflow.


**Q0205**

Implemented MS-02/V07k: shared rendering/viewport hatch tile derivation consumes
explicit model/paper display sizing through the common view-size resolver. Paper
width is internally metres and requires a ScaleContext. Pattern aspect ratio,
application origin and rotation remain stable; local stroke width compensates for
both tile scaling and camera pixels per metre. Production consumers still default
to model sizing. The isolated benchmark reuses the actual SVG component. Derived
sizing is not a second model and does not extend production schema 14.


**Q0206**

Binding user decision: working output scale is a persisted semantic-view setting
outside normal model Undo/Redo. Model undo must preserve the current view setting.
Persistence and legacy-file migration are the next bounded MS-03 task, not yet
implemented by this renderer pilot. Paper-mode product integration follows later.


**Q0207**

Application/views owns view-scale changes and resolved contexts. The editing reducer
publishes the validated setting without adding model history or clearing redo. Model
Undo/Redo preserves current working-view settings for the matching project/storey.
A changed project snapshot cancels stale editing previews under existing revision rules.
ViewportManager derives context from the project; there is no second session scale map.
Panes retain independent cameras. Presets are 1:50/100/200/500/1000/2500/5000; a separate
Individuell choice accepts strict 1:S input, committing with Enter or blur. Zoom and
model geometry remain unchanged. Paper hatch product integration is still pending.


**Q0208**

The generic metric resolver now lives in domain/views/display-size so Domain validation
and Application mode conversion share it without depending on Rendering. Rendering
adds camera conversion and the shared SVG tile. BimPlan retains a memoized semantic
scale context across pointer updates; both committed and draft hatches consume it.
Incomplete draft sizes cannot crash the canvas; commit/file ingress still reject them.
Project validation checks resolved cell extents at the stored view scale, including
finite arithmetic. Paper mode is available in 2D properties/defaults. No claim of a
physical printed output or paper-sized pen width is made; strokes remain 1 CSS pixel.


**Q0209**

application/views/working-context.ts resolves the existing working-plan binding,
project scale and shared visibility policy together. CadWorkspace memoizes by
immutable project/explicit override; panes and BimPlan consume the same context.
Camera and pointer updates do not recreate it. CadViewport rejects stale snapshots;
foreign project/storey and unknown target kinds fail at resolution. Explicit
visibility overrides retain their scope and never imply document persistence.
3D receives the existing visibility policy without a new 3D scale contract.
No schema or history changes; saved ModelViews/DrawingDocuments remain future work.
The resolver is independent of React and available to future typed query adapters.


#### Herkunft: DEVELOPMENT_GUIDE.md

Status: historische ungeordnete Prüfkandidaten, gegen zentrale aktuelle Einträge abzugleichen.


**Q0210**

Berechne die geometrische Grundfläche aus gültigen Polygonen. Kennzeichne sie
als geometrische Fläche; sie ist noch keine geprüfte Wohnfläche. Beginne mit
manueller Begrenzung über das gemeinsame Zeichen- und Fangsystem.


**Q0211**

Zwei Punkte können eine einzelne Messstrecke festlegen; daraus folgt noch keine
vollständige Höhenverteilung im Raum. Verwende für flächige Auswertung eine
definierte obere und untere Oberfläche. Berechne deren Höhenunterschied über
der Raumfläche und leite Höhenlinien beziehungsweise Flächenbereiche ab.
Ermögliche die Konfiguration im Raumeigenschaftenfenster.


**Q0212**

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


**Q0213**

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


#### Herkunft: DEVELOPMENT_PLAN.md

Status: historische ungeordnete Prüfkandidaten, gegen zentrale aktuelle Einträge abzugleichen.


**Q0214**

PR234 nach erfolgreicher GitHub-CI regulär zusammengeführt. Reiner Planungsauftrag:
[Codeabgleich und Ausschnittvertrag](docs/planning/SAVED_DRAWING_VIEWS.md).
Schema 16 hat noch keine gespeicherten ModelViews/DrawingDocuments. Gemeinsame
Größenauflösung und Sichtbarkeit existieren; ihre Verbindung ist derzeit über
Workspace, Viewport und Plan verteilt. Keine zweite Modell- oder Rendererstruktur
nötig. Architektur §29 präzisiert validierte Kontextauflösung, fehlende Referenzen
und unabhängige Filter. Historische Maßstabsangaben auf heutigen Stand gebracht.


**Q0215**

Offen bleiben Anfangsfilter, Crop-Bedienung und Dokument-Lebenszyklus/History;
Vorschläge sind ausdrücklich keine Nutzerentscheidungen. Keine Laufzeitänderung.
Dokumentation gegen genannte Codepfade geprüft, lokale Links und Diff geprüft.
Tests/Build nicht erneut ausgeführt: letzter Code-Nachweis PR234 mit 792 Tests,
Typprüfung und Build; diese Planung behauptet keine neue Funktionsabnahme.


**Q0216**

**Genau ein nächster Auftrag: MS-03 Arbeitsmaßstab persistent speichern.** Den
fachlichen Arbeitsgrundriss-Kontext mit seinem Maßstab in der Projektdatei speichern,
strikte Migration bestehender Dateien mit Standard 1:100 ergänzen und die bestehende
Application-Verwaltung anbinden. Gemeinsamer Maßstab je Ansicht, unabhängiger Zoom
je Fenster und Trennung vom Modell-Undo bleiben verbindlich. Öffnen/Speichern,
Altdateien, ungültige Daten und Modell-Undo nach Maßstabswechsel testen. Noch keine
Papiermodus-Freischaltung oder weiteren Ansichts-/Layouttypen in diesem Auftrag.


**Q0217**

Grenzen: nur sitzungsbezogen, keine Speicherung oder Änderung der Modell-History.
Noch keine Papiermuster-/Textdarstellung oder Druckfunktion. Andere fachliche
Kontexte sind im Kern auf Isolation geprüft; die aktuelle UI zeigt weiterhin das
vorhandene eine Geschoss. Fang-/Messalgorithmen erhalten keinen neuen Maßstabsinput;
kein neuer manueller Gesamt-Fang-/IFC-Abnahmelauf in diesem Schritt behauptet.


**Q0218**

Nutzer bestätigt beide Reviewempfehlungen und gibt PR229 ausdrücklich frei.
PR230 ist bereits in main; sein Stand wurde ohne History-Umschreibung in PR229
integriert. Interne Papierlängen sind verbindlich Meter, Ein-/Ausgabe in mm.
Der fachliche Ansichtskontext besitzt S; Bildschirmfenster referenzieren ihn
und besitzen unabhängigen Zoom. Zwei Fenster derselben Ansicht teilen S.
Initialwert 1:100 und Bedienung neben Zoom gelten; spätere persistente History
bleibt offen. Architektur, allgemeiner Vertrag, Schraffurplan und AGENTS verweisen
auf dieselbe Regel. Keine Produktionslogik oder Schemaänderung in diesem Abgleich.


**Q0219**

Offen bleiben Speicherort/History/Initialwert des Maßstabs der rohen Arbeitsansicht,
spätere effektive Layoutmaßstäbe sowie physische Druckstifte. Keine Nutzerentscheidung
dazu erfunden. Codeprüfung zeigt insbesondere die erforderliche Strichumrechnung
innerhalb skalierter SVG-Kacheln. Keine neuen Laufzeittests für reine Dokumentation;
Nachweis: Quelldateien/Formeln/relative Links geprüft, git diff --check sauber.


**Q0220**

PR226 und PR227 sind nach ausdrücklicher Freigabe zusammengeführt; geprüfte
Dateibasis entspricht main cbe54bf. Die älteren Offen-/Sandbox-Vermerke unten
beschreiben den damaligen Stand. Nach Neustart und Wechsel auf die vom Nutzer
gewünschte Windows-Sandbox unelevated funktionieren normale Shellzugriffe und
Browserautomation wieder. Vite benötigte weiterhin einen genehmigten Start
außerhalb der Sandbox (spawn EPERM innerhalb); keine pauschale Entwarnung für
alle Kindprozesse. Keine weitere Sicherheitskonfiguration verändert.


**Q0221**

Nachweise: 778 Tests bestanden, Typecheck und Produktionsbuild erfolgreich, vollständiger
Lint ohne Fehler (sechs bestehende Fast-Refresh-Warnungen). Neue Tests für Inventar/IDs,
Speicher-/Quota-/Konfliktfehler, portable Pakete ohne Bestandsumfärbung, Farb-Undo/Redo,
strikte Migration und HSV/RGB-Rundlauf. Keine automatisierte Browserabnahme: Sandbox-
Setup meldet Windows-Fehler 32 beim Öffnen von node_repl.exe für die ACL-Prüfung.
Eigener Sitzungsreset erfolglos; vier ältere Hilfsprozesse mit aktiven Eltern gefunden.
App-Neustart ist der nächste Diagnoseversuch, noch keine bestätigte Reparatur.


**Q0222**

**Genau ein nächster Auftrag:** Nach Codex-Neustart Sandbox und gemeinsame Farb-/
Eigenschaftenbedienung praktisch prüfen und diesen Schritt abnehmen. Anschließend
bleibt V07j Papiermaß-/Ansichtsmaßstab-Vertrag als fachlicher Folgeauftrag vorgemerkt.


**Q0223**

Ergänzung zu PR226 (weiterhin zur Prüfung offen): Im Creator verlaufen lokale
Y-Koordinaten nach unten. Die bisherige Plan-Kachel negierte diese nochmals und
spiegelte dadurch z. B. eine von links unten nach rechts oben gezeichnete Linie.
Der gemeinsame Renderer erhält jetzt die Orientierung der Zeichenzelle unverändert;
Vorschau und platzierte Schraffur verwenden denselben Kachelvertrag.


**Q0224**

Ein gemeinsamer Storage-Benachrichtigungsadapter aktualisiert das aktive Projekt
über den vorhandenen Resolver, ohne Modell-Undo-Schritt und mit erhaltenen Past-/
Future-Stacks. Tatsächliche Änderungen brechen veraltete direkte Vorschauen ab;
Werkzeugvorgaben folgen dem geprüften Projektstand bzw. der aktuellen Bibliothek.
Fehlende/ältere Muster erhalten die portable Darstellung, Konflikte bleiben sichtbar.
Andere Projekte übernehmen beim Öffnen; geschlossene Dateien werden nicht verändert.
Mehrtab-Benachrichtigung ist integriert, atomare parallele Publikation bleibt offen.
Projektformat bleibt 12. Modell-/Papiermaßwahl und Upload bleiben ausstehend.


**Q0225**

765 Tests bestanden; Typecheck, voller Lint ohne Fehler (sechs bekannte Warnungen)
und Produktionsbuild erfolgreich. Sieben neue Nachweise: Neuanlage-/Quota-/Undo,
gemeinsame Aktualisierung zweier Konturen mit erhaltener Modell-History, getrennte
Undo/Redo-Pfade, veraltete Entwürfe, Konflikte/fehlende Muster, Entwurfslinien und
Storage-Filter/Abmeldung. Browser-Sichtprüfung scheitert am Sandbox-Kernelstart.
Abnahme: Muster zweimal anwenden; Tools > Schraffurenverwaltung > Bearbeiten;
Name oder Linien ändern, Änderungen speichern. Beide Schraffuren aktualisieren.
Bibliothekspfeile prüfen; Füllfarbe im Projekt ändern und normales Undo prüfen.
Fenster schließen/öffnen: Bibliotheks-History bleibt. Kopie/Neuer Entwurf prüfen.


**Q0226**

Gemeinsame Application-Auflösung integriert in Projektöffnung, Projektübernahme und
Undo/Redo. Browser-Storage wird vor Dispatch im Adapter gelesen; Reducer und Domain
bleiben deterministisch. Neuere Bibliotheksstände werden übernommen, fehlende/ältere
erhalten eingebettete Inhalte. Gleiche Revision mit anderem Inhalt meldet Konflikt
und erhält die Darstellung. Beschädigte Bibliothek blockiert das Projekt nicht.
Projekt-Undo erhält auch ohne Bibliothek neuere bekannte Definitionen desselben
Projekts. Öffnen bleibt ein Undo-Schritt; Musterabgleich erzeugt keinen zusätzlichen
Schritt und schreibt niemals in die Bibliothek. Neue globale Bearbeitungs-UI und
automatische Aktualisierung aller offenen Tabs bleiben ausstehend.


**Q0227**

758 Tests bestanden; Typecheck und Produktionsbuild erfolgreich. Lint ohne Fehler,
sechs bekannte Fast-Refresh-Warnungen. Praktische Browser-Abnahme noch offen.
Fünf neue Tests:
Migration 11→12/unbekannte Herkunft, Dateirundlauf, Öffnen als eine Transaktion,
Undo/Redo mit fehlender Bibliothek, Konflikte/ältere Stände und ungültige Revisionen.
Runtime-Fixtures auf Version 12 aktualisiert; frühere Eingabeformate bleiben strikt.
Windows-Zeilenenden aus dem Schreibskript korrigiert; keine fachfremden Teständerungen.
Praktische Abnahme: vorhandene Musterschraffur speichern, öffnen, Darstellung prüfen;
Füllfarbe ändern, Undo/Redo, erneut speichern/öffnen. Automatisch neuere Muster lassen
sich nach Anbindung der Bibliotheksbearbeitung praktisch erzeugen und prüfen.


**Q0228**

746 Tests bestanden; Typecheck, voller Lint ohne Fehler (sechs bekannte Warnungen),
Produktionsbuild. Neue Nachweise: gemeinsame Definition zweier Konturen (auch konkav),
Migration 10→11, unabhängige Koordinaten, atomarer Undo/Redo, Dateirundlauf, gleiche
Einzel-/vorbereitete Gruppenbewegung, Reshape-Ursprung, Stale-/Konflikt-/Referenzschutz,
Vorgabenübernahme mit neuem Ursprung. Alte Migrationstests bleiben strikt.
Browserverbindung scheitert weiter am Sandbox-Start; praktische Sichtprüfung offen.
Abnahme: Muster unter Tools anlegen; Schraffurwerkzeug > Muster wählen, zeichnen;
vorhandene Schraffur > Muster wählen > Übernehmen. Zoomen, verschieben, Ecke bewegen,
Undo/Redo, speichern/öffnen. Vollfläche wählen: Muster weg, alte Farben bleiben.


**Q0229**

**Genau ein nächster Auftrag: V07g Revisions- und Bibliotheks-History-Kern.**
Bibliotheksformat v1 ohne Verlust auf monotone Revisionen erweitern; gemeinsame
validierte Bearbeiten-/Undo-/Redo-Aktionen und zentrale projektseitige Auflösung als
begrenzten Domain-/Application-Piloten testen. Neuere Revision automatisch übernehmen,
fehlende/ältere Bibliothek erhalten, gleiche Revision mit anderem Inhalt melden;
Bibliotheks-Undo veröffentlicht neue Revision. Noch keine automatische UI-/Tab-
Synchronisation, Papiermaß oder Upload. UI-Anbindung folgt nach diesem Kernnachweis.


**Q0230**

PR221 (38b571e) nach Nutzerfreigabe mit erfolgreicher GitHub-CI zusammengeführt.
Hatch-Schema, previewHatch/commitHatch, Projektmigration/-History, Renderer und
Bibliothek geprüft. Projektformat 10 hat noch keine Mustertabelle/Referenz;
kein implementierter Ansichts-Ausgabemaßstab. Papiermaß benötigt diesen, Zoom
ersetzt ihn nicht. Keine neue Codefunktion oder Dateimigration in diesem Auftrag.
Nutzerantworten: neue Muster beim Öffnen älterer Projekte automatisch übernehmen;
eigene Bibliotheks-Undo/Redo-History, Projekt-Undo nur Modellzuweisung/-änderung.
Vertrag dokumentiert: portable Definitionstabelle, stabile Referenzen/Anker,
Modell-/Papiermaß, künftige monotone Revisionen und automatische zentrale Auflösung,
keine Downgrades oder stille Konfliktersetzung. Bibliotheks-Undo als neue Revision;
Projekt-Undo darf globale Aktualisierung nicht durch alte Snapshots zurückdrehen.
Details und Nachweise in docs/planning/HATCH_PATTERN_LIBRARY.md (V07e).
Dokumentations-Diff geprüft; 741 Tests/Build und CI stammen vom PR221-Commit,
nicht erneut ausgeführt. Praktische V07d-Abnahme bleibt im Browser offen.


**Q0231**

**Genau ein nächster Auftrag: V07f portabler Modellmaß-Pilot.**
Muster in Werkzeugeigenschaften vorhandener Schraffuren zuweisen/entfernen und
als neue Werkzeugvorgabe übernehmen; verwendete Definition einmal im Projekt
speichern, Migration und Referenzen prüfen. Begrenzte geklippte Darstellung,
Anker bei Bewegung, Undo/Redo und Dateirundlauf ohne lokale Bibliothek nachweisen.
Keine globale Musterbearbeitung, Papiermaß, Revision-Synchronisation, Upload oder
Layout in diesem Piloten. Diese geforderten Erweiterungen bleiben offen.


**Q0232**

PR220 nach Nutzerfreigabe mit erfolgreicher GitHub-CI zusammengeführt.
Eigene Muster aus dem Creator erhalten stabile IDs und Namen. Application lädt
und speichert die validierte Bibliothek über einen austauschbaren Storage-Adapter.
In diesem Schritt: projektübergreifend innerhalb eines Browserprofils/Origins, nicht Geräte
oder unterschiedliche Ports hinweg. Versioniertes Bibliotheksformat 1, maximal
100 Definitionen und 256 Linien je Muster, begrenzte serialisierte Datenmenge.
Liste mit kleinen Vorschauen, Speichern und Laden als neuer Entwurf. Neue
Definitionen erhalten neue IDs; bestehende Definitionen werden nicht geändert.
Schreib-/Lesefehler, beschädigte Daten und unbekannte Versionen werden gemeldet;
kein automatisches Überschreiben oder Rücksetzen. Kein Projektformatwechsel,
keine Änderung des BIM-Undo. Upload und Musteranwendung noch nicht enthalten.
741 Tests bestanden, Typecheck, voller Lint ohne Fehler (sechs bekannte Warnungen),
Produktionsbuild. Nachweise: Wiederladen mit frischem Adapter, Datenkopien,
Zusammenführen weiterer gespeicherter Definitionen, ungültige Eingaben/Limits,
beschädigte Daten und Speicherfehler ohne Verlust des bisherigen Payloads.
HTTP 200 auf 8080; visuelle Abnahme offen, Browsersteuerung beendet Node-Prozess.
Abnahme: Tools > Schraffurenverwaltung, Linie zeichnen, Muster benennen/speichern;
Browser neu laden: Vorschau bleibt. Als neuen Entwurf öffnen, ändern, unter neuem
Namen speichern: beide Definitionen bleiben. Anderes Projekt öffnen: Liste bleibt.


**Q0233**

Eigene SVG-Muster verwenden eine explizite Umrechnung der System-Strichstärke
in Musterkoordinaten statt non-scaling-stroke innerhalb der Musterkachel.
Farbe veränderbar im Linien Creator ist standardmäßig aktiv (auch für alte
Definitionen). Deaktiviert: Musterfarbe verbindlich, Farbauswahl gesperrt,
abweichende Projektaktionen durch gemeinsame Validierung abgewiesen.
736 Tests bestanden; Typecheck, Lint ohne Fehler (sechs bekannte Warnungen),
Produktionsbuild erfolgreich. Neue Tests: Farbfreigabe, Ablehnung abweichender
Farbe, JSON-Roundtrip und Strichstärke bei Zoom/Mustergrößen.
Praktische Abnahme offen: Browsersteuerung startet derzeit nicht. Prüfen:
rote eigene Linienart mit gesperrter Farbe speichern, auswählen, zeichnen,
abwählen und zoomen; entsperrte Linie muss weiterhin umfärbbar sein.
Folgeauftrag bleibt V07d globale lokale Schraffurmusterbibliothek.
##### Linieninventar am Linienwerkzeug - 09.10.2026


**Q0234**

PR217 und PR218 mit erfolgreicher CI zusammengeführt; PR218 zuvor auf main
umgestellt. Aktualisierte R26-Produktroadmap gelesen, laufenden Auftrag erhalten.
Nutzerentscheidungen: eigene Linienmuster im Modellmaß, bestehende Linien behalten
Muster bei Kataloglöschung. Inventar in Werkzeugeigenschaften für Zeichnen und
Inspector verfügbar; eigener Musterabstand in Metern (Vorgabe 1 m) editierbar.
Gemeinsame Application-Vorgaben und 2D-Übernahme enthalten portable Definition.
Schema 10: validierte Definition und Wiederholungslänge je custom-Linie; Dateien
1–9 migrieren am Dateirand, alte Stricharten behalten ihre Darstellung. Katalog-
Löschen/Ändern schreibt keine bestehenden Projektlinien um. Ein vorhandener Stil
außerhalb des Inventars bleibt als aktueller Wert sichtbar und erhalten.
SVG-Muster wiederholen ohne zusätzliche Modellpunkte oder unbeschränkte erzeugte
Segmente; Phase läuft über Polylinienecken weiter. Bibliotheks-/Geometrievalidierung
in Domain, Inventar/Defaults in Application, Darstellung abgeleitet.
734 Tests, Typechecks, voller Lint ohne Fehler (sechs bekannte Warnungen), Build.
Neue Nachweise: Schema-9-Migration, JSON-Roundtrip nach Kataloglöschung, atomarer
Undo, gemeinsame Erstellung/Übernahme, ungültige Musterlänge und lineare Ableitung
bei sehr dichter Wiederholung. Praktischer Browser-Test weiter blockiert: Steuerung
beendet den Node-Prozess vor Zugriff. Visuelle Muster-/Stiftprüfung ist offen.
Abnahme: Inventarart wählen, Musterlänge 0,25 m, Linie/Polylinie zeichnen; zoomen,
Wert ändern, rückgängig; speichern/öffnen; Katalogart löschen, bestehende Linie bleibt.


**Q0235**

Nutzer korrigiert bisherigen Umfang: alle Katalogarten bearbeiten/löschen,
Neue Linienart öffnet Zeichenfeld mit eigener Struktur, Farbe, Name. Zusätzlich
oben Inventar mit maximal zehn ausgewählten Katalogarten, später fürs Linienwerkzeug.
Umgesetzt: zeichnbare Segmentstruktur mit Wiederholungsperiode, gemeinsamer Fang,
Shift-Richtung, Vorschau, Abbrechen und letzten Abschnitt entfernen. Standardarten
editier-/löschbar in der Bibliothek; bestehende Projektlinien bleiben unverändert.
Bibliothek v2 und Inventar atomar gespeichert, v1 beim Laden ohne Schreiben migriert.
Bis zu 100 ältere eigene Arten plus drei Standardarten bleiben ladbar. Keine
Projektmigration oder Linienwerkzeuganbindung in diesem UI-/Bibliotheksschritt.
730 Tests einschließlich Migration, Geometrie/Farbe, Inventarlimit, Persistenz,
Löschen und Schreibfehler bestanden; Typecheck/Lint/Build. Browser-Abnahme offen.
Abnahme: vorhandene Art bearbeiten, Farbe und Struktur ändern, speichern; neue Art
über Button zeichnen; Inventar füllen (max. zehn), Art löschen, neu laden prüfen.


**Q0236**

Nutzer präzisiert: eigenständiger Tools-Eintrag Linien Creator für Linienarten,
Vorschauen, Löschen, Bearbeiten, Anlegen. Schraffurenverwaltung bleibt separat.
Erster Creator: Standardarten (geschützt) und eigene positive Strich-/Lückenfolgen;
Application-Validierung, austauschbarer Storage-Adapter, browserprofil-/originlokale
projektübergreifende Speicherung. Kein Projektformatwechsel. Eigene Arten sind
noch nicht im Linienwerkzeug auswählbar; Symbolmuster noch nicht implementiert.
Umlaute/Zellhöhe/Rückgängig und Sonderzeichen im Muster-Creator korrigiert.
726 Tests, Typecheck, voller Lint ohne Fehler (sechs bestehende Warnungen), Build.
Browser-Abnahme weiterhin offen. Praktischer Test: Tools > Linien Creator,
Name und 8 5 2 5 eingeben, speichern, bearbeiten, schließen/öffnen und neu laden,
eigene Art löschen. Tools > Schraffurenverwaltung bleibt Flächenmuster-Creator.


**Q0237**

Nutzerentscheidungen: globale projektübergreifende Musterbibliothek; Modell-/
Papiermaß bei Schraffuren in Werkzeugeigenschaften wählbar; Musteränderungen
aktualisieren gemeinsam alle Anwendungen. Architektur und Fachvertrag ergänzt.
Uploadformat weiter offen. Einbettung verwendeter Definitionen, Offline-/
Revisionsabgleich und projektübergreifendes Undo sind technische Vorschläge,
keine implementierte Synchronisation. Creator-Abnahme weiterhin offen.
PR215: CI-Formatierungsfehler behoben; voller lokaler Lint ohne Fehler
(sechs bestehende Fast-Refresh-Warnungen). Produktionscode sonst unverändert.


**Q0238**

PR214 mit erfolgreicher CI zusammengeführt. Tools > Schraffurenverwaltung öffnet
einen isolierten Linienentwurf mit rechteckiger Zelle, gemeinsamer Fangabfrage,
Shift-Richtung und abgeleiteter 3x3-Wiederholung. Eigener Entwurfs-Undo, keine
BIM-Änderung und keine Änderung des Projektdateiformats. Zellmaße 0,001–100 m,
maximal 256 Linien, endliche Punkte innerhalb der Zelle, keine Nullsegmente.
722 Tests bestanden; Typecheck, gezielter Lint und Build bestanden.
Praktische Browser-Abnahme offen: Browser-Sandbox startet nicht (setup refresh).
Abnahme: Tools > Schraffurenverwaltung; zwei Linien zeichnen, Zelle vergrößern,
3x3-Vorschau prüfen, Entwurf rückgängig, schließen; Projekt unverändert.
Upload und persistente Bibliothek sind noch nicht implementiert. Empfehlung:
CAD-PAT zuerst, eingeschränktes SVG später, Rasterbilder als eigene Texturen.
Das ist keine verbindliche Formatentscheidung des Nutzers.


**Q0239**

Nutzer bestaetigt praktische 2D-Abnahme; V06 abgeschlossen fuer heutige Typen.
Neue Anforderung: Tools > Schraffurenverwaltung, Liste/Vorschauen, Linien-Creator
mit Wiederholung und Musterupload. Uploadformat offen, Nutzer recherchiert.
[Architektur, offene Entscheidungen und Abnahme](docs/planning/HATCH_PATTERN_LIBRARY.md).


**Q0240**

PR212 nach gruener CI zusammengefuehrt. Wand-Uebernahme im Grundriss: Staerke,
Hoehe, Koerperversatz/Achslage und Ebene. Werte in Werkzeugeigenschaften editierbar.
Wandkette pinnt eine eigene Vorgabenkopie. Schnelle und volle Vorschau sowie
Erstellung verwenden diese Werte. Neue IDs/Punkte, keine Quellfenster/-anschluesse.
719 Tests bestanden, einschliesslich exaktem Vergleich der ersten und zweiten
Abschnittsvorschau mit dem Vollpfad. Typecheck, gezielter Lint und Build bestanden.
Browser-Steuerung weiter durch Sandbox-Startfehler blockiert; Linien- und
Wandabnahme praktisch offen. Abnahme: Wand zweimal rechts anklicken, Werte
pruefen/aendern, freie Kette mit zwei Abschnitten zeichnen/abschliessen, Undo:
gesamte neue Kette weg, Quelle bleibt bestehen.


**Q0241**

**Genau ein naechster Auftrag: V06a Werkzeugvorgabenuebernahme fuer Schraffuren
vorbereiten.** Vorhandene Defaults/Erstellungsaktion abgleichen; Eigenschaftenumfang
mit Nutzer festlegen (Vorschlag: Fuellung, Hintergrund, Kontur, Ebene; keine IDs,
Punkte oder Verknuepfungen). Gemeinsame Vorgaben-Grenze konkretisieren. Noch keine
stillschweigende Entscheidung ueber offene Eigenschaften oder andere Werkzeuge.
Offene K-/V-Ziele bleiben erhalten.


**Q0242**

**Genau ein naechster Auftrag: V01b temporaere Flaechenmessung in 2D.**
Punktfolge mit gemeinsamem Fang-/Interaktionspfad erfassen, per Doppelklick schliessen,
Quadratmeter anzeigen und ungueltige Konturen behandeln. Kein Raum-/Schraffurmodell,
kein Undo-Eintrag. Winkel und dauerhafte Massketten bleiben spaeter. Offene K-/V-
Anforderungen und Leistungsgrenzen bleiben bestehen.


**Q0243**

PR202 nach gruener CI zusammengefuehrt. Projizierter Kandidatenindex: 180
Browservergleiche und 697 Tests bestanden; Typecheck/Lint/Build erfolgreich.
500 Waende: Abfrage ca. 0,1 statt 19,5-20,5 ms, aber Vorbereitung 42-57 ms je
Projektion. Daher noch keine Produktintegration.
[Nachweis und Entscheidung](docs/performance/PROJECTED_PICKING_PILOT.md).


**Q0244**

**Genau ein naechster Auftrag: K07e isolierter Picking-Pilot.** Trefferkandidaten
pro angezeigter Projektion vorbereiten; Wand/Fenster-ID, Tiefe, Verdeckung und
Kontextwechsel gegen Vollscan pruefen. Noch keine produktive Picking-Umstellung.
Andere K-/V-Ziele bleiben erhalten.


**Q0245**

PR199 nach gruener CI zusammengefuehrt. Isolierter WebGL-Pilot mit einmaligem
Geometriepuffer, gemeinsamer Projektionsmatrix. 180 Bildvergleiche bestanden,
maximal zwei abweichende Pixel. 695 Tests, Typecheck, Lint und Build bestanden.
500 Waende / eine Ansicht: CPU-Draw 72,3 ms versus nahe Timeraufloesung 0,1 ms.
Kein GPU-/Framezeitnachweis, noch keine Produktumstellung.
[Nachweis und Grenzen](docs/performance/SOLID_MATRIX_PILOT.md).


**Q0246**

**Genau ein naechster Auftrag: K07b isolierter Kameramatrix-/Geometriepuffer-Pilot.**
Bestehenden WebGL-Pfad verwenden; unveraenderte Weltgeometrie wiederverwenden,
Projektion/Tiefe/Oeffnungen/IDs gegen bisherigen Pfad vergleichen. Noch keine
Produktumstellung oder Picking-Neuschreibung. Andere K-/V-Ziele bleiben erhalten.


**Q0247**

**Genau ein naechster Auftrag: K06b isolierter Pilot fuer Bewegung der ersten
Wand einer freien Eckkette.** Stationaere Ableitungen wiederverwenden, fachliche
Grenze gegen Vollpfad beweisen; Fenster/Fremdendpunkte und konservativen Fallback
pruefen. Noch keine produktive Anbindung. K-/V-Ziele bleiben erhalten.


**Q0248**

**Genau ein naechster Auftrag: K04g isolierter Pilot fuer den zweiten
rechtwinkligen Abschnitt einer freien Wandkette.** Bestehende Eckregeln,
Vollpfadvergleich und konservativer Fallback bei Fremdkontakt/T-Kandidaten.
Noch keine produktive Erweiterung. Andere K-/V-Ziele bleiben erhalten.


**Q0249**

**Genau ein naechster Auftrag: K04e isolierter vorbereiteter Pilot fuer den ersten
freien Wandabschnitt.** Bestehende Fachregeln, Vergleich gegen Vollpfad,
konservativer Fallback bei Anschlusskandidaten/ungeprueften Bedingungen.
Noch keine produktive Anbindung oder Ketten-Ausweitung. Bestaetigung bleibt
vollstaendig geprueft, ein Undo. Andere K-/V-Ziele und manuelle Shift-Abnahme bleiben.


**Q0250**

PR186 nach gruener CI zusammengefuehrt (main 335546a). Acht Browser-API-Faelle,
je 20 Ziele: 100/1.000 Elemente, ohne/mit T-Gruppen, ohne/mit Shift. Vorschau,
Bestaetigung und Undo/Redo stimmen ueberein. [Befund und Grenzen](docs/performance/WALL_ENDPOINT_PROFILE.md).
Bei 1.000 Elementen Vorschau ca. 3 ms ohne Anschluesse und 8-9 ms mit T-Gruppen;
Fang/Shift ca. 0,1 ms. Kein DOM-/Renderer-Latenznachweis, Shift-Ruckeln bleibt offen.
670 Tests, Typechecks, Build und Lint bestanden (sechs bekannte Warnungen).


**Q0251**

JPEG→PNG/Base64 wächst im Test stark; Referenzserie scheitert an Gesamtdateigrenze.
Mit drei Bildern kosten kleine Änderungen inklusive History mehrere hundert ms.
Heapwerte sind Stichproben, kein Peak-/GPU-Nachweis; keine allgemeine Großprojekt-
Freigabe. Zusammenhängender 100-Wand-Zug bestätigt 100 betroffene Wände bei Einzel-
bewegung. Reale Großpläne/3D-Navigation/Spitzenspeicher bleiben zu prüfen.


**Q0252**

PR174 ist zusammengeführt (main f5100cd). Die gespeicherte Nutzeraufnahme zeigt
häufigere lange RAF-Abstände mit Shift. Der kontrollierte Vergleich belegt
zusätzliche React-Commits durch Auto-Repeat: 481 statt 241 bei 240 Mausupdates.
Der gemeinsame Tastatureingang verwirft jetzt unveränderte Wiederholungen:
240 Commits, reine Wiederholungen ohne Mausbewegung verursachen keine Berechnung.
[Messung, Rohberichte und Einschränkungen](docs/performance/SHIFT_REPEAT_INPUT.md).
644 Tests, beide Typprüfungen, Build und Lint (6 bekannte Warnungen) bestanden.
Zwei Shift-Läufe und ein freier Lauf bestehen Vollpfadvergleich und Bedienprüfung.
Ein erster Konturvergleich schlug einmal fehl; seine Ursache bleibt offen.
Keine vollständige Behebung des sporadischen Ruckelns behauptet.


**Q0253**

**Genau ein nächster ausführbarer Auftrag:** Den einmaligen Konturvergleich mit
jetzt vollständiger Ist-/Soll-Fehlermeldung reproduzieren und klären; anschließend
die reale Shift-Bewegung praktisch abnehmen. Die atomare Bestätigung bleibt
nachgeordnet. Keine weitere spekulative Optimierung und noch keine Übernahme.


**Q0254**

PR173 nach Nutzerfreigabe mit grüner CI zusammengeführt (`main` 5206295).
Die separate Diagnoseseite kann jetzt echte Pointer-/Shift-Ereignisse, vorhandene
Berechnungsphasen, React-Commits, RAF-Abstände und lange Hauptthread-Aufgaben
aufzeichnen. Start/Stopp, 30-Sekunden-Grenze, maximal 10.000 Einträge und JSON-Export;
kein neuer Modellpfad und keine Änderung der Produktionsoberfläche.
[Anleitung, Nachweise und Grenzen](docs/performance/MANUAL_MOVEMENT_TRACE.md).
644 Tests bestanden, Typprüfungen/Lint/Build erfolgreich. Der Shift-Aussetzer
ist weiterhin offen; die Bedienprüfung bestätigt den Recorder, keinen Bugfix.


**Q0255**

PR172 nach Nutzerfreigabe zusammengeführt (`main` 0bc64aa). Praktische
Auswahlbewegung bestätigt, jedoch sporadisches Stehenbleiben mit Nachspringen
bei Shift gemeldet: zwei T-verbundene Wände mit zwei Fenstern.
[Diagnose und Rohmessungen](docs/performance/SHIFT_SELECTION_DIAGNOSIS.md).
Der separate Browser-Harness prüft jetzt gehaltenes Shift, diese Konstellation,
explizite Vierfachauswahl und kontinuierliche Eingaben. Geometrievergleich,
Shift/Tab, Abbruch, Platzierung und ein Undo/Redo bestanden. Ein langer
RAF-Abstand von 236 ms trat einmal auf; Wiederholungen maximal 35 ms.
Ursache noch nicht zugeordnet, kein Produktfix behauptet. A-04 bleibt offen.


**Q0256**

**Genau ein nächster ausführbarer Auftrag:** Nach praktischer Pilotabnahme die
Vorbereitungs- und Bestätigungskosten derselben Auswahlbewegung getrennt
profilieren und doppelte Aktionsauswertung zwischen `validate` und `commit` in
eine atomare gemeinsame Bestätigung überführen. Volle Modellprüfung am
History-Übergang, Kontextschutz, Vergleich zum Vollpfad und genau ein Undo bleiben
verbindlich. Keine pauschale Migration weiterer Werkzeuge in diesem Schritt.
A-04 bleibt insgesamt offen; A-01-Messlücken und A-05/A-06/A-07 bleiben bestehen.


**Q0257**

ARCHITECTURE.md trennt nun ausdrücklich den bestehenden Stand von der
verbindlichen Migrationsrichtung: vorbereitete gemeinsame Aktion, betroffene
Vorschau über stabiler Basis, wiederverwendete Anzeige und volle Absicherung
beim Commit. Keine neue Bedienregel, kein zweites Modell, kein History-/Datei-
Komplettumbau. Die bisherigen Anforderungsmatrizen und Nutzerwünsche bleiben gültig.
A-04 bleibt offen; A-01 hat weiterhin Messlücken, A-05/A-06/A-07 bleiben offen.


**Q0258**

[Messbericht](docs/performance/SELECTION_PREVIEW_REUSE.md): In sechs Faellen mit
je 21 Mauspositionen genau eine statt zwei Vollvalidierungen. Mit PNG sinken die
Mediane bei 100/1000/5000 Elementen von 514/741/1603 auf 261/371/1235 ms.
Alle sechs Ablaufe bestehen Vorschau, Abbruch, Platzierung, Undo und Redo.
633 Tests, Typpruefung und Build bestanden; Lint: 0 Fehler, 6 bekannte Warnungen.
A-04 bleibt offen: Vollvalidierung und Darstellung grosser Projekte sind teuer.
A-01-Messluecken fuer reale/dichte Faelle und Hardwareeingabe bleiben bestehen.


**Q0259**

[Messbericht](docs/performance/IMAGE_URL_REUSE.md): derselbe Browser-Parcours,
sechs Faelle mit je 21 Stichproben, identische ViewBoxes und Pointerziele.
Mit PNG sinkt der Median bis zur Vorschau bei 100/1000/5000 Elementen von
1050/1291/2085 auf 514/741/1603 ms (rund 51/43/23 Prozent). Wiederholte
Bild-URL-Dekodierung entfaellt bei warmem Cache. Kaltes Laden bleibt unveraendert.
Ohne PNG keine relevante Aenderung des Codepfads; Messschwankungen bleiben.
Alle sechs Ablaufe mit Vorschau, Abbruch, Platzierung, Undo und Redo bestanden.
628 Tests, Typpruefung und Build bestanden; Lint: 0 Fehler, 6 bekannte Warnungen.
A-04 bleibt offen: zwei Vollvalidierungen je Vorschau und teure Wandableitungen
bestehen weiterhin. A-01-Messluecken fuer reale/dichte Faelle bleiben bestehen.


**Q0260**

PR168 freigegeben und zusammengefuehrt. Der begrenzte Messauftrag A-01/A-04
ist abgeschlossen; keine neue Produktfunktion oder Vorschauoptimierung in diesem Schritt.
[Messbericht](docs/performance/ACTIVE_MOVEMENT_PROFILE.md) und sechs Einzelberichte
mit je 21 Stichproben dokumentieren den realen gemeinsamen Handler-/Renderpfad
mit synthetischen DOM-Ereignissen (keine Messung von Hardware- oder GPU-Latenz).


**Q0261**

Alle sechs Faelle: 20 Waende ausgewaehlt, Vorschau angezeigt, Escape ohne History,
Platzierung, genau ein Undo und Redo bestanden. 623 Tests, Typpruefung und Build
erfolgreich; Lint ohne Fehler mit 6 bekannten Warnungen. Diagnosecode fehlt im
Produktionsbundle. A-01 bleibt fuer reale Projekte, dichte/Kontur-Faelle, Hardware-
Pointer und Peak-/GPU-Speicher offen. A-04 ist vermessen, noch nicht optimiert.


**Q0262**

623 Tests, TypeScript inklusive Diagnose und Build bestanden; Lint ohne Fehler,
6 bekannte Warnungen. Browser-Abnahme: unzulaessige Eckhoehe abgewiesen;
Fensterbreite 1,2 -> 1,4 m, Undo -> 1,2 m, Redo -> 1,4 m bestaetigt.
A-01 bleibt mit seinen ausgewiesenen Messluecken offen.


**Q0263**

A-01 ist ein Teilnachweis: aktive Pointer-bis-Bild-Vorschau, Kontur-/Dichte-
Browserregressionen, echte Nutzerprojekte und Peak-/GPU-Speicher bleiben offen.
ConnectedWallSolids besitzt bereits einen Snapshot-Cache; A-04 muss neue Vorschau-
Snapshots und unveraendertes Modell unterscheiden. Keine pauschale Speicher-Kopiebehauptung.


**Q0264**

Stand der Prüfung: `main` am 07.10.2026. Die Prioritäten gelten für die
Architekturarbeiten; der unten dokumentierte Auftrag zur Bewegung von
Bildreferenzen bleibt der festgelegte Funktionsauftrag. Größere Umbauten
folgen erst auf Messungen mit realen Projekten. Die Checkboxen zeigen den aktuellen Stand; ein Codebefund allein belegt
noch keinen spuerbaren Browser-Engpass.


**Q0265**

- [ ] **A-01 Browser-Baseline für große Projekte.** Reproduzierbare Szenarien
  mit etwa 100, 1.000 und 5.000 Elementen sowie ohne und mit eingebetteten
  PNG/JPEG-Referenzen nahe der heutigen 10-MiB-Projektgrenze anlegen.
  Auswahl/Eigenschaften, Pointer-Vorschau, Commit, Undo/Redo und
  JSON-Laden/Speichern messen; Median/P95 und Speicherbedarf samt Browser,
  Testdaten und Messmethode dokumentieren. Auch viele verbundene Wände und
  ausgewählte Gruppen aufnehmen. **Abnahme:** Eine Vergleichsbasis macht
  sichtbar, welcher Pfad tatsächlich bremst; Wiederholung nach Änderungen
  zeigt denselben Ablauf ohne Funktionsverlust.
- [x] **A-02 Eigenschaftsformulare ohne vollständige JSON-Schlüssel.** In
  `CadWorkspace` werden Formzustände derzeit über
  `JSON.stringify([selection, project])` geschlüsselt (zwei Stellen). Einen
  stabilen Schlüssel aus Auswahlidentität und passender Modellrevision
  verwenden, ohne das gesamte Projekt bei jedem Render zu serialisieren.
  **Abnahme:** Auswahlwechsel, Bearbeitung, Undo/Redo sowie Ebenen- und
  Referenzänderungen aktualisieren die Formulare korrekt; der große
  Serialisierungsschritt entfällt. Die isolierte Messung von etwa 10 ms für
  5 MiB ist ein Hinweis, kein gemessener Browserwert.


**Q0266**

- [x] **A-03 Validierung und History auf Kosten prüfen.** Beim Commit werden
  aktuell das gesamte Projekt validiert, verbundene Wandkörper abgeleitet und
  ein JSON-Snapshot für den Vergleich erzeugt. Besonders eingebettete
  Bilddaten in der A-01-Messung betrachten. Nur bei nachgewiesenem Engpass
  den Commit-/Vergleichspfad begrenzt optimieren, etwa durch stabile
  Änderungsidentitäten oder wiederverwendbare, unveränderliche Daten.
  **Abnahme:** Ungültige und veraltete Aktionen bleiben gesperrt; Undo/Redo,
  Dateiroundtrip und Projektvalidierung liefern dieselben Ergebnisse.
  Keine pauschale Aussage über 100-fach kopierte Bilder im Speicher treffen.
- [ ] **A-04 Vorschauen lokal halten.** `previewWallChain` und
  `previewSelectionMove` können bei Pointerbewegungen ganze
  Projektprüfungen auslösen; `BimPlan` berechnet verbundene Wandkörper
  für die Anzeige. Mit A-01 die Kosten bei vielen Wänden, Öffnungen und
  Mehrfachauswahl prüfen. Wenn relevant, Vorschau auf betroffene Elemente
  und gültige Sitzungs-/Projektversion begrenzen oder Ableitungen cachen;
  beim endgültigen Commit vollständig absichern. **Abnahme:** Messbarer
  Rückgang der Pointer-Latenz ohne andere Vorschau, veraltete Ergebnisse
  oder geänderte Commit-/Undo-Semantik.


**Q0267**

- [ ] **A-05 Importzyklus der Kontur-/Offsetlogik auflösen.**
  `src/application/direct-edit/offset.ts` und `contour.ts` importieren
  einander. Gemeinsame reine Hilfslogik an eine eindeutige Stelle verschieben.
  **Abnahme:** Kein gegenseitiger Runtime-Import; Offset- und
  Konturfunktionen einschließlich Grenzfällen verhalten sich wie zuvor.
- [ ] **A-06 Projektgröße und Bildspeicherung entscheiden.** Die aktuelle
  10-MiB-Dateigrenze, eingebettete Base64-Bildreferenzen und das
  16-Megapixel-Pixelbudget anhand realistischer Projekte und A-01 bewerten.
  Bilddateien sollen künftig wahlweise als externe Referenz verknüpft werden
  können; eingebettete Referenzen und vorhandene Schema-9-Projekte bleiben
  nutzbar. Logische Asset-/Referenz-IDs und ihre Platzierung dürfen nicht vom
  Dateipfad abhängen. Fehlende oder verschobene Dateien müssen erkennbar und
  gezielt neu verknüpfbar sein. Für die vollständige Weitergabe muss ein
  portables Projektpaket die benötigten Referenzdateien mitnehmen.
  Speicherformat, Auflösung von Dateipfaden, Budgets und Grenzen erst nach
  Messungen an realistischen Projekten festlegen; das 10-MiB-Limit nicht
  pauschal erhöhen. **Abnahme:** Import, Speichern, Öffnen, Wiederverknüpfen
  und Weitergabe funktionieren mit dokumentierten Grenzen; Browser sowie
  eine spätere Windows-/macOS-Desktop-Hülle nutzen dieselbe Projektlogik und
  getrennte Dateizugriffsadapter. PDF-Import ist eine eigene künftige Funktion.
- [ ] **A-07 Große UI-Module schrittweise entlasten.** `CadWorkspace`
  (rund 1.200 Zeilen) und `BimPlan` (rund 1.460 Zeilen) bei konkreten
  Änderungen in kleine Verantwortlichkeiten schneiden; Geometrie und
  Projektzustand in bestehenden Domain-/Application-Grenzen halten.
  **Abnahme:** Kein zweites editierbares Modell im React-State; sichtbares
  Verhalten und Regressionstests des jeweils bearbeiteten Werkzeugs bleiben
  erhalten. Kein pauschaler Komplettumbau.


**Q0268**

Abnahme: Bild anklicken > Element frei bewegen > Ursprung anklicken > Ziel
anklicken oder Winkel/Laenge eingeben. Danach Wand mit Strg/Cmd dazunehmen und
Auswahl frei bewegen. Undo muss jeweils die gesamte Bewegung zuruecknehmen.
Keine Bildinhalts-Fangpunkte, keine freie Drehung oder PDF-Unterstuetzung.


**Q0269**

Abnahme: Bild anklicken → Zweipunkt-Kalibrierung → zwei Punkte einer bekannten
Strecke anklicken → beispielsweise „5 m“ eingeben → Vorschau übernehmen.
Grenzen: Bildpixel besitzen keine Vektorfangpunkte; noch kein PDF oder Text/Voice-
Adapter für Kalibrierung. Einzelne Referenzbewegung bleibt ein späterer Auftrag.


**Q0270**

Nutzerfehler reproduziert: fokussiertes SVG-image erhält Browser-outline auto 5px;
die Modelltransformation vergrößert ihn bis über den Canvas. Bild bekommt wie
andere SVG-Auswahlziele outline-none, der vorhandene CSS-konstante türkise
Auswahlrahmen bleibt. Browserprüfung: fokussiertes Bild, outline-style none.
Nächster Auftrag bleibt Zweipunkt-Kalibrierung.


**Q0271**

Gemeinsame Auswahl um reference erweitert: Klick, Strg/Cmd, Marquee-Geometrie,
Navigator, Ebenenzuordnung und Filter; blau markierter Rahmen und Bildmaße.
Bild liegt hinter vorhandener Modellgeometrie. Fit berücksichtigt Bildausdehnung.
Keine zweite Engine. Bildinhalt hat keine Vektorfangpunkte. Noch keine Referenz-
Bewegung oder Kalibrieraktion; gemischte Bewegung mit Referenz wird atomar abgewiesen.


**Q0272**

Genau ein Folgeauftrag: Persistenten Referenz-Datenkern mit validierten Assets,
Transformation/Verweisen, Dateimigration, atomarer Erstellung, Größenprüfung und
Roundtrip-/History-/Fehlereingabetests implementieren. Noch keine Canvas-Bedienung,
keine PDF-Zerlegung und keine Änderung der BIM-Skalierungssperre.


**Q0273**

PR158 freigegeben und in main d2d3af9 integriert. Reproduzierbarer Generator
scripts/generate-two-corner-t-fixtures.mjs und Abnahmeprotokoll
 docs/walls/TWO_CORNER_T_ACCEPTANCE.md ergänzt. Browser: automatisches Zeichnen
auf Hauptwand mit zwei Ecken, Fenster entlang Host über T bewegen, Undo/Redo und
3D geprüft. IFC unabhängig mit IfcOpenShell: Schema fehlerfrei, fünf Wände,
ein Fenster, Soll-/Ist-Wandvolumen 21,41136 m³. Archicad-Abnahme ausstehend.
Browser-Download-Event nicht bestätigt (Timeout); Details und Dateiabgrenzung im
Abnahmeprotokoll. Keine Änderungen am Anwendungscode dieses Schritts.


**Q0274**

Geändert: BimPlan, BimSolidView, CadViewport, CadWorkspace, StatusBar und Protokoll.
Browser: 200 Prozent setzt 200 px/m, Canvas-Klick fokussiert ohne outline,
3D-Wechsel zeigt 100 Prozent. TypeScript, Build und Lint erfolgreich (bekannte Warnungen).
PR155 bleibt offen: automatischer Approval-Review hat den Merge trotz allgemeiner
Freigabe abgelehnt; UI-Korrektur als zusätzlicher Commit im bestehenden PR.
Genau ein Folgeauftrag bleibt Fenster-Integration im verbundenen Grundriss
mit Speichern/Laden und IFC; keine weitere neue Werkzeugfunktion in diesem Schritt.


**Q0275**

Grundriss: ausgewählte Fenster erhalten die gemeinsame türkise Auswahlfarbe;
Kontur und Mittellinie verwenden die vorhandene zoomunabhängige Wandkonturstärke.
Automatische Wandlängenbeschriftung entfernt. Eigene Fenstermodelle sind ausdrücklich
für später vorgemerkt; Mess- und Bemaßungswerkzeuge folgen separat.


**Q0276**

Nachweis: 579 Tests bestanden, TypeScript/Build erfolgreich, Lint ohne Fehler
(6 bekannte Warnungen). Tests für beide Grenzen, vier Richtungen, beide verbundenen
Wandenden, unveränderte Basis und Bestätigung am Cap. Browser: bestehendes Fenster
entlang Wand verschoben, Klick weit hinter Wandende -> Position ca. 0,8 ohne Fehler;
türkise Kontur sichtbar, automatische Wandmaßzahl entfernt. Screenshot window-cap.png.
Genau ein Folgeauftrag bleibt die unten beschriebene Fenster-Integrationsprüfung
im verbundenen Grundriss einschließlich Projektdatei und IFC.


**Q0277**

Die textuelle Befehlsvorschau zeigt Anzahl, Richtung/Laenge, mitgefuehrte Fenster,
geloeste externe Wandanschluesse und eine aufklappbare Liste typisierter Ziel-IDs.
Das Modell bleibt bis Uebernehmen unveraendert; noch keine geometrische Canvas-
Befehlsvorschau. Uebernahme prueft den gepinnten Modell-/Auswahl-/Sichtbarkeitskontext
und berechnet ueber dieselbe validierte Aktion neu. Kontextwechsel verwirft die
angezeigte Vorschau. Ein Undo-Schritt, gemeinsame Auswahl bleibt nach Uebernahme.
Das On-Demand-Menue schliesst beim Fokus auf die Befehlseingabe.


**Q0278**

Gepinnte Auswahl/Basis/Sichtbarkeit werden erneut geprueft. Modell-, Auswahl- oder
Sichtbarkeitswechsel invalidieren den Vorgang; Escape, Abbrechen, Werkzeug-/Ansichts-
oder Layoutwechsel verwerfen die Vorschau. Ein Commit, ein Modell-Undo; Nullbewegung
legt keinen History-Eintrag an. Kein Dateiformatwechsel, keine BIM-Skalierung.
Bedienung in 2D; noch keine 3D-Gruppenbewegung und keine Text-/Voice-Gruppenbefehle.
Keine neue grosse Performance-Messreihe fuer diese Aktion behauptet.


**Q0279**

Klick ersetzt, Strg/Cmd-Klick schaltet Zugehoerigkeit um, Leerklick leert. Rahmen
auf freier Flaeche im Auswahlmodus starten: vollstaendig eingeschlossene Geometrie
inklusive Rand, beide Ziehrichtungen gleich. Mindestbewegung 3 CSS-Pixel. Zeichnen,
Bearbeiten, Referenzwahl und Pan behalten ihre Gesten. Escape/Pointer-Abbruch oder
Modell-/Sichtbarkeitswechsel verwerfen den Rahmen. Kein Modell-/Dateiformatwechsel
und kein Auswahl-Undo. Wandachsen bleiben hervorgehoben; 3D zeigt gewaehlte Waende,
aber noch keine neue 3D-Mehrfachklick-/Rahmenbedienung. Gruppenbewegung bleibt aus.


**Q0280**

Genau ein Folgeauftrag: Allgemeinen 2D-Auswahl-
baustein samt Klick/Strg-Klick/Rahmen fuer alle vorhandenen Elementtypen umsetzen
und pruefen. Gruppenverschiebung folgt als Verbraucher dieser Auswahl, nicht als
wandbezogene Parallelstruktur. Noch keine Laufzeitaenderung; nur Planungsdokumente.
Dieser Abschnitt und der ueberarbeitete Plan ersetzen die aelteren Folgeauftraege.


**Q0281**

Pruefung: 546 Tests, TypeScript und Produktionsbuild erfolgreich; Lint 0 Fehler,
6 bekannte Warnungen. 19 neue Tests: Anschlussreihenfolge, beide Seiten, Drehung,
Achsversatz, anderes Host-Ende, Kontaktgrenzen, unzulaessige Topologien, Fenster,
Vorschau/Commit, History, JSON/IFC und Sichtbarkeitskonturen. Browser: Pruefdatei
mit drei Waenden und Fenster geladen, Grundriss und 3D visuell geprueft.
IFC generiert und Regressionen bestanden; externer Archicad-Import dieses neuen
Pruefmodells steht dem Nutzer zur Abnahme offen.


**Q0282**

Genau ein Folgeauftrag: Den vorhandenen Stand der Mehrfachauswahl und gemeinsamen
Elementverschiebung pruefen und einen begrenzten Umsetzungsschritt fuer zwei
zusammen ausgewaehlte Waende festlegen. Gemeinsamen Bewegungsursprung, Rasterengine,
Hilfseingabe, Vorschau und einen Undo-Schritt wiederverwenden; Verhalten interner
Verbindungen und Anschluesse zu nicht ausgewaehlten Waenden ausdruecklich pruefen.
Noch keine Gruppenbewegung als implementiert oder abgenommen ausweisen.
Diese Korrektur aendert nur die Planung, nicht die Laufzeitlogik von PR145.


**Q0283**

Genau ein Folgeauftrag: Kombination aus Eck- und T-Anschluss an derselben
Hauptwand anhand eines kleinen Testgrundrisses fachlich und geometrisch
abgrenzen und einen begrenzten Umsetzungsplan mit Akzeptanzfaellen festhalten.
Noch keine pauschale Freigabe beliebiger Anschlussnetze.


**Q0284**

**Genau ein ausführbarer Folgeauftrag:** T-Fang beim Abschluss neuer Wandabschnitte
an die gemeinsame Application-Aktion anbinden und Undo der ganzen Wandkette
beibehalten. Offener PR138 enthält die Korrekturen; noch keine Zusammenführung.


**Q0285**

Die ausgewählte Wandkontur ist jetzt dezent blaugrau mit 1,25 CSS-Pixeln,
unabhängig vom Zoom. Die maßgebende Achse bleibt türkis und 2,5 Pixel stark;
ihre Griffpunkte bleiben ebenfalls türkis. Gemeinsame Grundflächen und
entfernte Kontaktlinien bleiben erhalten. Ergänzung zum offenen PR138.
Nächster Auftrag bleibt T-Fang beim Zeichnen neuer Wandabschnitte.


**Q0286**

Praktische Abnahme: zwei isolierte, rechtwinklig zueinander stehende Wände gleicher
Stärke/Höhe. Nebenwand auswählen → Wandachse Ende/Anfang → Punkt frei bewegen →
in Nähe des Lotfußpunktes auf der Hauptachse zeigen → T-Anschluss → Linksklick.
Undo/Redo sowie 3D prüfen. Optional Testdatei outputs/t-axis-start.project.json
(lokal, nicht Teil des Repositories). Noch keine T/Eck-Kombination, mehrere Ts
pro Wand, Zeichnen neuer Wände oder automatische T-Erzeugung in 3D.


**Q0287**

Nur Dokumentation geändert. Quellpfade/Verbraucher, Links und diff --check geprüft;
keine neuen Build-/Testläufe. Letzter Code-Nachweis bleibt 486 Tests sowie drei
unabhängig bestandene IFC-Prüfungen. Archicad-Abnahme der T-Dateien noch offen.
Im Programm ist weiterhin nur die temporäre T-Vorschau vorhanden.


**Q0288**

**Genau ein ausführbarer Folgeauftrag:** T-Geometrie-/Öffnungskern von der
Projektvalidierung trennen, damit gespeicherte Beziehungen später ohne Rekursion
geprüft werden. Öffentliche Vorschau/Abnahmeexport strikt validieren; denselben
Kern verwenden und bestehende Geometrie-, Fenster- und IFC-Tests erhalten.
Noch keine Schemaänderung, automatische T-Erkennung oder neue Bedienregel.


**Q0289**

Archicad-Abnahme noch offen. Testdateien in outputs/t-ifc-acceptance;
Anleitung und Reproduktion in [T-IFC-Abnahme](docs/T_IFC_ACCEPTANCE.md).
Zuerst t-touch.ifc prüfen: zwei Wände und zwei Fenster, beide Öffnungen bündig
am Anschluss, Hauptwand ungeteilt und kein überschneidendes Wandvolumen.
Nicht mit dem regulären Export der Ausgangs-Projektdatei verwechseln.


**Q0290**

**Genau ein ausführbarer Folgeauftrag:** Die dauerhafte T-Relation anhand der
vorhandenen Endpunktbezüge und Migration planen und das Verhalten beim
Verschieben/Verlängern der Hauptwand mit dem Nutzer festlegen. Bestehende Regel
für Einzelwandbewegung (lösen) berücksichtigen; keine relative Ankerbewegung
oder Mitnahme unbestätigt einführen. Danach einen begrenzten Persistenzauftrag
festhalten. Text/Voice bleiben Adapter gemeinsamer geprüfter Aktionen.


**Q0291**

PR129 freigegeben und übernommen (fb0f21e). Nutzer erlaubt Fenster gegen Wände;
umgesetzt als Berührung erlaubt, Überschneidung verboten im isolierten T-Fall.
Die Eckanschlussregel bleibt unverändert. Domain t-openings prüft Hauptfenster
gegen die Kontaktbreite, Nebenfenster gegen den gekürzten Körper. Application
nutzt den Bericht und die gemeinsame Öffnungsextrusion. Rundung an lokalen
Kappengrenzen wird in abgeleiteter Geometrie innerhalb Modell-Toleranz vereinheitlicht.


**Q0292**

Die Frage Berührung erlauben/verbieten wurde an den Nutzer gestellt und ist noch
offen. Empfehlung bleibt Nichtkontakt ohne zusätzlichen Zentimeterabstand.
Kein neues Laufzeitverhalten, weiterhin fensterlose T-Vorschau. Die Entscheidung
wird nicht aus einer allgemeinen PR-Freigabe als bestätigt abgeleitet.


**Q0293**

Geprüft: Quellmodule, Randindizes und analytische Beispiele; Referenz-Netto bei
zwei freien 1x1-m-Fenstern ist 8,17056 m³. Dokumentlinks und diff --check geprüft.
Keine neuen Tests/Builds für die reine Dokumentation; letzter Code-Nachweis aus
PR128 bleibt 481 bestandene Tests, TypeScript/Build und Browserprüfung.


**Q0294**

PR126 nach Freigabe übernommen (4dbca2a). Auf feat/t-wall-geometry ist der
geplante reine Domain-Helfer deriveRightAngleTJunction implementiert. Er erhält
zwei explizite Wandparameter/Endindex und liefert Hauptkontur, gekürzte
Nebenkontur und Kontaktsegment. Hauptwand-ID und alle Achsen bleiben unverändert.
Wiederverwendung von Wandkörper-, Schnittpunkt-, Toleranz- und Polygonfunktionen.
Noch keine Projektverknüpfung oder neue Bedienfunktion.


**Q0295**

Siehe [T-Anschluss-Arbeitsentwurf](docs/T_WALL_CONNECTION_PLAN.md): aktuelles
Endpunktpaar-Schema, unveränderte Hauptwand, gekürzter Nebenkörper, Öffnungen,
Migration, Fangkontext, Undo sowie gemeinsame 2D/3D/IFC-Abnahmekriterien geprüft.
T-spezifischer Achsanker und Folgen einer Hauptwandänderung bleiben offen;
Vorschläge sind ausdrücklich von bestehenden Architekturregeln getrennt.


**Q0296**

Korrektur der vorherigen Prioritätsnotiz auf Nutzerwunsch: Text/Sprache werden
weiterhin gemäß Protokoll an geprüfte Application-Aktionen angebunden, nicht
wegen der letzten Rückfrage generell vertagt. PR124 ist weiterhin separat offen.
Diese Freigabe bezog sich auf PR125; PR124 wurde nicht stillschweigend übernommen.


**Q0297**

Prüfung dieser Etappe: Modulpfade und Vertragsgrenzen gegen Code abgeglichen,
relative Dokumentlinks geprüft, git diff --check ohne Fehler. Keine erneuten
Build-/Testläufe für reine Dokumentation; letzte Codeprüfung unverändert gültig.
Praktische Abnahme weiterhin: schräge Wandkette zeichnen, 2D/3D und Undo prüfen.
Der Entwurf selbst schaltet noch keine neue T-Funktion frei.


**Q0298**

Dieser Abschnitt ersetzt die historischen Folgeauftraege. Ausgangspunkt ist der
freigegebene Integrationsstand 1a1608b (PR123). PR124 mit Offset-Textadapter bleibt
separat offen und ist hier nicht enthalten. Sprache bleibt vorgemerkt; nach der
Rueckfrage des Nutzers wird zuerst die gemeinsame Wandgeometrie erweitert.


**Q0299**

**Genau ein ausfuehrbarer Folgeauftrag:** Einen lokalen Textbefehl fuer den nun
geprueften 2D-Kontur-Offset an den bestehenden Copilot anbinden. Auswahl-ID und
Modellstand pinnen, Vorschau/Bestaetigung/Undo ueber denselben Application-Pfad;
keine separate AI-Geometrie. Konkave Formen, Kreise und Kopie-Hotkey bleiben
vorgemerkt. Sprachparser-Ausbau folgt erst nach geprueftem Textadapter.


**Q0300**

**Genau ein ausfuehrbarer Folgeauftrag:** Gemeinsame Offset-Aktion fuer einfache
konvexe geschlossene 2D-Konturen (Schraffur/geschlossene Polylinie) als begrenzte
vertikale Etappe mit On-Demand-Menue, signiertem Abstand, Vorschau, Validierung
und Undo integrieren. Ungueltige/zusammenfallende oder konkave Ergebnisse zuerst
klar abweisen; keine stillen Reparaturen. BIM bleibt ausgeschlossen. Kreis-
Unterstuetzung, komplexe Konturen und Kopie-Hotkey bleiben vorgemerkt.


**Q0301**

Grenzen: Kettenanschluesse weiterhin rechtwinklig mit gleicher Hoehe/Staerke,
keine kollineare Unterteilung, T-Knoten oder beliebigen Winkel. Noch keine
Wandparameterwahl vor dem Zeichnen (0,36 m / 2,80 m, rechte Kantenachse).


**Q0302**

**Genau ein ausfuehrbarer Folgeauftrag:** Den zurueckgestellten kleinen
Schraffur-Eigenschaftenschritt umsetzen: unabhaengige Hintergrundfarbe und
waehlbare Konturanzeige mit Linienfarbe. Gemeinsame validierte Application-
Aenderung, Eigenschaftenleiste, Dateikompatibilitaet und Undo/Redo verwenden.
Linienarten und Offset bleiben fuer spaeter vorgemerkt.


**Q0303**

Nutzerentscheidungen bestaetigt: Fenster duerfen den Anschlussabschluss nicht
beruehren; Einzelwand wegbewegen loest den Anschluss und stellt gerade Enden
wieder her. Bewegung und Anschlussaenderung ergeben einen Undo-Schritt.
Mehrfachknoten, falsche Winkel/Dimensionen oder Oeffnungskollisionen werden
abgewiesen; T-Kontakte und blosse Koerperueberlappung sind noch keine Anschluesse.
Keine gemeinsame automatische Hoehen-/Staerkenpropagation. Gemeinsame Ecke
als Gruppe bewegen bleibt separat; aktuelle Griffe bearbeiten die gewaehlte Wand.


**Q0304**

Dieser Abschnitt ersetzt alle folgenden historischen Folgeauftraege. Der
Schraffur-Eigenschaftenschritt bleibt vorgemerkt. Neue Nutzerentscheidung:
Achsenden zusammenfuehren soll automatisch Wandkoerper verbinden; anschliessend
Waende wie eine Polylinie durchzeichnen. "Bewusst Ecke verbinden" ist ersetzt.


**Q0305**

451 Tests bestanden; TypeScript/Build erfolgreich; Lint 0 Fehler/6 bekannte
Warnungen. Browser: Kantenlage, Achsgriff -> Punkt frei bewegen -> 1 m bei 0 Grad
-> Wand von 3 auf 4 m -> Undo; Versatz 0,6 m abgewiesen; neue Wand mit
Kantenachse gezeichnet. Feste 130px-Eigenschaftenleiste bleibt erhalten.
Noch keine automatische Verbindung und kein Kettenzeichnen. PR119 wird mit
dieser Korrektur aktualisiert, nicht ungefragt zusammengefuehrt.


**Q0306**

Nachweis: 449 Tests bestanden; TypeScript und Build erfolgreich. ESLint:
0 Fehler, 6 bekannte Warnungen. Browser: zwei rechtwinklige 3-m-Waende mit
Fenstern in beiden Ansichten, unpassendes Achsende mit Fehlermeldung und Escape
zur unveraenderten Hauptansicht geprueft. Archicad-Abnahme des isolierten
Eckexports ist bereits vom Nutzer bestaetigt. Noch keine produktive Verbindung,
kein Anschluss-Commit und keine Aenderung am normalen IFC-Export.


**Q0307**

Neue Nutzerwuensche bleiben erhalten in FUNCTION_REQUIREMENTS_2026-10-03.md:
Schraffur-Hintergrundfarbe, waehlbare Konturlinie mit eigener Farbe (Linienarten
spaeter), Offset geschlossener Polygone/Kreise und spaetere Kopie per Hotkey.
Offset-Abstand versus Skalierungsfaktor ist noch zu klaeren; BIM-Skalierung
bleibt ausgeschlossen. Offene Wandanschlussregeln wurden erneut angefragt.


**Q0308**

**Genau ein ausfuehrbarer Folgeauftrag:** Schraffur-Konturdarstellung als kleinen
Eigenschaftenschritt umsetzen: optionale Konturlinie mit eigener Linienfarbe,
ueber gemeinsame validierte Application-Aktion, Eigenschaftenleiste, Undo/Redo
und Projektdatei mit Altdateikompatibilitaet. Bestehende Konturgriffe/Fangpunkte
bleiben unabhaengig von der sichtbaren Linie nutzbar. Keine Linienarten, keine
Offset-Geometrie und keine separate AI-Modelllogik in diesem Schritt.
Die dauerhafte Wandverbindung bleibt bis zur Klaerung ihrer Regeln vorgemerkt.


**Q0309**

Der Nutzer bestaetigt am 05.10.2026 den erfolgreichen Archicad-Import des neuen
IFC-Eckmodells einschliesslich Fenster und rechtwinkligem Wandanschluss.
Diese konkrete Exportabnahme ist damit abgeschlossen. Regeln zur genauen
Oeffnungsberuehrung und zu Endkappen nach dem Loesen bleiben weiterhin offen.


**Q0310**

**Historischer, nach Seitengriffen fortgefuehrter Folgeauftrag:** Die gemeinsame temporaere Anschluss-
vorschau fuer ein ausdruecklich ausgewaehltes rechtwinkliges Wandpaar in Grundriss
und 3D integrieren. Application haelt Selection/Preview; Renderer verwenden die
vorhandenen Konturen und polygonalen Flaechen derselben Ableitung. Beide normalen
Wandkoerper durch Vorschau ersetzen statt doppelt anzeigen, Fenster beibehalten,
Modellwechsel validieren und mit Escape abbrechen. Noch keine Speicherung,
History-Buchung oder produktive Aktion „Ecke verbinden“, solange die offenen
Anschlussregeln nicht entschieden sind. Tests fuer gemeinsame Ziele/Geometrie,
Abbruch und unzulaessige Paare; normale Werkzeuge und Export beibehalten.


**Q0311**

Nachweis: 437 Tests, TypeScript/Build erfolgreich, Lint 0 Fehler/6 bekannte Warnungen.
IfcOpenShell 0.8.5 validierte 12 neue Eckfaelle und 8 bisherige Referenzfaelle
inklusive EXPRESS, Placement, Profilen, Beziehungen und Nettovolumen. Der normale
Beispielexport ist bytegleich zum Stand vor der Writer-Verlagerung. Vier neue
Tests sichern Identitaet, Snapshot-Isolation, gezielte Profilauswahl und Fehlerfaelle.
Generator/Abnahmeanleitung: docs/CORNER_IFC_ACCEPTANCE.md. Import dieses neuen
Modells in Archicad bleibt unbestaetigt und ist als praktische Abnahme offen.


**Q0312**

Die Fragen zur exakten Oeffnungsberuehrung und zur Endkappe nach dem Loesen bleiben
offen. Eine allgemeine Freigabe ersetzt keine konkrete Antwort. Dieser Schritt
schaltet keine produktive Verbindung frei und veraendert keine Bedienablaeufe.


**Q0313**

domain/elements/wall/corner-solid.ts verwendet denselben validierten Projektstand,
Eckkonturen und Oeffnungsbefund. Liefert je Wand-ID Kontur, orientierte polygonale
Flaechen und Volumen sowie Gesamtvolumen des Paars. Nur contained-Oeffnungen sind
hier unterstuetzt; touching/outside liefern eine ausdrueckliche Meldung. Dies ist
keine neue Produktentscheidung zur Anschlusszulaessigkeit. Offene Regeln zu
Beruehrung und Endkappen beim Loesen bleiben offen; „Freigabe und go“ beantwortet
nicht die zuvor gestellten Auswahlfragen.


**Q0314**

Nachweis: 433 Tests bestanden, TypeScript/Build erfolgreich; ESLint 0 Fehler und
6 bekannte Warnungen. Sieben neue Tests: neun Versatzfaelle, geschlossene Huelle,
unabhaengiges vorzeichenbehaftetes Mesh-Volumen, Fensterlaibungen, ueberlappende/
doppelte Oeffnungen, Drehung/Translation/Achsumkehr, unveraenderte andere Waende,
Kontakt-/Fehlermeldungen und Oeffnungen am Fuss/Kopf. git diff --check bestanden.
Keine neue UI-, Schema-, History-, Rendering- oder IFC-Anbindung. Keine sichtbare
Aenderung im Browser; praktische Anschlussabnahme bleibt nach Integration offen.


**Q0315**

Pruefung: 426 Tests bestanden, TypeScript und Build erfolgreich, ESLint 0 Fehler
und 6 bekannte Warnungen. Sechs neue Tests decken mittige Fenster, neun Offsetpaare
auf beiden Hosts, Beruehrung/kleinen Abstand/Ueberschreitung, entferntes Wandende,
Rotation/Spiegelung/Translation/Achsumkehr, Sichtbarkeit, Snapshotwechsel und
ungueltige Eingaben ab. git diff --check bestanden. Keine neue Browserfunktion;
praktische Abnahme der Anschlussbedienung bleibt bis zur Integration ausstehend.


**Q0316**

Angefragte Produktentscheidungen fuer die spaetere Aktion: Beruehrung einer
Oeffnung an der Gehrung zulassen oder zunaechst abweisen; nach automatischem Loesen
wieder gerade Abschluesse oder Gehrungsform erhalten. Solange keine Antwort
vorliegt, bleiben dies offene Fragen, keine Zustimmung durch Schweigen.


**Q0317**

**Historischer, inzwischen umgesetzter Folgeauftrag:** Eine reine Domain-Pruefung der vorhandenen
Fensteroeffnungen gegen diese abgeleiteten Anschlusskonturen ergaenzen. Vollstaendige
Oeffnungsgrundflaeche mit Wandstaerke, bodyOffset und relativer Position aus denselben
Modellparametern ableiten; voll enthaltene Oeffnungen versus Schnitt mit der schraegen
Endbegrenzung nachvollziehbar melden. Keine pauschalen Randabstaende erfinden, keine
Fenster verschieben oder loeschen. Tests: mittiges Fenster, Kollision, Beruehrung,
beide Vorzeichen, umgekehrte Achsrichtung. Ergebnis ist ein geometrischer Befund;
die Produktentscheidung fuer Beruehrung/Endzonen und Anschlussbearbeitung bleibt
offen. Noch keine UI-Freischaltung oder persistenten Anschlussdaten.


**Q0318**

Wand.bodyOffset ist ein vorzeichenbehafteter Meterwert, positiv links in Richtung
start nach end. Die Zeichenachse bleibt beim Versetzen fest; Koerper und Fenster
folgen gemeinsam. domain/elements/wall/body.ts liefert die gemeinsame Ableitung
fuer Grundriss, 3D, Bounds, Fangquellen, Eckgriffe, Fensteranker und IFC.
application/walls/body-offset.ts prueft Snapshot, Auswahl und Ziel-ID, erzeugt eine
verwerfbare Vorschau und uebernimmt einen History-Schritt. Die Eigenschaftenleiste
haelt den Entwurf bis „Versatz uebernehmen“ lokal; „Verwerfen“ setzt ihn zurueck.
Es gibt noch keine laufende grafische Vorschau waehrend der Texteingabe.


**Q0319**

**Historischer, inzwischen umgesetzter Folgeauftrag:** Die ausgewaehlte sichtbare Wandachse
auch in 3D als dezente, bildschirmbezogene Linie darstellen. Vorhandene start/end
auf Geschosshoehe aus dem aktuellen validierten Vorschau-/Anzeigesnapshot
ableiten; keine zweite Geometriequelle, Modellmutation oder neue Fangquelle.
Auswahlwechsel, ausgeblendete Ebene, Versatz, Kamera/Zoom, Vorschau/Abbruch und
Undo/Redo pruefen. Achse darf weder Picking noch Eckgriffe blockieren. Damit ist
die feste Bezugsachse auch bei versetztem Koerper im Raum nachvollziehbar.
Anschlussregeln bleiben separat offen (docs/WALL_CORNER_PLAN.md).


**Q0320**

Praktische Abnahme: Punktfang einschalten, zwei Punkte jeweils 0,6 s anhovern und daraus einen Schnittpunkt aktivieren. Mit Mausrad oder Plus/Minus zoomen: Markierungen müssen erhalten bleiben. Escape löst sie gezielt. Dieser Nachtrag ersetzt frühere Protokollaussagen, nach denen Zoom Referenzen verwirft. Die Korrektur ergänzt PR #36; Nutzerfreigabe für PR #35/#36 gilt nach erfolgreicher Prüfung. Der einzige nächste Entwicklungsauftrag bleibt der unten beschriebene Schnitt externer Hilflinien mit festen Direct-Edit-Achsen.


**Q0321**

Abnahme: Snap einschalten, Punkt 0,6 s anhovern → silbergrauer Ring. Zeiger weg und wieder 0,6 s darüber → Ring weg. Dort verbleiben → bleibt gelöst. Nach erneutem Verlassen wieder aktivierbar. In einer bereits offenen Sitzung kann die bisherige Zeiteinstellung erhalten bleiben; im Linienwerkzeug auf 0,6 s stellen, ohne das Projekt neu zu laden.


**Q0322**

PR #29 wurde mit Nutzerfreigabe als normaler Merge 655c5f1 in feat/direct-edit-shared-snap übernommen. PR #27/#28 bleiben offen; main wurde nicht geändert. Dieser Funktionsschritt basiert auf dem freigegebenen Dokumentationsstand.


**Q0323**

Prüfung: 168 Tests bestanden (vier neue Fälle: alle acht Winkelgrenzen mit Hin-/Rückweg, getrennte Quellen und Identitätswechsel, Anzeige/Schnittpunkt/Radius/Shift/Ortho sowie Direct-Edit-Commit/Undo/Redo/JSON). TypeScript und Build erfolgreich; ESLint null Fehler/sechs bekannte React-Refresh-Warnungen. Browser beim Linienzeichnen und freien Linienbewegen: 20° → 24° bleibt horizontal, 28° wechselt auf 45°; Rückweg über 22° bleibt diagonal, 17° schaltet zurück. Zwei Referenzen erzeugen weiterhin den nach 600 ms erworbenen dritten Hilfspunkt. Freie Linienbewegung auf (1,5; 1,5) bestätigt, Undo/Redo geprüft. Escape, Modell-Commit, Kamerawechsel und Snap aus räumen Führungen auf. Screenshot: outputs/guide-hysteresis-direct-edit.png.


**Q0324**

Aufbauend auf PR #33 / 3fad40a; PR #33 bleibt offen und wurde durch den Fortsetzungsauftrag nicht automatisch zusammengeführt. Neue Implementierung auf feat/shared-midpoint-snap.


**Q0325**

geometry/intersections/segments.ts prüft eindeutige Schnitte innerhalb beider endlicher Segmente mit der zentralen numerischen Toleranz. Degenerierte/nichtendliche Strecken, bloße Geradenverlängerungen und Überlappungen erzeugen keinen Fangpunkt; eindeutige Endberührungen bleiben möglich. constraints/snapping/segment-references.ts bildet Quellenpaare deterministisch. Der Projektadapter stellt Wandachsen und vorhandene Linien-/Polyliniensegmente bereit, einschließlich Selbstkreuzungen einer Polylinie. Keine Wandflächenverschneidung oder Änderung des BIM-Modells.


**Q0326**

Nutzerpräzisierung: Die derzeit zentrierte Wandachse bei ausgewählter Wand sichtbar machen und später verschiebbar machen. In FUNCTION_REQUIREMENTS_2026-10-03.md bei N45 ergänzt, kein Doppelauftrag. Vor Wandanschlüssen passend einordnen. Ob die physische Wandlage erhalten oder mitverschoben wird, bleibt bis zur fachlichen Klärung offen; hier keine Implementierung.


**Q0327**

Aufbauend auf 4c542ea / PR #35, der weiterhin offen bleibt. Neue Umsetzung auf feat/oblique-guide-intersections. Kein Merge durch den allgemeinen Fortsetzungsauftrag.


**Q0328**

Die bisher dokumentierte Lücke bei achsengebundener Bearbeitung schließen: externe Hilfsreferenzen dürfen seitlich der erlaubten Bewegungsachse liegen, wenn ihre mausrelevante Führung diese Achse schneidet. Den Schnitt gemeinsam und eindeutig berechnen, die feste X-/Y-/Elementachse weiterhin strikt einhalten und keine bloß projizierten Endpunkte als echte Fangpunkte beschriften. Zuerst vorhandenen Filter und Kandidatenvertrag prüfen; keine separate SnapEngine im Werkzeug.


**Q0329**

Prüfung: 149 automatisierte Tests, TypeScript, vollständiges ESLint und Produktionsbuild. Lint: null Fehler, sechs bekannte React-Refresh-Warnungen. Neue Fälle prüfen freie Wandbewegung und Punktänderung, exakte externe Endpunkte, Zoomradius, Snap aus, Shift, Achspriorität, Hover-Führung, geschlossene Polylinien, Fenstergrenzen und Strecken mit Griffversatz. JSON, Undo/Redo und bestehende IFC-Tests bleiben enthalten. Browser: Endpunkt außerhalb des Rasters exakt erkannt, Ring/Hilfslinie beim Bearbeiten sichtbar, Vorschau und Bestätigung geometrisch identisch, Undo auf 3 m und Redo auf 4,131980263614846 m geprüft. Screenshot lokal: outputs/direct-edit-snap-preview.png.


**Q0330**

Nachweise: 140 Tests bestanden (fünf neue Tests mit mehreren Fällen), TypeScript, vollständiges ESLint und Produktionsbuild erfolgreich. Lint: null Fehler, sechs bekannte React-Refresh-Warnungen. Tests prüfen beide Achsen, ±10 Millionen Meter, 10/100/1000 px/m, echte Abweichungen, nichtendliche Werte, Toleranzdeckel, exakte Kandidatenkoordinaten und weiterhin ungültige veraltete Hover-Referenzen trotz minimaler Verschiebung. Vorhandene Shift-, Mehrfachreferenz-, Undo/Redo-, JSON- und IFC-Tests bleiben grün. Keine erneute Browserprüfung in diesem rein numerischen Schritt; Bedienoberfläche unverändert.


**Q0331**

Bis zu vier durch Verweilen aktivierte Referenzen bleiben innerhalb der Zeichenfläche erhalten. Ein fünfter verdrängt den ältesten; erneutes Aktivieren aktualisiert die Reihenfolge ohne Duplikat. Neben den einzelnen Richtungsführungen unterstützt die Engine als erste gemeinsame Konstruktion Horizontal-von-A/Vertikal-von-B. Ein naher Schnittpunkt gewinnt vor Einzelführungen und wird mit beiden Herkunftslinien dargestellt. Tatsächliche Endpunkte behalten Vorrang. Alle Referenzen werden gegen den aktuellen Modellstand geprüft.


**Q0332**

Grenzen: erster Verbraucher bleibt Linie/Polylinie; keine Mehrfachreferenzen, Nachbarparallel-Erkennung, Hysterese oder 3D. Am Polylinienvertex werden die benachbarten gespeicherten Segmente ausgewertet. Nächster Schritt: Wandzeichnen an dieselbe geprüfte Fang-/Hover-/Shift-API anschließen und Wand-Fenster-Workflow mit Undo/Redo und Dateirundlauf prüfen.


**Q0333**

Grenzen: erster Verbraucher weiterhin Linie/Polylinie in 2D; maximal eine Referenz, nur Achsführungen, keine dauerhaften Hilfsobjekte. Noch keine Richtungsableitung aus Kanten, Mehrfachreferenzen, Hysterese, Parallel-/Lot-/Winkelbezüge, 3D oder räumlicher Index. Die ursprüngliche vollständige Hilfslinienspezifikation bleibt offen. Die Engine analysiert derzeit vorhandene Wandachsenden und Linienvertices; weitere Elementtypen benötigen Modelladapter.


**Q0334**

Nachweise: 118 Tests bestanden, davon acht neue Application-Tests zu Vorschauen, Abbruch, veraltetem Kontext, ungültigen Zielen, No-op/Redo, Linienbewegung, Dateirundlauf, 3D und IFC. TypeScript, gezieltes ESLint der geänderten Dateien und Build erfolgreich. Browser: Vorschau/Abbruch ohne Undo, Wandbewegung mit einem Undo-Schritt, Redo, Linienbewegung und 3D-Wechsel; keine Konsolenfehler. Nach einer Modelländerung wird der alte angeklickte Bewegungsanker verworfen. Eine allgemeine automatische Importgrenzen-Prüfung ist noch nicht implementiert; das neue Modul wurde auf ausschließlich modell-/historybezogene Imports ohne React/DOM geprüft.


**Q0335**

Aktueller gesicherter Funktionsstand: feat/plan-camera, Commit 2bca281, PR #17 (offen). 110 Tests, TypeScript, gezieltes ESLint, Build und dokumentierte Browserprüfung bestanden. Dies ersetzt noch nicht die vollständige Anforderungszuordnung nach Guide-Etappe 0. Der vorgezogene Bildschirmmaßstab deckt einen Teil von Guide-Etappe 7/F10 ab; Referenzimport, Kalibrierung und Ausgabemaßstab fehlen weiterhin.


**Q0336**

Verbindliche Reihenfolge aus dem Nutzerauftrag vom 01.10.2026. Dieser Plan ersetzt die bisherige technische Reihenfolge in FEATURE_ROADMAP.md; die dort erfassten Einzelanforderungen F01–F14 bleiben erhalten. Bereits funktionierende Modell-, UI-, History- und Exportfunktionen werden weiterverwendet. Pro Änderung eine überschaubare, prüfbare Teil-Etappe.


**Q0337**

F13 bleibt die ausführliche Spezifikation. F04 (2D-Kamera/Zoom/Pan/Maßstableiste) als kleine technische Voraussetzung in diese Etappe einordnen. Erster Fangschritt soll vorhandene Geometrie und Werkzeuge nutzen, keine parallele Modellstruktur. Weitere Fangarten erst nach Prüfung der ersten Arten ergänzen.


**Q0338**

- On-Demand-Menü mit den jeweiligen geprüften Bearbeitungsaktionen weiterentwickeln; Eigenschaften bleiben oben, Bewegungsaktionen am Zeiger.
- Schraffuren und Referenzimport/-skalierung jeweils als eigene kleine Etappen nach grundlegenden Fang- und Maßeingabefunktionen. PDF/Bild anhand zweier Punkte und bekannter Länge skalieren (F05/F10).
- Text- und Sprachbefehle nur auf bereits geprüfte Modellfunktionen erweitern. Maus, Maßeingabe und Copilot verwenden dieselben validierten Aktionen. F11 bleibt offen.
- F12 (gemeinsame Auswahlumrandung) und F14 (Ebenensystem) bleiben geplant. Ebenensichtbarkeit bei Fangfiltern berücksichtigen und Ebenen vor größeren Projekten einordnen, ohne die sechs Etappen umzudeuten.


**Q0339**

Git-Synchronisierung und kombinierte praktische Verschiebeabnahme sind am 01.10.2026 abgeschlossen; Nachweis in STABILIZATION.md. Etappe 1 ist damit technisch geprüft, die Übernahme nach main bleibt der PR-Prüfung vorbehalten. Die frühere Aufzählung offener Abschlussbedingungen beschreibt den Stand vor diesem Nachtrag. Etappe 2 kann auf dem gesicherten Gesamtstand beginnen.


**Q0340**

Architektur: reine Kameramathematik unter src/rendering/viewport, generischer Point2 unter src/geometry/primitives. Kamera ist flüchtiger Zustand je Ansicht. Das bestehende Project bleibt die einzige Modellquelle; keine Modellaktion, History-Änderung, Dateimigration oder IFC-Anpassung durch Navigation. Alle bestehenden Modellbearbeitungen verwenden weiterhin die geprüften Operationen.


**Q0341**

Praktische Abnahme: 2D öffnen, über einer Wandecke mit dem Mausrad zoomen; die Ecke bleibt unter dem Zeiger. Pan aktivieren und ziehen, danach Escape drücken. Maße müssen gleich bleiben. Fit view zeigt das ganze Modell. 100 px/m wählen und zeichnen/bearbeiten; anschließend Undo/Redo prüfen.


**Q0342**

Grenzen: px/m ist ein Bildschirmmaßstab, kein Druckmaßstab. Rasterdarstellung ist adaptiv; das bisherige optionale Rasterfangen bleibt ausdrücklich bei 0,10 m. Kameras werden nicht in Projektdateien gespeichert und beim Wechsel des Viewport-Layouts neu initialisiert. Geometrisches Fangen, Referenzaktivierung und Hilfslinien sind noch offen. Nächster Schritt: gemeinsame Endpunkt-/Mittelpunkt-/Schnittpunkt-Kandidaten unter constraints/snapping gemäß ARCHITECTURE.md und F13.


**Q0343**

Nutzerkorrektur hat Vorrang vor dem zuvor geplanten Streckgriff: großes festes Streckenfeld durch ein kompaktes Hilfseingabefenster nahe der Auswahl ersetzen und freies Bewegen mit Winkel/Länge unterstützen. Umsetzung auf feat/compact-polar-input, aufbauend auf PR #38 / 86b5839. PR #38 bleibt offen; keine zusätzliche Merge-Freigabe angenommen.


**Q0344**

Freies Bewegen hat jetzt einen ausdrücklichen Richtungswahl-Schritt: erster Klick fixiert die Richtung, erzeugt noch keinen History-Eintrag und fokussiert das Längenfeld. Winkel kann stattdessen direkt eingetragen werden. Leerer Winkel folgt der Maus, gesetzter Winkel bleibt fix; leere Länge folgt der Mausprojektion auf die feste Richtung, gesetzte Länge bleibt exakt. Maus setzt beide Eingaben zurück. Enter/Übernehmen bestätigt, Escape/Abbrechen verwirft. Negative Länge bewegt in Gegenrichtung. Dezimalkomma/-punkt werden akzeptiert, ungültige Werte sperren Bestätigung. Bei festem Winkel und leerer Länge bleibt Rückwärtsbewegung vor dem Ursprung bei Länge null; eine negative Länge kann ausdrücklich eingegeben werden.


**Q0345**

Dasselbe kompakte Fenster an die bestehende Streckgriff-Aktion anbinden. Die gewählte Fluchtrichtung bleibt fest; positive Länge verlängert, negative verkürzt. Griffversatz, Nachbarüberquerung und Fenstergrenzen müssen unverändert über die gemeinsame Modellaktion validiert werden. Tests für schräge Wände/Linien, unzulässiges Verkürzen, stale Kontext, Escape/Undo/Redo und praktische Prüfung auch der abgeleiteten 3D-Zahlenvorschau. Kein separates Eingabefenster pro Werkzeug; Zeichnen und Fensterbewegung bleiben spätere Verbraucher.


**Q0346**

Nachweise: 201 Tests bestanden, TypeScript/Build erfolgreich, ESLint 0 Fehler/6 bekannte Warnungen. Zwei neue Testgruppen prüfen positive/negative Strecken an beiden Enden schräger Linien/Wände, unveränderten Gegenpunkt, Griffversatz, Fenstergrenzen, Nachbarüberquerung, fehlenden Griff, stale Modell/Auswahl, einen Commit/Undo/Redo/JSON sowie Abbruch. Browser: 3-m-Wand über Endgriff um 1,25 m auf 4,25 m verlängert, Vorschau in 2D und 3D visuell geprüft; Eigenschaften vor Commit weiter 3 m. Ungültige Verkürzung -2 m bei vorhandenem 1,20-m-Fenster gesperrt. Commit 4,25 m, Undo 3 m, Redo 4,25 m. Anschließend -0,5 m ergibt 3,75-m-Vorschau, Escape stellt 4,25 m wieder her. Die noch ausstehende praktische 3D-Zahlenvorschauabnahme ist damit erledigt.


**Q0347**

Das vorhandene Hilfseingabefenster nach Setzen des ersten Linienpunkts aktivieren. Ursprung bleibt der erste Punkt; Maus/Fangengine bestimmen die Richtung oder Winkel/Länge werden ausdrücklich eingegeben. Gemeinsame polare Eingabe und vorhandene validierte Linienerzeugung verwenden; keine zweite Zeichenlogik. Zunächst einzelne gerade Linien, keine Polylinien oder weiteren Bauteile. Prüfen: Maus versus fixierte Werte, 0–360°, ungültige/Null-Länge, Escape ohne Bauteil, ein Commit/Undo/Redo und JSON; praktische Browserabnahme. Wandachsenlage N45 und Fensterbewegung bleiben spätere Aufgaben.


**Q0348**

Auf feat/shared-wall-precision, basierend auf dem noch offenen PR #43. PR #41–43 bleiben ohne neue Freigabe offen. Nach dem ersten Wandpunkt erscheint dasselbe PrecisionInput wie bei Linie/Bewegung. Ursprung, Parallelreferenzen, Tab Länge/Winkel, feste Zahlen, Maus, Enter und Abbruch werden gemeinsam verwendet. Wandstärke 0,36 m und Höhe 2,80 m bleiben die bisherigen Zeichenstandardwerte; nachher über Eigenschaften änderbar.


**Q0349**

Nachweise: 212 Tests bestanden, TypeScript/Build erfolgreich, ESLint 0 Fehler/6 bestehende Warnungen. Neue Tests für exakte Wand 3,00 × 0,36 × 2,80 m, 3D-Grenzen, Vorschau ohne Mutation, einen Commit/Undo/Redo/JSON, Null-Länge, falsche Winkel/Maße, stale Modell und erhaltene Linien-/Polylinienstile. Browser: Ursprung (0;1), Richtung mit Tab übernommen, 0°/3,00 m bleibt bei Mausbewegung exakt; 0 m und 566° sperren Übernahme. Bestätigte Eigenschaften 3/0,36/2,8; Undo entfernt, Redo stellt Wand wieder her. Neue Sitzung hat leere Felder; Abbrechen entfernt Hilfseingabe ohne Wand. Anschließende 3D-Darstellung visuell geprüft. Vorschau beim Zeichnen bleibt eine 2D-Achslinie; kein neuer 3D-Zeichenvorschaumodus.


**Q0350**

Die vorhandene Polylinie als weiteren Verbraucher des gemeinsamen Interaktionsvertrags anbinden. Pro Segment den aktuellen Punkt als Ursprung bereitstellen; dieselbe Eingabe, Tab, Fangengine und Bestätigung unverändert nutzen. Doppelklick beendet weiterhin die Polylinie, ein Undo-Schritt für den Gesamtabschluss bleibt erhalten. Prüfen, dass dazu keine zusätzliche Feld-/Tab-/Hover-Steuerung oder neue Werkzeugabfrage im gemeinsamen Interaktionskern nötig ist. Neue Punktaufnahme, Abschluss und Abbruch mit numerischen Segmenten praktisch testen; keine Wandkettenentscheidung vorwegnehmen.


**Q0351**

Die aufeinander aufbauenden PRs ab #41 einschließlich dieses Stabilisierungsschritts auf Zielzweige, Abhängigkeiten und offenen Prüfstatus kontrollieren. Einen verständlichen Übernahmeplan mit finalem Entwicklungsstand und verbleibenden Einschränkungen erstellen. Bereits vorhandene Testnachweise zuordnen; zusätzliche Prüfung nur bei neuen Abweichungen. Keine neuen Funktionen und kein automatischer Merge ohne ausdrückliche Nutzerfreigabe für die betreffenden PRs.


**Q0352**

Reproduzierbarer Messlauf mit 100/1000/5000 Elementen abgeschlossen. Skript scripts/benchmark-snapping.mjs; Verfahren, Hardware, Ergebnisse und Einschränkungen unter docs/performance/SNAP_BASELINE.md, Rohwerte in der benachbarten JSON-Datei. Referenzzahlen und Modellwechsel geprüft; ESLint für das Messskript und git diff --check erfolgreich. Anwendungscode unverändert, daher bestehende 225 Tests und Build-Nachweise nicht erneut ausgeführt. PR #51 bleibt zur Dokumentationsprüfung offen; dieser Schritt baut darauf auf.


**Q0353**

Primitive Modellquellen ohne globale Kreuzungen ableiten; räumlichen Index mit vollständigem Quellen-Lookup und lokaler Punkt-/Segmentabfrage in CSS-Radius aufbauen. Lokale Schnittreferenzen mit bisheriger Geometrie, Identität und Blattabhängigkeiten berechnen. Differentialtests zum Vollaufbau innerhalb des Suchradius, einschließlich langer Segmente und numerischer Grenzen; reproduzierbare Messung mit 100/1000/5000 Elementen. Noch keine UI-/Hover-Umschaltung, keine neue Fangart und keine leeren Klassen. Der funktionierende Suchdienst liefert den Nachweis für die anschließende gemeinsame Integration gemäß docs/LOCAL_SNAP_QUERY_PLAN.md.


**Q0354**

##### Umgesetzter Folgeauftrag, vollständige Projektabnahme offen: falsche lokale Segmenttreffer vor Paarbildung reduzieren


**Q0355**

Konservativer Segment-/Suchquadrat-Test in geometry/intersections/segment-box.ts; local-sources wendet ihn nach Boxsuche und Werkzeugfilter vor Paarbildung an. Originalsegmente und vollständiger Quellenlookup bleiben erhalten. Sechs neue Tests sowie 41 vorhandene reine Engine-Testfälle isoliert bestanden. Die vollständige Projekttestsuite, TypeScript, Build, Lint und Browserabnahme sind in dieser Umgebung mangels installierter Abhängigkeiten offen; kein produktionsreifer Abschluss behauptet. Draft auf Basis von PR #57, kein Merge.


**Q0356**

Testfixture mit festen Koordinatentupeln typisiert; alter Dichtetest erwartet für entfernte Diagonalen null Segmente/Paare. Echte Kreuzungen und Differentialvergleich bleiben geprüft. Formatierung korrigiert. 244 Tests, TypeScript, Build erfolgreich; ESLint 0 Fehler/6 bekannte Warnungen.


**Q0357**

Entwurf gegen gemeinsame ToolSnapPolicy, Hover und Picking abgleichen. Zustands- und Quellenvertrag sowie eine begründete vorläufige Auslöseschwelle mit Hysterese vorschlagen. Verhalten ohne Auswahl, bei Abbruch, Idle-Hover und Modellwechsel festlegen. Endpunkt-/Mittelpunktfang, aktive Führungen und feste Achsen erhalten. Ein kleines Umsetzungspaket mit Tests ableiten; noch keine automatische Einschränkung oder Dialoge implementieren.


**Q0358**

Nur Dokumentation verändert; kein neuer Test-/Build-/Browserlauf nötig. Bestehende 244 Tests und Abnahme aus PR #58 beziehen sich auf unveränderten Anwendungscode. PR #58 und #57 weiterhin offen; kein Merge in diesem Planungsauftrag.


**Q0359**

Grenzen: dichte automatische lokale Schnittpunkte bewusst pausiert, manuelle Referenzauswahl fehlt noch. Primitive Suche und Punktranking bleiben mengenabhängig. Keine 3D-Arbeitsebene. PRs #57–59 weiterhin offen.


**Q0360**

Grenzen: zunächst gerade Segmentquellen in 2D; explizite Punktübernahme fehlt. Quellschlüssel gelten für den aktuellen Modellsnapshot und werden nach Modell-/Vorgangswechsel verworfen. Komplette Modal-/Tastaturmatrix noch nicht browserautomatisiert. Ältere gestapelte PRs bleiben offen.


**Q0361**

250 Tests bestanden, TypeScript/Build erfolgreich; ESLint 0 Fehler/6 bekannte Warnungen nach Korrektur einer verbliebenen Formatierung in snapping.ts. Browser: normales Panel verborgen, Einstieg im Elementmenü und Linienwerkzeug, Abbruch blendet Panel wieder aus. Nächster Auftrag bleibt gezielte Punktübernahme gemäß obigem Folgeauftrag. Ergänzung im offenen PR #61, kein Merge.


**Q0362**

Grenzen: bestehende 2D-Modellpunkte; keine explizite Übernahme berechneter Schnittpunkte, diese bleiben per Hover verfügbar. Punkt-Arbeitskopie gilt jeweils für eine Übernahme. Vollständige Modal-/Mehrviewport-Matrix bleibt offen. PR #61 nicht zusammengeführt. Shell-Fetch derzeit ohne Netzwerkverbindung; Veröffentlichung über GitHub-Connector, vorhandene lokale Änderungen erhalten.


**Q0363**

Vorhandene 3D-Kamera, Picking und gemeinsame ToolInteraction gegen den 2D-Fangpfad prüfen. Einen begrenzten technischen Vertrag für eine horizontale aktive Arbeitsebene mit Welt-/Ebenenkoordinaten, CSS-Fangradius, stabiler Zielauswahl und derselben Application-Aktion dokumentieren. Ebenenwechsel, Ursprung, Referenzen und Abbruch festlegen; Vorschläge von bestehenden Entscheidungen trennen. Noch keine neue Fangengine, keine beliebigen Dach-/Schnittebenen und keine neuen Bauteile implementieren. Daraus genau ein kleines Umsetzungspaket ableiten.


**Q0364**

Dokumentationsauftrag auf acc5c44 (PR #63 weiterhin offen, kein Merge). Vorhandene orthographische Kamera, Solid-/Wand-Picking, gemeinsame ToolInteraction, skalare Fangmetrik und Moduswechsel im Workspace untersucht. docs/3D_WORKPLANE_PLAN.md trennt Codebefund, verbindliche bestehende Grenzen und Vorschläge. Startvorschlag z=0 passt zum aktuellen XY-Modell; keine erfundene Geschosshöhe oder freie Z-Bewegung. Eine Wand-ID aus pickWall ist noch kein geometrischer Bewegungsursprung.


**Q0365**

Grenzen: nur orthographische horizontale Ebene; numerische Fehlerschätzung ist keine formale Intervallgarantie und umfasst keine Eingabegeräte-/Quellfehler. Noch keine anisotrope Fangmetrik im gemeinsamen Resolver. Gesten, verdeckte Ziele und sichtbare Ebenenanker bleiben offen.


**Q0366**

Einen fachunabhängigen numerischen Vertrag für affine Ebenen-zu-CSS-Metrik ergänzen und die gemeinsame lokale Punkt-/Segment-Vorauswahl darauf umstellen: konservative Suchbox, exakter CSS-Punkt-/Segmentabstand vor Dichtezählung und Paarbildung. Den heutigen isotropen 2D-Faktor über denselben Vertrag mit unveränderten Ergebnissen abbilden. Schrägansicht, lange Segmente, Fangradiusgrenzen und Dichtezählung testen; bestehende 2D-Tests und Build erhalten. Noch keine 3D-UI aktivieren: Ranking, Führungen, Hover und manuelles Picking benötigen danach denselben Vertrag, bevor ein vollständiger 3D-Fangpfad freigeschaltet wird. Keine per-Werkzeug-Metrik und keine globale Schnittpunktliste.


**Q0367**

Praktische Abnahme: zwei lange Linien kreuzen lassen, Linienwerkzeug nahe der Kreuzung bewegen, Schnittpunkt und End-/Mittelpunkte prüfen. Eine Referenz 0,6 Sekunden aktivieren, zoomen und weiterzeichnen; aktive Hilfslinie soll erhalten bleiben. Bei dichter Geometrie dürfen nur nahe Linien zur Dichteschranke beitragen. Schrägansicht ist mathematisch getestet, aber noch keine aktivierte 3D-Fangbedienung.


**Q0368**

Den bestehenden Resolver-Vertrag für Punktkandidaten um dieselbe ScreenMetric erweitern und End-/Mittel-/Schnittpunkt-Abstände samt Rangfolge darüber bewerten. Gemeinsamen Application-Quellenadapter konsistent mit derselben Metrik versorgen; bisherige numerische 2D-Aufrufe kompatibel erhalten. Affine Kandidaten am Radiusrand, konkurrierende Ziele, deterministische Gleichstände und 2D-Differenzialfälle testen. Noch keine 3D-UI aktivieren und fachliche Modellwinkel/-längen nicht in Bildschirmwinkel umdeuten. Führung/Segment-Hover/manuelles Picking bleiben ausdrücklich weitere Anschlussstellen vor Freischaltung des vollständigen 3D-Pfads.


**Q0369**

Eine numerische Projektion auf eine Modellgerade nach minimalem CSS-Abstand in ScreenMetric ergänzen. Gemeinsame Führungs-Kandidaten und deren Abstände darüber führen, einschließlich berechneter Führungsschnittpunkte. Modellrichtungen, Shift-/Ortho-Vorgaben, Winkel/Längen und fachliche Achsenzwänge bewahren; keine Bildschirmwinkel als Modellwinkel behandeln. Isotrope 2D-Parität, affine Lotprojektion, konkurrierende Führungen, entfernte aktive Referenzen und Radiusgrenzen testen. Keine 3D-UI aktivieren; Hover und explizites Picking bleiben danach offene Anschlüsse.


**Q0370**

Punkt- und Segment-Hover im gemeinsamen Inference-/Application-Pfad an ScreenMetric anschließen, einschließlich CSS-Abstand und nächstem Punkt auf einem endlichen Segment. 600-ms-Erwerb/Entfernen, Kapazität, Ursprungsschutz, Zoom-Erhalt und Modellinvalidierung bewahren. Affine Segmentnähe, Endpunktbegrenzung, Dwell-Wechsel und isotrope 2D-Parität testen. Keine neue Oberfläche und keine 3D-Freischaltung; explizites Referenz-Picking bleibt danach als eigener begrenzter Anschluss offen.


**Q0371**

Punkt-/Segment-Picking im bestehenden manuellen Referenzauswahlmodus auf ScreenMetric umstellen, einschließlich CSS-Radius, nächstem Segmentpunkt und stabiler Mehrdeutigkeitsliste. Bestehende isotrope 2D-Aufrufe kompatibel halten. Auswahl/Übernehmen/Abbruch, Quellenfilter vor Paarbildung, affine Trefferreihenfolge und Radiusgrenzen testen; den gemeinsamen 2D-Ablauf einschließlich Hover/Zoom praktisch im Browser abnehmen. Keine zweite Auswahloberfläche und noch keine 3D-Freischaltung; offene Sichtbarkeits-/Gestenentscheidungen anschließend gesondert prüfen.


**Q0372**

Browser: Wandecke im Punktmodus übernommen, Zoom erhält Referenz; zweite Punkt-Arbeitskopie abgebrochen, erste Referenz bleibt. Erneutes Hover löst den Punkt, nach Verlassen und neuem Hover wird er wieder aktiv. Wandachse im Linienmodus gewählt und übernommen; Zoom erhält einen Linienfilter und aktiven Hilfspunkt. Screenshot outputs/reference-picking.jpg außerhalb des Repositories. Keine genaue Browser-Zeitmessung der 600 ms, diese bleibt automatisiert geprüft; keine vollständige Mehrviewport-/Direct-Edit-Matrix.


**Q0373**

Einen gemeinsamen Rendering-Dienst ergänzen, der einen projizierten 3D-Anker anhand desselben Projektionsstands und der dargestellten Wanddreiecke als sichtbar, verdeckt oder außerhalb klassifiziert. Bestehende Tiefen-/Dreiecksmathematik wiederverwenden oder eng begrenzt extrahieren; keine zweite Picking-Engine. Öffnungen, überdeckende Wände, Rand-/Tiefentoleranzen, Kamerabewegung und ungültige Projektionen testen. Nur technische Klassifikation, keine automatische Referenzaktivierung, X-Ray-Entscheidung oder neue Gesten. Produktregeln für verdeckte Ziele und Orbit/Werkzeugklick bleiben ausdrücklich offen.


**Q0374**

Vor dem Anschluss an Mausereignisse die offenen Regeln aus docs/3D_INTERACTION_CONTRACT.md als kurze konkrete Entscheidungsvorlage fuer eine rein lesende 3D-Fangvorschau vorlegen: Umgang mit verdeckten Zielen, Aktivierung der Vorschau und Vorrang von Orbit gegenueber Hover/Referenzerwerb. Bestehende 600-ms-Regel, silbergraue Ringe und gemeinsame Engine bewahren. Nutzerentscheidung einholen, ohne aus PR-Freigaben eine neue Gesten- oder X-Ray-Regel abzuleiten. Erst danach die begrenzte Vorschau integrieren; noch keine Modellbewegung.


**Q0375**

Grenzen: erster Adapter fuer Waende. Fenster sind weiterhin Oeffnungen, keine eigenen ausgewaehlten 3D-Koerper. Andere Bauteilarten folgen mit ihrer Geometrie; keine leeren Adapter. Kantenableitung verlangt konforme Flaechen mit identischen gemeinsamen Koordinaten; keine allgemeine T-Junction-Reparatur oder Topologieheilung. Sehr nahe Oberflaechen unterhalb des kleinen NDC-Bias koennen visuell zusammenfallen. Keine Grossprojekt- oder Mehr-GPU-Leistungsmessung. Bestehende Projektions-/Clipping-Grenzen bleiben offen.


**Q0376**

Grenzen: GPU-Tiefengenauigkeit bleibt endlich; bei sehr grossen Entfernungen koennen eng benachbarte Flaechen durch NDC-Toleranz/Umrandungsbias optisch zusammenfallen. Kein Grosskoordinaten-Umbau und keine neue Kameraart. Beim Wechsel einer Tiefenstufe kann eine laufende Hover-Verweildauer unterbrochen werden; aktivierte Referenzen und gepinnter Ursprung bleiben erhalten. Automatisierte Pruefung verschiedener Kameras, keine Mehr-GPU-Abnahme.


**Q0377**

Grenzen: nur z=0-Materialkanten, keine oberen Kanten oder freie Z-Fuehrung. Segmentmittelpunkt muss zusaetzlich zum Hoverpunkt sichtbar sein; teilweise verdeckte Kanten koennen daher konservativ entfallen. Mesh-Unterteilungen an Oeffnungen koennen mehrere kollineare Referenzabschnitte ergeben. Keine allgemeine Sichtbarkeitszerlegung oder Grossprojekt-/Mehr-GPU-Messung. Temporäre Referenzen werden nicht gespeichert oder exportiert.


**Q0378**

Offen bleibt die manuelle Abnahme von tatsaechlichem Browserdownload und erneutem Oeffnen derselben Datei: die vorhandene Browsersteuerung kann keinen Datei-Upload, native Desktopautomatisierung ist fuer diese App nicht zulaessig. Kein pauschaler Vollabnahme-Status. Dateirundlauf und IFC-Inhalt sind automatisiert nachgewiesen. Konkrete Anleitung und weitere Grenzen stehen in docs/acceptance/2026-10-04-parallel-workflow.md. Bestehende Hover-Unterbrechung bei Tiefenstufenwechsel und Sichtbarkeitsgrenzen nicht als neue Fehler umgedeutet.


**Q0379**

Der Nutzer hat CAD_BIM_2026_AI_Strategie.pdf als Zukunftsvision bereitgestellt. Original: docs/ai/CAD_BIM_2026_AI_Strategie.pdf; für Codex lesbarer Katalog mit AI01–AI35: docs/ai/AI_FUTURE_VISION.md. Enthält Modellabfragen, kontrollierte Änderungen, Qualitätsprüfung, generative Planung und spätere Fachanalysen. Kein AI-Feature in diesem Dokumentationsschritt implementiert. Architekturvertrag und aktueller nächster Auftrag bleiben maßgeblich. Die spätere AI-Reihenfolge lautet Lesen → Prüfen → Ändern → Entwerfen; Einordnung in den Gesamtplan folgt erst mit den erforderlichen Modell-/Werkzeuggrundlagen.


**Q0380**

PR #83 nach Nutzerfreigabe direkt per Merge-Commit 26987d1 in fix/reference-selection-lifecycle uebernommen; keine erneute Testausfuehrung des bereits geprueften Commits. main unveraendert. Auf docs/layer-migration-contract Modell-/Dateigrenze, History, lokale Fangquellen und Guide-Etappe 4 mit den relevanten N-Anforderungen abgeglichen. Schema 1 hat noch keine Ebenen. [docs/LAYER_CONTRACT.md](docs/LAYER_CONTRACT.md) dokumentiert Bestand, technische Grenzen, Schema-2-Vorschlag, kollisionssichere deterministische Migration, Verantwortlichkeiten und Abnahmekriterien. ARCHITECTURE.md erhaelt die verbindlichen Grenzen; keine Produktionsdateien oder Daten geaendert.


**Q0381**

Globale versus ansichtsbezogene Sichtbarkeit, Host-/Fensterdarstellung, Auswahl bei Ausblenden und Ebenenloeschregeln bleiben offen. Fenster auf Ebene Fenster ist ein ausdruecklicher technischer Vorschlag, keine erfundene Nutzerentscheidung. Die zwoelf Guide-Standardebenen bleiben erhalten; Raum/Textelemente ergaenzen sie. Keine Umbenennung von 2D-Zeichnungen zu 2D-Ergaenzungen. Historische N01–N60-Matrix bleibt erhalten. Dokumentationspruefung: Quellpfade und Versionsannahmen abgeglichen, Diff auf Leerraumfehler geprueft; bestehender Nachweis 327 Tests aus PR #83, keine neue Test-/Browserabnahme behauptet. Offene manuelle Dateidialog-Abnahme bleibt bestehen.


**Q0382**

Der Nutzer legt Windows und macOS als Zielplattformen fest. Browser versus installierbare Desktop-App bleibt offen. Gemeinsames Projektformat, CAD-/Domain-Logik und validierte Application-Aktionen sollen fuer beide Betriebsformen wiederverwendbar sein; Dateizugriff, Speicherung, Dialoge und Betriebssystemintegration erhalten passende Adaptergrenzen. Strg/Command, Maus/Trackpad sowie Grafik-/Abhaengigkeitskompatibilitaet sind bei betroffenen Aenderungen zu beruecksichtigen. ARCHITECTURE.md dokumentiert die Entscheidung, AGENTS.md macht sie fuer Codex auffindbar. Keine Desktop-Technologie, Mindestversion, Offline-Zusage oder neue Entwicklungsprioritaet festgelegt; die konkrete Auslieferung wird spaeter anhand eines repraesentativen Bearbeitungs-/Datei-/Exportablaufs auf beiden Systemen entschieden. Nur Dokumentation, kein Anwendungscode geaendert.


**Q0383**

Fuer ausgewaehlte Wand, Fenster oder Linie einen gemeinsamen Ebenenselektor in der vorhandenen oberen Werkzeugeigenschaften-Leiste anbieten. Existierende Ebenen nach Namen anzeigen, Werte ueber stabile IDs an die gemeinsame Zuordnungsaktion geben. Projekt-/Auswahlwechsel duerfen keine alte Zuordnung auf ein anderes Ziel anwenden; laufende Direct-Edit-Vorschau kontrolliert beenden. Undo/Redo und Dateirundlauf pruefen, vorhandene Glass-Flow-Anordnung erhalten. Keine kopierten Typ-spezifischen Mutationen. Noch keine Ebenenerstellung/-umbenennung/-loeschung oder Sichtbarkeit; deren offenen Produktregeln bleiben getrennt. Text-/Voice-Adapter koennen spaeter denselben geprueften Aktionsvertrag nutzen, ein neuer freier Parser gehoert nicht in diesen UI-Auftrag.


**Q0384**

Abnahme: Element anklicken → oben Ebene waehlen → Undo/Redo (danach Element wieder auswaehlen). Bei Fenster/Linie wiederholen. Eine Bewegung beginnen und Ebene wechseln: nur die Zuordnung wird gespeichert, keine Vorschauverschiebung. Ebenen wirken weiterhin nur organisatorisch; Ausblenden ist noch nicht implementiert.


**Q0385**

Abnahme: Organisation > Ebenen → eigene Ebene erstellen → schliessen → Wand auswaehlen und zuordnen → zugeordnete Ebene umbenennen. Im Selektor muss der neue Name erscheinen; Undo/Redo bleibt nutzbar. Noch keine Sichtbarkeitswirkung erwarten.


**Q0386**

PR #89 nach Nutzerfreigabe normal zusammengefuehrt (48a896f), main unveraendert. docs/LAYER_VISIBILITY_PLAN.md dokumentiert Codeabgleich und vorhandenen allowed-Filter vor lokalen Paarvergleichen. Nutzerentscheidung: BIM-Projekt samt Arbeitsansichten teilt einen Filter; Ausschnitte/Abbilder haben unabhaengige Filter, die auch im Layoutbuch gelten. Kein vorgeschalteter BIM-Filter fuer Ausschnitte. Speicherung, Ausschluss vom Picking/Fang, Abbruch verborgener Bearbeitungsziele, Host-/Fensterregel und vollstaendiger IFC-Export bestaetigt. ARCHITECTURE.md aktualisiert. Startfilter neuer Ausschnitte und Undo-Semantik bleiben offen. Produktionscode unveraendert, Dokumentationsdiff geprueft.


**Q0387**

Genau ein Folgeauftrag: die reine gemeinsame Eligibility-Policy fuer Wand/Fenster/Linie mit explizitem BIM-/DrawingDocument-Kontext implementieren und gemaess docs/LAYER_VISIBILITY_PLAN.md testen. Insbesondere dieselbe Ebene im BIM-Kontext verborgen und im Ausschnitt sichtbar pruefen. Noch keine UI-/Dateiformat-/Layout-Erweiterung in diesem ersten Auftrag.


**Q0388**

Genau ein naechster Auftrag: Darstellung und normales Picking in 2D/3D auf dieselbe explizite Eligibility-Policy vorbereiten und testen, ohne das vollstaendige Project oder reale Fensteroeffnungen zu filtern. 3D-Verdeckungsdaten muessen die sichtbare Darstellung widerspiegeln. All-visible-Kompatibilitaet erhalten, noch kein Schalter/Dateiformatwechsel. Controller-Abbruch, explizite Shift-Urspruenge, 3D-Fussquellen und Referenzauswahl muessen vor spaeterer UI-Freigabe ebenfalls angeschlossen sein; dies ist kein Nachweis vollstaendiger Sichtbarkeit. Startfilter/Undo bleiben offen.


**Q0389**

354 Tests bestanden: vier neue Tests fuer Grundrisslisten, unsichtbare Fenstersymbole bei unveraenderten Oeffnungen/IFC, verborgene Vorderwand ohne Picking/Verdeckung, unabhaengige Ausschnitte, alles verborgen sowie stale Kontexte. TypeScript/Build erfolgreich, Lint 0 Fehler/6 bekannte Warnungen. Keine neue Browserabnahme; der Nutzer kann im Canvas noch keine Ebenen ausblenden.


**Q0390**

Genau ein naechster Auftrag: den expliziten Sichtbarkeitskontext durch die bestehenden Viewport-Adapter an diese Darstellungsdaten und Fangabfragen weiterreichen. Verborgene Ziele und Vorschauen abbrechen, Griffe/Umrandungen/Referenzwahl/Shift-Urspruenge und 3D-Fussquellen konsistent behandeln. All-visible-Verhalten erhalten und Kontextwechsel automatisiert pruefen; noch keine Persistenz/Schalter freigeben, solange ein Consumer fehlt. Startfilter neuer Ausschnitte und Undo-Semantik bleiben vor Dateiintegration offen.


**Q0391**

358 Tests bestanden, davon vier neue Integrationstests fuer 3D-Fussquellen/aktive Referenzen, unabhaengigen Ausschnittfilter, Auswahl-/Abbruchgrenze ohne Modellcommit und konsistente Vorschaugeometrie. TypeScript und Build erfolgreich; Lint 0 Fehler/6 bekannte Warnungen. Browserabnahme OFFEN: die Browserverbindung lief beim Laden/Neuladen in Timeouts, obwohl der lokale Server HTTP 200 lieferte. Deshalb kein visueller Nachweis fuer diese Integration. Kein neuer Schalter, keine Speicherung des Filters, Schema 2 unveraendert; normale Anwendung bleibt all-visible. Ausschnitt-Datenmodell und Startfilter weiterhin nicht implementiert.


**Q0392**

Genau ein naechster Auftrag: die BIM-Ebenensichtbarkeit als bedienbare, gespeicherte Projekteinstellung integrieren. Vor Umsetzung Undo-Semantik mit dem Nutzer festlegen; die ausstehende Browserabnahme dieser Adapter nachholen. Gemeinsame Ebenenliste um Sichtbarkeit erweitern, explizite Dateimigration mit all-visible fuer alte Projekte und Tests fuer Abbruch, Undo/Redo und Wiederladen. Keine neuen Ausschnitte oder Layoutfunktionen; deren Startfilter bleibt eine eigene offene Entscheidung.


**Q0393**

Schema 3 speichert bimVisibility.hiddenLayerIds. Strikte V1/V2-Migration zeigt alte Dateien vollstaendig an und erhaelt IDs, Zuordnung und Geometrie. Unbekannte/doppelte verborgene Ebenen werden abgelehnt. Palette-Verlauf ist sitzungsbezogen und wird beim Laden zurueckgesetzt; der aktuelle Zustand bleibt gespeichert. Modell-Undo/Redo behaelt die aktuelle Sichtbarkeit bei. Geloeschte Ebenen-IDs werden entfernt; durch Modell-Undo wiederhergestellte Ebenen starten sichtbar, sofern sie im aktuellen Filter nicht enthalten sind. Alte Palette-Eintraege koennen keine geloeschten Ebenen wiedererzeugen. Ausschnitt-Startfilter bleibt offen; es werden weiterhin keine DrawingDocuments angelegt.


**Q0394**

363 Tests bestanden, darunter fuenf neue Tests fuer gemischte Modell-/Palette-Verlaeufe, erhaltenes Modell-Redo, Abbruch mit spaetem Commit, JSON-Rundlauf und IFC, strikte V2-Migration/ungueltige Filter, Laden und geloeschte Ebenen. TypeScript und Build erfolgreich; Lint 0 Fehler/6 bekannte Warnungen. Browserabnahme weiterhin OFFEN: CDP-Fokusbefehl und Navigation laufen auch in einem neuen Tab in Timeouts. Keine erfolgreiche visuelle Abnahme behauptet.


**Q0395**

365 Tests bestanden, TypeScript und Produktionsbuild erfolgreich; Lint 0 Fehler/6 bekannte Warnungen. Zwei neue Tests pruefen alle vier Aktionen, Teil-/Vollinversion, atomare Palette-History, No-ops sowie unbekannte IDs und veraltete Snapshots. Visuelle Browserabnahme weiterhin offen: frischer Tab scheitert beim Navigieren mit Timeout.


**Q0396**

365 Tests, TypeScript und Build erfolgreich; Lint 0 Fehler/6 bekannte Warnungen. Keine redundanten neuen Tests fuer die reine zweite UI-Anbindung. Praktische Browserpruefung erneut versucht: Navigation auch in einem neuen Tab mit Timeout, daher weiterhin kein visueller Nachweis. Nutzerfreigabe und automatisierte Nachweise ersetzen diesen offenen Nachweis nicht; Browserproblem separat offen halten.


**Q0397**

375 Tests bestanden, davon zehn neue Polygon-Tests: Rechteck/Flaeche/Umlauf, Konkavitaet, kollineare Zwischenpunkte, ungueltige Koordinaten, Nullkanten/Schlusspunkt, Selbstschnitte mit und ohne Nettoflaeche, Selbstberuehrungen, Ruecklauf einschliesslich Ringschluss, Ueberlappung, kleine Konturen, grosse Versatze und Zahlenbereich. TypeScript und Build erfolgreich; Lint 0 Fehler/6 bekannte Warnungen. Testdatei im normalen npm-test-Lauf registriert. UI und Schema 3 unveraendert; keine neue Browserfunktion abzunehmen. Die vorher offene praktische Ebenenabnahme bleibt separat offen.


**Q0398**

381 Tests bestanden, sechs neue Tests fuer Vorschau/Mutation/Commit/No-op/Undo/Redo, ungueltige Geometrie/Fuellung/IDs/Ebenen, stale Zielkontext, Ebenenschutz/Sichtbarkeit, Dateirundlauf/IFC-Unveraendertheit und strikte V3-Migration. Bestehende Tests und aktuelle Runtime-Fixtures explizit auf V4 angepasst; echte Altdateien bleiben Altversionen. TypeScript und Build erfolgreich; Lint 0 Fehler/6 bekannte Warnungen. Kein sichtbares Schraffurwerkzeug, Renderer, Picking oder Direct Edit in diesem Modellschnitt, keine neue Browserabnahme. Die offene Ebenen-Browserabnahme bleibt bestehen.


**Q0399**

PR-Anzeige geprueft: Chat enthaelt weiterhin historische PR-Verknuepfungen, auch nach Merge. Auf GitHub waren vor Integration #97 acht PRs offen; danach verbleiben die alten #51-54/#57-59. Die ersten sechs Heads sind Vorfahren des aktuellen Entwicklungszweigs. Bei #59 fehlt nur der Merge-Commit dc1b1f5, dessen beide Eltern bereits enthalten sind. Diese alten PRs zielen auf main bzw. historische Zwischenzweige; keine automatische Komplettuebernahme nach main im Schraffurauftrag. Verknuepfung, GitHub-PR-Status und Integration in main sind getrennte Zustaende.


**Q0400**

Solide Fuellung mit Farbe/Deckkraft erscheint hinter Waenden und Linien; Auswahl per Flaeche oder Navigator mit dezenter Umrandung. Eigenschaften in der festen oberen Leiste; Fuellungsanpassung ueber gemeinsame Hatch-Aktion, Ebenenzuordnung ueber bestehende Layer-Aktion. ElementTarget trennt auswaehlbare Elemente von momentan per Direct Edit bearbeitbaren Zielen. Keine vorgetaeuschten Schraffur-Bewegungsaktionen; AI/Text/Voice behaelt die stabile Auswahl und lehnt unpassende Wand-/Fensterbefehle ab. Schraffur-Sprachbefehle, Konturbearbeitung, Muster, optionale Kontur und Aussparungen bleiben offen.


**Q0401**

385 Tests bestanden: vier neue Integrationsfaelle fuer gemeinsame numerische Eingabe/Ursprung/Abbruch/Commit/History/JSON, Ringschluss/ungueltige/stale Abschluesse, geschlossene Fangquellen/verborgene Ebenen und Auswahl/Ebenenzuordnung/Plan-Grenzen/abgewiesene Sprachziele. Bestehender All-hidden-Darstellungstest um leere Schraffurliste erweitert. TypeScript und Build erfolgreich; Lint 0 Fehler/6 bekannte Warnungen. Browserabnahme OFFEN: Navigation eines frischen Tabs zu 127.0.0.1:8080 erneut mit Timeout; kein visueller oder echter Doppelklick-Nachweis behauptet.


**Q0402**

Die lokale Quellenabfrage erkennt diese Referenzen anhand ihrer exakten Interaktionsidentitaet, auch wenn sie keine sichtbare Modell-ID haben. Abgeleitete Hilfspunkte behalten ihre Originalabhaengigkeiten; ein neuer/abgebrochener Zeichenvorgang akzeptiert alte Quellen nicht. Zoom aendert die Policy-Identitaet nicht. Snap aus unterdrueckt den automatischen Fang. Bestehende Shift-Regel bleibt erhalten: explizite 45-Grad-Richtungsbindung hat Vorrang vor automatischem Schnittpunktfang. Fuer den Rechteckabschluss daher Shift loslassen. BimPlan behaelt den Fangkandidaten auch bei der gemeinsamen Eingabevorschau, solange deren Ziel dem Fangpunkt entspricht, und kann beide wirksamen Fluchten/Schnittpunktmarker zeigen.


**Q0403**

391 Tests bestanden, TypeScript/Build erfolgreich, Lint 0 Fehler/6 bekannte Warnungen. Neue Regression prueft acht Mauspositionen im Fangkreis, fuenf Shift-kompatible Drehungen und drei Zoomstufen fuer beide Erstellungsarten; gespeicherte dritte/vierte/erste Ecke bilden jeweils einen rechten Winkel. Zusaetzlich exakter Endpunkt, Abweisung ausserhalb der Achse/des Radius, unveraenderte freie Projektion, ausgeschalteter Fang und View-Filter. Bisherige Tests fuer den alten Shift-Bypass an kompatiblen Mittel-/Schnittpunkten auf die neue Nutzerregel aktualisiert; feste Bearbeitungsachsen und anisotrope Projektionspruefungen bestehen weiterhin. Praktische Browserabnahme bleibt offen; kein neuer visueller Nachweis behauptet.


**Q0404**

Umfang fuer die spaetere Umsetzung: zentrale positive endliche Rasterweite in Metern, separate Rasterfang-Aktivierung bei weiterhin aktivem End-/Mittel-/Schnittpunktfang, nachvollziehbare Anzeige der wirksamen Schrittweite. Hintergrundraster und Fangraster ausdruecklich unterscheiden. Alle Zeichen- und Bearbeitungswerkzeuge verwenden denselben Einstellungsvertrag und die bestehende Engine; keine werkzeugspezifischen Rasterkopien. Bestehende Fangprioritaeten, feste Achsen, exakter Shift-Punktfang, 600-ms-Referenzen und Zoom-Erhalt bleiben bestehen. Konkrete UI-Platzierung, Werteauswahl und Speicherung als Benutzer- oder Projekteinstellung sind noch offen, nicht als Nutzerentscheidung vorweggenommen. Kein neues Dateiformat und keine Implementierung in diesem Dokumentationsschritt.


**Q0405**

Genau ein naechster ausfuehrbarer Auftrag: den integrierten Schraffurablauf praktisch abnehmen und gefundene Bedienfehler beheben. Rechteck mit gehaltenem Shift zeichnen, exaktes Zentrum beim vierten Punkt pruefen, per Doppelklick abschliessen, Fuellfarbe/Deckkraft aendern, Undo/Redo sowie Speichern/Laden pruefen; danach Ebene ausblenden und Ausschluss aus Auswahl/Fang bestaetigen. Rastersteuerung bleibt als anschliessender kleiner gemeinsamer Komfortschritt vorgemerkt; Muster und Direct Edit werden hier noch nicht begonnen.


**Q0406**

Keine Laufzeitdateien geaendert, keine neuen Build-/Testlaeufe erforderlich. Die 391 automatisierten Tests bleiben der vorherige Nachweis, kein neu ausgefuehrter Lauf. Teilabnahme ersetzt die beiden offenen Bediennachweise nicht.


**Q0407**

Genau ein naechster begrenzter Auftrag: Farbuebernahme und Download/Wiederoeffnen im Browser isoliert klaeren und nur nachgewiesene App-Fehler beheben. Danach ist die gemeinsame Rastersteuerung der vorgemerkte Komfortschritt.


**Q0408**

Genau ein naechster Auftrag: die bereits vorgemerkte gemeinsame Rastersteuerung mit unabhaengigem Rasterfang und positiver Schrittweite sitzungsbezogen implementieren und fuer Zeichen- sowie Bewegungsaktionen pruefen. Schraffur-Kantenoffset, Muster und Sprachbefehle bleiben weitere Anforderungen.


**Q0409**

Genau ein naechster Auftrag: den weiterhin unbestaetigten weiss-schwarzen Kreis anhand des konkreten ausloesenden Bedienablaufs reproduzieren und die Ursache beheben; danach zur vorgemerkten zentralen Rastersteuerung zurueckkehren.


**Q0410**

Abnahme: Aussenkante einer Schraffur oder geschlossenen Polylinie direkt anklicken, Seite strecken waehlen, senkrecht ziehen oder Mass eingeben. Die blauen Doppelpfeile bleiben alternative Griffe. Offene Polylinien erhalten keine geschlossene Konturbearbeitung.


**Q0411**

Vorschlag fuer spaeter: rechtwinklige Zwei-Wand-Ecke mit gleicher Staerke/Hoehe und ohne Oeffnung in der Endzone, gemeinsame Gehrungsgrenze, stabile Wand-IDs. Vorschlag ausdruecklich getrennt von verbindlichen Architekturregeln. Achswechsel, Anschlussabsicht/Persistenz, Mitbewegen von Nachbarn, ungleiche Staerken, Griffversatz bei Drehung und Oeffnungs-Endzone bleiben offen. Keine Nutzerentscheidung erfunden. Akzeptanzfaelle fuer 2D/3D/IFC, Reihenfolge/Richtung, History/Datei und Sichtbarkeit dokumentiert.


**Q0412**

PR #107 nach Freigabe normal in den Integrationszweig gemergt (ea8db92). BimPlan zeigt fuer die ausgewaehlte sichtbare Wand eine blaue gestrichelte Mittellinie direkt aus start/end der angezeigten, gegebenenfalls gueltigen Vorschaugeometrie. Strichstaerke 1.25 CSS-Pixel mit non-scaling-stroke, pointer-events none; bestehende Eckgriffe bleiben bedienbar. Keine Modellkopie, neue Fangquelle, Aktion, Schema- oder IFC-Aenderung. 3D-Achse und Achsversatz bleiben offen.


#### Herkunft: GUIDE_BASELINE.md

Status: historische ungeordnete Prüfkandidaten, gegen zentrale aktuelle Einträge abzugleichen.


**Q0413**

ARCHITECTURE.md bleibt maßgeblich; DEVELOPMENT_GUIDE.md liefert die aktive Reihenfolge. Keine CAD-Implementierung in dieser Etappe. Nachweise sind aktueller Code und heute ausgeführte automatisierte Prüfungen. Bediennachweise aus STABILIZATION.md und dem Kamera-Abschluss wurden zuvor erhoben; heute kein neuer Browser- oder Live-Mikrofontest. Historische Modul-README-Dateien enthalten teilweise überholte Aussagen (z.B. Undo oder Griffe noch geplant); der aktuelle Code ist maßgeblich.


**Q0414**

commands.ts und voice.ts bieten begrenzte deterministische Maßbefehle mit stabiler Auswahl, Vorschau und Schutz vor veraltetem Kontext. Kein frei interpretierender KI-Dienst. Reale Erkennungsprobleme bleiben offen. Direct Edit verwendet transforms.ts und validiert gegen den Ausgangszustand. BimPlan berechnet die Vorschau; CadWorkspace koordiniert EditSession, Auswahl und History-Commit. Genau diese Orchestrierung ist der nächste begrenzte Migrationspunkt.


**Q0415**

- C01: gemeinsame dezente 3D-Auswahlumrandung für alle Elementtypen bleibt offen. BimSolidView hebt gegenwärtig die Wandfarbe hervor; Fensterwahl markiert den Host. Geplante Zuständigkeit rendering/solid und gemeinsames Picking; stabile IDs beibehalten.
- C02: reale deutsche Sprachbefehle zuverlässiger erkennen bleibt offen. voice.test deckt simulierte Ergebnisse ab, keine Mikrofonqualität. Vor Erweiterung reproduzierbare erkannte Transkripte gegen Parser prüfen.
- C03: Eigenschaften oben, Bewegungsaktionen am Zeiger sind vorhanden (CadWorkspace/BimInspector/DemandMenu); diese Anordnung erhalten.
- C04: Polygonabschluss per Doppelklick ist für Polylinien vorhanden; schließt den Umriss nicht automatisch. Künftige Flächenwerkzeuge brauchen eigene gültige Abschlussregeln.
- Frühere Wünsche nach Wandanschlüssen, mehreren Geschossen/Decken bleiben als fachliche Abhängigkeiten erfasst. Vor automatischer Raum-/Höhenableitung den nötigen Umfang ausdrücklich planen; kein vollständiges Dachwerkzeug still hinzufügen.


**Q0416**

Betroffene Grenzen: neues application/direct-edit-Modul hält Start, Vorschau, Bestätigung und Abbruch einer Bewegung; CadWorkspace und BimPlan binden es ein. Auswahl über stabile ID/Typ; Project bleibt history.present. Die Application darf weder Komponenten noch DOM importieren. Vorhandene Maßeingaben und Textbefehle bleiben auf ihren geprüften Modelloperationen; keine umfassende Migration in diesem Teilauftrag. Eine kleine Importgrenzen-Prüfung nur dann ergänzen, wenn sie tatsächliche Importauflösung zuverlässig erfasst.


**Q0417**

Das ist der nächste Implementierungsauftrag, noch keine Umsetzung in Etappe 0. Endpunktfang folgt nach diesem nachgewiesenen Application-Schritt. Bestehende volle Lint-Fehler sind ein separater bekannter Prüfpunkt und dürfen nicht als neue Regression oder erfolgreiche Gesamtprüfung ausgegeben werden.


#### Herkunft: NOVIKOV_ARCHITEKTUR_REVIEW_UND_FUNKTIONSMAP.md

Status: historische ungeordnete Prüfkandidaten, gegen zentrale aktuelle Einträge abzugleichen.


**Q0418**

Die Engine bietet derzeit Endpunkte, Raster, Achsführungen, Flucht, Lot, Diagonalen, Shift-Winkel und horizontale/vertikale Konstruktionen aus mehreren Hover-Referenzen. Der Kandidatentyp `intersection` bedeutet hier einen Schnittpunkt temporärer Achsführungen. Daraus folgt noch kein allgemeiner Schnittpunktfang zwischen Modellsegmenten. Mittelpunkte und beliebige Richtungsschnittpunkte sind noch nicht implementiert.


#### Herkunft: STABILIZATION.md

Status: historische ungeordnete Prüfkandidaten, gegen zentrale aktuelle Einträge abzugleichen.


**Q0419**

- F11: gemeldete Spracherkennungsfehler weiterhin offen; kein Mikrofontest in diesem Ablauf.
- F12: gemeinsame dezente 3D-Auswahlumrandung weiterhin offen.
- 2D-Zoom/Pan, intelligente Fangpunkte/Hilfslinien und Wandverbindungen noch ausstehend. Räume/Wohnflächen erst danach.
- Fenster sind Öffnungen ohne Rahmen/Glas; überlappende Fenster sind im bisherigen Modell möglich.
- Kein Autosave. Nicht übernommene Formulareingaben sind nicht Teil der Projektdatei.
- Lokale Git-Historie hinkt dem per Connector veröffentlichten Stand hinterher; verbindlich ist der GitHub-Commit des Prüf-PR. Keine Historie umgeschrieben.


**Q0420**

Der durchgehende automatisierte Test enthält jetzt zusätzlich die tatsächlich von der Mausbedienung verwendete Aktion editAtPointer: 6-m-Wand von (2,3) nach (4,2) verschieben, gehostetes Fenster entlang der Wand um 0,60 m versetzen, beide Änderungen einzeln mit Undo/Redo prüfen, JSON wiederherstellen und IFC erzeugen. Prüft stabile IDs/Host, Fensterposition 0,6, 3D-Grenzen und Volumen sowie die IFC-Wandplatzierung (4,2,0). Der bisherige Browsernachweis bleibt auf den oben dokumentierten Ablauf beschränkt; die kombinierte Verschiebeabnahme ist noch offen. Daher Etappe 1 noch nicht pauschal als vollständig abgeschlossen markieren. Neue verbindliche Reihenfolge: DEVELOPMENT_PLAN.md.


**Q0421**

Die zuvor offenen Abschlussbedingungen sind erledigt. Lokaler Branch test/stage-one-movement-workflow wurde nach Sicherung des alten Arbeitsverzeichnisses auf den veröffentlichten Commit 4294424b20841d1920ee7f24937b23746e2968ab synchronisiert. Die alten und neuen Dateien wurden vor dem Wechsel abgeglichen; der alte Stand bleibt als Git-Stash gesichert. Git-Fetch gelang mit dem OpenSSL-Backend bei unveränderter Zertifikatsprüfung. Keine veröffentlichte Historie geändert.


**Q0422**

Damit ist Etappe 1 technisch abgenommen und als Entwicklungsstand gesichert. Die Grenzen oben bleiben gültig. Freigabe/Übernahme nach main ist eine separate Prüfung; kein Merge und keine stabile Release-Veröffentlichung erfolgt. Nächster kleiner Schritt ist die 2D-Kamera-/Maßstabsgrundlage innerhalb Etappe 2, anschließend Endpunkt-/Mittelpunkt-/Schnittpunktfang.


#### Herkunft: benchmarks/README.md

Status: historische ungeordnete Prüfkandidaten, gegen zentrale aktuelle Einträge abzugleichen.


**Q0423**

This is a baseline diagnostic of the current implementation, not a future
requirement to keep reallocating all objects, a latency test, or a heap measurement.
Update the reallocation observations when the preview representation changes.
See [the architecture review](../docs/performance/ARCHITECTURE_REVIEW_2026-10-07.md)
and its captured `architecture-audit-2026-10-07.json` for scope and implications.


**Q0424**

Select 100, 1000 or 5000 elements and optional embedded image, then Load scenario.
Each ten elements include two connected walls, a window and seven lines (one
line is replaced by a reference for image cases). Image generation uses seeded
noise in a 1400x1400 canvas, encoded as a real PNG; fixtures remain below 10 MiB.
Image encoding and fixture construction are included only in fixture/load timing.


**Q0425**

Before/after runs must use identical fixtures and the same browser/server/config.
Check selected property values, applied changes and Undo/Redo as separate functional
acceptance. Report missing measurement coverage explicitly rather than extrapolate.


**Q0426**

Dense T connections replaces 20 lines with stationary branches on a longer first
host (equal thickness/height, existing corner/window retained). The driver compares
rendered wall profiles, seams and openings against the frozen pre-pilot full path
outside timing, then checks Shift hold/release, Tab length/angle and numeric preview.
These additional checks were added after the six primary measurement runs; the
saved dense run includes them. Both preview and final DOM must match.


**Q0427**

The older architecture-audit and Measure core/groupPreview exercise full snapshot
materialization, not the new pointer path. Their allocation counts remain useful
for the final boundary but must not be described as current pointer allocations.
Raw reports are diagnostic data, not CI timing thresholds. The product imports no
benchmark driver, instrumentation or frozen oracle.


#### Herkunft: docs/CORNER_IFC_ACCEPTANCE.md

Status: historische ungeordnete Prüfkandidaten, gegen zentrale aktuelle Einträge abzugleichen.


**Q0428**

Stand: 05.10.2026. Isolierter Testexport, noch keine gespeicherte Verbindung oder
neue Aktion im normalen CAD-Export. Die Paarauswahl wird dem Testexport explizit
ueber zwei stabile Wand-IDs und Endpunktindizes uebergeben. Die Projektdatei
speichert diese temporaere Auswahl nicht als Anschluss.


**Q0429**

Nur das explizite Paar erhaelt Polygonprofile, andere Waende bleiben rechteckig.
Unterstuetzt sind die bestehenden rechtwinkligen Paare gleicher Hoehe/Staerke
mit voll enthaltenen Oeffnungen. Beruehrung/Endueberschreitung wird im Testpfad
abgewiesen; daraus folgt keine neue fachliche Produktentscheidung.
Keine persistente Verbindung, Verbindungshistorie, automatische Nachbarsuche
oder UI-Freischaltung. Offene Regeln zu Endkappen beim Loesen und
Oeffnungsberuehrung bleiben offen.


**Q0430**

Der Nutzer bestaetigt den Import des bereitgestellten Eckmodells als vollstaendig
korrekt: Fenster und rechtwinkliger Wandanschluss stimmen. Damit ist die oben
als ausstehend bezeichnete praktische Abnahme dieses Testmodells abgeschlossen.
Dies ist die Nutzerabnahme, kein durch Codex selbst ausgefuehrter Archicad-Test.


#### Herkunft: docs/T_IFC_ACCEPTANCE.md

Status: historische ungeordnete Prüfkandidaten, gegen zentrale aktuelle Einträge abzugleichen.


**Q0431**

Stand 06.10.2026. Der separate Export dient der Abnahme; der normale
Export-Button erzeugt noch keine temporären T-Verbindungen.


#### Herkunft: docs/ai/AI_CAD_PRIMARY_VISION.md

Status: historische ungeordnete Prüfkandidaten, gegen zentrale aktuelle Einträge abzugleichen.


**Q0432**

Die AI darf daraus selbstständig einen **mehrschrittigen Entwurfsprozess**
planen und Varianten im Modell erzeugen. „Vollautomatisiert“ bedeutet,
dass sie nicht Wand für Wand auf Benutzerklicks warten muss: Sie kann innerhalb
eines vom Nutzer gestarteten Entwurfsauftrags Bauteile anlegen, prüfen,
Fehler korrigieren und Alternativen bilden. Das Ergebnis bleibt mit seinen
Annahmen und Quellen überprüfbar; eine ungeprüfte Behauptung der
B-Plan-Konformität oder stiller externer Versand/Veröffentlichung gehört
nicht zum Ziel.


**Q0433**

| Stufe | Ziel und erster überprüfbarer Liefergegenstand | Voraussetzungen |
| --- | --- | --- |
| **AI-Fundament, ab jetzt** | Jede neue fachliche Aktion und Abfrage mit typisierten Parametern, IDs, Einheiten, Revisions-/Sichtbarkeitskontext und Fehlern anschlussfähig halten. Mindestens eine Maus-/Text-/simulierte Spracheingabe liefert dasselbe geprüfte Ergebnis, sofern dieser Kanal für die Aktion angeboten wird. | Architekturvertrag §19; bestehende Actions, Vorschau/Undo. Kein leeres Framework. |
| **Lesen und Befragen** | Projekt-/Element-/Geschossabfragen mit strukturierten Antworten; ein begrenzter AI-Dialog identifiziert eindeutige Ziele und benennt Lücken. | Semantische Bauteil- und Raumdaten. |
| **Kontrolliertes Ändern** | Wenige vorhandene Aktionen mit Plan, Vorschau, Diff, Kontextprüfung und Rücknahme; nachweislich gleicher Fachpfad wie manuelle Bedienung. | Fähigkeitskatalog, stabile IDs, Transaktionen. |
| **Dokumente und Regeln** | Ein abgegrenzter B-Plan-Pilot extrahiert belegte Festsetzungen und verbindet sie mit einem deterministischen Prüffall und überprüfbaren Planstellen. Unlesbare/unklare Fälle werden ausdrücklich offen gelassen. | Dokumentimport, Koordinaten/Skalen, Quellenmodell, definierter Geltungsbereich. |
| **Autonomer Entwurf** | Ein begrenztes Grundstücks-/Baukörper-/Geschoss-/Raum-Szenario erzeugt Varianten und verbessert sie iterativ im gemeinsamen BIM-Modell. | Mehrgeschossigkeit, Räume, Bauteile, Abhängigkeits- und Prüfregeln, Kapazität für reale Dateien. |


#### Herkunft: docs/performance/A03_COMMIT_VALIDATION.md

Status: historische ungeordnete Prüfkandidaten, gegen zentrale aktuelle Einträge abzugleichen.


**Q0434**

The commit median falls by 31.8%, about 442 ms; P95 falls from 1455.3 to 980.8 ms.
Cold wall solids are included in full validation and must not be added to it.
JSON-only timings exclude validation. The measured operations do not include React
rendering or frame waits. Status updates trigger workspace renders between samples;
these appear separately in the report. A slow mount and occasional automation
timeouts are not hidden: single mount samples are not used to claim improvement.
Heap fields are post-run JS snapshots affected by GC, not peak/GPU memory evidence.


**Q0435**

The file serializer and loader remain unchanged and fully validated. Input copying,
normalized no-op detection, history limits, redo branching, independent layer
visibility and stale Application action checks retain their contracts.


#### Herkunft: docs/performance/ACTIVE_MOVEMENT_PROFILE.md

Status: historische ungeordnete Prüfkandidaten, gegen zentrale aktuelle Einträge abzugleichen.


**Q0436**

The development-only driver selects 20 walls through Navigator, invokes the actual
On-Demand movement, picks its origin and dispatches synthetic DOM pointer events.
It never calls the movement Application action directly. Normal wheel handlers make
room below the fixture; actual viewBox and CSS coordinates are included in reports.
The path moves 6 CSS px right and 3 px down per sample, outside the origin snap
radius and into empty model space. All dispatched coordinates must stay inside the
SVG bounds. Setup and selection time are excluded. Each sample waits at least two
frames and verifies rendered first-wall position against the latest observed preview;
additional frame pairs (bounded to 30) wait for pending React work if necessary.


**Q0437**

Synthetic dispatch bypasses hardware input queues and hit testing. Frame callbacks
and DOM verification do not prove GPU presentation. This sequential test does not
measure event coalescing under continuous real mouse motion. The reported heap is a
post-run JS observation, not peak/GPU memory. Image-heavy setup occasionally exceeded
automation timeouts; page status was checked before retrying actions. Real user
projects, dense geometry, contour movement, peak memory and hardware input remain
open A-01 coverage. A-04 implementation remains open.


**Q0438**

Reuse the result of checkedImageUrl for unchanged image contents and dimensions
across equivalent preview asset objects, through the shared image adapter. Bound
cache retention and keep invalidation for changed content, MIME and dimensions;
invalid or replaced images must never receive a stale URL. Preserve project-file
validation and the existing preview/commit/history path. Repeat these same six
movement scenarios afterward. The double full-preview validation remains a separate
measured follow-up, not part of that first bounded cache correction.


#### Herkunft: docs/performance/ARCHITECTURE_REVIEW_2026-10-07.md

Status: historische ungeordnete Prüfkandidaten, gegen zentrale aktuelle Einträge abzugleichen.


**Q0439**

Stand: 07.10.2026. Geprüfte Codebasis: `main` nach PR170 (`4928940`), dazu
PR171 auf `perf/selection-preview-reuse` (`a588f41`). PR171 ist offen.
Dieser Bericht bewertet den bestehenden Bearbeitungsweg gegen AGENTS,
ARCHITECTURE, DEVELOPMENT_GUIDE, den P0/P1/P2-Plan und die erweiterten
Funktions-/AI-Anforderungen. Er ist keine vollständige Prüfung jeder Funktion,
Sicherheitsanalyse oder Freigabe beliebiger Projektgrößen.


**Q0440**

Das ist eine Weiterentwicklung des vorhandenen Schichtenvertrags. Weder ein
zweiter Modellkern noch ein Frameworkwechsel sind dafür erforderlich. Der hier
beschriebene lokale Vorschaupfad ist **noch nicht implementiert**.


**Q0441**

Die Navigator-Kosten sind ein Codebefund, noch keine isolierte Zeitmessung.
Der Gruppenadapter wird mit Workspace-Renders erneut gebunden; der PR171-Cache
ist absichtlich nur ein Ergebnis pro gebundenem Adapter, kein beständiger
inkrementeller Modellindex. Die Layer-Policy arbeitet auf dem bestätigten Modell;
ihre Prüfung darf ebenfalls nicht pauschal als Arbeit jedes Mausziels gezählt werden.


**Q0442**

Ein Auswertungsergebnis benötigt mindestens Modell-/Sitzungsbezug, aufgelöstes
Ziel, betroffene IDs/Beziehungen, geprüfte Geometrie und Fehlerstatus. Konkrete
Typnamen und Dateien werden beim ersten Verbraucher festgelegt. Wird später
asynchron gerechnet, sind zusätzlich Anfragereihenfolge und Verwerfen veralteter
Antworten Pflicht. Ein `requestAnimationFrame`-Takt kann Zeigerereignisse bündeln,
ersetzt aber keine schnelle Berechnung; Klick muss das tatsächliche aktuelle
Ziel übernehmen, auch wenn ein Anzeige-Frame noch aussteht.


**Q0443**

Einmalige lineare Vorbereitung ist zunächst vertretbar; wenn nahezu alle Elemente
gewählt oder fachlich abhängig sind, bleibt entsprechend große Arbeit notwendig.
Es wird weder konstante Laufzeit für beliebige Projekte noch eine konkrete FPS-Zahl
versprochen. Datei-/Assetgrenzen (A-06), Importzyklus (A-05) und übrige UI-Entlastung
(A-07) bleiben offen, ebenso die noch fehlenden Produktfunktionen.


#### Herkunft: docs/performance/ASSET_INGRESS.md

Status: historische ungeordnete Prüfkandidaten, gegen zentrale aktuelle Einträge abzugleichen.


**Q0444**

**K05a: verbleibenden Commit-Aufwand getrennt profilieren.** Mit derselben
Dreibild-Fixture Validierung, JSON-Serialisierung, Größenprüfung und Vergleich
in einer isolierten Diagnose messen. Ein-/Ausblendung, No-op und normale
Modelländerung gegenüberstellen. Aus den Daten genau eine begrenzte gemeinsame
Optimierung ableiten; noch kein Delta-History-/Dateiformatumbau und keine
Validierung abschalten. K-/V-Wünsche, größere Asset-Kapazität und kleine
Shift-Diagnose bleiben offen.


#### Herkunft: docs/performance/CAPACITY_BASELINE.md

Status: historische ungeordnete Prüfkandidaten, gegen zentrale aktuelle Einträge abzugleichen.


**Q0445**

performance.memory erfasst nur Browser-JS-Heap-Stichproben; kein Peak, kein
Prozess-RSS, keine erzwungene GC-Bereinigung, keine vollständige Decoder-/GPU-Bilanz.
Vorherige Fixtures und temporäre Strings können bis zur GC darin enthalten sein.
Assetobjekte unterscheiden sich zwischen Snapshots, Textinhalte sind gleich.
Gleiche Strings beweisen weder physische Duplizierung noch internes Sharing.
Daher keine Aussage „100 Kopien aller Bildbytes“ und keine kausale Heap-Differenz
allein durch History ableiten. Nach Rückgabe wird nur das Endprojekt in die UI
übernommen; die dortige neue History enthält nicht die 100 Diagnoseschritte.


**Q0446**

Die Baseline ist abgeschlossen, eine umfassende Großprojekt-Freigabe bleibt offen:
reale hochauflösende Pläne, Gesamtpixel nahe Budget, Prozess-/GPU-Spitzenspeicher,
mehrere 3D-Ansichten, PDF (noch nicht implementiert) und längere Echtbedienung fehlen.
Der harte Dateigrenzenbefund und steigende Vollprojektkosten bei unveränderten
Bildern rechtfertigen K02 vor einer pauschalen Erhöhung des Limits.


**Q0447**

656 Tests, Produkt-/Diagnose-TypeScript, Build und Lint bestanden (0 Fehler,
6 bekannte Warnungen). K04/K05/K06/K07/K08, kleine Shift-React-Diagnose und V01–V09
bleiben offen und werden durch diese Diagnose nicht als implementiert markiert.


#### Herkunft: docs/performance/COMMIT_PHASE_PROFILE.md

Status: historische ungeordnete Prüfkandidaten, gegen zentrale aktuelle Einträge abzugleichen.


**Q0448**

Eine ausdrücklich diagnostische Kopie der aktuellen Commit-Schritte misst die
Phasen. Auf **jeder** Stichprobe wird ihr vollständiges History-Ergebnis und
No-op-Identitätsverhalten mit dem echten `commitProject` verglichen. Reihenfolge
echter/zerlegter Messung alterniert. Ergebnisvergleich läuft außerhalb der Zeiten.
Die Diagnose muss bei Änderungen der Commit-Struktur angepasst werden; sie ist
keine zweite produktive History. Ein lokaler Browserlauf, keine plattformübergreifende
Garantie. Keine parallelen Builds während des Laufs. Kein RAM-/GPU-/FPS-Nachweis.
[Rohdaten einschließlich Einzelproben](commit-profile-2026-10-08.json).


**Q0449**

**K05b: den zusätzlichen Modellvergleich ohne zwei JSON-Serialisierungen pilotieren.**
Ein gemeinsamer strukturierter Vergleich muss dieselbe Entscheidung treffen wie
der bisherige Vergleich ohne `bimVisibility`. Identische unveränderliche Assets
dürfen direkt gleich sein; veränderte/andere Inhalte dürfen nicht über IDs allein
gleichgesetzt werden. Vollständige Projektprüfungen, erste Serialisierungen und
Dateigrößenprüfungen bleiben bestehen. Gegen den alten Pfad prüfen: No-op,
Sichtbarkeit, Modelländerung, geänderte Assets, Undo/Redo und Größenfehler.
Mit gleicher Fixture messen, keine vorab garantierte Beschleunigung. Erst nach
Äquivalenznachweis produktiv ersetzen. Kein History-/Formatumbau und keine weitere
Optimierung gleichzeitig. Übrige K-/V-Wünsche und Shift-Diagnose bleiben offen.


#### Herkunft: docs/performance/CONNECTED_WALLS_PROFILE.md

Status: historische ungeordnete Prüfkandidaten, gegen zentrale aktuelle Einträge abzugleichen.


**Q0450**

K06b: isolierter Pilot fuer Bewegung der ersten Wand einer freien Eckkette.
Nur geaenderte Wand und unmittelbar geaenderte Anschlussgeometrie neu ableiten,
stationaeren Rest aus der eigenen stabilen Basis wiederverwenden. Fachliche
Abhaengigkeitsgrenze gegen Vollpfad mit Fenstern und Fremdendpunkten beweisen;
bei T-/Mehrfachfaellen konservativer Fallback. Noch keine produktive Anbindung
oder Lockerung der Bestaetigung/Undo-Regeln.


#### Herkunft: docs/performance/DENSE_SNAPPING.md

Status: historische ungeordnete Prüfkandidaten, gegen zentrale aktuelle Einträge abzugleichen.


**Q0451**

Nachgewiesener Engpass: AABB-Überlappung allein lässt bei langen schrägen Linien zu viele Nichttreffer zu. Nächster begrenzter Auftrag: konservative Segmentnäheprüfung vor Paarbildung, unter Erhalt numerisch akzeptierter Kontakte und Originalsegmente. Der echte Kreuzungsfall bleibt eine gesonderte Grenze: eine Näheprüfung allein kann tatsächlich nahe Geometrie nicht reduzieren. Keine willkürliche Ergebnisobergrenze oder Identitätszusammenlegung, die Fangprioritäten verändert.


#### Herkunft: docs/performance/IMAGE_URL_REUSE.md

Status: historische ungeordnete Prüfkandidaten, gegen zentrale aktuelle Einträge abzugleichen.


**Q0452**

At most eight entries and 48 MiB of conservatively counted UTF-16 payload are
retained: two bytes per input and output string character. This is an admission
bound, not a measured process-heap guarantee; runtime object/string overhead and
browser-decoded pixels are separate. Oversized results are returned but not cached.
No project/asset objects, Blob URLs or decoded bitmaps are retained. Normal project
and import validation remain intact; cached presentation checks cannot replace them.
Cold image processing remains unchanged. The constants are implementation bounds,
not a new user-facing project or image format limit.


**Q0453**

The 5000-PNG path still takes 1603.3 ms median. Two full validations remain per
recorded target, totaling 841.3 ms median / 883.8 ms P95 in that case. These inclusive
nested phases cannot be summed or subtracted as independent exclusive costs.
Wall derivation and rendering remain costly. This correction does not close A-04.


**Q0454**

All six acceptance sequences passed: 20 selected walls, 21 rendered nonzero
previews, Escape with no history entry, placement, one Undo and Redo. As before,
first-wall DOM geometry is the completion probe; full group semantics are covered
by model regressions. Synthetic events bypass hardware input queues/hit testing;
frame callbacks do not prove GPU presentation. Dense geometry, real projects,
contours, peak memory and continuous hardware motion remain open coverage.
Setup/status automation occasionally timed out for large fixtures; status was
checked before retrying. These were not failed timing samples.


**Q0455**

Practical check: open a project with a PNG/JPEG reference, select several walls,
choose Auswahl frei bewegen, select an origin and move the pointer. The image must
stay visible. Escape must leave the project unchanged; repeat, place and verify
Undo/Redo. Large-model movement is still slow and is the next target below.


**Q0456**

Remove the duplicate validation of the same group-movement preview requested by
precision input and plan rendering. Reuse one validated preview only within an
unchanged movement context and identical target. Changed model, selection,
visibility, origin or target must invalidate it; do not bypass final commit/stale
context checks or weaken validation. Keep this in the shared interaction/Application
path, not per-element UI logic. Add regression evidence for reuse/invalidation,
then repeat the same six movement scenarios and acceptance checks. Broader local
validation, wall-solid caching and new features remain separate follow-ups.


#### Herkunft: docs/performance/LARGE_PLAN_BOUNDS.md

Status: historische ungeordnete Prüfkandidaten, gegen zentrale aktuelle Einträge abzugleichen.


**Q0457**

Die Übergabe aus „Systemarchitektur planen“ einschließlich V01–V09 wurde gelesen
und mit dem Code abgeglichen. PR179 inklusive Planung auf Kopf 4e503fe hatte grüne
CI und wurde nach Nutzerfreigabe zusammengeführt; Basis dieses Fixes main 68ef359.
Der konkrete Absturz hat Vorrang vor weiterer React-Feindiagnose. Diese bleibt offen.
Die Vorgaben zu gemeinsamem Modell, zentralen Aktionen und getrennten Ansichten
passen zu den neuen Funktionen. Ein größeres Dateilimit ohne Speicherprüfung ist
keine tragfähige Kapazitätsstrategie.


#### Herkunft: docs/performance/LOCAL_PROXIMITY.md

Status: historische ungeordnete Prüfkandidaten, gegen zentrale aktuelle Einträge abzugleichen.


**Q0458**

Die vorhandene Projekttestsuite sowie TypeScript, Build, Lint und Browserabnahme
wurden hier nicht abgeschlossen: lokale Repository-Abhängigkeiten einschließlich
Zod fehlen. Deshalb bleibt die Änderung ein Draft bis zur Prüfung in der
vollständigen Projektumgebung. Vor Übernahme: `npm test`, TypeScript-Prüfung,
Build/Lint und praktische Abnahme von Zeichnen, Segment-Hover und Direct Edit.


#### Herkunft: docs/performance/LOCAL_SOURCES.md

Status: historische ungeordnete Prüfkandidaten, gegen zentrale aktuelle Einträge abzugleichen.


**Q0459**

Unveränderte produktive UI: Der neue Dienst wird erst im nächsten Schritt integriert. Kein allgemeiner Leistungsnachweis für dichte Kreuzungen oder lange überlappende Segmentboxen. Bei k lokalen Segmenten bleiben k(k−1)/2 Prüfungen möglich; keine Trefferkappung. Quellen-Lookup ist modellweit und unveränderlich; aktive Referenzen werden in diesem Dienst noch nicht ausgewertet. Speicherbedarf und vollständige Browserlatenz sind nicht gemessen.


#### Herkunft: docs/performance/MANUAL_MOVEMENT_TRACE.md

Status: historische ungeordnete Prüfkandidaten, gegen zentrale aktuelle Einträge abzugleichen.


**Q0460**

PR173 ist nach Freigabe mit grüner CI zusammengeführt (`main` 5206295).
Der nächste begrenzte Diagnoseschritt ist implementiert. Das sporadische
Shift-Ruckeln bleibt offen; dieser Schritt verändert keine Produktgeometrie.


**Q0461**

Diese Bedienprüfung reproduziert noch keinen Shift-Aussetzer. Der separate
30-Sekunden-Timeouttest lief teilweise parallel zu Build/Tests und ist deshalb
ausdrücklich keine neue Latenzmessung.


#### Herkunft: docs/performance/MODEL_ASSET_CONTRACT.md

Status: historische ungeordnete Prüfkandidaten, gegen zentrale aktuelle Einträge abzugleichen.


**Q0462**

##### Erprobter Vertragsentwurf, noch keine Produktfreigabe


**Q0463**

Das portable JSON-Experiment hat die eigene Kennung `novikov-asset-experiment`,
Revision 1. Es enthält alle Payloads, keine Dateipfade oder flüchtigen Object-URLs.
Es ist weder Schema 10 noch die Entscheidung für JSON statt ZIP/Binärcontainer.
Import prüft Version, eindeutige Schlüssel, Hash, Bildheader und Modellreferenzen;
fehlende/beschädigte Inhalte scheitern vor Übergabe. Headerprüfung ersetzt keine
vollständige Decoderprüfung. Für Produktion bleibt die geprüfte Importgrenze nötig.
`pack` ist der interne Writer für eigene Dokumente; der externe Vertrauensübergang
ist `unpack`, das auch in strukturell manipulierten Paketen Hashfehler abweist.


**Q0464**

Für Produktion vorgeschlagen: Pool über Present/Past/Future erreichbar halten;
erst nicht mehr erreichbare Inhalte freigeben. Keine Löschung bloß wegen Entfernen
einer Referenz im aktuellen Stand. GC, Importabbruch, Pooländerungen, Cache-Eviction,
Speicheradapter und produktive History sind hier noch nicht implementiert.


**Q0465**

Fünf automatisierte Tests: IDs/Deduplizierung/Roundtrip/Freeze; beschädigte,
fehlende und doppelte Payloads/unbekannte Revision; getrennte Budgets;
Erreichbarkeit älterer Snapshots; echte Schema-1-Migration.
Praktisch: Vergleich starten, `roundtrip: true`, vier logische Assets bei drei
Payloads prüfen. Die CAD-Anwendung hat noch keine neue Speicherfunktion.


#### Herkunft: docs/performance/MODEL_COMPARISON.md

Status: historische ungeordnete Prüfkandidaten, gegen zentrale aktuelle Einträge abzugleichen.


**Q0466**

Alle 60 Ergebnisse gleich. No-op erreicht den zweiten Vergleich nicht; daher
kein erwarteter Gewinn. Ein lokaler gepaarter Lauf, keine allgemeine Kapazitäts-
oder FPS-Garantie. Die Baseline enthält kleine Diagnose-Zeitmessaufrufe; Zahlen
sind keine isolierte CPU-Zyklusmessung. Nicht mit älteren Läufen auf anderer Last
zu einem vermeintlichen Gesamtfaktor verrechnen. Kein Nachweis zu Spitzen-RAM.


#### Herkunft: docs/performance/P0_BROWSER_BASELINE.md

Status: historische ungeordnete Prüfkandidaten, gegen zentrale aktuelle Einträge abzugleichen.


**Q0467**

A-02 replaces two full-project JSON keys with weakly held immutable project revision and selected kind/ID. Same immutable snapshot and selection retain form drafts; a changed snapshot/selection remounts forms. Layer properties remain controlled. No model/asset is read by the key helper.


#### Herkunft: docs/performance/PREPARED_CHAIN_CORNER.md

Status: historische ungeordnete Prüfkandidaten, gegen zentrale aktuelle Einträge abzugleichen.


**Q0468**

60 alternierende Browservergleiche (30 pro Groesse) identisch zum Vollpfad und
jeweils erneut voll validiert. 100 Elemente: Median 3,65 -> 0,30 ms, Vorbereitung
9,3 ms. 1.000 Elemente: 10,10 -> 0,30 ms, Vorbereitung 24,3 ms. Ein lokaler Lauf,
Timeraufloesung beachten. [Rohdaten](chain-corner.json).
Kein DOM-/Renderer-/Frame-Nachweis; sporadisches Shift-Ruckeln bleibt offen.


#### Herkunft: docs/performance/PREPARED_ENDPOINT_PILOT.md

Status: historische ungeordnete Prüfkandidaten, gegen zentrale aktuelle Einträge abzugleichen.


**Q0469**

Der Pilot besitzt absichtlich noch keine produktive Revisions-/Auswahlbindung.
Änderungen am ursprünglichen Aufruferobjekt verändern seine eigene Basis nicht.
Vor Produktintegration muss eine veraltete Sitzung abgewiesen werden; der Pilot
darf deshalb nicht direkt als allgemeine UI-Commit-Funktion verwendet werden.


**Q0470**

**K04c: diesen begrenzten Pfad in die gemeinsame Endpunkt-Interaktion integrieren.**
Pilot in die zuständige Application-Vorbereitung überführen, an stabile Sitzung,
Projektbasis und Auswahl binden. Gemeinsame Vorschau-/ToolInteraction-Infrastruktur
nutzen; bei nicht unterstützten Zielen unverändert Vollpfad. Abbruch darf nichts
übernehmen; Bestätigung aktuelle Basis prüfen, vollständig validieren und einen
Undo-Schritt erzeugen. Praktischen Maus-/Shift-/Renderer-Test für freie und
T-Wände durchführen. Keine zweite Interaktionsengine und keine Erweiterung des
schnellen Geltungsbereichs in demselben Schritt. Andere K-/V-Ziele bleiben offen.


#### Herkunft: docs/performance/PREPARED_SELECTION_PREVIEW.md

Status: historische ungeordnete Prüfkandidaten, gegen zentrale aktuelle Einträge abzugleichen.


**Q0471**

PR171 ist nach Nutzerfreigabe in `main` (`4d284da`) integriert. Der Pilot auf
`perf/prepared-selection-preview` stellt **Auswahl frei bewegen im 2D-Grundriss**
auf eine vorbereitete gemeinsame Aktion um. Modell, Dateiformat, IFC und
Snapshot-History bleiben erhalten. Einzelne Direct-Edit-Werkzeuge und andere
Aktionen sind noch nicht auf diese Vorschau umgestellt. A-04 ist insgesamt offen.


**Q0472**

Rohdaten: [Pilot](prepared-preview-2026-10-07/),
[Baseline](preview-reuse-2026-10-07/), ausführbarer Ablauf in
`benchmarks/movement-driver.ts`. Verschachtelte Phasen sind inklusive und dürfen
nicht addiert werden. Gemessen wird synthetische Eingabe bis zu einer bestätigten
Browser-Frame-Gelegenheit, keine OS-/GPU-Latenz oder garantierte Bildrate.
Hardware-Eingabe, kontinuierliche Ereignislast und Spitzenspeicher sind nicht erfasst.


**Q0473**

- **639/639 Tests bestanden.** Sechs neue Tests enthalten unter anderem 120
  Vergleiche von Ziel/Auswahlkombinationen gegen den eingefrorenen PR171-Vollpfad:
  gemischte Auswahlen, Host-Fenster, Ecke/T, stehende Partner, Nullbewegung,
  Zufallsdeltas, numerische Grenzen und globale Fremdendpunkte. Konturen und
  Körper stimmen überein; ungültige Ergebnisse werden abgewiesen.
- Tests prüfen auch isolierte Vorschauobjekte, wiederverwendete Assets,
  mutierte/veraltete Basis, Auswahl/Sichtbarkeit/Ursprung und erhaltene
  Zeichenreihenfolge. Bestehende Gruppenbewegungs-, Text-/Voice-, Datei-,
  3D-Geometrie- und IFC-Regressionen laufen über die gemeinsame Aktion.
- Alle sechs Browserfälle bestehen Vorschau, Abbruch ohne History-Eintrag,
  Mausplatzierung und genau ein Undo/Redo. Der zusätzliche T-Fall vergleicht
  **alle 40 gerenderten Wandflächen und Konturen sowie zehn Fenster** direkt
  mit dem alten Vollpfad – vor und nach Bestätigung sowie bei numerischer Vorschau.
  Die zehn internen Ecken bleiben erhalten, die 20 äußeren T-Beziehungen lösen sich.
  Shift hält seine Richtung bis zum Loslassen; Tab wechselt Länge → Winkel;
  90°/2 m ergibt die erwartete Vorschau. Zoom läuft über den realen Wheel-Handler.
- TypeScript für Produkt und Benchmarks, Produktionsbuild und ESLint bestanden:
  0 Fehler, 6 bestehende Fast-Refresh-Warnungen. Bekannte Bundle-/Vite-/Nitro-Hinweise
  bleiben. `checks.yml` führt dieselben Prüfungen auf GitHub aus; tatsächlicher
  CI-Status und Commitbezug sind im PR zu prüfen, die Konfiguration allein ist
  kein bestandener Lauf.


**Q0474**

**Genau ein nächster begrenzter Auftrag:** Nach praktischer Pilotabnahme die
Vorbereitungs- und Bestätigungskosten dieser Auswahlbewegung getrennt profilieren
und die doppelte Aktionsauswertung zwischen `validate` und `commit` durch eine
gemeinsame atomare Bestätigung ersetzen. Die vollständige Prüfung des aktuellen
Modells am Übergang zur History muss erhalten bleiben. Mit denselben Geometrie-
Vergleichsfällen und genau einem Undo absichern; noch keine breite Migration
weiterer Werkzeuge. A-01-Messlücken sowie A-05/A-06/A-07 bleiben separat offen.


#### Herkunft: docs/performance/PROJECTED_PICKING_PILOT.md

Status: historische ungeordnete Prüfkandidaten, gegen zentrale aktuelle Einträge abzugleichen.


**Q0475**

Noch NICHT integrieren: Vorbereiten nach jedem Kamerazustand kostet mehr als
ein einzelner Vollscan. Vorteile amortisieren sich erst ueber mehrere Abfragen
auf derselben Projektion; ein synchroner Aufbau beim Drehen wuerde den gerade
verbesserten Kamerapfad erneut belasten. Fusspunkt-/Hover-Gesamtpfad bleibt offen.


#### Herkunft: docs/performance/SELECTION_EXTRUSION_AB.md

Status: historische ungeordnete Prüfkandidaten, gegen zentrale aktuelle Einträge abzugleichen.


**Q0476**

Beim kleinen T-Paar sinkt die lokale Berechnung ebenfalls, aber nur um etwa
0,15–0,23 ms. Die Gesamtvorschau wird in diesen Paaren nicht schneller. React
liegt bei 9–13 ms je Eingabe und umfasst wesentlich mehr als die lokale Geometrie.
Damit ist weitere Extrusionsoptimierung kein belegter Hebel für das ursprünglich
gemeldete kleine Shift-Szenario. Die Messung identifiziert noch keinen einzelnen
React-Verursacher; sie rechtfertigt keinen Rendererwechsel. Hardwareeingaben,
Compositor-/GPU-Latenz und das sporadische Nutzerproblem sind nicht vollständig
reproduziert. Gehaltenes synthetisches Shift ersetzt keine manuelle Abnahme.


#### Herkunft: docs/performance/SELECTION_PREVIEW_REUSE.md

Status: historische ungeordnete Prüfkandidaten, gegen zentrale aktuelle Einträge abzugleichen.


**Q0477**

`selectionMoveInteraction` uses this shared helper for its precision preview and
plan preview. Its model/selection/visibility eligibility guards remain active;
changing the pinned origin rejects the old adapter. Context replacement is still
owned by useSelectionMove, whose latest-context check protects final mutation.
Both validate and commit bypass/clear presentation reuse and derive a fresh model.
Cancellation clears reuse. Mutable preview output can never become trusted commit
input. The unchanged model action still performs its full validation.


**Q0478**

The common polar resolver now preserves the exact snapped aim when neither angle
nor length is supplied. Previously its normalize/reconstruct round trip introduced
small differences (e.g. at 22.8/-15.3), which correctly missed an exact cache key.
Explicit angle/distance constraints still use their existing projection. Invalid
or overflowing distances remain rejected. No per-element UI code was added.


**Q0479**

Practical check: select several walls (or a supported mixed selection), choose
Auswahl frei bewegen, pick an origin, move and place with a click. Repeat with
Tab length/angle entry. Escape must discard; Undo/Redo must each operate on the
whole placement. Hiding a target layer or changing selection cancels the operation.


#### Herkunft: docs/performance/SHARED_SOLID_PICKING.md

Status: historische ungeordnete Prüfkandidaten, gegen zentrale aktuelle Einträge abzugleichen.


**Q0480**

V01a: temporaeres Punkt-zu-Punkt-Messen in 2D mit vorhandener gemeinsamer
Fang-/Interaktionsinfrastruktur. Ergebnis in Metern, kein Modellelement und kein
Undo-Eintrag. Escape/Ansichtswechsel beenden die Messung. Flaechen, Winkel und
persistente Massketten bleiben Folgeumfang. Offene Leistungsgrenzen bleiben
im Backlog; K07g ist keine pauschale Skalierbarkeitsfreigabe.


#### Herkunft: docs/performance/SHARED_WALL_DRAWING.md

Status: historische ungeordnete Prüfkandidaten, gegen zentrale aktuelle Einträge abzugleichen.


**Q0481**

Grenzen: keine neue Frame-/Hardwarelatenzmessung. Sporadisches Shift-Ruckeln
bleibt zur manuellen Abnahme offen. Enger Umfang des Piloten bleibt erhalten.


#### Herkunft: docs/performance/SHIFT_REPEAT_INPUT.md

Status: historische ungeordnete Prüfkandidaten, gegen zentrale aktuelle Einträge abzugleichen.


**Q0482**

**Offener Diagnosebefund:** Der erste Lauf unmittelbar nach der Änderung meldete
`Full-path DOM mismatch: wall-1 outline`. Der alte Vergleich gab keine Werte aus.
Der Comparator wurde deshalb um tatsächlichen/erwarteten Wert ergänzt, ohne die
strikte Prüfung abzuschwächen. Zwei erneute Shift-Läufe und ein freier Lauf waren
erfolgreich. Ursache dieses einmaligen Fehlers noch nicht geklärt; nicht als bloßer
Rundungs- oder Hot-Reload-Effekt abtun. PR bleibt bis zur Klärung zur Prüfung offen.


#### Herkunft: docs/performance/SHIFT_SELECTION_DIAGNOSIS.md

Status: historische ungeordnete Prüfkandidaten, gegen zentrale aktuelle Einträge abzugleichen.


**Q0483**

**Status: offen, kein Produktfix und keine erfolgreiche Fehlerabnahme behauptet.**
Die Diagnose erweitert ausschließlich den separaten Entwicklungs-Harness.
Die gemeinsame Fang-/Vorschauarchitektur und Modellprüfung bleiben unverändert.


**Q0484**

- Sequenzielle Ausgangsmessung T-Paar: Median 17,9 ms mit Shift bzw. 19,6 ms
  ohne Shift. Das ist Ereignis bis geprüfter DOM-Vorschau, keine Hardwarelatenz.
- Erster Dauertest mit Shift: maximaler RAF-Abstand **236,3 ms**. Synchrone
  Pointer-Handler maximal 1,3 ms. Damit ist eine längere Pause beobachtet, aber
  noch keinem bestimmten Berechnungsschritt zugeordnet.
- Wiederholung mit Shift und Vergleich ohne Shift: maximal jeweils **34,8 ms**.
- Abschließende Vierfachauswahl: maximal ebenfalls **34,8 ms** mit und ohne Shift.
  240 Ereignisse verursachen jeweils 241 React-Commits. React benötigt insgesamt
  rund 2,55 s mit Shift bzw. 2,51 s ohne Shift; lokale Vorschau rund 115/114 ms,
  Fangabfragen rund 29/24 ms. Phasen sind teilweise geschachtelt, nicht addieren.
- Keine Vollprojektvalidierung oder Materialisierung im kontinuierlichen Pointerpfad.
  Alle ausgeführten Browserfälle bestehen die beschriebenen Geometrie- und
  Bedienprüfungen.


#### Herkunft: docs/performance/SOLID_CAMERA_PROFILE.md

Status: historische ungeordnete Prüfkandidaten, gegen zentrale aktuelle Einträge abzugleichen.


**Q0485**

bufferData-Zeit enthaelt Float32Array-Erzeugung und CPU-Uebergabe, nicht die
asynchrone GPU-Ausfuehrung. gl.finish wurde bewusst nicht als Normalpfad benutzt.
Draw umfasst Projektionspacken, GPU-Kommandos und Zustand; keine Raster-/GPUzeit.
Kein React-/Eingabe-zu-Pixel-Nachweis. 4 Ansichten haben insgesamt vierfache
Backbufferflaeche. UI, Orientierungsebene und Snap koennen weitere Kosten addieren.


**Q0486**

K07b: Isolierter Pilot fuer wiederverwendbare Weltgeometriepuffer und eine
Kameramatrix im bestehenden WebGL-Shader. Nur Kamerabewegung bei unveraenderter
Geometrie, Sichtbarkeit und Auswahl zuerst vergleichen. Projektion, Tiefe,
Fensteroeffnungen und stabile IDs muessen mit dem bisherigen Pfad uebereinstimmen;
mehrere Kontexte, Resize/DPR und Context-Verlust als Grenzen festhalten.
Bestehendes CPU-Picking bleibt Referenz. Noch keine produktive Umstellung.


#### Herkunft: docs/performance/SOLID_LIFECYCLE_PILOT.md

Status: historische ungeordnete Prüfkandidaten, gegen zentrale aktuelle Einträge abzugleichen.


**Q0487**

Die bisherigen 180 Kamera-/Resize-Bildvergleiche bestanden erneut mit maximal
zwei abweichenden Pixeln. [Regression](solid-lifecycle-regression.json). Keine neue Gesamtframe-/GPU-Leistungsbehauptung. DPR2 simuliert die
Backbufferabmessung; Betriebssystemwechsel und echte Hardware-Resets sind damit
nicht nachgewiesen. Kontext-Restoration wurde in diesem Chromium-Browser geprueft.
Auswahlwechsel baut derzeit konservativ auch Shader/Koerper neu auf; Performance
bei grossen wechselnden Auswahlen ist nicht Gegenstand dieser Kameraoptimierung.


#### Herkunft: docs/performance/SOLID_MATRIX_PILOT.md

Status: historische ungeordnete Prüfkandidaten, gegen zentrale aktuelle Einträge abzugleichen.


**Q0488**

Nur feste unselektierte Geometrie/Sichtbarkeit, keine Auswahlumrandung und keine
Modellbearbeitung. Context-Verlust erfordert Neuanlage von Programm/Puffer;
Ereignissteuerung/Wiederherstellung im Pilot noch nicht implementiert/getestet.
Produktpfad mit seinen vorhandenen Lebenszyklusregeln bleibt unveraendert.
Kein geaendertes Picking, keine neue Trefferindex-/ID-Struktur. Readback synchronisiert
ausserhalb der Messung; Messung ist CPU-Submission und keine GPU-/React-/Gesamt-
Framezeit. Keine Aussage zur Langzeit-GPU-Speichernutzung oder allen Zielgeraeten.
Pilot rendert einmalige Snapshotgeometrie, in-place Mutation ist kein Updatevertrag.


#### Herkunft: docs/performance/SOLID_RENDERER_INTEGRATION.md

Status: historische ungeordnete Prüfkandidaten, gegen zentrale aktuelle Einträge abzugleichen.


**Q0489**

695 Tests, Diagnose-Typecheck inklusive src, gezielter ESLint und Produktionsbuild
bestanden. Bestehende Chunk-/Vitehinweise bleiben.
180 Bildvergleiche gegen eingefrorene Referenz bestanden, maximal zwei Pixel
ueber Kanalgrenze 8. [Rohdaten](solid-integrated-regression.json). Scope und
Toleranzen aus K07b bleiben; keine neue Gesamtframe-/GPU-Leistungszusage.


**Q0490**

K07e: Isolierter 3D-Picking-Pilot mit pro angezeigter Projektion vorbereiteten
Trefferkandidaten. Naechste Wand/Fenster-ID und Tiefe gegen bestehenden Vollscan
vergleichen, verdeckte Flaechen/Fenster und Kamera-/Sichtbarkeitswechsel einbeziehen.
Noch keine produktive Picking-Umstellung und kein neuer Modellindex. Andere
K-/V-Ziele bleiben erhalten.


#### Herkunft: docs/performance/VALIDATED_ASSET_HANDLES.md

Status: historische ungeordnete Prüfkandidaten, gegen zentrale aktuelle Einträge abzugleichen.


**Q0491**

Aktuell erzeugen ausschließlich Diagnose/Test die Handles. Produktiver Import
und Laden bleiben unverändert. Die kleine gemeinsame Schema-Erweiterung ist
opt-in; kein Consumer muss eigene Validierungs-/Cachelogik erhalten. Noch keine
Deduplizierung oder Modell-/Payloadtrennung im Produkt, keine höheren Limits.


**Q0492**

Einmalige Handle-Erzeugung: 111,8 ms. History-Erzeugung: 122,2 gegenüber 11,2 ms.
Bei 1/10/50/100 Änderungen stimmen die serialisierten Modellstände überein,
Undo/Redo stellt denselben Zustand wieder her; jeweils ein History-Eintrag pro
Änderung. Alte und neue Stände teilen nur im Handle-Pfad dasselbe Assetobjekt.
Keine Aussage über physische Stringkopien, Spitzen-RAM, GPU oder FPS. Die weiterhin
vollständige JSON-Serialisierung/-Gleichheitsprüfung erklärt einen verbleibenden
Arbeitsanteil, wurde hier aber nicht isoliert profiliert oder verändert.


**Q0493**

**K02c: Handle-Erzeugung an den gemeinsamen Bildimport-/Projektladegrenzen
integrieren.** Bestehendes Schema 9 und Größenlimits bewahren, Fremddaten weiterhin
vollständig prüfen. Danach Bild importieren → Linie/Wand ändern → Undo/Redo →
Speichern/Laden praktisch und automatisiert prüfen, einschließlich beschädigter
Dateien. Nach dem Laden Handles neu erzeugen, keine IDs/Hashes als Vertrauensbeweis
übernehmen. Keine Änderungen an jedem einzelnen Werkzeug, keine neuen Cache-
Varianten. Erst danach Commit-Serialisierung separat bewerten. Übrige K-/V-Ziele
und Shift-Diagnose bleiben offen.


#### Herkunft: docs/performance/WALL_DRAWING_PROFILE.md

Status: historische ungeordnete Prüfkandidaten, gegen zentrale aktuelle Einträge abzugleichen.


**Q0494**

K04e: isolierter vorbereiteter Pilot fuer die Vorschau des ersten freien
Wandabschnitts. Bestehende addWall-/Anschlussregeln wiederverwenden, stabile
Basis einmal vorbereiten, jeden Zielzustand gegen den Vollpfad vergleichen.
Nahe/fremde Endpunkte, T-Kandidaten, Fenster und ungueltige Ziele pruefen;
bei nicht belegten Bedingungen Vollpfad. Noch keine produktive Anbindung,
keine Wandketten-Ausweitung. Volle Bestaetigung und ein Undo bleiben Pflicht.


#### Herkunft: docs/performance/WALL_ENDPOINT_PROFILE.md

Status: historische ungeordnete Prüfkandidaten, gegen zentrale aktuelle Einträge abzugleichen.


**Q0495**

Dies sind echte gemeinsame Application-/Snap-Funktionen im Browser, aber keine
DOM-Pointerereignisse, React-Rendering oder GPU-/Frame-Latenzen. Keine Aussage,
dass das frühere sporadische Shift-Ruckeln erledigt wäre. Es bleibt offen.
[Rohdaten und Einzelwerte](wall-endpoint-2026-10-08.json).


#### Herkunft: src/components/cad/BIM_UI.md

Status: historische ungeordnete Prüfkandidaten, gegen zentrale aktuelle Einträge abzugleichen.


**Q0496**

`BimPlan` converts model XY coordinates to SVG, derives wall thickness/length and window placement, and fits the view to the model bounds. SVG elements and navigator buttons can both select components. Window outlines are plan symbols. `BimSolidView` renders real wall boundary surfaces with WebGL depth testing. `buildSolid` partitions each wall at window edges, extrudes occupied cells through the wall thickness, and emits only external surfaces, including opening reveals. Overlapping openings are subtracted as a union. Coordinates remain metres and Z is up. The camera uses orthographic projection. No new dependencies are required.


**Q0497**

Use Save project to download editable JSON and Open project to restore it. Undo/Redo retains up to 100 model changes in the session. Reload starts the example again; there is no autosave. See [project files](../../lib/bim/PROJECT_FILES.md). Automatic fitting is not a physical print scale. Window overlaps are not checked by the current core; multiple windows can be selected individually in the navigator. The IFC toolbar button exports the current model for exchange; IFC import and free-form AI interpretation remain later work. Local text commands now edit selected elements through a validated preview; see [model commands](../../lib/bim/COMMANDS.md). See [IFC export](../../lib/bim/IFC.md).


**Q0498**

The 3D viewport requires WebGL; if it is unavailable, an error explains how to use 2D instead. GPU buffers and programs are released on unmount; context restoration rebuilds the renderer. Walls remain separate solids (no wall-junction union), and windows are openings without frames or glass. The grid is a screen-space guide. 3D wall selection uses the rendered triangles and nearest depth, preserving through openings. Visible window openings are now directly selectable in 3D (including Ctrl/Cmd toggling) and receive depth-tested outlines. Opening hit rectangles do not add glass or export material. Hidden windows retain click-through openings; nearer opaque walls block selection.


#### Herkunft: src/lib/bim/COMMANDS.md

Status: historische ungeordnete Prüfkandidaten, gegen zentrale aktuelle Einträge abzugleichen.


**Q0499**

Erkanntes Deutsch wird begrenzt normalisiert: Meter/Zentimeter/Millimeter, einfache Zahlwörter null bis zwölf und Dezimalkomma. Komplexe Zahlwörter und freie Formulierungen bleiben außerhalb dieses Schritts. Fehlerhaften Text vor der erneuten Prüfung korrigieren.


#### Herkunft: src/lib/bim/IFC.md

Status: historische ungeordnete Prüfkandidaten, gegen zentrale aktuelle Einträge abzugleichen.


**Q0500**

Click **IFC** (download icon, **Export IFC**) in the top toolbar to download `novikov-project.ifc`. The export uses the current committed model snapshot; unsaved form edits must first be applied with **Apply dimensions**. Generation takes place locally in the browser. The button is disabled while generating, failures keep the model unchanged, and the UI reports that the download was requested rather than claiming the file was saved to disk.


**Q0501**

Walls and windows are contained in the storey. Openings are associated with their host wall and are not separately contained in the storey. The geometry uses metres and Z-up. A rotated wall's placement carries its direction; window coordinates remain relative to its wall, including the sill elevation. The opening's left edge is `position × wallLength − width / 2`.


**Q0502**

GlobalIds use 128 bits derived from SHA-256 of the versioned NOVIKOV namespace, project ID, entity kind and source ID, with UUID version-8/variant bits and IFC's 22-character encoding. They remain stable across edits, reordering and repeated exports, including JSON reloads. Project IDs must distinguish independent projects; cloning the same IDs intentionally preserves IFC identity. The full original ID is retained in SourceId even if the display label must be shortened to IFC's limit.


#### Herkunft: src/lib/bim/README.md

Status: historische ungeordnete Prüfkandidaten, gegen zentrale aktuelle Einträge abzugleichen.


**Q0503**

Window `position` is the dimensionless centre along the wall, from 0 (start) to 1 (end). A value of 0.5 remains centred when either endpoint changes. `windowCentre` derives its XY coordinates. The full opening must fit horizontally and vertically inside the wall, including its nonnegative sill height. Wall edits revalidate all hosted windows.


**Q0504**

JSON includes `schemaVersion: 1` and `unit: "m"`. Loading validates structure, IDs, references and geometry; unsupported versions/units are rejected. Serialization does not write files or introduce UI persistence. Window overlap checks and multiple storeys remain outside this core. Rendering and [IFC export](./IFC.md) are separate adapters.


**Q0505**

The agreed NOVIKOV CAD roadmap is: component model, connection to the existing UI, real 3D geometry with openings, IFC exchange, then AI and voice commands. The reference case is a 3.00 m long, 0.36 m thick, 2.80 m high wall with a centred 1.20 m wide, 1.35 m high window and a 0.90 m sill. The model is now connected to the wall tool, plan view and properties inspector; see [BIM UI integration](../../components/cad/BIM_UI.md). Real 3D wall geometry and through openings are now derived by `geometry.ts` and rendered in the UI; an [IFC4 export](./IFC.md) now provides the first exchange step. IFC import and AI/voice execution remain later work.


#### Lokaler früherer Leitfaden: NOVIKOV_ARCHITEKTUR_REVIEW_UND_FUNKTIONSMAP.md

Historische Quelle; aktuelle Anforderungen und Architektur aus Masterplan haben Vorrang.


**Q0506**

Die Engine bietet derzeit Endpunkte, Raster, Achsführungen, Flucht, Lot, Diagonalen, Shift-Winkel und horizontale/vertikale Konstruktionen aus mehreren Hover-Referenzen. Der Kandidatentyp `intersection` bedeutet hier einen Schnittpunkt temporärer Achsführungen. Daraus folgt noch kein allgemeiner Schnittpunktfang zwischen Modellsegmenten. Mittelpunkte und beliebige Richtungsschnittpunkte sind noch nicht implementiert.


#### Lokaler früherer Leitfaden: NOVIKOV_ENTWICKLUNGSGUIDE.md

Historische Quelle; aktuelle Anforderungen und Architektur aus Masterplan haben Vorrang.


**Q0507**

Berechne die geometrische Grundfläche aus gültigen Polygonen. Kennzeichne sie
als geometrische Fläche; sie ist noch keine geprüfte Wohnfläche. Beginne mit
manueller Begrenzung über das gemeinsame Zeichen- und Fangsystem.


**Q0508**

Zwei Punkte können eine einzelne Messstrecke festlegen; daraus folgt noch keine
vollständige Höhenverteilung im Raum. Verwende für flächige Auswertung eine
definierte obere und untere Oberfläche. Berechne deren Höhenunterschied über
der Raumfläche und leite Höhenlinien beziehungsweise Flächenbereiche ab.
Ermögliche die Konfiguration im Raumeigenschaftenfenster.


**Q0509**

| Entscheidung | Vor Etappe | Vorgeschlagener Start |
| --- | --- | --- |
| Ergänzung der abgebrochenen Grid-Anforderung | 2–3 | Gesprächsanforderungen verwenden und als Ergänzung markieren |
| Hover-Zeit, Fangradius und Richtungen | 3 | Konfigurierbare Werte, im Bedienversuch anpassen |
| Ebenensichtbarkeit je Ansicht oder gemeinsam | 4 | Eine klare Variante für alle ersten Abläufe festlegen |
| Strichstärken und Muster in Modell oder Papiermaßen | 5 | Einheiten ausdrücklich dokumentieren |
| Welche Elemente welche Bearbeitung unterstützen | 6 | Aktionen zunächst für vorhandene Elementtypen |
| Bedeutung der Maßstabanzeige und unterstützte Importformate | 7 | Ansichts-/Ausgabemaßstab trennen; PDF-Seite und Bild zuerst |
| Raumkennungen und Umgang mit teiloffenen Grenzen | 8 | Projektweit eindeutige Kennungen und explizite virtuelle Grenzen |
| Verfügbare Dach- und Deckenquellen | 9 | Automatisch nur aus tatsächlicher Modellgeometrie |
| Regelprofil, Korrekturen und fachliche Prüfung | 10 | Amtliche Quelle prüfen, Annahmen offen dokumentieren |
| Konkrete Berichtsvorlage und Berichtsumfang | 11 | Standardvorlage, später bereitgestellte Vorlage übernehmen |


**Q0510**

```text
Prüfe den zuletzt umgesetzten Teil gegen seine Abnahmekriterien. Nenne konkrete
Nachweise und fehlende Nachweise. Kontrolliere Modellkonsistenz, Undo/Redo,
Dateirundlauf, ungültige Eingaben und die betroffenen Architekturgrenzen.
Behebe Fehler im aktuellen Umfang. Gib mir anschließend einen kurzen
Bedienversuch, den ich selbst durchführen kann. Beginne noch keine neue Etappe.
```


#### Lokaler früherer Leitfaden: NOVIKOV_FUNKTIONSARCHITEKTUR_2026-10-03.md

Historische Quelle; aktuelle Anforderungen und Architektur aus Masterplan haben Vorrang.


**Q0511**

Die Produktwünsche stammen aus der PDF. Die technischen Typnamen, Verantwortlichkeiten und Umsetzungsschritte sind Vorschläge. Sie sind noch keine implementierten Module. Als letzter hier geprüfter Repository-Stand gilt `main` mit Commit `dd3e358` vom 3. Oktober 2026; seitdem erfolgte Änderungen wurden für diese Zuordnung nicht erneut geprüft.


**Q0512**

Seitenzahlen beziehen sich auf die beigefügte PDF. „Offen“ bezeichnet eine fachliche Entscheidung, keine Aufforderung, den gesamten Fortschritt anzuhalten. Die Zuständigkeiten sind Zielzuordnungen; Codex muss sie mit dem aktuellen Code abgleichen.


**Q0513**

| ID | Anforderung | Seite | Zuständigkeit oder Voraussetzung |
| --- | --- | --- | --- |
| N01 | Gemeinsames BIM-Modell für komplexe geometrische Entwürfe | 1 | Domain und Geometry; ein Modellzustand |
| N02 | PDF-Pläne, 3D-Modelle, IFC und DXF exportieren | 1 | Interop; 3D-Format und DXF-Umfang noch festlegen |
| N03 | Darstellung von 2D/3D ändern, Farbe oder Schraffur | 1 | Render-Stile und ViewOverrides |
| N04 | Maßstab von Canvas, Grundriss, Schnitt und Ansicht | 1 | Viewport-Zoom und Ausgabemaßstab getrennt |
| N05 | Schnitt- und Ansichtswerkzeuge erzeugen 2D-Ableitungen | 1 | ModelView und Geometry-Projektion |
| N06 | Abgeleitete 2D-Dokumente bearbeiten | 1 | Modellaktion oder Dokumentergänzung ausdrücklich unterscheiden |
| N07 | Fang in 3D und Hilfsflächen für X/Y/Z | 1 | Arbeitsebene, Strahlabfrage, Point3 und Constraints |
| N08 | Hochwertige Raster und Hilfslinien auf Bedarf | 1 | Gemeinsame Constraints-Engine |
| N09 | Bewegliches On-Demand-Menü bei Elementauswahl | 1 | UI auf gemeinsamem Selection-Kontext |
| N10 | Gesamtes Element bewegen | 1 | Application MoveElement |
| N11 | Punkt einfügen oder vorhandenen Punkt verschieben | 1 | Application mit typabhängiger Topologieprüfung |
| N12 | Linie knicken oder Polygon um weiteren Eckpunkt erweitern | 1 | Polyline-/Polygonaktionen; kein beliebiger BIM-Punkt |
| N13 | Ganze Polygonkante versetzen und Fläche verbreitern | 1 | OffsetEdge; gültiges Ergebnis prüfen; nicht für einfache Linien |
| N14 | Letzte Menüaktion bei kompatibler Geometrie vormerken | 1 | Persönliche Präferenz plus Capability-Prüfung |
| N15 | Maßstab in unterer Leiste ändern | 1 | UI für Ansichts- und Ausgabemaßstab |
| N16 | Alle Elementtypen einer Organisationsebene zuordnen | 1 | Domain Layer; auch Texte, Kreise und Möbel berücksichtigen |
| N17 | Ebenen einzeln, alle oder als Ausnahmeauswahl schalten | 2 | ViewVisibility; Isolate/HideExcept/ShowAll/HideAll |
| N18 | AI und Sprache als zentraler Bedienzugang | 2 | Adapter auf geprüfte Application-Aktionen |
| N19 | Wände, Türen, Fenster, Decken, Dächer per Sprache/Text | 2 | Typisierte Erstellungsaktionen und Zielkontext |
| N20 | Bemaßung per Sprache/Text | 2 | Dimension-Aktionen; konkrete Intents später definieren |
| N21 | Geschosse im Navigator frei erstellen und Höhen definieren | 2 | Domain Storey; bestehendes Ein-Geschoss-Format migrieren |
| N22 | Wände, Stützen und andere Bauteile kennen Geschosshöhen | 2 | HeightBinding statt kopierter Höhe ohne Bezug |
| N23 | Deutsch als erste Programmsprache | 2 | Einheitliche UI-Texte und Eingabeinterpretation |
| N24 | Modelllängen in Metern | 2 | Gemeinsame Units-Konvention; Dezimalkomma unterstützen |
| N25 | Ausschließlich 2D-Elemente und importierte PDF-Dateien proportional per Messlinie skalieren | 2 | Scale2DSelection/CalibratePdf; 3D- und BIM-Bauteile ausgeschlossen, auch im Grundriss |
| N26 | Boolesche Operationen für komplexe 3D-Modelle | 2 | Fachunabhängiger Solid-Kern und Domain-Features |
| N27 | Wände schneiden und aussparen | 2 | Gehostete CutFeature; validierbare Abhängigkeiten |
| N28 | Hochgeladene PDFs in 2D-Elemente zerlegen | 2 | Interop-Import; Vektor und Raster unterscheiden |
| N29 | Modell im Grundriss, Schnitt, Ansicht und 3D bearbeiten | 2 | Gemeinsame ID-basierte Aktionen und View-Kontext |
| N30 | Wände/Fenster verschieben und Elemente löschen | 2 | Gemeinsame Transform-/Delete-Aktionen |
| N31 | Räume in geschlossenen oder teiloffenen Wandbereichen | 2 | RoomBoundary; explizite virtuelle Grenzen |
| N32 | Raumname, Kennung ab R-001 und Fläche | 2 | Room; interne ID getrennt von sichtbarer Kennung |
| N33 | Lichte Raumhöhen und konfigurierbare Höhenlinien | 2 | HeightField aus unteren/oberen Bezugsflächen |
| N34 | Messbezug Fußbodenoberkante und Dachunterkante | 2 | Persistente Referenzen auf Höhenquellen |
| N35 | Wohnfläche mit Nischen, Schornstein- und Vorwandabzügen | 3 | Versionierter Regelservice; amtliche Regeln vor Umsetzung prüfen |
| N36 | Berichtsvorlage und PDF mit nachvollziehbarem Rechenweg | 3 | Berichtsdaten aus Berechnung; Interop PDF |
| N37 | Geschossanzahl, Raumzahl, Name und Adresse im Bericht | 3 | Metadaten und Berichtsumfang |
| N38 | Räume standardmäßig auf Ebene Raum | 3 | Layer-Standardzuordnung |
| N39 | Rechtecke/Polygone für Gestaltung und Schraffur | 3 | DrawingPolygon/Hatch; Ebene 2D-Ergänzungen |
| N40 | Optionale Farbe/Kontur, Deckkraft, Muster wie Mauerwerk | 3 | Appearance und Renderer |
| N41 | Wanddicke und geschossabhängige oder alternative Höhe | 3 | Wall-Parameter und HeightBinding |
| N42 | Monolithische oder mehrschichtige Wand, eigene Schichten | 3 | Assembly und Materialdefinitionen |
| N43 | Einzelwand oder fortlaufende Wände mit Doppelklickabschluss | 3 | Tool-Sitzung; gewünschte Undo-Gruppierung festlegen |
| N44 | Saubere Wandanschlüsse an Ecken und T-Verbindungen | 3 | Domain Join-Regeln und daraus abgeleitete Geometrie |
| N45 | Verschiebbare Hauptachse im Wandaufbau | 3 | Referenzlinie und Offset; Verhalten beim Umstellen festlegen |
| N46 | Wände, Fenster und andere Elemente bemaßen, Maßketten | 3 | Assoziative Dimension-Referenzen; Ebene Bemaßung |
| N47 | Decken mit Schichten, Material, Darstellung, Höhe/Stärke | 3 | Slab und Assembly; Ebene Decke |
| N48 | Deckendurchbrüche einfügen | 3 | Gehostete Öffnung; Profile und Modellvalidierung |
| N49 | Text mit Hochstellung, Farbe, Größe, Schrift und Hervorhebung | 3 | TextAnnotation und TextStyle; Ebene Textelemente |
| N50 | Text mit farbiger Umrandung und Hintergrund | 3 | TextStyle; Dokument-/Modellscope festlegen |
| N51 | Elemente nach Typ oder Eigenschaften filtern | 4 | Application Query/Selection; gemeinsame Sichtbarkeitsregeln |
| N52 | Pipette für Farbauswahl im Filter | 4 | UI-Eingabeadapter; fachliche/angezeigte Farbe unterscheiden |
| N53 | Eine Eigenschaftenleiste für Werkzeugvorgaben und Auswahl | 4 | Schema-/Capability-basierter UI-Adapter |
| N54 | E bewegen, Strg+E kopieren/bewegen, D drehen, Strg+D drehen | 4 | Shortcut-Router; Unterschied D/Strg+D offen |
| N55 | Rotation mit Kreis als Fang-/Bedienhilfe | 4 | RotateSession und Constraints; Overlay im Renderer |
| N56 | Navigator für Geschosse, Schnitte, Ansichten und 3D | 4 | Referenzen auf ModelView und Gebäudestruktur |
| N57 | Aktualisierbare Abbilder mit eigener Ebenendarstellung | 4–5 | DrawingDocument; keine Bauteilkopie |
| N58 | Ausschnitte und zusätzliche Gestaltung/Text in Abbildern | 4–5 | ViewOverrides und dokumentbezogene Annotationen |
| N59 | Abbilder in Master-/Exportlayouts mit A4/A3/A2 und Plankopf | 5 | Layout, MasterLayout und LayoutViewport; eigener Navigatorbereich |
| N60 | Bildschirm teilen, Fenster aktivieren und Inhalt zuweisen | 5 | ViewportBinding; ausgewähltes Dokument und Kamera je Fenster |


**Q0514**

Eine Linie mit eingefügtem Punkt wird fachlich zur Polylinie. Bei einem Polygon kann ein zusätzlicher Vertex die Kontur verändern. Eine gerade BIM-Wand darf nicht ohne festgelegte Regel in eine beliebig geknickte Wand verwandelt werden. Dafür sind beispielsweise mehrere verbundene Wände oder ein eigener Wandpfadtyp erforderlich. Das Menü zeigt nur unterstützte Aktionen. Eine vorgemerkte Aktion aktiviert einen Bearbeitungsmodus, führt aber nicht beim Öffnen bereits eine Modelländerung aus.


**Q0515**

Die Datenverträge für ModelView, DrawingDocument und ViewportBinding werden vor weiteren Layout-Sonderlösungen festgehalten. Die komplette Schnitt- oder Druckberechnung muss dafür noch nicht implementiert werden.


**Q0516**

Implementiere noch keine neuen Bauteile, PDF-Zerlegung, Booleschen Operationen
oder vollständigen Layouteditor. Kein Komplettumbau und keine leeren Klassen
auf Vorrat. Gib eine verständliche Zusammenfassung der Architekturergänzungen,
der offenen Entscheidungen und des nächsten begrenzten Auftrags aus.
```


#### Lokaler früherer Leitfaden: NOVIKOV_Entwicklungsleitfaden.md

Historische Quelle; aktuelle Anforderungen und Architektur aus Masterplan haben Vorrang.


**Q0517**

Berechne die geometrische Grundfläche aus gültigen Polygonen. Kennzeichne sie
als geometrische Fläche; sie ist noch keine geprüfte Wohnfläche. Beginne mit
manueller Begrenzung über das gemeinsame Zeichen- und Fangsystem.


**Q0518**

Zwei Punkte können eine einzelne Messstrecke festlegen; daraus folgt noch keine
vollständige Höhenverteilung im Raum. Verwende für flächige Auswertung eine
definierte obere und untere Oberfläche. Berechne deren Höhenunterschied über
der Raumfläche und leite Höhenlinien beziehungsweise Flächenbereiche ab.
Ermögliche die Konfiguration im Raumeigenschaftenfenster.


**Q0519**

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


**Q0520**

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



#### Lokaler früherer Leitfaden: NOVIKOV_Entwicklungsplan.md

Historische Quelle; aktuelle Anforderungen und Architektur aus Masterplan haben Vorrang.


**Q0521**

Praktische Abnahme: Punktfang einschalten, zwei Punkte jeweils 0,6 s anhovern und daraus einen Schnittpunkt aktivieren. Mit Mausrad oder Plus/Minus zoomen: Markierungen müssen erhalten bleiben. Escape löst sie gezielt. Dieser Nachtrag ersetzt frühere Protokollaussagen, nach denen Zoom Referenzen verwirft. Die Korrektur ergänzt PR #36; Nutzerfreigabe für PR #35/#36 gilt nach erfolgreicher Prüfung. Der einzige nächste Entwicklungsauftrag bleibt der unten beschriebene Schnitt externer Hilflinien mit festen Direct-Edit-Achsen.


**Q0522**

Abnahme: Snap einschalten, Punkt 0,6 s anhovern → silbergrauer Ring. Zeiger weg und wieder 0,6 s darüber → Ring weg. Dort verbleiben → bleibt gelöst. Nach erneutem Verlassen wieder aktivierbar. In einer bereits offenen Sitzung kann die bisherige Zeiteinstellung erhalten bleiben; im Linienwerkzeug auf 0,6 s stellen, ohne das Projekt neu zu laden.


**Q0523**

PR #29 wurde mit Nutzerfreigabe als normaler Merge 655c5f1 in feat/direct-edit-shared-snap übernommen. PR #27/#28 bleiben offen; main wurde nicht geändert. Dieser Funktionsschritt basiert auf dem freigegebenen Dokumentationsstand.


**Q0524**

Prüfung: 168 Tests bestanden (vier neue Fälle: alle acht Winkelgrenzen mit Hin-/Rückweg, getrennte Quellen und Identitätswechsel, Anzeige/Schnittpunkt/Radius/Shift/Ortho sowie Direct-Edit-Commit/Undo/Redo/JSON). TypeScript und Build erfolgreich; ESLint null Fehler/sechs bekannte React-Refresh-Warnungen. Browser beim Linienzeichnen und freien Linienbewegen: 20° → 24° bleibt horizontal, 28° wechselt auf 45°; Rückweg über 22° bleibt diagonal, 17° schaltet zurück. Zwei Referenzen erzeugen weiterhin den nach 600 ms erworbenen dritten Hilfspunkt. Freie Linienbewegung auf (1,5; 1,5) bestätigt, Undo/Redo geprüft. Escape, Modell-Commit, Kamerawechsel und Snap aus räumen Führungen auf. Screenshot: outputs/guide-hysteresis-direct-edit.png.


**Q0525**

Aufbauend auf PR #33 / 3fad40a; PR #33 bleibt offen und wurde durch den Fortsetzungsauftrag nicht automatisch zusammengeführt. Neue Implementierung auf feat/shared-midpoint-snap.


**Q0526**

geometry/intersections/segments.ts prüft eindeutige Schnitte innerhalb beider endlicher Segmente mit der zentralen numerischen Toleranz. Degenerierte/nichtendliche Strecken, bloße Geradenverlängerungen und Überlappungen erzeugen keinen Fangpunkt; eindeutige Endberührungen bleiben möglich. constraints/snapping/segment-references.ts bildet Quellenpaare deterministisch. Der Projektadapter stellt Wandachsen und vorhandene Linien-/Polyliniensegmente bereit, einschließlich Selbstkreuzungen einer Polylinie. Keine Wandflächenverschneidung oder Änderung des BIM-Modells.


**Q0527**

Nutzerpräzisierung: Die derzeit zentrierte Wandachse bei ausgewählter Wand sichtbar machen und später verschiebbar machen. In FUNCTION_REQUIREMENTS_2026-10-03.md bei N45 ergänzt, kein Doppelauftrag. Vor Wandanschlüssen passend einordnen. Ob die physische Wandlage erhalten oder mitverschoben wird, bleibt bis zur fachlichen Klärung offen; hier keine Implementierung.


**Q0528**

Aufbauend auf 4c542ea / PR #35, der weiterhin offen bleibt. Neue Umsetzung auf feat/oblique-guide-intersections. Kein Merge durch den allgemeinen Fortsetzungsauftrag.


**Q0529**

Die bisher dokumentierte Lücke bei achsengebundener Bearbeitung schließen: externe Hilfsreferenzen dürfen seitlich der erlaubten Bewegungsachse liegen, wenn ihre mausrelevante Führung diese Achse schneidet. Den Schnitt gemeinsam und eindeutig berechnen, die feste X-/Y-/Elementachse weiterhin strikt einhalten und keine bloß projizierten Endpunkte als echte Fangpunkte beschriften. Zuerst vorhandenen Filter und Kandidatenvertrag prüfen; keine separate SnapEngine im Werkzeug.


**Q0530**

Prüfung: 149 automatisierte Tests, TypeScript, vollständiges ESLint und Produktionsbuild. Lint: null Fehler, sechs bekannte React-Refresh-Warnungen. Neue Fälle prüfen freie Wandbewegung und Punktänderung, exakte externe Endpunkte, Zoomradius, Snap aus, Shift, Achspriorität, Hover-Führung, geschlossene Polylinien, Fenstergrenzen und Strecken mit Griffversatz. JSON, Undo/Redo und bestehende IFC-Tests bleiben enthalten. Browser: Endpunkt außerhalb des Rasters exakt erkannt, Ring/Hilfslinie beim Bearbeiten sichtbar, Vorschau und Bestätigung geometrisch identisch, Undo auf 3 m und Redo auf 4,131980263614846 m geprüft. Screenshot lokal: outputs/direct-edit-snap-preview.png.


**Q0531**

Nachweise: 140 Tests bestanden (fünf neue Tests mit mehreren Fällen), TypeScript, vollständiges ESLint und Produktionsbuild erfolgreich. Lint: null Fehler, sechs bekannte React-Refresh-Warnungen. Tests prüfen beide Achsen, ±10 Millionen Meter, 10/100/1000 px/m, echte Abweichungen, nichtendliche Werte, Toleranzdeckel, exakte Kandidatenkoordinaten und weiterhin ungültige veraltete Hover-Referenzen trotz minimaler Verschiebung. Vorhandene Shift-, Mehrfachreferenz-, Undo/Redo-, JSON- und IFC-Tests bleiben grün. Keine erneute Browserprüfung in diesem rein numerischen Schritt; Bedienoberfläche unverändert.


**Q0532**

Bis zu vier durch Verweilen aktivierte Referenzen bleiben innerhalb der Zeichenfläche erhalten. Ein fünfter verdrängt den ältesten; erneutes Aktivieren aktualisiert die Reihenfolge ohne Duplikat. Neben den einzelnen Richtungsführungen unterstützt die Engine als erste gemeinsame Konstruktion Horizontal-von-A/Vertikal-von-B. Ein naher Schnittpunkt gewinnt vor Einzelführungen und wird mit beiden Herkunftslinien dargestellt. Tatsächliche Endpunkte behalten Vorrang. Alle Referenzen werden gegen den aktuellen Modellstand geprüft.


**Q0533**

Grenzen: erster Verbraucher bleibt Linie/Polylinie; keine Mehrfachreferenzen, Nachbarparallel-Erkennung, Hysterese oder 3D. Am Polylinienvertex werden die benachbarten gespeicherten Segmente ausgewertet. Nächster Schritt: Wandzeichnen an dieselbe geprüfte Fang-/Hover-/Shift-API anschließen und Wand-Fenster-Workflow mit Undo/Redo und Dateirundlauf prüfen.


**Q0534**

Grenzen: erster Verbraucher weiterhin Linie/Polylinie in 2D; maximal eine Referenz, nur Achsführungen, keine dauerhaften Hilfsobjekte. Noch keine Richtungsableitung aus Kanten, Mehrfachreferenzen, Hysterese, Parallel-/Lot-/Winkelbezüge, 3D oder räumlicher Index. Die ursprüngliche vollständige Hilfslinienspezifikation bleibt offen. Die Engine analysiert derzeit vorhandene Wandachsenden und Linienvertices; weitere Elementtypen benötigen Modelladapter.


**Q0535**

Nachweise: 118 Tests bestanden, davon acht neue Application-Tests zu Vorschauen, Abbruch, veraltetem Kontext, ungültigen Zielen, No-op/Redo, Linienbewegung, Dateirundlauf, 3D und IFC. TypeScript, gezieltes ESLint der geänderten Dateien und Build erfolgreich. Browser: Vorschau/Abbruch ohne Undo, Wandbewegung mit einem Undo-Schritt, Redo, Linienbewegung und 3D-Wechsel; keine Konsolenfehler. Nach einer Modelländerung wird der alte angeklickte Bewegungsanker verworfen. Eine allgemeine automatische Importgrenzen-Prüfung ist noch nicht implementiert; das neue Modul wurde auf ausschließlich modell-/historybezogene Imports ohne React/DOM geprüft.


**Q0536**

Aktueller gesicherter Funktionsstand: feat/plan-camera, Commit 2bca281, PR #17 (offen). 110 Tests, TypeScript, gezieltes ESLint, Build und dokumentierte Browserprüfung bestanden. Dies ersetzt noch nicht die vollständige Anforderungszuordnung nach Guide-Etappe 0. Der vorgezogene Bildschirmmaßstab deckt einen Teil von Guide-Etappe 7/F10 ab; Referenzimport, Kalibrierung und Ausgabemaßstab fehlen weiterhin.


**Q0537**

Verbindliche Reihenfolge aus dem Nutzerauftrag vom 01.10.2026. Dieser Plan ersetzt die bisherige technische Reihenfolge in FEATURE_ROADMAP.md; die dort erfassten Einzelanforderungen F01–F14 bleiben erhalten. Bereits funktionierende Modell-, UI-, History- und Exportfunktionen werden weiterverwendet. Pro Änderung eine überschaubare, prüfbare Teil-Etappe.


**Q0538**

F13 bleibt die ausführliche Spezifikation. F04 (2D-Kamera/Zoom/Pan/Maßstableiste) als kleine technische Voraussetzung in diese Etappe einordnen. Erster Fangschritt soll vorhandene Geometrie und Werkzeuge nutzen, keine parallele Modellstruktur. Weitere Fangarten erst nach Prüfung der ersten Arten ergänzen.


**Q0539**

- On-Demand-Menü mit den jeweiligen geprüften Bearbeitungsaktionen weiterentwickeln; Eigenschaften bleiben oben, Bewegungsaktionen am Zeiger.
- Schraffuren und Referenzimport/-skalierung jeweils als eigene kleine Etappen nach grundlegenden Fang- und Maßeingabefunktionen. PDF/Bild anhand zweier Punkte und bekannter Länge skalieren (F05/F10).
- Text- und Sprachbefehle nur auf bereits geprüfte Modellfunktionen erweitern. Maus, Maßeingabe und Copilot verwenden dieselben validierten Aktionen. F11 bleibt offen.
- F12 (gemeinsame Auswahlumrandung) und F14 (Ebenensystem) bleiben geplant. Ebenensichtbarkeit bei Fangfiltern berücksichtigen und Ebenen vor größeren Projekten einordnen, ohne die sechs Etappen umzudeuten.


**Q0540**

Git-Synchronisierung und kombinierte praktische Verschiebeabnahme sind am 01.10.2026 abgeschlossen; Nachweis in STABILIZATION.md. Etappe 1 ist damit technisch geprüft, die Übernahme nach main bleibt der PR-Prüfung vorbehalten. Die frühere Aufzählung offener Abschlussbedingungen beschreibt den Stand vor diesem Nachtrag. Etappe 2 kann auf dem gesicherten Gesamtstand beginnen.


**Q0541**

Architektur: reine Kameramathematik unter src/rendering/viewport, generischer Point2 unter src/geometry/primitives. Kamera ist flüchtiger Zustand je Ansicht. Das bestehende Project bleibt die einzige Modellquelle; keine Modellaktion, History-Änderung, Dateimigration oder IFC-Anpassung durch Navigation. Alle bestehenden Modellbearbeitungen verwenden weiterhin die geprüften Operationen.


**Q0542**

Praktische Abnahme: 2D öffnen, über einer Wandecke mit dem Mausrad zoomen; die Ecke bleibt unter dem Zeiger. Pan aktivieren und ziehen, danach Escape drücken. Maße müssen gleich bleiben. Fit view zeigt das ganze Modell. 100 px/m wählen und zeichnen/bearbeiten; anschließend Undo/Redo prüfen.


**Q0543**

Grenzen: px/m ist ein Bildschirmmaßstab, kein Druckmaßstab. Rasterdarstellung ist adaptiv; das bisherige optionale Rasterfangen bleibt ausdrücklich bei 0,10 m. Kameras werden nicht in Projektdateien gespeichert und beim Wechsel des Viewport-Layouts neu initialisiert. Geometrisches Fangen, Referenzaktivierung und Hilfslinien sind noch offen. Nächster Schritt: gemeinsame Endpunkt-/Mittelpunkt-/Schnittpunkt-Kandidaten unter constraints/snapping gemäß ARCHITECTURE.md und F13.


**Q0544**

Nutzerkorrektur hat Vorrang vor dem zuvor geplanten Streckgriff: großes festes Streckenfeld durch ein kompaktes Hilfseingabefenster nahe der Auswahl ersetzen und freies Bewegen mit Winkel/Länge unterstützen. Umsetzung auf feat/compact-polar-input, aufbauend auf PR #38 / 86b5839. PR #38 bleibt offen; keine zusätzliche Merge-Freigabe angenommen.


**Q0545**

Freies Bewegen hat jetzt einen ausdrücklichen Richtungswahl-Schritt: erster Klick fixiert die Richtung, erzeugt noch keinen History-Eintrag und fokussiert das Längenfeld. Winkel kann stattdessen direkt eingetragen werden. Leerer Winkel folgt der Maus, gesetzter Winkel bleibt fix; leere Länge folgt der Mausprojektion auf die feste Richtung, gesetzte Länge bleibt exakt. Maus setzt beide Eingaben zurück. Enter/Übernehmen bestätigt, Escape/Abbrechen verwirft. Negative Länge bewegt in Gegenrichtung. Dezimalkomma/-punkt werden akzeptiert, ungültige Werte sperren Bestätigung. Bei festem Winkel und leerer Länge bleibt Rückwärtsbewegung vor dem Ursprung bei Länge null; eine negative Länge kann ausdrücklich eingegeben werden.


**Q0546**

Dasselbe kompakte Fenster an die bestehende Streckgriff-Aktion anbinden. Die gewählte Fluchtrichtung bleibt fest; positive Länge verlängert, negative verkürzt. Griffversatz, Nachbarüberquerung und Fenstergrenzen müssen unverändert über die gemeinsame Modellaktion validiert werden. Tests für schräge Wände/Linien, unzulässiges Verkürzen, stale Kontext, Escape/Undo/Redo und praktische Prüfung auch der abgeleiteten 3D-Zahlenvorschau. Kein separates Eingabefenster pro Werkzeug; Zeichnen und Fensterbewegung bleiben spätere Verbraucher.


**Q0547**

Nachweise: 201 Tests bestanden, TypeScript/Build erfolgreich, ESLint 0 Fehler/6 bekannte Warnungen. Zwei neue Testgruppen prüfen positive/negative Strecken an beiden Enden schräger Linien/Wände, unveränderten Gegenpunkt, Griffversatz, Fenstergrenzen, Nachbarüberquerung, fehlenden Griff, stale Modell/Auswahl, einen Commit/Undo/Redo/JSON sowie Abbruch. Browser: 3-m-Wand über Endgriff um 1,25 m auf 4,25 m verlängert, Vorschau in 2D und 3D visuell geprüft; Eigenschaften vor Commit weiter 3 m. Ungültige Verkürzung -2 m bei vorhandenem 1,20-m-Fenster gesperrt. Commit 4,25 m, Undo 3 m, Redo 4,25 m. Anschließend -0,5 m ergibt 3,75-m-Vorschau, Escape stellt 4,25 m wieder her. Die noch ausstehende praktische 3D-Zahlenvorschauabnahme ist damit erledigt.


**Q0548**

Das vorhandene Hilfseingabefenster nach Setzen des ersten Linienpunkts aktivieren. Ursprung bleibt der erste Punkt; Maus/Fangengine bestimmen die Richtung oder Winkel/Länge werden ausdrücklich eingegeben. Gemeinsame polare Eingabe und vorhandene validierte Linienerzeugung verwenden; keine zweite Zeichenlogik. Zunächst einzelne gerade Linien, keine Polylinien oder weiteren Bauteile. Prüfen: Maus versus fixierte Werte, 0–360°, ungültige/Null-Länge, Escape ohne Bauteil, ein Commit/Undo/Redo und JSON; praktische Browserabnahme. Wandachsenlage N45 und Fensterbewegung bleiben spätere Aufgaben.


**Q0549**

Auf feat/shared-wall-precision, basierend auf dem noch offenen PR #43. PR #41–43 bleiben ohne neue Freigabe offen. Nach dem ersten Wandpunkt erscheint dasselbe PrecisionInput wie bei Linie/Bewegung. Ursprung, Parallelreferenzen, Tab Länge/Winkel, feste Zahlen, Maus, Enter und Abbruch werden gemeinsam verwendet. Wandstärke 0,36 m und Höhe 2,80 m bleiben die bisherigen Zeichenstandardwerte; nachher über Eigenschaften änderbar.


**Q0550**

Nachweise: 212 Tests bestanden, TypeScript/Build erfolgreich, ESLint 0 Fehler/6 bestehende Warnungen. Neue Tests für exakte Wand 3,00 × 0,36 × 2,80 m, 3D-Grenzen, Vorschau ohne Mutation, einen Commit/Undo/Redo/JSON, Null-Länge, falsche Winkel/Maße, stale Modell und erhaltene Linien-/Polylinienstile. Browser: Ursprung (0;1), Richtung mit Tab übernommen, 0°/3,00 m bleibt bei Mausbewegung exakt; 0 m und 566° sperren Übernahme. Bestätigte Eigenschaften 3/0,36/2,8; Undo entfernt, Redo stellt Wand wieder her. Neue Sitzung hat leere Felder; Abbrechen entfernt Hilfseingabe ohne Wand. Anschließende 3D-Darstellung visuell geprüft. Vorschau beim Zeichnen bleibt eine 2D-Achslinie; kein neuer 3D-Zeichenvorschaumodus.


**Q0551**

Die vorhandene Polylinie als weiteren Verbraucher des gemeinsamen Interaktionsvertrags anbinden. Pro Segment den aktuellen Punkt als Ursprung bereitstellen; dieselbe Eingabe, Tab, Fangengine und Bestätigung unverändert nutzen. Doppelklick beendet weiterhin die Polylinie, ein Undo-Schritt für den Gesamtabschluss bleibt erhalten. Prüfen, dass dazu keine zusätzliche Feld-/Tab-/Hover-Steuerung oder neue Werkzeugabfrage im gemeinsamen Interaktionskern nötig ist. Neue Punktaufnahme, Abschluss und Abbruch mit numerischen Segmenten praktisch testen; keine Wandkettenentscheidung vorwegnehmen.


**Q0552**

Die aufeinander aufbauenden PRs ab #41 einschließlich dieses Stabilisierungsschritts auf Zielzweige, Abhängigkeiten und offenen Prüfstatus kontrollieren. Einen verständlichen Übernahmeplan mit finalem Entwicklungsstand und verbleibenden Einschränkungen erstellen. Bereits vorhandene Testnachweise zuordnen; zusätzliche Prüfung nur bei neuen Abweichungen. Keine neuen Funktionen und kein automatischer Merge ohne ausdrückliche Nutzerfreigabe für die betreffenden PRs.


**Q0553**

Reproduzierbarer Messlauf mit 100/1000/5000 Elementen abgeschlossen. Skript scripts/benchmark-snapping.mjs; Verfahren, Hardware, Ergebnisse und Einschränkungen unter docs/performance/SNAP_BASELINE.md, Rohwerte in der benachbarten JSON-Datei. Referenzzahlen und Modellwechsel geprüft; ESLint für das Messskript und git diff --check erfolgreich. Anwendungscode unverändert, daher bestehende 225 Tests und Build-Nachweise nicht erneut ausgeführt. PR #51 bleibt zur Dokumentationsprüfung offen; dieser Schritt baut darauf auf.


**Q0554**

Primitive Modellquellen ohne globale Kreuzungen ableiten; räumlichen Index mit vollständigem Quellen-Lookup und lokaler Punkt-/Segmentabfrage in CSS-Radius aufbauen. Lokale Schnittreferenzen mit bisheriger Geometrie, Identität und Blattabhängigkeiten berechnen. Differentialtests zum Vollaufbau innerhalb des Suchradius, einschließlich langer Segmente und numerischer Grenzen; reproduzierbare Messung mit 100/1000/5000 Elementen. Noch keine UI-/Hover-Umschaltung, keine neue Fangart und keine leeren Klassen. Der funktionierende Suchdienst liefert den Nachweis für die anschließende gemeinsame Integration gemäß docs/LOCAL_SNAP_QUERY_PLAN.md.


**Q0555**

##### Umgesetzter Folgeauftrag, vollständige Projektabnahme offen: falsche lokale Segmenttreffer vor Paarbildung reduzieren


**Q0556**

Konservativer Segment-/Suchquadrat-Test in geometry/intersections/segment-box.ts; local-sources wendet ihn nach Boxsuche und Werkzeugfilter vor Paarbildung an. Originalsegmente und vollständiger Quellenlookup bleiben erhalten. Sechs neue Tests sowie 41 vorhandene reine Engine-Testfälle isoliert bestanden. Die vollständige Projekttestsuite, TypeScript, Build, Lint und Browserabnahme sind in dieser Umgebung mangels installierter Abhängigkeiten offen; kein produktionsreifer Abschluss behauptet. Draft auf Basis von PR #57, kein Merge.


**Q0557**

Testfixture mit festen Koordinatentupeln typisiert; alter Dichtetest erwartet für entfernte Diagonalen null Segmente/Paare. Echte Kreuzungen und Differentialvergleich bleiben geprüft. Formatierung korrigiert. 244 Tests, TypeScript, Build erfolgreich; ESLint 0 Fehler/6 bekannte Warnungen.


**Q0558**

Entwurf gegen gemeinsame ToolSnapPolicy, Hover und Picking abgleichen. Zustands- und Quellenvertrag sowie eine begründete vorläufige Auslöseschwelle mit Hysterese vorschlagen. Verhalten ohne Auswahl, bei Abbruch, Idle-Hover und Modellwechsel festlegen. Endpunkt-/Mittelpunktfang, aktive Führungen und feste Achsen erhalten. Ein kleines Umsetzungspaket mit Tests ableiten; noch keine automatische Einschränkung oder Dialoge implementieren.



### Zusätzliche lokale Quellen und Anlagen – Herkunft

| Quelle | SHA-256 | Einordnung |
| --- | --- | --- |
| NOVIKOV_ARCHITEKTUR_REVIEW_UND_FUNKTIONSMAP.md | `94835f1c6f8f00d550685c83cc443925108aebca041c680be61b27bfab47114d` | Gesprächsanlage oder historischer lokaler Guide; zentrale Präzisierungen gelten |
| NOVIKOV_ENTWICKLUNGSGUIDE.md | `a8e18e28b3cb224f0e7cfff046cfbcbda1a545eec108c6a1b574a6498624d0dd` | Gesprächsanlage oder historischer lokaler Guide; zentrale Präzisierungen gelten |
| NOVIKOV_FUNKTIONSARCHITEKTUR_2026-10-03.md | `cd742b8bc2648c7534cbbeeaa773ca5b8aea320b633e2aa34772742a338bf7f1` | Gesprächsanlage oder historischer lokaler Guide; zentrale Präzisierungen gelten |
| NOVIKOV_Entwicklungsleitfaden.md | `84d55c51f07591b8ecb667295e125d47685a2f7d40c8d141ac91832306795dc0` | Gesprächsanlage oder historischer lokaler Guide; zentrale Präzisierungen gelten |
| NOVIKOV_Entwicklungsplan.md | `ab90846f90b0d9a6c18da3edaf9646ee8c73d6400b097348f742e6f715606c58` | Gesprächsanlage oder historischer lokaler Guide; zentrale Präzisierungen gelten |
| 0.Where it all Begins.(1).docx | `6d4aac7711d92d9ef230f593569eca3ced9504527b999414fe255756f99714a9` | Gesprächsanlage oder historischer lokaler Guide; zentrale Präzisierungen gelten |
| CAD_BIM_2026_AI_Strategie.pdf | `c1f828b1297446c60072d6e6a7ae256e19cb1f838a66e8428431e93161738c34` | Gesprächsanlage oder historischer lokaler Guide; zentrale Präzisierungen gelten |
| FUNKTIONEN 03.10.2026.docx | `8b9ed3ff6a61952042093167382f7927fb4dc62f15ef92fa58533646a9fcd3e2` | Gesprächsanlage oder historischer lokaler Guide; zentrale Präzisierungen gelten |
| FUNKTIONEN 03.10.2026.pdf | `dee017a86132e0c9eb0c8489ac5525fe0cb795c1a6ad123c50f768ddaa73c0de` | Gesprächsanlage oder historischer lokaler Guide; zentrale Präzisierungen gelten |
| NOVIKOV_CODEX_RELEASE_COMPLIANCE.md | `9c89bd4826a714a044904683d52c02d1e39b30373a4987a06eabcd56b8352a20` | Gesprächsanlage oder historischer lokaler Guide; zentrale Präzisierungen gelten |
| NOVIKOV_HOMEPAGE_ANFORDERUNGEN.md | `e8314b119213e2ba54494f38d04f6dac94d2b5c0d3490517ba92fecbfa9bcda5` | Gesprächsanlage oder historischer lokaler Guide; zentrale Präzisierungen gelten |
| NOVIKOV_SBOM_KONZEPT.md | `1aab30f16c3c4ffd832d3448084926f15896a1148d99736c153439693d5b33f4` | Gesprächsanlage oder historischer lokaler Guide; zentrale Präzisierungen gelten |

Die erneut bereitgestellte FUNKTIONEN-DOCX hat exakt den SHA-256 der Repository-Transkription vom 08.10.; ihr Wortlaut ist oben vollständig erhalten. Das ältere FUNKTIONEN-PDF wurde zusätzlich textuell geprüft und enthält den früheren Katalog; die DOCX ergänzt dessen Schlusswünsche. Frühe lokale Guides sind historische Fassungen, keine zusätzlichen aktiven Aufträge.
