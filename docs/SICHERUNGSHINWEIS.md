# Sicherungshinweis unten links (Nutzervorgabe 29.10.2026)

Der Hinweis auf lokale Wiederherstellungsstände erschien bisher als Fenster oben rechts im
Canvas und tauchte bei jedem Laden auf. Er sitzt jetzt dezent unten links in der ersten Ansicht.

- Kompakt: Textzeile „Wiederherstellung verfügbar (n) · Autosicherung wartet“ bzw.
  „Wiederherstellung nicht prüfbar“, darunter die Knöpfe „Stände auswählen“ und
  „Weiterarbeiten“. Die ausführliche Erklärung steht im Tooltip (und als Beschreibung für
  Screenreader).
- Ersetzt die kleine Anzeige unten links („Gesamtgebäude · Arbeitsgeschoss … · Fit · m“ in 3D,
  „Ansicht … px/m“ und Maßstabsbalken in 2D) nur, solange die Entscheidung offen ist; danach
  erscheint die Anzeige wieder. Bei mehreren Ansichten nur in der ersten.
- Funktion unverändert: Die Autosicherung wartet bis „Stände auswählen“ oder „Weiterarbeiten“,
  daher verschwindet der Hinweis nicht von selbst. Der Knopfname „Stände auswählen“ bleibt, weil
  der Schullauf (`benchmarks/school-acceptance.tsx`) ihn verwendet.
- Breite höchstens 16 rem, damit die Knöpfe nicht unter der Befehlsleiste in der Mitte liegen
  (zuerst einzeilig umgesetzt; im Browser lag „Weiterarbeiten“ dann unter der Befehlsleiste).

Umsetzung: `RecoveryStartupNotice.tsx` (Darstellung), `CadViewport.tsx` (`startupNotice` der
ersten Ansicht statt der Anzeige), `CadWorkspace.tsx` (gibt den Hinweis nur bei offenem Angebot
weiter).

Nachweis: 1352 Tests grün (keine Logik geändert). Browser 2D und 3D: Hinweis unten links, beide
Knöpfe klickbar (oberstes Element an ihrer Mitte), rechter Rand vor der Befehlsleiste, alte
Anzeige solange ausgeblendet, kein Fenster mehr oben rechts, keine Konsolenfehler. Nicht im
Browser geklickt: „Weiterarbeiten“ (hätte die Autosicherung für die vorhandenen Stände des
Nutzers fortgesetzt); dass die Anzeige danach zurückkehrt, folgt aus der Bedingung in
`CadWorkspace.tsx`, ist aber nicht im Browser beobachtet.
