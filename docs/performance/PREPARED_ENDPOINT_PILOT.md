# K04b: isolierter vorbereiteter T-Hauptwand-Endpunkt

08.10.2026, Basis main 910dcf7 nach grünem freigegebenem PR187.
Nur `benchmarks`/Tests/Dokumentation; keine produktive Interaktionsanbindung.

## Begrenzung und Wiederverwendung

Der Pilot besitzt eine einmal vollständig validierte, eingefrorene Kopie der
Basis. Er bestimmt die zusammenhängende Wandgruppe über vorhandene Eck-/T-
Beziehungen. Schneller Pfad ausschließlich für Endpunkt `end` einer T-Hauptwand,
exakt axiale Verlängerung und eine Gruppe ohne Eckanschlüsse. Kein Epsilon für
die Zulassung schräger Bewegungen. Fremde Wandendpunkte werden konservativ gegen
neuen Endpunkt und festen Start geprüft. Kontakt bedeutet Vollpfad; auch mögliche
Mehrfachknoten werden daher durch die bestehenden Regeln behandelt.

Die lokale Berechnung ruft dieselbe `updateWall`-Funktion inklusive Reconciliation
und Validierung auf, mit einer vorbereiteten Teilmenge von Wänden/Fenstern.
Es gibt keine zweite Anschluss-/Fensterlogik. Änderungen an Beziehungen lösen
ebenfalls den Vollpfad aus. Andere Daten sind auf der unveränderlichen Basis
unverändert; nur die geprüften Wandresultate werden für die Diagnose eingesetzt.
Die Teilmenge ist eine interne Berechnungsfixture, kein zweites editierbares
Projekt. Die bisherigen Schema-/Geometrieregeln bleiben maßgeblich.

Verkürzung, schräge Ziele, fehlende T-Hauptwand, Eckanschlüsse und fremde
Endpunktkontakte verwenden `updateWall` auf dem vollständigen Basisprojekt.
Ungültige Ziele dürfen weiterhin abgewiesen werden. `confirm` verwendet immer
die vollständige Operation; der normale Commit prüft erneut und führt History.

Der Pilot besitzt absichtlich noch keine produktive Revisions-/Auswahlbindung.
Änderungen am ursprünglichen Aufruferobjekt verändern seine eigene Basis nicht.
Vor Produktintegration muss eine veraltete Sitzung abgewiesen werden; der Pilot
darf deshalb nicht direkt als allgemeine UI-Commit-Funktion verwendet werden.

## Nachweise

674 Tests bestanden; Produkt-/Diagnose-Typechecks, Build und Lint erfolgreich
(sechs bekannte Fast-Refresh-Warnungen). Vier neue Tests prüfen:

- Unverändertes Ziel und Verlängerungen: lokale Vorschau gleich Vollpfad,
  vollständige Nachvalidierung, Fenster/Nachbarn, Bestätigung, Undo/Redo/No-op.
- Verkürzung mit gelöster Verbindung, schräge/ungültige Ziele: gleiche Annahme
  beziehungsweise Ablehnung und identisches Ergebnis im Rückfallpfad.
- Ein/zwei fremde Endpunkte: Rückfall auf bestehende Eck-/Mehrfachanschlussregeln.
- Eigene Basis und eingefrorene Ergebnisse verhindern Veränderung späterer Vorschauen.

Browser: `/benchmarks/prepared-endpoint.html` → „Vergleich starten“.
K04/K03-Fixtures mit 100/1.000 Elementen, 30 Ziele je Fall, alternierende Reihenfolge.
Jeder lokale Zustand wird gegen Vollpfad und anschließende vollständige Validierung
geprüft. Beide Fälle bestehen mit genau zwei betroffenen Wänden; unbeteiligte
T-Gruppen verbleiben in der Basis. [Rohdaten](prepared-endpoint-2026-10-08.json).

| Elemente | Vorbereitung | Vollpfad Median / p95 | Lokal Median / p95 | Vollständige Bestätigung |
|---|---:|---:|---:|---:|
| 100 | 6,2 ms | 3,5 / 4,8 ms | 0,4 / 0,7 ms | 10,9 ms |
| 1.000 | 14,2 ms | 9,45 / 11,0 ms | 0,4 / 0,7 ms | 29,4 ms |

Ein lokaler Lauf; Vorbereitung und Bestätigung jeweils Einzelwerte. Zeiten
beinhalten keine UI-, Fang-, React- oder Renderer-Latenz. Kein Nachweis, dass
sporadisches Shift-Ruckeln behoben wäre. Keine Garantie für beliebig große
zusammenhängende Wandgruppen oder alle Wandbearbeitungen.

## Genau ein nächster Auftrag

**K04c: diesen begrenzten Pfad in die gemeinsame Endpunkt-Interaktion integrieren.**
Pilot in die zuständige Application-Vorbereitung überführen, an stabile Sitzung,
Projektbasis und Auswahl binden. Gemeinsame Vorschau-/ToolInteraction-Infrastruktur
nutzen; bei nicht unterstützten Zielen unverändert Vollpfad. Abbruch darf nichts
übernehmen; Bestätigung aktuelle Basis prüfen, vollständig validieren und einen
Undo-Schritt erzeugen. Praktischen Maus-/Shift-/Renderer-Test für freie und
T-Wände durchführen. Keine zweite Interaktionsengine und keine Erweiterung des
schnellen Geltungsbereichs in demselben Schritt. Andere K-/V-Ziele bleiben offen.
