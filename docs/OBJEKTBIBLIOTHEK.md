# Objektbibliothek (L44, ab 05.11.2026)

Nutzerauftrag 04.11.2026: Objektbibliothek mit Möbeln, Sanitär und eigenen Objekten. Änderungskarte mit „Go“ freigegeben, Umsetzung in drei PRs.

Nutzerentscheidung 05.11.2026: Die Bibliothek wird schrittweise aufgewertet. Zuerst das Werkzeug, dann ein bis zwei saubere Möbel mit Bauregeln, Modulen, Material und Farbe. Der Import fremder Dateien ist zurückgestellt. Die 3D-Darstellung bleibt vorerst vereinfacht und wird später erweitert.

| PR  | Inhalt                                                                               | Stand    |
| --- | ------------------------------------------------------------------------------------ | -------- |
| O1  | Element Objekt, Katalog mit 15 Objekten, Dateiformat 57, 3D, Grundriss, IFC, Bewegen | erledigt |
| M1  | Werkzeug Bibliothek, Katalogfenster, Einstellungen, Eigenschaften, Pipette (war O2)  | erledigt |
| M2  | Bauregeln, Dateiformat 59, Esstisch mit Stühlen, Material und Farbe, danach Sofa     | offen    |
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
