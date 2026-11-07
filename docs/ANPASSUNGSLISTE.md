# Anpassungsliste (ab 05.11.2026)

Nutzerauftrag 05.11.2026: 15 Punkte zur Bedienung, vor den weiteren Möbeln. Änderungskarte mit „Go“ freigegeben, die Empfehlungen gelten mit einer Änderung: Beim Abbruch einer Wandserie verschwinden alle noch nicht bestätigten Wände dieses Werkzeugansatzes.

| Paket | Punkte        | Inhalt                                                 | Stand    |
| ----- | ------------- | ------------------------------------------------------ | -------- |
| A     | 10, 12, 13–15 | Bestand-Grau, Navigator, Knöpfe, untere Leiste, Farben | erledigt |
| B     | 3, 3a, 11     | Rasterengine                                           | erledigt |
| C     | 1, 6          | Klickfläche, Wahl bei Überlappung                      | erledigt |
| D     | 2, 5          | Achslage beim Zeichnen, Abschluss am ersten Punkt      | erledigt |
| E     | 4, 7          | Parameter übernehmen, Tür                              | erledigt |
| F     | 9a–c          | Rechtsklickmenü, erst Befehl, dann Element             | erledigt |
| G     | 8             | Größe von Feldern und Menüs                            | erledigt |

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

## Paket E: Parameter und Tür

- **Doppelter Rechtsklick (4):** Zwei schnelle Rechtsklicks auf ein Element starten sein Werkzeug mit allen Parametern, auch wenn der erste Klick schon das Menü geöffnet hat. Das Menü erscheint ohne Verzögerung. Neu übernehmbar sind Tür, Decke, Dach, Raum und Maßkette. Der Deckendurchbruch startet nur sein Werkzeug, er hat keine Vorgaben. Weiter ohne Werte bleiben Bilder, Schnitte und Ähnliches, dort kommt die bekannte Meldung.
- **Tür (7):** Nach dem Setzen wählt die Maus beides. Quer zur Wand die Seite, zu der die Tür aufgeht, längs zur Wand den Anschlag: Das offene Türblatt steht auf der Seite des Mauszeigers. Innerhalb von 10 cm um die Türmitte gilt der Anschlag aus dem Feld. Die Vorschau zeigt das Ergebnis, das Modell bleibt unverändert.

**Abnahme im Browser (05.11.2026):**

| Schritt                                 | Ergebnis                                 |
| --------------------------------------- | ---------------------------------------- |
| Tür gesetzt, Maus unten links           | Aufschlag unten, Türblatt links          |
| Maus unten rechts                       | Aufschlag unten, Türblatt rechts         |
| Maus oben rechts, Klick                 | Tür oben, Türblatt rechts, Tür im Modell |
| Zwei schnelle Rechtsklicks auf die Wand | Wandwerkzeug mit den Werten der Wand     |

**Grenzen E:** Im Browser ist nur die Wand übernommen worden, Tür, Decke, Dach, Raum und Maßkette nur teils über Tests. Im 3D-Fenster gibt es den doppelten Rechtsklick nicht.

## Paket F: Menü und Bewegen

- **Darstellungsreihenfolge (9a):** Ein Eintrag mit Pfeil, der Klick öffnet rechts ein eigenes Fenster mit den vier Varianten. Am rechten Fensterrand öffnet es nach links. Warum es „nicht ging“: Die Reihenfolge wirkt nur innerhalb einer Elementart, Linie gegen Linie oder Schraffur gegen Schraffur. Zwischen den Arten steht sie fest, und liegt ein Element allein in seiner Art, bleiben alle vier Einträge grau. Der Hinweis am Eintrag sagt das jetzt.
- **Tastenanzeige (9b):** „Bewegen Strg+E | + Kopie: Strg+E+Strg“, ebenso für Drehen und Spiegeln, immer aus den Kürzeln des Projekts. Spiegeln bleibt Strg+M, denn Strg+T öffnet im Browser einen neuen Tab, und die Seite erhält die Taste nie.
- **Erst Befehl, dann Element (9c):** Ohne Auswahl wartet Strg+E, Strg+D oder Strg+M auf den nächsten Klick auf ein Element. Dieser Klick wählt das Element und ist zugleich der Bezugspunkt, der Drehpunkt oder der erste Achspunkt. Ein Klick ins Leere ändert nichts, Escape bricht ab. Die Einträge im Rechtsklickmenü funktionieren genauso. Mit bestehender Auswahl läuft alles wie bisher, sonst wäre eine Mehrfachauswahl nicht bewegbar.

**Abnahme im Browser (05.11.2026):**

| Schritt                                       | Ergebnis                                      |
| --------------------------------------------- | --------------------------------------------- |
| Keine Auswahl, Strg+E                         | Hinweis „Bewegen: Punkt am Element anklicken“ |
| Klick auf die Wand, Maus runter, Klick        | Wand mit Fenster versetzt                     |
| Keine Auswahl, Strg+D, Klick, zwei Richtungen | Wand um 90° um den Klickpunkt gedreht         |
| Rechtsklick, Darstellungsreihenfolge          | Pfeil, Klick öffnet rechts die vier Einträge  |

