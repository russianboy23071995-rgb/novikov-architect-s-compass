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


## Produktive Versionsroute (12.10.2026)

Der Browserkatalog verwendet jetzt den bestehenden Application-V2-Writer. IndexedDB
Version 3 ergänzt Head-/Assetstores; V1-Snapshotstores bleiben erhalten. Auflisten und
Startangebot lesen nur. Beim Vorbereiten einer Sicherung (auch Autosave-Aktivierung)
wird ausschließlich das ausgewählte Projekt migriert. Der bisherige manuelle Slot und
andere Projekte bleiben unverändert. Katalogzeitpunkt und Head werden in derselben
Transaktion veröffentlicht. Der V1-Kompatibilitätsschreiber weist bereits migrierte
Projektziele ab. Unbekannte Versionen bleiben sichtbar und werden nicht überschrieben.
UI, Modellaktionen, History und manuelles Dateiformat ändern sich nicht.

Konservative Produktionsbudgets: weiterhin 32 MiB gesamtes portables JSON, zusätzlich
32 MiB Modelltext, 32 MiB Payloadzeichen und 128 Millionen Gesamtpixel. Letzteres ist
eine zusätzliche Schutzgrenze, keine zugesicherte Kapazität. Alte Originale bleiben bei
Budgetfehlern erhalten. Die Gesamtdateiprüfung serialisiert noch das volle Modell;
dieser Schritt behauptet deshalb keinen neuen Performancegewinn. Ein IDB-Read kann
Daten bereits vor der Codecprüfung allozieren. Keine Garbage Collection alter Assets.

[Browsernachweis](recovery-routing-2026-10-12.json): 19 Prüfungen auf einer separaten
synthetischen Datenbank, einschließlich echtem Datenbankupgrade von Version 2 auf 3,
PNG-Referenz, bestehendem saveNow-/Autosave-Controller, erneut geöffnetem Katalog,
Startangebot, vollständigem Projektvergleich, atomarem Rollback, erhaltenem V1,
unmigriertem Fremdprojekt, Vorgängerfallback und unbekannter Version. Reproduktion:
Diagnoseserver, `/benchmarks/recovery-routing.html`, Prüfbutton. Das erneute Öffnen
verwendet frische Controller/DB-Verbindungen; kein vollständiger Browser-/OS-Neustart
und kein praktischer CAD-Canvas-Test. Produktive Nutzerdaten wurden nicht verwendet.
902 Node-Tests, beide Typechecks, Produktionsbuild bestanden; Lint 0 Fehler/6 bekannte
Warnungen. Folgeauftrag ausschließlich Masterplan §9.


## 128-MiB-Grenze: produktiver 100-MiB-Serviceablauf (12.10.2026)

Die gemeinsame Projektgrenze beträgt jetzt 128 MiB (UTF-8, inklusive). Dateiöffnung,
Modell-Commit, Download und V2-Katalog verwenden diese Grenze. Individuelle Bildgrenze
weiterhin 10 MiB; Recovery zusätzlich maximal 128 Millionen Pixel sowie getrennte
Modell-/Payloadbudgets von je 128 MiB, bei weiterhin 128 MiB Gesamtdateigrenze.
Kein neues Format, keine geänderte Modellkopie und keine UI-/Historyänderung.

Reproduktion: Diagnoseserver Port 8084, `/benchmarks/project-capacity.html`, „Ablauf
prüfen“. [Rohdaten](project-capacity-128-2026-10-12.json). Zwölf verschiedene 1280×1280
PNGs und 10.000 Linien; 106.911.015 Byte = 101,96 MiB. Sechs Prüfungen bestanden:
Profilgröße, vollständiges Öffnen, genau ein Undo, vollständiger Undo-Rundlauf,
gespeicherte Datei und wiederaufgenommenes V2-Projekt einschließlich aller Bilddaten.

| Phase | Dauer im protokollierten Lauf |
| --- | --- |
| Datei öffnen | 1.760 ms |
| Wand ändern + Commit | 809 ms |
| Undo / Redo | 0,3 / 0,1 ms |
| Datei serialisieren und Download-Port aufrufen | 603 ms |
| Erneut öffnen | 1.832 ms |
| V2 sichern | 4.456 ms |
| V2 wiederaufnehmen | 2.267 ms |

Dies ist ein vollständiger **Serviceablauf**, kein Canvas-Bediennachweis. Der Download-Port
fängt den tatsächlichen Dateiinhalt zum Wiederöffnen ab; kein Beleg für dauerhafte
Dateisystemspeicherung. Frischer Katalog/DB-Verbindung statt Browser-/OS-Neustart.
Synthetische separate Datenbank, Nutzerdaten unverändert. Einzellauf im Devserver,
keine Referenzhardware-Garantie/p95. Hauptthread-Pausen bestehen; Heap-Stichproben
bis etwa 1,69 GB enthalten Fixture, Kontrolltexte und Vergleichskopien und sind kein
isolierter Produkt-Peak. Die vorherige Erkundung war ebenfalls vollständig erfolgreich.
128 MiB ist eine Eingangsgrenze, keine Garantie flüssiger Bedienung oder beliebiger
Geometriedichte. Die monolithischen Serialisierungen sind der nächste begrenzte Auftrag.

902 Tests bestanden: aktualisierte exakte UTF-8-Grenze, vorgezogene Größenablehnung,
überzählige gültige Bildpayloads und geschützte History. Die vorhandene isolierte
Node-Kapazitätsdiagnose verwendet nun die aktuelle Grenze statt einer festen 32-MiB-
Annahme. Produktionsbuild bestanden. Alte Rohdaten und damalige Kapazitätsaussagen
bleiben historisch unverändert.
App- und Benchmark-Typechecks ebenfalls bestanden; Lint 0 Fehler/6 bekannte Warnungen.


## Modell-Commit ohne monolithische Payloadserialisierung (12.10.2026)

Der Commit validiert neuen und bisherigen Stand weiterhin vollständig. Für den exakten
UTF-8-Dateiumfang serialisiert `validatedProjectByteLength` alle Felder einschließlich
leerer Asset-Datenstrings und addiert die Längen der schema-geprüften kanonischen
Base64-Strings. Diese sind ASCII und benötigen keine JSON-Escapes. Jeder Asset-Eintrag
zählt, auch mehrfach verwendete Payloads. Keine IDs als Vertrauenssignal und kein Cache
auf veränderlichen Projekten. Der Baustein darf ausschließlich nach Schema-Prüfung
verwendet werden; ungeprüfte Dateieingänge behalten ihre Textbyteprüfung.

Der vorhandene strukturierte Vergleich prüft nun auch vollständige Inhalte für No-op;
Ansichtseinstellungen bleiben wie zuvor außerhalb der Modellhistory. Keine Delta-History,
keine Änderung der 128-MiB-Grenze oder des Dateiformats. Die bisherigen Übergrößentests
prüfen weiterhin gültige Einzelbilder oberhalb der Gesamtgrenze und unveränderte History.
Neue Tests vergleichen UTF-8 mit Umlauten, Emoji, Escapes, mehreren Payloads und Reihenfolge
gegen vollständiges JSON und prüfen No-op sowie reine Sichtbarkeitsänderungen.

[Browser-A/B](commit-assets-2026-10-12.json), gleiche Seite `/benchmarks/project-capacity.html`:
drei Paare mit identischem validiertem Ausgangsstand/Kandidaten (101,96 MiB). Der alte
Commitpfad ist explizit als Vergleich in der Diagnoseseite enthalten. Vollpfad 608–668 ms,
optimiert 81–122 ms; Median 643,5 → 97,9 ms (etwa 85 % kürzer). Kontrollvergleiche laufen
außerhalb der Commitmessungen. Alle drei Ergebnisse und Historylängen identisch; insgesamt
neun Prüfungen inklusive Öffnen, Undo/Redo, Datei- und produktivem V2-Rundlauf bestanden.
904 Node-Tests und Produktionsbuild bestanden. Es bleiben Hauptthread-Aufgaben über 50 ms.
Kein isolierter RAM-Peak, keine Hardware-/p95-Garantie und keine Canvas-Bedienabnahme.
Weitere Lade-/Recoverykosten unverändert; nächster Einzelauftrag nur Masterplan §9.
App-/Benchmark-Typechecks bestanden; Lint 0 Fehler und 6 bekannte Warnungen.


