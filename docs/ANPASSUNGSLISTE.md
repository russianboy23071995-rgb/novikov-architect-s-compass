# Anpassungsliste (ab 05.11.2026)

Nutzerauftrag 05.11.2026: 15 Punkte zur Bedienung, vor den weiteren Möbeln. Änderungskarte mit „Go“ freigegeben, die Empfehlungen gelten mit einer Änderung: Beim Abbruch einer Wandserie verschwinden alle noch nicht bestätigten Wände dieses Werkzeugansatzes.

| Paket | Punkte        | Inhalt                                                 | Stand    |
| ----- | ------------- | ------------------------------------------------------ | -------- |
| A     | 10, 12, 13–15 | Bestand-Grau, Navigator, Knöpfe, untere Leiste, Farben | erledigt |
| B     | 3, 3a, 11     | Rasterengine                                           | erledigt |
| C     | 1, 6          | Klickfläche, Wahl bei Überlappung                      | erledigt |
| D     | 2, 5          | Achslage beim Zeichnen, Abschluss am ersten Punkt      | erledigt |
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

## Paket B: Rasterengine

- **Referenzpunkt (3):** Die Standardzeit beträgt 1,0 Sekunden, in Grundriss und 3D. Die Auswahl in den Einstellungen bleibt.
- **Shift und Ecke (3a):** Liegt der Mauszeiger bei gehaltener Shift-Taste an einer Ecke neben der Achse, endet die Linie auf Höhe dieser Ecke, nämlich im Lotpunkt auf der Achse. Eine gedachte Hilfslinie zeigt den Bezug, die Meldung heißt „Achsenschnittpunkt“. Es gilt für alle Werkzeuge mit Shift. Die Ecke muss dafür nicht erst als Referenz gebildet sein. Eine feste Bearbeitungsachse rastet weiter nur an exakten Punkten.
- **Ansicht und Schnitt (11):** Der Fang dort läuft jetzt über dieselbe Rasterengine. Der Schalter unten wirkt, Shift hält die Richtung und rastet wie im Grundriss an Ecken. Einziges Zeichenwerkzeug dort ist die Höhenkote.

**Abnahme im Browser (05.11.2026):** Wandanfang unter dem Beginn der Bestandswand, Shift, Mauszeiger an die Endecke: Die neue Wand rastet auf 3 m ein, parallel und gleich lang.

**Grenzen B:** Ansicht und Schnitt sind nur über Tests geprüft, das Testprojekt hatte keine. Dort gibt es keine Referenzpunkte per Verweilen und keinen Rasterfang.

## Paket C: Auswählen

- **Klickfläche (1):** Die Ursache lag nicht beim Rechteck. Die Klickflächen hatten eine unsichtbare Linie der Standardbreite 1, und im Grundriss ist das 1 Meter. `pointer-events="all"` zählt diese Linie mit, jede Fläche war ringsum 50 cm zu groß. Das betraf Objekte, Treppen und Dächer. Die Linienbreite steht dort jetzt auf 0.
- **Teile statt Rechteck (1):** Objekte mit Bauregel sind nur noch auf ihren Teilen wählbar (`objectPickRings`). Teile innerhalb eines größeren Teils entfallen, sodass auch Fugen zwischen Polstern treffen. Lücken zwischen Tisch und Stühlen wählen nichts. Einträge ohne Regel behalten ihr Rechteck.
- **Überlappung (6):** Die Wahl mit Tab bleibt bestehen (`cycle.ts`, `pin`). Sie gilt, wo immer der Mauszeiger im gewählten Element steht, auch wenn dort andere Elemente dazukommen oder es allein liegt. Außerhalb wartet sie und gilt beim Zurückkehren wieder. Der nächste Klick ins Element wählt genau dieses, jeder Klick und Escape beenden die Wahl.

**Abnahme im Browser (05.11.2026):**

| Schritt                                                    | Ergebnis          |
| ---------------------------------------------------------- | ----------------- |
| Sofa 45° gedreht, Klick 60 Pixel daneben (vorher: Treffer) | Keine Auswahl     |
| Klick knapp neben die Kante                                | Keine Auswahl     |
| Klick auf das Sofa                                         | Sofa gewählt      |
| Zweites Sofa darüber, Tab, Tab, Maus weiter, Klick         | Das gedrehte Sofa |

**Grenzen C:** Treppen und Dächer sind nur im Code angepasst, nicht im Browser nachgeklickt. Die Liste folgt weiter dem Mauszeiger und wird mit Tab bedient, ihre Zeilen sind nicht anklickbar.

## Paket D: Zeichnen

- **Achslage (2):** Gilt je Ansatz des Wandwerkzeugs. Ist nur der Startpunkt gesetzt, übernimmt die Serie die neuen Werte und läuft weiter. Ist schon eine Wand gesetzt, bricht die Serie ab, und alle noch nicht bestätigten Wände dieses Ansatzes verschwinden. Bestätigte Wände bleiben. Dasselbe gilt für Stärke, Höhe, Versatz und Ebene.
- **Abschluss am ersten Punkt (5):** Ein Klick auf den ersten Punkt schließt ab, sobald drei Punkte stehen. Die Regel bleibt zentral in `path-closure.ts`. Neu dabei sind Wandserie und Geländer, bisher schon Polygon, Schraffur, Decke, Durchbruch, Dach, Raum und Polylinie. Der Startpunkt fängt im Umkreis von 10 Pixeln vor allen anderen Fangpunkten, der Ring am Startpunkt zeigt das an.
- **Meldungen (5):** Zu wenige Punkte am Start ergeben einen kurzen Hinweis statt einer Eckpunkt-Dublette. Ein zweiter Klick auf denselben Punkt wird still übergangen. Decke und Schraffur nennen den echten Grund, der Zusatz „Nach Modelländerung erneut beginnen“ entfällt.

**Abnahme im Browser (05.11.2026):**

| Schritt                                 | Ergebnis                                  |
| --------------------------------------- | ----------------------------------------- |
| Wandanfang, Achslage auf Innen          | Serie läuft weiter, Wände innen           |
| Drei Ecken, Klick auf die erste Ecke    | Vier verbundene Wände, keine rote Meldung |
| Neue Serie, zwei Wände, Achslage ändern | Serie weg, Modell unverändert             |

**Grenzen D:** Das Geländer ist im Browser nicht geschlossen worden. Einzelne Linie und Dachbezugslinie haben keinen Abschluss, sie haben nur zwei Punkte.
