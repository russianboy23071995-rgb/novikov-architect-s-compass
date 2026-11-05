# Rechtsklickmenü, Modify-Menü und Zwischenablage (K1)

Nutzervorgabe (30.10.2026): Vor dem Trimmen (L04b) braucht das Programm ein Rechtsklickmenü im Canvas (Löschen, Kopieren, Einfügen, Werkzeugmenü, Trimmen, Reihenfolge der Darstellung …) und das Modify-Menü. Anpassung des Nutzers: Ins Modify-Menü gehören nur Funktionen wie Pipette und Trimmen, kein Löschen und keine Reihenfolge. Reihenfolge: K1 (dieses Dokument) → K2 Darstellungsreihenfolge → L04b Trimmen mit Bestätigung.

## Rechtsklickmenü (Grundriss und 3D)

- Ein einfacher Rechtsklick öffnet das Menü an der Maus (Entscheidung V). Auf einem Element wird dieses zuerst ausgewählt (wie mit Linksklick), danach zeigt der Kopf „Dach“, „Raum R-001 Wohnen“ oder „n Elemente“; im Leeren heißt es „Zeichenfläche“. In 3D wird das Element unter der Maus wie beim Klick getroffen.
- Einträge: Ausschneiden (Strg+X), Kopieren (Strg+C), Einfügen (Strg+V), Löschen (Entf) · Parameter übernehmen (Pipette), Werkzeugeinstellungen… · Trimmen…, Trimmung aufheben (aktiv ab L04b), Darstellungsreihenfolge (aktiv ab K2). Nicht passende Einträge sind ausgegraut, der Grund steht im Tooltip.
- Werkzeugeinstellungen… (Entscheidung Y): öffnet das Einstellungsfenster des Werkzeugs, zu dem das Element gehört (Dach, Raum); bei Werkzeugen ohne Fenster wird das Werkzeug gewählt und die Werkzeugleiste fokussiert; im Leeren gilt das aktive Werkzeug.
- Schließen mit Esc, Klick daneben oder nach einem Befehl. Nicht beim Zeichnen, Platzieren, Bearbeiten oder Verschieben der Ansicht.
- Der frühere doppelte Rechtsklick für die Pipette entfällt, wo das Menü verfügbar ist; die Pipette ist ein Menüeintrag.

## Modify-Menü

Nur: Parameter übernehmen (Pipette) – aktiv bei genau einem ausgewählten Element –, Trimmen… und Trimmung aufheben (aktiv ab L04b).

## Zwischenablage (`src/application/clipboard/clipboard.ts`)

- Nur innerhalb der App (Entscheidung X). Kopien werden je Objektart über das Element-Register gesammelt, damit künftige Arten automatisch kopierbar sind.
- Fenster und Türen (Elemente mit Wandbezug) reisen nur mit ihrer Wand; allein ausgewählt werden sie nicht kopiert (Meldung). Eck- und T-Anschlüsse werden übernommen, wenn alle beteiligten Wände kopiert sind.
- Einfügen an derselben Stelle im aktiven Geschoss (Entscheidung W): neue IDs, Fenster/Türen an ihren neuen Wänden, Anschlüsse umgeschlüsselt, Räume mit der nächsten freien Nummer; ein Undo-Schritt; die eingefügten Elemente sind danach ausgewählt.
- Ausschneiden = Kopieren + Löschen der Auswahl (zwei Schritte im Verlauf: Löschen).
- **Grenze:** Wände genau auf bestehenden Wänden einzufügen (z. B. im selben Geschoss wie die Vorlage) lehnt die Modellprüfung ab, weil sich dann mehr als zwei Wände eine Ecke teilen würden („Einfügen an derselben Stelle nicht möglich: Die Wände würden genau auf bestehenden Wandecken liegen …“). Räume, Decken, Dächer, Linien, Schraffuren lassen sich auch im selben Geschoss einfügen. Ein späteres „Einfügen an Mausposition“ würde das auflösen.

Nachweis: Test in `src/application/elements/delete.test.ts` (Wände mit Fenstern, Raum und Decke aus dem EG kopieren; Einfügen über gleiche Wände abgelehnt; Einfügen ins OG ohne Wände: neue IDs, gleiche Lage, Fenster an neuen Wänden, Ecken umgeschlüsselt, Raum R-003, zweimal eingefügt R-003/R-004; Quelle unverändert; Fenster allein abgelehnt, gemischte Auswahl mit Hinweis). 1370 Tests grün, 14-Modell-Hash unverändert.

Browser-Abnahme (30.10.2026): Rechtsklick auf das Dach im Grundriss: Menü an der Maus, Dach ausgewählt, Einfügen ausgegraut. Kopieren, dann Strg+V: zweites Dach, Hinweis „1 Element eingefügt“; Undo entfernt es. Rechtsklick ins Leere: „Zeichenfläche“, Einfügen aktiv, Löschen ausgegraut. Werkzeugeinstellungen… am Dach öffnet „Dach-Einstellungen“. Modify-Menü: genau Pipette, Trimmen…, Trimmung aufheben. 3D: Rechtsklick trifft Wand bzw. Dach. Klick daneben schließt das Menü. Keine Konsolenfehler nach dem Neuladen.
