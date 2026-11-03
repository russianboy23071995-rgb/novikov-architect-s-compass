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

## Tabwechsel flüssig (03.11.2026)

Nutzerhinweis: Das Wechseln der Tabs war nicht ganz flüssig. Gemessen wurde vom Klick auf den Tab bis zum zweiten gezeichneten Bild, im Entwicklungsserver, Chromium, Fenster etwa 1 600 × 1 200, mit dem Gesamtmodell.

**Ursache:** Grundriss, Layoutbuch und 3D teilten sich eine Zeichenfläche, die bei jedem Wechsel neu aufgebaut wurde. Hinter dem Schnitt wurde der Grundriss unnötig mitgerendert. Beim Wechsel fielen außerdem drei weitere Kosten an:

- Die eingefügten Grundrisse im Layout wurden bei jedem Rendern komplett durchlaufen, weil ihre Läufe und ihre Maßstabsangabe jedes Mal neu entstanden.
- Die Werkzeugleisten renderten bei jedem Rendern des Arbeitsbereichs neu.
- Der Ansichtsbezug des Grundrisses war nach dem Layoutbuch ein neues Objekt mit gleichem Inhalt.

**Umsetzung:**

- **Eine Zeichenfläche je Art** (\`CadWorkspace.tsx\`, \`keepViewport\`): Grundriss, 3D und Layoutbuch haben je eine Fläche. Die gerade nicht gezeigten bleiben bestehen, ausgeblendet mit \`content-visibility: hidden\` und \`inert\`. Der Browser überspringt ihre Darstellungsarbeit, behält aber ihren Zustand. Hinter dem Schnitt bleibt die Fläche eingefroren. Ein neues Projekt verwirft die gehaltenen Flächen.
  - Mit \`display: none\` musste der Browser beim Einblenden das Layout aller SVG-Elemente neu rechnen.
  - Mit \`visibility: hidden\` rechnete er die verborgene Fläche bei jeder Änderung am Grundriss mit.
  - Beides wurde gemessen und verworfen.
- **Eingefügte Grundrisse** (\`BimPlan.tsx\`, \`PlacedPlanRuns\`): memoisiert mit stabilen Läufen und stabiler Maßstabsangabe. Die Layout-Fläche rendert beim Wechsel in 7 statt 166 ms (3 000 Elemente).
- **Werkzeugleisten** (\`stable-handlers.tsx\`): \`TopToolbar\` und \`ToolRail\` sind memoisiert. Ihre Rückrufe gehen über stabile Hüllen, die immer die aktuelle Funktion aufrufen. Sie rendern nur noch, wenn sich ein angezeigter Wert ändert, zum Beispiel Geschossname oder erlaubte Werkzeuge. Das gilt auch außerhalb des Tabwechsels, etwa bei Auswahl oder Hover.
- **Ansichtsbezug:** wird nach Projekt, Ebenensicht und Abbild gemerkt. Der Grundriss bekommt nach dem Layoutbuch dasselbe Objekt zurück.
- **Suche nach der sichtbaren Fläche:** Das Vorschaubild der Sicherung und der Abnahmelauf suchen nur in der gezeigten Fläche (\`data-hidden-tab\`).

**Ergebnis (Median je Wechsel):**

| Wechsel                | 3 000 vorher | 3 000 nachher | 20 000 vorher | 20 000 nachher |
| ---------------------- | -----------: | ------------: | ------------: | -------------: |
| ins Layoutbuch         |   350–380 ms |    200–220 ms |     1,6–1,7 s |    0,25–0,27 s |
| Layoutbuch → Schnitt   |       246 ms |        191 ms |        0,65 s |         0,23 s |
| 3D → Grundriss         |       190 ms |        123 ms |        0,53 s |         0,17 s |
| Grundriss → 3D         |       128 ms |        124 ms |        0,31 s |         0,13 s |
| Schnitt → 3D           |       130 ms |        122 ms |        0,30 s |         0,11 s |
| Layoutbuch → Grundriss |       125 ms |    ca. 230 ms |        0,61 s |         0,45 s |

- **3 000 nachher:** gemessen mit \`content-visibility\`, aber vor dem Merken des Ansichtsbezugs.
- **20 000 nachher:** gemessen mit allen Änderungen. Der Wechsel Layoutbuch → Grundriss bei 3 000 Elementen ist mit dem Merken des Ansichtsbezugs nicht neu gemessen.

**Nachweis:**

- **Browser:**
  - Ein Klick trifft in jedem Tab nur die gezeigte Fläche, die verborgenen sind \`inert\`.
  - Wand im Grundriss gewählt, ins Layoutbuch gewechselt, Entf gedrückt: Die Wand ist noch da, die Elementzahl bleibt bei 4 411. Zurück im Grundriss lässt sie sich wieder auswählen.
  - Keine Konsolenfehler.
- **Prüfungen:**
  - 1553 Tests grün,
  - Typprüfung, Lint (eine Warnung, die es vorher schon gab), Architekturprüfung ohne Befund,
  - 14-Modell-Hash \`e42aa36e…\` unverändert.

**Grenzen:**

- **Messbedingungen:** Gemessen wurde im Entwicklungsserver; ein Produktionsbuild ist schneller. Die Vorher-Werte wurden in einem Fenster ähnlicher, aber nicht gleicher Größe gemessen. Die Wiederholung im selben Fenster brach ab: ein Klick des Nutzers kam dazwischen, und die alten Wechsel dauerten länger als das Zeitlimit.
- **Erstes Öffnen:** Das erste Öffnen eines Tabs und ein neuer Inhalt im Tab (anderes Geschoss, anderer Schnitt, anderes Layout) bauen weiter neu auf.
- **Speicher:** Bis zu drei Zeichenflächen bestehen gleichzeitig.
- **Ungeklärter Rest:** Layoutbuch → Grundriss braucht bei 20 000 Elementen noch etwa 0,45 s; nicht weiter zerlegt.
- **Tests:** Für die stabilen Hüllen und das Halten der Flächen gibt es keinen eigenen Test, weil die Testläufe keine React-Komponenten rendern. Belegt sind sie durch die Browserprobe.

## Nachtrag: Layoutbuch → Grundriss (03.11.2026)

**Befund:** Beim Zurückwechseln aus dem Layoutbuch renderte der Grundriss bei 20 000 Elementen etwa 240 ms neu. Aus 3D kommend waren es nur 14 ms. Die einzige Eingabe, die sich zusätzlich änderte, war die Auswahl: Das Layoutbuch leert sie beim Betreten. Der Grundriss baute daraus eine neue, ebenfalls leere Menge. Weil jeder Zeichnungslauf die Auswahlmenge bekommt, renderten alle Läufe neu.

**Umsetzung** (`BimPlan.tsx`): Die Auswahlmenge bleibt dasselbe Objekt, solange dieselben Elemente gewählt sind. Ohne Auswahl ist es immer dieselbe leere Menge.

**Ergebnis** (20 000 Elemente, Entwicklungsserver):

- Layoutbuch → Grundriss: 0,17–0,19 s statt 0,45 s, beim ersten Wechsel 0,32 s.
- Der Grundriss rendert dabei in etwa 20 ms.

**Nachweis:**

- Im Browser lassen sich Wände auswählen und abwählen; `aria-pressed` und die Anzeige „1 selected“/„0 selected“ folgen.
- 1553 Tests grün, Typprüfung und Architekturprüfung ohne Befund, Hash unverändert.

**Grenze:** Eine echte Änderung der Auswahl rendert weiter alle Läufe neu. Bei 20 000 Elementen kostet ein Auswahlklick deshalb weiterhin etwa 0,2 s. Die Auswahl je Lauf aufzuteilen ginge nur mit Vorsicht, weil Fenster und Türen im Wand-Lauf gezeichnet werden. Das wäre ein eigener Auftrag.
