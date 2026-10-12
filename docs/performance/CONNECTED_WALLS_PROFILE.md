# K06a: verbundene Wandgruppen

08.10.2026. PR194 nach gruener CI zusammengefuehrt. Diagnose ohne Produktaenderung.

Vier validierte Fixtures: Treppenfoermige Eckketten und eine Hauptwand mit vielen
T-Nebenwaenden, 25/100 Waende, jeweils ein Fenster pro Wand. Auswahl genau einer
Wand: bei T die Hauptwand, bei Kette die erste. Betroffene Menge ueber die echte
prepareTranslation-Aktion erfasst. Alle Waende der jeweiligen Komponente betroffen.

## Browsermessung (Median ms, zehn Proben)

| Typ | Waende | betroffen | Konturen | Koerper inkl. Konturen | Extrusion aus Konturen | Fensterfilter | vorbereitete Bewegung |
|---|---|---|---|---|---|---|---|
| chain | 25 | 25 | 0.60 | 4.80 | 3.95 | 0.010 | 1.65 |
| chain | 100 | 100 | 1.95 | 17.85 | 14.20 | 0.087 | 4.15 |
| tees | 25 | 25 | 0.40 | 3.05 | 2.70 | 0.007 | 0.05 |
| tees | 100 | 100 | 1.45 | 12.55 | 10.85 | 0.090 | 0.20 |

[Rohdaten](connected-walls.json), inklusive Vorbereitung und Einzelwerten.
Konturen und Koerper mit neuer Wrapperidentitaet pro Probe, damit kein bereits
geprueftes Projekt den Solidcache trifft. Extrusion verwendet die zuvor ermittelten
Konturen; dieselben Koerper werden mit connectedWallSolids verglichen. Die Spalten
sind alternative Messungen und duerfen nicht zu einer Framezeit addiert werden.
Fensterfilter ist ein isolierter Mikrovergleich (100 Wiederholungen pro Probe),
keine instrumentierte Produktionsphase. Reihenfolge/JIT/Timer begrenzen Aussage.

40 Koerpervergleiche bestanden. Zusaetzlich zehn verschiedene Bewegungsvorschauen
pro Fixture mit prepareTranslation: Waende, Fenster, Eck- und T-Relationen jeweils
gegen den vollstaendig validierenden bisherigen Auswahlbewegungspfad verglichen;
alle 40 bestanden. Die Bewegung der T-Hauptwand loest ihre T-Verbindungen; ihr
niedriger Pointerwert gilt deshalb nicht fuer das Bewegen aller verbundenen Waende.
Kein Fang-/DOM-/Renderer-/Hardware-Latenznachweis. Keine Aussage ueber 1.000
verbundene Waende aus diesen 100-Wand-Fixtures ableiten.

## Schlussfolgerung und genau ein Folgeauftrag

Fensterfilter unter 0,1 ms: derzeit kein begruendeter Haupthebel. Kalte Extrusion
ist teurer, aber bestehende Vorbereitung reduziert laufende Arbeit bereits deutlich.
Kette mit 100 Waenden bleibt bei ca. 4,15 ms fuer die vorbereitete Bewegung,
obwohl nur eine Wand bewegt wird. Keine erneute pauschale Extrusionsoptimierung.

K06b: isolierter Pilot fuer Bewegung der ersten Wand einer freien Eckkette.
Nur geaenderte Wand und unmittelbar geaenderte Anschlussgeometrie neu ableiten,
stationaeren Rest aus der eigenen stabilen Basis wiederverwenden. Fachliche
Abhaengigkeitsgrenze gegen Vollpfad mit Fenstern und Fremdendpunkten beweisen;
bei T-/Mehrfachfaellen konservativer Fallback. Noch keine produktive Anbindung
oder Lockerung der Bestaetigung/Undo-Regeln.

## Pruefung und Wiederholung

Diagnose-Typecheck und gezielter Lint bestanden. Produktionscode unveraendert;
688 Tests und Build des PR194 nicht identisch wiederholt. Browser: Diagnose-Vite,
/benchmarks/connected-walls.html, Diagnose starten; vier verified:true erwartet.
