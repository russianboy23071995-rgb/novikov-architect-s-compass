# Recovery-Kapazität – begrenzte Browsermessung

## Bild-Bytekonvertierung vom 12.10.2026

Messstand `646ad6b` (Produktionsänderung 01f8d62, main-Basis 350b64c). `binaryBytes` ersetzt ausschließlich die Iterator-Konvertierung in checkImageUrl durch eine vorallokierte Bytearray-Schleife. Eingabe ist der Latin-1-Binärstring von atob, keine allgemeine Unicode-Zeichenfolge. atob, Header-/Metadatenprüfung, URL-Erzeugung, Inhaltscache und seine Budgets bleiben unverändert. Dateiformat und Grenzen werden nicht gelockert.

878 Tests bestanden: zusätzlich byteidentischer Vergleich aller 256 Werte, leerer Eingabe, 100 deterministischer Zufallsstrings und eines 8-MiB-Binärstrings; PNG/JPEG- und ungültige Base64-/Header-/Metadatenfälle gegen vorherigen URL-Pfad. Vorhandene Tests prüfen Cache-Hits, Mutation, LRU und Speicherbudget weiterhin. Beide Typechecks, Build und Lint (0 Fehler/6 bestehende Warnungen) bestanden.

Gleiche Diagnose und Fixture wie unten; ausschließlich Instrumentierungsstelle an neuen Funktionsaufruf angepasst. Kleines Kontrollprojekt und große Datei jeweils erster Lauf + fünf warme Wiederholungen. Zwölf Referenzanzahlprüfungen bestanden; abschließender regulärer Projektexport vollständig JSON-identisch zur ursprünglichen Datei. Keine Konsolenwarnungen/-fehler. [Neue Rohdaten](image-byte-conversion-2026-10-12.json), [Vorgänger](load-phases-detail-2026-10-12.json). Screenshot lokal outputs/image-byte-conversion.png.

| Beobachtung | Vorher ms | Nachher ms |
| --- | ---: | ---: |
| Erstlauf Bytekonvertierung | 559,6 | 19,0 |
| Erstlauf atob | 9,8 | 9,6 |
| Erstlauf checkImageUrl gesamt | 569,7 | 28,9 |
| Erstlauf editingReducer inkl. History | 53,9 | 50,8 |
| Erstlauf Bestätigung bis zwei Frames | 774,9 | 201,2 |
| Erstlauf längste Task | 754 | 183 |
| Warme Bestätigung, Median von fünf Läufen | 169,4 | 176,8 |

Der Gewinn liegt erwartungsgemäß im Cache-Miss; warme Wiederholungen profitieren schon zuvor vom vorhandenen Cache. Die leicht unterschiedlichen warmen Mediane sind keine belastbare Regression/Beschleunigung. Entwicklungsserver, gleicher Rechner/Tag, keine randomisierten A/B-Läufe, kein frischer OS-/Browserprozess und keine kontrollierte Hintergrundlast. Keine isolierte GPU-/Decoder-/Commitmessung; verschachtelte Zeiten nicht addieren. Hauptthread-Pausen um 0,2 Sekunden bleiben möglich. Der konkrete Engpass ist damit stark reduziert, nicht die allgemeine Kapazität freigegeben.

Praktische Abnahme: großes Referenzprojekt öffnen, Darstellung prüfen, speichern und wieder öffnen; Wand ändern, Undo/Redo sowie Wiederaufnahme wie im bestehenden Ablauf testen. Als nächster kleiner Auftrag den weiter sichtbaren Startangebot-Hinweis ohne Hot-Reload reproduzieren und gegebenenfalls dessen Lebenszyklus korrigieren, bevor weitere Architekturmaßnahmen erwogen werden.


## Aufschlüsselung der Ladebestätigung (12.10.2026)

Produktionsbasis `f50c4bf`, Diagnosezweig `bench/workspace-load-phases`. Eigenständige Vite-Konfiguration `benchmarks/load-phase.config.ts` instrumentiert ausschließlich im Serve-Modus echte Funktionen mit transparenten try/finally-Zeitmessungen. Produktionsdateien und Verhalten unverändert. Transform verweigert veraltete Quelltextstellen. Regulärer CadWorkspace mit React-Profiler auf isoliertem Origin 8083; vorhandene Nutzer-Recovery wird nicht berührt.

Start: `node node_modules/vite/bin/vite.js --config benchmarks/load-phase.config.ts`. `/benchmarks/load-phases.html` öffnen, dieselbe oben beschriebene `large-reference-project.json` wählen und „Phasen messen“ drücken. Die Diagnose reicht echte File-Objekte über den regulären Dateiinput ein und klickt die tatsächliche Ladebestätigung. Pro Profil erster Lauf plus fünf Wiederholungen, zunächst kleines Beispielmodell, dann 9.616.625-Byte-Datei. Datenvorbereitung außerhalb des gemessenen Bestätigungsfensters. Jeweils Dialogabschluss, zwei Frames und 300 ms Beobachtungsnachlauf; Referenzanzahl nach jedem Vorgang geprüft. Warmes erneutes Laden desselben Projekts ist kein unabhängiger Kaltstart und erzeugt bei Inhaltsgleichheit keine neue Undo-Mutation.

