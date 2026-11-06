# PDF-Export von Layouts und Planköpfen

Nutzerauftrag 02.11.2026: „erstelle einen PDF export“. Anlass war die Frage, wie sich prüfen lässt, ob das Layoutbuch die Zeichnungen korrekt skaliert. Im PDF misst man mit dem Messwerkzeug des PDF-Programms nach, unabhängig von Bildschirm und Windows-Skalierung.

Entscheidungen (Empfehlungen übernommen): eigener PDF-Schreiber ohne neues Paket (kein Download); Strichstärken wie bei 100 % am Bildschirm (1 Bildschirmpixel = 0,75 pt = 0,26 mm); Schrift Helvetica (in jedem PDF-Programm eingebaut); Bildreferenzen und mehrere Blätter in einer Datei später (PDF2). Reihenfolge auf Wunsch: PDF1 vor dem Abschluss von ZW3.

## PDF1 – Layout als PDF

- **Bedienung:** „PDF exportieren“ in der Leiste eines Layouts, Masterlayouts oder Plankopfs; „Als PDF exportieren“ im Rechtsklickmenü der Layoutsammlung (Layouts, Masterlayouts, Planköpfe). Aus dem Menü wird das Blatt erst geöffnet. Der Browser lädt „Name.pdf“ herunter; die Meldung nennt Dateiname und Papiergröße.
- **Seite:** eine Seite in exakter Papiergröße (A3 quer = 420 × 297 mm = 1190,55 × 841,89 pt), Ursprung unten links am Papier.
- **Inhalt:** alles, was auf dem Papier liegt: eigene Linien, Texte und Schraffuren des Blatts, Zeichnung und Plankopf des Masterlayouts (automatische Texte aufgelöst), platzierte Zeichnungen maßstäblich und auf ihre Maske beschnitten. Ausgeblendete Ebenen bleiben ausgeblendet.
- **Nicht im PDF:** Raster, graue Arbeitsfläche, gestrichelter Randrahmen, gestrichelter Maskenrahmen der Zeichnungen, Auswahl, Griffe, Fangmarken, Vorschauen (Elemente mit `data-export="skip"` und Entwürfe). Bilder stehen seit P3 im PDF.
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

Grenzen: Das PDF selbst im PDF-Programm geöffnet hat im Test niemand; geprüft wurden die Bytes der Datei.

## L14 – Prüfung und Ausbau (06.11.2026)

Die Anpassungsliste führte L14 als offen, der Export gab es aber seit PDF1. Offen waren nur die Lücken unten.

### P1 – Prüfung mit den neuen Funktionen

Layout A3 quer mit Wand, Sofa, Doppelbett und Gelände exportiert: Seite 1190,55 × 841,89 pt, Wandfüllung deckend, Geländefarbe da, Höhenkote „+0,00“ als Helvetica-Text. Kein Fehler, nichts zu ändern.

### P2 – Stiftstärken in mm

Die Zeichnungen nennen ihren Stift mit `data-pen`, `src/interop/pdf/pens.ts` legt fest, wie viele Millimeter ein Bildschirmpixel dieses Stifts auf dem Papier ergibt. Am Bildschirm ändert sich nichts.

| Stift     | Gilt für                                                            | mm je Pixel |
| --------- | ------------------------------------------------------------------- | ----------- |
| `cut`     | Wände, Stützen                                                      | 0,50        |
| `view`    | Decken, Deckenöffnungen, Dächer                                     | 0,25        |
| `symbol`  | Objekte, Treppen, Geländer, Dachfenster, Bemaßung                   | 0,18        |
| `fine`    | Gelände                                                             | 0,13        |
| `section` | Schnitte und Ansichten; die Schnittkante mit 1,75 px ergibt 0,50 mm | 0,286       |

Verhältnisse innerhalb einer Grafik bleiben, eine Hilfslinie mit 0,8 px im Objekt ergibt 0,144 mm. Eigene Linien haben schon ihre Stiftbreite in mm und tragen keinen Stift. Strichmuster bleiben unverändert.

Nachweis im Browser, Layout A3 mit Wand, Möbeln und Gelände: Wandkontur 1,417 pt = 0,50 mm, Höhenlinien 0,369 pt = 0,13 mm, Möbellinien 0,408 pt = 0,144 mm.

### P3 – Bilder im PDF

Eingefügte Bilder stehen jetzt im PDF, an ihrer Stelle, in ihrer Größe, Drehung und Deckkraft und in der Reihenfolge der Zeichnung. `src/interop/pdf/svg-images.ts` lädt jedes Bild des Blatts und legt es als JPEG (Qualität 90) ab, `pdf-writer.ts` schreibt es als Bildobjekt in Hexziffern, die Datei bleibt ASCII. Dasselbe Bild steht nur einmal in der Datei.

- **Auflösung:** 200 dpi auf dem Papier, längste Seite höchstens 4000 Pixel, nie mehr als das Original.
- **Transparenz:** JPEG kennt keine; durchsichtige Stellen einer PNG werden weiß und decken, was darunter liegt.
- **Bild lädt nicht:** Das PDF entsteht trotzdem, die Meldung nennt die Zahl der fehlenden Bilder.

Nachweis im Browser, Layout A3 1:100 mit Bild 64 × 48 Pixel zu 0,05 m je Pixel: Größe 90,71 × 68,03 pt = 32 × 24 mm, also genau 3,2 × 2,4 m im Maßstab; Lage 160 mm vom linken Rand wie gerechnet; die vier Farbfelder liegen im JPEG wie am Bildschirm.

### P4 – Mehrere Blätter in einem PDF

Rechtsklick auf die Layoutsammlung oder einen Ordner: „Layouts als ein PDF exportieren (n)“. Das PDF heißt wie der Ordner und enthält alle Layouts des Ordners und seiner Unterordner, in der Reihenfolge des Navigators: erst die Unterordner, dann die eigenen Layouts. Jede Seite behält ihre Papiergröße. Ohne Layout ist der Eintrag gesperrt.

Die Arbeitsfläche öffnet jedes Blatt kurz, aktualisiert es wenn nötig und nimmt es auf; danach steht wieder die Ansicht von vorher offen. Dasselbe Bild steht auch über mehrere Seiten nur einmal in der Datei. Masterlayouts und Planköpfe gehören nicht dazu, sie lassen sich einzeln exportieren.

Nachweis im Browser, Layoutsammlung mit EG und OG: eine Datei mit `/Count 2`, zwei Seiten A3 quer, ein Bildobjekt.

### P5 – Drucken

„Drucken“ steht in der Leiste von Layout und Plankopf, im Rechtsklickmenü der Blätter und als „Layouts drucken (n)“ am Ordner. Gedruckt wird dasselbe PDF wie beim Export, so bleibt das Papier maßhaltig, solange im Druckdialog 100 % oder „Tatsächliche Größe“ eingestellt ist. Das Programm gibt das PDF an den Druckdialog des Browsers (`src/interop/pdf/deliver.ts`); lässt ein Browser das nicht zu, öffnet es sich in einem eigenen Tab.

Nachweis im Browser: Knopf erzeugt das PDF, der Druckaufruf kommt nach dem Laden genau einmal, beim zweiten Druck wird das alte Druckfenster ersetzt, keine Konsolenfehler.

Grenze: Der Druckaufruf wurde im Test abgefangen. Der echte Druckdialog und ein Blatt auf Papier sind noch nicht geprüft, das geht nur am echten Drucker.
