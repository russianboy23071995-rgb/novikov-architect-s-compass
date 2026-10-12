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

## 100-MiB-Browserprofil (12.10.2026)

Basis `b6a51a3`, PR261 nach erfolgreicher CI und ausdrücklicher Freigabe zusammengeführt.
Der vorhandene Pilot bietet jetzt 50 MiB (A/B) und 100 MiB (gemeinsamer Decoder).
Für 100 MiB gelten ausschließlich diagnostisch 128 MiB aggregierte Base64-Zeichen und
40 Millionen Bildpixel; 50 MiB behält 64 MiB/32 Millionen. Einzelbildregeln unverändert.
Keine Änderung am Produktionslimit von 32 MiB oder am Projektformat.

[Rohdaten](asset-recovery-100-2026-10-12.json): 106.911.023 Projektbytes (101,96 MiB),
zwölf unterschiedliche 1280×1280-PNGs, 10.000 Linien, Beispielwand/Fenster.
15 Browserprüfungen bestanden: drei vollständige Leservergleiche plus die zwölf
Sicherheits-/Rundlaufprüfungen des Ausgangspiloten. Kein alter Decoder im 100-MiB-Lauf.

| Arbeit | Messung |
| --- | ---: |
| Erstvorbereitung | 1.271 ms |
| Erste atomare Ablage | 648 ms, 105.284.076 Payloadbytes + 1.627.897 Manifestbytes |
| Warme Vorbereitung | 49 ms, keine neuen Bildhashes |
| Zweiter Stand | 93 ms, 0 Payloadbytes + 3.255.744 Manifestbytes |
| Monolithische Kontrollhülle | 633 ms, 214.463.622 Bytes |
| Vollständiges Lesen, Service-Median aus 3 Läufen | 1.573 ms |
| Lesen inklusive zusätzlichem Ergebnisvergleich, Median | 2.036 ms |

Long-Task-Beobachter: 30 Einträge über den gesamten Lauf, längster 1.880 ms während
„Lesepfad gemeinsam / 3“. Die Phasen enthalten auch die zusätzliche JSON-/Hashprüfung
des Harness. Daraus folgt keine reine Service-Long-Task-Dauer. Die Phasenstarts stehen
in derselben Performance-Zeitbasis wie die Long Tasks. Keine erzwungene Garbage Collection.

`performance.memory` meldete bei Phasenenden maximal 2.228.820.003 Bytes verwendeten
JS-Heap (2,08 GiB), am Ende 667.892.622 Bytes. Stichproben, kein echter Peak und kein
Gesamtprozess-/GPU-RAM. Fixture, monolithische Kontrolle, vollständige JSON-Prüfkopien
und noch nicht eingesammelte temporäre Objekte sind enthalten; kein Nachweis eines Lecks.
Diese Chromium-spezifische API kann ungenau sein oder fehlen (dann `null`).
`navigator.storage.estimate()` meldete originweit 324.666.894 → 644.941.360 Bytes Nutzung.
Der Origin enthält vorherige Piloten; auch die monolithische Kontrolle wird gespeichert.
Die Differenz ist deshalb keine isolierte Assetstore-Größe oder Quota-Garantie.

884 Tests, beide Typechecks und Build bestanden; Lint 0 Fehler/6 bekannte Warnungen.
Reproduktion: Diagnose auf Port 8084 → Profil **100 MiB** → **Pilot starten** →
**Bestanden: 15 Prüfungen**. Ergebnis herunterladen. Kein Hot-Reload oder paralleler
Build während der Messung. Die Auswertung/Download-Automation antwortete stark verzögert;
die abgeschlossenen Browserphasen sind mit eigenen Zeitstempeln dokumentiert, nicht aus
der Tool-Laufzeit abgeleitet. Kein Prozessabsturz beobachtet oder behauptet.

