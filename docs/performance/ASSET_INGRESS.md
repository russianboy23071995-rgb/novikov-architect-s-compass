# K02c: Asset-Handles an den Eingangsgrenzen

08.10.2026, PR183 nach grüner CI zusammengeführt, Basis main aed2712.

Der echte PNG/JPEG-Import erzeugt nach Headerprüfung, Browserdekodierung und
PNG-Normalisierung ein vollständig storage-geprüftes, eigenes eingefrorenes
Assetobjekt. Der Schema-9-Dateilader prüft zuerst das gesamte Projekt und erzeugt
danach neue Handles. Die kalte Ladegrenze prüft Storage dabei bewusst nochmals
beim Erzeugen der eigenen Kopie; im Interaktionspfad findet dies nicht statt.
Alte Dateiversionen ohne Assets behalten die bestehenden Migrationen.

Alle bestehenden Application-Aktionen profitieren über dasselbe Asset-Schema;
kein Werkzeug bekommt eine eigene Cachelogik. Die Projektprüfung bleibt für
Geometrie, Anschlüsse, Fenster, Ebenen, IDs und Referenzen vollständig aktiv.
Dateiformat 9, Base64-Inhalt, Größenlimits und History-Semantik bleiben gleich.
Es wird kein Vertrauensmerkmal gespeichert; deserialisierte Daten werden neu
geprüft. Der Dateilader prüft wie bisher Storage-Konsistenz, nicht die vollständige
Bilddekodierbarkeit. Eine Decoder-/Integritätsmigration ist nicht Teil dieses PR.

## Nachweise

- 667 Tests bestanden, beide Typechecks und Build bestanden; Lint ohne Fehler,
  sechs bestehende Fast-Refresh-Warnungen.
- Neue Dateigrenztests: laden, Linie und Wand ändern, Undo/Redo, speichern und
  wieder öffnen; stabile IDs, neue Handle-Identität nach Laden, identische Daten.
- Beschädigte Base64-Daten, übergroße Pixelmaße, fehlende Referenzziele, ungültige
  Wandgeometrie und defektes JSON werden abgewiesen.
- Browser: `/benchmarks/asset-ingress.html` → „Workflow prüfen“. Drei echte
  synthetische PNG/JPEG-Importe aus K03, vorhandene Import-/Commit-Aktionen,
  Linienfarbe und Höhe einer freistehenden Wand ändern, zweimal Undo/Redo,
  serialisieren und öffnen; geladenes Bild wird tatsächlich dekodiert/angezeigt.
  [Rohresultat](asset-ingress-2026-10-08.json): alle Kriterien erfüllt,
  512×512 Darstellung, Schema 9, 3.755.091 Bytes. Die Fixture enthält zusätzlich
  die bestehenden T-Gruppen. Eine anfänglich versuchte unzulässige Einzelhöhen-
  änderung in einer T-Gruppe wurde korrekt abgewiesen; Test nutzt eine freie Wand.
- Das ist ein Browser-Integrationsworkflow mit produktiven APIs, kein vollständiger
  Klicktest der CAD-Menüs. Keine neue Zeit-/RAM-Garantie; die Zeitmessung bleibt
  [K02b](VALIDATED_ASSET_HANDLES.md). Dessen Kontrollpfad klont nun importierte
  Assets ausdrücklich, damit der Vergleich trotz produktiver Handles gültig bleibt.

## Praktische Abnahme in der Anwendung

Anwendung neu laden. PNG/JPEG importieren und platzieren; Linienfarbe und eine
zulässige Wandeigenschaft ändern. Mit Undo/Redo beide Änderungen prüfen.
Projekt speichern und wieder öffnen; Bild und Geometrie müssen gleich bleiben.
Bereits geöffnete alte Laufzeitprojekte erhalten Handles durch Wiederöffnen;
neue Importe verwenden sie sofort. Keine ungespeicherten Änderungen verwerfen.

## Genau ein nächster Auftrag

**K05a: verbleibenden Commit-Aufwand getrennt profilieren.** Mit derselben
Dreibild-Fixture Validierung, JSON-Serialisierung, Größenprüfung und Vergleich
in einer isolierten Diagnose messen. Ein-/Ausblendung, No-op und normale
Modelländerung gegenüberstellen. Aus den Daten genau eine begrenzte gemeinsame
Optimierung ableiten; noch kein Delta-History-/Dateiformatumbau und keine
Validierung abschalten. K-/V-Wünsche, größere Asset-Kapazität und kleine
Shift-Diagnose bleiben offen.
