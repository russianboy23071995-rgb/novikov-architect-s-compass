import type { DisplaySurfaces } from "./layer-display.ts";

type Face = DisplaySurfaces["faces"][number];
type Patch = {
  base: DisplaySurfaces;
  replaced: ReadonlySet<string>;
  groups: Map<string, Face[]>;
  faceCount: number;
};
const patches = new WeakMap<DisplaySurfaces, Patch>();
const indices = new WeakMap<DisplaySurfaces, Map<string, Face[]>>();
const stationary = new WeakMap<DisplaySurfaces, { ids: ReadonlySet<string>; faces: Face[] }>();

/** Immutable, disposable render snapshots only. No project/model ownership. */
export function surfaceGroups(solid: DisplaySurfaces) {
  let groups = indices.get(solid);
  if (!groups) {
    groups = new Map();
    for (const face of solid.faces) {
      const group = groups.get(face.wallId);
      if (group) group.push(face);
      else groups.set(face.wallId, [face]);
    }
    indices.set(solid, groups);
  }
  return groups;
}

export const surfacePatch = (solid: DisplaySurfaces) => patches.get(solid);

/** Constant-time empty-state query, without flattening a composed preview. */
export const surfaceFaceCount = (solid: DisplaySurfaces) =>
  patches.get(solid)?.faceCount ?? solid.faces.length;

const noFaces: readonly Face[] = Object.freeze([]);
/** Resolve one entity against the same snapshot/patch used by the buffer.
 * A replaced but absent group is removed, never a reason to revive base faces. */
export function surfaceFaces(solid: DisplaySurfaces, id: string): readonly Face[] {
  const patch = patches.get(solid);
  if (patch) {
    return patch.replaced.has(id)
      ? (patch.groups.get(id) ?? noFaces)
      : surfaceFaces(patch.base, id);
  }
  return surfaceGroups(solid).get(id) ?? noFaces;
}

/** Keep the legacy flat-face view lazy for picking/outlines. The buffer consumes
 * the replacement groups directly. Retain only one stationary partition per base. */
export function composeSurfacePatch(
  base: DisplaySurfaces,
  replaced: ReadonlySet<string>,
  changed: Face[],
  min: DisplaySurfaces["min"],
  max: DisplaySurfaces["max"],
): DisplaySurfaces {
  let partition = stationary.get(base);
  if (
    !partition ||
    partition.ids.size !== replaced.size ||
    [...replaced].some((id) => !partition?.ids.has(id))
  ) {
    partition = {
      ids: new Set(replaced),
      faces: base.faces.filter((face) => !replaced.has(face.wallId)),
    };
    stationary.set(base, partition);
  }
  const retained = partition.faces;
  let flat: Face[] | undefined;
  const result: DisplaySurfaces = {
    min,
    max,
    get faces() {
      return (flat ??= retained.concat(changed));
    },
  };
  const groups = surfaceGroups({ faces: changed, min, max });
  patches.set(result, {
    base,
    replaced: new Set(replaced),
    groups,
    faceCount: retained.length + changed.length,
  });
  return result;
}