**Grenzen F:** Die Reihenfolge zwischen Elementarten ist nicht gebaut, sie braucht einen Umbau der festen Zeichenfolge im Grundriss und eine eigene Karte. Der Hinweis nach dem Befehl verschwindet nach kurzer Zeit, der Befehl wartet trotzdem weiter.

## Paket G: Größen

- **Felder (8):** Eingabefelder und Auswahllisten sind einheitlich 24 Pixel hoch mit 11 Pixel Schrift, ihre Beschriftungen ebenfalls 11 Pixel. Die Werte stehen an einer Stelle in `styles.css` (`--field-height`, `--field-font`) und gelten für alle rund 190 Felder, auch künftige.
- **Menüs (8):** File, Edit, View, Insert, Modify, Tools und Organisation sind 24 Pixel hoch mit 11 Pixel Schrift. Die Einträge aller Klappmenüs und das Rechtsklickmenü sind entsprechend kleiner.
- **Unverändert:** die Kategorietitel links in den Einstellungsfenstern, Kontrollkästchen, Farbfelder und die Befehlszeile unten.

**Abnahme im Browser (05.11.2026):** Werkzeugleiste, File-Menü und Wandeinstellungen sehen stimmig aus, die Kategorien links sind unverändert.

**Grenzen G:** Nicht jedes der rund 40 Fenster ist einzeln angesehen. Knöpfe in Fenstern sind nicht verkleinert.

## Nachbesserung nach der Prüfung durch den Nutzer

- **Shift an der Ecke (3a):** Die erste Fassung griff nur, wenn Shift gedrückt wurde, bevor die Maus an der Ecke stand. Stand die Maus schon dort, rastete die Richtung auf die nächste 45°-Achse ein, bei 24° also auf die Diagonale. Jetzt läuft die Wand parallel zur Kante dieser Ecke und endet auf ihrer Höhe. Die erste Abnahme hatte genau diesen Ablauf nicht geprüft.
- **Fehler „Tür door-… unbekannte Wand“:** Beim Zeichnen freier Wände prüft das Programm eine verkleinerte Kopie des Geschosses ohne Wände. Die Türen blieben darin stehen und zeigten auf fehlende Wände. Jede Richtung außerhalb der Fangachsen endete deshalb im Fehler, sobald das Projekt eine Tür hatte. Das galt auch für den zweiten Wandabschnitt, für Linien und für Griffe an Schraffuren. Die Türen sind jetzt aus dieser Kopie entfernt.
- **Schnitt- und Ansichtslinie (11):** Beim Zeichnen im Grundriss fehlte der Linie ein Ursprung, Shift hatte deshalb keine Wirkung. Der Anfangspunkt ist jetzt Ursprung, Shift hält die Linie waagerecht, senkrecht oder im 45°-Raster. Die Fangregeln und Hilfslinien gelten wie beim Zeichnen von Wänden.

**Abnahme im Browser (05.11.2026):**

| Schritt                                               | Ergebnis                                |
| ----------------------------------------------------- | --------------------------------------- |
| Wandanfang, Maus an die Endecke, dann Shift, Klick    | Wand waagerecht, gleich lang wie Wand 1 |
| Projekt mit Tür, Wand in freier Richtung, zweite Ecke | Vorschau läuft, keine rote Meldung      |
| Ansichtslinie, Shift, Maus schräg nach unten          | Linie bleibt bei 0°                     |

**Grenzen:** Steht die Maus beim Shift-Druck nicht an einer Ecke, gilt weiter die nächste 45°-Achse. Wird Shift schon vor dem ersten Klick gehalten, entscheidet die erste Mausbewegung über die Richtung.

**Meldung „Parallele Wände können keinen T-Anschluss bilden“ (Nachtrag):** Sie und die verwandte Meldung „Kontaktbreite berührt oder überschreitet das Hauptwandende“ erscheinen beim Zeichnen und Bearbeiten nicht mehr, und die Wand verschwindet nicht mehr aus der Vorschau. Kann kein T entstehen, bleibt die Wand frei. Ein T über den Befehl im Menü lehnt das Programm weiter mit der Meldung ab.

## Gerade Wandkette

- **Fehler:** Eine gerade Wandserie mit einem Zwischenpunkt brach mit „Keine gültige Gehrung“ ab, denn zwei Wände in einer Flucht haben keinen Gehrungsschnitt. Das Programm verlangte deshalb einen Richtungswechsel.
- **Behebung:** Der Eckanschluss kennt jetzt den geraden Stoß. Beide Wände enden rechtwinklig am Zwischenpunkt und bleiben verbunden, in jeder Richtung. Bei unterschiedlicher Stärke endet jede Wand mit ihrem eigenen Querschnitt. Eine Wand, die auf sich selbst zurückläuft, bleibt verboten.

