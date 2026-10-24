# Tür als erstes neues Bauteil, Teil A (24.10.2026)

Basis: main `19733c1` (PR445), Branch `feat/door-element-registry`. Bezug: R26-03 (Bauteile
einzeln mit Undo, Migration, Dateirundlauf), R26-05 (Tür-/Fensterlisten aus Modell-IDs),
N19 (Türen per Text/Sprache, Teil B), N25 (kein proportionales Skalieren von BIM).

## Nutzerentscheidungen (24.10.2026)

- Die Bauteiltyp-Registry wird mit der Tür als erstem neuen Bauteil eingeführt, nicht als
  leeres Gerüst (A02/A04).
- Türart Version 1: einflügelige Drehtür.
- Breite und Höhe frei wählbar; Standard Rohbaumaß 1,01 × 2,135 m (Baurichtmaß, DIN 18100);
  beide bezeichnen die Öffnung in der Wand.
- Die Tür gehört zu einem Geschoss und hat eine einstellbare Z-Verschiebung.
  Festlegung (Claude): Unterkante relativ zur Geschossoberkante, Standard 0; die Tür muss
  vollständig in ihre Wand passen, auch wenn diese einen Fußversatz hat.
- Anschlag und Aufschlagseite einstellbar.
- Darstellung: Grundriss Türblatt mit 90°-Schwenkbogen; 3D Öffnung mit geschlossenem
  Türblatt. **Künftig** sind Detailstufen je Planungsphase (z. B. Entwurf, Ausführung)
  nötig; das Symbol ist deshalb nur abgeleitet, nie im Modell gespeichert.

## Änderungskarte (umgesetzt in Teil A)

1. **Wunsch/Abnahme:** Türen in eine Wand setzen und bearbeiten (Maße, Position, Z-Versatz,
   Anschlag, Aufschlag, Ebene), ein Undo-Schritt je Änderung; Grundriss, 3D-Öffnung,
   Eigenschaften, Datei und Recovery wie beim Fenster.
2. **Eigentümer:**
   - `domain/elements/door/model.ts`: Schema, Standardmaße, Umrechnung in eine Wandöffnung.
   - `domain/elements/registry.ts`: Bauteilarten als typisierte Daten (Liste, Bezeichnung);
     die Auswahlarten (`ElementKind`) leiten sich davon ab. Aufzählungen in Sichtbarkeit,
     Auswahlindex, Ebenenzuordnung/-löschschutz und Navigator laufen über die Registry.
   - `domain/elements/wall/openings.ts`: gemeinsame Wandöffnung für Fenster und Tür; alle
     Wandregeln (Körper, Ecken, T-Anschlüsse, Wandabschlüsse) lesen `storeyOpenings`.
   - `domain/project/schema.ts`: Schema 27 mit optionaler Liste `doors`, Passprüfung
     (Länge, Höhe relativ zum Wandfuß), Ebene und eindeutige IDs; Migration 26 → 27 in
     `interop/project-file/load.ts`.
   - `application/doors/actions.ts`: `addDoor`/`updateDoor` mit eigenem Snapshot
     (`validateLike`), Standardebene „Tür“ über die reservierte Ebenen-ID.
   - `application/drawing/window-placement.ts`: gemeinsamer Platzierungsablauf
     `openingPlacementInteraction` für Fenster und Tür; `door-placement.ts` liefert nur
     Aktion und Einstellungen.
   - UI: gemeinsamer Hook `useOpeningPlacement`, Werkzeug „Tür“ (Taste T), Felder
     `DoorPlacementFields`, Eigenschaften `DoorProperties`; Grundrisssymbol aus
     `rendering/viewport/door-symbol.ts`.
3. **Gemeinsamer Weg:** dieselben Aktionen für Werkzeug, Eigenschaften und künftig
   Text/Sprache/KI; volle Prüfung, ein Undo-Schritt.
4. **Folgen:** 3D-Wandkörper bekommen die Öffnung automatisch (auch an Ecken/T-Anschlüssen);
   Sichtbarkeit verlangt sichtbare Tür und sichtbare Wand.
5. **Abgrenzung (Teil B):** 3D-Türblatt, Auswahl der Tür in 3D, IFC (`IfcDoor` und Öffnung),
   Text-/Sprachbefehle, direkte Bearbeitung/Verschieben, Fangpunkte an Türkanten,
   vorbereitete Vorschauen mit Türen.

## Nachweis

- `application/doors/actions.test.ts`: Standardmaß/Standardebene/Dateirundlauf; freie Maße
  mit Passprüfung; Z-Versatz relativ zum Geschoss auch bei angehobener Wand; Anschlag und
  Aufschlag mit einem Undo; doppelte IDs abgelehnt; 3D-Öffnung; Wandabschlussregel nennt die
  Tür; Schema-26-Dateien migrieren ohne Türen und können keine Türen einschmuggeln.
- `rendering/viewport/door-symbol.test.ts`: Anschlag/Aufschlag platzieren Türblatt und
  Bogen auf der richtigen Laibung und Wandseite; Viertelkreis mit Türbreite als Radius.
- 1192 Tests, Architektur-Check PASS (Türaktionen bewusst in Application, nicht in
  `lib/bim`), beide Typprüfungen, Lint (0 Fehler), Build.
