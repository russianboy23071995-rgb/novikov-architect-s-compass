# Bildreferenzen und Zweipunkt-Kalibrierung

Stand: 07.10.2026. Bestandsaufnahme auf main d18990d nach PR160.
Dies ist ein technischer Arbeitsentwurf, keine implementierte Funktion.
Grundlagen: DEVELOPMENT_GUIDE.md, Etappe 7; ARCHITECTURE.md, Abschnitte 29/30,
Plattformgrenze, gemeinsame Auswahl und ToolInteraction.

## Verbindlich und noch offen

Verbindlich: ein Modell, stabile IDs, Meter, gemeinsame Aktionen, unveränderte
BIM-Skalierungssperre, atomare History und getrennte Sichtbarkeit von BIM-Projekt
und späteren DrawingDocuments. Zoom verändert keine Modellmaße.
Der Guide beschreibt zwei Messpunkte, eine bekannte Länge mit Einheit und den
ersten Messpunkt als festen Skalierungsanker.

Verbindliche Nutzerentscheidung vom 07.10.2026: Auch importierte PNG-/JPEG-Bilder
dürfen mittels Zweipunkt-Kalibrierung skaliert werden. Dies ersetzt ausschließlich
die Bitmap-Ausnahme aus Architekturabschnitt 30. BIM-Bauteile bleiben gesperrt.
Keine Entscheidung zu PDF-Vektorzerlegung, Desktop-Plattform oder konkreten
Asset-Grenzwerten wird daraus abgeleitet.

## Nachgewiesener Bestand und Anschlussstellen

| Aufgabe | Vorhanden | Erforderliche Ergänzung |
| --- | --- | --- |
| Projekt | src/domain/project/schema.ts: striktes Schema 8, ein Geschoss; Wände, Fenster, Linien, Schraffuren | Referenztyp, Asset-Tabelle, eindeutige IDs und geprüfte Verweise |
| Datei | src/interop/project-file/load.ts: Migration 1–8; src/lib/bim/model.ts: serializeProject | Versionierte Migration und dauerhafte Bilddaten, kein gespeichertes blob: URL |
| History | src/lib/bim/history.ts: commitProject, Undo/Redo, 100 Snapshots, 10 MiB Dateileselimit | Atomarer Import; Kalibrierung nur Transformation, Asset nicht erneut dekodieren |
| Aktionen | src/application/hatches/actions.ts: snapshotgebundene Vorschau/Commit | Eigener Referenzadapter nach gleichem Vertrag; keine neue Logik im Workspace |
| Auswahl | src/application/selection/target.ts und state.ts; rendering/viewport/selection-shapes.ts | Typed reference-Ziel und abgeleitetes Viereck für Klick/Strg/Marquee |
| Ebenen | src/application/layers/actions.ts und visibility.ts | Referenzen bei Belegung, Zuweisung und Eligibility berücksichtigen |
| Eingabe/Fang | application/tools/interaction.ts, tools/snapping.ts, useToolInteraction | Verbraucher derselben Engine; kein eigener Fang oder Tab-Handler |
| Einheiten | src/core/units/metres.ts parst numerischen Metertext | Explizite Einheit für Kalibrierstrecke prüfen; vorhandene Befehlsparser gezielt abgleichen |
| IFC/3D | Vorhandene Wand-/Öffnungsexporte und Solids | Referenz bleibt 2D; kein Bildkörper oder IfcWall-Ersatz |

Es gibt aktuell weder Bild-Asset-Schema noch Referenzimport oder Kalibrieraktion.
DrawingDocument ist Architekturvertrag, noch kein persistenter Besitzer im Schema.
Die Typaufzählungen für Auswahl/Ebenen sind explizit: Ein neuer Typ muss dort
angebunden werden, aber nicht als Kopie der Interaktionsengine pro Werkzeug.

## Vorgeschlagener Datenvertrag

Erster Umfang: statische PNG/JPEG-Bilder, keine SVGs, URLs, PDFs oder Animationen.
Ein StoreyReference gehört zunächst ausdrücklich zum vorhandenen Geschoss:
`id`, `kind: image-reference`, `layerId`, `assetId`, `origin: {x,y}` in Metern,
`rotation` in Radiant und positiver einheitlicher `metresPerPixel`.
Keine Scherung, Spiegelung oder unabhängige X/Y-Skalierung. Vorschlag für die
Ablage: storey.references, projektweite assets-Tabelle. Spätere Dokumentreferenzen
bekommen einen ausdrücklich validierten Scope, keine stillschweigende Übernahme.

ImageAsset: stabile ID, geprüfter MIME-Typ, positive ganzzahlige Pixelmaße und
Base64-Nutzdaten. Dateiname ist nur Anzeigeinformation, niemals ein Zugriffspfad.
Importadapter dekodiert lokal, prüft tatsächliches Format und Maße und normalisiert
JPEG-Orientierung einmal. Domain kennt keine DOM-Bilder oder Browser-Handles.
Renderer erzeugt flüchtige URLs/Bildobjekte und gibt sie beim Freigeben wieder frei.

Vorschlag Koordinaten: Bildpunkt (u,v) ab linker oberer Ecke entspricht
origin + R(rotation) * (metresPerPixel*u, -metresPerPixel*v).
Kontur und Trefferflächen werden aus genau dieser Transformation abgeleitet.
Importplatzierung fragt Breite in Metern ab; Pixel oder DPI werden nicht als
bereits bekannte reale Größe ausgegeben. Unkalibriert bleibt sichtbar erkennbar.

## Dateigröße, Migration und Undo

