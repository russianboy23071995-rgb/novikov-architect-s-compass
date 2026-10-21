# Gemeinsame Einzelbewegung für Zeichnungen

## Änderungskarte vor Implementierung

Basis main 926c720 nach PR421, CI39652750361 grün. AUD14-04/05, A04.
Nutzerziel: Eine einzelne Linie oder Schraffur im Grundriss über „Element frei
bewegen“ mit derselben vorbereiteten Auswahlbewegung wie eine Wand verschieben.
Normalfall: Linie mit gewähltem Griff und numerischer Länge; Grenzfall:
Muster-Schraffur mit versetztem Ursprung, Abbruch und erneutem Start.
Keine neue 3D-Fähigkeit, keine axis/x/y/stretch-Migration.

CadWorkspace besitzt ausschließlich die UI-Weiterleitung. Autoritativ bleiben
Project/SelectionSet mit stabilen Geschoss-/Element-IDs und Metern. Vorhandene
Application-Auswahlbewegung besitzt Vorbereitung, Kontextprüfung und vollständige
Bestätigung, Domain die Translation. ToolInteraction besitzt Fang, Shift und
Winkel/Länge/Tab. Vorhandene History übernimmt genau einen bestätigten Schritt.
Keine neuen Importpfeile, Geometrieregeln, Modellkopien oder Storage-Schemata.
Datei/Recovery/IFC konsumieren weiterhin das bestätigte gemeinsame Modell.
2D-Plan verbraucht den vorhandenen Geometriepatch; 3D bleibt unverändert.

Abnahme: vorhandene Tests plus gezielte Einzelelement-Vergleiche mit Vollpfad,
Stil/Ebene/Musterursprung, Dateirundlauf, Abbruch, veraltete/ausgeblendete Ziele,
ein Undo/Redo; Typechecks, Architekturgrenze, Build, praktische 2D-Browserprüfung
und Wiederholung der 10/100-Diagnose. Gesamtframes/native Langsession offen.

## Abschlusskarte

CadWorkspace.startEdit leitet ausschließlich move für Linie/Schraffur außerhalb
des Solid-Viewports an denselben groupMove.begin-Aufruf wie Wände. Gewählter Anchor
oder editAnchor bleibt Ursprung. Keine neue Application-/Domain- oder Rendererlogik.
Shared GeometryPreview bleibt der Pointerpfad, vollständige Prüfung beim Platzieren.

1140 Tests bestanden, darunter zwei neue Einzelfälle: frei gewählter Ursprung,
Patch/Vollpfadgleichheit, Musterrotation/-ursprung, Stil/Ebene, Abbruch ohne Commit,
ein Undo/Redo und JSON-Rundlauf. Bestehende Kontext-/Sichtbarkeits-, Fang-, Shift-
und ToolInteraction-Regressionen bestanden. Beide Typechecks, fokussiertes ESLint,
Produktbuild und Architektur-Gate (377 Dateien, 1486 Pfeile, null Zyklen) bestanden.

Praktische Browserprüfung im Entwicklungsbuild auf localhost:8080: neue Linie
auswählen, frei bewegen, Canvas-Klick außerhalb des Eingabefensters platziert;
Undo/Redo. Neue Mauerwerk-Musterschraffur, frei bewegen, Winkel90, Tab zur Länge,
1 m, Enter; Muster bleibt erhalten, Undo nimmt nur Bewegung zurück, Redo stellt
sie wieder her. Erneuter Start und Escape ohne Änderung. Vorhandene lokale
Recovery-Angebote nicht bestätigt oder verändert, Autosicherung blieb pausiert.
Screenshot: outputs/single-drawing-move.png im Aufgabenordner. Kein neuer
Browser-Exportvergleich oder kontinuierlicher nativer Shift-/Hover-/Frame-Test;
Dateigleichheit und Fang-/Shift-Regeln automatisiert geprüft. Keine neue IFC-
oder Recovery-Migration, kein neuer 3D-Pfad und keine allgemeine Leistungsfreigabe.

Unveränderte API-Diagnose wiederholt: 36 vollständige Projekte und 36 scoped
Zielgeometrien exakt gleich. Warme Mediane bei 100 Restschraffuren: Linie33,58 ms
Vollpfad gegenüber0,04 ms Patch; Schraffur65,65 gegenüber0,38 ms. Bei10:4,93/0,065
und8,12/0,43 ms. Unterschiedliche Ausgabeformen; keine Gesamtframebehauptung.
Rohdaten benchmarks/single-move-results.json. Ein Prozess, feste synthetische
Fixture, Node/JIT/GC-Grenzen. Bisheriger unabhängiger Vollpfad bleibt Testreferenz.

Nächster Einzelauftrag ausschließlich Masterplan §9: Achsenaktionen abgleichen
und messen, bevor eine weitere Anbindung beschlossen wird.
