# Recovery-Kapazität – begrenzte Browsermessung

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

