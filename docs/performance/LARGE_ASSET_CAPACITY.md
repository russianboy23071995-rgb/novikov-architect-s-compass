# Große Modell-/Assetprofile – 12.10.2026

Basis main `53db718` (PR #258 nach erfolgreicher CI und Nutzerfreigabe zusammengeführt). Isolierter Diagnoseauftrag, Produktionsgrenze weiterhin 32 MiB. Die 50/100/250-MiB-Profile sind Untersuchungsschritte, keine unterstützten Produktgrößen. 200–300 MB im Leitfaden beschreibt Archicad-Erfahrung, kein gleichwertiges NOVIKOV-Dateiformat.

## Methode und Reproduktion

`node --experimental-strip-types benchmarks/large-asset-capacity.mjs 50 output.json` (analog 100, 250). Immer nur eine Größe, darin Inline und Split nacheinander in frischen Node-Prozessen. Ctrl+C beendet den aktuellen Kindprozess; 180-s-Watchdog, 1536-MiB-V8-Heapgrenze und RSS-Abbruch an Messpunkten oberhalb 2400 MiB. Der RSS-Check ist keine harte OS-Speicherbegrenzung zwischen Messpunkten. Rohdaten der finalen Größenläufe wurden nacheinander ohne weitere Tests/Builds ausgeführt. Vorläufe in outputs sind nicht die Ergebnisquelle.

Fixture: 10.000 echte Linien plus Beispielwand/Fenster; mehrere unterschiedliche deterministische RGBA-PNGs (768×768). Eigene CRC-Chunks und zlib-Rundlauf prüfen PNG-Erzeugung; keine Browserdekodierung in diesem Versuch. Ganze Bilder werden bis mindestens 50/100/250 MiB Base64-Nutzlast hinzugefügt, daher tatsächliche JSON-Größe etwas höher. Jede Referenz besitzt eine eigene Asset-ID, alle Payloads unterscheiden sich. Geltende Einzelbildgrenzen bleiben eingehalten. Produktions-Dateileser muss die Testprojekte weiterhin mit 32-MiB-Fehler ablehnen.

Inline untersucht hypothetisch zugelassene größere Daten mit echtem Domain-Validator und JSON.stringify/parse. Es ruft **nicht** den bei 32 MiB ablehnenden Commit-/Dateiworkflow mit gelockertem Limit auf. Split ruft den vorhandenen `asset-contract.ts`-Prototyp mit expliziten Diagnosebudgets auf: splitProject, pack, unpack, restoreProject. Kein alternativer Produktladepfad und keine Formatentscheidung. Die Prüfaufgaben sind nicht identisch: Inline misst Storage-/Domainvalidierung ohne Migration oder Browserdekodierung, Split zusätzlich Headerprüfung, Hashintegrität und Formatrekonstruktion. Die Zeitdifferenz ist daher kein Vergleich gleichwertiger Sicherheitsprüfungen.

Beide Pfade beginnen mit geprüften unveränderlichen Asset-Handles. 100 Farbänderungen durchlaufen den echten Projektvalidator; gespeicherte Zustände teilen ihre Payloads. Die History ist eine Diagnose-Snapshotliste, nicht die produktive commitProject-History. Bei 1/10/50/100 werden Speicherwerte und Serialisierung eines Standes gemessen: Inline ganzes Projekt, Split nur Manifest. Diese Serialisierungswerte sind unterschiedliche Arbeitsmengen, kein pauschaler Beweis schnellerer Commits. Der Split-Pool bleibt geteilt. Ein SHA-256-Vergleich des gesamten Projekts prüft Endzustand und Datei-Rundlauf; die gerade Anzahl Farbänderungen ergibt den Ausgangsinhalt. Das ist keine interaktive Undo/Redo-Abnahme.

Recovery misst die vorhandene JSON-Hüllenform mit aktuellem Stand und Vorgänger, beide als vollständige String-Kopie. Auch das Split-Paket wird hierfür vollständig eingebettet, damit sichtbar wird, was die bloße Formatumordnung noch nicht löst. Das ist Speicher-Encoding/Parsing, **kein IndexedDB-, Platten-, CAS-, Absturz- oder Browser-Recoverytest**. Inhalt der beiden gelesenen Strings wird verglichen; Datei-Rundlauf separat vollständig validiert.

`ms` enthält Phasenarbeit plus Abschluss eines gleichzeitig gestarteten 0-ms-Timers. Dessen Verzögerung ist Node-Event-Loop-Verzug, keine Browser-Long-Task. RSS/Heap/external sind Messpunkte; maxRSS ist das kumulative Prozessmaximum einschließlich Fixture, Validierung und temporärer Serialisierungen, kein phasenisolierter Peak. Ein Lauf je Größe/Pfad, keine p95-Statistik, kein kontrollierter OS-Kaltstart, kein GPU-/Darstellungsnachweis. Windows/Node und Hardware stehen in den Rohdaten.

## Ergebnisse

Alle sechs Läufe abgeschlossen; vier Inhalts-/Grenz-/Identitätsprüfungen je Lauf bestanden. Zeiten in ms, kumulativer maximaler Prozess-RSS in MiB. Messpunkte enthalten Diagnose- und temporäre Serialisierungsdaten; sie sind keine reine Modell-RAM-Anforderung.

| Tatsächliches Inline-MiB / Bilder | Pfad | Schreiben | Lesen | Recovery-Hülle schreiben / lesen | maxRSS |
| --- | --- | ---: | ---: | ---: | ---: |
| 52.59 / 17 | inline | 67 | 286 | 124 / 137 | 1094 |
| 52.59 / 17 | split | 421 | 5851 | 128 / 147 | 1051 |
| 103.62 / 34 | inline | 136 | 474 | 231 / 282 | 1505 |
| 103.62 / 34 | split | 736 | 11496 | 242 / 271 | 1406 |
| 253.73 / 84 | inline | 275 | 956 | 556 / 639 | 2701 |
| 253.73 / 84 | split | 1652 | 28082 | 559 / 680 | 2461 |

Heap-Messpunkte nach explizitem GC, MiB; einschließlich Diagnose-/möglicherweise noch gehaltener vorheriger Serialisierungsdaten. Nicht als isolierte reine Historykosten interpretieren:

| Ziel-MiB | Pfad | 1 Stand | 10 | 50 | 100 |
| --- | --- | ---: | ---: | ---: | ---: |
| 50 | inline | 16 | 110 | 294 | 523 |
| 50 | split | 17 | 60 | 243 | 472 |
| 100 | inline | 16 | 161 | 345 | 574 |
| 100 | split | 17 | 60 | 243 | 472 |
| 250 | inline | 17 | 312 | 496 | 726 |
| 250 | split | 17 | 60 | 244 | 474 |

Rohdaten: [50](large-capacity-50-2026-10-12.json), [100](large-capacity-100-2026-10-12.json), [250](large-capacity-250-2026-10-12.json). Sie enthalten zusätzlich Timerverzug, external/RSS/Heap je Phase, Bytes und Serialisierungswerte je History-Messpunkt. Der 0-ms-Timer misst die erste Blockade der Phase, nicht sämtliche späteren Blockaden einer asynchronen Phase.


## Konsequenz

Der vorhandene Split-Prototyp wird nicht unverändert produktiv übernommen. Er prüft/dekodiert/hasht Bildinhalte erneut, verwendet noch die ältere Iterator-Bytekonvertierung und erzeugt weiterhin einen monolithischen JSON-String. Seine langsameren Ladezeiten beweisen deshalb nicht, dass getrennte Assets grundsätzlich schlechter sind. Die Dateigröße sinkt bei unterschiedlichen Bildern kaum. Das kleine Manifest verringert die serialisierte Arbeitsmenge bei reinen Geometrieänderungen; die Vorteile gehen verloren, wenn danach wieder alle Bilder in Paket und Recovery kopiert werden.

Schon der Inline-Pfad teilt Asset-Identitäten zwischen Ständen. „100 Undo-Schritte bedeuten 100 Bildkopien“ wäre falsch. Trotzdem wachsen Modell-Snapshots und temporäre JSON-/Recoverystrings erheblich. Die Produktionsgröße wird hier nicht weiter erhöht und kein Rendererwechsel vorgeschlagen.

Nächster begrenzter Pilot gemäß Masterplan: bestehendes Manifest/Payload-Konzept für lokale Recovery konkretisieren, mit einmalig abgelegten unveränderlichen Asset-Datensätzen und kleinen aktuellen/vorherigen Manifesten. Veröffentlichung atomar und mit erwartetem Vorgänger; fehlende/beschädigte Assets vor Modellübernahme ablehnen. Noch kein neues portables Dateiformat und keine Löschung unreferenzierter Payloads. Vor produktiver Integration Datenrundlauf, Abbruch/Schreibfehler und Modelländerung ohne erneutes Schreiben aller Bilder nachweisen. Das zielt auf die hier beobachtete Kopierlast statt auf einen Umbau der gesamten Anwendung.

Validierung des Diagnoseauftrags: sechs finale Profil-/Pfadläufe abgeschlossen, insgesamt 24 explizite Inhalts-/Grenz-/Identitätsprüfungen; 880 bestehende Tests erneut bestanden. Node-Syntaxprüfung, App-/Benchmark-Typecheck, Build und Lint (0 Fehler/6 bestehende Warnungen) bestanden. Keine Produktionsänderung, kein neuer Browser-Abnahmelauf.
