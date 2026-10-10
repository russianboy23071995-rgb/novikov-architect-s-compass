# Gespeicherte Ausschnitte — MS-04a

Stand 10.10.2026. Planung, keine neue Laufzeitfunktion. Codebasis: PR234,
Commit `2db018c`, nach erfolgreicher CI regulär zusammengeführt.
Maßgebend: [Architektur §29](../../ARCHITECTURE.md),
[Maßstabsvertrag](VIEW_SCALE_CONTRACT.md) und
[Entwicklungsabstimmung](DEVELOPMENT_ALIGNMENT_2026-10-08.md).

## Befund am vorhandenen Code

| Bereich | Nachgewiesener Stand | Noch fehlend |
| --- | --- | --- |
| `src/domain/project/schema.ts` | Schema 16, ein Geschoss, optionale workingViews mit höchstens einem working-plan-Eintrag; fehlend bedeutet 1:100 | Persistente ModelViews/DrawingDocuments und Referenzvalidierung |
| `src/application/views/project-scale.ts`, `src/domain/views/scale.ts` | Identität aus Projekt/Geschoss, validierter Maßstab, gemeinsame metrische Größenauflösung | Auflösung eines gespeicherten Dokumentziels; ScaleContext kennt nur working-plan |
| `src/application/layers/visibility.ts` | Gemeinsame Sichtbarkeitsregel einschließlich Fenster/Host; drawing-document-Scope als Token | Existenz eines Dokuments wird ausdrücklich noch nicht geprüft; Token ist kein gespeicherter Ausschnitt |
| `src/application/layers/visibility-actions.ts` | Projektfilter mit eigener Paletten-History | Aktionen/History für unabhängige Dokumentfilter |
| `src/components/cad/CadViewport.tsx`, `BimPlan.tsx`, `CadWorkspace.tsx` | Arbeitsmaßstab und Sichtbarkeit sind an mehreren Stellen verbunden; BimPlan rekonstruiert working-plan | Gemeinsame Auflösung von Bindung, Maßstab und Sichtbarkeit vor Übergabe an Renderer |
| `src/lib/bim/history.ts`, `src/domain/project/model-equality.ts` | Modell-Undo erhält aktuelle workingViews/bimVisibility | Bewusste Regel für Dokumentanlage, Löschung, Ausschnittänderung und Dokumentmaßstab |

Die vorhandenen Größenresolver und Sichtbarkeitspolicies werden weiterverwendet.
Eine zusätzliche Rendering-Engine, Datenbank oder neue BIM-History ist hierfür
nicht begründet. Neue Kontexte dürfen insbesondere nicht still auf den
Arbeitsmaßstab oder den Arbeitsfilter zurückfallen.

## Verbindliche Regeln aus bestätigten Anforderungen

- Ein Bauteil existiert einmal. ModelView beschreibt die Ableitung aus dem Projekt,
  DrawingDocument referenziert diese Definition und besitzt eigenen Ausschnitt,
  Maßstab und Ebenensichtbarkeit. Änderungen am Modell erscheinen in allen
  zugehörigen Dokumenten; ein eingefrorener Export ist ein separates Ausgabeprodukt.
- Stabile IDs statt Listenpositionen: Projekt → ModelView → DrawingDocument.
  Eine Bildschirmbelegung referenziert das Ziel über ViewportBinding und besitzt
  nur ihre Kamera/Navigation. Zwei Fenster eines Dokuments teilen dessen Maßstab
  und Filter, behalten aber unabhängigen Zoom.
- Rohes BIM und abgeleitete Arbeitsansichten teilen den BIM-Sichtbarkeitskontext.
  Dokumentfilter sind eigenständig und werden nicht mit dem BIM-Filter geschnitten.
  Layoutplatzierungen lesen den Dokumentkontext. Verdeckte Elemente sind dort weder
  auswählbar noch fangbar; Fenster benötigen im jeweiligen Kontext sichtbare Hosts.
  IFC bleibt vollständig.
- Bei Dokumentanlage wird der Arbeitsmaßstab vorgeschlagen, bleibt aber frei
  wählbar. Spätere Arbeitsmaßstabsänderungen verändern Dokumentmaßstäbe nicht.
  Papiergrößen bleiben intern Meter; der gemeinsame Resolver verwendet den
  effektiven Dokumentmaßstab. BIM-Geometrie und Messwerte bleiben unverändert.
- Bestehende Linien/Schraffuren behalten ihren Geschoss-Scope. Neue dokumenteigene
  Annotationen brauchen explizite Besitzer-IDs. Sichtbarkeit ist keine Kopieraktion
  und verschiebt keine Annotation in einen anderen Scope.
- Arbeitsmaßstab bleibt außerhalb Modell-Undo; Ebenensichtbarkeit hat ihre eigene
  History. Daraus folgt noch keine Entscheidung über Dokumentanlage/-löschung.
- Alle späteren Modellaktionen aus Dokumenten lösen stabile Quell-IDs auf und
  nutzen dieselben Application-Aktionen wie der Arbeitsgrundriss. Generierte Kanten
  sind nicht automatisch bearbeitbare Bauteilpunkte. AI/Text/Voice erhalten denselben
  Ziel-, Ansichts- und Revisionskontext; keine zweite AI-Modelllogik.

## Technische Konkretisierung des Vertrags

Dies sind Architekturregeln, keine behaupteten neuen Bedienentscheidungen:

1. Application löst eine Bindung gegen den aktuellen unveränderlichen Projektsnapshot
   auf. Ergebnis enthält Quellansicht, effektiven Maßstab, Sichtbarkeit und Fähigkeiten.
   Renderer erhalten dieses Ergebnis, keine erratene working-plan-Identität.
