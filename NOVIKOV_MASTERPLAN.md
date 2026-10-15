# NOVIKOV CAD – zentraler Masterplan

Aktueller Arbeitsauftrag: 14.10.2026 – Reviewkorrekturen AUD14-01 bis AUD14-07, ausdrücklich zur sofortigen sequenziellen Umsetzung freigegeben. Prüfbezug: main `c081040d5fb7a8833ac8493bfd0ae669ef617e1e`, PR281–317; PR318 zum Auftragsabgleich offen. Ursprüngliche Konsolidierung vom 10.10.2026 bleibt historische Provenienz.

## 1. So wird dieser Plan benutzt

Es gibt zwei zentrale Arbeitsdateien:

1. **NOVIKOV_MASTERPLAN.md**: Mission, verbindlicher Architekturvertrag, überprüfter Entwicklungsstand, Prioritäten, Entscheidungen und nächster Auftrag.
2. **NOVIKOV_REQUIREMENTS_REGISTER.md**: detaillierte Anforderungen mit unveränderten Altkennungen, Quellenzuordnung, Abnahmebedingungen, Produktregister und technische Detailverträge. Nur die zum Auftrag gehörenden Abschnitte lesen.

AGENTS.md bleibt die kurze Arbeitsanweisung. Die bisherigen Leitfäden und Diagnosen bleiben als Quellen erhalten; ihre früheren Statusangaben und „nächsten Schritte“ sind keine aktuellen Aufträge. Die neue zentrale Reihenfolge ersetzt sie. Neue Anforderungen und Entscheidungen werden hier oder im Register eingepflegt, nicht in einem weiteren parallelen Leitfaden.

Priorität bei Widersprüchen: ausdrücklich bestätigte neuere Nutzerentscheidung → aktueller zentraler Vertrag → zugeordneter Detailvertrag → historische Quelle. Eine Vorschlagsfreigabe ist keine automatische Zustimmung zu darin ausdrücklich offenen Produktentscheidungen. Ein Merge belegt verfügbaren Code, nicht die vollständige fachliche Abnahme aller Langfristziele.

## 2. Mission und wichtigstes Ziel

**NOVIKOV CAD soll ein leistungsstarkes, langfristig skalierbares CAD/BIM-System werden, das komplexe Architekturentwürfe durch Sprache, Text und weitere Eingaben autonom entwickeln kann.** Dies ist das größte und wichtigste strategische Produktziel.

Die AI soll Grundstücksgeometrie/-größe, Lage, Brutto-Gebäudeblöcke und Zielgrößen, Geschosse/Höhen, Räume/Nutzungen/Nachbarschaften sowie belegbare Bebauungsplan-Unterlagen zusammenführen. Sie plant einen mehrschrittigen Entwurfsauftrag, erstellt editierbare Varianten, prüft sie, verbessert sie und verarbeitet Änderungswünsche. Sie muss nicht auf einen Klick für jede Wand warten.

Das Ergebnis ist ein weiter bearbeitbares BIM-Modell. Ein generiertes Bild, eine PDF oder eine plausibel klingende Antwort ersetzt dieses Modell nicht. Quellen, Annahmen, Konflikte und nicht prüfbare Aussagen bleiben sichtbar. Die CAD-Fachlogik berechnet Geometrie und Mengen; die AI interpretiert und orchestriert. Die Vision ist noch nicht implementiert.

Weitere Produktziele: zuverlässige manuelle Modellierung in 2D/3D, präziser Fang, gemeinsame Eigenschaften und Bearbeitung, Mehrgeschossigkeit und vollständige Gebäudebauteile, modellgebundene Zeichnungen/Abbilder/Layouts, nachvollziehbare Auswertungen, interoperabler Austausch, große reale Projekte, sichere lokale Dateien, Windows und macOS. Deutsch als erste Bedienoberfläche, Modelllängen in Metern. Browser oder installierbare Desktopanwendung bleibt offen.

## 3. Verbindlicher Architekturvertrag

### A01 – Ein autoritatives Projektmodell

Wände, Öffnungen, Linien, Schraffuren, Räume und spätere Bauteile existieren fachlich einmal. Grundriss, 3D, Navigator, Eigenschaften, Auswahl, Mengen, AI-Kontext, Projektdateien und IFC lesen denselben gültigen Modellstand. Beziehungen verweisen auf stabile projektweite IDs. Kein zweites editierbares Modell pro Bildschirmfenster, Abbild, Renderer, Export oder AI-Agent. Abgeleitete Arbeitskopien für Vorschau sind unveränderlich gebunden, verwerfbar und keine eigenständige Wahrheit.

### A02 – Zuständigkeiten und Abhängigkeiten

| Schicht | Verantwortung | Grenze |
| --- | --- | --- |
| Core | IDs, technische Verträge, spätere Transaktionen/Abhängigkeiten | Kein React, IFC, Bauteil- oder Sprachwissen |
| Geometry | Punkte, Vektoren, Segmente, Polygone, Projektion, Schnitt, Transformation, Toleranzen, spätere Solids | Keine Wand-/Raumklassen, UI oder Dateiformate |
| Domain | Fachmodell, Bauteile, Beziehungen, Geschosse, Höhen, Ebenen, Ansichts-/Dokumentdefinitionen und Invarianten | Keine React-, Renderer-, IFC- oder Dienstanbieterobjekte |
| Application | Actions/Queries, Auswahl, Bearbeitungssitzungen, Kontextprüfung, Vorschau, Veröffentlichung, History und Fähigkeiten | Keine zweite Fachgeometrie pro Eingabekanal |
| Constraints | Gemeinsamer Fang, Referenzen, Hilfslinien, Richtung und präzise Eingabe | Wiederverwendung allgemeiner Geometrie; Modellquellen über Adapter |
| Rendering | Projektion, SVG/WebGL, Picking, Anzeige- und GPU-Caches | Darstellungsdaten bleiben ableitbar und wegwerfbar |
| Interop/Plattformadapter | Import/Export, Persistenz, lokale Speicherorte, Dialoge, OS, Bibliotheksablage | Domain importiert keine Austausch- oder Plattformimplementierung |
| AI/Text/Voice | Absichten/Transkripte, strukturierte Parameter, Planung und Werkzeuge | Ruft Application auf, verändert kein JSON/React-State/Mesh direkt |
| UI/App | Bedienung, Darstellung, flüchtiger Zustand, Routing/Bootstrap | Keine permanente Fachlogik in CadWorkspace oder Komponenten |

Richtung: UI/AI → Application → Domain → Geometry/Core. Rendering und Interop verwenden Domain/Geometry; Domain hängt nicht von ihnen ab. Constraints verwenden Geometry und geeignete lesende Quelladapter. `src/lib/bim` ist Übergangsstruktur. Keine große Neuschreibung, kein Ordnerumbau auf Vorrat, keine leeren Frameworks; funktionierende vertikale Abläufe schrittweise erhalten.

### A03 – Gemeinsame Actions, Queries und Auswahl

Maus, Eigenschaften, Direct Edit, Hotkeys, Text, Sprache und spätere AI verwenden dieselben typisierten validierten Aktionen. Relevante Fachfähigkeiten beschreiben Namen, Parameter/Einheiten, stabile Ziel- und Host-/Container-IDs, Projekt/Geschoss/Ansicht/Arbeitsebene, Voraussetzungen, Wirkungen, Fehler und Unterstützungsumfang. Rein visuelle Buttons benötigen keinen künstlichen AI-Endpunkt.

Auswahl ist Application-Kontext, keine Eigenschaft einer einzelnen Ansicht. Treffer auf Renderprimitiven werden auf echte Modell-IDs und zulässige Features zurückgeführt. Zielkontext wird gebunden; geänderte Auswahl, Revision, Sichtbarkeit oder gelöschte Ziele invalidieren Vorschauen und Sprachsitzungen. Keine Auswahl nach Listenposition oder stilles Ausweichen auf ein nahegelegenes Element. Erzeugung braucht expliziten Host/Container, nicht eine ID eines noch nicht existierenden Elements.

### A04 – Bearbeitung, Vorschau und History

Gemeinsamer ToolInteraction-/InteractionInput-Lebenszyklus: beginnen, Ursprung/Kontext binden, Parameter sammeln, Vorschau prüfen, bestätigen oder abbrechen. Fachadapter liefern Regeln, keine eigenen Kopien von Maussteuerung, Formular/Tab, Snap oder History. Jede Bewegung pinnt den gewählten Modellpunkt sofort als Konstruktionsursprung; keine Hover-Wartezeit. Explizite Achsen/Hosts bleiben maßgeblich, auch bei abgeschaltetem Snap. Numerische Ziele verdrängen Maus-Snap-Intent.

Vorbereitete Bearbeitung bindet einen gültigen unveränderlichen Ausgangsstand einmal. Während Bewegung werden betroffene Elemente UND fachlich nötige stationäre Nachbarn aktualisiert; unveränderte Anzeige bleibt wiederverwendbar. Insbesondere eine stehenbleibende Wand kann nach Lösen eines Anschlusses eine neue Kontur benötigen. Beim Übernehmen vollständige fachliche Prüfung, aktuelle Kontextkontrolle, atomare Veröffentlichung und genau ein sinnvoller Undo-Schritt. Keine History pro Mausbewegung, keine ungeprüfte Veröffentlichung eines Vorschaucaches.

Snapshot-History bleibt vorerst bestehen. Delta-/Change-Set-History erst bei gemessenem Bedarf; History ist kein Backup. Wandkette als ein Modell-Undo-Schritt. Ansichtsmaßstab außerhalb Modell-Undo; Ebenensichtbarkeit verwendet ihre vorhandene getrennte History; Musterbibliothek eigene History mit neuen monotonen Revisionen. Diese bewusst verschiedenen Vorgänge dürfen nicht still vereinheitlicht werden. Keine eigene Abbild-History; konkrete Dokumentanlage/-löschung muss fachlich zugeordnet sein.

#### Verbindliches Abnahmegate für neue Bewegungsadapter (Nutzerentscheidung 15.10.2026)

Ein geprüfter Fix gilt als gemeinsame Vorgabe für alle folgenden Werkzeuge: Grundriss und
3D, Einzel-/Mehrfachauswahl und künftige Decken, Dächer, Treppen. Gemeinsamer Fang allein
verhindert keine Engpässe, wenn ein Adapter daneben das ganze Modell prüft oder ableitet.

- Einmalige Vorbereitung pro Bearbeitung auf geprüfter unveränderlicher Basis; Kamera,
  Zoom und Pointer dürfen diese Modellbasis nicht unnötig neu vorbereiten.
- Gemeinsame Fang-/Referenzpipeline mit stabiler Quellen-ID und fachlichen Abhängigkeiten;
  lokale Kandidaten plus aktive Hilfsreferenzen. Keine neue Fangengine pro Elementtyp.
- Application-Adapter liefert eine abgeleitete GeometryPreview mit vollständiger betroffener
  Menge einschließlich stationärer Nachbarn. Renderer komponiert sie gemeinsam; fachliche
  Typauswahl gehört in Application. `prepareDirectEditPreview` ist der Einstieg für die
  bisher migrierte direkte Bearbeitung; Auswahlbewegung verwendet ihren bestehenden
  vorbereiteten Pfad und denselben GeometryPreview-Vertrag.
- Keine zusätzliche Gesamtprojekt-Validierung, Payload-Serialisierung, globale Paarbildung
  oder GPU-Neuanlage pro Pointerbewegung einführen. Verbleibende globale Komposition,
  große Anschlussgruppen und Legacy-Fallbacks ausdrücklich messen und kennzeichnen.
- Platzieren prüft den vollständigen aktuellen Modell-/Auswahlkontext und Fachzustand;
  atomare Veröffentlichung, genau ein Undo-Schritt; Abbruch veröffentlicht nichts.
- Vor Adapterfreigabe: Geometrie-/Auswahlkonturvergleich gegen die vollständige Aktion,
  Anschlüsse und gelöste Nachbarn, Fenster, fremde Endpunkte soweit betroffen, Grenzwerte,
  stale Kontext, Abbruch und Undo. Zusätzlich repräsentative Größenmessung: Vorbereitung,
  erster und warme Schritte getrennt; Aufruf-/Arbeitsmenge sowie verbleibende Kosten nennen.
  Bei Renderingänderung visueller Nachweis. Bestehende Äquivalenztests bleiben Regressionen.

Dies ist eine verbindliche Entwicklungs-/Reviewregel, keine Behauptung, alle Altpfade seien
bereits migriert oder eine Typenschnittstelle könne Laufzeitkomplexität allein garantieren.
Ein neuer Adapter ohne diese Nachweise ist nicht abgeschlossen. Keine leeren Zukunftsklassen.

### A05 – Geometrie, Fang und 3D

Einheiten, Achsen, numerische Verträglichkeit und toleranzabhängige Grenzen zentral halten. Allgemeine Geometrie getrennt von Host-/Öffnungs-/Anschlussregeln. Ungültige, entartete oder mehrdeutige Fälle explizit melden; Koordinaten nicht heimlich zurechtrücken.

Fang bewertet Cursorentfernung in CSS-Pixeln und liefert Modellkoordinaten. Lokale Quellensuche, deterministische Priorität, zeitgebundene Referenzen und gemeinsame Inferenz statt globaler Paarvergleiche pro Pointerereignis. Sichtbarkeit vor Kandidaten-/Schnittpunktbildung anwenden. Dichtebereiche begrenzen und explizite Referenzauswahl anbieten; keine hunderte automatisch erzeugten Referenzlinien. Aktuelle 600-ms-Hover-Implementierung ist kein allgemeines ergonomisches Optimum; ältere 400-ms-Angaben sind historisch. Darstellungsring und Suchradius sind verschiedene Größen.

3D-Darstellung, Picking, Ebeneninverse, sichtbare Referenzen und Vorschau verwenden denselben gültigen Projektions-/Kamerastand. CSS-Pixel für Eingabe, DPR für Auflösung. Navigation bestätigt niemals zugleich eine Modellaktion. Nicht invertierbare Arbeitsebene blockiert Zielübernahme, erlaubt aber Navigation. Sichtbare Fußpunkte sind echte Ursprünge; Wand-ID oder Bildschirmanker ersetzen sie nicht. Gegenwärtige XY-Ebene z=0 ist keine freie räumliche Modellierung. Mesh-Auswahlumrandung bleibt verdeckungsrichtig; keine still aktivierte X-Ray-Auswahl.

### A06 – Striktes Skalierverbot und Maßstab

**BIM-/3D-Elemente werden niemals proportional skaliert**, auch nicht im Grundriss oder Abbild. Wände/Fenster/Türen/Decken/Dächer dürfen nur durch passende Fachparameter-/Geometrieaktionen geändert werden. Proportionale Skalierung ist echten 2D-Elementen und zugelassenen PDF-/PNG-/JPEG-Referenzen vorbehalten. Jede Application-Aktion prüft alle Ziele vor Vorschau und Commit; gemischte oder unaufgelöste Auswahl wird vollständig abgewiesen. UI-Ausblenden allein reicht nicht.

Arbeitsmaßstab unten neben Zoom, Anfang 1:100. Semantischer Ansichtskontext besitzt 1:S; Bildschirmfenster besitzen unabhängige Kameras. Zwei Fenster derselben Arbeitsansicht teilen S. Zwei verschiedene Abbilder besitzen unabhängiges S. Modell-/Papiermaß ist eine Größenreferenz von Annotationen/Mustern, niemals der Messwert selbst. Text-, Bemaßungs- und Zahlenwerkzeuge müssen passende Größenoptionen Modellmaß/Papiermaß anbieten.

Intern alle Längen in Metern, Papiergrößen in der UI in mm. `paperMetres = paperMillimetres / 1000`; Papierdarstellung im Modell: `modelMetres = paperMetres * S`; Bildschirm: `CSS-Pixel = modelMetres * Kamera-Pixel-pro-Meter`. Modellgröße bleibt unabhängig von S. Zoom ist kein Ausgabemaßstab. Konturen, BIM-Maße, Fangpunkte, gemessene Zahlen und IFC bleiben unverändert. Fehlendes/ungültiges S ist ein Fehler, kein 1:1- oder Zoom-Fallback. Papier-/Modellmusterwechsel erhält die sichtbare Größe. Perspektivische 3D hat keinen globalen maßhaltigen 1:S-Wert. Layout darf nicht unbeabsichtigt doppelt skalieren.

### A07 – Ansichten, Abbilder und Layouts

Nutzerkorrektur 10.10.2026: Ein Abbild zeigt das gesamte Modell; gespeicherte Position/Zoom sind nur die Startansicht. Zuschnitt erfolgt später im Layoutbuch. Linien und Schraffuren aus Abbildern gehören zur gemeinsamen Geschosszeichnung; unabhängige Ebenenfilter bleiben erhalten.

ModelView definiert eine Modellableitung (Geschoss/Schnitt/Ansicht/3D). DrawingDocument heißt in der UI **Abbild**, referenziert eine ModelView und besitzt Maßstab, Bereich, Filter/Stil und dokumentbezogene Ergänzungen. Kein kopiertes Geschoss. Änderungen des BIM aktualisieren die Ableitung. Fehlende/fremde/veraltete Quellreferenzen sind Fehler; kein Arbeitsgrundriss-Fallback.

Abbild übernimmt bei Anlage einmal die aktuelle Ebenensichtbarkeit, danach unabhängig. Arbeits-BIM-Sichtbarkeit ist kein darübergelegter Filter. Navigator-Tabs **Gebäudestruktur** und **Abbilder**. Keine eigene Abbild-Undo-/Redo-Oberfläche; vorhandenen Ebenenumschalter kontextbezogen wiederverwenden. PR-238-Bedienergänzungen gehören erst nach überprüfter Übernahme zum bestätigten Code.

Annotation-Scope explizit: Geschoss, ModelView, DrawingDocument oder Layout mit stabiler Besitzer-ID. Bemaßungsreferenzen können Modellfeatures referenzieren; Löschung/Topologieänderung zeigt ungelöste Referenz an. Bestehende geschossbezogene Linien behalten ihren Scope. Layout/MasterLayout enthalten Papierkomposition, Format und Plankopf; Platzierung referenziert das Abbild. Bildschirmfenster und Papierplatzierung sind unterschiedliche Konzepte. Keine stille Kaskadenlöschung abhängiger Dokumente/Annotationen/Layouts. Kontextresolver in Application löst Quelle, Maßstab, Filter und Fähigkeiten einmal auf; Renderer rekonstruiert sie nicht.

### A08 – Ebenen, Materialien und Höhen

Organisations-Layer mit stabiler ID ist nicht eine Materialschicht (AssemblyLayer). Alle Elemente besitzen passende Ebenenzuordnung; mehrere Elemente dürfen dieselbe Ebene verwenden. Standardbestand erhalten: Außenwand, Innenwand, Dach, Decke, Fenster, Tür, Möblierung, Geländer, Gelände, 2D-Zeichnungen, Neutrale Ebene, Bemaßung; Raum/Text später ergänzen. Belegte Ebene nur mit definierter Neuzuordnung löschen.

Gemeinsame Eligibility-Policy für Anzeige, Auswahl und Fang. Fensteranzeige verlangt sichtbares Fenster UND sichtbaren Host. Ausblenden verändert keine reale Wandöffnung oder vollständigen IFC-Export. Verdeckter Bearbeitungsgegenstand invalidiert die Sitzung.

Feste Höhen und an Geschosse gebundene Unter-/Oberbezüge mit Offsets unterscheiden. Altdateien mit festen Wandhöhen erhalten nicht heimlich eine Geschossbindung. Höhe wird aus ihrer Quelle abgeleitet, nicht redundant editierbar gespeichert. Änderung von Geschoss-/Host-/Dachregeln prüft alle abhängigen Öffnungen und Bauteile atomar. Fachliches Dachtrimmen und bloße Schnittdarstellung getrennt behandeln.

### A09 – Bibliotheken, Assets und Portabilität

Linienarten und Schraffurmuster bleiben getrennte Bibliotheken. Schraffurdefinition und Anwendung getrennt: wiederholte Linien sind abgeleitete Anzeige, keine einzelnen gespeicherten Modelllinien. Globale Schraffur-ID/Revision, portable eingebettete Definition einmal pro Projekt; neuere Bibliothek aktualisiert Anwendungen, fehlende/ältere bewahrt Darstellung, gleicher Revisionsstand mit anderem Inhalt zeigt Konflikt. Bibliotheks-Undo publiziert neue Revision; Projekt-Undo dreht globale Aktualisierung nicht zurück. Geschlossene Dateien werden nicht heimlich geändert. Mehrtab-Benachrichtigung ist kein Nachweis atomarer konkurrierender Schreibtransaktionen.

Linienarten derzeit eigene Anwendungssnapshots mit Modellwiederholungslänge; Löschen/Ändern des Katalogs erhält vorhandene Linien. Inventar maximal zehn Arten. Stiftsets: lokale globale Bibliothek, portable Projektwerte; spätere Änderung eines Stifts ändert bestehende Elementfarben nicht automatisch. Farbe und Musterwinkel an Anwendungen, keine unbeabsichtigte Konturskalierung/-drehung.

Logische Bild-Asset-ID und unveränderlicher Payload getrennt denken. Nur intern nach vollständiger Prüfung ausgestellte Identitätshandles gestatten Payload-Prüfreuse; Hash, ID, Object.freeze oder deserialisierter Inhalt allein schafft kein Vertrauen. Geometrie-/Referenz-/Eingangsprüfungen bleiben erhalten. Verknüpfte Bilder und portable eingebettete Assets sind ausdrücklich gewünscht; fehlende/verschobene Dateien, Austausch, relative Pfade, Projektumzug, Zugriffsrechte und Offline-Verhalten gehören zur Abnahme. Kein Produktionsnachweis für extern verknüpfte Bilder vorhanden.

### A10 – Dateisicherheit, Plattformen und Security

Windows und macOS berücksichtigen. Browser/Desktop, Mindestversionen, Packaging, eigene Dateiendung und Lizenztechnik offen. Filesystem, Speicher, Dialoge, Tastatur Ctrl/Command und Dienste hinter austauschbaren Adaptern. Kein Sprach-/Renderer-/Datenbankwechsel ohne belegten Bedarf.

Projektformat strikt versionieren. Alte Eingänge vor Migration validieren, danach aktuelles Schema/IDs/Referenzen/Geometrie prüfen. Keine Reparatur oder Migration mitten in Runtime-Aktionen. Neue unbekannte Formate nicht destruktiv überschreiben; Original vor Migration erhalten. Hover, Menüs und flüchtige Guides gehören nicht ins Projektformat.

**Dateisicherheit und Recovery sind P0.** Konsistenten Snapshot sichern, temporär schreiben, Integrität prüfen und Ziel atomar ersetzen, soweit der Plattformadapter es garantiert. Stromausfall-Persistenz gesondert bewerten. Letzten gültigen Stand, getrennte Autosaves, versionierte Backups, verständliche Wiederherstellung, konkurrierende Schreibzugriffe und Netz-/Sync-Ordner behandeln. Browserdownload ist kein bestätigter Datenträgerschreibvorgang. Datenverlust oder unerkannt falsche Maße blockieren externe Freigabe.

Importe/Archive/Parser/Plugins als unvertrauenswürdig behandeln: Größen-, Pfad-, Schema-, Entpack- und Ressourcenlimits. Keine privaten Signaturschlüssel/Tokens in Client, Repo oder Logs. Release-/Updateintegrität, Wiederherstellung bei Updatefehlern, Schwachstellenprozess, Sicherheitskontakt und Supportzeitraum vor externem Release konkretisieren.

### A11 – Kontrollierte autonome AI

Maschinenlesbarer Fähigkeitskatalog und strukturierte Queries; stabile IDs, Einheiten, Revision, Rechte und Scope. AI kann viele Schritte innerhalb eines gestarteten Auftrags planen und iterieren. Vor Übernahme verständliche Gesamtvorschau/Modell-Diff, Wirkung/Annahmen/offene Punkte; atomare oder klar begrenzte Transaktionen, Abbruch und Rücknahme. Umfang automatischer Übernahme ist eine spätere ausdrückliche Einstellung. Externer Versand und Veröffentlichung bleiben separate Aktionen.

B-Plan/OCR/Planzeichen und Textfestsetzungen als extrahierte Aussagen führen: Dokument, Seite/Region, Version, Geltungsbereich, Georeferenz-/Skalenbezug, Unsicherheit. Nutzerangabe, extrahierte Festsetzung, CAD-Berechnung und Annahme unterscheidbar. Fehlende/widersprüchliche Quellen klären. Keine erfundene Rechtskonformität, Genauigkeit oder Konfidenz. Änderung von Grundstück/Quelle/Raumprogramm invalidiert abhängige Prüfergebnisse. Unlösbares Raum-/Regelprogramm meldet Konflikte.

Provider/Spracherkennung/Dokumentanalyse austauschbar, keine Geheimnisse oder Anbieterlogik im Kernel. Lokale CAD-Nutzung bleibt von optionaler Cloud-AI getrennt. Datenübermittlung explizit beschreiben und berechtigen. Eigenes AI-Training ist keine Startvoraussetzung. Varianten sind modellgebundene geprüfte Entwurfsstände mit eindeutigen Zuständigkeiten, keine unkontrollierten parallelen Schreiber.

### A12 – UI, Arbeitsweise und Abnahme

NOVIKOV Glass Flow. Werkzeugeigenschaften fest unter Haupttoolbar: gleiche validierte Felder für Werkzeugdefaults und Auswahl. Häufige gemeinsame passende Felder zuerst; keine Pflichtbreite/-höhe für jeden Typ. Navigator für Struktur/Auswahl. On-Demand-Menü nahe Zeiger, beweglich, kompatible Actions; letzte passende Aktion nur vorwählen, keine automatische Mutation.

CAD-Fenster verwenden FloatingPanel: beweglich, nicht modal, kein ausgegrauter Hintergrund, Randbegrenzung, Keyboard/Escape. Inhalte liefern eigene Validierung. Doppelter Rechtsklick nur in 2D aktiviert Werkzeug und übernimmt deklarierte Erstellungswerte inklusive Ebene; niemals IDs, Geometrie oder Beziehungen. Neue Elemente werden erst mit einer normalen Erzeugungsaktion angelegt.

Pro Auftrag Eigentümer, Modellquelle, Action/Query, Geometrieservice, Kontext, Undo, Darstellung, Persistenz/Migration, Exportwirkung und Abnahme bestimmen. Passende deterministische Tests, Typprüfung, Lint, Build und konkreter Bedienversuch. Mikrofonerkennung, Bediengefühl, schwere reale Daten, Ausdruckmaß und externe Austauschprogramme brauchen eigene praktische Nachweise. Nur tatsächlich ausgeführte Prüfungen behaupten. Fortschritt, Grenzen und genau einen nächsten Auftrag dokumentieren.

## 4. Bestätigter Entwicklungsstand

**Serializer nutzt exakte strukturelle Größenprüfung (12.10.2026):** PR281 nach expliziter Freigabe/grüner CI nach main übernommen. serializeProject validiert vollständig, prüft dann mit bestehendem assertValidatedProjectSize und serialisiert unverändert. 128-MiB-Grenze bleibt. Zwei produktionsnahe Exporte: Größe 11–16 statt 259–273 ms, Export-Tasks 412–511 statt 620–710 ms. Downloads byteidentisch; 910 Tests einschließlich exakter Grenze/Unicode/Escaping, Typecheck/Lint und Builds bestanden. [Nachweis](docs/performance/ASSET_RECOVERY_PILOT.md). Blob- und Ladepausen bleiben offen.

**Doppelte Exportgrößenprüfung entfernt (12.10.2026):** PR280 nach expliziter Freigabe/grüner CI nach main übernommen. Zwei produktionsnahe Exporte zeigten zwei identische UTF-8-Kopien für Größenprüfung (zusammen 562–615 ms). requestProjectDownload vertraut jetzt auf die weiterhin vollständige Prüfung in serializeProject. Nachher 620–710 statt 974–1126 ms Export-Task; vier Dateien byteidentisch. 908 Tests, Typecheck/Lint, isolierter und normaler Build bestanden. [Messgrenzen/Rohdaten](docs/performance/ASSET_RECOVERY_PILOT.md). Restliche Export-/Ladepausen bleiben offen.

**Produktions-Workspace geprüft (12.10.2026):** PR277/279 einschließlich PR278 nach expliziter Freigabe/grüner CI nach main übernommen. Isolierter Vite-Produktionsbuild des echten Workspace ohne Profiler auf 8085: 100-MiB-Datei inklusive Abbild geöffnet, Höhe geändert, Undo/Redo, Export, Snapshot, Reload und Wiederaufnahme. Vollständige Dateivergleiche bestanden, Abbild-Zoom 100 % erhalten. Übernahme-Long-Task 2635 ms, Export 1142–1276 ms; flüssige Großprojektbedienung nicht freigegeben. Separater Client-Build prüft nicht Cloudflare/SSR. [Nachweis](docs/performance/ASSET_RECOVERY_PILOT.md). Build, Typecheck und gezieltes Lint bestanden.

**Grundriss erst mit gemessener Kamera (12.10.2026):** PR278 grün geprüft in seinen Basiszweig übernommen; PR277 bleibt offen. CadViewport baut BimPlan erst nach initialer Messung auf, veröffentlicht vorher kein Ersatz-Framing und ignoriert unveränderte Resize-Messwerte. Identische 100-MiB-Fixture: ein Linienaufbau (518 ms), kein zusätzlicher 187–245-ms-Durchlauf. Gesamt-Task 2,81 s, keine belastbare Gesamtzeitverbesserung aus Einzelvergleich. 908 Tests, Typecheck/Lint/Build bestanden; Zoom, Resize, Abbild/Fit, Dateiwiederöffnung und Canvas-Auswahl geprüft. Modell/Bildpayloads im Export identisch. [Nachweis](docs/performance/ASSET_RECOVERY_PILOT.md).

**Grundriss-Folgearbeit eingegrenzt (12.10.2026):** PR274/275 einschließlich PR276 nach ausdrücklicher Freigabe und grünen Prüfungen nach main übernommen (3cd55be). PR277 bleibt separat offen. Diagnose auf dessen Stand: Linien erster Render 399–528 ms, unmittelbarer Folge-Render 187–245 ms; Bildreferenzen erster Render 591–733 ms. Zwei identische 100-MiB-Läufe. Callback-/Framegrenzen ergänzt, keine isolierte Paintmessung behauptet. Typecheck, gezieltes Lint und Build bestanden. [Rohdaten/Grenzen](docs/performance/ASSET_RECOVERY_PILOT.md).

**Bild-URL-Prüfung an Asset-Lebensdauer gebunden (12.10.2026):** PR276 nach grüner CI in seinen Basiszweig perf/workspace-load-profile zusammengeführt; main wartet weiterhin auf die offenen Basis-PRs. Renderer-Cache nutzt ausschließlich die bestehende interne Handle-Identität, prüft beim ersten Zugriff weiterhin Bildheader und hält keine Assets stark fest. Veränderbare Objekte bleiben im begrenzten Inhaltscache. Identische 100-MiB-Fixture: 24 → 12 Dekodierungen, 738 → 407 ms Prüfzeit; Dateivollvergleich identisch. 908 Tests, Typecheck/Lint/Build bestanden. Gesamt-Ladepause weiterhin 3,39 s im Diagnosebuild; keine vollständige Performancefreigabe.

