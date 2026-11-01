# Wandaufbau (L07)

Nutzerauftrag 01.11.2026: Schichtaufbau von Wänden (Mauerwerk, Dämmung, Putz …) in Grundriss, Schnitt und IFC. Entscheidungen: Bibliothek im Projekt, auf die die Wand verweist; Füllung je Material; Reihenfolge SA1 → SA2 → SA3 → SA4, je Schritt ein PR.

## SA1: Datenmodell, Bibliothek, Fenster

- **Projektdatei Schema 43.** Neu: `materials` und `wallAssemblies` am Projekt (beide optional), an der Wand `assemblyId` und `assemblyFlipped` (optional). Dateien mit Schema 42 werden beim Öffnen übernommen; ein Wandaufbau in einer Datei mit Schema 42 wird abgelehnt.
- **Material:** Name, Farbe, Schraffur aus fünf eingebauten Mustern (keine, schräg/Mauerwerk, Kreuz/Beton, Dämmung, Punkte/Putz). Die vorhandene Schraffurbibliothek wird bewusst nicht verwendet: Sie wird beim Speichern auf benutzte Muster gekürzt und gilt für Schraffurelemente.
- **Wandaufbau:** Name (eindeutig), 1–20 Schichten **von außen nach innen** mit Material, Dicke und Kennung „tragend“. Gesamtstärke = Summe der Schichten (auf 0,1 mm gerundet).
- **Außen** ist die rechte Wandseite in Zeichenrichtung, also die Seite, an der bei „Achslage Außen“ die Achse liegt. „Aufbau spiegeln“ dreht die Reihenfolge für die gewählte Wand um; die Wand bleibt, wo sie ist.
- **Vorgaben:** Solange ein Projekt seine Bibliothek nicht ändert, gelten zehn Materialien und zehn Aufbauten (`src/domain/elements/wall/assembly.ts`): KS 17,5 + WDVS 16 (36 cm), Mauerwerk 36,5 + Putz, Porenbeton 36,5 + Putz, Stahlbeton 25 + WDVS 20, zweischalig Klinker + KS 17,5, KS 24 und KS 11,5 innen, Stahlbeton 20 innen, Trockenbau 10 und 12,5. Erst die erste Änderung schreibt die Bibliothek ins Projekt; Projekte ohne Wandaufbau bleiben dadurch unverändert (14-Modell-Prüfsumme gleich).
- **Wandstärke folgt dem Aufbau.** Die Stärke bleibt an der Wand gespeichert, damit Ecken, T-Anschlüsse, Öffnungen, 3D und IFC unverändert rechnen. Die Prüfung beim Speichern und Laden verlangt: Aufbau vorhanden und Stärke = Summe. Beim Zuweisen und bei jeder Bibliotheksänderung bleibt die Achse an ihrer relativen Stelle (Außen/Mitte/Innen).
- **Reiter „Wandaufbau“** im Fenster des Wandwerkzeugs (Doppelklick auf das Werkzeug) und im Elementfenster einer Wand (Doppelklick auf die Wand):
  - Auswahl „Aufbau“ (oder „Ohne (einschichtig)“), maßstäblicher Streifen außen → innen, im Elementfenster „Aufbau spiegeln“. Mehrere gewählte Wände folgen gemeinsam.
  - Bibliothek „Wandaufbauten“: bearbeiten, kopieren, löschen (nicht, solange Wände ihn verwenden), Name, Schichten mit Material, Dicke in cm, tragend, Reihenfolge ↑/↓, entfernen, hinzufügen; Gesamtstärke und Zahl der folgenden Wände.
  - Bibliothek „Materialien“: Name, Farbe, Schraffur, hinzufügen, löschen (nicht, solange ein Aufbau es verwendet).
  - Jede Änderung ist ein Rückgängig-Schritt; Fehler (z. B. doppelter Name) erscheinen als Meldung.
- **Wandstärke-Felder** im Werkzeug und in den Wandeigenschaften sind bei gewähltem Aufbau schreibgeschützt.
- Code: `src/domain/elements/wall/assembly.ts` (Schema, Vorgaben, Regeln), `src/application/walls/assembly.ts` (Zuweisen, Spiegeln, Bibliothek speichern), `src/components/cad/WallAssemblyFields.tsx`, Prüfung in `src/domain/project/schema.ts`, Migration in `src/interop/project-file/load.ts`.

Nachweis SA1: 1477 Tests grün (6 neu in `src/application/walls/assembly.test.ts`), Typprüfung beider Projekte, Architektur, Lint und Formatierung sauber, 14-Modell-Prüfsumme unverändert (`e42aa36e…`). Browser: Aufbau einer Wand zugewiesen (0,36 m, Feld gesperrt), Dämmschicht auf 20 cm geändert → Wand 0,40 m, gespiegelt; Wandwerkzeug mit „Trockenbau 10“ gezeichnet → neue Wand 0,10 m mit Aufbau.

Grenze SA1: Grundriss, Schnitt und IFC zeigen die Schichten noch nicht (SA2–SA4).
