# V07a Schraffurverwaltung und Linien-Creator

Stand 08.10.2026. Abgleich und begrenzter Folgeauftrag; noch keine neue Bedienfunktion.
Nutzer bestaetigt die praktische V06-2D-Abnahme. PR213 ist zusammengefuehrt.

## Bestaetigte Anforderungen

Tools > Schraffurenverwaltung. Vorhandene Muster als Liste mit kleiner Vorschau.
Von dort zum Schraffurcreator: Muster selbst mit Linien zeichnen, anlegen und
als Raster wiederholen. Musterdateien hochladen. Uploadformat noch offen:
Nutzer recherchiert; PAT/SVG/PNG/JPEG sind keine getroffene Formatentscheidung.
Aeltere Wuensche nach Mauerwerk, Farbe/Deckkraft, Hintergrund, Kontur, vier
Erstellungsarten und eigener Ebenenzuordnung bleiben gueltig.

## Bestand und Architektur

Hatch ist heute eine geschlossene 2D-Kontur mit Fill, Hintergrund, Kontur und Ebene.
Es gibt noch keine Musterdefinitionen oder Referenzen darauf. Tools ist im Toolbar
noch kein Verwaltungsmenue. Bestehende Zeichen-/Fangdienste und validierte Aktionen
werden wiederverwendet. Die 2D-Uebernahme bleibt der gemeinsame Vorgabenadapter.

Verbindlich: Musterdefinition und Musteranwendung sind unterschiedliche Daten.
Eine Definition enthaelt stabile ID, Namen und Liniengeometrie in einer lokalen
Wiederholungszelle. Eine Anwendung bleibt die vorhandene Schraffurkontur; sie
referenziert ein Muster. Renderer erzeugt die geklippten Wiederholungen daraus,
keine tausend kopierten Modelllinien. Musterduplikate erhalten neue IDs. Creator-
Vorschau und Entwurf sind transient; Speichern/Anwenden gehen durch Application.
Keine Musterberechnung oder Modellmutation ausschliesslich in React.
Import spaeter ueber Interop-Adapter in denselben validierten Definitionsvertrag.
AI/Text/Voice spaeter ueber dieselben Aktionen mit stabilem Zielkontext.

Vorschlag fuer den ersten Creator: rechteckige positive Wiederholungszelle,
Liniensegmente in lokalen Metern, Vorschau eines begrenzten 3x3-Rasters.
Interne Meter sind gesetzt; sichtbare Musterabstaende in Modell- oder Papiermass
und spaetere Skalierung benoetigen eine ausdrueckliche Festlegung. Noch keine
Entscheidung ueber globale Bibliothek versus projektgebundene Bibliothek,
assoziatives Aendern aller Anwendungen, Importformate oder endlose Linienfamilien.
Vorerst kein neues Projektdateiformat ohne geprueften Migrationsauftrag.

## Genau ein naechster Auftrag: V07b Linien-Creator als Entwurf

Unter Tools > Schraffurenverwaltung einen funktionierenden Einstieg zum Creator
bauen. Einen rechteckigen lokalen Linienmuster-Entwurf zeichnen und unmittelbar
mit einer 3x3-Wiederholung pruefen. Gemeinsame Punkt-/Fanggeometrie verwenden;
separater Entwurfskontext ohne BIM-Auswahl oder BIM-Modellkopie. Zellenmasse und
Linien validieren (endlich, positive Zelle, keine Nullsegmente, begrenzte Menge).
Werkzeugeigenschaften im vorhandenen UI-Konzept behalten. Keine inaktive Upload-
Schaltflaeche als vorgetaeuschte Funktion. Import bleibt bis Formatentscheidung offen.

