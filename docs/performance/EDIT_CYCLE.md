# Wartezeit, Teil A – Bearbeitungszyklus (26.10.2026)

Änderungskarte „Wartezeit, Teil A“ mit den drei Empfehlungen freigegeben: Übernehmen vertraut nur dem eigenen geprüften Stand, Wandextrusion pro Wand mit Eingabeschlüssel, Abnahme l und x ≥ 40 % schneller, Undo/Redo nicht langsamer, Ergebnis identisch.

## Befund vorher

Je Bearbeitung „Wandlänge“ (Node, x): Vorschau 182 ms, Übernehmen 173 ms (zweite Ausführung desselben Befehls), Wandkörper für die Darstellung 176 ms, Fang-Index 88 ms, Commit 5 ms. CPU-Profil: `extrudeProfileWithOpenings` ≈ 40 % der Zeit; alle Wände des Arbeitsgeschosses wurden je Bearbeitung dreimal vollständig extrudiert (Prüfung der Vorschau, Prüfung beim Übernehmen, Darstellung).

## Änderungen

- **A1** (`application/commands/selection-command.ts`): Übernehmen gibt das Vorschauergebnis zurück, wenn es genau diese Vorschau erzeugt hat (Herkunft in einer privaten WeakMap mit Text und Ergebnis), es ein eigener, eingefrorener, vollständig geprüfter Stand ist und Basis, Auswahl, Sichtbarkeit und Kalibrierung unverändert sind. Kopierte Vorschauen, getauschte Ergebnisse, geänderter Text und veränderliche Modelle führen die Aktion wie bisher neu aus.
- **A2** (`domain/elements/wall/contour-solid.ts`): `wallContourSolid` teilt die lokale Extrusion über Stände und Projekte hinweg. Schlüssel sind die exakten Eingaben (Profil, Höhe, Öffnungen, Zuschnitt); ein Eintrag je Wand und Zuschnittsmodus, Obergrenze 65 536 Einträge, danach Neubeginn. Abweichung von der Karte: statt „beim Projektwechsel leeren“ eine feste Obergrenze, weil der Schlüssel das Ergebnis vollständig bestimmt (ein fremdes Projekt kann keinen falschen Treffer erzeugen) und der Domänencode keinen Projektwechsel kennt.

## Nachweis

- **Gleichheit** (`benchmarks/edit-cycle-equality.ts`, Schulmodell s): 13/13 Befehle (Wandlänge, Fenster, Tür, Versatz, Verschieben, Löschen, mehrere Geschosse) liefern über den neuen Weg dasselbe Modell wie das erneute Ausführen und dieselben Wandkörper wie die ungecachte Ableitung; Gegenprobe (1e-9 an einem Eckpunkt) wird erkannt. 4 Fälle lehnt die Fachregel ab (T-/Eckanschluss verlangt gleiche Wandstärke und Höhe), identisch auf beiden Wegen.
- **Tests** (`application/commands/apply-reuse.test.ts`): Vertrauensregeln und Extrusionsteilung; Gegenprobe mit altem Übernehmen und abgeschaltetem Cache schlägt fehl. 1249 Tests.

## Messung

Node, Median je Bearbeitung (`benchmarks/edit-cycle-profile.ts`):

| ms                     | s vorher → nachher | l                | x                 |
| ---------------------- | ------------------ | ---------------- | ----------------- |
| Vorschau               | 16 → 11            | 49 → 32          | 182 → 79          |
| Übernehmen             | 16 → 0             | 44 → 0           | 173 → 0           |
| Wandkörper Darstellung | 6,5 → 1,7          | 18,7 → 4,2       | 176 → 76          |
| Fang-Index             | 16 → 18            | 60 → 57          | 88 → 82           |
| Summe                  | 56 → 32 (−43 %)    | 177 → 98 (−45 %) | 623 → 242 (−61 %) |

Browser-Schullauf, abwechselnd vorher/nachher auf demselben Rechner (`benchmarks/edit-cycle-results.json`):

| Median ms          | s                     | l                 | x                 |
| ------------------ | --------------------- | ----------------- | ----------------- |
| Bearbeitungszyklus | 103 → 78–80 (−23 %)   | 291 → 213 (−27 %) | 956 → 496 (−48 %) |
| Undo               | 14 → 14 (ein Lauf 34) | 14 → 14           | 14 → 14           |
| Redo               | 102 → 77–84           | 194 → 147         | 543 → 302         |
| Fang p95           | 14 → 14               | 20 → 20           | 507 → 28          |
| Löschen            | 138 → 111–127         | 409 → 333         | 1923 → 723        |
| 2D → 3D            | 133 → 112–118         | 280 → 219         | 1580 → 963        |
| 3D-Tür ziehen      | 865 → 660–687         | 2357 → 2133       | –                 |

## Abnahme

- x: −48 % – **erfüllt**.
- l: −27 % – **nicht erfüllt** (Schwelle 40 %). In Node −45 %; im Browser bleiben je Bearbeitung der vollständige Neuaufbau des Fang-Index (≈ 57 ms), die Vorschauprüfung (≈ 32 ms) und das Rendern.
- Undo/Redo nicht langsamer – erfüllt (ein s-Lauf mit Undo-Median 34 ms, Wiederholung 14 ms).
- Ergebnis identisch – erfüllt.

## Grenzen und Befunde

- Ein Rechner, nur Chromium, ein bis zwei Läufe je Größe.
- Der Fang-Index wird je Bearbeitung vollständig neu gebaut; das ist der größte Rest bei s/l (Kandidat Teil B).
- 3D-Tür ziehen bei l bleibt ≈ 2,1 s (Kandidat Teil B).
- Fachregel: T- und Eckanschlüsse verlangen gleiche Wandstärke und Höhe; die Fehlermeldung des Wandbefehls nennt dann fälschlich das Fenster („… das Fenster vollständig in die Wand passen“).
- Der Extrusions-Cache hält höchstens einen lokalen Körper je Wand (bei x etwa so viel wie die Wandkörper des aktuellen Stands) und wird nicht beim Projektwechsel, sondern erst an der Obergrenze geleert.
