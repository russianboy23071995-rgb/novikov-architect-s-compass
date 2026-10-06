# Automatische Wandanschluesse — Abnahme 05.10.2026

## Bedienung

1. Zwei gleich hohe und gleich starke Waende rechtwinklig zeichnen. Ein Achsende
   muss genau auf dem Achsende der anderen Wand einrasten. SNAP einschalten.
2. Alternativ eine bestehende Wand ueber ihren Achsgriff und das On-Demand-Menue
   bewegen. Beim Zusammenfuehren entstehen passende Wandkoerper ohne Dialog.
3. Die Eigenschaften melden "Wandanschluss aktiv". Grundriss und 3D vergleichen.
4. Eine Wand wegbewegen: beide betroffenen Enden werden gerade. Undo stellt den
   Anschluss zusammen mit der alten Position wieder her; Redo loest ihn erneut.
5. Projekt speichern/laden und normal ueber Export IFC ausgeben.

Reproduzierbares numerisches Beispiel: A (0,0)–(3,0), B (4,0)–(4,3), jeweils
0,36 m stark, 2,80 m hoch, Koerperversatz +0,18 m. B ueber Element frei bewegen
um 1 m bei 180 Grad verschieben. A-Ende und B-Anfang liegen danach auf (3,0).
Fenster je 1,20 x 1,35 m, Bruestung 0,90 m, Position 0,5 bleiben ausgeschnitten.

## Gespeicherter Zustand und Grenzen

Schema 6 speichert Wand-ID/Achsende-Paare, keine zweite Koerperkopie. Versionen
1–5 bleiben ladbar und werden ohne neue Verbindungen migriert. Reines Laden,
Hoehenaendern oder ein unveraendertes altes Achsende erzeugt keine neue Beziehung.
Koordinatenkontakt ist exakt; Zoomen oder bloss nahe Punkte erzeugen keinen Join.
Die bestehende Fangengine liefert die exakten Zielpunkte.

Nur rechtwinklige Paare gleicher Hoehe/Staerke; beide Wandenden duerfen je einen
Partner haben. T-/Mehrfachanschluesse, spitze Winkel und unterschiedliche Staerken
sind noch nicht implementiert. Kontakt mit der Mitte einer Achse verbindet nicht.
Ungeeigneter Endkontakt wird mit Meldung abgewiesen. Die physische Geometrie
bleibt erhalten, wenn ein Nachbar nur ausgeblendet wird.

Fensterkontakt mit der schraegen Endbegrenzung ist gemaess Nutzerentscheidung
unzulässig; keine erfundenen pauschalen Mindestabstaende. Fenster in der Mitte
und bestaetigte bestehende Oeffnungsregeln bleiben erhalten. Eine einzelne
Eigenschaftsaenderung, welche die Gleichheit von Hoehe/Staerke verletzt, wird
zunaechst abgewiesen. Gemeinsam eine Ecke bzw. eine Wandgruppe bearbeiten ist
noch ein eigener Auftrag. Zum Bearbeiten einer verbundenen Wand bleiben ihre
Achsgriffe aktiv; abgeleitete Gehrungsecken sind Fangziele, keine freien Griffe.

## Nachweise

458 Tests bestanden. Neue Tests sichern automatische Erstellung/Bewegung,
atomare History, Loesen, Vier-Wand-Ring, Fensterkontakt, Mehrdeutigkeit,
Altdateien/ungueltige Relationen, Sichtbarkeit und abgeleitete Fangkonturen.
Browserabnahme umfasst 1-m-Bewegung, 2D/3D, Undo/Redo und Loesen/Wiederherstellen.

Mit Node (TypeScript stripping):

```powershell
node --experimental-strip-types scripts/generate-automatic-corner-fixtures.mjs <ausgabeordner>
python scripts/validate-ifc.py <ausgabeordner>
```

Generator erzeugt start.project.json, zwei verbundene Projektdateien und deren
regulaere IFC-Exporte samt Erwartungsdaten. Unabhaengige Pruefung mit
IfcOpenShell 0.8.5: IFC4/EXPRESS, Host/Oeffnungsbeziehungen, Weltplatzierungen und
Nettovolumina fuer Ecke und geschlossenen Grundriss bestanden. Der neue reguläre
Export muss noch in Archicad praktisch abgenommen werden; die fruehere Abnahme
des expliziten Eck-Testexports bleibt als separater Nachweis bestehen.
