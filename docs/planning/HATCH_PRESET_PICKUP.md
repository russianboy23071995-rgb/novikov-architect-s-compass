# V06a: Schraffur-Werkzeugvorgabenuebernahme

Stand 08.10.2026. Vorbereitungsauftrag, noch keine neue Bedienfunktion.
PR209 wurde nach erfolgreicher CI mit Nutzerfreigabe zusammengefuehrt.

## Verbindliche Nutzerentscheidung

Antwort vom 08.10.2026: "Nur Darstellung übernehmen, Ebene beibehalten".

Uebernommen werden ausschliesslich:
- fill.color und fill.opacity
- background.visible und background.color
- contour.visible und contour.color

Nicht uebernommen: layerId, id, points, Beziehungen oder Erstellungsmodus.
Die aktuelle Zielebene wird nicht von der Quelle ueberschrieben. Im jetzigen Code
ist das project.defaultLayerIds.line; ein eigener frei einstellbarer Schraffur-
Zielebenenstatus existiert noch nicht. Diese Planung fuehrt keinen solchen ein.
Die Entscheidung gilt fuer Schraffuren, nicht pauschal fuer andere Bauteile.

## Verifizierter Bestand

| Stelle | Befund | Konsequenz |
| --- | --- | --- |
| src/domain/elements/hatch/model.ts | Fill, Hintergrund, Kontur getrennt validiert | Darstellungstyp explizit auf diese Felder begrenzen |
| src/components/cad/CadWorkspace.tsx | hatchFill allein als Zeichenvorgabe | Vollstaendige Darstellungsvorgabe hinter kleinem Hook halten |
| src/application/drawing/actions.ts | Hatch-Request reicht nur fill weiter | Optionalen Hintergrund/Kontur-Pfad kompatibel ergaenzen |
| src/application/hatches/actions.ts | previewHatch kann alle Darstellungswerte; Default-Ebene line | Gemeinsame validierte Aktion weiterverwenden, Zielebene bewahren |
| src/components/cad/HatchControls.tsx | Fill/Paint-Felder bereits vorhanden | Felder gemeinsam fuer Inspector und Vorgaben verwenden |
| src/components/cad/PlanSceneRun.tsx | gemeinsame Ereignisadapter, bislang kein Rechtsklickpfad | Gesture einmal im Viewport behandeln, keine pro-Form-Gesten |

## Verbindliche Architekturgrenze

Eine reine Application-Funktion liest einen aktuellen sichtbaren Schraffur-Target
ueber stabile ID und gebundenen Projekt-/Sichtbarkeitskontext. Sie gibt eine eigene
Kopie nur der Darstellungswerte zurueck. Kein Spread des gesamten Elements.
Veralteter Kontext, geloeschte/verdeckte Quelle oder falscher Typ werden abgewiesen.

Ein UI-Vorgabenhook haelt diese sitzungsbezogenen Darstellungswerte. Die Uebernahme
aktiviert das Schraffurwerkzeug und zeigt Werte in Werkzeugeigenschaften. Sie erzeugt
weder Modellobjekt noch Undo-Eintrag. Die Quelle bleibt unveraendert. Kein Dateiformat-
wechsel oder dauerhafter Preset-Katalog in diesem Teilauftrag.

Polygon, Diagonalrechteck, Seite/Hoehe und Konturuebernahme muessen denselben
Darstellungssatz ueber createDrawing -> previewHatch verwenden. Endgueltige neue
Geometrie und neue ID kommen allein aus dem Zeichenvorgang. Validierung und genau
ein History-Schritt bleiben an dessen Abschluss. Text/Voice kann spaeter denselben
Application-Adapter mit stabilem Zielkontext aufrufen; kein eigener AI-Zweig.

## Genau ein Folgeauftrag: V06b begrenzte Umsetzung

Darstellungsuebernahme fuer Schraffuren implementieren. Zugaenglichen Menuebefehl
"Darstellung als Werkzeugvorgabe" und die gewuenschte doppelte Rechtsklickgeste
an denselben Adapter anbinden. Eine gemeinsame Ereignisbehandlung muss nur dasselbe
sichtbare Element im selben Kontext erkennen; kein Uebernehmen ueber zwei Elemente
hinweg oder waehrend Zeichnen, Navigation, Referenzauswahl oder Direct Edit.
Zeit-/Bewegungstoleranzen der Geste sind technische Implementierungsparameter;
nicht als bereits getroffene Nutzerentscheidung darstellen. Normalen Rechtsklick
und vorhandene Klick-/Doppelklickablaeufe beim Browser-Test ausdruecklich pruefen.

Vorgaben in Werkzeugeigenschaften sichtbar/editierbar machen; bestehende Fill/Paint-
Felder teilen. Legacy DrawingRequest-Aufrufer ohne neue Felder behalten Defaults.

Abnahme: Quelle mit abweichender Ebene, Fuellung, Hintergrund und Kontur waehlen.
Uebernehmen veraendert weder Quelle noch History. Alle vier Erstellungsarten ergeben
neue Schraffuren mit kopierter Darstellung auf unveraenderter Zielebene. Neue IDs,
unabhaengige Punkte, genau ein Undo-Schritt. Quelle spaeter aendern: bestehende
Vorgabenkopie bleibt unveraendert. Verdeckte/veraltete Quelle abweisen. Build,
passende Tests und Browser-Gestenpruefung; eigener PR zur Abnahme.

## Pruefung dieses Vorbereitungsauftrags

Codepfade und Nutzerentscheidung abgeglichen, Dokumentationsdiff auf Fehler geprueft.
Keine Produktionsdateien geaendert; Tests/Build nicht erneut ausgefuehrt. Die 712
Tests und erfolgreiche CI gehoeren zum zusammengefuehrten PR209, nicht zu einer
bereits implementierten Vorgabenuebernahme.
