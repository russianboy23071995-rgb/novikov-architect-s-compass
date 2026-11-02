# PDF-Export von Layouts und Planköpfen

Nutzerauftrag 02.11.2026: „erstelle einen PDF export“. Anlass war die Frage, wie sich prüfen lässt, ob das Layoutbuch die Zeichnungen korrekt skaliert. Im PDF misst man mit dem Messwerkzeug des PDF-Programms nach, unabhängig von Bildschirm und Windows-Skalierung.

Entscheidungen (Empfehlungen übernommen): eigener PDF-Schreiber ohne neues Paket (kein Download); Strichstärken wie bei 100 % am Bildschirm (1 Bildschirmpixel = 0,75 pt = 0,26 mm); Schrift Helvetica (in jedem PDF-Programm eingebaut); Bildreferenzen und mehrere Blätter in einer Datei später (PDF2). Reihenfolge auf Wunsch: PDF1 vor dem Abschluss von ZW3.

## PDF1 – Layout als PDF

- **Bedienung:** „PDF exportieren“ in der Leiste eines Layouts, Masterlayouts oder Plankopfs; „Als PDF exportieren“ im Rechtsklickmenü der Layoutsammlung (Layouts, Masterlayouts, Planköpfe). Aus dem Menü wird das Blatt erst geöffnet. Der Browser lädt „Name.pdf“ herunter; die Meldung nennt Dateiname und Papiergröße.
- **Seite:** eine Seite in exakter Papiergröße (A3 quer = 420 × 297 mm = 1190,55 × 841,89 pt), Ursprung unten links am Papier.
- **Inhalt:** alles, was auf dem Papier liegt: eigene Linien, Texte und Schraffuren des Blatts, Zeichnung und Plankopf des Masterlayouts (automatische Texte aufgelöst), platzierte Zeichnungen maßstäblich und auf ihre Maske beschnitten. Ausgeblendete Ebenen bleiben ausgeblendet.
- **Nicht im PDF:** Raster, graue Arbeitsfläche, gestrichelter Randrahmen, gestrichelter Maskenrahmen der Zeichnungen, Auswahl, Griffe, Fangmarken, Vorschauen (Elemente mit `data-export="skip"` und Entwürfe). Bildreferenzen fehlen noch; die Meldung nennt ihre Anzahl.
- **Wie es zeichnet:** Das Blatt wird einmal unsichtbar bei 100 % Papierzoom gezeichnet (ohne Auswahl und Entwürfe) und Element für Element übertragen: Linien, Polylinien, Polygone, Rechtecke, Kreise und Pfade (auch Bögen) als Vektoren; Flächen mit Deckkraft; Strichmuster; Beschnitt über `clipPath`; Schraffurmuster als echte PDF-Kachelmuster. Texte setzt es an die Stelle, die der Browser für das erste Zeichen berechnet; Umlaute und ß über WinAnsi. Die Helvetica ist etwas anders gesetzt als die Bildschirmschrift, zentrierte Texte können daher um Bruchteile eines Millimeters versetzt sein.
- **Code:** `src/interop/pdf/pdf-writer.ts` (PDF 1.4, unkomprimiert, ASCII), `src/interop/pdf/svg-path.ts` (Pfade und Matrizen), `src/interop/pdf/svg-capture.ts` (SVG → Seite), `CadViewport.tsx` (unsichtbares Blatt, `PdfRequest`), Bedienung in `CadWorkspace.tsx`, `LayoutBar.tsx`, `TitleBlockBar.tsx`, `LayoutNavigator.tsx`.

Nachweis PDF1: 1519 Tests grün (neu `pdf-writer.test.ts`: Seitengröße A3 in pt, 100-mm-Linie misst 100 mm, Strichmuster, Querverweistabelle trifft jedes Objekt, Streamlänge, WinAnsi mit ß/Ä/„“/€ und „?“ für Unbekanntes, Deckkraft, Beschnitt, Kachelmuster, gedrehter fetter Text; `svg-path.test.ts`: Pfade mit relativen Befehlen, Schließen, Viertel- und Halbkreisbögen, quadratische Kurven, Matrizen). Typprüfung, Architektur, Lint, Formatierung, 14-Modell-Prüfsumme unverändert.

Browser: 10-m-Wand im Grundriss, Abbild 1:100, Layout A3 quer, Zeichnung platziert, Text „Maßstab Prüfung“ aufs Layout. „PDF exportieren“ (Download für den Test im Browser abgefangen) ergab „Layout.pdf“:
- Seite 420,0 × 297,0 mm
- Wand 283,465 pt = **100,0 mm**, Wandstärke 3,6 mm, Fenster 12,0 mm
- Zeichnung beschnitten (ein Beschnittpfad)
- Text in Helvetica 2,5 mm mit korrektem ß und ü

„Als PDF exportieren“ steht im Rechtsklickmenü des Layouts.

Gefunden und behoben: Das Bildschirmfoto-Fenster der Testumgebung lässt `requestAnimationFrame` nicht laufen; der Export wartet deshalb mit einem Timer statt auf einen Animationsframe (läuft so auch in einem Hintergrund-Tab).

Grenzen: Strichstärken folgen dem Bildschirm (dünne Linien 0,26 mm), echte Stiftstärken in mm sind ein eigener Schritt. Das PDF selbst im PDF-Programm geöffnet hat im Test niemand; geprüft wurden die Bytes der Datei.
