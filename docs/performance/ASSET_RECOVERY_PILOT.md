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

Der einzige aktive Folgeauftrag steht in Masterplan §9: kalten Asset-Lesepfad zerlegen
und vorhandene effiziente Eingangsprüfung wiederverwenden, unter unverändert vollständiger
Integritätsprüfung. Erst danach kann über eine Produktionsanbindung entschieden werden.
