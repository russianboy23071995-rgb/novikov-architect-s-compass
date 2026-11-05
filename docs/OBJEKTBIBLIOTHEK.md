# Objektbibliothek (L44, ab 05.11.2026)

Nutzerauftrag 04.11.2026: Objektbibliothek mit Möbeln, Sanitär und eigenen Objekten. Änderungskarte mit „Go“ freigegeben, Umsetzung in drei PRs.

Nutzerentscheidung 05.11.2026: Die Bibliothek wird schrittweise aufgewertet. Zuerst das Werkzeug, dann ein bis zwei saubere Möbel mit Bauregeln, Modulen, Material und Farbe. Der Import fremder Dateien ist zurückgestellt. Die 3D-Darstellung bleibt vorerst vereinfacht und wird später erweitert.

| PR  | Inhalt                                                                               | Stand    |
| --- | ------------------------------------------------------------------------------------ | -------- |
| O1  | Element Objekt, Katalog mit 15 Objekten, Dateiformat 57, 3D, Grundriss, IFC, Bewegen | erledigt |
| M1  | Werkzeug Bibliothek, Katalogfenster, Einstellungen, Eigenschaften, Pipette (war O2)  | erledigt |
| M2a | Bauregeln, Dateiformat 59, Esstisch mit Stühlen, Stuhl, Material und Farbe           | erledigt |
| M2b | Sofa mit Armlehnen und Sitzkissen                                                    | erledigt |
| M3  | Pkw, Fernseher, Suche im Katalog, Dateiformat 60                                     | erledigt |
| O3  | Eigene Objekte aus Linien und Schraffuren, globale Bibliothek (nach M2 neu bewerten) | offen    |

Vorgaben aus der Karte:

- Alle Katalogobjekte sind für dieses Projekt selbst gezeichnet, ohne fremde Modelle, Downloads oder Lizenzen.
- 3D bleibt vorerst schlicht. Mit M2 kommen Umrisse für Rundungen dazu.
- Fremde Formate (OBJ, SKP, IFC-Möbel) sind zurückgestellt.

## Teil O1: Element und Katalog

- **Katalog** (`src/domain/elements/object/catalog.ts`): 15 Einträge.
  - Möbel: Einzelbett, Doppelbett, Tisch, Stuhl, Sofa, Schrank, Regal.
  - Küche: Küchenzeile, Herd, Spüle, Kühlschrank.
  - Sanitär: WC, Waschtisch, Dusche, Badewanne.
  - Jeder Eintrag hat eine Startgröße, ein Grundriss-Symbol (Linienzüge und Ellipsen) und Quader. Beide stehen in Einheitskoordinaten der Objektbox: `u` quer (−0,5 links … 0,5 rechts), `v` von vorn (−0,5) nach hinten (0,5, die Seite zur Wand), `z` als Anteil der Höhe. So folgen Symbol und Körper jeder Breite, Tiefe und Höhe.
