# Novikov Architect's Compass

# NOVIKOV CAD – Professional Architecture CAD Interface

Erstelle die erste vollständige Benutzeroberfläche für **NOVIKOV CAD**, ein modernes professionelles 2D-/3D-CAD- und zukünftiges BIM-Programm für Architektur.

## Designrichtung

Orientiere dich konsequent am bestehenden **NOVIKOV Glass Flow** Design-System.

Die Oberfläche soll hochwertig, minimalistisch, technisch und professionell wirken. Verwende eine moderne Glassmorphism-Ästhetik mit:

- dunklem, neutralem Grundlayout
- halbtransparenten Panels
- subtilen Blur- und Glass-Effekten
- feinen Konturen und Trennlinien
- moderaten Rundungen
- klarer Typografie
- sehr reduzierten Schatten
- ruhigen Hover- und Auswahlzuständen
- hoher Informationsdichte ohne visuelle Überladung

Das Programm soll wie ein professionelles Architekturwerkzeug wirken – nicht wie ein generisches SaaS-Dashboard.

Die zentrale Arbeitsfläche muss immer visuell dominant bleiben.

---

# 1. Grundlayout

Die Anwendung besteht aus fünf zentralen Bereichen:

**Top Toolbar**
Obere horizontale Menü- und Werkzeugleiste.

**Left Tool Rail**
Vertikale Werkzeugleiste für Modellierungs- und Zeichenwerkzeuge.

**Central Workspace**
Großer CAD-/3D-Arbeitsbereich.

**Right Project Navigator**
Projekt-, Modell- und Ansichtsverwaltung.

**AI Command Interface**
Globale KI- und Sprachsteuerung für sämtliche CAD-Funktionen.

Alle Panels sollen später ein- und ausblendbar sowie in ihrer Breite anpassbar sein.

---

# 2. Central CAD Workspace

Der größte Teil des Bildschirms gehört dem zentralen CAD-Viewport.

Dieser Bereich stellt später das Architekturmodell in 2D und 3D dar.

Für den ersten UI-Prototyp genügt ein visueller Placeholder-Viewport mit:

- dezentem CAD-Raster
- Koordinatenachsen
- View Cube oben rechts
- Zoom-/Orbit-/Pan-Steuerung
- Anzeige des aktuellen Maßstabs
- Anzeige der aktiven Ansicht
- Umschaltung zwischen 2D und 3D
- Fullscreen-Viewport-Funktion

Beispiel für die Statusanzeige:

`3D Perspective · Level 01 · 1:100`

Der Viewport soll möglichst wenig durch UI-Elemente verdeckt werden.

---

# 3. Flexible Multi-Viewport-Funktion

Das zentrale Fenster muss perspektivisch in mehrere Ansichten aufgeteilt werden können.

Erstelle bereits die UI für folgende Layouts:

- Single View
- 2 Views horizontal
- 2 Views vertikal
- 3 Views
- 4 Views

Dadurch kann beispielsweise gleichzeitig angezeigt werden:

- Grundriss
- Vorderansicht
- Seitenansicht
- 3D-Perspektive

Jeder Viewport besitzt eine kleine eigene View-Control-Leiste.

Die einzelnen Viewports sollen später unabhängig voneinander navigierbar sein.

---

# 4. Left Tool Rail

Auf der linken Seite befindet sich eine kompakte vertikale CAD-Werkzeugleiste.

Erstelle zunächst folgende Werkzeuge:

**Select**
Normales Auswahlwerkzeug.

**Wall**
Wände zeichnen und bearbeiten.

**Slab**
Decken bzw. Bodenplatten erstellen.

**Line**
2D-Linien zeichnen.

Weitere Werkzeuge werden später ergänzt.

Verwende zunächst klare Icons mit Tooltips.

Beim Auswählen eines Werkzeugs soll der aktive Zustand deutlich sichtbar sein.

Plane die Architektur der Toolbar so, dass später problemlos weitere Werkzeuge wie Fenster, Türen, Treppen, Dächer, Räume, Stützen, Bemaßung und Annotationen ergänzt werden können.

---

# 5. Context Tool Options

Wenn ein Werkzeug ausgewählt wird, sollen dessen Einstellungen nicht die linke Toolbar überladen.

Erstelle dafür einen kontextabhängigen Bereich in der oberen Toolbar oder als kleines Glass-Panel.

Beispiel bei aktivem Wall Tool:

`Wall | Thickness 240 mm | Height 2.80 m | Material | Alignment`

Diese Einstellungen ändern sich abhängig vom ausgewählten Werkzeug oder Objekt.

---

# 6. Right Project Navigator

Auf der rechten Seite befindet sich der Projekt-Navigator.

Er soll eine professionelle Baumstruktur besitzen.

Hauptbereiche:

**Project**
- Project Information
- Site

**Building Structure**
- Building
- Levels
- Level 00
- Level 01
- Level 02

**Views**
- Floor Plans
- Elevations
- Sections
- 3D Views

**Saved Views**
- frei speicherbare Ansichten

**Sheets**
- zukünftige Planlayouts

Die Struktur soll auf- und zuklappbar sein.

Elemente können ausgewählt werden und erhalten einen klaren aktiven Zustand.

Das Panel soll später für große Architekturprojekte mit sehr vielen Geschossen, Ansichten und Schnitten skalierbar sein.

---

# 7. Top Toolbar

Die obere Werkzeugleiste enthält zunächst:

links:
- NOVIKOV CAD Logo / Wordmark
- Project Name

