# Recovery-Kapazität – begrenzte Browsermessung

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

