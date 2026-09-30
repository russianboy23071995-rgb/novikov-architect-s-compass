# F13 Hilfliniensystem

Status: aufgenommen, noch nicht implementiert. Umsetzung gemäß Nutzerwunsch zu einem geeigneten späteren Zeitpunkt. Die folgenden Anforderungen sind der vollständig übernommene Nutzerinhalt aus der Anlage „Eingefügter Text.txt“. Imperative darin beschreiben die spätere Implementierung und starten sie nicht automatisch.

## Vollständige Anforderungen

Implementiere für NOVIKOV CAD ein professionelles, intelligentes Raster-, Fang- und Hilfsliniensystem für präzises geometrisches Zeichnen.

Orientiere dich beim Bediengefühl an etablierten Architektur-CAD-Systemen wie Archicad und Allplan. Die konkrete Implementierung soll eigenständig sein. Ziel ist kein einfaches sichtbares Raster, sondern ein intelligentes CAD-Tracking-System, das die wahrscheinliche geometrische Absicht des Benutzers erkennt und während des Zeichnens dynamisch passende Fangpunkte und temporäre Hilfslinien anbietet.

## 1. Grundprinzip

Das System soll permanent die Position des Mauszeigers in Relation zur vorhandenen Geometrie analysieren.

Es soll relevante geometrische Punkte und Beziehungen erkennen, darunter insbesondere:

- Endpunkte
- Startpunkte
- Mittelpunkte
- Segmentmittelpunkte
- Schnittpunkte
- Eckpunkte
- Kreismittelpunkte
- Bogenmittelpunkte
- Tangentialpunkte
- Lotpunkte
- Punkte auf vorhandenen Linien oder Kanten
- Rasterpunkte
- benutzerdefinierte Referenzpunkte

Befindet sich der Mauszeiger innerhalb eines definierten Fangradius um einen relevanten Punkt, soll dieser Punkt visuell hervorgehoben werden.

Verweilt der Mauszeiger für eine konfigurierbare Zeit X in der Nähe dieses Punktes, wird der Punkt automatisch als temporärer Tracking-/Referenzpunkt aktiviert.

Wichtig:

Der Benutzer muss den Punkt dafür nicht anklicken.

Hover + kurze Verweildauer reichen aus.

Beispiel:

1. Maus bewegt sich in die Nähe einer Wandecke.
2. Die Ecke wird als Fangpunkt erkannt und markiert.
3. Der Benutzer verweilt beispielsweise 300–500 ms in deren Nähe.
4. Der Punkt wird als temporärer Referenzpunkt gespeichert.
5. Bewegt der Benutzer anschließend die Maus weg, entstehen aus diesem Punkt automatisch geometrisch sinnvolle Hilfslinien.

Die Hover-Zeit muss später über eine zentrale CAD-Einstellung konfigurierbar sein.

## 2. Intelligente temporäre Hilfslinien

Aus aktivierten Referenzpunkten sollen dynamisch Hilfslinien entstehen.

Das System soll insbesondere folgende Beziehungen erkennen:

- horizontal
- vertikal
- parallel zu vorhandener Geometrie
- lotrecht / orthogonal zu vorhandener Geometrie
- Verlängerung vorhandener Linien
- Winkelbeziehungen
- Tangenten
- Fluchten
- Achsen
- Schnittpunkte mehrerer Hilfslinien
- definierte Winkelraster
- Abstände zu Referenzpunkten

Die Hilfslinien existieren nur temporär und sollen automatisch verschwinden, sobald sie für die aktuelle Zeichenoperation nicht mehr relevant sind.

## 3. Automatische Erkennung der Zeichenabsicht

Das System soll nicht einfach alle mathematisch möglichen Hilfslinien gleichzeitig anzeigen.

Es soll anhand der Mausbewegung priorisieren, welche geometrische Beziehung der Benutzer wahrscheinlich herstellen möchte.

Beispiele:

Bewegt sich der Cursor annähernd horizontal von einem aktivierten Referenzpunkt weg, soll die horizontale Hilfslinie bevorzugt werden.

