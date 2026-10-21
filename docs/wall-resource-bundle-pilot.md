# Gebündelte Wandressourcen mit Fallback – Pilot nicht übernommen

21.10.2026; Basis main 5d0ca31 nach PR418, grüne CI39649507417.

## Änderungskarte
AUD14-03/04. Ziel: unveränderte freie Wandflächen aus dem benachbarten geprüften Gebäudezustand übernehmen, Kaltaufbau und Höheninvalidierung ohne zusätzliche Face-Registry-Pflege. Normalszenarien Wand-/Fenstereinzeländerung; Grenzfälle Höhen-/Host-/Anschlusswechsel. Eigentümer bestehende Solidableitung, autoritative Quelle validiertes Projekt mit stabilen IDs/Meter. Keine neuen Modellregeln oder Eingriffe in Application-Aktionen, Vorschau/Commit/Undo, Datei, Recovery, IFC oder AI. Produktübernahme nur nach Exaktgleichheit und Kostenbudget §9.

## Kandidat
Vorherige endgültige, tief eingefrorene Flächen werden pro Wand gebündelt, nur bei benachbarten Owned-Snapshots desselben Projekts und gleichen Gebäude-/Geschosshöhen. Vollständiger Kontext: Achsendpunkte, Stärke, aufgelöste Höhe, Körperversatz, Basishöhe, Reihenfolge/Form der Hostöffnungen und geschossweite Höhenübertragungsbedingung. Aktuell oder vorher verbundenen Wänden wird keine freie Geometrie untergeschoben. Volumenbeiträge entstehen weiter in der ursprünglichen Zellreihenfolge. Treffer überspringen Flächenerzeugung/Höhenübertragung/erneutes Freeze; veröffentlichte Flächen stammen aus tief eingefrorenem Vorzustand.

Kaltaufbau und geänderte Höhen betreten keinen Ressourcenvergleich. Nach erstem Budgetlauf wurde der zusätzliche Freeze-Zweig aus dem Fallback entfernt und die Wiederverwendung auf Vorableitungen mit mindestens 1024 Flächen begrenzt. Diese Zahl ist eine interne Versuchsschwelle, keine neue Produktanforderung. Keine Face-weiten WeakMap/WeakSet-Registries, keine dauerhafte ID-Registry oder Kette von Modellständen. Gruppierung ist nur flüchtig; neues Ergebnis hält geteilte Faces, keinen alten Projektzustand.

## Ergebnis / Rücknahme
Exaktgleichheit und tatsächliches Teilen unveränderter Flächen bestanden. Das Leistungsgate wurde nicht bestanden; Produktänderung vollständig zurückgenommen. Produktcode und Tests entsprechen wieder main. Kandidat ausschließlich als Textfixture wall-resource-candidate.txt und reproduzierbare Diagnose erhalten.

Abschließendes serielles Paar, große Szene mit 1005 Wänden/1003 Fenstern, Mediane ms:

| Fall | Produktion 1 | Kandidat 1 | Produktion 2 | Kandidat 2 |
| --- | --- | --- | --- | --- |
| Kaltaufbau | 58,907 | 65,900 | 56,491 | 65,305 |
| Freie Wand ändern | 62,911 | 47,311 | 68,851 | 70,097 |
| Freies Fenster ändern | 63,184 | 42,373 | 52,800 | 40,982 |
| Verbundenes Fenster ändern | 65,419 | 46,675 | 57,347 | 45,630 |
| Geschosshöhe ändern | 65,523 | 65,042 | 60,299 | 68,375 |

Fensterfälle profitieren, Wandfall nicht stabil. Kaltaufbau in beiden Läufen rund 12–16 % langsamer; Höhenfallback im zweiten Lauf ebenfalls langsamer. Kleine Szenen werden im zweiten Kandidaten weitgehend unter 0,5 ms Differenz abgefangen; das reicht nicht zum Bestehen des Großmodellbudgets. Keine weitere Variante nach diesem Abschlusslauf gesucht.

## Methode / Nachweise
84 unabhängige Fälle pro Prozess (4 Änderungen x 3 Restgrößen x 7 Trials), einmal expliziter Kaltaufbau und einmal anschließende Änderung. Eindeutige Projekt-ID pro Szene verhindert Vorzustandsreuse im Kaltaufbau. Beide vollständigen Solid-/Normalen-/Volumen-/Bounds-Vergleiche pro Fall bestanden. Zwei erste und zwei abschließende Entwicklungsläufe sowie abschließendes Archiv-Replay als Rohdaten erhalten. Der Replay prüft die exakte archivierte Fassung nach Rücknahme, nicht einen neuen Gewinn.

Historische *initial* und normale results/repeat-Dateien: totalMs=alte Produktion, controlMs=Kandidat, coldOldMs=Produktion, coldNewMs=Kandidat. Archivierter Vergleichseinstieg/Replayedatei: Rollen umgekehrt (total/coldOld=Kandidat, control/coldNew=Produktion). Geänderte Reihenfolge alterniert; Kaltaufbau wurde stets Produktion zuerst ausgeführt. JIT/GC, geteilte untere Caches und diese Reihenfolge sind wichtige Störfaktoren. Die Messung belegt ein nicht bestandenes Budget, keine gesicherte einzelne Ursache für die Mehrkosten.

Auf Entwicklungsfassung acht fokussierte Tests bestanden, einschließlich Sharing-Identität, veränderter neuer Flächen und Mutationsschutz; bestehender unabhängiger Vollpfadtest erfasst Geometrie-/Host-/Höhen-/Anschlusswechsel. Benchmark-Typecheck/Lint des Diagnoseeinstiegs und finales Archiv-Replay bestanden. Keine erneute Vollsuite/Produktbrowserabnahme für die verworfene Produktänderung behauptet. Keine GPU-/Frame-/Native-, Recovery- oder IFC-Freigabe.

Reproduktion: node --experimental-strip-types benchmarks/wall-resource-comparison.ts. Temporäres Geschwistermodul aus Textfixture, exklusive Anlage und finally-Cleanup. Rohdaten wall-resource-initial-results.json, initial-repeat, results, repeat und archived-replay unter benchmarks. Keine produktive neue Abhängigkeit oder Modellwahrheit.

## Abschluss / Folgeentscheidung
Kein Performancegate geschlossen. Weitere Node-Mikrovarianten vorerst beenden. Einziger nächster Auftrag §9: bisherige Produktion und diesen archivierten Kandidaten im isolierten tatsächlichen Browserlauf vergleichen, mit gleicher Fixture und wechselnder Reihenfolge. Kaltaufbau, Einzeländerung, Höheninvalidierung und Mess-/Speichergrenzen auseinanderhalten. Erst Browserbefund entscheidet, ob Ressourcenreuse weiterverfolgt oder diese Richtung geparkt wird. Nutzerprojekt/Recovery unberührt lassen; keine automatische Produktübernahme.
