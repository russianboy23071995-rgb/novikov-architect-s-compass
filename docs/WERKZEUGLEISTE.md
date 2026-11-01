# Werkzeugleiste

Nutzervorgabe (01.11.2026): Die schmale Leiste ohne Beschriftung ist angenehmer und bleibt die einzige Form. Ganz oben steht unverändert das Auswahlwerkzeug, darunter Rubriken: 3D-Werkzeuge, 2D-Werkzeuge, Dokumentationswerkzeuge. Die Leiste lässt sich öffnen, die Symbole lassen sich frei verschieben, und die Anordnung wird gespeichert. Außerdem sollen mehrere Piktogramme klarer werden.

| Schritt | Inhalt | Stand |
| --- | --- | --- |
| WL1 | Kompakte Leiste mit Rubriken, Anordnung selbst sortieren und speichern | erledigt |
| WL2 | Neue Piktogramme für Wand, Stütze, Treppe, Fenster, Decke, Dach, Schnitt | offen |

## WL1 – Rubriken und eigene Anordnung

- Nur noch die schmale Leiste (48 px), Knöpfe 36 px, ohne Beschriftung; Name, Kurztaste und „Doppelklick: Einstellungen“ im Tooltip. Der Umschalter auf die breite Leiste entfällt. Passt die Leiste nicht in die Höhe, lässt sie sich scrollen.
- Oben fest das Auswahlwerkzeug. Darunter drei Rubriken, getrennt durch eine Linie mit Kürzel (3D, 2D, DOK; voller Name als Tooltip). Vorbelegung: 3D-Werkzeuge Wand, Stütze, Treppe, Fenster, Tür, Decke, Dach, Raum; 2D-Werkzeuge Linie, Schraffur, Text; Dokumentationswerkzeuge Maßkette, Schnitt.
- „Werkzeugleiste anpassen“ (Zahnrad unten in der Leiste) öffnet ein Fenster mit den Rubriken als Spalten. Ein Werkzeug wird mit Maus, Stift oder Finger gezogen – innerhalb der Rubrik oder in eine andere; die Einfügestelle wird markiert. Mit der Tastatur: Pfeil hoch/runter innerhalb der Rubrik, links/rechts ans Ende der Nachbarrubrik. Die Leiste zeigt jede Änderung sofort. „Zurücksetzen“ stellt die Vorbelegung her. Eine leere Rubrik bleibt bestehen.
- Gespeichert wird im Browser (`localStorage`, Schlüssel `novikov.toolrail.layout`), wie Navigatorbreite und Stiftsets – eine Einstellung des Nutzers, nicht des Projekts. Beim Laden wird bereinigt: unbekannte und doppelte Einträge fallen weg, Werkzeuge, die später neu hinzukommen, erscheinen in ihrer vorgesehenen Rubrik. Das Löschen der Browserdaten setzt die Anordnung zurück.

Umsetzung: `src/components/cad/tool-layout.ts` (Rubriken, Vorbelegung, Bereinigen, Verschieben, Tastaturschritte), `useToolLayout.ts` (Speichern), `rail-tools.ts` (Werkzeuge mit Symbol und Kurztaste), `ToolRail.tsx` (Leiste), `ToolRailCustomizer.tsx` (Anpassen-Fenster, Ziehen über Pointer-Events), `CadWorkspace.tsx`.

Nachweis: `src/components/cad/tool-layout.test.ts` (3 Tests: Vorbelegung; Verschieben innerhalb und zwischen Rubriken, leere Rubrik, Tastaturschritte; Bereinigen gespeicherter Anordnungen). 1438 Tests grün, Typprüfung beider Projekte, Architektur, Lint und Prettier sauber, 14-Modell-Hash unverändert.

Browser-Abnahme (01.11.2026, Port 8094): Leiste schmal mit Auswahl oben und den Rubriken 3D/2D/DOK. Im Anpassen-Fenster „Schnitt“ mit der Maus vor „Wand“ in die 3D-Rubrik gezogen – Leiste folgt sofort; nach dem Neuladen bleibt die Anordnung. Per Tastatur „Schnitt“ zweimal nach rechts und einmal nach oben – steht wieder vor „Maßkette“ in der Dokumentationsrubrik. „Zurücksetzen“ stellt die Vorbelegung her; Werkzeugwahl per Klick funktioniert. Eine erste Fassung mit HTML-Drag-and-Drop blieb unter automatischer Maussteuerung hängen; deshalb Pointer-Events (funktionieren auch mit Stift und Touch).