Bewertung: funktionaler 100-MiB-Service-Nachweis gelungen, keine produktive Kapazitätsfreigabe.
Vor weiteren Größenstufen müssen die Messkopien von Servicekosten und Hauptthreadpausen
getrennt werden. Genau ein Folgeauftrag dazu steht in Masterplan §9; kein vorsorglicher
Architektur-/Workerwechsel und keine Wiederholung der bereits geklärten Decoderfrage.

## Service und Prüfkopien getrennt (12.10.2026)

Basis `7ddb5aa` (PR262 nach grüner CI und ausdrücklicher Freigabe zusammengeführt).
Neue reine Leseseite `benchmarks/recovery-read-isolation.html`; Speicheradapter und
Validierungslogik unverändert. Der bestehende Fixturelauf speichert zusätzlich nur den
vorab berechneten Sollhash, Projekt-ID und Revision als kleine Diagnosemetadaten.
Die Leseseite öffnet ausschließlich eine vorhandene Pilotdatenbank (Version 1).
Sie lädt keine monolithische Kontrollhülle und keine Ausgangsfixture in den Speicher.
Vorbereitungstab geschlossen, danach frische Leseseite; kein erzwungenes GC.

[Fixture-/Fehlerprüfungen](recovery-isolation-seed-2026-10-12.json): erneut 15 bestanden.
[Isolierte Rohdaten](recovery-read-isolation-2026-10-12.json): drei Wiederholungen,
jeweils vollständiger Modell-/Payloadhash und identische Revision bestätigt. Die
Integritätsprüfungen des Service bleiben unverändert. IndexedDB-Inhalte der Leseseite
werden nicht geändert. Ein Timer-Task trennt Service und zusätzlichen Vergleich;
Ergebnisreferenz nach Vergleich freigegeben. Speicherfreigabe durch GC wird nicht behauptet.

| Messung | Ergebnis |
| --- | --- |
| Servicezeiten | 1.662 / 1.645 / 1.644 ms |
| Zusätzlicher Ergebnisvergleich | 444 / 420 / 422 ms |
| Längste Service-Tasks je Runde | 1.465 / 1.477 / 1.418 ms |
| Vergleichs-Tasks | 444 / 420 / 421 ms |
| JS-Heap nach Service | 432.292.690 / 407.223.797 / 443.735.921 Bytes |
| JS-Heap nach Vergleich | 626.456.464 / 604.617.640 / 637.821.546 Bytes |

Phasen und Long Tasks teilen dieselbe Performance-Zeitbasis. Taskstarts können dem
ersten `performance.now()` einer Phase minimal vorausgehen; Zuordnung über Überlappung,
nicht bloß start >= Phasenstart. Die separate abschließende Modellvalidierung benötigt
hier 370–405 ms. Ein synchroner Abschnitt bleibt also selbst nach Aufteilung der
Bildschleife relevant. Kein OS-Kaltstart, Gesamtprozess-RAM oder GPU-Messwert; die
Chromium-Heap-Stichprobe ist kein Peak. Die früheren 2,08 GiB waren durch den breiteren
Testaufbau beeinflusst; ein allgemeines Speicherleck lässt sich daraus nicht ableiten.

**Befund:** Die Browserpause ist auch ohne Vergleich real. Der nächste begrenzte Pilot
soll kooperativ zwischen Assetprüfungen und vor der abschließenden Modellprüfung an den
Browser abgeben. Vollständige Validierung bleibt Voraussetzung einer Rückgabe; kein
teilvalidiertes Modell. Restpause der Modellvalidierung getrennt messen, nicht verdecken.
Keine Produktions-/Worker-/Formatänderung aus diesem Nachweis.

884 Tests, beide Typechecks, Build bestanden; Lint 0 Fehler/6 bekannte Warnungen.
Praktische Reproduktion: aktuellen 100-MiB-Fixturelauf ausführen, dessen `dbName` aus
dem Ergebnis kopieren, Vorbereitungstab schließen, auf Port 8084 die neue Leseseite
öffnen, Datenbanknamen einsetzen, **Lesetest starten**. Erwartet: **Bestanden: 3 vollständige
Vergleiche**. Alte Pilotdatenbanken ohne Sollhash werden verständlich abgewiesen.

