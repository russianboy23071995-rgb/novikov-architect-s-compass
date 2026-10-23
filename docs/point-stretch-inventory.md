# Punktstreckpfade – Diagnose 24.10.2026

## Änderungskarte vor Code

AUD14-04/A04, Masterplan §9. PR427 nach grüner CI39660775101 in main38e9b9f
übernommen. Ziel: verbliebene 2D-Punktstreckpfade von Linien und Schraffuren
vermessen und die Eignung vorhandener vorbereiteter Punktaktionen feststellen.
Normale schräge Kante, konkave Kontur, große Koordinaten und Nachbarüberquerung
prüfen. Kein Produktumbau in diesem Diagnoseauftrag.

Quelle bleibt der geprüfte Projektstand mit stabiler Ziel-ID, Griff, Ursprung und
Geschoss. Application besitzt Vorschau/Commit; vorhandene Geometry-/Domain-Regeln
besitzen Projektion und Konturvalidierung. Diagnose ausschließlich benchmarks/;
keine neue produktive Importkante, zweite Modellkopie oder Dateimigration.

Vollpfad previewEdit/editAtPointer gegen vorhandenen point-Adapter mit abgeleitetem
Streckziel vergleichen. Dessen fehlende Streck-Nachbargrenze ausdrücklich messen,
nicht als austauschbaren Produktpfad ausgeben. Kleine feste Zielkontur bei wachsender
Restgeometrie; Vorbereitung und warme Ziele getrennt, exakte Gleichheit außerhalb
der Zeit. Ungültige Ziele, Commit/Undo/Redo, Abbruch und stale Kontext prüfen.
Keine neue UI, somit keine neue Browser-/Frameabnahme erforderlich oder behauptet.
IFC/Recovery/AI unverändert, weil ausschließlich Diagnosecode entsteht.

## Inventur

DemandMenu bietet stretch bei gewähltem Punktgriff. CadWorkspace reicht die
EditSession an editInteraction/useToolInteraction weiter. editDirection bestimmt
die Richtung vom vorigen Punkt zum Griff (Griff0 verwendet Punkt1 als Nachbar).
resolveEditSnap besitzt Fang und Nachprojektion; numericMoveAxis liefert signierte
Länge und „+ verlängert · − verkürzt“. previewNumericMove ruft previewEdit auf.

prepared-preview.ts registriert für Linie/Schraffur point/edge/offset/insert,
aber kein stretch. previewEdit fällt daher auf editAtPointer zurück. Dieser
projiziert die Verschiebung auf den rohen Konturvektor, sperrt
`length + distance <= 1e-9` und bewegt genau den Griff über moveElementPoint.
Die vollständige Projektvalidierung läuft pro Ziel. Der endgültige Controller-
Commit benutzt denselben vollständigen Weg und die bestehende History.

prepareLinePreview und prepareHatchContourPreview können bereits einzelne Punkte
begrenzt ableiten; sie besitzen aber keine Streckgrenze. Ein vorgeschaltetes
`anchor + projectedDelta` wird dort wieder als `target - anchor` verarbeitet.
Diese Zusatzrechnung ist nicht generell exaktgleich. Für die spätere Anbindung
müssen ursprünglicher Offset und Nachbargrenze gemeinsam erhalten bleiben.

## Messung und Entscheidung

Reproduktion: `node --experimental-strip-types benchmarks/point-stretch-inventory.ts`.
Rohdaten: point-stretch-results.json und point-stretch-repeat-results.json.
Node24.19.0/Windows, feste konkave Fünfpunktkontur (Linie geschlossen), Griff0/1/3,
versetzter Ursprung, Koordinaten0/1e9, jeweils10/100 zusätzliche100-Punkt-Schraffuren.
Ein kaltes und acht warme Ziele; Reihenfolge Vollpfad/Kandidat abwechselnd.
Vorbereitung separat, Vergleiche und vollständige Commitprüfung außerhalb Timing.

Erster Lauf:216 Mausprojekt-/Zielvergleiche und216 Numeric-Vergleiche;
36 Maus- und52 Numeric-Projekte sind nicht exaktgleich. Die vollständige aktuelle
Vorschau stimmt in allen216 Fällen exakt mit editAtPointer überein.24 vollständige
Commits/Undo/Redo/Abbrüche und72 ungültige-/Stale-Prüfungen bestanden.16 von24
unbeschränkten Punktaktionen akzeptieren das überquerende Ziel, das stretch korrekt
ablehnt. Diese Fälle sind **kein Produktfehler**, sondern verhindern die ungeprüfte
Übernahme des Diagnosekandidaten.

Warme Medianbereiche über die sechs Griff-/Koordinatenfälle, erster Lauf in ms:

| Restgröße | Ziel | Vollvorschau | Vorbereiteter Punktpatch |
| --- | --- | ---: | ---: |
| 10 | Linie | 3,70–5,18 | 0,008–0,021 |
| 10 | Schraffur | 6,60–8,53 | 0,014–0,030 |
| 100 | Linie | 36,53–40,77 | 0,011–0,017 |
| 100 | Schraffur | 73,46–78,04 | 0,016–0,024 |

Zweiter Prozess bestätigt dieselben36 Maus-/52 Numeric-Abweichungen und Schutzfälle.
100 Restobjekte: Linie35,28–42,85 ms, Schraffur76,92–85,21 ms; Punktpatch
0,011–0,030 ms. Insgesamt432 Mausvergleiche,432 Numeric-Vergleiche,48 vollständige
Commit-/Historyfälle und144 Schutzchecks. Ein gespeichertes Beispiel unterscheidet
sich in Y nur zwischen −0,04869999999999999 und −0,048699999999999966.
Kein sichtbarer Produktfehler behauptet; exakte Wiederverwendung bleibt das Gate.

Die Differenz umfasst volle Projektmaterialisierung/Validierung gegenüber lokalem
Patch. Sie ist kein zugesicherter Browser-Speedup. Fang, React, Rendering, Commit,
GPU/Frames und native Dauergesten liegen außerhalb der Messung. JIT/GC/Systemlast
nicht isoliert. Keine Toleranz gelockert und kein Kandidat produktiv registriert.

Acht einschlägige bestehende Punkt-/Numeric-Tests, Benchmark-Typecheck, fokussiertes
Lint und Architektur-Gate bestanden. Keine erneute Produktsuite/Build/Browserprüfung,
weil src/ unverändert. Keine neuen produktiven Importpfeile, Zyklen oder Modellkopien.
Einziger Folgeauftrag gemäß Masterplan §9: gemeinsame Streckversatz-Query einschließlich
Nachbargrenze extrahieren und unabhängig gegen die ursprüngliche Arithmetik prüfen;
erst danach vorbereitete Punktadapter anschließen.
