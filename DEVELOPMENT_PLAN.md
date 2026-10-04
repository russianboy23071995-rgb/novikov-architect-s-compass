# Entwicklungsplan NOVIKOV CAD

## Bedienkorrektur: Referenzen beim Zoomen erhalten — 03.10.2026

Aktive Hilfspunkte einschließlich konstruierter Schnittpunkte und ihre Richtungsführungen bleiben bei Kamera-/Zoomänderungen erhalten. Auch das Verlassen der Zeichenfläche zum Bedienen der Zoomtasten löscht sie nicht. Die Referenzen bleiben in Modellkoordinaten; Fangabstand und Ringdarstellung werden weiterhin aus dem aktuellen Bildschirmmaßstab berechnet. Eine laufende Hover-Verweildauer wird bei Navigation abgebrochen und beginnt beim nächsten Besuch neu. Escape, Ausschalten des Fangens und ein geänderter Modell-/Bearbeitungskontext verwerfen weiterhin die Referenzen. Keine Modellaktion oder Änderung an History, JSON oder IFC.

Nachweis: 187 Tests bestanden, TypeScript und Produktionsbuild erfolgreich; ESLint 0 Fehler und 6 bekannte Warnungen. Zwei neue Regressionstests prüfen Sitzungsidentität über Zoomstufen, explizite Invalidierung sowie unterbrochene Verweildauer ohne Verlust aktiver Punkte oder unbeabsichtigtes Umschalten. Browser: Referenzen (0;0), (3;0) und konstruierter Schnitt (1,5;1,5) bleiben mit drei Führungen beim Hinein-/Herauszoomen unverändert; Undo bleibt leer. Escape entfernt anschließend alle Referenzen und Führungen.

Praktische Abnahme: Punktfang einschalten, zwei Punkte jeweils 0,6 s anhovern und daraus einen Schnittpunkt aktivieren. Mit Mausrad oder Plus/Minus zoomen: Markierungen müssen erhalten bleiben. Escape löst sie gezielt. Dieser Nachtrag ersetzt frühere Protokollaussagen, nach denen Zoom Referenzen verwirft. Die Korrektur ergänzt PR #36; Nutzerfreigabe für PR #35/#36 gilt nach erfolgreicher Prüfung. Der einzige nächste Entwicklungsauftrag bleibt der unten beschriebene Schnitt externer Hilflinien mit festen Direct-Edit-Achsen.

## Bedienkorrektur: Hover 600 ms und Referenzen lösen — 03.10.2026

Nutzerkorrektur zu N08/Guide-F14: Standard-Verweildauer jetzt zentral 600 ms, sowohl im Workspace als auch im BimPlan-Fallback. Die vorhandene Einstellung bleibt verfügbar und gilt symmetrisch für Aktivieren und Lösen. Historische 400-ms-Angaben beschreiben frühere Stände.

Ein erneuter Besuch einer bereits aktiven Referenz entfernt nur diese nach vollständiger Verweildauer. Ein Besuch schaltet höchstens einmal: kontinuierliches Hover oder kleine Bewegungen innerhalb desselben Fangpunkts aktivieren/entfernen nicht wiederholt. Erst Verlassen des Punktes oder Wechsel auf eine andere Quelle ermöglicht einen neuen Vorgang. Unterbrochene Verweildauer beginnt neu; andere Referenzen und ihre Aktivierungsreihenfolge bleiben erhalten. Gelöste Punkte erzeugen keine temporären Führungen mehr; normaler Endpunktfang bleibt möglich. Kein History-/Projektdateieintrag für Hover.

Geändert: constraints/inference/hover-reference.ts, Standardwerte in CadWorkspace/BimPlan, Regressionstests und dieses Protokoll. 158 Tests bestanden, TypeScript/Build erfolgreich; ESLint null Fehler/sechs bekannte Warnungen. Tests: vor 600 ms kein Umschalten, genau einmal bei Erreichen, dauerhaftes Hover, Unterbrechung, Wiederaktivierung und Erhalt anderer Referenzen. Browser: Standard 0,6 s sichtbar; Ring aktiviert, durch erneuten Besuch gelöst, bei weiterem Hover weiter gelöst.

Abnahme: Snap einschalten, Punkt 0,6 s anhovern → silbergrauer Ring. Zeiger weg und wieder 0,6 s darüber → Ring weg. Dort verbleiben → bleibt gelöst. Nach erneutem Verlassen wieder aktivierbar. In einer bereits offenen Sitzung kann die bisherige Zeiteinstellung erhalten bleiben; im Linienwerkzeug auf 0,6 s stellen, ohne das Projekt neu zu laden.

Dieser frühere Folgeauftrag wurde durch die unten dokumentierte Nutzerpräzisierung auf mausgeführte 45°-Schnittpunkte eingegrenzt und umgesetzt.

## Aktiver Planungsstand — Funktionsumfang 03.10.2026

Der Nutzerentwurf [Funktionsarchitektur](NOVIKOV_FUNKTIONSARCHITEKTUR_2026-10-03.md) erweitert den bisherigen Guide. [FUNCTION_REQUIREMENTS_2026-10-03.md](FUNCTION_REQUIREMENTS_2026-10-03.md) ordnet alle N01–N60 dem Code, alten Anforderungen und Abhängigkeiten zu. ARCHITECTURE.md §29–30 dokumentiert die begrenzten verbindlichen Ergänzungen; weitere Datenfelder/Typdiagramme bleiben Vorschläge. Die PDF selbst wurde nicht separat gelesen. Bisherige Guide-F01–F29 und Gesprächswünsche bleiben erhalten.

