# Dachflächenfenster (L41, ab 04.11.2026)

Nutzerauftrag 04.11.2026: das Werkzeug Dachflächenfenster, Änderungskarte mit „Go“ freigegeben. Umsetzung in drei PRs.

| PR  | Inhalt                                                                                | Stand    |
| --- | ------------------------------------------------------------------------------------- | -------- |
| D1  | Modell, Dateiformat 55, Loch im Dach senkrecht zur Fläche, Rahmen und Glas in 3D, IFC | erledigt |
| D2  | Werkzeug, Einstellungsfenster, Eigenschaften, Grundriss                               | offen    |
| D3  | Verschieben in der Dachebene, Fangpunkte, Pipette, Schnitt, Abnahme                   | offen    |

Vorgaben aus der Karte:

- Größe 78 × 118 cm, Breite entlang der Traufe, Länge entlang des Gefälles, Rahmen 6 cm.
- Ebene „Fenster“.
- Immer parallel zur Traufe, in Stufe 1 nicht drehbar.
- Das Loch geht senkrecht zur Dachfläche.

## Teil D1: Modell und 3D

- **Modell** (`src/domain/elements/roof/window.ts`, `roofWindowSchema`): `roofId` (ein Dach desselben Geschosses), `along` (Abstand der Mitte entlang der Bezugslinie ab ihrem Anfang), `slope` (Abstand der Mitte auf der Dachoberseite von der Bezugslinie bergauf), `width`, `length` (0,30–3,00 m), `frame` (3–20 cm, schmaler als das halbe Fenster), `renovation` wie bei Wänden.
  - Die Lage ist in der Dachebene gespeichert. Verschiebt man das Dach, wandert das Fenster mit, ohne dass sich seine Werte ändern.
- **Lage und Öffnung:**
  - `roofWindowPlace`: Umrechnung zwischen einem Punkt im Grundriss und der Lage in der Dachebene.
  - `roofWindowRings`: Umriss der Öffnung auf der Dachoberseite und auf der Unterseite. Die Unterseite ist um Stärke · sin(Neigung) bergauf versetzt, so steht die Öffnung senkrecht zur Dachfläche.
- **Prüfung** (`roofWindowProblem`, im Schema je Geschoss): Jedes Fenster liegt ganz in der Ober- und Unterseite seines Dachs, berührt den Rand nicht und überschneidet kein anderes Fenster dieses Dachs. Sonst kommt eine Meldung. Ebene und Dach müssen vorhanden sein.
- **Dachkörper** (`roofBody(roof, elevation, windows)`): Ober- und Unterseite werden mit Löchern in Dreiecke zerlegt, wie beim Deckendurchbruch. Je Öffnung kommen vier Laibungsflächen dazu. Ohne Fenster bleibt der Körper unverändert.
- **Fensterkörper** (`window-body.ts`): vier Rahmenteile durch die ganze Dachstärke und eine Scheibe in der Mitte, alle senkrecht zur Dachfläche. In 3D ist der Rahmen weiß und das Glas durchsichtig. Die Kennung `roofWindow` sorgt dafür, dass ein Klick das Dachflächenfenster auswählt und nicht ein Wandfenster. Wandfuß-Fangpunkte entstehen keine.
- **Mit dem Dach:**
  - Löschen: Ein gelöschtes Dach nimmt seine Fenster mit.
  - Kopieren: Ein kopiertes Dach bringt seine Fenster mit, sie zeigen auf das neue Dach. Ein Fenster allein wird nicht kopiert, weil die Kopie genau auf dem Original läge.
- **Mengenliste:** Das Volumen des Daches zieht die Fenster ab. Grundfläche und Dachfläche bleiben brutto.
- **Aktionen** (`src/application/roof-windows/actions.ts`): `addRoofWindow`, `addRoofWindowAt` (Mitte auf einem Grundrisspunkt), `updateRoofWindow`, `defaultRoofWindowLayerId` (Standardebene Fenster).
- **Schema 55:** `roofWindows` je Geschoss (optional). Ein untergeschobenes Dachflächenfenster in einer 54er Datei wird abgelehnt.
- **IFC:**
  - Das Dach (`IfcSlab` .ROOF.) trägt die Löcher in seinem Körper.
  - Je Fenster gibt es eine `IfcOpeningElement`, senkrecht zur Dachfläche, die das Dach aushöhlt (`IfcRelVoidsElement`).
  - Ein `IfcWindow` .SKYLIGHT. füllt die Öffnung (`IfcRelFillsElement`). Sein Körper sind Rahmen und Scheibe als facettierte B-Rep, Höhe gleich Länge, Breite gleich Breite.
  - `Pset_WindowCommon.Status` und eigene Werte: Dach, Lage, Rahmen, Bauzustand.
- **Menü am Element:** Titel „Dachflächenfenster“ mit Größe und Rahmen, z. B. „78 × 118 cm · Rahmen 6 cm“.

**Nachweis D1:**

- **Prüfungen:** 1582 Tests grün, davon 9 neu in `src/application/roof-windows/actions.test.ts`:
  - Lage und Umrechnung,
  - Öffnung senkrecht zur Fläche,
  - Lochvolumen exakt 0,78 × 1,18 × 0,24 m³, ohne Fenster unveränderter Körper,
  - Fensterkörper,
  - Vorgaben und Prüfungen,
  - Verhalten mit dem Dach (Verschieben, Löschen, Kopieren),
  - Dateiformat,
  - IFC,
  - Menütitel.

  Dazu Typprüfung beider Projekte, Lint (eine Warnung, die es vorher schon gab), Architekturprüfung ohne Befund, 14-Modell-Hash `e42aa36e…` unverändert.

- **Browser:** Testprojekt mit einem Pultdach (8 × 5 m, 35°) und zwei Fenstern (78 × 118 und 114 × 140 cm) geladen. In 3D zeigen beide Löcher Rahmen und durchsichtiges Glas. Ein Klick wählt das Fenster aus: Ebene „Fenster“, Menütitel „Dachflächenfenster“. Keine Konsolenfehler.

**Grenzen D1:**

- **Grundriss:** Das Fenster ist dort noch nicht gezeichnet. Die Schnittdarstellung des Daches bei 1 m kennt die Löcher noch nicht (kommt mit D2).
- **Dachumriss:** Ein Dach, dessen Umriss so geändert wird, dass ein Fenster herausfällt, lässt sich nicht speichern, bis das Fenster verschoben oder gelöscht ist.
- **Bauteil:** Rahmen und Glas sind vereinfacht, ohne Eindeckrahmen und ohne Flügel.
