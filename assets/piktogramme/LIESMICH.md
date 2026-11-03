# Piktogramme – Navigator und Werkzeuge

28 Piktogramme (5 Navigator, 23 Werkzeuge) im 24-px-Raster, je in zwei Zuständen:

- **inaktiv** – Linie mit heller Duoton-Fläche
- **aktiv** – Fläche voll gefüllt, Innenlinien ausgespart

## Ordner

| Ordner | Inhalt |
|---|---|
| `svg/currentColor/` | Farbe kommt aus der Anwendung (`color` bzw. Theme). **Empfohlen für die Software.** |
| `svg/hell/` | Feste Farben für helle Oberflächen (aus `farben.json`) |
| `svg/dunkel/` | Feste Farben für dunkle Oberflächen (aus `farben.json`) |
| `css/piktogramme.css` | CSS-Variablen für inline eingebettete SVGs |
| `vorschau.html` | Alle Dateien auf einen Blick, im Browser öffnen |
| `src/` | Quellzeichnungen, nur zum Weiterbearbeiten |
| `erzeugen.py`, `farben.json` | Erzeugen alle Dateien neu |

Jeder dieser Ordner enthält `inaktiv/` und `aktiv/` mit den Unterordnern `navigator/` und `werkzeuge/`. Die Dateinamen sind in beiden Zuständen gleich.

## Farben ändern

1. `farben.json` in einem Texteditor öffnen und die Werte ändern (Format `#RRGGBB`):

   ```json
   {
     "hell":   { "linie": "#1D2125", "aktiv": "#42D9DF" },
     "dunkel": { "linie": "#E6E8EB", "aktiv": "#42D9DF" },
     "duoton_deckkraft": 0.2,
     "strichstaerke": 1.25,
     "eckenradius": 1.0
   }
   ```

   - `linie` – Farbe der Piktogramme im inaktiven Zustand
   - `aktiv` – Farbe im aktiven/ausgewählten Zustand
   - `duoton_deckkraft` – Deckkraft der hellen Fläche im inaktiven Zustand (0 bis 1)
   - `strichstaerke`, `eckenradius` – in Pixeln bei 24 px Darstellungsgröße

2. Im Paketordner ausführen (Windows):

   ```
   py -3 erzeugen.py
   ```

   macOS/Linux: `python3 erzeugen.py`. Nötig ist nur Python 3, keine Zusatzpakete.

3. Alle Dateien in `svg/` und `css/` sowie `vorschau.html` werden neu erzeugt. Von Hand geänderte Dateien in `svg/` werden dabei überschrieben.

**Hinweis zum Türkis `#42D9DF` im hellen Theme:** Auf Weiß hat es nur etwa 1,7 : 1 Kontrast. Für kleine Icons ist ein dunklerer Ton wie `#0E9AA0` besser lesbar. Dazu genügt es, `hell.aktiv` zu ändern.

## Farbe direkt in der Software steuern (ohne neu zu erzeugen)

Die Dateien in `svg/currentColor/` haben keine feste Farbe. Sie übernehmen die Textfarbe des umgebenden Elements:

```html
<link rel="stylesheet" href="css/piktogramme.css">
<span class="is-active"><!-- Inhalt von svg/currentColor/aktiv/werkzeuge/wand.svg mit class="pikto" --></span>
```

```css
:root { --pikto-aktiv: #42D9DF; }   /* z. B. aus CAD_TURQUOISE */
```

- `--pikto-linie`, `--pikto-aktiv` und `--pikto-duoton` lassen sich jederzeit überschreiben, auch zur Laufzeit.
- Die Duoton-Fläche hat `class="accent"` (inaktiv) bzw. `class="accent-voll"` (aktiv) und lässt sich per CSS getrennt einfärben.

## Technische Hinweise

- Die Aussparungen der Aktiv-Version sind als SVG-`<mask>` umgesetzt. Browser, Electron und die meisten SVG-Bibliotheken unterstützen das, **Qt SVG nicht**. Dort bitte maskenfreie Dateien anfordern.
- Raster `viewBox="0 0 24 24"`, Arbeitsfläche 4–20, Strich 1,25 px, runde Enden und Ecken. Bauteile sind isometrisch gezeichnet, Navigator und Zeichenwerkzeuge in 2D.
- Neue Piktogramme: Quelldatei in `src/` anlegen (Arbeitsfläche 3–21), den Namen in `erzeugen.py` unter `GROUPS` eintragen und neu erzeugen. `class="accent"` markiert die Duoton-Fläche, `data-knock="1"` eine Linie, die im aktiven Zustand ausgespart wird.
