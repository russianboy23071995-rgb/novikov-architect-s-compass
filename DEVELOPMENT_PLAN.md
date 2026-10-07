# Entwicklungsplan NOVIKOV CAD

## A-04: unveraenderte Referenzbilder wiederverwenden - 07.10.2026

PR169 freigegeben und zusammengefuehrt. Der gemeinsame Bildadapter verwendet
gepruefte URLs ueber gleichwertige Vorschau-Assetkopien hinweg wieder. Exakter
Bildinhalt, MIME und Pixelmasse bestimmen den Treffer; neue Daten und Metadaten
werden erneut geprueft. Begrenzung: acht LRU-Eintraege und 48 MiB konservativ
gezaehlte Zeichen-Nutzlast. Kein Dateiformat-, Modell- oder History-Wechsel.

[Messbericht](docs/performance/IMAGE_URL_REUSE.md): derselbe Browser-Parcours,
sechs Faelle mit je 21 Stichproben, identische ViewBoxes und Pointerziele.
Mit PNG sinkt der Median bis zur Vorschau bei 100/1000/5000 Elementen von
1050/1291/2085 auf 514/741/1603 ms (rund 51/43/23 Prozent). Wiederholte
Bild-URL-Dekodierung entfaellt bei warmem Cache. Kaltes Laden bleibt unveraendert.
Ohne PNG keine relevante Aenderung des Codepfads; Messschwankungen bleiben.
Alle sechs Ablaufe mit Vorschau, Abbruch, Platzierung, Undo und Redo bestanden.
628 Tests, Typpruefung und Build bestanden; Lint: 0 Fehler, 6 bekannte Warnungen.
A-04 bleibt offen: zwei Vollvalidierungen je Vorschau und teure Wandableitungen
bestehen weiterhin. A-01-Messluecken fuer reale/dichte Faelle bleiben bestehen.

Genau ein naechster Auftrag: die doppelte Validierung identischer Gruppen-
bewegungsvorschauen aus Praezisionseingabe und Grundrissdarstellung beseitigen.
Ein validiertes Ergebnis nur fuer unveraenderten Bewegungskontext und dasselbe
Ziel wiederverwenden; Modell-/Auswahl-/Sichtbarkeits-/Ursprungs-/Zielwechsel
verwerfen es. Finale Commit- und Stale-Kontextpruefung behalten. Gemeinsamer
Interaction-/Application-Pfad, keine werkzeugspezifische UI-Kopie. Wiederverwendung
und Invalidierung testen, dann denselben Sechs-Faelle-Parcours erneut messen.

## Aktive Gruppenbewegung vermessen - 07.10.2026

PR168 freigegeben und zusammengefuehrt. Der begrenzte Messauftrag A-01/A-04
ist abgeschlossen; keine neue Produktfunktion oder Vorschauoptimierung in diesem Schritt.
[Messbericht](docs/performance/ACTIVE_MOVEMENT_PROFILE.md) und sechs Einzelberichte
mit je 21 Stichproben dokumentieren den realen gemeinsamen Handler-/Renderpfad
mit synthetischen DOM-Ereignissen (keine Messung von Hardware- oder GPU-Latenz).

Median bis zur verifizierten Vorschau ohne/mit PNG: 100 Elemente 34,5/1050,0 ms;
1000 Elemente 203,7/1290,6 ms; 5000 Elemente 1184,2/2085,0 ms. Pro Mausziel
laufen zwei Vollvalidierungen. Bei unveraenderten PNG-Daten kommen rund 534 ms
fuer erneute URL-Pruefung/Dekodierung hinzu: neue Vorschau-Assetobjekte verfehlen
den bestehenden identitaetsbasierten Cache. Snap war auf diesem duenn belegten
Testweg guenstig; dichte Suchbereiche sind damit nicht allgemein abgenommen.

Alle sechs Faelle: 20 Waende ausgewaehlt, Vorschau angezeigt, Escape ohne History,
Platzierung, genau ein Undo und Redo bestanden. 623 Tests, Typpruefung und Build
erfolgreich; Lint ohne Fehler mit 6 bekannten Warnungen. Diagnosecode fehlt im
Produktionsbundle. A-01 bleibt fuer reale Projekte, dichte/Kontur-Faelle, Hardware-
Pointer und Peak-/GPU-Speicher offen. A-04 ist vermessen, noch nicht optimiert.

Damals naechster Auftrag (oben abgeschlossen): den gemeinsamen checkedImageUrl-Pfad so begrenzt
zwischenspeichern, dass unveraenderte Bildinhalte und Metadaten auch bei neuen
Vorschau-Assetobjekten wiederverwendet werden. Cache-Bindung begrenzen; geaenderte
Bytes, MIME oder Masse duerfen keine alte URL erhalten. Datei-/Modellvalidierung
und History beibehalten; anschliessend denselben Bewegungsparcours vergleichen.
Die doppelte Vorschauvalidierung bleibt ein danach separat zu bearbeitender Befund.

## A-03: redundante Commit-Validierung entfernt - 07.10.2026

PR167 freigegeben und zusammengefuehrt. Der begrenzte A-03-Auftrag ist umgesetzt:
Der gerade vollstaendig validierte neue Snapshot wird fuer den Vergleich direkt
serialisiert; seine UTF-8-Groessenpruefung bleibt explizit erhalten. Keine Caches
fuer ungesicherte Eingaben, keine Lockerung der Datei- oder Geometrievalidierung.

[Messbericht](docs/performance/A03_COMMIT_VALIDATION.md): 5000 Elemente mit PNG,
9,33 MiB, je 21 Messungen im selben Browserlauf. Alter/neuer Commit Median
1390,3/948,7 ms (-31,8 %); P95 1455,3/980,8 ms. Vollvalidierung 438,9 ms,
kalte Wandableitung darin separat 200,9 ms. JSON-Vergleich/Groessencheck 54,5 ms.
Der Commit bleibt teuer; Vorschauen sind mit dieser Aenderung nicht optimiert.

623 Tests, TypeScript inklusive Diagnose und Build bestanden; Lint ohne Fehler,
6 bekannte Warnungen. Browser-Abnahme: unzulaessige Eckhoehe abgewiesen;
Fensterbreite 1,2 -> 1,4 m, Undo -> 1,2 m, Redo -> 1,4 m bestaetigt.
A-01 bleibt mit seinen ausgewiesenen Messluecken offen.

Damals naechster Auftrag (oben abgeschlossen): den vorhandenen gemeinsamen Gruppen-
bewegungspfad von Pointer-Eingang ueber Fang/Validierung bis zur gerenderten
Vorschau instrumentieren. Dieselbe Bewegung von 20 Waenden in 100/1000/5000
Elementen ohne/mit PNG messen, Median/P95 je Phase und Abbruch/Commit/Undo
pruefen. Daraus die naechste Vorschauoptimierung bestimmen. Neue Bauteile und
Raeume bleiben zurueckgestellt.

## P0-Messreihe und A-02-Korrektur - 07.10.2026

PR166 freigegeben und mit erhaltener Architektur-Aufgabenliste zusammengefuehrt.
Browser-Parcours und Rohdaten: [P0_BROWSER_BASELINE](docs/performance/P0_BROWSER_BASELINE.md).
Sechs Szenarien: 100/1000/5000 Elemente ohne/mit PNG, bis 9,33 MiB. Kernaktionen
je 21 Stichproben, Auswahl je 22 Klicks, Median/P95 und JS-Heap-Snapshot dokumentiert.
A-02 ersetzt beide vollstaendigen JSON-Formschluessel durch schwache Snapshot-
Revision plus Auswahlidentitaet. Auswahlwechsel/Modellaenderung aktualisieren
Formulare; Zoom behaelt Eingabeentwuerfe. Kein Zugriff auf Assets fuer Formschluessel.

619 Tests, Typpruefung inklusive Diagnosecode und Build bestanden; Lint ohne
Fehler (6 bekannte Warnungen). Browser: Entwurf bei Zoom, Auswahlwechsel,
Maasseingabe/Undo/Redo und Ebenenzuweisung/Undo geprueft.

A-01 ist ein Teilnachweis: aktive Pointer-bis-Bild-Vorschau, Kontur-/Dichte-
Browserregressionen, echte Nutzerprojekte und Peak-/GPU-Speicher bleiben offen.
ConnectedWallSolids besitzt bereits einen Snapshot-Cache; A-04 muss neue Vorschau-
Snapshots und unveraendertes Modell unterscheiden. Keine pauschale Speicher-Kopiebehauptung.

Damals naechster Auftrag (inzwischen oben abgeschlossen): A-03 am vorhandenen grossen Bildszenario in Validierung,
Wandableitung und JSON-Vergleich aufteilen und einen nachgewiesen redundanten
Durchlauf begrenzt korrigieren; Guards, Undo/Redo und Dateivalidierung erhalten.
Raeume bleiben bis zur Stabilisierung zurueckgestellt.


## Architektur und Skalierung: priorisierte Aufgaben - 07.10.2026

Stand der Prüfung: `main` am 07.10.2026. Die Prioritäten gelten für die
Architekturarbeiten; der unten dokumentierte Auftrag zur Bewegung von
Bildreferenzen bleibt der festgelegte Funktionsauftrag. Größere Umbauten
folgen erst auf Messungen mit realen Projekten. Die Checkboxen zeigen den aktuellen Stand; ein Codebefund allein belegt
noch keinen spuerbaren Browser-Engpass.

### P0 - zuerst messen und den bekannten Render-Aufwand entfernen

- [ ] **A-01 Browser-Baseline für große Projekte.** Reproduzierbare Szenarien
  mit etwa 100, 1.000 und 5.000 Elementen sowie ohne und mit eingebetteten
  PNG/JPEG-Referenzen nahe der heutigen 10-MiB-Projektgrenze anlegen.
  Auswahl/Eigenschaften, Pointer-Vorschau, Commit, Undo/Redo und
  JSON-Laden/Speichern messen; Median/P95 und Speicherbedarf samt Browser,
  Testdaten und Messmethode dokumentieren. Auch viele verbundene Wände und
  ausgewählte Gruppen aufnehmen. **Abnahme:** Eine Vergleichsbasis macht
  sichtbar, welcher Pfad tatsächlich bremst; Wiederholung nach Änderungen
  zeigt denselben Ablauf ohne Funktionsverlust.
- [x] **A-02 Eigenschaftsformulare ohne vollständige JSON-Schlüssel.** In
  `CadWorkspace` werden Formzustände derzeit über
  `JSON.stringify([selection, project])` geschlüsselt (zwei Stellen). Einen
  stabilen Schlüssel aus Auswahlidentität und passender Modellrevision
  verwenden, ohne das gesamte Projekt bei jedem Render zu serialisieren.
  **Abnahme:** Auswahlwechsel, Bearbeitung, Undo/Redo sowie Ebenen- und
  Referenzänderungen aktualisieren die Formulare korrekt; der große
  Serialisierungsschritt entfällt. Die isolierte Messung von etwa 10 ms für
  5 MiB ist ein Hinweis, kein gemessener Browserwert.

### P1 - nach der Baseline gezielt die heißen Pfade bearbeiten

- [x] **A-03 Validierung und History auf Kosten prüfen.** Beim Commit werden
  aktuell das gesamte Projekt validiert, verbundene Wandkörper abgeleitet und
  ein JSON-Snapshot für den Vergleich erzeugt. Besonders eingebettete
  Bilddaten in der A-01-Messung betrachten. Nur bei nachgewiesenem Engpass
  den Commit-/Vergleichspfad begrenzt optimieren, etwa durch stabile
  Änderungsidentitäten oder wiederverwendbare, unveränderliche Daten.
  **Abnahme:** Ungültige und veraltete Aktionen bleiben gesperrt; Undo/Redo,
  Dateiroundtrip und Projektvalidierung liefern dieselben Ergebnisse.
  Keine pauschale Aussage über 100-fach kopierte Bilder im Speicher treffen.
- [ ] **A-04 Vorschauen lokal halten.** `previewWallChain` und
  `previewSelectionMove` können bei Pointerbewegungen ganze
  Projektprüfungen auslösen; `BimPlan` berechnet verbundene Wandkörper
  für die Anzeige. Mit A-01 die Kosten bei vielen Wänden, Öffnungen und
  Mehrfachauswahl prüfen. Wenn relevant, Vorschau auf betroffene Elemente
  und gültige Sitzungs-/Projektversion begrenzen oder Ableitungen cachen;
  beim endgültigen Commit vollständig absichern. **Abnahme:** Messbarer
  Rückgang der Pointer-Latenz ohne andere Vorschau, veraltete Ergebnisse
  oder geänderte Commit-/Undo-Semantik.

### P2 - Wartbarkeit und Kapazität planvoll verbessern

- [ ] **A-05 Importzyklus der Kontur-/Offsetlogik auflösen.**
  `src/application/direct-edit/offset.ts` und `contour.ts` importieren
  einander. Gemeinsame reine Hilfslogik an eine eindeutige Stelle verschieben.
  **Abnahme:** Kein gegenseitiger Runtime-Import; Offset- und
  Konturfunktionen einschließlich Grenzfällen verhalten sich wie zuvor.
- [ ] **A-06 Projektgröße und Bildspeicherung entscheiden.** Die aktuelle
  10-MiB-Dateigrenze, eingebettete Base64-Bildreferenzen und das
  16-Megapixel-Pixelbudget anhand realistischer Projekte und A-01 bewerten.
  Erst dann eine tragfähige Grenze beziehungsweise ein Asset-/Paketformat
  festlegen. **Abnahme:** Import, Speichern, Öffnen und Weitergabe
  funktionieren mit dokumentierten Grenzen; Browser sowie eine spätere
  Windows-/macOS-Desktop-Hülle nutzen dieselbe Projektlogik. PDF-Import ist
  eine eigene künftige Funktion.
- [ ] **A-07 Große UI-Module schrittweise entlasten.** `CadWorkspace`
  (rund 1.200 Zeilen) und `BimPlan` (rund 1.460 Zeilen) bei konkreten
  Änderungen in kleine Verantwortlichkeiten schneiden; Geometrie und
  Projektzustand in bestehenden Domain-/Application-Grenzen halten.
  **Abnahme:** Kein zweites editierbares Modell im React-State; sichtbares
  Verhalten und Regressionstests des jeweils bearbeiteten Werkzeugs bleiben
  erhalten. Kein pauschaler Komplettumbau.

**Bereits adressiert, keine neue offene Engpassaufgabe:** Die
Konturvorbereitung nutzt Sitzungs-Cache und prüft geänderte Kanten; der zuvor
gemeldete 500-Punkte-Fall wurde isoliert deutlich schneller gemessen. Die
Fangpunktlogik besitzt bereits einen lokalen Index und eine Begrenzung für
dichte Bereiche. A-01 nimmt beide als Browser-Regression mit auf.

**Aktueller Architekturauftrag:** siehe P0-Messreihe oben. A-01-Teilnachweis und
A-02 liegen vor; A-03 folgt anhand der gemessenen Kosten. Die noch offenen
A-01-Abnahmen bleiben ausdruecklich bestehen.

## Bildreferenzen gemeinsam bewegen - 07.10.2026

PR165 freigegeben und zusammengefuehrt. Die bestehende SelectionMove-Aktion
verschiebt jetzt auch den Bildursprung. Assets, Kalibrierung und Rotation bleiben
unveraendert. Einzelbild und gemischte Auswahl verwenden denselben Ursprung,
Fang-/Hilfslinienpfad, Winkel/Laenge, Klick-Commit und Undo. Das Einzelbild bekommt
im On-Demand-Menue den Einstieg "Element frei bewegen". Text/Voice-Auswahlbewegung
benutzt automatisch dieselbe Aktion. Hostgebundene Fenster brauchen weiterhin
ihre Wand in der Gruppe; diese Regel wird nicht gelockert.

Nachweis: 618 Tests, TypeScript und Build erfolgreich; Lint ohne Fehler und mit
6 bekannten Warnungen. Tests: Bild allein/gemischt mit BIM, fester Massstab und
Rotation, Assets, Einmal-Undo/Redo, JSON, Textaktion, versteckte/veraltete Ziele.
Browser: Einzelbild um 2 m numerisch bewegt, Undo stellt Ursprung wieder her;
Wand und Bild per Strg-Auswahl, Ursprung und Zielklick gemeinsam bearbeitet.

Abnahme: Bild anklicken > Element frei bewegen > Ursprung anklicken > Ziel
anklicken oder Winkel/Laenge eingeben. Danach Wand mit Strg/Cmd dazunehmen und
Auswahl frei bewegen. Undo muss jeweils die gesamte Bewegung zuruecknehmen.
Keine Bildinhalts-Fangpunkte, keine freie Drehung oder PDF-Unterstuetzung.

Genau ein Folgeauftrag gemaess Guide Etappe 8: einen validierten Raumdatenkern
fuer manuell begrenzte Raumkonturen mit stabiler ID, sichtbarer Kennung, Name,
Geschoss-/Ebenenzuordnung und geometrischer Flaeche planen und implementieren,
inklusive Migration, JSON und Tests. Keine automatische Raumerkennung oder WoFlV.

## Kalibrierung per Text und Sprache - 07.10.2026

PR164 freigegeben und zusammengefuehrt. Nach zwei Messpunkten versteht die
vorhandene Befehlsleiste "Referenz auf 5 m kalibrieren". Der lokale Parser
uebersetzt nur zur bestehenden previewCalibration-Aktion. Ein unveraenderlicher
Messkontext bindet Snapshot, Referenz-ID, Sichtbarkeit und Punkte; neue Messungen
verwerfen alte Vorschauen und laufende Sprachergebnisse. Uebernahme validiert
erneut und erzeugt einen Undo-Schritt. BIM-Skalierung bleibt ausgeschlossen.

Nachweis: 615 Tests bestanden; TypeScript und Build erfolgreich; Lint ohne Fehler,
6 bekannte Warnungen. Browser: Messpunkte, Textvorschau, Uebernahme (4x2 auf
8,944x4,472 m) und Undo auf 4x2 m. Voice ueber simulierte finale Transkripte
inklusive veraltetem Messkontext getestet; echter Mikrofontest bleibt Nutzerabnahme.
Die Befehlsvorschau ist wie bei vorhandenen Befehlen textuell. Keine freie
Sprachinterpretation, keine automatisch erkannten Bildmesspunkte.

Abnahme: Bild auswaehlen, Zweipunkt-Kalibrierung starten, zwei Punkte klicken.
In Modellbefehle "Referenz auf 5 m kalibrieren" eingeben oder per Mikrofon sagen.
Befehl pruefen, Ziel/Lange lesen, Uebernehmen und Undo testen.

Genau ein Folgeauftrag: Bildreferenzen an die gemeinsame Auswahlbewegung anbinden
(einzeln und gemischt), inklusive Ursprung/Fangengine, Vorschau, atomarem Commit,
Undo und Textbefehl. Damit laesst sich die kalibrierte Referenz auch ausrichten,
bevor Guide Etappe 8 beginnt; kein eigener Bewegungsmechanismus.

## Zweipunkt-Kalibrierung für Bildreferenzen - 07.10.2026

PR163 einschließlich Fokusrahmenkorrektur in main ef325a9 integriert. Die ausgewählte
PNG/JPEG-Referenz erhält im On-Demand-Menü eine Zweipunkt-Kalibrierung. Gemeinsame
ToolInteraction-Punktaufnahme mit Fanghilfen; explizite positive Länge mit m/cm/mm.
Reine Geometrietransformation und validierte Application-Vorschau halten den ersten
Messpunkt fest und skalieren gleichmäßig. Übernehmen erzeugt einen Undo-Schritt.
BIM, Mischauswahl, versteckte und veraltete Ziele bleiben gesperrt.

Nachweis: 613 Tests bestanden, TypeScript und Build erfolgreich, Lint ohne Fehler
(6 bekannte Warnungen). Browser: zwei Punkte aufgenommen, 5 m übernommen, Bild
von 4×2 auf 8,944×4,472 m skaliert, Undo stellt 4×2 m wieder her. Fokusrahmen
bleibt ausgeschaltet. Tests sichern Rotation, festen Anker, Einheiten, ungültige
Ziele/Maße, Undo/Redo und JSON-Roundtrip. Download-Grenze des vorigen Schritts bleibt.

Abnahme: Bild anklicken → Zweipunkt-Kalibrierung → zwei Punkte einer bekannten
Strecke anklicken → beispielsweise „5 m“ eingeben → Vorschau übernehmen.
Grenzen: Bildpixel besitzen keine Vektorfangpunkte; noch kein PDF oder Text/Voice-
Adapter für Kalibrierung. Einzelne Referenzbewegung bleibt ein späterer Auftrag.

Genau ein Folgeauftrag gemäß Guide Etappe 7: Text/Voice-Kalibrieradapter auf dieselbe
Application-Aktion setzen. Zuvor aufgenommene Messpunkte und stabile Referenz-ID
als Zielkontext binden, geänderte Kontexte zurückweisen, Vorschau/Annahme/Undo testen.

## Bild-Fokusrahmen korrigiert - 07.10.2026

Nutzerfehler reproduziert: fokussiertes SVG-image erhält Browser-outline auto 5px;
die Modelltransformation vergrößert ihn bis über den Canvas. Bild bekommt wie
andere SVG-Auswahlziele outline-none, der vorhandene CSS-konstante türkise
Auswahlrahmen bleibt. Browserprüfung: fokussiertes Bild, outline-style none.
Nächster Auftrag bleibt Zweipunkt-Kalibrierung.

## PNG/JPEG-Import im Grundriss - 07.10.2026

PR162 freigegeben und in main 925385b integriert. Insert → Bildreferenz importieren
liest PNG/JPEG lokal. Header-/Pixelbudgetprüfung vor Decode, Browserdekodierung mit
Orientierung und Normalisierung nach PNG; Daten bleiben eingebettet. Bildbreite
in Metern steht in Werkzeugeigenschaften. Der vorhandene ToolInteraction-/Snap-
und Placement-Pfad liefert Vorschau, Klick-Commit und Abbruch. Projekt-/Sichtbarkeits-
wechsel und abgebrochene Decodergebnisse dürfen nicht nachträglich committen.

Gemeinsame Auswahl um reference erweitert: Klick, Strg/Cmd, Marquee-Geometrie,
Navigator, Ebenenzuordnung und Filter; blau markierter Rahmen und Bildmaße.
Bild liegt hinter vorhandener Modellgeometrie. Fit berücksichtigt Bildausdehnung.
Keine zweite Engine. Bildinhalt hat keine Vektorfangpunkte. Noch keine Referenz-
Bewegung oder Kalibrieraktion; gemischte Bewegung mit Referenz wird atomar abgewiesen.

Nachweis: 607 Tests, TypeScript, Build erfolgreich; Lint keine Fehler, 6 bekannte
Warnungen. Browser: JPEG 400×200 auf 4×2 m platziert, Undo/Redo, Ebenenausblendung;
PNG dekodiert und Import abgebrochen ohne zweites Element. Reproduzierbare
Projektdatei mit eingebettetem PNG geöffnet: 4×2 m und Position 1,5/0 wieder da.
Save meldet Download angefordert, aber neue Download-Datei dieses Durchlaufs nicht
nachgewiesen; Download-Event Timeout. Das Laden der generierten Datei ist kein
Beleg eines erfolgreichen aktuellen Browser-Downloads. JSON-Roundtrip automatisiert.

Abnahme: Insert → Bildreferenz importieren → PNG/JPEG auswählen → Breite in Metern
setzen → freie Stelle anklicken. Ebene aus/ein, Undo/Redo und Speichern prüfen.
Decoder prüft neue Importbilder; gespeicherte Bilder erhalten vor Anzeige einen
Header-/Maßabgleich. Keine PDF-Unterstützung oder Bildinhaltsanalyse.

Genau ein Folgeauftrag: Zweipunkt-Kalibrierung der ausgewählten Bildreferenz über
validierte Application-Aktion und gemeinsame Punktaufnahme, Vorschau und Undo
implementieren; erster Messpunkt bleibt fest, BIM/mischte Ziele sind gesperrt.

## Persistenter Bildreferenz-Datenkern - 07.10.2026

PR161 freigegeben und in main ee8c61d integriert. Schema 9 ergänzt projektweite
Assets und geschossgebundene Bildreferenzen mit stabilen IDs, Ebene, Asset-Verweis,
Ursprung, Rotation und einheitlichem Meter-pro-Pixel-Maßstab. Versionen 1–8 werden
streng validiert migriert; neue Dateien benötigen einen Schema-9-fähigen Build.
Application previewCreateReference/commitCreateReference erstellt Asset und Referenz
atomar, prüft Projekt-/Snapshotbindung und Dateigröße. Ebenenbelegung, Zuweisung
und Sichtbarkeit berücksichtigen Referenzen. Kein neuer UI-/Auswahlmodus.

602 Tests bestanden, TypeScript und Build erfolgreich. Lint: keine Fehler,
6 bekannte Fast-Refresh-Warnungen. Neue Tests: portable JSON-Datei, Undo/Redo,
Migration V8, ungültige IDs/Verweise/Ebenen/Base64/MIME/Maße, veralteter Import,
Transformation, Dateigröße und unveränderter IFC-Export. Bestehende Migrationstests
verwenden weiterhin echte alte Formate ohne die neuen Felder.

Grenzen: keine Bilddekodierung, kein Canvas-Import oder Kalibriermenü. MIME und
Pixelmaße sind ein Speichervertrag, noch kein Nachweis dekodierbarer Bilddaten;
der kommende Adapter muss Inhalte und tatsächliche Dimensionen verifizieren.
Technisches vorläufiges Budget: 16 Millionen Pixel, maximal 16384 je Kante;
Projektdatei insgesamt maximal 10 MiB inklusive Base64/Metadaten. Nicht als
Nutzerentscheidung oder gemessene Kapazitätsgrenze ausgegeben.

Praktische Abnahme derzeit über automatisierte Tests; bisherige Wand-/Fenster-
Projekte lassen sich weiter öffnen und speichern. Noch kein neuer Bild-Button.
Genau ein Folgeauftrag: PNG/JPEG-Importadapter mit lokaler Dekodierung und
Dimensionsprüfung sowie kleiner 2D-Importbedienung integrieren: Breite in Metern,
Vorschau/Abbruch, atomare Bestätigung, Anzeige, gemeinsame Auswahl und Ebenenfilter,
Speichern/Wiederöffnen. Kalibrierbedienung und PDF bleiben anschließend separat.

## Bildreferenz-Planung - 07.10.2026

PR160 freigegeben und in main d18990d integriert. Bestand und Daten-/Aktionsvertrag
in docs/references/IMAGE_REFERENCE_PLAN.md dokumentiert. Schema 8 besitzt noch
keine Referenzen/Assets; Auswahl, Ebenen und Snapshot-History sind wiederverwendbar.
Vorschlag: PNG/JPEG, eingebettete Asset-Daten, expliziter Geschossbezug und eine
Transformation; Dateigröße muss das bestehende 10-MiB-Leselimit einhalten.
Nutzerentscheidung: PNG/JPEG dürfen ebenfalls kalibriert werden. Die bisherige
Bitmap-Ausnahme in ARCHITECTURE.md Abschnitt 30 ist ausdrücklich ersetzt; BIM
bleibt ausgeschlossen. Keine Runtime-Änderungen.

Genau ein Folgeauftrag: Persistenten Referenz-Datenkern mit validierten Assets,
Transformation/Verweisen, Dateimigration, atomarer Erstellung, Größenprüfung und
Roundtrip-/History-/Fehlereingabetests implementieren. Noch keine Canvas-Bedienung,
keine PDF-Zerlegung und keine Änderung der BIM-Skalierungssperre.

## Browser-Projektdatei-Roundtrip - 07.10.2026

PR159 freigegeben und in main 49f960e integriert. Entwicklungsserver nach Neustart
wieder gestartet. Save project erzeugt eine echte Datei im Downloadordner.
Der automatisierte Download-Event liefert weiterhin einen Timeout, obwohl die
Datei gespeichert wird; kein nachgewiesener Fehler der Anwendung.

Prüfung mit two-corner-t.project.json: fünf Wände, vier Ecken, ein T und ein
Fenster laden, speichern, per Undo zum vorherigen Zweielement-Modell wechseln,
tatsächlich heruntergeladene Datei öffnen und bestätigen. Vollständiger JSON-
Vergleich mit Ausgangsdatei identisch; Navigator zeigt wieder fünf Wände und
Fenster. Keine Fehler in der abgefragten Browserkonsole. Keine Runtime-Änderung;
593 automatisierte Tests und Build aus dem vorherigen Code-Nachweis gelten
unverändert, in diesem reinen Dokumentationsschritt nicht erneut ausgeführt.

Genau ein Folgeauftrag (Guide-Etappe 7): Bestandsaufnahme und begrenzten technischen
Plan für eine importierte Bildreferenz mit Zweipunkt-Kalibrierung erstellen.
Asset-Speicherung, Ebenenzuordnung, Transformation, Undo und Projektdatei müssen
an bestehende Architektur anschließen. Zunächst Daten-/Aktionsvertrag und konkreten
kleinen Implementierungsauftrag festlegen; kein PDF-Zerlegen oder Layouteditor.

## Browser-/IFC-Abnahme Zwei-Ecken-T - 06.10.2026

PR158 freigegeben und in main d2d3af9 integriert. Reproduzierbarer Generator
scripts/generate-two-corner-t-fixtures.mjs und Abnahmeprotokoll
 docs/walls/TWO_CORNER_T_ACCEPTANCE.md ergänzt. Browser: automatisches Zeichnen
auf Hauptwand mit zwei Ecken, Fenster entlang Host über T bewegen, Undo/Redo und
3D geprüft. IFC unabhängig mit IfcOpenShell: Schema fehlerfrei, fünf Wände,
ein Fenster, Soll-/Ist-Wandvolumen 21,41136 m³. Archicad-Abnahme ausstehend.
Browser-Download-Event nicht bestätigt (Timeout); Details und Dateiabgrenzung im
Abnahmeprotokoll. Keine Änderungen am Anwendungscode dieses Schritts.

Genau ein Folgeauftrag: Projekt-Speichern und Wiederöffnen im Browser einschließlich
Download-Rückmeldung gezielt prüfen, um die verbleibende Abnahmelücke zu schließen.


## T-Hauptwand mit zwei rechtwinkligen Eckanschlüssen - 06.10.2026

Die bisherige Anzahl-Sperre in validateCornerTContact ist durch Prüfung jedes
Eckpartners ersetzt. Kontakt muss weiterhin vollständig auf einer ungestörten
Längsseite der zusammengesetzten Kontur liegen. Die Nebenwand darf keinen der
beiden Partner berühren/überschneiden. Gemeinsame Kontur-, Solid-, Fenster- und
IFC-Funktionen bleiben unverändert; keine Sonderlogik im UI.

Nachweis: 593 Tests bestanden, TypeScript/Build erfolgreich, Lint ohne Fehler
(6 bekannte Warnungen). Neue Matrix: drei Achslagen, beide T-Seiten, global gedreht
und ungedreht, Ecke vor/nach T, unveränderte Eckkonturen, History und JSON.
Kollision am zweiten Eckpartner wird atomar abgewiesen. Fenster-Integration jetzt
auch im geschlossenen Rechteck mit T: Platzierung, Maßänderung, Bewegung durch T,
Undo/Redo, Speichern/Laden, identischer Solid/IFC mit aktuellen Fenstermaßen.
Kein neuer Archicad- oder interaktiver Browser-Abnahmetest in diesem Schritt.

Abnahme: Rechteck als Wandkette zeichnen, zusätzliche Wand mittig auf die Achse
einer Rechteckseite führen. T-Anschluss soll ohne bisherige Anzahl-Meldung entstehen.
Fenster auf Hauptwand einsetzen und über den T-Anschluss verschieben; speichern,
neu laden und IFC prüfen. Grenzfall nahe Ecke muss weiterhin abgewiesen werden.
Weiter ausgeschlossen: schräge Ecke in Kombination mit T, eigene Ecke der Nebenwand,
Kontakt mit Eckbereich sowie bisher gesperrte Mehrfachtopologien. Schema bleibt 8;
ältere Builds können diese neue Kombination weiterhin ablehnen.

Genau ein Folgeauftrag: Automatischen Zeichen-/Direct-Edit-Ablauf für diesen neuen
Zwei-Ecken-T-Fall im Browser prüfen und eine IFC-Abnahmedatei für Archicad bereitstellen.


## Fenster-Integrationsprüfung und Lovable-Abgleich - 06.10.2026

PR155 ausdrücklich freigegeben und normal nach main integriert (c3e3c0a).
Neuer Integrationstest in application/drawing/actions.test.ts prüft zwei vorhandene
Abläufe: geschlossener Vierwand-Grundriss und offene Kontur mit Eck-/T-Verbindung.
Fenster präzise platzieren, Vorschau ohne Mutation, einmal bestätigen, Maße ändern,
auf derselben Wand über T hinweg verschieben, Undo/Redo, JSON speichern/laden,
identischer 3D-Solid und identischer IFC-Export nach Reload. IFC enthält erwartete
Wände, Fenster, Öffnungs-/Füllbeziehungen sowie aktuelle Maße und Position.
580 Tests bestanden, TypeScript und Build erfolgreich, gezielter Lint erfolgreich.
Keine neue Modellfunktion oder UI in diesem Prüfschritt.

Offene Grenze ausdrücklich nachgewiesen: T-Hauptwand mit zwei Eckanschlüssen
wird derzeit von validateCornerTContact abgewiesen. Deshalb ist ein geschlossener
Grundriss mit zusätzlichem T an dieser Wand noch nicht freigegeben. Die unterstützten
Varianten werden getrennt geprüft; keine Lockerung der Validierung auf Verdacht.

Praktische Abnahme: Vier Wände zum Rechteck verbinden, Fenster per Maß einsetzen,
Breite ändern, entlang Hostwand bewegen, Undo/Redo, speichern und wieder öffnen,
IFC exportieren und extern prüfen. Archicad wurde in diesem Schritt nicht ausgeführt.

Lovable: origin/Anpassungen_UI bei eab4092 hat 6 eigene Commits und ihm fehlen 37
Commits aus origin/main c3e3c0a. WindowPlacementFields/useWindowPlacement fehlen dort.
Der tatsächlich in Lovable gewählte Zweig ist nicht unabhängig verifiziert; wenn es
weiter Anpassungen_UI ist, erklärt dessen Stand die fehlenden Fenster. Branch-spezifische
Synchronisation ist kein fehlender Fenster-PR-Merge. UI-Änderungen nicht überschreiben.

Genau ein Folgeauftrag: main geordnet in einen Integrationszweig auf Basis von
Anpassungen_UI übernehmen, vorhandene UI-Änderungen erhalten, Konflikte fachlich lösen,
Build/Tests prüfen und PR gegen Anpassungen_UI zur Synchronisierung vorlegen.
Danach bleibt die oben dokumentierte Ecke/T-Einschränkung im fachlichen Backlog.


## Canvas-Fokus und Zoomanzeige - 06.10.2026

Schwarzen Browser-Fokusrahmen bei Mausklick auf 2D-/3D-Canvas entfernt; Tastaturfokus
bleibt funktional und erhält eine dezente focus-visible-Markierung. Links von Grid
zeigt eine Prozent-Auswahl den Zoom des aktiven Viewports und setzt dessen bestehende
Kamera. Ein UI-Portal erhält die Kamera-Verantwortung im CadViewport; kein paralleler
Zoomzustand im Projekt oder Workspace. Mehrfachansichten veröffentlichen nur die
aktive Steuerung. 2D-Bezug: 100 Prozent = 100 CSS-Pixel/m; 3D: bisherige Standardansicht.
Diese Bildschirmwerte sind ausdrücklich kein Druckmaßstab. Mausrad/Fit/Ansichtswechsel
aktualisieren dieselbe Kamera und damit die Anzeige.

Geändert: BimPlan, BimSolidView, CadViewport, CadWorkspace, StatusBar und Protokoll.
Browser: 200 Prozent setzt 200 px/m, Canvas-Klick fokussiert ohne outline,
3D-Wechsel zeigt 100 Prozent. TypeScript, Build und Lint erfolgreich (bekannte Warnungen).
PR155 bleibt offen: automatischer Approval-Review hat den Merge trotz allgemeiner
Freigabe abgelehnt; UI-Korrektur als zusätzlicher Commit im bestehenden PR.
Genau ein Folgeauftrag bleibt Fenster-Integration im verbundenen Grundriss
mit Speichern/Laden und IFC; keine weitere neue Werkzeugfunktion in diesem Schritt.


## Fensterbegrenzung und Darstellung - 06.10.2026

Korrektur zu PR155: Einsetzen und Verschieben begrenzen die Fenstermitte auf den
zulässigen Bereich der Hostwand, auch bei einem Mausziel jenseits des Wandendes.
Die gemeinsame Domain-Funktion window-range berechnet den Bereich aus Fensterbreite,
Wandlänge und gegebenenfalls Gehrungsenden. T-Anschlüsse bleiben ohne Sperrwirkung.
Keine wiederholte Ganzmodell-Suche nach einem Grenzpunkt. Vorschau und Commit
verwenden dieselbe Begrenzung; nicht endliche Maße und zu große Fenster bleiben Fehler.
An Gehrungen bleibt ein numerischer Sicherheitsabstand zur strikt ausgeschlossenen
Berührung. Die eigentliche Modellvalidierung bleibt unverändert verbindlich.

Grundriss: ausgewählte Fenster erhalten die gemeinsame türkise Auswahlfarbe;
Kontur und Mittellinie verwenden die vorhandene zoomunabhängige Wandkonturstärke.
Automatische Wandlängenbeschriftung entfernt. Eigene Fenstermodelle sind ausdrücklich
für später vorgemerkt; Mess- und Bemaßungswerkzeuge folgen separat.

Nachweis: 579 Tests bestanden, TypeScript/Build erfolgreich, Lint ohne Fehler
(6 bekannte Warnungen). Tests für beide Grenzen, vier Richtungen, beide verbundenen
Wandenden, unveränderte Basis und Bestätigung am Cap. Browser: bestehendes Fenster
entlang Wand verschoben, Klick weit hinter Wandende -> Position ca. 0,8 ohne Fehler;
türkise Kontur sichtbar, automatische Wandmaßzahl entfernt. Screenshot window-cap.png.
Genau ein Folgeauftrag bleibt die unten beschriebene Fenster-Integrationsprüfung
im verbundenen Grundriss einschließlich Projektdatei und IFC.


## Präzise Fensterposition - 06.10.2026

PR154 nach Freigabe normal in main integriert (9a4df17). Optionaler Modus
„Position per Maß“ in Werkzeugeigenschaften: zuerst sichtbare Wand anklicken,
danach im gemeinsamen Hilfseingabefenster den Abstand der Fenstermitte vom
Wandanfang eingeben. Die Hostwand bleibt fest, der Winkel ist vorgegeben.
Normale Ein-Klick-Platzierung bleibt verfügbar. Wandwahl erzeugt keine History;
Bestätigung verwendet dieselbe validierte addWindow-Aktion wie die Vorschau.
Keine eigene Fenster-Tab-Steuerung oder zweite Maßeingabe implementiert.

Geändert: Application window-placement samt actions.test; UI-Bindung
useWindowPlacement, WindowPlacementFields und kleine Koordination in CadWorkspace;
Architektur und dieses Protokoll.
Nachweis: 578 Tests bestanden; TypeScript und Build bestanden; Lint ohne Fehler,
6 bekannte Fast-Refresh-Warnungen. Test für vier Wandrichtungen, exakten Abstand,
ungültige Abstände, unveränderte Basis und identischen Vorschau-/Commit-Zustand.
Browser: 6-m-Wand, Position per Maß, Wandwahl ohne Bauteilerzeugung, Tab, 1,50 m,
Enter -> neues Fenster mit Position 0,25. Undo entfernt es, Redo stellt es wieder her.
Screenshot: outputs/window-position.png.

Abnahme: Fensterwerkzeug -> Position per Maß -> Wand anklicken -> Tab -> Abstand
(z. B. 1,50) -> Enter. Eigenschaften prüfen; danach Undo/Redo. Grenzen: Grundriss,
Abstand zur Fenstermitte, bestehende Host-/Öffnungsgrenzen bleiben verbindlich.
Maße und Präzisionsmodus sind Sitzungsvorgaben; keine neue Dateiformatversion.

Genau ein Folgeauftrag: Den vollständigen Fensterwerkzeug-Ablauf in einem kleinen
verbundenen Grundriss als Integrationsprüfung absichern: Platzierung und Änderung,
Undo/Redo, Speichern/Laden und IFC müssen denselben Fenster-/Hostzustand behalten.
Gefundene Fehler begrenzt korrigieren, bevor weitere Bauteilwerkzeuge folgen.


## UI-Korrektur zu PR154 - 06.10.2026

Nach Nutzerhinweis den gesamten werkzeugabhaengigen Optionsbereich aus der oberen
Menueleiste entfernt (Fenster, Wand, Linie, Schraffur, Auswahl, Decke). Eigenschaften
und Werkzeugeinstellungen gehoeren ausschliesslich in Werkzeugeigenschaften.
Die alte statische Optionsliste samt Tool-Prop ist entfernt; globale Projekt-,
Ansichts- und Ebenensteuerung bleibt. Keine Modell-/Bedienlogik hinzugefuegt.
TypeScript, Build und gezielter Lint bestanden. Browser: Fensterwerkzeug zeigt
Maße nur in Werkzeugeigenschaften; der obere Optionsbereich ist entfernt.
Folgeauftrag bleibt die unten dokumentierte praezise Fensterposition.

## Einstellbare Fenstermaße vor Platzierung - 06.10.2026

PR153 nach Freigabe normal in main integriert (3c19cc6). Das Fensterwerkzeug zeigt
Breite, Höhe und Brüstungshöhe in der festen Werkzeugeigenschaftenleiste. Eingaben
in Metern mit Komma/Punkt werden über den gemeinsamen Einheitenparser gelesen.
Leere, nicht endliche, negative oder unzulässige Nullwerte sperren die Platzierung;
zusätzlich gelten alle bisherigen Host-/Fenstergrenzen aus addWindow.

WindowPlacementFields ist Darstellung, useWindowPlacement hält den Sitzungsentwurf,
Application parst und führt Vorschau/Validierung/Commit mit denselben Maßen aus.
Eine neue Entwurfsrevision invalidiert alte Vorschau- und Commit-Callbacks, auch
vor dem nächsten Effect-Cleanup. Kein Rückfall auf vorherige gültige Maße. Werte
bleiben bei Werkzeugwechsel während der Sitzung erhalten; bestehende Fenster,
Projektformat, History und IFC werden durch Eingaben allein nicht geändert.

Nachweis: 577 Tests bestanden, TypeScript/Build erfolgreich, Lint 0 Fehler und
6 bekannte Warnungen. Neue Tests für Komma/Punkt, leere/ungültige Maße, zulässige
Brüstung 0, veraltete Vorschau nach Maßänderung, übereinstimmenden Commit und
Hostgrenzen. Browser: leere Breite + Wandklick erzeugt kein Fenster; danach
0,80 × 1,10 m mit Brüstung 0,70 m eingesetzt, Eigenschaften stimmen überein.
Erneuter Werkzeugaufruf behält alle drei Werte. Screenshot outputs/window-dimensions.png.

Abnahme: Fensterwerkzeug, Maße oben ändern, Wand anfahren und klicken. Neue Maße
in Eigenschaften prüfen. Breite löschen: Meldung erscheint, Klick setzt nichts.
Grenzen: Maße sind Sitzungsvorgaben, nicht über Neustart gespeichert. Position
weiter per Maus/Fang; keine neue 3D-Platzierung.

Genau ein Folgeauftrag: Präzise Fensterposition vor Platzierung über die gemeinsame
Hilfseingabe ergänzen: fest gewählte Hostwand und Abstand der Fenstermitte vom
Wandachsenanfang. Bestehende ToolInteraction-/Tab-/Hostachsenregeln wiederverwenden;
Mausplatzierung, Abbruch, Maßänderung und Undo müssen denselben Ablauf behalten.


## Fensterwerkzeug im Grundriss - 06.10.2026

PR152 nach Freigabe normal in main integriert (c2b9897). Eigenes Fensterwerkzeug
in der Werkzeugleiste: sichtbare Wand anfahren, vorhandene Fangengine mit
Hostlaengsachse nutzen, Vorschau sehen, per Klick ein Fenster einsetzen. Danach
Select und direkt die neuen Fenstereigenschaften. Esc/Abbrechen verwirft ohne
Modellaenderung. Start aus 3D wechselt zum Grundriss.

Application window-placement + React-Bindung useWindowPlacement nutzen
ToolInteraction/useToolInteraction und vorhandene Canvas-placement-Schnittstelle.
Keine eigene Hover-/Tastatur-/Rasterengine. Vorschau/Commit pruefen Basis und
Sichtbarkeit; addWindow prueft Masse und bestehende Anschlussregeln. Neue IDs
werden nach Commit gegen das neue Modell ausgewaehlt (gemeinsame Auswahlkorrektur,
auch fuer bisheriges Einfuegen ueber Inspector). Preview-Fenster erben echte
Ebenensichtbarkeit. Vorgabemasse werden mit dem bisherigen Inspector geteilt.

Nachweis: 575 Tests bestanden, TypeScript/Build erfolgreich, Lint 0 Fehler und
6 bekannte Warnungen. Neue Tests fuer unveraenderte Basis waehrend Vorschau,
Abbruch, einen History-Schritt, Undo/Redo, JSON/Solid, Sichtbarkeit, veraltete
Kontexte, ungueltige Ziele, diagonale/versetzte Waende und Hostachse ohne Snap.
Browser: 6-m-Wand, Fenster per Klick bei relativer Position 0.2; Navigator und
Eigenschaften markieren sofort das neue Fenster. Undo entfernt nur dieses Fenster,
Redo stellt es wieder her; erneuter Werkzeugaufruf + Escape erzeugt kein weiteres.
Screenshot outputs/window-placement.png.

Abnahme: Fensterwerkzeug waehlen, innerhalb einer ausreichend langen Wand anfahren
und klicken. Maße anschliessend oben anpassen, Undo/Redo testen. An Wandenden oder
zu kurzen/niedrigen Waenden bleibt die vorhandene Validierung massgeblich.
Grenzen: ein Fenster je Werkzeugaufruf; feste Vorgaben 1.20 x 1.35 m, Bruestung
0.90 m. Bei ueberlagerten Waenden wird der naechste Koerpermittelstrang gewaehlt,
bei Gleichstand stabile ID-Reihenfolge; keine neue Host-Auswahlliste. Bestehende
Regeln fuer ueberlappende Fenster bleiben. Keine neue 3D-Platzierung/Glasdetails.

Genau ein Folgeauftrag: Fenstermasse vor dem Platzieren in Werkzeugeigenschaften
einstellbar machen (Breite, Hoehe, Bruestung) und dieselben Werte durch Vorschau,
Validierung und Commit fuehren. Geaenderte Vorgaben duerfen keine alte Vorschau
bestaetigen; bestehende Fenster bleiben unveraendert.


## Fenster direkt in 3D auswaehlen - 06.10.2026

PR151 nach Freigabe normal in main integriert (41c1623). Der neue Rendereradapter
window-selection liefert stabile Fensterziele an dieselbe zentrale Auswahl wie
Wand, Grundriss und Navigator. Klick in die sichtbare Oeffnung waehlt das Fenster;
Strg/Cmd ergaenzt/entfernt es. Opaque Vordergrundwaende gewinnen den Tiefentest.
Versteckte Fenster/Hostwaende liefern keine Ziele. Fenster erhalten eine dezente
tuerkise Umrandung an beiden Oeffnungsraendern mit GPU-Tiefentest; keine Glasflaeche,
keine Modellkopie, keine Aenderung an Projektformat, Mengen oder IFC.

Nachweis: 572 Tests, TypeScript und Build erfolgreich; Lint ohne Fehler, sechs
bekannte Warnungen. Neue Tests fuer Fenster vor Rueckwand, Vordergrundverdeckung,
versteckte Fenster/Hosts, Koerperversatz, Oeffnungsmasse, beidseitige Kontur,
Kamerabewegung und gemischte Auswahl. Browser: Oeffnung geklickt, Fenstereigenschaften
und Navigator synchron; Strg-Klick ergaenzt Fenster zur Wand (2 Ziele). Screenshot
outputs/window-selection-3d.png. Bestehende Bewegung wechselt im Einzelviewport
weiter zum Grundriss. Kein neues 3D-Bewegungswerkzeug oder Rahmen in diesem Schritt.
Deckungsgleiche ueberlappende Fenster bleiben im Navigator einzeln waehlbar;
kein neues Auswahldurchschalten im Canvas.

Abnahme: 3D aktivieren, in die Fensteroeffnung klicken, Kontur und Eigenschaften
pruefen. Wand waehlen und Strg/Cmd-Klick auf die Oeffnung: beide ausgewaehlt.

Fensterwerkzeug bewertet: Einfuegen existiert bisher als "Add centred window" in
den Wandeigenschaften (validiertes addWindow mit History), nicht als Platzierungs-
werkzeug in der Werkzeugleiste. Ein begrenztes Werkzeug ist jetzt sinnvoll.
Genau ein Folgeauftrag: Fenster im Grundriss per eigenem Werkzeug an einer sichtbaren
Hostwand platzieren, mit Positionsvorschau, Klickbestaetigung und Escape-Abbruch.
Bestehende Massvorgaben/Validierung, ToolInteraction, Fang-/Hostachsenregeln und
History wiederverwenden; Eigenschaften, Text/Voice und Dateien behalten dieselben
Modellaktionen. Kein Rahmen-/Glasdetailmodell oder neue 3D-Platzierung.


## Gemeinsame Wand-Mehrfachauswahl in 3D - 06.10.2026

PR150 normal nach Freigabe in main integriert (f496af0). Branch
feat/solid-multi-selection reicht Strg/Cmd bei vorhandenen Wandflaechen- und
Wandfusspunkt-Treffern an denselben onSelect-Vertrag wie im Grundriss weiter.
Kein neuer Auswahlzustand und keine eigene Toggle-Logik im Renderer. Einfacher
Klick ersetzt, Strg/Cmd-Klick ergaenzt/entfernt; Leerklick leert weiterhin.
Vorhandene Tiefen-/Sichtbarkeitspruefung, Drag-Abgrenzung und Bearbeitung bleiben.
Navigator, Status, Grundriss sowie Text/Voice sehen dieselbe Auswahl. Mehrere
gewaehlte Waende behalten ihre bestehenden 3D-Umrandungen. Der Hinweis in den
Werkzeugeigenschaften verweist fuer Gruppenbewegung auf Grundriss/Modellbefehl.

Nachweis: 569 Tests bestanden, darunter neuer Integrationstest fuer Wandtreffer,
gemischte zentrale Auswahl, Toggle/Ersetzen, ausgeblendete Ziele und dahinter
liegende sichtbare Waende. TypeScript und Produktionsbuild erfolgreich;
Lint 0 Fehler/6 bekannte Warnungen. Browser mit corner-t-demo: E per Klick,
N per Strg-Klick hinzu, per Cmd-Klick entfernt, erneut hinzu und in 2D dieselben
zwei Waende ausgewaehlt. Screenshot outputs/solid-multi-selection.png.

Abnahme: In 3D zwei sichtbare Wandflaechen nacheinander anklicken, bei der zweiten
Strg (macOS Cmd) halten. Beide sind markiert, Anzahl 2. Erneuter Modifier-Klick
entfernt die Wand. Wechsel auf 2D erhaelt die Auswahl; dort Gruppenbewegung nutzen.
Grenzen: Vorhandenes 3D-Picking trifft Waende. Fenster/2D-Elemente erhalten hier
keine neue Treffergeometrie; keine 3D-Rahmenauswahl oder neue 3D-Gruppenbewegung.

Genau ein Folgeauftrag: Fenster-Picking und eindeutige Fensterauswahlmarkierung
in 3D als weiteren Adapter an die gemeinsame Auswahl anbinden; Oeffnungen,
Verdeckung und versteckte Hostwaende pruefen. Keine zweite Auswahlengine.

## Gruppen-Spracheingabe angebunden - 06.10.2026

PR149 nach Freigabe normal in main integriert (854b804). Branch
feat/selection-voice-command ergaenzt die Aufnahme fuer jede sichtbare Auswahl,
auch gemischte Gruppen sowie einzelne Linien und Schraffuren. Aufnahme nur auf
Mikrofonklick. Beispiel: Auswahl um zwei Meter bei neunzig Grad verschieben.

application/commands/selection-voice.ts bindet eine Aufnahme an eine Kontextrevision
mit Projekt, vollstaendigen typisierten Ziel-IDs und Sichtbarkeit. React beendet
sie bei Kontextwechsel oder Unmount. Zusaetzlich prueft der Adapter den aktuellen
Kontext vor der Ergebnisverarbeitung: auch vor Effect-Cleanup eintreffende spaete
Ergebnisse werden verworfen. Zurueckwechseln zur gleichen Auswahl erzeugt eine
neue Revision. Kein Rueckfall auf das erste Element und kein automatischer Commit.

Finale Transkripte werden begrenzt normalisiert und vom bestehenden Textadapter
geprueft; ungueltige Transkripte bleiben im Eingabefeld korrigierbar. Bekannte
Winkelwoerter 45/90/180/270/360 ergaenzen die bestehende Zahlen-/Einheitenliste;
keine allgemeine Freitextinterpretation. Einzelbefehle bleiben verfuegbar.
Vorschau, Zielanzeige, Uebernahme und Undo bleiben dieselben wie beim Text.
Browser ohne SpeechRecognition behalten Textbedienung. Bestehende 20-Sekunden-
Grenze und Meldungen fuer Mikrofon-/Netzwerkfehler werden wiederverwendet.

Nachweis: 568 Tests bestanden, 6 neue fuer Gruppen-/Textgleichheit ohne Mutation,
Kontextwechsel vor Cleanup, spaete Callbacks, Abbruch, Fehler, korrigierbares
Transkript und Winkelwoerter. Bestehende Voice-Tests pruefen Einzelbefehle,
Berechtigungsfehler und Timeout. TypeScript und Produktionsbuild erfolgreich;
Lint 0 Fehler/6 bekannte Warnungen. Browser: 2 Elemente per Rahmen, Mikrofon fuer
die gesamte Auswahl aktiv, Textfallback sichtbar. Screenshot outputs/selection-voice.png.
Keine echte Mikrofonaufnahme oder Erkennungsqualitaet mit Nutzerhardware behauptet;
Transkripte und Fehler wurden mit simulierter Recognition geprueft.

Abnahme: Wand und Fenster gemeinsam markieren, Mikrofon starten und den Beispiel-
satz sprechen. Transkript und Ziele pruefen, dann Uebernehmen; Strg+Z nimmt die
Bewegung zurueck. Zweite Aufnahme starten und Auswahl wechseln: kein spaetes
Ergebnis darf eine alte Vorschau erzeugen. Bei Browserproblemen Text verwenden.

Genau ein Folgeauftrag: Die gemeinsame Mehrfachauswahl in der 3D-Ansicht fuer
bereits vorhandene Wandtreffer per Strg/Cmd-Klick anbinden. Zentralen Auswahlzustand
und Sichtbarkeitsregeln wiederverwenden; keine eigene 3D-Auswahlmenge, kein neues
Gruppen-Bewegungswerkzeug und keine 3D-Rahmenauswahl in diesem Teilschritt.

## Gruppenbewegung per Textbefehl - 06.10.2026

PR148 nach Freigabe normal in main integriert (200735a). Folgebranch
feat/selection-text-command bindet die bestehende freie Gruppenbewegung an lokale
Textbefehle an. Beispiel: Auswahl um 2 m bei 90 Grad verschieben. Meter, cm und mm,
Dezimalkomma/-punkt sowie Grad/Gradzeichen werden erkannt. Winkel 0 bis 360 Grad;
0 Grad = +X, 90 Grad = +Y. Positive Laenge erforderlich. Keine geratenen Ziele,
keine verketteten Teilbefehle und keine freie Sprachinterpretation.

application/commands/selection-command.ts verwendet beginSelectionMove und
previewSelectionMove sowie die gemeinsame Polarberechnung. Fuer diese reine
Translation ist (0,0) nur der Ursprung des Verschiebungsvektors, kein geratenes
Bauteilziel und kein neuer interaktiver Fangpunkt. Bestehende Einzelbefehle werden
weitergereicht, aber nie auf das erste Mitglied einer Mehrfachauswahl reduziert.

Die textuelle Befehlsvorschau zeigt Anzahl, Richtung/Laenge, mitgefuehrte Fenster,
geloeste externe Wandanschluesse und eine aufklappbare Liste typisierter Ziel-IDs.
Das Modell bleibt bis Uebernehmen unveraendert; noch keine geometrische Canvas-
Befehlsvorschau. Uebernahme prueft den gepinnten Modell-/Auswahl-/Sichtbarkeitskontext
und berechnet ueber dieselbe validierte Aktion neu. Kontextwechsel verwirft die
angezeigte Vorschau. Ein Undo-Schritt, gemeinsame Auswahl bleibt nach Uebernahme.
Das On-Demand-Menue schliesst beim Fokus auf die Befehlseingabe.

Nachweis: 562 Tests bestanden, davon 6 neue fuer gemischte Ziele, Einheiten,
Maus-/Textgleichheit, Auswirkungen auf Beziehungen/Fenster, stale/verborgene Ziele,
ungueltige Grammatik/Winkel, Einzelbefehle und Undo/Redo. TypeScript und
Produktionsbuild erfolgreich, Lint 0 Fehler/6 bekannte Fast-Refresh-Warnungen.
Browser: 5 Ziele per Rahmen, Textvorschau ohne Geometrieaenderung, Ziel-IDs sichtbar,
Uebernahme um 2 m in +Y, ein Undo/Redo; anschliessender Strg-Auswahlwechsel entfernt
die Vorschau. Screenshot outputs/selection-text-command.png.

Abnahme: Mehrere Elemente markieren, unten den Beispielbefehl eingeben, Befehl
pruefen. Ziele aufklappen, Uebernehmen, Strg+Z. Neue Vorschau erstellen und Auswahl
wechseln: die alte Vorschau darf nicht mehr uebernommen werden. Fenster ohne ihre
Hostwand werden fuer die freie Gruppenbewegung weiterhin als ganze Aktion abgewiesen.

Genau ein Folgeauftrag: Gruppen-Sprachtranskripte an denselben Textadapter anbinden.
Aufnahme an die vollstaendige Auswahl und Modell-/Sichtbarkeitsrevision binden,
bei Wechsel abbrechen, spaete Ergebnisse verwerfen und niemals automatisch
uebernehmen. Vorhandene Einzel-Sprachbefehle erhalten; keine zweite Modelllogik.

## Gemeinsame freie Gruppenbewegung implementiert - 06.10.2026

PR147 nach Freigabe normal in main zusammengefuehrt (14c887d). Der Folgebranch
feat/shared-selection-move ergaenzt einen Verbraucher der gemeinsamen Auswahl:
application/selection/move.ts berechnet einen vollstaendigen, validierten Snapshot.
Keine Schleife ueber Einzelwandbewegungen, keine zweite Raster- oder Eingabeengine.

On-Demand: Auswahl frei bewegen -> Ursprung im Grundriss anklicken -> Ziel anklicken
oder Tab fuer Laenge/Winkel und Uebernehmen. Der Ursprung wird sofort als gemeinsame
Hilfsreferenz gepinnt; Shift-/Fang-/Hover-Regeln bleiben im vorhandenen System.
Waende, Linien/Polylinien und Schraffuren koennen gemeinsam verschoben werden.
Fenster folgen ihrer Hostwand genau einmal, auch wenn sie mitausgewaehlt wurden.
Interne Ecke-/T-Beziehungen bleiben, Beziehungen zu stehenbleibenden Waenden werden
entfernt. Es entstehen keine neuen automatischen Anschluesse beim Gruppenplatzieren.
Fenster ohne mitgewaehlte Hostwand lehnen die ganze freie Bewegung verstaendlich ab;
ihre bestehende Einzelbewegung entlang der Wand bleibt. Keine stille Teilmenge.

Gepinnte Auswahl/Basis/Sichtbarkeit werden erneut geprueft. Modell-, Auswahl- oder
Sichtbarkeitswechsel invalidieren den Vorgang; Escape, Abbrechen, Werkzeug-/Ansichts-
oder Layoutwechsel verwerfen die Vorschau. Ein Commit, ein Modell-Undo; Nullbewegung
legt keinen History-Eintrag an. Kein Dateiformatwechsel, keine BIM-Skalierung.
Bedienung in 2D; noch keine 3D-Gruppenbewegung und keine Text-/Voice-Gruppenbefehle.
Keine neue grosse Performance-Messreihe fuer diese Aktion behauptet.

Nachweis: 556 Tests bestanden (5 neue Tests fuer gemischte Translation, interne/
externe Beziehungen, Host-Fenster, stale/ungueltige/versteckte Ziele, Fangquellen,
Maus-/Zahlenaktionsgleichheit, Nullbewegung, Undo/Redo, JSON/3D/IFC-Konsistenz).
TypeScript und Produktionsbuild mit deklarierten Abhaengigkeiten erfolgreich;
Lint 0 Fehler, 6 bekannte Fast-Refresh-Warnungen. Browser: Wand/Fenster per Klick
platziert; 5 gemischte Elemente per Rahmen, Ursprung gepinnt, Tab zuerst Laenge,
danach Winkel, 2 m bei 90 Grad mit Vorschau uebernommen, einmal Undo/Redo; Abbrechen
nach Zahlenvorschau laesst Modell und Redo erhalten. Pruefbild outputs/shared-selection-move.png.

Abnahme: Mit Strg-Klick oder Rahmen mehrere Elemente waehlen. Auswahl frei bewegen,
Ursprung anklicken, mit der Maus verschieben und per Klick platzieren. Alternativ
Tab, Laenge 2, Tab, Winkel 90, Uebernehmen. Strg+Z nimmt die ganze Bewegung zurueck.
Bei verbundenen Waenden beide Partner waehlen: interne Verbindung bleibt bestehen.

Genau ein Folgeauftrag: Dieselbe gepruefte Gruppenbewegung als Textbefehlsadapter
anbinden, mit Vorschau und ausdruecklicher Uebernahme, gepinnter vollstaendiger
Zielmenge und Ablehnung bei Kontextwechsel. Keine separate AI-Modelllogik; bestehende
Einzelbefehle erhalten. Sprachtranskripte duerfen spaeter denselben Adapter verwenden.

## Gemeinsame 2D-Auswahl implementiert — 06.10.2026

PR146 freigegeben und normal in main gemergt (c771846). Auf feat/shared-selection
verwaltet ein gemeinsamer Application-Baustein typisierte Zielmengen fuer Waende,
Fenster, Linien/Polylinien und Schraffuren, auch gemischt. Navigator und Canvas
verwenden dieselbe Auswahl. Sichtbarkeit inklusive versteckter Hostwaende gilt
zentral; keine neue Ebenensperre. Nur genau ein Ziel schaltet Einzelaktionen frei.

Klick ersetzt, Strg/Cmd-Klick schaltet Zugehoerigkeit um, Leerklick leert. Rahmen
auf freier Flaeche im Auswahlmodus starten: vollstaendig eingeschlossene Geometrie
inklusive Rand, beide Ziehrichtungen gleich. Mindestbewegung 3 CSS-Pixel. Zeichnen,
Bearbeiten, Referenzwahl und Pan behalten ihre Gesten. Escape/Pointer-Abbruch oder
Modell-/Sichtbarkeitswechsel verwerfen den Rahmen. Kein Modell-/Dateiformatwechsel
und kein Auswahl-Undo. Wandachsen bleiben hervorgehoben; 3D zeigt gewaehlte Waende,
aber noch keine neue 3D-Mehrfachklick-/Rahmenbedienung. Gruppenbewegung bleibt aus.

Pruefung: 551 Tests bestanden; TypeScript und Produktionsbuild erfolgreich;
Lint 0 Fehler/6 bekannte Warnungen. Neue Regressionen pruefen alle Typen, gemischte
Toggle-/Ersetzen-Auswahl, Einzelaktionssperre, Ebenen/Hostsichtbarkeit, ungueltige
IDs, Rahmenrichtung/Rand/Teiltreffer, Achsversatz und Eckkontur. Browser: 5 Elemente
per Rahmen, Schraffur per Strg-Klick entfernt, Fenster per Einzelklick gewaehlt,
Fensterebene ausgeblendet und Rahmen in Gegenrichtung waehlt nur 4. Nach Sichtbar-
machen und Zoom wieder 5; Navigator und Anzahl stimmen. Keine neue Modellbewegung
als getestet behauptet. Pruefmodell outputs/selection-demo.json, Bild shared-selection.png.

Abnahme: Select waehlen, auf freie Canvas-Flaeche klicken und Rahmen um verschiedene
Elemente ziehen. Strg-Klick auf Schraffur entfernt/ergaenzt sie. Einzelklick zeigt
dessen Eigenschaften. Ebene ausblenden: ihre Elemente werden nicht mitgewaehlt.

Genau ein Folgeauftrag: Die gemeinsame freie Verschiebung als Verbraucher der
Auswahlmenge an vorhandene ToolInteraction/Raster-/Hilfseingabe anbinden. Gesamten
Snapshot atomar validieren, interne Wandanschluesse erhalten, externe loesen und
Host/Fenster-Abhaengigkeiten ohne doppelte Bewegung pruefen. Nicht unterstuetzte
Mischungen ausdruecklich ablehnen, keine stille Teilmenge bewegen. Ein Undo-Schritt.


## Nutzerkorrektur: allgemeine Auswahl vor Gruppenbewegung — 06.10.2026

Die zuvor geplante Wand-Mehrfachauswahl wird ersetzt: ein gemeinsamer,
werkzeugunabhaengiger Auswahlbaustein fuer ALLE Elementtypen, bereits im ersten
2D-Schritt fuer Waende, Fenster, Linien/Polylinien und Schraffuren zusammen.
Verbindlich: Klick, Strg-Klick und aufgezogener Auswahlrahmen; nur sichtbare und
aktive Ebenen. Auswahlbarkeit ist unabhaengig von Bewegungsfaehigkeiten.

[Ueberarbeiteter Plan](docs/walls/SELECTION_MOVE_PLAN.md) trennt zentrale Auswahl-
und Ebenenregeln von typbezogener Treffergeometrie. Nutzerklaerung: "aktive Ebenen"
bedeutet alle eingeblendeten Ebenen; kein zusaetzlicher Sperrstatus.
Rahmen-Randfaelle, Toggle und konkurrierende Zeichen-/Auswahlgesten bleiben als
Vorschlaege bzw. offene Details ausgewiesen. Keine Nutzerentscheidung erfunden.

Genau ein Folgeauftrag: Allgemeinen 2D-Auswahl-
baustein samt Klick/Strg-Klick/Rahmen fuer alle vorhandenen Elementtypen umsetzen
und pruefen. Gruppenverschiebung folgt als Verbraucher dieser Auswahl, nicht als
wandbezogene Parallelstruktur. Noch keine Laufzeitaenderung; nur Planungsdokumente.
Dieser Abschnitt und der ueberarbeitete Plan ersetzen die aelteren Folgeauftraege.


## Mehrfachauswahl und Gruppenbewegung: Bestandspruefung — 06.10.2026

PR145 nach Freigabe normal in main gemergt (c8a205c). Aktuell gibt es nur
Einzelauswahl und Einzelbewegung. Window selection / Filter zeigen Hinweise,
keine Auswahlmenge. Ein Modellversuch zeigt: sequenzielles Verschieben von H/E/N
erhaelt die Ecke, verliert aber den internen T-Anschluss. Gruppenbewegung braucht
also eine gemeinsame Snapshot-Aktion statt wiederholter Einzelbewegungen.

[Plan und Akzeptanzfaelle](docs/walls/SELECTION_MOVE_PLAN.md) dokumentieren die
betroffenen Module, Wiederverwendung von ToolInteraction/Raster/Hilfseingabe,
Fensterzuordnung, interne/externe Verbindungen und vorgeschlagene additive Auswahl.
Bediengesten und Details sind als Vorschlag gekennzeichnet. Keine Laufzeit- oder
UI-Aenderung, keine neue Gruppenfunktion als fertig behauptet.

58 bestehende Direct-Edit-/ToolInteraction-/Ecke-T-Tests bestanden; diff --check
sauber. Kein erneuter Build fuer Dokumentation; PR145-Code zuletzt mit 546 Tests,
TypeScript und Produktionsbuild erfolgreich geprueft.

Genau ein Folgeauftrag: 2D-Wand-Mehrfachauswahl und atomare freie Gruppenbewegung
gemaess Plan als durchgaengigen Ablauf implementieren: interne Anschluesse erhalten,
externe loesen, gemeinsame Vorschau/Fang-/Zahleneingabe und ein Undo-Schritt.
Keine eigene gemeinsame Eckpunktbewegung. Dieser Abschnitt ersetzt die bisherigen
Folgeauftraege; aeltere Abschnitte bleiben als Verlauf erhalten.


## Ecke und entfernter T-Anschluss umgesetzt — 06.10.2026

PR144 wurde freigegeben und in main zusammengefuehrt (7ef1b05). Umsetzung auf
feat/corner-t-host: Hauptwand mit genau einer rechtwinkligen Ecke und entferntem
rechtwinkligem T-Zulauf. Die Eckkontur bleibt erhalten; voller T-Kontakt muss
innerhalb des geraden Seitenstuecks liegen. Beruehrung/Ueberlappung des Eckpartners
wird abgewiesen. Vorhandene Aktionen, Vorschau, 3D und IFC nutzen dieselbe Domain-
Ableitung. Fenster duerfen T-Kontakte ueberqueren, nicht den Eckabschluss.

Schema 8 bleibt unveraendert; alte Programme koennen neue Kombinationsdateien
abweisen. Keine stille Reparatur beim Laden. Zweite Host-Ecke, schrager Eckwinkel
mit T und eine Ecke an der T-Nebenwand bleiben ausgeschlossen. Reine Eckketten
und reine Mehrfach-Ts behalten ihr Verhalten.

Pruefung: 546 Tests, TypeScript und Produktionsbuild erfolgreich; Lint 0 Fehler,
6 bekannte Warnungen. 19 neue Tests: Anschlussreihenfolge, beide Seiten, Drehung,
Achsversatz, anderes Host-Ende, Kontaktgrenzen, unzulaessige Topologien, Fenster,
Vorschau/Commit, History, JSON/IFC und Sichtbarkeitskonturen. Browser: Pruefdatei
mit drei Waenden und Fenster geladen, Grundriss und 3D visuell geprueft.
IFC generiert und Regressionen bestanden; externer Archicad-Import dieses neuen
Pruefmodells steht dem Nutzer zur Abnahme offen.

Abnahme: L-foermige Wandkette zeichnen und abschliessen. Entfernt von der Ecke
eine Nebenwand rechtwinklig auf die Hauptachse fangen und abschliessen. Ecke und
T in 2D/3D ansehen, Fenster ueber T bewegen, Undo/Redo, speichern und laden.
Lokale Pruefdateien: outputs/corner-t-demo.json und outputs/corner-t-demo.ifc.

Planungskorrektur: Die im Vorplan angenommene gemeinsame Eckpunktaktion existiert
noch nicht. Heutiges Bewegen eines einzelnen Achsendpunkts loest die Ecke, wenn
die Endpunkte auseinandergehen; ein Regressionstest dokumentiert diesen Bestand.
Nutzerentscheidung 06.10.2026: Eine eigene gemeinsame Eckpunktbewegung wird
nicht benoetigt und ist als Folgeauftrag gestrichen. Stattdessen waehlt der
Nutzer beide betroffenen Waende aus und verschiebt diese gemeinsam als ganze
Elemente. Daraus folgt kein automatisches Mitziehen einer nicht ausgewaehlten Wand.

Genau ein Folgeauftrag: Den vorhandenen Stand der Mehrfachauswahl und gemeinsamen
Elementverschiebung pruefen und einen begrenzten Umsetzungsschritt fuer zwei
zusammen ausgewaehlte Waende festlegen. Gemeinsamen Bewegungsursprung, Rasterengine,
Hilfseingabe, Vorschau und einen Undo-Schritt wiederverwenden; Verhalten interner
Verbindungen und Anschluesse zu nicht ausgewaehlten Waenden ausdruecklich pruefen.
Noch keine Gruppenbewegung als implementiert oder abgenommen ausweisen.
Diese Korrektur aendert nur die Planung, nicht die Laufzeitlogik von PR145.



## Ecke und T: begrenzter Umsetzungsplan — 06.10.2026

PR143 ist freigegeben und in main. Der Plan in
[docs/walls/CORNER_T_COMBINATION_PLAN.md](docs/walls/CORNER_T_COMBINATION_PLAN.md)
ordnet den aktuellen Code, einen Drei-Wand-Pruefaufbau und Akzeptanzfaelle zu.
Ein lesender Modellversuch bestaetigt die atomare Ablehnung der Kombination.
Wichtigster Befund: Das T-Hostrechteck wuerde eine vorhandene Eckkontur ersetzen;
die Sperre darf nicht einfach entfernt werden. Keine Laufzeit-/UI-Aenderung.

Genau ein Folgeauftrag: Entfernten rechtwinkligen T-Zulauf an einer Hauptwand
mit genau einem rechtwinkligen Eckanschluss gemaess diesem Plan implementieren
und validieren. Erst danach weitere Topologien. Aeltere Folgeauftraege bleiben
als Verlauf erhalten; dieser Abschnitt definiert den aktuellen naechsten Schritt.

Pruefung: 47 vorhandene Anschluss-/Wandketten-Tests bestanden; diff --check
sauber. Kein neuer Build erforderlich, da ausschliesslich Markdown geaendert.



## Wandkoerper-Vorschau beim Zeichnen — 06.10.2026

PR142 wurde freigegeben und in main zusammengefuehrt. Der neue Schritt zeigt
im Grundriss bereits vor der Bestaetigung den validierten Wandkoerper samt
T-Abschluss. Vorschau und Platzierung verwenden dieselbe Application-Aktion.
Numerische Ziele uebernehmen keine zufaellige Hover-Verbindung. Entwurfswaende
sind entsprechend ihrer Ebene sichtbar; Fangquellen und History bleiben am
gespeicherten Modell. Unzulaessige Ziele zeigen den konkreten Fehler, behalten
bereits gesetzte Entwurfsabschnitte und erzeugen keinen ungueltigen Koerper.

527 Tests bestanden. Browser: T-Start, numerisch 270 Grad/1 m mit Koerpervorschau,
250 Grad mit Rechtwinkelfehler, Korrektur und Abbruch ohne Modell-/Undo-Aenderung.
Abnahme: Wand auf Hauptachse beginnen, Richtung und Laenge waehlen; Koerper
vor Bestaetigung ansehen. Schraeges Ziel zeigt Fehler. Esc verwirft den Entwurf.
Grenzen: 2D-Vorschau; bisherige T-/Eckregeln bleiben erhalten.

Genau ein Folgeauftrag: Kombination aus Eck- und T-Anschluss an derselben
Hauptwand anhand eines kleinen Testgrundrisses fachlich und geometrisch
abgrenzen und einen begrenzten Umsetzungsplan mit Akzeptanzfaellen festhalten.
Noch keine pauschale Freigabe beliebiger Anschlussnetze.


## Wandstart mit T-Anschluss — 06.10.2026

PR139 ist nach Freigabe in main. Neuer Aufgabenbranch aus main: Start einer
Nebenwand auf einer bestehenden Hauptachse mit explizitem lokalem T-Fang.
Der erste Klick merkt den Anschluss vor; der Abschnitt wird mit der gemeinsamen
Application-Aktion validiert. Erst Enter/Doppelklick uebernimmt die Transaktion.
Abbruch, veralteter Kontext, Snap aus und mehrdeutige Quellen erzeugen keinen
ungewollten Anschluss. Keine automatische Verbindung nur aus Koordinaten.
Rechtwinkel, gleiche Querschnitte und bisherige Topologiegrenzen bleiben.

524 Tests bestanden; TypeScript/Build mit main-Abhaengigkeiten erfolgreich,
Lint 0 Fehler und 6 bekannte Warnungen. Browser: Start auf Achse, rechtwinkliger Abschnitt, Enter,
Undo/Redo erfolgreich. Regressionen pruefen beide Seiten, JSON/IFC, Abbruch,
Schraegstellung, Quellenauswahl und striktes Achseninneres.
Abnahme: Wall waehlen, auf Hauptachse bei T-Anschluss klicken, rechtwinklig
herauszeichnen (bei Bedarf Shift), Endpunkt setzen, Enter. Undo entfernt
Nebenwand und Verbindung gemeinsam. Ein T-Abschnitt beendet die Kette.

Genau ein Folgeauftrag: Die Vorschau beim Wandzeichnen um den abgeleiteten
Wandkoerper samt T-Abschluss ergaenzen; dieselbe Application-Validierung wie
beim Klick nutzen und Fehler vor der Uebernahme anzeigen. Keine Erweiterung
der erlaubten Anschlussgeometrien in diesem Vorschau-Schritt.


## Branch-Uebergang abgeschlossen — 06.10.2026

PR140 ist in main, PR141 hat Anpassungen_UI aktualisiert. PR139 wird mit
einem normalen Merge auf main als Zielbasis umgestellt; beide historischen
Planungsabschnitte bleiben erhalten. Die folgenden Infrastrukturauftraege
zur erstmaligen Synchronisation sind damit erledigt. Fachlicher Folgeauftrag
bleibt der T-Anschluss beim Start eines neuen Wandabschnitts.

## T-Fang beim Zeichnen — 06.10.2026

PR138 wurde nach Freigabe zusammengefuehrt. Neue Wandabschnitte koennen mit
dem gemeinsamen T-Achsfang an einer vorhandenen Hauptwand enden. Klick setzt
den Abschnitt, Enter/Doppelklick schliesst die Transaktion ab. Die ganze Kette
bleibt ein Undo-Schritt. Keine Verbindung allein aus numerischen Koordinaten.
Snap aus, Mehrdeutigkeit und feste Richtung bleiben massgebend. Am T muss die
Kette abgeschlossen werden; Ecke/T bleibt ausgeschlossen. Vor dem Klick zeigt
die Vorschau weiterhin die Zeichenachse mit Fangziel, keinen neuen Wandkoerper.

Pruefung: 521 Tests bestanden, TypeScript und Build erfolgreich; Lint 0 Fehler
und 6 bekannte Warnungen. Browser: neue Nebenwand auf Hauptachse gezeichnet,
T-Fang angezeigt, mit Enter abgeschlossen, Undo/Redo erfolgreich. JSON/IFC und
Abbruch/Stale-Kontext sind in den Regressionstests enthalten.

Abnahme: Wall waehlen, Start neben vorhandener Wand setzen, rechtwinklig zur
Hauptachse ziehen, bei T-Anschluss klicken und Enter. Undo entfernt die neue
Wand mit Anschluss; Redo stellt beides wieder her.

**Genau ein Folgeauftrag:** T-Anschluss auch beim Start eines neuen Wandabschnitts
auf einer vorhandenen Hauptachse anbinden; dieselbe Application-Aktion,
Fangprioritaet und atomare Wandketten-History verwenden.

## Gemeinsame Branch-Basis vorbereiten — 06.10.2026

Ziel: main wird der gemeinsame gepruefte Gesamtstand. Lovable arbeitet auf
Anpassungen_UI; Codex nutzt kleine Aufgabenbranches aus main. Beide Richtungen
werden per geprueftem PR nach main uebernommen. Danach main regelmaessig in
Anpassungen_UI mergen, ohne Rebase/Force-Push. Keine zweite dauerhafte finale
Codex-Version. Parallel moeglichst keine Aenderungen derselben UI-Komponente.

Der Uebergangsbranch integration/current-cad-main verbindet main d2ffebb mit
dem freigegebenen Integrationsstand 04ba5b5 (bis PR138) konfliktfrei. Main-eigene
Lovable-Konfigurationsaenderungen bleiben erhalten. PR139 und PR124 bleiben
separate offene Aufgaben; ihre Freigabe wird hier nicht vorausgesetzt.
Ergaenzende Pruefung erfolgt in isolierter Kopie mit bun install --frozen-lockfile
und der deklarierten Lovable-Konfiguration 2.25.2. Keine Aenderung der laufenden
lokalen node_modules. UI-Zweig-Regeln: Piktogramme, Farben und Abstaende an
bestehenden Komponenten anpassen; Handler, Modellaktionen, stabile IDs,
Fanglogik und Eingabe-Lifecycle erhalten. Keine automatische Neugenerierung
von Werkzeugleisten oder Dependency-Updates fuer reine Gestaltungsaufgaben.
Anpassungen_UI bleibt unveraendert; dort laufende Arbeit wird nicht ueberschrieben.

Genau ein naechster Infrastrukturauftrag: Nach Pruefung und Freigabe dieses
Integrations-PR main aktualisieren und den dann aktuellen main-Stand in
Anpassungen_UI ueber einen separaten geprueften Merge uebernehmen. Dabei dessen
eigene Dependency-Updates und Praesentationsregeln erhalten und testen. Danach
PR139 auf die gemeinsame Basis umstellen und die fachliche Reihenfolge fortsetzen.


## Nutzerbeschriftung: Wandachslagen — 06.10.2026

Achslagen heißen Außen (bisher rechte Kante), Mitte und Innen (bisher linke
Kante). Neue gezeichnete Wände und Wandketten verwenden bereits den Versatz
+Stärke/2 und damit standardmäßig Außen. Bestehende Wände und Projektdateien
behalten ihre gespeicherte Achslage. Keine automatische Ermittlung einer
Gebäudeaußenseite; die Benennung bezeichnet die bisherigen gerichteten Varianten.
Nächster Auftrag bleibt T-Fang beim Zeichnen neuer Wandabschnitte.

## Nutzerkorrektur: Fenster über T-Anschlüsse und Canvas-Darstellung — 06.10.2026

Fenster bleiben laut Klarstellung auf ihrer ursprünglichen Wand und werden von
T-Anschlüssen nicht mehr blockiert. Dies ersetzt die frühere T-Überlappungssperre.
Die ursprünglichen Wandgrenzen und Fenstermaße bleiben maßgebend; Ecken sind
nicht Teil dieser Änderung. Die Öffnung schneidet nur die eigene Wand, keine
Nebenwand. Bei überquertem beschnittenem Nebenwandabschluss begrenzt der gemeinsame
Extrusionskern den Ausschnitt auf das reale Wandprofil. 3D und IFC verwenden die
eigene Wandzuordnung; Anschlussrelationen bleiben unverändert.

View → Canvas-Darstellung → Wand bietet 0,5–2 CSS-Pixel Konturstärke (Standard 1).
Settings öffnet denselben Dialog, auch bei ausgeblendetem Desktop-Menü. Alle
Grundrissfenster übernehmen den Wert, der beim Zoomen konstant bleibt und lokal
im Browser gespeichert wird. Kein Modell-Undo, kein Projektformatwechsel. Achse
bleibt türkis/2,5 Pixel, Auswahlkontur neutral. Baukörpermaße bleiben unverändert.

517 Tests bestanden, TypeScript/Build erfolgreich, Lint 0 Fehler/6 bekannte
Warnungen. Tests für Bewegung über zwei Ts, Host-ID, Undo, Volumen, JSON/IFC und
beschnittenes Nebenwandprofil. Browser: Fenster aus Zwischenraum auf erstes T,
danach auf zweites T gesetzt, Undo/Redo; Konturwahl 1,5 Pixel bei Zoomwechsel und
Neuladen geprüft, anschließend Standard 1 Pixel wieder eingestellt.
Praktische Abnahme: Fenster → Fenster entlang Wand → über beide Ts bewegen;
View → Canvas-Darstellung → Konturstärke ändern und zoomen.

**Genau ein ausführbarer Folgeauftrag:** T-Fang beim Abschluss neuer Wandabschnitte
an die gemeinsame Application-Aktion anbinden und Undo der ganzen Wandkette
beibehalten. Offener PR138 enthält die Korrekturen; noch keine Zusammenführung.

## Auswahlkorrektur: Steuerungsachse hervorheben — 06.10.2026

Die ausgewählte Wandkontur ist jetzt dezent blaugrau mit 1,25 CSS-Pixeln,
unabhängig vom Zoom. Die maßgebende Achse bleibt türkis und 2,5 Pixel stark;
ihre Griffpunkte bleiben ebenfalls türkis. Gemeinsame Grundflächen und
entfernte Kontaktlinien bleiben erhalten. Ergänzung zum offenen PR138.
Nächster Auftrag bleibt T-Fang beim Zeichnen neuer Wandabschnitte.

## Nutzerkorrektur: gemeinsame Grundfläche und mehrere T-Anschlüsse — 06.10.2026

Ergänzung zum offenen PR138 (noch nicht zusammengeführt): bestätigte Eck- und
T-Verbindungen erscheinen im Grundriss ohne innere Kontaktlinie mit einheitlicher
Flächenfarbe. Auswahl bleibt über türkisfarbene Achse und Außenkontur sichtbar.
Nur gespeicherte Verbindungen entfernen Linien; bloßes Überlagern erzeugt keine
visuelle Anschlussbestätigung. Ausgeblendete Partner lassen den Abschluss der
verbleibenden Wand wieder sichtbar werden. Bauteile bleiben einzeln auswählbar.

Die gemeldete Meldung war die bisherige Beschränkung auf ein T-Paar pro Wand.
Nun sind mehrere rechtwinklige Nebenwände an einer Hauptwand auf beiden Seiten
zulässig, auch gegenüberliegend am selben Achspunkt. Zusätzlich echten Fehler
korrigiert: automatische Eckenerkennung darf einen belegten T-Endpunkt nicht
als Eckpartner behandeln. Gleichseitige Kontaktüberlappungen werden abgewiesen.
Fensterprüfung, gemeinsame Konturen für 2D/3D/IFC und Einzelbewegung mit gezieltem
Lösen bleiben erhalten. Nebenwände dürfen noch nicht zugleich Hauptwände oder
beidseitig angeschlossen sein; Ecke/T-Kombinationen und verschiedene Querschnitte
bleiben ausgeschlossen und erhalten spezifische Fehlermeldungen.

515 Tests bestanden, TypeScript/Build erfolgreich, Lint 0 Fehler/6 bekannte
Warnungen. Neue Prüfungen: mehrere Ts bei linker/mittiger/rechter Achse,
Gegenseite, falsche Eckenerkennung, Überschneidung, Kürzen, gezieltes Lösen,
Undo, JSON/IFC, entfernte rotierte Konturen und ausgeblendete Partner.
Browser: zwei Ts geladen, dritten gegenüberliegenden Anschluss per Punkt frei
bewegen hergestellt, Trennlinie entfällt; Undo/Redo geprüft; keine Konsolenfehler.
Screenshot lokal: outputs/multi-t-footprint.png. 3D bleibt aus denselben
Bauteilkörpern abgeleitet; diese Darstellungsänderung betrifft den Grundriss.

Abnahme: Hauptwand mit rechter Kante, mehrere Nebenwände von beiden Seiten
ankoppeln. Nach Klick entfernt sich die Kontaktlinie; bei Undo erscheint sie
wieder. Auswahl einzelner Wände und Fenster sowie Ausblenden prüfen.

**Genau ein ausführbarer Folgeauftrag:** T-Fang beim Abschluss eines neu
gezeichneten Wandabschnitts im Grundriss über die gemeinsame Application-Aktion
anbinden; Mehrfach-T-Regeln wiederverwenden und Undo der gesamten Wandkette
beibehalten. Keine zusätzliche Anschlussgeometrie im Werkzeug.

## Aktueller Stand: T-Fang in der 3D-Endpunktbearbeitung — 06.10.2026

PR137 freigegeben und in den Gesamtzweig fix/reference-selection-lifecycle
übernommen (d909b54). Der bestehende 3D-Arbeitsebenenpfad trägt nun denselben
T-Fangkandidaten wie 2D bis zu previewEdit und dem gemeinsamen Commit.
Die lokale Quellabfrage ergänzt sichtbare Wandachsen; die Application prüft
zusätzlich den exakten T-Zielpunkt auf Sichtbarkeit. Keine eigene 3D-T-Geometrie.
Das Fanglabel zeigt T-Anschluss. Numerische Ziele übernehmen keinen alten
Mauskandidaten; Kamerawechsel, Abbruch und Fokusverlust verwerfen die Mausvorschau.

511 Tests bestanden, TypeScript und Build erfolgreich, Lint 0 Fehler/6 bekannte
FastRefresh-Warnungen. Neue projektionsgestützte Tests: drei Zoomstufen,
Vorschau/Commit, ein Undo/Redo, verdeckte Achsen und fehlende/degenerierte
Arbeitsebenen. Browser: sichtbaren Achsendpunkt der 2,30-m-Nebenwand wählen,
Punkt frei bewegen, Klick am Hauptachsenziel ergibt 3,00 m; Undo 2,30 m,
Redo 3,00 m. Keine Browserfehler. Der Browser meldet den JSON-Download als
angefordert; die Download-Automation konnte die Datei nicht übernehmen.
Gespeicherte Relationen und Roundtrip sind durch die gemeinsamen Tests geprüft.

Abnahme: zwei isolierte rechtwinklige Wände gleicher Stärke/Höhe verwenden.
In 3D die Kantenachse zur Kamera drehen, sichtbaren Achsendpunkt anklicken →
Punkt frei bewegen → Hauptachse am Lotfußpunkt anfahren → T-Anschluss → Klick.
Undo/Redo prüfen. Mittige oder rückseitige, vom Wandkörper verdeckte Achsen
werden weiterhin nicht durch den Körper hindurch gefangen; dafür Ansicht drehen
oder Grundriss verwenden. Beschränkungen auf isolierte rechtwinklige T-Paare,
z=0 und die vorhandenen Öffnungsregeln bleiben bestehen.

**Genau ein ausführbarer Folgeauftrag:** T-Fang beim Abschluss eines neu
gezeichneten Wandabschnitts im Grundriss anbinden. Gemeinsame lokale Achsabfrage
und validierte T-Verbindungsaktion wiederverwenden; nur eindeutige isolierte
rechtwinklige Paare. Vorschau, Abbruch, Öffnungsprüfung und das vereinbarte Undo
der gesamten Wandkette absichern. Keine Mehrfach-Ts oder T/Eck-Kombinationen.

## Aktueller Stand: automatischer T-Fang beim 2D-Endpunktbewegen — 06.10.2026

PR134 und PR135 freigegeben/zusammengeführt. Der gestapelte PR135 wurde über
Integrations-PR136 ohne zusätzliche Codeänderungen in den Gesamtzweig übernommen
(1663005). Neuer Schritt: Punkt frei bewegen oder Punkt in Flucht strecken kann
am eindeutig gefangenen Hauptachsenpunkt eine dauerhafte T-Verbindung erzeugen.
Die Vorschau zeigt den beschnittenen Körper; Klick übernimmt Bewegung und
Relation als einen Undo-Schritt. Fanglabel: T-Anschluss.

Application t-axis-snap nutzt die lokale sichtbare Quellabfrage, Bildschirmradius
und vorhandene Referenzauswahl. Der rechtwinklige Fußpunkt des gegenüberliegenden
Nebenendes wird geprüft. Mehrere mögliche Hosts ergeben keine automatische
Verbindung; Referenzen auswählen begrenzt die Quellen. Kein globales Durchsuchen
aller Wandpaare und keine automatische Verbindung bei bloßer numerischer Eingabe.
Gemeinsamer ToolInteraction-Pfad trägt den Kandidaten zu Vorschau/Commit, ohne
Werkzeug-/Renderer-Modelllogik. Ganze Elementbewegung erzeugt keine Verbindung.

509 Tests bestanden, TypeScript und Build erfolgreich; Lint 0 Fehler/6 bekannte
Warnungen. Browser: unverbundene 2,30-m-Nebenwand per Achsendpunkt auf Hauptachse
gesetzt; 3,00-m-Achse und korrektes 2,82-m-Körperprofil. Undo wieder 2,30 m,
Redo wieder verbundenes Profil; 3D-Darstellung geprüft. Neue Tests sichern
Vorschau/Commit, ein Undo, Pixelradius, Snap aus, Referenzfilter, Mehrdeutigkeit,
veralteten Kontext, atomare Fehler, schräge Sperrrichtung und Kantenachsen.

Praktische Abnahme: zwei isolierte, rechtwinklig zueinander stehende Wände gleicher
Stärke/Höhe. Nebenwand auswählen → Wandachse Ende/Anfang → Punkt frei bewegen →
in Nähe des Lotfußpunktes auf der Hauptachse zeigen → T-Anschluss → Linksklick.
Undo/Redo sowie 3D prüfen. Optional Testdatei outputs/t-axis-start.project.json
(lokal, nicht Teil des Repositories). Noch keine T/Eck-Kombination, mehrere Ts
pro Wand, Zeichnen neuer Wände oder automatische T-Erzeugung in 3D.

**Genau ein ausführbarer Folgeauftrag:** Den vorhandenen 3D-Arbeitsebenen-
Endpunktpfad an denselben Kandidatentransport anschließen. Dieselbe Application-
Fang-/Verbindungsaktion verwenden; Vorschau/Klick/Abbruch und Kamerawechsel
prüfen. Keine zweite T-Geometrie oder eigene 3D-Modellaktion erstellen.

## Nutzerkorrektur: Shift-Flucht halten und SVG-Fokus — 06.10.2026

Gemeinsame Richtungssperre für Grundriss und 3D-Arbeitsebene: Shift erfasst die
aktuelle Hilfsrichtung (sonst 45°-Raster), hält Ursprung/Richtung unabhängig von
weiterer Mausbewegung und gibt sie beim Loslassen frei. Tastaturwiederholung
kalibriert nicht neu; neue Sitzung/Escape/Blur beendet den Zustand. Vorhandene
explizite Bewegungsachsen bleiben vorrangig; exakt passende Fangpunkte weiterhin
entlang der festgehaltenen Richtung erreichbar. Keine separate Werkzeuglogik.

Schwarz-weißen Kreis reproduziert: Punkt frei bewegen → Shift + Linksklick auf
Wandachse. document.activeElement war die Achsen-SVG-Linie mit Browser-outline
"auto 5px", im Modellraum riesig dargestellt. Achsen-Trefferlinie erhält dieselbe
outline-none/focus-visible-Farbmarkierung wie andere Trefferpfade. Identischer
Browserablauf danach ohne Artefakt; Fokus bleibt für Tastaturbedienung erhalten.

504 Tests bestanden, TypeScript/Build bestanden, keine neuen Lint-Warnungen
(6 bekannte FastRefresh-Warnungen). Neue Tests: Winkelhaltung über weit entfernte
Maussektoren, Freigabe/Neukalibrierung, schiefe Flucht, exakter Zielfang, Nullweg,
wechselnde Referenzen, Zoom sowie Vorrang expliziter Achsen.

T-Prüfung: Testprojekt mit gespeicherter Relation liefert im Browser korrekt
6-m-Hauptprofil und 2,82-m-Nebenprofil bei 3-m-Achse, ohne Überlappung. Einfaches
Zusammenschieben erzeugt weiterhin keine Relation; das ist die bekannte offene
Anbindung, keine bestätigte Fehlberechnung einer gespeicherten Verbindung.
Der konkrete Nutzerprojektstand wurde nicht überschrieben oder als Datei geprüft.

Abnahme: Wandendpunkt → Punkt frei bewegen → in Flucht zielen → Shift halten →
Maus weit quer bewegen → Linksklick. Die Richtung bleibt fest; kein schwarzer
Kreis. Shift loslassen, neue Richtung wählen und erneut halten. Auch Linie testen.

**Nächster begrenzter Auftrag:** Automatische T-Verbindung am eindeutigen
Hauptachsenfang im gemeinsamen 2D-Endpunktbewegungspfad (Details im vorherigen
Eintrag). PR134 bleibt Grundlage; diese Korrektur ist darauf aufgesetzt.

## Aktueller Stand: gespeicherte T-Verbindungen — 06.10.2026

PR133 freigegeben und übernommen (f0583c8). Schema 8 speichert isolierte
rechtwinklige T-Paare mit stabilen Wand-IDs und Nebenendpunkt. Strikte Migration
V1–V7 ergänzt keine automatisch erkannten Beziehungen. Gemeinsame Application-
Aktionen verbinden/lösen mit Vorschau, Quellstandprüfung und einem Undo-Schritt.
Plan, 3D und normaler IFC-Export verwenden dieselbe Domain-Konturprüfung.

Einzelwandbewegung löst ohne Mitnahme; Hauptwand-Endänderung behält den festen
Nebenpunkt bei. Verlässt dieser das Achsinnere, wird gelöst, ohne automatische
Umdeutung zum Eckanschluss. Verbleibende unzulässige Kontaktbreite wird atomar
abgewiesen. T-Fenster dürfen berühren, nicht überschneiden, auch auf unsichtbaren
Ebenen. Mehrfach-Ts und T/Eck-Kombinationen bleiben ausgeschlossen.

Nachweise: 500 Tests bestanden (12 neue Integrationstests); TypeScript und Build
erfolgreich, Lint 0 Fehler/6 bekannte Warnungen. Drei reguläre IFC-Exporte mit
IfcOpenShell 0.8.5 unabhängig auf IFC4/EXPRESS, Profile, Zuordnungen, Platzierung
und Nettovolumen geprüft. Browser: Schema-8-Datei geladen, 3D sichtbar, Save und
normaler IFC-Button melden erfolgreiche Erstellung/Downloadanforderung. Der
Browser-Automation lieferte keinen Downloadpfad; ein tatsächlicher Download-
Dateirundlauf ist damit nicht nachgewiesen. JSON-Rundlauf automatisiert geprüft.
Praktischer Test und Grenzen: docs/PERSISTENT_T_RELATIONS.md.

**Genau ein ausführbarer Folgeauftrag:** Den gemeinsamen 2D-Endpunktbewegungs-
Pfad an die gespeicherte T-Aktion anbinden: Ein ausdrücklich gefangener,
eindeutiger Hauptachsenpunkt liefert Host-ID und Nebenendpunkt für atomare
Vorschau/Bestätigung. Bestehende Fang-/Referenzauswahl und Ursprungshilfen nutzen,
keine globale Wandpaarsuche oder neue Einzelwerkzeuglogik. Mehrdeutigkeit,
Abbruch, veralteten Kontext, Undo und normales Wegbewegen testen. Wandketten-
Integration und Mehrfachanschlüsse sind nicht Teil dieses nächsten Schritts.

Die folgenden Einträge sind historischer Fortschritt, keine parallelen Aufträge.

## Aktueller Stand: T-Kern ohne Projektvalidierungsrekursion — 06.10.2026

PR132 freigegeben und übernommen (fced2cd). Domain t-pair enthält die bestehende
Geometrie-/Fenster-/Körperableitung ohne Laufzeitabhängigkeit zur Projektprüfung.
resolveIsolatedTPair validiert/kopiert an öffentlichen Grenzen weiterhin den
vollständigen Modellstand, löst IDs auf und prüft die Isolationsbedingung.
Vorschau und IFC-Abnahmeexport delegieren unverändert an denselben Kern.

488 Tests bestanden; TypeScript und Build erfolgreich; Lint 0 Fehler/6 bekannte
Warnungen. Neue Tests sichern Verwendung ohne Project, unveränderbare Eingaben,
Kopplung an den validierten Snapshot, Berührung/Überschneidung und Zurückweisung
ungültiger vollständiger Projekte auch außerhalb des gewählten Paares.
Drei neu erzeugte IFC-Dateien bytegenau identisch zur vorherigen Abnahmebasis;
IfcOpenShell 0.8.5 bestätigt erneut Struktur, Profile, Zuordnungen und Volumina.
Keine UI-/Schemaänderung, keine erneute Browserprüfung erforderlich. Praktische
Abnahme weiterhin über die vorhandene T-Vorschau/IFC-Testdateien möglich.

**Genau ein ausführbarer Folgeauftrag:** Die gespeicherte isolierte rechtwinklige
T-Relation in Schema 8 einschließlich strikter Altdatei-Migration und gemeinsamer
Application-Aktionen integrieren. Kern aus t-pair aus der Projektprüfung ohne
Rekursion nutzen; Plan/3D/normaler IFC-Export lesen dieselben Konturen. Speichern/
Laden, Undo/Redo und vereinbartes Lösen bei Einzelwandbewegung bzw. Wegfall des
festen Anschlusses prüfen. Keine Mehrfachanschlüsse oder neue automatische
Fangsuche; zunächst explizite stabile Ziel-IDs in der Application-Aktion.


## Aktueller Stand: Dauerhafte T-Bezüge geplant — 06.10.2026

PR131 freigegeben und übernommen (0939d01). Nutzerentscheidung: Hauptwandende
verlängern/verkürzen lässt den T-Anker an seiner bisherigen Weltposition;
bei Wegfall aus der Hauptwand löst sich die Verbindung. Einzelwandbewegung
löst weiterhin ohne Mitnahme. Entscheidung im Architekturvertrag festgehalten.

[Dauerhafte T-Verbindungen](docs/PERSISTENT_T_RELATIONS.md) ordnet Schema-8-
Migration, stabile Bezüge ohne redundanten Anker, gemeinsame Konturverbraucher,
Fenster, Bearbeitungsabsicht und Undo/Redo zu. Wichtigster Codebefund:
inspectTOpenings -> validateProject -> connectedWallSolids würde bei direkter
Integration rekursiv. Vorher den reinen Kern vom validierenden Einstieg trennen.

Nur Dokumentation geändert. Quellpfade/Verbraucher, Links und diff --check geprüft;
keine neuen Build-/Testläufe. Letzter Code-Nachweis bleibt 486 Tests sowie drei
unabhängig bestandene IFC-Prüfungen. Archicad-Abnahme der T-Dateien noch offen.
Im Programm ist weiterhin nur die temporäre T-Vorschau vorhanden.

**Genau ein ausführbarer Folgeauftrag:** T-Geometrie-/Öffnungskern von der
Projektvalidierung trennen, damit gespeicherte Beziehungen später ohne Rekursion
geprüft werden. Öffentliche Vorschau/Abnahmeexport strikt validieren; denselben
Kern verwenden und bestehende Geometrie-, Fenster- und IFC-Tests erhalten.
Noch keine Schemaänderung, automatische T-Erkennung oder neue Bedienregel.


## Aktueller Stand: T-IFC-Abnahmeexport geprüft — 06.10.2026

PR130 freigegeben und übernommen (b76ab5a). Separater Export exportTJunctionIfc
nutzt gemeinsamen IFC-Writer und Domain t-solid. Die bestehende Vorschau nutzt
denselben Helfer; keine zweite Validierung/Geometrie. Normaler IFC-Export und
Projektformat unverändert. T-Verbindungen bleiben temporär.

486 Tests bestanden, TypeScript/Build erfolgreich, Lint 0 Fehler/6 bekannte
Warnungen. Neue IFC-Tests sichern Öffnungen, stabile IDs, unveränderte Eingaben,
unveränderten regulären Export, Snapshot vor async Hashing und Ablehnung
ungültiger/überschneidender Ziele. IfcOpenShell 0.8.5 validiert t-free,
t-touch und t-touch-rotated mit IFC4/EXPRESS, Hierarchie, Fensterzuordnung,
Profilen, Platzierung und analytischen Netto-Volumina. Summe jeweils 8,17056 m³.
Keine erneute Browserprüfung nötig: keine UI-Änderung; die geprüften Domain-
Konturen aus der vorherigen Browservorschau werden wiederverwendet.

Archicad-Abnahme noch offen. Testdateien in outputs/t-ifc-acceptance;
Anleitung und Reproduktion in [T-IFC-Abnahme](docs/T_IFC_ACCEPTANCE.md).
Zuerst t-touch.ifc prüfen: zwei Wände und zwei Fenster, beide Öffnungen bündig
am Anschluss, Hauptwand ungeteilt und kein überschneidendes Wandvolumen.
Nicht mit dem regulären Export der Ausgangs-Projektdatei verwechseln.

**Genau ein ausführbarer Folgeauftrag:** Die dauerhafte T-Relation anhand der
vorhandenen Endpunktbezüge und Migration planen und das Verhalten beim
Verschieben/Verlängern der Hauptwand mit dem Nutzer festlegen. Bestehende Regel
für Einzelwandbewegung (lösen) berücksichtigen; keine relative Ankerbewegung
oder Mitnahme unbestätigt einführen. Danach einen begrenzten Persistenzauftrag
festhalten. Text/Voice bleiben Adapter gemeinsamer geprüfter Aktionen.


## Aktueller Stand: T-Vorschau mit Fenstern — 06.10.2026

PR129 freigegeben und übernommen (fb0f21e). Nutzer erlaubt Fenster gegen Wände;
umgesetzt als Berührung erlaubt, Überschneidung verboten im isolierten T-Fall.
Die Eckanschlussregel bleibt unverändert. Domain t-openings prüft Hauptfenster
gegen die Kontaktbreite, Nebenfenster gegen den gekürzten Körper. Application
nutzt den Bericht und die gemeinsame Öffnungsextrusion. Rundung an lokalen
Kappengrenzen wird in abgeleiteter Geometrie innerhalb Modell-Toleranz vereinheitlicht.

484 Tests bestanden; TypeScript und Build erfolgreich; Lint keine Fehler,
sechs bekannte Warnungen. Neue Fälle: beide Kontaktränder, frei/berührend/
überschneidend, Achslagen und Anschlussseiten, Endpunktumkehr, Rotation,
Translation, unsichtbare Fenster, unveränderte Eingaben und Netto 8,17056 m³.
Browser: zwei 1x1-m-Fenster berühren den T-Kontakt, 2D/3D zeigt Ausschnitte,
Vorschau meldet 8,1706 m³ ohne Fehler. Keine persistente Verbindung oder
geändertes Speichern/IFC. Fenster über bestehende weitere Anschlüsse bleiben
außerhalb dieser Vorschau. Keine neuen Befehle; Text/Voice bleiben Adapter.

Abnahme: Hauptwand auswählen -> Wandanschluss vorschauen -> T-Anschluss,
Nebenwand/Ende wählen. Ein Fenster darf bis an den Kontakt reichen; 1 cm darüber
hinaus ergibt eine Überschneidungsmeldung. Testdatei mit beiden Kontakten liegt
in outputs/t-windows-touch.project.json. Die Vorschau verändert das Modell nicht.

**Genau ein ausführbarer Folgeauftrag:** Das isolierte T-Paar einschließlich
freier und berührender Fenster über den vorhandenen gemeinsamen IFC-Writer als
separaten Abnahmeexport prüfen. Keine Änderung des regulären Projektexports oder
persistente T-Verbindung. Profile, Öffnungen, Platzierungen und Nettovolumina
unabhängig mit IfcOpenShell prüfen und eine Archicad-Testdatei bereitstellen.


## Aktueller Stand: T-Fensterprüfung konkretisiert — 06.10.2026

PR128 freigegeben und übernommen (860abc1). Der Folgeauftrag ist als
[Prüfentwurf](docs/T_WINDOW_VALIDATION.md) ausgearbeitet: Nebenfenster gegen
gekürzte Kontur, Hauptfenster gegen die vollständige Kontaktbreite prüfen.
Gemeinsame Modell-Toleranzen, Konturen und Extrusion weiterverwenden. Explizite
Randindizes unterscheiden sich von der normalisierten Eckgehrung.

Die Frage Berührung erlauben/verbieten wurde an den Nutzer gestellt und ist noch
offen. Empfehlung bleibt Nichtkontakt ohne zusätzlichen Zentimeterabstand.
Kein neues Laufzeitverhalten, weiterhin fensterlose T-Vorschau. Die Entscheidung
wird nicht aus einer allgemeinen PR-Freigabe als bestätigt abgeleitet.

Geprüft: Quellmodule, Randindizes und analytische Beispiele; Referenz-Netto bei
zwei freien 1x1-m-Fenstern ist 8,17056 m³. Dokumentlinks und diff --check geprüft.
Keine neuen Tests/Builds für die reine Dokumentation; letzter Code-Nachweis aus
PR128 bleibt 481 bestandene Tests, TypeScript/Build und Browserprüfung.

**Genau ein ausführbarer Folgeauftrag:** Nach dokumentierter Antwort die
Domain-Fensterprüfung gemäß docs/T_WINDOW_VALIDATION.md implementieren und an
die temporäre T-Vorschau anbinden. Freie/berührende/überlappende Fenster beider
Wände, Achslagen, Modellstandbindung und Nettovolumen prüfen. Keine Persistenz
oder automatische T-Verknüpfung. Bis zur Antwort keine Berührungsregel umsetzen.


## Aktueller Stand: Temporäre T-Anschlussvorschau — 06.10.2026

PR127 freigegeben und übernommen (fadbf33). feat/t-wall-preview ergänzt das
bestehende Diagnosefenster um den Anschlusstyp Rechtwinkliger T-Anschluss.
Ausgewählte Wand ist Hauptwand, zweite Wand/Endindex werden explizit gewählt.
Namen entsprechen dem Navigator; intern bleiben stabile IDs maßgeblich.
Application t-preview prüft Projektzugehörigkeit und lehnt Fenster sowie weitere
persistierte Anschlüsse an beiden Wänden zunächst verständlich ab. Domain liefert
Geometrie; bestehende Extrusion, Preview-Reducer und Renderer werden wiederverwendet.
Kein zusätzlicher Modellzustand, keine Dateiänderung, kein Commit/Undo-Schritt.
Auswahlwechsel leert die Vorschau; geänderter Modellstand macht sie ungültig.

481 Tests bestanden; TypeScript/Build erfolgreich, Lint 0 Fehler/6 bekannte
Fast-Refresh-Warnungen. Neue Tests: gemeinsamer Kontur-/Flächenpfad, Volumen,
unveränderte Fremdwände/Projekt, Abbruch/veralteter Stand, falsche/fehlende Ziele,
Fenster und bestehende Anschlüsse. Browser mit 6-m-Hauptwand und 3-m-Nebenwand:
T in 2D/3D sichtbar, 8,8906 m³ angezeigt; Endpunktwechsel entfernt Vorschau,
Anfang statt Ende zeigt verständlichen Fehler; Schließen geprüft.

Abnahme: zwei isolierte fensterlose Wände gleicher Stärke/Höhe; Nebenachse endet
rechtwinklig im Inneren der Hauptachse. Hauptwand auswählen -> Wandanschluss
vorschauen -> Rechtwinkliger T-Anschluss -> ankommende Wand und ihr Anschlussende
wählen -> Vorschau anzeigen. Es ist nur eine Diagnose, kein automatischer
Anschluss: Speichern und IFC exportieren weiterhin das unveränderte Modell.

**Genau ein ausführbarer Folgeauftrag:** Die Fensterregeln für T-Anschlüsse am
Beispiel beider Wände konkretisieren und die noch offene Nichtkontaktregel an
der Hauptwand mit dem Nutzer klären. Bestehende Öffnungsprüfung und erforderliche
Grenztests zuordnen; danach einen begrenzten Implementierungsauftrag festhalten.
Anker-/Hauptwandbewegung bleibt vor Persistenz gesondert zu entscheiden.
Text/Voice weiterhin als Adapter geprüfter gemeinsamer Aktionen berücksichtigen.


## Aktueller Stand: Reine T-Anschlussgeometrie — 06.10.2026

PR126 nach Freigabe übernommen (4dbca2a). Auf feat/t-wall-geometry ist der
geplante reine Domain-Helfer deriveRightAngleTJunction implementiert. Er erhält
zwei explizite Wandparameter/Endindex und liefert Hauptkontur, gekürzte
Nebenkontur und Kontaktsegment. Hauptwand-ID und alle Achsen bleiben unverändert.
Wiederverwendung von Wandkörper-, Schnittpunkt-, Toleranz- und Polygonfunktionen.
Noch keine Projektverknüpfung oder neue Bedienfunktion.

479 Tests bestanden; TypeScript und Build erfolgreich. Lint ohne Fehler mit
sechs bekannten Fast-Refresh-Warnungen. Vier neue Tests mit Varianten prüfen:
analytisches Volumen 8,89056 m³ einschließlich bestehender Extrusion, unveränderte
Eingaben/IDs, beide Anschlussseiten, drei Achslagen, Endpunktumkehr, Rotation,
Spiegelung, große Koordinaten, Kontakt ohne Überlappung und ungültige Maße,
Winkel, Achspunkte sowie zu kurze Wände und Endrandkontakte.

Grenze: ausschließlich isoliertes rechtwinkliges Paar gleicher Stärke/Höhe,
Bruttogeometrie ohne Fenster und ohne weitere Anschlüsse. Der spätere Aufrufer
muss diese Projektbedingungen prüfen. Kein T-IFC-Export oder T-Canvas-Abnahmetest
in dieser Etappe; vorhandene Produktabläufe sind unverändert. Automatisierter
Abnahmetest: src/domain/elements/wall/t-junction.test.ts ausführen. Schema bleibt 7.

**Genau ein ausführbarer Folgeauftrag:** Eine modellstandgebundene temporäre
Application-Vorschau für das isolierte T-Paar an das bestehende Diagnosefenster
anbinden. Ziele über stabile IDs und verständliche Wandnamen wählen; Wände mit
Fenstern oder weiteren Verbindungen zunächst ausdrücklich abweisen. Gemeinsame
Konturen für 2D/3D verwenden, Wechsel/Abbruch ohne Modellmutation. Keine
Persistenz oder automatischen T-Verbindungen, keine Entscheidung über
Hauptwandbewegung vorwegnehmen. Text/Voice folgen weiter den geprüften Aktionen.


## Aktueller Stand: T-Anschluss geplant — 06.10.2026

PR125 nach Nutzerfreigabe unverändert zusammengeführt (41f17ba). Der geprüfte
Stand umfasst 475 bestandene Tests und fünf unabhängig validierte IFC-Beispiele.
Dieser Folgeauftrag ändert ausschließlich Dokumentation, keine Modellfunktionen.

Siehe [T-Anschluss-Arbeitsentwurf](docs/T_WALL_CONNECTION_PLAN.md): aktuelles
Endpunktpaar-Schema, unveränderte Hauptwand, gekürzter Nebenkörper, Öffnungen,
Migration, Fangkontext, Undo sowie gemeinsame 2D/3D/IFC-Abnahmekriterien geprüft.
T-spezifischer Achsanker und Folgen einer Hauptwandänderung bleiben offen;
Vorschläge sind ausdrücklich von bestehenden Architekturregeln getrennt.

Korrektur der vorherigen Prioritätsnotiz auf Nutzerwunsch: Text/Sprache werden
weiterhin gemäß Protokoll an geprüfte Application-Aktionen angebunden, nicht
wegen der letzten Rückfrage generell vertagt. PR124 ist weiterhin separat offen.
Diese Freigabe bezog sich auf PR125; PR124 wurde nicht stillschweigend übernommen.

Prüfung dieser Etappe: Modulpfade und Vertragsgrenzen gegen Code abgeglichen,
relative Dokumentlinks geprüft, git diff --check ohne Fehler. Keine erneuten
Build-/Testläufe für reine Dokumentation; letzte Codeprüfung unverändert gültig.
Praktische Abnahme weiterhin: schräge Wandkette zeichnen, 2D/3D und Undo prüfen.
Der Entwurf selbst schaltet noch keine neue T-Funktion frei.

**Genau ein ausführbarer Folgeauftrag:** Reinen Domain-Geometriehelfer für ein
rechtwinkliges T aus zwei expliziten Wänden gleicher Stärke/Höhe entwickeln.
Hauptkontur unverändert, Nebenkontur bis zur zugewandten Körperfläche kürzen;
Kontaktsegment, analytisches Volumen, Achslagen und Grenzfälle testen. Zunächst
ohne Öffnungen/weitere Anschlüsse, Persistenz, UI oder automatische Verknüpfung.
Die offenen Anker-/Bewegungsregeln werden erst für die spätere Integration benötigt.


## Aktueller Stand: Schraege automatische Wandecken — 06.10.2026

Dieser Abschnitt ersetzt die historischen Folgeauftraege. Ausgangspunkt ist der
freigegebene Integrationsstand 1a1608b (PR123). PR124 mit Offset-Textadapter bleibt
separat offen und ist hier nicht enthalten. Sprache bleibt vorgemerkt; nach der
Rueckfrage des Nutzers wird zuerst die gemeinsame Wandgeometrie erweitert.

Zweig feat/oblique-wall-corners: Automatische Achsend-Anschluesse erlauben nun
auch spitze und stumpfe Ecken. Gemeinsame Domain-Gehrung statt Sondergeometrie
in UI/3D/IFC. Unterschiedliche Achslagen und umgekehrte Zeichenrichtungen sind
geprueft. Zu kurze/kollineare/numerisch entartete Anschluesse und Fensterkontakte
werden weiterhin atomar abgewiesen. Keine neuen Bedienelemente oder Dateifelder.
Das historische Diagnosefenster bleibt auf rechtwinklige Paare begrenzt.

Nachweis: 475 Tests bestanden; TypeScript und Build erfolgreich. Lint ohne Fehler,
sechs bekannte Fast-Refresh-Warnungen. Neue Tests: beidseitige schräge Gehrungen,
alle drei Achslagen, Endpunktumkehr, getrennte Konturen, analytische Volumina,
Fensterkollision, JSON, Undo/Redo und geschlossene dreieckige Wandkette.
IfcOpenShell 0.8.5 prueft fuenf normale Exporte: rechtes Eck, Rechteck,
45-/135-Grad-Richtungswechsel mit Fenstern und Dreieck; IFC4/EXPRESS, Beziehungen,
Profile, Platzierung und Netto-Wandvolumina bestanden.
Browser: Kette 3 m bei 0 Grad, danach 3 m bei 45 Grad, Enter zum Abschliessen;
Anschluss aktiv, ganze Kette per Undo/Redo und geschlossene 3D-Darstellung geprueft.
Die fruehere Archicad-Abnahme betrifft rechte Winkel; neue schräge IFC-Beispiele
sind unabhaengig validiert, aber noch nicht durch den Nutzer in Archicad geprueft.

Praktische Abnahme: Wandwerkzeug -> freien Startpunkt -> 3 m bei 0 Grad -> 3 m
bei 45 Grad -> Enter im Canvas. 2D/3D vergleichen, Undo/Redo, speichern/laden.
Optional die erzeugte oblique-45.ifc in Archicad pruefen.
Grenzen: gleiche Wandstaerke/Hoehe, zwei Achsenden; kein T-Anschluss oder
kollineares Fortsetzen. Bestehende Projektdateien behalten ihre Geometrie;
aeltere Programmstaende koennen neue schräge Anschluesse ablehnen.

**Genau ein ausfuehrbarer Folgeauftrag:** Den T-Anschluss als begrenzten
Planungsauftrag anhand der bestehenden Join-Struktur spezifizieren: Achsende an
Wandachse, ungeteilte durchlaufende Wand, Oeffnungsabstand, Loesen/Undo und
2D/3D/IFC-Nachweise. Offene Bedienentscheidungen kennzeichnen; erst danach
implementieren. Unterschiedliche Wandstaerken/Hoehen bleiben separat.


## Aktueller Stand: Offset fuer konvexe 2D-Konturen — 06.10.2026

Dieser Abschnitt ersetzt die folgenden historischen Folgeauftraege.
PR122 nach Freigabe in fix/reference-selection-lifecycle uebernommen (ccc7121).
Zweig feat/contour-offset: On-Demand-Aktion "Kontur versetzen (Offset)" fuer
Schraffuren und geschlossene Polylinien. Alle Seiten erhalten denselben Abstand;
positiv nach aussen, negativ nach innen. Mausprojektion, fixierter Ursprung,
Rasterengine und numerische Eingabe verwenden den gemeinsamen Interaktionspfad.
Gewaehlte Seite bestimmt die Normale; ohne Seitenwahl gilt die erste Seite.

470 Tests bestanden, TypeScript/Build erfolgreich, Lint 0 Fehler/6 bekannte
Warnungen. Tests: konstante Parallelabstaende, beide Umlaufrichtungen, grosse
Koordinaten, Innenoffset/Kollaps, konkave/gekreuzte Formen, spitzes Dreieck,
BIM-/offene-Linien-Ausschluss, feste IDs/Stile, veralteter Kontext, Dateirundlauf,
Vorschau, Abbruch und Undo/Redo fuer beide Elementarten. Browser: 2x2-m-Schraffur,
+0,5 m Vorschau/Commit, Undo/Redo, -0,5 m mit Dezimalkomma, Abbruch; -1 m wird
als Kollaps abgewiesen. Keine Dateiformataenderung, weiterhin Schema 7.

Grenzen: nur einfache konvexe Konturen; kein automatisches Entfernen kollabierter
Seiten, keine konkaven Offset-Ergebnisse, Kreise oder Kopie-Hotkeys. Ungueltige
Ziele werden abgewiesen und koennen korrigiert werden. Auswahl/Styles bleiben
beim Offset erhalten. Vorbereitung wird pro Sitzung wiederverwendet; die
vorhandene Domain-Snapshotvalidierung bleibt aktiv (kein Grossmodell-Benchmark).

Abnahme: Schraffur/geschlossenes Polygon auswaehlen -> Kontur versetzen (Offset)
-> 0,5 bzw. -0,5 m eingeben -> Uebernehmen -> Undo/Redo. An einem Rechteck muessen
alle vier Seiten denselben Abstand erhalten; ein zu grosser Innenwert darf
nicht uebernommen werden.

**Genau ein ausfuehrbarer Folgeauftrag:** Einen lokalen Textbefehl fuer den nun
geprueften 2D-Kontur-Offset an den bestehenden Copilot anbinden. Auswahl-ID und
Modellstand pinnen, Vorschau/Bestaetigung/Undo ueber denselben Application-Pfad;
keine separate AI-Geometrie. Konkave Formen, Kreise und Kopie-Hotkey bleiben
vorgemerkt. Sprachparser-Ausbau folgt erst nach geprueftem Textadapter.


## Aktueller Stand: Schraffur-Hintergrund und Kontur — 06.10.2026

Dieser Abschnitt ersetzt die folgenden historischen Folgeauftraege.
PR121 nach Freigabe in fix/reference-selection-lifecycle uebernommen (29512a4).
Zweig feat/hatch-appearance: Schraffureigenschaften bieten getrennt schaltbaren
Hintergrund und Kontur mit eigener Farbe. Hintergrund liegt hinter der bestehenden
Fuellung; 100 % Fuelldeckkraft verdeckt ihn. Kontur vorerst durchgezogen und
1 CSS-Pixel breit; Auswahlmarkierung und Trefferflaeche bleiben davon unabhaengig.
Keine neuen Linienobjekte, Linienarten oder Musterdefinitionen.

Schema 7 speichert beide Farben/Schalter explizit. V1–V6 werden streng validiert
und migriert; bei vorhandenen Schraffuren starten beide neuen Darstellungen aus,
damit alte Dateien unveraendert aussehen. Die gemeinsame Application-Aktion
uebernimmt Aenderungen mit einem Undo-Schritt; IFC bleibt unveraendert.

465 Tests bestanden; TypeScript/Build erfolgreich; Lint 0 Fehler/6 bekannte
Warnungen. Neue Tests: unabhaengige Farben/Schalter, Datei-Rundlauf, Undo/Redo,
IFC-Unveraendertheit, ungueltige/versteckte Farben, fehlende Pflichtfelder und
V4–V6-Migration mit strikter Ablehnung falsch versionierter neuer Attribute.
Browser: Rechteckschraffur gezeichnet; Hintergrund/Kontur aktiviert, Farben
geaendert, tatsaechliche SVG-Farben kontrolliert, Undo/Redo geprueft. Farbeingaben
reagieren jetzt auch auf input-Ereignisse (im Test gefundene Uebernahmeluecke).

Abnahme: Schraffur auswaehlen -> Hintergrund/Kontur einschalten -> Farben
waehlen -> Uebernehmen. Mit 35 % Deckkraft ist der Hintergrund sichtbar; mit
0 % bleibt nur Hintergrund/Kontur. Undo nimmt die Eigenschaften gemeinsam zurueck.
Neue Projektdateien benoetigen diesen Stand oder neuer; alte Versionen koennen
das neue Format nicht lesen. Aeltere Projektdateien bleiben importierbar.

**Genau ein ausfuehrbarer Folgeauftrag:** Gemeinsame Offset-Aktion fuer einfache
konvexe geschlossene 2D-Konturen (Schraffur/geschlossene Polylinie) als begrenzte
vertikale Etappe mit On-Demand-Menue, signiertem Abstand, Vorschau, Validierung
und Undo integrieren. Ungueltige/zusammenfallende oder konkave Ergebnisse zuerst
klar abweisen; keine stillen Reparaturen. BIM bleibt ausgeschlossen. Kreis-
Unterstuetzung, komplexe Konturen und Kopie-Hotkey bleiben vorgemerkt.

## Aktueller Stand: fortlaufende Wandkette — 06.10.2026

Dieser Abschnitt ersetzt die folgenden historischen Folgeauftraege.
PR120 nach Freigabe in fix/reference-selection-lifecycle uebernommen (e7921a3).
Neuer Zweig feat/wall-chain-drawing: Klicks ergaenzen einen geprueften Entwurf,
Doppelklick oder Enter im Canvas uebernimmt die gesamte Kette mit einem Commit.
Escape und Werkzeugwechsel verwerfen sie. Hilfseingabe/Tab, Fangursprung und
Pfadreferenzen verwenden weiterhin die gemeinsame ToolInteraction. Vorschau
und gespeichertes Modell bleiben getrennt; Speichern/IFC enthalten erst die
abgeschlossene Kette. Ungueltige Fortsetzungen lassen den bisherigen Entwurf
stehen. Modellwechsel verhindert die Uebernahme veralteter Entwuerfe.

462 Tests bestanden, TypeScript und Build erfolgreich, Lint 0 Fehler und die
6 bekannten Fast-Refresh-Warnungen. Neue Tests: Vier-Wand-Ring mit vier
Anschluessen, stabile IDs, ein Undo/Redo, Dateirundlauf, IFC-Profile, fehlerhafte
und veraltete Fortsetzungen sowie gemeinsame numerische Eingabe. Browser:
zwei Abschnitte numerisch setzen, Navigator/Undo vor Abschluss unveraendert,
Enter uebernimmt beide, Undo entfernt beide, Redo stellt sie wieder her, 3D
kontrolliert; Escape verwirft den naechsten Ursprung. Doppelklick verwendet
denselben vorhandenen Abschlussweg wie Polylinien; kein separater automatisierter
Browser-Doppelklicktest. Neue Archicad-Abnahme des Kettenexports steht aus.

Grenzen: Kettenanschluesse weiterhin rechtwinklig mit gleicher Hoehe/Staerke,
keine kollineare Unterteilung, T-Knoten oder beliebigen Winkel. Noch keine
Wandparameterwahl vor dem Zeichnen (0,36 m / 2,80 m, rechte Kantenachse).

Abnahme: Wandwerkzeug -> Ursprung -> mehrere rechtwinklige Abschnitte (Shift
oder Winkel/Laenge) -> Enter im Canvas. Ein Undo entfernt die gesamte Kette;
Redo stellt sie wieder her. Mit Escape einen weiteren Entwurf verwerfen.

**Genau ein ausfuehrbarer Folgeauftrag:** Den zurueckgestellten kleinen
Schraffur-Eigenschaftenschritt umsetzen: unabhaengige Hintergrundfarbe und
waehlbare Konturanzeige mit Linienfarbe. Gemeinsame validierte Application-
Aenderung, Eigenschaftenleiste, Dateikompatibilitaet und Undo/Redo verwenden.
Linienarten und Offset bleiben fuer spaeter vorgemerkt.

## Aktueller Stand: automatischer rechtwinkliger Wandanschluss — 05.10.2026

Dieser Abschnitt ersetzt alle folgenden historischen Folgeauftraege.
PR119 nach Freigabe normal in fix/reference-selection-lifecycle uebernommen
(fd8951c). Neuer Zweig: feat/automatic-wall-corners.

Neue oder bewegte Achsenden verbinden sich bei exakt gleichem Punkt ohne
zusaetzliche Menuebestaetigung. Erster Umfang: rechte Winkel, gleiche Hoehe und
Staerke. Automatische Beziehung in Schema 6; vorherige Dateien werden mit leerer
Anschlussliste geladen, ohne alte Koerper umzubauen. Beide Enden einer Wand
koennen angeschlossen sein; geschlossener Vier-Wand-Grundriss geprueft.
Grundriss, 3D, Fangkonturen und regulaerer IFC-Export verwenden dieselbe Geometrie.

Nutzerentscheidungen bestaetigt: Fenster duerfen den Anschlussabschluss nicht
beruehren; Einzelwand wegbewegen loest den Anschluss und stellt gerade Enden
wieder her. Bewegung und Anschlussaenderung ergeben einen Undo-Schritt.
Mehrfachknoten, falsche Winkel/Dimensionen oder Oeffnungskollisionen werden
abgewiesen; T-Kontakte und blosse Koerperueberlappung sind noch keine Anschluesse.
Keine gemeinsame automatische Hoehen-/Staerkenpropagation. Gemeinsame Ecke
als Gruppe bewegen bleibt separat; aktuelle Griffe bearbeiten die gewaehlte Wand.

458 Tests bestanden; TypeScript/Build erfolgreich; Lint 0 Fehler/6 bekannte
Warnungen. Browser: getrennte Waende um 1 m zusammenbewegen, Grundriss/3D mit
Fenstern, Undo/Redo, wegbewegen und Anschluss per Undo wiederherstellen.
IfcOpenShell 0.8.5 bestaetigt zwei regulaere Exporte (Ecke und geschlossener
Grundriss): IFC4/EXPRESS, Beziehungen, Platzierung und Nettovolumina bestanden.
Neue Archicad-Abnahme bleibt vom bereits bestaetigten expliziten Test getrennt.
Reproduktion: scripts/generate-automatic-corner-fixtures.mjs und
scripts/validate-ifc.py; siehe docs/AUTOMATIC_WALL_CONNECTIONS.md.

**Genau ein ausfuehrbarer Folgeauftrag:** Fortlaufendes Zeichnen einer Wandkette
ueber dieselbe Application-Erstellung und Fang-/Hilfseingabe integrieren. Nach
jedem gesetzten Abschnitt wird dessen Achsende der naechste Ursprung, ohne
erneuten Werkzeugstart. Nutzerentscheidung: Undo nimmt die gesamte Wandkette
zurueck. Daher ein gemeinsamer Commit bei Abschluss; Klicks davor bleiben
Vorschau. Abschluss/Abbruch mit den vorhandenen Werkzeugen abstimmen. Keine
zweite Anschlusslogik, keine T-Knoten oder beliebigen Winkel in dieser Etappe.

## Aktueller Stand: Wandachse als Bediengrundlage — 05.10.2026

Dieser Abschnitt ersetzt alle folgenden historischen Folgeauftraege. Der
Schraffur-Eigenschaftenschritt bleibt vorgemerkt. Neue Nutzerentscheidung:
Achsenden zusammenfuehren soll automatisch Wandkoerper verbinden; anschliessend
Waende wie eine Polylinie durchzeichnen. "Bewusst Ecke verbinden" ist ersetzt.

Umgesetzt: neue gezeichnete Waende mit rechter Kantenachse (Koerper links in
Zeichenrichtung), tuerkise Auswahlachse in 2D/3D, auswaehlbare Achse und eigene
Achsgriffe im Grundriss. Gemeinsame Bewegung/Rasterengine/Hilfseingabe bleiben.
Achslage rechte Kante/Mitte/linke Kante in Eigenschaften; neue Versatzwerte
maximal halbe Staerke. Staerkenwechsel erhaelt relative Achslage. Bestehende
Waende werden nicht verschoben; alte V5-Dateien mit Aussenachsen bleiben
unveraendert ladbar. Die Vorschau zeigt Wall-Nummern wie der Navigator.

451 Tests bestanden; TypeScript/Build erfolgreich; Lint 0 Fehler/6 bekannte
Warnungen. Browser: Kantenlage, Achsgriff -> Punkt frei bewegen -> 1 m bei 0 Grad
-> Wand von 3 auf 4 m -> Undo; Versatz 0,6 m abgewiesen; neue Wand mit
Kantenachse gezeichnet. Feste 130px-Eigenschaftenleiste bleibt erhalten.
Noch keine automatische Verbindung und kein Kettenzeichnen. PR119 wird mit
dieser Korrektur aktualisiert, nicht ungefragt zusammengefuehrt.

**Genau ein ausfuehrbarer Folgeauftrag:** Automatischen rechtwinkligen Anschluss
zweier gleich hoher/starker Waende beim exakten Zusammenfuehren ihrer Achsenden
in gemeinsame Erstell-/Bearbeitungsaktionen integrieren. Identische Domain-
Konturen fuer 2D/3D/IFC, Bindung/Speicherung und Undo/Redo pruefen. Ungueltige
Oeffnungskollisionen im bestehenden Vorschaupfad melden. Keine zusaetzliche
Menuebestaetigung. Achsendkontakt von T-Knoten, Koerperueberlappung und mehreren
Kandidaten unterscheiden. Offene Oeffnungsberuehrungs-/Loeseregeln vor den
betroffenen Commit-Regeln klaeren, nicht erfinden. Kettenzeichnen folgt danach.

## Aktueller Stand: gemeinsame Wandanschlussvorschau — 05.10.2026

Dieser Abschnitt ersetzt alle folgenden historischen Folgeauftraege.
PR #118 wurde nach Nutzerfreigabe normal in fix/reference-selection-lifecycle
gemergt (2b487df). Neuer Branch: feat/wall-corner-preview.

Eine ausgewaehlte Wand bietet unter Werkzeugeigenschaften die Aktion
"Wandanschluss vorschauen". Zweite Wand und beide Achsenden werden bewusst
gewaehlt. Die temporaere Vorschau zeigt Grundriss und 3D nebeneinander aus
denselben vorhandenen Domain-Konturen/Fensteroeffnungen. Originalkoerper werden
ersetzt, nicht ueberlagert. Keine Modellmutation, History oder neue Projektversion.
Escape/Schliessen verwirft; andere Wandenden loeschen das bisherige Ergebnis;
unpassende Paare und geaenderte Modellbindung werden abgewiesen.

Nachweis: 449 Tests bestanden; TypeScript und Build erfolgreich. ESLint:
0 Fehler, 6 bekannte Warnungen. Browser: zwei rechtwinklige 3-m-Waende mit
Fenstern in beiden Ansichten, unpassendes Achsende mit Fehlermeldung und Escape
zur unveraenderten Hauptansicht geprueft. Archicad-Abnahme des isolierten
Eckexports ist bereits vom Nutzer bestaetigt. Noch keine produktive Verbindung,
kein Anschluss-Commit und keine Aenderung am normalen IFC-Export.

Neue Nutzerwuensche bleiben erhalten in FUNCTION_REQUIREMENTS_2026-10-03.md:
Schraffur-Hintergrundfarbe, waehlbare Konturlinie mit eigener Farbe (Linienarten
spaeter), Offset geschlossener Polygone/Kreise und spaetere Kopie per Hotkey.
Offset-Abstand versus Skalierungsfaktor ist noch zu klaeren; BIM-Skalierung
bleibt ausgeschlossen. Offene Wandanschlussregeln wurden erneut angefragt.

**Genau ein ausfuehrbarer Folgeauftrag:** Schraffur-Konturdarstellung als kleinen
Eigenschaftenschritt umsetzen: optionale Konturlinie mit eigener Linienfarbe,
ueber gemeinsame validierte Application-Aktion, Eigenschaftenleiste, Undo/Redo
und Projektdatei mit Altdateikompatibilitaet. Bestehende Konturgriffe/Fangpunkte
bleiben unabhaengig von der sichtbaren Linie nutzbar. Keine Linienarten, keine
Offset-Geometrie und keine separate AI-Modelllogik in diesem Schritt.
Die dauerhafte Wandverbindung bleibt bis zur Klaerung ihrer Regeln vorgemerkt.

## Aktueller Stand: direkte Seitengriffe — 05.10.2026

Dieser Abschnitt ersetzt alle folgenden historischen Folgeauftraege.
Der Nutzer hat die Performancekorrektur praktisch bestaetigt und freigegeben.
PR #116 und #117 wurden normal in fix/reference-selection-lifecycle gemergt
(572c388 / 4bd900e). Neuer Branch: feat/direct-contour-grips.

Blaue Doppelpfeile geschlossener Polygonlinien und Schraffuren starten direkt
bestehendes Seitenstrecken: linke Taste halten, ziehen, loslassen. Anfassen des
innenliegenden Pfeils bewahrt den exakten Seitenmittelpunkt als Ursprung;
kein Sprung um den grafischen Pfeilversatz. Ein Klick ohne Ziehen oder Enter/
Leertaste startet die normale klick-/zahlenbasierte Streckaktion. Escape bricht ab.
Pointer Capture bleibt am SVG, auch wenn der Pfeil waehrend der Vorschau entfällt.
Fremde Zeiger werden ignoriert; Pointer-Abbruch/verlorene Capture sowie unpassende
Modell-/Sessionbindung verwerfen die Geste. Mouseup unterdrueckt den nachfolgenden
Click, damit kein zweiter Commit entsteht. Fang, Cap, numerische Eingabe und
Commit/Undo laufen durch bestehende gemeinsame Application-Aktionen.

Die Konturorientierung wird fuer die Pfeildarstellung einmal je Ring/Render
geprueft statt erneut pro Seite. Kein neues Bauteilmodell oder Dateiformat.
446 Tests bestanden; TypeScript/Build erfolgreich; Lint 0 Fehler/6 bekannte
Warnungen. Browserabnahme in separatem Testtab: Schraffur ziehen ohne Sprung,
ein Undo/Redo, geschlossene Polygonlinie ziehen und ein Undo, Enter-Start sowie
Klick-Start mit Hilfseingabe und Escape ohne Modellveraenderung. Automatische
Tests sichern Zeiger-ID, bildschirmbezogene 3px-Ziehschwelle und Ankerkorrektur.
Ein ueberlagerndes On-Demand-Menue kann einen Griff weiterhin verdecken; es bleibt
verschiebbar und ueber den Menuebutton schliessbar. Kein neuer Tastatur-Hotkey.

**Genau ein ausfuehrbarer Folgeauftrag:** Gemeinsame temporaere Anschlussvorschau
fuer ein bewusst ausgewaehltes rechtwinkliges Wandpaar in Grundriss und 3D.
Application haelt Auswahl/Vorschau, Renderer verwenden dieselben vorhandenen
Konturen und Flaechen. Normale Wandkoerper ersetzen statt doppelt anzeigen,
Fenster beibehalten, Modellwechsel pruefen und Escape unterstuetzen. Keine
Speicherung/History-Buchung oder produktive Verbindung, solange Regeln zu
Oeffnungsberuehrung und Endkappen nach dem Loesen nicht entschieden sind.
Der IFC-Testimport ist vom Nutzer bestaetigt.

## Aktueller Stand: Seitenstrecken beschleunigt — 05.10.2026

Dieser Abschnitt ersetzt alle folgenden historischen Folgeauftraege.
Auf ausdruecklichen Nutzerauftrag wurde die Performancekorrektur der Kontur-
begrenzung vor die Anschlussvorschau gezogen. Branch:
fix/contour-edge-preview-performance auf feat/corner-ifc-fixture (PR #116).
Keine Zusammenfuehrung von PR #116 in diesem Schritt.

prepareContourEdge validiert/kopiert die Ausgangskontur einmal pro Session.
Nur Kontakte der drei veraenderten Kanten werden erneut untersucht; dieselben
Praedikate wie bei der Vollpruefung, konservativer Rechteck-Vorfilter mit
Modell-Metertoleranz. Application teilt Vorbereitung und letztes Ergebnis zwischen
Fang, Zahleneingabe und Vorschau. Vollstaendige Kontur-/Projektvalidierung bleibt
in den bestehenden Vorschau- und Commit-Adaptern aktiv. Kein neues UI oder Schema.

Nachweis: 444 Tests bestanden, TypeScript/Build erfolgreich; Lint 0 Fehler und
6 bekannte Warnungen. 2.000 Validierungen und 120 Begrenzungen im lokalen
Vergleich exakt wie vor der Aenderung. 500-Punkte-Cap nun etwa 3,7-8,9 ms nach
Vorbereitung; gemessene Application-Vorschau 28-36 ms. Vorher bis zu 6,3 Sekunden
allein fuer den Cap. Kein Browser-FPS-Nachweis; grosse Projekte und Renderkosten
bleiben separat. Details, reproduzierbarer Benchmark und Abnahmeablauf:
docs/CONTOUR_EDGE_PERFORMANCE.md. Praktische Browserabnahme steht noch aus.

Der Nutzer bestaetigt am 05.10.2026 den erfolgreichen Archicad-Import des neuen
IFC-Eckmodells einschliesslich Fenster und rechtwinkligem Wandanschluss.
Diese konkrete Exportabnahme ist damit abgeschlossen. Regeln zur genauen
Oeffnungsberuehrung und zu Endkappen nach dem Loesen bleiben weiterhin offen.

**Historischer, nach Seitengriffen fortgefuehrter Folgeauftrag:** Die gemeinsame temporaere Anschluss-
vorschau fuer ein ausdruecklich ausgewaehltes rechtwinkliges Wandpaar in Grundriss
und 3D integrieren. Application haelt Selection/Preview; Renderer verwenden die
vorhandenen Konturen und polygonalen Flaechen derselben Ableitung. Beide normalen
Wandkoerper durch Vorschau ersetzen statt doppelt anzeigen, Fenster beibehalten,
Modellwechsel validieren und mit Escape abbrechen. Noch keine Speicherung,
History-Buchung oder produktive Aktion „Ecke verbinden“, solange die offenen
Anschlussregeln nicht entschieden sind. Tests fuer gemeinsame Ziele/Geometrie,
Abbruch und unzulaessige Paare; normale Werkzeuge und Export beibehalten.

## Aktueller Stand: IFC-Eckabnahme vorbereitet — 05.10.2026

Dieser Abschnitt ersetzt alle folgenden historischen Folgeauftraege.
PR #115 nach Nutzerfreigabe normal gemergt (ed2f92e). Entwicklungszweig:
feat/corner-ifc-fixture gegen fix/reference-selection-lifecycle.

Der gemeinsame STEP-Writer liegt jetzt in interop/ifc; der bestehende Einstieg
lib/bim/ifc.ts bleibt kompatibel. Ein separater Testadapter exportiert ein explizites
Wandpaar mit den lokalen Bruttokonturen derselben corner-solid-Ableitung.
Keine zweite Gehrungslogik, Modellkopie oder automatische Verbindung.
Oeffnungen bleiben echte IfcRelVoidsElement-Abzuege; IDs bleiben stabil.
Andere Waende und der regulaere UI-Export verwenden weiterhin Rechteckprofile.

Nachweis: 437 Tests, TypeScript/Build erfolgreich, Lint 0 Fehler/6 bekannte Warnungen.
IfcOpenShell 0.8.5 validierte 12 neue Eckfaelle und 8 bisherige Referenzfaelle
inklusive EXPRESS, Placement, Profilen, Beziehungen und Nettovolumen. Der normale
Beispielexport ist bytegleich zum Stand vor der Writer-Verlagerung. Vier neue
Tests sichern Identitaet, Snapshot-Isolation, gezielte Profilauswahl und Fehlerfaelle.
Generator/Abnahmeanleitung: docs/CORNER_IFC_ACCEPTANCE.md. Import dieses neuen
Modells in Archicad bleibt unbestaetigt und ist als praktische Abnahme offen.

Die Fragen zur exakten Oeffnungsberuehrung und zur Endkappe nach dem Loesen bleiben
offen. Eine allgemeine Freigabe ersetzt keine konkrete Antwort. Dieser Schritt
schaltet keine produktive Verbindung frei und veraendert keine Bedienablaeufe.

**Historischer, nach Performancekorrektur fortgefuehrter Folgeauftrag:** Eine gemeinsame temporaere Anschluss-
vorschau fuer ein ausdruecklich ausgewaehltes rechtwinkliges Wandpaar in Grundriss
und 3D integrieren. Selection/Preview in Application halten; Renderer konsumieren
die vorhandenen Konturen und polygonalen Flaechen derselben Ableitung. Vorschau
muss die beiden normalen Wandkoerper ersetzen statt doppelt anzeigen, Fenster
beibehalten, Modellwechsel validieren und per Escape abbrechen. Keine Speicherung,
History-Buchung oder verbindliche Aktion „Ecke verbinden“, solange die offenen
Anschlussregeln nicht entschieden und die Exportabnahme nicht dokumentiert sind.
Tests fuer gleiche Ziele/Geometrie in beiden Ansichten, Abbruch und unzulaessige
Paare; vorhandene normale Werkzeuge und Export beibehalten.

## Aktueller Stand: Eckkoerper mit Fensteroeffnungen abgeleitet — 05.10.2026

Dieser Abschnitt ersetzt alle folgenden historischen Folgeauftraege.
PR #114 nach Nutzerfreigabe normal gemergt (bae0024). Entwicklungszweig:
feat/corner-solid-geometry gegen fix/reference-selection-lifecycle.

geometry/solids/profile-openings.ts extrudiert ein konvexes Profil und zieht die
Vereinigung rechteckiger, durch die volle Staerke gehender Oeffnungen ab.
Interne Zellflaechen werden nicht ausgegeben; coplanare Aussenflaechen duerfen
unterteilt bleiben. Gemeinsame Schnittpunkte entstehen direkt aus Originalkanten,
damit benachbarte Zellen identische Eckkoordinaten verwenden. Jede gerichtete
Flaechenkante muss genau ein entgegengesetztes Gegenstueck besitzen; unregulaere
Oeffnungskontakte und numerisch nicht trennbare Grenzen werden abgewiesen.

domain/elements/wall/corner-solid.ts verwendet denselben validierten Projektstand,
Eckkonturen und Oeffnungsbefund. Liefert je Wand-ID Kontur, orientierte polygonale
Flaechen und Volumen sowie Gesamtvolumen des Paars. Nur contained-Oeffnungen sind
hier unterstuetzt; touching/outside liefern eine ausdrueckliche Meldung. Dies ist
keine neue Produktentscheidung zur Anschlusszulaessigkeit. Offene Regeln zu
Beruehrung und Endkappen beim Loesen bleiben offen; „Freigabe und go“ beantwortet
nicht die zuvor gestellten Auswahlfragen.

Nachweis: 433 Tests bestanden, TypeScript/Build erfolgreich; ESLint 0 Fehler und
6 bekannte Warnungen. Sieben neue Tests: neun Versatzfaelle, geschlossene Huelle,
unabhaengiges vorzeichenbehaftetes Mesh-Volumen, Fensterlaibungen, ueberlappende/
doppelte Oeffnungen, Drehung/Translation/Achsumkehr, unveraenderte andere Waende,
Kontakt-/Fehlermeldungen und Oeffnungen am Fuss/Kopf. git diff --check bestanden.
Keine neue UI-, Schema-, History-, Rendering- oder IFC-Anbindung. Keine sichtbare
Aenderung im Browser; praktische Anschlussabnahme bleibt nach Integration offen.

**Historischer, inzwischen umgesetzter Folgeauftrag:** Einen begrenzten IFC-Adapter fuer die
explizit gepruefte Eckgeometrie ergaenzen und die Exportgleichheit nachweisen.
Normgerechte Profil-/Oeffnungsrepraesentation anhand primaerer IFC-Dokumentation
pruefen; die bestehenden fachlichen Konturen und Oeffnungsparameter verwenden,
keine eigene Gehrungsberechnung. Zunaechst nur isolierter Exportpfad fuer benannte
Testpaare, keine automatische Verbindung und keine Umstellung des regulaeren
Projekt-Exports. Bestehender Export bleibt unveraendert. Tests fuer Placement,
Stabilitaet der IDs, Profile und reale Oeffnungen; kleines IFC-Abnahmemodell fuer
Archicad bereitstellen. Importerfolg muss separat bestaetigt werden. Erst danach
folgt die gemeinsame produktive Integration einschliesslich offener Bedienregeln.


## Aktueller Stand: Fensteroeffnungen an Eckkonturen geprueft — 05.10.2026

Dieser Abschnitt ersetzt alle folgenden historischen Folgeauftraege.
PR #113 nach Freigabe normal gemergt (2819867). Entwicklungszweig:
feat/corner-opening-check gegen fix/reference-selection-lifecycle.

inspectCornerOpenings validiert ein Projekt und leitet Eckkontur sowie volle
Oeffnungsgrundflaechen aus demselben Snapshot ab. Bericht je stabiler Fenster-/Wand-ID:
contained, touching oder outside sowie vorzeichenbehaftete Abstaende in Metern
zu jeder Begrenzung. Die seitlichen Durchbrueche gehoeren zur Fenstergeometrie;
sie zaehlen allein nicht als Endberuehrung. Gehrung und entferntes Wandende werden
getrennt ausgewiesen. Negative Abstaende bedeuten Ueberschreitung, innerhalb der
numerischen Modell-Metertoleranz wird touching gemeldet. Kein Mindestabstand.

Neue Dateien: domain/elements/wall/corner-openings.ts und dessen Tests sowie
geometry/projections/half-plane.ts. Keine Modellmutation, Sichtbarkeitsfilter,
Fensterueberlappungsregel, Verbindungsspeicherung oder UI-/IFC-Anbindung.
Andere Wandhosts werden nicht bewertet. Projektvalidierung bleibt vorgeschaltet;
ein ungueltiger Parameter ist kein normaler Kollisionsbefund.

Pruefung: 426 Tests bestanden, TypeScript und Build erfolgreich, ESLint 0 Fehler
und 6 bekannte Warnungen. Sechs neue Tests decken mittige Fenster, neun Offsetpaare
auf beiden Hosts, Beruehrung/kleinen Abstand/Ueberschreitung, entferntes Wandende,
Rotation/Spiegelung/Translation/Achsumkehr, Sichtbarkeit, Snapshotwechsel und
ungueltige Eingaben ab. git diff --check bestanden. Keine neue Browserfunktion;
praktische Abnahme der Anschlussbedienung bleibt bis zur Integration ausstehend.

Angefragte Produktentscheidungen fuer die spaetere Aktion: Beruehrung einer
Oeffnung an der Gehrung zulassen oder zunaechst abweisen; nach automatischem Loesen
wieder gerade Abschluesse oder Gehrungsform erhalten. Solange keine Antwort
vorliegt, bleiben dies offene Fragen, keine Zustimmung durch Schweigen.

**Historischer, inzwischen umgesetzter Folgeauftrag:** Die gemeinsame Ableitung von 3D-Flaechen
und Volumen aus den geprueften Anschlusskonturen ergaenzen, einschliesslich voll
enthaltener rechteckiger Fensteroeffnungen. Bestehende nicht verbundene Waende
unveraendert behandeln. Reine abgeleitete Geometrie ohne Schema-/UI-Freischaltung;
Abstand/Behandlung beruehrender Oeffnungen nicht eigenmaechtig entscheiden.
Nachweise: 2,80-m-Extrusion der neun Konturfaelle, geschlossene Aussenhuelle je
Wand-ID, keine internen Zellnaehte, Oeffnungsabzug nur einmal und gleiche Flaechen-
/Volumenwerte bei Richtungswechsel. Ergebnis muss spaeter fuer Renderer/Picking
und IFC aus derselben fachlichen Quelle verwendbar sein. Keine zweite Modellkopie.


## Aktueller Stand: reine Wand-Eckkonturen umgesetzt — 05.10.2026

Dieser Abschnitt ersetzt alle folgenden historischen Folgeauftraege.
PR #112 mit Nutzerfreigabe normal gemergt (b39ae9b). Implementierung auf
feat/wall-corner-contours gegen fix/reference-selection-lifecycle.

domain/elements/wall/corner.ts liefert fuer ein ausdruecklich angegebenes Paar
von Wand-ID/Endpunkt zwei Bruttokonturen mit Flaechen und gemeinsamer Gehrungsnaht.
Gleiche Staerke/Hoehe, kompatibler gemeinsamer Achsendpunkt, rechter Winkel und
|bodyOffset| <= halber Staerke sind erforderlich. Inputs bleiben unveraendert.
Lokale Berechnung verwendet wallBody, intersectLines, validateSimplePolygon und
bestehende Modell-Metertoleranzen; Rechtwinkligkeit hat eine separate dimensionslose
Skalarprodukt-Toleranz von 1e-10. Keine Nachbarsuche oder automatische Verbindung.
Konturen werden gegen entartete Flaechen und zu kurze Waende geprueft.

Nachweis: 420 Tests bestanden (11 neue Tests, darunter neun Tabellenfaelle und
216 Richtungs-/Rotations-/Spiegelungsvarianten). TypeScript und Build erfolgreich;
ESLint 0 Fehler/6 bestehende Warnungen; git diff --check bestanden.
Keine UI-, Projektformat-, History-, Rendering- oder IFC-Anbindung; Fenster sind
nicht Teil dieser Bruttokonturen. Keine neue sichtbare Funktion im Browser.
Praktische Abnahme aktuell anhand der dokumentierten Koordinaten und Testresultate,
nicht durch Aneinanderschieben zweier Waende in der Anwendung.

**Historischer, inzwischen umgesetzter Folgeauftrag:** Eine reine Domain-Pruefung der vorhandenen
Fensteroeffnungen gegen diese abgeleiteten Anschlusskonturen ergaenzen. Vollstaendige
Oeffnungsgrundflaeche mit Wandstaerke, bodyOffset und relativer Position aus denselben
Modellparametern ableiten; voll enthaltene Oeffnungen versus Schnitt mit der schraegen
Endbegrenzung nachvollziehbar melden. Keine pauschalen Randabstaende erfinden, keine
Fenster verschieben oder loeschen. Tests: mittiges Fenster, Kollision, Beruehrung,
beide Vorzeichen, umgekehrte Achsrichtung. Ergebnis ist ein geometrischer Befund;
die Produktentscheidung fuer Beruehrung/Endzonen und Anschlussbearbeitung bleibt
offen. Noch keine UI-Freischaltung oder persistenten Anschlussdaten.


## Aktueller Stand: Eckanschluesse mit Wandversatz geplant — 05.10.2026

Dieser Abschnitt ersetzt alle folgenden historischen Folgeauftraege.
PR #111 nach Nutzerfreigabe normal gemergt (39b5b81). Dokumentationszweig:
docs/wall-corner-offset-review, Basis fix/reference-selection-lifecycle.

[Wand-Eckanschlussentwurf](docs/WALL_CORNER_PLAN.md) mit Schema 5, gemeinsamer
Koerperableitung und korrigierten Einzelwand-Eckgriffen abgeglichen. Neun Beispiele
fuer Versatz 0 und +/-0,18 bei Staerke 0,36 beschreiben konkrete Gehrungskoordinaten
und Sollmengen. Rechenbeispiele mit bestehender Polygonvalidierung, Flaechenformeln
und getrennten Innenflaechen geprueft; Quellpfade und git diff --check geprueft.
Keine Laufzeitaenderung; bestehende 409 Tests/Build-Nachweise aus PR #111 unveraendert.

Verbindliche Nutzerantworten: bewusst „Ecke verbinden“; Einzelwandbewegung loest
Verbindung automatisch. Lösen und Bewegen als ein validierter Undo-Schritt planen.
Gemeinsame Eckbearbeitung, Endkappen beim Loesen und Oeffnungs-Endzonen bleiben
getrennte offene Fragen; keine automatische Verbindung allein durch Fang/Naehe.

**Historischer, inzwischen umgesetzter Folgeauftrag:** Reine fachliche Konturableitung fuer
zwei rechtwinklige Waende gleicher Staerke/Hoehe mit gemeinsamem Achsendpunkt
und |Offset| <= halber Staerke implementieren. Vorhandene Geometrie-/Validierungs-
funktionen verwenden. Keine UI-, Projektformat-, Renderer- oder IFC-Anbindung.
Tests mit den neun Tabellenfaellen, Rotation/Translation, Reihenfolge, umgekehrten
Achsen mit negierten Offsets und ungueltigen/zu kurzen Geometrien. Endpunktpaare
explizit uebergeben, keine automatische Nachbarsuche. Ergebnis nur abgeleitete
Konturen je stabiler Wand-ID; Eingaben unveraendert. Erst ein spaeterer gemeinsamer
Integrationsschritt darf diese Konturen produktiv anzeigen/exportieren.

Praktische Abnahme dieses Planungsschritts: Beispiele und Bedienentscheidungen
im verlinkten Dokument pruefen; in der Anwendung existiert noch kein Eckanschluss.


## Aktueller Stand: ausgewaehlte Wandachse in 3D — 05.10.2026

Dieser Abschnitt ersetzt alle darunterstehenden Folgeauftraege.
PR #110 nach Nutzerfreigabe normal gemergt (a8d25a3); Entwicklung auf
feat/selected-wall-axis-3d gegen fix/reference-selection-lifecycle.

BimSolidView leitet Koerper und Achse aus demselben validierten previewProject ab.
rendering/viewport/wall-axis.ts projiziert die start/end-Zeichenachse auf der
aktuellen Wandfussebene z=0 mit der bereits verwendeten Kamera. Das gestrichelte
SVG-Overlay ist absichtlich durch den Koerper sichtbar, hat 1,5 CSS-Pixel Breite
und faengt keine Eingaben ab. Nur die ausgewaehlte sichtbare Wand hat eine Achse;
Fensterauswahl, fehlendes Ziel, verborgene Ebene oder Grafikfehler blenden sie aus.
Kein Modell-/Dateiformat-/IFC-/Fangquellenwechsel.

Nachweis: 409 Tests bestanden, TypeScript und Build erfolgreich, ESLint 0 Fehler
und 6 bekannte Warnungen. Neue Tests pruefen beide Versatzrichtungen, Kamera/Zoom,
DPR, Sichtbarkeit/Auswahl sowie gemeinsame Vorschau, Abbruch, Commit und Undo/Redo.
Browser: Achse bei 0 und 0,6 m Versatz, Zoom, pointer-events:none, Fensterauswahl,
Ebene aus/ein und 3D-Screenshot geprueft. Nutzerprojekt nicht veraendert; separater
Testtab. Artefakt: outputs/selected-wall-axis-3d.png ausserhalb des Repositories.

Abnahme: Wand in 3D auswaehlen, Koerperversatz 0,6 eingeben und uebernehmen.
Gestrichelte Achse bleibt an der Zeichenposition. Zoom/Drehen und Ebene aus/ein
pruefen. Bei zentrierter Wand bleibt die Bezugsachse trotz Koerper sichtbar.

**Historischer, inzwischen abgeschlossener Folgeauftrag:** Den begrenzten Wand-Eckanschlussentwurf
in docs/WALL_CORNER_PLAN.md gegen den jetzt implementierten Koerperversatz pruefen.
Fuer zwei rechtwinklige gerade Waende gleicher Staerke konkrete Anschlussbeispiele
mit Versatz 0 und +/- halber Staerke beschreiben; offene Nutzerentscheidungen zu
expliziter/automatischer Verbindung und gemeinsamem Bearbeiten klar vorlegen.
Zunaechst Planung und Abnahmekriterien, keine implizite automatische Verbindung,
T-Verbindung, Materialprioritaet oder unabgestimmte Modellmutation implementieren.


## Aktueller Stand: Wandkoerperversatz umgesetzt — 05.10.2026

Diese Sektion ersetzt die historischen Folgeauftraege weiter unten.
PR #109 wurde nach Freigabe normal in fix/reference-selection-lifecycle gemergt
(f916428). Umsetzung auf feat/wall-body-offset; main bleibt unveraendert.

Wand.bodyOffset ist ein vorzeichenbehafteter Meterwert, positiv links in Richtung
start nach end. Die Zeichenachse bleibt beim Versetzen fest; Koerper und Fenster
folgen gemeinsam. domain/elements/wall/body.ts liefert die gemeinsame Ableitung
fuer Grundriss, 3D, Bounds, Fangquellen, Eckgriffe, Fensteranker und IFC.
application/walls/body-offset.ts prueft Snapshot, Auswahl und Ziel-ID, erzeugt eine
verwerfbare Vorschau und uebernimmt einen History-Schritt. Die Eigenschaftenleiste
haelt den Entwurf bis „Versatz uebernehmen“ lokal; „Verwerfen“ setzt ihn zurueck.
Es gibt noch keine laufende grafische Vorschau waehrend der Texteingabe.

Projektformat 5 verlangt bodyOffset; alte Versionen werden strikt validiert und
mit Versatz 0 migriert. Keine automatische Eck-/T-Verbindung, Versatz-Ziehfunktion,
Preset-Auswahl oder neue Voice-Grammatik. Text/Voice/AI sollen dieselbe Aktion mit
stabiler Ziel-ID und Snapshot nutzen.

Nachweis: 407 Tests bestanden, TypeScript und Produktionsbuild erfolgreich.
Neue Tests decken Vorzeichen/Orientierungen, feste Achse, Fenster, Fangquellen,
Solidkoordinaten, Eckgriffbearbeitung, Sichtbarkeit, ungueltige Werte/Overflow,
veralteten Kontext, atomaren Commit/Undo/Redo, Migration/JSON und IFC ab.
Browser: +/-0,18 m, unveraenderte Achse und mitbewegtes Fenster im Plan,
Verwerfen/Fehlermeldung, Undo/Redo und 3D mit Oeffnung geprueft.
Screenshots: outputs/wall-body-offset-plan.png und outputs/wall-body-offset-3d.png
(lokale Artefakte ausserhalb des Repositories).
Ein neuer Archicad-Import des versetzten Modells bleibt praktische Nutzerabnahme.

Abnahme: Wand auswaehlen, Koerperversatz 0,18 eingeben, uebernehmen. Bei 0,36 m
Staerke liegt eine Wandseite auf der festen Achse; Fenster folgt. -0,18 verschiebt
zur anderen Seite. Undo/Redo, speichern/laden und IFC-Import ausprobieren.

**Historischer, inzwischen umgesetzter Folgeauftrag:** Die ausgewaehlte sichtbare Wandachse
auch in 3D als dezente, bildschirmbezogene Linie darstellen. Vorhandene start/end
auf Geschosshoehe aus dem aktuellen validierten Vorschau-/Anzeigesnapshot
ableiten; keine zweite Geometriequelle, Modellmutation oder neue Fangquelle.
Auswahlwechsel, ausgeblendete Ebene, Versatz, Kamera/Zoom, Vorschau/Abbruch und
Undo/Redo pruefen. Achse darf weder Picking noch Eckgriffe blockieren. Damit ist
die feste Bezugsachse auch bei versetztem Koerper im Raum nachvollziehbar.
Anschlussregeln bleiben separat offen (docs/WALL_CORNER_PLAN.md).

## Bedienkorrektur: Referenzen beim Zoomen erhalten — 03.10.2026

Aktive Hilfspunkte einschließlich konstruierter Schnittpunkte und ihre Richtungsführungen bleiben bei Kamera-/Zoomänderungen erhalten. Auch das Verlassen der Zeichenfläche zum Bedienen der Zoomtasten löscht sie nicht. Die Referenzen bleiben in Modellkoordinaten; Fangabstand und Ringdarstellung werden weiterhin aus dem aktuellen Bildschirmmaßstab berechnet. Eine laufende Hover-Verweildauer wird bei Navigation abgebrochen und beginnt beim nächsten Besuch neu. Escape, Ausschalten des Fangens und ein geänderter Modell-/Bearbeitungskontext verwerfen weiterhin die Referenzen. Keine Modellaktion oder Änderung an History, JSON oder IFC.

Nachweis: 187 Tests bestanden, TypeScript und Produktionsbuild erfolgreich; ESLint 0 Fehler und 6 bekannte Warnungen. Zwei neue Regressionstests prüfen Sitzungsidentität über Zoomstufen, explizite Invalidierung sowie unterbrochene Verweildauer ohne Verlust aktiver Punkte oder unbeabsichtigtes Umschalten. Browser: Referenzen (0;0), (3;0) und konstruierter Schnitt (1,5;1,5) bleiben mit drei Führungen beim Hinein-/Herauszoomen unverändert; Undo bleibt leer. Escape entfernt anschließend alle Referenzen und Führungen.

Praktische Abnahme: Punktfang einschalten, zwei Punkte jeweils 0,6 s anhovern und daraus einen Schnittpunkt aktivieren. Mit Mausrad oder Plus/Minus zoomen: Markierungen müssen erhalten bleiben. Escape löst sie gezielt. Dieser Nachtrag ersetzt frühere Protokollaussagen, nach denen Zoom Referenzen verwirft. Die Korrektur ergänzt PR #36; Nutzerfreigabe für PR #35/#36 gilt nach erfolgreicher Prüfung. Der einzige nächste Entwicklungsauftrag bleibt der unten beschriebene Schnitt externer Hilflinien mit festen Direct-Edit-Achsen.

## Bedienkorrektur: Hover 600 ms und Referenzen lösen — 03.10.2026

Nutzerkorrektur zu N08/Guide-F14: Standard-Verweildauer jetzt zentral 600 ms, sowohl im Workspace als auch im BimPlan-Fallback. Die vorhandene Einstellung bleibt verfügbar und gilt symmetrisch für Aktivieren und Lösen. Historische 400-ms-Angaben beschreiben frühere Stände.

Ein erneuter Besuch einer bereits aktiven Referenz entfernt nur diese nach vollständiger Verweildauer. Ein Besuch schaltet höchstens einmal: kontinuierliches Hover oder kleine Bewegungen innerhalb desselben Fangpunkts aktivieren/entfernen nicht wiederholt. Erst Verlassen des Punktes oder Wechsel auf eine andere Quelle ermöglicht einen neuen Vorgang. Unterbrochene Verweildauer beginnt neu; andere Referenzen und ihre Aktivierungsreihenfolge bleiben erhalten. Gelöste Punkte erzeugen keine temporären Führungen mehr; normaler Endpunktfang bleibt möglich. Kein History-/Projektdateieintrag für Hover.

Geändert: constraints/inference/hover-reference.ts, Standardwerte in CadWorkspace/BimPlan, Regressionstests und dieses Protokoll. 158 Tests bestanden, TypeScript/Build erfolgreich; ESLint null Fehler/sechs bekannte Warnungen. Tests: vor 600 ms kein Umschalten, genau einmal bei Erreichen, dauerhaftes Hover, Unterbrechung, Wiederaktivierung und Erhalt anderer Referenzen. Browser: Standard 0,6 s sichtbar; Ring aktiviert, durch erneuten Besuch gelöst, bei weiterem Hover weiter gelöst.

Abnahme: Snap einschalten, Punkt 0,6 s anhovern → silbergrauer Ring. Zeiger weg und wieder 0,6 s darüber → Ring weg. Dort verbleiben → bleibt gelöst. Nach erneutem Verlassen wieder aktivierbar. In einer bereits offenen Sitzung kann die bisherige Zeiteinstellung erhalten bleiben; im Linienwerkzeug auf 0,6 s stellen, ohne das Projekt neu zu laden.

Dieser frühere Folgeauftrag wurde durch die unten dokumentierte Nutzerpräzisierung auf mausgeführte 45°-Schnittpunkte eingegrenzt und umgesetzt.

## Aktiver Planungsstand — Funktionsumfang 03.10.2026

Der Nutzerentwurf [Funktionsarchitektur](NOVIKOV_FUNKTIONSARCHITEKTUR_2026-10-03.md) erweitert den bisherigen Guide. [FUNCTION_REQUIREMENTS_2026-10-03.md](FUNCTION_REQUIREMENTS_2026-10-03.md) ordnet alle N01–N60 dem Code, alten Anforderungen und Abhängigkeiten zu. ARCHITECTURE.md §29–30 dokumentiert die begrenzten verbindlichen Ergänzungen; weitere Datenfelder/Typdiagramme bleiben Vorschläge. Die PDF selbst wurde nicht separat gelesen. Bisherige Guide-F01–F29 und Gesprächswünsche bleiben erhalten.

Geprüfter Code: 3bbe2dd auf feat/direct-edit-shared-snap, zwei Commits seit Review-main dd3e358. Numerische Fangtoleranz (ef3241d, PR #27) und gemeinsame Direct-Edit-Fangauflösung (3bbe2dd, PR #28) sind umgesetzt und brauchen keinen erneuten Implementierungsauftrag. 149 Tests im Dokumentationsauftrag erneut bestanden. Keine Quellcodeänderung, neue Bauteile, Dateimigration, PDF-Zerlegung oder Layoutimplementierung. Frühere Build-/Lint-/Browsernachweise bleiben als solche datiert erhalten.

**Dieser Abschnitt ist die einzige aktive Auftragsreihenfolge.** Sämtliche darunterstehenden „nächster Schritt“-Formulierungen und Auftragslisten sind historische Protokolle ihrer jeweiligen Stände, keine zusätzlichen aktuellen Folgeaufträge. Die Pakete A–L des Entwurfs und die N-Matrix sind Backlog und Abhängigkeiten.

### Abschluss: gemeinsame Fang-Kandidaten und Rangfolge — 03.10.2026

PR #29 wurde mit Nutzerfreigabe als normaler Merge 655c5f1 in feat/direct-edit-shared-snap übernommen. PR #27/#28 bleiben offen; main wurde nicht geändert. Dieser Funktionsschritt basiert auf dem freigegebenen Dokumentationsstand.

constraints/snapping/candidates.ts erzeugt Endpunkte, Richtungsführungen und vorhandene HV-Schnittpunkte ohne rekursive querySnap-Abfragen. Aktive Referenzen werden einmal gegen den aktuellen Quellenstand exakt validiert und dedupliziert. Eine nichtleere activeReferences-Liste ist maßgeblich; activeReference bleibt der Legacy-Fallback ohne Liste. Modelladapter und öffentliche querySnap-Signatur bleiben unverändert. Raster bleibt der bisherige Fallback; explizites Shift wird vor automatischen Kandidaten aufgelöst.

ranking.ts definiert die technische Rangentscheidung: Priorität → Bildschirmabstand → neueste Aktivierung (bei Schnittpunkten beide Aktivierungsränge absteigend) → vollständige geordnete Quellen-Tupel → Fangart → projizierte X-/Y-Koordinaten → Winkel. Artgleichstände: Verlängerung vor Lotrecht vor Horizontal vor Vertikal vor Winkel. Zeichenketten werden ohne Locale verglichen. Bei ansonsten identischen Ergebnissen ist die Reihenfolge ohne fachliche Bedeutung.

Bewusste Änderungen bei Gleichstand: neu aktivierte Quelle gewinnt statt impliziter Erzeugungsfolge bzw. bisherigem sourceFeature.localeCompare. Endpunkte berücksichtigen ebenfalls Aktivierung vor Quellen-ID. Richtungsreihenfolge im Modelladapter entscheidet nicht mehr über gleichwertige Richtungen. Höherer Vorrang und geringerer Abstand gewinnen weiterhin vor Aktualität. Schnittpunkte behalten beide Herkunftspositionen; intern werden beide Quellen getrennt verglichen statt verkettete Strings als Identität zu benutzen.

Prüfung: 156 Tests bestanden, darunter sieben neue Tests. Drei neue Regressionsfälle schlugen am alten Stand fehl (neuere Guide-Quelle, Endpunkt-Aktivierung und beide Schnittpunktquellen). Weitere Fälle prüfen Duplikate/stale Quellen, vollständige Identität trotz Trennzeichen, Richtungsreihenfolge und Priorität/Abstand bei 25/100/400 px/m. Bestehende Toleranz-, Direct-Edit-, JSON-/History-, Voice-/Stale-Context- und IFC-Tests bleiben grün. TypeScript und Build erfolgreich, ESLint null Fehler/sechs bekannte React-Refresh-Warnungen. Keine UI-, Modell- oder Dateiformatänderung, keine Leistungszusage.

Browser: Zwei Wandachsenden in Reihenfolge aktiviert; beim Linienzeichnen und freien Linienbewegen stammt die Verlängerung vom neueren Punkt. Vorschau/Commit identisch, Undo/Redo geprüft. Wechsel von rund 105 auf 50 px/m verwirft Referenzen, exakter Endpunkt wird innerhalb von 10 CSS-Pixeln erkannt; Escape verwirft die Bearbeitung. Screenshot lokal: outputs/snap-ranking-direct-edit.png.

Abnahme: Snap einschalten, zwei Endpunkte derselben horizontalen Wand nacheinander je 0,4 s anhovern. Weiter entlang der gemeinsamen Flucht zeigen: Die Hilfslinie beginnt am zuletzt aktivierten Punkt. Beim Linienzeichnen und im Menü „Element frei bewegen“ wiederholen, bestätigen und Undo/Redo prüfen.

### Abschluss: mausgeführte 45°-Hilfslinien und konstruierte Referenzen — 03.10.2026

Die Nutzerpräzisierung ersetzt den zuvor breiter geplanten Geradenschnitt-Auftrag: Von jedem aktiven Hilfspunkt wird die zur Maus nächstgelegene 45°-Schrittrichtung angezeigt, silbergrau gestrichelt und über die Mausprojektion hinaus verlängert. Nichtparallele Führungen bilden innerhalb von 10 CSS-Pixeln einen Schnittpunktkandidaten. Nach standardmäßig 600 ms wird dieser als zusätzlicher Hilfspunkt aktiviert, erzeugt selbst Führungen und lässt sich bei erneutem Besuch nach derselben Verweildauer lösen. Der Ablauf funktioniert auch ohne Zeichenwerkzeug. Echte Endpunkte behalten Vorrang; explizites Shift/Ortho und die gemeinsame Kandidatenrangfolge bleiben erhalten.

Gemeinsame Mathematik in geometry/intersections/lines.ts mit dimensionsloser Paralleltoleranz in geometry/tolerances/direction.ts; Richtungswahl in constraints/guides/directions.ts; temporäre Konstruktion und exakte Quellenprüfung in constraints/inference/construction-reference.ts. BimPlan zeichnet nur abgeleitete Führungen; useHoverReference liefert Maus/Zeit. Linie, Wand und Direct Edit verwenden weiterhin querySnap. Konstruierte Referenzen speichern ihre ursprünglichen Modellquellen flach, sodass verkettete Hilfspunkte keine rekursiven Modellkopien bilden. Verschobene/entfernte Quellen werden verworfen. Keine neue Modellaktion, keine Dateimigration oder separate AI-Logik.

Prüfung: 164 Tests bestanden, darunter sechs neue Fälle zu schrägem Schnitt, parallelen/kollinearen/ungültigen Richtungen, nächster 45°-Richtung, 25/100/400 px/m, Prioritäten und Constraints, 599/600-ms-Aktivierung/Lösen, verketteten/veralteten Quellen sowie Zeichnen mit genau einem Undo-Schritt und JSON-Rundlauf ohne Hilfspunkte. TypeScript und Build erfolgreich, ESLint null Fehler/sechs bekannte React-Refresh-Warnungen. Browser: zwei Wandachsenden aktiviert, diagonaler Schnitt als dritter Ring markiert, weitere Führung vom neuen Punkt, erneutes Lösen geprüft. Linie beginnt exakt bei (1,5 m; 1,5 m); Undo entfernt, Redo stellt sie wieder her. Screenshot: outputs/guide-intersection-hover.png.

Abnahme: Snap einschalten. Bei einer horizontalen 3-m-Wand beide Achsenden nacheinander je 0,6 s anhovern. Zeiger etwa 1,5 m oberhalb der Wandmitte halten: zwei diagonale Führungen kreuzen sich, danach erscheint der dritte Referenzring. Wegbewegen und neue Führungen vom Hilfspunkt prüfen; zurückkehren und 0,6 s warten löst ihn. Dasselbe beim Linienzeichnen testen und Linie mit Undo/Redo prüfen.

Grenzen: weiterhin höchstens vier aktive temporäre Referenzen; keine dauerhaften Punktbauteile, kein History-/Projektdateieintrag für Hover. Verlassen der Zeichenfläche, Kamera-/Modell-/Sitzungswechsel verwerfen Referenzen wie bisher. Beliebig schräge Verlängerung/Lot-Schnittpunkte, echte Segmentschnitt- und Mittelpunktfangarten sowie aktive 3D-Arbeitsebenen bleiben Backlog; bestehende einzelne Verlängerungs-/Lotführungen bleiben verfügbar. Kein Anspruch auf vollständige Guide-F14-Umsetzung.

### Abschluss: stabile Richtungswechsel der 45°-Hilfslinien — 03.10.2026

PR #32 wurde mit ausdrücklicher Nutzerfreigabe als normaler Merge 8770895 in seinen bisherigen Zielzweig feat/hover-reference-toggle übernommen. main bleibt unverändert. Dieser Folgeschritt baut auf diesem Merge auf.

constraints/guides/directions.ts führt eine reine Zustandsfortschreibung je aktiver Quelle ein. Vorläufiger technischer Bedienwert: 5° Hysterese zusätzlich zur halben 45°-Stufe. Eine horizontale Führung wechselt somit erst über 27,5° nach diagonal; zurück wechselt sie unter 17,5°. Die Winkelberechnung behandelt den Übergang 360°/0° korrekt; direkt auf dem Referenzpunkt bleibt die Richtung erhalten. Quellenidentität umfasst ID, Feature und exakte Position; entfernte Quellen verlieren ihren Richtungsverlauf.

useHoverReference hält den flüchtigen Verlauf im vorhandenen Ansichtskontext. Escape/Verlassen, Snap aus, Kamera-/Modell-/Sitzungswechsel verwerfen ihn zusammen mit den Referenzen. BimPlan-Darstellung, Hover-Schnittpunkterwerb und querySnap erhalten dieselben Richtungsdaten; Direct Edit reicht den gemeinsamen Kontext durch. Die Stabilisierung betrifft die mausgeführten 45°-Hilfslinien und ihre Schnittpunkte, nicht die explizite Shift-Richtung oder die Rangfolge sonstiger Fangarten. Keine Modell-, History-, IFC- oder Dateiformatänderung.

Prüfung: 168 Tests bestanden (vier neue Fälle: alle acht Winkelgrenzen mit Hin-/Rückweg, getrennte Quellen und Identitätswechsel, Anzeige/Schnittpunkt/Radius/Shift/Ortho sowie Direct-Edit-Commit/Undo/Redo/JSON). TypeScript und Build erfolgreich; ESLint null Fehler/sechs bekannte React-Refresh-Warnungen. Browser beim Linienzeichnen und freien Linienbewegen: 20° → 24° bleibt horizontal, 28° wechselt auf 45°; Rückweg über 22° bleibt diagonal, 17° schaltet zurück. Zwei Referenzen erzeugen weiterhin den nach 600 ms erworbenen dritten Hilfspunkt. Freie Linienbewegung auf (1,5; 1,5) bestätigt, Undo/Redo geprüft. Escape, Modell-Commit, Kamerawechsel und Snap aus räumen Führungen auf. Screenshot: outputs/guide-hysteresis-direct-edit.png.

Praktische Abnahme: Wandachsende 0,6 s aktivieren; Zeiger zunächst ungefähr 20° oberhalb der Horizontalen halten und langsam über 22,5° bewegen. Kleine Bewegungen sollen die Führung nicht umschalten; erst ungefähr 28° bewirken den Wechsel. Zurück unter ungefähr 17° wechseln. Beim freien Bewegen einer Linie mit externem Wandpunkt wiederholen und per Escape abbrechen. Der 5°-Startwert kann nach Bedienfeedback angepasst werden; keine behauptete vollständige Hysterese für sämtliche Fangarten.

### Abschluss: gemeinsamer Mittelpunktfang — 03.10.2026

Aufbauend auf PR #33 / 3fad40a; PR #33 bleibt offen und wurde durch den Fortsetzungsauftrag nicht automatisch zusammengeführt. Neue Implementierung auf feat/shared-midpoint-snap.

Geometrie berechnet den Mittelpunkt eines endlichen, nicht entarteten Segments. Der gemeinsame Projektadapter liefert einen Mittelpunkt je Wandachse und je vorhandenem Linien-/Polyliniensegment; keine künstliche Schließkante und keine zusätzlichen Wandflächen-Mittelpunkte. Identität: stabile Element-ID plus Segmentbezeichnung und Endpunkt-Snapshot. Damit wird auch eine Drehung oder Streckung um denselben Mittelpunkt als veränderte Quelle erkannt. Diese Referenzen sind abgeleitet und nicht im Projekt gespeichert.

SnapCandidate kennt jetzt midpoint. Explizite Rangregel: Endpunkt (0) vor Mittelpunkt (0,25) vor Hilflinienschnitt (0,5), dann einzelne Führungen und Raster. Innerhalb einer Fangart gelten weiterhin Abstand, Aktivierungsreihenfolge und deterministische Quellenordnung. Der Radius bleibt 10 CSS-Pixel; bei sehr kurzen Segmenten kann ein naher Endpunkt den Mittelpunkt überstimmen, bis ausreichend hineingezoomt wird. Shift/Ortho und explizite Editachsen behalten Vorrang.

Die gemeinsame Hover-Verwaltung aktiviert und löst Mittelpunkte nach derselben eingestellten Zeit, standardmäßig 600 ms. Sie liefern Verlängerungs-, Lot- und mausgeführte 45°-Hilfslinien samt Schnittpunkten. BimPlan kennzeichnet Mittelpunktfang mit ungefülltem Dreieck und Beschriftung; der aktive Referenzring bleibt erhalten. Keine zusätzliche Werkzeuglogik, Modellaktion, Dateimigration oder AI-Modelllogik. Eigene Elemente und Fensterhosts bleiben im Direct Edit ausgeschlossen.

Nachweise: 173 Tests bestanden, darunter fünf neue Gruppen in constraints/snapping/midpoint.test.ts (Geometrie/ungültige Werte, Adapter/Segmentidentität, Zoom/Priorität/Constraints, Hover/Guides, Zeichnen/Direct Edit/Undo/JSON). Zwei bestehende Adapter-Anzahltests wurden um die zusätzlichen Mittelpunkte aktualisiert. TypeScript und Build erfolgreich; ESLint null Fehler/sechs bekannte React-Refresh-Warnungen. Browser: Marker ohne Zeichenwerkzeug, 600-ms-Aktivierung, Lotführung und erneutes Lösen; Linie beginnt exakt bei (1,5; 0) an der 3-m-Wand, Undo/Redo geprüft. Freie Linienbewegung fängt externen Wandmittelpunkt und lässt sich rückgängig machen/wiederherstellen. Screenshot: outputs/midpoint-hover.png.

Abnahme: Snap aktivieren und die Mitte der Wandachse oder eines Liniensegments anfahren. Dreieck/Mittelpunkt prüfen; 0,6 s verweilen, dann seitlich wegbewegen und Hilfslinie beobachten. Zurückkehren und 0,6 s warten löst die Referenz. Eine Linie dort beginnen oder eine andere Linie über das On-Demand-Menü dorthin bewegen; Undo/Redo prüfen. Bei kurzen Linien hineinzoomen, falls der Endpunkt Vorrang erhält.

### Abschluss: echte Segmentschnittpunkte — 03.10.2026

PR #34 wurde mit ausdrücklicher Nutzerfreigabe als normaler Merge 96c33de in seinen bisherigen Zielzweig feat/guide-direction-hysteresis übernommen. main bleibt unverändert. Der neue Schritt baut auf diesem Merge auf.

geometry/intersections/segments.ts prüft eindeutige Schnitte innerhalb beider endlicher Segmente mit der zentralen numerischen Toleranz. Degenerierte/nichtendliche Strecken, bloße Geradenverlängerungen und Überlappungen erzeugen keinen Fangpunkt; eindeutige Endberührungen bleiben möglich. constraints/snapping/segment-references.ts bildet Quellenpaare deterministisch. Der Projektadapter stellt Wandachsen und vorhandene Linien-/Polyliniensegmente bereit, einschließlich Selbstkreuzungen einer Polylinie. Keine Wandflächenverschneidung oder Änderung des BIM-Modells.

Beide Segmentquellen bleiben als exakte Geometrie-Snapshots erhalten. Das erlaubt Invalidierung nach Verschieben/Drehen/Strecken sowie Ausschluss jeder Kreuzung, an der ein bearbeitetes Element oder dessen Fensterhost beteiligt ist. Ableitung erfolgt bei verändertem Modell über den bestehenden memoisierten Adapter, nicht pro Mausbewegung. Aktuell paarweiser Vergleich O(n²), noch kein räumlicher Index oder Leistungsnachweis für Großprojekte.

Neue Fangart segment-intersection mit Beschriftung „Segmentschnittpunkt“, getrennt vom temporären Hilflinienschnitt. Rangfolge: Endpunkt 0, Mittelpunkt 0,25, Segmentschnitt 0,375, Hilflinienschnitt 0,5, einzelne Führungen und Raster. 10 CSS-Pixel, Shift/Ortho und Editachsen behalten ihren Vertrag. Der gleiche Punkt kann nach 600 ms als Hilfsreferenz aktiviert und bei erneutem Besuch gelöst werden; alle Verbraucher nutzen weiterhin querySnap. Projektformat, History und IFC unverändert.

Nachweise: 180 Tests bestanden, darunter sieben neue Gruppen zu endlichen/überlappenden/entarteten Segmenten, kurzen und schrägen Kreuzungen, Endkontakt, Polylinien-Selbstkreuzung, deterministischen Quellen, Zoom/Priorität/Constraints, 600-ms-Hover, beidseitigen Edit-/Host-Ausschlüssen sowie Zeichnen/Preview/Commit/Undo/Redo/JSON. TypeScript und Build erfolgreich; ESLint null Fehler/sechs bekannte React-Refresh-Warnungen. Browser: Linie kreuzt Wandachse bei (0,7; 0), Segmentschnitt erkannt, Referenz aktiviert/gelöst, neue Linie startet exakt am Schnitt, Direct Edit einer dritten Linie fängt denselben externen Schnitt; Undo/Redo geprüft. Screenshot: outputs/segment-intersection-hover.png.

Abnahme: Eine Linie quer durch eine Wandachse zeichnen, abseits von End- und Mittelpunkten. Kreuzung anfahren: „Segmentschnittpunkt“. 0,6 s verweilen und Hilfslinien verfolgen; erneut besuchen und lösen. Eine weitere Linie an diesem Punkt beginnen oder eine dritte Linie dorthin bewegen; Undo/Redo prüfen. Beim Bewegen einer der beiden Ausgangslinien darf deren alter Schnittpunkt nicht als externer Fangpunkt angeboten werden.

### Aufgenommen für später: N45 Wandachse

Nutzerpräzisierung: Die derzeit zentrierte Wandachse bei ausgewählter Wand sichtbar machen und später verschiebbar machen. In FUNCTION_REQUIREMENTS_2026-10-03.md bei N45 ergänzt, kein Doppelauftrag. Vor Wandanschlüssen passend einordnen. Ob die physische Wandlage erhalten oder mitverschoben wird, bleibt bis zur fachlichen Klärung offen; hier keine Implementierung.

### Abschluss: schräge Verlängerungs- und Lot-Hilflinienschnitte — 03.10.2026

Aufbauend auf 4c542ea / PR #35, der weiterhin offen bleibt. Neue Umsetzung auf feat/oblique-guide-intersections. Kein Merge durch den allgemeinen Fortsetzungsauftrag.

Die gemeinsame Richtungswahl in constraints/guides/directions.ts berücksichtigt jetzt jede gültige Kantenrichtung, deren Gegenrichtung und Lotrichtungen sowie die bestehenden acht 45°-Richtungen. Pro aktiver Quelle wird genau eine mausrelevante Richtung gewählt. Bei gleichem Winkel entscheidet Verlängerung vor Lot, Horizontal, Vertikal und Winkel; anschließend der Richtungswinkel. Null-/nichtendliche Vektoren werden verworfen. Alte Richtungen bleiben nur erhalten, solange sie weiterhin aus der aktuellen Quellgeometrie stammen.

Darstellung, einzelne Führung, Schnittpunktbildung und Hover-Erwerb konsumieren dieselbe Wahl. Damit entstehen auch Schnitte außerhalb des 45°-Rasters, etwa zweier schräger Verlängerungen oder Verlängerung/Lot. Anders als bisher werden einzelne Führungen nicht zusätzlich unabhängig aus allen Richtungen bewertet. Explizite Shift-Winkel bleiben unverändert, genauso Punktprioritäten, Fangradius, Ortho und Direct-Edit-Ausschlüsse.

Hysterese: weiterhin maximal 5° zusätzliche Winkelreserve an einer Richtungsgrenze. Bei eng benachbarten Kandidaten reduziert sich diese auf 20 Prozent ihres Winkelabstands, damit flache schräge Kanten gegenüber der Horizontalen erreichbar bleiben. Vorläufiger technischer Bedienwert; kein numerisches Geometrie-Epsilon. Bestehender 45°-Grenztest 27,5°/17,5° bleibt gültig. Keine Modellaktion, Dateimigration, IFC- oder AI-Änderung.

Nachweise: 185 Tests bestanden, darunter fünf neue Gruppen für Verlängerung/Verlängerung und Verlängerung/Lot, Zoom/Fangradius, parallele/kollineare Fälle, Vektorreihenfolge/ungültige Richtungen, flache Winkel/Quellenwechsel, Prioritäten/Constraints, Hover-Lebenszyklus und Direct-Edit-Preview/Commit/Undo/Redo/JSON. TypeScript und Build erfolgreich; ESLint null Fehler/sechs bekannte React-Refresh-Warnungen. Browser: Linien (0;0,5)–(1;1) und (4;0,5)–(3;1) liefern außerhalb ihrer Strecken einen Hilflinienschnitt bei (2;1,5); beide sichtbaren Führungen sind Verlängerungen. Nach 600 ms dritter Hilfspunkt, neue Linie startet exakt dort, Undo/Redo geprüft. Freie Bewegung einer dritten Linie fängt denselben Schnitt mit Undo/Redo. Screenshot: outputs/oblique-guide-intersection.png.

Abnahme: Zwei schräge Linien zeichnen, deren Verlängerungen sich treffen. Beide zugewandten Enden je 0,6 s aktivieren und den Zeiger zur erwarteten Kreuzung führen. Die silbergrauen Führungen folgen den Kanten; der Schnitt wird zum Hilfspunkt. Dort zeichnen oder ein anderes Element dorthin bewegen. Parallel liegende Führungen sollen keinen erfundenen Schnittpunkt anzeigen.

### Abgeschlossener Auftragsumfang: Hilfslinienschnitt mit fester Direct-Edit-Achse

Die bisher dokumentierte Lücke bei achsengebundener Bearbeitung schließen: externe Hilfsreferenzen dürfen seitlich der erlaubten Bewegungsachse liegen, wenn ihre mausrelevante Führung diese Achse schneidet. Den Schnitt gemeinsam und eindeutig berechnen, die feste X-/Y-/Elementachse weiterhin strikt einhalten und keine bloß projizierten Endpunkte als echte Fangpunkte beschriften. Zuerst vorhandenen Filter und Kandidatenvertrag prüfen; keine separate SnapEngine im Werkzeug.

Abnahme: X-/Y-/schräge Elementachse, passende externe Verlängerung/Lotführung, parallele/kollineare Fälle, eigene und Fensterhost-Quellen ausgeschlossen, veralteter Kontext, unterschiedliche Zoomstufen. Preview und Bestätigung müssen identische Ziele liefern, ein Undo/Redo und JSON bleiben korrekt. Browserabnahme einschließlich Escape sowie Tests/TypeScript/Lint/Build. Wandachse N45 bleibt ein späterer fachlich zu klärender Auftrag.

## Historische Fortschrittsnachweise

### Abgeschlossener Auftrag: gemeinsame Fang-Kandidaten und Rangfolge

**Ziel:** Die bestehenden Linie-/Wand-/Auswahl-/Direct-Edit-Verbraucher erhalten dieselbe nachvollziehbare Fangentscheidung aus einer nichtrekursiven Kandidatenpipeline. Keine neuen Fangarten oder UI-Werkzeuge.

**Ausgangsbefund:** constraints/snapping/engine.ts ruft querySnap für jede aktive Referenz erneut auf. Endpunkte, einzelne Führungen und Mehrfachreferenzen verwenden unterschiedliche Tie-Breaker; letztere nutzen sourceFeature.localeCompare ohne vollständige Quellenidentität. Toleranzregeln und Direct-Edit-Ausschlüsse sind bereits abgesichert.

**Begrenzter Umfang:**

1. Bestehende Erzeugung für Endpunkte, Richtungsführungen, horizontale/vertikale Referenzschnittpunkte und Raster intern trennen. Referenzvalidierung einmal pro Anfrage; keine rekursive querySnap-Gesamtabfrage. Public API und Modelladapter erhalten, keine vorsorglichen Klassen/Registries.
2. Eine reine, explizite Rangfunktion verwenden. Bestehender Vorrang bleibt: ausdrücklicher Shift-Constraint; dann kompatibler Endpunkt, bestehender HV-Guide-Schnittpunkt, einzelne Führung, Raster-Fallback. Ortho-Kompatibilität und tatsächliche Quellenkoordinaten erhalten. Abstand in CSS-Pixeln vergleichen.
3. Technischer Umsetzungsvorschlag für bisher uneinheitliche Gleichstände: bei gleichem Rang/Abstand neuere aktive Referenz bevorzugen, danach vollständige stabile Quellenidentität (entityId, feature; bei Schnittpunkten beide Quellen), schließlich ausdrücklich dokumentierte Fangart-/Richtungsreihenfolge. Keine Locale-Abhängigkeit und keine unbeabsichtigte Abhängigkeit von der Reihenfolge der Modellquellen. Dies ist eine technische Rangregel, keine behauptete Nutzerentscheidung; im Änderungsprotokoll die bisher anders entschiedenen Fälle benennen.
4. Bestehende Consumer weiterverwenden. Direct-Edit-Ausschluss eigener Quellen/Host und explizite Achspriorität erhalten; keine eigenständige zweite Rangfunktion im Editadapter.

**Nicht enthalten:** Mittelpunkt-/allgemeiner Segmentschnittfang, beliebige Guide-Schnittpunkte, Hysterese, räumlicher Index, 3D-Arbeitsebenen, Lösung des Wandeck-Griffversatzes, Layer, Skalieraktion, neue Bauteile oder Layouteditor. Diese bleiben dokumentiertes Backlog, nicht Teil dieses Auftrags.

**Abnahme:**

- Bestehende 149 Tests bleiben grün; zusätzliche Tests für konkurrierende Quellen mit gleichem Feature-Namen, vertauschte Quellreihenfolge, bewusste Aktivierungsreihenfolge und mehrere gleiche Führungen.
- Toleranzfall 0.3 gegen 0.1+0.2, große Offsets, mehrere Zoomstufen, echte seitliche Abweichung und exakte Invalidierung veralteter Quellen bleiben korrekt. Zwei Quellen eines Schnittpunkts bleiben zur Anzeige verfügbar.
- Snap aus, Shift/Ortho, vier Referenzen, Escape/Kontextwechsel und Raster-Fallback behalten ihren geprüften Vertrag. Wand/Linie/Direct Edit liefern bei identischem Kontext identische Zielkoordinaten.
- Anwendungstests bestätigen Vorschau/Klick, eigene Quellenausschlüsse, ungültiges Ziel ohne Commit, ein Undo/Redo und JSON; vorhandene Stage-1-/IFC-Regressionen bestehen.
- TypeScript, vollständiges ESLint und Build ausführen; bekannte Warnungen getrennt berichten. Praktisch zwei externe Referenzen aktivieren, konkurrierende Hilfslinien beim Linienzeichnen und freien Bewegen testen, zoomen, bestätigen/Undo und abbrechen. Keinen neuen Performanceanspruch ohne Messung.
- Kein neuer Modellbefehl entsteht: vorhandene AI/Text/Voice-Verträge und Stale-Context-Tests erhalten; ein zusätzlicher Sprachparser ist hier nicht erforderlich.

**Lieferung:** ein kleiner prüfbarer Entwicklungszweig/PR, dokumentierte Rangregel und Bedienabnahme. Kein Merge ohne Prüfung. Dokumentationsstand baut auf PR #28 auf; Abhängigkeiten in Reihenfolge prüfen statt ältere Änderungen erneut zu implementieren.

## Architekturreview: Direct Edit an gemeinsame Fang-Engine angebunden - 03.10.2026

Zweiter begrenzter Korrekturschritt nach numerischen Toleranzen (PR #27). Der Application-Adapter `application/direct-edit/snapping.ts` verbindet vorhandene EditSession-Aktionen mit der gemeinsamen SnapEngine. BimPlan verwendet dieselbe Auflösung für Live-Vorschau und Bestätigung, einschließlich aktueller Shift-Taste. Die Vorschau bleibt abgeleitet; nur Bestätigung erzeugt einen validierten Undo-Schritt. Die Quellen stammen aus dem ursprünglichen Modell, niemals aus der Vorschau.

Freies Bewegen und Punktbearbeitung erhalten Endpunktfang, Raster, Ortho, Shift in 45-Grad-Schritten und aktivierte Hover-Hilfslinien. Die bestehenden silbergrauen Referenzringe und Führungen erscheinen auch während Direct Edit. Alle Referenzen des bearbeiteten Elements werden ausgeschlossen; bei Fenstern zusätzlich die Trägerwand. Explizite X-/Y-/Elementachsen, Strecken und die Fensterachse haben Vorrang vor Shift/Ortho. Auf solchen Achsen werden nur kompatible Referenzpunkte verwendet; ein seitlich projizierter Fangpunkt wird niemals als exakter Endpunkt/Schnittpunkt/Raster beschriftet.

Abnahme: Snap einschalten, eine Linie zeichnen. Wandecke auswählen, im Elementmenü „Punkt frei bewegen“ wählen und an einem fremden Linienendpunkt verweilen. Endpunktmarker erscheint sofort, Referenzring nach 0,4 s. Daneben zeigt die passende temporäre Hilfslinie. Ziel anklicken, Undo und Redo ausprobieren. Shift bei freier Bearbeitung halten; Escape muss die Vorschau verwerfen.

Prüfung: 149 automatisierte Tests, TypeScript, vollständiges ESLint und Produktionsbuild. Lint: null Fehler, sechs bekannte React-Refresh-Warnungen. Neue Fälle prüfen freie Wandbewegung und Punktänderung, exakte externe Endpunkte, Zoomradius, Snap aus, Shift, Achspriorität, Hover-Führung, geschlossene Polylinien, Fenstergrenzen und Strecken mit Griffversatz. JSON, Undo/Redo und bestehende IFC-Tests bleiben enthalten. Browser: Endpunkt außerhalb des Rasters exakt erkannt, Ring/Hilfslinie beim Bearbeiten sichtbar, Vorschau und Bestätigung geometrisch identisch, Undo auf 3 m und Redo auf 4,131980263614846 m geprüft. Screenshot lokal: outputs/direct-edit-snap-preview.png.

Grenzen: 2D; keine neuen Fangarten oder räumlichen Indizes. Auch unbewegte Punkte desselben Elements bleiben vorerst ausgeschlossen. Bei festgelegten Achsen werden Führungen aus seitlich liegenden Referenzen noch nicht mit der Bewegungsachse geschnitten. Bestehende Wandgriffe verschieben den Achsendpunkt um das Griffdelta; eine beim Drehen neu berechnete Außenkante ist damit kein geometrisch fixierter Eckkontakt. Dieser bestehende Griffversatz ist gesondert vor Wandanschlüssen zu präzisieren. Keine Änderung an Dateiformat, IFC oder Modellvalidierung.

Nächster Schritt: Kandidatenerzeugung und Rangfolge in der gemeinsamen Engine ohne rekursive Gesamtabfragen trennen und Gleichstände ausdrücklich regeln; danach allgemeine Richtungsschnittpunkte und Hysterese.

## Architekturreview: numerische Fangtoleranzen - 03.10.2026

Grundlage: [Architekturreview und Funktionslandkarte](NOVIKOV_ARCHITEKTUR_REVIEW_UND_FUNKTIONSMAP.md), als Nutzerquelle abgelegt. Abgleich mit main dd3e358 nach Übernahme des Gesamtstands aus PR #26. Der Architekturvertrag bleibt maßgeblich. Dieser Schritt bearbeitet ausschließlich den ersten Korrekturauftrag; zusätzliche Fangarten sind zurückgestellt.

Fehler zuerst als Regression reproduziert: Endpunkt y=0.3 wird bei Ortho-Ursprung y=0.1+0.2 nicht erkannt. Der Test schlägt am unveränderten Stand fehl und besteht nach Korrektur. `geometry/tolerances/model.ts` definiert eine numerische Modellkompatibilität in Metern: Minimum 1e-9 m, bis zu acht maschinelle Rundungseinheiten relativ zur Koordinatengröße, gedeckelt auf 1e-6 m. Das ist keine Bauausführungs- oder Importtoleranz. Bei extremen Koordinaten über dieser Genauigkeitsgrenze sind lokale Koordinaten nötig; die Toleranz wächst nicht unbegrenzt. Nichtendliche Werte sind inkompatibel. Der Bildschirm-Fangradius bleibt unverändert in CSS-Pixeln.

Endpunkt-/Guide-/Schnittpunkt-Kompatibilität mit Ortho und die Rasterkennzeichnung verwenden diese gemeinsame Regel. Akzeptierte Kandidaten behalten ihre originalen Modell-/Konstruktionskoordinaten statt eine projizierte Kopie als Endpunkt oder Raster auszugeben. Quellen-IDs, Feature-Identität, Hover-Zeitlogik und Positionsvergleiche zur Invalidierung bleiben ausdrücklich exakt. Projektänderungen setzen den UI-Kontext weiterhin zurück. Kein Dateiformatwechsel, keine Änderung an Prioritäten, Shift oder History.

Nachweise: 140 Tests bestanden (fünf neue Tests mit mehreren Fällen), TypeScript, vollständiges ESLint und Produktionsbuild erfolgreich. Lint: null Fehler, sechs bekannte React-Refresh-Warnungen. Tests prüfen beide Achsen, ±10 Millionen Meter, 10/100/1000 px/m, echte Abweichungen, nichtendliche Werte, Toleranzdeckel, exakte Kandidatenkoordinaten und weiterhin ungültige veraltete Hover-Referenzen trotz minimaler Verschiebung. Vorhandene Shift-, Mehrfachreferenz-, Undo/Redo-, JSON- und IFC-Tests bleiben grün. Keine erneute Browserprüfung in diesem rein numerischen Schritt; Bedienoberfläche unverändert.

Kurzer Bedienversuch: Linie mit aktivem Ortho an einem vorhandenen Endpunkt beginnen/enden lassen und bei unterschiedlichen Zoomstufen wiederholen. Echte seitlich versetzte Punkte dürfen nicht als Endpunkt auf der Ortho-Achse erscheinen. Der konkrete Unterschied von 0.3 zu 0.1+0.2 ist im automatisierten Regressionstest zuverlässiger prüfbar als per Maus.

Getrennte Folgeaufträge in dieser Reihenfolge:

1. Direct Edit mit geeignetem Ausschluss eigener Quellen an die gemeinsame Engine anbinden; Vorschau und Klick müssen denselben Punkt liefern, Wand-/Fenstervalidierung beibehalten.
2. Kandidatenerzeugung und Rangfolge ohne rekursive Gesamtabfragen trennen; Gleichstände über ausdrückliche Quellen-/Aktivierungsregeln entscheiden.
3. Allgemeine Richtungsschnittpunkte und Hysterese ergänzen.
4. Architekturgrenzen automatisiert absichern und große Modelle messen, bevor Leistungszusagen gemacht werden.

## Guide-Etappe 3c: werkzeugfreies Hover und mehrere Referenzen - 03.10.2026

Hover-Erkennung und Hilfslinien funktionieren jetzt auch im Auswahlmodus, ohne Zeichenwerkzeug. Der aktive ungefüllte Referenzring hat 10,5 statt 6 CSS-Pixel Radius (+75 Prozent); Ring und Hilfslinien verwenden Silber-Grau (#929aa3). Die bestehenden blauen Fanghinweise bleiben zur Unterscheidung erhalten. Das Wandzeichnen nutzt nun dieselbe Fang-/Hover-/Shift-API wie Linie/Polylinie; direkte Bearbeitung bleibt separat.

Bis zu vier durch Verweilen aktivierte Referenzen bleiben innerhalb der Zeichenfläche erhalten. Ein fünfter verdrängt den ältesten; erneutes Aktivieren aktualisiert die Reihenfolge ohne Duplikat. Neben den einzelnen Richtungsführungen unterstützt die Engine als erste gemeinsame Konstruktion Horizontal-von-A/Vertikal-von-B. Ein naher Schnittpunkt gewinnt vor Einzelführungen und wird mit beiden Herkunftslinien dargestellt. Tatsächliche Endpunkte behalten Vorrang. Alle Referenzen werden gegen den aktuellen Modellstand geprüft.

Prüfung: 135 Tests bestanden, TypeScript und Build erfolgreich, ESLint null Fehler und sechs bekannte Warnungen. Neue Tests behandeln Referenzlimit, Duplikate, exakte Schnittpunkte bei verschiedenen Zoomstufen, veraltete Quellen sowie Wandaktion mit einem Undo-Schritt und JSON-Rundlauf. Browser: Hover im Auswahlmodus ohne History-Eintrag; zwei Referenzen, gemeinsamer Schnittpunkt und beide Hilfslinien; Wand mit gemeinsamem Shift-Fang exakt 45 Grad, Undo/Redo. Globales Escape räumt Referenzen auch ohne Canvas-Fokus auf (nach frischem Laden geprüft). Lokaler Screenshot: outputs/multi-reference-guides.png.

Abnahme: Im Auswahlmodus zwei räumlich versetzte Endpunkte jeweils etwa 0,4 s anhovern, ohne zwischendurch die Zeichenfläche zu verlassen. Anschließend auf die horizontale Flucht des einen und vertikale Flucht des anderen bewegen: „Schnittpunkt“ mit zwei gestrichelten Linien erscheint. Escape löscht alle Referenzen. Wandwerkzeug wählen und Fang/Shift wie beim Linienwerkzeug testen.

Grenzen: temporäres Fixieren, keine gespeicherten Hilfsobjekte. Verlassen der Zeichenfläche, Kamera-/Modelländerung, Snap aus und direkte Bearbeitung löschen den Kontext; nicht als dauerhafte Pins interpretieren. Auswahlmodus erzeugt keine Bauteile. Gemeinsame Schnittpunkte bisher nur horizontal/vertikal; Schnittpunkte beliebiger Richtungsführungen, Hysterese, Ebenenfilter und 3D folgen separat. Die Mehrfachabfrage ist auf vier Referenzen begrenzt; keine neue Leistungsaussage für große Modelle.

Nächster kleiner Schritt: Schnittpunkte beliebiger aktiver Richtungsführungen (Verlängerung, Lot und Winkel) geometrisch verallgemeinern und die Auswahl konkurrierender Führungen mit Hysterese stabilisieren.

## Guide-Etappe 3b: Ringe, Ecken und Richtungsführung - 03.10.2026

Erkannte Fangpunkte und gesetzte Startpunkte werden als ungefüllte Ringe dargestellt. Die sofortige Erkennung (blau) bleibt von der Hover-Aktivierung nach standardmäßig 400 ms (orange) getrennt. Wandaußenecken sind jetzt zusätzliche abgeleitete Referenzen. Die vorhandene Wartezeit-Einstellung bleibt erhalten.

Die gemeinsame Geometrieprojektion liefert Richtungsführungen: Verlängerung/Flucht und Lotrechte aus angrenzenden Liniensegmenten bzw. Wandachsen sowie automatische Diagonalen. Nur Kandidaten innerhalb des Bildschirmradius werden angeboten; der nächste gewinnt, bei Gleichstand die feste Erzeugungsreihenfolge. „Verlängerung“ bezeichnet hier die gesamte Geradenflucht, auch in Gegenrichtung. Shift erzwingt ohne Radiusbeschränkung 0/45/90/.../315 Grad; Bezug ist der gesetzte Startpunkt, davor eine aktivierte Referenz. Shift hat Vorrang vor Ortho und automatischem Raster, auch bei deaktiviertem Snap. Loslassen gibt den normalen Fang frei. Klick und Vorschau nutzen dieselbe Berechnung. Hilfslinien bleiben temporär.

Prüfung: 132 Tests bestanden; neu geprüft sind acht Shift-Richtungen, Loslassen, entartete Richtung, exakte Projektion an schrägen Kanten und Wandaußenecken. TypeScript und Build erfolgreich; ESLint null Fehler, sechs bekannte Warnungen. Browser: Soforterkennung vor Aktivierung, ungefüllter aktiver Ring, mit Shift exakt bestätigtes 45-Grad-Segment, Loslassen und Escape geprüft. Screenshot lokal: outputs/directional-guides.png.

Abnahme: Linienwerkzeug wählen, an einer Wandecke verweilen, dann nahe einer Flucht/Diagonalen wegbewegen. Startpunkt klicken und Shift halten: unabhängig vom Raster rastet die Richtung in 45-Grad-Schritten ein. Shift loslassen und Escape testen.

Grenzen: erster Verbraucher bleibt Linie/Polylinie; keine Mehrfachreferenzen, Nachbarparallel-Erkennung, Hysterese oder 3D. Am Polylinienvertex werden die benachbarten gespeicherten Segmente ausgewertet. Nächster Schritt: Wandzeichnen an dieselbe geprüfte Fang-/Hover-/Shift-API anschließen und Wand-Fenster-Workflow mit Undo/Redo und Dateirundlauf prüfen.

## Vorgezogene Guide-Etappe 3a: Hover-Referenz und Achsführungen - 02.10.2026

Auf ausdrücklichen Nutzerwunsch wird vor dem zweiten Werkzeug zunächst das gewünschte Zeigerverhalten umgesetzt: Endpunkt ohne Klick 400 ms halten, als temporäre Referenz aktivieren und anschließend nur die zum Zeiger passende horizontale oder vertikale Hilfslinie anbieten. Die Verweildauer ist in den Werkzeugeigenschaften auf 200/400/600/1000 ms einstellbar (Sitzungseinstellung, nicht Projektinhalt).

`constraints/inference/hover-reference.ts` verwaltet die einzelne Referenz mit expliziter Zeitquelle. Die gemeinsame SnapEngine priorisiert Endpunkt vor Führung vor Raster. Der React-Adapter liefert Zeiger und Timer; die Ansicht zeigt einen Referenzring, eine gestrichelte Hilfslinie und die wirksame Fangart. Die Führung projiziert mathematisch exakt auf die Bezugsachse, innerhalb von 10 CSS-Pixeln. Eine neue Referenz ersetzt die bisherige erst nach voller Verweildauer. Escape, Verlassen der Zeichenfläche, Werkzeug-/Kamera-/Modellwechsel und deaktiviertes Snap verwerfen temporären Kontext. Es entstehen weder Modellelemente noch Undo-Einträge durch Hover.

Nachweise: 129 Tests bestanden, darunter fünf neue Tests zu kontinuierlichem Hover, Unterbrechung, Referenzwechsel, einstellbarer Wartezeit, Zoom, Prioritäten, Ortho-Konflikten, veralteten Quellen und Dateirundlauf mit Undo/Redo. TypeScript und Produktionsbuild erfolgreich; ESLint null Fehler und sechs bekannte React-Refresh-Warnungen. Browser: ruhiges Hover aktiviert ohne Klick; horizontale und vertikale Führung erscheinen entsprechend der Zeigerposition; bestätigter Linienpunkt liegt exakt auf der Bezugsachse; Undo/Redo und Escape geprüft. Screenshot: outputs/hover-guide.png im lokalen Arbeitsverzeichnis.

Abnahme: Linienwerkzeug wählen, Snap einschalten, am Achsende einer Wand oder an einem Linienpunkt kurz verweilen. Der orange Ring zeigt die aktive Referenz. Zeiger seitlich oder nach oben bewegen: Nur die passende gestrichelte Führung erscheint. Punkt setzen, Linie abschließen, Undo/Redo testen. Escape räumt die Referenz auf.

Grenzen: erster Verbraucher weiterhin Linie/Polylinie in 2D; maximal eine Referenz, nur Achsführungen, keine dauerhaften Hilfsobjekte. Noch keine Richtungsableitung aus Kanten, Mehrfachreferenzen, Hysterese, Parallel-/Lot-/Winkelbezüge, 3D oder räumlicher Index. Die ursprüngliche vollständige Hilfslinienspezifikation bleibt offen. Die Engine analysiert derzeit vorhandene Wandachsenden und Linienvertices; weitere Elementtypen benötigen Modelladapter.

Nächster Teilauftrag: Richtungsreferenzen vorhandener gerader Linien/Wandachsen ergänzen und daraus Verlängerung, Lotrechte und 45°-Führung priorisiert ableiten. Danach dieselbe geprüfte API im Wandzeichnen einsetzen. Keine werkzeugspezifische Fangberechnung duplizieren.

## Guide-Etappe 2a: gemeinsame Fanggrundlage - 02.10.2026

Die reine Engine `src/constraints/snapping/engine.ts` liefert Modellpunkte und Fangkandidaten mit Art, Quelle, Bildschirmabstand und Priorität. Der Application-Adapter `src/application/snapping/project-references.ts` leitet Wandachsenden und vorhandene Linien-/Polylinienpunkte aus dem einzigen Project ab. React stellt nur Ansichtskontext und Anzeige bereit. Als erster Verbraucher nutzt das Linienwerkzeug (einschließlich Polylinien) diese API. Endpunkte innerhalb von 10 CSS-Pixeln haben Vorrang vor dem bisherigen 0,10-m-Raster; gleiche Kandidaten werden deterministisch entschieden. Ortho darf keinen projizierten Punkt als echten Endpunkt ausgeben. Marker und Beschriftung zeigen den wirksamen Fang. Kamera-/Werkzeugwechsel verwerfen veraltete Hoverpositionen.

Prüfung: 124 Tests bestehen, einschließlich sechs neuer Tests zu Rasterpriorität, Zoomabständen, konkurrierenden Kandidaten, Ortho, ungültigen Eingaben, Modelladapter, Undo/Redo und JSON. TypeScript und Produktionsbuild erfolgreich; ESLint ohne Fehler, sechs bekannte React-Refresh-Warnungen. Browser: Linie beginnt nach Klick neben dem Wandende exakt bei 3,037 m statt am Raster; Undo entfernt sie, Redo stellt dieselben Koordinaten wieder her. Endpunktmarker bei rund 105 und 200 px/m geprüft; Escape verwirft einen begonnenen Linienzug.

Praktische Abnahme: Wandlänge auf 3,037 m ändern, Linienwerkzeug und Snap aktivieren, nahe der Mitte der Stirnseite auf das Achsende zeigen. „Endpunkt“ erscheint; dort starten und den zweiten Punkt setzen. Undo/Redo prüfen und denselben Fang bei verändertem Zoom wiederholen.

Grenzen: erste gemeinsame Grundlage, keine vollständige Raster-/Hilfslinienengine. Wandzeichnen und direkte Bearbeitung verwenden noch ihren bisherigen Fangweg. Referenzen werden linear durchsucht; große Projekte, räumlicher Index und Hysterese sind noch nicht geprüft. Mittelpunkte, Schnittpunkte, Hoveraktivierung, Hilfslinien, 3D-Arbeitsebene, laufende Entwurfsvertices und ein Fang-Einstellungsdialog folgen separat. Wandreferenzen sind Achsenden, keine Außenkanten. Das Raster bleibt außerhalb der Endpunkttoleranz der bisherige flächige Fallback.

Nächster kleiner Schritt: Wandzeichnen als zweiten Verbraucher an dieselbe Engine anschließen, ohne Fanglogik zu duplizieren. Prüfen: Wand an bestehendem Linien-/Wandendpunkt, Ortho, Zoom, Abbruch, genau ein Undo sowie Projektdateirundlauf. Danach direkte Bearbeitung und weitere Fangarten schrittweise anbinden.

## Formatbereinigung abgeschlossen – 02.10.2026

`.gitattributes` legt für automatisch erkannte Textdateien LF im Checkout fest; `.prettierrc` verlangt ausdrücklich LF. Die lokalen UTF-8-Textdateien wurden ohne Änderung ihrer Inhalte von CRLF auf LF normalisiert. Prettier hat die noch abweichende Formatierung in ToolRail, den beiden Routendateien und styles.css vereinheitlicht. Binärdateien bleiben unverändert. Keine CAD-Funktion oder Fanglogik wurde geändert.

Prüfung: vollständiges ESLint erfolgreich mit null Fehlern, auch erneut nach dem Produktionsbuild. 118 Tests, TypeScript und Build erfolgreich; keine CRLF-/gemischten Textdateien mehr im geprüften Checkout. Sechs bestehende `react-refresh/only-export-components`-Warnungen bleiben in badge, button, form, navigation-menu, sidebar und toggle sichtbar. Sie betreffen gemischte Komponenten-/Hilfsexporte, keine Formatfehler; ihre strukturelle Bereinigung ist nicht Teil dieses Format-PRs. Keine Lint-Regel wurde abgeschaltet.

Nächster Funktionsauftrag ist Guide-Etappe 2: eine gemeinsame, erweiterbare Raster- und Punktfang-Engine unter constraints/snapping, mit generischer Geometrie und Modelladaptern. Endpunktfang ist ihre erste Fangart, keine separat in Werkzeugen implementierte Logik. Ein expliziter Ansichtskontext liefert bildschirmbezogene Fangabstände; Ergebnisse bleiben Modellkoordinaten. Zunächst einen vollständigen Zeichenablauf integrieren, anschließend das zweite Werkzeug über dieselbe API. Raster, Mittelpunkt, Schnittpunkt und später Referenzen/Guides verwenden die gemeinsame Kandidaten-/Prioritätsstruktur. Leistungsoptimierungen folgen gemessenen Engpässen; beliebig große Projekte sind damit noch nicht nachgewiesen.

## Guide-Etappe 1a abgeschlossen – 02.10.2026

Der neue Application-Controller unter `src/application/direct-edit/controller.ts` koordiniert Start, Bestätigung, Abbruch und Snapshot-History. Die reine Vorschaufunktion verwendet weiterhin die vorhandene Direct-Edit-/Transformationslogik. `CadWorkspace` dispatcht Ereignisse; `BimPlan` meldet Sitzung und Zielpunkt statt selbst einen fertigen Modellzustand zu bestätigen. Bestehende Achs-/Punktaktionen nutzen denselben Lebenszyklus, ohne neue Geometrie. Eigenschaften, Zeichnen, Textbefehle und Laden behalten ihre bisherigen validierten Operationen und geben Ergebnisse an denselben History-Pfad weiter. Es gibt weiterhin genau ein Project.

Nachweise: 118 Tests bestanden, davon acht neue Application-Tests zu Vorschauen, Abbruch, veraltetem Kontext, ungültigen Zielen, No-op/Redo, Linienbewegung, Dateirundlauf, 3D und IFC. TypeScript, gezieltes ESLint der geänderten Dateien und Build erfolgreich. Browser: Vorschau/Abbruch ohne Undo, Wandbewegung mit einem Undo-Schritt, Redo, Linienbewegung und 3D-Wechsel; keine Konsolenfehler. Nach einer Modelländerung wird der alte angeklickte Bewegungsanker verworfen. Eine allgemeine automatische Importgrenzen-Prüfung ist noch nicht implementiert; das neue Modul wurde auf ausschließlich modell-/historybezogene Imports ohne React/DOM geprüft.

Praktische Abnahme: Wand mit Fenster auswählen, „Element frei bewegen“, Vorschau bewegen und Escape drücken. Erneut starten und Ziel anklicken. Einmal Undo muss die Bewegung vollständig zurücknehmen; Redo stellt sie wieder her. Danach denselben Ablauf mit einer Linie prüfen. Maße und Fensterzuordnung bleiben erhalten.

Nächster kleiner Wartungsschritt: Formatierung und Zeilenenden in einem separaten PR bereinigen, bevor weitere Fangfunktionen hinzukommen. LF-Regel für Git/Formatter abstimmen, nur Formatänderungen durchführen, vollständiges Lint sowie Tests/Build prüfen. Die 7.891 Formatfehler und sechs Warnungen aus der Bestandsaufnahme sind historische Ausgangswerte; die Gesamtbereinigung wurde hier nicht behauptet. Danach Guide-Etappe 2: zuerst gemeinsamer Endpunktfang für einen bestehenden Zeichenablauf, anschließend das zweite Werkzeug und weitere Fangarten. Kein freier KI-Parser, neue Elementtypen oder Ersatz für Snapshot-History in diesem Schritt.

## Guide-Etappe 0 abgeschlossen – 02.10.2026

Die aktuelle Bestandsaufnahme und vollständige Matrix für Guide-F01–F29 stehen in [GUIDE_BASELINE.md](GUIDE_BASELINE.md). Geprüft wurde Commit 635cde4 mit dem integrierten Funktionsstand aus PR #17 und Guide aus PR #18. 110 Tests, TypeScript und Build bestehen. Vollständiges Lint schlägt mit 7.891 Formatierungsfehlern und sechs Warnungen fehl; ohne Formatierungsregel null Fehler, sechs Warnungen. Keine CAD-Verhaltensänderung in dieser Etappe.

Nächster einzelner Auftrag: Guide-Etappe 1a, gemeinsame Application-Orchestrierung der vorhandenen freien Elementbewegung (Start, Vorschau, Bestätigung, Abbruch und genau ein Undo-Schritt). Zuständigkeiten und konkrete Abnahmekriterien in GUIDE_BASELINE.md. Bestehende Modell-/Transformations-/History-Funktionen weiterverwenden. Erst danach gemeinsamer Endpunktfang, anschließend weitere Fangarten als getrennte Schritte.

Die folgenden Einträge zur noch offenen Bestandsaufnahme beschreiben den Zustand vor diesem Abschlussnachtrag.

## Aktive Planungsgrundlage ab 02.10.2026

DEVELOPMENT_GUIDE.md enthält den vollständig und unverändert abgelegten neuen Nutzerleitfaden. Er ersetzt die Anlage „0.Where it all Begins“ und die bisherige Etappenreihenfolge als aktive Planungsgrundlage. ARCHITECTURE.md bleibt für Architekturgrenzen maßgeblich. Die nachfolgenden älteren Etappen und Abschlussnachträge bleiben als Nachweise erhalten; ihre Nummern sind historisch und dürfen nicht mit Guide-Etappen 0–12 oder Guide-F01–F29 verwechselt werden.

Aktueller gesicherter Funktionsstand: feat/plan-camera, Commit 2bca281, PR #17 (offen). 110 Tests, TypeScript, gezieltes ESLint, Build und dokumentierte Browserprüfung bestanden. Dies ersetzt noch nicht die vollständige Anforderungszuordnung nach Guide-Etappe 0. Der vorgezogene Bildschirmmaßstab deckt einen Teil von Guide-Etappe 7/F10 ab; Referenzimport, Kalibrierung und Ausgabemaßstab fehlen weiterhin.

Nächster begrenzter Auftrag: Guide-Etappe 0. Aktuellen Code und Prüfungen abgleichen; Matrix für Guide-F01–F29 mit Status, zuständigem Modul und konkretem Nachweis erstellen; vorhandene Funktionen von Teilumsetzungen und fehlenden Funktionen trennen. Insbesondere prüfen, ob vor Endpunktfang ein kleiner gemeinsamer Application-Schritt nötig ist. Keine neue CAD-Funktion in dieser Bestandsaufnahme. Abnahme: alle 29 Wünsche zugeordnet, offene Prüfungen benannt und genau ein ausführbarer Folgeauftrag mit Abnahmekriterien festgelegt.

Übergreifende Gesprächswünsche bleiben bestehen: sichtbare Auswahlumrandung für alle künftigen Elementtypen, Verbesserung der Spracherkennung, Eigenschaften oben und Bewegungsaktionen am Zeiger. Sie werden bei Etappe 0 gesondert zugeordnet. Die ältere Detailspezifikation F13_HILFLINIENSYSTEM.md gehört zu Guide-F14. Vorgeschlagene 600 ms Hover und 10 px Fangradius sind vorläufige, konfigurierbare Werte.

Dieser Dokumentationsschritt archiviert und verankert den Guide; Etappe 0 ist noch nicht abgeschlossen. Danach jeweils ein kleiner Benutzerablauf mit Tests, praktischer Abnahme und aktualisiertem Plan. Bereits geprüfte Funktionen werden wiederverwendet. Keine Änderungen am Architekturvertrag oder am CAD-Verhalten.

## Historischer Entwicklungsplan und Nachweise

Verbindliche Reihenfolge aus dem Nutzerauftrag vom 01.10.2026. Dieser Plan ersetzt die bisherige technische Reihenfolge in FEATURE_ROADMAP.md; die dort erfassten Einzelanforderungen F01–F14 bleiben erhalten. Bereits funktionierende Modell-, UI-, History- und Exportfunktionen werden weiterverwendet. Pro Änderung eine überschaubare, prüfbare Teil-Etappe.

## Etappe 1 Gesamtstand prüfen und stabilisieren

Alle bisherigen Funktionen gemeinsam auf einem eindeutig bezeichneten Entwicklungszweig prüfen. Vollständiger Ablauf: Wand zeichnen → Fenster einsetzen → Maße ändern → Bauteile verschieben → Undo/Redo → speichern → wieder öffnen → IFC exportieren. Gefundene Fehler beheben. Grundriss, 3D, Eigenschaften und Export müssen denselben Modellzustand verwenden. Grenzen dokumentieren und einen geprüften Zwischenstand sichern.

Stand: PR #14 sichert den bisherigen Browserablauf und korrigiert die Mausvorschau, PR #15 ergänzt nur die Liste. Verschiebungen wurden bisher separat geprüft; die durchgehende automatisierte Prüfung wird jetzt um Wand- und Fensterverschiebung, Modellkoordinaten, 3D-Geometrie und IFC-Platzierung ergänzt. Lokale Git-Synchronisierung und die praktische kombinierte Verschiebeabnahme bleiben ausdrücklich Abschlussbedingungen. Keine automatische Zusammenführung oder Release-Markierung.

## Etappe 2 Präzises Zeichnen und Fanghilfen

Zuerst Endpunkte, Mittelpunkte und Schnittpunkte fangen. Anschließend horizontale/vertikale Hilfslinien, Parallelen, Lotrechte und definierte Winkel. Referenzpunkte sichtbar markieren und nach einstellbarer Hover-Verweildauer aktivieren. Bildschirmbezogene Fangabstände und eindeutige Anzeige der aktiven Fanghilfe verwenden. Mit 2D beginnen, danach Verhalten auf einer aktiven 3D-Arbeitsebene definieren. Fangprioritäten, konkurrierende Referenzen, Abbruch und präzise Maßeingaben prüfen.

F13 bleibt die ausführliche Spezifikation. F04 (2D-Kamera/Zoom/Pan/Maßstableiste) als kleine technische Voraussetzung in diese Etappe einordnen. Erster Fangschritt soll vorhandene Geometrie und Werkzeuge nutzen, keine parallele Modellstruktur. Weitere Fangarten erst nach Prüfung der ersten Arten ergänzen.

## Etappe 3 Wandanschlüsse und Öffnungen

Saubere Eck- und T-Verbindungen gerader Wände. Nachvollziehbare Regeln für Achsen, verschiedene Wandstärken und Änderungen verbundener Wände. Mehrere Fenster, Randabstände und Überschneidungen prüfen; unzulässige Änderungen verständlich melden. Kleinen geschlossenen Grundriss bearbeiten, speichern und als IFC exportieren. Die bisherige geometrische Vereinigung überlappender Öffnungen ist keine abgeschlossene fachliche Öffnungsvalidierung.

## Etappe 4 Geschosse und Decken

Mehrere Geschosse mit stabilen IDs, Namen und Höhen; eindeutige Bauteilzuordnung. Einfache horizontale Decken mit Kontur, Stärke und Höhenlage. Zweigeschossiges Beispiel in 2D, 3D, Projektdatei und IFC abgleichen. Migration vorhandener Projektdateien bei Formatänderungen berücksichtigen.

## Etappe 5 Räume und geometrische Flächen

Räume mit stabilen IDs, Namen und eindeutigen Grenzen, zunächst in geschlossenen Grundrissen. Teilweise umschlossene Räume benötigen eine ausdrückliche Begrenzung. Geometrische Fläche berechnen und verwendete Kontur zeigen; Änderungen begrenzender Wände prüfen. Geometrische Raumfläche und Wohnfläche nach WoFlV als getrennte Auswertungen führen. F06 und passende Teile von F07 hier einordnen.

## Etappe 6 Dächer lichte Höhen und Wohnflächen

Einfache Dachschrägen und lichte Höhen zwischen fertigem Fußboden und begrenzender Oberfläche. Wohnflächenregeln anhand der zum Umsetzungszeitpunkt geltenden WoFlV recherchieren und mit fachlich geprüften Beispielen absichern. Höhenbereiche und relevante Abzüge berücksichtigen. Bericht mit Raumdaten, Flächenanteilen, Annahmen und Rechenweg, danach PDF-Export gemäß F08/F09.

## Weitere Funktionen

- On-Demand-Menü mit den jeweiligen geprüften Bearbeitungsaktionen weiterentwickeln; Eigenschaften bleiben oben, Bewegungsaktionen am Zeiger.
- Schraffuren und Referenzimport/-skalierung jeweils als eigene kleine Etappen nach grundlegenden Fang- und Maßeingabefunktionen. PDF/Bild anhand zweier Punkte und bekannter Länge skalieren (F05/F10).
- Text- und Sprachbefehle nur auf bereits geprüfte Modellfunktionen erweitern. Maus, Maßeingabe und Copilot verwenden dieselben validierten Aktionen. F11 bleibt offen.
- F12 (gemeinsame Auswahlumrandung) und F14 (Ebenensystem) bleiben geplant. Ebenensichtbarkeit bei Fangfiltern berücksichtigen und Ebenen vor größeren Projekten einordnen, ohne die sechs Etappen umzudeuten.

## Arbeitsweise und Abnahme

Für jeden Teil-Schritt: aktuellen Code und Abhängigkeiten prüfen; kleinen Umfang festlegen; implementieren und passende Tests ausführen; praktische Abnahmeanleitung liefern; Ergebnis und Einschränkungen dokumentieren. NOVIKOV Glass Flow erhalten und Bedienabläufe mit bestehenden Werkzeugen abstimmen. Entwicklungszweige und Pull Requests verwenden; Übernahme nach main erst nach Prüfung.

Nächste Abnahme für Etappe 1: neue 3-m-Wand mit mittigem 1,20-m-Fenster erstellen, auf 6 m verlängern, ganze Wand über On-Demand-Menü verschieben, Fenster entlang der Wand verschieben, beide Schritte einzeln rückgängig/wiederherstellen, speichern, Maße verändern, gespeichertes Projekt laden und IFC exportieren. Grundriss/3D/Hostzuordnung und Exportplatzierung abgleichen. Automatisierte Prüfung ersetzt diese abschließende Bedienabnahme nicht.

### Abschlussnachtrag Etappe 1

Git-Synchronisierung und kombinierte praktische Verschiebeabnahme sind am 01.10.2026 abgeschlossen; Nachweis in STABILIZATION.md. Etappe 1 ist damit technisch geprüft, die Übernahme nach main bleibt der PR-Prüfung vorbehalten. Die frühere Aufzählung offener Abschlussbedingungen beschreibt den Stand vor diesem Nachtrag. Etappe 2 kann auf dem gesicherten Gesamtstand beginnen.

### Etappe 2a – 2D-Ansichtsnavigation (02.10.2026)

F04 als Voraussetzung für bildschirmbezogene Fangabstände umgesetzt: Zoom am Mauszeiger, Plus/Minus, Pan per mittlerer Maustaste oder Pan-Schalter, Fit/Reset und Bildschirmmaßstab mit grafischer Meterleiste. Das Raster liegt in Modellkoordinaten und passt seinen sichtbaren Abstand dem Zoom an. Auswahlgriffe bleiben 10 CSS-Pixel groß. Die irreführende feste Fit-Anzeige der globalen Statusleiste entfällt.

Architektur: reine Kameramathematik unter src/rendering/viewport, generischer Point2 unter src/geometry/primitives. Kamera ist flüchtiger Zustand je Ansicht. Das bestehende Project bleibt die einzige Modellquelle; keine Modellaktion, History-Änderung, Dateimigration oder IFC-Anpassung durch Navigation. Alle bestehenden Modellbearbeitungen verwenden weiterhin die geprüften Operationen.

Prüfung: 110 Tests bestanden (105 bestehende, 5 Kamera-Tests), TypeScript, gezieltes ESLint und Produktionsbuild erfolgreich. Browser: Zoomanker bleibt bis auf numerisches Rauschen fest; Pan erzeugt keinen Undo-Eintrag; 300 Pixel bei 100 px/m ergeben 3 m; direktes Strecken um 100 Pixel ergibt 4 m; Undo stellt 3 m, Redo 4 m wieder her. Wechsel zu 3D erfolgreich.

Praktische Abnahme: 2D öffnen, über einer Wandecke mit dem Mausrad zoomen; die Ecke bleibt unter dem Zeiger. Pan aktivieren und ziehen, danach Escape drücken. Maße müssen gleich bleiben. Fit view zeigt das ganze Modell. 100 px/m wählen und zeichnen/bearbeiten; anschließend Undo/Redo prüfen.

Grenzen: px/m ist ein Bildschirmmaßstab, kein Druckmaßstab. Rasterdarstellung ist adaptiv; das bisherige optionale Rasterfangen bleibt ausdrücklich bei 0,10 m. Kameras werden nicht in Projektdateien gespeichert und beim Wechsel des Viewport-Layouts neu initialisiert. Geometrisches Fangen, Referenzaktivierung und Hilfslinien sind noch offen. Nächster Schritt: gemeinsame Endpunkt-/Mittelpunkt-/Schnittpunkt-Kandidaten unter constraints/snapping gemäß ARCHITECTURE.md und F13.


### Abschluss: externe Hilfslinien schneiden feste Bearbeitungsachsen — 03.10.2026

PR #35 und #36 wurden nach Nutzerfreigabe normal in ihre bisherigen Zielzweige übernommen (ee49f05 und d4a27ce). Dieser Schritt baut auf d4a27ce auf dem Zweig feat/direct-edit-axis-guides auf.

SnapContext erhält eine optionale feste Achse. Die gemeinsame Kandidatenpipeline schneidet jede aktive, validierte externe Führung mit dieser Achse. Der Direct-Edit-Adapter entfernt nur eigene/Host-Quellen, statt alle seitlich liegenden Quellen auszuschließen. Endpunkte und bestehende Schnittpunkte werden weiterhin auf echte Achsenkompatibilität geprüft; keine Projektion wird als Endpunkt bezeichnet. Feste Achsen haben Vorrang vor Shift/Ortho. Parallele/kollineare Führungen erzeugen keinen eindeutigen Achsenschnitt. Abstand bleibt 10 CSS-Pixel vom Mauszeiger, nicht von dessen Projektion.

Neue Anzeige: Achsenschnittpunkt mit externer Führung und zweiter Führung ab dem Bearbeitungsanker. Rang 0,5 wie Hilflinienschnitt, nach echten End-/Mittel-/Segmentschnittpunkten; bestehende Rangregel entscheidet Gleichstände deterministisch. Achsenschnitte sind sitzungsgebundene Fangziele und werden nicht als frei weiterverwendbare Hover-Referenz gespeichert. Keine Modell-, JSON-, IFC- oder AI-Modelllogikänderung. Bestehende validierte Aktionen und stabiler Zielkontext bleiben maßgeblich.

Nachweis: 191 Tests bestanden, TypeScript und Produktionsbuild erfolgreich; ESLint 0 Fehler/6 bekannte Warnungen. Vier neue Testgruppen decken X/Y/schräge Achsen, Zoom/Radius, Quelleninvalidierung, Parallelität/Kollinearität, Endpunktpriorität, ungültige Achsen, eigene/Host-/abhängige Quellen, Fensterposition, veraltete Sitzung, Preview/Commit/Undo/Redo/JSON ab. Browser: Linie (0;1)–(1;1) auf X bewegen, Wandachsende (3;0) 600 ms aktivieren; sichtbarer Achsenschnitt bei (3;1), Vorschau und Commit ergeben (3;1)–(4;1). Undo/Redo und Escape ohne Modelländerung geprüft. Y/schräge Achsen und Fensterhost sind automatisiert geprüft.

Abnahme: Punktfang und Snap einschalten. Linie oberhalb einer Wand zeichnen, auswählen, im On-Demand-Menü Element auf X-Achse wählen. Ein externes Wandachsende 0,6 s anhovern, danach die Maus zur Kreuzung seiner Lotführung mit der Bewegungslinie führen. Achsenschnittpunkt anzeigen lassen, bestätigen und Undo/Redo testen. Alternativ Escape zum Abbrechen.

### Abgeschlossener Auftragsumfang: präzise Strecke bei achsengebundener Bewegung eingeben

Die vorhandene X-/Y-/Elementachsen-Bearbeitung um eine numerische Streckeneingabe in Metern ergänzen. Zuerst bestehende Eingabe-/Einheitenparser prüfen und wiederverwenden; Eingabe und Maus müssen denselben gepinnten EditSession-Kontext und denselben Vorschau-/Bestätigungspfad nutzen. Vorzeichen relativ zur eindeutig angezeigten Achsenrichtung erklären. Keine neue Bewegungslogik in der UI, keine eigenständige AI-Aktion. Zunächst nur ganze Elemente auf X/Y/Elementachse, kein Skalieren, keine Wandachsenverlagerung N45.

Abnahme: positive/negative Strecke, Dezimalkomma, ungültiger Wert, veralteter Kontext, Escape, Vorschau/Commit, genau ein Undo/Redo und JSON. Fangen darf die ausdrücklich eingegebene Strecke nicht nachträglich verändern. Tests, TypeScript, Lint, Build und praktische Browserabnahme dokumentieren.


### Abschluss: numerische Strecken für ganze Elemente — 03.10.2026

PR #37 wurde nach ausdrücklicher Nutzerfreigabe normal als 47b24ca in feat/shared-segment-intersections übernommen. Umsetzung auf feat/numeric-axis-move.

Nach Element auf X-/Y-Achse oder Element entlang Achse erscheint Strecke (m) in der bestehenden Bearbeitungseinblendung. Der vorhandene parseMetres-Parser akzeptiert Dezimalpunkt/-komma sowie Vorzeichen. X/Y zeigen positive Weltachsen; die Elementachse zeigt ausdrücklich die Richtung zwischen den nummerierten Punkten (beim ersten Griff Punkt 2 → 1). Negative Werte laufen entgegengesetzt. Der eingegebene Wert ist eine relative Strecke vom gepinnten Bearbeitungsanker, keine Zielkoordinate. Keine Einheitensuffixe oder Rechenausdrücke in diesem Schritt.

application/direct-edit/numeric.ts übersetzt nur die Strecke in einen Punkt und verwendet previewEdit; Bestätigung verwendet unverändert editingReducer/confirm. Vorschau bleibt abgeleitet, History/Datei/IFC lesen weiterhin das bestätigte Projekt. BimPlan und die 3D-Ansicht zeigen denselben numerischen Entwurf. Solange Text eingegeben ist, kann Mausbewegung, Raster oder Punktfang die Zahl nicht überschreiben; bestätigt wird mit Enter oder Strecke übernehmen. Leeren/Maussteuerung kehrt zur Maus zurück. Fehler sperren Bestätigung, Escape auch im Eingabefeld bricht ab. Entwurf ist an dieselbe EditSession gebunden; neue Sitzung übernimmt keinen alten Wert. Punkt-/Streckgriffe und Fenster sind vorerst ausgeschlossen. Keine zweite AI-Modelllogik, kein Dateiformatwechsel.

Nachweis: 194 Tests bestanden, TypeScript und Build erfolgreich; ESLint 0 Fehler/6 bekannte Warnungen. Neue Gruppen prüfen X/Y/Elementachse, positive/negative/Nullwerte, Dezimalkomma, normierte schräge Richtung, ungültige Texte, stale Auswahl/Modell, Vorschau/Commit/Undo/Redo/JSON. Browser: +1,25 m auf X bleibt vor Bestätigung ohne Undo-Eintrag, bestätigte Lage identisch; Undo/Redo korrekt. Ungültiger Text sperrt Übernehmen. -0,375 m auf Y bleibt trotz Mausbewegung exakt; Escape im Feld stellt den bestätigten Stand wieder her. 3D-Vorschau durch gemeinsamen previewEdit-Aufruf angebunden, separat noch nicht praktisch abgenommen.

Abnahme: Wand auswählen, Element auf X-Achse wählen, 1,25 in Strecke (m) eingeben und Vorschau betrachten. Enter oder Übernehmen, danach Undo/Redo. Mit negativem Wert, ungültigem Text und Escape wiederholen. Elementachse zeigt ihre positive Richtung ausdrücklich an.

### Zurückgestellter Auftrag zugunsten Nutzerkorrektur: numerisches Strecken eines ausgewählten Punktgriffs

Die vorhandene Aktion Punkt in Flucht strecken um dieselbe Meter-Eingabe erweitern. Positive Strecke verlängert vom Nachbarpunkt weg, negative verkürzt. Bestehenden Griffversatz, Nachbarüberquerung und Fenstergrenzen respektieren; keine Änderung der Wandachsenlage N45. Die numerische Vorschau und Bestätigung müssen dieselben gepinnten Bearbeitungsaktionen nutzen. Tests für schräge Linien/Wände, ungültiges Verkürzen, Kontextwechsel und Undo/Redo sowie praktische Abnahme einschließlich 3D-Zahlenvorschau. Fensterbewegung und freie Punktbewegung bleiben außerhalb dieses Teilauftrags.


### Abschluss: kompaktes Hilfseingabefenster der Rasterengine — 03.10.2026

Nutzerkorrektur hat Vorrang vor dem zuvor geplanten Streckgriff: großes festes Streckenfeld durch ein kompaktes Hilfseingabefenster nahe der Auswahl ersetzen und freies Bewegen mit Winkel/Länge unterstützen. Umsetzung auf feat/compact-polar-input, aufbauend auf PR #38 / 86b5839. PR #38 bleibt offen; keine zusätzliche Merge-Freigabe angenommen.

PrecisionInput ist eine wiederverwendbare, modellfreie UI-Komponente (230 px breit, im normalen Zustand etwa 140 px hoch), mit verschiebbarem Kopf und Bildschirmbegrenzung wie beim On-Demand-Menü. Startposition ist die vorhandene Auswahl-/Menüposition. Zwei nebeneinanderliegende Felder: Winkel in Grad und Länge in Metern. Der gewählte Modellpunkt bleibt der gepinnte Ursprung. Winkelkonvention: 0° rechts/+X, 90° oben/+Y, gegen den Uhrzeigersinn. Die Maus liefert über den gemeinsamen Direct-Edit-Fangresolver eine Richtung; dessen Shift-/Ortho-/Referenzregeln bleiben erhalten.

Freies Bewegen hat jetzt einen ausdrücklichen Richtungswahl-Schritt: erster Klick fixiert die Richtung, erzeugt noch keinen History-Eintrag und fokussiert das Längenfeld. Winkel kann stattdessen direkt eingetragen werden. Leerer Winkel folgt der Maus, gesetzter Winkel bleibt fix; leere Länge folgt der Mausprojektion auf die feste Richtung, gesetzte Länge bleibt exakt. Maus setzt beide Eingaben zurück. Enter/Übernehmen bestätigt, Escape/Abbrechen verwirft. Negative Länge bewegt in Gegenrichtung. Dezimalkomma/-punkt werden akzeptiert, ungültige Werte sperren Bestätigung. Bei festem Winkel und leerer Länge bleibt Rückwärtsbewegung vor dem Ursprung bei Länge null; eine negative Länge kann ausdrücklich eingegeben werden.

constraints/input/polar.ts bildet als gemeinsame, React-/BIM-freie Eingabelogik den Zielpunkt aus Ursprung/Richtung/Länge. application/direct-edit/numeric.ts validiert Texte und Kontext und verwendet weiterhin previewEdit/confirm. BimPlan liefert Mausziele, das Fenster verändert kein Modell selbst. X/Y/Elementachsen bleiben Alternativen und verwenden dasselbe Fenster mit angezeigtem, nicht editierbarem Winkel. Zunächst ganze Wände/Linien; Fenster, Zeichnen und Punktstrecken noch nicht an dieses Fenster angebunden. Bestehender 3D-Vorschauadapter wird weiterverwendet; freie Richtungswahl startet in 2D. Kein Projektformat-/IFC-Wechsel, keine zweite AI-Modelllogik.

Nachweise: 198 Tests bestanden, TypeScript und Build erfolgreich, ESLint 0 Fehler/6 bekannte Warnungen. Vier neue Testgruppen: gepinnter Ursprung, Kardinal-/schräge Winkel, unabhängige Eingaben, negative Länge, fehlende/ungültige Werte, Klick auf Wandecke, unveränderte Wandmaße, stabile Auswahl/Modellprüfung und ein Undo/Redo/JSON-Rundlauf. Browser: Ecke (3;0,18), Maus nach oben, Klick fixiert 90° und fokussiert Länge; 1,25 m verschiebt die ganze Wand exakt auf y=1,25. Kein History-Eintrag vor Bestätigung, Undo/Redo geprüft. Direkte Eingabe 0°/2 m bleibt bei Mausbewegung unverändert; ungültiger Winkel sperrt Bestätigung; Escape erhält bestätigten Stand. Fenster nahe der Auswahl und per Tastatur am Kopf verschoben. Keine separate praktische 3D-Abnahme in diesem Schritt.

### Abgeschlossener Auftragsumfang: Hilfseingabe für Punkt in Flucht strecken

Dasselbe kompakte Fenster an die bestehende Streckgriff-Aktion anbinden. Die gewählte Fluchtrichtung bleibt fest; positive Länge verlängert, negative verkürzt. Griffversatz, Nachbarüberquerung und Fenstergrenzen müssen unverändert über die gemeinsame Modellaktion validiert werden. Tests für schräge Wände/Linien, unzulässiges Verkürzen, stale Kontext, Escape/Undo/Redo und praktische Prüfung auch der abgeleiteten 3D-Zahlenvorschau. Kein separates Eingabefenster pro Werkzeug; Zeichnen und Fensterbewegung bleiben spätere Verbraucher.


### Bedienkorrektur: Hilfslinien im freien Bewegen und Winkelgrenzen — 03.10.2026

Ergänzung zu PR #39: Der gepinnte Bewegungsursprung ist während Element frei bewegen automatisch eine sitzungsgebundene Referenz der gemeinsamen Engine, mit Kantenrichtung und Lot sowie den bestehenden Winkelführungen. Er bleibt während der Eingabe aktiv; weitere externe Quellen können weiterhin per Hover erworben werden. Eigene Modellgeometrie bleibt vom Fang ausgeschlossen, nur der explizite Ursprung ist als temporäre Konstruktion zugelassen. Der Ursprung ist nicht per Hover lösbar und beansprucht keinen der vier externen Hoverplätze; Ende/Abbruch der Sitzung entfernt ihn. Snap aus deaktiviert weiterhin das Fangen. Keine Geometriekopie, kein Dateiformateintrag.

Winkeleingaben außerhalb 0° bis einschließlich 360° werden jetzt in der gemeinsamen polaren Eingabelogik abgelehnt, nicht mehr modulo umgerechnet. 360° entspricht 0°; negative Bewegungsstrecken bleiben erlaubt. Ungültiger Text bleibt zur Korrektur im Feld, erzeugt eine Fehlermeldung und sperrt Übernehmen.

Nachweise: 199 Tests bestanden, TypeScript und Build erfolgreich; ESLint 0 Fehler/6 bekannte Warnungen. Regression prüft Ursprung als Führungsquelle bei weiter ausgeschlossenem Eigenmodell und Grenzen -1/360,01/566 versus 0/360. Browser: ausgewählte Ecke (3;0,18) erzeugt sofort eine Lot-Hilfslinie während freier Bewegung; diese bleibt bei der Winkeleingabe sichtbar. 566° sperrt Bestätigung, 90° mit Länge 2 m zeigt korrekte Vorschau. Abbrechen entfernt temporären Ursprung und Hilfslinie. Der nächste begrenzte Folgeauftrag bleibt Hilfseingabe für Punkt in Flucht strecken.


### Abschluss: numerisches Strecken mit gemeinsamer Hilfseingabe — 03.10.2026

PR #38 und #39 wurden nach Nutzerfreigabe in Reihenfolge normal in ihre bisherigen Zielzweige übernommen (5681992 und 16beed6). Neuer Zweig feat/numeric-point-stretch basiert auf 16beed6. main bleibt unverändert.

Punkt in Flucht strecken verwendet jetzt dasselbe kompakte Hilfseingabefenster wie die Bewegung. Winkel ist an die vorhandene Fluchtrichtung gebunden; positive Meter verlängern vom Nachbarpunkt weg, negative verkürzen. Der angeklickte Wandeck-Griff bleibt Ursprung, einschließlich seines Versatzes zur Wandachse. Die Application-Eingabe erweitert nur die zugelassenen Aktionen und verwendet weiterhin previewEdit/confirm; kein zusätzlicher Transformationscode, kein neues Fenster. Vorhandene Grenzen für Nachbarüberquerung und Fensterbreite bleiben wirksam. Kontextwechsel und ungültige Eingabe verhindern Übernahme.

In geteilten Ansichten bleibt eine vorhandene 3D-Ansicht beim Start der 2D-Bearbeitung erhalten. Damit sind dieselben numerischen Entwürfe gleichzeitig in Grundriss und 3D sichtbar; in Einzelansicht wird weiterhin zur 2D-Bearbeitung gewechselt. Eigenschaften/Navigator zeigen bis zur Bestätigung den gespeicherten Stand.

Nachweise: 201 Tests bestanden, TypeScript/Build erfolgreich, ESLint 0 Fehler/6 bekannte Warnungen. Zwei neue Testgruppen prüfen positive/negative Strecken an beiden Enden schräger Linien/Wände, unveränderten Gegenpunkt, Griffversatz, Fenstergrenzen, Nachbarüberquerung, fehlenden Griff, stale Modell/Auswahl, einen Commit/Undo/Redo/JSON sowie Abbruch. Browser: 3-m-Wand über Endgriff um 1,25 m auf 4,25 m verlängert, Vorschau in 2D und 3D visuell geprüft; Eigenschaften vor Commit weiter 3 m. Ungültige Verkürzung -2 m bei vorhandenem 1,20-m-Fenster gesperrt. Commit 4,25 m, Undo 3 m, Redo 4,25 m. Anschließend -0,5 m ergibt 3,75-m-Vorschau, Escape stellt 4,25 m wieder her. Die noch ausstehende praktische 3D-Zahlenvorschauabnahme ist damit erledigt.

Abnahme: Wandecke oder Linienpunkt anklicken → Punkt in Flucht strecken → 1,25 eingeben → Vorschau prüfen und übernehmen. Mit negativer Strecke verkürzen; unzulässige Werte dürfen nicht übernommen werden. Für gleichzeitige 3D-Prüfung vorher Zwei Ansichten und 3D aktivieren, dann den Griff im Grundriss wählen.

### Abgeschlossener Auftrag: gemeinsame Hilfseingabe beim Zeichnen einer geraden Linie

Das vorhandene Hilfseingabefenster nach Setzen des ersten Linienpunkts aktivieren. Ursprung bleibt der erste Punkt; Maus/Fangengine bestimmen die Richtung oder Winkel/Länge werden ausdrücklich eingegeben. Gemeinsame polare Eingabe und vorhandene validierte Linienerzeugung verwenden; keine zweite Zeichenlogik. Zunächst einzelne gerade Linien, keine Polylinien oder weiteren Bauteile. Prüfen: Maus versus fixierte Werte, 0–360°, ungültige/Null-Länge, Escape ohne Bauteil, ein Commit/Undo/Redo und JSON; praktische Browserabnahme. Wandachsenlage N45 und Fensterbewegung bleiben spätere Aufgaben.


### Abschluss: gemeinsame Eingabe statt Werkzeugkopien — 03.10.2026

PR #40 wurde nach Nutzerfreigabe normal in feat/numeric-axis-move übernommen (053b631). Der neue Zweig feat/shared-line-precision basiert darauf; main unverändert.

Nach dem ersten Punkt einer geraden Linie erscheint das vorhandene Hilfseingabefenster nahe dem Punkt. Zwei Klicks zeichnen weiterhin mit der Maus; alternativ Winkel/Länge eingeben und Enter/Übernehmen verwenden. Fixierte Werte haben Vorrang vor Mausfang. Maus leert beide Felder. 0–360°, Dezimalkomma und negative gerichtete Längen verwenden dieselbe polare Auswertung wie Bewegung. Null-Länge, ungültige Werte und geänderter Modellkontext verhindern Übernahme. Escape/Abbrechen verwirft den Entwurf.

Architektur: Ein PrecisionInput und ein usePrecisionDraft für alle angeschlossenen Aktionen. application/input/precision.ts verbindet den zentralen Textparser mit constraints/input/polar.ts; application/drawing/line-input.ts prüft die Zeichengrenzen. Bestehendes addLine und gemeinsame History übernehmen das Modell. Keine zweite Linienerzeugung, keine neue Projektstruktur. Der bisherige Parserexport bleibt kompatibel. Noch bestehende Zeichenkoordination in CadWorkspace wird schrittweise migriert.

Nachweise: 204 Tests bestanden, TypeScript/Build erfolgreich, ESLint 0 Fehler/6 bekannte React-Refresh-Warnungen. Neue Tests prüfen gemeinsame Auswertung, exakte Werte trotz anderer Mauslage, Mauswinkel, Dezimalkomma, 360°, negative Länge, ungültige Winkel/Zahlen, Null-Länge, stale Modell und einen Commit/Undo/Redo/JSON-Rundlauf. Browser: Linie ab (0;1) mit 0°/1,25 m bleibt bei Mausbewegung exakt; 566° und Null-Länge sperren Übernahme. Commit erzeugt genau eine Linie, Undo entfernt und Redo stellt sie wieder her. Neue Zeichensitzung und Wechsel zu freier Wandbewegung starten mit leeren Feldern. Escape erzeugt keine zusätzliche Linie. Freie Wandbewegung fixiert per Klick weiterhin 90°, fokussiert Länge und zeigt Ursprungshilfslinie.

Praktische Abnahme: Linie wählen → ersten Punkt setzen → Winkel 45 und Länge 2 eingeben → Vorschau prüfen → Enter → Undo/Redo. Danach 566° beziehungsweise Länge 0 und Escape testen. Polylinien und andere Zeichenwerkzeuge sind noch nicht angeschlossen.

### Abgeschlossener Folgeauftrag: gemeinsame Hilfseingabe beim Zeichnen einer geraden Wand

Den geprüften Eingabebaustein nach dem ersten Wandpunkt verwenden. Vorher die gemeinsame Zeichenkoordination für Linie/Wand begrenzt hinter einen Application-Adapter ziehen, damit CadWorkspace keine zweite Eingabelogik erhält. Bestehendes addWall, Fangengine und History wiederverwenden. Vorschau und Commit mit 3,00 m Länge, 0,36 m Stärke und 2,80 m Höhe prüfen, einschließlich Winkel, Null-Länge, Abbruch, Undo/Redo, JSON und 2D/3D. Keine Wandketten, Anschlüsse oder Änderung der Wandachsenlage N45 in diesem Teilauftrag.


### Nutzerkorrektur: sofortiger Konstruktionsursprung bei jeder Bewegung — 03.10.2026

Vorrangige Korrektur auf fix/shared-movement-origin, aufbauend auf dem noch offenen PR #41. Ursache: editOriginReference war nur für Element frei bewegen zugelassen; die übrigen Aktionen verwendeten zwar den Resolver, erhielten aber keinen sofort gepinnten Ursprung. Diese Aktions-/Fensterausnahme ist zentral entfernt. Punkt frei bewegen, Strecken, X/Y/Elementachse und Fensterbewegung erhalten jetzt denselben unmittelbaren Ursprung. Fenster behalten die Wandrichtung, feste Achsen bleiben verbindlich und Eigenmodell/Host bleiben von externen Fangquellen ausgeschlossen.

Verbindlicher Zukunftswunsch in ARCHITECTURE.md und AGENTS.md: jede Bewegung jedes späteren Elements (auch Decken, Dächer, Treppen, Möbel) startet über denselben Konstruktionsursprung und die gemeinsame Engine. Keine zusätzliche 0,6-s-Wartezeit für den bereits ausgewählten Ursprung; weitere Referenzen behalten die Hover-Regeln. 3D-Arbeitsebenen und noch nicht vorhandene Bauteile sind damit Anforderungen, keine bereits implementierten Funktionen.

Nachweise: 206 Tests bestanden, TypeScript/Build erfolgreich, ESLint 0 Fehler/6 bestehende Warnungen. Regressionen prüfen alle sechs Aktionen für Wand und Linie, gewählten Eckversatz, Eigenmodell-Ausschluss, freie Hilfslinie, Achsbindung, Abbruch ohne History sowie Fensterursprung/Hostbindung. Browser: Wandecke → Punkt frei bewegen zeigt sofort den Referenzring bei (3;0,18), danach senkrechte Referenzhilfslinie zur Maus. Zoom erhält den Ring, Escape entfernt ihn.

Abnahme: Wandecke oder Linienpunkt anklicken → Punkt frei bewegen → Maus nach oben oder diagonal führen. Ursprung muss sofort als Ring sichtbar sein, die Hilfslinien folgen der Maus. Zoom und Abbruch prüfen. Dasselbe bei Strecken und Achsbewegung wiederholen. Der einzige nächste ausführbare Folgeauftrag bleibt die oben beschriebene gemeinsame Hilfseingabe beim Zeichnen einer geraden Wand.


### Nutzererweiterung: Linien verfolgen und Tab-Hilfseingabe — 03.10.2026

Umsetzung auf feat/parallel-hover-tab-input, aufbauend auf dem offenen PR #42. Gerade Linien-/Polyliniensegmente und Wandachsen können entlang ihres Inneren nach 0,6 s als Richtungsreferenz erfasst werden. Die Mitte markiert die stabile Segmentreferenz, die erfasste Linie ist zusätzlich gestrichelt hervorgehoben. Erneutes Verlassen/Anhovern und 0,6 s löst sie wie andere Referenzen. End-/Mittel-/Schnittpunkte behalten Fangvorrang, maximal vier externe Quellen bleiben bestehen.

Die erfassten Richtungen stehen an aktiven Bezugspunkten, insbesondere Bewegungs- und Linienzeichenursprüngen, als Parallelen bereit. Hilfslinie und Fangmeldung Parallel verwenden denselben Resolver. Segmenterfassung sitzt in constraints/inference/segment-hover.ts, Segmentdaten im vorhandenen Projektadapter, Darstellung/Timer in den gemeinsamen Komponenten. Kein dauerhafter Modelleingriff.

Tab wird im gemeinsamen PrecisionInput behandelt: Maus führt Richtung → Tab fokussiert Länge und übernimmt die ungerundete Richtung → Tab Winkel → Tab Länge. Enter bestätigt, Escape verwirft; andere Textfelder bleiben unbeeinflusst, Achswinkel bleiben schreibgeschützt. Punkt frei bewegen verwendet nun ebenfalls die gemeinsame Winkel-/Längeneingabe; seine bisherige Mausbestätigung bleibt verfügbar.

Nachweis: 209 Tests bestanden, TypeScript und Build erfolgreich, ESLint 0 Fehler/6 bestehende Warnungen. Tests: 599/600-ms-Grenze, stabiles Segment bei kleiner Mausbewegung, einmalige Aktivierung und erneutes Lösen, bildschirmbezogener Abstand bei mehreren Zoomstufen, Segmentgrenzen, schräge Parallele an anderem Ursprung, Snap aus/Quelle entfernt sowie numerische Punktbewegung mit unverändertem Gegenpunkt und Undo. Browser: schräge 30°-Linie durch Hover erfasst; beim Linienzeichnen Parallele mit eindeutiger Fangmeldung am neuen Ursprung. Tab übernimmt 30° und fokussiert Länge. Freie Wandeckbewegung: Tab Länge bei 90°, Tab Winkel, Tab Länge; 1 m/Enter verändert nur den gewählten Endpunkt, Undo stellt die 3-m-Wand wieder her. Escape geprüft.

Abnahme: schräge Linie zeichnen → neue Linie beginnen oder Bewegung starten → über ein fremdes Liniensegment 0,6 s verweilen → vom Ursprung ungefähr parallel führen → Parallel-Hilfe prüfen → Tab → Länge eingeben → Tab → Winkel prüfen/ändern → Enter. Bei Achsbewegung muss der Winkel fest bleiben. Der nächste begrenzte Folgeauftrag bleibt gemeinsame Hilfseingabe beim Zeichnen gerader Wände.


### Abschluss: gemeinsame Hilfseingabe für gerade Wände — 03.10.2026

Auf feat/shared-wall-precision, basierend auf dem noch offenen PR #43. PR #41–43 bleiben ohne neue Freigabe offen. Nach dem ersten Wandpunkt erscheint dasselbe PrecisionInput wie bei Linie/Bewegung. Ursprung, Parallelreferenzen, Tab Länge/Winkel, feste Zahlen, Maus, Enter und Abbruch werden gemeinsam verwendet. Wandstärke 0,36 m und Höhe 2,80 m bleiben die bisherigen Zeichenstandardwerte; nachher über Eigenschaften änderbar.

Die Application-Aktion createDrawing bündelt Wand-/Linien-/Polylinienerzeugung, prüft veralteten Modellkontext und verwendet bestehende addWall/addLine-Validierung. Die UI koordiniert weiter Punktaufnahme und Commit, enthält aber keine separaten Bauteilerzeugungsaufrufe mehr. previewDrawingInput ersetzt den linienspezifischen Eingabeadapter bei kompatiblem altem Export. Kein zusätzliches Eingabefenster oder Winkelalgorithmus.

Nachweise: 212 Tests bestanden, TypeScript/Build erfolgreich, ESLint 0 Fehler/6 bestehende Warnungen. Neue Tests für exakte Wand 3,00 × 0,36 × 2,80 m, 3D-Grenzen, Vorschau ohne Mutation, einen Commit/Undo/Redo/JSON, Null-Länge, falsche Winkel/Maße, stale Modell und erhaltene Linien-/Polylinienstile. Browser: Ursprung (0;1), Richtung mit Tab übernommen, 0°/3,00 m bleibt bei Mausbewegung exakt; 0 m und 566° sperren Übernahme. Bestätigte Eigenschaften 3/0,36/2,8; Undo entfernt, Redo stellt Wand wieder her. Neue Sitzung hat leere Felder; Abbrechen entfernt Hilfseingabe ohne Wand. Anschließende 3D-Darstellung visuell geprüft. Vorschau beim Zeichnen bleibt eine 2D-Achslinie; kein neuer 3D-Zeichenvorschaumodus.

Abnahme: Wandwerkzeug → Startpunkt → Maus nach rechts → Tab → 3,00 → Enter. Eigenschaften und 3D prüfen, Undo/Redo. Neuer Startpunkt, 0 beziehungsweise 566° testen und Escape/Abbrechen. Keine Wandketten, Anschlüsse oder Änderungen der Wandachsenlage.

### Zurückgestellt zugunsten Architekturkorrektur: gemeinsame Hilfseingabe für Polyliniensegmente

Die vorhandene Eingabe nach jedem gesetzten Polylinienpunkt an dessen Ursprung binden. Enter fügt den numerisch bestimmten nächsten Punkt hinzu; Doppelklick schließt weiterhin die gesamte Polylinie ab. Die bisherige eine History-Aktion pro abgeschlossener Polylinie erhalten. Tab, Parallelführung, Abbruch, ungültige/Null-Segmente, Abschluss und Undo/Redo prüfen. Keine Wandketten-Undo-Entscheidung vorwegnehmen und keine zweite Eingabe-/Fanglogik.


### Abschluss: gemeinsame Interaktionssteuerung statt weiterer UI-Sonderfälle — 03.10.2026

Nutzerfreigabe betrifft den begrenzten Architekturumbau. Keine Freigabe für Merge der offenen PRs #41–44 abgeleitet. Umsetzung auf refactor/shared-tool-interaction, aufbauend auf PR #44.

Bestandsaufnahme: Fang-/Hilfslinienservices, Polarberechnung und PrecisionInput waren bereits gemeinsam. CadWorkspace enthielt aber die Auswahl der numerischen Bearbeitungsart, Fehlerbehandlung und getrennte Zeichen-/Edit-Bestätigung direkt. BimPlan entschied zusätzlich anhand der konkreten EditAction über Richtungswahl.

Jetzt: ToolInteraction als typisierter Application-Vertrag, zwei kleine Adapter für vorhandene Edit-/Zeichenaktionen, eine gemeinsame Auswertung und erneute Validierung vor Commit. useToolInteraction steuert Entwurf, Vorschau, Mauswahl, Richtungsfixierung, Bestätigen und Abbrechen; InteractionInput bindet einmalig die vorhandene Tab-/Feldbedienung an. Der Workspace reicht Ursprung/Kontext und Modellaktionen weiter. Escape/Werkzeug-/Auswahlwechsel verwenden denselben Reset für Bearbeitung und Zeichenpunkte. Der Viewport trifft keine EditAction-spezifische Richtungswahl mehr. Kein neuer Fangalgorithmus und keine parallele Modellhaltung.

Nachweise: 215 Tests bestanden, TypeScript/Build erfolgreich, ESLint 0 Fehler/6 bestehende Warnungen. Neue Vertragsprüfungen führen Wand-/Linienerzeugung sowie alle sechs Editaktionen an Wand/Linie über denselben Ablauf; Vorschau ohne History, ein Commit und Undo, ungültige/stale Bestätigung ohne Mutation. Browserregression: Wand 3 m per Tab, Elementbewegung mit Klick-Richtung 90° und 0,5 m, Punktbewegung 90°/1 m, ungültiges Strecken -2 m mit Fenster gesperrt, Escape, neue Linie mit leeren Feldern, 2-m-Linie und Undo/Redo.

Einschränkung: Punktaufnahme und einige bestehende Viewport-/History-Anbindungen sind noch Legacy-Koordination; der gesamte zukünftige CAD-Werkzeugrahmen ist damit nicht fertig. Die aktuell angeschlossene Eingabe-/Bestätigungslogik läuft jedoch über einen gemeinsamen Vertrag. 3D-Arbeitsebenen, neue Bauteile und Polylinienpräzision wurden nicht zusätzlich implementiert.

### Abgeschlossener Folgeauftrag: Polylinie als Vertragsnachweis

Die vorhandene Polylinie als weiteren Verbraucher des gemeinsamen Interaktionsvertrags anbinden. Pro Segment den aktuellen Punkt als Ursprung bereitstellen; dieselbe Eingabe, Tab, Fangengine und Bestätigung unverändert nutzen. Doppelklick beendet weiterhin die Polylinie, ein Undo-Schritt für den Gesamtabschluss bleibt erhalten. Prüfen, dass dazu keine zusätzliche Feld-/Tab-/Hover-Steuerung oder neue Werkzeugabfrage im gemeinsamen Interaktionskern nötig ist. Neue Punktaufnahme, Abschluss und Abbruch mit numerischen Segmenten praktisch testen; keine Wandkettenentscheidung vorwegnehmen.


### Abschluss: Polylinie verwendet unveränderten Interaktionskern — 03.10.2026

Auf feat/polyline-shared-interaction, basierend auf offenem PR #45; keine Merge-Freigabe angenommen. Für die Polylinie wird nun der jeweils letzte Entwurfspunkt als Ursprung an den vorhandenen drawingInteraction-Adapter übergeben. ToolInteraction, useToolInteraction, PrecisionInput, Tab-/Hover-/Parallelsteuerung wurden nicht verändert. Nach jedem numerisch bestätigten Segment ist der nächste Ursprung aktiv und die Eingabe leer. Bis zum Abschluss bleibt die Polylinie ein Entwurf.

Enter im Eingabefeld ergänzt einen Punkt. Doppelklick beziehungsweise Enter im Grundriss schließt wie bisher die gesamte Polylinie ab. Ungültige explizite Eingaben sperren auch den Gesamtabschluss, statt stillschweigend verworfen zu werden. Escape/Abbrechen verwirft den ganzen Entwurf; bestätigte Elemente bleiben erhalten.

Nachweise: 217 Tests bestanden, TypeScript/Build erfolgreich, ESLint 0 Fehler/6 bestehende Warnungen. Neue Vertragsprüfungen für mehrere numerische Segmente mit wechselndem Ursprung, leere nächste Eingabe, ungültige/Nullwerte, kein Modell/History vor Abschluss, genau einen Commit und Undo/Redo sowie Abbruch. Browser: 3 m rechts und 2 m oben erzeugen Entwurf mit drei Punkten, Doppelklick am Endpunkt ergibt eine 5-m-Polylinie. Ein Undo entfernt sie, Redo stellt sie wieder her. Weiterer Entwurf mit 566° sperrt Übernehmen und Doppelklickabschluss; Escape verwirft nur diesen Entwurf.

Abnahme: Linie → Zeichenmodus Polylinie → Startpunkt → Maus nach rechts → Tab → 3 → Enter. Winkel 90 und Länge 2 → Enter. Am letzten Punkt doppelklicken, dann Undo/Redo prüfen. Bei der nächsten Polylinie ungültigen Winkel und Escape prüfen.

### Abgeschlossener Folgeauftrag: gemeinsamen Fangkontext an den Werkzeugvertrag anbinden

Den noch in BimPlan zwischen Zeichnen und Direct Edit verzweigten Aufbau von Ursprung, ausgeschlossenen Quellen und Fangabfrage hinter den vorhandenen Werkzeugvertrag führen. Bestehende querySnap/resolveEditSnap-Services weiterverwenden. Nachweis für Punkt-/Elementbewegung, feste Achsen, Fensterbindung und Zeichnen; Referenzen müssen Zoom überstehen und bei Kontextwechsel korrekt enden. Keine neue Fangmathematik oder UI-Funktion, kein neues Bauteil. Dies vervollständigt gezielt die gemeinsame Anbindung anstelle weiterer werkzeugweiser Sonderfälle.


### Abschluss: ein Fangkontext für Zeichnen und Bewegung — 03.10.2026

Auf refactor/shared-snap-context, basierend auf offenem PR #46. ToolInteraction enthält jetzt verpflichtend die Fangrichtlinie aus Ursprung, Quellenfilter und Resolver. Application-Funktionen prepareToolReferences/resolveToolSnap bilden den gemeinsamen Einstieg. BimPlan liefert Maus, Maßstab, Modifier und aktive Referenzen, ohne getrennte Zeichen-/Edit-Fangkontexte oder eigene Auswahl der auszuschließenden Elemente. Bestehende querySnap/resolveEditSnap bleiben zuständig für Geometrie und Achs-/Hostbindung.

Die Richtlinie bleibt für dieselbe unveränderliche Sitzung beziehungsweise denselben Entwurfspunkt identisch. Zoom, Kamerabewegung und Eingabetext erzeugen daher keinen neuen Referenzsatz; neuer Ursprung/Sitzung oder neues Projekt erzeugen den passenden Kontext. Ableitungen liegen in schwachen Caches und enthalten keine eigenständige bearbeitbare Modellkopie.

Nachweise: 220 Tests bestanden, TypeScript/Build erfolgreich, ESLint 0 Fehler/6 bekannte Warnungen. Neue Tests vergleichen alle Editaktionen an Wand/Linie sowie Fensterbewegung mit dem bisherigen Resolver, einschließlich Eigenmodell-/Host-Ausschluss, Snap aus, Shift und Ortho. Weitere Prüfungen für stabile Richtlinienidentität, Sitzungswechsel, Zeichnen und Idle-Fang. Browser: Wandecke zeigt sofort Ursprung und Lot-Hilfe; Zoom und Zahleneingabe erhalten den Ring, Escape entfernt ihn. Neuer Linienursprung aktiv, 45°/2 m erfolgreich bestätigt. Anschließende externe Linienreferenz auch nach Zoom erhalten.

Abnahme: Wandecke → Punkt frei bewegen → Maus nach oben → Zoom → Tab/Länge → Escape. Ursprung und Hilfslinie dürfen nicht durch Zoom verschwinden, müssen nach Abbruch verschwinden. Danach Linie zeichnen und fremde Referenz verfolgen.

### Abgeschlossener Folgeauftrag: Sitzungswechsel bei History und Projektladen absichern

Den gemeinsamen Interaktions-/Fangkontext bei Undo/Redo und Projektwechsel während einer laufenden numerischen oder mausgeführten Aktion prüfen. Alte Ursprünge, fixierte Werte und Referenzen dürfen weder in das neue Projekt gelangen noch einen alten Entwurf bestätigen. Fehlverhalten gezielt korrigieren; bestehende Modellaktionen und Projektdateien beibehalten. Regressionen und praktische Abnahme mit Bewegung und Polylinienentwurf; keine neue Bauteilfunktion.


### Abschluss: History-/Projektwechsel und modale Tastaturzuständigkeit — 03.10.2026

Auf fix/interaction-project-transitions, basierend auf offenem PR #47. Die bestehende gemeinsame Reset-/History-Steuerung entfernt laufende Bearbeitungen bei Undo/Redo und bestätigtem Laden bereits korrekt. Ein reproduzierter Fehler lag in der Tastatursteuerung: Tab des Hilfseingabefensters griff im Hintergrund des Ladedialogs ein; dessen Fokus blieb auf Abbrechen statt auf Projekt laden zu wechseln.

Korrektur im gemeinsamen PrecisionInput: modaler Dialog/Alertdialog außerhalb des eigenen Panels behält Tab. Auch globale Workspace-Werkzeugkürzel ignorieren modale Inhalte. Keine separate Lösung für einzelne Werkzeuge. Abgebrochene Ladebestätigung erhält den bisherigen Entwurf; bestätigtes Laden verwirft ihn.

Nachweise: 222 Tests bestanden, TypeScript/Build erfolgreich, ESLint 0 Fehler/6 bekannte Warnungen. Neue Regressionen für Undo/Redo/Projektwechsel mit altem Edit-Token, auch nach Rückkehr zum ursprünglichen Modell; niemals Mutation durch alte Bestätigung. Alte Polylinienentwürfe werden im neuen Projekt abgewiesen. Browser: Punktbewegung 90°/1 m → Ladebestätigung abbrechen erhält Felder. Erneut laden → Tab fokussiert Projekt laden → Enter lädt 5-m-Wand mit gleicher Wand-ID; keine alten Felder/Ringe. Undo zeigt ursprüngliche 3-m-Wand ohne Bearbeitung, Redo 5 m. Polylinienentwurf wird bei Undo vollständig verworfen, neue Sitzung hat leere Felder. Laden während weiterem Polylinienentwurf (auch identisches Projekt) entfernt Entwurf, Ring und Eingabefenster; keine zusätzliche Linie.

Abnahme: laufende Punktbewegung oder Polylinie beginnen → Projektdatei öffnen → Tab/Abbrechen prüfen; danach erneut öffnen und Tab/Enter laden. Undo/Redo darf nur bestätigte Modelle zurückbringen, keine alten Entwürfe.

### Abgeschlossener Folgeauftrag: offene PR-Kette geordnet zur Übernahme vorbereiten

Die aufeinander aufbauenden PRs ab #41 einschließlich dieses Stabilisierungsschritts auf Zielzweige, Abhängigkeiten und offenen Prüfstatus kontrollieren. Einen verständlichen Übernahmeplan mit finalem Entwicklungsstand und verbleibenden Einschränkungen erstellen. Bereits vorhandene Testnachweise zuordnen; zusätzliche Prüfung nur bei neuen Abweichungen. Keine neuen Funktionen und kein automatischer Merge ohne ausdrückliche Nutzerfreigabe für die betreffenden PRs.

### Abschluss: konsolidierter Hauptzweig und exakte Wandaußenecke — 03.10.2026

PR #49 wurde nach Nutzerfreigabe normal nach main übernommen (44fc036); PR #27 damit übernommen, #28/#30/#31/#33 als inhaltlich enthalten geschlossen. Die veröffentlichte Historie bleibt erhalten.

Auf fix/wall-corner-target wird die bekannte Eckabweichung korrigiert. Ein vor der Änderung fehlschlagender Test zeigt: Der bisherige Achsendpunktversatz trifft bei Drehung nicht die ausgewählte Außenecke. Jetzt bestimmt eine fachunabhängige Geometriefunktion den Segmentendpunkt aus festem Gegenpunkt, Ziel und vorzeichenbehaftetem seitlichem Abstand. Der vorhandene Direct-Edit-Adapter erkennt die beiden Eckgriffe am gewählten Wandende und verwendet diese Berechnung ausschließlich bei freier Punktbewegung. Derselbe Weg gilt für Maus und Hilfseingabe; keine zusätzliche Fang-, Tab- oder UI-Logik.

Fest bleiben der gegenüberliegende Achsendpunkt, Stärke, Höhe und relative Fensterpositionen. Nicht beide gegenüberliegenden Außenecken: Sie drehen sich geometrisch um den festen Achsendpunkt. Ziele innerhalb oder auf dem Kreis mit Radius halber Wandstärke um den festen Endpunkt sind nicht als positive Wandlänge erreichbar und werden abgewiesen. Bestehende Fenster- und Modellvalidierung bleibt nachgeschaltet. Achspunktbewegung, Strecken und ganze Elementbewegung behalten ihre Regeln. Keine Entscheidung zum späteren Wechsel der Wandachsenlage oder zu Wandanschlüssen.

Nachweis: 225 Tests bestanden, TypeScript und Build erfolgreich, ESLint 0 Fehler/6 bekannte React-Refresh-Warnungen. Alle vier Ecken auf gedrehten und umgekehrten Wänden, unveränderte Vorschau am Ursprung, unerreichbare Ziele, Fensterkonflikte, Maus-/Zahlenparität, ein Commit, Undo/Redo, Abbruch, 3D-Eckkoordinaten und JSON-Rundlauf geprüft. Browser: Ende links bei (3; 0,18), Punkt frei bewegen, 90°/1 m ergibt physische Ecke (3; 1,18), Undo (3; 0,18), Redo (3; 1,18). Bestehender Fenster-Mittelpunkt bleibt 0,5.

Abnahme: Beispielwand auswählen → Wandecke Ende links → Punkt frei bewegen → Winkel 90 und Länge 1 → Übernehmen. Die Ecke bewegt sich senkrecht um einen Meter; die Achse darf sich dafür seitlich anpassen. Undo/Redo prüfen. Anschließend einen externen Fangpunkt als Ziel verwenden und die Übereinstimmung der Ecke kontrollieren.

### Abgeschlossener Folgeauftrag: Eckkontakt mit externen Fangzielen praktisch absichern

Die korrigierte freie Wandecke mit Endpunkt-, Mittelpunkt- und Hilfslinienschnittpunktfang im Browser prüfen, jeweils Vorschau/Commit, Zoom, Abbruch und Undo vergleichen. Die bereits gemeinsame Engine verwenden, keine weitere Fangart oder Wandverbindung ergänzen. Bei Abweichungen gezielt den bestehenden Adapter korrigieren; danach die Abnahme und verbleibende Grenzen dokumentieren.


### Abschluss: externe Fangziele an Wandaußenecke — 03.10.2026

PR #50 nach ausdrücklicher Freigabe normal nach main übernommen (91e4095). Separater Browser-Testtab, Nutzerprojekt unverändert. Testdatei: Wand (0;0)–(3;0), Stärke 0,36 m, externe Linie (4;1)–(6;1).

Endpunkt: Fangmeldung Endpunkt, bestätigte Außenecke (4;1); Undo (3;0,18), Redo (4;1). Mittelpunkt: Fangmeldung Mittelpunkt vor und nach Zoom, bestätigte Ecke (5;1). Hilfslinien: beide Linienenden nach 600 ms erfasst, zwei diagonale Führungen bilden Schnittpunkt (5;2), sichtbare Schnittpunktmeldung und passende Wandvorschau. Nach Verweilen wird der Schnittpunkt selbst zur Referenz; vier Ringe einschließlich Ursprung bleiben nach Zoom erhalten. Bestätigung ergibt Ecke (5;2) bis auf Gleitkommarundung < 1e-14 m. Weiterer Bewegungsentwurf zum Endpunkt und Abbrechen erhält (5;2); Undo ergibt ursprüngliche Ecke, Redo wieder (5;2). Keine Browser-Konsolenfehler.

Kein zusätzlicher Anwendungsfehler gefunden, keine Codeänderung. Bestehende 225 Tests, TypeScript-/Build-Nachweise und 6 bekannte Lint-Warnungen gelten für den unveränderten Anwendungscode; keine Wiederholung dieser Prüfungen im reinen Abnahmeschritt. Browsernachweise ergänzen die automatisierten Geometrie-/History-Prüfungen aus PR #50. Kein Nachweis für 3D-Arbeitsebenen oder Wandanschlüsse.

Abnahme: Eine Linie neben der Wand zeichnen, Wandecke frei bewegen und Endpunkt/Mittelpunkt anfahren. Beide Linienenden jeweils 0,6 s erfassen, diagonale Hilfslinien zum gemeinsamen Schnittpunkt führen, zoomen und bestätigen. Undo/Redo und Abbrechen prüfen.

### Abgeschlossener Folgeauftrag: Lastmessung der gemeinsamen Fangengine

Reproduzierbare Testprojekte mit 100, 1000 und 5000 geraden Elementen erzeugen. Auf dokumentierter Laufzeit/Hardware getrennt Aufbau der Modellreferenzen und reine Fangabfrage für Zeichnen/Direct Edit messen, einschließlich aktiver Hilfsreferenzen und Modellwechsel. Warm-up, Wiederholungen und Median/P95 dokumentieren; Zeiten nicht als allgemeine Leistungszusage oder vollständige Browser-Framerate ausgeben. Vorhandene Dienste unverändert messen, keine vorsorgliche Index-/Cache-Neuentwicklung. Einen nachgewiesenen Engpass oder das Ausbleiben eines solchen festhalten und daraus den nächsten begrenzten Auftrag ableiten.


### Abschluss: Fang-Baseline — 03.10.2026

Reproduzierbarer Messlauf mit 100/1000/5000 Elementen abgeschlossen. Skript scripts/benchmark-snapping.mjs; Verfahren, Hardware, Ergebnisse und Einschränkungen unter docs/performance/SNAP_BASELINE.md, Rohwerte in der benachbarten JSON-Datei. Referenzzahlen und Modellwechsel geprüft; ESLint für das Messskript und git diff --check erfolgreich. Anwendungscode unverändert, daher bestehende 225 Tests und Build-Nachweise nicht erneut ausgeführt. PR #51 bleibt zur Dokumentationsprüfung offen; dieser Schritt baut darauf auf.

Bei 5000 Elementen: Aufbau Median 3403 ms, Neuaufbau nach Modellwechsel 4094 ms; Zeichnen/Direct Edit mit vier Referenzen 35,67/39,79 ms pro Abfrage. Keine Browser-Framerate-Aussage. Vollständige Segmentpaarprüfung als klar begrenzter erster Engpass identifiziert; keine Optimierung in diesem Messauftrag.

### Nach vorgezogenem Wiederverwendungsschritt fortzuführen: räumliche Vorauswahl für Segmentschnittpunkte

Die vollständige Paarprüfung in segmentIntersectionReferences durch eine konservative räumliche Vorauswahl ergänzen, die sichere Nichttreffer aussortiert. Exakte Schnittprüfung, Toleranzen, stabile Ergebnisreihenfolge und Quellenabhängigkeiten bewahren. Differentialtests gegen die bisherige Vollprüfung einschließlich Rand-/Entartungsfällen und Quellenausschlüssen, anschließend identische Baseline wiederholen. Keine gleichzeitige Pointer-Fangoptimierung oder neue Werkzeuge. Grenzen bei dicht überlappenden Segmenten dokumentieren.


### Abschluss: Modellreferenzen unabhängig vom Werkzeug wiederverwenden — 04.10.2026

Auf Nutzerwunsch vor die räumliche Vorauswahl gezogen: getProjectSnapReferences speichert den abgeleiteten Referenzsatz in einer WeakMap je unveränderlichem Project-Snapshot. IDs oder Werkzeugnamen sind kein Cache-Schlüssel. Neue Modellobjekte, auch geladene Projekte mit gleichen IDs, erzeugen einen neuen Satz. Solange History einen alten Snapshot hält, können Undo/Redo dessen passenden Satz wiederverwenden; verworfene Projekte werden vom Cache nicht künstlich gehalten. Keine persistente zweite Modellhaltung. Voraussetzung bleibt der bestehende unveränderliche Modellvertrag; In-place-Mutationen werden nicht unterstützt.

BimPlan trennt die modellgebundene Aufbereitung von prepareToolReferences. Neue Direct-Edit-Sitzungen und Polylinienursprünge wenden nur die aktuellen Werkzeugregeln an. Temporäre Ursprünge und Quellenausschlüsse werden niemals im Modellcache gespeichert. Derselbe Modellstand kann auch von mehreren Viewports wiederverwendet werden. Die reine projectSnapReferences-Funktion bleibt für kalte Aufbereitung und Vergleichsmessungen unverändert.

Nachweise: 227 Tests bestanden, TypeScript und Build erfolgreich, ESLint 0 Fehler/6 bekannte Warnungen; git diff --check erfolgreich. Neue Regressionen prüfen identische Modellreferenzen bei wechselnden Zeichenursprüngen, wechselnde Eigenquellenausschlüsse, unveränderten Ursprungssatz, Modelländerung, Undo/Redo und neu geladene gleich-ID-Projekte gegen die ungecachte Aufbereitung. Kein neuer Browser-Latenznachweis, keine neue Zahlenbehauptung für den Cache. Erstaufbau, echte Modelländerungen und die laufende lineare Fangabfrage bleiben unverändert teuer.

Abnahme: Polylinie mit mehreren Punkten zeichnen und zwischen Zeichnen sowie freier Wandbewegung wechseln; Ursprung und Quellenausschlüsse müssen jeweils zum aktuellen Werkzeug passen. Nach Modelländerung/Undo/Redo dürfen nur aktuelle Fangpunkte angeboten werden.

### Ersetzter Folgeauftrag: globale räumliche Vorauswahl für Segmentschnittpunkte

Nun Schritt 2 umsetzen: konservative räumliche Vorauswahl in segmentIntersectionReferences, unveränderte exakte Prüfung und stabile Reihenfolge. Differentialtests gegen Vollprüfung einschließlich numerischer Grenzfälle; gleiche kalte Baseline wiederholen. Die bereits eingeführte Modellwiederverwendung erhalten und keine weitere Pointer-Fangoptimierung hinzufügen.


### Planung: lokale Fangabfrage statt globaler Schnittpunktaufbereitung — 04.10.2026

Nutzerpräzisierung gegen project-references, candidates, ToolSnapPolicy, Hover und Konstruktion abgeglichen. docs/LOCAL_SNAP_QUERY_PLAN.md beschreibt Zuständigkeiten, Vertrag, Index-Lebenszyklus, getrennte entfernte Referenzen, Migration und Testmatrix. Kein Anwendungscode in diesem Planungsschritt geändert. Die globale Paar-Vorauswahl aus älteren Abschnitten und dem Baseline-Bericht ist als nächster Auftrag ersetzt, nicht zusätzlich auszuführen.

Wichtige Abhängigkeiten: activeSources/withConstructionReferences dürfen entfernte Blätter nicht anhand lokaler Treffer invalidieren; sameHoverSession darf nicht an der wechselnden lokalen Ergebnisliste hängen; Hover-Segmenttracking muss denselben Suchdienst verwenden. Index in Modellkoordinaten, CSS-Radius pro Abfrage; ursprüngliche Segmente bleiben unbeschnitten. Sofortiger Fang und 600-ms-Erwerb bleiben getrennt.

Verbindliche Zielregeln in ARCHITECTURE.md ergänzt; AABB-Baum, API-Namen und anfänglicher vollständiger Primitivindex-Neuaufbau als Vorschlag gekennzeichnet. Keine inkrementellen Modellupdates auf Vorrat. Der zuvor blockierte Wiederverwendungsschritt wurde unverändert als PR #53 veröffentlicht; #51–53 weiterhin ohne Merge. Nachweis dieses Schritts: Code-/Dokumentabgleich und git diff --check; keine neuen Test-/Build-Läufe für reine Dokumentation. Bestehende 227 Tests beziehen sich auf PR #53.

### Abgeschlossener Folgeauftrag: lokalen Quellensuchdienst nachweisen

Primitive Modellquellen ohne globale Kreuzungen ableiten; räumlichen Index mit vollständigem Quellen-Lookup und lokaler Punkt-/Segmentabfrage in CSS-Radius aufbauen. Lokale Schnittreferenzen mit bisheriger Geometrie, Identität und Blattabhängigkeiten berechnen. Differentialtests zum Vollaufbau innerhalb des Suchradius, einschließlich langer Segmente und numerischer Grenzen; reproduzierbare Messung mit 100/1000/5000 Elementen. Noch keine UI-/Hover-Umschaltung, keine neue Fangart und keine leeren Klassen. Der funktionierende Suchdienst liefert den Nachweis für die anschließende gemeinsame Integration gemäß docs/LOCAL_SNAP_QUERY_PLAN.md.


### Abschluss: lokaler Quellensuchdienst — 04.10.2026

projectSnapPrimitives trennt die vorhandene primitive Ableitung von der globalen Schnittpunktliste. Alter Produktionspfad unverändert. Neuer Dienst application/snapping/local-sources.ts verwendet einen statischen AABB-Baum in geometry/spatial/box-index.ts mit opaken Quellenschlüsseln, unveränderlichen Quellen und vollständigem Lookup. Separate Punkt-/Segmentabfragen, konservative Toleranzpolsterung und lokale Schnittberechnung über den bestehenden Dienst. Lange Segmente bleiben vollständig; Ausgabe in alter Quellenreihenfolge. Quellenausschluss wirkt vor Paarbildung. Cache je unveränderlichem Project; kein globales Schnittpunktverzeichnis.

232 Tests bestanden; TypeScript und Build erfolgreich; ESLint 0 Fehler/6 bekannte Warnungen. Differentialtests zu Vollaufbereitung: deterministische Zufallsgeometrie, lange Kreuzungen, Berührung/Überlappung, schräge/fast parallele/kurze Segmente, große Koordinaten, mehrere Maßstäbe, Nullradius und numerische Boxgrenzen. Quellenidentität, Ausschlüsse, gefrorene Daten, Undo/Redo/Laden und entfernte Lookups geprüft. Benchmark mit 100/1000/5000 Elementen erfolgreich; Methodik/Rohwerte in docs/performance/LOCAL_SOURCES.md. 5000 Elemente: Indexaufbau Median 121,75 ms, lokale Suche 0,0143 ms mit einem lokalen Paar. Keine Aussage zur vollständigen Fangabfrage oder Browser-Framerate; UI nicht umgeschaltet.

### Abgeschlossener Folgeauftrag: lokalen Dienst gemeinsam an Fang und Hover anbinden

ToolSnapPolicy/SnapContext, Kandidaten- und Hoverpfad gemeinsam auf lokalen Suchdienst umstellen. Entfernte aktive Quellen über vollständigen Lookup validieren; dynamische Trefferlisten dürfen Hover-Sitzungen nicht zurücksetzen. Quellenausschlüsse und konstruierte Schnittreferenzen einschließlich Acquisition erhalten. Zeichnen, Idle-Hover und Direct Edit über denselben Einstieg; keine globale Kreuzungsaufbereitung im neuen Produktionspfad. Tests für sofortigen Fang/600-ms-Erwerb, entfernte Führungen, Zoom, feste Achsen, Snap aus, Modellwechsel und Abbruch; praktische Abnahme und Messung der vollständigen Abfrage.


### Abschluss: lokale Suche im gemeinsamen Produktionspfad — 04.10.2026

PR #55 nach Freigabe normal in seinen Zielzweig docs/local-snap-query-plan übernommen (d3aa81e); main und ältere offene PRs unverändert. Neuer Branch feat/local-snap-integration. BimPlan bindet einen modell- und werkzeuggebundenen Suchadapter ein. Zeichnen, Idle-Hover und Direct Edit verwenden denselben Einstieg; die Produktionsansicht erzeugt keine globale Schnittpunktliste mehr. Kandidatenrangfolge und exakte Geometrie bleiben bestehen. Entfernte aktive Referenzen und konstruierte Schnittpunkte werden anhand ihrer vollständigen Modellquellen validiert. Die stabile Adapteridentität trennt Hover-Sitzungen von wechselnden lokalen Trefferlisten; Zoom erhält Referenzen.

235 Tests bestanden; TypeScript und Build erfolgreich; ESLint 0 Fehler/6 bekannte React-Refresh-Warnungen. Neue Vergleiche prüfen den lokalen gegen den vollständigen Resolver mit Bearbeitungsachsen, Zeichnen, Shift/Ortho/Snap aus, entfernten Führungen und veralteten Quellen. Ein echter Segmentschnittpunkt wird sofort gefangen und erst nach 600 ms zur Referenz. Vollständige Abfragemessung mit 100/1000/5000 Elementen in docs/performance/LOCAL_INTEGRATION.md, getrennt vom Indexaufbau.

Browserabnahme im separaten Tab: Idle-Hover aktiviert Referenz; freie Wandaußenecke besitzt sofort Ursprung. Zwei Linienenden erfassen erzeugt drei Ringe; ihr Hilfslinienschnitt (5;2) wird vierte Referenz. Alle vier bleiben beim Zoom erhalten. Bestätigte Ecke (5;2), Undo (3;0,18), Abbruch eines neuen Entwurfs unverändert, Redo (5;2), jeweils Rundung < 1e-14 m. Nutzerprojekt im ursprünglichen Tab unverändert.

Praktischer Test: Wandecke frei bewegen, zwei externe Linienenden jeweils 0,6 s erfassen, zum gemeinsamen Hilfslinienschnitt fahren, zoomen, bestätigen und Undo/Redo prüfen. Dieselben Referenzen auch ohne Zeichenwerkzeug aktivieren.

Grenzen: sehr dichte lokale Geometrie weiterhin quadratischer Paaraufwand; Index nach echter Modelländerung vollständig neu. Keine Erweiterung auf 3D-Arbeitsebenen in diesem Schritt.

### Abgeschlossener Folgeauftrag: dichte lokale Geometrie absichern

Den integrierten Fangpfad mit langen schrägen, dicht überlappenden Segmentboxen und mehreren aktiven Referenzen differential gegen den Vollpfad prüfen und messen. Lokale Kandidatenzahlen/Paarzahlen sowie Median/P95 dokumentieren; Quellenausschlüsse für bewegte Fenster samt Host und konstruierte Referenzen nach Modellwechsel ausdrücklich abdecken. Keine neue Fangart, keine Ergebnisobergrenze und kein Indexumbau ohne gemessenen Engpass.


### Abschluss: dichte lokale Geometrie — 04.10.2026

PR #56 nach ausdrücklicher Freigabe normal in docs/local-snap-query-plan übernommen (01ca349); main bleibt unverändert. Branch test/dense-local-snapping ergänzt Regressionen und reproduzierbare Lastmessung, keine Änderung des Anwendungscodes. ARCHITECTURE.md korrigiert den nach PR #56 veralteten Integrationsstatus.

238 Tests bestanden, TypeScript und Build erfolgreich, ESLint 0 Fehler/6 bekannte Warnungen. Dichte schräge Quellen und lokale Kreuzungen bei mehreren Zoomstufen stimmen mit dem vollständigen Resolver überein. Bewegte Fenster schließen eigene und Hostquellen vor Schnittbildung sowie bei aktiven Führungen aus. Konstruierte Referenzen werden nach Änderung einer Blattquelle verworfen; nur der passende Undo-Snapshot ist wieder gültig. Dies reaktiviert keine UI-Sitzung nach Undo.

Messung: docs/performance/DENSE_SNAPPING.md und zugehörige Rohwerte. 500 schräge parallele Linien ohne lokalen Treffer: 124750 Paarprüfungen, Median 32,01 ms. 500 Linien mit sehr vielen echten lokalen Kreuzungen: Median 1001,86 ms. Synthetische Stressfälle, keine typische Projekt- oder Browser-Framerate-Aussage. Produktionscode identisch mit PR #56, daher dessen praktische Abnahme weiter gültig; keine neue Browserprüfung behauptet.

Praktischer Abnahmetest: Fenster auf seiner Wand bewegen; die eigene Wand darf kein externes Fangziel werden. Zwei externe Punkte als Referenzen aktivieren, deren Hilfslinienschnitt erfassen, eine zugrunde liegende Linie ändern und eine neue Bewegung beginnen: alte Hilfspunkte dürfen nicht weiterwirken.

### Umgesetzter Folgeauftrag, vollständige Projektabnahme offen: falsche lokale Segmenttreffer vor Paarbildung reduzieren

Zwischen AABB-Abfrage und lokaler Schnittberechnung einen konservativen geometrischen Segmentnähefilter ergänzen. Vollständige Originalsegmente für exakte Geometrie und Quellenidentität erhalten; numerisch akzeptierte Kontakte und Fangradiusgrenzen durch Differentialtests absichern. Benchmark für Boxüberlappung und echte dichte Kreuzungen unverändert wiederholen. Keine Ergebnisobergrenze, keine neue Fangart, kein Indexumbau. Verbleibende Kosten echter dichter Kreuzungen separat ausweisen; diese werden durch einen Nähefilter allein nicht gelöst.


### Umsetzung: geometrische lokale Segmentvorauswahl — 03.10.2026

Konservativer Segment-/Suchquadrat-Test in geometry/intersections/segment-box.ts; local-sources wendet ihn nach Boxsuche und Werkzeugfilter vor Paarbildung an. Originalsegmente und vollständiger Quellenlookup bleiben erhalten. Sechs neue Tests sowie 41 vorhandene reine Engine-Testfälle isoliert bestanden. Die vollständige Projekttestsuite, TypeScript, Build, Lint und Browserabnahme sind in dieser Umgebung mangels installierter Abhängigkeiten offen; kein produktionsreifer Abschluss behauptet. Draft auf Basis von PR #57, kein Merge.

Isolierter Vergleich gleicher Messgeometrie ohne Fixture-Validator: 500 falsche Boxüberlappungen ergeben 0 statt 124750 Paare, Median 0,30 statt 20,38 ms. Echte dichte Kreuzungen behalten 124750 Paare und kosten 911,68 ms; dieser Engpass bleibt bestehen. Verfahren, Grenzen und Rohwerte: docs/performance/LOCAL_PROXIMITY.md.

### Abgeschlossener Folgeauftrag: Segmentvorauswahl vollständig abnehmen

Draft in der vollständigen Projektumgebung mit npm test, TypeScript, Build und Lint prüfen. Zeichnen, Segment-Hover, Zoom und Direct Edit praktisch abnehmen; Fangradiusgrenzen und entfernte aktive Referenzen erhalten. Gegebenenfalls gezielt korrigieren. Keine weitere Fangfunktion oder Merge ohne Nutzerfreigabe. Nach erfolgreicher Abnahme den echten dichten Kreuzungsfall getrennt nach Paarberechnung, Quellenaufbau und Kandidatenbewertung profilieren; daraus den nächsten begrenzten Optimierungsauftrag ableiten.



### Abschluss: Projektabnahme PR #58 — 04.10.2026

Testfixture mit festen Koordinatentupeln typisiert; alter Dichtetest erwartet für entfernte Diagonalen null Segmente/Paare. Echte Kreuzungen und Differentialvergleich bleiben geprüft. Formatierung korrigiert. 244 Tests, TypeScript, Build erfolgreich; ESLint 0 Fehler/6 bekannte Warnungen.

Browser im separaten Tab: Segmentinneres als Referenz erfasst, freie Wandecke mit Ursprung, zwei entfernte Endpunkte und Hilfslinienschnitt (5;2) erfasst. Vier Referenzen nach Zoom erhalten; exakter Eckcommit mit Rundung <1e-14 m. Linie vom Endpunkt (4;1) zum Mittelpunkt (5;1) gezeichnet, Länge 1,00 m. Nutzerprojekt im ursprünglichen Tab unverändert. Praktischer Test: diese Folge wiederholen und Fangmeldungen kontrollieren.

Repository-Benchmark einschließlich Projektvalidator erneut ausgeführt; LOCAL_PROXIMITY.validated.json. 500 entfernte Diagonalen: 0 Paare, Median 0,337 ms; echte dichte Kreuzungen: 124750 Paare, Median 1242,13 ms, weiterhin ungelöst. Keine direkte Beschleunigungsbehauptung gegenüber isolierter Fremdmessung.

Nutzerwunsch zur optionalen Referenzauswahl aufgenommen: docs/REFERENCE_SELECTION_PLAN.md. Frühere Profilierung zurückgestellt; keine Auslöseschwelle oder Bedienänderung implementiert.

### Abgeschlossener Folgeauftrag: Vertrag für optionale Referenzauswahl festlegen

Entwurf gegen gemeinsame ToolSnapPolicy, Hover und Picking abgleichen. Zustands- und Quellenvertrag sowie eine begründete vorläufige Auslöseschwelle mit Hysterese vorschlagen. Verhalten ohne Auswahl, bei Abbruch, Idle-Hover und Modellwechsel festlegen. Endpunkt-/Mittelpunktfang, aktive Führungen und feste Achsen erhalten. Ein kleines Umsetzungspaket mit Tests ableiten; noch keine automatische Einschränkung oder Dialoge implementieren.


### Abschluss: Referenzauswahl-Vertrag — 04.10.2026

docs/REFERENCE_SELECTION_PLAN.md gegen lokale Quellen, ToolInteraction, Hover und Pointer-/Keyboardpfad abgeglichen. Vorgeschlagene Einstiegsschwelle >32 Segmente, Rückkehr <=24 für 250 ms; vorläufig und im Umsetzungsschritt zu messen. 600 ms Hover bleibt unabhängig. Auswahl filtert ausschließlich Segmentpaare, erhält normale Punktziele und aktive Führungen. Arbeitskopie/Abbruch, Mehrdeutigkeit, Polyline-Vorgangsidentität und Idle-Sitzung beschrieben. Keine Nutzerentscheidung über konkrete Zahlen behauptet.

Nur Dokumentation verändert; kein neuer Test-/Build-/Browserlauf nötig. Bestehende 244 Tests und Abnahme aus PR #58 beziehen sich auf unveränderten Anwendungscode. PR #58 und #57 weiterhin offen; kein Merge in diesem Planungsauftrag.

### Abgeschlossener Folgeauftrag: gemeinsame Dichteschranke mit sichtbarem Status

Primitive lokale Kandidatensuche und Paarbildung trennen. Gemeinsamen reinen Dichtecontroller mit vorläufigen Schwellen >32/<=24 und 250-ms-Rückkehr erstellen; Zeit injizieren. Strukturierter Pausenstatus für Zeichnen, Direct Edit und Hover, keine ungeschützte Zweitabfrage. End-/Mittelpunkte, aktive Führungen, Host-/Eigenausschlüsse und Achsen erhalten. Viewporthinweis ohne funktionslosen Auswahlbutton; Auswahl-Picking folgt als separates Paket. Grenz-/Lebenszyklustests und Messung mit 24/32/33/48 Segmenten gemäß Vertrag; Build/Lint/TypeScript und praktische Prüfung.


### Abschluss: gemeinsame Dichteschranke — 04.10.2026

Primitive Suche von Paarbildung getrennt. createToolSourceQuery bewacht standardmäßig alle Produktionsabfragen (>32 Segmente); reiner Application-Controller steuert Rückkehr bei <=24 für 250 ms, React liefert Zeit/Ereignisse. Gemeinsamer Pausenparameter für Hover und Pointerresolver. End-/Mittelpunkte, Raster und aktive entfernte Referenzen bleiben verfügbar. Lesbarer Viewportstatus ohne Popup oder funktionslosen Auswahlbutton.

247 Tests, TypeScript und Build erfolgreich; ESLint 0 Fehler/6 bestehende Warnungen. Grenz-, Ausschluss-, Referenz- und Vergleichstests bestanden. Browser mit 48 Kreuzungen: Idle-Hover, Zeichnen, freie Wandbewegung, erhaltener Mittelpunktfang, Referenz nach Zoom, Wiederaufnahme außerhalb und Linienabschluss erfolgreich. Messung: docs/performance/SNAP_DENSITY.md. 32 Segmente Median 2,373 ms, 33 Segmente pausiert 0,261 ms; keine Framerate-Zusage.

Praktischer Test: viele Linien kreuzen lassen, Maus darüber bewegen. Hinweis erscheint ohne Dialog; Mittelpunkt bleibt fangbar. Auf weniger dichte Stelle fahren, kurze Wiederaufnahme abwarten. Beim Zeichnen und Bearbeiten wiederholen; Zoom erhält Referenzen.

Grenzen: dichte automatische lokale Schnittpunkte bewusst pausiert, manuelle Referenzauswahl fehlt noch. Primitive Suche und Punktranking bleiben mengenabhängig. Keine 3D-Arbeitsebene. PRs #57–59 weiterhin offen.

### Abgeschlossener Folgeauftrag: temporäre Segmentauswahl gemeinsam integrieren

Optionale Auswahl gerader Segmentquellen für einen laufenden Vorgang implementieren: gemeinsamer Application-Zustand mit Arbeitskopie/Übernehmen/Abbruch, Vorgangsidentität über Polylinienpunkte hinweg und Auswahlfilter vor Paarbildung. Canvas-Auswahl suspendiert Modellbestätigungen, bietet Mehrdeutigkeitsliste und dezente Abblendung. Aufheben, Idle-Lebenszyklus, Zoom, Modellwechsel und aktive Referenzen gemäß docs/REFERENCE_SELECTION_PLAN.md testen. Zunächst Segmentauswahl; explizite Punktübernahme folgt separat. Keine per-Werkzeug-Fangkopien.


### Abschluss: temporäre Segmentauswahl — 04.10.2026

PR #60 nach Freigabe normal in docs/reference-selection-contract übernommen (9daa725); main unverändert. Gemeinsamer Application-Reducer verwaltet Arbeitskopie, Übernehmen, Abbruch und Aufheben. Ein Filter begrenzt Segmentpaare vor der Dichteprüfung; End-/Mittelpunkte und aktive entfernte Führungen bleiben verfügbar. Deterministisches Picking unterscheidet Polylinienteilsegmente. Mehrdeutigkeit wird in einer Liste nahe dem Zeiger aufgelöst; Canvas wird dezent abgeblendet. ToolInteraction pausiert Bestätigungen und numerische Eingabe während der Auswahl. Kein zusätzlicher Modellzustand und keine per-Werkzeug-Fangkopie.

250 Tests bestanden; TypeScript und Build erfolgreich, ESLint 0 Fehler/6 bekannte React-Refresh-Warnungen. Neue Tests prüfen Auswahl/Abbruch, Quellenfilter vor Paarbildung (zwei Segmente: ein Paar), erhaltene Punktziele/aktive Quellen und deterministisches Picking. Browser: 48 überlappende Linien, zwei Referenzen auswählen/übernehmen, Arbeitskopie abbrechen und Filter aufheben; Auswahl bleibt beim Zoom und über drei Polylinienpunkte erhalten. Zeichenvorgang abbrechen setzt Filter zurück. Freie Wandbewegung: Hilfseingabe wird während der Auswahl ausgeblendet und nach Abbruch wiederhergestellt. Keine unbeabsichtigte Modellbestätigung beim Picking.

Praktischer Test: Referenzen auswählen anklicken, zwei Linien im Canvas wählen (bei Überlagerung Trefferliste nutzen), übernehmen. Danach weiterzeichnen/verschieben und zoomen. Auswahl erneut öffnen und abbrechen: vorherige Auswahl bleibt. Auswahl aufheben stellt automatische Suche einschließlich Dichteschranke wieder her.

Grenzen: zunächst gerade Segmentquellen in 2D; explizite Punktübernahme fehlt. Quellschlüssel gelten für den aktuellen Modellsnapshot und werden nach Modell-/Vorgangswechsel verworfen. Komplette Modal-/Tastaturmatrix noch nicht browserautomatisiert. Ältere gestapelte PRs bleiben offen.

### Abgeschlossener Folgeauftrag: gezielte Punktreferenzen im gemeinsamen Auswahlmodus

Punktübernahme für vorhandene End-/Mittelpunkte in denselben temporären Auswahlablauf integrieren. Vorhandenen Hover-Referenzvertrag einschließlich Kapazität, Ursprungsschutz und Verdrängung verwenden; vor Übernahme anzeigen, welche Referenz ersetzt würde. Segmentfilter und explizite Hilfsreferenzen getrennt halten, kein zweiter unbegrenzter Referenzspeicher. Arbeitskopie/Abbruch, Modellwechsel, Zoom und gemeinsame Nutzung bei Zeichnen/Direct Edit testen; Tab/Escape und modale Priorität praktisch mitprüfen. Keine neue Fangart oder 3D-Arbeitsebene.

### Anzeige der Referenzauswahl bereinigt — 04.10.2026

Im normalen Fangbetrieb kein dauerhaftes Panel. Bei pausierter dichter Suche Hinweis mit Einstieg; bestätigte Auswahl kompakt als Anzahl mit Ändern/Aufheben. Manueller Einstieg über das gemeinsame On-Demand-Menü auch ohne Elementauswahl und im Zeichen-/Bearbeitungsvorgang. Auswahlmodus bleibt auch bei Snap aus bedienbar. Keine Änderung der Fangberechnung oder 600-ms-Regel.

250 Tests bestanden, TypeScript/Build erfolgreich; ESLint 0 Fehler/6 bekannte Warnungen nach Korrektur einer verbliebenen Formatierung in snapping.ts. Browser: normales Panel verborgen, Einstieg im Elementmenü und Linienwerkzeug, Abbruch blendet Panel wieder aus. Nächster Auftrag bleibt gezielte Punktübernahme gemäß obigem Folgeauftrag. Ergänzung im offenen PR #61, kein Merge.


### Abschluss: gezielte Punktreferenzen — 04.10.2026

Der gemeinsame Auswahlmodus bietet Linien/Punkte. Vorhandene End-, Eck- und Mittelpunkte werden lokal ohne Paarberechnung getroffen und über dieselbe Hover-Referenzverwaltung übernommen. Vorschau und Übernahme verwenden denselben reinen Kapazitätsdienst; maximal vier zusätzliche Referenzen, separater geschützter Bewegungsursprung. Doppelte Quellen werden dedupliziert; bei mehr als vier Punkten bleibt Übernehmen gesperrt. Vorherige Referenzen werden erst bei Übernahme ersetzt, mit konkreter Vorschau. Punktübernahme ändert weder Segmentfilter noch Modell/Undo. Kein zweiter dauerhafter Referenzspeicher und keine per-Werkzeug-Implementierung.

254 Tests, TypeScript und Build erfolgreich; ESLint 0 Fehler/6 bekannte Warnungen. Neue Tests: Vorschau ohne Mutation, konkrete Verdrängung, gemeinsame Hover-Kapazität, Ursprungsschutz, Duplikate/Überlauf, CSS-Picking, Quellenfilter und veralteter Snapshot. Browser: vier Wandecken übernehmen, Zoom erhält vier Ringe; fünfter Punkt zeigt die zu ersetzende Ecke; Abbruch/Escape erhält vier, Enter übernimmt. Fünf gleichzeitig gewählte Punkte sperren Übernahme. Direct Edit: eigene Wand bleibt als externe Quelle ausgeschlossen, Ursprung bleibt, Tab navigiert Auswahlpanel, Escape stellt Hilfseingabe wieder her. Dabei gefundene Menüüberlagerung korrigiert: On-Demand-Menü über Hilfseingabe, beim Start einer Bewegung geschlossen.

Praktischer Test: On-Demand-Menü → Referenzen auswählen → Punkte → End-/Mittelpunkte anklicken → Referenzen übernehmen. Vier Punkte erfassen, danach einen neuen Punkt wählen und Ersetzungsvorschau prüfen; alternativ abbrechen. Zoom und freie Bewegung wiederholen.

Grenzen: bestehende 2D-Modellpunkte; keine explizite Übernahme berechneter Schnittpunkte, diese bleiben per Hover verfügbar. Punkt-Arbeitskopie gilt jeweils für eine Übernahme. Vollständige Modal-/Mehrviewport-Matrix bleibt offen. PR #61 nicht zusammengeführt. Shell-Fetch derzeit ohne Netzwerkverbindung; Veröffentlichung über GitHub-Connector, vorhandene lokale Änderungen erhalten.

### Abgeschlossener Folgeauftrag: gemeinsame Referenzauswahl im vollständigen Ablauf stabilisieren

Segmentfilter und Punktübernahme gemeinsam bei Zeichnen und Direct Edit prüfen: entfernte Hilfslinien, mehrdeutige Punktquellen, Escape/Tab mit offenen Dialogen, Snap aus/ein sowie Modelländerung/Undo/Redo und Viewportwechsel. Nur nachgewiesene Fehler beheben, Lebenszyklus automatisiert absichern und Einschränkungen aktualisieren. Keine neue Fangart, keine 3D-Arbeitsebene und keine weitere Auswahloberfläche.


### Abschluss: gemeinsamer Referenz-Lebenszyklus — 04.10.2026

PR #61 normal nach docs/reference-selection-contract übernommen (dc1b1f5), PR #62 normal nach feat/reference-segment-selection (714f8d7). main und frühere gestapelte PRs unverändert. Netzwerkfreigabe ermöglicht lokalen Fetch; zuvor publizierte Änderungen exakt abgeglichen, Sicherungsstash erhalten, Arbeitszweig fix/reference-selection-lifecycle auf geprüftem Gesamtstand.

Reproduzierte Fehler: Pan schaltete Hover aus und löschte Punkte dauerhaft; in zwei Ansichten erschienen zwei Auswahlpanels; Escape im Dateidialog löschte bestätigte Referenzen. Korrekturen: Navigation suspendiert Erwerb statt Sitzung zu löschen, nur aktive Ansicht führt Picking/Hover/Auswahl aus, Dialogtasten gelangen nicht in den globalen Grundriss-Reset. Erster Klick in eine inaktive Ansicht aktiviert sie ohne Modellbestätigung. Gemeinsame Vorgangsidentität einschließlich Layout/Viewport hält Hover-Punkte auch beim nächsten Polylinienursprung; Modell-, History-, Werkzeug- und Ansichtswechsel invalidieren sie. Keine separate Fangengine.

257 Tests bestanden, TypeScript und Build erfolgreich, ESLint 0 Fehler/6 bekannte Warnungen. Drei neue Regressionen: wechselnder Zeichenursprung bei unverändertem Vorgang, explizite Sitzungsgrenzen, Pan-Dwell-Unterbrechung ohne Referenzverlust. Browser: Pan aus/Zoom erhält Punkte (während Pan sind Marker wie bisher ausgeblendet); zwei Ansichten zeigen genau ein Panel, Wechsel beendet Auswahl. Zwei Linien plus mehrdeutiger Punkt gewählt; Trefferliste durch erstes Escape geschlossen, Filter und Punkt über nächsten Polylinienpunkt erhalten; Hilfslinienschnitt fangbar. Dialog-Escape erhält nach Korrektur bestätigten Hilfspunkt. Snap aus löscht zusätzliche Punkte, Snap ein zeigt nur den geschützten Ursprung. Polylinie per Undo entfernt/Redo wiederhergestellt ohne alte Filter; Wand mit denselben Referenzarten um 1,00 m in Y verschoben, Transformation von (-2;-2) nach (-2;-1), Undo/Redo exakt.

Reproduzierbarer Testgrundriss: docs/fixtures/reference-selection.json (eine Wand, drei Linien, gemeinsame Endpunkte). Anleitung: importieren, Linienfilter setzen, im Punktmodus gemeinsamen Endpunkt auflösen, übernehmen. Polylinie beginnen/fortsetzen oder Wand frei bewegen, Pan/Zoom und Undo/Redo prüfen. Danach geteilte Ansicht und Dateidialog-Escape prüfen.

Grenzen: Stichproben in zwei 2D-Ansichten, keine vollständige Browsermatrix aller Layouts oder 3D-Arbeitsebenen. Keine Leistungszusage für beliebige Projektdichte. Layout-/Viewportwechsel beenden temporäre Referenzsitzung bewusst, Navigation innerhalb derselben Ansicht erhält sie.

### Abgeschlossener Folgeauftrag: Vertrag für eine aktive 3D-Arbeitsebene planen

Vorhandene 3D-Kamera, Picking und gemeinsame ToolInteraction gegen den 2D-Fangpfad prüfen. Einen begrenzten technischen Vertrag für eine horizontale aktive Arbeitsebene mit Welt-/Ebenenkoordinaten, CSS-Fangradius, stabiler Zielauswahl und derselben Application-Aktion dokumentieren. Ebenenwechsel, Ursprung, Referenzen und Abbruch festlegen; Vorschläge von bestehenden Entscheidungen trennen. Noch keine neue Fangengine, keine beliebigen Dach-/Schnittebenen und keine neuen Bauteile implementieren. Daraus genau ein kleines Umsetzungspaket ableiten.


### Abschluss: Vertrag für horizontale 3D-Arbeitsebene — 04.10.2026

Dokumentationsauftrag auf acc5c44 (PR #63 weiterhin offen, kein Merge). Vorhandene orthographische Kamera, Solid-/Wand-Picking, gemeinsame ToolInteraction, skalare Fangmetrik und Moduswechsel im Workspace untersucht. docs/3D_WORKPLANE_PLAN.md trennt Codebefund, verbindliche bestehende Grenzen und Vorschläge. Startvorschlag z=0 passt zum aktuellen XY-Modell; keine erfundene Geschosshöhe oder freie Z-Bewegung. Eine Wand-ID aus pickWall ist noch kein geometrischer Bewegungsursprung.

Wichtiger Befund: schräge Ebenenansicht hat richtungsabhängige Pixelmaßstäbe. Exakte CSS-Metrik, konservative lokale Vorauswahl und gleiche Projektionsparameter für Renderer/Inverse sind nötig. Bei pitch=0 kollabiert die horizontale Ebene; ungültige Inverse darf keinen Zielpunkt bestätigen. Vorschau darf ihren eigenen Projektionsrahmen nicht verschieben. Lesende Rechnung mit vorhandener projectPoint und Testgrundriss bestätigt unterschiedliche Einheitsachsen (112,61/63,13 CSS-Pixel bei pitch=0,3; 800x600) und Singularität bei pitch=0.

Nur drei Markdown-Dateien geändert. Keine neuen Laufzeitfunktionen; keine neue Build-/Browserabnahme behauptet. Die 257 Tests/Build-/TypeScript-Ergebnisse aus PR #63 gelten für unveränderten Anwendungscode. Dokumentpfade, Änderungsumfang und Whitespace geprüft. Offene Bedienfragen: Ebene/Anker sichtbar machen, verdeckte Referenzen, Kamera-Gesten und Schwelle schlechter Konditionierung. Diese blockieren die reine mathematische Grundlage nicht.

### Abgeschlossener Folgeauftrag: gemeinsame orthographische Projektion und Ebeneninverse

Vorhandene Vorwärtsprojektion in einen numerischen Baustein unter geometry/projections überführen und projectPoint kompatibel darauf delegieren. Rendering-Adapter für horizontale Ebene mit gemeinsamem Rahmen/Aspect/CSS-Rechteck, Inverse und strukturiertem Ungültigkeitsstatus ergänzen. Numerische Fehlerschranke begründen. Vorwärts-/Roundtrip-/Suchgrenzen-/Singularitätsfälle gemäß Abschnitt 8 von docs/3D_WORKPLANE_PLAN.md sowie bestehende Geometrie/Picking, gesamte Tests, TypeScript, Build und Lint prüfen; unveränderte 3D-Darstellung/Auswahl praktisch abnehmen. Kein Fang-Overlay, keine neue 3D-Modellaktion und keine separate Fangengine.

### Abschluss: gemeinsame orthographische Projektion — 04.10.2026

PR #63 normal nach feat/reference-segment-selection übernommen (1a8378e), PR #64 normal nach fix/reference-selection-lifecycle (3fe01da). main unverändert. Neuer Entwicklungszweig feat/orthographic-workplane-projection auf diesem Gesamtstand.

Gemeinsamer Projektionsbaustein unter geometry/projections; Renderer, Picking und kompatible projectPoint verwenden dieselbe Formel. Horizontaler Rendering-Adapter bindet unveränderliche Parameter, rechnet Client-CSS-Koordinaten zurück und liefert konservative lokale Suchgrenzen. Ungültige oder numerisch unzuverlässige Ergebnisse werden ausdrücklich abgelehnt. Kein neuer Modellzustand, keine Kopie der Fangengine und noch kein 3D-Fang-Overlay.

264 Tests bestanden (sieben neue Tests mit Parameterreihen): exakte alte Vorwärts-/Tiefenwerte, Roundtrips bei wechselnder Kamera/Zoom/Pan/Aspect/Höhe, CSS-/Backbuffer-Verhältnisse, Singularität/NaN/Überlauf, konservative Suchgrenzen, Snapshot-Isolation und große Weltkoordinaten. TypeScript und Build erfolgreich; ESLint 0 Fehler/6 bekannte React-Refresh-Warnungen. Browser: Wand mit offener Fensteröffnung sichtbar, Wechsel von Navigator-Fensterauswahl zu Wand durch 3D-Klick korrekt, Kamera-Taste/Zoom bedienbar, Wandselektion beim Wechsel nach 2D erhalten. Keine vollständige 3D-Gestenmatrix behauptet.

Praktische Abnahme: 3D öffnen, im Navigator Fenster wählen, sichtbare Wandfläche anklicken; Werkzeugeigenschaften müssen wall-1 mit 3,00/0,36/2,80 m zeigen. Ansicht drehen/zoomen und nach 2D wechseln; Auswahl und Maße bleiben erhalten. Die Inverse ist zunächst eine getestete Infrastruktur ohne neue Bedienoberfläche.

Grenzen: nur orthographische horizontale Ebene; numerische Fehlerschätzung ist keine formale Intervallgarantie und umfasst keine Eingabegeräte-/Quellfehler. Noch keine anisotrope Fangmetrik im gemeinsamen Resolver. Gesten, verdeckte Ziele und sichtbare Ebenenanker bleiben offen.

### Abgeschlossener Folgeauftrag: gemeinsame affine Bildschirmmetrik für lokale Vorauswahl

Einen fachunabhängigen numerischen Vertrag für affine Ebenen-zu-CSS-Metrik ergänzen und die gemeinsame lokale Punkt-/Segment-Vorauswahl darauf umstellen: konservative Suchbox, exakter CSS-Punkt-/Segmentabstand vor Dichtezählung und Paarbildung. Den heutigen isotropen 2D-Faktor über denselben Vertrag mit unveränderten Ergebnissen abbilden. Schrägansicht, lange Segmente, Fangradiusgrenzen und Dichtezählung testen; bestehende 2D-Tests und Build erhalten. Noch keine 3D-UI aktivieren: Ranking, Führungen, Hover und manuelles Picking benötigen danach denselben Vertrag, bevor ein vollständiger 3D-Fangpfad freigeschaltet wird. Keine per-Werkzeug-Metrik und keine globale Schnittpunktliste.

### Abschluss: affine Metrik für lokale Vorauswahl — 04.10.2026

PR #65 nach Freigabe normal nach fix/reference-selection-lifecycle übernommen (5778f4c), main unverändert. Neuer Zweig feat/local-affine-screen-metric. Ein gemeinsamer Geometry-Baustein liefert CSS-Punktabstände, inverse Suchboxen und Segmentnähe. Der horizontale Arbeitsebenenadapter stellt die Metrik aus denselben Projektionsableitungen bereit. Die gemeinsame lokale Quellensuche verwendet sie bereits für alle bisherigen numerischen 2D-Aufrufe über einen isotropen Adapter; keine Werkzeugkopien.

Segmentverfeinerung erfolgt vor Dichtezählung und Schnittpunktpaaren. Lang gezogene Segmente bleiben vollständig, tolerierte Kontakte bleiben erhalten. Gewollte Änderung: Segmente ausschließlich in den Ecken des bisherigen Suchquadrats, aber außerhalb des CSS-Fangkreises, zählen nicht mehr unnötig zur Dichte. Exakte akzeptierte Punktziele behalten den bisherigen Radius und ihre Reihenfolge. Keine Änderung von Modell, Undo, Dateien oder IFC.

269 Tests bestanden; TypeScript/Build erfolgreich, ESLint 0 Fehler/6 bekannte React-Refresh-Warnungen. Fünf neue Tests mit Parameterreihen: affine Abfragen gegen vollständige Enumeration einschließlich Rotation/Scherung/Verkürzung, 40 falsche Dichtekandidaten ausgeschlossen bei zwei erhaltenen langen Kreuzungslinien, numerische API/Adapter-Parität und ungültige Metriken, echte CSS-Abstände aus der Arbeitsebene und inverse Suchgrenzen, Tangenten/Toleranzkontakte/Kreisecken. Bestehende lokale Differenzialtests einschließlich großer Offsets und entfernter aktiver Referenzen bestanden. Kein neuer manueller Browsernachweis in diesem Paket; keine Leistungszusage für beliebige Projektdichten.

Praktische Abnahme: zwei lange Linien kreuzen lassen, Linienwerkzeug nahe der Kreuzung bewegen, Schnittpunkt und End-/Mittelpunkte prüfen. Eine Referenz 0,6 Sekunden aktivieren, zoomen und weiterzeichnen; aktive Hilfslinie soll erhalten bleiben. Bei dichter Geometrie dürfen nur nahe Linien zur Dichteschranke beitragen. Schrägansicht ist mathematisch getestet, aber noch keine aktivierte 3D-Fangbedienung.

### Abgeschlossener Folgeauftrag: Punkt-Ranking im gemeinsamen Fangresolver

Den bestehenden Resolver-Vertrag für Punktkandidaten um dieselbe ScreenMetric erweitern und End-/Mittel-/Schnittpunkt-Abstände samt Rangfolge darüber bewerten. Gemeinsamen Application-Quellenadapter konsistent mit derselben Metrik versorgen; bisherige numerische 2D-Aufrufe kompatibel erhalten. Affine Kandidaten am Radiusrand, konkurrierende Ziele, deterministische Gleichstände und 2D-Differenzialfälle testen. Noch keine 3D-UI aktivieren und fachliche Modellwinkel/-längen nicht in Bildschirmwinkel umdeuten. Führung/Segment-Hover/manuelles Picking bleiben ausdrücklich weitere Anschlussstellen vor Freischaltung des vollständigen 3D-Pfads.

### Abschluss: gemeinsames Punkt-Ranking — 04.10.2026

PR #66 nach Freigabe normal nach fix/reference-selection-lifecycle übernommen (803d07f), main unverändert. Zweig feat/shared-point-screen-ranking. SnapContext nimmt dieselbe optionale ScreenMetric entgegen; bisherige numerische Aufrufe erhalten den isotropen Adapter. Die Metrik wird pro Abfrage an den gemeinsamen Application-Quellenadapter weitergereicht und sowohl lokal als auch zur Punktbewertung verwendet. Keine neue Engine je Werkzeug und keine Änderung der Quellensitzungsidentität.

End-, Mittel- und Segment-Schnittpunkte werden am CSS-Radius bewertet; innerhalb derselben Priorität entscheidet CSS-Abstand. Bestehende Prioritäten und stabile Gleichstandsauflösung bleiben erhalten. Nicht endliche/negative Abstände werden verworfen. Keine Modell-/Datei-/History-Änderung, keine neue 3D-Bedienung.

273 Tests bestanden; TypeScript und Build erfolgreich; ESLint 0 Fehler/6 bekannte Warnungen. Vier neue Tests mit Parameterreihen: konkurrierende affine Ziele, Radiusrand für alle drei Punktarten, Priorität und Gleichstand bei umgekehrter Quellenreihenfolge, isotrope Parität bei Maßstäben/Ortho sowie Application-Ende-zu-Ende-Vergleich lokale/vollständige Quellen. Kein neuer manueller Browsernachweis; bestehende 3D-Fangbedienung weiterhin nicht freigeschaltet.

Praktischer Abnahmetest: im Grundriss nahe benachbarten End-/Mittelpunkten zeichnen; Fangziel und Markierung müssen zusammenpassen. Zoomen, erneut fangen und die Zeichnung abbrechen. Automatische Tests prüfen zusätzlich die noch nicht interaktiv verfügbare schräge Bildschirmmetrik.

### Abgeschlossener Folgeauftrag: gemeinsame Führungsprojektion in Bildschirmmetrik

Eine numerische Projektion auf eine Modellgerade nach minimalem CSS-Abstand in ScreenMetric ergänzen. Gemeinsame Führungs-Kandidaten und deren Abstände darüber führen, einschließlich berechneter Führungsschnittpunkte. Modellrichtungen, Shift-/Ortho-Vorgaben, Winkel/Längen und fachliche Achsenzwänge bewahren; keine Bildschirmwinkel als Modellwinkel behandeln. Isotrope 2D-Parität, affine Lotprojektion, konkurrierende Führungen, entfernte aktive Referenzen und Radiusgrenzen testen. Keine 3D-UI aktivieren; Hover und explizites Picking bleiben danach offene Anschlüsse.

### Abschluss: gemeinsame Führungsprojektion — 04.10.2026

PR #67 nach Freigabe normal nach fix/reference-selection-lifecycle übernommen (b67294b), main unverändert. Zweig feat/shared-guide-screen-projection. ScreenMetric projiziert auf Modellgeraden nach minimalem CSS-Abstand. Gemeinsame Führungskandidaten verwenden diesen Baustein; Führungs-/Achsschnittpunkte sowie Grid-/Shift-Abstandsangaben verwenden dieselbe Metrik. Keine Logik je Werkzeug und keine Modellmutation.

Richtungswahl und Hysterese bleiben in Modellwinkeln. Shift, Ortho und explizite Achsen behalten ihre Modellprojektion und fachlichen Zwänge. Der isotrope Adapter verwendet die bisherige projectDirection-Rechnung exakt. Ungültige Projektionen und nicht endliche Kandidatenabstände werden abgelehnt.

277 Tests bestanden, TypeScript und Build erfolgreich, ESLint 0 Fehler/6 bekannte Warnungen. Vier neue Tests mit Parameterreihen: analytische CSS-Lotbedingung und Minimalabstand bei Verkürzung/Scherung/Rotation, ungültige Richtungen, gemeinsamer Führungsresolver versus Shift-Modellprojektion, Führungsschnittpunkte/entfernte konkurrierende Quellen/Radiusrand/Achsschnitt sowie isotrope Rechenparität. Bestehende Interaktions- und Differenzialtests bestehen. Kein neuer manueller Browsernachweis; keine 3D-Fangbedienung freigeschaltet.

Praktische Abnahme: Hilfspunkt nach 0,6 Sekunden aktivieren, einer horizontalen oder diagonalen Hilfslinie folgen, zweiten Hilfspunkt aktivieren und gemeinsamen Schnitt fangen. Shift halten und freie Wandbewegung mit fester Achse prüfen. Die bisherige 2D-Bedienung soll gleich bleiben; affine Projektion ist zunächst automatisiert abgesichert.

### Abgeschlossener Folgeauftrag: Hover-Erwerb mit gemeinsamer Bildschirmmetrik

Punkt- und Segment-Hover im gemeinsamen Inference-/Application-Pfad an ScreenMetric anschließen, einschließlich CSS-Abstand und nächstem Punkt auf einem endlichen Segment. 600-ms-Erwerb/Entfernen, Kapazität, Ursprungsschutz, Zoom-Erhalt und Modellinvalidierung bewahren. Affine Segmentnähe, Endpunktbegrenzung, Dwell-Wechsel und isotrope 2D-Parität testen. Keine neue Oberfläche und keine 3D-Freischaltung; explizites Referenz-Picking bleibt danach als eigener begrenzter Anschluss offen.

### Abschluss: gemeinsame Hover-Metrik — 04.10.2026

PR #68 nach Freigabe normal nach fix/reference-selection-lifecycle übernommen (9039325), main unverändert. Zweig feat/shared-hover-screen-metric. HoverContext reicht dieselbe optionale ScreenMetric an lokale Quellenabfrage, Punkt-/Führungskandidaten und Linien-Hover durch. Endliche Segmentprojektion im Geometry-Baustein liefert begrenzten Punkt, unbeschränkten Parameter und CSS-Abstand. Der bestehende Linien-Hover bleibt auf Parameter 0..1 begrenzt; Verlängerungen aktivieren keine Linienreferenz, Punktziele haben weiterhin Vorrang.

280 Tests bestanden; TypeScript und Build erfolgreich; ESLint 0 Fehler/6 bekannte Warnungen. Drei neue Tests mit Parameterreihen prüfen affine Nähe, Endpunktbegrenzung und degenerierte Segmente; 600-ms-Aktivierung/Entfernung, Dwell-Neustart beim Quellenwechsel, Suspension/Erhalt, Ursprungsschutz und Metrikwechsel versus Modellwechsel; exakte bisherige isotrope Parameter-/Abstandsrechnung einschließlich großer Koordinaten. Bestehende Kapazitäts-, Sitzungs- und Resolverprüfungen bestehen. Kein neuer manueller Browsernachweis oder automatisierter React-Timertest; keine 3D-Bedienung freigeschaltet.

Praktisch prüfen: über einer Linienmitte 0,6 Sekunden verweilen, wegbewegen und erneut 0,6 Sekunden verweilen: Referenz wird gelöst. Während der ersten Wartezeit zu einer anderen Linie wechseln: dort beginnt die Wartezeit neu. Aktivierte Punkte durch Zoom erhalten, nach Modelländerung alte Referenzen verwerfen. Gewählten Bewegungsursprung nicht durch Hover entfernen.

### Abgeschlossener Folgeauftrag: explizites Referenz-Picking mit gemeinsamer Metrik

Punkt-/Segment-Picking im bestehenden manuellen Referenzauswahlmodus auf ScreenMetric umstellen, einschließlich CSS-Radius, nächstem Segmentpunkt und stabiler Mehrdeutigkeitsliste. Bestehende isotrope 2D-Aufrufe kompatibel halten. Auswahl/Übernehmen/Abbruch, Quellenfilter vor Paarbildung, affine Trefferreihenfolge und Radiusgrenzen testen; den gemeinsamen 2D-Ablauf einschließlich Hover/Zoom praktisch im Browser abnehmen. Keine zweite Auswahloberfläche und noch keine 3D-Freischaltung; offene Sichtbarkeits-/Gestenentscheidungen anschließend gesondert prüfen.

### Abschluss: gemeinsame Metrik für Referenz-Picking — 04.10.2026

PR #69 nach Freigabe normal nach fix/reference-selection-lifecycle übernommen (d30022d), main unverändert. Zweig feat/reference-picking-screen-metric. Beide bestehenden Referenz-Picker akzeptieren ScreenMetric oder numerischen 2D-Maßstab. Segment-Picking nutzt die gemeinsame begrenzte Projektion, einschließlich Endpunktnähe und degenerierter Punktsegmente. Mehrdeutigkeitsreihenfolge nach Abstand/Quellschlüssel bleibt erhalten. Keine neue Auswahloberfläche oder Modelländerung.

282 Tests bestanden, TypeScript und Build erfolgreich; ESLint 0 Fehler/6 bekannte Warnungen. Zwei neue Tests mit Parameterreihen: affine Punkt-/Segmenttreffer und Reihenfolge, Radiusrand, Endpunktbegrenzung, Gleichstände, degenerierte Segmente und ungültige Treffer sowie isotrope API-Parität über Zoomstufen. Bestehende Auswahl-/Abbruch- und Quellenfilter-vor-Paarbildung-Tests bestehen.

Browser: Wandecke im Punktmodus übernommen, Zoom erhält Referenz; zweite Punkt-Arbeitskopie abgebrochen, erste Referenz bleibt. Erneutes Hover löst den Punkt, nach Verlassen und neuem Hover wird er wieder aktiv. Wandachse im Linienmodus gewählt und übernommen; Zoom erhält einen Linienfilter und aktiven Hilfspunkt. Screenshot outputs/reference-picking.jpg außerhalb des Repositories. Keine genaue Browser-Zeitmessung der 600 ms, diese bleibt automatisiert geprüft; keine vollständige Mehrviewport-/Direct-Edit-Matrix.

Praktische Abnahme: On-Demand-Menü → Referenzen auswählen → Punkte → Wandecke → Übernehmen. Zoom und neue Auswahl mit Abbruch prüfen. Danach Linienmodus auf der Wandachse wählen; übernommener Filter und Hilfspunkt sollen beim Zoom bestehen bleiben.

### Abgeschlossener Folgeauftrag: 3D-Bedienvertrag vor Freischaltung konkretisieren

Die abgeschlossenen Metrikanschlüsse gegen den tatsächlichen 3D-Viewport prüfen und einen begrenzten Integrationsplan für die horizontale Arbeitsebene z=0 erstellen. Sichtbare Ebenenanker, verdeckte Ziele, Zuordnung von Auswahl-/Zeichen-/Orbit-Gesten und Umgang mit ungültiger Inverse konkret gegenüberstellen. Technisch verbindliche Regeln von noch offenen Nutzerentscheidungen trennen; keine Gesten-/X-Ray-Entscheidung erfinden. Genau einen kleinen anschließenden Umsetzungsschritt mit Abnahmekriterien festlegen. Keine Modellaktion oder neue 3D-Fangbedienung in diesem Planungsauftrag aktivieren.

### Abschluss: konkreter 3D-Bedienentwurf — 04.10.2026

PR #70 nach Freigabe normal nach fix/reference-selection-lifecycle übernommen (509d133), main unverändert. Neuer Dokumentationszweig docs/3d-interaction-contract. BimSolidView, CadViewport, CadWorkspace, pickWall und bisheriger Arbeitsebenenplan geprüft. Renderer verwendet gerundeten Backbuffer-Aspect, Auswahl CSS-Aspect; dies ist eine nachgewiesene Codeabweichung, noch kein reproduzierter Fehlklick. Wand-ID und Client-Menüanker sind kein geometrischer Ursprung. Vorschau kann heute Solid-Grenzen und damit den Rahmen verändern.

docs/3D_INTERACTION_CONTRACT.md enthält Bedienalternativen für sichtbare Anker, verdeckte Quellen, Orbit versus Werkzeugklick und ungültige Inverse. Empfehlungen sind ausdrücklich keine bereits getroffenen Nutzerentscheidungen. Gemeinsame Modellaktionen, metrische Koordinaten, expliziter Ursprung und gleiche Projektionsparameter bleiben verbindlich. Historischen Arbeitsebenenplan als solchen gekennzeichnet; keine Metrikfunktion erneut geplant.

Nur vier Dokumente geändert; Pfade und Whitespace geprüft. Keine Laufzeitänderung, kein neuer Build oder Browsertest. Die zuletzt bestandenen 282 Tests/Build-/TypeScript-Prüfungen gehören zum unveränderten Anwendungsstand aus PR #70.

### Genau ein ausführbarer Folgeauftrag: gemeinsamer 3D-Projektionsstand

Das im Bedienvertrag beschriebene Projektionspaket umsetzen: Rahmen, Kamera, CSS-Rechteck und Render-Aspect als gemeinsamen unveränderlichen Stand für BimSolidView, Wand-Picking und Ebeneninverse verbinden. Resize/DPR/Kamerawechsel konsistent behandeln, alte Treffer bei ungültigem Stand verhindern, bestehendes pickWall kompatibel halten. Ungerade Größen, DPR, Öffnungen, Navigation und Snapshot-Isolation automatisiert und Wand-Auswahl praktisch prüfen; gesamte Tests/TypeScript/Build/Lint. Keine neue Gestenbelegung, Fangoberfläche oder Modellaktion. Dieser technische Schritt ist unabhängig von den noch offenen Sichtbarkeits-/Gestenentscheidungen.

### Abschluss: gemeinsamer 3D-Projektionsstand — 04.10.2026

Zweig feat/shared-3d-projection-state baut auf dem weiterhin offenen Planungs-PR #71 auf. Darstellung, Wand-Picking und Ebeneninverse verwenden denselben unveränderlichen Projektionsstand mit tatsächlichem gerundetem Backbuffer-Aspect. Kamera, CSS-Rechteck und Pixeldichte werden beim Treffen gegen den dargestellten Stand geprüft; veraltete Treffer lösen eine Neuzeichnung aus. Bestehendes pickWall bleibt kompatibel. Optionaler expliziter Rahmen ist verfügbar, aber noch nicht aus Bearbeitungsvorgängen angebunden. Keine neue Fangoberfläche, Modellaktion oder Gestenregel.

285 Tests bestanden, TypeScript und Build erfolgreich, ESLint 0 Fehler/6 bekannte Warnungen. Drei neue Tests mit Parameterreihen prüfen ungerade Hoch-/Querformate, DPR 1/1,25/2, Wand versus Fensteröffnung, gemeinsame Ebeneninverse, Snapshot-Isolation, ungültige und veraltete Zustände sowie explizit festgehaltene Rahmen bei Vorschaugeometrie. Browser: Öffnung löscht Auswahl, Wandfläche wählt wall-1; erneut erfolgreich nach Tastaturrotation, Zoom und Resize durch Schließen des Navigators. Screenshot outputs/projection-state.jpg außerhalb des Repositories. Physischer Monitor-DPR-Wechsel und WebGL-Kontextverlust wurden nicht manuell provoziert; keine vollständige 3D-Bearbeitungsabnahme.

Praktisch prüfen: 3D öffnen, durch die Fensteröffnung und danach auf Wandmaterial klicken. Drehen, zoomen, Navigator schließen und die beiden Klicks wiederholen. Die Eigenschaften müssen ausschließlich beim Wandtreffer wall-1 zeigen.

### Genau ein ausführbarer Folgeauftrag: geometrische Sichtbarkeitsklassifikation

Einen gemeinsamen Rendering-Dienst ergänzen, der einen projizierten 3D-Anker anhand desselben Projektionsstands und der dargestellten Wanddreiecke als sichtbar, verdeckt oder außerhalb klassifiziert. Bestehende Tiefen-/Dreiecksmathematik wiederverwenden oder eng begrenzt extrahieren; keine zweite Picking-Engine. Öffnungen, überdeckende Wände, Rand-/Tiefentoleranzen, Kamerabewegung und ungültige Projektionen testen. Nur technische Klassifikation, keine automatische Referenzaktivierung, X-Ray-Entscheidung oder neue Gesten. Produktregeln für verdeckte Ziele und Orbit/Werkzeugklick bleiben ausdrücklich offen.

### Abschluss: geometrische Sichtbarkeitsklassifikation — 04.10.2026

PR #71 (4222ac3) und #72 (d85acf2) nach ausdrücklicher Freigabe per normalem Merge nach fix/reference-selection-lifecycle übernommen. PR #72 zuvor auf diesen gemeinsamen Zweig umgestellt, damit seine Umsetzung dort ankommt. main unverändert. Neuer Zweig feat/3d-anchor-visibility.

Gemeinsame Tiefenabfrage aus dem Wand-Picker extrahiert: Geometry berechnet Dreieckstiefe, Rendering ordnet Wandflächen und den bestehenden Projektionsstand zu. Die neue Ankerprüfung unterscheidet sichtbar, verdeckt, außerhalb und ungültig. Fensteröffnungen und dahinterstehende Wände werden geometrisch berücksichtigt; kein zweiter Picker, keine neuen Modellaktionen, keine Änderung von Hover/Gesten oder Sichtbarkeitspolitik.

291 Tests bestanden; TypeScript und Build erfolgreich; ESLint 0 Fehler/6 bekannte Warnungen. Sechs neue Tests mit Parameterreihen für Oberfläche/vor/hinter Wand, Öffnungen, mehrere Wände/Reihenfolge, Kamerawechsel/Pan/Zoom, DPR/Hoch-/Querformat, Tiefentoleranz, Clip-Grenzen, degenerierte Dreiecke und ungültige Daten. Bestehende Picking- und Gesamtworkflowtests bestehen. Kein neuer Browsernachweis; keine sichtbare Ankeroberfläche implementiert. Der Browsernachweis aus PR #72 bleibt historischer Nachweis dieses vorherigen Standes.

Praktische Regression: in 3D Wandmaterial auswählen, durch Fensteröffnung klicken und nach Drehen erneut auswählen. Die neue Sichtbarkeitsfunktion selbst ist derzeit durch die automatisierten Tests prüfbar. Grenzen: kontinuierliche Dreiecksgeometrie statt GPU-Pixeltest; linearer Flächendurchlauf pro Abfrage; nur vorhandene Wandflächen als Verdeckung. Kein vollständiger 3D-Fang oder 3D-Direct-Edit freigeschaltet.

### Genau ein ausführbarer Folgeauftrag: gemeinsamer 3D-Kandidatenadapter

Eine rein lesende Abfrage für bekannte Modell-Fußpunkte auf der horizontalen Arbeitsebene z=0 an den vorhandenen lokalen Quellen-/ScreenMetric-Pfad und die neue Sichtbarkeitsklassifikation anschließen. Projektion, Solid und Quellen müssen zum selben Modell-/Ansichtsstand gehören; bei ungültiger Inverse ausdrücklich pausieren. Ergebnisse mit stabiler Quellen-ID, Modellpunkt, CSS-Abstand und Sichtbarkeitsstatus liefern, ohne verdeckte Punkte stillschweigend zu aktivieren oder zu verwerfen. Gemeinsame Radius-/Prioritätsregeln wiederverwenden, keine neue Fang-Engine. Sichtbare/verdeckte/außerhalb liegende Kandidaten, Öffnungen, Zoom und Modellwechsel testen. Keine UI-/Gestenfreischaltung; deren offene Produktentscheidungen bleiben vor der anschließenden Oberfläche zu klären.

### Abschluss: gemeinsamer 3D-Kandidatenadapter - 04.10.2026

PR #73 nach Freigabe normal nach fix/reference-selection-lifecycle uebernommen (f029919). Neuer Zweig feat/3d-point-candidates; main unveraendert. Rein lesender Rendering-Adapter verbindet z=0-Inverse, lokale Modellquellen, bestehende Kandidatenbewertung und Sichtbarkeit. Keine zweite Fang-Engine. Wand-Achsenden, Ecken und Achsmittelpunkte liefern stabile Quellenidentitaet, Modellpunkt in Metern, CSS-Abstand und Sichtbarkeitsstatus. Veraltete Modell-/Projektionsidentitaeten und ungueltige Inverse pausieren die Abfrage.

296 Tests bestanden, TypeScript und Build erfolgreich; ESLint 0 Fehler/6 bekannte Warnungen. Fuenf neue Tests pruefen lokale/vollstaendige Ranking-Paritaet bei Zoom, Quellenidentitaet und Radius, Modell-/Kamerawechsel, ungueltige Eingaben und seitliche Ebene, sichtbare/verdeckte/ausserhalb liegende Kandidaten sowie einen Fusspunkt durch eine Fensteroeffnung und nach deren Schliessen. Kein neuer Browsertest: dieser Adapter ist noch nicht an Mausereignisse angeschlossen. Vorhandene UI und Modellaktionen bleiben erhalten.

Praktisch ist noch kein neuer 3D-Fang sichtbar; die neue Abfrage wird automatisiert geprueft. Grenzen: nur bekannte Wand-Fusspunkte, keine Fensteranker, Linienannotation, Schnittpunktbildung oder aktiven Hilfslinien in diesem Adapter. Geometrische Sichtbarkeit gegen Wandflaechen, linearer Flachendurchlauf je Kandidat; keine Zusage fuer grosse Szenen.

### Genau ein Folgeauftrag: 3D-Vorschau-Bedienregeln konkret freigeben

Vor dem Anschluss an Mausereignisse die offenen Regeln aus docs/3D_INTERACTION_CONTRACT.md als kurze konkrete Entscheidungsvorlage fuer eine rein lesende 3D-Fangvorschau vorlegen: Umgang mit verdeckten Zielen, Aktivierung der Vorschau und Vorrang von Orbit gegenueber Hover/Referenzerwerb. Bestehende 600-ms-Regel, silbergraue Ringe und gemeinsame Engine bewahren. Nutzerentscheidung einholen, ohne aus PR-Freigaben eine neue Gesten- oder X-Ray-Regel abzuleiten. Erst danach die begrenzte Vorschau integrieren; noch keine Modellbewegung.

### Abschluss: sichtbare 3D-Fangvorschau - 04.10.2026

PR #74 wurde nach Freigabe normal nach fix/reference-selection-lifecycle uebernommen (1b5ff15). Nach konkreter Bedienvorlage hat der Nutzer mit "Fahre fort" die vorgeschlagenen Vorschau-Regeln bestaetigt. Zweig feat/3d-snap-preview. Gemeinsamer Snap-Schalter aktiviert die Vorschau auch ohne Zeichenwerkzeug. Sichtbare Wand-Fusspunkte zeigen sofort einen hohlen silbergrauen 10,5-CSS-Pixel-Ring; 600ms aktivieren eine Referenz, erneuter Besuch loest sie. Mehrere Referenzen und mausgerichtete Hilfslinien verwenden vorhandene Hover-/Richtungslogik.

299 Tests bestanden; TypeScript und Build erfolgreich; ESLint 0 Fehler/6 bekannte Warnungen. Drei neue Integrationstests der reinen Adapter-/Zustandsbausteine pruefen sichtbare versus verdeckte/rechnerisch erzeugte Quellen, 600ms-Toggle/Suspension und Sitzungsidentitaet bei Kamera, Modell, Escape und Snap. Browser: sofortiger Ring, Erwerb und erneutes Loesen, zwei Referenzen, Erhalt bei Zoom/Tastaturrotation/Maus-Orbit; Modellhoehe aendern und Undo invalidieren Referenzen; Escape leert, Snap-off blendet aus. Keine millisekundengenaue Browsertimermessung. Screenshot outputs/3d-snap-preview.jpg ausserhalb des Repositories.

Abnahme: 3D und Snap aktivieren. Sichtbare untere Wandecke ohne Klick anhovern und 0,6s verweilen; wegbewegen, Hilfslinie sehen. Zweite Ecke aktivieren, zoomen und drehen. Zum Loesen erneut auf einen aktivierten Punkt verweilen. Escape leert die Referenzen. Wandklick bleibt Auswahl, Ziehen dreht die Kamera.

Grenzen: nur reale Wand-Fusspunkte auf z=0, keine Bauteilbewegung oder automatisch erfassbaren Hilflinienschnittpunkte. Guide-SVG liegt konservativ hinter Wandpixeln; kein allgemeines tiefengeprueftes 3D-Linienrendering. Referenzen sind ans lokale 3D-Viewport-Leben gebunden, nicht an einen Wechsel zwischen 2D und 3D. Keine Grossprojekt-/Kontextverlust-Abnahme; bisheriger linearer Tiefentest bleibt.

### Genau ein Folgeauftrag: gemeinsame Hilflinienschnittpunkte in der 3D-Vorschau

Erzeugte Schnittpunkte aktiver Hilfslinien auf z=0 ueber die vorhandene gemeinsame Kandidaten-/Inference-Logik fuer Vorschau und 600ms-Erwerb anbinden. Die Eligibility-Regel soll echte Modellquellen und gueltige Konstruktionen unterscheiden, ihre Abhaengigkeiten erhalten und verdeckte/ungueltige Punkte ablehnen. Keine zweite Schnittpunktberechnung, kein Werkzeugwechsel-Code, keine Modellbewegung. Zwei Referenzen, erzeugten Schnittpunkt, erneutes Loesen, Navigationserhalt und Modellinvalidierung automatisch und im Browser pruefen.

### Abschluss: Bodenorientierung und 3D-Hilflinienschnittpunkte - 04.10.2026

PR #75 nach Freigabe normal nach fix/reference-selection-lifecycle uebernommen (7053d33). Zweig feat/3d-floor-and-guide-intersections. Zusaetzlicher Nutzerwunsch: leicht sichtbare reine Orientierungsflaeche auf z=0. Diese wird aus erweiterten Wandgrenzen abgeleitet und mit demselben Projektionsstand gezeichnet, unabhaengig vom Snap-Schalter. Sie bleibt ausserhalb von Modell, Auswahl, Fangquellen, Kamerarahmen und IFC.

Gemeinsame querySnap-/Inference-Logik liefert nun auch die Vorschau und den 600ms-Erwerb konstruierter Hilflinienschnittpunkte. Entfernte aktive Urspruenge und ihre unveraenderten Originalquellen werden der lokalen Abfrage zur Validierung beigegeben; keine globale Paarbildung. Verdeckte geometrische Kandidaten werden vor der Rangfolge ausgeschlossen. Erzeugte Punkte behalten flache Quellenabhaengigkeiten und werden bei Modellwechsel ungueltig.

303 Tests bestanden; TypeScript und Build erfolgreich; ESLint 0 Fehler/6 bekannte Warnungen. Vier neue Tests: entfernte Quellen/Schnittpunkt/Erwerb/erneutes Loesen, Kameraerhalt versus geaenderte/fehlende Abhaengigkeiten und Verdeckung, Sichtbarkeitsfilter vor Rangfolge, dekorative z=0-Projektion ohne Modell-/Rahmenaenderung. Browser mit zwei vorhandenen Waenden: Boden sichtbar, zwei Ecken aktiviert, Schnittpunkt als dritte Referenz aktiviert, erneut geloest und wieder aktiviert; Zoom erhaelt drei Referenzen. Vorhandenes Nutzerprojekt nicht ersetzt. Nach Hot-Reload einmal 2D/3D gewechselt, um die WebGL-Ansicht neu aufzubauen. Screenshot outputs/3d-floor-intersections.jpg ausserhalb des Repositories.

Abnahme: In 3D Bodenflaeche ansehen. Snap aktivieren, zwei sichtbare untere Wandecken je 0,6s anhovern. Maus vor die Wand bewegen, bis die Hilflinien kreuzen; ueber dem Schnittpunkt 0,6s verweilen. Dritter Ring erscheint. Verlassen und erneut verweilen loest ihn; Zoom behaelt die Referenzen. Die Bodenflaeche wird weder ausgewaehlt noch exportiert.

Grenzen: weiterhin keine Bauteilbewegung in 3D, keine neuen Bauteiltypen oder Oberpunkte; z=0, maximal vier gemeinsame Referenzen. Sichtbarkeit weiterhin gegen Wanddreiecke, dekorative Boden-/Linien-SVGs liegen hinter Wandpixeln. Kein Grossprojekt-Leistungsnachweis oder vollstaendiger Mehrviewport-Test.

### Abgeschlossener Folgeauftrag: erste 3D-Wandverschiebung auf z=0

Vorhandene Aktion Element frei bewegen fuer eine ausgewaehlte Wand mit explizit gewaehltem sichtbarem Fusspunkt als Ursprung an den gemeinsamen ToolInteraction-/Direct-Edit-Pfad anschliessen. Vorschau, Hilfsreferenzen, Winkel/Laenge und Tab aus den gemeinsamen Bausteinen verwenden; keine eigenen Modellmutationen oder Timer. Projektionsrahmen fuer den Vorgang festhalten. Bestehendes Orbit/Pan nur ausserhalb der aktiven Zielbestaetigung oder ueber expliziten Navigationsmodus; keine Doppelbestaetigung. Einen Vorgang mit Abbruch, validierter Uebernahme, Undo/Redo und konsistenter 2D/3D-Darstellung testen. Keine freie Z-Bewegung oder weiteren Bauteile in diesem Schritt.

### Abschluss: gemeinsame Wandverschiebung in 3D — 04.10.2026

PR #76 nach Freigabe normal nach fix/reference-selection-lifecycle uebernommen (cb0194a). Neuer Zweig feat/3d-wall-free-move; main unveraendert. Sichtbaren Wandfusspunkt anklicken, dann Element frei bewegen: z=0-Inverse liefert Mausziele an die vorhandene ToolInteraction. Ursprung sofort gepinnt, gemeinsame Hilfslinien, Shift-Winkel, Winkel/Laenge und Tab; keine zweite Modellaktion, Fangberechnung oder Hover-Zeitsteuerung. Vorherige reine Vorschau als useSolidInference wiederverwendet. Bewegte Wand wird als Ziel und Verdeckung ausgeschlossen, stationaere Wandquellen bleiben geprueft.

Rahmen und Bodenorientierung stammen aus dem unveraenderten Modell und springen waehrend der Vorschau nicht mit. Erst ein bestaetigter Vorgang veraendert Modell/History. Richtungsklick fixiert wie in 2D die Richtung und fokussiert Laenge. Mit Eingabe bestaetigen Zielklick, Enter oder Uebernehmen. Pan ein/aus ist waehrend der Bewegung explizite Navigation; kein gleichzeitiger Modellklick. Orbit per Ziehen bleibt ausserhalb des Vorgangs, Tastaturrotation und Zoom bleiben moeglich. Wandflaeche/Navigator ohne gewaehlten Fusspunkt fuehren zu einem Hinweis statt geratenem Ursprung.

307 Tests bestanden, TypeScript und Build erfolgreich, ESLint 0 Fehler/6 bekannte Warnungen. Vier neue Integrationstests pruefen Ursprung und Selbstfang-Ausschluss, Shift und Snap-off, validierte Vorschau/Abbruch/90-Grad-1m-Bewegung, Fensterbezug, z=0/2,8m-Solidhoehe, JSON-Rundlauf, IFC-Position, Undo/Redo, veralteten Modell-/Auswahlkontext, Navigationsidentitaet, ungueltige Inverse und stationaere Quellen hinter bewegtem Material.

Browser: bestehendes Nutzerprojekt mit drei Waenden und einem Fenster erhalten. Sichtbaren Fusspunkt gewaehlt, Hilfslinie und bewegte Vorschau gesehen; Tab wechselt Laenge/Winkel, 566 Grad deaktiviert Uebernahme. Abbruch geprueft. Pan-Klick und Pan-Ziehen bestaetigen nicht; Zoom behaelt Ursprung. Numerisch 90 Grad/1m uebernommen, Grundrissposition translate(0 -1) gegen Ausgang translate(0 0) verglichen; Undo/Redo korrekt. Zweite Bewegung per Zielklick bestaetigt. Testbewegungen per Undo zurueckgenommen. Screenshot outputs/3d-wall-move.jpg ausserhalb des Repositories.

Abnahme: 3D und Snap einschalten. Untere sichtbare Wandecke anklicken → Element frei bewegen → Maus ins freie Canvas bewegen. Ursprung und Hilfslinie erscheinen, Wand folgt als Vorschau. Tab → Laenge 1 → Tab → Winkel 90 → Uebernehmen. 2D, Undo und Redo pruefen. Zweiten Vorgang mit Esc abbrechen; Pan aktivieren/ziehen/deaktivieren und auf unveraenderten Modellzustand achten.

Grenzen: nur ganze Waende auf z=0; weitere Bearbeitungen nutzen vorerst den bisherigen 2D-Weg. Stationaere Wanddreiecke bilden die Sichtbarkeitsbasis, keine weiteren Materialtypen. Sehr weit ausserhalb des festgehaltenen Kamerarahmens liegende Vorschau kann abgeschnitten werden; der Modellwert wird dadurch nicht beschnitten. Keine umfassende Mehrviewport-/Grossprojekt-/WebGL-Verlust-Abnahme. AI/Text/Voice behalten die gemeinsame validierte Application-Grenze; neue Sprachformulierungen fuer diesen Bedienablauf sind nicht enthalten.

### Abgeschlossener Folgeauftrag: 3D-Wandecke ueber gemeinsamen Direct Edit bewegen

Den sichtbaren Fusspunkt mit stabilem Wand-Endindex an den bestehenden Punkt-frei-bewegen-Adapter anbinden. Vorhandene Eckoffset-/Wandstaerken-Regel, gepinnten Ursprung, useSolidInference und ToolInteraction wiederverwenden. Wandlaenge aendern, Fenstergrenzen validieren, Vorschau/Abbruch/Uebernahme/Undo/Redo und 2D/3D/Datei/IFC-Konsistenz pruefen. Ganze Wandverschiebung unveraendert bewahren. Nur vorhandene gerade Waende und z=0; keine freie Z-Bewegung, neuen Bauteile oder getrennte Fang-/Eingabelogik.

### Abschluss: einzelne Wandecke in 3D bewegen — 04.10.2026

PR #77 nach Freigabe normal nach fix/reference-selection-lifecycle uebernommen (2fd9582). Zweig feat/3d-wall-corner-edit; main unveraendert. Der vorhandene Quellenadapter ordnet Achsenden und alle vier unteren Wandecken dem stabilen Endindex 0/1 zu. Mittelpunkte und unbekannte Features bleiben ohne Punktgriff. Ein Klick uebergibt Wand-ID, Endindex und tatsaechlichen Eckpunkt an dieselbe Auswahl wie im Grundriss; das vorhandene On-Demand-Menue bietet dadurch Punkt frei bewegen an.

Der bestehende 3D-Bearbeitungspfad laesst jetzt auch die gemeinsame point-Aktion zu. Rasterengine, Hover-Timer, Eingabefenster, Tab und Eckkorrektur bleiben unveraendert; keine neue Modellmutation. Das gegenueberliegende Achsende bleibt fest, Staerke und Hoehe bleiben erhalten. Im Punktmodus bestaetigt ein Zielklick direkt; Element frei bewegen behaelt seinen bisherigen Richtungsklick. Fenster behalten ihren relativen Wandbezug; unzulaessige Verkuerzungen werden abgewiesen.

310 Tests bestanden; TypeScript und Build erfolgreich; ESLint 0 Fehler/6 bekannte Warnungen. Drei neue Tests mit Parameterreihen: Quellen-/Endindex-Zuordnung bei gedrehten und umgekehrten Waenden inklusive Mittelpunkten; alle vier Eckpunkte durch gemeinsame polare Eingabe, gepinnten Ursprung, reale 3D-Eckgeometrie, unveraendertes Gegenende, JSON/IFC sowie Undo/Redo; unmoegliche/ungueltige Ziele und Fensterkonflikt mit anschliessender Korrektur im selben Vorgang. Vorhandene Ganzwandverschiebungstests bestehen.

Browser mit vorhandenem Nutzerprojekt: sichtbare Ecke zeigt Wand/Punkt 2 und Punkt frei bewegen. Sofortiger Ursprungsring, Hilfslinie bei Mausbewegung, Tab zur Laenge und Winkel sowie Abbruch geprueft. 180 Grad/2,5m wuerde die 3m-Wand fuer das Fenster zu kurz machen: vorhandene Modellfehlermeldung erscheint, Uebernehmen ist deaktiviert. Anschliessend auf 0 Grad/1m korrigiert und per Zielklick uebernommen. Grundrisswand ist 4m lang; Fensterbreite 1,2m und lokale Position 1,4m bestaetigen mittigen Sitz. Undo zeigt 3m, Redo 4m; 3D-Screenshot outputs/3d-wall-corner.jpg ausserhalb des Repositories. Testaenderung zum Schluss per Undo zurueckgenommen, Nutzerprojekt erhalten.

Abnahme: sichtbare untere Wandecke anklicken → Punkt frei bewegen → Maus bewegen oder Tab fuer Laenge/Winkel → Ziel anklicken oder Uebernehmen. Ganze Wand bleibt ueber Element frei bewegen verfuegbar. Bei einer waagerechten 3m-Wand am Endpunkt 0 Grad/1m testen; Fenster bleibt mittig. Undo/Redo und Abbruch pruefen.

Grenzen: nur vorhandene gerade Waende auf z=0. Flucht-/Achsenaktionen wechseln vorerst weiterhin in den bisherigen 2D-Ablauf. Keine obere Wandecke, freie Z-Bewegung oder Wandanschlussregeln. Modellfehlermeldungen sind teilweise weiterhin Englisch. Kein neuer Grossprojekt-, Mehrviewport- oder WebGL-Kontextverlust-Nachweis. Neue AI-/Sprachformulierungen sind nicht Teil dieses Adapterschritts; dieselben validierten Modellaktionen bleiben die gemeinsame Grenze.

### Abgeschlossener Folgeauftrag: bestehende Flucht-/Achsenaktionen in 3D anschliessen

Die vorhandenen Wandaktionen Punkt in Flucht strecken sowie Element entlang Achse/X/Y auf z=0 ueber denselben 3D-Bearbeitungspfad freischalten. Einen expliziten Fusspunkt als Ursprung verlangen, Punktaktionen an gueltigen Endindex binden. Gemeinsame editDirection-/fixedAxis-/ToolInteraction-Regeln und Eingabefenster unveraendert wiederverwenden. Richtungsprioritaet gegen Shift/Ortho, Abbruch, ungueltige Verkuerzung, Pan versus Bestaetigung und einen Undo-Schritt pruefen. Keine zweite Achsenberechnung, keine neue Bauteilart und keine freie Z-Bewegung.

### Abschluss: Flucht und Achsen in 3D — 04.10.2026

PR #78 nach Freigabe normal nach fix/reference-selection-lifecycle uebernommen (e3ecc38). Zweig feat/3d-wall-axis-edits; main unveraendert. Die vier bestehenden Aktionen stretch/axis/x/y bleiben jetzt in 3D auf z=0. Expliziter Fusspunkt bleibt Pflicht; Punkt/Flucht benoetigen Endindex 0/1. Gemeinsame Capability-Pruefung in application/direct-edit/controller verhindert auseinanderlaufende Freischaltung zwischen Workspace und Viewport. Kein neuer Solver, Hover-Timer, Eingabedialog oder Modellpfad.

Vorhandene feste Achse hat Vorrang vor Shift und Ortho, auch bei ausgeschaltetem Snap. Das bestehende Eingabefenster zeigt den gesperrten Winkel und erlaubt eine vorzeichenbehaftete Strecke. Fluchtstreckung behaelt das Gegenende; Achse/X/Y verschieben die ganze Wand. Alle verwenden denselben Ursprung, Quellenfilter, Vorschau-, Pan-, Bestaetigungs- und Undo-Pfad.

313 Tests bestanden; TypeScript und Produktionsbuild erfolgreich; ESLint 0 Fehler/6 bekannte Warnungen. Drei neue Tests mit Parameterreihen pruefen Capability-Grenzen, 32 Kombinationen aus vier Aktionen, schraegen/umgekehrten Waenden, beiden Enden und positiven/negativen Strecken, jeweils mit Shift/Ortho und Snap an/aus. Numerik und Mausziel stimmen ueberein; Vorschau/Abbruch, fixe Gegenpunkte, Fensterbezug, JSON/IFC und ein Undo-Schritt mit Redo geprueft. Ungueltige Strecken, Ueberkreuzen des Gegenendes und Fensterkonflikte erzeugen keine History; Korrektur bleibt moeglich.

Browser: bestehendes Nutzerprojekt mit drei Waenden und einem Fenster behalten. An Wand 1 Punkt in Flucht strecken gestartet, Ursprung und feste Eingabe in 3D sichtbar; -2,5m wird wegen Fensterkonflikt abgewiesen. Auf +1m korrigiert; Pan-Klick bestaetigt nicht. Uebernahme 3→4m, Undo 3m, Redo 4m und abschliessendes Undo geprueft. X-Achse mit -0,5m, Y-Achse mit +0,5m sowie Wandachse mit +0,5m als Vorschau geprueft und abgebrochen; Winkel 0/90/180 Grad jeweils gesperrt, Hilfslinie und Ursprung vorhanden. Screenshot outputs/3d-wall-axis.jpg ausserhalb des Repositories. Keine Testbewegung bleibt im Modell.

Abnahme: sichtbaren unteren Wandendpunkt anklicken → Punkt in Flucht strecken → Tab → 1 eingeben → Uebernehmen. -0,5 verkuerzt. Fuer eine reine Verschiebung Element entlang Achse oder Element auf X-/Y-Achse waehlen. Winkel bleibt dabei gesperrt; negative Strecken kehren die Richtung um. Pan, Esc und Undo pruefen.

Grenzen: weiterhin nur gerade Waende auf z=0. Keine freie Z-Bewegung, Wandanschlussregeln oder weitere Elementtypen. Rein mausgefuehrte Achsenbewegung zeigt die Vorschaugeometrie; der numerische Streckenplatzhalter bleibt ohne Eingabe noch Maus (bestehendes gemeinsames Verhalten). Modellfehler sind teilweise Englisch. Keine umfassende Mehrviewport-/Grossprojekt-/Kontextverlust-Abnahme; bisherige Rahmen-/Clipping-Grenzen bleiben dokumentiert.

### Abgeschlossener Folgeauftrag: gemeinsame 3D-Auswahlumrandung fuer Waende

Den bereits aufgenommenen Nutzerwunsch einer dezenten sichtbaren Auswahlumrandung als kleinen Rendering-Schritt umsetzen. Gemeinsame, aus der dargestellten Geometrie abgeleitete Kanten-/Auswahlrepraesentation beginnen und zunaechst an vorhandene Waende mit Oeffnungen anschliessen; keine zweite Auswahl oder Modellkopie. Innenliegende Tessellationskanten nicht als Bauteilkanten anzeigen, bestehenden Projektionsstand und Sichtbarkeit verwenden. Auswahlwechsel, Oeffnungen, Vorschau, Kameranavigation und Modellwechsel pruefen. Architektur fuer spaetere Elementadapter offenhalten, ohne leere Klassen oder alle zukuenftigen Bauteile vorwegzunehmen. Keine neuen Modellaktionen.

### Abschluss: dezente 3D-Auswahlumrandung — 04.10.2026

Zweig feat/3d-selection-outline baut auf feat/3d-wall-axis-edits (PR #79) auf. GO setzt den angekuendigten Folgeauftrag um; PR #79 und main wurden in diesem Schritt nicht zusammengefuehrt. Gemeinsame Kantenableitung in rendering/viewport/selection-outline.ts: echte Rand-/Knickkanten bleiben, gemeinsame koplanare Zellgrenzen entfallen. BimSolidView liefert nur die dargestellten Flaechen der ausgewaehlten Wand, auch waehrend Vorschau. Der gleiche Projektionsstand und GPU-Tiefenpuffer verbergen verdeckte Kanten. Helle graublaue Kontur mit 1,5 CSS-Pixeln, unabhaengig von Zoom und DPR. Bestehende Auswahlfarbe bleibt ergaenzend erhalten. Keine Modell-, History-, Dateiformat- oder IFC-Aenderung.

318 Tests bestanden, TypeScript und Produktionsbuild erfolgreich, ESLint 0 Fehler/6 bestehende Warnungen. Fuenf neue Tests pruefen Fenster-/Aussenkanten bei gedrehten Waenden samt gesamter Kantenlaenge, fehlende Zellnaehte und Dreiecksdiagonalen, Auswahl-/Vorschau-/Modellwechsel, konstante Bildschirmbreite bei Kamera/Zoom/DPR sowie Tiefenlage hinter einer Vordergrundwand. Browserpruefung im bestehenden Nutzerprojekt: Auswahlwechsel Wall 1/2, verdeckte Kontur hinter Wall 3, Fensterkontur, Zoom/Fit, +1m-Streckvorschau und Uebernahme 3→4m, Undo auf 3m sowie Abwahl. Nutzergeometrie erhalten; Screenshot outputs/3d-selection-outline.jpg ausserhalb des Repositories. Bei Hot-Reload musste der bereits laufende Renderer einmal durch 2D→3D neu aufgebaut werden.

Abnahme: In 3D eine Wand anklicken. Aussenkanten und Fensterlaibung zeigen eine dezente Kontur; keine Gitterlinien auf den Wandflaechen. Andere Wand auswaehlen, zoomen und eine Streckvorschau starten. Die Kontur folgt der Vorschau und verschwindet bei Abwahl. Hinter einer anderen Wand bleiben verdeckte Abschnitte verborgen.

Grenzen: erster Adapter fuer Waende. Fenster sind weiterhin Oeffnungen, keine eigenen ausgewaehlten 3D-Koerper. Andere Bauteilarten folgen mit ihrer Geometrie; keine leeren Adapter. Kantenableitung verlangt konforme Flaechen mit identischen gemeinsamen Koordinaten; keine allgemeine T-Junction-Reparatur oder Topologieheilung. Sehr nahe Oberflaechen unterhalb des kleinen NDC-Bias koennen visuell zusammenfallen. Keine Grossprojekt- oder Mehr-GPU-Leistungsmessung. Bestehende Projektions-/Clipping-Grenzen bleiben offen.

### Abgeschlossener Folgeauftrag: 3D-Tiefen-Clipping bei Bearbeitung absichern

Die bekannte Begrenzung des Projektionsrahmens bei weit reichenden Wandvorschauen anhand eines reproduzierbaren Falls pruefen. Falls Geometrie innerhalb des sichtbaren XY-Bereichs wegen des Tiefenbereichs abgeschnitten wird, die gemeinsame ProjectionState-/Projektionsdefinition begrenzt korrigieren: Bildausschnitt waehrend Bearbeitung stabil halten, aber dargestellte Tiefe, Picking und Sichtbarkeit konsistent fuehren. Tests fuer lange/verschobene Wand, Kameradrehung, Vorschau/Abbruch und Auswahl ergaenzen. Keine neue Kameraart, kein automatisches Zoomen waehrend Mausbewegung und keine zweite Projektionslogik. Ergebnis und verbleibende Grenzen dokumentieren.

### Abschluss: unabhaengiger Tiefenbereich fuer 3D-Vorschauen — 04.10.2026

PR #79 (b1cdc93) und #80 (3541754) nach Freigabe normal in fix/reference-selection-lifecycle zusammengefuehrt; PR #80 zuvor von seinem Entwicklungsbasiszweig auf den Integrationszweig umgestellt. main bleibt unveraendert. Neuer Arbeitszweig fix/3d-preview-depth.

Fehler nachgewiesen: bei flacher Kamera liegt eine um 20m verschobene Wand noch innerhalb des XY-Bildes, aber ausserhalb der bisherigen NDC-Tiefe; dadurch verschwinden Darstellung und Picking. ProjectionFrame hat jetzt einen optionalen separaten depthRadius. Ein gemeinsamer Geometriehelfer erweitert nur den Tiefenbereich in Zweierpotenz-Stufen um die dargestellten Grenzen. XY-Massstab, Bildzentrum und Pan bleiben gleich. Projektion, Ableitungen, Workplane, Picking, Sichtbarkeit und Auswahlkontur verwenden denselben Rahmen. Die gemeinsame BimSolidView-Projektion umfasst Ausgangsmodell und Vorschau; kein zweiter Solver oder Kamerapfad, keine Modellmutation.

322 Tests bestanden, TypeScript und Build erfolgreich, ESLint 0 Fehler/6 bekannte Warnungen. Vier neue Tests pruefen den konkreten 20m-Fehler inklusive Picking/Sichtbarkeit, lange 60m-Vorschau bei verschiedenen Kamerawinkeln, unveraenderte XY-/inverse Koordinaten, Referenzsession und Abbruch sowie validierte immutable Tiefenwerte und stabile Stufen. Browser: aktuelles Nutzerprojekt mit einer 3,66585m-Wand und Fenster erhalten. Nach flacher Kamerastellung Element auf Y-Achse mit 20m als Vorschau getestet: Wand, Oeffnung und Umrandung bleiben vollstaendig sichtbar, Bildrahmen bleibt ruhig. Abgebrochen, keine Testbewegung uebernommen, Kamera zurueckgesetzt. Screenshot outputs/3d-preview-depth.jpg ausserhalb des Repositories.

Abnahme: Ansicht flach drehen, sichtbaren Wandfusspunkt anklicken, Element auf Y-Achse waehlen und eine grosse Strecke als Vorschau eingeben. Solange die Wand innerhalb des Bildausschnitts liegt, darf sie nicht allein aufgrund ihrer Tiefe verschwinden. Abbrechen stellt die Ausgangsdarstellung wieder her. Normales Verlassen des Bildrandes bleibt erwartetes Clipping.

Grenzen: GPU-Tiefengenauigkeit bleibt endlich; bei sehr grossen Entfernungen koennen eng benachbarte Flaechen durch NDC-Toleranz/Umrandungsbias optisch zusammenfallen. Kein Grosskoordinaten-Umbau und keine neue Kameraart. Beim Wechsel einer Tiefenstufe kann eine laufende Hover-Verweildauer unterbrochen werden; aktivierte Referenzen und gepinnter Ursprung bleiben erhalten. Automatisierte Pruefung verschiedener Kameras, keine Mehr-GPU-Abnahme.

### Abgeschlossener Folgeauftrag: 3D-Wandfusskanten als Richtungsreferenzen

Die vorhandene gemeinsame Segment-Hover-/Parallelfuehrung an sichtbare Wandfusskanten auf z=0 anschliessen. Zunaechst nur diese vorhandenen Quellen: 600ms aktivieren beziehungsweise beim erneuten Verweilen loesen, Richtungen durch die gemeinsame Engine verwenden. Sichtbarkeit, lokale Kandidatensuche, Bewegungsausschluss, Ursprungsreferenz und Navigation beibehalten. Keine zweite Segmenterkennung, keine oberen Kanten/Z-Fuehrung und keine neue Modellaktion. Sichtbare versus verdeckte Kante, Aktivieren/Loesen, passive Ansicht und laufende Wandbewegung pruefen.

### Abschluss: 3D-Wandfusskanten verfolgen — 04.10.2026

PR #81 nach Freigabe normal in fix/reference-selection-lifecycle uebernommen (6b8a5ac); main unveraendert. Zweig feat/3d-edge-references. Bestehenden lokalen Quellenindex ohne Algorithmusaenderung nach constraints/snapping/local-source-index.ts herausgezogen; bisheriger Application-Adapter samt Projektcache und Exporten bleibt kompatibel. Rendering-Adapter liefert reale untere Materialkanten aus derselben Kantenableitung wie die Auswahlumrandung. Kein zweiter Indexalgorithmus, Hover-Timer oder Richtungsloeser.

Sichtbare lokale Kanten verwenden die gemeinsame 600ms-Aktivierung und erneutes Verweilen zum Loesen. Gestrichelte Kantenanzeige beim Hover, staerkere aktive Kante und bestehender hohler Ring am Referenzmittelpunkt. Parallelrichtungen stehen auch am gepinnten Ursprung einer laufenden Wandbewegung bereit; bewegte Wand wird als Quelle ausgeschlossen. Kameranavigation behaelt aktivierte Referenzen. Quellen gehen erst durch die Sichtbarkeitspruefung; Richtungen ausgeblendeter Referenzen werden in der aktuellen Ansicht nicht weiter angeboten.

326 Tests bestanden, TypeScript und Build erfolgreich; ESLint 0 Fehler/6 bekannte Warnungen. Neue Tests: Cache/Materialkanten und bodentiefe Oeffnung, lokale CSS-Abfrage bei Zoom, verborgene und bewegte Kanten, unveraenderte Punkterkennung, 599/600ms-Aktivierung plus Wiederholungsloesung und Navigationssession, schräge Parallelrichtung am Bewegungsursprung samt fernen Referenzquellen. Die vorhandenen lokalen Index-/Dichte-/Schnittpunkttests bestehen nach der Extraktion weiter.

Browserabnahme am angezeigten Beispielprojekt (3m-Wand, Fenster): passive untere Kante aktiviert, aktive SVG-Kantenmarkierung und Status 1 bestaetigt; wegbewegen und erneut verweilen loest sie (Status 0). Erneut aktiviert, Zoom-out behaelt Referenz und Hilfslinie. Screenshot outputs/3d-edge-reference.jpg ausserhalb des Repositories. Esc raeumt auf. Keine Modellaktion waehrend dieser Browserabnahme. Die laufende Bearbeitung mit einer zweiten schraegen Wand wurde automatisiert auf Adapter-/Engine-Ebene geprueft; ein vollstaendiger Browserdurchlauf folgt im naechsten Auftrag.

Abnahme: SNAP einschalten, in 3D ueber einem sichtbaren Abschnitt der unteren Wandkante verweilen. Nach 0,6s bleibt sie als Richtungsreferenz markiert. Maus weg und erneut 0,6s auf denselben Abschnitt halten zum Loesen. Zoomen darf die Referenz nicht entfernen. Bei einer Wandbewegung eine andere Wand als Referenz verwenden.

Grenzen: nur z=0-Materialkanten, keine oberen Kanten oder freie Z-Fuehrung. Segmentmittelpunkt muss zusaetzlich zum Hoverpunkt sichtbar sein; teilweise verdeckte Kanten koennen daher konservativ entfallen. Mesh-Unterteilungen an Oeffnungen koennen mehrere kollineare Referenzabschnitte ergeben. Keine allgemeine Sichtbarkeitszerlegung oder Grossprojekt-/Mehr-GPU-Messung. Temporäre Referenzen werden nicht gespeichert oder exportiert.

### Gepruefter Folgeauftrag mit offener manueller Dateidialog-Abnahme: gemeinsamer 2D-/3D-Bearbeitungsablauf

Einen kleinen Grundriss mit zwei unterschiedlich gerichteten Waenden und Fenster durchgaengig pruefen: 3D-Fusskante als Referenz aktivieren, andere Wand mit gepinntem Ursprung parallel bewegen, Tab-Masseingabe, Abbruch und bestaetigte Aenderung, Undo/Redo, 2D-/3D-Abgleich, Projektdatei wieder oeffnen und IFC exportieren. Gefundene Fehler zuerst im gemeinsamen Pfad beheben und einen reproduzierbaren Abnahmenachweis dokumentieren. Keine neue Bauteilart oder weitere 3D-Fangmodi in diesem Auftrag.

### Ergebnis: gemeinsamer Parallelbewegungs-Ablauf — 04.10.2026

PR #82 normal in fix/reference-selection-lifecycle zusammengefuehrt (26ff206). Zweig test/3d-parallel-workflow. Kein neuer Modellfehler nachgewiesen; keine Produktionslogik geaendert. Durchgaengiger Regressionstest verbindet lokale Fusskantenabfrage, 600ms-Aktivierung, schräge Parallelfuehrung, numerische 2,5m-Eingabe, Vorschau/Abbruch, Validierung, einen Undo-Schritt, Redo, JSON-Laden, gleiche Solid-Geometrie und korrekte IFC-Positionen/Elementzahlen. Gesamtsuite 327 Tests, TypeScript und Build erfolgreich, ESLint 0 Fehler/6 bekannte Warnungen.

Browserabnahme in separatem Test-Tab: zweite schräge Wand gezeichnet, Fensterwand an ihrer Kante parallel bewegt, Tab fixiert 342,897271 Grad, 1m eingegeben und uebernommen. Grundrissversatz (0,955779; -0,294086)m entspricht der Richtung; Referenzwand unveraendert. Undo auf Ursprung und Redo auf exakt dieselben SVG-Wandtransformationen bestaetigt. Abbruch und Ansichtswechsel geprueft, Export-Schaltflaechen ausgeloest.

Offen bleibt die manuelle Abnahme von tatsaechlichem Browserdownload und erneutem Oeffnen derselben Datei: die vorhandene Browsersteuerung kann keinen Datei-Upload, native Desktopautomatisierung ist fuer diese App nicht zulaessig. Kein pauschaler Vollabnahme-Status. Dateirundlauf und IFC-Inhalt sind automatisiert nachgewiesen. Konkrete Anleitung und weitere Grenzen stehen in docs/acceptance/2026-10-04-parallel-workflow.md. Bestehende Hover-Unterbrechung bei Tiefenstufenwechsel und Sichtbarkeitsgrenzen nicht als neue Fehler umgedeutet.

### Zukünftiger Anforderungskatalog: AI im CAD — 04.10.2026

Der Nutzer hat CAD_BIM_2026_AI_Strategie.pdf als Zukunftsvision bereitgestellt. Original: docs/ai/CAD_BIM_2026_AI_Strategie.pdf; für Codex lesbarer Katalog mit AI01–AI35: docs/ai/AI_FUTURE_VISION.md. Enthält Modellabfragen, kontrollierte Änderungen, Qualitätsprüfung, generative Planung und spätere Fachanalysen. Kein AI-Feature in diesem Dokumentationsschritt implementiert. Architekturvertrag und aktueller nächster Auftrag bleiben maßgeblich. Die spätere AI-Reihenfolge lautet Lesen → Prüfen → Ändern → Entwerfen; Einordnung in den Gesamtplan folgt erst mit den erforderlichen Modell-/Werkzeuggrundlagen.

### Abgeschlossener Planungsauftrag: Ebenenvertrag und Dateimigration vorbereiten

Gemaess Entwicklungsleitfaden Etappe 4 die Ebenengrundlage vor weiteren Bauteilen abgleichen: bestehende Anforderungen und N01–N60, Layer versus AssemblyLayer, stabile layerId-Zuordnung fuer Waende/Fenster/Linien, alte Projektdateien und gemeinsame Sichtbarkeits-/Fangfilter. Einen begrenzten technischen Vertrag und genau einen anschliessenden Implementierungsauftrag dokumentieren. Noch offene Produktentscheidungen (insbesondere ansichtsbezogene versus globale Sichtbarkeit) ausdruecklich markieren, keine Nutzerentscheidung erfinden. Keine leeren Klassen oder Schemaaenderung in diesem Planungsauftrag. Die offene manuelle Dateidialog-Abnahme bleibt im Abnahmebericht stehen.

### Ergebnis: Ebenenvertrag — 04.10.2026

PR #83 nach Nutzerfreigabe direkt per Merge-Commit 26987d1 in fix/reference-selection-lifecycle uebernommen; keine erneute Testausfuehrung des bereits geprueften Commits. main unveraendert. Auf docs/layer-migration-contract Modell-/Dateigrenze, History, lokale Fangquellen und Guide-Etappe 4 mit den relevanten N-Anforderungen abgeglichen. Schema 1 hat noch keine Ebenen. [docs/LAYER_CONTRACT.md](docs/LAYER_CONTRACT.md) dokumentiert Bestand, technische Grenzen, Schema-2-Vorschlag, kollisionssichere deterministische Migration, Verantwortlichkeiten und Abnahmekriterien. ARCHITECTURE.md erhaelt die verbindlichen Grenzen; keine Produktionsdateien oder Daten geaendert.

Globale versus ansichtsbezogene Sichtbarkeit, Host-/Fensterdarstellung, Auswahl bei Ausblenden und Ebenenloeschregeln bleiben offen. Fenster auf Ebene Fenster ist ein ausdruecklicher technischer Vorschlag, keine erfundene Nutzerentscheidung. Die zwoelf Guide-Standardebenen bleiben erhalten; Raum/Textelemente ergaenzen sie. Keine Umbenennung von 2D-Zeichnungen zu 2D-Ergaenzungen. Historische N01–N60-Matrix bleibt erhalten. Dokumentationspruefung: Quellpfade und Versionsannahmen abgeglichen, Diff auf Leerraumfehler geprueft; bestehender Nachweis 327 Tests aus PR #83, keine neue Test-/Browserabnahme behauptet. Offene manuelle Dateidialog-Abnahme bleibt bestehen.

### Abgeschlossener Folgeauftrag: Ebenendaten und Version-1-Migration

Den begrenzten Auftrag und seine Abnahmekriterien in [docs/LAYER_CONTRACT.md](docs/LAYER_CONTRACT.md) umsetzen: Schema 2, zentrale Standardebenen, layerId fuer vorhandene Wand/Fenster/Linie, validierte deterministische Migration an der Ladegrenze sowie gemeinsame atomare Zuordnungsaktion mit stabilem Ziel-/Projektkontext. Erzeugungspfade zentral versorgen. Kein Sichtbarkeitsfeld, keine Ebenen-UI, kein Loeschen und keine neuen Bauteile. Alte und neue Dateien, ID-Kollisionen, invalide/stale Ziele, History, Geometrie-/IFC-Erhalt pruefen; Suite, TypeScript, Build und Lint ausfuehren. Sichtbarkeitsentscheidungen werden erst vor dem nachfolgenden Sichtbarkeitsauftrag geklaert.

### Ergebnis: Ebenendaten und Migration — 04.10.2026

PR #85 nach Freigabe normal zusammengefuehrt (88b9f3f), main unveraendert. Umsetzung auf feat/layer-data-migration. Schema/Validierung aus model.ts nach domain/project/schema.ts gezogen, gemeinsame Geometriepruefung fuer alte und aktuelle Dateien erhalten. domain/layers/model.ts liefert die 14 Standardebenen samt kollisionssicheren IDs. interop/project-file/load.ts migriert nur validierte Version-1-Dateien; Runtime und neue Dateien verwenden strikt Schema 2. defaultLayerIds speichert die drei Erzeugungsvorgaben als Referenzen, unabhaengig von Anzeigenamen. Zentraler addWall/addWindow/addLine-Pfad versorgt alle bestehenden Erzeugungswege. Fenster startet auf Fenster, Wand auf Aussenwand, Linie auf 2D-Zeichnungen.

application/layers/actions.ts bietet Vorschau und atomaren Commit fuer Element-IDs, Projekt-ID und gepinnten Snapshot. Alle Typen nutzen dieselbe Aktion, vorhandene History und Modellvalidierung. Unbekannte/stale Ziele oder Ebenen aendern nichts; No-op erzeugt keinen Undo-Eintrag. Kein neuer Parser und keine separate AI-Logik. UI, Sichtbarkeit, Loeschen und Materialschichten unveraendert.

Nachweis: 335 Tests bestanden (acht neue Migration-/Zuordnungstests), TypeScript und Build erfolgreich; Lint 0 Fehler, 6 bekannte React-Refresh-Warnungen. Datei-Fixtures der bestehenden Tests auf Schema 2 aktualisiert, Unsupported-Version-Test bleibt erhalten. Modellgeometrie und deterministischer IFC-Inhalt vor/nach Zuordnung identisch. Diff/Format geprueft. Keine neue Browser- oder native Dateidialog-Abnahme behauptet; manueller Test: alte Datei oeffnen, Masse/Positionen vergleichen, unter neuem Namen speichern und erneut oeffnen. Schema 2 ist fuer alte Programmstaende nicht lesbar. AI-Zukunftskatalog unveraendert erhalten.

### Aufgenommene Plattformanforderung: Windows und macOS — 04.10.2026

Der Nutzer legt Windows und macOS als Zielplattformen fest. Browser versus installierbare Desktop-App bleibt offen. Gemeinsames Projektformat, CAD-/Domain-Logik und validierte Application-Aktionen sollen fuer beide Betriebsformen wiederverwendbar sein; Dateizugriff, Speicherung, Dialoge und Betriebssystemintegration erhalten passende Adaptergrenzen. Strg/Command, Maus/Trackpad sowie Grafik-/Abhaengigkeitskompatibilitaet sind bei betroffenen Aenderungen zu beruecksichtigen. ARCHITECTURE.md dokumentiert die Entscheidung, AGENTS.md macht sie fuer Codex auffindbar. Keine Desktop-Technologie, Mindestversion, Offline-Zusage oder neue Entwicklungsprioritaet festgelegt; die konkrete Auslieferung wird spaeter anhand eines repraesentativen Bearbeitungs-/Datei-/Exportablaufs auf beiden Systemen entschieden. Nur Dokumentation, kein Anwendungscode geaendert.

### Abgeschlossener Folgeauftrag: Ebenenzuordnung in Werkzeugeigenschaften

Fuer ausgewaehlte Wand, Fenster oder Linie einen gemeinsamen Ebenenselektor in der vorhandenen oberen Werkzeugeigenschaften-Leiste anbieten. Existierende Ebenen nach Namen anzeigen, Werte ueber stabile IDs an die gemeinsame Zuordnungsaktion geben. Projekt-/Auswahlwechsel duerfen keine alte Zuordnung auf ein anderes Ziel anwenden; laufende Direct-Edit-Vorschau kontrolliert beenden. Undo/Redo und Dateirundlauf pruefen, vorhandene Glass-Flow-Anordnung erhalten. Keine kopierten Typ-spezifischen Mutationen. Noch keine Ebenenerstellung/-umbenennung/-loeschung oder Sichtbarkeit; deren offenen Produktregeln bleiben getrennt. Text-/Voice-Adapter koennen spaeter denselben geprueften Aktionsvertrag nutzen, ein neuer freier Parser gehoert nicht in diesen UI-Auftrag.

### Ergebnis: gemeinsame Ebeneneigenschaft — 04.10.2026

PR #86 nach Freigabe normal integriert (a57e41c); main unveraendert. feat/layer-properties ergaenzt genau eine LayerProperties-Komponente in der oberen Leiste. Ein kontrolliertes Auswahlfeld zeigt Ebenennamen und sendet stabile IDs, gepinnten Projektstand und Zielkontext. Gemeinsame Application-Auswahlaufloesung in application/layers/selection.ts; editingReducer verarbeitet assign-layer ueber commitLayerAssignment, nicht ueber Werkzeugmutationen. Aktuelle Auswahl und Typ muessen passen; veraltetes Modell, geloeschtes Ziel und unbekannte Ebene werden ohne Teilwirkung abgelehnt. Bei Erfolg endet eine geometrische Vorschau ohne deren Geometrie zu uebernehmen. Referenzauswahl sperrt das Feld. Gleichbleibende Zuordnung erzeugt keinen Undo-Schritt.

338 Tests bestanden, TypeScript/Build erfolgreich, Lint 0 Fehler/6 bekannte Warnungen. Drei neue Controller-Tests pruefen Vorschauabbruch, einen History-Schritt, No-op, Undo/Redo, Dateirundlauf, wechselnde/stale Ziele und gemeinsame Fenster-/Linienzuordnung. Browser in separatem Tab: Wand Aussenwand → Innenwand, Undo/Redo, Bewegung starten und auf Neutrale Ebene wechseln (Bewegungsfenster endet, Wand bleibt 3m); Fenster auf Bemassung und nach 3D-Wechsel bestaetigt; neue Linie von 2D-Zeichnungen auf Textelemente, nach Wiederwahl erhalten. Ein im Browser gefundener doppelter React-Key zwischen zwei Eigenschaften-Komponenten wurde durch getrennte Keys korrigiert; frischer Tab zeigt genau ein Ebenenfeld nach Undo/Redo. Sichtkontrolle der Glass-Flow-Leiste bestanden. On-Demand-Menue kann nach Navigatorauswahl benachbarte Navigatorziele ueberdecken; zum Wechsel ggf. schliessen. Kein neuer Dateidialog-Nachweis.

Abnahme: Element anklicken → oben Ebene waehlen → Undo/Redo (danach Element wieder auswaehlen). Bei Fenster/Linie wiederholen. Eine Bewegung beginnen und Ebene wechseln: nur die Zuordnung wird gespeichert, keine Vorschauverschiebung. Ebenen wirken weiterhin nur organisatorisch; Ausblenden ist noch nicht implementiert.

### Abgeschlossener Folgeauftrag: Ebenen erstellen und umbenennen

Organisation > Ebenen als kleines Glass-Flow-Fenster mit vorhandenen Ebenen und Aktionen Erstellen/Umbenennen ergaenzen. Validierte gemeinsame Application-Aktionen mit stabilen IDs, Projektkontext und bestehender History; keine Umbenennung durch Ersetzen von IDs. Namen trimmen und leere Namen ablehnen; Umgang mit doppelten Anzeigenamen vor Umsetzung explizit festlegen, ohne bestehende gueltige Dateien unbemerkt umzuschreiben. Erzeugungsvorgaben bleiben ID-basiert. Neuanlage/Umbenennung, Undo/Redo, Dateirundlauf und sofortige Aktualisierung des gemeinsamen Ebenenselektors pruefen. Keine Ebenenloeschung oder Sichtbarkeitsregeln in diesem Schritt; keine neue Bauteilart.

### Ergebnis: Ebenenverwaltung — 04.10.2026

PR #88 normal integriert (64ff290), main unveraendert. feat/layer-manager ergaenzt Organisation > Ebenen mit Erstellen und Umbenennen. Das Menue ist auch ausserhalb der nur fuer grosse Bildschirme eingeblendeten allgemeinen Menueleiste angeordnet. LayerManager liefert Namen, stabile ID und gepinnten Projektstand an dieselbe Application-Grenze. previewLayerManagement/commitLayerManagement validieren und verwenden die vorhandene History; der Controller beendet geometrische Vorschauen ohne deren Uebernahme. Oeffnen beendet laufende Zeichen-/Bearbeitungsgesten. Das Fenster meldet unmittelbar uebernommene Aktionen ausdruecklich; Schliessen verwirft nur noch nicht abgesendete Eingaben.

Festgelegte technische Namensregel: aussen trimmen, leere Namen ablehnen, neue Namenskollisionen nach NFC-Normalisierung und Kleinschreibung ablehnen. Bereits gespeicherte doppelte Namen bleiben gueltig; unveraendertes Umbenennen bleibt ein No-op. In der Verwaltung werden nur bei identischen Anzeigenamen IDs zur Unterscheidung ergaenzt. Keine Schemaaenderung, Loeschung, Sichtbarkeit oder stillschweigende Neuzuordnung. Auch Standardebenen sind umbenennbar, ihre Erzeugungsvorgaben bleiben an IDs gebunden.

Nachweis: 341 Tests bestanden, TypeScript und Build erfolgreich, Lint 0 Fehler/6 bekannte Warnungen. Neue Tests pruefen Erstellen/Zuordnen/Umbenennen samt Undo/Redo/Dateirundlauf, No-op, erhaltene Defaults, invalide Namen und IDs, stale Kontext und bestehende gleichnamige Ebenen. Browser in separatem Tab: Bestand erstellt, ' außenwand ' abgelehnt, Bestand zu Altbau umbenannt, Wand zugeordnet, belegte Ebene zu Bestandswand umbenannt. Selektor zeigt neuen Namen bei identischer ID; Undo liefert Altbau, Redo Bestandswand. Glass-Flow-Fenster visuell geprueft. Dateidialog und macOS nicht neu abgenommen.

Abnahme: Organisation > Ebenen → eigene Ebene erstellen → schliessen → Wand auswaehlen und zuordnen → zugeordnete Ebene umbenennen. Im Selektor muss der neue Name erscheinen; Undo/Redo bleibt nutzbar. Noch keine Sichtbarkeitswirkung erwarten.

### Nutzeranpassung: bewegliches Ebenenfenster und Loeschschutz — 05.10.2026

PR #89 auf feat/layer-manager erweitert, noch nicht zusammengefuehrt. Eigenstaendiges nichtmodales Glass-Flow-Fenster innerhalb der Anwendung, 720 x 560 Pixel mit Begrenzung auf die Bildschirmgroesse. Titelzeile verschiebbar per Ziehen oder Pfeiltasten; scrollbare Ebenenliste und feststehende untere Schaltflaechen. Namen direkt anklicken: Enter/Fokusverlust uebernimmt, Escape verwirft die Eingabe. Erstellen waehlt einen freien Vorschlagsnamen, der unmittelbar bearbeitet werden kann.

Der Nutzer hat Loeschen jetzt ausdruecklich beauftragt: ausschliesslich leere eigene Ebenen. Gemeinsame Application-Aktion prueft Belegung durch Wand/Fenster/Linie, Standardidentitaeten und Erzeugungsvorgaben. Standards bleiben nach Umbenennung und Dateirundlauf geschuetzt. Technische Regel ohne Schemawechsel: reservierte Standard-IDs layer:<standard-key> einschliesslich positiver Migrationssuffixe bleiben geschuetzt; importierte IDs in diesem Namensraum werden konservativ ebenfalls geschuetzt. Neuanlage darf diese IDs nicht verwenden. Weitere Elementtypen muessen die gemeinsame Belegungspruefung erweitern. Kein Loeschen per direkter UI-Mutation und keine automatische Neuzuordnung.

Nachweis: 343 Tests bestanden, inklusive Loeschen/Undo/Redo/Dateirundlauf, belegter Ebenen fuer alle drei Typen, saemtlicher Standards, umbenannter und migrationsbedingt suffigierter Standards, reservierter IDs und veraltetem Kontext. TypeScript und Build erfolgreich; Lint 0 Fehler/6 bekannte Warnungen. Browser: Inline-Umbenennen, Escape, leere Ebene anlegen/loeschen/Undo, Standard-Loeschsperre nach Umbenennen, Wandzuordnung mit belegter Loeschsperre und Verschieben geprueft. Liste hat eigenen Scrollbereich, Schaltflaechen bleiben darunter. Keine neue macOS- oder Dateidialog-Abnahme.

Abnahme: Organisation > Ebenen, Fenster am Titel ziehen, Namen anklicken und Enter druecken. Eigene leere Ebene erstellen und loeschen; bei Standardebenen und einer einer Wand zugeordneten Ebene muss Loeschen deaktiviert sein. Undo stellt eine geloeschte Ebene wieder her.

### Planungsauftrag: gemeinsame Ebenensichtbarkeit konkretisieren

UI-Nachbesserung 05.10.2026 (PR #89): Ebenenfenster auf 520 Pixel Breite reduziert, Listenschrift 12 Pixel und kleinere Zeilenabstaende; expliziter Schliessen-Button im Fussbereich. Werkzeugeigenschaften zentral auf 130 Pixel Hoehe fixiert (zuvor gemessene Wandauswahl), mit internem Scrollen bei groesserem Inhalt. Browsermessung bestaetigt 130 Pixel fuer Wand, Fenster und leere Auswahl; Schliessen und kompakte Darstellung geprueft. TypeScript und Build erfolgreich. Reine Darstellungsaenderung, keine Modellaktionen geaendert.

Vor der Implementierung den gemeinsamen Filtervertrag fuer Darstellung, Picking und lokale Fangquellen einschliesslich aktiver Referenzen ausarbeiten. Nutzerentscheidung zu globaler versus ansichtsbezogener Sichtbarkeit einholen; Persistenz und Host-/Fensterdarstellung ausdruecklich klaeren. Laufende Bearbeitung/aktuelle Auswahl bei Ausblenden sowie Export unabhaengig von Bildschirmfiltern festlegen. Bestehende ModelView-/ViewportBinding-Zielarchitektur beachten, keinen zweiten Modellzustand und keine werkzeugspezifischen Filter bauen. Genau einen begrenzten Implementierungsauftrag mit Abnahmekriterien ableiten; bis zur Entscheidung keine versteckte Default-Sichtbarkeitsregel implementieren.

### Planungsstand nach PR #89 — 05.10.2026

PR #89 nach Nutzerfreigabe normal zusammengefuehrt (48a896f), main unveraendert. docs/LAYER_VISIBILITY_PLAN.md dokumentiert Codeabgleich und vorhandenen allowed-Filter vor lokalen Paarvergleichen. Nutzerentscheidung: BIM-Projekt samt Arbeitsansichten teilt einen Filter; Ausschnitte/Abbilder haben unabhaengige Filter, die auch im Layoutbuch gelten. Kein vorgeschalteter BIM-Filter fuer Ausschnitte. Speicherung, Ausschluss vom Picking/Fang, Abbruch verborgener Bearbeitungsziele, Host-/Fensterregel und vollstaendiger IFC-Export bestaetigt. ARCHITECTURE.md aktualisiert. Startfilter neuer Ausschnitte und Undo-Semantik bleiben offen. Produktionscode unveraendert, Dokumentationsdiff geprueft.

Genau ein Folgeauftrag: die reine gemeinsame Eligibility-Policy fuer Wand/Fenster/Linie mit explizitem BIM-/DrawingDocument-Kontext implementieren und gemaess docs/LAYER_VISIBILITY_PLAN.md testen. Insbesondere dieselbe Ebene im BIM-Kontext verborgen und im Ausschnitt sichtbar pruefen. Noch keine UI-/Dateiformat-/Layout-Erweiterung in diesem ersten Auftrag.

### Ergebnis: gemeinsame Sichtbarkeitspruefung — 05.10.2026

PR #90 normal integriert (915d3b9), main unveraendert. feat/layer-visibility-policy ergaenzt application/layers/visibility.ts mit einem unveraenderlichen BIM-/DrawingDocument-Kontext. Gemeinsame ID-Abfrage fuer Wand/Fenster/Linie, Host-Regel, konkrete Ablehnungsgruende und Schutz gegen veralteten Projekt-/Filterkontext. Einmalige Validierung und ID-Maps statt Elementscan bei jeder Abfrage. Keine UI oder Persistenz; eine DrawingDocument-ID ist vorerst ein Bindungstoken, dessen Existenz spaeter der Ansichtsadapter validieren muss.

347 Tests bestanden, darunter vier neue Tests fuer unabhaengige BIM-/Ausschnittfilter, alle Host-/Fenster-Kombinationen, unbekannte IDs, veraltete Kontexte, immutable Eingaben und unveraenderte JSON-/Solid-/IFC-Daten. TypeScript und Build erfolgreich; Lint 0 Fehler/6 bekannte Warnungen. Kein neuer Browsernachweis, da die UI noch unveraendert bleibt. Praktische Abnahme im Canvas ist erst nach Integration moeglich.

Genau ein naechster Auftrag: die gemeinsame Policy in die vorhandene lokale Fangabfrage und Referenzvalidierung einbinden, mit explizitem Kontext und all-visible-Kompatibilitaet fuer bestehende Aufrufer. Vor Paarbildung filtern; aktive entfernte Referenzen und abgeleitete Quellen gleich pruefen. Tests fuer Paarzahl, Guides und Kontextwechsel; kein neuer Schalter und keine Persistenz in diesem Schritt. Offene Startfilter-/Undo-Regeln vor spaeterer UI-/Dateiintegration klaeren.

### Ergebnis: Ebenenfilter in lokaler Fangabfrage — 05.10.2026

PR #91 normal integriert (d89e43b). feat/layer-snap-visibility bindet Project, Sichtbarkeit und Werkzeugpolicy in createVisibleToolSourceQuery. Vorhandener Geometrieindex bleibt geteilt; Filter greift vor Paarzahl/Schnittpunkten und bei entfernten aktiven Quellen samt flachen Ursprungsabhaengigkeiten. Exakter gepinnter Interaktionsursprung bleibt erhalten, stale Bindungen liefern keine Quellen. Bestehende Aufrufer ohne Filter bleiben kompatibel. Noch kein Sichtbarkeitsschalter, Persistenz oder vollstaendige Viewportintegration.

350 Tests bestanden (drei neue Tests fuer Paarzahlen, All-visible-Vergleich, abgeleitete/entfernte Referenzen, Guides, Kontextwechsel und Ursprung). TypeScript/Build erfolgreich, Lint 0 Fehler/6 bekannte Warnungen. Keine neue Browserabnahme; praktische Sichtbarkeitsabnahme folgt erst mit gemeinsam angeschlossenen Consumern.

Genau ein naechster Auftrag: Darstellung und normales Picking in 2D/3D auf dieselbe explizite Eligibility-Policy vorbereiten und testen, ohne das vollstaendige Project oder reale Fensteroeffnungen zu filtern. 3D-Verdeckungsdaten muessen die sichtbare Darstellung widerspiegeln. All-visible-Kompatibilitaet erhalten, noch kein Schalter/Dateiformatwechsel. Controller-Abbruch, explizite Shift-Urspruenge, 3D-Fussquellen und Referenzauswahl muessen vor spaeterer UI-Freigabe ebenfalls angeschlossen sein; dies ist kein Nachweis vollstaendiger Sichtbarkeit. Startfilter/Undo bleiben offen.

### Ergebnis: gemeinsame Darstellungsdaten vorbereitet — 05.10.2026

PR #92 normal integriert (dab5cfc). feat/layer-display-policy ergaenzt rendering/viewport/layer-display.ts: sichtbare Grundrisselemente, separate reale Oeffnungen und sichtbare Wandflaechen aus vollstaendig berechneter Geometrie. Kein gefiltertes Project, keine Volumenkennzahl am Darstellungsobjekt. Bestehende 3D-Picker und Verdeckungspruefung akzeptieren dieselben Flaechen. Vollstaendige Modellgrenzen bleiben erhalten; canPick weist veraltete 2D-Ereignisse ab. Adapter noch nicht in React-Viewports angeschlossen, kein UI-Schalter oder Dateiformatwechsel.

354 Tests bestanden: vier neue Tests fuer Grundrisslisten, unsichtbare Fenstersymbole bei unveraenderten Oeffnungen/IFC, verborgene Vorderwand ohne Picking/Verdeckung, unabhaengige Ausschnitte, alles verborgen sowie stale Kontexte. TypeScript/Build erfolgreich, Lint 0 Fehler/6 bekannte Warnungen. Keine neue Browserabnahme; der Nutzer kann im Canvas noch keine Ebenen ausblenden.

Genau ein naechster Auftrag: den expliziten Sichtbarkeitskontext durch die bestehenden Viewport-Adapter an diese Darstellungsdaten und Fangabfragen weiterreichen. Verborgene Ziele und Vorschauen abbrechen, Griffe/Umrandungen/Referenzwahl/Shift-Urspruenge und 3D-Fussquellen konsistent behandeln. All-visible-Verhalten erhalten und Kontextwechsel automatisiert pruefen; noch keine Persistenz/Schalter freigeben, solange ein Consumer fehlt. Startfilter neuer Ausschnitte und Undo-Semantik bleiben vor Dateiintegration offen.

### Ergebnis: Sichtbarkeitskontext in bestehenden Viewports — 05.10.2026

PR #93 normal integriert (e74ba3c), main unveraendert. feat/viewport-layer-visibility reicht eine gemeinsame unveraenderliche Policy vom Workspace an Grundriss, 3D und Referenzauswahl weiter. Ohne expliziten Filter bleibt alles sichtbar. Gemeinsame Darstellungsfilter arbeiten auch auf Direct-Edit-Vorschauen; Modellgrenzen und reale Fensteroeffnungen bleiben erhalten. Auswahlgriffe, Umrandung, lokale Fangquellen, aktive Referenzen vor Shift-Richtungsauswahl sowie 3D-Fusskanten und Verdeckungsflaechen beachten dieselbe Eligibility. Kein gefiltertes Project und keine neue Werkzeuglogik.

Verborgene Auswahl wird unmittelbar aus den Consumern entfernt, eine betroffene Bearbeitung ohne History-Eintrag abgebrochen. Spaete Bestaetigungen pruefen den aktuellen Kontext. Navigator kann verborgene Ziele nicht wieder aktivieren. Neu erzeugte Elemente werden weiterhin gegen den neuen Modellstand ausgewaehlt. Zoom veraendert die Identitaet des Sichtbarkeits-/Interaktionskontexts nicht.

358 Tests bestanden, davon vier neue Integrationstests fuer 3D-Fussquellen/aktive Referenzen, unabhaengigen Ausschnittfilter, Auswahl-/Abbruchgrenze ohne Modellcommit und konsistente Vorschaugeometrie. TypeScript und Build erfolgreich; Lint 0 Fehler/6 bekannte Warnungen. Browserabnahme OFFEN: die Browserverbindung lief beim Laden/Neuladen in Timeouts, obwohl der lokale Server HTTP 200 lieferte. Deshalb kein visueller Nachweis fuer diese Integration. Kein neuer Schalter, keine Speicherung des Filters, Schema 2 unveraendert; normale Anwendung bleibt all-visible. Ausschnitt-Datenmodell und Startfilter weiterhin nicht implementiert.

Praktische Abnahme nach Wiederherstellung der Browserverbindung: ueber einen temporaeren Testadapter den Workspace mit layerVisibility versorgen; Wand und Fenster selektieren/bearbeiten, Hostebene ausblenden, fehlende Griffe/Hilfsreferenzen und unveraendertes Undo pruefen. In 2D/3D und beim Navigator dieselben Ziele sperren. Danach wieder einblenden; Geometrie, Oeffnung, Fang und Kamera vergleichen. Dieser Test ist noch auszufuehren.

Genau ein naechster Auftrag: die BIM-Ebenensichtbarkeit als bedienbare, gespeicherte Projekteinstellung integrieren. Vor Umsetzung Undo-Semantik mit dem Nutzer festlegen; die ausstehende Browserabnahme dieser Adapter nachholen. Gemeinsame Ebenenliste um Sichtbarkeit erweitern, explizite Dateimigration mit all-visible fuer alte Projekte und Tests fuer Abbruch, Undo/Redo und Wiederladen. Keine neuen Ausschnitte oder Layoutfunktionen; deren Startfilter bleibt eine eigene offene Entscheidung.

### Ergebnis: BIM-Ebenensichtbarkeit mit eigenem Verlauf — 05.10.2026

PR #94 normal integriert (13f542e). Nutzerentscheidung: Modell-Undo/Redo aendert keine Ebenensichtbarkeit; die Ebenenpalette hat einen eigenen Undo-/Redo-Verlauf. feat/bim-layer-visibility implementiert Checkboxen je Ebene sowie die beiden getrennten Sichtbarkeitsbuttons. Gemeinsame Application-Aktion mit stabiler Ebenen-ID, Snapshot-Pruefung, No-op-Verhalten und maximal 100 Verlaufseintraegen. Umschalten beendet die laufende geometrische Vorschau ohne deren Commit. Modell-Redo bleibt bei Sichtbarkeitsaenderungen erhalten. Strg/Cmd+Z sowie Shift+Strg/Cmd+Z und Strg/Cmd+Y sind ausserhalb Texteingaben/Dialogs an die gemeinsame Modell-History angebunden.

Schema 3 speichert bimVisibility.hiddenLayerIds. Strikte V1/V2-Migration zeigt alte Dateien vollstaendig an und erhaelt IDs, Zuordnung und Geometrie. Unbekannte/doppelte verborgene Ebenen werden abgelehnt. Palette-Verlauf ist sitzungsbezogen und wird beim Laden zurueckgesetzt; der aktuelle Zustand bleibt gespeichert. Modell-Undo/Redo behaelt die aktuelle Sichtbarkeit bei. Geloeschte Ebenen-IDs werden entfernt; durch Modell-Undo wiederhergestellte Ebenen starten sichtbar, sofern sie im aktuellen Filter nicht enthalten sind. Alte Palette-Eintraege koennen keine geloeschten Ebenen wiedererzeugen. Ausschnitt-Startfilter bleibt offen; es werden weiterhin keine DrawingDocuments angelegt.

363 Tests bestanden, darunter fuenf neue Tests fuer gemischte Modell-/Palette-Verlaeufe, erhaltenes Modell-Redo, Abbruch mit spaetem Commit, JSON-Rundlauf und IFC, strikte V2-Migration/ungueltige Filter, Laden und geloeschte Ebenen. TypeScript und Build erfolgreich; Lint 0 Fehler/6 bekannte Warnungen. Browserabnahme weiterhin OFFEN: CDP-Fokusbefehl und Navigation laufen auch in einem neuen Tab in Timeouts. Keine erfolgreiche visuelle Abnahme behauptet.

Praktische Abnahme: Organisation > Ebenen oeffnen. Aussenwand deaktivieren: Wand und Fenster verschwinden gemeinsam, auch in 3D, und lassen sich nicht auswaehlen/fangen. Mit "Sichtbarkeit rueckgaengig" wieder einblenden. Wandlaenge auf 6 m aendern, Aussenwand ausblenden, global rueckgaengig: Wand bleibt verborgen; nach Palette-Undo muss sie mit 3 m erscheinen. Speichern und erneut laden erhaelt die verborgenen Ebenen; IFC enthaelt weiterhin alle Bauteile. Zusaetzlich laufende Verschiebung ausblenden, wieder einblenden und unveraenderte Geometrie pruefen. Vorherige V1-/V2-Datei laden: alles sichtbar.

Genau ein naechster Auftrag: den beschriebenen Ebenen-Gesamtablauf im Browser praktisch abnehmen (einschliesslich 2D/3D, Auswahl/Fang, Modell-/Palette-Undo, Dateidialogen und IFC) und gefundene Integrationsfehler beheben. Erst danach den naechsten Funktionsausbau aus dem Leitfaden planen.

### Nutzerauftrag: Ebenenumschalter in der Menueleiste — 05.10.2026

feat/layer-visibility-toolbar baut auf dem noch offenen PR #95 auf; keine Zusammenfuehrung ohne Freigabe. Die Menueleiste erhaelt einen kompakten Bereich "Ebenen" mit vier vorhandenen Lucide-Piktogrammen und deutschen Tooltips/ARIA-Namen: ausgewaehlte Ebene ausblenden, alle anderen ausblenden, alle ausblenden, Sichtbarkeit umkehren. Die ausgewaehlte Ebene ist die Ebene des aktuell ausgewaehlten Elements und wird namentlich angezeigt. Ohne Elementauswahl sind die ersten beiden Aktionen deaktiviert. Auf schmalen Fenstern bleibt die feste Leistenhoehe erhalten; die obere Leiste kann horizontal gescrollt werden. Kein Lovable-Entwurf erforderlich.

Alle vier Aktionen laufen durch changeLayerVisibility und den bestehenden Application-Controller. Auch die Mehr-Ebenen-Aktionen erzeugen genau einen Palette-Undo-Schritt, kein Modell-Undo. "Alle anderen" zeigt die Zielebene und verbirgt die restlichen Katalogebenen; "Umkehren" vertauscht sichtbar/verborgen fuer jede Ebene, einschliesslich leerer Ebenen. Die Fenster-Host-Regel bleibt bestehen: eine sichtbare Fensterebene zeigt keine Fenster einer verborgenen Wand. "Alle ausblenden" laesst sich ohne Auswahl durch "Umkehren" oder Palette-Undo aufheben.

365 Tests bestanden, TypeScript und Produktionsbuild erfolgreich; Lint 0 Fehler/6 bekannte Warnungen. Zwei neue Tests pruefen alle vier Aktionen, Teil-/Vollinversion, atomare Palette-History, No-ops sowie unbekannte IDs und veraltete Snapshots. Visuelle Browserabnahme weiterhin offen: frischer Tab scheitert beim Navigieren mit Timeout.

Praktischer Test: Wand anklicken, Ebenenname oben pruefen, Auge-aus druecken; danach Palette-Undo. Wand erneut waehlen und "Alle anderen" testen. "Alle" blendet den gesamten Katalog aus, "Umkehren" zeigt alles wieder an. Jede Aktion muss in der Ebenenpalette mit einem Undo-Schritt zuruecknehmbar sein; globales Modell-Undo darf die Filter nicht aendern.

Genau ein naechster Auftrag: die offene praktische Gesamtabnahme von Ebenenpalette und Ebenenumschalter samt 2D/3D, Fang/Auswahl, getrennten Verlaeufen und Speichern/Laden durchfuehren und gefundene Integrationsfehler beheben.

### Freigabe und Ergaenzung: Verlaufspfeile am Ebenenumschalter — 05.10.2026

Nutzerfreigabe fuer die Ebenen-Thematik einschliesslich PR #95/#96 nach Ergaenzung kleiner Undo-/Redo-Pfeile. Die beiden Piktogramme stehen direkt neben den vier Ebenenaktionen, mit Tooltips und deaktiviertem Zustand ohne passenden Verlaufsschritt. Sie nutzen exakt dieselbe VisibilityAction und dieselben History-Flags wie die Palette; keine zweite History und kein Modell-Undo. Ergaenzung in PR #96, anschliessend normale Integration von #95 und #96 freigegeben; main bleibt unveraendert.

365 Tests, TypeScript und Build erfolgreich; Lint 0 Fehler/6 bekannte Warnungen. Keine redundanten neuen Tests fuer die reine zweite UI-Anbindung. Praktische Browserpruefung erneut versucht: Navigation auch in einem neuen Tab mit Timeout, daher weiterhin kein visueller Nachweis. Nutzerfreigabe und automatisierte Nachweise ersetzen diesen offenen Nachweis nicht; Browserproblem separat offen halten.

Weiterer Codeabgleich gemaess Guide Etappe 5: Linienattribute und Polylinien sind vorhanden (application/drawing/actions.ts, lib/bim/lines.ts). Ein gespeichertes Schraffurelement und eine gemeinsame Polygon-Validierung sind noch nicht vorhanden. Schraffuren muessen dieselbe Ebenen-/Sichtbarkeits-, Auswahl-, Zeichen-, Direct-Edit- und History-Infrastruktur verwenden; keine eigene Fangengine.

Genau ein naechster begrenzter Auftrag: gemeinsame fachneutrale Pruefung einfacher geschlossener 2D-Polygonkonturen in geometry implementieren und testen, als Voraussetzung fuer Schraffuren. Endliche Koordinaten, mindestens drei verschiedene Eckpunkte, Nullkanten, Nullflaeche und Selbstschnitte/ueberlappende Kanten abdecken; gueltige konkave Konturen und beide Umlaufrichtungen zulassen. Vorhandene Geometrieprimitiven wiederverwenden. Noch kein Dateiformatwechsel, Mustereditor oder neuer Elementtyp in diesem Grundlagenauftrag. Anschliessend kann das erste gespeicherte Schraffurelement auf dieser geprueften Kontur aufbauen.

### Ergebnis: gemeinsame Pruefung einfacher Polygonkonturen — 05.10.2026

feat/simple-polygon-validation baut auf dem integrierten Stand f7c984d auf. geometry/polygons/simple-polygon.ts bietet validateSimplePolygon fuer einen einfachen, implizit geschlossenen 2D-Ring in Metern. Kein wiederholter Schlusspunkt; keine automatische Reparatur, Umsortierung oder Mutation. Beide Umlaufrichtungen, konkave Konturen und geradlinig fortgesetzte Zwischenpunkte sind erlaubt. Endliche Koordinaten, mindestens drei Punkte, Nullkanten, Ruecklauf, nicht benachbarte Beruehrungen, Kreuzungen und Ueberlappungen werden geprueft. Fehler liefern stabile Codes und betroffene Kanten-/Punktindizes; Erfolg liefert vorzeichenbehaftete Flaeche in m2 und Umlaufrichtung.

Vorhandene Point2-, Schnittpunkt-, Projektions- und Modellkompatibilitaetsfunktionen werden wiederverwendet; keine UI-/BIM-Abhaengigkeit oder werkzeugspezifische Kopie. Flaechenprodukte werden relativ zum ersten Punkt berechnet, um Ausloeschung durch Weltkoordinatenversatz zu vermeiden. Nicht darstellbare Rechnung wird abgelehnt. Modellkompatibilitaet bleibt eine numerische Grenze, kein Bildschirmfangradius. Eine Nullflaeche kann bereits als Kantenkontakt abgelehnt werden. Ein einzelner Ring ohne Loecher; keine Booleschen Operationen oder allgemeine robuste Topologie fuer beliebig extreme Koordinaten. Paarpruefung O(n^2) fuer Aktionsvalidierung, nicht fuer den Mausbewegungspfad. Keine Leistungszusage fuer sehr grosse Konturen.

375 Tests bestanden, davon zehn neue Polygon-Tests: Rechteck/Flaeche/Umlauf, Konkavitaet, kollineare Zwischenpunkte, ungueltige Koordinaten, Nullkanten/Schlusspunkt, Selbstschnitte mit und ohne Nettoflaeche, Selbstberuehrungen, Ruecklauf einschliesslich Ringschluss, Ueberlappung, kleine Konturen, grosse Versatze und Zahlenbereich. TypeScript und Build erfolgreich; Lint 0 Fehler/6 bekannte Warnungen. Testdatei im normalen npm-test-Lauf registriert. UI und Schema 3 unveraendert; keine neue Browserfunktion abzunehmen. Die vorher offene praktische Ebenenabnahme bleibt separat offen.

Reproduzierbare technische Abnahme: node --experimental-strip-types --test src/geometry/polygons/simple-polygon.test.ts. Ein konkaver Ring muss angenommen, ein gekreuzter oder zuruecklaufender Ring abgelehnt werden. Ein Canvas-Abnahmetest folgt erst mit einem angeschlossenen Elementwerkzeug.

Genau ein naechster begrenzter Auftrag: ein erstes gespeichertes 2D-Schraffurelement mit stabiler ID, Ebenenzuordnung, gepruefter einfacher Kontur und einfacher Fuellung als Domain-/Application-Slice einfuehren. Explizite Projektmigration, gemeinsame Create/Update-Aktion, Snapshot-Undo/Redo und Dateirundlauf pruefen; vorhandene IDs und BIM-Ablauf erhalten. Keine eigene Fangengine, kein Mustereditor oder vollstaendiges Zeichenwerkzeug in diesem Slice. Weitere Darstellungs-/Interaktionsadapter folgen auf diesen geprueften Modellvertrag. AI/Text/Voice nutzen spaeter dieselben Aktionen mit stabilem Zielkontext.

### Ergebnis: gespeichertes 2D-Schraffurelement, erster Modellschnitt — 05.10.2026

PR #97 nach Freigabe normal in den Entwicklungszweig integriert. feat/hatch-model ergaenzt domain/elements/hatch/model.ts und application/hatches/actions.ts. Einfache geschlossene Kontur in Metern, stabile projektweite ID, Ebene und solide Fuellung mit RGB-Farbe/Deckkraft 0..1. create/update liefern gepruefte Vorschauen; Commit nutzt die bestehende Modell-History mit einem Schritt, No-op ohne Eintrag und Schutz gegen veraltete Projekt-/Zielkontexte. Keine werkzeugeigene Mathematik, Fangengine oder zweite AI-Logik.

Schema 4 verlangt storey.hatches. Datei-Migration validiert V1/V2/V3 strikt vor Konvertierung und erhaelt Bauteile, IDs, Ebenen sowie bestehende V3-Sichtbarkeit. Alte Dateien bekommen eine leere Schraffurliste. Schraffuren werden in JSON gespeichert. Gemeinsame Ebenenzuordnung, Sichtbarkeitspolicy und Loeschsperre belegter Ebenen kennen Schraffuren bereits. IFC bleibt der bestehende BIM-Export ohne Umdeutung der 2D-Fuellung als Bauteil.

381 Tests bestanden, sechs neue Tests fuer Vorschau/Mutation/Commit/No-op/Undo/Redo, ungueltige Geometrie/Fuellung/IDs/Ebenen, stale Zielkontext, Ebenenschutz/Sichtbarkeit, Dateirundlauf/IFC-Unveraendertheit und strikte V3-Migration. Bestehende Tests und aktuelle Runtime-Fixtures explizit auf V4 angepasst; echte Altdateien bleiben Altversionen. TypeScript und Build erfolgreich; Lint 0 Fehler/6 bekannte Warnungen. Kein sichtbares Schraffurwerkzeug, Renderer, Picking oder Direct Edit in diesem Modellschnitt, keine neue Browserabnahme. Die offene Ebenen-Browserabnahme bleibt bestehen.

Technische Abnahme: node --experimental-strip-types --test src/application/hatches/actions.test.ts. Vorschau erzeugen, bestaetigen, Fuellung aendern, Undo/Redo und Speichern/Laden vergleichen; gekreuzte Kontur muss ohne Modellmutation abgelehnt werden. Im Canvas kann dies noch nicht bedient werden. Muster, optionale Fuellung/Kontur und Ausschnitt-Annotationen bleiben erhaltene Folgeanforderungen.

PR-Anzeige geprueft: Chat enthaelt weiterhin historische PR-Verknuepfungen, auch nach Merge. Auf GitHub waren vor Integration #97 acht PRs offen; danach verbleiben die alten #51-54/#57-59. Die ersten sechs Heads sind Vorfahren des aktuellen Entwicklungszweigs. Bei #59 fehlt nur der Merge-Commit dc1b1f5, dessen beide Eltern bereits enthalten sind. Diese alten PRs zielen auf main bzw. historische Zwischenzweige; keine automatische Komplettuebernahme nach main im Schraffurauftrag. Verknuepfung, GitHub-PR-Status und Integration in main sind getrennte Zustaende.

Genau ein naechster begrenzter Auftrag: den ersten bedienbaren 2D-Schraffurablauf an diesen Modellvertrag anschliessen: Kontur mit dem gemeinsamen Zeichen-/Fangpfad erfassen, per Doppelklick schliessen, Vorschau bestaetigen/abbrechen und solide Fuellung im Grundriss darstellen und auswaehlen. Vorhandene Ebenenpolicy, gemeinsames Modell-Undo und Werkzeugeigenschaften nutzen; Dateirundlauf und eine praktische Canvas-Abnahme pruefen. Keine neue Fang-/Eingabeengine und noch kein Mustereditor oder vollstaendiges Schraffur-Direct-Edit.

### Ergebnis: erstes 2D-Schraffurwerkzeug im Canvas — 05.10.2026

Nutzer hat die genannten offenen PRs vollstaendig freigegeben. #51, #52, #53, #54, #57, #58, #59 und #98 normal in ihre bestehenden Zielzweige integriert, ohne Squash/Rebase/Force-Push. #58 war Entwurf und wurde vor Merge auf ready gesetzt. GitHub danach ohne offene PRs. #51 hat main auf seinen historischen Head gebracht; die anderen Merges gingen in die historischen Zwischenzweige bzw. den aktiven Integrationszweig. Dies ist keine Behauptung, main enthalte den gesamten neuesten CAD-Stand. 68 nachweislich gemergte Chat-Verknuepfungen entfernt, GitHub-Historie bleibt bestehen.

feat/hatch-canvas schliesst das Modell an den vorhandenen Mehrpunkt-Zeichenablauf an. Werkzeug Schraffur (H) wechselt in 2D; Klicks setzen Eckpunkte, gemeinsame Winkel-/Laengeneingabe und Fang-/Referenzengine bleiben aktiv. Doppelklick oder Enter im Grundriss schliesst, Escape/Werkzeugwechsel verwirft. Ein expliziter Schlussklick auf den ersten Punkt wird nur im Zeichenadapter in den impliziten Ringschluss umgesetzt. Unzulaessige Kontur erzeugt keine History-Aktion. Die Vollkontur wird einmal durch createDrawing/previewHatch validiert und bestaetigt.

Solide Fuellung mit Farbe/Deckkraft erscheint hinter Waenden und Linien; Auswahl per Flaeche oder Navigator mit dezenter Umrandung. Eigenschaften in der festen oberen Leiste; Fuellungsanpassung ueber gemeinsame Hatch-Aktion, Ebenenzuordnung ueber bestehende Layer-Aktion. ElementTarget trennt auswaehlbare Elemente von momentan per Direct Edit bearbeitbaren Zielen. Keine vorgetaeuschten Schraffur-Bewegungsaktionen; AI/Text/Voice behaelt die stabile Auswahl und lehnt unpassende Wand-/Fensterbefehle ab. Schraffur-Sprachbefehle, Konturbearbeitung, Muster, optionale Kontur und Aussparungen bleiben offen.

Eckpunkte und alle vier bzw. n geschlossenen Kanten werden als Quellen in den bestehenden raeumlichen Index eingespeist. Keine neue Fangengine. Gemeinsame Sichtbarkeitspolicy filtert Darstellung, Auswahl und Fang; vollstaendige Plan-Grenzen enthalten Schraffuren. 3D und IFC bleiben BIM-only; Dateiformat bleibt Schema 4.

385 Tests bestanden: vier neue Integrationsfaelle fuer gemeinsame numerische Eingabe/Ursprung/Abbruch/Commit/History/JSON, Ringschluss/ungueltige/stale Abschluesse, geschlossene Fangquellen/verborgene Ebenen und Auswahl/Ebenenzuordnung/Plan-Grenzen/abgewiesene Sprachziele. Bestehender All-hidden-Darstellungstest um leere Schraffurliste erweitert. TypeScript und Build erfolgreich; Lint 0 Fehler/6 bekannte Warnungen. Browserabnahme OFFEN: Navigation eines frischen Tabs zu 127.0.0.1:8080 erneut mit Timeout; kein visueller oder echter Doppelklick-Nachweis behauptet.

Praktische Abnahme: Schraffur waehlen (H), drei bis vier Eckpunkte klicken und letzten Punkt doppelklicken. Fuellung und Auswahlumrandung pruefen. Farbe/Deckkraft aendern und Uebernehmen; Modell-Undo/Redo pruefen. Neue Kontur beginnen und Esc: kein Element. Gekreuzte Kontur versuchen: Fehlermeldung ohne Commit. Ebene ausblenden: weder Flaeche auswaehlbar noch Eckpunkte/Kanten fangbar; eigenes Ebenen-Undo stellt Sichtbarkeit wieder her. Speichern/Laden muss Kontur/Farbe/Ebene erhalten. Linie an Schraffurecke oder Kantenmitte beginnen. 3D darf kein neues BIM-Volumen zeigen.

Genau ein naechster begrenzter Auftrag: den beschriebenen Schraffur-Canvas-Ablauf praktisch abnehmen (einschliesslich Doppelklick, praeziser Eingabe, Abbruch, Eigenschaften, Ebenen, Undo und Dateirundlauf) und dabei gefundene Integrationsfehler beheben. Erst danach den naechsten Schraffur-Ausbau festlegen; keine neue Muster-/Direct-Edit-Etappe ohne diesen Bediennachweis beginnen.

### Korrektur: gemeinsame Schluss-Eckreferenzen beim Mehrpunktzeichnen — 05.10.2026

Nutzerabnahme meldet fehlende Fluchten der ersten und dritten Ecke beim Rechteckabschluss. Ursache: drawingSnapPolicy lieferte nur den letzten Zeichenursprung; der Konturanfang war noch kein Modellobjekt und deshalb nicht im raeumlichen Index. Korrektur im bestehenden PR #99, kein neuer paralleler PR und kein automatischer Merge.

ToolSnapPolicy kann feste temporaere Referenzen bereitstellen. Der gemeinsame drawingInteraction-Adapter erhaelt fuer Polylinie und Schraffur dieselbe unveraenderliche Punktliste. Ab zwei Punkten pinnt er Konturanfang und aktuellen Ursprung (maximal zwei Referenzen), samt erster/letzter Kantenrichtung. Bestehende cursorGuide-/Schnittpunktlogik erzeugt die beiden mausbezogenen Fluchten und ihren Fangpunkt, auch fuer gedrehte Rechtecke. Keine Rechteck-Sonderformel, keine zweite Engine oder allgemeine Paarvorberechnung. Die feste Referenz folgt aus dem bewussten Setzen eines Punktes; normale Hover-Referenzen behalten 600ms.

Die lokale Quellenabfrage erkennt diese Referenzen anhand ihrer exakten Interaktionsidentitaet, auch wenn sie keine sichtbare Modell-ID haben. Abgeleitete Hilfspunkte behalten ihre Originalabhaengigkeiten; ein neuer/abgebrochener Zeichenvorgang akzeptiert alte Quellen nicht. Zoom aendert die Policy-Identitaet nicht. Snap aus unterdrueckt den automatischen Fang. Bestehende Shift-Regel bleibt erhalten: explizite 45-Grad-Richtungsbindung hat Vorrang vor automatischem Schnittpunktfang. Fuer den Rechteckabschluss daher Shift loslassen. BimPlan behaelt den Fangkandidaten auch bei der gemeinsamen Eingabevorschau, solange deren Ziel dem Fangpunkt entspricht, und kann beide wirksamen Fluchten/Schnittpunktmarker zeigen.

389 Tests bestanden (vier neue Tests mit mehreren Unterfaellen). Geprueft: 0/27/45/90/-33 Grad, 20/100/600 px pro Meter, Anfang und dritte Ecke als Quellen, identischer vierter Punkt bei Polylinie/Schraffur, keine Modellmutation vor Commit, Wechsel/Abbruch/abgeleitete Referenzen, 600ms und Snap-/Shift-Vorrang. TypeScript und Build bestanden; Lint 0 Fehler/6 bekannte Warnungen. Keine neue erfolgreiche Browserabnahme; vorheriger Browser-Timeout bleibt als Nachweisgrenze bestehen.

Praktische Abnahme: Polylinie oder Schraffur starten, Punkte (0,0), (3,0), (3,2) setzen. Mit aktivem Snap ohne Shift zur vierten Ecke (0,2) fahren. Zwei temporaere Fluchten vom Anfang und aktuellen Ursprung muessen den Schnittpunkt anbieten. Dort bestaetigen/abschliessen; zoomen und mit gedrehtem Rechteck wiederholen. Kein Hover-Umweg zur ersten Ecke erforderlich. Abbruch darf keine Referenzen in die naechste Kontur uebertragen.

Genau ein naechster Auftrag: diesen korrigierten Rechteckabschluss und den noch offenen Schraffur-Gesamtablauf praktisch abnehmen und gefundene Bedienfehler beheben, bevor weitere Muster- oder Direct-Edit-Funktionen folgen.

### Nutzerkorrektur: Shift bindet Richtung UND erlaubt exakten Punktfang — 05.10.2026

Die vorherige Anweisung, Shift fuer den Rechteckabschluss loszulassen, ist hiermit ueberholt. Nutzer hat bestaetigt: die Richtung soll mit Shift feststehen, ein nahe liegender passender Hilfspunkt muss trotzdem exakt im Zentrum gefangen werden. Ursache war der fruehe Return im gemeinsamen querySnap: Shift lieferte nur die projizierte Mausposition, bevor Kandidaten gesammelt wurden.

Shift wird jetzt als temporaere feste Richtungsachse durch die vorhandene Kandidatenpruefung gefuehrt. Exakte End-/Mittel-/Segmentschnittpunkte sowie Hilfslinien-/Achsenschnittpunkte auf dieser Achse koennen im unveraenderten CSS-Fangradius gewinnen. Ausserhalb der Achse liegende Punkte werden abgelehnt, nicht scheinbar passend projiziert. Reine kontinuierliche Hilfslinienprojektionen zaehlen bei Shift nicht als exakte Fangpunkte. Ohne passendes Ziel bleibt die bisherige freie Position entlang der Shift-Richtung erhalten, ohne Raster-Sprung. Vorgegebene Bauteil-/Bearbeitungsachsen haben weiterhin Vorrang. Keine werkzeugspezifische Berechnung, kein neuer Hover-Timer und keine Dateiformataenderung.

391 Tests bestanden, TypeScript/Build erfolgreich, Lint 0 Fehler/6 bekannte Warnungen. Neue Regression prueft acht Mauspositionen im Fangkreis, fuenf Shift-kompatible Drehungen und drei Zoomstufen fuer beide Erstellungsarten; gespeicherte dritte/vierte/erste Ecke bilden jeweils einen rechten Winkel. Zusaetzlich exakter Endpunkt, Abweisung ausserhalb der Achse/des Radius, unveraenderte freie Projektion, ausgeschalteter Fang und View-Filter. Bisherige Tests fuer den alten Shift-Bypass an kompatiblen Mittel-/Schnittpunkten auf die neue Nutzerregel aktualisiert; feste Bearbeitungsachsen und anisotrope Projektionspruefungen bestehen weiterhin. Praktische Browserabnahme bleibt offen; kein neuer visueller Nachweis behauptet.

Praktischer Test: Schraffur oder Polylinie mit Shift entlang der ersten und zweiten Kante zeichnen. Shift weiter halten, Maus in den Kreis des vierten Hilfspunktes fuehren und innerhalb dieses Kreises leicht bewegen: der Fangmarker und das bestaetigte Ziel muessen auf dem exakten Fluchtenschnitt bleiben. Erst ausserhalb des Fangradius darf die Position wieder frei entlang der Richtung laufen. Mit anderer Zoomstufe und 45 Grad gedreht wiederholen.

Genau ein naechster Auftrag: den Shift-Rechteckabschluss praktisch bestaetigen und verbleibende Fehler des Schraffur-Gesamtablaufs beheben. Korrektur weiterhin im bestehenden PR #99; kein neuer PR und kein Merge ohne Freigabe.

### Freigabe PR #99 und Anforderung: steuerbarer Rasterfang — 05.10.2026

Nutzer hat PR #99 einschliesslich des exakten Shift-Fangs freigegeben. Normaler Merge des unveraendert geprueften Heads 74c4c65b6fe2b25277937eb17a9e59f8742e2da0 in fix/reference-selection-lifecycle: 7f18d4368fcb5b4adbb7689748ce82e291b2843e. Kein Squash oder History-Rewrite. Der Stand ist damit im Entwicklungszweig integriert; dies behauptet keine Integration des gesamten CAD-Stands in main. Den erledigten PR-Link aus der Chat-Anzeige entfernt.

Neue Nutzeranforderung fuer einen geeigneten spaeteren Schritt: Rasterfang komfortabel steuern. Codeabgleich: BimPlan uebergibt fest gridSpacing: 0.1 m. Der sichtbare Hintergrund verwendet hingegen die zoomabhaengige planScaleBar-Schrittweite. StatusBar bietet aktuell nur den gemeinsamen Schalter "Snap 0.10 m"; dieser deaktiviert auch geometrischen Punktfang. Eine einstellbare Rasterweite oder unabhaengige Rasterfang-Umschaltung gibt es noch nicht. Numerische Laengeneingabe ist bereits eine Alternative fuer exakte Masse; bei Shift ohne passendes Punktziel bleibt die Bewegung kontinuierlich entlang der Richtung.

Umfang fuer die spaetere Umsetzung: zentrale positive endliche Rasterweite in Metern, separate Rasterfang-Aktivierung bei weiterhin aktivem End-/Mittel-/Schnittpunktfang, nachvollziehbare Anzeige der wirksamen Schrittweite. Hintergrundraster und Fangraster ausdruecklich unterscheiden. Alle Zeichen- und Bearbeitungswerkzeuge verwenden denselben Einstellungsvertrag und die bestehende Engine; keine werkzeugspezifischen Rasterkopien. Bestehende Fangprioritaeten, feste Achsen, exakter Shift-Punktfang, 600-ms-Referenzen und Zoom-Erhalt bleiben bestehen. Konkrete UI-Platzierung, Werteauswahl und Speicherung als Benutzer- oder Projekteinstellung sind noch offen, nicht als Nutzerentscheidung vorweggenommen. Kein neues Dateiformat und keine Implementierung in diesem Dokumentationsschritt.

Nachweis: PR-Status MERGED und Merge-Commit ueber GitHub bestaetigt. Letzter unveraenderter Codestand: 391 Tests, TypeScript und Build erfolgreich, Lint 0 Fehler/6 bekannte Warnungen. Diese Laeufe wurden fuer die reine Dokumentation nicht wiederholt. Praktische Schraffurabnahme erneut versucht: neuer Browser-Tab, Navigation nach http://127.0.0.1:8080/ mit Timeout. Kein erfolgreicher visueller Nachweis. Die Nutzerfreigabe hebt diese dokumentierte Pruefgrenze nicht auf.

Genau ein naechster ausfuehrbarer Auftrag: den integrierten Schraffurablauf praktisch abnehmen und gefundene Bedienfehler beheben. Rechteck mit gehaltenem Shift zeichnen, exaktes Zentrum beim vierten Punkt pruefen, per Doppelklick abschliessen, Fuellfarbe/Deckkraft aendern, Undo/Redo sowie Speichern/Laden pruefen; danach Ebene ausblenden und Ausschluss aus Auswahl/Fang bestaetigen. Rastersteuerung bleibt als anschliessender kleiner gemeinsamer Komfortschritt vorgemerkt; Muster und Direct Edit werden hier noch nicht begonnen.

### Praktische Teilabnahme Schraffur nach PC-Neustart — 05.10.2026

Browser wieder bedienbar; lokaler Vite-Server nach Neustart gestartet. Am unveraenderten integrierten Codestand ein Rechteck im Canvas gezeichnet: erster Punkt, zweite/dritte Ecke jeweils mit Shift, vierte Ecke mit Shift und Doppelklick abgeschlossen. Drei verschiedene Mauspositionen im Fangkreis ergaben dieselben SVG-Vorschaukoordinaten der vierten Ecke (-0.7000000000000002, -0.5600000222524 in SVG-Koordinaten). Erste Ecke x=-0.7000000000000001, dritte Ecke y=-0.5600000222524: rechtwinklig innerhalb numerischer Genauigkeit. Nach Hover-Aktivierung wechselt die Anzeige erwartungsgemaess von Schnittpunkt zu Hilfspunkt, ohne Koordinatensprung. Genau eine Schraffur mit vier Eckpunkten angelegt, Navigator zeigt drei Elemente einschliesslich Ausgangswand/Fenster.

Bestanden im Browser: Deckkraft 35 auf 60 Prozent uebernehmen; Modell-Undo liefert SVG fill-opacity 0.35, Redo 0.6. Ausgewaehlte Ebene ausblenden entfernt die Schraffur aus den Canvas-Auswahlzielen; separates Ebenen-Undo stellt sie wieder her. Kein visueller Fangtest an verborgener Geometrie behauptet. Screenshot lokal outputs/hatch-browser-acceptance.png.

Offene Nachweise: Automatisches fill am nativen Farbfeld zeigt #4f86c6 im Eingabeelement, aber Uebernehmen behaelt #94a3b8. Ein Klick auf den nativen Farbwähler liefert keinen bedienbaren Picker im Screenshot. Noch nicht geklaert, ob Adapter-/Automationsgrenze oder App-Fehler; keine unbegruendete Codeaenderung. Save project meldet Download angefordert; Warten auf das Downloadereignis endet nach 30 Sekunden ohne Dateipfad. Wiederherstellung aus genau dieser Datei daher nicht nachgewiesen. Keine Aussage, dass die Datei sicher nicht gespeichert wurde. Browserverbindung danach wiederhergestellt, Testmodell im offenen Tab belassen.

Keine Laufzeitdateien geaendert, keine neuen Build-/Testlaeufe erforderlich. Die 391 automatisierten Tests bleiben der vorherige Nachweis, kein neu ausgefuehrter Lauf. Teilabnahme ersetzt die beiden offenen Bediennachweise nicht.

Genau ein naechster begrenzter Auftrag: Farbuebernahme und Download/Wiederoeffnen im Browser isoliert klaeren und nur nachgewiesene App-Fehler beheben. Danach ist die gemeinsame Rastersteuerung der vorgemerkte Komfortschritt.

### Abschluss der offenen Farb- und Dateipruefung — 05.10.2026

Die tatsaechlich heruntergeladene Datei Downloads/novikov-project (6).json enthaelt exakt die Testschraffur hatch-8a53cfd4-25fc-4e45-82d5-b8de74042be8, vier Eckpunkte, Ebene layer:drawing und Deckkraft 0.6. Der vorherige Download-Timeout betraf die Rueckmeldung der Automation; er ist kein nachgewiesener Speicherfehler. Datei ueber Open project und den echten Filechooser geladen: ID, Kontur, Farbe #94a3b8 und Deckkraft 0.6 im dargestellten SVG erhalten. Modell-Undo nach Laden stellt den vorherigen Stand mit #7c9e1f wieder her.

Auch die Farbuebernahme ist praktisch bestaetigt: der zwischenzeitlich im Farbfeld gewaehlte Wert #7c9e1f wurde per Uebernehmen zur SVG-Fuellfarbe. Die vorherige fill-Automation fuer das native Farbfeld ist kein belastbarer Nachweis eines App-Fehlers; kein Eingabehandler wurde auf Verdacht geaendert. Die manuelle Auswahl des Farbtons selbst wurde nicht vom Agenten automatisiert nachgewiesen.

Kleine nachgewiesene Anzeige-Luecken in CadWorkspace.tsx korrigiert: Ladebestaetigung zaehlt nun Schraffuren; IFC-Erfolgshinweis erwaehnt bei vorhandenen Linien oder Schraffuren, dass beide 2D-Elementarten nur in der JSON-Projektdatei enthalten sind. Keine Aenderung des Modell-/Exportformats. Ladehinweis erneut im Browser verifiziert (1 Schraffur); danach Dialog abgebrochen, um das aktuelle Modell zu behalten. Screenshot outputs/hatch-load-verified.png.

391 Tests erneut bestanden, TypeScript und Build erfolgreich; Lint 0 Fehler/6 bekannte Warnungen. Bisherige Nachweise zum Shift-Rechteck, Doppelklick, Deckkraft-History und Ebenenverlauf gelten weiterhin. Kein umfassender Nachweis fuer alle Schraffur-, Polygon- oder Exportfaelle behauptet.

Genau ein naechster begrenzter Auftrag: zentrale Rasterfang-Einstellungen fuer die bestehende gemeinsame 2D-Zeichen-/Bearbeitungspipeline implementieren. Rasterfang separat vom geometrischen Punktfang schalten und positive endliche Schrittweite in Metern eingeben; aktuelle Schrittweite anzeigen, Hintergrundraster davon unterscheiden. Vorlaeufig sitzungsbezogen ohne Dateiformatwechsel; Speicherung als Benutzer-/Projekteinstellung bleibt spaeter zu entscheiden. Bestehende gemeinsame Engine, Shift-Vorrang, Punktprioritaeten und Referenzerhalt verwenden und mit zwei verschiedenen Werkzeugen pruefen. Keine Rasterlogik pro Werkzeug duplizieren.

### Schraffuren: gemeinsame On-Demand-Bearbeitung — 05.10.2026

Nutzer priorisiert komplette Schraffurbewegung und jede Ecke vor Raster-Komforteinstellungen. PR #100 nach ausdruecklicher Freigabe normal in den Integrationszweig gemergt (d66389d). Neuer Zweig feat/hatch-direct-edit.

Alle sechs vorhandenen Aktionen geprueft und angebunden: Punkt frei bewegen, Punkt in Flucht strecken, Element frei bewegen, Element entlang Achse, X und Y. Jede Konturecke hat einen beschrifteten, per Maus/Tastatur bedienbaren Griff. Ursprung, Referenzen, Winkel/Laenge/Tab, Achsenzwang, Vorschau, Commit und Undo laufen durch dieselbe vorhandene Pipeline. Keine Kopie der Fang-/Eingabelogik. Gemeinsame Transformationen von lib/bim nach application/direct-edit verschoben, alter Importpfad bleibt als Re-Export erhalten; Schraffurkonturen werden ueber previewHatch validiert.

Richtungsregel wie bei bisherigen Linien: Punkt 1 verwendet Punkt 2 als Nachbarn, alle weiteren den Vorgaenger. Punktstrecken bewegt nur diese Ecke entlang jener Richtung; kein paralleles Versetzen einer ganzen Kante. Ungueltige Konturen (Kreuzung, kollabierte Kante), ungueltige Griffe und veralteter Modell-/Auswahlkontext werden ohne History-Eintrag abgewiesen. IDs, Fuellung und Ebene bleiben erhalten. Schraffur bleibt 2D, IFC unveraendert. AI/Text/Voice kann spaeter dieselben Aktionen mit stabiler Ziel-ID nutzen; keine neue Sprachgrammatik in diesem Auftrag.

393 Tests bestanden, TypeScript und Build erfolgreich, Lint 0 Fehler/6 bekannte Warnungen. Zwei neue Tests mit 24 Aktions-/Eckkombinationen pruefen exakte Transformation, gepinnten Ursprung, Attribute, einen History-Schritt, Undo/Redo, JSON sowie ungueltige Eingaben, Abbruch und stale context. Browser: vier Griffe und alle sechs Menueaktionen vorhanden, Ecke 1 um 0.2 m in 90 Grad bewegt, Gesamtkontur von Ecke 3 um 1 m in 0 Grad verschoben, Undo/Redo anhand SVG-Koordinaten bestaetigt. Aktiver Ursprungsring und gemeinsame Hilfseingabe sichtbar. Screenshot outputs/hatch-direct-edit.png. Keine Behauptung, alle 24 Varianten manuell im Browser geprueft zu haben.

Praktischer Abnahmetest: Schraffur anklicken, beliebige Ecke waehlen, Punkt frei bewegen starten. Hilfsursprung muss sofort erscheinen; per Maus oder Winkel/Laenge verschieben. Danach Element frei bewegen von einer anderen Ecke starten; alle Punkte muessen denselben Versatz erhalten. X/Y und Achse testen, Undo nutzen. Ecke durch die gegenueberliegende Kante ziehen: keine ungueltige Kontur uebernehmen.

Genau ein naechster Auftrag: die bereits vorgemerkte gemeinsame Rastersteuerung mit unabhaengigem Rasterfang und positiver Schrittweite sitzungsbezogen implementieren und fuer Zeichen- sowie Bewegungsaktionen pruefen. Schraffur-Kantenoffset, Muster und Sprachbefehle bleiben weitere Anforderungen.

### Knicken und Seitenstrecken fuer geschlossene Konturen — 05.10.2026

Nutzer priorisiert zwei Kantenaktionen fuer Schraffuren und geschlossene Polygone. Neuer Zweig feat/closed-contour-edges baut auf PR #101 auf; keine Freigabe fuer #101 in dieser Nachricht angenommen. Geschlossene Polygone entsprechen aktuell gespeicherten Schraffuren oder explizit geschlossenen Polylinien.

Quadratische Griffpunkte in jeder Seitenmitte oeffnen das On-Demand-Menue mit Knicken und Seite strecken. Knicken fuegt einen Punkt zwischen die beiden Kantenecken ein; Maus oder gemeinsame Winkel-/Laengeneingabe bestimmt dessen Ziel, danach normale Eckbearbeitung. Seite strecken bindet an die Kantennormale, versetzt die Seite parallel und schneidet sie mit beiden Nachbarkanten. Rechtecke bleiben dadurch rechtwinklig. Kantenwahl wird getrennt von der Eckwahl gehalten; der alte unspezifische Achsbefehl wird im Kantenkontext nicht angeboten. Ganzelement- und X/Y-Bewegung bleiben verfuegbar.

Gemeinsame Geometrie- und Application-Adapter, bestehende Ursprungsreferenz, Fangengine, Hilfseingabe, Abbruch und History. Keine automatische Aufloesung kollinearer Nachbarkanten: bei fehlendem eindeutigen Schnitt wird die Bearbeitung abgewiesen. Kollabierte/gekreuzte Konturen und Richtungsumkehr werden nicht uebernommen. Kein Lochsystem, offene Polylinien, BIM-Kanten oder Skalierung in diesem Auftrag.

396 Tests bestanden; TypeScript, Build erfolgreich, Lint 0 Fehler/6 bekannte Warnungen. Drei neue Tests mit Unterfaellen pruefen beide Elementarten, jede Rechteckkante, Einfuegen, Versatz, Rotationen, beide Umlaufrichtungen, Konkavitaet, degenerierte Nachbarn, ungueltige Ergebnisse, numerischen Versatz, Snapshot-/Abbruchschutz, History und JSON. Browser: vier Seitengriffe und kontextuelle Aktionen, Seitenbewegung und neuer fuenfter Punkt bestaetigt, Undo/Redo ausgefuehrt. Screenshot outputs/contour-edge-edit.png. Rotations-/Konkavitaetsfaelle automatisiert, nicht alle manuell geprueft.

Abnahme: Rechteckschraffur oder geschlossene Polylinie waehlen, quadratischen Seitengriff klicken. Seite strecken starten und senkrecht ziehen oder Laenge eingeben; Rechteck muss breiter/schmaler bleiben. Andere Seite waehlen, Knicken und Ziel setzen; ein neuer Punkt entsteht. Undo muss genau die letzte Aktion zuruecknehmen. Kantenkollaps darf nicht gespeichert werden.

Genau ein naechster Auftrag: zentrale Rastersteuerung mit einstellbarer positiver Schrittweite und unabhaengig schaltbarem Rasterfang sitzungsbezogen ergaenzen; fuer Zeichnen, Eckbewegung und Seitenstrecken gemeinsam pruefen.

### Seitenpfeile und geometrische Begrenzung beim Strecken — 05.10.2026

Nutzerkorrektur auf PR #102: blaue Doppelpfeile nach innen versetzt statt weisser Rechteckgriffe; Senkrechtrichtung zur Seite und Umlaufrichtung beruecksichtigt. Neuer Zweig fix/contour-stretch-cap auf #102, kein Merge der offenen PRs ohne Freigabe.

Seitenbewegung wird an der ersten ungueltigen Stelle begrenzt. Gemeinsame geometrische Ereignissuche entlang der Bewegung (Segmentkontakte, Kollinearitaet, Kollaps), danach Intervallverfeinerung auf die numerisch gueltige Seite. Keine Reparatur/Loeschung von Eckpunkten und kein Sprung durch eine ungueltige Zwischenkontur. Spitze Dreiecke und Rechtecke behalten die letzte gueltige Vorschau. Zurueckziehen bleibt moeglich. Bei kollinearen Nachbarkanten ohne eindeutigen Schnitt bleibt die Ausgangskontur. Ungueltige Ausgangsgeometrie und nicht endliche Eingaben bleiben Fehler.

Mausfang, numerische Vorschau und Commit verwenden boundedEdgeTarget. Begrenzte Ziele verlieren unzutreffende Fangbezeichnungen. Die numerische Hilfseingabe zeigt Geometrische Grenze und den tatsaechlichen Versatz. Groesse des Bewegungsmarkers von 0.055 m auf 5 Bildschirmpixel korrigiert; Seitengriffe erhalten eigenen dezenten Tastaturfokus. Der vom Nutzer beobachtete grosse weiss-schwarze Kreis wurde NICHT reproduziert; diese Marker-Korrektur ist keine gesicherte Ursachenbehauptung.

398 Tests bestanden, TypeScript/Build erfolgreich, Lint 0 Fehler/6 bekannte Warnungen. Neue Tests fuer Spitze, sehr schmales Dreieck, Rechteck, beide Umlaufrichtungen, Grenzgueltigkeit/Idempotenz, Rueckzug, nicht endliche Eingabe und numerische Vorschau/Commit/Undo/JSON. Ein bisheriger Ablehnungstest wurde auf die neue explizite Cap-Regel angepasst; strenge Geometriepruefung bleibt separat bestehen. Browser: blaue Innenpfeile sichtbar; 100-m-Eingabe an Nutzer-Testkontur auf ca. 0.3437 m begrenzt, gueltige Vorschau blieb sichtbar, danach abgebrochen um das Modell zu erhalten. Screenshot outputs/stretch-cap-preview.png. Keine Leistungsgarantie fuer sehr grosse Konturen; Ereignissuche und wiederholte Polygonvalidierung sind noch nicht auf grosse Ringe benchmarked.

Abnahme: Seite einer spitz zulaufenden Schraffur oder geschlossenen Polylinie strecken, ueber den Kollapspunkt hinaus und wieder zurueck bewegen. Vorschau darf nicht verschwinden; numerische Ueberschreitung zeigt die Grenze, Bestaetigung bleibt gueltig und per Undo reversibel. Zoom pruefen: der blaue Zielmarker bleibt gleich gross.

Genau ein naechster Auftrag: den weiterhin unbestaetigten weiss-schwarzen Kreis anhand des konkreten ausloesenden Bedienablaufs reproduzieren und die Ursache beheben; danach zur vorgemerkten zentralen Rastersteuerung zurueckkehren.

### Direkte Konturkanten-Auswahl — 05.10.2026

Nutzer priorisiert Seitenstrecken direkt durch Klick auf eine Aussenlinie. Gemeinsames screen-space Picking fuer Schraffuren und geschlossene Polylinien: naechste Konturkante innerhalb 6 CSS-Pixeln, inklusive Schlusskante; Ursprung ist die Projektion des Klicks auf genau diese Seite. Bestehendes On-Demand-Menue, EditSession und validierte Seitenstreck-/Knicken-Aktionen werden weiterverwendet. Schraffuren erhalten einen unsichtbaren 12-Pixel-Klickrand, sichtbare Auswahlkontur bleibt 2 Pixel. Flaechenklick bleibt Elementauswahl, Eckgriffe behalten Vorrang. Keine eigene Fang- oder Modelllogik.

399 Tests bestanden, TypeScript und Build erfolgreich; Lint 0 Fehler/6 bekannte Warnungen. Neuer Test prueft Projektion, Schlusskante, Toleranz bei drei Zoomstufen und Nichttreffer im Inneren. Browser: abseits der Seitengriffe Schraffur-Aussenkante (auch knapp ausserhalb) und Polylinienkante angeklickt, korrekte Seitennummer und Seitenstrecken aktiviert; Vorschauen abgebrochen, Nutzergeometrie unveraendert. Flaechenklick zeigt weiterhin Ganzelement-Menue. Screenshot outputs/direct-edge-picking.png.

Abnahme: Aussenkante einer Schraffur oder geschlossenen Polylinie direkt anklicken, Seite strecken waehlen, senkrecht ziehen oder Mass eingeben. Die blauen Doppelpfeile bleiben alternative Griffe. Offene Polylinien erhalten keine geschlossene Konturbearbeitung.

Genau ein naechster Auftrag: den weiterhin nicht reproduzierten weiss-schwarzen Kreis mit dem ausloesenden Bedienablauf eingrenzen und beheben; anschliessend zentrale Rastersteuerung fortsetzen.

### Gemeinsame Rastersteuerung — 05.10.2026

PRs #101–#104 sind mit normalen Merge-Commits in fix/reference-selection-lifecycle integriert (302b74d). Der gemeldete weiss-schwarze Kreis tritt laut Nutzer nicht mehr auf; keine weitere spekulative Korrektur. Neuer Zweig feat/shared-grid-controls.

Die Statusleiste bietet Rasterfang an/aus und eine positive Schrittweite in Metern, inklusive Dezimalkomma. SNAP bleibt der gemeinsame Hauptschalter; Rasterfang aus erhaelt geometrischen Punktfang und Hilfsreferenzen. Die sichtbare Rasterdarstellung bleibt unabhaengig und zoomadaptiv. Ein gemeinsames Application-Einstellungsobjekt speist den bestehenden Resolver fuer alle 2D-Zeichen-/Bearbeitungsaktionen und bestehende 3D-Wandbewegungen auf der horizontalen Arbeitsebene. Keine individuelle Werkzeug-Rundung. Explizite Shift-/Achsenregeln und exakte Massvorgaben behalten ihre bisherigen Prioritaeten; Raster bleibt nachrangiger Fallback. Passives 3D-Hovern erhaelt keinen Rastermarker.

Einstellungen sind sitzungsbezogen, keine Modell-/Dateiformat- oder Undo-Aenderung. Ungueltige Eingaben behalten die letzte gueltige Schrittweite. 401 Tests bestanden, TypeScript/Build erfolgreich, Lint 0 Fehler/6 bekannte Warnungen. Neue Tests: Dezimalkomma, positive Werte, ungueltige Eingaben, gemeinsamer Zeichen-/Bewegungsresolver mit zwei Schrittweiten, Raster aus bei weiterhin aktivem Endpunktfang, Hauptschalter aus. Browser: 0 abgewiesen, 0,25 uebernommen, Rastermarker beim Linienwerkzeug auf 25-cm-Koordinate, nach Ausschalten verschwunden. Screenshot outputs/grid-controls.png. 3D-Anbindung typgeprueft, in diesem Auftrag nicht manuell im Browser abgenommen.

Abnahme: unten 0,25 m einstellen, Linie beginnen und Ziel bewegen. Rasterfang aus: freie Zielposition, vorhandene Endpunkte bleiben fangbar. Eine Schraffurecke bewegen und dasselbe Verhalten pruefen. SNAP aus deaktiviert den Fang insgesamt; sichtbares Raster separat ueber Grid schalten. Schrittweite gilt bis zum Neuladen.

Genau ein naechster Auftrag: gemeinsame Rastersteuerung im kompletten Schraffur-/Polygon-Seitenstreckablauf und bei 3D-Wandbewegung praktisch abnehmen, inklusive Zoom, Abbruch und Undo; daraus belegte Fehler vor Beginn der Wandanschluesse korrigieren.

### Rastersteuerung: praktische Abnahme — 05.10.2026

PR #105 nach Freigabe unveraendert normal in fix/reference-selection-lifecycle gemergt (bf44929). Abnahme in separatem Browser-Tab mit definiertem Testmodell; Nutzer-Tab und Modell nicht ersetzt. Keine Aenderung der Produktlogik erforderlich.

Browser mit 0.25 m: Schraffurseite von x=-1 auf x=3.5 gestreckt, Vorschau und Commit gleich, Undo exakt zur Ausgangskontur, Redo exakt zur Zielkontur. Zoom waehrend Vorschau geprueft. Geschlossene Polylinie ebenfalls auf x=3.5 in Vorschau gestreckt; Abbrechen erhaelt x=4. 3D: sichtbaren Wandfusspunkt gewaehlt, frei bewegt, Zoomvorschau und Uebernehmen geprueft. Im Grundriss ergibt sich Wandversatz (5.75,-2.68); gewaehlt war eine um 0.18 m gegen die Wandachse versetzte Ecke, deren Rasterziel (5.75,-2.5) ist. Undo/Redo reproduzieren Ausgangs-/Zielzustand exakt. Separater 3D-Abbruch laesst Wand bei (0,0). Screenshot outputs/grid-3d-acceptance.png. Raster ist weiterhin Fallback: eine aktive Hilfslinie kann ungerasterte Laengen liefern; explizite Shift-/Achsenregeln bleiben vorrangig.

Automatischer Regressionstest fuer beide Konturarten und die Wand mit versetztem Ursprung, drei Bildschirmmassstaeben/affiner Metrik, Zielkoordinaten, unveraenderter Basis bei Vorschau/Abbruch, einem History-Schritt, Undo/Redo und JSON-Roundtrip. 402 Tests bestanden, TypeScript und Build erfolgreich; Lint 0 Fehler/6 bekannte Warnungen. Keine Behauptung einer vollstaendigen Abnahme beliebiger 3D-Arbeitsebenen oder anderer 3D-Bauteile.

Abnahme fuer Nutzer: 0.25 m einstellen, Schraffurseite strecken, Vorschau bestaetigen, Undo/Redo. In 3D sichtbare Wandecke am Boden klicken, Element frei bewegen, Ziel ansteuern und Uebernehmen. Raster bezieht sich auf den ausgewaehlten Eckpunkt. Bei aktiver Hilfslinie deren Prioritaet beachten.

Genau ein naechster Auftrag: den ersten Eckanschluss zweier gerader Waende anhand vorhandener Modell-/Geometrie-/IFC-Pfade planen und eine begrenzte gemeinsame Anschlussregel samt Tests festlegen; offene Regeln fuer Achswechsel und unterschiedliche Staerken explizit lassen, bevor Anschlussgeometrie implementiert wird.

### Wand-Eckanschluss: Bestandsaufnahme und Arbeitsentwurf — 05.10.2026

PR #106 nach Freigabe normal gemergt (e65105a). Reiner Planungsauftrag auf docs/wall-corner-plan, keine Produktlogik geaendert. docs/WALL_CORNER_PLAN.md ordnet Schema/Modellaktionen, Grundriss, 3D-Zellen, IFC-Rechteckprofile, Fangquellen und History zu. Heutige Waende haben keine Anschlussrelation; getrennte Ableitungen duerfen keine widerspruechlichen Anschlusskoerper erhalten.

Vorschlag fuer spaeter: rechtwinklige Zwei-Wand-Ecke mit gleicher Staerke/Hoehe und ohne Oeffnung in der Endzone, gemeinsame Gehrungsgrenze, stabile Wand-IDs. Vorschlag ausdruecklich getrennt von verbindlichen Architekturregeln. Achswechsel, Anschlussabsicht/Persistenz, Mitbewegen von Nachbarn, ungleiche Staerken, Griffversatz bei Drehung und Oeffnungs-Endzone bleiben offen. Keine Nutzerentscheidung erfunden. Akzeptanzfaelle fuer 2D/3D/IFC, Reihenfolge/Richtung, History/Datei und Sichtbarkeit dokumentiert.

Pruefung: referenzierte Quelldateien und lokale Markdown-Links vorhanden, git diff --check sauber. Keine neuen Laufzeittests oder Buildwiederholung fuer reine Dokumentation; unveraenderte Codebasis zuletzt 402 bestandene Tests und erfolgreicher Build. Keine Anschlussfunktion als implementiert bezeichnet.

Genau ein naechster Auftrag: die bestehende zentrierte Achse der ausgewaehlten Wand im 2D-Grundriss als dezente pointer-transparente gestrichelte Linie darstellen, mit Vorschau-, Zoom- und Sichtbarkeitspruefung. Keine Achsverschiebung oder Anschluesse. Dies setzt die explizite N45-Voraussetzung vor Wandanschluessen um; Details und Abnahme in docs/WALL_CORNER_PLAN.md.

### Sichtbare Wandachse im Grundriss — 05.10.2026

PR #107 nach Freigabe normal in den Integrationszweig gemergt (ea8db92). BimPlan zeigt fuer die ausgewaehlte sichtbare Wand eine blaue gestrichelte Mittellinie direkt aus start/end der angezeigten, gegebenenfalls gueltigen Vorschaugeometrie. Strichstaerke 1.25 CSS-Pixel mit non-scaling-stroke, pointer-events none; bestehende Eckgriffe bleiben bedienbar. Keine Modellkopie, neue Fangquelle, Aktion, Schema- oder IFC-Aenderung. 3D-Achse und Achsversatz bleiben offen.

402 bestehende Tests bestanden, TypeScript/Build erfolgreich, Lint 0 Fehler/6 bekannte Warnungen. Keine spiegelnde neue Logikpruefung fuer rein abgeleitete SVG-Linie. Browser: horizontale Achse (0,0)–(3,0), konstante Strichstaerke nach Zoom, keine Achse bei Fensterauswahl, schräge Vorschau/Commit mit identischen Endkoordinaten und Wandrotation, Abbruch wieder horizontal. Undo hebt bestehend die Auswahl auf; nach erneuter Wandwahl ist die urspruengliche Achse sichtbar. Ausgeblendete Wand hat keine Achslinie, nach Sichtbarkeits-Undo und Auswahl ist sie wieder sichtbar. Screenshot outputs/selected-wall-axis.png. Diese Pruefung bestaetigt keine neue Griff-/Drehregel; das dokumentierte bestehende Griffverhalten bleibt bestehen.

Abnahme: Wand im Grundriss anklicken, mittige gestrichelte Achse sehen, zoomen, Wandecke bewegen und abbrechen. Fenster waehlen oder Wandebene ausblenden: Achse verschwindet. Modell und Export enthalten weiterhin nur dieselbe Wand.

Genau ein naechster Auftrag: die offene N45-Bedienentscheidung fuer Achsversatz mit dem Nutzer klaeren und als verbindliche Regel dokumentieren (Wandkoerper bleibt stehen oder bewegt sich relativ zur Zeichenachse); darauf basierend einen begrenzten gemeinsamen Application-Auftrag definieren. Bis zur Entscheidung keinen Achsversatz oder automatischen Anschluss implementieren.


## Korrektur nach Nutzerabnahme — 06.10.2026

Innenoffset wird jetzt auf mindestens 1 % Restlaenge jeder urspruenglichen Seite
begrenzt. Die zuerst kollabierende Seite bestimmt den Abstand; numerische
Gueltigkeitsgrenzen koennen frueher stoppen. Die Grenze wird einmal vorbereitet,
Mausziel, Zahleneingabe und Bestaetigung verwenden denselben Cap. Vorschau bleibt
stehen und zeigt den tatsaechlichen Abstand statt eines ungueltigen Ziels.
Ungeeignete Ausgangskonturen und nicht-endliche Eingaben bleiben Fehler.
Freies Bewegen bestaetigt jetzt per Klick fuer alle gemeinsamen Edit-Adapter.
Tab bedient weiterhin Laenge/Winkel; Klick fixiert nicht mehr nur die Richtung.
471 Tests bestanden; Browser: 10-cm-Kontur auf 1 mm Restlaenge begrenzt,
kein Fehler; freie Schraffurbewegung durch einen Mausklick abgeschlossen.

Nachweis zum Branch-Uebergang: Frozen-Lockfile-Installation erfolgreich; 517 Tests, TypeScript und Produktionsbuild mit Lovable-Konfiguration 2.25.2 bestanden.