## Kooperative Assetprüfung und Abbruch (12.10.2026)

Basis `10f61f9`, PR263 nach grüner CI und ausdrücklicher Freigabe zusammengeführt.
Nur der Diagnose-Service gibt jetzt nach der abgeschlossenen Lesetransaktion, zwischen
vollständig geprüften Assets (einschließlich vor Modellvalidierung) und vor Rückgabe
per Timer-Task an den Browser ab. Keine wartende IndexedDB-Transaktion. Ein optionales
AbortSignal wird vor dem Lesen und vor/nach jedem Taskwechsel geprüft. Eine bereits
laufende synchrone Prüfung oder IDB-Lesetransaktion wird nicht mitten darin unterbrochen;
bei Abbruch wird anschließend kein Modell zurückgegeben. Keine Modell- oder DB-Mutation.
Der injizierbare Scheduler dient gezielten Diagnosetests; Standard ist ein echter Timer,
kein bloßer Microtask. Der Schreibpfad ist unverändert.

[Isolierte Messung](cooperative-recovery-2026-10-12.json), identische gespeicherte
100-MiB-Fixture wie zuvor, frische Seite, keine parallelen Builds/Tests:

| Messung | Ergebnis |
| --- | --- |
| Servicezeiten | 1.961 / 1.617 / 1.679 ms; Median 1.679 ms |
| Längste Service-Tasks | 390 / 360 / 347 ms (vorher bis 1.477 ms) |
| Einzelne Asset-Tasks in den drei Messrunden | 73–98 ms |
| Abschließende Modellvalidierung | 390,5 / 360,0 / 347,2 ms |
| Getrennter Ergebnisvergleich | 428 / 410 / 422 ms |

Die Gesamtzeit verbessert sich nicht wesentlich; Ziel ist Reaktionsfähigkeit zwischen
Prüfabschnitten. Der erste IDB-Zugriff dauerte 514 ms gegenüber 174/203 ms danach.
Keine p95-/Kaltstartgarantie. Trotz deutlicher Reduktion weiterhin Long Tasks; weder
flüssige 60-fps-Bedienung noch sofortiger Abbruch innerhalb synchroner Abschnitte behauptet.
Heap-Stichproben und Vergleichsaufgaben bleiben in den Rohdaten, keine Peak-/Leak-Aussage.

Drei vollständige Modell-/Payload-/Revisionsvergleiche bestanden. Anschließend drei
gezielte Signalabbrüche: vor Lesen, nach erstem geprüften Asset und nach abschließender
Modellvalidierung vor Rückgabe. Alle ohne Modellrückgabe. Das sind deterministische
Scheduler-Injektionen, kein getesteter neuer UI-Abbruchbutton. Die bestehende Leseseite
enthält weiterhin nur den Teststart; Einbindung in Produkt-UI bleibt außerhalb des Piloten.
[Frischer 100-MiB-Sicherheitslauf](cooperative-recovery-safety-2026-10-12.json): alle
15 bestehenden Prüfungen einschließlich beschädigter/fehlender Assets, CAS und
Transaktionsrollback erneut bestanden. Node-Test ergänzt Taskwechsel und Abbruch vor/nach
Scheduling. 885 Tests, beide Typechecks und Build bestanden; Lint 0 Fehler/6 bekannte Warnungen.

Reproduktion wie beim isolierten Lesetest; neues Ergebnis: **3 Abbrüche und 3 vollständige
Vergleiche**. Die verbleibende Modellprüfung bündelt unter anderem erneute Asset-Schemaprüfung.
Nächster begrenzter Auftrag laut Masterplan §9: vorhandene unveränderliche Asset-Handles
bereits in den einzelnen geprüften Abschnitten aufbauen und für die Schlussprüfung nutzen,
ohne IndexedDB-Daten pauschal zu vertrauen oder neue Vertrauensmarker einzuführen.

