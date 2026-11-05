# Transparenzpause

## S4 – Transparenzpause im Navigator

Nutzervorgabe (01.11.2026): Unten im Navigator ein kleiner Bereich für eine Transparenzpause. Aktiv zeigt sie z. B. das Geschoss darunter, damit Wände zuverlässig übereinander gezeichnet werden können. Geschoss frei wählbar, Transparenz und Farbe einstellbar; der Fang rastet auch an den Elementen der Pause ein. Entscheidungen: nur für die Sitzung, ein Geschoss, Inhalt Wände und Stützen.

- **Bedienfeld** unter dem Navigator: „Transparenzpause“ an/aus (ohne zweites Geschoss gesperrt), Geschoss (alle außer dem Arbeitsgeschoss, Vorgabe das Geschoss darunter, sonst darüber), Deckkraft 10–80 % (Vorgabe 35 %), Farbe Grau/Blau/Rot/Grün oder eigene, „Fang an der Pause (Wände, Stützen)“ (Vorgabe an).
- **Darstellung:** Wände (Körperumriss) und Stützen des gewählten Geschosses als einfarbige, durchscheinende Flächen unter allen Elementen des Grundrisses; nicht anwählbar. Wird das Pausengeschoss zum Arbeitsgeschoss oder gelöscht, springt die Wahl auf die Vorgabe.
- **Fang:** Die Wände und Stützen der Pause kommen als zusätzliche Fangquellen hinzu (Endpunkte, Kanten, Achsen, Stützenmitten). Ein so gefangener Punkt ist ein reiner Punkt: Er verliert den Bezug zum anderen Geschoss, sonst würde ihn z. B. das Wandwerkzeug als Anschluss an eine Wand deuten, die es im Arbeitsgeschoss nicht gibt (im ersten Browsertest: „T-Startziel ist nicht mehr korrekt“ – behoben). Die Fangmarke zeigt „Endpunkt“ usw. wie sonst.
- Sitzungszustand, nicht in der Datei; Schema unverändert.

Umsetzung: `src/application/views/tracing.ts` (Zustand, Vorgaben, Umrisse, Fangquellen), `src/application/tools/snapping.ts` (`createTracedToolSourceQuery`), `src/constraints/snapping/local-source-index.ts` (kombinierter Index mit eigenem Begrenzungsrahmen, damit er erneut kombiniert werden kann), `src/components/cad/TracingPanel.tsx`, `BimPlan.tsx` (Darstellung, Fangabfrage, Punkte der Pause ohne Geschossbezug), `CadWorkspace.tsx` (Zustand, Bedienfeld unter dem Navigator).

Grenzen: Wände als Körperrechteck je Wand (Ecken nicht verschnitten); Öffnungen, Decken und 2D-Elemente des Pausengeschosses nicht gezeigt (Nutzerwahl); Höhenbezug spielt keine Rolle (nur Grundrisslage).

Nachweis: `src/application/views/tracing.test.ts` (3 Tests: Vorgabegeschoss darunter/darüber, Wandumriss mit Dicke; Fangquellen mit Wandende; die Werkzeug-Fangabfrage bietet die untere Wand nur mit Pause an). 1464 Tests grün, Typprüfung beider Projekte, Architektur, Lint und Prettier sauber, 14-Modell-Hash unverändert. Browser-Abnahme (Startprojekt): im 1. OG Pause eingeschaltet – die EG-Wand erscheint blass, Farbe Rot umgestellt; Wandwerkzeug am Pausen-Wandende zeigt „Endpunkt“; eine Wand von Pausenende zu Pausenende wurde gezeichnet (nach der Korrektur ohne Anschlussfehler). Ihre Länge war 2,9988 m statt 3 m: Ein Ende rastete, beim Wandanfang greift womöglich die T-Achsen-Regel des Wandwerkzeugs statt des Endpunkts – nicht abschließend geklärt, weil der Nutzer währenddessen im selben Fenster arbeitete und der Test abgebrochen wurde.

## Nacharbeit: Wandanfang am Pausenende (01.11.2026)

Befund: Ein Wandanfang am Ende einer Pausenwand lag 1,2 mm daneben (Wand 2,9988 m statt 3 m). Ursache: Der Wandfang bietet auf jeder Wandachse den Lotfußpunkt des Mauszeigers als T-Anschlusspunkt an – auch auf den Achsen der Pause. Kurz vor dem Wandende gewann dieser Punkt gegen den Endpunkt.

Behebung: `acceptsTraceCandidate` (`src/application/views/tracing.ts`) lässt bei eingeschaltetem Pausenfang keine T-Anschlusspunkte auf Pausenwänden zu; Endpunkte, Ecken und Kanten der Pause rasten weiter ein. Eine Wand des anderen Geschosses ist ohnehin nie Anschlusswand.

Nachweis: neuer Test in `src/application/views/tracing.test.ts` (ohne Filter gewinnt der Achspunkt, mit Filter genau das Wandende); 1465 Tests grün, Typprüfung beider Projekte, Architektur, Lint und Prettier sauber, 14-Modell-Hash unverändert. Browser: Obergeschoss mit Pause des Erdgeschosses, Wand von Pausenende zu Pausenende gezeichnet – Länge genau 3 m; Testwand danach zurückgenommen.
