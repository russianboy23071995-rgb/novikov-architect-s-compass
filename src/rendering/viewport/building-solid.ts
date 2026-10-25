import { isOwnedProjectSnapshot } from "../../domain/project/owned-snapshot.ts";
import { sameProjectModel } from "../../domain/project/model-equality.ts";
import { workingStoreyElevation } from "../../domain/storeys/elevation.ts";
import { validateProject, type Project } from "../../domain/project/schema.ts";
import { buildPreviewSolid, type Solid, type Vec3 } from "../../lib/bim/geometry.ts";

// Moved from lib/bim/geometry.ts (25.10.2026); the per-storey extrusion stays there for now.
type BuildingEntry = { project: Project; result: Solid };
const buildings = new WeakMap<Project, BuildingEntry>();
// Only one weak recent candidate: no project-ID registry or retained scene history.
let recentBuilding: WeakRef<BuildingEntry> | null = null;
function freezeBuilding(result: Solid): Solid {
  for (const face of result.faces) {
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
    .map((s) =>
      buildPreviewSolid(
        { storey: s, assets: project.assets },
        workingStoreyElevation({ ...project, workingStoreyId: s.id }),
      ),
    );
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
