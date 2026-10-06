# Dauerhafte T-Verbindungen: Implementierungsvertrag

Stand 06.10.2026, geprüft gegen 0939d01 (PR131).
Noch keine persistente T-Verbindung implementiert.

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

## Genau ein ausführbarer Folgeauftrag

Zuerst den bestehenden T-Geometrie-/Öffnungspfad so aufteilen, dass eine bereits
validierte Projektprüfung ihn ohne validateProject-Rekursion aufrufen kann.
Vorschau und separater IFC-Abnahmeexport bleiben auf demselben Kern; ihre
öffentlichen Eingänge behalten strikte Validierung. Grenztests ergänzen und alle
bestehenden 2D/3D-/IFC-Nachweise erhalten. Noch keine Schemaänderung in diesem
Schritt. Danach kann Schema 8 mit derselben geprüften Ableitung integriert werden.
