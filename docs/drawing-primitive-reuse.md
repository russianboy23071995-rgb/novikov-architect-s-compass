# Begrenzte Fangprimitive-Wiederverwendung, 24.10.2026

## Änderungskarte vor Code
1. AUD14-04/A04: Eine Linien-/Schraffurecke ändern, unveränderte übrige Fanggeometrie wiederverwenden. Grenzfälle: gleiche ID mit anderen Punkten, Löschung, Projekt-/Geschosswechsel, Undo/Redo und Budgetüberschreitung. Wände/Anschlüsse bleiben auf dem vollständigen Ableitungsweg.
2. Eigentümer bleibt Application/snapping; autoritative Eingaben im Projekt. Zunächst isolierter Benchmark-Kandidat: nur eine begrenzte aktuelle Generation aus IDs, exakt verglichenen Punktkoordinaten und immutable abgeleiteten Primitiven; kein zweites editierbares Modell.
3. Bestehende projectSnapPrimitives und createPrimitiveSourceIndex verwenden; keine Änderung an Commitvalidierung, ToolInteraction, Abbruch oder History. Keine separate AI-Aktion.
4. Geordnete Referenzen/Segmente und lokale Fangabfragen gegen Vollpfad vergleichen. Kalt-/Änderungsaufbau einschließlich Vergleich und erneutem räumlichem Index messen, Speicherbedarf getrennt ausweisen. Keine Produkt-/Datei-/Recovery-/IFC-/UI-Änderung vor Nachweis.
5. Basis PR436 7cd7145, grünen Merge separat prüfen. Kandidat zunächst ausschließlich benchmarks; kein Produktionsimport aus Diagnose. Nettovorteil und vollständiger Schutz erforderlich, sonst nicht übernehmen. Keine weiteren Sortier-/Freezeänderungen kombinieren.
## Ergebnis
PR436 nach grüner CI40036034331 in main `19a6ddc` zusammengeführt. Der Kandidat
bleibt ausschließlich in `benchmarks/drawing-primitive-candidate.ts`; keine
Produktdatei oder UI geändert. Er ruft den produktiven Primitive-Adapter auf,
hält eine begrenzte letzte Generation und vergleicht Punktfolgen mit Object.is
(auch -0 bleibt unterscheidbar). Reihenfolge folgt immer dem aktuellen Modell.
Wände einschließlich T-Abhängigkeiten werden vollständig neu abgeleitet.

Grenzen des Prototyps: maximal 2.048 Einträge/120.000 gespeicherte Punkte pro
Generation; während eines Aufbaus können alte und neue Generation gleichzeitig
leben. Kein Byte-/Peak-RAM-Limit. Signaturen sind eigene immutable Punktkopien,
der Cache hält kein ganzes Projekt. Geänderte/gelöschte Einträge werden ersetzt;
Projekt-/Geschosswechsel leert die vorherige Generation. Ungecachte überzählige
Elemente bleiben vollständig im Ergebnis. Keine LRU-History zusätzlicher Projekte.

## Messung
Node v24.19.0/Windows, vier wechselnde Reihenfolgen je 100/1.000 Restschraffuren
mit je 100 Punkten, jeweils ein fester Linien- bzw. Schraffur-Streckcommit über
editingReducer. Basis- und Folgestand außerhalb der Zeitmessung erzeugt.
Gemessen wird die gesamte Primitive-Ableitung plus Freeze, Lookup und räumlicher
Index – nicht nur der Cachetreffer. GC vor jedem Lauf; Kalt-/Änderungsphase getrennt.
Rohdaten: `benchmarks/drawing-primitive-reuse-results.json`.

| 1.000 Restschraffuren | Produktion | Kandidat | Bewertung |
| --- | ---: | ---: | --- |
| Kalt, Linienziel | 1.071–1.219 ms | 1.243–1.292 ms | 2–19 % langsamer |
| Änderung, Linienziel | 1.056–1.137 ms | 826–857 ms | 21–27 % schneller |
| Kalt, Schraffurziel | 1.102–1.251 ms | 1.269–1.379 ms | 4–24 % langsamer |
| Änderung, Schraffurziel | 1.062–1.134 ms | 866–951 ms | 10–23 % schneller |

Auch bei 100 Elementen: Änderungen 21–32 % schneller, Kaltaufbau 12–28 % langsamer.
16/16 Änderungsvergleiche schneller, 16/16 Kaltvergleiche langsamer.
Damit ist Wiederverwendung grundsätzlich wirksam, diese konkrete Integration
aber nicht zur Produktion freigegeben. Der räumliche Neuaufbau bleibt erhalten;
die separate vollständige Commitvalidierung wurde nicht beschleunigt.

Heapdelta nach GC im großen Kaltfall ca. 212–216 MiB Produktion gegen 228 MiB
Kandidat. Bei Änderungen ca. 216 gegen 98 MiB zusätzlicher Heap. Letzteres ist
KEIN Gesamtverbrauch: Der Kandidat besitzt vor der Änderung bereits seine
Cachegeneration. Rohdaten enthalten auch das Allokationsdelta ohne Nach-GC;
keiner dieser Werte ist ein Prozess-/Browser-/GPU-Peak. Keine Browserframe-
oder allgemeine Kapazitätsfreigabe aus diesem Node-Vergleich.

## Korrektheit und Grenzen
400 vollständige geordnete lokale Abfragen exakt, einschließlich Filter und zwei
Zoomskalen; vollständige Primitive/Segmente und alle Lookup-Einträge verglichen.
Vier echte Commits samt Undo/Redo im Vergleichspfad. Kopierte Objektidentitäten,
Mutationsversuch am Ergebnis, nachträgliche Eingabemutation, Löschung,
Projekt-/Geschosswechsel und Budgetbegrenzung geprüft.
Neun weitere vollständige Datenvergleiche in drawing-primitive-reuse-safety.ts:
T-Wände mit geänderter Stärke/Achslage, Linienpunktreihenfolge und Einfügung,
Darstellungsänderung, Elementreihenfolge und Wiederverwendung einer gelöschten ID.
Die Sicherheitsfixture erzeugt je Prüfung einen neuen Projektstand; der produktive
Wandcache setzt wie dokumentiert immutable Snapshots voraus. Ein anfänglich
ungültiger Wandversatz bzw. eine Mutation desselben Testprojekts wurde korrigiert,
nicht als Produktfehler interpretiert.

Benchmark-Typecheck und gezieltes Lint bestanden. Keine neuen Produktionsimporte,
Rückabhängigkeiten oder Modellkopien im Produkt. Keine Änderung an Commit,
Datei/Recovery/IFC/AI oder Interaktion; deshalb keine neue Browserabnahme behauptet.
Produktprüfungen stammen aus grüner CI des Basis-PR436, nicht aus diesem Messlauf.

## Entscheidung
Noch nicht produktiv übernehmen. Nächster einzelner Auftrag ausschließlich §9:
Kaltbefüllung aus einer einmaligen vollständigen Primitive-/Indexableitung prüfen,
statt je Element den Adapter plus zusätzliches rekursives Freeze aufzurufen.
Private sichere Herkunft bereits gefrorener Ableitungen erhalten; kein Vertrauen
in beliebige Object.freeze-Eingaben und kein Weglassen des Mutationsschutzes.
Kaltaufbau, kleine Änderung und vollständige Invalidierung samt Speicher und
exakter geordneter Querygleichheit erneut vergleichen. Kein inkrementeller
räumlicher Indexumbau in diesem nächsten Kandidaten.
