# Isolierter XYZ-Bounds-Pilot – 21.10.2026

## Änderungskarte
AUD14-03/04, main e927cf9 nach PR414 (CI39644109265 grün). Ziel: ausschließlich die Achseniteration der Grenzberechnung freier Wandflächen durch direkte XYZ-Zuweisungen vereinfachen. Normalszenario: freie Wand mit Fenster; Grenzfälle: schräge Wände, mehrere/überlappende Öffnungen, große Koordinaten und signierte Höhenversätze. Eigentümer bleibt bestehende Solidableitung; autoritative Quellen sind validierte Projekt-/Geometriescopes mit stabilen Wand-/Host-IDs. Transformation, Punktarrays, Flächen-/Rechenreihenfolge, Freeze und Validierung bleiben unverändert. Keine neue Aktion, Vorschau-/Commit-/Undo-Regel, Cache, Modellkopie oder Änderung an 2D/3D-Bedienung, Datei, Recovery, IFC oder AI.

Kandidat wurde ausschließlich in einem exklusiv erzeugten temporären Geschwistermodul ausgeführt. Produktquelle nur gelesen; eindeutiger Anker und finally-Cleanup. Kein Produktcode geändert.

## Ergebnis: nicht übernehmen
Zwei serielle uninstrumentierte Vergleichsläufe, jeweils sieben frische Owned-Szenen pro Größe und alternierende Alt-/Kandidatreihenfolge. Zwei ausgewählte Basiswände; 0/100/1000 zusätzliche Wände mit je einem Fenster, pro Trial horizontale/schräge Varianten und -0,2/+0,15 m Versatz. Große Szene: 1004 Wände/1002 Fenster. Snapshotvorbereitung außerhalb der Messung.

Mediane des vollständigen Gebäudeaufbaus in ms:

| Zusatzwände | Alt Lauf 1 | Kandidat Lauf 1 | Alt Lauf 2 | Kandidat Lauf 2 |
| --- | --- | --- | --- | --- |
| 0 | 1,599 | 1,846 | 1,551 | 1,504 |
| 100 | 9,154 | 10,776 | 10,676 | 10,360 |
| 1000 | 85,988 | 85,350 | 94,850 | 64,553 |

Großer Fall rund 1 % bzw. 32 % Gewinn, kleine Fälle mit wechselndem Vorzeichen. JIT/GC/Systemlast, untere gemeinsame Caches und nur sieben Proben erlauben keine robuste allgemeine Leistungszusage. Gemäß Übernahmegate wird der Kandidat nicht produktiv übernommen. Kein erneutes Nachmessen bis ein günstiges Ergebnis entsteht.

## Nachweise / Abschlusskarte
54 vollständige Vergleichsfälle bestanden: je Lauf 21 Gebäudevergleiche und sechs ungemessene Scopefälle mit keiner/einer/überlappenden Öffnung, schrägen Wänden, 1e9-Koordinaten, Höhenversatz und unveränderter Eingabe. Vollständige Flächen, Normalen, Volumen und Bounds exakt gleich. Scopeüberlappung ändert keine Application-Platzierungsregel. Benchmark-Typecheck und fokussiertes ESLint bestanden. Keine erneute Produktsuite/Browserabnahme für unveränderten Produktcode; PR414 hatte grüne CI. Keine GPU-/Frame-/Native-, Recovery- oder IFC-Freigabe.

Reproduktion: node --experimental-strip-types benchmarks/wall-bounds-comparison.ts. Rohdaten: wall-bounds-results.json und wall-bounds-repeat-results.json unter benchmarks. Kein neuer Produktimport, keine Rückabhängigkeit oder neue Modellwahrheit. Kandidat nur als Diagnosecode erhalten.

Nächster Einzelauftrag §9: nach einer einzelnen Wand-/Fensteränderung messen, welche unveränderten Wandextrusionen im Gebäudeaufbau erneut entstehen. Erst Kosten und fachliche Abhängigkeitsmenge nachweisen, bevor Wiederverwendung erweitert wird. Keine weitere Mikrooptimierung aus den instabilen Messungen ableiten.
