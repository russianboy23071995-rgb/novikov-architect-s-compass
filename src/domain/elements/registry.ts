import type { Project } from "../project/schema.ts";

type Storey = Project["storeys"][number];

/** Element kinds held by a storey, as typed data. A new kind is added here first; code that
 * must treat it explicitly is then found through the derived ElementKind union, and code that
 * enumerates elements reaches it through storeyElements/allStoreyElements.
 */
export const ELEMENT_KINDS = {
  wall: { list: "walls", label: "Wand" },
  window: { list: "windows", label: "Fenster" },
  door: { list: "doors", label: "Tür" },
  slab: { list: "slabs", label: "Decke" },
  roof: { list: "roofs", label: "Dach" },
  room: { list: "rooms", label: "Raum" },
  column: { list: "columns", label: "Stütze" },
  dimension: { list: "dimensions", label: "Maßkette" },
  text: { list: "texts", label: "Text" },
  stair: { list: "stairs", label: "Treppe" },
  line: { list: "lines", label: "Linie" },
  hatch: { list: "hatches", label: "Schraffur" },
  reference: { list: "references", label: "Referenzbild" },
} as const satisfies Record<string, { list: keyof Storey; label: string }>;
export type ElementKind = keyof typeof ELEMENT_KINDS;
type ListOf<K extends ElementKind> = NonNullable<Storey[(typeof ELEMENT_KINDS)[K]["list"]]>;
export type ElementOf<K extends ElementKind> = ListOf<K>[number];

/** The storey's elements of one kind; optional lists read as empty. */
export function storeyElements<K extends ElementKind>(storey: Storey, kind: K): ListOf<K> {
  return (storey[ELEMENT_KINDS[kind].list] ?? []) as ListOf<K>;
}

/** All kinds in registry order, for code that enumerates every element of a storey. */
export const elementKinds = Object.keys(ELEMENT_KINDS) as ElementKind[];

/** Every element of a storey, all kinds in registry order. */
export function allStoreyElements(storey: Storey): ElementOf<ElementKind>[] {
  return elementKinds.flatMap(
    (kind) => [...storeyElements(storey, kind)] as ElementOf<ElementKind>[],
  );
}