## Vorbereitete Asset-Handles im Abschluss (12.10.2026)

Basis `c85d2d3`, PR264 nach grüner CI und ausdrücklicher Freigabe zusammengeführt.
`restoreCheckedSnapshot` prüft weiter Speicherschema, Bildheader und Inhaltsschlüssel
jedes referenzierten Payloads. Danach erstellt es mit dem bestehenden
`createImageAssetHandle` je logischer ID ein eigenes unveränderliches Handle. Diese
Speicherschemaprüfung findet innerhalb der kooperativen Abschnitte statt. Die abschließende
`validateProject`-Prüfung verwendet dieselben Handles und prüft weiter Modell und Referenzen.
Keine neuen Vertrauensmarker; Datenbankobjekte gelten weiterhin als ungeprüft.
Gemeinsamer Payload wird einmal gehasht; mehrere IDs und ihre Reihenfolge bleiben erhalten.
Kein Zwischenergebnis wird veröffentlicht. Schreibtransaktion, Format und Produktion unverändert.

[Gleiche isolierte 100-MiB-Fixture](recovery-handles-2026-10-12.json), frische Seite:

| Messung | Drei Wiederholungen |
| --- | --- |
| Gesamter Service | 1.529 / 1.594 / 1.585 ms |
| Handleaufbau, über alle Bildabschnitte summiert | 292 / 302 / 288 ms |
| Abschließende Modellprüfung | 60,7 / 51,6 / 42,8 ms |
| Längste Service-Task | 114 / 115 / 137 ms |

Vorher Modellprüfung 347–391 ms und maximale Service-Task 390 ms. Die umfangreiche
Speicherprüfung wird zeitlich verteilt, nicht weggelassen. Gesamtzeit nur moderat verändert;
keine 60-fps-/p95-Garantie. Einzelne Tasks bleiben über 50 ms. Vergleichshashes und
Speicherstichproben separat in den Rohdaten, keine Prozesspeak-/GPU-Aussage.

Drei vollständige Modell-/Payload-/Revisionsvergleiche und drei Signalabbrüche bestanden.
[Frischer Sicherheitslauf](recovery-handles-safety-2026-10-12.json): erneut 15 Prüfungen
für 100 MiB einschließlich CAS, Rollback und defekter/fehlender Bilder. Drei neue
Node-Regressionen: gleiche Inhalte mit getrennten IDs und erhaltenen Handleidentitäten;
fehlende/korrupte Payloads sowie ungültige Ebenenreferenz; Abbruch bei Handleaufbau und
nach Modellprüfung. 888 Tests, beide Typechecks und Build bestanden; Lint 0 Fehler/6
bekannte Warnungen. Reproduktion unverändert über reine Leseseite und vorhandene Fixture.

Die nachgewiesene 100-MiB-Basis reicht für die nächste begrenzte Größenmessung. Die
Produktionsanbindung, Migration und allgemeine Dateifreigabe bleiben separat offen.

## Begrenztes 250-MiB-Profil (12.10.2026)

[Gesamtlauf](recovery-250-2026-10-12.json) und
[isolierter Lesetest](recovery-250-isolated-2026-10-12.json), Windows/Chromium 155,
Diagnose-Port 8084. 264.839.809 Byte (252,57 MiB) Projekt-JSON, 30 verschiedene
1280×1280-PNGs (49,152 MP), 10.000 Linien und bestehendes Beispielmodell.
Keine parallele monolithische Doppelhülle; deren Kontrollvergleich entfällt ausdrücklich.
Vollständige Modell-/Payloadhashes bleiben als eigenständige Vergleichsaufgaben erhalten.

