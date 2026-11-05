import { resolveToolSnap } from "./snapping.ts";
import { angle45Direction } from "../../geometry/projections/direction.ts";
import type { Point2 } from "../../geometry/primitives/point.ts";
import type { SnapCandidate } from "../../constraints/snapping/engine.ts";

type Args = Parameters<typeof resolveToolSnap>;

/** The edge at a corner that lies closest to the direction `aim`, turned towards it. */
function closestEdge(candidate: SnapCandidate, aim: Point2): Point2 | null {
  let best: Point2 | null = null;
  let bestCos = -1;
  for (const d of candidate.sourceDirections ?? []) {
    const length = Math.hypot(d.x, d.y) * Math.hypot(aim.x, aim.y);
    if (!length) continue;
    const dot = (d.x * aim.x + d.y * aim.y) / length;
    if (Math.abs(dot) > bestCos) {
      bestCos = Math.abs(dot);
      best = dot < 0 ? { x: -d.x, y: -d.y } : d;
    }
  }
  return best;
}
/** One transient latch per interaction/viewport, shared by all tool adapters. */
export function createShiftSnapLock() {
  let held: { origin: Point2; direction: Point2 } | null = null;
  let last: Args | null = null;
  function resolve(...args: Args): ReturnType<typeof resolveToolSnap> {
    last = args;
    const [policy, cursor, context, options] = args;
    const active = context.activeReferences?.at(-1) ?? context.activeReference;
    const origin = policy?.origin?.point ?? active?.point;
    if (!options.shift || !options.featureSnap || !context.enabled) held = null;
    else if (!held && origin) {
      if (cursor.x === origin.x && cursor.y === origin.y) return resolveToolSnap(...args);
      const free = resolveToolSnap(policy, cursor, context, { ...options, shift: false });
      // Preserve a recognised extension/parallel/other construction direction,
      // including oblique walls. Without a guide, acquire the nearest 45-degree axis.
      const guided =
        free.candidate &&
        [
          "extension",
          "parallel",
          "perpendicular",
          "horizontal",
          "vertical",
          "angle",
          "intersection",
          "axis-intersection",
        ].includes(free.candidate.kind);
      // Pressed at a corner of something else: parallel to its edge, whatever the angle from the
      // origin to that corner is (docs/ANPASSUNGSLISTE.md, 3a). Without one the nearest 45° axis.
      const aim = { x: free.point.x - origin.x, y: free.point.y - origin.y };
      const edge = free.candidate?.kind === "endpoint" ? closestEdge(free.candidate, aim) : null;
      const direction = guided ? aim : (edge ?? angle45Direction(cursor, origin).direction);
      if (Math.hypot(direction.x, direction.y) > 0) held = { origin: { ...origin }, direction };
    }
    return resolveToolSnap(
      policy,
      cursor,
      held ? { ...context, angleDirection: held.direction, angleLockOrigin: held.origin } : context,
      options,
    );
  }
  return {
    resolve,
    press() {
      if (last) resolve(last[0], last[1], last[2], { ...last[3], shift: true });
    },
    release() {
      held = null;
    },
  };
}
