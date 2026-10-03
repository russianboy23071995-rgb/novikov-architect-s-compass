# 2D-Linien und Polylinien

Das Werkzeug **Line** (Taste L außerhalb von Eingabefeldern) wechselt in den 2D-Grundriss. In der eigenen Werkzeugzeile zuerst **Linie** oder **Polylinie** sowie Farbe, Strichstärke und Strichart wählen.

- Linie: Anfangs- und Endpunkt anklicken; danach ist das neue Element ausgewählt.
- Polylinie: beliebig weitere, unterschiedliche Punkte anklicken; **Doppelklick am letzten Punkt** übernimmt alle Punkte als ein Element, ohne den Endpunkt doppelt einzufügen. Alternativ Enter bei fokussierter Zeichenfläche. Der Abschlussbutton entfällt. Ein geschlossener Umriss entsteht nur, wenn der letzte Punkt dem Anfangspunkt entspricht. Mindestens zwei Punkte, höchstens 10.000 Punkte.
- **Esc**, **Zeichnen abbrechen**, Werkzeug-/Ansichtswechsel oder Undo/Redo verwerfen einen unfertigen Entwurf. Ein Wechsel zwischen Linie und Polylinie verwirft ebenfalls den Entwurf.
- Snap (0,10 m) und Ortho gelten wie beim Wandzeichnen; Ortho bezieht sich jeweils auf den letzten Punkt.
- Klick auf den Linienzug oder Auswahl im Navigator zeigt ID, Länge, Punktanzahl und editierbaren Stil. Farbe aus der Palette, Strichstärke 0,05–2 mm und Durchgezogen/Gestrichelt/Abbruchlinie sind verfügbar. **Linienstil übernehmen** bestätigt die Änderung.

Koordinaten und Längen bleiben Meter. `penWidth` ist ausdrücklich eine Zeichenstiftbreite in Millimetern, keine geometrische Bauteilstärke. Die Bildschirmdarstellung verwendet 96 CSS-Pixel pro Zoll und nicht skalierende SVG-Striche; dies ist noch kein physisch kalibrierter Druckmaßstab. Abbruchlinien erhalten pro Segment eine dezente Zickzack-Unterbrechung in der Darstellung; die tatsächlichen End-/Stützpunkte bleiben unverändert.

Jedes Element hat eine global eindeutige, stabile ID. Linie und Polylinie teilen den Auswahltyp `line`. Die optionale Sammlung `storey.lines` erweitert das bestehende JSON-Format Version 1; alte Dateien ohne dieses Feld bleiben unverändert lesbar. Frühere App-Versionen ohne Linienunterstützung können Dateien mit diesem Feld nicht öffnen. JSON-Speichern/Laden und Undo/Redo enthalten Linien samt Stil; ein Polylinienabschluss ist eine einzelne Modelländerung.

Die Linien sind reine 2D-Zeichenelemente und erscheinen nicht als 3D-Körper. Der bisherige IFC-Export enthält weiterhin nur Wände/Fenster; die Oberfläche weist beim Export eines Projekts mit Linien auf deren Ausschluss hin. Linienbefehle, Endpunktgriffe, allgemeines Bewegen/Strecken und Löschwerkzeuge bleiben spätere Schritte. Die angeklickte Linien-ID ist bereits im gemeinsamen Auswahlkontext, aber Wand-/Fensterbefehle dürfen sie nicht verändern.

## Prüfung

Neun zusätzliche Tests decken Geometrie/Stile, Polylinienlänge, ungültige Punkte, globale IDs, alte/neue JSON-Dateien, Undo/Redo, Ansichtsausdehnung und Snap/Ortho, Abbruchdarstellung sowie den Ausschluss aus 3D/IFC und Wandbefehlen ab. Insgesamt 81 Tests, TypeScript, gezieltes ESLint und Produktionsbuild.

## Werkzeugeigenschaften

Die Linienvoreinstellungen sowie die Eigenschaften einer angeklickten Linie stehen jetzt in der festen Leiste **Werkzeugeigenschaften** unter der Hauptmenüleiste. Farbe, Strichstärke und Strichart dort einstellen und **Linienstil übernehmen** wählen. Dezimalkomma und Dezimalpunkt werden akzeptiert (z.B. 0,70 oder 0.70 mm); unvollständige oder ungültige Werte verändern das Modell nicht. Der Navigator dient nur der Auswahl/Projektstruktur. Das schwebende Elementmenü ist standardmäßig ausgeblendet und optional über die Toolbar verfügbar.
