# Gemeinsame Streckrechnung, 24.10.2026

## Änderungskarte vor Code

AUD14-04/A04, §9. Basis PR428427e41d, CI läuft beim Start. Bestehendes Verhalten
erhalten: Punkt in Flucht verlängern/verkürzen, Nachbarüberquerung ablehnen.
Roher Konturvektor, Griff und gepinnter Ursprung bleiben maßgeblich; ±/Null,
konkave Konturen, große Koordinaten und Grenzwerte unabhängig vergleichen.

Geometry besitzt die gemeinsame reine Versatz-/Grenzquery. Bestehendes DirectEdit
ruft sie auf; Application behält vollständige Vorschau/Commit und atomare History.
Kein zweites Modell, keine UI-/Adapterregistrierung, keine neue Fangregel.
Die vorhandene feste Grenze1e-9 m wird unverändert übernommen. Linien, Schraffuren
und bestehende Wand-Streckaufrufe teilen diese Rechnung; keine 3D-Migration.
Datei/Recovery/IFC/AI-Verträge unverändert, da nur interne Rechnung extrahiert wird.
Abnahme: unabhängige Altformel, volle Projekte/History, ungültige Ziele, Typen,
Architektur/Lint/Build. Keine neue Interaktionsregel, daher kein neuer Browserablauf.

## Abschluss

PR428 nach CI40031694240 grün in main73023e5 übernommen. Gemeinsame interne
axisTranslation berechnet Länge, signierte Strecke und Offset in unveränderter
Reihenfolge. directionOffset und neue stretchOffset konsumieren sie. Letztere
prüft die bestehende Nachbargrenze vor Rückgabe; DirectEdit übernimmt den Offset
direkt. Null-/nichtendliche Achsen werden vor Modellmutation zurückgewiesen.

72 unabhängige Vergleichsfälle mit ursprünglicher Formel (drei Ursprünge bis1e9,
vier Richtungen, sechs signierte Ziele), Grenzwerte um1e-9 und ungültige Eingaben
bestanden. Auch das Vorzeichen von Null bleibt erhalten. Der erste Grenztest
erwartete irrtümlich +0 statt des ursprünglichen −0 und wurde korrigiert.
Vollsuite1154 bestanden, einschließlich vorhandener Linien-/Schraffur-/Wand-
Vorschauen, Commit-/History-/Abbruchfälle; beide Typechecks, Architekturprüfung
(377 Dateien/1491 Kanten/null Zyklen), fokussiertes Lint und Produktionsbuild grün.

Produktdiff nur Geometry-Query und ersetzte Streckarithmetik im vorhandenen
DirectEdit-Aufrufer. Keine neue Import-Schichtgrenze, Ausnahme, zweite Modellkopie,
Fangregel, UI oder Persistenzänderung. Keine neue Browserabnahme und keine
Performanceverbesserung behauptet: vollständige Projektvorschau bleibt bis zur
gezielten Adapteranbindung bestehen. Nächster Einzelauftrag ausschließlich §9.
