# Sitzungsgebundene Wandkörperableitung — 08.10.2026

Basis main 72fe814; PR177 nach Freigabe und grüner GitHub-CI zusammengeführt.

## Änderung und Sicherheitsgrenze

Die vorbereitete Auswahltranslation besitzt einen privaten Ableiter für lokale
Wandkörper. Pro Wand der feststehenden Abhängigkeitsmenge wird höchstens die letzte
Extrusion gespeichert. Wiederverwendung erfordert dieselben serialisierten lokalen
Profilkoordinaten, Höhe, Öffnungsrechtecke und Beschnittregel. Es gibt keine neue
Toleranz und keine pauschale Wiederverwendung allein aufgrund von IDs oder einer
angenommenen starren Bewegung. Rundungsbedingte Änderungen erzeugen einen Miss.

Konturen, Anschlussregeln, Fensterprüfung, Welttransformation, endliche Koordinaten
und fremde Endpunkte werden weiterhin pro Ziel geprüft. Stehende Nachbarn gehören
weiterhin zur Abhängigkeitsmenge. Die allgemeine Wandkörperableitung bleibt unabhängig
von dieser Sitzung. Alle Daten sind abgeleitet und wegwerfbar; keine zweite Modellkopie
als Wahrheit, kein UI-Cache und keine Änderung des Projektformats. Vollständige
Materialisierung und History-Validierung bei Bestätigung bleiben unverändert.

Geänderte Produktdateien: domain/project/prepared-translation.ts sowie
 domain/elements/wall/connections.ts und contour-solid.ts. Neue Regressionen stehen
in corner-solid.test.ts. movement-instrumentation.ts zählt zusätzlich tatsächliche
Extrusionen; die Messinstrumentierung gehört ausschließlich zur Diagnose.

## Vergleichsmessung

Gleicher Parcours wie [PR177-Messung](SELECTION_SCALE_PROFILE.md): 1.000 Elemente,
keine Bilder, Rasterfang aus, 20 bzw. 100 ausgewählte Wände; letzter Fall mit 20
stehenden T-Nachbarn. Entwicklungsbrowser, synthetische Mausereignisse, keine
parallelen Builds. Rohdaten: [drei Berichte](session-extrusion-2026-10-08/).

| Fall | Lokale Vorschau vorher → jetzt, Mittel ms | Gesamte Vorschau Median / p95 jetzt ms | Vorbereitung ms, zwei Sitzungen | Bestätigung ms |
| --- | --- | --- | --- | --- |
| 20 Wände | 3,4 → 1,7 | 31,0 / 53,0 | 68,0 / 59,1 | 512,4 |
| 100 Wände | 16,1 → 8,5 | 49,7 / 81,5 | 59,7 / 60,0 | 509,2 |
| 100 + 20 Nachbarn | 16,3 → 8,8 | 50,0 / 80,3 | 59,8 / 54,2 | 504,2 |

Lokale Vorschau: selection-preview im Drucktest mit 240 Eingaben. Tatsächliche
Extrusionen darin nur 68 / 142 / 168; kleine lokale Rundungsabweichungen werden
bewusst frisch berechnet. Gesamte Vorschau: 21 Ziele einschließlich React und zwei
RAF. Phasen sind verschachtelt und nicht addierbar. React-Mittel je Drucktesteingabe:
18,0 / 33,3 / 34,5 ms. Keine Vollprojektvalidierung oder Materialisierung im Drucktest;
Bestätigung weiterhin genau eine Materialisierung und fünf vollständige Validierungen.

**Begrenztes Ergebnis:** Die lokale Geometriephase ist günstiger. Die gesamte
Interaktionslatenz zeigt gegenüber PR177 keinen konsistenten Gewinn (dort Mediane
24,3 / 44,9 / 53,7 ms). Die getrennten Läufe sind kein kontrollierter alternierender
A/B-Test; Systemlast/JIT/Rendering können Zeitvergleiche beeinflussen. Die zusätzliche
Extrusionsmarkierung verursacht ebenfalls Diagnoseaufwand. Keine Behauptung,
dass das sporadische Shift-Ruckeln damit beseitigt oder praktisch abgenommen ist.

## Nachweise und praktische Abnahme

654 Tests bestanden. Produkt- und Diagnose-TypeScript, Build und Lint bestanden
(0 Fehler, 6 bekannte Warnungen). Drei neue Tests vergleichen Sitzung und frische
Ableitung bei Verschiebung, Profil-/Höhen-/Öffnungsänderungen, Beschnittwechsel,
mutiertem Rückgabewert und ungültigen Eingaben. Bestehende Vergleichstests behalten
Eck-/T-Teilmengen, stehende Nachbarn, fremde Endpunkte, Overflow und Modellkontext.

Alle drei Browserläufe bestehen den Vollpfadvergleich sämtlicher Wände, Fenster
und Konturen vor/nach Platzierung; Shift halten/lösen, Tab Länge/Winkel, numerische
Vorschau, Esc, Platzierung und genau ein Undo/Redo. Im Nachbarfall werden 220 Wände,
100 Fenster, 100 erhaltene Ecken und die erwartete Lösung aller 20 Grenz-Ts geprüft.
Dies ersetzt keine neue manuelle Archicad-Abnahme.

Praktisch: Zwei T-verbundene Wände mit zwei Fenstern auswählen, frei bewegen,
Shift halten und Maus weit aus der Richtung ziehen. Shift lösen, erneut halten,
mit Esc abbrechen; erneut bewegen und klicken. Ein Undo/Redo muss die gesamte
Bewegung zurücknehmen/wiederholen. Optional einen T-Nachbarn stehen lassen.

## Genau ein nächster Auftrag

Kontrollierter alternierender A/B-Browservergleich mit identischer Instrumentierung
für bisherige und sitzungsgebundene Ableitung: ursprüngliches T-Paar mit zwei Fenstern
unter gehaltenem Shift sowie 100 Wände. Lokale Geometrie und React/gesamte Latenz
getrennt auswerten, Vollpfad-/Undo-Nachweise erhalten. Damit vor weiteren Optimierungen
klären, ob und wo der lokale Gewinn im gesamten Eingabe-/Renderpfad verloren geht.
Keine Migration weiterer Werkzeuge und kein Rendererwechsel in diesem Auftrag.
