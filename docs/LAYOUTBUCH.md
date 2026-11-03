# Layoutbuch: Abbilder nur lesend, Aktualisierung auf Abruf (03.11.2026)

Teil B der Änderungskarte „Schnittzeichnungen und Layoutbuch“ (Korrektur 1 aus docs/performance/GESAMTNACHWEIS_2026-11.md). Teil A ist docs/performance/SECTION_PARTS.md.

## Nutzervorgabe

Aus einer abgezweigten Sitzung weitergeleitet, Wortlaut sinngemäß. Freigabe der Karte am 03.11.2026.

1. **Nur lesend für Abbilder:**
   - Eingefügte Abbildungen dürfen im Layoutbuch weder geändert werden noch änderbar sein.
   - Das Layoutbuch erkennt heute übereinanderliegende Elemente bzw. Schichten der Zeichnungen und öffnet dafür das On-Demand-Menü. Das soll es nicht mehr tun.
   - Erlaubt bleiben: Zeichnungen platzieren, bewegen, Maske anpassen und eigene Zeichenelemente als Ebene darüber, etwa um Fehler zu kaschieren.
2. **Aktualisierung auf Abruf:**
   - Platzierte Zeichnungen müssen nicht bei jeder Änderung an Modell oder Abbild neu gerechnet werden.
   - Ändert sich etwas, das in einem Plan platziert ist, erscheint im Navigator rechts neben dem Plan ein gelbes Aktualisierungssymbol. Erst ein Klick darauf aktualisiert den Plan.
   - Den Kompromiss, dass Pläne erst auf Wunsch aktuell sind, trägt der Nutzer ausdrücklich.

## Verhalten

- **Eingefrorene Zeichnungen:**
  - Ein Layout zeigt seine platzierten Zeichnungen auf dem Stand, an dem es zuletzt geöffnet oder aktualisiert wurde. Das gilt auch für die Zeichnungen seines Masterlayouts.
  - Lage und Maske gehören zum Layout und folgen sofort. Nur der Inhalt wartet: Modell, Abbild, Maßstab, Rahmen.
- **Gelbes Symbol:** Ändert sich etwas, das eine platzierte Zeichnung zeigt, erscheint im Navigator unter „Layouts“ rechts neben dem Plan ein gelbes Symbol (↻, Tooltip „Modell oder Abbild geändert – Klick aktualisiert die Zeichnungen dieses Plans“). Ein Klick darauf zeichnet die Zeichnungen dieses Plans neu und meldet „Plan aktualisiert.“
- **Was als Änderung gilt:**
  - Bei einem Grundriss: sein Geschoss, sein Abbild und die projektweiten Modellwerte wie Ebenen, Muster, Materialien, Aufbauten und Bilder.
  - Bei einem Schnitt bzw. einer Ansicht: der Schnitt, sein Abbild, die Geschossteile des Gebäudes und die Geschosse.
  - Keine Änderung sind Layouts, Planköpfe, andere Abbilder, die Projektinformation, das Arbeitsgeschoss und die Ebenenansicht.
- **Noch nie geöffnete Pläne** tragen kein Symbol. Sie zeigen beim ersten Öffnen ohnehin den aktuellen Stand.
- **PDF:** Ein veralteter Plan wird vor dem Export automatisch aktualisiert. Auf Papier steht immer der aktuelle Stand, die Meldung lautet dann „Plan aktualisiert · PDF …“.
- **Speicher:** Der eingefrorene Stand liegt nur im Arbeitsspeicher. Nach dem Öffnen eines Projekts ist jeder Plan aktuell; in der Datei wird nichts zusätzlich gespeichert.
- **Nur lesend:**
  - Eingefügte Zeichnungen nehmen nicht mehr am Durchschalten überlagerter Elemente teil (docs/TAB_AUSWAHL.md). Ein Klick wählt die oberste Zeichnung; es erscheinen weder Hinweis noch Liste für die Ebenen darunter oder darin.
  - Das Menü einer eingefügten Zeichnung enthält nur noch Element frei bewegen, Element auf X-/Y-Achse, Werkzeugeigenschaften und Löschen. „Referenzen auswählen“ und „Element entlang Achse“ entfallen.
  - Der Inhalt einer Zeichnung war schon vorher nicht anklickbar.
  - Eigene Linien, Texte und Schraffuren auf dem Layout bleiben wie bisher bearbeitbar.

