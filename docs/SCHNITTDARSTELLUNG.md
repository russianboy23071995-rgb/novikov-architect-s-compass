# Schnittdarstellung: Farbe geschnittener Bauteile (S1, 31.10.2026)

Nutzervorgabe: Manche Architekten wollen geschnittene Wände grau (wie bisher), andere schwarz, andere weiß; zusätzlich eine frei wählbare Farbe. Die Einstellung wird gemerkt und ist unter **View → „Darstellung…“** erreichbar.

- `src/components/cad/cut-fill.ts`: Modi Grau (Vorgabe, bisheriges Aussehen: Themenfarbe mit 55 % Deckkraft), Schwarz, Weiß (deckend weiß, sichtbar bleibt nur die Kontur) und Eigene Farbe (Farbwähler, deckend). Gespeicherte Werte werden geprüft; Unbekanntes fällt auf Grau zurück.
- Gilt für alle geschnittenen Bauteile in Schnitthöhe (1 m) im Grundriss: Wände und Dachschnitte. Decken werden im Grundriss weiterhin nur als Kontur gezeigt (Nutzerentscheidung 29.10.2026) und bekommen die Farbe, sobald sie geschnitten dargestellt werden.
- Darstellungseinstellung, kein Teil des Projekts und kein Rückgängig-Schritt; gespeichert in diesem Browser (`novikov.canvas.cut-fill`) wie die Konturstärke. Das Fenster „Canvas-Darstellung“ heißt jetzt „Darstellung“ und enthält beide Einstellungen.
- Nächster Schritt S2: Bauzustand der Wände (Bestand/Neubau/Abbruch); Bestand nutzt diese Schnittfarbe.

Nachweis: 1377 Tests grün (3 neu), Typprüfung/Lint/Architektur sauber, 14-Modell-Hash unverändert. Browser-Abnahme: alle vier Modi im Grundriss, Vorschau im Fenster, Farbe bleibt nach dem Neuladen, Testprojekt mit Dach. Ein Dachschnitt war im Testprojekt nicht vorhanden (Dach über 1 m); er nutzt dieselbe Farbfunktion wie die Wand.
