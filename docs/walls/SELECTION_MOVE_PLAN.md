# Gemeinsame Verschiebung ausgewaehlter Waende

Stand 06.10.2026, gepruefte Basis main c8a205c (PR145 integriert).
Dieser Auftrag ist Bestandspruefung und Planung; keine neue Laufzeitfunktion.

## Verbindlicher Nutzerwunsch

Keine eigene Aktion zum gemeinsamen Ziehen eines Eckpunkts. Der Nutzer waehlt
beide betroffenen Waende und bewegt die ganzen Elemente gemeinsam. Nicht
gewaehlte Nachbarn werden nicht implizit mitgezogen. Gemeinsamer Ursprung,
Rasterengine, Shift-Richtungssperre, Tab-Laenge/Winkel, Klick-Platzierung und
atomare Modell-History gelten wie bei bisherigen Bewegungen.

## Nachgewiesener Stand

| Stelle | Befund und Konsequenz |
|---|---|
| `src/application/selection/target.ts`, `src/components/cad/bim-view.ts` | Ein `ElementTarget` oder null, keine Auswahlmenge. |
| `src/components/cad/CadWorkspace.tsx` | `requestedSelection` und `showSelection` ersetzen ein einzelnes Ziel; Auswahlanzahl ist 0 oder 1. |
| `src/components/cad/TopToolbar.tsx` | Window selection / Filter rufen `onAction` auf; Workspace bindet `showNotice`. Sichtbare Schaltflaechen sind keine implementierte Mehrfachauswahl. |
| `src/components/cad/BimPlan.tsx` | Picking liefert ein Ziel mit Ursprung/Griff; keine additive Auswahl. |
| `src/application/direct-edit/controller.ts` | Session bindet Basisprojekt und ein Ziel; Vorschau prueft dessen Aktualitaet. |
| `src/application/direct-edit/transforms.ts`, `src/lib/bim/model.ts` | `moveElement` bewegt eine Wand; `updateWall` mit intent move entfernt beteiligte Ts und gleicht Ecken danach ab. |
| `src/application/tools/interaction.ts`, `adapters.ts` | Wiederverwendbarer Vertrag fuer Ursprung, Fangregeln, Zahlenvorschau, Validierung, Commit und Abbruch. |
| `src/application/direct-edit/snapping.ts`, `src/application/tools/snapping.ts` | Bewegtes Ziel und Abhaengigkeiten aus Fangquellen ausschliessen; fuer eine Auswahlmenge auf alle bewegten IDs erweitern. Raeumlichen Index weiterverwenden. |
| `src/lib/bim/history.ts` | Ein vollstaendiger validierter Snapshot kann mit einem History-Schritt uebernommen werden. |

Lesender Modellversuch mit H/E/N aus corner-t-demo: nacheinander alle drei
Waende um (1,0) bewegen. Vorher 1 Ecke/1 T; danach 1 Ecke/0 T. Ausgangsprojekt
unveraendert. Somit darf Gruppenbewegung nicht als Schleife ueber Einzelbewegungen
implementiert werden: Zwischenzustaende loesen interne Beziehungen.
58 bestehende Tests fuer Direct Edit, ToolInteraction und Ecke/T bestanden.

## Begrenzter Umsetzungsvorschlag

Erste vertikale Scheibe: zwei oder mehr sichtbare Waende in 2D auswaehlen und
als ganze Elemente frei verschieben. Keine Rechteck-/Lassoauswahl, Rotation,
Skalierung, gemischte Elementmengen oder neue 3D-Gesten in dieser Scheibe.
Die Auswahlstruktur bleibt typisiert mit ElementTarget-IDs fuer spaetere Adapter.

Bedienvorschlag, noch keine vom Nutzer festgelegte Tastengeste: Strg-Klick unter
Windows bzw. Cmd-Klick unter macOS fuegt eine Wand hinzu oder entfernt sie;
ein normaler Klick ersetzt die Auswahl. Shift bleibt der Richtungsfuehrung.
Ein angeklickter Punkt der Auswahl liefert den gemeinsamen Ursprung. Das vorhandene
On-Demand-Menue startet die gemeinsame freie Bewegung; alle gewaehlten Waende
zeigen dieselbe Vorschau. Bei mehreren Zielen keine irrefuehrenden Einzelwand-
Eigenschaften oder Einzelwand-Sprachbefehle anbieten.

