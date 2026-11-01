# NOVIKOV CAD – Zwischenstand

Kurze Übersicht für dich: Was ist erledigt, was ist offen? Sie wird nach jedem abgeschlossenen Auftrag mit aktualisiert. Verbindlich bleiben der Masterplan (`NOVIKOV_MASTERPLAN.md`, Abschnitt „Status auf einen Blick“ und §9) und das Register. Widerspricht diese Datei dem Masterplan, gilt der Masterplan. Deine bearbeitbare Liste mit offenen Aufgaben und Wünschen: AUFGABENLISTE.md.

**Stand:** 01.11.2026 · main nach PR564 · 1469 automatische Tests grün

## Gerade aktiv

- Einstellungsfenster für jedes Werkzeug (deine Vorgabe vom 31.10.): E1 und E2 erledigt (PR517–518): jedes Werkzeug mit Fenster per Doppelklick, Element per Doppelklick, immer nur ein Fenster an derselben Stelle, neue Werkzeugreihenfolge.
- Hilfsfenster (PR519): On-Demand-Menü und Eingabefenster Winkel/Länge sind kleiner und bleiben dort, wohin du sie schiebst – auch nach dem Neuladen; Doppelklick auf die Titelzeile holt sie wieder an den Mauszeiger. Im Eingabefenster nur noch die Felder: Enter übernimmt, Tab wechselt, Esc bricht ab. Piktogramme für das Menü lieferst du später.
- Wanddarstellung (deine Vorgabe vom 31.10.): S1 erledigt (PR520) – unter View → „Darstellung…“ wählst du für geschnittene Bauteile Grau, Schwarz, Weiß oder eine eigene Farbe; gemerkt in diesem Browser. S2 erledigt (PR521): Jede Wand hat einen Bauzustand – Bestand, Neubau oder Abbruch. Im Wandwerkzeug (Doppelklick) Reiter „Bauzustand“, Vorgabe für neue Wände Neubau; Doppelklick auf eine Wand ändert ihn für alle gewählten Wände. Unter View → „Darstellung…“ schaltest du die Farben ein: Neubau rot, Abbruch gelb, Bestand in der Schnittfarbe. Nacharbeit (PR523): Bauzustand jetzt auch direkt in der Leiste der gewählten Wand, Doppelklick auf eine Wand öffnet ihr Fenster auch im Wandwerkzeug, Farbschalter im Reiter „Bauzustand“; die Zeichenfläche ist weiß.
- Glas-Paletten (PR524): Die Zeichenfläche läuft jetzt unter Werkzeugeigenschaften, Werkzeugkasten und Navigator durch; die drei Paletten sind milchig-gläsern wie die Einstellungsfenster. „Einpassen“ setzt die Zeichnung in den freien Bereich, die Breite des Navigators ziehst du am linken Rand (wird gemerkt).
- Stützen (L05, dein Auftrag vom 31.10.): Teil 1 erledigt (PR525) – Stützen gibt es im Modell, rechteckig oder rund, an die Geschosshöhe gebunden oder fest hoch, mit Bauzustand; sie erscheinen in 3D und im IFC als echte Stütze. Teil 2 erledigt (PR526): Werkzeug „Stütze“ direkt unter „Wand“ – Klick setzt eine Stütze; Form, Maße, Höhe und Bauzustand in der Leiste und im Einstellungsfenster; im Grundriss geschnitten in der Schnittfarbe; Doppelklick auf eine Stütze öffnet ihr Fenster. Teil 3 erledigt (PR527): Stützen verschieben (frei, auf X/Y), kopieren und einfügen, Fangpunkte Mitte/Ecken/Rand, Pipette. Offen: deine Prüfung in Archicad mit NOVIKOV-Stuetzen-Test.ifc.
- Maßkette (L12, deine Vorgabe vom 31.10.): Werkzeug „Maßkette“ unter „Schraffur“ – Richtung wählen, erst die Lage der Maßlinie anklicken, dann die Punkte (rasten ein), Doppelklick ins Leere erstellt die Kette (PR528). Seit PR529: Fensterecken rasten ein; im On-Demand-Menü einer Maßkette Punkt hinzufügen, Punkt entfernen und Maßlinie verschieben. Darstellung und automatische Ketten kommen später.
- Text (deine Vorgabe vom 31.10.): T1 erledigt (PR530) – Werkzeug „Text“ unter „Maßkette“: Klick, Text tippen (Enter neue Zeile), Strg+Enter setzt. Schrift, Größe in mm Papier oder m Modell (beim Umschalten bleibt die Größe gleich), Ausrichtung, Drehung, Farbe. T2 erledigt (PR531): fett/kursiv/unterstrichen, Hinterlegung, Umrandung und Freistellung (weißer Rand um die Buchstaben) – in der Leiste ankreuzen und färben. Seit PR532 hat das Feld am Klickpunkt alle diese Einstellungen direkt drin, mit Vorschau im Plan.
- Maßketten-Darstellung (PR533): Schrägstrich (Standard), Punkt, Kreis, Pfeil oder Kreuz; Maße unter 1 m in cm, darüber in m, halbe Zentimeter als hochgestellte 5; Schrifthöhe wählbar.
- Nebenschritte (deine Vorgabe vom 01.11.): S1 (PR555) erledigt – kein Raster mehr im 3D-Hintergrund; Fenster und Türen mit Element lassen sich in 3D anklicken. Es folgen S2 Ansichtssymbol und Größe 2,5, S3 Längen-Hilfslinie an Linien, S4 Transparenzpause.
- S2 (PR556) erledigt – Ansichten im Grundriss als Linie mit Blickpfeil ohne Endstriche, Schnitt- und Ansichtssymbole standardmäßig 2,5 mm.
- S3 (PR557) erledigt – eine gewählte Linie zeigt ihre Länge; Klick auf die Zahl ändert sie, die türkisen Pfeile bestimmen, an welchem Ende (beide: Mitte bleibt).
- S4 (PR558) erledigt – unten am Navigator die Transparenzpause: ein anderes Geschoss (Wände, Stützen) scheint blass durch, Deckkraft und Farbe einstellbar, der Fang rastet an seinen Wänden ein. Offen: ob der Wandanfang exakt auf dem Pausenende einrastet.
- E1 (PR559) erledigt – ein Klick auf eine Ecke bewegt sie sofort, jetzt auch bei Wänden; Stützen und Treppen haben Eckgriffe und hängen mit der angeklickten Ecke an der Maus.
- U1 (PR560) erledigt – oben kein 2D/3D-Umschalter und kein doppeltes Grid/SNAP mehr, im Canvas keine Plakette, kein Infotext und kein Würfel, die KI-Leiste zeigt nur noch Eingabe, Mikrofon und Senden.
- S4-Nacharbeit (PR561) erledigt – der Wandanfang rastet jetzt genau am Ende einer Wand der Transparenzpause ein (vorher 1 mm daneben).
- U2 (PR562) erledigt – im Canvas keine Knopfleiste oben rechts mehr (Navigation per Maus), kein px/m-Kästchen, die XYZ-Pfeile nur noch in 3D.
- BS1 (PR563) erledigt – Schnitt und Ansicht haben jetzt einen Rand an beiden Linienenden, die Geschosshöhen stehen außerhalb als Höhenkoten (±0,00, +3,00) mit Geschossnamen.
- BS2 (PR564) erledigt – im Maßkettenwerkzeug gibt es jetzt „Höhenkote“: im Schnitt- oder Ansichts-Tab Lage klicken, Punkte anklicken (rastet ein), Doppelklick erstellt die Koten; Rohbau/Fertig wählbar, Koten lassen sich ziehen und mit Entf löschen.
- Fensterflügel (deine Wahl vom 01.11.): Teil 1 (PR551) erledigt – im Fensterelement die Teilung 1-flüglig, 2-flüglig mit Pfosten oder 1-flüglig mit Oberlicht, je Flügel Dreh, Dreh-Kipp oder Kipp und der Anschlag; Flügelrahmen, Pfosten/Kämpfer, Oberlichthöhe. Teil 2 (PR552) erledigt: Flügelrahmen, Pfosten, Kämpfer und Oberlicht erscheinen in 3D, im Schnitt und im Grundriss. Teil 3 (PR553) erledigt: In Ansicht und Schnitt zeigt jeder Flügel sein Öffnungsdreieck (Dreh, Kipp, Dreh-Kipp), von außen gestrichelt. Teil 4 (PR554) erledigt: Im IFC tragen Fenster ihre Teilung und je Flügel die Öffnungsart. Bitte in Archicad prüfen: Claude_Ablage_Code/ifc-abnahme/FL4-Fensterfluegel.ifc.
- Ansichten (deine Vorgabe vom 01.11.): Teil 1 (PR550) erledigt – Werkzeug „Ansicht“ in der Rubrik DOK (Klick Anfang, Ende, Blickrichtung) und Knopf „Vier Ansichten erzeugen“ für Nord, Ost, Süd, West; im Navigator der Ordner „Ansichten“, Klick öffnet die Ansicht als Tab mit allen sichtbaren Kanten, Fenstern und Geschosslinien, ohne Schnittflächen.
- Fenster und Türen (deine Vorgabe vom 01.11.): Teil 1 (PR544) erledigt – in jede Öffnung kann jetzt ein Fenster- bzw. Türelement eingesetzt werden (Rahmen, Lage in der Wand, Außenseite, Festverglasung, Fensterbänke; Zarge, Blattdicke). Das Werkzeug setzt beides zusammen, „nur Öffnung“ ist wählbar; Einstellungen per Doppelklick auf Werkzeug oder Element. Teil 2 (PR545) erledigt: Rahmen, Glas, Fensterbänke, Zarge und Türblatt erscheinen in 3D und im Schnitt (Rahmen als Umriss, Glas als Doppellinie). Teil 3 (PR546) erledigt: Im Grundriss zeigt ein Fenster mit Element Rahmen, Glaslinie und Fensterbänke, eine Tür die Zarge und das Blatt in der lichten Breite. Teil 4 (PR547) erledigt: Im IFC haben Fenster und Türen mit Element jetzt einen echten Körper und Laibungsangaben. In Archicad von dir bestätigt. Nachbesserung G1 (PR548): Glas im IFC jetzt 70 % durchsichtig, Rahmen weiß, Tür holzfarben; auch in unserer 3D-Ansicht ist das Glas durchscheinend. Neue Datei zum Prüfen: Claude_Ablage_Code/ifc-abnahme/G1-Fenster-Tueren-Glas.ifc. Von dir in Archicad 26 bestätigt: Glas korrekt, Fenster als Fenster mit richtigen Maßen erkannt. Offen: Die Beschriftung zeigt weiter „0,00 x 0,00“. Neu (PR549): Beim Platzieren von Fenster und Tür setzt Klick 1 die Position, Klick 2 auf eine Wandseite die Außenseite bzw. die Seite, zu der die Tür aufgeht.
- Werkzeugleiste (deine Vorgabe vom 01.11.): Teil 1 (PR542) erledigt – nur noch die schmale Leiste; oben das Auswahlwerkzeug, darunter die Rubriken 3D, 2D und DOK. Das Zahnrad unten öffnet „Werkzeugleiste anpassen“: Werkzeuge ziehen oder mit Pfeiltasten verschieben, „Zurücksetzen“; die Anordnung bleibt in diesem Browser gespeichert. Teil 2 (PR543) ebenfalls erledigt: neue Symbole für Wand, Stütze, Treppe, Fenster, Decke, Dach und Schnitt – sag Bescheid, welche dir noch nicht gefallen.
- Schnitt (L11, dein Auftrag vom 01.11.): Teil 1 (PR537) erledigt – über dem Canvas gibt es jetzt Tabs: „Grundriss Erdgeschoss“ und „3D-Ansicht“; „+“ öffnet eine Ansicht als Tab, × schließt sie (der letzte bleibt), auch der 2D/3D-Schalter öffnet den passenden Tab. Im Navigator steht unter den Geschossen der neue, noch leere Ordner „Schnitte“. Teil 2 (PR538) ebenfalls erledigt: Werkzeug „Schnitt“ unten in der Werkzeugleiste – Klick Anfang, Klick Ende, Klick auf die Seite, in die geschaut wird. Die Schnittlinie mit Pfeilen und Kennung (A, B, … oder 1, 2, …) erscheint in allen Geschossen und im Ordner „Schnitte“; Klick dort öffnet den Schnitt als Tab, Doppelklick (auch auf die Linie) sein Fenster mit Name, Kennung, Blick umkehren und Löschen. Teil 3 (PR539) ebenfalls erledigt: Der Schnitt-Tab zeigt die Schnittzeichnung aus dem Modell – geschnittene Bauteile in deiner Schnittfarbe, dahinter die Ansicht mit Kanten, Geschosslinien mit Höhen; Mausrad zoomt, Ziehen verschiebt, „Einpassen“. Teil 4 (PR540) nach deiner Rückmeldung: Kennung und Pfeile der Schnittlinie haben jetzt eine feste Größe (Vorgabe 5 mm Papier, wahlweise m Modell), einstellbar im Werkzeug- und im Schnitt-Fenster; beginnt die Linie in einem Bauteil, ist es im Schnitt trotzdem gefüllt (Decke, Wand im Obergeschoss). Teil 5 (PR541): Die Schnittlinie lässt sich mit dem Pfeil-Werkzeug anklicken; Griffe an den Enden verlängern, kürzen oder drehen (Shift: nur Länge), der mittlere verschiebt; Entf löscht, die Länge gibt es auch als Zahl im Fenster. Fenster und Türen bleiben im Schnitt Öffnungen, bis es echte Fenster-/Türelemente gibt. Noch ohne Bemaßung und Ablage als Abbild.
- Treppen (L06, dein Auftrag vom 31.10.): Teil 1 (PR534) und Teil 2 (PR535) erledigt – Werkzeug „Treppe“ im Werkzeugkasten: erster Klick setzt den Antritt auf der Zeichenachse (Mitte, links oder rechts wie bei der Wand), zweiter Klick die Laufrichtung; die Länge rechnet das Programm nach DIN 18065, dazwischen siehst du die volle Treppe. Alle Angaben stehen in der Leiste und im Einstellungsfenster, mit Live-Ergebnis und Prüfung. Im Grundriss: Stufen, Lauflinie mit Pfeil, Schnittlinie, oberhalb gestrichelt; in 3D und IFC als echte Treppe. Teil 3 (PR536) ebenfalls erledigt: L- und U-Treppen mit Zwischenpodest – Form im Einstellungsfenster wählen, dann Antritt, Richtung und mit dem dritten Klick die Seite der Wendung; Podesttiefe, Aufteilung der Steigungen und Treppenauge sind einstellbar, die Prüfung meldet zu kurze Podeste und Läufe über 18 Steigungen. Nebenbei behoben: Stützen rasteten bisher nur am Raster ein, jetzt auch an Bauteilecken. Offen: deine Prüfung in Archicad mit NOVIKOV-Bauzustand-Test.ifc (PR522), ob der IFC-Status als Renovierungsstatus ankommt.
- Trimmen von Wänden an Dächern (L04b) in drei Schritten: K1 Rechtsklickmenü, Modify-Menü und Kopieren/Einfügen (PR513) und K2 Darstellungsreihenfolge (PR514) erledigt; Trimmen vollständig (PR515–516: Wände + Dach wählen, „Trimmen…“ mit Bestätigung, Wand bis unters Dach, Trimmung aufheben, IFC als schräger Körper). In Archicad bestätigt.
- Raumwerkzeug (L08): R1 Modell (PR507) R2 Werkzeug (PR508: Klick zwischen Wänden, Raumstempel, Eigenschaften) R3 Höhen (PR509) und R3b Höhenlinien (PR510: Höhe, Farbe, Linienart, Unter- und Oberkante, Fläche ab Linie, z. B. 2,30 m bis Dachhaut) erledigt. Neu: Tab-Auswahl (PR511) – liegen mehrere Elemente unter dem Cursor, erscheint ein kleiner Hinweis, Tab schaltet durch, Klick wählt; damit ist auch ein Raum unter Dach/Decke auswählbar. R4 (PR512): Raumliste unter Organisation mit Summen und CSV, Räume im IFC als IfcSpace. Raumwerkzeug damit abgeschlossen; Archicad-Import bestätigt (Flächen und Bezeichnungen stimmen); Wohnfläche nach WoFlV später (docs/ROOM_ELEMENT.md).

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

