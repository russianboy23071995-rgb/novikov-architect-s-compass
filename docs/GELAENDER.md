# Geländer (L42, ab 04.11.2026)

Nutzerauftrag 04.11.2026: das Werkzeug Geländer, freigegeben mit „Go, Geländer“. Umsetzung in drei PRs nach der Änderungskarte.

| PR  | Inhalt                                                                                | Stand    |
| --- | ------------------------------------------------------------------------------------- | -------- |
| G1  | Modell, Dateiformat 54, Standardebene Geländer, Aktionen, 3D-Körper, IFC `IfcRailing` | erledigt |
| G2  | Werkzeug, Einstellungsfenster, Eigenschaften, Grundriss                               | offen    |
| G3  | Bearbeiten, Schnitt, Abnahme                                                          | offen    |

Vorgaben (Empfehlung der Karte, vom Nutzer nicht anders bestimmt): frei als Linienzug gezeichnet, nicht an Treppe oder Decke gebunden; Höhe 1,00 m, Pfosten höchstens 1,20 m auseinander, Füllung Stäbe.

## Teil G1: Modell

- **Modell** (`src/domain/elements/railing/model.ts`, `railingSchema`):
  - `points`: Linienzug im Grundriss, 2 bis 1000 Punkte, kein Abschnitt kürzer als 1 cm,
  - `height`: Oberkante Handlauf über dem Fuß, 0,30–3,00 m,
  - `baseOffset`: Fuß über OK Rohfußboden des eigenen Geschosses,
  - `postSpacing`: größter Pfostenabstand, 0,30–5,00 m,
  - `infill`: „Stäbe“ oder „Platte / Glas“,
  - `renovation` wie bei Wänden (ohne Eintrag Bestand).
- **Bauteile** (`railingMembers`): Jedes Bauteil ist ein Quader, im Grundriss ein Rechteck entlang einer Strecke, senkrecht hochgezogen. Die Maße stehen in Stufe 1 fest (`RAILING_MEMBERS`).
  - Handlauf 5 × 5 cm je Abschnitt. An einem inneren Punkt laufen beide Handläufe um die halbe Breite weiter, damit die Ecke geschlossen ist.
  - Pfosten 4 × 4 cm an jedem Punkt und gleichmäßig dazwischen, höchstens `postSpacing` auseinander. An einer Ecke steht nur ein Pfosten.
  - Bei Stäben: Unterholm 4 × 4 cm, 6 cm über dem Fuß; Stäbe 2 × 2 cm, gleichmäßig verteilt, mit höchstens 12 cm lichtem Abstand, auch zu den Pfosten.
  - Bei Platte/Glas: eine Platte von 2 cm je Feld, 8 cm Abstand zu Fuß und Handlauf.
- **Aktionen** (`src/application/railings/actions.ts`): `addRailing` (fehlende Werte nach den Vorgaben, Standardebene Geländer), `updateRailing`, `defaultRailingLayerId`. Löschen, Ebenen und Auswahlformen laufen über das Bauteilregister (`railing`, „Geländer“).
- **Schema 54:** `railings` je Geschoss (optional). Das Geländer muss auf einer vorhandenen Ebene liegen. Migration 53 → 54 ergänzt die Standardebene „Geländer“, falls sie fehlt. Ein untergeschobenes Geländer in einer 53er oder 52er Datei wird abgelehnt.
- **3D** (`railing-solid.ts`): Jedes Bauteil ist ein geschlossener Quader mit der Kennung `railing`. In 3D wählt ein Klick das Geländer aus, nicht eine Wand. Wandfuß-Fangpunkte entstehen keine.
- **IFC:** `IfcRailing` .GUARDRAIL.:
  - Körper: je Bauteil ein `IfcExtrudedAreaSolid` mit Rechteckprofil,
  - `Pset_RailingCommon`: Höhe und Status (NEW/EXISTING/DEMOLISH),
  - eigene Werte: Länge, Fuß, Pfostenabstand, Füllung, Bauzustand.
- **Nebenbei behoben** (`standardLayerId`): Eine Standardebene mit Kollisionssuffix ab 10 (z. B. `layer:column:10`) wurde nicht erkannt. Im Ausdruck fehlte ein `\`.
- Im Grundriss ist das Geländer in G1 noch nicht gezeichnet und nicht bearbeitbar; das kommt mit G2/G3.

**Nachweis G1:**

- **Prüfungen:** 1567 Tests grün, davon 6 neu in `src/application/railings/actions.test.ts`:
  - Pfosten- und Stababstände, Ecke, Platten,
  - Vorgaben, Ebene, Prüfungen, Löschen,
  - Dateiformat und Migration,
  - 3D-Körper,
  - IFC.

  Dazu Typprüfung beider Projekte, Lint (eine Warnung, die es vorher schon gab), Architekturprüfung ohne Befund, 14-Modell-Hash `e42aa36e…` unverändert.

- **Browser:** Testprojekt mit zwei Geländern geladen, eines mit Stäben und Ecke, eines mit Glas, 1,10 m hoch. In 3D ist bei beiden die Ecke geschlossen. Ein Klick wählt das Geländer aus: Ebene „Geländer“, das Menü am Element zeigt „Geländer“ und „Löschen (Entf)“. Keine Konsolenfehler.

**Grenzen G1:**

- **Ecken:** Die Handläufe überlappen sich an der Ecke; sie sind nicht auf Gehrung geschnitten.
- **Maße:** Die Maße von Handlauf, Pfosten und Stäben sind fest.
- **3D-Farbe:** Das Geländer hat in 3D dieselbe Farbe wie Wände.
