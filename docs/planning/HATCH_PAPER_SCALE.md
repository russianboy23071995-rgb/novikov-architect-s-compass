# V07j: Modellmaß, Papiermaß und Zoom

Stand 09.10.2026, Codebasis main 0407ad5 nach PR228. Dokumentationsauftrag;
Papiermaß ist noch keine verfügbare Produktfunktion.

## Bestand und Zuständigkeiten

| Bereich | Nachgewiesener Stand | Konsequenz |
| --- | --- | --- |
| `src/domain/elements/hatch/model.ts` | Anwendung akzeptiert ausschließlich `mode: "model"`, Ursprung und optionalen Winkel. | Papiermaß benötigt später eine explizite Formaterweiterung, keine Umdeutung vorhandener Werte. |
| `src/domain/elements/hatch/pattern.ts` | Definition besitzt lokale metrische Zellmaße und maximal 256 Linien. | Bibliotheksgeometrie bleibt unverändert; Maßbezug gehört zur Anwendung. |
| `src/application/hatches/actions.ts` | Zuweisung setzt Modellmaß; Vorschau/Commit validieren Projekt und Ausgangskontext. | Neue Eigenschaften müssen durch diese gemeinsame Grenze, ebenso künftig Text/Voice. |
| `src/rendering/viewport/hatch-pattern.ts` | Kachel verwendet Definitionsmaße direkt, Ursprung und Drehung bleiben getrennt. | Gemeinsame Umrechnung vor dem Erzeugen der Kachel vorsehen. |
| `src/components/cad/HatchPattern.tsx` | SVG wiederholt ohne erzeugte Modelllinien; Strichbreite derzeit 1 CSS-Pixel. | Zellskalierung muss auch die lokale Strichbreitenumrechnung berücksichtigen. Papierabstand entscheidet nicht automatisch über Druckstifte. |
| `src/rendering/viewport/plan-camera.ts`, `src/components/cad/CadViewport.tsx` | Kamera in CSS-Pixeln pro Meter; 100 % in 2D bedeutet 100 CSS-Pixel/m. | Zoom bleibt Navigation, ohne physische Bildschirmgrößengarantie. |
| `src/domain/project/schema.ts` | Produktionsschema 14; kein ModelView-/DrawingDocument-Ausgabemaßstab implementiert. | Noch keine Quelle für einen impliziten Maßstab 1:50 vorhanden. |

Der Architekturvertrag ordnet gespeicherte Ausgabemaßstäbe DrawingDocument und
Layout-Platzierung zu. Ein ModelView liefert die Modellableitung. Für die reine
Arbeitsansicht besitzt nach PR230 und dessen bestätigtem Review der fachliche
Ansichtskontext den Maßstab; Bildschirmfenster referenzieren ihn und besitzen Zoom.
Interne Papierlängen bleiben Meter, UI-Werte Millimeter. Standard 1:100 und
Bedienung neben Zoom sind festgelegt; persistente History bleibt offen.
Kein Projektmaßstab wird vorsorglich als globaler Singleton in CadWorkspace eingeführt.

## Technischer Vertrag für die Ableitung

Die Nutzerentscheidung bleibt: Modell- und Papiermaß bei Schraffuren wählbar.
Die folgenden Regeln konkretisieren die Ableitung; sie führen noch keine UI,
neuen Projektfelder oder Dokumentklassen ein.

- Modellmaße bleiben Meter. Ein Ausgabemaßstab ist ein expliziter positiver,
  endlicher Nenner S für 1:S, unabhängig von Kamera und Gerätepixeldichte.
- Im Modellmaß gilt weiterhin Faktor 1 zur Definition; Altprojekte bleiben gleich.
- Für Papiermaß erhält die Anwendung eine positive Papier-Zellbreite p in Metern
  (UI später in mm). Bei Definitionsbreite w ist der gleichförmige Faktor
  `k = p * S / w`. Zellhöhe und alle lokalen Linien skalieren mit k; kein Verzerren.
  Papier-Zellbreite beschreibt die Wiederholungszelle, nicht notwendigerweise
  den Abstand zweier Linien innerhalb der Zelle.
- Allgemein gilt für einen Papierabstand a: Modellabstand = a * S. Beispiel:
  2 mm entsprechen bei 1:50 0,1 m, bei 1:100 0,2 m. Beim Export ergeben beide
  wieder 2 mm. Bei festem S vergrößert Bildschirmzoom auch Papiermuster sichtbar.
- Ursprung bleibt ein Modellpunkt. Kachelunterkante liegt weiterhin dort:
  SVG-y = -origin.y - skalierte Zellhöhe. Rotation bleibt gegen den Uhrzeigersinn;
  lokale Creator-Koordinaten bleiben x-rechts/y-unten. Keine Konturtransformation.
- Definition, IDs, Bibliotheksrevision, Kontur und Fanggeometrie bleiben unverändert.
  Ableitungen dürfen keine Wiederholungslinien im Projekt speichern.
