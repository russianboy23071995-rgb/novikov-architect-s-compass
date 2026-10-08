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

