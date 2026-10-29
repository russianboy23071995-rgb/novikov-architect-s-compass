# Dach als Bauteil (N61, AUFGABENLISTE L04)

Einflächiges Steildach. Kein Walmdach, keine Dachlandschaft, kein automatisches Trimmen von Wänden (N62, V09). Umsetzung in fünf PRs nach freigegebener Änderungskarte (29.10.2026).

| PR  | Inhalt                                                                                                                    | Stand    |
| --- | ------------------------------------------------------------------------------------------------------------------------- | -------- |
| D1  | Modell, Flächen- und Ringgeometrie, Prüfung, Aktionen, Schema 31 mit Migration                                            | erledigt |
| D2  | geschlossener 3D-Körper, Auswahl/Fang in 3D, Mitwandern bei Geschosshöhe                                                  | erledigt |
| D3  | Werkzeug (Polygon, Diagonale, Seite + dritter Punkt, Kontur), Leiste und Doppelklick-Fenster, Eigenschaften, Umriss, Undo | offen    |
| D4  | Grundriss im eigenen Geschoss: Schnitt bei 1 m kräftig, darunter dünn, darüber gestrichelt (Untersicht)                   | offen    |
| D5  | Datei/Recovery, IFC mit Archicad-Testdatei, Browser-Abnahme, Leistung im Schulmodell                                      | offen    |

## Nutzerentscheidungen (29.10.2026)

- **Bezugslinie und Höhe:** Der Nutzer zieht im Grundriss zuerst die Bezugslinie (zwei Punkte) und wählt die Seite, zu der das Dach ansteigt. Die Bezugshöhe beginnt mit 0,00 über dem eigenen Geschoss und ist später änderbar. Sie meint die **Unterseite** des Dachs an der Bezugslinie (Bezug für spätere Höhenlinien unter der Dachschräge, N33/N34).
- **Stärke:** senkrecht zur Dachfläche; die Oberseite liegt Stärke / cos(Neigung) über der Unterseite.
- **Umriss:** der **äußere Dachrand, von oben gesehen**. Bei nicht senkrechtem Abschluss liegt die innere Kante der Abschlussfläche weiter innen; nichts ragt über den gezeichneten Umriss hinaus.
- **Abschlüsse:** Traufe (Kante parallel zur Bezugslinie, Dach steigt nach innen) und obere Kante (parallel, Dach fällt nach innen) jeweils „vertikal“, „rechtwinklig zur Dachfläche“ oder „horizontal“; alle anderen Kanten (Ortgang, schräge Kanten) vertikal. „Horizontal“ gibt es nur an diesen parallelen Kanten.
- **Geschosshöhe:** Das Dach gehört genau einem Geschoss; ändert sich die Höhe eines Geschosses darunter, wandert es mit. Die Höhe des eigenen Geschosses ändert das Dach nicht.
- **Darstellung (D4):** nur im eigenen Geschoss, Schnittebene 1,00 m über dem Geschossboden. Andere Geschosse zeigen das Dach vorerst nicht (Gast-Anzeige N62/L02). Der heutige Grundriss ist kein echter Schnitt (Fenster werden unabhängig von der Brüstung gezeigt); die 1-m-Ebene gilt nur für das Dach.
- **Trimmen (später, V09):** Die Wand hält einen Trimmverweis auf das Dach; der Schnitt wird jeweils aus dem aktuellen Dach abgeleitet. „Trimmung aufheben“ entfernt den Verweis (Masterplan §8).

## Teil D1: Modell und Geometrie

Beispiel (Bezugslinie auf der X-Achse, Steigung nach +Y, 45°, Stärke d = 0,20 m, Bezugshöhe h):

- Unterseite z(y) = Geschosskote + h + y · tan 45°; Oberseite 0,20 / cos 45° = 0,283 m darüber.
- Zwei Meter von der Bezugslinie entfernt liegen Unter- und Oberseite je 2,00 m höher.

Abschlüsse an der Traufe (Umriss bei y = 0):

| Abschluss    | Oberseite endet bei | Unterseite endet bei  | Fläche                          |
| ------------ | ------------------- | --------------------- | ------------------------------- |
| vertikal     | y = 0               | y = 0                 | senkrecht, 0,283 m hoch         |
| rechtwinklig | y = 0               | y = d · sin = 0,141 m | rechtwinklig zur Fläche, 0,20 m |
| horizontal   | y = 0               | y = d / sin = 0,283 m | waagerechte Untersicht          |

An der oberen Kante umgekehrt: Die Unterseite endet am Umriss, die Oberseite um d · sin bzw. d / sin weiter innen. Reicht die Tiefe des Dachs für die Versätze nicht, meldet das Programm „Das Dach ist für die gewählten Abschlüsse zu schmal …“ statt einen falschen Körper zu bilden.

Umsetzung:

