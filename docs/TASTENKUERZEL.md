# Tastenkürzel und Bewegungssteuerung (ab 04.11.2026)

Nutzerauftrag 04.11.2026: Bewegen, Drehen und Spiegeln für alle Elemente über Tastenkürzel, jeweils auch als Kopie, dazu ein Fenster für die Kürzel, das mit dem Projekt gespeichert wird. Vor L44 O2 umzusetzen. Änderungskarte mit „Go“ freigegeben.

| Teil | Inhalt                                                                          | Stand    |
| ---- | ------------------------------------------------------------------------------- | -------- |
| B1   | Kürzelliste, Fenster Edit → Tastenkürzel, Dateiformat 58, Strg+E, Kopie bewegen | erledigt |
| B2   | Drehen Strg+D mit Kreis 0–360°, Tab-Eingabe, Umschalt 45°, Kopie                | erledigt |
| B3   | Spiegeln Strg+M über Achse mit Vorschau, Umschalt 45°, Kopie                    | erledigt |
| B4   | Abgleich mit den Objekten (Möblierung)                                          | erledigt |

Entscheidungen aus der Karte:

- **Spiegeln:** Standard Strg+M statt Strg+T, weil der Browser Strg+T für einen neuen Tab behält und die Seite den Tastendruck nie erhält.
- **Drehen:** drei Klicks, nämlich Drehpunkt, Bezugsrichtung und Zielrichtung.
- **Wo die Kürzel gelten:** nur im Grundriss.
- **Drehen nach Elementart:** Maßketten drehen nur in 90°-Schritten, Dachflächenfenster nur mit ihrem Dach, das Schraffurmuster dreht nicht mit.
- **Spiegeln nach Elementart:** Bilder werden nicht gespiegelt, Texte bleiben lesbar.

## Teil B1

- **Befehlsliste** (`src/domain/hotkeys/model.ts`, `HOTKEY_COMMANDS`): 17 Befehle in drei Gruppen.
  - **Bewegen:**
    - Bewegen: Strg+E
    - Drehen: Strg+D
    - Spiegeln: Strg+M
    - Kopie umschalten: Strg allein
  - **Bearbeiten:**
    - Kopieren: Strg+C
    - Ausschneiden: Strg+X
    - Einfügen: Strg+V
    - Löschen: Entf
    - Rückgängig: Strg+Z
    - Wiederholen: Strg+Y
    - Alles auswählen: Strg+A
  - **Werkzeuge:**
    - Auswahl: V
    - Wand: W
    - Decke: S
    - Linie: L
    - Schraffur: H
    - Tür: T

  Die bisher fest eingebauten Tasten laufen alle über diese Liste. Fest dazu kommen die Rücktaste für Löschen und Strg+Umschalt+Z für Wiederholen.

- **Schreibweise:** Ein Kürzel wird als „Ctrl+Shift+E“ gespeichert, die Modifikatoren in der Reihenfolge Ctrl, Shift, Alt und danach eine Taste:
  - A–Z
  - 0–9
  - F1–F12
  - Entf, Rücktaste, Einfg, Pos1, Ende, Bild↑, Bild↓, Leertaste, Eingabe

  Cmd auf dem Mac zählt als Strg. Der Kopie-Schalter ist ein Modifikator allein, Strg oder Alt.

- **Dateiformat 58:** `hotkeys` im Projekt enthält nur die geänderten Kürzel. Ein Kürzel, das wieder dem Standard entspricht, wird entfernt. Neue Befehle erhalten so später ihren Standard.
  - Das Schema lehnt ab:
    - falsch geschriebene Kürzel
    - unbekannte Befehle
    - zwei Befehle mit demselben Kürzel
  - Eine 57er Datei lädt mit den Standardkürzeln. Eine 57er Datei mit untergeschobenen Kürzeln wird abgelehnt.
