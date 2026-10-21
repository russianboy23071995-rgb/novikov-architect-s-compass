# Achsenaktionen: Abgleich und Messung

## Änderungskarte vor Diagnosecode

AUD14-04/05, A04, §9. Basis PR422 dcdef79, CI noch laufend beim Start.
Nutzerziel: verbliebene Vollpfade für einzelne Linien/Schraffuren x/y/axis belegen
und sicheren gemeinsamen Nachfolger planen. Szenarien: positive/negative X/Y-
Bewegung und schräge Konturachse mit gewähltem Griff. Stretch/Wandketten/3D ausgenommen.
Application besitzt Sitzungen, Ursprung, signierte Abstände, Kontext/Commit;
Domain Translation; Renderer nur Patchverbrauch. Ein Modell, stabile IDs,
Meter, bestehende Sichtbarkeit/Fang/ToolInteraction und ein Undo bleiben maßgeblich.
Keine Produktänderung, neue Imports im Produkt, Storage-/Recovery-/IFC-/AI-Verträge.
Diagnose nutzt vorhandene öffentliche Application-/Geometry-APIs, keine zweite Regel.
Abnahme: vollständige Projekt-/Zielvergleiche, exakte Abweichungen offen ausweisen,
Vorbereitung getrennt, alternierende Messreihenfolge, zwei Prozesse, Typecheck/Lint
und vorhandene Auswahl-/DirectEdit-/Input-/Snap-Tests. Keine Frame-/Browserbehauptung.

## Codeabgleich

PR422 in main28db1af nach grüner CI39654061739 übernommen. CadWorkspace.startEdit
leitet nur move weiter; axis/x/y verbleiben in DirectEdit. DemandMenu bietet x/y
für Nicht-Fenster, axis wenn kein edgeIndex gesetzt ist. Linien/Schraffuren können
deshalb weiterhin den alten Vollpfad erreichen. Kein neu eingeführtes Produktverhalten.

editDirection in application/direct-edit/snapping.ts ist die bestehende Quelle:
x=(1,0), y=(0,1), axis=gewählter Punkt minus voriger Punkt (Index0: Nachbar1).
Gewählter anchor bleibt davon unabhängig. Bei Polygonen ist dies eine einzelne
Konturseite, keine geschätzte globale Hauptrichtung. resolveEditSnap projiziert
auf diese unendliche Gerade; DirectEdit projiziert axis nochmals beim Auswerten.
numericMoveAxis liefert normierte Richtung und Beschriftung; previewNumericMove
verwendet signierte Meter. Negative Werte sind gültig. editInteraction.input
enthält axisLabel/degrees, im Gegensatz zur freien polar gesteuerten Bewegung.

Gemeinsame selectionMoveInteraction besitzt bereits gepinnte Auswahl, Sichtbarkeit,
Patch, vollständige Materialisierung, Abbruch und Veröffentlichung über eine History.
Ihr initialAngle allein ist kein Ersatz für einen festen Achsenvertrag: polar.ts
begrenzt die Mausprojektion bei festem Winkel auf nichtnegative Entfernung und der
Winkel ist bearbeitbar. Eine Anbindung darf daraus keine einseitige Halbgerade
machen oder benachbarte Polygonseiten wechseln. Z-axisConstraint ist ein räumlicher
Vertrag mit anderer Koordinatenkodierung, kein beiläufiger Ersatz für diese 2D-Aktion.

## Befund zur Ergebnisgleichheit

Mausvergleich verwendet die vorhandene projectDirection-Projektion vor beiden
Wegen, wie im produktiven festen Fangpfad. Numeric verwendet previewNumericMove.
Vergleich mit dem gemeinsamen Patch/Materialisieren ohne zusätzlichen Achsenadapter
ist ein Kandidatenvergleich, kein bereits produktiver Achsenpfad.
Schräge axis-Ziele werden im Legacy-Pfad nochmals normiert/projiziert. Die zusätzliche
Gleitkommarechnung erzeugt Abweichungen in letzten Nachkommastellen.
Bei Musterschraffuren kann auch x abweichen: DirectEdit.applyPoints berechnet
Musterursprung als alter Ursprung + neuer erster Konturpunkt − alter erster Punkt;
prepared-translation als alter Ursprung + delta. Mathematisch identisch, numerisch
nicht für alle Eingaben exakt gleich. Dies betrifft auch die freien Translationswege
aus PR422: dessen konkrete bestandene Vergleichsfälle sind keine universelle
Bitgleichheitsgarantie. Kein sichtbarer Geometriefehler in dieser Fixture nachgewiesen.

