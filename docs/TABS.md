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
- Zwei Tabs verschiedener Art lassen sich nebeneinander oder untereinander zeigen (Rechtsklick auf einen Tab, `docs/SPLITSCREEN.md`).

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

## Auswahlklick: Auswahl nur an die betroffenen Läufe (03.11.2026)

Freigabe der Änderungskarte „Auswahlklick schneller“, Schritt 1, durch den Nutzer am 03.11.2026.

**Befund:** Jeder Zeichnungslauf des Grundrisses bekam die ganze Auswahlmenge. Läufe gibt es je Art: Räume, Decken, Schraffuren, Wände, Linien, Maße, Texte. Bei jedem Klick renderten deshalb alle Läufe neu.

**Umsetzung** (`components/cad/run-selection.ts`, `BimPlan.tsx`): Ein Lauf bekommt die Auswahl nur, wenn ein gewähltes Element in ihm gezeichnet wird. Fenster und Türen zählen zum Wand-Lauf, alle anderen Arten zu ihrem eigenen. Die übrigen Läufe bekommen immer dieselbe leere Menge und rendern nicht neu.

**Ergebnis** (20 000 Elemente, Entwicklungsserver, Median aus 3–12 Klicks):

| Klick             | vorher | nachher |
| ----------------- | -----: | ------: |
| Linie             | 220 ms |  145 ms |
| Abwählen (Escape) | 374 ms |  122 ms |
| Wand              | 247 ms |  247 ms |
| Fenster           | 225 ms |  240 ms |

Bei Wand und Fenster bleibt die Zeit gleich. Laut Profiler rendert der Grundriss dabei 130–164 ms, fast alles im Wand-Lauf: Er zeichnet alle Wände des Geschosses mit ihren Öffnungen neu, um eine hervorzuheben. Das ist Schritt 2 der Karte, also Wände einzeln memoisieren, und noch nicht umgesetzt. Die obere Leiste rendert bei einer Wandauswahl zu Recht neu (etwa 25 ms), weil sich ihre Werte ändern, etwa Trimmen und Pipette.

**Nachweis:**

- `benchmarks/run-selection.test.ts`: Zuordnung der Arten zu den Läufen; Läufe ohne gewähltes Element bekommen dieselbe leere Menge.
- Browser (Gesamtmodell 3 000): `aria-pressed` und Hervorhebung stimmen für
  - Wand, Fenster und Linie einzeln,
  - Wand und Fenster gemeinsam,
  - Wand und Linie gemeinsam, also über zwei Läufe hinweg,
  - das Entfernen der Wand aus der Mehrfachauswahl (Strg-Klick),
  - das Abwählen.

  Keine Konsolenfehler.

- 1554 Tests grün, Typprüfung, Lint, Architekturprüfung ohne Befund, Hash unverändert.

**Grenze:** Der Raum-Lauf ist nicht eigens geprüft. Die Messung fand kein auswählbares Raum-Element unter „Select room“.

## Auswahlklick Schritt 2: Wände einzeln memoisiert (03.11.2026)

Freigabe durch den Nutzer am 03.11.2026.

**Umsetzung** (`PlanSceneRun.tsx`): Jede Wand mit ihren Fenstern und Türen ist ein eigener memoisierter Baustein (`PlanWall`). Er rendert nur neu, wenn sich eine seiner Eingaben ändert (etwa Szene, Maßstab, Linienstärke) oder die Auswahl der Wand, eines ihrer Fenster oder einer ihrer Türen. Die Auswahl anderer Elemente lässt ihn unberührt. Die Hilfsfunktion `selectPropsFor` teilen sich Lauf und Wand.

**Ergebnis** (20 000 Elemente, Renderzeit des Grundrisses laut React-Profiler, Median aus 3 Durchgängen, alt und neu im selben Fenster):

| Klick    | Schritt 1 | Schritt 2 |
| -------- | --------: | --------: |
| Abwählen |    194 ms |     43 ms |
| Wand     |     53 ms |     62 ms |
| Fenster  |     51 ms |     53 ms |
| Linie    |     71 ms |     69 ms |

Beim Abwählen rendert jetzt nur noch die Wand, die vorher gewählt war. Beim Auswählen bleibt die Renderzeit des Grundrisses bei etwa 50–70 ms. Dieser Rest liegt nicht mehr im Wand-Lauf, sondern in anderen Teilen des Grundrisses, etwa Griffen und Überlagerungen der Auswahl. Er ist nicht weiter zerlegt.

