# Legacy-Bewegungs- und Anschlussinventur, 21.10.2026

Basis main `df3dcd5` nach PR420, CI39651628452 grün. Historische Inventur Masterplan AUD14-04 Teil13 gegen aktuelle Registry, UI-Aufrufe und Tests abgeglichen. Keine Produktänderung.

## Änderungskarte

AUD14-04/05: Tatsächlich erreichbare Vorschau-Vollpfade bestimmen und einen Folgeauftrag wählen. Normalszenario einzelne Linie/Schraffur frei bewegen; Grenzfälle Außenkontakt einer Wand und Kettenfortsetzung. Eigentümer Application, Regeln Domain/Geometry, Renderer nur abgeleitete Verbraucher. Stabile Ziel-/Host-/Geschoss-IDs, gepinnter Modellstand, Meter und bestehende Sichtbarkeits-/ToolInteraction-Grenzen bleiben maßgeblich. Diagnose ändert keine Vorschau-, Commit-, Undo-, Datei-, Recovery-, IFC- oder AI-Verträge. Abnahme: Codebelege, fokussierte Tests, Vergleich mit vollständigem Modellpfad; keine pauschale Gesamtleistungsfreigabe.

## Aktueller Abgleich

| Nutzerpfad | Codebeleg / heutiger Zustand | Verbleibende Grenze |
| --- | --- | --- |
| Linie Punkt/Kante/Offset/Knicken | prepared-preview.ts → prepared-line.ts registriert point/edge/offset/insert | Alte Aussage „Linienpunkt/Kontur ohne Adapter“ überholt. Lokale Zielprüfung bleibt; 2D materialisiert Projektansicht. |
| Schraffur Punkt/Seite/Offset/Knicken | prepared-hatch.ts, dieselben vier Aktionen | Vorbereitet, Konturregeln und Caps erhalten. Keine erneute Migration. |
| Fenster entlang Wand | prepared-window.ts, Registry erreicht Adapter auch für projectView | Materialisierung für 2D und Patch für 3D vorhanden. Historischer 2D-Registry-Abbruch behoben. Host-Anschlusskomponente kann größer als ein Element sein. |
| Wandachsendpunkt, Körpergriff, Endstrecken | prepared-wall.ts → prepared-endpoint.ts, point/stretch Index0/1 mit jeweiligem Anchor | Früherer pauschaler Legacy-Befund überholt. Komponente, Solidreuse, Fremdpunktindex vorhanden. Neue Außenkontakte/fehlgeschlagener lokaler Weg fallen bewusst vollständig zurück. |
| Neue/gewechselte T-Ziele | prepared-wall.ts: t-axis → editAtPointerSnapshot → connectSnappedT → wallTransitionPatch | Identischer letzter Kontakt sitzungsbezogen wiederverwendet. Erstes/geändertes Ziel fachlich vollständig, Komposition begrenzt. PR391–400 nicht erneut implementieren. |
| Einzelwand frei bewegen | CadWorkspace.startEdit leitet wall+move an groupMove.begin | Bereits gemeinsamer Auswahlpfad. null in DirectEdit-Registry allein beweist keinen UI-Legacypfad. |
| Mehrfachauswahl XY/Z; Linie/Schraffur in XY | useSelectionMove → selection/move.ts → storey-translation.ts → domain/project/prepared-translation.ts | Gemeinsame vorbereitete Geometrie, vollständige Bestätigung. Einzelfenster bleibt hostgebunden, Gruppenfenster nur mit Wand. |
| Einzelne Linie/Schraffur frei bewegen | DemandMenu move → CadWorkspace.startEdit ohne Wand-Sonderleitung → controller.previewEdit → editAtPointer → moveElement → updateLine/previewHatch | Tatsächlich erreichbarer Vollpfad. Registry liefert null, obwohl gemeinsame Auswahlbewegung die Elemente bereits unterstützt. Gewählter nächster Rest. |
| Direkte axis/x/y für Wand/Linie/Schraffur, line/hatch stretch | DirectEdit-Session ohne passende Registryfähigkeit → editAtPointer | Weiterhin volle Wege; konkrete Menü-/Griffbedingungen erhalten. Nicht separat vermessen, keine Gleichteuerheitsbehauptung. |
| Wandkette | previewWallChain: erster freier Abschnitt vorbereitet, zweiter geeigneter Abschnitt prepareChainCorner | Ab drittem Abschnitt, startCandidate und weiteren Kontakten appendWallChain; frühe Adapter ebenfalls mit vollständigen Kontaktfallbacks. ID-Sammlung/Schlüssel bleiben. |
| Ansichtsverbraucher | BimPlan previewEdit → shown → derivePlanScene, Gruppenpatch separat; BimSolidView preparedEdit/placementPatch → selectionMoveSurfaces, sonst previewProject | Vorbereitete Projektansicht ist nicht automatisch begrenzte Planableitung. Kein neuer Renderer-Typdispatch. |