- **Fenster Edit → Tastenkürzel…** (`HotkeySettings.tsx`):
  - Bedienung: Ein Klick auf ein Kürzel nimmt den nächsten Tastendruck auf. Esc bricht ab. Ein Modifikator allein zählt nur beim Kopie-Schalter.
  - Belegte und gesperrte Kürzel:
    - Ein Kürzel, das schon belegt ist, wird mit dem Namen des anderen Befehls abgelehnt.
    - Kürzel, die der Browser für sich behält, erzeugen einen Hinweis und sind rot markiert: Strg+T, Strg+N, Strg+W und dieselben mit Umschalt.
  - Zurücksetzen: ↺ setzt eine Zeile auf den Standard, „Alle auf Standard“ setzt alle zurück.
  - Rückgängig: Jede Änderung ist ein Schritt, Strg+Z nimmt sie zurück.
  - Drehen und Spiegeln stehen schon in der Liste, mit „(folgt)“ markiert.
- **Strg+E:** startet für die Auswahl „Element frei bewegen“, nur im Grundriss. Der Mausklick setzt die Auswahl ab, Tab öffnet die Eingabe von Länge und Winkel, Esc bricht ab. Ohne Auswahl erscheint „Erst ein Element auswählen.“
- **Kopie bewegen** (`application/selection/copy-transform.ts`):
  - Umschalten: Strg während des Bewegens schaltet auf Kopie. Neben dem Cursor erscheint dann ein „+“ (`CopyCursorBadge.tsx`). Ein weiteres Strg schaltet zurück.
  - Absetzen: Das Original bleibt stehen, die Kopie entsteht mit neuen IDs am Ziel und ist danach ausgewählt.
  - Was mitkommt: Fenster und Türen kommen mit ihrer Wand, Wandanschlüsse unter den kopierten Wänden bleiben erhalten. Das läuft über denselben Weg wie Kopieren und Einfügen.
  - Rückgängig: ein Schritt.
- **Rechtsklick-Menü:** Der erste Eintrag ist „Bewegen“, mit dem eingestellten Kürzel und „danach Strg: Kopie“.
- **Auswahl neuer Elemente:** Kopie bewegen und Einfügen prüfen die neue Auswahl gegen das gerade übernommene Modell (`selectCommitted` nimmt jetzt auch mehrere Ziele). Vorher fiel die Auswahl der neuen IDs weg, weil sie gegen das Modell vor der Änderung geprüft wurde.

### Abnahme im Browser (04.11.2026)

Testprojekt mit 17 Objekten.

- **Bewegen mit Strg+E:** Strg+E startet das Bewegen am Herd, die Vorschau folgt der Maus, der Klick setzt ab. Fanghinweis „Objekt · Mitte“.
- **Kopie bewegen:** Strg schaltet auf Kopie, das „+“ steht am Cursor.
  - Herd: Das Original bleibt, die Zahl der Elemente steigt von 17 auf 18, Meldung „1 Element kopiert und bewegt“.
  - Spüle (nach der Korrektur): Die Kopie ist ausgewählt.
  - Strg+Z entfernt die Kopie in einem Schritt.
- **Fenster Tastenkürzel:**
  - Strg+C für Bewegen wird mit „Dieses Tastenkürzel hat schon „Kopieren““ abgelehnt.
  - Strg+Umschalt+E wird übernommen. Danach startet Strg+E nichts mehr und Strg+Umschalt+E bewegt. Das Rechtsklick-Menü zeigt das neue Kürzel.
  - Strg+Z stellt Strg+E wieder her.
- **Rechtsklick-Menü:** Der Eintrag „Bewegen“ startet das Bewegen.

Grenze der Abnahme: Das Testwerkzeug sendet „Strg allein“ nur über den Tastennamen „Control“. Mit einer echten Tastatur ist das ein normaler Druck auf Strg.

## Teil B2: Drehen

- **Bedienung:** Elemente auswählen, Strg+D drücken, dann drei Klicks:
  1. Drehpunkt
  2. Bezugsrichtung (Umschalt rastet auf 45°)
  3. Zielrichtung

  Die Auswahl dreht um den Winkel zwischen Bezugs- und Zielrichtung, gegen den Uhrzeigersinn positiv. Das Drehen gilt nur im Grundriss. Esc bricht in jeder Stufe ab. Die Hinweiszeile unten links nennt jeweils den nächsten Schritt. „Drehen“ steht auch im Rechtsklick-Menü, mit dem eingestellten Kürzel.

- **Kreis** (`RotationGuideOverlay.tsx`):
  - Um den Drehpunkt liegt ein Kreis von 0 bis 360° mit Strichen alle 15° und den Zahlen 0, 90, 180 und 270.
  - Vor dem Bezugsklick zeigt 0° nach +x, danach liegt 0° auf der Bezugsrichtung.
  - Gezeichnet werden außerdem der Strahl zur Maus, der gestrichelte Bezug, der Bogen dazwischen und der Winkel als Zahl („+45°“).
  - Die Vorschau zeigt die gedrehte Auswahl.
