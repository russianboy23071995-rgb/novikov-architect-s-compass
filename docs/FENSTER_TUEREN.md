# Fenster- und Türelemente in den Öffnungen

Nutzervorgabe (01.11.2026): Fenster und Tür bestehen aus einer Öffnung und einem darin eingesetzten Element. Solange es die Elemente nicht gibt, zeigt der Schnitt nur die Öffnung – nichts wird erfunden. Entscheidungen: Das Werkzeug setzt Öffnung und Element zusammen, Schalter „nur Öffnung“; Lage des Fensters in der Wand frei wählbar, Vorgabe Mitte; zuerst nur Festverglasung; Reihenfolge Datenmodell → 3D/Schnitt → Grundriss → IFC.

| Schritt | Inhalt | Stand |
| --- | --- | --- |
| FT1 | Datenmodell (Schema 42), Werkzeugvorgaben, Elementfenster | erledigt |
| FT2 | Rahmen, Glas, Türblatt als Körper in 3D und Schnitt | erledigt |
| FT3 | Grundrisssymbol nach Element | erledigt |
| FT4 | IFC mit Geometrie und Laibungsangaben, Prüfung in Archicad | erledigt, Archicad-Prüfung offen |

## FT1 – Datenmodell und Einstellungen

- **Schema 42:** Fenster und Türen haben optional `insert`. Fehlt es, ist es eine reine Öffnung (z. B. Durchbruch). Schema-41-Dateien laden unverändert als reine Öffnungen; ein untergeschobenes `insert` in einer v41-Datei wird abgelehnt.
- **Fensterelement:** Rahmenbreite (Vorgabe 7 cm, 2–30 cm), Rahmentiefe (8 cm, 2–50 cm), Lage in der Wand Innen/Mitte/Außen (Vorgabe Mitte) mit Abstand zur Wandseite (0–50 cm, bei Mitte ohne Bedeutung), Außenseite (rechts oder links der Wandrichtung, Vorgabe rechts – Wände kennen ihre Außenseite noch nicht, deshalb je Fenster wählbar), Teilung (nur Festverglasung; Flügel folgen ohne erneuten Schemawechsel als weitere Werte), Fensterbank innen (Überstand 2 cm) und außen (4 cm), jeweils an/aus.
- **Türelement:** Zargenbreite (6 cm, 2–30 cm), Zargentiefe (ohne Angabe = Wanddicke), Blattdicke (4 cm, 2–12 cm). Anschlag und Öffnungsseite bleiben an der Tür.
- **Passt es?** Das Element muss in Öffnung und Wand passen, sonst wird es mit Begründung abgelehnt: Rahmen lässt kein Glas übrig, Rahmentiefe größer als die Wanddicke, Abstand und Tiefe passen nicht in die Wand; bei der Tür kein Durchgang, Zarge tiefer als die Wand, Blatt dicker als die Zarge.
- **Werkzeug:** Fenster- und Türwerkzeug setzen Öffnung und Element zusammen. Im Werkzeugfenster (Doppelklick auf das Werkzeug) neue Rubrik „Fensterelement“ bzw. „Türelement“ mit allen Werten und dem Schalter „… einsetzen (aus: nur Öffnung)“. Die Vorgabe gilt für die Sitzung und das Projekt wie die übrigen Werkzeugvorgaben. Passt das Element nicht in die angefahrene Wand (z. B. 8 cm Rahmen in 6 cm Wand), wird das Platzieren mit Begründung abgelehnt.
- **Elementfenster:** Doppelklick auf ein Fenster bzw. eine Tür – Rubrik „Fensterelement“/„Türelement“ mit denselben Feldern; einsetzen, ändern, entfernen; jede Änderung ein Rückgängig-Schritt. Eingaben in cm, übernommen bei Enter oder beim Verlassen des Feldes.
- Noch nicht sichtbar: 3D, Schnitt, Grundriss und IFC zeigen weiterhin die Öffnung (FT2–FT4). Bestehende Fenster (auch das Fenster des Startprojekts) bleiben reine Öffnungen, bis man ein Element einsetzt.

