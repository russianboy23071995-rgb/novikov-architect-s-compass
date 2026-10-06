import { resolveToolSnap } from "./snapping.ts";
import { angle45Direction } from "../../geometry/projections/direction.ts";
import type { Point2 } from "../../geometry/primitives/point.ts";

type Args = Parameters<typeof resolveToolSnap>;
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
      const direction = guided
        ? { x: free.point.x - origin.x, y: free.point.y - origin.y }
        : angle45Direction(cursor, origin).direction;
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
