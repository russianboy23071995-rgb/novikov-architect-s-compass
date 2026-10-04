# Horizontale 3D-Arbeitsebene: Integrations- und Bedienentwurf

Stand 04.10.2026, geprüft auf 509d133 nach Freigabe von PR #70. Dieser Auftrag ändert nur Dokumentation. Die Produktvorschläge unten sind noch keine Nutzerentscheidungen.

## Codebefund

- BimSolidView zeichnet mit createProjectionFrame(solid) und gerundetem Backbuffer-Aspect. PointerUp ruft pickWall dagegen mit CSS-Breite/CSS-Höhe auf. Bei ungeraden Größen und DPR können beide geringfügig abweichen. Kein im Browser nachgewiesener Fehlklick, aber eine konkrete Abweichung im Code.
- pickWall prüft sichtbare Dreiecke samt Tiefe und Fensteröffnungen, liefert jedoch nur eine Wand-ID. Der an onSelect übergebene anchor sind Client-Pixel für das Menü, kein Modellpunkt.
- Linksziehen dreht derzeit die Kamera, im Pan-Modus verschiebt es die Ansicht. Ein Klick bis vier CSS-Pixel Bewegung wählt auf PointerUp; Pfeiltasten drehen, Rad und +/- zoomen. PointerCancel und Capture-Verlust beenden die Geste.
- CadWorkspace startet Wand-/Linienwerkzeuge teils ausdrücklich in 2D; Moduswechsel brechen Entwürfe ab. BimSolidView hat keine ToolInteraction-Anbindung und keinen Ebenen-Cursor.
- Gemeinsame Projektion, Inverse, lokale Suche, Ranking, Führungen, Hover und Referenz-Picking unterstützen jetzt ScreenMetric. Das ist noch keine vollständige 3D-Integration: Overlaypositionen, Quellensichtbarkeit, Gestenzuständigkeit und Projektionsrahmen müssen angeschlossen werden.
- buildSolid zeichnet Wände mit Öffnungen, keine allgemeinen Linien. Unsichtbare Linien dürfen nicht unbemerkt als neue 3D-Ziele angeboten werden. Das aktuelle XY-Modell unterstützt keine freie Fußpunkthöhe; erster Integrationsbereich bleibt z=0.

## Verbindliche technische Regeln

Ein Modell und dieselben validierten Application-Aktionen bleiben maßgeblich. Bauteilselektion, geometrischer Ursprung und Menüposition sind unterschiedliche Daten. Eine Wand-ID oder ein Bildschirmanker darf nicht als ausgewählter Modellpunkt ausgegeben werden. Ein später gewählter Ursprung wird sofort in der gemeinsamen Referenzverwaltung geschützt.

Renderer, Picking und Ebeneninverse müssen denselben Rahmen, Kamerastand und Render-Aspect verwenden. CSS bestimmt Zeigerkoordinaten und Fangradius; DPR nur die Auflösung. Vorschaugeometrie darf den gebundenen Rahmen eines Vorgangs nicht verändern. Eine ungültige Inverse liefert keinen bestätigbaren Punkt. Navigation und Wiederherstellung eines gültigen Blicks bleiben möglich. Modell-/History-/Ebenenwechsel invalidieren alte Ziele; Kameranavigation erhält Modellreferenzen und suspendiert den Erwerb.

Sichtbarkeit und Fangbarkeit müssen zusammenpassen. Navigation darf niemals zugleich eine Modellaktion bestätigen. Tab/Winkel/Länge verwenden weiterhin ToolInteraction; Modellwinkel werden nicht durch Bildschirmwinkel ersetzt. Keine zweite 3D- oder AI-Modelllogik.

## Produktvorschläge und offene Entscheidungen

