# Erster Wand-Eckanschluss: Arbeitsentwurf

## Aktueller verbindlicher Stand — 05.10.2026

Die folgenden historischen Abschnitte sind durch automatische rechtwinklige
Anschluesse (Schema 6) ergaenzt/ersetzt: gleiche Achsenden beim Erstellen oder
Bewegen verbinden ohne Menuebestaetigung. Nutzer hat Oeffnungsberuehrung am
Anschluss abgelehnt und gerade Enden beim automatischen Loesen bestaetigt.
Regulaere 2D/3D-/IFC-Ausgabe, History und Dateimigration sind integriert.
Details/Grenzen: [Automatische Wandanschluesse](AUTOMATIC_WALL_CONNECTIONS.md).
Naechster Schritt ist Wandkettenzeichnen; Undo soll laut Nutzerentscheidung die
gesamte Kette zuruecknehmen. Die alte explizite Menuepflicht gilt nicht mehr.

Stand: 05.10.2026. Codebasis: Integrationszweig `fix/reference-selection-lifecycle`,
Commit `39b5b81` nach Merge von PR #111. Dieser Auftrag aktualisiert die Planung;
Anschlussgeometrie ist weiterhin nicht implementiert. Die unten datierten
Nutzerentscheidungen sind verbindlich; technische Vorschlaege bleiben getrennt.

## Nachgewiesener Stand

| Bereich | Vorhandener Pfad | Bedeutung fuer Anschluesse |
| --- | --- | --- |
| Parameter und Validierung | `src/domain/project/schema.ts` | Wand hat Achsanfang/-ende, Staerke, Hoehe, Ebene und bodyOffset. Schema 5; keine Anschlussrelation. |
| Aenderungen | `src/lib/bim/model.ts`, `src/application/direct-edit/transforms.ts` | Validierte immutable Snapshots. Ganzelementbewegung erhaelt relative Fensterpositionen. Einzelne Wand wird geaendert; Nachbarwand folgt nicht automatisch. |
| Grundriss | `src/components/cad/BimPlan.tsx`, `src/rendering/viewport/layer-display.ts` | Rotiertes Rechteck pro Wand, getrennte Fensterdarstellung. Keine gemeinsame Anschlusskontur. |
| 3D | `src/lib/bim/geometry.ts` | `buildSolid` erzeugt je Wand belegte Zellen um Oeffnungen. Keine wanduebergreifende Vereinigung; ueberlappende Wandvolumen werden mehrfach summiert. |
| IFC | `src/lib/bim/ifc.ts` | Eigenes rechteckiges Extrusionsprofil je Wand, separate Oeffnung/Voids. Eine reine 3D-Korrektur wuerde IFC nicht mitkorrigieren. |
| Fang und Griffe | `src/application/snapping/project-references.ts`, `src/rendering/viewport/wall-foot-sources.ts` | Achsenden/Mitte bleiben fest; Koerperecken aus domain/elements/wall/body.ts enthalten bodyOffset +/- halbe Staerke; reale 3D-Fusskanten aus Flaechen. Nach Anschlussaenderung gemeinsam aktualisieren. |
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
  verschiebbar. Entscheidung 05.10.2026: Beim Versatz bleibt die Zeichenachse fest, der Wandkoerper bewegt sich relativ dazu; Numerischer Versatz inzwischen implementiert (Schema 5).

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
verschiedene Staerken/Hoehen, Schichtaufbau, nicht gemeinsame Achsenden und Oeffnungen in der
veraenderten Endzone. Solche Faelle muessen erkennbar unbehandelt bleiben; keine
heimliche Reparatur oder Loeschung. Keine neuen pauschalen Randabstaende erfinden.

## Vor Anschlussimplementierung offene Entscheidungen

