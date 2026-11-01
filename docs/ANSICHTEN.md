# Ansichten

Nutzervorgabe (01.11.2026): mit den Ansichten weitermachen. Eine Ansicht ist technisch ein Schnitt ohne geschnittene Bauteile: Ihre Linie liegt vor dem Gebäude, gezeigt wird alles, was in Blickrichtung dahinter liegt.

| Schritt | Inhalt | Stand |
| --- | --- | --- |
| A1 | Ansicht als eigene Art, Werkzeug „Ansicht“, „Vier Ansichten erzeugen“, Ordner im Navigator, Zeichnung ohne Schnitt | erledigt |

## A1 – Ansichten

- **Modell:** Schnitte bekommen das optionale Merkmal `kind: "elevation"` (fehlt: Schnitt). Schema bleibt 42; Ansichten speichern sich wie Schnitte (Name, Kennung, Linie, Blickseite, Symbolgröße).
- **Werkzeug „Ansicht“** in der Rubrik DOK (wird in gespeicherten Anordnungen automatisch dort angehängt): Klick Anfang, Klick Ende, Klick Blickrichtung wie beim Schnitt. Vorgaben: Kennung Zahlen 1, 2, … (oder Buchstaben), Name „Ansicht“ → „Ansicht 1“; Kennungen laufen getrennt von den Schnitten.
- **„Vier Ansichten erzeugen“** (Knopf im Werkzeug): Nord-, Ost-, Süd- und Westansicht (Kennung N, O, S, W) um den Umriss aller Wände (mit Dicke) und Decken aller Geschosse, 2 m Abstand, je 1 m über das Gebäude hinaus, jede blickt zum Gebäude. Schon vorhandene Kennungen N/O/S/W werden übersprungen; ohne Wände oder Decken kommt ein Hinweis.
- **Grundriss:** dünne durchgezogene Linie mit kurzen Endstrichen, in der Mitte ein gefülltes Dreieck zur Blickseite, die Kennung dahinter. Größe wie beim Schnittsymbol (mm Papier/m Modell). Auswählen, Griffe, Verschieben, Länge und Fenster wie beim Schnitt (SC5).
- **Navigator:** neuer Ordner „Ansichten“; „Schnitte“ zeigt nur noch Schnitte. Klick öffnet die Ansicht als Tab, Doppelklick ihr Fenster („… – Ansicht“).
- **Zeichnung:** dieselbe wie beim Schnitt, aber ohne geschnittene Teile – auch wenn die Linie durch das Gebäude läuft. Sichtbare Kanten, Fenster-/Türelemente, Geschosslinien mit Höhen. Trifft der Blick nichts, steht ein Hinweis.

Grenzen: Verdecken nach dem Malerverfahren wie beim Schnitt (Fehler bei sich durchdringenden schrägen Flächen möglich); keine Tiefenbegrenzung, keine Schattierung oder Materialfarben, keine Geländelinie; Bemaßung und Ablage als Abbild fehlen wie beim Schnitt.

Umsetzung: `src/domain/views/sections.ts` (`kind`, `isElevation`, `elevationName`), `src/application/sections/actions.ts` (`ELEVATION_TOOL_DEFAULTS`, Kennung je Art, `addFourElevations`), `src/rendering/viewport/section-drawing.ts` (keine Schnitte bei Ansichten), `src/components/cad/SectionPlanGraphic.tsx` (Ansichtssymbol), `SectionFields.tsx` (Knopf), `ProjectNavigator.tsx` (Ordner), `tool-icons.tsx`/`rail-tools.ts`/`tool-layout.ts` (Werkzeug), `BimPlan.tsx`, `CadWorkspace.tsx`, `SectionDrawingView.tsx`.

Nachweis: neuer Test in `src/application/sections/actions.test.ts` (Kennung und Name je Art, „Vier Ansichten“ mit Lage 2 m vor dem Umriss, kein zweites Mal, ohne Bauteile abgelehnt; Südansicht ohne Schnitt mit Ansichtsflächen, Ansichtslinie durch das Gebäude schneidet nicht), `tool-layout.test.ts` angepasst. 1454 Tests grün, Typprüfung beider Projekte, Architektur, Lint (nur die bekannte Warnung in RoofProperties.tsx) und Prettier sauber, 14-Modell-Hash unverändert.

Browser-Abnahme (01.11.2026, Port 8094, Startprojekt): Werkzeug „Ansicht“ in der Leiste (DOK), Felder mit „Nächster: Ansicht 1“ und Knopf; „Vier Ansichten erzeugen“ legt N/O/S/W mit Blickpfeilen zur Wand, Navigator „Ansichten“ mit vier Einträgen; Klick auf „S · Südansicht“ öffnet den Tab: Wandfläche mit Fensteröffnung, keine Schnittflächen, Geschosslinien ±0,00/+3,00. Eine von Hand gezeichnete Ansicht und Griffe an Ansichten nur durch den gemeinsamen Code mit dem Schnitt abgedeckt, nicht eigens im Browser geprüft.
