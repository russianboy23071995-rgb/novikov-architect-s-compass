# K04d Wandzeichnen-/Wandketten-Profil

08.10.2026, Browsermessung auf PR189-Basis. PR189 nach gruener CI zusammengefuehrt.

Gemeinsame Application-Aktionen und Fang-/Shift-Pipeline, 20 Ziele pro Fall.
100/1.000 Elemente aus bestehender Kapazitaetsfixture mit getrennten T-Gruppen
und Fenstern. Neue Wand abseits vorhandener Geometrie, erster oder zweiter
Abschnitt (zweiter erzeugt Ecke). Alle Ebenen sichtbar, keine Bilder.
Keine DOM-, Renderer-, Frame- oder Hardware-Latenzmessung.

| Elemente | vorherige Abschnitte | Shift | Vorschau Median ms | p95 ms | validate Median ms | Platzieren + History ms |
|---|---|---|---|---|---|---|
| 100 | 0 | False | 3.25 | 5.70 | 3.55 | 11.90 |
| 100 | 0 | True | 3.30 | 5.00 | 3.20 | 10.00 |
| 100 | 1 | False | 3.00 | 5.20 | 3.20 | 8.70 |
| 100 | 1 | True | 2.70 | 3.90 | 2.80 | 7.50 |
| 1000 | 0 | False | 8.45 | 10.10 | 9.20 | 23.30 |
| 1000 | 0 | True | 8.05 | 11.00 | 8.05 | 32.80 |
| 1000 | 1 | False | 8.15 | 10.70 | 8.10 | 25.20 |
| 1000 | 1 | True | 8.45 | 11.30 | 8.85 | 24.20 |

Alle 160 Vorschauen entsprechen appendWallChain mit gleicher temporaerer ID.
Acht Abschluesse entsprechen der letzten Vorschau; jeweils ein Undo fuer die
vollstaendige Kette und Redo geprueft. Shift hielt die horizontale Richtung.
Fang-Median in allen Faellen etwa 0,1 ms. Rohdaten inklusive Vorbereitung:
[wall-drawing-profile.json](wall-drawing-profile.json).

## Interpretation und Grenze

Die vollstaendige Vorschau ist bei 1.000 Elementen mit rund 8 ms wesentlich
teurer als Fang/Shift. Dieser Lauf belegt keinen besonderen Shift-Engpass.
`tool.validate` und Vorschau wurden separat gemessen: validate wird laut
confirmInteraction beim Bestaetigen aufgerufen, nicht als zweiter Pointerlauf.
Die Tabelle darf deshalb nicht zu einer angeblichen Framezeit addiert werden.
Die Spalte Platzieren + History misst append/finish/commit, ohne das separat
vermessene validate. Reihenfolge, JIT und ein einzelner lokaler Lauf begrenzen
die Vergleichbarkeit. Keine neuen Leistungsversprechen.

## Genau ein Folgeauftrag

K04e: isolierter vorbereiteter Pilot fuer die Vorschau des ersten freien
Wandabschnitts. Bestehende addWall-/Anschlussregeln wiederverwenden, stabile
Basis einmal vorbereiten, jeden Zielzustand gegen den Vollpfad vergleichen.
Nahe/fremde Endpunkte, T-Kandidaten, Fenster und ungueltige Ziele pruefen;
bei nicht belegten Bedingungen Vollpfad. Noch keine produktive Anbindung,
keine Wandketten-Ausweitung. Volle Bestaetigung und ein Undo bleiben Pflicht.

## Wiederholen

Diagnose-Vite starten, /benchmarks/wall-drawing.html oeffnen und Diagnose starten.
Am Ende muessen acht verified:true-Faelle erscheinen. Ein Error beendet den
Lauf sichtbar. Die normale CAD-Oberflaeche und Benutzerprojekte bleiben unveraendert.
