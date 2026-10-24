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

# Stufe 2: Prüfergebnisse unveränderter Geschosse wiederverwenden (24.10.2026)

Basis: main `e11e681` (PR441), Branch `audit/storey-validation-reuse`. Freigabe: Nutzer
24.10.2026, Option B der Entscheidungsvorlage („Ergebnisse unveränderter Geschosse
wiederverwenden, mit Gegenprüfung gegen die volle Prüfung“). A04 ergänzt (Masterplan).

## Änderungskarte

1. **Wunsch/Abnahme:** Eine Änderung in einem Geschoss prüft fachlich nur dieses Geschoss
   neu; unveränderte Geschosse übernehmen ihr früheres Ergebnis. Ergebnis und Fehlermeldung
   exakt wie bei voller Prüfung. Ausgeschlossen: Weglassen einer Regel, Dateiformat, neue
   Bauteile.
2. **Eigentümer:** `domain/project/schema.ts` (Abhängigkeitsschlüssel `storeyKeys`,
   optionales `StoreyValidationMemo`), `owned-snapshot.ts` (privates Verzeichnis geprüfter,
   eingefrorener Geschosse). Ein Modell, keine Kopie.
3. **Gemeinsamer Weg:** nur `createProjectSnapshot` übergibt das Memo; damit profitieren alle
   Aktionen auf eigenen Ständen und der Commit. Laden, Speichern, Recovery, IFC und alle
   übrigen Aufrufer von `validateProject` prüfen weiter voll.
4. **Folgen:** Schema-Parsen, gebundene Wandhöhen und projektweite Prüfungen (IDs,
   Arbeitsgeschoss, Ansichten, Abbilder) laufen immer vollständig. Nur die
   Geschoss-Fachprüfung (Geometrie, Wandkörper, Ebenen, Sichtbarkeit, Referenzen,
   Schraffurmuster) wird bei identischem Geschossobjekt und identischem Schlüssel übersprungen.
5. **Abgrenzung:** Schlüssel = eigene Höhenlage, nächstes Geschoss (ID, Höhenlage) und jeder
   übrige Projektwert per Identität (Ebenen, Muster, Bilder, Ansichten, Abbilder, Ordner,
   Sichtbarkeit, Arbeitsgeschoss, …). Jede Abweichung erzwingt volle Prüfung des Geschosses.

## Gegenprüfung

- `benchmarks/storey-validation-reuse.test.ts`: 600 zufällige Änderungen (fester Seed) auf
  vier Geschossen mit gebundenen und festen Wänden, Anschlüssen, Fenstern und Musterschraffur:
  Wandgeometrie/-höhe, Geschosshöhe, Fensterbreite, Ebenenname, Sichtbarkeit, doppelte IDs
  über Geschosse, Musterbreite, Arbeitsgeschoss, Erdgeschosskote, Schraffurpunkte, No-op.
  Bei jedem Schritt Ergebnis bzw. Fehlermeldung exakt wie `validateProject` ohne Memo; gültige
  und ungültige Schritte kommen vor, die Wiederverwendung greift nachweislich (Zähler).
- Gezielt: entferntes Muster, das nur ein unverändertes Geschoss nutzt, wird abgelehnt;
  Musterliste wird über wiederverwendete und neu geprüfte Geschosse gleich gefiltert.
- Gegenproben: Schlüssel ohne Projektwerte → beide Tests scheitern; Wiederverwendung ohne
  gemerkte Muster → beide scheitern. Ohne Bezug auf eigene/nächste Höhenlage bleiben sie grün:
  diese Teile sind nach heutigem Code überzählig (gebundene Höhen werden global geprüft,
  Wandhöhen relativ) und bleiben als Sicherheitsreserve im Schlüssel.
- 1162 Tests, Architektur-Check PASS, beide Typprüfungen, Lint (0 Fehler), Build.

## Messung

