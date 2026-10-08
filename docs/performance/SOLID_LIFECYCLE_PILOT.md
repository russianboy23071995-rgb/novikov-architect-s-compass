# K07c: Renderer-Lebenszyklus im isolierten Pilot

08.10.2026. PR200 mit erfolgreicher CI zusammengefuehrt. Kein Produktpfad ersetzt.

## Umsetzung

Pilot besitzt Programm und getrennte Koerper-/Konturpuffer pro Canvas. Explizites
update ersetzt den unveraenderlichen Display-Snapshot, Ursprung und kopierte
Auswahlmenge. Identische Eingaben bauen nichts neu auf. Geometrie, Sichtbarkeit
oder Auswahlfarben werden konservativ neu aufgebaut; kein ID-basierter Cache
und keine zweite Modellverwaltung. Konturen verwenden weiterhin outlineTriangles
mit den bestehenden CSS-Pixelbreiten und Tiefenregeln. Ihr eigener dynamischer
Puffer kann den persistenten Koerperpuffer nicht ueberschreiben.

Context-Verlust deaktiviert draw und verwirft GPU-Handles; update behaelt waehrend
des Verlusts den neuesten Snapshot. Wiederherstellung baut daraus Ressourcen neu.
Dispose entfernt Listener und Ressourcen, ist wiederholbar und weist weitere
Updates ab. Das ist eine Diagnoseimplementierung, keine neue Application-Aktion.

## Nachweise

695 Tests bestanden, Diagnose-Typecheck inkl. src, gezielter Lint und Build
bestanden. Bestehende Buildhinweise unveraendert.

/benchmarks/solid-lifecycle.html: neun Bildvergleiche mit bestehendem Renderer:
initial, reine Kameraaenderung, Wand/Fensterauswahl, ausgewaehltes Zoom/DPR2,
Geometriewechsel, ausgeblendeter Host, alles ausgeblendet, wieder sichtbar und
neuester Snapshot nach echtem WEBGL_lose_context-Verlust/Wiederherstellung.
Alle neun bestanden ohne Pixelabweichung ueber die Kanalgrenze 8.
[Rohdaten](solid-lifecycle.json). Pufferaufbauzaehler belegt: Kamera und Zoom/DPR
bauen keine Koerper neu; geaenderte Snapshots und Wiederherstellung schon.
Quelle und IDs bleiben unveraendert. Dispose wiederholt und Update danach geprueft.

Im ersten Treiber wurde restoreContext noch waehrend der Verlustereignis-
Abwicklung angefordert und lief in den Timeout. Der Treiber wartet jetzt einen
separaten Task (100 ms); die Wiederherstellung wird am echten Browserereignis
mit 5-Sekunden-Grenze geprueft. Kein kuenstlich ausgeloestes restored-Ereignis.

Die bisherigen 180 Kamera-/Resize-Bildvergleiche bestanden erneut mit maximal
zwei abweichenden Pixeln. [Regression](solid-lifecycle-regression.json). Keine neue Gesamtframe-/GPU-Leistungsbehauptung. DPR2 simuliert die
Backbufferabmessung; Betriebssystemwechsel und echte Hardware-Resets sind damit
nicht nachgewiesen. Kontext-Restoration wurde in diesem Chromium-Browser geprueft.
Auswahlwechsel baut derzeit konservativ auch Shader/Koerper neu auf; Performance
bei grossen wechselnden Auswahlen ist nicht Gegenstand dieser Kameraoptimierung.

## Entscheidung und genau ein Folgeauftrag

K07d: Den abgesicherten Renderer begrenzt in BimSolidView anbinden und die
Ressourcenverantwortung an genau einer Stelle fuehren. Gemeinsame Projektion,
CPU-Picking, Konturen und Kontextinvalidierung erhalten. Bestehenden Renderer
als Diagnosevergleich sichern; produktive Kamera/Resize/Auswahl/Modellwechsel
und Kontextverlust im Canvas pruefen. Kein Picking-Umbau, kein neuer Renderer-
Technologiestack. Erst diese Integration macht die Verbesserung im Programm nutzbar.
