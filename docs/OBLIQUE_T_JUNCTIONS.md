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

# Schräge Ecke an einer T-Hauptwand (26.10.2026)

Folgeauftrag mit Nutzerfreigabe („go und freigabe“): Die Regel „Ecke und T benötigen vorerst eine rechtwinklige Ecke“ (`corner-t-contact.ts`) entfällt.

- **Kurzkarte:** Die Kontaktprüfung setzt außer dem rechten Winkel nur voraus, dass die Ringkanten 0 und 2 die Längsseiten der Hauptwand sind und alle Ringe konvexe Vierecke sind. Beides gilt für jede Gehrung (auch schief oder als Stumpfstoß). Daher wird nur die Winkelregel entfernt; die Prüfungen „T-Kontakt berührt den Eckbereich“ und „T-Nebenwand berührt oder überlappt den Eckpartner“ bleiben unverändert.
- **Nachweis:** `src/application/walls/oblique-corner-t.test.ts` – Eckwinkel 45°/60°/120°/135°, T auf beiden Seiten der Hauptwand: einfache Ringe, Wandkörper, IFC; Gegenproben: ein T nahe einem spitzen Eckpartner und ein T an der Gehrung werden abgelehnt. Bestehende Erwartungen (schräger Eckpartner abgelehnt) auf „erlaubt“ umgestellt. Alle bisherigen Modelle unverändert gegen main 053988b. 1282 Tests, Typen, Architektur-Check, Lint.

# T-Anschluss automatisch, in jedem Winkel (26.10.2026)

Änderungskarte „T-Anschluss automatisch, jeder Winkel“ mit den Empfehlungen freigegeben (A1 und A2 zusammen, keine Untergrenze außer „nicht parallel“). Anlass: Ein 15°-Anschluss an eine vorhandene Wand ließ sich nicht erzeugen.

## Befund

- Ein T entstand nur über den Fang „T an der Wandachse“. Endete die Wand über Wandmitte, Raster, Schnittpunkt oder eingetippte Werte genau auf der Achse, entstand kein T (Ecken werden dagegen über die Koordinaten erkannt).
- Die 15°-Grenze lehnte flachere Anschlüsse ab.
- Zusätzlich lehnte die Geometrie schräge Anschlüsse von Wänden mit einseitigem Wandkörper (Standardwand, Versatz t/2) auf einer Seite mit „Ankommende Wand für den T-Anschluss zu kurz.“ ab: Die nahe Körperecke liegt dort schon vor der Hauptwandfläche.

## Regel

- Jeder Winkel außer parallel (`PARALLEL_T_MESSAGE`, „Parallele Wände können keinen T-Anschluss bilden.“). Die Kontaktbreite t / sin(Winkel) wird bei spitzen Winkeln lang (24 cm bei 5°: 2,75 m); reicht sie über das Hauptwandende, wird der T wie bisher abgelehnt.
- Liegt die nahe Körperecke vor der Hauptwandfläche, wird die Körperkante bis zur Fläche verlängert (negativer Zuschnitt in `deriveTJunction`).
- Automatisch: Endet eine Wand beim Zeichnen (Kettenanfang und -ende) oder beim Ziehen eines Wandendes genau (Modelltoleranz) auf der Achse einer anderen Wand zwischen deren Enden, entsteht ein T, gleich wie der Punkt gefunden wurde (`connectAutomaticT`, `automaticTHost` in `application/walls/t-axis-snap.ts`).
- Kein automatischer T: Wandende schon angeschlossen (Ecke oder T), Punkt auf zwei Achsen (Kreuzung), parallele Wand, oder der T verletzt eine Projektregel (z. B. Kontakt über das Hauptwandende) – dann bleibt die Wand wie bisher unverbunden.
- Laden einer Datei verbindet nichts automatisch.
- Vorbereitete Vorschauen (erste Wand, zweite Ecke der Kette, Endpunkt-Ziehen) nehmen bei einer Achsberührung den vollständigen Pfad, damit Vorschau und Übernahme gleich sind.

## Nachweis

- `src/application/walls/auto-t.test.ts`: 90°/45°/15°/5°/2° über eingetippte Werte, Wandmitte und Raster, jeweils Kettenende und Kettenanfang, Vorschau gleich Übernahme; Ziehen eines Wandendes auf die Achse (Vorschau, ein Rückgängig-Schritt, knapp neben der Achse kein T); Gegenproben Kreuzung, Hauptwandende (Ecke), parallel, abgelehnter T bleibt unverbunden, Laden unverändert.
- `src/application/walls/oblique-t.test.ts`: Kontaktbreite und Wandkörper bis 1°; parallel abgelehnt; Kontakt über das Hauptwandende abgelehnt; Fang bietet auch flache Anschlüsse an, parallel keinen.
- Bisherige Tests, die „eingetippte Werte erzeugen keinen T“ oder „unter 15° abgelehnt“ erwarteten, auf das neue Verhalten umgestellt.
- `benchmarks/junction-equality.ts` gegen main e09269d: alle 5 Modelle (Beispiel, Schulmodelle s/l/x, gebundene Höhen) mit unveränderten Konturen und Wandkörpern; Gegenprobe greift.

## Grenzen

- Eine Zeichenkette endet an einem automatischen T wie an einem T-Fang („Wandkette am T-Anschluss abschließen“).
- Browserabnahme des Zeichnens steht aus.
