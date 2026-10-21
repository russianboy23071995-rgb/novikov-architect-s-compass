# Cachepflege, Treffer und Vollinvalidierung – 21.10.2026

## Änderungskarte
AUD14-03/04, main 0e1edd0 nach PR417 (CI39648781438 grün). Ziel: Mehrkosten des archivierten Extrusionspiloten erklären und Kostenbudget vor neuer Produktübernahme festlegen. Normale Einzeländerungen (Wand/Fenster), Gegenfall vollständige Höheninvalidierung. Diagnoseadapter liest unveränderte Produktionsquelle und archivierten Kandidaten; validierte Owned-Projekte, stabile IDs und Meter. Bestehende updateWall/updateWindow/setStoreyHeight, Vorschau/Commit/Undo und endgültige Validierung unverändert. Keine neue Produktabhängigkeit, Modellkopie, Cachelogik oder Änderung an Datei/Recovery/IFC/AI.

## Methode und Abnahme
extrusion-cache-costs.ts führt Produktion, unveränderten archivierten Kandidaten und instrumentierten Kandidaten aus. Exklusive temporäre Geschwistermodule mit eindeutigen Ankern und finally-Cleanup; bei fehlgeschlagener exklusiver Anlage keine fremde Datei entfernen. Vier unabhängige Änderungen, 0/1000 Restwände plus freie Zielwand, sieben Trials = 56 Fälle je Prozess. Zwei serielle Prozesse. Vorherige Szenen sind aufgebaut; Aktion, Snapshot und Ergebnisvergleich außerhalb der Zeitmessung. totalMs=Kandidat, controlMs=Produktion, diagnosticMs=instrumentierter Kandidat. Kandidat/Produktion alternieren Reihenfolge, Diagnose läuft jeweils danach. Je Fall zwei vollständige Solid-/Volumen-/Bounds-Vergleiche; insgesamt 224 Vergleiche für geänderte Zustände bestanden. Zusätzlich Basisgleichheit geprüft. Benchmark-Typen/Lint bestanden.

Timer erfassen Signaturaufbau/Lookup, Trefferwiedergabe, Extrusion bei Miss, Veröffentlichung neuer Einträge, Höhenübertragung inkl. Z-Bounds und abschließendes Freeze. Zähler erfassen Hits/Misses und bekannte/neue Freeze-Flächen. Signaturvergleich liegt im nicht gesondert gemessenen Residuum; Zellvolumen-Metadaten entstehen im Miss-Extrusionsabschnitt. Es gibt deshalb keine behauptete lückenlose exklusive Aufteilung.

## Ergebnisse
Große Szene 1005 Wände, 1003 Fenster, Mediane in ms Lauf 1 / 2:

| Phase | Freies Fenster ändern | Geschosshöhe ändern |
| --- | --- | --- |
| Produktion gesamt | 65,679 / 64,097 | 60,717 / 92,858 |
| Kandidat ohne Timer gesamt | 36,130 / 37,872 | 146,444 / 151,396 |
| Kandidat mit Timern gesamt | 37,528 / 35,368 | 117,880 / 112,623 |
| Signaturaufbau/Lookup | 1,224 / 1,058 | 1,286 / 1,304 |
| Trefferwiedergabe | 9,111 / 9,208 | 0 / 0 |
| Neue Extrusion | 0,034 / 0,030 | 36,126 / 29,870 |
| Neue Cacheeinträge veröffentlichen | 0,010 / 0,010 | 7,050 / 8,631 |
| Höhenübertragung und Z-Bounds | 14,550 / 12,921 | 29,312 / 44,735 |
| Abschließendes Freeze | 4,431 / 4,345 | 39,649 / 36,561 |

Zähler stabil in beiden Läufen: freie Wand/freies Fenster 1000 Hits + 1 Miss, 32000 bekannte + 124 neu eingefrorene Flächen; verbundenes Fenster 1001 Hits + 0 Miss, 32032 bekannte + 92 neue Flächen. Höhe 0 Hits + 1001 Misses, 32124 neue Flächen. Verbundene Wände sind vom freien Extrusionscache ausgeschlossen, bleiben aber Teil der gesamten Flächenzahl.

Andere große Fälle: freie Wand Produktion 70,568/61,196 gegenüber Kandidat 74,308/81,634 ms; verbundenes Fenster Produktion 67,718/69,935 gegenüber Kandidat 49,086/57,063 ms. Trefferanzahl allein belegt somit keinen Gewinn: Wiedergabe/Berechnung der Grenzen und Höhenübertragung können weiterhin erhebliche Kosten haben.

## Interpretation und Grenzen
Signaturarbeit ist kleiner als Höhenübertragung/Freeze. Vollinvalidierung zahlt neue Extrusion PLUS Metadatenveröffentlichung, schwache Face-Zuordnungen und vollständiges Freeze. Dass der instrumentierte Kandidat bei Vollinvalidierung schneller als der unveränderte Kandidat ausfällt, zeigt den erheblichen Einfluss von Ausführungsreihenfolge, JIT/GC, gemeinsamen unteren Caches und Instrumentierung. Phasen sind Richtungsbelege, keine exakt subtrahierbaren Produktionskosten oder garantierte Einsparungen. Rohdaten enthalten jede Gesamtzeit/Differenz. Keine Timerkorrektur aus Medianen, kein Aufsummieren verschachtelter Mediane.

Kaltaufbau wurde nicht als eigener isolierter End-to-End-Fall vermessen; die Basisaufbauten liegen außerhalb der Zeitmessung. Das Kaltaufbaugate bleibt offen. Keine Browser-/GPU-/Frame-/Native-, Recovery- oder IFC-Freigabe; Produktcode unverändert. Reproduktion: node --experimental-strip-types benchmarks/extrusion-cache-costs.ts. Rohdaten extrusion-cache-costs-results.json und extrusion-cache-costs-repeat-results.json.

## Technisches Budget und nächster begrenzter Ansatz
Diese Kriterien sind interne Pilot-Abnahme, keine neue Nutzer-/Produktentscheidung: zwei getrennte uninstrumentierte Prozesse, exakte Vollpfadgleichheit; reproduzierbarer Vorteil bei freien Wand- UND Fensteränderungen; kein reproduzierbarer Verlust bei Vollinvalidierung. Kleine Szenen als absolute Zeitdifferenz berichten; Schwankungen unter 0,5 ms nicht als Vorteil vermarkten. Kaltaufbau zusätzlich explizit messen und gegen Produktion prüfen, bevor Übernahme. Bei nicht erfülltem Budget keine Produktfreigabe, keine Messwiederholung allein auf der Suche nach günstigen Zahlen.

Einziger Folgeauftrag §9: begrenzten Kandidaten mit pro Wand gebündelter abgeleiteter Ressource statt Face-weiser WeakMap/WeakSet-Pflege und Vollinvalidierungsfallback entwerfen/prüfen. Vor Umsetzung Signatur, Ownership und Ressourcenlebensdauer in Änderungskarte konkret festhalten. Nur vom tatsächlichen geometrischen Kontext abhängige Wiederverwendung; keine ID-only-Registry, unbeschränkte Historie oder zweite Modellwahrheit. Kalt-/Vollinvalidierungsbudget zuerst prüfen, dann restlichen Pfad; bei Fehlschlag Pilot beenden.
