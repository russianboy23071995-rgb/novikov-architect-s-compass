# Einmalige Asset-Ablage für Recovery – isolierter Pilot

Stand 12.10.2026, Branch `bench/asset-recovery-store`, Basis `e054647` (PR259).
Bezug R26-01/02, K02/03, RC07. Kein produktiver Adapter- oder Formatwechsel.

## Vertrag und Zuständigkeit

`benchmarks/asset-recovery-store.ts` ergänzt den vorhandenen K02-Diagnosevertrag.
Die Vorbereitung validiert das gemeinsame Projekt und prüft Bildheader sowie
SHA-256-Inhaltsschlüssel. Ein WeakMap-Cache nutzt ausschließlich die vom bestehenden
Modellvalidator erhaltenen unveränderlichen Asset-Identitäten. Veränderliche externe
Objekte erhalten neue geprüfte Handles; gleiche Objektadresse umgeht keine Prüfung.
Die Cache-Lebensdauer ist eine Vorbereitungssitzung, nicht browserübergreifend.

Der isolierte IndexedDB-Adapter speichert Payloads unter Inhaltsschlüsseln und
`current`/`previous`-Manifeste unter der Projekt-ID. Neue Payloads und der neue Head
werden in einer gemeinsamen Schreibtransaktion veröffentlicht. Die erwartete Revision
wird innerhalb derselben Transaktion geprüft. Erfolg gilt erst nach `oncomplete`.
Die Publish-Methode ist intern für vorbereitete Kandidaten, kein öffentlicher
Import ungeprüfter Manifeste. Vorhandene Payloadschlüssel werden beim Schreiben
nicht erneut gelesen/gehasht; Lesen prüft gespeicherte Inhalte unabhängig vom Cache.

Eine Lesetransaktion erfasst Head und referenzierte Payloads konsistent. Anschließend
werden Header, Schlüssel und vollständiges Projekt validiert, bevor das Ergebnis
zurückgegeben wird. Beschädigte oder fehlende Inhalte führen zum Fehler. Der Vorgänger
ist ausdrücklich lesbar; automatische Auswahl/Fallback bleibt außerhalb dieses Piloten.
Application-Aktion und Modell-Undo werden nicht verändert. Das Diagnoseprojekt wird
nie in den Workspace übernommen; CAD, Ansichten und IFC bleiben unverändert.

## Messung im Browser

[Rohdaten](asset-recovery-pilot-2026-10-12.json), Windows / eingebetteter Chromium 155,
isolierter Origin `127.0.0.1:8084`, eigene zufällig benannte Datenbank mit Präfix
`novikov-asset-recovery-pilot-`. Sechs unterschiedliche synthetische PNGs, je
1280 × 1280 Pixel, 10.000 Linien plus bestehende Beispielwand/Fenster.
Projekt-JSON 54.268.053 Bytes (51,75 MiB); kein produktiver >32-MiB-Dateiimport.
Zweite Revision ändert eine Linienfarbe. Keine Quelltextänderung während des Laufs.

| Phase | Dauer / logische Bytes |
| --- | --- |
| Erste Header-/Hash-Vorbereitung | 3.679 ms |
| Erste atomare Ablage | 324 ms; 52.642.006 Payloadbytes + 1.626.553 Manifestbytes |
| Zweite Vorbereitung, geprüfte Bilder wiederverwendet | 41 ms; keine neuen Bildhashes |
| Zweiter Stand atomar veröffentlicht | 85 ms; 0 Payloadbytes, 3.253.056 Manifestbytes inkl. Vorgänger |
| Monolithische Hülle mit aktuellem Stand und Vorgänger schreiben | 317 ms; 109.177.178 Bytes |
| Monolithische Kontrolle lesen/validieren/vergleichen | 554 ms |
| Asset-Recovery nach Schließen/Öffnen der Datenbank | 4.155 ms |
| Vorgänger lesen/validieren/vergleichen | 4.203 ms |

Der warme Pilot-Schreibpfad umfasst 41 + 85 = 126 ms; die erstmalige Prüfung ist
zusätzlich teuer. Die Lesemessungen enthalten vollständigen Ergebnis-Hashvergleich.
Die monolithische Kontrolle nutzt JSON-Hülle und Modellvalidierung, aber keine
zusätzliche K02-Header-/Inhaltsschlüsselprüfung: kein Vergleich gleicher Sicherheitsarbeit.
Sie bildet die aktuelle monolithische Datenform nach, ruft nicht den produktiven
Recovery-Service auf (dessen Projektgrenze bleibt 32 MiB). Bytezahlen stammen aus
UTF-8-JSON der Werte; keine IDB-Dateigröße, Transaktionslog-, Kompressions- oder RAM-Messung.
Ein Entwicklungsserverlauf, kein p95, kalter Betriebssystemstart oder Kapazitätsversprechen.

## Abnahme

Alle zwölf Browserprüfungen bestanden: jede unterschiedliche Payload einmal gespeichert;
zweite Revision ohne neue Bildhashes/-writes; vollständiger Modellrundlauf der Kontrolle,
des aktuellen Stands nach erneutem DB-Öffnen und des Vorgängers; veralteter CAS-Schreiber
abgewiesen; echter Transaktionsabbruch nach erfolgreichen Schreibrequests; neue
Testpayload dabei nicht erhalten; veröffentlichter Head/Inhalt nach Konflikt und Abbruch
unverändert; beschädigtes und fehlendes Asset vor Rückgabe abgewiesen.
Die beschädigte Testpayload wurde nach der Prüfung wiederhergestellt. Die Datenbank
bleibt zur Nachprüfung erhalten. Keine Produktionsdaten/Recovery gelöscht.