**Navigator auf Geschossstruktur begrenzt (12.10.2026, perf/storey-navigator):** Nutzerentscheidung: keine einzelnen Bauteile im Navigator; dieser dient Projekt-/Geschossstruktur und Abbildern. Elementzeilen entfallen, keine Virtualisierung nötig. Gleiche 100-MiB-Fixture: Navigator erster Render 1,3 ms statt 821–987 ms, Folge-Render 0,8 ms statt 379–439 ms (Diagnosebuild, Einzelvergleich). Canvas-Auswahl, Höhenänderung, Undo/Redo und vollständiger Dateivergleich bestanden; 905 Tests, Typecheck/Build bestanden. Restliche Grundriss-Ladepause bleibt offen. [Nachweis](docs/performance/ASSET_RECOVERY_PILOT.md).

**Workspace-Ladepause zugeordnet (12.10.2026, perf/workspace-load-profile):** Zwei Läufe derselben 100-MiB-Fixture: Application 369–457 ms, erster Grundriss-Render 1.165–1.272 ms, Navigator 821–987 ms plus Folge-Render 379–439 ms. Zwölf Bilder im zweiten Lauf zweimal geprüft (517 ms insgesamt). Nur Diagnoseinstrumentierung; keine Beschleunigung behauptet. [Messgrenzen/Rohdaten](docs/performance/ASSET_RECOVERY_PILOT.md). R26-01/02, K02/03, RC07 weiter offen.

**100-MiB-Workspace-Datenablauf geprüft (12.10.2026, test/workspace-capacity-100):** PR272 und PR273 nach ausdrücklicher Nutzerfreigabe/grüner CI geordnet zusammengeführt (main f833834). Echter CadWorkspace auf getrenntem Ursprung 8082: 101,96-MiB-Datei geöffnet, Wandhöhe geändert, Undo/Redo, tatsächliche Downloads, erneute Dateiöffnung, lokaler Snapshot und Wiederaufnahme nach Seitenreload. Vollständige Dateivergleiche bestanden, zwölf Bildpayloads erhalten. [Nachweis](docs/performance/ASSET_RECOVERY_PILOT.md). UI-Long-Tasks bis 7.113 ms; keine Freigabe flüssiger Großprojektbedienung. Keine Produktcodeänderung. R26-01/02, K02/03, RC07 bleiben wegen UI-Pausen teilweise offen.

**V2-Gesamtbudget ohne Bildserialisierung (12.10.2026, perf/recovery-budget-size):** Aufbau auf offenem PR272 (eb18af8); main bleibt e685e3b mit zusammengeführtem PR271. Gemeinsamer Größenbaustein ersetzt vollständige Payloadserialisierung nach unveränderter Fachprüfung. Drei A/B-Paare auf 101,96 MiB: Sicherungsmedian 4.645 → 3.234 ms, Lesemedian 2.456 → 1.673 ms; vollständige Inhalte identisch. 14 Browserablaufprüfungen, 19 Sicherheitsfälle, 905 Tests, beide Typechecks und Build bestanden; Lint 0 Fehler/6 bekannte Warnungen. [Nachweis](docs/performance/ASSET_RECOVERY_PILOT.md). 128-MiB-Grenze unverändert; noch keine vollständige Canvas-/Dateisystemabnahme. R26-01/02, K02/03, RC07 teilweise offen.

**Modell-Commit ohne Bildserialisierung (12.10.2026, perf/commit-asset-size):** PR271 nach grüner CI/Freigabe zusammengeführt (main e685e3b). Vollständige Fachvalidierung und exakte 128-MiB-UTF-8-Grenze bleiben erhalten; geprüfte Base64-Payloads werden nach Länge gezählt, vorhandener strukturierter Vergleich ersetzt vollständige JSON-Gleichheitsprüfung. Drei Browser-A/B-Paare beim 101,96-MiB-Profil: Median 644 → 98 ms, Ergebnisse identisch. Neun Browserprüfungen, 904 Tests und Build bestanden. [Nachweis](docs/performance/ASSET_RECOVERY_PILOT.md). Keine neue History-/Format-/Limitentscheidung; Recovery-/Ladepausen bleiben offen (R26-01/02, K02/03, RC07).

**128-MiB-Projektgrenze und 100-MiB-Serviceablauf (12.10.2026, feat/project-capacity-128):** PR270 nach grüner CI/Freigabe zusammengeführt (main 4daca31). Zentrales portables Projektbudget auf 128 MiB erweitert; individuelle Bildgrenze unverändert. 101,96-MiB-Fixture mit zwölf PNGs/10.000 Linien durch Dateiöffnung, Wandänderung, Undo/Redo, Download-Port, erneutes Öffnen und produktive V2-Recovery geprüft; sechs vollständige Inhalts-/Ablaufprüfungen bestanden. 902 Tests und Build grün. [Nachweis und Grenzen](docs/performance/ASSET_RECOVERY_PILOT.md). Gemessene Commitpause ca. 809 ms, V2-Sicherung 4,46 s; keine flüssige Großprojekt-/Canvas-/OS-Neustartabnahme. R26-01/02, K02/03, RC07 weiter teilweise offen.

**Produktive V2-Recovery angebunden (12.10.2026, feat/recovery-v2-routing):** PR269 nach grüner CI/Freigabe zusammengeführt (main 8656a44). Bestehender Sicherungscontroller und Wiederaufnahme verwenden Versionsrouting; nur ausgewähltes Projekt wird beim Vorbereiten der Sicherung migriert. V1-Originale bleiben erhalten; Katalog und Head sind atomar. 19 isolierte Browserprüfungen, 902 Node-Tests, beide Typechecks und Build bestanden; Lint 0 Fehler/6 bekannte Warnungen. [Nachweis](docs/performance/ASSET_RECOVERY_PILOT.md). Weiterhin 32 MiB portables JSON; keine Großprojekt-/Stromausfallgarantie. R26-01/02, K02/03, RC07 teilweise offen.

**V2-Sicherungswriter geprüft (12.10.2026, feat/recovery-v2-writer):** PR268 nach grüner CI/Freigabe zusammengeführt (main bf4fadb). Zustandsgebundener Application-Writer mit privater Revision, gültigem Vorgänger, Busy-/Kontext-/Abbruchschutz und explizitem Budgetcodec ergänzt. Adapter prüft Kontext am finalen Headrequest nach allen Payloadwrites. 30 Browserfälle und 902 Node-Tests bestanden; beide Typechecks/Build grün, Lint 0 Fehler/6 bekannte Warnungen. [Nachweis](docs/performance/ASSET_RECOVERY_PILOT.md). Keine UI-/Katalogmigration oder Produktionslimitänderung; R26-01/02, K02/03, RC07 teilweise offen.

**Recovery-V2-IndexedDB-Adapter nachgewiesen (12.10.2026, feat/recovery-v2-indexeddb):** PR267 nach grüner CI/Freigabe zusammengeführt (main 8751c1a). Gemeinsamer Interop-Codec ersetzt die bisherige Diagnoseimplementierung; isolierter V2-Adapter prüft Quelltoken und Revision atomar und speichert Bildpayloads getrennt. 21 echte Browserfälle mit zwei Verbindungen, Commit-Rollback, Vorgänger, unbekannter Version und defekten Bildern bestanden. 897 Tests, beide Typechecks und Build grün; Lint 0 Fehler/6 bekannte Warnungen. [Nachweis](docs/performance/ASSET_RECOVERY_PILOT.md). Produktionsadapter/-limit unverändert; R26-01/02, K02/03, RC07 weiter teilweise offen.

**Recovery-V2-Vertrag und Migration geprüft (12.10.2026, feat/recovery-v2-contract):** PR266 nach grüner CI/Freigabe zusammengeführt (main 7599584). Application-Port für versionierte Manifeste/Payloads, current/previous, Projektkontext und atomaren Vergleich von V1-Quellstand plus V2-Revision ergänzt. V1 bleibt erhalten; Migration meldet Erfolg erst nach Commit. Neun Regressionen mit echtem Pilotcodec für Rundlauf, Vorgänger, Fehler, Konflikt und Abbruch. 897 Tests, beide Typechecks und Build bestanden; Lint 0 Fehler/6 bekannte Warnungen. Kein produktiver Adapterwechsel, kein neues Dateilimit. R26-01/02, K02/03, RC07 weiterhin teilweise offen.

**250-MiB-Recoveryprofil bestanden (12.10.2026, bench/recovery-250):** PR265 mit ausdrücklicher Freigabe zusammengeführt (main 0798087). Isolierter Pilot mit 264.839.809 Byte Projekt-JSON, 30 unterschiedlichen PNGs und 10.000 Linien: 14 Sicherheits-/Rundlaufprüfungen sowie drei isolierte Vollvergleiche und drei Abbrüche bestanden. Zweite Revision ohne Bildwrites/-hashes. Isolierter Lesemedian 4.115 ms, längste Service-Task 154 ms. 888 Tests, Typechecks und Build bestanden; Lint 0 Fehler/6 bekannte Warnungen. [Messung und Grenzen](docs/performance/ASSET_RECOVERY_PILOT.md). Produktionslimit weiterhin 32 MiB; R26-01/02, K02/03, RC07 teilweise offen.

**Asset-Handles im Recovery-Abschluss wiederverwendet (12.10.2026, bench/recovery-asset-handles):** PR264 nach grüner CI/Freigabe zusammengeführt (main c85d2d3). Bestehende unveränderliche Handles pro logischer Asset-ID in kooperativen Abschnitten vorbereitet; Payloadschema/Header/Hash und vollständige Modellprüfung erhalten. Identisches 100-MiB-Profil: Schlussprüfung 347–391 → 43–61 ms; längste Service-Task 390 → 137 ms, Gesamtmedian 1.585 ms. Drei vollständige Vergleiche, drei Abbrüche und 15 Sicherheitsfälle bestanden. 888 Tests, Typechecks/Build grün; Lint 0 Fehler/6 bekannte Warnungen. [Nachweis](docs/performance/ASSET_RECOVERY_PILOT.md). Keine Produktions-/Format-/Limitänderung; R26-01/02, K02/03, RC07 weiter teilweise offen.

**Kooperative Recovery-Prüfung erprobt (12.10.2026, bench/cooperative-recovery):** PR263 nach grüner CI/Freigabe zusammengeführt (main 10f61f9). Diagnose-Service gibt zwischen geprüften Assets und vor Ergebnisrückgabe an den Browser ab; optionales AbortSignal liefert bei Abbruch kein Modell. Identisches 100-MiB-Profil: längste Service-Task 1.477 → 390 ms, Median-Gesamtzeit 1.679 ms. Modellvalidierung weiterhin synchron 347–391 ms; Assetabschnitte 73–98 ms. Drei vollständige Vergleiche, drei gezielte Signalabbrüche und 15 Sicherheitsregressionen bestanden. 885 Tests, Typechecks/Build bestanden, Lint 0 Fehler/6 bekannte Warnungen. [Nachweis](docs/performance/ASSET_RECOVERY_PILOT.md). Keine Produkt-UI-/Worker-/Limitänderung; R26-01/02, K02/03, RC07 teilweise offen.

**Service-/Diagnosekosten getrennt (12.10.2026, bench/recovery-read-isolation):** PR262 nach grüner CI/Freigabe zusammengeführt (main 7ddb5aa). Frische reine Leseseite für vorhandene 100-MiB-Fixture, ohne monolithische Kontrollhülle. Drei vollständige Modell-/Payload-/Revisionsvergleiche bestanden; 15 Fixture-/Fehlerprüfungen erneut grün. Service-Median 1.645 ms; eigene Service-Tasks bis 1.477 ms, zusätzliche Vergleichsaufgaben separat ca. 420–444 ms. Heap-Stichproben nach Service 388–423 MiB, nach Vergleich bis 608 MiB; kein echter Peak/Prozess-RAM. 884 Tests, beide Typechecks, Build bestanden; Lint 0 Fehler/6 bekannte Warnungen. [Messvertrag/Rohdaten](docs/performance/ASSET_RECOVERY_PILOT.md). Befund rechtfertigt begrenztes kooperatives Scheduling im Piloten; Produktionslimit und Format unverändert. R26-01/02, K02/03, RC07 weiter teilweise offen.

**100-MiB-Recoveryprofil bestanden (12.10.2026, bench/asset-recovery-100):** PR261 nach grüner CI/Freigabe zusammengeführt (main b6a51a3). Isolierter Browserpilot mit 101,96 MiB Projekt-JSON, zwölf unterschiedlichen PNGs und 10.000 Linien: 15 Prüfungen bestanden; zweiter Stand weiterhin ohne neue Bildhashes/-writes. Vollständiger Service-Lesemedian 1.573 ms. Gesamtharness: längste Task 1.880 ms, größter Heap-Stichprobenwert 2,08 GiB einschließlich Kontroll-/Prüfkopien; keine isolierte Produktions-RAM-Aussage. 884 Tests, Typechecks und Build grün, Lint 0 Fehler/6 bekannte Warnungen. [Nachweis und Grenzen](docs/performance/ASSET_RECOVERY_PILOT.md). Produktionslimit bleibt 32 MiB; R26-01/02, K02/03, RC07 weiterhin teilweise offen.

**Asset-Recovery-Lesepfad beschleunigt (12.10.2026, bench/asset-recovery-read):** PR260 nach grüner CI/Freigabe zusammengeführt (main 224099c). Im isolierten Piloten vorhandenen `binaryBytes`-Baustein wiederverwendet; vollständige Schema-/Header-/Hash-/Modellprüfung erhalten. 50-MiB-Browserprofil, drei A/B-Paare: Service-Median 3.865 → 707 ms, Byte-Dekodierung 3.284 → 156 ms. Alle 18 Browserprüfungen und 884 Node-Tests bestanden; Typechecks/Build grün, Lint 0 Fehler/6 bekannte Warnungen. [Phasen und Rohdaten](docs/performance/ASSET_RECOVERY_PILOT.md). Keine Produktionsmigration oder weitere Limitänderung; R26-01/02, K02/03, RC07 bleiben teilweise offen.

**Atomare Asset-Recovery erprobt (12.10.2026, bench/asset-recovery-store):** PR #259 nach grüner CI und ausdrücklicher Freigabe zusammengeführt (main e054647). Isolierter IndexedDB-Pilot auf Port 8084: sechs unterschiedliche PNGs plus 10.000 Linien, 51,75 MiB Projekt-JSON. Unveränderliche Payloads einmalig; current/previous-Manifeste mit CAS atomar veröffentlicht. Zweiter Stand schreibt 0 Bildbytes und hasht keine unveränderten Bilder neu; 3,1 MiB Manifest statt 104,1 MiB monolithischer Hülle. Zwölf Browserprüfungen einschließlich Rundlauf, Vorgänger, Konflikt, Transaktionsabbruch und beschädigter/fehlender Assets bestanden; 883 automatisierte Tests. Wiederherstellung mit vollständiger Prüfung noch ca. 4,2 s; keine Produktionsübernahme oder weitere Limitfreigabe. [Messvertrag und Rohdaten](docs/performance/ASSET_RECOVERY_PILOT.md). R26-01/02, K02/03, RC07 bleiben teilweise offen; Folgeauftrag nur §9.

**Größere Kapazitätsstufen untersucht (12.10.2026, bench/large-asset-capacity):** PR #258 nach grüner CI und ausdrücklicher Freigabe zusammengeführt (main 53db718). Isolierter Node-Vergleich des vorhandenen K02-Prototyps mit hypothetisch zugelassenem Inline-JSON bei 50/100/250 MiB Nutzlast, jeweils 10.000 Linien und unterschiedlichen echten PNG-Inhalten. Produktionslimit bleibt 32 MiB. Diagnose-Snapshots bei 1/10/50/100, vollständiger Hash-Rundlauf und Recovery-Hüllenvergleich; Zeit-/Heapgrenzen und Abbruch pro Profil. Sechs finale Läufe/24 explizite Checks abgeschlossen; 880 Tests, Typechecks, Build und Lint (0 Fehler/6 bekannte Warnungen) bestanden. Kein produktiver >32-MiB-Commit-/Browser-/IndexedDB-Nachweis. [Methodik, Rohdaten und Ergebnisse](docs/performance/LARGE_ASSET_CAPACITY.md). Befund: kleines Manifest spart serialisierte Arbeitsmenge, der bestehende Split-Prototyp prüft/hasht jedoch erneut und schreibt weiterhin ganze JSON-Pakete. Unveränderte Übernahme nicht empfohlen. Nächster Pilot soll unveränderliche Payloads einmal speichern und aktuelle/vorherige Recovery-Manifeste atomar veröffentlichen; kein Rendererwechsel und keine weitere pauschale Limitanhebung.