## Umsetzung

- `rendering/viewport/placed-freshness.ts`: `placedDrawingKey(project, documentId)` ist eine Liste von Objektidentitäten dessen, was eine platzierte Zeichnung zeigt; `sameDrawingKey` vergleicht zwei solche Listen. Für Schnitte nutzt sie `sectionDrawingInputs` aus `section-drawing.ts`, dieselben Eingaben wie die gemerkte Schnittzeichnung.
- `components/cad/CadWorkspace.tsx`:
  - Je Layout und platzierter Zeichnung sind Inhalt und Schlüssel gemerkt (`frozenDrawings`).
  - `staleLayouts` vergleicht die gemerkten mit den aktuellen Schlüsseln, `refreshLayout` verwirft den gemerkten Stand eines Plans.
  - Der PDF-Export aktualisiert vorher.
  - Beim Wechsel des Projekts wird alles geleert.
- `LayoutNavigator.tsx` und `ProjectNavigator.tsx`: das gelbe Symbol (`staleLayouts` als Text, damit der gemerkte Navigator stabil bleibt) und `onRefreshLayout`.
- `BimPlan.tsx`: Das Durchschalten bekommt keine platzierten Zeichnungen. `DemandMenu.tsx`: keine Referenzen und kein „entlang Achse“ für Zeichnungen.

## Grenzen

- **Auslegung der Vorgabe:** Was genau mit „übereinanderliegende Elemente bzw. Schichten“ gemeint war, ist meine Deutung. Ich habe es als Hinweis und Liste des Durchschaltens überlagerter Elemente sowie als Menüeinträge gelesen, die in die Zeichnung hineingreifen. Stimmt die Deutung nicht, ist eine Nachbesserung nötig.
- **Nicht im Layoutbuch:** Das Schnittfenster und der Schnitt-Tab zeigen weiter den aktuellen Stand, sie liegen nicht im Layoutbuch.
- **Plan aus mehreren Geschossen:** Ein Grundriss gilt als veraltet, wenn sich sein eigenes Geschoss ändert. Würde ein Grundriss künftig Inhalte anderer Geschosse zeigen, müssten diese in den Schlüssel.
- **Ohne eigenen Snapshot** behält ein Projekt seine Identitäten nicht und gälte nach jeder Änderung als veraltet. Die Oberfläche arbeitet immer mit eigenen Snapshots.

## Nachweis

- **Tests:**
  - `benchmarks/placed-freshness.test.ts` an einem Gesamtmodell: Projektinformation und Geschosswechsel ändern nichts. Eine Wand im 2. OG macht dessen Grundriss und den Schnitt veraltet, den Grundriss des EG nicht. Ein neuer Abbildmaßstab macht dieses Abbild veraltet.
  - 1539 Tests grün, Typprüfung, Lint und Architekturprüfung sauber, 14-Modell-Hash `e42aa36e…` unverändert.
- **Browser** (Entwicklungsserver, Gesamtmodell 3 000, Plan 1 mit den Grundrissen von EG und 1. OG):
  - Plan 1 öffnen: kein Symbol.
  - Im EG Wand `s0-b0` auf 3 m: nur Plan 1 bekommt das gelbe Symbol.
  - Klick aktualisiert: Die Wand in der Zeichnung reicht bis x = 3, das Symbol verschwindet.
  - Strg+Z: Die Zeichnung bleibt bei 3 m, das Symbol erscheint wieder. Ein Klick zeigt 4 m.
  - Wo sich die beiden Zeichnungen überlappen: kein Hinweis auf überlagerte Elemente. Der Klick wählt die obere Zeichnung, das Menü bietet Bewegen, X, Y, Werkzeugeigenschaften und Löschen.
  - Strg+Y, dann „PDF exportieren“: Der Plan wird vorher aktualisiert (Wand 3 m, Symbol weg). Die PDF „Plan 1.pdf“ wurde erzeugt und im Speicher abgefangen, nicht gespeichert.
  - Keine Konsolenfehler.