Node 24.22.1, gleicher Lauf, alter Vollpfad (vor Stufe 1) gegen jetzt; Ergebnis bei jeder
Stichprobe identisch. Rohdaten:
[node.json](storey-validation-reuse-2026-10-24/node.json).

| Elemente | Vorgang        | Aktion alt → neu |  Summe alt → neu (Median / p95) |
| -------: | -------------- | ---------------: | ------------------------------: |
|    1.000 | Wand ändern    |      40,9 → 14,7 |     126,4 / 158,1 → 15,9 / 22,3 |
|    5.000 | Wand ändern    |     250,7 → 86,9 |    770,0 / 793,5 → 94,1 / 101,0 |
|   20.000 | Wand ändern    |   1006,1 → 359,2 | 3120,0 / 3204,3 → 387,6 / 408,5 |
|   20.000 | Fenster setzen |   1011,3 → 351,6 | 3063,6 / 3187,2 → 381,3 / 400,4 |

Millisekunden. Rund 88 % weniger als der alte Vollpfad; gegenüber Stufe 1b (gleiche Maschine,
früherer Lauf ≈ 1,04 s bei 20.000) etwa ein Drittel. Der Rechner war in diesem Lauf insgesamt
langsamer als bei Stufe 1b; Vergleiche nur innerhalb eines Laufs.

Browser (Chromium 152, Vite-Dev, Bereich durchgehend sichtbar). Rohdaten:
[browser.json](storey-validation-reuse-2026-10-24/browser.json).

| Elemente | Vorgang        | Aktion alt → neu |  Summe alt → neu (Median / p95) |
| -------: | -------------- | ---------------: | ------------------------------: |
|    1.000 | Wand ändern    |      29,1 → 12,6 |      85,2 / 109,6 → 13,6 / 16,4 |
|    5.000 | Wand ändern    |     132,2 → 54,2 |     404,6 / 448,6 → 59,9 / 97,3 |
|   20.000 | Wand ändern    |    542,8 → 216,4 | 1631,0 / 1770,7 → 238,3 / 282,6 |
|   20.000 | Fenster setzen |    509,3 → 216,7 | 1583,4 / 1667,4 → 239,7 / 261,3 |

Verbleibend pro Änderung bei 20.000 Elementen (Browser ≈ 240 ms): Schema-Parsen des ganzen
Projekts (Node ≈ 80 ms), Fachprüfung des geänderten Geschosses, Teilen/Einfrieren und die
globale Größenprüfung (≈ 22 ms).

## Bedienabnahme im Produkt (24.10.2026)

CadWorkspace, Beispielprojekt: „Wandlänge auf 5 m“ → Übernehmen: 5 m; mittiges Fenster
2 → 3 Elemente; zweimal Undo → 2 Elemente, kurze Wand; zweimal Redo → 3 Elemente, 5 m;
„Wandhöhe auf 0,5 m“ abgelehnt („… Fenster vollständig in die Wand passen“), Höhe 2,8 m und
3 Elemente unverändert. Keine Konsolenfehler. Das Beispielprojekt hat ein Geschoss; mehrere
Geschosse sind durch die Gegenprüfung und Messung abgedeckt, nicht praktisch in der UI.

## Grenzen und Folgearbeit

- Wechsel des Arbeitsgeschosses, Sichtbarkeit, Ebenen oder Muster ändern einen Projektwert
  und führen einmalig zur vollen Prüfung aller Geschosse; danach greift die Wiederverwendung
  wieder. Ob `workingStoreyId`/`bimVisibility` aus dem Schlüssel dürfen, ist eine eigene,
  per Gegenprüfung zu belegende Verfeinerung.
- Schema-Parsen bleibt global (≈ 80 ms bei 20.000); geschossweises Parsen ist der nächste
  messbare Hebel. Größenprüfung und Fangindex-Neuaufbau bleiben offen.
