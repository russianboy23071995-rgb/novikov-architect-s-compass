import type { WallDefaults } from "../tools/pickup.ts";
/** Owned prepared scope for the first free wall segment only. */
import { validateProject, type Project, type Point } from "../../lib/bim/model.ts";
import { createDrawing, defaultDrawingWall } from "./actions.ts";
import { connectWallAtTAxis } from "../walls/t-axis-snap.ts";
import type { SnapCandidate } from "../../constraints/snapping/engine.ts";
import { pointsCompatible } from "../../geometry/tolerances/model.ts";
function freeze<T>(v: T): T {
  if (v && typeof v === "object" && !Object.isFrozen(v)) {
    for (const x of Object.values(v)) freeze(x);
    Object.freeze(v);
  }
  return v;
}
export function prepareWallDrawing(
  source: Project,
  origin: Point,
  id: string,
  defaults?: WallDefaults,
) {
  const settings = freeze({ ...(defaults ?? defaultDrawingWall) });
  const base = freeze(validateProject(source));
  const start = freeze({ ...origin });
  const s = base.storey;
  const ids = new Set(
    [
      base,
      s,
      ...base.layers,
      ...base.assets,
      ...s.walls,
      ...s.windows,
      ...(s.lines ?? []),
      ...s.hatches,
      ...s.references,
    ].map((e) => e.id),
  );
  const endpoints = s.walls.flatMap((w) => [w.start, w.end]);
  const empty = freeze({
    ...base,
    assets: [],
    storey: {
      ...s,
      walls: [],
      windows: [],
      lines: [],
      hatches: [],
      references: [],
      wallJoins: [],
      wallTJunctions: [],
    },
  });
  const full = (point: Point, candidate?: SnapCandidate | null) =>
    connectWallAtTAxis(
      createDrawing(base, base, id, { kind: "wall", start, end: point, ...settings }),
      id,
      1,
      point,
      candidate,
    );
  return {
    evaluate(
      point: Point,
      candidate?: SnapCandidate | null,
    ): { project: Project; path: "local" | "full" } {
      if (
        candidate ||
        ids.has(id.trim()) ||
        endpoints.some((p) => pointsCompatible(p, start) || pointsCompatible(p, point))
      )
        return { project: full(point, candidate), path: "full" };
      const added = createDrawing(empty, empty, id, {
        kind: "wall",
        start,
        end: point,
        ...settings,
      }).storey.walls;
      return {
        path: "local",
        project: freeze({ ...base, storey: { ...s, walls: [...s.walls, ...added] } }),
      };
    },
    confirm: full,
  };
}
