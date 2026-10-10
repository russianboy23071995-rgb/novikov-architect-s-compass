# NOVIKOV CAD – zentraler Masterplan

Stand: 10.10.2026. Referenz: `main` `6abcf7c32821d1cf92237c3cdffe92a4312fe6a9` (PR 237). Dokumentationsauftrag: alle vorhandenen Leitfäden zusammenführen, Anforderungen erhalten und Fortschritt von Zukunftszielen unterscheiden.

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

## 5. Engpässe und Skalierungsrisiken

1. **Datei-/Assetgrenze:** 10 MiB = 10.485.760 Bytes, ungefähr 10,49 dezimale MB; nicht gleich zehn Millionen Bytes. Inline-Base64 und JPEG→PNG können Projektbytes erhöhen. Getrennt messen: Elemente/Punkte, kodierte Bytes, Gesamtpixel, dekodierter RAM, GPU und History. 16 MP pro Bild ist kein Gesamtbudget. 200–300 MB Archicad-Datei beschreibt Nutzererfahrung, keine bereits unterstützte Novikov-Größe.
2. **Speichern/Recovery:** Downloadanforderung und Undo sichern weder letzten Datenträgerstand noch Absturz-/Migrationsschutz. Dies ist P0 vor Public Beta mit realen Dateien.
3. **Commit/Export:** Volle Validierung, Geometrieableitung und Serialisierung bleiben globale Pfade. Ältere Einzelmessungen nicht als aktuelle Zeitgarantie verwenden. Herkunft/Commit, Hardware, Szenario und Median/p95 getrennt nennen.
4. **Vorschau/Abhängigkeiten:** Begrenzte Piloten sind produktiv; nicht wieder von null anfangen. Restliche Pfade und breite verbundene Komponenten messen. Nur ausgewählte Wand ist keine sichere betroffene Menge.
5. **3D:** Frühere CPU-Kamera-Neupackung wurde produktiv verbessert. Indexvorbereitung, Scan-Fallback, Preview, große Koordinaten und mehrere schwere Ansichten bleiben konkret zu vermessen. Kein begründeter pauschaler Rendererwechsel.
6. **Bibliotheken/Clientzustand:** Lokale Profile, Konflikte/Quota, konkurrierende Tabs und portable Linienkopien haben unterschiedliche Risiken. CadWorkspace darf nicht permanent Fachmodell/Settings/Actions aufsammeln.
7. **Fachmodell für AI:** Ein Geschoss plus Wand/Fenster ist noch kein vollständiges Gebäudemodell. Räume, Höhenbezüge, Quellen, Abhängigkeiten, strukturierte Queries und Transaktionen sind Voraussetzungen komplexer autonomer Entwürfe.

Leistungsprofil wiederverwenden: 100/1.000/5.000 Elemente, viele Polygonpunkte, verbundene Wände/T-Knoten, mehrere echte Rasterpläne, 1/10/50/100 History-Stände, Laden/Pointer/Commit/Undo/2D/3D/Export getrennt. Kalte und warme Pfade unterscheiden, Budgets/Abbruchgrenzen dokumentieren. Kein Limit nur hochsetzen und keine Datenstruktur auf Verdacht austauschen.

## 6. Fahrplan mit Prioritäten

Priorität ist Risikostufe, keine Aufforderung zu paralleler Umsetzung. AI-Anschlussfähigkeit A03/A11 gilt ab jetzt in jeder Stufe. Nach jeder abgeschlossenen Aufgabe genau einen begrenzten Folgeauftrag wählen; ein belegter Datenverlust-/Security-Blocker darf die Reihenfolge vorziehen.

| Abschnitt | Priorität | Ergebnis und Abnahme | Bezug |
| --- | --- | --- | --- |
| 0 – Geordneten Stand sichern | aktuell | Laufenden Abbild-PR238 gegen aktuellen main und Nutzerentscheidungen abnehmen, keine Doppelimplementierung. Zwei Abbilder desselben Modells behalten eigene Maßstäbe/Filter und Dateirundlauf. | MS-04c, N57/N60 |
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

**Genau ein aktiver Fortsetzungsschritt: P0-Persistenz-Vertrag und Fehlernachweis.** Den bestehenden JSON-Save/Open-Pfad (`CadWorkspace.saveProject/openProjectFile`, Serialisierung/Migration) auf Datenverlust bei fehlgeschlagenem Download, beschädigter/zu großer Datei und Abbruch beim Öffnen prüfen. Als kleinen ersten Schritt Speicherstatus und Fehlersemantik an der Application-/Browser-Adaptergrenze erfassen und mit reproduzierbaren Tests belegen: fehlgeschlagenes Öffnen lässt Projekt und History unverändert, eine Downloadanforderung behauptet keinen bestätigten Datenträgerstand. Recovery-Lücke und einen konkreten nachfolgenden Pilot dokumentieren. Noch kein neues Dateiformat, keine Plattformwahl und keine vorgetäuschte Autosave-Garantie. Bestehende portable Projektdateien und Abbilder erhalten.

**Startprompt für Codex:** Lies AGENTS.md und NOVIKOV_MASTERPLAN.md. Lies im NOVIKOV_REQUIREMENTS_REGISTER.md nur die IDs/Detailverträge des aktiven Auftrags. Vergleiche aktuellen main, offenen PR und lokale Änderungen. Erhalte fremde Arbeit. Nenne zuständige Schicht, Action/Query, Kontext, Abhängigkeiten und Abnahme. Setze genau einen begrenzten Auftrag um. Verwende bestehende Modell-, Snap-, ToolInteraction- und History-Grenzen. Dokumentiere ausgeführte Prüfungen und Einschränkungen, aktualisiere diese zwei Dateien und ende mit dem nächsten konkreten Schritt.

## 10. Verwaltung und persönliche Ablage

GitHub bleibt die technische Quelle. Für kommende Arbeitsaufträge genügen diese zwei Dateien plus fokussierte Code-/Test-/Diagnoselesung. GitHub Issues/Projects können später IDs, Prioritäten und Status abbilden; kein weiterer Plugin-Anschluss ist dafür Voraussetzung. Ein zusätzliches Notion-/Linear-System ist optional, würde aber eine klar geregelte Synchronisierung benötigen. Die PDF ist ein datierter Fahrplan für die persönliche Ablage und keine dritte laufend gepflegte Quelle.
