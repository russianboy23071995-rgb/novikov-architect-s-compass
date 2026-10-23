# Freeze-Besuchsmenge, 24.10.2026

Änderungskarte AUD14-04/A04: aufbaulokale WeakSet-Besuchsmenge für referenzierte
Objekte prüfen. Tiefes Einfrieren auch unter bereits flach eingefrorenen Eltern
beibehalten. Gemeinsame Referenz-/Segmentquelle einmal besuchen; keine Änderung
an Geometrie, Baum, Lookup, Cache, Commit/Undo, Renderer oder Dateiformat.
Vor Produktübernahme Gesamtaufbau und Heap mit wechselnder Reihenfolge gegen
PR432 vergleichen; Quellen/Abfragen und tatsächliche Mutationsversuche prüfen.
Kein Frame-/Native-Nachweis. Bei fehlendem Nutzen Kandidat nicht übernehmen.

## Ergebnis: keine Produktübernahme
Vier frische Aufbauten je100/1000 Konturen, wechselnde Reihenfolge, GC vor Aufbau.
Primitiveerzeugung außerhalb Zeit. Vollständiger Indexbau gemessen, Heap-Differenz
nur als Allokationsbeobachtung (kein Peak, kein sicherer Retained-Memory-Wert).

- WeakSet für alle Objekte: bei1000 Basis902–959ms, Kandidat1335–1485ms;
  beobachteter Heapdelta Basis187–234MB, Kandidat322–324MB. Verworfen.
- Nur bekannte tief gefrorene Referenzen überspringen: bei1000 Basis873–961ms,
  Kandidat887–989ms; drei von vier Paaren langsamer. Kein belastbarer Nutzen.
  Heapdelta Basis189–234MB, Kandidat198–201MB; GC-Streuung verhindert klare
  Speicherbehauptung. Verworfen.

Je Variante48 lokale Abfragen (einschließlich Quellenfilter) und sämtliche
Segmentdaten exakt gegen unveränderten PR432-Builder. Flach eingefrorene Eltern
mit veränderlichen Kindern sowie Segmentendpunkte bleiben tief geschützt;
Mutation wirft. Der Produktionsindex bleibt bytegleich zu PR432.

Reproduktion: node --expose-gc --experimental-strip-types benchmarks/snap-freeze-once.ts
und zusätzlich --weakset. Rohdaten in snap-freeze-once-results.json und
snap-freeze-weakset-results.json. Kandidaten ausschließlich unter benchmarks/.
Benchmark-Typen und Lint bestanden. Kein neuer Browserablauf; keine Änderung an
UI, Commit/Undo, Datei/Recovery/IFC oder Geometrie. Kein neuer Laufzeitpfeil.
Keine neue allgemeine Performancefreigabe und keine Wiederholung aller Tests
für unveränderten Produktcode; Basis-CI maßgeblich.

Nächster Einzelauftrag: räumlichen Punkt-/Segmentindex weiter in Bounds-
Einträge, Validierung/Kopieren und Baumaufbau (Sortieren/Partitionieren) zerlegen.
Vor erneuter Optimierung Aufwand am tatsächlichen gemeinsamen Builder belegen.
Die zuvor bereits optimierte Boundsakkumulation nicht erneut implementieren.

PR432 nach CI40034074030 success in main e2be47e integriert.