Dieser erste Auftrag demonstriert den Creator; permanente Bibliothek, Bearbeiten
bestehender Definitionen und Fuellen einer Projektkontur folgen im naechsten
abgegrenzten Auftrag nach Bibliotheks-/Einheitenentscheidung. Keine Zusage einer
vollstaendigen Bibliothek oder Dateimigration durch diesen Entwurf.
Abnahme: zwei Linien zeichnen, Zelle aendern, Wiederholung ansehen, letzte Linie
im Entwurf rueckgaengig, abbrechen: BIM-Modell und dessen Undo bleiben unveraendert.
Geometrie-/Grenztests, Typecheck/Build und praktische Browser-Abnahme.

## Pruefung dieses Abgleichs

Guide Etappe 5, V07 und Quelltext abgeglichen. Reine Dokumentationsaenderung;
Diff-Pruefung, keine erneut ausgefuehrten Produktions-Tests oder Builds.

## V07b Umsetzung

Lokaler Creator unter Tools, Linienentwurf, Zellmaße, eigene Undo-Liste,
gemeinsame querySnap-Abfrage und 3x3-SVG-Musterwiederholung implementiert.
Keine Bibliothekspersistenz, kein Upload und keine Anwendung auf Projektkonturen.
722 Tests, Typecheck, gezielter Lint und Build erfolgreich. Browser-Abnahme
wegen Browser-Sandbox-Startfehler offen. Nächster Auftrag: V07c Vertrag zur
Bibliothekspersistenz und Musteranwendung mit den offenen Nutzerentscheidungen.

## V07c Bibliothek: Nutzerentscheidung vom 08.10.2026

Verbindlich: Die Musterbibliothek soll von Anfang an global und projektübergreifend
sein. Die frühere Frage projektgebunden versus global ist damit beantwortet.
Verbindlich: Modellmaß und Papiermaß sind in den Werkzeugeigenschaften bei
Schraffuren wählbar. Der Maßbezug gehört zur Anwendung, nicht zur Musterdefinition.
Verbindlich: Bearbeiten eines verwendeten Musters aktualisiert gemeinsam alle
Anwendungen dieses Musters. Uploadformat bleibt offen.

Technischer Vorschlag (noch keine Nutzerentscheidung): globale Bibliothek über
plattformneutralen Storage-Adapter; Projektdateien führen die tatsächlich
verwendeten Definitionen mit, sodass die Darstellung ohne globale Installation
reproduzierbar bleibt. IDs allein dürfen keine stille Musterersetzung bewirken.
Anwendungsdaten bleiben im Projekt; Wiederholung/Clipping sind abgeleitet.
Kein Speichersystem oder Projektformatwechsel vor dem begrenzten Migrationsauftrag.

V07c abgeschlossen als Vertrag; praktische Creator-Abnahme bleibt offen.

Technischer Vorschlag zur Synchronisation: stabile globale Muster-ID mit Revision;
Anwendungen referenzieren diese ID. Geöffnete Projekte übernehmen Änderungen über
eine gemeinsame validierte Aktion; geschlossene Dateien werden nicht heimlich
umgeschrieben. Synchronisation beim Öffnen, Offline-Konflikte und Bedeutung von
Undo für projektübergreifende Musteränderungen müssen vor diesem Ausbau geklärt
werden. Eingebettete Definitionen sichern reproduzierbare Offline-Darstellung.
Papiermaß benötigt einen expliziten Maßstab der Ansicht; Zoom allein ist kein
Planmaßstab. Das ist noch keine implementierte Synchronisationsfunktion.

Genau ein nächster Auftrag V07d: eine globale lokale Musterbibliothek mit
Storage-Adapter, validierten Definitionen/IDs/Namen, Liste mit Vorschauen und
Speichern eines Creator-Entwurfs implementieren. Laden nach Neustart prüfen;
keine Anwendung, Projektmigration, Synchronisation oder Upload in diesem Schritt.
Anwendungs-/Maßstabs- und Aktualisierungsregeln folgen als eigener Auftrag.


## V07d Umsetzung - 09.10.2026