- `src/domain/elements/roof/geometry.ts`: `roofFrame`, `roofUndersideAt`, `roofTopAt` (Höhen über dem Geschossboden), `roofFaceRings` (Grundrissringe von Ober- und Unterseite gegen den Uhrzeigersinn, Kantenrollen Traufe/obere Kante/Ortgang, Versatz je Kante mit Schnitt der versetzten Kantenlinien, Prüfung auf gültige, nicht umgeklappte Ringe).
- `src/domain/elements/roof/model.ts`: `roofSchema` (Schema 31; jedes gespeicherte Dach ergibt einen gültigen Körper), `ROOF_DEFAULTS` (35°, 0,24 m, Bezugshöhe 0, vertikale Abschlüsse), `roofStoreyElevation` (Geschosskote, nie gespeichert).
- `src/application/roofs/actions.ts`: `addRoof` (Standardebene Dach), `updateRoof` (eine geprüfte Änderung; ungültig = Projekt unverändert).
- Schema 31 (`roofs` je Geschoss, optional), Registry `roof`, Migration 30 → 31 (Dateien ohne Dächer; eine untergeschobene Dachliste in einer 30er Datei wird abgelehnt). Schema 29 lädt direkt nach 31.
- In der Oberfläche ist ein Dach in D1 nicht auswählbar; Bearbeitungsaktionen schließen es ausdrücklich aus, bis D3 sie anbietet.

Nachweis: Tests in `src/domain/storeys/heights.test.ts` (Prüffall 45°, Steigseite und Linienrichtung, alle Abschlüsse gegen von Hand gerechnete Werte inkl. Länge und Rechtwinkligkeit der Abschlussfläche, L-Form, Umlaufsinn, zu schmal, ungültige Eingaben, Aktionen, Ebene, Geschosshöhe EG/OG) und `src/interop/project-file/load.test.ts` (Migration 30 → 31 inkl. gebundener Wände ohne gespeicherte Höhe, untergeschobene Dächer, Speichern/Laden mit Dach). IFC-Export der Decken-Testdatei byteweise unverändert. 1358 Tests grün.

Befund beim Nachweis: Der Migrationsschritt 30 → 31 musste die abgeleiteten Höhen gebundener Wände wie die Schritte 26–28 vor der Endprüfung entfernen (`withoutBoundHeights`); ohne diesen Schritt hätten echte 30er Dateien mit gebundenen Wänden nicht geladen.

## Teil D2: 3D-Körper

- `src/rendering/viewport/roof-solid.ts` (`roofBody`): geschlossener Körper aus den Ringen von D1. Ober- und Unterseite liegen auf ihren geneigten Ebenen (Ohrenschneiden für nicht konvexe Umrisse), je Umrisskante eine ebene Viereckfläche (Ortgang senkrecht, Traufe und obere Kante nach Abschluss). Volumen über den Gaußschen Satz aus der geschlossenen Hülle.
- Im Geschossteil nach den Decken (`storey-solid.ts`); Höhen nur aus Geschosskote und eigenen Dachwerten, also gilt jeder bisherige Geschoss-Zwischenspeicher weiter (A08). Geschosse nur mit Dach erhalten einen Körper.
- Dachflächen tragen `roof`: eigene warmgraue Farbe, Darstellungsvorrang wie die Decke (C3 Variante A), nicht im Wandfuß-Fang; Auswahl per Klick in 3D wählt das Dach, Hervorhebung wie bei Wand und Decke. Dachecken sind wie Deckenecken 3D-Bewegungsecken.
- Bis D3: Kontextmenü zeigt beim Dach nur „Löschen“ (Löschen läuft generisch über die Registry, Undo inklusive). Verschieben einer Auswahl mit Dach meldet „Dächer lassen sich noch nicht verschieben …“ statt das Dach still zu übergehen; Z-Bewegung nimmt ohnehin nur Wände/Fenster.
- Grundriss-Fangpunkte an Dachecken kommen mit D4, wenn der Grundriss das Dach zeichnet.

Nachweis: Test in `src/rendering/viewport/working-storey-solid.test.ts` (Hülle geschlossen und gleichsinnig orientiert für Rechteck, rechtwinklige Abschlüsse und L-Form; Volumen gegen 16 · d/cos bzw. 4 · d · (4 − d·sin)/cos; tiefster/höchster Punkt im OG; horizontale Traufe als nach unten weisende waagerechte Fläche; EG-Höhe hebt das Dach, eigene Geschosshöhe nicht; Vorrang und Farbe; Auswahl von oben trifft das Dach; Verschieben gesperrt). Gleichheits-Hash der 14 Modelle (Geschossteile, Gebäudekörper, IFC) unverändert `09528ac4…7823253`. 1359 Tests grün. Browser: Projektdatei mit Pultdach (20°, Traufe horizontal, obere Kante rechtwinklig) über den normalen Ladedialog geöffnet; Dach in 3D auf OK Rohfußboden OG, Klick wählt und hebt es hervor, Menü „Dach · Löschen“, Löschen und Undo; keine Konsolenfehler. Aufgefallen: Der Ladedialog zählt Dächer noch nicht (D5).