Kleinster portabler Vorschlag: Bilddaten einmal in der Projekt-JSON einbetten.
Base64 vergrößert die Nutzdaten um etwa ein Drittel. Vor Import-Commit UND Export
die tatsächliche UTF-8-Größe einschließlich Metadaten gegen bestehende 10 MiB
prüfen. Keine Datei erzeugen, die derselbe Loader wegen ihrer Größe ablehnt.
Zusätzlich dekodierte Pixelzahl begrenzen, bevor großer Bildspeicher angelegt
wird. Konkretes Pixelbudget gehört in den Implementierungsauftrag mit Messung,
nicht als angebliche Nutzerentscheidung in diesen Vertrag.

Nächste freie Schema-Version zum Implementierungszeitpunkt wählen (derzeit 9).
Alte Dateien validieren und zu leeren assets/references migrieren. Fehlende oder
beschädigte Assets, kollidierende IDs, unbekannte Ebenen und ungültige Transformationen
atomar ablehnen. UI muss das bestehende Modell erhalten. Ältere Builds werden die
neue Version ablehnen; keine stillschweigende Entfernung von Referenzen.

Import fügt Asset und Referenz gemeinsam in einem History-Schritt hinzu. Abbruch
nach Dateiauswahl oder ein später Decoder-Callback nach Modellwechsel committen
nichts. Kalibrierung ändert nur Transformation; immutable Asset-Strings wiederverwenden.
Keine Canvas-Bitmaps in History. Speicherverhalten mit wiederholtem Undo prüfen,
bevor größere Bildlimits oder externe Asset-Pakete freigegeben werden.

## Gemeinsamer Aktionsvertrag für die spätere Kalibrierung

Request bindet Projekt-ID, unveränderte Basisrevision, typed Ziel-ID, beide
Messpunkte im lokalen Bildraum sowie positive Ziellänge in Metern. UI hält die
explizite Eingabeeinheit fest; AI/Text/Voice darf keine fehlende Länge erraten.
Application löst den echten Zieltyp auf, prüft Berechtigung und Asset/Sichtbarkeit,
berechnet Vorschau und validiert beim Bestätigen erneut. Nur genau eine erlaubte
Referenz; gemischte oder BIM-Auswahl vollständig ablehnen, keine erste-ID-Abkürzung.
PNG/JPEG sind gemäß obiger Entscheidung erlaubt; unbekannte Typen bleiben gesperrt.

Für Weltpunkte p1/p2: d = Abstand(p1,p2), f = Ziellänge/d;
neuer Maßstab = alter Maßstab*f; neuer Ursprung = p1 + f*(alter Ursprung-p1).
Rotation bleibt gleich. Punkt p1 bleibt unverändert. Nullstrecke, nichtendliche
Werte, Überlauf und numerisch nicht darstellbare Geometrie werden abgewiesen.
Generische Mathematik gehört nach geometry/transforms, Berechtigungen nach
application/references, gespeicherte Regeln nach domain, Dateidekodierung nach interop.
Vorschlag API: previewReferenceCalibration(base,current,request) und
commitReferenceCalibration(history,base,request), mit einem Undo-Schritt.

Punktaufnahme und Hilfsanzeige konsumieren ToolInteraction und die vorhandene
Fang-Engine. Rasterpixel liefern keine echten Linien/Schnittpunkte. Anfangs nur
Rahmengeometrie als explizite Fangquelle; Bildinhalt wird visuell abgelesen.
On-Demand löst die Aktion aus; Eigenschaften bleiben in Werkzeugeigenschaften.
Text/Voice/AI müssen später denselben Request mit stabiler Zielrevision erstellen,
keine eigene Skalierung und keinen ungeprüften automatischen Commit.

## Abnahmeplan

- Importiertes PNG/JPEG sichtbar, auswählbar, auf eine Ebene zugewiesen;
  ausgeblendete Ebene weder pickbar noch fangbar; belegte Ebene nicht löschbar.
- Datei speichern, Browser neu laden, Projekt öffnen: Bild und Transformation
  bleiben vorhanden, auch ohne ursprüngliche Quelldatei oder Blob-URL.
- Import abbrechen, ungültiges Bild, zu große Datei, fehlendes Asset, spätes
  Decoding nach Modellwechsel: keine Teiländerung; Undo/Redo atomar.
- Bekannte Strecke auf 5 m kalibrieren, p1 bleibt
  fest; gedrehtes Bild ebenso; Zoom ohne Maßänderung; JSON und Undo/Redo erhalten
  identische Transformation. Vorschau ist nicht der gespeicherte Zustand.
- Nullstrecke, negative/fehlende Einheit, NaN/Infinity, fremde Revision sowie
  BIM- und gemischte Ziele direkt über Application ablehnen.
- IFC der vorhandenen BIM-Elemente bleibt unverändert; kein Asset wird exportiert.

## Genau ein nächster ausführbarer Auftrag

Persistenten Referenz-Datenkern implementieren, noch ohne Canvas-Importbedienung:
ImageAsset und StoreyReference mit PNG/JPEG-Whitelist, Transformation und
Verweisprüfung; Migration bisheriger Dateien; atomare Application-Erstellung
für bereits geprüfte Asset-Daten; Größenprüfung für lesbare Projektdateien;
Roundtrip-, Fehlereingaben- und History-Tests. Auswahltypen noch nicht als bedienbare
Funktion exponieren. Noch keine Kalibrieraktion; keine Bilddekodierung durch Domain.
Das schafft eine überprüfbare Grundlage für den anschließenden Importadapter,
ohne leere Klassen, zweite History oder komplette Dokumentarchitektur anzulegen.