Umsetzung: `src/domain/elements/window/insert.ts` (Schemas, Vorgaben, Passprüfung, Bereichsprüfung), `src/domain/elements/door/model.ts` (`insertedDoorSchema`), `src/domain/project/schema.ts` (Schema 42, `validateStoreyInserts`), `src/domain/project/format.ts`, `src/interop/project-file/load.ts` (Migration 41 → 42), `src/application/openings/inserts.ts` (`setOpeningInsert`), `src/application/drawing/window-placement.ts` und `door-placement.ts` (Element beim Platzieren), `src/components/cad/OpeningInsertFields.tsx`, `CadWorkspace.tsx` (Rubriken im Werkzeug- und Elementfenster), `BimInspector.tsx` („Add centred window“ mit Element).

Nachweis: `src/application/openings/inserts.test.ts` (5 Tests: Vorgaben; Passprüfung mit Begründungen und Bereichsprüfung; einsetzen, ändern, entfernen, Ablehnung; Migration 41 → 42 mit Ablehnung untergeschobener Elemente; Werkzeuge setzen Element, „nur Öffnung“, Ablehnung in zu dünner Wand); Versionsprüfungen der älteren Migrationstests auf 42 angehoben. 1443 Tests grün, Typprüfung beider Projekte, Architektur, Lint und Prettier sauber, 14-Modell-Hash unverändert.

Browser-Abnahme (01.11.2026, Port 8094, Startprojekt): Doppelklick auf das Fenster → Rubrik „Fensterelement“, Schalter aus (reine Öffnung); eingeschaltet → Vorgabewerte. Rahmenbreite 70 → „Außerhalb des zulässigen Bereichs …“; 9 → übernommen; Rahmentiefe 40 in 36-cm-Wand → „Die Rahmentiefe (40 cm) ist größer als die Wanddicke.“ Strg+Z stellt 7 cm wieder her. Werkzeugfenster Fenster → Rubrik „Fensterelement“ eingeschaltet; auf „nur Öffnung“ gestellt, Fenster platziert → dessen Rubrik zeigt „aus“. Tür im Browser nicht geprüft (durch Tests abgedeckt).

## FT2 – Körper in 3D und Schnitt

Aus den FT1-Werten abgeleitet (`src/rendering/viewport/opening-insert-solid.ts`), nicht gespeichert; reine Öffnungen bleiben leer:

- **Fenster:** Blendrahmen auf allen vier Seiten (Rahmenbreite × Rahmentiefe), Lage in der Wand nach Einstellung (Mitte, Innen/Außen mit Abstand, Außenseite links/rechts der Wandrichtung); Glasscheibe 2,4 cm in der Mitte der Rahmentiefe; Fensterbank außen 3 cm und innen 2,5 cm dick, vom Rahmen bis über die Wandseite (Überstand), auf der Brüstung der Öffnung.
- **Tür:** Zarge an beiden Leibungen und oben (keine Schwelle), bündig mit der Wandseite, zu der die Tür aufgeht; Tiefe nach Einstellung oder Wanddicke; Türblatt geschlossen, Blattdicke, ebenfalls bündig auf dieser Seite.
- **3D:** Die Körper gehören zum Gebäudekörper des Geschosses (`buildPreviewSolid`), Flächen tragen die Fenster- bzw. Tür-ID und `opening`, die Scheibe `glass`. Farben: Rahmen weiß, Glas hellblau (deckend, noch keine Transparenz), Türblatt und Zarge hell holzfarben. Ein Klick auf Rahmen oder Glas wählt das Fenster bzw. die Tür (`pickSolidElement`). Wandfüße im Grundriss ignorieren die Elementflächen.
- **Schnitt:** Elementflächen werden wie Bauteile geschnitten und dahinter angesehen, aber getrennt verkettet (Rahmen und Glas eines Fensters je für sich). Darstellung: Bauteile weiter in der Schnittfarbe mit kräftiger Kontur (1,75 px), Rahmen und Fensterbänke als Umriss mit mittlerer Linie (1,1 px) über Hintergrund, Glas als dünner Umriss (0,6 px) – die Scheibe erscheint dadurch als schmale Doppellinie.
- 14-Modell-Prüfsumme unverändert: Die Vergleichsmodelle haben keine Elemente.

Grenzen: Glas deckend statt durchscheinend; keine Flügel, Beschläge, Anschläge oder Laibungsdämmung; die Fensterbank ist ein waagerechtes Brett ohne Gefälle und Tropfkante; Türblatt immer geschlossen; das Türblatt hat keinen Falz, es liegt bündig auf der Zarge.