[Erster Lauf mit groben Phasen](load-phases-2026-10-12.json), [zweiter Lauf mit Konvertierungsdetails](load-phases-detail-2026-10-12.json). Je 12, insgesamt 24 Bestätigungen/Referenzanzahlprüfungen bestanden; keine Konsolenwarnungen/-fehler. Chromium 155/Windows; Entwicklungsbuild und Profiler-Overhead. 876 Tests, Benchmark-Typecheck, Build und gezieltes Lint bestanden. Screenshot lokal: outputs/load-phases.png. Die lange Dauer eines einzelnen Automationsaufrufs ist keine App-Laufzeit; relevant sind die erfassten Browserphasen.

Detaildurchlauf, Millisekunden:

| Phase | Kleine Kontrolle erster Lauf | Großes Bild erster Lauf | Großes Bild warme Werte |
| --- | ---: | ---: | --- |
| Bestätigung bis zwei Frames | 103,7 | 774,9 | 148,8–196,8; Median 169,4 |
| editingReducer inkl. History | 0,6 | 53,9 | 75,9–83,9 |
| commitProject (in Reducer enthalten) | 0,3 | 28,4 | 50,8–57,8 |
| derivePlanScene | <0,1 | <0,1 | <0,1 |
| checkedImageUrl | entfällt | 569,8 | 5,1–6,2 |
| darin checkImageUrl (Cache-Miss) | entfällt | 569,7 | entfällt: Cache-Hit |
| darin atob | entfällt | 9,8 | entfällt |
| darin Uint8Array.from | entfällt | 559,6 | entfällt |
| darin imageHeader | entfällt | 0,1 | entfällt |
| React actualDuration gesamt | 60,4 | 712,3 | 118,2–151,8 |
| Längste beobachtete Task | keine ≥50 ms | 754 | 108–148 |

**Verschachtelte Messungen nicht addieren:** React actualDuration enthält Renderarbeit und darunter aufgerufene Funktionen; commitProject ist Teil des Reducers, atob/Bytekonvertierung Teil der URL-Prüfung. Profiler liefert Renderdauer und Commit-Zeitpunkte, keine isolierte DOM-Commit-Dauer. SVG-image-load-Ereignis wird protokolliert, liefert aber keine reine Decoder-/GPUzeit. Diese Grenzen werden ausdrücklich nicht durch Differenzbildung als exakte Phasen ausgegeben.

Der erste Durchlauf zeigte 798 ms in checkImageUrl, der zweite 570 ms; Ausführung/Last/JIT streuen. In beiden dominiert derselbe Pfad. Der zweite Durchlauf lokalisiert fast die gesamte Zeit in `Uint8Array.from(binary, c => c.charCodeAt(0))`. Der bestehende 48-MiB-Inhaltscache greift bei Wiederholung; seine Abschaffung oder Vergrößerung ist hier nicht begründet. Ein gezielter Vergleich mit einer vorallokierten Bytearray-Schleife ist der nächste begrenzte Auftrag. Keine Renderer-, Speicherformat- oder Workerentscheidung aus diesen Befunden ableiten. Warme History-/Serialisierungskosten bleiben separat offen.


## Workspace-Abnahme vom 12.10.2026

Produktionsbasis `625031e` (PR253); Diagnosezweig `test/large-reference-workspace`. Vollständiger CadWorkspace, reale Adapter, keine Modelltest-Hooks. Eigener Origin `http://127.0.0.1:8082` schützt Nutzer-Recovery auf 8080/8081. Nur synthetische Daten. Chromium 155/Windows. Der Entwicklungsserver ist kein Produktionsperformance-Nachweis.

Reproduktion (Outputs außerhalb Git):

```text
python benchmarks/reference-workspace-image.py <output.png>
node --experimental-strip-types benchmarks/reference-workspace-fixture.ts <output.png> <project.json>
node node_modules/vite/bin/vite.js --config benchmarks/vite.config.ts --port 8082
```

Dann `/benchmarks/reference-workspace.html` öffnen, Datei mit „Open project“ wählen. Die Diagnose montiert den regulären Workspace und beobachtet ausschließlich Long Tasks und Buttonklickzeiten; keine Ersetzung von Modellaktionen. Dateigenerator: RGB-Rauschen 1550×1550, Python Random Seed 253, PNG/zlib; Projekt-ID acceptance-large-reference-253. Keine Binärfixture im Repository. Gemessene Dateigröße 9.616.625 Bytes = 9,17 MiB; eine Wand, ein Fenster, eine Bildreferenz. Abweichende zlib-Versionen können andere kodierte Bytes erzeugen.

