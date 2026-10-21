# Geometrieneuaufbau nach Einzeländerung – 21.10.2026

## Änderungskarte
AUD14-03/04, main b218a19 nach PR415, CI39646387938 grün. Ziel: tatsächlich unveränderte erneute Wandextrusionen nach kleiner Modelländerung nachweisen. Normalszenarien freie Wand und freies Fenster; Grenz-/Abhängigkeitsfälle Fenster in angeschlossener Wand und Geschosshöhenänderung. Diagnoseadapter in benchmarks liest denselben Produktionspfad und validierte Owned-Snapshots; stabile Wand-/Host-/Geschoss-IDs, Meter. updateWall/updateWindow und setStoreyHeight sind die bestehenden validierten Wege. Kein neuer Cache, Produktimport, Modellzustand oder Eingriff in Vorschau/Commit/Undo, Datei/Recovery/IFC/AI.

## Methode
geometry-rebuild-profile.ts instrumentiert ausschließlich ein exklusives temporäres Geschwistermodul der echten Solidableitung, mit eindeutigen Ankern und finally-Cleanup. Vorherige Szene aufbauen, dann genau eine Modelländerung. Änderungsaktion und Snapshot-Erzeugung außerhalb der Zeitmessung. Kontrolle und Probe haben eigene Gebäudecaches und wechseln die Reihenfolge. Modellgleichheit und zusätzliche starke Referenz auf Vorher-Szene sind bewusst für den Vergleich vorhanden; kein Produkt-Lifetime-Beweis.

Zwei serielle Prozesse, je 84 Fälle: 4 Änderungen, 0/100/1000 zusätzliche freie Restwände plus eine feste freie Zielwand, 7 Trials. Restwände mit Fenster, horizontal/schräg, Höhenversatz -0,2/+0,15 m. Unverändert bedeutet hier vollständige gleiche Weltflächen/Normalen pro Wand vor/nach Änderung. Dies ist eine nachträgliche Diagnoseklassifikation, kein zulässiger vorab berechneter Cache-Key. Alle 168 vollständigen Solid-/Volumen-/Bounds-Vergleiche gegen uninstrumentierten Vollpfad bestanden; Freeze erhalten.

## Befund
Große Fixture 1005 Wände/1003 Fenster, vier ursprüngliche verbundene Wände und 1001 freie Wände:

| Änderung | Neu aufgebaute Wände | Geometrisch verändert | Unveränderte freie Extrusionen erneut aufgebaut |
| --- | --- | --- | --- |
| Freie Wand: Endpunkt ändern | 1005 | 1 | 1000 |
| Freies Fenster: Breite ändern | 1005 | 1 | 1000 |
| Verbundenes Fenster: Breite ändern | 1005 | 1 | 1001 |
| EG-Geschosshöhe: 3 auf 3,5 m | 1005 | 1005 | 0 |

Das Fenster in eg-a ändert in dieser Fixture nur die Geometrie eg-a; die Anschlussnachbarn werden trotzdem neu abgeleitet. Daraus folgt keine allgemeine Unabhängigkeit von Nachbarn: Anschluss-/Löse-/Höhenänderungen können stationäre Nachbarn verändern. Höhengegenprobe ändert gebundene EG-Höhen und die OG-Höhenlage; alle Weltflächen ändern sich.

Instrumentierte Zeit nur in erneut aufgebauten, am Ergebnis unveränderten freien Wandloops, Mediane ms, Lauf 1 / 2: freie Wand 37,561 / 19,428; freies Fenster 28,258 / 25,321; verbundenes Fenster 29,242 / 22,685; Höhe 0 / 0. Voller uninstrumentierter Gebäudeaufbau für die drei Einzeländerungen rund 53–77 ms. Dies ist nachgewiesene wiederholte Arbeit, keine garantierte Einsparung: Lookup-/Invalidierungskosten, Aggregation, Freeze und Instrumentierungs-/JIT-/GC-/Systemeinfluss bleiben. Loop-Timer endet vor finaler Höhenverschiebung/Freeze. Connected-Timer umfasst nicht die vorgelagerte connectedWallSolids-Berechnung. Rohdaten enthalten Gesamt-/Kontrollzeiten und Differenz pro Probe, keine exakte Timerkorrektur.

## Abschluss und nächster Pilot
Produkt unverändert; Benchmark-Typecheck und fokussiertes ESLint bestanden. Keine neue Produkt-/Browser-/Frame-/Native-, Recovery- oder IFC-Abnahme behauptet. Reproduktion: node --experimental-strip-types benchmarks/geometry-rebuild-profile.ts. Rohdaten geometry-rebuild-results.json und geometry-rebuild-repeat-results.json unter benchmarks.

Genau ein Folgepilot nach §9: begrenzte Wiederverwendung freier Wandextrusionen über benachbarte geprüfte Modellstände. Vollständige geometrische Eingangsdaten einschließlich aufgelöster Höhe, Basishöhe/Elevation, Körperversatz, geordneter Hostöffnungen und Wechsel frei/verbunden müssen den Wiederverwendungsumfang bestimmen. Keine Registry nur nach Wand-ID, kein ungeprüftes Wiederverwenden bei Höhen-/Anschlussänderung, keine unbeschränkte Historie. Bestehende Prepared-/Patchpfade verwenden; Geometrie bleibt wegwerfbar, autoritatives Modell unverändert. Erst exakter Vollpfadvergleich und Messung entscheiden über Übernahme.
