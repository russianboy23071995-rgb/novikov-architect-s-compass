# Feste X/Y-Bewegung über gemeinsame Auswahltranslation

## Änderungskarte vor Implementierung

AUD14-04/05, A04; Masterplan §9. Basis PR424415e5b7, CI beim Start laufend.
Nutzerziel: Einzelne Linie/Schraffur in2D über bestehendes On-Demand X/Y-Menü
bewegen, denselben vorbereiteten Patch wie freie Auswahlbewegung verwenden.
Normalfall positive/negative numerische Strecke; Grenzfall Maus weit seitlich und
hinter den gewählten Ursprung, Shift/Ortho dürfen die feste Achse nicht verändern.
Keine schräge Elementachse, Stretch/Wandkette, Wand-X/Y- oder3D-Migration.

Application selectionMoveInteraction besitzt feste horizontale Eingabebindung,
Vorbereitung, Kontext und vollständigen Commit; Domain besitzt Translation,
Geometry/Constraints Projektion/Fang. Project mit stabilen Geschoss-/Element-IDs
und Metern bleibt einzige Quelle, gepinnte Sichtbarkeit und ein Undo unverändert.
CadWorkspace/useSelectionMove leiten nur Achsenwahl weiter, keine Fachgeometrie.
Bestehendes PrecisionInput rendert feste Winkelbeschriftung und signierte Länge;
keine neue Tastatur-/Formular-/Fangimplementierung im Werkzeug oder Renderer.
Keine Schema-/Recovery-/Datei-/IFC-/AI-Migration, keine zweite Modellkopie.

Abnahme: exakte Patch-/Vollprojekt-/Commitgleichheit für Linie/Schraffur, ±/Null,
fremder Ursprung, Muster/Stil/Ebene, ungültiger/staler/ausgeblendeter Kontext,
Abbruch/Datei/ein UndoRedo. Fang bei Shift/Ortho/Snap aus und rückwärts,
gemeinsame numerische Eingabe/Mausklick, Vollsuite/Typen/Architektur/Lint/Build,
praktischer Browserablauf. Wiederholung vorhandener API-Messung, keine
Gesamtframe-/Native-Freigabe aus Mikrozeiten.

## Abschlusskarte

PR424 nach CI39656147211 grün in main be0c9b4 integriert. Der bestehende
selectionMoveInteraction erhält optional FixedPlanMoveAxis x/y. Derselbe vorbereitete
Translationszustand, Previewcache, vollständige Materialisierung und Publish-Guard
bleiben erhalten. Feste Achse wird im bestehenden querySnap gesetzt; Shift/Ortho
können sie nicht ersetzen. projectDirection projiziert freie Zeigerziele auf die
unendliche Achse, bereits gebundene Ziele behalten ihre exakte Koordinate.
Numerische Eingaben sind signiert; keine Polar-Halbgerade oder Winkeländerung.
Winkelanzeige über vorhandenes input.axisLabel/degrees nur lesbar. Auch direkte
Patch-/Bestätigungsaufrufe setzen die Achse durch. Numerische Winkeltexte können
die feste Achse nicht überschreiben. Ungültige Achskennungen werden abgewiesen.

useSelectionMove hält nur die konfigurierte Achse der Sitzung; CadWorkspace leitet
axis=x/y für Linie/Schraffur außerhalb Solid an diesen Weg. Einzelwand move und
3D-Z-Abläufe bleiben erhalten; Wand-x/y, schräge axis und Stretch bleiben Legacy.
Keine Renderer-Typabfrage, neue Modellkopie, Storage-/Schema-/Export-/AI-Migration
oder Architektur-Ausnahme. Zulässige Application→Geometry/Constraints/Core-Imports;
Architektur-Gate:377 Produktdateien,1490 interne Pfeile,null Zyklen.

1148 Tests, beide Typechecks, fokussiertes ESLint, Architektur-Gate und finaler
Produktbuild bestanden. Vier neue Kombinationen Linie/Schraffur×X/Y prüfen
±0,68/Null, ausgewählten fremden Ursprung, numerische Punktgleichheit zum alten
Adapter, exakte Muster-/Ziel-/Vollprojektgleichheit, Datei und ein UndoRedo;
Nullbewegung ohne History. Seitlicher/rückwärtiger Cursor mit Shift+Ortho und
Feature-Snap an/aus bleibt auf der gewählten Achse; bestehender gemeinsamer
Fangalgorithmus unverändert. Ungültige Zahlen, unsichtbarer/veralteter Kontext
veröffentlichen kein Ergebnis. Abbruch verändert Basis/History nicht.

Produktbrowser im Entwicklungsbuild auf8080: Linie X−0,68, Undo/Redo;
Y per stark seitlichem Canvas-Klick mit Shift, nur vertikale Bewegung.
Neue Mauerwerk-Schraffur X+0,68 über Tab/Länge/Enter, Undo/Redo, dann Y−0,68;
Winkel jeweils fest lesbar, Muster erhalten. Erneuter X-Start und Escape ohne
Verschiebung. Screenshot outputs/shared-fixed-xy.png im Aufgabenordner.
Recovery-Angebot nicht bestätigt, Autosicherung blieb pausiert. Keine neue
Browserdatei-/IFC-/Recovery-/Native-Langsession- oder kontinuierliche Frame-Abnahme.

## Begrenzte Laufzeitprüfung

Bestehende Diagnose mit --fixed-adapter erweitert, damit der echte Application-
Adapter statt nur der rohen Auswahlpatchfunktion gemessen wird. Vorbereitung
und Adapteranlage getrennt, erste plus8 warme Proben mit wechselnder Reihenfolge,
ein Prozess,10/100 Schraffuren à100 Punkten plus Linie. Alle72 vollständigen
Projekte und72 Zielgeometrien,72 signierte Numeric-Projekte/Punkte exakt gleich.
Acht tatsächliche Adapterbestätigungen und acht unabhängige DirectEdit-Commits
entsprechen dem Vollpfad; unabhängige DirectEdit-Undo/Redo-Prüfung enthalten.
Rohdaten benchmarks/shared-fixed-xy-results.json. Der Standardmodus der alten
Diagnose behält die explizite Anzeige schräger Projektionsabweichungen.

Warme Mediane bei100 Restschraffuren, ms Vollvorschau / tatsächlicher Adapterpatch:
LinieX36,22/0,06; LinieY35,58/0,05; SchraffurX69,98/0,40; SchraffurY68,58/0,40.
Unterschiedliche Ausgabeformen, fixe synthetische Fixture, Entwicklungsserver-
Hintergrundlast und Node/JIT/GC; kein Gesamtframe- oder allgemeiner Kapazitätsclaim.
Planableitung/React/DOM/Fang/Commit sind nicht Teil dieser Mikrozeiten.

Genau ein nächster Auftrag §9: gemeinsame Rechenreihenfolge für schräge
Elementachsprojektion vereinheitlichen, bevor „Element entlang Achse“ migriert.
Keine Toleranzlockerung oder separate projektions-/Fangregel pro Werkzeug.