Nachweis: `src/rendering/viewport/opening-insert-solid.test.ts` (3 Tests: Fenster mit Rahmen, Glas in der Mitte, Fensterbänke über die Wandseiten, Tür bündig zur Aufschlagseite; Lage Außen mit Abstand und gedrehte Außenseite verschieben den Rahmen, reine Öffnungen ohne Körper; Elemente im Gebäudekörper mit größerem Volumen, Schnitt durch das Fenster mit Wand als Bauteil, Rahmen/Fensterbänke als vier Umrisse und Glas als eigener Umriss). 1446 Tests grün, Typprüfung beider Projekte, Architektur, Lint und Prettier sauber, 14-Modell-Hash unverändert.

Browser-Abnahme (01.11.2026, Port 8094, Startprojekt): Fensterelement im Elementfenster eingesetzt; 3D-Ansicht zeigt weißen Rahmen, blaue Scheibe und Fensterbank in der Öffnung. Schnitt quer durch das Fenster: Wand oben und unten in der Schnittfarbe, dazwischen Rahmen oben und unten, Glas als schmale Doppellinie, Fensterbänke innen und außen. Bildschirmfotos an den Nutzer. Tür nur durch Tests geprüft; die Auswahl per Klick auf Rahmen oder Glas in 3D ist umgesetzt, aber weder im Browser noch durch einen Test geprüft.

## FT3 – Grundrisssymbol

Aus denselben Teilen wie der 3D-Körper (`windowInsertBoxes`, `doorInsertBoxes` mit Teilebezeichnung Pfosten/Riegel/Glas/Fensterbank/Blatt), damit Grundriss, 3D und Schnitt übereinstimmen (`src/rendering/viewport/opening-plan-symbol.ts`):

- **Fenster mit Element:** beide Rahmenpfosten als geschnittene Profile (Wandlinienstärke, Hintergrundfüllung), die Glasscheibe zwischen den Pfosten als schmales Rechteck (halbe Linienstärke) und die Fensterbänke innen und außen bis über die Wandseiten (halbe Linienstärke, unter der Schnitthöhe gesehen). Die bisherige Mittellinie der Öffnung entfällt.
- **Tür mit Element:** beide Zargenpfosten als geschnittene Profile; Türblatt und Aufschlagbogen in der lichten Breite (Öffnungsbreite minus zweimal Zargenbreite), Drehpunkt am Zargenpfosten.
- **Reine Öffnung:** unverändert (Fenster mit Mittellinie, Tür mit Blatt über die ganze Öffnungsbreite).
- Auswahl, Hervorhebung, Ebenensichtbarkeit und Nummer wie bisher.

Grenzen: Fensterbank als Rechteck ohne Gefälle; keine Flügel- und Öffnungssymbole am Fenster (es gibt nur Festverglasung); kein Anschlag/Falz an der Zarge.

Nachweis: `src/rendering/viewport/opening-plan-symbol.test.ts` (2 Tests: Fensterpfosten, Glas und Fensterbänke an den richtigen Stellen, SVG-Spiegelung, reine Öffnung ohne Symbol; Zarge und lichte Breite der Tür). 1448 Tests grün, Typprüfung beider Projekte, Architektur, Lint und Prettier sauber, 14-Modell-Hash unverändert.

Browser-Abnahme (01.11.2026, Port 8094, Startprojekt): neue Wand gezeichnet, Tür und Fenster mit den Werkzeugen gesetzt (beide mit Element nach Vorgabe). Grundriss: Tür mit Zargenpfosten und Blatt in der lichten Breite, Fenster mit Pfosten, Glaslinie und Fensterbänken über die Wandseiten; das alte Fenster ohne Element zeigt weiter die reine Öffnung. Bildschirmfoto an den Nutzer.

## FT4 – IFC

