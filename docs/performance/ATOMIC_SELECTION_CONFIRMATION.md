# Atomare Auswahlbestätigung — 08.10.2026

Basis: main db17289, PR175 zusammengeführt. Begrenzter Folgeauftrag des Piloten.

## Änderung

Die gemeinsame ToolInteraction darf eine atomare `confirm`-Aktion anbieten.
confirmInteraction ruft diese exklusiv auf; bestehende Adapter behalten
validate + commit. Nur Auswahlbewegung nutzt den neuen Weg. Sie verwirft die
Vorschau, prüft den gebundenen Kontext, materialisiert/validiert frisch und ruft
die geschützte Veröffentlichung auf. Direkter commit verwendet dieselbe Funktion.
Explizites validate bleibt kompatibel und vollständig; kein Cache zwischen
Validierung und Commit und kein zweiter Modellzustand. Die History-Prüfung und
der latest-Kontextschutz in useSelectionMove bleiben unverändert.

## Messung

Diagnoseharness erfasst Vorbereitung und abschließende Mausbestätigung getrennt.
T-Paar mit zwei explizit ausgewählten Fenstern; identischer Ablauf vorher/nachher,
Rasterfang für diese Messung aus. Der erste Versuch mit Rasterfang brach ab, weil
zwei nahe Mauspositionen dasselbe Rasterziel ergaben und deshalb keine neue
selection-preview-Phase entstand. Kein Produktfehler: der Harness verlangte eine
neue Phase pro Position. Die erfolgreichen Vergleichsläufe verwenden unterschiedliche
ungefangene Zielpunkte und sind als solche begrenzt.

| Größe | Vorher | Nachher |
| --- | ---: | ---: |
| Vorbereitungen (ms, zwei Sitzungen) | 1,2 / 0,8 | 0,8 / 0,8 |
| Materialisierungen beim Bestätigen | 2 | 1 |
| Materialisierung gesamt (ms) | 4,9 | 1,8 |
| Vollvalidierungen im gemessenen Bestätigungsfenster | 7 | 5 |
| Bestätigung inkl. Rendern/zwei RAF (ms) | 40,5 | 33,0 |

[Rohberichte](atomic-confirmation-2026-10-08/). Einzelmessungen, keine statistische
Latenzgarantie und kein Beleg für Ruckelfreiheit während der Mausbewegung.
Phasen sind verschachtelt und dürfen nicht addiert werden. Die reduzierte
Materialisierungszahl ist der strukturelle Nachweis. Verbleibende vollständige
Prüfungen sind bewusst erhalten. Der Browserharness fordert jetzt genau eine
Materialisierung und mindestens eine volle Modellvalidierung bei Bestätigung.

651 Tests bestanden. Neue Tests: atomarer Zweig wird exakt einmal aufgerufen,
Fehler fallen nicht in den Legacy-Weg durch; ungültige Koordinaten, mutierter
Modell-/Auswahl-/Ursprungskontext verhindern Veröffentlichung; fehlgeschlagene
Veröffentlichung propagiert und spätere Bestätigung validiert erneut. Bestehende
Tests sichern einen History-Schritt, Undo/Redo, unveränderte Basis, Vorschau-
Isolation, Verbindungen, Nachbarn und fremde Endpunkte. Produkt-/Diagnose-Types,
Build erfolgreich; Lint 0 Fehler/6 bekannte Warnungen.
Browser: vollständiger Geometrievergleich, Shift halten/lösen, Tab, numerische
Vorschau, Abbruch, Mausplatzierung und ein Undo/Redo bestanden.

## Praktische Abnahme und nächster Auftrag

Zwei T-verbundene Wände mit Fenstern auswählen, frei bewegen, wahlweise mit Tab
Winkel/Länge eingeben, platzieren. Ein Undo muss die gesamte Auswahl zurücksetzen,
ein Redo sie vollständig wiederherstellen. Escape darf keinen History-Eintrag erzeugen.

Danach die bereits vorbereitete Auswahlbewegung an großen betroffenen Mengen und
vielen stehenden Anschlussnachbarn vermessen: Vorbereitung, Vorschau und Bestätigung
getrennt ausweisen. Erst anhand dieses Ergebnisses den nächsten Consumer oder
Engpass wählen; keine pauschale Migration aller Werkzeugvorschauen.
