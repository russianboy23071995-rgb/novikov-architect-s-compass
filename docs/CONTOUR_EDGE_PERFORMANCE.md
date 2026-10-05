# Seitenstrecken: Performancekorrektur, 05.10.2026

Ausgangspunkt: 0b4da3c. Die Begrenzung pruefte wiederholt alle Kantenpaare.
Ein gemessener 200-Punkte-Fall verursachte 19.900 Ereignispaare und 109 vollstaendige
Konturvalidierungen; dieselbe Begrenzung wurde anschliessend im Vorschaupfad
nochmals angefordert.

## Aenderung

- Ausgangskontur einmal je Bearbeitung kopieren und vollstaendig pruefen.
- Nur die gewaehlte Seite und ihre beiden Nachbarkanten gegen den Rest pruefen.
  Bei 500 Punkten sind dies 1.494 statt 124.750 Paare fuer die Ereignissuche.
- Vollstaendige und inkrementelle Pruefung verwenden dieselben Kontaktpraedikate.
  Konservative Kantenrechtecke sparen unmoegliche Kontakte aus; die bestehende
  Modell-Metertoleranz bleibt unveraendert.
- Die Application teilt Vorbereitung und letztes Begrenzungsergebnis zwischen
  Fangaufloesung, Zahleneingabe und Konturvorschau. Neue Sessions erhalten eine
  neue Vorbereitung; kopierte Ergebnisse verhindern Cache-Mutation durch Aufrufer.
- Die vorhandene vollstaendige Modellvalidierung bleibt in Vorschau/Commit aktiv.
  Kein Ueberspringen von Modellpruefungen oder neuer UI-Sonderweg.

## Messung

Windows, Node v24.19.0. Regelmaessige und konkave radiale Konturen, Radius 10 m,
Seite 0, normale Zielverschiebung +/-0,1 m. Der alte Stand wurde mit drei,
der neue Benchmark mit sieben Aufrufen je Fall gemessen, jeweils Median.
Timingwerte sind lokale Diagnosewerte, keine automatischen Zeit-Grenztests.

| Punkte | Vorher: einzelner Cap-Aufruf, regelmaessig | Nachher: Cap inklusive Vorbereitung | Nachher: vorbereiteter Cap | Nachher: Application-Vorschau |
| --- | --- | --- | --- | --- |
| 100 | 163-166 ms | 2,7-3,5 ms | 2,1 ms | 3,0-7,4 ms |
| 200 | 650-713 ms | 3,9 ms | 2,8-3,1 ms | 6,5-7,5 ms |
| 500 | 4.031-4.163 ms | 12,2-13,1 ms | 7,3-7,5 ms | 27,8-29,0 ms |

Konkave 500-Punkte-Kontur: vorher 1.758-6.263 ms fuer den Cap; jetzt 3,7-8,9 ms
vorbereitet und 31,4-36,2 ms fuer die Application-Vorschau. Letztere umfasst
boundedEdgeTarget plus previewContourEdge mit Modellvalidierung, aber weder
vollstaendige Fangquellensuche noch React/SVG-Rendering oder Browser-Framezeit.
Ziele variieren pro Wiederholung, damit kein reiner Cache-Treffer gemessen wird.

Reproduzieren:

```sh
node --experimental-strip-types scripts/benchmark-contour-edge.mjs
npm test
npm run build
```

444 Tests bestanden, TypeScript und Build erfolgreich. Neue Tests: lineare Anzahl
relevanter Kantenpaare einschliesslich Schliesskante; inkrementelle/vollstaendige
Validierung fuer 1.440 deterministische Aenderungen; unveraenderliche Ausgangsdaten;
spitze und konkave Grenzen; Rueckbewegung; gespeicherte 500-Punkte-Grenzwerte;
Kontakte nahe der Toleranz und bei grossen Koordinaten; getrennte Sessions und
unveraenderte wiederverwendete Ergebnisse. Bestehende Tests sichern numerische
Vorschau, Commit, Undo und Projektdatei-Roundtrip fuer Schraffur/Polygon.

Zusaetzliche lokale Vergleichspruefung gegen den unveraenderten Code aus 0b4da3c:
2.000 Konturvalidierungen und 120 Cap-Ergebnisse stimmten exakt ueberein.

## Praktische Abnahme und Grenzen

Schraffur oder geschlossenes Polygon waehlen, eine Aussenkante anklicken und
Seitenstrecken starten. Bei Rechteck, spitzem Dreieck und konkaver Kontur weit
ueber die Grenze ziehen: Vorschau bleibt am letzten gueltigen Punkt. Wieder
zurueckziehen, per Zahleneingabe bestaetigen, Undo/Redo und Escape pruefen.
Eine Kontur mit mehreren hundert Punkten sollte nicht mehr sekundenlang blockieren.

Browser-Abnahme dieses Fixes steht noch aus. 28-36 ms Application-Zeit bei 500
Punkten ist kein Nachweis fuer 60 FPS. Ganze Projektvalidierungen, viele Elemente,
sehr viele Ereignisse und Rendering bleiben moegliche Kosten. Vollpruefung ist
weiterhin im Worst Case quadratisch; auch die Ereignis-/Probenzahl kann mit der
Kontur wachsen. Dieser Schritt verspricht keine allgemeine Echtzeitgarantie
fuer die maximal erlaubten 10.000 Punkte.