- **Körper:** Ein Fenster bzw. eine Tür mit Element bekommt im regulären Export einen echten `Body` (`SweptSolid`): je Teil ein `IfcExtrudedAreaSolid` aus `IfcRectangleProfileDef` (Profilname = Teil: `jamb`, `rail`, `glass`, `sill`, `leaf`), im Koordinatensystem der Platzierung des Fensters bzw. der Tür (Ursprung linke untere Ecke der Öffnung; bei Türen, die nach rechts aufgehen, gedreht wie bisher). Dieselben Teile wie in 3D, Schnitt und Grundriss (`src/domain/elements/window/insert-geometry.ts`, aus `rendering` in die Fachschicht verschoben, damit IFC sie nutzen darf). Koordinaten auf 1 nm gerundet.
- **Laibung:** Je Element ein `IfcWindowType` bzw. `IfcDoorType` mit `IfcWindowLiningProperties` (LiningDepth = Rahmentiefe, LiningThickness = Rahmenbreite) bzw. `IfcDoorLiningProperties` (Zargentiefe bzw. Wanddicke, Zargenbreite) in `HasPropertySets`, verbunden mit `IfcRelDefinesByType`, dazu die Basismengen (Breite, Höhe, Fläche) wie in Variante V3. Der Typ entsteht für Elemente auch ohne die Option `fillingTypes`.
- **Eigenschaften:** NOVIKOV_BIM erhält FrameWidth, FrameDepth, FrameLocation, FrameOffset, ExteriorSide, Division und die Überstände der Fensterbänke bzw. FrameWidth, FrameDepth, LeafThickness. `PlaceholderBody` entfällt bei Elementen.
- **Reine Öffnungen:** unverändert (ohne Körper oder nach gewählter Variante V1–V3).
- **Abnahmedatei:** `benchmarks/insert-ifc-acceptance.ts <datei.ifc>` – der Raum der Fensterprobe (6 × 4 m, Wände 30 cm), beide Fenster und die Tür mit Element in den Vorgabewerten, das große Fenster außen mit 2 cm Abstand. Erzeugt am 01.11.2026 als `Claude_Ablage_Code/ifc-abnahme/FT4-Fenster-Tueren.ifc` (395 Zeilen, 25 Extrusionskörper, drei Laibungsangaben).

Grenzen: Keine Fensterflügel, Beschläge oder Öffnungssymbole im IFC; Materialien/Farben der Teile werden nicht geschrieben; der Typ gilt je Element (kein gemeinsamer Typ für gleiche Fenster); `LiningOffset` und die Paneelversätze bleiben leer; keine unabhängige Schemaprüfung (IfcOpenShell nicht installiert, Download nur mit Zustimmung). Ob Archicad Breite/Höhe, Körper und Laibung übernimmt (L21), prüft der Nutzer.

Nachweis: `src/interop/ifc/insert.test.ts` (2 Tests: Fensterkörper mit sieben Teilen und Glasmaß, reines Fenster ohne Körper, Laibung am Fenstertyp, Eigenschaften, kein Platzhalter; Türkörper im gedrehten Türkoordinatensystem mit Blatt auf der Aufschlagseite, Laibung mit 17 Attributen). 1450 Tests grün, Typprüfung beider Projekte, Architektur, Lint und Prettier sauber, 14-Modell-Hash unverändert. Im Browser nicht geprüft (Export ist ein Dateidownload); die Abnahmedatei kommt aus derselben Exportfunktion.

## Archicad-Rückmeldung zu FT4 (01.11.2026) und G1 – Farben und durchsichtiges Glas

Rückmeldung des Nutzers: Fenster- und Türelemente werden in Archicad richtig dargestellt. Die Gläser sind aber graue, undurchsichtige Flächen, und die Beschriftung zeigt weiterhin „0,00 m x 0,00 m“.

**G1 (erledigt):**
- **IFC:** Jedes Elementteil trägt einen Oberflächenstil (`IfcStyledItem` → `IfcSurfaceStyle` .BOTH. → `IfcSurfaceStyleRendering`): „Fensterrahmen“ weiß (0,95), „Glas“ hellblau (0,60/0,76/0,88) mit Transparenz 0,7, „Tür“ hell holzfarben (0,88/0,82/0,72). Ein Stil je Aussehen, gemeinsam genutzt (`INSERT_LOOKS` in `writer.ts`). Vorher hatten die Teile keinen Stil, Archicad zeigte sie deshalb grau.
- **3D-Ansicht:** Glas ist durchscheinend (Deckkraft 0,35). Der Vertexpuffer trägt dazu ein achtes Feld (Deckkraft); gezeichnet wird in zwei Durchgängen: erst alles Undurchsichtige mit Tiefenschreiben, dann das Glas gemischt ohne Tiefenschreiben. Ausgewähltes Glas erscheint deckend in der Auswahlfarbe.
- Neue Abnahmedatei: `Claude_Ablage_Code/ifc-abnahme/G1-Fenster-Tueren-Glas.ifc` (gleicher Raum wie FT4, 422 Zeilen, 18 gestylte Teile).

