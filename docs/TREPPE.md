# Treppen (L06, ab 31.10.2026)

Nutzerauftrag 31.10.2026: Treppen als Bauteil, in drei Teilen. Nutzervorgabe: **Alle Treppenangaben sollen langfristig in den Einstellungen steuerbar sein** – deshalb speichert das Modell jede einstellbare Größe ausdrücklich; berechnet wird nur, was nicht festgelegt ist.

| PR | Inhalt | Stand |
| --- | --- | --- |
| TR1 | Gerade Treppe: Modell, Rechnung und Prüfung nach DIN 18065, Schema 40, Standardebene Treppe, 3D-Körper, IFC | erledigt |
| TR2 | Werkzeug „Treppe“, Leiste und Einstellungsfenster mit allen Angaben, Grundriss (Stufen, Lauflinie mit Pfeil, Schnittlinie), Eigenschaften, Bearbeiten | erledigt |
| TR3 | L- und U-Treppe mit Zwischenpodest | erledigt |
| später | Gewendelte Stufen, Wendeltreppe | offen |

## Regeln (DIN 18065, Gebäudetreppen)

| Regelwerk | Steigung h | Auftritt a | nutzbare Laufbreite |
| --- | --- | --- | --- |
| Wohngebäude bis 2 Wohnungen, notwendige Treppe (Vorgabe) | 14–20 cm | 23–37 cm | ≥ 80 cm |
| Sonstige Gebäude, notwendige Treppe | 14–19 cm | 26–37 cm | ≥ 100 cm |

Schrittmaßregel 2h + a = 59–65 cm (Richtwert 63 cm). Die Prüfung meldet jede Abweichung, verhindert die Treppe aber nicht (Planungsstand).

## Teil TR1

- `src/domain/elements/stair/model.ts`: `stairSchema` (Schema 40) – Form (vorerst `straight`), Antritt `start` (Mitte der Vorderkante der ersten Steigung), Richtung (Grad), Laufbreite, **Ziel-Steigung** (Vorgabe 17,5 cm), optional **feste Steigungsanzahl** und **fester Auftritt**, Laufplattendicke (Vorgabe 16 cm), Regelwerk, Fuß über OK Rohfußboden, Höhe wie Stütze/Wand (bis Geschoss darüber + Versatz oder feste Höhe), Bauzustand.
- `stairGeometry`: Höhe → Steigungsanzahl (aus Ziel-Steigung, sofern nicht fest), Steigung = Höhe / Anzahl, Auftritt aus 2h + a = 63 cm (sofern nicht fest), Auftrittsanzahl = Steigungen − 1, Lauflänge; Prüfung mit Klartext-Befunden. `stairOutline` (Grundriss), `stairProfile` (Seitenprofil: Stufen auf Laufplatte, Plattendicke senkrecht zur Neigung).
- `src/domain/elements/stair/body.ts`: geschlossener Körper (Profil über die Laufbreite extrudiert), in 3D mit Flächenkennung `stair`; IFC nutzt denselben Körper.
- `src/application/stairs/actions.ts`: `addStair` (Vorgaben für alles nicht Angegebene, geschossgebunden), `updateStair` (feste Höhe ↔ Bindung; `riserCount`/`tread` auf `undefined` setzen gibt sie an die Rechnung zurück).
- Standardebene „Treppe“ (neue Projekte direkt; Migration 39 → 40 ergänzt sie, gemeinsamer Helfer `withStandardLayer`). Untergeschobene Treppen in 39er Dateien werden abgelehnt.
- IFC: `IfcStair` .STRAIGHT_RUN_STAIR. mit `IfcStairFlight` (Steigungen, Auftritte, Steigung, Auftritt, facettierter Körper), `Pset_StairCommon` (NumberOfRiser, NumberOfTreads, RiserHeight, TreadLength, Status) und eigene Werte (Breite, Höhe, Lauflänge, Schrittmaß, Regelwerk, Prüfergebnis).
- Im Grundriss waren Treppen in TR1 auswählbar, aber noch nicht gezeichnet; Werkzeug und Darstellung kamen mit TR2.

