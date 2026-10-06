# T-Wandanschluss: begrenzter Arbeitsentwurf

Stand 06.10.2026, geprüft gegen Integrationscommit 41f17ba (PR125).
Dies ist ein Arbeitsentwurf, keine implementierte persistente T-Verbindung.

Fortschritt 06.10.2026: Der zuletzt beschriebene reine Geometriehelfer ist in
`src/domain/elements/wall/t-junction.ts` implementiert und getestet. Die übrigen
Vorschläge bleiben unverändert offen. Der aktuelle Folgeauftrag steht im
DEVELOPMENT_PLAN.md; die folgende Planung bleibt als fachlicher Kontext erhalten.

## Bestand und verbindliche Grundlagen

- `src/domain/elements/wall/connections.ts` speichert derzeit ausschließlich
  Endpunktpaare. `reconcileWallJoins` sucht identische Achsenden; eine Berührung
  mitten auf einer Wandachse erzeugt ausdrücklich keinen Anschluss.
- `connectedWallContours` kombiniert zwei Endkonturen, prüft Fenster und leitet
  über `contour-solid.ts` dieselben Körper für Grundriss, 3D und IFC ab.
- `src/domain/project/schema.ts` und `src/interop/project-file/load.ts` validieren
  Schema 7 streng. Ein T-Anschluss ist mit zwei `WallEnd`-Werten nicht darstellbar.
- `src/application/snapping/project-references.ts` liefert Achsen als Segmente.
  Die gemeinsame Fangengine bleibt zuständig; weder Werkzeug noch Wand-Domain
  bekommt einen eigenen Mausabstand oder eine eigene Hover-Logik.
- `src/geometry/solids/profile-openings.ts` extrudiert konvexe Konturen mit
  Durchgangsöffnungen. Ein rechtwinkliger stumpfer Anschluss benötigt zunächst
  keine allgemeinen Booleschen Operationen.
- Nutzerentscheidung: Achsenanschlüsse sollen automatisch entstehen; einzelne
  wegbewegte Wände lösen Verbindungen. Wandketten bilden einen Undo-Schritt.
  Für T-spezifische Folgeregeln liegt noch keine Nutzerentscheidung vor.

Verbindliche Architekturgrenzen: stabile Bauteil-IDs, keine zweite Modellkopie,
Vorschau ohne Modellmutation, gemeinsame Application-Aktionen und Validierung,
keine autoritative Geometrie in React oder im IFC-Adapter. Sichtbarkeit verändert
weder Verbindungen noch den vollständigen IFC-Export.

## Vorgeschlagene erste Geometrie

Zunächst ein rechtwinkliges T aus zwei geraden Wänden gleicher Höhe und Stärke:
Die Achse der ankommenden Wand endet im Inneren des Achssegments der Hauptwand.
Die Hauptwand bleibt ein Bauteil mit unveränderter ID, Achse und Kontur. Der
ankommende Wandkörper endet an der zugewandten Körperfläche der Hauptwand.
Die Körper berühren sich dort ohne Volumenüberdeckung. Die Zeichenachse darf
bis zur Hauptwandachse reichen; sie ist kein zusätzliches physisches Bauteil.

Die Anschlussseite wird aus der vom Knoten wegführenden Richtung der ankommenden
Wand bestimmt, nicht aus Bildschirmorientierung oder einer geratenen Reihenfolge.
Alle drei Achslagen und beide Zeichenrichtungen müssen dasselbe physische
Ergebnis ergeben. Die ganze Breite des Anschlusses muss innerhalb einer geraden
Seite der Hauptwand liegen. Randkontakt, Übergriff über deren Enden, zu kurze
ankommende Wände, parallele oder schräge T-Achsen werden zunächst abgewiesen.
Bestehende Eckanschlüsse am jeweils anderen Ende dürfen nicht überschrieben
werden; ihre Kombination ist vor produktiver Integration gesondert zu prüfen.

Vorschlag Öffnungen: Fenster der ankommenden Wand dürfen den neuen Abschluss
nicht berühren oder überschreiten. An der Hauptwand darf im Anschlussbereich
kein Fenster liegen oder dessen Rand berührt werden. Die Schutzprüfung erfolgt
mit der vollständigen Kontaktbreite, nicht nur dem Achsknoten. Kein frei erfundener
Zentimeterabstand: zunächst geometrischer Nichtkontakt nach Modell-Toleranzen.
Höhenabhängige Sonderfälle und Durchdringungen bleiben außerhalb dieses Schritts.

Beispiel: Hauptachse (0,0)–(6,0), Stärke 0,36 m, mittige Achse; Nebenachse
(3,-3)–(3,0), ebenfalls 0,36 m und Höhe 2,80 m. Der Nebenwandkörper endet bei
y=-0,18. Ohne Öffnungen beträgt das Gesamtvolumen
(6*0,36 + 2,82*0,36)*2,80 = 8,89056 m³. Beide IDs bleiben erhalten.

## Persistenz und Bedienung: Vorschläge, noch nicht festgelegt

Eine spätere Relation benötigt mindestens ankommende Wand-ID und Endindex,
Hauptwand-ID sowie einen eindeutig definierten Anker auf deren Achse. Ob der
Anker relativ oder als Abstand gespeichert wird, hängt vom Änderungsverhalten
ab und bleibt offen. Keine zusätzliche editable Kontur speichern.