**Abnahme im Browser (05.11.2026):** Drei Punkte auf einer Linie, Enter: zwei Wände, keine Meldung, die Fuge ist nicht sichtbar.

**Grenzen:** Stärkenwechsel im geraden Stoß und schräge Fluchten sind nur teils über Tests belegt, im Browser lief nur die waagerechte Wand gleicher Stärke.

## Nachträge 07.11.2026

Nutzerauftrag 07.11.2026, vier Punkte: Höhenlinien fangen, Zahl tippen als Länge, Tab-Wahl beim Doppelklick, Stützen in der Wohnfläche.

### T1 – Tab-Wahl bleibt beim Doppelklick

Vorher: Mit Tab ließ sich unter mehreren Elementen das untere wählen, ein Doppelklick öffnete trotzdem das Fenster des obersten. Der erste Klick des Doppelklicks löste die Tab-Wahl auf, der zweite wählte wieder das oberste Element.

Jetzt: Liegt das gewählte Element unter der Maus, behält der zweite Klick des Doppelklicks die Wahl, und das Fenster gehört zu ihm (`selectedUnder` in `src/application/selection/cycle.ts`, `BimPlan.tsx`). Ohne Tab ändert sich nichts: Der erste Klick wählt das oberste Element, der Doppelklick öffnet dessen Fenster.

Nachweis im Browser, Wand quer durch einen Raum: Maus auf die Überlappung, zweimal Tab wählt den Raum, Doppelklick öffnet „Raum R-001 Raum – Einstellungen“. Gegenprobe ohne Tab: Doppelklick auf die Wand wählt die Wand.

### E1 – Zahl tippen ist Länge in Mausrichtung

Vorher: Nach dem ersten Klick musste man Tab drücken oder ins Feld klicken, bevor eine Länge ging.

Jetzt: Steht ein Werkzeug nach dem ersten Klick, geht eine getippte Ziffer, ein Komma, ein Punkt oder ein Minus sofort ins Längenfeld des Eingabefensters und beginnt dort einen neuen Wert. Die Richtung folgt weiter der Maus, Enter setzt den Punkt. Ist ein Winkel eingetragen, bleibt er fest. Bei Werkzeugen mit nur einem Winkelfeld, etwa Drehen, geht die Ziffer dorthin.

Das gilt an einer Stelle (`PrecisionInput.tsx`, `startsTypedValue`) für alle Werkzeuge mit Eingabefenster: Wand, Linie, Polylinie, Geländer, Schraffur, Decke, Deckenöffnung, Raum als Polygon oder Rechteck, Dach, Geländeumriss, Verschieben, Kopieren, Drehen, Spiegeln und Griffe. Mit Strg, Alt oder Meta bleibt eine Ziffer ein Tastenkürzel. Steht der Cursor in einem anderen Eingabefeld, etwa in der Werkzeugleiste, gehört die Ziffer dorthin.

Nachweis im Browser, Linienwerkzeug: erster Klick, Maus in eine Richtung, Tasten „2“, „,“, „5“ ohne Tab. Das Längenfeld zeigt „2,5“ und hat den Fokus, die Richtung folgt weiter der Maus. Enter setzt den Punkt, Enter auf der Zeichenfläche beendet die Linie. Die gespeicherte Linie misst 2,500 m. Grenze der Testumgebung: Ihr Befehl „Text tippen“ fügt Text ohne Tastendrücke ein und löst die Eingabe daher nicht aus. Echte Tasten tun es.

### H1 – Höhenlinien fangen

Vorher: Die Höhenlinien der Räume (Vorgabe 1,00 und 2,00 m lichte Höhe unter Dachschrägen) waren nur Zeichnung, die Maus fing nicht auf ihnen.

Jetzt: Anfang, Ende und Mitte jedes Stücks einer Höhenlinie sind Fangpunkte, mit der Richtung der Linie für Verlängerungen und Schnitte mit Wänden, Linien und anderen Kanten. Sie folgen dem Schalter „Rasterengine“ in der Statusleiste und der Sichtbarkeit des Raums. Ändern sich Dach oder Decke darüber, rechnet der Fang die Linien neu (`heightLineParts` in `src/application/snapping/project-references.ts`).

Grenze: Ein beliebiger Punkt mitten auf einer Linie ist kein Fangziel. Das kennt der Fang heute für keine Linie und wäre eine eigene Erweiterung.

Nachweis im Browser, Raum 5 × 4 m unter einem Pultdach 45° mit Höhenlinien bei y = 0,5 und 1,5 m: Linienwerkzeug, Maus an das linke Ende der 1,00-m-Linie (0 | 0,5). Der Fang zeigt den Punkt, an dieser Stelle der Raumkante gibt es sonst keinen. In der Mitte der 2,00-m-Linie (2,5 | 1,5) zeigt er „Mittelpunkt“. Die Fangbeschriftung heißt jetzt „Raum · Höhenlinie“ statt „Raum · Punkt“.
