# Versatz-Befehl ohne Serialisieren (26.10.2026)

Änderungskarte „Versatz-Befehl ohne Serialisieren“ mit den Empfehlungen freigegeben: Offset direkt im gemeinsamen Befehlsweg, `lib/bim/commands.ts` entfernen, keine Browser-Messung (der Befehl läuft nicht im Schullauf).

## Befund

Der Text-/Sprachbefehl „Offset um 20 cm“ (geschlossene Polylinie oder Schraffur) lief als letzter Befehl über `lib/bim/commands.ts`:

- `previewCommand` serialisierte bei jeder Vorschau das ganze Projekt einschließlich aller Bilder als Vergleichstext, den der Programmweg nie nutzte.
- Das Ergebnis war kein eigener, geprüfter Projektstand; „Übernehmen“ führte deshalb den ganzen Befehl erneut aus (zweite Serialisierung, zweite Berechnung).
- `applyCommand` (zwei weitere Serialisierungen) wurde nur noch von Tests verwendet.

## Umsetzung

- **V1** `application/commands/selection-command.ts` ruft `previewOffsetCommand` (`application/drawing/offset-command.ts`) direkt auf, wie Tür-, Fenster- und Wandbefehle. Grammatik, Begrenzung, Zusammenfassung und die Meldung „Unbekannter Befehl …“ sind wortgleich. `lib/bim/commands.ts` und sein Test entfallen; die drei Architektur-Ausnahmen dazu sind gestrichen.
- **V2** `previewOffsetCommand` liefert über `validateLike` bei eigenem Eingangsstand einen eigenen, geprüften Projektstand; `applySelectionCommand` übernimmt ihn ohne zweite Berechnung (wie seit PR461 für die übrigen Befehle).

## Nachweis

- `src/application/drawing/offset-command.test.ts` (aus `lib/bim/commands.test.ts` übernommen, jetzt über den gemeinsamen Befehlsweg): beide 2D-Arten, Einheiten, Begrenzung, unveränderte Eingabe, veraltete Vorschau nach Modell- oder Auswahländerung abgewiesen, ungültige Texte abgewiesen; Wand-Auswahl („2D“), fehlende Auswahl, unbekannter Befehl. Neu: eigener Stand wird ohne zweite Berechnung übernommen, ein Rückgängig-Schritt, veränderlicher Eingang liefert dasselbe Modell.
- Wand-, Fenster- und Schraffurtests prüfen statt der Altgrammatik, dass der Offset-Befehl ihre Texte nicht beantwortet.
- Messung (Node, `benchmarks/offset-command-profile.ts`, Schulmodell mit fünf Bildern, Median ms, `benchmarks/offset-command-results.json`):

| ms                   | s main → neu | l main → neu |
| -------------------- | ------------ | ------------ |
| Vorschau Polylinie   | 88 → 8       | 186 → 34     |
| Übernehmen Polylinie | 81 → 0       | 180 → 0      |
| Vorschau Schraffur   | 67 → 5       | 199 → 15     |
| Übernehmen Schraffur | 66 → 0       | 193 → 0      |

- Ergebnisprojekte (s und l, Polylinie und Schraffur) serialisiert byte-gleich zu main.

## Grenzen

- Bei veränderlichem (nicht eigenem) Eingangsstand prüft „Übernehmen“ weiterhin vollständig neu.
