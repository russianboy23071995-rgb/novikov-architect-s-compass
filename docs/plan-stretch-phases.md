# 2D-Punktstreckphasen, 24.10.2026

## Änderungskarte vor Code
AUD14-04/A04: Vorbereitung, Patch, Materialisierung, Planableitung und Fangquellen
für gleiches kleines Ziel mit 10/100/1000 unbeteiligten Konturen getrennt messen.
Linie und Schraffur; alle sichtbar und teilweise ausgeblendet. Bestehende
Application-/Geometry-/Rendering-Queries sind die Wahrheit; nur Diagnosecode.
Vollpfadgleichheit außerhalb Zeitmessung; Commit/Undo unverändert. Keine neue
Produktaktion, Modellkopie, Rendererregel oder Datei/Recovery/IFC/AI-Migration.
React-Reconciliation, SVG-Paint und Native-Frames nicht mit Node-Zeiten gleichsetzen.
Basis PR430 a64ae44; Merge erst nach erfolgreicher CI. Nächsten begrenzten Schritt
anhand der Ergebnisse bestimmen, kein vorsorglicher Cacheumbau.

## Ergebnis
PR430 a64ae44 nach CI40033192207 (success) in main ad0261d übernommen.
Reproduktion: node --experimental-strip-types benchmarks/plan-stretch-phases.ts.
Ergebnisdatei plan-stretch-phases-results.json, Node24.19.0, 108 exakte
Projekt-/Planszenen-/Zielvergleiche gegen Vollpfad bestanden. Benchmark-Typen und
gezielter Lint bestanden. Keine Produktdatei geändert; bestehende 1155 Tests,
Architektur, App-Typen und Build durch CI der unveränderten Produktbasis belegt.

Warme Mediane (acht Aufrufe nach erstem Aufruf), alle Ebenen sichtbar, ms:

| Restkonturen à100 Punkte | Ziel | Patch | Materialisierung | Plan | Runs | lokale Quellenabfrage |
| --- | --- | --- | --- | --- | --- | --- |
| 10 | Linie | 0,02 | 0,02 | 0,05 | 0,01 | 0,14 |
| 100 | Linie | 0,01 | 0,01 | 0,06 | 0,01 | 0,08 |
| 1000 | Linie | 0,01 | 0,01 | 0,40 | 0,03 | 0,09 |
| 10 | Schraffur | 0,04 | 0,02 | 0,02 | 0,00 | 0,08 |
| 100 | Schraffur | 0,02 | 0,01 | 0,05 | 0,00 | 0,08 |
| 1000 | Schraffur | 0,02 | 0,04 | 0,20 | 0,03 | 0,09 |

Ausgeblendete Restkonturen bleiben im Fangindex; Abfrage berücksichtigt Sichtbarkeit.
Bei1000: Plan0,15–0,18ms, lokale Abfrage0,09ms. Erstaufbau getLocalSnapSources
über alle Szenarien:10 Konturen11–34ms,100 Konturen83–109ms,1000 Konturen
1017–1162ms. Alle warmen Zugriffe liefern nachweislich dasselbe Indexobjekt.
Vorbereitung von Adapter/Sichtbarkeit separat im JSON. Initiales Fixture-Validieren
und Vollpfadvergleiche liegen außerhalb der gemessenen Phasen.

## Interpretation und offene Grenze
BimPlan hält Quellen an project gebunden (useMemo/getLocalSnapSources), während
previewEdit einen materialisierten Vorschauzustand und damit neue scene/Runs erzeugt.
derivePlanScene/filter/Maps und planSceneRuns wachsen mit sichtbarer Restgeometrie;
materialize mappt die Zielkollektion. Dieser Test zeigt dafür keinen dringenden
CPU-Engpass. Er enthält unverbundene Konturen, keine große Wandanschlussgruppe.
PlanSceneRun ist memoisiert, erhält jedoch einen neuen scene-Verweis: React kann
unveränderte Runs damit erneut auswerten. React-Reconciliation, Mustererzeugung,
SVG-Paint, DOM-Layout, GPU und Gesamtframes wurden hier NICHT gemessen.
Keine Browser-/Native- oder vollständige Pointer-Latenzfreigabe. Die Quellenabfrage
nutzt neutrale Toolpolicy; vollständige Inferenz/Shift ist nicht enthalten.

Der belegte größere Aufwand ist der kalte Fangindex. Nächster begrenzter Auftrag
ist dessen Aufschlüsselung in Primitiveableitung, Einfrieren und räumliche Indexe;
noch keine Optimierung oder Behauptung, dass er jede Mausbewegung blockiert.
Keine Produktänderung und daher kein neuer UI-Abnahmeablauf. Commit/Undo,
Datei/Recovery/IFC und AI-Aktionen unverändert. Abschlusskarte: nur Benchmark und
Nachweisdokumentation, keine neuen Produktionsabhängigkeiten oder Modellkopien.
