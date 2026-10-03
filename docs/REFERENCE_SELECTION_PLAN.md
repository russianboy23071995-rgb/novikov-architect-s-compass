# Gemeinsamer Vertrag: optionale Referenzauswahl

Stand 04.10.2026. Ausgearbeiteter Umsetzungsvorschlag, keine bereits implementierte Funktion. Nutzerziel: gezielte Kontrolle bei außergewöhnlich vielen Fangquellen; Häufigkeit in echten Projekten unbekannt. Bestehende Architekturregeln bleiben verbindlich. Zahlen und neue Bedienregeln unten sind vorläufige technische Vorschläge.

## Auslösung und unveränderte Grundfunktionen

Nach AABB-Suche, geometrischem Nähefilter und Werkzeug-/Hostausschluss N tatsächlich nahe Segmente zählen, bevor Paare gebildet werden. Vorschlag: bei N > 32 automatische lokale Segmentschnittpunkte aussetzen. Bis 32 entstehen höchstens 496 Paare; der gemessene Fall mit 100 Segmenten benötigte bereits etwa 28 ms. Die Schwelle ist eine vorsichtige Startkonfiguration, kein gemessener Latenznachweis für 32 Segmente. Im Umsetzungsschritt 24/32/33/48 Segmente messen und den Wert gegebenenfalls begründet anpassen.

Eintritt sofort vor teurer Arbeit; Wiederaufnahme erst bei N <= 24 für 250 ms kontinuierlich gültiger Abfragen. Bei Zwischenwerten Zustand halten. Verlassen des Canvas unterbricht diese Zeit; im Hintergrund keine Paarberechnung. Kameraänderung setzt nur den Wiederaufnahme-Timer zurück. Die 600-ms-Regel bleibt ausschließlich für Hover-Referenzen zuständig.

Hinweis: „Viele mögliche Fangziele – automatische Schnittpunkte pausiert“ mit Aktion „Referenzen auswählen“. Er erscheint im betroffenen Viewport, ohne Dialog oder Fokusentzug. Endpunkte, Mittelpunkte, Raster, feste Achsen und die begrenzten aktiven Hilfsführungen bleiben nutzbar. Ohne Auswahl kann der Nutzer damit weiterarbeiten. Keine stillschweigend ausgeblendeten Schnittpunkte und keine Teilmenge zufällig zuerst gefundener Paare.

## Auswahl und Zustände

Dichtezustand (normal/pausiert) und Auswahlzustand (automatisch/auswählen/eingeschränkt) getrennt führen. Ein zentraler reiner Application-Controller verwaltet Ereignisse, keine Zustandsschalter in jedem Werkzeug.

| Ereignis | Wirkung |
|---|---|
| Referenzen auswählen | Entwurf/letzte Vorschau einfrieren, vorhandene bestätigte Auswahl als Arbeitskopie übernehmen, übrige Geometrie dezent abblenden |
| Klick auf Segment | Segment in Arbeitskopie umschalten; keine Modellselektion, kein Bewegungsklick |
| Klick auf vorhandenen Punkt | Explizite Hilfsreferenz vormerken; keine Null-Längen-Linie und kein Segmentpaar erzeugen |
| Übernehmen / Enter | Nichtleere gültige Arbeitskopie bestätigen; Auswahlmodus verlassen und denselben Entwurf fortsetzen |
| Abbrechen / Escape | Arbeitskopie verwerfen, vorherige Auswahl und Entwurf erhalten; Escape nicht zusätzlich ans Werkzeug weiterreichen |
| Auswahl aufheben | Automatischen Modus wiederherstellen; bei weiter dichter Geometrie bleiben automatische Schnittpunkte sichtbar pausiert |
| Vorgang bestätigen/abbrechen, Werkzeugwechsel, Modellwechsel/Undo/Redo/Laden | Auswahl und suspendierten Kontext verwerfen, vorhandenen gemeinsamen Sitzungsreset verwenden |

Keine automatische Bestätigung nach dem zweiten Klick. Eine einzelne Linie oder ein Punkt ist als Hilfsreferenz sinnvoll; ein einzelnes Segment erzeugt keine lokale Kreuzung. Entfernte aktive Referenzen und Ursprung bleiben beim Eintritt erhalten. Hover-Erwerb/-Entfernung und Richtungsupdates während der Auswahl suspendieren; angezeigte Führungen einfrieren. Nach Rückkehr beginnt eine neue Hover-Verweildauer, ohne gespeicherte Referenzen zu löschen.

Punktübernahme verwendet den vorhandenen Referenzvertrag und dessen Kapazitäts-/Verdrängungsregeln, kein unbegrenzter zweiter Hilfsreferenzsatz. Vor Bestätigung anzeigen, falls dadurch ältere unfixierte Referenzen ersetzt werden. Segmentauswahl schränkt die automatischen Paare ein; Paralleltracking bleibt im bestehenden Hover-System.

## Quellenfilter und Identität

Auswahl besteht aus stabiler Element-ID, Quellfeature/Segment-ID und gebundenem Project-Snapshot. Der bisherige referenceKey enthält Koordinaten und darf nicht als dauerhaft modellübergreifende ID missverstanden werden. Polylinien: einzelne Teilsegmente auswählen, nicht automatisch alle Segmente des Elements. Zwei geradlinige Segmente bedeuten ein Paar.

Reihenfolge: lokale Quellen suchen → geometrisch verfeinern → Werkzeugregeln anwenden → ausgewählte Segmentmenge schneiden → Dichte prüfen → zulässige Paare berechnen → bestehende Kandidatenrangfolge. End-/Mittelpunkte bleiben auch von nicht ausgewählten Elementen verfügbar. Aktive entfernte Führungen werden getrennt über vollständigen Lookup validiert; sie ziehen keine zusätzlichen Modellsegmente in die Paarbildung. Damit entsteht kein unbeabsichtigtes ausgewählt-mal-alle.