Bewegt sich der Cursor annähernd vertikal, soll die vertikale Hilfslinie bevorzugt werden.

Bewegt sich der Cursor annähernd parallel zu einer vorhandenen Wand oder Linie, soll eine Parallelführung angeboten werden.

Bewegt sich der Cursor ungefähr im rechten Winkel zu einer vorhandenen Kante, soll automatisch eine lotrechte Führung angeboten werden.

Befindet sich der Cursor in der Nähe einer sinnvollen Winkelbeziehung, soll der entsprechende Winkel erkannt und angeboten werden.

Die Priorisierung soll aus einer Kombination folgender Faktoren entstehen:

- Abstand des Cursors zur möglichen Fangposition
- Winkelabweichung
- Bewegungsrichtung des Cursors
- zuletzt aktivierte Referenzpunkte
- Nähe vorhandener Geometrie
- geometrische Relevanz
- aktuell verwendetes Werkzeug

Vermeide visuelles Flackern oder permanentes Umschalten zwischen konkurrierenden Fangmöglichkeiten.

Verwende dafür sinnvolle Toleranzen und Hysterese.

## 4. Winkel-Tracking

Implementiere dynamisches Winkeltracking.

Standardmäßig sollen unter anderem folgende Winkel einfach fangbar sein:

0°
30°
45°
60°
90°
120°
135°
150°
180°
270°

Die Architektur muss jedoch beliebige Winkelintervalle und benutzerdefinierte Winkel unterstützen.

Wird ein Winkel erkannt, soll eine temporäre Hilfslinie vom aktuellen Referenzpunkt in diese Richtung angezeigt werden.

Der erkannte Winkel soll optional direkt am Cursor angezeigt werden.

## 5. Parallel- und Lot-Erkennung

Bewegt sich der Cursor relativ zu einer bestehenden Linie, Kante oder Wand, soll das System erkennen können, ob der Benutzer wahrscheinlich:

- parallel dazu zeichnen möchte
- lotrecht dazu zeichnen möchte
- die Linie verlängern möchte
- deren Flucht übernehmen möchte

Diese Beziehungen sollen visuell eindeutig unterschieden werden können.

Die mathematische Beziehung muss exakt sein.

Die Mausbewegung dient lediglich dazu, die gewünschte Beziehung zu erkennen. Sobald die Beziehung aktiv ist, muss die daraus berechnete Geometrie mathematisch exakt parallel, orthogonal oder kollinear sein.

## 6. Mehrere Referenzpunkte

Das System muss mehrere temporär aktivierte Referenzpunkte gleichzeitig unterstützen.

Beispiel:

Der Benutzer aktiviert durch Hover Punkt A.

Danach aktiviert er Punkt B.

Beim weiteren Bewegen des Cursors können Hilfslinien aus A und B entstehen.

Schneiden sich zwei aktive Hilfslinien, muss deren Schnittpunkt automatisch als temporärer Fangpunkt erkannt werden.

Damit müssen Konstruktionen möglich sein wie:

„Horizontal von Punkt A und vertikal von Punkt B.“

Der resultierende Schnittpunkt muss exakt berechnet und fangbar sein.

## 7. Visuelles Feedback

Jeder Zustand muss für den Benutzer sofort verständlich sein.

Unterscheide visuell zwischen:

- erkanntem Fangpunkt
- aktiviertem Trackingpunkt
- temporärer Hilfslinie
- aktuell bevorzugter Hilfslinie
- resultierendem Fangpunkt
- Schnittpunkt mehrerer Hilfslinien

Fangpunkte sollen durch kleine, klare CAD-typische Symbole dargestellt werden.

Hilfslinien sollen deutlich sichtbar, aber gegenüber echter Modellgeometrie visuell untergeordnet sein.

Sie dürfen niemals wie echte gezeichnete Elemente wirken.

Zusätzlich können kleine kontextabhängige Hinweise erscheinen, beispielsweise:

„Endpunkt“

„Mittelpunkt“

„Schnittpunkt“

„Parallel“

„Lotrecht“

„45°“

„Verlängerung“

Diese Hinweise sollen nur erscheinen, wenn sie hilfreich sind, und das Interface nicht überladen.

