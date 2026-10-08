# K06b: Bewegung einer freien Kettenendwand

08.10.2026. PR195 nach gruener CI zusammengefuehrt. Isolierter Pilot, keine
produktive Anbindung.

## Einfachere Loesung mit bestehender Vorbereitung

Die einzelne Endwand hat genau einen Eckanschluss. Beim Bewegen wird dieser
nach bestehender Regel geloest. Der Pilot bereitet diesen abgeleiteten Zustand
einmal vollstaendig vor und verwendet darauf dieselbe prepareTranslation-Funktion.
Deren Berechnungsumfang umfasst nun eine Wand; stationaere Waende/Fenster/
Restanschluesse stammen aus der eigenen stabilen Basis. Keine neue Eck-, Fenster-
oder Extrusionslogik. Bestaetigung ueber den bisherigen voll pruefenden Pfad.

Unterstuetzt: einzelne Endwand mit einem Eckanschluss, keine T-Relationen,
keine Knoten mit mehr als zwei Eckrelationen. Innere Waende/T-Faelle bleiben
Vollpfad. Nullbewegung liefert urspruenglichen verbundenen Zustand, kein
versehentliches Loesen. Fremde belegte Endpunkte prueft die bestehende Vorbereitung.

## Nachweise und Kosten

692 Tests bestanden; Diagnose-Typecheck und gezielter Lint bestanden.
Vier neue Tests: vollstaendiger Modell-/Solidvergleich samt Fenstern/Nachbarn und
History; fremde belegte Endpunkte/ungueltige Deltas; T-/Innenwand-Fallback;
eigene Basis und eingefrorenes Ergebnis. Der alte Oracle setzt optionales
lines:undefined explizit; Testvergleich normalisiert nur diese JSON-equivalente
Darstellungsdifferenz.

60 alternierende Browservergleiche (25/100 verbundene Waende) bestanden:
Pilotmodelle gegen vollstaendig validierende Aktion, bewegte Waende gegen
bisherige vorbereitete Auswertung. 25 Waende: Median 1,40 ms -> unter 0,1 ms;
100 Waende: 4,30 ms -> unter 0,1 ms. Gemeldeter Median 0 bedeutet Timerauflösung,
nicht kostenlose Berechnung. p95 Pilot jeweils etwa 0,1 ms.
[Rohdaten](chain-move.json); Feld full bezeichnet hier den bisherigen vorbereiteten
Bewegungspfad, nicht die volle Validierung.

Einmalige Vorbereitung 29/68,6 ms. Der isolierte Pilot baut sowohl alte als auch
abgetrennte Vorbereitung auf; das darf nicht unveraendert als doppelte produktive
Vorbereitung uebernommen werden. Nicht gemessen: Renderer, DOM, Framezeit und
praktisches Shift-Ruckeln. Produktionscode unveraendert, Build nicht wiederholt.

Reproduktion: /benchmarks/prepared-chain-move.html im Diagnose-Vite,
Vergleich starten, zwei equivalent:true-Ergebnisse.

## Genau ein Folgeauftrag

K06c: den belegten Fall innerhalb der bestehenden prepareTranslation integrieren,
mit einer gemeinsamen Basispruefung und klar getrenntem stationaeren/geaenderten
Berechnungsumfang. Ausgabe-/Renderervertrag und vollstaendige Bestaetigung erhalten;
Abbruch, Nullbewegung, Kontextwechsel, Fremdendpunkte und ein Undo pruefen.
Vorbereitung und Canvas-Ablauf nachmessen, keine pauschale T-/Gruppen-Ausweitung.
