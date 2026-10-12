# K04g: zweiter rechtwinkliger Wandabschnitt

08.10.2026. PR192 nach gruener CI zusammengefuehrt. Isolierter Pilot in benchmarks,
keine produktive Anbindung und keine geaenderte CAD-Bedienung.

## Begrenzung

Eigene voll gepruefte, eingefrorene Kopien von Basis und Kettenvorschau. Genau ein
vorheriger Abschnitt, zwei passende Punkte, keine Anschluesse/Fenster an dieser
Wand, kein T-Start. Nur exakt rechtwinkliges Ziel. Der kleine Berechnungsumfang
verwendet appendWallChain samt existierenden Eckregeln. Bestehende fremde Wände,
Fenster und Anschluesse werden aus der stabilen Basis uebernommen.

Kandidaten, Fremdendpunktkontakt, ID-Kollision, schraege Ziele und spaetere
Kettenabschnitte verwenden den Vollpfad. Bestaetigung immer Vollpfad; die ganze
Kette bleibt ein Undo-Schritt. Keine duplizierte Geometrieformel fuer Ecken.
Vor UI-Anbindung sind Sitzungs-/Basisbindung und Folgepunktwechsel erforderlich.

## Nachweis

687 Tests bestanden. Fuenf neue Tests: links/rechts rechtwinklig mit kompletter
Projektvalidierung und History; schraeg/degeneriert/nicht endlich/IDs; Kandidaten
und Folgeabschnitt; eigene unveraenderliche Daten; gezielter Fremdendpunktkontakt.
Diagnose-Typecheck und gezielter Lint bestanden. Produktionscode unveraendert;
Build aus PR192 nicht nochmals ausgefuehrt.

60 alternierende Browservergleiche (30 pro Groesse) identisch zum Vollpfad und
jeweils erneut voll validiert. 100 Elemente: Median 3,65 -> 0,30 ms, Vorbereitung
9,3 ms. 1.000 Elemente: 10,10 -> 0,30 ms, Vorbereitung 24,3 ms. Ein lokaler Lauf,
Timeraufloesung beachten. [Rohdaten](chain-corner.json).
Kein DOM-/Renderer-/Frame-Nachweis; sporadisches Shift-Ruckeln bleibt offen.

Wiederholen: /benchmarks/prepared-chain-corner.html im Diagnose-Vite oeffnen,
Vergleich starten; zweimal equivalent:true erwartet.

## Genau ein Folgeauftrag

K04h: Diesen begrenzten zweiten rechtwinkligen Abschnitt zentral in der bestehenden
Zeichensitzung anbinden. Kein weiterer Werkzeugcache. Kontextwechsel, Abbruch,
Drittabschnitt und Kandidaten behalten gesicherte Vollpfadgrenzen; eine gesamte
Kette pro Undo. DOM-Ablauf pruefen, keine gleichzeitige Ausweitung auf freie Winkel.
