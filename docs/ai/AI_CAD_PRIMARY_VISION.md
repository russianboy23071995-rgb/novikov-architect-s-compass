# NOVIKOV CAD: AI als vorrangiges Produktziel

Nutzerentscheidung vom 10.10.2026. Dies ist die **strategische Hauptvision**
des Produkts und ein Architekturmaßstab für jede neue CAD-Funktion. Keine
Fertigmeldung und kein Auftrag, alle AI-Funktionen sofort gleichzeitig zu bauen.
Der [Katalog AI01–AI35](AI_FUTURE_VISION.md) und die unveränderte
[Originalanlage](CAD_BIM_2026_AI_Strategie.pdf) bleiben gültig.

## Zielbild in der Sprache des Nutzers

NOVIKOV CAD soll eine leistungsstarke AI-CAD-Architektur besitzen, die das
**gesamte Programm über Sprache und weitere Eingaben fachlich steuern** kann.
Aus einer komplexen Entwurfsaufgabe soll die AI eigenständig bearbeitbare
Architekturentwürfe im gemeinsamen CAD/BIM-Modell entwickeln, überprüfen,
vergleichen und auf Änderungswünsche hin fortschreiben.

Eingaben umfassen insbesondere:

- Sprachliche Absicht und Dialog, wahlweise Text und später Skizze/markierter
  Modellbereich. Mehrdeutige Angaben werden sichtbar geklärt.
- Grundstücksgeometrie und -größe, Lage/Orientierung und vom Nutzer
  vorgegebene Randbedingungen.
- Brutto-Gebäudeblöcke, Baukörper, Zielgrößen bzw. Flächen und gewünschte
  Geschossanzahl/-höhen, soweit vom Nutzer vorgegeben oder aus
  belegbaren Quellen gewonnen.
- Raumprogramm: Räume, Nutzungen, Größen, Beziehungen und Prioritäten.
- Bebauungspläne (B-Pläne) und zugehörige Planunterlagen als Quellen für
  *zu prüfende* Festsetzungen und geometrische Grenzen.

Die AI darf daraus selbstständig einen **mehrschrittigen Entwurfsprozess**
planen und Varianten im Modell erzeugen. „Vollautomatisiert“ bedeutet,
dass sie nicht Wand für Wand auf Benutzerklicks warten muss: Sie kann innerhalb
eines vom Nutzer gestarteten Entwurfsauftrags Bauteile anlegen, prüfen,
Fehler korrigieren und Alternativen bilden. Das Ergebnis bleibt mit seinen
Annahmen und Quellen überprüfbar; eine ungeprüfte Behauptung der
B-Plan-Konformität oder stiller externer Versand/Veröffentlichung gehört
nicht zum Ziel.

## Verpflichtende technische Grenzen

1. **Buttons sind Adapter, keine AI-Werkzeuge.** UI, Text, Sprache, Skizze und
   AI rufen dieselben typisierten Application-Aktionen und strukturierten
   Modellabfragen auf. Keine UI-Klicksimulation als Kernarchitektur und keine
   direkte Änderung an React-State, SVG/Mesh oder Projekt-JSON durch die AI.
   Neue Fachfähigkeiten erhalten einen für andere Eingabekanäle aufrufbaren
   Aktionsvertrag; rein visuelle UI-Aktionen brauchen keinen eigenen
   AI-Button-Endpunkt.
2. **Maschinenlesbarer Fähigkeitskatalog.** Jede relevante Aktion/Abfrage
   beschreibt Namen, Argumente, Typen, Einheiten, Ziel-IDs, Geschoss-/Ansichts-
   scope, Voraussetzungen, Wirkungen, Fehler und Unterstützungsgrad. Das
   fachliche Schema ist validiert; die AI bekommt nur erlaubte Operationen
   des konkreten Kontextes. Veraltete Modellrevision, unsichtbare/gelöschte
   Ziele und nicht unterstützte Elementtypen lösen einen Fehler aus, keine
   stillschweigende Ersatzauswahl.
