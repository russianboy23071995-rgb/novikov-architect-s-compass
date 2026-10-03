# Lokale Fangabfrage: Codeabgleich und Migrationsplan

Stand: 04.10.2026. Planungsauftrag, keine neue Engine implementiert.
Basis: PR #53 (6a5f47a), zuvor lokal f55912e. Der Wiederverwendungsschritt ist unverändert veröffentlicht. #51–53 sind offen; keine Merge-Freigabe abgeleitet.

## Verbindliche Zielregeln

- Sofortiger Fang auf nahe Endpunkte, Mittelpunkte und echte Segmentschnittpunkte. Die 600 ms steuern ausschließlich Referenzaktivierung/-lösung, nicht die Verfügbarkeit eines Fangtreffers.
- Räumliche Suche umfasst Punkte **und vollständige Segmentausdehnungen**: lange Linien mit weit entfernten Enden müssen an einer Kreuzung nahe der Maus gefunden werden.
- Nur lokale Segmentpaare erzeugen unmittelbare Schnittpunktkandidaten. Kein globales Schnittpunktverzeichnis im Produktionspfad auf Vorrat.
- Aktive, auch entfernte Referenzen und ihre Fluchten werden getrennt von lokalen Geometrietreffern ausgewertet. Der sofort gepinnte Bewegungsursprung bleibt erhalten.
- Eine gemeinsame Kandidatenrangfolge, gemeinsame Quellenausschlüsse und dieselben validierten Modellaktionen für Zeichnen und Direct Edit. Keine Werkzeugkopien.
- Fangabstand in CSS-Pixeln; Umrechnung in Modellmeter pro Abfrage. Zoom verändert den Suchbereich, nicht den geometrischen Index oder gültige Referenzen.
- Index und Quellenverzeichnis sind abgeleitete Daten des unveränderlichen Modellstands, nie eine zweite Modellhaltung und kein Bestandteil von JSON/IFC.

## Iststand und konkrete Änderungen

| Vorhandenes Modul | Befund | Geplante Verantwortung |
|---|---|---|
| application/snapping/project-references.ts | Baut Punkte/Segmente und über segmentIntersectionReferences alle Kreuzungen. WeakMap hält den fertigen Satz je Project. | Primitive Quellen und Segmentgeometrie ohne globale Kreuzungen ableiten; Snapshot mit Index und stabilem Quellenverzeichnis wiederverwenden. |
| constraints/snapping/segment-references.ts | Vollständige Paarprüfung, kanonische Quellenreihenfolge und Abhängigkeiten. | Dieselbe exakte Schnittprüfung nur auf lokalen Segmenten; bisherige Vollprüfung als Testoracle behalten. |
| geometry/intersections/segments.ts und tolerances/model.ts | Geprüfte Schnitt- und Toleranzregeln. | Unverändert für endgültige Trefferentscheidung; konservative Suchboxen dürfen keine hier akzeptierten Treffer verlieren. |
| application/tools/snapping.ts, direct-edit/snapping.ts | Gemeinsamer Einstieg, Eigen-/Host-Ausschlüsse, feste Achsen. | Suchsnapshot und Quellenerlaubnis weitergeben; beide Blätter eines Schnittpunkts prüfen. Keine globale Listenfilterung pro Mausbewegung. |
| constraints/snapping/candidates.ts | Durchläuft alle Punktquellen; activeSources baut pro Abfrage eine vollständige Map. | Lokale Punkte getrennt von aktiven Quellen auswerten; Gültigkeit aktiver Quellen über Snapshot-Lookup prüfen. |
| constraints/inference/construction-reference.ts | Prüft Blattabhängigkeiten gegen vollständige Basisliste; acquisitionReference sucht Kandidaten in dieser Liste. | Identität und Blattgeometrie über Quellenverzeichnis prüfen; lokal erzeugte Schnittreferenz direkt übernehmen können. Kein räumlicher Ausschluss gültiger entfernter Blätter. |
| constraints/inference/hover-reference.ts | sameHoverSession hängt an Array-Identität. | Modell-/Policy-/Reset-Identität statt wechselnder lokaler Ergebnisliste; Mausbewegung darf Timer und Referenzen nicht pauschal zurücksetzen. |
| useHoverReference.ts, segment-hover.ts | Zweite querySnap-Abfrage und linearer Segmentscan für Referenzerwerb. | Dieselbe lokale Geometriesuche nutzen; bestehende getrennte Hover-Semantik und Zeitquelle erhalten. Hover-Abfrage muss nicht dieselben Achsbeschränkungen wie der Commit haben. |
| BimPlan.tsx | Liefert Kamera, Pointer, Policy, Hover und Darstellung. | Liefert Abfragekontext; enthält weder Indexbau noch eigene Schnittmathematik. Vorschau und Bestätigung verwenden dieselbe Auflösung. |

