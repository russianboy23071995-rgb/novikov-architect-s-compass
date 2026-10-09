# Bauplan: Ansichtsmaßstab im Bearbeitungsmodus und in Ausschnitten

Stand: 09.10.2026. Nutzeranforderung und Architekturvertrag für die spätere
Umsetzung; hier wird **keine** Maßstabsfunktion als bereits implementiert
ausgegeben. Gilt ergänzend zu [ARCHITECTURE.md §29](../../ARCHITECTURE.md)
und dem offenen [V07j-Vertrag für Schraffuren](HATCH_PAPER_SCALE.md) aus PR229.
Bei zeitlicher Überschneidung sind die hier festgehaltenen
**Nutzerentscheidungen** (insbesondere 1:100 und Ort der Bedienung) maßgebend.
Vor Umsetzung den dann aktuellen PR-/Code-Stand erneut lesen.

## 1. Begriffe und Geltungsbereich

| Begriff | Bedeutung und Eigentümer |
| --- | --- |
| **Bearbeitungsmodus / Arbeitsansicht** | Der gegenwärtige Canvas, in dem das gemeinsame BIM-Modell über Geschosse, Grundriss und weitere Arbeitsansichten bearbeitet wird. Er hat einen **Arbeitsmaßstab** für die Darstellung maßstabsabhängiger 2D-Anmerkungen. Beim neuen Projekt ist er **1:100**. Er ist keine Maßangabe für BIM-Geometrie. |
| **Ausschnitt / Abbild** | Eine später gespeicherte, weiterhin modellgebundene Sicht auf z. B. ein Geschoss, einen Schnitt oder eine Ansicht. Nach §29: ModelView beschreibt die Modellableitung; DrawingDocument speichert Ausschnitt, Sichtbarkeit, ergänzende Annotation und **seinen eigenen Ausgabemaßstab**. Kein kopiertes, unabhängig bearbeitbares Gebäude. |
| **Ansichts-/Ausgabemaßstab 1:S** | Expliziter positiver, endlicher Nenner S für die Darstellung im jeweiligen 2D-Kontext. 1:100 im Bearbeitungsmodus ist die Anfangsvorgabe; ein Ausschnitt erhält beim Erstellen seinen frei wählbaren eigenen Wert und kann ihn später ändern. Änderung einer Ansicht ändert keinen anderen Maßstab. |
| **Zoom/Kamera** | Bildschirmnavigation in CSS-Pixeln pro Modellmeter, einschließlich Fit/Pan/Mausrad. Sie ändert nur die Bildschirmvergrößerung. Die vorhandene Zoom-Prozentanzeige und die grafische Meterleiste sind **keine** 1:S-Ausgabe. |
| **Modellmaß / Papiermaß** | Eigenschaft der **Größe/Strichabstände** einer darstellenden Annotationsanwendung, nicht ihres geometrischen Messwerts. Modellmaß speichert Längen in Modellmetern. Papiermaß speichert die gewünschte physische Größe in Papier-mm, unabhängig vom Ausgabemaßstab. |

Ein Maßstab in 1:S ist für maßhaltige 2D-/orthografische Darstellungen
definiert. Eine perspektivische 3D-Kamera hat keinen über das ganze Bild
konstanten Zeichenmaßstab. Für spätere gespeicherte 3D-Perspektiven getrennt
Kamera und Ausgabeart festlegen; die 1:S-Auswahl dort nicht als fachlich
korrekte Papierbemaßung ausgeben. Das verhindert nicht, 3D-Ansichten zu
speichern.

## 2. Verbindliches Verhalten

1. Unten im Canvas **neben dem vorhandenen Zoom** einen eindeutig mit
   `Maßstab` bezeichneten Selektor `1:100` anbieten. Er betrifft den
   gerade fokussierten geeigneten Bearbeitungs- oder Ausschnitt-Viewport.
   Er muss einen frei eingegebenen gültigen Wert `1:S` zulassen.
   Beim neuen Bearbeitungsprojekt ist `1:100` aktiv. Zoom und Meterleiste
   bleiben eigenständige Bedienungen.
2. Im Bearbeitungsmodus wirkt S vorerst auf darstellende 2D-Inhalte
   (Beschriftungstexte, Maß-/Zahlentext, Pfeile und später
   Papier-Schraffuren), **soweit deren Größe auf Papier bezogen ist**.
   Modellmaß-Inhalte behalten ihre Modellgröße. UI-Texte wie Menüs,
   Statuszeile und Koordinatenanzeige werden dadurch nicht verändert.
   Noch nicht implementierte Werkzeuge werden nicht als schon vorhanden
   dargestellt.
