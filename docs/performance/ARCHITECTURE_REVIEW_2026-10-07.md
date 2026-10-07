# Architekturprüfung: skalierbare Bearbeitungsvorschau

Stand: 07.10.2026. Geprüfte Codebasis: `main` nach PR170 (`4928940`), dazu
PR171 auf `perf/selection-preview-reuse` (`a588f41`). PR171 ist offen.
Dieser Bericht bewertet den bestehenden Bearbeitungsweg gegen AGENTS,
ARCHITECTURE, DEVELOPMENT_GUIDE, den P0/P1/P2-Plan und die erweiterten
Funktions-/AI-Anforderungen. Er ist keine vollständige Prüfung jeder Funktion,
Sicherheitsanalyse oder Freigabe beliebiger Projektgrößen.

## Entscheidung

Die nächste Arbeit soll A-04 strukturell lösen: eine vorbereitete gemeinsame
Application-Aktion liefert eine begrenzte Änderungsvorschau über einem stabilen
Basismodell. Unveränderte Darstellungsdaten werden weiterverwendet. Beim
Übernehmen entsteht weiterhin ein vollständig geprüftes Projekt mit einem
Undo-Schritt. Die vollständige Projektprüfung ist kein geeigneter innerer
Mausbewegungszyklus.

PR170 und PR171 beseitigen belegte Wiederholungen und bleiben nützliche
Zwischenschritte. Ein weiterer Cache für Base64-Schemaprüfungen wird als nächster
Auftrag zurückgestellt: Er würde weder die Kosten ohne Bilder noch den breiten
Neuaufbau der Anzeige lösen. Ein solcher Cache kann später aufgrund einer
isolierten Import-/Commit-Messung sinnvoll sein.

Das ist eine Weiterentwicklung des vorhandenen Schichtenvertrags. Weder ein
zweiter Modellkern noch ein Frameworkwechsel sind dafür erforderlich. Der hier
beschriebene lokale Vorschaupfad ist **noch nicht implementiert**.

## Was die bestehende Architektur bereits richtig macht

- Stabile IDs, Meter, ein maßgeblicher Projektzustand und gemeinsame Domain-Regeln
  verbinden Grundriss, 3D, Eigenschaften, Projektdatei und IFC.
- ToolInteraction, Präzisionseingabe und lokale Fangabfrage sind gemeinsame
  Dienste. Bewegungsursprung, Shift, Tab und Hover müssen nicht neu pro Werkzeug
  implementiert werden. Der lokale Fangindex hängt am bestätigten Projekt;
  er wird im untersuchten Ablauf nicht je Vorschauprojekt neu aufgebaut.
- Application-Aktionen, Kontextprüfungen und History trennen Vorschau von
  Bestätigung. Text/Voice können dieselben Aktionen verwenden.
- Vorbereitete Konturgeometrie und begrenzte, wegwerfbare Ableitungen zeigen
  bereits das passende Muster. Die Oberfläche und die bisherigen Bedienregeln
  können während der Migration bestehen bleiben.

## Belegte Engpässe und Grenzen

| Befund | Nachweis im geprüften Code | Bedeutung |
| --- | --- | --- |
| Gruppenbewegung erzeugt pro neuem Mausziel ein vollständiges Projekt | `application/selection/move.ts`, `previewSelectionMove`: sämtliche Elementlisten durchlaufen, Beziehungen filtern, `validateProject` | Kosten hängen auch an unbeteiligten Elementen und Assets |
| Vollprüfung liefert unabhängige Objekte und prüft Bilddaten erneut | `domain/project/schema.ts`, `validateProject`; `domain/elements/reference/model.ts` | Ein Cache für dieselbe Zielkoordinate reduziert Wiederholungen, aber nicht den Aufwand jedes neuen Ziels |
| Ableitungen hängen zum Teil an der gesamten Projektidentität | `domain/elements/wall/connections.ts`, `connectedWallSolids` | Ein neuer Vorschau-Projektstamm entwertet die Wiederverwendung unveränderter Wandgeometrie |
| Grundriss verarbeitet die vollständige Vorschau | `components/cad/BimPlan.tsx`: `shown`, `connectedWallSolids`, `visiblePlanGeometry`, `wallPlanOutlines`, Elementlisten | Eine lokale Domain-Berechnung allein reicht ohne passende Darstellungsgrenze nicht aus |
| Mauszustand reicht bis in den Workspace; Navigator baut seinen Baum bei Render neu | `useToolInteraction`/`usePrecisionDraft`, `CadWorkspace`, `ProjectNavigator` | Unveränderte UI braucht stabile Daten/Props und eine eigene Rendergrenze; der Navigator filtert zudem Fenster pro Wand |
| Abhängigkeiten sind größer als die Auswahl | Wandanschlüsse, Host-Fenster, Endpunktbelegung | Nur ausgewählte IDs neu zu berechnen wäre fachlich falsch |
| Bestätigung/History enthalten weiterhin mehrere volle Prüf-/Serialisierungspfade | `tools/interaction.ts`, SelectionMove-Adapter, `lib/bim/history.ts` | Separater späterer Commit-Engpass; die Absicherung bleibt zunächst erhalten |
| Kontur/Offset besitzen einen gegenseitigen Runtime-Import | `application/direct-edit/contour.ts` und `offset.ts` | A-05 bleibt echte Wartungsaufgabe; kein belegter Hauptgrund der Mauslatenz |