Nachweis TR1: 1413 Tests grün (4 neu in `src/application/stairs/actions.test.ts`), Typprüfung/Lint/Architektur sauber (Treppenkörper in der Domäne, damit IFC nicht auf die Darstellung zugreift), 14-Modell-Hash unverändert. Browser: Testprojekt mit gerader Treppe (Breite 1,20 m, geschossgebunden) in 3D – Stufen auf Laufplatte bis zum Geschoss darüber.

## Teil TR2

Nutzervorgabe 31.10.2026: „Die Treppe wird voll gezeichnet. Ähnlich wie bei einer Wand haben wir eine Zeichenhauptachse, die entweder mittig, rechts oder links von der Treppe liegen kann.“

- **Zeichenachse** (`axis`: Mitte/Links/Rechts, optional, fehlt = Mitte; Schema bleibt 40): die geklickte Linie ist Mitte, linker oder rechter Rand der Treppe, in Laufrichtung gesehen. `stairFrame` liefert den Bezugsrahmen; Umriss, Körper (3D/IFC) und Grundriss nutzen ihn gemeinsam.
- **Werkzeug „Treppe“** (Werkzeugkasten nach Stütze): Klick 1 setzt den Antritt auf der Zeichenachse, Klick 2 die Laufrichtung. Die Lauflänge folgt aus der Rechnung – dazwischen zeigt die Vorschau die volle Treppe mit allen Stufen am Mauszeiger. Fangen wie bei Wand/Stütze (Endpunkte, Ecken, Ortho). Esc bricht ab.
- **Alle Angaben in den Einstellungen** (`StairFields`, gleich in Leiste, Einstellungsfenster und Elementfenster): Zeichenachse, Laufbreite, Ziel-Steigung, Steigungsanzahl berechnet/fest, Auftritt aus 2h + a = 63/fest, Laufplatte, Höhe bis Geschoss darüber (+ Versatz) oder fest, Fuß über OK RFB, Regelwerk, Ebene – darunter live das Ergebnis („17 Steigungen à 17,6 cm · 16 Auftritte à 27,7 cm · Lauflänge 4,43 m · 2h + a = 63 cm · DIN 18065 eingehalten“) bzw. die Befunde in Rot. Reiter „Bauzustand“ für Werkzeug und Element. Vorgaben-Umrechnung in `src/application/stairs/defaults.ts` (`stairValues`/`stairSettings`).
- **Grundriss nach Bauzeichnungs-Praxis** (`stairPlan`, `StairPlanGraphic`): Umriss, eine Linie je Steigung, Lauflinie in Laufmitte vom Kreis an der ersten Stufe bis zum Pfeil an der Austrittsstufe, Schnittlinie (Bruchlinie) schräg über den Lauf in 1 m Schnitthöhe; alles oberhalb des Schnitts gestrichelt. Ohne bekannte Höhe nur der Umriss in Laufbreite, damit die Treppe sichtbar und wählbar bleibt.
- **Bearbeiten**: Auswahl, Doppelklick öffnet das Elementfenster mit allen Werten (jede Änderung ein Rückgängig-Schritt; „berechnet“ gibt feste Werte an die Rechnung zurück); On-Demand-Menü mit Zusammenfassung, frei bewegen und auf X-/Y-Achse (Antritt bewegt sich mit); Pipette übernimmt alle Einstellungen ins Werkzeug.

Nachweis TR2: 1417 Tests grün, Typprüfung/Lint/Architektur sauber, 14-Modell-Hash unverändert; 4 neue Tests in `src/application/stairs/tool.test.ts` (Zeichenachse, Grundriss mit Schnitt, Vorgaben-Rundreise und Rückgabe an die Rechnung, Szene/Pipette/Verschieben). Browser: Werkzeug gewählt, Antritt und Richtung geklickt – Vorschau mit allen Stufen, Treppe gesetzt; Grundriss mit Stufen, Lauflinie, Kreis, Pfeil, Schnittlinie und gestricheltem Teil oberhalb; Elementfenster mit allen Werten und Live-Prüfung; Achse auf „Links“ verschiebt die Treppe auf die rechte Seite der Klicklinie; 3D-Treppe bis zum Geschoss darüber.

