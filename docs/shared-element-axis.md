# Elementachse über gemeinsame Auswahlbewegung

## Änderungskarte vor Implementierung

AUD14-04/05, A04, Masterplan §9. Basis PR426 `695e2af`, beim Start CI laufend;
anschließend CI39658711284 grün und nach main `3fb1943` zusammengeführt.
Nutzerziel: „Element entlang Achse“ für einzelne Linien/Schraffuren in2D verwendet
dieselbe vorbereitete Auswahltranslation wie move/X/Y. Normalszenario signierte
Strecke auf schräger Linie, Grenzfall andere gewählte Konturecke/fremder Ursprung,
weit seitlicher und rückwärtiger Cursor mit Shift. Keine Wandachsen-/Stretch-/
Wandketten-/3D-Migration oder neue Menüs.

Application numericMoveAxis/editDirection liefert Bindung aus gepinntem Modell,
Ziel-ID und Griffindex: rohe Konturrichtung, numerische Einheitsrichtung,
Winkel/Beschriftung. selectionMoveInteraction kopiert/prüft diese Bindung einmal;
Vorschau/Commit verwenden die vorhandene directionOffset-Query direkt. Geometry/
Constraints besitzen Projektion/Fang, Domain Translation. Ein Project, Meter,
Geschoss/ID/Ursprung/Sichtbarkeit, vollständige Endprüfung und ein Undo bleiben.
CadWorkspace/useSelectionMove reichen nur Query-Ergebnis weiter, Renderer ohne
Typdispatch. Bestehendes ToolInteraction/PrecisionInput besitzt Tastatur/Maus.
Keine neue Modellkopie, Schema-/Datei-/Recovery-/IFC-/AI-Migration.

Abnahme: exakte Adapterpatch-/Vollprojekt-/Commitgleichheit, verschiedene Griffe,
±/Null und Maus/Numeric, Muster/Stil/Ebene, ungültige Bindung/staler/unsichtbarer
Kontext, Abbruch/Datei/UndoRedo; Vollsuite/Typen/Architektur/Lint/Build. Tatsächlichen
Adapter diagnostisch messen und Linie/Musterschraffur im Browser praktisch prüfen.
Keine Frame-/Native-Gesamtfreigabe aus Mikrozeiten.

## Abschluss und Nachweis, 21.10.2026

Branch feat/shared-element-axis. Application-Query editMovementAxis pinnt die
bestehende numericMoveAxis-Abfrage und editSnapPolicy zusammen. Das ist für
Exaktgleichheit wesentlich: resolveEditSnap enthält die bestehende Nachprojektion
nach der Fangabfrage. Eine neu zusammengesetzte generische Fangabfrage würde diese
Arithmetik verändern. Rohvektor bleibt für directionOffset erhalten; normierte
Richtung dient nur der signierten Längeneingabe. Keine neue Fangregel.

selectionMoveInteraction kopiert und prüft die Bindung einmal und verwendet den
bereits vorbereiteten Auswahlpatch. CadWorkspace gibt lediglich das Query-Ergebnis
weiter. Vorhandene vollständige endgültige Validierung, Sichtbarkeits-/Stale-Schutz,
Abbruch und atomare History bleiben erhalten. Kein neuer Laufzeitzyklus, keine
neue Schichtausnahme, kein Format-/Recovery-/IFC-Vertrag geändert.

1153/1153 Tests bestanden; beide Typechecks, acht Architektur-Gate-Tests,
Produkt-Architekturprüfung (377 Dateien, 1491 Kanten, null Zyklen), fokussiertes
ESLint und Produktionsbuild erfolgreich. Die letzte Änderung war ausschließlich
ein expliziter Mutationstest-Cast für eine eingefrorene readonly-Position; danach
beide Typechecks und alle 33 selection/move-Tests erneut bestanden.

Regressionen vergleichen die tatsächlich angebundene Interaktion mit unabhängiger
ursprünglicher Arithmetik bei mehreren Griffen, ±/Null und Koordinaten bis 1e9,
einschließlich Fang unter Shift/Ortho. Fremder Kontext, falsche Richtung/Winkel,
unsichtbares Ziel, mutierter Aufrufer und Abbruch werden abgewiesen; vorhandene
Datei-/Historyvergleiche bleiben grün.

Diagnose: `node --experimental-strip-types benchmarks/drawing-axis-inventory.ts
--element-adapter`; Rohdaten benchmarks/shared-element-axis-results.json. Zwei
Größen × Linie/Schraffur × neun Ziele: je 36 vollständige Projekt-, Zielgeometrie-
und signierte Numeric-Vergleiche exakt; vier Adapter- und vier unabhängige
DirectEdit-Bestätigungen mit Undo/Redo entsprechen dem vollständigen Pfad.

| Restgröße | Element | Vollpfad warm Median ms | Adapterpatch warm Median ms |
| --- | --- | ---: | ---: |
| 10 | Linie | 5,013 | 0,065 |
| 10 | Schraffur | 8,188 | 0,408 |
| 100 | Linie | 48,104 | 0,059 |
| 100 | Schraffur | 94,658 | 0,674 |

Ein Vorbereitungslauf und acht warme Ziele, alternierende Reihenfolge;
Ergebnisprüfung außerhalb des Timings. Node24.19.0 auf Windows unter laufender
Entwicklungsserver-/Systemlast, kein isolierter Speedup-Beleg und keine Gesamtframe-,
GPU-, native Shift-Hover- oder Langsessionabnahme. Globale Commitprüfung bleibt.

Browser auf localhost8080, temporärer frischer Projektstand: schräge Linie mit
negativer Länge über Tab/Enter, Undo/Redo; zweiter Griff und seitlicher Shift-Klick.
Schräges Rechteck mit Mauerwerk-Schraffur, Griff2, −0,68 m entlang Konturachse,
Undo/Redo und erneuter Start/Escape. Kontur/Muster erhalten; Screenshot
outputs/shared-element-axis.png außerhalb des Repositorys. Recovery-Angebot nicht
übernommen und keine vorhandenen Nutzersicherungen verändert.

Restschuld: Punktstrecken, Wandachsen und Wandketten bleiben getrennt vom hier
abgenommenen 2D-Elementtransport; keine 3D-Freigabe daraus ableiten. Der einzige
nächste Auftrag steht in Masterplan §9.
