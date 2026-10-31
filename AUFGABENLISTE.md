# NOVIKOV CAD – Aufgabenliste

Deine Arbeitsliste: Was ist offen, was wünschst du dir? **Du darfst diese Datei frei bearbeiten:** Punkte ergänzen, umformulieren, Priorität setzen, streichen. Ich lese sie, bevor ich dir einen nächsten Auftrag vorschlage, und hake Punkte ab, wenn sie gemergt sind.

So benutzt du sie:

- **Neuer Wunsch:** unten unter „Deine Wünsche“ eine Zeile nach der Vorlage anlegen. Ein Satz reicht. Details klären wir in der Änderungskarte.
- **Priorität:** in der Spalte „Prio“ `hoch`, `mittel` oder `später` eintragen (leer = noch nicht bewertet).
- **Auftrag geben:** z. B. „Nimm L07 aus der Aufgabenliste“. Vor jeder Umsetzung bekommst du wie gewohnt eine Änderungskarte.
- **Status:** `offen` · `Karte vorgelegt` · `in Arbeit` · `erledigt (PRnnn)` · `zurückgestellt` · `gestoppt`.

Verbindlich für die Umsetzung bleiben Masterplan und Register. Ein Wunsch aus dieser Liste wird beim Auftrag dort eingetragen.

**Stand:** 31.10.2026 · main nach PR520

## Deine Wünsche

| ID  | Wunsch                                                                                                                    | Prio | Status               | Notiz                  |
| --- | ------------------------------------------------------------------------------------------------------------------------- | ---- | -------------------- | ---------------------- |
| W04 | Wanddarstellung: Schnittfarbe wählbar (grau/schwarz/weiß/eigene) unter View; Bauzustand Bestand/Neubau/Abbruch |      | S1 erledigt (PR520), S2 offen | docs/SCHNITTDARSTELLUNG.md |
| W03 | On-Demand-Menü und Eingabefenster kleiner, Position merken; Eingabe ohne Knöpfe; Piktogramme folgen |      | erledigt (PR519), Piktogramme offen | docs/HILFSFENSTER.md |
| W02 | Jedes Werkzeug mit eigenem Einstellungsfenster; Doppelklick auf Werkzeug oder Element öffnet es                   |      | erledigt (PR517–518)          | docs/EINSTELLUNGSFENSTER.md |
| W01 | Polygon-Regeln 1–7 (Ecken bewegen/löschen, Schließen am Startpunkt, Decke als Kontur, Fangpunkt-Namen, Standardgeschosse) |      | erledigt (PR495–498) | docs/POLYGON_REGELN.md |

## Bauteile und Fachmodell

| ID  | Aufgabe                                                                                                          | Prio | Status                                                                                                                             | Bezug              |
| --- | ---------------------------------------------------------------------------------------------------------------- | ---- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| L01 | Mehrgeschossige Wände (z. B. EG bis 3. OG, Fensterfronten über Geschosse), gestapelte Wände wirken als eine Wand |      | offen                                                                                                                              | Vision 27.10., A08 |
| L02 | Gast-Anzeige: Wände anderer Geschosse im Grundriss zeigen, wenn sie die Schnittebene (≈ 1 m) durchdringen        |      | offen                                                                                                                              | Vision 27.10., A08 |
| L03 | Decken als echtes Bauteil (heute nur angenommene Rohdecke 0,20 m)                                                |      | A+B+C1+Umriss erledigt (PR486–494), Archicad abgenommen 29.10.; C3 Variante A erledigt (PR499), Materialvorrang später             | §6 Abschnitt 2     |
| L04 | Dächer, inklusive Wände an Dachflächen trimmen (auch über zwei Geschosse)                                        |      | einflächiges Dach erledigt (PR502–506); Trimmen erledigt (PR515–516, Archicad bestätigt); Archicad: sauber, aber als Objekt nicht bearbeitbar; Walm/Trimmen/Gauben später (N62, V09) | §6, §8 Dachtrimmen |
| L05 | Stützen                                                                                                          |      | offen                                                                                                                              | §6 Abschnitt 2     |
| L06 | Treppen                                                                                                          |      | offen                                                                                                                              | §6 Abschnitt 2     |
| L07 | Schichtaufbau von Wänden (Mauerwerk, Dämmung, Putz …)                                                            |      | offen                                                                                                                              | §6 Abschnitt 2     |
| L08 | Räume (Raumflächen, Raumstempel)                                                                                 |      | erledigt: R1–R4 (PR507–512) inkl. Tab-Auswahl; Archicad bestätigt; offen: WoFlV (N35)                                              | §6 Abschnitt 2/4   |
| L09 | Ungleiche Wandquerschnitte an Anschlüssen                                                                        |      | offen                                                                                                                              | §6, §8             |
| L10 | Geschoss ohne oberes Geschoss bzw. Einfügen zwischen gebundenen Geschossen (zurzeit gesperrt, Fachentscheidung)  |      | erledigt durch PR490 (Bindung ans eigene Geschoss)                                                                                 | §9                 |

## Pläne und Dokumentation

| ID  | Aufgabe                               | Prio | Status | Bezug          |
| --- | ------------------------------------- | ---- | ------ | -------------- |
| L11 | Schnitte und Ansichten aus dem Modell |      | offen  | §6 Abschnitt 3 |
| L12 | Texte und assoziative Bemaßung        |      | offen  | §6 Abschnitt 3 |
| L13 | Planlayout mit Plankopf, Papiergrößen |      | offen  | §6 Abschnitt 3 |
| L14 | Maßhaltiger PDF-Export und Druck      |      | offen  | §6 Abschnitt 3 |

