# Isolierter Browservergleich: Wandressourcen – 21.10.2026

## Änderungskarte
AUD14-03/04, main 52c74e4 nach PR419 (CI39650757649 grün). Ziel: Produktion und archivierten gebündelten Kandidaten bei wechselnder Reihenfolge im tatsächlichen Browserruntime vergleichen und Fortführung/Parken entscheiden. Normalszenarien freie Wand/freies Fenster/verbundenes Fenster; Gegenprobe Geschosshöhe und expliziter Kaltaufbau. Diagnoseadapter unter benchmarks, keine Produktänderung oder neue Modell-/Cachewahrheit. Gemeinsame Fixture, validierte Owned-Snapshots und bestehende updateWall/updateWindow/setStoreyHeight; Aktionen/Snapshots/Exaktvergleich außerhalb der Zeitmessung. Vorschau/Commit/Undo, Speicher/Recovery, Datei/IFC und AI unverändert. Risikoprüfung: vollständige Ergebnisgleichheit, Reihenfolge, Rohdownload, Typen/Lint/frischer Build, Browserfehlerlog.

## Umgebung und Durchführung
Windows 10/11 x64, Browser meldet Chrome155.0.0.0, bestehender Rechner Ryzen5 3600 (Referenz aus lokalen Messungen; kein neues Hardware-/Prozessprofil). Frischer statischer Vite-Build über wall-resource-browser.config.ts ohne HMR. Port8089, Datei benchmarks/wall-resource-browser.html, geladenes Asset wall-resource-browser-DST8AZo4.js. Kandidat nur per Diagnose-Virtualmodul aus archivierter Textfixture, relative Produktionsimporte erhalten. Keine temporäre Produktdatei. Nach Typnotationskorrekturen erneut gebaut: identisches Asset. Erster Sandbox-Build benötigte Kindprozessfreigabe; regulär mit Berechtigung erfolgreich.

Zweimal über sichtbaren Button gestartet. 0/100/1000 Restwände plus eine feste Zielwand, 4 unabhängige Änderungen, 7 Trials =84 Fälle je Lauf. Große Szene1005 Wände/1003 Fenster. Kalter Aufbau und geänderter Zustand jeweils zwischen Produktion/Kandidat alterniert; Startreihenfolge im zweiten Lauf umgekehrt. Projekt-ID je Szene unterschiedlich, damit Kaltaufbau keinen Vorzustandsreuse findet. Insgesamt336 vollständige Kalt-/Änderungsvergleiche mit rekursivem Object.is bestanden (einschließlich Vorzeichen von Null, Flächen, Normalen, Volumen und Bounds). Rohdownload im Browser gespeichert; separate Auswertung bestätigt168 passende Fälle und gegensätzliche Reihenfolge beider Läufe. Keine Browserfehler protokolliert.

## Ergebnis
Großer Testfall, Mediane Browser-CPU ms:

| Fall | Produktion1 | Kandidat1 | Produktion2 | Kandidat2 |
| --- | --- | --- | --- | --- |
| Kaltaufbau | 34,7 | 38,2 | 35,2 | 36,2 |
| Freie Wand | 32,7 | 25,6 | 32,9 | 25,7 |
| Freies Fenster | 32,6 | 26,9 | 33,5 | 29,9 |
| Verbundenes Fenster | 33,8 | 26,5 | 32,6 | 26,7 |
| Geschosshöhe | 31,8 | 34,2 | 30,9 | 33,1 |

Große Einzeländerungen etwa11–22 % schneller, Kaltaufbau etwa3–10 % langsamer, Höhe etwa7–8 % langsamer. Kleine Fixture meist unter0,5 ms Differenz; keine relevante Beschleunigungsbehauptung. Mittlere Fixture schwankt, z.B. freie Wand im ersten Lauf5,5 auf12,2 ms, im zweiten3,9 auf3,5 ms. Kein p95-Versprechen aus sieben Trials.

## Entscheidung
Diesen gebündelten Kandidaten vorerst parken. Wechselnde Reihenfolge im Browser beseitigt das Nichtbestehen des Gesamtbudgets nicht. Keine automatische Produktübernahme, kein weiterer Node-Mikropilot dieser Cachevarianten als unmittelbare Aufgabe. Der mögliche Nutzen von Wiederverwendung generell wird damit nicht widerlegt; dieser konkrete Kandidat erfüllt die aktuelle Abnahme nicht.

## Grenzen / Abschlusskarte
Reine Browser-CPU-Diagnoseseite mit echten Geometrie-/Application-Modulen, keine CadWorkspace-Mausbedienung, keine WebGL-/GPU-/Gesamtframe-, Speicherpeak-/Langsession- oder Native-Abnahme. Zwei Läufe in derselben Seite, JIT/GC/geteilte untere Caches und Quantisierung von performance.now bleiben Einflüsse; kein Neustart zwischen Läufen. Modellaktionen und Snapshotaufbau sind nicht mitgemessen. Nutzerprojekt8080 und alle Recovery-Daten unberührt. Diagnoseseite verwendet keine Persistenz. Keine Produktverantwortung in UI verschoben, keine neuen Laufzeitzyklen/Produktabhängigkeiten. Benchmark-Typecheck, fokussiertes ESLint und statischer Build bestanden. Keine erneute Vollsuite für reine Diagnose behauptet.

Rohdaten: benchmarks/wall-resource-browser-results.json. Screenshot lokal outputs/wall-resource-browser.png außerhalb des Repos. Manuelle Reproduktion: statischen Build mit wall-resource-browser.config.ts erstellen, preview Port8089, Seite öffnen, zweimal Vergleich starten, Messdaten speichern. Beide Abschlussmeldungen müssen84 Kalt-/84 Änderungsvergleiche bestätigen.

Einziger nächster Auftrag §9: aktuelle Inventur der noch nicht vorbereiteten Legacy-Bewegungs-/Anschlussaktionen gegen main und vorhandene Tests; genau einen belegten offenen Pfad für den nächsten begrenzten Schritt bestimmen. Bereits in PR391–400 korrigierte große Gruppen/T-Ziele nicht erneut implementieren. Keine neue Fachfunktion vor dem übrigen AUD14-Abgleich; Frame-/Native-Gates offen lassen.
