# Ecken anklicken (E1)

Nutzervorgabe (01.11.2026): Wird die Ecke eines ausgewählten Elements angeklickt, erkennt das Programm, dass diese Ecke frei bewegt werden soll – bei allen Elementen. Bisher ging das bei der Wand nicht.

## Verhalten

- **Wand:** Ein Klick auf ein Achsende oder eine Körperecke startet sofort die Punktbearbeitung dieses Endes (wie bei Linie, Schraffur, Decke, Dach, Raum). Die Vorschau folgt der Maus mit Winkel/Länge-Eingabe; ein zweiter Klick setzt den Punkt. Vorher öffnete der Klick nur das Bearbeitungsmenü.
- **Stütze und Treppe:** Neu mit Eckgriffen (Stütze: Umriss, runde Stütze: Mittelpunkt; Treppe: Grundrissumriss). Ein Klick auf eine Ecke verschiebt das ganze Element mit dieser Ecke als Bezugspunkt (Gruppenverschiebung). Eine Stütze oder Treppe hat keine einzeln verformbaren Ecken.
- **Unverändert:** Fenster, Türen, Text, Maße und Schnittlinien – sie haben eigene Griffe.

## Umsetzung

- `src/components/cad/BimPlan.tsx`: Der Griffklick ruft `onCornerPick` jetzt für jeden Griff (vorher nur ohne Wandachse); Eckgriffe für Stützen (`columnOutline`) und Treppen (`stairPlan(...).outline`).
- `src/components/cad/CadWorkspace.tsx` (`onCornerPick`): Wände gehen wie Eckelemente in `dispatchEditing({type: "begin", action: "point", index, anchor})`; Stützen und Treppen starten `groupMove.begin(anchor)`. Referenzauswahl und gesperrte Ebenen bleiben geschützt.

## Nachweis

1464 Tests grün, Typprüfung beider Projekte, Architektur, Lint und Prettier sauber, 14-Modell-Hash unverändert (`089f79e4…`). Browser-Abnahme mit echtem Mausklick: Wandecke angeklickt → Vorschau folgt der Maus mit Eingabe, Klick setzt das Ende (Wand 3,608 m); Stütze gesetzt und angewählt → vier Eckgriffe, Klick auf eine Ecke → Stütze hängt mit dieser Ecke an der Maus. Die Treppe nutzt denselben Weg, wurde im Browser aber nicht eigens geprüft.
