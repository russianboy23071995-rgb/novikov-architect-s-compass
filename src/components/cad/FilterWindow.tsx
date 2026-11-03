import { useMemo, useState } from "react";
import type { Project } from "@/domain/project/schema";
import type { LayerVisibilityPolicy } from "@/application/layers/visibility";
import type { SelectionSet } from "@/application/selection/state";
import type { ElementTarget } from "@/application/selection/target";
import {
  applyFilter,
  filterElements,
  filterOptions,
  NO_CRITERIA,
  type FilterCriteria,
  type FilterMode,
  type FilterOption,
  type FilterScope,
} from "@/application/selection/filter";
import { FloatingPanel } from "./FloatingPanel";

/** Where the window looks: the plan (storey or all) or the elements a section shows. */
export type FilterPlace =
  | { kind: "plan" }
  | { kind: "section"; label: string; ids: ReadonlySet<string> }
  | { kind: "blocked"; reason: string };

const MODES: { id: FilterMode; label: string }[] = [
  { id: "replace", label: "Auswahl ersetzen" },
  { id: "add", label: "Hinzufügen" },
  { id: "remove", label: "Entfernen" },
];

function Group<T extends string | number>({
  title,
  options,
  chosen,
  onChange,
  swatch = false,
}: {
  title: string;
  options: FilterOption<T>[];
  chosen: readonly T[];
  onChange: (next: T[]) => void;
  swatch?: boolean;
}) {
  if (!options.length) return null;
  return (
    <fieldset className="flex flex-col gap-0.5">
      <legend className="mb-0.5 font-medium text-foreground">{title}</legend>
      {options.map((o) => (
        <label key={String(o.value)} className="flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={chosen.includes(o.value)}
            onChange={(e) =>
              onChange(
                e.target.checked ? [...chosen, o.value] : chosen.filter((v) => v !== o.value),
              )
            }
          />
          {swatch && (
            <span
              className="inline-block size-3 rounded-sm border"
              style={{ background: String(o.value) }}
            />
          )}
          <span className="flex-1">{o.label}</span>
          <span className="tabular-nums text-muted-foreground">{o.count}</span>
        </label>
      ))}
    </fieldset>
  );
}

/**
 * Filter (docs/FILTER.md, L45): selects elements by kind, layer, colour, line type and pen
 * width, in the plan or in a section or elevation. A function, not a tool: it only changes the
 * selection, never the model.
 */
export function FilterWindow({
  open,
  onClose,
  project,
  policy,
  place,
  selection,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  project: Project;
  policy: LayerVisibilityPolicy;
  place: FilterPlace;
  selection: SelectionSet;
  onSelect: (targets: ElementTarget[]) => void;
}) {
  const [criteria, setCriteria] = useState<FilterCriteria>(NO_CRITERIA);
  const [mode, setMode] = useState<FilterMode>("replace");
  const [allStoreys, setAllStoreys] = useState(false);
  const scope = useMemo((): FilterScope | null => {
    if (place.kind === "blocked") return null;
    if (place.kind === "section") return { kind: "shown", ids: place.ids };
    return allStoreys ? { kind: "all" } : { kind: "storey" };
  }, [place, allStoreys]);
  const options = useMemo(
    () => (open && scope ? filterOptions(project, policy, scope) : null),
    [open, project, policy, scope],
  );
  const found = useMemo(
    () => (open && scope ? filterElements(project, policy, scope, criteria) : []),
    [open, project, policy, scope, criteria],
  );
  const set =
    <K extends keyof FilterCriteria>(key: K) =>
    (value: FilterCriteria[K]) =>
      setCriteria((c) => ({ ...c, [key]: value }));
  const result = applyFilter(selection, found, mode);
  return (
    <FloatingPanel open={open} title="Filter" onClose={onClose} width={300} height={520}>
      <div className="flex flex-col gap-3 text-xs" data-testid="filter-window">
        {place.kind === "blocked" || !options ? (
          <p className="text-muted-foreground">
            {place.kind === "blocked" ? place.reason : "Keine Elemente."}
          </p>
        ) : (
          <>
            {place.kind === "plan" ? (
              <div className="flex gap-3">
                <label className="flex items-center gap-1">
                  <input type="radio" checked={!allStoreys} onChange={() => setAllStoreys(false)} />
                  Aktuelles Geschoss
                </label>
                <label className="flex items-center gap-1">
                  <input type="radio" checked={allStoreys} onChange={() => setAllStoreys(true)} />
                  Alle Geschosse
                </label>
              </div>
            ) : (
              <p className="text-muted-foreground">Sichtbar in {place.label}</p>
            )}
            <Group
              title="Elementart"
              options={options.kinds}
              chosen={criteria.kinds}
              onChange={set("kinds")}
            />
            <Group
              title="Ebene"
              options={options.layers}
              chosen={criteria.layerIds}
              onChange={set("layerIds")}
            />
            <Group
              title="Farbe"
              options={options.colors}
              chosen={criteria.colors}
              onChange={set("colors")}
              swatch
            />
            <Group
              title="Linienart"
              options={options.lineStyles}
              chosen={criteria.lineStyles}
              onChange={set("lineStyles")}
            />
            <Group
              title="Stiftbreite"
              options={options.penWidths}
              chosen={criteria.penWidths}
              onChange={set("penWidths")}
            />
            <div className="flex flex-col gap-0.5">
              {MODES.map((m) => (
                <label key={m.id} className="flex items-center gap-1">
                  <input type="radio" checked={mode === m.id} onChange={() => setMode(m.id)} />
                  {m.label}
                </label>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="flex-1 text-muted-foreground" aria-live="polite">
                {found.length} Treffer · danach {result.length} ausgewählt
              </span>
              <button
                type="button"
                className="rounded border px-2 py-1 hover:bg-muted"
                onClick={() => setCriteria(NO_CRITERIA)}
              >
                Zurücksetzen
              </button>
              <button
                type="button"
                className="rounded border bg-primary px-2 py-1 text-primary-foreground hover:opacity-90"
                onClick={() => onSelect(result)}
              >
                Auswählen
              </button>
            </div>
          </>
        )}
      </div>
    </FloatingPanel>
  );
}
