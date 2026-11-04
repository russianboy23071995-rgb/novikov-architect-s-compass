# Dachflächenfenster (L41, ab 04.11.2026)

Nutzerauftrag 04.11.2026: das Werkzeug Dachflächenfenster, Änderungskarte mit „Go“ freigegeben. Umsetzung in drei PRs.

| PR  | Inhalt                                                                                | Stand    |
| --- | ------------------------------------------------------------------------------------- | -------- |
| D1  | Modell, Dateiformat 55, Loch im Dach senkrecht zur Fläche, Rahmen und Glas in 3D, IFC | erledigt |
| D2  | Werkzeug, Einstellungsfenster, Eigenschaften, Grundriss                               | erledigt |
| D3  | Verschieben in der Dachebene, Fangpunkte, Pipette, Schnitt, Abnahme                   | erledigt |

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

- **Grundriss:** In D1 war das Fenster dort noch nicht gezeichnet; das kam mit D2.
- **Dachumriss:** Ein Dach, dessen Umriss so geändert wird, dass ein Fenster herausfällt, lässt sich nicht speichern, bis das Fenster verschoben oder gelöscht ist.
- **Bauteil:** Rahmen und Glas sind vereinfacht, ohne Eindeckrahmen und ohne Flügel.

## Teil D2: Werkzeug, Einstellungen, Eigenschaften, Grundriss

- **Werkzeug „Dachflächenfenster“:** Der Knopf in der Werkzeugleiste ist nicht mehr ausgegraut.
  - Ein Klick in ein sichtbares Dach setzt ein Fenster mit der Mitte auf den Punkt, parallel zur Traufe. Liegen mehrere Dächer übereinander, nimmt es das oberste.
  - Ein Klick außerhalb meldet „Dachflächenfenster: in eine sichtbare Dachfläche klicken.“ Passt das Fenster nicht oder überschneidet es ein anderes, kommt die Meldung aus D1.
  - Das Werkzeug bleibt aktiv, ein Rückgängig-Schritt je Fenster.
- **Vorgaben** (`application/roof-windows/defaults.ts`, nicht im Undo): Breite, Länge, Rahmen, Ebene, Bauzustand (Vorgabe Neubau).
- **Dieselben Felder** (`RoofWindowFields`) stehen an drei Stellen:
  - in der Leiste, mit Hinweis,
  - im Einstellungsfenster (Doppelklick auf das Werkzeug; Reiter „Dachflächenfenster“ und „Bauzustand“),
  - bei einem gewählten Fenster: Eine Änderung gilt beim Verlassen des Feldes oder mit Enter, ein Rückgängig-Schritt je Änderung. Eine Größe, die nicht mehr ins Dach passt, wird mit Meldung abgelehnt.
- **Doppelklick auf ein Fenster:** öffnet sein Fenster mit den Reitern Dachflächenfenster, Bauzustand (gilt für alle gewählten) und Ebene.
- **Grundriss:**
  - Eigene Zeichenschicht direkt über den Dächern. Das Fenster liegt über der Schnitthöhe von 1 m, daher ist die Öffnung auf der Dachoberseite gestrichelt wie der Dachumriss über dem Schnitt, mit Diagonalkreuz.
  - Auswahl per Klick in die Fläche, per Rechteckauswahl und per Tab-Auswahl.
  - Ein Fenster, dessen Dach ausgeblendet ist, wird nicht gezeichnet.
  - Schneidet die Schnitthöhe ein Fenster, hat die geschnittene Dachfläche dort ein Loch (`roofPlanView` mit Fenstern).

**Nachweis D2:**

