# Eck- und T-Anschluss an derselben Hauptwand

## Umsetzungshinweis — 06.10.2026

Der nachfolgende Text bleibt als freigegebener Planungsnachweis erhalten.
Der entfernte T-Zulauf an einem Host mit genau einer rechtwinkligen Ecke ist
jetzt implementiert; die fruehere pauschale Sperre gilt dafuer nicht mehr.
Kontaktgrenzen und Eckpartner werden anhand der erhaltenen Kontur geprueft.
Schema 8 bleibt bestehen, da keine Datenfelder oder deren Interpretation wechseln;
aeltere Builds lehnen die neu erlaubte Kombination ab statt Relationen zu verlieren.

Nutzerentscheidung 06.10.2026, ersetzt den bisherigen Folgeauftrag: Keine eigene
Aktion zum gemeinsamen Verschieben eines Eckpunkts entwickeln. Der Nutzer will
beide betroffenen Waende auswaehlen und gemeinsam als ganze Elemente bewegen.
Mehrfachauswahl und Gruppenbewegung werden als naechster begrenzter Auftrag
zunaechst gegen den vorhandenen Stand geprueft. Einzelendpunktbewegung kann
weiterhin die Ecke loesen. Historische Aussagen unten zur gemeinsamen Eckaktion
sind damit ueberholt. Nachweise zur Ecke-T-Kombination stehen im DEVELOPMENT_PLAN.

## Historischer Planungsstand

Stand: 06.10.2026. Planungsstand nach PR143, Basis main 3340195.
Dieser Auftrag implementiert keine neue Anschlussgeometrie. Die aktuelle Sperre bleibt bestehen.

## Nachgewiesener Ist-Stand

- `src/domain/elements/wall/t-relations.ts`, `tConnectionContours`: lehnt jede
  T-Beteiligung einer Wand mit Eckanschluss ab; mehrere getrennte Ts an einem
  Host sind bereits erlaubt. Nebenwand darf nicht selbst Host oder doppelt T-gebunden sein.
- `src/domain/elements/wall/connections.ts`, `connectedWallContours`: setzt
  Eckkonturen endpunktweise zusammen, prüft Kontur und Eckfenster, übernimmt
  danach die T-Konturen mittels `contours.set(id, ring)`.
- `t-junction.ts`, `deriveRightAngleTJunction`: erzeugt für den Host eine volle
  rechteckige Körperkontur. Nur die Nebenwand erhält einen beschnittenen Abschluss.
  Bloßes Entfernen der Sperre würde daher die zuvor berechnete Host-Ecke ersetzen.
- `connectedWallSolids`, `lib/bim/geometry.ts` und `lib/bim/ifc.ts` verwenden die
  gemeinsamen abgeleiteten Konturen. `wall-plan-outline.ts` entfernt sichtbare
  Kontaktlinien nur zwischen gespeicherten, sichtbaren Partnern.
- `previewTConnection`, `connectWallAtTAxis`, `appendWallChain` und
  `previewWallChain` sind die vorhandenen Application-Einstiegspunkte.
  Schema 8 speichert Eck- und T-Relationen getrennt anhand stabiler IDs.

Lesender Modellversuch: die unten aufgeführten Wände H, E und N lassen sich
anlegen; H/E haben genau eine Eckrelation. Hinzufügen von T(H,N,Ende 1)
wirft die vorhandene Eckanschluss-Meldung. Serialisiertes Modell bleibt gleich.
Die abgeleitete H-Kontur vor T lautet:
`(-0.36,0), (6,0), (6,0.36), (0,0.36)`.
Dies ist ein Nachweis der heutigen Sperre, kein bestandener Kombinationstest.

## Bestehende verbindliche Regeln

- Ein Bauteil bleibt ein Modellobjekt. Grundriss, 3D, Projektdatei und IFC lesen
  dieselben gespeicherten Relationen und daraus abgeleitete Konturen.
- Sichtbare, ausdrücklich gefangene Achsen liefern Anschlussabsicht. Keine neue
  Nachbarschaftssuche beim Laden und kein T allein aus numerisch gleichen Koordinaten.