- **Pflicht für neue Regeln:** Liest eine Geschossprüfung künftig weitere Daten (z. B. Decken,
  Dächer, Treppen über Geschosse), müssen diese in `storeyKeys` aufgenommen und die
  Gegenprüfung um passende Änderungen erweitert werden.

# Stufe 2b: Schema-Parsen und Größenprüfung geschossweise (24.10.2026)

Basis: main `1f05fea` (PR442), Branch `audit/storey-parse-and-size`. Freigabe: Nutzer
24.10.2026 („Schemaprüfung geschossweise und Größenprüfung schneller“).

## Änderungskarte

1. **Wunsch/Abnahme:** Schema-Parsen und 128-MiB-Größenprüfung kosten pro Änderung nur noch
   das geänderte Geschoss. Ergebnis, Fehlermeldungen und Byte-Länge exakt gleich.
   Ausgeschlossen: Lockerung von Regeln, Dateiformat.
2. **Eigentümer:** `domain/project/schema.ts` (Wiederverwendung wird vor dem Parsen mit
   derselben Bedingung wie Stufe 2 entschieden; wiederverwendete Geschosse werden mit leeren
   Elementlisten geparst und danach durch ihr bereits validiertes eingefrorenes Objekt
   ersetzt; die Entscheidung gilt nur, wenn der Schlüssel nach dem Parsen gleich bleibt).
   `domain/project/storage-data.ts` (`storeyStorageData`, gemeinsame Speicherregel je
   Geschoss). `interop/project-file/size.ts` (Byte-Länge = Projektrahmen + Geschosse +
   Trennzeichen; optionaler Geschoss-Cache). `lib/bim/history.ts` (Cache nur für eigene,
   tief eingefrorene Snapshots).
3. **Gemeinsamer Weg:** wie Stufe 2 (`createProjectSnapshot`, Commit). Laden, Speichern,
   Recovery, Export und Musterabgleich prüfen ohne Memo und ohne Cache.
4. **Folgen:** keine Format- oder Grenzwertänderung; Recovery/Datei unberührt.
5. **Abgrenzung:** projektweite Prüfungen und gebundene Wandhöhen weiter vollständig.

## Gegenprüfung

- Vergleichstest aus Stufe 2 erweitert: bei jedem gültigen der 600 Zufallsschritte ist die
  zusammengesetzte, gecachte Byte-Länge gleich einem JSON-String des ganzen Projekts
  (eingefrorene Kopie der alten Berechnung, `legacyProjectByteLength`); enthält Umlaute und
  gebundene Wände. Ergebnis/Fehler weiter exakt wie volle Prüfung.
- Gegenproben: ohne Trennzeichen in der Byte-Summe → Test scheitert (Schritt 2); ohne
  Wiedereinsetzen des validierten Geschosses nach dem Parsen → beide Tests scheitern.
- 1162 Tests, Architektur-Check PASS, beide Typprüfungen, Lint (0 Fehler), Build.

## Messung

Node 24.22.1, gleicher Lauf, alter Vollpfad (vor Stufe 1) gegen jetzt; Ergebnis bei jeder
Stichprobe identisch. Rohdaten: [node.json](storey-parse-size-2026-10-24/node.json).

| Elemente | Vorgang        | Aktion alt → neu | Commit neu |  Summe alt → neu (Median / p95) |
| -------: | -------------- | ---------------: | ---------: | ------------------------------: |
|    1.000 | Wand ändern    |      44,5 → 10,2 |        0,3 |     142,0 / 153,6 → 10,4 / 13,4 |
|    5.000 | Wand ändern    |     240,6 → 51,9 |        1,2 |     724,4 / 802,6 → 53,2 / 58,9 |
|   20.000 | Wand ändern    |    977,1 → 219,8 |        5,2 | 3100,1 / 3214,9 → 224,9 / 257,1 |
|   20.000 | Fenster setzen |    978,2 → 224,2 |        5,8 | 3011,5 / 3157,0 → 229,7 / 236,6 |

