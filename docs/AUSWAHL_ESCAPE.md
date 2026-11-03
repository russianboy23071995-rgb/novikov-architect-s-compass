# Escape hebt die Auswahl auf (03.11.2026)

Beim Canvas-Test (docs/performance/SECTION_CANVAS.md) fiel auf: Escape hob im Grundriss die Auswahl einer Wand nicht auf. Nutzerentscheidung vom 03.11.2026: zweistufig.

## Befund

- Escape brach bisher laufende Vorgänge ab, schloss das On-Demand-Menü und Fehlermeldungen, wechselte zum Auswahlwerkzeug und wählte eine Schnittlinie ab (docs/SCHNITT.md, SC5).
- Die Auswahl von Bauteilen hob es nie auf. Das ist also kein Rückschritt.
- Dass nach einem Redo „0 selected“ stand, lag am Redo: Undo und Redo heben die Auswahl immer auf.

## Verhalten

1. **Läuft ein Vorgang**, beendet das erste Escape ihn, und die Auswahl bleibt. Vorgänge sind:
   - ein Zeichenwerkzeug (Wand, Linie, Schraffur, Decke, Dach, Raum, Maß, Text, Treppe, Schnitt, Messen),
   - eine Bearbeitung mit Griff,
   - das Verschieben einer Auswahl,
   - ein Entwurf mit gesetzten Punkten,
   - Bildeinfügen und Kalibrieren.
2. **Läuft nichts**, hebt Escape die Auswahl auf. Das gewählte Bauteil verliert dabei auch den Tastaturfokus.
3. **Hat ein anderer Teil den Tastendruck verbraucht**, bleibt die Auswahl. Das sind:
   - eine laufende Rahmenauswahl,
   - das Ziehen einer Maske,
   - das Verschieben der Ansicht,
   - die Liste überlappender Bauteile.
4. **In Eingabefeldern und Dialogen** behält Escape seine eigene Bedeutung, etwa einen Wert zurücksetzen. Die Auswahl bleibt.
5. **Das On-Demand-Menü** öffnet sich mit jeder Auswahl. Escape schließt es und hebt die Auswahl im selben Druck auf. Diese Abweichung von der Änderungskarte stand dort noch nicht: Ohne sie bräuchte jedes Abwählen zwei Drücke.

Das gilt für Grundriss, Schnitt-Tab, Layout und 3D. Die 3D-Bearbeitung läuft über dieselbe Bearbeitungssitzung.

## Umsetzung

- `components/cad/escape-step.ts`: Entscheidung „nichts, abbrechen, abwählen“ aus drei Werten: verbraucht, läuft, ausgewählt.
- `CadWorkspace.tsx`: Die Tastenbehandlung merkt sich je Darstellung, ob etwas läuft und ob etwas ausgewählt ist, und wählt bei „abwählen“ ab.
- `BimPlan.tsx` und `useOverlapCycle.ts`: Rahmenauswahl, Maskenziehen, Verschieben der Ansicht und die Überlappungsliste markieren den Tastendruck als verbraucht (`preventDefault`). Das ist dieselbe Regel, die `FloatingPanel` schon nutzt.

## Nachweis

- **`benchmarks/escape-step.test.ts`:** beide Stufen und verbrauchte Tastendrücke.
- **Prüfungen:**
  - 1551 Tests grün,
  - Typprüfung, Lint (eine Warnung, die es vorher schon gab), Architekturprüfung ohne Befund,
  - 14-Modell-Hash `e42aa36e…` unverändert.
- **Browser** (Gesamtmodell 3 000, Grundriss):
  1. Wand gewählt, Escape: „0 selected“, der Fokus liegt nicht mehr auf der Wand.
  2. Wand gewählt, Wandwerkzeug (W), Escape: Werkzeug aus, „1 selected“; nochmals Escape: „0 selected“.
  3. Wand gewählt, Escape im Feld „Wandhöhe“: „1 selected“, der Fokus bleibt im Feld.
  4. Keine Konsolenfehler.

## Grenzen

- **Im Browser nicht geprüft:** Escape während einer laufenden Rahmenauswahl, beim Maskenziehen und bei der Überlappungsliste. Das lässt sich hier nicht mit gehaltener Maustaste nachstellen. Belegt ist es nur durch den Code und den Test der Entscheidung.
- **Ebenfalls im Browser nicht geprüft:** Schnitt-Tab, Layout und 3D. Sie nutzen dieselbe Tastenbehandlung.