- **Umschalt** rastet die Zielrichtung in 45°-Schritten ab der Bezugsrichtung, nicht ab der x-Achse.
- **Tab:** Die Eingabe hat beim Drehen nur das Feld „Drehwinkel °“ (`angleOnly`), Tab setzt die Schreibmarke dorthin. Enter übernimmt.
- **Strg** schaltet wie beim Bewegen auf Kopie mit „+“ am Cursor:
  - Das Original bleibt, die gedrehte Kopie entsteht mit neuen IDs und ist danach ausgewählt.
  - Meldung „… kopiert und um 30° gedreht“.
  - Rückgängig ist ein Schritt.
- **Rechenkern** (`domain/project/prepared-translation.ts`): Das Bewegen rechnet jetzt mit einer ebenen Transformation (`PlanTransform`). Verschieben ist der Fall mit `delta` und 0°, Drehen ist `rotationTransform(Drehpunkt, Grad)`.
  - Daraus folgt für das Drehen dasselbe wie für das Bewegen:
    - dieselben Prüfungen
    - dieselbe Behandlung von Wandanschlüssen: Anschlüsse zwischen gedrehten und stehenden Wänden werden gelöst, Anschlüsse innerhalb der Auswahl bleiben
    - dieselbe Vorschau
  - Vierteldrehungen rechnen exakt, ohne Rundungsrest. Die Prüfsumme der 14 Testmodelle ist unverändert.
  - Die Bedienschicht steckt in `application/selection/rotate.ts` und `useSelectionRotate.ts`.
- **Je Elementart:**
  - Wände, Linien, Schraffur-Umrisse, Decken, Deckenöffnungen, Dächer (mit Bezugslinie), Räume und Geländer: Alle Punkte drehen mit.
  - Fenster und Türen behalten ihre Lage auf der Wand.
  - Stützen, Objekte und Texte: Mittelpunkt und `rotation` drehen mit (0–360°). Bei Treppen dreht die Laufrichtung, bei Bildern der Winkel im Bogenmaß.
  - Maßketten drehen nur in 90°-Schritten, eine ungerade Vierteldrehung tauscht waagerecht und senkrecht. Bei einem anderen Winkel wird die ganze Drehung abgelehnt: „Maßketten drehen nur in 90°-Schritten.“
  - Dachflächenfenster drehen nur mit ihrem Dach und behalten dabei ihre Lage in der Dachfläche. Allein: „Dachflächenfenster drehen nur mit ihrem Dach.“
  - Das Schraffurmuster behält seinen Winkel, nur sein Ursprung dreht mit.
  - Platzierte Zeichnungen werden nur verschoben, sie haben kein Drehfeld.
- **Dateiformat:** bleibt bei 58.

### Abnahme im Browser (04.11.2026)

Testprojekt mit 17 Objekten, gedreht wurde die Spüle mit ihrem außermittigen Becken.

- **Strg+D und die drei Klicks:**
  - Die Hinweiszeile wechselt von „Drehpunkt“ über „Bezugsrichtung“ zu „Zielrichtung“.
  - Kreis, Skala, Strahlen und „+90°“ werden gezeichnet.
  - Die Vorschau zeigt das Becken links statt oben, der Fang rastet „Vertikal“ ein.
  - Ergebnis: „Auswahl um 90° gedreht“, weiter 17 Elemente.
- **Tab, Kopie, Enter:** Tab setzt die Schreibmarke in „Drehwinkel °“, Eingabe 30, Strg zeigt das „+“, Enter setzt ab. Ergebnis: 18 Elemente, „1 Element kopiert und um 30° gedreht“, die Kopie ist ausgewählt. Strg+Z führt zurück auf 17.
- **Umschalt:** Die Mausrichtung bei etwa 49° rastet auf „+45°“, Ergebnis: „Auswahl um 45° gedreht“.
- **Rechtsklick-Menü:** „Drehen · Strg+D · danach Strg: Kopie“ startet das Drehen, Esc bricht ab. Konsole ohne Fehler.
- **Beim Test gefunden und behoben:**
  - Der gestrichelte Bezugsstrahl war 1 m breit, weil `vector-effect` fehlte.
  - Tab sprang ins Längenfeld, das beim Drehen keinen Sinn hat. Seitdem gibt es die Betriebsart „nur Winkel“.

