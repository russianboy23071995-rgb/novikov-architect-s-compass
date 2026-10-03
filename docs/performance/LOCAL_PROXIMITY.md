# Geometrische Vorauswahl lokaler Segmente

Basis: PR #57, Commit `8bc23712d0577ce2ce6307b196044256e7202785`.

## Änderung

Nach der AABB-Suche prüft `geometry/intersections/segment-box.ts`, ob das
Originalsegment das toleranzgepolsterte Suchquadrat um den Cursor berühren
kann. Der Separationsachsentest berücksichtigt zusätzlich die Segmentnormale;
die beiden Weltachsen sind durch die Boxsuche bereits abgedeckt. Unsichere
Gleitkommaarithmetik behält Kandidaten. Die quadratische Suchfläche ist bewusst
konservativer als der endgültige kreisförmige Pixelradius.

`application/snapping/local-sources.ts` wendet den Filter vor Schnittpunktpaaren
an. Originalausdehnung, genaue Schnittberechnung, Quellenidentität, Reihenfolge,
Werkzeugfilter und vollständiger Lookup bleiben erhalten. Entfernte aktive
Referenzen werden weiterhin separat über diesen Lookup aufgelöst. Keine
Koordinaten-Deduplizierung, Ergebnisgrenze oder Wartezeit beim unmittelbaren Fang.

## Nachweis und Grenzen

Sechs neue Tests bestanden: 500 falsche Boxüberlappungen, Eckkontakt und umgekehrte
Segmente, echte dichte Kreuzungen, Toleranzkontakte/Nullradius/große Offsets,
deterministische Differentialabfragen mit Quellenausschlüssen und vollständiger
Resolver mit entfernten aktiven Referenzen sowie Shift/Ortho.
Zusätzlich 41 bestehende reine Engine-Testfälle in einer isolierten Testauswahl
ausgeführt: insgesamt 47 bestanden. Das ersetzt nicht die vollständige Testsuite.

Die vorhandene Projekttestsuite sowie TypeScript, Build, Lint und Browserabnahme
wurden hier nicht abgeschlossen: lokale Repository-Abhängigkeiten einschließlich
Zod fehlen. Deshalb bleibt die Änderung ein Draft bis zur Prüfung in der
vollständigen Projektumgebung. Vor Übernahme: `npm test`, TypeScript-Prüfung,
Build/Lint und praktische Abnahme von Zeichnen, Segment-Hover und Direct Edit.

## Vergleichsmessung

Identische Szenarien und Resolver wie `scripts/benchmark-dense-snapping.mjs`:
Cursor (0,013; 0,009), 100 px/m, 10 px Radius, Ursprung plus drei aktive
Mittelpunkte, fünf Warm-ups und 15 Messungen. Vorher und nachher nacheinander
auf derselben Laufzeit; Datenaufbau und vollständiger Vergleichspfad außerhalb
der Zeitmessung. Resolver-Ergebnisse jeweils mit der Vollaufbereitung verglichen.

Wegen fehlendem Zod wurde für diesen isolierten Lauf der Fixture-Validator
ausgelassen. Die festen Geometrieparameter und Produktionsmodule entsprechen
dem Skript; kein Nachweis der Modellvalidierung. Dies ist eine isolierte
Vergleichsmessung, keine neue Ausführung der vollständigen Projekttestumgebung
und keine Aussage zur Browser-Framerate. Metadaten und Rohzeiten in
`LOCAL_PROXIMITY.before.json` und `LOCAL_PROXIMITY.after.json`.

| Szenario, 500 Linien | Paare vorher | Paare nachher | Median vorher | Median nachher |
| --- | ---: | ---: | ---: | ---: |
| Schräge parallele Linien außerhalb Suchbereich | 124750 | 0 | 20,38 ms | 0,30 ms |
| Viele echte lokale Kreuzungen | 124750 | 124750 | 931,63 ms | 911,68 ms |

Die Zeiten echter Kreuzungen zeigen keine belastbare Verbesserung; deren
Kosten bleiben hoch. Der neue Filter beseitigt falsche Kandidaten, nicht die
quadratische Menge tatsächlich gültiger Paare.

## Nächster begrenzter Auftrag

Den echten Kreuzungsfall profilieren: getrennt exakte Paarberechnung,
Quellenschlüssel/Referenzaufbau und Kandidatenbewertung messen. Danach den
größten belegten Anteil optimieren. Ein möglicher Ansatz ist eine exakte
laufende Bestenauswahl statt der Materialisierung und Sortierung aller Treffer;
dies benötigt vorher einen Vertrag für feste Achsen, Ortho, Aktivierungsrang,
Gleichstände, Hover-Erwerb und Quellenausschlüsse. Keine beliebige Obergrenze
oder Zusammenfassung gleich gelegener Quellen. Differentialtests müssen die
identische Siegerreferenz samt ursprünglichen Blattabhängigkeiten nachweisen.

## Nachprüfung in vollständiger Projektumgebung — 04.10.2026

244 Tests, TypeScript und Build erfolgreich; ESLint 0 Fehler/6 bekannte Warnungen. Testfixture typisiert, alte Erwartung an Box-Nichttreffer angepasst und Formatierung korrigiert. Browserprüfung von Segment-Hover, entfernten Referenzen, Zoom, freier Wandecke und Zeichnen erfolgreich; Ablauf in DEVELOPMENT_PLAN.md.

[Neuer Lauf mit Projektvalidator](LOCAL_PROXIMITY.validated.json): 500 entfernte Diagonalen 0 Paare, Median 0,337 ms/P95 0,599 ms; 500 echte Kreuzungen 124750 Paare, Median 1242,13 ms/P95 1446,90 ms. Keine Browser-Framerate-Aussage. Profilierung oben zugunsten des Nutzerwunschs zur optionalen Referenzauswahl vorerst zurückgestellt; siehe ../REFERENCE_SELECTION_PLAN.md.
