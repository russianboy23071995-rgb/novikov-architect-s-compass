# NOVIKOV CAD – zentraler Masterplan

## Status auf einen Blick (29.10.2026; Ansicht auf §9, keine zweite Roadmap – bei jeder §9-Pflege mitziehen)

- **Phase:** Skalierbarkeit und Leistung für das Schulmodell (Nutzerentscheidung 24.10.2026, §9) innerhalb §6 Abschnitt 1–2; je Schritt Änderungskarte → Freigabe → Nachweis.
- **Letzter Meilenstein:** Sicherungshinweis dezent unten links statt Fenster oben rechts (PR500, [Nachweis](docs/SICHERUNGSHINWEIS.md)); davor Decken C3 Variante A (PR499): Wand und Decke in 3D ohne Flimmern bei gleichem Vorrang; Zielbild Materialvorrang 0–100 festgehalten ([Nachweis](docs/SLAB_ELEMENT.md)); davor Polygon-Regeln vollständig (PR495–498, [Nachweis](docs/POLYGON_REGELN.md)); zuletzt Teil D (PR498): Fangpunkte benannt („Decke · Ecke 3“, „Wand · Anfang“) statt „Endpunkt“; davor Teil C (PR497): Klick auf eine Ecke bewegt sie sofort, Ecke auf eine andere Ecke desselben Elements löscht sie (mind. 3 Ecken), gemeinsame Bausteine für alle Elemente mit Eckenliste; davor Teil B (PR496): Schließen per Klick auf den Startpunkt als gemeinsamer Baustein für alle Klick-für-Klick-Werkzeuge, Startpunkt mit Fangvorrang; davor Teil A (PR495, [Nachweis](docs/POLYGON_REGELN.md)): neue Projekte mit Erdgeschoss und 1. Obergeschoss je 3,00 m, Decke im Grundriss nur als durchgezogene Konturlinie, Decke damit sofort in 3D; davor Deckenumriss im Grundriss bearbeiten (PR494) nach Umzug der Bearbeitungssitzung aus lib/bim (PR493, 19 Architektur-Ausnahmen weniger); davor Übersichten zählen Türen/Decken (PR491) und Arbeitsweise/Browser-Start/Wiederaufnahme gesichert (PR492, `docs/WIEDERAUFNAHME.md`); davor Decken Teil C1: Wandhöhe an Geschoss gebunden (Oberkante = OK Rohfußboden darüber + Zusatzhöhe, auch Attika im obersten Geschoss; Schema 30, PR490, [Nachweis](docs/SLAB_ELEMENT.md)); davor Decken Teil B (PR487–489) und Teil A (PR486).
- **Aktiver Einzelauftrag:** keiner – Polygon-Regeln A–D abgeschlossen ([Nachweis](docs/POLYGON_REGELN.md)). Archicad-Abnahme der Decken bestätigt (29.10.2026: Import erfolgreich, Decken auf richtigen Höhen, Fenster weiter RB 0,00 x 0,00); Decken C3 Variante A erledigt (PR499); Archicad-Prüfung der Überschneidungsdatei durch den Nutzer ausstehend; Varianten B/C erst mit Materialvorrang.
- **Nächster Produktmeilenstein:** AUD14-Reste nach Nutzerentscheidung bearbeiten oder als bekannte Grenzen führen ([Kandidaten](docs/AUD14_ABGLEICH.md)), danach das nächste Fachbauteil aus §6 Abschnitt 2.
- **Blocker 1:** Release-Gates ohne Testumgebung: echte Quota, echte Mehr-Tab-Fälle, Lauf ≥ 2 h, Native-/GPU-/Prozessspeicher (AUD14-03/06/07; [Nachweis](docs/AUD14_ABGLEICH.md)).
- **Blocker 2:** IFC-Fenster ohne Maße in Archicad (RB 0,00 x 0,00, nicht änderbar) – für den Austausch wichtig, vorgemerkt ([Nachweis](docs/T_IFC_ACCEPTANCE.md)).
- **Blocker 3:** Speicher-/Lade-Brücke aus `lib/bim/model.ts` wartet auf die Nutzerentscheidung zur interop-Grenze (§9).

Geprüfte Code-Basis: 29.10.2026, main `5e7e6ba` nach PR500; AUD14-Abgleich am Stand 07f88e1 (docs/AUD14_ABGLEICH.md). In main integriert: PR447–PR500 (mit PR453; PR462 über PR463) – zuletzt Wartezeit Teil B (PR464), Wandanschlüsse (PR465), Treffertoleranz (PR466), 3D/Autosicherung (PR467), schräge T-Anschlüsse (PR468) schräge Ecke an einer T-Hauptwand (PR469) T-Anschluss automatisch in jedem Winkel (PR470) Sicherungsprüfungen gezielt vermeiden (PR471) Picking-Index je Geschoss (PR472) Versatz-Befehl ohne Serialisieren (PR473) Sichtbarkeitsprüfung beim Fangen mit Index (PR474) Autosicherung prüft nur geänderte Bilder (PR475) Autosicherung prüft das Modell nicht mehrfach (PR476) IFC-Abnahme der T-Anschlüsse vorbereitet (PR477) IFC-Dateibeschreibung vom Aufrufer (PR478) kleine AUD14-07-Reste (PR479) erweiterter Schullauf (PR480) Z-/XY-Bewegung ohne Gesamtprüfung beim Übernehmen (PR481) schnellerer Start der Gruppenbewegung (PR482) Undo/Redo mit Wiederverwendung von Geschossteil und Wandfuß-Fangquellen (PR483) Umzug des Geschosskörpers aus lib/bim (PR484) Ersatzzeichen-Reparatur mit erweiterter Kodierungsprüfung (PR485) Decke als Bauteil Teil A (PR486) und Teil B: 3D (PR487), IfcSlab (PR488), Bearbeiten (PR489), Wandhöhe an Geschoss gebunden (PR490), Übersichten mit Türen/Decken (PR491), Arbeitsweise und Wiederaufnahme (PR492), Bearbeitungssitzung aus lib/bim (PR493), Deckenumriss bearbeiten (PR494), Polygon-Regeln A: Standardgeschosse und Decke als Konturlinie (PR495), Polygon-Regeln B: Schließen am Startpunkt (PR496), Polygon-Regeln C: Ecken bewegen/löschen (PR497), Polygon-Regeln D: Fangpunkte benennen (PR498), Decken C3 Variante A (PR499), Sicherungshinweis unten links (PR500). PR318 als überholt durch PR371 geschlossen. Keine offenen PRs. Einziger aktiver Folgeauftrag §9.

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

Vorbereitete Bearbeitung bindet einen gültigen unveränderlichen Ausgangsstand einmal. Während Bewegung werden betroffene Elemente UND fachlich nötige stationäre Nachbarn aktualisiert; unveränderte Anzeige bleibt wiederverwendbar. Insbesondere eine stehenbleibende Wand kann nach Lösen eines Anschlusses eine neue Kontur benötigen. Beim Übernehmen vollständige fachliche Prüfung, aktuelle Kontextkontrolle, atomare Veröffentlichung und genau ein sinnvoller Undo-Schritt. Keine History pro Mausbewegung, keine ungeprüfte Veröffentlichung eines Vorschaucaches. **Ergänzung (Nutzerentscheidung 24.10.2026, Option B):** Das Prüfergebnis eines unveränderten, eingefrorenen Geschosses eines eigenen Snapshots darf wiederverwendet werden, wenn sein Abhängigkeitsschlüssel (eigene/nächste Höhenlage, alle übrigen Projektwerte per Identität) gleich ist; das Ergebnis muss dem der vollen Prüfung exakt entsprechen. Projektweite Prüfungen laufen immer vollständig; Laden, Speichern und Recovery prüfen voll. Jede neue Regel, die weitere Daten liest, erweitert den Schlüssel und die Gegenprüfung (benchmarks/storey-validation-reuse.test.ts).

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

**Geschossübergreifende Einflüsse (Nutzerentscheidung 27.10.2026):** Wände können über mehrere Geschosse reichen (z. B. EG bis 3. OG für Fensterfronten), gestapelte Wände bilden am Übergang optisch eine Wand, Decken liegen dazwischen, Wände werden an Dachflächen getrimmt (ein Giebel kann zwei Geschosse umfassen), und der Grundriss eines Geschosses (horizontaler Schnitt ≈ 1 m über Geschossboden) zeigt Wände anderer Geschosse, die die Schnittebene durchdringen, als „Gast“. Verbindlich für alle abgeleiteten Daten und Zwischenspeicher: Geschossübergreifende Einflüsse auf einen Bauteilkörper (Dachtrimmung, Stoß zur Wand darüber/darunter, Deckenanschluss) werden als ausdrückliche Eingaben des Bauteils aufgelöst und sind Teil jedes Wiederverwendungsschlüssels – wie heute die gebundene Wandhöhe (`resolveBoundWallHeights`). Kein Zwischenspeicher darf annehmen, dass ein Geschoss nur von sich selbst abhängt (betrifft Geschossteile, Picking je Geschoss, Bewegungsecken, Fangquellen, wandweisen Neuaufbau; docs/plans/WALLWISE_REBUILD_CHANGE_MAP.md Abschnitt 2a). Gast-Anzeige ist eine eigene geschossübergreifende Grundriss-/Fang-/Auswahlabfrage nach Höhenbereich, heute nicht umgesetzt.

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

27.10.2026: Branch perf/undo-storey-reuse (von main a40ee8f; mit PR483 am 27.10.2026 in main e58de0c integriert). 3D-Neuaufbau Stufe A: Geschoss-Zwischenspeicher hält die letzten 4 Stände je Geschoss, Wandfuß-Fangquellen je Geschossteil gemerkt; Undo/Redo finden beide wieder (Ergebnisse gleich). Node x: Undo Gebäude 160→6 ms, Wandfuß 283→0,1 ms; Browser Z-Undo l 235→155, x 682→366 ms, Z-Redo x 666→356 ms. Nach einer neuen Bearbeitung unverändert (Stufe B: wandweiser Neuaufbau, eigene ausführliche Karte). 1331 Tests. Nachweis docs/performance/UNDO_STOREY_REUSE.md.

27.10.2026: Branch refactor/storey-solid-out-of-lib-bim (von main 73a76f5; mit PR484 am 27.10.2026 in main 00a15df integriert). Stufe B0: `buildSolid`, `buildPreviewSolid`, `Solid/Face/Vec3` wortgleich nach `src/rendering/viewport/storey-solid.ts`; `lib/bim/geometry.ts` behält nur Kamerahilfen. Kein Re-Export (legacy → rendering verboten), alle Importe umgestellt; drei Architekturausnahmen rendering → lib/bim/geometry entfallen, keine neue. Ergebnis-Hash über 14 Modelle (Geschosskörper, Gebäude, IFC) auf main und Branch gleich (benchmarks/storey-solid-hash.ts). 1331 Tests. Nachweis docs/plans/WALLWISE_REBUILD_CHANGE_MAP.md Abschnitt 9.

28.10.2026: Branch feat/slab-element (von main 58b9dae; mit PR486 am 28.10.2026 in main 797b319 integriert). Decke als Bauteil Teil A (L03, N47): Schema 29 mit `slabs` je Geschoss (Umriss, Stärke, Versatz OK), Migration 28 → 29, Registry-Eintrag, Aktionen addSlab/updateSlab, Werkzeug Decke (Polygon/Rechteck/Kontur), Eigenschaften mit OK/UK und Fläche, Grundriss gestrichelt mit leichter Füllung, Löschen, Ebene Decke. Verschieben/Umrissbearbeitung bewusst gesperrt; 3D/IFC unverändert (Teil B). 1337 Tests, Browserabnahme, Leistung l gleich main. Nachweis docs/SLAB_ELEMENT.md.

28.10.2026: Decken Teil B in drei PRs (Branches feat/slab-3d, feat/slab-ifc, feat/slab-edit; PR487/488/489, main e41b7b6). B1: geschlossener Deckenkörper im Geschossteil (Ohrenschneiden für L-Formen), OK = Geschosskote + Geschosshöhe + Versatz ohne neue geschossübergreifende Eingabe; Deckenflächen `slab` außerhalb der Wandwege; Picking/Hervorhebung. B2: IfcSlab FLOOR im besitzenden Geschoss, Abnahmehaus EG/OG (`scripts/generate-slab-acceptance-ifc.mjs`), Datei an den Nutzer; mit behoben: Geschoss nur mit Decke ohne 3D-Körper, Planeinpassung ohne Decken. B3: Verschieben in der Gruppenbewegung, Befehle Deckenstärke/Deckenversatz, Fangpunkte und 3D-Bewegungsursprünge an Deckenecken. Modelle ohne Decke in 3D/IFC und Bewegungsergebnisse gleich main (Hashes). 1342 Tests. Offen: Archicad-Abnahme, Eckpunkt-/Kantenbearbeitung (Bearbeitungstyp aus lib/bim lösen), Teil C.

29.10.2026: PR500 (feature/sicherungshinweis-unten-links): Nutzervorgabe – Wiederherstellungshinweis kompakt unten links in der ersten Ansicht statt Fenster oben rechts, ersetzt die kleine Anzeige nur solange die Entscheidung offen ist; Funktion unverändert. Browser 2D/3D geprüft; „Weiterarbeiten“ zum Schutz der Nutzerstände nicht geklickt. main 5e7e6ba.

29.10.2026: PR499 (feature/decke-wand-darstellung): Decken C3 Variante A. Nutzerentscheidung: Später bestimmt ein Material mit Vorrang 0–100, ob Decke oder Wand schneidet; bei gleichem Vorrang (heute immer) bleiben beide Körper vollständig und die Darstellung sauber. Darstellungsvorrang je Eckpunkt im 3D-Puffer (Decke vor Wand in gleicher Ebene, Tiefenversatz 1e-5), Geometrie/Picking/IFC unverändert; Archicad-Prüfdatei mit gebundenen Wänden durch die Decke. 1352 Tests, Browser-Gegenprobe (ohne Vorrang Keil sichtbar, mit Vorrang sauber). main afe5a96.

29.10.2026: Archicad-Abnahme der Decken durch den Nutzer: Import der Decken-Testdatei erfolgreich, Decken auf den richtigen Höhen; Fenster weiterhin RB 0,00 x 0,00 (Blocker 2 unverändert).

29.10.2026: PR498 (feature/fangpunkte-benennen): Polygon-Regeln Teil D, Nutzerentscheidung Muster „Element · Ecke n“. `application/snapping/point-label.ts` benennt Fangpunkte aus Element und Merkmal (Ecke/Punkt n, Wand Anfang/Ende/Ecke, Laibung, Start-/Letzter Punkt); Hilfspunkt und unbekannte Quellen unverändert. 1351 Tests, Browserabnahme. main bbee576. Polygon-Regeln A–D abgeschlossen.

29.10.2026: PR497 (feature/ecken-bewegen-loeschen): Polygon-Regeln Teil C. `geometry/polygons/vertex-merge.ts` (Ecke auf Ecke löscht, Ring/Pfad, mind. 3 Ecken, offene Polylinie schließt weiter), genutzt von Übernahme und beiden vorbereiteten Vorschauen; Klick auf Eckgriff startet „Punkt frei bewegen“, Rechtsklick öffnet das Punktmenü (Menü bleibt bei laufender Bearbeitung aus); Ecken des bearbeiteten Elements mit 10-px-Fangvorrang. Zwei ältere Tests („Ecke auf Nachbarecke ungültig“) umgestellt. 1350 Tests, Browserabnahme an der Decke. main cab565a. Offen: D.

29.10.2026: PR496 (feature/polygon-schliessen-startpunkt): Polygon-Regeln Teil B. `application/drawing/path-closure.ts`: Schließart je Werkzeug (polygon/polyline/none), Abschluss ab drei Punkten, Startpunkt mit 10-px-Fangvorrang (im Browser gewann sonst ein 30°-Winkelfang). Schraffur/Decke/Polylinie angebunden, Startpunkt markiert. 1349 Tests, Browserabnahme Decke/Polylinie. main f9855fa. Offen: C, D.

29.10.2026: PR495 (feature/standard-geschosse-deckenkontur): Nutzervorgabe Polygon-Regeln 1–7, Teil A. Neue Projekte (Programmstart ohne Datei) mit Erdgeschoss + 1. Obergeschoss je 3,00 m (`createStandardProject`); `createProject` und Testmodell unverändert. Ursache „Decke nur in 2D“: fehlende Geschosshöhe, ohne Hinweis (Nutzerentscheidung). Decke im Grundriss ohne Füllung, durchgezogene Linie in Wandkonturfarbe/-stärke. 1348 Tests, Browserabnahme. main 2062e35. Offen: Teile B, C, D.

29.10.2026: PR493 (refactor/direct-edit-out-of-lib): `lib/bim/direct-edit.ts` unverändert nach `application/direct-edit/session.ts`, Weiterleiter `lib/bim/transforms.ts` entfernt, 19 Architektur-Ausnahmen weniger. PR494 (feat/slab-vertex-edit): Deckenumriss im Grundriss über den gemeinsamen Schraffur-Bearbeitungsweg (Ecke, Strecken, Knicken, Seite, Offset konvex), vorbereitete Vorschau für Schraffur und Decke, 3D weiter nur Bewegen; 1347 Tests, Hash unverändert, Browserabnahme. main 2f94b06. Offen: Punkte löschen (Schraffur und Decke), C3.

29.10.2026: PR491 (fix/summary-doors-slabs): Lade- und Wiederherstellungsübersicht zählen Türen und Decken (`projectElementCounts`, `recoveryContentSummary`), 1344 Tests, Browser Wiederherstellung geprüft. PR492 (docs/l39-arbeitsweise): Arbeitsweise mit dem Nutzer in AGENTS.md, `.claude/launch.json` (Vite Port 8094 ohne feste Pfade) und `docs/WIEDERAUFNAHME.md` (Aufgabenliste L39); Start über die Konfiguration selbst nicht ausgeführt, Pfadauflösung geprüft. main 9b48baa.

29.10.2026: Decken Teil C1 (Branch feat/wall-storey-binding, PR490, main 2ad73dd). Nutzerentscheidung: Die Wandbindung ist eine Einstellung der Wand – gebunden = OK Rohfußboden des darüberliegenden Geschosses (eigene Kote + eigene Geschosshöhe) + Zusatzhöhe (z. B. Attika +0,50 m), frei = Höhe per Eingabe; eine eingegebene Höhe löst die Bindung; Decken ohne Einfluss auf die Wandhöhe. Schema 30 migriert „UK Rohdecke x, Stärke d“ zu „Geschoss, Zusatzhöhe x − d“ mit identischen Höhen. Liest nur die eigene Geschosshöhe (A08): oberstes Geschoss bindbar, Einfügen eines Geschosses darüber ändert nichts. Mit behoben: Schema-26/27-Dateien mit gebundenen Wänden ließen sich nicht laden. Nachweis: 14-Modell-Hash unverändert, gebundene Modelle (Höhen/3D/IFC) und Z-/XY-Bewegung gleich main nach Migration, 1343 Tests, Browserabnahme. Offen: C3 Überschneidung Wand/Decke; C2 (Decke als Bezug) zurückgestellt.

28.10.2026: Branch fix/replacement-char-text (von main 3781308; mit PR485 am 28.10.2026 in main 34a4714 integriert). „Bewegung nicht möglich.“ (CadWorkspace.tsx) und „Wände“ (benchmarks/solid-profile.html) statt beschädigtem Ersatzzeichen; Kodierungsprüfung in scripts/architecture-graph.mjs erkennt zusätzlich doppelt kodiertes („ï¿½“) und rohes U+FFFD in Produktionsdateien, Test mit Gegenprobe (alter Text wird gemeldet, alte Regel lässt den Test scheitern). 1331 Tests. Grenze: Benchmark-/Doku-Dateien nicht dauerhaft geprüft.

27.10.2026: Branch perf/move-start-origin (von main c9dd4cf; mit PR482 am 27.10.2026 in main 23bb830 integriert). Start der 3D-Gruppenbewegung: Bewegungsecken je Geschossteil gemerkt (nach Bearbeitung nur das geänderte Geschoss), Bildschirmraster statt Box-Index für die Ursprungsabfrage (Durchlauf bei sehr großen Koordinaten), Sichtbarkeitsindex bei Bedarf; Ergebnisse gleich der bisherigen Abfrage (Orakeltest). Node x: Ecken nach Bearbeitung 890→189 ms, Ursprungsabfrage 862→49 ms; Browser Start + Z-Achse l 300→161, x 3646→1670 ms. Rest bei x ≈ 1,5 s (Sichtbarkeitsindex beim ersten Hovern, Darstellung). 1329 Tests. Nachweis docs/performance/MOVE_START_ORIGIN.md.

27.10.2026: Branch perf/owned-move-confirmation (von main c4b0c29; mit PR481 am 27.10.2026 in main d3624d0 integriert). Beim Übernehmen einer Z-/XY-Gruppenbewegung genügt bei eigenem Projektstand der Identitätsvergleich statt erneuter Gesamtvalidierung (prepared-snapshot.ts); andere Eingaben weiter vollständig. Node: Z l 151→14, x 401→59 ms; XY l 253→102, x 665→307 ms (Ergebnisse byte-gleich); Browser Z-Übernehmen l 305→220, x 1093→689 ms. Rest bei x: 3D-Neuaufbau des Geschosses (≈ 0,6 s Undo/Redo). Neuer Befund: Z-Start bei x 2,5–3,3 s. 1327 Tests. Nachweis docs/performance/OWNED_MOVE_CONFIRMATION.md.

27.10.2026: Branch test/school-run-coverage (von main 58f0ec1; mit PR480 am 27.10.2026 in main 2b3c922 integriert). Schullauf ergänzt (nur Messprogramm): Z-Bewegung über die 3D-Gruppenbewegung mit Undo/Redo und Prüfung im gespeicherten Stand, IFC-Export mit Bauteilzählung, SHA-256-Inhaltsvergleich von Projektdatei und IFC vor/nach Wiederherstellung, repeat=N für Kalt/Warm. s/l je 3, x 2 Läufe: alle Schritte ok, Inhalt gleich; kalt ≈ warm. Befund: Z-Übernehmen x ≈ 1,1 s, Undo/Redo 0,7–0,85 s. Nachweis docs/acceptance/SCHOOL_RUN.md (Ergänzung 27.10.).

27.10.2026: Branch fix/aud14-07-small (von main a4c7536; mit PR479 am 27.10.2026 in main bc98771 integriert). Zwei Laufzeittexte mit kaputten Umlauten korrigiert; check:architecture meldet künftig doppelt kodierte UTF-8-Texte in Produktionsdateien (Test und Gegenprobe); doppelter Testeintrag entfernt (Node lief ihn ohnehin einmal); §9-AUD14-Tabelle erneuert, Zeilenzahlen aktualisiert, „Schema 16“ als historisch markiert. Register-PR-Angaben korrekt (Konvention „Vorgänger gemergt“); im Abgleich übernommene Belege gegen Git korrigiert (PR344–346, PR404–411). 1325 Tests. Nachweis docs/AUD14_ABGLEICH.md.

27.10.2026: AUD14-Abgleich (reine Prüfung/Messung auf main 07f88e1, Code unverändert). Je ID am Code belegt: 01 erfüllt (PR319), 02 erfüllt (PR320), 03 teilweise (Native-/GPU-Frame-Gate, Kaltaufbau), 04 teilweise (Wand x/y/axis zurückgestellt, Fangindex-Rest), 05 teilweise (große Gruppen neu messen, Kamerawechsel), 06 teilweise (echte Quota/Tabs/Langlauf/Prozessspeicher), 07 teilweise (zwei Umlaut-Texte, doppelter Testeintrag, Schullauf ohne Z/IFC/Inhaltsvergleich). Schullauf im Produktions-Build: s, l 2×, x alle Schritte ok, keine Fehler, Wiederherstellung ok; Bearbeitung Dauerlauf Median s 68 / l 170–178 / x 492 ms. Nachweis docs/AUD14_ABGLEICH.md, benchmarks/aud14-abgleich-school-runs.json.

27.10.2026: Branch fix/ifc-file-description (von main b87980d; mit PR478 am 27.10.2026 in main 886d4ba integriert). Der normale IFC-Export schreibt wieder „NOVIKOV CAD parametric BIM export“ statt des Ecktest-Texts, sobald verbundene Wände Profile liefern; die Beschreibung bestimmt der Aufrufer, Eck- und T-Testausgabe behalten ihren Text. Gegen main ändert sich nur diese Kopfzeile im normalen Export mit Anschlüssen. 1325 Tests. Nachweis docs/T_IFC_ACCEPTANCE.md (Befund nebenbei).

27.10.2026: Branch test/t-ifc-acceptance (von main 16bc1f9; mit PR477 am 27.10.2026 in main a5cd1ed integriert). Archicad-Abnahme der T-Anschlüsse vorbereitet (ohne IfcOpenShell): neun Varianten (90°/60°/45°/30°/15°/5°, Wandmitte, beidseitig, T an Hauptwand mit 120°-Ecke) über normale Aktionen und normalen IFC-Export; Sammeldatei NOVIKOV-T-Anschluss-Test.ifc, Einzeldateien, erwartete Werte (scripts/generate-t-acceptance-ifc.mjs). Node-Test liest die IFC zurück: Profile gleich Grundrisskontur, Flächen gleich unabhängiger Rechnung, keine Überlappung, Kontakt entlang einer Kante, Öffnungen an ihren Wänden; Gegenproben. Produktcode unverändert. 1324 Tests. Archicad-Import durch den Nutzer am 27.10.2026 bestätigt: alle Wandanschlüsse korrekt, Wände als Wände erkannt, Höhen und Materialien änderbar, Brüstungen erkennbar; Fensterstempel zeigt RB 0,00 x 0,00, Fenstermaße nicht änderbar (IfcWindow ohne Geometrie/Typ). Befund: normaler Export trägt bei verbundenen Wänden die Dateibeschreibung der früheren Eck-Testausgabe. Nachweis docs/T_IFC_ACCEPTANCE.md.

27.10.2026: Branch perf/autosave-model-checks (von main 113d33e; mit PR476 am 27.10.2026 in main 4d55410 integriert). Autosicherung ohne wiederholte Modellprüfung: eigener Projektstand ohne erneutes validateProject, vorbereitetes Modell tief eingefroren (domain/project/frozen-data.ts), beim Versiegeln geteilt und bei der Speicherprüfung dem geprüften Projekt zugeordnet, Modellgröße je Modell einmal; Wiederherstellen und fremde Eingaben weiter vollständig. Schulmodell l je Sicherung: Node 807–843 → 49 ms, Browser 694–864 → 138–214 ms, lange Aufgaben 632–767 → 0–123 ms (seit vor PR475: ≈ 1,1–1,3 s → 0,14–0,21 s). Übrig: Vorbereiten ≈ 50 ms, IndexedDB-Schreiben ≈ 0,1 s. 1313 Tests. Nachweis docs/performance/AUTOSAVE_MODEL_CHECKS.md.

27.10.2026: Branch perf/autosave-image-checks (von main 635ae4e; mit PR475 am 27.10.2026 in main a142279 integriert). Autosicherung prüft beim Speichern nur Bilder, die die Sitzung nicht selbst vorbereitet hat: selbst gehashte Bilder werden über ihre Identität verknüpft, Sicherungsstände versiegelt (eingefrorene Kopie, Bilder geteilt), ein geprüfter Vorgänger nicht erneut geprüft, gespeicherte Bilder nur auf ihren SHA-256-Schlüssel geprüft; Wiederherstellen prüft weiter alles. Schulmodell l (21 MB Bilder), Sicherungslauf 2 × 4: je Sicherung 1097–1270 → 571–706 ms Rechenzeit, lange Aufgaben 634–863 → 507–640 ms; verbleibend Modellprüfung/Vorbereiten ≈ 0,4 s. 1310 Tests. Nachweis docs/performance/AUTOSAVE_IMAGE_CHECKS.md.

27.10.2026: Branch perf/snap-visibility-index (von main af86749; mit PR474 am 27.10.2026 in main f5ceba5 integriert). Sichtbarkeitsprüfung eines Fangkandidaten in 3D über den vorbereiteten Flächenrahmen-Index statt über alle Gebäudeflächen (Arbeitsebene auf Öffnungshöhe und Geschossebene), Index erst bei der ersten Abfrage; Antworten gleich der Vollsuche (576 Punkte). Türziehen l: Prüfung 15,5 → 0,1 ms, 30 Bewegungen 648–673 → 476–504 ms; s 460–526 → 412–452 ms; vollständiger Schullauf l Türziehen 2315/2123 → 1845/1687 ms. Einmaliger Index-Aufbau 34–54 ms je Ziehvorgang bleibt. 1305 Tests. Nachweis docs/performance/SNAP_VISIBILITY_INDEX.md.

27.10.2026: 3D-Darstellung beim Türziehen gemessen (reine Messung auf main 2e7c4b9, Diagnose-Build render-profile, benchmarks/school-acceptance.html?drag=1). Normale Bewegung passt in ein Bild (s/l ≈ 16 ms; Türberechnung 2–3 ms, Neuzeichnen bis Zeichenaufruf ≈ 8 ms, Zeichenaufruf 0,1 ms, Grafikkarte s 3 / l 5,5 ms): Darstellung und Grafikkarte sind nicht der Engpass, ein Umbau der Darstellung lohnt nicht. Ausreißer bei l: an 5 von 30 Mauspositionen kostet das Fangen 15–20 ms und das folgende Neuzeichnen ≈ 24 ms, die Bewegung 45–67 ms; dieselben Stellen erklären die langen Abstände im vollständigen Schullauf. Keine Korrektur (nur Messung). Nachweis docs/performance/DRAG_RENDERING_3D.md, benchmarks/drag-rendering-3d-results.json.

26.10.2026: Branch perf/offset-command (von main 69e480c; mit PR473 am 26.10.2026 in main e376776 integriert). Offset-Textbefehl läuft direkt im gemeinsamen Befehlsweg; lib/bim/commands.ts (Serialisieren des ganzen Projekts als Vergleichstext) und drei Architektur-Ausnahmen entfallen; das Ergebnis ist ein eigener geprüfter Stand, Übernehmen rechnet nicht erneut. Schulmodell l mit Bildern: Vorschau 186/199 → 34/15 ms, Übernehmen ≈185 → 0 ms; Ergebnisse byte-gleich zu main; 1302 Tests. Nachweis docs/performance/OFFSET_COMMAND.md.

26.10.2026: Branch perf/picking-per-storey (von main 14f6681; mit PR472 am 26.10.2026 in main 610ba44 integriert). Picking-Index der 3D-Ansicht je Geschossteil: unveränderte Geschosse behalten ihren Teilbaum, nach einer Bearbeitung wird nur das geänderte neu indiziert; Treffer und Entscheidung bei gleich tiefen Treffern unverändert. Node nach Bearbeitung: l 314 → 53 ms, x 3615 → 581 ms, 0 Abweichungen an 768 Punkten je Modell; Browser l (3 Wechselpaare) Türziehen 1753 → 1599 ms; 1301 Tests. Nachweis docs/performance/PICKING_PER_STOREY.md.

26.10.2026: Branch perf/recovery-check-callers (von main 29f8ea6; mit PR471 am 26.10.2026 in main b11851b integriert). Diagnose recovery-profile ordnet jede vollständige Sicherungsprüfung ihrem Aufrufer zu. Befund Schullauf l: keine Prüfungen je Bearbeitung; der neu vorbereitete Sicherungsschreiber prüfte eigene oder schon geprüfte Stände erneut (nach Öffnen, Redo über Datei-Öffnen hinweg, Neu öffnen). Korrektur: eigene oder in der Sitzung vollständig geprüfte Revision wird von Schreiber und Statusanzeige übernommen, Rückfallstand aus privater Kopie; Wiederherstellen unverändert vollständig. Diagnose 4 → 1 Prüfung; Browser l (3 Wechselpaare): Redo 145 → 111 ms, Bearbeitungszyklus p95 247 → 192 ms; 1298 Tests. Nachweis docs/performance/RECOVERY_CHECKS.md.

26.10.2026: Browser-Vergleich 3D und Autosicherung (reine Messung, main fba664d gegen 8534bf7, Schullauf mit Bildern, Fenster sichtbar). Modell l, Median aus 3 Wechselpaaren: 2D→3D 230→153 ms, Summe Umschalten bis Türziehen 2715→2741 ms (unverändert, Arbeit verschiebt sich in Szene/Ziehen), belegte Rechenzeit im 3D-Fenster −17 % (validateProject 56→18 Stichproben). Statusanzeige in beiden Ständen sofort aktuell; vollständige Sicherungsprüfungen (restoreCheckedSnapshot) laufen weiter nach Bearbeitungen, Aufrufer offen. Keine Korrektur (Nutzerentscheidung). Nachweis docs/performance/RECOVERY_STATUS.md, benchmarks/recovery-status-browser-results.json.

26.10.2026: Branch feat/auto-t-any-angle (von main e09269d; mit PR470 am 26.10.2026 in main df4936d integriert). Nutzerbefund: 15°-Anschluss an vorhandene Wand nicht möglich. T-Anschluss in jedem Winkel außer parallel; Wandende genau auf einer fremden Achse (Zeichnen, Kettenanfang, Endpunkt ziehen) verbindet automatisch, unabhängig vom Fang (eingetippt, Wandmitte, Raster); Kreuzung, belegtes Ende, parallel oder regelwidriger T bleiben unverbunden; Laden unverändert. Schräger T mit einseitigem Wandkörper: Körperkante bis zur Hauptwandfläche verlängert. Tests 90°–1° mit Gegenproben; alle bisherigen Modelle unverändert gegen main; 1294 Tests. Browserabnahme 26.10.2026 bestanden (15°, 5°, eingetippt, Ziehen mit Rückgängig; Gegenproben Überschneidung und zu kurz). Nachweis docs/OBLIQUE_T_JUNCTIONS.md.

26.10.2026: Branch feat/oblique-corner-t (von main 053988b; mit PR469 am 26.10.2026 in main 3a365bc integriert). Schräge Ecke an einer T-Hauptwand erlaubt (Winkelregel in corner-t-contact.ts entfällt; Eckbereichs- und Partnerprüfung unverändert). Tests 45°–135° mit Gegenproben; alle bisherigen Modelle unverändert; 1282 Tests. Nachweis docs/OBLIQUE_T_JUNCTIONS.md.

26.10.2026: Branch feat/oblique-t-junctions (von main 78eb5b3; mit PR468 am 26.10.2026 in main 2c77fdf integriert). Schräge T-Anschlüsse: Mindestwinkel 15° statt rechter Winkel; der Fang an der Wandachse bietet beim Zeichnen den schrägen Fußpunkt an, nahe dem Lot gewinnt weiter der rechte Winkel. Tests 90°–15° mit Gegenproben; alle bisherigen Modelle unverändert gegen main; 1277 Tests. Schräge Ecke an einer T-Hauptwand offen. Nachweis docs/OBLIQUE_T_JUNCTIONS.md.

26.10.2026: Branch perf/recovery-status-after-save (von main 97bfcd1; mit PR467 am 26.10.2026 in main 4ad7396 integriert). 3D und Autosicherung nach einer Bearbeitung: Statusanzeige bestätigt eine eigene Sicherung über ihre Revision statt alle Bilder zurückzulesen und zu hashen (Node, l mit 21 MB Bildern: 327 → ≈ 0 ms je Sicherung); Wandfuß-Fangquellen nutzen den Geschossteil der 3D-Szene statt zweiter Prüfung und Extrusion. Türziehen in 3D gemessen: ≈ 17 ms je Mausbewegung, keine Korrektur nötig. Picking-Index je Geschoss offen; Browser-Vergleich ausstehend (Fenster verdeckt). 1270 Tests. Nachweis docs/performance/RECOVERY_STATUS.md.

26.10.2026: Branch fix/opening-hit-tolerance (von main e01e17f; mit PR466 am 26.10.2026 in main fba664d integriert; Browser-Schullauf l danach 34/34 fehlerfrei, „Tür setzen“ 283 ms). Treffertoleranz beim Setzen von Türen und Fenstern: 8 Bildpunkte am aktuellen Maßstab, Vorrang für die Wand, deren Körper den Punkt enthält; Toleranz 0 unverändert. Tests mit Gegenprobe; 1266 Tests. Nachweis docs/OPENING_HIT_TOLERANCE.md.

26.10.2026: Branch feat/wall-junctions (vom Stand PR464; mit PR465 am 26.10.2026 in main e9dcf7a integriert). Wandanschlüsse nach Änderungskarte: Wand-/Fensterbefehl nennen die echte Ursache; T und Ecke mit unterschiedlicher Wandstärke/Höhe (Ecke unterschiedlicher Höhe als Stumpfstoß, höhere Wand läuft durch); mehrere Anschlüsse je Wand (T an beiden Enden, T plus Ecke, Haupt- und Nebenwand zugleich; ein Anschluss je Wandende, keine gegenseitigen T). Gleichheit: alle bisher gültigen Modelle behalten Konturen und Wandkörper exakt; Schulmodell mit 24-cm-Trennwänden und 24 T-Anschlüssen je Geschoss, IFC 80 Wände/180 Öffnungen, Browserlauf s fehlerfrei; 1261 Tests. Schräge T-Anschlüsse, Mehrfachknoten und IFC-Anschlussbeziehungen offen. Nachweis docs/WALL_JUNCTIONS.md.

26.10.2026: Branch perf/edit-cycle-part-b (von main b353e82; mit PR464 am 26.10.2026 in main f5d5cd3 integriert). Wartezeit Teil B: Fang-Index in Blöcken je Bauteilart mit Fangpunkten je Wand, Wandkonturen je Stand einmal, Schema-Prüfung je Bauteil im geänderten Geschoss nur für eingefrorene Bauteile eigener Stände (Wände ausgenommen), Gebäude je Geschoss wiederverwendet. Gleichheit: 10 668 Fangabfragen, 13/13 Befehle gegen erneutes Ausführen, volle Prüfung und Neuaufbau; 1252 Tests. Node je Bearbeitung s/l/x 36 → 9, 106 → 27, 310 → 178 ms. Browser l: Bearbeitungszyklus vor Teil A 296 ms → neu 186/156 ms (Mittel −42 %, Abnahme im Mittel erfüllt). 3D nach Bearbeitung im Browser nicht verbessert (Picking-Index, Bildprüfung der Autosicherung, Vorschau je Mausbewegung). Browser s/x gegen Teil A: Bearbeitungszyklus 83 → 64 und 522 → 390 ms (je −24/−25 %). Nachweis docs/performance/EDIT_CYCLE.md.

26.10.2026: Branch feat/edit-cycle-speed (von feat/history-memory; PR462 landete in feat/history-memory, mit PR463 am 26.10.2026 in main 61715bc integriert). Wartezeit Teil A nach Änderungskarte: Übernehmen nutzt das eigene geprüfte Vorschauergebnis statt den Befehl erneut auszuführen; die lokale Wandextrusion wird über Stände geteilt (exakter Eingabeschlüssel, ein Eintrag je Wand). Gleichheit 13/13 Befehle mit Gegenprobe, 1249 Tests. Node je Bearbeitung s/l/x −43/−45/−61 %; Browser-Bearbeitungszyklus 103 → 78, 291 → 213, 956 → 496 ms; Fang p95 bei x 507 → 28 ms, Löschen bei x 1923 → 723 ms; Undo unverändert. Abnahme bei x erfüllt, bei l nicht (−27 % statt ≥ 40 %; Rest: Fang-Index-Neuaufbau, Vorschauprüfung). Nachweis docs/performance/EDIT_CYCLE.md.

25.10.2026: Branch feat/history-memory (von feat/school-acceptance-run; mit PR461 am 26.10.2026 in main a727611 integriert). Speicher und Verlauf nach Änderungskarte mit vier Empfehlungen: Heap-Nachweis (97–98 % des Zuwachses waren pro Stand gecachte Ableitungen im Verlauf), Verlauf nach application/history und Gebäude-Geometrie nach rendering/viewport verlegt (lib/bim/history.ts nur Datei-Brücke, Architektur-Ausnahmen 67 → 57), Ableitungen nur noch für den aktuellen Stand (domain/project/derived-cache.ts), Speicherbudget 256 MB mit Hinweis am Undo-Knopf. Dabei Fehler im Musterabgleich behoben: der Editor ersetzte den Verlaufsstand nach jedem Commit/Laden/Undo/Redo durch eine veränderliche Kopie, wodurch jeder Schritt das ganze Modell kopierte. Ergebnis: Zuwachs je Bearbeitung (Node) s/l/x −100 / −99,6 / −97,6 %; Bearbeitungszyklus im Schullauf 304 → 103, 862 → 284, 3219 → 946 ms; Autosicherung bei x ohne Long Task (vorher 3,2 s); Undo unverändert, Redo ≤ 1,21×. 1245 Tests. Nachweis docs/performance/HISTORY_MEMORY.md.

25.10.2026: Branch feat/school-acceptance-run (von main bae380f; mit PR460 am 26.10.2026 in main a727611 integriert). Basislinie Abnahmelauf am fünfgeschossigen Schulmodell (Plan-Fixture s 2970 / l 9980 Elemente, x 20 k synthetisch, je Geschoss ein 5-MB-Abbild) im Produktionsbuild über die echte Oberfläche: Öffnen, Geschosswechsel, Befehle, Tür setzen/ziehen 2D/3D, Löschen, Fang, Undo/Redo, Speichern, Neu-Öffnen, 50 Bearbeitungen, Wiederherstellung. Alle Schritte bestanden, keine Konsolenfehler, kein Error-Boundary (3D-Fall vom 24.10. nicht reproduziert). Befehl übernehmen 0,1 / 0,3 / 1 s, Sitzungszyklus median 0,3 / 0,9 / 3,2 s, Fang p95 21 / 22 / 475 ms, Autosicherung bei x 3,2 s Long Task. Speicher größtes Risiko: ≈ 15 / 55 / 240 MB je Bearbeitung, Heap bis 0,9 / 2,5 / 2,9 GB. Fachgrenze: Trennwand nur ein T-Anschluss. Keine Zielwerte (Nutzerentscheidung). 1241 Tests. Nachweis docs/acceptance/SCHOOL_RUN.md, Rohdaten benchmarks/school-acceptance-results.json.

25.10.2026: Branch fix/hover-reference-idempotent (von main 6acc8e4; mit PR453 am 25.10.2026 in main a0a7048 integriert). Hover-Fang rendert eine Pausierung derselben Sitzung nur bei geändertem Fangzustand; reine Zustandsschritte behalten bei unverändertem Zustand ihre Identität. Damit kann ein pro Render neu gebauter Hover-Kontext keine Render-Schleife mehr auslösen (Anlass: „Maximum update depth exceeded“ in useHoverReference vom 24.10.). Auslöser in BimSolidView statisch nicht nachweisbar; Error-Boundary-Fall offen. 1195 Tests, Typen, Lint, Architektur bestanden; 2D/3D-Hover im Browser geprüft. Nachweis docs/hover-render-loop.md. §9-Auftrag unverändert.

24.10.2026: PR438 grün in main658d390 integriert. Isolierter statischer Browservergleich:96 vollständige Phasenvergleiche und1536 geordnete Queries exakt, keine Browserfehler. Einzeländerungen median16–23 % schneller, Vollinvalidierung3–25 % langsamer; Kalt uneinheitlich. Kandidat geparkt, keine Produktübernahme. Typen/Lint/Diagnosebuild bestanden; kein Gesamtframe-/Native-/Peak-Speichernachweis. Nachweis docs/primitive-browser.md. Nächster Einzelauftrag §9: verbleibende Wand-x/y/axis-Pfade abgleichen und messen.

Historisch: 24.10.2026: PR437 grün in main831a8a5 integriert. Einmalige gemeinsame Cache-Kaltbefüllung nach erfolgreichem vollständigem Indexaufbau geprüft;464 geordnete Queries und zusätzliche Sicherheitsvergleiche exakt. Kleine Änderungen in16/16 Vergleichen22–34 % schneller, Kaltaufbau in13/16 und Vollinvalidierung in13/16 langsamer. Produktion unverändert; Typen/Lint bestanden. Heapdeltas sind keine Gesamt-/Peakmessung. Nachweis docs/primitive-cold-seeding.md. Nächster Einzelauftrag §9: isolierter Browservergleich des unveränderten Kandidaten.

Historisch: 24.10.2026: PR436 grün in main19a6ddc integriert. Begrenzter Linien-/Schraffur-Primitive-Kandidat mit exaktem Punktvergleich statt Objektidentität geprüft: 400 geordnete Queries sowie vollständige Daten/Lookup-Vergleiche exakt, neun zusätzliche Sicherheitsvergleiche bestanden. Änderungen 10–32 % schneller, Kaltaufbau 2–28 % langsamer; zusätzlicher Cacheheap offen ausgewiesen. Daher keine Produktübernahme. Benchmark-Typen/Lint bestanden, keine Browser-/Framefreigabe. Nachweis docs/drawing-primitive-reuse.md; nächste Kaltbefüllungsvariante ausschließlich §9.

Historisch: 24.10.2026: PR435 grün in main aab56c7 übernommen. Sechs echte Streck-Commits zeigen neuen vollständigen Fangindex; bei 1.000 unveränderten Schraffuren je 100 Punkten rund 1,1 s Neuaufbau und nur fünf geänderte/neue Referenzen. Vorschau-/Filterkontrollen und Undo/Redo behalten ihren Index; alte Vorschau wird abgewiesen. Unveränderte Elementobjekte werden beim Commit kopiert. Benchmark-Typen/Lint und Diagnoseassertionen bestanden. Produktion unverändert, Einzelmessungen ohne Frame-/Browsergarantie. Nachweis docs/snap-index-invalidation.md; Folgeauftrag ausschließlich §9.

Historisch: 24.10.2026: PR434 nach grüner CI in mainea69b0c integriert. Mittelpunkt-Kandidat erhält geordnete Ergebnisse, bringt aber gemischte Gesamtzeiten und höheren Speicherbedarf. 64 Vergleiche plus720 bestehende Query-Fälle und Grenzchecks bestanden; Benchmark-Typen/Lint grün. Produktion unverändert. Nachweis docs/spatial-sort-centres.md. Nächster Einzelauftrag: Indexinvalidierung bei kleinen Modelländerungen messen statt weiterer unbelegter Mikrooptimierung.

24.10.2026: PR433 nach grüner CI in mainbc17460 übernommen. Builder aus aktuellem Quelltext mit geprüften Instrumentierungsankern in Memory gemessen. 90 Abfragen exakt; Benchmark-Typen/Lint bestanden. Bei200000 Punkten normaler Aufbau218–231ms, instrumentierte Sortierung139–146ms; bei100000 Segmenten normal97–104ms. Instrumentierungs-/Allokationseinfluss ausdrücklich begrenzt; keine Frameaussage. Details docs/spatial-index-phases.md. Nächster Kandidat: gleiche Sortiermittelpunkte einmal je Eintrag berechnen.

24.10.2026: PR432 nach grüner CI in maine2be47e übernommen. Allgemeine WeakSet-Besuchsmenge langsamer und allokationsintensiver; engere Referenzmenge bei1000 Konturen in3/4 Paaren langsamer. Je48 Abfragen exakt, tiefer Mutationsschutz erhalten. Keine Produktübernahme; Diagnosekandidaten und Messwerte erhalten. Details docs/snap-freeze-once.md. Nächster Einzelauftrag: räumlichen Indexaufbau aufschlüsseln.

24.10.2026: PR431 nach grüner CI in mainda58c83 übernommen. Optionaler synchroner Messwrapper trennt Primitive, Referenz-/Segment-Freeze, Lookup und Punkt-/Segmentindex. Drei frische Fixtures je10/100/1000 Konturen; 72 Abfragen exakt, Segmentdaten und Cacheidentität erhalten. Bei1000: Freeze gesamt302–513ms, räumlicher Aufbau374–594ms. Kein Produktgewinn behauptet. Nachweis docs/snap-index-build.md; nächster begrenzter Kandidat: mehrfaches Traversieren gemeinsam verwendeter Objekte beim Einfrieren vermeiden.

24.10.2026: PR430 nach grüner CI40033192207 in mainad0261d integriert. Diagnose trennt Adaptervorbereitung, lokalen Patch, Materialisierung, Sichtbarkeit, Planableitung, Runs und Fangquellen. 108 Vollpfadvergleiche exakt. Warme Planableitung bei1000 unbeteiligten100-Punkt-Konturen0,15–0,40ms, lokale Quellenabfrage etwa0,09ms; kalter Fangindex1017–1162ms, warm identisches Indexobjekt. Keine Produktänderung. React/SVG/Frames nicht gemessen; Nachweis docs/plan-stretch-phases.md. Nächster Einzelauftrag: kalten Fangindex aufschlüsseln.

24.10.2026: PR429 nach grüner CI in main13a5906 integriert. Vorbereitete Linien-/Schraffuradapter akzeptieren stretch und verwenden die gemeinsame stretchOffset-Rechnung direkt auf den ursprünglichen Griff. Nachbargrenze, Konturprüfung, gepinnter Kontext und vollständiger Commit bleiben erhalten. 1155 Tests, Typen, Architektur, Lint und Build bestanden; 216 Maus-/Numeric-Vergleiche ohne Abweichung, 24 Commit-/UndoRedo-/Abbruchfälle, 72 Schutzchecks. Browser: schräge Linie +0,5 m, Undo/Redo, Nachbarüberquerung gesperrt und Escape; gedrehte Schraffur -0,2 m, Platzieren und Undo/Redo. Patch lokal; Materialisierung/2D-Planableitung enthalten weiterhin globale Arbeit. Nachweis docs/prepared-drawing-stretch.md.

24.10.2026: PR428 grün in main73023e5 integriert. Geometry stretchOffset und directionOffset teilen die ursprüngliche Versatzarithmetik; stretchOffset erhält die feste Nachbargrenze1e-9 m. DirectEdit verwendet sie für vorhandene Streckaufrufe.72 unabhängige Altformelfälle plus Grenz-/Ungültigfälle und1154 Tests bestanden. Kein neuer Browserablauf oder Performancegewinn behauptet. Details docs/shared-stretch-offset.md; nächste Aufgabe: vorbereitete2D-Punktstreckadapter mit direkter Offsetübergabe anbinden.

24.10.2026: PR427 grün nach main38e9b9f übernommen. Diagnose der Linien-/Schraffur-Punktstreckpfade: vorhandene vorbereitete Punktaktionen geeignet als Basis, direkter Anschluss jedoch durch36/216 Maus- und52/216 Numeric-Abweichungen sowie fehlende Nachbargrenze gesperrt.24 Commit-/UndoRedo-/Abbruchfälle und72 Schutzchecks bestanden. Vollvorschau wächst mit Restmodell, Punktpatch bleibt lokal. Keine Produktänderung; Nachweis docs/point-stretch-inventory.md. Nächster Einzelauftrag: gemeinsame Streckversatzrechnung mit bestehender Nachbargrenze.

21.10.2026: PR426 nach grüner CI39658711284 in main3fb1943 integriert. Folgebranch feat/shared-element-axis bindet „Element entlang Achse“ einzelner Linien/Schraffuren im Grundriss an vorbereitete gemeinsame Auswahlbewegung an. Application pinnt rohe Konturrichtung und bestehende editSnapPolicy; UI reicht nur Bindung weiter.1153 Tests, beide Typprüfungen, Architektur/Lint/Build bestanden; je36 Projekt-/Ziel-/Numeric-Vergleiche exakt. Browser Linie/Schraffur mit anderem Griff, signierter Eingabe, Shift-Klick, UndoRedo und Abbruch geprüft. Keine Frame-/Native-Gesamtfreigabe. Änderungskarte/Nachweis docs/shared-element-axis.md. Einziger Folgeauftrag §9: verbleibende Punktstreckpfade inventarisieren und messen.

Historisch: 21.10.2026: PR425 nach grüner CI39657525588 in main4020047 integriert. Folgebranch fix/shared-oblique-axis-offset vereinheitlicht die schräge Translationsarithmetik über geometry.directionOffset;1152 Tests, beide Typen/Architektur/Lint/Build bestanden.108 vollständige Projekte/Ziele/Numeric-Vergleiche exaktgleich, unabhängige alte Formel und12 DirectEdit-Commits/UndoRedo geprüft. Keine neue UI-Anbindung oder Browser-/Framefreigabe; Details docs/shared-oblique-axis-offset.md. Einziger Folgeauftrag §9 „Element entlang Achse“ Linie/Schraffur in2D anbinden.

Historisch: 21.10.2026 PR424 nach grüner CI39656147211 in main be0c9b4 integriert. Folgebranch feat/shared-fixed-xy bindet feste signierte2D-X/Y-Bewegungen einzelner Linien/Schraffuren an gemeinsamen Auswahlpatch an. 1148 Tests, beide Typen/Architektur/Lint/Build und praktische Browserabläufe bestanden. Tatsächlicher Adapter:72 Projekte/Zielgeometrien/Numeric-Vergleiche exakt; keine Frame-/Native-Gesamtfreigabe. Details docs/shared-fixed-xy.md; damaliger Folgeauftrag gemeinsame schräge Projektion ist im Folgebranch ausgeführt.

Historisch: 21.10.2026 PR423 nach grüner CI39655273206 in main f9d47b3 integriert. Folgebranch fix/shared-hatch-translation vereinheitlicht Musterursprung über die ursprüngliche Translation und vorhandene gemeinsame Punktaddition. 1144 Tests, Typen/Architektur/Lint/Build und Browserprüfung bestanden. 72 X/Y-Mausprojekte/Ziele und72 Numeric-Projekte exaktgleich; 12 DirectEdit-Commits/Undo/Redo entsprechen Vollvorschau. Schräge Doppelprojektion bleibt offen. Änderungskarte und Grenzen docs/shared-hatch-translation.md; damaliger Folgeauftrag fester gemeinsamer2D-X/Y-Adapter ist jetzt im Folgebranch ausgeführt.

Historische Diagnose vor Musterfix: 21.10.2026 PR422 nach grüner CI39654061739 in main28db1af integriert. Diagnose der axis/x/y-Reste bestätigt feste signierte Achsen und volle Projektvorschauen. Schräge Doppelprojektion sowie unterschiedlich berechneter Musterversatz verursachten letzte-Nachkommastellen-Abweichungen gegenüber Auswahltranslation; keine universelle Exaktgleichheit aus früheren bestandenen Fixtures ableiten. Details docs/drawing-axis-inventory.md; damaliger Folgeauftrag gemeinsame Musterverschiebungsarithmetik ist im Folgebranch ausgeführt.

Historisch: 21.10.2026 PR421 grün in main 926c720 integriert. Folgebranch routet einzelne Linien/Schraffuren bei freier Bewegung im Grundriss über gemeinsame Auswahlbewegung. 1140 Tests, Typen/Architektur/Lint/Build bestanden; Browser: Linie per Klick, Musterschraffur Winkel/Tab/Länge/Enter, Undo/Redo und Abbruch. 36 Projekt-/36 Patchvergleiche der damaligen Fixture exaktgleich; keine universelle Bitgleichheits- oder Frame-/Native-Gesamtfreigabe. Änderungskarte/Abnahme: docs/single-drawing-move.md. Damaliger Folgeauftrag §9 Achsenabgleich/-messung ist jetzt ausgeführt.

Historische Inventur: 21.10.2026 PR420 in main df3dcd5 integriert. Inventur korrigiert überholte Legacy-Angaben für Linienkonturen, Fenster2D und Wandgriffe. Einzel-Linie/Schraffur move damals noch voller Projektpfad, gemeinsamer Auswahlpatch vorhanden und exaktgleich. 69 Tests, Typen/Lint bestanden; docs/legacy-movement-inventory-2026-10-21.md.

21.10.2026: PR408 grün in main 1471a31 integriert. Zwei Gebäude-Phasenmessungen mit 84 vollständigen Flächen-/Volumen-/Bounds-Vergleichen bestanden. Bei 1004 Wänden/1002 Fenstern entfallen 71–73 ms von 105–113 ms instrumentierter Gesamtzeit auf wiederholte Fensterzuordnung. Kein Produktfix in diesem Messauftrag.

21.10.2026: PR407 nach grüner CI in main bb53387 integriert. Pufferpacker im Folgebranch schreibt direkt in einen passend dimensionierten Float32Array. Unveränderte Fan-Triangulierung und Double-Arithmetik bis zum finalen Schreibzugriff; bytegleicher Vergleich gegen vorigen Algorithmus einschließlich mehrseitiger Flächen, großer Koordinaten und Auswahlfarben. 1136 Tests und Produktionsbuild bestanden. Nachmessung und Grenzen im datierten Nachweis am Ende.

21.10.2026: PR406 grün in main 0dc7fab integriert. Kalte 3D-Dienste mit 4/104/1004 Wänden und 2/102/1002 Fenstern, mutable und owned Eingängen, je sieben frischen Szenen in zwei Prozessen gemessen. Szenenaufbau nicht als wiederkehrende Bewegungskosten zählen. 336 vollständige Wand-/Fenstervergleiche und 84 exakte Puffervergleiche bestanden. Einzelheiten im datierten Nachweis am Ende; keine neue Browser-/Frameabnahme.

21.10.2026: PR405 nach grüner CI in main c18c64b integriert. Frischer statischer Produktbrowser: zwei EG-Wände mit Fenster, drei Zahlenvorschauziele, Platzierung, Undo/Redo, erneute Vorschau/Abbruch; Fensterebene aus/ein, EG-Höhe 3,0 auf 3,5 m, OG-Wechsel und Fensterauswahl. Fünf regulär geladene Projektdateien entsprechen vollständig den Geschossdaten und Arbeits-/EG-Kontexten der gemeinsamen Vollprojektaktionen. Keine Konsolenfehler; kein kontinuierlicher Pointer-/Framebeleg.

21.10.2026: PR404 nach grüner CI in main bf543d0 integriert. BimSolidView berechnet im Folgebranch die Gebäude-Fensterbasis nur bei Modell-/Sichtbarkeitsänderung neu; geometryPatch setzt auf der gemeinsamen unveränderten Basis auf. 1134 bestehende Tests plus neue Basisregression bestanden, Typprüfung/Lint/Architektur und Builds grün. CPU-Gegenmessung bei 1002 Fenstern: bisheriger Basisaufbau 1,0825 ms Median entfällt; verbleibende Komposition 0,0327 ms. Funktionaler Browser-Smoke: Fenster in 3D bewegen, Undo/Redo, Sichtbarkeit und Abbruch. Noch keine kontinuierliche Mehrfachbewegungs-/Frameabnahme.

21.10.2026: PR403 nach grüner CI in main 738ce18 integriert. Zwei reproduzierbare Node-Läufe der globalen 3D-Vorschaudienste mit zwei ausgewählten Wänden und 0/100/1000 Fremdwänden, jeweils mit/ohne zusätzliche Fenster. Warme Flächen-/Pufferkomposition stabil, geplante Wand-Uploads konstant 6336 Byte. Wiederholter Gebäude-Fensterbasisaufbau wächst bis ca. 1,11 ms Median bei 1002 Fenstern. Vollmodell-Flächen/Fenster und konservative Bounds geprüft; kein GPU-/Gesamtframebeleg. Details im datierten Messnachweis.

21.10.2026: PR402 nach grüner CI in main 6314460 integriert. Branch refactor/contour-source löst den contour/offset-Zyklus durch eine unveränderte gemeinsame Leseabfrage. Architekturgraph: 377 Dateien, 1486 interne Kanten, null zyklische Laufzeitkanten; 104 andere Grenzabweichungen bleiben offen. 1134 Produkttests, acht Guard-Tests, Typprüfungen/Lint/Build bestanden. Produktbrowser: Linien-/Schraffur-Offset, Undo/Redo und Abbruch; vier Exporte vollständig in Geschossdaten geprüft. Details im datierten Nachweis.

21.10.2026: PR401 nach grüner CI 39622229489 in main 0b61be1 integriert. Folgebranch test/architecture-boundaries ergänzt den CI-Befehl check:architecture: AST-basierte Schichtprüfung, Laufzeitzyklen aus emittierten Importen, exakte Ausnahmen mit Zuständigkeit/Abbauziel und Entfernung veralteter Einträge. Inventar: 376 Dateien, 1484 eindeutige interne Kanten, 104 bestehende Grenzabweichungen, zwei zyklische Kanten des bekannten contour/offset-Zyklus. Acht Guard-Tests und echte negative CLI-Probe bestanden. Keine Produktcodeänderung.

21.10.2026: PR400 nach Konfliktabgleich mit dem Architekturvertrag a70a386 und grüner CI 39621656423 in main b567902 integriert. Frischer statischer Produktbuild dc385a1: T-Hostwechsel und Rückwechsel, Fenster/Nachbarn, ein Undo/Redo und Abbruch funktional geprüft. Sechs Browserexports entsprechen vollständig in ihren Geschossdaten dem unabhängigen mutable Vollpfad. Neue Importpfeile ohne Rückweg/Zyklus; vorhandener contour/offset-Zyklus bleibt offen. Aktiver Folgeauftrag: Architekturgrenzen-Test gemäß §9.

21.10.2026: Verbindlichen Änderungs-Gate für jede Funktion/Korrektur in AGENTS.md und §9 dokumentiert: Änderungskarte vor Code, Verantwortungs-/Importprüfung und risikobezogene Abnahme nach jedem begrenzten Schritt. Dokumentationsänderung ohne Produktcode; PR400 ist noch offen und bleibt der einzige aktive Produktauftrag. Die Importgraph-CI-Sicherung ist erst nach dessen Browserabnahme/Integration als eigenständiger Schritt geplant, nicht bereits implementiert.

20.10.2026: PR399 nach grünem CI-Lauf 39488905253 in main 06a9dc0 integriert. Folgebranch perf/owned-wall-movement führt die vollständige Prüfung des Bewegungsergebnisses und dessen Snapshot-Übernahme zusammen. 1134 Tests, Typprüfung, gezieltes Lint und Produktbuild bestanden; zwei direkte Vergleichsläufe mit exakter Ergebnisgleichheit. Vollständige Anschluss-/Commitprüfung bleibt erhalten. Browserabnahme des neuen Pfads ist der einzelne Folgeauftrag gemäß §9. Frühere Absatzstände darunter sind datierte Nachweise.

20.10.2026: PR395 in main 9caaea8 integriert. T-Komposition hinter dem gemeinsamen Application-Vertrag auf die vollständige Zusammenhangskomponente im vereinigten Vorher-/Nachher-Anschlussgraphen begrenzt. Alte gelöste Nachbarn, neue Hostgruppen und Fenster erhalten; fachliche Validierung und Commit unverändert vollständig. Automatisierte Gleichheit und CPU-Messung sowie funktionaler Browser-Hostwechsel siehe Nachweise am Ende. Kontinuierliche 3D-Vorschau-/Native-/Frame-Abnahme bleibt offen.

20.10.2026: PR396 in main 8201f8d integriert. Phasenmessung erster/gewechselter T-Ziele in zwei Läufen lokalisiert die volle Anschlussaktion als größten Anteil (1000 Fremdwände: rund 12,6 ms, gesamtes evaluate rund 29 ms). Scope-Aufbau rund 0,25 ms. Noch keine weitere Produktoptimierung; sicherer Abbau redundanter Eingangsprüfung ist der einzelne Folgeauftrag in §9.

20.10.2026: PR397 in main 81a5b17 integriert. Folgebranch verwendet private Snapshot-Provenienz für T-Eingangsreuse und vollständig geprüfte immutable Ergebnisse. Netto eine vollständige Prüfung weniger; 1132 Tests und direkte Vergleichsmessungen bestanden. Browserabnahme dieser Änderung bleibt offen, aktueller Auftrag ausschließlich §9.

20.10.2026: PR398 in main 5c709ee integriert. Snapshot-Wiederverwendung funktional im Produktbrowser abgenommen: Hostwechsel, erhaltene Nachbarn/Fenster, ein Undo/Redo und Abbruch; fünf vollständige Exporte entsprechen dem Vollpfad. Kontinuierliche 3D-/Native-/Frame-Gates bleiben offen. Verbleibende Bewegungs-/Snapshot-Grenze ist der einzelne Folgeauftrag in §9.

20.10.2026: PR394 gegen neueren Architekturabgleich konfliktbereinigt. Zehn gezielte Regressionstests bestanden; isolierter Produktbrowser auf Port 8087: T-Platzierung an host-8, Undo/Redo, Wechsel zu host-10 und 3D-Darstellung geprüft. Alle Geschossdaten der Exporte entsprechen dem unabhängigen Vollpfad. Native Dauerhover-/Shift- und Frame-Nachweise bleiben offen. Details im datierten Abnahmeprotokoll am Dokumentende.

20.10.2026: Dokumentations-/Codeabgleich auf main `6093048` und offenem PR394. Die zentrale Anweisung wurde um Lese- und Aktualitätsregeln ergänzt; README und live N21/N22 korrigiert. PR394 mit 1128 Tests/grüner CI beschleunigt warme gleiche T-Ziele nur im offenen Branch. Keine neue Produktcodeänderung oder Browser-/Native-Abnahme durch diesen Dokumentationsauftrag.

19.10.2026: T-Fremdkontakt mit festem Ziel und 0/100/1000 fremden Wänden gemessen; Projekt-/Flächengleichheit und vollständiger Commit mit Undo/Redo nachgewiesen. Noch keine produktive Optimierung dieses Pfads. Details im datierten Nachweis.

19.10.2026: Große Anschlussgruppe (51 + 100 Wände, 51 Fenster) in 2D/3D funktional abgenommen; Abbruch, Platzierung, Undo/Redo und vier vollständige Exportvergleiche bestanden. Keine kontinuierliche Native-/Frame-Freigabe. Details im datierten Nachweis.

17.10.2026: Höhen-Gesamtworkflow und Recovery-Startschutz in PR384 nachgewiesen. 1115 Tests und Produktbuild bestanden. Einzelheiten im datierten Nachweis, aktive Fortsetzung ausschließlich §9.

Aktuelle Kurzfassung und offene Grenzen: siehe Statusmatrix in §9 (Codeabgleich 20.10.2026). Mehrgeschossmodell, gemeinsame vorbereitete Vorschauen, begrenzte GPU-Uploads und lokale Fangabfragen sind produktiv. Recovery besitzt manuelle und automatische sichere Wartung. Wandhöhenbindung einschließlich Gesamtworkflow ist in PR384 nachgewiesen. Gemeinsame Flächenpartition/Pufferpatches lokal mit 1119 Tests, Typecheck, Lint und Produktbuild geprüft; keine neue native Frame-Abnahme. Die folgenden datierten Einträge sind historische Teilevidenz, keine aktuelle Prioritätenliste.

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
| Fachmodell | Schema 16 (historischer Stand; heute Mehrgeschossmodell, siehe §4 und Status auf einen Blick): ein Geschoss, Wände/Fenster, Linien/Polylinien, Schraffuren, PNG/JPEG-Referenzen, Muster/Stifte/Arbeitsansicht | Keine freie Geschossanlage, Räume, Türen, Decken, Dächer, Stützen/Treppen |
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
3. **Commit/Export:** Volle Validierung, Geometrieableitung und Serialisierung bleiben globale Pfade. Stufe 1 (24.10.2026, COMMIT_SHARING.md) entfernt nur die doppelte Vorstandsprüfung und die Vollkopien in der History; je eine Vollvalidierung in Aktion und Commit bleibt. Ältere Einzelmessungen nicht als aktuelle Zeitgarantie verwenden. Herkunft/Commit, Hardware, Szenario und Median/p95 getrennt nennen.
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
| Ungleiche Wandquerschnitte, Dachtrimmen einmalig oder abhängig | Anschluss-/Trim-Fachregel; spätestens vor dem Dach-Auftrag – bestimmt, ob die Trimmung in die Wand geschrieben oder als geschossübergreifende Eingabe aufgelöst wird (A08, 27.10.2026) |
| Raumkennungen, virtuelle Grenzen, WoFlV-Profil/Rundung und Berichtsvorlage | Raum-/Wohnflächenauftrag |
| PAT/Schraffurimportformat/Rechte, andere Austauschprofile/3D-Format | Jeweiliger Import/Export |
| Settings-Besitzer: Benutzer/Projekt/Ansicht/Werkzeug, Pane-Persistenz | Einstellungsübersicht |
| AI-Anbieter/Datenfreigabe/Autonomieumfang/Fachregelprofil | Erster entsprechender AI-Pilot |

Entschiedene Punkte nicht erneut als offen behandeln: 2D-only Pickup einschließlich Ebene, Modell-/Papiermaß mit internen Metern, unabhängige Abbildfilter, BIM-Skalierverbot, fixe Zeichenachse bei Wandkörperoffset, Wandkette ein Undo, keine gesonderte gemeinsame Eckbewegung.

## 9. Pflegevertrag und Codex-Arbeitsauftrag

Jeder Eintrag hat stabile ID, Status (vorhanden im genannten Umfang / teilweise / geplant / Entscheidung offen / historische Evidenz), Quelle und Abnahmekriterium. Implementiert wird nur mit Codepfad und konkretem Nachweis. Eine erfüllte Teilfunktion löscht den Restwunsch nicht. Neue IDs ergänzen statt bestehende umzunummerieren; historische F-Kennungen immer mit Quelle qualifizieren.

Nach jeder Aufgabe Masterplan §4/§9 und betroffene Registereinträge aktualisieren: Commit/PR, Test-/Browserbeleg, Einschränkungen und nächster Einzelauftrag. Alte Entwicklungslogs sind optionale Evidenz, keine weitere Reihenfolgenquelle. Ein Feature-Detailvertrag darf keine eigene widersprüchliche Prioritätenliste mehr führen. Anforderungen nicht nur in PR-Kommentaren oder Chat belassen.

### Verbindlicher Änderungs-Gate für Codex (Nutzerentscheidung 21.10.2026)

Gilt **ab jetzt für jede Funktion, Aufgabe, Korrektur und Erweiterung**, auch für reine UI-Arbeit; Tiefe der Prüfung folgt dem Risiko. Eine Korrektur ohne Nutzerwunsch bekommt als Ziel das bisherige beobachtbare Verhalten. Sie wird nur umgesetzt, wenn sie den unten dokumentierten Vertrag einhält. Genau ein begrenzter Implementierungsschritt ist aktiv; unverbundene Fixes werden nicht in denselben PR gemischt. Ein P0-Befund zu Datenverlust/falschem Ergebnis zieht jederzeit vor.

**Vor dem ersten Code-Edit – kurze Änderungskarte im Auftrag oder PR:**
1. **Kundenwunsch und Abnahme:** Wer soll was tun können? Zwei konkrete normale/grenzwertige Szenarien, ausgeschlossene Fälle und betroffene Register-IDs. Unklare fachliche Entscheidungen mit dem Nutzer klären; die technische Platzierung trifft Codex anhand des Codes.
2. **Eigentümer und Datenquelle:** Welche Schicht besitzt die Regel und den veränderbaren Zustand? Stabile IDs, Geschoss/Host, Maßeinheit und Sichtbarkeits-/Maßstabskontext benennen. Nur ein autoritatives BIM-Modell; kein zweites editierbares Modell in React, SVG, WebGL, Datei- oder AI-Adaptern.
3. **Gemeinsamer Weg:** Welche typisierte Application-Aktion/Query verwenden Maus, Eigenschaften, Text, Sprache und später AI? Wie funktionieren vorbereitete Vorschau, Abbruch, endgültige Validierung, ein Undo-Schritt und veralteter Kontext? Neue Werkzeuge schließen an bestehende Snap-/ToolInteraction-Verträge an.
4. **Folgen:** Betroffene 2D/3D-Darstellung, Nachbarn/Abhängigkeiten, Datei-/Recovery-Migration, IFC/Export, Portabilität Windows/macOS und Leistung bei wachsendem Restmodell benennen. Nur relevante Wege testen; „nicht betroffen“ mit Begründung markieren.
5. **Abgrenzung:** Aktuellen main, offene PRs und konkrete Importpfade lesen; betroffene Module, geplante neue Abhängigkeiten und vorhandene Tests nennen. Keine neue Logik in einem Baustein, dessen Verantwortung sie nicht trägt.

**Verantwortungsvertrag (Zielrichtung; bestehende Übergänge als explizite Abbaukandidaten behandeln):**

| Baustein | Darf besitzen | Darf nicht besitzen |
| --- | --- | --- |
| `domain/`, `geometry/`, `constraints/` | Modellinvarianten, Maße und Fachgeometrie, Fangregeln | React, Renderer, Datei-/Browseradapter oder Application-Orchestrierung |
| `application/` | Geprüfte Aktionen/Queries, Auswahlkontext, Vorschau/Commit/Undo und Port-Verträge | Eigenes Rendering oder speicherspezifische Browsertechnik als Fachregel |
| `rendering/`, `components/` | Abgeleitete Anzeige, Pointer-/Formulareingabe, flüchtigen Ansichtsstatus | Autoritative Bauteilregeln, zweite Projektkopie oder werkzeugeigene History |
| `interop/` | Format-, Recovery-, IFC- und Plattformadapter | Eigenmächtige Modellmutation; nur nötige Application-Port-Verträge importieren |
| `lib/bim/` | Vorhandene Übergangsbausteine bis zur gezielten Migration | Neue generische CAD-Subsysteme oder zusätzliche Gegenabhängigkeiten |

**Nach jedem begrenzten Schritt – Abschlusskarte vor Merge:** Geänderte Module/Importpfeile und tatsächliche Verantwortung gegen die Änderungskarte prüfen; neue Laufzeitzyklen, Schicht-Rückgriffe und Modellkopien ausschließen. Ergebnis der passenden Tests, Typecheck/Lint/Build, gegebenenfalls Produktbrowser, Export-Dateivergleich, Recovery und Laufzeitmessung mit Basis/Commit nennen. Ein Szenario mit Nachbarn, ungültiger Eingabe, Abbruch und Undo prüfen, sofern das Werkzeug sie berührt. Fehlende Native-/Langsession-Gates offen lassen. Nur wenn Ziel, Code, Prüfbeleg und Dokumentationsstatus übereinstimmen, den PR abschließen; sonst denselben Auftrag korrigieren, nicht ein neues Feature beginnen.

**Dauerhafte Sicherung (PR402/403 in main):** npm run check:architecture prüft in CI exakte Schichtgrenzen und Laufzeitzyklen. 104 bestehende Grenzabweichungen bleiben mit Eigentümer/Abbauziel dokumentiert. Der contour/offset-Zyklus und seine zwei Ausnahmen sind entfernt. Neue verbotene Pfeile, Zyklen und veraltete Ausnahmen lassen das Gate scheitern. Keine automatische Ausnahmen-Erweiterung; fachliche Browserabnahme bleibt zusätzlich erforderlich.

### Qualitäts- und Dokumentationsabgleich vom 20.10.2026

Diese Befunde sind nach Risiko geordnet, aber **keine parallelen aktiven Implementierungsaufträge**; die einzige sofortige Aufgabe steht darunter. Reproduzierter Datenverlust, falsche Maße oder ein fehlerhafter Commit haben unabhängig von der Liste P0-Vorrang.

| Priorität | Konkreter Befund / Zustand | Verbindliche Behandlung und Abnahme |
| --- | --- | --- |
| P0 bei Befund; vor Release zwingend | Recovery-Startsicherung nach PR384 vorhanden. Echte Quota, versteckte/konkurrierende Tabs, Abbruch während aktiver Arbeit, Langsession und Prozess-/GPU-Spitzen nicht vollständig abgenommen. | Schutz erhalten; isolierte Testdaten, kontrollierte Kaltstarts und reale Fortsetzungs-/Exportnachweise. Keine pauschale Dateigrößenfreigabe. |
| P1 Dokumentationsintegrität | README enthielt weiterhin die Anweisung „keine echte CAD-Engine“; Register N21/N22 waren trotz Mehrgeschossmodell und Wandhöhenbindung auf Schema21/„geplant“ stehengeblieben; Kopfstände Masterplan/Register widersprachen main. | In diesem Dokumentationsschritt korrigieren. Künftig bei jeder einschlägigen Änderung Kopf, §4/§9 und **betroffene live Registereinträge** synchronisieren; historische Kapseln als datierte Evidenz belassen. Laufend gegen Code/PR prüfen, nie aus Text allein ableiten. |
| P1 interaktive Skalierung | Auf main baut der neue T-Fangkontakt einen Patch für alle Wände/Fenster des Geschosses; offene PR394 beschleunigt nur wiederholte identische Ziele, nicht erste/geänderte Ziele oder Komposition. | PR394 integriert; Vorher-/Nachher-Abhängigkeitsmenge einschließlich gelöster stationärer Nachbarn und Fenster im Folgebranch begrenzt, praktische Abnahme folgt. Exakte Projekt-/Flächengleichheit und Gesamtframe messen. |
| P1 Großmodell-Pfade | Commit validiert sowohl neuen als auch vorherigen Projektstand vollständig; Projektprüfung läuft über alle Geschosse. Vorschaufensterfilter und Fensterzuordnung beim freien Wandkörperaufbau sind weitere lineare/verschachtelte Arbeit. | Profil pro Phase an schulähnlicher Fixture; nur nachgewiesene heiße Abschnitte indizieren/vorbereiten. Vollständige endgültige Validierung, Größenbudget, atomaren Undo und unabhängigen Commit erhalten. |
| P2 Wartbarkeit | CadWorkspace (1852 Zeilen, Stand 27.10.2026), BimSolidView (887) koordinieren viele Wege; doppelter Testeintrag prepared-endpoint.test.ts am 27.10.2026 entfernt; sechs bekannte Lintwarnungen. | Bei konkreter Fachänderung kleine Zuständigkeiten in vorhandene Application-/Renderdienste verlagern und doppelte Testliste bereinigen; kein breiter Rewrite allein wegen Dateilänge. |

Dokumentationsstruktur: AGENTS.md kurz, dieser Masterplan mit ausschließlich §9 als Live-Auftrag, Register als ID-Quelle; `ARCHITECTURE.md`, `DEVELOPMENT_PLAN.md` und die vielen datierten `docs/`-Nachweise sind historische/verlinkte Quellen. Stand 20.10.: 104 Markdown-Dateien im Repo (81 unter `docs/`, null unter `.github/`); die Anzahl ist kein automatischer Lesefehler. Widersprüchliche Live-Status und überlange Volllektüre sind das Risiko. Vor einem Zusammenführen: je Datei Verantwortlichkeit, einzigartige Anforderungen, Quellenkennung und historische Belege inventarisieren; danach Redundanz markieren/indexieren, keine ungesicherten Löschungen. Keine dritte aktive Roadmap und kein einziger noch größerer Volltext.

**Verbindlicher Zielabgleich vom 17.10.2026, 10:37 Europe/Berlin.**
Der Nutzer verlangt den Abgleich mit den hier festgelegten Zielen und die Behebung/Bereinigung von Abweichungen. Die Architekturziele bleiben: leistungsstarkes autonom steuerbares AI-CAD, ein BIM-Modell, gemeinsame typisierte Aktionen für Maus/Eigenschaften/Text/Sprache/AI, keine proportionale BIM-Skalierung, sichere Datei/Recovery, Mehrgeschossigkeit sowie Windows/macOS ohne vorweggenommene Desktopentscheidung.

**Architektur-Priorität (Nutzerentscheidung 24.10.2026):** Der Nutzer stellt den Wandachsen-Auftrag zurück und priorisiert die Skalierbarkeit für das Schulmodell (fünf Geschosse, ca. 1.000 m² je Geschoss). Stufe 1 „geteilte Commit-Snapshots“ ist auf Branch audit/commit-structural-sharing umgesetzt (docs/performance/COMMIT_SHARING.md): neuer Stand weiter voll validiert, nur nachweislich doppelte Prüfung des eigenen Vorstands entfällt, unveränderte Teilbäume behalten ihre Identität. 1159 Tests, Architektur-Check, Typprüfungen, Lint, Build; Gleichheit alt/neu inkl. Undo/Redo, JSON und IFC. Node: Commit 20.000 Elemente 1586→830 ms Median, Browser 1127→608 ms. Bedienabnahme im CadWorkspace (Wandlänge, Fenster, Undo/Redo, Ablehnung ungültiger Höhe) bestanden. PR440 (Entwurf); Merge erst nach Nutzerfreigabe. Stufe 2 (Validierung nur betroffener Geschosse) berührt A04 und wird erst mit diesen Messwerten erneut zur Entscheidung vorgelegt.

**Stufe 1 in main (PR440, 0843506).** Stufe 1b umgesetzt auf audit/action-owned-snapshots: `validateLike` in owned-snapshot.ts; addWall/updateWall/addWindow/updateWindow/addLine/updateLine liefern bei eigenem Eingang einen eigenen, geteilten Snapshot, den `commitProject` ohne zweite Prüfung übernimmt. Undo/Redo mit Ansichtsübergang teilt wieder mit seinem Ursprungsstand. 1160 Tests, Architektur-Check, Typprüfungen, Lint, Build; Gleichheit alt/neu bei jeder Stichprobe. Aktion selbst 4–13 % teurer (Teilen/Einfrieren, auch für Vorschauen auf altem Vollpfad). Bedienabnahme Wandlänge/Fenster/Undo/Redo bestanden; Maus-Endpunktziehen nicht praktisch geprüft.

**Stufe 1b in main (PR441, e11e681).** **Stufe 2 (Option B, Nutzerentscheidung 24.10.2026)** umgesetzt auf audit/storey-validation-reuse: `storeyKeys`/`StoreyValidationMemo` in schema.ts, privates Verzeichnis geprüfter Geschosse in owned-snapshot.ts; nur `createProjectSnapshot` nutzt es. Gegenprüfung: 600 Zufallsänderungen inkl. geschossübergreifender und ungültiger, Ergebnis/Fehler exakt wie volle Prüfung; Gegenproben (Schlüssel ohne Projektwerte, ohne Musterliste) schlagen an. 1162 Tests, Architektur-Check, Typprüfungen, Lint, Build. Node 20.000: 3120→388 ms; Browser 1631→238 ms. Bedienabnahme bestanden (ein Geschoss in der UI).

**Stufe 2 in main (PR442, 1f05fea).** **Stufe 2b** umgesetzt auf audit/storey-parse-and-size: wiederverwendete Geschosse werden mit leeren Elementlisten geparst und durch ihr validiertes Objekt ersetzt (Entscheidung vor dem Parsen, gilt nur bei gleichem Schlüssel danach); Byte-Länge aus Projektrahmen + gecachten Geschosslängen (`storeyStorageData`, Cache nur für eigene Snapshots). Gegenprüfung inkl. Byte-Länge gegen alte Berechnung, Gegenproben greifen. 1162 Tests, Architektur-Check, Typprüfungen, Lint, Build. Node 20.000: 3100→225 ms; Browser 1646→119 ms; Commit ≈ 5 ms. Bedienabnahme bestanden.

**Stufe 2b in main (PR443, 41812ee).** **Stufe 3** umgesetzt auf audit/remaining-actions-owned: Geschoss-, Abbild-, Maßstabs-, Ebenen-, Schraffur-, Referenz-, Kalibrier-, Z- und T-Anschluss-Aktionen nutzen `validateLike`/`validatedInput`. Gegenprüfung 19 Fälle alt/neu inkl. ungültiger, Gegenprobe greift; 1181 Tests, Architektur-Check, Typprüfungen, Lint, Build. Node 20.000: Geschoss umbenennen 2997→215 ms, Schraffur 4067→224 ms, Ebene 3951→1031 ms (projektweit, bewusst voll). Bedienabnahme bestanden (Geschoss umbenennen, Ebene anlegen/umbenennen/Duplikat abgelehnt, Schraffur; jeweils Undo/Redo).

**Stufe 3 in main (PR444, 7f0cc91).** **Stufe 4 (Fangindex, AUD14-04)** umgesetzt auf audit/snap-index-reuse: `connectedWallContours` statt Wandkörper, Teilergebnisse je Linie/Schraffur und Wandsatz nur für eigene Snapshots, kein erneutes Einfrieren. Gegenprüfung gegen eingefrorene alte Ableitung (Punkte, Segmente, Abfragen), Gegenproben greifen; 1184 Tests, Architektur-Check, Typprüfungen, Lint, Build. Bedienabnahme: Fang an geänderter Wand. Rest: Nachschlagetabelle/Box-Index weiter voll.

**Stufe 4 in main (PR445, 19733c1).** **Tür, Teil A (Nutzerentscheidung 24.10.2026):** Registry mit erstem echten neuen Bauteil statt leerem Gerüst; einflügelige Drehtür, Rohbaumaß 1,01 × 2,135 m frei änderbar, Z-Versatz zur Geschossoberkante, Anschlag/Aufschlag einstellbar, Grundriss Türblatt + Bogen (abgeleitet), 3D-Öffnung. Schema 27 mit Migration. Fenster und Tür teilen Öffnungsregeln und Platzierungsablauf. 1192 Tests, Architektur-Check, Typprüfungen, Lint, Build; Bedienabnahme bestanden.

**Am 25.10.2026 in main integriert (PR447–PR459 ohne PR453, main be5f372; Tür Teil A bereits PR446):** **Tür Teil B1** (PR447): IfcDoor mit eigener Öffnung und eindeutigen Eigenschaften, Text-/Sprachbefehle (N19) im gemeinsamen Befehlsweg, 3D-Auswahl über gemeinsame Öffnungs-Trefferflächen. 1202 Tests, Architektur-Check, Typprüfungen, Lint, Build; Bedienabnahme bestanden. Externe IFC-Prüfung offen. **Tür Teil B2**: abgeleitetes 3D-Türblatt als reine Darstellungsschicht, 3D-Umriss der ausgewählten Tür, Fang an vier Laibungsecken je Tür mit Teilcache nur für eigene Snapshots. 1206 Tests, Architektur-Check, Typprüfungen, Lint, Build; Bedienabnahme bestanden. **Tür Teil B3**: gemeinsame Öffnungsverschiebung und vorbereitete Öffnungsvorschau für Fenster und Türen; Vorschau-Ausschnitt enthält nun Türen (Fehler aus Teil A behoben). Gleichheit zur vollen Prüfung, Gegenprobe greift; 1211 Tests. Messung 500 Wände/Fenster/Türen: Tür warm 0,8–1,2 ms statt 98–119 ms. Bedienabnahme 2D/3D bestanden. **Türen in den übrigen vorbereiteten Vorschauen**: Wandendpunkt, Auswahlbewegung und Z-Verschiebung führen Türen im Ausschnitt; Z-Verschiebung nimmt Türen mit (Nutzerentscheidung Variante B). Gleichheit, Gegenproben, 1216 Tests; kein messbarer Mehraufwand der Vorschau. **Hinweis bei überlappenden Öffnungen** (Nutzerentscheidung: überall erlaubt, nur Hinweis): Regel entlang Wand und Höhe, Hinweis in 2D-/3D-Vorschau, Eigenschaften, Befehlen, orange Markierung im Grundriss. 1220 Tests; Vorschauhinweis 0,28–0,34 ms bei 100 Wänden je Geschoss. **Löschen für alle Bauteile**: eine Operation für Taste, Menü, Text und Sprache; Öffnungen folgen ihrer Wand, Anschlüsse werden gelöst, ungenutzte Bilder entfallen; ein Undo-Schritt. 1225 Tests; Löschen inkl. Bestätigung 8–12 ms bei 500 Wänden. **Tür DIN links/rechts** (DIN 107): abgeleitet aus Anschlag/Aufschlag, Anzeige und Eingabe in Eigenschaften, Setzfeldern und Befehl, IFC-Eigenschaft Handing; 1230 Tests. **Positionsnummern** (Schema 28): automatisch je Art und Geschoss, änderbar, Bestand per Migration nummeriert, Anzeige in Eigenschaften, Hinweisen, Menü und Grundriss; 1236 Tests. **Fensterbefehle** nach application/windows verlegt (gleiches Modell, nachgewiesen gegen lib/bim; lib/bim −43 Zeilen); 1237 Tests. **Wandbearbeitung und Wandbefehle** nach application/walls verlegt: 124/124 Vergleichsfälle identisch, Gegenprobe greift, lib/bim −209 Zeilen, eine Architektur-Ausnahme weniger; 1237 Tests. **Restliche lib/bim/model-Aktionen** (Projekt, Fenster, Linien) verlegt: 39/39 Fälle identisch, lib/bim/model.ts nur noch Datei-Brücke (13 Zeilen), Architektur-Ausnahmen 103 → 67; 1240 Tests.

**Genau ein unmittelbarer aktiver Folgeauftrag:** Nutzerwahl des nächsten Auftrags; zuerst Änderungskarte. Kandidaten aus dem AUD14-Abgleich (docs/AUD14_ABGLEICH.md): Rest des Bewegungsstarts bei x ≈ 1,5 s (Sichtbarkeitsindex, docs/performance/MOVE_START_ORIGIN.md), 3D-Neuaufbau Stufe B1/B2 zurückgestellt (Nutzerentscheidung 28.10.2026): Nutzen nur beim Stressmodell x (≈ 0,4–0,55 s je Bearbeitung; l ≈ 40 ms), Risiko veralteter Wandkörper in 3D/IFC, und die geschossübergreifenden Wandeingaben (A08) würden den Schlüssel später erneut ändern. Wiederaufnahme, wenn reale Projekte nach Bearbeitungen spürbar stocken oder zusammen mit den geschossübergreifenden Wandeingaben; B0 mit PR484 erledigt (docs/plans/WALLWISE_REBUILD_CHANGE_MAP.md), Fangindex-Rest und große Anschlussgruppen (AUD14-04/05), Wand x/y/axis (zurückgestellt, Nutzerentscheidung). Weitere Kandidaten: Fenster im IFC mit Geometrie bzw. Typangaben, damit Archicad Breite/Höhe erkennt (Abnahme 27.10.2026, docs/T_IFC_ACCEPTANCE.md; Nutzerhinweis: für die Zukunft wichtig, nicht sofort), Speicher-/Lade-Brücke in lib/bim/model.ts (Nutzerentscheidung zur interop-Grenze). Pflege: Nach jedem Merge Kopfzeile, §9 und die Nutzerübersicht ZWISCHENSTAND.md (Nutzerwunsch 28.10.2026; Ansicht, keine eigene Roadmap) sowie erledigte Punkte in der vom Nutzer bearbeiteten AUFGABENLISTE.md (Wunschliste als Eingang; vor Vorschlägen lesen, angenommene Wünsche in Register/Masterplan übernehmen) direkt auf main nachziehen; gestapelte PRs vor dem Merge auf main umhängen.

**Zurückgestellt (Nutzerentscheidung 24.10.2026), nicht aktiv: Verbliebene feste Wandachsenbewegungen x/y/axis abgleichen und messen (AUD14-04/05).** DemandMenu und CadWorkspace.startEdit gegen DirectEdit-/Auswahladapter prüfen. Feste kleine Wand bei wachsendem Restmodell, frei/verbunden und mit Fenstern; Maus/Numeric, signierte Achse, stationäre Nachbarn, Anschlusslösung, vollständiger Commit und ein Undo/Redo. Vollständige Ergebnisgleichheit und getrennte Vorbereitung/Vorschau messen. Keine erneute Endpunkt-/T-Migration, noch keine ungeprüfte Anbindung. Primitive-Cache-Kandidat nach Browservergleich geparkt; kein weiterer Sortier-/Freeze-Mikrokandidat.

AUD14-07/N22 Höhen-Gesamtworkflow nach PR383 am 17.10. im statischen Produkt-Workspace geprüft (PR384 erweitert): KG/EG/OG, feste/gebundene Eckwände, Fenster, signierte Versätze, Konfliktatomarität, Undo/Redo, JSON, produktive Recovery und IFC. Dabei reproduzierten P0-Startfehler behoben: Autosicherung überschreibt vor der Wiederherstellungsentscheidung nicht mehr den vorhandenen aktuellen Stand. Application-Startsperre schützt aktuelle/vorherige Slots; Abbruch/Lesefehler geben sie nicht frei. Formattext folgt gemeinsamem Schema-Vertrag. 1115 Tests, Typecheck, Lint und Build bestanden; Detailnachweis im datierten Protokoll. Keine Gesamtfreigabe aller AUD14-Gates.
Abgeschlossener Prüfauftrag (Nachweis PR384, kein zweiter aktiver Auftrag): Nach PR383 wurden EG/OG/KG, Fenster, feste und gebundene Anschlüsse, signierte Versätze, Geschossänderung, Konfliktatomarität, ein Undo/Redo, JSON-Dateirundlauf, produktive Recovery und IFC-Höhen/Zuordnung geprüft. Die frühere Formatfehlermeldung „Version 1 bis 25“ wurde an den gemeinsamen aktuellen Vertrag für Schema26 angepasst. Vorläufige Rohdeckenstärke 0,20 m bleibt als Annahme gekennzeichnet; kein echtes Deckenbauteil vortäuschen. Fälle ohne oberes Geschoss und Einfügen zwischen gebundene Geschosse bleiben gesperrt und brauchen eine eigene Fachentscheidung.

**Danach diese Korrekturfolge ohne erneute Startfreigabe fortsetzen, jeweils nur ein begrenzter Implementierungsschritt aktiv:**
1. Erledigt/in main: Architekturgrenzen-Gate PR402. Exakte Altlasten und Negativprobe; keine automatische Erweiterung der Ausnahmenliste.
2. Erledigt/in main: PR403 löst contour/offset über die gemeinsame Leseabfrage; null Laufzeitzyklen, gültige/ungültige Pfade und Browser-/Dateivergleich belegt. Weitere lib/bim-Rückgriffe bleiben gesonderte Schuld.
3. AUD14-03/04: verbleibende globale 3D-Vorschaukomposition/Bounds/Gruppierung messen und begrenzt korrigieren. Codeorte selection-move-preview.ts, solid-buffer.ts und BimSolidView; feste kleine Auswahl bei wachsendem Restgebäude. Bestehendes Shader-/Pufferreuse erhalten; keine erneute Gesamtgeometrie oder Fachregeln pro Werkzeug implementieren. Unveränderte Flächen/Indexe teilen, gemeinsame Patchgrenze verwenden. Vorbereitung, Pointerarbeit, Uploads und Gesamtframes getrennt belegen.
4. AUD14-04/05: große Anschlussgruppen und verbliebene Legacy-Aktionen aus der vorhandenen Pfadinventur bearbeiten. Der historische 51-Wand-Wert (~14,6 ms) ist kein aktueller Neuauftrag: PR391 und spätere T-/Snapshotänderungen sind bereits integriert. Verbleibende Gruppenrestkosten nur am aktuellen Code erneut belegen. Fachlich vollständige stationäre Nachbarn erhalten; Abhängigkeiten nicht blind kürzen. Wiederholte globale Validierung und Wand/Fenster-Scans nur mit nachgewiesenem Nutzen sicher begrenzen. Neue Werkzeuge dürfen keine Legacy-Vollpfade als Standard übernehmen.
5. AUD14-07: Abbildwechsel/Recovery-Vergleich und Bildressourcen-Pilot am selben Build mit vorhandenen Tracewerkzeugen erneut prüfen, sobald eine tatsächliche CPU-/Native-Aufnahme möglich ist. Die Nutzervertagung vom 16.10. bleibt als historische Prioritätsentscheidung erhalten; diese erneute Korrekturfreigabe reaktiviert die unabhängig ausführbare Arbeit. Fehlender Profiler bleibt eine konkrete Beleggrenze, kein erfundener Fix. Keine weitere reine Longtask-Serie als Ersatz und keine Produktpromotion des Pools ohne belastbaren Nutzen. Bei dieser Werkzeuggrenze die anderen unabhängigen Bereinigungen fortsetzen.
6. AUD14-06/07: schwere kombinierte S1-Abnahme, kontinuierliche Maus-/Shift-Gesten, kontrollierte Kaltstarts, Kamera-/Ansichtswechsel und Langsession fortsetzen. Echte Quota, Tab-Hidden/Fokus/Abbruch während aktiver Arbeit und Prozess-/Raster-/GPU-Spitzen bleiben Release-/Kapazitätsgates. Nur isolierte wegwerfbare Testdaten verwenden, niemals Nutzersicherungen oder Systemdatenträger absichtlich füllen. Fehlende Umgebung/Native-Bedienmöglichkeit konkret als offen dokumentieren.
7. Codequalität entlang dieser Änderungen bereinigen: wachsende Koordination aus CadWorkspace/BimSolidView fokussiert hinter vorhandene Application-Verträge verlagern; gemeinsame Snapshot-/Abhängigkeits-/Vorschau-/Eingabedienste wiederverwenden; veraltete Formattexte/UTF-8/unerreichbare oder doppelte aktive Pfade gezielt korrigieren. Kein Umbau nach Zeilenzahl, keine breite Neuimplementierung. Alten offenen PR318 vor einer möglichen Übernahme auf Überschneidung mit produktiver Z-Anbindung aus PR371 prüfen; nichts blind mergen oder historische Arbeit löschen.
8. Erledigt 27.10.2026 (docs/AUD14_ABGLEICH.md, Register-Statuszeilen je AUD14-ID): 01/02 erfüllt, 03–07 teilweise mit benannten Blockern; Schullauf s/l/x auf main bestanden. Ursprünglicher Auftrag: Alle sieben AUD14-IDs mit konkretem Commit, Szenario und Restgrenze abgleichen. Erst danach neue unabhängige Fachfeatures planen; eine tatsächliche fehlende Produktentscheidung oder ein externes Abnahmegate darf nicht still als erfüllt markiert werden.

**Aktueller AUD14-Status (27.10.2026, Abgleich am Code von main 07f88e1, Nachweis docs/AUD14_ABGLEICH.md; frühere Fassung vom 21.10. im Git-Verlauf):**

| ID | Status | Verbleibende Arbeit |
| --- | --- | --- |
| AUD14-01 | erfüllt (PR319: aggregiertes Pixelbudget an Import/Commit/Recovery, Übergangsvertrag) | Echte Quota nur simuliert – unter AUD14-06 geführt |
| AUD14-02 | erfüllt (PR320, danach PR440–445) | – |
| AUD14-03 | teilweise: Ressourcen-/Patch-Reuse belegt (PR385/386, PR404–411), Türziehen ≈ 16 ms je Bild | Native-/GPU-/Dauerframe-Gate; Kaltaufbau/Partitionswechsel; Vollupload bei Topologiewechsel; Kontextverlust nicht in CI |
| AUD14-04 | teilweise: Ansichtskontext und Validierung ohne Wiederholung (PR440–445, PR463/464, PR472) | Wand x/y/axis (zurückgestellt 24.10.2026); restlicher Fangindex-Neuaufbau; Frame-/Native-Gates |
| AUD14-05 | teilweise: lokale Suchen indiziert (PR344–346, PR474), Abhängigkeitsmenge belegt (PR391–400) | Große Anschlussgruppen neu messen; Kamerawechsel-Vorbereitung; Einzelbelege Radiusrand/große Koordinaten/Keller |
| AUD14-06 | teilweise: Aufbewahrung, Slots, CAS, Transaktionsabbruch, Vorgängerschutz (PR347–361, PR384, PR461, PR475/476) | Echte Quota, echte Mehr-Tab-Fälle, Lauf ≥ 2 h, Prozess-/GPU-Spitzen (Testumgebung fehlt) |
| AUD14-07 | teilweise: Schullauf s/l/x auf main bestanden, mit Z, IFC-Export, Inhaltsvergleich und Kalt/Warm (PR480); Umlaute, doppelter Testeintrag und Tabelle korrigiert, Register-PR-Angaben geklärt (Konvention „Vorgänger gemergt“, keine Korrektur nötig; fix/aud14-07-small) | Native-/Peak-Speicher, Browserprozess-Neustart, weitere Browser/Hardware (Umgebung) |

**Abschluss- und Arbeitsregeln:** Die Freigabe umfasst Diagnose, begrenzte Fehlerbehebung, Codebereinigung und passende Verifikation. Nach einem belegten Abschluss unmittelbar den nächsten offenen Schritt beginnen. Reproduzierter Sicherungsverlust/falsche Maße/fehlerhafter Commit-Erfolg ist P0 und zieht vor. Erfolgreiche CI ist erforderlich, ersetzt aber keine praktische Abnahme. Mikrobenchmark, Programmlauf, Browserframe, CPU-Sampling und tatsächliche native Geste getrennt benennen. Referenzhardware/Browser/Commit, Fixtures und Grenzen mitführen. Kein Compiler-/Renderer-/Frameworkwechsel, keine pauschale Grenzerhöhung und keine Kürzung fachlicher Prüfungen auf Verdacht.

Gemeinsamer Akzeptanzkontext bleibt die Schule mit etwa 1.000 m² je Geschoss und fünf Geschossen, vielen Details und bis zu 20 Referenzplänen als Richtwert. Aktuell 128 MiB Datei/128 Millionen Bildpixel; 20 Bilder in S1 mit ~21 Millionen Pixeln beweisen nicht 20 maximal aufgelöste Pläne. Echte Räume/Decken/Dächer und Archicad-/IFC-Importfähigkeit bleiben eigene noch fehlende Fähigkeiten. Die AI-Zielarchitektur wird durch gemeinsame Commands/Queries weiter vorbereitet; kein bloßes Renderer-Mesh oder Bild als editierbares BIM ausgeben.

**Eindeutige Pflege:** Nur dieser §9 enthält aktive Priorität und nächsten Auftrag. Kopfzeile, AGENTS und Register verweisen darauf. Nach jeder Aufgabe diese Statusmatrix und den aktiven Einzelschritt aktualisieren, drei nächste konkrete Schritte mit genau einem unmittelbaren nennen. Chronologische Nachweise nach §10 enthalten historische Entscheidungen und behalten ihre Quellen, haben aber keine ausführbare Priorität. Keine parallele Roadmap oder ständig neue Diagnose-Ersatzaufträge.

**Startprompt für Codex:** Lies AGENTS.md und NOVIKOV_MASTERPLAN.md. Lies im NOVIKOV_REQUIREMENTS_REGISTER.md nur die IDs/Detailverträge des aktiven Auftrags. Vergleiche aktuellen main, offenen PR und lokale Änderungen. Erhalte fremde Arbeit. Nenne zuständige Schicht, Action/Query, Kontext, Abhängigkeiten und Abnahme. Setze genau einen begrenzten Auftrag um. Verwende bestehende Modell-, Snap-, ToolInteraction- und History-Grenzen. Dokumentiere ausgeführte Prüfungen und Einschränkungen, aktualisiere diese zwei Dateien und ende mit dem nächsten konkreten Schritt.

## 10. Verwaltung und persönliche Ablage

GitHub bleibt die technische Quelle. Für kommende Arbeitsaufträge genügen diese zwei Dateien plus fokussierte Code-/Test-/Diagnoselesung. GitHub Issues/Projects können später IDs, Prioritäten und Status abbilden; kein weiterer Plugin-Anschluss ist dafür Voraussetzung. Ein zusätzliches Notion-/Linear-System ist optional, würde aber eine klar geregelte Synchronisierung benötigen. Die PDF ist ein datierter Fahrplan für die persönliche Ablage und keine dritte laufend gepflegte Quelle.

> **Historisches Statusprotokoll ab hier:** Datierte Nachweise und damalige Nutzerentscheidungen bleiben erhalten. Frühere Formulierungen „aktiv“, „nächster Auftrag“, „noch kein …“ und frühere PR-Zuordnungen gelten ausschließlich für ihren damaligen Stand. Aktuelle Verfügbarkeit und ausführbare Reihenfolge bestimmt allein §9.

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


### AUD14-05 Teil 2 – Vorbereitete Verdeckungsprüfung (15.10.2026)

PR344 nach ausdrücklicher Freigabe und grüner CI in main gemergt (c0abb7f).
Phasenmessung depth-before.json: reine bisherige Tiefenabfrage bei 500 Wänden, 20
Eckziele, Median 11,459 ms. Das bestätigt globale Flächenprojektion/Dreiecksprüfung
als tatsächlichen Kostenanteil; verschachtelte Phasen werden nicht addiert.

prepareNearestWallSurface projiziert Flächen einmal pro Query, hält eigene Koordinaten
und den vorhandenen generischen Boxindex. Kandidaten werden in ursprünglicher
Flächenreihenfolge mit unverändertem faceTriangles/triangleDepth geprüft; gleiche Tiefe
behält den bisherigen Gewinner. Konservative Bounds-Erweiterung erhält Randtoleranz;
extreme/nicht endliche Projektionsfälle durchlaufen die vorbereitete vollständige
Flächenliste. Keine X-Ray-Regel oder Tiefentoleranz geändert. prepareAnchorVisibility
verwendet dieselbe zentrale Klassifikation wie der Vollpfad. Einziger neuer Consumer:
createMovementOriginQuery; übrige Picking-/Sichtbarkeitspfade unverändert.
Vorbereitung lebt im vorhandenen Kamera-/Modell-/Sichtbarkeitskontext, kein globaler Cache.

1054 Tests, App-/Benchmark-Typecheck, gezieltes Lint und Build bestanden. Drei neue Tests
für Dreiecksränder, tolerierte Randüberschreitung, entartete/schmale Dreiecke, Tiefenbereich,
ungültige/extreme Projektion, Gleichstände, eigene Koordinaten sowie Kamera/Zoom-Kontexte.
Bestehende lokale Fangtests vergleichen weiter gegen das eingefrorene lineare Orakel.
Browser: 500 Wände/500 Fenster, sechs gleiche Pixelbilder und 48 gleiche Fangresultate
(Windows IAB Chrome/155; depth-browser-results.json). Keine Hardwareeingabe-/Framegarantie.

Runner depth-profile.ts / depth-results.json: 20 Tiefenabfragen, Vollpfad jeweils zuerst;
Median 11,589 → 0,059 ms, einmalige Vorbereitung 76,417 ms separat. Reihenfolge nicht
alterniert, keine p95-/Kaltstart-Zusage. Gesamtquery mit unverändertem local-origin-profile.ts,
40 alternierende Ziele und Gleichheitsprüfung außerhalb Messung (depth-origin-results.json):
- 500 Wände, gemischte Treffer Zoom 1: linear 13,759 → vorbereitet 0,069 ms.
- Dichte Projektion Zoom 0,02: 15,265 → 4,927 ms.
- Leerer Suchbereich Zoom 1: 1,467 → 0,004 ms.
Gesamtquery-Vorbereitung ist sequenziell mit geteilten Caches protokolliert, kein fairer
Kaltstartvergleich. Vorbereitung bei Kamerawechsel und dichte überlappende Kandidaten
bleiben relevante Kosten; keine pauschale Skalierungs-/Framerate-Zusage. Rund 76 ms
Vorbereitung sind ausdrücklich kein flüssiger Gesamtframe-Nachweis.

Nächste drei Schritte, nur Schritt 1 aktiv:
1. Große Anschlussgruppen und Fremdendpunktprüfung messen; sichere räumliche Eingrenzung
   nur bei erhaltenen Fenster-/Nachbar-/Anschlussabhängigkeiten und Vollcommitvergleich.
2. AUD14-06 Langsitzungs-Speicher und Recovery-Aufbewahrung prüfen.
3. AUD14-07 verbleibende Restschuld, Kamerawechselkosten und gemischtes Schulmodellprofil
   zusammenhängend abnehmen; Dokumentations-/Zuständigkeitsbefunde einschließen.
AUD14-05 insgesamt sowie AUD14-04-Restschuld bleiben bis zur jeweiligen Abnahme offen.


### AUD14-05 Teil 3 – Anschlussgruppen und fremde Endpunkte (15.10.2026)

PR345 nach ausdrücklicher Freigabe und grüner CI in main gemergt (cb895cc).
createCompatiblePointIndex unter geometry/spatial verwendet den gemeinsamen Boxindex,
eigene Punktkopien und MAX_MODEL_TOLERANCE_METRES nur als konservative Suchgrenze.
pointsCompatible bleibt die maßgebliche enge Prüfung. Keine neue Fangtoleranz, kein
Kandidatencap. prepared-endpoint prüft beide bewegten Enden damit statt einer linearen
Fremdpunktliste. Neue Kontakte behalten Vollprüfung. Vollständige Anschlussgruppe,
Fenster, Relationreihenfolge und vollständiger Commit bleiben unverändert.

1057 Tests, beide Typechecks, gezieltes Lint und Build bestanden. Drei zusätzliche Tests:
Toleranzgrenzen von kleinen bis extremen Koordinaten, ungültige/duplizierte Punkte,
Ownership, verteilte Punktmengen; 51 verbundene Wände inklusive Fenstern mit Verlängerung,
Kürzung/gelösten Anschlüssen, Schrägänderung und fremden Kontaktzielen exakt gegen Vollpfad.
Browserregression: 502 Wände/fünf Geschosse, 48 gleiche Pixelbilder sowie 48 gleiche
Projekt-/Commit-/Undo-/Abbruchvergleiche. Das Browserprofil enthält ein T-Paar, nicht die
51-Wand-Anschlussgruppe; deren Nachweis ist der separate Modellvergleich.

connection-group-profile.ts mit Vorher-/Nachher-Rohdaten connection-group-before.json /
connection-group-results.json: sieben Ziele, erstes nicht im warmen Median, Projektgleichheit
außerhalb Messung, vorbereitet jeweils vor Vollpfad. Node, keine Frame-/p95-Garantie.
Warme Vorschau vorher → nachher:
- Zwei verbundene Wände ohne fremde: 1,324 → 1,235 ms.
- Zwei verbundene Wände plus 1000 fremde: 1,014 → 0,878 ms; Vorbereitung 9,007 → 15,874 ms.
- Elf verbundene Wände plus 100 fremde: 3,289 → 3,298 ms.
- 51 verbundene Wände plus 100 fremde: 14,930 → 14,618 ms.
Der Fremdpunktindex begrenzt Suche, beschleunigt große Anschlussgruppen aber nicht wesentlich.
Keine Behauptung, dieser dominante Rest sei gelöst. Messstreuung und nicht alternierende
Reihenfolge beachten; kleiner Zeitunterschied ist kein allgemeiner Leistungsbeweis.

Fachliche Grenze: wallDependencyClosure behält absichtlich alle Eck-/T-Partner. Ohne
inkrementellen Validierungsvertrag darf man entfernte Gruppenmitglieder nicht abschneiden:
Kürzung kann Beziehungen lösen, stationäre Profile und Fenster hängen weiterhin daran.
51 verbundene Wände bleiben rund 14,6 ms Modellvorschau ohne Renderer. Dieser offene
AUD14-05-Rest benötigt gesonderte inkrementelle Prüfung, kein willkürliches Gruppenlimit.
Übergang zur bereits geplanten Speicherprüfung ist eine Priorisierung, keine Schließung
von AUD14-05. Restbefund bleibt verbindlich für AUD14-07 und den späteren Architekturreview.

Nächste drei Schritte, nur Schritt 1 aktiv:
1. AUD14-06 Langsitzung mit 1/10/50/100 History-Ständen, Bildwechseln und Recovery-Slots
   vermessen; gehaltene Referenzen und konkurrierende Schreiber vor Bereinigung erfassen.
2. Aus Messung sichere Aufbewahrung/Bereinigung ableiten; gültige aktuelle/vorherige Stände,
   Migration und andere Projekte/Tabs schützen, Quota-/Abbruchfälle nachweisen.
3. AUD14-07 gemischtes Schulprofil einschließlich großer Anschlussgruppen/Kamerawechsel
   prüfen und offene Leistungs-/Architekturbefunde als Abschlussgate behandeln.
AUD14-04-Restschuld, großer Anschlussgruppenrest und AUD14-07 bleiben ausdrücklich offen.


### AUD14-06 Teil 1 – History- und Recovery-Aufbewahrung (15.10.2026)

PR346 nach ausdrücklicher Freigabe und grüner CI in main gemergt (9c38ffc).
Neue Diagnose session-retention.html/.ts verwendet die echte History, den Produktionscodec
und denselben V2-Storageadapter mit isolierten Store-Namen. Keine Nutzerdatenbank verändert.
Zwei Projekte mit je 1000 Linien, Wand/Fenster/Referenzbild; je 110 echte Wandhöhenänderungen,
Recovery am Start, nach Schritt 1 und jedem zehnten Schritt. Ein Projekt behält sein Bild,
das andere ersetzt es alle zehn Schritte durch ein neues synthetisches 256×256-PNG.
Beide Projekte teilen zunächst denselben Bildinhalt. Messpunkte 1/10/50/100/110.

Browsernachweis session-retention-results.json (Windows IAB Chrome/155): PASS.
- Unverändertes Bild: ein gemeinsamer Handle/Payload bei allen History-Tiefen.
- Bildwechsel: bei 110 Änderungen 100 frühere Stände plus Gegenwart, elf unterschiedliche
  Bildhandles in dieser History; der älteste Bildstand ist aus dieser History gefallen.
- Recovery behält zwölf Payloads. Current/previous beider Projektslots referenzieren drei
  unterschiedliche Schlüssel; neun Payloads haben keine Referenz aus diesen V2-Heads.
  Logische JSON-Nutzlast 2.691.213 Bytes, keine physische IndexedDB-/Quota-Messung.
- Je Szenario 100 Undo und 100 Redo mit Endhöhen-/Bildvergleich bestanden; veralteter
  Schreiber auf zweiter Datenbankverbindung mit konkretem Revisionskonflikt abgewiesen.
  Beide Slots nach Schließen/Neuöffnen der DB mit korrekter Höhe und Bildinhalt restauriert.
- Benchmark-Typecheck, gezieltes ESLint und App-Build bestanden. Produktcode unverändert;
  die 1057 Modelltests aus PR346 sind Basisevidenz, in diesem Dokumentationslauf nicht erneut ausgeführt.

Einordnung: beschleunigte 220-Änderungen-Sequenz, kein stundenlanger UI-Lauf und kein
Browser-/OS-Neustart. performance.memory-Stichproben ohne erzwungene GC sind im Rohbericht,
aber keine Retained-Heap-/Leak-Analyse. Der Messcode selbst liest Payloads und hält erwartete
Bildstrings; daraus folgt kein Produkt-Peakspeicherwert. Dekodierte Raster/GPU, Kamerawechsel,
Bildentfernung, Quota und echte Langsitzung bleiben gesonderte Abnahme. Diagnose-DBs bleiben
isoliert erhalten; jeder erneute Start erzeugt eine neue Diagnose-DB.

Codeprüfung: history.ts begrenzt past auf 100; geprüfte Bildhandles und Payloadstrings
werden bei unveränderten Bildern geteilt. URL-/Codec-WeakMaps können erst mit ihren lebenden
Handles freigegeben werden; History ist daher ein legitimer Halter. V2 publish fügt Payloads
hinzu, rotiert current/previous und prüft CAS, entfernt aber keine verwaisten Payloads.
Die Messung begründet gezielte persistente Aufbewahrung, keinen History-/Renderer-Umbau.

Verbindliche Schutzgrenze für den nächsten Piloten: keine Löschung aus einer vorab gelesenen,
später veralteten Referenzliste. Root-Ermittlung und Löschung gemeinsam in einer atomaren
Transaktion über alle betroffenen Stores, serialisiert gegen publish/Migration. Alle Slots,
current UND previous schützen; keine Löschung von Heads oder V1-Migrationsoriginalen.
Unbekannte/beschädigte Root-Strukturen müssen Bereinigung konservativ verhindern, statt
scheinbar freie Payloads zu erraten. Ein In-Memory-Undo braucht beim nächsten Save erneut
bereitstellbare Payloads; stale Writer dürfen weiterhin nur über CAS veröffentlichen.
Das genaue API und ein Produktions-Auslösezeitpunkt sind noch Entwurfsentscheidungen;
keine automatische Produktionsbereinigung in diesem Schritt freigegeben/implementiert.

Nächste drei Schritte, nur Schritt 1 aktiv:
1. Isolierten transaktionalen V2-Bereinigungspiloten implementieren: geteilte Bilder über
   mehrere Slots, current/previous, unbekannte/beschädigte Heads, Schreiberkonkurrenz und
   Wiederbereitstellung eines aus Undo stammenden Bilds prüfen; Produktionsdaten unberührt.
2. Nach bestandenem Piloten Produktionsanbindung mit Quota-/Abbruch-/Migrations- und
   Langlaufnachweisen begrenzt abnehmen; Auslösezeitpunkt und Rest-Speicherprofil festlegen.
3. AUD14-07 Schulprofil inklusive großer Anschlussgruppen, Kamerawechselkosten und offener
   Architektur-/Statuskorrekturen abnehmen. AUD14-04/05-Restschuld bleibt sichtbar.


### AUD14-06 Teil 2 – Transaktionaler Bereinigungspilot (15.10.2026)

PR347 nach ausdrücklicher Freigabe und grüner CI in main gemergt (aeddaec).
collectRecoveryV2Pilot in Interop akzeptiert ausschließlich Diagnose-Datenbanknamen.
Keine produktive Anbindung, keine UI-Änderung, keine Nutzerdaten gelöscht. Der Pilot
verwendet den vorhandenen Storageadapter und die vollständige Recovery-Prüfung beider
Kandidaten einzeln; ein funktionierender Vorgänger darf einen beschädigten current nicht
als Bereinigungserlaubnis verdecken. Unbekannte/abweichende Root-Strukturen führen zum Skip.

Vorbereitung liest Heads und validiert Modelle/Bildintegrität asynchron außerhalb einer
Schreibtransaktion. Danach werden ALLE Heads inklusive Slotkeys innerhalb einer gemeinsamen
readwrite-Transaktion über legacy/heads/assets erneut vollständig mit der geprüften Basis
verglichen. Jede Abweichung verhindert Löschung. Erst nach diesem atomaren Vergleich darf
die vollständige Referenzmenge current/previous aller Slots verwendet werden. Publish und
Migration verwenden überlappende Store-Sperren und laufen daher vor oder nach dem Löschen.
Kein bloßer Revisionsvergleich, keine ungeschützte stale Root-Liste. Der Löschlauf liest nur
Payloadschlüssel; validierte Bildstrings werden nicht über sämtliche Slots gesammelt gehalten.

V1-Präsenz blockiert diesen ersten Piloten konservativ komplett – auch gültige bereits
migrierte Originale. Das erhält sie bytegleich, ist aber ausdrücklich noch keine brauchbare
Produktionspolitik für migrierte Installationen. Heads werden niemals entfernt. Abbruch vor
Commit rollt die Transaktion zurück; Erfolg wird erst mit oncomplete gemeldet.

Browser: recovery-retention.html/.ts, Rohbericht recovery-retention-results.json,
Windows IAB Chrome/155, 16 bestandene Assertions mit zwei echten IDB-Verbindungen:
- Vier unterschiedliche Bildpayloads über zwei Projektslots → genau ein verwaistes Bild
  gelöscht, drei durch current/previous/fremden Slot benötigte Bilder erhalten.
- Beschädigter current und previous, unbekannte Version, V1-Präsenz verhindern Löschung.
  Gültiger Vorgänger und anderes Projekt vollständig per serializeProject verglichen.
- Bereits bereinigtes Bild aus älterem Modellstand lässt sich beim Speichern wieder
  bereitstellen; veralteter Writer bleibt mit konkretem CAS-Revisionsfehler abgewiesen.
- Deterministisch pausierte Validierung plus Veröffentlichung auf zweiter Verbindung:
  Bereinigung übersprungen. Zusätzlich konkurrierendes Save/Collect mit gültigem Endstand.
- Abbruch vor Start und deterministischer Abbruch NACH erfolgreicher einzelner IDB-Löschung,
  aber VOR Transaktionscommit: gesamter Payloadbestand erhalten. Fehler-Injektion nur Runner.
- Bildentfernung nach zweimaligem Speichern entfernt nur nicht mehr benötigte Payloads;
  fremder current/previous bleibt. DB-Neuöffnung mit vollständigem Modellvergleich bestanden.

1057 Modelltests, App-/Benchmark-Typecheck, gezieltes ESLint und App-Build bestanden.
Browser-Assertions sind separate echte IndexedDB-Prüfungen, keine zusätzlichen Node-Tests.
Keine OS-/Browser-Neustart-, Langlauf-, Quota- oder Produktions-Migrationsabnahme behauptet.
Vollprüfung und vollständiger Headvergleich können bei großen Projekten teuer sein. Dieser
Pilot darf deshalb nicht ungeprüft nach jedem Autosave laufen. Vorbereitungskosten und
Kopien sind vor Aktivierung zu messen; der spätere Auslösezeitpunkt bleibt Entwurfsarbeit.
Kein Wechsel zu Delta-History, kein Rendererumbau und keine Aufweichung der Sicherungsgrenze.

Nächste drei Schritte, nur Schritt 1 aktiv:
1. Gemeinsamen Bereinigungspiloten auf produktives Store-Layout übertragen und weiterhin
   isoliert mit echten V1-Migrationsoriginalen, unbekannten Altständen und größeren Heads
   prüfen; Vorbereitungskosten messen und begrenzten Auslösezeitpunkt begründen.
2. Erst danach kontrolliert anbinden; Quota-/Retry-/Abbruch- und Langlaufnachweise inklusive
   Bildentfernung/Undo/Reload abschließen. Gültige letzte Sicherung bleibt unangetastet.
3. AUD14-07 Schulprofil, große Anschlussgruppen/Kamerawechsel und Architektur-/Statuskorrekturen
   abnehmen. AUD14-04/05-Restschuld und AUD14-06-Gesamtabnahme bleiben offen.


### AUD14-06 Teil 3 – Produktives Layout und Migrationsschutz (15.10.2026)

PR348 nach ausdrücklicher Freigabe und grüner CI in main gemergt (4e1945d).
Gemeinsame recoveryV2Layout-Funktion hält Store-Namen/Slotadressierung für Produktionsadapter
und Pilot zusammen. Keine Anbindung der Bereinigung an das Produkt; Namensschutz für
Diagnosedatenbanken bleibt. Bestehender Storageadapter verwendet identische Store-Namen.

Der Pilot prüft jetzt jeden vorhandenen V1-current/previous mit der vorhandenen vollständigen
Snapshot-Prüfung. V1 enthält Bildbytes inline, verweist nicht auf den V2-Payloadstore. Gültige
V1-Originale bleiben bytegleich liegen und blockieren V2-Bereinigung nicht mehr. Unbekannte
Versionen, Zusatzfelder oder beschädigte Kandidaten blockieren weiterhin den ganzen Lauf.
Vor jeder Löschung werden sämtliche V1-Einträge UND V2-Heads/Slotkeys in derselben atomaren
Schreibtransaktion mit der geprüften Basis verglichen. Ein neuer/ersetzter Altstand während
Vorbereitung verhindert Löschung. Katalogindex ist in der Sperre, wird nicht verändert.

retention-layout.html/.ts mit createRecoveryCatalog/openRecoveryDatabase in isolierter DB:
11 Assertions bestanden. Echte V1-Migration mit zwei unterschiedlichen eingebetteten Bildern,
weitere V2-Bildwechsel, genau zwei verwaiste Payloads gelöscht/einer erhalten; V1-current und
previous bleiben unabhängig lesbar. V2-Modell und Index unverändert, unbekannte Version und
beschädigter Vorgänger blockieren; deterministisch neuer V1-Slot während Vorbereitung führt
zu changed-roots. Modelle mit 1000/10000 Linien vollständig per serializeProject verglichen,
DB-Neuöffnung geprüft. Zusätzlich 16 bisherige Browserfälle erneut bestanden (separater
Regressionsbericht). 1057 Modelltests, beide Typechecks, gezieltes Lint und Build bestanden.

Messung Windows IAB Chrome/155, retention-layout-results.json: drei sequenzielle Läufe je
Größe, inklusive vollständiger Vorbereitung und Transaktion; zwei V2-Projektslots, kleine
2×2-Bilder und V1-Original. Gesamtmedian 1000 Linien 46,3 ms, beobachtetes Maximum 53,5 ms;
10000 Linien 386,0 ms, Maximum 406,2 ms. Kein statistisch belastbares p95, keine getrennte
Phasen-/Frame-/Peakmessung, kein schweres Raster-/BIM-Schulmodell und keine Langsitzung.
Die End-to-End-Kosten verbieten eine ungemessene Ausführung nach jedem Autosave. Vorlage
für die nächste Anbindung: explizite Wartungsaktion mit Fortschritt/Abbruch, außerhalb der
Zeichen-/Vorschaupfade; keine automatische Endlosschleife bei Konflikt oder Quota. Das ist
noch keine Zusage, dass synchrone Teilphasen ruckelfrei sind; deren Pausen vor UI-Abnahme messen.

Nächste drei Schritte, nur Schritt 1 aktiv:
1. Explizite abbrechbare Wartungsaktion über gemeinsamen Application-/Storage-Port anbinden;
   Status/Fehler, letzte Sicherung und Quota-/Abbruchfälle absichern, nicht pro Autosave.
2. Längere Sitzungen mit Bildwechsel/Entfernung, Undo, Reload und gemischtem Speicherprofil
   prüfen; synchrone Pausen und Speicherbereiche getrennt ausweisen.
3. AUD14-07 Schulprofil und verbleibende Anschlussgruppen-/Kamera-/Architekturbefunde abnehmen.
AUD14-06 und AUD14-04/05-Restschuld bleiben offen; keine automatische Nutzerbereinigung.


### AUD14-06 Teil 4 – Wartungssteuerung vorbereitet, Aktivierung blockiert (15.10.2026)

Erneute Nutzerfreigabe nennt PR348; dieser ist bereits gemergt (4e1945d). PR349 bleibt offen.
Folgezweig basiert ausdrücklich auf PR349; keine Übertragung der Mergefreigabe auf andere PRs.
Die automatische Freigabeprüfung lehnte die Entfernung der Diagnose-Namensschranke und
Produktionsanbindung der löschenden Logik als erweitertes Datenverlustrisiko ab. Diese
Änderung wurde NICHT ausgeführt oder umgangen. Aktivierung benötigt ausdrückliche Freigabe.

Fertig vorbereitet: typisierter RecoveryMaintenanceStorage-Port und Application-Controller
mit explizitem Start, einem laufenden Vorgang, AbortSignal, Dispose und verständlichen
Ergebnissen. Kein Timer, kein automatischer Retry, keine Verbindung zu Autosave/Modell-Undo.
Ein nach Transaktionscommit eintreffender Abbruch darf Erfolg nicht in Abbruch umdeuten.
Quota, unbekannter Fehler, übersprungene unsichere Daten und Abbruch sind getrennt dargestellt.
Ergebnistyp liegt zentral in Application; Pilot verwendet ihn nur als Type-Import. Seine
Diagnose-Schranke und sämtliche Datenbankoperationen sind unverändert.

RecoveryMaintenanceControls ist port-injiziert, zeigt Start/Abbruch und Status; noch NICHT im
RecoveryPanel eingebaut. benchmarks/maintenance-controls.html/.tsx prüft die Bedienung mit
klar gekennzeichnetem simulierten Port: kein Datenbankzugriff. Start sperrt weiteren Start,
Abbruch meldet Abbruch, erneuter manueller Start endet mit Erfolg. Kein Produktions-/IDB-
Integrationsnachweis aus dieser Simulation abgeleitet. 1063 Tests (sechs neue Controllerfälle),
Benchmark-/App-Code-Typecheck, gezieltes Lint und Build bestanden. Bereits vorhandene reale
IDB-Abnahme aus Teil 3 bleibt Grundlage, wurde in diesem reinen Steuerungsschritt nicht wiederholt.

Einziger aktiver Auftrag bleibt die vollständige kontrollierte Wartungsanbindung; nur der
nicht löschende Teil ist erledigt. Nächste drei Schritte:
1. Nach ausdrücklicher Aktivierungsfreigabe geprüften Storage-Port und RecoveryPanel anbinden;
   echte Quota-/Abbruch-/Letzte-Sicherung-Fälle prüfen, keine automatische Bereinigung.
2. Langsitzungs-/Bildwechsel-/Undo-/Reload- und Speicherprofil abschließen.
3. AUD14-07 Gesamtabnahme mit offenen Anschlussgruppen-/Kamera-/Architekturbefunden.


### AUD14-06 Teil 5 – Manuelle Produktanbindung ausdrücklich freigegeben (15.10.2026)

Nutzer gibt Bereinigung echter lokaler Wiederherstellungsdaten ausdrücklich frei, nur über
„Speicher warten“, mit Abbruch und Schutz benötigter Sicherungen. Damit ist die Sperre aus
Teil 4 für genau diese Anbindung aufgehoben; automatische Freigabeprüfung lässt den nun
konkret autorisierten Schritt zu. Keine zusätzliche Mergefreigabe für PR349/350 abgeleitet.
Bestehender Entwurf PR350 wird um die vollständige Anbindung ergänzt, Basis bleibt PR349.

Gemeinsamer Collector nach recovery-retention.ts verschoben; identische Root-/V1-/CAS-/
Transaktionsprüfung. Diagnose-Wrapper bleibt mit Namensschutz erhalten und ruft denselben
Collector auf. Neuer RecoveryMaintenanceStorage-Adapter öffnet den produktiven Speicher nur
auf collect-Aufruf und schließt seine Verbindung auch bei Fehler/Abbruch. RecoveryPanel
montiert die vorbereiteten port-injizierten Controls. Klick startet, Abbrechen/Unmount beendet
vor Commit; spätes Abort überschreibt Erfolg nicht. Keine Kopplung an Autosave oder Modell-
History, kein Hintergrundtimer/Retry. Alle Slots/current/previous und V1-Originale bleiben
wie im geprüften Collector geschützt. Bei konkurrierender Änderung wird übersprungen.

Nachweis: 1063 Tests, Benchmark-/App-Code-Typecheck, gezieltes Lint, Build bestanden.
17 Browser-Integrationsassertions über tatsächlichen Produktionsadapter in isolierter DB
(maintenance-activation-results.json), zusätzlich 16 ursprüngliche Collector-Schutzfälle
(maintenance-activation-regression.json). Faules Öffnen, echter Action-/Adapterlauf,
Vorab-Abbruch ohne DB-Öffnung, simulierter QuotaExceededError am Öffnungsport ohne Retry und
anschließend vollständiger Vergleich der letzten Sicherung geprüft. Rollback nach bereits
getätigter Löschung und Schreibkonflikte erneut im realen IDB-Collector geprüft. Kein echter
Datenträger-/Browserquota-Vollzustand behauptet; dieser bleibt separat offen.

UI im laufenden 8080-Programm: Wiederherstellungsstatus unten links → Lokale Wiederherstellung
zeigt „Speicher warten“. Benutzerprojekt nicht geändert und dessen Bereinigung nicht ausgelöst;
Löschtests ausschließlich isoliert. Frühere Bedienungssimulation belegt zusätzlich Abbrechen.
Messwiederholung 1000/10000 Linien: Median ca. 49,5/517,5 ms Gesamtzeit (je drei Läufe), keine
Frame-/p95-/Peakgarantie. Ein expliziter Wartungslauf kann weiterhin synchrone Pausen verursachen;
„abbrechbar“ heißt an den vorhandenen asynchronen Grenzen, nicht Unterbrechung eines JS-Aufrufs.

Nächste drei Schritte, nur Schritt 1 aktiv:
1. Längere Sitzungen mit Bildwechsel/Entfernung, Undo/Reload und realistischen Speicherlasten
   prüfen; Quota-Injektion und tatsächlich erreichte Speichergrenze unterscheiden.
2. Synchrone Pausen, Heap/Prozess-/Rasterbedarf auswerten und nur gemessene Engpässe begrenzen.
3. AUD14-07 Schulprofil einschließlich Anschlussgruppen, Kamerawechsel und Architekturrestschuld
   abnehmen. AUD14-06-Gesamtabnahme bleibt bis zum Langzeit-/Speichernachweis offen.

### AUD14-06 – Standardaktivierung und Wartungsreihenfolge (15.10.2026)

Nutzerfreigabe: #349 und #350 ausdrücklich in main übernommen (26f98dd). Neuer begrenzter
Schritt: lokale Autosicherung für neue Browserprofile standardmäßig aktiv; explizites Ein/Aus
wird als Browserpräferenz getrennt vom Projekt und Modell-Undo gespeichert. Projekt-/Kontextwechsel
übernehmen diese Entscheidung, erneutes Laden liest sie wieder. Unlesbarer Präferenzspeicher
aktiviert nicht ungefragt, sondern zeigt im RecoveryPanel einen Hinweis; fehlgeschlagenes Speichern
der Einstellung wird ebenfalls angezeigt. Die bisherige sitzungsbezogene Entscheidung war nicht
persistiert und kann nachträglich nicht rekonstruiert werden. Bestehende Sicherungen bleiben erhalten.
Der bestehende serielle Controller, 2-Sekunden-Entprellung, CAS/Fehlerpause und manuelle Sicherung
bleiben gemeinsame Basis. Keine zweite Schreiblogik. Alte Controller-Verbraucher ohne explizite
Profilpräferenz behalten ihren bisherigen Opt-in-Vertrag.

Automatische Wartung ist als Ziel freigegeben, aber noch NICHT aktiviert: gemeinsame Logik,
bedarfsabhängig nach erfolgreicher Sicherung, kein Start während aktiver Bearbeitung, kein
automatischer Retry bei Fehler/Konflikt. Bedienpause allein genügt nicht gegen synchrone Pausen.

Nächste drei Schritte, nur Schritt 1 aktiv:
1. Langsitzungen mit Bildwechsel, Undo/Reload, Speicherlast und synchronen Wartungspausen messen.
2. Bedarfsgesteuerte automatische Wartung über denselben Port mit Bearbeitungssperre/Abbruch
   umsetzen, sobald die Belastungsprüfung eine vertretbare Ausführung belegt.
3. AUD14-07 Schulprofil mit Gruppen, Kamerabewegung und Architekturrestschuld abnehmen.

Nachweis dieses Schritts: 1067 Tests bestanden, Benchmark-/Application-Typecheck, gezieltes
ESLint und Build erfolgreich. Neue Tests prüfen Default, gespeicherte Ein/Aus-Entscheidung,
Speicherfehler und automatisches Sichern über Projektwechsel. Keine neue visuelle Browserabnahme
und keine Langsitzungs- oder automatische Bereinigungsabnahme aus diesen Tests abgeleitet.

### Priorisierter Nutzerbefund – 3D-Kamera/Wandflackern (15.10.2026)

Nutzer meldet Flackern einzelner Wandflächen bei sehr langsamem Orbit, auch bei nur einer Wand.
Dieser begrenzte Bugfix hat Vorrang vor der Langsitzungsprüfung. Basis ist der noch offene PR351;
keine Mergefreigabe dafür abgeleitet. BimSolidView veröffentlichte die Kamera-Projektion und den
GPU-Draw erst in getrennten passiven Effects. DOM/Orientierung und GPU konnten verschiedene
Kamerastände enthalten. Beide Präsentationsschritte laufen jetzt als Layout-Effects vor dem
Browser-Paint. Orientierungsebene verwendet die tatsächlich projizierte Kamera. Orbit bindet
das Seitenverhältnis beim Gestenbeginn, statt während einer invalidierten Projektion auf 1
zurückzufallen. Keine Änderung an Modellgeometrie, Fangquellen oder GPU-Geometriecache.

Isolierte Browser-Gegenprobe camera-frame.html/.tsx mit echtem BimSolidView, einer Wand und
Öffnung, 160 kleinen Orbit-/Pan-Schritten: alter Code 160 veraltete GPU-Kameramatrizen am
synchronen React-Commit-Ende; korrigierter Code 0, WebGL-Fehler 0. Original als temporäre separate
Komponente geprüft und danach entfernt. Dies belegt den Präsentationsversatz, aber keine
Framezeit-/Großmodellgarantie und nicht jedes mögliche Flackern (z.B. überlappende Flächen).
Praktische Abnahme am Nutzerbeispiel bleibt erforderlich. Prüfharness verändert keine Nutzerdaten.

Nächste drei Schritte, nur Schritt 1 aktiv:
1. Korrigierten langsamen Orbit am Nutzerbeispiel abnehmen; bei Restflackern dessen Darstellung
   gezielt erfassen, statt den gesamten Renderer umzubauen.
2. Langsitzungen mit Bildwechsel/Undo/Reload und synchronen Wartungspausen prüfen.
3. Nach Belastungsnachweis bedarfsabhängige automatische Wartung über gemeinsamen Port anbinden.
AUD14-07 Schulprofil bleibt anschließend vorgemerkt.

Validierung des Kamera-Teilfixes: 1067 Tests, Typecheck, gezieltes ESLint und Build bestanden.

### Kamerageste am Browserrand – Nutzerpräzisierung (15.10.2026)

Langsames Flackern vom Nutzer bestätigt behoben. Neuer Befund wurde präzisiert: Fehlerseite
beim Cursor außerhalb des Browsers, nicht allein durch schnelles Drehen. Route-Fehlerseite
beobachtet; konkrete Exception in verfügbaren Browserlogs nicht enthalten. 26 interne
Orbitgesten ohne Fehler. Browserautomation erlaubt keine Koordinaten außerhalb des Tabs;
daher keine Behauptung einer vollständigen Reproduktion des ursprünglichen Absturzes.

PR352 ergänzt: gemeinsamer Navigation-Exit-Beobachter beendet nur transiente Kameragesten
bei document.pointerout ohne relatedTarget, window.blur und verborgenem Dokument. Ref wird
vor Capture-Freigabe gelöscht; bereits verlorene Pointer-ID (NotFoundError) toleriert. Fehlender
buttons-Zustand stoppt eine noch offene Navigation. Kein Modellcommit und keine Abbruchlogik
für Modellaktionen erfunden. Listener werden beim Unmount entfernt.

1068 Tests, Typecheck, Build bestanden. Isolierter Browserharness mit echter Drag-Geste und
simuliertem Browseraustritt während Capture: keine Kameraänderungen nach Abbruch. Anschließend
160 Synchronisierungsschritte weiterhin PASS, 0 veraltete GPU-Matrizen, WebGL-Fehler 0.
Das ist ein geprüfter Lifecycle-Schutz, kein Beweis für die Ursache der gemeldeten Fehlerseite.

Nächste drei Schritte, nur erster aktiv: (1) echten Browserrand-Ablauf praktisch abnehmen,
bei Wiederauftreten konkrete Exception erfassen; (2) Langsitzungs-/Speicherlastprüfung;
(3) bedarfsgesteuerte automatische Wartung nach Belastungsnachweis. Kein Merge dieser PRs.

### AUD14-06 – Beschleunigte Bild-/Sicherungssitzung (15.10.2026)

Nutzer bestätigt Kamera-/Browserrand-Fix praktisch. #351 und #352 ausdrücklich freigegeben
und in main übernommen (#352 bc34f668). Nächster begrenzter Prüfauftrag umgesetzt als
recovery-session.html/.ts, mit echtem Katalog/Writer/Produkt-Wartungsadapter in eigener UUID-DB.
24 beschleunigte Zyklen mit 1000 Linien, echten 1024×1024-PNGs, wechselnden Bildinhalten,
Entfernung und erneutem Speichern des ursprünglichen Modells. Je Zyklus vollständige
serializeProject-Vergleiche von Current, Previous (ab zweitem Zyklus) und fremdem Projekt.
Nach Wartung maximal drei benötigte Bildpayloads, am Ende zwei mit insgesamt 6283500 Base64-
Zeichen. Dies ist logische Nutzlast, keine physische Platten-/Heap-/GPU-Messung.

Zwei Läufe PASS. Messwiederholung mit Long-Task-Beobachter: 12 Wartungen ca. 109–231 ms
End-to-End. 14 Long Tasks im gesamten Test, keine überlappte die protokollierten Wartungs-
zeitfenster. Globale Zeitgeberlücke maximal 202 ms, einschließlich Bilderzeugung, Serialisierung
und Prüfvergleichen; nicht als Collector-Pause ausgeben. Keine statistische p95-/Ruckelfrei-
Garantie. Ergebnis in recovery-session-results.json. Typecheck, gezieltes ESLint und Build
bestanden; unveränderte Produktionsbasis zuletzt 1068 Tests und GitHub-CI grün.

Grenzen: Lauf ist beschleunigt (Sekunden), kein Stunden-Dauertest. Adapter öffnen Verbindungen
neu, kein kompletter Browserneustart. Rückkehr zum alten Modell simuliert den zu sichernden
Undo-Inhalt, führt aber kein UI-Undo aus. Kein echter Quota-Vollzustand, keine Heap-/Prozess-
Peakmessung. Automatische Wartung bleibt bis zu deren Nachweis aus. Keine Nutzerdaten bereinigt.

Nächste drei Schritte, nur Schritt 1 aktiv:
1. Reale längere Sitzung mit Application-Undo/Redo und vollständigem Reload ergänzen.
2. Heap-/Prozess-/Rasterspitzen und Speichergrenzen getrennt messen; nur belegte Engpässe beheben.
3. Bedarfsgesteuerte automatische Wartung über bestehenden Port nach bestandenen Gates anbinden.
AUD14-07 großes Schulprofil bleibt anschließend offen.

### AUD14-06 – Application-History und vollständiger Seitenreload (15.10.2026)

PR #353 nach erfolgreicher CI ausdrücklich freigegeben und in main übernommen.
Neuer isolierter Prüfharness recovery-undo-reload.html/.ts: 1000 Linien, echtes
1024×1024-PNG, acht Folgen Entfernen/Undo/Redo/Undo über editingReducer, insgesamt
32 Sicherungen mit anschließender produktiver Wartung in eigener UUID-Testdatenbank.
Nach jeder Sicherung werden Current, Previous und ein fremdes Projekt vollständig
serialisiert und per SHA-256 gegen die erwarteten Inhalte verglichen. Application-
History zusätzlich gegen erwartetes Modell geprüft. Anschließend kompletter Seitenreload:
RELOAD_PASS, navigationType=reload; alle drei Inhalte unverändert. Erwartungswerte
liegen nur als Hashes und Testdatenbankname in sessionStorage, keine Bildkopien dort.
Typecheck, gezieltes ESLint und Build bestanden. Produktionscode unverändert.

Grenzen: beschleunigter Test, keine UI-Tastaturgesten, kein Prozess-/Browserneustart,
keine persistierte Undo-History zugesagt. PNG ist komprimierbare einfarbige Testgrafik;
die vorherige Prüfung mit Rauschbildern bleibt ergänzender Lastnachweis. Stundenlauf,
Quota-Vollzustand und Heap-/Prozessspitzen bleiben offen. Automatische Wartung bleibt aus.

Nächste drei Schritte (nur Schritt 1 aktiv):
1. Längeren Belastungslauf mit Bildwechsel und getrennten Heap-/Prozess-/Rastermessungen vorbereiten und ausführen.
2. Aus Messungen sichere Wartungsauslöser und Speichergrenzen ableiten; nur belegte Engpässe korrigieren.
3. Bedarfsgesteuerte automatische Wartung über den bestehenden Port nach bestandenen Gates anbinden.

### AUD14-06 – Zeitprofil mit Speicherstichproben (15.10.2026)

#354 nach erfolgreicher CI ausdrücklich freigegeben und in main übernommen.
Bestehender recovery-session-Harness um auswählbare 120 Zyklen mit je 1 s Pause
und optionale JS-Heap-Stichproben erweitert; kein zweiter Collector/Produktpfad.
Browserlauf PASS: 162305,5 ms, 120 Zyklen, 1000 Linien, echte 1024x1024-Rausch-PNGs.
Current/Previous/fremdes Projekt durchgehend identisch. Nach Wartung maximal drei
Payloads, abschließend zwei mit 6283500 Base64-Zeichen. Wartung maximal 176,5 ms
End-to-End; globale Timerlücke maximal 182,8 ms. 61 Long Tasks im Gesamtlauf,
nicht automatisch Wartungskosten. Ergebnis: benchmarks/recovery-duration-results.json.

Optionale performance.memory-Stichproben: ca. 15,46 bis 240,40 MB, zuletzt 85,96 MB.
Diese groben Werte schließen Fixture-Erzeugung, Serialisierung und Vergleich ein;
keine Leakfreiheit, kein isolierter Collector-Peak und keine Prozess-/GPU-Messung.
StorageManager.estimate meldet für den gesamten Origin ca. 24,83 auf 31,74 MB;
das ist keine physische Größe der einzelnen Testdatenbank. Rasterbuffer rechnerisch
4 MiB je erzeugtem Bild; keine gemessene Raster-/GPU-Spitze. 162 Sekunden sind kein
Stunden-Dauertest. Testdatenbank bleibt isoliert bestehen. Produktionscode unverändert.
Typecheck, gezieltes ESLint und Build bestanden. Automatische Wartung bleibt aus.

Nächste drei Schritte (nur Schritt 1 aktiv):
1. Wartung bei mehreren gespeicherten Projekten isoliert messen; Heap-Zuordnung und Abbruchverhalten prüfen.
2. Aus belastbaren Daten bedarfsabhängige Auslöser und Grenzen festlegen; verbleibende Messlücken ausdrücklich behandeln.
3. Automatische Wartung über den gemeinsamen Port anbinden und praktisch abnehmen.

### AUD14-06 – Acht Projekte und Abbruchschutz (15.10.2026)

#355 nach erfolgreicher CI ausdrücklich freigegeben und in main übernommen.
Neuer Browserharness recovery-multiple nutzt gemeinsame extrahierte Diagnose-Fixtures
(Rauschbild und Payloadstatistik) und unveränderten produktiven Wartungsadapter.
Acht Projekte mit je 1000 Linien, drei unterschiedlichen 1024x1024-PNG-Revisionen.
Abbruch vor Öffnen und zeitgesteuert während Vorbereitung: AbortError, alle 24
Payloads erhalten, Current/Previous sämtlicher Projekte per SHA-256 der vollständigen
Serialisierung identisch. Kein erzwungener Abbruch mitten in Löschtransaktion behauptet.

Zwei Browserläufe PASS. Finaler Lauf: genau acht verwaiste Payloads entfernt,
16 geschützte Payloads bleiben; 75405420 auf 50271656 Base64-Zeichen. Alle 16
Sicherungsinhalte unverändert. Wartung 701,7 ms End-to-End (erster Lauf 571,2 ms),
keine Gleichsetzung mit synchroner UI-Blockade. Heap-Stichproben nur im Wartungsfenster
ca. 38,35–115,90 MB; zeitlich isoliert, aber grobe/geteilte JS-Heap-API einschließlich
vorhandener Laufzeitdaten, keine kausale Zuordnung sämtlicher Bytes zum Collector.
Keine Prozess-/GPU-Spitze, kein Stunden-/Quota-Test. Ergebnis recovery-multiple-results.json.
Typecheck, gezieltes ESLint und Build bestanden. Keine Produktionslogik geändert.

Nächste drei Schritte (nur Schritt 1 aktiv):
1. Begrenzte Auslöse-/Abbruchregeln für automatische Wartung aus bisherigen Nachweisen festlegen (Ruhephase, kein paralleler Lauf, begrenzte Wiederholung, keine Zwangsbereinigung bei unlesbaren Sicherungen).
2. Diese Steuerung über den gemeinsamen Wartungsport mit deterministischen Tests implementieren; grobe Heap-Werte nicht als Auslöser verwenden.
3. Integration praktisch auf Unterbrechung, Wiederanlauf und unveränderte Sicherungen abnehmen; Stunden-/Quota-/Prozessmessungen als offene Belastungsnachweise weiterführen.
Automatische Wartung bleibt in diesem Schritt aus.

### AUD14-06 – Vertrag für automatische Wartung, erster Pilot (15.10.2026)

#356 nach erfolgreicher CI ausdrücklich freigegeben und in main übernommen.
Dieser Schritt legt den technisch ausführbaren Vertrag fest; keine automatische Löschung
aktiviert und keine Produktionsdatei geändert. Die folgenden Zeiten sind konservative
Pilotparameter, keine aus zwei Browserläufen abgeleiteten Leistungsgrenzen.

**Verbindliche Architektur und Sicherheitsgrenze:**
- Ein Application-Koordinator je laufender Anwendung verwaltet manuelle und automatische
  Wartung über denselben RecoveryMaintenanceStorage-Port. Keine zweite Löschlogik und
  keine Wartung pro Werkzeug, Projektkomponente oder geöffnetem Einstellungsfenster.
- Bestehender Dialog erstellt heute einen eigenen Controller und beendet ihn beim Unmount.
  Integration muss diesen Besitz in einen langlebigen Recovery-Service verlagern. Schließen
  des Dialogs beendet weiterhin einen dort gestarteten manuellen Lauf; es darf keinen
  zweiten automatischen Controller erzeugen. Erfolgreicher Storage-Commit bleibt auch
  bei spätem Abbruch Erfolg. Bestehende Schutzaussagen des Collectors bleiben unverändert.
- Automatische Wartung läuft nur bei aktivierter, fehlerfreier lokaler Autosicherung.
  Ausschalten, Dispose, Kontextwechsel, verborgenes Dokument oder neue Benutzeraktivität
  verwirft den geplanten Timer bzw. signalisiert Abort für laufende Wartung. Automatische
  Wartung verändert weder Modell, Undo-History noch die Autosicherungspräferenz.
- Start nur ohne laufende Sicherung, Import/Wiederherstellung, Migration, manuelle Wartung
  oder aktive Zeichen-/Bearbeitungs-/Kamerageste. Autosicherung hat Vorrang: Wartung
  abbrechen, nicht die Sicherung wegen Wartung ablehnen. Sicherheitsprüfung und atomarer
  Root-Vergleich bleiben auch bei konkurrierenden Tabs zwingend.
- Ein laufender Aufruf bleibt bis zum Settlen belegt; Abort allein erlaubt keinen zweiten
  Aufruf. Ein später Callback aus altem Kontext darf keinen neuen Kontext reaktivieren.
  Tabübergreifende Deduplizierung ist nicht durch einen React-Singleton bewiesen; zunächst
  verhindert der Storage-Vertrag Datenverlust, eine globale Laufzeit-Sperre bleibt ein
  gesondert zu prüfender Adapterbedarf. Keine Parallelitätsgarantie über Prozesse behaupten.

**Pilotregeln für Auslösung und Wiederholung:**
1. Nach einem tatsächlich erfolgreich publizierten V2-Sicherungsstand Bedarf vormerken.
   Kein Bedarf aus Pointer-Preview, No-op-Save, fehlgeschlagenem Save oder bloßem Start.
   Ereignis nach publish/Commit liefern, nicht aus busy=false ableiten (auch Fehler/No-op).
   Für den ersten Pilot genügt dieses konservative Signal; es bedeutet mögliche verwaiste
   Daten, nicht nachgewiesene. Keine zusätzlichen Hash-/Bild-/Gesamtmodellscans pro Eingabe.
2. Ein vorgemerkter Bedarf darf nach 30 s ohne Eingabe und ohne aktive Operation starten,
   wenn seit dem letzten automatischen Versuch mindestens 5 min vergangen sind. Für den
   ersten Versuch gilt nur die Ruhephase. Eingaben setzen die Ruhephase neu. Kein Polling
   aller Projekte im Sekundentakt; ein injizierbarer Timer und zusammengefasster Bedarf.
3. Jeder automatische Start zählt für die 5-min-Sperre, auch Abbruch, Skip und Fehler.
   Maximal ein unterbrochener Versuch darf für denselben Bedarf nach neuer Ruhephase und
   Sperrfrist erneut starten. Danach erst ein neuer erfolgreicher V2-Commit oder bewusster
   manueller Auftrag. Somit kein unbegrenzter Abbruch-/Retry-Kreis ohne neue Arbeit.
4. success konsumiert den beim Start erfassten Bedarf. Neuere Bedarfsgeneration bleibt
   erhalten; ein alter Abschluss darf sie nicht löschen. changed-roots erlaubt höchstens
   denselben einen verzögerten Wiederholungsversuch. unreadable-roots/unreadable-legacy,
   Quota- und andere Storage-Fehler sperren weitere Automatik in dieser Sitzung bis zu
   einer erfolgreichen manuellen Wartung. Kein sofortiges Bereinigen als Quota-Rettung.
5. Manueller Auftrag bleibt verfügbar, ignoriert die automatische Zeit-Sperre, läuft aber
   niemals parallel. Er beendet/ersetzt einen Timer. Ist bereits ein Lauf aktiv, wird
   dessen Zustand gezeigt statt ein zweiter gestartet. Abbrechen gilt für diesen Lauf;
   manueller Abbruch startet keinen automatischen Wiederholungsversuch desselben Bedarfs.
6. Keine Erfolgs-Popups bei normalen Hintergrundläufen. Fehler/Skip verständlich im
   vorhandenen Recovery-Status darstellen; nicht als erfolgreiche Sicherung ausgeben.
   Abort ist kooperativ an vorhandenen Checkpoints, keine garantierte harte Millisekunden-
   Grenze. Grobe Heap-/Origin-Quota-Messungen sind keine automatischen Löschkriterien.

**Genau ein ausführbarer Folgeauftrag:**
Den frameworkfreien Application-Koordinator mit injiziertem Timer, Aktivitäts-/Busy-
Signalen, monotoner Bedarfsgeneration und bestehendem Storage-Port implementieren.
Noch keine UI-Aktivierung. Bestehenden manuellen Vertrag erhalten oder gezielt darauf
umstellen; keine DOM-Ereignisse im Application-Kern. Deterministische Tests: Commit vs.
No-op/Fehler, 30-s-Ruhe, 5-min-Sperre, Coalescing, aktive Geste, Save-Priorität, Dispose/
Kontextwechsel, verspäteter Erfolg, manueller Konkurrenzstart, begrenzter Retry, Fehler-
Sperre und erfolgreiche manuelle Entsperrung. Prüfen, dass alle Pfade denselben Port nutzen.

Nächste drei Schritte, nur Schritt 1 aktiv:
1. Gemeinsamen Koordinator gemäß obigem Vertrag implementieren und deterministisch testen.
2. Autosave-Commit-Ereignis und zentrale UI-Aktivität anbinden; manuellen Dialog als Consumer
   derselben Instanz betreiben. Automatik erst nach bestandenen Integrationstests aktivieren.
3. Browserabnahme mit Speichern, Bearbeiten, Abbruch und Mehrprojekt-Sicherungsvergleich;
   Stunden-/Quota-/Prozessmessungen als ausdrücklich offene Belastungsnachweise fortführen.

### AUD14-06 – Gemeinsamer Application-Koordinator (15.10.2026)

#357 nach erfolgreicher CI ausdrücklich freigegeben und in main übernommen.
maintenance-coordinator.ts implementiert den vereinbarten Pilotvertrag mit injizierter
Uhr/Timer, Aktivitäts-/Busy-Signalen, Kontext-Epoche und monotoner Bedarfsgeneration.
Bestehender createRecoveryMaintenance-Controller bleibt zuständig für Storage-Aufruf,
Abbruch und Meldungen. Manuelle und automatische Aufrufe des neuen Koordinators teilen
exakt diese Instanz; keine zweite Collector-Implementierung. Noch nicht in UI instanziiert.

30-s-Ruhephase, 5-min-Abstand, Coalescing, maximal zwei automatische Versuche je
Bedarfsgeneration; Storage-/unlesbare-Root-Fehler sperren bis manuellem Erfolg.
Aktive Sicherung/Geste (busy) verhindert Starts und bricht Wartung kooperativ ab.
Single-flight bleibt bis Promise-Abschluss erhalten. Kontextwechsel verwirft alten
Bedarf; verspäteter Erfolg konsumiert keine neuere Bedarfsgeneration. Expliziter
manueller Abbruch konsumiert vorgemerkten Bedarf. Kein automatischer Start aus Konstruktion.

Validierung: neun deterministische Koordinatortests, insgesamt 1077 Tests bestanden;
Typecheck, gezieltes ESLint, Build und diff --check bestanden. Keine Browserabnahme
behauptet: es gibt noch keinen UI-Consumer. committed() ist ausdrücklich nur für echte
V2-Publishes; No-op-/Fehlerfilter und reale Busy-/Aktivitätssignale sind Integrationsauftrag.
Keine tabübergreifende Laufzeit-Sperre oder neue Speichergrenzen implementiert.

Nächste drei Schritte, nur Schritt 1 aktiv:
1. Erfolgreiches V2-Publish-Signal sowie zentrale Aktivität/Busy-Zustände und manuellen
   Dialog an genau eine langlebige Koordinatorinstanz anbinden; Integrationstests für
   No-op/Fehler, Dialogwechsel und Save-Priorität. Automatik erst nach deren Bestehen aktivieren.
2. Automatische Ruhephase, Unterbrechung und Wiederanlauf im Browser praktisch abnehmen;
   Current/Previous und fremde Projekte vor/nach Wartung vergleichen.
3. Offene Stunden-/Quota-/Prozessmessungen gezielt ergänzen und Mehrtab-Verhalten prüfen;
   keine pauschale Leistungs- oder globale Parallelitätsgarantie aus den bisherigen Tests.

### AUD14-06 – Recovery-Service und UI-Anbindung (15.10.2026)

#358 nach erfolgreicher CI ausdrücklich freigegeben und in main übernommen.
createRecoverySession besitzt Autosave und Wartungskoordinator gemeinsam. Autosave
meldet nur nach erfolgreichem V2-Publish im gültigen Kontext Bedarf; No-op/Fehler nicht.
Fehler eines Wartungsbeobachters kann einen bereits committed Save nicht zurücknehmen.
Busy wird vor dem Save synchron an Wartung weitergegeben. Kontext/Opt-out verwerfen
alten Bedarf. Mehrere unabhängige Holds für Workspace, Recovery-Dialog und Input.

useLocalAutosave hält die Instanz über Dialogwechsel hinweg. RecoveryMaintenanceControls
ist nur Consumer; Schließen beendet nur einen gerade manuell gestarteten Lauf (closeManual),
nicht eine spätere automatische Wartung. Browseradapter erfasst Pointer/Keys/Wheel,
gehaltene Eingaben, Blur/Focus und Sichtbarkeit mit vollständigem Listener-Cleanup.
Workspace meldet Datei-/Bildimport, ausstehendes Öffnen, Bearbeitung und Gruppenbewegung.
Konservativer Pilot: auch jedes ausgewählte Nicht-Select-Werkzeug blockiert Automatik,
selbst wenn noch keine Geometrie gezeichnet wird. Kein je-Werkzeug-Collector.

Automatik jetzt bei aktiver fehlerfreier Autosicherung angebunden: 30 s Ruhe nach
V2-Save, fünf Minuten Mindestabstand, bestehende Retry-/Fehlersperren. Keine Änderung
an Modell/Undo, Datenformat oder Collector. Keine tabübergreifende Laufzeit-Sperre.

Validierung: sechs zusätzliche Tests (vier Service-Integration, Dialogbesitz,
Browser-Input-Lifecycle), insgesamt 1083/1083 bestanden; Typecheck, gezieltes ESLint,
Build und diff --check bestanden. Isolierter Browser-Dialog mit simuliertem Storage-Port
zeigt erfolgreichen manuellen Lauf. Keine echte automatische Datenbankwartung durch
Browserabnahme behauptet; Nutzerprojekt nicht für Tests verändert.

Nächste drei Schritte, nur Schritt 1 aktiv:
1. Automatischen 30-s-Ruheablauf mit echtem Recovery-Service/Storage in isolierter
   Browser-Testdatenbank prüfen: Eingabe/Save/Abbruch, neuer Versuch, alle Sicherungsinhalte.
2. Mehrtab-Konkurrenz, längere Sitzungen und Quota-/Prozessgrenzen gezielt prüfen;
   verbleibende Einschränkungen getrennt von gemessenen Produktfehlern dokumentieren.
3. Nach Abnahme Recovery-Etappe abschließen und nächsten priorisierten CAD-Auftrag
   aus dem Masterplan auswählen; große Speichererweiterung bleibt separat vorgemerkt.

### AUD14-06 – Automatischer Browserlauf mit echter Datenbank (15.10.2026)

#359 nach erfolgreicher CI ausdrücklich freigegeben und in main übernommen.
recovery-automatic.html/.ts nutzt createRecoverySession, produktiven Storage-Adapter,
echte Browser-Timer und eine eigene UUID-Testdatenbank. Drei Sicherungen des aktiven
Projekts plus fremdes Projekt, 1000 Linien und 1024x1024-Rauschbilder. Kein Nutzerprojekt.
Aktivitätssignal nach 3 s setzt Ruhephase zurück; nach weiteren 28 s noch kein Lauf.
Automatischer Start nach 30005 ms seit Aktivität. Lauf entfernt exakt einen verwaisten
Payload, erhält drei benötigte. Current/Previous/fremdes Projekt vollständig serialisiert
und gegen erwartete Inhalte verglichen. Danach neuer Save, manuell gestartete Wartung
mit programmatischer Aktivität nach 10 ms abgebrochen; alle Inhalte und Payloadanzahl
unverändert. Manueller Wiederanlauf erfolgreich, wieder genau drei geschützte Payloads.

Browser PASS nach 35,53 s. Ereignisfolge running/success, running/cancelled,
running/success dokumentiert in recovery-automatic-results.json. Typecheck, gezieltes
ESLint und Build bestanden. Produktionscode unverändert; Basis zuletzt 1083 Tests und CI grün.

Grenzen: Aktivität ist ein programmatisches Service-Signal, keine durchgespielte CAD-Geste.
Wiederanlauf nach Abort bewusst manuell; reale Fünf-Minuten-Wartezeit nicht durchlaufen,
weiterhin deterministische Testabdeckung. Kein Prozessneustart, Mehrtab-/Stunden-/Quota-
Volltest und keine Prozess-/GPU-Messung. Kein globaler Abschluss der Belastungsnachweise.

Nächste drei Schritte, nur Schritt 1 aktiv:
1. Zwei gleichzeitige Recovery-Sitzungen auf derselben isolierten Browserdatenbank prüfen:
   konkurrierender Save/Wartung, Root-Wechsel, unveränderte Current/Previous/Fremdprojekte.
2. Offene Stunden-/Quota-/Prozess-Nachweise nach Risiko eingrenzen und getrennt planen;
   nur tatsächlich gemessene Produktfehler beheben, keine pauschalen Leistungszusagen.
3. Nach dieser Abnahme den nächsten priorisierten CAD-Auftrag im Masterplan auswählen;
   größere Speichererweiterung bleibt gesondert vorgemerkt.

### AUD14-06 – Konkurrierende Recovery-Instanzen (15.10.2026)

#360 nach erfolgreicher CI ausdrücklich freigegeben und in main übernommen.
recovery-concurrent: zwei unabhängige Katalog-/Writerinstanzen und getrennte IndexedDB-
Verbindungen auf derselben isolierten UUID-Datenbank. Der produktive Collector wird
am injizierten Codec-restore gezielt mit einem erfolgreichen neuen Save verschachtelt.
Ergebnis: skipped/changed-roots, keine Löschung. Ein zuvor vorbereiteter veralteter Writer
wird abgewiesen, Siegerstand und Vorgänger bleiben identisch; fremdes Projekt ebenfalls.
Anschließend zwei produktive Wartungsadapter gleichzeitig: erster löscht einen verwaisten
Payload, zweiter null; beide erhalten drei benötigte. Vollständiger serializeProject-
Vergleich von Current/Previous/Fremdprojekt vor und nach Parallelwartung erfolgreich.
Browser PASS; Ergebnis recovery-concurrent-results.json. Typecheck, gezieltes ESLint,
Build bestanden. Keine Produktionsänderung; Basis zuletzt 1083 Tests/CI grün.

Grenzen: getrennte Instanzen/Verbindungen in einer Seite, kein echter zweiter Tab/Prozess.
Erzwungene Verschachtelung am Codec, keine Aussage über alle Timingkombinationen oder
Durchsatz. Sicherheitsmechanismus bewiesen für diesen Ablauf; globale Deduplizierung
nicht implementiert. Keine Nutzerdaten, Quota-Vollzustände oder Stundenmessungen.

Nächste drei Schritte, nur Schritt 1 aktiv:
1. Offene Recovery-Nachweise risikobasiert einordnen: echte Mehrtab-Lifecyclefälle,
   Stunden-/Quota-/Prozessmessungen mit klaren Abnahmekriterien und Release-Zuordnung;
   keine weitere Speichererweiterung allein wegen fehlender Extremmessungen beginnen.
2. Den aus dieser Einordnung tatsächlich nötigen begrenzten Prüf-/Fixauftrag abschließen.
3. Nächsten priorisierten CAD-Auftrag anhand des Masterplans auswählen und beginnen;
   offene Release-Belastungsprüfungen ausdrücklich weiterführen.

### AUD14-06 – Restnachweise und Release-Zuordnung (15.10.2026)

#361 nach grüner CI ausdrücklich freigegeben und in main übernommen. Dieser Auftrag ist
Dokumentation/Planung auf Basis des Codes und vorhandener Belege, keine neue Laufzeitmessung.
AUD14-06 ist funktional weitgehend umgesetzt, aber nicht pauschal vollständig abgenommen.
Keine neue Speichergrenze und kein erneuter Ausbau des vom Nutzer zurückgestellten Umfangs.

| Offener Nachweis | Risiko / bisheriger Beleg | Zeitpunkt und konkrete Abnahme |
| --- | --- | --- |
| Echter Zwei-Tab-Lifecycle | Root-Wechsel, veralteter Writer und parallele Collector-Verbindungen sind geprüft; getrennte Dokumente mit Fokus/Visibility/Schließen nicht. | Einziger unmittelbarer Folgeauftrag. Zwei Tabs derselben isolierten Origin/UUID-DB, konkurrierende Saves und Wartung, Hintergrundwechsel, Schließen einer Sitzung. Gewinner, gültiger Vorgänger und fremdes Projekt unverändert; Konflikt verständlich; kein Retry-Sturm. |
| Längere Sitzung | 162-s-Lastlauf und 30-s-Ruheablauf bestanden, keine Stundenbehauptung. | Vor Public Beta: reproduzierbarer mindestens zweistündiger Lauf als initiales Prüfprofil (Testvorgabe, keine Produktspezifikation), periodisch Bildwechsel/Undo/Save/Wartung/Reload. Kein Verlust geschützter Stände; Retention bleibt am erwarteten Root-Satz, Wiederherstellung am Ende vollständig vergleichbar. Wachstum separat dem Harness/History/Storage/Renderer zuordnen. |
| Tatsächliche Quota-Erschöpfung | Injizierte Quota-/Storage-Fehler und Fail-closed-Pfade vorhanden; echter Browser-Quota-Zustand fehlt. | Vor Public Beta nur in wegwerfbarem Testprofil bzw. kontrollierter Testumgebung, niemals Nutzer-Origin oder Systemdatenträger absichtlich füllen. Fehlender Platz darf keine bestehende gültige Sicherung überschreiben; Meldung, kein automatischer Retry-/Löschsturm, nach Freigabe von Testplatz manueller Wiederanlauf. Ist die Umgebung nicht verfügbar, bleibt Gate offen. |
| Prozess-/Raster-/GPU-Spitzen | Grobe JS-Heap-Werte und rechnerische Rasterpuffer sind keine Prozessmessungen. | Mit AUD14-07 auf dokumentierter Zielhardware vor Kapazitäts-/Leistungsfreigabe messen. Projektgröße, logische Pixel, Prozesszuordnung, Lade-/Bearbeitungs-/Wartungsphasen und Messwerkzeug angeben. Keine Produktgrenze allein aus optionaler performance.memory-API ableiten. |
| Tabübergreifende Laufzeit-Deduplizierung | Pro Instanz Single-flight, Storage-Transaktionen schützen Daten auch bei zwei Collectoren. Keine globale Sperre. | Kein Architekturumbau auf Verdacht. Erst beim Zwei-Tab-Test entscheiden, ob reproduzierte Ressourcen-/Lifecycleprobleme einen gemeinsamen Plattform-Lock erfordern. Sicherheitsregeln bleiben unabhängig davon zwingend. |

**Stop-/Fortsetzungsregel:** Reproduzierter Verlust einer gültigen Sicherung, falscher
Erfolg bei fehlgeschlagenem Commit oder unbegrenzter Wiederholungszyklus ist P0 und stoppt
die nächste Feature-Etappe bis zur Korrektur. Ein bloß fehlender Stunden-/Peaknachweis
blockiert keine unabhängige CAD-Implementierung; er blockiert die zugehörige Release- oder
Kapazitätszusage. Ein Merge ersetzt weder diese Nachweise noch fachliche Nutzerabnahme.
Vorhandene Format-/Raster-/Dateigrenzen bleiben unverändert.

**Genau ein ausführbarer Folgeauftrag:** Bestehenden Konkurrenzharness um zwei getrennte
Browserdokumente erweitern, mit derselben expliziten Testdatenbank und dem produktiven
Recovery-Service/Storage. Steuerung/Ergebnisabgleich testlokal; keine neue Produktions-
Kommunikation oder Sperre vorsorglich einführen. Gemeinsamen Konfliktfall reproduzierbar
synchronisieren. Sichtbarkeit/Fokus/Schließen gesondert von Datenbank-Race protokollieren.
Aktuellen/vorherigen/fremden Inhalt vollständig vergleichen, automatischen Retry begrenzen,
Abbruch und Listener-Lifecycle prüfen. Sicherheitsfehler im selben begrenzten Auftrag
beheben; andernfalls Nachweis dokumentieren und Recovery-Schleife beenden.

Nächste drei Schritte, nur Schritt 1 aktiv:
1. Echten Zwei-Tab-Lifecycle-Test gemäß obigem Auftrag ausführen.
2. AUD14-07 beginnen: aktuellen Schul-/Mehrgeschoss-Prüfbestand und noch offene große
   Anschlussgruppen-/Kamera-/Workspace-Kosten zusammenführen; einen repräsentativen,
   reproduzierbaren Gesamtprüflauf festlegen, fehlende BIM-Typen nicht vortäuschen.
3. Nach AUD14-07-Statusabgleich nächsten fachlichen CAD-Schritt auswählen; Release-Gates
   separat erhalten. Keine neue Feature-Reihenfolge erfinden oder alle Audit-IDs schließen.

### AUD14-06 – Zwei echte Tabs, abgegrenzter Nachweis (15.10.2026)

#362 nach grüner CI ausdrücklich freigegeben und in main übernommen.
recovery-two-tabs.html/.ts: zwei getrennte IAB-Tabs A/B, gemeinsame explizite Test-Run-ID,
eigene UUID-artig benannte Pilotdatenbank. Beide Writer auf demselben Ausgangsstand
vorbereitet. A speichert erfolgreich, B wird mit Recovery revision conflict abgewiesen.
B startet Wartung über produktiven Recovery-Service und Storage: ein verwaister Payload
entfernt, drei geschützt. Beide Tabs vergleichen Gewinner, gültigen Vorgänger und
fremdes Projekt vollständig. B danach geschlossen, A prüft erneut erfolgreich.
Ergebnis recovery-two-tabs-results.json; keine Nutzerprojekte verändert.
Typecheck, gezieltes ESLint und Build bestanden. Keine Produktionsänderung.

**Teilabnahme, keine vollständige Lifecycle-Freigabe:** Beide eingebetteten Tabs lieferten
nur visible=true. Hintergrund-/Fokuswechsel wurden nicht beobachtet und nicht künstlich
als echte Ereignisse ausgegeben. B wurde nach abgeschlossener Wartung geschlossen,
nicht mitten in einer Transaktion. Automatischer Retry in zwei Tabs nicht getestet.
Der Harness nutzt echte Writer für Saves und den gemeinsamen Service für manuelle
Wartung; der automatische Zeitpfad hat seinen separaten früheren Nachweis.
Listener-Abmeldung/Blur/Hidden bleiben bisher Unit-Test-Belege. Echte Fokuswechsel,
Schließen während aktiver Arbeit und Mehrtab-Automatik bleiben vor Public Beta in einer
geeigneten Browserumgebung zu prüfen. Kein beobachteter Sicherheitsfehler, kein Anlass
für einen vorsorglichen globalen Lock oder weiteren Speicherausbau.

Nächste drei Schritte, nur Schritt 1 aktiv:
1. AUD14-07 Bestand zusammenführen: Schul-/Mehrgeschoss-Fixtures und verbleibende
   Anschlussgruppen-/Kamera-/Workspace-Kosten prüfen und genau einen repräsentativen
   Gesamtprüflauf festlegen. Offene Recovery-Lifecycle-Gates ausdrücklich übernehmen.
2. Diesen Gesamtprüflauf ausführen und ausschließlich reproduzierte priorisierte Fehler
   beheben; Modell-/Commit-/Undo-/Speicherbelege zusammenhalten.
3. Nach Audit-Statusabgleich nächsten fachlichen CAD-Schritt bestimmen; Release-Gates
   zu Fokus/Tab-Abbruch, Langzeit/Quota/Prozessmessungen bleiben unabhängig offen.

### AUD14-07 – Bestandsabgleich und ausführbares Gesamtprüfprofil (15.10.2026)

Basis main bb5db2d nach ausdrücklich freigegebenem Merge von #363, GitHub check SUCCESS.
Offen ist außerdem #318 (feat/solid-z-movement); dieser Altzweig wird weder als aktuelle
Basis verwendet noch ohne eigenen Vergleich übernommen. Dieser Schritt ist ein Code- und
Nachweisabgleich, keine neue Leistungs- oder Browserabnahme. Maßgeblich für den nächsten
Auftrag ist dieser Abschnitt; die frühere Recovery-Folgeaufgabe ist abgeschlossen bzw.
mit ihren ausdrücklich offenen Lifecycle-Gates abgegrenzt.

| Wiederverwendbarer Bestand | Nachweis und konkrete Grenze |
| --- | --- |
| building-view-fixture/profile.ts | Fünf Geschosse mit getrennten Wänden/Fenstern, Geschosswechsel und gemeinsame Solid-Ableitung; kein schulähnlicher Anschlussgrundriss. |
| connection-group-fixture/profile.ts | Parametrisierte T-Gruppe, Fenster und fremde Wände; exakter Vergleich prepareEndpoint gegen editAtPointer. 51-Wand-Gruppe bisher Node-, nicht vollständiger Workspace-Nachweis. |
| translation-content.test.ts und selection-move-oracle.ts | XY-Vollpfadvergleich, Z-Kontextschutz, genau ein Undo, Datei-/Recovery-Roundtrip. Kleine Mehrgeschoss-Fixture ersetzt keinen Gebäudelasttest. |
| preview-block-browser.ts / Ergebnisse zu #342 | 502 Wände, fünf Geschosse, Pixel-/Projektvergleiche; keine vollständige React-/Eingabe-/Framezeit und kein schwerer Bildmix. |
| camera-frame.tsx | Reale BimSolidView und Matrix-/GL-Kontrolle, kleines Beispiel. Kein Nachweis großer Gebäude bei Kamerawechsel. |
| production-workspace.tsx/.config.ts | Echter CadWorkspace, isolierter Produktionsbuild auf Port 8085, Longtasks und optionale Phasentraces; geeigneter UI-Prüfträger, kein Ersatz durch vereinfachten Renderer. |
| Recovery-Harnesses bis #363 | Inhaltsschutz, CAS und Wartung belegt; Hintergrundwechsel, aktiver Tab-Abbruch, Mehrtab-Automatik, zwei Stunden, echte Quota und Prozess-/GPU-Spitzen weiterhin offen. |

**Genau ein ausführbarer Folgeauftrag: Gesamtprüfprofil S1 erstellen und ausführen.**
Ein deterministischer Generator mit manifestierten IDs erzeugt ein schulähnliches
synthetisches Modell aus tatsächlich unterstützten Typen. Keine neuen Produktfunktionen
oder separaten Modell-/Fangpfade. Vorhandene Fixtures/Orakel und echte Application-Aktionen
wiederverwenden; das Resultat muss validateProject bestehen. Kein Archicad-Import behaupten.

- Fünf Geschosse, jeweils 40 × 25 m Grundrissbereich (1.000 m² Prüfgrundfläche,
  keine berechnete Raum-/Wohnfläche), EG 0 m, Geschosshöhen 3 m.
- Je Geschoss 60 Wände, 40 Fenster, 10 geschlossene Schraffuren mit je 8 Punkten,
  100 Linien und ein Abbild; stabile globale IDs. Anschlussmanifest: je eine Ecke
  und eine zusammenhängende T-Gruppe aus Hauptwand und zehn Nebenwänden. Weitere
  Wände bleiben unabhängig. Öffnungen dürfen gemäß den bestehenden Regeln liegen.
- Genau dieselbe Geometrie in zwei Varianten: G ohne Rasterbilder, GB mit 20 echten,
  deterministisch erzeugten unterschiedlichen 1024×1024-PNGs (vier pro Geschoss).
  Logische Pixel, Payloadbytes und tatsächliche portable Dateigröße protokollieren;
  bestehende Datei-/Rasterlimits einhalten. Keine künstlichen Base64-Platzhalter.
- Die bereits vorhandene 51-Wand-Anschlussgruppe separat als Stresskontrolle ausführen,
  nicht unbemerkt in das 40 × 25-m-Profil pressen oder als Schulgrundriss bezeichnen.
  Ein zusätzliches bildschweres Grenzprofil und 500+ BIM-Wände bleiben spätere
  Kapazitätsprüfungen, falls S1 diese Last nicht erreicht. S1 ist kein Vollabschluss.

Ablauf pro Variante: Datei öffnen; alle fünf Geschosse und Abbilder wechseln; 3D mit
allen Geschossen anzeigen; eine T-Gruppe und eine geschossübergreifende Auswahl bewegen
(XY und Z); einen verbundenen Endpunkt ändern; jede Aktion einmal abbrechen und einmal
platzieren; Undo/Redo; Projekt speichern/neu öffnen; IFC exportieren; lokale Sicherung
und Wiederaufnahme in eigener Test-Origin prüfen. Kamera langsam und schnell orbitieren,
pannen und Ansicht einpassen; Ursprung/Fang mit Shift und ohne Shift vergleichen.
Keine Nutzerdatei oder Nutzer-Recovery-Datenbank überschreiben.

Nachweis getrennt erheben: (a) deterministische Modell-/Vorschau-/Commit-Vergleiche gegen
den bisherigen vollständigen Prüfpfad, einschließlich stationärer Nachbarn, gelöster
Anschlüsse und Fenster; (b) echter Workspace im Browser mit Eingaben, Screenshots und
Longtask-/Frame-Trace. Ein Callback-Mikrobenchmark allein genügt nicht. Pro Modellaktion
exakt ein Undo-Schritt, Abbruch unverändert, Rundreise vollständig inhaltlich gleich;
IFC-IDs, Geschosszuordnung, Wand-/Fensterzahlen und Höhen gegenüber dem Modell prüfen.
Externe Archicad-Abnahme bleibt separat beim Nutzer, frühere Abnahme nicht umdeuten.

Messprotokoll: Commit, Buildmodus, Betriebssystem, Browser, verfügbare CPU/RAM/GPU-Angaben,
Viewport/DPR, Manifest und Ergebnisdatei. Ein Kaltlauf nach neuem Dokument plus zehn warme
Wiederholungen, Rohwerte/Median/Maximum; bei so kleiner Stichprobe keine belastbare
p95-Zusage. Vorbereitung, Pointervorschau, Commit, Kamerawechsel, Laden/Speichern und
Export separat. Lange Tasks >50 ms markieren; keine 60-FPS- oder Hardwaregarantie daraus.
Optionales performance.memory ausdrücklich nur JS-Heap; fehlende Prozessmessung offen.

Sicherheits-/Geometrieabweichungen stoppen die Abnahme. Reproduzierbare Performancepausen
mit Phase und Szene priorisieren; nur einen nachgewiesenen Engpass im nächsten Fix ändern,
keinen Rendererwechsel oder vorsorglichen Architekturumbau. Aktuelle Restschuld AUD14-04
(weitere Wandketten, alte direkte move/x/y-Pfade, globale Planableitung) und AUD14-05
(große Gruppen, Kamerawechselvorbereitung) nicht wegen bestandener Kleinfälle schließen.
Am Ende AUD14-01 bis -07 einzeln auf Befund/Beleg/Restgrenze abgleichen.

Nächste drei Schritte, nur Schritt 1 aktiv:
1. S1-Generator und gemeinsamen Prüflauf gemäß obigem Vertrag umsetzen und ausführen.
2. Den daraus höchstpriorisierten reproduzierten Fehler beheben, falls vorhanden;
   andernfalls Audit-Abnahme mit offenen Release-/Kapazitätsgrenzen dokumentieren.
3. Nach diesem Statusabgleich genau einen nächsten fachlichen CAD-Schritt auswählen.
   Die zurückgestellte Speichererweiterung und Recovery-Release-Gates bleiben vorgemerkt.

### AUD14-07 – S1 erster kombinierter Nachweis, Restabnahme offen (15.10.2026)

#364 nach grüner CI ausdrücklich freigegeben gemergt; Basis main 2228770.
Nur Prüfcode/Prüfkonfiguration, Tests und Dokumentation geändert. Keine neue Produktlogik.
`s1-fixture.ts` erzeugt fünf Geschosse mit 300 Wänden, 200 Fenstern, 50 achteckigen
Schraffuren, 500 Linien und fünf Abbildern. Je Geschoss eine Ecke und zehn T-Anschlüsse.
G: 174.874 portable Bytes; GB: 63.016.967 Bytes mit 20 verschiedenen echten PNGs,
20.971.520 logische Pixel. Synthetische Stresstestgeometrie, kein fertiger Schulentwurf.

`s1-check.ts` / `s1.test.ts`: pro Variante zwei Auswahlfälle (11-Wand-T-Gruppe und zwei
Wände über EG/4. OG), je elf XY/Z-Vergleiche, insgesamt 44 Bewegungsfälle je Variante.
Vollpfad-XY und explizites vollständig validiertes Z-Erwartungsmodell stimmen mit Commit
überein. Vorschauflächen als exakte Multimenge verglichen (Patchkomposition ändert die
Reihenfolge), inklusive stationärer Nachbarn bei gelösten Anschlüssen. Ein Historyschritt,
Undo/Redo-Inhalt, unveränderte Basis nach verworfener Vorschau, verbundener Endpunkt,
portable Rundreise, Recovery-Codec-Rundreise und IFC-Rundreise/300 Wände/200 Fenster/
fünf Geschosse bestanden. Dies ersetzt keine externe IFC-Abnahme oder Pixelvergleich.
Zusätzliche 51-Wand-Gruppe mit 100 Fremdwänden erneut vollständig gegen Vollpfad geprüft:
Vorbereitung 14,009 ms, sieben Vorschauen 11,756–16,319 ms. Kein Browsergruppen-Nachweis.

Echter CadWorkspace im separaten Produktionsbuild auf Port8085: alle Geschosse in G/GB
gewechselt, alle fünf Abbilder in G geöffnet, Gesamtgebäude in 3D, Orbit/Pan/Einpassen
bedient. In GB Einzelwand per On-Demand-Präzision 0,2 m bei 90 Grad bewegt, Undo/Redo,
Datei gespeichert, über Dateidialog nach Prüfung übernommen, IFC exportiert. Lokalen
Snapshot tatsächlich geprüft/wiederaufgenommen und erneut gespeichert: vollständiger
serializeProject-Vergleich der beiden Downloads identisch, 20 Bilder erhalten,
Wandanfang (1; 5,2), zehn externe T-Anschlüsse wie vorgesehen gelöst. Vorhandene fremde
Testslots nicht gelöscht. Nutzeranwendung Port8080 unangetastet.

Umgebung: Windows, Ryzen 5 3600, ca. 16 GiB physischer RAM (17.128.132.608 Bytes),
RTX4070, Chrome155/IAB, Node24.19.0. Browser-Startviewport 1280×720 DPR1;
Browserwerkzeuge änderten die sichtbare Fläche später (Screenshot 1738×1266).
Deshalb kein kontrollierter Viewport-/Gerätevergleich. Keine Prozess-/GPU-Spitzenmessung.
Rohdaten: s1-node-results, s1-browser-g/gb-results, s1-workspace-g/gb-results,
s1-group-results und s1-ui-recovery-results (je .json im benchmarks-Verzeichnis).

| Browseraktion | G | GB | Aussage |
| --- | --- | --- | --- |
| XY T-Gruppe, warme Pointer Median / Maximum | 2,35 / 3,20 ms | 1,40 / 17,50 ms | Zehn warme Application-Proben, keine Framezeit; Reihenfolge/JIT/GC nicht kontrolliert. |
| XY T-Gruppe, warmer Commit Median / Maximum | 42,95 / 49,10 ms | 24,70 / 46,20 ms | Vollprüfung bleibt erhalten; kein Nachweis, dass Bilder beschleunigen. |
| Geschosswechsel, beobachtete lange Tasks | 90–118 ms | 120–206 ms | Je fünf Wechsel, zeitlich dem Klick zugeordnet; Ursache noch nicht phasenweise isoliert. |
| Frühe lange Tasks | bis 289 ms | bis 2024 ms | GB enthält PNG-Erzeugung im Harness; nicht als Dateiladezeit ausgeben. |

**Offene S1-Abnahme:** zehn wiederholte UI-Gesten je Fall, kontrollierter Kaltstart,
Maus/Shift-Vergleich der Gruppenbewegungen XY/Z und Endpunkt im realen Workspace,
GB-Abbild-/Kameratrace, vollständiger IFC-Höhen-/Containment-Nachweis und Browser-Neustart
mit Wiederaufnahme fehlen noch. Modellvergleich läuft synchron und serialisiert für
Gleichheitsbelege große Daten; seine Pausen gehören zum Harness. UI-Trace wurde vor diesem
Vergleich beendet. Kein Browserabsturz-/Lagbeleg aus diesem Testvergleich ableiten.
Statusanzeige des ursprünglichen Rohreports bleibt oben 'running'; `model.status=PASS`
ist der Abschlussbeleg. Harness zeigt künftig zusätzlich 'complete'.

Aktuelle Auditzuordnung (keine pauschale Erledigung): AUD14-01 gemeinsamer Budgetvertrag
fokussiert belegt; AUD14-02 gemeinsame Snapshots jetzt zusätzlich in S1 verglichen;
AUD14-03 Ressourcenteilbelege erhalten, S1-GPU-Gesamtabnahme offen; AUD14-04 Legacy-Pfade,
globale Ableitung und nun Wechselpausen offen; AUD14-05 große Gruppen/Kameravorbereitung
offen; AUD14-06 Inhaltsschutz zusätzlich über echte S1-Wiederaufnahme belegt, frühere
Release-Gates unverändert offen; AUD14-07 Gesamtgate offen. Zusätzlich zeigt der erste
Recovery-Prüfdialog nur 60 Wände/40 Fenster des Arbeitsgeschosses, der Übernahmedialog
korrekt 300/200: Darstellungsnachtrag P2, kein Datenverlust (vollständig verglichen).

Verifikation: 1084 Tests bestanden, Benchmark-Typecheck, gezieltes ESLint, regulärer
Build und isolierter Produktionsbuild bestanden. Sandbox-Teststart konnte Unterprozesse
nicht erzeugen; unveränderte Suite außerhalb der Sandbox erfolgreich. Keine Testausfälle
als Produktfehler interpretiert. Ein neuer S1-Regressionstest ist Teil von `npm test`.

Nächste drei Schritte, nur Schritt 1 aktiv:
1. Geschoss-/Abbildwechsel in S1 phasenweise instrumentieren (Application, Ableitung,
   React/DOM und Bilddarstellung), wiederholt mit festem Viewport messen. Genau den
   dominanten reproduzierten Pfad korrigieren, sofern isoliert; sonst Diagnose begrenzen.
2. Danach offene S1-UI-/Shift-/Kaltstart-/IFC-Höhenprüfungen abschließen und den kleinen
   Recovery-Anzeigebefund korrigieren. Große Gruppen bleiben gesondert messpflichtig.
3. Auditstatus erneut abgleichen und nächsten fachlichen CAD-Auftrag auswählen;
   Speichererweiterung zurückgestellt, Langzeit-/Quota-/Mehrtab-Release-Gates offen.

### AUD14-07 – Geschosswechsel: geprüfte Basis weiterverwenden (15.10.2026)
PR #365 nach grüner CI gemergt, Basis 694fd2f. Bounded Fix an der gemeinsamen
Snapshot-/Sichtbarkeitsschicht, keine neue Renderer- oder Werkzeugsonderlogik.

Vorher erzeugt selectWorkingStorey aus einem Spread eine neue Vollvalidierung/Kopie;
createLayerVisibilityPolicy validiert anschließend erneut. Explizite Profiltransforms
nur im Diagnosebuild erfassen validateProject, Snapshot und Geschossaktion zusätzlich
zu vorhandenen Plan-/Fangindex-/Komponenten-Aufrufen. Produktionsbuild ohne Diagnose
enthält diese Instrumentierung nicht.

snapshotWithWorkingStorey erlaubt ausschließlich den geprüften Wechsel der Geschoss-ID
auf einer privat registrierten, unveränderlichen Basis. Unbekannte oder höhenmäßig nicht
aufgelöste Geschosse werden abgewiesen; fremde/mutable Quellen werden zuerst vollständig
validiert und kopiert. Kein generisches Patch-/Trust-Flag. Neue Kontextidentität erhält
Stale-Schutz, Bauteile bleiben identisch geteilt. Sichtbarkeit nutzt dieselbe Factory,
prüft ihre eigenen Layer-/Scope-Daten weiterhin und bleibt an den aktuellen Kontext
gebunden. Modelländerung/Commit/Datei-/Recovery-Validierung unverändert.

Kontrollierter Vergleich: S1 G, Produktions-Diagnosebuild Port8085, 1280×720 DPR1,
20 echte Navigator-Klicks (10× OG/EG), vorher/nachher jeweils frische Seite, gleiche
Fixture und Browserumgebung wie zuvor. Nutzer-Port8080 unverändert. Rohdaten:
benchmarks/storey-switch-before.json und storey-switch-after.json. Auswertungsfenster:
erster Geschossklick bis letzter Geschossklick +180 ms. Zeiten sind inklusive verschachtelter
Aufrufe und dürfen nicht summiert werden; Komponentenzeiten sind keine React-/DOM-Gesamtzeit.

| Phase über 20 Wechsel | Vorher | Nachher |
| --- | --- | --- |
| Vollvalidierung Anzahl / Summe | 40 / 533,4 ms | 1 / 14,8 ms |
| working-storey Reducer Summe / Maximum | 286,0 / 18,4 ms | 17,1 / 16,5 ms |
| Grundrissableitung Summe | 25,3 ms | 20,3 ms |
| Lange Tasks Anzahl / Summe / Maximum | 19 / 1198 / 75 ms | 3 / 181 / 77 ms |

Einmalige Besitzübernahme beim ersten Wechsel bleibt absichtlich erhalten. Die lange
Maximum-Spitze ist nicht behoben; kein Beleg für durchgehend flüssige Frames. Fangindex
wird weiterhin pro Wechsel aufgebaut (20 Aufrufe, Median ca. 3,1 ms nachher). Rendering,
DOM, GC, Bildvariante und Abbild-Performance noch nicht vollständig separat isoliert.
Zehn zusätzliche Abbildöffnungen OG/EG per Doppelklick funktional ausgeführt; diese
gehören nicht zum zeitlich abgeschlossenen Geschossvergleich. Viewportoverride danach
zurückgesetzt. Screenshot outputs/s1-switch-after.png.

1086 Tests bestanden: neue Regressionen für Inhaltgleichheit zum vollständigen Prüfpfad,
Identitätsteilung, Stale-Kontext, mutable Quellen, gefälschte eingefrorene Kopien und
ungültige Eingaben. Bestehende Undo/Redo-/IFC-/S1-Tests weiterhin grün. Typecheck inkl.
Benchmarks, gezieltes ESLint, regulärer und isolierter Diagnosebuild bestanden. Initialer
Teststart fand einen doppelten Import im ergänzten Test; korrigiert, volle Suite grün.

Nächste drei Schritte, nur Schritt 1 aktiv:
1. **Unmittelbar:** S1 GB und Abbildwechsel mit denselben Phasen nachprüfen, verbleibende
   lange Tasks eingrenzen; keine weiteren Optimierungen ohne Nachweis.
2. Offene S1-Gruppen-/Shift-UI-Abnahme und IFC-Höhen-/Containment-Nachweis abschließen.
3. Recovery-Zusammenfassung für alle Geschosse korrigieren und Audit-/Folgeauftrag abgleichen.
Langzeit/Quota/Mehrtab und Gesamt-GPU-Gates bleiben offen; Speichererweiterung zurückgestellt.

### AUD14-07 – S1 GB und Abbildwechsel nach #366 (15.10.2026)
PR #366 nach erfolgreicher GitHub-CI ausdrücklich freigegeben und gemergt: 67518da.
Dieser Folgeauftrag ändert ausschließlich Diagnoseharness und Prüfnachweise, keine
Produktlogik. Das Harness kann den Messbereich nach Initialisierung neu starten und
zeichnet nun auch die echten Doppelklicks auf Navigator-Treeitems auf.

Isolierter instrumentierter Produktionsbuild auf Port8085, fest 1280×720 DPR1, gleiche
S1-Fixture: G ohne Bilder; GB mit 20 PNGs, rund 63 MB portable Daten. Autosicherung vor
Messbeginn als aktuell abgewartet. Keine Recovery-Daten gelöscht oder manuell übernommen;
Nutzeranwendung Port8080 bleibt unberührt. Initiale Bildgenerierung ist nicht Teil der
Messung. Viewportoverride anschließend zurückgesetzt.

| Sequenz (je 20 Wechsel OG/EG) | Vollprüfungen | Geschoss-Reducer Summe | Lange Tasks |
| --- | --- | --- | --- |
| GB Geschosse, erster Wechsel inklusive | 1 / 25,6 ms | 26,7 ms | 11, Maximum 149 ms |
| GB Abbilder, bereits warme Basis/Bilder | 0 | 0,3 ms | 20, 54–76 ms |
| G Abbilder, erste Öffnung inklusive | 2 / 48,1 ms | 27,2 ms | 3, Maximum 106 ms |

Rohdaten: benchmarks/storey-switch-gb.json, document-switch-gb.json und
 document-switch-g.json. Auswertung innerhalb measurementStart/measurementEnd.
20 working-storey-Reducerereignisse je Sequenz, 20 dblclick-Ereignisse je Abbildsequenz.
G erster Abbildwechsel validiert zweimal: vorbereitender selectWorkingStorey-Aufruf
in CadWorkspace verwirft sein Ergebnis, danach Reducer. Weitere Wechsel nutzen die
registrierte Basis; kein dauerhaft wiederkehrender Vollprüfungsfehler.

GB Geschosse: 80 image-url-total-Aufrufe zusammen 14,6 ms, vier erstmalige atob-Aufrufe
zusammen 14,3 ms. GB warme Abbilder: 80 URL-Aufrufe zusammen unter Messauflösung, kein
atob und keine Vollvalidierung. Bilddekodierung, SVG/DOM-Reconciliation, Layout/Paint
und GPU-Zeit werden durch diese Funktionswrapper NICHT gemessen. Die verbleibenden
Abbildpausen dürfen deshalb weder als erneutes Base64-Problem noch als nachgewiesener
Rendererfehler ausgegeben werden. Fangvorbereitung bleibt pro Wechsel vorhanden:
GB Abbilder projectSnapPrimitives 107,6 ms gesamt und Indexbau 79,8 ms gesamt; diese
Teilzeiten erklären die gesamten 20 langen Tasks nicht allein. Verschachtelte Phasen
nicht addieren. G/GB unterscheiden sich im Warmzustand und sichtbarer Geometrieausdehnung;
kein kausaler Benchmark allein durch Subtraktion.

Erster Abbildmessversuch wurde vom aufgeklappten Diagnosepanel verdeckt (0 Wechsel),
verworfen. Zweiter Versuch mit Inspektionspause enthielt Hintergrundarbeit und wurde
nicht als endgültiger Report verwendet. Endgültige 20 Doppelklicks wurden kontinuierlich
mit geschlossenem Diagnosepanel ausgeführt; abschließend Abbild-EG ausgewählt und
Abbildmaßstab sichtbar. Screenshot outputs/s1-gb-views.png zeigt die erfolgreiche
Abbildöffnung aus dem funktionalen Vorlauf, nicht die Zeitmessung selbst.

Verifikation: Benchmark-Typecheck, gezieltes ESLint und isolierter Produktions-
Diagnosebuild bestanden; #366 CI bestätigt 1086 Tests und regulären Build. Vollsuite
in diesem reinen Harness-/Nachweisauftrag nicht erneut ausgeführt. Keine neue Aussage
zur vollständigen S1-/GPU-/Langzeitabnahme.

Nächste drei Schritte, nur Schritt 1 aktiv:
1. **Unmittelbar:** verbleibende bildbezogene Abbildwechselpausen auf DOM-/Bilddarstellung
   eingrenzen; erst nach isolierter Ursache ein begrenzter Fix, kein Rendererwechsel.
2. S1-Gruppen-/Shift-UI-Abnahme und IFC-Höhen-/Containment-Nachweis abschließen.
3. Recovery-Zusammenfassung für alle Geschosse korrigieren und Auditfolge abgleichen.
Speichererweiterung bleibt zurückgestellt; Langzeit/Quota/Mehrtab-Gates bleiben offen.

### AUD14-07 – DOM-Zuweisung und Bild-Gegenversuche (15.10.2026)
#367 nach grüner CI gemergt, Basis e0f90ae. Nur Diagnoseharness erweitert; keine
Produktlogik und keine Datei-/Speicherformate verändert.

S1 GB, 1280×720 DPR1, jeweils frische Seite, OG/EG vorgewärmt, Autosicherung aktuell,
danach 20 kontinuierliche Abbildwechsel bei geschlossenem Diagnosepanel. Port8085;
Nutzer-Port8080 unberührt. Native Element.setAttribute-Zeit nur für SVG image href
im isolierten Harness gemessen; nur Dauer und Zeichenanzahl, keine Bildpayloads im Log.
Keine Messung von späterem Browser-Decoding oder GPU-Arbeit durch diesen Wrapper.

| Kontrollversuch | Lange Tasks | Spannweite | 80 native href-Zuweisungen zusammen |
| --- | --- | --- | --- |
| Produktions-Data-URLs, sichtbar | 20 | 51–82 ms | 8,6 ms |
| Identische Bildbytes als temporäre Blob-URLs | 13 | 50–69 ms | 3,7 ms |
| Data-URLs, SVG-Bilder per display:none | 15 | 50–68 ms | 10,0 ms |

Rohdaten benchmarks/image-dom-switch.json, image-blob-switch.json und
image-hidden-switch.json. Baseline vor Ergänzung der Variantenmetadaten erstellt:
fehlende imageUrls/imagePaint entsprechen dort Produktions-Data-URLs/sichtbar.
Keine erneute Vollvalidierung/atob in den warmen Messbereichen. Gemeinsame
Fangvorbereitung ungefähr 118–122 ms über 20 Wechsel, BimPlan-Funktionsaufrufe
157–160 ms inklusive dieser Vorbereitung. Teilzeiten sind verschachtelt.

Die warmen Blob-URLs entstehen ausschließlich im Diagnoseharness aus denselben Bytes.
Der Test hält sie für die Messung und widerruft sie beim pagehide. Das ist bewusst kein
produktionsfähiger Ressourcenmanager und kein Vorbild für neue Produkt-Consumer.
PNG-Erzeugung/erstmalige Blob-Erstellung nicht als Wechselzeit ausgegeben. Hidden-Modus
behält Modell, IDs, DOM-Bildknoten und Attribute, unterdrückt nur deren Darstellung;
Browser-Decoding ist dadurch nicht garantiert abgeschaltet.

Schluss: native href-Zuweisung allein erklärt die Pausen nicht. Kurze URLs und fehlende
Bildflächen beseitigen sie ebenfalls nicht. Die beobachteten Unterschiede sind keine
kausal isolierte CPU-/GPU-Zuschreibung (Laufreihenfolge, GC und Werkzeuginteraktion
nicht kontrolliert). Bisherige Bezeichnung 'bildbezogen' ist eine Korrelation zwischen
G/GB, kein Nachweis eines Bildrendererfehlers. Deshalb kein Blob-Cache-/Rendererumbau
auf Verdacht. Weiter offen: React-Commit/DOM, Layout/Paint, Browserarbeit und Einfluss
der UI-Teststeuerung. Diese müssen in einer echten Hauptthread-Aufzeichnung zugeordnet
werden, statt weitere unverbundene Cache-Optimierungen vorzunehmen.

Verifikation: drei Serien mit je 20 echten Doppelklicks und working-storey-Ereignissen;
Typecheck inkl. Benchmarks, gezieltes ESLint und Produktions-Diagnosebuild bestanden.
#367 CI erfolgreich; Vollsuite in diesem reinen Diagnoseauftrag nicht erneut lokal
laufen lassen. Screenshot outputs/s1-blob-proof.png zeigt die weiterhin sichtbaren
Referenzbilder des Blob-Gegenversuchs. Viewportoverride zurückgesetzt.

Nächste drei Schritte, nur Schritt 1 aktiv:
1. **Unmittelbar:** Browser-Hauptthread-Aufzeichnung für einen warmen Abbildwechsel
   mit Skript-/Commit-/Layout-Zuordnung und Messwerkzeugkontrolle; erst dann Produktfix.
2. S1-Gruppen-/Shift-UI-Abnahme und IFC-Höhen-/Containment-Nachweis abschließen.
3. Recovery-Zusammenfassung für alle Geschosse korrigieren und Auditfolge abgleichen.
Langzeit/Quota/Mehrtab/GPU-Gates und zurückgestellte Speichererweiterung bleiben erhalten.

### AUD14-07 – Browser-Frame-Zuordnung, begrenzter Diagnoseabschluss (15.10.2026)
#368 nach grüner CI auf 3894c53 gemergt. Diagnoseharness erfasst zusätzlich Long Animation
Frames mit Browser-Skriptzuordnung, erzwungener Layoutzeit und Renderstart. Unterstützungs-
flag wird mitgespeichert; fehlende API darf nicht als null Aufwand interpretiert werden.
Observer wird beim Messneustart geleert und beim Abschluss beendet. CadWorkspace selbst
ist zusätzlich im expliziten Profilbuild als Funktionsphase instrumentiert.

S1 GB, warme OG/EG-Abbilder, aktueller Autosicherungsstand, je 20 kontinuierliche
Doppelklicks, 1280×720 DPR1, Data-URLs/sichtbare Bilder. Test-Port8085; Nutzer-Port8080
unverändert. Rohdaten image-frame-attribution.json und view-workspace-attribution.json.
Erster Lauf: fünf lange Tasks und 13 lange Frames. Browser ordnet deren Skripte dem
DIV#root.ondblclick-Ereignis zu (39,6–60,6 ms), erzwungenes Layout 1,5–2,6 ms je erfasstem
Skript. Zweiter Lauf mit zusätzlichem Workspace-Wrapper: keine langen Tasks, zwei lange
Frames (50,4/51,3 ms), Skripte 41,7/44,0 ms und Layout 1,5/1,8 ms. Kein Produktfix zwischen
den Läufen. Arbeitslast/JIT/GC und Instrumentierungseinfluss nicht kontrolliert.

CadWorkspace-Aufrufe im zweiten Lauf insgesamt 12,9 ms (40 Aufrufe, max.0,7 ms);
BimPlan 122,7 ms inklusive Fangvorbereitung94,8 ms; PlanSceneContent7,7 ms und native
Bild-href-Zuweisung7,6 ms insgesamt. Diese Funktionswrapper erfassen nicht den gesamten
React-Baum und Commit. Keine wiederholte Vollvalidierung im Messbereich.

Ergebnis: Hinweise auf JavaScript im synchronen Öffnungsereignis, keine dominante
Layout- oder belegte Bild-URL-Ursache. Long Animation Frames sind KEIN vollständiger
CPU-Sampling-Trace und liefern keinen inneren Callstack des React-Ereignisses. Der
Messwerkzeugeinfluss ist damit nicht ausgeschlossen; der Snapshot-Fix bleibt bestätigt,
der wechselhafte Restbefund bleibt ausdrücklich offen. Für weitere Optimierung ist bei
Reproduktion eine CPU-Aufzeichnung inkl. React-Commit und Gegenprobe ohne laufende
Automationsabfragen erforderlich. Kein Produktfix und keine Freigabe als lagfrei.

Diese begrenzte Diagnoseetappe wird beendet: kein weiterer Cache-/Rendererumbau auf
Verdacht. Weiteres Sampling als offener P2-Nachweis, statt fortlaufend neue Harness-
Varianten zur vermeintlichen Behebung zu erklären. Die ausstehende S1-Funktionsabnahme
hat nun Vorrang. Langzeit/Quota/Mehrtab/GPU-Gates bleiben erhalten.

Verifikation: Benchmark-Typecheck, fokussiertes ESLint und isolierter Produktions-
Diagnosebuild bestanden; #368 CI grün. Keine Produktänderung, Vollsuite lokal nicht erneut
ausgeführt. Screenshot outputs/s1-attribution.png; Viewportoverride zurückgesetzt.

Nächste drei Schritte, nur Schritt 1 aktiv:
1. **Unmittelbar:** S1-Gruppenbewegungen XY/Z mit und ohne Shift im echten Workspace
   vergleichen; Anschlüsse, Fenster und genau einen Undo-Schritt praktisch prüfen.
2. IFC-Höhen/Containment für mehrere Geschosse nachweisen.
3. Recovery-Zusammenfassung für alle Geschosse korrigieren und offene Audit-Gates abgleichen.

### AUD14-07 – Praktische Gruppenprüfung: XY-Teilnachweis, Z-Anbindung fehlt (15.10.2026)
#369 nach erfolgreicher CI in main übernommen (55bf7a9). Der wechselhafte Performance-
Restbefund beim Abbildwechsel wird NICHT geschlossen. Vor Gesamtfreigabe erneut kontrolliert
reproduzieren und bei Auftreten per CPU-Sampling einschließlich Commit untersuchen; ein
unauffälliger Einzellauf oder die Funktionsprüfung ist kein Behebungsnachweis.

Isolierter Produktions-Workspace Port8085, S1 G mit fünf Geschossen, 300 Wänden und
200 Fenstern; Nutzerprojekt Port8080 unberührt. Beleg benchmarks/s1-group-ui-evidence.json.
- 2D: s0-w0/w1 auswählen, Ursprung klicken, 90 Grad und 0,2 m eingeben, Enter.
- 3D: s4-w0/w1 per Klick/Strg-Klick wählen, Ursprung klicken, X wählen, 0,2 m, Enter.
- Jeweils genau zwei Wände versetzt, interner T-Anschluss bleibt, neun externe T-Anschlüsse
  gelöst. Fenster behalten Host/Relativwerte; alle übrigen Elemente unverändert. Vollständige
  exportierte Projekte gegen erwartete Änderungen verglichen (Koordinatentoleranz 1e-12).
- Je ein Undo leert die History und stellt das Modell wieder her; 2D sogar vollständiges
  JSON identisch. 3D-Arbeitsgeschoss durch Auswahl geändert, deshalb Undo-Vergleich aller
  Geschossdaten; 3D-Redo liefert wieder exakt das vorher exportierte Projekt.

Wichtiger neuer Abnahmebefund: Z bleibt in MovementAxisControls.tsx ausdrücklich disabled,
MovementOriginAxes zeigt nur Orientierung. prepareZTranslation hat keinen produktiven
UI-Aufrufer (nur Tests/Benchmark). Eine Modellprüfung der Höhenaktion ist daher keine
praktische Z-Abnahme. Screenshot outputs/s1-group-z-blocked.png. Nicht einfach den Button
entsperren: eigene Z-Interaktion über gemeinsame Runtime, vorbereitete Geometrie und
validierten Commit anschließen; keine horizontale Winkelumrechnung für Z verwenden.

Nicht geprüft: kontinuierliche Mausbewegung mit gehaltener Shift-Taste, GB-Gruppengesten,
Vorschau-Framevergleich und Z im Workspace. Die verfügbare Browsersteuerung liefert hier
keine dokumentierte Kombination aus gehaltener Shift-Taste und fortlaufender Mausbewegung;
numerische Eingabe darf diesen Nachweis nicht ersetzen. S1 bleibt teilweise offen.
Keine Produktänderung; kein erneuter lokaler Vollsuite-/Build-Lauf für diesen Prüfbericht.

Nächste drei Schritte, nur Schritt 1 aktiv:
1. **Unmittelbar:** Z-Gruppenbewegung an bestehende gemeinsame 3D-Interaktion anbinden;
   numerische Eingabe, Vorschau, Platzieren/Abbruch, Fenster/Anschlüsse und ein Undo prüfen.
2. Verbleibende S1-Maus-/Shift-Gruppenabnahme und IFC-Höhen/Containment abschließen.
3. Recovery-Zusammenfassung aller Geschosse korrigieren und offene Performance-/Release-
   Nachweise abgleichen. Speichererweiterung bleibt wie vereinbart zurückgestellt.

### AUD14-07 – Z-Aktion im gemeinsamen 3D-Ablauf (15.10.2026)
#370 mit erfolgreicher CI nach main übernommen (a097d4b). Die vorhandene vorbereitete
Z-Aktion ist jetzt über selectionZInteraction in useSelectionMove/useToolInteraction
angebunden. Für einzelne Wände und Wandgruppen: Ursprung auswählen, Z wählen, Mausziel
anklicken oder signierten Versatz eingeben. Fenster bleiben bei ihrer Wand, Geschoss-ID
bleibt erhalten, interne Anschlüsse bleiben und externe lösen sich beim Platzieren.

ToolInteraction beschreibt die räumliche Achse; axisTarget übersetzt orthografische
CSS-Mauskoordinaten in signierten Achsabstand. Keine BIM-Mutation im Renderer. Der
bestehende Geometriepatch-Pfad übernimmt die Vorschau. Ein vollständiger Commit am Ende,
ein Undo; Escape/Abbrechen ändern kein Modell. Achsenwechsel setzt den Eingabekontext
zurück und verhindert die Wiederverwendung eines XY-Mausziels als Z-Ziel. Die gemeinsame
Hilfseingabe zeigt für Z nur einen signierten Abstand. X/Y bleiben über dieselbe Leiste
verfügbar. Nicht unterstützte Auswahlen bekommen weiterhin keinen aktiven Z-Button.

Die beim Vorbereiten geprüfte Auswahlberechtigung wird nicht erneut über alle Bauteile
pro Z-Pointerprobe gesucht. Referenzidentität von Modell, Auswahl und Sichtbarkeit bleibt
geprüft; vollständige Materialisierung/Validierung bleibt an der Commit-Grenze. Messung
benchmarks/z-input-pointer-evidence.json: 1000 Node-Geometrieproben S1 G, p95 0,0169 ms,
maximal 0,0746 ms, Vorbereitung inkl. XY-Session rund 60,6 ms. Dies misst NICHT Browser-
Frames, Rendering oder Commit. Die vorhandene Geometriekomposition durchläuft weiterhin
Basisflächen; keine Behauptung global konstanter Renderkosten oder einer Lag-Behebung.

Verifikation: 1088 Tests bestanden, Benchmark-Typecheck, fokussiertes ESLint, Produktions-
und Diagnosebuild bestanden. Neue Tests vergleichen Z-Adapter-Vorschau mit vollständiger
Geometrie samt Fenstern/Anschlüssen/Undo und prüfen Achsprojektion bei Kamera/Zoom/DPR.
Browser Port8085: Einzelwand +0,5 m, s4-w0/w1 zusammen -0,5 m, komplettes exportiertes
Projekt gegen erwartete Änderung gleich; ein Undo stellt alle Geschosse wieder her.
Mausplatzierung mit Shift beim Klick, Rückwechsel Z→X (Winkel 0), Abbruch ohne History-
Eintrag geprüft. Beleg benchmarks/z-ui-acceptance.json; Screenshot outputs/z-ui-preview.png.
Nutzer-Port8080 nicht für Testdaten verändert. Temporäre Viewportgröße zurückgesetzt.

Begrenzung: nur Wände mit mitgeführten Fenstern; Z bleibt explizit gewählt und dadurch
unabhängig von Shift fest. Z-Raster nutzt die gemeinsame Schrittweite. Allgemeiner Fang
auf fremde Höhenreferenzen folgt separat. Bei Blick entlang Z ist keine eindeutige
Mausprojektion möglich, numerische Eingabe bleibt nutzbar. Keine automatische 3D-Allachsen-
Wahl. Kontinuierliche Shift-Mausbewegung, GB-Gruppentest und Abbildwechsel-Restbefund bleiben
offen; Shift-Klick ist KEIN kontinuierlicher Shift-Test. Release-Gates unverändert offen.

Nächste drei Schritte, nur Schritt 1 aktiv:
1. **Unmittelbar:** S1-Gruppen-/Shift-Abnahme einschließlich GB und Vorschauvergleich vervollständigen.
2. IFC-Höhen und Geschosszuordnung für mehrere Geschosse nachweisen.
3. Recovery-Zusammenfassung aller Geschosse korrigieren und offene Performance-/Release-
   Nachweise abgleichen. Keine Freigabe als lagfrei; Speichererweiterung bleibt zurückgestellt.

### AUD14-07 – GB-Teilabnahme und unterbrochene Testumgebung (15.10.2026)
PR #371 nach erfolgreicher CI mit Nutzerfreigabe nach main übernommen (2d450e3).
Im isolierten Produktions-Workspace (8085, variant=GB, unveränderte production-data-
Bildreferenzen) wurden s0-w0/w1 in 2D um 0,2 m in Y und s4-w0/w1 in 3D um 0,5 m
in Z numerisch platziert. Der komplette JSON-Export stimmt mit der erwarteten Änderung
überein (XY Rundung 1e-10, Z exakt). Interner T-Anschluss erhalten, neun externe gelöst;
Fenster und alle 20 Bildassets unverändert. Ein Undo stellt in 2D das ganze Projekt und
in 3D alle Geschossdaten exakt wieder her; Undo danach leer. Bildreferenzen sind im
Grundriss sichtbar, werden in 3D nicht gerendert. Kein 3D-Bildrenderlast-Nachweis.
Beleg: benchmarks/s1-gb-movement-ui-evidence.json, outputs/s1-gb-z-preview.png.

Die Testumgebung wurde anschließend unterbrochen. Windows WER protokolliert codex.exe
BEX64 sowie Codex MoAppHang; beide Webserver und der Prüfprozess waren danach beendet.
Kein nachgewiesener NOVIKOV-Geometrieabsturz, Auslöser unbekannt. Port8080 neu gestartet,
HTTP200 geprüft. Der unabhängige Node-Vergleich kompletter Vorschauflächen wurde
unterbrochen und wird NICHT als bestanden gewertet. Kein erneuter schwerer Lauf ohne
isolierte, begrenzte Ausgabe; ein Cross-Realm-Assert hatte zuvor unnötig große synthetische
Bilddaten in die Testausgabe geschrieben. Ein kausaler Zusammenhang ist nicht belegt.

Kontinuierliches Shift-Halten mit Mausbewegung bleibt wegen der verfügbaren Browser-
Steuerung ungetestet. Shift-Klick ersetzt dies nicht. Z wird ausdrücklich über Z aktiviert
und bleibt auch ohne Shift achsgebunden; Shift allein wählt Z nicht automatisch.
Keine Produktänderung; #371 CI grün. Für diese Dokumentationsänderung keine erneute
Vollsuite/Build. Abbildwechsel-Restbefund und Release-Gates weiterhin offen.

Nächste drei Schritte, nur Schritt 1 aktiv:
1. **Unmittelbar:** Restliche S1-Abnahme: kontinuierlicher Shift-Maustest und isolierter
   Vorschauvergleich ohne große Bilddaten-Ausgabe. Kein Abschluss als lagfrei.
2. IFC-Höhen und Geschosszuordnung für mehrere Geschosse nachweisen.
3. Recovery-Zusammenfassung aller Geschosse und offene Performance-/Release-Gates prüfen.


### AUD14-07 – Isolierter Vorschauvergleich abgeschlossen (15.10.2026)
#372 nach erfolgreicher CI und ausdrücklicher Freigabe gemergt (c17c0c6).
benchmarks/s1-export-preview-check.ts vergleicht die zuvor im echten S1-GB-Workspace
exportierten Projekte: Baseline, XY (+0,2 m Y für s0-w0/w1), Z (+0,5 m für s4-w0/w1).
Normale Projektimportgrenze, unveränderte 20 Bildassets; begrenzter Node-Heap (768 MiB),
Ausgabe ausschließlich Anzahl/Prüfsumme. Keine großen Objekt-/Bilddaten-Diffs mehr.

Ergebnis: XY und Z jeweils 7050 Vorschauflächen gleich dem vollständigen Solidaufbau
des tatsächlich exportierten Projekts. Flächenreihenfolge neutralisiert, numerische
Koordinaten auf 1e-10 gerundet. Beleg benchmarks/s1-export-preview-evidence.json.
Dies prüft die abgeleitete Geometrie, nicht GPU-Pixel, Interaktionslatenz oder Framezeiten.
24 gezielte Tests (gemeinsame Shift-Sperre, Z-Adapter, Achsprojektion) bestanden;
Benchmark-Typecheck und fokussiertes ESLint bestanden. Keine Produktänderung, deshalb
keine erneute vollständige Testsuite/Produktbuild. Kein Crash in diesem begrenzten Lauf.
Der frühere Codex-Absturz bleibt ungeklärt; daraus wird keine Ursachenbehauptung abgeleitet.

Praktische Shift-Dauerbewegung ausdrücklich noch offen: Nutzer antwortet „Noch nicht
getestet“. Testanleitung übergeben: verbundene Wandgruppe, Ursprung, Richtung, Shift
halten und weit seitlich bewegen, platzieren, ein Undo; anschließend ausdrücklich Z
wählen und wiederholen. Kein weiterer automatisierter Shift-Klick als Ersatznachweis.
Technische Vorschauprüfung abgeschlossen, gesamte praktische S1-Abnahme NICHT geschlossen.
Die ausstehende Nutzerprüfung blockiert nicht den unabhängigen IFC-Nachweis.

Reproduktion (Node mit Type-Stripping):
node --max-old-space-size=768 --experimental-strip-types benchmarks/s1-export-preview-check.ts <baseline.json> <xy.json> <z.json>
Die drei Eingaben sind Exporte des beschriebenen Testablaufs, keine beliebigen Nutzerprojekte.

Nächste drei Schritte, nur Schritt 1 als nächster technischer Auftrag:
1. **Unmittelbar:** IFC-Höhen und Geschosszuordnung für mehrere Geschosse nachweisen;
   praktische Shift-Rückmeldung parallel offen halten.
2. Recovery-Zusammenfassung aller Geschosse prüfen und gegebenenfalls korrigieren.
3. Abbildwechsel-Performancebefund und verbleibende S1-/Release-Gates gezielt abarbeiten.

### AUD14-07 – IFC-Höhen/Zuordnung und korrigierte Z-Abnahme (15.10.2026)
PR #373 nach erfolgreicher CI ausdrücklich freigegeben und gemergt (11029aa).
Nutzer bestätigt wiederholte Z-Verschiebung zweier angewinkelt verbundener Wände sowie
Einzelbewegung mit gelöster Verbindung. Z wurde über die Hilfseingabe ausdrücklich
gewählt. Dafür ist Shift nicht erforderlich; die frühere Aufforderung zu einer
„Z-Shift-Abnahme“ war unpassend. Mausgesteuerte XY-/Elementrichtungs-Sperre mit dauerhaft
gehaltenem Shift bleibt separat offen. Keine automatische Z-Anwahl durch Shift behaupten.

Neuer Integrationstest in src/lib/bim/ifc.test.ts: KG/EG/OG mit Höhen -2,6/0/3,2 m,
signierten Wandversätzen und je einem Fenster. Exportierte IFC-Platzierungsketten werden
unabhängig aufgelöst, Geschoss-Elevation und exakte Containment-Mengen geprüft, außerdem
Öffnungs-/Fensterbeziehungen. OG-Wand um -4 m versetzt: gehört weiterhin zum OG.
Nach EG-/KG-Höhenänderung gelten -3/0/4 m; Wandversatz und Brüstung werden genau einmal
addiert. Projekt-Roundtrip, ein Undo und stabile GlobalIds sind geprüft. Absolute
EG-Bezugskote 100 m bleibt gemäß bestehendem Vertrag Annotation; Modell und IFC bleiben
EG-relativ. Kein neues Georeferenzierungsverhalten eingeführt.

23 fokussierte Tests (IFC, Wandhöhen, Z-Translation), TypeScript und fokussiertes ESLint
bestanden. Nur Test-/Dokumentationsänderungen, kein Produktfix erforderlich; daher kein
erneuter Produktbuild oder Vollsuite. Dies ist ein Exportstruktur-Nachweis, keine neue
Abnahme in Archicad oder einem unabhängigen IFC-Validator. Bestehende externe Abnahmen
bleiben erhalten, werden aber nicht auf diese neue Testkombination übertragen.

Nächste drei Schritte, nur Schritt 1 aktiv:
1. **Unmittelbar:** Recovery-Zusammenfassung über alle Geschosse prüfen und bei Bedarf korrigieren.
2. Offenen Abbildwechsel-Performancebefund gezielt messen und eingrenzen.
3. Verbleibende S1-/Release-Gates abgleichen; praktische XY-Shift-Abnahme separat nachtragen.

### AUD14-07 – Recovery-Zusammenfassung über alle Geschosse (15.10.2026)
PR #374 nach erfolgreicher CI und ausdrücklicher Freigabe gemergt (10ed3a9).
Befund: RecoveryPanel zeigte bei „Stand prüfen“ nur Wände/Fenster des aktiven Geschosses.
Die gespeicherten Daten enthielten bereits das gesamte Projekt; kein Datenverlustbefund.
Die gemeinsame read-only Application-Abfrage recoveryContentSummary zählt nun Geschosse
und summiert Wand-/Fenster-Arraylängen über alle Geschosse. Die Anzeige kennzeichnet
„gesamtes Projekt“. Keine Geometrieberechnung, Assetdecodierung oder Speicherzugriffe
für die Zusammenfassung; O(Geschosse), im Panel pro Kandidat memoisiert.
Speicherformat, Autosicherung, Wartung und Wiederaufnahme bleiben unverändert.

Regression: leeres aktives EG, Wände/Fenster in KG und OG, echter Recovery-Schreib-/Leseweg
mit In-Memory-Port. Erwartet 3 Geschosse, 2 Wände, 2 Fenster, unabhängig vom aktiven
Geschoss; Zusammenfassung verändert weder Projekt noch gespeicherten Stand. 24 fokussierte
Recovery-Tests, TypeScript, ESLint und Produktionsbuild bestanden. Keine visuelle
Browserabnahme in diesem Schritt; vorhandene echte lokale Sicherungen wurden nicht verändert.
Praktische Abnahme: Projekt mit mehreren Geschossen sichern → Lokale Wiederherstellung →
Stand prüfen. Die Gesamtzahl muss auch bei leerem aktivem Geschoss stimmen.

Nächste drei Schritte, nur Schritt 1 aktiv:
1. **Unmittelbar:** Abbildwechsel-Performancebefund mit isoliertem Testprojekt erneut messen und eingrenzen.
2. Aus der Messung eine begrenzte Korrektur ableiten und gegen unveränderte Modell-/Ansichtsdaten prüfen.
3. Verbleibende S1-/Release-Gates abgleichen; mausgesteuerte XY-Shift-Abnahme separat nachtragen.

### AUD14-07 – Abbildwechsel: Diagnosegrenze erneut geprüft (16.10.2026)
PR #375 nach erfolgreicher CI und Nutzerfreigabe gemergt (818a096).
Vor erneuten Messserien wurden die Belege aus #367/#368 und der aktuelle Öffnungspfad
(CadWorkspace.onOpenDocument → selectWorkingStorey/working-storey → Ansichtskontext)
abgeglichen. Die bisherigen Funktionswrapper erfassen nicht den gesamten React-Commit.
Native Bild-href-Zuweisung und erzwungenes Layout erklären die dokumentierten Pausen
nicht allein. Lange Frames sind dem synchronen Doppelklickereignis zugeordnet; daraus
folgt keine belastbare Zuordnung zu einem inneren Funktionsaufruf.

Die aktuell angebotenen Browserfähigkeiten wurden geprüft: Sichtbarkeit, Viewport,
Seitenassets und WebMCP; kein CPU-Sampling/Performance-Trace oder DevTools-Zugriff.
Deshalb keine erneute Longtask-Serie als vermeintlicher Ursachenbeleg, kein Produktfix
auf Verdacht und kein Abschluss des Befunds. In diesem Schritt gab es keine neue
Laufzeitmessung. Nutzerprojekt, Browserzustand und lokale Sicherungen unverändert.
Nur Dokumentation; keine Tests oder Builds erneut ausgeführt.

Genau nächster Auftrag ist ein CPU-Profil des reproduzierten warmen Abbildwechsels:
- Isolierten S1-GB-Produktionsworkspace verwenden, EG/OG-Abbilder vorwärmen.
- DevTools Performance-Aufnahme starten, mehrfach zwischen den Abbildern wechseln,
  danach stoppen. Während der Messung keine Automationsabfragen durchführen.
- Aufnahme mit auftretender Pause lokal sichern; Event-Callstack, Scripting,
  React-Commit, GC und Layout/Paint auswerten. Nicht additiv interpretieren, wenn
  gemessene Phasen ineinander verschachtelt sind.
- Erst bei belegter Ursache einen begrenzten Fix auswählen. Ein Lauf ohne Pause ist
  kein Behebungsnachweis. Kein Hochladen privater Projektinhalte für diesen Nachweis.
Diese Aufzeichnung benötigt eine verfügbare Profilerschnittstelle oder eine vom Nutzer
lokal erstellte Aufnahme; beides liegt derzeit nicht vor. Befund bleibt P2 offen.

Nächste drei Schritte:
1. **Unmittelbar:** CPU-Aufnahme eines ruckelnden warmen Abbildwechsels beschaffen und auswerten.
2. Nur auf Basis der identifizierten Ursache eine begrenzte Korrektur mit Gegenmessung umsetzen.
3. Übrige S1-/Release-Gates abgleichen; XY-Shift-Nutzerabnahme bleibt separat offen.

### AUD14-07 – Recovery-Vergleich nach Nutzer-CPU-Trace (16.10.2026)
#376 gemergt (04ae601). Nutzerdatei 2Trace-20261016T144019.json ist gzip-komprimiert;
41 Doppelklicks, davon 39 langsame Ereignisse mit ca. 56–115 ms. CPU-Funktion po im
exakt passenden Bundle styles-CI2XsJYD.js entspricht sameRecoveryContent. Rund 55 %
der ausgewerteten Samplezeit der langsamen Doppelklicks entfällt direkt darauf.
Kein Bildrenderer-Ursachennachweis. Rohtrace bleibt lokal, keine Veröffentlichung
von Trace-/Screenshot-/Bildpayloads im Repository.

Korrektur: RecoveryStatusTracker besitzt einen exakten Comparator pro gelesener Baseline.
Er übernimmt diese über createProjectSnapshot; nur bereits factory-owned, tief immutable
aktuelle Snapshots dürfen Teilbaum-Paarergebnisse wiederverwenden. Veränderliche oder nur
vom Aufrufer eingefrorene Eingaben bleiben uncached. WeakMaps halten alte History-Snapshots
nicht fest. Neue Baseline, Kontextwechsel und Dispose verwerfen den Comparator. Fehler,
verspätete Reads und laufende Saves behalten die vorhandenen Statusregeln. Alle persistierten
Felder einschließlich Ansichtseinstellungen werden verglichen, keine Hashkollisionen,
keine ausgelassenen Bilder. Allgemeiner sameRecoveryContent/Autosave-Pfad bleibt uncached.
Initiale Snapshot-Übernahme/Validierung und Kaltvergleich bleiben vollständige Arbeit.

Regressionen: geteilter Geschosswechsel, Modelländerung, Maßstab/Sichtbarkeit, Rückkehr zur
Baseline, anderer Sicherungsstand, mutable/shallow-frozen Eingaben. Bestehende Tests prüfen
Undo/Redo, fehlgeschlagene Saves, externe Ersetzung, Kontextwechsel und verspätete Reads.
1092 Gesamttests, 30 fokussierte Tests, TypeScript (Produkt und Benchmarks), ESLint sowie
Produktions- und isolierter Diagnosebuild bestanden.

benchmarks/recovery-comparison.ts: 100 Wechsel im synthetischen S1-GB-Export (5 Geschosse,
20 Bildassets), alle Ergebnisse exakt wie vollständiger Vergleich. p95 vollständig
7,294 ms, warm gecacht 0,0234 ms; Vorbereitung 24,807 ms, erster Vergleich inklusive
vollständigem Kontrollvergleich 17,559 ms. Details recovery-comparison-evidence.json.
Dies sind Node-Vergleichszeiten, keine Browser-Framezeiten. Die alte Browser-Samplezeit
und diese Node-Messung dürfen nicht als direkter Vorher/Nachher-Framevergleich gelten.

Nächste drei Schritte:
1. **Unmittelbar:** Diagnose-Seite neu laden und Abbildwechsel mit DevTools erneut aufnehmen;
   CPU-Zeit/Frames mit dem Nutzertrace vergleichen. P2 bis dahin offen.
2. Verbleibende Kosten anhand dieser Gegenmessung eingrenzen, nur bei Befund weiter korrigieren.
3. S1-/Release-Gates einschließlich separater XY-Shift-Abnahme abgleichen.


### AUD14-07 – Wiederholte Bildressourcen im dritten Nutzertrace (16.10.2026)
Die gzip-Datei 3Trace-20261016T144923.json gehört zum Diagnosebuild mit Recovery-Fix
(styles-BrSjtsLt.js / s1-workspace-DM3qbuE6.js). 32 Doppelklickereignisse; viele liegen
bei 22–28 ms, neun bei 67–77 ms, einmal 471,557 ms. Das erste lange Ereignis ist
separat und wird durch den nachfolgenden Bildbefund nicht erklärt. Ereignisdauer ist
keine Framezeit; umgebende Tasks können länger sein.

Alle neun Ereignisse zwischen 50 und 200 ms enthalten jeweils vier data:image-
Anforderungen, insgesamt 36 Anforderungen auf 16 verschiedene Quellen. Bei fünf
Wechseln sind alle vier Quellen bereits zuvor in derselben Aufnahme angefordert
worden (exakter SHA-256 der Quelle zur Diagnose, keine Produkt-Vertrauensprüfung).
Die jeweiligen vier AsyncTaskRun-Spannen enthalten diese Bildanforderungen und
belegen zusammen 41,603–47,049 ms bei den fünf wiederholten Wechseln. Das ist
keine exklusive Decoder-CPU-Zeit. Beispiel Ereignis 14: 66,963 ms, davon vier
bildanforderungshaltige Async-Spannen mit zusammen 44,624 ms; anschließend vier
PNG-Decode-Tasks auf Workerthreads (ca. 18–20 ms pro Task, parallel, nicht addieren).
ResourceReceiveResponse nennt protocol=data: kein externer Netzwerkdownload.

Damit ist die Nutzerbeobachtung wiederkehrender Bildarbeit bestätigt. Nicht belegt
ist eine bestimmte Browser-Cachegröße oder deren Verdrängungsstrategie. Der
achtteilige checkedImageUrl-Fallback ist nicht einfach auf alle Abbilder zu erweitern:
verifizierte Asset-Handles haben bereits einen eigenen WeakMap-URL-Pfad. Dieser
speichert die geprüfte Data-URL, nicht die decodierte Browser-Bildressource. Ein
useMemo speichert außerdem nur die aktuelle Planableitung. Kein Grund, vollständige
Abbilder oder eine zweite Modellkopie dauerhaft zu halten.

Reproduzierbar mit node benchmarks/trace-image-reloads.mjs <lokale Trace-Datei>.
Aggregatnachweis: benchmarks/trace-image-reloads-evidence.json. Rohtrace und URLs
bleiben lokal. Zwei Tests prüfen JSON/gzip, Wiederholungen, Threadfilter, verschachtelte
Spannen und Payload-Redaktion. Beide bestanden. Keine Produktänderung, daher kein
Produktbuild oder vollständiger Regressionstest wiederholt. #377 ist noch nicht gemergt.

Nächste drei Schritte:
1. **Unmittelbar / einziger Implementierungsauftrag:** begrenzter Bildressourcen-Pilot
   im Rendering-/Plattformadapter. Stabile Blob-URLs aus geprüften unveränderlichen
   Assets statt wiederholter großer Data-URLs untersuchen; explizite Freigabe bei
   Projekt-/Assetwechsel, begrenzter Speicher, keine ungültigen/alten Bildinhalte und
   kein Ändern von Projektdatei oder Recovery. Aktive Ressourcen nicht vorzeitig
   widerrufen. Kein pauschales Vorladen aller Abbilder. Zunächst isolierter Pilot.
2. Dieselbe Sequenz mit mindestens drei Abbildern vor/nach Pilot messen: Bildrequests,
   Dekodierung, erste/warme Wechsel, Framezeiten und Speicher; Austausch, Löschen,
   Undo und Sichtbarkeit prüfen. Blob-URLs garantieren keinen dauerhaften Decode-Cache;
   nur bei belegter Verbesserung produktiv übernehmen.
3. P2-Restbefund und übrige S1-Gates abgleichen; initialen Ausreißer sowie praktische
   XY-Shift-Abnahme getrennt offenhalten.


### AUD14-07 – Begrenzter Bildressourcen-Pilot (16.10.2026)
#377 (42bd85b) und #378 (4bdbd1a) nach expliziter Freigabe mit grünen Checks per
Merge-Commit in main übernommen. Kein Rewrite veröffentlichter Historie.

createImageResourcePool im Image-Plattformadapter erzeugt bei Bedarf Blob-Ressourcen
nur aus factory-owned unveränderlichen Asset-Handles, mit erneuter Header-/Metadaten-
Prüfung. IDs, Hashes oder Object.freeze allein erlauben keine Wiederverwendung.
Die Binärbytes bleiben exakt; Persistenz, Recovery, Modell und Undo sind unverändert.
64 MiB komprimierte Blob-Nutzdaten und 64 Einträge begrenzen diesen Pilotpool. Aktive
Leases zählen mit und werden nicht verdrängt; bei voller aktiver Kapazität, ungültigen
Eingaben oder Allokationsfehlern bleibt der bisherige geprüfte Data-URL-Pfad verfügbar.
LRU verdrängt nur ungenutzte Ressourcen. Aktueller Assetbestand entfernt gelöschte/
ersetzte Quellen nach Freigabe des letzten Benutzers; Undo kann sie neu erzeugen.
Clear widerruft sofort ungenutzte Quellen, aktive erst nach letzter Freigabe.
Browser-Decoding, GPU-Speicher, ursprüngliche Base64-Daten und temporäre Konvertierung
sind nicht Teil dieses 64-MiB-Wertes. Kein Versprechen einer Gesamt-RAM-Grenze.

Ein explizites Vite-Plugin bindet den Pool nur im Modus image-resources ein. Es ersetzt
im Diagnosebuild den SVG-Bildknoten durch einen Lease-Consumer und bindet den
Asset-Lebenszyklus an den Workspace, nicht an die beim Abbildwechsel neu montierte
Ansicht. Der erste Browserlauf erkannte genau diese zu kurze Lebensdauer; korrigiert
und erneut geprüft. Produktquellen von Workspace/PlanSceneRun bleiben unverändert.
Der Pilot besitzt einen Pool pro isolierter Diagnoseseite; Mehr-Workspace-Integration
ist damit noch kein Produktvertrag. Normale Produktbundles enthalten den Piloten nicht.

Build: node node_modules/vite/bin/vite.js build --config benchmarks/production-workspace.config.ts --mode image-resources
Pilot: http://127.0.0.1:8085/benchmarks/s1-workspace.html?variant=GB&imageResources=bounded
Kontrolle: dieselbe Seite ohne imageResources. Nicht mit altem imageUrls=blob kombinieren.

Browsernachweis im S1-GB-Workspace: EG → OG1 → OG2 → OG3 → OG4 → EG → OG1 → OG2.
20 Anlagen, 16 Wiederverwendungen, 47.127.963 Blob-Bytes, vier aktive Ressourcen,
keine Verdrängung und kein Fallback. Danach Ebenen ausblenden und Sichtbarkeits-Undo:
Bilder 0 → 4, Anlagen bleiben 20, Wiederverwendungen steigen auf 20. Vier echte blob-
hrefs, Bilder sichtbar, keine Browser-Console-Errors. Aggregat in
benchmarks/image-resource-pilot-evidence.json. Kein CPU-/Frame-Lagfrei-Nachweis.

Sieben neue Pooltests: fünf Ansichten/zwanzig Quellen und exakte Bytes, Byte-/Eintrags-
Budget, aktive Pins/LRU, gleiche ID mit anderem Inhalt, Entfernen/Undo, ungültige Header,
Clear/mehrfache Freigabe und Allokationsfehler. Insgesamt 1099 Tests bestanden;
TypeScript einschließlich Benchmarks, fokussierter ESLint, Produkt- und Pilotbuild bestanden.

Nächste drei Schritte:
1. **Unmittelbar / einziger Folgeauftrag:** kontrollierte CPU-/Frame-Gegenmessung
   desselben S1-GB-Abbildablaufs mit und ohne imageResources=bounded. Alle fünf
   Abbilder vorwärmen; Kaltkonvertierung separat, keine Automationsabfragen während
   der Aufnahme. Ressourcenrequests/PNG-Decoding, Speicher und warme Frames vergleichen.
2. Bei nachgewiesenem Nutzen den Adapter mit projekt-/fensterbezogenem Besitzer in
   den Produktpfad übernehmen; sonst Pilot gezielt nach dem Trace überarbeiten.
3. Restkosten einschließlich initialem Ausreißer und separater XY-Shift-Abnahme prüfen;
   P2 erst nach belastbarem Nachweis schließen.


### AUD14-07 – Bildressourcen-Gegenmessung B-A-A-B (16.10.2026)
#379 nach ausdrücklicher Freigabe und grüner CI in main gemergt (c65455f).
benchmarks/image-switch-comparison.ts ergänzt ausschließlich die isolierte S1-Seite:
25 synthetische Doppelklicks durch den echten Abbild-Öffnungshandler, EG/OG1/OG2/OG3/OG4
zuerst einmal, dann vier Wiederholungen. Postcondition aria-selected nach jedem Wechsel;
alle 100 Wechsel der vier Läufe erfolgreich. 200 ms Pause zwischen Schritten, ein
RAF vor Dispatch, zwei RAF danach. Erstpass ist nicht vollständig kalt: EG war beim
Seitenstart sichtbar; Browser-/GPU-Caches werden nicht künstlich geleert. Jede Variante
frisch navigiert/geladen. Eingabe oder Sichtbarkeitswechsel bricht die Messung ab.
Kein Recoverybestand gelöscht oder Einstellungen zur Messung deaktiviert.

Während der vier Läufe keine Browser-Automationsabfragen; Start per sichtbarem Button,
Ergebnisse erst nach Ablauf ausgelesen. Reihenfolge begrenzter Pool B, Kontrolle A,
Kontrolle A, begrenzter Pool B. Identischer Build styles-D_4ueobp.js,
s1-workspace-C_3dw2co.js; Pilot nur per Query aktiv. Aggregat und Rohmesswerte ohne
Projekt-/Bildpayloads in benchmarks/image-switch-comparison-evidence.json.

| Lauf | Warmer Median / p95 / Maximum bis zwei RAF (ms) | Lange Tasks / lange Frames im warmen Zeitfenster |
| --- | --- | --- |
| B1 | 39,8 / 55,2 / 66,7 | 0 / 0 |
| A1 | 42,8 / 64,3 / 119,7 | 4 / 4 |
| A2 | 42,3 / 51,4 / 75,1 | 1 / 2 |
| B2 | 39,0 / 58,9 / 73,7 | 1 / 2 |

20 warme Samples pro Lauf. Erstpass-Maxima B1 170,6; A1 175,5; A2 175,1; B2 207,3 ms.
In beiden Pilotläufen genau 20 Ressourcenanlagen, 84 Wiederverwendungen, 47.127.963
Blob-Bytes, vier aktiv, null Fallbacks/Verdrängungen. Keine weiteren Anlagen durch warme
Abbildwechsel. Die Werte zählen komprimierte Blob-Nutzdaten, nicht Gesamt-RAM/Decoding.

Bewertung: geringer Medianvorteil, aber p95-Bereiche überlappen; B2 besitzt weiterhin
einen langen Frame (103,7 ms). Keine robuste Aussage, dass der Nutzerbefund behoben ist.
Zwei RAF messen weder exklusive CPU-Zeit noch garantierte Bilddekodierung/physisches
Bildschirm-Paint. Lange Tasks/Frames werden im warmen Zeitfenster gezählt, inklusive
Zwischenpausen; sie werden nicht einzelnen Abbildwechseln kausal zugeschrieben. Die
synthetischen Events ersetzen nicht den Native-Eingabe-Trace des Nutzers. Kein Vergleich
der alten Trace-EventDispatch-Werte mit den neuen Zwei-RAF-Zeiten als gleiche Metrik.
Die Browsersteuerung bietet keinen DevTools-CPU-Profiler. PNG-Decode-/GPU-Cachekosten und
Gesamt-Speicherverbrauch bleiben damit ungeprüft; keine erfundene CPU-Gegenmessung.

Validierung: 100 erfolgreiche UI-Wechsel, beide Varianten vollständig ausgeführt,
TypeScript für Benchmarks/Produkt und fokussierter ESLint bestanden, isolierter Build
bestanden. Kein Produktcode geändert; volle Produkttests/Produktbuild nicht wiederholt.
1099 bestandene Tests gehören zum unveränderten Vorgänger #379, nicht zu einem neuen Lauf.

Nächste drei Schritte:
1. **Unmittelbar / einziger Folgeauftrag:** Native-Eingabe-/CPU-Aufnahmen beider Varianten
   am gleichen Diagnosebuild vergleichen (fünf Abbilder vorwärmen, gleiche Reihenfolge).
   Insbesondere lange Pilotframes und erneutes PNG-Decoding lokalisieren. Dafür wird ein
   verfügbarer CPU-Profiler oder eine lokale Nutzeraufnahme benötigt; kein weiterer bloßer
   Longtask-Durchlauf als Ersatz. Ohne diesen Nachweis bleibt der Pilot isoliert.
2. Nur die dadurch belegte Restursache gezielt korrigieren; danach denselben Vergleich
   wiederholen und erst bei belastbarem Nutzen über Produktübernahme entscheiden.
3. P2 und übrige S1-Gates einschließlich separater XY-Shift-Abnahme abschließen, sobald
   ihre jeweiligen Nachweise tatsächlich vorliegen.

### N22 – Wandoberkante bis UK Rohdecke (16.10.2026)
Verbindliche Nutzerentscheidung: optional bis **Unterkante** Rohdecke, nicht Oberkante.
Vorläufige Rohdeckenstärke 0,20 m; sie ist eine fachliche Annahme, keine erzeugte Decke.
Gemeinsame Berechnung: Oberkante Wand = OK obere Rohdecke − Stärke + oberer Versatz;
Wandhöhe = Oberkante Wand − (Geschosskote + Wandfußversatz). Gleicher Höhenraum für
alle Eingaben; absoluter Gebäudebezug darf nicht doppelt addiert werden.

Umgesetzt ist ausschließlich der getestete Domain-Rechenvertrag in wall/heights.ts.
Die obere Referenz und ihre Stärke werden ausdrücklich übergeben. Fehlende oder
numerisch ungültige Bezüge werden abgewiesen. Keine Schema-/UI-Umstellung und noch
keine auswählbare Höhenbindung. Vorhandene feste Wandhöhen bleiben unverändert.

Integrationsvertrag: bestehende Dateien bleiben fest; neue Bindung ausdrücklich
wählen und mit stabiler Referenz speichern. Keine redundant editierbare berechnete
Höhe. Geschossänderungen müssen betroffene Wände, Fenster und Anschlüsse gemeinsam
prüfen und atomar veröffentlichen; ein Undo. Alle Darstellungen und IFC lesen dieselbe
Auflösung, AI/Text/Voice dieselbe Application-Aktion. Keine Berechnung pro Pointerframe.
Noch zu entscheiden vor entsprechender Bedienung: Ziel ohne oberes Geschoss und
Verhalten beim Entfernen/Einfügen des referenzierten Geschosses. Keine stille Ersatzbindung.
Spätere echte Decken liefern dieselbe Referenz; keine zweite Höhenlogik im Renderer.

**Präzisierung (Nutzerentscheidung 28.10.2026):** Wandbezüge zielen grundsätzlich auf die Geschosshöhen, nicht auf Decken; die angenommene Rohdecke 0,20 m war ein Zwischenschritt zur Andeutung einer Decke. Decken einzubeziehen bleibt erlaubt (dann als ausdrückliche geschossübergreifende Eingabe nach A08). Eine Decke gehört zu dem Geschoss, in dem sie platziert wird, und ist dessen Decke: OK = Rohfußboden des Geschosses darüber + Versatz; Stärkeänderung behält OK und verschiebt UK (docs/SLAB_ELEMENT.md). Umstellung der Wandbindung ist ein eigener Schritt (Decken Teil C). **Umgesetzt 29.10.2026 (PR490, Teil C1):** Bindung an das eigene Geschoss mit Zusatzhöhe, Schema 30; eingegebene Höhe löst die Bindung. Damit erledigt: oberstes Geschoss ist bindbar, Einfügen eines Geschosses darüber ändert gebundene Wände nicht (frühere Sperre aufgehoben).

Performance-Priorität ausdrücklich geändert: weitere AUD14-07-Aufnahme und Promotion
auf Nutzerwunsch vertagt. Vorhandene Nachweise und offene P2-/Abnahmegates bleiben
bestehen. Frühere nächste Aufträge sind hierdurch ersetzt, nicht als bestanden markiert.

Nächste drei Schritte:
1. **Unmittelbar / einziger Folgeauftrag:** persistierten Höhenvertrag und zentrale
   Modellauflösung integrieren, mit Altdatei-Migration, Fenster-/Anschlussprüfung und
   Gleichheit von Geometrie/IFC; noch keine breite UI-Erweiterung.
2. Eigenschaftenwahl feste Höhe/UK Rohdecke über dieselbe Application-Aktion anbinden.
3. Mehrgeschossigen Ablauf mit Höhenänderung, Undo, Speichern und IFC praktisch abnehmen.

Validierung dieses Schritts: vollständige Suite 1102/1102, TypeScript, fokussierter
ESLint und Produktbuild bestanden. Keine Browserabnahme erforderlich: keine UI-
oder produktive Verhaltensänderung, reine Domain-Vorbereitung.

### N22 – Gespeicherte Wandhöhenbindung (16.10.2026)
#381 nach grüner CI und ausdrücklicher Nutzerfreigabe in main (542bc7e).
Schema 26 erweitert Wände optional um topBinding: kind slab-underside, stabile obere
Geschoss-ID, slabThickness in m (Vorgabe 0,20), topOffset in m. Die Stärke ist vorläufig
Teil der Referenzannahme und erzeugt kein Deckenbauteil. V1–V25 migrieren weiterhin
auf feste Wandhöhen; V25 lehnt eingeschmuggelte Bindungsfelder ab.

Domain height-binding löst einmal an der vollständigen Validierungsgrenze auf.
Die bestehende numerische height ist bei gebundenen Wänden nur abgeleitete Laufzeit-
Kompatibilität für Geometrie, Fensterprüfung, Anschlüsse und IFC. Sie wird nicht als
zweite editierbare Größe gespeichert: gemeinsames projectStorageData entfernt sie
für Projektdatei, Recovery und Dateigrößenprüfung. Bei einem eingehenden Laufzeit-
Snapshot wird ein mitgelieferter Zahlenwert neu berechnet, niemals als Wahrheit
übernommen. Keine Getter/toJSON-Tricks, keine Renderer-Sonderlogik, kein zweites Modell.
Die kanonische Schlüsselreihenfolge bleibt auch nach Datei/Recovery stabil.

Application setWallHeightRule bindet Projekt-/Geschoss-/Wand-IDs und Ausgangsobjekt;
mehrere Wände werden gemeinsam validiert. Zurück zu fester Höhe ist ausdrücklich
möglich. updateWall erlaubt keine unabhängige Änderung einer gebundenen height.
Geschossänderung berechnet alle betroffenen Höhen vor Fenster-/Anschlussprüfung neu;
bei Konflikten wird nichts veröffentlicht. Ein commitProject erzeugt einen Undo-Schritt.
Der vorhandene Gleichhöhenvertrag für Anschlüsse bleibt bestehen: gemischt feste und
gebundene verbundene Wände können eine Geschosshöhenänderung deshalb ablehnen.

Vorläufige Sicherheitsgrenze bis zur Produktentscheidung: Bezug nur auf das tatsächlich
vorhandene unmittelbar obere Geschoss. Kein oberes Geschoss, unbekannte Koten,
Entfernen des Zielgeschosses oder Einfügen dazwischen werden verständlich abgewiesen;
keine automatische Zielwahl oder Ersatzzielbindung. UI zur Bindung folgt separat.

Starre Z-Bewegung ändert Fuß- und oberen Versatz gemeinsam, behält Referenz und
Wandlänge in Z. Vorbereitete Vorschau löst nur betroffene Wände anhand der einmal
vorbereiteten Koten auf und prüft deren Fenster; Commit bleibt vollständig validiert.
XY übernimmt die bereits aufgelöste Höhe. Tests vergleichen Vorschau/Commit inklusive
Eck- und T-Geometrie. Kein vollständiger Modellscan im Pointerpfad hinzugefügt.

Lokale Rechenmessung (benchmarks/wall-height-binding.ts, Rohwerte in gleichnamiger
-evidence.json): je 200 Warmup-/1000 Messaufrufe, zwei gebundene Eckwände mit zwei
Fenstern. Z-evaluate p95 0,0211 ms mit 2 Wänden, 0,0108 ms mit 2002 Wänden; Maxima
1,824/0,851 ms. Nur vorbereitete Rechenfunktion, kein Browser-/Render-/Commitnachweis,
keine Aussage über AUD14 oder gesamte Framezeiten. Gesamte Modellvalidierung bei
Vorbereitung/Commit bleibt bewusst projektweit.

Nächste drei Schritte:
1. **Unmittelbar / einziger Folgeauftrag:** Wahl feste Höhe/UK Rohdecke, Ziel und Versatz
   in Werkzeugeigenschaften an die geprüfte gemeinsame Höhenaktion anbinden.
2. Mehrgeschossigen Ablauf mit Fenster, Anschlüssen, Undo, Datei und IFC praktisch abnehmen.
3. Fehlenden oberen Bezug und Einfügen zwischen gebundene Geschosse fachlich entscheiden,
   bevor diese bislang gesperrten Fälle erweitert werden.

Validierung: 1109/1109 Tests bestanden, Produkt- und Benchmark-Typecheck,
fokussierter ESLint, git diff --check und Produktbuild bestanden. Sieben zusätzliche
Integrationsfälle in heights.test.ts prüfen Datei/Recovery, V25-Migration, Kontext,
Fenstergrenzen, feste Rückschaltung, Eck-/T-Geometrie, Z-/XY-Vorschau und Undo.
Bestehende Migrationserwartungen sind lediglich von Version 25 auf 26 angehoben.
Praktische Abnahme folgt nach der UI-Anbindung; kein bereits bedienbarer Schalter behauptet.

### N22 – Höhenbindung in Werkzeugeigenschaften (17.10.2026)
#382 nach grüner CI und ausdrücklicher Freigabe in main (f58daba).
WallHeightProperties ist ein kleiner UI-Adapter für setWallHeightRule. Feste Höhe
und UK Rohdecke werden ausschließlich dort bearbeitet; die bisherige direkte
Wandhöhe im allgemeinen Maßformular entfällt. Fenstermaße bleiben unverändert.
Wahl übernimmt sofort, Zahleneingaben bei Enter/Feldverlassen über PropertyForm.
Rückkehr zu fest behält die berechnete Höhe. Keine neue Fachberechnung/History.

Gebundene Wand zeigt den Namen des unmittelbar oberen Geschosses, die gespeicherte
Rohdeckenstärke als Annahme und die berechnete Höhe. Oberer Versatz ist bearbeitbar.
Das Bezugsgeschoss ist gemäß aktuellem Modellvertrag eindeutig; keine Auswahl eines
beliebigen Geschosses. Ohne oberen/aufgelösten Bezug ist Bindung deaktiviert mit Hinweis.
Konflikte belassen Modell und Undo unverändert; die Fehlermeldung verschwindet auch
bei Korrektur auf den unveränderten gültigen Wert. Höhenkontext ist pro Projekt/ID
memoisiert; keine wiederholte Projektsuche durch bloße Präsentationsrenders.

Isolierte Browserabnahme über benchmarks/wall-height-properties.html mit echtem
BimInspector/PropertyForm/History: fest 2,8 → gebunden 2,8 → Geschoss 4,0 / Wand 3,8;
Versatz -0,1 → 3,7; Undo/Redo; Rückkehr fest erhält Höhe. Ungültiger Versatz -2 bei
3-m-Geschoss weist Fensterkonflikt ab, Undo bleibt 1; Korrektur auf 0 entfernt Fehler
ohne Undo-Eintrag. Variante ?noUpper zeigt deaktivierte Bindung. Kein Nutzerprojekt
oder Wiederherstellungsspeicher verändert. Screenshot in outputs/wall-height-properties.png.
1109 Tests bestanden. Typecheck (einschließlich Benchmark), fokussierter Lint und
Produktbuild geprüft. Diese Komponentenabnahme ersetzt noch keine Gesamtworkflow-
oder externe Archicad-Abnahme.

Praktisch testen: Im EG eine Wand wählen, darüber ein Geschoss mit bekannter Höhe
anlegen. Höhenmodus UK Rohdecke wählen; bei 3,00 m Geschosshöhe und 0,20 m Rohdecke
muss die Wand ohne Versätze 2,80 m hoch sein. Oberen Versatz -0,10 eingeben → 2,70 m.
Undo prüfen, anschließend feste Höhe wählen. Mehrfachauswahl-Eigenschaften bleiben
unverändert; die Application-Aktion unterstützt bereits atomare mehrere Ziele.

Nächste drei Schritte:
1. **Unmittelbar / einziger Folgeauftrag:** mehrgeschossigen Gesamtworkflow im Produkt
   mit Fenster, Anschlüssen, Höhenänderung, Undo/Redo, Datei und IFC abnehmen.
2. Verhalten ohne oberes Geschoss und beim Einfügen zwischen gebundene Geschosse mit
   dem Nutzer festlegen; bis dahin bleiben diese Bindungsfälle gesperrt.
3. Erst danach die zugehörige gemeinsame Höhenaktion für Text-/Sprachbefehle anbinden,
   mit stabilen ausgewählten Wand- und Geschoss-IDs.

### N22 – Mehrgeschossiger Gesamtworkflow (17.10.2026)
PR #383 nach bestandener GitHub-CI und ausdrücklicher Freigabe in main übernommen.
Reproduzierbare Fixture: benchmarks/bound-height-workspace.html (separater Port 8087,
keine Nutzung des Projekts/Recovery auf 8080), gemeinsame Fixture mit Regressionstest.
Drei Geschosse, davon zwei mit jeweils zwei eckverbundenen, gebundenen Wänden und
je einem Fenster. Keine neue Produktfunktion oder eigene Berechnungslogik.

Browsernachweis im tatsächlichen CadWorkspace: EG-Geschosshöhe 3 → 4 m im
Gebäudestrukturfenster; Wand-Eigenschaften zeigen 3,8 m. 3D zeigt beide bebauten
Geschosse einschließlich Fenster. Save project → JSON-Download → Open project →
Bestätigung → Wand weiterhin gebunden mit 3,8 m. Ein Undo ergibt 2,8 m; Redo stellt
den geänderten Zustand wieder her. OG-Wand bleibt 2,8 m. IFC-Download geprüft:
Geschosskoten 0 / 4 / 7 m, zweimal Wandextrusion 3,8 m und zweimal 2,8 m, zwei Fenster.
JSON enthält Bindungsregeln, keine zweite gespeicherte Wandhöhe. Kein Archicad-Import
in diesem Auftrag. T-Anschlüsse sind durch bestehende Modelltests abgedeckt, nicht
als zusätzliche Browserabnahme dieses Eckanschluss-Beispiels ausgegeben.

Regression benchmarks/bound-height-workflow.test.ts prüft denselben Bestand,
Geschosskoten, unveränderte Fenster/Anschlüsse, Solid-Höhe 6,8 m, genau ein Undo,
Redo, Datei-Roundtrip, identischen IFC-Export und atomare Ablehnung einer Kürzung,
die das Fenster verletzt. Screenshot: outputs/bound-height-workspace.png außerhalb
Git; lokale Downloads novikov-project (60).json und novikov-project (12).ifc.

Offener Browserbefund: Im Entwicklungsserver-Protokoll um 08:37:59 UTC erschien
„Maximum update depth exceeded“ mit onPointerMove in BimSolidView. Die Seite blieb
anschließend bedienbar; während dieser Abnahme gab es auch Dateiänderungen/HMR.
Ursache und Reproduzierbarkeit im unveränderten Produktbuild sind NICHT nachgewiesen.
Daher keine uneingeschränkte Aussage „Browser fehlerfrei“. Keine spekulative Änderung
am Pointer-/Inference-Pfad aufgrund dieses einzelnen Protokolleintrags.

Nächste drei Schritte:
1. **Unmittelbar / einziger Folgeauftrag:** den protokollierten 3D-Update-Fehler ohne
   HMR im Produktbuild reproduzieren und eingrenzen; bei Nachweis gezielt beheben,
   mit bestehender gemeinsamer Inference-/Preview-Architektur.
2. Fehlenden oberen Bezug und Einfügen zwischen gebundene Geschosse mit dem Nutzer
   entscheiden; bislang gesperrte Fälle nicht stillschweigend freischalten.
3. Anschließend Höhenbindung als Adapter der geprüften gemeinsamen Aktion für
   Text-/Sprachbefehle mit stabilen Ziel-IDs anbinden.

Validierung dieses Nachweises: 1110/1110 Tests bestanden, Benchmark-/Produkt-Typecheck,
fokussierter ESLint, git diff --check und Produktbuild bestanden. #383 Merge: 0fe21549.

### §9 Korrekturauftrag – Höhenworkflow und P0-Startschutz (17.10.2026)
Quelle: aktueller main a1df84b; mit vorhandenem PR384 zusammengeführt, beide
Register-Ergänzungen erhalten. Keine Freigabe/Übernahme von PR318 oder PR384 behauptet.

Statischer minifizierter Produkt-Workspace mit sieben Wänden/drei Fenstern in KG/EG/OG,
leerem oberen Bezugsgeschoss; isolierte Origin 127.0.0.1:8087. Konfiguration
benchmarks/height-acceptance.config.ts ohne HMR/Diagnoseinstrumentierung. Gleiche
CadWorkspace-/Application-/Domain-/Storage-Pfade wie im Produkt.
Nachweise: EG 3→4 m, KG 3→3,5 m; EG-Eckwände 3,8 m; separate EG-Wand mit Fuß +0,1
und oberem Versatz +0,2 ergibt 3,9 m. KG-Wände mit Fuß −0,1 und oberem Versatz −0,1
werden 3,3 m hoch, Kote −3,5 m; EG bleibt 0. OG enthält einen gültigen gemischten
fest/gebundenen Eckanschluss. OG 3→4 wird wegen ungleicher Anschlusshöhe atomar
abgelehnt. EG 3→2 verletzt Fensterhöhe und wird atomar abgelehnt. Beide zunächst
ohne aktiviertes Undo. Gültige Änderung exakt ein Undo, Redo stellt sie wieder her.

P0 reproduziert: bisher schrieb der Startbestand während des offenen Startangebots
in denselben Recovery-Slot; nach Reload zeigte Wiederaufnahme 2,8/2,9 statt 3,3/3,9 m.
Korrektur in Application createRecoveryStartup/createAutosaveController: vor erstem
Update sperren, fehlender Speicher gibt frei; vorhandene/fehlerhafte Angebote warten
auf bewusste Fortsetzung oder bestätigten Projektlade-Kontext. Reine Modell-/Ansichts-
updates und Öffnen/Abbrechen des Dialogs lösen die Sperre nicht. Verspätete Abfragen
können sie nach bestätigter Wiederaufnahme nicht erneut setzen. Aktuelle/vorherige
Snapshots und Optimistic-Concurrency-Prüfung bleiben erhalten; keine Daten gelöscht.
UI ist dünner Adapter derselben Abfrage; Status zeigt währenddessen pausiert.

Gegenprobe nach Reload, mehr als 2 Sekunden Wartezeit, Stand prüfen und bestätigtem
Laden: KG 3,3 und EG 3,9 bleiben erhalten, Autosicherung wieder aktiv. Danach echter
JSON-Download/-Upload und IFC-Download. IFC: Geschosskoten −3,5/0/4/7 m, drei Fenster,
zwei KG-Wandhöhen 3,3 m, EG-Versatzwand 3,9 m; stabile Geschosszuordnung. Lokale
Artefakte outputs/height-recovery-corrected.png, Downloads novikov-project (61).json
und novikov-project (13).ifc. Kein neuer Archicad-Import, keine echte Decke erzeugt.

Schema-/Erzeugungs-/Lesepfad und Fehlermeldung beziehen aktuelle Version aus
src/domain/project/format.ts. Historische Migrationsstufen bleiben explizit.
Größen-/UTF-8-/Geometrieprüfungen unverändert. 1115 Tests, beide Typechecks über
Benchmarkkonfiguration, fokussierter Lint und Produktbuild bestanden.
Vier Orbit-Drag-Gesten im statischen Build ohne Konsolenfehler; der frühere einzelne
Entwicklungsfehler bleibt damit nicht reproduziert, keinesfalls als behoben behauptet.
Keine Langsession-/Framegarantie aus diesem kleinen funktionalen Beispiel.
Fortsetzung ausschließlich §9; kein eigener neuer Featureauftrag.

### AUD14-03/04 – begrenzte Bounds-Korrektur nach Höhenabnahme (17.10.2026)
Nach Abschluss der Höhen-/Recovery-Korrektur unmittelbar gemäß §9 begonnen.
Basis 1c9416e, Windows, AMD Ryzen 5 3600, Node 24.19.0. Reproduzierbar:
node --experimental-strip-types benchmarks/preview-composition.ts.
Zwei ausgewählte EG-Eckwände mit Fenster, übrige Wände 4/104/1004 insgesamt,
100 Aufwärmschritte und 300 Messungen. Vorbereitung, Application-evaluate,
Zusammensetzung und Buffer-Cache-Gruppierung separat; vorgesehene Uploadbytes,
keine GPU-/Native-/Gesamtframe-Messung.

Befund: selectionMoveSurfaces filterte alle Basisflächen und las anschließend
zusätzlich sämtliche unveränderten Vertices für Bounds. Die konservativen Basis-
Bounds enthalten diese bereits. Jetzt werden ausschließlich die neuen Patchvertices
zur Erweiterung gelesen; Faces, Normalen, Höhenbezüge, Reihenfolge, Commitvalidierung
und Shader-/Pufferreuse unverändert. Unveränderte Faces bleiben dieselben Objekte.

Node-Zusammensetzung Median/p95 ms vor→nach:
4 Wände 0,1095/0,2875 → 0,0754/0,2126;
104 Wände 0,4298/0,8273 → 0,1063/0,1615;
1004 Wände 3,1062/3,8841 → 0,5927/0,7898.
Bei 1004 Wänden Gruppierung danach Median 0,5031/p95 0,9163 ms weiterhin global.
Vorgesehene Patchuploads unverändert 6336 Bytes; Vorbereitung separat ca.70 ms.
Lokale Vorher-/Nachherläufe sind kein allgemeines Leistungsversprechen.

Regression prüft identische konservative Bounds zum bisherigen Vollscan,
Geometriegleichheit mit vollständig materialisiertem Modell (nach Wand-ID geordnet),
Referenzidentität stationärer Faces und null Vertexzugriffe auf stationäres OG.
Bestehende Ressourcenchecks sichern Shader-/Bufferreuse, Reorder/Selection/Topology.
Globale Flächenfilterung/Neugruppierung verbleiben explizit; noch keine abgeschlossene
AUD14-03/04- oder Browserframe-Freigabe. Aktive Fortsetzung ausschließlich §9.
Validierung dieses begrenzten Schritts: 1116/1116 Tests, Typecheck, fokussierter ESLint,
git diff --check und Produktbuild bestanden. Kein zusätzlicher Browserframe-Test
für diese geometrisch äquivalente Bounds-Änderung behauptet.

### AUD14-03/04 – gemeinsame Flächenpartition und Pufferpatches (17.10.2026)

Branch `perf/preview-surface-sharing`, Basis main `ac11f33` (PR384/385 gemergt).
`surface-patch.ts` hält abgeleitete immutable Basisindizes per WeakMap und maximal
 eine stationäre Partition pro Basis. Die flache Flächenliste wird erst für
bestehende Verbraucher aufgebaut. BimSolidView filtert die stabile Basis einmal
pro Modell-/Sichtbarkeitskontext, neue Patchflächen mit derselben Sichtbarkeitsregel.
Pufferaktualisierung betrachtet die Vereinigung vorheriger/neuer Ersatz- und
Auswahl-IDs. Abbruch und Closurewechsel stellen alte Flächen wieder her.
Topologie, Sichtbarkeit, neue Basis oder Ursprung führen weiterhin zum vollständigen
sicheren Aufbau; Modellvalidierung, Commit und Undo wurden nicht geändert.

Nachweis: 1119 Tests bestanden (gesamte Suite ohne Test-Unterprozess-Isolation),
Typecheck, gezieltes ESLint und Produktbuild bestanden. Drei neue Regressionen:
exakte Float32-Puffergleichheit inklusive Abbruch/Closure-/Topologiewechsel;
null stationäre ID-Lesungen im warmen Patchpfad bei 10/1000/5000 Wänden;
Sichtbarkeitsreihenfolge geometrisch einschließlich Bounds identisch.
Node v24.19.0, Windows/Ryzen 5 3600, 100 warme + 300 gemessene Iterationen,
zwei ausgewählte EG-Wände: bei 4/104/1004 Gesamtwänden Komposition Median
0,0724/0,0547/0,0560 ms, Pufferaktualisierung 0,1138/0,1115/0,1154 ms;
1004 Wände p95 0,0971/0,1915 ms. Geplante Uploadmenge konstant 6336 Byte.
Vorbereitung bei 1004 Wänden 78,89 ms. Rohlog lokal:
`outputs/preview-surface-composition.jsonl` (außerhalb Repository).

Grenzen: kein GPU-/Browserframe-/Native-Nachweis. Erstaufteilung und wechselnde
Ersatzmengen dürfen die Basis noch filtern. Die flache Liste für Picking/Umrandung
ist weiterhin linear und nicht als insgesamt begrenzter Pointerpfad freigegeben.
CI und praktische Abnahme des Folge-PR bleiben eigenständige Gates. §9 ist die
alleinige aktive Fortsetzung.


### AUD14-03/04 – Browserprüfung nach PR386 (17.10.2026)

Geprüfter main-Commit `b29e8d4`, statischer minifizierter Produkt-Workspace
`bound-height-workspace` auf isoliertem Port 8087, IAB 1230 × 692 CSS-Pixel.
Build: `vite build --config benchmarks/height-acceptance.config.ts` bestanden,
Asset `bound-height-workspace-c81ln4Lq.js`. Keine Nutzerdaten auf 8080 verändert.

Praktisch per Browserbedienung geprüft: EG-Eckwände eg-a/eg-b per Strg-Klick
markiert, 3D geöffnet, On-Demand „Auswahl frei bewegen“, sichtbare Wandecke als
Ursprung gewählt. X-Achse und 2 m eingegeben: Vorschau bewegt beide Wände und
Fenster, OG/KG und unabhängige Wand bleiben stehen. Abbrechen stellt Ausgangslage
wieder her, Undo bleibt deaktiviert. Wiederholt und übernommen: Undo aktiv;
ein Undo nimmt die gesamte Bewegung zurück, Undo danach deaktiviert. Redo stellt
sie wieder her. Alle Ebenen ausgeblendet: keine Wandflächen. Ebenen-Undo stellt
Darstellung wieder her. Orbit per Drag funktioniert; Fenster-Picking danach
zeigt eg-window an eg-a mit unveränderten 1,2 × 1,2 m, Brüstung 0,9 m und Position
0,5. Browser-Konsole: keine Fehler. Screenshot lokal:
`outputs/pr386-browser-acceptance.png` (außerhalb Repository).

Kein neuer Produktcode in dieser Abnahme. Bestehende 1119 Tests/CI von PR386
bleiben der automatisierte Nachweis. Keine kontinuierliche Shift-Geste oder
Framezeit behauptet: Browser-API bietet keinen freien Pointermove mit gehaltenem
Modifier. Zahlenfelder prüfen den echten Vorschau-/Commitpfad, ersetzen diese
Geste aber nicht. Schwere Gesamtframes und Native-/GPU-Abnahme bleiben offen.

Codeprüfung: BimSolidView erstellt Umrandungen mit
`selectedWalls.flatMap(id => selectionEdges(solid.faces.filter(...)))` und erzwingt
so globale Flächenmaterialisierung und je Auswahl-ID einen Gesamtscan. Der
Orbit-Pivot liest beim Pointerdown ebenfalls die Gesamtflächen. useSolidPicking
baut seinen Service während aktiver Bewegung dagegen nicht neu auf (enabled=false).
Diese unterschiedlichen Frequenzen nicht als einen gemeinsamen Pointerbefund
vermischen. Nächster Auftrag ausschließlich §9: begrenzte Umrandungsabfrage über
den vorhandenen gemeinsamen Index, keine neue werkzeugspezifische Geometrie.


### AUD14-03/04 – indexierte Auswahlumrandung (17.10.2026)

Basis main b691e6e nach genehmigtem Merge PR387. Branch perf/indexed-selection-outline.
Die Umrandung in BimSolidView verwendet surfaceFaces aus dem gemeinsamen
surface-patch-Modul statt eines Gesamtscans je ausgewählter Wand. Die Abfrage
liest Ersatzflächen direkt aus dem Patch, unveränderte Flächen aus dem geteilten
Basisindex. Ein ersetztes, aber nicht mehr vorhandenes Element liefert keine
alten Basisflächen. Keine Änderung an Kantenerzeugung, Linienbreite, Farbe,
Sichtbarkeit, Modellaktionen, Commit oder Undo.

1121 Tests bestanden, Typecheck, gezieltes ESLint und Produktbuild erfolgreich.
Zwei neue Regressionen vergleichen exakte Kanten für gebundene verbundene Wände
mit Fenster, Bewegung, entfernte/ausgeblendete/unbekannte Ziele und Abbruch.
Bei 10/1000/5000 Flächen: null stationäre ID-Zugriffe nach Indexvorbereitung,
Patch-Gesamtflächengetter darf werfen und wird bei der Umrandungsabfrage nicht
aufgerufen. Gemeinsame Indizes bleiben abgeleitet und per WeakMap entsorgbar.

Node v24.19.0/Windows/Ryzen 5 3600, 100 Aufwärm- und 300 Messdurchläufe,
zwei ausgewählte EG-Wände. 4/104/1004 Wände: indexierte Umrandung Median
0,1862/0,1967/0,1842 ms; bisheriger Scan im selben Lauf
0,1814/0,1980/0,3184 ms. Bei 1004 Wänden p95 0,2448 statt 0,5032 ms.
Jeder Durchlauf vergleicht die Kantenergebnisse exakt. Rohlog lokal:
outputs/indexed-outline-measurement.jsonl. Keine GPU-/Native-/Framegarantie;
Messreihenfolge indexiert vor Scan, kein statistischer Gesamtperformanceclaim.

Rest: kalter Basisindex linear; leere Darstellung verwendet noch solid.faces.length,
Orbit-Pivot scannt beim Pointerdown. Deshalb keine Behauptung, der gesamte
Vorschauframe sei unabhängig von der Gebäudegröße. Browserabnahme aus PR387 ist
Basisnachweis, keine neue praktische Abnahme dieser Änderung. Aktive Fortsetzung
nur §9; danach Anschlussgruppen/Legacy und CPU-/Native-Bildressourcenvergleich.


### AUD14-03/04 – Leeranzeige und Orbit-Pivot ohne Gesamtflächenzugriff (17.10.2026)

Basis main bba1443 nach genehmigtem Merge PR388, Branch perf/viewport-surface-queries.
Die gemeinsame Patchmetadatenstruktur speichert die exakte Anzahl aus stationären
und neuen Flächen. surfaceFaceCount vermeidet die flache Vorschauliste bei der
Leeranzeige. Der Wandanteil des Orbit-Pivots verwendet surfaceFaces für ausgewählte
IDs. Fensterflächen und cameraFocus-Rückfall bleiben unverändert, ebenso
Kamera-, Modell- und History-Regeln. BimSolidView greift nicht mehr direkt auf
solid.faces zu. Kalte Basisindexierung und Erstpartitionierung bleiben linear.

1123 Tests, Produktbuild, Typecheck und gezieltes ESLint bestanden. Neue Regressionen:
Anzahl bei leerer Basis, vollständiger/teilweiser Entfernung und neu hinzugefügten
Flächen; Getter darf bei der Patchzählung nicht materialisiert werden. Auswahlgrenzen
identisch zum Vollscan für Bewegung, Abbruch, ausgeblendete/fehlende Ziele und
Mehrfachauswahl. Warme gemeinsame Abfragen bei 10/1000/5000 Flächen lesen keine
stationären IDs. Bestehende Fenster-/Kameratests bleiben Bestandteil der Suite.

Node v24.19.0 / Windows / Ryzen 5 3600; zwei ausgewählte Wände, 100 warm + 300
Messdurchläufe. Leerabfrage pro Renderpfad bei 4/104/1004 Wänden Median
0,0006/0,0005/0,0005 ms (nahe Timerauflösung, keine belastbare Beschleunigungsquote).
Wandgrenzenabfrage für Pointerdown separat 0,0110/0,0095/0,0098 ms; bei 1004
Wänden p95 0,0146 ms. Der Probe berechnet dieselben Grenzen und prüft sie in jedem
Durchlauf gegen den Vollscan. Geplante Uploadmenge weiterhin 6336 Byte.
Rohlog lokal outputs/surface-queries-measurement.jsonl. Keine Aussage über
Gesamtframes, native Shift-Gesten oder GPU-Zeit; keine neue Browser-Abnahme.
Fenster-Pivot-Scan bleibt unverändert und ist nicht durch diese Wandmessung belegt.
Aktiver Folgeauftrag ausschließlich §9: große Anschlussgruppen/Legacy-Rest.


### AUD14-04/05 – Anschlussgruppen erneut geprüft (17.10.2026)

Basis main 95a34b6 nach genehmigtem Merge PR389. Kein Produktfix in dieser Prüfung.
connection-group-profile.ts misst nun evaluateGeometry, materialisierte evaluate-
Projektansicht und vollständiges editAtPointer separat. Fünf Fälle: 2/11/51
verbundene Wände, bis 1000 fremde Wände; jede Nebenwand besitzt ein Fenster.
7 warme + 21 gemessene wechselnde Verlängerungs-/Verkürzungsziele je Fall.
Jeder Durchlauf vergleicht vollständiges Projekt und Patchflächen exakt gegen
Vollpfad, außerhalb der Zeitmessung. confirm separat vollständig verglichen;
Null-Länge abgewiesen, entfernte T-Anschlüsse beim starken Kürzen und fremder
Endpunkt zusätzlich auf identische Ergebnisse/Ablehnung geprüft.

Aktueller Rohbeleg: benchmarks/connection-group-audit-results.json.
Node v24.19.0, Windows/Ryzen 5 3600. Geometrievorschau Median/p95 ms:
2 Wände/0 fremde 0,694/1,112; 2/1000 0,834/1,197;
11/100 3,034/3,608; 51/100 11,915/15,805; 51/1000 15,996/17,944.
51/1000: materialisierte Vorschau Median 14,551 ms, Vollpfad 23,444 ms;
Vorbereitung 35,071 ms, einzelner confirm 20,909 ms. Laufstreuung relevant:
vorheriger Lauf desselben erweiterten Vergleichs ergab 51/100 etwa 15,011 ms.
Kein Vorher/Nachher-Fix und keine Browser-/GPU-/Native-/Framegarantie.

Befund: prepareEndpoint.calculate ruft editAtPointer weiterhin auf dem gesamten
lokalen Anschlussprojekt auf. evaluateGeometry vermeidet zwar die anschließende
Gesamtprojektzusammensetzung, aber nicht diese lokale Fachoperation. Die große
Closure ist deshalb selbst teuer; fremde Wände allein erklären den Befund nicht.
Ein separater Node-CPU-Samplinglauf des alten Sieben-Ziele-Vergleichs zeigt
extrudeProfileWithOpenings als größte Self-Time (~157 ms aggregiert); dieser
Lauf mischt Vorbereitung, lokale und vollständige Operation plus Vergleich.
Er beweist keine alleinige Ursache im Pointerpfad. Rohprofil lokal
outputs/connection-group-current.cpuprofile, nicht Browser-Trace.

Abgeleiteter nächster begrenzter Pilot: vorhandenen createWallContourSolidDeriver
(exakte lokale Kontur-/Öffnungseingaben, eine private Cacheposition je Wand)
im vorbereiteten Endpunkt-Lebenszyklus wiederverwenden. Erst prüfen, an welcher
validierten Grenze er ohne doppelte Ableitung eingesetzt werden kann; keinen
Cache auf mutable öffentliche Modelle kleben. Alle Nachbarn/Fenster und gelöste
Anschlüsse behalten, geänderte Eingaben invalidieren, fremde Kontakte weiterhin
vollständig behandeln. Vollständiger confirm und atomare History bleiben Pflicht.
Die Messung/Assertions, Typecheck und gezieltes Lint bestanden. Produktcode blieb
unverändert; kein erneuter Produktbuild oder Volltestsuite für diesen Diagnose-
und Planungsauftrag behauptet. Aktive Reihenfolge ausschließlich §9.


### AUD14-04/05 – vorbereitete Endpunkt-Extrusion wiederverwenden (17.10.2026)

Basis main fa41154 nach genehmigtem Merge PR390. prepareEndpoint besitzt nun
pro Lebenszyklus eine opaque WallSolidReuse-Capability. Sie erlaubt ausschließlich
den vorhandenen createWallContourSolidDeriver (exakte lokale Eingaben, höchstens
ein Cacheeintrag je zugelassener Wand), keine fremde Validierungsfunktion.
Die Capability wird explizit über editAtPointer, moveElementPoint, updateWall und
validateProject bis zur Körperableitung weitergegeben; kein globaler temporärer
Kontext. Sämtliche Schema-/Geometrie-/Anschluss-/Öffnungsprüfungen bleiben aktiv.
Öffentliche Standardaufrufe ohne Capability, vollständiger Fremdkontakt-Fallback
und confirm behalten den unabhängigen vollständigen Pfad.

Die lokal abgeleiteten Körper werden zusätzlich unter der exakten unveränderlichen
Geometriescope-Identität veröffentlicht, die der Renderer bekommt. Die zweite
Weltkoordinatenableitung bleibt derzeit vorhanden, wiederholt aber bei gleichen
Eingaben keine lokale Öffnungsextrusion. Keine Nachbarn aus der Closure entfernt,
keine Modellkopie oder History im Renderer, kein unkontrollierter ID-only-Cache.
Token/Cache werden mit dem vorbereiteten Bearbeitungsvorgang entsorgt (WeakMap).

1125 Tests, Typecheck, gezieltes ESLint und Produktbuild bestanden. Neue Regressionen:
exakte Frischableitung nach Fensterbreiten-, Höhen- und Stärkenänderungen sowie
Rückkehr zur Basis; ungültige Öffnung trotz warmem Cache abgewiesen. 51-Wand-Gruppe
mit fremden Wänden: Verlängerung, Verkürzung, gelöste T-Anschlüsse, Rückkehr,
Patchflächen und confirm exakt gleich zum Vollpfad; Ausgabe unveränderlich,
Quelle unverändert. Vorhandene Fremdkontakt-, Eckgriff-, Undo-/Redo-Tests erhalten.

Gegenmessung gleiche Fixture/Node v24.19.0/Windows/Ryzen 5 3600, 7 warm + 21 Ziele:
51/100 fremde: evaluateGeometry Median/p95 5,999/8,854 statt 11,915/15,805 ms;
51/1000 fremde: 7,989/10,591 statt 15,996/17,944 ms. Rohdaten
benchmarks/endpoint-extrusion-reuse-results.json gegen connection-group-audit-results.json.
Jeder Lauf prüft Projekt-/Flächengleichheit sowie Bestätigung und Grenzfälle.
Frühe Zwischenmessung ohne Veröffentlichung der Renderer-Scope-Körper (3,7–4,2 ms)
ist nicht das Endergebnis. Unterschiedliche Läufe, keine statistische Garantie.

Grenzen: weiterhin vollständige lokale Fachoperation/Parsing/Konturen und zweite
Weltkoordinatenableitung. Kein Browser-/Native-/Frame-/GPU-Nachweis dieses Piloten,
keine Gesamtfreigabe AUD14. Nächster begrenzter Auftrag ausschließlich §9.

### AUD14-04/05 – große Anschlussgruppe im Produktbrowser (19.10.2026)

PR391 ist in main 4e0864c übernommen. Isolierter statischer CadWorkspace auf
127.0.0.1:8087, ohne HMR oder Zustandsinjektion; bestehende Anschlussgruppen-Fixture
mit 51 verbundenen Wänden, 51 Fenstern und 100 fremden Wänden per Query auswählbar.
Nutzerprojekt und Recovery auf 8080 unberührt. Nach Serverneustart Browserzugriff
wieder möglich; vorherige Werkzeugblockade ist kein Produktfehler.

Bestanden: Hauptwand-Endpunkt über On-Demand „Punkt in Flucht strecken“ in 2D
153 → 155 m vorschauen, abbrechen (Achse wieder 153, Undo weiterhin deaktiviert),
erneut platzieren, genau ein Undo und Redo. Anschließend im 3D-Renderer dieselbe
Aktion 155 → 4,5 m: Vorschau und Platzierung lösen 49 der 50 T-Anschlüsse, alle
151 Wände und 51 Fenster bleiben erhalten. Undo stellt alle 50 Anschlüsse wieder
her; Redo/Undo erneut bedienbar. Zwei native Orbit-Drags und Zoom geprüft,
keine erfassten Browser-Konsolenfehler. Vier reale JSON-Downloads (Verlängerung,
Redo, starke Verkürzung, deren Undo) sind vollständig gleich zum unabhängigen
editAtPointer-Vollpfad. Ausgangsfixture berücksichtigt den regulär vom Workspace
angelegten Standardordner Abbildsammlung; keine Bauteilfelder herausgefiltert.
Hashes und Ergebnisse: benchmarks/large-group-browser-evidence.json.

Praktischer Wiederholtest: Testbuild auf 8087 mit ?connectionGroup=large öffnen,
rechtes Ende der vorausgewählten Hauptwand anklicken → Punkt in Flucht strecken
→ Länge 2 → Abbrechen bzw. Übernehmen; Undo/Redo. In 3D bei 500 % Hauptwandende
wählen → dieselbe Aktion → Länge -150.5 → Übernehmen → Undo.

Beleggrenze: numerische Eingabe durch das echte Hilfseingabefenster prüft den
Produktvorschau-/Commitpfad, nicht kontinuierliche native Shift-Zielwechsel.
Keine Frame-, GPU- oder CPU-Sampling-Abnahme und kein Stundenlauf behauptet.
Die 1125 Tests aus PR391 bleiben historische Codeevidenz; dieser Auftrag ergänzt
Browser-/Exportnachweis, Typecheck, fokussiertes Lint und isolierten Build.

Codeeinordnung: prepared-preview.ts zentralisiert registrierte Adapter; null
bleibt ausdrücklich Legacy, materialize bleibt 2D-Kompatibilitätsweg. Im
prepared-wall.ts führt ein neuer t-axis-Kandidat weiterhin editAtPointer plus
connectSnappedT vollständig aus und ersetzt das ganze Geschoss. Dieser sichere
Fremdkontaktpfad wurde durch den Extrusionspiloten nicht optimiert. Lokales Parsing,
Konturen und zweite Weltkoordinatenableitung bleiben ebenfalls Restarbeit.
Aktiver Folgeauftrag steht ausschließlich in §9.

### AUD14-04/05 – neuer T-Fangkontakt, Diagnose (19.10.2026)

PR392 mit grüner CI und ausdrücklicher Freigabe in main 064afe2 übernommen.
Neuer reproduzierbarer Node-Prüflauf: benchmarks/t-axis-contact-profile.ts;
Rohwerte und Hardware/Runtime: benchmarks/t-axis-contact-results.json.
Vier feste Wände (bewegte Wand, zwei mögliche neue Hosts, stationäre Wand), zwei
Fenster; 0/100/1000 fremde Wände. Das Ziel (8,0) bleibt in allen 28 Abfragen gleich.
7 Aufwärmungen, 21 Messwerte; Vorbereitung separat. Messreihenfolge immer
Vorschau → Komposition → unabhängige vollständige Bewegung → T-Verbindung;
Vergleiche und Referenzextrusion außerhalb der Messintervalle. Reihenfolge-/JIT-
Einfluss möglich, keine statistische oder Browserframe-Garantie.

| Fremde Wände | Vorschau Median/p95 ms | Komposition Median ms | Vollbewegung Median ms | T-Verbindung Median ms |
| --- | --- | --- | --- | --- |
| 0 | 0.72 / 1.08 | 0.68 | 0.13 | 0.55 |
| 100 | 2.21 / 5.02 | 1.12 | 0.64 | 1.52 |
| 1000 | 19.25 / 22.70 | 7.36 | 5.73 | 11.90 |

Vorschau ersetzt trotz gleichen Ziels 6/106/1006 IDs (Wände und Fenster).
Die neue Verbindung führt nach editAtPointer in previewTConnection erneut eine
vollständige Prüfung vor und nach dem Einfügen der Relation aus; der Renderer
bekommt das ganze Geschoss. Die Extrusionswiederverwendung aus PR391 betrifft
diesen Fremdkontaktpfad nicht. Messung isoliert keine einzelnen Validatoren:
fullConnect misst die gesamte connectSnappedT-Operation.

Bestanden: exakte Projekt- und komponierte Flächengleichheit zum Vollpfad,
tatsächlich vorhandene neue T-Relation, Hostwechsel 8 → 10 → 8, fehlender Host,
veralteter Kontext, unveränderte Quelle, vollständiger Commit und ein Undo/Redo.
Der unterstützte Erfolgsfall beginnt ohne bestehende T-Relation: Hauptwand und
zugleich Nebenwand ist weiterhin fachlich gesperrt. Ein erster Fixtureversuch
mit dieser Kombination wurde korrekt abgewiesen und nicht als Erfolgszeit gezählt.
Typecheck, gezieltes Lint und bestehende wall-patch-Regressionen geprüft.
Kein Produktcode geändert; kein neuer Produktbuild oder Browser-/Framebeleg nötig
bzw. behauptet. Der letzte Browserbeleg bleibt PR392.

Begrenzte Folgelösung: innerhalb der vorhandenen Application-Capability höchstens
EIN vollständig geprüftes T-Zielergebnis wiederverwenden. Schlüssel: unveränderte
Snapshot-/Sitzungs-/Auswahlbindung, exakte Zielkoordinaten und semantische
Fangreferenz (Host-ID, t-axis); nicht Objektidentität des pro Event neuen Kandidaten.
Kontext vor jedem Treffer prüfen; unveränderliche Ausgabe, keine mutable öffentliche
Projektcache. Ziel-/Host-/Kontextwechsel muss neu prüfen oder abweisen; ungültige
Ergebnisse nicht als Erfolg cachen. Bestätigung bleibt unabhängig vollständig.
Test: gleiches Ziel mit neuen Kandidatenobjekten, Hostwechsel/Rückkehr, Abbruch,
Mutationsversuch, ungültiger Host und vollständiger Commitvergleich.

Das reduziert nur wiederholte Abfragen desselben Fangziels. Erste bzw. geänderte
Ziele und Gesamtgeschosskomposition bleiben proportional und werden ausdrücklich
nicht als skaliert freigegeben. Danach vollständige Vorher-/Nachher-Abhängigkeits-
menge für begrenzte Komposition prüfen; keine stationären Nachbarn abschneiden.
Aktive Reihenfolge ausschließlich §9.

### AUD14-04/05 – sichere Wiederverwendung eines T-Fangziels (19.10.2026)

Auf dem geprüften Diagnosecode aus PR393 implementiert; dessen Mergefreigabe
liegt ausdrücklich vor, die GitHub-CI war bei diesem Nachweis noch in_progress
(ohne gestartete Jobschritte). Kein erfolgreicher Merge vorweggenommen.

prepared-wall.ts hält je vorbereiteter Application-Capability höchstens ein
T-Ergebnis. Vor jedem Treffer wird der bestehende Projekt-/Auswahlkontext geprüft.
Der Schlüssel speichert Werte statt Kandidatenobjekte: Host-ID, exaktes Ziel x/y
und Kandidatenweltpunkt x/y; nur sourceFeature t-axis gelangt in diesen Pfad.
Andere/ungültige Ziele sowie Verlassen des T-Fangs verwerfen den Eintrag.
Neue Kandidatenobjekte mit gleichem semantischen Ziel dürfen ihn wiederverwenden.

Das erste Ergebnis läuft weiterhin über editAtPointer und connectSnappedT.
createProjectSnapshot übernimmt danach die bestehende validierte Ownershipgrenze;
Geometriescope, Patch, Patchliste und IDs sind ebenfalls eingefroren. Diese zusätzliche
Snapshotprüfung kostet beim ersten/geänderten Ziel Arbeit, verhindert aber mutable
Cacheausgaben ohne einen neuen Vertrauensweg zu erfinden. Keine fremden Modelldaten
werden eingefroren. Kein globaler Cache, kein Renderer-Sonderpfad. Confirm bleibt
unverändert unabhängig und vollständig; der Cache schreibt keine History.

1128 Tests einschließlich drei neuer Regressionen, Typecheck, fokussiertes Lint,
Formatprüfung und Produktionsbuild bestanden. Regressionen: semantischer Treffer,
Mutationsversuche, stale Projekt/Auswahl, Hostwechsel/Rückkehr, fehlender Host,
abweichender Kandidatenpunkt, Verlassen des Fangs, neue Capability nach Abbruch,
Commit-/Undo-/Redo-Gleichheit und invalides Modell trotz warmer Vorschau abgewiesen.

Gegenmessung mit unverändertem 0/100/1000-Fremdwände-Parcours und exaktem Projekt-/
Flächenvergleich: wiederholte Vorschau Median 0,0023/0,0024/0,0027 ms statt
0,72/2,21/19,25 ms. Bei 1000 fremden Wänden p95 0,0031 ms; Komposition weiterhin
5,59 ms. Erstes Ziel 27,51 ms, zwei Hostwechsel 21,99/26,15 ms (Einzelwerte, kein
Kaltstart-Quantil). Vorbereitung separat. Ergebnisdatei:
benchmarks/t-axis-target-reuse-results.json; Baseline t-axis-contact-results.json.
Messskript ergänzt Erst-/Wechselkosten, damit warme Treffer keinen vollständigen
Skalierungsnachweis vortäuschen. Node CPU, keine Browser-/Native-/Frame-Garantie.

Praktische Abnahme: Wandachsende an die Achse einer unverbundenen Wand führen,
T-Fang halten, verlassen und erneut anfahren, anderen Host anfahren, abbrechen
bzw. platzieren; ein Undo nimmt die Platzierung zurück. Dieser Auftrag beansprucht
keine neue Browserabnahme; Produktbrowsernachweis aus PR392 bleibt separat.

Rest: alle Geschosselemente werden weiterhin in den Patch aufgenommen; neue Ziele
bleiben vollständig und proportional geprüft. Nächster begrenzter Auftrag gemäß §9:
T-Vorschaukomposition über vollständige Vorher-/Nachher-Abhängigkeitsgruppen
begrenzen, gegen unveränderten Vollpfad inklusive gelöster Nachbarn vergleichen.

### PR394 – Funktionsabnahme und Konfliktauflösung (20.10.2026)

Basis: Produktcode be40398 (= 34dc8e4 plus leerer CI-Neustart), neuer Architekturabgleich b27f712 vollständig erhalten. Nur Abnahme-Fixture und Dokumentation ergänzt; keine Fachlogik geändert. Reproduzierbar mit `benchmarks/height-acceptance.config.ts`, Port 8087, `/benchmarks/bound-height-workspace.html?tTarget=1`.

Vier Wände, zwei Fenster, zunächst keine T-Relation. Im produktiven Grundriss Wandachse Ende → Punkt frei bewegen → Host bei x=8: 8-m-Wand und echte T-Relation gespeichert. Ein Undo liefert exakt ursprüngliche Geschossdaten; Redo stellt den Anschluss wieder her. Danach Host bei x=10: 10-m-Wand, alter Anschluss gelöst, neuer Anschluss gespeichert. Exporte 67/68/70 lokal mit unabhängigen editAtPointer/connectSnappedT-Ergebnissen über sämtliche Geschossdaten verglichen: identisch. Beide Fenster und stationäre Wände enthalten. 3D nach Platzierung und Hostwechsel kontrolliert; Screenshot outputs/pr394-t-host-browser.png. Test-Fixture ist wegwerfbar und vom Nutzer-Workspace auf 8080 getrennt.

Fangtest bei 25 CSS-px/m; bei größerem Zoom ist ein Klick auf die Mitte des Wandkörpers nicht automatisch ein Klick auf die steuernde Achse. Ein erster unscharfer Koordinatenversuch wurde per Undo zurückgenommen und nicht als T-Abnahme gewertet. Zehn Regressionstests prüfen zusätzlich semantischen Warmcache, Hostwechsel, ungültige Ziele, unveränderliche Ausgabe, veralteten Kontext und unabhängigen Commit/Undo. Kein Nachweis kontinuierlicher nativer Hover-/Shift-Gesten oder Gesamtframes durch diese Browseraktionen. Nach erneuter grüner CI ist die bereits erteilte Mergefreigabe anwendbar; danach folgt die begrenzte Vorher-/Nachher-Komposition aus §9.

Berichtspräferenz: künftig geschätzte Aufwandsprozente für Prüfung, Umsetzung, Dokumentation und nächste Schritte angeben; keine exakte Token-/Energiemessung behaupten. In AGENTS.md dauerhaft hinterlegt.
Erneute lokale Prüfung nach Konfliktauflösung: 1128/1128 Tests bestanden; Benchmark-Typecheck, fokussiertes Lint und statischer Produktbrowser-Build bestanden. Bekannte Bundlegrößenwarnung bleibt bestehen.

### AUD14-04/05 – begrenzte T-Komposition (20.10.2026)

Application-Helfer wall-transition-patch.ts verwendet den bestehenden Domain-Abhängigkeitsdienst auf der Vereinigung aller alten und neuen Eck-/T-Relationen. So bleiben auch getrennte alte Partner und vollständige neu erreichte Gruppen in der Ausgabe. Nur diese Wände/Fenster werden ersetzt; fremde stationäre Flächen behalten ihre Identität. Ausgabe einschließlich ihrer Arrays unveränderlich; Eingaben kommen von der bestehenden validierten Snapshotgrenze. Kein Modellkopie-Editor, keine Renderer-Sonderbehandlung und keine neue Fachregel. Cold-Patch-Erstellung scannt weiterhin den geprüften Geschossstand; nur semantisch identische Warmziele verwenden den bestehenden Eintragscache.

Zwölf gezielte Tests: vollständige Flächen-/Fenster-/Achsgleichheit, fremde Endpunkte, ungültige Ziele, alter/neuer Kontext, Abbruch, unabhängiger Commit/Undo, 0/100/1000 Fremdwände und Wechsel zwischen T-Gruppen mit gelöstem alten Host, stationärem neuem Nachbarn und Fenstern. Bei fester kleiner Zielgruppe nur 3 Ersatz-IDs statt vorher 6/106/1006. Node-CPU-Kompositionsmedian bei 0/100/1000 Fremdwänden: 0,130/0,081/0,100 ms (p95 0,215/0,112/0,109 ms). Historische Gegenwerte aus PR394: 0,239/1,029/5,589 ms. Keine simultane A/B- oder Frame-Messung; Rohwerte benchmarks/t-axis-composition-results.json, 7 warme und 21 gemessene Aufrufe. Erster Zielaufruf bei 1000 Fremdwänden weiterhin 25,52 ms; nicht als gelöst ausweisen. Bestätigungsweg bleibt unabhängig und vollständig. Browserabnahme der neuen Patchgrenze ist nächster Auftrag.
Prüfabschluss: 1130/1130 Tests, Produkt- und Benchmark-Typecheck, fokussiertes ESLint und Produktionsbuild bestanden. Neue Browser-/Frame-Abnahme noch offen.

### AUD14-04/05 – Funktionaler Browser-Hostwechsel nach PR395 (20.10.2026)

Basis main 9caaea8; PR395 nach grünem Lauf 39477370638 zusammengeführt.
Statischer Produkt-Workspace auf isoliertem Port 8087, URL
`/benchmarks/bound-height-workspace.html?tTransition=1`. Gemeinsame Fixture
`t-transition-fixture.ts`: fünf Wände, drei Fenster, alte/neue T-Gruppe und
unbeteiligte Wand. Dieselbe Fixture dient dem vorhandenen Patchvergleichstest.

Im Browser wall-2 auswählen, Achsende → Punkt frei bewegen; bei 25 px/m auf
new-host klicken. Endpunkt (3,0) wird (3,3). Alte Verbindung zu wall-1 löst sich;
new-host behält new-neighbour und erhält wall-2. Alle Fenster und die unbeteiligte
Wand bleiben erhalten. Ein Undo stellt den vollständigen Ausgangsstand wieder her,
Redo den vollständigen Zielstand. Erneuter Beginn/Abbrechen verändert ihn nicht.
3D nach Redo visuell geprüft; keine erfassten Browser-Konsolenfehler.

Fünf echte Browserdownloads (lokal novikov-project (71) bis (75).json) unabhängig
mit `benchmarks/t-transition-export-check.ts` verglichen: vollständige Geschossdaten
entsprechen Fixture bzw. editAtPointer + connectSnappedT, alle fünf Vergleiche bestanden.
Reproduktion: `node --experimental-strip-types benchmarks/t-transition-export-check.ts
<before.json> <placed.json> <undo.json> <redo.json> <cancelled.json>`.
Screenshot lokal `outputs/t-transition-3d.png` im Aufgabenordner.
Zwölf gezielte wall-patch-Tests, Benchmark-Typecheck, fokussiertes ESLint und
statischer Browserbuild bestanden; bekannter Bundlegrößenhinweis bleibt.

Beleggrenze: reale UI-Platzierung im Grundriss und statischer 3D-Zielzustand,
keine kontinuierliche 3D-Hover-/Shift-Vorschau, CPU-Sampling oder Frame-Abnahme.
Die automatisierte Flächengleichheit der Vorschau ersetzt diese offenen Gates nicht.
Keine Änderung am Produktpfad oder der vollständigen Commitvalidierung.
Einziger nächster Auftrag in §9: erste/geänderte T-Ziele phasenweise messen.


### AUD14-04/05 – Kosten erstmaliger und wechselnder T-Ziele (20.10.2026)

PR396 nach grünem CI-Lauf 39478689937 in main 8201f8d übernommen.
Messung ohne Produktänderung: `benchmarks/t-target-phase-profile.ts`, Rohdaten
`t-target-phase-results.json` und unabhängiger Wiederholungslauf
`t-target-phase-repeat-results.json`. CPU/Node/Plattform stehen in den Rohdaten.
Gemeinsame T-Übergangsfixture plus zweiter Host und 0/100/1000 Fremdwände.
Pro Profil 7 Aufwärm- und 21 Messpaare; frische Capability pro Paar, erstes Ziel
new-host und gewechseltes Ziel alternate-host, jeweils zusätzlicher identischer Treffer.
„Erstes Ziel“ bedeutet kalt innerhalb der Sitzung, nicht kalter Prozess/Browser.

| Fremdwände | Erstes evaluate, Median ms | Hostwechsel, Median ms |
| --- | --- | --- |
| 0 | 2,256 | 2,304 |
| 100 | 4,321 | 4,622 |
| 1000 | 29,071 | 28,914 |

Bei 1000 Fremdwänden Phasenmediane: editAtPointer 5,953 ms,
connectSnappedT 12,690 ms, createProjectSnapshot 6,797 ms,
wallTransitionPatch 0,251 ms. Identischer Treffer 0,0022 ms.
Wiederholung bestätigt Größenordnung: erstes Ziel 29,560 ms, Wechsel 29,515 ms;
Anschluss 12,562 ms, Snapshot 6,841 ms, Scope 0,248 ms.
Mediansummen sind nicht der Median der Summe. Phasenrekonstruktion und echtes
evaluate sind getrennte Ausführungen; feste Reihenfolge/JIT/GC können beeinflussen.
Keine Subtraktion zu behaupteten eingesparten Browserframes.

Jede Phasenkette verwendet öffentliche Produktionsfunktionen in derselben Reihenfolge;
der resultierende Patch wird vollständig mit echtem evaluate verglichen, Warmtreffer
per Identität, sieben/fünf Ersatz-IDs, drei Fenster, zwei Beziehungen und unveränderte
Quelle geprüft. Zwei Läufe ergeben 336 erfolgreiche Fallvergleiche inklusive Aufwärmung,
252 aufgezeichnete Messfälle. Typprüfung und fokussiertes ESLint bestanden.
Kein erneuter Produktbuild notwendig: ausschließlich Benchmark und Dokumentation geändert.

Befund: Die neue Scope-Begrenzung ist günstig. Die volle Anschlussaktion ist der größte
Phasenanteil; Codebefund previewTConnection enthält zwei validateProject-Aufrufe,
anschließende Ownership-Übernahme prüft erneut. Das rechtfertigt einen gezielten
Vertrag für bereits geprüfte Eingaben, aber keinen Verzicht auf endgültige fachliche
Prüfung. Einziger nächster Auftrag in §9. Native-/Frame-Gates bleiben offen.


### AUD14-04/05 – Geprüfte Snapshots im T-Anschluss wiederverwenden (20.10.2026)

PR397 nach grünem Lauf 39479563564 in main 81a5b17 übernommen.
Entwicklungszweig perf/owned-t-connection: previewTConnection erkennt ausschließlich
private Factory-Provenienz (isOwnedProjectSnapshot). Solche Eingaben dürfen ihre
Eingangsprüfung wiederverwenden; jedes geänderte Resultat wird vollständig durch
createProjectSnapshot validiert, kopiert und tief eingefroren. Mutable öffentliche
Eingaben behalten Ein-/Ausgangsprüfung und mutable Rückgabe. Object.freeze oder
Shallow-Copy verleiht keine Provenienz; keine neue Vertrauensmarke/API eingeführt.

Der vorbereitete Endpunktpfad übernimmt sein Bewegungsergebnis zunächst vollständig
geprüft in einen Snapshot. Der T-Anschluss erzeugt daraus wiederum einen vollständig
geprüften Snapshot; die abschließende Ownership-Grenze verwendet diesen wieder.
Netto drei statt vier vollständige Prüfungen im erfolgreichen neuen T-Zielpfad:
Bewegung, Snapshot des Zwischenstands, Snapshot des Anschlussresultats. Die Prüfung
wird teilweise vorgezogen, nicht als ungesicherte Annahme entfernt. Der unabhängige
Commitpfad und unveränderte öffentliche mutable Aufrufe bleiben erhalten.

1132 Tests bestanden (darunter 39 gezielte T-/Patchfälle), Benchmark-Typecheck,
fokussiertes ESLint und Produktbuild. Bekannte Bundle-/Vite-Konfigurationshinweise
bleiben. Tests ergänzen Gleichheit zum mutable Vollpfad, connect/disconnect,
fehlenden Host, veralteten Kontext, Mutation von Resultat/Request, eingefrorene
ungültige Fremddaten und unveränderte mutable Rückgabe.

Messung mit erweitertem t-target-phase-profile.ts: beide Varianten im selben Lauf,
getrennte Eingangs-Snapshotphase und abschließende Snapshot-Wiederverwendung.
Rohdaten t-target-owned-results.json und t-target-owned-repeat-results.json.
Je 7 Aufwärm-/21 Messpaare bei 0/100/1000 Fremdwänden; alle 336 Fallvergleiche
inklusive Aufwärmung entsprechen dem bisherigen vollständigen Pfad. Bei 1000
Fremdwänden Median erstes Ziel 25,051 / 24,139 ms gegenüber 29,221 / 29,794 ms;
Hostwechsel 20,325 / 19,595 ms gegenüber 30,468 / 29,635 ms. Nicht pauschal auf
Frames übertragen: Node-CPU, feste Messreihenfolge, mögliche JIT-/GC-Einflüsse,
keine neue Browserabnahme. Erste/geänderte Ziele bleiben deutlich teurer als
identische Warmtreffer. Praktische Abnahme ist der einzige nächste Auftrag in §9.


### AUD14-04/05 – Browserabnahme der Snapshot-Wiederverwendung (20.10.2026)

PR398 nach grünem Lauf 39488219431 in main 5c709ee übernommen.
Statischer Produktbrowser-Build des PR-Commits bfdc195 erfolgreich, bekannter
Bundlegrößenhinweis. Isolierte URL auf Port 8087:
`/benchmarks/bound-height-workspace.html?tTransition=1`.
Keine Produkt- oder Fixtureänderung für diese Abnahme.

Fünf Wände, drei Fenster, alte/neue T-Gruppe und unbeteiligte Wand. wall-2
über Achsende → Punkt frei bewegen von (3,0) auf (3,3) an new-host platziert.
Alte Relation löst sich; neuer Host behält seinen stationären Nachbarn und
erhält wall-2. Ein Undo/Redo und erneuter Bearbeitungsbeginn mit Abbruch geprüft.
Fünf frische Browserexports (lokal novikov-project (76) bis (80).json) durch
t-transition-export-check.ts verglichen: vollständige Geschossdaten entsprechen
Ausgangsfixture / unabhängigem Vollpfad / Ausgangsfixture / Vollpfad / Vollpfad.
Alle fünf Vergleiche bestanden. Kein bloßer Vergleich der geänderten Wand.

3D-Zielzustand visuell kontrolliert, keine erfassten Konsolenfehler. Screenshot:
outputs/owned-t-browser-3d.png im lokalen Aufgabenordner. Nachweis betrifft
UI-Platzierung im Grundriss und statische 3D-Darstellung; keine kontinuierliche
3D-/Shift-Geste, keine neue Frame- oder Kapazitätsfreigabe.
Die 1132 Tests, Typprüfung, Lint und Produktbuild aus PR398/CI bleiben gültige
Basis; für diesen reinen Dokumentationsschritt nicht erneut ausgeführt.
Nächster begrenzter Auftrag ausschließlich §9.


### AUD14-04/05 – Bewegung und Snapshot gemeinsam prüfen (20.10.2026)

Basis main 06a9dc0 (PR399), Umsetzung Branch perf/owned-wall-movement.
Die gemeinsame Wandaktion kann statt einer veränderlichen Kopie direkt einen
vollständig validierten, tief unveränderlichen Snapshot liefern. Die private
WeakSet-Provenienz wird weiterhin ausschließlich durch createProjectSnapshot
vergeben. Der Ausgabemodus ist keine Vertrauensmarke: Auch fremde oder nur vom
Aufrufer eingefrorene Daten werden vollständig geprüft. Öffentliche mutable
Aufrufe behalten ihren bisherigen Vertrag; keine zweite Geometrieimplementierung.
Nur der vorbereitete T-Wandendpunktpfad verwendet die neue Ausgabe. Andere
Aktionszweige bleiben unverändert. Geändertes Anschlussresultat und unabhängiger
Commit werden weiterhin vollständig geprüft; kein Schema-, History-, Recovery-
oder Exportformatwechsel. Im erfolgreichen neuen T-Pfad entfallen drei zugunsten
von zwei vollständigen Prüfungen (Bewegung und Anschlussresultat).

Nachweise: 1134/1134 Tests, darunter 14 wall-patch-Tests; Benchmark-Typecheck,
gezieltes ESLint aller sieben geänderten TS-Dateien und Produktbuild bestanden.
Bekannte Buildhinweise zu Chunkgröße/inlineDynamicImports bleiben. Neue Tests:
Achspunkt, Körperkante und Strecken gegen mutable Vollpfad, Mutationsschutz,
unveränderte Quelle, ungültige Fremdwand, veralteter Kontext und NaN-Ziel.

Direkter Node-v24.19.0-Vergleich auf Windows, AMD Ryzen 5 3600, zweimal
7 Aufwärm- und 21 aufgezeichnete Fälle je Erstziel/Hostwechsel und 0/100/1000
Fremdwände. Insgesamt 336 Fallvergleiche inklusive Warmup, 252 Messfälle.
actualEvaluateMs: echter vorbereiteter Adapter; previousMs: expliziter bisheriger
PR398/399-Pfad mit separater Bewegungs-/Snapshot-Prüfung; legacyMs: älterer
Vier-Prüfungen-Pfad. Identische Patches gegen beide Vergleichspfade; drei Fenster,
Anschlüsse, begrenzte Ersatz-IDs und unveränderte Basis geprüft.

| 1000 Fremdwände, Median ms | bisher / neu Lauf 1 | bisher / neu Lauf 2 |
| --- | --- | --- |
| Erstes T-Ziel | 24,537 / 15,584 | 25,276 / 20,546 |
| Wechselndes T-Ziel | 20,443 / 17,211 | 27,821 / 15,656 |

Rohdaten: benchmarks/t-target-owned-move-results.json und
benchmarks/t-target-owned-move-repeat-results.json; reproduzierbar über
node --experimental-strip-types benchmarks/t-target-phase-profile.ts.
Messreihenfolge fest; JIT/GC und deutliche Schwankungen begrenzen die Aussage.
Bei 100 Fremdwänden P95 des neuen Erstziels teilweise schlechter; kein
allgemeines Latenz- oder Frameversprechen. Phasen/actual/previous sind getrennte
Ausführungen; Phasenmediane nicht addieren. Erste Ziele sind sitzungs-, nicht
prozesskalt. Zwei volle Modellprüfungen und Restscans bleiben globale Arbeit.
Keine neue Browser-, Native-, Shift- oder Frameabnahme. Aktiver Folgeauftrag §9.


### AUD14-04/05 – Browser- und Architekturabnahme PR400 (21.10.2026)

PR400 nach grüner CI 39621656423 am geprüften Head dc385a1 in main b567902
integriert. Nur Dokumentationskonflikte mit a70a386 gelöst; neuer Änderungs-Gate
und aktualisierte Folgeprioritäten vollständig erhalten. Keine Produktänderung
in diesem Abnahmeschritt. 1134 Tests, beide Typprüfungen, Lint und Build in CI
bestanden. Frischer statischer Abnahmebuild mit height-acceptance.config.ts;
bekannter Chunkgrößenhinweis, keine neue Produktwarnung.

Änderungskarte / Abschlusskarte zum neuen §9 (auch im PR vor Merge dokumentiert):
- Nutzerziel AUD14-04/05: dieselbe T-Endpunktbewegung mit weniger Doppelprüfung.
  Normal: wall-2 von wall-1 auf new-host. Grenzfall: zurück zum alten Host,
  gelöste Nachbarn/Fenster, Abbruch und ein Undo/Redo. Keine neue Funktion.
- Eigentümer: Domain-Factory validiert/private Provenienz; gemeinsame Wandaktion
  besitzt Regeln, prepared-wall koordiniert Patch. Ein BIM-Modell, stabile IDs,
  bestehender Geschosskontext und Meter. Keine UI-Modellkopie.
- Gemeinsamer Weg: editAtPointerSnapshot und mutable editAtPointer verwenden
  denselben Evaluator/updateWall. Unabhängiger Commit vollständig; kein AI-
  Sonderpfad. Schema/Recovery/IFC-Format, Windows/macOS-Adapter unverändert.
- AST-Importprüfung von 376 produktiven Dateien: neue Laufzeitpfeile model.ts
  und direct-edit.ts zu domain/project/owned-snapshot.ts besitzen keinen
  Rückweg. domain/geometry/constraints ohne UI/Renderer/Interop/Application-
  Import. Existierender contour/offset-Laufzeitzyklus bestätigt, nicht behoben.
  Das ist ein einmaliger Abgleich, noch kein dauerhafter CI-Gate.

Browser: isolierter Port8087, bound-height-workspace.html?tTransition=1.
Fünf Wände/drei Fenster, alte und neue T-Gruppe sowie unbeteiligte Wand.
Reale UI-Auswahl über Wand/Endpunkt und Punkt frei bewegen, Ziel (3,3) geklickt.
Downloads novikov-project (81) bis (85).json in Downloads: vorher, platziert,
ein Undo, Redo, erneuter Bearbeitungsbeginn/Abbruch. Bestehender Checker
benchmarks/t-transition-export-check.ts vergleicht alle Geschossdaten gegen
Ausgangsfixture und unabhängige mutable Aktion: alle fünf bestanden.
Danach realer Rückwechsel von (3,3) auf (3,0) an wall-1; Export (86).json
entspricht vollständig in den Geschossdaten connectSnappedT(editAtPointer(...))
aus dem exportierten Redo-Zustand, nicht bloß der bewegten Wand.

Statischer 3D-Zielzustand visuell kontrolliert, keine erfassten Konsolenfehler.
Screenshot lokal outputs/owned-move-browser-3d.png. Dokumentierte Grenzen:
kein kontinuierlicher Mousemove-/Shift-/Native-/Frame-Nachweis; UI-Platzierung
ist kein direkter Beleg jedes Zwischenframes. Kein neuer IFC- oder Recovery-
Rundlauf, da deren Code/Format unverändert; bestehende Nachweise erhalten.
Keine pauschale AUD14-Gesamtfreigabe. Nächster Einzelauftrag ausschließlich §9.


### Architekturgrenzen-Gate – Änderungskarte und Nachweis (21.10.2026)

Basis main 0b61be1/PR401; Branch test/architecture-boundaries. Betroffener Vertrag:
§9 Änderungs-Gate, A04/gemeinsame Aktionen, AUD14-04/05 Wartbarkeit.
Ziel: neue verbotene Importpfeile und neue Laufzeitzyklen vor Übernahme erkennen.
Normalfall: Component -> Application -> Domain besteht. Negativfall: Domain ->
Component oder ein zusätzlicher Laufzeitzyklus scheitert. Bestehende Ausnahmen
sind dokumentierte Abbauschuld, keine Zielarchitektur.

Eigentümer ist Build-/CI-Tooling unter scripts/, Quelle sind produktive
src/**/*.ts/tsx und tsconfig.json. Keine Modell-/UI-Daten werden geladen oder
Produktmodule ausgeführt. Stabile Bauteil-IDs, Geschosse, Maße/Sichtbarkeit sind
nicht betroffen. Keine neue Application-Aktion: Maus/AI/Preview/Commit/Undo,
2D/3D, Datei/Recovery/IFC und Plattformadapter bleiben bytegleich unverändert.
Daher keine erneute Browser-/Export-/Recovery-Abnahme für diesen Tooling-Schritt.
Keine zusätzliche Paketabhängigkeit: vorhandener TypeScript-Compiler wird genutzt.

Befehl npm run check:architecture führt acht Tests und den tatsächlichen
Repository-Check aus, als eigener CI-Schritt vor npm test. Der Parser erfasst
Importe, Re-Exports, import-Typen, require und literale dynamische Importe.
TypeScript-Auflösung berücksichtigt @/, Endungen und Indexmodule. Laufzeitgraph
nutzt emittierte JS-Importe, Typkanten bleiben für Schichtprüfung relevant.
Nichtliterale dynamische Importe, unauflösbare lokale Module und Produktions-
importe in ausgeschlossene Tests werden abgewiesen. CSS/Bild-/Font-Assets
werden nicht als TS-Module behandelt.

Regeln: Kernschichten dürfen keine äußeren internen Schichten importieren;
React/UI-Pakete in Kern/Application/Interop/Legacy gesperrt. Application ->
Interop sowie neue lib/bim-Konsumenten/Rückgriffe sind begrenzt. Interop darf
Application-Typports referenzieren; Laufzeitaufrufe benötigen explizite Ausnahme.
Rendering/Components-Fachverantwortung oder direkte Browser-Globalnutzung lässt
sich aus Importkanten nicht vollständig beweisen und bleibt Gegenstand des
Änderungs-/Abschlussreviews. Kein allgemeiner Architekturkorrektheitsbeweis.

Inventar: 376 produktive Dateien, 1484 eindeutige interne Quelle-Ziel-Kanten
(anders als die historische Zahl einzelner Importdeklarationen). 104 bestehende
Grenzabweichungen in 16 Zuständigkeitsgruppen; jede Kante exakt in
scripts/architecture-exceptions.json, mit Begründung/Eigentümer/Abbauziel.
Zwei zyklische Kanten contour <-> offset separat erfasst. Keine Wildcards,
kein Regenerationsbefehl im Gate; neue/erweiterte Zyklen, veraltete oder doppelte
Ausnahmen und fehlende Metadaten scheitern. Typ-only -> Runtime am selben
zulässigen Typport wird erneut geprüft. Weitere semantische Prüfungen bleiben
bei Typecheck und fachlichem Review.

Abnahme: acht Tests für erlaubte Schichtung, negative Grenzen, Typ-/Mischimporte,
Aliase desselben Ziels, dynamische Importe, fehlende Module, Zykluserweiterung
und veraltete Ausnahmen. Zusätzlich echte kurzlebige Probe in src/domain:
Import der CadWorkspace-Komponente führte im tatsächlichen CLI zu Exit1.
Probe unmittelbar entfernt, danach Gate grün. 1134 vorhandene Tests und beide
Typprüfungen, fokussiertes Lint der neuen MJS-Dateien und Produktbuild bestanden.
Vollständiges lokales Lint meldet 1967 CRLF-Formatfehler in unveränderten
Altdateien sowie sechs bekannte Warnungen; lokale generierte dist-*-Verzeichnisse
wurden ausgeschlossen. Kein Massenformatieren. Linux-CI prüft den Git-Stand
vollständig; Ergebnis separat im PR. Bekannte Buildhinweise unverändert.
Produktdateien unverändert; neuer Checker importiert nur Node/TypeScript, keine
Produktabhängigkeit auf den Checker. Bekannter contour/offset-Zyklus bewusst
nicht behoben; nächster Einzelauftrag §9.


### Architekturvertrag / AUD14-04 – Konturzyklus entfernt (21.10.2026)

Basis main 6314460 (PR402); Branch refactor/contour-source. Änderungskarte vor
dem Code im Auftrag: Linien-/Schraffur-Offset und Seitenbearbeitung unverändert
erhalten, den gegenseitigen Laufzeitimport beseitigen. Normalfall geschlossene
Kontur; Grenzfälle offene/ungeeignete Kontur, Cap, Abbruch und atomarer Undo.

Eigentümer Application: contour-source.ts liest im bestehenden Arbeitsgeschoss
per stabiler Ziel-ID aus dem Projekt. Funktionskörper von closedContour unverändert
verschoben; Project-Typ direkt aus domain/project/schema. contour.ts reexportiert
für bisherige Aufrufer; offset.ts liest direkt aus dem neuen Modul. Keine neue
Geometrieregel, Modellkopie, Mutation oder UI-Verantwortung. Vorschau-Caches,
Vorbereitung, endgültige Validierung, Commit und History unverändert. Keine neue
AI-Aktion, Format-/Recovery-/IFC-Migration oder Plattformabhängigkeit.

Diff-Abschluss: beide Module importieren die gemeinsame Leseabfrage; nur contour
importiert noch offset. Kein Rückweg, keine neue Schichtverletzung. Zwei obsolete
Zykluskanten aus Ausnahmen entfernt; 104 übrige Grenzabweichungen nicht erweitert.
Graph: 377 Produktionsdateien, 1486 interne Kanten, null Laufzeitzyklen.

Nachweise: 14 vorhandene line/hatch-edge/offset-Tests vor und nach Extraktion
bestanden, inklusive vorbereiteter/Vollpfad-Gleichheit, ungültiger Geometrie,
kleiner Kontur/1%-Cap, fremdem Geschoss, Abbruch/Undo. Gesamtsuite 1134/1134,
acht Architekturtests, beide Typechecks, gezieltes ESLint und Produktbuild grün.
Bekannte Chunk-/inlineDynamicImports-Hinweise bleiben.

Frischer statischer Produktbuild auf isoliertem Port8087, normale Dateiimport-UI:
Rechteck-Schraffur (0,0)-(4,3), geschlossene Polylinie (6,0)-(10,3). Beide über
On-Demand-Offset um +0,5 m erweitert. Vollständige Geschossdaten von vier echten
Browserexports (87)-(90) gegen explizit erwartete Koordinaten verglichen:
Linienoffset, Schraffuroffset nach Linien-Undo, Schraffur-Undo, Redo plus erneuter
Vorschau/Abbruch. Alle identisch; Muster/andere Elemente erhalten. Keine erfassten
Konsolenfehler. Screenshot lokal outputs/contour-cycle-browser.png.
Keine Interaktionsänderung und keine neue Geschwindigkeitsbehauptung. 3D-/IFC-/
Recoverycode und Schema unberührt; keine neue Native-/Frame-/Recovery-Abnahme.
Bestehende automatisierte Ableitungs-/Exportprüfungen grün. Weitere AUD14-Gates
bleiben offen; genau ein nächster Auftrag ausschließlich §9.


### AUD14-03/04 – Globale 3D-Vorschaudienste gemessen (21.10.2026)

Änderungskarte vor Umsetzung: Basis main 738ce18/PR403, Branch
perf/global-preview-profile. Nutzerziel: Restarbeit vor einer weiteren Optimierung
belegen. Nur Diagnose unter benchmarks/, keine neue Produktregel/Abhängigkeit.
Zwei ausgewählte EG-Wände und mitbewegtes Fenster bleiben konstant; 0/100/1000
unbeteiligte EG-Wände, zweite Serie zusätzlich je ein Fenster. Drei Geschosse,
weitere OG-Wände/Fenster unverändert. Eigentümer Modell/Validierung bleibt Domain,
gemeinsame vorbereitete Bewegung Application, Ableitung und Puffer Rendering.
Stabile IDs, Geschosshöhen, Meter, ein Modell; keine UI-/AI-Mutation.

Reproduktion: node --experimental-strip-types benchmarks/global-preview-profile.ts
Zwei frische Node-v24.19.0-Prozesse, Windows/AMD Ryzen 5 3600; Rohdaten
benchmarks/global-preview-results.json und global-preview-repeat-results.json.
Je sechs Fälle, je 200 Vorschauen: erste separat, 50 Warmup, 150 warme Messwerte.
Feste Fall-/Phasenreihenfolge; GC/JIT und Betriebssystemlast begrenzen Aussagen.
Vorbereitung ist sitzungskalt, nicht prozesskalt für jeden Fall.

| Warmer Median, zusätzliche Fenster mitwachsend | 2 Fenster Lauf1/2 | 102 Fenster Lauf1/2 | 1002 Fenster Lauf1/2 |
| --- | --- | --- | --- |
| Gebäude-Fensterbasis neu (ms) | 0,0150 / 0,0145 | 0,1413 / 0,1721 | 1,1134 / 1,1071 |
| Wandflächen-Komposition (ms) | 0,0521 / 0,0738 | 0,0532 / 0,0532 | 0,0296 / 0,0302 |
| Wandpuffer-Update (ms) | 0,1036 / 0,1050 | 0,1026 / 0,1038 | 0,1079 / 0,1102 |

1002 Fenster: Fensterbasis P95 2,433/2,253 ms. Diagnose mit einmalig
vorbereiteter Fensterbasis: verbleibende Listenkomposition 0,0295/0,0329 ms
Median; weiterhin linearer Filter, keine behauptete O(1)-Gesamtlösung.
Wandumrandung/Leerabfrage ca. 0,181/0,183 ms. Ohne zusätzliche Fenster wächst
die Basis wegen des Wandindex-Aufbaus von ca. 0,015 auf 0,067/0,068 ms.

Kaltes Restproblem getrennt: bei 1004 Wänden/1002 Fenstern Vorbereitung
Aktion 21,37/15,25 ms, Solid 69,23/64,26 ms, initialer Puffer 89,89/81,74 ms;
erste Flächenkomposition 5,20/5,00 ms. Keine Vermischung mit warmen Pointerkosten.
Geplante initiale Wand-Uploads 4620672 Byte, warme 6336 Byte in allen Fällen,
keine vollen Pufferrebuilds während der 200 Vorschauen. Dies sind CPU-seitig
geplante Wandpufferbytes, keine GPU-Messung; Umrandungsuploads nicht enthalten.

Codebefund BimSolidView: windowSurfaces-useMemo hängt an geometryPatch und ruft
dabei buildingWindowSelectionSurfaces(previewProject, allows) erneut auf. Im
vorbereiteten Pfad bleibt previewProject das unveränderte Projekt. Dagegen
arbeiten selectionMoveSurfaces/solid-buffer warm auf der gemeinsamen Basis.
Der nächste begrenzte Eingriff ist deshalb Wiederverwendung der Fensterbasis,
nicht erneuter Austausch der bereits begrenzten Wandflächenkomposition.

Abnahme: pro Fall vollständige Wandflächen/Fenster-Auswahlflächen gegen das
materialisierte und vollständig validierte Projekt verglichen, konservative
Vorschaubounds umfassen alle Vollmodellvertices. Vergleich außerhalb der Timings;
kein Zugriff auf den lazy Gesamtflächen-Getter im Messloop. Das ist Ableitungs-
gleichheit zur materialisierten Aktion, kein unabhängiger Nachweis ihrer Fachregel.
Benchmark-Typecheck, gezieltes Lint und Architektur-Gate bestanden. Keine src-/
CI-/Paketänderung, keine zusätzlichen Zyklen oder Modellkopien im Produkt.
Bestehende 1134 Produkt-/acht Guard-Tests am Basiscommit in CI grün; nicht erneut
lokal für reine Diagnose ausgeführt. Keine UI-Änderung, daher keine neue
Interaktions-/Undo-/IFC-/Recovery-Browserabnahme in diesem Schritt.

Grenzen: all-visible Predicate, synthetische unverbundene Restwände, eine feste
Auswahl und stabile Closure. Keine React-Scheduler-, Projektion-, Snap-,
Pointerereignis-, GPU-/Native-/Gesamtframezeiten; tatsächliche Sichtbarkeit,
Closure-/Topologiewechsel und komplette S1-Szene nicht als gemessen darstellen.
Keine allgemeine Performancefreigabe; AUD14 bleibt teilweise offen. §9 führt
allein den nächsten ausführbaren Auftrag.


### AUD14-03/04 – Stabile Fensterbasis und Objektvertrag (21.10.2026)

Nutzerentscheidung: Fenster als Objekte beziehungsweise künftige Bibliothekselemente
behandeln. Stabile IDs, Host-/Geschosszuordnung und fachliche Maße bleiben im Modell;
Darstellung darf künftig flexibel ersetzt werden. Aktuelle Hit-/Outline-Flächen
sind wegwerfbare Ableitungen, kein festgeschriebenes Bibliotheksformat. Ein späterer
Bibliotheksdefinitions-/Darstellungsversionswechsel muss die abgeleitete Basis
invalidieren; ein heute noch nicht existierendes Versionsschema wird nicht erfunden.

Änderungskarte vor Code: Basis bf543d0/PR404, Branch perf/stable-window-preview-base.
Bestehende gemeinsame buildingWindowSelectionSurfaces-Abfrage bleibt Eigentümer
der Renderableitung. BimSolidView trennt lediglich zwei useMemo-Lebensdauern:
windowBase hängt an previewProject, project und visibility; windowSurfaces zusätzlich
an geometryPatch. Bei vorbereiteter Bewegung bleibt previewProject die Basis,
bei Legacy-Vorschau ändert es sich und wird neu abgeleitet. Modell-/Höhen-/
Geschossänderungen liefern ein neues Projekt; Sichtbarkeitswechsel eigene Policy.
Kein globaler Cache, keine unbeschränkte Historie, kein neuer Import oder Renderer-
Fachzweig; keine Fachgeometrie dupliziert. React darf Memoisierung verwerfen, ohne
Korrektheit zu ändern. Kein Schema-/IFC-/Recovery-/AI-/Undo-Eingriff.

Neue Regression: Fensterbasis über vier Patchziele unverändert, vollständige
Fensterflächen gegen materialisierte gemeinsame Aktion, geändertes Modell,
ausgeblendeter Host und ausgeblendetes Fenster. Verbundene Nachbarn können Teil
der Patch-Closure sein: Geometriegleichheit statt falscher Referenzidentität.
Gesamtlauf: 1134 bisherige Tests bestanden; anfänglich eine neue Testannahme zur
Nachbaridentität korrigiert, danach alle fünf window-preview-Tests grün. Beide
Typechecks, gezieltes Lint, Architektur-Gate (null Zyklen), Produkt-/Abnahmebuild
bestanden. Bekannte Buildhinweise bleiben. Nur BimSolidView als Produktdiff,
keine Rückabhängigkeit, Modellkopie oder neue Mutationsregel.

Gegenmessung benchmarks/stable-window-base-results.json, gleicher Aufbau wie
PR404, node --experimental-strip-types benchmarks/global-preview-profile.ts.
Alter Basisaufbau/alte Patchkomposition und neuer Pfad getrennt gemessen.
1002 Fenster: Basis alt 1,0825 ms Median / 2,1518 ms P95, alte Komposition
0,0381 ms Median; neue Komposition mit wiederverwendeter Basis 0,0327 ms Median /
0,0457 ms P95. Phasenmediane nicht als gemessenen Gesamtrahmen addieren.
Weiterhin linearer Fensterlistenfilter; keine O(1)-Behauptung. Sechs synthetische
all-visible Fälle, feste Auswahl/Closure; GPU/React/Native/Frame nicht gemessen.

Frischer statischer Produktbrowser auf isoliertem Port8087: EG-Fenster in 2D
ausgewählt, in 3D entlang der Wand von Position 0,5 auf 0,725 platziert; Undo/Redo,
erneute Auswahl, Fensterebene aus und über Ebenen-Undo wieder ein. Vorschau erneut
begonnen und abgebrochen; Position 0,725 erhalten, keine Konsolenfehler. Screenshot
outputs/stable-window-browser.png. Kein kontinuierlicher Pointer-/Mehrfachwand-
oder Exportvergleich in diesem Smoke; kombinierte Abnahme ist nächster §9-Auftrag.


### AUD14-03/04 – Kombinierte Fensterbasis-Browserabnahme (21.10.2026)

Basis c18c64b/PR405, CI 39628250370 grün vor Merge. Änderungskarte: ausschließlich
Abnahme/Diagnose im Branch test/window-base-browser. Gemeinsame Application-
Bewegung und Geschossaktionen sind Vergleichsquelle; Fenster bleiben Objekte,
Darstellung abgeleitet. Keine Produkt-/Modell-/Schema-/Recovery-/IFC-Änderung.
Vorher/Nachher-Regeln: Mehrfachbewegung mit mitgehendem Fenster und unveränderten
Nachbarn, Abbruch, Undo/Redo, Sichtbarkeit, Geschoss- und Höhenwechsel.

Frischer height-acceptance-Build, statisch Port8087, Asset
bound-height-workspace-DaOF-0p4.js. Nutzerprojekt Port8080 unberührt; vorhandene
Recovery-Angebote nicht übernommen oder gelöscht. fullHeightFixture: KG/EG/OG
und oberes Bezugsgeschoss, sieben Wände/drei Fenster.

UI: eg-a und eg-b per Enter/Strg+Enter gewählt, zu 3D gewechselt, Auswahl frei
bewegen, Ursprung an Wandecke geklickt. Winkel 0°, Länge nacheinander 1/2/0,5 m;
Vorschau mit mitgehendem Fenster sichtbar, bei 0,5 m platziert. Export91, ein
Undo Export92, Redo, erneute Gruppenbewegung 90°/1 m und Abbruch Export93.
Fensterebene in 3D ausgeblendet und per Ebenen-Undo wieder eingeblendet.
Gebäudeeinstellungen: EG-Höhe 3,0 -> 3,5 m; OG-Kote 3,5/DG 6,5 m sichtbar,
Export94. Arbeitsgeschoss OG gewählt, dort Fenster im Grundriss gewählt und
in 3D hervorgehoben; Export95. Keine erfassten Konsolenfehler. Screenshot lokal
outputs/window-base-combined.png.

benchmarks/window-base-browser-check.ts erhält die fünf realen Exportpfade als
Argumente. Vollständige Geschossdaten und workingStoreyId/groundStoreyId gegen
beginSelectionMove/previewSelectionMove, setStoreyHeight und selectWorkingStorey
verglichen: alle fünf bestanden. Regulärer deserializeProject-Lader erforderlich:
gebundene Wandhöhen werden im Dateiformat absichtlich nicht redundant gespeichert,
sondern beim Laden hergeleitet. Keine Abweichung durch Entfernen von Modellfeldern
kaschiert. Hashes/Dateinamen und Basis in window-base-browser-evidence.json.

Abschlussdiff: nur Checker/Evidenz und Dokumentation, kein neuer Produktimport,
Laufzeitzyklus oder Modellbesitzer. Benchmark-Typecheck und gezieltes Lint sowie
frischer Abnahmebuild bestanden. Produktprüfung (1135 Tests plus Architektur-Gate,
Typechecks/Lint/Build) am PR405-Head in CI grün; ohne Produktänderung nicht lokal
wiederholt. Kein neuer IFC-/Recoveryrundlauf notwendig; vorhandene Gates erhalten.

Grenzen: tatsächliche Zahlenvorschauen/Platzierung, keine kontinuierlich
aufgezeichnete Mousemove-/Shift-/Native-Geste, kein GPU-/Gesamtframebeleg.
Sichtbarkeit funktional bedient; kein GPU-Picking-Lasttest. Kein Anspruch auf
vollständige AUD14-Abnahme. Nächster Einzelauftrag ausschließlich §9.

### AUD14-03/04 – Kalte 3D-Vorbereitung und Auswahlwechsel (21.10.2026)

Basis main 0dc7fab, PR406 nach grünem Lauf 39629987853 zusammengeführt.
Änderungskarte vor Code: ausschließlich Diagnose unter benchmarks, keine neue
Produktregel oder Importkante in src. Ziel: erste Szene von neuer Bewegung
trennen; normale feste Auswahl A/A und Grenzfall wechselnde Ersatzmengen A/B/A
bei wachsendem Restgebäude. Eine autoritative Projektbasis mit stabilen IDs,
Metern und Geschoss-/Hostkontext; alle Ebenen sichtbar. Gemeinsame
prepareSelectionTranslation/evaluate/materialize-Dienste und vorhandene
Renderadapter, kein zweiter editierbarer Modellbestand. Finaler Commit,
Validierung, Undo/Abbruch, 2D, Datei/Recovery, IFC und AI unverändert; daher keine
erneute vollständige Bedienabnahme für diese reine Messung.

Reproduktion: `node --experimental-strip-types benchmarks/cold-preview-profile.ts`.
Rohdaten: benchmarks/cold-preview-results.json und cold-preview-repeat-results.json.
Zwei getrennte Node-Prozesse; je sieben frische Szenen pro Größen-/Provenienzfall,
4/104/1004 Wände und 2/102/1002 Fenster. Erst mutable, dann factory-owned Input;
owned-Erzeugung liegt außerhalb als vorausgegangener Lade-/Commit-Schritt.
Je Szene einmal Query/Solid/Sichtbarkeit/Puffer/Fensterbasis, danach vier neue
Gesten A/A/B/A mit unterschiedlichen Zielvektoren. A: zwei EG-Wände/ein Fenster;
B: zwei Restwände/zwei Fenster (kleiner Basisfall: zwei OG-Wände/ein Fenster).
Vergleich der Komposition ist daher kein identischer Anschlussfall A gegen B.
Unabhängige Gruppierungs-/Pack-/Kopierproben laufen erst danach und sind **keine
addierbaren Teilzeiten** des zuvor gemessenen initialen Puffers.

Median in ms, größter Fall, owned; Lauf 1 / Lauf 2:

| Abschnitt | Lauf 1 | Lauf 2 |
| --- | ---: | ---: |
| Szenen-Solid | 111,519 | 112,249 |
| Initialer Puffer | 108,739 | 91,188 |
| Erste Aktionsvorbereitung A | 1,682 | 1,380 |
| Erste Flächenkomposition A | 3,463 | 3,405 |
| Gleiche Ersatzmenge A, neues Ziel | 0,068 | 0,065 |
| Andere Ersatzmenge B | 3,347 | 3,150 |
| Rückwechsel A | 3,087 | 2,717 |
| Erste Pufferaktualisierung A | 0,157 | 0,134 |
| Unabhängige Packprobe | 94,492 | 86,702 |
| Unabhängige Gruppierung | 3,035 | 3,051 |
| Unabhängiges Zusammenkopieren | 1,468 | 1,416 |

Die öffentliche mutable Aktionsvorbereitung kostet im selben Größenfall
11–15 ms; owned dagegen rund 1,2–1,7 ms. Diese beiden Provenienzen nicht
vermischen oder daraus ungeprüft einen bestimmten UI-Eingang ableiten.
BimSolidView memoisiert Grundsolid und sichtbare Basis nach Projekt/Kontext;
Szenenaufbau und initialer Puffer gehören nicht auf jede Pointerbewegung.
Der größte reproduzierte Szenenblock ist buildBuildingSolid; separat belegt ist
packSolidFaces als großer Teil der Pufferkosten. Die stationäre Partition hält
absichtlich nur eine Ersatzmenge pro Basis: ein Rückwechsel partitioniert neu,
kein verschwundener Modellinhalt und kein Anlass für einen unbeschränkten Cache.

Abnahme: zwei erfolgreiche Messläufe mit insgesamt 336 vollständigen
Wandflächen-/Fenstervergleichen gegen materialisierte validierte Projekte und
84 exakten Float32-Puffervergleichen. Alle Vergleiche nach den Zeitphasen;
keine Materialisierung beeinflusst den A/A/B/A-Abschnitt. Benchmark-Typecheck,
gezieltes Lint und Architekturgrenze bestanden. Typinferenz der dynamischen
Zielwerte explizit annotiert; keine Laufzeitänderung durch diese Korrektur.
Keine Änderung in src oder an Test-/CI-Konfiguration. Keine Browser-, GPU-,
Frame-, native Shift-, IFC- oder neue Recoveryabnahme; keine gesamte AUD14-Freigabe.
Feste Fallreihenfolge, JIT/GC/Hintergrundlast unkontrolliert; sieben Samples
rechtfertigen keine p95-Zusage. Vergleichbare warme Dienste bleiben erhalten.

Entscheidung: Als begrenzten nächsten Eingriff die isoliert nachgewiesene
Pufferpackung ohne Cache-Erweiterung verbessern, weil das vollständige
Float32-Ergebnis exakt vergleichbar ist. Der etwas größere Solidaufbau enthält
mehrere fachliche Ableitungen und bleibt ausdrücklich separat offen. Aktiver
Einzelauftrag ausschließlich §9.


### AUD14-03 – Direkte CPU-Pufferpackung (21.10.2026)
Änderungskarte vor Code: PR407 d0b21a4, nach grüner CI 39631732272 in main
bb53387 integriert. Ziel: gleiche sichtbare Geometrie mit weniger Packarbeit;
normaler Quad/Fensterbestand sowie mehrseitige Flächen, Auswahlfarben und große
Koordinaten beim Rebase. Eigentümer ausschließlich rendering/viewport/solid-buffer.ts;
Quelle bleibt die unveränderliche abgeleitete Flächenbasis mit stabilen wallIds.
Keine neue Application-Aktion, kein Modellzustand, keine Migration, keine
Fachregel in der UI. Vorschau/Commit/Undo/Abbruch und Datei/Recovery/IFC/AI
verwenden unverändert ihre gemeinsamen Verträge. 2D nicht betroffen.

Umsetzung: Ausgabegröße aus der bestehenden konvexen Fan-Triangulierung
ermitteln; Float32Array einmal anlegen, XYZ/RGB direkt schreiben. Licht/Farbe
weiter in Double berechnen und erst beim Schreibzugriff auf Float32 runden.
faceTriangles bleibt die gemeinsame Quelle für Winding und Dreiecksreihenfolge.
Keine neue Cache-Schicht, keine Persistenz, keine neue Importkante. Bestehende
Pufferlayout-/Patch-/Rebase-/Topologieverträge unverändert. Fenster bleiben
flexible abgeleitete Objekte, nicht im Packer als Spezialtyp kodiert.

Abnahme: eingefrorener Vorher-Algorithmus im Regressionstest; Bytevergleich
für leere Eingaben, 0–32-Eck-Flächen, echtes Gebäude mit Fenster, Auswahlfarben,
Ursprünge bei 1e9/-1e8 und signierte Null, keine Eingabemutation. Bestehende
Ressourcentests prüfen Patchuploads, Auswahlwechsel, Topologie/Sichtbarkeit,
Abbruch und Rebase. Vollsuite: 1136/1136. App-/Benchmark-Typecheck, fokussiertes
Lint, Architekturgrenze (377 Dateien/1486 Kanten/kein Zyklus), Build und Diffprüfung
bestanden. Sandbox-spawn-EPERM durch regulären eskalierten Testlauf gelöst;
Build direkt mit lokalem Vite, da npm nicht im Runtimepfad. Bekannte Buildwarnungen
zu Chunkgröße, vite-tsconfig-paths und inlineDynamicImports bleiben.

Zwei abschließende serielle cold-preview-profile-Läufe nach Test/Build, gleiche
Methode wie PR407; Rohdaten direct-packing-results.json und
 direct-packing-repeat-results.json. Frühere mit Tests überlappende Messungen
verworfen. Bei 1004 Wänden/1002 Fenstern, owned-Median in ms:

| CPU-Abschnitt | Vorher (PR407, zwei Läufe) | Nachher (zwei Läufe) |
| --- | --- | --- |
| Initialer Puffer | 108,739 / 91,188 | 19,123 / 22,027 |
| Unabhängige Packprobe | 94,492 / 86,702 | 18,941 / 16,909 |
| Gebäude-Solid | 111,519 / 112,249 | 107,107 / 103,003 |

Rund 76–82 % weniger initiale Puffer-CPU-Zeit im jeweiligen Laufvergleich;
keine statistische oder Framegarantie. Unabhängige Proben sind keine addierbaren
Teilzeiten. Insgesamt erneut 336 vollständige Geometrievergleiche und 84
Pufferzusammensetzungsvergleiche bestanden. Keine kontrollierte Systemlast,
JIT/GC nicht isoliert, sieben Samples je Fall. Solidaufbau unverändert; kleinere
Messunterschiede dort sind kein diesem Fix zugeschriebener Gewinn.
Keine neue Browser-, native Shift-, IFC- oder Recovery-Abnahme. Praktischer
Abnahmetest nach Integration: 3D-Wände mit Fenster ansehen, auswählen, bewegen,
abbrechen/Undo und stark verschobenen Ursprung prüfen; Darstellung/Farben
müssen unverändert sein. Exakte Pufferprüfung ersetzt keine Gesamtframeabnahme.
Abschlusskarte: tatsächlicher Produktdiff nur der Packer; keine neuen
Abhängigkeiten/Zyklen oder Modellkopien. Aktiver Einzelauftrag ausschließlich §9.


### AUD14-03/04 – Gebäudeaufbau phasenweise gemessen (21.10.2026)
Änderungskarte: Basis PR408 7bcfad3, nach grüner CI 39632694692 in main
1471a31 integriert. Diagnosecode unter benchmarks, keine Produktänderung.
Ziel: feste kleine verbundene Wandgruppe plus 0/100/1000 freie Restwände,
mit nur zwei bzw. bis zu 1002 Fenstern. Source of truth bleibt der geprüfte
owned Projekt-Snapshot; Meter, Geschoss/Host und alle sichtbaren Ebenen.
Bestehende buildBuildingSolid/buildPreviewSolid-Ableitung, keine neue Action;
Vorschau/Commit/Undo/Abbruch, 2D, Speicher/Recovery/IFC und AI nicht verändert.

Methode: building-phase-profile.ts erzeugt exklusiv eine temporäre Geschwisterdatei
zur echten geometry.ts mit identischen Imports/Algorithmus und Zeitmarken.
Jeder Textanker muss genau einmal existieren; finally entfernt die Datei auch
bei Fehlern. Produktquelle wird nie überschrieben. Instrumentierte Anschluss-,
Wandloop-, Fenster-filter/map-, Höhen-, Aggregations- und Freeze-Abschnitte.
Verschachtelte Teile nicht aufsummieren; Timerkosten eingeschlossen. Sieben
frische Szenen je Größen-/Fensterfall in fester Reihenfolge, zwei Prozesse.
Beide verbundenen Ausgangswände erhalten je Versuch dieselbe leicht variierte
Stärke, um Modellgleichheitsreuse zu vermeiden; ein zunächst nur einseitig
veränderter Testaufbau wurde von der bestehenden Fachvalidierung korrekt
abgewiesen und vor den erfolgreichen Messläufen korrigiert.

Rohdaten: benchmarks/building-phase-results.json und building-phase-repeat-results.json.
Reproduktion: node --experimental-strip-types benchmarks/building-phase-profile.ts.
Median in ms bei 1004 Wänden/1002 Fenstern, Lauf 1 / 2:

| Abschnitt | Lauf 1 | Lauf 2 |
| --- | ---: | ---: |
| Instrumentierter Gesamtaufbau | 105,403 | 113,236 |
| Uninstrumentierter Kontrollaufbau | 101,744 | 107,512 |
| Anschlussableitung | 1,889 | 2,311 |
| Fensterzuordnung filter + map | 71,093 | 73,154 |
| Wandloop ohne Fensterzuordnung | 22,998 | 25,930 |
| Höhenversatz | 0,249 | 0,263 |
| Aggregation | 0,454 | 0,503 |
| Abschließendes Freeze | 10,813 | 11,620 |

Bei gleich vielen Wänden und nur zwei Fenstern: Gesamt 10,661/9,677 ms,
Fensterzuordnung 0,422/0,429 ms. Die freie Wandextrusion durchsucht pro Wand
alle Fenster (windows.filter(wallId)); dies ist der größte reproduzierte
redundante Abschnitt. Nächster Fix: ableitungs-lokale Hostgruppierung, nicht
Snapshotvertrauen lockern oder Freeze entfernen. Flexible Fenster-/zukünftige
Bibliotheksrepräsentationen bleiben erhalten; kein Formschema aus diesem
Messfixture ableiten.

Abnahme: 84 vollständige Vergleiche gegen uninstrumentierten Produktionspfad,
einschließlich Flächen, Volume und Bounds, bestanden; alle Fälle nachweislich
Cache-Miss im instrumentierten Gebäudeaufbau. Frozen-Ausgabe geprüft.
Benchmark-Typecheck, gezieltes Lint, Architekturgrenze und Diffprüfung bestanden;
kein Produktionsdiff, daher keine erneute vollständige Produktsuite/Build.
Kontrolllauf folgt dem Instrumentierungslauf und teilt niedrigere Modulcaches;
er dient der Ergebnisprüfung, nicht als kontrollierter Speedup-Beleg. Owned-
Snapshot-Erzeugung außerhalb der Zeit. Timer/JIT/GC/Systemlast nicht isoliert,
kein p95-/Browser-/GPU-/Frame-/Native-Nachweis. Keine neue IFC-/Recoveryabnahme.
Abschlusskarte: keine produktiven Importkanten oder Modellkopien; Testquellen
nach Ausführung entfernt. Einziger aktiver Folgeauftrag ausschließlich §9.


### AUD14-03/04 – Ableitungs-lokale Fenster-Hostgruppierung (21.10.2026)
Änderungskarte vor Code: Basis PR409 6258a2c, grün nach main 84114d1 übernommen.
Ziel: unveränderte freie Wandextrusion ohne Fenster-Gesamtscan je Wand. Normale
mehrfenstrige Wand, leere Hosts, Neuzuordnung sowie überlappende Öffnungen im
Geometriescope; bestehende Anschlussregeln bleiben erhalten. Eigentümer ist die
bestehende gemeinsame Solidableitung in lib/bim/geometry.ts (Übergangsbaustein),
kein neuer generischer Dienst in lib/bim. Quelle ist der geprüfte Geometriescope,
window.wallId, Geschosshöhe und unveränderte Fensterobjekte. Keine neue Application-
Aktion: Vorschau/Commit/Undo/Abbruch nutzen weiter dieselben validierten Wege.

Map je Ableitung einmal aufbauen, Originalobjekte/Reihenfolge pro Host erhalten;
keine persistente Registry, keine Projektkopie, keine neue Importkante. Gemeinsamer
Rendererpfad erbt dies für alle Verbraucher; keine werkzeugweisen Anpassungen.
Fenster bleiben flexible Objekte/zukünftige Bibliothekselemente; Öffnungsgeometrie
unverändert. 2D, Format/Recovery/IFC und AI besitzen keine geänderten Verträge.

Abnahme: neuer permanenter Geometriestest vergleicht mehrere/überlappende Fenster
und leere Hosts mit isolierten Wänden bei 3,5 m Geschosshöhe/-0,2 m Versatz;
Hostwechsel bei derselben Eingabe wird neu abgeleitet. Vollsuite 1137/1137,
App-/Benchmark-Typecheck, fokussiertes Lint, Architekturgrenze und Build bestanden.
Vorher-Oracle im window-host-comparison.ts stellt ausschließlich die alte
Filtersuche in temporärem Modul wieder her (eindeutige Anker, exklusive Datei,
finally-Cleanup); alte und neue Pfade erhalten denselben Snapshot. Sieben
unterschiedliche Szenen pro Größe, Reihenfolge alternierend; zwei Prozesse.
42 vollständige Flächen-/Volumen-/Bounds-Vergleiche bestanden. Zusätzlich 42
Vergleiche im aktualisierten Phasenmessstand; Fenster-lookup misst nun lokale
Map-Abfrage + Transformation, Gruppierungsaufbau liegt im inklusiven Wandloop.

Rohdaten window-host-results.json, window-host-repeat-results.json und
window-host-phase-results.json. Median des vollständigen kalten Gebäudeaufbaus,
1004 Wände/1002 Fenster: alt 133,629 / 129,010 ms, neu 42,996 / 45,166 ms;
rund 65–68 % weniger CPU-Zeit. Kleines 4-Wand-Fixture alt 1,30/1,58 ms, neu
1,51/1,78 ms: keine pauschale Beschleunigung für jede Größe behaupten. 104-Wand-
Fall alt 7,79/11,70, neu 6,47/7,21 ms. Shared untere Caches, JIT/GC/Systemlast
bleiben Grenzen; kein Browser-, GPU-, Frame- oder Native-Beleg. Validierung und
Snapshotaufbau außerhalb des kalten Rendervergleichs. Gegenüber älteren
Messungen keine kausalen Vergleiche über unterschiedliche Last ableiten.

Abschlusskarte: Produktdiff nur lokale Zuordnung und Lookup; keine neue
Abhängigkeit, Modellregel, Persistenz oder History. Veränderte Diagnoseanker
mitgepflegt; temporäre Module nachweislich entfernt. Kombinierte praktische
Abnahme folgt ausschließlich §9. Nutzer-Test: mehrere Wände mit Fenstern in 3D
bewegen, platzieren, Undo/Redo/Abbruch; Öffnungen und Auswahl müssen stabil bleiben.