## Fang auf eingefügte Zeichnungen (03.11.2026)

Nutzerwunsch (03.11.2026): Die eingefügte Zeichnung bleibt unveränderlich, aber der Fang soll auf ihren Inhalt greifen. So lassen sich etwa an den Ecken einer Wand oder Decke eigene Elemente ansetzen, zum Beispiel eine halbtransparente Schraffur, die einen Schönheitsfehler kaschiert. Freigabe der Karte am 03.11.2026.

### Verhalten

- **Grundriss-Zeichnungen:** Gefangen werden alle Punkte des dargestellten Geschosses, wie im Modell: Wandecken, -achsen und -mitten, Ecken und Kantenmitten von Decken, Räumen, Dächern, Stützen, Durchbrüchen, Schraffuren, Linien und Fenstern bzw. Türen sowie die Schnittpunkte. Elemente auf Ebenen, die das Abbild ausblendet, fangen nicht.
- **Schnitt- und Ansichtszeichnungen:** Gefangen werden die Ecken und Kantenmitten der geschnittenen Flächen, die offenen Schnittstücke und die sichtbaren Kanten dahinter.
- **Lage auf dem Blatt:** Jeder Punkt wird mit Lage, Maßstab und Mitte der Zeichnung auf das Blatt umgerechnet. Er fängt nur innerhalb der Maske; Kanten fangen nur, wenn sie ganz in der Maske liegen.
- **Gezeigter Stand:** Gefangen wird der gezeigte Stand. Wartet ein Plan auf seine Aktualisierung (gelbes Symbol), fängt der Fang den alten, angezeigten Inhalt.
- **Nur lesend:** Die Zeichnung bleibt unverändert; es gibt keine Auswahl und keine Griffe in ihrem Inhalt.

### Umsetzung

- `application/snapping/placed-sources.ts`: `placedDrawingSnap` baut aus den platzierten Zeichnungen eine zusätzliche Fangquelle. Sie ist gleich aufgebaut wie die der Transparenzpause (`{ sources, ids }`), die Kennungen lauten `<Zeichnung>/<Element>`.
  - Bei Grundrissen dienen die Fangteile des Quellgeschosses (`projectSnapParts`) als Grundlage.
  - Bei Schnitten sind es die Umrisse und Kanten der gezeigten Zeichnung, über `ringSnapPart` und `pathSnapPart` in `project-references.ts`.
  - Die Fangteile werden je gezeigtem Inhalt und je Satz ausgeblendeter Ebenen gemerkt.
- `CadWorkspace.tsx` baut die Quelle aus den gezeigten Zeichnungen und baut sie nur neu, wenn sich Lage, Maske, Maßstab oder der gezeigte Inhalt ändern. `BimPlan.tsx` hängt sie an den Fang wie die Transparenzpause.

### Nachweis

- **Tests** in `src/application/snapping/placed-sources.test.ts`:
  - Eine Wandecke fängt an der umgerechneten Stelle auf dem Blatt (1:100).
  - Punkte außerhalb der Maske fangen nicht, eine größere Maske zeigt die Linie.
  - Eine ausgeblendete Ebene nimmt die Linie wieder heraus. Dieser Fall deckte einen Fehler im Zwischenspeicher auf, der behoben ist.
  - Bei einem Schnitt fangen Umriss und Kante.
- **Prüfungen:** 1541 Tests grün, Typprüfung, Lint, Architekturprüfung; 14-Modell-Hash unverändert.
- **Browser** (Gesamtmodell 3 000, Plan 1 mit dem Grundriss des EG im Maßstab 1:500):
  - Schraffur als Polygon: Klicks jeweils 2 px neben zwei Ecken der Wand `s0-b5` in der Zeichnung, dazu ein freier Punkt.
  - Der Fang zeigte „Endpunkt“. Die Ecken der Schraffur liegen genau auf den Wandecken (Abstand 0,0000 px).
  - Keine Konsolenfehler.
