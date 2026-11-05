# Maßkette als 2D-Werkzeug (L12, 31.10.2026)

Nutzervorgabe 31.10.2026: Bemaßung ist ein eigenes 2D-Werkzeug für den letzten Schritt – erst wird das Gebäude gezeichnet, dann bemaßt. Bemaßungsregeln (1. Kette Vorsprünge, 2. Rohbauöffnungen, 3. Wandstärken und Räume, 4. Gesamtmaß) soll später eine AI am Gebäude automatisch ausführen. Jetzt zuerst das Maßkettenwerkzeug mit seiner Logik; Darstellung (Kreuze, Schrift) wird später angepasst.

## Bedienung

1. Werkzeug „Maßkette“ (Werkzeugleiste nach „Schraffur“) wählen; in Leiste oder Einstellungsfenster die Richtung **Waagerecht** oder **Senkrecht** wählen (und die Ebene, Vorgabe „Bemaßung“).
2. **Erster Klick:** Lage der Maßlinie (bei waagerecht ihre Höhe, bei senkrecht ihre x-Lage). Eine gestrichelte Hilfslinie zeigt sie.
3. **Jeder weitere Klick:** ein Messpunkt – rastet wie überall an Wand-, Fenster-, Tür-, Stützenecken usw. ein. Die Kette wird beim Klicken als Vorschau gezeigt, mit dem Mauspunkt als nächstem Maß.
4. **Doppelklick ins Leere** (oder Enter) erstellt die Maßkette; der erste Klick des Doppelklicks zählt nicht als Punkt. Esc bricht ab. Das Werkzeug bleibt für die nächste Kette aktiv.

## Umsetzung

- `src/domain/elements/dimension/model.ts`: `dimensionSchema` (Schema 38) – Richtung, Lage der Maßlinie (`offset`), Punkte als Grundrisskoordinaten (nicht an Bauteile gebunden, wandern bei Änderungen nicht mit). Maße zwischen benachbarten Stationen in Kettenrichtung (gleiche Lage zählt einmal), `dimensionLayout` (Maßlinie, Hilfslinien, Striche, Textmitten), `formatDimension` (unter 1 m in cm, ab 1 m in m mit zwei Nachkommastellen).
- `src/application/dimensions/actions.ts`: `addDimension`, `updateDimension`; Standardebene „Bemaßung“ (gab es schon). Register `dimension` („Maßkette“): Auswahl, Löschen, Kopieren/Einfügen, Ebenen wie bei anderen Elementen.
- Grundriss (`DimensionGraphic`): Maßlinie, Hilfslinien bis zu den Punkten, 45°-Striche, Maßzahl über jedem Abschnitt (senkrecht gedreht); Schrift 2,5 mm und Striche 1,5 mm auf Papier im aktuellen Ausgabemaßstab. Auswahl entlang der Maßlinie.
- Gewählte Kette: Leiste mit Richtung und Maßen („90 · 1,20 · 90 · gesamt 3,00“), On-Demand-Menü mit Bewegen (frei, X, Y) und Löschen; Verschieben bewegt Punkte und Maßlinie gemeinsam.
- Fang: Das Einrasten an Bauteilpunkten war im Zeichenpfad nur für bestimmte Werkzeuge an; Maßkette und Stütze sind jetzt dabei (vorher rasteten Stützen nur am Raster ein).
- Dateiformat 38; 37er Dateien laden unverändert, eine untergeschobene Maßkettenliste wird abgelehnt. Maßketten gehen nicht ins IFC.

Nachweis: 1400 Tests grün (4 neu in `src/application/dimensions/actions.test.ts`), Typprüfung/Lint/Architektur sauber, 14-Modell-Hash unverändert. Browser: waagerechte Kette an einer 3-m-Wand mit Fenster – 90 · 1,20 · 90, eingerastet an Wand- und Fensterecken, Doppelklick ins Leere erstellt die Kette mit genau drei Maßen; senkrechte Kette über die Wandstärke – 36 (vor der Fang-Korrektur 40 durch den 10-cm-Raster); Auswahl, Leiste und Menü geprüft; Testketten danach zurückgenommen.

Offen (spätere Schritte): Darstellung (Kreuze/Punkte, Schrift, hochgestellte 5), schräge Ketten, automatische Ketten nach Bemaßungsregeln (AI), Texte.

## Nacharbeit M1–M4 (31.10.2026)

Nutzerrückmeldung: Fensterecken rasten bei der Bemaßung nicht ein; nachträglich Punkte ergänzen und löschen über das On-Demand-Menü; das Menü der Maßkette auf sinnvolle Einträge prüfen.