| Thema | Empfehlung zur späteren Abstimmung | Alternative / Folge |
| --- | --- | --- |
| Ebene erkennen | Während eines Ebenenvorgangs dezente Kennzeichnung „XY · z=0“, temporäre Hilfslinien und hohle silbergraue Anker im bestehenden Stil | Dauerhaftes Ebenengitter möglich, aber visuell dichter; noch nicht beschlossen |
| Bewegungsursprung | Ausgewähltes Element bietet eindeutig benannte Fußpunkte auf z=0; erst deren Wahl startet den Vorgang | Wandflächenklick allein bleibt Elementauswahl; Oberpunkte nicht still nach unten projizieren |
| Verdeckte Ziele | Standardmäßig nur sichtbare Anker anbieten; gesonderter, ausdrücklich aktivierter Referenzmodus könnte verdeckte Quellen anzeigen | X-Ray oder durchscheinende Ebene müssen erkennbar und abschaltbar sein; keine automatische Freigabe |
| Kamera während Bearbeitung | Werkzeugklick und Navigation über expliziten Navigationsmodus trennen; nach Navigation Entwurf fortsetzen | Mitteltaste/Modifier wären schneller, benötigen aber ein einheitliches Konzept für 2D, 3D und Touch |
| Kein Werkzeug aktiv | Bestehendes Wand-Picking und Linksziehen zunächst erhalten | Eine globale neue Gestenbelegung wäre ein eigener Auftrag |
| Fast seitliche Ebene | Kleiner Hinweis „Arbeitsebene aus diesem Blick nicht eindeutig“, Cursorziel pausieren | Kein automatisches Drehen, kein erfundener Ersatzpunkt |

Diese Empfehlungen werden durch Freigabe des Dokumentations-PRs nicht automatisch zu einer Gesten- oder X-Ray-Entscheidung. Vor dem entsprechenden UI-Auftrag sind die betroffenen offenen Punkte konkret zu klären. Der folgende technische Schritt benötigt diese Entscheidungen nicht.

## Genau nächstes Umsetzungspaket: gemeinsamer Projektionsstand

Im Rendering-Adapter einen konkreten unveränderlichen Projektionsstand aus Rahmen, Kamera, CSS-Rechteck und tatsächlichen Backbuffer-Abmessungen erzeugen. BimSolidView soll für einen dargestellten Stand exakt diesen Rahmen/Aspect für Darstellung und Wand-Picking verwenden; die horizontale Inverse muss denselben Stand beziehen können. Bestehendes pickWall kompatibel halten, keine zweite Projektionsformel und keine leere allgemeine Szenenverwaltung.

Bei Resize, DPR- oder Kameraänderung Stand zusammenhängend erneuern. Bei verlorener Grafikdarstellung oder nicht passendem Stand keinen alten Treffer bestätigen. Der künftige Vorgangsrahmen muss als expliziter Eingabewert möglich sein; noch keine 3D-Modellaktion anschließen.

Abnahme: ungerade CSS-Größen, DPR 1/1,25/2, Hoch-/Querformat, Pan/Zoom/Orbit und Resize; projizierte bekannte Wandpunkte und Öffnungen müssen mit Picking übereinstimmen. Snapshot bleibt trotz Mutation externer Eingaben unverändert. Bestehende Inversen-/Pickingtests, gesamte Tests, TypeScript, Build und Lint bestehen. Browser: Wand wählen, durch Öffnung klicken, navigieren und Ansicht ändern. Keine geänderte Gestenbelegung, Fangoberfläche, Persistenz oder Modellmutation.

## Spätere Freischaltungskriterien

Vor 3D-Bearbeitung zusätzlich prüfen: sichtbare Quellen und Overlay, expliziter Ursprung, gemeinsame Quellenfilter, 600-ms-Erwerb/Lösen, Referenzerhalt bei Kameraänderung, ungültige Inverse, Modal-/Escape-Priorität und eine bestätigte Aktion mit Undo/Redo. Diese Liste ist kein paralleler Folgeauftrag; die Reihenfolge wird nach dem Projektionspaket neu abgeglichen.
