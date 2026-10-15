import { closedContour, prepareSessionContourEdge } from "./contour.ts";
import { replacePathVertex, translatePoint } from "../../geometry/primitives/point.ts";
import { createProjectSnapshot } from "../../domain/project/owned-snapshot.ts";
import { validateLineGeometry } from "../../domain/project/geometry-validation.ts";
import { storeyOf, replaceStorey } from "../../domain/storeys/access.ts";
import type { EditSession } from "../../lib/bim/direct-edit.ts";
import type { Project, Point } from "../../domain/project/schema.ts";
import type { ElementTarget } from "../selection/target.ts";
import type { PreparedDirectEditPreview } from "./prepared-preview.ts";

/** Snapshot validates fixed style/scope fields once. Every target retains all line geometry rules. */
export function prepareLinePreview(session: EditSession): PreparedDirectEditPreview {
  if (session.target.kind !== "line" || !["point", "edge"].includes(session.action))
    throw Error("Unsupported line preview");
  const source = session.base,
    base = createProjectSnapshot(source),
    level = storeyOf(base);
  const line = level.lines?.find((l) => l.id === session.target.id),
    index = session.index;
  if (!line || index === null || !Number.isInteger(index) || !line.points[index])
    throw Error("Invalid line grip");
  const ring = session.action === "edge" ? closedContour(base, session.target) : null;
  if (session.action === "edge" && !ring)
    throw Error("Zuerst eine geschlossene Konturkante auswählen.");
  const edge = ring ? prepareSessionContourEdge(session, ring) : null;
  const target = Object.freeze({ ...session.target }),
    anchor = Object.freeze({ ...session.anchor });
  const replacedIds = Object.freeze([line.id]);
  function resolve(current: Project, selection: ElementTarget | null, point: Point) {
    if (current !== source || selection?.id !== target.id || selection.kind !== target.kind)
      throw Error("Bearbeitungskontext geändert.");
    let points: Point[];
    if (edge) {
      const contour = edge.edit(point);
      points = [...contour, { ...contour[0]! }];
    } else {
      const delta = { x: point.x - anchor.x, y: point.y - anchor.y };
      if (!Number.isFinite(delta.x) || !Number.isFinite(delta.y))
        throw Error("Ungültige Zielposition.");
      points = replacePathVertex(
        line!.points,
        index!,
        translatePoint(line!.points[index!]!, delta),
      );
    }
    const changed = { ...line!, points };
    validateLineGeometry(changed);
    points.forEach(Object.freeze);
    Object.freeze(points);
    return Object.freeze(changed);
  }
  return Object.freeze({
    evaluate(current, selection, point) {
      const changed = resolve(current, selection, point);
      const geometry = {
        storey: {
          ...level,
          walls: [],
          windows: [],
          wallJoins: [],
          wallTJunctions: [],
          references: [],
          hatches: [],
          lines: [changed],
        },
        assets: [],
      };
      return {
        geometry,
        replacedIds,
        storeyPatches: [{ storeyId: level.id, geometry, replacedIds }],
      };
    },
    materialize(current, selection, point) {
      const changed = resolve(current, selection, point);
      return replaceStorey(base, {
        ...level,
        lines: level.lines!.map((l) => (l.id === changed.id ? changed : l)),
      });
    },
  } satisfies PreparedDirectEditPreview);
}
