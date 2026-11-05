# Löschen für alle Bauteile (24.10.2026)

Basis: feat/opening-overlap-hint (PR451, noch nicht gemergt). Änderungskarte freigegeben mit
den drei Empfehlungen (Nutzerentscheidung 24.10.2026):

1. **Wand mit Öffnungen:** Fenster und Türen einer gelöschten Wand werden mitgelöscht; die
   Vorschau nennt ihre Anzahl.
2. **Nachbarwände:** Eck- und T-Anschlüsse einer gelöschten Wand entfallen; die Geometrie der
   Nachbarn bleibt unverändert, ihr Ende ist danach frei. Kein automatisches Verlängern/Verbinden.
3. **Keine Rückfrage:** Undo genügt; Taste und Menü zeigen die Zusammenfassung als Meldung.

## Änderungen

- **Aktion** `application/elements/delete.ts` (`previewDeleteSelection`): eine Operation für
  Taste, Menü, Text und Sprache. Prüft die Auswahl (sichtbar, aktuell, ein Geschoss), entfernt
  die Elemente über die Bauteil-Registry, die Öffnungen gelöschter Wände, deren Eck- und
  T-Anschlüsse und nicht mehr genutzte Bilddateien; ungenutzte Schraffurmuster entfallen wie
  bisher bei der Prüfung. Danach volle Prüfung des Projekts. Kein Code in `lib/bim`.
- **Bestätigung:** bestehender Bearbeitungsweg (`{ type: "project" }`), ein Undo-Schritt;
  Auswahl danach leer.
- **Bedienung:** `Entf`/`Backspace` im Auswahlwerkzeug (nicht in Eingabefeldern, nicht während
  einer Bearbeitung oder Gruppenbewegung); Kontextmenü „Löschen (Entf)“ bzw. „Auswahl löschen“;
  Text/Sprache „Auswahl löschen“ oder „Auswahl entfernen“ mit Vorschau.
- **Nicht enthalten:** Papierkorb, geschossübergreifendes Löschen in einem Schritt (klare
  Meldung), Neuverbinden der Nachbarwände.

## Nachweis

- `src/application/elements/delete.test.ts` (5 Tests): Wand mit Fenster und Tür samt Eck- und
  T-Anschluss, Nachbargeometrie unverändert, Zusammenfassung; jede Bauteilart einzeln, gewählte
  Öffnungen nicht doppelt gezählt; ungenutzte Bilder und Schraffurmuster entfallen, gemeinsam
  genutzte Bilder bleiben; veraltete, verborgene und geschossübergreifende Auswahl abgelehnt;
  Undo ergibt exakt den alten Stand; Text, Sprache und Aktion liefern dasselbe Ergebnis.
- Gegenproben (ohne Mitlöschen der Öffnungen / ohne Eckanschluss-Bereinigung / ohne
  Bild-Bereinigung): 4, 4 und 1 Tests scheitern.
- 1225 Tests, Architektur-Check PASS, beide Typprüfungen, Lint (0 Fehler), Build.
- **Messung** (`benchmarks/element-delete-profile.ts`, Rohdaten `element-delete-results.json`;
  500 Wände mit je Fenster und Tür auf fünf Geschossen, Median aus 15, drei Läufe): Löschen
  einer Wand bzw. von 50 Wänden einschließlich Bestätigung 8–12 ms.
- **Bedienabnahme:** 2D: `Entf` löscht Wand und Fenster (Meldung nennt das mitgelöschte
  Fenster), `Strg+Z` stellt beides her; Menü „Löschen (Entf)“ (Elemente 2 → 0 → Undo 2);
  Textbefehl mit Vorschau und Übernehmen. 3D: `Entf` und Undo ohne Konsolenfehler.

## Beobachtung

- Im Browserprotokoll steht einmalig (20:51:24, während der Abnahme des Überlappungshinweises)
  „Maximum update depth exceeded“ aus `components/cad/useHoverReference.ts` in `BimSolidView`.
  Nicht nachstellbar (3D-Wechsel, Wand- und Z-Bewegung, Fenster-/Türziehen mit Überlappung,
  Löschen/Undo jeweils fehlerfrei); die Datei ist in diesen Schritten unverändert. Eigene
  Untersuchung empfohlen.

## Nachtrag 25.10.2026: Kontextmenü verdeckt die Befehlsleiste nicht mehr

Befund aus der Abnahme von DIN links/rechts: Das Kontextmenü (`z-50`) konnte über der
Befehlsleiste (`z-30`) liegen; ein Klick ins Befehlsfeld traf „Löschen (Entf)“. Auf Wunsch des
Nutzers in derselben Sitzung behoben (Branch feat/menu-avoid-commandbar, Basis
feat/door-din-hand).

- **Änderungskarte:** Die Befehlsleiste ist als Sperrbereich markiert (`data-menu-obstacle`).
  `clampMenuPosition` (`components/cad/demand-menu.ts`) hält das Menü im Fenster und weicht
  einem Sperrbereich aus – zuerst darüber, sonst links, sonst rechts davon; passt nichts, bleibt
  die Position. Das Menü misst die Leiste mit `ResizeObserver` mit (sie wächst bei Vorschauen).
  Ziehen und Pfeiltasten nutzen dieselbe Begrenzung. Keine Modell- oder Formatänderung.
- **Nachweis:** Test in `demand-menu.test.ts` (über, links, rechts, unverändert ohne Konflikt,
  Ziehen auf die Leiste); Gegenprobe ohne Ausweichen: 1 Test scheitert. 1231 Tests,
  Architektur-Check, Typprüfungen, Lint (0 Fehler), Build. Bedienabnahme: Menü 30 Pfeilschritte
  nach unten – bleibt 8 px über der Leiste, keine Überdeckung.