- **Prüfungen:** 1584 Tests grün, davon 2 neu (Vorgaben und Grundriss, Loch im Dachschnitt). Typprüfung beider Projekte, Lint (eine Warnung, die es vorher schon gab), Architekturprüfung ohne Befund, 14-Modell-Hash unverändert.
- **Browser** (Testprojekt mit einem Pultdach 8 × 5 m):
  - Werkzeug gewählt: Die Leiste zeigt Breite 0,78, Länge 1,18, Rahmen 0,06, Ebene Fenster und den Hinweis.
  - Zwei Klicks ins Dach: zwei gestrichelte Rechtecke mit Kreuz, im Gefälle länger, weil 1,18 m · cos 35° = 0,97 m.
  - Ein Klick neben das Dach: Meldung.
  - Mit dem Auswahlwerkzeug angeklickt: Eigenschaften „Dachflächenfenster“, Menütitel „Dachflächenfenster“.
  - Breite auf 1,14 geändert: das Rechteck wird 1,14 m breit. Mit Strg+Z zurück auf 0,78.
  - Doppelklick auf das Fenster: drei Reiter. Doppelklick auf das Werkzeug: Reiter Dachflächenfenster und Bauzustand.
  - Ladefehler in der Konsole stammten nur von Branch-Wechseln.

**Grenzen D2:**

- **Bearbeiten:** Verschieben, Fangpunkte und Pipette kamen mit D3.
- **Fang beim Setzen:** Beim Setzen fängt der Klick wie jedes Werkzeug an Punkten. Es gibt keinen eigenen Fang „Abstand zum Dachrand“.

## Teil D3: Verschieben, Fangpunkte, Pipette, Schnitt

- **Verschieben in der Dachebene:** Ein Fenster bewegt sich als Ganzes.
  - Menü am Element: „Element frei bewegen“, „Element auf X-Achse“, „Element auf Y-Achse“, auch zusammen mit anderen gewählten Elementen.
  - Die Bewegung im Grundriss wird in die Dachebene umgerechnet: der Anteil entlang der Traufe auf `along`, der Anteil bergauf geteilt durch cos(Neigung) auf `slope`. Die Seiten bleiben parallel zur Traufe.
  - Bezugspunkt ist der angeklickte Punkt, sonst die Mitte der Öffnung auf der Dachoberseite.
  - Wandert das Fenster dabei aus dem Dach oder auf ein anderes Fenster, wird die Bewegung abgelehnt.
  - Werden Dach und Fenster zusammen verschoben, bleibt das Fenster an seinem Platz im Dach.
  - „Entlang Achse“ wird nicht angeboten.
- **Fangpunkte:** Mitte, vier Ecken und Kantenmitten der Öffnung auf der Dachoberseite, beschriftet „Dachflächenfenster · Mitte“ bzw. „· Ecke n“.
- **Pipette:** übernimmt Breite, Länge, Rahmen, Ebene und Bauzustand, nicht die Lage.
- **Schnitt und Ansicht:** Wie beim Geländer ohne eigenen Code, über die 3D-Flächen. Ein Schnitt durch das Fenster zeigt das Dach mit Loch, die Rahmenteile senkrecht zur Dachfläche und die Scheibe.

**Nachweis D3:**

- **Prüfungen:** 1588 Tests grün, davon 4 neu:
  - Verschieben (allein, mit dem Dach, aus dem Dach heraus abgelehnt, Mitte),
  - Fangpunkte und Beschriftung,
  - Pipette,
  - Schnitt durch Fenster und Dach.

  Dazu Typprüfung beider Projekte, Lint (eine Warnung, die es vorher schon gab), Architekturprüfung ohne Befund, 14-Modell-Hash unverändert.

- **Browser** (Pultdach 8 × 5 m mit zwei Fenstern):
  - Das kleine Fenster angeklickt und „Element auf X-Achse“ gewählt: um 1,38 m entlang der Traufe verschoben, y unverändert, keine Meldung.
  - Schnitt A-A quer durch das verschobene Fenster gelegt. Im Schnitt-Tab ist das geneigte Dach geschnitten, mit dem Fenster darin: Rahmenteile senkrecht zur Dachfläche, Glas in der Mitte der Dachstärke.

**Grenzen und Ausblick L41:**

- **Ausrichtung:** Drehen in der Dachebene ist nicht möglich, das Fenster bleibt parallel zur Traufe.
- **Bauteil:** ohne Eindeckrahmen, Flügel oder Öffnungsart; das IFC kennt die Öffnungsart nicht.
- **Vorschau:** Beim Verschieben eines Dachs folgen seine Fenster in der laufenden Vorschau nicht sichtbar mit. Nach dem Absetzen sind sie richtig.
- **Mengen:** Die Mengenliste zeigt Grundfläche und Dachfläche brutto. Nur das Volumen zieht die Fenster ab.