- **M1 Fensterfang:** Ursache war nicht die Rasterengine – Fenster hatten keine Fangpunkte, nur Türen (Laibungsecken). Fenster bekommen jetzt dieselben vier Laibungsecken („Fenster · Laibung“), für alle Werkzeuge. Beim Bearbeiten einer Wand sind die Laibungspunkte ihrer eigenen Öffnungen kein Fangziel (sie bewegen sich mit).
- **M2 Punkt hinzufügen:** Menüeintrag startet das Maßkettenwerkzeug auf der gewählten Kette; neue Punkte anklicken (Fang, Vorschau der geänderten Kette), Doppelklick ins Leere oder Enter übernimmt alle als einen Rückgängig-Schritt, Esc bricht ab.
- **M3 Punkt entfernen:** Menüeintrag zeigt die Messpunkte rot; ein Klick auf einen Punkt oder sein Hilfslinienende (bis 0,30 m) entfernt ihn (`dimensionPointAt`). Bleiben weniger als zwei verschiedene Stationen, wird abgelehnt mit dem Hinweis, die Kette zu löschen.
- **M4 Menü:** Für eine Maßkette nur noch Punkt hinzufügen, Punkt entfernen, **Maßlinie verschieben** (ein Klick setzt die neue Lage; nur der Abstand, die Punkte bleiben), Ganze Kette verschieben, Werkzeugeigenschaften, Löschen. Entfallen: Element auf X-/Y-Achse, Referenzen auswählen.
- Nach jeder Bearbeitung zurück im Auswahlwerkzeug mit der Kette gewählt.

Nachweis M1–M4: 1402 Tests grün (2 neu; Vergleichsableitung der Fangpunkte und zwei Tests auf Fensterpunkte angepasst), Typprüfung/Lint/Architektur sauber, 14-Modell-Hash unverändert. Browser: Kette 3,00 an der Wand; Punkt hinzufügen an beiden Fensterlaibungen → 90 · 1,20 · 90; Punkt entfernen an der rechten Laibung → 90 · 2,10; Maßlinie verschoben; Menü mit genau den sechs Einträgen; jeder Schritt einzeln rückgängig, Testkette danach entfernt.

## Darstellung nach Bauzeichnungs-Praxis (31.10.2026)

Nutzervorgabe: Standard recherchieren und übernehmen. Recherche: Eine Bemaßung besteht aus Maßzahl, Maßlinie, Maßhilfslinie und Maßbegrenzung; übliche Begrenzungen in Bauzeichnungen sind 45°-Schrägstrich, Punkt, Kreis, Pfeil (vorzugsweise für Rundungen) und Kreuz (Bauzeichnungs-Grundregeln nach DIN 1356-1, die laut DIN derzeit überarbeitet wird – Entwurf E DIN 1356-1:2026-09; teils wird auf DIN EN ISO 7519 verwiesen). Praxis in deutschen Bauplänen: Maße unter 1 m in cm, ab 1 m in m mit zwei Nachkommastellen, halber Zentimeter als hochgestellte 5 (36⁵, 2,01⁵).

- Je Maßkette (optional, Schema bleibt 39): **Begrenzung** Schrägstrich (Vorgabe) / Punkt / Kreis / Pfeil / Kreuz; **Maßzahl** m/cm mit hochgestellter 5 (Vorgabe) / Meter (bis mm) / Zentimeter; **Schrift** 1,8 / 2,5 (Vorgabe) / 3,5 / 5 mm Papier.
- In Leiste und Einstellungsfenster des Werkzeugs als Vorgabe, bei einer gewählten Kette in Leiste und Fenster (sofort, ein Rückgängig-Schritt).
- Darstellung (`DimensionGraphic`): Maßzahl über der Maßlinie, lesbar von unten bzw. rechts; hochgestellte 5 kleiner und angehoben; Hilfslinien 1,5 mm über die Maßlinie hinaus; Striche 2 mm; Pfeile zeigen auf die Hilfslinien (an Zwischenstationen beidseitig). Werte auf halbe Zentimeter gerundet (`dimensionFigure`).

Nachweis: 1409 Tests grün (Format-Test auf Bauzeichnungs-Praxis umgestellt), Typprüfung/Lint/Architektur sauber, 14-Modell-Hash unverändert. Browser: Kette 90 · 1,20 · 90 mit Schrägstrichen und Überstand; Umschalten auf Punkt und Pfeil an der gewählten Kette; Testkette zurückgenommen.
