# Begrenzte freie Wandextrusionen: Pilot nicht übernommen – 21.10.2026

## Änderungskarte
AUD14-03/04, main 11a13b1 nach PR416 (CI39646871441 grün). Ziel: gleiche freie Extrusionen nach Einzeländerung wiederverwenden. Normalszenarien Wand-/Fenstereinzeländerung, Grenzfälle Höhen-/Host-/Anschlusswechsel. Eigentümer im Pilot: bestehende Solidableitung, abgeleitete wegwerfbare Ressourcen; Quelle bleibt das validierte Projekt. Gemeinsame Application-Aktionen, Vorschau/Commit/Undo und endgültige Validierung unverändert. Keine neue Datei-, Recovery-, IFC-, AI- oder Bibliotheksregel.

## Kandidat und Sicherheitsgrenze
Der Kandidat vergleicht Start/Ende, Stärke, aufgelöste Höhe, Körperversatz, absolute Basishöhe und geordnete Öffnungsgrenzen mit Object.is. Freie Einträge werden nur aus der schwachen letzten Gebäudeableitung gelesen, pro nächster Ableitung neu begrenzt; verbundene Wände immer vollständig berechnet. Zellvolumenbeiträge werden in ursprünglicher Reihenfolge addiert, nicht als anders gerundete Wandsumme. Kein ID-only-Cache, kein Modellverweis in Extrusionen, keine Kette alter Gebäude.

Zunächst lokaler Extrusionscache, anschließend intern abgeleitete Weltflächen über schwache Face-Identitäten ergänzt. Nur explizit freie Face-Identitäten sind dafür zulässig; Anschlussflächen bleiben ausgeschlossen. Basiswechsel erzeugt andere lokale Faces über die Signatur. Abschließendes tiefes Freeze der veröffentlichten Ergebnisse bleibt; spätere Fassung erkennt nur intern bereits vollständig eingefrorene Faces per WeakSet. Private lokale Cachekoordinaten werden nicht bearbeitet oder veröffentlicht, außer wenn das abschließende Freeze die direkten Referenzen schützt.

## Entscheidung
Nicht produktiv übernommen: exakte Geometrie, aber Gesamtnutzen nicht robust und Vollinvalidierung deutlich teurer. Produktquellen entsprechen wieder unverändert main 11a13b1. Der letzte Kandidat ist nur als Textfixture free-wall-reuse-candidate.txt gespeichert. Diagnose lädt ihn exklusiv als temporäres Geschwistermodul mit finally-Cleanup; kein Produktimport.

Große Fixture 1005 Wände/1003 Fenster, zwei letzte gespeicherte Entwicklungs-Läufe vor Archivierung; Mediane ms:

| Änderung | Alt 1 | Kandidat 1 | Alt 2 | Kandidat 2 |
| --- | --- | --- | --- | --- |
| Freie Wand | 68,892 | 66,658 | 73,186 | 81,263 |
| Freies Fenster | 60,572 | 39,896 | 62,138 | 44,185 |
| Verbundenes Fenster | 74,232 | 43,082 | 60,587 | 41,536 |
| Geschosshöhe | 57,919 | 82,533 | 64,828 | 105,402 |

Fensterfälle profitieren, Wandfall schwankt; Höhenfall deutlich teurer. Frühere lokale Varianten sind ebenfalls erhalten und keine aktuelle Freigabe. Feste Reihenfolge, JIT/GC, geteilte untere Caches und Systemlast bleiben Grenzen. Nicht weiter messen, bis ein günstiger Median entsteht. Keine Bildratenzusage.

## Nachweise
Je gespeicherter Lauf 84 vollständige Solid-/Volumen-/Bounds-Vergleiche: 4 Änderungen, 3 Restgrößen, 7 Trials; Reihenfolge Alt/Neu alterniert. Normale Zielaktion und Snapshotaufbau außerhalb der Zeitmessung. Sechs Entwicklungs-Läufe in *initial*, *local* und den unqualifizierten results/repeat-Dateien; in diesen historischen Rohdaten totalMs=Alt, controlMs=Kandidat. Während des letzten Paares wurde ausschließlich die abschließende Freeze-Erkennung weiter präzisiert; sie ist deshalb keine Messfreigabe der archivierten Endfassung. Der zusätzliche archived-replay prüft genau die Endfassung (totalMs=Kandidat, controlMs=Produkt). Werte nicht vermischen.

Neue permanente Regression in building-view.test.ts vergleicht unabhängig ungecachte Geschossscopes einschließlich Weltflächen und vollständiger Gebäudeaggregation. Wandendpunkt, Stärke, Körper-/Höhenversatz, Höhe, Gebäudedatum, Geschosshöhe, Fensterbreite, Hostzuordnung, Reihenfolge, Entfernen, Rückkehr zum Ausgangsstand sowie frei/verbunden/frei. Kein implementierter Cache wird mit diesem Test behauptet.

1138 Tests bestanden auf lokaler Entwicklungsfassung. Typprüfung fand anschließend zwei Typfehler (optional prior und nullable Geschosshöhe), beide korrigiert. Finale Kandidatfassung: fokussierte 7 Tests bestanden; Archiv-Replay, Benchmark-Typecheck und Lint geprüft. Architekturprüfung ohne neue Rückgriffe/Zyklen; Build der Entwicklungsfassung bestanden. Nach Rücknahme keine neue Produkt-/Browser-/GPU-/Frame-/Native-, Recovery- oder IFC-Abnahme behauptet.

Reproduktion: node --experimental-strip-types benchmarks/free-wall-reuse-comparison.ts. Exklusive temporäre Datei wird entfernt. Benchmark-Verträge bleiben vom Produkt getrennt. Kein technisches Erfolgsgate geschlossen; genau ein Folgeauftrag im Masterplan §9: Pflegekosten, Treffer und vollständige Invalidierung des Kandidaten getrennt messen und ein Kostenbudget festlegen, bevor erneut Produktlogik übernommen wird.