Abnahme:
- Öffnen vorbereiten und abbrechen: ausgewählte 3-m-Ausgangswand bleibt, kein Bild, Undo deaktiviert.
- Erneut öffnen/bestätigen: Bild sichtbar, drei Elemente, Auswahl leer. Export vollständig JSON-identisch zur Fixture.
- Lade-Undo entfernt die Referenz; Redo stellt sie wieder her.
- Wand auf 4 m ändern: Undo zeigt 3 m, Redo 4 m. Auswahl wird dabei aufgehoben. Bilddaten unverändert.
- Projekt herunterladen, lokalen Snapshot erstellen, Seite neu laden. Startangebot erkennt genau das Testprojekt.
- Stand prüfen, Wiederaufnahme vorbereiten/abbrechen erhält das Ausgangsmodell und leere History.
- Erneut prüfen/vorbereiten/bestätigen: 4-m-Wand, Fenster und Referenz sichtbar. Export vollständig JSON-identisch zum gespeicherten Änderungsstand.
- Browserkonsole ohne Warnungen/Fehler. Screenshot `outputs/reference-workspace-restored.png` (lokaler Prüfbeleg).

Rohdaten: [Öffnen/Bearbeiten/Sichern](workspace-large-reference-load-2026-10-12.json), [Wiederaufnahme](workspace-large-reference-recovery-2026-10-12.json). Long-Task-Start relativ zu performance.timeOrigin; Klickzeiten im selben Zeitbezug. Kein End-to-End-Timer: Zeit zwischen Bedienhandlungen enthält bewusst Warte-/Prüfzeit und ist keine Laufzeit. Long Tasks sind Beobachtungen, keine Zuordnung zu einer konkreten Funktion.

| Beobachtung | Long Task ms |
| --- | ---: |
| Datei vorbereiten | 121 |
| Bestätigtes Laden | 814 |
| Export | 129 |
| Laden Undo / Redo | 104 / 129 |
| Änderung Undo / Redo | 82 / 86 |
| Snapshot schreiben, längste beobachtete Task | 179 |
| Recovery prüfen, zwei Aufrufe | 161 / 174 |
| Wiederaufnahme bestätigen | 890 |

Validierung des Diagnosezweigs: 876 Tests, App-/Benchmark-Typechecks und Produktionsbuild bestanden; Lint 0 Fehler/6 bekannte Fast-Refresh-Warnungen.

Einzelabläufe, keine Mediane/p95 oder allgemeine Kapazitätsfreigabe. Funktionaler Rundlauf bestanden, dennoch deutliche Hauptthread-Pausen bei bestätigter Übernahme. Genau diese Phase wird als nächster begrenzter Diagnoseauftrag aufgeschlüsselt, bevor eine neue Architekturmaßnahme gewählt wird. Der Startangebot-Hinweis bleibt nach bestätigter Wiederaufnahme sichtbar; als separater UX-Befund dokumentiert. Automatische Sicherung, GPU-/Spitzenspeicher, viele kombinierte Bilder, Browserdatenverlust und Stromausfall sind hier nicht geprüft. Port 8082 ausschließlich für diese Diagnose verwenden; vorhandene Daten auf diesem Origin nicht löschen.


## Pilot vom 12.10.2026: kanonische Base64-Zeichenprüfung

Messstand `16b09d5` auf main `95fae03`. Der gemeinsame Storage-Prüfer verwendet eine private ASCII-Wertetabelle statt Alphabet-Suche pro Zeichen. Keine API-, Format-, Trust-, Größen- oder Pixelbudgetänderung. Nicht-ASCII-Zeichen einschließlich Surrogaten, Padding und ungenutzte Endbits bleiben strikt geprüft. Bilddekodierung bleibt Aufgabe des Importadapters.

Fünf neue Tests: sämtliche 4.096 Zwei-Zeichen- und 262.144 Drei-Zeichen-Endgruppen einschließlich unabhängigem Buffer-Roundtrip; 65.536 UTF-16-Zeichen an jeder der vier Positionen; 3.000 deterministische gültige/mutierte Fälle; große Strings bis 10 MiB; Storagegrenzen und unveränderliche eigene Kopien. Vergleichsoracle enthält den vorherigen Produktionsvertrag inklusive vorgeschalteter Mindestlänge.

Isolierter Node-Vergleich: zwei Aufwärmrunden und sieben Messrunden, abwechselnde Reihenfolge; bei 10 MiB Median 130,4 → 26,5 ms. [Rohdaten](base64-scan-2026-10-12.json), reproduzierbar mit `node --experimental-strip-types benchmarks/base64-scan.ts`. Kein CI-Zeitlimit, kein Dekodierungsbenchmark.

Browser: gleiche sechs synthetischen Profile, erster Lauf plus fünf warme Wiederholungen. 252 Phasenmessungen/108 Inhaltsvergleiche bestanden, keine Konsolenwarnungen/-fehler. Chromium 155 auf Windows, 12 logische Prozessoren/16 GiB laut Browser. [Rohdaten](base64-recovery-2026-10-12.json). Gleicher Tag/Rechner wie Vorgänger; keine randomisierte A/B-Browsermessung, keine kontrollierte Hintergrundlast. p95 bei fünf Werten ist das Maximum. UI-Darstellung, vollständige Bilddekodierung/GPU, Kaltstart, Spitzenspeicher, Eviction und Stromausfall sind nicht abgedeckt.