## Produktives V2-Budget ohne Payloadserialisierung (12.10.2026)

`createProjectRecoveryCodec` bündelt die bisherigen Produktionsbudgets. Vorbereitung
validiert weiterhin vollständig; Wiederherstellung behält auch die zusätzliche bisherige
Serialisierungsvalidierung bei. Lediglich die Gesamtgrößenprüfung verwendet jetzt die
exakte Struktur-plus-Base64-Längenberechnung aus PR272. Hash-/Headerprüfung, getrennte
Budgets, Quell-/Revisionsvergleich, Kontextprüfung, Vorgänger und atomare Katalogwrites
bleiben bestehen. Kein neues Format und keine weitere Limitanhebung.

[Messung](recovery-budget-2026-10-12.json): drei A/B-Paare mit 101,96 MiB. Für den alten
Pfad ersetzt nur die Diagnoseseite das gemeinsame Codecobjekt durch den bisherigen
Serialisierungswrapper; auch der Storage-Port verwendet dieses Objekt. Beide Varianten
verwenden dieselben Application-/IndexedDB-Pfade, separate synthetische Datenbanken und
den gleichen Ausgangsstand. Sicherungsmedian 4.645 → 3.234 ms (30 % kürzer), Lesemedian
2.456 → 1.673 ms (32 % kürzer). Alle sechs vollständigen Recovery-Inhaltsvergleiche
bestehen; insgesamt 14 Ablaufprüfungen einschließlich Datei, Commit und Undo.

[Erneute Sicherheitsprüfung](recovery-budget-safety-2026-10-12.json): alle 19 bestehenden
Browserfälle bestanden, darunter atomarer später Abbruch, V1-Erhalt, current/previous,
unbekannte Version und Autosave mit Bild. Neuer Codec-Test prüft vollständigen Rundlauf,
ungültiges Base64, übergroße UTF-8-Metadaten und Signalabbruch. 905 Tests, App-/Benchmark-
Typechecks und Build bestanden; Lint 0 Fehler/6 bekannte Warnungen.

Drei sequenzielle A/B-Paare im Entwicklungsbrowser, kein p95-/Hardwareversprechen.
Hauptthread-Aufgaben bleiben vorhanden. Heapwerte enthalten Kontrollkopien und sind kein
isolierter Produkt-Peak. Keine echte Dateisystem-/Canvas- oder OS-Neustartabnahme.
Nächster Einzelauftrag deshalb regulärer CAD-Workspace-Ablauf gemäß Masterplan §9.
PR272 ist die noch offene Basis; dessen Merge wurde durch die wiederholte Freigabe
von PR271 nicht vorausgesetzt.
Hauptthread-Tasks innerhalb der gemessenen Phasen: Sicherung alt 1.783–1.836 ms, neu 1.217–1.536 ms; Lesen alt 637–940 ms, neu 120–142 ms. Phasenzuordnung anhand Startzeit, keine CPU-Ursachenanalyse.


## Praktische Workspace-Abnahme (12.10.2026)

Produktbasis main `f833834`, PR272/273 geordnet zusammengeführt. Keine Produktänderung
in diesem Auftrag. Der bestehende `reference-workspace.html` rendert den echten
CadWorkspace mit echten Browseradaptern auf Port 8082. Vorhandene andere Testprojekte
blieben erhalten; Nutzerursprung 8080 unverändert. `workspace-fixture.html` auf 8084
erzeugt dieselben zwölf deterministischen 1280×1280-PNGs und 10.000 Linien wie der
Serviceversuch und bietet die 106.911.015-Byte-Datei als Download an.

Ausgeführt: regulärer Open-project-Dateidialog, Ladebestätigung (1 Wand, 1 Fenster,
10.000 Linien, 12 Referenzen), Übernahme, sichtbare Linien/Wand/Fenster/Bildreferenz.
Wand über Navigator gewählt, Höhe 2,8 auf 2,9 m geändert. Toolbar Undo, tatsächlicher
Save-project-Download; Redo und weiterer Download. Gespeicherte Datei über regulären
Dialog erneut geöffnet und übernommen. Über lokale Wiederherstellung Snapshot erzeugt,
Erfolg im Katalog abgewartet, Seite neu geladen, Startangebot geöffnet, capacity-100
geprüft, Wiederaufnahme vorbereitet und bestätigt. Danach erneut heruntergeladen.

[Dateivergleich](workspace-capacity100-2026-10-12.json): vollständiges geparstes JSON
nach Undo identisch zur Fixture; nach Redo ausschließlich Wandhöhe 2,9; nach Recovery
vollständig identisch zum gespeicherten Redo-Stand. Alle zwölf Bildpayloads eingeschlossen.
Hashes/Dateigrößen protokolliert, große Testdateien nicht ins Repository aufgenommen.
Kein Browserprozess-/OS-Neustart, keine Stromausfallsimulation. UI visuell geprüft;
nicht jeder einzelne Bildpixel im Canvas separat verglichen.

[Diagnose vor Reload](workspace-capacity100-before-reload.json),
[Diagnose nach Reload](workspace-capacity100-after-reload.json): Buttonzeitpunkte und
Long Tasks aus dem bestehenden rein beobachtenden Diagnoseskript. Maxima 5.274 bzw.
7.113 ms. Breite Accessibility-/DOM-Abfragen liefen wiederholt in Zeitlimits; gezielte
CSS-Abfragen und Screenshots funktionierten. Daraus allein folgt kein Programmstillstand.
Auch Eingabefeldabfragen waren teils veraltet; Aussagen zum Modell beruhen deshalb auf
vollständigen tatsächlichen Dateidownloads. Die Long-Task-Daten sind keine CPU-Stacks
und trennen Browsersteuerungs-/Diagnosekosten nicht sicher von Renderingkosten.

Ergebnis: Datenablauf bestanden, Bedienperformance noch nicht abgenommen. Die Ursache
der langen UI-Aufgabe wird im nächsten begrenzten Auftrag zugeordnet, bevor Änderungen
an Renderer oder Navigator vorgenommen werden. Vorherige 905 Tests/grüne CI gehören zu
PR273; hier keine erneute vollständige Testsuite für den reinen Diagnose-/Dokuschritt.
Benchmark-Typecheck und fokussierter Lint der neuen Fixture-Seite bestanden.


## Workspace-Ladeprofil 12.10.2026

Nur Diagnose, keine Produktänderung. Dieselbe capacity-100.json (106.911.015 Byte,
10.000 Linien, zwölf PNGs) zweimal über den echten Datei-Dialog auf Port 8082 geladen.
React-Profiler um Workspace, BimPlan und Navigator, synchroner Timer um editingReducer;
zweiter Lauf zusätzlich Bild-URL-Prüfung. Rohdaten: [Lauf 1](workspace-load-profile-1.json),
[Lauf 2](workspace-load-profile-2.json).

| Abschnitt | Lauf 1 | Lauf 2 |
|---|---:|---:|
| Application load-project | 457 ms | 369 ms |
| Grundriss erster Render | 1.272 ms | 1.165 ms |
| Navigator erster Render | 987 ms | 821 ms |
| Grundriss Folge-Render | 592 ms | 431 ms |
| Navigator Folge-Render | 439 ms | 379 ms |

Im zweiten Lauf: 24 vollständige Bild-URL-Prüfungen für zwölf Assets, zusammen 517 ms.
Der begrenzte URL-Cache kann diese Fixture nicht halten. Dies ist ein zusätzlicher
Engpass, aber erklärt die gesamte Pause nicht. Der Navigator erstellt über 10.000
Zeilen gleichzeitig; diese Arbeit fällt auch im unmittelbaren Folge-Render an.