- **Modell** (`object/model.ts`, `objectSchema`): `catalogId`, `position` (Mitte der Box), `rotation` (Grad, gegen den Uhrzeigersinn), `mirrored` (spiegelt quer), `width`/`depth` 0,10–10 m, `height` 0,02–5 m, `baseOffset` −2 … 5 m über dem Geschossboden, `renovation` wie bei Wänden.
- **Ebene:** Standardebene „Möblierung“, die es seit Version 1 in jedem Projekt gibt. Sanitärobjekte liegen auf derselben Ebene.
- **Aktionen** (`src/application/objects/actions.ts`): `addObject` (fehlende Werte aus der Katalog-Startgröße, nicht gedreht, auf dem Boden), `updateObject`, `defaultObjectLayerId`.
- **Schema 57:** `objects` je Geschoss (optional). Eine 56er Datei mit untergeschobenen Objekten wird abgelehnt.
- **3D** (`rendering/viewport/object-solid.ts`): je Katalog-Quader ein geschlossener Körper, Kennung `object`. Ein Klick in 3D wählt das Objekt aus, Wandfuß-Fangpunkte entstehen keine. Farbe wie die übrigen Bauteile.
- **Schnitt und Ansicht:** ohne eigenen Code über die 3D-Flächen.
- **Grundriss:** eigene Zeichenschicht unter den Wänden. Das Katalogsymbol in dünnen Linien von oben gesehen, auch bei hohen Objekten wie dem Schrank (kein Schnitt bei 1 m). Der Umriss der Box ist die Klickfläche.
- **Auswahl:** Rang zwischen Wand und Schraffur, so gewinnt die Wand an gemeinsamen Kanten und das Objekt vor Raum und Schraffur. Menü am Element mit dem Katalognamen als Titel, z. B. „WC · 40 × 65 × 80 cm · 90°“.
- **Bewegen:** „Element frei bewegen“, „Element auf X-Achse“, „Element auf Y-Achse“, als Ganzes mit seiner Mitte; „Entlang Achse“ wird nicht angeboten. Löschen und Kopieren über die Elementliste.
- **Fangpunkte:** Mitte, Ecken und Kantenmitten der Box, beschriftet „Objekt · Mitte“ usw.
- **IFC:**
  - Möbel als `IfcFurniture` (BED, TABLE, CHAIR, SOFA, SHELF, sonst USERDEFINED).
  - WC, Waschtisch, Dusche, Badewanne und Spüle als `IfcSanitaryTerminal` (TOILETPAN, WASHHANDBASIN, SHOWER, BATH, SINK).
  - Herd und Kühlschrank als `IfcElectricAppliance` (ELECTRICCOOKER, FRIDGE_FREEZER).
  - Körper: ein extrudiertes Rechteck je Quader. Eigene Werte: Katalog, Maße, Drehung, Spiegeln, Höhe über Boden, Bauzustand.

**Gegenüber der Karte verschoben:** Pipette und Elementfenster (Eigenschaften, Bauzustand) brauchen die Werkzeugvorgaben und kommen mit O2.

**Nachweis O1:**

- **Prüfungen:** 1601 Tests grün, davon 9 neu (`src/application/objects/actions.test.ts`): Katalog in der Einheitsbox, Lage mit Drehung und Spiegeln, Anlegen und Ablehnen, Löschen und Kopieren, Dateiversion 56/57, 3D-Körper und Volumen, IFC, Grundriss, Bewegen, Fangpunkte, Menü, Schnitt. Dazu Typprüfung beider Projekte, Lint (eine Warnung, die es vorher schon gab), Architekturprüfung ohne Befund, 14-Modell-Hash unverändert.
- **Browser** (Testprojekt mit allen 15 Objekten, dazu ein WC um 90° gedreht und ein Einzelbett gespiegelt und um 30° gedreht, Schnitt A-A durch die obere Reihe):
  - Grundriss: alle Symbole zu sehen; das gedrehte WC liegt quer mit dem Spülkasten links, das gedrehte Bett schräg.
  - Klick auf das gedrehte WC: Menü „WC“, Ebene „Möblierung“. „Element auf X-Achse“ verschiebt es, der Fangpunkt „Objekt · Mitte“ erscheint.
  - 3D-Tab: alle Körper, z. B. Tisch mit Beinen, Regal mit Böden, Badewanne mit Mulde. Ein Klick wählt den Schrank aus.
  - Schnitt A-A: Betten, Tisch, Stuhl, Sofa und Schrank geschnitten.

**Grenzen O1:**

- Kein Werkzeug und kein Elementfenster; Objekte entstehen nur über Dateien oder Aktionen (bis O2).
- Drehen nur über den Wert, nicht interaktiv.
- Die Mengenliste kennt Objekte noch nicht.

## Teil M1: Werkzeug und Katalogfenster

