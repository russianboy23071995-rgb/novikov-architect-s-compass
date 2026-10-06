# Gemeinsame Dichteschranke — 04.10.2026

Vorläufig: >32 erlaubte nahe Segmente pausieren automatische lokale Schnittpunkte; <=24 für 250 ms nimmt sie wieder auf. Hover bleibt 600 ms. Die vollständige query bleibt Vergleichspfad; createToolSourceQuery schützt Produktionsabfragen standardmäßig. Infinity wird explizit nur für Differentialtests und historische Benchmarks verwendet.

Reproduktion: node --experimental-strip-types scripts/benchmark-snap-density.mjs. Rohwerte/Hardware: [snap-density.json](snap-density.json). 5 Warm-ups, 15 Messungen; P95 entspricht dem Maximalwert. Vollständiger Resolver mit vier Referenzen, ohne Indexaufbau/React/Timer/Rendering.

| Segmente | Paare | Median ms | P95 ms |
|---|---:|---:|---:|
| 24 | 276 | 1.506 | 1.961 |
| 32 | 496 | 2.373 | 2.848 |
| 33 | 0 | 0.261 | 0.688 |
| 48 | 0 | 0.318 | 0.520 |

Keine allgemeine Leistungszusage. 247 Tests: 32/33, 24/25, 249/250 ms, Unterbrechung, Ausschlüsse vor Zählung, Snap aus und Erhalt entfernter Führungen. Proxy-Sperre belegt keine Segmentiteration im pausierten Abschluss. Browser: Hinweis bei Idle/Zeichnen/Direct Edit, Mittelpunkt bleibt fangbar, Referenz bleibt nach Zoom, Wiederaufnahme außerhalb des dichten Bereichs und Linienabschluss erfolgreich. Manuelle Referenzauswahl folgt separat.