Globale lokale Bibliothek mit Storage-Adapter und Domain-Validierung umgesetzt.
Speichern mit stabiler neuer ID, Namen, Zellmaßen und lokalen Linien; Liste mit
Vorschauen und als neuen Entwurf laden. Neustart-Wiederladen durch frischen
Storage-Consumer getestet. Bibliothek gilt für Browserprofil/Origin über Projekte;
noch keine Geräte-Synchronisation oder Musteranwendung. Alte Daten werden bei
Lesefehlern nicht überschrieben; Schreibfehler lassen die Liste unverändert.
741 Tests, Typecheck, Lint/Build erfolgreich. Browser-Abnahme offen.
Nächster Auftrag V07e: Musteranwendungs-/Aktualisierungsvertrag am vorhandenen
Projektformat konkretisieren; offene Konflikt- und globale Undo-Regeln klären.

## V07e Musteranwendungs- und Aktualisierungsvertrag - 09.10.2026

### Geprüfter Bestand

PR221 (38b571e) mit erfolgreicher GitHub-CI nach Nutzerfreigabe zusammengeführt.
Produktionsschema 10 enthält noch keine Musterzuweisung an Hatch. Hatch besitzt
Kontur, Fill, Hintergrund, Konturfarbe und Ebene (domain/elements/hatch/model.ts).
previewHatch/commitHatch validieren am aktuellen Projektsnapshot und bieten einen
Commit/Undo-Schritt (application/hatches/actions.ts). PlanSceneRun zeichnet heute
die Fläche; project-file/load.ts migriert die älteren Formate. Die Musterbibliothek
v1 speichert Definitionen mit ID, Namen und Zellgeometrie, noch ohne Revisionen
oder globale Bearbeitung. Es existiert kein implementierter ModelView-/DrawingDocument-
Maßstabsvertrag; Bildschirmzoom ist Kamerazustand, kein Ausgabe-Maßstab.
Projekt-History speichert Projektsnapshots und hält bereits Ebenensichtbarkeit
außerhalb des Modell-Undo. Dieses Prinzip ist kein Beweis einer Muster-History.

### Verbindliche Nutzerentscheidungen

- Bibliothek global und projektübergreifend; aktuell lokal pro Profil/Origin.
- Modellmaß und Papiermaß sind bei Schraffuren wählbar, nicht bei allen Werkzeugen.
- Bearbeiten einer Definition aktualisiert alle Anwendungen dieser Definition.
- Antwort vom 09.10.2026: beim Öffnen älterer Projekte aktuelle verfügbare Muster
  automatisch übernehmen; keine Bestätigungsfrage für reguläre neue Revisionen.
- Antwort vom 09.10.2026: Bibliothek besitzt eigene Undo/Redo-History. Projekt-Undo
  nimmt Zuweisung und Modellaktionen zurück, verändert niemals die globale Bibliothek.
- Uploadformat bleibt offen. Linienarten und Schraffurmuster bleiben getrennte Systeme.

### Technische Entscheidungen für den schrittweisen Ausbau

**Definitionen und Referenzen:** Das nächste Projektformat erhält eine projektweite
Tabelle tatsächlich verwendeter Musterdefinitionen, referenziert über stabile ID.
Eine Schraffur enthält die Musterreferenz und Anwendungsparameter, keine weitere
Bauteilkopie und keine einzeln gespeicherten Wiederholungslinien. Die Tabelle
ermöglicht portable Darstellung ohne installierte Bibliothek und ein gemeinsames
Aktualisieren aller Referenzen. Bestehende Schema-10-Projekte behalten Vollflächen;
Migration ergänzt eine leere Tabelle, niemals automatisch ein Muster.

