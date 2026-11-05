# Bauzustand der Wände: Bestand, Neubau, Abbruch (S2, 31.10.2026)

Nutzervorgabe: Wände werden als Bestand, Neubau oder Abbruch gekennzeichnet; Neubau rot, Abbruch gelb, Bestand grau. Die farbige Darstellung ist optional und wird unter View geschaltet. Im Wandwerkzeug gibt es dafür einen eigenen Reiter „Bauzustand“.

- **Modell** (`src/domain/elements/wall/renovation.ts`): Wand-Eigenschaft `renovation` mit `existing` / `new` / `demolish`. Ohne Eintrag gilt Bestand. Dateiformat 36; Dateien bis Version 35 laden unverändert als Bestand, ein eingeschmuggelter Bauzustand in einer v35-Datei wird abgelehnt.
- **Wandwerkzeug**: Reiter „Bauzustand“ im Einstellungsfenster (Doppelklick auf das Werkzeug) als Vorgabe für neue Wände; Vorgabe ist **Neubau**. Die Pipette übernimmt den Bauzustand mit.
- **Element**: Doppelklick auf eine Wand → Reiter „Bauzustand“. Die Änderung gilt für alle gewählten Wände (die doppelt geklickte eingeschlossen), ist ein Rückgängig-Schritt und ändert keine Geometrie (`src/application/walls/renovation.ts`).
- **Darstellung**: View → „Darstellung…“ → „Bauzustand farbig anzeigen“ (im Browser gespeichert, Vorgabe aus). Eingeschaltet: Neubau rot (#dc2626), Abbruch gelb (#facc15), Bestand in der Schnittfarbe aus S1 (docs/SCHNITTDARSTELLUNG.md). Nur Grundriss; 3D bleibt unverändert.
- **IFC**: `Pset_WallCommon.Status` = NEW / EXISTING / DEMOLISH und `Renovation` im Eigenschaftssatz NOVIKOV_BIM. Archicad-Prüfdatei: `node --experimental-strip-types scripts/generate-renovation-acceptance-ifc.mjs <Ordner>` → `NOVIKOV-Bauzustand-Test.ifc` (`benchmarks/renovation-ifc-acceptance.ts`: drei parallele Wände 5,00 × 0,24 × 2,80 m, Abstand 2,00 m, benannt Bestand, Neubau, Abbruch). Ob Archicad den Status als Renovierungsstatus übernimmt, prüft der Nutzer.
- Andere Erzeugungswege (z. B. Sprachbefehle) legen Wände ohne Eintrag an, also als Bestand.

Nachweis: 1382 Tests grün (5 neu), Typprüfung/Lint/Architektur sauber. 14-Modell-Hash neu `089f79e4…97017b3`, weil der IFC-Export je Wand den Status-Eigenschaftssatz bekommt; Körper und Gebäudeflächen der 14 Modelle sind ohne IFC-Anteil bitgleich mit main (`15ce55f3…dea57ba` vorher und nachher). Browser-Abnahme: Reiter im Werkzeug- und Elementfenster, neue Wand rot, Bestand → Abbruch gelb, Rückgängig, Anzeige aus/an.

## Nacharbeit nach Nutzerrückmeldung (31.10.2026)

Rückmeldung: Nach dem Zeichnen ließ sich der Bauzustand nicht ändern. Ursachen: (1) Im Wand-, Linien- und Flächenwerkzeug beendete ein Doppelklick immer das Zeichnen, auch ohne laufende Zeichnung, und öffnete daher kein Elementfenster; (2) die farbige Anzeige war aus, eine Änderung blieb unsichtbar.

- **K1**: Doppelklick auf ein Element öffnet sein Fenster auch im Zeichenwerkzeug, solange noch kein Abschnitt gezeichnet ist (der Punkt des Doppelklicks wird verworfen, das Programm wechselt zur Auswahl). Während einer laufenden Wandkette oder Linie beendet der Doppelklick wie bisher (`draftFinishable` in `BimPlan`).
- **K2**: Eigenschaftsleiste der gewählten Wand mit Auswahl „Bauzustand“ – nach dem Zeichnen ist die Wand gewählt, der Zustand ist dort sofort änderbar (ein Rückgängig-Schritt). Im Elementfenster bleibt dafür der eigene Reiter.
- **K3**: Im Reiter „Bauzustand“ (Werkzeug- und Elementfenster) der Schalter „Farbig anzeigen“, verbunden mit View → Darstellung….
- **K4**: Zeichenfläche weiß (2D und 3D) statt hellgrauem Verlauf; Raster unverändert.

Nachweis: 1382 Tests grün, Typprüfung/Lint/Architektur sauber, 14-Modell-Hash unverändert (`089f79e4…97017b3`). Browser-Abnahme: weiße Fläche, Bauzustand in der Leiste nach dem Zeichnen geändert, Doppelklick im Wandwerkzeug öffnet das Wandfenster ohne Zusatzwand, Farbschalter im Reiter, Doppelklick beendet eine laufende Wandkette weiterhin.