3. Jedes künftige Text-, Bemaßungs- und sonstige Werkzeug mit
   größenrelevanten Texten/Zahlen bietet in seinen
   **Werkzeugeigenschaften** die Wahl `Modellmaß` oder `Papiermaß`
   für die jeweilige Größe. Bestehende Elemente brauchen eine
   ausdrückliche Migrations-/Defaultregel, keine heimliche Umdeutung.
   Tool-Defaults und vorhandene Anwendungen folgen derselben
   validierten Application-Grenze. Fachliche Werte wie `3,00 m`,
   Fläche oder Winkel bleiben aus Modellgeometrie berechnet und
   ändern sich beim Umschalten von 1:100 auf 1:50 nicht.
4. Ein Ausschnitt übernimmt bei Erstellung eine **vorgeschlagene**
   Anfangseinstellung aus dem aktuellen Arbeitsmaßstab, aber die
   Person kann **bei der Erstellung** frei `1:S` wählen. Anschließend
   ist sein Wert eigenständig gespeichert. Eine Änderung des
   Bearbeitungsmaßstabs oder eines anderen Ausschnitts darf ihn nicht
   überschreiben. Zwei Ausschnitte desselben Geschosses können z. B.
   1:50 und 1:200 besitzen und bleiben beide an dasselbe BIM-Modell
   gebunden.
5. Weder die Änderung von S noch die Wahl Modellmaß/Papiermaß
   verändert Modellkoordinaten, Wand-/Fenster-/Dachabmessungen,
   Anschlussregeln, Fangpunkte, Messwerte oder IFC-Geometrie.
   Proportionale Skalierung von BIM-/3D-Elementen bleibt verboten.
   2D-Skalierung bzw. Kalibrierung importierter PDF-/PNG-/JPEG-Referenzen
   sind **andere Aktionen** mit eigenen Regeln.
6. Gedruckte Ausgabe nutzt den expliziten effektiven Maßstab der
   Zeichnungsplatzierung. Eine spätere Layout-Platzierung darf nicht
   unbemerkt den Ausschnitt nochmals skalieren. Abweichungen zwischen
   DrawingDocument-S und Layout-S müssen im Ausgabekontext aufgelöst
   oder als expliziter Override sichtbar sein. Noch keine konkrete
   Layout-UI oder Druckzusage aus dieser Planungsdatei ableiten.

## 3. Gemeinsame Größenauflösung

In 2D ist `S` der explizite Nenner, `z` die aktuelle Zahl
CSS-Pixel pro Modellmeter und `p` eine Papiergröße in mm.

- **Papiermaß:** `modelMetres = p * S / 1000`.
- **Modellmaß:** `modelMetres = storedModelMetres`.
- **Bildschirm:** `screenCssPixels = modelMetres * z`.
- **Papierausgabe:** `paperMm = modelMetres * 1000 / S`.

Beispiel: Ein Papiertext mit 2 mm Höhe wird in 1:100 als 0,20 m
Modelläquivalent, in 1:50 als 0,10 m dargestellt; auf beiden
ausgegebenen Plänen bleibt er 2 mm hoch. Ein Text mit Modellhöhe
0,20 m bleibt im Modell gleich hoch und wäre auf Papier 2 mm bei
1:100 bzw. 4 mm bei 1:50. Browser-Zoom verändert die Anzeige
beider Texte in Pixeln, nicht S oder den gespeicherten Größenmodus.

Textanker, Bemaßungsbezüge und Schraffurkonturen verbleiben an
Modellkoordinaten. Textumbruch, Zeilenabstand, Pfeilgröße,
Schraffurzelle und Strichbreite werden jeweils durch einen
gemeinsamen typisierten Resolver für den jeweiligen Inhalt
abgeleitet; bloßes CSS-Transform auf alle DOM-Elemente ist kein
fachlicher Maßstabsvertrag. Ungültige/fehlende S-Werte im
Papiermodus ergeben einen klaren Fehler, keinen Zoom- oder
1:1-Fallback. Technische Grenzen müssen endliche, positive
Zwischenergebnisse sicherstellen.

## 4. Zuständigkeit und Speicherung

- Domain/Ansichtskontext hält eine eindeutige Identität des
  Bearbeitungs-Viewports bzw. später `DrawingDocument.outputScale`.
  Der Arbeitsmaßstab ist eine **Ansichtseinstellung**, kein globales
  Feld im Bauteil und keine Eigenschaft jeder einzelnen Annotation.
  Zukunftsziel: den geänderten Arbeitsmaßstab **pro Projekt** speichern;
  neue und migrierte Projekte ohne Feld starten mit 1:100. Der erste
  isolierte UI-Pilot darf den Wert in der Sitzung halten, solange
  Speicherung/History ausdrücklich als noch offen sichtbar bleibt.