**Anwendung:** Maßbezug gehört zur Schraffur. Im Modellmaß bleiben Zellabstände in
Metern. Der Pattern-Anker ist ein expliziter Punkt in derselben 2D-Ebene wie die
Kontur; Translation bewegt ihn mit, Konturbearbeitung erzeugt ihn nicht laufend
neu. Initialer Anker kann der untere linke Kontur-Bounding-Box-Punkt sein. Diese
Vorgabe ist eine technische Initialisierung, keine neue Nutzer-Geste. Übernahme
per Doppel-Rechtsklick kopiert Muster-/Darstellungsvorgaben, keine ID, Kontur oder
positionsabhängigen Anker. Bestehende Fill-Farbe/Deckkraft steuern zunächst die
Musterstriche; Hintergrund und Kontur bleiben unabhängige bestehende Eigenschaften.

**Papiermaß:** Eine explizite positive Ausgabe-Skalenzahl S für 1:S muss vom
ModelView/DrawingDocument bzw. Layout-Kontext kommen; nicht von pixelsPerMetre
oder einem Zoomprozent. Papierlängen werden im Adapter in Meter umgerechnet:
Beispiel 2 mm bei 1:50 entsprechen 0,1 m Modellabstand. Die Definition bleibt in
lokalen Metern; Anwendungsparameter bestimmen die Papier-Zellgröße. Ohne gültigen
Maßstab ist eine Papiermaß-Aktion nicht zulässig. Der erste Pilot bietet nur
Modellmaß; Papiermaß bleibt als geforderte Fähigkeit offen und bekommt keinen
funktionslosen Auswahlpunkt. Kein Layouteditor oder Ersatz-Ansichtsmodell hierfür.

**Revisionen und Auflösung:** Vor der Bearbeitung verwendeter Definitionen wird
die globale Bibliothek versioniert um monotone Revisionen ergänzt (v1 -> Revision 1).
Die eingebettete Tabelle nennt die verwendete Revision. Regulär neuere verfügbare
Revisionen werden beim Öffnen automatisch validiert übernommen; alle Referenzen
im geöffneten Projekt verwenden dann denselben Stand. Kein implizites Schreiben
in geschlossene Projektdateien. Das Projekt wird als geändert markiert und erst
beim normalen Speichern dauerhaft aktualisiert. Fehlende Bibliothek oder dort
ältere Revision: eingebettete Definition beibehalten, kein Downgrade. Gleiche
ID/Revision mit anderem Inhalt ist ein Integritätskonflikt: keine stille Ersetzung,
Diagnose und vorhandene portable Darstellung erhalten. Fehler bei Validierung oder
Dateigrenzen dürfen keine teilweise aktualisierte Projekttabelle veröffentlichen.

**Getrennte Histories:** Globale Änderungen bekommen eine eigene Bibliotheks-History.
Bibliotheks-Undo veröffentlicht den früheren Inhalt als neue monotone Revision,
nicht als Zurücksetzen der Revisionsnummer. Geöffnete Projekte gleichen diese
Revision über dieselbe Application-Aktion ab. Projekt-Undo/Redo verändert die
Zuweisung und Kontur, aber darf eine bereits global aktualisierte Definition nicht
über alte Projektsnapshots zurückdrehen. Beim Wiederherstellen eines Snapshots
muss dieselbe zentrale Auflösung die verfügbaren Definitionen berücksichtigen.
Gleichzeitig laufende Vorschauen werden bei geänderter Basis verworfen. Keine
Zusicherung einer atomaren Transaktion über Browser-Tabs oder geschlossene Dateien;
Updates benötigen stabile Revisionen, erneute Validierung und sichtbare Fehler.
Diese globale Bearbeitung/History ist noch nicht implementiert.

**Abhängigkeiten:** Domain prüft Definition, Referenzintegrität und Anwendungswerte;
Application führt Zuweisen/Entfernen und später Revision-Abgleich aus. Interop
migriert Dateien und stellt Storage bereit. Rendering nutzt begrenzte SVG-Kacheln
und Kontur-Clipping; keine Allocation je sichtbarer Wiederholung. UI-Felder bleiben
in Werkzeugeigenschaften. Maus, Eigenschaften, Vorgabenübernahme und spätere
Text/AI/Voice-Adapter verwenden denselben typisierten Aktionsvertrag mit Projekt-ID,
Hatch-ID und gebundenem aktuellen Snapshot. Geometrie/Fanglogik bleibt gemeinsam.

