# Anpassungsliste (ab 05.11.2026)

Nutzerauftrag 05.11.2026: 15 Punkte zur Bedienung, vor den weiteren Möbeln. Änderungskarte mit „Go“ freigegeben, die Empfehlungen gelten mit einer Änderung: Beim Abbruch einer Wandserie verschwinden alle noch nicht bestätigten Wände dieses Werkzeugansatzes.

| Paket | Punkte        | Inhalt                                                 | Stand    |
| ----- | ------------- | ------------------------------------------------------ | -------- |
| A     | 10, 12, 13–15 | Bestand-Grau, Navigator, Knöpfe, untere Leiste, Farben | erledigt |
| B     | 3, 3a, 11     | Rasterengine                                           | offen    |
| C     | 1, 6          | Klickfläche, Wahl bei Überlappung                      | offen    |
| D     | 2, 5          | Achslage beim Zeichnen, Abschluss am ersten Punkt      | offen    |
| E     | 4, 7          | Parameter übernehmen, Tür                              | offen    |
| F     | 9a–c          | Rechtsklickmenü, erst Befehl, dann Element             | offen    |
| G     | 8             | Größe von Feldern und Menüs                            | offen    |

## Paket A: Oberfläche

- **Bestand (10):** Wände und Stützen in der grauen Schnittfüllung sind deckend. Der Ton entspricht dem bisherigen Grau, nur scheinen Raster und darunterliegende Wände nicht mehr durch. Andere Schnitte (Decken, Schnittansichten) behalten ihre Darstellung.
- **Navigator (12):** Die Gebäudeeinstellungen öffnet nur noch der Doppelklick auf „Gebäudestruktur“. Ein Doppelklick auf das Arbeitsgeschoss zeigt weiter das Umbenennen.
- **Knöpfe oben rechts (13):** Orbit, Novikov AI, Voice und der Schalter für das Demand-Menü sind entfernt. Das Demand-Menü lässt sich nicht mehr abschalten und bleibt offen, wenn die Befehlszeile den Fokus bekommt. Es weicht weiter während einer Aktion, zum Beispiel beim Bewegen oder im Rechtsklickmenü. Escape schließt es zusammen mit der Auswahl.
- **Untere Leiste (14):** Schild, Zoom, Alles anzeigen, Maßstab, dann Grid, Rasterengine, Rasterfang, Ortho. Das „m“ ist entfernt.
- **Farben (15):** Eingeschaltete Schalter in der unteren Leiste und oben nehmen die Farbe der aktiven Piktogramme an (`--pikto-aktiv`, `active-control.ts`). Rasterfang hat dadurch erstmals eine sichtbare Einschaltfarbe.

**Abnahme im Browser (05.11.2026):**

| Schritt                         | Ergebnis                                               |
| ------------------------------- | ------------------------------------------------------ |
| Oberfläche laden                | Die vier Knöpfe fehlen, Navigator und Settings bleiben |
| Untere Leiste                   | Schild, Zoom, Maßstab, Grid, Rasterengine in Türkis    |
| Wand im Grundriss               | Deckendes Grau                                         |
| Doppelklick auf 1. Obergeschoss | Kein Einstellungsfenster                               |
| Doppelklick auf Gebäudestruktur | Fenster „Gebäudestruktur – Einstellungen“              |