| Profil | Dateivorbereitung Median vorher/nachher ms | Recovery-Lesen Median vorher/nachher ms | Datei p95 nachher ms | Recovery p95 nachher ms |
| --- | ---: | ---: | ---: | ---: |
| Geometrie 1000 | 7.7 / 7.5 | 9.8 / 9.6 | 8.0 | 9.8 |
| Geometrie 10000 | 76.7 / 75.1 | 98.7 / 91.3 | 76.4 | 91.6 |
| Bild klein | 39.7 / 12.1 | 48.9 / 19.7 | 12.9 | 20.3 |
| Bild mittel | 153.1 / 45.8 | 174.9 / 70.2 | 48.8 | 71.7 |
| Bild nahe Grenze | 337.2 / 92.6 | 364.9 / 135.8 | 95.3 | 143.5 |
| Gemischt | 204.2 / 82.8 | 234.3 / 114.0 | 83.2 | 117.4 |

876 Tests, App-/Benchmark-Typecheck, Build und Lint (0 Fehler/6 bestehende Warnungen). Hauptthread-Pausen bleiben möglich; keine allgemeine Kapazitätsfreigabe und keine Anhebung der 10-MiB-Grenze. Nächste Abnahme im vollständigen Workspace statt weiterer Optimierung auf Verdacht, siehe Masterplan §9.


## Pilot vom 12.10.2026: einmalige Bildprüfung am Dateieingang

PR250 nach ausdrücklicher Freigabe und grüner CI zusammengeführt. Messstand
`bea8688`, Vorgänger `79b864f`; gleiche sechs Profile und Diagnose. Der öffentliche
`loadProjectData`-Eingang erstellt vollständig geprüfte eigene Asset-Kopien einmal.
Die private Migration verwendet ihre unveränderlichen Identitätshandles über alle
Versionen weiter. Sämtliche Projekt-/Beziehungsprüfungen bleiben erhalten. Direkte
öffentliche Ladeaufrufe erneuern Handles; keine fremde ID oder gefälschte Markierung
wird vertraut. Das Format und die 10-MiB-Grenze bleiben unverändert.

Vier neue Tests: Akzeptanz-/Wertevergleich mit bisherigem vollständigem Pfad über
19 Varianten von Base64/Metadaten, eigene unveränderliche Kopien und gefälschte
Handles, Version-9-Migration/Beziehungen sowie Dateigrößengrenze. Eine zunächst
mit aktuellen Zusatzfeldern erzeugte Version-9-Testdatei wurde berichtigt; die
Produktionsmigration wurde dafür nicht gelockert.

[Rohdaten](single-asset-ingress-2026-10-12.json), Beginn 10:02:56 UTC. Chromium 155,
Windows x64, 12 logische Prozessoren und 16 GiB deviceMemory laut Browser, Dokument
sichtbar. 252 Phasenmessungen und 108 Inhaltsvergleiche bestanden, keine
Konsolenfehler. 869 Tests, App-/Benchmark-Typecheck, Build und Lint bestanden
(0 Fehler/6 bestehende Warnungen). Derselbe Rechner/Browser wie die Referenzmessung vom selben Tag;
keine randomisierten A/B-Läufe oder kontrollierte Hintergrundlast. Je ein erster
und fünf warme Läufe; p95 entspricht dem größten warmen Wert. Die Originaldaten
bleiben erhalten. Dies ist keine allgemeine Kapazitätsfreigabe.

| Profil | Dateivorbereitung Median vorher/nachher ms | Recovery-Lesen Median vorher/nachher ms | Dateivorbereitung p95 nachher ms | Recovery-Lesen p95 nachher ms |
| --- | ---: | ---: | ---: | ---: |
| Geometrie 1000 | 8.8 / 7.7 | 10.8 / 9.8 | 8.5 | 10.9 |
| Geometrie 10000 | 91.6 / 76.7 | 126.3 / 98.7 | 97.6 | 117.1 |
| Bild klein | 81.1 / 39.7 | 90.2 / 48.9 | 42.9 | 51.8 |
| Bild mittel | 280.0 / 153.1 | 336.8 / 174.9 | 159.6 | 180.1 |
| Bild nahe Grenze | 569.5 / 337.2 | 649.8 / 364.9 | 368.8 | 383.2 |
| Gemischt | 311.9 / 204.2 | 380.0 / 234.3 | 227.4 | 289.5 |

Das große Bildprofil benötigt weiterhin 337 ms Dateivorbereitung bzw. 365 ms
Recovery-Lesen im warmen Median. Die längsten dort beobachteten Tasks betragen je
369 ms. Manuelle Sicherung ohne Automatik: 511 ms Median, p95 792 ms. Der Schritt
beseitigt wiederholte Prüfung, nicht sämtliche Hauptthread-Pausen.

Der verbleibende Base64-Prüfer sucht derzeit für jedes Zeichen in einem
64-Zeichen-Alphabet. Das ist ein konkreter Kandidat, noch keine isolierte
Zeitzuordnung. Als nächster begrenzter Auftrag wird dieser Prüfer gegen eine
lineare Zeichenklassifikation verglichen und nur bei identischer Akzeptanz sowie
nachgewiesenem Gewinn ersetzt. Zeichenmenge, Padding und ungenutzte Endbits bleiben
streng geprüft. Keine Decoder-Lockerung, keine Grenzänderung und kein Formatumbau.
Maßgeblich bleibt allein Masterplan §9.

