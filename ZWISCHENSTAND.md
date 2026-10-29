# NOVIKOV CAD – Zwischenstand

Kurze Übersicht für dich: Was ist erledigt, was ist offen? Sie wird nach jedem abgeschlossenen Auftrag mit aktualisiert. Verbindlich bleiben der Masterplan (`NOVIKOV_MASTERPLAN.md`, Abschnitt „Status auf einen Blick“ und §9) und das Register. Widerspricht diese Datei dem Masterplan, gilt der Masterplan. Deine bearbeitbare Liste mit offenen Aufgaben und Wünschen: AUFGABENLISTE.md.

**Stand:** 29.10.2026 · main nach PR492 · 1344 automatische Tests grün

## Gerade aktiv

- Wartet auf dich: Archicad-Test der Datei NOVIKOV-Decken-Test.ifc (DesktopClaude_Ablage_CodeNOVIKOV-Decken-Abnahme-2026-10-28).

## Was wir gemacht haben (24.–29.10.2026)

**Schulmodell schneller machen (Nutzerentscheidung 24.10.)**

- Speichern eines Bearbeitungsschritts prüft nur noch geänderte Geschosse: 20.000 Elemente von ≈ 3,1 s auf ≈ 0,2 s (PR440–445).
- Bearbeiten, Undo/Redo und Autosicherung ohne doppelte Prüfungen (PR463, 464, 467, 471, 475, 476, 481, 483).
- Picken, Fangen und Bewegen beim großen Modell schneller (PR472, 474, 482); Versatz-Befehl ohne Umweg (PR473).
- Schullauf als wiederholbare Abnahme im Browser, mit Z-Bewegung, IFC-Export, Inhaltsvergleich und Kalt-/Warmstart (PR460, 480).

**Neue Fachfunktionen**

- Tür: einflügelige Drehtür mit 3D-Türblatt, IFC, DIN links/rechts, Befehle (PR446–450, 454).
- Hinweis bei überlappenden Öffnungen (PR451), Löschen für alle Bauteile (PR452), Positionsnummern (PR456), Menü weicht der Befehlszeile aus (PR455).
- Wandanschlüsse inklusive schräger T-Anschlüsse in jedem Winkel und Ecke an einer T-Hauptwand (PR465, 468–470); bessere Treffer an Öffnungen (PR466).

- Decke als Bauteil: zeichnen (Polygon, Rechteck, Kontur), Stärke/Versatz, Grundriss, 3D-Körper mit Auswahl, IFC als IfcSlab, Verschieben (auch mit Wänden), Befehle „Deckenstärke 25 cm“, Fangpunkte an Deckenecken; OK = Rohfußboden darüber, Stärke wächst nach unten (PR486–489).
- Wandhöhe an Geschoss binden: Oberkante = OK Rohfußboden darüber + Zusatzhöhe (z. B. Attika +0,50 m), auch im obersten Geschoss; eine eingegebene Höhe löst die Bindung; alte Dateien behalten ihre Wandhöhen (PR490). Mit behoben: ältere Dateien (Schema 26/27) mit gebundenen Wänden ließen sich nicht öffnen.

**IFC / Archicad**

- T-Anschlüsse: von dir in Archicad abgenommen, Wände korrekt (PR477). Reguläre Dateibeschreibung im normalen Export (PR478).

**Aufräumen und Qualität**

- Aktionen aus dem Altbereich `lib/bim` in die neue Struktur verlegt (PR457–459), Geschosskörper verschoben (PR484).
- AUD14-Abgleich aller Prüfpunkte (docs/AUD14_ABGLEICH.md); Umlaute repariert und automatisch geprüft (PR479); Meldung „Bewegung nicht möglich“ repariert, Prüfung findet jetzt auch kaputte Ersatzzeichen (PR485).
- Architekturregel für mehrgeschossige Wände festgehalten (Gast-Wände, Dachtrimmung über Geschosse; Masterplan A08).
- Lade- und Wiederherstellungsübersicht nennen jetzt auch Türen und Decken (PR491).
- Abgesichert für eine Windows-Neuinstallation: Arbeitsweise in AGENTS.md, Browser-Start im Repository, Anleitung docs/WIEDERAUFNAHME.md (PR492).

## Was offen ist

**Mögliche nächste Aufträge (deine Wahl)**

- Decken: einzelne Eckpunkte/Kanten bearbeiten (vorher Bearbeitungstyp aus lib/bim lösen).
- Decken C3: Überschneidung von Wand und Decke (Wand mit Zusatzhöhe 0 ragt in die Decke) für 3D, Mengen und IFC klären.
- Nächstes Fachbauteil aus Masterplan §6.
- Mehrgeschossige Wände, Gast-Anzeige im Grundriss, Dachtrimmung (deine Vision vom 27.10., noch nicht umgesetzt).
- Bewegungsstart beim Stressmodell x noch ≈ 1,5 s.
- Fangindex-Rest und große Anschlussgruppen (AUD14-04/05).

**Bewusst zurückgestellt**

- Wandweiser 3D-Neuaufbau (Stufe B1/B2): erst wenn reale Projekte stocken oder zusammen mit den mehrgeschossigen Wänden.
- Fenstermaße im IFC für Archicad („RB 0,00 x 0,00“): am 28.10. gestoppt, nicht vorrangig.
- Wandbewegung x/y/Achse abgleichen (seit 24.10.).

**Wartet auf deine Entscheidung**

- Speicher-/Lade-Brücke in `lib/bim/model.ts`: wo die Grenze zum Dateiformat liegen soll.

**Vor einer Veröffentlichung noch zu prüfen (fehlende Testumgebung)**

- Echter voller Speicher (Quota), mehrere Tabs gleichzeitig, Dauerlauf ≥ 2 Stunden, Grafikkarten- und Prozessspeicher.

**Bekannte kleine Punkte**

- `CadWorkspace.tsx` (≈ 1850 Zeilen) und `BimSolidView.tsx` sind groß; wird nur bei passenden Fachänderungen verkleinert.
- Sechs bekannte Lint-Warnungen in `components/ui`.