- **Bedienabnahme (CadWorkspace):** Werkzeug „Tür“ mit Standardwerten; Klick auf die Wand
  setzt die Tür (Elemente 2 → 3), Grundriss zeigt Öffnung, Türblatt und Bogen; Anschlag
  „Seite Wandende“ und Aufschlag „rechts“ spiegeln das Symbol korrekt; Breite 9 m mit
  „muss in die Wandlänge passen“ abgelehnt, ohne Undo-Schritt; zweimal Undo stellt den
  Ausgangszustand her; 3D zeigt die Öffnung vom Boden bis 2,135 m. Keine Konsolenfehler
  nach frischem Laden.

## Offen

- **Teil B** wie oben.
- **Überlappende Öffnungen:** Weder Fenster untereinander noch Tür und Fenster werden auf
  Überlappung geprüft (bestehendes Verhalten). Eine Regel würde auch bestehende Fenster
  betreffen und alte Dateien möglicherweise ablehnen; das ist eine Fachentscheidung.
- **Löschen:** Die App kann derzeit kein Bauteil löschen (auch Wand/Fenster nicht); Türen
  daher ebenfalls nicht. Allgemeines Löschen ist ein eigener Auftrag.
- **Bezeichnung „DIN links/rechts“:** Die UI benennt Anschlag und Aufschlag geometrisch
  (Seite Wandanfang/-ende, links/rechts der Wandrichtung); eine DIN-Bezeichnung wäre eine
  zusätzliche, fachlich zu prüfende Ableitung.
- Darstellungsdetailstufen je Planungsphase (Anforderung, nicht umgesetzt).

# Tür, Teil B1: IFC, Text/Sprache, 3D-Auswahl (24.10.2026)

Basis: main `6acc8e4` (PR446), Branch `feat/door-part-b`. Freigabe: Nutzer („freigabe und go“).

## Zuschnitt

Teil B wurde geteilt. Die 3D-Flächen tragen fest eine Wand-ID, und mehrere 3D-Funktionen
(Bewegungsvorschau, Pufferaufteilung, Fußkanten) schlagen jede Fläche als Wand nach. Ein
Türblatt dort einzuhängen wäre riskant; es kommt in **Teil B2** als eigene Darstellungsschicht,
zusammen mit Verschieben per Maus und Fang an Türkanten.

## Änderungskarte B1

1. **IFC (R26-06, A01):** `interop/ifc/writer.ts` exportiert jede Tür als `IfcDoor` mit eigener
   `IfcOpeningElement`, `IfcRelVoidsElement` und `IfcRelFillsElement`, im Geschoss enthalten.
   `OperationType` SINGLE_SWING_LEFT/RIGHT nach IFC4-Konvention (Tür-Platzierung +Y zeigt zur
   Aufschlagseite, bei Aufschlag rechts um 180° gedreht; Anschlagseite von dort gesehen).
   Zusätzlich eindeutige Eigenschaften `Hinge`, `OpensTo`, `ZOffset`, `RelativePosition`,
   `WallId`. Öffnungsunterkante folgt dem Z-Versatz relativ zum Wandfuß.
2. **Text und Sprache (N19):** `application/doors/command.ts`, eingehängt im gemeinsamen
   Befehlsweg `application/commands/selection-command.ts` vor der bisherigen Grammatik:
   „Türbreite/Türhöhe/Z-Versatz auf Zahl m/cm/mm“, „Tür zentrieren“, „Anschlag Wandanfang/
   Wandende“, „Aufschlag (nach) links/rechts“. Vorschau mit Zusammenfassung, dann ein
   Undo-Schritt; fremder Text bleibt der übrigen Grammatik überlassen.
3. **3D-Auswahl:** Die Trefferflächen in Öffnungen (`window-selection.ts`) gelten für Fenster
   und Türen und tragen ihre Bauteilart; Picking (`pickSolidElement`, `world-picking.ts`),
   Umriss und Rahmenauswahl im Grundriss (`selection-shapes.ts`) kennen Türen.
4. **Folgen:** keine Änderung an Wandkörpern, Mengen oder Dateiformat.

## Nachweis

- Neue Tests: `interop/ifc/door.test.ts` (OperationType für alle vier Kombinationen; IfcDoor
  füllt eigene Öffnung; Eigenschaften; Containment; Öffnungsunterkante über angehobener
  Wand), `application/doors/command.test.ts` (Maße mit Einheiten, Anschlag/Aufschlag,
  Abgrenzung zur übrigen Grammatik, Ablehnung ungültiger Werte, gemeinsamer Befehlsweg),
  `rendering/viewport/door-picking.test.ts` (Trefferfläche mit Z-Versatz, 3D-Klick wählt die
  Tür, Rahmenauswahl).
- 1202 Tests, Architektur-Check PASS, beide Typprüfungen, Lint (0 Fehler), Build.
- **Bedienabnahme:** Tür gesetzt; Befehl „Türbreite auf 1,26 m“ zeigt Vorschau 1,01 → 1,26 m
  und übernimmt; in 3D wählt ein Klick auf die Wand die Wand und ein Klick in die
  Türöffnung die Tür; keine Konsolenfehler nach frischem Laden.

## Offen

- **Teil B2:** Türblatt in 3D, Verschieben per Maus, Fang an Türkanten.
- **IFC extern prüfen:** Die `OperationType`-Zuordnung folgt dem IFC4-Text, ist aber nicht in
  einem externen Viewer oder mit IfcOpenShell geprüft (das Prüfskript des Projekts braucht
  IfcOpenShell 0.8.5, lokal nicht installiert).
- Überlappende Öffnungen, Löschen und DIN-Bezeichnung wie in Teil A.