## Nachtrag: Strichelung im Grundriss und Laibung (Dateiversion 56)

Nutzerauftrag 04.11.2026: das Fenster im Grundriss sichtbar gestrichelt; die Laibungen wahlweise nach Velux-Vorgabe (oben waagerecht, unten lotrecht). Änderungskarte mit „Go“ freigegeben, Startwert rechtwinklig.

- **Strichelung:** Umriss und Kreuz waren mit „6 3“ in Metern gestrichelt, also 6 m Strich, und sahen durchgezogen aus (Fehler aus D2, im Browser damals falsch als gestrichelt gemeldet). Jetzt 6 Pixel Strich, 3 Pixel Lücke in jedem Maßstab, wie der Dachumriss über dem Schnitt. Dieselbe Korrektur beim Geländer (Stäbe).
- **Modell:** `upperReveal` („square“ | „horizontal“) und `lowerReveal` („square“ | „plumb“), beide optional; fehlend heißt rechtwinklig zur Dachfläche.
- **Öffnung** (`roofWindowOpening`): Auf der Dachoberseite bleibt das Rechteck. Auf der Unterseite liegen die Kanten bergauf versetzt um
  - rechtwinklig: Stärke · sin(Neigung),
  - untere Kante lotrecht: 0, senkrecht unter der Oberkante,
  - obere Kante waagerecht: Stärke ÷ sin(Neigung), auf Höhe der Oberkante.
  - Die Seitenlaibungen bleiben rechtwinklig. Die Öffnung weitet sich so zum Raum hin.
- **Rahmen und Glas** bleiben rechtwinklig im Kern der Öffnung (`roofWindowRings`).
- **Prüfung:** Auch die Unterseite der Öffnung muss ganz im Dach liegen, und zwei Fenster dürfen sich auch unten nicht überschneiden. Sonst wird die Änderung abgelehnt. Bei flachen Dächern wird die waagerechte obere Laibung lang (bei 15° und 24 cm Stärke rund 93 cm im Grundriss).
- **Folgen von selbst:** 3D, Schnitt, Dachschnitt im Grundriss, Volumen in der Mengenliste.
- **Bedienung:** Auswahlfelder „Obere Laibung“ und „Untere Laibung“ in Werkzeugleiste, Einstellungsfenster und Eigenschaften; eine Änderung ist ein Rückgängig-Schritt; die Pipette übernimmt sie. Neue Fenster beginnen rechtwinklig.
- **Schema 56:** Eine 55er Datei mit Laibungsangabe wird abgelehnt; 55er Dateien laden unverändert, rechtwinklig.
- **IFC:** Das Dach trägt das aufgeweitete Loch. Das `IfcOpeningElement` bleibt rechtwinklig (Grenze).

**Nachweis:**

- **Prüfungen:** 1592 Tests grün, davon 4 neu: Lage der Unterkanten (lotrecht, waagerecht auf Höhe der Oberkante), Volumen (das Dach verliert genau die Keile Breite · Stärke² · tan(Neigung) / 2 unten und Breite · Stärke² / (2 · tan(Neigung)) oben), Einstellungen, Pipette und Ablehnung am First, Dateiversion 55/56. Dazu Typprüfung beider Projekte, Lint, Architekturprüfung ohne Befund, 14-Modell-Hash unverändert.
- **Browser** (Pultdach 8 × 5 m, 35°, Fenster dfw-1 mit Velux-Laibung, dfw-2 rechtwinklig, Schnitte A-A und B-B quer durch beide):
  - Grundriss: Strich auf dem Bildschirm nachgemessen 6,0 Pixel.
  - Schnitt A-A durch dfw-1: Das untere Dachstück endet mit einer lotrechten Kante, das obere mit einer waagerechten; Rahmen und Glas stehen rechtwinklig dazwischen.
  - Schnitt B-B durch dfw-2: beide Laibungen rechtwinklig zur Dachfläche, wie bisher.
  - Eigenschaften von dfw-1 zeigen „waagerecht (Velux)“ und „lotrecht (Velux)“. Obere Laibung auf rechtwinklig gestellt und übernommen, mit Strg+Z wieder auf waagerecht (dass es genau ein Schritt ist, belegt der Test der Eigenschaften, nicht der Browser).
