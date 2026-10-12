# K06c: gemeinsame Vorbereitung fuer die Kettenendwand

08.10.2026. PR196 nach gruener CI zusammengefuehrt.

## Umsetzung und Grenzen

prepareTranslation prueft und besitzt weiterhin genau eine vollstaendige Basis.
Fuer eine ausgewaehlte freie Kettenendwand (optional deren Fenster) wird der
stationaere Rest nach Loesen des Anschlusses einmal abgeleitet. Die bestehende
Solidcache-Infrastruktur erhaelt diese unveraenderlichen Koerper fuer weitere
Vorschauen. Bewegte Wand und Fenster werden weiterhin mit vorhandenen Fachregeln
geprueft. Kein rekursiver zweiter prepareTranslation-Aufruf, keine neue Geometrie-
oder Fenstermodelldefinition.

Die vollstaendige ersetzte Geometriemenge und replacedIds bleiben erhalten, damit
Darstellung und Picking dieselben Element-IDs sehen. Die Optimierung spart
wiederholte Fachableitung, nicht alle Arrayschritte oder Rendererarbeit.
Nullbewegung liefert die urspruenglich verbundenen Konturen; fremde belegte
Anschlusspunkte werden weiterhin global abgefangen. Bestaetigung validiert erneut
vollstaendig. T-Gruppen, Innenwaende und sonstige Auswahl bleiben bisheriger Pfad.

Wichtige Bediengrenze: Der gemeinsame Auswahlbewegungspfad nutzt die Verbesserung.
Im Canvas wurde Endwand plus ihr Fenster ausgewaehlt. Der normale Einzelwand-
Direct-Edit-Befehl nutzt noch seinen bisherigen Pfad; fuer ihn wird kein Gewinn
behauptet. Diese bestehende Adaptertrennung war im UI-Test zu beachten.

## Nachweise

693 Tests bestanden, beide Typechecks, gezielter Lint und Produktionsbuild
bestanden. Bestehende Vite-/Chunkhinweise unveraendert. Neuer Integrationstest
vergleicht Solid-, Grundrisskontur- und Planszenengeometrie einschliesslich
Nullbewegung, Kontextwechsel und fremdem belegten Knoten gegen Vollpfad.
Die bisherigen Pilot- und Historytests laufen ebenfalls weiter.

benchmarks/chain-move-workspace.html rendert CadWorkspace mit drei verbundenen
Waenden und Fenstern. Synthetischer DOM-Test: Endwand plus Fenster auswaehlen,
Ursprung, Shift-Vorschau, Abbruch, Klick-Platzierung, Undo/Redo, 3D/2D bestanden.
Erster Treiberentwurf hatte Einzelwand-Direct-Edit angesprochen; korrigiert auf
den tatsaechlich integrierten Auswahladapter, keine Produktkorrektur daraus.

Erneute K06a-Fixtures: 40 Solid- und 40 Bewegungsvergleiche bestanden. Kette mit
100 Waenden: Vorbereitung 54,5 ms, Pointer-Median ca. 0,1 ms (vorher 4,15 ms).
Pilotvorbereitung zuvor 68,6 ms. Verschiedene lokale Laeufe, kein kontrollierter
A/B-Nachweis fuer die Differenz der Startzeit. 25 Waende: 19 ms / ca. 0,1 ms.
[Rohdaten](shared-chain-move.json). Keine Hardware-/Frame-Latenzaussage.

## Praktische Abnahme

Endwand einer Eckkette und mit Strg ihr Fenster auswaehlen. Auswahl frei bewegen,
Ursprung waehlen, mit Shift verschieben. Einmal abbrechen, danach platzieren.
Undo muss Anschluss und Ausgangslage wiederherstellen; Redo wieder loesen.

## Genau ein Folgeauftrag

K06d: Den Einzelwand-Befehl Element frei bewegen auf Wiederverwendung des
bestehenden Auswahlbewegungsadapters pruefen und begrenzt anbinden. Gewaehlten
Ursprung, gemeinsame Eingabe/Fanghilfen, Kontextbindung und Undo erhalten;
keine neue pro-Werkzeug-Bewegungslogik. Andere Direct-Edit-Aktionen bleiben.
