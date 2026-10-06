# Dauerhafte T-Verbindungen: Implementierungsvertrag

Stand 06.10.2026, geprüft gegen 0939d01 (PR131).
Aktualisierung 06.10.2026: Schema 8 und gemeinsame Application-Aktionen sind
implementiert. Dieser Vertrag bleibt Grundlage; die frühere Kerntrennung und
Persistenzvorbereitung sind abgeschlossen. Automatische Erzeugung beim Fangen
ist der nächste begrenzte Auftrag in DEVELOPMENT_PLAN.md.

Fortschritt 06.10.2026: Die am Ende geplante Kerntrennung ist umgesetzt.
`t-pair.ts` arbeitet ohne Projektvalidierung, die öffentlichen Einstiege prüfen
weiterhin den vollständigen Snapshot. Aktueller Folgeauftrag: DEVELOPMENT_PLAN.md.

## Bestätigte Bedienregeln

- Automatische Achsenanschlüsse sind das Ziel; das Diagnosefenster ist kein
  künftiger Pflichtschritt zum Verbinden.
- Einzelwandbewegung löst die Verbindung. Die andere Wand wird nicht mitgezogen.
- Nutzerantwort 06.10.2026: Beim Verlängern/Verkürzen eines Hauptwandendes bleibt
  der T-Anschluss an seiner bisherigen Weltposition. Liegt der Anschlusspunkt
  nicht mehr im Inneren der Hauptachse, löst sich die Verbindung. Nebenwand und
  Fensterpositionen werden nicht zur Erhaltung des Anschlusses verschoben.
- Fenster dürfen im T-Fall berühren, aber nicht überschneiden. Die strengeren
  Eckregeln bleiben unverändert. Eine Wandkette bildet weiterhin einen Undo-Schritt.

Ein Punkt weiterhin innerhalb der Achse bedeutet noch keine gültige Kontaktfläche:
Wenn die Kontaktbreite nach einer Kürzung über die Endkappe reicht, bleibt die
geometrische Prüfung erforderlich. Vorschlag für diese erste Integration:
Änderung atomar ablehnen, statt einen unzulässigen Körper zu speichern. Das ist
keine Freigabe für das Abschneiden von Kontaktflächen oder Fensteröffnungen.

## Technische Entscheidung für die begrenzte Umsetzung

Erstes Ziel: isoliertes rechtwinkliges T-Paar gleicher Stärke/Höhe; Hauptwand
bleibt ein Bauteil. Mehrere Ts an einer Wand und Kombinationen mit Eckanschlüssen
bleiben vorerst ausgeschlossen, bis ihre Komposition geprüft ist.

Schema 8 ergänzen um storey.wallTJunctions mit Einträgen:

```
{ hostWallId, incoming: { wallId, endpoint: 0 | 1 } }
```

Keine separate Weltkoordinate, kein relativer Anker und kein zweites Profil
speichern: Der referenzierte Nebenachs-Endpunkt ist bereits der feste Weltanker.
Ändert sich die Hauptwandlänge, bleibt dieser Punkt unverändert. Beziehung über
IDs und Endindex, nie Navigatornummern. Doppelte, fehlende, selbstreferenzierende
oder konkurrierende Beziehungen strikt abweisen. Ein isoliertes Paar darf nicht
zusätzlich durch wallJoins gebunden sein. Die Reihenfolge der Relation ist
semantisch: Hauptwand und Nebenwand sind nicht austauschbar.

Bei Kürzung außerhalb des Achssegments wird die Relation im Änderungsvorgang
entfernt, der Nebenwandkörper bekommt wieder sein ungekürztes Ende. Ein solcher
Zustand darf nicht erst beim Laden repariert werden. Ungültige Beziehungen in
Dateien werden abgewiesen, nicht still gelöscht.

## Codegrenzen und Integrationsreihenfolge

1. Domain t-openings in reinen Geometrie-/Öffnungskern und validierenden öffentlichen
   Einstieg trennen. Heute ruft inspectTOpenings validateProject auf. Dieser
   Aufruf darf nicht aus connectedWallSolids erfolgen, denn validateProject
   ruft connectedWallSolids bereits auf. Keine rekursive Projektvalidierung.
   Der interne Kern erhält aufgelöste Wandparameter/Fenster; die öffentliche
   Vorschau prüft weiterhin Projektzugehörigkeit und Kontext.
2. schema.ts: Schema 7 als strikten Altvertrag erhalten, Schema 8 ergänzen.
   load.ts: V7 erst validieren, dann wallTJunctions: [] ergänzen. V1–V6 weiter
   über explizite Migration führen. Bestehende IDs, Geometrie, Eckbezüge und
   Sichtbarkeit unverändert erhalten. Niemals beim Laden neue Ts erkennen.
3. connectedWallSolids: bestehende Ecken weiter ableiten; isolierte Ts über
   denselben Domain-Kern hinzufügen. wallContourSolid bleibt gemeinsame
   Extrusion. Bestehende Verbraucher für Grundriss, 3D, Picking, Fang und normalen
   IFC-Export sollen die gespeicherten Ts über diesen Pfad erhalten.
4. Gemeinsame Application-Aktion zum Anlegen/Lösen mit Quellprojekt, Host-ID,
   Neben-ID und Endindex. Vorschau validieren, Bestätigung genau ein Commit;
   veraltete Ziele abweisen. Keine per-Werkzeug-Mutation.
