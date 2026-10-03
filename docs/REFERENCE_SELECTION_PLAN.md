# Optionale Referenzauswahl bei dichter Geometrie

Arbeitsentwurf 04.10.2026, noch nicht implementiert. Nutzerwunsch: gewünschte Referenzen bei sehr dichter Geometrie gezielt auswählen. Der Stresstest belegt Kosten, nicht die Häufigkeit in realen Projekten.

## Vorgeschlagener Vertrag

- Anzahl tatsächlich naher, erlaubter Segmente vor Paarbildung prüfen. Sichtbarer Hinweis „Viele mögliche Fangziele – Referenzen auswählen“, kein automatisch geöffnetes Pflichtfenster.
- Nur automatische lokale Segmentschnittpunkte aussetzen. End-/Mittelpunkte, Ursprung und aktive Referenzführungen erhalten; eingeschränkten Zustand anzeigen.
- Erst nach Aktivierung andere Geometrie abblenden. Zeichnungs-/Bewegungsentwurf suspendieren; Auswahlklicks dürfen ihn nicht bestätigen.
- Stabile Element- und Segmentidentitäten im gemeinsamen Application-/Tool-Kontext verwenden. Zwei gerade Segmente ergeben ein Paar; zwei Polylinien können viele Segmente enthalten.
- Quellen vor Schnittberechnung einschränken, nicht fertige Ergebnisse nachträglich filtern.
- Auswahl nur für diesen Vorgang; Aufheben/Abbruch/Abschluss vorsehen. Keine Modelländerung und kein Undo-Eintrag für Hilfsauswahl.
- Aktive Referenzen separat validieren. Host-/Eigenausschlüsse, feste Achsen und Snap aus bleiben vorrangig. Zoom erhält Referenzen; Modellwechsel darf keine veralteten Quellen behalten.

## Offene Entscheidungen

Konkrete Schwelle und Hysterese, Wiederaufnahme beim Verlassen dichter Bereiche, Verhalten ohne Auswahl sowie beim Verwerfen einer neuen Auswahl gegenüber einer früheren Auswahl festlegen. Kein Weiterrechnen aller Paare im Hintergrund während der Einschränkung. Picking überlappender Linien und Lebenszyklus beim Idle-Hover gesondert definieren.

Dies sind Vorschläge, keine erfundenen Nutzerentscheidungen. Nächster Auftrag: Vertrag ausarbeiten und ein kleines Implementierungspaket ableiten. Der geprüfte Nähefilter bleibt unabhängig davon bestehen.