**Messbedingungen:** Die Zeit vom Klick bis zum Bild schwankte während der Messung stark; derselbe alte Stand lieferte für die Wand einmal 247 und einmal 164 ms. Deshalb ist hier die Renderzeit des Profilers angegeben und nicht die Gesamtzeit.

**Nachweis:**

- Browser (Gesamtmodell 3 000): Kontur und `aria-pressed` folgen der Auswahl.
  - Wand 1, dann Wand 2: Die erste wird wieder normal, die zweite hervorgehoben.
  - Fenster.
  - Gemischt Wand, Fenster und Linie (Strg-Klick, „3 selected“).
  - Abwählen.
- 1556 Tests grün, Typprüfung, Lint, Architekturprüfung ohne Befund, Hash unverändert.

**Grenze:** Türen sind nicht im Browser geprüft, das Testmodell hat keine. Sie gehen denselben Weg wie Fenster.

## Rest beim Auswählen: Linien in Blöcken, Wandvergleich ohne Listen (04.11.2026)

Freigabe der Änderungskarte „Rest beim Auswählen“ durch den Nutzer („Go“ für beide Schritte).

**Ursache des Rests:** Der Linien-Lauf selbst rechnete nur etwa 0,2 ms. Die Zeit entstand, weil React bei jeder Auswahl jede der 2800 Linien einzeln abglich, im Entwicklungsmodus (StrictMode) sogar doppelt. Das galt auch, als jede Linie schon für sich memoisiert war.

**Umsetzung** (`PlanSceneRun.tsx`, `plan-scene.ts`):

- **Linien:** Jede Linie ist ein memoisierter Baustein (`PlanLine`). Zusätzlich sind je 64 Linien zu einem memoisierten Block (`PlanLineChunk`) zusammengefasst. Ein Klick gleicht dann nur noch die Blöcke ab und die Linien des einen Blocks, in dem sich die Auswahl ändert.
- **Wände:** Der Vergleich der Wand-Bausteine (`sameWall`) prüft die Auswahl der Wand, ihrer Fenster und Türen direkt. Er baut keine Listen mehr, denn er läuft bei jedem Klick für jede Wand.
- **Schichtstöße (Fund nebenbei):** Die T-Stöße (L09 U2) wurden bisher in jedem Lauf gezeichnet, also mehrfach und über allen Linien. Jetzt zeichnet sie nur der Wand-Lauf, der die später gezeichnete der beiden Wände enthält (`planRunJoints`). So liegt der Stoß weiter über beiden Wänden. Dafür gibt es einen neuen Test in `wall-layers.test.ts`.

**Ergebnis** (Gesamtmodell 20 000, React-Profiler, Entwicklungsmodus):

| Klick auf eine Linie |      vorher |  nachher |
| -------------------- | ----------: | -------: |
| Linien-Lauf          |    75–87 ms |   3–4 ms |
| Grundriss gesamt     | etwa 100 ms | 17–22 ms |

Ein Wandklick lag nach dem Wandvergleich bei 12–14 ms für den Grundriss, der Wand-Lauf bei etwa 3 ms (vorher 24 ms).

**Nachweis:**

- Browser (Gesamtmodell 20 000): 6 Linienklicks an Anfang, Mitte und Ende, jeweils genau eine Hervorhebung und nach Escape keine. Gemischt mit Strg-Klick: Linie, Linie, Wand („3 selected“), eine Linie wieder abgewählt („2 selected“), Escape („0 selected“). Alle 2800 Linien und 800 Wände bleiben gezeichnet.
- 1557 Tests grün, Typprüfung, Lint, Architekturprüfung ohne Befund, Hash unverändert.

**Grenzen:**

- Gemessen ist im Entwicklungsmodus; im Produktionsbau ist React schneller, die Verhältnisse bleiben.
- Das Testmodell hat keine T-Stöße mit Schichten; deren Zeichnung ist nur im Unit-Test geprüft, nicht im Browser.
- Fügt man eine Linie ein, verschieben sich die Blockgrenzen. Die Blöcke dahinter rendern dann einmal neu. Das betrifft nur das Bearbeiten, nicht das Auswählen.
