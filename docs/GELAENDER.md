# Geländer (L42, ab 04.11.2026)

Nutzerauftrag 04.11.2026: das Werkzeug Geländer, freigegeben mit „Go, Geländer“. Umsetzung in drei PRs nach der Änderungskarte.

| PR  | Inhalt                                                                                | Stand    |
| --- | ------------------------------------------------------------------------------------- | -------- |
| G1  | Modell, Dateiformat 54, Standardebene Geländer, Aktionen, 3D-Körper, IFC `IfcRailing` | erledigt |
| G2  | Werkzeug, Einstellungsfenster, Eigenschaften, Grundriss                               | erledigt |
| G3  | Bearbeiten, Schnitt, Abnahme                                                          | erledigt |

Vorgaben (Empfehlung der Karte, vom Nutzer nicht anders bestimmt): frei als Linienzug gezeichnet, nicht an Treppe oder Decke gebunden; Höhe 1,00 m, Pfosten höchstens 1,20 m auseinander, Füllung Stäbe.

## Teil G1: Modell

- **Modell** (`src/domain/elements/railing/model.ts`, `railingSchema`):
  - `points`: Linienzug im Grundriss, 2 bis 1000 Punkte, kein Abschnitt kürzer als 1 cm,
  - `height`: Oberkante Handlauf über dem Fuß, 0,30–3,00 m,
  - `baseOffset`: Fuß über OK Rohfußboden des eigenen Geschosses,
  - `postSpacing`: größter Pfostenabstand, 0,30–5,00 m,
  - `infill`: „Stäbe“ oder „Platte / Glas“,
  - `renovation` wie bei Wänden (ohne Eintrag Bestand).
- **Bauteile** (`railingMembers`): Jedes Bauteil ist ein Quader, im Grundriss ein Rechteck entlang einer Strecke, senkrecht hochgezogen. Die Maße stehen in Stufe 1 fest (`RAILING_MEMBERS`).
  - Handlauf 5 × 5 cm je Abschnitt. An einem inneren Punkt laufen beide Handläufe um die halbe Breite weiter, damit die Ecke geschlossen ist.
  - Pfosten 4 × 4 cm an jedem Punkt und gleichmäßig dazwischen, höchstens `postSpacing` auseinander. An einer Ecke steht nur ein Pfosten.
  - Bei Stäben: Unterholm 4 × 4 cm, 6 cm über dem Fuß; Stäbe 2 × 2 cm, gleichmäßig verteilt, mit höchstens 12 cm lichtem Abstand, auch zu den Pfosten.
  - Bei Platte/Glas: eine Platte von 2 cm je Feld, 8 cm Abstand zu Fuß und Handlauf.
- **Aktionen** (`src/application/railings/actions.ts`): `addRailing` (fehlende Werte nach den Vorgaben, Standardebene Geländer), `updateRailing`, `defaultRailingLayerId`. Löschen, Ebenen und Auswahlformen laufen über das Bauteilregister (`railing`, „Geländer“).
- **Schema 54:** `railings` je Geschoss (optional). Das Geländer muss auf einer vorhandenen Ebene liegen. Migration 53 → 54 ergänzt die Standardebene „Geländer“, falls sie fehlt. Ein untergeschobenes Geländer in einer 53er oder 52er Datei wird abgelehnt.
- **3D** (`railing-solid.ts`): Jedes Bauteil ist ein geschlossener Quader mit der Kennung `railing`. In 3D wählt ein Klick das Geländer aus, nicht eine Wand. Wandfuß-Fangpunkte entstehen keine.
- **IFC:** `IfcRailing` .GUARDRAIL.:
  - Körper: je Bauteil ein `IfcExtrudedAreaSolid` mit Rechteckprofil,
  - `Pset_RailingCommon`: Höhe und Status (NEW/EXISTING/DEMOLISH),
  - eigene Werte: Länge, Fuß, Pfostenabstand, Füllung, Bauzustand.