## Pilot vom 12.10.2026: geprüfte Schreibrevision

PR249 wurde nach ausdrücklicher Freigabe und erfolgreicher CI zusammengeführt.
Der Folgepilot (`79b864f`) ergänzt `prepareRecoveryWriter` im gemeinsamen
Application-Recovery-Dienst. Seine Closure besitzt die exakt gelesenen Bytes und
den daraus vollständig geprüften gültigen Snapshot. Eigene erfolgreiche Writes
ersetzen diese Revision erst nach dem Commit. Es gibt keine extern übergebbare
„trusted“-Markierung und keinen globalen Cache. Fehler lassen die vorherige
Revision unverändert; parallele Aufrufe desselben Writers werden abgewiesen.

Der Controller nutzt denselben Writer für manuelle und automatische Sicherung.
Bei ausgeschalteter Automatik wird pro manuellem Aufruf weiterhin eine neue
Revision vorbereitet; es ändert sich keine Bedien-/Konfliktregel. Bei aktiver
Automatik bleibt die Revision bis zum Kontextwechsel bzw. zur bewussten
Reaktivierung erhalten. Neue Projektinhalte durchlaufen unverändert
`serializeProject` einschließlich Vollvalidierung und Dateigrenze. Unbekannte
Speicherbytes und Wiederaufnahme bleiben vollständige Fremddatenprüfungen.
Der IndexedDB-Adapter und sein atomarer Compare-and-replace wurden nicht geändert.

Fünf zusätzliche Tests vergleichen die Snapshotbytes über mehrere Schreibvorgänge
mit dem unveränderten vollständigen `saveRecovery`-Pfad, einschließlich beschädigtem
aktuellem Stand und gültigem Vorgänger. Weitere Fälle: Quota/Transaktionsabbruch,
falsche Projekt-ID, ungültige neue Geometrie, beschädigte Gesamtdaten, veralteter
Kontext, zwei konkurrierende Revisionen und gleichzeitige Aufrufe. Bestehende
Controller-Tests decken Ausschalten/Laden, verzögerte Vorbereitung/Publikation,
Konfliktpause, Undo/Redo und serielles Schreiben weiterhin ab.

### Vergleichsergebnis

[Rohdaten vom 12.10.2026](recovery-reuse-2026-10-12.json), Beginn 09:30:23 UTC,
Chromium 155/Windows x64, 12 logische Prozessoren und 16 GiB deviceMemory laut
Browser, Dokument sichtbar, gleiche sechs Profile und unveränderte Diagnose.
252 Phasenmessungen und 108 Inhaltsvergleiche bestanden; keine Browserfehler.
865 Tests, App-/Benchmark-Typecheck, Build und Lint bestanden (0 Fehler,
6 bestehende Fast-Refresh-Warnungen).

Die zwei Messtage sind kein randomisierter A/B-Versuch; Hintergrundlast und
Scheduling wurden nicht kontrolliert. Unveränderte Lesezeiten schwanken ebenfalls.
Warm p95 ist weiterhin der größte von fünf Werten. Vollständige Einzelwerte,
erste Läufe und Timerverzug stehen im verlinkten JSON.

| Profil | Manuell vorher/nachher Median ms | Auto vorher/nachher Median ms | Auto p95 nachher ms | Auto längste Task vorher/nachher ms |
| --- | ---: | ---: | ---: | ---: |
| Geometrie 1000 | 29.7 / 18.9 | 17.0 / 9.0 | 9.4 | 0 / 0 |
| Geometrie 10000 | 277.7 / 195.2 | 165.3 / 76.1 | 91.7 | 167 / 72 |
| Bild klein | 172.0 / 111.0 | 94.2 / 23.9 | 28.7 | 84 / 0 |
| Bild mittel | 689.2 / 416.0 | 356.9 / 88.9 | 114.3 | 334 / 53 |
| Bild nahe Grenze | 1365.7 / 798.9 | 733.8 / 156.5 | 323.7 | 673 / 88 |
| Gemischt | 827.2 / 496.1 | 435.4 / 112.1 | 137.0 | 446 / 74 |

Beim größten Bildprofil sinkt der warme Auto-Median von 734 auf 157 ms,
die längste Auto-Task von 673 auf 88 ms. Eine allgemeine ruckelfreie Bedienung ist
damit nicht bewiesen: p95 erreicht 324 ms, die Hauptthread-Task weiterhin 88 ms.
Manuelle Sicherung ohne aktive Automatik braucht noch 799 ms im Median,
Recovery-Lesen 650 ms. Die erste Prüfung unbekannter Speicherbytes bleibt teuer.
Die initiale Auto-Aktivierung ist weiterhin nicht in der Auto-Phase enthalten.

Nächster begrenzter Auftrag gemäß Masterplan: an der gemeinsamen Dateigrenze die
heute doppelte Bild-Storageprüfung (Projektparse, anschließend Handle-Erzeugung)
auf eine vollständige Prüfung pro eingehendem Asset reduzieren. Keine ungeprüften
Handles, kein Cache anhand einer vom Benutzer gelieferten ID. Akzeptanz/Ablehnung,
Migration, Größen-/Pixelgrenzen und unveränderliche eigene Kopien gegen bisherigen
Pfad prüfen; identische Recovery-/Dateivorbereitungsprofile erneut messen.

