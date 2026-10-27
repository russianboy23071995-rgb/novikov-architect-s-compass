# Sichtbarkeitsprüfung beim Fangen mit Index (27.10.2026)

Änderungskarte „Sichtbarkeitsprüfung beim Fangen mit Index“ mit den Empfehlungen freigegeben: beide Stellen umstellen (Arbeitsebene auf Tür-/Fensterhöhe und Geschossebene), Gleichheit zur Vollsuche nachweisen, doppelte Fangrechnung beim Neuzeichnen unverändert lassen.

## Befund (docs/performance/DRAG_RENDERING_3D.md)

Beim Türziehen in 3D dauerten bei l in jedem Durchgang 5 von 30 Mausbewegungen 45–67 ms statt 16 ms. Zuordnung im Diagnose-Build: Fangquellen, Kandidatensammlung, Raster, Türrichtung und Begrenzung zusammen < 0,5 ms. Teuer war die Sichtbarkeitsprüfung des einen gefundenen Kandidaten (`acceptCandidate` → `classifyAnchorVisibility` → `nearestWallSurface`): eine Suche über alle rund 11 000 Gebäudeflächen, 15,5 ms je Aufruf, zweimal je Bewegung (Mausereignis und Anzeige beim Neuzeichnen).

## Umsetzung

- `rendering/viewport/anchor-visibility.ts`: `lazyAnchorVisibility(solid, projection)` – dieselbe Prüfung wie `prepareAnchorVisibility` (Flächenrahmen-Index, exakte Dreiecksprüfung unverändert, Rückfall auf Vollsuche bei extremen Projektionen), der Index entsteht aber erst bei der ersten Abfrage. Fangkontexte entstehen je Modell-/Kamerastand; die meisten prüfen nie einen Kandidaten.
- `wall-preview-context.ts` (Arbeitsebene auf Öffnungshöhe): `acceptCandidate`/`acceptReference` nutzen die indizierte Prüfung.
- `wall-point-candidates.ts` (Geschossebene): `visibilityAt` und die Sichtbarkeit der Abfrage-Kandidaten nutzen die indizierte Prüfung.
- Unverändert: Fangregeln, Rangfolge, Shift-Sperre, doppelte Fangrechnung beim Neuzeichnen (kostet jetzt ≈ 0,1 ms).

## Nachweis

- `src/rendering/viewport/snap-visibility-index.test.ts`: indizierte Prüfung gleich der Vollsuche an 576 Punkten (3 Blickrichtungen, Geschoss- und Öffnungshöhe; sichtbare und verdeckte Punkte); beide Fangkontexte akzeptieren dieselben Kandidaten wie die Vollsuche; der Index wird nicht mit dem Kontext, sondern bei der ersten Abfrage genau einmal gebaut. 1305 Tests grün.
- Browser, Diagnose-Build beider Stände, Ziehlauf je 3 Läufe (`benchmarks/snap-visibility-index-results.json`):

| Median aus 5 Durchgängen, ms      | vorher          | nachher         |
| --------------------------------- | --------------- | --------------- |
| l: 30 Bewegungen                  | 648 / 653 / 673 | 476 / 500 / 504 |
| l: Bewegungen über 40 ms (je 150) | 26–28           | 15–16           |
| l: Sichtbarkeitsprüfung (Median)  | 15,2–16,2       | 0–0,1           |
| s: 30 Bewegungen                  | 460 / 471 / 526 | 412 / 437 / 452 |
| s: Sichtbarkeitsprüfung (Median)  | 5,6–5,7         | 0,1             |

- Je Ziehvorgang bleibt bei l eine einmalige langsame Bewegung: der Index-Aufbau bei der ersten Prüfung (34–54 ms). Die übrigen Bewegungen über 40 ms nachher sind Hintergrundarbeit nach dem Öffnen (nicht dem Ziehen zugeordnet).
- Vollständiger Schullauf l (je 2 Läufe, alle Schritte ok, keine Fehler): „3D: Tür entlang Wand ziehen“ 2315 / 2123 → 1845 / 1687 ms.

## Grenzen

- Der Index wird je Fangkontext neu gebaut (bei l 34–54 ms beim ersten Kandidaten eines Ziehvorgangs); er wird nicht zwischen Kontexten geteilt.
- Gemessen im Diagnose-Build mit Messpunkten; ein Rechner, Chrome, 60 Hz. Modell x nicht gemessen.
