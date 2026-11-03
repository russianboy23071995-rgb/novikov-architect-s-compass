# Tabs über der Zeichenfläche (03.11.2026)

Nutzerentscheidung vom 03.11.2026: Die Leiste bleibt, wie sie aussieht. Es gibt kein Anheften und kein Verschieben. Es gilt nur eine Regel, welche Zeichnungen sich einen Tab teilen. So öffnet niemand versehentlich Hunderte Schnitt-Tabs, und auf dieser Grundlage lässt sich später ein geteilter Bildschirm einführen, etwa Ansicht und Grundriss nebeneinander.

## Regel: höchstens ein Tab je Art

| Tab               | was darin aufgeht                           |
| ----------------- | ------------------------------------------- |
| Draufsicht        | alle Grundrisse und Grundriss-Abbilder      |
| Schnitt / Ansicht | alle Schnitte, Ansichten und deren Abbilder |
| 3D-Ansicht        | die 3D-Ansicht                              |
| Layoutbuch        | Layouts, Masterlayouts und Plankopfplaner   |

- Öffnet man eine Zeichnung einer Art, die schon einen Tab hat, wechselt dessen Inhalt; der Tab behält seinen Platz. Die Beschriftung nennt den Inhalt, zum Beispiel „Grundriss Geschoss 4“, „Schnitt A-A“ oder „Plan 2“.
- Das Plus-Menü bietet die vier Arten an und öffnet den zuletzt gezeigten Inhalt der Art, sonst den ersten. Eine Art ohne Inhalt ist ausgegraut, etwa ein Projekt ohne Schnitte.
- Schließen bleibt wie bisher: Der letzte Tab bleibt offen.
- Ein fünfter Tab für Auswertungen und Bauteilnachweise ist im Code als Art vorgesehen (`CanvasTabKind`), aber noch nicht sichtbar.

## Zoom je Inhalt

Grundriss, Layouts, Plankopf und Abbilder merken sich ihren Ausschnitt schon je Ansicht (`view-cameras.ts`). Neu merkt sich auch jeder Schnitt und jede Ansicht ihren Ausschnitt (`rememberSectionBox`). Kommt der Schnitt wieder in den gemeinsamen Tab, ist der Ausschnitt derselbe. „Einpassen“ vergisst ihn. Das gilt nur für die Sitzung und gehört nicht ins Projekt.

## Umsetzung

- `application/views/canvas-tabs.ts`:
  - `canvasTabKind` ordnet jede Ansicht einer Art zu.
  - `withCanvasTab` setzt eine Ansicht an die Stelle des Tabs ihrer Art.
  - Ein älterer Stand mit mehreren Tabs einer Art behält nur den ersten.
- `CanvasTabs.tsx`: Das Plus-Menü bietet die Arten an.
- `CadWorkspace.tsx`: merkt sich den letzten Inhalt je Art.
- `SectionDrawingView.tsx`: holt den gemerkten Ausschnitt zurück.

## Bewertung

- **Was dafür spricht:**
  - eine übersichtliche Leiste,
  - nur eine aktive Schnittzeichnung gleichzeitig,
  - die vier Arten sind die Bausteine für den späteren geteilten Bildschirm.
- **Nachteil:** Zwischen zwei Schnitten wechselt man über den Navigator statt per Tab, also mit einem Klick mehr. Dass der Zoom je Schnitt erhalten bleibt, fängt den größten Teil davon ab.
- **Laufende Eingaben:** Wechselt der Inhalt, etwa beim Setzen von Höhenkoten, wird die Eingabe wie bei jedem Tabwechsel abgebrochen.

## Nachweis

- **`canvas-tabs.test.ts`:**
  - Ein Tab je Art, der Inhalt wechselt an derselben Stelle.
  - Layout und Plankopf teilen sich einen Tab.
  - Ein älterer Stand mit mehreren Schnitt-Tabs wird zusammengeführt.
- **Prüfungen:**
  - 1553 Tests grün,
  - Typprüfung, Lint (eine Warnung, die es vorher schon gab), Architekturprüfung ohne Befund,
  - 14-Modell-Hash `e42aa36e…` unverändert.
- **Browser** (Gesamtmodell 3 000):
  - Schnitt A-A, dann B-B, dann Südansicht, dann wieder A-A: Es gibt immer nur einen Schnitt-Tab an derselben Stelle. Der Zoom von A-A ist nach dem Zurückwechseln exakt gleich.
  - Geschosswechsel: Der Grundriss-Tab heißt danach „Grundriss Geschoss 4“.
  - Plus-Menü: Draufsicht und Schnitt/Ansicht stehen als „offen“ da. 3D und Layoutbuch öffnen je einen Tab.
  - Plan 2 aus dem Navigator ersetzt Plan 1 im Layoutbuch-Tab.
  - Keine Konsolenfehler.

## Grenzen

- Ein Abbild öffnet sich wie bisher über den Navigator.
- Den Wechsel zwischen Layout und Plankopfplaner habe ich nur im Test geprüft, nicht im Browser.