## Gemeinsamer Abfragevertrag (Semantik verbindlich, Namen Vorschlag)

Modellaufbereitung liefert `SnapSourceSnapshot`: Modellidentität, primitive Punkt-/Segmentquellen, räumlicher Index und `lookup(sourceKey)`. Der Lookup enthält gespeicherte Blattquellen, keine vorsorglich erzeugten Kreuzungen. Der Index kennt nur Geometrie und opake Schlüssel; keine Wand-, Fenster- oder React-Typen.

Eine Abfrage erhält Mausposition, CSS-Maßstab/Fangradien, Snapshot, Werkzeug-Quellenerlaubnis, feste Achse/Shift/Ortho, aktive Referenzen und deren Richtungszustand. Ergebnis: lokale Punkt- und Segmentquellen, lokal berechnete Schnittreferenzen sowie davon getrennte gültige aktive Quellen. Die bestehende Engine erzeugt daraus Fang-/Guide-Kandidaten und verwendet ranking.ts. Hover darf denselben lokalen Suchdienst für Segmenttracking verwenden, ohne seine Auswahl künstlich auf die Commit-Achse zu beschränken.

Suchbox: um die Maus mit Radius `radiusPx / pixelsPerMetre`, konservativ um numerische Modellkompatibilität erweitert. Bei verschiedenen Hover-/Fangradien beide Abfragen beziehungsweise die größere Box mit nachträglicher exakter Prüfung verwenden. Bounding-Box-Überlappung ist nur Vorauswahl. Punktabstand, Segmentabstand, tatsächlicher Schnittpunkt und Kreisradius werden danach geprüft. Originalsegmente nicht auf die Suchbox zuschneiden: Das könnte künstliche Endpunkte und andere Toleranzentscheidungen erzeugen.

Lokale Schnittpunkte tragen weiterhin beide originalen Blattquellen, kanonisch sortierte Identität und Richtungen. Zuerst Quellenausschlüsse anwenden, dann lokale Paare schneiden, duplizierte Treffer deterministisch behandeln. Mehrere Paare am selben Ort nicht allein nach Koordinate zusammenwerfen: Herkunft und Ausschlüsse bleiben entscheidend. Räumliche Traversierungsreihenfolge darf das Ranking nicht beeinflussen.

Aktive Quellen werden über vollständige Identität/Geometriesnapshot und erlaubte Blätter validiert, nicht über Anwesenheit in der Suchbox und nicht allein über Element-ID. Pinned Origins gehören zur aktuellen Sitzung; konstruierte Punkte bleiben temporär mit abgeflachten Blattabhängigkeiten. Entfernte aktive Referenzen können lokale Fluchten und Flucht-Flucht-Schnittpunkte liefern. Eine zusätzliche neue Fangart „beliebige Flucht schneidet beliebiges Segment“ ist nicht Teil dieser Migration.

## Lebenszyklus und vorgeschlagene Umsetzung

Verbindlich: neues unveränderliches Project erzeugt einen passenden Index; Werkzeug-/Ursprungswechsel und Zoom nicht. Undo/Redo dürfen einen Index des passenden historischen Snapshots wiederverwenden. Neu geladene Projekte mit gleichen IDs sind neue Snapshots. Abbruch ändert das Modell nicht; bestehende Regeln für Session-Ende und Referenz-Reset bleiben erhalten. WeakMap-Schlüssel vermeiden künstliches Festhalten gelöschter Projekte; während Snapshot-History ältere Modelle hält, können deren Indexdaten allerdings ebenfalls Speicher belegen. Dies ist zu messen, keine feste Speicherzusage.