Grenzen: Entwicklungsbuild mit Profiler, zwei Beobachtungen, keine statistische
Produktionsgarantie. React actualDuration misst Renderarbeit, nicht die gesamte
DOM-Commit-/Layout-/Paintzeit; die Werte sind verschachtelt und dürfen nicht mit
Workspace-Dauer addiert werden. Long-Tasks enthalten weitere Browserarbeit.
Während der Übernahme wurden keine vollständigen DOM-/Accessibility-Abfragen
angefordert; der Klick selbst erreichte dennoch das Browsersteuerungs-Zeitlimit.
Die Diagnose hat Modellvalidierung, Undo und Persistenz nicht ersetzt.

Nächster begrenzter Auftrag: Gebäudestruktur im Navigator mit begrenzter Zahl
sichtbarer Zeilen darstellen (Windowing), unter Erhalt von Auf-/Zuklappen,
Einzel-/Mehrfachauswahl und Tastaturzugriff. Gleiche Fixture vorher/nachher messen;
Grundriss und Bildcache bleiben getrennte Folgebefunde. Kein Rendererwechsel.


## Geschossnavigator statt Elementliste (12.10.2026)

Nutzerentscheidung ersetzt den oben geplanten Windowing-Auftrag: Einzelbauteile
sind im Navigator nicht erforderlich. ProjectNavigator erzeugt nur Projekt und
das vorhandene Geschoss; keine Elementiteration für Baumzeilen. Abbildverwaltung,
Modell und Canvas-Auswahl bleiben erhalten. Mehrere Geschosse sind kein Teil dieses Schritts.

Identische Datei und Diagnoseursprung wie im vorigen Profil: Navigator-Mount 1,3 ms
(vorher 821–987 ms), unmittelbarer Folge-Render 0,8 ms (vorher 379–439 ms).
[Rohdaten](workspace-storey-navigator.json). Längste Task beim Übernehmen weiterhin
3.727 ms; die verbleibende Grundrissarbeit ist nicht behoben. Einzelvergleich im
Entwicklungsbuild, keine statistische Endgerätegarantie.

Browserprüfung: 10.014 Elemente bleiben vorhanden; Wand per Canvas-Tastaturziel
gewählt, Höhe 2,8 → 2,9 geändert, Undo/Redo ausgeführt, Projekt heruntergeladen.
Vollständiger JSON-Vergleich mit Quelle besteht nach ausschließlich dieser
beabsichtigten Höhenänderung, einschließlich aller zwölf Bildpayloads. Abbildtab
zeigt weiterhin Hinzufügen und Abbildsammlung. 905 Regressionstests, Typecheck und
Build bestanden. Keine neue Persistenzimplementierung.

Praktische Abnahme: Projekt öffnen, Gebäudestruktur zeigt Projekt/Geschoss;
Wand im Canvas wählen und Eigenschaften ändern; Undo/Redo; zum Abbildtab wechseln.
Nächster Einzelauftrag: wiederholte Bild-URL-Prüfung für unveränderliche Assets reduzieren.


## Bild-URLs für unveränderliche Handles (12.10.2026)

WeakMap nur für vom Domain-Modul selbst erzeugte und registrierte unveränderliche
Asset-Handles. Ein frozen-Flag oder eine ID gewährt keinen Zugang. Der erste Zugriff
prüft weiterhin Dekodierung und Header. Der Cache hält Assets nicht stark am Leben;
zusätzliche URL-Darstellung lebt so lange wie das Asset (auch wenn Undo dieses hält).
Für gewöhnliche veränderbare Eingaben bleiben acht Einträge/48 MiB Inhaltscache erhalten.
Keine Aussage über tatsächlichen Heap-Peak; URLs für alle lebenden Handles sind nicht
zusätzlich durch das LRU-Budget begrenzt. Keine Änderung am Dateiformat oder Modell.

Identische capacity-100.json, Port 8082, Entwicklungsbuild: vor Änderung 24 vollständige
Bildprüfungen/738 ms, danach zwölf/407 ms. Längste Task 3727 → 3392 ms.
Einzelvergleich, keine statistische Garantie. [Vorher](workspace-storey-navigator.json),
[nachher](workspace-image-handle-cache.json). Dateidownload vollständig identisch zur Quelle,
einschließlich aller zwölf Payloads. 908 Tests bestanden: zusätzlich zwölf lebende Handles
über drei Durchläufe, ungültige Header/MIME/Maße und eingefrorenes Objekt mit veränderlichem
Getter. Bestehende Mutations-/LRU-/Budgettests bleiben erhalten. Typecheck, gezieltes Lint
und Build bestanden. Nächster Auftrag: verbleibende Grundriss-Render-/Commitkosten zuordnen.


## Grundriss-Teilbäume und Framegrenzen (12.10.2026)

Nur Diagnose auf dem Stand des offenen PR277. Zwei echte Dateiöffnungen derselben
100-MiB-Fixture auf 8082, ohne vollständige DOM-Abfrage während des Ladens.
[Rohdaten 1](plan-render-phases-1.json), [Rohdaten 2](plan-render-phases-2.json).

| React-Teilbaum | Lauf 1 | Lauf 2 |
|---|---:|---:|
| Bildreferenzen Mount | 591 ms | 733 ms |
| Linien Mount | 399 ms | 528 ms |
| Linien unmittelbarer Folge-Render | 187 ms | 245 ms |
| Grundriss Mount insgesamt | 1160 ms | 1494 ms |

Profilerzeiten sind verschachtelt, nicht addieren. onRender-Callback-Zeitpunkt
und zwei requestAnimationFrame-Grenzen ergänzen den Verlauf. Beispiel Lauf 1:
Commitbeginn 32567,7 ms, Workspace-Callback 32840,6 ms, erster rAF 33352,9 ms,
zweiter rAF 33490,4 ms. Darin liegen weitere React-Updates und Browserarbeit.
Diese Differenzen sind weder reine Commitkosten noch eine isolierte Paintmessung.
Die Instrumentierung selbst und der Entwicklungsbuild beeinflussen die Werte.

Codebefund: CadViewport startet mit 800×400-Ersatzgröße und fitPlan; ein Effect
misst anschließend die reale Fläche und setzt die initiale Kamera. Das passt zur
beobachteten Folgearbeit, ist aber noch kein kausaler Nachweis. Nächster Pilot:
Größen-/Kamerawerte bestätigen und teuren ersten Szenenaufbau auf die gemessene
Kamera abstimmen. Resize, gespeicherte Abbild-Framings, Fit/Zoom und Auswahl prüfen.
Keine Produktionsänderung dieses Schritts. Benchmark-Typecheck, gezieltes Lint und
Produktionsbuild bestanden; Modelltests von PR277 werden nicht als neu ausgeführt ausgegeben.


## Initiale Kamera vor Szenenaufbau (12.10.2026)

CadViewport wartet mit BimPlan auf die erste Größenmessung und die daraus
abgeleitete Kamera; gespeichertes Framing hat unverändert Vorrang. Vorher wird
kein Ersatz-Framing publiziert. Resize übernimmt ausschließlich geänderte Größen.
Die 3D-Initialisierung bleibt unverändert.

Gleiche capacity-100.json, 8082: [Nachherprofil](initial-plan-camera.json) zeigt genau
einen Linienaufbau mit 518 ms. Der zusätzliche 187–245-ms-Durchlauf der beiden
vorigen Profile entfällt. Erste Darstellung erfolgt nun als nested-update nach der
leichten Container-Messung; das ist kein zweiter Linienaufbau. Längste Task 2811 ms;
angesichts vorheriger 2504 ms in einem Lauf wird keine Gesamtbeschleunigung behauptet.
Kausaler Pilot stützt die vermutete Initialisierungsursache, bleibt Entwicklungsprofil.

