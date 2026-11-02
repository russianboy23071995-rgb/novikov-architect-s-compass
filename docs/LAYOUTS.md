# Planlayouts (L13)

Nutzerauftrag 02.11.2026: Ein weiterer Reiter im Navigator sammelt alle Layouts im Standardordner „Layoutsammlung“, sortierbar in eigenen Ordnern. Zuerst entstehen leere Layouts; die Platzierung von Zeichnungen und der Plankopfplaner (mit automatischen Texten) folgen später. Neues Layout über Rechtsklick auf einen Ordner oder die freie Fläche; das Fenster bietet Größe, Hoch-/Querformat, Rand und Randabstand und vor allem die Zuordnung zu einem Masterlayout, die abgeschaltet werden kann. Normalerweise regelt das Masterlayout alle diese Einstellungen. Doppelklick öffnet ein Layout als eigenen Tab auf der Zeichenfläche.

Entscheidungen (Empfehlungen übernommen):

1. Masterlayouts im Reiter „Layouts“ als fester Bereich über der „Layoutsammlung“, im selben Fenster erstellt und bearbeitet; Doppelklick öffnet auch ein Masterlayout als Tab.
2. Größen DIN A0 bis A5 und „frei“ (Breite × Höhe in mm).
3. Vier Ränder (oben, rechts, unten, links) in mm; Vorgabe 10 mm, links 20 mm Heftrand.
4. Alles, was im Masterlayout gezeichnet ist, erscheint in jedem Layout, das ihm folgt (auch der Plankopf).

Reihenfolge: LA1 Datenmodell → LA2 Navigator-Reiter → LA3 Fenster „Neues Layout“ → LA4 Layout als Tab, je Schritt ein PR.

## LA1 – Datenmodell

- **Projektdatei Schema 44.** Neu am Projekt (alle optional): `layoutFolders`, `layouts`, `masterLayouts`. Dateien mit Schema 43 werden beim Öffnen übernommen; Layouts in einer Datei mit Schema 43 werden abgelehnt.
- **Vorgaben:** Solange ein Projekt nichts an seinen Layouts ändert, gelten der Ordner „Layoutsammlung“ und das Masterlayout „Standard A3 quer“ (A3 quer, Ränder 10/10/10 mm, links 20 mm). Erst die erste Änderung schreibt beides ins Projekt; unveränderte Projekte behalten ihre Datei (14-Modell-Prüfsumme gleich).
- **Blatt** (`Sheet`): Format A0–A5 oder frei, Hoch-/Querformat, beim freien Format Breite × Höhe (50–5000 mm, wie gezeichnet), vier Ränder (0–500 mm). Die Ränder müssen Platz auf dem Blatt lassen. DIN-Maße hochkant: A0 841 × 1189, A1 594 × 841, A2 420 × 594, A3 297 × 420, A4 210 × 297, A5 148 × 210 mm.
- **Masterlayout:** Name (eindeutig) und Blatt. Löschen nur, solange kein Layout ihm folgt.
- **Layout:** Name, Ordner und entweder ein Masterlayout, dem es folgt (Blatt vom Master), oder ein eigenes Blatt. Beim Umschalten auf ein Masterlayout entfällt das eigene Blatt.
- **Ordner:** „Layoutsammlung“ (fest, nicht umbenennbar, verschiebbar oder löschbar); alle anderen Ordner liegen darin, beliebig tief. Ein Ordner kann nicht in sich selbst oder einen eigenen Unterordner verschoben werden; gelöscht wird nur ein leerer Ordner.
- **Aktionen** (`changeLayouts`, je ein Rückgängig-Schritt): Ordner anlegen/umbenennen/verschieben/löschen, Layout anlegen/Einstellungen/umbenennen/verschieben/löschen, Masterlayout anlegen/Einstellungen/löschen.
- Code: `src/domain/views/layouts.ts` (Schema, Vorgaben, Blattgröße, Regeln), `src/application/views/layouts.ts` (Aktionen), Prüfung in `src/domain/project/schema.ts`, Migration in `src/interop/project-file/load.ts`.

Nachweis LA1: 1495 Tests grün (5 neu in `src/application/views/layouts.test.ts`: Vorgaben ohne Dateiänderung, A3 quer 420 × 297 mm, verschachtelte Ordner, Schleifen und nicht leere Ordner abgelehnt, eigenes Blatt und freies Format, Masterwechsel, Master in Benutzung, Schema 43 → 44 und geschmuggelte Layouts), Typprüfung beider Projekte, Architektur, Lint, Formatierung sauber, 14-Modell-Prüfsumme unverändert (`e42aa36e…`). Im Browser noch nichts zu sehen; die App startet nach dem Neuladen fehlerfrei mit Schema 44.
