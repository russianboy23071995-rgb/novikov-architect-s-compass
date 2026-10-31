# Treppen (L06, ab 31.10.2026)

Nutzerauftrag 31.10.2026: Treppen als Bauteil, in drei Teilen. Nutzervorgabe: **Alle Treppenangaben sollen langfristig in den Einstellungen steuerbar sein** – deshalb speichert das Modell jede einstellbare Größe ausdrücklich; berechnet wird nur, was nicht festgelegt ist.

| PR | Inhalt | Stand |
| --- | --- | --- |
| TR1 | Gerade Treppe: Modell, Rechnung und Prüfung nach DIN 18065, Schema 40, Standardebene Treppe, 3D-Körper, IFC | erledigt |
| TR2 | Werkzeug „Treppe“, Leiste und Einstellungsfenster mit allen Angaben, Grundriss (Stufen, Lauflinie mit Pfeil, Schnittlinie), Eigenschaften, Bearbeiten | offen |
| TR3 | L- und U-Treppe mit Zwischenpodest; später gewendelte Stufen und Wendeltreppe | offen |

## Regeln (DIN 18065, Gebäudetreppen)

| Regelwerk | Steigung h | Auftritt a | nutzbare Laufbreite |
| --- | --- | --- | --- |
| Wohngebäude bis 2 Wohnungen, notwendige Treppe (Vorgabe) | 14–20 cm | 23–37 cm | ≥ 80 cm |
| Sonstige Gebäude, notwendige Treppe | 14–19 cm | 26–37 cm | ≥ 100 cm |

Schrittmaßregel 2h + a = 59–65 cm (Richtwert 63 cm). Die Prüfung meldet jede Abweichung, verhindert die Treppe aber nicht (Planungsstand).

## Teil TR1

- `src/domain/elements/stair/model.ts`: `stairSchema` (Schema 40) – Form (vorerst `straight`), Antritt `start` (Mitte der Vorderkante der ersten Steigung), Richtung (Grad), Laufbreite, **Ziel-Steigung** (Vorgabe 17,5 cm), optional **feste Steigungsanzahl** und **fester Auftritt**, Laufplattendicke (Vorgabe 16 cm), Regelwerk, Fuß über OK Rohfußboden, Höhe wie Stütze/Wand (bis Geschoss darüber + Versatz oder feste Höhe), Bauzustand.
- `stairGeometry`: Höhe → Steigungsanzahl (aus Ziel-Steigung, sofern nicht fest), Steigung = Höhe / Anzahl, Auftritt aus 2h + a = 63 cm (sofern nicht fest), Auftrittsanzahl = Steigungen − 1, Lauflänge; Prüfung mit Klartext-Befunden. `stairOutline` (Grundriss), `stairProfile` (Seitenprofil: Stufen auf Laufplatte, Plattendicke senkrecht zur Neigung).
- `src/domain/elements/stair/body.ts`: geschlossener Körper (Profil über die Laufbreite extrudiert), in 3D mit Flächenkennung `stair`; IFC nutzt denselben Körper.
- `src/application/stairs/actions.ts`: `addStair` (Vorgaben für alles nicht Angegebene, geschossgebunden), `updateStair` (feste Höhe ↔ Bindung; `riserCount`/`tread` auf `undefined` setzen gibt sie an die Rechnung zurück).
- Standardebene „Treppe“ (neue Projekte direkt; Migration 39 → 40 ergänzt sie, gemeinsamer Helfer `withStandardLayer`). Untergeschobene Treppen in 39er Dateien werden abgelehnt.
- IFC: `IfcStair` .STRAIGHT_RUN_STAIR. mit `IfcStairFlight` (Steigungen, Auftritte, Steigung, Auftritt, facettierter Körper), `Pset_StairCommon` (NumberOfRiser, NumberOfTreads, RiserHeight, TreadLength, Status) und eigene Werte (Breite, Höhe, Lauflänge, Schrittmaß, Regelwerk, Prüfergebnis).
- Im Grundriss sind Treppen in TR1 auswählbar, aber noch nicht gezeichnet; Werkzeug und Darstellung folgen in TR2.

Nachweis TR1: 1413 Tests grün (4 neu in `src/application/stairs/actions.test.ts`), Typprüfung/Lint/Architektur sauber (Treppenkörper in der Domäne, damit IFC nicht auf die Darstellung zugreift), 14-Modell-Hash unverändert. Browser: Testprojekt mit gerader Treppe (Breite 1,20 m, geschossgebunden) in 3D – Stufen auf Laufplatte bis zum Geschoss darüber.