- **Nebenbei behoben** (`standardLayerId`): Eine Standardebene mit Kollisionssuffix ab 10 (z. B. `layer:column:10`) wurde nicht erkannt. Im Ausdruck fehlte ein `\`.
- Im Grundriss ist das Geländer in G1 noch nicht gezeichnet und nicht bearbeitbar; das kommt mit G2/G3.

**Nachweis G1:**

- **Prüfungen:** 1567 Tests grün, davon 6 neu in `src/application/railings/actions.test.ts`:
  - Pfosten- und Stababstände, Ecke, Platten,
  - Vorgaben, Ebene, Prüfungen, Löschen,
  - Dateiformat und Migration,
  - 3D-Körper,
  - IFC.

  Dazu Typprüfung beider Projekte, Lint (eine Warnung, die es vorher schon gab), Architekturprüfung ohne Befund, 14-Modell-Hash `e42aa36e…` unverändert.

- **Browser:** Testprojekt mit zwei Geländern geladen, eines mit Stäben und Ecke, eines mit Glas, 1,10 m hoch. In 3D ist bei beiden die Ecke geschlossen. Ein Klick wählt das Geländer aus: Ebene „Geländer“, das Menü am Element bietet „Löschen (Entf)“. Keine Konsolenfehler.
- **Korrektur (G2):** Hier stand zuerst, der Menütitel laute „Geländer“. Tatsächlich lautete er „Fanghilfen“, weil die Kurzbeschreibung des Geländers fehlte. Das ist mit G2 behoben.

**Grenzen G1:**

- **Ecken:** Die Handläufe überlappen sich an der Ecke; sie sind nicht auf Gehrung geschnitten.
- **Maße:** Die Maße von Handlauf, Pfosten und Stäben sind fest.
- **3D-Farbe:** Das Geländer hat in 3D dieselbe Farbe wie Wände.

## Teil G2: Werkzeug, Einstellungen, Eigenschaften, Grundriss

- **Werkzeug „Geländer“:** Der Knopf in der Werkzeugleiste ist nicht mehr ausgegraut.
  - Punkte setzt man Klick für Klick, mit Fang wie beim Linienzug. Doppelklick oder Enter beendet, Esc bricht ab. Ein Hinweis in der Leiste sagt das.
  - Das Geländer folgt der gezeichneten offenen Linie, ein Rückgängig-Schritt.
  - Hat sich das Modell während des Zeichnens geändert, wird neu begonnen.
- **Vorgaben** (`application/railings/defaults.ts`, nicht im Undo): Höhe, Füllung, Pfostenabstand, Fuß, Ebene, Bauzustand (Vorgabe Neubau wie bei Wänden). Werte außerhalb der Grenzen übernimmt das Feld nicht.
- **Dieselben Felder** (`RailingFields`) stehen an drei Stellen:
  - in der Leiste,
  - im Einstellungsfenster (Doppelklick auf das Werkzeug; Reiter „Geländer“ und „Bauzustand“),
  - bei einem gewählten Geländer, mit der Länge in der Überschrift. Eine Änderung gilt beim Verlassen des Feldes, mit Enter oder bei einer Auswahl, ein Rückgängig-Schritt je Änderung.
- **Doppelklick auf ein Geländer:** öffnet sein Fenster mit den Reitern Geländer, Bauzustand (gilt für alle gewählten Geländer) und Ebene.
- **Menü am Element:** Titel „Geländer“ mit Füllung, Höhe und Länge, z. B. „Platte / Glas · Höhe 1,10 m · Länge 3,50 m“.
- **Grundriss:** eigene Zeichenschicht nach den Treppen. Gezeichnet werden:
  - der Handlauf in echter Breite (5 cm, halb deckend),
  - eine dünne Mittellinie, die in jedem Maßstab sichtbar bleibt: gestrichelt bei Stäben, durchgezogen bei Platte/Glas,
  - die Pfosten in echter Größe.

  Ein gewähltes Geländer ist hellblau hervorgehoben. Auswahl per Klick auf die Linie, per Rechteckauswahl und per Tab-Auswahl. Eine ausgeblendete Ebene blendet es aus.

- **Noch nicht** (G3): Verschieben, Punkte bearbeiten, Kopieren, Fangpunkte am Geländer, Pipette, Abnahme im Schnitt.

**Nachweis G2:**

- **Prüfungen:** 1569 Tests grün, davon 2 neu (Vorgaben und Grundriss, Menütitel). Typprüfung beider Projekte, Lint (eine Warnung, die es vorher schon gab), Architekturprüfung ohne Befund, 14-Modell-Hash unverändert.
- **Browser:**
  - Werkzeug gewählt: Die Leiste zeigt Höhe 1, Stäbe, 1,2, Fuß 0, Ebene Geländer und den Hinweis.
  - Drei Punkte gesetzt, mit Doppelklick beendet: Meldung „Geländer gesetzt“, im Grundriss Handlauf mit vier Pfosten.
  - Mit dem Auswahlwerkzeug angeklickt: Eigenschaften „Geländer · Länge 2,76 m“, Menütitel „Geländer“.
  - Höhe auf 1,1 geändert, mit Strg+Z zurück auf 1.
  - Doppelklick auf das Geländer: Fenster mit drei Reitern; Bauzustand von Neubau auf Bestand gestellt.
  - Doppelklick auf das Werkzeug: Vorgabenfenster mit Reitern Geländer und Bauzustand.
  - Keine Konsolenfehler.

**Grenzen G2:**

- **Fang:** An Deckenrand und Treppe fängt der Cursor nur über die vorhandenen Fangpunkte und Kanten. Ein eigener Fang „Deckenrand“ fehlt.
- **Lesbarkeit:** Bei sehr kleinem Maßstab ist der Handlauf nur noch als Mittellinie zu erkennen.

## Teil G3: Bearbeiten, Fangpunkte, Pipette, Schnitt

- **Verschieben:** Ein Geländer bewegt sich als Ganzes mit allen Punkten:
  - Einträge im Menü am Element: „Element frei bewegen“, „Element auf X-Achse“, „Element auf Y-Achse“,
  - auch zusammen mit anderen gewählten Elementen, über den vorbereiteten Verschiebepfad `prepared-translation.ts`,
  - Bezugspunkt ist der angeklickte Punkt, sonst der erste Punkt des Geländers,
  - „Entlang Achse“ wird nicht angeboten.
- **Kopieren, Ausschneiden, Einfügen:** über das gemeinsame Bauteilregister; die Kopie bekommt eine neue Kennung.
- **Fangpunkte:** jeder Punkt und jede Abschnittsmitte, beschriftet „Geländer · Punkt n“. Andere Werkzeuge, etwa Wand, Maßkette oder ein zweites Geländer, fangen daran.
- **Pipette:** übernimmt alle Einstellungen eines Geländers außer seiner Linie in das Werkzeug.
- **Schnitt und Ansicht:** Das Geländer erscheint ohne eigenen Code, denn der Schnitt nutzt dieselben 3D-Flächen. Auf der Schnittlinie wird es geschnitten, dahinter gesehen.

**Nachweis G3:**

- **Prüfungen:** 1573 Tests grün, davon 4 neu (Verschieben, Fangpunkte, Pipette, Schnitt geschnitten und gesehen). Typprüfung beider Projekte, Lint (eine Warnung, die es vorher schon gab), Architekturprüfung ohne Befund, 14-Modell-Hash unverändert.
- **Browser:**
  - Geländer gezeichnet und angeklickt. Das Menü zeigt „Geländer“ mit Referenzen, „Element frei bewegen“, X-Achse, Y-Achse, Werkzeugeigenschaften und Löschen.
  - „Element auf Y-Achse“: um 0,41 m verschoben, x unverändert.
  - Schnitt A-A quer durch das Geländer gelegt. Im Schnitt-Tab sind Handlauf, Unterholm und ein Stab geschnitten, gut 1 m hoch über dem Erdgeschoss.
  - Ladefehler in der Konsole stammten nur aus dem kurzen Branch-Wechsel und waren zwei Sekunden später behoben.

**Grenzen G3 und Ausblick:**

- **Punkte:** Einzelne Punkte eines Geländers lassen sich noch nicht verschieben, einfügen oder löschen. Ändern heißt vorerst neu zeichnen.
- **Bindung:** Ein Geländer hängt nicht an Decke oder Treppe. Bewegt man diese, bleibt das Geländer stehen.
- **Ecken und Maße:** Ecken sind nicht auf Gehrung geschnitten, die Maße der Bauteile stehen fest.
- **Darstellung:** Ein eigenes Geländer-Symbol im Schnitt (Schraffur oder Linienart) gibt es nicht. Geschnittene Teile sehen aus wie andere geschnittene Bauteile.
