# Isolierter T-Anschluss: IFC-Abnahme

Stand 06.10.2026. Der separate Export dient der Abnahme; der normale
Export-Button erzeugt noch keine temporären T-Verbindungen.

## Dateien erzeugen und prüfen

Node mit Type-Stripping:

```
node --experimental-strip-types scripts/generate-t-ifc-fixtures.mjs <Ausgabeordner>
python scripts/validate-ifc.py <Ausgabeordner>
```

Python benötigt die bestehenden scripts/requirements-ifc.txt-Abhängigkeiten.
Generator: t-free.ifc, t-touch.ifc, t-touch-rotated.ifc plus Prüferwartungen
und Ausgangsprojekte. Projektdateien speichern keine T-Relation; nach Laden
kann dieselbe temporäre Vorschau ausgewählt werden, aber normaler IFC-Export
entspricht weiterhin den unverbundenen ursprünglichen Wänden.

## Abnahme in Archicad

Zuerst t-touch.ifc öffnen/importieren:

- Zwei Wände: Hauptachse 6 m, Nebenachse 3 m; beide 0,36 m stark, 2,80 m hoch.
- Hauptwand bleibt ungeteilt; Nebenkörper endet bündig an ihrer Fläche.
  Körperlänge der Nebenwand 2,82 m, Achslänge bleibt 3 m.
- Zwei Fenster je 1 x 1 m, Brüstung 0,90 m. Beide dürfen den Anschluss berühren.
- Grundriss und 3D auf fehlende Wandstücke oder Überlappung prüfen.
- Netto-Wandvolumen: Hauptwand 5,688 m³, Nebenwand 2,48256 m³,
  gesamt 8,17056 m³. IFC-Fenster sind semantische Elemente ohne erfundene
  Rahmen-/Glasgeometrie; Ausschnitte werden über echte Öffnungen abgebildet.

Danach optional t-free.ifc (Fenster mit Abstand) und t-touch-rotated.ifc
(gedreht/verschoben, gleiche Maße und Volumina) vergleichen.

## Technischer Nachweis

Domain t-solid ist die gemeinsame Quelle für Application-Vorschau und den
Interop-Adapter t-junction. Keine Abhängigkeit von Interop auf Application.
writeIfc erhält ausschließlich die beiden abgeleiteten lokalen Profile;
stabile GUIDs, Öffnungen, Zuordnung und übrige Elemente nutzen denselben Writer.
Tests sichern unveränderte Eingaben/Normalexport und Snapshot vor async Hashing.

IfcOpenShell 0.8.5 prüft alle drei Dateien mit Schema/EXPRESS, Hierarchie,
Beziehungen, Weltplatzierung, Profilvergleich und selbst errechneten Volumina.
Die Soll-Volumina im Generator sind analytisch vorgegeben und werden nicht aus
der getesteten Geometrieberechnung kopiert. Alle drei bestanden. Das ist noch
keine Archicad-Abnahme; diese erfolgt durch den Nutzer.
