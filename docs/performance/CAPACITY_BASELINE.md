# K03 Kapazitäts-Baseline — 08.10.2026

PR180 nach Freigabe und grüner CI zusammengeführt; Basis main d3c228c.
Nur Diagnosecode und Dokumentation geändert. Dateilimit, Validierung und
History bleiben unverändert. Rohbericht: [browser.json](capacity-2026-10-08/browser.json).

## Zielprofil und Messumfang

Erste reproduzierbare Arbeitsprobe, keine zugesicherte maximale Projektkapazität:
100/1.000/5.000 Elemente mit T-Gruppen und Fenstern; bestehende 200.000-Punkt-Fixture;
100 zusammenhängende Wände; 1.000 Elemente mit drei unabhängigen 512×512-Rasterbildern
(PNG/JPEG/PNG). Die Bilder sind deterministisches Farbrauschen, keine realen
Architekturpläne. Die vorläufige Arbeitsprobe ist keine Nutzerentscheidung über
künftige unterstützte Projektgrößen. Neue Dateigrenzen werden daraus nicht festgelegt.

Reproduktion: npm run benchmark:browser; /benchmarks/capacity.html;
Run capacity baseline. Browser erzeugt gültige Bilddateien, importiert über den
Produktadapter, nutzt gemeinsame Platzierungs-/Modell-/History-/Datei-/IFC-Funktionen.
Für 100 History-Schritte wird die Linienfarbe über updateLine geändert und über
commitProject übernommen. Dies misst diese Modellaktion und History, keine gesamte
Mausbewegung. Messpunkte bei 1/10/50/100; Undo/Redo-Ergebnis wird verglichen.
Anschließend wird das Endprojekt in CadWorkspace geladen und 2D → 3D → 2D geschaltet.
Keine anderen Tests/Builds während der Messung; einzelner Entwicklungsbrowserlauf,
kein statistischer Lasttest. Die Diagnose wird nicht vom Produktbuild importiert.

## Geometrie und Dateien

Zeiten in ms, einzelne Funktionsaufrufe. Punkte beziehen sich auf Linien/Polylinien;
Wandzahl separat. IFC umfasst BIM-Wände/Fenster, keine 2D-Linien oder Rasterbilder.

| Fixture | Wände / Linienpunkte | JSON-Bytes | Speichern / Laden | planBounds | IFC |
| --- | --- | --- | --- | --- | --- |
| 100 Elemente | 20 / 120 | 16.121 | 5,3 / 5,2 | 0,3 | 12,0 |
| 1.000 Elemente | 50 / 1.800 | 155.316 | 14,0 / 12,9 | 0,3 | 29,2 |
| 5.000 Elemente | 50 / 9.800 | 778.416 | 25,6 / 34,7 | 1,1 | 65,8 |
| 20 Polylinien | 0 / 200.000 | 3.909.462 | 143,4 / 160,5 | 10,8 | 267,4 |
| Verbundener Wandzug | 100 / 0 | 23.661 | 7,5 / 6,9 | 0,2 | 21,1 |

Die IFC-Zeit der reinen 2D-Fixture ist überwiegend vollständige Projektprüfung;
der Export ist nur 1.900 Bytes ohne diese Linien. Kein IFC-Export großer 2D-Pläne!

Auswahlbewegung einer Wand: in den getrennten T-Gruppen zwei betroffene Wände;
im zusammenhängenden Zug alle 100. Dort Vorbereitung 8,2 ms, erste lokale Vorschau
8,8 ms. Das bestätigt die konservative Abhängigkeitsgröße (K06), nicht deren
fachlich sicheren Ersatz. K01 ist bestanden; die Mindestzoomgrenze bei sehr großer
Ausdehnung bleibt wie in LARGE_PLAN_BOUNDS dokumentiert, nicht erneut verändert.

## Rasterimport und Grenze

| Quelle | Dateibytes | gespeicherter PNG/Base64-Text | Import ms | Platzierungsvorschau / Commit ms |
| --- | --- | --- | --- | --- |
| PNG 512² | 902.636 | 1.203.516 | 53,7 | 86,7 / 57,9 |
| JPEG 512² | 187.600 | 1.191.840 | 47,4 | 152,7 / 127,3 |
| PNG 512² | 902.688 | 1.203.584 | 50,0 | 222,3 / 191,5 |

