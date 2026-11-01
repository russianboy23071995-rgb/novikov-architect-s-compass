# Werkzeug „Schnitt“

Nutzervorgabe (01.11.2026): Ein 2D-Werkzeug, das eine Schnittzeichnung erzeugt. Der Schnitt wird an beliebiger Stelle durch eine Schnittlinie im Grundriss gezeichnet, gleich in welchem Geschoss. Schnitte haben einen Namen und eine Kennung und werden im Navigator in einem eigenen Ordner „Schnitte“ abgelegt und verwaltet. Vorher wird der Canvas zu Tabs, damit später zum Beispiel eine Schnittzeichnung und eine 3D-Ansicht als zwei Tabs offen sein können.

Schritte:

| Schritt | Inhalt | Stand |
| --- | --- | --- |
| SC1 | Canvas-Tabs, Ordner „Schnitte“ im Navigator | erledigt |
| SC2 | Werkzeug „Schnitt“: Schnittlinie, Name, Kennung, Blickrichtung, Einträge im Ordner, Schnitt als Tab | offen |
| SC3 | Schnittzeichnung aus dem Modell erzeugen und im Schnitt-Tab zeigen | offen |

## SC1 – Canvas-Tabs und Ordner „Schnitte“

- Über dem Canvas (oben mittig im freien Bereich) liegt eine Tab-Leiste. Jeder Tab ist eine Ansicht: „Grundriss \<Arbeitsgeschoss\>“ oder „3D-Ansicht“. Der aktive Tab ist die aktuelle Ansicht.
- „+“ öffnet eine Ansicht als Tab; ist sie schon offen, wird ihr Tab aktiviert („(offen)“ im Menü). Auch der bisherige 2D/3D-Schalter der Werkzeugleiste und jeder andere Wechsel der Ansicht öffnet den passenden Tab.
- Ein Tab lässt sich mit × schließen; der letzte Tab bleibt offen. Wird der aktive Tab geschlossen, wird der rechte Nachbar aktiv, am Ende der linke.
- Es wird nur der aktive Tab gezeichnet. Aufteilungen (zwei bis vier Ansichten) gehören weiterhin zum Modell-Tab.
- Die offenen Tabs sind Sitzungszustand: kein Teil des Projekts, kein Rückgängig-Schritt, nach dem Neuladen wieder nur der Grundriss.
- In einem Abbild bleibt der Grundriss-Tab aktiv; der 3D-Tab meldet wie bisher „Dieses Abbild ist ein 2D-Grundriss.“
- Navigator, Bereich „Gebäudestruktur“: neuer Ordner **„Schnitte“** unter den Geschossen, vorerst leer. Ein Klick darauf ändert weder Auswahl noch Geschoss.

Umsetzung:

- `src/application/views/canvas-tabs.ts`: Ansichten, Bezeichnungen, `withCanvasTab`, `closeCanvasTab`. SC2 ergänzt die Art „Schnitt“.
- `src/components/cad/CanvasTabs.tsx`: Tab-Leiste mit Schließen und „+“-Menü.
- `src/components/cad/CadWorkspace.tsx`: Tab-Zustand; ein Moduswechsel ohne Tab öffnet einen; `changeMode` ist der gemeinsame Weg für Werkzeugleiste und Tabs.
- `src/components/cad/ProjectNavigator.tsx`: Ordner `SECTIONS_FOLDER_ID`.

Nachweis: Test `src/application/views/canvas-tabs.test.ts` (2 Tests). 1425 Tests grün, Typprüfung beider Projekte, Architektur und Lint sauber, 14-Modell-Hash unverändert (`089f79e4…97017b3`).

Browser-Abnahme (01.11.2026, Port 8094): Start mit einem Tab „Grundriss Erdgeschoss“, Ordner „Schnitte“ im Navigator. „+“ → „3D-Ansicht“ öffnet den zweiten Tab und zeigt 3D. Klick auf den Grundriss-Tab schaltet zurück, Klick auf 3D wieder nach 3D. × am aktiven 3D-Tab schließt ihn und aktiviert den Grundriss. Der 3D-Schalter der Werkzeugleiste öffnet den 3D-Tab. Keine neuen Konsolenfehler mit der aktuell geladenen Modulversion.