Die Navigator-Kosten sind ein Codebefund, noch keine isolierte Zeitmessung.
Der Gruppenadapter wird mit Workspace-Renders erneut gebunden; der PR171-Cache
ist absichtlich nur ein Ergebnis pro gebundenem Adapter, kein beständiger
inkrementeller Modellindex. Die Layer-Policy arbeitet auf dem bestätigten Modell;
ihre Prüfung darf ebenfalls nicht pauschal als Arbeit jedes Mausziels gezählt werden.

### Reproduzierbarer Strukturtest

`benchmarks/architecture-audit.ts` verwendet die vorhandene Gruppenaktion ohne
Ersatzimplementierung. Die Fixture enthält drei Wände, ein Fenster, eine
Schraffur, eine Bildreferenz und ergänzende Linien. Der Nachweis liegt in
`architecture-audit-2026-10-07.json`.

| Elemente | Tatsächlich geänderte Element-Datensätze | Neu angelegte Elementobjekte | Davon mit unveränderten Parametern |
| ---: | ---: | ---: | ---: |
| 100 | 1 Wand | 100 | 99 |
| 1.000 | 1 Wand | 1.000 | 999 |
| 5.000 | 1 Wand | 5.000 | 4.999 |

Auch der Asset-Datensatz wird neu angelegt. Der Base64-String ist inhaltlich
identisch; daraus folgt **kein Nachweis physisch duplizierter Bildbytes**.
Das Basismodell bleibt unverändert. Die Diagnose ist eine Bestandsaufnahme der
Objektidentitäten, keine Latenz-/Heapmessung und keine dauerhaft beizubehaltende
Soll-Assertion nach dem Umbau.

Zwei besonders wichtige fachliche Nachweise:

1. Beim Wegbewegen einer verbundenen Wand wird die Beziehung gelöst. Die
   stehenbleibende Nachbarwand behält ihre Parameter, erhält aber eine andere
   Kontur. Sie gehört daher zur Änderungsvorschau.
2. Eine bisher unverbundene dritte Wand kann mit ihrem neuen Achsende einen
   vorhandenen Zwei-Wand-Knoten belegen. Die bisherige Vollprüfung weist dies als
   Mehrfachanschluss ab. Eine reine Suche entlang gespeicherter Beziehungen
   würde diesen Fall übersehen. Auch räumlich betroffene Knoten sind relevant.

### Vorhandene Laufzeitmessung

Die [PR171-Messung](SELECTION_PREVIEW_REUSE.md) enthält je 21 Ziele bei
100/1.000/5.000 gemischten Elementen und einer Bewegung von 20 Wänden.
Bei 5.000 Elementen beträgt der Median bis zur überprüften Frame-Gelegenheit
noch rund **1.027 ms ohne Bild / 1.235 ms mit PNG**; P95 rund **1.052/1.293 ms**.
Schon ohne Bild besteht also ein erheblicher Engpass. Alle sechs gemessenen
Abläufe bestanden Vorschau, Abbruch, Platzierung sowie Undo/Redo.

Das sind Chromium-/Entwicklungsbuild-Messungen mit synthetischen, nacheinander
ausgelösten DOM-Ereignissen auf einer freien Bewegungsbahn. Sie messen weder
kontinuierliche Hardwareeingabe noch garantierte GPU-Ausgabe. Die Phasen sind
verschachtelt: Validierung, Aktion und React-Dauer dürfen nicht addiert oder
ihre getrennten Mediane als exklusive Teilkosten subtrahiert werden. Die finale
Finite-Distance-Ergänzung aus PR171 wurde zusätzlich im 100-PNG-Smoke geprüft;
die gesamte Sechs-Fälle-Messung wurde danach nicht erneut ausgeführt.

