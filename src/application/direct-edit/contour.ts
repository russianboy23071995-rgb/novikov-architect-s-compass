import type { Project } from "../../lib/bim/model.ts";
import { updateLine } from "../../lib/bim/model.ts";
import type { EditSession } from "../../lib/bim/direct-edit.ts";
import type { ElementTarget } from "../selection/target.ts";
import { previewHatch } from "../hatches/actions.ts";
import { editContourEdge, prepareContourEdge } from "../../geometry/polygons/edit-edge.ts";
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

// One disposable preparation and last result per immutable editing session.
// Weak ownership releases cancelled sessions; a new model/target always prepares afresh.
const edgePreparations = new WeakMap<
  EditSession,
  {
    base: Project;
    key: string;
    resolve: ReturnType<typeof prepareContourEdge>;
    last?: { input: { x: number; y: number }; output: { x: number; y: number } };
  }
>();

export function boundedEdgeTarget(session: EditSession, target: { x: number; y: number }) {
  if (session.action !== "edge") return target;
  const key = JSON.stringify([
    session.target.kind,
    session.target.id,
    session.index,
    session.anchor,
  ]);
  let prepared = edgePreparations.get(session);
  if (!prepared || prepared.base !== session.base || prepared.key !== key) {
    const ring = closedContour(session.base, session.target);
    if (!ring || session.index === null) throw new Error("Keine Konturkante gewählt.");
    prepared = {
      base: session.base,
      key,
      resolve: prepareContourEdge(ring, session.index, session.anchor),
    };
    edgePreparations.set(session, prepared);
  }
  const last = prepared.last;
  if (last && [last.input, last.output].some((p) => p.x === target.x && p.y === target.y))
    return { ...last.output };
  const output = prepared.resolve(target);
  prepared.last = { input: { ...target }, output: { ...output } };
  return output;
}
