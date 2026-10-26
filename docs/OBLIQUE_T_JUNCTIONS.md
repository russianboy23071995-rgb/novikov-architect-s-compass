# Schräge T-Anschlüsse (26.10.2026)

Änderungskarte „Schräge T-Anschlüsse“ mit den Empfehlungen freigegeben: Mindestwinkel 15°, schräge Ecke an einer T-Hauptwand später.

## Regel

Ein T-Anschluss braucht nicht mehr den rechten Winkel, sondern mindestens 15° zwischen den Wandachsen (`MIN_T_ANGLE_DEGREES` in `domain/elements/wall/t-junction.ts`). Flachere und parallele Anschlüsse werden mit „Der T-Anschluss benötigt mindestens 15° zwischen den Wandachsen.“ abgelehnt. Die Nebenwand endet mit schrägem Abschluss auf der Seitenfläche der Hauptwand; die Kontaktbreite ist Wandstärke ÷ sin(Winkel) (bei 24 cm und 15°: 0,93 m).

Weiterhin rechtwinklig bleiben: eine Ecke an einer T-Hauptwand (`corner-t-contact.ts`, eigener Auftrag) sowie die strenge Einzel-/IFC-Abnahmeecke.

## Umsetzung

- `t-junction.ts`: `deriveRightAngleTJunction` heißt jetzt `deriveTJunction`; die Rechtwinkelprüfung ist durch die Mindestwinkelregel ersetzt. Die vorhandene Geometrie (Zuschnitt der Nebenwandecken entlang ihrer Achse auf die Hauptwandfläche) trägt schräge Winkel ohne Umbau.
- `application/walls/t-axis-snap.ts`: Beim Zeichnen und Endpunkt-Ziehen bietet der Fang an der Wandachse zusätzlich den Fußpunkt des Cursors auf der Achse an (schräger T), wenn der lotrechte Fußpunkt nicht in Reichweite ist und der Winkel mindestens 15° beträgt. In der Nähe des Lotfußpunkts gewinnt weiter der rechte Winkel.
- Einzelvorschau: Bezeichnung „T-Anschluss“ statt „Rechtwinkliger T-Anschluss“.

## Nachweis

- `src/application/walls/oblique-t.test.ts`: 90°/60°/45°/30°/15° – Abschluss auf der Hauptwandfläche, Kontaktbreite t / sin, Wandkörper, IFC, Grundriss-Umriss, Fenster in der Nebenwand; Gegenproben: 14° und 5° abgelehnt, überlappende schräge Kontakte abgelehnt; Zeichnen: schräger Fang erzeugt einen T, nahe dem Lot gewinnt der rechte Winkel, zu flach kein T.
- Bestehende Tests, die schräge T als Fehler erwarteten, prüfen jetzt „schräg erlaubt, unter 15° abgelehnt“.
- `benchmarks/junction-equality.ts` gegen main 78eb5b3: alle 5 Modelle (Beispiel, Schulmodelle s/l/x, gebundene Höhen) mit unveränderten Konturen und Wandkörpern; Gegenprobe greift.
- 1277 Tests, Typen, Architektur-Check, Lint.

## Grenzen

- Schräge Ecke an einer T-Hauptwand, Mehrfachknoten und IFC-Anschlussbeziehungen bleiben offen; Archicad-Abnahme der T-Anschlüsse steht weiterhin aus.
- Browserabnahme des schrägen Zeichnens steht aus (Fang und Übernahme sind über dieselben Funktionen in Tests nachgewiesen).
