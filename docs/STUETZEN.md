# Stützen (L05, ab 31.10.2026)

Nutzerauftrag 31.10.2026: Stützen als neues Bauteil. Umsetzung in drei PRs nach Änderungskarte (vom Nutzer mit „go“ freigegeben).

| PR | Inhalt | Stand |
| --- | --- | --- |
| P1 | Modell, Dateiformat 37, Standardebene Stütze, Aktionen, 3D-Körper, IFC IfcColumn | erledigt |
| P2 | Werkzeug „Stütze“, Leiste und Einstellungsfenster (Reiter Stütze, Bauzustand), Grundriss geschnitten in der Schnittfarbe, Eigenschaften, Doppelklick | erledigt |
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

## Teil P2: Werkzeug, Grundriss, Eigenschaften

- Werkzeug „Stütze“ in der Werkzeugleiste direkt nach „Wand“. Jeder Klick setzt eine Stütze mit der Mitte auf dem (gefangenen) Punkt; das Werkzeug bleibt aktiv. Vorgaben (, nicht im Undo): Form rechteckig/rund, Breite, Tiefe, Drehung bzw. Durchmesser, Höhe „Bis Geschoss darüber“ mit Versatz Oberkante oder „Feste Höhe“, Fuß über OK Rohfußboden, Ebene, Bauzustand (Vorgabe Neubau wie bei Wänden). Beide Querschnittsmaße bleiben beim Umschalten erhalten.
- Dieselben Felder () in der Leiste, im Einstellungsfenster (Doppelklick auf das Werkzeug; Reiter „Stütze“ und „Bauzustand“) und bei einer gewählten Stütze. Bei einer Stütze wird eine Änderung beim Verlassen des Feldes, mit Enter oder bei einer Auswahl übernommen: ein Rückgängig-Schritt je Änderung.
- Grundriss: eigene Zeichenschicht über den Wänden. Eine Stütze, die die Schnitthöhe 1 m durchdringt, ist gefüllt wie eine geschnittene Wand (Schnittfarbe, bei eingeschalteter Anzeige Neubau rot, Abbruch gelb); liegt sie ganz darüber oder darunter, nur gestrichelter Umriss. Auswahl per Klick, Rechteckauswahl, Tab-Auswahl.
- Doppelklick auf eine Stütze öffnet ihr Fenster mit den Reitern Stütze, Bauzustand (gilt für alle gewählten Stützen) und Ebene.
- Noch nicht: Verschieben, Drehen, Kopieren, Fangpunkte an Stützen, Pipette (P3).

Nachweis P2: 1392 Tests grün (2 neu), Typprüfung/Lint/Architektur sauber, 14-Modell-Hash unverändert. Browser: drei Stützen gesetzt (zwei rechteckig, eine rund), rot als Neubau; Leiste und Werkzeugfenster mit Reitern; Doppelklick auf eine Stütze öffnet ihr Fenster; Breite 0,5 m und Bauzustand Bestand übernommen (schwarz in der Schnittfarbe), je ein Rückgängig-Schritt; Teststützen danach zurückgenommen.
