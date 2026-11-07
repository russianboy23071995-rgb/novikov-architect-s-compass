import {
  allStoreyElements,
  ELEMENT_KINDS,
  elementKinds,
  type ElementKind,
  type ElementOf,
} from "../../domain/elements/registry.ts";
import { storeyOf } from "../../domain/storeys/access.ts";
import type { Project } from "../../domain/project/schema.ts";
import type { LayerVisibilityPolicy } from "../layers/visibility.ts";
import { eligibleSelection, selectionIndex, type SelectionSet } from "./state.ts";
import type { ElementTarget } from "./target.ts";

/**
 * Filter (docs/FILTER.md, L45): a function, not a tool. It reads the model and returns a
 * selection; it never changes the model. Within one criterion any listed value matches, the
 * criteria together must all match; an empty criterion is not applied. An element without the
 * property (a wall has no colour of its own) does not match a criterion on it.
 */
export type FilterCriteria = {
  kinds: readonly ElementKind[];
  layerIds: readonly string[];
  /** Lower-case #rrggbb. */
  colors: readonly string[];
  /** See `lineStyleKey`. */
  lineStyles: readonly string[];
  /** Pen widths in mm. */
  penWidths: readonly number[];
};
/** Where the filter looks: the working storey, all storeys, or what a section shows. */
export type FilterScope =
  { kind: "storey" } | { kind: "all" } | { kind: "shown"; ids: ReadonlySet<string> };
export type FilterMode = "replace" | "add" | "remove";
export const NO_CRITERIA: FilterCriteria = {
  kinds: [],
  layerIds: [],
  colors: [],
  lineStyles: [],
  penWidths: [],
};

type AnyElement = ElementOf<ElementKind>;
type Entry = { target: ElementTarget; element: AnyElement };

/** The element's own colours: line and text colour, hatch fill and visible contour. */
export function elementColors(element: AnyElement): string[] {
  if ("fill" in element) {
    const contour = "contour" in element && element.contour.visible ? [element.contour.color] : [];
    return [element.fill.color, ...contour].map((c) => c.toLowerCase());
  }
  if ("color" in element && typeof element.color === "string") return [element.color.toLowerCase()];
  return [];
}
/** The own line type of a line drawn with one. */
const linePattern = (element: AnyElement) =>
  "penWidth" in element && element.style === "custom" && "pattern" in element && element.pattern
    ? element.pattern
    : null;
/** Line type of a line: the built-in style, or `custom:<id>` of its own line type. */
export function lineStyleKey(element: AnyElement): string | null {
  if (!("style" in element) || !("penWidth" in element)) return null;
  const pattern = linePattern(element);
  return pattern ? `custom:${pattern.id}` : element.style;
}
const penWidthOf = (element: AnyElement) =>
  "penWidth" in element && typeof element.penWidth === "number" ? element.penWidth : null;

function candidates(
  project: Project,
  policy: LayerVisibilityPolicy | undefined,
  scope: FilterScope,
): Entry[] {
  const storeys = scope.kind === "storey" ? [storeyOf(project)] : project.storeys;
  const index = selectionIndex(project);
  const all = storeys.flatMap((s) => allStoreyElements(s));
  const shown = scope.kind === "shown" ? all.filter((e) => scope.ids.has(e.id)) : all;
  const visible = new Set(
    eligibleSelection(
      project,
      policy,
      shown.map((e) => index.get(e.id)!),
    ).map((t) => t.id),
  );
  return (
    shown
      .filter((e) => visible.has(e.id))
      // A locked underlay is not selected by filters or select all (docs/BILDUNTERLAGE.md, B2).
      .filter((e) => !(index.get(e.id)!.kind === "reference" && "locked" in e && e.locked))
      .map((element) => ({ target: index.get(element.id)!, element }))
  );
}

