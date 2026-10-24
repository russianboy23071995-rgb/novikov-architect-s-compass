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

# Tür, Teil B2: 3D-Türblatt, 3D-Umriss, Fang an Laibungen (24.10.2026)

Basis: feat/door-part-b (Teil B1, PR447 noch nicht gemergt). Verschieben per Maus ist
abgetrennt (Teil B3), weil es nach A04 einen vorbereiteten Vorschauweg und Messung braucht.

## Änderungskarte B2

1. **3D-Türblatt (Darstellung):** `rendering/viewport/door-leaf.ts` leitet je sichtbarer Tür ein
   geschlossenes Blatt ab (vorläufig 4 cm), bündig mit der Wandfläche auf der Aufschlagseite,
   von Geschossoberkante + Z-Versatz bis zur Türhöhe. Reine Anzeigeflächen mit der Tür-ID:
   kein Wandmaterial, keine Mengen, kein Export, kein Picking-Körper. `BimSolidView` hängt
   sie nur an die gezeichnete Geometrie an (nicht während einer Geometrievorschau).
2. **3D-Umriss:** Die ausgewählte Tür erhält denselben Öffnungsumriss wie ein Fenster.
3. **Fang an Laibungen:** `application/snapping/project-references.ts` liefert je Tür vier
   Laibungsecken (Anfang/Ende × beide Wandflächen) als Endpunkt-Referenzen mit Tür-ID und
   Wandrichtung. Teilergebnis je Tür nur für eigene Snapshots zwischengespeichert und nur
   wiederverwendet, wenn auch die Wand unverändert ist.
4. **Folgen:** keine Änderung an Wandkörpern, Mengen, IFC oder Dateiformat.

## Nachweis B2

- Neue Tests: `rendering/viewport/door-leaf.test.ts` (Lage auf beiden Aufschlagseiten,
  Z-Versatz und Geschosshöhe, Sichtbarkeit von Tür und Wand), `application/snapping/door-snap.test.ts`
  (vier Laibungsecken, Fang am Laibungspunkt, Cache folgt geänderter Wand). Gegenprobe:
  Cache ohne Wandvergleich lässt den Test scheitern.
- 1206 Tests, Architektur-Check PASS, beide Typprüfungen, Lint, Build.
- **Bedienabnahme:** Tür auf 6-m-Wand gesetzt; Linienwerkzeug zeigt an der Laibungsecke
  „Endpunkt“; in 3D ist die Öffnung durch das Blatt geschlossen, Aufschlag links → Blatt
  auf der hinteren, rechts → auf der vorderen Wandfläche; Klick in die Öffnung wählt die Tür
  mit Umriss. Server-Log ohne Fehler nach den B2-Änderungen.

## Offen

- **Teil B3:** Tür per Maus entlang der Wand verschieben (vorbereitete Vorschau, Messung).
- Darstellungstiefe (Entwurf/Ausführung) und Blattdicke als spätere Einstellung.
- Externe IFC-Prüfung, Überlappung von Öffnungen, Löschen, DIN-Bezeichnung wie zuvor.

# Tür, Teil B3: Tür per Maus entlang der Wand verschieben (24.10.2026)

Basis: feat/door-part-b2 (PR448, noch nicht gemergt). Änderungskarte vom Nutzer freigegeben.

## Änderungskarte B3

1. **Gemeinsame Verschiebung:** `application/direct-edit/transforms.ts` führt `moveOpeningAlongWall`,
   `openingCentre` und `hostedOpening` für Fenster und Türen; `moveWindowAlongWall` ist nur
   noch der Fensteraufruf dieser Regel. Bereich und Begrenzung bleiben `boundedWindowPosition`.
2. **Bearbeitungssitzung:** `lib/bim/direct-edit.ts` kennt die Bauteilart „door“ und verteilt
   Anker und Mausauswertung für beide Öffnungen an die gemeinsame Regel. Bewusste, freigegebene
   Ausnahme: nur Verteilung, keine neue Logik in `lib/bim`; keine neue Abhängigkeit.
3. **Vorbereitete Vorschau:** `prepared-window.ts` wird `prepared-opening.ts`
   (`prepareOpeningAxisPreview`) für Fenster und Türen. Der Ausschnitt enthält jetzt auch die
   Türen der betroffenen Wände. Das behebt einen Fehler aus Teil A: beim Ziehen eines Fensters
   fehlte die Türöffnung derselben Wand in der Vorschau. Die Ausnahmenliste der
   Architekturprüfung führt dieselbe Abhängigkeit unter dem neuen Dateinamen.
4. **Angrenzend:** Fang schließt Tür und Wirtswand aus, Richtung entlang der Wand; keine freie
   Zahleneingabe („Türen bleiben an ihre Wand gebunden“); Kontextmenü „Tür entlang Wand“ mit
   Maßangaben; 3D-Arbeitsebene auf halber Türhöhe; Arbeitsgeschoss folgt einer gewählten Tür.

## Nachweis B3

- `benchmarks/door-preview.test.ts`: Fensterergebnis gleich der früheren Fensterregel;
  Türanker und Bewegung nur entlang der Wand; vorbereitete Vorschau = volle Prüfung (Projekt,
  Grundriss, 3D-Flächen, Öffnungsumrisse) für Tür, Nachbartür und Fenster über Ecke, T und
  schräg gedrehte Wände; kein Commit in der Vorschau, Bestätigung als ein Undo-Schritt.
  `demand-menu.test.ts`: Menüangaben der Tür. Gegenprobe: Türen aus dem Ausschnitt entfernt
  → 2 Tests scheitern (Tür- und Fensterfall).
