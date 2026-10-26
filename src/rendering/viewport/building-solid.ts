import { isOwnedProjectSnapshot } from "../../domain/project/owned-snapshot.ts";
import { sameProjectModel } from "../../domain/project/model-equality.ts";
import { workingStoreyElevation } from "../../domain/storeys/elevation.ts";
import { validateProject, type Project } from "../../domain/project/schema.ts";
import { buildPreviewSolid, type Solid, type Vec3 } from "../../lib/bim/geometry.ts";
import { createDerivedCache } from "../../domain/project/derived-cache.ts";
import { storeyOf } from "../../domain/storeys/access.ts";

// Moved from lib/bim/geometry.ts (25.10.2026); the per-storey extrusion stays there for now.
type BuildingEntry = { project: Project; result: Solid };
const buildings = createDerivedCache<Project, BuildingEntry>();
// Only one weak recent candidate: no project-ID registry or retained scene history.
let recentBuilding: WeakRef<BuildingEntry> | null = null;
function freezeBuilding(result: Solid): Solid {
  for (const face of result.faces) {
    // Faces of a reused storey part are frozen already.
    if (Object.isFrozen(face)) continue;
    for (const point of face.vertices) Object.freeze(point);
    Object.freeze(face.vertices);
    Object.freeze(face.normal);
    Object.freeze(face);
  }
  Object.freeze(result.faces);
  Object.freeze(result.min);
  Object.freeze(result.max);
  return Object.freeze(result);
}
// The building part of one storey, reused while the storey object of an owned snapshot (deeply
// frozen), its elevation and the asset list stay the same: an edit rebuilds only the storeys it
// changed (docs/performance/EDIT_CYCLE.md, Teil B). One entry per storey ID keeps it bounded;
// steps held by the undo history do not keep their parts.
const STOREY_PART_LIMIT = 64;
// Faces of a reused part keep their identity; the picking index reuses its sub-tree per part
// (docs/performance/PICKING_PER_STOREY.md). Weak: parts and faces leave with their scenes.
const partOfFace = new WeakMap<object, Solid>();
/** The storey part a building face belongs to, if it comes from an owned (reusable) part. */
export function buildingFacePart(face: object): object | undefined {
  return partOfFace.get(face);
}
const storeyParts = new Map<
  string,
  { storey: object; elevation: number; assets: object; solid: Solid }
>();
function storeyPart(project: Project, storey: Project["storeys"][number], owned: boolean): Solid {
  const elevation = workingStoreyElevation({ ...project, workingStoreyId: storey.id });
  const known = owned ? storeyParts.get(storey.id) : undefined;
  if (known?.storey === storey && known.elevation === elevation && known.assets === project.assets)
    return known.solid;
  const solid = buildPreviewSolid({ storey, assets: project.assets }, elevation);
  if (!owned) return solid;
  for (const face of solid.faces) {
    for (const point of face.vertices) Object.freeze(point);
    Object.freeze(face.vertices);
    Object.freeze(face.normal);
    Object.freeze(face);
    partOfFace.set(face, solid);
  }
  if (storeyParts.size >= STOREY_PART_LIMIT) storeyParts.clear();
  storeyParts.set(storey.id, { storey, elevation, assets: project.assets, solid });
  return solid;
}

/** The working storey solid; for owned snapshots the same part as in the building scene, so
 * tools deriving from it do not extrude the storey a second time (docs/performance/RECOVERY_STATUS.md).
 */
export function workingStoreySolid(input: Project): Solid {
  const owned = isOwnedProjectSnapshot(input);
  const project = owned ? input : validateProject(input);
  return storeyPart(project, storeyOf(project), owned);
}

/** One derived building scene. Storeys remain authoritative; working selection is not a filter. */
export function buildBuildingSolid(input: Project): Solid {
  const cached = buildings.get(input);
  const immutable = isOwnedProjectSnapshot(input);
  if (cached && immutable) return cached.result;
  // Mutable public inputs always pass full validation, including same-identity calls.
  const project = immutable ? input : validateProject(input);
  if (cached && sameProjectModel(project, cached.project)) return cached.result;
  const recent = recentBuilding?.deref();
  // Only factory-owned snapshots may reuse their prior validation.
  // Conservative model equality includes geometry, storey heights, datum and joins.
  if (recent && sameProjectModel(project, recent.project)) {
    buildings.set(input, recent);
    return recent.result;
  }
  const parts = project.storeys
    .filter((s) => s.walls.length > 0)
    .map((s) => storeyPart(project, s, immutable));
  const result: Solid = {
    faces: parts.flatMap((p) => p.faces),
    volume: parts.reduce((sum, p) => sum + p.volume, 0),
    min: parts.length
      ? ([0, 1, 2].map((i) => Math.min(...parts.map((p) => p.min[i]!))) as Vec3)
      : [-1, -1, -1],
    max: parts.length
      ? ([0, 1, 2].map((i) => Math.max(...parts.map((p) => p.max[i]!))) as Vec3)
      : [1, 1, 1],
  };
  const entry = { project, result: freezeBuilding(result) };
  buildings.set(input, entry);
  recentBuilding = new WeakRef(entry);
  return entry.result;
}