- Decken: von dir in Archicad abgenommen (29.10.), Import erfolgreich, Decken auf richtigen Höhen; Fenster weiterhin 0,00 x 0,00.
- T-Anschlüsse: von dir in Archicad abgenommen, Wände korrekt (PR477). Reguläre Dateibeschreibung im normalen Export (PR478).

**Aufräumen und Qualität**

- Aktionen aus dem Altbereich `lib/bim` in die neue Struktur verlegt (PR457–459), Geschosskörper verschoben (PR484).
- AUD14-Abgleich aller Prüfpunkte (docs/AUD14_ABGLEICH.md); Umlaute repariert und automatisch geprüft (PR479); Meldung „Bewegung nicht möglich“ repariert, Prüfung findet jetzt auch kaputte Ersatzzeichen (PR485).
- Architekturregel für mehrgeschossige Wände festgehalten (Gast-Wände, Dachtrimmung über Geschosse; Masterplan A08).
- Lade- und Wiederherstellungsübersicht nennen jetzt auch Türen und Decken (PR491).
- Deckenumriss im Grundriss bearbeiten wie bei Schraffuren: Ecke verschieben, strecken, Knicken, Seite strecken, Kontur versetzen (PR494); dafür die Bearbeitungssitzung aus `lib/bim` verlegt (PR493).
- Neue Projekte starten mit Erdgeschoss und 1. Obergeschoss (je 3,00 m); Decken im Grundriss nur als durchgezogene Konturlinie und damit sofort in 3D (PR495).
- Polygone schließen per Klick auf den ersten Punkt (Schraffur, Decke, Polylinie und künftige Werkzeuge gleicher Art); der Startpunkt hat beim Fangen Vorrang (PR496).
- Ecke anklicken bewegt sie sofort; Ecke auf eine andere Ecke ziehen löscht sie (Schraffur, Decke, Linie; Rechtsklick auf die Ecke öffnet das Punktmenü) (PR497).
- Polygon-Regeln A–D (deine Vorgabe vom 29.10., docs/POLYGON_REGELN.md) abgeschlossen; zuletzt heißen Fangpunkte nach Element und Nummer, z. B. „Decke · Ecke 3“, „Wand · Anfang“ (PR498).
- Wand und Decke flimmern in 3D nicht mehr, wenn sie sich überschneiden (Decke wird bei gleichem Vorrang vorn gezeigt); später entscheidet das Material (PR499).
- Der Hinweis auf Wiederherstellungsstände sitzt jetzt klein unten links statt als Fenster oben rechts (PR500).
- Dach (einflächiges Steildach): zeichnen über Bezugslinie, Steigseite und Umriss, Eigenschaften, Bearbeitung, 3D, Grundriss mit Schnitt bei 1 m, IFC (PR502–506, docs/ROOF_ELEMENT.md). In Archicad von dir geprüft: Höhen und Darstellung sauber, Dach kommt als Objekt, noch nicht als Dach bearbeitbar.
- Abgesichert für eine Windows-Neuinstallation: Arbeitsweise in AGENTS.md, Browser-Start im Repository, Anleitung docs/WIEDERAUFNAHME.md (PR492).

