# Wohnflächenberechnung nach WoFlV

Nutzerauftrag 07.11.2026: „Go L15“ (Anforderungen N35, N36). Das Programm rechnet die Wohnfläche mit sichtbarem Rechenweg. Das Ergebnis ist keine geprüfte Fachaussage: Eine unabhängige Fachprüfung steht aus, und der Bericht sagt das.

## W0 – Regelstand

Gelesen am 07.11.2026 auf gesetze-im-internet.de: Wohnflächenverordnung vom 25. November 2003 (BGBl. I S. 2346), in Kraft seit 1.1.2004, die Seite nennt keine spätere Änderung. Die Seite ist nichtamtlich. Der Regelsatz heißt im Code `WOFLV_RULES`, Version 1; ändern sich die Regeln, bekommt er eine neue Version.

| Stelle              | Regel                                                                                                                                                          | Im Programm                                                                                                     |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| § 2 Abs. 1, 2       | Räume der Wohnung, dazu Wintergärten, Schwimmbäder und ähnliche geschlossene Räume, Balkone, Loggien, Dachgärten, Terrassen                                    | Raumart                                                                                                         |
| § 2 Abs. 3          | Nicht dazu: Zubehörräume wie Keller, Waschküche, Heizung, Garage, Räume ohne Eignung nach Bauordnung, Geschäftsräume                                           | Raumart „Keine Wohnfläche“, die Wahl trifft der Nutzer                                                          |
| § 3 Abs. 1          | Lichte Maße, von der Vorderkante der Bekleidung                                                                                                                | Raumumriss; siehe Grenzen                                                                                       |
| § 3 Abs. 2          | Eingebaute Gegenstände, Leisten, Einbaumöbel zählen mit                                                                                                        | Nichts abzuziehen                                                                                               |
| § 3 Abs. 3 Nr. 1    | Schornsteine, Vormauerungen, Bekleidungen, freistehende Pfeiler und Säulen bleiben außer Betracht, wenn höher als 1,50 m und größer als 0,1 m²                 | W3                                                                                                              |
| § 3 Abs. 3 Nr. 2    | Treppen mit über drei Steigungen und ihre Absätze bleiben außer Betracht                                                                                       | W3                                                                                                              |
| § 3 Abs. 3 Nr. 3, 4 | Türnischen; Fenster- und offene Wandnischen, die nicht bis zum Boden reichen oder bis zum Boden reichen und höchstens 0,13 m tief sind, bleiben außer Betracht | Der Umriss endet an der Wand, sie zählen also nicht mit. Tiefere Bodennischen trägt der Nutzer als Zuschlag ein |
| § 4 Nr. 1, 2        | Ab 2 m lichter Höhe voll, von 1 m bis unter 2 m zur Hälfte                                                                                                     | W2; unter 1 m zählt nichts, weil § 4 dafür keine Anrechnung nennt                                               |
| § 4 Nr. 3           | Unbeheizbare Wintergärten, Schwimmbäder und Ähnliches zur Hälfte                                                                                               | Raumart „Unbeheizt“                                                                                             |
| § 4 Nr. 4           | Balkone, Loggien, Dachgärten, Terrassen in der Regel zu einem Viertel, höchstens zur Hälfte                                                                    | Raumart mit Anteil, Vorgabe 25 %, höchstens 50 %                                                                |

Festlegung: Bei „Unbeheizt“ und „Balkon“ gilt der feste Anteil ohne Höhenregel. Die Verordnung sagt nicht, wie sich § 4 Nr. 2 mit Nr. 3 oder 4 verbindet.

## W1 – Raumart und Anteil

- **Bedienung:** Feld „Wohnfläche“ in den Raumeigenschaften und als Vorgabe im Raumwerkzeug und seinem Einstellungsfenster. Bei Balkon und Terrasse zusätzlich „Anrechnung (%)“, 0 bis 50.
- **Schema 65:** Am Raum das optionale Feld `livingArea` mit `use`, `outdoorShare` und `corrections`. Ohne Feld ist der Raum ein Wohnraum ohne Korrekturen. Eine 64er Datei lädt unverändert, mit `livingArea` wird sie abgelehnt.
- **Code:** `src/domain/elements/room/model.ts`, `src/application/area-rules/woflv.ts`.

Nachweis im Browser, Raum „Wohnen“ 20 m²: Raumart steht auf Wohnraum; auf Balkon gestellt erscheint „Anrechnung (%)“ mit 25; 40 wird übernommen; 60 wird abgewiesen, das Feld springt zurück und die Meldung nennt 0 bis 50 %; bei „Keine Wohnfläche“ verschwindet das Feld; zurück auf Wohnraum ist der Raum wieder ohne Daten. Keine Konsolenfehler.
