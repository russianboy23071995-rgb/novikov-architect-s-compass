# K02: Modell-/Assetvertrag, isolierter Prototyp

Stand 08.10.2026. Aufbauend auf PR181/main 629c7c8 und der
[K03-Baseline](CAPACITY_BASELINE.md). Kein produktiver Formatwechsel.

## Verbindliche Grenzen

- Projektgeometrie bleibt die einzige fachliche Quelle. Ansichten, Renderer und
  AI/Text/Voice verwenden dieselben geprüften Application-Aktionen.
- Logische Asset-IDs bleiben stabil; Bildreferenzen verweisen auf diese IDs.
  Inhaltsidentität ist davon getrennt. Gleiche Bilder dürfen unterschiedliche
  logische IDs behalten, ohne ihren unveränderlichen Inhalt zu duplizieren.
- Eine künftige Modell-/Assettrennung darf vollständige Prüfung beim Commit,
  Transaktionsgrenzen und genau einen Undo-Schritt je akzeptierter Aktion nicht
  umgehen. Payload-Verifikation darf nur mit belegter Unveränderlichkeit und
  vertrauenswürdig erzeugtem Handle wiederverwendet werden.
- Aktuelles Schema 9, Dateilimits, Bildimport, produktive History und Renderer
  bleiben in diesem Auftrag unverändert. Kein paralleles editierbares BIM-Modell.

## Erprobter Vertragsentwurf, noch keine Produktfreigabe

`benchmarks/asset-contract.ts` trennt Manifest (Modell und Asset-ID→Inhaltsschlüssel)
und unveränderlichen Payload-Pool. SHA-256 über die kanonische Folge MIME-Typ,
Breite, Höhe und Base64 identifiziert exakt gleiche kodierte Inhalte, nicht visuell
gleiche Bilder. Auch die Metadaten gehören zur Identität. Der Prototyp friert beide
Strukturen rekursiv ein. Alte und neue Modellstände können denselben Pool behalten.

Das portable JSON-Experiment hat die eigene Kennung `novikov-asset-experiment`,
Revision 1. Es enthält alle Payloads, keine Dateipfade oder flüchtigen Object-URLs.
Es ist weder Schema 10 noch die Entscheidung für JSON statt ZIP/Binärcontainer.
Import prüft Version, eindeutige Schlüssel, Hash, Bildheader und Modellreferenzen;
fehlende/beschädigte Inhalte scheitern vor Übergabe. Headerprüfung ersetzt keine
vollständige Decoderprüfung. Für Produktion bleibt die geprüfte Importgrenze nötig.
`pack` ist der interne Writer für eigene Dokumente; der externe Vertrauensübergang
ist `unpack`, das auch in strukturell manipulierten Paketen Hashfehler abweist.

Altdateien laufen durch den bestehenden `readProjectFile`-Migrationspfad und danach
durch die Aufteilung; explizit getestet sind Schema 1 mit Wand/Fenster und Schema 9
mit Bildreferenzen. Rückwandlung liefert das vollständig validierte bisherige Projekt.
Ein Export zurück ins alte Format unterliegt weiterhin dessen Limits; Deduplizierung
hebt diese nicht auf.

Separate Diagnosebudgets: Manifestbytes, Summe eindeutiger Base64-Payloadbytes,
Summe ihrer Pixel und gesamte Paketbytes. Beispielwerte sind Testparameter, keine
neuen Produktgrenzen. Beim Paketlesen wird Größe vor JSON-Parsing begrenzt und die
Payloadsumme vor Dekodierung/Hashing geprüft. Ein späterer Binär-/ZIP-Adapter braucht
zusätzlich entpackte Größenlimits. Decodierter RAM, GPU-Texturen und Cachebudgets
sind eigene, bislang ungemessene Größen.

Für Produktion vorgeschlagen: Pool über Present/Past/Future erreichbar halten;
erst nicht mehr erreichbare Inhalte freigeben. Keine Löschung bloß wegen Entfernen
einer Referenz im aktuellen Stand. GC, Importabbruch, Pooländerungen, Cache-Eviction,
Speicheradapter und produktive History sind hier noch nicht implementiert.

## Vergleich und Aussagegrenze

Reproduktion: Diagnose-Vite starten, `/benchmarks/asset-contract.html` öffnen,
„Vergleich starten“. Nutzt unverändert `capacityFixture(1000)` und die drei K03-
512×512-PNG/JPEG-Quelldateien über den echten Bildimport. Keine parallelen Builds.
[Rohdaten](asset-contract-2026-10-08.json), ein lokaler Browserlauf, keine p95-Studie.

| Befund | Ergebnis |
|---|---:|
| Altes Projekt / neues portables Paket, 3 verschiedene Bilder | 3.754.947 / 3.755.496 Bytes |
| Modellmanifest ohne Payload | 156.022 Bytes |
| Payload separat | 3.598.940 Base64-Zeichen |
| Viertes logisches Asset mit identischem ersten Bild | weiterhin 3 Payloads |
| Mit Duplikat: alt / Paket | 4.958.705 / 3.755.743 Bytes |
| Erstmaliges Split / Pack / Unpack | 552 / 137 / 621 ms |
| 100 JSON-Serialisierungen: alt / Manifest | 1.151 / 99 ms |

Rückwandlung stimmt im Browser exakt mit dem vollständig validierten Original
überein. 1/10/50/100 Serialisierungen zeigen Datenarbeitsumfang, **keine produktiven
History-Commits**. Die Schleife behält nicht 100 exportierte Strings. Die summierten
375,5 MB gegenüber 15,6 MB sind daher weder Heap-Verbrauch noch Einsparungsnachweis
physischer Stringkopien. Ein Pool käme einmal hinzu. Einzigartige Bilder machen das
portable Paket noch nicht kleiner. Hashing und Vollprüfung machen den kalten Pfad
teurer; diese Arbeit gehört nicht in die Vorschau.

## Abnahme und genau ein Folgeauftrag

Fünf automatisierte Tests: IDs/Deduplizierung/Roundtrip/Freeze; beschädigte,
fehlende und doppelte Payloads/unbekannte Revision; getrennte Budgets;
Erreichbarkeit älterer Snapshots; echte Schema-1-Migration.
Praktisch: Vergleich starten, `roundtrip: true`, vier logische Assets bei drei
Payloads prüfen. Die CAD-Anwendung hat noch keine neue Speicherfunktion.

**Nächster begrenzter Auftrag: K02b validierte Asset-Handles am gemeinsamen
Application-Prüfpfad pilotieren.** Für eine vorhandene kleine Modellaktion
(Linienfarbe ändern) importierte Payloads einmal unveränderlich prüfen und die
Folgeprüfung ausschließlich bei nachweislich identischem Handle wiederverwenden.
Vollständige Geometrie-/Referenzprüfung erhalten. Gegen bisherigen Vollprüfpfad
bei drei Bildern, 1/10/50/100 Änderungen, manipulierter Payload und Undo/Redo
vergleichen. Zuerst isolierter Pilot, kein Dateiformatwechsel. Ziel ist ein
gemessener Action-/Commit-Gewinn, nicht allein weniger JSON-Bytes. Danach erst
über produktive Migration entscheiden. Alle übrigen K-/V-Anforderungen sowie die
offene kleine Shift-Diagnose bleiben bestehen.

Validierung: 661/661 Tests bestanden, Produkt- und Diagnose-Typecheck, Build
und Lint erfolgreich (sechs bestehende React-Fast-Refresh-Warnungen).