- Fehlender/ungültiger Maßstab im Papiermodus ist ein ausdrückliches Ergebnis,
  kein Fallback auf Zoom oder 1:1. Modellmodus braucht keinen Ausgabemaßstab.
  Auch Überlauf/Unterlauf und nicht positive abgeleitete Maße werden abgewiesen.
- Bildschirmstriche bleiben im Pilot 1 CSS-Pixel. Bei lokaler Kachelskalierung k
  entspricht dies lokal `1 / (pixelsPerMetre * k)`; Rotation ändert k nicht.
  Physische Druckstrichbreiten und Exportstifte sind ein eigener Vertrag.
- Unterschiedliche Ansichten können dieselbe Schraffur mit unterschiedlichem S
  ableiten. S gehört nicht in jede Schraffur oder in die globale Musterbibliothek.

## Offene Produktintegration — keine erfundenen Nutzerentscheidungen

Vor Einführung der Papiermaß-Auswahl: gespeicherten Ansichtskontext und dessen
History-Regel umsetzen. Initialwert 1:100 und Eigentümer sind inzwischen im
[allgemeinen Maßstabsvertrag](VIEW_SCALE_CONTRACT.md) festgelegt. Spätere Layout-Platzierungen müssen
einen explizit aufgelösten effektiven Maßstab liefern; keine unklare Kombination aus
Dokumentmaßstab und zusätzlicher Vergrößerung. Der spätere Moduswechsel sollte die
aktuelle Darstellung bei bekanntem S erhalten (Vorschlag, noch keine Bedienregel).
Minimal-/Maximalwerte für Größen in der UI, Mustergrößen-Voreinstellungen und Druckstiftbreiten bleiben offen.
Ausgabemaßstab verändert nie BIM-Geometrie, Kalibrierung oder gemessene Längen.

## Nachgelagerter Anwendungsfall: V07k innerhalb MS-02

Nach PR230 und Nutzerbestätigung beginnt zuerst MS-01 aus dem allgemeinen
Maßstabsvertrag. Die folgende Schraffurprüfung bleibt als nachgelagerter
Anwendungsfall erhalten; sie ist kein zweiter gleichzeitig aktiver Auftrag.

Den allgemeinen Größenresolver aus MS-01 für Modell-/Papier-Zellmaße unter
`src/rendering/viewport/` verwenden und an die gemeinsame Kachelableitung
anbinden. Der Pilot nimmt explizite Darstellungsparameter entgegen; die bestehende
Produktanwendung bleibt Modellmaß. Keine Erweiterung des persistenten Hatch-Typs,
keine Freischaltung eines Papiermodus ohne Ansichtsvertrag, keine leeren Klassen.
Den bisherigen Modellpfad auf dieselbe Umrechnung mit Faktor 1 führen. Ein isoliertes
Browserbeispiel außerhalb des Produktflows nutzt denselben Resolver und dieselbe
SVG-Darstellung, zeigt eine Definition bei 1:50/1:100 und veränderlichem Zoom.

Abnahme und Tests:

1. Bestehende Modell-Kacheln bleiben numerisch identisch, einschließlich Ursprung,
   asymmetrischer Creator-Geometrie und Rotation 0/45/90 Grad.
2. Papierbreite 0,002 m: Modellbreite 0,1 m bei 1:50 und 0,2 m bei 1:100;
   rechteckige Definitionszelle behält ihr Seitenverhältnis.
3. Zoom 25/100/400 CSS-Pixel/m beeinflusst nur Bildschirmgröße/Strichumrechnung,
   nicht k, S oder Kontur. Keine Anzahl von Wiederholungen wird als Geometrie erzeugt.
4. Fehlender Nenner, Null, negative Werte, NaN/Infinity sowie extreme Produkte
   liefern ein eindeutiges Fehlerergebnis. Eingabedefinitionen bleiben unverändert.
5. Browservergleich für Orientierung, Zoom und konstante Bildschirmstriche;
   passende Tests, Typecheck, Lint und Build. Kein PDF-/Drucknachweis behaupten.

Danach erst einen eigenen Integrationsauftrag für gespeicherten Ansichtskontext,
Schema-Migration, Eigenschaften, Defaults/Pickup und atomare Modell-History planen.
Dieser Folgeauftrag ist hier nicht gleichzeitig aktiv.

## MS-02/V07k acceptance — 2026-10-09

Rendering pilot implemented: explicit paper sizing uses the shared resolver and SVG
component; production remains model-only/schema 14. 786 tests, typecheck and build
pass. Browser verified nine zoom/rotation combinations on the isolated
benchmarks/hatch-scale.html page, without changing contour geometry. No print proof.

Next active task is MS-03 view-scale persistence in DEVELOPMENT_PLAN.md. User has
confirmed that this setting stays outside model Undo/Redo. Product hatch paper-mode
integration remains subsequent work; do not combine it into that persistence task.

## Persistenzvoraussetzung erfüllt — 10.10.2026

MS-03 speichert den Arbeitsmaßstab mit Schema 15 außerhalb Modell-Undo. Die
Papiermodus-Integration kann als nächster einzelner Auftrag folgen. Die Regel für
den Moduswechsel bleibt vorab zu klären; es ist noch keine Papiermodus-Freischaltung.
