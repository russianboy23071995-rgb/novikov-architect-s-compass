# K01: große Punktmengen einpassen — 08.10.2026

## Übernommene Abstimmung

Die Übergabe aus „Systemarchitektur planen“ einschließlich V01–V09 wurde gelesen
und mit dem Code abgeglichen. PR179 inklusive Planung auf Kopf 4e503fe hatte grüne
CI und wurde nach Nutzerfreigabe zusammengeführt; Basis dieses Fixes main 68ef359.
Der konkrete Absturz hat Vorrang vor weiterer React-Feindiagnose. Diese bleibt offen.
Die Vorgaben zu gemeinsamem Modell, zentralen Aktionen und getrennten Ansichten
passen zu den neuen Funktionen. Ein größeres Dateilimit ohne Speicherprüfung ist
keine tragfähige Kapazitätsstrategie.

## Fehler und begrenzte Änderung

Der originale planBounds-Aufruf wurde mit einem vollständig validierten Projekt
von 20 Polylinien à 10.000 Punkten reproduziert: RangeError / Maximum call stack
size exceeded an Math.min(...extents.map(...)). Bestehende kleine Tests bestanden.

planBounds akkumuliert jetzt vier Grenzwerte beim Durchlaufen der Elemente.
Keine punktgroße Extent-Liste oder Argumentliste mehr; konstanter zusätzlicher
Speicher bezüglich der Punktzahl. wallBody wird einmal pro Wand abgeleitet.
Bestehender Wand-/Achsenumfang, SVG-Y-Umkehr, 1,5-m-Rand und Leeransicht bleiben
unverändert. Linien, Schraffuren und gedrehte Referenzen werden weiter berücksichtigt.
Keine Änderung an Dateilimit, Geometrievalidierung, History oder Renderer.

## Nachweise

- Regression: validierte 200.000-Punkt-Fixture; exakte Bounds und Datei-Roundtrip.
- Gemischter Test: Wand/Fenster, Linie, Schraffur und gedrehte Bildreferenz.
- Bestehende Leer-/Wandstärken-/diagonale Fälle bleiben erhalten.
- 656 Tests, Produkt-/Diagnose-TypeScript, Build bestanden; Lint 0 Fehler,
  6 bekannte Warnungen.
- Portable Fixture: 3.909.462 UTF-8-Bytes, unter bestehendem 10-MiB-Limit.
- Browser: Load 200k points, Zoom in, Fit view erfolgreich. 20 sichtbare
  Polylinienpfade; Bounds -501.5 -192.5 1002.9 194. Eingepasste SVG-ViewBox
  -501.5 -271.4683947840146 1002.9 351.9367895680292 enthält die komplette Fixture.
  Browser-Werkzeugabfragen liefen während des anfänglichen Ladens zeitweise in
  ein Timeout; danach war Loaded sichtbar und Zoom/Fit bedienbar. Das ist kein
  Nachweis verzögerungsfreien Ladens oder genereller 200k-Punkt-Interaktivität.

Reproduktion: npm run benchmark:browser; /benchmarks/browser.html;
„Load 200k points“, danach vergrößern und „Fit view“. Der Loader verwendet denselben
validierten Generator wie der Regressionstest. Andere Profilknöpfe sind für ihre
bisherigen Wand-Fixtures vorgesehen; diese Punkt-Fixture dient der Einpassprüfung.

## Zusätzlich beobachtete Grenze

Die erste Fixture war etwa 10 km breit. Der bestehende Mindestzoom von 0,1 px/m
kann in einem schmalen Canvas nicht ihre gesamte Ausdehnung zeigen. Das ist
unabhängig vom beseitigten Argumentlisten-Absturz. Die endgültige Fixture verwendet
dieselben 200.000 Punkte auf rund 1 km Breite und bleibt im unterstützten Zoom.
Die Ausdehnungs-/Mindestzoomgrenze ist in K03 aufzunehmen, nicht als behoben melden.

## Genau ein nächster Auftrag

K03: einen reproduzierbaren Kapazitäts-Baselinebericht mit bestehenden Fixtures,
verbundenen Wandgruppen und mehreren PNG/JPEG-Referenzen erstellen. Element-/Punktzahl,
Dateibytes und Bildpixel getrennt erfassen; Import/Platzierung/Commit, 1/10/50/100
History-Stände, Speichern/Laden, IFC und 2D/3D getrennt messen. Speicherwerte als
Messung oder Schätzung klar kennzeichnen; Ausdehnung und Mindestzoom mit erfassen.
PDF-Import ist noch nicht vorhanden. Daraus genau einen begrenzten Folgeauftrag
ableiten, bevor Dateilimit, Assetvertrag oder History verändert werden. Neue
Produktfunktionen und die kleine Shift-React-Diagnose bleiben im Plan erhalten.