| Frage | Noch festzulegen |
| --- | --- |
| Achsenwechsel N45 | Entschieden 05.10.2026: Zeichenachse bleibt fest, Wandkoerper wird quer dazu versetzt. |
| Anschlussabsicht | Entschieden 05.10.2026: bewusst mit „Ecke verbinden“. Gespeicherte Relation ist technischer Vorschlag, noch nicht implementiert. |
| Verbundene Bearbeitung | Entschieden 05.10.2026: Einzelwandbewegung loest Verbindung automatisch. Verhalten einer explizit gemeinsam bearbeiteten Ecke bleibt separat festzulegen. |
| Unterschiedliche Staerken | Gehrung, durchlaufende Wand oder andere fachliche Prioritaet; Ebenen sind keine AssemblyLayer. |
| Wandgriff bei Drehung | Fuer unabhaengige Waende korrigiert: endpointAtOffsetTarget trifft die Koerperecke auch mit bodyOffset (PR #110, Regressionstest). Ein kuenftiger Gehrungsgriff ist noch kein vorhandener Einzelwandgriff. |
| Oeffnungs-Endzone | Welche Oeffnungen sind dort zulaessig, wie wird eine kollidierende Aenderung behandelt? |

## Geplante Anschluss-Abnahmekriterien

Bei spaeterer Umsetzung: obiges 3.00/0.36/2.80-m-Beispiel sowie vertauschte
Wandreihenfolge liefern dieselbe physische Kontur. Bei umgekehrter Achsrichtung
muss auch das Offsetvorzeichen wechseln, um dieselbe physische Wand zu vergleichen;
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
3D-Achsdarstellung ist inzwischen umgesetzt (N45).
Dieser Einstieg erfuellt eine explizite Nutzeranforderung und macht die Bezugsgeometrie
sichtbar, ohne die offenen Anschlussentscheidungen vorwegzunehmen.


Numerischer Wandkoerperversatz ist durchgaengig implementiert; Anschlussfragen bleiben offen. Der einzige aktive Folgeauftrag steht am Anfang von DEVELOPMENT_PLAN.md (Anschlussentwurf gegen Koerperversatz pruefen).

## Abgleich mit Koerperversatz und Nutzerentscheidungen — 05.10.2026

### Verbindliche Bedienentscheidungen

1. Eine Verbindung wird bewusst ueber **Ecke verbinden** erzeugt. Gleiche Endpunkte,
   Hover, Fang oder reine Naehe erzeugen keine Anschlussrelation.
2. Eine **Einzelwandbewegung loest ihre Verbindung automatisch**. Sie verlangt
   keinen vorgeschalteten Befehl „Verbindung loesen“. Die andere Wand wird dadurch
   nicht automatisch mitbewegt. Der Vorschlag „erst manuell loesen“ ist verworfen.
3. Bestehende Entscheidung N45 bleibt: Offsetaenderung haelt die Zeichenachse fest.

Technische Konsequenz fuer eine spaetere Application-Aktion: Loesen aller
betroffenen Relationen und Verschieben gehoeren in denselben validierten
Vorschau-/Commit-Snapshot und einen Undo-Schritt. Escape/ungueltiges Ziel laesst
Relationen und Geometrie unveraendert; Undo stellt auch die Verbindungen wieder her.
Kein vorzeitiges Loesen beim blossen Beginn der Mausgeste. Stabile Wand-IDs und
Fensterbindungen bleiben bestehen. Text/Voice/AI muessen dieselbe Aktion aufrufen.

Nicht durch diese Antwort entschieden: gemeinsamer Eckgriff, Aendern eines einzelnen
Achs-Endpunkts, Laengen-/Staerken-/Offsetaenderung verbundener Waende, Loeschen sowie
Form der verbleibenden Endkappen beim Loesen. Rechteckige Einzelwandkappen koennen
beim Loesen auch den sichtbaren Abschluss der unbewegten Wand veraendern. Das muss
in der spaeteren Vorschau erkennbar sein, bevor diese Aktion produktiv wird.

### Rechenbeispiel: tatsaechliche Seiten statt gemeinsamer Achspunkt

Alle Masse in Metern, ohne Fenster. A: (0;0) nach (3;0), B: (3;0) nach (3;3),
beide 0,36 stark und 2,80 hoch. Der Achsknoten C=(3;0) bleibt immer fest.
a ist bodyOffset von A, b von B, h=0,18. Positive Offsets liegen links der
jeweiligen Zeichenrichtung: A nach oben, B nach links.

Die Seiten von A liegen bei y=a-h und y=a+h, die von B bei x=3-b-h und x=3-b+h.
Der vorgeschlagene Gehrungsabschnitt verbindet:

- innere Ecke I=(3-b-h; a+h), Schnitt der inneren Seiten;
- aeussere Ecke O=(3-b+h; a-h), Schnitt der aeusseren Seiten.

I und O werden aus unendlich verlaengerten Seiten bestimmt, nicht aus den heutigen
endlichen Rechteckkanten. Die benoetigte Verlaengerung/Verkuerzung der Wandkoerper
wird erst durch die ausdrueckliche Verbindung zugelassen. start/end bleiben C bzw.
die entfernten Endpunkte; Achslaenge und Koerperseitenlaengen sind unterschiedlich.

| a | b | I | O | Summe Grundflaechen m² |
| --- | --- | --- | --- | --- |
| -0.18 | -0.18 | (3.00; 0.00) | (3.36; -0.36) | 2.2896 |
| -0.18 | 0.00 | (2.82; 0.00) | (3.18; -0.36) | 2.2248 |
| -0.18 | 0.18 | (2.64; 0.00) | (3.00; -0.36) | 2.1600 |
| 0.00 | -0.18 | (3.00; 0.18) | (3.36; -0.18) | 2.2248 |
| 0.00 | 0.00 | (2.82; 0.18) | (3.18; -0.18) | 2.1600 |
| 0.00 | 0.18 | (2.64; 0.18) | (3.00; -0.18) | 2.0952 |
| 0.18 | -0.18 | (3.00; 0.36) | (3.36; 0.00) | 2.1600 |
| 0.18 | 0.00 | (2.82; 0.36) | (3.18; 0.00) | 2.0952 |
| 0.18 | 0.18 | (2.64; 0.36) | (3.00; 0.00) | 2.0304 |

Vorgeschlagene Konturen (gegen Uhrzeigersinn):
A=[(0;a-h), O, I, (0;a+h)], B=[O, (3-b+h;3), (3-b-h;3), I].
Ihre Innenflaechen liegen auf entgegengesetzten Seiten derselben Naht O–I.
Flaeche A=0,36*(3-b), B=0,36*(3-a); Volumen ohne Fenster=Summe*2,80.
Die Mengen sind Sollwerte fuer diese kuenftigen Konturen, keine Messung der
aktuellen ungejointen Rechteckkoerper. Eine reine Vereinigung der bisherigen
Rechtecke reicht nicht: Je nach Offset muss die Ecke Material ergaenzen.

### Begrenzung und Datenfluss des naechsten Geometrieschritts (Vorschlag)

- Genau zwei Waende, gleiche Staerke/Hoehe, gemeinsamer Achs-Endpunkt, 90 Grad.
  Fuer den ersten Schritt |bodyOffset| <= halbe Staerke; Null und gemischte
  Vorzeichen explizit testen. Andere Offsets bleiben im bestehenden Modell erlaubt,
  sind lediglich noch nicht fuer diesen vorgeschlagenen Anschluss unterstuetzt.
- Endpunktindizes stabil adressieren, nicht die Array-Reihenfolge als Identitaet
  verwenden. In lokale einlaufende/auslaufende Richtungen normalisieren; beim
  Richtungswechsel Vorzeichen und linke/rechte Seite korrekt umordnen.
- Domain kennt Wandparameter/Anschlussabsicht und liefert valide Konturen je ID.
  Geometry liefert nur Linien-/Polygonmathematik. Keine Renderer-Sonderkorrektur.
- Technischer Vorschlag: spaeter explizite Relation mit Wand-IDs und Endpunktindizes
  persistieren, statt Verbindung nach jedem Modellwechsel aus Naehe zu erraten.
  Konkretes Schema erst mit der Application-Aktion festlegen; jetzt Schema 5 behalten.
- Zuerst reine Konturableitung ohne Produktiv-Anbindung. Anschliessend muessen
  Grundriss, Solid/Mengen, Picking/Fang, Griffe und IFC gemeinsam angebunden werden,
  bevor „Ecke verbinden“ im UI aktiviert wird. Oeffnungsprofile duerfen nicht
  unveraendert in bereits weggeschnittenes Material reichen.

### Ergaenzte Abnahme und verbleibende Fragen

Geometrienachweis fuer den Folgeauftrag: neun Tabellenfaelle, Rotation/Translation,
vertauschte Wandreihenfolge und richtungsumgekehrte Eingaben mit negiertem Offset.
Einfache positive Konturen, gleiche Naht, disjunkte Innenflaechen, korrekte Mengen,
keine Aenderung von IDs/start/end/Offset. Zu kurze Waende oder degenerierte Konturen
muessen scheitern, nicht geklemmt oder automatisch repariert werden. T-/Mehrfach-
knoten, ungleiche Staerken/Hoehen und Oeffnungen im Anschlussbereich bleiben offen.

Vor UI-Anbindung festzulegen: gemeinsame Eckbearbeitung und Endkappen beim Loesen;
Oeffnungs-Endzonen und zulassige Aenderungen verbundener Waende. Die aktuelle
Fenster-Achslaengenpruefung beweist keinen Abstand zur schraegen Endbegrenzung.

Planungsnachweis am 05.10.2026: Alle neun Rechenbeispiele per Node und vorhandenem
validateSimplePolygon geprueft, Flaechenformeln und entgegengesetzte Seiten der Naht
bestaetigt. Lokales Pruefskript outputs/corner-offset-check.mjs ausserhalb des Repos.
Das ist noch kein Test einer Anschlussimplementierung. Keine Laufzeitdatei geaendert;
409 Tests/TypeScript/Build und Lint 0 Fehler/6 Warnungen bleiben der Nachweis aus
PR #111, nicht erneut ausgefuehrte Pruefungen dieses Dokumentationsauftrags.

## Umsetzung des reinen Geometrieschritts — 05.10.2026

deriveRightAngleCorner in src/domain/elements/wall/corner.ts setzt die oben
beschriebene Bruttokonturableitung um. Zwei explizite Wand-/Endpunktreferenzen
liefern nach Wand-ID sortierte Konturen (positive Umlaufrichtung), Flaechen und
eine gemeinsame Naht. Keine Eingabemutation, Verbindungsspeicherung, Oeffnungs-
behandlung oder Anzeige. Gleiche Parameter, rechter Winkel, gueltige Endpunkte,
Offsetgrenze und ausreichend lange Wandseiten werden validiert. Rechenfehler
oder entartete Konturen werden abgewiesen; keine automatische Reparatur.

11 neue Tests bestaetigen neun Tabellenfaelle, Eingabe-Unveraenderlichkeit,
getrennte Innenflaechen, Reihenfolge und 216 Kombinationen aus Offset, Endpunkt-
umkehr, Rotation, Spiegelung und Translation. Gesamt 420 Tests bestanden,
TypeScript/Build erfolgreich, ESLint 0 Fehler/6 bekannte Warnungen. Diese Zahlen
ersetzen nicht die noch fehlende 2D-/3D-/IFC-Abnahme einer produktiven Verbindung.
Der einzige aktive Folgeauftrag steht oben in DEVELOPMENT_PLAN.md: geometrischer
Oeffnungsbefund gegen die abgeleiteten Konturen.

## Geometrischer Oeffnungsbefund implementiert — 05.10.2026

inspectCornerOpenings (corner-openings.ts) klassifiziert volle Fenstergrundflaechen
gegen die Gehrung und weitere Konturbegrenzungen. Ergebnis pro Fenster mit ID,
Footprint und Abstand je Begrenzung: contained/touching/outside. Kein boolescher
Produktentscheid; eine spaetere Application-Aktion muss daraus ihre Zulassung
ableiten. Seitlicher Durchbruch allein zaehlt nicht als Endberuehrung.

Beispiel ohne Versatz: Wand A (0;0) bis (3;0), Staerke 0,36. Fensterbreite 1,20,
Mitte bei 1,50: contained. Mitte bei 2,22: touching, weil eine Ecke x=2,82
erreicht. Mitte bei 2,30: outside, obwohl der Fenstermittelpunkt noch im Wandkoerper
liegt. Bei Fensterbeginn x=0 wird Beruehrung am entfernten Ende separat gemeldet.
Numerische Toleranz ist kein zusaetzlicher fachlicher Mindestabstand.

426 Tests bestanden, TypeScript/Build erfolgreich; ESLint 0 Fehler/6 Warnungen.
Keine gespeicherte Verbindung und keine sichtbare Anschlussfunktion. Offen bzw.
im Nutzerchat angefragt: genaue Beruehrung zulassen; gerade oder erhaltene schraege
Endkappen beim automatischen Loesen. Der naechste geometrische Schritt steht oben
in DEVELOPMENT_PLAN.md.

## Abgeleitete 3D-Eckkoerper — 05.10.2026

corner-solid.ts und geometry/solids/profile-openings.ts extrudieren die geprueften
Konturen mit voll enthaltenen Fensteroeffnungen. Pro Wand stabile ID, Kontur,
polygonale Flaechen mit Normalen und Volumen. Ueberlappende Oeffnungen werden als
Vereinigung abgezogen; keine innenliegenden Zelltrennflaechen. Eigene Wandkoerper
behalten ihre jeweilige geschlossene Stirnflaeche an der gemeinsamen Gehrungsnaht.
Diese beiden Grenzflaechen bedeuten kein doppelt belegtes Volumen.

Nicht enthalten: UI-Aktion, persistente Verbindung, Anwendung auf normale
Darstellung oder IFC. Endberuehrende und ueberstehende Oeffnungen sind noch nicht
unterstuetzt. Kantenkontakte zwischen Oeffnungen, die eine unregulaere Huelle
erzeugen, werden ebenfalls gemeldet; bestehende Modellvalidierung bleibt gleich.
Sehr nahe, numerisch nicht getrennt darstellbare Zellgrenzen werden nicht vereint
oder repariert. 433 Tests bestanden; Mesh-Volumen und geschlossene Kanteninzidenz
unabhaengig geprueft. TypeScript/Build erfolgreich; Lint 0 Fehler/6 Warnungen.
Naechster Auftrag: isolierter IFC-Abnahmenachweis derselben fachlichen Geometrie,
wie oben in DEVELOPMENT_PLAN.md festgelegt.

## Isolierter IFC-Abnahmenachweis — 05.10.2026

Der explizite Testexport in interop/ifc/corner.ts verwendet die lokalen Konturen
von corner-solid.ts und den gemeinsamen IFC-Writer. Zwoelf Testdateien bestanden
IfcOpenShell-Pruefung inklusive Nettovolumen. Noch keine produktive Verbindung;
Archicad-Import dieses Testmodells bleibt separat zu bestaetigen.
Anleitung und Grenzen: [IFC-Eckabnahme](CORNER_IFC_ACCEPTANCE.md).
Der aktuelle einzelne Folgeauftrag steht oben in DEVELOPMENT_PLAN.md.

## Gemeinsame temporaere Vorschau — 05.10.2026

Nachtraegliche Nutzerkorrektur: "Ecke verbinden" als notwendige Menueaktion ist
verworfen. Automatischer Anschluss durch zusammengefuehrte Achsenden ist das
Ziel, gefolgt von fortlaufenden Wandketten. Die folgende Vorschau bleibt ein
Pruefwerkzeug. Umgesetzte Achsenkorrektur und konkreter Folgeauftrag stehen
oben in DEVELOPMENT_PLAN.md. Alte Aussagen zur expliziten Menuepflicht sind
historisch, nicht mehr verbindlich.

Der Nutzer hat den Archicad-Import einschliesslich Fenster und rechtwinkligem
Anschluss bestaetigt. Die explizite Paargeometrie ist jetzt ueber
Werkzeugeigenschaften > Wandanschluss vorschauen in 2D und 3D pruefbar.
Beide Ansichten verwenden die gleichen Domain-Ergebnisse; keine zweite
Gehrungsberechnung. Fenster bleiben ausgeschnitten. Escape/Schliessen verwirft,
falsche Achsenden ergeben eine Meldung, Modellwechsel invalidiert die Vorschau.
449 Tests, TypeScript und Build bestanden; Lint 0 Fehler/6 bekannte Warnungen.
Browserpruefung mit zwei 3-m-Waenden und je einem Fenster bestanden.

Noch keine gespeicherte Verbindung oder Aenderung des normalen IFC-Exports.
Exakte Oeffnungsberuehrung sowie gerade oder erhaltene schraege Endkappen beim
automatischen Loesen bleiben offene Nutzerentscheidungen; erneut angefragt.
Die momentane Ablehnung beruehrender Oeffnungen ist eine technische Grenze.