Praktisch geprüft: 100-%-Zoom bleibt beim Navigator-Schließen/Öffnen (Resize),
Abbild bei 100 % erstellt, geöffnet, auf 120 % gezoomt und Fit zurück auf 100 %;
Wand über Canvas auswählbar. Datei gespeichert, nach Reload wieder geladen,
gespeichertes Abbild öffnet erneut mit 100 %. Vollständiger Vergleich von storey
und assets mit Quellfixture identisch. 908 Tests, Benchmark-Typecheck, gezieltes
Lint und Produktionsbuild bestanden. Keine Modell-/Dateiformatänderung.
Nächster Auftrag: produktionsnaher Gesamtbedienlauf vor weiteren Optimierungen.


## Produktions-Workspace-Abnahme (12.10.2026)

Reproduzierbar: `vite build --config benchmarks/production-workspace.config.ts`,
danach `vite preview --config benchmarks/production-workspace.config.ts`;
`http://127.0.0.1:8085/benchmarks/production-workspace.html`. Echter CadWorkspace und
Browseradapter, React production, ohne React-Profiler und Vite-Diagnosetransforms.
Long-Task-Observer und Klickzeitpunkte bleiben als reine Beobachtung. Separater
Client-Build: kein Nachweis für Cloudflare/SSR/Deployment. Isolierter Ursprung
verändert weder Recovery von 8080 noch von 8082. Keine Produktionscodeänderung.

100-MiB-Fixture inklusive zuvor gespeichertem Abbild: Öffnen, Wand im Canvas wählen,
Höhe 2,8 → 2,9, Undo/Download, Redo/Download, Abbild öffnen (100 %), lokaler Snapshot,
Reload, Stand prüfen, bestätigte Wiederaufnahme, Download und Abbild erneut öffnen.
Alle Vollvergleiche bestanden: Undo = Quelle, Redo = Quelle mit Höhenänderung,
Recovery = Redo. Zwölf Bildpayloads und Abbild vollständig erhalten.
[Hashes/Prüfungen](production-workspace-evidence.json),
[vor Reload](production-workspace-trace-1.json), [nach Reload](production-workspace-trace-2.json).

Nach Klick Projekt laden: 2635-ms-Task. Die beiden Exporte enthalten 1276 bzw.
1142 ms lange Tasks; Snapshot 1333 ms. Bedienpausen sind somit auch ohne
Entwicklungsinstrumentierung vorhanden. Kein Vergleichsmedian, keine reine Paint-
oder Servicezuordnung und keine flüssige Großprojektfreigabe. Die lange Zeit zwischen
Dateiauswahl und Bestätigung enthält außerdem Browsersteuerung/Wartezeit und ist
kein Produkt-Ladezeitwert. Typecheck, gezieltes Lint und isolierter Produktionsbuild
bestanden; die 908 Modelltests des vorherigen PR wurden hier nicht erneut ausgeführt.

Nächster begrenzter Auftrag: produktive Exportphasen messen und Ursache der
1,1–1,3-s-Blockade zuordnen. Ladepause bleibt separat offen.


## Exportphasen und doppelte Größenprüfung (12.10.2026)

Expliziter Messbuild: `vite build --config benchmarks/production-workspace.config.ts --mode export-profile`.
Ohne diesen Modus keine Exporttransforms. Gleicher Produktions-Workspace, Recoverystand
capacity-100 einschließlich Abbild und Höhe 2,9. Zwei echte Downloads vorher und nachher.
[Vorher](export-phases-before.json), [nachher](export-phases-after.json).

Vorher: Validierung 38/75 ms, stringify inklusive Validierung 116/160 ms (verschachtelt!),
UTF-8-Größe zweimal 267+296 / 313+302 ms, Blob+URL 276/312 ms.
serializeProject prüft bereits Größe; requestProjectDownload tat dies unmittelbar nochmals.
Nur der zweite Aufruf entfernt, unveränderte Modell-/UTF-8-Prüfung bleibt im Serializer.
Nachher: eine Größenprüfung 273/259 ms, Blob+URL 256/238 ms, Export-Tasks 710/620 ms
gegenüber 974/1126 ms. Wenige Läufe, keine statistische Endgerätegarantie. Blob+URL umfasst
nicht den bestätigten Datenträgerabschluss; Downloadstatus bleibt download-requested.

Downloads novikov-project (31) bis (34).json bytegenau identisch, einschließlich Bilder,
Modell und Abbild. 908 Tests, Benchmark-Typecheck, gezieltes Lint, isolierter Messbuild
und normaler Produktionsbuild bestanden. Sicherheits-/Fehler-/Limitfälle der bestehenden
Application- und Serializer-Tests bleiben erhalten. Keine Format-/Budgetänderung.

Nächster begrenzter Pilot: vorhandenen exakten Größenbaustein für validierte Base64-Assets
im Serializer prüfen, damit auch die verbleibende vollständige UTF-8-Payloadkopie entfällt.


## Serializer-Budget ohne volle Encodingkopie (12.10.2026)

serializeProject: validateProject bleibt vollständig; danach assertValidatedProjectSize
mit dem bestehenden gemeinsamen Bytezähler, anschließend unverändertes JSON.stringify.
Validierte Base64-Payloads sind ASCII und benötigen kein JSON-Escaping. Alle übrigen
Felder werden weiterhin strukturell serialisiert und als UTF-8 gezählt. Kein Cache,
keine ID-basierte Annahme, kein Dateiformat- oder Limitwechsel.

Zwei neue Regressionen: Ausgabe identisch zur Voll-JSON-Referenz bei Unicode, Emoji,
Lone Surrogate, Anführungszeichen, Backslash/Newline und gleichen Payloads; ungültige
Base64 wird abgewiesen. Exakt 128 MiB werden akzeptiert, ein zusätzliches ä abgewiesen.
910 Tests bestanden, Benchmark-Typecheck, gezieltes Lint und beide Builds bestanden.

Gleicher Recoverystand/Produktions-Workspace wie zuvor, zwei Downloads:
[Nachher](serializer-byte-budget.json), [Vorher](export-phases-after.json).
Größenprüfung 16/11,4 statt 272,5/259 ms; Tasks 511/412 statt 710/620 ms.
Downloads (35)/(36) byteidentisch mit (33). Neue stringify-Phase misst nur Stringify;
die frühere Diagnosephase gleichen Namens enthielt zusätzlich Validierung.
Keine Summierung verschachtelter Altwerte. Kleine Stichprobe, keine allgemeine
Performancegarantie. Blob/URL bleibt mit 264–276 ms ein wesentlicher Restanteil.

Nächster begrenzter Auftrag: erneute Vollserialisierung allein zur Größenprüfung
in prepareProjectOpen untersuchen und durch denselben geprüften Baustein ersetzen.


## Dateivorbereitung ohne Vollserialisierung (12.10.2026)

prepareProjectOpen verwendet nach readProjectFile und ensureDocumentFolder weiterhin
vollständige validateProject-Prüfung, danach den gemeinsamen exakten Bytezähler.
Eine vollständige JSON-Ausgabe nur für diese letzte Größenprüfung entfällt.
Vorlesegrenze, tatsächliche UTF-8-Eingangsprüfung, Migration, Ordnerergänzung und
Veröffentlichung erst nach Bestätigung bleiben unverändert.

911 Tests bestanden, Benchmark-Typecheck, gezieltes ESLint sowie regulärer Build und
instrumentierter Produktions-Workspace-Build bestanden. Neue Regression: Unicode,
Escaping und interne Zeilenumbrüche bleiben erhalten; eine Eingabe exakt bei 128 MiB
wird abgewiesen, wenn der ergänzte Standardordner das Ausgabebudget überschreitet.
Der erste Testentwurf erwartete einen abschließenden Zeilenumbruch im Ebenennamen;
die bestehende Normalisierung entfernt ihn korrekt. Die Fixture prüft nun einen
internen Zeilenumbruch, ohne diese Regel zu verändern.

