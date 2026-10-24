# Einmalige Cache-Kaltbefüllung, 24.10.2026

## Änderungskarte vor Code
AUD14-04/A04: Kaltaufbau und vollständige Invalidierung ohne Einzeladapter je Element prüfen. Beispiel: erste Anzeige von 1.000 Schraffuren; danach eine Ecke ändern oder alle Konturen ändern. Application bleibt Eigentümer abgeleiteter Fangdaten, Projekt einzige Modellquelle. Kandidat nur benchmarks: vollständige fehlende Primitive einmal ableiten, Index vollständig erstellen und erst danach dessen privat nachgewiesen gefrorene Daten gruppiert übernehmen. Keine caller-supplied Provenienz, kein Object.isFrozen-Vertrauen. Begrenzte Generation mit eigenen Punktkopien; Wände immer Vollpfad. Geordnete Query-/Datengleichheit, Mutation, Kontext, Löschung, Undo/Redo und Budget testen. Gesamtkosten inklusive Cachebefüllung, Kalt-/Änderungs-/Vollinvalidierung und Heap messen. Commit/UI/Storage/IFC/AI unverändert; kein räumlicher Indexumbau. Basis PR4374c4ae1a, Merge erst nach grüner CI. Produktübernahme nur bei belastbarem Nettovorteil.
## Abschluss
PR437 nach grüner CI40036777290 in main `831a8a5` integriert. Kandidat ausschließlich
benchmarks/primitive-cold-candidate.ts; Produktion unverändert. Alle fehlenden
Zeichenprimitive werden gemeinsam einmal durch projectSnapPrimitives abgeleitet,
Wände bleiben vollständig enthalten. Beim Trefferfall wird in ursprünglicher
Modellreihenfolge komponiert. Erst der erfolgreiche createPrimitiveSourceIndex-
Aufruf erlaubt die private Übernahme seiner tief gefrorenen Daten in den Cache.
Kein externes Provenienzargument und keine Object.isFrozen-Vertrauensabkürzung.

Budget unverändert 2.048 Einträge/120.000 Signaturpunkte pro Generation; alte/neue
Generation dürfen vorübergehend koexistieren. Kein Byte-/Peaklimit. Punktkopien und
Cachegruppen immutable, keine ganze Projektkopie gespeichert. Räumlicher Index,
Lookup und dessen rekursiver Mutationsschutz bleiben vollständig erhalten.

## Nachweis
464 geordnete lokale Abfragevergleiche, vollständige Primitive/Segmente und sämtliche
Lookup-Einträge exakt. Vier reale Streckcommits mit Undo/Redo, Löschung, Kontextwechsel,
Budget und nachträglicher Eingabemutation geprüft. Neun zusätzliche Datenvergleiche
mit T-Wänden, geänderter Stärke/Achslage, Reihenfolge, neuen Punkten, Darstellung und
wiederverwendeter gelöschter ID. Zusätzlicher Test: oberflächlich gefrorenes Projekt
mit veränderten verschachtelten Punkten wird korrekt invalidiert; Schreibversuch auf
abgeleitete Referenz wird abgewiesen. Benchmark-Typecheck und gezieltes Lint bestanden.
Keine Produktimports, neuen Schichtabhängigkeiten oder Schema-/Recovery-/IFC-/AI-Änderungen.
Keine neue Browserabnahme behauptet; Produkt-CI stammt aus PR437.

## Messung und Grenzen
Node v24.19.0/Windows, vier wechselnde Reihenfolgen je Größe (100/1.000 Restschraffuren
mit je100 Punkten) und Linien-/Schraffurziel. Gesamte Ableitung, Cachevergleich/-befüllung,
Freeze, Lookup und räumlicher Index in der Zeitmessung. Commits außerhalb. Dritte Phase
ändert alle Konturpunkte: null Cachetreffer nachgewiesen. Rohdaten:
benchmarks/primitive-cold-seeding-results.json; Prüfskripte primitive-cold-seeding.ts
und primitive-cold-safety.ts.

| Phase | Ergebnis Kandidat relativ zur Produktion |
| --- | --- |
| Kleine Änderung | alle16 schneller, ca.22–34 % |
| Kaltaufbau | 13/16 langsamer; Bandbreite ca.9 % schneller bis22 % langsamer |
| Vollständige Invalidierung | 13/16 langsamer; ca.10 % schneller bis17 % langsamer |

Bei1.000 Restschraffuren: Änderung Produktion1.073–1.205ms, Kandidat800–903ms.
Kalt Produktion1.062–1.405ms, Kandidat1.087–1.335ms; kein stabiler Kaltvorteil.
Vollinvalidierung Produktion1.085–1.270ms, Kandidat1.094–1.235ms.
Die bisherige zusätzliche Einzeladapter-/Freeze-Arbeit wurde entfernt; das belegt
nicht automatisch einen Vorteil des gesamten Cachepfads. Laufzeitstreuung bleibt.

Heapdelta nach GC groß kalt ca.212–216MiB Produktion gegen228MiB Kandidat. Änderung
und Vollinvalidierung ca.216 gegen98MiB DELTA: Vorherige Cachegeneration ist bereits
im Ausgangsheap und kann dabei freigegeben/ersetzt werden. Das sind ausdrücklich
keine vergleichbaren Gesamtheaps oder Einsparungen von118MiB. Allokationsdeltas
stehen separat in Rohdaten. Kein Prozess-/Browser-/GPU-Peak oder Kapazitätsversprechen.
Weitere Node-Prozesse liefen auf dem Rechner; wechselnde Reihenfolge reduziert,
beseitigt aber nicht Laufzeitstörungen. Keine Änderung fremder laufender Prozesse.

## Entscheidung
Nicht produktiv übernehmen. Fachliche Gleichheit und wiederholter Änderungsvorteil
sind belegt, Kalt-/Invalidierungsmehrkosten bleiben uneindeutig. Kein weiterer
Sortier-/Freeze-Mikrokandidat. Genau ein Folgeauftrag in Masterplan §9: isolierter
Browservergleich Produktion versus dieser unveränderte Kandidat, frische Kontexte,
wechselnde Reihenfolge, Kalt/Einzeländerung/Vollinvalidierung und Speichergrenzen.
Danach Übernahme oder Parken entscheiden. Node-CPU nicht als Produktframe ausgeben.
