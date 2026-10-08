# Manuelle Bewegungsaufzeichnung – 08.10.2026

PR173 ist nach Freigabe mit grüner CI zusammengeführt (`main` 5206295).
Der nächste begrenzte Diagnoseschritt ist implementiert. Das sporadische
Shift-Ruckeln bleibt offen; dieser Schritt verändert keine Produktgeometrie.

## Praktischer Ablauf

1. Diagnose-Devserver mit `npm run benchmark:browser` starten und
   `http://127.0.0.1:8081/benchmarks/browser.html` öffnen.
2. `T pair` aktivieren, `Load scenario` drücken. Im Canvas einen Auswahlrahmen
   um die zwei Wände und zwei Fenster ziehen (vier ausgewählte Elemente).
3. `Auswahl frei bewegen` starten und einen Ursprung im Canvas anklicken.
4. `Aufnahme starten` drücken. Die Maus zunächst ohne, dann mit gehaltenem Shift
   bewegen. Shift loslassen und erneut drücken, wie beim beobachteten Problem.
5. Sobald es stockt: `Aufnahme stoppen`, dann `Diagnose speichern`.
   Alternativ stoppt die Aufnahme automatisch nach 30 Sekunden. Das JSON ist
   zusätzlich im Textfeld verfügbar. Anschließend die Bewegung mit Esc abbrechen.

Der Recorder selbst ändert kein Modell. Normale Platzierungsklicks während der
Aufnahme bestätigen weiterhin normale Modellaktionen. Start/Stopp ist kein Undo.
Es werden ausschließlich Ereignismetadaten erfasst; kein Projekt, keine Bilder,
keine eingegebenen Texte und keine anderen Tasten als Shift. Kein Upload.

## Aufbau und Grenzen

- `benchmarks/manual-trace.ts`: Ringpuffer mit maximal 10.000 Ereignissen, relative
  Zeitachse, chronologisch sortierter Export, Anzahl verworfener älterer Einträge.
- `manual-capture.ts`: begrenzte Browser-Session mit Pointer-/Shift-Listenern,
  RAF, React- und vorhandenen Phasenmarkern sowie optionalem Long-Task-Observer.
  Stoppen entfernt Listener, Observer und Timer; erneutes Stoppen ist wirkungslos.
  Browser ohne Long-Task-Unterstützung werden ausdrücklich gekennzeichnet.
- `ManualRecorder.tsx`: Start/Stopp, JSON und Download. Kein React-State-Update
  pro Eingabe; Oberfläche ändert sich erst bei Start/Stopp. Synthetische
  Benchmarkläufe und Szenenwechsel sind während der Aufnahme gesperrt.
- `movement-trace.ts` und der vorhandene React-Profiler liefern die Zeitmarker.
  Alles bleibt unter `benchmarks/`, ohne neue Produktimporte oder Werkzeugregeln.

`at` und `renderStartedAt` sind Millisekunden seit Aufnahmestart. Die React-Dauer
beschreibt Renderarbeit, nicht die gesamte Framezeit. Phasen können ineinander
liegen; ihre Zeiten dürfen nicht addiert werden. Long Tasks werden asynchron
geliefert und zum Stopp nochmals aus dem Observer abgeholt. Ein Task kann über das
Ende des Aufnahmefensters hinauslaufen. RAF-Abstände sind keine gemessene
Bildschirmpräsentationslatenz. Eine blockierte Hauptschleife kann den Timeout-Callback
verzögern; Ereignisse nach dem 30-Sekunden-Fenster werden trotzdem nicht aufgenommen.

`trusted` trennt `dispatchEvent` von Browserereignissen. Auch Browserautomation
kann `trusted: true` erzeugen; das ist kein Nachweis physischer Hardwareeingabe.
`delayMs` ist die Differenz zwischen Empfang und Ereigniszeitstempel, keine
vollständige Betriebssystemlatenz. Blur/Tab-Sichtbarkeit werden mitgespeichert,
damit Hintergrunddrosselung nicht versehentlich als CAD-Fehler interpretiert wird.

## Prüfung

- 644 Tests bestanden, darunter fünf neue Prüfungen für Speichergrenze,
  Zeitkorrelation, Aufnahmefenster, unabhängigen Export und ungültige Grenzen.
- Diagnose-TypeScript, Produkt-TypeScript, Lint und Produktionsbuild geprüft;
  Lint hat weiterhin sechs bekannte Warnungen und keine Fehler.
- Browser: Start/manueller Stopp, Shift down/up und Pointer-Ereignisse,
  React-/Geometriephasen und Long Tasks im selben Bericht sichtbar.
- Automatischer Stopp: `reason: timeout`, `durationMs: 30000`, 4.304 Ereignisse.
- JSON-Download im Downloads-Ordner stimmt bytegenau mit dem Bericht überein.
  Der Browser-Download-Warteaufruf der Automation lief in einen Timeout; die
  Datei selbst wurde erstellt und anschließend geprüft.
- Vierfachauswahl per Rahmen, Bewegung während Aufnahme, 101 erfasste Ereignisse
  einschließlich 12 Browser-Pointer-Ereignissen und lokaler Geometrievorschau.
  Abbruch lässt Undo deaktiviert: kein Modell-Commit durch den Recorder.

Diese Bedienprüfung reproduziert noch keinen Shift-Aussetzer. Der separate
30-Sekunden-Timeouttest lief teilweise parallel zu Build/Tests und ist deshalb
ausdrücklich keine neue Latenzmessung.

## Genau ein Folgeauftrag

Den gemeldeten Aussetzer mit diesem Recorder im tatsächlichen Bedienablauf
aufzeichnen und das betroffene Zeitfenster auswerten. Den belegten Verursacher im
gemeinsamen Eingabe-/Vorschaupfad korrigieren und mit/ohne Shift sowie gegen den
vollständigen Geometriepfad vergleichen. Erst danach die vorgesehene atomare
Bestätigung weiterverfolgen. Kein zusätzlicher Cache oder Werkzeug-Sonderpfad
ohne Befund.