Neue Achsenanbindung nicht freigegeben, solange exakte Gleichheit ungeklärt ist.
Keine Toleranzlockerung, Rundung oder zweite Geometrieregel als verdeckter Ersatz.
Zunächst gemeinsamen numerischen Vertrag der Musterverschiebung vereinheitlichen;
danach festen signierten Achsenadapter über dieselbe vorbereitete Auswahltranslation
planen. Erneute Projektion explizit berücksichtigen, nicht in React nachbauen.

## Messung und Abschlusskarte

benchmarks/drawing-axis-inventory.ts: 10/100 Schraffuren mit je100 Punkten plus
schräge Polylinie; je ein Ziel, x/y/axis, Index1, frei gesetzter Anchor.
Erste plus8 warme Proben je Profil, Vorbereitungszeit getrennt, Reihenfolge
Vollpfad/Patch wechselnd. Zwei serielle Prozesse. Je Prozess108 vollständige
Maus-Projektvergleiche,108 Zielvergleiche und108 signierte Numeric-Projektvergleiche.
44/108 Maus- und38/108 Numeric-Projekte nicht strikt gleich, in beiden Läufen
reproduzierbar; Maximum1,7763568394002505e-15 m. Keine nichtnumerische oder
strukturelle Abweichung; geprüft durch rekursiven Differenzvergleich mit Assertions.
Die Diagnose meldet Mismatches ausdrücklich, sie behauptet keine bestandene
Kandidaten-Gleichheitsabnahme. Numerische ±Werte und Null werden berücksichtigt.

Pro Prozess zusätzlich12 vollständige DirectEdit-Commits mit letzter Mausprobe
gegen die Vorschau verglichen, danach je ein Undo und Redo: exakt gleich.
Kandidat nur als Geometrie-/Projektvergleich, keine Veröffentlichung ins Produkt.
Rohdaten drawing-axis-results.json und drawing-axis-repeat-results.json.

Warme Mediane bei100 Restschraffuren, ms Lauf1/Lauf2:

| Ziel/Aktion | Vollprojekt-Vorschau | Auswahlpatch-Kandidat |
| --- | --- | --- |
| Linie X | 47,72 /45,40 | 0,052 /0,050 |
| Linie Y | 47,12 /46,26 | 0,051 /0,065 |
| Linie eigene Achse | 44,10 /43,87 | 0,049 /0,054 |
| Schraffur X | 94,82 /96,55 | 0,498 /0,445 |
| Schraffur Y | 93,09 /91,99 | 0,491 /0,529 |
| Schraffur eigene Achse | 85,62 /88,77 | 0,541 /0,583 |

Unterschiedliche Ausgabeformen, keine Gesamtframe-Prozentbehauptung.

101 vorhandene Auswahl-, vorbereitete Bewegungs-, Controller-, DirectEdit-,
ToolInteraction- und Snap-Tests bestanden; Benchmark-Typecheck und gezieltes Lint
bestanden. Keine Produktimports oder Architektur-Ausnahmen geändert; kein erneuter
Vollbuild/Browserworkflow für diese reine Diagnose. CPU-Mikrozeiten sind unter
laufendem Entwicklungsserver gemessen; Hintergrundlast, Node/JIT/GC und einzelne
synthetische Fixture schließen stabile Gesamtframe-/Native-Leistungsclaims aus.

### Weiterer Umfang

Nur Diagnose-/Dokumentänderung; kein Renderer, Application-/Domain-Produktcode,
Schema, IFC, Recovery, AI oder Historienverhalten verändert. Kein Browser-/Frame-
Nachweis benötigt oder behauptet. Ganze Achsenmigration, Stretch und Wandketten
bleiben außerhalb dieses Auftrags. Untracked dist-resource-browser ist Altbuild.

Unmittelbar: numerische Musterverschiebung in vollständigem und gemeinsamem
Translationspfad über denselben fachlich zuständigen Rechenweg vereinheitlichen,
positive/negative/Nullbewegung und großen Koordinatenbereich vergleichen;
Vorschau, Commit, Dateirundlauf und ein Undo erhalten. Kein UI-Redesign.
Danach fester signierter Achsenadapter, anschließend dessen Browserabnahme.
