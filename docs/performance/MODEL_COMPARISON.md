# K05b: strukturierter Modellvergleich

08.10.2026; PR185 nach grüner CI zusammengeführt, Basis main 2a98213.

Der zusätzliche Vergleich ohne `bimVisibility` nutzt jetzt einen gemeinsamen
Vergleicher in `src/domain/project/model-equality.ts`. Er läuft nach den
unveränderten Projektprüfungen und ersten Serialisierungen/Größenprüfungen.
Nur die zwei weiteren Modell-Serialisierungen entfallen. Keine Änderungen an
Validierung, Dateiformat, Limits, Undo/Redo oder dem ersten No-op-Vergleich.

Geltungsbereich: schema-geprüfte einfache Projektdaten mit endlichen Zahlen,
dichten Arrays und ohne `toJSON`. Gleiche Objektreferenz kann sofort gleich sein;
andere Assetobjekte werden nach tatsächlichen Feldern verglichen, nie nur nach ID.
Arrayreihenfolge und serialisierte Schlüsselreihenfolge bleiben relevant;
optionale `undefined`-Objektfelder werden wie bei JSON ausgelassen. -0 und 0 sind
gleich. Das ist kein allgemeiner Vergleicher für beliebige JavaScript-Objekte.

## Nachweis

670 Tests bestanden; Produkt-/Diagnose-Typechecks und Build bestanden; Lint ohne
Fehler, sechs bestehende Fast-Refresh-Warnungen. Neue Tests vergleichen paarweise
mit dem bisherigen JSON-Orakel: unveränderte/geklonte Projekte, Sichtbarkeit,
Linienfarbe, geänderte/entfernte Assets, Unicode, optionale Felder, Schlüsselreihenfolge
und -0. Commit-No-op, Sichtbarkeit ohne Modell-History, ein Modell-Undo-Schritt,
Undo/Redo und Ablehnung beschädigter Assets sind abgedeckt. Bestehende Datei-
größen-/Handle-Tests laufen weiterhin mit.

Browser: `/benchmarks/commit-profile.html` → „Messung starten“. Der alte zerlegte
JSON-Pfad bleibt ausdrücklich als Diagnosebaseline bestehen. Jede Probe vergleicht
vollständige History und No-op-Identität mit dem neuen produktiven Commit.
20 Proben je Fall, alternierende Reihenfolge, dieselbe K03-Dreibild-Fixture.
[Einzelproben und Rohresultat](model-comparison-2026-10-08.json).

| Fall | JSON-Baseline Median / p95 | Neuer Commit Median / p95 |
|---|---:|---:|
| Modelländerung | 54,75 / 80,20 ms | 45,55 / 48,50 ms |
| No-op | 44,00 / 54,80 ms | 44,10 / 56,20 ms |
| Sichtbarkeit | 50,05 / 60,90 ms | 45,80 / 52,00 ms |

Alle 60 Ergebnisse gleich. No-op erreicht den zweiten Vergleich nicht; daher
kein erwarteter Gewinn. Ein lokaler gepaarter Lauf, keine allgemeine Kapazitäts-
oder FPS-Garantie. Die Baseline enthält kleine Diagnose-Zeitmessaufrufe; Zahlen
sind keine isolierte CPU-Zyklusmessung. Nicht mit älteren Läufen auf anderer Last
zu einem vermeintlichen Gesamtfaktor verrechnen. Kein Nachweis zu Spitzen-RAM.

Praktisch: Linie ändern → Undo/Redo, Ebenen aus-/einblenden → Modell-Undo prüfen.
Sichtbarkeit darf weiterhin keinen Modell-History-Eintrag erzeugen. Projekte mit
Bildreferenzen speichern und wieder öffnen; Daten und Referenzen bleiben gleich.

## Genau ein nächster Auftrag

**K04a: Wandendpunkt-Vorschau gezielt vermessen.** Einzelne freie Wand und
verbundene T-Wand mit Fenstern bei 100/1.000 Elementen bewegen; Vorbereitung,
Pointer-Vorschau und Bestätigung getrennt erfassen. Gemeinsame Fang-/Shift-
Interaktion einbeziehen, ohne die abgeschlossene Auswahlbewegungsstudie neu zu
starten. Aus dem Befund genau einen Anschluss an bestehende gemeinsame Vorschau-
Infrastruktur ableiten; noch kein neuer Werkzeug-/Renderer-Umbau. Das adressiert
den nächsten dokumentierten K04-Verbraucher. Übrige K-/V-Ziele, Assetkapazität und
noch offene Shift-Diagnose bleiben erhalten.