Zusätzlich drei Node-Regressionstests für Cache-Wiederverwendung, nachträglich veränderte
externe Payloads und Header-/Datenbankgrenzen. Gesamtsuite 883 Tests bestanden.
App- und Benchmark-Typecheck, Build und Lint prüfen den Gesamtstand; Ergebnisse im PR.

Reproduktion: `npm run benchmark:browser -- --port 8084`, dann
`http://127.0.0.1:8084/benchmarks/asset-recovery.html` → **Pilot starten** →
**Bestanden: 12 Prüfungen** → **Ergebnis herunterladen**. Nur synthetische Daten.
Abbrechen wird zwischen Phasen/Bildaufbauten geprüft, unterbricht keine laufende
synchrone Prüfung. Der injizierte Transaktionsabbruch ist unabhängig davon.

## Bewertung und Grenzen

Die Trennung vermeidet das erneute Schreiben unveränderter Bilder und ist als
Persistenzrichtung sinnvoll. Der bestehende K02-Prototyp ist weiterhin kein geeigneter
Produktions-Lesepfad: insbesondere die geerbte vollständige Base64-Dekodierung über
`Uint8Array.from(atob(...))` und Hashvorbereitung müssen einzeln vermessen werden.
Noch keine automatische Migration, GC, Quota-/Stromausfall-/Prozessabsturzprüfung,
Cross-Tab-Rennen mit zwei realen Verbindungen, robuste Prüfung beliebig manipulierter
Manifeste oder verallgemeinerter Lesebudgets. Kontrollierter CAS-Konflikt ist belegt;
kein allgemeiner Crash-Durability-Nachweis. Projektformat, 32-MiB-Produktionsgrenze,
Lizenzgrenzen und Modell-Undo bleiben unverändert.

Der jeweils aktive Folgeauftrag steht ausschließlich in Masterplan §9.

## Nachweis: gemeinsamer Decoder (12.10.2026)

PR260 ist nach grüner CI und ausdrücklicher Freigabe zusammengeführt (`224099c`).
Auf dieser Basis verwendet der Diagnosevertrag jetzt `binaryBytes` aus
`src/interop/images/binary-bytes.ts`. Produktionscode bleibt unverändert.
Die alte Iteratorvariante bleibt ausschließlich als diagnostische A/B-Option erhalten.
Schema, vollständige Base64-Dekodierung, Headervergleich, unveränderter SHA-256-Schlüssel
und abschließende Modellvalidierung bleiben in beiden Varianten gleich.
Kein Leseergebnis-/Integritätscache über die IndexedDB-Vertrauensgrenze hinweg.

[Neue Rohdaten](asset-recovery-read-2026-10-12.json): identische 54.268.053 Projektbytes,
sechs PNGs und 10.000 Linien. Drei Messungen pro Variante auf denselben Datensätzen,
Reihenfolge alt/neu, neu/alt, alt/neu. Jede Messung liest erneut aus IndexedDB und
vergleicht das vollständige Ergebnis inklusive Bilddaten mit dem erwarteten Projekt.

| Phase, Median in ms | Alter Iterator | Gemeinsamer Decoder |
| --- | ---: | ---: |
| IndexedDB-Lesen | 94,5 | 93,5 |
| Payloadschema | 100,5 | 100,0 |
| Base64 und Bytearray | 3.283,8 | 156,4 |
| Header | 0,1 | <0,1 |
| Hashdaten aufbauen | 151,8 | 148,4 |
| SHA-256 | 41,1 | 46,4 |
| Modell validieren | 167,8 | 160,2 |
| Gesamter Serviceaufruf | 3.864,8 | 706,7 |

Etwa 82 % weniger Servicezeit in diesem Profil. Phasenmediane sind nicht additiv.
`totalMs` enthält die gesamte Servicearbeit, aber nicht den zusätzlichen Ergebnis-Hash
des Testharness; dessen Aufwand ist in `phases` enthalten. Dort liegt der Median bei
4.061,1 bzw. 899,7 ms. Keine p95-/RAM-/GPU-Aussage; keine kalten OS-/Diskcaches.
„Kalt“ meint hier Prüfung erneut gelesener Inhalte ohne vorbereiteten Assetcache.
Messungen liefen ohne parallele Tests/Builds oder Hot-Reload.

18 Browserprüfungen bestanden, darunter die sechs neuen vollständigen A/B-Vergleiche
sowie weiterhin Vorgänger, CAS, Abbruch/Rollback und korrupte/fehlende Assets.
884 Node-Tests bestanden. Neuer Regressionstest vergleicht Payload und Schlüssel und
prüft beide Wege gegen ungültiges Base64, falsche Dimensionen/MIME, unbekannte Header
und zusätzliche Felder. Bestehende Bytegleichheitstests des gemeinsamen Decoders bleiben
in der Suite. App-/Benchmark-Typecheck und Build bestanden; Lint 0 Fehler/6 bekannte Warnungen.

Reproduktion wie oben; nun lautet das Abschlussresultat **Bestanden: 18 Prüfungen**.
Die Datenbankspeicherung und die Grenzen des ursprünglichen Piloten bleiben unverändert.
Die Verbesserung rechtfertigt weitere Kapazitätsmessungen mit diesem gemeinsamen
Baustein, keinen neuen Decoder, Worker oder Renderer auf Verdacht.