Reale große Pläne, dichte Anschlüsse, große ausgewählte Gruppen, ungünstige
Koordinaten, Produktionsbuild, Dauereingabe und Spitzen-/GPU-Speicher bleiben
offene A-01-Nachweise. 5.000 gemischte Elemente sind keine 5.000 Wände.

## Zielpfad und Verantwortlichkeiten

```text
Maus / Maßeingabe / Text / Voice
       -> gemeinsame Aktion + gebundener Zielkontext
       -> Vorbereitung auf bestätigter Modellrevision
       -> Ziel aus gemeinsamem Snap-/Präzisionsdienst
       -> betroffene Änderungen und Geometrie prüfen/ableiten
       -> stabile Basisdarstellung + vorübergehende Änderungen
       -> Bestätigen: aktueller Kontext, volle Prüfung, ein History-Commit
```

**Application** besitzt Sitzung und Lebenszyklus. Vorbereitung bindet
Modellidentität, ausgewählte IDs, Ursprung und Sichtbarkeit. Zeigerbewegung
liefert nur neue Parameter, keine neue Sitzung. Modell-, Auswahl- und relevante
Sichtbarkeitswechsel machen alte Ergebnisse ungültig. Abbruch verwirft alles.

**Domain** bestimmt fachlich betroffene Elemente und prüft dieselben Regeln wie
der Commit. Gemeinsame reine Prüffunktionen werden aus bestehenden Regeln
herausgelöst; es entsteht keine schwächere UI-Nachbildung. Eine vorbereitete
Translation darf unveränderliche Längen/Assetdaten wiederverwenden, muss aber
endliche resultierende Koordinaten und numerischen Geometriekollaps weiter
prüfen. Insbesondere ist Translation bei sehr großen Float-Koordinaten nicht
automatisch geometrisch verlustfrei.

Die Abhängigkeiten umfassen Host-Fenster, innere und gelöste äußere Beziehungen,
die Konturen stehenbleibender Partner und räumliche Endpunktbelegung. Zukünftige
Raumgrenzen und geschossgebundene Höhen benötigen weitere fachliche Regeln;
heute werden dafür keine leeren Bauteiladapter angelegt. Ein solcher
Abhängigkeitsindex ist abgeleitet, keine zweite bearbeitbare Modellstruktur.

Gemeinsam bedeutet dabei nicht, Wand und Linie hätten identische Fachregeln.
Elementadapter liefern nur ihre vorhandenen Transformationen, Abhängigkeiten
und Prüfungen. Sitzung, Zielauflösung, Vorschauergebnis, Invalidierung und
Bestätigung werden einmal implementiert. Ein neuer Bauteiltyp ergänzt seine
Fachregeln, nicht eine weitere Maus-/Formular-/History-Engine.

**Geometry/Constraints** behalten generische Mathematik, numerische Regeln und
Fanglogik. Vorhandene räumliche Infrastruktur wird auf Eignung geprüft; ein
pixelabhängiger Fangradius darf niemals die exakte Anschlussvalidierung ersetzen.
Die für die Aktion erforderlichen Indizes dürfen zunächst einmal je
Modellrevision aufgebaut werden. Kein globaler Paarvergleich pro Mausereignis.
Vorbereitungszeit ist separat zu messen; spätere inkrementelle Indexpflege
erfolgt nur bei belegtem Bedarf.

**Rendering** erhält eine stabile bestätigte Basis und einen kleinen, wegwerfbaren
Vorschau-Datensatz: ersetzte Element-IDs, betroffene Beziehungen und abgeleitete
Konturen/Körper. Originaldarstellungen dieser IDs werden während der Vorschau
ersetzt, damit insbesondere stehende Anschlussnachbarn nicht doppelt erscheinen.
Grundrissfüllung, gemeinsame Außenkontur, Öffnungen, Ebenen und Auswahl müssen
dasselbe Ergebnis verwenden. Navigator und unveränderte Szene werden bei
reiner Zeigerbewegung nicht neu abgeleitet. Memoisierung benötigt stabile Props;
`memo` allein um weiterhin wechselnde Gesamtdaten ist keine Lösung.

