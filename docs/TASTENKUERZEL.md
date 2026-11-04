# Tastenkürzel und Bewegungssteuerung (ab 04.11.2026)

Nutzerauftrag 04.11.2026: Bewegen, Drehen und Spiegeln für alle Elemente über Tastenkürzel, jeweils auch als Kopie, dazu ein Fenster für die Kürzel, das mit dem Projekt gespeichert wird. Vor L44 O2 umzusetzen. Änderungskarte mit „Go“ freigegeben.

| Teil | Inhalt                                                                          | Stand    |
| ---- | ------------------------------------------------------------------------------- | -------- |
| B1   | Kürzelliste, Fenster Edit → Tastenkürzel, Dateiformat 58, Strg+E, Kopie bewegen | erledigt |
| B2   | Drehen Strg+D mit Kreis 0–360°, Tab-Eingabe, Umschalt 45°, Kopie                | offen    |
| B3   | Spiegeln Strg+M über Achse mit Vorschau, Umschalt 45°, Kopie                    | offen    |
| B4   | Abgleich mit den Objekten (Möblierung)                                          | offen    |

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

## Teil B2 und B3 (offen)

- **Drehen:** Strg+D, drei Klicks, Kreis 0–360° während des Drehens, Tab für die Winkeleingabe, Umschalt rastet auf 45°.
- **Spiegeln:** Strg+M, erster Punkt der Achse per Klick, die Achse folgt mit Vorschau der Maus, Umschalt rastet auf 45°.
- **Kopie:** Strg schaltet bei beiden wie beim Bewegen auf Kopie.