Geometrie-/Beziehungsvorschlag:
- Alle ausgewaehlten Achsenden im selben neuen Snapshot um denselben Vektor
  verschieben und erst den Gesamtzustand validieren. Keine rekursiven Einzelaktionen.
- Eck- und T-Relationen mit beiden Waenden in der Auswahl erhalten; Beziehungen
  mit nur einem ausgewaehlten Partner loesen. Andere Relationen unveraendert lassen.
- Fenster bleiben ihrer Wand zugeordnet und folgen ueber ihre relative Position;
  nicht als zweites Bewegungsziel behandeln. Nicht ausgewaehlte Waende bleiben stehen.
- Im ersten Schritt keine neuen Anschluesse durch Gruppenplatzierung entdecken.
  Das ist eine bewusste Umfangsgrenze, keine Aenderung des Einzelwand-Anschlussfangs.
- Nullbewegung erzeugt weder Relationsverlust noch einen Undo-Eintrag.
- Basisprojekt und gesamte Zielmenge an die Session binden. Modell-/Auswahlwechsel,
  geloeschte oder ausgeblendete Ziele machen die Session ungueltig. Preview/Cancel
  veraendern nichts; Commit validiert erneut und schreibt genau einen History-Schritt.

Application besitzt Auswahluebergaenge und Batch-Aktion; Domain validiert den
finalen Snapshot. Renderer zeigen abgeleitete Auswahl/Vorschau. ToolInteraction,
useToolInteraction und InteractionInput bleiben der gemeinsame Interaktionsweg;
keine neue Winkel-, Tab-, Shift- oder Rasterlogik im Workspace. AI/Text/Voice
nutzen spaeter dieselbe Aktion mit gepinnter Zielmenge; bis dahin Gruppenbefehle
verstaendlich ablehnen, niemals still die erste Wand als Ziel verwenden.

## Akzeptanz fuer den Folgeauftrag

1. Verbundenes L und getrennte Waende gemeinsam verschieben: gleicher Vektor,
   Laengen/Achsversatz unveraendert, innere Ecke bleibt erhalten.
2. Host und Nebenwand gemeinsam: T bleibt erhalten. Nur ein Partner ausgewaehlt:
   Verbindung geloest, nicht ausgewaehlte Geometrie unveraendert. H/E gemeinsam,
   N nicht: Ecke bleibt, T loest sich. H/E/N gemeinsam: beide Relationen bleiben.
3. Fenster folgen genau einmal; JSON-Roundtrip, 2D/3D und IFC stimmen ueberein.
4. Maus-Klick und numerische Laenge/Winkel verwenden dieselbe Translation;
   Ursprung sofort aktiv, Shift bleibt fest, Tab wechselt Eingabefeld, Zoom erhaelt
   Referenzen, bewegte Elemente und davon abhaengige Fangquellen ausgeschlossen.
5. Preview/Abbruch/Nullbewegung unveraendert; Undo/Redo jeweils ganze Bewegung.
   Stale-Kontext, unbekannte/mehrfache IDs, unsichtbare Ziele und unendliche Werte
   validieren; keine Teilmutation und keine stille Teilmenge bewegen.
6. Alte Einzelwahl, Einzelelementbewegung, Sichtbarkeit, Eigenschaften und
   Text-/Voice-Zielkontext bleiben korrekt; Mehrfachwahl zeigt eindeutige Anzahl.

## Genau ein Folgeauftrag

Die beschriebene 2D-Wand-Mehrfachauswahl samt atomarer freier Gruppenverschiebung
als durchgaengigen Ablauf implementieren und die Akzeptanzfaelle pruefen. Dabei
vorhandene Interaktionsinfrastruktur nutzen, Anschlusserhalt im Gesamtzustand
validieren und die vorgeschlagenen Bedienregeln bei der Umsetzung sichtbar machen.
Keine gemeinsame Eckpunktaktion und keine parallele Fang-/Eingabeengine.