5. Die Auflösung bei Bearbeitung braucht Aktionsabsicht: Elementbewegung und
   Endpunkt-/Längenänderung unterscheiden. updateWall sieht nur neue Koordinaten;
   daraus darf nicht geraten werden, welcher Bedienvorgang stattfand. Expliziten
   Änderungskontext vom vorhandenen Direct-Edit-/Command-Pfad übergeben. Beim
   Lösen im selben Vorgang nicht sofort automatisch neu verbinden, auch wenn
   eine verschobene Hauptachse noch durch den Nebenpunkt verläuft.
6. Automatisches Erzeugen anschließend an vorhandenen Fangkontext anbinden:
   explizite Zielachse, stabiler Quellstand und passender Nebenendpunkt. Ein
   Fangradius ist keine Domain-Identität. Mehrdeutige Hosts nicht per Listenfolge
   wählen; bestehende Referenzauswahl nutzen. Keine globalen Wandpaarabfragen
   pro Mausbewegung. Normales Ändern/Laden darf keine neue Nachbarsuche auslösen.

## Modellaktionen und Fenster

Änderungen an Stärke, Höhe oder Körperversatz durch dieselbe Validierung führen.
Solange gleiche Querschnitte Voraussetzung sind, unzulässige Änderungen atomar
abweisen; keine automatische Größenübernahme auf Nachbarwände erfinden.
Fensteränderungen müssen die gespeicherte T-Kontaktprüfung ausführen, auch bei
unsichtbaren Fenstern. Keine verdeckten Durchdringungen durch Layerfilter.

Maus, Eigenschaften, Text und Voice verwenden dieselben Aktionen einschließlich
Änderungskontext. Sprachbefehle beziehen sich auf stabile Auswahl-IDs; kein
separates Verbindungsmodell. Undo/Redo stellt Geometrie und Beziehung gemeinsam
wieder her; Sichtbarkeit bleibt in ihrer unabhängigen History.

## Abnahmetests

- V1–V7 laden ohne zusätzliche T-Verknüpfungen; Schema-8-Rundlauf mit festen IDs.
- Hauptwandende verlängern: Nebenpunkt unverändert. Kürzen hinter den Nebenpunkt:
  Relation weg, Nebenwand unverändert, gerade Kappe, Undo/Redo stellt alles wieder her.
- Einzelwand bewegen: Relation lösen, keine Mitnahme und kein sofortiges Rejoin.
- Ungültiger Endrandkontakt, fehlende IDs, Duplikate, Mehrfachbezüge, konkurrierende
  Ecken und Fensterüberschneidungen: atomare Ablehnung, Eingaben unverändert.
- Freie/berührende Fenster, Achslagen, Endpunktumkehr und unveränderte GUIDs.
- Gleiche Konturen in Plan, 3D, Dateirundlauf und regulärem IFC; unabhängige
  IFC-Prüfung und Archicad-Abnahme. Der separate IFC-Test aus PR131 ist noch
  kein Nachweis einer gespeicherten T-Relation. Nutzerabnahme steht weiterhin aus.

## Implementierungsnachweis und praktischer Test

500 Tests einschließlich 12 neuer Integrationsfälle; TypeScript/Build bestanden,
Lint ohne Fehler (6 bekannte FastRefresh-Warnungen). Generator:

```
node --experimental-strip-types scripts/generate-t-ifc-fixtures.mjs <Zielordner> --persistent
```

Erzeugt drei Schema-8-Projekte und reguläre IFC-Exporte (frei, berührend,
berührend/gedreht). IfcOpenShell 0.8.5 bestätigt IFC4/EXPRESS, Profile,
Zuordnungen, Platzierungen und analytische Nettovolumina aller drei Dateien.
Der Modus ohne --persistent bleibt separater Abnahmeexport ohne gespeicherte T.

1. t-free.project.json über Open project laden, 2D und 3D ansehen.
2. Wall 1 auswählen und Länge von 6 auf 8 m ändern: Nebenwand bleibt stehen,
   T bleibt erhalten. Mit Undo den Ausgangsstand wiederherstellen.
3. Wall 1 auf 2 m kürzen: Verbindung löst sich, Nebenwand behält ihre Position.
   Undo/Redo stellt Beziehung und Geometrie gemeinsam wieder her.
4. Eine Wand frei verschieben: Verbindung löst sich ohne Mitnahme der anderen.
5. Speichern, erneut öffnen und den normalen IFC-Button verwenden.
6. t-touch.project.json prüft erlaubte Fensterberührung; Änderung der Host-
   Fensterposition zur Mitte muss die Überschneidung ablehnen.

Browser-Laden und 3D-Darstellung geprüft. Save und IFC melden erfolgreiche
Erstellung/Downloadanforderung; der Automations-Downloadpfad blieb aus, daher
keine Behauptung eines geprüften Browser-Download-Dateirundlaufs. Dieser ist
als manueller Abnahmeschritt offen, JSON-Rundlauf ist durch Tests abgesichert.
Archicad-Abnahme dieser regulären T-Dateien bleibt ebenfalls offen.

## Nächster Auftrag

Einziger aktiver Folgeauftrag ist die Anbindung der gemeinsamen 2D-Endpunkt-
bewegung an eindeutigen Achsenfang und die gespeicherte T-Aktion, wie im aktuellen
DEVELOPMENT_PLAN beschrieben. Keine neue Pflichtbedienung im Diagnosefenster.
