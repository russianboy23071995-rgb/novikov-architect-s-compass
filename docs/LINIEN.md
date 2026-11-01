# Linien

## S3 – Längen-Hilfslinie

Nutzervorgabe (01.11.2026): Ist eine Linie oder ein Linienabschnitt ausgewählt, entsteht eine Hilfslinie mit der Länge. Ein Klick auf die Zahl erlaubt eine neue Länge. Links und rechts der Zahl zwei türkise Pfeile: Sie bestimmen, in welche Richtung sich die Linie ändert; beide gewählt, bleibt die Mitte und die Änderung teilt sich auf beide Seiten auf. Entscheidungen: ohne Wahl nach rechts; bei mehrteiligen Linien nur der angeklickte Abschnitt.

- Mit dem Pfeil-Werkzeug eine Linie anklicken: Neben dem Abschnitt, der dem Klick am nächsten liegt, erscheint eine gestrichelte türkise Maßlinie mit Hilfslinien zu den Enden und der Länge in einem Feld.
- Klick auf die Zahl öffnet ein Eingabefeld (über der Zeichnung): Enter übernimmt, Esc oder Verlassen ohne Änderung bricht ab. Ein Rückgängig-Schritt.
- Die Pfeile zeigen entlang des Abschnitts zu seinen Enden; gefüllt = gewählt. Vorgabe ist der Pfeil, der auf dem Bildschirm nach rechts zeigt (bei senkrechten Abschnitten nach oben). Ein Klick schaltet einen Pfeil um; der letzte gewählte Pfeil lässt sich nicht abwählen. Beide gewählt: Die Mitte bleibt, beide Enden bewegen sich je um die Hälfte.
- Mehrteilige Linien: Nur der angeklickte Abschnitt ändert seine Länge in seiner Richtung; der bewegte Eckpunkt nimmt den Nachbarabschnitt mit. Bei geschlossenen Linien bleibt der Schluss erhalten.

Umsetzung: `src/application/lines/actions.ts` (`setLineSegmentLength`, `LengthDirection`), `src/components/cad/LineLengthHelper.tsx` (Maßlinie, Pfeile, Zahl als SVG, Eingabe über ein Portal – `foreignObject` wurde in der skalierten Zeichnung von Chrome versetzt und unsichtbar dargestellt), `BimPlan.tsx` (Abschnitt nach dem Klickpunkt), `CadWorkspace.tsx`.

Nachweis: `src/application/lines/length.test.ts` (2 Tests: Ende, Anfang, beide; Fehler bei 0 und unbekanntem Abschnitt; Polylinien-Abschnitt mit Nachbar, geschlossene Linie bleibt geschlossen). 1461 Tests grün, Typprüfung beider Projekte, Architektur, Lint und Prettier sauber. Browser-Abnahme: Linie 2,055 m gezeichnet und angewählt – Hilfslinie mit Zahl, rechter Pfeil gefüllt; Zahl angeklickt, 3 eingegeben → 3 m, Anfang bleibt; linken Pfeil dazu, 2 eingegeben → beide Enden gleich gekürzt. Mehrteilige Linien im Browser nicht geprüft (Tests).