Gleiche 101,96-MiB-Datei mit einer Wand, einem Fenster, 10000 Linien, zwölf Bildreferenzen
und gespeichertem Abbild im isolierten Produktions-Workspace (Port 8085).
[Rohdaten vorher](open-budget-before.json), [nachher](open-budget-after.json):
open-final-check 400,5 → 63 ms; zugehörige gesamte Long Task 1319 → 1187 ms.
Ein Vorher-/Nachherlauf, keine statistische Performancegarantie. Wartezeit des
Dateidialogs ist keine Ladezeit. Ein-/Ausgabedownloads SHA-256 identisch:
5AD624428494AFAD8A4152125077508A6B4ADF968D23DE95477168FA9D8C552F.
Ladebestätigung zeigte alle Bauteilzahlen; nach Bestätigung 10014 Elemente;
erneute Vorbereitung abgebrochen, Anzeige blieb bei 10014. Keine Konsolenfehler.
Tests sichern den unveränderten Vorbereitungs-/Historyvertrag zusätzlich ab.
Dies ist ein echter React-Produktionsclient mit Browseradaptern, kein Nachweis für
Cloudflare-/SSR-Auslieferung, GPU-Grenzen oder allgemeine Projektkapazität.

Restbefund: readProjectFile und deserializeProject prüfen denselben Text nacheinander
per UTF-8-Encoding (nachher 278,7 und 270,1 ms). Nächster Einzelauftrag: diese doppelte
Eingangsgrößenprüfung an einer gemeinsamen sicheren Grenze zusammenführen, ohne
direkte Deserializer-Aufrufe, Größenfehlermeldung oder Migration zu schwächen.


## Einmalige Eingangsgrößenprüfung (12.10.2026)

readProjectFile delegiert die Größenprüfung vollständig an deserializeProject.
Dessen exakte UTF-8-Grenze bleibt vor JSON.parse und Migration bestehen, auch für
direkte Aufrufer. ProjectFileSizeError unterscheidet den Größenfehler verlässlich
von Syntax-/Schemafehlern; der UI-Adapter reicht ihn mit unverändertem Meldungstext
durch und übersetzt andere Fehler weiterhin in die bekannte Projektdateimeldung.
Kein ungeprüfter öffentlicher Parse-Einstieg und kein zusätzlicher Zustand.

912 Tests bestanden, Benchmark-Typecheck, fokussiertes ESLint und regulärer sowie
instrumentierter Produktions-Workspace-Build bestanden. Neue Regression überprüft
beide Eingänge: exakt 128 MiB mit mehrbyteigem Unicode erreichen die Schema-Prüfung;
ein weiteres Byte wird schon vor Parsing mit Größenfehler abgewiesen. Ungültiges
JSON und ungültiges Modell behalten die allgemeine Meldung. Bestehende Migrations-,
Lade-/Abbruch- und Modelltests bleiben grün.

Browser: gleiche 101,96-MiB-Fixture wie zuvor auf Port 8085, 10014 Elemente nach
Ladebestätigung, Export byteidentisch (SHA-256 wie im vorherigen Abschnitt), keine
Konsolenfehler. [Rohdaten](single-input-size.json), Vergleich: open-budget-after.json.
Nur noch eine große UTF-8-Prüfung (238,5 ms statt 278,7 + 270,1 ms), Vorbereitungs-Task
790 statt 1187 ms. Einzelvergleich, keine statistische oder allgemeine Kapazitätszusage.
Das betrifft die Vorbereitung, nicht die spätere Übernahme/Renderzeit. Restliche
Hauptthreadpause bleibt relevant. Nächster Einzelauftrag: konsolidierte Abnahme des
aktuellen Produktions-Workspaces ohne Messinstrumentierung (Laden, Bearbeiten,
Undo/Redo, Speichern und Wiederaufnahme) mit derselben großen Fixture; Restpausen
festhalten, bevor weitere Optimierungen ausgewählt werden.


## Konsolidierte Produktionsabnahme nach PR284 (12.10.2026)

Code ff9bbba, statischer React-Produktionsclient mit echten Browseradaptern auf
Port 8085. Build ohne export-profile und ohne React Profiler/Diagnose-Transforms;
der vorhandene passive Long-Task-/Klickbeobachter bleibt aktiv (exportPhases leer).
Keine Produktänderung. Produktions-Workspace neu gebaut; 912 Tests und regulärer
Build sind für denselben unveränderten Produktcode aus PR284 grün, nicht erneut
als neue Testausführung gezählt. Kein Cloudflare-/SSR-Auslieferungsnachweis.

Fixture: novikov-project (27).json, 101,96 MiB, 1 Wand/1 Fenster/10000 Linien/
12 PNG-Referenzen, Abbild Kamera-Prüfung. Über die tatsächliche Oberfläche:
- Vorbereitung und Abbruch: Ausgangsmodell 2 Elemente, Undo weiterhin deaktiviert.
- Erneut laden/bestätigen: 10014 Elemente. Lade-Undo: 2; Redo: 10014.
- Download nach Lade-Redo (39) byteidentisch zur Fixture (27).
- Wandhöhe 2,8 auf 3,1 m: Download (40) unterscheidet sich ausschließlich darin.
- Bearbeitungs-Undo (41) byteidentisch zu (27); Redo (42) byteidentisch zu (40).
- Snapshot erstellt, Erfolgsmeldung abgewartet; Seite neu geladen; Stand geprüft,
  Wiederaufnahme vorbereitet und explizit bestätigt. Download (43) byteidentisch
  zu (42), SHA-256 38eb1a047a584c757390c1ff4d69d0f76c0ac4a4d1b03184a3f605e55feb2843.
- Gespeichertes Abbild per Doppelklick geöffnet, Zoom 100 erhalten. Keine Konsolenfehler.

[Bearbeitung/Laden](consolidated-production-edit.json),
[Wiederaufnahme](consolidated-production-recovery.json): Vorbereitungs-Tasks
786/757 ms, erste Übernahme 2185 ms, Lade-Redo 1059 ms, Wandänderung 923 ms,
Bearbeitungs-Undo/Redo 612/574 ms, Exporte 390–422 ms, Wiederaufnahme-Übernahme
2178 ms, Abbildöffnen 827 ms. Nach Übernahme zusätzlich mehrere Tasks >100 ms.
Ein Ablauf, keine p95-/RAM-/GPU-Grenzen oder garantierten Nutzerlatenzen. Die
Browsersteuerung/Beobachtung kann zusätzliche Arbeit verursachen; Long Tasks
belegen Pausen, weisen deren CPU-Ursache aber nicht nach. Keine Summierung zu
End-to-End-Zeiten. Dateiinhalt und Wiederherstellung bestanden; flüssige Bedienung
bei dieser Fixture ist noch nicht nachgewiesen.

Nächster begrenzter Auftrag: Übernahme nach Bestätigung bei gleicher Fixture
gezielt zuordnen (gemeinsame Application-/History-Prüfung, Bildableitung, Rendern).
Vorhandene Messbausteine nutzen; Messanteile sauber trennen und gegen diesen
Produktionslauf abgleichen. Erst anschließend eine einzelne Optimierung auswählen.


## Produktions-Ladezuordnung (12.10.2026)

PR285 übernommen. Gemeinsamen workspaceLoadInstrumentation-Messbaustein um expliziten
load-profile-Modus im isolierten Produktions-Workspace erweitert. Regulärer Build
bleibt ohne diese Transforms. Production-Messung umschließt Funktionen direkt;
component-call misst nur den Komponentenaufruf einschließlich seiner synchronen
Unterfunktionen, keine vollständige React-Render-/Commit-/Layout-/GPU-Zeit. Keine
React-Profiler-Aussage aus diesem Produktionsbuild. Rohdaten enthalten mode und
workspacePhases. Keine src-Produktänderung.

