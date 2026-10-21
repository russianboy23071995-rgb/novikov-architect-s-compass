# Gemeinsamer Verschiebungsvektor für schräge Achsen

## Änderungskarte vor Implementierung

AUD14-04/05, A04, Masterplan §9. Basis PR425 c06a36b, CI beim Start laufend.
Nutzerziel: Vollpfad und vorbereitete Auswahltranslation berechnen aus demselben
Achsziel exakt denselben signierten Verschiebungsvektor. Normalszenarien positive,
negative und Nullbewegung entlang schräger Linie/Konturseite; Grenzfälle fremder
Ursprung, andere gewählte Ecke und große Koordinaten. Noch keine UI-Achsenanbindung,
Stretch-/Wandketten-/Wand-X/Y-/3D-Migration.

Geometry besitzt die bisherige Vollpfad-Rechenreihenfolge für den Achsversatz.
Application-Auswahlquery nimmt optional dieselbe Richtungsbindung entgegen und
übergibt den Vektor ohne erneute Zielpunkt/Subtraktionsumrechnung an vorbereitete
Domain-Translation. Vollpfad.axis verwendet dieselbe Funktion. Fang-projectDirection
und Stretch bleiben unverändert. Ein Project, stabile IDs/Geschoss/Host, Meter,
gepinntes Modell/Ursprung/Sichtbarkeit, vollständiger Commit und ein Undo erhalten.
Keine UI-Geometrie, zweite Modellkopie, neue Frameworks oder Storage-/Schema-/IFC-/
Recovery-/AI-Migration. API für künftigen gemeinsamen Achsenadapter, kein Rendererdispatch.

Abnahme: unabhängige alte Vollpfad-Arithmetik, exakt gleiche vollständige Projekte
und Patches, signierte Numeric- und Mausziele, ±/Null/große Koordinaten/Griffwahl,
Muster/Stil/Ebene, ungültiger/staler/ausgeblendeter Kontext, Abbruch/Datei/UndoRedo.
Vollsuite, Typen, Architektur/Lint/Build und bestehende Diagnose mit aktivem
gemeinsamen Achsvektor. Keine Toleranzlockerung oder Frame-/Native-Gesamtfreigabe.

## Abschlusskarte: Platzierung und Schutzgrenzen

PR425 nach grüner CI39657525588 in main4020047 übernommen. directionOffset in
geometry/projections/direction.ts übernimmt exakt die bisherige Vollpfad-Formel:
Delta zum Ursprung, Skalarprodukt mit roher Richtung, durch deren Länge teilen,
dann mit derselben normierten Richtung multiplizieren. Keine Rundung/Toleranz.
Bereits vorher normalisierte Richtungen sind nicht als Ersatz für den gepinnten
originalen Konturvektor zulässig, wenn bitgenaue Gleichheit verlangt wird.

Vollpfad.axis und die optional richtungsgebundenen Application-Queries
previewSelectionGeometry/previewSelectionMove verwenden denselben Helfer und
übergeben dessen Offset direkt an die vorhandene vorbereitete Translation.
Keine Rekonstruktion eines absoluten Zielpunkts mit anschließender Subtraktion,
welche erneut letzte Bits verlieren würde. Fang-projectDirection bleibt unverändert;
es liefert das Mausziel. Die gemeinsame Offsetberechnung ist die anschließende
Translation dieses Ziels. Stretch verwendet weiter seinen bisherigen Weg.

Kein CadWorkspace-/Hook-/Menü-/Rendererumbau und noch keine schräge UI-Anbindung.
Die bisherigen X/Y-/freien-/3D-Aufrufe ohne Richtungsparameter bleiben unverändert.
Vollständige Prüfung beim Materialisieren und Originalprojekt-/Auswahl-/Ursprung-/
Sichtbarkeitsprüfung vor jeder Abfrage bleiben vorhanden. Ein zusätzlicher erlaubter
Legacy→Geometry-Import; kein Rückgriff auf Application/UI/Storage aus Geometry,
keine neue Modellkopie, kein Zyklus oder automatisch erweiterte Ausnahme.

1152 Tests, beide Typprüfungen, Architektur-Gate (377 Produktdateien,1491 interne
Pfeile,null Zyklen), fokussiertes ESLint und Produktbuild bestanden. Vier neue
Tests mit72 Varianten: Linie/Schraffur, Koordinaten0/1e9, drei gewählte Konturpunkte,
±0,68/Null und Maus-/Numeric-Ziele; fremder Ursprung, Muster/Stil/Ebene, exakte
Patch-/Projektgleichheit, Dateirundlauf und ein UndoRedo. Die alte Formel wird im
Oracle unabhängig nachgerechnet; der erwartete Vollpfad verwendet nicht den neuen
Projektionshelfer. Ungültige Richtungen und stale/unsichtbare Kontexte werden
abgewiesen, die Quelle bleibt unverändert. Große Koordinaten sind eine
Regressionfixture, keine neue allgemeine Modellgrenzenfreigabe.

Bestehende Produktinteraktion bitgenau extrahiert, keine neuen Eingaben oder
Rendererpfade. End-to-End-Maus-/Numeric-Application-Pfade und unabhängige Commits
automatisiert geprüft; keine neue praktische Browser-, Native-, Frame-, IFC- oder
Recoveryabnahme in diesem Schritt. Datei/Recovery/IFC-Schema unverändert; gezielte
Browserabnahme wird mit der tatsächlichen Achsen-Menüanbindung durchgeführt.

## Vergleich nach Vereinheitlichung

Bestehendes Diagnoseprotokoll mit --shared-axis verwendet die echte optionale
Richtungsbindung der Auswahlqueries. 10/100 Schraffuren à100 Punkte plus schräge
Linie,12 Profile x9 Proben, erste+8 warm und wechselnde Reihenfolge.
108/108 vollständige Mausprojekte,108/108 scoped Zielgeometrien und108/108
signierte Numeric-Projekte exaktgleich. Alle Assertions aktiv; maximale numerische
Differenz0, keine Toleranz. Vorher36 schräge Maus-/30 Numeric-Abweichungen in diesem
Protokoll, jetzt0. Zwölf echte DirectEdit-Commits entsprechen Vollvorschau, mit
unabhängigem Undo/Redo. Rohdaten benchmarks/shared-oblique-axis-results.json.

Ein Prozess; warme Medianzeiten bei100 Restschraffuren für eigene Achse:
Linie Vollprojekt34,86 ms/Patch0,05 ms, Schraffur70,97/0,41 ms. Unterschiedliche
Ausgabeformen, Node/JIT/GC, synthetische Fixture und Entwicklungsserver-Hintergrundlast;
keine Gesamtframe-/Native-/Kapazitätsfreigabe. Vorbereitung getrennt, Fang/React/
Planableitung/GPU/Commit nicht in den Mikrozeiten enthalten.

Einziger Folgeauftrag Masterplan §9: „Element entlang Achse“ einzelner Linien und
Schraffuren in2D an vorhandene Auswahlbewegung anbinden. Richtungsquelle bleibt
editDirection des gepinnten Ziel-/Griffkontexts, roh und sitzungsfest; numericMoveAxis
liefert nur die Eingaberichtung/-beschriftung. Kein Mesh-/Renderer-Ableiten,
Vorabnormalisieren der Translationsbindung oder zweiter Werkzeugalgorithmus.
