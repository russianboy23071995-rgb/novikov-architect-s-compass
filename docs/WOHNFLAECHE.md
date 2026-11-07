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

## W2 – Höhenregel

`roomLivingResult` in `src/application/area-rules/woflv.ts` rechnet je Raum aus dem vorhandenen Höhenfeld, vom fertigen Fußboden (mit Fußbodenaufbau) bis zur Unterseite von Decke und Dach. Jede Teilfläche ist eine Zeile des Rechenwegs mit Fläche, Anteil und Paragraf. Intern wird exakt gerechnet, gerundet wird erst in der Anzeige.

- Genau 2,00 m zählt voll, genau 1,00 m zur Hälfte, darunter nichts.
- Ein Teil ohne Decke oder Dach darüber hat keine Höhe. Er zählt voll, der Rechenweg weist darauf hin.
- Die Raumeigenschaften zeigen neben der Grundfläche die Wohnfläche.

Rechenbeispiel im Test, von Hand: Raum 4 × 3 m unter einem Dach, das je Meter um 1 m steigt. 3 m² unter 1 m zählen nicht, 3 m² zwischen 1 und 2 m zur Hälfte, 6 m² voll, zusammen 7,50 m². Mit 0,50 m Fußbodenaufbau sind es 6,00 m².

Nachweis im Browser, Pultdach 45° mit Unterseite 0,50 m an der Traufe, das den Raum nicht ganz deckt: Raum „Wohnen“ 5 × 4 m zeigt Grundfläche 20,00 m², Wohnfläche 15,00 m² (2,50 m² unter 1 m zählen nicht, 5,00 m² zur Hälfte, 10,00 m² voll, 2,50 m² ohne Dach voll). Balkon 8,00 m² zu 25 % zeigt 2,00 m² und bleibt von der Dachschräge unberührt.

## W3 – Abzüge und Korrekturen

- **Automatisch (`storeyAreaBlockers`):** Stützen über 1,50 m Höhe und 0,1 m² Fläche, Treppen mit mehr als drei Steigungen samt Podest. Abgezogen wird nur der Teil im Raum, und zwar mit dem Anteil der Stelle, an der das Bauteil steht: auf einer Fläche zur Hälfte also die Hälfte.
- **Von Hand:** Knopf „Rechenweg und Korrekturen…“ in den Raumeigenschaften. Das Fenster zeigt den Rechenweg des Raums und nimmt Korrekturen mit Begründung und Fläche an, Abzüge mit Minus. Eine Korrektur zählt im Wohnraum voll, sonst mit dem festen Anteil des Raums.
- **Überschneidung:** `src/geometry/polygons/overlap.ts` zerlegt beide Umrisse in Dreiecke und schneidet sie, das geht auch bei L-Räumen und Treppen mit Podest.
- **Nie unter 0:** Sind die Abzüge größer als der Raum, bleibt die Wohnfläche bei 0, und der Rechenweg sagt das.

Grenzen:

- Das Modell kennt keine Schornsteine und Vormauerungen, sie sind Korrekturen.
- Eine Treppe gehört zu ihrem Geschoss. Das Treppenloch im Geschoss darüber zieht das Programm nicht ab, es ist als Korrektur einzutragen oder der Raum spart es im Umriss aus.
- Überlappen sich zwei abgezogene Bauteile, zählt die Überlappung doppelt.
- „Freistehend“ prüft das Programm nicht: Auch eine Stütze an der Wand zählt als Abzug, wenn sie im Raum steht.
- Der Raumumriss endet an den Wandseiten aus dem Modell. Putz und Bekleidung zieht das Programm nicht ab (§ 3 Abs. 1), sie gehen nur über die Wandstärke oder eine Korrektur ein.

Nachweis im Browser, Raum wie bei W2 mit Stütze 0,50 × 0,50 m: Rechenweg 10,00 + 2,50 + 0 + 2,50 − 0,25 = 14,75 m²; Korrektur „Schornstein“ −0,50 ergibt 14,25 m²; „Nische“ +0,25 ergibt 14,50 m², Entfernen wieder 14,25 m². Ohne Begründung kommt eine Meldung.

Gefunden und behoben: Das Fenster schloss sich nach jeder Eingabe, weil die Eigenschaften bei jeder Projektänderung neu aufgebaut wurden. Raumeigenschaften bleiben jetzt stehen und folgen ihren Werten selbst (`property-form-key.ts`); damit bleibt auch das Fenster „Höhenlinien“ offen.

## W4 – Wohnflächenliste