**Bestätigung/Interop/History** bleiben eine harte Grenze. Nur die aktuelle
Application-Sitzung darf ihre geprüften Parameter übernehmen; das gerenderte SVG
oder ein altes Preview-Objekt ist keine Commit-Autorität. Dateiladen/Import und
öffentliche Validierung prüfen weiter vollständig und unabhängig. Kein öffentliches
`trusted: true`, kein Vertrauen in IDs oder mutierbare TypeScript-Objekte allein.
Die Vorbereitungsgrenze muss die unveränderliche Eigentümerschaft ihrer geprüften
Basis sicherstellen; ein `readonly`-Typ oder eine behauptete Revision allein
verhindert keine Mutation durch fremde Aufrufer. Die dafür gegebenenfalls nötige
einmalige Prüfung/Kopie gehört zur gemessenen Vorbereitung, nicht zum Pointerpfad.
Zunächst materialisiert die Aktion erst beim Bestätigen ein ganzes Projekt und
nutzt die vorhandene volle Validierung und Snapshot-History. Ein Vorschau-Datensatz
ist kein Auftrag, Undo jetzt auf Event Sourcing oder Delta-History umzubauen.

Ein Auswertungsergebnis benötigt mindestens Modell-/Sitzungsbezug, aufgelöstes
Ziel, betroffene IDs/Beziehungen, geprüfte Geometrie und Fehlerstatus. Konkrete
Typnamen und Dateien werden beim ersten Verbraucher festgelegt. Wird später
asynchron gerechnet, sind zusätzlich Anfragereihenfolge und Verwerfen veralteter
Antworten Pflicht. Ein `requestAnimationFrame`-Takt kann Zeigerereignisse bündeln,
ersetzt aber keine schnelle Berechnung; Klick muss das tatsächliche aktuelle
Ziel übernehmen, auch wenn ein Anzeige-Frame noch aussteht.

## Abgleich mit den Produktzielen

| Ziel | Konsequenz für den Lösungsweg |
| --- | --- |
| Viele Elemente und gemeinsame Werkzeuge | Kosten je Ziel an betroffene Geometrie und lokale Kandidaten koppeln; keine pro Werkzeug kopierte Vorschauengine |
| Wände, Öffnungen, künftige Decken/Räume/Geschosse | Abhängigkeiten fachlich erklären; Grenzen und Höhen nicht als isolierte ausgewählte Punkte behandeln |
| Grundriss, Schnitt, Ansicht, 3D | Gemeinsame geprüfte Aktionsauswertung, unterschiedliche Darstellungsadapter; kein zweites BIM-Modell |
| ModelView, DrawingDocument, Annotation-Scope, Ausschnitt/Layout | Vorschau verändert keine zweite Bauteilkopie; Modellrevision und ansichtseigene Filter/Darstellung getrennt invalidieren |
| Layer/AssemblyLayer, feste/geschossgebundene Höhen | Organisationssichtbarkeit ist keine Materialschicht und keine Geometriebeziehung; Sichtbarkeits- und Modell-Undo bleiben getrennt |
| Präzision und Bedienbarkeit | Sofortiger Bewegungsursprung, Referenzerhalt beim Zoom, 600-ms-Hover, feste Shift-Richtung, Tab und Mausplatzierung bleiben gemeinsame Verträge |
| AI/Text/Voice | Stabile IDs und gebundene Revision; Vorschau/Annahme derselben Aktion, keine AI-eigene Transformation oder Validierung |
| Projektdatei, IFC, spätere Berichte | Exportiert wird der bestätigte Zustand; bewährte Rundläufe und Wand-/Fenstergeometrie bleiben Referenz |
| Windows/macOS und Lovable | Plattformadapter und Darstellung vom Modellkern trennen; keine Runtime-/Dateiformatentscheidung aufgrund dieses Engpasses |

## Alternativen und Reihenfolge

| Ansatz | Bewertung |
| --- | --- |
| Weitere globale Ergebnis-Caches | Können unveränderliche Teilkosten reduzieren, lassen aber die Gesamtabhängigkeit und schwierige Invalidierung bestehen. Nicht die nächste Hauptarbeit. |
| Vorbereitete Aktion + betroffene Vorschau + stabile Darstellung | Empfohlen. Verwendet bestehende Regeln, ToolInteraction und Renderer schrittweise weiter; beseitigt die gemessene Ursache in beiden Schichten. |
| Vollständige Projektprüfung in einen Worker verschieben | Kann später lange, unabhängige Jobs entkoppeln. Jetzt blieben Gesamtarbeit, Übertragung und veraltete Antworten; die Renderingkosten blieben ebenfalls. |
| Neuer Renderer, C++/Rust/WASM, ECS oder vollständiges Store-Rewrite | Aus dieser Messung nicht begründbar. Erst irreduzible Geometrie-/GPU-Kosten nach dem begrenzten Umbau messen. |

