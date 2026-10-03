# Vollständige lokale Fangabfrage — 04.10.2026

Reproduktion: `node --experimental-strip-types scripts/benchmark-local-integration.mjs`. Rohwerte und Hardware: [local-integration.json](local-integration.json). Gleiche getrennte Wand-/Linienkreuzungen, Mausfolge, 100 px/m, 10 px Fangradius und vier aktive Referenzen wie in der [Baseline](SNAP_BASELINE.md). Je Modus 30 Warm-ups und 150 Messungen. Index wird vorher einmal aufgebaut; die Messung umfasst lokale Suche, Quellenvalidierung, Kandidaten, Führungen und Rangfolge über resolveToolSnap. Keine React-, Hover-Timer- oder Renderingzeit.

| Elemente | Zeichnen Median/P95 ms, 4 Referenzen | Direct Edit Median/P95 ms, 4 Referenzen |
|---|---:|---:|
| 100 | 0.1239 / 0.3023 | 0.1287 / 0.2647 |
| 1000 | 0.1289 / 0.2137 | 0.1104 / 0.1621 |
| 5000 | 0.0989 / 0.1435 | 0.1057 / 0.1602 |

Historische Baseline bei 5000 Elementen: 35,67/39,79 ms Median für Zeichnen/Direct Edit mit vier Referenzen. Der neue Lauf erreicht 0,0989/0,1057 ms auf der dokumentierten verteilten Geometrie. Kein allgemeiner Beschleunigungsfaktor und keine Browser-Framerate-Zusage: dicht überlappende Segmentboxen können weiterhin viele lokale Paarprüfungen verursachen. Indexaufbau und Neuaufbau nach Modelländerung bleiben separat in [LOCAL_SOURCES.md](LOCAL_SOURCES.md) dokumentiert.
