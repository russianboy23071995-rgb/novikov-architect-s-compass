import type { EditSession } from "../../lib/bim/direct-edit.ts";
import type { Point } from "../../lib/bim/model.ts";
import { updateLine } from "../../lib/bim/model.ts";
import { closedContour } from "./contour.ts";
import { prepareConvexOffset } from "../../geometry/polygons/offset.ts";
import { previewHatch } from "../hatches/actions.ts";

const preparations = new WeakMap<EditSession, ReturnType<typeof prepareConvexOffset>>();
function prepared(session: EditSession) {
  let result = preparations.get(session);
  if (!result) {
    // Explicit capability boundary: BIM cannot be offset even in a plan view.
    const ring = closedContour(session.base, session.target);
    if (!ring) throw new Error("Offset ist nur für geschlossene 2D-Konturen verfügbar.");
    result = prepareConvexOffset(ring);
    preparations.set(session, result);
  }
  return result;
}
export function offsetDirection(session: EditSession) {
  return prepared(session).normal(session.index ?? 0);
}
export function previewContourOffset(session: EditSession, pointer: Point) {
  const normal = offsetDirection(session);
  const distance =
    (pointer.x - session.anchor.x) * normal.x + (pointer.y - session.anchor.y) * normal.y;
  const points = prepared(session).at(distance);
  return session.target.kind === "hatch"
    ? previewHatch(session.base, session.base, {
        projectId: session.base.id,
        kind: "update",
        id: session.target.id,
        changes: { points },
      })
    : updateLine(session.base, session.target.id, { points: [...points, { ...points[0]! }] });
}

export function boundedOffsetTarget(session: EditSession, pointer: Point): Point {
  const normal = offsetDirection(session);
  const distance =
    (pointer.x - session.anchor.x) * normal.x + (pointer.y - session.anchor.y) * normal.y;
  const bounded = prepared(session).clamp(distance);
  return { x: session.anchor.x + bounded * normal.x, y: session.anchor.y + bounded * normal.y };
}