| Messung | Ergebnis |
| --- | --- |
| Erstvorbereitung / atomarer Erstwrite | 3.423 / 1.587 ms |
| Warme Vorbereitung / zweite Veröffentlichung | 52 / 299 ms |
| Unveränderte Bilder bei zweiter Revision | 0 neue Hashes, 0 Payloadwrites |
| Isolierter Service, drei Wiederholungen | 4.115 / 4.156 / 4.024 ms |
| Längste Service-Task je Wiederholung | 154 / 126 / 152 ms |
| Abschließende Modellprüfung | 65 / 59 / 48 ms |
| Separate Vergleichsaufgabe | 1.081 / 1.065 / 1.069 ms |

14 Prüfungen im Gesamtlauf bestanden: einmalige Assetspeicherung, warme Wiederverwendung,
drei vollständige Leservergleiche, Wiederöffnung, Vorgänger, CAS-Konflikt,
Transaktionsrollback einschließlich neuer Payload, unveränderter Head sowie beschädigte
und fehlende Assets. Frische Leseseite nach Schließen des Erzeugertabs: drei vollständige
Modell-/Payload-/Revisionsvergleiche und drei Abbrüche ohne Modellrückgabe bestanden.
Die Abbrüche sind deterministische Scheduler-Injektionen vor Lesen, nach erstem Asset
und nach Modellprüfung; keine Behauptung eines getesteten neuen Produkt-Abbruchbuttons.

Diagnosebudgets: maximal 320 MiB Payloadzeichen und 64 MP bei Vorbereitung. Der
Gesamtlauf besitzt eine kooperative 120-s-Zeitgrenze und eine Heap-Stichprobengrenze
von 2,5 GiB vor Phasen/Fixturebildern; beide wurden nicht erreicht. Kein harter
RAM-Schutz: synchrone Aufgaben/IDB-Transaktionen werden nicht sofort unterbrochen,
Heapwerte sind optional. Die bestehende reine Leseseite hat diese Gesamtlaufwächter
nicht; ihr fester Ablauf wurde vollständig beendet.

Größte Heap-Stichprobe im Gesamtlauf 1,67 GiB; isoliert nach Service 424–681 MiB,
nach Vergleich bis 1,13 GiB. Keine erzwungene GC, kein echter Prozesspeak, kein
GPU-/Leaknachweis. Origin-Storage nahm ungefähr 251,5 MiB zu; andere Pilotdatenbanken
waren vorhanden. Keine Datenträger-/Quota-/Crashgarantie. Long Tasks bleiben messbar,
insbesondere separate Vergleichshashes über eine Sekunde gehören zum Harness.

888 Node-Tests, App-/Benchmark-Typechecks und Produktionsbuild bestanden; Lint
0 Fehler/6 bekannte Warnungen. Keine Produktionsformat-/Limitänderung.
Reproduktion: `benchmarks/asset-recovery.html` auf Diagnose-Port 8084, Profil
„250 MiB · ohne Kontrollhülle“, Pilot starten; anschließend Erzeugertab schließen
und den ausgegebenen Datenbanknamen in `recovery-read-isolation.html` einsetzen.
Die produktive Anwendung bleibt unberührt. Dieser Befund trägt die nächste begrenzte
Application-/Migrationsanbindung; er ersetzt deren Sicherheits- und Integrationstests nicht.

## Application-Vertrag für Recovery V2 (12.10.2026)

`src/application/project-files/recovery-v2.ts` besitzt die gemeinsamen Typen für
Manifest, Payload, versionierten Recovery-Stand und Storage-/Codec-Ports. Der
Diagnosecodec importiert diese Typen; Produktcode importiert keine Benchmarks.
Das Portobjekt enthält aufgelöste Dokumente für den Austausch, **keine neue monolithische
Dateihülle**. Der Adapter muss Bildinhalte nach Schlüssel separat speichern und wiederverwenden.

