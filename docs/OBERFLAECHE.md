# Oberfläche entschlackt (U1)

Nutzervorgabe (01.11.2026): Doppelte und überflüssige Anzeigen entfernen.

## Entfernt

- **Kopfleiste:** der Umschalter 2D/3D – die Ansichts-Tabs über dem Canvas ersetzen ihn (Grundriss und 3D-Ansicht über „+“). Grid und SNAP stehen nur noch unten in der Statusleiste.
- **Canvas oben links:** die Plakette mit Ansicht und Plan (z. B. „2D · …“) und der Infotext („Mausrad: Zoom · Mittlere Maustaste …“, auch die Zeichen- und 3D-Bearbeitungshinweise an dieser Stelle).
- **Canvas unten rechts:** der Ansichtswürfel (TOP/FRONT/RIGHT), in 2D und 3D; die zugehörigen Stile in `src/styles.css`.
- **KI-Befehlsleiste:** die Zeile „Lokale Modellbefehle · Auswahl“, die Liste der möglichen Befehle, der Aufnahmehinweis und die Hinweise bei Schraffur und Linie. Es bleiben Eingabefeld, Mikrofon und Senden; Fehler, Meldungen, die Befehlsvorschau und der Kalibrierhinweis bei Bildreferenzen erscheinen weiter, wenn sie gebraucht werden.

## Umsetzung

`TopToolbar.tsx` (Eigenschaften `mode`, `grid`, `snap`, `onMode`, `onGrid`, `onSnap` entfallen), `CadWorkspace.tsx` (Aufruf angepasst), `CadViewport.tsx`, `AiCommandBar.tsx`, `styles.css`. Kein Modell- oder Dateiformatwechsel.

## Nachweis

1464 Tests grün, Typprüfung beider Projekte, Architektur, Lint und Prettier sauber, 14-Modell-Hash unverändert (`089f79e4…`). Browser-Abnahme im Grundriss: Kopfleiste ohne 2D/3D, Grid und SNAP; Statusleiste unten mit Grid und SNAP; Canvas ohne Plakette, Infotext und Würfel; KI-Leiste nur Eingabe mit zwei Knöpfen; das „+“-Menü bietet „3D-Ansicht“. Die 3D-Ansicht selbst wurde im Browser nicht geöffnet (der Nutzer arbeitete gleichzeitig im Fenster); der Würfel ist dort durch dasselbe entfernte Element weg.
