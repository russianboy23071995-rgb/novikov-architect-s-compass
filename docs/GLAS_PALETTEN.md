# Glas-Paletten über einer durchgehenden Zeichenfläche (G1–G4, 31.10.2026)

Nutzervorgabe: Navigator, Werkzeugeigenschaften und Werkzeugkasten sollen den milchig-gläsernen, leicht transparenten Stil der Einstellungsfenster haben; die Zeichenfläche läuft überall durch, die Paletten liegen darüber.

- **G1 Durchgehende Fläche** (`CadWorkspace.tsx`): Unter der Menüleiste füllt eine Bühne den ganzen Bereich bis zur Statusleiste. Die Ansicht (2D, eine Ansicht) reicht über die ganze Bühne; Werkzeugeigenschaften (oben, 130 px), Werkzeugkasten (links) und Navigator (rechts) schweben darüber. Menüleiste und Statusleiste bleiben fest.
- **G2 Glas**: Alle drei Paletten nutzen `glass-panel-strong` wie die Einstellungsfenster (82 → 64 % Weiß, 40 px Weichzeichnung). Linien und Wände darunter schimmern milchig durch; feine Rasterlinien verschwinden in der Weichzeichnung.
- **G3 Bedienung**: Navigator per Griff am linken Rand in der Breite ziehbar (240–560 px, Vorgabe 320 px, im Browser gemerkt: `novikov.navigator.width`), schließen/öffnen wie bisher; Werkzeugkasten ein-/ausklappbar; Vollbild unverändert (nur die Werkzeugeigenschaften bleiben). Geteilte Ansichten (2–4) liegen im freien Bereich zwischen den Paletten, nicht darunter; 3D ebenfalls im freien Bereich, nur der Hintergrund läuft durch.
- **G4 Freier Bereich** (`palette-layout.ts`, `fitPlanInset` in `plan-camera.ts`): Die Paletten-Ränder werden als Einrückung berechnet. „Einpassen“, „Ansicht zurücksetzen“ und das erste Laden setzen die Zeichnung mittig in den freien Bereich; Ansichtskopf, Zoom-Knöpfe, Maßstab, Achsen, Hinweise und die Befehlszeile liegen dort. Die Knöpfe „Navigator öffnen“ und „Exit fullscreen“ sitzen eine Zeile unter den Ansichtsknöpfen (vorher überdeckten sie den Vollbild-Knopf).
- Hilfsfenster (On-Demand-Menü, Eingabe) erscheinen weiter am Mauszeiger oder an ihrer gemerkten Stelle und können über einer Palette liegen.
- Testlauf: Die Testliste stand in der Befehlszeile von `npm test` und überschritt mit den neuen Tests die Windows-Grenze von 8191 Zeichen. Sie steht jetzt in `package.json` unter `testFiles`, `npm test` startet `scripts/run-tests.mjs` (AGENTS.md angepasst).

Nachweis: 1385 Tests grün (3 neu), Typprüfung/Lint/Architektur sauber, 14-Modell-Hash unverändert (`089f79e4…97017b3`). Browser-Abnahme: Wand unter dem Navigator schimmert durch, Einpassen mittig im freien Bereich, Navigatorbreite ziehen und merken, Werkzeugkasten einklappen, Navigator schließen/öffnen, Vollbild, 3D, zwei Ansichten.

## UI1 – Zoom, Leisten, schwarze Beschriftungen (02.11.2026)

Nutzerauftrag: Zoom im Layoutbuch endete bei 264 %. Werkzeugleiste und Navigator liegen auf gleicher Höhe unter der Werkzeugeigenschaften-Leiste; diese verliert die Hälfte ihrer Höhe und geht komplett von links nach rechts durch; alle Inhalte in einer Zeile, sonst seitlich scrollbar. Alle Beschriftungen schwarz statt grau.