Gleiche 101,96-MiB-Fixture, frischer Tab bzw. Reload, Bestätigung über Oberfläche.
[Runde 1](load-attribution-22.json), [Runde 2](load-attribution-23.json).
Zugehörige erste Tasks 1715/1718 ms gegenüber 2185 ms im uninstrumentierten
Vergleichslauf: unterschiedliche Läufe, kein kausaler Geschwindigkeitsgewinn.
Runde 2: load-project 360,9 ms, darin pattern-resolution 309,8 ms und history-commit
50,9 ms. BimPlan-Aufrufe insgesamt 162,2 ms. PlanSceneContent 282,2 ms, darin
image-url-validation 272,6 ms für zwölf Bilder. ProjectNavigator <0,1 ms.
Verschachtelte Werte nicht addieren. Der verbleibende Rest der Task ist nicht
als reine Renderingzeit nachgewiesen; React-Abgleich, DOM, Layout, weitere Arbeit
und Mess-/Steuerungseinflüsse sind nicht separat erfasst. Weitere Tasks bis 329 ms.

Codebefund: resolveProjectHatchPatterns serialisiert auch bei unveränderten Mustern
next vollständig für assertProjectFileSize. Die Testdatei enthält keine Schraffuren,
aber 100 MiB Bildpayload. Messung belegt den Aufwand des gesamten Musterabgleichs;
der Anteil der konkreten JSON-/Encodingoperation ist noch nicht einzeln gemessen.
Nächster Pilot: vorhandenen exakten Größenbaustein nach vollständiger Validierung
verwenden, identischen Muster-/Konflikt-/Revisions- und Fehlervertrag erhalten.
Kein Cache oder Auslassen von Validierung aufgrund einer ID.

Typprüfung, fokussiertes ESLint und load-profile-Build bestanden. Regulärer Build
zusätzlich ausgeführt. Unveränderter Produktcode: 912 Tests aus PR284 als bestehender
Nachweis, nicht erneut ausgeführt. Browser zeigt 10014 Elemente; gespeicherte Datei
(44) byteidentisch zur Eingabe (27), keine Konsolenfehler. Keine allgemeine Kapazitäts-
oder Performancefreigabe; kein Cloudflare-/SSR-Nachweis.


## Musterabgleich ohne Vollserialisierung (12.10.2026)

PR286 übernommen. resolve nutzt nach der bestehenden vollständigen Validierung
assertValidatedProjectSize(next). No-op behält die ursprüngliche Objektidentität;
Revisionen/Konflikte/fehlende Definitionen und Rückgaben unverändert. Validierte
Assetdaten sind kanonisches Base64, daher ist ihre Länge exakt zählbar. Keine
zusätzlichen Caches oder Umgehung der Schema-Prüfung.

913 Tests, Benchmark-Typecheck, gezieltes ESLint, regulärer Build und load-profile-
Build bestanden. Neue Regression: exakt 128 MiB mit Bildpayload erlaubt; Wachstum
bei Musterrevision und zusätzliche Unicodebytes abgewiesen; ungültiges Base64
abgewiesen; Revision bei Fehler unverändert. Bestehende Revisions-/Historytests grün.

Gleiche 101,96-MiB-Datei im Produktions-Workspace geladen, 10014 Elemente, Export
(45) byteidentisch zu (27), keine Konsolenfehler. [Nachher](pattern-resolution-budget.json)
gegen load-attribution-23.json: Musterabgleich 309,8 → 85,7 ms; Ladebefehl einschließlich
History 360,9 → 149,3 ms. Gesamte erste Task dagegen 1718 → 1910 ms; Bildprüfung
272,6 → 396 ms und BimPlan-Aufrufe 162,2 → 233,5 ms. Kein belegter End-to-End-Gewinn
in diesem Einzelvergleich; unterschiedliche Lauf-/Systembedingungen, keine p95-Aussage.
Verschachtelte Werte nicht addieren. Rest der Task weiterhin unzugeordnet.

Nächster begrenzter Auftrag: Bild-URL-Prüfung im selben Produktionsprofil in Cache-
Suche, Base64-Dekodierung, Bytekopie und Headerprüfung aufteilen; frische und warme
Aufrufe trennen. Erst mit diesem Nachweis eine Bildpfadoptimierung auswählen.


## Bildprüfungs-Teilphasen (12.10.2026)
PR287 nach Freigabe/grüner CI übernommen. Vorhandene workspaceLoadInstrumentation
misst zusätzlich atob, binaryBytes, imageHeader, WeakMap-Abfrage und checkedImageUrl
gesamt. Nur Diagnose, keine Produktänderung. Typprüfung, fokussiertes ESLint und
load-profile-Build bestanden; regulärer Build ebenfalls ausgeführt. 913 Produkttests
vom unveränderten PR287-Stand übernommen, nicht erneut ausgeführt.

[Browser-Rohdaten](image-validation-phases.json), gleiche 101,96-MiB-Fixture:
12 Erstaufrufe, atob insgesamt 100 ms, Bytekopie 179,2 ms, Header 0,3 ms;
Bildprüfung insgesamt 279,8 ms, öffentliche URL-Funktion 280 ms. Nach Zoom in/out
24 weitere öffentliche Aufrufe insgesamt 0,1 ms, keine erneute Dekodierung/Kopie.
WeakMap-Abfrage unter Messauflösung. Der Fallback-Inhaltscache für ungebrandete
Assets wurde hier nicht benutzt und wird damit nicht bewertet. Ein Ablauf,
keine p95-Aussage; verschachtelte Summen nicht addieren. Native Bilddekodierung,
DOM/Layout/GPU weiterhin nicht separat gemessen. Export (46) byteidentisch zur
Fixture (27), 10014 Elemente, keine Konsolenfehler.

Nächster Pilot: gemeinsamen Headerleser auf Bytezugriff aus Uint8Array oder bereits
vollständig per atob dekodiertem Binärstring stützen. Vollständige Bytekopie im URL-
Prüfpfad vermeiden, bestehende Importnutzung weiterverwenden. PNG/JPEG, Marker,
Trunkierung, Metadatenabweichung und Größenlimits per Differentialtests sichern;
Base64-Dekodierung und Cache-/Validierungsgrenzen erhalten. Kein partielles blindes
Headervertrauen, kein Rendererwechsel oder neuer Cache.


## Bildheader ohne vollständige Bytekopie (12.10.2026)
PR288 übernommen. imageHeader liest über einen gemeinsamen Bytezugriff aus Uint8Array
oder bereits vollständig per atob dekodiertem Binärstring. Der Import nutzt weiterhin
Uint8Array; checkedImageUrl vermeidet die zweite vollständige Kopie. Bounds-Prüfung,
PNG/JPEG-Marker, Metadaten-/Pixelgrenzen, atob und Cacheverträge unverändert.
914 Tests bestanden, darunter Differentialvergleich gegen eingefrorenen alten Parser
für PNG, JPEG-SOF 192/193/194, jede Trunkierung, Byteveränderungen und Zufallsdaten.
Typprüfung, gezieltes Lint, Diagnosebuild und regulärer Build bestanden. Diagnosemarker
wurden nach einem zunächst fehlgeschlagenen Diagnosebuild an den Binärstring-Aufruf
angepasst; abschließender Build erfolgreich.

Gleiche 101,96-MiB-Fixture: [Nachher](image-header-no-copy.json), vorher
image-validation-phases.json. Erstzugriff Bildprüfung 279,8→110,7 ms; atob 110,4 ms,
Header 0,3 ms, keine Bytekopie. Zoom: warme Aufrufe zusammen 0,1 ms, keine erneute
Dekodierung. Einzelvergleich, keine Gesamtgeschwindigkeits-/p95-Garantie. Browser
10014 Elemente, Export (47) byteidentisch zu (27), keine Konsolenfehler.
Nächster begrenzter Auftrag: verbleibende BimPlan-Erstableitung gezielt aufteilen;
vorhandene Szenen-/Fangvorbereitung getrennt messen, bevor weitere Optimierung folgt.


