import type { Project } from "../../domain/project/schema.ts";
import type { ElementTarget } from "../../application/selection/target.ts";
import { wallBody } from "../../domain/elements/wall/body.ts";
import { wallLength } from "../../lib/bim/model.ts";
import type { Vector3 } from "../../geometry/projections/orthographic.ts";
import { triangleDepth } from "../../geometry/projections/triangle-depth.ts";
import { nearestWallSurface } from "./wall-depth.ts";
import type { DisplaySurfaces } from "./layer-display.ts";
import type { OutlineEdge } from "./selection-outline.ts";

export type WindowSelectionSurface = { id: string; vertices: Vector3[]; outline: OutlineEdge[] };

/** Disposable opening rectangle on the physical wall centre plane. This is hit/
 * outline geometry, not glazing, a second BIM object or exported material. */
export function windowSelectionSurfaces(
  project: Project,
  allows: (id: string) => boolean,
): WindowSelectionSurface[] {
  const walls = new Map(project.storey.walls.map((wall) => [wall.id, wall]));
  return project.storey.windows.flatMap((opening) => {
    const wall = walls.get(opening.wallId);
    if (!wall || !allows(wall.id) || !allows(opening.id)) return [];
    const body = wallBody(wall),
      length = wallLength(wall);
    const ux = (wall.end.x - wall.start.x) / length;
    const uy = (wall.end.y - wall.start.y) / length;
    const left = opening.position * length - opening.width / 2;
    const right = left + opening.width;
    const bottom = opening.sillHeight,
      top = bottom + opening.height;
    const at = (along: number, z: number): Vector3 => [
      body.start.x + ux * along,
      body.start.y + uy * along,
      z,
    ];
    const vertices = [at(left, bottom), at(right, bottom), at(right, top), at(left, top)];
    // Both opening rims: a centre-plane edge can be hidden by its own reveal.
    const outline: OutlineEdge[] = [-1, 1].flatMap((side) => {
      const rim = vertices.map(([x, y, z]): Vector3 => [
        x + (body.normal.x * side * wall.thickness) / 2,
        y + (body.normal.y * side * wall.thickness) / 2,
        z,
      ]);
      return rim.map((v, i) => [v, rim[(i + 1) % 4]!] as OutlineEdge);
    });
    return [{ id: opening.id, vertices, outline }];
  });
}

export function windowSelectionEdges(
  windows: readonly WindowSelectionSurface[],
  selected: ReadonlySet<string>,
): OutlineEdge[] {
  return windows.filter((w) => selected.has(w.id)).flatMap((w) => w.outline);
}

/** Walls and opening hit planes compete in the same displayed depth space.
 * A visible opening selects its window; opaque material in front wins. Hidden
 * windows supply no hit plane, so their host opening remains click-through. */
export function pickSolidElement(
  solid: DisplaySurfaces,
  windows: readonly WindowSelectionSurface[],
  project: (point: Vector3) => Vector3,
  x: number,
  y: number,
): ElementTarget | null {
  if (![x, y].every(Number.isFinite) || Math.abs(x) > 1 || Math.abs(y) > 1) return null;
  const wall = nearestWallSurface(solid, project, x, y);
  let depth = wall?.depth ?? Infinity;
  let target: ElementTarget | null = wall ? { kind: "wall", id: wall.wallId } : null;
  for (const window of windows) {
    const points = window.vertices.map(project);
    for (const [a, b, c] of [
      [0, 1, 2],
      [0, 2, 3],
    ]) {
      const hit = triangleDepth(points[a!]!, points[b!]!, points[c!]!, x, y);
      if (hit !== null && hit < depth) {
        depth = hit;
        target = { kind: "window", id: window.id };
      }
    }
  }
  return target;
}
