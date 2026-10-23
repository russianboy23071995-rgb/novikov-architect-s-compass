# Einmalige Sortiermittelpunkte, 24.10.2026

## Änderungskarte vor Code
AUD14-04/A04: min/2+max/2 einmal pro kopiertem Eintrag berechnen, Comparator
verwendet diese identischen Zahlen. Stabile Sortierung, Achsenwahl, Boundsprüfung
und unveränderte Eingaben erhalten. Geometry besitzt den generischen Index;
keine Application-/Renderer-/Modellaktion, Commit/Undo oder Formatänderung.
Gegen unveränderten PR434-Builder: geordnete Abfragen, Gleichstände, große und
ungültige Bounds; wechselnde Reihenfolge, Gesamtaufbau und Heapdelta messen.
Nur bei belastbarem Nutzen übernehmen. Keine Quickselect-/Baumstrategieänderung.
Produktabnahme über gemeinsame Query-Tests; Frames/Native bleiben offen.
Basis PR43489a391e, Merge erst bei grüner CI.

## Ergebnis: Kandidat nicht produktiv übernommen
PR434 nach erfolgreicher CI40034923425 in main ea69b0c integriert.
Vier frische Bäume je100/1000 Konturen und Typ, wechselnde Reihenfolge, GC vor
Aufbau. Rohdaten spatial-sort-centres-results.json. Bei1000 Konturen:
- Punktindex: Basis211–228ms, Kandidat201–221ms (alle vier Paare schneller).
- Segmentindex: Basis100–107ms, Kandidat103–114ms (alle vier Paare langsamer).
- Beobachteter Heapdelta Punkte71–74MB →88–93MB; Segmente50MB →61–64MB.
Heapdelta ist keine Peak-/Retained-Memory-Messung; GC und Reihenfolge beeinflussen
sie. Der begrenzte gemischte Zeitgewinn rechtfertigt den Mehrbedarf hier nicht.
Keine allgemeine Aussage, dass vorberechnete Schlüssel immer ungeeignet wären.

64 geordnete Abfragevergleiche plus Gleichstände,1e9/1e308, ungültige Bounds und
Eingabemutation bestanden. Vorhandene box-index.test.ts gegen den temporären
Produktkandidaten ausgeführt: beide Tests erfolgreich, einschließlich720
Sparse/Dense/Tie-Abfragen und Extremkoordinaten. Anschließend Produktdatei exakt
zur Basis zurückgesetzt. Kandidat ausschließlich benchmarks/spatial-sort-candidate.ts,
Basis benchmarks/spatial-sort-baseline.ts. Reproduktion:
node --expose-gc --experimental-strip-types benchmarks/spatial-sort-centres.ts.
Benchmark-Typen und Lint bestanden. Kein verändertes UI-Verhalten, keine neue
Browserabnahme oder vollständige Produkttestserie erforderlich; grüne Basis-CI.

Abschlusskarte: keine neue Produktionsabhängigkeit, Geometrieregel, History oder
Modellkopie. Fang-/Commit-/Undo-/Recovery-/IFC-Verhalten unverändert. Keine
Performancefreigabe. Nach zwei negativen Mikrooptimierungskandidaten ist der
nächste begrenzte Auftrag die Inventur/Messung der Indexinvalidierung: bei einer
kleinen Modelländerung getrennt prüfen, welche Quellen neu entstehen und welche
unverändert sind; Werkzeugwechsel und Vorschau als Kontrollfälle. Noch keinen
inkrementellen Index oder anderen Cache vorwegnehmen. Einziger Auftrag §9.
