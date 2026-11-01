# Fenster- und Türelemente in den Öffnungen

Nutzervorgabe (01.11.2026): Fenster und Tür bestehen aus einer Öffnung und einem darin eingesetzten Element. Solange es die Elemente nicht gibt, zeigt der Schnitt nur die Öffnung – nichts wird erfunden. Entscheidungen: Das Werkzeug setzt Öffnung und Element zusammen, Schalter „nur Öffnung“; Lage des Fensters in der Wand frei wählbar, Vorgabe Mitte; zuerst nur Festverglasung; Reihenfolge Datenmodell → 3D/Schnitt → Grundriss → IFC.

| Schritt | Inhalt | Stand |
| --- | --- | --- |
| FT1 | Datenmodell (Schema 42), Werkzeugvorgaben, Elementfenster | erledigt |
| FT2 | Rahmen, Glas, Türblatt als Körper in 3D und Schnitt | offen |
| FT3 | Grundrisssymbol nach Element | offen |
| FT4 | IFC mit Geometrie und Laibungsangaben, Prüfung in Archicad | offen |

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