- Einzelwandbewegung löst deren Verbindungen automatisch. Bestehende Regeln zur
  gemeinsamen Eckpunktbewegung bleiben erhalten. Beim Verlängern/Kürzen eines
  Hosts bleibt ein T-Anker am Weltpunkt; entfällt er, wird die T-Relation gelöst.
- Fenster dürfen T-Kontakte auf ihrer eigenen Wand überqueren. Sie dürfen weiterhin
  keinen schrägen Eckabschluss berühren/überschreiten. Kein Wechsel der Host-ID,
  keine automatische Öffnung in einer Nachbarwand.
- Gesamte Wandkette ist ein Undo-Schritt. Vorschau/Abbruch ändern weder Historie
  noch Projekt. AI/Text/Voice bleiben Adapter derselben geprüften Aktionen mit
  festem Zielkontext; keine separate Anschlusslogik.

## Vorschlag für den ersten begrenzten Fall

Ein gerader Host hat einen vorhandenen rechtwinkligen Eckpartner an einem Ende
und einen rechtwinkligen T-Zulauf in seinem ungestörten Seitenbereich. Alle drei
Wände haben gleiche Stärke und Höhe. Vorhandene Achsversätze bleiben erhalten.
Die Nebenwand hat keine weitere Verbindung. Dieser Umfang ist ein technischer
Umsetzungsvorschlag; die bisherige Sperre wird erst durch einen Implementierungs-PR ersetzt.

Nicht Teil dieses ersten Falls: T-Nebenwand mit eigener Ecke, T und Ecke am selben
Knoten, T-Kontakt am Gehrungsbereich, beidseitig T-gebundene Nebenwand,
unterschiedliche Querschnitte, schräge T-Winkel, allgemeine Netz-/Boolean-Lösung.
Bereits funktionierende reine Eckketten und Mehrfach-Ts bleiben erhalten.

## Kleiner Testgrundriss (Meter)

| ID | Achsanfang | Achsende | Stärke | Höhe | Körperversatz | Beziehung |
|---|---|---|---|---|---|---|
| H | (0,0) | (6,0) | 0.36 | 2.80 | +0.18 | Hauptwand |
| E | (0,0) | (0,3) | 0.36 | 2.80 | +0.18 | Ecke H/0–E/0 |
| N | (3,-3) | (3,0) | 0.36 | 2.80 | +0.18 | T auf H, N/1 |

Optionales Fenster F auf H: Breite 1.20, Höhe 1.20, Brüstung 0.90,
relative Position 0.5. Es liegt über dem T-Bereich und entfernt sich deutlich
von der Ecke. Die Koordinaten beschreiben einen Prüfaufbau, keine neue Nutzerpräferenz.
Varianten spiegeln N auf die andere Seite und drehen/verschieben den gesamten Aufbau;
H/E-Knoten bleibt jeweils unverändert. Keine bereits gültige Kombinations-Projektdatei
vortäuschen: der aktuelle Loader muss eine solche Relation weiterhin zurückweisen.

## Technischer Umsetzungsvorschlag

1. Vorhandene Eckkonturen zuerst vollständig ableiten. Der Host behält diese
   Kontur; eine T-Relation darf sie nicht mit ihrem Rechteck überschreiben.
2. T-Kern für Nebenwandabschluss und Kontakt weiterhin verwenden. Kontakt nur
   zulassen, wenn seine volle Breite auf dem verbliebenen geraden Host-Seitenstück
   liegt und die Nebenwand den Eckkörper nicht überlappt. Achsanker im Segmentinneren
   allein genügt nicht. Abstand aus realen Konturen und vorhandenen Modelltoleranzen
   ableiten; kein erfundener fester Zentimeterabstand.
3. Kontakt am Endpunkt des Seitenstücks oder im Eckbereich im ersten Umfang
   ausdrücklich abweisen. Grund nennen und Vorschau/Commit gleich behandeln.
4. Finale zusammengesetzte Kontur einmal fachlich prüfen; Eckfensterprüfung darf
   durch das für T erlaubte Öffnungs-Clipping nicht umgangen werden.