Pfade beziehen sich auf src/application/direct-edit/, src/application/drawing/, src/application/selection/, src/domain/project/prepared-translation.ts und src/components/cad/. controller.ts:fullEdit bleibt vollständige Bestätigung. Fehlender Adapter erlaubt kein Kürzen fachlicher Prüfungen. Unveränderte Nachbarn können nach Anschlusslösung eine andere Kontur benötigen.

## Begrenzte aktuelle Messung

legacy-move-inventory.ts: Owned-Projekt mit 10/100 Schraffuren à100 Punkten plus einer Linie. Ein Ziel, move, identischer Ursprung/Ziele. Erste +8 warme Proben, Reihenfolge direkte Projektvorschau/gemeinsamer Patch wechselnd, Vorbereitung getrennt. Zwei serielle Prozesse; je 36 vollständige Projekt- und36 Zielgeometrievergleiche außerhalb der Zeitmessung bestanden, einschließlich Schraffurmusterursprung.

Mediane warm, ms, Lauf1 /2:

| Ziel / Restschraffuren | Direkte Projektvorschau | Gemeinsamer lokaler Patch |
| --- | --- | --- |
| Linie /10 | 5,470 /5,378 | 0,074 /0,082 |
| Schraffur /10 | 12,352 /8,919 | 0,581 /0,432 |
| Linie /100 | 52,786 /37,132 | 0,088 /0,052 |
| Schraffur /100 | 98,501 /73,463 | 0,593 /0,420 |

Vorbereitung groß: Linie0,302/0,186 ms, Schraffur0,274/0,172 ms. Unterschiedliche Ausgabeformen sind bewusst: Projektansicht gegenüber lokalem Patch. Gemeinsame Vollmaterialisierung separat auf Gleichheit geprüft, nicht als Patchzeit mitgemessen. Keine Gesamtframe-Prozentbehauptung. Fang, Planableitung, React, DOM/GPU, Commit und Native-Geste ausgeschlossen; Node/JIT/GC und synthetische Fixture bleiben Grenzen.

Rohdaten: legacy-move-inventory-results.json und legacy-move-inventory-repeat-results.json. Reproduktion: node --experimental-strip-types benchmarks/legacy-move-inventory.ts.

## Prüfbelege / Abschlusskarte

69 vorhandene Tests bestanden: Linienpunkt/-kante/-offset/-knicken, Schraffurvarianten, Fensterpatch, Wandkörperpunkt, vorbereitete Kettenbewegung/-ecke und gemeinsame Auswahlbewegung. Benchmark-Typecheck und fokussiertes ESLint bestanden. Keine Produktänderung, neue Rückabhängigkeit, Modellkopie oder UI-Fachregel. Keine neue Vollsuite-/Browser-/Frame-/Native-, Recovery- oder IFC-Abnahme. Untracked dist-resource-browser ist lokaler Build aus dem vorherigen Auftrag und kein Bestandteil dieses PR.

## Genau ein Folgeauftrag

Einzelne Linie/Schraffur bei „Element frei bewegen“ im Grundriss an vorhandene gemeinsame Auswahlbewegung anschließen, wie Wand/Mehrfachauswahl. Kein neuer Algorithmus, Fang-/Tab-/Formularhandler oder werkzeugspezifischer Bewegungsadapter. Ursprung des gewählten Griffs/Anchors, Winkel/Länge/Shift, Musterursprung, Linienform/-stil, Ebene und Stale-/Sichtbarkeitskontext erhalten. Keine neue 3D-Fähigkeit oder axis/x/y/stretch-Migration in diesem Schritt.

Abnahme: Vollprojekt-/Patchgleichheit, Musterursprung, ungültiger/veralteter/ausgeblendeter Kontext, Abbruch, ein Undo/Redo und Dateigleichheit; praktische 2D-Browserprüfung für Linie und Muster-Schraffur. Vorhandene 10/100-Messung wiederholen. Vollprüfung beim Commit bleibt; andere Tabellenreste sind keine parallelen Implementierungsaufträge.
