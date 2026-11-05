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

## L09 U1 – unterschiedliche Fußhöhen (02.11.2026)

Änderungskarte L09 mit den Empfehlungen freigegeben. Bisher verlangten Ecke und T-Anschluss gleiche Fußhöhen („Wandanschlüsse benötigen gleiche Fußhöhen“). Jetzt gilt:

| Fall                                                        | Jetzt                                                                                                                                          |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Ecke, gleicher Fuß und gleiche Höhe                         | Gehrung wie bisher                                                                                                                             |
| Ecke, eine Wand überdeckt die andere in der Höhe ganz       | Stumpfstoß: die überdeckende Wand läuft bis zur Außenfläche der anderen, die andere stößt an ihre Innenfläche (wie bisher bei ungleicher Höhe) |
| Ecke, Höhen überschneiden sich nur teilweise oder gar nicht | abgelehnt: „Eckanschluss: Eine Wand muss die andere in der Höhe ganz überdecken.“; beim Zeichnen kein automatischer Anschluss                  |
| T-Anschluss mit unterschiedlichem Fuß                       | erlaubt, solange sich die Wände in der Höhe überschneiden; die Nebenwand endet an der Hauptwand                                                |
| T-Anschluss ohne gemeinsame Höhe                            | abgelehnt: „Wandanschlüsse benötigen Wände, die sich in der Höhe überschneiden.“                                                               |

- Code: `cornerHeightRule` und `assertWallsOverlapVertically` in `src/domain/elements/wall/heights.ts`; `corner.ts` wählt die durchlaufende Wand nach Überdeckung statt nach Höhe; `connections.ts` verbindet beim Zeichnen nur Paare, die eine Ecke bilden können. Ein Anschlussknoten zählt die Wandenden an beiden Fußhöhen (`connections.ts`, `prepared-translation.ts`), sodass die Mehrfachanschluss-Prüfung auch über zwei Fußhöhen greift.
- Grundriss, 3D, IFC und Mengen folgen ohne eigene Änderung, weil sie aus denselben Konturen rechnen.

Nachweis U1: 1488 Tests grün (neu: Ecke mit Sockelwand gleich dem Stumpfstoß einer niedrigeren Wand, vertauschte Rollen, Teilüberdeckung abgelehnt, automatische Verbindung beim Zeichnen, 3D-Körper von 0 bis 2,8 m; angepasst: T mit anderem Fuß erlaubt, ohne gemeinsame Höhe abgelehnt), Typprüfung beider Projekte, Architektur, Lint, Formatierung sauber, 14-Modell-Prüfsumme unverändert (`e42aa36e…`), `benchmarks/junction-equality.ts` gegen main: 5 von 5 Modellen (Beispiel, Schulmodelle s/l/x, gebundene Höhen) mit identischen Konturen und Körpern.

Browser (Startprojekt): Wand mit mittiger Achse an das linke Ende von wall-1 gezeichnet → Gehrung (Konturen ±0,18). Neue Wand auf 2,0 m Höhe und 0,5 m Z-Versatz → Stumpfstoß: wall-1 läuft bis −0,18, die neue Wand beginnt an der Innenfläche +0,18. Z-Versatz 1,0 (1,0–3,0 m gegen 0–2,8 m) → Meldung „Eine Wand muss die andere in der Höhe ganz überdecken“. Eine Wand mit Achslage Außen am rechten Ende wurde als T-Anschluss erkannt; Z-Versatz 0,5 angenommen, Z-Versatz 3 (keine gemeinsame Höhe) → Meldung „… in der Höhe überschneiden“. 3D im Browser nicht eigens angesehen; der Körper ist durch den Test belegt.

Grenze: Nach einer abgelehnten Eingabe zeigt das Feld „Z-Versatz“ weiter den eingegebenen Wert, bis die Wand neu gewählt wird (bestehendes Verhalten des Eingabefelds).
