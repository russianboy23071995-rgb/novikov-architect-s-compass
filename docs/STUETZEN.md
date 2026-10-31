# Stützen (L05, ab 31.10.2026)

Nutzerauftrag 31.10.2026: Stützen als neues Bauteil. Umsetzung in drei PRs nach Änderungskarte (vom Nutzer mit „go“ freigegeben).

| PR | Inhalt | Stand |
| --- | --- | --- |
| P1 | Modell, Dateiformat 37, Standardebene Stütze, Aktionen, 3D-Körper, IFC IfcColumn | erledigt |
| P2 | Werkzeug „Stütze“, Leiste und Einstellungsfenster (Reiter Stütze, Bauzustand), Grundriss geschnitten in der Schnittfarbe, Eigenschaften, Doppelklick | offen |
| P3 | Verschieben, Drehen, Kopieren, Fangpunkte, Rechtsklickmenü, Pipette, Archicad-Prüfdatei | offen |

Vorgaben (vom Nutzer nicht anders bestimmt): rechteckig 30 × 30 cm, rund Ø 30 cm, Höhe an das Geschoss gebunden, Bezugspunkt in der Mitte. Wand und Stütze durchdringen sich vorerst ohne Bereinigung.

## Teil P1: Modell

- `src/domain/elements/column/model.ts`: `columnSchema` – Mitte `position`, Querschnitt `shape` (Rechteck B × T oder Kreis Ø), `rotation` in Grad (gegen den Uhrzeigersinn), Fuß `baseOffset` über OK Rohfußboden, Oberkante entweder an das Geschoss gebunden (`topBinding` wie bei der Wand: OK Rohfußboden darüber + Zusatzhöhe) oder feste `height` über dem Fuß – genau eine Regel. `renovation` wie bei Wänden (ohne Eintrag Bestand). `columnLevels`, `columnOutline` (Kreis als 32-Eck).
- `src/application/columns/actions.ts`: `addColumn` (ohne Höhenregel geschossgebunden, Standardebene Stütze), `updateColumn` (feste Höhe löst die Bindung und umgekehrt), `defaultColumnLayerId`. Löschen, Ebenen und Auswahlformen laufen über das Bauteilregister (`column`, „Stütze“).
- Schema 37: `columns` je Geschoss (optional); Prüfung Ebene, positive Höhe, gebundene Oberkante nur mit Geschosshöhe. Migration 36 → 37 ergänzt die Standardebene „Stütze“ (`withColumnLayer`, mit Kollisionssuffix); eine untergeschobene Stützenliste in einer 36er Datei wird abgelehnt. Neue Projekte bekommen die Ebene direkt.
- 3D (`column-solid.ts`): geschlossenes Prisma vom Fuß bis zur Oberkante, Flächen mit Kennung `column` (Auswahl in 3D als Stütze, nicht als Wand; keine Wandfuß-Fangpunkte).
- IFC: `IfcColumn` .COLUMN. mit `IfcExtrudedAreaSolid` aus `IfcRectangleProfileDef` bzw. `IfcCircleProfileDef` (parametrisch, gedreht über die Platzierung), `Pset_ColumnCommon.Status` (NEW/EXISTING/DEMOLISH) und eigene Werte (Form, Drehung, Fuß, Höhe, Bauzustand).
- Im Grundriss sind Stützen in P1 noch nicht gezeichnet und nicht bearbeitbar (kommt mit P2/P3).

Nachweis P1: 1390 Tests grün (5 neu in `src/application/columns/actions.test.ts`), Typprüfung/Lint/Architektur sauber, 14-Modell-Hash unverändert (`089f79e4…97017b3`). Browser: Testprojekt mit gedrehter Rechteck- und runder Stütze in 3D sichtbar, geschossgebunden höher als eine 2,80-m-Wand.