Vorschau/Commit-Zeiten gelten jeweils für den angewachsenen Projektstand.
Drei Referenzen: 786.432 Pixel gesamt, Projektdatei 3.754.947 Bytes.
Ein RGBA-Puffer pro Bild wäre rechnerisch 1 MiB, insgesamt 3 MiB; dies ist eine
Schätzung einzelner Pixelpuffer, kein gemessener Browser-/GPU-Speicherverbrauch.
JPEG wird im bestehenden Importpfad zu PNG normalisiert. In diesem Rauschbild
wächst der eingebettete Text auf ca. das 6,35-Fache der JPEG-Datei; nicht auf alle
Bildinhalte übertragbar.

Größenprobe mit weiteren IDs und dem bereits importierten PNG-Inhalt: acht
Referenzen mit 9.773.677 Bytes akzeptiert; neunte durch 10-MiB-Gesamtlimit abgewiesen.
Die zusätzlichen Referenzen enthalten absichtlich wiederholten Inhalt; dieser
Versuch belegt auch fehlende automatische Inhaltsdeduplizierung auf diesem
Erstellungspfad. Es ist keine allgemeine Maximalzahl von acht Referenzen.

## History, Speicher und Anzeige

Bei drei Referenzen: Linienänderung Median 98,2 ms / p95 105,1 ms;
History-Commit Median 228,3 ms / p95 239,4 ms (100 Werte, p95 Index 94).
Die Phasen sind hier nacheinander gemessen. Speichern/Laden liegen über die
History-Tiefen hinweg bei ca. 105–111 / 101–107 ms. Undo/Redo liegen in dieser
Probe bei 0–0,1 ms; 0 bedeutet unter Timerauflösung, nicht kostenlos.

| gehaltene Undo-Stände | JS-Heap-Stichprobe, dezimale MB |
| --- | --- |
| 1 | 239,4 |
| 10 | 319,2 |
| 50 | 308,7 |
| 100 | 360,1 |

performance.memory erfasst nur Browser-JS-Heap-Stichproben; kein Peak, kein
Prozess-RSS, keine erzwungene GC-Bereinigung, keine vollständige Decoder-/GPU-Bilanz.
Vorherige Fixtures und temporäre Strings können bis zur GC darin enthalten sein.
Assetobjekte unterscheiden sich zwischen Snapshots, Textinhalte sind gleich.
Gleiche Strings beweisen weder physische Duplizierung noch internes Sharing.
Daher keine Aussage „100 Kopien aller Bildbytes“ und keine kausale Heap-Differenz
allein durch History ableiten. Nach Rückgabe wird nur das Endprojekt in die UI
übernommen; die dortige neue History enthält nicht die 100 Diagnoseschritte.

2D-Erstaufbau des Endprojekts: 1.045,5 ms; Wechsel zu 3D 389,8 ms; zurück 142,1 ms.
Gemessen bis zu zwei RAF, kein GPU-Präsentationszeitpunkt. Sichtbare 3D-Wände mit
Fenstern geprüft; 3D zeigt die 50 Wände/50 Fenster, nicht die Raster-/Linieninhalte.
Keine Aussage zu 3D-Kamerafrequenz, Picking, mehreren gleichzeitigen Ansichten oder
realen großen Gebäuden. IFC mit Referenzprojekt: 198 ms, weiterhin 128.183 Bytes.
Keine neue Archicad-Abnahme.

## Grenzen und genau ein Folgeauftrag

Die Baseline ist abgeschlossen, eine umfassende Großprojekt-Freigabe bleibt offen:
reale hochauflösende Pläne, Gesamtpixel nahe Budget, Prozess-/GPU-Spitzenspeicher,
mehrere 3D-Ansichten, PDF (noch nicht implementiert) und längere Echtbedienung fehlen.
Der harte Dateigrenzenbefund und steigende Vollprojektkosten bei unveränderten
Bildern rechtfertigen K02 vor einer pauschalen Erhöhung des Limits.

**K02 als nächster begrenzter Auftrag:** Einen versionierten Modell-/Assetvertrag
entwerfen und in einem isolierten Diagnoseprototyp mit denselben Referenzdaten
vergleichen. Unveränderliche Bilddaten einmal verwalten, Referenzen und History
auf stabile Asset-Identitäten beziehen; Inhaltsduplikate, portable Weitergabe,
Migration alter JSON-Dateien, fehlende/ungültige Assets und getrennte Budgets
explizit behandeln. Architekturentscheidung und Vorschlag unterscheiden.
Noch kein Produktdateiformat umstellen, keine Validierung pauschal abschalten und
kein Delta-History-Komplettumbau. Danach genau einen Migrationsschritt festlegen.

656 Tests, Produkt-/Diagnose-TypeScript, Build und Lint bestanden (0 Fehler,
6 bekannte Warnungen). K04/K05/K06/K07/K08, kleine Shift-React-Diagnose und V01–V09
bleiben offen und werden durch diese Diagnose nicht als implementiert markiert.