**Beschriftung „0,00 x 0,00“ (G2, offen):** Breite und Höhe stehen am IfcWindow/IfcDoor (OverallWidth/OverallHeight), in den Basismengen am Typ und jetzt im echten Körper. Vermutung: Archicad liest die Beschriftung aus Parametern seines eigenen Fensterobjekts, die ein importiertes IFC-Fenster nicht hat. Antwort des Nutzers (01.11.2026, Archicad 26): Glas jetzt korrekt; die Fenster werden als Fenster mit den richtigen Maßen erkannt, nur die Beschriftung (Marker) zeigt „0,00 x 0,00“. Die Maße kommen also an; offen ist, aus welcher Quelle der Marker liest.

Nachweis G1: `src/interop/ifc/insert.test.ts` (neuer Test: drei Stile, Glas mit 0,7 Transparenz, alle 11 Teile gestylt, Glasstil nur an der Scheibe), `src/rendering/viewport/opening-insert-solid.test.ts` (neuer Test: Deckkraft Glas 0,35, Rahmen und Tür 1, ausgewähltes Glas 1); Referenzpacker in `benchmarks/solid-resource.test.ts` um das Deckkraftfeld ergänzt. 1452 Tests grün, Typprüfung beider Projekte, Architektur, Lint und Prettier sauber, 14-Modell-Hash unverändert. Browser-Abnahme: Startprojekt mit zweiter Wand dahinter, Fensterelement eingesetzt – in 3D sieht man durch die Scheibe die Wand dahinter und das Raster.

## R1 – Seite per Klick beim Platzieren

Nutzervorgabe (01.11.2026): Die Fensterrichtung wird beim Platzieren per Klick in die richtige Richtung ermittelt. Bis dahin kam auch bei Türen die Aufschlagseite nur aus der Werkzeugvorgabe; beide nutzen jetzt denselben Ablauf.

- **Klick 1** setzt die Position in der Wand (wie bisher, mit Fang und „Position per Maß“). **Klick 2** auf eine Seite der Wand legt fest: beim Fenster die Außenseite, bei der Tür die Seite, zu der sie aufgeht. Maßgebend ist die Seite des Zeigers bezogen auf die Wandrichtung am Platz von Klick 1 (`wallSideOf`). Dazwischen zeigt die Vorschau die Seite unter dem Zeiger (Aufschlagbogen, Fensterbank außen, Rahmenlage). Fang ohne Wandachse, der Zeiger darf die Wand verlassen. Esc nach Klick 1 bricht ab. Ein Rückgängig-Schritt für das ganze Platzieren.
- Ein Fenster ohne Element (Vorgabe „nur Öffnung“) hat keine Seite und wird weiter mit einem Klick gesetzt.
- Werkzeugvorgabe: Tür ohne „Aufschlag“ und „DIN“ (die DIN-Richtung folgt aus Anschlag und geklickter Seite und steht im Türfenster); Fensterelement zeigt „Außenseite: per Klick beim Platzieren“. Im Elementfenster bleiben beide Felder zum späteren Umdrehen.
- Hinweiszeile im Werkzeug: „Klick 1 Position, Klick 2 …“, nach Klick 1 „Klick auf die Außenseite der Wand“ bzw. „… Seite, zu der die Tür aufgeht“.

Umsetzung: `src/application/drawing/window-placement.ts` (`wallSideOf`, `openingSideInteraction`), `src/components/cad/useOpeningPlacement.ts` (zweite Phase mit festgehaltener Position und Wand), `useWindowPlacement.ts`/`useDoorPlacement.ts` (welcher Entwurf eine Seite braucht und wie sie gesetzt wird), `DoorPlacementFields.tsx`, `WindowPlacementFields.tsx`, `OpeningInsertFields.tsx`, `CadWorkspace.tsx`.