mittig:
- Undo
- Redo
- Save
- View Controls
- 2D / 3D Toggle
- Viewport Layout
- Snap
- Grid

rechts:
- AI
- Voice
- Settings
- User/Profile

Zusätzlich kann eine klassische Menüstruktur vorgesehen werden:

`File · Edit · View · Insert · Modify · Tools`

Die Toolbar soll bewusst kompakt bleiben.

---

# 8. AI-Native CAD Interaction

NOVIKOV CAD soll nicht nur mit Maus und Tastatur bedient werden.

**Jedes relevante Werkzeug muss perspektivisch auch über natürliche Sprache und Spracheingabe steuerbar sein.**

Die KI ist deshalb kein separater Chatbot, sondern Bestandteil des gesamten Bedienkonzepts.

Erstelle am unteren Rand des Viewports eine schwebende, elegante **AI Command Bar**.

Default-Zustand:

`Ask NOVIKOV or enter a command…`

Daneben:

- Mikrofon
- AI-Icon
- Command-Icon

Die Command Bar soll sowohl Texteingabe als auch Spracheingabe unterstützen.

Beispiele zukünftiger Befehle:

`Draw a 24 cm wall from this point to the next grid line.`

`Create a wall 5 meters long.`

`Insert a 1.20 m window into this wall.`

`Show Level 02 as floor plan.`

`Split the workspace into floor plan, elevation and 3D view.`

`Select all exterior walls.`

---

# 9. Voice Interaction State

Wenn Spracheingabe aktiviert wird, soll sich die AI Command Bar visuell verändern.

Zeige:

- animierte Audio-Waveform
- Listening State
- erkannte Sprache als Live-Text
- Cancel
- Execute

Beispiel:

**Listening…**

`Create a wall five meters long…`

Nach Erkennung soll der Befehl zunächst als strukturierte Aktion angezeigt werden.

Beispiel:

**AI interpreted command**

`Create Wall`

Length: `5.00 m`  
Thickness: `240 mm`  
Height: `2.80 m`

Buttons:

`Execute`
`Modify`
`Cancel`

Bei destruktiven oder größeren Aktionen soll die KI niemals unsichtbar Änderungen durchführen, sondern eine verständliche Vorschau bzw. Bestätigung ermöglichen.

---

# 10. AI Context Awareness

Die AI Command Bar soll visuell zeigen können, worauf sich ein Befehl bezieht.

Beispiele:

`Context: Wall #W-104`

oder

`Context: Level 01`

oder

`Context: 3 selected objects`

Dadurch kann der Benutzer Befehle geben wie:

`Make this wall 30 cm thick.`

`Move these objects to Level 02.`

`Create the same windows on the opposite wall.`

Die UI muss deshalb Auswahlzustände und AI-Kontext klar miteinander verbinden.

---

# 11. Bottom Status Bar

Am unteren Bildschirmrand befindet sich zusätzlich eine sehr kompakte CAD-Statusleiste.

Informationen und Controls:

- Cursor Coordinates X / Y / Z
- Units
- Scale
- Grid
- Snap
- Ortho
- Selection Count
- Current Level

Beispiel:

`X 12.450 · Y 8.320 · Z 0.000 | mm | Grid 100 | Snap ON | Level 01`

---

# 12. Interaction Principles

Die Oberfläche muss folgende Prinzipien erfüllen:

**Viewport First**
Das Architekturmodell ist immer das wichtigste Element.

**Progressive Disclosure**
Komplexe Einstellungen erscheinen nur, wenn sie benötigt werden.

**AI + Manual Control**
Jede wichtige Aktion soll langfristig sowohl klassisch mit Maus/Tastatur als auch über AI/Voice möglich sein.

**Professional Density**
Keine übergroßen Dashboard-Komponenten. Die UI soll für stundenlange professionelle CAD-Arbeit geeignet sein.

**Scalable Architecture**
Werkzeuge, BIM-Funktionen, Properties, Libraries und weitere Panels müssen später ergänzt werden können, ohne das Grundlayout neu bauen zu müssen.

---

# 13. First Prototype Scope

Implementiere zunächst ausschließlich das Frontend und die Interaktionen der Benutzeroberfläche.

Keine echte CAD-Geometrie oder BIM-Engine implementieren.

Für Funktionen, die später vom CAD-Core übernommen werden, Mock-Daten und Placeholder-Aktionen verwenden.

Der erste Prototyp soll bereits klickbar sein.

Implementiere insbesondere:

- Tool-Auswahl
- ein-/ausklappbare Panels
- Project Navigator
- 2D/3D Toggle
- Multi-Viewport Layout Switcher
- AI Command Bar
- Voice Listening State als UI-Simulation
- AI Command Preview
- aktive Auswahlzustände
- Tooltips
- Hover States
- Resizable Side Panels

Das Ergebnis soll sich bereits wie die Oberfläche einer echten professionellen Architektur-CAD-Anwendung anfühlen, obwohl die eigentliche CAD-Engine noch nicht integriert ist.

---

# Product Identity

Produktname:

**NOVIKOV CAD**

Design System:

**NOVIKOV Glass Flow**

Positionierung:

**AI-native professional architecture CAD workspace**

Die Oberfläche soll vermitteln, dass klassische präzise CAD-Modellierung und moderne natürliche Sprachsteuerung gleichberechtigte Bedienformen desselben Systems sind.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/1d198a03-5a0f-44d4-9270-51836d931b1e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