Wenn die manuelle Auswahl selbst zu viele nahe Segmente enthält, bleibt Paarbildung ausgesetzt und der Hinweis fordert Reduzierung. Keine verdeckte Trunkierung. Nach Auswahlbestätigung Dichte neu auswerten; eine kleine gültige Menge darf sofort wieder rechnen, die Hysterese betrifft automatische Wechsel bei Mausbewegung.

## Lebenszyklus und Eingaben

Zoom/Pan erhalten bestätigte Auswahl und aktive Referenzen; sie ändern nur lokale Kandidatenzahl und sichtbare Marker. Während der Auswahl dürfen Navigation und Kandidatenhighlight arbeiten, aber weder numerisches Übernehmen noch Text-/Sprachaktion den suspendierten Vorgang bestätigen. Modale Dialoge behalten ihre vorhandene Priorität. Nach Modelländerung durch einen anderen Eingang wird die Auswahl ungültig, verspätete Ereignisse werden abgewiesen.

Die ToolInteraction.identity wechselt beim nächsten Polylinienpunkt. Daher Auswahl an eine explizite übergeordnete Vorgangsidentität binden: gesamte Wand-/Linienzeichnung oder EditSession; Ursprung darf innerhalb desselben Zeichenvorgangs wechseln. Kein globaler persistenter Filter. Idle-Hover erhält eine viewportbezogene temporäre Sitzung, endet bei Werkzeugstart, Modellwechsel oder Aufheben; keine Übernahme in einen neuen Vorgang.

Überlappende Treffer: gemeinsames Picking liefert eine deterministisch sortierte Trefferliste mit stabilen Quellidentitäten. Bei Mehrdeutigkeit kleine Liste nahe dem Zeiger mit Elementname, Teilsegment und Hervorhebung; kein stilles Wählen nach SVG-Reihenfolge. Esc schließt zuerst diese Liste, dann erst beim nächsten Esc den Auswahlmodus. Tab navigiert im Auswahlpanel und darf nicht die pausierte Längen-/Winkeleingabe aktivieren.

## Abgleich mit vorhandenem Code

- application/snapping/local-sources.ts berechnet aktuell Paare direkt in query. Für die geplante Schranke primitive lokale Abfrage und Paarbildung trennen; keine nachträgliche Filterung. Vollständigen Lookup und Snapshotcache behalten.
- application/tools/snapping.ts bleibt gemeinsamer Einstieg für alle Tools. Auswahl/Dichte als expliziter Kontext und strukturiertes Ergebnis mit Pausenstatus führen. querySnap darf keine versteckten Zustandsänderungen auslösen; reine Abfragen können mehrfach pro Pointerereignis laufen.
- constraints/snapping/engine.ts behält Geometrie und Ranking. Keine React-, Dialog- oder Projektzustände dort.
- useHoverReference.ts und BimPlan.tsx müssen dasselbe aufgelöste Quellen-/Pausenergebnis verwenden. Eine unabhängige Hover-Abfrage darf die teuren Paare nicht erneut starten. sameHoverSession darf durch Dichtehinweis oder Auswahlpanel nicht versehentlich Referenzen verlieren.
- useToolInteraction.ts erhält gemeinsame Suspend-/Resume-Semantik. BimPlan leitet Auswahlklicks vor den vorhandenen Zeichen-, Doppelclick-, Edit- und normalen Selektionshandlern um. Keine neue Bedienlogik in einzelnen Wall-/Line-Adaptern.
- Rendering liefert Treffer/Highlight, Application prüft Auswahlzulässigkeit. Auswahlpanel bleibt getrennt von fachlichen Werkzeugeigenschaften; dort keine Bauteileigenschaften duplizieren.

## Genau ein nächstes Umsetzungspaket

Gemeinsame Dichteschranke mit sichtbarem Viewportstatus implementieren, zunächst ohne Referenzauswahl-Picking. Lokale primitive Abfrage von Paarbildung trennen und expliziten Pausenstatus gemeinsam an Zeichnen, Direct Edit und Hover liefern. Timer/Hysterese durch einen Controller mit injizierter Zeit; keine Seiteneffekte in querySnap. Hinweis zunächst ehrlich „Viele Fangziele – automatische Schnittpunkte pausiert; Ansicht vergrößern“, ohne funktionslosen Auswahlbutton. Schwellenfälle messen; alle aktuellen Funktionen erhalten. Danach ist die Auswahloberfläche ein separates kleines Paket auf demselben Vertrag.

Abnahmetests für dieses Paket: 32/33 und 24/25 Grenzfälle; genau 250 ms Wiederaufnahme; keine Paarfunktion im pausierten Pfad; End-/Mittelpunkt und entfernte Führungen bleiben verfügbar; Eigen-/Hostausschluss vor Zählung; identischer Fang unterhalb der Schranke; Zoom erhält Referenzen; Snap aus, Abbruch und Modellwechsel; Zeichnen/Direct Edit/Hover ohne Umgehung; sichtbarer Status stimmt mit tatsächlich ausgeführter Suche überein. Keine allgemeine Performancezusage.

Spätere Auswahltests: Klick bestätigt niemals Modellaktion, Arbeitskopie/Cancel und frühere Auswahl, Polylinienpunktwechsel, mehrdeutiges Picking, Punktkapazität, Idle-Sitzung, Modal/Tab/Escape, veraltete Bestätigung. Keine vollständige Auswahlimplementierung im ersten Paket.
