# K07b: isolierter Kameramatrix-Pilot

08.10.2026. PR199 mit erfolgreicher GitHub-CI zusammengefuehrt.
Keine Produktumstellung; alle Pilotdateien liegen unter benchmarks.

## Umsetzung

Isolierter Fork des vorhandenen WebGL-Rendererkoerpers: gleiche Dreiecke,
Licht-/Grundfarben, Tiefentest und Fragmentshader. Weltpositionen werden einmal
relativ zur festen Frame-Mitte in Float32 gespeichert. Der Vertexshader nutzt
eine Kameramatrix; draw uebergibt bei Kamerabewegung nur diese Matrix, keinen
neuen Geometriepuffer. Die Matrixkoeffizienten stammen aus projectOrthographic,
keine zweite Kameradefinition. CPU-Picking und authoritative Modell-IDs bleiben
unveraendert. Alle Anzeigen sind ausschliesslich abgeleitete Daten.

## Nachweise

695 Tests bestanden, Diagnose-Typecheck einschliesslich src, gezielter ESLint
und Produktionsbuild erfolgreich. Bestehende Vite-/Chunkwarnungen bleiben.
Neuer Matrixtest: Quer-/Hochformat, Pitch, Pan, Zoom, getrennte Tiefenreichweite,
Frame ungleich Pufferursprung und lokale Koordinaten um 1e9. Float32-Vertex- und
Uniformquantisierung gegen bisherige CPU-Projektion innerhalb 2e-6 NDC.

Browser: /benchmarks/solid-matrix.html, Vergleich starten. Gleiche verbundene
Ketten mit Fenstern, 3/100/500 Waende, jeweils 1/4 parallele Ansichten (getrennte
WebGL-Kontexte). Zwei Warmlaeufe, zehn Kamerastaende, wechselnde Messreihenfolge.
Bei den letzten beiden Staenden Backbuffer von 400x300 auf 800x300 und 400x600:
Rastergroesse und Seitenverhaeltnis geprueft, kein echtes OS-DPR-Ereignis.

180 GPU-Bildvergleiche per readPixels ausserhalb der Zeitmessung bestanden.
Referenzbilder muessen nichtleer sein. Abweichungskriterium: Kanalunterschied
ueber 8, maximal 0,1 Prozent der Pixel (mindestens 16). Tatsaechlich maximal zwei
Pixel je Bild betroffen. Fenster und verdeckte Wandflaechen sind Teil derselben
Bildvergleiche. Alle Face-Vertices einschliesslich Tiefe gegen CPU-Pfad verglichen,
maximale gemessene NDC-Abweichung unter 4,6e-8. Solid inkl. IDs unveraendert.
Bildtoleranz ist eine begrenzte Regressionstoleranz, keine fachliche Modelltoleranz.

[Browser-Rohdaten](solid-matrix-pilot.json).

| Waende | Ansichten | Bisher Draw CPU Median ms | Pilot Median ms |
| --- | --- | --- | --- |
| 3 | 1 | 0,60 | ca. 0,05 |
| 100 | 1 | 13,50 | ca. 0,10 |
| 500 | 1 | 72,30 | ca. 0,05 |
| 500 | 4 | 329,15 | ca. 0,10 |

Kleine Pilotwerte liegen nahe/unter Timeraufloesung, kein genauer Speedup-Faktor.
Resize-Spitzen bleiben: 500/4 Pilot maximal 18,9 ms. Einmalige Vorbereitung
500/1: Pilot 67 ms, bisher 5,8 ms; bisherige Geometrieaufbereitung erfolgt erst
beim Draw, Pilotaufbereitung bereits beim Erstellen. Solidableitung davor ist
in beiden Zahlen nicht enthalten. Kein kostenloser Gesamtaufbau behauptet.

## Grenzen

Nur feste unselektierte Geometrie/Sichtbarkeit, keine Auswahlumrandung und keine
Modellbearbeitung. Context-Verlust erfordert Neuanlage von Programm/Puffer;
Ereignissteuerung/Wiederherstellung im Pilot noch nicht implementiert/getestet.
Produktpfad mit seinen vorhandenen Lebenszyklusregeln bleibt unveraendert.
Kein geaendertes Picking, keine neue Trefferindex-/ID-Struktur. Readback synchronisiert
ausserhalb der Messung; Messung ist CPU-Submission und keine GPU-/React-/Gesamt-
Framezeit. Keine Aussage zur Langzeit-GPU-Speichernutzung oder allen Zielgeraeten.
Pilot rendert einmalige Snapshotgeometrie, in-place Mutation ist kein Updatevertrag.

## Genau ein Folgeauftrag

K07c: Isolierten Pilot auf Renderer-Lebenszyklus vervollstaendigen: Geometrie- und
Sichtbarkeitswechsel, Auswahlfarben/konstante Umrandung, Resize und Context-Verlust/
Wiederherstellung gegen Referenz pruefen. Klare Snapshot-/Ressourceninvalidation;
keine zweite Modellstruktur. Erst anschliessend Produktanbindung entscheiden.
Kein gleichzeitiger Picking-Umbau oder Rendererwechsel. Andere K-/V-Ziele bleiben.