- 1211 Tests, Architektur-Check PASS, beide Typprüfungen, Lint (0 Fehler), Build.
- **Messung** (`benchmarks/door-preview-profile.ts`, Rohdaten `door-preview-results.json`,
  Node, 5 Geschosse, 500 Wände mit je Fenster und Tür, drei Läufe, warmer Median):

  | Ziel    | Vorbereitung | volle Prüfung | vorbereitete Vorschau |
  | ------- | ------------ | ------------- | --------------------- |
  | Tür     | 8,7–16,0 ms  | 98–119 ms     | 0,79–1,24 ms          |
  | Fenster | 5,3–7,8 ms   | 84–88 ms      | 0,55–0,66 ms          |

  Kein Gesamtframe-/p95-Nachweis; React/UI/GC nicht enthalten.

- **Bedienabnahme:** 2D: Menü „Tür entlang Wand“, Vorschau, Klick übernimmt (Position
  0,1833 → 0,2833), ein Undo stellt sie wieder her. 3D: Tür wählen und entlang der Wand ziehen;
  beim Ziehen des Fensters bleibt die Türöffnung erhalten. Server-Log ohne Fehler.

## Offen

- **Überlappung:** Eine Tür lässt sich wie bisher über ein Fenster schieben; Nutzerentscheidung
  zu überlappenden Öffnungen steht aus.
- Während einer Geometrievorschau fehlt das 3D-Türblatt (Teil B2: nur Darstellung ohne Vorschau).
- Andere vorbereitete Vorschauen (Wandendpunkt, Auswahlbewegung, Z-Verschiebung) lassen Türen
  noch aus ihrem Ausschnitt; geprüft und korrigiert werden sie in einem eigenen Schritt.
- Externe IFC-Prüfung, Löschen, DIN-Bezeichnung wie zuvor.

# Türen in den übrigen vorbereiteten Vorschauen (24.10.2026)

Basis: feat/door-part-b3 (PR449, noch nicht gemergt). Änderungskarte freigegeben mit
**Nutzerentscheidung Variante B:** Bei einer Z-Verschiebung bewegen sich Türen mit ihrer Wand;
der geschossbezogene Z-Versatz ändert sich um die Änderung des Wandfußes.

## Änderungen

1. **Wandendpunkt/Strecken** (`application/direct-edit/prepared-endpoint.ts`): Türen der
   betroffenen Wände im Ausschnitt und in den ersetzten IDs (lokaler und voller Pfad).
2. **Auswahlbewegung XY** (`domain/project/prepared-translation.ts`): Türen der betroffenen
   Wände im Ausschnitt und in den ersetzten IDs; Maßprüfung wie bei Fenstern.
3. **Z-Verschiebung** (`application/selection/z-translation.ts`): Türen der bewegten Wände
   erhalten `zOffset + (neuer − alter Wandfuß)`; Vorschau prüft Türen wie Fenster; die
   Bestätigung schreibt die Türen mit und prüft das ganze Projekt. Türen unbewegter Wände
   bleiben unverändert.
4. **Nicht enthalten:** Türen in freier Gruppenauswahl, Überlappungsprüfung.

## Nachweis

- `benchmarks/door-scopes.test.ts`: Endpunkt (T-Anschluss und frei, Strecken und Kürzen),
  XY-Bewegung (einzelne Wand, Wandgruppen) und Z-Bewegung (−0,4/0/+0,7 m, mehrgeschossig mit
  Rohdeckenbezug): Vorschau = volle Operation in 3D-Flächen und Öffnungsumrissen; Z-Versatz der
  Türen folgt dem Wandfuß; Türen unbewegter Wände unverändert; ein Undo-Schritt.
- Gegenproben je Ausschnitt (Türen entfernt bzw. Z nicht angepasst): 1, 1 und 3 Tests
  scheitern.
- 1216 Tests, Architektur-Check PASS, beide Typprüfungen, Lint (0 Fehler), Build.
- **Messung** (`benchmarks/door-scopes-profile.ts`, Rohdaten `door-scopes-results.json`;
  500 Wände/Fenster auf fünf Geschossen, ohne und mit 500 Türen, eine Wand, warmer Median,
  drei Läufe): vorbereitete Vorschau mit Türen 0,27–0,57 ms (ohne Türen 0,28–0,71 ms), volle
  Operation 64–116 ms (ohne Türen 47–62 ms). Kein messbarer Mehraufwand durch Türen im
  Ausschnitt.
- **Bedienabnahme:** Wand mit Tür in 3D um 1 m verschoben, Öffnung in der Vorschau
  erhalten; Z-Verschiebung +0,5 m: Öffnung fährt in der Vorschau mit, danach Wand und Tür
  Z-Versatz 0,5. Server-Log ohne neue Fehler.

## Beobachtungen

- Eine Tür genau so hoch wie ihre Wand (Oberkante bündig) scheitert in der Volumenbildung
  („Geometriegrenzen numerisch nicht trennbar“); das gilt bereits vor diesem Schritt und
  betrifft die gemeinsame Öffnungsgeometrie.
- Beim Setzen landet eine Tür auch über einem Fenster (Überlappung, Entscheidung offen).
