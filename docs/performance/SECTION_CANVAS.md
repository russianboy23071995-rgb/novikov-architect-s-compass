# Schnitte und Ansichten als Canvas (03.11.2026)

Folgeschritt zu docs/performance/SECTION_ZOOM.md. Nach den Schritten 1–3 ruckelte die Südansicht des Gesamtmodells mit 20 000 Elementen noch: 272 ms je Zoomschritt, davon 127 ms reines Rastern von 75 000 SVG-Elementen. Freigabe der Änderungskarte durch den Nutzer am 03.11.2026.

## Umsetzung

- **Zeichnen auf Canvas** (`components/cad/section-canvas.ts`, `SectionCanvas.tsx`): Im Schnitt-Tab liegt die Zeichnung auf einem `<canvas>`. Inhalt und Reihenfolge entsprechen `SectionGraphic`:
  1. Flächen der Ansicht, vom fernsten zum nächsten, mit Hintergrund, Kanten und gestrichelten Markierungen,
  2. Geschosslinien,
  3. geschnittene Bauteile mit Schnittfüllung,
  4. Wandschichten mit Diagonal-, Kreuz-, Punkt- und Dämmschraffur, beschnitten auf den Umriss,
  5. Rand.

  Linienbreiten und Strichmuster gelten in Bildschirmpixeln wie die `non-scaling-stroke` des SVG. Die Farben kommen aus denselben CSS-Variablen; ein Wechsel zwischen Hell und Dunkel zeichnet neu.

- **Zoomen über ein fertiges Bild:** Während Mausrad oder Ziehen wird das zuletzt scharf gezeichnete Bild nur verschoben und skaliert (`imagePlacement`). 120 ms nach dem letzten Schritt wird die Zeichnung scharf nachgezeichnet. Bei einer geänderten Zeichnung, Füllung, Auswahl, Größe oder Farbgebung wird sofort scharf gezeichnet.
- **Bedienebene bleibt SVG:** Darüber liegt das SVG mit demselben Bildausschnitt. Es enthält die Höhenkoten (setzen, auswählen, verschieben), Fang und Vorschau sowie die Geschosskoten mit Namen (`SectionLevelMarks`). Es hat 52 statt bis zu 97 000 Elemente.
- **Layouts und PDF bleiben SVG:** Ein auf dem Layout platzierter Schnitt und der PDF-Export nutzen weiter `SectionGraphic`.
- **Abnahmelauf des Schulmodells:** Er erkennt den geöffneten Schnitt jetzt am scharf gezeichneten Canvas (`data-sharp="1"`) statt an `g[data-element-id]`.

## Ergebnis (Browser, Gesamtmodell)

Rohdaten: `section-canvas/browser.json`. Die Werte „vor PR614“ und „nach PR614“ stammen aus `section-zoom/browser.json`.

**Zoomen beim großen Modell (20 000 Elemente)**

| Ansicht     | vor PR614        | nach PR614     | Canvas: Bildabstand beim Zoomen | Canvas: bis scharf |
| ----------- | ---------------- | -------------- | ------------------------------- | ------------------ |
| Südansicht  | 1 362 ms/Schritt | 272 ms/Schritt | 7 ms, höchstens 14 ms           | 174–246 ms         |
| Schnitt A-A | 209 ms/Schritt   | 20 ms/Schritt  | 7 ms, höchstens 7 ms            | 133–141 ms         |

- **Bildabstand:** Gemessen über 24 durchgehende Mausrad-Schritte im Abstand von 16, 40 und 80 ms. 7 ms ist ein Bild auf dem 144-Hz-Bildschirm des Messrechners.
- **Bis scharf:** Zeit vom letzten Schritt bis zum scharfen Bild, einschließlich der 120 ms Pause. Das scharfe Zeichnen selbst dauert also etwa 15–125 ms. Ein Wechsel zwischen Hell und Dunkel zeichnet in etwa 140 ms neu.
- **Einzelschritte mit 150 ms Pause:** Bei 20 000 Elementen ergibt die Methode aus SECTION_ZOOM.md 114 ms. Das liegt an der Methode selbst: Die Pause ist länger als die 120 ms bis zum scharfen Nachzeichnen, der nächste Schritt wartet deshalb auf das Nachzeichnen. Bei durchgehendem Zoomen tritt das nicht auf.

