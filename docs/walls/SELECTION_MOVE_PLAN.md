# Gemeinsamer Auswahlbaustein und spaetere Gruppenbewegung

Stand 06.10.2026, gepruefte Basis main c8a205c (PR145 integriert).
Nutzerkorrektur ersetzt den vorherigen wandbezogenen Umsetzungsumfang von PR146.
Nur Planung: Die Implementierung ist bis zur korrigierten Planung angehalten.

## Verbindliche Anforderungen

Die Auswahl ist ein gemeinsamer, werkzeugunabhaengiger Application-Baustein fuer
alle heutigen und zukuenftigen Elementtypen. Schon der erste 2D-Schritt umfasst
Waende, Fenster, Linien/offene und geschlossene Polylinien sowie Schraffuren,
einschliesslich gemischter Auswahlen. Spaetere Decken, Daecher, Treppen, Moebel usw.
liefern passende Treffergeometrie und Faehigkeiten, keine eigene Auswahlengine.

- Klick: einzelnes Element auswaehlen.
- Strg + Klick: Mehrfachauswahl. Cmd als macOS-Entsprechung bleibt ein Vorschlag.
- Mit der Maus einen rechteckigen Rahmen ziehen: enthaltene Elemente auswaehlen.
  Auswahl nur auf sichtbaren und aktiven Ebenen.
- Keine eigene Aktion zum gemeinsamen Ziehen eines Eckpunkts. Spaeter stattdessen
  betroffene ganze Elemente gemeinsam auswaehlen und verschieben.

Die Auswahl darf nicht davon abhaengen, ob ein Element eine Bewegungsaktion
unterstuetzt. Eine gemischte Auswahl darf nicht still auf bewegliche Ziele oder
auf das erste Element reduziert werden. Auswahl und Modellbearbeitung sind
getrennte Faehigkeiten; Aktionen validieren ihre gesamte Zielmenge.

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

## Zustaendigkeiten und Wiederverwendung

`application/selection` verwaltet die einzige Auswahlmenge aus stabilen typisierten
Element-IDs: Ersetzen, Ergaenzen, Entfernen, Leeren, Aktualitaet und Berechtigung.
Canvas, Navigator, Eigenschaften, On-Demand-Menue und Text/Voice beziehen ihren
Zielkontext daraus. Keine einzelnen Auswahlzustandsautomaten je Zeichenwerkzeug.
Auswahl ist sitzungsbezogen und keine Modellkopie oder Modell-Undo-Aktion.

Rendering/Picking liefert Treffer mit derselben Projektion wie die sichtbare
Geometrie. Typadapter liefern lediglich Element-ID, Treffer-/Konturgeometrie und
unterstuetzte Aktionen. Fachunabhaengige Rahmen-/Geometriepruefung gehoert nach
Geometry/Rendering, nicht in Wall/Line/Hatch oder CadWorkspace. Ein gemeinsamer
Pointer-Ablauf steuert Klick, Modifier und Rahmenvorschau.

Die bestehende LayerVisibilityPolicy bildet die gemeinsame Sichtbarkeitspruefung.
Ein Fenster mit unsichtbarer Hostwand bleibt ausgeschlossen. Berechtigung wird
vor Trefferauswahl und erneut bei Uebernahme geprueft. Versteckte/geloeschte Ziele
werden aus der Auswahl entfernt; betroffene aktive Bearbeitung wird abgebrochen.
Der Begriff aktive Ebene ist noch zu klaeren (siehe unten), nicht still mit einer
einzigen Zeichenebene oder einer noch nicht vorhandenen Sperre gleichsetzen.

Werkzeugunabhaengigkeit bedeutet gemeinsame Infrastruktur. Sie definiert noch
nicht, ob ein laufender Zeichenvorgang durch Klick/Rahmen abgebrochen, pausiert
oder weitergefuehrt wird. Auswahl-/Zeichen-/Pan-Ereignisse duerfen nicht gleichzeitig
wirken; diese Eingaberegel vor der Anbindung festlegen. Bestehende Shift-Fuehrung
und mittlere Maustaste fuer Pan erhalten.

## Noch offene Details und Vorschlaege

