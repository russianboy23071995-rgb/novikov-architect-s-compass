# Darstellungsreihenfolge (K2)

Nutzervorgabe (30.10.2026, Teil des Rechtsklickmenüs vor dem Trimmen): „Reihenfolge der Darstellung“ steuern. Umfang wie in der Karte: zunächst innerhalb derselben Objektart; das Zielbild „Materialvorrang 0–100“ für Bauteile bleibt ein eigener späterer Schritt (Decken C3).

- Rechtsklickmenü, Gruppe „Darstellungsreihenfolge“: Ganz nach vorne · Nach vorne · Nach hinten · Ganz nach hinten. Ausgegraut ohne Auswahl, während einer Bearbeitung oder wenn sich nichts ändern würde („Liegt schon so.“). Nicht im Modify-Menü (Nutzeranpassung K1).
- Wirkung: Der Grundriss zeichnet jede Objektart in ihrer gespeicherten Reihenfolge; ein Element weiter hinten in der Liste liegt oben. So lässt sich Linie über Linie, Schraffur über Schraffur, Raum über Raum legen. Zwischen den Arten bleibt die feste Reihenfolge (Bildreferenz, Raum, Decke, Dach, Schraffur, Wand, Linie). Die Tab-Auswahl folgt derselben Reihenfolge.
- `src/application/elements/order.ts`: `changeDisplayOrder` (eine geprüfte Änderung, ein Undo-Schritt; mehrere ausgewählte Elemente bewegen sich als Block mit unveränderter innerer Reihenfolge, „Nach vorne/hinten“ springt über ein nicht ausgewähltes Nachbarelement), `canChangeDisplayOrder` (ohne Modellprüfung, für das Menü). Über das Element-Register für alle Arten, auch künftige.

Nachweis: Test in `src/application/elements/delete.test.ts` (vier Schritte, Block, andere Listen unverändert, keine Änderung ergibt denselben Stand, Menüprüfung). 1371 Tests grün, 14-Modell-Hash unverändert.