`restoreRecoveryV2` prüft Version/Projektkontext und jeden gewählten Stand über den
vollständig prüfenden Codec. Beschädigtes current darf auf geprüftes previous zurückfallen;
unbekannte Recordversion und Signalabbruch führen nicht zu stiller Wiederherstellung.
`migrateRecoveryV1` prüft vorhandene V1-Snapshots mit der bisherigen Dateigrenze,
bereitet gültige current/previous-Stände vor und liest sie durch denselben Codec zurück.
Bei ungültigem current wird der gültige Vorgänger zum neuen current. Fremde Projektkontexte
blockieren die Migration. Defekter bereits vorhandener V2-Stand wird nicht überschrieben.

Die atomare Veröffentlichung muss **V1-Quelltext und V2-Revision** vergleichen.
Erfolg erst nach Commit; kein V1-Löschen und kein persistierter Vertrauensmarker.
Ein Abbruch nach erfolgreichem Commit darf nicht fälschlich als fehlgeschlagene Speicherung
gemeldet werden. Kein Mount ins UI, kein Modell-Undo und kein Produktionsadapterwechsel.

Neun neue Tests in `benchmarks/recovery-v2.test.ts` verwenden echte Payload-/Header-/Hash-
und Modellprüfung sowie unveränderliche Handles. In-Memory-Port simuliert Konflikte,
Schreibfehler und Commitgrenze. 897 Tests insgesamt, App-/Benchmark-Typechecks und Build
grün; Lint 0 Fehler/6 bekannte Warnungen. Keine neue Browserabnahme behauptet:
Die Einhaltung der Transaktionsregeln durch einen realen V2-IndexedDB-Adapter ist der
nächste ausdrücklich begrenzte Auftrag. Die existierenden V1- und Diagnosetests bleiben erhalten.

## Isolierter V2-IndexedDB-Adapter (12.10.2026)

`src/interop/project-file/recovery-codec.ts` enthält nun die bislang im Pilot
geprüften Schema-/Header-/SHA-Prüfungen, kooperativen Leseabschnitte, Handles und
Vorbereitung mit expliziten Assetbudgets. Die bisherigen Benchmarks delegieren dorthin;
keine zweite Kopie der Prüflogik. Diagnostische Profile bleiben im Benchmarkwrapper.

`recovery-v2-storage.ts` erfüllt den Application-Port auf einer explizit isolierten
Datenbank (`novikov-recovery-v2-pilot-*`). Getrennte Stores für V1, V2-Heads und
inhaltsschlüsselgebundene Payloads. Beide Manifeste und Payloads werden aus einer
konsistenten Lesetransaktion bezogen. Fehlende Payloads bleiben fehlend, sodass die
Application den geprüften Vorgänger versuchen kann. Unbekannte Versionen werden
weder migriert noch überschrieben.

Publikation besitzt vor asynchroner Prüfung eine eigene Kopie des Kandidaten.
Current und previous werden einzeln vollständig geprüft; ein defekter neuer Stand
darf sich nicht hinter einem gültigen Vorgänger verstecken. In EINER Schreibtransaktion:
Vergleich des V1-Quelltextes und der V2-Revision, Prüfung vorhandener Payloadgleichheit,
Einfügen fehlender Payloads und Veröffentlichung des Heads. Bestätigung nur nach
`oncomplete`; Fehler/Abort rollen sämtliche neuen Daten zurück. V1 bleibt unberührt.
Es handelt sich noch nicht um die Migration des bestehenden produktiven Katalogs.

[Browser-Rohdaten](recovery-v2-adapter-2026-10-12.json): **21 Prüfungen bestanden**.
Zwei reale Datenbankverbindungen, genau ein CAS-Gewinner, geänderter V1-Token,
Abbruch nach erfolgreichem Head-Request vor Commit samt neuer Payload, vollständiger
Rundlauf/Vorgänger, fehlendes current-Bild mit gültigem previous, beschädigte/fehlende
Payloads, ungültige Migration, unbekannte Version und Wiederöffnung nach den Fehlerfällen.
Die Abort-Injektion beobachtet nur im Harness den echten Headrequest über einen
lokalen Proxy; der Adapter enthält keinen produktiven Fehler-Injektionsschalter.
Keine echten Projektdaten geändert, keine Quota-/Stromausfallgarantie abgeleitet.

