# Mehrgeschossige Wände und Gast-Anzeige (L01, L02)

Nutzerauftrag 07.11.2026: „Go L01/L02“ auf die Änderungskarte. Die Vision vom 27.10.2026: Wände über mehrere Geschosse, zum Beispiel EG bis 3. OG oder Fensterfronten über Geschosse, und im Grundriss die Wände anderer Geschosse zeigen, wenn sie die Schnittebene durchstoßen.

Entscheidungen (Empfehlungen übernommen): Eine Wand gehört weiter zu genau einem Geschoss, ihrem Heimatgeschoss (A08), und reicht bis zu einem gewählten höheren Geschoss. Andere Geschosse zeigen sie als Gast, geschnitten und blasser; bearbeitet wird sie nur im Heimatgeschoss. Die Gast-Anzeige gilt zunächst nur für Wände.

## M1 – Wand über mehrere Geschosse

- **Bedienung:** Wandeigenschaften → Höhenmodus „An Geschoss gebunden“ → „Höhe bis“. Zur Wahl stehen „OK Rohfußboden“ jedes höheren Geschosses und „Oberkante“ des obersten Geschosses. Die Zusatzhöhe gilt wie bisher oben drauf.
- **Schema 66:** In der Bindung der Wand das optionale Feld `storeys` (2 bis 50), es zählt das Heimatgeschoss mit. Ohne Feld endet die Wand wie bisher am Geschoss darüber. Eine 65er Datei lädt unverändert, mit `storeys` wird sie abgelehnt.
- **Höhe:** Die Höhe wird wie bisher beim Laden und bei jeder Änderung aus den Geschosshöhen berechnet (`boundUpperElevation`). Ändert sich die Höhe eines überspannten Geschosses, wandert die Oberkante mit. Reicht die Bindung über das oberste Geschoss hinaus, lehnt das Programm sie mit einer Meldung ab.
- **Z-Verschieben:** Die Spanne bleibt, die Zusatzhöhe ändert sich um den Versatz.
- **3D:** Der Körper geht durch alle überspannten Geschosse.

Nachweis: Tests in `src/application/walls/multi-storey.test.ts` mit Bindung über 2 Geschosse (Höhe = EG + OG + Zusatz), Datei hin und zurück, Ablehnung über das oberste Geschoss, Z-Verschieben, Format 65.

Browser, Projekt mit EG 3 m, 1. OG 3 m, 2. OG 2,5 m: Die Frontwand im EG zeigt „Höhe bis“ mit drei Zielen: OK Rohfußboden 1. OG, OK Rohfußboden 2. OG, Oberkante 2. OG. Gebunden bis OK Rohfußboden 2. OG ist sie 6 m hoch, bis Oberkante 2. OG 8,5 m. In 3D steht sie durchgehend in voller Höhe.

Grenze bis M2: Im Grundriss des 1. und 2. OG ist die Wand noch nicht zu sehen.

## M2 – Gast-Anzeige im Grundriss

Jedes Geschoss zeigt die Wände anderer Geschosse, die seine Schnittebene durchstoßen. Die Schnittebene liegt wie bei allen Bauteilen 1 m über dem Fußboden. Gilt für gebundene Wände über mehrere Geschosse und für fest hohe Wände gleichermaßen.

- **Darstellung:** geschnitten wie eine eigene Wand, mit derselben Schnittfüllung und dem Bauzustand, aber halb durchsichtig und unter den eigenen Wänden. Beim Zeigen erscheint „Wand aus Erdgeschoss“. Der Umriss ist der verbundene Umriss aus dem Heimatgeschoss.
- **Fang:** Ecken und Kantenmitten einer Gastwand sind Fangpunkte.
- **Ebenen:** Ist die Ebene der Wand ausgeblendet, fehlt auch der Gast.
- **Code:** `guestWalls` in `src/domain/elements/wall/guests.ts`, eigener Lauf „guestWall“ im Grundriss (`plan-scene.ts`, `PlanSceneRun.tsx`).

Grenzen bis M3 und M4: Ein Gast ist noch nicht anwählbar, und seine Fenster und Türen zeigt der Grundriss des Gastgeschosses noch nicht. Ecken und T-Stöße zwischen einem Gast und den Wänden des Geschosses bildet der Grundriss nicht nach. Beide Umrisse liegen übereinander.

Fangbeschriftung: „Wand aus Erdgeschoss · Ecke 1“ oder „… · Kantenmitte“.

Nachweis im Browser, Projekt wie bei M1, die Frontwand im EG bis OK Rohfußboden 2. OG gebunden (6 m): Im 1. OG erscheint die Frontwand als blasser Gast „Wand aus Erdgeschoss“. Die eingeschossige Seitenwand erscheint dort nicht. Im 2. OG gibt es keinen Gast, die Wand endet an dessen Fußboden, seine Schnittebene liegt bei 7 m. Im EG ist die Wand eine eigene Wand, kein Gast. Linienwerkzeug im 1. OG, Klick 3 cm neben der Gastecke: Der Punkt rastet genau auf der Ecke (0 | −0,15) ein.
