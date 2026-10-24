# Geteilte Commit-Snapshots, Stufe 1 (24.10.2026)

Basis: main `04bdd24` (PR439), Branch `audit/commit-structural-sharing`. Freigabe:
Nutzer 24.10.2026, Architektur-Priorität vor dem Wandachsen-Auftrag (AUD14-04/05);
Stufe 1 freigegeben, Stufe 2 (geschossbegrenzte Validierung) erst nach Messung erneut
vorlegen. Bezug: A01, A04, R26-01/02, AUD14-02, §5 Punkt 3.

## Änderungskarte

1. **Wunsch/Abnahme:** Wand ändern und Fenster platzieren im Schulmodell mit fünf
   Geschossen bleiben bei wachsendem Restmodell schneller und speichersparsamer; das
   Ergebnis ist exakt gleich zum bisherigen Vollpfad. Ausgeschlossen: neue Bauteile,
   Dateiformat, Renderer, Lockerung der Commitprüfung.
2. **Eigentümer:** `domain/project/owned-snapshot.ts` (Herkunft, Teilung) und
   `lib/bim/history.ts` (Commit). Ein autoritatives Modell; keine Kopie in UI/Renderern.
3. **Gemeinsamer Weg:** alle bestehenden Aktionen enden weiter in `commitProject`.
   Der neue Stand wird immer vollständig validiert. Ein Undo-Schritt pro Commit.
4. **Folgen:** Undo/Redo, Recovery, JSON-Rundlauf, IFC unverändert (Tests); Windows/macOS
   nicht betroffen (keine Plattformadapter berührt).
5. **Abgrenzung:** nur Commit/History. Aktionen (z. B. `updateWall`) validieren weiter
   selbst; diese doppelte Arbeit bleibt bewusst für einen eigenen Schritt.

## Umsetzung

- `createHistory`/`commitProject` legen Stände als intern ausgestellte, tief eingefrorene,
  voll validierte Snapshots an (`createProjectSnapshot`, bestehender Herkunftsmechanismus;
  Herkunft ist privat, Einfrieren/Kopieren durch Aufrufer verleiht kein Vertrauen).
- Beim Commit werden unveränderte Teilbäume des vorherigen eigenen Snapshots wiederverwendet
  (gleiche Objektidentität), nur wenn ihr serialisierter Inhalt einschließlich
  Schlüsselreihenfolge identisch ist. Bereits eingefrorene Bildhandles werden nie neu gebaut.
- Ist der bisherige Stand ein eigener Snapshot, entfällt seine erneute Vollvalidierung.
  Jeder andere Stand (fremd, aus Undo mit geänderten Ansichtseinstellungen, direkt gesetzt)
  wird wie bisher vollständig validiert.
- Die 128-MiB-Größenprüfung wird je unveränderlichem Snapshot nur einmal gerechnet.

Nicht geändert: Validierung des neuen Stands, Rasterbudget, No-op-/Sichtbarkeitsregeln,
History-Grenze 100, Datei-/Recovery-/IFC-Pfade.

## Nachweis

- 1159 Tests (1155 bisherige + 4 neue): Gleichheit alt/neu auf 100/1.000 Elementen und fünf
  Geschossen über Wand, Fenster, Linie, Sichtbarkeit, No-op, zweimal Undo und Verzweigung;
  History-Inhalte, Undo/Redo, JSON-Rundlauf und IFC (fester Zeitstempel) identisch.
- 13 Bestandstests veränderten den History-Stand nachträglich, um eine Ablehnung zu
  erzwingen. Das ist jetzt unmöglich (TypeError, eigens geprüft). Sie belegen die Ablehnung
  nun über eine fremde, beschädigte Kopie mit eigener Sitzung. Gegenprobe: ohne Beschädigung
  scheitern genau diese Tests, die Ablehnung kommt also aus der Vollvalidierung.
- Architektur-Check PASS (0 Zyklen), beide Typprüfungen, Lint (0 Fehler, 6 bekannte
  Warnungen), Build.
- Statische Suche: keine direkte Mutation von Projektständen im Produktionscode.

### Node-Messung

`node --experimental-strip-types --expose-gc benchmarks/commit-sharing-node.ts`,
Node 24.22.1, Windows x64, ein lokaler Lauf. Gleiche Basis-History je Stichprobe,
Reihenfolge alt/neu wechselnd, 21 Stichproben (20.000: 11). Ergebnis bei jeder
Stichprobe identisch (`equivalent: true`). Rohdaten:
[node.json](commit-sharing-2026-10-24/node.json).

