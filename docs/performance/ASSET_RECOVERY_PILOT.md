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
