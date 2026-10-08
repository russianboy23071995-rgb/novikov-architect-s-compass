# Funktionsquelle vom 8. Oktober 2026

Texttranskription der am 08.10.2026 hochgeladenen Datei `FUNKTIONEN 03.10.2026.docx`. Der Dateiname trägt weiterhin den 03.10.; die Quelle dieses Ergänzungsstands ist der Upload vom 08.10. Absätze entsprechen der DOCX-Reihenfolge; leere Absätze sind ausgelassen. Es wurde keine frühere DOCX-Version als Vergleich herangezogen.

SHA-256 der DOCX: `8b9ed3ff6a61952042093167382f7927fb4dc62f15ef92fa58533646a9fcd3e2`.

Die folgende Transkription bewahrt den Wortlaut. Bestehende Präzisierungen aus ARCHITECTURE.md gelten weiter, insbesondere das Skalierverbot für BIM/3D und die zusätzlich erlaubte PNG/JPEG-Kalibrierung. Die Einordnung und Reihenfolge steht in [der Entwicklungsabstimmung](../planning/DEVELOPMENT_ALIGNMENT_2026-10-08.md).

## Absatz 1

Funktionen von NOVIKOV CAD:

basierend auf ein 3D Modell, aufgebaut als BIM soll diese Software im Grund komplexe geometrische Entwürfe herstellen, und sowohl als PDF-Pläne, 3D Modelle, oder IFC Modelle, DXF etc. exportieren können. Der Nutzer hat die Möglichkeit, das Design der 3D und 2D Darstellungen zu ändern (z.B. Darstellung der wände in Form von Schraffur oder Farbe), Die Fähigkeit, den Maßstab des Canvas zu ändern, so wie der Grundrisspläne, Schnitte, Ansichten etc.
Das Programm hat die Fähigkeit, Mittels Schnitt oder Ansichtswerkzeugen, entsprechende Schnitte bzw. Ansichten zu generieren und vom Model abzuleiten, als 2D Dokumente, welche ebenfalls bearbeitet werden können. Also alle zeichnungen, werden vom 3d Model abgeleitet.

## Absatz 2

Die Rasterengine soll aber auch in 3D Fenster funktionieren. Denn das Modell kann auch in 3D bearbeitet werden. Dort käme zu den Rastern jegliche Hilfsflächen hinzu. (X Y Z achsen).

## Absatz 4

Um die Entwicklung des 3D Modells zu vereinfachen, gibt es hochqualitative Rastersysteme und Hilflinien on demand, die sogenannte Rasterengine. Um die Bedienbarkeit weiterhin zu vereinfachen, wird ein „On Demand Menü“ hinzugefügt.
Dieses Menü popt im Canvas auf, sofern ein Element ausgewählt wird und lässt sich, wie bereits vorhanden - bewegen. Darin befinden sich die Buttons für die folgenden Funktionen:
1.Gesamtes Element bewegen 

## Absatz 5

2.Einzelnen Punk erstellen und Bewegen [falls punkt an der Stelle vorhanden, dann lediglich Punkt bewegen] das ist sowie „linie Knicken“ geknickt kann eine Rechteckseite werden -> wird zu fünfeck. Oder eine Linie -> wird zu Linie mit knick

## Absatz 6

