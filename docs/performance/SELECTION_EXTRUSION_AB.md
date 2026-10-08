# Auswahlbewegung: paarweiser A/B-Vergleich — 08.10.2026

Basis main dcb19e8; PR178 mit Freigabe und bestandener CI zusammengeführt.
Dieser Auftrag ändert ausschließlich die Diagnose. Produktcode und Modellregeln
bleiben unverändert.

## Aufbau und Reproduktion

`npm run benchmark:browser`, `/benchmarks/browser.html`. Der Diagnose-Schalter
**Extrusion** gilt für **Profile movement**. A = Fresh baseline, B = Session reuse.
Der Vite-Diagnosetransform wählt beim Erstellen der vorbereiteten Sitzung entweder
den frischen lokalen Ableiter oder den Produkt-Ableiter mit Sitzungscache. Die
Entscheidung bleibt für diese Sitzung fest. Beide Wege verwenden dieselbe
Instrumentierung und dieselben Anschluss-/Kontur-/Weltkoordinatenprüfungen.
Der Schalter ist kein Produkt-Feature und wird nicht in den Produktbuild importiert.

Zwei Fälle, jeweils Reihenfolge A1, B1, B2, A2 (AB, danach umgekehrt BA):

- T pair: zwei T-verbundene Wände und zwei ausdrücklich ausgewählte Fenster.
- 1.000 Elemente, Selected walls 100: 100 Wände mit 50 folgenden Fenstern,
  keine Bilder, keine zusätzlichen stehenden T-Nachbarn.

Je Lauf: Modus wählen, Load scenario, Rasterfang ausschalten, Hold Shift an,
Profile movement. Repeat Shift bleibt aus (keine synthetische Tastenwiederholung).
240 kontinuierliche Eingaben, 21 sequenzielle Ziele, Vollpfadvergleich, Shift lösen/
halten, Tab Länge/Winkel, numerische Vorschau, Esc, Platzierung, ein Undo/Redo.
Keine Builds oder Tests parallel zur Messung. Gleicher Browserprozess und dieselbe
Instrumentierung; keine unabhängigen Kaltstartversuche oder statistische Laststudie.

**Fenstergröße:** t-A1/B1 laufen bei 1280×720, t-B2/A2 bei 1838×1266.
Die Oberfläche hat zwischen den Paaren ihre Größe geändert. Daher nur innerhalb
des jeweiligen Paars vergleichen, keine gepoolte T-Paar-Zeit. Alle großen Läufe
laufen bei 1838×1266. ViewBox, 21 Mausziele und Vollpfad-Zählwerte wurden innerhalb
jedes A/B-Paars auf Gleichheit geprüft. Rohdaten enthalten die genauen Werte.

## Ergebnisse

Lokale Geometrie und React: Mittel je Eingabe im kontinuierlichen Lauf. Gesamte
Vorschau: Median/p95 der 21 sequenziellen Ziele, einschließlich zwei RAF;
p95 als sortierter Wert Index 19. Phasen sind verschachtelt, nicht addieren.
Extrusionen: tatsächliche Aufrufe im kontinuierlichen Lauf.

| Lauf | Lokale Geometrie ms | React ms | Gesamte Vorschau Median / p95 ms | Extrusionen |
| --- | --- | --- | --- | --- |
| t-a1 | 0.51 | 13.48 | 22.6 / 27.4 | 480 |
| t-b1 | 0.36 | 12.48 | 24.3 / 46.3 | 190 |
| t-b2 | 0.22 | 9.36 | 19.4 / 35.2 | 82 |
| t-a2 | 0.45 | 9.35 | 17.6 / 22.3 | 480 |
| large-a1 | 10.06 | 25.45 | 39.1 / 64.5 | 24000 |
| large-b1 | 3.28 | 19.38 | 32.6 / 37.0 | 327 |
| large-b2 | 3.44 | 19.94 | 28.9 / 32.9 | 327 |
| large-a2 | 12.44 | 34.61 | 49.6 / 84.6 | 24000 |

[Rohberichte](extrusion-ab-2026-10-08/).

## Bewertung

Bei 100 Wänden reduziert die Wiederverwendung in beiden Paaren lokale Berechnung,
React-Zeit und Gesamtvorschau. Die Geometriephase fällt von 10,06 auf 3,28 bzw.
12,44 auf 3,44 ms; die Gesamtlatenz-Mediane von 39,1 auf 32,6 bzw. 49,6 auf 28,9 ms.
Die breite Streuung verbietet ein allgemeines Prozent-/FPS-Versprechen.

Beim kleinen T-Paar sinkt die lokale Berechnung ebenfalls, aber nur um etwa
0,15–0,23 ms. Die Gesamtvorschau wird in diesen Paaren nicht schneller. React
liegt bei 9–13 ms je Eingabe und umfasst wesentlich mehr als die lokale Geometrie.
Damit ist weitere Extrusionsoptimierung kein belegter Hebel für das ursprünglich
gemeldete kleine Shift-Szenario. Die Messung identifiziert noch keinen einzelnen
React-Verursacher; sie rechtfertigt keinen Rendererwechsel. Hardwareeingaben,
Compositor-/GPU-Latenz und das sporadische Nutzerproblem sind nicht vollständig
reproduziert. Gehaltenes synthetisches Shift ersetzt keine manuelle Abnahme.

Alle acht Läufe bestehen Vergleich von Wänden, Fenstern und Konturen gegen den
vollständigen Pfad, Shift/Tab, numerische Vorschau, Abbruch und ein Undo/Redo.
Im T-Paar bleibt eine T-Verbindung erhalten; im großen Fall 100 Eckverbindungen.
Keine Vollprojektprüfung im kontinuierlichen Vorschaupfad; bei Bestätigung jeweils
eine Materialisierung. Vollständige Commit-/History-Prüfung bleibt unverändert.
654 Tests, beide TypeScript-Prüfungen, Build und Lint bestanden (6 bekannte Warnungen,
keine Fehler). Keine neue IFC-/Archicad-Abnahme in diesem Diagnoseauftrag.

## Genau ein nächster Auftrag

Den React-Anteil des T-Paars unter gehaltenem Shift im Diagnoseharness nach
Unterbäumen aufschlüsseln (Canvas/BimPlan, Hilfseingabe, Shell/Navigator). Mit
identischem Parcours feststellen, welcher Bereich unnötige Arbeit wiederholt.
Erst nach diesem Nachweis maximal einen verantwortlichen Bereich begrenzt entlasten;
Vollpfadvergleich, Shift/Tab/Abbruch und genau ein Undo erhalten. Kein Rendererwechsel,
keine Modellkopie und keine breite Migration anderer Werkzeuge.

Praktische Prüfung bleibt: T-Paar mit zwei Fenstern auswählen, frei bewegen,
Shift halten/lösen, weit vom Ursprung bewegen; abbrechen und anschließend eine
Bewegung platzieren und einmal rückgängig machen. Spürbare Hänger weiterhin über
die manuelle Diagnose aufnehmen.
