# Isolierter Browservergleich Fangprimitive, 24.10.2026

## Änderungskarte vor Code
AUD14-04/A04: unveränderten Kandidaten PR438 gegen produktive Ableitung im Browser vergleichen. Ein kleines Linien-/Schraffur-Streckziel bei100/1000 Restschraffuren, Kalt/Änderung/Vollinvalidierung. Frischer iframe-Kontext je Variante und Fall, wechselnde Reihenfolge. Vollständige geordnete Primitive/Lookup/Querygleichheit außerhalb Messzeit. Bestehende Application-Commits für Ausgangsstände; keine Änderung an Domain, ToolInteraction, Modell, UI, Datei/Recovery/IFC/AI. Isolierte statische Diagnose ohne Nutzerdaten/Speicherzugriff. Browser-CPU und verfügbare Heapdaten von Prozess/GPU/Frames unterscheiden. Ergebnis entscheidet Übernahme oder Parken, kein weiterer Mikrooptimierungskandidat.
## Aufbau und Abgrenzung
PR438 nach grüner CI40037403547 in main658d390 integriert. Neues statisches Vite-
Diagnoseziel primitive-browser.html; unveränderter Kandidat primitive-cold-candidate.ts.
32 neue iframe-JavaScript-Realms, jeweils eine Variante und ein Fall. Kein eigener
Browserprozess oder Inkognito-BrowserContext pro iframe; JIT/GC/Prozessspeicher können
geteilt bleiben. Zwei Größen100/1000, Linien-/Schraffurziel, vier abwechselnde
Reihenfolgen. Innerhalb jedes Realms Kalt/Einzeländerung/Vollinvalidierung nacheinander.
Ausgangsstände aus realem editingReducer-Streckcommit; Aktionen außerhalb Messzeit.

Gemessen: vollständige Ableitung plus Index und Cachebefüllung. Alle drei Indizes
bleiben je Variante bis zum abschließenden Vergleich erhalten. Vergleich außerhalb
der Zeitmessung: vollständige Primitive/Segmente, alle Lookup-Einträge, geordnete
lokale Queries mit zwei Zoomwerten und Sichtbarkeitsfilter. Keine Datei-/Recovery-
Zugriffe, keine Nutzerdaten. Keine Produktionsimporte geändert.

Speichergrenze: Keine verlässliche isolierte Browserheap-/Prozess-/GPU-Peakmessung
über diesen UI-Kanal. Deshalb keine fingierten MiB-Angaben oder GC-Bereinigung.
Vorhandene Node-Heapdeltas aus PR438 bleiben Teilevidenz mit ihren dokumentierten
Grenzen. Browser-CPU ist keine native Geste und keine CadWorkspace-Gesamtframeabnahme.
Benchmark-Typecheck, gezieltes ESLint und frischer statischer Vite-Build bestanden.

## Ergebnis / Entscheidung
32 frische Realms,96 vollständige Phasen-Datenvergleiche und1536 geordnete Queries
bestanden. Keine Fehler im Browserlog. Rohdaten primitive-browser-results.json,
Screenshot outputs/primitive-browser.png. Chromium-Version siehe userAgent in JSON.
Median aus vier Wiederholungen, ms Produktion/Kandidat:

| Restkonturen / Ziel | Kalt | Einzeländerung | Vollinvalidierung |
| --- | --- | --- | --- |
| 100 / Linie | 87,6 / 89,0 | 71,0 / 58,9 | 71,5 / 73,6 |
| 100 / Schraffur | 86,3 / 86,6 | 70,6 / 59,2 | 63,6 / 75,7 |
| 1.000 / Linie | 745,6 / 816,1 | 826,8 / 636,3 | 768,8 / 957,6 |
| 1.000 / Schraffur | 799,6 / 769,1 | 754,2 / 613,4 | 712,3 / 744,4 |

Änderungen im Gruppenmedian16–23 % schneller, Vollinvalidierung in allen vier Gruppen
langsamer (ca.3–25 %). Kalt uneinheitlich. Konkreten Kandidaten parken, nicht produktiv
übernehmen. Das verwirft nicht generell Wiederverwendung; es gibt aber keinen weiteren
Mikrokandidaten als automatischen Folgeauftrag. Speicher-Gesamtnutzen ist nicht belegt.

## Nächster begrenzter Rest
Codeabgleich: CadWorkspace.startEdit routet Wand nur bei move in groupMove; x/y/axis
sind dort nur für Linie/Schraffur freigeschaltet. DemandMenu bietet Wandachsenaktionen
an. prepared-wall.ts nimmt point/stretch an. Damit Wand-x/y/axis als noch erreichbaren
Rest untersuchen, ohne bereits migrierte Endpunkt-/T-Pfade erneut zu implementieren.
Einziger Auftrag §9: bisherige Wandachsen-Vorschau gegen gemeinsame Auswahlbewegung
abgleichen und messen; feste kleine Wand bei wachsendem Restmodell, verbunden/getrennt,
Fenster und stationäre Nachbarn, vollständiger Commit/Undo und signierte Eingabe.
Erst nach exaktem Ergebnis-/Anschlussvergleich eine Anbindung wählen.
