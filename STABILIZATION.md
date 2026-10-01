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
