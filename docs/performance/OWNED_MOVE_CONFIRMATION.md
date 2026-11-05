# Z-/XY-Bewegung ohne erneute Gesamtprüfung beim Übernehmen (27.10.2026)

Änderungskarte „Z-Bewegung bei großem Modell beschleunigen“ mit den Empfehlungen freigegeben: Beim Übernehmen einer Z- oder XY-Gruppenbewegung wird ein eigener, unveränderlicher Projektstand nicht erneut vollständig geprüft; fremde oder veränderbare Eingaben weiter vollständig.

## Befund

Schullauf (PR480) bei x: „Z: Übernehmen“ ≈ 1,1 s. Node-Zerlegung je Z-Bewegung: Übernehmen (`materialize`) l 134–160 ms, x 440–510 ms; Verlauf eintragen ≈ 5 ms; Gebäude für 3D neu aufbauen x 170–234 ms (auch nach Undo). CPU-Profil über 8 Übernahmen bei x: 2,4 von 2,9 s in `prepareProjectSnapshot.assertCurrent` (`domain/project/prepared-snapshot.ts`) – die Prüfung „Modell seit Start unverändert“ validierte das aktuelle Projekt jedes Mal vollständig (einschließlich aller Wandkörper) und verglich es mit dem Startstand. Dieselbe Funktion nutzt die XY-Gruppenbewegung (`prepared-translation.ts`).

## Umsetzung

`prepared-snapshot.ts`: Ist der Ausgangsstand ein eigener Projektstand (`isOwnedProjectSnapshot`: vollständig geprüft und tief eingefroren), genügt beim Übernehmen der Identitätsvergleich `current === source` – derselbe unveränderliche Stand kann sich nicht geändert haben. Jede andere Eingabe wird wie bisher vollständig validiert und verglichen. Diagnosezähler `fullConfirmationCount` für Tests. Gleiche Garantie wie bei Bearbeiten/Undo (`validateLike`, PR440–444). Die abschließende Gesamtprüfung des neuen Stands bei XY (`validateProject` im `materialize`) bleibt unverändert.

## Nachweis

- Tests (`src/application/selection/z-translation.test.ts`): eigener Stand → Z und XY ohne Gesamtprüfung (Zähler unverändert), Ergebnis gleich dem einer veränderbaren Kopie mit voller Prüfung (JSON-Vergleich); Gegenproben: anderer Projektstand (auch inhaltsgleich) wird abgelehnt, eine nach dem Start veränderte veränderbare Eingabe wird erkannt. 1327 Tests grün.
- Node (`benchmarks/owned-move-profile.ts`, Median aus 7, Ergebnisse byte-gleich vorher/nachher per Hash):

| Übernehmen, ms | l vorher | l nachher | x vorher | x nachher |
| -------------- | -------- | --------- | -------- | --------- |
| Z-Bewegung     | 151      | 14        | 401      | 59        |
| XY-Bewegung    | 253      | 102       | 665      | 307       |

- Browser-Schullauf (Produktionsbuild, je ein Lauf vorher/nachher, alle Schritte ok, Inhalt nach Wiederherstellung gleich):

| ms                   | l vorher  | l nachher | x vorher  | x nachher |
| -------------------- | --------- | --------- | --------- | --------- |
| Z: Übernehmen        | 305       | 220       | 1093      | 689       |
| Z: Undo / Redo       | 179 / 167 | 167 / 178 | 701 / 710 | 621 / 622 |
| Wandlänge übernehmen | 205       | 156       | 414       | 373       |

## Grenzen und Befunde

- Im Browser bleibt bei x „Z: Übernehmen“ ≈ 0,7 s und Undo/Redo ≈ 0,6 s: Neuaufbau des geänderten Geschosses für 3D und Darstellung (bei jeder Bearbeitung, nicht Z-spezifisch; AUD14-03/04).
- Neuer Befund: Bei x kostet „Z: Bewegung starten, Ursprung wählen“ 2,5–3,3 s (lange Aufgabe), bei l ≈ 0,2 s – vermutlich Vorbereitung der Ursprungs-/Fangdaten über das ganze Gebäude. Nicht zugeordnet; eigener Kandidat.
- Je ein Browserlauf vorher/nachher; Node-Werte als Hauptbeleg.
- Unverändert: Eine in Z bewegte Wand verliert ihre Anschlüsse zu nicht mitbewegten Nachbarn (bestehende Regel).
