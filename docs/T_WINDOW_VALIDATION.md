# Fensterprüfung am isolierten T-Anschluss

Stand: 06.10.2026, Integrationscommit 860abc1 (PR128).
Planungsstand; die Vorschau weist Fenster bis zur Umsetzung weiterhin ab.

## Regelentscheidung

Noch offen: Darf ein Fenster die Kontaktfläche berühren? Der Nutzer wurde dazu
in diesem Auftrag gefragt. Empfehlung: Berührung und Überschneidung verhindern,
aber keinen zusätzlichen Mindestabstand in Zentimetern verlangen. Die Antwort
muss vor Umsetzung eingetragen werden; diese Empfehlung ist keine Nutzerentscheidung.
Die bestehende Regel für Eckanschlüsse bleibt unverändert.

## Gemeinsame Implementierung

`src/application/walls/t-preview.ts` weist derzeit alle Fenster beider Zielwände
ab. Diese pauschale Sperre soll später durch einen Domain-Prüfbericht ersetzt
werden. Andere persistierte Anschlüsse bleiben ausgeschlossen. Keine neue
Mutation, kein zweiter Renderingpfad oder T-IFC-Export in diesem Teilauftrag.

`src/domain/elements/wall/corner-openings.ts` zeigt das vorhandene Muster:
Projekt validieren, stabile Ziele auflösen, Konturen und Fenstergrundrisse aus
demselben Stand ableiten, Abstände über gemeinsame Geometriefunktionen prüfen.
Die Eckenregel nicht auf T übertragen: an der Hauptwand bleibt das Fenster
innerhalb der unveränderten Kontur und kann trotzdem den T-Kontakt blockieren.

Vorgesehener Domain-Bericht: Konturen, Kontaktsegment und je betroffenem Fenster
stabile Fenster-/Wand-ID, Prüfgrund und Status frei/berührend/überschneidend.
Die Application übersetzt dies in eine verständliche Meldung und zeigt nur
zulässige Vorschauen. Änderungen am Modellstand verwerfen weiterhin das Ergebnis.

### Ankommende Wand

Fenstergrundriss gegen die abgeleitete gekürzte Kontur prüfen. Den Anschlussrand
anhand des tatsächlichen Endindex identifizieren: im ursprünglichen CCW-Ring
ist Ende 1 die Kante 1–2, Anfang 0 die Kante 3–0. Die Eckfunktion dagegen
normalisiert ihre Gehrung zur Schlusskante; deren Randindizes nicht kopieren.
`measureHalfPlane` und die Modell-Toleranzen wiederverwenden. Fenster liegen
naturgemäß an den Wandseiten; Seitenkontakt ist kein Anschlussfehler.

### Hauptwand

Beide Enden des Kontaktsegments auf die lokale Hauptwandachse projizieren und
sortieren. Vergleiche dieses vollständige Intervall mit dem Fensterintervall
[position*Achslänge - Breite/2, position*Achslänge + Breite/2]. Nur den Achsknoten
zu prüfen würde versetzte Achslagen und Randüberschneidungen übersehen.
Bei gleichen Höhen und gemeinsamer Basis z=0 überdeckt die Nebenwand die gesamte
mögliche Fensterhöhe; eine zusätzliche Höhenentscheidung ist hier nicht nötig.
Ungleiche Höhen/Geschosse bleiben ausgeschlossen.

Numerische Toleranz unterscheidet Berührung von einem positiven Spalt. Keine
CSS-Pixel, kein Fangradius und keine erfundene bauliche Mindestfuge verwenden.
Nach akzeptierter Prüfung `wallContourSolid` mit den vorhandenen Fenstern
aufrufen: dieselben Öffnungen erscheinen in beiden Vorschauansichten.

## Konkrete Grenzfälle

Hauptachse (0,0)–(6,0), Nebenachse (3,-3)–(3,0), beide mittig,
Stärke 0,36 m, Höhe 2,80 m. Kontakt auf der Hauptwand: x=2,82 bis 3,18.
Abschluss der Nebenwand: y=-0,18 bzw. Achsabstand 2,82 m vom Nebenwandanfang.

- Hauptwandfenster Breite 1 m: Zentrum 2,32 m berührt links; 2,31 m bleibt frei;
  2,33 m überschneidet. Spiegelbildliche Fälle am rechten Kontaktrand prüfen.
- Nebenwandfenster Breite 1 m: Zentrum 2,32 m berührt den Abschluss; 2,31 m
  bleibt frei; 2,33 m überschreitet ihn. Alle sind vor dem Kürzen in der Wand.
- Je ein freies Fenster beider Wände, Breite/Höhe jeweils 1 m: erwartetes
  Nettovolumen 8,89056 - 2*0,36 = 8,17056 m³.
- Mehrere Fenster, andere Wand-IDs und unsichtbare Fenster: alle physisch
  relevanten Öffnungen prüfen, Darstellungssichtbarkeit darf nichts erlauben.
- Beide Anschlussseiten, alle Achslagen, umgekehrte Achsen sowie Rotation und
  Translation prüfen; Ergebnisse dürfen nicht von Bildschirmorientierung abhängen.
- Eingang unverändert bei Ablehnung, veralteter Modellstand, Zielwechsel,
  Abbruch und bestehende rechte/schräge Eckvorschauen als Regressionen prüfen.

## Begrenzter Folgeauftrag

Nach dokumentierter Antwort zur Berührung den gemeinsamen Domain-Prüfbericht
implementieren und in die temporäre T-Vorschau integrieren. Obige Grenzfälle und
analytisches Nettovolumen testen, Browservorschau mit Fenstern prüfen. Keine
Persistenz, automatischen T-Verbindungen oder neue Sprachmutation hinzufügen.
Die spätere Spracheingabe bleibt Adapter derselben validierten Aktionen.
