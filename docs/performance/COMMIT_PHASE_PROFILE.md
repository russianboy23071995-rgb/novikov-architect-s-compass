# K05a: Commit-Arbeit nach Asset-Integration

08.10.2026, Basis main bf244dd, PR184 nach grüner CI zusammengeführt.
Nur Diagnose und Dokumentation; produktiver Commit unverändert.

## Methode

`/benchmarks/commit-profile.html` → „Messung starten“. Gleiche K03-Fixture mit
1.000 Elementen und drei synthetischen PNG/JPEG-Importen, jetzt mit produktiven
Asset-Handles. 20 Stichproben je Fall: wechselnde Linienfarbe, No-op mit demselben
Projektobjekt, wechselnde Ebenensichtbarkeit.

Eine ausdrücklich diagnostische Kopie der aktuellen Commit-Schritte misst die
Phasen. Auf **jeder** Stichprobe wird ihr vollständiges History-Ergebnis und
No-op-Identitätsverhalten mit dem echten `commitProject` verglichen. Reihenfolge
echter/zerlegter Messung alterniert. Ergebnisvergleich läuft außerhalb der Zeiten.
Die Diagnose muss bei Änderungen der Commit-Struktur angepasst werden; sie ist
keine zweite produktive History. Ein lokaler Browserlauf, keine plattformübergreifende
Garantie. Keine parallelen Builds während des Laufs. Kein RAM-/GPU-/FPS-Nachweis.
[Rohdaten einschließlich Einzelproben](commit-profile-2026-10-08.json).

## Befund (Millisekunden)

| Fall | Echter Commit Median | p95 | Neue History-Einträge |
|---|---:|---:|---:|
| Modelländerung | 68,95 | 90,50 | 20 |
| No-op | 57,85 | 68,70 | 0 |
| Sichtbarkeit | 67,15 | 85,40 | 0 |

Phasenmediane bei Modelländerung:

| Arbeit | Median |
|---|---:|
| Prüfung neuer / bisheriger Zustand | 12,50 / 10,95 |
| Serialisierung neuer / bisheriger Zustand | 6,75 / 6,10 |
| Größenprüfung neuer / bisheriger Zustand | 9,60 / 9,05 |
| Zusätzliche Serialisierung beider Modelle ohne Sichtbarkeit | 6,55 / 6,70 |
| Stringvergleich / History-Verwaltung | jeweils rund 0 |

Die Summe einzelner Mediane ist nicht der Median der Gesamtlaufzeit. Die bestehende
Größenprüfung kodiert den gesamten JSON-String als UTF-8; deren Messwert umfasst
auch diese Arbeit und Allokation. Kein Beleg, dass das Vergleichen der Strings
selbst oder das Hinzufügen eines History-Eintrags der Engpass wäre. Die Phase
„bisherige Validierung“ bleibt trotz Herkunft aus History aktuell vollständig;
keine pauschale Abschaltung ohne eigenen Unveränderlichkeitsnachweis.

## Abnahme

Alle 60 Fälle stimmen mit dem produktiven Ergebnis überein (`equivalent: true`).
667 vorhandene Tests bestanden, Produkt-/Diagnose-Typechecks und Build erfolgreich,
Lint ohne Fehler bei sechs bestehenden Fast-Refresh-Warnungen. Keine neuen
Produktfunktionen; CAD-Bedienung bleibt unverändert.

## Genau ein nächster Auftrag

**K05b: den zusätzlichen Modellvergleich ohne zwei JSON-Serialisierungen pilotieren.**
Ein gemeinsamer strukturierter Vergleich muss dieselbe Entscheidung treffen wie
der bisherige Vergleich ohne `bimVisibility`. Identische unveränderliche Assets
dürfen direkt gleich sein; veränderte/andere Inhalte dürfen nicht über IDs allein
gleichgesetzt werden. Vollständige Projektprüfungen, erste Serialisierungen und
Dateigrößenprüfungen bleiben bestehen. Gegen den alten Pfad prüfen: No-op,
Sichtbarkeit, Modelländerung, geänderte Assets, Undo/Redo und Größenfehler.
Mit gleicher Fixture messen, keine vorab garantierte Beschleunigung. Erst nach
Äquivalenznachweis produktiv ersetzen. Kein History-/Formatumbau und keine weitere
Optimierung gleichzeitig. Übrige K-/V-Wünsche und Shift-Diagnose bleiben offen.
