import type { Project } from "../../lib/bim/model.ts";
import { updateLine } from "../../lib/bim/model.ts";
import type { EditSession } from "../../lib/bim/direct-edit.ts";
import type { ElementTarget } from "../selection/target.ts";
import { previewHatch } from "../hatches/actions.ts";
import { editContourEdge, capContourEdge } from "../../geometry/polygons/edit-edge.ts";
export function closedContour(project: Project, target: ElementTarget) {
  if (target.kind === "hatch")
    return project.storey.hatches.find((h) => h.id === target.id)?.points ?? null;
  if (target.kind !== "line") return null;
  const line = project.storey.lines?.find((l) => l.id === target.id);
  if (!line || line.kind !== "polyline" || line.points.length < 4) return null;
  const a = line.points[0]!,
    b = line.points.at(-1)!;
  return a.x === b.x && a.y === b.y ? line.points.slice(0, -1) : null;
}
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

export function boundedEdgeTarget(session: EditSession, target: { x: number; y: number }) {
  if (session.action !== "edge") return target;
  const ring = closedContour(session.base, session.target);
  if (!ring || session.index === null) throw new Error("Keine Konturkante gewählt.");
  return capContourEdge(ring, session.index, session.anchor, target);
}