2. Fehlende/fremde IDs, unbekannte Zielarten und veraltete Kontexte werden ausdrücklich
   abgewiesen. Ein später gelöschtes Ziel ersetzt sich nicht durch den Hauptgrundriss.
   Das Schließen eines Bildschirmfensters löscht kein Dokument.
3. Dokumente werden im versionierten Projekt gespeichert. Erst ihre tatsächliche
   Einführung erweitert das Schema, mit strikter Migration aller bisher unterstützten
   Versionen. Alte Projekte behalten ihren Arbeitsmaßstab, Filter und Annotationen;
   es werden keine Ausschnitte automatisch erfunden.
4. Löschen von referenzierten Definitionen erfordert geprüfte Abhängigkeiten. Kein
   stilles kaskadierendes Löschen von Dokumenten, Annotationen oder Layoutplatzierungen.
   Wie der Nutzer Abhängigkeiten löst, bleibt eine spätere Bedienentscheidung.
5. Abgeleitete Daten sind wegwerfbar. Cache-Schlüssel müssen Modellrevision und
   relevante Dokumentdefinition berücksichtigen; Pointer und Kamera gehören nicht
   in die Identität der gespeicherten Definition. Keine Vollvalidierung pro Mausbewegung.
6. Ein späterer Layout-Override braucht genau einen effektiven Ausgabemaßstab;
   Dokumentmaßstab und Platzierung dürfen nicht unbeabsichtigt doppelt skalieren.
   Perspektivische 3D-Ansichten haben keinen global konstanten 1:S-Maßstab.

## Offene Bedienentscheidungen und Vorschläge

| Offen | Vorschlag, noch nicht beschlossen | Vor welchem Schritt erforderlich |
| --- | --- | --- |
| Anfangsfilter eines neuen Ausschnitts | Aktuellen BIM-Filter einmal kopieren, danach unabhängig | Dokumentanlage |
| Dokumentanlage/-löschung, Umbenennen, Crop und Maßstab: History | Explizite Dokumentaktionen; History-Regel separat mit Nutzer festlegen, nicht pauschal vom Arbeitsmaßstab übernehmen | Persistente Dokumentaktionen |
| Wahl/Änderung des Ausschnittbereichs | Rechteck in Modellkoordinaten; Fit/Zoom verändert ihn nicht | Sichtbarer Ausschnittpilot |
| Bearbeitungsmodus im Ausschnitt | Erster Pilot nur Ansicht, spätere Modell-/Annotationsbearbeitung klar trennen | Ausschnitt-UI |
| Neue/gelöschte Ebenen in Dokumentfiltern | Hidden-ID-Modell wiederverwenden; neue Ebenen sichtbar, gelöschte IDs bereinigen | Dokumentfilter-Persistenz |

Diese Punkte blockieren den untenstehenden Vorbereitungsschritt nicht. Sie werden
vor der jeweils abhängigen Umsetzung entschieden, nicht als Nutzerfreigabe erfunden.
Layouteditor, Schnitterzeugung, neue Annotationstypen und gedruckte Ausgabe bleiben
außerhalb dieses Auftrags. Ältere N-/F-/V-/AI-Anforderungen bleiben erhalten.

## Genau ein ausführbarer Folgeauftrag: MS-04b — gemeinsamen Arbeitsansichtskontext anbinden

Ein begrenzter Refactoring-Pilot am vorhandenen Arbeitsgrundriss, ohne neue
Dokumentklassen oder Dateiformatänderung:

- Einen Application-Resolver für die tatsächliche working-plan-Bindung einführen,
  der existierende Maßstabs- und Sichtbarkeitsdienste zusammenführt. Gegen Projekt
  und Geschoss validieren; unbekannte Dokumentziele ausdrücklich ablehnen.
- CadViewport/BimPlan und den zugehörigen Maßstabsselektor aus demselben aufgelösten
  Kontext versorgen. Der Renderer rekonstruiert keine working-plan-Identität mehr.
  Bestehende explizite Test-/Sichtbarkeitskontexte nicht unbemerkt überschreiben.
- Pointer/Zoom dürfen den fachlichen Kontext nicht neu aufbauen. Bestehende
  Sichtbarkeits-, Picking-, Snap- und History-Wege bleiben gemeinsam; kein Umbau
  der kompletten Workspace- oder 3D-Architektur.

Abnahme: zwei Bildschirmfenster desselben Grundrisses teilen 1:50 und den Filter,
behalten unabhängigen Zoom; Papiermuster verwenden überall denselben Maßstab.
Ausgeblendete Wand samt Fenster ist weder sichtbar noch auswählbar/fangbar.
Maßstabs-/Filterwechsel, Modell-Undo/Redo und Speichern/Öffnen behalten die bisherigen
Regeln. Fremdes Projekt/Geschoss, unbekanntes Dokumentziel und veraltete Bindung
werden abgewiesen. Automatisierte Regressionstests, Typprüfung, Build und praktischer
Browservergleich; keine Geschwindigkeitszusage ohne Messung.

Dieser konkrete Abbau der aktuellen mehrfachen Kontextverdrahtung bereitet den
Ausschnittpilot vor, ohne offene Dokument-Bedienregeln vorwegzunehmen. Nach MS-04b
wird genau ein neuer Auftrag im Entwicklungsplan festgelegt.


## MS-04b umgesetzt — 10.10.2026

Gemeinsamer Resolver und produktive Verdrahtung implementiert, 796 Tests und Build
bestanden; Browservergleich der geteilten Ansicht erfolgreich. Siehe aktuellen
DEVELOPMENT_PLAN.md für Nachweis und den einzigen Folgeauftrag MS-04c. Die obige
Pilotbeschreibung ist damit historisch; die offenen Dokumententscheidungen bleiben
offen, bis die angefragten Nutzerantworten vorliegen.
