# Bildunterlage (L23, Teil 1)

Stand: 07.11.2026. Ein Bestandsplan, ein Scan oder ein Foto (PNG oder JPEG) liegt als Unterlage im Grundriss, wird über eine bekannte Strecke kalibriert und nachgezeichnet. Grundlage seit PR160: Import, Platzieren, Zweipunkt-Kalibrierung (docs/references/IMAGE_REFERENCE_PLAN.md). L23 Teil 1 macht daraus ein Werkzeug für den Alltag.

PDF als Unterlage ist nicht enthalten: Es bräuchte das npm-Paket pdf.js, und das ist nur mit Zustimmung erlaubt. DXF und DWG sind ein eigener Block.

## B2 – Darstellung, Sperre und Fenster

Dateiformat 67. Eine Unterlage hat drei neue, optionale Werte:

- **Deckkraft** 5–100 %. Ein neuer Import beginnt mit 50 %, so bleibt die Zeichnung darauf lesbar. Ohne Wert gilt 100 %, ältere Dateien sehen aus wie bisher.
- **Graustufen:** Das Bild wird ohne Farbe gezeigt, etwa bei farbigen Scans.
- **Gesperrt:** Klick, Rahmenauswahl, Tab-Auswahl, Filter und „Alles auswählen“ greifen durch die Unterlage hindurch. Man zeichnet und wählt darauf, ohne sie zu verschieben. Ein Doppelklick auf eine Stelle, an der nur die gesperrte Unterlage liegt, öffnet ihr Fenster, dort lässt sie sich wieder entsperren.

**Fenster der Unterlage**, per Doppelklick oder in der Leiste „Werkzeugeigenschaften“, wenn die Unterlage gewählt ist: Deckkraft (Schieber), Graustufen, Gesperrt, Breite in m (die Höhe folgt dem Seitenverhältnis), Ecke links oben x/y in m, Drehung in Grad um diese Ecke. Jede Änderung ist ein Rückgängig-Schritt. Zahlen gelten mit Enter oder beim Verlassen des Felds, Esc verwirft die Eingabe.

Code: `imageReferenceV67Schema` in `src/domain/elements/reference/model.ts`, `updateImageReference` in `src/application/references/actions.ts`, `ReferenceFields.tsx`, `lockedReferenceAt` in `src/rendering/viewport/image-reference.ts`. Tests: `src/application/references/underlay.test.ts`.
