# K02b: validierte Asset-Handles – Linienfarben-Pilot

08.10.2026, auf main ac129fc nach freigegebenem PR182. Folgt dem
[Modell-/Assetvertrag](MODEL_ASSET_CONTRACT.md). Kein Produktformatwechsel.

## Mechanismus und Vertrauensgrenze

`createImageAssetHandle` prüft mit dem bestehenden vollständigen Storage-Schema,
erzeugt eine eigene normalisierte Kopie und friert sie ein. Alle aktuellen
Assetfelder sind primitive Werte; bei künftig verschachtelten Feldern muss die
Unveränderlichkeit erneut abgesichert werden. Nur dieses Objekt wird in einem
privaten WeakSet registriert. ID, Hash, `Object.freeze` oder Kopie allein reichen
nicht. Das WeakSet hält keine starken Referenzen und benötigt keine ID-basierte
Invalidierung. Änderungen erzeugen neue Objekte und werden neu geprüft.

Das gemeinsame `imageAssetSchema` erkennt solche Handles und erhält ihre Identität.
Alle anderen Eingaben durchlaufen unverändert das vollständige Storage-Schema.
Das ist keine Prüfung der tatsächlichen Bilddekodierbarkeit; dafür bleibt der
Bildimport zuständig. Ein valides Base64 mit anderem Inhalt ist ein neues Asset,
kein wiederverwendeter Nachweis. Geladene JSON-Objekte besitzen keine Identität aus
dem WeakSet und erhalten automatisch die volle Prüfung.

Der Pilot ruft dieselben `updateLine`, `createHistory`, `commitProject`,
`undoProject` und `redoProject` auf wie der Vollpfad. Keine zweite Action-/History-
Implementierung. Geometrie, Anschlüsse, Fenster, IDs, Ebenen, Referenzexistenz und
Referenzausdehnung werden weiterhin in `validateProject` geprüft. Commit prüft
weiterhin die Dateigröße und erzeugt einen Undo-Schritt. Nur Bild-Storage-Prüfung
wird für exakt dasselbe unveränderliche Objekt wiederverwendet.

Aktuell erzeugen ausschließlich Diagnose/Test die Handles. Produktiver Import
und Laden bleiben unverändert. Die kleine gemeinsame Schema-Erweiterung ist
opt-in; kein Consumer muss eigene Validierungs-/Cachelogik erhalten. Noch keine
Deduplizierung oder Modell-/Payloadtrennung im Produkt, keine höheren Limits.

## Reproduktion und Ergebnisse

Diagnose-Vite: `/benchmarks/asset-handles.html`, „Pilot starten“.
Identische K03-Fixture: 1.000 Elemente einschließlich 25 T-Gruppen/50 Fenstern und
drei 512×512 PNG/JPEG-Importe. Erst 100 Vollpfad-Änderungen, dann 100 mit Handles.
Eine lokale gepaarte Messung, keine Gegenreihenfolge oder plattformübergreifende
Studie. Keine parallelen Builds während des Laufs.
[Rohdaten](asset-handles-2026-10-08.json).

| Arbeit | Vollpfad Median / p95 | Handles Median / p95 |
|---|---:|---:|
| Linienfarbe ändern | 125,9 / 154 ms | 10,1 / 13,5 ms |
| Commit | 287,9 / 341,1 ms | 62,1 / 75,4 ms |

Einmalige Handle-Erzeugung: 111,8 ms. History-Erzeugung: 122,2 gegenüber 11,2 ms.
Bei 1/10/50/100 Änderungen stimmen die serialisierten Modellstände überein,
Undo/Redo stellt denselben Zustand wieder her; jeweils ein History-Eintrag pro
Änderung. Alte und neue Stände teilen nur im Handle-Pfad dasselbe Assetobjekt.
Keine Aussage über physische Stringkopien, Spitzen-RAM, GPU oder FPS. Die weiterhin
vollständige JSON-Serialisierung/-Gleichheitsprüfung erklärt einen verbleibenden
Arbeitsanteil, wurde hier aber nicht isoliert profiliert oder verändert.

## Prüfung

665 Tests bestanden; Produkt-/Diagnose-Typechecks und Build erfolgreich;
Lint ohne Fehler, sechs bestehende Fast-Refresh-Warnungen.
Vier neue Tests prüfen:

- Eigene eingefrorene Kopie, Mutation des Ursprungs, unveränderte Identität;
  manipulierte, gefälschte oder bloß eingefrorene Fremdobjekte.
- 100 echte Action-/Commit-Schritte: vollständige History-Gleichheit zum Vollpfad,
  No-op, Undo/Redo und gemeinsame Payloadidentität.
- Ungültige Geometrie, doppelte IDs, fehlende Referenzziele und geänderte Payloads
  werden auch mit Handles abgewiesen; fehlgeschlagener Commit verändert nichts.
- Unveränderte 10-MB-Projektgrenze gilt auch für einen registrierten Handle.

Praktische Abnahme: Pilot starten; Abschluss zeigt `equivalent: true` sowie
`sharedAsset: true` nur im Handle-Pfad. Die eigentliche CAD-UI nutzt den Pilot noch
nicht; an ihr ist in diesem Auftrag kein neues Verhalten zu erwarten.

## Genau ein nächster Auftrag

**K02c: Handle-Erzeugung an den gemeinsamen Bildimport-/Projektladegrenzen
integrieren.** Bestehendes Schema 9 und Größenlimits bewahren, Fremddaten weiterhin
vollständig prüfen. Danach Bild importieren → Linie/Wand ändern → Undo/Redo →
Speichern/Laden praktisch und automatisiert prüfen, einschließlich beschädigter
Dateien. Nach dem Laden Handles neu erzeugen, keine IDs/Hashes als Vertrauensbeweis
übernehmen. Keine Änderungen an jedem einzelnen Werkzeug, keine neuen Cache-
Varianten. Erst danach Commit-Serialisierung separat bewerten. Übrige K-/V-Ziele
und Shift-Diagnose bleiben offen.