## Grundrissvorbereitung (12.10.2026)
PR289 zunächst durch CI gestoppt: nach lokalem Testlauf wurden Fehlermeldungs-Umlaute
beim erneuten Lesen/Schreiben ohne explizites UTF-8 beschädigt. In cadcf6a korrigiert;
914 Tests und regulärer Build erneut lokal bestanden, GitHub-CI erfolgreich, dann
gemergt. Neue Dateibearbeitung verwendet explizites UTF-8.

Bestehende load-profile-Diagnose um getLocalSnapSources, Quellabfragen,
derivePlanScene und planSceneRuns erweitert. Keine neue Produktlogik. Typprüfung,
gezieltes ESLint und Diagnosebuild erfolgreich. [Rohdaten](plan-preparation-phases.json):
gleiche 101,96-MiB-Fixture, BimPlan-Aufrufe zusammen 202,2 ms; darin Fangquellen
193 ms (zwei Aufrufe einschließlich Cachezugriff), Szenenableitung 3,7 ms,
Zeichenreihenfolge 0,9 ms, Quellabfragen unter Messauflösung. Beim Zoom vier
BimPlan-Aufrufe zusammen 0,2 ms, keine erneuten Quell-/Szenenvorbereitungen.
Verschachtelte Werte nicht addieren, Komponentenlaufzeit ist keine komplette
React-/DOM-/GPU-Zeit. Ein Durchlauf, keine p95- oder Kapazitätsfreigabe.
10014 Elemente, Export (48) byteidentisch zur Eingabe (27), keine Konsolenfehler.

Nächster Einzelauftrag: innerhalb createLocalSnapSources projectSnapPrimitives und
createPrimitiveSourceIndex getrennt messen. Keine pauschale Cachevergrößerung oder
vorzeitige Indexoptimierung; erst die Ursache der 193 ms zuordnen.

## Fangquellen und Index getrennt (12.10.2026, PR291)
PR290 nach erfolgreicher GitHub-Prüfung zusammengeführt. Die Diagnose misst nun
projectSnapPrimitives und createPrimitiveSourceIndex getrennt; Produktcode unverändert.
[Rohdaten](snap-index-phases.json): kalte Ableitung 42,6 ms, Indexaufbau 164,5 ms,
getLocalSnapSources einschließlich beider Phasen 207,1 ms. Szenenableitung 4,1 ms,
Zeichenreihenfolge 0,8 ms. Warmes Zoom-in/out: vier BimPlan-Aufrufe zusammen 0,7 ms,
keine erneute Fangquellen- oder Indexerstellung. Verschachtelte Zeiten nicht addieren.

Die bisherige Download-Fixture (27) war nicht mehr vorhanden. Verwendet wurde die
verfügbare Fixture (25), 106911015 Bytes, 10000 Linien, eine Wand, ein Fenster,
zwölf Bildreferenzen. SHA256:
23599c6390420bc312442434b0d42322666e430261520462b8a3d0290f585952.
Export (16) besitzt denselben Hash; 10014 Elemente im Navigator, keine Konsolenfehler.
Deshalb kein direkter Vorher-/Nachher-Vergleich mit der anders gehashten Fixture (27).
Ein Messlauf im isolierten statischen Produktions-Workspace mit Diagnose, keine
p95-/Kapazitätsfreigabe und keine vollständige React-/DOM-/GPU-Zeit.
Typprüfung der Benchmarks, gezieltes ESLint und Diagnosebuild bestanden. Bestehende
914 Produkttests stammen vom unveränderten Produktstand PR289; nicht erneut ausgeführt.

Nächster begrenzter Auftrag: kalten Indexaufbau optimieren. Zunächst Freeze-/Lookup-
und Baumaufbau intern im selben Benchmark zuordnen, dann nur den dominanten Anteil
optimieren. Vollständige Quellerhaltung, unveränderliche Daten und identische lokale
Abfrageergebnisse einschließlich Reihenfolge/Filter/Budget durch Vergleichstests
gegen den bisherigen Pfad sichern; dieselbe Fixture (25), warme Zooms und Roundtrip
nachmessen. Kein neuer Renderer, kein globaler Paarvergleich, keine größeren Caches.

## Weniger temporäre Begrenzungsobjekte (12.10.2026, PR292)
PR291 mit erfolgreicher GitHub-CI zusammengeführt. Zuständige Schicht: gemeinsamer
geometrischer Boxindex, keine Werkzeug-/Application-Aktionsänderung. Beim Aufbau
wurde bisher auf jeder Baumebene für jeden Eintrag ein neues Grenzenobjekt erzeugt.
Nun wird genau ein eigenes Objekt pro Knoten aktualisiert. Sortierung, Teilung,
Blattgröße, Abfrage, Toleranzen und Eingabevalidierung bleiben unverändert.

Zunächst kalte Indexphasen getrennt: Freeze, Lookup, Punktbaum und Segmentbaum.
Reproduzierbarer Diagnosebefehl:
`node --experimental-strip-types benchmarks/snap-index-build.ts <fixture.json>`.
Dieser Diagnoseadapter bildet die vier Vorbereitungsphasen explizit nach, läuft
nicht in der Anwendung und muss bei Änderungen dieser Phasen mitgepflegt werden.
[Sieben Vergleichspaare](snap-index-build-comparison.json), wechselnde Reihenfolge,
frische Primitiven pro Lauf, dieselbe Fixture (25) mit Hash aus dem vorigen Abschnitt:
Median Freeze vorher 57,8 ms, Lookup 18,0 ms, beide Baumvorbereitungen zusammen
105,4 ms. Optimierter Baum-Median 95,3 ms (inklusive Vorbereitung der Einträge).
Dies sind lokale Node-Messungen, keine Browser-/p95-Garantie. Die unveränderte
Implementierung ist ausschließlich als Benchmark-/Testoracle erhalten.

[Browsernachweis](snap-index-bounds-browser.json), isolierter Produktions-Workspace
load-profile: Index 154,9 ms gegenüber 164,5 ms im vorigen Lauf mit derselben Datei.
Fangableitung 21,4 ms, Szenenableitung 5,2 ms. Warme Zooms ohne erneute Ableitung oder
Indexaufbau, vier BimPlan-Aufrufe zusammen 0,5 ms. Einzellauf und verschachtelte
Messwerte; keine Gesamtperformancegarantie. 10014 Elemente, Export (17) bytegleich
zu (25), SHA256 23599c6390420bc312442434b0d42322666e430261520462b8a3d0290f585952,
keine Konsolenfehler.

916 Tests bestanden, darunter neue Differentialtests mit 0/1/8/9/100/10000 Quellen
und jeweils 120 Abfragen: identische Reihenfolge und Wertidentität, dichte/gleiche/
degenerierte Grenzen, Extremkoordinaten, ungültige Grenzen sowie unveränderte
Eingaben und isolierte Bounds. Bestehende lokale Fang-, Sichtbarkeits-, Budget-
und Unveränderlichkeitstests weiterhin grün. Benchmark-Typecheck, gezieltes ESLint,
Diagnosebuild und regulärer Build bestanden. Benutzeroberfläche unverändert.

Nächster Einzelauftrag: konsolidierte Abnahme ohne Funktionsinstrumentierung mit
Laden, Wandänderung, Undo/Redo, Datei-Rundlauf und lokaler Wiederherstellung.
Weitere Mikrooptimierungen erst bei einem konkreten verbleibenden Ablaufproblem.

## Konsolidierte Produktionsabnahme (12.10.2026, PR293)
PR292 nach erfolgreicher GitHub-CI zusammengeführt. Geprüfter Produktstand 7e1a30e,
isolierter statischer Produktions-Workspace auf 8085 mit echten Workspace-/Datei-/
Recovery-Adaptern, mode=production: keine Funktionsinstrumentierung, keine React-
Profilwrapper. Nur passiver Long-Task-Beobachter und UI-Klickprotokoll. Dies ersetzt
keinen Deployment-/SSR- oder Betriebssystem-Absturztest.

