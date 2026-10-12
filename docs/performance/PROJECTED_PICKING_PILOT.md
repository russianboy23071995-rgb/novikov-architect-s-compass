# K07e: isolierter projizierter Picking-Pilot

08.10.2026. PR202 nach erfolgreicher CI zusammengefuehrt. Produkt-Picking unveraendert.

## Ansatz und Sicherheit

Pro Display-Snapshot und Projektion einmal vorhandene Wand-/Fensterdreiecke
projizieren. 32x32 Kandidatenraster im NDC-Bereich; Dreiecke ueber mehr als 64
Zellen in separater globaler Kandidatenliste, um grosse Flaechen nicht tausendfach
zu speichern. Kandidaten werden in urspruenglicher Reihenfolge ausgewertet:
Wand zuerst, Fenster danach, striktes kleiner-Tiefe gewinnt. Exakte Pruefung
verwendet unveraendert triangleDepth, keine neue Trefferregel. Bounds beruecksichtigen
zwei negative baryzentrische Gewichte innerhalb der bestehenden 1e-9-Toleranz
zuzueglich numerischer Reserve. IDs werden kopiert; Projektion/Display/Window-
Identitaetswechsel weist die Sitzung ab. Eingaben sind unveraenderliche Ableitungen,
keine in-place Mutation und keine ID-only Vertrauensannahme.

## Pruefung

697 Tests, Diagnose-Typecheck inklusive src, gezielter ESLint und Produktionsbuild
bestanden. Bestehende Vite-/Chunkwarnungen unveraendert.
Neue Tests vergleichen Ziel UND Tiefe mit Vollscan: Eckketten/T-Gruppen, mehrere
Kamerawinkel, Verdeckung, unsichtbarer Host, Rasterziele, Flaechenzentren und
Vertices. Zusaetzlich Grenztoleranz, gleiche Tiefe/Reihenfolge, NaN und veralteter
Display-/Fenster-/Projektionskontext. Keine produktive Anbindung.

/benchmarks/projected-picking.html: 25/100/500 Waende mit Fenstern, je zwei
Kamerawinkel, 30 Abfragen je Zustand. 180 Zielvergleiche bestanden, darunter
Treffer und Nulltreffer. [Rohdaten](projected-picking.json).

| Waende | Vorbereitung ms | Vollscan Median ms | Pilot Median ms |
| --- | --- | --- | --- |
| 25 | 4,3-5,1 | 0,6-1,0 | unter Timeraufloesung |
| 100 | 11,6-13,9 | 3,9-4,1 | unter Timeraufloesung |
| 500 | 42,3-57,4 | 19,5-20,5 | ca. 0,1 |

Bei 500 Waenden ca. 40.984 Dreiecke im Index; Median zwei exakte Dreiecktests
je Ziel in diesen Fixtures. Das ist kein Worst-Case-Beleg dichter ueberlagerter
Geometrie. Kein GPU-/Framezeit- oder Speicherbudgetnachweis. Messreihenfolge
Vollscan dann Pilot, keine kontrollierte globale Speedup-Zusage. Breite globale
Kandidaten und degenerierte Projektionen koennen den Gewinn reduzieren.

## Entscheidung und genau ein Folgeauftrag

Noch NICHT integrieren: Vorbereiten nach jedem Kamerazustand kostet mehr als
ein einzelner Vollscan. Vorteile amortisieren sich erst ueber mehrere Abfragen
auf derselben Projektion; ein synchroner Aufbau beim Drehen wuerde den gerade
verbesserten Kamerapfad erneut belasten. Fusspunkt-/Hover-Gesamtpfad bleibt offen.

K07f: Isolierter Gegenpilot mit modellgebundenem raeumlichem Kandidatenindex,
der Kamerabewegungen uebersteht. Vorhandene Projektions-/Tiefenregeln als exakten
Vollscan-Vergleich behalten; Aufbau nur bei Geometrie/Sichtbarkeit, Kamerawechsel
und erste Folgeabfrage getrennt messen. Modell-/Indexbindung, Fenster/Verdeckung
und stabile IDs pruefen. Danach Ansatz anhand Gesamtaufwand waehlen, keine
vorschnelle Produktintegration. Andere K-/V-Ziele bleiben erhalten.