5. Application-Aktionen und Zeichnungsvorschau wiederverwenden. Sonderfall nicht
   in BimPlan, Inspector, IFC oder Sprachadapter nachbauen. Cache bleibt snapshotgebunden.
6. Bestehende Relationsfelder voraussichtlich ausreichend. Vor Festlegung der
   Dateikompatibilität prüfen: alte Schema-8-Programme lehnen Kombinationen ab.
   Neue Dateien niemals beim Laden still reparieren. Versionsentscheidung im
   Implementierungs-PR ausdrücklich begründen; hier keine neue Version beschlossen.

## Akzeptanzmatrix für die Umsetzung

| Fall | Erwartung |
|---|---|
| H/E zuerst, dann N per T-Fang | Ecke bleibt geometrisch identisch; N endet an richtiger Host-Seite |
| H/N zuerst, dann E | Gleiches Ergebnis, unabhängig von Erzeugungsreihenfolge |
| N von gegenüberliegender Seite; gedrehter Aufbau | Analoger Abschluss ohne Lücke/Überlappung |
| Kontakt nahe Gehrung, nur teilweise auf gerader Seite | Verständliche Ablehnung; kein Commit |
| Gleicher Knoten für Ecke und T | Ablehnung, kein automatischer Mehrfachknoten |
| Schräger T oder verschiedene Stärke/Höhe | Bestehende Ablehnung bleibt |
| Nebenwand mit Ecke oder zwei T-Enden | Weiterhin ausgeschlossen |
| F über T verschieben | Frei auf H; Eckgrenze bleibt wirksam |
| F berührt schrägen Eckabschluss | Ablehnung trotz T-Clipping |
| Host entlang Achse verlängern/kürzen | T-Weltanker bleibt; außerhalb liegender Anker löst sich |
| Ganze H oder N verschieben | Betroffene Verbindungen lösen nach bestehender Regel, übrige bleiben |
| Gemeinsame Ecke bewegen | Bestehende Eckaktion; alle betroffenen Ts atomar neu prüfen |
| Kombination kippt während Bearbeitung in nicht unterstützte Geometrie | Keine Teiländerung; Abbruch erhält Ausgangsprojekt |
| Vorschau und Platzierung | Identische Kontur für dasselbe Ziel; Entwurfs-ID ist nicht persistent |
| Undo/Redo, JSON-Roundtrip | Gleiche IDs/Relationen/Konturen, atomare Historie |
| Grundriss/3D/IFC | Gleiche Profile, geschlossene Körper, plausible Volumina, separate Bauteil-IDs |
| Ebene eines Partners ausgeblendet | Darstellungskontakt korrekt; gespeicherte Verbindung bleibt bestehen |
| Bestehende reine Ecke/reine Ts | Kein Verlust bereits nachgewiesener Abläufe |

## Genau ein ausführbarer Folgeauftrag

Implementiere den beschriebenen entfernten rechtwinkligen T-Zulauf auf einer
Hauptwand mit genau einem rechtwinkligen Eckanschluss: Konturkomposition und
Kontaktprüfung in Domain/Geometry, Anschluss über vorhandene Application-Aktion,
zugehörige Matrixfälle als Regressionen, Build/Tests und praktische 2D-/3D-/IFC-Abnahme.
Keine Erweiterung auf die ausdrücklich ausgeschlossenen Topologien. Falls die
geometrische Prüfung neue Bedienentscheidungen erfordert, konkret dokumentieren
statt still neue Nutzerregeln zu erfinden.


### Erweiterung 06.10.2026: zwei Ecken an der T-Hauptwand
Verbindlicher implementierter Stand: Beide Hostenden dürfen rechtwinklige
Eckanschlüsse besitzen. Die gemeinsame Prüfung berücksichtigt jeden Eckpartner
und die zusammengesetzte Hostkontur. Kontakt/Überlappung mit einem Eckpartner
bleibt verboten. Historische Begrenzungen auf genau einen Host-Eckanschluss
sind damit überholt; andere Topologiegrenzen bleiben bestehen. Kein Schemawechsel.