Einmalige lineare Vorbereitung ist zunächst vertretbar; wenn nahezu alle Elemente
gewählt oder fachlich abhängig sind, bleibt entsprechend große Arbeit notwendig.
Es wird weder konstante Laufzeit für beliebige Projekte noch eine konkrete FPS-Zahl
versprochen. Datei-/Assetgrenzen (A-06), Importzyklus (A-05) und übrige UI-Entlastung
(A-07) bleiben offen, ebenso die noch fehlenden Produktfunktionen.

## Prüfung dieses Review-Schritts

Die ausführbare Strukturdiagnose besteht in allen drei Größen. Der bestehende
Testsatz besteht mit **633/633 Tests**, TypeScript einschließlich `benchmarks/`
und der Produktionsbuild sind erfolgreich. ESLint: **0 Fehler, 6 bestehende
Fast-Refresh-Warnungen**. Der Build meldet weiterhin große Bundles und Hinweise
zur Vite/Nitro-Konfiguration. `git diff --check` ist sauber.

Dieser Schritt ändert Dokumentation und eine separat ausgeführte Diagnose,
keinen Produktcode. Daher wurde keine neue Browser-/Archicad-Abnahme durchgeführt
und keine neue Geschwindigkeitsverbesserung behauptet. Die Laufzeitwerte oben
sind ausdrücklich die schon vorhandene PR171-Messung.

## Genau ein ausführbarer Folgeauftrag

**A-04-Pilot: „Auswahl frei bewegen“ im 2D-Grundriss auf vorbereitete gemeinsame
Aktionsauswertung und betroffene Vorschau umstellen.**

Der Pilot umfasst die bereits erlaubten Auswahlen aus Wänden samt abhängigen
Fenstern, Linien/Polylinien, Schraffuren und Bildreferenzen. Bestehende Grenzen,
insbesondere Einzelfenster nur entlang ihrer Wand, bleiben bestehen. Interne
Anschlüsse bleiben erhalten, Grenzbeziehungen lösen sich nach den bestehenden
Regeln. Keine neuen Bauteile, Anschlussregeln, 3D-Gruppengeste oder Dateiformate.

1. Sitzung und benötigte ID-/Beziehungs-/Endpunktindizes am stabilen Basismodell
   vorbereiten. Aktionsspezifische fachliche Regeln im Domain-Bereich belassen;
   gemeinsames Ergebnis/Lebenszyklus im Application-Bereich führen.
2. Für jedes Ziel nur betroffene Daten und Geometrie auswerten. Dieselben reinen
   Regeln beim Materialisieren/Bestätigen verwenden; vorhandene Vollprüfung
   bleibt die Vergleichsinstanz und Commit-Absicherung. Bestehende Text-/Voice-
   Gruppenbewegung verwendet ebenfalls diese Aktion.
3. Den vorhandenen Grundriss-Verbraucher an Basis plus Vorschau anbinden;
   unveränderte Szene und Navigator gegen reine Pointer-Updates abgrenzen.
   Gemeinsame Wandaußenlinien, Auswahl, Fenster und Sichtbarkeit erhalten.
4. Ergebnisse gegen den bisherigen Vollpfad prüfen: gemischte Auswahl, beide
   Partner/Einzelpartner, Ecke/T, stehende Nachbarn, fremdes Ende am Anschluss,
   Fenster, Nullbewegung, extreme Koordinaten, ungültige/stale Ziele und Abbruch.
   Keine stillschweigende Abschaltung einer bisherigen Fachprüfung.
5. Bestehende sechs Browser-Szenarien vor/nach vergleichen und wenigstens einen
   dichten Anschlussfall ergänzen. Startvorbereitung und Pointerauswertung
   getrennt messen. Harte strukturelle Kriterien: keine Vollprojektprüfung,
   Base64-Schemaprüfung oder Gesamtprojekt-Serialisierung je Pointerziel;
   unveränderte Element-/Assetdaten wiederverwenden und unbetroffene UI nicht
   neu aufbauen. Keine fragilen Millisekunden-Assertions in Unit-Tests.

Praktische Abnahme: verbundene Wände mit Fenster, Linie, Schraffur und Bild
markieren; frei per Maus sowie Länge/Winkel bewegen; Shift halten, Tab benutzen,
zoomen, abbrechen und erneut platzieren. Der stehende Anschlussnachbar muss
richtig zurückgesetzt werden. Ein Undo/Redo nimmt genau die bestätigte Bewegung
zurück/stellt sie wieder her; Speichern/Laden, 3D und IFC zeigen danach denselben
bestätigten Stand. Eine schnelle, aber fachlich abweichende Vorschau ist kein
bestandener Pilot. Erst dessen Nachweis erlaubt die Ausweitung auf weitere Aktionen.