## Teil TR3

Nutzerentscheidung 31.10.2026: Variante B – bei L und U wählt ein **dritter Klick** die Seite der Wendung.

- **Formen** (`shape`: Gerade / L-Treppe (Viertelwendung) / U-Treppe (Halbwendung)). Neue optionale Werte, Schema bleibt 40: `turn` (links/rechts, in Laufrichtung des 1. Laufs), `firstRisers` (feste Steigungen im 1. Lauf, sonst die Hälfte), `landingDepth` (feste Podesttiefe, sonst Laufbreite), `eye` (Treppenauge der U-Treppe, Vorgabe 15 cm). Werte für L/U werden nur bei L/U gespeichert; zurück auf „Gerade“ entfernt sie.
- **Rechnung** (`stairGeometry`): Steigungen wie bisher, Aufteilung auf zwei Läufe (`flights`), das Podest ersetzt den letzten Auftritt des 1. Laufs (Auftritte = Steigungen − 2), `run` = Summe der Lauflängen ohne Podest. Prüfung zusätzlich: Podesttiefe ≥ Laufbreite, je Lauf mindestens 3 Steigungen, **höchstens 18 Steigungen je Lauf** (sonst Hinweis „Zwischenpodest“ – gilt auch für gerade Treppen), Begrenzung des festen 1. Laufs.
- **Lage** (`stairLayout`): 1. Lauf ab der Zeichenachse; Podest am oberen Ende. L: 2. Lauf rechtwinklig zur gewählten Seite, bündig mit der hinteren Podestkante. U: 2. Lauf parallel zurück, um Laufbreite + Treppenauge versetzt. Liefert Läufe (Bezugsrahmen, Steigungen, erste Steigung), Podestfläche und Gesamtumriss (Auswahl, Grundriss).
- **Grundriss**: Gesamtumriss, Steigungslinien beider Läufe, Lauflinie als Linienzug über die Podestmitte (Kreis am Antritt, Pfeil am Austritt), Schnittlinie im Lauf, den die 1-m-Ebene trifft; alles darüber gestrichelt.
- **3D und IFC**: Körper aus zwei Läufen (je eigene Höhe ab ihrer ersten Steigung) und der Podestplatte (Dicke = Laufplatte). IFC: `IfcStair` .QUARTER_TURN_STAIR. bzw. .HALF_TURN_STAIR. mit zwei `IfcStairFlight` (je Steigungen/Auftritte) und dem Podest als `IfcSlab` .LANDING.; eigene Werte Form, Wendung, Podesttiefe, Aufteilung. Der 1. Lauf behält seine GUID aus TR1/TR2.
- **Werkzeug**: Klick 1 Antritt, Klick 2 Laufrichtung, bei L/U Klick 3 auf der Seite der Wendung – die Vorschau zeigt nach Klick 2 die ganze Treppe und klappt mit dem Zeiger auf die jeweilige Seite. Felder Form, Wendung (Vorgabe), 1. Lauf Hälfte/fest, Podest Tiefe = Laufbreite/fest, Treppenauge; Ergebnis zeigt die Aufteilung („8 + 8 = 16 Steigungen … + Podest 1 m“).

Nachweis TR3: 1423 Tests grün, Typprüfung/Lint/Architektur sauber, 14-Modell-Hash unverändert; 6 neue Tests in `src/application/stairs/turn.test.ts` (Aufteilung und Prüfung, L links/rechts, U mit Treppenauge und Lauflinie, Körper mit Podest, Klickrichtung/-seite, Speichern/IFC/zurück auf gerade). Browser: L-Treppe mit drei Klicks (Vorschau klappt mit dem Zeiger nach links/rechts), Grundriss mit Lauflinie über das Podest, Umstellen auf U im Element, 3D mit zwei Läufen und Podestplatte.
