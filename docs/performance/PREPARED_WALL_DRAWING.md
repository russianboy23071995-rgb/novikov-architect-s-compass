# K04e: vorbereiteter erster Wandabschnitt

08.10.2026. PR190 nach gruener CI zusammengefuehrt. Isolierter Benchmark-Pilot,
keine produktive Anbindung und keine Aenderung der CAD-Bedienung.

## Vertrag

Eigene vollstaendig gepruefte, eingefrorene Basis und kopierter Ursprung.
Erster freier Abschnitt wird durch die bestehende appendWallChain/addWall-Aktion
in einem leeren Berechnungsumfang mit denselben Ebenen validiert. Nur die neue
Wand wird zur stabilen Basis hinzugefuegt. Vorhandene Geometrie, Fenster,
Anschluesse, Referenzen und Assets bleiben erhalten. Keine zweite Fachlogik.

Jeder Fangkandidat, kompatible vorhandene Achsendpunkte an Start/Ziel und
kollidierende (auch normalisierte) IDs fuehren zum Vollpfad. Ungueltige Geometrie
wird weiter vom bestehenden Validator abgewiesen. Bestaetigung immer Vollpfad.
Nur erster Abschnitt ohne T-Startkandidat; kein Vertrag fuer weitere Abschnitte.
Der Pilot darf erst nach Sitzungs-/Kontextbindung produktiv verwendet werden.

## Nachweise

681 Tests bestanden. Vier neue Tests: Vollpfadvergleich mit Nachbarn/Fenstern,
Kontakte/nahe Endpunkte/IDs/ungueltige Ziele, unveraenderliche eigene Basis und
Ursprung, expliziter T-Kandidat mit gleicher Anschlussaktion. Ein Undo und Redo
fuer Bestaetigung geprueft. Diagnose-Typecheck und gezielter Lint bestanden.
Produktionscode unveraendert; dessen Build aus PR190/189 nicht erneut ausgefuehrt.

60 Browservergleiche (je 30 fuer 100/1.000 Elemente) mit wechselnder Reihenfolge:
alle Ergebnisse identisch zum Vollpfad und erneut vollstaendig validiert.
Letzter Lauf: 100 Elemente Median 3,10 -> 0,10 ms, Vorbereitung 6,4 ms;
1.000 Elemente 9,50 -> 0,10 ms, Vorbereitung 30,6 ms. Erster Lauf zuvor:
3,75 -> 0,10 und 10,60 -> 0,20 ms. Timeraufloesung beachten, keine exakten
Beschleunigungsfaktoren ableiten. Fang, DOM und Renderer nicht mitgemessen.
Rohdaten: [letzter Lauf](prepared-wall-drawing.json).

Reproduktion: Diagnose-Vite, /benchmarks/prepared-wall-drawing.html,
Vergleich starten. Zwei equivalent:true-Ergebnisse erwartet.

## Naechster begrenzter Auftrag

K04f: Den geprueften ersten freien Abschnitt zentral an die Zeichensitzung
anbinden. Basis-/Ursprungsbindung, Abbruch, Werkzeugwechsel und naechsten
Kettenpunkt absichern. Folgeabschnitte und Kandidaten behalten den Vollpfad.
Volle Bestaetigung, gesamte Kette als ein Undo; DOM-Maus-/Shift-Ablauf pruefen.