Die nachfolgenden Originalmessungen vom 10.10. bleiben als Baseline erhalten.

## Zweck und Reproduktion

Der Pilot misst die bestehenden Application-/IndexedDB-Pfade mit synthetischen
Projekten. Er verändert weder Produktionscode noch Dateiformat, Limits oder
Produktions-Recovery. `npm run benchmark:browser`, dann
`http://127.0.0.1:8081/benchmarks/recovery-capacity.html` öffnen, Quellstand eintragen
und „Messung starten“ wählen. Andere CPU-intensive Aufgaben währenddessen vermeiden.
Die Diagnose verwendet eine eigene Datenbank mit zufälliger ID und löscht diese
nach dem Lauf. Keine Inhalte aus Benutzerprojekten werden gelesen oder übertragen.

Sechs Profile: 1.000/10.000 Linien, drei deterministisch erzeugte echte PNG-Bilder
sowie 5.000 Linien mit Bild. Jedes Projekt enthält zusätzlich eine Wand und ein
Fenster; Bildprojekte enthalten eine Referenz. Die Dateien bleiben unter 10 MiB.
Die PNG-Erzeugung, Vergleichsprüfungen und Ergebnisdarstellung liegen außerhalb der
gemessenen Operationen. Nach jedem manuellen und automatischen Schreibvorgang wird
der Inhalt über die reguläre Recovery-Abfrage vollständig zurückgelesen und
verglichen. Auch die Dateivorbereitung wird mit dem Ausgangsprojekt verglichen.

## Messvertrag

| Phase | Gemessener Umfang |
| --- | --- |
| validate | `validateProject` auf dem geladenen Modell, einschließlich bereits geprüfter Asset-Identitätshandles |
| serialize | `serializeProject`: vollständige Modellvalidierung, JSON und Größenprüfung; enthält validate, nicht addieren |
| indexedDB | Unveränderter Adapter `replace`: Metadaten-Parsing, Verbindung, native CAS-Transaktion mit Payload und Index bis Commit; zwei vorbereitete Snapshots, keine vorgelagerte Serialisierung |
| manual | `createAutosaveController.saveNow`, Automatik aus; Vorbereitung, Vorgängerprüfung, Serialisierung und Commit |
| automatic | Derselbe Controller mit aktivierter Automatik, ab Auslösen des Timers bis busy=false; initiale Aktivierung und bewusst ausgelassene 2-s-Wartezeit nicht enthalten |
| recoveryRead | `readProjectRecovery`, einschließlich Lesen, Migration/Validierung des Kandidaten und Dateigrenzen |
| filePrepare | `prepareProjectOpen` aus bereits vorhandenem JSON, einschließlich Prüfung/Migration/Normalisierung; kein Dateidialog, kein Modell-Commit oder Rendern |

Je Phase und Profil ein erster Lauf, danach fünf warme Wiederholungen. Der erste
Save hat noch keinen Vorgänger; warme Saves haben einen. Deshalb zeigen Unterschiede
auch unterschiedliche Arbeit und nicht nur JIT-/Cache-Effekte. Der Browserprozess
ist nicht kalt gestartet; „erster Lauf“ bedeutet **keine Kaltstartmessung**.
Die Automatik hält eine Revision; der manuelle Weg mit deaktivierter Automatik
bereitet sie pro Aufruf neu vor. Die Profile laufen in fester Reihenfolge in einer
Vite-Entwicklungsumgebung. Kein zusätzlicher Lasttest lief parallel.

Median und p95 beziehen sich nur auf die fünf warmen Werte. p95 ist nach
Nearest-Rank bei fünf Werten der Maximalwert, keine belastbare Verteilungsprognose.
Die 8-ms-Timerprobe erfasst Verzögerungen einschließlich Scheduling und einer
25-ms-Nachlaufphase; sie ist ein Reaktionsindikator, keine reine CPU-Zeit.
Der Long-Tasks-Observer zeigt die längste überlappende Browser-Task ab 50 ms, keine
Summe und keine funktionsgenaue CPU-Zuordnung. Null heißt kein solcher beobachteter
Task, nicht null Hauptthread-Arbeit. GC/Scheduling können Ausreißer erzeugen.

Die Speicherung nutzt aktuelles Projekt plus Vorgänger als JSON-Strings innerhalb
eines weiteren JSON-Datensatzes. Deshalb kann der Recovery-Datensatz fast doppelt
so groß wie die Projektdatei sein; bei vielen escapten JSON-Schlüsseln auch mehr
als doppelt so groß. Erfasste UTF-8-Bytes sind weder die physische
IndexedDB-Belegung noch der tatsächliche RAM-Verbrauch.

## Grenzen

