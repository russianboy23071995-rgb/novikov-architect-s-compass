# Restkosten der 3D-Vorbereitung – 21.10.2026

## Änderungskarte und Basis
PR411 nach grüner CI 39636013571 in main 85c3581 übernommen. AUD14-03/04: messbare verbleibende Kosten nach direkter Pufferpackung und Hostgruppierung bestimmen. Zwei Szenarien: kleine verbundene Auswahl, dieselbe Auswahl in wachsendem Restgebäude mit Fenstern; zusätzlich Auswahlwechsel A/A/B/A. Keine Produktänderung.

Eigentümer: vorhandene Diagnose unter benchmarks; Quelle ist die gemeinsame Fixture mit stabilen Wand-/Host-/Geschoss-IDs. Application-Vorbereitung/evaluate/materialize und Renderingableitungen werden unverändert aufgerufen; unabhängiger Vollpfad prüft jede Vorschau nach den Messungen. Commit/Undo/Abbruch bleiben unverändert. Keine neuen Importpfeile, Modellkopien im Produkt, Bibliotheks-, AI-, IFC-, Datei- oder Recovery-Verträge. Nur Basis-/Methodenbeschriftung vorhandener Messstände korrigiert und Rohdaten ergänzt. Risikoprüfung: Geometrie-/Puffervergleich, vorhandene Messmethodik und fokussiertes Lint; kein erneuter Browserlauf für unveränderten Produktcode.

## Methode
Zwei getrennte serielle Node-Prozesse, sieben frische Szenen je Größe und Eingabeherkunft. Zwei bewegte Wände, 0/100/1000 zusätzliche Wände und je ein Fenster. Insgesamt größte Szene 1004 Wände/1002 Fenster. Owned-Snapshot-Erstellung liegt vor der Messung (Commit/Laden); mutable Kontrollen enthalten ihre notwendigen Prüfungen. Diese Eingabeherkünfte sind keine austauschbaren Optimierungsvarianten.

Je Lauf 168 Wand-/Fenster-Vollpfadvergleiche und 42 exakte Puffervergleiche bestanden. Zusätzlich 42 vollständige Flächen-/Volumen-/Bounds-Vergleiche im instrumentierten Gebäudephasenmesser. Instrumentierung in exklusiv angelegter temporärer Geschwisterdatei, danach entfernt; Produktquelle unverändert.

## Ergebnisse
Mediane in ms; produktnaher Owned-Pfad, jeweils Lauf 1 / Lauf 2:

| Zusätzliche Wände | Gebäudeaufbau | Erstpuffer | Aktionsvorbereitung A | Erste Komposition A | Wiederholung A | Wechsel B |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | 1,298 / 0,939 | 0,084 / 0,083 | 0,048 / 0,041 | 0,181 / 0,129 | 0,181 / 0,114 | 0,363 / 0,135 |
| 100 | 4,752 / 6,197 | 1,994 / 1,882 | 0,149 / 0,169 | 0,336 / 0,305 | 0,136 / 0,073 | 0,426 / 0,305 |
| 1000 | 45,806 / 36,805 | 26,741 / 20,844 | 1,889 / 1,379 | 4,267 / 3,587 | 0,126 / 0,127 | 3,578 / 3,584 |

Owned-Viewport-Abfrage im großen Fall 0,007 / 0,006 ms; Fensterbasis 2,694 / 3,859 ms. Mutable dagegen Abfrage 14,638 / 12,306 ms, Aktionsvorbereitung 16,255 / 18,345 ms: nicht durch Weglassen der Eingangsprüfung beschleunigen.

Separate instrumentierte Gebäudezerlegung, 1000 zusätzliche Wände mit Fenstern: Gesamt 36,935 ms; Wandloop ohne Fensterlookup 22,788 ms; Freeze 10,993 ms; Fensterlookup 0,469 ms; Anschlüsse 1,801 ms. Verschachtelte Phasen/Mediane nicht aufsummieren. Lookup ist jetzt lokale Map-Abfrage plus Transformation, nicht mehr globale Filtersuche; Mapaufbau liegt im Wandloop.

## Schluss und Grenzen
Größter belegter Abschnitt bleibt die kalte freie Wandextrusion. Nächster begrenzter Pilot: temporäre Arrays bei Flächentransformation und Bounds-Aktualisierung reduzieren, bei exakt gleicher Reihenfolge, Koordinaten, Normalen, Volumen und Bounds. Freeze/Ownership und endgültige Validierung erhalten. Keine pauschale Geometrievereinfachung oder Rendererumstellung. Der Pilot muss seinen Nutzen erst im Vorher-/Nachhervergleich beweisen.

Rohdaten: post-host-preview-results.json, post-host-preview-repeat-results.json, remaining-building-phase-results.json unter benchmarks. Reproduktion: cold-preview-profile.ts zweimal separat und building-phase-profile.ts über node --experimental-strip-types. Fokussiertes ESLint bestanden. Keine zusätzliche Vollsuite/Browserabnahme in diesem reinen Messschritt; PR411 hat die kombinierte funktionale Browserabnahme. Keine GPU-, Gesamtframe-, Native-, Langsession- oder Recovery-Freigabe. Feste Reihenfolge, JIT/GC/Systemlast und sieben Proben erlauben keine p95-Zusage. Keine gemessene Beschleunigung durch diesen PR, sondern aktueller Befund. Einziger aktiver Folgeauftrag: Masterplan §9.
