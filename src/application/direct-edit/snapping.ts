import { tAxisReference } from "../walls/t-axis-snap.ts";
import { offsetDirection } from "./offset.ts";
import { closedContour, boundedEdgeTarget } from "./contour.ts";
import { contourEdge } from "../../geometry/polygons/edit-edge.ts";
import type { EditSession } from "../../lib/bim/direct-edit.ts";
import { editablePoints } from "./transforms.ts";
import { querySnap } from "../../constraints/snapping/engine.ts";
import type { SnapContext, SnapReference } from "../../constraints/snapping/engine.ts";
import type { Point2 } from "../../geometry/primitives/point.ts";
import { projectDirection } from "../../geometry/projections/direction.ts";
import { pointsCompatible } from "../../geometry/tolerances/model.ts";

/** Exclude the original entity for this transaction; previews never supply snap sources.
 * A moving window also excludes its host, whose ends/corners are not independent targets.
 */
export function editSnapReferences(
  session: EditSession,
  references: readonly SnapReference[],
): SnapReference[] {
  const host =
    session.target.kind === "window"
      ? session.base.storey.windows.find((w) => w.id === session.target.id)?.wallId
      : null;
  return references.filter((r) =>
    [r, ...(r.dependencies ?? [])].every(
      (source) => source.entityId !== session.target.id && source.entityId !== host,
    ),
  );
}

export function editDirection(session: EditSession): Point2 | null {
  if (session.action === "offset") return offsetDirection(session);
  if (session.target.kind === "window") {
    const window = session.base.storey.windows.find((w) => w.id === session.target.id)!;
    const wall = session.base.storey.walls.find((w) => w.id === window.wallId)!;
    return { x: wall.end.x - wall.start.x, y: wall.end.y - wall.start.y };
  }
  if (session.action === "edge") {
    const ring = closedContour(session.base, session.target);
    if (!ring || session.index === null) throw new Error("Keine Konturkante gewählt.");
    return contourEdge(ring, session.index).normal;
  }
  if (session.action === "x") return { x: 1, y: 0 };
  if (session.action === "y") return { x: 0, y: 1 };
  if (session.action !== "axis" && session.action !== "stretch") return null;
  const points = editablePoints(session.base, { kind: session.target.kind, id: session.target.id });
  const i = session.index ?? 0;
  const neighbour = points[i === 0 ? 1 : i - 1]!;
  return { x: points[i]!.x - neighbour.x, y: points[i]!.y - neighbour.y };
}

/** Session-only construction origin; excluded model geometry is never reintroduced. */
export function editOriginReference(session: EditSession): SnapReference {
  // Every movement owns the same pinned origin. Element adapters supply only directions.
  const fixedDirection = editDirection(session);
  let direction = fixedDirection;
  if (!direction && session.target.kind !== "window") {
    const points = editablePoints(session.base, {
      kind: session.target.kind,
      id: session.target.id,
    });
    const i = session.index ?? 0;
    const neighbour = points[i === 0 ? 1 : i - 1]!;
    direction = { x: points[i]!.x - neighbour.x, y: points[i]!.y - neighbour.y };
  }
  return {
    entityId: "@edit-origin",
    feature: JSON.stringify([
      session.target.kind,
      session.target.id,
      session.action,
      session.index,
    ]),
    point: { ...session.anchor },
    directions: direction ? [direction] : [],
  };
}

/** Shared resolver for preview and commit. Explicit edit axes win over Shift/Ortho.
 * Do not label a projected off-axis source as an exact endpoint or intersection.
 */
export function resolveEditSnap(session: EditSession, cursor: Point2, context: SnapContext) {
  const direction = editDirection(session);
  const project = (p: Point2) => (direction ? projectDirection(p, session.anchor, direction)! : p);
  const references = editSnapReferences(session, context.references);
  const tReference = tAxisReference(session, cursor, context);
  const sourceQuery = context.sourceQuery;
  const result = querySnap(cursor, {
    ...context,
    references: tReference ? [...references, tReference] : references,
    sourceQuery:
      sourceQuery && tReference ? (...args) => [...sourceQuery(...args), tReference] : sourceQuery,
    fixedAxis: direction ? { origin: session.anchor, direction } : null,
    orthoOrigin: direction ? null : context.orthoOrigin,
    angleOrigin: direction ? null : (context.angleOrigin ?? null),
  });
  if (tReference && pointsCompatible(result.point, tReference.point)) {
    result.candidate = {
      kind: "endpoint",
      worldPoint: tReference.point,
      sourceEntityId: tReference.entityId,
      sourceFeature: "t-axis",
      sourceReferences: [tReference],
      distanceOnScreen: 0,
      priority: 0,
    };
  }
  const point = boundedEdgeTarget(session, project(result.point));
  return pointsCompatible(result.point, point) ? result : { point, candidate: null };
}
