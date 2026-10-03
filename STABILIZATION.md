# Stabilitätsprüfung · 01.10.2026

## Verbindlicher Ausgangsstand

GitHub `feat/direct-edit-menu`, Commit `c6e16ac0c1042539631f333b63abf8e875bf3be2`, PR #13. Enthält alle bisherigen Entwicklungsfunktionen. Gegen `main` (8c6d020) 13 Commits voraus, keinen zurück. Modellkern, Wand/Fenster, 2D/3D, IFC, Text/Sprache, JSON, History, Linien, obere Eigenschaften und direkte Bearbeitung sind gemeinsam enthalten.

Lokaler Ausgang: gleichnamiger Branch mit HEAD ad4ff2d und späteren Änderungen im Arbeitsverzeichnis. Alle Dateien wurden mit den Git-Blob-Hashes des veröffentlichten Trees verglichen (Text mit LF normalisiert): einzige inhaltliche Abweichung vor den neuen Prüfdokumenten/-tests war die gezielte BimPlan-Korrektur. Die begonnenen Segmentgriffe sind außerhalb des Repositorys unter outputs/pending-segment-edit gesichert und aus dem Prüfstand entfernt. Kein Feature-PR dafür erstellt.

## Fehlerkorrektur

BimPlan: Die Absicherung gegen durchgereichte Menüklicks stand in PointerMove. Dadurch folgte die Vorschau nicht der freien Mausbewegung. Die Prüfung befindet sich jetzt ausschließlich vor der Klickübernahme. Browsernachweis: Maus ohne gedrückte Taste zeigt 7,00 m, gespeichertes Maß bleibt 6 m, Escape stellt 6,00 m wieder dar.

## Vollständiger Browserablauf

- Neue horizontale Wand (3,70 m) gezeichnet, Standardstärke 0,36 m und Höhe 2,80 m.
- Zentriertes Fenster 1,20 × 1,35 m, Brüstung 0,90 m eingesetzt.
- Wandlänge auf 6 m geändert; Undo zeigt 3,70 m, Redo 6 m.
- JSON tatsächlich heruntergeladen und gelesen: zwei Wände/zwei Fenster einschließlich Startbeispiel; IDs und Hostbindung erhalten, Fensterposition 0,5.
- Arbeitsmodell auf 4 m geändert, gespeicherte Datei geöffnet und Laden bestätigt: Navigator zeigt wieder 6 m.
- IFC tatsächlich heruntergeladen und gelesen: zwei IfcWall, zwei IfcWindow, zwei IfcOpeningElement; 6-m-Länge, Fensterbreite und relative Mitte erhalten.
- 3D-Ansicht zeigt wiederhergestelltes Modell. Kein erneuter Archicad-Import in dieser Prüfung.

Browser-Downloadereignis der Automatisierung lief in einen Timeout, obwohl die Datei erfolgreich im Downloadordner gespeichert wurde. Ergebnis deshalb anhand der tatsächlichen Datei geprüft. Eine anfängliche Browser-Fehlerseite wurde durch einen frischen Prüftab ersetzt.

## Verbleibende Grenzen

- F11: gemeldete Spracherkennungsfehler weiterhin offen; kein Mikrofontest in diesem Ablauf.
- F12: gemeinsame dezente 3D-Auswahlumrandung weiterhin offen.
- 2D-Zoom/Pan, intelligente Fangpunkte/Hilfslinien und Wandverbindungen noch ausstehend. Räume/Wohnflächen erst danach.
- Fenster sind Öffnungen ohne Rahmen/Glas; überlappende Fenster sind im bisherigen Modell möglich.
- Kein Autosave. Nicht übernommene Formulareingaben sind nicht Teil der Projektdatei.
- Lokale Git-Historie hinkt dem per Connector veröffentlichten Stand hinterher; verbindlich ist der GitHub-Commit des Prüf-PR. Keine Historie umgeschrieben.

Keine Zusammenführung nach main und keine stabile Release-Version während dieser Prüfung. Die ursprüngliche Vorgabe, Pull Requests nur zur Prüfung zu erstellen, bleibt gültig.

## Ergänzung zum neuen Etappenplan

Der durchgehende automatisierte Test enthält jetzt zusätzlich die tatsächlich von der Mausbedienung verwendete Aktion editAtPointer: 6-m-Wand von (2,3) nach (4,2) verschieben, gehostetes Fenster entlang der Wand um 0,60 m versetzen, beide Änderungen einzeln mit Undo/Redo prüfen, JSON wiederherstellen und IFC erzeugen. Prüft stabile IDs/Host, Fensterposition 0,6, 3D-Grenzen und Volumen sowie die IFC-Wandplatzierung (4,2,0). Der bisherige Browsernachweis bleibt auf den oben dokumentierten Ablauf beschränkt; die kombinierte Verschiebeabnahme ist noch offen. Daher Etappe 1 noch nicht pauschal als vollständig abgeschlossen markieren. Neue verbindliche Reihenfolge: DEVELOPMENT_PLAN.md.

## Abschluss Etappe 1 am 01.10.2026

Die zuvor offenen Abschlussbedingungen sind erledigt. Lokaler Branch test/stage-one-movement-workflow wurde nach Sicherung des alten Arbeitsverzeichnisses auf den veröffentlichten Commit 4294424b20841d1920ee7f24937b23746e2968ab synchronisiert. Die alten und neuen Dateien wurden vor dem Wechsel abgeglichen; der alte Stand bleibt als Git-Stash gesichert. Git-Fetch gelang mit dem OpenSSL-Backend bei unveränderter Zertifikatsprüfung. Keine veröffentlichte Historie geändert.

Praktische kombinierte Abnahme auf diesem Stand:

1. Neue Wand gezeichnet und zentriertes Fenster eingesetzt; Wand auf 6 m verlängert.
2. Ganze Wand über Eckgriff → Element frei bewegen versetzt: Start (0,8; -0,08), Ende (6,8; -0,08); Stärke 0,36 und Höhe 2,80 m erhalten. Fenster folgte seiner Wand.
3. Fenster über Fenster entlang Wand versetzt, relative Position 0,5824773835896755.
4. Undo stellte zunächst die Fenstermitte, danach den ursprünglichen Wandstart (-0,5; 1,1) wieder her. Zweimal Redo stellte beide Verschiebungen wieder her.
5. Projekt tatsächlich heruntergeladen, Fensterbewegung rückgängig gemacht, gespeicherte Datei geladen: ursprünglicher Versatz wieder sichtbar. JSON enthält dieselben IDs und Hostbeziehung.
6. IFC tatsächlich heruntergeladen: Wandplatzierung (0,8; -0,07999999999999985; 0), Länge 6 m und Fensterposition stimmen mit JSON und Grundriss überein. 3D zeigt denselben geänderten Modellstand. Die lange Dezimaldarstellung ist die interne Gleitkommadarstellung des geprüften Mauswertes.

Damit ist Etappe 1 technisch abgenommen und als Entwicklungsstand gesichert. Die Grenzen oben bleiben gültig. Freigabe/Übernahme nach main ist eine separate Prüfung; kein Merge und keine stabile Release-Veröffentlichung erfolgt. Nächster kleiner Schritt ist die 2D-Kamera-/Maßstabsgrundlage innerhalb Etappe 2, anschließend Endpunkt-/Mittelpunkt-/Schnittpunktfang.
