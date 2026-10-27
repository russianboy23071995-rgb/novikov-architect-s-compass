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

## Schräge, mehrfache und Eck-T-Anschlüsse im normalen Export (27.10.2026)

Änderungskarte „Archicad-Abnahme der T-Anschlüsse“ mit den Empfehlungen freigegeben: Testdatei über den normalen Export, Prüfung in Node, Prüfliste für den Archicad-Import durch den Nutzer; ohne IfcOpenShell (Python auf dem Rechner nicht installiert, Download nicht gewünscht).

### Testdateien

```sh
node --experimental-strip-types scripts/generate-t-acceptance-ifc.mjs <ausgabeordner>
```

- `NOVIKOV-T-Anschluss-Test.ifc`: alle neun Varianten nebeneinander, je 40 m Abstand entlang x (Wandnamen mit Präfix der Variante, z. B. `t-30-N`).
- `t-90.ifc` … `t-ecke-120.ifc`: je eine Variante (Wandnamen `H`, `N`, `S`, `E`).
- `erwartete-werte.json`: erwartete Werte je Wand, unabhängig von der Wandableitung des Programms gerechnet.

Die Modelle entstehen über die normalen Aktionen des Programms (Wand anlegen, T verbinden, Fenster setzen) und den normalen IFC-Export (`exportIfc`) – derselbe Weg wie beim Speichern einer IFC-Datei im Programm. Modelle: `benchmarks/t-ifc-acceptance.ts`.

Alle Wände 3,00 m hoch; Hauptwand (H, E) 0,30 m, Nebenwand (N, S) 0,24 m dick, zentriert. Fenster 1,00 × 1,20 m, Brüstung 0,90 m.

| Variante (x-Versatz)               | Aufbau                                                           | Kontaktbreite N auf H        | Grundrissfläche / Nettovolumen                                      |
| ---------------------------------- | ---------------------------------------------------------------- | ---------------------------- | ------------------------------------------------------------------- |
| T 90° (0)                          | H 30 m entlang x; N 8 m, trifft H-Achse bei x = 5                | 0,240 m                      | H 9,000 m² / 26,640 m³; N 1,884 m² / 5,364 m³                       |
| T 60° (40)                         | wie oben, N unter 60°                                            | 0,277 m                      | N 1,8784 m² / 5,3473 m³                                             |
| T 45° (80)                         | N unter 45°                                                      | 0,339 m                      | N 1,8691 m² / 5,3193 m³                                             |
| T 30° (120)                        | N unter 30°                                                      | 0,480 m                      | N 1,8480 m² / 5,2560 m³                                             |
| T 15° (160)                        | N unter 15°                                                      | 0,927 m                      | N 1,7809 m² / 5,0547 m³                                             |
| T 5° (200)                         | N unter 5°                                                       | 2,754 m (Mitte bei x ≈ 6,72) | N 1,5069 m² / 4,2328 m³                                             |
| T 90° in Wandmitte (240)           | H 10 m; N 4 m bei x = 5                                          | 0,240 m                      | H 3,000 m² / 8,640 m³; N 0,924 m² / 2,484 m³                        |
| T von beiden Seiten (280)          | H 10 m ohne Fenster; N von oben bei x = 4, S von unten bei x = 7 | je 0,240 m                   | H 3,000 m² / 9,000 m³; N, S je 0,924 m² / 2,484 m³                  |
| T an Hauptwand mit 120°-Ecke (320) | H 10 m, am Anfang 120°-Ecke mit E (4 m, 0,30 m); N bei x = 5     | 0,240 m                      | H 3,000 m² / 9,000 m³; E 1,200 m² / 3,600 m³; N 0,924 m² / 2,484 m³ |

Bei den Winkelvarianten hat H ein Fenster bei x = 20 und N ein Fenster 2 m vom freien Ende; bei „Wandmitte“ H bei 2 m, N bei 1,6 m vom freien Ende.

### Prüfung in Node (`src/application/walls/oblique-t.test.ts`)

Die IFC-Datei wird zurückgelesen (Platzierungen, Profile, Extrusion, Öffnungen) und je Variante sowie für die Sammeldatei geprüft:

- Jedes Wandprofil ist Punkt für Punkt die Grundrisskontur des Programms; Extrusion 3,00 m.
- Grundrissfläche = erwartete Fläche aus Achslänge und Dicke (bei T: Achslänge bis zur Hauptwandfläche, t_H/2/sin α vor der Hauptwandachse), nicht aus der Ableitung.
- Nebenwand und Hauptwand überlappen sich nicht (Schnittfläche < 10⁻⁹ m²) und berühren sich entlang einer Kante (mindestens zwei Punkte auf dem Hauptwandrand) – kein Spalt; ebenso die 120°-Ecke E/H.
- Jede Öffnung hängt an ihrer Wand, Breite/Höhe/Tiefe wie Fenster bzw. Wanddicke.
- Gegenproben: 5 cm in die Hauptwand verschoben wird als Überlappung erkannt, 5 cm abgerückt als fehlende Berührung; die naive Fläche (Achslänge × Dicke) passt nicht.

Ergebnis: alle Varianten und die Sammeldatei bestanden. Produktcode unverändert (nur Test, Modelle und Skript); der normale Export ist damit unverändert.

### Praktischer Archicad-Test (durch den Nutzer)

`NOVIKOV-T-Anschluss-Test.ifc` in einem separaten Testprojekt importieren und je Variante prüfen:

1. Grundriss: Nebenwand schließt ohne Spalt an die Hauptwandfläche an; keine überlappenden Wandkörper; beim schrägen T verläuft die Anschlusskante auf der Hauptwandfläche mit der Kontaktbreite der Tabelle.
2. 3D: keine Durchdringung; alle Fensteröffnungen durchgehend (17 Fenster).
3. „T von beiden Seiten“ und „120°-Ecke“: beide Anschlüsse geschlossen, die Gehrung E/H ohne Spalt.
4. Bauteilinformationen: Wandnamen/SourceId, Dicke, Höhe; wenn Archicad Volumen anzeigt, mit der Tabelle vergleichen.
5. Importversion, IFC-Übersetzer und ob die Wände als native Wände oder als Körper ankommen notieren.

Die Prüfung in Node ersetzt den Import nicht.

### Befund nebenbei

Der normale Export schreibt in den Dateikopf `FILE_DESCRIPTION('NOVIKOV CAD corner acceptance test - explicit temporary pair')`, sobald verbundene Wände Profile liefern – also bei jedem Projekt mit Wandanschlüssen. Text aus der früheren Eck-Testausgabe; ohne Einfluss auf die Geometrie. Bewusst nicht geändert (Export soll in diesem Auftrag unverändert bleiben); eigener kleiner Auftrag.

### Grenzen

- Keine IFC-Anschlussbeziehungen (`IfcRelConnectsPathElements`); Wände sind Profil-Extrusionen.
- Keine IfcOpenShell-Prüfung in diesem Auftrag.
- Automatisch beim Zeichnen erzeugte T-Anschlüsse speichern dieselbe Verbindung wie „T verbinden“; sie sind daher nicht eigens enthalten.

### Nutzerabnahme Archicad

Ausstehend.