- **Werkzeug:** „Bibliothek“ in der Gruppe der 3D-Werkzeuge, mit eigenem Piktogramm (`assets/piktogramme/*/werkzeuge/bibliothek.svg`). Jede Wahl des Werkzeugs öffnet das Katalogfenster.
- **Katalogfenster** (`LibraryWindow.tsx`):
  - Links die Gattungen aus `OBJECT_GENRES` mit Anzahl: Sitzmöbel, Tische, Betten, Schränke und Regale, Küche, Sanitär.
  - In der Mitte die Einträge als Kacheln mit Grundriss-Vorschau.
  - Rechts Vorschau in 2D und 3D, die Felder und „Platzieren“.
  - Ein Klick wählt, Doppelklick oder „Platzieren“ schließt das Fenster.
- **Vorschau** (`rendering/viewport/object-preview.ts`): gezeichnet aus Symbol und Quadern des Katalogs, ohne Bilddateien und ohne 3D-Anzeige. Sie folgt den eingegebenen Maßen.
- **Setzen:** Das Objekt hängt als türkiser Umriss am Cursor, jeder Klick setzt eines mit der Mitte auf dem Punkt, Esc beendet.
- **Vorgaben** (`application/objects/defaults.ts`): Beim Wechsel des Eintrags kommt dessen Startgröße, Drehung, Bauzustand und Ebene bleiben. Neue Objekte sind Neubau.
- **Felder** (`ObjectFields.tsx`): Breite, Tiefe, Höhe, Drehung, Höhe über Boden, Gespiegelt, Ebene. Derselbe Satz in Leiste, Katalog, Einstellungen und Elementfenster.
- **Regeln aus AGENTS.md:** Doppelklick auf das Werkzeug öffnet die Vorgaben, Doppelklick auf ein Objekt sein Fenster mit Bauzustand. Jede Änderung ist ein Rückgängig-Schritt.
- **Pipette:** übernimmt Eintrag, Maße, Drehung und Bauzustand und schaltet auf das Werkzeug, ohne den Katalog zu öffnen.

**Abnahme im Browser (05.11.2026):**

| Schritt                                 | Ergebnis                                                |
| --------------------------------------- | ------------------------------------------------------- |
| Klick auf das Werkzeug                  | Katalog öffnet sich, Tisch mit 2D- und 3D-Vorschau      |
| Gattung Sitzmöbel, Doppelklick auf Sofa | Fenster schließt, Sofa-Umriss hängt am Cursor           |
| Zwei Klicks im Plan                     | Zwei Sofas gesetzt, 4 Elemente                          |
| Doppelklick auf ein Sofa, Breite 3      | Fenster öffnet, Sofa wird 3 m breit                     |
| Strg+Z                                  | Wieder 2 m                                              |
| Rechtsklick, Pipette                    | Werkzeug aktiv, Umriss am Cursor, kein Katalog          |
| Doppelklick auf das Werkzeug            | Fenster „Bibliothek – Einstellungen“, Katalog bleibt zu |

**Grenzen M1:**

- Drehen beim Setzen nur über das Feld „Drehung“, nicht per Taste.
- Die 15 Objekte haben noch ihre Quaderform und dehnen sich mit der Box.
- Der Eintrag eines gesetzten Objekts lässt sich nicht tauschen.
- Die Mengenliste kennt Objekte weiterhin nicht.

## Teil M2a: Bauregeln, Esstisch und Stuhl

- **Bauregel** (`domain/elements/object/rules.ts`): Eine Regel erzeugt aus Maßen und Optionen benannte Teile in Metern. Jedes Teil ist ein konvexer Umriss mit Unter- und Oberkante. 3D-Körper, Grundriss-Symbol, Vorschau und IFC kommen aus denselben Teilen. Einträge ohne Regel behalten ihre Quader.
- **Esstisch** (Eintrag `table`, bisher „Tisch“):
  - Beine und Plattenstärke behalten ihr Maß, nur die Platte folgt der Länge.
  - Platte eckig, abgerundet mit Eckradius oder oval.
  - Stühle automatisch einer je 60 cm je Längsseite, als feste Anzahl oder keine. Wahlweise auch an den Kopfenden. Mehr Stühle, als die Länge fasst, werden begrenzt (mindestens 47 cm je Stuhl).
  - Neue Tische starten mit automatischen Stühlen. Tische aus alten Dateien haben keine Option und bleiben ohne Stühle.
