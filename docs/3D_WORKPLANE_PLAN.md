# Aktive horizontale 3D-Arbeitsebene — Arbeitsvertrag

Stand: 04.10.2026. Codebasis: `acc5c44` (PR #63, noch offen).
Dieser Auftrag verändert ausschließlich Dokumentation. Die nachfolgend vorgeschlagenen Schnittstellen und Bedienregeln sind nicht implementiert und keine vom Nutzer bereits entschiedenen Produktdetails.

## 1. Nachgewiesener Bestand

| Bereich | Vorhanden | Für eine Arbeitsebene fehlt |
| --- | --- | --- |
| `src/lib/bim/model.ts` | Meter, eine Geschoss-ID, XY-Wände und Linien; Wandhöhe und Fensterbrüstung | Geschosshöhe, beliebige Z-Koordinate für einen Wandfuß oder Zeichnungspunkt |
| `src/lib/bim/geometry.ts` | `buildSolid`, Z nach oben, orthographisches `projectPoint`; Zentrierung und Maßstab aus Solid-Grenzen | inverse Projektion auf eine Ebene, unabhängiger Projektionsrahmen |
| `src/components/cad/BimSolidView.tsx` | WebGL-Wände mit Öffnungen, Orbit/Pan/Zoom, Auswählen per Wand-ID | Arbeitsebenen-Cursor, Fangoverlay, ToolInteraction-Anbindung; Linien werden nicht als 3D-Geometrie gezeichnet |
| `src/lib/bim/picking.ts` | `pickWall` prüft projizierte Dreiecke und Tiefe, respektiert Öffnungen | kein Welt-Trefferpunkt; Wand-ID allein ist kein Bewegungsursprung |
| `src/application/tools/interaction.ts`, `snapping.ts` | gemeinsamer Ursprung, validierte Vorschau/Bestätigung, Werkzeugausschlüsse und Fangresolver | Rendering-Adapter für Ebenenkoordinaten aus 3D-Zeigerposition |
| `src/application/snapping/local-sources.ts` | Modell-Snapshotcache, lokale XY-Primitivsuche, volle Quellenvalidierung | projektionsabhängiges Suchgebiet und exakte CSS-Metrik |
| `src/constraints/snapping/*`, `inference/segment-hover.ts`, `src/rendering/viewport/reference-picking.ts` | Ranking, Hover und Picking mit skalarem Pixel-pro-Meter-Faktor | anisotrope Bildschirmabstände einer schräg gesehenen Ebene |
| `src/components/cad/CadViewport.tsx`, `CadWorkspace.tsx` | aktive Ansicht, getrennte 2D-/3D-Kamera, gemeinsames Modell | 3D ist heute primär Darstellung/Auswahl; Werkzeugstart/Einzelansicht und Moduswechsel führen teils zurück nach 2D bzw. brechen Entwürfe ab |

Der Stand ist keine perspektivische Kamera und kein 3D-Flächenmodellierer. Bestehende stabile Bauteil-IDs, Undo/Redo, Projektdateien und IFC bleiben maßgeblich. `pickWall` und Punktfang beantworten verschiedene Fragen: welches Bauteil ausgewählt wird und welcher geometrische Zielpunkt gemeint ist.

## 2. Verbindliche Grenzen aus der bestehenden Architektur

- Es bleibt genau ein autoritatives Modell. Arbeitsebene, projizierte Fangziele und Overlay sind abgeleitete Interaktionsdaten, keine zweite Bauteilkopie.
- Eine gemeinsame Fang-/Inferenzpipeline und dieselben validierten Application-Aktionen für Maus, Maßeingabe, Text/Voice/AI. Ein 3D-Adapter übersetzt Koordinaten und bindet den stabilen Zielkontext; keine eigene AI- oder 3D-Modellmutation.
- Meter und geometrische Winkel gelten in der Arbeitsebene. Ein in 3D verkürzt dargestellter rechter Winkel bleibt fachlich 90 Grad.
- Modellpunkte werden nicht durch Bildschirmrundung, UI-Pixel oder Rendererdreiecke ersetzt. Quellen tragen stabile Element-ID und Snapshot-Feature; zusammengesetzte Referenzen behalten ihre Abhängigkeiten.
- Geometrie kennt weder React noch BIM. Rendering verantwortet Kamera/Pixel/Picking, Application die zulässigen Quellen und Aktionen, Constraints das gemeinsame Fangverhalten.
- Keine neuen Geschosse, schrägen Ebenen, Bauteilarten, Persistenzversionen oder freien Z-Transformationen in diesem Paket. Das Skalierverbot für BIM bleibt unverändert.

## 3. Vorgeschlagener Ebenenvertrag für den ersten Einsatz

Start mit einer viewportbezogenen horizontalen XY-Ebene: Ursprung O=(0,0,0), U=(1,0,0), V=(0,1,0), N=(0,0,1). Ebenenkoordinaten (u,v) entsprechen damit heutigen Modellkoordinaten (x,y). Keine zusätzliche Höhensteuerung. Die Ebene bekommt eine stabile temporäre Identität; Kameraänderungen ändern diese nicht.

Die Mathematik darf eine feste horizontale Höhe h als Parameter testen. Produktiv ist zunächst ausschließlich h=0 zulässig: Das aktuelle Modell kann andere Fußpunkthöhen nicht ausdrücken. Eine spätere Geschossebene verwendet echte Geschossdaten und ist ein eigener Modellauftrag. Es gibt keinen stillen Rückfall einer nicht unterstützten Ebene auf z=0.

Ein `WorkplaneProjection`-ähnlicher Datensatz (Name vorgeschlagen, noch kein API) enthält: Ebenenidentität, Weltbasis, eingefrorenen Projektionsrahmen, CSS-Viewportgröße, denselben Aspect wie der Renderer, vorwärts/invers nutzbare affine Abbildung und einen strukturierten Gültigkeitsstatus. Kameraparameter sind nicht Teil der Modell- oder Ebenen-ID.

Für eine spätere Aktion bleibt die vorhandene `ToolInteraction` zunächst bei `Point2`: Bei h=0 liefert der Rendering-Adapter (u,v)=(x,y), dann folgen `resolveToolSnap`, Vorschau, `validate` und `commit`. Ausgewähltes Element, Modell-Snapshot und Ursprung werden bei Vorgangsbeginn gebunden. Eine Wandfläche anklicken liefert heute noch keinen exakten Ursprung: Erst ein sichtbarer, eindeutiger Fußpunkt/Arbeitsebenenanker darf diesen setzen; kein stilles Herunterprojizieren eines Wandoberpunkts.

## 4. Projektion und Zeigerabbildung

Die bestehende orthographische Projektion ist auf einer festen horizontalen Ebene affin:

`screen(u,v) = b + A * [u,v]` (CSS-Pixel, relativ zur Zeichenfläche).

A besteht aus den projizierten Einheitsrichtungen U und V; b ist der projizierte Ebenenursprung. NDC nach CSS: x=(ndcX+1)*Breite/2, y=(1-ndcY)*Höhe/2. Nur diese Darstellung kehrt Y um. Welt und Ebenenkoordinaten bleiben rechtshändig und in Metern.

Für invertierbares A wird die Mausposition durch `A^-1*(screen-b)` zurückgeführt. Kein Ray-Mesh-Treffer und keine Dreiecksebene als Ersatz. Die Begriffe Strahl/Ebene dürfen später dieselbe Schnittstelle erweitern; perspektivische Kameras sind jetzt nicht vorgesehen.

Renderer und Inverse müssen denselben Mittelpunkt, Radius, Aspect und Kamerastand verwenden. Aktuell stammen Mittelpunkt/Radius aus `Solid.min/max`; Vorschaugeometrie kann diese Grenzen verändern. Während eines Entwurfs ist deshalb ein gemeinsamer Projektionsrahmen zu binden, sonst wandert die Mauszuordnung mit der Vorschau. Bewusstes Fit/Modellwechsel erzeugt einen neuen Rahmen, Kameranavigation nur eine neue Abbildung innerhalb desselben Rahmens. Leere bzw. reine Linienprojekte brauchen definierte Grenzen; der heutige Solid-Fallback [0,0,0]–[1,1,1] ist darstellbar, aber keine automatische Zusage, dass entfernte Linien eingerahmt sind.

CSS-Pixel bestimmen Fangabstände. DevicePixelRatio bestimmt nur die Renderauflösung. Der Renderer nutzt derzeit gerundete Backbuffer-Abmessungen und deren Aspect: Die gemeinsame Abbildung muss exakt diesen Aspect berücksichtigen oder beide Verbraucher konsistent auf CSS-Aspect umstellen; getrennte Näherungen sind ausgeschlossen.

Bei seitlicher Ansicht kollabiert die XY-Ebene: In der aktuellen Kamera ist `pitch=0` singulär. Kein Clamp auf eine willkürliche Zielkoordinate. Vorgeschlagene Statusfälle: gültig, entartete/zu schlecht konditionierte Projektion, ungültige Parameter. Dann keine Punktbestätigung; Navigation bleibt möglich und vorhandene Referenzen werden lediglich pausiert. Ein numerischer Grenzwert für schlechte Konditionierung wird erst anhand Fehlerbudget und Tests festgelegt, nicht als Nutzerentscheidung erfunden.

Lesende Rechnung mit vorhandener `projectPoint`, Testgrundriss `docs/fixtures/reference-selection.json`, 800×600 CSS-Pixel, initialem Yaw/Zoom: Bei pitch=0 ist det(A)=0; bei pitch=0,3 rad sind die projizierten Einheitsachsen ungefähr 112,61 bzw. 63,13 Pixel lang. Dies belegt die ungleichen Maßstäbe, ist kein Performancebenchmark und kein neuer Projektionstest im Repository.

## 5. Gemeinsame Fangengine: notwendige Erweiterung, noch nicht Umsetzungspaket

Ein einziger Faktor `pixelsPerMetre` genügt in schräger Ansicht nicht. Der gemeinsame Resolver benötigt später einen rein numerischen Screen-Metric-Vertrag, etwa Vorwärtsabbildung, exakten CSS-Abstand und konservative Suchgrenzen. React/Kameraobjekte gehören nicht in Constraints. Der bisherige 2D-Faktor bleibt als isotroper Adapter mit identischen Ergebnissen erhalten.

Abhängigkeiten dieser späteren Integration:

1. Lokale Suche: Inverses Bild des CSS-Fangquadrats konservativ in ein Ebenen-AABB umschließen. Alternativ ist r/sigmaMin(A) eine sichere grobe Radiusgrenze. Diese dient nur der Vorauswahl; sie darf nicht Ranking oder exakten Fangradius ersetzen. Lange Segmente und Fangradiusrandfälle müssen enthalten bleiben.
2. Vor Dichtezählung und Paarbildung tatsächliche Bildschirmnähe der Segmentabschnitte prüfen. Sonst erzeugen stark verkürzte Ansichten falsche Dichtepausen oder unnötige Paarmengen. Keine globale Schnittpunktliste.
3. End-/Mittelpunkte und exakte Schnittpunkte bleiben Ebenengeometrie. Ranking, Hover-Erwerb/-Entfernung und manuelles Picking verwenden einheitliche CSS-Abstände. Bei einer Führung liefert eine euklidische Ebenenprojektion nicht zwingend den nächsten Bildschirmpunkt: für freie Näheprojektion auf Richtung d ist die Metrik G=AᵀA zu berücksichtigen, t=(dᵀG(p-o))/(dᵀGd). Fachliche Achsen, genaue Längen und Winkel bleiben in Modellmetern und sind keine Pixelprojektionen.
4. Shift-45°, Parallelen und Lotrechte meinen Modellrichtungen. Richtungswahl und Hysterese nicht auf Bildschirmwinkel umdeuten. Erst danach wird die wirksame Führung projiziert und ihre Nähe bewertet.
5. Entfernte aktive Referenzen separat über vollständige Snapshot-Quellen validieren. Dichtepause (>32, Rückkehr <=24/250 ms) und 600-ms-Erwerb sind unterschiedliche Regeln und bleiben gemeinsam implementiert. Vier zusätzliche Referenzen und separater Bewegungsursprung bleiben bestehen.

Alle Entfernungspfade erfassen: `candidates.ts`, Achsenkandidaten in `engine.ts`, lokale `near`-Prüfung, Segment-Hover, Referenz-Picking und Overlaypositionen. Nur einen neuen Abstand im Renderer einzubauen wäre unvollständig.

## 6. Lebenszyklus und Eingabe — vorgeschlagene Fortführung

| Ereignis | Verhalten beim späteren Anschluss |
| --- | --- |
| Ebenenbezogenen Vorgang starten | Modell/Element-ID/Ebene binden; exakten gewählten Ursprung sofort als geschützte Referenz setzen |
| Mausbewegung | CSS → Ebene → gemeinsame lokale Suche plus aktive Referenzen → Vorschau/Overlay |
| Tab, Winkel/Länge, Shift | bestehende ToolInteraction und Hilfseingabe; keine zweite Eingabeleiste oder Kopie der Tab-Logik |
| Orbit/Pan/Zoom/Resize | Erwerb während Navigation suspendieren, Cursor anschließend neu berechnen; Modellreferenzen behalten, Gültigkeit der Abbildung prüfen |
| Fast seitlicher Blick | keine Bestätigung aus ungültiger Inverse; Entwurf/Referenzen erhalten; gültiger Blick setzt fort |
| Ebene/aktive Ansicht/Layout wechseln | Entwurf abbrechen, temporäre Quellen verwerfen; kein Übertragen in eine andere Ebene ohne ausdrücklichen Vorgang |
| Modell/Undo/Redo/Laden | bestehende Snapshot-Invalidierung; alte Ereignisse nicht mehr übernehmen |
| Snap aus/ein | heutiger Vertrag: zusätzliche Referenzen löschen, geschützten Ursprung bei aktiver Aktion wieder anbieten; numerische Eingabe bleibt fachlich validiert |
| Escape | zuerst modaler Dialog, dann Mehrdeutigkeitsliste, dann Referenzauswahl, schließlich Werkzeugentwurf; keine doppelte Bestätigung/Abbruchwirkung |

Heute nutzt die 3D-Navigation Linksziehen und PointerUp zur Wandselektion. Die spätere Arbeitsebenenbedienung benötigt explizite gegenseitige Zuständigkeit: Navigationsgeste bestätigt nie ein Modell, Werkzeugklick ersetzt keine stabile Zielselektion. Konkrete Gestenwahl ist noch offen; bevor eine 3D-Modellaktion freigeschaltet wird, muss sie zur vorhandenen 2D-Bedienung passen. Die Ausblendung inaktiver Auswahlpanels aus PR #63 bleibt gültig.

## 7. Offene Produktdetails und spätere Grenzen

- Kennzeichnung/Einblenden der Ebene und ihrer Fußpunktanker; keine jetzt eingeführte permanente Leiste.
- Verdeckte bzw. hinter der Wand liegende Ebenenanker: Sichtbarkeit und Auswahl müssen zusammenpassen. Kein automatischer Fang unsichtbarer Punkte als stillschweigende Entscheidung. Auswahlmodus/X-Ray oder strikte Sichtprüfung sind Alternativen, hier nicht beschlossen.
- Kamera-Gesten während einer Aktion und Verhalten beim absichtlichen Fit. Der Projektionsrahmenvertrag ist technisch erforderlich; die konkrete Bedienung noch abzustimmen.
- Konkrete Schwelle für fast entartete Projektionen; abhängig von robustem Inversentest und maximal vertretbarer Weltkoordinatenabweichung.
- Perspektive, frei geneigte Ebenen, echte Z-Änderung, Geschosshöhen und Raumflächen gehören nicht zum ersten Anschluss. Keine neue Entscheidung über ältere offene Themen wie Wandachsenwechsel oder D/Strg+D.

Diese Fragen blockieren das nächste reine Projektionspaket nicht. Sie müssen vor Freischaltung der entsprechenden 3D-Modellbedienung geklärt sein.

## 8. Abgeschlossenes Umsetzungspaket

**Orthographische Vorwärts-/Rückprojektion für eine horizontale Ebene als gemeinsame, getestete Grundlage.**

- Vorhandene Projektionsrechnung ohne Verhaltensänderung aus `lib/bim/geometry.ts` in einen fachunabhängigen numerischen Projektionsbaustein unter `geometry/projections` überführen. `projectPoint` bleibt als kompatibler Wrapper und nutzt diesen Baustein; keine zweite Kameraformel im Arbeitsebenenadapter.
- Rendering-Adapter unter `rendering/viewport` bindet denselben Rahmen, Aspect und CSS-Rechteck an die horizontale Ebene und liefert Vorwärtsabbildung, Inverse und strukturierten Ungültigkeitsstatus. Eine konkrete numerische Fehlerschranke begründen und testen. Keine leeren Klassen oder neue allgemeine Ebenenverwaltung.
- Tests: Vorwärtswerte/Depth identisch zum bisherigen Renderer; Ebene→CSS→Ebene bei mehreren Yaw/Pitch/Zoom/Pan, Hoch-/Querformat, negativen Koordinaten, CSS-/Backbuffer-Verhältnissen und h=0 sowie festem h; pitch=0, NaN/Infinity, Nullabmessungen und beinahe singuläre Fälle sicher ablehnen. Konservatives inverses CSS-Suchrechteck auf enthaltene Randpunkte prüfen. Modellmutation ausgeschlossen.
- Bestehende Geometrie-/Pickingtests und gesamte Testsuite, TypeScript, Build, Lint. Browserabnahme beschränkt sich auf unveränderte 3D-Wanddarstellung/-Auswahl und Navigation, da der neue Arbeitsebenenadapter noch keinen UI-Verbraucher hat.
- Noch keine neue 3D-Modellaktion, kein Fang-Overlay und keine Erweiterung aller Fangmetriken in diesem Paket. Der Vorwärtsbaustein wird bereits produktiv vom existierenden Renderer verwendet; die geprüfte Inverse ist die konkrete Grundlage für die spätere gemeinsame Metrik-Anbindung.

Planungsabnahme: Keine Änderung unter `src` oder am Dateiformat; vorhandene 2D-/3D-Abläufe bleiben unverändert. Dokumentation und Pfade prüfen. Die 257 bestandenen Tests beziehen sich auf PR #63, nicht auf neu implementierte 3D-Funktionen.

## 9. Implementierungsnachweis — 04.10.2026

Abschnitt 8 ist umgesetzt: `geometry/projections/orthographic.ts` ist die gemeinsame Vorwärtsrechnung; `rendering/viewport/horizontal-workplane.ts` bindet den horizontalen Adapter. Renderer und Picking erzeugen den Rahmen einmal pro Aufruf. Der Adapter kopiert Kamera/Rechteck und friert seinen Rahmen ein; Vorschauen können ihn nicht nachträglich verändern. Ein späterer Verbraucher muss denselben festgehaltenen Rahmen und den tatsächlichen Renderer-Aspect liefern. Es gibt noch keinen 3D-Interaktionsverbraucher.

Die normalisierte 2x2-Matrix verhindert unnötigen Determinantenüberlauf. Das Verhältnis der Singulärwerte darf höchstens 1e6 sein; seitlicher Blick wird abgelehnt. Pro Rückrechnung wird zusätzlich 32 * Maschinen-Epsilon * (CSS-Größenordnung * Unendlichnorm der Inversen + Welt-Größenordnung) als konservative Rundungsreserve geschätzt. Sie berücksichtigt die Größen der Subtraktionen und die Verstärkung durch die Inverse; Ergebnisse über 1e-6 m werden abgelehnt. Der Sicherheitsfaktor deckt die kurze arithmetische Rechenkette in den getesteten Bereichen ab, ist aber kein formaler Intervallbeweis für beliebige IEEE-754-Eingaben. Gerätegenauigkeit, CSS-Quantisierung und ungenaue Quelldaten sind ausdrücklich nicht enthalten. Diese Grenze ist kein Fangradius und verändert keine Modellvalidierung.

Die vier inversen Ecken des CSS-Suchquadrats bilden dessen affines Parallelogramm. Seine um die Rundungsreserve erweiterte AABB ist nur Kandidaten-Vorauswahl; genaue Abstände müssen anschließend in CSS geprüft werden. Tests decken Randpunkte, negative Koordinaten, verschiedene Kameras, Zoom/Pan, CSS-Backbuffer-Rundung, h=0/h=3,2, Snapshot-Isolation und bewusst abgelehnte Extremwerte ab. 264 Tests/TypeScript/Build erfolgreich, ESLint ohne Fehler (sechs bekannte Warnungen); Browserprüfung der bisherigen Wanddarstellung und Auswahl bestanden. Der einzige aktive Folgeauftrag steht in DEVELOPMENT_PLAN.md.
