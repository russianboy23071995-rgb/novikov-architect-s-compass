# Einheitlicher Schraffurmuster-Versatz

## Änderungskarte

AUD14-04/05, A04, Masterplan §9. Basis PR423 c39c36d, CI beim Start laufend.
Nutzerziel: Muster-Schraffur im vollständigen und vorbereiteten Bewegungsweg mit
identischem delta exakt gleich verschieben. Normalfälle positive/negative/Null-
Translation; Grenzfall große Koordinaten mit abweichendem Musterursprung.
Keine feste Achsenanbindung, schräge Doppelprojektion weiterhin separat.

Geometrische Punktaddition gehört geometry/primitives/point.translatePoint.
Application-DirectEdit leitet die bestehende Translation unverändert an Kontur und
Muster weiter, Domain-prepared-translation verwendet dieselbe Punktaddition.
Ein autoritatives Projekt, stabile IDs und Meter, gepinnte Auswahl/Sichtbarkeit;
vorbereiteter Patch und unabhängige vollständige Commitprüfung, ein Undo/Redo.
Keine neue UI-Logik, generische Subsysteme, Modellkopie oder Rückabhängigkeit.
Keine Schema-/Datei-/Recovery-/IFC-/AI-Migration; bestätigte Modellwerte werden
weiterhin gemeinsam gespeichert. Linien/Wände/Windows fachlich unverändert.

Abnahme: exakte Patch-/Vollprojektgleichheit für freie/x/y-Translation und
signierte Numeric-Ziele; Papier/Modellmuster samt Rotation/Größe/Stil/Ebene erhalten,
Nullbewegung ohne History, Abbruch, ungültiger/staler Kontext, Datei/Undo/Redo.
Vollsuite, Typechecks, Architektur/Lint/Build und bestehende Achsendiagnose;
schräge Projektionsabweichungen ausdrücklich als offen melden. Keine
Gesamtframe-/Native-Leistungsfreigabe aus diesen Vergleichen.

## Abschlusskarte

PR423 nach CI39655273206 grün in main f9d47b3 übernommen. Vollpfad.applyPoints
erhält statt eines bloßen move-Tags den ursprünglichen Offset; die bestehenden
Wand-intent-Regeln werden daraus unverändert abgeleitet. Kontur und Musterursprung
verwenden translatePoint. Domain-prepared-translation verwendet denselben Helfer
mit unverändertem Endlichkeitscheck. Reshape erhält null und verschiebt das Muster
weiterhin nicht. Keine neue öffentliche Schnittstelle, Abhängigkeit zu UI/Storage,
Modellkopie, Importzyklus oder Architecture-Ausnahme. Ein neuer zulässiger
Domain→Geometry-Import; vorhandener Application→Geometry-Import erweitert.

1144 Tests, App-/Benchmark-Typecheck, fokussiertes ESLint, Produktbuild und
Architektur-Gate bestanden:377 Produktdateien,1487 interne Pfeile,null Zyklen.
Vier neue Tests mit36 Varianten: freie/x/y-Bewegung, −0,68/0/+0,68 m,
Modell-/Papiermuster, Koordinaten0/1e9, fremder Ursprung, Musterrotation37°,
Zellgröße/Stil/Ebene, exakte Patch-/Projektgleichheit, Dateirundlauf,
ein Undo/Redo; Nullbewegung erzeugt keinen Historyeintrag. Große Koordinaten
sind eine Regressionfixture, keine neue allgemeine Modellkapazitätszusage.
Vorhandene ungültige/veraltete/ausgeblendete Kontext- und Abbruchtests bestanden.

Bestehende Achsendiagnose unverändert nach Produktänderung wiederholt:
72/72 X/Y-Projekte und scoped Ziele sowie72/72 signierte Numeric-Projekte exakt
gleich, statt vorher8 X-Musterabweichungen. 12 echte DirectEdit-Commits mit
Undo/Redo entsprechen weiter exakt der Vollvorschau. Die36 schrägen Maus- und30
Numeric-Achsabweichungen bleiben wegen der erneuten Projektion offen; keine
Toleranzlockerung. Rohdaten benchmarks/hatch-translation-axis-results.json.
Reine API-Zeiten unter Entwicklungsserverlast; kein zusätzlicher Performanceclaim.

Browser am Entwicklungsbuild auf8080: neue Mauerwerk-Schraffur, vorhandene X-Aktion
−0,68 m, platzieren, Undo/Redo; anschließend freie Bewegung Winkel90°, Tab,
+0,68 m, Enter. Muster und Kontur bleiben gemeinsam sichtbar. Vorhandenes
Recovery-Angebot unberührt, Autosicherung weiterhin pausiert. Screenshot im
Aufgabenordner outputs/shared-hatch-translation.png. Keine neue Browserexport-,
IFC-/Recovery-/Native-/Langsessionabnahme; diese Adapter und Schema unverändert.

Genau ein nächster Auftrag in Masterplan §9: fester signierter 2D-X/Y-Adapter für
die gemeinsame Auswahlbewegung von einzelnen Linien/Schraffuren. Vorhandene
Projektion/ToolInteraction nutzen, keine freie Polar-Halbgerade als Ersatz.
Schräge Elementachsen erst nach explizitem Projektionsabgleich.