- **Stuhl** (Eintrag `chair`): Sitz, vier runde Beine, Lehne mit gerundeten Enden. Derselbe Stuhl steht in 45 × 50 × 85 cm am Tisch.
- **Material und Farbe:** Jedes Teil hat einen Platz (Platte, Gestell, Polster) mit „Standard“, „Eigene Farbe“ oder einem Material der Projektliste. Gespeichert wird die Farbe mit der Materialkennung. Ändert sich das Material später in der Bibliothek, behält das Möbel seine Farbe.
- **Sichtbar:** Farben in 3D und in der Vorschau, der Grundriss bleibt in dünnen Linien. Die 3D-Fläche trägt dafür `color`, der Zwischenspeicher vergleicht sie mit.
- **Klickfläche:** das Rechteck um alle Teile, die Stühle eingeschlossen. Die Maßfelder gelten nur für den Tisch.
- **Felder:** Die obere Leiste zeigt nur die Maße. Optionen und Material stehen im Katalog, in den Vorgaben und im Elementfenster.
- **Schema 59:** `options` und `finishes` am Objekt. Eine 58er Datei lädt unverändert, eine 58er Datei mit diesen Feldern wird abgelehnt.
- **IFC:** ein extrudierter Umriss je Teil. Optionen und Material gehen nicht als eigene Werte hinaus.
- **Katalogfenster:** „Platzieren“ bleibt immer sichtbar, die Kachel zeigt den Eintrag mit seinen Startoptionen.

**Abnahme im Browser (05.11.2026):**

| Schritt                               | Ergebnis                                                       |
| ------------------------------------- | -------------------------------------------------------------- |
| Katalog, Tische                       | Esstisch mit 4 Stühlen in 2D und 3D                            |
| Breite 3, Platte oval                 | Vorschau zeigt ovalen Tisch mit 10 Stühlen                     |
| Platte Mauerziegel, Polster Rot       | Vorschau und Felder folgen                                     |
| Platzieren, Klick                     | Tisch mit 10 Stühlen im Grundriss, die Stühle folgen dem Oval  |
| 3D-Ansicht                            | Platte in Ziegelfarbe, Polster und Lehnen sichtbar, Stühle rot |
| Doppelklick auf den Tisch, Breite 1,8 | 6 Stühle, Klickfläche folgt                                    |

**Grenzen M2a:**

- Kein Auflösen in einzelne Stühle.
- Stühle haben eine feste Größe.
- Lehnen stehen senkrecht, Rundungen sind Facetten im Grundriss-Umriss, keine Kanten in der Höhe.
- Ein Eigenfarben-Wähler und die Materialwahl des Elementfensters sind im Browser nur über Formularwerte geprüft, nicht über den Farbdialog.

## Teil M2b: Sofa

- **Aufbau** (Eintrag `sofa`): Korpus mit Sockel, Rückenteil und Armlehnen, Sitz- und Rückenkissen, vier Füße. Abgerundete Ecken.
- **Maße:** Armlehnen bleiben 20 cm, das Rückenteil 20 cm. Nur die Sitzfläche wächst.
- **Sitze:** Die Kissen teilen den Raum zwischen den Armlehnen, ein Sitz je etwa 70 cm.
- **Armlehnen:** beidseitig, links, rechts oder keine, von vorn gesehen. Ohne Armlehne reichen die Kissen bis zur Kante.
- **Material und Farbe:** Korpus, Polster und Gestell (die Füße).
- **Alte Dateien:** Das Sofa erscheint in der neuen Form mit beidseitigen Armlehnen, seine Maße bleiben. Das Dateiformat bleibt 59.

**Abnahme im Browser (05.11.2026):** Im Katalog Sofa gewählt, 2 Sitze. Breite 3 und Armlehne links: 4 Sitze, nur links eine Armlehne, in der 2D- und 3D-Vorschau. Gesetzt im Startmodell mit seiner Wand, im Grundriss Rückenteil, Armlehne und vier Kissen. In 3D Korpus, Sitz- und Rückenkissen sichtbar. Das Testprojekt wurde dabei nicht geladen, das Sofa stand auf der Wand des Startmodells. Material und Farbe des Sofas laufen über denselben Code wie beim Esstisch und sind hier nicht einzeln geprüft.

