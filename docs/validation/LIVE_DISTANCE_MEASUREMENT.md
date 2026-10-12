# V01a - temporaere Streckenmessung (08.10.2026)

PR205 wurde nach gruener CI mit Nutzerfreigabe zusammengefuehrt.

## Bedienung und Architektur

Lineal-Piktogramm in der Hauptmenueleiste: erster Klick setzt Start, zweiter Klick
haelt die Distanz fest; danach beginnt ein weiterer Klick eine neue Messung.
Zwischen den Klicks zeigt das Overlay die aktuelle gefangene Distanz in Metern.
Escape beendet den Modus. Zoom veraendert weder Punkte noch Messwert; Markierungen
und Schrift bleiben bildschirmbezogen. Nullstrecken zeigen 0,000 m.

Der Application-Adapter unter application/measurement nutzt ToolInteraction,
confirmInteraction und drawingSnapPolicy. Es gibt keinen separaten Fangalgorithmus.
Der Hook verwaltet ausschliesslich fluechtige Punkte; Projekt, History und Export
werden nicht beschrieben. Modell-/Sichtbarkeits-, Werkzeug-, Layout- und aktive
Ansichtswechsel verwerfen den bisherigen Messkontext. Anzeige auf drei Dezimalen,
intern ungerundete Meterkoordinaten. Keine assoziative Bemaßung, Speicherung,
Flaechen-/Winkelmessung oder 3D-Messung in diesem Schritt.

## Nachweis

- 703 Tests bestanden; neue Tests fuer exakte Distanz, kopierte Punkte, Neubeginn,
  Abbruch, ungueltige Koordinaten, Nullstrecke und zoomunabhaengige Modellkoordinaten.
- Typecheck einschliesslich Produktionscode, gezielter ESLint und Build bestanden.
- Browser: Endpunkte der 3-m-Beispielwand gefangen, Ergebnis 3,000 m; nach Zoom
  weiterhin 3,000 m. Escape entfernt Overlay, Undo bleibt deaktiviert und
  Navigator enthaelt weiterhin nur die zwei urspruenglichen Elemente.
- Wechsel vom Messmodus nach 3D schaltet den Messmodus aus.

## Abnahme

Lineal anklicken, Anfang und Ende einer bekannten Wand messen, zoomen.
Wert pruefen, anschliessend Escape. Neue Messung starten und zur 3D-Ansicht wechseln.
Es darf kein Messobjekt im Navigator und kein zusaetzlicher Undo-Schritt entstehen.

## Naechster Auftrag

V01b: temporaere Flaechenmessung einer geschlossenen 2D-Punktfolge auf derselben
Interaktions-/Fangbasis. Doppelklick abschliessen, Quadratmeter anzeigen, ungueltige
oder selbstschneidende Konturen verstaendlich behandeln. Kein gespeichertes Raum-
oder Schraffurobjekt; Winkelmessung und dauerhafte Bemaßung bleiben Folgeumfang.