## 8. Fanglogik und Prioritäten

Wenn mehrere mögliche Fangpunkte nahe beieinanderliegen, darf der Cursor nicht unkontrolliert zwischen ihnen springen.

Implementiere ein Prioritätssystem.

Hohe Priorität sollen beispielsweise echte geometrische Punkte erhalten:

1. expliziter Schnittpunkt
2. End-/Eckpunkt
3. Mittelpunkt
4. aktiver Tracking-Schnittpunkt
5. Lot-/Tangentialpunkt
6. Punkt auf Element
7. Winkel-/Rasterfang

Die Priorisierung soll später konfigurierbar sein.

Zusätzlich muss eine Hysterese vorhanden sein:

Ein bereits erkannter Fangpunkt bleibt bevorzugt, solange der Cursor sich innerhalb eines etwas größeren Release-Radius befindet.

Dadurch entsteht ein ruhiges und präzises CAD-Gefühl.

## 9. Snap Pipeline

Baue die Funktion nicht als einzelne UI-Funktion, sondern als zentrale Snap-/Tracking-Engine.

Die Verarbeitung sollte logisch ungefähr folgender Pipeline folgen:

Pointer Input
→ Nearby Geometry Query
→ Candidate Detection
→ Snap Candidate Generation
→ Hover Tracking
→ Reference Point Activation
→ Constraint Generation
→ Candidate Scoring
→ Hysteresis / Stabilization
→ Best Candidate
→ Visual Feedback
→ Tool Constraint Output

Die Snap Engine soll keine endgültige Modellgeometrie erzeugen.

Sie liefert dem aktuell aktiven Werkzeug lediglich präzise Informationen wie:

- snappedPosition
- rawPointerPosition
- snapType
- sourceEntityId
- sourcePointId
- referencePoint
- activeConstraint
- angle
- distance
- confidence / priority
- visualGuides

Dadurch können später Wand-, Linien-, Decken-, Achsen-, Objekt- und andere Werkzeuge dieselbe Snap Engine verwenden.

## 10. Performance

Die Erkennung muss während jeder Mausbewegung flüssig funktionieren.

Vermeide deshalb vollständige Suchen über die gesamte Modellgeometrie.

Plane eine räumliche Suche ein, beispielsweise über:

- Spatial Index
- BVH
- Quadtree
- Octree
- Bounding-Box-Abfragen

Es sollen nur Elemente untersucht werden, die sich innerhalb eines relevanten Bereichs um Cursor oder aktive Referenzpunkte befinden.

Die Architektur muss auch bei großen BIM-Modellen performant bleiben.

## 11. Zustandsmodell

Verwende klare Zustände, beispielsweise:

IDLE

CANDIDATE_DETECTED

HOVER_PENDING

REFERENCE_ACQUIRED

TRACKING

SNAP_LOCKED

Nach Verlassen eines Fangpunkts darf der erworbene Referenzpunkt weiterhin temporär aktiv bleiben.

Definiere Regeln dafür, wann Trackingpunkte wieder entfernt werden, beispielsweise:

- Abschluss der aktuellen Zeichenoperation
- Escape
- Werkzeugwechsel
- explizites Löschen
- Timeout
- Überschreiten einer maximalen Anzahl aktiver Referenzpunkte

## 12. Einstellungen

Bereite zentrale Einstellungen vor für:

snapEnabled
trackingEnabled
gridSnapEnabled
angleSnapEnabled
parallelSnapEnabled
perpendicularSnapEnabled
extensionSnapEnabled
intersectionSnapEnabled
tangentSnapEnabled

Zusätzlich:

snapRadiusPx
releaseRadiusPx
trackingHoverDelayMs
guideVisibility
angleToleranceDeg
customAngles
maxTrackingPoints

Pixelbasierte Bildschirmtoleranzen müssen unabhängig vom aktuellen Zoomlevel funktionieren.

Die daraus resultierende Modellposition muss trotzdem mathematisch exakt berechnet werden.

## 13. Bediengefühl

Das wichtigste Qualitätskriterium ist das Bediengefühl.