3. **Gemeinsames autoritatives Modell.** Bauteile, Räume, Geschosse,
   Ausschnitte, Listen, IFC und AI-Abfragen referenzieren stabile IDs.
   Geometrie, Mengen und Bauregelprüfungen werden deterministisch im CAD
   berechnet; ein Sprachmodell liefert Absichten, Annahmen und Prioritäten,
   nicht die verbindliche Geometrie oder Rechenergebnisse aus freiem Text.
   Keine zweite unabhängig editierbare AI-Modellkopie.
4. **Quellengebundene B-Plan-Auswertung.** Import/OCR, Georeferenzierung bzw.
   Maßstabszuordnung, Planzeichen/Flächen und Textfestsetzungen werden als
   *extrahierte Behauptungen* mit Dokument, Seite/Planbereich, Version,
   Geltungsbereich und Extraktionsunsicherheit geführt. Nutzerangaben,
   extrahierte Festsetzungen, deterministisch berechnete Werte und offene
   Annahmen sind unterscheidbar. Widersprüche oder fehlende Unterlagen
   werden angezeigt und bei entscheidungsrelevanter Mehrdeutigkeit geklärt.
   Die AI darf aus einem PDF nicht ohne Nachweis verbindliches Baurecht
   oder einen vollständigen Bebauungsplan erfinden.
5. **Regel- und Entwurfsablauf.** Grundstück/Parameter → geprüfte
   Randbedingungen → Baukörper/Geschosse → Raumprogramm → Bauteile →
   Modellprüfungen → Variantenvergleich. Regeln verweisen auf Quelle
   und die betroffenen Modell-IDs. Eine Änderung am Grundstück, B-Plan
   oder Raumprogramm invalidiert abhängige Prüfresultate; erneute
   Berechnung wird sichtbar. Unlösbare Bedingungen ergeben einen
   nachvollziehbaren Konflikt, keinen erfundenen „gültigen“ Entwurf.
6. **Kontrollierte Autonomie.** Ein Entwurfsauftrag kann intern viele
   geprüfte Schritte und Iterationen ausführen. Vor Übernahme gibt es
   eine verständliche Gesamtvorschau bzw. einen Modell-Diff mit
   Auswirkungen und offenen Punkten. Veröffentlichung erfolgt
   atomar über vorhandene Action-/History-Grenzen oder klar
   begrenzte Transaktionen; Abbruch und Rücknahme sind möglich.
   Umfang der automatischen Übernahme ist eine explizite spätere
   Produkteinstellung, nicht stillschweigend Vollzugriff durch
   jede Spracheingabe. Externe Freigabe/Versand bleibt getrennt.
7. **Austauschbare AI-Schicht.** Sprachmodell und Anbieter, Sprach-
   erkennung, Dokumentanalyse und mögliche lokale/offline Adapter
   werden nicht fest im Geometriekern verdrahtet. Projekt- und
   Quelldaten gehen nur über definierte Adapter; später
   Datenfreigabe, Rechte und Datenschutz separat konkretisieren.
   Eigenes Modelltraining ist keine Voraussetzung für den Start.

Das bestehende **Skalierverbot für BIM-/3D-Elemente** bleibt bindend.
Die AI darf eine Wanddicke oder Dachgeometrie durch dafür vorgesehene
Fachaktionen ändern, aber einen Baukörper nicht über eine verbotene
proportionale Skalierungsaktion „passend ziehen“.

## Durchgehender Abnahmefall für die Zielarchitektur

Beispielauftrag: „Plane auf diesem Grundstück mit den beigefügten
B-Plan-Unterlagen einen Baukörper mit den genannten Bruttozielen,
drei Geschossen und diesem Raumprogramm. Zeige zwei Varianten.“

Ein späterer End-to-End-Nachweis muss mindestens zeigen:

1. Die AI nennt die übernommenen Grundstücksmaße, Geschoss-/Raumziele
   und jede relevante aus Unterlagen extrahierte Bedingung samt Fundstelle;
   nicht belegte Angaben und widersprüchliche Grenzen sind markiert.