Vorschlag für die erste Implementierung: statischer balancierter AABB-Baum mit konservativen Boxen für Punkt-/Segmentprimitive in geometry/spatial, gebaut je Modell-Snapshot. Er vermeidet die Vervielfachung sehr langer Segmente in vielen Rasterzellen. Application hält Zuordnung zu Modellquellen und Snapshot-Lookup; Constraints führt Fangabfrage und Rangfolge aus. Exakter Baumaufbau, Blattgröße und API-Namen sind Implementierungsentscheidungen, keine festgelegten Nutzerwünsche. Keine neue Bibliothek verbindlich gewählt.

Zunächst vollständiger Neuaufbau des **Primitivindex** bei Modelländerung; inkrementelle Indexupdates erst nach Messung und belastbarem Änderungsvertrag. Das ist bereits grundsätzlich anders als der bisherige vollständige Schnittpunktaufbau. Sehr dichte lokale Geometrie kann weiterhin viele Paare erfordern; keine harte Kandidatenkappung mit still verlorenem Fang.

## Geordnete Migration

1. Reiner, funktionierender lokaler Quellensuchdienst mit Index, Lookup und lokalen Schnittpunkten; gegen bisherigen Vollaufbau vergleichen. Noch keine UI-Umschaltung. Dies ist der einzige jetzt ausführbare Folgeauftrag unten.
2. Danach gemeinsamen Engine-/Hover-Vertrag integrieren: lokale Geometrie und entfernte aktive Quellen trennen, Sitzungsidentität stabilisieren und Acquisition umstellen. Zeichnen, Idle-Hover und Direct Edit gemeinsam umschalten; keine Werkzeugkopien und kein Produktionsfallback, der unbemerkt global alle Kreuzungen erzeugt.
3. Danach praktische Abnahme und identische Größenklassen messen. Altes globales Verfahren bleibt nur Testoracle/alte Baseline; nicht behaupten, die bisherige kalte Messung sei schon der neue Produktionspfad.

Die Schritte 2–3 sind Abhängigkeiten, keine parallelen Aufträge. Kein Komplettumbau, keine leeren Interfaces/Klassen auf Vorrat.

## Nachweise für die spätere Integration

- Sofortiger Fang bei 0/599 ms; Aktivieren/Lösen erst bei 600 ms, einmal pro Besuch.
- Lange kreuzende Segmente mit beiden Enden außerhalb der Suchbox, schräge/fast parallele Linien, Endberührung, kollineare Überlappung, kurze/entartete Geometrie, negative und große Koordinaten, Suchbox- und Fangradiusgrenzen.
- Gleiche Gewinner, Herkunft und Prioritäten gegenüber Vollprüfung bei mehreren Zoomstufen und unabhängig von Indexreihenfolge. Zoom darf lokale Treffer ändern, aber keine erworbene Referenz löschen.
- Entfernte aktive Referenzen und erworbene Schnittpunkte bleiben gültig, solange ihre Blätter gültig sind. Geänderte/gelöschte Quelle, gleiche IDs nach Laden, Undo/Redo und Session-Ende prüfen.
- Eigenmodell-/Fensterhost-Ausschlüsse, abhängige Schnittpunkte, feste Achsen, Shift/Ortho, Snap aus, Rasterfallback sowie gleiche Vorschau/Commit-Koordinaten erhalten.
- Modellaufbereitung, lokale Suche, lokale Schnittprüfung, aktive Guides und gesamte Abfrage getrennt messen; Kandidaten-/Paarzahlen zählen. 100/1000/5000 Elemente und zusätzlich dichte lokale Kreuzungen. Speicher und Wiederaufbau getrennt berichten, keine Browser-FPS aus Node-Zeiten ableiten.

## Genau ein ausführbarer Folgeauftrag

Den reinen lokalen Quellensuchdienst implementieren: primitive Modellableitung ohne Kreuzungen, unveränderlicher räumlicher Index mit Quellen-Lookup, CSS-Radiusabfrage für Punkte und lange Segmente sowie lokale Schnittreferenzen mit bestehender Identität/Toleranz. Differentialtests gegen vollständigen Referenzaufbau im Suchradius und ein reproduzierbarer Messlauf für 100/1000/5000 Elemente. Keine UI-/Hover-Umschaltung, keine neue Fangart, kein globaler Index aller Kreuzungen. Der Dienst muss tatsächlich abfragbar und getestet sein, nicht nur aus Platzhaltertypen bestehen. Erst auf diesem Nachweis die gemeinsame Integration planen.