### Genau ein ausführbarer Folgeauftrag V07f

**Portabler Modellmaß-Pilot für vorhandene Schraffurkonturen.** Projektformat
inkrementell erweitern; tatsächliche verwendete Definitionen einmal pro Projekt
speichern, referenzierte IDs und Maßwerte validieren. Zuweisen/Entfernen über die
vorhandene snapshotgebundene Hatch-Application-Aktion in den Eigenschaften sowie
Vorgaben für neue Schraffuren und Doppel-Rechtsklick ergänzen. Pattern im Modellmaß
geklippt rendern, Fill/Hintergrund/Kontur erhalten; Translation/Undo/Dateirundlauf
mit gemeinsamem Anker prüfen. Katalogeinträge nur auswählen, nicht bearbeiten.

Abnahme: zwei Schraffuren mit gleicher Muster-ID, davon eine konkav, zuweisen;
zoomen, bewegen, Kontur ändern, rückgängig/wiederholen, speichern/öffnen. Frischer
Storage ohne Bibliothek muss die eingebettete Darstellung reproduzieren. Kein
Datenverlust bei älteren Projekten, ungültiger ID, beschädigter Definition oder
Speichergrenze. Dichte Wiederholung darf Modell-/DOM-Größe nicht vervielfachen.
Tests für Migration, Referenzen, Snapshots, Aktionsschutz, Undo und Renderableitung;
Typecheck, Lint, Build sowie praktische Sichtprüfung. Papiermaß, globale Bearbeitung,
Revision-Abgleich, globale History, Upload und Layout bleiben separate Folgeaufträge.

Dieser V07e-Auftrag ändert ausschließlich Dokumentation. Keine neuen Test-/Build-
Ergebnisse behauptet; die 741 Tests und CI gehören zum überprüften PR221-Commit.

## V07f Umsetzung - 09.10.2026

Modellmaß-Zuweisung in Werkzeugeigenschaften/Inspector, gemeinsame Erstellung und
Doppel-Rechtsklick-Vorgaben, begrenzte SVG-Darstellung inklusive Vorschau umgesetzt.
Schema 11: eine Definitionstabelle pro Projekt, stabile Referenzen/Ursprung je Kontur;
strikte Migration 1–10. Bewegung nimmt Ursprung mit, Konturbearbeitung behält ihn.
746 Tests, Typecheck, Lint/Build erfolgreich; Browser-Sichtprüfung wegen Sandboxfehler
offen. Globale Bibliotheksbearbeitung/-History, Revision-Synchronisation und Papiermaß
bleiben offen. Nächster Auftrag V07g: Revisions-/Bibliotheks-History-Kern und zentrale
Auflösung als getestete Domain-/Application-Aktionen, vor UI-/Tab-Synchronisation.

## V07g Umsetzung - 09.10.2026

Bibliothek v2 mit monotonem Revisionszähler, verlustfreies Lesen von v1 und getrennte
sitzungsbezogene Bibliotheks-History umgesetzt. Bearbeiten prüft ID, Zielrevision und
Speichertoken; Undo/Redo veröffentlicht neuen Revisionsstand. 20 Schritte und vier
Millionen serialisierte Zeichen begrenzen die History. Zentrale Projektauflösung
übernimmt neuere Definitionen gemeinsam, erhält fehlende/ältere und meldet gleiche
Revision mit abweichendem Inhalt. Speicherfehler und veraltete Aktionen schreiben
keinen neuen Aktionszustand. Keine atomare Mehrtab-Sicherheit zugesichert.

