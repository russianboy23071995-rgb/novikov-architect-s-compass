# Auswahlgröße und stehende Anschlussnachbarn — 08.10.2026

PR176 nach Freigabe und grüner CI zusammengeführt, Basis main bd8a31a.
Dieser Schritt erweitert ausschließlich die Diagnose und dokumentiert Messungen;
keine Produktoptimierung und keine neue Aussage zur vollständigen Ruckelfreiheit.

## Reproduktion

npm run benchmark:browser, 1.000 Elemente, keine Bilder, kein T pair, kein
gehaltenes Shift. Selected walls erlaubt 20/100/200; für große Auswahl eine
passend große Fixture laden. Ungültige Auswahlgröße wird vor dem Lauf abgewiesen.
Load scenario; Rasterfang ausschalten; Profile movement. Drei Fälle: 20 Wände,
100 Wände, 100 Wände mit Dense connections. Der letzte Fall ergänzt 20 stehende
T-Nachbarn und reduziert die Linienanzahl entsprechend. Gesamtzahl jeweils 1.000.
Fenster folgen ihren ausgewählten Hosts, werden hier nicht explizit ausgewählt.
Bei 20/100 Wänden folgen 10/50 Fenster. Dense: 20 Grenz-T-Verbindungen lösen sich;
alle stehenden Nachbarn werden ebenfalls gegen den vollständigen Pfad geprüft.

## Ergebnisse

| Fall | Vorbereitung ms (2 Sitzungen) | Vorschau Median / p95 ms | Bestätigung ms |
| --- | --- | --- | --- |
| 20 Wände | 54,7 / 47,4 | 24,3 / 26,7 | 466,0 |
| 100 Wände | 52,8 / 38,6 | 44,9 / 72,7 | 435,8 |
| 100 Wände + 20 stehende Nachbarn | 46,6 / 41,0 | 53,7 / 66,3 | 393,4 |

Vorbereitung misst prepareTranslation, nicht die gesamte Auswahl-/Ursprungsgeste.
Vorschau: 21 sequenzielle Mausziele, inklusive React/DOM und mindestens zwei RAF.
Bestätigung: ein Platzierungsklick inklusive Rendering/RAF, keine Statistik.
Die kleineren Commitzeiten bei größerer Auswahl sind kein Skalierungsgesetz.
Keine Builds parallel; synthetische DOM-Ereignisse im Entwicklungsbrowser.
Navigator-Auswahl der einzelnen Wände liegt außerhalb der Zeitfenster und kann
selbst langsam sein. Keine Bilder, keine gemischten Auswahlen oder 3D-Messungen.
Die aktuelle Fenstergröße/ViewBox ist in jedem Rohbericht gespeichert.

Zusätzlicher Drucktest mit 240 Eingaben (angefragter Abstand 4 ms): mittlere lokale
Geometrievorschau 3,4 / 16,1 / 16,3 ms je Ziel; React gesamt je Eingabe
15,0 / 33,3 / 33,9 ms. Diese Phasen sind verschachtelt, nicht addieren.
Keine Vollprojektvalidierung/Materialisierung im kontinuierlichen Vorschaupfad.
Bei Bestätigung in jedem Fall genau eine Materialisierung und fünf erfasste
vollständige Validierungen über Aktion/History; Sicherheitsgrenzen bleiben erhalten.

[Rohberichte](selection-scale-2026-10-08/). Jeder Lauf besteht:
Vollpfadvergleich sämtlicher Wände, Fenster und Konturen, einschließlich der
stehenden Nachbarn; Shift halten/lösen, Tab, numerische Vorschau, Abbruch ohne
History, Mausplatzierung und genau ein Undo/Redo. Im Dense-Fall werden 220 Wände,
100 Fenster, 100 beibehaltene Eckverbindungen und null verbleibende T-Verbindungen
nach der Bewegung geprüft. Die 20 gelösten T-Verbindungen sind beabsichtigt.

651 Tests, Produkt-/Diagnose-TypeScript und Build bestanden; Lint 0 Fehler,
6 bekannte Warnungen. Keine neue Archicad-Abnahme in diesem Diagnoseauftrag.

## Entscheidung und genau ein Folgeauftrag

Die Vorbereitung ist für diese drei Fälle nicht der dominante Dauerpfad.
Die Vorschaukosten wachsen mit der betroffenen Wandmenge. Als nächster begrenzter
Pilot die wiederholte Wandkörper-/Konturableitung innerhalb der vorbereiteten
Auswahltranslation optimieren: translationsinvariante Ergebnisse nur innerhalb
der unveränderten Sitzung wiederverwenden, sofern fachlich nachweisbar.
Stehende Nachbarn, gelöste Anschlüsse, Fenster, endliche Maße und räumlich
hinzukommende Endpunkte dürfen nicht aus der Prüfung fallen. Gleichheit zum
vollen Pfad einschließlich Extremkoordinaten vor jeder Übernahme nachweisen;
volle Bestätigungs-/History-Prüfung bleibt. Dieselben drei Fälle vergleichen.
Kein pauschaler Cache, Rendererwechsel oder Umstellen anderer Werkzeuge.