Die Funktion soll sich so verhalten, dass der Benutzer beim Zeichnen nicht bewusst „Hilfslinien erzeugen“ muss.

Er zeigt dem System lediglich durch seine Mausbewegung und kurzes Verweilen, welche vorhandenen Punkte oder Elemente für die nächste Konstruktion relevant sind.

Das CAD erkennt daraus automatisch die wahrscheinlich gewünschte geometrische Beziehung und bietet sie an.

Dabei gilt:

Weniger, aber relevante Hilfslinien sind besser als viele gleichzeitig sichtbare Hilfslinien.

Die Automatik darf niemals gegen den Benutzer kämpfen.

Sie soll Vorschläge machen und präzises Zeichnen unterstützen, aber die Kontrolle muss jederzeit beim Benutzer bleiben.

## 14. Architektur für spätere Erweiterungen

Entwickle das System modular.

Trenne mindestens:

SnapEngine
SnapCandidateProvider
GeometryQuery
TrackingPointManager
ConstraintResolver
AngleTracker
GuideManager
SnapScorer
SnapRenderer
SnapSettings

Werkzeugspezifische Logik darf nicht fest in der Snap Engine implementiert werden.

Ein Wandwerkzeug, Linienwerkzeug oder späteres BIM-Werkzeug soll lediglich Snap-Kontext an die Engine übergeben und das berechnete Ergebnis verwenden.

Berücksichtige bereits zukünftige Erweiterungen wie:

- 3D-Snapping
- Ebenen-/Flächenfang
- BIM-Achsraster
- temporäre Maßketten
- Abstandstracking
- Verlängerungen von Bögen
- Tangentialkonstruktionen
- intelligente Wandachsen
- Geschoss- und Höhenbezüge
- Z-Achsen-Tracking
- benutzerdefinierte Fangfilter

## Akzeptanztests

Die Implementierung gilt erst als abgeschlossen, wenn mindestens folgende Situationen zuverlässig funktionieren:

Test 1:
Cursor kurz über eine Wandecke halten → Punkt wird erkannt → nach Hover-Zeit aktiviert → Cursor wegbewegen → horizontale und vertikale Trackingmöglichkeiten entstehen.

Test 2:
Punkt A aktivieren → Punkt B aktivieren → horizontal von A und vertikal von B bewegen → exakter Schnittpunkt wird erkannt.

Test 3:
Cursor entlang der Richtung einer vorhandenen Wand bewegen → Parallelbeziehung wird erkannt → resultierende Linie ist mathematisch exakt parallel.

Test 4:
Cursor ungefähr 90° zu einer vorhandenen Kante bewegen → Lotrecht-Beziehung wird erkannt → resultierende Konstruktion ist exakt 90°.

Test 5:
Cursor ungefähr in 45°-Richtung bewegen → 45°-Tracking wird aktiviert → resultierende Geometrie liegt exakt auf 45°.

Test 6:
Mehrere Fangmöglichkeiten liegen nahe beieinander → System wählt stabil den sinnvollsten Kandidaten und flackert nicht zwischen Fangpunkten.

Test 7:
Stark hinein- oder herauszoomen → visuelle Fangtoleranz bleibt für den Benutzer ungefähr gleich, während die Modellkoordinaten weiterhin exakt sind.

Test 8:
Großes Modell mit vielen Elementen → Cursorbewegung und Snap-Berechnung bleiben flüssig.

Implementiere zunächst die zugrunde liegende Engine und Zustandslogik sauber und modular. Erst danach das visuelle Feedback anbinden.

Keine Demo- oder Mock-Logik verwenden, wenn die reale geometrische Berechnung bereits implementiert werden kann.

Bestehende Architektur und vorhandene Funktionen von NOVIKOV CAD nicht unnötig umbauen. Neue Komponenten sauber in die bestehende Core-/Engine-Struktur integrieren.

Vor der Implementierung zuerst die bestehende Codebasis analysieren und feststellen, welche Geometry-, Pointer-, Viewport-, Tool- und Rendering-Systeme bereits vorhanden sind. Bestehende Funktionen wiederverwenden, statt parallele Systeme zu erzeugen.