| Elemente | Vorgang            | Aktion (unverändert) | Commit alt Median/p95 | Commit neu Median/p95 |
| -------: | ------------------ | -------------------: | --------------------: | --------------------: |
|      100 | Wand ändern        |                  4,7 |           10,3 / 12,6 |             5,0 / 6,5 |
|    1.000 | Wand ändern        |                 37,5 |           78,2 / 89,3 |           41,0 / 43,4 |
|    5.000 | Wand ändern        |                190,4 |         391,1 / 449,2 |         207,5 / 226,6 |
|   20.000 | Wand ändern        |                771,1 |       1585,9 / 1684,9 |         830,1 / 963,7 |
|    5.000 | Fenster platzieren |                189,4 |         389,6 / 442,4 |         203,5 / 223,6 |
|   20.000 | Fenster platzieren |                735,6 |       1489,9 / 1593,3 |         788,7 / 855,6 |

Millisekunden. Vom Nutzer erlebte Summe bei 20.000 Elementen (Aktion + Commit): rund
2,36 s → 1,60 s. Dauerhaft belegter Heap nach 30 Wand-Commits (nach GC): 5.000 Elemente
64,8 → 0,1 MiB, 20.000 Elemente 258,5 → 0,2 MiB.

### Browser-Messung

`npm run benchmark:browser` → `benchmarks/commit-sharing.html`, Chromium 152 im
Browserbereich der Claude-Desktop-App, Vite-Entwicklungsserver, Windows, ein Lauf mit
sichtbarem Fenster (gegen Ende kurz als ausgeblendet gemeldet). Gleiche Methode wie Node.
Ergebnis bei jeder Stichprobe identisch. Rohdaten:
[browser.json](commit-sharing-2026-10-24/browser.json).

| Elemente | Vorgang            | Aktion (unverändert) | Commit alt Median/p95 | Commit neu Median/p95 |
| -------: | ------------------ | -------------------: | --------------------: | --------------------: |
|      100 | Wand ändern        |                  3,9 |            7,8 / 10,1 |             4,1 / 6,5 |
|    1.000 | Wand ändern        |                 24,7 |           54,3 / 60,5 |           28,1 / 37,2 |
|    5.000 | Wand ändern        |                119,6 |         236,7 / 268,7 |         125,2 / 133,3 |
|   20.000 | Wand ändern        |                535,4 |       1126,6 / 1229,2 |         607,8 / 641,2 |
|    5.000 | Fenster platzieren |                129,5 |         271,1 / 285,4 |         146,5 / 158,4 |
|   20.000 | Fenster platzieren |                503,0 |       1029,2 / 1132,0 |         568,1 / 639,7 |

Millisekunden; reine synchrone Aktion/Commit, ohne React-Rendering und Frames. Kein
Heapnachweis im Browser (nur Node).

### Bedienabnahme im Produkt (24.10.2026)

Echter CadWorkspace (`bun run dev`, Port 8080, Beispielprojekt) im Browserbereich:
Modellbefehl „Wandlänge auf 6 m“ → Vorschau 3 → 6 m → Übernehmen: Länge 6 m. Undo → 3 m,
Redo → 6 m. „Add centred window“: Modellelemente 2 → 3; Undo → 2; Redo → 3 (Commit auf
einem Stand nach Redo). „Wandhöhe auf 0,5 m“ abgelehnt mit „Änderung nicht möglich …
Fenster vollständig in die Wand passen“; Höhe 2,8 m, Länge 6 m und 3 Elemente unverändert.
Keine Konsolenfehler. Der offene Wiederherstellungsdialog wurde bewusst nicht bedient;
die Autosicherung blieb pausiert, vorhandene Sicherungen unverändert. Nicht geprüft:
3D-Ansicht, Dateispeichern/-laden im Browser, Recovery-Wiederaufnahme, Mausziehen.

## Grenzen

- Synthetische Schulgeometrie, kein realer Plan; ein Lauf, keine Hardwaregarantie.
- Undo/Redo mit geänderter Sichtbarkeit erzeugt einen Stand ohne Herkunft; der nächste
  Commit nimmt dann sicher den vollen alten Weg und teilt nichts.
- Verbleibende globale Arbeit pro Änderung: Validierung in der Aktion und erneut im Commit
  (je eine Vollvalidierung), Größenprüfung des neuen Stands, Fangindex-Neuaufbau.
