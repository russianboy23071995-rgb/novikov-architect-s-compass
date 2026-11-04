# Geteilter Bildschirm, Stufe 1 (04.11.2026)

Freigabe der Änderungskarte „Geteilter Bildschirm“ durch den Nutzer am 04.11.2026 („Go“). Grundlage ist die Tab-Regel aus `docs/TABS.md`: höchstens ein Tab je Art.

## Bedienung

- **Öffnen:** Rechtsklick auf einen Tab bietet „Rechts daneben öffnen“ und „Darunter öffnen“. Der Tab öffnet sich im zweiten Feld neben seinem Partner. Partner ist der aktive Tab, wenn er eine andere Art hat, sonst der erste andere Tab der Leiste.
- **Paare:** Draufsicht, Schnitt / Ansicht und 3D lassen sich paarweise teilen, immer zwei verschiedene Arten. Das Layoutbuch bleibt in Stufe 1 außen vor, weil es die Grundriss-Werkzeuge mit eigenem Zeichenraum nutzt.
- **Aktives Feld:** Das aktive Feld ist der aktive Tab und trägt einen farbigen Rahmen. Nur dieses Feld nimmt Werkzeuge an, auch das Höhenkoten-Werkzeug im Schnitt. Das andere Feld zeigt seinen Inhalt live mit: Änderungen, Rückgängig und Auswahl erscheinen dort sofort. Der erste Klick in das inaktive Feld macht es aktiv. Ausgewählt wird erst mit dem nächsten Klick, so wie es die Zeichenfläche schon kannte. Zoomen mit dem Mausrad geht auch im inaktiven Feld.
- **Trennlinie:** Man kann sie zwischen 20 und 80 % ziehen, auch mit den Pfeiltasten verschieben. Ein Doppelklick setzt sie auf die Mitte zurück.
- **Aufheben:** Im Rechtsklick-Menü steht „Aufteilung aufheben“. Schließt man einen der beiden Tabs, endet die Aufteilung auch.
- **Andere Art aktiv:** Öffnet man einen dritten Tab, etwa das Layoutbuch, erscheint er allein. Wechselt man zurück zu einem der beiden Tabs, ist die Aufteilung wieder da.
- Die Aufteilung gilt nur für die Sitzung. Sie gehört nicht ins Projekt und ist kein Rückgängig-Schritt.

Das alte Menü „Viewport layout“ (1, 2, 3 oder 4 Felder mit demselben Grundriss, englisch beschriftet) ist entfernt. Der geteilte Bildschirm ersetzt es.

## Umsetzung

- `application/views/canvas-split.ts`:
  - `openSplit` und `splitPartner`: welcher Tab mit welchem geteilt wird,
  - `shownSplit`: ob die Aufteilung gerade sichtbar ist,
  - `keptSplit`: Aufteilung endet, wenn ein Tab ihrer Arten fehlt,
  - `splitFieldRect`: Lage der Felder.
- `CadWorkspace.tsx`:
  - **Grundriss und 3D:** Beide Zeichenflächen bleiben wie bisher montiert. Im geteilten Zustand sind beide sichtbar und aktuell. Hat das andere Feld den anderen Modus (Grundriss neben 3D), wird dieselbe Ansicht ein zweites Mal mit dem anderen Modus gezeichnet. Sie ist nicht aktiv (`active = false`) und nimmt daher keine Eingaben an.
  - **Schnitt:** Das Schnitt-Feld liegt im geteilten Zustand neben dem anderen Feld statt über allem. Es wird auch gezeichnet, wenn es nicht aktiv ist.
- `CadViewport.tsx`: `ViewportManager` zeigt nur noch eine Ansicht. Über `active` und `onActivate` meldet er, ob sie aktiv ist. Diese Logik gab es schon für die alten Mehrfeld-Ansichten.
- `CanvasTabs.tsx`: Rechtsklick-Menü an jedem Tab. `SplitDivider.tsx`: die Trennlinie.

## Nachweis

- **`canvas-split.test.ts`** (4 Tests):
  - Partnerwahl, das Layoutbuch teilt nie,
  - Sichtbarkeit bei einer dritten aktiven Art und nach dem Schließen,
  - Lage der Felder, Grenzen der Trennlinie.
- **Prüfungen:** 1561 Tests grün, Typprüfung beider Projekte, Lint (eine Warnung, die es vorher schon gab), Architekturprüfung ohne Befund, 14-Modell-Hash `e42aa36e…` unverändert.
- **Browser** (Gesamtmodell 3 000):
  - **Grundriss neben Schnitt:** Nach dem Klick ins Schnitt-Feld ist es aktiv, die Auswahl bleibt erhalten. Wanddicke 0,24 → 0,36 m im aktiven Grundriss geändert, dann ins Schnitt-Feld gewechselt und mit Strg+Z rückgängig gemacht: Der inaktive Grundriss zeigt sofort wieder 0,24 m.
  - **Trennlinie:** auf 34 % gezogen, mit Doppelklick zurück auf 50 %.
  - **Grundriss unter 3D** („Darunter öffnen“): Beide Felder zeigen Inhalt. Nach dem Klick ins 3D-Feld ist 3D aktiv, der Grundriss zeichnet weiter alle 120 Wände.
  - **Schnitt neben 3D.**
  - **Weitere Abläufe:** „Aufteilung aufheben“, das Layoutbuch erscheint allein, danach kommt die Aufteilung zurück. Ein geschlossener Schnitt-Tab beendet die Aufteilung, der Grundriss hat danach wieder die volle Fläche.
- **Leistung** (Gesamtmodell 20 000, Auswahlklick auf eine Wand bis zum Bild, Median aus 8):

  | Zustand                    | Median |
  | -------------------------- | -----: |
  | ohne Aufteilung            | 159 ms |
  | Grundriss neben Schnitt    | 161 ms |
  | Grundriss (aktiv) neben 3D | 164 ms |

  Die Werte schwanken auf diesem Rechner stark (85–185 ms je Klick). Einen Unterschied durch die Aufteilung zeigen sie nicht.

## Grenzen

- **Layoutbuch:** Es lässt sich in Stufe 1 nicht teilen.
- **Abbild neben 3D:** Ein Grundriss-Abbild neben 3D kann 3D nicht aktivieren. Der Hinweis „Dieses Abbild ist ein 2D-Grundriss.“ bleibt wie bisher.
- **Schmale Felder:** In einem schmalen Feld brechen die Knöpfe der Schnitt-Kopfzeile um.
- **Ausschnitt beim Teilen:** Die Felder behalten ihren gemerkten Ausschnitt. Nach dem Teilen kann der Grundriss deshalb größer gezoomt sein als nötig. „Alles anzeigen“ passt ihn ein.
- **Auswahl im Schnitt:** Im Browser geprüft ist nur, dass der Klick ins Schnitt-Feld es aktiv macht. Ob ein Klick im Schnitt selbst etwas auswählt, ist hier nicht geprüft.
- **Leistung:** gemessen im Entwicklungsmodus.