**Grenzen M2b:** Kein Eckteil und keine Ottomane. Die Sitzanzahl lässt sich nicht von Hand festlegen.

## Teil M3: Pkw, Fernseher und Suche

- **Pkw** (Eintrag `car`, Gattung „Fahrzeuge“, Start 4,70 × 1,85 × 1,50 m): Karosserie, gläserner Aufbau, Dach, vier Räder. Die Länge läuft über die Breite, die Front zeigt nach +x.
- **Gestufte Teile:** Alle Teile sind senkrecht hochgezogene Umrisse. Räder und schräge Scheiben entstehen deshalb aus übereinanderliegenden Scheiben (je 12). Die Räder wirken von der Seite rund, die Stufen bleiben sichtbar.
- **Fernseher** (Eintrag `television`, Gattung „Technik“, Start 1,45 × 0,10 × 0,90 m): Gehäuse, Bildschirm nach vorn, Standfuß. Mit „Wand“ entfällt der Fuß, die Höhe über Boden steht im vorhandenen Feld. Die Tiefe beträgt 10 cm, weil das die Mindesttiefe aller Objekte ist. Der Fuß ragt wie die Stühle am Tisch über die Maßfelder hinaus, die Klickfläche schließt ihn ein.
- **Teilenamen:** Eine Regel kann Plätze umbenennen, beim Pkw Karosserie und Räder, beim Fernseher Gehäuse und Fuß. Neu sind die Plätze Bildschirm und Scheiben.
- **Suche:** Das Feld oben im Katalogfenster sucht durch alle Gattungen. Gefunden wird über Name, Gattung, Kategorie und Suchwörter des Eintrags (`terms`), zum Beispiel Couch, Klo, TV, Auto, Bad. Groß- und Kleinschreibung und die Schreibweise von Umlauten zählen nicht. Mehrere Wörter müssen alle passen. Namen, die mit dem Wort beginnen, stehen vorn. Enter wählt den ersten Treffer, ein Klick auf eine Gattung beendet die Suche.
- **Schema 60:** `car`, `television`, die Option `tvMount` und die Plätze `screen` und `glass`. Eine 59er Datei lädt unverändert, eine 59er Datei mit diesen Werten wird abgelehnt.
- **IFC:** Fernseher als `IFCAUDIOVISUALAPPLIANCE` (DISPLAY). Der Pkw hat in IFC4 keine eigene Klasse und geht als `IFCBUILDINGELEMENTPROXY` hinaus.

**Abnahme im Browser (05.11.2026):**

| Schritt                           | Ergebnis                                             |
| --------------------------------- | ---------------------------------------------------- |
| Fenster öffnen                    | Suchfeld hat den Fokus                               |
| „bad“ tippen                      | Badewanne, WC, Waschtisch, Dusche                    |
| „wc“ tippen                       | WC, Fenster bleibt offen, kein Werkzeug springt an   |
| „xyz“ tippen                      | „Nichts gefunden für „xyz“.“                         |
| „auto“ und Enter                  | Pkw gewählt, Vorschau und Felder folgen              |
| Platzieren, Klick                 | Pkw im Grundriss                                     |
| „fernseher“ und Enter, Platzieren | Fernseher im Grundriss mit Fuß                       |
| 3D-Ansicht                        | Pkw mit Rädern, Scheiben und Dach, Fernseher mit Fuß |
| Doppelklick, Aufstellung Wand     | Fuß verschwindet, Klickfläche wird schmal            |

**Grenzen M3:**

- Der Pkw ist ein Modellauto: sichtbare Stufen, keine Radkästen, keine Lichter, ein Typ.
- Beim Wechsel auf „Wand“ bleibt „Über Boden“ auf dem alten Wert.
- Die Suche kennt keine Tippfehler.
