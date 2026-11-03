# Erstellungsart als Piktogramm und Vorschau des fertigen Elements (03.11.2026)

Nutzerwunsch (03.11.2026):

- Die Zeichenart von Decke, Schraffur und den anderen Flächenwerkzeugen nicht mehr oben aus einer Liste wählen, sondern über ein kleines Piktogramm anklicken.
- Bei der Diagonale schon nach dem ersten Klick das fertige Element als Vorschau sehen, nicht nur die Linie. Das gilt für alle Werkzeuge, die so zeichnen.

Freigabe der Änderungskarte am 03.11.2026.

## Verhalten

- **Piktogrammleiste „Erstellung“:**
  - Ersetzt die Auswahllisten von Decke, Deckendurchbruch, Schraffur, Raum und Dachumriss, in der Werkzeugleiste wie im Einstellungsfenster.
  - Jeder Knopf zeigt seinen Namen als Tooltip, der aktive ist hervorgehoben.
  - Bedienbar als Optionsgruppe: Tab springt auf die Gruppe, die Pfeiltasten links/rechts wechseln die Art.
- **Arten und wo es sie gibt:**

| Piktogramm                           | Bedeutung                                  | Werkzeuge        |
| ------------------------------------ | ------------------------------------------ | ---------------- |
| Rechteck mit Zeiger                  | Klick in Raum zwischen Wänden              | Raum             |
| Vieleck mit Punkten                  | Polygon per Klick (Linie zu Linie)         | alle             |
| Rechteck mit gestrichelter Diagonale | Rechteck über die Diagonale                | alle             |
| gedrehtes Rechteck mit drei Punkten  | Rechteck über drei Punkte (Seite und Höhe) | alle             |
| gestrichelte Kontur mit Zeiger       | Geschlossene Kontur übernehmen             | alle             |
| Kreis mit Mittelpunkt und Radius     | Kreis: Mittelpunkt und Rand                | Deckendurchbruch |

- **Vorschau:** Während des Zeichnens steht am Mauszeiger schon das Element, das der nächste Abschlussklick erzeugt.
  - Diagonale: nach dem ersten Klick.
  - Drei Punkte: nach dem zweiten Klick.
  - Kreis: nach dem Mittelpunkt.
  - Polygon: als geschlossene Fläche ab dem zweiten Punkt.
  - Kontur übernehmen: die Kontur unter dem Zeiger.
- **Darstellung der Vorschau je Werkzeug:**
  - Deckendurchbruch: Umriss mit Eckkeil, Kreis halb schwarz (wie das fertige Symbol, docs/DECKENDURCHBRUCH.md).
  - Decke: ihre Kontur.
  - Raum: Umriss mit leichter Fläche.
  - Dachumriss: gestrichelte Kontur.
  - Schraffur: wie bisher mit Füllung oder Muster.
- Die Vorschau nutzt dieselbe Rechnung wie der Abschluss (Rechteck, Kreis, Kontur) und zeigt so genau das spätere Ergebnis.

## Umsetzung

- `components/cad/ConstructionPicker.tsx`: Leiste, Pictogramme und Namen (`CONSTRUCTIONS`); eingesetzt in `SlabToolFields`, `SlabOpeningToolFields`, `RoomToolFields`, `RoofToolFields` und im Schraffurwerkzeug in `CadWorkspace`.
- `components/cad/BimPlan.tsx`: neue Werte `draftShape` (Decke, Deckendurchbruch, Raum, Dach) und `draftCircle` (runder Durchbruch). Die Form kommt aus der bestehenden Konturberechnung (`draftContour`), das Symbol aus `slabOpeningSymbol`. `CadWorkspace` setzt beide je Werkzeug.

## Grenzen

- Beim Raum „zwischen Wänden“ gibt es keine Vorschau: Der Klick erzeugt den Raum sofort.
- Beim Dach erscheint die Vorschau nur im Umriss-Schritt. Bezugslinie und Anstiegsseite bleiben wie bisher.
- Die Wahl der Erstellungsart teilen sich Decke, Deckendurchbruch und Schraffur wie bisher. Der Kreis gilt nur für den Durchbruch, die anderen Werkzeuge behalten ihre zuletzt gewählte Art.
- Es gibt keine automatischen Oberflächentests, weil das Projekt keine Tests für React-Komponenten hat. Der Nachweis ist die Browserprüfung.

## Nachweis

- **Prüfungen:** 1536 Tests grün (keine neuen, siehe Grenzen), Typprüfung (App und Benchmarks), Lint, Architekturprüfung; 14-Modell-Hash `e42aa36e…` unverändert.
- **Browser** (Decke 6 × 4 m):
  - Die Leiste erscheint bei allen fünf Werkzeugen mit den richtigen Arten:
    - Deckendurchbruch: Diagonale, drei Punkte, Kreis, Polygon, Kontur.
    - Raum: zusätzlich „zwischen Wänden“.
    - Decke, Schraffur und Dachumriss: Polygon, Diagonale, drei Punkte, Kontur.
  - Deckendurchbruch über die Diagonale: Nach dem ersten Klick erscheint das ganze Rechteck mit Eckkeil am Zeiger. Der zweite Klick legt den Durchbruch an, die Vorschau verschwindet.
  - Kreis: Nach dem Mittelpunkt erscheint der halb schwarze Kreis mit dem Radius bis zum Zeiger.
  - Decke (Kontur), Raum (Umriss mit Fläche), Schraffur (Füllung) und Dachumriss (gestrichelt, nach Bezugslinie und Seite) zeigen ihre Vorschau nach dem ersten Klick.
  - Einstellungsfenster „Decke – Einstellungen“ mit derselben Leiste; die Pfeiltaste rechts wechselt von Diagonale zu drei Punkten.
  - Keine Konsolenfehler.
  - Hinweis zur Prüfung: Die Mausbewegung des Testwerkzeugs löste keine Zeigerbewegung aus. Die Bewegung zur Vorschau wurde deshalb per Skript als Zeigerereignis gesendet, die Klicks liefen normal.
