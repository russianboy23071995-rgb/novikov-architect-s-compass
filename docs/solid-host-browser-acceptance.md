# Kombinierte Browserabnahme: Pufferpackung und Fenster-Hosts

21.10.2026, main `827d17a`, PR410 nach grüner CI 39634173220 integriert.

## Änderungskarte

Ziel / AUD14-03/04: bestehende Wand-/Fensterbearbeitung nach beiden CPU-Optimierungen erhalten. Normalszenario: verbundenes EG-Wandpaar mit Fenster verschieben. Grenzablauf: Vorschau abbrechen, Höhe ändern und zu einem anderen Geschoss/Fenster wechseln. Keine neue Produktfunktion oder Architekturentscheidung.

Eigentümer/Datenquelle: ein Projekt aus `fullHeightFixture`, stabile Wand-/Fenster-/Host-IDs in Metern. Der UI-Export wird gegen gemeinsame Auswahlbewegung, Geschosshöhenaktion, Geschosswechsel und validiertes `updateWindow` verglichen. Der Prüfer besitzt kein editierbares Produktmodell. Vorschau, vollständiger Commit, ein Undo und Abbruch bleiben produktseitig unverändert.

Umfang: Browser-/Dateinachweis und optionaler sechster Export im bestehenden Benchmarkprüfer. Keine neuen Produktimporte, Abhängigkeiten, Schema-, Recovery-, IFC- oder AI-Verträge. Flexible Fensterobjekte und künftige Bibliotheksdarstellung bleiben unverändert.

## Durchführung

Frischer Vite-Produktbuild über `benchmarks/height-acceptance.config.ts`, isolierter Port 8087; echter CadWorkspace mit sieben Wänden, drei Fenstern über KG/EG/OG und leerem oberen Bezugsgeschoss. Geladenes Asset: `bound-height-workspace-BTGlpwXr.js`. Nutzerprojekt auf 8080 unberührt. Vorhandenes Wiederherstellungsangebot auf 8087 nicht beantwortet oder gelöscht; Autosicherung blieb pausiert.

1. EG-Paar auswählen, 3D, frei bewegen, Ursprung setzen; numerische Vorschauen 1 / 2 / 0,5 m bei 0°, 0,5 m platzieren.
2. Ein Undo stellt Ausgangsstand wieder her; Redo stellt Bewegung wieder her.
3. Neue Bewegung 1 m bei 90° abbrechen; vorheriger Commit bleibt erhalten.
4. EG-Geschosshöhe auf 3,5 m ändern; obere Darstellung folgt.
5. Ins OG wechseln, Fenster wählen, in 3D darstellen.
6. OG-Fensterbreite von 1,2 auf 1,5 m ändern. Fensterebene ausblenden und per Ebenen-Undo wiederherstellen; Wandaussparungen bleiben vorhanden.

Beim ersten Auswahlversuch traf der Klick das Fenster statt seiner Wand. Die Anwendung wies die unzulässige Gruppenbewegung verständlich ab. Auswahl anschließend außerhalb der Öffnung korrigiert; keine Modellmutation beim abgewiesenen Versuch.

Reguläre UI-Downloads `novikov-project (91).json` bis `(96).json`, in obiger Prüfreihenfolge. Der letzte Export erfolgte nach Wiederherstellung der Ebenensichtbarkeit. Ausführung:

```text
node --experimental-strip-types benchmarks/window-base-browser-check.ts <91> <92> <93> <94> <95> <96>
```

Alle sechs Vergleiche bestanden: vollständige deserialisierte Geschosse einschließlich Nachbarwänden, Anschlüssen, Fenstern und Höhen sowie Arbeits-/Basisgeschoss und BIM-Sichtbarkeit. Screenshot lokal: `outputs/solid-host-browser.png` außerhalb des Repos. Browser-Fehlerlog: keine Einträge. Fokussiertes ESLint bestanden; frischer Produktbuild bestanden.

## Abschlusskarte / Grenzen

Nur Benchmarkprüfer und Dokumentation geändert. Keine neue Produktrückabhängigkeit, kein Laufzeitzyklus und keine zweite Modellwahrheit. Frühere fünf Exportargumente bleiben unterstützt. Produktsuite bereits auf PR410 grün (1137 Tests); für diesen Nachweisschritt nicht als neu ausgeführt ausgeben.

Dies ist eine funktionale Browserabnahme. Kein kontinuierlicher Pointer-/Shift-Stresstest, GPU-/Frameprofil, Native-/Langsession-, Recovery- oder erneuter IFC-Nachweis. Die CPU-Messungen aus PR408/410 werden dadurch nicht zu garantierten Bildraten. Einziger Folgeauftrag steht im Masterplan §9.
