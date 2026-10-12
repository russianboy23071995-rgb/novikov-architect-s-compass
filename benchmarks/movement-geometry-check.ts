import { sameSvgGeometry } from "./svg-geometry-equality";
/** Untimed DOM comparison with the frozen full-project path, not the preview producer. */
import type { Project, Point } from "../src/domain/project/schema";
import { fullSelectionMove } from "./selection-move-oracle";
import { connectedWallSolids } from "../src/domain/elements/wall/connections";
import { wallBody } from "../src/domain/elements/wall/body";
import { wallPlanOutlines } from "../src/rendering/viewport/wall-plan-outline";

export function checkMovementGeometry(base: Project, delta: Point, selectedCount = 20) {
  const targets = base.storey.walls
    .slice(0, selectedCount)
    .map((w) => ({ kind: "wall" as const, id: w.id }));
  const expected = fullSelectionMove(base, targets, delta);
  const solids = new Map(connectedWallSolids(expected).map((s) => [s.wallId, s]));
  const outlines = wallPlanOutlines(expected, new Set(expected.storey.walls.map((w) => w.id)));
  const equal = (actual: string | null | undefined, value: string, label: string) => {
    if (!sameSvgGeometry(actual, value))
      throw new Error(`Full-path DOM mismatch: ${label}; actual=${actual}; expected=${value}`);
  };
  for (const wall of expected.storey.walls) {
    const matches = document.querySelectorAll(`[aria-label="Select wall ${wall.id}"]`);
    if (matches.length !== 1) throw new Error(`Expected one rendered wall: ${wall.id}`);
    const polygon = matches[0]!;
    const body = wallBody(wall);
    const angle =
      (-Math.atan2(wall.end.y - wall.start.y, wall.end.x - wall.start.x) * 180) / Math.PI;
    equal(
      polygon.parentElement?.getAttribute("transform"),
      `translate(${body.start.x} ${-body.start.y}) rotate(${angle})`,
      `${wall.id} transform`,
    );
    const length = Math.hypot(wall.end.x - wall.start.x, wall.end.y - wall.start.y);
    const profile = solids.get(wall.id)?.localProfile ?? [
      { x: 0, y: -wall.thickness / 2 },
      { x: length, y: -wall.thickness / 2 },
      { x: length, y: wall.thickness / 2 },
      { x: 0, y: wall.thickness / 2 },
    ];
    equal(
      polygon.getAttribute("points"),
      profile.map((p) => `${p.x},${-p.y}`).join(" "),
      `${wall.id} body`,
    );
    const local = (p: Point) => {
      const dx = p.x - body.start.x,
        dy = p.y - body.start.y;
      return `${dx * body.normal.y - dy * body.normal.x},${-(dx * body.normal.x + dy * body.normal.y)}`;
    };
    equal(
      document.querySelector(`[aria-label="Wandkontur ${wall.id}"]`)?.getAttribute("d"),
      (outlines.get(wall.id) ?? []).map((e) => `M${local(e.start)} L${local(e.end)}`).join(" "),
      `${wall.id} outline`,
    );
  }
  for (const opening of expected.storey.windows) {
    const wall = expected.storey.walls.find((w) => w.id === opening.wallId)!;
    const length = Math.hypot(wall.end.x - wall.start.x, wall.end.y - wall.start.y);
    const rect = document.querySelector(`[aria-label="Select window ${opening.id}"]`);
    for (const [key, value] of Object.entries({
      x: opening.position * length - opening.width / 2,
      y: -wall.thickness / 2,
      width: opening.width,
      height: wall.thickness,
    }))
      equal(rect?.getAttribute(key), String(value), `${opening.id} ${key}`);
  }
  return {
    walls: expected.storey.walls.length,
    windows: expected.storey.windows.length,
    retainedCorners: expected.storey.wallJoins.length,
    retainedTees: expected.storey.wallTJunctions.length,
  };
}
