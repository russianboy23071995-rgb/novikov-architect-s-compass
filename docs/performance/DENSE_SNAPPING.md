# Dichte lokale Fanggeometrie — 04.10.2026

Reproduktion: `node --experimental-strip-types scripts/benchmark-dense-snapping.mjs`. [Rohwerte und Laufzeit/CPU](dense-snapping.json). 5 Warm-ups, 15 Messungen pro Fall; Median und beobachtetes P95 (bei 15 Stichproben der Maximalwert). Jeweils 100 px/m, 10 px Fangradius, Cursor (0,013;0,009), ein Zeichenursprung und drei aktive Mittelpunkte. Indexaufbau und vollständige Vergleichsberechnung außerhalb der Messzeit. Gemessen wird resolveToolSnap einschließlich lokaler Suche, Quellenvalidierung, Führungen und Ranking.

Zwei deterministische Stressfälle mit Segmenten von x=-100 bis x=100: parallele schräge Linien mit überlappenden AABBs, deren tatsächliche Geometrie außerhalb des Fangkreises liegt; sowie Fächer mit sehr vielen echten lokalen Kreuzungen. Pro Fall wird das vollständige Resolverergebnis vor der Messung gegen die globale Vergleichssuche geprüft. Kein UI-/Rendering-/Timerbenchmark und keine allgemeine Leistungszusage.

| Fall | Linien | lokale Segmente | geprüfte Paare | lokale Quellen inkl. Schnittreferenzen | Median ms | P95 ms |
|---|---:|---:|---:|---:|---:|---:|
| Nur Boxüberlappung | 100 | 100 | 4950 | 0 | 1.90 | 2.40 |
| Nur Boxüberlappung | 250 | 250 | 31125 | 0 | 8.50 | 9.25 |
| Nur Boxüberlappung | 500 | 500 | 124750 | 0 | 32.01 | 34.28 |
| Echte Kreuzungen | 100 | 100 | 4950 | 3975 | 27.87 | 41.08 |
| Echte Kreuzungen | 250 | 250 | 31125 | 28410 | 205.46 | 257.08 |
| Echte Kreuzungen | 500 | 500 | 124750 | 118311 | 1001.86 | 1165.85 |

Quellenzahl zählt kanonische Quellenreferenzen, nicht eindeutige Koordinaten oder endgültige Rankingkandidaten; mehrere Paare können denselben geometrischen Ort liefern. Alle N(N-1)/2 Paare der lokalen Segmentauswahl werden untersucht. Die Messung trennt nicht die Zeitanteile von Schnittberechnung, Referenzmaterialisierung und Ranking.

Nachgewiesener Engpass: AABB-Überlappung allein lässt bei langen schrägen Linien zu viele Nichttreffer zu. Nächster begrenzter Auftrag: konservative Segmentnäheprüfung vor Paarbildung, unter Erhalt numerisch akzeptierter Kontakte und Originalsegmente. Der echte Kreuzungsfall bleibt eine gesonderte Grenze: eine Näheprüfung allein kann tatsächlich nahe Geometrie nicht reduzieren. Keine willkürliche Ergebnisobergrenze oder Identitätszusammenlegung, die Fangprioritäten verändert.

Nachweise: 238 Tests, TypeScript und Build bestanden, ESLint 0 Fehler/6 bekannte Warnungen. Neue Regressionen vergleichen dichte Geometrie bei 25/100/500 px/m mit dem Vollpfad, prüfen Fenster-/Hostausschluss auch für aktive Quellen und Schnittabhängigkeiten sowie die Invalidierung konstruierter Referenzen nach Quelländerung und Zuordnung zum richtigen Undo/Redo-Snapshot. Keine Anwendungscodeänderung, daher keine neue Browserabnahme; die Abnahme aus PR #56 gilt für den identischen Produktionscode weiter.