## Was offen ist

**Mögliche nächste Aufträge (deine Wahl)**

- Decken C3: Überschneidung in Archicad von dir bestätigt (29.10.); Vorrang per Material (0–100) später.
- Nächstes Fachbauteil aus Masterplan §6.
- Mehrgeschossige Wände, Gast-Anzeige im Grundriss, Dachtrimmung (deine Vision vom 27.10., noch nicht umgesetzt).
- Bewegungsstart beim Stressmodell x noch ≈ 1,5 s.
- Fangindex-Rest und große Anschlussgruppen (AUD14-04/05).

**Bewusst zurückgestellt**

- Wandweiser 3D-Neuaufbau (Stufe B1/B2): erst wenn reale Projekte stocken oder zusammen mit den mehrgeschossigen Wänden.
- Fenstermaße im IFC für Archicad („RB 0,00 x 0,00“): drei Testvarianten von dir geprüft, keine hilft (29.10.). Entschieden: Export bleibt bei Öffnungen; Maße kommen mit echten Fenster-/Türbauteilen.
- Wandbewegung x/y/Achse abgleichen (seit 24.10.).

**Wartet auf deine Entscheidung**

- Speicher-/Lade-Brücke in `lib/bim/model.ts`: wo die Grenze zum Dateiformat liegen soll.

**Vor einer Veröffentlichung noch zu prüfen (fehlende Testumgebung)**

- Echter voller Speicher (Quota), mehrere Tabs gleichzeitig, Dauerlauf ≥ 2 Stunden, Grafikkarten- und Prozessspeicher.

**Bekannte kleine Punkte**

- `CadWorkspace.tsx` (≈ 1850 Zeilen) und `BimSolidView.tsx` sind groß; wird nur bei passenden Fachänderungen verkleinert.
- Sechs bekannte Lint-Warnungen in `components/ui`.