Grenze der Abnahme: Das Testwerkzeug drückt beim Klick mit Umschalt keine echte Umschalttaste. Die App liest Umschalt über die Taste selbst, deshalb wurde Umschalt per Tastenereignis gesendet. Mit einer echten Tastatur ist das ein normaler Druck auf Umschalt.

## Teil B3: Spiegeln

### Bedienung

1. Elemente auswählen, Strg+M drücken oder im Rechtsklick-Menü „Spiegeln“ wählen.
2. Klick 1 setzt den ersten Punkt der Achse.
3. Die gestrichelte Achse folgt der Maus und zeigt ihren Winkel von 0 bis 180°. Die Vorschau zeigt die gespiegelte Auswahl.
4. Klick 2 legt die Richtung fest und spiegelt.

Während des Spiegelns:

- **Umschalt** rastet die Achse auf 45°-Schritte ab der Waagerechten.
- **Tab** öffnet das Feld „Achswinkel °“.
- **Strg** schaltet auf Kopie, mit „+“ am Cursor. Die Kopie ist danach ausgewählt.
- **Esc** bricht ab.

Rückgängig ist ein Schritt. Gespiegelt wird nur im Grundriss.

Strg wirkt nur außerhalb des Eingabefelds, wie beim Drehen. Wer eine Kopie mit getipptem Winkel will, drückt erst Strg, dann Tab.

### Je Elementart

| Elementart                                          | Was passiert                                                                                                |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Wand                                                | Punkte spiegeln, Anfang und Ende tauschen. Wandaufbau-Seite und Achslage bleiben richtig.                   |
| Wandanschlüsse                                      | Innerhalb der Auswahl tauschen die Enden mit. Anschlüsse nach außen entfallen wie beim Bewegen.             |
| Fenster                                             | Lage wird zu 1 − Lage, Flügel laufen in umgekehrter Reihenfolge, ihre Bänder wechseln die Seite.            |
| Tür                                                 | Lage wird zu 1 − Lage, Band am anderen Pfosten, Öffnungsseite bleibt. Aus DIN links wird DIN rechts.        |
| Stütze                                              | Mittelpunkt spiegelt, Winkel wird zu 2α − θ.                                                                |
| Objekt                                              | Mittelpunkt spiegelt, „gespiegelt“ schaltet um, Winkel wird zu 2α − θ + 180°.                               |
| Treppe                                              | Start spiegelt, Laufrichtung wird zu 2α − θ, Zeichenachse und Wendung tauschen links und rechts.            |
| Dach                                                | Umriss und Bezugslinie spiegeln, die Steigseite tauscht.                                                    |
| Dachflächenfenster                                  | Nur mit dem Dach; seine Lage in der Dachfläche bleibt. Allein wird es abgelehnt.                            |
| Decke, Durchbruch, Raum, Schraffur, Linie, Geländer | Punkte spiegeln. Das Schraffurmuster behält seinen Winkel.                                                  |
| Text                                                | Einfügepunkt spiegelt, der Block landet spiegelbildlich zum Punkt, die Schrift bleibt lesbar (siehe unten). |
| Bild                                                | Wird nicht gespiegelt. Die Bildmitte wandert auf die Spiegelseite, Winkel und Inhalt bleiben.               |
| Platzierte Zeichnung                                | Nur die Lage spiegelt.                                                                                      |
| Maßkette                                            | Nur an Achsen in 45°-Schritten, eine schräge 45°-Achse tauscht waagerecht und senkrecht. Sonst Ablehnung.   |

**Text:** Würde die Schrift nach dem Spiegeln nach links laufen, dreht sie um 180° und links- und rechtsbündig tauschen. Bleibt die Leserichtung, tauschen stattdessen oben und unten. Das weicht von der Karte ab, die immer die Ausrichtung tauschen wollte: An einer waagerechten Achse läge der Text sonst auf der falschen Seite seines Punktes.

