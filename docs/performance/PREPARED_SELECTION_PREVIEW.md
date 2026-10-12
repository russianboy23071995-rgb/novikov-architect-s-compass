# A-04-Pilot: vorbereitete Auswahlbewegung – 07.10.2026

## Ergebnis und Geltungsbereich

PR171 ist nach Nutzerfreigabe in `main` (`4d284da`) integriert. Der Pilot auf
`perf/prepared-selection-preview` stellt **Auswahl frei bewegen im 2D-Grundriss**
auf eine vorbereitete gemeinsame Aktion um. Modell, Dateiformat, IFC und
Snapshot-History bleiben erhalten. Einzelne Direct-Edit-Werkzeuge und andere
Aktionen sind noch nicht auf diese Vorschau umgestellt. A-04 ist insgesamt offen.

Die laufende Vorschau erstellt kein Gesamtprojekt. Sie zeigt betroffene Geometrie
über einer stabilen Basis. Bestätigen materialisiert und prüft weiterhin das
vollständige Projekt; die bestehende History erzeugt genau einen Undo-Schritt.
Text/Voice-Gruppenbewegung verwendet dieselbe vorbereitete Aktion über den
bestehenden vollständigen Vorschau-/Annahmeweg, keine eigene Modelllogik.

## Architektur und Sicherheitsgrenze

- `domain/project/prepared-translation.ts` validiert einmal am Sitzungsbeginn
  und hält eine eigene eingefrorene Basis. Aufruferobjekte werden nicht eingefroren.
  Auswahl, Beziehungsnachbarschaft und globale Endpunktbelegung werden vorbereitet.
- Die betroffene Wandmenge enthält konservativ die ganze verbundene Komponente,
  einschließlich stehender Partner und aller ihrer Fenster. Ausgewählte Linien,
  Schraffuren und Referenzen kommen hinzu. Interne Anschlüsse bleiben bestehen;
  Beziehungen über die Auswahlgrenze lösen sich bei einer Bewegung. Nullbewegung
  erhält die ursprünglichen Beziehungen.
- Ein globaler Endpunktindex erkennt auch neue Belegung einer vorher unbeteiligten
  Ecke. Nur Beziehungsnachbarn zu prüfen wäre unzureichend. Fachliche Wand-,
  Fenster-, Kontur- und Anschlussregeln werden wiederverwendet; verschobene
  Koordinaten und numerische Entartung werden weiterhin geprüft.
- `GeometryPreview`/`ModelGeometry` beschreiben wegwerfbare Geometrie, kein
  speicherbares Projekt. Unveränderte lokale Objekte/Assets werden wiederverwendet.
  Die endgültige Aktion prüft Identität und Inhalt der Basis erneut, berechnet
  frisch und führt die volle Validierung aus. Ein verändertes Anzeigeergebnis
  kann nicht in die History übernommen werden.
- `selection/move.ts` bindet das Ergebnis an Auswahl, Ursprung und Sichtbarkeit.
  Das bestehende `ToolInteraction` trägt optional diese Geometrievorschau; Fang,
  Shift, Tab und Eingabe bleiben gemeinsame Dienste.
- `plan-scene.ts` und `PlanSceneRun.tsx` teilen die vorhandene SVG-Darstellung in
  zusammenhängende, unveränderte bzw. betroffene Abschnitte. Die originale
  Zeichenreihenfolge bleibt erhalten, auch bei überlappenden Referenzbildern.
  Der Navigator verwendet stabile Projekt-/Auswahldaten und einen Fensterindex.
  Reine Mausziele bauen unbetroffene Darstellung und Navigator nicht erneut auf.

## Vergleichsmessung

Gleicher Windows-/Chromium-154-Browser, Vite-Diagnoseseite, 1280 × 720 CSS-Pixel.
100/1.000/5.000 gemischte Elemente, 20 ausgewählte Wände, optional ein 1400²-PNG
mit knapp 8 MB Dateinutzlast. Ein Aufwärmpunkt, danach 21 veränderte Mausziele.
CSS-Eingaben und endgültige ViewBoxes stimmen in allen sechs Fällen exakt mit
der PR171-Baseline überein. Die Zahl zusätzlicher Setup-Zoomschritte unterscheidet
sich teilweise durch das initiale Einpassen; die gemessene Kamera ist identisch.

| Elemente | Bild | PR171 Median / P95 (ms) | Pilot Median / P95 (ms) | Vorbereitung, zwei Starts (ms) |
| --- | --- | ---: | ---: | ---: |
| 100 | nein | 36,4 / 65,4 | 19,2 / 27,1 | 5,7 / 2,5 |
| 100 | PNG | 261,4 / 270,8 | 18,3 / 35,4 | 182,2 / 177,5 |
| 1.000 | nein | 171,2 / 292,1 | 22,6 / 28,1 | 47,5 / 35,5 |
| 1.000 | PNG | 371,0 / 493,9 | 25,5 / 39,7 | 257,8 / 257,0 |
| 5.000 | nein | 1.026,6 / 1.052,2 | 38,2 / 60,3 | 254,4 / 227,6 |
| 5.000 | PNG | 1.234,6 / 1.292,9 | 38,9 / 65,5 | 437,2 / 428,6 |

Alle 126 aufgezeichneten Ziele: **0 Gesamtprojekt-Validierungen**, keine erneute
Bild-URL-Prüfung, genau eine lokale Aktionsauswertung und ein betroffener
Darstellungsabschnitt. Kein JSON-/Base64-Prüfpfad im neuen Pointerpfad. Die volle
Prüfung liegt vor/nach diesen Stichproben. Im Bildfall ist die Prüfung beim
Vorbereiten sichtbar; die Kosten sind nicht verschwunden oder in der Tabelle versteckt.