Nachweis: neuer Test in `src/application/openings/inserts.test.ts` (Seite links/rechts, Vorschau folgt dem Zeiger ohne zu übernehmen, Klick übernimmt, Abbruch; Tür ebenso). 1453 Tests grün, Typprüfung beider Projekte, Architektur, Lint und Prettier sauber, 14-Modell-Hash unverändert. Browser-Abnahme: Tür – Zeiger oberhalb der Wand zeigt den Aufschlag nach oben, Klick unterhalb setzt die Tür nach unten aufgehend; Fenster – die Fensterbank außen wechselt mit der Zeigerseite (im Grundrisspfad nachgeprüft), Klick 2 setzt, Strg+Z nimmt es in einem Schritt zurück; Esc nach Klick 1 setzt nichts und wechselt zum Auswahlwerkzeug.

## Fensterflügel (FL1–FL4)

Nutzerwahl (01.11.2026): als nächstes Thema die Fensterflügel, in vier Schritten wie FT1–FT4.

| Schritt | Inhalt | Stand |
| --- | --- | --- |
| FL1 | Teilungen und Öffnungsarten im Modell, Werkzeug- und Elementfenster | erledigt |
| FL2 | Flügelrahmen, Pfosten, Kämpfer in 3D und Schnitt | offen |
| FL3 | Flügel im Grundriss, Öffnungsdreiecke in der Ansicht | offen |
| FL4 | IFC: PartitioningType, Paneel-Angaben, Flügelkörper | offen |

### FL1 – Teilungen und Öffnungsarten

- **Teilung** (Feld des Fensterelements, Schema bleibt 42): Festverglasung, **1-flüglig**, **2-flüglig mit Pfosten**, **1-flüglig mit Oberlicht** (Kämpfer, darüber fest).
- **Flügel** (`sashes`, von innen gesehen links nach rechts, so viele wie die Teilung hat): Öffnungsart Dreh, Dreh-Kipp oder Kipp; Anschlag links/rechts von innen (bei Kipp gesperrt, der Flügel ist unten angeschlagen).
- **Maße** (optional, sonst Vorgabe): Flügelrahmen 6 cm (2–20 cm), Pfosten bzw. Kämpfer 8 cm (2–30 cm), lichte Oberlichthöhe 40 cm (10–200 cm).
- Wechsel der Teilung setzt die üblichen Flügel: 1-flüglig und Oberlicht Dreh-Kipp links; 2-flüglig links Dreh, rechts Dreh-Kipp (Stulpflügel rechts). Die übrigen Werte bleiben.
- **Passt es?** Die Teilung braucht genau ihre Flügel („1-flüglig braucht einen Flügel“); in jedem Flügel muss nach Rahmen, Pfosten bzw. Kämpfer und Flügelrahmen Glas bleiben, sonst „Der Flügelrahmen (… cm) lässt im Flügel kein Glas übrig“.
- Felder im Werkzeug- und Elementfenster (Rubrik „Fensterelement“): Teilung, Flügelrahmen, Pfosten/Kämpfer, Oberlichthöhe, je Flügel Öffnungsart und Anschlag.
- Noch nicht sichtbar: 3D, Schnitt, Grundriss und IFC zeigen weiter eine Festverglasung (FL2–FL4).

Umsetzung: `src/domain/elements/window/insert.ts` (Teilungen, Öffnungsarten, `SASH_DEFAULTS`, `divisionSashes`, `withDivision`, Passprüfung), `src/components/cad/OpeningInsertFields.tsx`.

Nachweis: neuer Test in `src/application/openings/inserts.test.ts` (Vorgaben, Flügel je Teilung, Wechsel behält Werte, drei Teilungen passen in 1,20 × 1,35 m, fehlender Flügel, zu breiter Flügelrahmen, zu hohes Oberlicht, Speichern/Laden mit Kippflügel, Bereichsprüfung). 1455 Tests grün, Typprüfung beider Projekte, Architektur, Lint und Prettier sauber, 14-Modell-Hash unverändert. Browser-Abnahme: Fensterelement im Startprojekt, Teilung 2-flüglig → Flügelrahmen, Pfosten, „Flügel links Dreh links“, „Flügel rechts Dreh-Kipp rechts“; linker Flügel auf Kipp → Anschlag gesperrt; Teilung Oberlicht → Kämpfer und Oberlichthöhe, ein Flügel, kein Fehler.
