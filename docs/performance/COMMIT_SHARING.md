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
2,36 s → 1,60 s. **Korrektur (Stufe 1b):** In dieser Stufe-1-Messung setzte „Wand ändern“
bei jeder zweiten Stichprobe den Ausgangswert und war damit ein No-op. Da damals beide
Wege auch No-ops voll prüften, bleiben die Werte vergleichbar; ab Stufe 1b ändert jede
Stichprobe tatsächlich (4,5/5 m). Dauerhaft belegter Heap nach 30 Wand-Commits (nach GC): 5.000 Elemente
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

# Stufe 1b: eine Vollvalidierung pro Änderung (24.10.2026)

Basis: main `0843506` (PR440), Branch `audit/action-owned-snapshots`. Freigabe: Nutzer
24.10.2026 („Stufe 1b: neuer Branch von main, zuerst die Änderungskarte“).

## Änderungskarte

1. **Wunsch/Abnahme:** Wand ändern und Fenster setzen werden pro Änderung nur einmal voll
   validiert statt zweimal (Aktion und Commit); Ergebnis exakt gleich. Ausgeschlossen:
   Lockerung der Prüfung, neue Bauteile, Dateiformat.
2. **Eigentümer:** `domain/project/owned-snapshot.ts` (`validateLike`) und die Modellaktionen
   in `lib/bim/model.ts`. Regel: eigener Stand rein → eigener, eingefrorener, geteilter
   Stand raus; fremde, veränderbare Eingaben erhalten weiter eine veränderbare Kopie.
3. **Gemeinsamer Weg:** Eigenschaften, Textbefehle, direkte Bearbeitung und Fenster setzen
   verwenden `addWall`/`updateWall`/`addWindow`/`updateWindow`/`addLine`/`updateLine`.
   `commitProject` übernimmt einen eigenen Stand ohne erneute Prüfung (bestehender
   Vertrag von `createProjectSnapshot`); jeder andere Eingang wird im Commit voll geprüft.
4. **Folgen:** Undo/Redo, Datei, Recovery und IFC unverändert (Tests). Aktionen auf eigenen
   Ständen tragen zusätzlich Teilen und Einfrieren; das trifft auch Vorschauen auf dem alten
   Pfad und ist unten gemessen.
5. **Abgrenzung:** Geschoss-, Ebenen-, Abbild-, Schraffur- und Referenzaktionen bleiben beim
   bisherigen Weg (Commit prüft). Undo/Redo-Stände mit übernommenen Ansichtseinstellungen
   merken sich ihren eigenen Ursprungsstand nur als Teilungsbasis; ihre Prüfung bleibt voll.

## Nachweis

- 1160 Tests (1 neu, 1 angepasst: Ergebnis einer Aktion auf eigenem Stand ist jetzt
  eingefroren, auf Aufruferdaten weiter veränderbar). Gleichheit alt/neu wie Stufe 1.
  Architektur-Check PASS, beide Typprüfungen, Lint (0 Fehler), Build.
- Node 24.22.1, gleicher Lauf, alter Vollpfad (main vor Stufe 1) gegen jetzt. Ergebnis bei
  jeder Stichprobe identisch. Rohdaten:
  [node.json](commit-sharing-1b-2026-10-24/node.json).

| Elemente | Vorgang        | Aktion alt → neu | Commit alt → neu |    Summe alt → neu (Median / p95) |
| -------: | -------------- | ---------------: | ---------------: | --------------------------------: |
|    1.000 | Wand ändern    |      48,3 → 54,5 |      104,7 → 1,4 |       152,1 / 178,7 → 56,1 / 62,2 |
|    5.000 | Wand ändern    |    211,1 → 221,7 |      420,6 → 6,0 |     634,4 / 741,3 → 228,2 / 249,7 |
|   20.000 | Wand ändern    |   934,5 → 1009,8 |    1971,2 → 26,3 | 2905,7 / 3742,0 → 1037,3 / 1201,4 |
|   20.000 | Fenster setzen |   934,4 → 1028,7 |    2004,7 → 27,9 | 2922,0 / 3270,1 → 1054,1 / 1385,5 |

- Browser (Chromium 152, Vite-Dev; Bereich während 5.000/20.000 zeitweise ausgeblendet,
  synchrone Blöcke). Rohdaten: [browser.json](commit-sharing-1b-2026-10-24/browser.json).

| Elemente | Vorgang        | Aktion alt → neu | Commit alt → neu |  Summe alt → neu (Median / p95) |
| -------: | -------------- | ---------------: | ---------------: | ------------------------------: |
|    1.000 | Wand ändern    |      24,5 → 26,8 |       49,1 → 0,9 |       73,9 / 85,2 → 27,9 / 31,9 |
|    5.000 | Wand ändern    |    104,2 → 116,6 |      217,1 → 4,7 |   324,1 / 347,8 → 121,3 / 139,8 |
|   20.000 | Wand ändern    |    417,7 → 433,8 |     849,6 → 21,3 | 1242,3 / 1427,4 → 455,7 / 524,4 |
|   20.000 | Fenster setzen |    393,4 → 435,0 |     835,3 → 18,0 | 1220,6 / 1281,0 → 456,2 / 487,4 |

Millisekunden. Die Summe sinkt gegenüber dem alten Vollpfad um rund 63–64 %. Die Aktion
selbst wird um etwa 4–13 % teurer (Teilen und Einfrieren); Vorschauen, die pro
Zeigerbewegung noch den alten vollständigen Aktionsweg nutzen, tragen diesen Aufschlag
ebenfalls. Der verbleibende Commit (18–28 ms bei 20.000) ist im Wesentlichen die
128-MiB-Größenprüfung des neuen Stands. Dauerhafter History-Heap wie Stufe 1 nahe null
(Node meldet −2 bis −8 MiB, also Messrauschen).

## Bedienabnahme im Produkt (24.10.2026)

CadWorkspace (Port 8080, Beispielprojekt): „Wandlänge auf 5 m“ → Vorschau 3 → 5 m →
Übernehmen: 5 m. Mittiges Fenster: 2 → 3 Elemente. Zweimal Undo: 2 Elemente, 3 m. Zweimal
Redo: 3 Elemente, 5 m, Redo danach leer. Keine Konsolenfehler. Wiederherstellungsdialog
bewusst nicht bedient. **Nicht geprüft:** Ziehen eines Wandendpunkts mit der Maus (der
Versuch wählte nur ab; der Weg ist durch die Direct-Edit-Tests abgedeckt), 3D, Datei,
Recovery.

## Grenzen und nächste Schritte

- Weitere Aktionsfamilien (Geschosse, Ebenen, Abbilder, Schraffuren, Referenzen) validieren
  weiter zweimal; Umstellung bei Bedarf mit derselben Regel.
- Größenprüfung des neuen Stands bleibt global (O(Projekt)); Kandidat: je Snapshot geteilte
  Teilgrößen.
- Vorschau-Aufschlag messen, falls ein Werkzeug noch den alten Vollpfad pro Zeigerbewegung
  nutzt; Fangindex-Neuaufbau bleibt offen.
- Stufe 2 (Validierung nur betroffener Geschosse) berührt A04 und wird mit diesen Werten
  zur Entscheidung vorgelegt.