Menü Organisation → „Wohnflächenliste“ (neben der Raumliste). Das Fenster zeigt je Geschoss alle Räume in der Reihenfolge ihrer Nummern mit Raumart, Grundfläche, Wohnfläche und Rechenweg, dazu Summen je Geschoss und fürs Projekt. Ein Klick wählt den Raum. „Als CSV speichern“ schreibt eine Zeile je Rechenschritt und die Summen, Format wie die Raumliste (Semikolon, Dezimalkomma, BOM).

Liste, CSV und Bericht lesen dasselbe Ergebnis `livingSchedule` (`src/application/area-rules/schedule.ts`), es gibt keine zweite Berechnung. Summen entstehen aus den exakten Werten. Deshalb kann die Summe gerundeter Zeilen um 0,01 m² von der angezeigten Summe abweichen.

Nachweis im Browser, Projekt wie bei W3: Menü Organisation zeigt „Wohnflächenliste“. Liste: R-001 Wohnen 20,00 → 14,75 m² mit fünf Rechenschritten und Hinweis auf die Teilfläche ohne Dach, R-002 Balkon 8,00 → 2,00 m², Summe 28,00 → 16,75 m².

## W5 – Bericht als PDF

„Bericht als PDF“ in der Wohnflächenliste schreibt `Wohnflaechenberechnung.pdf`: A4 hochkant, Kopf mit den Projektinformationen, Datum und Regelstand, Hinweis, Zusammenfassung je Geschoss, dann jeder Raum mit Rechenweg. Ein Raum bleibt auf einer Seite, wenn er passt; jede Seite trägt ihre Nummer.

`src/interop/reports/woflv-report.ts` bekommt das fertige Ergebnis aus `livingSchedule` und rechnet nichts selbst. Der Bericht nutzt den PDF-Schreiber aus L14 und die eingebaute Helvetica. Zeichen außerhalb von WinAnsi werden zu „?“.

Nachweis im Browser: Knopf erzeugt `application/pdf`, im PDF-Betrachter des Browsers geöffnet und angesehen: A4, Kopf mit Projekt und Verfasser, Zusammenfassung 28,00 → 16,75 m², beide Räume mit Rechenweg, Seitenzahl. Zahlen stehen rechtsbündig.

Gefunden und behoben: Die Linie über „Wohnfläche gesamt“ lief durch den Text; die Fußzeile endete ohne Projektnamen auf einem Trennpunkt. Beides fiel erst beim Ansehen auf, nicht in den Tests.

## Stand

L15 ist umgesetzt. Offen bleibt die unabhängige Fachprüfung, die das Anforderungsregister verlangt (N35). Sie kann das Programm nicht ersetzen.

## S1 – Stützen: wann abgezogen, wann übermessen (07.11.2026)

Nutzerfrage 07.11.2026: „prüfe ob und wann Stützen abgezogen oder übermessen werden“. Grundlage ist WoFlV § 3 Abs. 3 Nr. 1.

| Fall                                                 | Ergebnis                                                                               |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Höher als 1,50 m und mehr als 0,1 m² im Raum         | abgezogen, mit dem Anteil der Stelle (unter der Schräge zwischen 1 und 2 m zur Hälfte) |
| Höchstens 1,50 m hoch                                | übermessen, zählt zur Wohnfläche                                                       |
| Höchstens 0,1 m² im Raum, z. B. 30 × 30 cm = 0,09 m² | übermessen                                                                             |
| An das Geschoss gebunden, Höhe unbekannt             | gilt als hoch genug                                                                    |
| Teils in der Wand oder außerhalb                     | nur der Teil im Raum zählt, für die Schwelle und für den Abzug                         |

Geändert: Bis PR666 maß das Programm die 0,1 m² an der ganzen Stütze. Eine Stütze mit 0,16 m², die zur Hälfte in der Wand steht, wurde mit 0,08 m² abgezogen, obwohl im Raum weniger als 0,1 m² stehen. Jetzt entscheidet die Fläche im Raum. Eine quadratische Stütze wird ab etwa 32 × 32 cm abgezogen, eine runde ab etwa 36 cm Durchmesser.

„Freistehend“ prüft das Programm weiter nicht. Für Vormauerungen und Bekleidungen gilt dieselbe Schwelle, das Ergebnis ist also gleich.

Nachweis im Browser: Stütze 0,40 × 0,40 m genau auf der Grenze zwischen „Wohnen“ und „Balkon“, je 0,08 m² in jedem Raum. Beide Räume behalten ihre Fläche (14,75 und 2,00 m²), nur die freistehende Stütze 0,50 × 0,50 m in „Wohnen“ geht ab. Vor S1 wären bei beiden Räumen je 0,08 m² abgegangen.
