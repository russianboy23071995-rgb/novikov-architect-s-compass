# V01b - temporaere Flaechenmessung (08.10.2026)

PR206 wurde mit Nutzerfreigabe nach erfolgreicher CI zusammengefuehrt.

## Ablauf

Lineal oben (Messen), Messart Flaeche in Werkzeugeigenschaften. Punkte setzen;
Doppelklick auf den letzten Punkt schliesst die Kontur. Der zweite Klick desselben
Doppelklicks erzeugt keinen weiteren Punkt. Ein expliziter Rueckschluss zum ersten
Punkt wird normalisiert. Ergebnis in m² mit drei Dezimalstellen. Nach Abschluss
beginnt der naechste Klick eine neue Messung. Neue Messung verwirft auch fehlerhafte
Konturen. Escape/Abbrechen beenden; Zoom erhaelt Punkte und Ergebnis.

## Architektur und Grenzen

Strecke und Flaeche nutzen einen gemeinsamen transienten Hook und Point-Interaction-
Adapter, ToolInteraction und drawingSnapPolicy. Die Punktfolge liefert Anfangs-
und Endreferenzen an die vorhandene Engine. Kein eigener Fang-/Hoveralgorithmus.
Modell, Auswahlhistorie und Export werden nicht beschrieben. Der Kontext umfasst
Modell, Sichtbarkeit, aktiven Viewport, Layout, Werkzeug und Messart.

validateSimplePolygon prueft den abgeschlossenen Ring; Quadratmeter stammen aus
dessen vorzeichenunabhaengiger Flaeche. Selbstkontakt, Kreuzungen, degenerierte
Konturen und ungueltige Zahlen werden abgewiesen. Volle Konturvalidierung nur
beim Abschluss, nicht pro Mausbewegung. Waehrend Zeichnen nur Konturvorschau,
kein als gueltig dargestellter vorlaeufiger Flaechenwert. Ohne Loecher, 3D-Flaechen,
Raumobjekte, Speicherung oder WoFlV-Auswertung. Sehr grosse manuelle Punktfolgen
haben beim Abschluss weiterhin die Kosten der vorhandenen Polygonvalidierung.

## Nachweise

707 Tests bestanden. Neue Tests: Rechteck 6 m² in beiden Umlaufrichtungen, grosser
Koordinatenversatz, konkave Kontur 5 m², expliziter Schluss, doppelte Klickpunkte,
Neubeginn und ungueltige Konturen. Typecheck, gezielter Lint und Build bestanden.
Browser: Wandgrundflaeche 3,00 x 0,36 = 1,080 m² per vier Eckpunkten und Doppelklick;
Zoom erhaelt Ergebnis. Kreuzweise angeklickte Ecken liefern eine verstaendliche
Fehlermeldung statt falscher Flaeche. Undo bleibt deaktiviert, Navigator unveraendert.

## Abnahme und Folgeauftrag

Messen > Flaeche, bekannte Kontur anklicken, letzten Punkt doppelklicken. Zoomen,
Neue Messung und Escape pruefen. Eine sich kreuzende Punktfolge muss abgewiesen werden.

Naechster begrenzter Auftrag V01c: temporaere 2D-Winkelmessung mit drei Punkten
(erster Schenkelpunkt, Scheitel, zweiter Schenkelpunkt) auf demselben Messlebenszyklus.
Kleineren eingeschlossenen Winkel 0 bis 180 Grad anzeigen und Nullschenkel ablehnen;
keine dauerhafte Bemaßung oder Modellaktion.
