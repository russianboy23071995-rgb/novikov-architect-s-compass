# Entwicklungsplan NOVIKOV CAD

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
