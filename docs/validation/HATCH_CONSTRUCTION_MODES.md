# Schraffur-Erstellungsarten und tuerkise Hervorhebung - 08.10.2026

PR207 mit Nutzerfreigabe nach gruener CI zusammengefuehrt.

## Nutzerauftrag und Umsetzung

Messstrecken/-flaechen verwenden gemeinsame feste Tuerkisfarbe #42d9df statt des
Theme-Primary (bisher teilweise schwarz). Konturen sind 1 CSS-Pixel duenn.
Ausgewaehlte Wandachsen in 2D/3D und Fensterdarstellung in 2D verwenden denselben
Farbwert und einen dezenten statischen Lichtsaum. Die 3D-Fenstermarkierung erhaelt
eine helle Aussenkante plus schmale tuerkise Innenkante im vorhandenen tiefengeprueften
Renderer. Keine blinkende Animation und keine Modell-/IFC-Aenderung.

Schraffur > Erstellung bietet:
- Polygon per Klick, bisheriger Doppelklick-Abschluss.
- Rechteck ueber zwei gegenueberliegende Ecken (achsenparallel).
- Rechteck ueber zwei Seitenpunkte und einen dritten Hoehenpunkt; die Hoehe ist
  dessen senkrechter Abstand zur festgelegten Seite. Beliebige Seitenrichtung.
- Geschlossene Kontur uebernehmen: innen anklicken. Sichtbare explizit geschlossene
  Polylinien und vorhandene Schraffurkonturen sind Quellen. Bei mehreren Treffern
  gewinnt die kleinste enthaltene Kontur; gleiche Flaechen behalten Quellreihenfolge.

Erstellungsarten verwenden vorhandene Fang-/Praezisionseingabe und createDrawing /
previewHatch / History. Jede neue Schraffur hat eine neue ID und einen Undo-Schritt.
Quellkonturen bleiben unveraendert. Rechteckmathematik/Containment liegen in Geometry,
Quellenauswahl in Application; CadWorkspace koordiniert nur den bestehenden Ablauf.

## Grenzen

Kein Zusammensetzen einzelner Linien, keine aus Waenden abgeleiteten Raeume, keine
Insel-/Lochsubtraktion und keine assoziative Nachfuehrung zur Quellkontur. Das Innere
anklicken; Randklicks sind kein eigener toleranzbasierter Auswahlmodus. Konturen
werden je Modell-/Sichtbarkeitsstand vorbereitet, nicht pro Mausziel validiert.
Sehr viele lange geschlossene Polylinien koennen diesen synchronen Vorbereitungsschritt
verteuern; dafuer liegt noch kein eigener Kapazitaetsnachweis vor.

## Nachweis und praktische Abnahme

709 Tests, Typecheck, gezielter ESLint und Build bestanden. Tests pruefen Diagonale,
schraege Seite/Hoehe, Nullgeometrie, offene Kontur, kleinste verschachtelte Kontur,
Ausblendung, Snapshot-Schutz und gemeinsame Erstellung. Browser: beide Rechteckarten,
Konturuebernahme und genau ein Undo-Schritt fuer die uebernommene Schraffur erfolgreich.

H druecken, Erstellung waehlen und im Canvas zeichnen. Fuer die Erkennung ein
geschlossenes Polygon oder eine vorhandene Schraffur innen anklicken. Undo pruefen.
Messen und Wand-/Fensterauswahl zeigen die neue gemeinsame tuerkise Hervorhebung.

Naechster Auftrag bleibt V01c temporaere 2D-Winkelmessung mit drei Punkten auf dem
gemeinsamen Messlebenszyklus; die gewuenschte Erweiterung wurde davor eingeschoben.
