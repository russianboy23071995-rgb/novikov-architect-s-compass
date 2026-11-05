# Hinweis bei überlappenden Öffnungen (24.10.2026)

Basis: feat/door-preview-scopes (PR450, noch nicht gemergt). Änderungskarte freigegeben.

**Nutzerentscheidung 24.10.2026:** Überlappende Öffnungen (Fenster/Fenster, Tür/Tür,
Fenster/Tür) bleiben überall erlaubt. Vorschau und Öffnung zeigen nur einen Hinweis; es wird
nie abgelehnt, kein Mindeststeg, kein automatisches Anschlagen.

## Regel

Zwei Öffnungen derselben Wand überlappen, wenn sie sich entlang der Wand **und** in der Höhe
(über dem Wandfuß, Türen über `doorOpening`) mit positiver Länge schneiden. Berühren zählt nicht;
übereinanderliegende Öffnungen (z. B. Oberlicht über einer Tür) auch nicht. Grundlage ist die
gemeinsame Öffnungssicht `storeyOpenings`. Gültigkeitsprüfung, Dateiformat und IFC bleiben
unverändert.

## Änderungskarte

1. **Fachregel:** `domain/elements/wall/opening-overlaps.ts` (`openingOverlaps`,
   `openingOverlapHint`, `changedOpeningIds`).
2. **Anwendung:** `application/openings/overlap-hint.ts` – Hinweis für eine vorgeschlagene
   Änderung (nur neue oder geänderte Öffnungen), für einen vorbereiteten Geometrie-Ausschnitt und
   für eine bestehende Öffnung.
3. **Setzen und Verschieben:** Grundriss-Vorschau (`BimPlan`) zeigt den Hinweis am Cursor,
   3D-Vorschau (`BimSolidView`) als Hinweiszeile; der Klick wird übernommen.
4. **An der Öffnung:** Eigenschaften von Fenster und Tür (`OverlapHint`); Grundriss markiert
   überlappende Öffnungen orange (`plan-scene.ts`, `PlanSceneRun.tsx`).
5. **Text/Sprache:** Die Vorschau-Zusammenfassung erhält „· Hinweis: …“.

## Nachweis

- `src/domain/elements/wall/opening-overlaps.test.ts`: Überschneidung, Berühren, andere Wand,
  Oberlicht über Tür, zwei Fenster; Tür mit Z-Versatz auf angehobener Wand; Vorschauhinweis nur
  für geänderte Öffnungen und nie Veränderung des Ergebnisses; Befehlszusammenfassung,
  Öffnungsachsen-Ausschnitt und Grundrissmarkierung. Gegenprobe ohne Höhenprüfung: 2 Tests
  scheitern.
- 1220 Tests, Architektur-Check PASS, beide Typprüfungen, Lint (0 Fehler), Build.
- **Messung** (`benchmarks/opening-overlap-profile.ts`, Rohdaten `opening-overlap-results.json`;
  Arbeitsgeschoss mit 100 Wänden, Fenstern und Türen, ohne und mit 100 Überlappungen, Median
  aus 31, drei Läufe): Geschossprüfung 0,06–0,16 ms, Vorschauhinweis 0,28–0,34 ms je Schritt.
- **Bedienabnahme:** Tür über ein Fenster gesetzt: Hinweis am Cursor, beide Öffnungen orange,
  Klick übernommen, Eigenschaften zeigen den Hinweis; Ziehen der Tür in 3D zeigt den Hinweis
  über der Ansicht. Server-Log ohne neue Fehler.

## Offen

- Die Hinweise nennen Tür-IDs (UUIDs); eine DIN-/Raumbezeichnung folgt mit der
  Bezeichnungsfrage.
