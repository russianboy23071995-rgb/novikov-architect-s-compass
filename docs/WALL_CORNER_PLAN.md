# Erster Wand-Eckanschluss: Arbeitsentwurf

Stand: 05.10.2026. Codebasis: Integrationszweig `fix/reference-selection-lifecycle`,
Commit `e65105a` nach Merge von PR #106. Dieser Auftrag plant; er implementiert
keine Anschlussgeometrie und entscheidet keine offenen Nutzerfragen.

## Nachgewiesener Stand

| Bereich | Vorhandener Pfad | Bedeutung fuer Anschluesse |
| --- | --- | --- |
| Parameter und Validierung | `src/domain/project/schema.ts` | Wand hat Achsanfang/-ende, Staerke, Hoehe und Ebene; keine Anschlussrelation, kein Achsversatz. Schema 4. |
| Aenderungen | `src/lib/bim/model.ts`, `src/application/direct-edit/transforms.ts` | Validierte immutable Snapshots. Ganzelementbewegung erhaelt relative Fensterpositionen. Einzelne Wand wird geaendert; Nachbarwand folgt nicht automatisch. |
| Grundriss | `src/components/cad/BimPlan.tsx`, `src/rendering/viewport/layer-display.ts` | Rotiertes Rechteck pro Wand, getrennte Fensterdarstellung. Keine gemeinsame Anschlusskontur. |
| 3D | `src/lib/bim/geometry.ts` | `buildSolid` erzeugt je Wand belegte Zellen um Oeffnungen. Keine wanduebergreifende Vereinigung; ueberlappende Wandvolumen werden mehrfach summiert. |
| IFC | `src/lib/bim/ifc.ts` | Eigenes rechteckiges Extrusionsprofil je Wand, separate Oeffnung/Voids. Eine reine 3D-Korrektur wuerde IFC nicht mitkorrigieren. |
| Fang und Griffe | `src/application/snapping/project-references.ts`, `src/rendering/viewport/wall-foot-sources.ts` | Achsenden/Mitte und um halbe Staerke versetzte Ecken; reale 3D-Fusskanten aus Flächen. Nach Anschlussaenderung gemeinsam aktualisieren. |
| History/Datei | `src/lib/bim/history.ts`, `src/interop/project-file/load.ts` | Validierte Snapshots, Migration. Dauerhafte Anschlussdaten benoetigen eine ausdrueckliche Schemaentscheidung. |

Fenster passen heute in die Achslaenge und Wandhoehe. Ueberlappende Fenster werden
im 3D-Volumen als Vereinigung ausgeschnitten; fachliches Verbot von Ueberlappung,
Randabstaende und Anschlusszonen sind noch nicht allgemein geregelt. Dies nicht
mit bereits implementierter Oeffnungsvalidierung verwechseln.

## Verbindliche vorhandene Grenzen

- Eine Wand bleibt ein Bauteil mit stabiler ID. Eine berechnete Anschlusskontur ist
  eine Ableitung, keine zweite bearbeitbare Wand.
- Geometrische Hilfsfunktionen kennen keine BIM-/React-/IFC-Typen. Fachliche
  Anschlussregeln gehoeren in Domain; Aenderung/Validierung/History in Application.
  Renderer und IFC lesen dieselbe fachlich abgeleitete Geometrie.
- Sichtbarkeit veraendert keine physische Anschlussgeometrie: erst vollstaendig
  ableiten, danach filtern. Versteckte Nachbarn bleiben physisch vorhanden.
- Modell-Metertoleranz und Bildschirm-Fangradius sind getrennt. Die bestehende
  `pointsCompatible`-Funktion ist numerische Kompatibilitaet, keine Anweisung,
  benachbarte Wandenden automatisch zu verbinden oder zu verschieben.
- Maus, Eigenschaften und spaetere Text-/Voice-/AI-Adapter verwenden dieselben
  validierten Aktionen mit stabilen Ziel-IDs und Snapshot-Pruefung.
- N45 bleibt erhalten: ausgewaehlte Wandachse zuerst sichtbar machen, spaeter
  verschiebbar. Entscheidung 05.10.2026: Beim Versatz bleibt die Zeichenachse fest, der Wandkoerper bewegt sich relativ dazu; Implementierung steht aus.

## Vorschlag fuer den ersten Anschlussversuch – noch keine Produktentscheidung

Kleinstes Beispiel: genau zwei gerade, rechtwinklige Waende mit identischem
Achs-Endpunkt, gleicher Staerke und Hoehe auf z=0, ohne Oeffnung im Anschlussbereich.
Eine gemeinsame Gehrungsgrenze teilt den Eckbereich auf beide Wand-IDs auf.
Beispielachsen A (0,0)–(3,0), B (3,0)–(3,3), Staerke 0.36 m: moegliche gemeinsame
Grenze von (2.82,0.18) bis (3.18,-0.18). Dies ist ein geometrischer Entwurf,
keine Freigabe einer automatischen Verbindung bei bloss gleichem Endpunkt.