Fixture (25), 106911015 Bytes, 10000 Linien, eine Wand, ein Fenster, zwölf Bilder.
Die Ausgangshöhe dieser verfügbaren Fixture beträgt 2,90 m (nicht 2,80 m).
Abnahmeschritte:
- Laden: 10014 Elemente im Navigator.
- Wand über ihre zugängliche Tastaturauswahl aktiviert; Höhe 2,90→3,10 m.
- Undo: Auswahl aufgehoben; nach erneuter Auswahl 2,90 m. Redo: 3,10 m.
  Der erste automatisierte Zugriff auf das nicht mehr vorhandene Eigenschaftenfeld
  lief in eine Zeitüberschreitung; kein nachgewiesener Modellfehler oder App-Hänger.
- Export (18): strukturierter Vergleich mit (25) zeigt ausschließlich
  /storey/walls/0/height, 2.9→3.1. Bilder und übrige Modelldaten unverändert.
- Export erneut geladen: Höhe 3,10 m.
- Manuellen lokalen Snapshot erstellt, Abschlussmeldung abgewartet.
- Seite neu geladen, Stand capacity-100 vom 12.10.2026 20:55:38 geprüft,
  Wiederaufnahme vorbereitet und bestätigt: 10014 Elemente und 3,10 m.
- Recovery-Export (19) bytegleich zu Export (18), SHA256:
  cf247b50a07462cd14f006ffd8bda0bd3015df45bae73b7953bf3c8d9c063398.
  Keine Konsolenfehler.

[Passiver Nachweis nach dem Seitenneustart](production-roundtrip-recovery.json):
mode production, workspacePhases/exportPhases leer. Im Prüfintervall des lokalen
Stands 13 lange Tasks, zusammen 1464 ms, längste 238 ms. Im anschließenden
Ladeintervall 14 lange Tasks, zusammen 3134 ms, längste 1400 ms. Exportintervall
vier lange Tasks, zusammen 426 ms, längste 136 ms. Diese Intervalle enthalten
Folgearbeiten; weder Aufsummierung noch Klickabstände sind exakte Antwortzeiten.
Das Protokoll vor dem Neustart wurde nicht exportiert; dort nur funktionaler
Nachweis, keine nachträglich erfundene Laufzeitmessung.

Statischer Produktionsbuild erfolgreich; keine Produktcodeänderung. Die 916 Tests,
Typprüfung und regulärer Build wurden für denselben Produktstand in PR292 bestanden
und nicht für diesen Dokumentations-PR erneut ausgeführt. Keine Freigabe für
Stromausfall, Quota/Berechtigungsfehler, andere Hardware oder größere Dateien.

Nächster Einzelauftrag: Recovery-Leseweg bei „Stand prüfen“ mit derselben Fixture
phasenweise zuordnen (Speicherzugriff, Assetlesen/-prüfung, Rekonstruktion und
Validierung), bevor eine Optimierung gewählt wird. Keine Validierung auslassen,
keine Format-/Limit-/Cacheänderung im Diagnoseauftrag.

## Recovery-Lesephasen (12.10.2026, PR294)
PR293 nach separat bestätigter grüner GitHub-CI gemergt. Neue Instrumentierung nur
im expliziten recovery-profile-Modus; Produktcode unverändert. Vorhandene ReadProbe-
Messpunkte wiederverwendet, zusätzlich Storage-Read, Budget und abschließende
Validierung gemessen. Async-Zeiten enthalten Warten, verschachtelte Phasen dürfen
nicht addiert werden. Read-Checkpoints und alle Prüfungen unverändert.

[Rohdaten](recovery-read-phases.json), derselbe capacity-100-Snapshot wie PR293:
Stand prüfen: Speicherlesen 558,1 ms (separater Startup-Zugriff 65,1 ms), bounded-
restore 1572,9 ms. Darin zwölf Payloads: Schema 276,8 ms, Dekodierung einschließlich
Bytekopie 369,2 ms, Header 0,5 ms, Hashinput 330,5 ms, Hash 86,7 ms, Bildhandles
391,0 ms; Modellvalidierung 58,7 ms, Budget 9,6 ms. Abschließende Validierung/Budget
56,7 ms. Ein Lauf, kein p95-/End-to-End- oder allgemeiner Kapazitätsnachweis.
Storage-Read umfasst den Adapter und Browser-Deserialisierung; keine isolierte
Datenträgerzeit. Handles sind im Einzelvergleich der größte synchrone Teil,
bestehende Schema-/Unveränderlichkeitsgrenzen dort nicht auf Verdacht umgehen.

Konkreter vermeidbarer Aufwand im Code: verifyPayload dekodiert zu einem String
und kopiert alle Bytes in ein Uint8Array, nur um imageHeader aufzurufen. Der bereits
geprüfte gemeinsame imageHeader akzeptiert auch den String. Dies ist unabhängig
von den weiterhin notwendigen Schema-/Hash-/Handleprüfungen.

Benchmark-Typecheck, fokussiertes ESLint und recovery-profile-Build bestanden.
Keine neuen Produkttests nötig: Produktcode unverändert, letzter voller Lauf PR292
916 Tests. Browser: gültiger Stand angeboten, 10014 Elemente wiederhergestellt,
Export (20) bytegleich zu (18)/(19), SHA256
cf247b50a07462cd14f006ffd8bda0bd3015df45bae73b7953bf3c8d9c063398.
Keine Konsolenfehler bei Standprüfung. Next: ausschließlich Recovery-Headerprüfung
von unnötiger Bytekopie befreien, Differentialtests für PNG/JPEG/Fehlerfälle und
vollständige Recovery-/Integritäts-/Abbruchtests, danach gleiche Browsermessung.
Kein Auslassen von Schema, Hash, Budgets, Checkpoints oder Handlevalidierung.

## Recovery-Header ohne Bytekopie (12.10.2026, PR295)
PR294 nach grüner CI gemergt. verifyPayload übergibt den dekodierten Binärstring
direkt an den vorhandenen gemeinsamen imageHeader. Vollständige Bytearraykopie
entfällt im normalen Pfad; expliziter legacy-Diagnosepfad bleibt als Vergleich.
Schema, Hash, Metadatenvergleich, Budgets, Checkpoints und Handleprüfung unverändert.
917 Tests bestanden, einschließlich neuer Payload-Differentialtests (PNG, JPEG
SOF 192/193/194, jede Kürzung, Header-Mutationen, falsche Metadaten/MIME, ungültiges
Base64 und unbekannte Felder). Bestehende Recovery-/Integritäts-/Abbruchtests grün.
Benchmark-Typecheck, fokussiertes ESLint, Diagnosebuild und regulärer Build bestanden.

[Gleicher Browser-Snapshot](recovery-header-no-copy.json): Decode 116,9 ms statt
369,2 ms, Header unverändert 0,5 ms. Bounded restore 1293,4 statt 1572,9 ms.
Andere Phasen schwanken: Handles 353,6 ms, Hashinput 307,3 ms, Schema 251,1 ms,
Modell 102,5 ms. Verschachtelte Zeiten; Einzelvergleich, kein p95-Versprechen.
Export (21) bytegleich zu (18)/(19)/(20), SHA256
cf247b50a07462cd14f006ffd8bda0bd3015df45bae73b7953bf3c8d9c063398.
Keine Konsolenfehler, keine Daten-/UI-/Formatänderung.

Nächster Einzelauftrag: die Handle-Erstellung auf wiederholte Payloadprüfungen
untersuchen. Bereits geprüfte Daten, Besitz/Unveränderlichkeit und Trust-Grenze
konkret nachvollziehen; nur bei belegter sicherer Wiederverwendung eine begrenzte
Optimierung vorschlagen. Keine öffentlichen ungeprüften Handle-Fabriken und keine
entfallende Eingangsvalidierung. Zunächst Diagnose/Architekturprüfung, keine weitere
Produktoptimierung in diesem Folgeauftrag.