Keine Aussage zu dekodiertem Bild-RAM/GPU, langen Undo-Historien, komplexen
Wandnetzen, Quota/Eviction, Stromausfall, externen Backups oder anderen Geräten.
Kein kalter Browserstart und keine vollständige UI-Wiederaufnahme. Browser-
Statusabgleich/BroadcastChannel/React-Rendering nach dem Commit sind nicht Teil der
Servicezeiten. Bestehende Fehler-/Konflikttests bleiben erforderlich. Die
Produktionsgrenze bleibt 10 MiB; eine generelle Kapazitätsfreigabe folgt hieraus nicht.

## Befund vom 10.10.2026

Messstand `2ceb659`, unveränderter Produktionspfad aus PR248 (`9eac205`). Danach
wurde nur das Trennzeichen einer Tabellenüberschrift und dessen Formatierung
korrigiert, nicht der Messpfad. Rohdaten:
[recovery-capacity-2026-10-10.json](recovery-capacity-2026-10-10.json).
Beginn 13:55:58 UTC; Windows x64, Chromium 155, vom Browser gemeldete 12 logische
Prozessoren und 16 GiB deviceMemory (grobe Browserangabe, keine RAM-Inventarisierung).
Dokument meldete `visible`. CPU-Modell, OS-Build und Hintergrundlast nicht erhoben;
Ergebnisse sind eine lokale Baseline, kein geräteübergreifendes Leistungsversprechen.

Alle 252 Phasenmessungen und 108 Inhaltsvergleiche bestanden. Kein Browserfehler.
860 automatisierte Tests, App-/Benchmark-Typecheck und Produktionsbuild bestanden.
Screenshot: `outputs/recovery-capacity.png` im lokalen Arbeitsbereich. Die
Browsermessung wurde lokal durchgeführt; sie ist kein GitHub-CI-Browserlauf.

Beim größten Bildprofil (9.20 MiB Projekt, 18.40 MiB Recovery-Datensatz) braucht der
warme manuelle Service im Median **1.366 ms**, der automatische **734 ms**, der
isolierte Speicheradapter **75 ms**. Die längste beobachtete Hauptthread-Task beträgt
**1.302 ms** beim manuellen und **673 ms** beim automatischen Weg. Die 2-s-Pause
vor Autosave vermeidet häufige Aufrufe, beseitigt diese Unterbrechung aber nicht.
Bei 10.000 einfachen Linien ohne Bild liegt der warme automatische Median bei
165 ms. Die Geometriegröße bleibt also ebenfalls relevant.

Die Messung lokalisiert die Kosten vor allem außerhalb der nativen Transaktion.
Die Codeprüfung erklärt einen konkreten Anteil: `prepareLease` validiert den
gespeicherten Stand; `saveRecovery` lädt/validiert denselben Vorgänger erneut.
Bei warmen automatischen Saves ist sogar der eigene, zuvor erfolgreich geschriebene
Stand wieder Eingabe dieser Vollprüfung. Beim Lesen untrusted JSON werden die
Base64-Daten erneut geprüft und Handles aufgebaut; die billige In-Memory-Prüfung
mit vorhandenen Asset-Handles ist damit nicht vergleichbar. Die Phasenmessung
beziffert noch keinen isolierten Anteil einzelner Parser-/Base64-Schleifen.

**Abgeleiteter nächster begrenzter Auftrag:** Eine geprüfte Recovery-Revision an
die exakt gelesenen/selbst geschriebenen Bytes und den Projektkontext binden und
deren gültigen Vorgänger innerhalb der Schreibsitzung wiederverwenden. Die
Vollvalidierung neuer Projektinhalte, unbekannter Speicherrevisionen und der
Wiederaufnahme bleibt bestehen. CAS prüft weiterhin die erwarteten Originalbytes,
Erfolg erst nach Commit; Fallback, Konfliktpause und Kontextwechsel unverändert.
Kein allgemeiner Validierungs-Bypass und keine neue globale Modellkopie. Gegen den
bisherigen vollständigen Pfad vergleichen: gleiche Snapshots/Vorgänger und gleiche
Fehlerfälle (beschädigter aktueller Stand, gültiger Vorgänger, Quota/Abbruch,
Fremdschreiber, Laden/Ausschalten). Anschließend dieselben Profile erneut messen.
Ein verbleibender teurer Fremddaten-Ladepfad ist separat zu entscheiden; Worker,
Asset-Auslagerung und Limitänderungen sind in diesem Schritt nicht freigegeben.

## Messwerte (Millisekunden)

### Geometrie 1000

Projekt: 161,051 UTF-8-Bytes; Recovery mit zwei Snapshots: 386,678 Bytes; Elemente: 1002; Pixel: 0.

| Phase | Erster Lauf | Warm Median | Warm p95 | Timerverzug max | Long Task max |
| --- | ---: | ---: | ---: | ---: | ---: |
| validate | 3.4 | 3.3 | 3.5 | 1.3 | 0.0 |
| serialize | 4.8 | 3.3 | 4.5 | 1.0 | 0.0 |
| indexedDB | 3.0 | 2.5 | 2.9 | 1.0 | 0.0 |
| manual | 9.6 | 29.7 | 35.1 | 24.3 | 0.0 |
| automatic | 9.7 | 17.0 | 17.7 | 8.1 | 0.0 |
| recoveryRead | 10.5 | 11.0 | 12.8 | 4.9 | 0.0 |
| filePrepare | 9.5 | 8.7 | 8.9 | 1.6 | 0.0 |

