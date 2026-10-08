# V01c - temporaere Winkelmessung (08.10.2026)

PR208 nach gruener CI und Nutzerfreigabe zusammengefuehrt.

Messen > Winkel: Schenkelpunkt, Scheitel, zweiter Schenkelpunkt. Anzeige des
kleineren Winkels 0 bis 180 Grad, zwei Dezimalstellen. Dritter Klick haelt ihn fest,
vierter beginnt eine neue Messung. Neue Messung/Escape/Abbrechen und Kontextwechsel
verwenden den bestehenden Messlebenszyklus. Zoom erhaelt Weltpunkte und Ergebnis.

Geometry berechnet atan2 aus normierten Richtungen (ohne grosse Vektorprodukte).
Application haelt kopierte fluechtige Punkte und lehnt Nullschenkel/ungueltige
Koordinaten ab. Der gemeinsame Messhook und Point-Interaction-/Fangpfad bleiben
massgeblich. Kein Modellobjekt, keine History, keine exportierte Bemaßung.
Waehrend der dritten Punktwahl wird ein gueltiger Winkel live angezeigt. Ein
ungueltiger Zielpunkt verwirft die bisherigen Messpunkte nicht.

Nachweise: 712 Tests, Typecheck, gezielter Lint, Build bestanden. Tests fuer
0/45/90/135/180 Grad, vertauschte Schenkel, grosse Werte, Nullschenkel, ungueltige
Koordinaten, kopierte Punkte und Neubeginn. Browser: rechte Wandecke 90,00 Grad,
Zoom unveraendert, Neue Messung, Nullschenkelmeldung und Escape erfolgreich;
Undo weiterhin deaktiviert und Navigator unveraendert.

Abnahme: Messen > Winkel, drei bekannte Punkte setzen, zoomen und Escape.
Grenzen: nur 2D, kein gerichteter/reflexer Winkel, keine dauerhafte Bemaßung.

Naechster begrenzter Auftrag V06a: Werkzeugvorgabenuebernahme fuer Schraffuren
vorbereiten. Bestehende Defaults/Erstellungsaktion abgleichen und den zu kopierenden
Eigenschaftenumfang mit dem Nutzer festlegen (Vorschlag: Fuellung, Hintergrund,
Kontur, Ebene; niemals ID, Punkte oder Verknuepfungen). Die benoetigte gemeinsame
Vorgaben-Grenze konkretisieren; keine stillschweigende Fachentscheidung treffen.