Millisekunden. Gegenüber Stufe 2 (ähnlich langsamer Lauf, 388 ms bei 20.000) rund 42 %
weniger; der Commit fällt von ≈ 28 auf ≈ 5 ms.

Browser (Chromium 152, Vite-Dev, Bereich sichtbar). Rohdaten:
[browser.json](storey-parse-size-2026-10-24/browser.json).

| Elemente | Vorgang        | Aktion alt → neu | Commit neu |  Summe alt → neu (Median / p95) |
| -------: | -------------- | ---------------: | ---------: | ------------------------------: |
|    1.000 | Wand ändern    |       30,6 → 6,6 |        0,3 |        92,6 / 108,4 → 6,9 / 8,7 |
|    5.000 | Wand ändern    |     138,9 → 30,3 |        1,2 |     406,0 / 465,1 → 31,3 / 39,3 |
|   20.000 | Wand ändern    |    538,8 → 115,0 |        4,9 | 1646,0 / 1703,8 → 119,2 / 182,6 |
|   20.000 | Fenster setzen |    509,7 → 125,1 |        5,5 | 1587,5 / 1683,6 → 130,6 / 167,6 |

Gegenüber Stufe 2 (Browser 238 ms bei 20.000) etwa halbiert. Die verbleibende Zeit hängt
an der Größe des geänderten Geschosses (rund 4.000 Elemente je Geschoss in dieser Fixture).

## Bedienabnahme im Produkt (24.10.2026)

CadWorkspace, Beispielprojekt: „Wandlänge auf 5 m“ → Übernehmen: 5 m; mittiges Fenster
2 → 3 Elemente; zweimal Undo → 2; zweimal Redo → 3 Elemente, 5 m; „Wandhöhe auf 0,5 m“
abgelehnt, Höhe 2,8 m und 3 Elemente unverändert. Keine Konsolenfehler. Mehrere Geschosse
nur durch Gegenprüfung und Messung abgedeckt.

## Grenzen

- Verbleibende Kosten wachsen mit dem geänderten Geschoss; sehr dichte Geschosse bleiben
  spürbar. Nächster Hebel wäre eine elementweise statt geschossweise Wiederverwendung
  (eigene Entscheidung, berührt Anschluss-/Nachbarregeln).
- Wechsel von Arbeitsgeschoss, Sichtbarkeit, Ebenen oder Mustern: einmalig volle Prüfung.
- Fangindex-Neuaufbau und die übrigen Aktionsfamilien bleiben offen.

# Stufe 3: Übrige Aktionsfamilien auf eigene Snapshots (24.10.2026)

Basis: main `41812ee` (PR443), Branch `audit/remaining-actions-owned`. Freigabe: Nutzer
24.10.2026 („freigabe und go next“).

## Änderungskarte

1. **Wunsch/Abnahme:** Geschoss-, Abbild-, Maßstabs-, Ebenen-, Schraffur-, Referenz-,
   Kalibrier-, Z-Verschiebungs- und T-Anschluss-Aktionen prüfen pro Änderung nur einmal und
   teilen unveränderte Teile wie Wand/Fenster seit Stufe 1b. Ergebnis exakt gleich.
2. **Eigentümer:** die Application-Aktionen; sie verwenden `validateLike` (Ergebnis) und den
   neuen `validatedInput` (Eingang: eigener Snapshot direkt, sonst volle Prüfung) aus
   `domain/project/owned-snapshot.ts`. `validateLike` nimmt wie `validateProject`
   ungeprüfte Daten an.
3. **Gemeinsamer Weg:** keine neue Fachlogik; derselbe Herkunftsvertrag.
4. **Folgen:** Ergebnisse auf eigenen Ständen sind eingefroren; alle Aufrufer verarbeiten sie
   nur lesend (Spread/Map). Ebenen- und Schraffuraktionen prüften ihren Eingang zusätzlich
   voll; das entfällt für eigene Stände.
