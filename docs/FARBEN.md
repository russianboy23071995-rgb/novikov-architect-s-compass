# Farben: eigenes Farbfenster und Standardpalette

Nutzerauftrag 07.11.2026: „können wir den farbwähler individualisieren? sprich als eigenes Fenster im Stil von unserem System?“ Dazu eine allgemeine Farbpalette mit jeder gängigen Farbe in verschiedenen Helltönen, Schwarz über Grautöne bis Weiß. Änderungskarte mit „Go“ freigegeben, F4 „Meine Farben“ eingeschlossen.

## F1 – Standardpalette

`src/application/pens/palette.ts`, fest im Programm, nicht in der Projektdatei. Neun Reihen zu sechs Tönen von dunkel nach hell:

| Reihe                                                 | Aufbau                                                                                                                                 |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Schwarz bis Weiß                                      | Schwarz, Grau 80 %, 60 %, 40 %, 20 %, Weiß (#000000, #333333, #666666, #999999, #cccccc, #ffffff)                                      |
| Rot, Orange, Gelb, Grün, Türkis, Blau, Violett, Braun | gleicher Farbton; Ton 3 ist die kräftige Grundfarbe, Ton 1 und 2 dunkler, Ton 4 bis 6 heller, die hellsten für Flächen und Schraffuren |

Jede Farbe hat einen Namen („Rot 3“), der beim Zeigen erscheint. Geprüft: jede Reihe wird Schritt für Schritt heller, ein Farbton bleibt in seiner Reihe gleich, keine Farbe kommt doppelt vor.

## F2 – Das Farbfenster

Ein Klick auf ein Farbfeld öffnet das Fenster „Farbe · …“ im Stil des Programms:

1. **Vorschau:** bisherige und neue Farbe nebeneinander.
2. **Standardpalette:** Klick übernimmt die Farbe.
3. **Meine Farben** (F4): siehe unten.
4. **Zuletzt verwendet:** die letzten 8 übernommenen Farben, neueste vorn.
5. **Stifteset · Inventar:** die Farben des Stiftesets wie bisher.
6. **Freie Farbe:** Fläche für Sättigung und Helligkeit, Regler für den Farbton. Beim Ziehen folgen Vorschau und HEX-Feld, beim Loslassen wird übernommen.
7. **HEX-Farbwert:** Eingabe mit Enter oder „Übernehmen“.

Escape schließt, ohne etwas zu ändern. Die gewählte Farbe ist in der Palette markiert.

## F4 – Meine Farben

„Neue Farbe merken“ legt die Farbe aus Fläche oder HEX-Feld in die Reihe „Meine Farben“, höchstens 16, ohne Doppelte. Ein kleines × beim Zeigen auf eine Farbe entfernt sie. „Meine Farben“ und „Zuletzt verwendet“ gehören zu diesem Browser (`color-memory.ts`), nicht zum Projekt. Ein anderer Rechner hat seine eigenen.

## Nachweis F1, F2, F4

Browser, Linienwerkzeug → Farbfeld: Das Fenster „Farbe · Linienfarbe“ zeigt Vorschau, neun Palettenreihen von „Schwarz bis Weiß“ bis „Braun“, „Meine Farben“, Stifteset-Inventar und Farbfläche. Klick auf „Rot 3“ übernimmt #e31c1c und schließt das Fenster. Beim nächsten Öffnen ist Rot 3 markiert und steht unter „Zuletzt verwendet“. HEX #12ab34 und „Neue Farbe merken“ legt sie unter „Meine Farben“ ab. Die Vorschau zeigt „Bisher #e31c1c · Neu #12ab34“. Escape schließt, die Linienfarbe bleibt #e31c1c. Danach habe ich die Linienfarbe auf #334155 zurückgesetzt und die Testfarben gelöscht.