2. Aus der strukturierten Aufgabenbeschreibung entstehen zwei
   **editierbare** Varianten mit stabilen BIM-IDs. Flächen,
   Höhen und Grenzen werden im CAD-Kern berechnet und auf Quellen
   zurückgeführt. Kein Bild oder PDF gilt als Ersatz für das Modell.
3. Die AI berichtet erfüllte, verletzte und noch nicht prüfbare
   Anforderungen getrennt; Änderungen an einer Randbedingung
   führen zu neuer, begründeter Bewertung.
4. Vor Übernahme kann der Nutzer Änderungen und Folgen sehen;
   Übernahme/Abbruch, Speichern/Laden und Rücknahme funktionieren
   ohne versteckte Modellkopien. Dieselben Modellaktionen bleiben
   manuell aufrufbar.
5. Ein zweiter, korrigierender Sprachauftrag kann eine Variante
   ändern, ohne fremde Geschosse, Räume oder Ausschnitte unbeabsichtigt
   zu überschreiben.

Dieses Szenario ist **langfristige Abnahmegrenze**, keine Behauptung,
dass aktuelle Wände/Fenster oder ein heutiger Sprachbefehl es bereits
leisten. Die konkrete rechtliche Bewertung eines B-Plans erfordert
nachvollziehbare aktuelle Quellen und fachliche Prüfung.

## Ausbau in kleinen Schritten

| Stufe | Ziel und erster überprüfbarer Liefergegenstand | Voraussetzungen |
| --- | --- | --- |
| **AI-Fundament, ab jetzt** | Jede neue fachliche Aktion und Abfrage mit typisierten Parametern, IDs, Einheiten, Revisions-/Sichtbarkeitskontext und Fehlern anschlussfähig halten. Mindestens eine Maus-/Text-/simulierte Spracheingabe liefert dasselbe geprüfte Ergebnis, sofern dieser Kanal für die Aktion angeboten wird. | Architekturvertrag §19; bestehende Actions, Vorschau/Undo. Kein leeres Framework. |
| **Lesen und Befragen** | Projekt-/Element-/Geschossabfragen mit strukturierten Antworten; ein begrenzter AI-Dialog identifiziert eindeutige Ziele und benennt Lücken. | Semantische Bauteil- und Raumdaten. |
| **Kontrolliertes Ändern** | Wenige vorhandene Aktionen mit Plan, Vorschau, Diff, Kontextprüfung und Rücknahme; nachweislich gleicher Fachpfad wie manuelle Bedienung. | Fähigkeitskatalog, stabile IDs, Transaktionen. |
| **Dokumente und Regeln** | Ein abgegrenzter B-Plan-Pilot extrahiert belegte Festsetzungen und verbindet sie mit einem deterministischen Prüffall und überprüfbaren Planstellen. Unlesbare/unklare Fälle werden ausdrücklich offen gelassen. | Dokumentimport, Koordinaten/Skalen, Quellenmodell, definierter Geltungsbereich. |
| **Autonomer Entwurf** | Ein begrenztes Grundstücks-/Baukörper-/Geschoss-/Raum-Szenario erzeugt Varianten und verbessert sie iterativ im gemeinsamen BIM-Modell. | Mehrgeschossigkeit, Räume, Bauteile, Abhängigkeits- und Prüfregeln, Kapazität für reale Dateien. |

**Planungsregel:** Diese Vision hat Produktvorrang und beeinflusst
Architekturentscheidungen schon heute. Sie ersetzt nicht rückwirkend
den genau einen aktiven Implementierungsauftrag im
[DEVELOPMENT_PLAN.md](../../DEVELOPMENT_PLAN.md).
Codex soll bei jedem neuen Bauteil/Werkzeug die AI-Anschlussfähigkeit
prüfen und dafür eine kleine überprüfbare Action-/Query-Erweiterung
einplanen. Eine neue Gesamtreihenfolge wird anhand des jeweils
aktuellen Codes, der Datenvoraussetzungen und des Benutzerwerts
festgelegt, nicht durch pauschales Verschieben aller AI-Stufen
an den Anfang.