- Aktive Ebenen: Das aktuelle layerSchema enthaelt nur ID/Name; Sichtbarkeit liegt
  separat in bimVisibility.hiddenLayerIds. Kein Aktiv-/Sperrstatus existiert.
  Nutzerfrage offen: nur eingeblendete Ebenen oder zusaetzlich auswaehlbar/gesperrt?
- Rahmen: Aus "alles was darin ist" wird als Vorschlag vollstaendige geometrische
  Einschliessung abgeleitet, nicht bloss Bounding-Box-Ueberlappung. Teilberuehrung
  und eine richtungsabhaengige Crossing-Auswahl sind nicht beschlossen.
- Strg-Klick auf bereits ausgewaehltes Ziel: Entfernen als Vorschlag. Einfacher
  Klick ersetzt die Menge; Klick ins Leere leert sie. Rahmen ersetzt standardmaessig
  die Auswahl; additive Rahmenauswahl ist noch keine Nutzerentscheidung.
- Reihenfolge der Treffer bei Ueberlagerung sowie 3D-Verdeckung und 3D-Rahmen sind
  explizit fuer die spaetere Viewport-Anbindung festzulegen. Der erste Schritt ist
  2D; der Auswahlzustand bleibt ansichts- und werkzeugunabhaengig.

## Akzeptanz des gemeinsamen Auswahlbausteins

1. Einzelklick, Strg-Klick und Rahmen funktionieren mit jedem bestehenden Typ und
   gemischten Mengen; Identitaeten sind stabil, mehrfach getroffene IDs nur einmal.
2. Sichtbare/aktive und ausgeblendete/inaktive Ebenen im selben Rahmen: nur erlaubte
   Elemente; ausgeblendete Hostwand schliesst Fenster aus. Statuswechsel bereinigt
   Auswahl und verwirft betroffene Bearbeitung ohne Modellmutation.
3. Rahmenrichtung, Zoom/Pan/Projektion, Randfaelle, kleine/duenne Elemente, offene
   Linien und geschlossene Flaechen pruefen. Auswahlvorschau und uebernommene Menge
   identisch; Abbruch/Escape hinterlaesst keine halbe Auswahltransaktion.
4. Auswahlmarkierung und Anzahl stimmen in Canvas/Navigator/Eigenschaften ueberein.
   Gruppenaktionen nie still auf erstes Ziel reduzieren; keine irrefuehrenden
   Einzelwerte oder Sprachbefehle bei mehreren Zielen.
5. Neue Elementtypen integrieren sich ueber Treffer-/Faehigkeitsadapter; zentrale
   Modifier-, Rahmen- und Ebenenregeln werden nicht pro Werkzeug kopiert.
6. Bestehendes Zeichnen, On-Demand, Fang-/Shift-/Tab-Verhalten sowie Modell-History
   bleiben unveraendert. Auswahl setzt keine Geometrie und erzeugt keinen Modell-Undo.

## Spaeterer Verbraucher: Gruppenverschiebung

Erst nach diesem Auswahlbaustein folgt die gemeinsame Bewegung. ToolInteraction,
useToolInteraction, InteractionInput und Rasterengine bleiben gemeinsam. Alle
Ziele werden in einem Snapshot verschoben und zusammen validiert, nicht in einer
Schleife ueber Einzelbewegungen. Vorschlag: interne Wandanschluesse erhalten,
externe loesen, Fenster auf bewegten Hosts genau einmal mitfuehren. Ein gemeinsamer
Ursprung, Preview/Cancel, gepinnte Zielmenge und ein Undo-Schritt. Regeln fuer
beliebige gemischte Mengen separat pruefen; Auswahlbarkeit verspricht keine noch
nicht implementierte Gruppenaktion. Keine BIM-Skalierung.

## Genau ein Folgeauftrag

Nach Klaerung der offenen Ebenensemantik den gemeinsamen 2D-Auswahlbaustein fuer
alle vorhandenen Elementtypen mit Klick, Strg-Klick und Rahmen implementieren.
Application-Auswahlmenge, gemeinsame Trefferberechtigung, Renderer-Adapter und
UI-Zielkontext integrieren und die obigen Akzeptanzfaelle pruefen. Noch keine
Gruppenbewegung oder gemeinsame Eckpunktaktion implementieren.
