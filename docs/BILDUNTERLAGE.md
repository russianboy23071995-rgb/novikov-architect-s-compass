# Bildunterlage (L23, Teil 1)

Stand: 07.11.2026. Ein Bestandsplan, ein Scan oder ein Foto (PNG oder JPEG) liegt als Unterlage im Grundriss, wird über eine bekannte Strecke kalibriert und nachgezeichnet. Grundlage seit PR160: Import, Platzieren, Zweipunkt-Kalibrierung (docs/references/IMAGE_REFERENCE_PLAN.md). L23 Teil 1 macht daraus ein Werkzeug für den Alltag.

PDF als Unterlage ist nicht enthalten: Es bräuchte das npm-Paket pdf.js, und das ist nur mit Zustimmung erlaubt. DXF und DWG sind ein eigener Block.

## B1 – Werkzeug Bildunterlage

Eigenes Werkzeug in der Werkzeugleiste, Gruppe 2D, nach „Zeichnung“, mit eigenem Piktogramm (Blatt mit Bild, dahinter ein zweites Blatt; `assets/piktogramme/*/werkzeuge/bildunterlage.svg`). „Insert → Bildreferenz importieren…“ wählt dasselbe Werkzeug.

- **Ablauf:** Werkzeug wählen, die Dateiauswahl öffnet sich sofort (PNG oder JPEG). Danach hängt das Bild halbtransparent am Cursor, ein Klick setzt seine linke obere Ecke, mit Fang. Danach ist wieder das Auswahlwerkzeug aktiv und die neue Unterlage gewählt. Esc bricht ab. „Bild wählen…“ in der Leiste öffnet die Auswahl erneut.
- **Größe**, wahlweise:
  - **Breite in Metern** (wie bisher, Standard 5 m), oder
  - **Maßstab und dpi (Scan):** Ein Scan eines Plans im Maßstab 1:100 bei 300 dpi wird maßstäblich: Meter je Pixel = Maßstab × 0,0254 / dpi. Ein A4-Scan von 1:100 bei 150 dpi ergibt 29,70 × 21,00 m.
  - Steht die Auflösung in der Datei (PNG `pHYs`, JPEG JFIF), übernimmt das Feld dpi sie; die Leiste zeigt „Datei: 150 dpi“. PNG speichert ganze Pixel je Meter, deshalb werden fast ganze Werte gerundet (150,01 → 150).
  - Neben den Feldern steht die entstehende Größe, etwa „29,70 × 21,00 m“.
- **Vorgaben für neue Unterlagen:** Deckkraft (Standard 50 %) und Graustufen.
- **Werkzeugfenster** (Doppelklick auf das Werkzeug): dieselben Vorgaben, dazu „Unterlagen im Geschoss“ mit jeder Unterlage des Geschosses, ihrer Deckkraft, einem Schalter „Gesperrt“ und „Einstellungen“ für ihr Fenster. So lässt sich auch eine gesperrte Unterlage wiederfinden.

Code: `UnderlayToolFields.tsx` (Vorgaben und Liste), `useImageImport.ts` (`UnderlayDefaults`, `underlayMetresPerPixel`), `src/interop/images/dpi.ts` (`imageDpi`, `metresPerPixelAtScale`). Tests: `src/interop/images/dpi.test.ts`.

## B2 – Darstellung, Sperre und Fenster

Dateiformat 67. Eine Unterlage hat drei neue, optionale Werte:

- **Deckkraft** 5–100 %. Ein neuer Import beginnt mit 50 %, so bleibt die Zeichnung darauf lesbar. Ohne Wert gilt 100 %, ältere Dateien sehen aus wie bisher.
- **Graustufen:** Das Bild wird ohne Farbe gezeigt, etwa bei farbigen Scans.
- **Gesperrt:** Klick, Rahmenauswahl, Tab-Auswahl, Filter und „Alles auswählen“ greifen durch die Unterlage hindurch. Man zeichnet und wählt darauf, ohne sie zu verschieben. Ein Doppelklick auf eine Stelle, an der nur die gesperrte Unterlage liegt, öffnet ihr Fenster, dort lässt sie sich wieder entsperren.

**Fenster der Unterlage**, per Doppelklick oder in der Leiste „Werkzeugeigenschaften“, wenn die Unterlage gewählt ist: Deckkraft (Schieber), Graustufen, Gesperrt, Breite in m (die Höhe folgt dem Seitenverhältnis), Ecke links oben x/y in m, Drehung in Grad um diese Ecke. Jede Änderung ist ein Rückgängig-Schritt. Zahlen gelten mit Enter oder beim Verlassen des Felds, Esc verwirft die Eingabe.

Code: `imageReferenceV67Schema` in `src/domain/elements/reference/model.ts`, `updateImageReference` in `src/application/references/actions.ts`, `ReferenceFields.tsx`, `lockedReferenceAt` in `src/rendering/viewport/image-reference.ts`. Tests: `src/application/references/underlay.test.ts`.

## B3 – Drehen und an Linie ausrichten

- **Drehen** um einen Punkt: das vorhandene Werkzeug Drehen (docs/TASTENKUERZEL.md, B2) dreht auch Bildunterlagen; dazu kein neuer Code. Exakte Werte stehen im Fenster der Unterlage (Drehung in Grad, B2).
- **An Linie ausrichten** im On-Demand-Menü der Unterlage: zwei Punkte auf einer Linie im Bild anklicken, etwa auf einer Außenwand des Bestandsplans. Schon beim zweiten Punkt dreht das Bild live mit, die Messlinie zeigt die Strecke. Mit dem Klick liegt die Linie waagerecht oder senkrecht, je nachdem, was näher liegt. Der erste Punkt bleibt, wo er ist. Eine Meldung nennt die Drehung vorher und nachher, etwa „Drehung 0° → −5,94°“.
- Grenze: ausgerichtet wird auf die Achsen des Grundrisses, nicht parallel zu einer gewählten Wand.

Code: `previewAlignment` und `alignmentTurn` in `src/application/references/calibration.ts`, Modus „align“ in `useReferenceCalibration.ts`. Test: `src/application/references/align.test.ts`.

## B4 – Kalibrierung

- Die **Messlinie** ist zu sehen: vom ersten Punkt zum Cursor, mit Länge, wie beim Messen.
- Nach dem zweiten Punkt steht unter „Im Bild jetzt: 7,96 m“, was die Strecke heute misst, und das Längenfeld hat den Fokus: Eine getippte Ziffer geht direkt hinein, **Enter** übernimmt, Esc bricht ab.
- Eine **Zahl ohne Einheit** gilt als Meter („8“ = 8 m), mit Einheit wie bisher („800 cm“). Der Modellbefehl „Referenz auf 5 m kalibrieren“ verlangt weiter die Einheit.
- Danach nennt eine Meldung die Breite vorher und nachher, etwa „Breite 10,05 m → 10,10 m“.

Code: `ReferenceCalibrationControls.tsx`, `parseCalibrationField` in `src/application/references/calibration.ts`.