Geprüfter Code: 3bbe2dd auf feat/direct-edit-shared-snap, zwei Commits seit Review-main dd3e358. Numerische Fangtoleranz (ef3241d, PR #27) und gemeinsame Direct-Edit-Fangauflösung (3bbe2dd, PR #28) sind umgesetzt und brauchen keinen erneuten Implementierungsauftrag. 149 Tests im Dokumentationsauftrag erneut bestanden. Keine Quellcodeänderung, neue Bauteile, Dateimigration, PDF-Zerlegung oder Layoutimplementierung. Frühere Build-/Lint-/Browsernachweise bleiben als solche datiert erhalten.

**Dieser Abschnitt ist die einzige aktive Auftragsreihenfolge.** Sämtliche darunterstehenden „nächster Schritt“-Formulierungen und Auftragslisten sind historische Protokolle ihrer jeweiligen Stände, keine zusätzlichen aktuellen Folgeaufträge. Die Pakete A–L des Entwurfs und die N-Matrix sind Backlog und Abhängigkeiten.

### Abschluss: gemeinsame Fang-Kandidaten und Rangfolge — 03.10.2026

PR #29 wurde mit Nutzerfreigabe als normaler Merge 655c5f1 in feat/direct-edit-shared-snap übernommen. PR #27/#28 bleiben offen; main wurde nicht geändert. Dieser Funktionsschritt basiert auf dem freigegebenen Dokumentationsstand.

constraints/snapping/candidates.ts erzeugt Endpunkte, Richtungsführungen und vorhandene HV-Schnittpunkte ohne rekursive querySnap-Abfragen. Aktive Referenzen werden einmal gegen den aktuellen Quellenstand exakt validiert und dedupliziert. Eine nichtleere activeReferences-Liste ist maßgeblich; activeReference bleibt der Legacy-Fallback ohne Liste. Modelladapter und öffentliche querySnap-Signatur bleiben unverändert. Raster bleibt der bisherige Fallback; explizites Shift wird vor automatischen Kandidaten aufgelöst.

ranking.ts definiert die technische Rangentscheidung: Priorität → Bildschirmabstand → neueste Aktivierung (bei Schnittpunkten beide Aktivierungsränge absteigend) → vollständige geordnete Quellen-Tupel → Fangart → projizierte X-/Y-Koordinaten → Winkel. Artgleichstände: Verlängerung vor Lotrecht vor Horizontal vor Vertikal vor Winkel. Zeichenketten werden ohne Locale verglichen. Bei ansonsten identischen Ergebnissen ist die Reihenfolge ohne fachliche Bedeutung.

Bewusste Änderungen bei Gleichstand: neu aktivierte Quelle gewinnt statt impliziter Erzeugungsfolge bzw. bisherigem sourceFeature.localeCompare. Endpunkte berücksichtigen ebenfalls Aktivierung vor Quellen-ID. Richtungsreihenfolge im Modelladapter entscheidet nicht mehr über gleichwertige Richtungen. Höherer Vorrang und geringerer Abstand gewinnen weiterhin vor Aktualität. Schnittpunkte behalten beide Herkunftspositionen; intern werden beide Quellen getrennt verglichen statt verkettete Strings als Identität zu benutzen.

Prüfung: 156 Tests bestanden, darunter sieben neue Tests. Drei neue Regressionsfälle schlugen am alten Stand fehl (neuere Guide-Quelle, Endpunkt-Aktivierung und beide Schnittpunktquellen). Weitere Fälle prüfen Duplikate/stale Quellen, vollständige Identität trotz Trennzeichen, Richtungsreihenfolge und Priorität/Abstand bei 25/100/400 px/m. Bestehende Toleranz-, Direct-Edit-, JSON-/History-, Voice-/Stale-Context- und IFC-Tests bleiben grün. TypeScript und Build erfolgreich, ESLint null Fehler/sechs bekannte React-Refresh-Warnungen. Keine UI-, Modell- oder Dateiformatänderung, keine Leistungszusage.

Browser: Zwei Wandachsenden in Reihenfolge aktiviert; beim Linienzeichnen und freien Linienbewegen stammt die Verlängerung vom neueren Punkt. Vorschau/Commit identisch, Undo/Redo geprüft. Wechsel von rund 105 auf 50 px/m verwirft Referenzen, exakter Endpunkt wird innerhalb von 10 CSS-Pixeln erkannt; Escape verwirft die Bearbeitung. Screenshot lokal: outputs/snap-ranking-direct-edit.png.

Abnahme: Snap einschalten, zwei Endpunkte derselben horizontalen Wand nacheinander je 0,4 s anhovern. Weiter entlang der gemeinsamen Flucht zeigen: Die Hilfslinie beginnt am zuletzt aktivierten Punkt. Beim Linienzeichnen und im Menü „Element frei bewegen“ wiederholen, bestätigen und Undo/Redo prüfen.

### Abschluss: mausgeführte 45°-Hilfslinien und konstruierte Referenzen — 03.10.2026

Die Nutzerpräzisierung ersetzt den zuvor breiter geplanten Geradenschnitt-Auftrag: Von jedem aktiven Hilfspunkt wird die zur Maus nächstgelegene 45°-Schrittrichtung angezeigt, silbergrau gestrichelt und über die Mausprojektion hinaus verlängert. Nichtparallele Führungen bilden innerhalb von 10 CSS-Pixeln einen Schnittpunktkandidaten. Nach standardmäßig 600 ms wird dieser als zusätzlicher Hilfspunkt aktiviert, erzeugt selbst Führungen und lässt sich bei erneutem Besuch nach derselben Verweildauer lösen. Der Ablauf funktioniert auch ohne Zeichenwerkzeug. Echte Endpunkte behalten Vorrang; explizites Shift/Ortho und die gemeinsame Kandidatenrangfolge bleiben erhalten.

Gemeinsame Mathematik in geometry/intersections/lines.ts mit dimensionsloser Paralleltoleranz in geometry/tolerances/direction.ts; Richtungswahl in constraints/guides/directions.ts; temporäre Konstruktion und exakte Quellenprüfung in constraints/inference/construction-reference.ts. BimPlan zeichnet nur abgeleitete Führungen; useHoverReference liefert Maus/Zeit. Linie, Wand und Direct Edit verwenden weiterhin querySnap. Konstruierte Referenzen speichern ihre ursprünglichen Modellquellen flach, sodass verkettete Hilfspunkte keine rekursiven Modellkopien bilden. Verschobene/entfernte Quellen werden verworfen. Keine neue Modellaktion, keine Dateimigration oder separate AI-Logik.

Prüfung: 164 Tests bestanden, darunter sechs neue Fälle zu schrägem Schnitt, parallelen/kollinearen/ungültigen Richtungen, nächster 45°-Richtung, 25/100/400 px/m, Prioritäten und Constraints, 599/600-ms-Aktivierung/Lösen, verketteten/veralteten Quellen sowie Zeichnen mit genau einem Undo-Schritt und JSON-Rundlauf ohne Hilfspunkte. TypeScript und Build erfolgreich, ESLint null Fehler/sechs bekannte React-Refresh-Warnungen. Browser: zwei Wandachsenden aktiviert, diagonaler Schnitt als dritter Ring markiert, weitere Führung vom neuen Punkt, erneutes Lösen geprüft. Linie beginnt exakt bei (1,5 m; 1,5 m); Undo entfernt, Redo stellt sie wieder her. Screenshot: outputs/guide-intersection-hover.png.

Abnahme: Snap einschalten. Bei einer horizontalen 3-m-Wand beide Achsenden nacheinander je 0,6 s anhovern. Zeiger etwa 1,5 m oberhalb der Wandmitte halten: zwei diagonale Führungen kreuzen sich, danach erscheint der dritte Referenzring. Wegbewegen und neue Führungen vom Hilfspunkt prüfen; zurückkehren und 0,6 s warten löst ihn. Dasselbe beim Linienzeichnen testen und Linie mit Undo/Redo prüfen.

Grenzen: weiterhin höchstens vier aktive temporäre Referenzen; keine dauerhaften Punktbauteile, kein History-/Projektdateieintrag für Hover. Verlassen der Zeichenfläche, Kamera-/Modell-/Sitzungswechsel verwerfen Referenzen wie bisher. Beliebig schräge Verlängerung/Lot-Schnittpunkte, echte Segmentschnitt- und Mittelpunktfangarten sowie aktive 3D-Arbeitsebenen bleiben Backlog; bestehende einzelne Verlängerungs-/Lotführungen bleiben verfügbar. Kein Anspruch auf vollständige Guide-F14-Umsetzung.

### Abschluss: stabile Richtungswechsel der 45°-Hilfslinien — 03.10.2026

PR #32 wurde mit ausdrücklicher Nutzerfreigabe als normaler Merge 8770895 in seinen bisherigen Zielzweig feat/hover-reference-toggle übernommen. main bleibt unverändert. Dieser Folgeschritt baut auf diesem Merge auf.

constraints/guides/directions.ts führt eine reine Zustandsfortschreibung je aktiver Quelle ein. Vorläufiger technischer Bedienwert: 5° Hysterese zusätzlich zur halben 45°-Stufe. Eine horizontale Führung wechselt somit erst über 27,5° nach diagonal; zurück wechselt sie unter 17,5°. Die Winkelberechnung behandelt den Übergang 360°/0° korrekt; direkt auf dem Referenzpunkt bleibt die Richtung erhalten. Quellenidentität umfasst ID, Feature und exakte Position; entfernte Quellen verlieren ihren Richtungsverlauf.

useHoverReference hält den flüchtigen Verlauf im vorhandenen Ansichtskontext. Escape/Verlassen, Snap aus, Kamera-/Modell-/Sitzungswechsel verwerfen ihn zusammen mit den Referenzen. BimPlan-Darstellung, Hover-Schnittpunkterwerb und querySnap erhalten dieselben Richtungsdaten; Direct Edit reicht den gemeinsamen Kontext durch. Die Stabilisierung betrifft die mausgeführten 45°-Hilfslinien und ihre Schnittpunkte, nicht die explizite Shift-Richtung oder die Rangfolge sonstiger Fangarten. Keine Modell-, History-, IFC- oder Dateiformatänderung.

Prüfung: 168 Tests bestanden (vier neue Fälle: alle acht Winkelgrenzen mit Hin-/Rückweg, getrennte Quellen und Identitätswechsel, Anzeige/Schnittpunkt/Radius/Shift/Ortho sowie Direct-Edit-Commit/Undo/Redo/JSON). TypeScript und Build erfolgreich; ESLint null Fehler/sechs bekannte React-Refresh-Warnungen. Browser beim Linienzeichnen und freien Linienbewegen: 20° → 24° bleibt horizontal, 28° wechselt auf 45°; Rückweg über 22° bleibt diagonal, 17° schaltet zurück. Zwei Referenzen erzeugen weiterhin den nach 600 ms erworbenen dritten Hilfspunkt. Freie Linienbewegung auf (1,5; 1,5) bestätigt, Undo/Redo geprüft. Escape, Modell-Commit, Kamerawechsel und Snap aus räumen Führungen auf. Screenshot: outputs/guide-hysteresis-direct-edit.png.

Praktische Abnahme: Wandachsende 0,6 s aktivieren; Zeiger zunächst ungefähr 20° oberhalb der Horizontalen halten und langsam über 22,5° bewegen. Kleine Bewegungen sollen die Führung nicht umschalten; erst ungefähr 28° bewirken den Wechsel. Zurück unter ungefähr 17° wechseln. Beim freien Bewegen einer Linie mit externem Wandpunkt wiederholen und per Escape abbrechen. Der 5°-Startwert kann nach Bedienfeedback angepasst werden; keine behauptete vollständige Hysterese für sämtliche Fangarten.

### Abschluss: gemeinsamer Mittelpunktfang — 03.10.2026

Aufbauend auf PR #33 / 3fad40a; PR #33 bleibt offen und wurde durch den Fortsetzungsauftrag nicht automatisch zusammengeführt. Neue Implementierung auf feat/shared-midpoint-snap.

Geometrie berechnet den Mittelpunkt eines endlichen, nicht entarteten Segments. Der gemeinsame Projektadapter liefert einen Mittelpunkt je Wandachse und je vorhandenem Linien-/Polyliniensegment; keine künstliche Schließkante und keine zusätzlichen Wandflächen-Mittelpunkte. Identität: stabile Element-ID plus Segmentbezeichnung und Endpunkt-Snapshot. Damit wird auch eine Drehung oder Streckung um denselben Mittelpunkt als veränderte Quelle erkannt. Diese Referenzen sind abgeleitet und nicht im Projekt gespeichert.

SnapCandidate kennt jetzt midpoint. Explizite Rangregel: Endpunkt (0) vor Mittelpunkt (0,25) vor Hilflinienschnitt (0,5), dann einzelne Führungen und Raster. Innerhalb einer Fangart gelten weiterhin Abstand, Aktivierungsreihenfolge und deterministische Quellenordnung. Der Radius bleibt 10 CSS-Pixel; bei sehr kurzen Segmenten kann ein naher Endpunkt den Mittelpunkt überstimmen, bis ausreichend hineingezoomt wird. Shift/Ortho und explizite Editachsen behalten Vorrang.

Die gemeinsame Hover-Verwaltung aktiviert und löst Mittelpunkte nach derselben eingestellten Zeit, standardmäßig 600 ms. Sie liefern Verlängerungs-, Lot- und mausgeführte 45°-Hilfslinien samt Schnittpunkten. BimPlan kennzeichnet Mittelpunktfang mit ungefülltem Dreieck und Beschriftung; der aktive Referenzring bleibt erhalten. Keine zusätzliche Werkzeuglogik, Modellaktion, Dateimigration oder AI-Modelllogik. Eigene Elemente und Fensterhosts bleiben im Direct Edit ausgeschlossen.

Nachweise: 173 Tests bestanden, darunter fünf neue Gruppen in constraints/snapping/midpoint.test.ts (Geometrie/ungültige Werte, Adapter/Segmentidentität, Zoom/Priorität/Constraints, Hover/Guides, Zeichnen/Direct Edit/Undo/JSON). Zwei bestehende Adapter-Anzahltests wurden um die zusätzlichen Mittelpunkte aktualisiert. TypeScript und Build erfolgreich; ESLint null Fehler/sechs bekannte React-Refresh-Warnungen. Browser: Marker ohne Zeichenwerkzeug, 600-ms-Aktivierung, Lotführung und erneutes Lösen; Linie beginnt exakt bei (1,5; 0) an der 3-m-Wand, Undo/Redo geprüft. Freie Linienbewegung fängt externen Wandmittelpunkt und lässt sich rückgängig machen/wiederherstellen. Screenshot: outputs/midpoint-hover.png.

Abnahme: Snap aktivieren und die Mitte der Wandachse oder eines Liniensegments anfahren. Dreieck/Mittelpunkt prüfen; 0,6 s verweilen, dann seitlich wegbewegen und Hilfslinie beobachten. Zurückkehren und 0,6 s warten löst die Referenz. Eine Linie dort beginnen oder eine andere Linie über das On-Demand-Menü dorthin bewegen; Undo/Redo prüfen. Bei kurzen Linien hineinzoomen, falls der Endpunkt Vorrang erhält.

### Abschluss: echte Segmentschnittpunkte — 03.10.2026

PR #34 wurde mit ausdrücklicher Nutzerfreigabe als normaler Merge 96c33de in seinen bisherigen Zielzweig feat/guide-direction-hysteresis übernommen. main bleibt unverändert. Der neue Schritt baut auf diesem Merge auf.

geometry/intersections/segments.ts prüft eindeutige Schnitte innerhalb beider endlicher Segmente mit der zentralen numerischen Toleranz. Degenerierte/nichtendliche Strecken, bloße Geradenverlängerungen und Überlappungen erzeugen keinen Fangpunkt; eindeutige Endberührungen bleiben möglich. constraints/snapping/segment-references.ts bildet Quellenpaare deterministisch. Der Projektadapter stellt Wandachsen und vorhandene Linien-/Polyliniensegmente bereit, einschließlich Selbstkreuzungen einer Polylinie. Keine Wandflächenverschneidung oder Änderung des BIM-Modells.

Beide Segmentquellen bleiben als exakte Geometrie-Snapshots erhalten. Das erlaubt Invalidierung nach Verschieben/Drehen/Strecken sowie Ausschluss jeder Kreuzung, an der ein bearbeitetes Element oder dessen Fensterhost beteiligt ist. Ableitung erfolgt bei verändertem Modell über den bestehenden memoisierten Adapter, nicht pro Mausbewegung. Aktuell paarweiser Vergleich O(n²), noch kein räumlicher Index oder Leistungsnachweis für Großprojekte.

Neue Fangart segment-intersection mit Beschriftung „Segmentschnittpunkt“, getrennt vom temporären Hilflinienschnitt. Rangfolge: Endpunkt 0, Mittelpunkt 0,25, Segmentschnitt 0,375, Hilflinienschnitt 0,5, einzelne Führungen und Raster. 10 CSS-Pixel, Shift/Ortho und Editachsen behalten ihren Vertrag. Der gleiche Punkt kann nach 600 ms als Hilfsreferenz aktiviert und bei erneutem Besuch gelöst werden; alle Verbraucher nutzen weiterhin querySnap. Projektformat, History und IFC unverändert.

Nachweise: 180 Tests bestanden, darunter sieben neue Gruppen zu endlichen/überlappenden/entarteten Segmenten, kurzen und schrägen Kreuzungen, Endkontakt, Polylinien-Selbstkreuzung, deterministischen Quellen, Zoom/Priorität/Constraints, 600-ms-Hover, beidseitigen Edit-/Host-Ausschlüssen sowie Zeichnen/Preview/Commit/Undo/Redo/JSON. TypeScript und Build erfolgreich; ESLint null Fehler/sechs bekannte React-Refresh-Warnungen. Browser: Linie kreuzt Wandachse bei (0,7; 0), Segmentschnitt erkannt, Referenz aktiviert/gelöst, neue Linie startet exakt am Schnitt, Direct Edit einer dritten Linie fängt denselben externen Schnitt; Undo/Redo geprüft. Screenshot: outputs/segment-intersection-hover.png.

Abnahme: Eine Linie quer durch eine Wandachse zeichnen, abseits von End- und Mittelpunkten. Kreuzung anfahren: „Segmentschnittpunkt“. 0,6 s verweilen und Hilfslinien verfolgen; erneut besuchen und lösen. Eine weitere Linie an diesem Punkt beginnen oder eine dritte Linie dorthin bewegen; Undo/Redo prüfen. Beim Bewegen einer der beiden Ausgangslinien darf deren alter Schnittpunkt nicht als externer Fangpunkt angeboten werden.

### Aufgenommen für später: N45 Wandachse

Nutzerpräzisierung: Die derzeit zentrierte Wandachse bei ausgewählter Wand sichtbar machen und später verschiebbar machen. In FUNCTION_REQUIREMENTS_2026-10-03.md bei N45 ergänzt, kein Doppelauftrag. Vor Wandanschlüssen passend einordnen. Ob die physische Wandlage erhalten oder mitverschoben wird, bleibt bis zur fachlichen Klärung offen; hier keine Implementierung.

### Abschluss: schräge Verlängerungs- und Lot-Hilflinienschnitte — 03.10.2026

Aufbauend auf 4c542ea / PR #35, der weiterhin offen bleibt. Neue Umsetzung auf feat/oblique-guide-intersections. Kein Merge durch den allgemeinen Fortsetzungsauftrag.

Die gemeinsame Richtungswahl in constraints/guides/directions.ts berücksichtigt jetzt jede gültige Kantenrichtung, deren Gegenrichtung und Lotrichtungen sowie die bestehenden acht 45°-Richtungen. Pro aktiver Quelle wird genau eine mausrelevante Richtung gewählt. Bei gleichem Winkel entscheidet Verlängerung vor Lot, Horizontal, Vertikal und Winkel; anschließend der Richtungswinkel. Null-/nichtendliche Vektoren werden verworfen. Alte Richtungen bleiben nur erhalten, solange sie weiterhin aus der aktuellen Quellgeometrie stammen.

Darstellung, einzelne Führung, Schnittpunktbildung und Hover-Erwerb konsumieren dieselbe Wahl. Damit entstehen auch Schnitte außerhalb des 45°-Rasters, etwa zweier schräger Verlängerungen oder Verlängerung/Lot. Anders als bisher werden einzelne Führungen nicht zusätzlich unabhängig aus allen Richtungen bewertet. Explizite Shift-Winkel bleiben unverändert, genauso Punktprioritäten, Fangradius, Ortho und Direct-Edit-Ausschlüsse.

Hysterese: weiterhin maximal 5° zusätzliche Winkelreserve an einer Richtungsgrenze. Bei eng benachbarten Kandidaten reduziert sich diese auf 20 Prozent ihres Winkelabstands, damit flache schräge Kanten gegenüber der Horizontalen erreichbar bleiben. Vorläufiger technischer Bedienwert; kein numerisches Geometrie-Epsilon. Bestehender 45°-Grenztest 27,5°/17,5° bleibt gültig. Keine Modellaktion, Dateimigration, IFC- oder AI-Änderung.

Nachweise: 185 Tests bestanden, darunter fünf neue Gruppen für Verlängerung/Verlängerung und Verlängerung/Lot, Zoom/Fangradius, parallele/kollineare Fälle, Vektorreihenfolge/ungültige Richtungen, flache Winkel/Quellenwechsel, Prioritäten/Constraints, Hover-Lebenszyklus und Direct-Edit-Preview/Commit/Undo/Redo/JSON. TypeScript und Build erfolgreich; ESLint null Fehler/sechs bekannte React-Refresh-Warnungen. Browser: Linien (0;0,5)–(1;1) und (4;0,5)–(3;1) liefern außerhalb ihrer Strecken einen Hilflinienschnitt bei (2;1,5); beide sichtbaren Führungen sind Verlängerungen. Nach 600 ms dritter Hilfspunkt, neue Linie startet exakt dort, Undo/Redo geprüft. Freie Bewegung einer dritten Linie fängt denselben Schnitt mit Undo/Redo. Screenshot: outputs/oblique-guide-intersection.png.

Abnahme: Zwei schräge Linien zeichnen, deren Verlängerungen sich treffen. Beide zugewandten Enden je 0,6 s aktivieren und den Zeiger zur erwarteten Kreuzung führen. Die silbergrauen Führungen folgen den Kanten; der Schnitt wird zum Hilfspunkt. Dort zeichnen oder ein anderes Element dorthin bewegen. Parallel liegende Führungen sollen keinen erfundenen Schnittpunkt anzeigen.

### Abgeschlossener Auftragsumfang: Hilfslinienschnitt mit fester Direct-Edit-Achse

Die bisher dokumentierte Lücke bei achsengebundener Bearbeitung schließen: externe Hilfsreferenzen dürfen seitlich der erlaubten Bewegungsachse liegen, wenn ihre mausrelevante Führung diese Achse schneidet. Den Schnitt gemeinsam und eindeutig berechnen, die feste X-/Y-/Elementachse weiterhin strikt einhalten und keine bloß projizierten Endpunkte als echte Fangpunkte beschriften. Zuerst vorhandenen Filter und Kandidatenvertrag prüfen; keine separate SnapEngine im Werkzeug.

Abnahme: X-/Y-/schräge Elementachse, passende externe Verlängerung/Lotführung, parallele/kollineare Fälle, eigene und Fensterhost-Quellen ausgeschlossen, veralteter Kontext, unterschiedliche Zoomstufen. Preview und Bestätigung müssen identische Ziele liefern, ein Undo/Redo und JSON bleiben korrekt. Browserabnahme einschließlich Escape sowie Tests/TypeScript/Lint/Build. Wandachse N45 bleibt ein späterer fachlich zu klärender Auftrag.

## Historische Fortschrittsnachweise

### Abgeschlossener Auftrag: gemeinsame Fang-Kandidaten und Rangfolge

**Ziel:** Die bestehenden Linie-/Wand-/Auswahl-/Direct-Edit-Verbraucher erhalten dieselbe nachvollziehbare Fangentscheidung aus einer nichtrekursiven Kandidatenpipeline. Keine neuen Fangarten oder UI-Werkzeuge.

**Ausgangsbefund:** constraints/snapping/engine.ts ruft querySnap für jede aktive Referenz erneut auf. Endpunkte, einzelne Führungen und Mehrfachreferenzen verwenden unterschiedliche Tie-Breaker; letztere nutzen sourceFeature.localeCompare ohne vollständige Quellenidentität. Toleranzregeln und Direct-Edit-Ausschlüsse sind bereits abgesichert.

**Begrenzter Umfang:**

1. Bestehende Erzeugung für Endpunkte, Richtungsführungen, horizontale/vertikale Referenzschnittpunkte und Raster intern trennen. Referenzvalidierung einmal pro Anfrage; keine rekursive querySnap-Gesamtabfrage. Public API und Modelladapter erhalten, keine vorsorglichen Klassen/Registries.
2. Eine reine, explizite Rangfunktion verwenden. Bestehender Vorrang bleibt: ausdrücklicher Shift-Constraint; dann kompatibler Endpunkt, bestehender HV-Guide-Schnittpunkt, einzelne Führung, Raster-Fallback. Ortho-Kompatibilität und tatsächliche Quellenkoordinaten erhalten. Abstand in CSS-Pixeln vergleichen.
3. Technischer Umsetzungsvorschlag für bisher uneinheitliche Gleichstände: bei gleichem Rang/Abstand neuere aktive Referenz bevorzugen, danach vollständige stabile Quellenidentität (entityId, feature; bei Schnittpunkten beide Quellen), schließlich ausdrücklich dokumentierte Fangart-/Richtungsreihenfolge. Keine Locale-Abhängigkeit und keine unbeabsichtigte Abhängigkeit von der Reihenfolge der Modellquellen. Dies ist eine technische Rangregel, keine behauptete Nutzerentscheidung; im Änderungsprotokoll die bisher anders entschiedenen Fälle benennen.
4. Bestehende Consumer weiterverwenden. Direct-Edit-Ausschluss eigener Quellen/Host und explizite Achspriorität erhalten; keine eigenständige zweite Rangfunktion im Editadapter.

**Nicht enthalten:** Mittelpunkt-/allgemeiner Segmentschnittfang, beliebige Guide-Schnittpunkte, Hysterese, räumlicher Index, 3D-Arbeitsebenen, Lösung des Wandeck-Griffversatzes, Layer, Skalieraktion, neue Bauteile oder Layouteditor. Diese bleiben dokumentiertes Backlog, nicht Teil dieses Auftrags.

**Abnahme:**

- Bestehende 149 Tests bleiben grün; zusätzliche Tests für konkurrierende Quellen mit gleichem Feature-Namen, vertauschte Quellreihenfolge, bewusste Aktivierungsreihenfolge und mehrere gleiche Führungen.
- Toleranzfall 0.3 gegen 0.1+0.2, große Offsets, mehrere Zoomstufen, echte seitliche Abweichung und exakte Invalidierung veralteter Quellen bleiben korrekt. Zwei Quellen eines Schnittpunkts bleiben zur Anzeige verfügbar.
- Snap aus, Shift/Ortho, vier Referenzen, Escape/Kontextwechsel und Raster-Fallback behalten ihren geprüften Vertrag. Wand/Linie/Direct Edit liefern bei identischem Kontext identische Zielkoordinaten.
- Anwendungstests bestätigen Vorschau/Klick, eigene Quellenausschlüsse, ungültiges Ziel ohne Commit, ein Undo/Redo und JSON; vorhandene Stage-1-/IFC-Regressionen bestehen.
- TypeScript, vollständiges ESLint und Build ausführen; bekannte Warnungen getrennt berichten. Praktisch zwei externe Referenzen aktivieren, konkurrierende Hilfslinien beim Linienzeichnen und freien Bewegen testen, zoomen, bestätigen/Undo und abbrechen. Keinen neuen Performanceanspruch ohne Messung.
- Kein neuer Modellbefehl entsteht: vorhandene AI/Text/Voice-Verträge und Stale-Context-Tests erhalten; ein zusätzlicher Sprachparser ist hier nicht erforderlich.

**Lieferung:** ein kleiner prüfbarer Entwicklungszweig/PR, dokumentierte Rangregel und Bedienabnahme. Kein Merge ohne Prüfung. Dokumentationsstand baut auf PR #28 auf; Abhängigkeiten in Reihenfolge prüfen statt ältere Änderungen erneut zu implementieren.

## Architekturreview: Direct Edit an gemeinsame Fang-Engine angebunden - 03.10.2026

Zweiter begrenzter Korrekturschritt nach numerischen Toleranzen (PR #27). Der Application-Adapter `application/direct-edit/snapping.ts` verbindet vorhandene EditSession-Aktionen mit der gemeinsamen SnapEngine. BimPlan verwendet dieselbe Auflösung für Live-Vorschau und Bestätigung, einschließlich aktueller Shift-Taste. Die Vorschau bleibt abgeleitet; nur Bestätigung erzeugt einen validierten Undo-Schritt. Die Quellen stammen aus dem ursprünglichen Modell, niemals aus der Vorschau.

Freies Bewegen und Punktbearbeitung erhalten Endpunktfang, Raster, Ortho, Shift in 45-Grad-Schritten und aktivierte Hover-Hilfslinien. Die bestehenden silbergrauen Referenzringe und Führungen erscheinen auch während Direct Edit. Alle Referenzen des bearbeiteten Elements werden ausgeschlossen; bei Fenstern zusätzlich die Trägerwand. Explizite X-/Y-/Elementachsen, Strecken und die Fensterachse haben Vorrang vor Shift/Ortho. Auf solchen Achsen werden nur kompatible Referenzpunkte verwendet; ein seitlich projizierter Fangpunkt wird niemals als exakter Endpunkt/Schnittpunkt/Raster beschriftet.

Abnahme: Snap einschalten, eine Linie zeichnen. Wandecke auswählen, im Elementmenü „Punkt frei bewegen“ wählen und an einem fremden Linienendpunkt verweilen. Endpunktmarker erscheint sofort, Referenzring nach 0,4 s. Daneben zeigt die passende temporäre Hilfslinie. Ziel anklicken, Undo und Redo ausprobieren. Shift bei freier Bearbeitung halten; Escape muss die Vorschau verwerfen.

Prüfung: 149 automatisierte Tests, TypeScript, vollständiges ESLint und Produktionsbuild. Lint: null Fehler, sechs bekannte React-Refresh-Warnungen. Neue Fälle prüfen freie Wandbewegung und Punktänderung, exakte externe Endpunkte, Zoomradius, Snap aus, Shift, Achspriorität, Hover-Führung, geschlossene Polylinien, Fenstergrenzen und Strecken mit Griffversatz. JSON, Undo/Redo und bestehende IFC-Tests bleiben enthalten. Browser: Endpunkt außerhalb des Rasters exakt erkannt, Ring/Hilfslinie beim Bearbeiten sichtbar, Vorschau und Bestätigung geometrisch identisch, Undo auf 3 m und Redo auf 4,131980263614846 m geprüft. Screenshot lokal: outputs/direct-edit-snap-preview.png.

Grenzen: 2D; keine neuen Fangarten oder räumlichen Indizes. Auch unbewegte Punkte desselben Elements bleiben vorerst ausgeschlossen. Bei festgelegten Achsen werden Führungen aus seitlich liegenden Referenzen noch nicht mit der Bewegungsachse geschnitten. Bestehende Wandgriffe verschieben den Achsendpunkt um das Griffdelta; eine beim Drehen neu berechnete Außenkante ist damit kein geometrisch fixierter Eckkontakt. Dieser bestehende Griffversatz ist gesondert vor Wandanschlüssen zu präzisieren. Keine Änderung an Dateiformat, IFC oder Modellvalidierung.

Nächster Schritt: Kandidatenerzeugung und Rangfolge in der gemeinsamen Engine ohne rekursive Gesamtabfragen trennen und Gleichstände ausdrücklich regeln; danach allgemeine Richtungsschnittpunkte und Hysterese.

## Architekturreview: numerische Fangtoleranzen - 03.10.2026

Grundlage: [Architekturreview und Funktionslandkarte](NOVIKOV_ARCHITEKTUR_REVIEW_UND_FUNKTIONSMAP.md), als Nutzerquelle abgelegt. Abgleich mit main dd3e358 nach Übernahme des Gesamtstands aus PR #26. Der Architekturvertrag bleibt maßgeblich. Dieser Schritt bearbeitet ausschließlich den ersten Korrekturauftrag; zusätzliche Fangarten sind zurückgestellt.

Fehler zuerst als Regression reproduziert: Endpunkt y=0.3 wird bei Ortho-Ursprung y=0.1+0.2 nicht erkannt. Der Test schlägt am unveränderten Stand fehl und besteht nach Korrektur. `geometry/tolerances/model.ts` definiert eine numerische Modellkompatibilität in Metern: Minimum 1e-9 m, bis zu acht maschinelle Rundungseinheiten relativ zur Koordinatengröße, gedeckelt auf 1e-6 m. Das ist keine Bauausführungs- oder Importtoleranz. Bei extremen Koordinaten über dieser Genauigkeitsgrenze sind lokale Koordinaten nötig; die Toleranz wächst nicht unbegrenzt. Nichtendliche Werte sind inkompatibel. Der Bildschirm-Fangradius bleibt unverändert in CSS-Pixeln.

Endpunkt-/Guide-/Schnittpunkt-Kompatibilität mit Ortho und die Rasterkennzeichnung verwenden diese gemeinsame Regel. Akzeptierte Kandidaten behalten ihre originalen Modell-/Konstruktionskoordinaten statt eine projizierte Kopie als Endpunkt oder Raster auszugeben. Quellen-IDs, Feature-Identität, Hover-Zeitlogik und Positionsvergleiche zur Invalidierung bleiben ausdrücklich exakt. Projektänderungen setzen den UI-Kontext weiterhin zurück. Kein Dateiformatwechsel, keine Änderung an Prioritäten, Shift oder History.

Nachweise: 140 Tests bestanden (fünf neue Tests mit mehreren Fällen), TypeScript, vollständiges ESLint und Produktionsbuild erfolgreich. Lint: null Fehler, sechs bekannte React-Refresh-Warnungen. Tests prüfen beide Achsen, ±10 Millionen Meter, 10/100/1000 px/m, echte Abweichungen, nichtendliche Werte, Toleranzdeckel, exakte Kandidatenkoordinaten und weiterhin ungültige veraltete Hover-Referenzen trotz minimaler Verschiebung. Vorhandene Shift-, Mehrfachreferenz-, Undo/Redo-, JSON- und IFC-Tests bleiben grün. Keine erneute Browserprüfung in diesem rein numerischen Schritt; Bedienoberfläche unverändert.

Kurzer Bedienversuch: Linie mit aktivem Ortho an einem vorhandenen Endpunkt beginnen/enden lassen und bei unterschiedlichen Zoomstufen wiederholen. Echte seitlich versetzte Punkte dürfen nicht als Endpunkt auf der Ortho-Achse erscheinen. Der konkrete Unterschied von 0.3 zu 0.1+0.2 ist im automatisierten Regressionstest zuverlässiger prüfbar als per Maus.

Getrennte Folgeaufträge in dieser Reihenfolge:

1. Direct Edit mit geeignetem Ausschluss eigener Quellen an die gemeinsame Engine anbinden; Vorschau und Klick müssen denselben Punkt liefern, Wand-/Fenstervalidierung beibehalten.
2. Kandidatenerzeugung und Rangfolge ohne rekursive Gesamtabfragen trennen; Gleichstände über ausdrückliche Quellen-/Aktivierungsregeln entscheiden.
3. Allgemeine Richtungsschnittpunkte und Hysterese ergänzen.
4. Architekturgrenzen automatisiert absichern und große Modelle messen, bevor Leistungszusagen gemacht werden.

## Guide-Etappe 3c: werkzeugfreies Hover und mehrere Referenzen - 03.10.2026

Hover-Erkennung und Hilfslinien funktionieren jetzt auch im Auswahlmodus, ohne Zeichenwerkzeug. Der aktive ungefüllte Referenzring hat 10,5 statt 6 CSS-Pixel Radius (+75 Prozent); Ring und Hilfslinien verwenden Silber-Grau (#929aa3). Die bestehenden blauen Fanghinweise bleiben zur Unterscheidung erhalten. Das Wandzeichnen nutzt nun dieselbe Fang-/Hover-/Shift-API wie Linie/Polylinie; direkte Bearbeitung bleibt separat.

Bis zu vier durch Verweilen aktivierte Referenzen bleiben innerhalb der Zeichenfläche erhalten. Ein fünfter verdrängt den ältesten; erneutes Aktivieren aktualisiert die Reihenfolge ohne Duplikat. Neben den einzelnen Richtungsführungen unterstützt die Engine als erste gemeinsame Konstruktion Horizontal-von-A/Vertikal-von-B. Ein naher Schnittpunkt gewinnt vor Einzelführungen und wird mit beiden Herkunftslinien dargestellt. Tatsächliche Endpunkte behalten Vorrang. Alle Referenzen werden gegen den aktuellen Modellstand geprüft.

Prüfung: 135 Tests bestanden, TypeScript und Build erfolgreich, ESLint null Fehler und sechs bekannte Warnungen. Neue Tests behandeln Referenzlimit, Duplikate, exakte Schnittpunkte bei verschiedenen Zoomstufen, veraltete Quellen sowie Wandaktion mit einem Undo-Schritt und JSON-Rundlauf. Browser: Hover im Auswahlmodus ohne History-Eintrag; zwei Referenzen, gemeinsamer Schnittpunkt und beide Hilfslinien; Wand mit gemeinsamem Shift-Fang exakt 45 Grad, Undo/Redo. Globales Escape räumt Referenzen auch ohne Canvas-Fokus auf (nach frischem Laden geprüft). Lokaler Screenshot: outputs/multi-reference-guides.png.

Abnahme: Im Auswahlmodus zwei räumlich versetzte Endpunkte jeweils etwa 0,4 s anhovern, ohne zwischendurch die Zeichenfläche zu verlassen. Anschließend auf die horizontale Flucht des einen und vertikale Flucht des anderen bewegen: „Schnittpunkt“ mit zwei gestrichelten Linien erscheint. Escape löscht alle Referenzen. Wandwerkzeug wählen und Fang/Shift wie beim Linienwerkzeug testen.

Grenzen: temporäres Fixieren, keine gespeicherten Hilfsobjekte. Verlassen der Zeichenfläche, Kamera-/Modelländerung, Snap aus und direkte Bearbeitung löschen den Kontext; nicht als dauerhafte Pins interpretieren. Auswahlmodus erzeugt keine Bauteile. Gemeinsame Schnittpunkte bisher nur horizontal/vertikal; Schnittpunkte beliebiger Richtungsführungen, Hysterese, Ebenenfilter und 3D folgen separat. Die Mehrfachabfrage ist auf vier Referenzen begrenzt; keine neue Leistungsaussage für große Modelle.

Nächster kleiner Schritt: Schnittpunkte beliebiger aktiver Richtungsführungen (Verlängerung, Lot und Winkel) geometrisch verallgemeinern und die Auswahl konkurrierender Führungen mit Hysterese stabilisieren.

## Guide-Etappe 3b: Ringe, Ecken und Richtungsführung - 03.10.2026

Erkannte Fangpunkte und gesetzte Startpunkte werden als ungefüllte Ringe dargestellt. Die sofortige Erkennung (blau) bleibt von der Hover-Aktivierung nach standardmäßig 400 ms (orange) getrennt. Wandaußenecken sind jetzt zusätzliche abgeleitete Referenzen. Die vorhandene Wartezeit-Einstellung bleibt erhalten.

Die gemeinsame Geometrieprojektion liefert Richtungsführungen: Verlängerung/Flucht und Lotrechte aus angrenzenden Liniensegmenten bzw. Wandachsen sowie automatische Diagonalen. Nur Kandidaten innerhalb des Bildschirmradius werden angeboten; der nächste gewinnt, bei Gleichstand die feste Erzeugungsreihenfolge. „Verlängerung“ bezeichnet hier die gesamte Geradenflucht, auch in Gegenrichtung. Shift erzwingt ohne Radiusbeschränkung 0/45/90/.../315 Grad; Bezug ist der gesetzte Startpunkt, davor eine aktivierte Referenz. Shift hat Vorrang vor Ortho und automatischem Raster, auch bei deaktiviertem Snap. Loslassen gibt den normalen Fang frei. Klick und Vorschau nutzen dieselbe Berechnung. Hilfslinien bleiben temporär.

Prüfung: 132 Tests bestanden; neu geprüft sind acht Shift-Richtungen, Loslassen, entartete Richtung, exakte Projektion an schrägen Kanten und Wandaußenecken. TypeScript und Build erfolgreich; ESLint null Fehler, sechs bekannte Warnungen. Browser: Soforterkennung vor Aktivierung, ungefüllter aktiver Ring, mit Shift exakt bestätigtes 45-Grad-Segment, Loslassen und Escape geprüft. Screenshot lokal: outputs/directional-guides.png.

Abnahme: Linienwerkzeug wählen, an einer Wandecke verweilen, dann nahe einer Flucht/Diagonalen wegbewegen. Startpunkt klicken und Shift halten: unabhängig vom Raster rastet die Richtung in 45-Grad-Schritten ein. Shift loslassen und Escape testen.

Grenzen: erster Verbraucher bleibt Linie/Polylinie; keine Mehrfachreferenzen, Nachbarparallel-Erkennung, Hysterese oder 3D. Am Polylinienvertex werden die benachbarten gespeicherten Segmente ausgewertet. Nächster Schritt: Wandzeichnen an dieselbe geprüfte Fang-/Hover-/Shift-API anschließen und Wand-Fenster-Workflow mit Undo/Redo und Dateirundlauf prüfen.

## Vorgezogene Guide-Etappe 3a: Hover-Referenz und Achsführungen - 02.10.2026

Auf ausdrücklichen Nutzerwunsch wird vor dem zweiten Werkzeug zunächst das gewünschte Zeigerverhalten umgesetzt: Endpunkt ohne Klick 400 ms halten, als temporäre Referenz aktivieren und anschließend nur die zum Zeiger passende horizontale oder vertikale Hilfslinie anbieten. Die Verweildauer ist in den Werkzeugeigenschaften auf 200/400/600/1000 ms einstellbar (Sitzungseinstellung, nicht Projektinhalt).

`constraints/inference/hover-reference.ts` verwaltet die einzelne Referenz mit expliziter Zeitquelle. Die gemeinsame SnapEngine priorisiert Endpunkt vor Führung vor Raster. Der React-Adapter liefert Zeiger und Timer; die Ansicht zeigt einen Referenzring, eine gestrichelte Hilfslinie und die wirksame Fangart. Die Führung projiziert mathematisch exakt auf die Bezugsachse, innerhalb von 10 CSS-Pixeln. Eine neue Referenz ersetzt die bisherige erst nach voller Verweildauer. Escape, Verlassen der Zeichenfläche, Werkzeug-/Kamera-/Modellwechsel und deaktiviertes Snap verwerfen temporären Kontext. Es entstehen weder Modellelemente noch Undo-Einträge durch Hover.

Nachweise: 129 Tests bestanden, darunter fünf neue Tests zu kontinuierlichem Hover, Unterbrechung, Referenzwechsel, einstellbarer Wartezeit, Zoom, Prioritäten, Ortho-Konflikten, veralteten Quellen und Dateirundlauf mit Undo/Redo. TypeScript und Produktionsbuild erfolgreich; ESLint null Fehler und sechs bekannte React-Refresh-Warnungen. Browser: ruhiges Hover aktiviert ohne Klick; horizontale und vertikale Führung erscheinen entsprechend der Zeigerposition; bestätigter Linienpunkt liegt exakt auf der Bezugsachse; Undo/Redo und Escape geprüft. Screenshot: outputs/hover-guide.png im lokalen Arbeitsverzeichnis.

Abnahme: Linienwerkzeug wählen, Snap einschalten, am Achsende einer Wand oder an einem Linienpunkt kurz verweilen. Der orange Ring zeigt die aktive Referenz. Zeiger seitlich oder nach oben bewegen: Nur die passende gestrichelte Führung erscheint. Punkt setzen, Linie abschließen, Undo/Redo testen. Escape räumt die Referenz auf.

Grenzen: erster Verbraucher weiterhin Linie/Polylinie in 2D; maximal eine Referenz, nur Achsführungen, keine dauerhaften Hilfsobjekte. Noch keine Richtungsableitung aus Kanten, Mehrfachreferenzen, Hysterese, Parallel-/Lot-/Winkelbezüge, 3D oder räumlicher Index. Die ursprüngliche vollständige Hilfslinienspezifikation bleibt offen. Die Engine analysiert derzeit vorhandene Wandachsenden und Linienvertices; weitere Elementtypen benötigen Modelladapter.

Nächster Teilauftrag: Richtungsreferenzen vorhandener gerader Linien/Wandachsen ergänzen und daraus Verlängerung, Lotrechte und 45°-Führung priorisiert ableiten. Danach dieselbe geprüfte API im Wandzeichnen einsetzen. Keine werkzeugspezifische Fangberechnung duplizieren.

## Guide-Etappe 2a: gemeinsame Fanggrundlage - 02.10.2026

Die reine Engine `src/constraints/snapping/engine.ts` liefert Modellpunkte und Fangkandidaten mit Art, Quelle, Bildschirmabstand und Priorität. Der Application-Adapter `src/application/snapping/project-references.ts` leitet Wandachsenden und vorhandene Linien-/Polylinienpunkte aus dem einzigen Project ab. React stellt nur Ansichtskontext und Anzeige bereit. Als erster Verbraucher nutzt das Linienwerkzeug (einschließlich Polylinien) diese API. Endpunkte innerhalb von 10 CSS-Pixeln haben Vorrang vor dem bisherigen 0,10-m-Raster; gleiche Kandidaten werden deterministisch entschieden. Ortho darf keinen projizierten Punkt als echten Endpunkt ausgeben. Marker und Beschriftung zeigen den wirksamen Fang. Kamera-/Werkzeugwechsel verwerfen veraltete Hoverpositionen.

Prüfung: 124 Tests bestehen, einschließlich sechs neuer Tests zu Rasterpriorität, Zoomabständen, konkurrierenden Kandidaten, Ortho, ungültigen Eingaben, Modelladapter, Undo/Redo und JSON. TypeScript und Produktionsbuild erfolgreich; ESLint ohne Fehler, sechs bekannte React-Refresh-Warnungen. Browser: Linie beginnt nach Klick neben dem Wandende exakt bei 3,037 m statt am Raster; Undo entfernt sie, Redo stellt dieselben Koordinaten wieder her. Endpunktmarker bei rund 105 und 200 px/m geprüft; Escape verwirft einen begonnenen Linienzug.

Praktische Abnahme: Wandlänge auf 3,037 m ändern, Linienwerkzeug und Snap aktivieren, nahe der Mitte der Stirnseite auf das Achsende zeigen. „Endpunkt“ erscheint; dort starten und den zweiten Punkt setzen. Undo/Redo prüfen und denselben Fang bei verändertem Zoom wiederholen.

Grenzen: erste gemeinsame Grundlage, keine vollständige Raster-/Hilfslinienengine. Wandzeichnen und direkte Bearbeitung verwenden noch ihren bisherigen Fangweg. Referenzen werden linear durchsucht; große Projekte, räumlicher Index und Hysterese sind noch nicht geprüft. Mittelpunkte, Schnittpunkte, Hoveraktivierung, Hilfslinien, 3D-Arbeitsebene, laufende Entwurfsvertices und ein Fang-Einstellungsdialog folgen separat. Wandreferenzen sind Achsenden, keine Außenkanten. Das Raster bleibt außerhalb der Endpunkttoleranz der bisherige flächige Fallback.

Nächster kleiner Schritt: Wandzeichnen als zweiten Verbraucher an dieselbe Engine anschließen, ohne Fanglogik zu duplizieren. Prüfen: Wand an bestehendem Linien-/Wandendpunkt, Ortho, Zoom, Abbruch, genau ein Undo sowie Projektdateirundlauf. Danach direkte Bearbeitung und weitere Fangarten schrittweise anbinden.

## Formatbereinigung abgeschlossen – 02.10.2026

`.gitattributes` legt für automatisch erkannte Textdateien LF im Checkout fest; `.prettierrc` verlangt ausdrücklich LF. Die lokalen UTF-8-Textdateien wurden ohne Änderung ihrer Inhalte von CRLF auf LF normalisiert. Prettier hat die noch abweichende Formatierung in ToolRail, den beiden Routendateien und styles.css vereinheitlicht. Binärdateien bleiben unverändert. Keine CAD-Funktion oder Fanglogik wurde geändert.

Prüfung: vollständiges ESLint erfolgreich mit null Fehlern, auch erneut nach dem Produktionsbuild. 118 Tests, TypeScript und Build erfolgreich; keine CRLF-/gemischten Textdateien mehr im geprüften Checkout. Sechs bestehende `react-refresh/only-export-components`-Warnungen bleiben in badge, button, form, navigation-menu, sidebar und toggle sichtbar. Sie betreffen gemischte Komponenten-/Hilfsexporte, keine Formatfehler; ihre strukturelle Bereinigung ist nicht Teil dieses Format-PRs. Keine Lint-Regel wurde abgeschaltet.

Nächster Funktionsauftrag ist Guide-Etappe 2: eine gemeinsame, erweiterbare Raster- und Punktfang-Engine unter constraints/snapping, mit generischer Geometrie und Modelladaptern. Endpunktfang ist ihre erste Fangart, keine separat in Werkzeugen implementierte Logik. Ein expliziter Ansichtskontext liefert bildschirmbezogene Fangabstände; Ergebnisse bleiben Modellkoordinaten. Zunächst einen vollständigen Zeichenablauf integrieren, anschließend das zweite Werkzeug über dieselbe API. Raster, Mittelpunkt, Schnittpunkt und später Referenzen/Guides verwenden die gemeinsame Kandidaten-/Prioritätsstruktur. Leistungsoptimierungen folgen gemessenen Engpässen; beliebig große Projekte sind damit noch nicht nachgewiesen.

## Guide-Etappe 1a abgeschlossen – 02.10.2026

Der neue Application-Controller unter `src/application/direct-edit/controller.ts` koordiniert Start, Bestätigung, Abbruch und Snapshot-History. Die reine Vorschaufunktion verwendet weiterhin die vorhandene Direct-Edit-/Transformationslogik. `CadWorkspace` dispatcht Ereignisse; `BimPlan` meldet Sitzung und Zielpunkt statt selbst einen fertigen Modellzustand zu bestätigen. Bestehende Achs-/Punktaktionen nutzen denselben Lebenszyklus, ohne neue Geometrie. Eigenschaften, Zeichnen, Textbefehle und Laden behalten ihre bisherigen validierten Operationen und geben Ergebnisse an denselben History-Pfad weiter. Es gibt weiterhin genau ein Project.

Nachweise: 118 Tests bestanden, davon acht neue Application-Tests zu Vorschauen, Abbruch, veraltetem Kontext, ungültigen Zielen, No-op/Redo, Linienbewegung, Dateirundlauf, 3D und IFC. TypeScript, gezieltes ESLint der geänderten Dateien und Build erfolgreich. Browser: Vorschau/Abbruch ohne Undo, Wandbewegung mit einem Undo-Schritt, Redo, Linienbewegung und 3D-Wechsel; keine Konsolenfehler. Nach einer Modelländerung wird der alte angeklickte Bewegungsanker verworfen. Eine allgemeine automatische Importgrenzen-Prüfung ist noch nicht implementiert; das neue Modul wurde auf ausschließlich modell-/historybezogene Imports ohne React/DOM geprüft.

Praktische Abnahme: Wand mit Fenster auswählen, „Element frei bewegen“, Vorschau bewegen und Escape drücken. Erneut starten und Ziel anklicken. Einmal Undo muss die Bewegung vollständig zurücknehmen; Redo stellt sie wieder her. Danach denselben Ablauf mit einer Linie prüfen. Maße und Fensterzuordnung bleiben erhalten.

Nächster kleiner Wartungsschritt: Formatierung und Zeilenenden in einem separaten PR bereinigen, bevor weitere Fangfunktionen hinzukommen. LF-Regel für Git/Formatter abstimmen, nur Formatänderungen durchführen, vollständiges Lint sowie Tests/Build prüfen. Die 7.891 Formatfehler und sechs Warnungen aus der Bestandsaufnahme sind historische Ausgangswerte; die Gesamtbereinigung wurde hier nicht behauptet. Danach Guide-Etappe 2: zuerst gemeinsamer Endpunktfang für einen bestehenden Zeichenablauf, anschließend das zweite Werkzeug und weitere Fangarten. Kein freier KI-Parser, neue Elementtypen oder Ersatz für Snapshot-History in diesem Schritt.

## Guide-Etappe 0 abgeschlossen – 02.10.2026

Die aktuelle Bestandsaufnahme und vollständige Matrix für Guide-F01–F29 stehen in [GUIDE_BASELINE.md](GUIDE_BASELINE.md). Geprüft wurde Commit 635cde4 mit dem integrierten Funktionsstand aus PR #17 und Guide aus PR #18. 110 Tests, TypeScript und Build bestehen. Vollständiges Lint schlägt mit 7.891 Formatierungsfehlern und sechs Warnungen fehl; ohne Formatierungsregel null Fehler, sechs Warnungen. Keine CAD-Verhaltensänderung in dieser Etappe.

Nächster einzelner Auftrag: Guide-Etappe 1a, gemeinsame Application-Orchestrierung der vorhandenen freien Elementbewegung (Start, Vorschau, Bestätigung, Abbruch und genau ein Undo-Schritt). Zuständigkeiten und konkrete Abnahmekriterien in GUIDE_BASELINE.md. Bestehende Modell-/Transformations-/History-Funktionen weiterverwenden. Erst danach gemeinsamer Endpunktfang, anschließend weitere Fangarten als getrennte Schritte.

Die folgenden Einträge zur noch offenen Bestandsaufnahme beschreiben den Zustand vor diesem Abschlussnachtrag.

## Aktive Planungsgrundlage ab 02.10.2026

DEVELOPMENT_GUIDE.md enthält den vollständig und unverändert abgelegten neuen Nutzerleitfaden. Er ersetzt die Anlage „0.Where it all Begins“ und die bisherige Etappenreihenfolge als aktive Planungsgrundlage. ARCHITECTURE.md bleibt für Architekturgrenzen maßgeblich. Die nachfolgenden älteren Etappen und Abschlussnachträge bleiben als Nachweise erhalten; ihre Nummern sind historisch und dürfen nicht mit Guide-Etappen 0–12 oder Guide-F01–F29 verwechselt werden.

Aktueller gesicherter Funktionsstand: feat/plan-camera, Commit 2bca281, PR #17 (offen). 110 Tests, TypeScript, gezieltes ESLint, Build und dokumentierte Browserprüfung bestanden. Dies ersetzt noch nicht die vollständige Anforderungszuordnung nach Guide-Etappe 0. Der vorgezogene Bildschirmmaßstab deckt einen Teil von Guide-Etappe 7/F10 ab; Referenzimport, Kalibrierung und Ausgabemaßstab fehlen weiterhin.

Nächster begrenzter Auftrag: Guide-Etappe 0. Aktuellen Code und Prüfungen abgleichen; Matrix für Guide-F01–F29 mit Status, zuständigem Modul und konkretem Nachweis erstellen; vorhandene Funktionen von Teilumsetzungen und fehlenden Funktionen trennen. Insbesondere prüfen, ob vor Endpunktfang ein kleiner gemeinsamer Application-Schritt nötig ist. Keine neue CAD-Funktion in dieser Bestandsaufnahme. Abnahme: alle 29 Wünsche zugeordnet, offene Prüfungen benannt und genau ein ausführbarer Folgeauftrag mit Abnahmekriterien festgelegt.

Übergreifende Gesprächswünsche bleiben bestehen: sichtbare Auswahlumrandung für alle künftigen Elementtypen, Verbesserung der Spracherkennung, Eigenschaften oben und Bewegungsaktionen am Zeiger. Sie werden bei Etappe 0 gesondert zugeordnet. Die ältere Detailspezifikation F13_HILFLINIENSYSTEM.md gehört zu Guide-F14. Vorgeschlagene 600 ms Hover und 10 px Fangradius sind vorläufige, konfigurierbare Werte.

Dieser Dokumentationsschritt archiviert und verankert den Guide; Etappe 0 ist noch nicht abgeschlossen. Danach jeweils ein kleiner Benutzerablauf mit Tests, praktischer Abnahme und aktualisiertem Plan. Bereits geprüfte Funktionen werden wiederverwendet. Keine Änderungen am Architekturvertrag oder am CAD-Verhalten.

## Historischer Entwicklungsplan und Nachweise

Verbindliche Reihenfolge aus dem Nutzerauftrag vom 01.10.2026. Dieser Plan ersetzt die bisherige technische Reihenfolge in FEATURE_ROADMAP.md; die dort erfassten Einzelanforderungen F01–F14 bleiben erhalten. Bereits funktionierende Modell-, UI-, History- und Exportfunktionen werden weiterverwendet. Pro Änderung eine überschaubare, prüfbare Teil-Etappe.

## Etappe 1 Gesamtstand prüfen und stabilisieren

Alle bisherigen Funktionen gemeinsam auf einem eindeutig bezeichneten Entwicklungszweig prüfen. Vollständiger Ablauf: Wand zeichnen → Fenster einsetzen → Maße ändern → Bauteile verschieben → Undo/Redo → speichern → wieder öffnen → IFC exportieren. Gefundene Fehler beheben. Grundriss, 3D, Eigenschaften und Export müssen denselben Modellzustand verwenden. Grenzen dokumentieren und einen geprüften Zwischenstand sichern.

Stand: PR #14 sichert den bisherigen Browserablauf und korrigiert die Mausvorschau, PR #15 ergänzt nur die Liste. Verschiebungen wurden bisher separat geprüft; die durchgehende automatisierte Prüfung wird jetzt um Wand- und Fensterverschiebung, Modellkoordinaten, 3D-Geometrie und IFC-Platzierung ergänzt. Lokale Git-Synchronisierung und die praktische kombinierte Verschiebeabnahme bleiben ausdrücklich Abschlussbedingungen. Keine automatische Zusammenführung oder Release-Markierung.

## Etappe 2 Präzises Zeichnen und Fanghilfen

Zuerst Endpunkte, Mittelpunkte und Schnittpunkte fangen. Anschließend horizontale/vertikale Hilfslinien, Parallelen, Lotrechte und definierte Winkel. Referenzpunkte sichtbar markieren und nach einstellbarer Hover-Verweildauer aktivieren. Bildschirmbezogene Fangabstände und eindeutige Anzeige der aktiven Fanghilfe verwenden. Mit 2D beginnen, danach Verhalten auf einer aktiven 3D-Arbeitsebene definieren. Fangprioritäten, konkurrierende Referenzen, Abbruch und präzise Maßeingaben prüfen.

F13 bleibt die ausführliche Spezifikation. F04 (2D-Kamera/Zoom/Pan/Maßstableiste) als kleine technische Voraussetzung in diese Etappe einordnen. Erster Fangschritt soll vorhandene Geometrie und Werkzeuge nutzen, keine parallele Modellstruktur. Weitere Fangarten erst nach Prüfung der ersten Arten ergänzen.

## Etappe 3 Wandanschlüsse und Öffnungen

Saubere Eck- und T-Verbindungen gerader Wände. Nachvollziehbare Regeln für Achsen, verschiedene Wandstärken und Änderungen verbundener Wände. Mehrere Fenster, Randabstände und Überschneidungen prüfen; unzulässige Änderungen verständlich melden. Kleinen geschlossenen Grundriss bearbeiten, speichern und als IFC exportieren. Die bisherige geometrische Vereinigung überlappender Öffnungen ist keine abgeschlossene fachliche Öffnungsvalidierung.

## Etappe 4 Geschosse und Decken

Mehrere Geschosse mit stabilen IDs, Namen und Höhen; eindeutige Bauteilzuordnung. Einfache horizontale Decken mit Kontur, Stärke und Höhenlage. Zweigeschossiges Beispiel in 2D, 3D, Projektdatei und IFC abgleichen. Migration vorhandener Projektdateien bei Formatänderungen berücksichtigen.

## Etappe 5 Räume und geometrische Flächen

Räume mit stabilen IDs, Namen und eindeutigen Grenzen, zunächst in geschlossenen Grundrissen. Teilweise umschlossene Räume benötigen eine ausdrückliche Begrenzung. Geometrische Fläche berechnen und verwendete Kontur zeigen; Änderungen begrenzender Wände prüfen. Geometrische Raumfläche und Wohnfläche nach WoFlV als getrennte Auswertungen führen. F06 und passende Teile von F07 hier einordnen.

## Etappe 6 Dächer lichte Höhen und Wohnflächen

Einfache Dachschrägen und lichte Höhen zwischen fertigem Fußboden und begrenzender Oberfläche. Wohnflächenregeln anhand der zum Umsetzungszeitpunkt geltenden WoFlV recherchieren und mit fachlich geprüften Beispielen absichern. Höhenbereiche und relevante Abzüge berücksichtigen. Bericht mit Raumdaten, Flächenanteilen, Annahmen und Rechenweg, danach PDF-Export gemäß F08/F09.

## Weitere Funktionen

- On-Demand-Menü mit den jeweiligen geprüften Bearbeitungsaktionen weiterentwickeln; Eigenschaften bleiben oben, Bewegungsaktionen am Zeiger.
- Schraffuren und Referenzimport/-skalierung jeweils als eigene kleine Etappen nach grundlegenden Fang- und Maßeingabefunktionen. PDF/Bild anhand zweier Punkte und bekannter Länge skalieren (F05/F10).
- Text- und Sprachbefehle nur auf bereits geprüfte Modellfunktionen erweitern. Maus, Maßeingabe und Copilot verwenden dieselben validierten Aktionen. F11 bleibt offen.
- F12 (gemeinsame Auswahlumrandung) und F14 (Ebenensystem) bleiben geplant. Ebenensichtbarkeit bei Fangfiltern berücksichtigen und Ebenen vor größeren Projekten einordnen, ohne die sechs Etappen umzudeuten.

## Arbeitsweise und Abnahme

Für jeden Teil-Schritt: aktuellen Code und Abhängigkeiten prüfen; kleinen Umfang festlegen; implementieren und passende Tests ausführen; praktische Abnahmeanleitung liefern; Ergebnis und Einschränkungen dokumentieren. NOVIKOV Glass Flow erhalten und Bedienabläufe mit bestehenden Werkzeugen abstimmen. Entwicklungszweige und Pull Requests verwenden; Übernahme nach main erst nach Prüfung.

Nächste Abnahme für Etappe 1: neue 3-m-Wand mit mittigem 1,20-m-Fenster erstellen, auf 6 m verlängern, ganze Wand über On-Demand-Menü verschieben, Fenster entlang der Wand verschieben, beide Schritte einzeln rückgängig/wiederherstellen, speichern, Maße verändern, gespeichertes Projekt laden und IFC exportieren. Grundriss/3D/Hostzuordnung und Exportplatzierung abgleichen. Automatisierte Prüfung ersetzt diese abschließende Bedienabnahme nicht.

### Abschlussnachtrag Etappe 1

Git-Synchronisierung und kombinierte praktische Verschiebeabnahme sind am 01.10.2026 abgeschlossen; Nachweis in STABILIZATION.md. Etappe 1 ist damit technisch geprüft, die Übernahme nach main bleibt der PR-Prüfung vorbehalten. Die frühere Aufzählung offener Abschlussbedingungen beschreibt den Stand vor diesem Nachtrag. Etappe 2 kann auf dem gesicherten Gesamtstand beginnen.

### Etappe 2a – 2D-Ansichtsnavigation (02.10.2026)

F04 als Voraussetzung für bildschirmbezogene Fangabstände umgesetzt: Zoom am Mauszeiger, Plus/Minus, Pan per mittlerer Maustaste oder Pan-Schalter, Fit/Reset und Bildschirmmaßstab mit grafischer Meterleiste. Das Raster liegt in Modellkoordinaten und passt seinen sichtbaren Abstand dem Zoom an. Auswahlgriffe bleiben 10 CSS-Pixel groß. Die irreführende feste Fit-Anzeige der globalen Statusleiste entfällt.

Architektur: reine Kameramathematik unter src/rendering/viewport, generischer Point2 unter src/geometry/primitives. Kamera ist flüchtiger Zustand je Ansicht. Das bestehende Project bleibt die einzige Modellquelle; keine Modellaktion, History-Änderung, Dateimigration oder IFC-Anpassung durch Navigation. Alle bestehenden Modellbearbeitungen verwenden weiterhin die geprüften Operationen.

Prüfung: 110 Tests bestanden (105 bestehende, 5 Kamera-Tests), TypeScript, gezieltes ESLint und Produktionsbuild erfolgreich. Browser: Zoomanker bleibt bis auf numerisches Rauschen fest; Pan erzeugt keinen Undo-Eintrag; 300 Pixel bei 100 px/m ergeben 3 m; direktes Strecken um 100 Pixel ergibt 4 m; Undo stellt 3 m, Redo 4 m wieder her. Wechsel zu 3D erfolgreich.

Praktische Abnahme: 2D öffnen, über einer Wandecke mit dem Mausrad zoomen; die Ecke bleibt unter dem Zeiger. Pan aktivieren und ziehen, danach Escape drücken. Maße müssen gleich bleiben. Fit view zeigt das ganze Modell. 100 px/m wählen und zeichnen/bearbeiten; anschließend Undo/Redo prüfen.

Grenzen: px/m ist ein Bildschirmmaßstab, kein Druckmaßstab. Rasterdarstellung ist adaptiv; das bisherige optionale Rasterfangen bleibt ausdrücklich bei 0,10 m. Kameras werden nicht in Projektdateien gespeichert und beim Wechsel des Viewport-Layouts neu initialisiert. Geometrisches Fangen, Referenzaktivierung und Hilfslinien sind noch offen. Nächster Schritt: gemeinsame Endpunkt-/Mittelpunkt-/Schnittpunkt-Kandidaten unter constraints/snapping gemäß ARCHITECTURE.md und F13.


### Abschluss: externe Hilfslinien schneiden feste Bearbeitungsachsen — 03.10.2026

PR #35 und #36 wurden nach Nutzerfreigabe normal in ihre bisherigen Zielzweige übernommen (ee49f05 und d4a27ce). Dieser Schritt baut auf d4a27ce auf dem Zweig feat/direct-edit-axis-guides auf.

SnapContext erhält eine optionale feste Achse. Die gemeinsame Kandidatenpipeline schneidet jede aktive, validierte externe Führung mit dieser Achse. Der Direct-Edit-Adapter entfernt nur eigene/Host-Quellen, statt alle seitlich liegenden Quellen auszuschließen. Endpunkte und bestehende Schnittpunkte werden weiterhin auf echte Achsenkompatibilität geprüft; keine Projektion wird als Endpunkt bezeichnet. Feste Achsen haben Vorrang vor Shift/Ortho. Parallele/kollineare Führungen erzeugen keinen eindeutigen Achsenschnitt. Abstand bleibt 10 CSS-Pixel vom Mauszeiger, nicht von dessen Projektion.

Neue Anzeige: Achsenschnittpunkt mit externer Führung und zweiter Führung ab dem Bearbeitungsanker. Rang 0,5 wie Hilflinienschnitt, nach echten End-/Mittel-/Segmentschnittpunkten; bestehende Rangregel entscheidet Gleichstände deterministisch. Achsenschnitte sind sitzungsgebundene Fangziele und werden nicht als frei weiterverwendbare Hover-Referenz gespeichert. Keine Modell-, JSON-, IFC- oder AI-Modelllogikänderung. Bestehende validierte Aktionen und stabiler Zielkontext bleiben maßgeblich.

Nachweis: 191 Tests bestanden, TypeScript und Produktionsbuild erfolgreich; ESLint 0 Fehler/6 bekannte Warnungen. Vier neue Testgruppen decken X/Y/schräge Achsen, Zoom/Radius, Quelleninvalidierung, Parallelität/Kollinearität, Endpunktpriorität, ungültige Achsen, eigene/Host-/abhängige Quellen, Fensterposition, veraltete Sitzung, Preview/Commit/Undo/Redo/JSON ab. Browser: Linie (0;1)–(1;1) auf X bewegen, Wandachsende (3;0) 600 ms aktivieren; sichtbarer Achsenschnitt bei (3;1), Vorschau und Commit ergeben (3;1)–(4;1). Undo/Redo und Escape ohne Modelländerung geprüft. Y/schräge Achsen und Fensterhost sind automatisiert geprüft.

Abnahme: Punktfang und Snap einschalten. Linie oberhalb einer Wand zeichnen, auswählen, im On-Demand-Menü Element auf X-Achse wählen. Ein externes Wandachsende 0,6 s anhovern, danach die Maus zur Kreuzung seiner Lotführung mit der Bewegungslinie führen. Achsenschnittpunkt anzeigen lassen, bestätigen und Undo/Redo testen. Alternativ Escape zum Abbrechen.

### Abgeschlossener Auftragsumfang: präzise Strecke bei achsengebundener Bewegung eingeben

Die vorhandene X-/Y-/Elementachsen-Bearbeitung um eine numerische Streckeneingabe in Metern ergänzen. Zuerst bestehende Eingabe-/Einheitenparser prüfen und wiederverwenden; Eingabe und Maus müssen denselben gepinnten EditSession-Kontext und denselben Vorschau-/Bestätigungspfad nutzen. Vorzeichen relativ zur eindeutig angezeigten Achsenrichtung erklären. Keine neue Bewegungslogik in der UI, keine eigenständige AI-Aktion. Zunächst nur ganze Elemente auf X/Y/Elementachse, kein Skalieren, keine Wandachsenverlagerung N45.

Abnahme: positive/negative Strecke, Dezimalkomma, ungültiger Wert, veralteter Kontext, Escape, Vorschau/Commit, genau ein Undo/Redo und JSON. Fangen darf die ausdrücklich eingegebene Strecke nicht nachträglich verändern. Tests, TypeScript, Lint, Build und praktische Browserabnahme dokumentieren.


### Abschluss: numerische Strecken für ganze Elemente — 03.10.2026

PR #37 wurde nach ausdrücklicher Nutzerfreigabe normal als 47b24ca in feat/shared-segment-intersections übernommen. Umsetzung auf feat/numeric-axis-move.

Nach Element auf X-/Y-Achse oder Element entlang Achse erscheint Strecke (m) in der bestehenden Bearbeitungseinblendung. Der vorhandene parseMetres-Parser akzeptiert Dezimalpunkt/-komma sowie Vorzeichen. X/Y zeigen positive Weltachsen; die Elementachse zeigt ausdrücklich die Richtung zwischen den nummerierten Punkten (beim ersten Griff Punkt 2 → 1). Negative Werte laufen entgegengesetzt. Der eingegebene Wert ist eine relative Strecke vom gepinnten Bearbeitungsanker, keine Zielkoordinate. Keine Einheitensuffixe oder Rechenausdrücke in diesem Schritt.

application/direct-edit/numeric.ts übersetzt nur die Strecke in einen Punkt und verwendet previewEdit; Bestätigung verwendet unverändert editingReducer/confirm. Vorschau bleibt abgeleitet, History/Datei/IFC lesen weiterhin das bestätigte Projekt. BimPlan und die 3D-Ansicht zeigen denselben numerischen Entwurf. Solange Text eingegeben ist, kann Mausbewegung, Raster oder Punktfang die Zahl nicht überschreiben; bestätigt wird mit Enter oder Strecke übernehmen. Leeren/Maussteuerung kehrt zur Maus zurück. Fehler sperren Bestätigung, Escape auch im Eingabefeld bricht ab. Entwurf ist an dieselbe EditSession gebunden; neue Sitzung übernimmt keinen alten Wert. Punkt-/Streckgriffe und Fenster sind vorerst ausgeschlossen. Keine zweite AI-Modelllogik, kein Dateiformatwechsel.

Nachweis: 194 Tests bestanden, TypeScript und Build erfolgreich; ESLint 0 Fehler/6 bekannte Warnungen. Neue Gruppen prüfen X/Y/Elementachse, positive/negative/Nullwerte, Dezimalkomma, normierte schräge Richtung, ungültige Texte, stale Auswahl/Modell, Vorschau/Commit/Undo/Redo/JSON. Browser: +1,25 m auf X bleibt vor Bestätigung ohne Undo-Eintrag, bestätigte Lage identisch; Undo/Redo korrekt. Ungültiger Text sperrt Übernehmen. -0,375 m auf Y bleibt trotz Mausbewegung exakt; Escape im Feld stellt den bestätigten Stand wieder her. 3D-Vorschau durch gemeinsamen previewEdit-Aufruf angebunden, separat noch nicht praktisch abgenommen.

Abnahme: Wand auswählen, Element auf X-Achse wählen, 1,25 in Strecke (m) eingeben und Vorschau betrachten. Enter oder Übernehmen, danach Undo/Redo. Mit negativem Wert, ungültigem Text und Escape wiederholen. Elementachse zeigt ihre positive Richtung ausdrücklich an.

### Zurückgestellter Auftrag zugunsten Nutzerkorrektur: numerisches Strecken eines ausgewählten Punktgriffs

Die vorhandene Aktion Punkt in Flucht strecken um dieselbe Meter-Eingabe erweitern. Positive Strecke verlängert vom Nachbarpunkt weg, negative verkürzt. Bestehenden Griffversatz, Nachbarüberquerung und Fenstergrenzen respektieren; keine Änderung der Wandachsenlage N45. Die numerische Vorschau und Bestätigung müssen dieselben gepinnten Bearbeitungsaktionen nutzen. Tests für schräge Linien/Wände, ungültiges Verkürzen, Kontextwechsel und Undo/Redo sowie praktische Abnahme einschließlich 3D-Zahlenvorschau. Fensterbewegung und freie Punktbewegung bleiben außerhalb dieses Teilauftrags.


### Abschluss: kompaktes Hilfseingabefenster der Rasterengine — 03.10.2026

Nutzerkorrektur hat Vorrang vor dem zuvor geplanten Streckgriff: großes festes Streckenfeld durch ein kompaktes Hilfseingabefenster nahe der Auswahl ersetzen und freies Bewegen mit Winkel/Länge unterstützen. Umsetzung auf feat/compact-polar-input, aufbauend auf PR #38 / 86b5839. PR #38 bleibt offen; keine zusätzliche Merge-Freigabe angenommen.

PrecisionInput ist eine wiederverwendbare, modellfreie UI-Komponente (230 px breit, im normalen Zustand etwa 140 px hoch), mit verschiebbarem Kopf und Bildschirmbegrenzung wie beim On-Demand-Menü. Startposition ist die vorhandene Auswahl-/Menüposition. Zwei nebeneinanderliegende Felder: Winkel in Grad und Länge in Metern. Der gewählte Modellpunkt bleibt der gepinnte Ursprung. Winkelkonvention: 0° rechts/+X, 90° oben/+Y, gegen den Uhrzeigersinn. Die Maus liefert über den gemeinsamen Direct-Edit-Fangresolver eine Richtung; dessen Shift-/Ortho-/Referenzregeln bleiben erhalten.

Freies Bewegen hat jetzt einen ausdrücklichen Richtungswahl-Schritt: erster Klick fixiert die Richtung, erzeugt noch keinen History-Eintrag und fokussiert das Längenfeld. Winkel kann stattdessen direkt eingetragen werden. Leerer Winkel folgt der Maus, gesetzter Winkel bleibt fix; leere Länge folgt der Mausprojektion auf die feste Richtung, gesetzte Länge bleibt exakt. Maus setzt beide Eingaben zurück. Enter/Übernehmen bestätigt, Escape/Abbrechen verwirft. Negative Länge bewegt in Gegenrichtung. Dezimalkomma/-punkt werden akzeptiert, ungültige Werte sperren Bestätigung. Bei festem Winkel und leerer Länge bleibt Rückwärtsbewegung vor dem Ursprung bei Länge null; eine negative Länge kann ausdrücklich eingegeben werden.

constraints/input/polar.ts bildet als gemeinsame, React-/BIM-freie Eingabelogik den Zielpunkt aus Ursprung/Richtung/Länge. application/direct-edit/numeric.ts validiert Texte und Kontext und verwendet weiterhin previewEdit/confirm. BimPlan liefert Mausziele, das Fenster verändert kein Modell selbst. X/Y/Elementachsen bleiben Alternativen und verwenden dasselbe Fenster mit angezeigtem, nicht editierbarem Winkel. Zunächst ganze Wände/Linien; Fenster, Zeichnen und Punktstrecken noch nicht an dieses Fenster angebunden. Bestehender 3D-Vorschauadapter wird weiterverwendet; freie Richtungswahl startet in 2D. Kein Projektformat-/IFC-Wechsel, keine zweite AI-Modelllogik.

Nachweise: 198 Tests bestanden, TypeScript und Build erfolgreich, ESLint 0 Fehler/6 bekannte Warnungen. Vier neue Testgruppen: gepinnter Ursprung, Kardinal-/schräge Winkel, unabhängige Eingaben, negative Länge, fehlende/ungültige Werte, Klick auf Wandecke, unveränderte Wandmaße, stabile Auswahl/Modellprüfung und ein Undo/Redo/JSON-Rundlauf. Browser: Ecke (3;0,18), Maus nach oben, Klick fixiert 90° und fokussiert Länge; 1,25 m verschiebt die ganze Wand exakt auf y=1,25. Kein History-Eintrag vor Bestätigung, Undo/Redo geprüft. Direkte Eingabe 0°/2 m bleibt bei Mausbewegung unverändert; ungültiger Winkel sperrt Bestätigung; Escape erhält bestätigten Stand. Fenster nahe der Auswahl und per Tastatur am Kopf verschoben. Keine separate praktische 3D-Abnahme in diesem Schritt.

### Abgeschlossener Auftragsumfang: Hilfseingabe für Punkt in Flucht strecken

Dasselbe kompakte Fenster an die bestehende Streckgriff-Aktion anbinden. Die gewählte Fluchtrichtung bleibt fest; positive Länge verlängert, negative verkürzt. Griffversatz, Nachbarüberquerung und Fenstergrenzen müssen unverändert über die gemeinsame Modellaktion validiert werden. Tests für schräge Wände/Linien, unzulässiges Verkürzen, stale Kontext, Escape/Undo/Redo und praktische Prüfung auch der abgeleiteten 3D-Zahlenvorschau. Kein separates Eingabefenster pro Werkzeug; Zeichnen und Fensterbewegung bleiben spätere Verbraucher.


### Bedienkorrektur: Hilfslinien im freien Bewegen und Winkelgrenzen — 03.10.2026

Ergänzung zu PR #39: Der gepinnte Bewegungsursprung ist während Element frei bewegen automatisch eine sitzungsgebundene Referenz der gemeinsamen Engine, mit Kantenrichtung und Lot sowie den bestehenden Winkelführungen. Er bleibt während der Eingabe aktiv; weitere externe Quellen können weiterhin per Hover erworben werden. Eigene Modellgeometrie bleibt vom Fang ausgeschlossen, nur der explizite Ursprung ist als temporäre Konstruktion zugelassen. Der Ursprung ist nicht per Hover lösbar und beansprucht keinen der vier externen Hoverplätze; Ende/Abbruch der Sitzung entfernt ihn. Snap aus deaktiviert weiterhin das Fangen. Keine Geometriekopie, kein Dateiformateintrag.

Winkeleingaben außerhalb 0° bis einschließlich 360° werden jetzt in der gemeinsamen polaren Eingabelogik abgelehnt, nicht mehr modulo umgerechnet. 360° entspricht 0°; negative Bewegungsstrecken bleiben erlaubt. Ungültiger Text bleibt zur Korrektur im Feld, erzeugt eine Fehlermeldung und sperrt Übernehmen.

Nachweise: 199 Tests bestanden, TypeScript und Build erfolgreich; ESLint 0 Fehler/6 bekannte Warnungen. Regression prüft Ursprung als Führungsquelle bei weiter ausgeschlossenem Eigenmodell und Grenzen -1/360,01/566 versus 0/360. Browser: ausgewählte Ecke (3;0,18) erzeugt sofort eine Lot-Hilfslinie während freier Bewegung; diese bleibt bei der Winkeleingabe sichtbar. 566° sperrt Bestätigung, 90° mit Länge 2 m zeigt korrekte Vorschau. Abbrechen entfernt temporären Ursprung und Hilfslinie. Der nächste begrenzte Folgeauftrag bleibt Hilfseingabe für Punkt in Flucht strecken.


### Abschluss: numerisches Strecken mit gemeinsamer Hilfseingabe — 03.10.2026

PR #38 und #39 wurden nach Nutzerfreigabe in Reihenfolge normal in ihre bisherigen Zielzweige übernommen (5681992 und 16beed6). Neuer Zweig feat/numeric-point-stretch basiert auf 16beed6. main bleibt unverändert.

Punkt in Flucht strecken verwendet jetzt dasselbe kompakte Hilfseingabefenster wie die Bewegung. Winkel ist an die vorhandene Fluchtrichtung gebunden; positive Meter verlängern vom Nachbarpunkt weg, negative verkürzen. Der angeklickte Wandeck-Griff bleibt Ursprung, einschließlich seines Versatzes zur Wandachse. Die Application-Eingabe erweitert nur die zugelassenen Aktionen und verwendet weiterhin previewEdit/confirm; kein zusätzlicher Transformationscode, kein neues Fenster. Vorhandene Grenzen für Nachbarüberquerung und Fensterbreite bleiben wirksam. Kontextwechsel und ungültige Eingabe verhindern Übernahme.

In geteilten Ansichten bleibt eine vorhandene 3D-Ansicht beim Start der 2D-Bearbeitung erhalten. Damit sind dieselben numerischen Entwürfe gleichzeitig in Grundriss und 3D sichtbar; in Einzelansicht wird weiterhin zur 2D-Bearbeitung gewechselt. Eigenschaften/Navigator zeigen bis zur Bestätigung den gespeicherten Stand.

Nachweise: 201 Tests bestanden, TypeScript/Build erfolgreich, ESLint 0 Fehler/6 bekannte Warnungen. Zwei neue Testgruppen prüfen positive/negative Strecken an beiden Enden schräger Linien/Wände, unveränderten Gegenpunkt, Griffversatz, Fenstergrenzen, Nachbarüberquerung, fehlenden Griff, stale Modell/Auswahl, einen Commit/Undo/Redo/JSON sowie Abbruch. Browser: 3-m-Wand über Endgriff um 1,25 m auf 4,25 m verlängert, Vorschau in 2D und 3D visuell geprüft; Eigenschaften vor Commit weiter 3 m. Ungültige Verkürzung -2 m bei vorhandenem 1,20-m-Fenster gesperrt. Commit 4,25 m, Undo 3 m, Redo 4,25 m. Anschließend -0,5 m ergibt 3,75-m-Vorschau, Escape stellt 4,25 m wieder her. Die noch ausstehende praktische 3D-Zahlenvorschauabnahme ist damit erledigt.

Abnahme: Wandecke oder Linienpunkt anklicken → Punkt in Flucht strecken → 1,25 eingeben → Vorschau prüfen und übernehmen. Mit negativer Strecke verkürzen; unzulässige Werte dürfen nicht übernommen werden. Für gleichzeitige 3D-Prüfung vorher Zwei Ansichten und 3D aktivieren, dann den Griff im Grundriss wählen.

### Abgeschlossener Auftrag: gemeinsame Hilfseingabe beim Zeichnen einer geraden Linie

Das vorhandene Hilfseingabefenster nach Setzen des ersten Linienpunkts aktivieren. Ursprung bleibt der erste Punkt; Maus/Fangengine bestimmen die Richtung oder Winkel/Länge werden ausdrücklich eingegeben. Gemeinsame polare Eingabe und vorhandene validierte Linienerzeugung verwenden; keine zweite Zeichenlogik. Zunächst einzelne gerade Linien, keine Polylinien oder weiteren Bauteile. Prüfen: Maus versus fixierte Werte, 0–360°, ungültige/Null-Länge, Escape ohne Bauteil, ein Commit/Undo/Redo und JSON; praktische Browserabnahme. Wandachsenlage N45 und Fensterbewegung bleiben spätere Aufgaben.


### Abschluss: gemeinsame Eingabe statt Werkzeugkopien — 03.10.2026

PR #40 wurde nach Nutzerfreigabe normal in feat/numeric-axis-move übernommen (053b631). Der neue Zweig feat/shared-line-precision basiert darauf; main unverändert.

Nach dem ersten Punkt einer geraden Linie erscheint das vorhandene Hilfseingabefenster nahe dem Punkt. Zwei Klicks zeichnen weiterhin mit der Maus; alternativ Winkel/Länge eingeben und Enter/Übernehmen verwenden. Fixierte Werte haben Vorrang vor Mausfang. Maus leert beide Felder. 0–360°, Dezimalkomma und negative gerichtete Längen verwenden dieselbe polare Auswertung wie Bewegung. Null-Länge, ungültige Werte und geänderter Modellkontext verhindern Übernahme. Escape/Abbrechen verwirft den Entwurf.

Architektur: Ein PrecisionInput und ein usePrecisionDraft für alle angeschlossenen Aktionen. application/input/precision.ts verbindet den zentralen Textparser mit constraints/input/polar.ts; application/drawing/line-input.ts prüft die Zeichengrenzen. Bestehendes addLine und gemeinsame History übernehmen das Modell. Keine zweite Linienerzeugung, keine neue Projektstruktur. Der bisherige Parserexport bleibt kompatibel. Noch bestehende Zeichenkoordination in CadWorkspace wird schrittweise migriert.

Nachweise: 204 Tests bestanden, TypeScript/Build erfolgreich, ESLint 0 Fehler/6 bekannte React-Refresh-Warnungen. Neue Tests prüfen gemeinsame Auswertung, exakte Werte trotz anderer Mauslage, Mauswinkel, Dezimalkomma, 360°, negative Länge, ungültige Winkel/Zahlen, Null-Länge, stale Modell und einen Commit/Undo/Redo/JSON-Rundlauf. Browser: Linie ab (0;1) mit 0°/1,25 m bleibt bei Mausbewegung exakt; 566° und Null-Länge sperren Übernahme. Commit erzeugt genau eine Linie, Undo entfernt und Redo stellt sie wieder her. Neue Zeichensitzung und Wechsel zu freier Wandbewegung starten mit leeren Feldern. Escape erzeugt keine zusätzliche Linie. Freie Wandbewegung fixiert per Klick weiterhin 90°, fokussiert Länge und zeigt Ursprungshilfslinie.

Praktische Abnahme: Linie wählen → ersten Punkt setzen → Winkel 45 und Länge 2 eingeben → Vorschau prüfen → Enter → Undo/Redo. Danach 566° beziehungsweise Länge 0 und Escape testen. Polylinien und andere Zeichenwerkzeuge sind noch nicht angeschlossen.

### Abgeschlossener Folgeauftrag: gemeinsame Hilfseingabe beim Zeichnen einer geraden Wand

Den geprüften Eingabebaustein nach dem ersten Wandpunkt verwenden. Vorher die gemeinsame Zeichenkoordination für Linie/Wand begrenzt hinter einen Application-Adapter ziehen, damit CadWorkspace keine zweite Eingabelogik erhält. Bestehendes addWall, Fangengine und History wiederverwenden. Vorschau und Commit mit 3,00 m Länge, 0,36 m Stärke und 2,80 m Höhe prüfen, einschließlich Winkel, Null-Länge, Abbruch, Undo/Redo, JSON und 2D/3D. Keine Wandketten, Anschlüsse oder Änderung der Wandachsenlage N45 in diesem Teilauftrag.


### Nutzerkorrektur: sofortiger Konstruktionsursprung bei jeder Bewegung — 03.10.2026

Vorrangige Korrektur auf fix/shared-movement-origin, aufbauend auf dem noch offenen PR #41. Ursache: editOriginReference war nur für Element frei bewegen zugelassen; die übrigen Aktionen verwendeten zwar den Resolver, erhielten aber keinen sofort gepinnten Ursprung. Diese Aktions-/Fensterausnahme ist zentral entfernt. Punkt frei bewegen, Strecken, X/Y/Elementachse und Fensterbewegung erhalten jetzt denselben unmittelbaren Ursprung. Fenster behalten die Wandrichtung, feste Achsen bleiben verbindlich und Eigenmodell/Host bleiben von externen Fangquellen ausgeschlossen.

Verbindlicher Zukunftswunsch in ARCHITECTURE.md und AGENTS.md: jede Bewegung jedes späteren Elements (auch Decken, Dächer, Treppen, Möbel) startet über denselben Konstruktionsursprung und die gemeinsame Engine. Keine zusätzliche 0,6-s-Wartezeit für den bereits ausgewählten Ursprung; weitere Referenzen behalten die Hover-Regeln. 3D-Arbeitsebenen und noch nicht vorhandene Bauteile sind damit Anforderungen, keine bereits implementierten Funktionen.

Nachweise: 206 Tests bestanden, TypeScript/Build erfolgreich, ESLint 0 Fehler/6 bestehende Warnungen. Regressionen prüfen alle sechs Aktionen für Wand und Linie, gewählten Eckversatz, Eigenmodell-Ausschluss, freie Hilfslinie, Achsbindung, Abbruch ohne History sowie Fensterursprung/Hostbindung. Browser: Wandecke → Punkt frei bewegen zeigt sofort den Referenzring bei (3;0,18), danach senkrechte Referenzhilfslinie zur Maus. Zoom erhält den Ring, Escape entfernt ihn.

Abnahme: Wandecke oder Linienpunkt anklicken → Punkt frei bewegen → Maus nach oben oder diagonal führen. Ursprung muss sofort als Ring sichtbar sein, die Hilfslinien folgen der Maus. Zoom und Abbruch prüfen. Dasselbe bei Strecken und Achsbewegung wiederholen. Der einzige nächste ausführbare Folgeauftrag bleibt die oben beschriebene gemeinsame Hilfseingabe beim Zeichnen einer geraden Wand.


### Nutzererweiterung: Linien verfolgen und Tab-Hilfseingabe — 03.10.2026

Umsetzung auf feat/parallel-hover-tab-input, aufbauend auf dem offenen PR #42. Gerade Linien-/Polyliniensegmente und Wandachsen können entlang ihres Inneren nach 0,6 s als Richtungsreferenz erfasst werden. Die Mitte markiert die stabile Segmentreferenz, die erfasste Linie ist zusätzlich gestrichelt hervorgehoben. Erneutes Verlassen/Anhovern und 0,6 s löst sie wie andere Referenzen. End-/Mittel-/Schnittpunkte behalten Fangvorrang, maximal vier externe Quellen bleiben bestehen.

Die erfassten Richtungen stehen an aktiven Bezugspunkten, insbesondere Bewegungs- und Linienzeichenursprüngen, als Parallelen bereit. Hilfslinie und Fangmeldung Parallel verwenden denselben Resolver. Segmenterfassung sitzt in constraints/inference/segment-hover.ts, Segmentdaten im vorhandenen Projektadapter, Darstellung/Timer in den gemeinsamen Komponenten. Kein dauerhafter Modelleingriff.

Tab wird im gemeinsamen PrecisionInput behandelt: Maus führt Richtung → Tab fokussiert Länge und übernimmt die ungerundete Richtung → Tab Winkel → Tab Länge. Enter bestätigt, Escape verwirft; andere Textfelder bleiben unbeeinflusst, Achswinkel bleiben schreibgeschützt. Punkt frei bewegen verwendet nun ebenfalls die gemeinsame Winkel-/Längeneingabe; seine bisherige Mausbestätigung bleibt verfügbar.

Nachweis: 209 Tests bestanden, TypeScript und Build erfolgreich, ESLint 0 Fehler/6 bestehende Warnungen. Tests: 599/600-ms-Grenze, stabiles Segment bei kleiner Mausbewegung, einmalige Aktivierung und erneutes Lösen, bildschirmbezogener Abstand bei mehreren Zoomstufen, Segmentgrenzen, schräge Parallele an anderem Ursprung, Snap aus/Quelle entfernt sowie numerische Punktbewegung mit unverändertem Gegenpunkt und Undo. Browser: schräge 30°-Linie durch Hover erfasst; beim Linienzeichnen Parallele mit eindeutiger Fangmeldung am neuen Ursprung. Tab übernimmt 30° und fokussiert Länge. Freie Wandeckbewegung: Tab Länge bei 90°, Tab Winkel, Tab Länge; 1 m/Enter verändert nur den gewählten Endpunkt, Undo stellt die 3-m-Wand wieder her. Escape geprüft.

Abnahme: schräge Linie zeichnen → neue Linie beginnen oder Bewegung starten → über ein fremdes Liniensegment 0,6 s verweilen → vom Ursprung ungefähr parallel führen → Parallel-Hilfe prüfen → Tab → Länge eingeben → Tab → Winkel prüfen/ändern → Enter. Bei Achsbewegung muss der Winkel fest bleiben. Der nächste begrenzte Folgeauftrag bleibt gemeinsame Hilfseingabe beim Zeichnen gerader Wände.


### Abschluss: gemeinsame Hilfseingabe für gerade Wände — 03.10.2026

Auf feat/shared-wall-precision, basierend auf dem noch offenen PR #43. PR #41–43 bleiben ohne neue Freigabe offen. Nach dem ersten Wandpunkt erscheint dasselbe PrecisionInput wie bei Linie/Bewegung. Ursprung, Parallelreferenzen, Tab Länge/Winkel, feste Zahlen, Maus, Enter und Abbruch werden gemeinsam verwendet. Wandstärke 0,36 m und Höhe 2,80 m bleiben die bisherigen Zeichenstandardwerte; nachher über Eigenschaften änderbar.

Die Application-Aktion createDrawing bündelt Wand-/Linien-/Polylinienerzeugung, prüft veralteten Modellkontext und verwendet bestehende addWall/addLine-Validierung. Die UI koordiniert weiter Punktaufnahme und Commit, enthält aber keine separaten Bauteilerzeugungsaufrufe mehr. previewDrawingInput ersetzt den linienspezifischen Eingabeadapter bei kompatiblem altem Export. Kein zusätzliches Eingabefenster oder Winkelalgorithmus.

Nachweise: 212 Tests bestanden, TypeScript/Build erfolgreich, ESLint 0 Fehler/6 bestehende Warnungen. Neue Tests für exakte Wand 3,00 × 0,36 × 2,80 m, 3D-Grenzen, Vorschau ohne Mutation, einen Commit/Undo/Redo/JSON, Null-Länge, falsche Winkel/Maße, stale Modell und erhaltene Linien-/Polylinienstile. Browser: Ursprung (0;1), Richtung mit Tab übernommen, 0°/3,00 m bleibt bei Mausbewegung exakt; 0 m und 566° sperren Übernahme. Bestätigte Eigenschaften 3/0,36/2,8; Undo entfernt, Redo stellt Wand wieder her. Neue Sitzung hat leere Felder; Abbrechen entfernt Hilfseingabe ohne Wand. Anschließende 3D-Darstellung visuell geprüft. Vorschau beim Zeichnen bleibt eine 2D-Achslinie; kein neuer 3D-Zeichenvorschaumodus.

Abnahme: Wandwerkzeug → Startpunkt → Maus nach rechts → Tab → 3,00 → Enter. Eigenschaften und 3D prüfen, Undo/Redo. Neuer Startpunkt, 0 beziehungsweise 566° testen und Escape/Abbrechen. Keine Wandketten, Anschlüsse oder Änderungen der Wandachsenlage.

### Zurückgestellt zugunsten Architekturkorrektur: gemeinsame Hilfseingabe für Polyliniensegmente

Die vorhandene Eingabe nach jedem gesetzten Polylinienpunkt an dessen Ursprung binden. Enter fügt den numerisch bestimmten nächsten Punkt hinzu; Doppelklick schließt weiterhin die gesamte Polylinie ab. Die bisherige eine History-Aktion pro abgeschlossener Polylinie erhalten. Tab, Parallelführung, Abbruch, ungültige/Null-Segmente, Abschluss und Undo/Redo prüfen. Keine Wandketten-Undo-Entscheidung vorwegnehmen und keine zweite Eingabe-/Fanglogik.


### Abschluss: gemeinsame Interaktionssteuerung statt weiterer UI-Sonderfälle — 03.10.2026

Nutzerfreigabe betrifft den begrenzten Architekturumbau. Keine Freigabe für Merge der offenen PRs #41–44 abgeleitet. Umsetzung auf refactor/shared-tool-interaction, aufbauend auf PR #44.

Bestandsaufnahme: Fang-/Hilfslinienservices, Polarberechnung und PrecisionInput waren bereits gemeinsam. CadWorkspace enthielt aber die Auswahl der numerischen Bearbeitungsart, Fehlerbehandlung und getrennte Zeichen-/Edit-Bestätigung direkt. BimPlan entschied zusätzlich anhand der konkreten EditAction über Richtungswahl.

Jetzt: ToolInteraction als typisierter Application-Vertrag, zwei kleine Adapter für vorhandene Edit-/Zeichenaktionen, eine gemeinsame Auswertung und erneute Validierung vor Commit. useToolInteraction steuert Entwurf, Vorschau, Mauswahl, Richtungsfixierung, Bestätigen und Abbrechen; InteractionInput bindet einmalig die vorhandene Tab-/Feldbedienung an. Der Workspace reicht Ursprung/Kontext und Modellaktionen weiter. Escape/Werkzeug-/Auswahlwechsel verwenden denselben Reset für Bearbeitung und Zeichenpunkte. Der Viewport trifft keine EditAction-spezifische Richtungswahl mehr. Kein neuer Fangalgorithmus und keine parallele Modellhaltung.

Nachweise: 215 Tests bestanden, TypeScript/Build erfolgreich, ESLint 0 Fehler/6 bestehende Warnungen. Neue Vertragsprüfungen führen Wand-/Linienerzeugung sowie alle sechs Editaktionen an Wand/Linie über denselben Ablauf; Vorschau ohne History, ein Commit und Undo, ungültige/stale Bestätigung ohne Mutation. Browserregression: Wand 3 m per Tab, Elementbewegung mit Klick-Richtung 90° und 0,5 m, Punktbewegung 90°/1 m, ungültiges Strecken -2 m mit Fenster gesperrt, Escape, neue Linie mit leeren Feldern, 2-m-Linie und Undo/Redo.

Einschränkung: Punktaufnahme und einige bestehende Viewport-/History-Anbindungen sind noch Legacy-Koordination; der gesamte zukünftige CAD-Werkzeugrahmen ist damit nicht fertig. Die aktuell angeschlossene Eingabe-/Bestätigungslogik läuft jedoch über einen gemeinsamen Vertrag. 3D-Arbeitsebenen, neue Bauteile und Polylinienpräzision wurden nicht zusätzlich implementiert.

### Abgeschlossener Folgeauftrag: Polylinie als Vertragsnachweis

Die vorhandene Polylinie als weiteren Verbraucher des gemeinsamen Interaktionsvertrags anbinden. Pro Segment den aktuellen Punkt als Ursprung bereitstellen; dieselbe Eingabe, Tab, Fangengine und Bestätigung unverändert nutzen. Doppelklick beendet weiterhin die Polylinie, ein Undo-Schritt für den Gesamtabschluss bleibt erhalten. Prüfen, dass dazu keine zusätzliche Feld-/Tab-/Hover-Steuerung oder neue Werkzeugabfrage im gemeinsamen Interaktionskern nötig ist. Neue Punktaufnahme, Abschluss und Abbruch mit numerischen Segmenten praktisch testen; keine Wandkettenentscheidung vorwegnehmen.


### Abschluss: Polylinie verwendet unveränderten Interaktionskern — 03.10.2026

Auf feat/polyline-shared-interaction, basierend auf offenem PR #45; keine Merge-Freigabe angenommen. Für die Polylinie wird nun der jeweils letzte Entwurfspunkt als Ursprung an den vorhandenen drawingInteraction-Adapter übergeben. ToolInteraction, useToolInteraction, PrecisionInput, Tab-/Hover-/Parallelsteuerung wurden nicht verändert. Nach jedem numerisch bestätigten Segment ist der nächste Ursprung aktiv und die Eingabe leer. Bis zum Abschluss bleibt die Polylinie ein Entwurf.

Enter im Eingabefeld ergänzt einen Punkt. Doppelklick beziehungsweise Enter im Grundriss schließt wie bisher die gesamte Polylinie ab. Ungültige explizite Eingaben sperren auch den Gesamtabschluss, statt stillschweigend verworfen zu werden. Escape/Abbrechen verwirft den ganzen Entwurf; bestätigte Elemente bleiben erhalten.

Nachweise: 217 Tests bestanden, TypeScript/Build erfolgreich, ESLint 0 Fehler/6 bestehende Warnungen. Neue Vertragsprüfungen für mehrere numerische Segmente mit wechselndem Ursprung, leere nächste Eingabe, ungültige/Nullwerte, kein Modell/History vor Abschluss, genau einen Commit und Undo/Redo sowie Abbruch. Browser: 3 m rechts und 2 m oben erzeugen Entwurf mit drei Punkten, Doppelklick am Endpunkt ergibt eine 5-m-Polylinie. Ein Undo entfernt sie, Redo stellt sie wieder her. Weiterer Entwurf mit 566° sperrt Übernehmen und Doppelklickabschluss; Escape verwirft nur diesen Entwurf.

Abnahme: Linie → Zeichenmodus Polylinie → Startpunkt → Maus nach rechts → Tab → 3 → Enter. Winkel 90 und Länge 2 → Enter. Am letzten Punkt doppelklicken, dann Undo/Redo prüfen. Bei der nächsten Polylinie ungültigen Winkel und Escape prüfen.

### Abgeschlossener Folgeauftrag: gemeinsamen Fangkontext an den Werkzeugvertrag anbinden

Den noch in BimPlan zwischen Zeichnen und Direct Edit verzweigten Aufbau von Ursprung, ausgeschlossenen Quellen und Fangabfrage hinter den vorhandenen Werkzeugvertrag führen. Bestehende querySnap/resolveEditSnap-Services weiterverwenden. Nachweis für Punkt-/Elementbewegung, feste Achsen, Fensterbindung und Zeichnen; Referenzen müssen Zoom überstehen und bei Kontextwechsel korrekt enden. Keine neue Fangmathematik oder UI-Funktion, kein neues Bauteil. Dies vervollständigt gezielt die gemeinsame Anbindung anstelle weiterer werkzeugweiser Sonderfälle.


### Abschluss: ein Fangkontext für Zeichnen und Bewegung — 03.10.2026

Auf refactor/shared-snap-context, basierend auf offenem PR #46. ToolInteraction enthält jetzt verpflichtend die Fangrichtlinie aus Ursprung, Quellenfilter und Resolver. Application-Funktionen prepareToolReferences/resolveToolSnap bilden den gemeinsamen Einstieg. BimPlan liefert Maus, Maßstab, Modifier und aktive Referenzen, ohne getrennte Zeichen-/Edit-Fangkontexte oder eigene Auswahl der auszuschließenden Elemente. Bestehende querySnap/resolveEditSnap bleiben zuständig für Geometrie und Achs-/Hostbindung.

Die Richtlinie bleibt für dieselbe unveränderliche Sitzung beziehungsweise denselben Entwurfspunkt identisch. Zoom, Kamerabewegung und Eingabetext erzeugen daher keinen neuen Referenzsatz; neuer Ursprung/Sitzung oder neues Projekt erzeugen den passenden Kontext. Ableitungen liegen in schwachen Caches und enthalten keine eigenständige bearbeitbare Modellkopie.

Nachweise: 220 Tests bestanden, TypeScript/Build erfolgreich, ESLint 0 Fehler/6 bekannte Warnungen. Neue Tests vergleichen alle Editaktionen an Wand/Linie sowie Fensterbewegung mit dem bisherigen Resolver, einschließlich Eigenmodell-/Host-Ausschluss, Snap aus, Shift und Ortho. Weitere Prüfungen für stabile Richtlinienidentität, Sitzungswechsel, Zeichnen und Idle-Fang. Browser: Wandecke zeigt sofort Ursprung und Lot-Hilfe; Zoom und Zahleneingabe erhalten den Ring, Escape entfernt ihn. Neuer Linienursprung aktiv, 45°/2 m erfolgreich bestätigt. Anschließende externe Linienreferenz auch nach Zoom erhalten.

Abnahme: Wandecke → Punkt frei bewegen → Maus nach oben → Zoom → Tab/Länge → Escape. Ursprung und Hilfslinie dürfen nicht durch Zoom verschwinden, müssen nach Abbruch verschwinden. Danach Linie zeichnen und fremde Referenz verfolgen.

### Abgeschlossener Folgeauftrag: Sitzungswechsel bei History und Projektladen absichern

Den gemeinsamen Interaktions-/Fangkontext bei Undo/Redo und Projektwechsel während einer laufenden numerischen oder mausgeführten Aktion prüfen. Alte Ursprünge, fixierte Werte und Referenzen dürfen weder in das neue Projekt gelangen noch einen alten Entwurf bestätigen. Fehlverhalten gezielt korrigieren; bestehende Modellaktionen und Projektdateien beibehalten. Regressionen und praktische Abnahme mit Bewegung und Polylinienentwurf; keine neue Bauteilfunktion.


### Abschluss: History-/Projektwechsel und modale Tastaturzuständigkeit — 03.10.2026

Auf fix/interaction-project-transitions, basierend auf offenem PR #47. Die bestehende gemeinsame Reset-/History-Steuerung entfernt laufende Bearbeitungen bei Undo/Redo und bestätigtem Laden bereits korrekt. Ein reproduzierter Fehler lag in der Tastatursteuerung: Tab des Hilfseingabefensters griff im Hintergrund des Ladedialogs ein; dessen Fokus blieb auf Abbrechen statt auf Projekt laden zu wechseln.

Korrektur im gemeinsamen PrecisionInput: modaler Dialog/Alertdialog außerhalb des eigenen Panels behält Tab. Auch globale Workspace-Werkzeugkürzel ignorieren modale Inhalte. Keine separate Lösung für einzelne Werkzeuge. Abgebrochene Ladebestätigung erhält den bisherigen Entwurf; bestätigtes Laden verwirft ihn.

Nachweise: 222 Tests bestanden, TypeScript/Build erfolgreich, ESLint 0 Fehler/6 bekannte Warnungen. Neue Regressionen für Undo/Redo/Projektwechsel mit altem Edit-Token, auch nach Rückkehr zum ursprünglichen Modell; niemals Mutation durch alte Bestätigung. Alte Polylinienentwürfe werden im neuen Projekt abgewiesen. Browser: Punktbewegung 90°/1 m → Ladebestätigung abbrechen erhält Felder. Erneut laden → Tab fokussiert Projekt laden → Enter lädt 5-m-Wand mit gleicher Wand-ID; keine alten Felder/Ringe. Undo zeigt ursprüngliche 3-m-Wand ohne Bearbeitung, Redo 5 m. Polylinienentwurf wird bei Undo vollständig verworfen, neue Sitzung hat leere Felder. Laden während weiterem Polylinienentwurf (auch identisches Projekt) entfernt Entwurf, Ring und Eingabefenster; keine zusätzliche Linie.

Abnahme: laufende Punktbewegung oder Polylinie beginnen → Projektdatei öffnen → Tab/Abbrechen prüfen; danach erneut öffnen und Tab/Enter laden. Undo/Redo darf nur bestätigte Modelle zurückbringen, keine alten Entwürfe.

### Abgeschlossener Folgeauftrag: offene PR-Kette geordnet zur Übernahme vorbereiten

Die aufeinander aufbauenden PRs ab #41 einschließlich dieses Stabilisierungsschritts auf Zielzweige, Abhängigkeiten und offenen Prüfstatus kontrollieren. Einen verständlichen Übernahmeplan mit finalem Entwicklungsstand und verbleibenden Einschränkungen erstellen. Bereits vorhandene Testnachweise zuordnen; zusätzliche Prüfung nur bei neuen Abweichungen. Keine neuen Funktionen und kein automatischer Merge ohne ausdrückliche Nutzerfreigabe für die betreffenden PRs.

### Abschluss: konsolidierter Hauptzweig und exakte Wandaußenecke — 03.10.2026

PR #49 wurde nach Nutzerfreigabe normal nach main übernommen (44fc036); PR #27 damit übernommen, #28/#30/#31/#33 als inhaltlich enthalten geschlossen. Die veröffentlichte Historie bleibt erhalten.

Auf fix/wall-corner-target wird die bekannte Eckabweichung korrigiert. Ein vor der Änderung fehlschlagender Test zeigt: Der bisherige Achsendpunktversatz trifft bei Drehung nicht die ausgewählte Außenecke. Jetzt bestimmt eine fachunabhängige Geometriefunktion den Segmentendpunkt aus festem Gegenpunkt, Ziel und vorzeichenbehaftetem seitlichem Abstand. Der vorhandene Direct-Edit-Adapter erkennt die beiden Eckgriffe am gewählten Wandende und verwendet diese Berechnung ausschließlich bei freier Punktbewegung. Derselbe Weg gilt für Maus und Hilfseingabe; keine zusätzliche Fang-, Tab- oder UI-Logik.

Fest bleiben der gegenüberliegende Achsendpunkt, Stärke, Höhe und relative Fensterpositionen. Nicht beide gegenüberliegenden Außenecken: Sie drehen sich geometrisch um den festen Achsendpunkt. Ziele innerhalb oder auf dem Kreis mit Radius halber Wandstärke um den festen Endpunkt sind nicht als positive Wandlänge erreichbar und werden abgewiesen. Bestehende Fenster- und Modellvalidierung bleibt nachgeschaltet. Achspunktbewegung, Strecken und ganze Elementbewegung behalten ihre Regeln. Keine Entscheidung zum späteren Wechsel der Wandachsenlage oder zu Wandanschlüssen.

Nachweis: 225 Tests bestanden, TypeScript und Build erfolgreich, ESLint 0 Fehler/6 bekannte React-Refresh-Warnungen. Alle vier Ecken auf gedrehten und umgekehrten Wänden, unveränderte Vorschau am Ursprung, unerreichbare Ziele, Fensterkonflikte, Maus-/Zahlenparität, ein Commit, Undo/Redo, Abbruch, 3D-Eckkoordinaten und JSON-Rundlauf geprüft. Browser: Ende links bei (3; 0,18), Punkt frei bewegen, 90°/1 m ergibt physische Ecke (3; 1,18), Undo (3; 0,18), Redo (3; 1,18). Bestehender Fenster-Mittelpunkt bleibt 0,5.

Abnahme: Beispielwand auswählen → Wandecke Ende links → Punkt frei bewegen → Winkel 90 und Länge 1 → Übernehmen. Die Ecke bewegt sich senkrecht um einen Meter; die Achse darf sich dafür seitlich anpassen. Undo/Redo prüfen. Anschließend einen externen Fangpunkt als Ziel verwenden und die Übereinstimmung der Ecke kontrollieren.

### Abgeschlossener Folgeauftrag: Eckkontakt mit externen Fangzielen praktisch absichern

Die korrigierte freie Wandecke mit Endpunkt-, Mittelpunkt- und Hilfslinienschnittpunktfang im Browser prüfen, jeweils Vorschau/Commit, Zoom, Abbruch und Undo vergleichen. Die bereits gemeinsame Engine verwenden, keine weitere Fangart oder Wandverbindung ergänzen. Bei Abweichungen gezielt den bestehenden Adapter korrigieren; danach die Abnahme und verbleibende Grenzen dokumentieren.


### Abschluss: externe Fangziele an Wandaußenecke — 03.10.2026

PR #50 nach ausdrücklicher Freigabe normal nach main übernommen (91e4095). Separater Browser-Testtab, Nutzerprojekt unverändert. Testdatei: Wand (0;0)–(3;0), Stärke 0,36 m, externe Linie (4;1)–(6;1).

Endpunkt: Fangmeldung Endpunkt, bestätigte Außenecke (4;1); Undo (3;0,18), Redo (4;1). Mittelpunkt: Fangmeldung Mittelpunkt vor und nach Zoom, bestätigte Ecke (5;1). Hilfslinien: beide Linienenden nach 600 ms erfasst, zwei diagonale Führungen bilden Schnittpunkt (5;2), sichtbare Schnittpunktmeldung und passende Wandvorschau. Nach Verweilen wird der Schnittpunkt selbst zur Referenz; vier Ringe einschließlich Ursprung bleiben nach Zoom erhalten. Bestätigung ergibt Ecke (5;2) bis auf Gleitkommarundung < 1e-14 m. Weiterer Bewegungsentwurf zum Endpunkt und Abbrechen erhält (5;2); Undo ergibt ursprüngliche Ecke, Redo wieder (5;2). Keine Browser-Konsolenfehler.

Kein zusätzlicher Anwendungsfehler gefunden, keine Codeänderung. Bestehende 225 Tests, TypeScript-/Build-Nachweise und 6 bekannte Lint-Warnungen gelten für den unveränderten Anwendungscode; keine Wiederholung dieser Prüfungen im reinen Abnahmeschritt. Browsernachweise ergänzen die automatisierten Geometrie-/History-Prüfungen aus PR #50. Kein Nachweis für 3D-Arbeitsebenen oder Wandanschlüsse.

Abnahme: Eine Linie neben der Wand zeichnen, Wandecke frei bewegen und Endpunkt/Mittelpunkt anfahren. Beide Linienenden jeweils 0,6 s erfassen, diagonale Hilfslinien zum gemeinsamen Schnittpunkt führen, zoomen und bestätigen. Undo/Redo und Abbrechen prüfen.

### Abgeschlossener Folgeauftrag: Lastmessung der gemeinsamen Fangengine

Reproduzierbare Testprojekte mit 100, 1000 und 5000 geraden Elementen erzeugen. Auf dokumentierter Laufzeit/Hardware getrennt Aufbau der Modellreferenzen und reine Fangabfrage für Zeichnen/Direct Edit messen, einschließlich aktiver Hilfsreferenzen und Modellwechsel. Warm-up, Wiederholungen und Median/P95 dokumentieren; Zeiten nicht als allgemeine Leistungszusage oder vollständige Browser-Framerate ausgeben. Vorhandene Dienste unverändert messen, keine vorsorgliche Index-/Cache-Neuentwicklung. Einen nachgewiesenen Engpass oder das Ausbleiben eines solchen festhalten und daraus den nächsten begrenzten Auftrag ableiten.


### Abschluss: Fang-Baseline — 03.10.2026

Reproduzierbarer Messlauf mit 100/1000/5000 Elementen abgeschlossen. Skript scripts/benchmark-snapping.mjs; Verfahren, Hardware, Ergebnisse und Einschränkungen unter docs/performance/SNAP_BASELINE.md, Rohwerte in der benachbarten JSON-Datei. Referenzzahlen und Modellwechsel geprüft; ESLint für das Messskript und git diff --check erfolgreich. Anwendungscode unverändert, daher bestehende 225 Tests und Build-Nachweise nicht erneut ausgeführt. PR #51 bleibt zur Dokumentationsprüfung offen; dieser Schritt baut darauf auf.

Bei 5000 Elementen: Aufbau Median 3403 ms, Neuaufbau nach Modellwechsel 4094 ms; Zeichnen/Direct Edit mit vier Referenzen 35,67/39,79 ms pro Abfrage. Keine Browser-Framerate-Aussage. Vollständige Segmentpaarprüfung als klar begrenzter erster Engpass identifiziert; keine Optimierung in diesem Messauftrag.

### Nach vorgezogenem Wiederverwendungsschritt fortzuführen: räumliche Vorauswahl für Segmentschnittpunkte

Die vollständige Paarprüfung in segmentIntersectionReferences durch eine konservative räumliche Vorauswahl ergänzen, die sichere Nichttreffer aussortiert. Exakte Schnittprüfung, Toleranzen, stabile Ergebnisreihenfolge und Quellenabhängigkeiten bewahren. Differentialtests gegen die bisherige Vollprüfung einschließlich Rand-/Entartungsfällen und Quellenausschlüssen, anschließend identische Baseline wiederholen. Keine gleichzeitige Pointer-Fangoptimierung oder neue Werkzeuge. Grenzen bei dicht überlappenden Segmenten dokumentieren.


### Abschluss: Modellreferenzen unabhängig vom Werkzeug wiederverwenden — 04.10.2026

Auf Nutzerwunsch vor die räumliche Vorauswahl gezogen: getProjectSnapReferences speichert den abgeleiteten Referenzsatz in einer WeakMap je unveränderlichem Project-Snapshot. IDs oder Werkzeugnamen sind kein Cache-Schlüssel. Neue Modellobjekte, auch geladene Projekte mit gleichen IDs, erzeugen einen neuen Satz. Solange History einen alten Snapshot hält, können Undo/Redo dessen passenden Satz wiederverwenden; verworfene Projekte werden vom Cache nicht künstlich gehalten. Keine persistente zweite Modellhaltung. Voraussetzung bleibt der bestehende unveränderliche Modellvertrag; In-place-Mutationen werden nicht unterstützt.

BimPlan trennt die modellgebundene Aufbereitung von prepareToolReferences. Neue Direct-Edit-Sitzungen und Polylinienursprünge wenden nur die aktuellen Werkzeugregeln an. Temporäre Ursprünge und Quellenausschlüsse werden niemals im Modellcache gespeichert. Derselbe Modellstand kann auch von mehreren Viewports wiederverwendet werden. Die reine projectSnapReferences-Funktion bleibt für kalte Aufbereitung und Vergleichsmessungen unverändert.

Nachweise: 227 Tests bestanden, TypeScript und Build erfolgreich, ESLint 0 Fehler/6 bekannte Warnungen; git diff --check erfolgreich. Neue Regressionen prüfen identische Modellreferenzen bei wechselnden Zeichenursprüngen, wechselnde Eigenquellenausschlüsse, unveränderten Ursprungssatz, Modelländerung, Undo/Redo und neu geladene gleich-ID-Projekte gegen die ungecachte Aufbereitung. Kein neuer Browser-Latenznachweis, keine neue Zahlenbehauptung für den Cache. Erstaufbau, echte Modelländerungen und die laufende lineare Fangabfrage bleiben unverändert teuer.

Abnahme: Polylinie mit mehreren Punkten zeichnen und zwischen Zeichnen sowie freier Wandbewegung wechseln; Ursprung und Quellenausschlüsse müssen jeweils zum aktuellen Werkzeug passen. Nach Modelländerung/Undo/Redo dürfen nur aktuelle Fangpunkte angeboten werden.

### Ersetzter Folgeauftrag: globale räumliche Vorauswahl für Segmentschnittpunkte

Nun Schritt 2 umsetzen: konservative räumliche Vorauswahl in segmentIntersectionReferences, unveränderte exakte Prüfung und stabile Reihenfolge. Differentialtests gegen Vollprüfung einschließlich numerischer Grenzfälle; gleiche kalte Baseline wiederholen. Die bereits eingeführte Modellwiederverwendung erhalten und keine weitere Pointer-Fangoptimierung hinzufügen.


### Planung: lokale Fangabfrage statt globaler Schnittpunktaufbereitung — 04.10.2026

Nutzerpräzisierung gegen project-references, candidates, ToolSnapPolicy, Hover und Konstruktion abgeglichen. docs/LOCAL_SNAP_QUERY_PLAN.md beschreibt Zuständigkeiten, Vertrag, Index-Lebenszyklus, getrennte entfernte Referenzen, Migration und Testmatrix. Kein Anwendungscode in diesem Planungsschritt geändert. Die globale Paar-Vorauswahl aus älteren Abschnitten und dem Baseline-Bericht ist als nächster Auftrag ersetzt, nicht zusätzlich auszuführen.

Wichtige Abhängigkeiten: activeSources/withConstructionReferences dürfen entfernte Blätter nicht anhand lokaler Treffer invalidieren; sameHoverSession darf nicht an der wechselnden lokalen Ergebnisliste hängen; Hover-Segmenttracking muss denselben Suchdienst verwenden. Index in Modellkoordinaten, CSS-Radius pro Abfrage; ursprüngliche Segmente bleiben unbeschnitten. Sofortiger Fang und 600-ms-Erwerb bleiben getrennt.

Verbindliche Zielregeln in ARCHITECTURE.md ergänzt; AABB-Baum, API-Namen und anfänglicher vollständiger Primitivindex-Neuaufbau als Vorschlag gekennzeichnet. Keine inkrementellen Modellupdates auf Vorrat. Der zuvor blockierte Wiederverwendungsschritt wurde unverändert als PR #53 veröffentlicht; #51–53 weiterhin ohne Merge. Nachweis dieses Schritts: Code-/Dokumentabgleich und git diff --check; keine neuen Test-/Build-Läufe für reine Dokumentation. Bestehende 227 Tests beziehen sich auf PR #53.

### Abgeschlossener Folgeauftrag: lokalen Quellensuchdienst nachweisen

Primitive Modellquellen ohne globale Kreuzungen ableiten; räumlichen Index mit vollständigem Quellen-Lookup und lokaler Punkt-/Segmentabfrage in CSS-Radius aufbauen. Lokale Schnittreferenzen mit bisheriger Geometrie, Identität und Blattabhängigkeiten berechnen. Differentialtests zum Vollaufbau innerhalb des Suchradius, einschließlich langer Segmente und numerischer Grenzen; reproduzierbare Messung mit 100/1000/5000 Elementen. Noch keine UI-/Hover-Umschaltung, keine neue Fangart und keine leeren Klassen. Der funktionierende Suchdienst liefert den Nachweis für die anschließende gemeinsame Integration gemäß docs/LOCAL_SNAP_QUERY_PLAN.md.


### Abschluss: lokaler Quellensuchdienst — 04.10.2026

projectSnapPrimitives trennt die vorhandene primitive Ableitung von der globalen Schnittpunktliste. Alter Produktionspfad unverändert. Neuer Dienst application/snapping/local-sources.ts verwendet einen statischen AABB-Baum in geometry/spatial/box-index.ts mit opaken Quellenschlüsseln, unveränderlichen Quellen und vollständigem Lookup. Separate Punkt-/Segmentabfragen, konservative Toleranzpolsterung und lokale Schnittberechnung über den bestehenden Dienst. Lange Segmente bleiben vollständig; Ausgabe in alter Quellenreihenfolge. Quellenausschluss wirkt vor Paarbildung. Cache je unveränderlichem Project; kein globales Schnittpunktverzeichnis.

232 Tests bestanden; TypeScript und Build erfolgreich; ESLint 0 Fehler/6 bekannte Warnungen. Differentialtests zu Vollaufbereitung: deterministische Zufallsgeometrie, lange Kreuzungen, Berührung/Überlappung, schräge/fast parallele/kurze Segmente, große Koordinaten, mehrere Maßstäbe, Nullradius und numerische Boxgrenzen. Quellenidentität, Ausschlüsse, gefrorene Daten, Undo/Redo/Laden und entfernte Lookups geprüft. Benchmark mit 100/1000/5000 Elementen erfolgreich; Methodik/Rohwerte in docs/performance/LOCAL_SOURCES.md. 5000 Elemente: Indexaufbau Median 121,75 ms, lokale Suche 0,0143 ms mit einem lokalen Paar. Keine Aussage zur vollständigen Fangabfrage oder Browser-Framerate; UI nicht umgeschaltet.

### Abgeschlossener Folgeauftrag: lokalen Dienst gemeinsam an Fang und Hover anbinden

ToolSnapPolicy/SnapContext, Kandidaten- und Hoverpfad gemeinsam auf lokalen Suchdienst umstellen. Entfernte aktive Quellen über vollständigen Lookup validieren; dynamische Trefferlisten dürfen Hover-Sitzungen nicht zurücksetzen. Quellenausschlüsse und konstruierte Schnittreferenzen einschließlich Acquisition erhalten. Zeichnen, Idle-Hover und Direct Edit über denselben Einstieg; keine globale Kreuzungsaufbereitung im neuen Produktionspfad. Tests für sofortigen Fang/600-ms-Erwerb, entfernte Führungen, Zoom, feste Achsen, Snap aus, Modellwechsel und Abbruch; praktische Abnahme und Messung der vollständigen Abfrage.


### Abschluss: lokale Suche im gemeinsamen Produktionspfad — 04.10.2026

PR #55 nach Freigabe normal in seinen Zielzweig docs/local-snap-query-plan übernommen (d3aa81e); main und ältere offene PRs unverändert. Neuer Branch feat/local-snap-integration. BimPlan bindet einen modell- und werkzeuggebundenen Suchadapter ein. Zeichnen, Idle-Hover und Direct Edit verwenden denselben Einstieg; die Produktionsansicht erzeugt keine globale Schnittpunktliste mehr. Kandidatenrangfolge und exakte Geometrie bleiben bestehen. Entfernte aktive Referenzen und konstruierte Schnittpunkte werden anhand ihrer vollständigen Modellquellen validiert. Die stabile Adapteridentität trennt Hover-Sitzungen von wechselnden lokalen Trefferlisten; Zoom erhält Referenzen.

235 Tests bestanden; TypeScript und Build erfolgreich; ESLint 0 Fehler/6 bekannte React-Refresh-Warnungen. Neue Vergleiche prüfen den lokalen gegen den vollständigen Resolver mit Bearbeitungsachsen, Zeichnen, Shift/Ortho/Snap aus, entfernten Führungen und veralteten Quellen. Ein echter Segmentschnittpunkt wird sofort gefangen und erst nach 600 ms zur Referenz. Vollständige Abfragemessung mit 100/1000/5000 Elementen in docs/performance/LOCAL_INTEGRATION.md, getrennt vom Indexaufbau.

Browserabnahme im separaten Tab: Idle-Hover aktiviert Referenz; freie Wandaußenecke besitzt sofort Ursprung. Zwei Linienenden erfassen erzeugt drei Ringe; ihr Hilfslinienschnitt (5;2) wird vierte Referenz. Alle vier bleiben beim Zoom erhalten. Bestätigte Ecke (5;2), Undo (3;0,18), Abbruch eines neuen Entwurfs unverändert, Redo (5;2), jeweils Rundung < 1e-14 m. Nutzerprojekt im ursprünglichen Tab unverändert.

Praktischer Test: Wandecke frei bewegen, zwei externe Linienenden jeweils 0,6 s erfassen, zum gemeinsamen Hilfslinienschnitt fahren, zoomen, bestätigen und Undo/Redo prüfen. Dieselben Referenzen auch ohne Zeichenwerkzeug aktivieren.

Grenzen: sehr dichte lokale Geometrie weiterhin quadratischer Paaraufwand; Index nach echter Modelländerung vollständig neu. Keine Erweiterung auf 3D-Arbeitsebenen in diesem Schritt.

### Abgeschlossener Folgeauftrag: dichte lokale Geometrie absichern

Den integrierten Fangpfad mit langen schrägen, dicht überlappenden Segmentboxen und mehreren aktiven Referenzen differential gegen den Vollpfad prüfen und messen. Lokale Kandidatenzahlen/Paarzahlen sowie Median/P95 dokumentieren; Quellenausschlüsse für bewegte Fenster samt Host und konstruierte Referenzen nach Modellwechsel ausdrücklich abdecken. Keine neue Fangart, keine Ergebnisobergrenze und kein Indexumbau ohne gemessenen Engpass.


### Abschluss: dichte lokale Geometrie — 04.10.2026

PR #56 nach ausdrücklicher Freigabe normal in docs/local-snap-query-plan übernommen (01ca349); main bleibt unverändert. Branch test/dense-local-snapping ergänzt Regressionen und reproduzierbare Lastmessung, keine Änderung des Anwendungscodes. ARCHITECTURE.md korrigiert den nach PR #56 veralteten Integrationsstatus.

238 Tests bestanden, TypeScript und Build erfolgreich, ESLint 0 Fehler/6 bekannte Warnungen. Dichte schräge Quellen und lokale Kreuzungen bei mehreren Zoomstufen stimmen mit dem vollständigen Resolver überein. Bewegte Fenster schließen eigene und Hostquellen vor Schnittbildung sowie bei aktiven Führungen aus. Konstruierte Referenzen werden nach Änderung einer Blattquelle verworfen; nur der passende Undo-Snapshot ist wieder gültig. Dies reaktiviert keine UI-Sitzung nach Undo.

Messung: docs/performance/DENSE_SNAPPING.md und zugehörige Rohwerte. 500 schräge parallele Linien ohne lokalen Treffer: 124750 Paarprüfungen, Median 32,01 ms. 500 Linien mit sehr vielen echten lokalen Kreuzungen: Median 1001,86 ms. Synthetische Stressfälle, keine typische Projekt- oder Browser-Framerate-Aussage. Produktionscode identisch mit PR #56, daher dessen praktische Abnahme weiter gültig; keine neue Browserprüfung behauptet.

Praktischer Abnahmetest: Fenster auf seiner Wand bewegen; die eigene Wand darf kein externes Fangziel werden. Zwei externe Punkte als Referenzen aktivieren, deren Hilfslinienschnitt erfassen, eine zugrunde liegende Linie ändern und eine neue Bewegung beginnen: alte Hilfspunkte dürfen nicht weiterwirken.

### Umgesetzter Folgeauftrag, vollständige Projektabnahme offen: falsche lokale Segmenttreffer vor Paarbildung reduzieren

Zwischen AABB-Abfrage und lokaler Schnittberechnung einen konservativen geometrischen Segmentnähefilter ergänzen. Vollständige Originalsegmente für exakte Geometrie und Quellenidentität erhalten; numerisch akzeptierte Kontakte und Fangradiusgrenzen durch Differentialtests absichern. Benchmark für Boxüberlappung und echte dichte Kreuzungen unverändert wiederholen. Keine Ergebnisobergrenze, keine neue Fangart, kein Indexumbau. Verbleibende Kosten echter dichter Kreuzungen separat ausweisen; diese werden durch einen Nähefilter allein nicht gelöst.


### Umsetzung: geometrische lokale Segmentvorauswahl — 03.10.2026

Konservativer Segment-/Suchquadrat-Test in geometry/intersections/segment-box.ts; local-sources wendet ihn nach Boxsuche und Werkzeugfilter vor Paarbildung an. Originalsegmente und vollständiger Quellenlookup bleiben erhalten. Sechs neue Tests sowie 41 vorhandene reine Engine-Testfälle isoliert bestanden. Die vollständige Projekttestsuite, TypeScript, Build, Lint und Browserabnahme sind in dieser Umgebung mangels installierter Abhängigkeiten offen; kein produktionsreifer Abschluss behauptet. Draft auf Basis von PR #57, kein Merge.

Isolierter Vergleich gleicher Messgeometrie ohne Fixture-Validator: 500 falsche Boxüberlappungen ergeben 0 statt 124750 Paare, Median 0,30 statt 20,38 ms. Echte dichte Kreuzungen behalten 124750 Paare und kosten 911,68 ms; dieser Engpass bleibt bestehen. Verfahren, Grenzen und Rohwerte: docs/performance/LOCAL_PROXIMITY.md.

### Abgeschlossener Folgeauftrag: Segmentvorauswahl vollständig abnehmen

Draft in der vollständigen Projektumgebung mit npm test, TypeScript, Build und Lint prüfen. Zeichnen, Segment-Hover, Zoom und Direct Edit praktisch abnehmen; Fangradiusgrenzen und entfernte aktive Referenzen erhalten. Gegebenenfalls gezielt korrigieren. Keine weitere Fangfunktion oder Merge ohne Nutzerfreigabe. Nach erfolgreicher Abnahme den echten dichten Kreuzungsfall getrennt nach Paarberechnung, Quellenaufbau und Kandidatenbewertung profilieren; daraus den nächsten begrenzten Optimierungsauftrag ableiten.



### Abschluss: Projektabnahme PR #58 — 04.10.2026

Testfixture mit festen Koordinatentupeln typisiert; alter Dichtetest erwartet für entfernte Diagonalen null Segmente/Paare. Echte Kreuzungen und Differentialvergleich bleiben geprüft. Formatierung korrigiert. 244 Tests, TypeScript, Build erfolgreich; ESLint 0 Fehler/6 bekannte Warnungen.

Browser im separaten Tab: Segmentinneres als Referenz erfasst, freie Wandecke mit Ursprung, zwei entfernte Endpunkte und Hilfslinienschnitt (5;2) erfasst. Vier Referenzen nach Zoom erhalten; exakter Eckcommit mit Rundung <1e-14 m. Linie vom Endpunkt (4;1) zum Mittelpunkt (5;1) gezeichnet, Länge 1,00 m. Nutzerprojekt im ursprünglichen Tab unverändert. Praktischer Test: diese Folge wiederholen und Fangmeldungen kontrollieren.

Repository-Benchmark einschließlich Projektvalidator erneut ausgeführt; LOCAL_PROXIMITY.validated.json. 500 entfernte Diagonalen: 0 Paare, Median 0,337 ms; echte dichte Kreuzungen: 124750 Paare, Median 1242,13 ms, weiterhin ungelöst. Keine direkte Beschleunigungsbehauptung gegenüber isolierter Fremdmessung.

Nutzerwunsch zur optionalen Referenzauswahl aufgenommen: docs/REFERENCE_SELECTION_PLAN.md. Frühere Profilierung zurückgestellt; keine Auslöseschwelle oder Bedienänderung implementiert.

### Abgeschlossener Folgeauftrag: Vertrag für optionale Referenzauswahl festlegen

Entwurf gegen gemeinsame ToolSnapPolicy, Hover und Picking abgleichen. Zustands- und Quellenvertrag sowie eine begründete vorläufige Auslöseschwelle mit Hysterese vorschlagen. Verhalten ohne Auswahl, bei Abbruch, Idle-Hover und Modellwechsel festlegen. Endpunkt-/Mittelpunktfang, aktive Führungen und feste Achsen erhalten. Ein kleines Umsetzungspaket mit Tests ableiten; noch keine automatische Einschränkung oder Dialoge implementieren.


### Abschluss: Referenzauswahl-Vertrag — 04.10.2026

docs/REFERENCE_SELECTION_PLAN.md gegen lokale Quellen, ToolInteraction, Hover und Pointer-/Keyboardpfad abgeglichen. Vorgeschlagene Einstiegsschwelle >32 Segmente, Rückkehr <=24 für 250 ms; vorläufig und im Umsetzungsschritt zu messen. 600 ms Hover bleibt unabhängig. Auswahl filtert ausschließlich Segmentpaare, erhält normale Punktziele und aktive Führungen. Arbeitskopie/Abbruch, Mehrdeutigkeit, Polyline-Vorgangsidentität und Idle-Sitzung beschrieben. Keine Nutzerentscheidung über konkrete Zahlen behauptet.

Nur Dokumentation verändert; kein neuer Test-/Build-/Browserlauf nötig. Bestehende 244 Tests und Abnahme aus PR #58 beziehen sich auf unveränderten Anwendungscode. PR #58 und #57 weiterhin offen; kein Merge in diesem Planungsauftrag.

### Abgeschlossener Folgeauftrag: gemeinsame Dichteschranke mit sichtbarem Status

Primitive lokale Kandidatensuche und Paarbildung trennen. Gemeinsamen reinen Dichtecontroller mit vorläufigen Schwellen >32/<=24 und 250-ms-Rückkehr erstellen; Zeit injizieren. Strukturierter Pausenstatus für Zeichnen, Direct Edit und Hover, keine ungeschützte Zweitabfrage. End-/Mittelpunkte, aktive Führungen, Host-/Eigenausschlüsse und Achsen erhalten. Viewporthinweis ohne funktionslosen Auswahlbutton; Auswahl-Picking folgt als separates Paket. Grenz-/Lebenszyklustests und Messung mit 24/32/33/48 Segmenten gemäß Vertrag; Build/Lint/TypeScript und praktische Prüfung.


### Abschluss: gemeinsame Dichteschranke — 04.10.2026

Primitive Suche von Paarbildung getrennt. createToolSourceQuery bewacht standardmäßig alle Produktionsabfragen (>32 Segmente); reiner Application-Controller steuert Rückkehr bei <=24 für 250 ms, React liefert Zeit/Ereignisse. Gemeinsamer Pausenparameter für Hover und Pointerresolver. End-/Mittelpunkte, Raster und aktive entfernte Referenzen bleiben verfügbar. Lesbarer Viewportstatus ohne Popup oder funktionslosen Auswahlbutton.

247 Tests, TypeScript und Build erfolgreich; ESLint 0 Fehler/6 bestehende Warnungen. Grenz-, Ausschluss-, Referenz- und Vergleichstests bestanden. Browser mit 48 Kreuzungen: Idle-Hover, Zeichnen, freie Wandbewegung, erhaltener Mittelpunktfang, Referenz nach Zoom, Wiederaufnahme außerhalb und Linienabschluss erfolgreich. Messung: docs/performance/SNAP_DENSITY.md. 32 Segmente Median 2,373 ms, 33 Segmente pausiert 0,261 ms; keine Framerate-Zusage.

Praktischer Test: viele Linien kreuzen lassen, Maus darüber bewegen. Hinweis erscheint ohne Dialog; Mittelpunkt bleibt fangbar. Auf weniger dichte Stelle fahren, kurze Wiederaufnahme abwarten. Beim Zeichnen und Bearbeiten wiederholen; Zoom erhält Referenzen.

Grenzen: dichte automatische lokale Schnittpunkte bewusst pausiert, manuelle Referenzauswahl fehlt noch. Primitive Suche und Punktranking bleiben mengenabhängig. Keine 3D-Arbeitsebene. PRs #57–59 weiterhin offen.

### Abgeschlossener Folgeauftrag: temporäre Segmentauswahl gemeinsam integrieren

Optionale Auswahl gerader Segmentquellen für einen laufenden Vorgang implementieren: gemeinsamer Application-Zustand mit Arbeitskopie/Übernehmen/Abbruch, Vorgangsidentität über Polylinienpunkte hinweg und Auswahlfilter vor Paarbildung. Canvas-Auswahl suspendiert Modellbestätigungen, bietet Mehrdeutigkeitsliste und dezente Abblendung. Aufheben, Idle-Lebenszyklus, Zoom, Modellwechsel und aktive Referenzen gemäß docs/REFERENCE_SELECTION_PLAN.md testen. Zunächst Segmentauswahl; explizite Punktübernahme folgt separat. Keine per-Werkzeug-Fangkopien.


### Abschluss: temporäre Segmentauswahl — 04.10.2026

PR #60 nach Freigabe normal in docs/reference-selection-contract übernommen (9daa725); main unverändert. Gemeinsamer Application-Reducer verwaltet Arbeitskopie, Übernehmen, Abbruch und Aufheben. Ein Filter begrenzt Segmentpaare vor der Dichteprüfung; End-/Mittelpunkte und aktive entfernte Führungen bleiben verfügbar. Deterministisches Picking unterscheidet Polylinienteilsegmente. Mehrdeutigkeit wird in einer Liste nahe dem Zeiger aufgelöst; Canvas wird dezent abgeblendet. ToolInteraction pausiert Bestätigungen und numerische Eingabe während der Auswahl. Kein zusätzlicher Modellzustand und keine per-Werkzeug-Fangkopie.

250 Tests bestanden; TypeScript und Build erfolgreich, ESLint 0 Fehler/6 bekannte React-Refresh-Warnungen. Neue Tests prüfen Auswahl/Abbruch, Quellenfilter vor Paarbildung (zwei Segmente: ein Paar), erhaltene Punktziele/aktive Quellen und deterministisches Picking. Browser: 48 überlappende Linien, zwei Referenzen auswählen/übernehmen, Arbeitskopie abbrechen und Filter aufheben; Auswahl bleibt beim Zoom und über drei Polylinienpunkte erhalten. Zeichenvorgang abbrechen setzt Filter zurück. Freie Wandbewegung: Hilfseingabe wird während der Auswahl ausgeblendet und nach Abbruch wiederhergestellt. Keine unbeabsichtigte Modellbestätigung beim Picking.

Praktischer Test: Referenzen auswählen anklicken, zwei Linien im Canvas wählen (bei Überlagerung Trefferliste nutzen), übernehmen. Danach weiterzeichnen/verschieben und zoomen. Auswahl erneut öffnen und abbrechen: vorherige Auswahl bleibt. Auswahl aufheben stellt automatische Suche einschließlich Dichteschranke wieder her.

Grenzen: zunächst gerade Segmentquellen in 2D; explizite Punktübernahme fehlt. Quellschlüssel gelten für den aktuellen Modellsnapshot und werden nach Modell-/Vorgangswechsel verworfen. Komplette Modal-/Tastaturmatrix noch nicht browserautomatisiert. Ältere gestapelte PRs bleiben offen.

### Abgeschlossener Folgeauftrag: gezielte Punktreferenzen im gemeinsamen Auswahlmodus

Punktübernahme für vorhandene End-/Mittelpunkte in denselben temporären Auswahlablauf integrieren. Vorhandenen Hover-Referenzvertrag einschließlich Kapazität, Ursprungsschutz und Verdrängung verwenden; vor Übernahme anzeigen, welche Referenz ersetzt würde. Segmentfilter und explizite Hilfsreferenzen getrennt halten, kein zweiter unbegrenzter Referenzspeicher. Arbeitskopie/Abbruch, Modellwechsel, Zoom und gemeinsame Nutzung bei Zeichnen/Direct Edit testen; Tab/Escape und modale Priorität praktisch mitprüfen. Keine neue Fangart oder 3D-Arbeitsebene.

### Anzeige der Referenzauswahl bereinigt — 04.10.2026

Im normalen Fangbetrieb kein dauerhaftes Panel. Bei pausierter dichter Suche Hinweis mit Einstieg; bestätigte Auswahl kompakt als Anzahl mit Ändern/Aufheben. Manueller Einstieg über das gemeinsame On-Demand-Menü auch ohne Elementauswahl und im Zeichen-/Bearbeitungsvorgang. Auswahlmodus bleibt auch bei Snap aus bedienbar. Keine Änderung der Fangberechnung oder 600-ms-Regel.

250 Tests bestanden, TypeScript/Build erfolgreich; ESLint 0 Fehler/6 bekannte Warnungen nach Korrektur einer verbliebenen Formatierung in snapping.ts. Browser: normales Panel verborgen, Einstieg im Elementmenü und Linienwerkzeug, Abbruch blendet Panel wieder aus. Nächster Auftrag bleibt gezielte Punktübernahme gemäß obigem Folgeauftrag. Ergänzung im offenen PR #61, kein Merge.


### Abschluss: gezielte Punktreferenzen — 04.10.2026

Der gemeinsame Auswahlmodus bietet Linien/Punkte. Vorhandene End-, Eck- und Mittelpunkte werden lokal ohne Paarberechnung getroffen und über dieselbe Hover-Referenzverwaltung übernommen. Vorschau und Übernahme verwenden denselben reinen Kapazitätsdienst; maximal vier zusätzliche Referenzen, separater geschützter Bewegungsursprung. Doppelte Quellen werden dedupliziert; bei mehr als vier Punkten bleibt Übernehmen gesperrt. Vorherige Referenzen werden erst bei Übernahme ersetzt, mit konkreter Vorschau. Punktübernahme ändert weder Segmentfilter noch Modell/Undo. Kein zweiter dauerhafter Referenzspeicher und keine per-Werkzeug-Implementierung.

254 Tests, TypeScript und Build erfolgreich; ESLint 0 Fehler/6 bekannte Warnungen. Neue Tests: Vorschau ohne Mutation, konkrete Verdrängung, gemeinsame Hover-Kapazität, Ursprungsschutz, Duplikate/Überlauf, CSS-Picking, Quellenfilter und veralteter Snapshot. Browser: vier Wandecken übernehmen, Zoom erhält vier Ringe; fünfter Punkt zeigt die zu ersetzende Ecke; Abbruch/Escape erhält vier, Enter übernimmt. Fünf gleichzeitig gewählte Punkte sperren Übernahme. Direct Edit: eigene Wand bleibt als externe Quelle ausgeschlossen, Ursprung bleibt, Tab navigiert Auswahlpanel, Escape stellt Hilfseingabe wieder her. Dabei gefundene Menüüberlagerung korrigiert: On-Demand-Menü über Hilfseingabe, beim Start einer Bewegung geschlossen.

Praktischer Test: On-Demand-Menü → Referenzen auswählen → Punkte → End-/Mittelpunkte anklicken → Referenzen übernehmen. Vier Punkte erfassen, danach einen neuen Punkt wählen und Ersetzungsvorschau prüfen; alternativ abbrechen. Zoom und freie Bewegung wiederholen.

Grenzen: bestehende 2D-Modellpunkte; keine explizite Übernahme berechneter Schnittpunkte, diese bleiben per Hover verfügbar. Punkt-Arbeitskopie gilt jeweils für eine Übernahme. Vollständige Modal-/Mehrviewport-Matrix bleibt offen. PR #61 nicht zusammengeführt. Shell-Fetch derzeit ohne Netzwerkverbindung; Veröffentlichung über GitHub-Connector, vorhandene lokale Änderungen erhalten.

### Abgeschlossener Folgeauftrag: gemeinsame Referenzauswahl im vollständigen Ablauf stabilisieren

Segmentfilter und Punktübernahme gemeinsam bei Zeichnen und Direct Edit prüfen: entfernte Hilfslinien, mehrdeutige Punktquellen, Escape/Tab mit offenen Dialogen, Snap aus/ein sowie Modelländerung/Undo/Redo und Viewportwechsel. Nur nachgewiesene Fehler beheben, Lebenszyklus automatisiert absichern und Einschränkungen aktualisieren. Keine neue Fangart, keine 3D-Arbeitsebene und keine weitere Auswahloberfläche.


### Abschluss: gemeinsamer Referenz-Lebenszyklus — 04.10.2026

PR #61 normal nach docs/reference-selection-contract übernommen (dc1b1f5), PR #62 normal nach feat/reference-segment-selection (714f8d7). main und frühere gestapelte PRs unverändert. Netzwerkfreigabe ermöglicht lokalen Fetch; zuvor publizierte Änderungen exakt abgeglichen, Sicherungsstash erhalten, Arbeitszweig fix/reference-selection-lifecycle auf geprüftem Gesamtstand.

Reproduzierte Fehler: Pan schaltete Hover aus und löschte Punkte dauerhaft; in zwei Ansichten erschienen zwei Auswahlpanels; Escape im Dateidialog löschte bestätigte Referenzen. Korrekturen: Navigation suspendiert Erwerb statt Sitzung zu löschen, nur aktive Ansicht führt Picking/Hover/Auswahl aus, Dialogtasten gelangen nicht in den globalen Grundriss-Reset. Erster Klick in eine inaktive Ansicht aktiviert sie ohne Modellbestätigung. Gemeinsame Vorgangsidentität einschließlich Layout/Viewport hält Hover-Punkte auch beim nächsten Polylinienursprung; Modell-, History-, Werkzeug- und Ansichtswechsel invalidieren sie. Keine separate Fangengine.

257 Tests bestanden, TypeScript und Build erfolgreich, ESLint 0 Fehler/6 bekannte Warnungen. Drei neue Regressionen: wechselnder Zeichenursprung bei unverändertem Vorgang, explizite Sitzungsgrenzen, Pan-Dwell-Unterbrechung ohne Referenzverlust. Browser: Pan aus/Zoom erhält Punkte (während Pan sind Marker wie bisher ausgeblendet); zwei Ansichten zeigen genau ein Panel, Wechsel beendet Auswahl. Zwei Linien plus mehrdeutiger Punkt gewählt; Trefferliste durch erstes Escape geschlossen, Filter und Punkt über nächsten Polylinienpunkt erhalten; Hilfslinienschnitt fangbar. Dialog-Escape erhält nach Korrektur bestätigten Hilfspunkt. Snap aus löscht zusätzliche Punkte, Snap ein zeigt nur den geschützten Ursprung. Polylinie per Undo entfernt/Redo wiederhergestellt ohne alte Filter; Wand mit denselben Referenzarten um 1,00 m in Y verschoben, Transformation von (-2;-2) nach (-2;-1), Undo/Redo exakt.

Reproduzierbarer Testgrundriss: docs/fixtures/reference-selection.json (eine Wand, drei Linien, gemeinsame Endpunkte). Anleitung: importieren, Linienfilter setzen, im Punktmodus gemeinsamen Endpunkt auflösen, übernehmen. Polylinie beginnen/fortsetzen oder Wand frei bewegen, Pan/Zoom und Undo/Redo prüfen. Danach geteilte Ansicht und Dateidialog-Escape prüfen.

Grenzen: Stichproben in zwei 2D-Ansichten, keine vollständige Browsermatrix aller Layouts oder 3D-Arbeitsebenen. Keine Leistungszusage für beliebige Projektdichte. Layout-/Viewportwechsel beenden temporäre Referenzsitzung bewusst, Navigation innerhalb derselben Ansicht erhält sie.

### Abgeschlossener Folgeauftrag: Vertrag für eine aktive 3D-Arbeitsebene planen

Vorhandene 3D-Kamera, Picking und gemeinsame ToolInteraction gegen den 2D-Fangpfad prüfen. Einen begrenzten technischen Vertrag für eine horizontale aktive Arbeitsebene mit Welt-/Ebenenkoordinaten, CSS-Fangradius, stabiler Zielauswahl und derselben Application-Aktion dokumentieren. Ebenenwechsel, Ursprung, Referenzen und Abbruch festlegen; Vorschläge von bestehenden Entscheidungen trennen. Noch keine neue Fangengine, keine beliebigen Dach-/Schnittebenen und keine neuen Bauteile implementieren. Daraus genau ein kleines Umsetzungspaket ableiten.


### Abschluss: Vertrag für horizontale 3D-Arbeitsebene — 04.10.2026

Dokumentationsauftrag auf acc5c44 (PR #63 weiterhin offen, kein Merge). Vorhandene orthographische Kamera, Solid-/Wand-Picking, gemeinsame ToolInteraction, skalare Fangmetrik und Moduswechsel im Workspace untersucht. docs/3D_WORKPLANE_PLAN.md trennt Codebefund, verbindliche bestehende Grenzen und Vorschläge. Startvorschlag z=0 passt zum aktuellen XY-Modell; keine erfundene Geschosshöhe oder freie Z-Bewegung. Eine Wand-ID aus pickWall ist noch kein geometrischer Bewegungsursprung.

Wichtiger Befund: schräge Ebenenansicht hat richtungsabhängige Pixelmaßstäbe. Exakte CSS-Metrik, konservative lokale Vorauswahl und gleiche Projektionsparameter für Renderer/Inverse sind nötig. Bei pitch=0 kollabiert die horizontale Ebene; ungültige Inverse darf keinen Zielpunkt bestätigen. Vorschau darf ihren eigenen Projektionsrahmen nicht verschieben. Lesende Rechnung mit vorhandener projectPoint und Testgrundriss bestätigt unterschiedliche Einheitsachsen (112,61/63,13 CSS-Pixel bei pitch=0,3; 800x600) und Singularität bei pitch=0.

Nur drei Markdown-Dateien geändert. Keine neuen Laufzeitfunktionen; keine neue Build-/Browserabnahme behauptet. Die 257 Tests/Build-/TypeScript-Ergebnisse aus PR #63 gelten für unveränderten Anwendungscode. Dokumentpfade, Änderungsumfang und Whitespace geprüft. Offene Bedienfragen: Ebene/Anker sichtbar machen, verdeckte Referenzen, Kamera-Gesten und Schwelle schlechter Konditionierung. Diese blockieren die reine mathematische Grundlage nicht.

### Abgeschlossener Folgeauftrag: gemeinsame orthographische Projektion und Ebeneninverse

Vorhandene Vorwärtsprojektion in einen numerischen Baustein unter geometry/projections überführen und projectPoint kompatibel darauf delegieren. Rendering-Adapter für horizontale Ebene mit gemeinsamem Rahmen/Aspect/CSS-Rechteck, Inverse und strukturiertem Ungültigkeitsstatus ergänzen. Numerische Fehlerschranke begründen. Vorwärts-/Roundtrip-/Suchgrenzen-/Singularitätsfälle gemäß Abschnitt 8 von docs/3D_WORKPLANE_PLAN.md sowie bestehende Geometrie/Picking, gesamte Tests, TypeScript, Build und Lint prüfen; unveränderte 3D-Darstellung/Auswahl praktisch abnehmen. Kein Fang-Overlay, keine neue 3D-Modellaktion und keine separate Fangengine.

### Abschluss: gemeinsame orthographische Projektion — 04.10.2026

PR #63 normal nach feat/reference-segment-selection übernommen (1a8378e), PR #64 normal nach fix/reference-selection-lifecycle (3fe01da). main unverändert. Neuer Entwicklungszweig feat/orthographic-workplane-projection auf diesem Gesamtstand.

Gemeinsamer Projektionsbaustein unter geometry/projections; Renderer, Picking und kompatible projectPoint verwenden dieselbe Formel. Horizontaler Rendering-Adapter bindet unveränderliche Parameter, rechnet Client-CSS-Koordinaten zurück und liefert konservative lokale Suchgrenzen. Ungültige oder numerisch unzuverlässige Ergebnisse werden ausdrücklich abgelehnt. Kein neuer Modellzustand, keine Kopie der Fangengine und noch kein 3D-Fang-Overlay.

264 Tests bestanden (sieben neue Tests mit Parameterreihen): exakte alte Vorwärts-/Tiefenwerte, Roundtrips bei wechselnder Kamera/Zoom/Pan/Aspect/Höhe, CSS-/Backbuffer-Verhältnisse, Singularität/NaN/Überlauf, konservative Suchgrenzen, Snapshot-Isolation und große Weltkoordinaten. TypeScript und Build erfolgreich; ESLint 0 Fehler/6 bekannte React-Refresh-Warnungen. Browser: Wand mit offener Fensteröffnung sichtbar, Wechsel von Navigator-Fensterauswahl zu Wand durch 3D-Klick korrekt, Kamera-Taste/Zoom bedienbar, Wandselektion beim Wechsel nach 2D erhalten. Keine vollständige 3D-Gestenmatrix behauptet.

Praktische Abnahme: 3D öffnen, im Navigator Fenster wählen, sichtbare Wandfläche anklicken; Werkzeugeigenschaften müssen wall-1 mit 3,00/0,36/2,80 m zeigen. Ansicht drehen/zoomen und nach 2D wechseln; Auswahl und Maße bleiben erhalten. Die Inverse ist zunächst eine getestete Infrastruktur ohne neue Bedienoberfläche.

Grenzen: nur orthographische horizontale Ebene; numerische Fehlerschätzung ist keine formale Intervallgarantie und umfasst keine Eingabegeräte-/Quellfehler. Noch keine anisotrope Fangmetrik im gemeinsamen Resolver. Gesten, verdeckte Ziele und sichtbare Ebenenanker bleiben offen.

### Abgeschlossener Folgeauftrag: gemeinsame affine Bildschirmmetrik für lokale Vorauswahl

Einen fachunabhängigen numerischen Vertrag für affine Ebenen-zu-CSS-Metrik ergänzen und die gemeinsame lokale Punkt-/Segment-Vorauswahl darauf umstellen: konservative Suchbox, exakter CSS-Punkt-/Segmentabstand vor Dichtezählung und Paarbildung. Den heutigen isotropen 2D-Faktor über denselben Vertrag mit unveränderten Ergebnissen abbilden. Schrägansicht, lange Segmente, Fangradiusgrenzen und Dichtezählung testen; bestehende 2D-Tests und Build erhalten. Noch keine 3D-UI aktivieren: Ranking, Führungen, Hover und manuelles Picking benötigen danach denselben Vertrag, bevor ein vollständiger 3D-Fangpfad freigeschaltet wird. Keine per-Werkzeug-Metrik und keine globale Schnittpunktliste.

### Abschluss: affine Metrik für lokale Vorauswahl — 04.10.2026

PR #65 nach Freigabe normal nach fix/reference-selection-lifecycle übernommen (5778f4c), main unverändert. Neuer Zweig feat/local-affine-screen-metric. Ein gemeinsamer Geometry-Baustein liefert CSS-Punktabstände, inverse Suchboxen und Segmentnähe. Der horizontale Arbeitsebenenadapter stellt die Metrik aus denselben Projektionsableitungen bereit. Die gemeinsame lokale Quellensuche verwendet sie bereits für alle bisherigen numerischen 2D-Aufrufe über einen isotropen Adapter; keine Werkzeugkopien.

Segmentverfeinerung erfolgt vor Dichtezählung und Schnittpunktpaaren. Lang gezogene Segmente bleiben vollständig, tolerierte Kontakte bleiben erhalten. Gewollte Änderung: Segmente ausschließlich in den Ecken des bisherigen Suchquadrats, aber außerhalb des CSS-Fangkreises, zählen nicht mehr unnötig zur Dichte. Exakte akzeptierte Punktziele behalten den bisherigen Radius und ihre Reihenfolge. Keine Änderung von Modell, Undo, Dateien oder IFC.

269 Tests bestanden; TypeScript/Build erfolgreich, ESLint 0 Fehler/6 bekannte React-Refresh-Warnungen. Fünf neue Tests mit Parameterreihen: affine Abfragen gegen vollständige Enumeration einschließlich Rotation/Scherung/Verkürzung, 40 falsche Dichtekandidaten ausgeschlossen bei zwei erhaltenen langen Kreuzungslinien, numerische API/Adapter-Parität und ungültige Metriken, echte CSS-Abstände aus der Arbeitsebene und inverse Suchgrenzen, Tangenten/Toleranzkontakte/Kreisecken. Bestehende lokale Differenzialtests einschließlich großer Offsets und entfernter aktiver Referenzen bestanden. Kein neuer manueller Browsernachweis in diesem Paket; keine Leistungszusage für beliebige Projektdichten.

Praktische Abnahme: zwei lange Linien kreuzen lassen, Linienwerkzeug nahe der Kreuzung bewegen, Schnittpunkt und End-/Mittelpunkte prüfen. Eine Referenz 0,6 Sekunden aktivieren, zoomen und weiterzeichnen; aktive Hilfslinie soll erhalten bleiben. Bei dichter Geometrie dürfen nur nahe Linien zur Dichteschranke beitragen. Schrägansicht ist mathematisch getestet, aber noch keine aktivierte 3D-Fangbedienung.

### Abgeschlossener Folgeauftrag: Punkt-Ranking im gemeinsamen Fangresolver

Den bestehenden Resolver-Vertrag für Punktkandidaten um dieselbe ScreenMetric erweitern und End-/Mittel-/Schnittpunkt-Abstände samt Rangfolge darüber bewerten. Gemeinsamen Application-Quellenadapter konsistent mit derselben Metrik versorgen; bisherige numerische 2D-Aufrufe kompatibel erhalten. Affine Kandidaten am Radiusrand, konkurrierende Ziele, deterministische Gleichstände und 2D-Differenzialfälle testen. Noch keine 3D-UI aktivieren und fachliche Modellwinkel/-längen nicht in Bildschirmwinkel umdeuten. Führung/Segment-Hover/manuelles Picking bleiben ausdrücklich weitere Anschlussstellen vor Freischaltung des vollständigen 3D-Pfads.

### Abschluss: gemeinsames Punkt-Ranking — 04.10.2026

PR #66 nach Freigabe normal nach fix/reference-selection-lifecycle übernommen (803d07f), main unverändert. Zweig feat/shared-point-screen-ranking. SnapContext nimmt dieselbe optionale ScreenMetric entgegen; bisherige numerische Aufrufe erhalten den isotropen Adapter. Die Metrik wird pro Abfrage an den gemeinsamen Application-Quellenadapter weitergereicht und sowohl lokal als auch zur Punktbewertung verwendet. Keine neue Engine je Werkzeug und keine Änderung der Quellensitzungsidentität.

End-, Mittel- und Segment-Schnittpunkte werden am CSS-Radius bewertet; innerhalb derselben Priorität entscheidet CSS-Abstand. Bestehende Prioritäten und stabile Gleichstandsauflösung bleiben erhalten. Nicht endliche/negative Abstände werden verworfen. Keine Modell-/Datei-/History-Änderung, keine neue 3D-Bedienung.

273 Tests bestanden; TypeScript und Build erfolgreich; ESLint 0 Fehler/6 bekannte Warnungen. Vier neue Tests mit Parameterreihen: konkurrierende affine Ziele, Radiusrand für alle drei Punktarten, Priorität und Gleichstand bei umgekehrter Quellenreihenfolge, isotrope Parität bei Maßstäben/Ortho sowie Application-Ende-zu-Ende-Vergleich lokale/vollständige Quellen. Kein neuer manueller Browsernachweis; bestehende 3D-Fangbedienung weiterhin nicht freigeschaltet.

Praktischer Abnahmetest: im Grundriss nahe benachbarten End-/Mittelpunkten zeichnen; Fangziel und Markierung müssen zusammenpassen. Zoomen, erneut fangen und die Zeichnung abbrechen. Automatische Tests prüfen zusätzlich die noch nicht interaktiv verfügbare schräge Bildschirmmetrik.

### Abgeschlossener Folgeauftrag: gemeinsame Führungsprojektion in Bildschirmmetrik

Eine numerische Projektion auf eine Modellgerade nach minimalem CSS-Abstand in ScreenMetric ergänzen. Gemeinsame Führungs-Kandidaten und deren Abstände darüber führen, einschließlich berechneter Führungsschnittpunkte. Modellrichtungen, Shift-/Ortho-Vorgaben, Winkel/Längen und fachliche Achsenzwänge bewahren; keine Bildschirmwinkel als Modellwinkel behandeln. Isotrope 2D-Parität, affine Lotprojektion, konkurrierende Führungen, entfernte aktive Referenzen und Radiusgrenzen testen. Keine 3D-UI aktivieren; Hover und explizites Picking bleiben danach offene Anschlüsse.

### Abschluss: gemeinsame Führungsprojektion — 04.10.2026

PR #67 nach Freigabe normal nach fix/reference-selection-lifecycle übernommen (b67294b), main unverändert. Zweig feat/shared-guide-screen-projection. ScreenMetric projiziert auf Modellgeraden nach minimalem CSS-Abstand. Gemeinsame Führungskandidaten verwenden diesen Baustein; Führungs-/Achsschnittpunkte sowie Grid-/Shift-Abstandsangaben verwenden dieselbe Metrik. Keine Logik je Werkzeug und keine Modellmutation.

Richtungswahl und Hysterese bleiben in Modellwinkeln. Shift, Ortho und explizite Achsen behalten ihre Modellprojektion und fachlichen Zwänge. Der isotrope Adapter verwendet die bisherige projectDirection-Rechnung exakt. Ungültige Projektionen und nicht endliche Kandidatenabstände werden abgelehnt.

277 Tests bestanden, TypeScript und Build erfolgreich, ESLint 0 Fehler/6 bekannte Warnungen. Vier neue Tests mit Parameterreihen: analytische CSS-Lotbedingung und Minimalabstand bei Verkürzung/Scherung/Rotation, ungültige Richtungen, gemeinsamer Führungsresolver versus Shift-Modellprojektion, Führungsschnittpunkte/entfernte konkurrierende Quellen/Radiusrand/Achsschnitt sowie isotrope Rechenparität. Bestehende Interaktions- und Differenzialtests bestehen. Kein neuer manueller Browsernachweis; keine 3D-Fangbedienung freigeschaltet.

Praktische Abnahme: Hilfspunkt nach 0,6 Sekunden aktivieren, einer horizontalen oder diagonalen Hilfslinie folgen, zweiten Hilfspunkt aktivieren und gemeinsamen Schnitt fangen. Shift halten und freie Wandbewegung mit fester Achse prüfen. Die bisherige 2D-Bedienung soll gleich bleiben; affine Projektion ist zunächst automatisiert abgesichert.

### Genau ein ausführbarer Folgeauftrag: Hover-Erwerb mit gemeinsamer Bildschirmmetrik

Punkt- und Segment-Hover im gemeinsamen Inference-/Application-Pfad an ScreenMetric anschließen, einschließlich CSS-Abstand und nächstem Punkt auf einem endlichen Segment. 600-ms-Erwerb/Entfernen, Kapazität, Ursprungsschutz, Zoom-Erhalt und Modellinvalidierung bewahren. Affine Segmentnähe, Endpunktbegrenzung, Dwell-Wechsel und isotrope 2D-Parität testen. Keine neue Oberfläche und keine 3D-Freischaltung; explizites Referenz-Picking bleibt danach als eigener begrenzter Anschluss offen.
