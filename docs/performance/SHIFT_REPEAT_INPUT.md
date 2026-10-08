# Shift-Wiederholungen am Eingabeeingang — 08.10.2026

Basis: main f5100cd (PR174). Nutzeraufnahme: 21.443 ms, 10.000 erhaltene
Ereignisse ab 7.715,9 ms; 4.921 ältere Einträge durch die Ringgrenze verworfen.
SHA-256 der lokal gesicherten Aufnahme:
`950a5e69ee6f062fb576983d71777637dc9ac7523328a4ec90d943bdf7f62db1`.
Die Nutzerdatei bleibt lokal; hier stehen synthetische Vergleichsberichte.

In der erhaltenen Aufnahme: mit Shift 20 RAF-Abstände über 50 ms (max. 90,4 ms),
ohne Shift keine (max. 41,7 ms). Zuordnung nach letztem beobachteten Modifierzustand;
Grenzframes und unterschiedliche Bewegungsverläufe erlauben keinen kausalen
Latenzvergleich. 225 wiederholte Shift-keydown-Ereignisse. Geometrievorschau
max. 2,8 ms, Snap max. 1,8 ms; keine erhaltenen Long Tasks. Das schließt andere
Ursachen, Rendering/GPU-Arbeit oder Verzögerungen im verworfenen Anfang nicht aus.

## Begrenzte Korrektur

BimPlan und der von Grundriss/Arbeitsebene gemeinsam benutzte useShiftSnapLock
ignorieren Shift-Auto-Repeat vor dem React-State-Update. Gleicher boolescher Wert
allein verhinderte im belasteten Browserpfad nicht sämtliche zusätzlichen Commits.
Erster Tastendruck, Loslassen, Escape und Blur bleiben unverändert. Keine neue
Fangregel, kein Cache, keine neue Modelllogik; endgültige Validierung und History
bleiben bestehen. Alle Werkzeuge bedienen sich weiterhin desselben Eingangs.

## Reproduzierbarer Vergleich

Diagnoseseite: T pair + Hold Shift; optional Repeat Shift; Load scenario,
Profile movement. Repeat Shift sendet im kontinuierlichen Teil ein synthetisches
repeat-keydown je Pointerupdate (240 Updates, angefragter Abstand 4 ms).
Das ist ein kontrollierter Belastungsfall, keine exakte Wiedergabe der Hardware-
Frequenz. Dieselbe Fenstergröße 1838 × 1266 und derselbe Pfad; keine Builds parallel.
Die 21 sequenziellen Proben enthalten keine Wiederholungen.

| Fall | React-Commits | React gesamt ms | RAF p95 ms | RAF max. ms |
| --- | ---: | ---: | ---: | ---: |
| Vorher, Shift ohne Repeat | 241 | 2307,5 | 20,8 | 34,9 |
| Vorher, Shift mit Repeat | 481 | 2438,9 | 27,8 | 41,7 |
| Nachher, Shift mit Repeat | 240 | 2557,8 | 20,8 | 34,8 |
| Nachher, Wiederholung | 240 | 2186,5 | 20,7 | 27,8 |
| Nachher, ohne Shift | 241 | 2143,6 | 20,7 | 27,9 |

[Rohberichte](shift-repeat-2026-10-08/). Erster RAF-Wert wird bei der Auswertung
weggelassen: dessen Zeitstempel kann vor dem performance.now()-Messbeginn liegen.
Reduzierte Commits sind nachgewiesen; Render-Gesamtzeit schwankt und sinkt nicht
in jedem Lauf. Vollständige Behebung des Nutzer-Ruckelns wird nicht behauptet.

Zusätzliche Browserregression: zwölf Repeat-Signale ohne neue Mausposition lösen
null React-Commits und null instrumentierte Berechnungsphasen aus; Geometrie bleibt
fest. Beide korrigierten Shift-Läufe und der freie Lauf bestehen Richtung halten/
lösen, Tab Länge/Winkel, Zahlenvorschau, Escape ohne Commit, Platzierung und genau
ein Undo/Redo. Wände, Fenster und erhaltener T-Anschluss stimmen in Vorschau und
Commit mit dem vollständigen Modellpfad überein.

**Offener Diagnosebefund:** Der erste Lauf unmittelbar nach der Änderung meldete
`Full-path DOM mismatch: wall-1 outline`. Der alte Vergleich gab keine Werte aus.
Der Comparator wurde deshalb um tatsächlichen/erwarteten Wert ergänzt, ohne die
strikte Prüfung abzuschwächen. Zwei erneute Shift-Läufe und ein freier Lauf waren
erfolgreich. Ursache dieses einmaligen Fehlers noch nicht geklärt; nicht als bloßer
Rundungs- oder Hot-Reload-Effekt abtun. PR bleibt bis zur Klärung zur Prüfung offen.

644 Tests bestanden; Produkt- und Diagnose-TypeScript, Produktionsbuild erfolgreich.
Lint: 0 Fehler, 6 bekannte Warnungen. Keine neue IFC-/Archicad-Prüfung erforderlich
für diesen reinen Eingangsfilter; es wurden keine Exportpfade geändert.

## Nächster begrenzter Auftrag

Den einmaligen Konturvergleich mit der erweiterten Fehlermeldung gezielt
wiederholen und aufklären, dann die reale Shift-Bewegung praktisch abnehmen.
Erst danach die atomare Bestätigung fortsetzen. Kein Rendererwechsel und keine
pauschale Übertragung auf weitere Vorschauaktionen.
