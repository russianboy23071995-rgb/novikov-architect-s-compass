# Ebenenvertrag und Dateimigration

Stand: 04.10.2026; geprüfte Basis 26987d1 (Integrationszweig nach PR #83).
Dieser Auftrag ist Planung. Schema, Bedienung und Produktionscode bleiben unverändert.

## Bestand und Anforderungen

`src/lib/bim/model.ts` validiert strikt Schema 1 mit einem Geschoss, Wänden,
Fenstern und optionalen Linien. Es gibt weder Layer noch layerId. IDs sind
projektweit eindeutig. `history.ts` validiert Snapshots und lädt über
deserializeProject; seine Fehlermeldung nennt ausdrücklich Version 1.
`application/direct-edit/controller.ts` verwendet diese gemeinsame History.
`application/snapping/local-sources.ts` cached Geometrie nach unveränderlichem
Project; Sichtbarkeit ist bisher kein Ebenenfilter. Die Sichtbarkeitsprüfung der
3D-Fußpunkte behandelt Verdeckung durch Material, nicht Organisationsebenen.

| Quelle | Erhaltener Umfang | Abhängigkeit / Verantwortung |
| --- | --- | --- |
| Guide F25–F27, N16 | Standardebenen, stabile Zuordnung, frei zuordnen/erstellen/umbenennen | domain/layers, Project-Validierung; application/layers und gemeinsame History |
| Guide F28–F29, N17 | Organisation > Ebenen; Umschalter, einzeln/alle/außer Auswahl schalten | gemeinsamer Sichtbarkeitskontext vor Rendering, Auswahl und Fang; UI erst danach |
| N38 | Räume standardmäßig auf Raum | zusätzliche Ebene; Raumtyp bleibt späterer Auftrag |
| N39, N46, N49 | 2D-Ergänzungen, Bemaßung und Textelemente | Annotation-Scope bleibt eigenständiger Bezug; keine implizite Scope-Änderung durch Layer |
| N42, N47 | Wand-/Deckenaufbau | AssemblyLayer ist Materialschicht, keine Organisationsebene |
| N05–N06, N57–N60 | Ansichten und Abbilder mit eigener Darstellung | ModelView/DrawingDocument referenzieren dieselben Layer- und Element-IDs |
| N18–N19, N29, N53 | gleiche Aktionen aus Maus, Eigenschaften, Text/AI/Voice und Ansichten | stabile Ziel-ID und aktueller Projektkontext; keine zweite Mutation |
| N02, N21–N22, N25, N31 | Export, Geschosse/Höhen, Skalieren, Räume | Layer ändert weder Exportumfang, Höhenbezug noch Bauteil-Capability |

Die vollständige historische N01–N60-Matrix bleibt in
`FUNCTION_REQUIREMENTS_2026-10-03.md` erhalten. Dieser Abgleich aktualisiert den
Ebenenumfang, behauptet keine Neuabnahme aller dortigen historischen Statuswerte.
Andere Wünsche, insbesondere Wandachse, Sprachqualität, PDF/Bildreferenzen und
Auswahlumrandungen für weitere Typen, werden nicht verdrängt.

## Verbindliche technische Grenzen

- Eine Organisationsebene besitzt stabile ID und Namen; mehrere Elemente teilen
  sie. Umbenennen verändert keine Referenz. Layer-IDs nehmen an der vorhandenen
  projektweiten Eindeutigkeitsprüfung teil. Layer und AssemblyLayer bleiben getrennt.
- Der kanonische neue Projektzustand muss für jede Wand, jedes Fenster und jede
  Linie eine gültige layerId haben. Keine zweite Bauteilkopie und kein zweiter
  Modellzustand für verborgene Elemente. Fenster behalten ihren wallId-Host.
- Fachliche Invarianten und Layer-Definitionen gehören nach domain/layers;
  gemeinsame Änderungen nach application/layers. Das bestehende model.ts bleibt
  vorerst der Integrationspunkt. Reine Dateimigration gehört nach
  interop/project-file; kein Domain-Import einer Datei-/UI-Abhängigkeit.
- Die Datei-Ladegrenze unterscheidet alte und aktuelle Version ausdrücklich.
  validateProject validiert den aktuellen Laufzeitzustand; es darf nicht bei jeder
  Bearbeitung stillschweigend alte Dateien migrieren. Bestehende Exportnamen können
  als kompatible Fassade erhalten bleiben, ohne zirkuläre Modulabhängigkeiten.
- Migration validiert die alte Datei vollständig vor der Umwandlung und danach
  den neuen Zustand. Unbekannte Versionen, defekte Hosts, doppelte IDs und ungültige
  Maße bleiben Fehler. Kein stilles Entfernen unbekannter Felder oder Bauteile.
- Migration verändert keine vorhandenen IDs, Meterkoordinaten, Öffnungsparameter
  oder Linienstile. Sie ist deterministisch und mutationsfrei. Laden ersetzt erst
  nach Erfolg den Zustand; eine fehlgeschlagene Migration erhält die offene Arbeit.
- Layer-Zuordnung ist eine atomare validierte Aktion; alle Ziele müssen existieren.
  Ungültige oder veraltete Ziele bewirken weder Teiländerung noch History-Eintrag.
  Erfolgreiche Änderungen verwenden die vorhandene Snapshot-History. AI/Text/Voice
  erhalten denselben Aktionsvertrag und keine eigene Zuordnungslogik.
- Spätere Sichtbarkeit muss dieselbe Berechtigungsentscheidung für Darstellung,
  Picking und Fang liefern. Quellen vor Schnittpunkt-/Dichteauswertung filtern;
  keine teure Gesamtberechnung mit nachträglichem Wegfiltern. Bereits aktive
  Referenzen auf verborgene Quellen dürfen keine verborgenen Führungen liefern.
  Cache-Schlüssel berücksichtigen wirksamen Kontext oder der Filter wird bei jeder
  lokalen Abfrage angewendet; ein reiner Project-Cache genügt nicht für View-Filter.
- Ausblenden ändert kein Modell, keine Öffnungsgeometrie und keinen IFC-Umfang.
  Exportauswahl ist ein eigener ausdrücklicher Vertrag. Löschen belegter Ebenen
  benötigt eine validierte Neuzuordnung; niemals zugehörige Elemente mitlöschen.

## Begrenzter Entwurf für den ersten Implementierungsschritt

Vorgeschlagenes Schema 2 ergänzt `Project.layers` mit `{ id, name }` und `layerId`
an vorhandenen Elementen. Noch keine Sichtbarkeitsfelder und kein Assembly-Schema.
Die zwölf geforderten Standardnamen bleiben exakt erhalten:
Außenwand, Innenwand, Dach, Decke, Fenster, Tür, Möblierung, Geländer, Gelände,
2D-Zeichnungen, Neutrale Ebene, Bemaßung.
Raum und Textelemente ergänzen sie aus N38/N49. Die Bezeichnung 2D-Ergänzungen
aus N39 ersetzt 2D-Zeichnungen nicht; ihre mögliche eigene Kategorie bleibt offen.

Migration und Neuanlage verwenden dieselbe zentrale Standarddefinition. Wände
erhalten Außenwand, Linien/Polylinien 2D-Zeichnungen (Guide). Fenster erhalten als
dokumentierten technischen Startwert Fenster, ohne automatische Host-Vererbung.
Die vorhandene Fenster-Ebene begründet diesen Vorschlag; eine ausdrückliche
Nutzerentscheidung über Vererbung liegt nicht vor. Der erste Schritt verändert
keine Sichtbarkeit und hängt deshalb nicht von deren Entscheidung ab.

IDs dürfen nicht aus frei umbenennbaren Anzeigenamen laufend neu berechnet werden.
Die Migration erzeugt sie aus festen internen Schlüsseln; bei Kollision mit alten
Projekt-/Geschoss-/Element-IDs verwendet sie eine deterministische freie Variante.
Kein Überschreiben alter Identitäten. Nur der Version-1-Loader vergibt fehlende
Zuordnungen; eine Version-2-Datei mit fehlender/falscher layerId wird abgelehnt.
Version 2 wird anschließend geschrieben; ältere Programmstände können sie nicht
lesen. Kein automatisches Überschreiben der ursprünglichen Datei und kein
stiller verlustbehafteter Rückexport als Version 1.

## Offene Produktentscheidungen vor dem Sichtbarkeitsschritt

- Global gemeinsame Sichtbarkeit oder pro ModelView? Wo werden erste Einstellungen
  gespeichert, solange echte gespeicherte ModelViews noch fehlen? Vorschlag:
  einen expliziten View-Kontext vorbereiten; noch kein globales Feld festschreiben.
- Wie erscheinen Fenster bei ausgeblendeter Host-Wand und umgekehrt? Die reale
  Öffnung darf durch einen Darstellungsfilter nicht aus der Wand verschwinden.
- Was geschieht mit aktueller Auswahl und laufender Bearbeitung beim Ausblenden
  ihrer Ebene? Vorschlag: Bearbeitung kontrolliert abbrechen, niemals unsichtbar
  weiterbestätigen; Entscheidung und Tests vor der UI-Einführung festhalten.
- Eigene Kategorie 2D-Ergänzungen oder Alias/Zuordnung zu 2D-Zeichnungen?
- Lösch-/Schutzregeln für Standardebenen und Verhalten gleichnamiger Ebenen vor
  Einführung von Erstellen/Umbenennen/Löschen konkretisieren.

Diese Fragen blockieren den reinen Migrations-/Zuordnungsschritt nicht. Keine
Antwort gilt durch diesen Entwurf als Nutzerfreigabe.

## Genau ein Folgeauftrag: Ebenendaten und Version-1-Migration

Schema 2 mit zentralen Standardebenen und layerId für vorhandene Wände, Fenster
und Linien implementieren; gültige Version-1-Dateien an der Ladegrenze migrieren.
Eine gemeinsame Aktion zur Zuordnung vorhandener Element-IDs zu einer existierenden
Layer-ID ergänzen, mit Projekt-/Zielkontext für spätere UI-, Text- und Voice-Adapter.
Bestehende Erzeugungsaktionen zentral mit Standardzuordnungen versorgen, keine
Ebenenregeln in einzelne Werkzeuge kopieren. Keine neue Ebenen-UI, Sichtbarkeit,
Layer-Löschfunktion, Bauteile oder vollständige Ansichtsverwaltung in diesem Auftrag.

Abnahme: alte Dateien mit/ohne Linien; kollidierende neue Standard-IDs; fehlerhafte
alte und neue Dateien; unbekannte Version; wiederholtes Laden mit identischem
Ergebnis; unveränderte Geometrie/IFC und Host-Beziehungen; Zuordnung von Wand,
Fenster und Linie; atomare Ablehnung gemischter gültiger/ungültiger Ziele; stale
context; No-op ohne History; Undo/Redo und Schema-2-Dateirundlauf. Vorhandene 327
Tests erhalten/anpassen, Build/TypeScript/Lint ausführen. Praktisch anschließend:
altes Projekt öffnen, Maße/Positionen vergleichen, neu speichern und wieder öffnen.
Die native Dateidialog-Abnahme aus PR #83 bleibt bis zu einem echten Bediennachweis offen.