753 Tests, Typecheck, Build erfolgreich; Lint ohne Fehler mit sechs bekannten
Warnungen. Projektformat 11 besitzt noch keine persistierten Revisionen: Auflösung
verwendet expliziten Kontext und ist noch nicht automatisch beim Laden/Undo aktiv.
Nächster begrenzter Auftrag V07h: portabler Revisionskontext mit strikter Migration
und gemeinsamer Auflösung beim Öffnen/Wiederherstellen. Globale Bearbeitungs-UI,
Papiermaß, Upload und Tab-Synchronisation bleiben nachgelagert.

## V07h Umsetzung - 09.10.2026

Projektformat 12 hält bekannte Revisionen direkt in der einmaligen Mustertabelle.
Altdateien 1–11 behalten unbekannte Herkunft, ohne erfundene Revisionsnummer.
Projektöffnung/-übernahme und Undo/Redo verwenden den zentralen Resolver. Der Browser-
Adapter liest Storage vor Dispatch; Domain/Reducer bleiben frei von Speicherzugriffen.
Keine Bibliotheksschreibvorgänge und keine zusätzlichen Modell-Undo-Schritte. Fehlende
Bibliothek erhält portable Inhalte; gleichversionige Konflikte werden gemeldet.
Wiederherstellen desselben Projekts erhält dessen neueren bekannten Musterstand auch
bei inzwischen fehlender Bibliothek. 758 Tests sowie Typecheck und Build bestanden.

Abnahme: Musterschraffur speichern/öffnen; Erscheinungsbild ändern, Undo/Redo und
erneuter Dateirundlauf. Neue globale Versionen sind noch nicht über die UI bearbeitbar.
Genau ein Folgeauftrag V07i: Bearbeiten und eigene Bibliotheks-History im vorhandenen
FloatingPanel anbinden, aktives Projekt ohne Modell-History-Schritt zentral auflösen.
Papiermaß, Upload und vollständige Mehrtab-Synchronisation bleiben getrennte Schritte.

## V07i Umsetzung - 09.10.2026

Muster bearbeiten mit stabiler ID und gebundener Ausgangsrevision, eigene Bibliotheks-
Undo/Redo-Pfeile und reversible Neuanlage im vorhandenen FloatingPanel umgesetzt.
Entwurfslinien sind einzeln entfernbar. Kopie/Neuer Entwurf erzeugen neue Identität;
Speichern eines gerade angelegten Musters bearbeitet danach dieses. Fenster schließen
behält History; Neu laden setzt sie zurück und erhält den unveröffentlichten Entwurf.
Externe Änderungen erzwingen Neu laden; ein veralteter Zielentwurf bleibt gesperrt
durch den Revisionsschutz, bis das aktuelle Muster bewusst wieder geöffnet wird.

Gemeinsame Storage-Ereignisse aktualisieren das aktive Projekt ohne Modell-History-
Schritt. Past/Future bleiben erhalten; tatsächliche Basisänderung beendet direkte
Vorschau. Werkzeugvorgaben folgen dem aufgelösten Projekt-/Bibliotheksstand. Fehlende
oder ältere Definitionen erhalten portable Inhalte; Konflikte werden angezeigt.
Geschlossene Dateien werden nicht geschrieben; Abgleich erfolgt beim Öffnen.
Atomare parallele Tab-Schreibvorgänge und Bibliothekslöschung bleiben ausstehend.

765 Tests, Typecheck, Build und Lint ohne Fehler (sechs bekannte Warnungen). Browser-
Abnahme wegen Sandbox-Kernelstartfehler offen. Abnahme: zwei Schraffuren zuweisen,
Muster bearbeiten, speichern, beide prüfen; Bibliotheks-Undo/Redo und Projekt-Undo
getrennt testen, Fenster schließen/öffnen, Kopie und Entwurfslinien entfernen.
Genau ein Folgeauftrag V07j: Papiermaß-/Ansichtsmaßstab-Vertrag anhand Code/Architektur
prüfen und einen begrenzten Umsetzungspiloten planen. Keine Zoom-basierte Ersatzregel.
Upload wartet weiterhin auf die Nutzerentscheidung zum konkreten Austauschformat.
