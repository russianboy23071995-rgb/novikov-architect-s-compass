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

## SA2: Grundriss

- Wände mit Aufbau zeigen im Grundriss jede Schicht in der Farbe ihres Materials, darüber die Schraffur: schräg (Mauerwerk), Kreuz (Beton), Punkte (Putz) als Muster mit fester Bildschirmweite (7 px), Dämmung als Zickzack über die ganze Schichtdicke (ein Zahn je Schichtdicke, DIN 1356-1). Dünne Linien trennen die Schichten; Außenkontur und Auswahl wie bisher.
- Die Schichten werden im Wandkörper gezeichnet und an seiner Kontur abgeschnitten. An Ecken aus Wänden mit gleichem Aufbau und gleicher Außenseite treffen die Schichten sich auf der Gehrung (Browser geprüft mit „Zweischalig Klinker + KS 17,5“).
- Wände ohne Aufbau behalten die Schnittfarbe (View → Darstellung…). Ist „Bauzustand farbig anzeigen“ an, behalten Neubau (rot) und Abbruch (gelb) ihre Farbe; die Schichten erscheinen bei Bestand und bei ausgeschalteter Bauzustandsfarbe.
- Code: `src/rendering/viewport/wall-layers.ts` (Schichtbänder quer zur Wand, Dämm-Zickzack), `wallLayers` in `plan-scene.ts`, `src/components/cad/WallLayerGraphic.tsx`, Einbindung in `PlanSceneRun.tsx`. Die Bibliothek kommt aus dem Projekt, auch für Vorschauen beim Bearbeiten.

Nachweis SA2: 1480 Tests grün (3 neu in `src/rendering/viewport/wall-layers.test.ts`), Typprüfung, Architektur, Lint, Formatierung sauber, 14-Modell-Prüfsumme unverändert. Browser: Einzelwand und L-Ecke mit zweischaligem Aufbau.

Grenzen SA2: Bei T-Stößen und an Ecken mit unterschiedlichen Aufbauten enden die Schichten an der Kontur, ohne Verschneidung nach Vorrang. Die Schraffur hat Bildschirm-, keine Papiergröße (für den Planexport L14 nachzuziehen).

## SA3: Schnitt

- Geschnittene Wände mit Aufbau zeigen im Schnitt ihre Schichten als senkrechte Streifen in Materialfarbe und Schraffur (Abstand 1,5 mm auf Papier, Maßstab aus dem Projekt; Dämmung als Zickzack, ein Zahn je Schichtdicke). Dünne Linien trennen die Schichten, die Kontur bleibt kräftig.
- Die Schichtgrenzen sind senkrechte Ebenen der Wand, im Schnitt also immer senkrechte Linien. Ihre Lage ergibt sich aus dem Abstand zur Wandmitte entlang der Schnittlinie; schräge Schnitte werden entsprechend breiter. Eine Schnittlinie parallel zur Wand liegt ganz in einer Schicht. Blickrichtung „rechts“ spiegelt die Reihenfolge.
- Wände ohne Aufbau, Decken, Dächer und andere Bauteile behalten die Schnittfarbe. Ansichten schneiden nichts und bleiben unverändert.
- Code: `withWallLayers` in `src/rendering/viewport/section-drawing.ts` (Feld `layers` an `SectionCut`), `src/components/cad/SectionLayerGraphic.tsx`, Einbindung in `SectionDrawingView.tsx`.

Nachweis SA3: 1481 Tests grün, Typprüfung, Architektur, Lint, Formatierung sauber, 14-Modell-Prüfsumme unverändert. Neuer Test in `src/rendering/viewport/section-drawing.test.ts` (Reihenfolge, Lage der Grenzen auf 1e-9 m, Spiegelung, Schnitt längs der Wand, ohne Aufbau unverändert). Browser: Schnitt A-A quer durch die zweischalige Wand zeigt Innenputz, KS, Dämmung, Luftschicht, Klinker.

## SA4: IFC

- Für jede Wand mit Aufbau schreibt der IFC-Export (IFC4) den Schichtaufbau nach Standard:
  - `IfcMaterial` je benutztem Material (einmal je Datei), `IfcMaterialLayer` je Schicht mit Dicke und Kategorie (`Insulation` bei Dämm-Schraffur, sonst `LoadBearing` bei „tragend“), `IfcMaterialLayerSet` je Aufbau mit dessen Namen.
  - `IfcMaterialLayerSetUsage` entlang der y-Achse der Wand (`.AXIS2.`): erste Schicht (außen) an der rechten Wandseite, also `.POSITIVE.` ab −Stärke/2; gespiegelte Wände `.NEGATIVE.` ab +Stärke/2. Wände mit gleichem Aufbau und gleicher Seite teilen sich eine Nutzung.
  - `IfcRelAssociatesMaterial` verbindet die Wände mit ihrer Nutzung (GUID stabil aus Aufbau und Seite).
- Geometrie, Öffnungen und Eigenschaften der Wand bleiben unverändert; Wände ohne Aufbau bekommen kein Material.
- Archicad-Testdatei: `Claude_Ablage_Code/ifc-abnahme/SA4-Wandaufbau.ifc` (erzeugt mit `benchmarks/assembly-ifc-acceptance.ts`): Raum 6 × 4 m aus der Fensterabnahme mit Fenstern und Tür, Außenwände „KS 17,5 + WDVS 16“ (36 cm, Putz außen), freistehende Innenwand „Trockenbau 10“.

Nachweis SA4: 1483 Tests grün (2 neu in `src/interop/ifc/assembly.test.ts`: Materialien einmal, Schichtdicken und Kategorien, Nutzung normal und gespiegelt, Zuordnung der Wände, stabile Datei, ohne Aufbau kein Material), Typprüfung beider Projekte, Architektur, Lint, Formatierung sauber, 14-Modell-Prüfsumme unverändert (die Modelle haben keinen Aufbau). Kein Browsertest für SA4: Der Export ist durch Tests und die Testdatei belegt, ein Download aus dem Browser hätte nichts zusätzlich gezeigt.

Offen: Archicad-Prüfung der Testdatei durch den Nutzer (wird die Wand als Mehrschicht-Bauteil mit den richtigen Schichten erkannt, liegt Putz/WDVS außen?). Nach Quellen liest Archicad `IfcMaterialLayerSetUsage` als Mehrschicht-Bauteil; belegt ist das erst mit dem Test.

## Grenzen von L07 insgesamt

- Keine Verschneidung der Schichten nach Vorrang an T-Stößen und an Ecken mit ungleichen Aufbauten.
- 3D zeigt die Wand weiter als einen Körper in einer Farbe.
- Decken und Dächer haben noch keinen Aufbau.
- Schraffur im Grundriss in Bildschirmgröße (Papiergröße mit dem Planexport L14).
