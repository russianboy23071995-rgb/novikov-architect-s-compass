# Lint-Warnungen (L38)

Stand 01.11.2026: `npx eslint src` meldete sieben Warnungen `react-refresh/only-export-components`. Eine Komponenten-Datei exportierte zusätzlich etwas anderes als Komponenten, sodass Fast Refresh beim Bearbeiten die Seite neu lädt, statt nur die Komponente auszutauschen.

Behebung ohne Verhaltensänderung, je Export eine eigene Datei:

| Vorher                                                   | Nachher                       |
| -------------------------------------------------------- | ----------------------------- |
| `buttonVariants` in `ui/button.tsx`                      | `ui/button-variants.ts`       |
| `badgeVariants` in `ui/badge.tsx`                        | `ui/badge-variants.ts`        |
| `toggleVariants` in `ui/toggle.tsx`                      | `ui/toggle-variants.ts`       |
| `navigationMenuTriggerStyle` in `ui/navigation-menu.tsx` | `ui/navigation-menu-style.ts` |
| `useFormField` mit beiden Kontexten in `ui/form.tsx`     | `ui/form-context.ts`          |
| `useSidebar` mit Kontext in `ui/sidebar.tsx`             | `ui/sidebar-context.ts`       |
| `refusal` in `cad/RoofProperties.tsx`                    | `cad/refusal.ts`              |

Die Komponenten-Dateien exportieren diese Werte nicht mehr. Wer sie braucht, importiert sie aus der neuen Datei; angepasst wurden `alert-dialog`, `calendar`, `pagination`, `toggle-group` und `RoomProperties`.

Nachweis: `npx eslint src` ohne Meldung, Typprüfung beider Projekte, Architekturprüfung, 1483 Tests grün, 14-Modell-Hash unverändert (`e42aa36e…`), Arbeitsfläche lädt im Browser.
