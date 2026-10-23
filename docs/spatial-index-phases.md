# Räumlicher Fangindex-Aufbau, 24.10.2026

## Änderungskarte vor Code
AUD14-04/A04: tatsächlichen createBoxIndex-Aufbau in Bounds-Einträge,
Validierung/Kopie, Boundsakkumulation, Sortierung und Partitionierung zerlegen.
Punkt- und Segmentindex aus 10/100/1000 Konturen; gleiche lokale und umfassende
Abfragen exakt vergleichen. Geometry besitzt den generischen AABB-Baum; keine
Änderung an Application, Modell, Fangpolicy, Commit/Undo oder Renderer.
Diagnose lädt aktuellen unabhängigen Builder und instrumentiert eine temporäre
In-Memory-Kopie mit geprüften Ersetzungen; Quellhash und normalen Gesamtlauf
mitführen. Messoverhead sichtbar, keine Instrumentierung im Produkt. Keine
Datei/Recovery/IFC/AI-Migration oder Browserverhaltensänderung. Bereits verbesserte
Boundsakkumulation erhalten. Ergebnis bestimmt einen begrenzten Folgekandidaten.
Basis PR433 eaeb885; Merge nur bei erfolgreicher CI.

## Ergebnis und Abschlusskarte
PR433 nach erfolgreicher CI40034563383 in main bc17460 übernommen.
Diagnose benchmarks/spatial-index-phases.ts, Reproduktion mit
node --expose-gc --experimental-strip-types benchmarks/spatial-index-phases.ts.
Rohdaten/sourceHash in spatial-index-phases-results.json. 90 geordnete lokale,
gesamte und leere Abfragevergleiche exakt. Ungültige Bounds abgewiesen.
Benchmark-Typprüfung und Lint bestanden; Produktcode unverändert (Basis-CI grün).

1000 Konturen à100 Punkte, drei Durchläufe, Zeitbereiche ms:

| Index | Einträge | normaler Aufbau | instrumentiert | Prüfung/Kopie | Bounds | Sortieren | Partition |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Punkte (200000) | 26,58–28,99 | 218,01–231,26 | 234,18–240,35 | 45,22–49,49 | 29,37–31,45 | 139,03–145,72 | 6,09–6,61 |
| Segmente (100000) | 9,73–12,50 | 97,23–104,37 | 114,77–121,22 | 27,18–28,77 | 18,35–19,51 | 48,04–63,61 | 3,02–17,41 |

Einträge liegen außerhalb der Builder-Gesamtzeit. Pro-Knoten-Uhren erzeugen
Overhead; Phasensummen sind keine exakte Zerlegung des uninstrumentierten Laufs.
Diagnose zieht beide Slices vor die Rekursion, nur in der In-Memory-Kopie;
Ergebnisreihenfolge exakt geprüft, Allokationstiming kann beeinflusst werden.
Keine Browser-/GPU-/Frame- oder allgemeine Kapazitätsaussage. Drei Läufe je
Größe/Typ mit wechselnder Normal-/Diagnosereihenfolge, keine Statistikgarantie.
Die bereits optimierte Boundsakkumulation bleibt erhalten.

Hauptanteil im Punktbaum ist wiederholtes Sortieren auf jeder Baumebene.
Nächster begrenzter Kandidat: identische Mittelpunktsschlüssel einmal je Eintrag
berechnen statt in jedem Sortiervergleich. Arithmetik (min/2 + max/2), gewählte
Achse und stabile Gleichstandsreihenfolge müssen gleich bleiben. Gesamtzeit und
zusätzlichen Speicher mit wechselnder Reihenfolge vergleichen; keine Umstellung
auf Quickselect oder neue Baumstrategie ohne eigenen Nachweis.

Keine Produktionsdatei/Importgrenze geändert. Bestehende Tests/Build aus grüner
Basis-CI übernommen; keine neue Fachaktion und kein Browserablauf. Mutationsschutz,
Fangpolicy, Commit/Undo, Datei/Recovery/IFC bleiben unverändert. Einziger Folgeauftrag
Masterplan §9; negative Freeze-Ergebnisse bleiben gültig.