897 Node-Tests, App-/Benchmark-Typechecks und Build bestanden. Lint 0 Fehler/6 bekannte
Warnungen. Praktischer Abnahmetest: Diagnose-Vite auf Port 8084, Seite
`/benchmarks/recovery-v2-browser.html`, „Prüfung starten“ → „Bestanden: 21 Prüfungen“.
Jeder Lauf verwendet eine neue synthetische Datenbank. Kein sichtbarer CAD-UI-Wechsel.

Grenzen: Adapter überprüft vor jedem Publish vollständig und ist noch nicht als schneller
warmer Produktionswriter freigegeben. Lesebudgets/Katalog-/Startangebotintegration und
produktive Migration bleiben offen. Der nächste begrenzte Writerauftrag setzt explizite
Eingangsbudgets und Sitzungskontext vor der Produktanbindung durch. Produktionslimit
weiterhin 32 MiB, kein Dateiformatwechsel für manuell gespeicherte Projekte.

## Zustandsgebundener V2-Writer (12.10.2026)

`prepareRecoveryV2Writer` in der Application-Schicht besitzt erwartete Revision und
letzten gültigen Snapshot privat. Bei defektem current wird der vollständig geprüfte
Vorgänger weitergeführt. Unmigrierte V1-Quellen verlangen ausdrücklich zuerst Migration;
unbekannte V2-Versionen blockieren. Jeder neue Stand passiert Domainprüfung und Codec.
Nur erfolgreiches Publish aktualisiert die interne Revision und den Vorgänger.
Fehler/Abbruch erlauben Retry; externe CAS-Konflikte bleiben bis zur neuen Writersitzung
sichtbar. Parallele Aufträge derselben Sitzung werden abgewiesen.

`createBoundedRecoveryCodec` verlangt explizite Modellbyte-, Payloadzeichen- und
Pixelbudgets. Vorbereitung sowie Wiedereinlesen prüfen diese Grenzen; zusätzliche
Schema-/Header-/Hash-/Modellprüfung bleibt erhalten. Keine neuen Produktdefaults.
Grenzen sind Eingangsprüfungen, kein harter Peak-RAM-Schutz; IDB-Snapshot liegt vor
Codecprüfung bereits im Speicher. Synchrone Abschnitte bleiben synchron.

Der Port übergibt den aktuellen Sitzungskontext an IndexedDB. Alle Payloadrequests
müssen vor dem finalen Headrequest erfolgreich sein. Dessen Erfolg prüft den Kontext
noch innerhalb der Transaktion und bricht bei Veraltung atomar ab. Nach abgeschlossenem
Commit meldet ein verspäteter Abbruch nicht fälschlich einen Speicherfehler.

[Browsernachweis](recovery-v2-writer-2026-10-12.json): 30 Fälle bestanden, einschließlich
aller bisherigen 21 Adapterregressionen sowie Writer-Speicherung, Abbruch/Retry,
Kontextveraltung am finalen Headrequest und externer Konflikt mit neuer Writersitzung.
Gleiche Diagnoseseite auf Port 8084, „Prüfung starten“; synthetische Datenbank.
Fünf neue Node-Tests mit mehreren Szenarien für gültigen Vorgänger, Schreibfehler/Retry,
Parallelität, Abbruch, Kontext, Versionen, externe Konflikte und Budgetgrenzen.
902 Tests, App-/Benchmark-Typechecks und Build bestanden; Lint 0 Fehler/6 bekannte
Warnungen. Kein neuer UI-/Katalogpfad aktiviert. Nächster Schritt ist die begrenzte
Produktanbindung für ein ausgewähltes Projekt; manuelles Dateiformat und 32-MiB-Grenze
bleiben davon getrennt. Kein Nachweis für schnelle warme Großprojektsicherung oder
Stromausfall-/Quota-Verhalten durch diese kleinen Sicherheitsfixtures.