### Geometrie 10000

Projekt: 1,625,151 UTF-8-Bytes; Recovery mit zwei Snapshots: 3,890,878 Bytes; Elemente: 10002; Pixel: 0.

| Phase | Erster Lauf | Warm Median | Warm p95 | Timerverzug max | Long Task max |
| --- | ---: | ---: | ---: | ---: | ---: |
| validate | 30.4 | 28.1 | 30.8 | 22.9 | 0.0 |
| serialize | 34.9 | 37.5 | 41.0 | 33.0 | 0.0 |
| indexedDB | 22.0 | 20.7 | 22.9 | 0.8 | 0.0 |
| manual | 56.7 | 277.7 | 299.0 | 273.0 | 277.0 |
| automatic | 52.6 | 165.3 | 178.4 | 159.4 | 167.0 |
| recoveryRead | 109.1 | 96.9 | 118.8 | 111.0 | 117.0 |
| filePrepare | 86.4 | 80.5 | 95.2 | 87.3 | 95.0 |

### Bild klein

Projekt: 1,205,225 UTF-8-Bytes; Recovery mit zwei Snapshots: 2,411,110 Bytes; Elemente: 3; Pixel: 262,144.

| Phase | Erster Lauf | Warm Median | Warm p95 | Timerverzug max | Long Task max |
| --- | ---: | ---: | ---: | ---: | ---: |
| validate | 0.3 | 0.2 | 0.2 | 1.5 | 0.0 |
| serialize | 3.7 | 3.6 | 3.8 | 1.1 | 0.0 |
| indexedDB | 14.1 | 16.3 | 80.4 | 1.2 | 0.0 |
| manual | 16.8 | 172.0 | 207.2 | 174.9 | 177.0 |
| automatic | 15.3 | 94.2 | 192.1 | 76.9 | 84.0 |
| recoveryRead | 77.6 | 78.1 | 78.7 | 71.1 | 75.0 |
| filePrepare | 106.4 | 66.3 | 69.8 | 126.3 | 106.0 |

### Bild mittel

Projekt: 4,812,919 UTF-8-Bytes; Recovery mit zwei Snapshots: 9,626,498 Bytes; Elemente: 3; Pixel: 1,048,576.

| Phase | Erster Lauf | Warm Median | Warm p95 | Timerverzug max | Long Task max |
| --- | ---: | ---: | ---: | ---: | ---: |
| validate | 0.2 | 0.2 | 0.3 | 1.5 | 0.0 |
| serialize | 12.8 | 13.8 | 15.2 | 7.3 | 0.0 |
| indexedDB | 31.4 | 53.4 | 64.5 | 15.1 | 0.0 |
| manual | 41.0 | 689.2 | 700.1 | 651.3 | 655.0 |
| automatic | 46.1 | 356.9 | 376.4 | 326.0 | 334.0 |
| recoveryRead | 295.1 | 298.8 | 324.0 | 316.2 | 317.0 |
| filePrepare | 294.2 | 278.6 | 290.1 | 286.3 | 294.0 |

### Bild nahe Grenze

Projekt: 9,648,019 UTF-8-Bytes; Recovery mit zwei Snapshots: 19,296,698 Bytes; Elemente: 3; Pixel: 2,102,500.

| Phase | Erster Lauf | Warm Median | Warm p95 | Timerverzug max | Long Task max |
| --- | ---: | ---: | ---: | ---: | ---: |
| validate | 0.1 | 0.1 | 0.2 | 1.1 | 0.0 |
| serialize | 27.6 | 26.4 | 28.3 | 20.3 | 0.0 |
| indexedDB | 50.7 | 74.6 | 79.1 | 21.3 | 0.0 |
| manual | 81.1 | 1365.7 | 1409.6 | 1298.8 | 1302.0 |
| automatic | 95.6 | 733.8 | 768.2 | 666.3 | 673.0 |
| recoveryRead | 591.7 | 605.5 | 660.8 | 644.9 | 648.0 |
| filePrepare | 550.9 | 537.7 | 544.8 | 543.1 | 551.0 |

### Gemischt

Projekt: 5,622,308 UTF-8-Bytes; Recovery mit zwei Snapshots: 11,565,276 Bytes; Elemente: 5003; Pixel: 1,048,576.

| Phase | Erster Lauf | Warm Median | Warm p95 | Timerverzug max | Long Task max |
| --- | ---: | ---: | ---: | ---: | ---: |
| validate | 15.6 | 14.9 | 17.7 | 9.7 | 0.0 |
| serialize | 35.1 | 32.5 | 36.0 | 28.0 | 0.0 |
| indexedDB | 35.9 | 52.1 | 85.8 | 12.3 | 0.0 |
| manual | 66.3 | 827.2 | 846.1 | 786.9 | 786.0 |
| automatic | 65.8 | 435.4 | 643.6 | 438.8 | 446.0 |
| recoveryRead | 349.0 | 354.5 | 386.3 | 370.2 | 373.0 |
| filePrepare | 312.8 | 332.1 | 389.3 | 381.5 | 389.0 |