Zusatzfall: 100 Elemente, davon 40 Wände, eine Hauptwand mit 20 T-Nachbarn,
Eckpartner und Fenster. 20 Wände bewegen sich, 20 T-Nachbarn bleiben stehen.
Median/P95 **23,3/29,0 ms**, Vorbereitung **13,1/6,1 ms**. Alle 21 Ziele erfüllen
dieselben strukturellen Kriterien. Kein alter Latenzwert für diesen neuen Fall.

Rohdaten: [Pilot](prepared-preview-2026-10-07/),
[Baseline](preview-reuse-2026-10-07/), ausführbarer Ablauf in
`benchmarks/movement-driver.ts`. Verschachtelte Phasen sind inklusive und dürfen
nicht addiert werden. Gemessen wird synthetische Eingabe bis zu einer bestätigten
Browser-Frame-Gelegenheit, keine OS-/GPU-Latenz oder garantierte Bildrate.
Hardware-Eingabe, kontinuierliche Ereignislast und Spitzenspeicher sind nicht erfasst.

## Gleichheit und Prüfung

- **639/639 Tests bestanden.** Sechs neue Tests enthalten unter anderem 120
  Vergleiche von Ziel/Auswahlkombinationen gegen den eingefrorenen PR171-Vollpfad:
  gemischte Auswahlen, Host-Fenster, Ecke/T, stehende Partner, Nullbewegung,
  Zufallsdeltas, numerische Grenzen und globale Fremdendpunkte. Konturen und
  Körper stimmen überein; ungültige Ergebnisse werden abgewiesen.
- Tests prüfen auch isolierte Vorschauobjekte, wiederverwendete Assets,
  mutierte/veraltete Basis, Auswahl/Sichtbarkeit/Ursprung und erhaltene
  Zeichenreihenfolge. Bestehende Gruppenbewegungs-, Text-/Voice-, Datei-,
  3D-Geometrie- und IFC-Regressionen laufen über die gemeinsame Aktion.
- Alle sechs Browserfälle bestehen Vorschau, Abbruch ohne History-Eintrag,
  Mausplatzierung und genau ein Undo/Redo. Der zusätzliche T-Fall vergleicht
  **alle 40 gerenderten Wandflächen und Konturen sowie zehn Fenster** direkt
  mit dem alten Vollpfad – vor und nach Bestätigung sowie bei numerischer Vorschau.
  Die zehn internen Ecken bleiben erhalten, die 20 äußeren T-Beziehungen lösen sich.
  Shift hält seine Richtung bis zum Loslassen; Tab wechselt Länge → Winkel;
  90°/2 m ergibt die erwartete Vorschau. Zoom läuft über den realen Wheel-Handler.
- TypeScript für Produkt und Benchmarks, Produktionsbuild und ESLint bestanden:
  0 Fehler, 6 bestehende Fast-Refresh-Warnungen. Bekannte Bundle-/Vite-/Nitro-Hinweise
  bleiben. `checks.yml` führt dieselben Prüfungen auf GitHub aus; tatsächlicher
  CI-Status und Commitbezug sind im PR zu prüfen, die Konfiguration allein ist
  kein bestandener Lauf.

Der Browservergleich ist ein synthetischer Diagnosefall. Die manuelle Abnahme
mit einem Nutzerprojekt, echtem Eingabegerät und neuer Archicad-Importdatei wurde
in diesem Auftrag nicht durchgeführt; ältere bestätigte Importe sind keine neue
Abnahme dieses PRs.

## Grenzen und praktischer Abnahmetest

Vorbereitung und Commit bleiben projektgroß. Der Commitpfad enthält noch
wiederholte vollständige Auswertung/Validierung sowie History-Vergleich; deren
Gesamtlatenz wurde hier nicht separat gemessen. Sehr große zusammenhängende
Wandnetze können auch die konservative Vorschau-Abhängigkeitsmenge vergrößern.
Unveränderte Darstellung wird wiederverwendet, aber SVG-DOM, Auswahlwechsel,
Zoom, Erstladen und alle anderen Aktionen sind damit nicht allgemein optimiert.

1. Zwei verbundene Wände mit Fenster, eine Linie, Schraffur und Bildreferenz per
   Strg-Klick auswählen. Einen T-Nachbarn bewusst stehen lassen.
2. „Auswahl frei bewegen“, Ursprung anklicken, Maus bewegen. Fenster und interne
   Verbindung folgen; stehende Nachbarn erhalten einen geraden Abschluss.
3. Richtung mit Shift halten, Maus weit weg bewegen, Shift lösen; Tab für Länge,
   erneut Tab für Winkel. Während der Bewegung zoomen.
4. Erst mit Esc abbrechen. Danach erneut bewegen und per Klick oder Eingabe
   platzieren; einmal Undo/Redo muss die ganze Bewegung zurücknehmen/wiederholen.
5. Speichern/öffnen, 3D und IFC kontrollieren: derselbe bestätigte Modellstand.

**Genau ein nächster begrenzter Auftrag:** Nach praktischer Pilotabnahme die
Vorbereitungs- und Bestätigungskosten dieser Auswahlbewegung getrennt profilieren
und die doppelte Aktionsauswertung zwischen `validate` und `commit` durch eine
gemeinsame atomare Bestätigung ersetzen. Die vollständige Prüfung des aktuellen
Modells am Übergang zur History muss erhalten bleiben. Mit denselben Geometrie-
Vergleichsfällen und genau einem Undo absichern; noch keine breite Migration
weiterer Werkzeuge. A-01-Messlücken sowie A-05/A-06/A-07 bleiben separat offen.
