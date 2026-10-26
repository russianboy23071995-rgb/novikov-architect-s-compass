# Treffertoleranz beim Setzen von Türen und Fenstern (26.10.2026)

Änderungskarte „Treffertoleranz“ mit den Empfehlungen freigegeben: 8 Bildpunkte, Vorrang für die Wand, deren Körper den Punkt enthält.

## Anlass

Im Schullauf l (dreiflügeliger Bau im Bild, etwa 8 Bildpunkte je Meter) traf „Tür setzen“ die 24-cm-Trennwand nicht: `findOpeningHost` nahm eine Wand nur, wenn der Punkt im Wandkörper lag (halbe Wandstärke), ohne Bildschirmtoleranz. Die Wand war dort keine 2 Bildpunkte breit (docs/WALL_JUNCTIONS.md, Grenzen).

## Umsetzung

- `application/drawing/window-placement.ts`: `findOpeningHost(project, visibility, point, tolerance = 0)` nimmt Wände, deren Körper höchstens `tolerance` Meter vom Punkt entfernt ist. Reihenfolge: zuerst eine Wand, deren Körper den Punkt enthält; sonst die nächste Seitenfläche; dann wie bisher Abstand und ID. Toleranz 0 entspricht exakt dem bisherigen Verhalten.
- `OPENING_HOST_RADIUS_PX = 8`, `openingHostTolerance(pixelsPerMetre)`: die Fang-Auflösung der gemeinsamen Fenster-/Türplatzierung übergibt 8 Bildpunkte am aktuellen Maßstab (2D-Grundriss und 3D-Arbeitsebene teilen den Fang-Kontext). Etwas kleiner als der Fangradius (10 Bildpunkte), damit beide nicht konkurrieren.
- Übernehmen: Ist eine Wand gefunden, legt die Fang-Auflösung den Punkt auf ihre Achse – auch bei ausgeschaltetem Fang (`constrain` in `constraints/snapping/engine.ts`). Der Übernehmen-Pfad braucht daher keine eigene Toleranz.

## Nachweis

`src/application/drawing/opening-hit-tolerance.test.ts`: Toleranz folgt dem Maßstab; dünne Wand innerhalb der Toleranz getroffen, außerhalb nicht; enthaltender Körper gewinnt gegen eine nähere Nachbarachse; zwischen zwei Körpern gewinnt die nähere Fläche; Toleranz 0 unverändert streng; Fenster und Tür bei 8 Bildpunkten je Meter mit und ohne Fang auf die dünne Wand gesetzt. Gegenprobe: ohne Toleranz in der Fang-Auflösung scheitert die Platzierung. 1266 Tests, Typen, Architektur-Check, Lint.

## Grenzen

- Browser-Schullauf l mit „Tür setzen“: siehe PR – der Browserbereich war beim Umsetzen ausgeblendet.
- Auswahl, Löschen und andere Werkzeuge nutzen eigene Trefferwege und sind nicht Teil dieser Änderung.