Zweimal an derselben Achse spiegeln ergibt das Original. Bei Achsen in 45°-Schritten ist das exakt, ohne Rundungsrest. Eine L- oder U-Treppe ohne gespeicherte Wendung trägt danach „links“ ausdrücklich, das bedeutet dasselbe.

### Umsetzung

`reflectionTransform` ist eine weitere `PlanTransform` im Rechenkern `prepared-translation.ts`, mit dem Feld `mirror` für den Achswinkel. `application/selection/mirror.ts` folgt dem Aufbau von `rotate.ts`. Die Eingabe bekam `angleLabel`, damit das Feld „Achswinkel“ heißt. Das Dateiformat bleibt bei 58.

### Mitbehoben

Die Abnahme fand drei ältere Fehler:

- **Mehrfachauswahl:** Strg+E, Strg+D und Strg+M meldeten nach Strg+A oder Rahmenauswahl „Erst ein Element auswählen“. Sie arbeiten jetzt auf der ganzen Auswahl.
- **Türen in der Auswahl:** Der Rechenkern lehnte eine Auswahl mit Tür ab, Fenster dagegen nicht. Türen folgen jetzt ihrer Wand. Eine Tür ohne ihre Wand wird in der Gruppenbewegung mit Hinweis abgelehnt.
- **Gestrichelte Linien:** Strichlängen zählen bei nicht skalierenden Linien in Bildschirmpixeln. Der Bezugsstrahl des Drehens wirkte deshalb durchgezogen.

### Abnahme im Browser (05.11.2026)

Testprojekt mit zwei verbundenen Wänden, Fenster, Tür, WC, Text und Treppe, alles per Strg+A ausgewählt (7 Elemente).

| Schritt                                          | Ergebnis                                                                     |
| ------------------------------------------------ | ---------------------------------------------------------------------------- |
| Strg+M, Achspunkt, Umschalt, Maus fast senkrecht | Achse rastet auf 90°, Vorschau zeigt das Spiegelbild                         |
| Klick 2                                          | Spiegelbild übernommen, Tür schlägt spiegelbildlich auf, „Bad“ bleibt lesbar |
| Strg+Z                                           | Original zurück, Auswahl aufgehoben                                          |
| Strg+M, Achspunkt, Tab, 0, Enter                 | Spiegelung an der Waagerechten                                               |
| Strg+M, Achspunkt, Strg, Tab, 0, Enter           | 14 Elemente, Tür mitkopiert, Kopie ausgewählt (7)                            |
| Rechtsklick                                      | Eintrag „Spiegeln“ mit Strg+M, startet das Spiegeln, Esc bricht ab           |
| Strg+D und Strg+E mit Mehrfachauswahl            | Starten beide, Bewegen läuft bis zur Platzierung                             |
| Fenster „Tastenkürzel“                           | Spiegeln mit Strg+M, kein „(folgt)“ mehr                                     |

Nicht im Browser geprüft, nur durch Tests belegt: Dach, Maßketten, Bilder und freie schräge Achsen.

## Teil B4: Abgleich mit den Objekten

Bewegen, Drehen, Spiegeln und Kopieren sind gegen Esstisch, Stuhl, Sofa, Fernseher und Pkw geprüft (). Der Abgleich ergab keinen Fehler, der Code blieb unverändert.

- **Körper:** Jede Ecke jedes Teils landet am rechnerisch erwarteten Punkt, auch die Stühle am Tisch und die einseitige Armlehne beim Spiegeln.
- **Werte:** Optionen und Material bleiben erhalten, auch an der Kopie. Das Original bleibt stehen.
- **Zweimal spiegeln** an derselben Achse ergibt wieder denselben Körper.

**Abnahme im Browser (05.11.2026), am Pkw:**

| Schritt                    | Ergebnis                                         |
| -------------------------- | ------------------------------------------------ |
| Strg+D, drei Klicks        | Drehung 90°, Pkw steht quer                      |
| Strg+M, zwei Klicks        | Drehung 270°, Gespiegelt gesetzt                 |
| Strg+E, Strg allein, Klick | Kopie am Ziel, Original bleibt, ein Element mehr |

**Grenzen B4:** Im Browser ist nur der Pkw bedient, die anderen vier Objekte sind nur über Tests geprüft. Ein erster Versuch mit Strg+E bewegte nichts und hob die Auswahl auf. Der zweite Versuch gelang, die Ursache ist nicht geklärt.
