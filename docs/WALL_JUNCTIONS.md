# Wandanschlüsse (26.10.2026)

Änderungskarte „Wandanschlüsse“ mit den Empfehlungen freigegeben: W1–W3 jetzt, schräge T-Anschlüsse später; Ecke mit unterschiedlicher Höhe als Stumpfstoß (höhere Wand läuft durch), Ecke mit unterschiedlicher Stärke als schiefe Gehrung über die Flächenschnittpunkte; Schulmodell auf realistische Anschlüsse umgestellt.

## Regeln

| Fall                                                 | Vorher    | Jetzt                                                                                                                                |
| ---------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| T mit unterschiedlicher Wandstärke/Höhe              | abgelehnt | erlaubt: Nebenwand endet an der Seitenfläche der Hauptwand, jede Wand behält ihre Höhe                                               |
| Ecke mit unterschiedlicher Wandstärke                | abgelehnt | erlaubt: schiefe Gehrung durch die Schnittpunkte der Innen- und Außenflächen                                                         |
| Ecke mit unterschiedlicher Höhe                      | abgelehnt | erlaubt: Stumpfstoß – die höhere Wand läuft bis zur Außenfläche der niedrigeren, die niedrigere stößt an die Innenfläche der höheren |
| T an beiden Enden einer Wand                         | abgelehnt | erlaubt                                                                                                                              |
| T an einem Ende, Ecke am anderen                     | abgelehnt | erlaubt                                                                                                                              |
| Wand zugleich Haupt- und Nebenwand                   | abgelehnt | erlaubt                                                                                                                              |
| zwei Anschlüsse an demselben Wandende                | abgelehnt | weiterhin abgelehnt („Ein Wandende darf nur einen Anschluss haben“)                                                                  |
| zwei Wände gegenseitig T-angeschlossen               | –         | abgelehnt                                                                                                                            |
| überlappende T-Kontakte auf derselben Hauptwandseite | abgelehnt | weiterhin abgelehnt                                                                                                                  |
| gleiche Fußhöhe beider Wände                         | Pflicht   | weiterhin Pflicht                                                                                                                    |
| schräger T-Anschluss                                 | abgelehnt | weiterhin abgelehnt (eigener Auftrag)                                                                                                |
| Mehrfachknoten (3+ Achsenden an einem Punkt)         | abgelehnt | weiterhin abgelehnt                                                                                                                  |
| T-Hauptwand mit schräger Ecke                        | abgelehnt | weiterhin abgelehnt                                                                                                                  |

Die strenge rechtwinklige Ecke für die Einzel-/IFC-Abnahme (`deriveRightAngleCorner`) und die Einzelvorschau eines T-Paars (`resolveIsolatedTPair`) bleiben auf isolierte Paare gleicher Maße beschränkt; sie stellen andere Anschlüsse nicht dar.

## Umsetzung

- **W1** `application/commands/failure.ts`: Wand- und Fensterbefehl melden die verletzte Regel statt pauschal „das Fenster muss in die Wand passen“; englische Öffnungsmeldungen der Modellprüfung erhalten ihre deutsche Fassung.
- **W2** `domain/elements/wall/t-junction.ts` (Maßgleichheit entfällt), `domain/elements/wall/corner.ts` (`buttCorner` für unterschiedliche Höhen; Gehrung bei unterschiedlicher Stärke unverändert über die Flächenschnittpunkte).
- **W3** `domain/elements/wall/t-relations.ts`: Jedes Wandende trägt höchstens einen Anschluss. Ein T-Anschluss schneidet nur sein Ende (Ringindizes 0/3 für Anfang, 1/2 für Ende) des vorhandenen Rings zu – Eckring, Ring einer früheren T-Zuschneidung oder Wandkörper; der zusammengesetzte Ring wird als einfaches Polygon mit positiver Fläche geprüft. Wandkette: nur ein T am Ende der letzten Wand beendet die Kette.

## Nachweis

- `src/application/walls/junctions.test.ts`: alle neuen Fälle mit Lagen der Konturpunkte und Gegenproben.
- `benchmarks/junction-equality.ts`: alle bisher gültigen Modelle (Beispiel, Schulmodelle s/l/x, gebundene Höhen) behalten Konturen und Wandkörper exakt (Vergleich gegen den Stand vor der Änderung), Gegenprobe greift.
- Schulmodell mit 24-cm-Trennwänden (T an Fassade und Flur) und Flurwänden mit T an beiden Giebeln: 24 T-Anschlüsse je Geschoss; IFC-Export 80 Wände, 180 Öffnungen, 60 Türen; Browser-Schullauf s alle 34 Schritte fehlerfrei; Schullauf l 33 von 34 – „Tür setzen“ scheitert (siehe Grenzen).
- 1261 Tests, Typen, Architektur-Check, Lint.

## Grenzen

- **Befund Tür setzen bei kleinem Maßstab:** Im Schullauf l (ganzer dreiflügeliger Bau im Bild, etwa 0,12 m je Bildpunkt) trifft der Klick die 24-cm-Trennwand nicht; die Platzierung meldet „Zum Platzieren eine sichtbare Wand anfahren.“ Ursache: `findOpeningHost` verlangt, dass der Punkt im Wandkörper liegt (halbe Wandstärke), ohne Bildschirmtoleranz – eine 24-cm-Wand ist hier knapp 2 Bildpunkte breit. Mit 30 cm traf der Lauf vorher, bei s (größerer Maßstab) trifft er weiterhin. Keine Folge der Anschlussänderung, sondern eine bestehende Bedienlücke, die dünne Wände sichtbar machen (eigener kleiner Auftrag: Treffertoleranz in Bildpunkten – mit PR466 behoben, Schullauf l danach 34/34).

- Schräge T-Anschlüsse, Mehrfachknoten und gemeinsames Ändern von Wandgruppen bleiben eigene Aufträge.
- Der IFC-Export schreibt weiterhin keine Anschlussbeziehungen (IfcRelConnectsPathElements); die Wandkörper tragen die zugeschnittenen Konturen. Archicad-Abnahme der T-Anschlüsse steht weiterhin aus.
- Bei einer Ecke mit unterschiedlicher Höhe steht die Gehrungsfläche nicht mehr zur Verfügung; die Fuge liegt auf der Innenfläche der höheren Wand.