Vorgeschlagener Datenfluss: Domain leitet aus Parametern und einer noch
festzulegenden Anschlussregel gepruefte Konturen/Endbegrenzungen pro Wand-ID ab.
Eine generische Geometriefunktion berechnet Schnitte; Grundriss, Volumenkoerper,
Mengen, Fangquellen und IFC konsumieren dieselben Begrenzungen. Ob dies spaeter
als Kontur oder Endebene repraesentiert wird, ist eine technische Folgeentscheidung.
Keine Klassen, Caches oder Interfaces auf Vorrat einfuehren.

IFC benoetigt fuer eine Gehrung ein geeignetes nichtrechteckiges Profil oder eine
andere normkonforme Repraesentation. Das konkrete Format erst bei Implementierung
an Primaerquellen pruefen und mit dem bestehenden Archicad-Import abnehmen.
Die aktuelle Rechteck-Exportfunktion nicht als ausreichenden Nachweis ansehen.

Vorlaeufig vom ersten Versuch ausschliessen: T-/Mehrfachknoten, spitze Winkel,
verschiedene Staerken/Hoehen, Schichtaufbau, versetzte Achsen und Oeffnungen in der
veraenderten Endzone. Solche Faelle muessen erkennbar unbehandelt bleiben; keine
heimliche Reparatur oder Loeschung. Keine neuen pauschalen Randabstaende erfinden.

## Vor Anschlussimplementierung offene Entscheidungen

| Frage | Noch festzulegen |
| --- | --- |
| Achsenwechsel N45 | Entschieden 05.10.2026: Zeichenachse bleibt fest, Wandkoerper wird quer dazu versetzt. |
| Anschlussabsicht | Automatisch bei gemeinsamem Ende oder ausdruecklich erzeugte Verbindung? Abgeleitete Nachbarschaft oder gespeicherte Relation? |
| Verbundene Bearbeitung | Folgt der Nachbar beim Bewegen einer Ecke, loest sich der Anschluss oder wird die Aktion begrenzt? Keine implizite Verknuepfung. |
| Unterschiedliche Staerken | Gehrung, durchlaufende Wand oder andere fachliche Prioritaet; Ebenen sind keine AssemblyLayer. |
| Wandgriff bei Drehung | Bisher wird die Achse um das Griffdelta geaendert; die danach neu berechnete Aussenkante muss nicht exakt am Ziel liegen. Vor Anschlussbearbeitung klären. |
| Oeffnungs-Endzone | Welche Oeffnungen sind dort zulaessig, wie wird eine kollidierende Aenderung behandelt? |

## Geplante Anschluss-Abnahmekriterien

Bei spaeterer Umsetzung: obiges 3.00/0.36/2.80-m-Beispiel sowie vertauschte
Wandreihenfolge und umgekehrte Achsrichtungen liefern dieselbe physische Kontur;
keine Luecke, keine doppelt belegte Eckflaeche. Gemeinsame Konturgrenzen stimmen in
2D/3D/IFC ueberein. Laengen-/Staerkenaenderung, Undo/Redo, Speichern/Laden,
Sichtbarkeitsfilter und veralteter Zielkontext werden geprueft. Fenster ausserhalb
der Anschlusszone behalten ID und relative Position. Degenerierte/mehrdeutige
Faelle werden nachvollziehbar gemeldet. IFC-Abnahme erfordert neuen Importtest;
der bisher erfolgreiche Rechteckimport belegt keine Gehrung.

## Historischer Folgeauftrag – mit PR #108 umgesetzt

**Zentrierte Wandachse bei Auswahl im 2D-Grundriss sichtbar machen.**

Vorhandene `start`/`end`-Parameter als dezente gestrichelte, bildschirmbezogen
breite Achslinie darstellen. Kein eigenes Modellobjekt und kein neuer Fangpunkt;
vorhandene Achsquellen bleiben massgeblich. Overlay ist pointer-transparent,
folgt gueltiger Vorschaugeometrie, Auswahl und Ebenensichtbarkeit und verdeckt
keine Eckgriffe. Keine Achsverschiebung, neue Menueaktion oder Anschlussgeometrie.

Pruefung: horizontale/schraege Wand, Auswahlwechsel, Zoom, Ausblenden, Vorschau,
Abbruch und Undo; Achse liegt sichtbar mittig. Modell/JSON/IFC bleiben unveraendert.
3D-Achsdarstellung bleibt Teil von N45 fuer einen spaeteren abgegrenzten Schritt.
Dieser Einstieg erfuellt eine explizite Nutzeranforderung und macht die Bezugsgeometrie
sichtbar, ohne die offenen Anschlussentscheidungen vorwegzunehmen.


Aktiver Folgeauftrag nach Nutzerentscheidung: numerischen Wandkoerperversatz als gemeinsame validierte Aktion durchgaengig fuer Modell, 2D, 3D, Fang, History/Datei und IFC implementieren. Details am Anfang von DEVELOPMENT_PLAN.md. Die uebrigen Anschlussfragen bleiben offen.
