# K04f: gemeinsame vorbereitete Wandzeichen-Vorschau

08.10.2026. PR191 nach gruener CI zusammengefuehrt.

Die vorbereitete Implementierung liegt in Application/drawing/prepared-wall.ts.
Der Benchmark exportiert sie nur noch. previewWallChain bindet sie per WeakMap
an den ersten freien Kettenzustand, Ursprung und temporaere ID. Veraltete
Modellbasis wird vor der Auswertung abgewiesen. Kein eigener Cache im Renderer.

Nur erster Abschnitt ohne T-Startkandidat und mit unveraenderter Basis nutzt den
Pfad. Jeder Zielkandidat und jeder Kontakt nutzt die volle Fachaktion; weitere
Kettenabschnitte ebenso. Die Platzierung ruft weiterhin appendWallChain auf,
finish/commit pruefen den Gesamtstand. Vorschau erzeugt keinen Historyeintrag.
Abbruch und Werkzeugwechsel verwerfen den UI-Kettenzustand; keine global aktive
Vorbereitung. Neue Sitzung hat einen anderen Cache. Keine asynchrone Publikation.

Die gemeinsame Vorbereitung verwendet createDrawing/addWall und connectWallAtTAxis;
kein zirkulaerer Import zur Wandkettensteuerung, keine duplizierte Geometriepruefung.

## Nachweise

682 Tests bestanden. Die vier Pilotvergleiche laufen gegen die gemeinsame
Implementierung. Neuer Integrationstest: eigene Ursprungskopie, veraltete Basis,
neue Sitzung, Folgeabschnitt/Vollpfad, Platzierung und ein Undo fuer ganze Kette.
Beide Typechecks, gezielter Lint und Produktionsbuild bestanden.

benchmarks/drawing-workspace.html rendert den echten CadWorkspace. Synthetischer
DOM-Ablauf bestanden: Werkzeug waehlen, Ursprung, Shift/Maus, zwei Abschnitte,
Enter im Canvas, gesamte Kette Undo/Redo, Escape und Werkzeugwechsel waehrend
neuer Vorschau. Testtreiber prueft die Zahl dargestellter Waende; er ersetzt keine
praezise Geometriepruefung (diese erfolgt in den Application-Tests). Beim Aufbau
des Treibers wurde Enter zuerst an window statt an den Canvas geschickt; nach
Korrektur des Treibers bestanden die Checks. Kein Produktfehler daraus abgeleitet.

Grenzen: keine neue Frame-/Hardwarelatenzmessung. Sporadisches Shift-Ruckeln
bleibt zur manuellen Abnahme offen. Enger Umfang des Piloten bleibt erhalten.

## Praktische Abnahme

Wandwerkzeug: freie erste Strecke mit Shift zeichnen, zweite Strecke setzen,
Enter im Canvas. Undo muss beide Abschnitte entfernen, Redo beide wiederbringen.
Neue Kette beginnen und Escape bzw. Werkzeugwechsel: keine neue Wand speichern.

## Genau ein Folgeauftrag

K04g: isolierten Vorschau-Piloten fuer den zweiten rechtwinkligen Abschnitt einer
freien Wandkette pruefen. Bestehende Eckregeln wiederverwenden; Kontakte zu
fremden Waenden/T-Kandidaten konservativ auf Vollpfad. Gegen appendWallChain
vergleichen und erst bei belegtem Gewinn eine spaetere Anbindung planen.
