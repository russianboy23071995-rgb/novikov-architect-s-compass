# K07d: persistente 3D-Geometriepuffer produktiv angebunden

08.10.2026. PR201 nach erfolgreicher CI zusammengefuehrt.

## Verantwortung

BimSolidView delegiert draw an rendering/viewport/solid-renderer. Geometry/
projections/camera-matrix verwendet die bestehende orthographische Projektion.
Der Renderer behaelt einen Display-Snapshot samt kopiertem Ursprung/Auswahl.
Nur geaenderte Geometrieidentitaet, Ursprung oder Auswahlfarben bauen Ressourcen
neu auf. Kamera und Backbuffergroesse aktualisieren Matrix/Viewport. Getrennte
Koerper- und Konturpuffer erhalten konstante gemeinsame CSS-Konturbreiten.

Canvas bleibt alleiniger Besitzer der Kontext-/Resize-Ereignisse sowie der
angezeigten Projektion und ihrer Picking-Gueltigkeit. Bei Verlust werden
Ressourcen freigegeben und angezeigte Projektion verworfen, bei Wiederherstellung
neu angelegt. Fehler beim Aufbau/Draw zeigen einen Hinweis und geben keine
veraltete Projektion fuer Picking frei. Modell, Auswahlaktionen und History
bleiben unveraendert. Kein zweiter Renderer-Technologiestack.

Der eingefrorene alte Renderer liegt nur in benchmarks/legacy-solid-renderer.ts.
Diagnoseinstrumentierung zeigt jetzt ausdruecklich auf diese Referenz. Pilot und
Produkt teilen den neuen Ressourcenkoerper; keine auseinanderlaufende Kopie.

## Nachweise

695 Tests, Diagnose-Typecheck inklusive src, gezielter ESLint und Produktionsbuild
bestanden. Bestehende Chunk-/Vitehinweise bleiben.
180 Bildvergleiche gegen eingefrorene Referenz bestanden, maximal zwei Pixel
ueber Kanalgrenze 8. [Rohdaten](solid-integrated-regression.json). Scope und
Toleranzen aus K07b bleiben; keine neue Gesamtframe-/GPU-Leistungszusage.

/benchmarks/solid-workspace.html rendert echten CadWorkspace mit drei verbundenen
Waenden/Fenstern. In 3D geprueft: Kamera per Tastatur, echter simulierter
WEBGL_lose_context-Verlust, sichtbarer Fehlerhinweis und Wiederherstellung;
anschliessend sichtbare Geometrie/Fenstermarkierung. Wandlaenge 4 auf 5 m ueber
Eigenschaften, Undo auf 4; alle Ebenen aus (leere Szene), eigene Sichtbarkeits-
History wiederhergestellt; Fensterauswahl zeigt richtige stabile ID und Kontur.
Geprueft auf separater Diagnosefixture, kein Nutzerprojekt geaendert.

Grenzen: Auswahlwechsel baut konservativ Programm/Koerper neu; keine neue
Optimierung grosser wechselnder Auswahlen. CPU-Picking/Fusspunkt-Inferenz und
Modellableitung bleiben Kostenstellen. Kontextwiederherstellung in Chromium
geprueft, kein universeller Hardware-/Treibernachweis. Display-Snapshots duerfen
nicht in-place mutiert werden; bestehende immutable Ableitung liefert sie.

## Praktische Abnahme und genau ein Folgeauftrag

Anwendung: auf 3D wechseln, drehen/zoomen, Wand und Fenster auswaehlen,
Wandlaenge aendern und Undo, Ebenen aus/ein. Konturen und Auswahl muessen stimmen.

K07e: Isolierter 3D-Picking-Pilot mit pro angezeigter Projektion vorbereiteten
Trefferkandidaten. Naechste Wand/Fenster-ID und Tiefe gegen bestehenden Vollscan
vergleichen, verdeckte Flaechen/Fenster und Kamera-/Sichtbarkeitswechsel einbeziehen.
Noch keine produktive Picking-Umstellung und kein neuer Modellindex. Andere
K-/V-Ziele bleiben erhalten.