const matches = (criteria: FilterCriteria) => (entry: Entry) => {
  const { target, element } = entry;
  if (criteria.kinds.length && !criteria.kinds.includes(target.kind)) return false;
  if (criteria.layerIds.length && !criteria.layerIds.includes(element.layerId)) return false;
  if (criteria.colors.length && !elementColors(element).some((c) => criteria.colors.includes(c)))
    return false;
  const style = lineStyleKey(element);
  if (criteria.lineStyles.length && (style === null || !criteria.lineStyles.includes(style)))
    return false;
  const pen = penWidthOf(element);
  if (criteria.penWidths.length && (pen === null || !criteria.penWidths.includes(pen)))
    return false;
  return true;
};

/** The elements that match, visible ones only, in model order. */
export function filterElements(
  project: Project,
  policy: LayerVisibilityPolicy | undefined,
  scope: FilterScope,
  criteria: FilterCriteria,
): ElementTarget[] {
  return candidates(project, policy, scope)
    .filter(matches(criteria))
    .map((e) => e.target);
}

/** The new selection: the matches instead of, added to or taken from the current one. */
export function applyFilter(
  current: SelectionSet,
  found: SelectionSet,
  mode: FilterMode,
): ElementTarget[] {
  if (mode === "replace") return [...found];
  const ids = new Set(found.map((t) => t.id));
  if (mode === "remove") return current.filter((t) => !ids.has(t.id));
  const have = new Set(current.map((t) => t.id));
  return [...current, ...found.filter((t) => !have.has(t.id))];
}

export type FilterOption<T> = { value: T; label: string; count: number };
export type FilterOptions = {
  kinds: FilterOption<ElementKind>[];
  layers: FilterOption<string>[];
  colors: FilterOption<string>[];
  lineStyles: FilterOption<string>[];
  penWidths: FilterOption<number>[];
};
const BUILT_IN_STYLES: Record<string, string> = {
  solid: "Durchgezogen",
  dashed: "Gestrichelt",
  break: "Bruchlinie",
};

/** The values that occur in the scope, with how many elements carry each. */
export function filterOptions(
  project: Project,
  policy: LayerVisibilityPolicy | undefined,
  scope: FilterScope,
): FilterOptions {
  const entries = candidates(project, policy, scope);
  const count = <T>(values: Iterable<T>) => {
    const counts = new Map<T, number>();
    for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
    return counts;
  };
  const kinds = count(entries.map((e) => e.target.kind));
  const layers = count(entries.map((e) => e.element.layerId));
  const colors = count(entries.flatMap((e) => [...new Set(elementColors(e.element))]));
  const styleNames = new Map<string, string>();
  const styles = count(
    entries.flatMap((e) => {
      const key = lineStyleKey(e.element);
      if (key === null) return [];
      const pattern = linePattern(e.element);
      if (pattern) styleNames.set(key, pattern.name);
      return [key];
    }),
  );
  const pens = count(entries.flatMap((e) => (penWidthOf(e.element) ?? []) as number[]));
  const layerNames = new Map(project.layers.map((l) => [l.id, l.name]));
  return {
    kinds: elementKinds
      .filter((k) => kinds.has(k))
      .map((k) => ({ value: k, label: ELEMENT_KINDS[k].label, count: kinds.get(k)! })),
    layers: project.layers
      .filter((l) => layers.has(l.id))
      .map((l) => ({ value: l.id, label: layerNames.get(l.id)!, count: layers.get(l.id)! })),
    colors: [...colors]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([c, n]) => ({ value: c, label: c, count: n })),
    lineStyles: [...styles]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([s, n]) => ({
        value: s,
        label: BUILT_IN_STYLES[s] ?? styleNames.get(s) ?? s,
        count: n,
      })),
    penWidths: [...pens]
      .sort(([a], [b]) => a - b)
      .map(([w, n]) => ({ value: w, label: `${w.toLocaleString("de-DE")} mm`, count: n })),
  };
}

/** Criteria of “Ähnliche auswählen”: kind, layer and colour of one element. */
export function similarCriteria(project: Project, target: ElementTarget): FilterCriteria {
  const element = project.storeys
    .flatMap((s) => allStoreyElements(s))
    .find((e) => e.id === target.id);
  if (!element) return NO_CRITERIA;
  return {
    ...NO_CRITERIA,
    kinds: [target.kind],
    layerIds: [element.layerId],
    colors: elementColors(element).slice(0, 1),
  };
}
