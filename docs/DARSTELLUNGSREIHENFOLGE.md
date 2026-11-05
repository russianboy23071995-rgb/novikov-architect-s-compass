# Darstellungsreihenfolge (K2)

Nutzervorgabe (30.10.2026, Teil des Rechtsklickmenüs vor dem Trimmen): „Reihenfolge der Darstellung“ steuern. Umfang wie in der Karte: zunächst innerhalb derselben Objektart; das Zielbild „Materialvorrang 0–100“ für Bauteile bleibt ein eigener späterer Schritt (Decken C3).

- Rechtsklickmenü, Gruppe „Darstellungsreihenfolge“: Ganz nach vorne · Nach vorne · Nach hinten · Ganz nach hinten. Ausgegraut ohne Auswahl, während einer Bearbeitung oder wenn sich nichts ändern würde („Liegt schon so.“). Nicht im Modify-Menü (Nutzeranpassung K1).
- Wirkung: Der Grundriss zeichnet jede Objektart in ihrer gespeicherten Reihenfolge; ein Element weiter hinten in der Liste liegt oben. So lässt sich Linie über Linie, Schraffur über Schraffur, Raum über Raum legen. Zwischen den Arten bleibt die feste Reihenfolge (Bildreferenz, Raum, Decke, Dach, Schraffur, Wand, Linie). Die Tab-Auswahl folgt derselben Reihenfolge.
- `src/application/elements/order.ts`: `changeDisplayOrder` (eine geprüfte Änderung, ein Undo-Schritt; mehrere ausgewählte Elemente bewegen sich als Block mit unveränderter innerer Reihenfolge, „Nach vorne/hinten“ springt über ein nicht ausgewähltes Nachbarelement), `canChangeDisplayOrder` (ohne Modellprüfung, für das Menü). Über das Element-Register für alle Arten, auch künftige.

Nachweis: Test in `src/application/elements/delete.test.ts` (vier Schritte, Block, andere Listen unverändert, keine Änderung ergibt denselben Stand, Menüprüfung). 1371 Tests grün, 14-Modell-Hash unverändert.

Browser-Abnahme (30.10.2026): zwei überlappende Räume R-001 „Unten“ und R-002 „Oben“. Rechtsklick auf die Überlappung: Menü „Raum R-002 Oben“, „Ganz nach vorne“ und „Nach vorne“ ausgegraut („Liegt schon so.“). „Ganz nach hinten“: Zeichenreihenfolge R-002, R-001; an der Überlappung wird nun R-001 getroffen; Hinweis „Ganz nach hinten“. Undo stellt R-001, R-002 wieder her. Keine Konsolenfehler.

## Teil K3: Reihenfolge zwischen den Elementarten (05.11.2026)

Nutzerauftrag aus der Anpassungsliste, Punkt 9a. Änderungskarte mit „Go“ freigegeben.

- **Modell (Schema 63):** Je Geschoss die Listen `displayBands.front` und `displayBands.back`, in Zeichenfolge. Die Elemente selbst ändern sich nicht. Ids gelöschter Elemente werden übergangen und fallen bei der nächsten Änderung weg. Kopien gelten als normal. Eine 62er Datei lädt unverändert, eine 62er Datei mit diesen Listen wird abgelehnt.
- **Zeichnen:** Erst „ganz hinten“, dann die feste Folge, dann „ganz vorn“ (`planSceneRuns`). Normale Linien bleiben an ihrer Stelle über den Wandachsen, Linien in einer Liste wandern mit. Layouts und Abbilder nutzen dieselben Abschnitte.
- **Menü:** „Ganz nach vorne“ und „Ganz nach hinten“ wirken über alle Arten. „Nach vorne“ und „Nach hinten“ gehen einen Schritt in der eigenen Art, am Ende der Art wechseln sie in die Liste, aus der gegenüberliegenden Liste kommen sie zurück. „Standardreihenfolge“ nimmt das Element heraus.
- **Auswählen:** Die Tab-Liste und der Doppelklick folgen derselben Reihenfolge (`band` in `SelectionShape`).
- **Ausgenommen:** Fenster, Türen und Dachflächenfenster folgen ihrem Träger und ordnen sich nur in der eigenen Art.

**Abnahme im Browser (05.11.2026):**

| Schritt                              | Ergebnis                                |
| ------------------------------------ | --------------------------------------- |
| Schraffur über einer Wand            | Liegt unter der Wand                    |
| Rechtsklick, Darstellungsreihenfolge | Fünf Einträge, Standardreihenfolge grau |
| Ganz nach vorne                      | Schraffur liegt über der Wand           |
| Klick auf die Überlappung            | Schraffur gewählt                       |

**Grenzen K3:** Nur vorn, normal und hinten, keine freie Staffelung zwischen zwei Elementen anderer Art. Nur Grundriss und Layouts, 3D, Schnitt und Ansicht bleiben unberührt. Im Browser ist nur die Schraffur gegen die Wand bedient, Layouts, „Standardreihenfolge“ und Rückgängig sind über Tests oder gar nicht einzeln geprüft: Layouts nutzen denselben Code, Rückgängig läuft über die gewöhnliche Änderung.
