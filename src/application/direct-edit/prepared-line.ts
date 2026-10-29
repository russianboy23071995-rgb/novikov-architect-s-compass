import { stretchOffset } from "../../geometry/projections/direction.ts";
import { editDirection } from "./snapping.ts";
import { MAX_LINE_POINTS } from "../../domain/project/schema.ts";
import { prepareContourInsertion } from "../../geometry/polygons/edit-edge.ts";
import { offsetContourPoints, offsetDirection } from "./offset.ts";
import { closedContour, prepareSessionContourEdge } from "./contour.ts";
import { replacePathVertex, translatePoint } from "../../geometry/primitives/point.ts";
import { createProjectSnapshot } from "../../domain/project/owned-snapshot.ts";
import { validateLineGeometry } from "../../domain/project/geometry-validation.ts";
import { storeyOf, replaceStorey } from "../../domain/storeys/access.ts";
import type { EditSession } from "./session.ts";
import type { Project, Point } from "../../domain/project/schema.ts";
import type { ElementTarget } from "../selection/target.ts";
import type { PreparedDirectEditPreview } from "./prepared-preview.ts";

/** Snapshot validates fixed style/scope fields once. Every target retains all line geometry rules. */
export function prepareLinePreview(session: EditSession): PreparedDirectEditPreview {
  if (
    session.target.kind !== "line" ||
    !["point", "stretch", "edge", "offset", "insert"].includes(session.action)
  )
    throw Error("Unsupported line preview");
  const source = session.base,
    base = createProjectSnapshot(source),
    level = storeyOf(base);
  const line = level.lines?.find((l) => l.id === session.target.id),
    index = session.index ?? (session.action === "offset" ? 0 : null);
  if (!line || index === null || !Number.isInteger(index) || !line.points[index])
    throw Error("Invalid line grip");
  const ring = ["edge", "insert"].includes(session.action)
    ? closedContour(base, session.target)
    : null;
  if (["edge", "insert"].includes(session.action) && !ring)
    throw Error("Zuerst eine geschlossene Konturkante auswählen.");
  const edge = session.action === "edge" && ring ? prepareSessionContourEdge(session, ring) : null;
  if (session.action === "insert" && line.points.length >= MAX_LINE_POINTS)
    throw Error("Maximale Anzahl der Linienpunkte erreicht.");
  const insert = session.action === "insert" && ring ? prepareContourInsertion(ring, index) : null;
  const target = Object.freeze({ ...session.target }),
    anchor = Object.freeze({ ...session.anchor });
  const pinned: EditSession = Object.freeze({ ...session, base, target, anchor });
  const stretchDirection = session.action === "stretch" ? editDirection(pinned) : null;
  const offset = session.action === "offset";
  if (offset) offsetDirection(pinned);
  const replacedIds = Object.freeze([line.id]);
  function resolve(current: Project, selection: ElementTarget | null, point: Point) {
    if (current !== source || selection?.id !== target.id || selection.kind !== target.kind)
      throw Error("Bearbeitungskontext geändert.");
    let points: Point[];
    if (insert) {
      const contour = insert(point);
      points = [...contour, { ...contour[0]! }];
    } else if (offset) {
      const contour = offsetContourPoints(pinned, point);
      points = [...contour, { ...contour[0]! }];
    } else if (edge) {
      const contour = edge.edit(point);
      points = [...contour, { ...contour[0]! }];
    } else {
      const delta = stretchDirection
        ? stretchOffset(point, anchor, stretchDirection)
        : { x: point.x - anchor.x, y: point.y - anchor.y };
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