Die spätere Schemaerweiterung muss bestehende Endpunktpaare unverändert lesen.
Alte Dateien erhalten keine T-Verbindungen allein durch Laden. Die Migration
muss nach altem Vertrag prüfen und anschließend explizit konvertieren; keine
Umdeutung bisher überlappender Wände. Noch keine Schemaänderung in diesem Auftrag.

Zu entscheiden vor automatischer Bedienintegration:

1. Ändert sich die Hauptwandlänge: soll der T-Anker relativ mitwandern, einen
   Abstand vom Anfang behalten oder sich lösen? Keine Variante ist bestätigt.
2. Wird die Hauptwand bewegt: soll die Nebenwand folgen oder die Verbindung
   gemäß der Einzelwandregel gelöst werden? Vorschlag: lösen, nicht mitziehen.
3. Mehrere mögliche Hauptwände: Vorschlag explizite Zielwahl über den vorhandenen
   Referenzkontext; niemals still die erste Wand auswählen.
4. Fenster am Hauptwandanschluss: vorgeschlagene Nichtkontaktregel bestätigen.
5. Mehrere T-Anschlüsse und vorhandene Eckgehrungen: Kontakte dürfen sich nicht
   überschneiden. Diese Kombination erst nach dem einzelnen T integrieren.

Der geänderte Endpunkt muss auf das konkrete Achssegment gefangen/projiziert
werden. Fangradius dient der Auswahl, nicht der Modellidentität. Keine pauschale
Suche nach beliebigen nahen Wänden beim Speichern oder Laden. Für einen späteren
Commit müssen Quellprojekt, Ziel-ID und gültiges Achssegment weiterhin passen.

## Gemeinsame Aktionen, Text und Sprache

Text/Voice sind gemäß Leitfaden begleitende Adapter bereits geprüfter Aktionen.
Die letzte Nutzer-Rückfrage ist kein Auftrag, Sprache generell zurückzustellen.
PR124 (Offset-Textadapter) ist separat offen; Freigabe von PR125 führt PR124 nicht
mit zusammen. Der vorgesehene Sprachadapter kann auf dessen geprüftem Aktionspfad
aufbauen, sobald der Abhängigkeitsstand übernommen ist.

Auch künftige T-Befehle verwenden dieselbe Application-Aktion wie Maus/Inspector.
Zielkontext enthält stabile IDs beider Wände, Endindex, Quellstand und den
bestätigten Achsanker. Erkennung normalisiert Eingaben; sie berechnet weder
Wandgeometrie noch Verbindungen. Fehlende Hauptwand wird erfragt, nicht geraten.
Vorschau, Bestätigung, Abbruch, stale-context-Prüfung und Undo bleiben gemeinsam.
Für den zunächst reinen Geometriehelfer gibt es noch keine neue Sprachaktion.

## Nachweise vor Bedienfreigabe

- Geometrie: obiges analytisches Volumen, exakter Flächenkontakt ohne Überlappung,
  beide Anschlussseiten, Achslagen, Endpunktumkehr, Rotation und Translation;
  Grenzfälle kurzer Wände und Kontakte nahe Endkappen.
- Öffnungen: beide Wände, knapp frei/berührend/überlappend, unveränderte Eingaben
  bei Ablehnung. Geprüfte rechte und schräge Eckanschlüsse bleiben erhalten.
- Integration: zeichnen und verschieben auf einen Achspunkt, Abbruch, Ablehnung,
  Auflösen und Undo/Redo; Wandkette weiterhin atomar. ID und Fensterzuordnung
  der ungeteilten Hauptwand bleiben stabil.
- Dateien: alte Projekte unverändert; neue Relation rundlaufstabil; veraltete,
  unbekannte oder widersprüchliche Bezüge werden abgewiesen.
- Darstellung/Export: identische gemeinsame Konturen und Netto-Volumina in Plan,
  3D und IFC; IfcOpenShell-Prüfung plus anschließend Nutzerabnahme in Archicad.
- Große Modelle: Kandidatensuche über bestehende räumliche Infrastruktur, keine
  globalen Wandpaarvergleiche bei jedem Mausereignis.

## Genau ein ausführbarer Folgeauftrag

Implementiere und teste einen reinen Domain-Geometriehelfer für das oben
beschriebene rechtwinklige T ohne Fenster und ohne weitere Anschlüsse an diesen
beiden Wänden. Er nimmt zwei explizite Wandparameter und den Endindex entgegen,
validiert die begrenzte Geometrie und liefert unveränderte Hauptkontur,
gekürzte Nebenkontur und Kontaktsegment als abgeleitetes Ergebnis. Nutze
bestehende Körper-, Projektions- und Polygonprüfungen, keine neue Modellstruktur.
Prüfe analytisches Volumen, beide Seiten/Achslagen/Orientierungen sowie ungültige
und kurze Eingaben. Keine Persistenz, automatischen Verbindungen, UI oder neuen
Befehle in diesem Teilauftrag. Seine Prüfung benötigt keine Entscheidung über
das noch offene Verhalten beim späteren Verschieben der Hauptwand.
