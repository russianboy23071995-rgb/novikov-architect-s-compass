# Vorbereitetes Punktstrecken, 24.10.2026

## Änderungskarte vor Code

AUD14-04/A04, §9; Basis PR429d79668d, CI beim Start laufend. Nutzerziel:
Punktstrecken von Linien/Schraffuren verwendet vorhandene vorbereitete Punktadapter.
Schräge geschlossene/konkave Kontur, andere Griffe, ±/Null, große Koordinaten und
Nachbarüberquerung gegen vollständigen Pfad prüfen. Keine Wand-/3D-Migration.

Application-Adapter pinnen Projekt, Ziel-ID, Griff, Ursprung und rohe Richtung;
Geometry stretchOffset besitzt Projektion/Nachbargrenze. Direkt ursprünglichen
Punkt plus Offset verwenden. Renderer und Fang-/Numeric-UI konsumieren bestehende
Verträge, endgültiger Commit bleibt unabhängig vollständig validiert mit einem Undo.
Keine neue Modellkopie, History, Dateimigration oder IFC-/Recovery-/AI-Regel.
Abnahme: tatsächlicher Adapter/Materialisierung exakt gegen Vollpfad, Muster/Stil,
ungültige/stale Ziele, Abbruch/UndoRedo; Messung wachsender Restgeometrie, Tests,
Typen/Architektur/Lint/Build und praktischer Browserablauf. Framegates bleiben offen.

## Ergebnis und Grenzen

PR429 d79668d nach erfolgreicher CI40032124695 in main13a5906 übernommen.
Die Application-Registry bindet stretch an prepareLinePreview und
prepareHatchContourPreview. Beide pinnen die bestehende rohe Konturrichtung und
verwenden stretchOffset ohne zusätzlichen absoluten Ziel-Roundtrip. Es bleibt
bei den vorhandenen Materialien, Fangregeln, Konturprüfungen und Commit-Aktionen.

Nachweis benchmarks/prepared-drawing-stretch-results.json, Node24.19.0:
216 Maus- und Numeric-Vergleiche gegen editAtPointer ohne Abweichung;
24 vollständige Commit-/UndoRedo-/Abbruchfälle und72 Schutzchecks bestanden.
Zusätzlich permanenter Test aller Griffe einschließlich doppeltem Schließpunkt,
konkaver Kontur,1e9-Koordinaten, Null/±, Stil/Muster und falschem Zielkontext.

Mikromessung, Spannweite der warmen Mediane über Griffe/Koordinaten (ms):

| Unbeteiligte 100-Punkt-Schraffuren | Ziel | Vollpfad | Patch | Materialisierung |
| --- | --- | --- | --- | --- |
| 10 | Linie | 3,71–4,93 | 0,01–0,02 | 0,01–0,03 |
| 100 | Linie | 35,95–39,13 | 0,01 | 0,02 |
| 10 | Schraffur | 6,71–8,18 | 0,01–0,03 | 0,02–0,04 |
| 100 | Schraffur | 71,37–86,20 | 0,02–0,03 | 0,03–0,05 |

Ein Lauf, erster plus acht warme Aufrufe, wechselnde Voll/Patch-Reihenfolge.
Materialisierung anschließend separat; keine kausale Frame-/Native-Messung.
Vorbereitung separat im JSON. Wiederholte vollständige Projektvalidierung
entfällt in der Vorschau. Materialisierung mappt weiterhin die Zielkollektion;
BimPlan leitet aus previewEdit weiterhin den Plan ab. Das ist ausdrücklich
verbleibende globale Arbeit und keine vollständige Skalierungsabnahme.

Browser localhost8080 mit frischem Testmodell, echte Recovery-Angebote unangetastet:
- Schräge Linie von1,99 auf2,49m mittels Punkt2 und +0,5m gestreckt.
  Ein Undo liefert1,99m, Redo2,49m. -100m wird mit Nachbargrenzenhinweis und
  gesperrtem Übernehmen abgewiesen; Escape beendet die Vorschau.
- Gedrehtes Rechteck als Schraffur, Punkt2 um-0,2m gestreckt, Vorschau/Enter.
  Undo/Redo verglichen über sichtbare SVG-Punkte: nur Punkt2 ändert sich von
  (0.9,0.7000000000000001) zu (0.701098909415719,0.6790630430963915).
  Füllfarbe/Deckkraft bleiben erhalten. Browserbeleg im lokalen Task-output
  prepared-drawing-stretch.png.

1155 Tests, App-/Benchmark-Typprüfung, Architekturgrenzen, gezielter Lint und
Produktionsbuild bestanden. Finale Änderungskarte geprüft: nur drei bestehende
Application-Dateien ändern Produktverhalten. Kein Rendererdispatch, keine
Modell-/Datei-/Recovery-/IFC-Änderung, kein neuer AI-Sonderweg oder Importzyklus.
Die vollständigen Commit-Prüfungen bleiben unverändert. Kontinuierliche Gesten,
Gesamtframes und Native-/Kapazitätsgates werden durch diese Abnahme nicht geschlossen.
Der einzige nächste Auftrag steht in Masterplan §9.