3.verschieben/ Verbreitern einer ganzen Seite eines 2D Elements (Z.B. bei einem Rechteck, man wähle dir obere Kante, und verschiebt diese nach oben oder unten, dabei verändert sich die Höhe des Rechtecks. Diese Funktion ist bei jeglichen Seiten von Polygonen, Dreiecken, Rechtecken, etc. Für Linien kommt es selbstverständlich nicht zum Einsatz.

## Absatz 7

Eine zuvor ausgewählte Funktion bleibt wird vorgemerkt, und beim nächsten Öffnen des Menüs bereits aktiv, sofern die ausgewählte Geometrie diese Funktion nutzen kann.

## Absatz 9

Canvas hat einen Maßstab, Grundriss auch. Dieser kann in dem Leisten ganz unten geändert werden. Jegliche Wände, Schraffuren, Texte, Linien, Kreise, Möbeldarstellungen oder sonst welche Dinge sollen alle einer Ebene hinzugefügt werden. Die genannten Ebenen sollen mit Hilfe eines Ebenen Umschalters jederzeit sichtbar und unsichtbar geschaltet werden. Der Ebenen Umschalter erlaubt auch Funktionen wie „Alle außer diese Ebenen“ unsichtbar machen, oder eben andersrum. Außerdem sollen ALLE ebenen ausgeblendet und wieder eingeblendete werden können.


## Absatz 10

Idealerweise lässt sich das Programm mit Hilfe einer AI sowie Spracheingabe bedienen. Dies soll der wichtigste Indikator der Software sein. Das Zeichnen von Wänden, hinzufügen von Türen, Fenstern, decken und Dächern, sowie das anschließende Vermaßen soll langfristig durch Spracheingabe oder Texteingabe zuverlässig funktionieren können.

## Absatz 12

Das Modell wird einer Gebäudestruktur zugeordnet. Der Nutzer kann über den Navigator Anzahl der Geschosse frei erstellen, sowie die Höhenpunkte dieses Definierens. 

## Absatz 13

Wände, Stützen, oder sonstige Bauteile, welche in der Höhe eines geschosses gebaut werden können, wissen somit die Geschosshöhe, des Geschosses, in dem Sie sich befinden. 

## Absatz 14

Das Gesamte Programm ist zunächst auf Deutsch. Jegliche Einheiten in Metern.

## Absatz 15

Es gibt ein Skallierwerkzeug, welches vorhandene Elemente anhand einer gezeichneten Linie in der Größe proportional skalieren lässt.

## Absatz 16

Um komplexe 3D-Modelle erstellen zu können, werden Boolische Operationen eingefügt. Wände können nach beliebig geschnitten und ausgespart werden.

## Absatz 17

Hochgeladene PDF-Dateien sollen in 2d Elemente zerlegt werden können.

## Absatz 18

Anpassungen am Modell sollen entweder in 2D am Grundriss, in der Ansicht, im Schnitt, oder aber auch in 3D ausgeführt werden. (z.B. Verschieben der Wände, verschieben der Fenster, Löschen von Elementen, etc. 

## Absatz 19

Raumwerkzeug zum Definieren von „Räumen“ innerhalb von geschlossenen oder teil umschlossenen Wandflächen. Räume haben die folgenden Eigenschaften: Namen, eindeutige ID (beginnend mit R-001), einem Namen, eine Fläche. 

## Absatz 20

Das Raumwerkzeug erkennt die lichten Raumhöhen und erkennt die „Höhenlinien“, welche ebenfalls im Raumeigenschaften Fenster erstellt werden können. Die Höhenlinien erkennen „an dieser Stelle im Raum beträgt die Raumhöhe x,xx m“ Dabei können die beiden Messpunkte definiert werden. 

## Absatz 21

Beispiel: Messpunkt 1: Oberkante Fußboden Dachgeschoss

## Absatz 22

Messpunkt 2: Unterkante Dachschräge.

## Absatz 23

Daraufhin kann die korrekte Wohnflächenberechnung inkl. Abzüge aufgestellt werden.

## Absatz 25

Erkennen von Raumflächen, und daraus eine Wohnfläche nach Wo-FIV erstellen. (Türnischen, Schornsteinabzüge, Vorbauwände etc. korrekt beachten.) Erstellen eines Wohnflächenberichts nach einer Vorlage. PDF, Variablen: Geschossanzahl, Raumzahl, Name, Adresse. Darstellung eines Rechenweges.

## Absatz 26

Hilfswerkzeug: Raum (Definition im gesonderten Punkt) (Raumwerkzeug: Zuordnung zur Ebene: Raum)

## Absatz 28

2D-Tool, als Rechteck, Polygon, etc. welches für Design, Schraffur, Verzierung, etc. verwendet werden kann. (Zuordnung zur Ebene 2D-Ergänzungen)

## Absatz 29

Eigenschaften: Farbe ja oder nein, Kontur ja oder nein, Farbe Deckkraft frei wählbar, oder anstelle Farbe Muster, wie z.B. Mauerwerksschraffur.

## Absatz 31

Differenzieren jeglicher Zeichenwerkzeuge
1. Wandwerkzeug Auswahl -> öffnen der Funktionen im Eigenschaftenpanel: da kann ausgewählt werden wie dick eine wand ist, ob diese die Geschosshöhe, oder alternative Höhe aufweist (änderbar), ob diese eine Monolithische Wand ist, oder ob diese aus verschiedenen Schichten besteht (Schichten müssen auch auswählbar oder selbstherstellbar sein.)
Es kann auch ausgewählt werden, ob per Wandwerkzeug Auswahl nur eine Wand gezeichnet wird, oder ob dieses Werkzeug mit jedem Klick wände zeichnet, so lange bis mit einem doppelklick der Abschluss signalisiert wird.

## Absatz 32

Wände, die einander berühren, z.B. Ecken oder „T“ Kreuzungen, müssen dementsprechend richtig dargestellt werden.

## Absatz 33

Eine Jede Wand bekommt eine Hauptachse, an der Sich jeder wand ausrichtet. Diese Hauptachse kann von außen nach innen verlagert werden -> im Eigenschaftenmenü.

## Absatz 35

Bemaßung: Wände, Fenster, alles kann und muss bemaßt werden können. Einn maßkettenwerkzeug wird, wenn es so weit ist, detailliert ausgearbeitet. (Zuordnung zur Ebene Bemaßung)

## Absatz 37

Deckenwerkzeug: ebenfalls wie Wand, Aufbau aus schichten möglich, Auswahl Material und Darstellung, anpassen d. Höhe, stärke. Öffnung kann auch eingefügt werden, als Deckendurchbruch. (Zuordnung zur Ebene Decke)

## Absatz 38

Textwerkzeug: Texte schreiben, Hochschreibweise für Zahlen, Farbauswahl, Größenauswahl, Schriftartauswahl, Fett, kursiv, Unterstrichen, Umrandung möglich inkl. Farbauswahl, Hintergrundfläche mit Farbauswahl. (Zuordnung zur Ebene Textelemente) 

## Absatz 39

Filter: Das aktive Suchen von Elementen. Z.B auswählen aller Schraffuren, aller Wände, aller Decken, oder aller Schraffuren, welche die Farbe XX haben (Pipetten Werkzeug zur Auswahl ergänzen im Menü.

## Absatz 41

ALLGEMEINES: Die Eigenschaftenleiste unterhalb des Menüs zeigt immer die Eigenschaften vom ausgewählten Werkzeug.

## Absatz 42

Bedeutet: Ich wähle das Wandwerkzeug aus, und im genannten Menü erscheinen jegliche Eigenschaften, welche ich anpassen kann, bevor ich anfange zu zeichnen. Ebene, Stärke, Höhe, Material, Darstellung etc.
Dasselbe Menü erscheint auch, wenn ich eine bereits gezeichnete Wand anklicke, nur halt mit den Eigenschaften der spezifischen Wand.
Dieses wollen wir für alle Werkzeuge einführen. 

## Absatz 43

Menü-Eigenschaftenleiste gehört den Werkzeugen!

## Absatz 46

Allgemeine Steuerung:

## Absatz 47

Es sollen Hotkeys eingeführt werden:
z.B.:	E -> ausgewähltes Element bewegen

## Absatz 48

 	STRG+ E -> ausgewähltes Element kopieren + Bewegen

## Absatz 49

	D-> ausgewähltes Element drehen

## Absatz 50

	STRG+ D – ausgewähltes Element drehen.

## Absatz 51

(Drehung erfolgt mit Hilfe des Raster engine, da wird ein kreis dargestellt, als Hilfe)

## Absatz 54

Layouts:
Das Navigationsfensteer beinhaltet „Geschosse, Schnitte, Ansichten, 3D-Ansichten.

## Absatz 55

Aus diesen Kann ein Abbild erstellt werden. Z.B kann ich Ein Abbild vom Geschoss erstellen, daraufhin wird in einem externen Abbildverzeichniss (Dargestellt ebenfalls im Navigator, nur in eigene Sektion, z.B. darunter) entsteht ein Abbild von Geschoss x. Dieses Abbild gilt als Ableitung, jedoch kann darin die darstellung der ebenen variabel geändert werden. Dieses Abbild ist keine Kopie vom Geschoss x. Es reagiert weiterhin auf jegliche Änderungen am Modell. Allerdings kann ich im Abbild Ebenen unabhängig aktivieren und deaktivieren, ohne dass dies Einfluss auf das Hauptmodell hat. 
Diese Funktion hat den Zweck, einen Abschnitt eines Geschosses zu erstellen, dort Extra ebenen auszufüllen wie Gestaltungen, textliche Anmerkungen etc., und den Plan für den Export vorzubereiten. 

Dieses Abbild erstellen, soll mit allen Geschossen, Schnitten und Ansichten möglich sein.

## Absatz 57

Ein Abbild, kann später in die EXPORT Layouts eingefügt werden. Ein Exportlayout kann anhand eines Masterlayouts vorbereitet werden. A4, hochkant, querkamt, A3, A2, etc…

## Absatz 58

Dazu kommt ein Plankopf, und dann kann dies exportiert werden. Die Layouts erhalten ebenfalls ein eigene Sektion im Navigator.

## Absatz 60

Später wird es so sein: Ein Nutzer zeichnet in 2D, wechselt rüber zu 3D, und wechselt rüber in ein 2D Abbild. Hierfür muss die UI passen. 
Es wäre sinnvoll, wie bereits im UI vorgesehen, den Bildschirm spaltbar zu machen. Jedes der ausgewählten Fenster kann aktiviert werden und eine Zeichnung dem zugewiesen. Ein Ablauf könnte so sein: Doppelklick auf ein Canvasfenster -> Klick auf z.B. Erggeschossabbild -> im Canvasfenster 1 ist das Erdgeschoss. Im Anderen Fenster das 3D Model.

## Absatz 62

Dachfunktion: Es soll in  ein Dach gezeichnet werden, welches in den Einstellungen voreingestellt oder live geändert werden kann. Beginntn vereinfacht mit einer Dachfläche. Später soll ein Walmdach hinzukommen.
Gaubenfunktion: Ähnlich wie Dach, in 2D angeordnet, in 3d dargestellt.

## Absatz 64

In der Menüleiste kommen weitere Funktionen mit einem Piktogrammaritgen button hinzu: Maßwerkzeug. Damit können live messungen von Strecken oder Flächen oder winkeln getätigt werden. Punkt zu punkt misst Strecke, Punkt zu Puknkt zu Punkt erstellt eine temporäre fläche und zeigt die Fläche an.

AI: Ein Bereich in 3D oder 2D ansicht soll ausgewählt werden können, und ein „Skizzenpapier“ artiges Oveerlay erhalten. In diesem Skizzenpapier kann mit der maus skizziert und gezeichnet werden, gleichzeitig aber auch gesprochen und „gepromtet“ Das System soll erkennen, welche änderung an diesen Bereich gewünscht ist, und diese im Anschluss umändern. Diese funktion wird trainiert werden müssen.

3D-Schnitt – Live 3D Schnitt

## Absatz 65

3D-First Person ansicht, bewegung mit WASD und Maus.

## Absatz 66


Rechtsklick in 3D oder 2D - > Kopieren, einfügen, importieren, Spiegeln, Reihenfolge der Darstellung ändern.

Schneller doppelter Rechtsklick auf ein jegliches Element: Übernahme des Objekts, bzw. des Werkzeuges mit denselben Eigenschaften.

Schrauffurübersicht – Ein Bereich, in dem Schraffuren bearbeitet erstellt und hinzugefügt werden können.


Grundsätzlich: 
Die Werkzeuge haben die folgenden Eigenschaften: Ebenenzuordnung, breite, Höhe, Länge, Farbe, Kontur,  Geschosszuordnung. 
Wir werden später herauskristallisieren, welcher Eigenschaften durch die Werkzeuge gemeinsam geteilt werden. Die am meisten geteilten Eigenschaften werden in Eigenschaftenmenü d. Werkzeuge an erster Stelle angezeigt, absteigend.

Trimmen bzw. Beschneiden von 3D Objekten. Ähnlich wie  Boolisch Operationen, nur dass mit weniger input gearbeitet wird. Sinnvoll wenn eine Wand auf ein Satteldachzugeschnitten werden muss. 