**Kapazitätserweiterung statt Warnpilot (12.10.2026, Nutzerkorrektur / PR #258):** Der 80-%-Warnauftrag ist zurückgestellt. Leitfadenabgleich: 200–300 MB beschreibt bisherige Archicad-Erfahrung (Masterplan §4 und DEVELOPMENT_ALIGNMENT_2026-10-08), keine äquivalente NOVIKOV-Dateigröße. Ziel bleibt die Unterstützung großer realer Projekte. Erster begrenzter Schritt: gemeinsames Gesamtprojektlimit von 10 auf 32 MiB erweitert; Einzelbildquelle 10 MiB, Base64-Storage 10 MiB Zeichen und 16 MP bleiben unabhängig. Kein Formatwechsel, bestehende Migration/Validierung und atomare History-/Recovery-Ablehnung bleiben erhalten. 32 MiB ist eine technische Zwischenstufe, kein finales Produktziel. 880 Tests bestanden; beide Typechecks, Build und Lint (0 Fehler/6 bestehende Warnungen) geprüft. Browser: 28.847.244-Byte-Projekt (27,51 MiB) mit drei Referenzen geladen, Wand geändert, Undo/Redo, Download, IndexedDB-Snapshot, Neuladen und Wiederaufnahme; wiederaufgenommener Export JSON-identisch zum gespeicherten Stand. Grenzen: identische Bildinhalte unter drei IDs, keine GPU-/RAM-/Langhistory- oder 200–300-MB-Freigabe. Siehe RECOVERY_CAPACITY.md.

**Projekt-/Assetbudget abgeglichen (12.10.2026, docs/project-capacity-budget):** PR #257 nach erfolgreicher CI/Freigabe zusammengeführt (main f4bba64). Bestehende Grenzen für Projekt-UTF-8, Bildquelle/Base64/Pixel, URL-Cache, History und Recovery mit Code abgeglichen. Sie sind unterschiedliche Budgets: 10 MiB Projektdatei sind weder RAM-Budget noch Gesamt-Recoveryquota; PNG-Normalisierung kann kleine JPEG-Quellen vergrößern. Historische und neuere Messphasen getrennt. [Konsolidierter Nachweis und Warnvorschlag](docs/performance/RECOVERY_CAPACITY.md): zunächst nicht blockierende Dateireserve-Warnung ab vorgeschlagenen 80 %, ohne Limit-/Formatänderung. Kosten- und Kontextvertrag sowie Abnahme festgelegt; Referenzhardware/Gesamtpixel/RAM und Linked-Asset-Vertrag bleiben offen. Reiner Dokumentationsauftrag, keine neuen Produktfunktionen oder Laufzeitmessungen. 49 bestehende Datei-/Recovery-/Bild-/Asset-Eingangs-/Historytests erneut bestanden; Byteberechnungen und git diff --check geprüft. Kein neuer Build/Browserlauf für diese reine Dokumentationsänderung.

**Startangebot-Abnahme (12.10.2026, test/recovery-startup-lifecycle):** PR #256 mit erfolgreicher CI und ausdrücklicher Freigabe zusammengeführt (main bc852a3). Frischer Browserlauf auf isoliertem Test-Origin 8082, ohne Quelltextänderung/Hot-Reload während der Prüfung: Startangebot vorhanden; „Stände auswählen“ und „Weiterarbeiten“ blenden es aus. Recovery-Abbruch verändert das Modell nicht; bestätigte Recovery lädt den gespeicherten 4-m-Stand samt Bildreferenz ohne Resthinweis. Reguläres Dateiladen: Abbruch erhält Startangebot und 3-m-Ausgangsmodell ohne Undo-Eintrag; Bestätigung blendet das Angebot aus. Gleiche Projekt-ID project-1 ebenfalls geprüft: Laden, Undo und Redo ändern die Bildreferenz wie erwartet, ohne erneutes Startangebot. Keine Konsolenwarnungen/-fehler. 878 Tests bestanden, einschließlich bestehender verzögerter Offer-/Kontext-/Same-ID-Prüfungen. Produktionscode unverändert; früherer Resthinweis nicht reproduziert, Hot-Reload als Ursache nicht bewiesen. Lokaler Screenshot outputs/recovery-startup-lifecycle.png. Keine Snapshotlöschung und keine Änderung der Nutzer-Recovery auf 8080.

Bewertung aus 99 Repository-Dokumenten, Schema-/Modell-/History-/Kontextcode und vorhandenen Testpfaden zum genannten Commit. Keine vollständige Laufzeitprüfung in diesem Konsolidierungsauftrag. Letzter dokumentierter Code-Nachweis: 796 Tests, Typprüfung einschließlich Benchmarks und Build erfolgreich, Lint 0 Fehler/6 bekannte Warnungen; Quelle Kopf des bisherigen Entwicklungsplans. Diese Zahlen sind keine hier neu ausgeführten Tests.

| Bereich | In main vorhanden | Grenze/offen |
| --- | --- | --- |
| Stack | TypeScript, React/TSX, Vite; SVG-Plan, WebGL-3D, Zod-Schema; package.json und bun.lock | Kein ausgewähltes Desktop-Framework, kein garantiertes Windows/macOS-Installationspaket |
| Fachmodell | Schema 16: ein Geschoss, Wände/Fenster, Linien/Polylinien, Schraffuren, PNG/JPEG-Referenzen, Muster/Stifte/Arbeitsansicht | Keine freie Geschossanlage, Räume, Türen, Decken, Dächer, Stützen/Treppen |
| Präzision/Bearbeitung | Gemeinsamer Fang/Hover/Guides, numerische Eingabe, Shift-Richtung, Direct Edit und Auswahlbewegung, Wandketten | Kein kompletter allgemeiner Solid-/Boolean-Kernel; nicht jede Vorschau lokal vorbereitet |
| Wandanschlüsse | Persistente Ecken und begrenzte T-Verbindungen, Öffnungen, gemeinsamer Plan/3D/IFC-Ableitungspfad | Unterschiedliche Querschnitte und allgemeine Anschlussnetze offen; Regeln je Topologie beachten |
| 3D | Auswahlumrandung für Wände, sichtbare Fußpunkte, z=0-Bearbeitung vorhandener Wandaktionen, gemeinsame Projektion | Keine allgemeine freie XYZ-Arbeitsebene, First Person, Perspektivwahl oder Live-Schnitt |
| Leistung | Vorbereitete Auswahlbewegung inkl. Nachbarn, ausgewählte Endpunkt-/Zeichen-/Kettenpfade, wiederverwendbare Plananteile, GPU-Kamerabuffer, gemeinsamer Picking-Index | K02/K03/K04/K05/K06/K08 nicht insgesamt abgeschlossen; volle Commit-/Dateiprüfung und restliche Consumer |
| Ebenen/UI | Ebenenzuordnung/Filter, getrennte Sichtbarkeitshistory, gemeinsame nicht-modale Fenster, Auswahl-/Werkzeugeigenschaften | Allgemeine Capabilities für weitere Typen/Settings-Struktur noch wachsen lassen |
| Zeichnen/Bibliotheken | 2D-Linien/Polylinien, vier Schraffurkonturmodi, Creator, globale lokale Bibliotheken, Inventar, portable Muster/Stifte, Musterwinkel und Modell-/Papiergrößen | Upload/PAT-Import offen; globale Bibliothek ist browserprofil-/originlokal, keine Gerätecloud |
| Live-Messung | Temporäre 2D-Strecken-, Flächen- und Winkelmessung | Kein Raum-/WoFlV-Modell und keine gespeicherten assoziativen Maßketten |
| Maßstab | Selector/Persistenz 1:100 mit Presets/individuell, Modell-/Papiermuster Schema16, gemeinsamer validierter Arbeitskontext | Text/Bemaßung als spätere Consumer; Druck/PDF-Maßhaltigkeit noch kein Nachweis |
| Dateien/Austausch | JSON Save/Open mit strikten Migrationen und 100 Snapshot-History-Schritten; PNG/JPEG-Import/Kalibrierung; IFC-Wände/Fenster-Export | 10 MiB Gesamtlimit; Bilder inline Base64; keine Recovery-/Autosaveproduktion, PDF/DXF/DWG/IFC-Import |
| AI/Sprache | Begrenzte deutsche Befehle, Auswahl-/Revisionsbindung, Vorschau/Annahme und Sprachadapter vorhandener Aktionen | Keine generative AI/B-Plan-Engine, kein gesamter Fähigkeitskatalog; reale Transkriptqualität gesondert prüfen |
| Produkt/Release | Anforderungen in diesen zwei Dateien aufgenommen | Keine Lizenzverwaltung, fertige SBOM, signierte Distribution, Homepage oder geprüfte Public-Beta-Freigabe |

**PR238 abgeschlossen:** am 10.10.2026 normal in main zusammengeführt (`927dfcf`, geprüfter Head `54d3e98`, GitHub Checks erfolgreich). Gespeicherte bearbeitbare Grundriss-Abbilder, Navigator/Ordner, eigene Maßstäbe/Filter und Ausgangszoom, Schema20. Das gesamte Modell bleibt ohne Clip erreichbar; Linien und Schraffuren aus Abbildern sind gemeinsame Geschosszeichnungen. V19-Dateien werden ohne Geometrieverlust migriert. 808 Tests, Typprüfung, Build und Browserprüfung bestanden.

**Begrenzter Abschluss Abbildverwaltung (`feat/document-context-management`):** Rechtsklick bietet Umbenennen, Ordnerzuordnung einschließlich „Ohne Ordner“ und Abbild löschen. Gemeinsame validierte `DocumentAction` mit stabilen IDs und Projekt-Undo; keine Modellkopie oder separate History. 809 Tests, beide Typechecks und Build bestanden; Lint ohne Fehler (6 bestehende Warnungen). Browser: Ordnerwechsel/Undo/Redo, aktives Abbild löschen und per Undo wiederherstellen, Modell unverändert; keine Konsolenfehler. Beleg: `outputs/abbild-context-menu.png` im lokalen Aufgabenordner. Ordnerlöschung bleibt bis zur Nutzerentscheidung zum nichtleeren Ordner offen.

**Nutzerergänzung Abbildmenü (10.10.2026, `feat/document-settings-menu`):** PR240 nach Freigabe zusammengeführt. Statt automatisch persistierte Leerordner anzulegen ist die angebotene Alternative umgesetzt: Rechtsklick im leeren Verzeichnis sowie auf Einträgen bietet „Neues Abbild“ und „Neuer Ordner“. Abbilder bieten zusätzlich Einstellungen (Name, Maßstab, Ordner) und Löschen. Einstellungen sind eine atomare validierte Application-Aktion mit einem Projekt-Undo. Leere Ordner sind löschbar, nichtleere bis zur offenen Nutzerentscheidung geschützt. Bestehender Startzoom und Ebenenfilter bleiben erhalten; Ebenensteuerung weiterhin über den Ebenenumschalter. 811 Tests, Typecheck, Build, fokussiertes Lint und Browserabnahme erfolgreich; Browserbeleg `outputs/abbild-settings-menu.png` im lokalen Aufgabenordner.  Drag-and-drop-Ergänzung in PR241: Abbilder auf Ordner ziehen; Ziel wird hervorgehoben und nach Ablage geöffnet. Dieselbe assign-folder-Aktion mit ursprünglichem Projektkontext, ein Undo-Schritt; Abbruch und gleicher Zielordner erzeugen keine Änderung. Browsernachweis Quelle → Ziel → Undo → Quelle → Redo erfolgreich. 14 fokussierte Abbildtests, Typecheck, Lint und Build bestanden. Danach bleibt der einzelne P0-Auftrag aus §9 maßgeblich.

**Einheitliche Einstellungsansicht (Nutzerauftrag 10.10.2026, PR241):** Gemeinsamer UI-Baustein `SettingsSections` innerhalb des bestehenden verschiebbaren, nichtmodalen `FloatingPanel`. Linke vertikale Tabspalte, rechts scrollbar, kompakte Buttons/Schrift. Zunächst nur Abbild-Erstellung/Einstellungen: Allgemein (Name, Maßstab, Ordner, Startzoom), Ebenensichtbarkeit (aktive Ebenen oben, alle vorhandenen mit Status darunter), Tab2–5 als explizite Platzhalter. Ebenenstatus gehört zum adressierten Abbild; Umschalter bleibt zuständig für Änderungen und History. Kein globaler Umbau bestehender Werkzeuge/Systemfenster. Browser: Tabwechsel erhält Entwurf, Speichern funktioniert, eigener Filter mit null aktiven Ebenen korrekt; keine Konsolenfehler. Typecheck, fokussiertes Lint, Build und 14 Abbildtests geprüft. Künftige Einstellungsfenster verwenden diese Struktur; Fachinhalte und Aktionen bleiben getrennt.



Abbildaufnahme-Präzisierung (10.10.2026, PR241): Die Anwendung ergänzt beim Start/Öffnen einen leeren Ordner „Abbilder“, wenn keine Ordner existieren; strikte Altdateiparser bleiben unverändert, IDs kollisionsfrei. Hinzufügen startet ausschließlich Abbildanlage; Ordneranlage bleibt eigener Rechtsklickbefehl. Zusammenfassung: Name, Maßstab, vorausgewählter vorhandener Ordner und zum Start erfasste aktive Ebenen; keine Typauswahl/Zoomanzeige. Erstellung erst beim Bestätigen, unveränderte Snapshot-Prüfung schützt vor veraltetem Entwurf. Canvas erhält eine 700-ms-Hervorhebung (reduced-motion berücksichtigt). Browser bestätigt Standardordner, Zusammenfassung und Erstellen im Zielordner. 812 Tests, Typecheck, fokussiertes Lint und Build bestanden. Bestehende Projekte werden beim Öffnen nur um den fehlenden Ordner ergänzt, vorhandene Ordner bleiben erhalten.

Nutzerkorrektur: Standardordner heißt **Abbildsammlung** und bleibt dauerhaft vorhanden, auch neben eigenen Ordnern. Löschen/Umbenennen dieses Ordners gesperrt; bisher automatisch angelegter Ordner Abbilder wird unter Beibehaltung seiner ID umbenannt.

Nutzerergänzung PR241: Neuer Ordner wird per Kontextmenü sofort angelegt, danach Name fokussiert/vollständig markiert. Abbildanlage erklärt Modellbindung, bietet Stammdaten und eine scrollbar durchsuchbare Ebenentabelle mit grauen EyeOff-/grünen Eye-Symbolen. Klick ändert nur den lokalen Erstellungsentwurf; create-DocumentAction validiert und speichert den gewählten Filter atomar bei Erstellung, Hauptmodellfilter bleibt unverändert. Keine separate History für den Entwurf. 17 Abbildtests, Typecheck und Build bestanden; Browser: Textauswahl 0–12, Umbenennen, Suche und ausgeblendete Wand im erstellten Abbild geprüft. Letzter Nutzersatz „Darunter: die folgenden Ebenen können“ unvollständig, keine zusätzlichen Inhalte erfunden.

Abbildfenster-Ergänzung PR241: Erstellung und Einstellungen bis 880 px hoch, durch Viewport begrenzt. Keine eigene max-height-Scrollbox der Ebenentabelle; Scrollen nur bei tatsächlichem Platzmangel im Fenster. Bestehende Abbilder verwenden denselben DocumentLayerDraft-Baustein mit Beschreibung, Tabelle, Augen und Suche. Bestehende Filter ändern sich direkt über gemeinsame visibility/set-Aktion mit expliziter documentId und vorhandener kontextgebundener Ebenen-History. Kein Modell-Undo für Sichtbarkeit. Browsernachweis: 14 Ebenen ohne Scrollen bei verfügbarem Platz, Umschalten, anschließend Name speichern, Abbild öffnen und Ebenen-Undo stellt Wand wieder her. 17 Abbildtests, Typecheck, Lint und Build bestanden.

Canvas-Hinweis PR241 – korrigierte Nutzerregel (10.10.2026): Neue Ebenen bleiben in allen bestehenden Abbildern zunächst ausgeblendet. Erst ein bestätigtes neues Element auf einer ausgeblendeten Ebene im aktiven Abbild aktiviert diese dort und meldet oben rechts Abbild-/Ebenenname samt Verweis auf die Einstellungen. Bloße Ebenenanlage, Werkzeugauswahl, Vorschau, Laden und Undo/Redo lösen keinen Hinweis aus. Gemeinsame Application-Auswertung neuer Element-IDs am Commit; keine duplizierte Aktivierungslogik pro Werkzeug. Andere Abbilder und BIM-Sichtbarkeit bleiben unverändert. Tool-Cleanup erhält den Hinweis, dieser schließt nach 10 Sekunden oder manuell. Nachweis: 815 Tests einschließlich zweier unabhängiger Abbilder, Modell-Undo und Cleanup; Typecheck, fokussiertes Lint und Build bestanden. Browser: neue Ebene ohne Meldung und unsichtbar, Linie darauf platziert → Ebene sichtbar plus korrekter Hinweis. Beleg: outputs/abbild-drawn-layer-notice.png. Nächster begrenzter Auftrag bleibt P0-Persistenz gemäß §9.

**P0-Persistenzpilot (10.10.2026, fix/project-file-failure-contract):** PR241 nach ausdrücklicher Freigabe und erfolgreicher CI zusammengeführt (main 43092d1). Gemeinsame Application-Funktionen prepareProjectOpen/requestProjectDownload trennen Dateivorbereitung und bestätigte Modellübernahme von Browser-I/O. 10-MiB-Grenze vor Lesen sowie anhand tatsächlicher UTF-8-Daten; validierter/migrierter Kandidat einschließlich Standardordner wird erneut auf Dateigröße geprüft. Download meldet ausschließlich Anforderung, keine bestätigte Datenträgerspeicherung; Adapter räumt URL/Anker auch bei Fehlern auf. Fehlgeschlagene load-project-Aktion erhält Modell-, Undo-/Redo- und Ebenen-Historien. UI bestätigt Laden/ändert Auswahl erst nach Application-Bestätigung. 822 Tests (7 neue Fehler-/Abbruch-/Erfolgsfälle), Typecheck, vollständiges Lint (0 Fehler, 6 bestehende Warnungen) und Build bestanden. Browser: Download, beschädigte Datei, gültige Datei mit Abbruch und bestätigtes Laden geprüft. Lokaler Beleg outputs/persistence-download-status.png. Grenze: Browser kann späteren Downloadabbruch oder Plattenfehler nicht rückmelden; noch keine atomare Datenträgerablage, automatische Sicherung oder Crash-Recovery.
**P0-Recovery-Pilot (10.10.2026, feat/local-recovery-snapshot):** PR242 mit grüner CI nach ausdrücklicher Freigabe zusammengeführt. File → Lokale Wiederherstellung bietet manuelles Snapshot-Erstellen und Prüfen. Application-Service validiert/serialisiert das gemeinsame Projekt, liest Kandidaten über bestehende Migration/Dateigrenzen und erhält einen gültigen Vorgänger. Austauschbarer RecoveryStorage-Port mit atomarem Compare-and-replace; Browseradapter verwendet eine IndexedDB-Transaktion, Erfolg erst nach oncomplete. Veraltete konkurrierende Schreibversuche werden abgewiesen. Ein gültiger Vorgänger kann bei beschädigtem aktuellem Projektinhalt angeboten werden; unlesbare Gesamtdatensätze werden nicht überschrieben. Wiederaufnahme führt über die bestehende Ladebestätigung und ein Modell-Undo, Abbruch verändert nichts. Shared FloatingPanel; keine neue Modellkopie im Renderer.

Nachweis: 829 Tests bestanden, darunter 7 Recoverytests (Quota/Abbruch am simulierten Speicherport, ungültiges Modell, Vorgänger, konkurrierende Schreiber, Vorbereitung/Undo); Typecheck, vollständiges Lint (0 Fehler, 6 bestehende Warnungen) und Build bestanden. Echter Browser: 4-m-Wand gesichert, Neuladen auf 3-m-Ausgangsmodell, Snapshot wieder gelesen, Wiederaufnahme abgebrochen/anschließend bestätigt, Undo/Redo geprüft. Beleg outputs/recovery-snapshot.png; keine Browserkonsolenfehler. Begrenzung: ein manueller Slot plus Vorgänger pro Browserprofil/Origin, keine automatische Sicherung, keine externe Datenträgergarantie. Browserdaten können gelöscht/verdrängt werden. Reale IndexedDB-Fehler-/Abbruchinjektion bleibt der nächste begrenzte Nachweis; bisherige Fehlerfälle sind Portsimulationen, keine Stromausfalltests.
**P0-Recovery-Browserfehlernachweis (10.10.2026, test/recovery-browser-transactions):** PR243 nach ausdrücklicher Freigabe und grüner CI zusammengeführt. Adapter als createRecoveryStorage mit injizierbarem Verbindungsöffner extrahiert; Produktionsdatenbank und Portvertrag unverändert. benchmarks/recovery.html nutzt eine eindeutige novikov-recovery-test-UUID-Datenbank und denselben Adapter. Ein ausschließlich im Diagnosecode verwendeter Proxy bricht die echte native Transaktion nach erfolgreichem put und vor Commit ab. Danach ist der vorherige Datensatz bytegleich und mit readRecovery validierbar. Zwei echte Browser-Tabs schreiben auf dieselbe erwartete Version: genau ein Gewinner, der Verlierer erhält den Konfliktfehler; erneuter veralteter Schreibversuch lässt Gewinner bytegleich erhalten. Beschädigter aktueller JSON-Inhalt bietet den gültigen Vorgänger; Lesen/Abbruch verändert Arbeitsmodell und History nicht. Diagnose löscht ausschließlich ihre eigene Testdatenbank.

Nachweis: 3/3 native Browserprüfungen bestanden (lokaler Screenshot outputs/recovery-browser-transactions.png), keine Konsolenfehler. 829 Tests, Application- und gesamter Benchmark-Typecheck, vollständiges Lint (0 Fehler/6 bestehende Warnungen) und Produktionsbuild bestanden. Reproduktion: Benchmark-Vite auf 127.0.0.1:8081 starten, /benchmarks/recovery.html öffnen, Link zum zweiten Tab öffnen, Prüfung starten. Das ist ein lokaler Browsernachweis, keine automatisierte CI-Browserausführung und kein Nachweis für echte Quota-Erschöpfung, Eviction oder Stromausfall. Die 7 bisherigen Recovery-Porttests bleiben erhalten.
**Recovery-Startangebot (10.10.2026, feat/recovery-startup-offer):** PR244 nach ausdrücklicher Freigabe und grüner CI zusammengeführt. Read-only Application-Abfrage startRecoveryOffer liefert validierten Kandidaten, leeren oder nicht verfügbaren Speicherzustand; Dispose unterdrückt verspätete Ergebnisse und Fehler. RecoveryStartupNotice zeigt dezent Projekt-ID/Zeitpunkt sowie Weiterarbeiten/Wiederaufnahme vorbereiten. Die Vorbereitung öffnet die bestehende Ladebestätigung; keine automatische Modellübernahme oder Speicheränderung. Projektwechsel (auch gleiche ID per neuer Ladeaktion) und Unmount verwerfen den Startkontext. Fehlender Speicher erzeugt keinen Hinweis, Lesefehler blockieren die Bedienung nicht.

Nachweis: 833 Tests, darunter vier neue Tests für Angebot, fehlenden/beschädigten/gesperrten Speicher, verspäteten Erfolg und verspäteten Fehler nach Dispose; Typecheck, vollständiges Lint (0 Fehler/6 bestehende Warnungen) und Build bestanden. Browser: Startangebot mit Zeitpunkt, Weiterarbeiten bei unverändertem Modell/Undo, erneuter Start mit weiter vorhandenem Snapshot, Vorbereitung/Abbruch, bestätigtes Laden der 4-m-Wand statt 3-m-Ausgangsmodell geprüft; keine Konsolenfehler. Beleg outputs/recovery-startup.png. Keine automatische Sicherung; weiterhin ein manueller lokaler Slot plus Vorgänger. Ablehnen blendet nur das Angebot für diese Workspace-Sitzung aus, löscht keinen Snapshot.
**Projektbezogene Recovery (10.10.2026, feat/project-recovery-catalog):** PR245 nach ausdrücklicher Freigabe zusammengeführt (4552be1). Application-Port `RecoveryCatalog` trennt Stände nach vorhandener Projekt-ID. IndexedDB v2 veröffentlicht Projektpayload und kleinen Listenindex gemeinsam in einer Transaktion; je Projekt bleiben aktueller Stand und gültiger Vorgänger. Migration kopiert den alten manuellen Slot, einschließlich Vorgänger eines anderen Projekts, ohne die Originalbytes zu löschen oder neuere Projektstände zu überschreiben. Unterbrochene Migration ist wiederholbar; auch bei Quota während der Kopie bleiben Legacy-Stände lesbar. Das Startangebot bleibt lesend und öffnet die Auswahl, die vollständige Validierung erfolgt vor der bestehenden Ladebestätigung. Kein automatischer Modellwechsel.

Nachweis: 840 Tests einschließlich sieben neuer Katalogtests (zwei Projekte, Migration/Retry, beschädigte Daten, Konkurrenz, Quota/Abbruch, unverändertes Arbeitsmodell bei Vorbereitung); App-/Benchmark-Typecheck, Build und Lint (0 Fehler/6 bestehende Warnungen). Native Browserdiagnose 5/5: Datenbank-v1-Upgrade, echter Transaktionsabbruch, zwei Tabs mit genau einem Gewinner, konsistenter Listenindex und gültiger Vorgänger. UI: Legacy-Projekt mit 4-m-Wand und synthetisches Zweitprojekt separat gelistet; Vorbereitung/Abbruch erhält 3-m-Ausgangsmodell und Undo, bestätigte Wiederaufnahme lädt 4-m-Stand. Keine Konsolenfehler. Belege: outputs/recovery-catalog-ui.png und outputs/recovery-catalog-diagnostic.png.

Grenzen: Browser-/Adressbindung, manuelle Sicherung, keine Löschung/Aufbewahrungsautomatik, keine Stromausfall-/Eviction-Garantie. Dateien mit gleicher Projekt-ID teilen absichtlich einen Wiederherstellungsplatz; keine neue Kopier-/Projektidentitätsregel erfunden. Die kleine Liste benötigt nicht sämtliche Projektpayloads; der höchstens zwei Stände umfassende Legacy-Slot wird weiterhin zur Migration/Kompatibilität geprüft. Indexeinträge sind zunächst Metadaten, kein Vollvalidierungsnachweis. Kein Betriebssystem- oder Plattformwechsel.

**Lokaler Sicherungsstatus (10.10.2026, feat/local-recovery-status):** PR246 nach ausdrücklicher Freigabe und erfolgreicher CI zusammengeführt. `createRecoveryStatusTracker` in Application vergleicht den vollständig übernommenen Projektinhalt mit dem validierten lokalen Wiederherstellungsstand. Die Statusleiste unterscheidet Prüfung, fehlenden Stand, aktuellen Snapshot, Änderungen seit Snapshot und unbekannten Status bei Speicherfehlern; Klick öffnet die bestehende Wiederherstellung. Datum/Browsergrenze stehen im Tooltip. Modelländerungen, gespeicherte Ebenensichtbarkeit und Maßstab zählen; Undo/Redo können wieder auf den gesicherten Inhalt führen. Kein Vergleich auf Pointer-Vorschauen, keine zusätzliche Serialisierung oder Vollvalidierung pro Mausbewegung. Vergleich erfolgt bei geändertem übernommenem Projektbezug; identische Referenz wird übersprungen.

IndexedDB bleibt alleinige Speicherquelle. Erst nach erfolgreichem Commit sendet der Browseradapter einen lokalen bzw. BroadcastChannel-Hinweis, der erneutes Lesen auslöst; Fokus-/Sichtbarkeitswechsel prüfen ebenfalls nach. Hinweise enthalten keine Projektdaten. Generation und Lade-Kontext verwerfen verspätete Antworten, auch beim erneuten Laden derselben Projekt-ID. Ein gespeicherter älterer Zustand macht inzwischen weiterbearbeiteten Inhalt nicht irrtümlich aktuell. Downloadanforderungen bleiben ohne Datenträger-Erfolgsbehauptung.

Nachweis: 848 Tests, darunter acht Statusfälle für Laden/Projektwechsel, Undo/Redo, Scale/Sichtbarkeit, Fehler/Quota, verzögerte Transaktion, verspätete Antworten/Dispose und fremde Snapshotänderung. App-/Benchmark-Typecheck, Build und Lint (0 Fehler/6 bestehende Warnungen) bestanden. Browser: vorhandenen Snapshot geladen, Wand geändert, Undo zum aktuellen Snapshot, Redo/erneute Sicherung; zweiter realer Tab erkennt fremde erfolgreiche Sicherung als Abweichung; Maßstabsänderung macht Status geändert. Keine Konsolenfehler; outputs/recovery-status-ui.png. Keine Autosicherung, keine neue Schließen-Warnung, keine Garantie gegen Browserdatenlöschung. Bei fehlendem BroadcastChannel erfolgt Fremdtab-Abgleich spätestens bei erneutem Fokus; Betriebssystem-/Stromausfallgarantien bleiben offen.

**Optionaler Autosicherungs-Pilot (10.10.2026, feat/optional-local-autosave):** PR247 nach ausdrücklicher Freigabe und grüner CI zusammengeführt. `createAutosaveController` bündelt manuelle/automatische Snapshot-Schreibvorgänge seriell über den vorhandenen validierten Recovery-Port. Expliziter Schalter in der lokalen Wiederherstellung, standardmäßig aus, nur für das geöffnete Projekt; Laden/Projektwechsel/Neustart deaktiviert ihn. Nach 2 Sekunden Pause wird nur der letzte übernommene Projektstand gesichert. Identische Inhalte verursachen keinen weiteren Snapshot, Änderungen während einer Speicherung höchstens einen anschließenden gebündelten Vorgang. Undo/Redo und gespeicherte Ansichtseinstellungen zählen, Entwürfe/Pointervorschau bleiben außerhalb.

Die Automatik bindet eine Speicherrevision bei Aktivierung und führt CAS gegen genau diese bzw. die eigene zuletzt geschriebene Revision aus. Dadurch überschreibt sie auch zeitlich versetzte fremde Tab-Schreibvorgänge nicht still. Fehler/Quota/Konflikte pausieren sichtbar ohne automatische Wiederholung; bewusstes Aus-/Einschalten oder manueller Neuversuch erneuert den Kontext. Vor Veröffentlichung wird der Projekt-/Ladekontext geprüft. Eine bereits gestartete atomare Transaktion kann beim Ausschalten noch für ihre ursprüngliche Projekt-ID abschließen. Erfolgsstatus weiterhin ausschließlich nach Commit. Datenformat und automatisches Wiederaufnehmen/Löschen unverändert.

Browserbefund behoben: Der gemeinsame Editing-Reducer bewahrt nun das letzte Lade-Token auch bei normalen Modelländerungen und Undo/Redo, statt es dabei zu verlieren; No-op-Referenzen bleiben erhalten. Sonst hätte die erste Bearbeitung nach Dateiladen fälschlich die Autosicherung ausgeschaltet. Nachweis: 858 Tests einschließlich zehn neuer Tests mit kontrollierter Uhr für Bündelung, Undo/Redo/Scale, Ausschalten/Laden, Quota, zwei Sitzungen, verzögerte Vorbereitung/Transaktion und echten Reducer-Kontext. App-/Benchmark-Typecheck, Build und Lint (0 Fehler/6 bestehende Warnungen) bestanden. Browser: Automatik aktiviert, Wandänderung, echter Fremdtab-Konflikt pausiert ohne Überschreiben, bewusstes Reaktivieren, automatisch gesicherten 8-m-Stand geladen, danach Automatik wieder aus; keine Konsolenfehler. Belege outputs/autosave-ui.png, outputs/autosave-conflict.png.

Grenzen: Browser-/Adressbindung und Verlust bei Browserdatenlöschung bleiben; kein externes Backup oder garantierter finaler Save beim abrupten Schließen. Aktueller Stand plus Vorgänger teilen sich denselben manuellen/automatischen Recovery-Platz; keine unbegrenzte Versionshistorie. Vollvalidierung/Serialisierung bleiben synchrone Arbeit nach der Pause und sind für große Dateien als nächster Einzelauftrag zu messen. Zwei Sekunden sind Pilotverhalten, noch keine globale Benutzereinstellung.

**Recovery-Kapazitätsmessung (10.10.2026, bench/recovery-capacity):** PR248 nach ausdrücklicher Freigabe zusammengeführt. Isolierte Browserdiagnose mit sechs synthetischen Geometrie-/PNG-Profilen bis 9,20 MiB, je erster Lauf plus fünf warme Läufe; 252 Phasenmessungen und 108 Inhaltsvergleiche bestanden. Unveränderte Produktionsservices, eigene temporäre IndexedDB, keine Benutzerprojekte. Messstand 2ceb659 auf Produktionsbasis 9eac205; Chromium 155/Windows, 12 logische Prozessoren laut Browser. Rohdaten und Umfang in [RECOVERY_CAPACITY.md](docs/performance/RECOVERY_CAPACITY.md). Bei 9,20 MiB warmer Median: manuell 1.366 ms, automatisch 734 ms, isolierter Speicheradapter 75 ms; längste beobachtete Tasks 1.302/673 ms. Der alte Snapshot wird vor Schreiben wiederholt geladen/validiert; eine bereits geprüfte Revision bietet einen begrenzten Optimierungsansatz. Kein pauschaler Architekturwechsel.

Nachweis: 860 Tests, App-/Benchmark-Typecheck, Build bestanden; Lint nach Formatkorrektur ohne neue Fehler (sechs bestehende Fast-Refresh-Warnungen). Keine Browserfehler. Erster Lauf ist kein kalter Browserprozess; p95 bei fünf warmen Werten entspricht dem Maximum. Kein UI-/GPU-/Spitzenspeicher-/Langhistory-/Quota-/Stromausfallnachweis und keine generelle Kapazitätsfreigabe. 10-MiB-Grenze unverändert. Nächster Einzelauftrag siehe §9.

**Recovery-Revisionspilot (12.10.2026, perf/recovery-revision-reuse):** PR249 nach ausdrücklicher Freigabe und grüner CI zusammengeführt. Gemeinsamer Application-Writer hält exakt gebundene Speicherbytes und geprüften Vorgänger in einer privaten Sitzung; Fortschreibung ausschließlich nach erfolgreichem CAS-Commit. Neue Inhalte und unbekannte Revisionen weiterhin voll geprüft. Manuelle Aufrufe bei ausgeschalteter Automatik behalten ihre frische Vorbereitung. Kein Format-/UI-/Adapter-/Limitwechsel. Fünf neue Tests vergleichen byteidentische Snapshots mit dem alten vollständigen Pfad und prüfen Fallback, Quota/Abbruch, ungültige Daten, falsche ID, Kontext und konkurrierende Writes. Bestehende Controller-Kontexttests bleiben grün.

Nachweis: 865 Tests, beide Typechecks, Build und Lint (0 Fehler/6 bestehende Warnungen). Browsermessstand 79b864f: sechs unveränderte Profile, 252 Messungen, 108 Inhaltsvergleiche, keine Konsolenfehler. Größtes Bildprofil: Auto-Median 734 → 157 ms, längste Auto-Task 673 → 88 ms; manuell 1.366 → 799 ms. Recovery-Lesen bleibt bei 650 ms. [Vergleich und Grenzen](docs/performance/RECOVERY_CAPACITY.md), Rohdaten recovery-reuse-2026-10-12.json. Unterschiedliche Messtage, keine kontrollierte Hintergrundlast, kein Kaltstart-/allgemeiner Kapazitätsnachweis. Nächster Einzelauftrag §9.

**Einmaliger Asset-Eingang (12.10.2026, perf/single-asset-ingress):** PR250 nach ausdrücklicher Freigabe/grüner CI zusammengeführt. Öffentlicher Dateieingang erstellt vollständig geprüfte eigene Asset-Handles, private Migration verwendet sie über alle Versionen weiter. Keine mehrfachen Base64-Storageprüfungen pro eingehendem Asset; Modellbeziehungen, Größen-/Pixelgrenzen und Ablehnung ungültiger Daten bleiben vollständig geprüft. Vier neue Tests mit Vergleich zum alten Pfad, Version-9-Migration und gefälschten Identitäten. 869 Tests, App-/Benchmark-Typecheck, Build und Lint bestanden (0 Fehler/6 bestehende Warnungen). Messstand bea8688: 252 Messungen/108 Inhaltsvergleiche bestanden, keine Browserfehler. 9,20-MiB-Bildprofil: Dateivorbereitung 570 → 337 ms, Recovery-Lesen 650 → 365 ms (warme Mediane); längste Tasks dort noch 369 ms. [Rohdaten, Vergleich und Grenzen](docs/performance/RECOVERY_CAPACITY.md). Kein Format-/Limitwechsel oder allgemeiner Kapazitätsnachweis.

**Integrationsauftrag (12.10.2026):** Nutzer priorisiert vollständige Zusammenführung offener PRs und Aktualisierung des Lovable-Zweigs Anpassungen_UI. PR251 zusammengeführt. Alter PR124 wird auf den aktuellen main angepasst: Offset-Textadapter nutzt weiterhin die gemeinsame Direct-Edit-Begrenzung; neue Auswahlarten ausdrücklich ausgeschlossen, moderner Auswahlkontext und ein Undo-Schritt getestet. 871 Tests, Build, Typecheck und Lint (0 Fehler/6 bestehende Warnungen). Die begonnene Base64-Optimierung bleibt separat auf perf/canonical-base64-scan und ist noch nicht freigegeben/übernommen. Nach Synchronisierung gilt weiterhin der Einzelauftrag in §9.

**Lovable-Synchronisierung (12.10.2026):** Anpassungen_UI hatte 265 fehlende main-Commits und acht eigene Historieneinträge. Gemeinsame Integration erhält beide Historien sowie die UI-only-Arbeitsregel und den unbekannten Fehler-Typ der Routergrenze. Die separaten TanStack-Versionsanhebungen des alten UI-Zweigs werden nicht übernommen: package.json/bun.lock behalten gemeinsam den geprüften main-Stand; ein Dependency-Upgrade benötigt eigene Prüfung. Keine UI-Gestaltung verworfen. Ziel: main und Anpassungen_UI zeigen denselben integrierten Stand. Künftige Lovable-Arbeit nur Präsentation, Kern-/Action-/Snap-/Datenlogik unverändert; UI-Ergebnisse anschließend per PR nach main prüfen.

**Base64-Prüfpilot (12.10.2026, perf/canonical-base64-scan):** Gemeinsamer Storageprüfer mit privater ASCII-Wertetabelle; Akzeptanz durch erschöpfende Endgruppen-/UTF-16-, Zufalls- und große Differentialtests gegen Vorgänger abgesichert. 876 Tests, Typechecks, Build und Lint (0 Fehler/6 bestehende Warnungen). Browsermessstand 16b09d5: 252 Messungen/108 Inhaltsvergleiche bestanden, keine Browserfehler. 9,20-MiB-Profil: Dateivorbereitung 337 → 93 ms, Recovery-Lesen 365 → 136 ms (warme Mediane). [Rohdaten und Grenzen](docs/performance/RECOVERY_CAPACITY.md). Kein Format-/Limit-/Trustwechsel; noch kein vollständiger Workspace-/GPU-/Speicher-/Kapazitätsnachweis.

**Workspace-Abnahme großer Bildreferenz (12.10.2026, test/large-reference-workspace):** PR253 nach ausdrücklicher Freigabe/grüner CI zusammengeführt (main 625031e). Regulärer CadWorkspace mit realen Datei-/IndexedDB-Adaptern auf isoliertem Port 8082. Deterministisches PNG 1550×1550, Projekt 9.616.625 Bytes (9,17 MiB), eine Wand/ein Fenster/eine Referenz. Datei laden: Vorbereitung/Abbruch erhält Ausgangsmodell und leere History; Bestätigung, Lade-Undo/Redo, Wand 3→4 m, Bearbeitungs-Undo/Redo, Download, lokaler Snapshot, Seitenneuladen und Wiederaufnahme bestanden. Geladener Export exakt gleich Fixture; wiederaufgenommener Export exakt gleich gespeichertem Änderungsstand, Assetbytes unverändert. Keine Browserwarnungen/-fehler. Keine Produktionsänderung.

Restbefund: Long Task bei Ladebestätigung 814 ms, bei Wiederaufnahme 890 ms; Servicezeiten erklären damit nicht den ganzen UI-Pfad. Einzelläufe im Entwicklungsserver, keine kontrollierte A/B-/p95-Messung oder genaue CPU-Zuordnung. Startangebot bleibt nach Wiederaufnahme sichtbar (Bedienhinweis, kein Datenverlust). Reproduktion und Rohdaten in [RECOVERY_CAPACITY.md](docs/performance/RECOVERY_CAPACITY.md). R26-01/02, K02/03 und RC07 bleiben wegen verbleibender Hauptthread-Pausen und offener Kapazitätsgrenzen teilweise offen.

**Ladephasen-Diagnose (12.10.2026, bench/workspace-load-phases):** PR254 mit grüner CI/Freigabe zusammengeführt (main f50c4bf). Zwei isolierte Durchläufe mit je kleiner Kontrollfixture und identischer 9,17-MiB-Datei, je erster Lauf plus fünf warme Wiederholungen. Ausschließlich Vite-Serve-Instrumentierung, keine Produktionsänderung. Dominanter Erstladepfad: checkImageUrl 798 ms im ersten Durchlauf, 570 ms im detaillierten zweiten; darin atob 9,8 ms, Uint8Array.from-Zeichenkonvertierung 559,6 ms, Header 0,1 ms. Modellreducer 53,9 ms einschließlich History 28,4 ms; Renderdatenableitung <0,1 ms. Warme Bild-URL-Abfrage 5–10 ms, weil vorhandener Inhaltscache greift. React-Profilzeiten enthalten diese Funktionszeiten und dürfen nicht dazuaddiert werden. 24 Ladebestätigungen/Referenzanzahlprüfungen bestanden, keine Konsolenfehler. 876 Tests, Benchmark-Typecheck, Build und gezieltes Lint bestanden. [Rohdaten/Methodik/Grenzen](docs/performance/RECOVERY_CAPACITY.md). Keine isolierte GPU-/Browserdekodierungs- oder Commit-Dauermessung, keine kontrollierte A/B-Statistik.

**Bild-Bytekonvertierung (12.10.2026, perf/image-byte-conversion):** PR255 nach ausdrücklicher Freigabe/grüner CI zusammengeführt (350b64c). Gemeinsamer Bild-URL-Pfad kopiert die von atob gelieferten Bytes in ein vorallokiertes Uint8Array. Dekodierung, Header-/Metadatenprüfung und 48-MiB-/8-Einträge-Inhaltscache unverändert. Zwei neue Differentialtests sichern alle Bytewerte, leere/zufällige/große Binärstrings sowie PNG-/JPEG-/Fehlerfälle ab; bestehende Cacheprüfungen weiter grün. 878 Tests, beide Typechecks, Build und Lint (0 Fehler/6 bekannte Warnungen). Browsermessstand 646ad6b: zwölf Ladebestätigungen bestanden, Export JSON-identisch zur ursprünglichen 9,17-MiB-Fixture, keine Browserfehler. Erstlauf Bytekonvertierung 559,6 → 19,0 ms; gesamte Bestätigung bis zwei Frames 774,9 → 201,2 ms; längste Task 754 → 183 ms. Warme Wiederholungen weiter mit Cache, keine zugesagte Beschleunigung aller Pfade. [Rohdaten/Grenzen](docs/performance/RECOVERY_CAPACITY.md). Keine neue Speicher-/Rendererarchitektur oder Kapazitätsfreigabe.

**Dateivorbereitung ohne Vollserialisierung (12.10.2026, perf/project-open-budget):** PR282 nach ausdrücklicher Freigabe und grüner CI zusammengeführt. Vollständige Prüfung nach Ordnerergänzung bleibt erhalten; gemeinsamer exakter Bytezähler ersetzt die nur zur Größenprüfung erzeugte JSON-Kopie. 911 Tests, Typprüfung, gezieltes Lint und beide Builds bestanden. 101,96-MiB-Browserdatei nach Laden byteidentisch exportiert; Abbruch/Bestätigung geprüft. Abschließende Prüfphase im Einzelvergleich 400,5 → 63 ms; gesamte Task weiterhin 1187 ms. [Nachweis und Grenzen](docs/performance/ASSET_RECOVERY_PILOT.md). Keine allgemeine Kapazitätsfreigabe.

**Einmalige Eingangsgrößenprüfung (12.10.2026, perf/single-input-size-check):** PR283 nach ausdrücklicher Freigabe/grüner CI zusammengeführt. readProjectFile nutzt die sichere Deserializer-Grenze einmalig; typisierter Größenfehler erhält die konkrete Meldung, andere Fehler bleiben unverändert übersetzt. 912 Tests, Typprüfung, fokussiertes Lint und beide Builds bestanden. Gleiche 101,96-MiB-Datei im Browser byteidentisch exportiert; Vorbereitungs-Task im Einzelvergleich 1187 → 790 ms. Keine allgemeine Performancefreigabe. [Beleg/Grenzen](docs/performance/ASSET_RECOVERY_PILOT.md).

**Konsolidierte Produktionsabnahme (12.10.2026, test/consolidated-production-workspace):** PR284 nach Freigabe/grüner CI zusammengeführt. Unveränderter Produktcode ff9bbba ohne Diagnose-Transforms neu gebaut. 101,96-MiB-Fixture über Oberfläche geladen/abgebrochen/bestätigt, Lade-Undo/Redo, Wandhöhe 2,8→3,1, Bearbeitungs-Undo/Redo, Snapshot/Neuladen/Wiederaufnahme und Abbildöffnung bestanden. Downloads byteidentisch zum jeweils erwarteten Stand. Keine Konsolenfehler. Passive Long Tasks: Übernahme 2185 ms, Wiederaufnahme 2178 ms, Änderung 923 ms, Export 390–422 ms. Keine allgemeine Performancefreigabe; 912 Tests aus unverändertem PR284 übernommen, nicht neu ausgeführt. [Nachweis/Grenzen](docs/performance/ASSET_RECOVERY_PILOT.md).

**Produktions-Ladezuordnung (12.10.2026, bench/production-load-attribution):** PR285 mit grüner CI übernommen. Opt-in-Diagnose nutzt gemeinsame Messhelfer. Zweiter Lauf: Ladebefehl 360,9 ms, darin Musterabgleich 309,8 ms und History 50,9 ms; Bildprüfung 272,6 ms innerhalb PlanSceneContent 282,2 ms. BimPlan 162,2 ms. Task 1718 ms, Rest nicht vollständig zugeordnet. Typprüfung/Lint/Builds bestanden; Browserexport byteidentisch, keine Konsolenfehler. Keine Produktänderung oder Performancefreigabe. [Methodik und Rohdaten](docs/performance/ASSET_RECOVERY_PILOT.md).

**Musterabgleich-Budget (12.10.2026, perf/pattern-resolution-budget):** PR286 mit grüner CI übernommen. Exakter gemeinsamer Bytezähler ersetzt Vollserialisierung nach unveränderter vollständiger Validierung. 913 Tests, Typprüfung/Lint und beide Builds bestanden. Browserexport byteidentisch. Musterabgleich 309,8→85,7 ms, Ladebefehl 360,9→149,3 ms; gesamte Task im Einzelvergleich jedoch 1718→1910 ms. Kein End-to-End-Gewinn behauptet. Bildprüfung 396 ms; Rest unzugeordnet. [Rohdaten/Grenzen](docs/performance/ASSET_RECOVERY_PILOT.md).

**Bildprüfungs-Teilphasen (12.10.2026, bench/image-validation-phases):** PR287 übernommen. Zwölf Erstzugriffe: atob 100 ms, Bytekopie 179,2 ms, Header 0,3 ms. Beim Zoom 24 Wiederzugriffe ohne erneute Dekodierung (gesamt 0,1 ms). Cache funktioniert im geprüften Handle-Pfad; Fallback nicht bewertet. Diagnosebuild/Typprüfung/Lint und regulärer Build bestanden; Export byteidentisch, keine Konsolenfehler. Keine Produktänderung. [Nachweis/Grenzen](docs/performance/ASSET_RECOVERY_PILOT.md).

**Bildheader ohne Bytekopie (12.10.2026, perf/image-header-no-copy):** PR288 übernommen. Gemeinsamer Headerleser für Bytearray und dekodierten Binärstring; volle Bytekopie im URL-Prüfpfad entfernt. 914 Tests einschließlich Differentialoracle, Typprüfung/Lint/Builds bestanden. Browserexport byteidentisch, keine Konsolenfehler. Bildprüfung im Einzelvergleich 279,8→110,7 ms; warme Zugriffe 0,1 ms. Keine Gesamtperformancefreigabe. [Nachweis](docs/performance/ASSET_RECOVERY_PILOT.md).

**Grundrissvorbereitung (12.10.2026, bench/plan-preparation-phases):** PR289 nach UTF-8-Korrektur cadcf6a, erneut 914 Tests/regulärem Build und grüner CI gemergt. Diagnose misst BimPlan 202,2 ms, darin Fangquellen 193 ms, Szene 3,7 ms, Zeichenreihenfolge 0,9 ms. Zoom nutzt Vorbereitungen weiter (BimPlan 0,2 ms). Typprüfung/Lint/Diagnosebuild bestanden, Export byteidentisch, keine Konsolenfehler. Kein Produktumbau. [Nachweis/Grenzen](docs/performance/ASSET_RECOVERY_PILOT.md).

**12.10.2026 · Fangquellen-Teilphasen (PR291):** PR290 mit grüner CI gemergt.
Diagnose: Ableitung 42,6 ms, Index 164,5 ms; warme Zooms ohne Neuaufbau.
Verfügbare Fixture (25), 10014 Elemente, Export bytegleich, keine Browserfehler.
Fixture (27) fehlt inzwischen; daher kein direkter Vergleich mit deren Messwerten.
Typprüfung, ESLint und Diagnosebuild bestanden; Produktcode unverändert.
Details/Rohdaten: docs/performance/ASSET_RECOVERY_PILOT.md und snap-index-phases.json.

**12.10.2026 · Fangindex-Begrenzungen (PR292):** PR291 mit grüner CI gemergt.
Baumaufbau akkumuliert Grenzen in einem Objekt pro Knoten statt pro Eintrag.
Baumaufteilung/Sortierung/Abfragen unverändert; 916 Tests, Typprüfung, fokussiertes
ESLint, Diagnose- und regulärer Build bestanden. Sieben lokale Vergleichsläufe:
Median Baumvorbereitung 105,4→95,3 ms. Browserindex im Einzelvergleich 164,5→154,9 ms;
warmer Zoom ohne Neuaufbau, Export bytegleich, keine Konsolenfehler. Keine generelle
Performance-/Kapazitätsfreigabe. Nachweis: docs/performance/ASSET_RECOVERY_PILOT.md.

**12.10.2026 · Konsolidierte Produktionsabnahme (PR293):** PR292 mit grüner CI
gemergt. Ohne Funktionsinstrumentierung: große Fixture laden, Wandhöhe 2,90→3,10 m,
Undo/Redo, Export/Wiederöffnen und manueller Snapshot mit Wiederherstellung nach
Seitenneustart bestanden. Recovery-Export bytegleich zur gespeicherten Änderung;
10014 Elemente, keine Konsolenfehler. Produktions-Workspace-Build erfolgreich.
Lange Tasks verbleiben: Standprüfung bis 238 ms, anschließendes Laden bis 1400 ms;
keine Gesamtlaufzeit-/Kapazitätsfreigabe. Nachweis: ASSET_RECOVERY_PILOT.md.

**12.10.2026 · Recovery-Lesephasen (PR294):** PR293 nach grüner CI gemergt.
Diagnose-only: Standprüfung Storage 558,1 ms, bounded restore 1572,9 ms;
Handles 391,0 ms, Decode/Bytekopie 369,2 ms, Hashinput 330,5 ms, Schema 276,8 ms.
Header selbst 0,5 ms. Verschachtelte Werte, kein p95-Nachweis. Typprüfung/Lint/
Diagnosebuild bestanden; wiederhergestellter Export bytegleich. Nachweis/Rohdaten:
docs/performance/ASSET_RECOVERY_PILOT.md und recovery-read-phases.json.

**12.10.2026 · Recovery-Header ohne Kopie (PR295):** PR294 mit grüner CI gemergt.
Gemeinsamen String-Headerleser im Recovery-Pfad verwendet; volle Bytekopie entfällt.
917 Tests, Typprüfung/Lint, regulärer und Diagnosebuild bestanden. Gleicher Snapshot:
Decode 369,2→116,9 ms, Restore 1572,9→1293,4 ms im Einzelvergleich; Export bytegleich,
keine Konsolenfehler. Schema/Hash/Budgets/Checkpoints unverändert. Rohdaten und Grenzen:
docs/performance/ASSET_RECOVERY_PILOT.md, recovery-header-no-copy.json.

**12.10.2026 · Recovery-Handlevertrag (PR296):** Codeprüfung bestätigt G+L
Storage-/Base64prüfungen für G Payloads mit L Links: verifyPayload verliert den
Identitätsnachweis, die nachfolgende Handle-Fabrik prüft erneut. Bestehendes privates
WeakSet und eigene eingefrorene Daten erlauben einen begrenzten ID-Neuzuweisungspilot
mit Runtime-Identitätskontrolle. Keine Produktänderung; 22 fokussierte Tests bestanden.
Vertrag/Angriffsfälle/Nachweis in docs/performance/ASSET_RECOVERY_PILOT.md.

**12.10.2026 · Recovery-Handlewiederverwendung (PR297):** PR296 mit grüner CI gemergt.
Neue ID nur auf registriertem, unveränderlichem Handle; Recovery erhält den geprüften
Datenbesitz über Hash-await hinweg. Öffentlicher verifyPayload-Vertrag unverändert.
920 Tests, Typprüfung/Lint und beide Builds bestanden. Handles 353,6→0,8 ms,
Restore 1293,4→846,6 ms im Browser-Einzelvergleich; Export bytegleich. Nachweis und
Grenzen: docs/performance/ASSET_RECOVERY_PILOT.md, recovery-handle-reuse.json.

**12.10.2026 · Recovery-Hashinput (PR298):** PR297 mit grüner CI gemergt.
Diagnose-only: JSON 76,6 ms, UTF-8 259,3 ms, Hashinput 335,9 ms, Hash 85,8 ms.
Typecheck/Lint/Diagnosebuild bestanden; Export bytegleich, keine Browserfehler.
Kein Performancegewinn behauptet. Nächster Pilot begrenzt auf exakte Handle-Identität
und identische Hashbytes. Nachweis: ASSET_RECOVERY_PILOT.md, recovery-hash-input.json.

### Hashinput-Puffer (12.10.2026, Folgepilot nach PR298)
PR298 zusammengeführt. Registrierte unveränderliche Bildhandles schreiben dieselben
Hashbytes direkt in einen Puffer; unregistrierte Werte behalten JSON/UTF-8-Fallback.
922 Tests, Typecheck, fokussiertes ESLint, Diagnose- und Produktionsbuild bestanden.
Gleicher Browser-Snapshot: Hashinput 335,9→116,7 ms; bounded restore 993,7→683,1 ms.
Einzelmessungen, keine Kapazitätsgarantie; Storage separat und schwankend. Export
bytegleich, keine Browserfehler. Nachweis: docs/performance/ASSET_RECOVERY_PILOT.md.

### Konsolidierte Recovery-Abnahme (12.10.2026, nach PR299)
PR299 nach grüner CI zusammengeführt (b621023). Drei frische Tabs auf demselben
Diagnose-Produktionsbuild: bounded restore 745,1–794,8 ms, Hashinput 128,4–153,9 ms;
alle drei 101,96-MiB-Exporte bytegleich. Wandhöhe 3,1→3,2, Undo/Redo, neuer Snapshot,
Seitenneustart und Wiederaufnahme mit erneut bytegleichem Export bestanden. Keine
Konsolenfehler. Nur Prüfbelege/Dokumentation geändert; 922 Tests und beide Builds aus
unverändertem PR299, erfolgreiche GitHub-CI. Kein Crash-/Kaltstart-/Kapazitätsversprechen.
Rohdaten und Reproduktion: docs/performance/ASSET_RECOVERY_PILOT.md.

### Nutzerpriorität: Speichererweiterung zurückgestellt (12.10.2026)
Nach Abnahme des rund 102-MiB-Recoveryablaufs stellt der Nutzer die nächste
Kapazitätserweiterung ausdrücklich zurück. Produktgrenze 128 MiB bleibt bestehen.
Der vorhandene 252,57-MiB-Servicepilot und der Abgleich mit aktuellen Produktadaptern
bleiben vorgemerkt: vor einer weiteren Grenzerhöhung wieder aufnehmen, oder bei
konkretem Bedarf an größeren Projekten. Dies hebt offene P0-Sicherheitsprüfungen
vor externer Verteilung nicht auf. Keine weitere Speicheroptimierung aktiv.
Codeabgleich: Schema20 besitzt ein storey ohne Namen; Navigator zeigt fest Level 01,
IFC nutzt bisher die Geschoss-ID als Label. ModelView bindet bereits stabile storeyId.
Nächster CAD-Schritt: Geschossnamen als kleiner nutzbarer Einstieg in R26-03/N21.

### Geschossname (13.10.2026, feat/storey-name)
PR300 nach ausdrücklicher Freigabe und grüner CI zusammengeführt. Geschossnamen in
Schema21 gespeichert; alte Projektdateien und Recovery-Stände erhalten beim geprüften
Lesen Level 01. Gemeinsame Aktion renameStorey mit stabilen Projekt-/Geschoss-IDs,
Kontextprüfung und normalem Projekt-Undo. Navigator: Doppelklick auf Geschoss, Name
eingeben, Umbenennen; Esc/Abbrechen verwirft. Kopf-/Statusleiste, Grundriss/3D und IFC
lesen denselben Namen. Abbildnamen und IFC-GlobalIds bleiben unabhängig/unverändert.
925 Tests, beide Typechecks, fokussiertes Lint und beide Builds bestanden; ergänzter
PNG-Recovery-/Fehlerfall gezielt bestanden. Browser: Leername blockiert, Name mit Umlaut
und Apostroph, Undo/Redo, JSON/IFC-Export, Snapshot/Seitenneustart/Wiederaufnahme ohne
Konsolenfehler. Noch genau ein Geschoss, keine Höhen-/Geometrieänderung. Schema21-Dateien
benötigen diese oder neuere Programmversion; Altdateien bleiben lesbar.

## 5. Engpässe und Skalierungsrisiken

1. **Datei-/Assetgrenze:** Projektdatei aktuell 128 MiB, einzelne Bilddaten weiterhin 10 MiB. Die frühere 10-MiB-Projektgrenze ist abgelöst. 10 MiB = 10.485.760 Bytes, ungefähr 10,49 dezimale MB; nicht gleich zehn Millionen Bytes. Inline-Base64 und JPEG→PNG können Projektbytes erhöhen. Getrennt messen: Elemente/Punkte, kodierte Bytes, Gesamtpixel, dekodierter RAM, GPU und History. 16 MP pro Bild ist kein Gesamtbudget. 200–300 MB Archicad-Datei beschreibt Nutzererfahrung, keine bereits unterstützte Novikov-Größe.
2. **Speichern/Recovery:** Downloadanforderung und Undo sichern weder letzten Datenträgerstand noch Absturz-/Migrationsschutz. Dies ist P0 vor Public Beta mit realen Dateien.
3. **Commit/Export:** Volle Validierung, Geometrieableitung und Serialisierung bleiben globale Pfade. Ältere Einzelmessungen nicht als aktuelle Zeitgarantie verwenden. Herkunft/Commit, Hardware, Szenario und Median/p95 getrennt nennen.
4. **Vorschau/Abhängigkeiten:** Begrenzte Piloten sind produktiv; nicht wieder von null anfangen. Restliche Pfade und breite verbundene Komponenten messen. Nur ausgewählte Wand ist keine sichere betroffene Menge.
5. **3D:** Frühere CPU-Kamera-Neupackung wurde produktiv verbessert. Indexvorbereitung, Scan-Fallback, Preview, große Koordinaten und mehrere schwere Ansichten bleiben konkret zu vermessen. Kein begründeter pauschaler Rendererwechsel.
6. **Bibliotheken/Clientzustand:** Lokale Profile, Konflikte/Quota, konkurrierende Tabs und portable Linienkopien haben unterschiedliche Risiken. CadWorkspace darf nicht permanent Fachmodell/Settings/Actions aufsammeln.
7. **Fachmodell für AI:** Mehrere Geschosse, Wände/Fenster und Höhenversätze sind im Stand PR317 vorhanden; dies ist noch kein vollständiges Gebäudemodell. Räume, Höhenbezüge, Quellen, Abhängigkeiten, strukturierte Queries und Transaktionen sind Voraussetzungen komplexer autonomer Entwürfe.

Leistungsprofil wiederverwenden: 100/1.000/5.000 Elemente, viele Polygonpunkte, verbundene Wände/T-Knoten, mehrere echte Rasterpläne, 1/10/50/100 History-Stände, Laden/Pointer/Commit/Undo/2D/3D/Export getrennt. Kalte und warme Pfade unterscheiden, Budgets/Abbruchgrenzen dokumentieren. Kein Limit nur hochsetzen und keine Datenstruktur auf Verdacht austauschen.

## 6. Fahrplan mit Prioritäten

Priorität ist Risikostufe, keine Aufforderung zu paralleler Umsetzung. AI-Anschlussfähigkeit A03/A11 gilt ab jetzt in jeder Stufe. Nach jeder abgeschlossenen Aufgabe genau einen begrenzten Folgeauftrag wählen; ein belegter Datenverlust-/Security-Blocker darf die Reihenfolge vorziehen.

| Abschnitt | Priorität | Ergebnis und Abnahme | Bezug |
| --- | --- | --- | --- |
| 0 – Geordneten Stand sichern | historischer Auftrag; aktuell §9 AUD14 | Abbild-PR238 war Teil der früheren Reihenfolge. Aktuell gelten AUD14-01 bis AUD14-07; keine Doppelimplementierung. Zwei Abbilder desselben Modells behalten eigene Maßstäbe/Filter und Dateirundlauf. | MS-04c, N57/N60 |
| 1 – Daten und Kapazität | P0 | Persistenz-/Recovery-Pilot mit letztem gültigen Stand, Absturz, vollem Datenträger, Berechtigungen und Migration. Anschließend gemessenes Projekt-/Assetbudget, verknüpfte und portable Referenzen mit Umzug/fehlenden Quellen. Reihenfolge nach akutem Befund. | R26-01/02, K02/03, RC07/SB |
| 2 – Fachmodell | P1 | Mehrgeschossigkeit und feste/gebundene Höhen, dann passende Bauteile einzeln: Türen/Decken/Dächer/Stützen/Treppen, Schichtaufbau, Räume. Jede Fachfähigkeit mit Action/Query, Abhängigkeiten, Undo, Migration und gemeinsamen Ansichten. | R26-03, N21/22/31–35/42/47/48, V09 |
| 3 – Dokumentation | P1 | Abbilder zu Schnitt/Ansicht erweitern, Scope für Text/assoziative Maße, Papier-/Modellgrößen, Layout/Master/Plankopf, maßhaltiger PDF-/Drucknachweis. | R26-04/07, N05/06/20/46/49/50/57–60, MS |
| 4 – Auswertung | P1 | Räume/Höhenfelder → versionierte fachlich geprüfte WoFlV-Regeln inkl. Korrekturen → nachvollziehbarer Bericht und Mengen-/Bauteillisten. Polygonfläche nicht als Wohnfläche verkaufen. | R26-05, Guide-F01–04/F18–22 |
| 5 – Begrenzte AI-Piloten | strategischer Vorrang, schrittweise | Strukturierte Modellbefragung, wenige kontrollierte Änderungsaktionen, markierter Skizzenbereich; danach quellengebundener B-Plan-Pilot. Ein früher Pilot darf vorhandene Aktionen nutzen, bevor das gesamte Gebäude komplett ist. | AI03/04/09/10/23/26/31–35, V02 |
| 6 – Autonomer Entwurf | Hauptziel | Grundstück/Bruttoziel/Geschosse/Raumprogramm/B-Plan → zwei editierbare Varianten → CAD-Prüfung → Iteration → Gesamt-Diff/Übernahme/Undo. Unlösbare/unklare Bedingungen sichtbar. | AI01/02/05/06/07/17/19/35 |
| 7 – Austausch/Koordination | P2, früher bei Pilotblocker | Konkretes IFC-Import-/Referenzprofil, PDF-Vektor/Raster, DXF/DWG, 3D-Export; QA, Planrevision, BCF und IDS nur bei realem Bedarf. | R26-06/07/08, N02/28, AI20/21/22/28 |
| Begleitend – Produktverantwortung | P0 vor externer Verteilung | Sechs Register, reale Dependency-/Assetrechte, Security/Datenschutz, buildgebundene SBOM, sichere Updates, passende Beta-/Lizenz-/Homepagebedingungen, Offline-Lese/Export/Druck nach Ablauf. | RC01–10, SB01–07, HP01–05 |

Keine Kalendertermine oder garantierten Kapazitäten festgesetzt. First Person, Live-Schnitt, Kontextaktionen, Hotkeys, Perspektive, ungleiche Wandanschlüsse und Settings bleiben im Register, statt zwischen diesen größeren Etappen verloren zu gehen.

## 7. Produktentscheidungen aus den neuen Anlagen

Kostenlose **Public Beta** ist beschlossen, Termin/Laufzeit/Preis/Folgemodell ausdrücklich offen; sechs Monate war eine frühere Überlegung, keine aktuell festgelegte Laufzeit. Kein automatischer Zahlungseintritt. Nach Lizenzablauf unterstützte Projekte weiterhin öffnen, exportieren und drucken, auch ohne Lizenzserver; Bearbeitungsrechte getrennt. Kein Verschlüsseln/Löschen/Verändern der Projekte wegen Ablauf. Laufende Arbeit sicher erhalten.

Lokale Projektbearbeitung und Speicherung bevorzugt. Lizenzadapter getrennt von CAD/Persistenz; Kontopflicht, Offline-Lizenz, Aktivierung, Gerätebindung/-wechsel, Offlinefrist, Abo/Dauerlizenz und Betriebseinstellung bleiben offen. Keine Projektinhalte zur Lizenzprüfung senden.

Optionale Nutzungsdiagnose und Crashberichte getrennt, standardmäßig deaktiviert, aktive Zustimmung und leichter Widerruf, ohne Nachteile für normale Nutzung. Daten vor Versand offenlegen und bereinigen; manuelle Fehlerberichte erlauben. „Anonym“ nicht ohne Nachweis verwenden.

Eigene Modelle/Schraffuren bevorzugen, Autor/Herkunft/Vorlagen/Fremdbestandteile/Erstellungsbedingungen dokumentieren. Selbst erstellt bedeutet keine pauschale Rechtefreiheit. Code-, Asset- und Fontrechte vor Distribution prüfen; eigene Software wird durch diesen Plan nicht automatisch Open Source.

SBOM aus tatsächlichen aufgelösten Dependencies UND ausgeliefertem Artefakt, nicht nur package.json. Stack bekannt: TypeScript/React/Vite, package.json/bun.lock, GitHub-CI. Generator/Schema/SPDX oder CycloneDX, Plattformpackaging und Artefaktablage noch auszuwählen. Keine tatsächliche Komponentenliste oder juristische Freigabe behauptet. SBOM ersetzt weder Assetrechte noch Sicherheitsbewertung.

Homepage soll Produkt, Beta, Unterstützungsumfang, Support/Sicherheit, Rechtehinweise sowie passende Anbieter-/Datenschutz-/Lizenz-/Vertragsinformationen abbilden. Anbieteridentität, Märkte/B2B/B2C, Zahlungs-/Hosting-/Supportdienste und Bedingungen vor Veröffentlichung klären. Verbraucher-, Barrierefreiheits-, CRA-, Haftungs-, Gewerbe-/Steuerfragen fachlich aktuell prüfen. In den Anlagen genannte Rechtsquellen/Termine sind übernommene Prüfhinweise, hier keine neu verifizierte Rechtsbewertung.

## 8. Offene Entscheidungen – rechtzeitig, nicht pauschal jetzt

| Entscheidung | Klären vor |
| --- | --- |
| Browser/Desktop, Packaging/Dateiendung, unterstützte OS/Browser-Versionen | Persistenzgarantien und erster extern verteilter Build |
| Kapazitätsziel/Referenzhardware und Gesamtpixel-/RAM-/GPUbudgets | Produktionsformat-/Limitänderung |
| Linked-/Embedded-Vertrag, portable Weitergabe, Pfade/Zugriff/Recovery | Bildverknüpfungsimplementation |
| Konten/Lizenzen/Geräte/Offlinefrist und kommerzielle Konditionen | Lizenzimplementation/Public-Beta-Bedingungen |
| D vs. Ctrl+D; zulässiges Kopieren/Spiegeln, 3D-Reihenfolge | Jeweiliger Action-/Shortcut-Pilot |
| Allgemeine Perspektive/Kameraparameter, freie 3D-Arbeitsebene | Jeweiliger Navigations-/3D-Pilot |
| Ungleiche Wandquerschnitte, Dachtrimmen einmalig oder abhängig | Anschluss-/Trim-Fachregel |
| Raumkennungen, virtuelle Grenzen, WoFlV-Profil/Rundung und Berichtsvorlage | Raum-/Wohnflächenauftrag |
| PAT/Schraffurimportformat/Rechte, andere Austauschprofile/3D-Format | Jeweiliger Import/Export |
| Settings-Besitzer: Benutzer/Projekt/Ansicht/Werkzeug, Pane-Persistenz | Einstellungsübersicht |
| AI-Anbieter/Datenfreigabe/Autonomieumfang/Fachregelprofil | Erster entsprechender AI-Pilot |

Entschiedene Punkte nicht erneut als offen behandeln: 2D-only Pickup einschließlich Ebene, Modell-/Papiermaß mit internen Metern, unabhängige Abbildfilter, BIM-Skalierverbot, fixe Zeichenachse bei Wandkörperoffset, Wandkette ein Undo, keine gesonderte gemeinsame Eckbewegung.

## 9. Pflegevertrag und Codex-Arbeitsauftrag

Jeder Eintrag hat stabile ID, Status (vorhanden im genannten Umfang / teilweise / geplant / Entscheidung offen / historische Evidenz), Quelle und Abnahmekriterium. Implementiert wird nur mit Codepfad und konkretem Nachweis. Eine erfüllte Teilfunktion löscht den Restwunsch nicht. Neue IDs ergänzen statt bestehende umzunummerieren; historische F-Kennungen immer mit Quelle qualifizieren.

Nach jeder Aufgabe Masterplan §4/§9 und betroffene Registereinträge aktualisieren: Commit/PR, Test-/Browserbeleg, Einschränkungen und nächster Einzelauftrag. Alte Entwicklungslogs sind optionale Evidenz, keine weitere Reihenfolgenquelle. Ein Feature-Detailvertrag darf keine eigene widersprüchliche Prioritätenliste mehr führen. Anforderungen nicht nur in PR-Kommentaren oder Chat belassen.

**Verbindlicher Nutzerauftrag vom 14.10.2026, 21:01 Europe/Berlin: alle sieben Reviewpunkte sofort, einzeln und in der unten festgelegten Reihenfolge bearbeiten.**

**Genau ein aktiver Schritt: AUD14-05 – lokale 3D-Ursprungsfangabfrage (Teilauftrag).**
AUD14-01 ist begrenzt implementiert und fokussiert geprüft; Nachweis und ausdrücklich
begrenzter Altdatei-Übergangsvertrag am Dateiende. PR319 am 15.10.2026 freigegeben und gemergt. PR318
bleibt separat erhalten; dessen historische Fortsetzungsplanung ersetzt AUD14 nicht.
Keine neuen Features vor diesem Reviewblock. AUD14-02 ist im unten dokumentierten Umfang
implementiert und geprüft; PR320 am 15.10.2026 freigegeben und gemergt. AUD14-03
ist im unten begrenzten Umfang geprüft; PR321 am 15.10.2026 freigegeben und gemergt.
AUD14-04 bleibt aktiv: Gebäudeableitung/Ownership und 3D-Abfragebasis (PR322–324
gemergt), Fenster-Achsvorschau PR325 gemergt (f734413). Gemeinsamer Application-Einstieg
und verbindliches Adapter-Abnahmegate ergänzen die Pilotbasis. Nächster Einzelauftrag:
PR327 ist gemergt (035052c). Beide Wandachsenden, Kürzen und schräge Punktbewegung
sind über denselben vorbereiteten Adapter verglichen und gemessen. Nächster Einzelauftrag:
PR328 ist gemergt (6e4df27). Gemeinsame räumliche Konturprüfung: Nachweis Teil 7 unten.
PR329 gemergt (563c424); direkte Schraffur-Punktvorschau vorbereitet (Teil 8 unten).
PR330 gemergt (0a159ef); inkrementelle Schraffur-Punktprüfung nachgewiesen (Teil 9).
PR331 gemergt (1834600); Schraffur-Seitenstreckung vorbereitet (Teil 10 unten).
PR338/339 gemergt (fe9f83e/395b458); Polylinien-Knicken vorbereitet und verglichen (Teil 18).
PR340 gemergt (ff4af16); direktes Wand-Strecken gemeinsam vorbereitet und verglichen (Teil 19).
PR341 gemergt (0a093f6); freie Wandkörper-Eckbewegung gemeinsam vorbereitet (Teil 20).
PR342 gemergt (a40bc22); begrenzte Mehrgeschoss-/Browserabnahme dokumentiert in Teil 21.
PR343 gemergt (180320a); lokale 3D-Ursprungsfangabfrage implementiert, Nachweis AUD14-05 Teil 1.
Nächster Einzelauftrag: Verdeckungsprüfung des 3D-Ursprungsfangs vorbereitet räumlich
begrenzen; gleiche sichtbare Treffer und Tiefentoleranz gegen bisherigen Vollscan prüfen.
AUD14-04 bleibt mit Restschuld offen; diese Übergangsentscheidung ist keine Gesamtfreigabe.


Die Freigabe umfasst Diagnose, begrenzte Umsetzung und passende Verifikation aller Punkte. Nicht nach jedem abgeschlossenen Punkt erneut fragen, ob der nächste begonnen werden soll. Nach grünem Abschluss den nächsten offenen Punkt unmittelbar übernehmen; nur bei einer tatsächlich fehlenden Produktentscheidung oder Zugriffssperre konkret eskalieren. Es werden keine pauschale Grenzerhöhung, kein Renderer-/Sprachwechsel und keine breite Neuimplementierung vorausgesetzt.

| Reihenfolge | ID | Priorität | Ausführbarer Auftrag |
| --- | --- | --- | --- |
| 1 | AUD14-01 | P0 | Datei-/Modellzulässigkeit und Recovery-Gesamtpixelbudget abgleichen, Grenzfall reproduzieren und konsistent lösen. |
| 2 | AUD14-02 | P1 | Vollständige Projekt-/Bildserialisierung aus XY-/Z-Bewegung und weiteren betroffenen Änderungsvergleichen entfernen; Snapshot-/Mutationsschutz erhalten. |
| 3 | AUD14-03 | P1 | 3D-Ressourcen für unveränderte Geometrie wiederverwenden; Vorschau und Auswahl begrenzt aktualisieren. |
| 4 | AUD14-04 | P1 | Wiederholte globale Validierung/Ableitung begrenzen, Ansichtskontext von Modelländerung trennen und verbleibende direkte 3D-Vorschauen vorbereiten. |
| 5 | AUD14-05 | P1 | Neuen räumlichen 3D-Ursprungsfang lokal abfragen; große Anschlussgruppen mitmessen und betroffene Menge fachlich sicher begrenzen. |
| 6 | AUD14-06 | P1 | Recovery-Aufbewahrung, Langhistory, Bild-/Geometrie-Caches und reale Speicher-/Quota-Grenzen über lange Sitzungen prüfen und sicher begrenzen. |
| 7 | AUD14-07 | P2 / Abschlussgate | Aktuellen Dokumentationsstatus, UTF-8-Texte und Zuständigkeiten bereinigen; gesamten Block mit schwerem Mehrgeschossprofil abnehmen. |

Alle IDs beginnen als **offen / zur sofortigen Bearbeitung freigegeben**, nicht als implementiert. Details, konkrete Codebefunde und Abnahmekriterien stehen im Register unter diesen IDs. Für jeden Punkt: aktuellen main und offene PRs abgleichen; Vorhermessung/Reproduktion; kleinster sinnvoller Fix; Fach-/Fehlerregression; App-/Benchmark-Typecheck, relevantes Lint/Build und produktionsnaher Browsernachweis. Verschachtelte Zeiten nicht addieren, Einzelmessungen nicht als p95 ausgeben. Nachweise auf Commit/Fixture beziehen; Status und nächsten aktiven Schritt hier aktualisieren. Nur Messinstrumentierung ohne Erfüllung des Abnahmekriteriums schließt einen Punkt nicht.

Gemeinsamer Akzeptanzkontext: Schule etwa 1.000 m² je Geschoss, fünf Geschosse, viele Wände/Fenster/Eck-/T-Anschlüsse, Linien/Schraffuren/Polygonpunkte, mehrere Abbilder und bis zu 20 Referenzpläne als Prüfrichtwert. 128 MiB bleibt der derzeitige portable Dateivertrag; größere Kapazität ist keine Voraussetzung dieser Korrekturen. Schwere BIM- und Bildprofile getrennt sowie kombiniert messen. Referenzhardware/Browser, kalte und warme Läufe, Wiederholungen, Pointer/Commit/Undo, 2D/3D, Export/Recovery, Peak-Speicher und Grenzen dokumentieren. Verfügbare Fachfunktionen verwenden; fehlende Räume/Decken/Dächer nicht durch Testbehauptungen ersetzen. Die Archicad-Bachelorarbeit erst später mit passendem Importadapter, keine PLN-/IFC-Importfähigkeit behaupten.

**Startprompt für Codex:** Lies AGENTS.md und NOVIKOV_MASTERPLAN.md. Lies im NOVIKOV_REQUIREMENTS_REGISTER.md nur die IDs/Detailverträge des aktiven Auftrags. Vergleiche aktuellen main, offenen PR und lokale Änderungen. Erhalte fremde Arbeit. Nenne zuständige Schicht, Action/Query, Kontext, Abhängigkeiten und Abnahme. Setze genau einen begrenzten Auftrag um. Verwende bestehende Modell-, Snap-, ToolInteraction- und History-Grenzen. Dokumentiere ausgeführte Prüfungen und Einschränkungen, aktualisiere diese zwei Dateien und ende mit dem nächsten konkreten Schritt.

## 10. Verwaltung und persönliche Ablage

GitHub bleibt die technische Quelle. Für kommende Arbeitsaufträge genügen diese zwei Dateien plus fokussierte Code-/Test-/Diagnoselesung. GitHub Issues/Projects können später IDs, Prioritäten und Status abbilden; kein weiterer Plugin-Anschluss ist dafür Voraussetzung. Ein zusätzliches Notion-/Linear-System ist optional, würde aber eine klar geregelte Synchronisierung benötigen. Die PDF ist ein datierter Fahrplan für die persönliche Ablage und keine dritte laufend gepflegte Quelle.

### Ergänzung zum aktiven Geschossauftrag (Nutzerentscheidung 13.10.2026)
Der Architekturauftrag aus §9 berücksichtigt den neuen Nutzervertrag unter
R26-03/N21/N22/N56 im Register: „Gebäudestruktur“ mit Doppelklick-Einstellungen,
Geschosse oberhalb/unterhalb per Kontextmenü, individuelle Höhen, Standardnamen
ab Erdgeschoss und Gebäude-Basis OK Rohdecke / Rohfußboden EG. Höhenskizze später.
Keine Mehrgeschossimplementierung vor dem begrenzten Migrations-/Höhenvertrag;
die noch offenen Einfüge- und Höhenfortschreibungsregeln ausdrücklich ausweisen.

### Status 13.10.2026 – Autosicherungsanzeige und Geschossvertrag
UI-Anzeige links unten ersetzt „Model coordinates“ (grün aktiv, rot aus/pausiert).
Bestehenden Recovery-Controller unverändert weiterverwendet. Höhen-/Migrationsvertrag
mit geprüftem Codeinventar, Zuständigkeiten, bestätigter Rohfußboden-EG-Basis und
expliziten offenen Höhenregeln im Register ergänzt. Noch keine Mehrgeschossfunktion.
Die vorherige Ergänzung zum Architekturauftrag ist damit bearbeitet; aktiv ist §9.
Prüfnachweis dieses Auftrags: 18 bestehende Autosave-/Recovery-Status-Tests bestanden,
TypeScript und fokussiertes ESLint bestanden, Produktionsbuild bestanden. Browser:
rotes Symbol beim Ausschalten, grünes Symbol beim Einschalten, Öffnen der bestehenden
Recovery-Palette über das Symbol. Ausgangszustand aktiv wiederhergestellt.

### Status 13.10.2026 – Gemeinsamer Geschosskontext
PR301/302 mit ausdrücklicher Freigabe zusammengeführt. Gemeinsame typisierte Query
in application/storeys/context.ts für Arbeitsansichten und Abbilder implementiert;
Maßstabsaktionen und Ansichtskontexte angebunden. 27 gezielte Regressionstests,
TypeScript, fokussiertes Lint und Produktionsbuild bestanden. Schema21 und bestehende
Bedienung unverändert. Die übrigen direkten Geschosszugriffe bleiben im dokumentierten
Migrationsumfang; dies ist keine abgeschlossene Mehrgeschossumstellung.

### Status 13.10.2026 – Höhenregeln bestätigt
PR303 mit ausdrücklicher Freigabe und grüner CI zusammengeführt (main 9a14b0a).
Nutzer bestätigt Rohfußboden-zu-Rohfußboden, EG als festen Bezug, Fortschreibung
oberhalb nach oben/unterhalb nach unten und zusätzliche Höhe beim Einfügen.
Formeln, konkrete Keller-/Obergeschossbeispiele, Migration und genau ein EG/OG-Pilot
im Register dokumentiert. Nur Dokumentation geändert; keine neue Höhenfunktion.

### Status 13.10.2026 – Höhenrechenkern, EG/OG-Pilot noch offen
Domainberechnung, Höhenänderung und Einfügen mit festem EG-Bezug implementiert.
Acht neue Domainfälle, insgesamt 934 Tests, TypeScript, fokussiertes Lint und Build
bestanden. Noch keine Schema-/UI-/3D-/IFC-Anbindung. Nach Codeinventur von 218 direkten
Einzelgeschosszugriffen als überprüfbaren ersten Teil isoliert; die vollständige
vertikale Abnahme bleibt ausdrücklich offen. PR303 ist bereits gemergt, PR304 offen.

### Status 13.10.2026 – Geschosshöhe im Modell und Settings
PR304/305 zusammengeführt. Schema22 speichert die zunächst unbekannte Geschosshöhe;
gemeinsame Application-Aktion mit Undo/Redo und strikter Datei-/Recoverymigration.
Gebäudestruktur per Doppelklick öffnet gemeinsame Settings-Hülle mit direkter
Höheneingabe. 936 Tests, beide Typechecks, Lint, Build und Browserprüfung bestanden.
Weiterhin ein Geschoss: Sammlung, Geschosswahl und 3D/IFC-Z-Anbindung bleiben offen.

### Status 13.10.2026 – Schnittskizze vorgezogen
Auf Nutzerwunsch Gebäudeeinstellungen als schematischen Rohdecken-Schnitt ergänzt:
EG-Kote 0,00 m, bearbeitbare obere Kote und Geschosshöhe, Tab „Allgemeine
Gebäudestruktur“. Bestehenden Modelldatenfluss wiederverwendet; keine zweite
Geschossebene/Decke erzeugt. 13 gezielte Tests, TypeScript, Lint, Build und beidseitige
Eingabe-/Undo-Browserprüfung bestanden. Nächster aktiver Auftrag bleibt §9.

### Status 13.10.2026 – Bearbeitbare EG-Kote
Nutzerpräzisierung umgesetzt: obere Kote = OK EG-Rohdecke + Geschosshöhe.
Schema23 speichert groundDatum (Altdateien: 0 m); gemeinsame validierte Aktion
mit Modell-Undo und Datei-/Recoverymigration. Änderung des Bezugs erhält die
Geschosshöhe. Skizze schwarz, linke Maßkette entfernt. 938 Tests, beide Typechecks,
fokussiertes Lint und Build bestanden. Browser: 0,50 + 3,00 = 3,50 m; obere
Kote 4,00 ergibt Höhe 3,50; Undo stellt 3,00 wieder her.
Der Bezug beschreibt die Höhenkoten; lokale Bauteilgeometrie bleibt beim EG-Ursprung.
Mehrgeschossdarstellung und gemeinsame 3D-/IFC-Höhenanbindung bleiben der nächste
begrenzte EG/OG-Pilot aus §9. Kein weiterer Parallelauftrag.

### Nutzerergänzung / Status 13.10.2026 – Mitwachsende Gebäudeskizze
Skizze auf wiederholbare, über stabile IDs gebundene Geschossabschnitte umgestellt.
Eingaben bleiben lesbar; lange Listen nutzen den vorhandenen Settings-Scrollbereich.
Keine zweite Geschossverwaltung in React. Derzeit weiterhin nur das bestehende EG
angebunden. Anlage-Buttons sind noch nicht implementiert. Nutzer fordert am jeweiligen
Geschoss ausdrücklich „Geschoss darüber“ UND „Geschoss darunter“ in diesen Settings.
Dies erweitert den aktiven Auftrag §9 um beide Einfügerichtungen in der Skizze;
der ältere Ausschluss der Keller-UI gilt dafür nicht mehr. Der nächste Auftrag ist
weiterhin die produktive Geschosssammlung mit gemeinsamen Aktionen, UI-Anlage,
Bearbeitung, History und konsistenter 3D-/IFC-Auflösung. Keine erneute Skizzenplanung.
15 Höhen-/Migration-/Historytests, TypeScript, fokussiertes Lint und Build bestanden;
Einzelgeschossdarstellung im Browser geprüft. Mehrgeschoss-Abnahme bleibt offen.

### Status 13.10.2026 – Geschosse direkt in der Skizze anlegen
PR306–309 nach ausdrücklicher Freigabe zusammengeführt. Oberhalb/unterhalb jedes
Geschosses lassen sich echte Geschosse mit eigener Höhe anlegen, auch zwischen
bestehenden Geschossen. Namen und Koten sind bearbeitbar; Standardnamen für OG/KG,
bestehende Namen bleiben erhalten. Schema24 ersetzt das Einzelgeschoss durch
`storeys` plus `groundStoreyId`; Altdateien werden ohne erfundene Höhe migriert.
Gemeinsame BuildingChange-Aktion, genau ein Undo-Schritt je Anlage, globale IDs,
Datei/Recovery und IFC mit allen Geschossen. Keine zweite gespeicherte Geschosskopie.
942 Tests im vollständigen Lauf bestanden, beide Typechecks,
Lint der geänderten Dateien und Produktionsbuild bestanden. Browser: OG +3,00 m,
Keller −2,80 m; Änderung auf 3,00 m ergibt −3,00 m ohne Verschiebung EG/OG;
Undo/Redo der Anlage und Speichern/Wiederöffnen bestätigen die Höhen.
Grenze dieses Piloten: Zeichnen und 3D/Picking bleiben beim bisherigen EG. Neue
Geschosse sind zunächst leer; die aktive Geschosswahl ist der einzige nächste Auftrag.

### Status 14.10.2026 – Aktives Geschoss zum Zeichnen und Bearbeiten
PR310 nach erfolgreicher CI und ausdrücklicher Freigabe in main übernommen.
Navigatorwahl setzt über selectWorkingStorey den gemeinsamen Arbeitskontext.
workingStoreyId ist eine optionale, additive Schema24-Ansichtseinstellung; alte
Dateien starten weiterhin im EG. Kein Modell-Undo für die Wahl; Undo/Redo erhält
die Wahl, solange das Geschoss existiert, andernfalls Rückkehr zum EG.
Bestehende gemeinsame Aktionen verwenden den gewählten Geschosscontainer.
Grundriss, Eigenschaften und aktive 3D-Ansicht zeigen dasselbe Geschoss;
3D-Geometrie, Fenster, Achsen, Fußpunkte und Fang-/Bearbeitungsebene nutzen die
abgeleitete lokale Gebäudehöhe. groundDatum bleibt der absolute Kotenbezug.
Abbilder öffnen ihr Quellgeschoss; neue Abbilder binden das aktive Geschoss.
IFC bleibt vollständig über alle Geschosse, unabhängig vom gewählten Arbeitsgeschoss.
Browser: OG gewählt, Wand gezeichnet, Fenster eingesetzt, EG unverändert, OG-Wand
in 3D ausgewählt; gespeicherte JSON-Datei enthält je eine Wand/Fenster in EG und OG.
Grenze: die bearbeitbare 3D-Ansicht zeigt in diesem Pilot das aktive Geschoss.
Die geschossübergreifende Gebäudeübersicht ist der nächste einzelne Auftrag.

Nachweis: 947 Tests bestanden; Typprüfung für Anwendung und Benchmarks,
gezieltes ESLint und Produktionsbuild erfolgreich. Browser-Wiederöffnung stellt
das aktive OG wieder her; Dateiübersicht zählt Bauteile aller Geschosse.

### Status 14.10.2026 – Gemeinsame 3D-Gebäudeansicht
PR311 nach erfolgreicher CI und ausdrücklicher Freigabe in main übernommen.
Alle Geschosse liefern ihre Wandkörper und Fensteröffnungen in dieselbe abgeleitete
3D-Szene, auf den gemeinsam aufgelösten Höhen. Die Arbeitsgeschosswahl filtert diese
Szene nicht mehr. Ebenenfilter, Tiefentest, Fit und Picking beziehen das gesamte Gebäude
ein; aktive Fangquellen bleiben auf der jeweiligen Arbeitsebene, werden aber durch
sichtbare Bauteile aller Geschosse verdeckt. Keine Kopie im gespeicherten Modell.
Einzelklick auf ein Bauteil eines anderen Geschosses löst dessen Besitzer auf und
wechselt den Bearbeitungskontext. Kamera bleibt erhalten. 2D bleibt geschossbezogen.
949 Tests, beide Typprüfungen, gezieltes Lint und Build bestanden. Browser: EG und OG
mit Fenstern gleichzeitig sichtbar; Auswahl EG-Wand und OG-Fenster, Breitenänderung
und Undo erfolgreich. Tests ergänzen Keller, Höhenänderung, JSON, IFC und Verdeckung.
Grenze: Strg/Cmd-Mehrfachauswahl und gemeinsame Bewegung über mehrere Geschosse sind
noch nicht freigegeben; ein erklärender Hinweis erhält die bisherige Auswahl.
Dies ist der nächste einzelne Auftrag; normale Mehrfachauswahl im Geschoss bleibt.

### Status 14.10.2026 – Geschossübergreifende Auswahl und atomare XY-Bewegung
PR312 mit erfolgreicher CI und Freigabe übernommen. Gemeinsamer Auswahlindex umfasst
alle Geschosse. Strg/Cmd-Klick in 3D erweitert/entfernt Ziele geschossübergreifend.
Der bestehende Gruppenbewegungs-Adapter teilt Ziele auf ihre echten Geschosscontainer
auf und verwendet die geprüfte prepareTranslation je Geschoss. Alle Vorschauen werden
geprüft; nur der aktive Grundrisspatch wird dargestellt. Alle Änderungen werden gemeinsam
validiert und als ein Projekt-Undo veröffentlicht. Fenster folgen Hosts, Anschlüsse
verwenden unverändert die bestehenden Regeln. Text-/Voice-Translation verwendet dieselbe Aktion.
951 Tests, beide Typechecks, gezieltes Lint und Produktionsbuild bestanden. Browser:
EG/OG mit Strg gewählt, On-Demand-Bewegung, Ursprung/Ziel im Grundriss, Datei bestätigt
gleichen XY-Vektor in beiden Geschossen; ein Undo stellt beide Geschosscontainer exakt her.
Grenze: Maus-Gruppenbewegung startet noch im Grundriss. Die direkte 3D-Vorschau/Bedienung
ist der nächste einzelne Auftrag, kein bereits abgeschlossener Bestandteil dieses Piloten.

### Status 14.10.2026 – Direkte XY-Gruppenbewegung in 3D
PR313 mit erfolgreicher CI nach ausdrücklicher Freigabe nach main übernommen.
Auswahl frei bewegen bleibt in 3D: sichtbarer Wandfußpunkt im Arbeitsgeschoss als
Ursprung, sofortige Hilfsreferenz, gemeinsamer ToolInteraction-/Fang-/Shift-/Tab-Pfad.
X/Y und Gegenrichtungen sowie tatsächliche Achsen ausgewählter Wände schreiben in
 dieselbe Hilfseingabe. XYZ-Richtungsvertrag vorhanden; Z ist ausdrücklich gesperrt.
Vorbereitete Geometriepatches je Geschoss liefern Wandkörper und Fensterflächen auf
ihren unveränderten Höhen. Kein vollständiges Project-Materialisieren im Gruppen-
Pointerpfad; ein Patch wird je Ziel für Körper und Fenster gemeinsam ausgewertet.
Platzieren nutzt weiterhin vollständige Prüfung und genau einen Projekt-Undo.
Nachweis: 953 Tests einschließlich Vergleich aller Vorschauflächen/Fenster mit dem
vollständigen Commit-Pfad, gelöster T-Verbindung, Nachbarwänden und OG; schräge
3:4-Wandachse ergibt präzise 5-m-Bewegung. Beide Typechecks, gezieltes Lint und Build.
Browser: EG/OG gemeinsam in 3D, Ursprung, X +1 m per Canvas-Klick, Dateivergleich,
ein Undo für beide Geschosse; Y=90° und Abbruch der Vorschau. Kein Z-/Perspektiv-
oder Großprojekt-Performance-Nachweis. Aktive Fanggeometrie und Ursprung bleiben
an die horizontale Arbeitsebene gebunden. Nächster Einzelauftrag siehe §9.

### Ergänzung 14.10.2026 – Frei gewählter Bewegungsursprung in 3D
Nutzerkorrektur zum offenen PR314: Nach Auswahl und On-Demand-Bewegungsaktion wird
zuerst ein eigener Ursprung gewählt. Sichtbare reale Wandecken aller Geschosse,
auch obere Ecken, werden bildschirmbezogen gefangen und mit einem Ring angezeigt.
Der Klick fixiert die exakte Ecke; die horizontale Bewegungsebene läuft durch deren
Z-Höhe. Freier Klick ohne Eckfang setzt einen Ursprung auf der Arbeitsgeschossebene.
Die Bauteilhöhen/Geschosszuordnung bleiben unverändert; keine Z-Mutation.
Gemeinsamer abgeleiteter Eckadapter nutzt Körperkonturen, Ebenenfilter und Tiefentest;
die anschließende Bewegung verwendet weiterhin ToolInteraction, gemeinsame
Hilfsreferenzen, Präzision und validierte Auswahltranslation. Fangschalter bleibt gültig.
954 Tests bestanden; zusätzliche obere Ecke, Fangradius, Sichtbarkeit, Ebeneninverse
und Ursprungsreferenz. Typechecks, gezieltes Lint und Produktionsbuild geprüft.
Browser: obere OG-Ecke bei aktivem EG, beide Wände +1 m X; Projektdatei bestätigt
identische XY-Translation und unveränderte Fensterparameter. Z-Höhenvertrag bleibt
nächster Auftrag nach Abnahme dieser Bedienkorrektur.

### Ergänzung 14.10.2026 – Sichtbare Bewegungsachsen am Ursprung
Nach bestätigter Ursprungswahl zeigt die gemeinsame 3D-Fangvorschau X/Y als
beschriftete Richtungspfeile. Z wird ausdrücklich nur zur Orientierung dargestellt;
keine Höhenbewegung. Die Achsen stammen aus WORLD_MOVEMENT_AXES, werden mit der
aktuellen Kamera am echten Ursprung projiziert und besitzen eine bildschirmbezogene
Darstellungslänge. Kein zweiter Fang-/Shift-Algorithmus: bestehende Richtungssperre
bleibt unverändert. Blickparallele Achsen ohne projizierbare Richtung entfallen.
Typprüfung, gezieltes Lint, vorhandene Shift-Sperrprüfungen und sechs 3D-Fangtests,
Produktionsbuild bestanden. Browser: Achsen am oberen OG-Ursprung; Shift-Klick nahe
X ergibt in beiden Geschossen exakt gleichen X-Versatz bei unverändertem Y.
PR314 enthält diese Bedienergänzung. Nächster Auftrag bleibt Z-Höhenvertrag nach Abnahme.

### Ergänzung 14.10.2026 – Gemeinsame Bewegung auch für Einzelziele
Nutzervertrag: Die 3D-Ursprungs-/Achsen-/Fangbedienung ist eine gemeinsame Fähigkeit
für Bewegungen, unabhängig von der Anzahl ausgewählter Elemente. Einzelwand
„Element frei bewegen“ verwendet jetzt denselben SelectionMove-Einstieg wie Gruppen:
freie Ursprungswahl vor Beginn, sichtbare Ecken, temporäre Ursprungsebene, Achsen,
ToolInteraction und vorbereitete Vorschau. Kein separater Einzelwand-Move-Pfad in 3D.
Vorhandene gebundene Aktionen bleiben geometrisch gebunden: Punktbearbeitung startet
am gewählten Punkt, X/Y/Achse folgen ihrer Richtung; Fenster bleibt an seiner Wand.
Fenster entlang Wand läuft nun direkt in 3D über denselben Direct-Edit-Adapter mit
Achsen/Fangvorschau auf Höhe der Fenstermitte; kein erzwungener Grundrisswechsel.
Neue 3D-Elementadapter müssen diesen gemeinsamen Vertrag verwenden. 2D-Linien und
Schraffuren bekommen dadurch keine künstliche 3D-Repräsentation; Z bleibt gesperrt.
Browser: einzelne OG-Wand, freie obere Ursprungsecke, Achsen und Abbruch; einzelnes
OG-Fenster in 3D verschoben, Position geändert bei unveränderten Maßen/Host.
Zusätzlicher Test prüft Hostbindung, Begrenzung und genau einen Undo-Schritt des
Fensteradapters. Nächster Auftrag bleibt der Z-Höhenvertrag nach Abnahme von PR314.

Nachweis Einzelziele: 955 Tests vollständig bestanden, App-Typecheck, gezieltes Lint und Produktionsbuild erfolgreich.

### Ergänzung 14.10.2026 – Unabhängige 3D-Kameranavigation
Gedrückte mittlere Maustaste verschiebt die Kamera in Bildschirmrichtungen;
Strg/Cmd + mittlere Taste rotiert um die Mitte der ausgewählten sichtbaren Bauteile,
ohne Auswahl um die aktuelle Ansichtsmitte. Drehpunkt wird pro Geste festgehalten;
Navigation bestätigt keine laufende Bauteilbewegung. Scrollen zoomt weiterhin.
Der 3D-Ansichtsrahmen bleibt bei Modelländerungen stabil. „Alles anzeigen“ in der
unteren Leiste sowie Fit/Reset bauen ihn ausdrücklich aus den aktuellen Gebäude-
grenzen neu auf. Kein Modell-Undo für Kamerabewegungen. Farbige X/Y/Z-Orientierung
unten links folgt Kamera-Yaw/Pitch, unabhängig von Modellgröße, Zoom und Pan.
Geometrischer Test bestätigt bildschirmfesten ausgewählten Pivot und Ansichtsmitte
nach Pan/Orbit. Typecheck, gezieltes Lint, 12 3D-Bearbeitungs-/Kameratests und Build
bestanden. Browser: Fit nach 500-%-Zoom und Achsenanzeige geprüft. Physische
Mausrad-Drag-Kombination ist noch praktisch durch den Nutzer abzunehmen.
Nächster Auftrag bleibt nach Bedienabnahme der Z-Höhenvertrag.

### Ergänzung 14.10.2026 – Orientierung von unten und künftige 3D-Darstellung
Beim Orbit unter die Nullebene (negative Kameraneigung der orthografischen Kamera)
liegt die dekorative Z=0-Fläche mit 28 % Deckkraft über dem Modell; von oben bleibt
sie mit 14 % hinter dem Modell. Kein Fangziel, keine Auswahl- oder Modelländerung.
Nutzerwunsch für später: Ansicht → Canvas-Darstellung → 3D erhält gemeinsame
optische Darstellungsoptionen und zoomunabhängige Elementkonturstärken in Pixeln.
Die vorhandene Grundriss-Kontursteuerung bleibt getrennt. Umsetzung über gemeinsame
Renderer-/Darstellungseinstellungen, ohne Bauteilkopien oder Modell-Undo; konkrete
weitere Darstellungsmodi noch nicht festgelegt. Kontursteuerung 3D ist noch offen.
Nachweis: Typecheck, gezieltes Lint und Produktionsbuild bestanden. Browser-Unteransicht mit grauer Überlagerung geprüft.

### Höhenvertrag Z-Bewegung – freigegeben am 14.10.2026
PR #314 ist mit grünem GitHub-Check in main übernommen (93e7c2e).
Dieser Schritt ist ein Code-/Vertragsabgleich, noch keine Z-Freischaltung.

**Verbindliche Nutzerentscheidungen:**
- Z-Bewegung behält die Geschosszuordnung und verändert einen relativen Höhenversatz.
  Änderungen der Geschosslage nehmen das Bauteil einschließlich Versatz mit.
- Gemeinsam bewegte Wände behalten ihre gegenseitigen Anschlüsse. Anschlüsse zu
  nicht mitbewegten Wänden werden erst beim Platzieren gelöst; Abbruch erhält sie.
- Fenster folgen ihrer Wand; ihre relativen Maße und Brüstungshöhen bleiben dabei erhalten.

**Codebefund und technische Grenze:**
`domain/project/schema.ts` verwendet derzeit Format 24 und keinen vertikalen
Wandversatz. `domain/storeys/elevation.ts` liefert lokale Geschosslagen; groundDatum
beschriftet absolute Höhen, verschiebt aber keine lokale Geometrie.
`lib/bim/geometry.ts` extrudiert ab relativ Z=0 und Öffnungen ab sillHeight.
`application/selection/move.ts` verwendet zweidimensionale Points;
`application/input/movement-axes.ts` beschreibt XYZ bereits, weist Z aber bewusst ab.
Die Anschlussauflösung prüft bisher XY-Endpunkte; das reicht für versetzte Wände nicht.

**Begrenzter technischer Entwurf:**
- Gemeinsame Domain-Höhenauflösung: Wandfuß = lokale Geschosslage + baseOffset;
  Wandkopf = Wandfuß + bestehende feste Wandhöhe; Fensterunterkante = Wandfuß +
  sillHeight. Absolute Höhenanzeige addiert groundDatum genau einmal.
- baseOffset in Metern, endlich, auch negativ; keine zweite gespeicherte absolute Kote.
  Migration alter Projekte auf Versatz 0 erhält ihre bisherige Geometrie exakt.
  Die nächste Formatversion erst bei Implementierung reservieren, parallele Änderungen prüfen.
- Eine Application-Aktion mit Projekt-/Auswahlkontext und deltaZ, gleicher Versatz für
  alle Ziele. Wandfenster genau einmal mitnehmen, auch wenn separat mit ausgewählt.
  Vorschau über stabiler Basis; vollständige Validierung beim Commit; genau ein Undo.
- Renderer, reale Fangpunkte, Picking, vorbereitete Vorschau, IFC und JSON müssen
  dieselbe Höhenauflösung nutzen. Keine nur visuelle Verschiebung im Renderer.
- Anschlussregeln müssen Z berücksichtigen und nach dem Lösen erneutes automatisches
  Verbinden allein aufgrund gleicher XY-Koordinaten verhindern. Keine neuen vertikalen
  Teilanschlüsse im ersten Piloten. Keine automatische Geschossumsortierung.
- AI/Text/Voice später als Adapter derselben geprüften Aktion mit stabilen IDs.
  Einzelfenster vertikal verschieben und geschossgebundene Wandoberkanten sind nicht
  Bestandteil dieses Piloten; vorhandene feste Wandhöhen bleiben erhalten.

**Genau ein nächster ausführbarer Auftrag:**
Zunächst die Domain-Höhenauflösung und abwärtskompatible Migration für Wand-baseOffset
implementieren, einschließlich gemeinsamer 3D-/IFC-Ableitung und höhensicherer
Anschlussvalidierung. Noch keine neue Mausaktion. Abnahme: alte Dateien unverändert,
positive/negative Versätze auf EG/OG/KG, mitwandernde Fenster, Geschosshöhenänderung,
JSON-Roundtrip und IFC-Koordinaten identisch, ungleiche Anschlusslagen verständlich
abgewiesen. Danach erst Z-Bewegung auf diese geprüfte Basis aufsetzen.
Prüfnachweis dieses Dokumentationsschritts: genannte Codepfade gelesen; keine neuen
Laufzeittests erforderlich, da keine Implementierung geändert wurde.

### 14.10.2026 – Gemeinsame Wand-Höhenauflösung implementiert
PR315 (Höhenvertrag) mit erfolgreichem Check in main übernommen, d10c74a.
Format25 ergänzt optionales baseOffset in Metern; fehlend bedeutet exakt 0.
Die explizite Migration V24→V25 erhält alte Geometrie ohne zusätzliche Nullfelder;
ältere Versionen durchlaufen weiterhin ihre strengen Migrationsstufen.
Domain `elements/wall/heights.ts` löst lokale Wandfuß-/Kopfhöhen auf. Fenster bleiben
relativ zur Wand. Geschossauflösung und absoluter Gebäudedatum-Bezug bleiben getrennt.
3D-Material, Fenster-Auswahlflächen, Steuerungsachse, reale Ursprungecken, bestehende
XY-Vorschau und IFC-Platzierungen berücksichtigen den Versatz. Fangquellen auf der
Geschossebene bieten versetzte Wandfüße nicht fälschlich als Punkte auf Z=Geschoss an;
freie 3D-Ursprungswahl nutzt echte Körperpunkte, Bearbeitung die jeweilige Arbeitsebene.
Eck-/T-Paarprüfung lehnt unterschiedliche Fußhöhen ab. Automatische Ecksuche und
vorbereitete XY-Bewegung zählen Anschlussknoten mit ihrer Höhe, nicht nur mit XY.
Keine Z-Mausaktion und keine neue Höhen-Eigenschaftenoberfläche in diesem Schritt.

Nachweis: 964 Tests bestanden, darunter acht neue Fälle für signierte Versätze,
V24-Migration/forgierte Altdateien, ungültige Höhen, EG/OG/KG, Fenster/JSON/reale
Ecken, feste und vorbereitete Anschlüsse sowie rekursiv aufgelöste IFC-Platzierungen.
App-Typecheck, gezieltes Lint und Produktionsbuild bestanden. Vorhandene Testdateien
wurden ausschließlich bei Erwartungen an die aktuelle Formatversion angeglichen.
Praktische Testdateien: outputs/wall-height-acceptance.json und .ifc (außerhalb Repo).
Drei Wände mit Fenstern bei 0 / +0,50 / −0,50 m; Browser-/Archicad-Abnahme dieses
neuen Beispiels noch offen. Keine erneute Großprojekt-Performancefreigabe.

Genau ein Folgeauftrag: gemeinsame Application-Aktion für Z-Translation einer
Wand-Auswahl implementieren, zunächst mit vorbereiteter Vorschau und vollständigem
Commit-Vergleich. Geschoss/IDs erhalten, interne Anschlüsse erhalten, externe erst
beim Commit lösen, Fenster einmal mitnehmen, stale-Kontext ablehnen, ein Undo.
UI-Achsenanbindung folgt auf die geprüfte Aktion, ohne parallele Modelllogik.


Ergänzung 14.10.2026: Wand-Werkzeugeigenschaften besitzen jetzt das Feld Z-Versatz zum Geschoss (m), bezogen auf OK Rohdecke. Signierte Werte mit Dezimalkomma/-punkt, Übernahme per Enter/Blur über PropertyForm und updateWall, keine separate Modelllogik. Fenster folgen. Browser: +0,5 m und ein Undo geprüft; 8 Höhentests, Typecheck, gezieltes Lint und Build bestanden. Ungleiche Anschlussfußhöhen bleiben vorerst abgewiesen; nächste Aktion löst externe Anschlüsse gemäß Vertrag.


### 14.10.2026 – Gemeinsame Z-Auswahlaktion
PR316 mit erfolgreichem GitHub-Check in main übernommen (8e3bb6b).
`application/selection/z-translation.ts` bereitet eine snapshotgebundene Z-Aktion
für eine oder mehrere Wände über Geschossgrenzen vor. Mit ausgewählte Fenster werden
nicht doppelt verschoben; Brüstung und Host bleiben unverändert. Gemischte Auswahl
mit 2D-Elementen sowie Fenster ohne ausgewählte Wand werden verständlich abgewiesen.
Die vorbereitete Vorschau verwendet eigene unveränderliche Daten und die bestehende
GeometryPreview-/StoreyPatch-Ableitung. Nur betroffene Anschlussgruppen werden als
Patch geliefert. Interne Anschlüsse bleiben erhalten; externe Anschlüsse werden in
der Vorschau gelöst dargestellt und erst beim Commit dauerhaft gelöst. Abbruch
verändert das Modell nicht. Nullbewegung ist ein No-op inklusive Anschlusserhalt.
Commit prüft vollständiges Projekt, Kontext und Basissnapshot erneut und nutzt die
bestehende History: genau ein Undo-Schritt, Redo stellt dieselbe Aktion wieder her.
Keine neue UI oder Z-Mausbedienung; Werkzeugeigenschaft Z-Versatz bleibt unverändert.

Vier neue Tests vergleichen Vorschau mit vollständigem Commit, einschließlich Ecke,
T, gelöstem Nachbarn, Fenster, EG/OG-Auswahl, negativen/positiven Versätzen,
Nullbewegung, ungültigen Zahlen, stale/mutierter Basis, Abbruch und Undo/Redo.
Nächster Einzelauftrag: die bestehende 3D-Bewegungsinteraktion an diese Z-Aktion
anbinden, einschließlich gewähltem Ursprung, Z-Achse, Shift und gemeinsamer Präzision.
Keine neue werkzeugspezifische Höhenlogik; praktische Abnahme erfolgt dann im Canvas.

Nachweis Z-Aktion: 968 Tests bestanden; App-/Benchmark-Typecheck, gezieltes Lint und Produktionsbuild erfolgreich. Keine Browserabnahme behauptet: noch keine neue UI-Anbindung.


### AUD14-01 – begrenzter P0-Fix und Nachweis (14.10.2026)
Basis main 7621765, separater Zweig fix/recovery-resource-contract; PR318 bleibt
unverändert offen. Reproduktion mit neun echten, verschiedenfarbigen RGB-PNGs,
je 4000×4000 Pixel, bestätigte den Fehler: 646.910 Bytes portable Datei,
Import/Öffnen zulässig, Recovery-Schreiben und Lesen abgewiesen. Neun IDs mit
identischem Bild: 678.558 Bytes, Schreiben abgewiesen, Lesen zuvor akzeptiert.
Rohbefund lokal outputs/aud14-01/reproduction.json. Synthetische Vollbilder,
keine echten Architekturpläne und keine neue Kapazitäts-/RAM-Freigabe.

Gemeinsamer konservativer Vertrag in domain/project/raster-budget.ts:
128.000.000 Pixel je Projekt, Summe je logischem Asset. Identische Payload unter
mehreren Asset-IDs zählt mehrfach; mehrere Referenzen auf dieselbe Asset-ID zählen
nur einmal. Deduplizierte Blobzahl ist eine Speicheroptimierung, kein Zulässigkeits-
wechsel. Dekodierter Browser-/GPU-Bedarf kann davon abweichen und bleibt AUD14-06.
Bytebudget 128 MiB und Einzelbildbudget 16 Millionen Pixel unverändert.

Neue Referenzimporte und normale Modell-Commits dürfen die Rastergrenze nicht
überschreiten. Bereits überbudgetierte Projekte dürfen nicht weiter wachsen.
Gemeinsame V1/V2-Sicherung prüft vor Veröffentlichung; V2-Wiederherstellung zählt
zusätzlich logische Assetlinks wie der Schreibpfad und behält defensive Blobgrenzen.
Übergangsvertrag: Domain-Dateischema/Migration behalten vorhandene größere Dateien
lesbar. Explizites Datei-/Legacy-Laden ist erlaubt, ebenso Modelländerungen ohne
Budgetwachstum, Undo/Redo und verlustfreier Datei-Export. Warnung vor Ladeübernahme,
dauerhafter Canvas-Hinweis und rotes Recovery-Symbol melden ausdrücklich die nicht
mögliche lokale Sicherung. Keine Behauptung, dass Export den Datenträgerschreibvorgang
bestätigt. Kein Formatwechsel, keine Löschung existierender Snapshots oder Blobdaten.

Nachweise: gesamte Testsuite 972 Tests grün plus anschließend zwei zusätzliche
Grenzfalltests grün (974 insgesamt vorhandene Fälle); App-/Benchmark-Typecheck,
gezieltes Lint und Build. Neue sechs Tests: unter/an/über Pixelgrenze, neun reale
PNGs, Duplikatlinks/gemeinsame Referenzen, Import-/Commitgrenze, Altdatei/V24-Migration,
Unicode, Export, Undo/Redo, Snapshot-Abbruch und simulierte Quota-Publishfehler.
Browser auf Port8082 mit eigenem Testprojekt budget-ü: Altdatei laden mit Warnung,
Download enthält alle neun Assets/Referenzen exakt; manuelle Sicherung abgewiesen,
Autosicherungsstatus rot/pausiert. Acht Bilder am Grenzwert erfolgreich gesichert;
neun Bilder abgewiesen, Reload und Wiederaufnahme liefern den unveränderten
Acht-Bilder-Stand. Erneuter Export payload-/referenzgleich. Keine fremden Slots
verändert. Beleg outputs/aud14-01/legacy-warning.png. Physische Plattenfüllung,
reale Browser-Quota und schweres Gesamtprofil nicht neu simuliert; Langzeitaufbewahrung
und kombinierte Abnahme bleiben AUD14-06/07. AUD14-01: implementiert und fokussiert
geprüft, PR-Abnahme offen. Nächster aktiver Auftrag AUD14-02.


### AUD14-02 – gemeinsame Bewegungssnapshots ohne Payload-JSON (15.10.2026)

- `prepared-snapshot.ts` besitzt die validierte, eingefrorene Basis für XY und Z.
  Bestätigung prüft weiterhin Identität UND validierten vollständigen Inhalt mit
  `sameProjectContent`; keine reine Identitätsannahme für öffentliche mutable Eingaben.
  Unveränderte Bildhandles bleiben geteilt. Kein Gesamthash als Ersatz.
- Private Geschossableitungen in `prepared-translation.ts` teilen eine Basis.
  Geschossübergreifendes XY prüft die Basis einmal bei Vorbereitung und einmal
  bei Bestätigung, danach das zusammengesetzte Ergebnis vollständig. Kein öffentliches
  „already validated“-Flag; kein Teilcommit. Schraffur-No-op nutzt denselben Vergleich.
- Vergleichsprofil: Windows, Node 24.19.0, Basis `1fc8db9`, 1/2/5 Geschosse,
  eine Wand je Geschoss, konstante Auswahl von zwei Wänden bei 2/5 Geschossen;
  ohne Bilder und mit vier unveränderten synthetischen 8-MiB-Base64-Payloads.
  Erste Ausführung je Fall separat, danach fünf warme Läufe und jeweils 30 Pointerziele.
  Kein Prozess-Kaltstart, kein p95 und keine gesamte Frame-/UI-Zeit.
- Warme Mediane mit 32 MiB: fünf Geschosse XY Vorbereitung 32,425 → 0,202 ms,
  Pointer 0,019 → 0,023 ms, Bestätigung 176,629 → 0,406 ms;
  Z Vorbereitung 33,627 → 0,247 ms, Bestätigung 34,149 → 0,490 ms.
  Kleine Pointerdifferenzen sind keine belastbare Regression bei diesen Laufzeiten.
  Rohwerte und Browsernachweis: `benchmarks/translation-content-results.json`.
- Browser Chromium 155: Produktionsaktionen über Diagnoseentry mit 1/2/5 Geschossen,
  XY/Z, einem Historyschritt, Undo/Redo bestanden. Fünf Geschosse warmer XY-
  Bestätigungsmedian 0,5 ms. Keine Bilddekodierung und kein Renderingbenchmark.
- Regressionen: bestehende Anschluss-/Fenster-/Fremdendpunktvergleiche bleiben aktiv;
  neue Tests für Mehrgeschoss-Oraclegleichheit, mutierte Geometrie/Ebenen/Höhen/Bilder,
  stale Basis, No-op und Instrumentierung ohne Payloadserialisierung. Datei und Recovery
  verwenden echte PNGs; synthetische Payloads dienen nur dem isolierten Zeitprofil.
- Verifikation: 979 Tests, App-/Benchmark-Typecheck, gezieltes Lint und Produktionsbuild.
  AUD14-02 im begrenzten Umfang geprüft; neue PR-Abnahme offen. Schwere Gebäude-,
  GPU- und Langsessionabnahme bleiben AUD14-03 bis AUD14-07.
- Praktische Abnahme: zwei Wände über zwei Geschosse auswählen, frei bewegen,
  platzieren, einmal Undo und Redo; Fenster folgen genau einmal. Dasselbe mit
  Bildreferenzen wiederholen. Die bisherigen Bediengesten bleiben unverändert.
- Nächster Einzelauftrag AUD14-03: unveränderte 3D-Ressourcen bei Auswahl und
  Bewegung wiederverwenden, zunächst Ressourcen-/Uploadzähler und Auswahlwechsel.


### AUD14-03 – stabile 3D-Ressourcen und begrenzte Uploads (15.10.2026)

- `solid-renderer.ts` hält ein Programm und zwei Puffer über Auswahl-/Geometriewechsel
  hinweg. Canvas-Kontextverlust entsorgt sie wie bisher; Wiederherstellung erzeugt sie neu.
- `solid-buffer.ts` ist ein wegwerfbarer Darstellungs-Cache, kein zweites BIM-Modell.
  Ein gemeinsamer Geometriepuffer enthält stabile Wandbereiche. Gleicher Aufbau:
  nur geänderte Geometrie/Farben per `bufferSubData`; Auswahl bei gleichem Solid
  prüft nur vorher/nachher ausgewählte IDs. Vorschau-Umsortierung ändert keine Bereiche.
- Unveränderte Wände werden nicht neu trianguliert/verpackt/hochgeladen. Fensterlöcher,
  Beleuchtung, lokale Koordinaten, Tiefentest und bestehende Konturribbons bleiben erhalten.
- Bewusster Rückfall: andere Wandanzahl, andere Dreieckanzahl/Offsets oder neuer lokaler
  Ursprung erzeugen einen vollständigen Geometrie-Upload, aber kein neues Shaderprogramm.
  Neue Solids werden weiterhin insgesamt nach Wandgruppen durchsucht; Vorschaukomposition
  und Konturribbons bleiben unverändert. Keine vollständige lokale CPU-/GPU-Pipeline behauptet.
- Vorher/Nachher am Commit `a585b68`: Windows Node 24.19.0, WebGL-Befehlsrekorder,
  100/1.000/5.000 einfache Quad-Wände, feste kleine Auswahl; initial + sechs Auswahlwechsel
  + sechs Bewegungsupdates. Bei 5.000 Wänden: Programme 13 → 1, Puffer 26 → 2;
  Upload 9.360.000 Byte → 720.000 Byte initial plus 2.592 Byte Updates.
  Warme CPU-Mediane (fünf Updates nach erster Ausführung): Auswahl 16,903 → 0,035 ms,
  Bewegung 18,123 → 2,798 ms. Rekorderzahlen sind keine GPU-/Framezeiten.
- Chromium 155, echte WebGL-Ausgabe: **36 exakte Pixelvergleiche** zwischen wiederverwendetem
  und frischem Renderer bestanden (Wände mit Anschluss/Fenster, Auswahl, Vorschau, Abbruch,
  Sichtbarkeit, DPR1/2, Blick von oben/unten, Ursprung bei 1e9). Kontextverlust und
  Wiederherstellung bestanden. Rohwerte/Methodik: `benchmarks/solid-resource-results.json`;
  ausführbare Diagnose: `benchmarks/solid-resource.html`.
- Verifikation: 982 Tests, App-/Benchmark-Typecheck, gezieltes Lint und Produktionsbuild.
  Bestehende Vorschau-/Commit-/Fenster-Hitflächenregressionen bleiben aktiv.
  Neue PR-Abnahme offen. Schwere Schule, Gesamtframezeit und Langsession bleiben Abschlussgate.
- Praktische Abnahme: in 3D Wand auswählen/abwählen, bewegen und abbrechen; Fensteröffnung
  und stehende Nachbarwand müssen unverändert aussehen. Danach mit Shift platzieren und Undo.
- Nächster Einzelauftrag AUD14-04: Aufruf-/Kopierarbeit bei Geschoss-/Ansichtswechsel
  messen und unveränderte Gebäudeableitungen wiederverwenden.


### AUD14-04, Teil 1 – Gebäudeableitung über Arbeitsgeschosswechsel teilen (15.10.2026)

- Der bisherige Cache in `lib/bim/geometry.ts` galt nur für eine Projektidentität;
  `selectWorkingStorey` erstellt nach vollständiger Validierung einen neuen Kontext.
  Deshalb wurden alle Geschossflächen nach jedem Wechsel erneut abgeleitet.
- Neue Snapshotidentitäten werden weiterhin vollständig validiert. Der vorhandene
  konservative `sameProjectModel`-Vergleich kann danach eine unveränderte Gebäudeszene
  teilen. Sichtbarkeit und Arbeitsmaßstab bleiben separate Ansichtseinstellungen.
  Wand-/Fenster-/Höhen-/Datum-/Anschlussänderungen werden nicht so übergangen.
- Genau ein schwach referenzierter letzter Kandidat, kein Projekt-ID-Register und
  keine zusätzliche dauerhaft gehaltene Szenenhistory. Freigabe durch GC darf einen
  Cachemiss verursachen. Geteilte Szenen/Flächen/Vertices sind eingefroren, damit eine
  Änderung abgeleiteter Darstellungsdaten keine andere Ansicht beschädigen kann.
- Grenzen: bestehender Identitätscache setzt weiterhin immutable Snapshots voraus;
  keine neue öffentliche In-place-Mutationsgarantie behauptet. Für **neue** öffentliche
  Snapshots bleibt die Vollprüfung vor Wiederverwendung erhalten. Deren Validierung
  kopiert weiterhin Daten und prüft Anschlüsse; eine vollständig eigene geprüfte
  Snapshot-/Revisionsgrenze und weniger doppelte Validierungen sind noch offen.
- Profil Basis `81138b3`, Windows Node 24.19.0, fünf Geschosse mit je 10/50/100
  unabhängigen Wänden und Fenstern; sieben Geschosswechsel, erster separat und
  sechs warme Läufe. Bei 500 Wänden/Fenstern Gebäudeableitung inkl. Prüfung:
  warmer Median 29,263 → 4,866 ms. Geschossaktion selbst 3,768 → 3,919 ms;
  sie wurde nicht optimiert. Keine gesamte Framezeit-/p95-Behauptung.
- Chromium 155: sieben Geschosswechsel mit 500 Wänden/Fenstern, neuer Kontext bei
  gleicher Szene und **exakt gleichen WebGL-Pixeln**. Rohwerte/Methodik unter
  `benchmarks/building-view-results.json`, Browserentry `benchmarks/building-view.html`.
- 984 Tests, App-/Benchmark-Typecheck, gezieltes Lint und Produktionsbuild bestanden.
  Neue Tests: Kontextveraltung, Sichtbarkeit, Szenenimmutabilität, Änderung von
  Wand/Fenster/Höhe/Datum und ungültige neue Snapshots. UI/Projektformat bleiben gleich.
- Praktische Abnahme: zwischen vorhandenen Geschossen wechseln; Grundriss und aktive
  Zeichenebene wechseln, die gemeinsame 3D-Gebäudegeometrie bleibt unverändert.
  Wand anschließend ändern: 3D muss aktualisiert werden.
- **AUD14-04 ist teilweise, nicht vollständig erledigt.** Nächster einzelner Auftrag:
  bestehende Snapshot-Ownership und Identitätscache-Mutationsannahme absichern und
  doppelte Validierung an Ansichtseinstellungsgrenzen messen/begrenzt reduzieren.
  Danach verbleibende 3D-Vorschaupfade/Schraffurprüfungen; erst dann AUD14-05.


### AUD14-04, Teil 2 – Geprüfte Snapshot-Ownership und sicherer Gebäude-Cache (15.10.2026)

- PR #322 nach grüner CI ausdrücklich freigegeben und als Merge `5943fe3` übernommen.
- Reproduzierter Fehler: nach In-place-Änderung einer Wandhöhe gab der Identitätscache
  dieselbe veraltete Szene zurück. Der neue Regressionstest scheiterte vor dem Fix.
- `domain/project/owned-snapshot.ts` besitzt die gemeinsame Factory: vollständige
  Validierung, eigene tief eingefrorene Struktur und private WeakSet-Provenienz.
  Aufruferdaten werden nicht eingefroren; geprüfte immutable Bildhandles dürfen geteilt
  bleiben. Kein öffentliches Trusted-Flag. `validateProject` bleibt eine mutable Kopie.
- Gebäude-Cache darf nur für solche Snapshots die frühere Vollprüfung wiederverwenden.
  Veränderliche öffentliche Eingaben durchlaufen auch bei gleicher Identität die
  vollständige Prüfung; gültige Änderungen aktualisieren, ungültige werden abgewiesen.
  Selber einfrieren, Spread oder Type-Cast gewähren keinen ungeprüften Zugriff.
- Begrenzte Einführung: Arbeitsgeschosswechsel liefert einen solchen Snapshot;
  vorbereitete XY-/Z-Bewegungsbasen verwenden dieselbe Factory statt eigener Freeze-Logik.
  Platzierung prüft weiter vollständig; ein Undo-Schritt bleibt erhalten.
- Messung gegen `5943fe3`: fünf Geschosse/500 Wände und Fenster, erster Lauf separat,
  sechs warme Beobachtungen. Median Geschossaktion 3,335 → 4,764 ms (Freeze-Arbeit),
  anschließende Gebäudeabfrage 4,728 → 1,104 ms (keine zweite Vollprüfung).
  Separate wiederholte Abfrage: owned etwa 0,002 ms, mutable etwa 6,967 ms.
  Snapshot-Erstellung separat 9,493 ms. Keine Gesamtframe-/p95-Garantie;
  erster owned Cachelauf teilt bereits die mutable Szene, also kein Kaltstartvergleich.
- 987 Tests, beide Typechecks, gezieltes Lint und Produktionsbuild bestanden.
  Chromium 155: sieben Geschosswechsel mit exakt gleichen WebGL-Pixeln bestanden.
  Rohwerte und Grenzen: `benchmarks/building-ownership-results.json`;
  zusätzliche Messung `benchmarks/building-cache-profile.ts`.
- Praktische Abnahme: Geschoss wechseln, Wand bearbeiten, zwischen 2D/3D wechseln;
  Gebäude muss aktuell bleiben. Bewegung bestätigen und mit einem Undo zurücknehmen.
- **Grenze:** Nicht alle Projektzustände und anderen Identitätscaches sind bereits auf
  Ownership umgestellt. Mutable Eingaben verursachen jetzt bewusst Prüfkosten; bei
  Neuaufbau von Projektions-/Kamerakontexten können diese mehrfach auftreten. Die
  memoisierten Ursprungsabfragen validieren nicht pro Zeigerabfrage erneut.
- **Ein nächster aktiver Auftrag (AUD14-04):** gemeinsamen vorbereiteten 3D-Abfragekontext
  für stabile Modellbasis untersuchen und begrenzt auf owned Snapshots umstellen, sodass
  Kamera-/Projektionswechsel keine wiederholte Modellprüfung auslösen. Zielkontext und
  Sichtbarkeit müssen aktuell bleiben; Vergleich mit vollständigem Pfad und Messung.
  Anschließend verbleibende direkte 3D-Vorschau-/Schraffurprüfungen; AUD14-05 noch nicht starten.


### AUD14-04, Teil 3 – Stabile Modellbasis für 3D-Abfragen (15.10.2026)

- PR323 nach grüner CI freigegeben und als `819cef9` in main zusammengeführt.
- `rendering/viewport/prepared-model.ts` kapselt einen geprüften immutable Snapshot
  und bindet ihn privat an den ursprünglichen Projektkontext. Kein globaler Cache nach
  mutable Projektidentität; Aufrufer besitzen die Lebensdauer. Kopierte/fremde Tokens
  werden abgewiesen. Neue Projektidentität erfordert neue Vorbereitung.
- BimSolidView bereitet pro Projektidentität eine gemeinsame Basis vor. Darstellung,
  Wandfang, Fußkanten, erhöhte Arbeitsebene und Bewegungsursprung greifen darauf zu.
  Kamera, Projektion, Sichtbarkeit und Hover-/Bearbeitungssitzung bleiben getrennt.
  Identitätsprüfungen verwenden weiterhin das ursprüngliche Projekt; Ebenenfilter
  bleiben aktuell. Kein zusätzlicher veränderlicher Modellbestand, kein neues Undo.
- Bewegungs-Eckcache ist nun an die eingefrorene abgeleitete Szene gebunden, statt an
  einen möglicherweise veränderten öffentlichen Projekteingang. Ergebnisse sind
  eingefroren; mutable direkte Aufrufe werden weiter vollständig geprüft.
- Expliziter Vertrag: eine vorbereitete Basis ist eine Momentaufnahme. In-place-
  Änderung des Ursprungs verändert sie nicht. UI-Modelländerungen liefern neue
  Identitäten; abschließende Modellvalidierung bleibt außerhalb dieser Lesebasis.
- 989 Tests bestanden. Neue Tests vergleichen 216 Fang-/Kontextresultate über Kamera,
  Zoom, Höhen, Ebenensichtbarkeit und bewegte Wände; fremde/veraltete Kontexte werden
  abgewiesen. Kamerakontextaufbau liest ursprüngliche Validierungsdaten nicht erneut.
  App-/Benchmark-Typecheck, gezieltes Lint und Produktionsbuild bestanden.
- Chromium 155: sechs exakte WebGL-Pixelvergleiche und 48 Fangabfragen bei 500 Wänden
  und 500 Fenstern erfolgreich. Diagnose: `benchmarks/query-context.html`.
- Profil gegen `819cef9`: sieben Kamerazustände, erste Ausführung separat, sechs warme
  Beobachtungen. Median Kontextaufbau 32,377 → 18,108 ms; zusätzliche einmalige
  Vorbereitung 11,016 ms. Erster Kontextaufbau 225,108 → 194,087 ms.
  Rohwerte/Methodik: `benchmarks/query-context-results.json`. Keine Gesamtframe-/p95-
  Garantie. Eckprojektion, globale Scans und erste Geometrievorbereitung bleiben teuer;
  lokale 3D-Kandidatensuche ist weiterhin AUD14-05, nicht als erledigt bezeichnet.
- Praktische Abnahme: 3D-Bewegung beginnen, Ursprung an einer Wandecke wählen;
  Kamera orbitieren/zoomen, mit Shift ausrichten, abbrechen und erneut platzieren.
  Verdeckte/ausgeblendete Wände dürfen nicht zu Fangzielen werden; Undo unverändert.
- **Nächster einzelner Auftrag AUD14-04:** direkte 3D-Einzelelementvorschau für Wand
  und Fenster messen, globalen Prüf-/Ableitungspfad eingrenzen und ersten begrenzten
  vorbereiteten Pfad gegen vollständige Validierung vergleichen. Danach verbleibende
  Schraffurprüfung; AUD14-05/06/07 bleiben offen.


### AUD14-04, Teil 4 – Vorbereitete Fenster-Achsvorschau (15.10.2026)

- PR324 nach grüner CI freigegeben und als `58596a3` in main übernommen.
- Fenster-Achsvorschau bislang: `editAtPointer`/`updateWindow` prüft das ganze Projekt,
  `buildBuildingSolid` prüft und leitet anschließend das ganze Gebäude erneut ab.
- Neuer Application-Pilot `prepareWindowAxisPreview`: vollständiger geprüfter Snapshot
  einmalig, vollständige Anschlussgruppe der Fensterwand einschließlich aller Fenster
  darin. Gemeinsame `wallDependencyClosure` auch für bestehenden XY-Vorschaupfad genutzt.
- Fachlogik unverändert: vorhandenes `editAtPointer` auf lokalem Berechnungsprojekt;
  darin bleiben Geschossstruktur/-höhen erhalten, fremde Bauteile und Referenzbilder
  sind ausgeklammert. Dieses Hilfsprojekt ist ausschließlich Berechnungsumfang und
  wird niemals persistiert oder bestätigt. Keine eigene Fenster-/Cap-/Anschlusslogik.
- 3D ersetzt über vorhandene `GeometryPreview`-Komposition nur diese Wände/Fenster.
  Öffnung und Auswahlkontur verwenden denselben Patch. Fenster ignorieren weiterhin
  T-Anschlusspositionen; Wandenden/Eckabschlüsse begrenzen weiterhin wie zuvor.
  Andere Direktbearbeitungen behalten ihren vollständigen Pfad.
- Bestätigung weiterhin vollständig über `fullEdit`; keine Übernahme der lokalen
  Vorschau als Projekt. Auswahl-/Snapshotwechsel abgewiesen, ungültige Ziele halten
  die bestätigte Basis. Ein Undo-Schritt und Abbruch bleiben unverändert.
- 991 Tests bestanden; neue Vergleichstests: beide Eckabschlüsse, Doppel-T,
  Nachbarfenster, Wandenden/Cap, erhöhte Geschosse und Wandversatz, unveränderte
  Nachbarflächen, ungültige/stale Eingaben, volle Bestätigungsprüfung und ein Undo.
  App-/Benchmark-Typecheck, gezieltes Lint, Produktionsbuild bestanden.
- Chromium 155: acht exakte Pixelvergleiche einschließlich Fensterkontur bei zwei
  Kamerawinkeln und Zielpunkten innerhalb/außerhalb der Wandgrenzen bestanden.
- Messung: 500 unabhängige Wände/Fenster, fünf Geschosse, ein betroffener Wandkörper;
  einmalige Vorbereitung 7,636 ms. Sechs warme Zielpunkte: Median vollständiger Pfad
  54,405 → vorbereiteter Pfad 14,374 ms. Erste Ausführung separat dokumentiert.
  Keine Gesamtframe-/p95-Garantie; `benchmarks/window-preview-results.json` enthält Rohdaten.
- Grenzen: vollständige Anschlussgruppen können groß bleiben. Szenenkomposition,
  Bounds und Fensterkonturen haben weiterhin globale Arbeit. Noch kein optimierter
  direkter Wand-Endpunktpfad und keine abgeschlossene Schraffurprüfung.
- Abnahme: Fenster in 3D auf seiner Wand verschieben, auch über Doppel-T und über
  Wandenden hinaus. Kontur/Öffnung müssen gemeinsam folgen; Klick platziert, Undo
  stellt Ausgangslage wieder her. Ebenenfilter und anderes Geschoss prüfen.
- Nächster einzelner Auftrag AUD14-04: direkte Wand-Endpunktvorschau messen und
  vorbereiteten Bereich mit vollem Fallback sicher vergleichen. Danach Schraffurprüfung.

### Nutzerhinweis für AUD14-05 – Hilfspunkte an ihre Quellen binden (15.10.2026)

Der Vorschlag ist sinnvoll und teilweise vorhanden: `SnapReference.entityId` und
`feature` identifizieren Element/Merkmal; konstruierte Punkte führen `dependencies`.
Keine eigene Rasterengine je Wand und keine Hilfspunkte als zusätzliche BIM-Bauteile.
Bei AUD14-05 Quellenzuordnung für lokale Suche/gezielte Invalidierung nutzen; bei
Schnittpunkten alle beteiligten Quellen erhalten. Die Zuordnung allein ersetzt
keinen räumlichen Index und löst globale Projektionsarbeit nicht automatisch.

### AUD14-04 – Gemeinsamer Einstieg statt weiterer Renderer-Sonderfälle (15.10.2026)

Nutzerkritik übernommen: Die gemeinsamen Regeln waren in einzelnen Altpfaden noch nicht
konsequent umgesetzt. PR325 ist freigegeben und gemergt. Der Fensterpilot wird nun über
`prepareDirectEditPreview` angebunden; BimSolidView kennt dafür keinen Fenstertyp-Schalter
mehr. Die bestehenden Vergleichs- und Commit-Tests laufen über diesen Einstieg.
Nicht migrierte Operationen liefern ausdrücklich keine vorbereitete Fähigkeit und bleiben
vorerst auf dem bisherigen Pfad. Kein zusätzlicher Geschwindigkeitsgewinn behauptet.
A04 und AGENTS verlangen die Wiederverwendung und Nachweise auch für künftige Bauteile.
Nächster einzelner Auftrag bleibt die direkte Wand-Endpunktvorschau: über denselben Einstieg
integrieren, gegen den vollständigen Pfad vergleichen und messen. Kein neuer UI-Typschalter.

Nachweis dieses Schritts: 992 Tests bestanden, App-/Benchmark-Typecheck, gezieltes Lint und Build erfolgreich. Bestehende Geometrie-/Kontur-/Commit-Vergleiche laufen durch den gemeinsamen Einstieg; unbekannte Operation und ungültiges Ziel zusätzlich geprüft. Keine neue Browserabnahme oder neue Performancezahl für diese verhaltensgleiche Umverdrahtung behauptet.

### AUD14-04, Teil 5 – Wand-Endpunktpatch im gemeinsamen Einstieg (15.10.2026)

PR326 nach Freigabe und erfolgreicher CI gemergt (f946825). `prepareDirectEditPreview`
registriert den vorhandenen begrenzten T-Hauptwand-Piloten als weiteren Application-Adapter.
Keine zusätzliche Typentscheidung in BimSolidView. `prepareEndpoint.evaluateGeometry`
liefert die lokale Anschlussgruppe direkt an die bestehende Patchkomposition; sein bisheriger
Projektpfad bleibt für 2D erhalten. Gemeinsame Snapshot-Ownership und wallDependencyClosure
ersetzen die bisherige eigene Anschlussgraphsuche. Andere Geschosse sind im lokalen
Berechnungsprojekt leer; ihre Flächen bleiben in der Darstellung wiederverwendet.

Grenze ausdrücklich: Punktaktion am Achsende Index 1 einer T-Hauptwand. Nur axiale
Verlängerung ohne Eckanschlussgruppe/fremden Endpunktkontakt läuft lokal. Kürzen, schräge
Ziele und neue T-Fanganschlüsse verwenden weiterhin den vollständigen Fachpfad. Neue
T-Fanginformationen werden durch den gemeinsamen Vorschauvertrag transportiert.
Die ausgewählte Wandachse liest ebenfalls den angezeigten Patch, damit sie nicht zurückbleibt.
Commit bleibt unverändert vollständig validiert und erzeugt einen Undo-Schritt.

Nachweis: 996 Tests, beide Typechecks, gezieltes Lint und Build bestanden. Vergleich umfasst
T-/Doppel-T-/Eckabhängigkeiten, stationäre Partner/Fenster, Mehrgeschosse mit Wandhöhenversatz,
fremde Endpunkte/Mehrfachknoten, T-Fang, ungültige Ziele, geänderten Kontext, Abbruch und Undo.
Browser Chromium155: acht pixelgleiche Darstellungen einschließlich Auswahlkontur sowie
acht Achsenvergleiche gegen Vollableitung. Diagnose: benchmarks/wall-patch.html.

Messung mit 502 Wänden und 502 Fenstern auf fünf Geschossen: warme Mediane
38.01 ms (Projektvorschau + Gebäudeableitung) gegenüber 13.27 ms (Patch + Komposition),
einmalige Vorbereitung 8.92 ms. Zwei Wände im lokalen Berechnungsumfang.
Ein erster und acht warme Werte, wechselnde Reihenfolge, Rohdaten/Methodik in
`benchmarks/wall-patch-results.json`. Keine Gesamtframe-/GPU-/Heapgarantie. Die Vergleichsbasis
nutzt bereits den aktuellen gemeinsamen prepareEndpoint; kein historischer Commitvergleich.
Globale Komposition und Fremdendpunktsuche sowie breite Anschlussgruppen bleiben offen.

Einziger Folgeauftrag: die noch vollständigen Wand-Endpunktfälle (Anfang/Kürzen/schräg)
gegen denselben Vertrag und ihre Abhängigkeitsgrenze prüfen. Danach verbleibende
Schraffurprüfungen in AUD14-04; AUD14-05/06/07 bleiben offen.

### AUD14-04, Teil 6 – Beide Wandachsenden und gelöste Anschlüsse (15.10.2026)

PR327 nach erfolgreicher CI und Freigabe gemergt (035052c). Der vorhandene prepareEndpoint-
Pfad verarbeitet beide Achsenden einschließlich Kürzen/schräger Punktbewegung, Einzelwände,
Haupt-/Nebenwände und Eckanschlussgruppen. 2D-Projektvorschau und 3D-GeometryPreview nutzen
dieselbe Vorbereitung und editAtPointer als Fachoperation. Keine neue Renderer-Typentscheidung.
Die ursprüngliche vollständige Anschlussgruppe bleibt nach Lösen erhalten: stationäre Partner
bekommen ihre korrekte Kontur. Unabhängige Beziehungen und ihre Reihenfolge bleiben im
materialisierten 2D-Projekt erhalten. Fenster, vollständiger Commit und ein Undo unverändert.

Fremdkontakte werden anhand tatsächlich berechneter Achsenden erkannt. Fremde Endpunkte,
neuer T-Fang und lokale Berechnungsfehler verwenden weiter den Vollpfad. Körper-Eckgriffe,
Stretch und andere Gesten bleiben Legacy. Fremdendpunktsuche und Komposition sind noch
global; große Anschlussgruppen bleiben mögliche Kosten. Keine allgemeine Performancezusage.

Nachweis: 999 Tests, beide Typechecks, gezieltes Lint und Build bestanden. Vergleich der
2D-Projektinhalte, 3D-Flächen/Fenster und markierten Achse mit der vollständigen Operation:
beide Enden, Kürzen/schräg, T/Doppel-T/Ecke, Mehrgeschosse/Höhenversatz, fremde Knoten,
T-Fang, ungültige/stale Ziele, Abbruch und Undo. Chromium155: 16 exakte Pixel-/Achsenvergleiche.

Vollaktion + Gebäudeableitung gegen Patch + Komposition, warme Mediane:
- start, 502 Wände/Fenster: 34.12 → 12.32 ms.
- shorten, 502 Wände/Fenster: 32.78 → 10.05 ms.
- oblique, 502 Wände/Fenster: 30.49 → 9.15 ms.
Methodik/Rohdaten: benchmarks/shared-endpoints-results.json. Ein erster und acht warme Werte
je Profil, Reihenfolge alterniert; Vorbereitung separat. Kein historischer Commitvergleich,
kein GPU-/Heap-/Gesamtframenachweis. Frühere Pilotmessung separat erhalten.
Einziger Folgeauftrag: verbleibende Schraffur-Geometrieprüfungen im Pointerpfad messen und
sicher vorbereiten (AUD14-04). Weitere Wandgesten bleiben dokumentierte Migrationsschuld;
AUD14-05/06/07 sind weiterhin offen.


### AUD14-04 Teil 7 – Räumliche Konturprüfung (15.10.2026)

PR328 nach ausdrücklicher Freigabe und grüner CI gemergt (6e4df27).
Befund: prepareStoreyTranslation prüft verschobene Schraffuren je Ziel mit hatchSchema;
auch direkte Konturaktionen erreichen validateSimplePolygon. Dessen Bounds-Vorfilter
wurde bisher erst nach Bildung jedes Kantenpaares angewendet.

Gemeinsamer Fix in Geometry: vorhandener createBoxIndex begrenzt Kandidaten für
Konturen über 128 Punkte. Modelltoleranz plus Rundungsreserve erweitern die Suche;
unveränderte exakte Kontaktprädikate und Paarreihenfolge erhalten das Ergebnis
inklusive erster Fehlerstelle. Kleine Konturen behalten den einfachen Pfad.
Keine Werkzeugkopie, keine Rendereränderung, keine ungeprüfte Translationsannahme:
bei großen Koordinaten kann auch verschobene Geometrie kollabieren. Vollständige
Commit-Prüfung und History bleiben erhalten. Indexaufbau weiterhin pro Prüfung.

Nachweis: 1002 Tests, beide Typechecks, fokussiertes Lint und Produktionsbuild.
Eingefrorener bisheriger Validator als Oracle für konvexe/konkave, berührende,
vertauschte, kollabierende und nicht endliche Konturen. Große Schraffurbewegung:
Vorschau/Projektvergleich, stale Kontext, numerischer Kollaps und genau ein Undo.
Keine neue visuelle Browserabnahme für diesen internen Geometriefix behauptet.

Messung: benchmarks/polygon-validation-results.json; reine Polygonprüfung inklusive
Indexaufbau, ein erster und acht warme Werte, alternierende Reihenfolge.
500 Punkte warme Mediane: konvex 4,84 → 1,83 ms, gezackt 6,58 → 4,09 ms.
2000 Punkte: 67,24 → 4,15 ms bzw. 119,38 → 64,75 ms. Kleine Fälle sind
rausch-/Overhead-empfindlich. Keine Gesamtframegarantie; dicht überlappende Bounds
bleiben quadratisch, Kandidaten werden nicht abgeschnitten. Wiederholte Prüfungen
unveränderter Schraffuren im vollständigen Legacy-Projektpfad bleiben offen.

Einziger Folgeauftrag: direkte Schraffur-Punktvorschau über gemeinsamen vorbereiteten
Application-Einstieg begrenzen; Vollpfad-/Commit-/Undo-Gleichheit und Pointerarbeit
messen. AUD14-04 bleibt offen, AUD14-05/06/07 folgen danach. A04 gilt weiter.


### AUD14-04 Teil 8 – Vorbereitete Schraffur-Punktvorschau (15.10.2026)

PR329 nach expliziter Freigabe und erfolgreicher CI gemergt (563c424).
prepareDirectEditPreview registriert die Punktbearbeitung einer Schraffur. Einmalig
validierter eigener Snapshot, lokaler Berechnungsumfang genau diese Schraffur;
Geschoss-/Ansichtsmetadaten und Musterdefinitionen bleiben erhalten. Die unveränderte
Fachoperation editAtPointer berechnet und validiert den Zielpunkt. Keine neue Punkt-,
Muster-, Fang- oder UI-Logik. Der gemeinsame Vertrag bietet optional eine abgeleitete
Projektansicht für Legacy-2D-Verbraucher; der Controller nutzt sie sitzungsgebunden.
Keine Renderer-Typabfrage hinzugefügt. Unbetroffene Elemente und andere Geschosse
bleiben referenziell erhalten. Platzieren bleibt fullEdit mit Gesamtprojektprüfung,
atomarer History und einem Undo; der lokale Projektumfang wird niemals veröffentlicht.

Nachweis: 1005 Tests, App-/Benchmark-Typecheck, fokussiertes Lint und Build bestanden.
Exakter Projekt-/Planszenenvergleich bei 4/129/500 Punkten, erster/innerer/letzter Griff,
Musterrotation/-ursprung, andere Schraffuren und Geschoss, ungültige Konturen/Ziele,
stale Kontext, Abbruch, ein Undo und ungültiger unbetroffener Inhalt beim Commit.
Keine Renderingänderung und keine neue visuelle Browserabnahme behauptet.

Messung: benchmarks/hatch-point-results.json, Node, Vorbereitung separat, ein erster
plus acht warme Ziele, Reihenfolge alterniert. Reine Vorschau ohne Rendering:
100 Schraffuren mit je 100 Punkten: Vollpfad 69,34 ms → vorbereitete Projektansicht
0,78 ms (Patch 0,87 ms), Vorbereitung 43,12 ms. 500 Vierecke: 11,69 → 0,17 ms.
Eine einzelne 500-Punkt-Kontur: 3,45 → 3,71 ms, also KEIN Gewinn für diesen Fall.
Der Zielpolygon wird weiterhin vollständig geprüft; Metadaten/Musterbibliothek,
Projektmaterialisierung und Darstellung können weiter skalierende Kosten enthalten.
Keine allgemeine Framezeitgarantie. Seitenstrecken/Offset/weitere Gesten bleiben Legacy.

Abnahme: Schraffur mit Muster markieren, ersten und letzten Eckgriff bewegen, abbrechen,
erneut bewegen und platzieren. Musterlage und übrige Elemente müssen erhalten bleiben;
ein Undo stellt die Ausgangskontur wieder her.
Einziger Folgeauftrag: bereits vorhandene vorbereitete Prüfung veränderter Polygonkanten
für die Schraffur-Punktvorschau auf sichere Wiederverwendung prüfen, integrieren und mit
vollständiger Konturvalidierung vergleichen/messen. AUD14-04 bleibt offen; danach 05/06/07.


### AUD14-04 Teil 9 – Veränderte Schraffurkanten prüfen (15.10.2026)

PR330 nach ausdrücklicher Freigabe und grüner CI gemergt (0a159ef).
Der bestehende vorbereitete Schraffur-Punktadapter nutzt preparePolygonVertexEdit.
Diese gemeinsame Geometry-Funktion validiert die Ausgangskontur einmal und prüft
je Ziel nur Kontaktpaare mit den beiden veränderten Kanten. Endlichkeit, Nullkanten,
Fläche und numerischer Bereich bleiben konturweit geprüft. Keine separate Kontakt-
oder Toleranzregel. translatePoint bewahrt die arithmetische Reihenfolge im Vollpfad
und vorbereiteten Pfad. Nichtgeometrische Schraffurfelder sind durch den eigenen
validierten, unveränderlichen Projektsnapshot festgelegt; Musterursprung/-rotation,
Ebene, ID und Darstellung ändern sich nicht. Zurückgegebene Schraffurdaten sind
unveränderlich. Kein lokales Teilprojekt und keine Gesamtprojektprüfung je Pointer.

Vollständige Platzierung weiter über fullEdit/commitProject, genau ein Undo.
1007 Tests bestanden, beide Typechecks, gezieltes Lint, Produktionsbuild bestanden.
Zusätzliche Vollpfadvergleiche: konkave Konturen, zufällige gültige/ungültige Ziele,
Selbstüberschneidung, erste/innere/letzte Ecke, große Koordinaten, abweichender Ursprung,
Mutation des Aufrufers/der Vorschau. Vorhandene Muster-/Planszenen-/Abbruch-/Undo-
und vollständige Commit-Tests bleiben bestehen. Keine Renderingänderung und kein
neuer visueller Browsernachweis für diesen internen Prüfpfad behauptet.

benchmarks/hatch-contour-results.json: Node; Vorbereitung separat, ein erster und
acht warme Ziele, wechselnde Reihenfolge. Im selben Lauf Vergleich mit vollständiger
Projektaktion und vorherigem Pilot (Vollkonturprüfung auf einer einzelnen Schraffur).
500-Punkt-Einzelschraffur: vorheriger Pilot 3,26 ms → 0,32 ms Projektvorschau,
Patch 0,23 ms; Vorbereitung 11,11 ms. 100 Schraffuren/je 100 Punkte: 0,96 → 0,03 ms;
500 Vierecke: 0,21 → 0,03 ms. Keine Gesamtframe-/GPU-Garantie. Frühere Messdatei
hatch-point-results.json bleibt als historischer Nachweis erhalten.

Grenzen: Konturkopie, globale Konturkennwerte, Prüfpaare und Legacy-Projektansicht
bleiben proportional zur jeweiligen Datenmenge; Darstellung bleibt separat.
Seitenstrecken/Offset sind noch nicht migriert. Keine pauschale A04-Gesamtfreigabe.
Abnahme: komplexe Musterschraffur an einer Ecke bewegen, ungültige Überkreuzung
versuchen, abbrechen oder gültig platzieren; einmal Undo stellt Ausgangszustand her.
Einziger Folgeauftrag: Seitenstrecken von Schraffuren auf denselben vorbereiteten
Application-Vertrag begrenzen, einschließlich Cap/Vorschau und Vollpfadvergleich.
AUD14-04 bleibt aktiv; AUD14-05/06/07 folgen weiterhin danach.


### AUD14-04 Teil 10 – Vorbereitete Schraffur-Seitenstreckung (15.10.2026)

PR331 nach expliziter Freigabe und grüner CI gemergt (1834600).
Der vorhandene Schraffur-Adapter verarbeitet Punkt und Seite über denselben
Application-Vertrag. prepareContourEdgeEdit kapselt die bestehende Cap-Berechnung
und die bestehende Prüfung veränderter Polygonkanten. Target-Cap und Vorschaugeometrie
verwenden dieselbe Sitzungsvorbereitung mit letztem Eingabe-/Ausgabepunkt; ein bereits
begrenzter Punkt wird nicht erneut verschoben. Die Cap-Algorithmik bleibt unverändert.
Auch Linien verwenden die gemeinsame Cap-Vorbereitung, ihre Projektvorschau bleibt
jedoch Legacy. Keine neue Renderer-Typabfrage oder separate Fang-/Formularlogik.

Eigener validierter Snapshot fixiert die übrigen Schraffurfelder. Eine vorgewärmte
Cap-Basis wird bei Vorbereitung gegen die eigenen Konturpunkte abgeglichen, damit
keine ältere Kontur übernommen wird. Ausgabe mutiert die Basis nicht. Platzieren
bleibt editAtPointer/fullEdit mit vollständiger Kontur-/Projektprüfung und einem Undo.

1010 Tests, App-/Benchmark-Typecheck, gezieltes Lint und Build bestanden. Vergleich
mit vollständiger Aktion und ursprünglichem prepareContourEdge: Rechteck, spitzes
Dreieck, konkave Kontur, beide Umlaufrichtungen, erste/letzte Seite, 500 Punkte,
rohe/bereits begrenzte Ziele, Rückbewegung, falscher Kontext, nicht endliche Eingaben,
veränderte vorgewärmte Basis, Muster-/Planszene, Abbruch und ein Undo. Ungültiger
unbetroffener Projektinhalt blockiert weiterhin die Bestätigung. Keine Renderingänderung
und kein neuer visueller Browsernachweis für diesen internen Vorschaufix behauptet.

Rohdaten: benchmarks/hatch-edge-results.json. Node, unabhängige Sitzungs-/Cap-Caches
für beide Pfade, wechselnde Reihenfolge, ein erster und acht warme Zielwerte;
Vorbereitung separat, Cap-Arbeit eingeschlossen. Warme Mediane Vollpfad → Vorschau:
- eine 500-Punkt-Schraffur: 18,62 → 10,52 ms; Vorbereitung 12,10 ms.
- 100 Schraffuren mit je 100 Punkten: 77,69 → 1,71 ms; Vorbereitung 45,90 ms.
- 500 Vierecke: 16,25 → 0,12 ms; Vorbereitung 8,17 ms.
Keine Gesamtframe-/GPU-Garantie. Konturgröße, Kontakt-/Cap-Ereignisse, Projektmaterialisierung
und Darstellung bleiben Kosten. Der dichte Cap-Fall wird nicht als konstant schnell erklärt.

Abnahme: Seite einer spitzen/konkaven Musterschraffur weit über den zulässigen Bereich
ziehen; Vorschau bleibt am bisherigen Cap, Zurückziehen funktioniert. Abbrechen oder
platzieren und einmal Undo. Muster und andere Elemente müssen erhalten bleiben.
Einziger Folgeauftrag: Offset-Vorschau von Schraffuren über denselben vorbereiteten
Application-Vertrag begrenzen, vorhandene Mindestgröße/Cap-Regel und Vollpfad vergleichen.
AUD14-04 bleibt aktiv; AUD14-05/06/07 folgen danach.


### AUD14-04 Teil 11 – Vorbereitete Schraffur-Offsetvorschau (15.10.2026)

PR332 nach ausdrücklicher Freigabe und grüner CI gemergt (ee48dbe).
Der vorhandene Schraffur-Adapter verarbeitet jetzt auch Offset. offsetContourPoints
ist die gemeinsame Punktableitung für Vollaktion und Vorschau; die bestehende
prepareConvexOffset-Berechnung einschließlich konvexer Fähigkeitsgrenze, numerischem
Boden und 1-%-Mindestlänge je Kante bleibt unverändert. Kein proportionaler BIM-Scale.

Weil Offset jeden Punkt verändert, wird die vollständige resultierende Kontur weiterhin
mit validateSimplePolygon geprüft. Gespart werden erneute Prüfungen unveränderter
Projektteile und Schraffureigenschaften; deren Gültigkeit ist im eigenen unveränderlichen
Snapshot festgelegt. Keine neue Renderer-Typabfrage, keine zweite Offset-/Fanglogik.
Nullindex entspricht wie im Vollpfad Kante 0. Musterursprung/-rotation, Modell-/Papiermaß,
Layer/ID und Darstellung bleiben erhalten. Platzierung weiterhin vollständig validiert,
atomar und mit genau einem Undo; Vorschau bleibt abgeleitet und verwerfbar.

1013 Tests, App-/Benchmark-Typecheck, gezieltes Lint und Build bestanden. Exakte
Projekt-/Planszenenvergleiche: beide Umlaufrichtungen, kleine Konturen bis 0,00001-facher
Größe, große Koordinaten, rohe und begrenzte Ziele, wiederholte Mindestgrenze/Rückweg,
Papiermuster, anderes Arbeitsgeschoss, ungültige/konkave/nicht endliche Ziele und Kontext,
Abbruch/Undo sowie vollständige Commit-Prüfung unbetroffener Elemente. Keine Änderung
am Rendering und keine neue visuelle Browserabnahme behauptet.

Rohdaten benchmarks/hatch-offset-results.json: unabhängige Sitzungs-/Cap-Caches,
Vorbereitung separat, ein erster und acht warme Werte mit wechselnder Reihenfolge;
exakte Projektgleichheit je Ziel. Warme Mediane Vollpfad → vorbereitete Projektvorschau:
- einzelne 500-Punkt-Kontur: 5,12 → 1,39 ms; Vorbereitung 14,35 ms.
- 100 Schraffuren mit je 100 Punkten: 69,17 → 0,27 ms; Vorbereitung 43,26 ms.
- 500 Vierecke: 16,61 → 0,03 ms; Vorbereitung 8,81 ms.
Keine Gesamtframe-/GPU-Garantie. Vollständige Zielkonturprüfung, materialisierte
Projektansicht und Darstellung bleiben Kosten; keine konstante Komplexität behauptet.

Abnahme: Musterschraffur nach innen über die Mindestgröße ziehen, wieder nach außen,
abbrechen oder platzieren und einmal Undo; Musterlage und übrige Elemente erhalten.
Einziger Folgeauftrag: Schraffur-„Knicken“ (Punkt einfügen) im gemeinsamen vorbereiteten
Vertrag begrenzen; Punktanzahlgrenze und vollständige Kontur-/Commitprüfung erhalten.
AUD14-04 bleibt aktiv, AUD14-05/06/07 folgen danach. Andere Legacy-Pfade bleiben offen.


### AUD14-04 Teil 12 – Vorbereitete Schraffur-Knickvorschau (15.10.2026)

PR333 nach ausdrücklicher Freigabe und grüner CI gemergt (cdc6fd2).
Punkt einfügen verwendet denselben Application-Vorschauadapter wie Punktbewegung,
Seitenstreckung und Offset. Die gemeinsame Geometriefunktion prepareContourInsertion
besitzt eine kopierte, einmal geprüfte Ausgangskontur und verwendet die bestehende
Punktableitung. Jede Zielkontur wird weiterhin vollständig auf Gültigkeit und Umlaufrichtung
geprüft. MAX_HATCH_POINTS ist die gemeinsame Grenze für Schema und Vorbereitung:
9.999 auf 10.000 Punkte zulässig, darüber abgewiesen. Keine neue Renderer-/Fanglogik.
Platzieren bleibt auf dem vollständigen Projektprüfpfad, atomar mit einem Undo.

1016 Tests, App-/Benchmark-Typecheck, gezieltes Lint und Build bestanden. Verglichen:
Projekt, Geometriepatch und Planszene, konkave Kontur, beide Umlaufrichtungen,
erste/letzte Kante, absolute Zielposition unabhängig vom Ursprung, ungültige Ziele,
Punktanzahlgrenze, Kontextwechsel, Abbruch, Undo und unbetroffene ungültige Elemente
beim Commit. Muster und übrige Projektelemente bleiben erhalten.
Keine neue visuelle Browserabnahme behauptet; der Renderer bleibt unverändert.

Rohdaten: benchmarks/hatch-insert-results.json. Node; Vorbereitung separat,
ein erster und acht warme Werte mit wechselnder Reihenfolge und exakter Projektgleichheit.
Warme Mediane Vollpfad → vorbereitete Vorschau:
- eine 500-Punkt-Kontur: 6,53 → 1,17 ms; Vorbereitung 13,45 ms.
- 100 Schraffuren mit je 100 Punkten: 76,41 → 0,30 ms; Vorbereitung 55,28 ms.
- 500 Vierecke: 15,61 → 0,03 ms; Vorbereitung 8,62 ms.
Keine Gesamtframe-/GPU-Garantie. Vollständige Zielkonturprüfung und Projektmaterialisierung
bleiben Kosten. Weitere Legacy-Vorschauen sind noch nicht durchgehend vorbereitet.

Abnahme: Musterschraffur auswählen, an erster/letzter Seite „Knicken“ starten,
Punkt verschieben, abbrechen beziehungsweise platzieren und einmal Undo.
Einziger Folgeauftrag: AUD14-04-Abschlussprüfung der verbliebenen Legacy-Vorschaupfade
mit einer konkreten Pfad-/Kostenliste und priorisiertem Restbefund. Dabei keine neuen
Werkzeugmigrationen beginnen; daraus den nächsten begrenzten Fix oder AUD14-05 ableiten.
AUD14-04 bleibt bis zu dieser Prüfung offen; AUD14-05/06/07 bleiben erhalten.


### AUD14-04 Teil 13 – Restpfade und Priorisierung (15.10.2026)

PR334 nach ausdrücklicher Freigabe und grüner CI gemergt (bbcefef).
Dies ist eine Bestandsprüfung, keine neue Werkzeugmigration und kein Abschluss des
Gesamtpunkts. Produktionscode und Bedienung bleiben unverändert.

| Pfad | Codebeleg | Aktueller Restaufwand / Einordnung |
| --- | --- | --- |
| Schraffur Punkt/Seite/Offset/Knicken | application/direct-edit/prepared-preview.ts, prepared-hatch.ts | Vorbereitet; Zielkonturprüfung bleibt. BimPlan erhält eine materialisierte Projektansicht. |
| Linienpunkt, auch geschlossene Polylinie | lib/bim/direct-edit.ts → application/direct-edit/transforms.ts → lib/bim/model.ts:updateLine | Kein registrierter vorbereiteter Adapter; validateProject prüft alle unveränderten Elemente mit. Gemessener stärkster Restengpass dieses Vergleichs. |
| Fenster entlang Achse | prepared-preview.ts, prepared-window.ts, controller.ts | 3D erhält lokalen Patch; projectView beendet Registrierung vor dem Fensteradapter. Direkte 2D-Vorschau läuft deshalb noch vollständig. |
| Wandachsende | prepared-wall.ts, prepared-endpoint.ts, controller.ts | Exakte Achsgriffe vorbereitet; neue T-Ziele/fremde Endkontakte können absichtlich zum Vollpfad führen. Fremdpunktliste wird linear geprüft, Anschlussgruppe kann groß sein: AUD14-05. |
| Wandkörpergriff / Strecken | prepared-wall.ts, lib/bim/direct-edit.ts | Kein allgemeiner vorbereiteter Adapter. Stretch hier direkt über EditSession gemessen; tatsächliche Menü-/Interaktionshäufigkeit nicht erhoben. |
| Freie Auswahlbewegung XY/Z | application/selection/move.ts, storey-translation.ts, z-translation.ts | Gemeinsamer vorbereiteter Auswahlpfad vorhanden, nicht mit jedem noch vorhandenen direkten move/x/y-Legacypfad gleichsetzen. Kein erneuter Gesamt-Performancebeleg in dieser Prüfung. |
| Linien-Knicken/Seite/Offset, direkte Schraffurbewegung/-stretch | contour.ts, offset.ts, transforms.ts | Registrierungsgrenze bleibt; vollständige updateLine/previewHatch-Pfade. Nicht separat vermessen; keine pauschale Übertragung der Punktmessung. |
| Wand zeichnen/Kette | application/drawing/wall-chain.ts:previewWallChain | Erster Abschnitt/erste Ecke teilweise vorbereitet; übrige Ketten/Startkandidaten nutzen appendWallChain. ID-Sammlung bleibt pro Abfrage. Separat vermessen, bevor weitere Optimierung beauftragt wird. |
| Grundrissableitung | components/cad/BimPlan.tsx, rendering/viewport/plan-scene.ts | Direkter Edit ersetzt shown; derivePlanScene erzeugt Maps, Wandkörper und Konturen erneut. Auswahlbewegung hat bereits separate Patch-Komposition. Kein Rendererwechsel erforderlich. |

Messverfahren: benchmarks/remaining-preview-profile.ts mit Node TypeScript ausführen.
Rohdaten remaining-preview-results.json: je Profil erster + acht warme Werte, Reihenfolge
Projekt/Patch wechselnd, Vorbereitungszeit separat. Vorschau-Projekt für jedes Ziel exakt
mit editAtPointer verglichen; Gleichheitsprüfung außerhalb der Messzeit. Keine neuen
Behauptungen zur Patchgleichheit über die bereits vorhandenen Adaptertests hinaus.

| Direkter Pfad | Kleine / große Szene | Vorschau warm klein → groß | Planableitung groß | Patch groß / Patch-Plan groß |
| --- | --- | --- | --- | --- |
| Schraffurpunkt | 10 / 100 Schraffuren à 100 Punkte | 0,072 → 0,042 ms | 0,029 ms | 0,035 / 0,015 ms |
| Linienpunkt | dieselben unveränderten Schraffuren + eine Linie | 3,85 → 35,89 ms | 0,030 ms | nicht vorhanden |
| Fensterachse | 5 Geschosse, 50 / 500 Wände und ebenso viele Fenster | 0,54 → 3,16 ms | 0,622 ms | 0,110 / 0,018 ms |
| Wand-Strecken | dieselben Gebäude | 0,55 → 3,10 ms | 0,518 ms | nicht vorhanden |

Die kleine/große Schraffurpunktzeit ist kein Skalierungsgesetz (JIT/Messstreuung).
Unverbundene synthetische Gebäude, keine großen Anschlussnetze, DOM/GPU, Fangabfrage,
React-Gesamtframes oder reale Langsitzung gemessen. Insbesondere ist die reine
Planableitung im gemessenen Fall nicht der größte Engpass. Keine neue Browserabnahme.
1016 Tests und Build bestanden; Diagnose-Typecheck und gezieltes Lint bestanden.

Priorisierung: zuerst den nachgewiesenen globalen updateLine-Prüfpfad für Linienpunkte
begrenzen. Danach Restbefund erneut bewerten; Fenster-2D, übrige Konturaktionen und
Wand-Strecken sind dokumentierte Restschuld, keine erledigten Funktionen. AUD14-05/06/07
bleiben nachgeordnet; vollständige Prüfung beim Platzieren und ein Undo bleiben Pflicht.

**Einziger nächster Auftrag:** Linienpunkt-Vorschau (offene Linie und geschlossene
Polyline) über den gemeinsamen vorbereiteten Application-Vertrag bereitstellen.
Eigene unveränderliche Basis, gemeinsame Punktableitung, Erhalt des doppelten
Schließpunkts, vollständige lokale Linienregeln und Vollprüfung beim Commit.
Exakte Projekt-/Planszenenvergleiche inklusive ungültiger Ziele, Linienarten und
unbetroffener ungültiger Elemente; wieder dieselbe 10/100-Schraffuren-Messung.
Keine Renderer-Typabfrage, keine neuen Eingabe-/Fangregeln und kein Ausweiten auf
Linien-Offset/Seitenstreckung in diesem Einzelauftrag.


### AUD14-04 Teil 14 – Vorbereitete Linienpunkt-Vorschau (15.10.2026)

PR335 nach ausdrücklicher Freigabe und grüner CI gemergt (13a06c6).
prepareLinePointPreview ist im gemeinsamen Application-Vertrag registriert. Offene
Linien und Polylinien verwenden einen eigenen validierten Snapshot; feste Angaben
wie Ebene, Linienart, Muster, Farbe und Punktanzahl werden bei der Vorbereitung
geprüft. Pro Ziel bleibt validateLineGeometry vollständig aktiv: keine Nullsegmente,
endliche positive Segmentlängen und endliche Gesamtlänge. Es werden keine neuen
Polygon-Selbstschnittregeln für Linien erfunden.

replacePathVertex ist die gemeinsame Geometrieableitung für Vollaktion und Vorschau.
Bei zuvor geschlossenem Pfad bewegen sich beide identischen Schließpunkte gemeinsam.
translatePoint erhält die Rechenreihenfolge auch bei großen Koordinaten. Kontextwechsel
werden abgewiesen, Basis und Ausgabe geschützt; direkte 2D-Projektansicht und lokaler
Geometriepatch sind abgeleitet. Kein Renderer-/Fang-/Eingabezweig ergänzt. Commit bleibt
vollständig geprüft und ein Undo. Linien-Offset/Seitenstreckung nicht erweitert.

1019 Tests, App-/Benchmark-Typecheck, gezieltes Lint und Build bestanden. Exakte
Projekt-/Planszenen-/Patchvergleiche für alle Griffe offener und geschlossener Pfade,
eigene festfarbige Linienart, Koordinaten bis 1e9, vom Griff versetzter Ursprung,
Nullbewegung, ungültige/überlaufende Ziele, ungültige Griffe und Kontext. Besitzschutz,
aktives Obergeschoss, Abbruch, ein Undo und Commit-Ablehnung bei ungültiger unbetroffener
Schraffur geprüft. Keine neue visuelle Browserabnahme behauptet.

Messung: benchmarks/line-point-profile.ts / line-point-results.json, gleiche Szenen
wie Teil 13. Erster und acht warme Werte, Projekt-/Patch-Reihenfolge alterniert,
Vollaktion separat danach gemessen, Ergebnisgleichheit außerhalb der Zeiten.
- 10 Schraffuren à 100 Punkte: Vollaktion 4,42 ms, Projektvorschau 0,014 ms,
  Vorbereitung separat 4,66 ms.
- 100 Schraffuren à 100 Punkte: Vollaktion 38,14 ms, Projektvorschau 0,015 ms,
  Vorbereitung separat 40,88 ms.
Keine Gesamtframe-/GPU-Garantie. Vorbereitung skaliert weiterhin mit der Basis;
Punktkopie und Linienprüfung mit der Pfadlänge, Projektmaterialisierung mit der Anzahl
Linien im Geschoss. Globale Planableitung bleibt bestehen. Andere Profilfälle dienen
als Kontext; daraus keine neuen Optimierungsbehauptungen ableiten.

Abnahme: offene Linie und geschlossene Polylinie mit eigener Linienart zeichnen;
ersten/letzten Punkt bewegen, abbrechen beziehungsweise platzieren und einmal Undo.
Geschlossene Kontur bleibt geschlossen, Muster/Farbe erhalten.

Einziger Folgeauftrag: den bestehenden vorbereiteten Fenster-Achsadapter auch für die
direkte 2D-Projektvorschau nutzbar machen (gemeinsame Registrierung/Materialisierung).
Keine zweite Fensterlogik; Hostgrenzen, T-Anschlüsse, Höhen, Musterfremdinhalte,
Kontextwechsel und Commit/Undo gegen Vollpfad prüfen; 50/500-Wände-Szenen vergleichen.
AUD14-04 bleibt offen, übrige Restpfade aus Teil 13 und AUD14-05/06/07 bleiben erhalten.


### AUD14-04 Teil 15 – Gemeinsame Fenster-Achsvorschau in 2D (15.10.2026)

PR336 nach ausdrücklicher Freigabe und grüner CI gemergt (97913b7).
Der vorhandene Fensteradapter ist jetzt auch für projectView registriert. evaluate
und materialize verwenden dieselbe resolve-Funktion mit bestehender Vollaktion auf
der vorbereiteten Anschlussgruppe. Keine neue Fenster-, Cap-, T- oder Höhenlogik.
Die Materialisierung übernimmt ausschließlich das bewegte Fenster in die vollständige
eigene Basis; updateWindow verändert bei dieser Aktion nur dessen relative Position.
Alle anderen Geschosse, Bauteile, Zeichnungen, Muster und Assets bleiben in der Basis.
Keine lokalen Scope-Projekte als vollständiges Projekt publizieren. Commit bleibt
unverändert fullEdit mit vollständiger Projektprüfung und einem Undo.

1020 Tests, App-/Benchmark-Typecheck, gezieltes Lint und Build bestanden. Bestehende
3D-Geometrie-/Konturvergleiche um exakte 2D-Projekt-/Planszenen-/Controllervergleiche
für Wandgrenzen, Ecken, Doppel-T, schrägen Verlauf und anderes Arbeitsgeschoss mit
Höhenversatz erweitert. Unbetroffene Musterschraffuren, Kontextwechsel, ungültige
Ziele, Basis-/Ausgabeschutz, Abbruch, ein Undo und vollständige Commit-Ablehnung
bleiben geprüft. Kein Rendering geändert, keine neue visuelle Browserabnahme behauptet.

Rohdaten benchmarks/window-plan-results.json, Runner window-plan-profile.ts:
ein erster und acht warme Werte, Vollpfad/Vorschau-Reihenfolge alterniert,
Vorbereitung und Planableitung separat, Projektgleichheit außerhalb der Zeitmessung.
- 5 Geschosse, 50 Wände + 50 Fenster: Vollpfad 0,80 → Vorschau 0,18 ms;
  Vorbereitung 1,88 ms, Planableitung 0,17 ms.
- 5 Geschosse, 500 Wände + 500 Fenster: Vollpfad 3,28 → Vorschau 0,13 ms;
  Vorbereitung 5,99 ms, Planableitung 0,43 ms.
Unverbundene synthetische Gebäude; keine Garantie für Gesamtframes, GPU, Fangarbeit
oder große Anschlussnetze. Letztere bleiben AUD14-05. Die materialisierte Fensterliste
und globale Planableitung bleiben Kosten; die vorhandene Anschlussgruppe wird weiter
pro Ziel vollständig geprüft.

Abnahme: Fenster in 2D über zwei T-Anschlüsse und bis über beide Wandenden ziehen.
Es bleibt auf seiner Wand, begrenzt an deren zulässigen Endpositionen. Abbruch,
Platzierung und ein Undo prüfen; anschließend 3D vergleichen.

Einziger Folgeauftrag: Seitenstreckung geschlossener Polylinien über den gemeinsamen
vorbereiteten Linienadapter anbinden. Die für Schraffuren geprüfte gemeinsame
prepareSessionContourEdge-/Cap-Berechnung wiederverwenden, Schließpunkt erhalten,
Vollpfad/Plan/Commit/Undo und spitze/konkave Konturen vergleichen; mit derselben
unveränderten Schraffur-Hintergrundlast messen. Kein neuer Renderer-/Fangzweig.
Diese Aktion nutzt laut Teil 13 noch updateLine mit globaler Validierung; ihre genaue
Kostenhöhe ist vor Umsetzung zu messen, nicht aus der Linienpunktmessung zu behaupten.
AUD14-04 bleibt offen; andere Restpfade und AUD14-05/06/07 bleiben erhalten.


### AUD14-04 Teil 16 – Vorbereitete Polylinien-Seitenstreckung (15.10.2026)

PR337 nach ausdrücklicher Freigabe und grüner CI gemergt (744eafc).
Der vorhandene Linienadapter heißt nun prepareLinePreview und verarbeitet point/edge.
Geschlossene Polylinien nutzen unverändert prepareSessionContourEdge mit eigener
validierter Basis, gemeinsamem Inferenz-Cap und prepareContourEdgeEdit. Keine neue
Begrenzungslogik: die Kontur wird vor der Linienmaterialisierung wieder geschlossen,
validateLineGeometry bleibt aktiv. Punktzahl/Darstellung/Zuordnung bleiben unverändert.
Offene Pfade und der doppelte Schließgriff als Kantenindex werden abgewiesen.
Commit unverändert vollständig geprüft, ein Undo; kein Renderer-/Fangzweig ergänzt.

1024 Tests, App-/Benchmark-Typecheck, gezieltes Lint und Build bestanden. Vergleich
gegen Vollaktion und ursprünglichen prepareContourEdge für Rechteck, spitzes Dreieck,
konkave Kontur, beide Umlaufrichtungen, erste/letzte Seite, 500 Punkte, rohe/bereits
begrenzte Ziele, Überziehen und Rückweg. Exakte Projekte, Planszenen und Patches,
eigene festfarbige Linienart, Kontextwechsel, nicht endliche Ziele, vorgewärmte dann
veränderte Basis, Abbruch, Platzieren und Undo geprüft. Ungültige fremde Schraffur
blockiert weiterhin Commit. Keine neue visuelle Browserabnahme behauptet.

Vor Umsetzung gemessen: line-edge-before.json (preparedCapability=false; Feld prepared
bezeichnet dort den Controller-Legacy-Fallback). Bei 100 Schraffuren à 100 Punkten
37,71 ms Vollpfad / 41,10 ms Controller warm. Gleiche unveränderte Szenen nach Umsetzung
in line-edge-results.json, Runner line-edge-profile.ts. Unabhängige Sitzungscaches,
Vollpfad/Vorschau-Reihenfolge alterniert, erster + acht warme Werte, Cap-Arbeit enthalten,
Vorbereitung separat, exakte Projektgleichheit je Ziel außerhalb der Zeitmessung:
- 100 Schraffuren à 100 Punkte: Vollpfad 39,00 → Vorschau 1,74 ms; Vorbereitung 40,38 ms.
- 10 Schraffuren à 100 Punkte: Vollpfad 8,82 → Vorschau 2,24 ms; Vorbereitung 5,19 ms.
- eine Schraffur und Polylinie mit 500 Konturpunkten: 15,84 → 9,08 ms; Vorbereitung 9,87 ms.
Vorher/Nachher-Werte sind einzelne Läufe mit Streuung, keine garantierte Skalierung.
Cap-Ereignisse, große Konturen, Linienprüfung, Materialisierung und Planableitung bleiben
Kosten. Keine Gesamtframe-/GPU-Garantie; insbesondere 500 Punkte bleiben merklich teuer.

Abnahme: Seite einer spitzen/konkaven geschlossenen Polylinie über die zulässige Grenze
ziehen und zurück, abbrechen/platzieren, einmal Undo; Schließpunkt und Linienart erhalten.
Einziger Folgeauftrag: Offset geschlossener Polylinien im vorhandenen Linienadapter
vorbereiten, gemeinsame offsetContourPoints-/Cap-Berechnung wiederverwenden. Konvexitäts-
und Mindestgrößenregeln sowie vollständige Zielkontur-/Linienprüfung erhalten; kleine
Formen, beide Umlaufrichtungen, Kontext und Commit/Undo gegen Vollpfad vergleichen/messen.
AUD14-04 bleibt offen; übrige Restpfade und AUD14-05/06/07 bleiben erhalten.


### AUD14-04 Teil 17 – Vorbereiteter Polylinien-Offset (15.10.2026)

Nutzerfreigabe wiederholt #337: dieser PR war bereits gemergt (744eafc). #338 bleibt
unverändert offen; dieser Folgeauftrag baut auf seinem Entwicklungszweig auf und
berechtigt nicht zu dessen Merge. Neuer Prüf-PR daher mit Basis perf/prepared-line-edge.

Vorhandener Linienadapter unterstützt nun Offset geschlossener Polylinien. Er nutzt
unverändert offsetContourPoints/offsetDirection und die bestehende konvexe Offset-
Berechnung einschließlich Mindestgröße/Cap. Nullindex entspricht Kante 0. Eine eigene
validierte Sitzung fixiert Basis, Ziel und Ursprung. Schließpunkt wird wieder angefügt,
Linienprüfung und vollständige Commitprüfung mit einem Undo bleiben erhalten.

Die vollständige Zielkonturprüfung liegt jetzt in offsetContourPoints, gemeinsam für
Vollaktion und Vorschau. Zuvor prüfte der vorbereitete Schraffuradapter sie separat;
Polylinien hatten nach der Offsetberechnung nur deren numerische Kantenprüfung und
Linienvalidierung. Damit wird auch ihre Vollaktion bei numerisch ungültiger Zielkontur
abgewiesen, statt nur die Vorschau strenger zu machen. Keine neue Offset-/Cap-Geometrie,
kein Renderer-/Fangzweig. Die Schema-Konturprüfung für Schraffuren bleibt erhalten.

1028 Tests, beide Typechecks, gezieltes Lint und Build bestanden. Exakte Projekte,
Planszenen und Patches bei beiden Umlaufrichtungen, kleinen Formen (Faktor 1e-5),
großen Koordinaten, Roh-/Cap-Zielen, Rückweg, eigenen Linienarten, fremden Musterschraffuren,
anderem Arbeitsgeschoss, Kontextwechsel, nicht endlichen/konkaven/offenen Fällen,
Abbruch, Commit und Undo. Keine neue visuelle Browserabnahme behauptet.

Messung line-offset-profile.ts / line-offset-results.json: unabhängige Sitzungscaches,
erster und acht warme Ziele, alternierende Reihenfolge, Vorbereitung separat, exakte
Projektgleichheit außerhalb der Messzeit. Vollpfad → Vorschau:
- 100 Schraffuren à 100 Punkte: 44,77 → 0,316 ms; Vorbereitung 44,89 ms.
- 10 Schraffuren à 100 Punkte: 4,33 → 0,301 ms; Vorbereitung 5,08 ms.
- 500 Konturpunkte mit einer Hintergrundschraffur: 3,65 → 1,41 ms; Vorbereitung 11,31 ms.
Vollständige Zielkontur-/Linienprüfung, Materialisierung und Planableitung bleiben Kosten.
Keine Gesamtframe-/GPU-Garantie, keine pauschale Skalierungszusage.

Abnahme: geschlossene konvexe Polylinie mit eigener Linienart nach innen über den Cap
ziehen und zurück; Schließpunkt/Darstellung erhalten, platzieren und einmal Undo.

Ab jetzt enthalten Abschlussberichte drei nächste Schritte (AGENTS angepasst).
Nur Schritt 1 ist aktiv; 2 und 3 sind Ausblick, keine parallelen Aufträge:
1. Knicken/Punkt einfügen bei geschlossenen Polylinien im vorhandenen Linienadapter
   vorbereiten; gemeinsame Kontureinfügung, Punktanzahl einschließlich Schließpunkt,
   Vollpfad-/Commit-/Undo-Vergleich und Hintergrundlast messen.
2. Verbliebenes direktes Wand-Strecken begrenzen; Anschluss-/Fensterabhängigkeiten und
   Körpergriffe vor einer Erweiterung des gemeinsamen Endpunktadapters vergleichen.
3. Lokale räumliche 3D-Fangsuche (AUD14-05), sobald AUD14-04 samt Restbefunden abgenommen
   ist; Quellen-/Kamera-/Sichtbarkeitskontext und vollständige Anschlussgruppe bewahren.
AUD14-04 bleibt offen. Restpfade aus Teil 13 und AUD14-06/07 werden nicht gestrichen.


### AUD14-04 Teil 18 – Vorbereitetes Polylinien-Knicken (15.10.2026)

PR338 (fe9f83e) und anschließend PR339 (395b458) nach ausdrücklicher gemeinsamer
Freigabe und jeweils grüner CI in main gemergt. #339 zuvor auf main umgestellt.

Vorhandener Linienadapter verarbeitet jetzt insert über prepareContourInsertion,
dieselbe Geometrievorbereitung wie bei Schraffuren. Vollständige Zielkonturprüfung
inklusive Umlaufrichtung bleibt aktiv; der Linien-Schließpunkt wird wieder angefügt,
validateLineGeometry prüft anschließend die Linie. Keine neue Geometrie-/Fang-/Rendererlogik.
MAX_LINE_POINTS ist die gemeinsame unveränderte Schema-/Vorbereitungsgrenze 10000.
Sie zählt bei geschlossenen Polylinien den doppelten Schließpunkt mit: 9999 gespeicherte
Punkte können auf 10000 wachsen, 10000 nicht auf 10001. Offene Pfade und der doppelte
Schließgriff als Kantenindex bleiben ausgeschlossen. Commit vollständig, ein Undo.

1032 Tests, App-/Benchmark-Typecheck, gezieltes Lint und Build bestanden. Exakte
Projekt-/Patch-/Planszenenvergleiche für konkave Konturen, beide Umlaufrichtungen,
erste/letzte Kante, absolute Ziele unabhängig vom Ursprung, eigene festfarbige Linienart,
Nullkanten/Selbstschnitt/nicht endliche Ziele, Kontextwechsel, Punktgrenze einschließlich
Schließpunkt, offene Pfade, Abbruch und Undo. Ungültige fremde Schraffur blockiert Commit.
Keine neue visuelle Browserabnahme behauptet.

Rohdaten line-insert-results.json / Runner line-insert-profile.ts. Ein erster und acht
warme Werte, alternierende Vollpfad-/Vorschaureihenfolge, Vorbereitung separat, exakte
Projektgleichheit je Ziel außerhalb der Zeitmessung. Vollpfad → Vorschau:
- 100 Schraffuren à 100 Punkte: 37,83 → 0,294 ms; Vorbereitung 40,59 ms.
- 10 Schraffuren à 100 Punkte: 4,24 → 0,275 ms; Vorbereitung 3,96 ms.
- 500 Konturpunkte + eine Hintergrundschraffur: 4,65 → 1,20 ms; Vorbereitung 8,49 ms.
Zielkontur-/Linienprüfung, Vorbereitung, Materialisierung und Planableitung bleiben
Kosten; keine Frame-/GPU-Garantie oder universelle Skalierungszusage.

Abnahme: geschlossene Polylinie → Knicken an erster/letzter Seite → Punkt bewegen →
abbrechen oder platzieren → einmal Undo; Schließpunkt und eigene Linienart erhalten.

Nächste drei Schritte, nur Schritt 1 aktiv:
1. Direktes Wand-Strecken messen und den gemeinsamen Endpunktadapter dafür erweitern,
   soweit die Geometrie-/Abhängigkeitsvergleiche das tragen. Fenster, gelöste Anschlüsse,
   Nachbarwände, Körpergriffe und fremde Endpunkte gegen den Vollpfad prüfen.
2. AUD14-05: räumliche lokale 3D-Fangsuche und große Anschlussgruppen nach Abnahme der
   verbleibenden AUD14-04-Befunde; Kamera-/Sichtbarkeitskontext und Rangfolge erhalten.
3. AUD14-06: Langsitzungs-Speicher und Recovery-Aufbewahrung prüfen; gültige Sicherungen,
   Undo-Stände und konkurrierende Schreiber bei jeder Bereinigung schützen.
AUD14-04 bleibt offen. Weitere Restpfade aus Teil 13 sowie AUD14-07 bleiben dokumentiert.


### AUD14-04 Teil 19 – Direktes Wand-Strecken (15.10.2026)

PR340 nach ausdrücklicher Freigabe und grüner CI in main gemergt (ff4af16).
Der vorhandene Endpunktadapter führt nun auch die unveränderte stretch-Aktion auf der
vorbereiteten vollständigen Anschlussgruppe aus. Originaler Ursprung und Achsprojektion
bleiben erhalten, einschließlich Körperoffset-Griffen. Gemeinsame Registrierung liefert
2D-Projektansicht und 3D-Geometriepatch; keine neue Renderer- oder Fang-Sonderlogik.
Neue fremde Endkontakte und explizite T-Ziele erhalten vollständige Prüfung. Der gemeinsame
2D-Controller berücksichtigt T-Kandidaten auch nach vorbereiteter Materialisierung.
Commit prüft weiterhin das vollständige Projekt und erzeugt genau einen Undo-Schritt.

1040 Tests, App-/Benchmark-Typecheck, gezieltes ESLint und Build bestanden. Acht neue
Tests vergleichen Projekte, 3D-Flächen, Fensterflächen und Auswahlachsen mit dem Vollpfad:
beide Enden, Kürzen/Verlängern, schräge Wände, seitlich versetzte Ursprünge, Eck-/Doppel-T-
Anschlüsse, gelöste Nachbarn, fremde/verbrauchte Endpunkte und neue T-Ziele. Kontextwechsel,
Abbruch, ungültige Ziele und Vollcommit/Undo geprüft. Keine neue visuelle Browserabnahme.

Runner wall-stretch-profile.ts, Rohdaten wall-stretch-before.json und wall-stretch-results.json.
Fünf Geschosse plus T-Paar mit Fenstern; erster und acht warme Ziele, alternierende
Reihenfolge, exakte Projektgleichheit außerhalb der Messung, Vorbereitung separat.
Im Nachherlauf Vollpfad → vorbereitete Projektvorschau (warme Mediane):
- 52 Wände, Anfang/Ende: 2,064 → 1,349 ms / 1,381 → 0,813 ms.
- 502 Wände, Anfang/Ende: 4,157 → 0,796 ms / 4,361 → 0,703 ms.
Vorbereitung bei 502 Wänden: 6,980 / 4,669 ms. Vorherlauf ohne Capability:
502 Wände, Vorschau 5,055 / 3,426 ms. Messstreuung beachten; keine Frame-/GPU-Garantie.
Lineare Fremdpunktprüfung, große vollständige Anschlussgruppen, Projektmaterialisierung
und anschließende Planableitung bleiben Kosten. Freie Wandkörper-Eckbewegung bleibt ein
expliziter Legacy-Pfad; die Streckoptimierung deckt diese andere Aktion nicht automatisch ab.

Praktische Abnahme: angeschlossene Wand mit Fenstern an beiden Enden strecken, auch schräg;
Nachbaranschlüsse und Fenster beobachten; abbrechen, platzieren, einmal Undo vergleichen.

Nächste drei Schritte, nur Schritt 1 aktiv:
1. Freie Wandkörper-Eckbewegung messen und im gemeinsamen Endpunktadapter vorbereiten.
   Körperoffset, beide Enden, schräge Achsen, Fenster/Nachbarn und Vollcommit vergleichen.
2. AUD14-05: lokale räumliche 3D-Fangsuche und große Anschlussgruppen nach verbleibender
   AUD14-04-Abnahme; Kontext und Fangrangfolge erhalten.
3. AUD14-06: Langsitzungs-Speicher und Recovery-Aufbewahrung sicher begrenzen.
AUD14-04 bleibt offen; weitere Restpfade aus Teil 13 und AUD14-07 bleiben dokumentiert.


### AUD14-04 Teil 20 – Freie Wandkörper-Eckbewegung (15.10.2026)

PR341 nach ausdrücklicher Freigabe und erfolgreicher CI in main gemergt (0a093f6).
Der gemeinsame Endpunktadapter erhält nun neben der Aktion auch den ursprünglichen
Körpergriff. Er verwendet unverändert editAtPointer und dessen endpointAtOffsetTarget,
also keine zweite Formel für Körperoffset, Achslage oder Anschlüsse. Punkt-/Streckaktionen
sind gemeinsam für 2D-Projektmaterialisierung und 3D-Patches registriert. Neue fremde
Endkontakte und T-Ziele behalten den Vollpfad; Commit und ein Undo bleiben unverändert.

1048 Tests, App-/Benchmark-Typecheck, gezieltes Lint und Build bestanden. Acht neue
Vergleichstests: Projekte, 3D-Wand-/Fensterflächen und Auswahlachsen gegen Vollpfad,
beide Enden und Körperseiten, schräge Wände, Nullbewegung/ungültige Ziele, Fenster,
Eck-/Doppel-T-Verbindungen, gelöste Nachbarn, fremde Endkontakte und belegte Knoten,
T-Kandidaten, Kontextwechsel, Abbruch und Vollcommit/Undo. Unzulässiger Mehrfachanschluss
wird weiterhin abgewiesen. Keine neue visuelle Browserabnahme behauptet.

wall-body-point-profile.ts sowie before/results.json enthalten fünf Geschosse plus
T-Paar mit Fenstern. Tatsächlicher Griff aus wallBody.corner; erster und acht warme
Ziele, Reihenfolge alternierend, exakte Projektgleichheit außerhalb der Messung.
Nachherlauf Vollpfad → vorbereitete Projektansicht, Anfang/Ende:
- 52 Wände: 0,970 → 0,253 ms / 0,557 → 0,184 ms.
- 502 Wände: 3,439 → 0,191 ms / 3,507 → 0,220 ms.
Vorbereitung bei 502 Wänden separat 5,932 / 5,070 ms. Vorherige Vorschau ohne Capability
4,183 / 3,523 ms. Synthetische Node-Messung, keine Bildschirm-/GPU-/p95-Garantie.
Fremdpunktliste, große vollständige Anschlussgruppen, Materialisierung und Planableitung
bleiben Kosten; übrige Altpfade aus Teil 13 werden nicht dadurch als erledigt behandelt.

Abnahme: Körperkante einer Wand mit Fenster greifen, frei seitlich und längs bewegen,
auch bei schräger Achse und T-/Eckanschluss; Vorschau/Platzierung/Undo vergleichen.

Nächste drei Schritte, nur Schritt 1 aktiv:
1. AUD14-04 zusammenhängend abnehmen: aktuelles Mehrgeschoss-/Browserprofil und Restpfade
   mit dem heutigen Stand abgleichen, verbleibende Engpässe messen und Übergang begründen.
   Keine weitere pauschale Werkzeugmigration ohne gemessenen Befund.
2. AUD14-05 lokale räumliche 3D-Ursprungsfangsuche; große Anschlussgruppen, Kamera- und
   Sichtbarkeitskontext sowie Fangrangfolge ausdrücklich mitprüfen.
3. AUD14-06 Langsitzungs-Speicher und Recovery-Aufbewahrung sicher begrenzen.
AUD14-04 ist bis zur Restabnahme nicht geschlossen; AUD14-07 bleibt Abschlussgate.


### AUD14-04 Teil 21 – Zusammenhängender Vergleich und Übergang (15.10.2026)

PR342 nach ausdrücklicher Freigabe und grüner CI in main gemergt (a40bc22).
Keine Produktänderung in diesem Schritt. Vorhandene Browserprüfungen wiederverwendet,
Wandvergleich als preview-block.html / preview-block-browser.ts auf 502 Wände und
Achsgriff/Körpergriff/Strecken erweitert. Zwei Enden, zwei Kamerawinkel, vier Ziele:
48 pixelgleiche Vorschauen, 48 exakte Projekt-/Commit-/Undo-/Abbruchvergleiche bestanden.
Rendererprüfung nutzt echten WebGL-Canvas, aber Application-Aktionen direkt; keine
Behauptung über echte Mausereignisse, React-Gesamtframes oder kontinuierliche Eingabe.
IAB auf Windows, Chrome/155.0.0.0; Rohdaten preview-block-browser-results.json.

Geschosswechsel: fünf Geschosse, 500 Wände/500 Fenster, sieben Wechsel; unveränderte
Geometrieidentität und Pixel bestanden (preview-block-storey-browser.json).
Kamera-/Abfragebasis: sechs Pixelvergleiche und 48 Fangresultatvergleiche bestanden
(preview-block-query-browser.json). Diese acht getesteten Ecken pro Kameralage sind
keine flächendeckende Abnahme sämtlicher Verdeckungs-/Sichtbarkeitsfälle.

remaining-preview-profile.ts unverändert erneut ausgeführt; alte Ergebnisse erhalten,
aktuelle Daten preview-block-node-results.json. Große Szene, warme Mediane in ms:
| Pfad | Projektvorschau | volle Planableitung | Geometriepatch |
| --- | --- | --- | --- |
| Schraffurpunkt, 100 Konturen à 100 Punkte | 0,049 | 0,037 | 0,033 |
| Linienpunkt, gleicher Hintergrund | 0,020 | 0,048 | 0,011 |
| Fensterachse, 500 Wände/500 Fenster | 0,132 | 0,663 | 0,124 |
| Wand-Strecken, gleicher Hintergrund | 0,129 | 0,548 | 0,121 |
Erster + acht warme Ziele, Vorbereitung separat, exakte Projektgleichheit außerhalb
Zeitmessung. Synthetische Befunde ohne p95-/Frame-/GPU-Garantie. Die historischen
Globalprüfungsengpässe dieser vier Pfade sind im heutigen Profil nicht mehr vorhanden.

Restabgleich: registrierte Linie/Schraffur Punkt/Seite/Offset/Knicken sowie Fensterachse
und Wandpunkt/-stretch vorbereitet. Fremde Endkontakte und T-Ziele verwenden absichtlich
Vollprüfung. Wandkette ab weiteren Abschnitten/Startkandidaten nutzt weiterhin appendWallChain;
ID-Sammlung, direkte alte move/x/y-Pfade, vollständige Planableitung und große Anschlussgruppen
bleiben Restschuld. Keine ungemessene pauschale Migration oder Aussage, alle Pfade seien schnell.
Neue Befunde dort vor Änderung messen; Gesamtprofil mit Referenzbildern, Langsitzung und
realen Workspace-Eingaben bleibt AUD14-07 vorbehalten. AUD14-04 wird nicht geschlossen.

Übergangsentscheidung: Der begrenzt geprüfte Vorschauumfang rechtfertigt jetzt AUD14-05.
createMovementOriginQuery (rendering/viewport/movement-origin.ts) projiziert einmal, läuft
aber pro Mausabfrage noch per map/filter über alle Ecken. Gemeinsamen räumlichen Index
verwenden, lokales Radius-Rechteck abfragen, anschließend exakt dieselbe Distanz, Höhe,
stabile Gleichstandreihenfolge und classifyAnchorVisibility anwenden. Kontextänderungen
(Kamera/Viewport/Sichtbarkeit/Modell) dürfen keine veralteten Kandidaten liefern.

Nächste drei Schritte, nur Schritt 1 aktiv:
1. AUD14-05: lokale 3D-Ursprungsfangabfrage mit vollständigem linearen Vergleichsorakel,
   dichter/verteilter Geometrie, kalter Vorbereitung und warmen Abfragen.
2. AUD14-05: große Anschlussgruppen und lineare Fremdendpunktprüfung separat messen;
   betroffene Menge nur bei nachgewiesener fachlicher Gleichheit begrenzen.
3. AUD14-06: Langsitzungs-Speicher und Recovery-Aufbewahrung prüfen.
AUD14-04-Restschuld und AUD14-07 bleiben ausdrücklich offen.

Prüfabschluss Teil 21: 1048 Tests, App-/Benchmark-Typecheck, gezieltes ESLint und Build bestanden.


### AUD14-05 Teil 1 – Lokale 3D-Ursprungsfangabfrage (15.10.2026)

PR343 nach ausdrücklicher Freigabe und grüner CI in main gemergt (180320a).
createMovementOriginQuery nutzt den vorhandenen generischen createBoxIndex für projizierte
Eckpunkte. Pro Pointer wird nur das Radius-Rechteck abgefragt; ursprüngliche Reihenfolge
vor Distanzsortierung wiederhergestellt. Kreisradius, Höhe, sichtbare Flächen und
classifyAnchorVisibility unverändert. Kein zweites Fangsystem, keine Modelländerung.
Index lebt in der vorhandenen Query-Closure: Modell-/Kamera-/Viewport-/Sichtbarkeitswechsel
erzeugen wie bisher eine neue Abfrage. Keine globale zusätzliche Cache-Lebensdauer.
Nicht endliche Projektionen werden ausgeschlossen; endliche überlaufende Abfragegrenzen
auf Number.MAX_VALUE begrenzt. Die vorherige Invalid-/Nullradius-Semantik bleibt erhalten.

1051 Tests, App-/Benchmark-Typecheck, gezieltes Lint und Build bestanden. Drei neue
Vergleichstests gegen eingefrorenen bisherigen Vollscan (nur benchmarks): Kamera, Zoom,
Sichtbarkeit, Höhe einschließlich NaN, Radiusgrenzen/Nullradius, extreme/ungültige Eingaben,
dichte Projektion und Verdeckung. Browser: 500 Wände/500 Fenster, sechs pixelgleiche
Kamerabilder und 48 exakt gleiche Fangresultate gegen das lineare Orakel bestanden.
Windows IAB Chrome/155; local-origin-browser-results.json. Bestehende Kontexttests bleiben.

local-origin-profile.ts / local-origin-results.json: 50/500 Wände, Zoom 1 und 0,02,
40 alternierende Abfragen je Fall, erste zwei nicht im Median, Gleichheitsprüfung außerhalb
Messung. 500 Wände, Vollscan → lokal in ms:
- Leerer Suchbereich, Zoom 1: 1,237 → 0,0029; Zoom 0,02: 1,228 → 0,0025.
- Gemischte Treffer, Zoom 1: 13,989 → 12,830.
- Dichte Projektion, Zoom 0,02: 15,254 → 15,815, also kein Gesamtgewinn.
Vorbereitung separat protokolliert, aber sequenziell mit gemeinsam erwärmter Geometrie;
kein fairer Kaltstartvergleich. Keine Frame-/p95-/universelle Beschleunigungsgarantie.

Die räumliche Kandidatenbegrenzung ist fachlich abgesichert, AUD14-05 insgesamt bleibt offen.
Codebefund: nearestWallSurface projiziert für die Verdeckungsprüfung weiterhin alle Flächen
und prüft deren Dreiecke je Kandidat. Dieser globale Rest erklärt einen plausiblen Engpass;
Phasenmessung muss den Anteil vor der nächsten Optimierung separat bestätigen. Dichte
Kandidatenmenge und Vorbereitung bleiben ebenso zu messen. Kein unzulässiger Kandidatencap.

Nächste drei Schritte, nur Schritt 1 aktiv:
1. Verdeckungsprüfung messen und als gemeinsamen vorbereiteten räumlichen Tiefenquery
   begrenzen; identische Treffer/Toleranz/Reihenfolge, Kamera-/Sichtbarkeitswechsel prüfen.
2. Große Anschlussgruppen und Fremdendpunktprüfung separat messen und fachlich sicher begrenzen.
3. Langsitzungs-Speicher und Recovery-Aufbewahrung prüfen (AUD14-06).
AUD14-04-Restschuld sowie AUD14-07-Gesamtabnahme bleiben offen.
