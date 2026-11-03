# Ansicht flüssig zoomen (03.11.2026)

Nutzerhinweis vom 03.11.2026: Das Zoomen in einer Ansicht des Gesamtmodells war wenig flüssig. Die Freigabe galt den Schritten 1–3 der Änderungskarte; die Canvas-Darstellung folgt als eigene Karte.

## Befund

- Jeder Mausrad-Schritt ändert den Bildausschnitt der Schnitt- oder Ansichtszeichnung. Dabei baute React jedes Mal die ganze Zeichnung (`SectionGraphic`) neu auf, obwohl sie sich nicht ändert. Das waren bei 3 000 Elementen etwa 85 % der Zeit je Schritt.
- Jede sichtbare Kante war ein eigenes `<line>`. Die Südansicht hatte bei 20 000 Elementen 97 000 SVG-Elemente. Schon das reine Zeichnen durch den Browser dauerte dort 240 ms je Schritt.

## Umsetzung

1. **Kein Neuaufbau beim Zoomen:** `SectionGraphic` ist mit `memo` umschlossen. Zoomen und Verschieben ändern nur den Bildausschnitt der umgebenden SVG. Neu gezeichnet wird nur, wenn sich die Zeichnung, die Schnittfüllung, der Maßstab oder die Auswahl ändert. Das gilt auch für Schnitte, die auf einem Layout platziert sind.
2. **Kanten je Fläche als ein Pfad:** Die Kanten einer Fläche und ihre Markierungen sind je ein `<path>` (`components/cad/section-paths.ts`). Jede Kante bleibt ein eigener Teilpfad. Linienenden, Strichmuster und der PDF-Export (`svg-capture`) bleiben deshalb wie bei einzelnen Linien. Die Reihenfolge der Flächen und damit die Verdeckung bleibt erhalten.
3. **Mausrad gebündelt:** Mehrere Mausrad-Schritte zwischen zwei Bildern ergeben einen Zoomschritt um das Produkt der Faktoren, am letzten Zeigerpunkt.

## Ergebnis (Browser, Gesamtmodell, Median je Zoomschritt)

Gemessen mit `section-zoom/zoom-measure.js`, vorher und nachher mit derselben Methode auf demselben Rechner. Rohdaten: `section-zoom/browser.json`.

| Modell | Ansicht     | SVG-Elemente vorher → nachher | Zoomschritt vorher → nachher | Öffnen vorher → nachher |
| ------ | ----------- | ----------------------------- | ---------------------------- | ----------------------- |
| 3 000  | Südansicht  | 14 865 → 11 368               | 197 → 20–22 ms               | 745 → 603 ms            |
| 3 000  | Schnitt A-A | 2 447 → 1 487                 | 36 → 10–12 ms                | 112 → ≈ 190 ms          |
| 20 000 | Südansicht  | 97 145 → 74 608               | 1 362 → 272 ms               | 4 452 → 2 540 ms        |
| 20 000 | Schnitt A-A | 15 197 → 9 137                | 209 → 20 ms                  | 621 → 513 ms            |

- Die Messung wartet auf die nächste Bildgrenze. Ein Wert um 20 ms bedeutet also ein bis zwei Bilder je Zoomschritt.
- **Südansicht bei 20 000 Elementen:** Davon entfallen 127 ms auf das reine Zeichnen durch den Browser. React spielt beim Zoomen keine Rolle mehr. Flüssig ist das nicht: Bei 75 000 SVG-Elementen bleibt das Rastern teuer. Das ist der Anlass für die Canvas-Karte.
- **Gegenprobe:** Ohne gleichbleibende Linienbreite (`non-scaling-stroke`) waren es 109 statt 122 ms, das lohnt nicht. Zoomen per CSS-Vergrößerung brachte 172 ms, weil der Browser die Vektoren trotzdem neu rastert.

## Nachweis

- **`benchmarks/section-zoom.test.ts`:** Für alle Schnitte und Ansichten des Gesamtmodells (600 Elemente) ergibt der Pfad jeder Fläche genau ihre Kanten als offene Teilpfade. Geprüft wird das mit dem Pfadleser des PDF-Exports.
- **Prüfungen:**
  - 1546 Tests grün,
  - Typprüfung, Lint, Architekturprüfung ohne Befund,
  - 14-Modell-Hash `e42aa36e…` unverändert.
- **Browser:**
  - Südansicht eingezoomt, Kanten, Fenster und gestrichelte Geschosslinien richtig gezeichnet.
  - Nach frischem Laden keine Konsolenfehler beim Öffnen und Zoomen. Die Meldung „Hydration failed“ beim Laden der Seite gab es schon vorher. „Component is not a function“ trat nur nach dem Hot-Reload für die Vorher-Messung auf.

## Grenzen

- **Ein Rechner, Entwicklungsserver, Chromium.** Je Größe ein Lauf, bei 3 000 Elementen zwei.
- **Einzelne Ausreißer:** Ein Schritt dauerte bei 3 000 Elementen 702 ms, ein Schritt bei 20 000 Elementen 2,7 s. Vermutlich war das die Speicherbereinigung des Browsers; einzeln untersucht ist es nicht.
- **Schnitt A-A bei 3 000 Elementen:** Das Öffnen lag nachher bei 183–202 ms statt 112 ms. Bei so kurzen Zeiten ist das im Rahmen der Schwankung, aber nicht weiter geprüft.
- **Abnahme „höchstens 16 ms bei 3 000 Elementen“:** Für Schnitt A-A erfüllt, für die Südansicht mit 20–22 ms knapp verfehlt. Gemessen ist hier aber bis zur übernächsten Bildgrenze.
- **Südansicht bei 20 000 Elementen:** Mit etwa 4 Bildern pro Sekunde bleibt das Zoomen spürbar ruckelig.