- Application prüft Änderungen an gespeicherten Ansichtseinstellungen
  mit gültiger Kontext-/View-ID und unveränderter Revision;
  Annotationen-/Dokumentaktionen nutzen die bestehende validierte
  Preview-/Commit-/Undo-Grenze. Die Regel, ob ein Wechsel des bloßen
  Arbeitsmaßstabs einen BIM-Undo-Schritt erzeugt, ist **offen**.
  Navigation/Zoom allein erzeugen keinen BIM-Undo-Schritt.
- Rendering erhält den **effektiven ScaleContext** als Eingabe.
  Es leitet CSS-/SVG-/Papiergrößen aus einem einzigen Resolver ab.
  `CadWorkspace`, `StatusBar` und `CadViewport` verbinden
  fokussierten Viewport und Selector, halten aber nicht die
  fachliche Umrechnung oder eine zweite Modellwahrheit.
- Dateiformat: Sobald Arbeitsmaßstab oder Ausschnitt gespeichert
  werden, strikte Versionierung/Migration, Altdatei-Rundlauf und
  referenzielle Validierung. Gespeicherte Ausschnitte teilen das
  BIM-Modell und behalten ihr eigenes S; Änderungen am Hauptcanvas
  schreiben sie nicht um. Bildschirm-Zoom muss nicht aus S
  rekonstruiert werden.
- Bereits geplanter V07j/V07k-Schraffur-Pilot darf denselben
  `ScaleContext` verwenden. Sein Papiermodus ist im heutigen
  Produktionsschema noch nicht freigeschaltet. Die hier gewählte
  Anfangsvorgabe 1:100 und der UI-Ort beantworten zwei zuvor
  offene Produktfragen; bestehende Schraffuren im Modellmaß
  bleiben unverändert.

## 5. Kleine, abhängige Aufträge für Codex

| Schritt | Umfang | Abnahme |
| --- | --- | --- |
| **MS-01 Vertrag und Maßstab-UI** | Aktuellen V07j/V07k-Stand und Browser-Status prüfen. Typisierte positive 1:S-Abfrage/Resolver anbinden; Selector **unten neben Zoom** im fokussierten 2D-Bearbeitungs-Canvas mit initial 1:100. Speicher-/History-Grenze vor dem Persistieren festlegen. | Auswahl und freie Eingabe funktionieren; ungültige Werte verändern nichts; Wechsel 1:100 → 1:50 lässt Zoom %, Meterleiste, Geometrie, Fang, Messung und BIM-Undo unverändert. |
| **MS-02 Papier-/Modellgröße als Pilot** | Ein vorhandenes geeignetes Zeichnungselement bzw. den V07k-Musterpiloten über denselben ScaleContext anbinden; der späteren Text-/Maßketten-Werkzeugeigenschaft einen typisierten Vertrag geben, wenn das Werkzeug implementiert wird. | Das 2-mm-/0,20-m-Beispiel bei 1:50 und 1:100; Zoom und unterschiedliche Browsergrößen liefern die gleichen Modellwerte; bestehende Modellmuster bleiben identisch. Keine leeren Text-/Bemaßungs-Klassen als Vorleistung. |
| **MS-03 gespeicherte Arbeitsansicht** | Per-Projekt-Persistenz des Arbeitsmaßstabs und Undo-Regel begrenzt entscheiden/implementieren; Migration 1:100 für Altprojekte. | Speichern/Öffnen erhält eigene gültige Wahl, alte Datei öffnet 1:100; keine Änderung an Modellgeometrie, History-/Undo-Verhalten dokumentiert. |
| **MS-04 eigenständige Ausschnitte** | Erst beim tatsächlichen ModelView-/DrawingDocument-Schritt: frei wählbares S bei Erstellung, gespeicherte Änderung und unabhängige Darstellung. | Arbeitsansicht 1:100 plus zwei modellgebundene Abbilder 1:50/1:200; Bearbeitungsmaßstab und Zoom beliebig ändern; Abbildwerte, Modell-IDs, eigene Annotationen, Dateirundlauf und Ausgabe-Ableitung bleiben korrekt. |

Die Tabelle ist eine **Folge begrenzter Aufträge**, keine Aufforderung,
MS-01–MS-04 gleichzeitig zu bauen oder den laufenden Auftrag des
DEVELOPMENT_PLAN.md zu verdrängen. Nach jedem Schritt dort Status,
Testnachweis, Grenzen und den nächsten **einen** Auftrag eintragen.
