# Hover-Fang ohne Render-Schleife

## Änderungskarte vor Implementierung

A04/A05, Masterplan §9. Basis main `6acc8e4`, Branch `fix/hover-reference-idempotent`.
Anlass: Browserprüfung 24.10.2026, 20:51:24, Vite-Log mehrfach „Maximum update depth
exceeded“ mit Stack in `useHoverReference.ts:31` innerhalb `BimSolidView`, danach
Error-Boundary; kurz zuvor Tür in 3D entlang der Wand über ein Fenster gezogen.
Nachstellung blieb fehlerfrei.

Ziel ist das bisherige beobachtbare Verhalten: Fang mit Verweilzeit, Pausieren während
Navigation und Reset bei Sitzungswechsel bleiben gleich. Neu ist nur, dass ein Aufrufer,
der seinen Hover-Kontext bei jedem Render neu baut, keine Endlosschleife mehr auslöst.
Constraints (`constraints/inference/hover-reference.ts`) besitzt die Zustandsregeln, der
React-Adapter `components/cad/useHoverReference.ts` nur die Render-Entscheidung. Kein
Code in `lib/bim`, keine Modell-, Datei-, Recovery-, IFC- oder AI-Folgen.

## Befund

Der Effekt in `useHoverReference` rief bei jedem Lauf `setSnapshot` mit einem neuen
Objekt auf; `suspendHoverReference` und `advanceHoverReference(…, null)` lieferten auch
ohne Änderung neue Objekte. Jede pro Render neue Identität von `context` oder `cursor`
in der besitzenden Komponente erzeugt damit eine Schleife.

In `BimSolidView`/`useSolidInference` sind `context` und `cursor` vollständig memoisiert,
`editSnapPolicy` ist pro Sitzung gecacht, Eltern-Callbacks laufen nur in Event-Handlern.
Ein konkreter Auslöser war statisch und in der Nachstellung nicht nachweisbar.

Diagnoseversuch mit React 19.2.8: Ein solcher `useEffect`-Loop meldet nur wiederholt
die Warnung „…calls setState inside useEffect…“ und greift die Error-Boundary nicht an,
auch bei Start über `flushSync`. Die Boundary reagiert erst auf geschachtelte synchrone
Updates (z. B. `useLayoutEffect`). Der Boundary-Fall vom 24.10. bleibt daher offen.

## Umsetzung und Nachweis, 25.10.2026

- `suspendHoverReference` und `advanceHoverReference` geben bei unverändertem Zustand
  dasselbe Objekt zurück.
- Neuer reiner Schritt `suspendHoverSnapshot`; der Hook rendert eine Pausierung nur, wenn
  der Snapshot noch nicht veröffentlicht ist oder sich der Fangzustand ändert.
- Test `src/constraints/inference/hover-reference.test.ts`: Identität bei Pausieren,
  Verlassen und laufender Verweilzeit; zehn Effektläufe mit neuem Kontext derselben
  Sitzung ergeben genau einen Render (vorher zehn).
- `npm test` 1195/1195, `tsc --noEmit`, `npm run lint` (0 Fehler, 6 bestehende
  Warnungen in `components/ui`), `npm run check:architecture` bestanden.
- Browser (Dev-Server aus dem Branch): 2D Wandwerkzeug erfasst Wandende nach Verweilzeit
  („Verlängerung“), Referenz bleibt bei Mausrad-Zoom. 3D „Element frei bewegen“: eine
  Hilfsreferenz nach Verweilzeit, bleibt beim Zoom; keine Konsolenfehler. Nach Esc zeigt
  die Statuszeile weiter „1 Hilfsreferenzen“, identisch mit main.

Offen: Ursache der Error-Boundary vom 24.10. (vollständiger Log fehlt); Tür-Szenario
erst nach Integration der Tür-PRs im Browser prüfbar.