- **Zoom:** Grenze 100 000 statt 10 000 Bildschirmpixel pro Meter (`MAX_PLAN_SCALE`). Auf dem Papier (100 % = 3 780 px/m) reicht das bis etwa 2 646 %, im Grundriss bis 100 000 %. Die Zoom-Auswahl bietet zusätzlich 800, 1 000 und 2 000 %. Ein Abbild speichert seinen Zoom weiter höchstens mit 10 000 px/m (`MAX_FRAMING_SCALE`, kein Schemawechsel); Mitte und Ausschnittgröße bleiben exakt.
- **Werkzeugeigenschaften:** über die volle Breite, 65 statt 130 px hoch, eine Zeile. Was nicht passt, scrollt seitlich, auch mit dem Mausrad. Felder, die anderswo umbrechen (`flex-wrap`) oder in Rastern stehen, bleiben hier in der Zeile.
- **Werkzeugleiste und Navigator** beginnen beide unter der Werkzeugeigenschaften-Leiste und reichen bis unten.
- **Beschriftungen schwarz:** Der gemeinsame Grauton der Oberfläche (`--muted-foreground`) ist jetzt das Schwarz der Schrift. Hilfslinien in der Zeichnung (Papierrand, Randrahmen) bleiben grau.

Nachweis UI1: 1520 Tests grün (neu: Zoom bis 2 000 % auf Papier und Stopp an der Grenze, Abbild-Ausschnitt bei tiefem Zoom; Palettenmaße mit 65 px). Typprüfung, Architektur, Lint, Formatierung, 14-Modell-Prüfsumme unverändert. Browser: Werkzeugeigenschaften einzeilig bei Wand (seitlich scrollbar), Schraffur, Maßkette, Text und ausgewählter Wand; Werkzeugleiste und Navigator oben bündig; Masterlayout auf 2 000 %, mit dem Mausrad bis 2 645,8 %. Gefunden und behoben: Beim Öffnen eines Layouts über 10 000 px/m stürzte die Ansicht ab, weil der Abbild-Ausschnitt nur 10 000 px/m speichern darf; jetzt begrenzt nur dieser gespeicherte Wert.

## UI2 – Scrollbalken (02.11.2026)

Nutzerwunsch (in einer abgezweigten Sitzung freigegeben, nach ZW3 umgesetzt): „jegliche scrollbars bitte als nicht sichtbar oder weit aus minimaler darstellen, als sie jetzt sind.“

- **Alle Scrollbalken** (zentrale Regel in `src/styles.css`): 4 px, ohne Pfeile und ohne Spur. Der Griff ist unsichtbar, solange die Maus nicht über dem Bereich ist, darüber blass (22 % Schriftfarbe) und beim Anfassen kräftiger (50 %). Firefox bekommt die schmale Standardform.
- **Werkzeugeigenschaften-Leiste:** gar kein Balken (`scrollbar-none`). Sie scrollt per Mausrad (seit UI1), Touchpad oder Ziehen an einer freien Stelle (nicht auf Feldern und Knöpfen). Auf der Seite, auf der es weitergeht, blendet der Inhalt auf 28 px aus (`edge-fade`, `data-more` = right/left/both). Das Glasfeld selbst bleibt scharf; ausgeblendet wird nur die innere Zeile.
- **Navigator und andere `ScrollArea`-Bereiche:** Balken 4 statt 10 px, ohne Rand, nur bei Mausnähe (Radix „hover“), Griff blass, beim Anfassen kräftiger.

Nachweis UI2: 1521 Tests grün, Typprüfung, Architektur, Lint, Formatierung, 14-Modell-Prüfsumme unverändert.

Browser:
- Wand-Werkzeug: Inhalt 2 354 px bei 1 727 px Breite, Balkenhöhe 0 px, Ausblendung rechts
- Mausrad 300 px → Ausblendung beidseitig, am Ende nur links
- Ziehen an der Überschrift scrollt die Leiste (88 px)
- Ein Bereich mit Überlauf misst einen Balken von 4 × 4 px (vorher Standardbreite des Browsers)

Nicht im Browser gesehen: der Navigator-Balken selbst, weil die Testansicht nicht genug Einträge hatte (die 4-px-Klasse ist im geladenen Modul geprüft). Ein Einstellungsfenster mit Überlauf kam im Test ebenfalls nicht vor.
