# NOVIKOV CAD Frontend Prototype

## Ziel
Eine bildschirmfüllende, klickbare Architektur-CAD-Oberfläche im NOVIKOV Glass Flow Stil. Der CAD-Viewport bleibt visuell dominant; alle Fachfunktionen sind bewusst simuliert und ohne CAD-/BIM-Engine.

## Umsetzung

1. **Grundrahmen und Design-System**
   - Dunkle, neutrale Glass-Flow-Tokens für Flächen, Konturen, Akzente, Raster und Statuszustände definieren.
   - Kompakte Desktop-Arbeitsfläche mit Top Toolbar, Werkzeugleiste links, Viewport, Projekt-Navigator rechts und Statusleiste aufbauen.
   - Kleine Bildschirmgrößen sinnvoll abfangen: Seitenbereiche einklappbar, Kern-Viewport bleibt nutzbar.

2. **CAD-Arbeitsfläche**
   - Technischen Raster-Viewport mit Architektur-Grundriss als visuelle Mock-Szene, Achsen, Maßstabsanzeige, View Cube und Navigationskontrollen erstellen.
   - Umschaltung zwischen 2D und 3D sowie Fullscreen-Modus implementieren.
   - Fünf Layouts umsetzen: Einzelansicht, horizontal/vertikal geteilt, drei und vier Ansichten; jede Ansicht erhält eigene kompakte Controls.

3. **Werkzeuge und Kontextoptionen**
   - Select, Wall, Slab und Line als datengetriebene Werkzeugleiste mit Tooltips und klaren Aktivzuständen umsetzen.
   - Kontextleiste abhängig vom Werkzeug wechseln lassen, einschließlich Wall-Parametern wie Stärke, Höhe, Material und Ausrichtung.
   - Undo, Redo, Save, Grid, Snap sowie Menüs als klickbare Mock-Aktionen mit sichtbarem Feedback anlegen.

4. **Projekt-Navigator und Panels**
   - Skalierbare, auf- und zuklappbare Baumstruktur für Projekt, Gebäudestruktur, Ansichten, gespeicherte Ansichten und Pläne erstellen.
   - Auswahlzustände und aktive Ebene/Ansicht mit dem Viewport-Status verbinden.
   - Rechte Seitenleiste und Werkzeugbereich ein-/ausblendbar machen; Navigator per Drag vergrößerbar und verkleinerbar.

5. **AI Command Interface**
   - Schwebende Command Bar mit Eingabe, Kontextanzeige, Mikrofon- und Command-Steuerung bauen.
   - Voice Listening State mit animierter Waveform und Live-Text simulieren.
   - Eingegebene oder simulierte Sprachbefehle in eine strukturierte Aktionsvorschau überführen; Execute, Modify und Cancel als sichere Bestätigungsschritte umsetzen.
   - Keine echte KI-Anbindung und keine echte Spracheingabe in diesem Frontend-Prototyp.

6. **Status, Qualität und Prüfung**
   - Kompakte Statusleiste für Koordinaten, Einheit, Maßstab, Grid, Snap, Ortho, Auswahl und Ebene ergänzen.
   - Seitentitel und Social-Metadaten auf NOVIKOV CAD setzen.
   - Desktop- und schmale Bildschirmansicht im Browser prüfen, Kerninteraktionen durchklicken und sichtbare Überlagerungen oder Fehler korrigieren.

## Technische Details
- React-Komponenten werden nach Toolbar, Werkzeugen, Viewport, Projektbaum, AI-Steuerung und Statusleiste getrennt.
- Zustände bleiben lokal im Frontend und werden über strukturierte Konfigurationen gesteuert, damit spätere Werkzeuge und Panels ergänzt werden können.
- Die vorhandenen Icon-, Tooltip- und Resizable-Panel-Bibliotheken werden genutzt; es wird kein Backend aktiviert.
- Ein dezenter, CSS-basierter Architekturplan ersetzt echte Geometrie und hält den Prototyp leicht und sofort interaktiv.