## Auswertung

| ID  | Aufgabe                                                        | Prio | Status | Bezug          |
| --- | -------------------------------------------------------------- | ---- | ------ | -------------- |
| L15 | Wohnflächenberechnung nach WoFlV mit nachvollziehbarem Bericht |      | offen  | §6 Abschnitt 4 |
| L16 | Mengen- und Bauteillisten                                      |      | offen  | §6 Abschnitt 4 |

## AI (Hauptziel)

| ID  | Aufgabe                                                                     | Prio | Status | Bezug          |
| --- | --------------------------------------------------------------------------- | ---- | ------ | -------------- |
| L17 | Modell per Text/Sprache befragen („Wie viele Fenster hat das OG?“)          |      | offen  | §6 Abschnitt 5 |
| L18 | Erste kontrollierte Änderungen durch die AI (mit Vorschau, Übernahme, Undo) |      | offen  | §6 Abschnitt 5 |
| L19 | Bebauungsplan-Pilot: Festsetzungen aus Unterlagen mit Quelle auslesen       |      | offen  | §6 Abschnitt 5 |
| L20 | Autonomer Entwurf: Grundstück + Raumprogramm → zwei editierbare Varianten   |      | offen  | §6 Abschnitt 6 |

## Austausch (IFC, PDF, DXF)

| ID  | Aufgabe                                                            | Prio | Status                                                                                 | Bezug               |
| --- | ------------------------------------------------------------------ | ---- | -------------------------------------------------------------------------------------- | ------------------- |
| L21 | Fenster/Türen im IFC mit Maßen, damit Archicad Breite/Höhe erkennt |      | zurückgestellt: Varianten (PR501) helfen nicht; kommt mit echten Fenster-/Türbauteilen | T_IFC_ACCEPTANCE.md |
| L22 | IFC-Import bzw. IFC als Referenz                                   |      | offen                                                                                  | §6 Abschnitt 7      |
| L23 | PDF- und Bild-Unterlagen als Referenz, DXF/DWG                     |      | offen                                                                                  | §6 Abschnitt 7      |

## Bedienung

| ID  | Aufgabe                                                                  | Prio | Status                     | Bezug        |
| --- | ------------------------------------------------------------------------ | ---- | -------------------------- | ------------ |
| L24 | First-Person-Ansicht (durchs Gebäude gehen)                              |      | offen                      | Register     |
| L25 | Live-Schnitt in 3D                                                       |      | offen                      | Register     |
| L26 | Perspektivische Kamera                                                   |      | offen                      | §8           |
| L27 | Kontextaktionen und Tastenkürzel (u. a. D vs. Strg+D, Kopieren/Spiegeln) |      | teilweise: K1, K2 (PR513–514) | §8, Register |
| L28 | Einstellungsübersicht (was gilt für Benutzer/Projekt/Ansicht)            |      | offen                      | §8           |
| L29 | Wandbewegung x/y/Achse abgleichen                                        |      | zurückgestellt seit 24.10. | §9           |

## Leistung

| ID  | Aufgabe                                           | Prio | Status                | Bezug                          |
| --- | ------------------------------------------------- | ---- | --------------------- | ------------------------------ |
| L30 | Bewegungsstart beim Stressmodell x (noch ≈ 1,5 s) |      | offen                 | MOVE_START_ORIGIN.md           |
| L31 | Fangindex-Rest und große Anschlussgruppen         |      | offen                 | AUD14-04/05                    |
| L32 | Wandweiser 3D-Neuaufbau (Stufe B1/B2)             |      | zurückgestellt 28.10. | WALLWISE_REBUILD_CHANGE_MAP.md |

## Sicherheit, Daten und Veröffentlichung

| ID  | Aufgabe                                                                                   | Prio | Status                  | Bezug          |
| --- | ----------------------------------------------------------------------------------------- | ---- | ----------------------- | -------------- |
| L33 | Speicher-/Lade-Brücke in `lib/bim/model.ts` (wo liegt die Grenze zum Dateiformat?)        |      | wartet auf Entscheidung | §9             |
| L34 | Prüfungen ohne Testumgebung: voller Speicher, mehrere Tabs, Dauerlauf ≥ 2 h, GPU-Speicher |      | offen (Umgebung fehlt)  | AUD14-03/06/07 |
| L35 | Browser oder Desktop-App, unterstützte Systeme, Dateiendung                               |      | offen (Entscheidung)    | §8             |
| L36 | Public Beta: Lizenz, Konto, Homepage, Datenschutz, SBOM                                   |      | offen (Entscheidung)    | §7             |

## Wartbarkeit

| ID  | Aufgabe                                                                                                                                                                                                                          | Prio   | Status           | Bezug                       |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ---------------- | --------------------------- |
| L37 | `CadWorkspace.tsx` (≈ 1850 Zeilen) und `BimSolidView.tsx` schrittweise entlasten                                                                                                                                                 | später | offen            | §9 P2                       |
| L38 | Sechs Lint-Warnungen in `components/ui`                                                                                                                                                                                          |        | offen            | §9 P2                       |
| L39 | Arbeitsweise (Commit-Identität, Selbst-Merge bei grüner CI, Windows-Hinweise) in AGENTS.md festhalten und .claude/launch.json ins Repository aufnehmen – damit nach Windows-Neuinstallation nahtlos weitergearbeitet werden kann |        | erledigt (PR492) | Nutzerfrage Neuinstallation |
