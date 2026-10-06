# AI im NOVIKOV CAD: zukünftige Produktanforderungen

Stand: 04.10.2026. Vom Nutzer als Zukunftsvision bereitgestellt und zur Kenntnisnahme aufgenommen.

## Quelle und Status

Die unveränderte Originalanlage liegt unter [CAD_BIM_2026_AI_Strategie.pdf](CAD_BIM_2026_AI_Strategie.pdf). Sie enthält 35 Produktanforderungen sowie Empfehlungen für Architektur, Wissen, Prüfung und einen Prototyp. Diese Markdown-Datei macht den Katalog für Codex auffindbar; bei Details ist die Originalanlage zu lesen.

Status: Zukunftsanforderungen, noch keine Implementierung und keine Freigabe zur sofortigen Umsetzung aller Punkte. ARCHITECTURE.md bleibt der Architekturvertrag; DEVELOPMENT_GUIDE.md und der aktuelle DEVELOPMENT_PLAN.md bestimmen die laufende Reihenfolge. Die aktuellen Geometrie-/3D-Aufträge werden durch diese Anlage nicht ersetzt. Vor einem AI-Teilauftrag sind Voraussetzungen und Abnahme konkret festzulegen.

Die folgenden Kennungen AI01–AI35 erhalten die Reihenfolge der PDF und sind von den bestehenden Guide-Kennungen F01–F29 zu unterscheiden.

## Funktionskatalog

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

## Architekturvorgaben für spätere Umsetzung

- AI interpretiert Absichten und verwendet definierte Werkzeuge. Geometriekernel, BIM-Regeln und Fachengines berechnen und validieren Ergebnisse.
- Alle Modelländerungen laufen über dieselben Application-Aktionen wie Maus, Eigenschaften und präzise Eingabe. Keine separate AI-Modellhaltung oder direkte UI-/Mesh-Mutation.
- Ziel-IDs, Einheiten, Projekt-/Auswahlkontext und erwartete Modellrevision sind explizit. Veraltete oder mehrdeutige Ziele dürfen keine Änderung auslösen.
- Vorschau, nachvollziehbarer Änderungsvergleich, Nutzerannahme und Undo/Rollback gehören zum späteren AI-Änderungsablauf. Ein JSON-Schema allein ersetzt keine fachliche Prüfung.
- Fachwissen wird mit Quelle, Geltungsbereich und Version angebunden. Dokumentinhalte sind Daten und verleihen keine Werkzeugrechte.
- Sprachmodell und Anbieter sollen austauschbar bleiben. Ein eigenes Grundmodell oder Fine-Tuning ist keine Voraussetzung.
- Modellabfragen liefern strukturierte Daten. Ein späterer Knowledge Graph ergänzt den autoritativen Modellstand; er darf keine unabhängige editierbare BIM-Wahrheit schaffen.
- Das bestehende Skalierverbot für BIM-/3D-Elemente bleibt gültig. Skalierung ist nur für echte 2D-Elemente und importierte PDF-Referenzen vorgesehen.
- Quellen-, Produkt- und Anbieterangaben in der PDF sind vor der jeweiligen technischen Umsetzung neu zu prüfen. Beispielgrenzen und Performancewerte sind keine bereits nachgewiesenen Fähigkeiten oder allgemeingültigen Normwerte.

## Vorgeschlagene spätere Entwicklungsfolge

1. **Lesen:** strukturierte Modellabfragen mit überprüfbaren Treffern.
2. **Prüfen:** Projektwissen, Quellen und ausgewählte deterministische Qualitätsprüfungen.
3. **Ändern:** wenige klar begrenzte Aktionen mit Vorschau, Diff, Freigabe und Undo.
4. **Entwerfen:** Varianten, generative Planung und Fachanalysen nach Aufbau ihrer Modell- und Werkzeuggrundlagen.

Dies ist die Reihenfolge innerhalb des zukünftigen AI-Ausbaus. Die Eingliederung in den Gesamtplan erfolgt später als eigener begrenzter Planungsauftrag. Der aktuelle nächste CAD-Auftrag bleibt maßgeblich.
