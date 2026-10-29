import type { Point2 } from "../../geometry/primitives/point.ts";
import { closedContour } from "./contour-source.ts";
export { closedContour } from "./contour-source.ts";
import { boundedOffsetTarget } from "./offset.ts";
import type { Project } from "../../domain/project/schema.ts";
import { updateLine } from "../lines/actions.ts";
import type { EditSession } from "./session.ts";
import { previewHatch } from "../hatches/actions.ts";
import { editContourEdge, prepareContourEdgeEdit } from "../../geometry/polygons/edit-edge.ts";
export function previewContourEdge(
  session: EditSession,
  pointer: { x: number; y: number },
): Project {
  const ring = closedContour(session.base, session.target);
  if (!ring || session.index === null || !["insert", "edge"].includes(session.action))
    throw new Error("Zuerst eine geschlossene Konturkante auswählen.");
  const points = editContourEdge(
    ring,
    session.index,
    session.action as "insert" | "edge",
    session.anchor,
    boundedEdgeTarget(session, pointer),
  );
  if (session.target.kind === "hatch")
    return previewHatch(session.base, session.base, {
      projectId: session.base.id,
      kind: "update",
      id: session.target.id,
      changes: { points },
    });
  return updateLine(session.base, session.target.id, { points: [...points, { ...points[0]! }] });
}

// One disposable preparation and last result per immutable editing session.
// Weak ownership releases cancelled sessions; a new model/target always prepares afresh.
const edgePreparations = new WeakMap<
  EditSession,
  {
    base: Project;
    key: string;
    points: readonly Point2[];
    resolve: ReturnType<typeof prepareContourEdgeEdit>;
  }
>();

/** Shared by the inference target cap and prepared geometry adapter. */
export function prepareSessionContourEdge(session: EditSession, ownedPoints?: readonly Point2[]) {
  if (session.action !== "edge") throw new Error("Keine Seitenstreckung.");
  const key = JSON.stringify([
    session.target.kind,
    session.target.id,
    session.index,
    session.anchor,
  ]);
  let prepared = edgePreparations.get(session);
  const sameBasis =
    !ownedPoints ||
    (prepared?.points.length === ownedPoints.length &&
      ownedPoints.every(
        (p, i) => p.x === prepared!.points[i]!.x && p.y === prepared!.points[i]!.y,
      ));
  if (!prepared || prepared.base !== session.base || prepared.key !== key || !sameBasis) {
    const ring = ownedPoints ?? closedContour(session.base, session.target);
    if (!ring || session.index === null) throw new Error("Keine Konturkante gewaehlt.");
    prepared = {
      base: session.base,
      key,
      points: ring.map((p) => ({ ...p })),
      resolve: prepareContourEdgeEdit(ring, session.index, session.anchor),
    };
    edgePreparations.set(session, prepared);
  }
  return prepared.resolve;
}

export function boundedEdgeTarget(session: EditSession, target: { x: number; y: number }) {
  if (session.action === "offset") return boundedOffsetTarget(session, target);
  if (session.action !== "edge") return target;
  return prepareSessionContourEdge(session).bound(target);
}
