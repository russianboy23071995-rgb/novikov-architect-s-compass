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
