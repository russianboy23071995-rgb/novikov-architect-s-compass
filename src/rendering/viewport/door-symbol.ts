import type { Door } from "../../domain/elements/door/model.ts";

type Local = { x: number; y: number };

/** Plan symbol of a single-leaf hinged door, derived only (user decision 24.10.2026):
 * leaf drawn open at 90° and the swing arc back to the closed position.
 * Coordinates are wall-local model metres: x along the axis from the wall body's start,
 * y positive to the left of the wall direction. The hinge sits on the wall face of the
 * swing side. Other presentation detail levels can replace this without model changes.
 */
export function doorPlanSymbol(
  door: Pick<Door, "width" | "position" | "hinge" | "opensTo">,
  wall: { length: number; thickness: number },
) {
  const left = door.position * wall.length - door.width / 2,
    right = left + door.width;
  const side = door.opensTo === "left" ? 1 : -1;
  const hingeX = door.hinge === "start" ? left : right;
  const freeX = door.hinge === "start" ? right : left;
  const face = (side * wall.thickness) / 2;
  const hinge: Local = { x: hingeX, y: face };
  const leafEnd: Local = { x: hingeX, y: face + side * door.width };
  const closed: Local = { x: freeX, y: face };
  return { hinge, leafEnd, closed, radius: door.width };
}

/** SVG path for the leaf and arc, mapping local y to SVG y = -y as the plan does. */
export function doorPlanPath(symbol: ReturnType<typeof doorPlanSymbol>): string {
  const svg = (p: Local) => ({ x: p.x, y: -p.y });
  const c = svg(symbol.hinge),
    a = svg(symbol.leafEnd),
    b = svg(symbol.closed);
  // Quarter arc from the open leaf tip to the closed position; sweep follows orientation.
  const cross = (a.x - c.x) * (b.y - c.y) - (a.y - c.y) * (b.x - c.x);
  const sweep = cross > 0 ? 1 : 0;
  const r = symbol.radius;
  return `M${c.x},${c.y} L${a.x},${a.y} A${r},${r} 0 0 ${sweep} ${b.x},${b.y}`;
}