**Zoomen beim kleinen Modell (3 000 Elemente), Einzelschritte**

| Ansicht     | vor PR614 | nach PR614 | Canvas |
| ----------- | --------- | ---------- | ------ |
| Südansicht  | 197 ms    | 20–22 ms   | 13 ms  |
| Schnitt A-A | 36 ms     | 10–14 ms   | 10 ms  |

**Öffnen**

| Modell und Ansicht | vor PR614 | nach PR614 | Canvas   |
| ------------------ | --------- | ---------- | -------- |
| 20 000, Südansicht | 4 452 ms  | 2 540 ms   | 1 404 ms |
| 3 000, Südansicht  | 745 ms    | 603 ms     | 423 ms   |

## Nachweis

- **Bildvergleich im Browser** (Gesamtmodell 3 000, hell und dunkel): Das SVG des alten Stands wurde mit aufgelösten Farben als Bild gerastert. Verglichen wurde es mit Canvas plus SVG-Ebene des neuen Stands, jeweils mit gleichem Ausschnitt.

  | Ansicht                                            | Ausschnitte            | abweichende Pixel (Kanal > 32)                                 |
  | -------------------------------------------------- | ---------------------- | -------------------------------------------------------------- |
  | Südansicht                                         | eingepasst, eingezoomt | 0                                                              |
  | Schnitt A-A                                        | eingepasst, eingezoomt | 0                                                              |
  | Schnitt D-D                                        | eingepasst             | 0                                                              |
  | Schnitt D-D, Wand mit Punkt- und Diagonalschraffur | eingezoomt             | 70 von 507 944, keines über 128 (Kantenglättung der Schraffur) |

  Gegenprobe: Ohne SVG-Ebene weichen 336 Pixel ab, weil die Geschosskoten fehlen. Der Vergleich erkennt also Unterschiede.

- **Weitere Proben im Browser:**
  - Verschieben mit der Maus, danach ist die Ansicht wieder scharf.
  - Eine im Grundriss ausgewählte Wand erscheint in der Südansicht türkis, ohne Auswahl wieder nicht.
- **`benchmarks/section-canvas.test.ts`:**
  - Platzierung des Bildausschnitts wie `xMidYMid meet`, Verschieben und Skalieren des Bildes beim Zoomen und Verschieben.
  - Für alle Schnitte und Ansichten des Gesamtmodells mit einem aufzeichnenden Zeichenkontext: Anzahl und Reihenfolge der Striche und Füllungen, eine Bewegung je Kante, Linienbreiten und Strichmuster mal Pixelverhältnis, Auswahlfarbe, Beschneidung der geschichteten Wände.
- **Prüfungen:**
  - 1548 Tests grün,
  - Typprüfung, Lint, Architekturprüfung ohne Befund,
  - 14-Modell-Hash `e42aa36e…` unverändert.

## Grenzen

- **Nur ein Rechner:** ein Rechner mit Chromium und 144-Hz-Bildschirm, Entwicklungsserver, je Messung ein Lauf.
- **Im Bildvergleich nicht abgedeckt:** Kreuz- und Dämmschraffur, Fensterrahmen und Glas im Schnitt sowie offene Schnittkanten kommen im Gesamtmodell nicht vor. Sie sind nach `SectionLayerGraphic` und `SectionGraphic` nachgebaut, aber weder im Bild noch einzeln im Test geprüft.
- **Unschärfe beim Zoomen:** Während des Zoomens ist das Bild kurz unscharf. Beim Verschieben über den Bildrand hinaus bleibt der neue Rand bis zum Nachzeichnen leer.
- **Nachzeichnen bei 20 000 Elementen:** Nach dem Loslassen kostet das scharfe Nachzeichnen bis etwa 125 ms. Das ist ein einzelnes Stocken, kein Ruckeln während des Zoomens.
- **Das Vergleichsskript wurde nicht aufbewahrt:** Das Skript für den Bildvergleich lief nur vorübergehend im Browser. Methode und Ergebnisse stehen in `section-canvas/browser.json`.
- **Beobachtung ohne Bezug zur Änderung:** Escape hob im Grundriss die Auswahl einer Wand nicht auf. Der Fokus lag danach auf dem Wandelement. Den Grundriss betrifft diese Änderung nicht; nicht weiter untersucht.
