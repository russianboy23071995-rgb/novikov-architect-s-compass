# Positionsnummern für Fenster und Türen (25.10.2026)

Basis: feat/menu-avoid-commandbar (PR455, noch nicht gemergt). Änderungskarte mit den
Empfehlungen freigegeben (Nutzerentscheidung 25.10.2026):

- **Schema:** `<Art>-<Geschoss>-<Nr>`, z. B. `T-EG-01`, `F-OG1-03`, `T-UG1-02`. Das
  Geschosskürzel folgt der Lage zum Erdgeschoss (EG, OG1 …, UG1 …), nicht dem Namen.
- **Vergabe:** automatisch beim Setzen (nächste Nummer nach der höchsten je Art und Geschoss,
  Lücken werden nicht aufgefüllt), gespeichert, frei änderbar; doppelte Nummern erlaubt (nur
  Hinweis); Löschen anderer Bauteile ändert keine Nummer.
- **Bestand:** Beim Laden einer Schema-27-Datei erhalten vorhandene Fenster und Türen Nummern
  in gespeicherter Reihenfolge (je Geschoss erst Fenster, dann Türen).
- **Anzeige:** Eigenschaften (Feld „Nummer“), Überlappungshinweis, Tür-Befehlsvorschau,
  Kontextmenü-Titel, Beschriftung im Grundriss. IFC und Navigator unverändert.

## Änderungen

- **Format:** Schema 28 (`PROJECT_SCHEMA_VERSION`), optionales Feld `mark` an Fenstern und Türen
  (`openingMarkSchema`, 1–32 Zeichen). Schema 27 bleibt streng ohne `mark`
  (`projectV27Schema`, `doorV27Schema`); Migration 27 → 28 in `interop/project-file/load.ts`.
- **Fachregel:** `domain/elements/wall/opening-marks.ts` (`storeyCode`, `nextOpeningMark`,
  `withOpeningMarks`, `openingLabel`, `duplicateMarkHint`).
- **Anwendung:** `application/openings/marks.ts` (`newOpeningMark`, `setOpeningMark`); Vergabe
  in `placeWindow`, `placeDoor` und „Add centred window“. Kein Code in `lib/bim`.
- **Oberfläche:** `MarkField` in den Eigenschaften von Fenster und Tür; `MarkLabel` im
  Grundriss (gegenüber dem Türaufschlag, nie kopfstehend, bildschirmkonstante Größe).
- **Tests älterer Migrationen:** vergleichen Geometrie und IDs ohne die neuen Nummern
  (`withoutOpeningMarks` in `src/test/legacy-project-fixture.ts`).

## Nachweis

- `src/domain/elements/wall/opening-marks.test.ts` (5 Tests): Geschosskürzel UG/EG/OG; Vergabe
  je Art und Geschoss, keine Lückenfüllung, stabil nach Löschen, fremde Freitexte ignoriert;
  Bearbeiten (Trimmen, leer abgelehnt, Doppelte nur Hinweis); Migration 27 → 28 mit Nummern,
  Rundlauf in Schema 28, Schema 27 mit `mark` abgelehnt; Hinweis, Befehl und Menü nennen die
  Nummer.
- Gegenproben (Zählen statt höchster Nummer / Migration ohne Nummern / Hinweis ohne Nummer):
  je 1 Test scheitert.
- 1236 Tests, Architektur-Check PASS, beide Typprüfungen, Lint (0 Fehler), Build.
- **Messung** (`benchmarks/opening-marks-profile.ts`, Rohdaten `opening-marks-results.json`;
  500 Fenster und 500 Türen): nächste Nummer 0,26–0,28 ms; alle Nummern vergeben 0,40–0,46 ms;
  Schema-27-Datei laden 13–14 ms gegenüber 7,5–8,3 ms für Schema 28 (einmalig).
- **Bedienabnahme:** Tür gesetzt → `T-EG-01` im Feld, im Grundriss und im Hinweis; Nummer auf
  „Haustür“ geändert → Hinweis und Menütitel folgen; Undo stellt `T-EG-01` her. Ein
  `ZodError` im Protokoll stammt vom Live-Neuladen während des Formatwechsels (Projekt im
  Speicher noch Version 27); nach frischem Laden fehlerfrei.

## Offen

- Fensterbefehle (Altgrammatik in `lib/bim/commands.ts`) nennen weiter die Fenster-ID.
- Umnummerieren auf Knopfdruck, Raumbezug und IFC-/Navigator-Anzeige sind nicht enthalten.