5. **Abgrenzung:** Musterabgleich und Sichtbarkeitsverlauf setzen weiter direkt; Laden
   unverändert.

## Gegenprüfung

- `benchmarks/remaining-actions.test.ts`: 19 Fälle (gültig und ungültig) für Geschosse,
  Abbildordner, Maßstab, Ebenen, Ebenenzuordnung, Schraffur und Referenz: gleiches Ergebnis
  bzw. gleiche Fehlermeldung wie mit veränderbarem Eingang; gültige Ergebnisse auf eigenem
  Eingang sind eigene Snapshots. Gegenprobe (Geschossaktionen ohne Herkunft) → vier Fälle
  scheitern. Kalibrierung, Z-Verschiebung und T-Anschluss durch bestehende Tests abgedeckt.
- 1181 Tests, Architektur-Check PASS, beide Typprüfungen, Lint (0 Fehler), Build.

## Messung

Node 24.22.1, gleicher Lauf, alter Vollpfad gegen jetzt, Aktion + Commit; Ergebnis bei
jeder Stichprobe identisch. Rohdaten: [node.json](remaining-actions-2026-10-24/node.json).

| Elemente | Vorgang             |          alt → neu (Median / p95) |
| -------: | ------------------- | --------------------------------: |
|    5.000 | Geschoss umbenennen |       731,9 / 812,3 → 53,7 / 58,8 |
|    5.000 | Schraffur anlegen   |      983,2 / 1008,8 → 55,4 / 62,4 |
|    5.000 | Ebene umbenennen    |   1009,8 / 1231,7 → 260,8 / 448,0 |
|   20.000 | Geschoss umbenennen |   2996,8 / 3120,4 → 215,0 / 237,8 |
|   20.000 | Schraffur anlegen   |   4067,0 / 4394,4 → 224,3 / 273,6 |
|   20.000 | Ebene umbenennen    | 3950,8 / 5124,5 → 1031,1 / 1358,4 |

Ebenenänderungen sind projektweit und lösen bewusst eine volle Prüfung aller Geschosse aus,
jetzt einmal statt drei- bis viermal. Keine Browsermessung für diese Stufe.

## Bedienabnahme im Produkt (24.10.2026)

CadWorkspace (Port 8080, Beispielprojekt, Fenster sichtbar):

- **Geschoss:** Navigator-Doppelklick, „Level 01“ → „Erdgeschoss“; Kopfzeile, Plan, Navigator
  und Statusleiste aktualisiert. Undo → „Level 01“, Redo → „Erdgeschoss“.
- **Ebenen:** Organisation → Ebenen → Ebene hinzufügen („Neue Ebene“) → umbenannt in „Bestand“.
  Umbenennen in den vorhandenen Namen „Decke“ abgelehnt („Dieser Ebenenname ist bereits
  vergeben.“), kein Undo-Schritt. Undo → „Neue Ebene“, Undo → Ebene entfernt, zweimal Redo →
  „Bestand“.
- **Schraffur:** Werkzeug Schraffur, Polygon per Klick (Doppelklick schließt, 3 Eckpunkte):
  Modellelemente 2 → 3; Undo → 2; Redo → 3.
- Keine Konsolenfehler. Wiederherstellungsdialog bewusst nicht bedient.
- **Beobachtung (nicht geändert, nicht gegen main geprüft):** Nach der abgelehnten
  Umbenennung und Escape zeigte das Namensfeld weiter „Decke“, das Modell blieb „Bestand“
  (Undo bestätigt das). Reine Darstellungsfrage des Eingabefelds.

## Offen

- Ebenen-/Musteränderungen bleiben teuer (volle Prüfung); feinere Abhängigkeiten wären eine
  eigene Entscheidung.
- Kalibrierung, Z-Verschiebung und T-Anschluss nicht praktisch in der UI geprüft (bestehende
  Tests).
