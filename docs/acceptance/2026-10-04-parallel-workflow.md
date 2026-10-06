# Abnahme: gemeinsame Parallelbewegung in 2D und 3D

Stand: 04.10.2026. Ausgangspunkt: Integrationszweig nach PR #82, Commit 26ff206.

## Automatisierter Nachweis

`src/rendering/viewport/parallel-workflow.test.ts` verbindet die realen Adapter und Aktionen:

1. 3m-Wand mit mittigem 1,2m-Fenster und zweite Wand mit Richtung (2,4; 1,8) anlegen.
2. Bewegung mit tatsächlichem Fußpunkt als Ursprung starten; bewegte Wand als Quelle ausschließen.
3. Sichtbare schräge Fußkante über lokale Suche erkennen; 599ms reichen nicht, 600ms aktivieren.
4. Über dieselbe Engine parallel führen und `2,5` Meter mit Mauswinkel eingeben.
5. Vorschau ohne History, Abbruch und ungültigen Winkel prüfen.
6. Bestätigen: Fensterwand verschiebt sich um (2; 1,5)m, Referenzwand und Fensterparameter bleiben erhalten; genau ein Undo-Schritt.
7. Undo/Redo, JSON-Serialisierung und `readProjectFile` prüfen.
8. 3D-Geometrie vor/nach Dateirundlauf vergleichen; deterministischen IFC-Inhalt mit zwei Wänden, einem Fenster, 3m-Länge und korrekter neuer Position prüfen.

Ergebnis: bestanden. Gesamtsuite: 327 Tests. TypeScript und Build erfolgreich, ESLint ohne Fehler bei sechs bestehenden React-Refresh-Warnungen.

## Browsernachweis

Separater Abnahme-Tab mit Beispielprojekt; vorhandener Nutzer-Tab nicht bearbeitet.

- Zweite Wand im Grundriss gezeichnet: Länge 2,720294m, Richtung ungefähr 342,897271° im Modell.
- Sichtbaren Fußpunkt der Fensterwand gewählt, „Element frei bewegen“ gestartet.
- Fußkante der anderen Wand aktiviert; Status zeigt zwei Referenzen einschließlich gepinntem Ursprung.
- Maus in Parallelrichtung, Tab zur Länge: Winkel 342,89727103094765° fixiert; Strecke 1m eingegeben.
- Vorherigen Versuch abgebrochen; den beschriebenen Versuch anschließend übernommen.
- Im Grundriss liegt die erste Wand bei (0,95577900872195; -0,2940858488375233)m. Länge bleibt 3m. Die zweite Wand bleibt unverändert. Die abgelesenen SVG-Transformationen berücksichtigen die nach unten gerichtete Bildschirm-Y-Achse.
- Undo stellt (0; 0) wieder her. Redo stellt exakt dieselben gerenderten Wandtransformationen wieder her (DOM-Vergleich).
- Wechsel zurück in 3D funktioniert. JSON- und IFC-Export-Schaltflächen ausgelöst; IFC meldet „download requested“.

## Grenzen des Nachweises

Ein angeforderter Download ist kein Nachweis einer geschriebenen Datei. Die Browsersteuerung bietet keinen Datei-Upload, und der native Dialog konnte in dieser Umgebung nicht automatisiert werden. Deshalb wurden das tatsächliche Herunterladen und erneute Öffnen der Browserdatei **nicht** als bestanden gewertet. Dateiinhalte und Wiederherstellung sind über den automatisierten Test nachgewiesen. Ein erneuter Archicad-Import ist nicht Bestandteil dieser Prüfung.

Bedienhinweise aus der Abnahme: Das verschiebbare Hilfseingabefenster kann einen Kantenabschnitt verdecken; einen freien Abschnitt verwenden oder das Fenster verschieben. Beim Wechsel der Tiefenstufe wird eine laufende Hover-Aufnahme unterbrochen; eine weitere kleine Mausbewegung startet sie neu (bereits dokumentierte Einschränkung). Fangziele hinter stationären Wänden bleiben absichtlich ausgeschlossen.

## Noch manuell prüfen

Im Abnahme-Tab „Save project“ ausführen und die JSON-Datei tatsächlich ablegen. Anschließend dieselbe Datei über „Open project“ öffnen: zwei Wände, ein mittiges Fenster und unveränderte Positionen erwarten. IFC-Datei ablegen und optional in Archicad importieren. Vor dem Öffnen anderer Dateien eigene ungesicherte Arbeit speichern.

Kein neuer Modellfehler wurde in diesem Prüfumfang nachgewiesen. Der Test ist in der regulären Testsuite registriert; Produktionslogik wurde in diesem Schritt nicht verändert.
