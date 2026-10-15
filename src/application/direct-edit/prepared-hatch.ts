import { prepareContourInsertion } from "../../geometry/polygons/edit-edge.ts";
import { MAX_HATCH_POINTS } from "../../domain/elements/hatch/model.ts";
import { offsetContourPoints, offsetDirection } from "./offset.ts";
import { prepareSessionContourEdge } from "./contour.ts";
import {
  preparePolygonVertexEdit,
  validateSimplePolygon,
} from "../../geometry/polygons/simple-polygon.ts";
import { translatePoint } from "../../geometry/primitives/point.ts";
import { createProjectSnapshot } from "../../domain/project/owned-snapshot.ts";
import { storeyOf, replaceStorey } from "../../domain/storeys/access.ts";
import type { EditSession } from "../../lib/bim/direct-edit.ts";
import type { Project, Point } from "../../domain/project/schema.ts";
import type { ElementTarget } from "../selection/target.ts";
import type { PreparedDirectEditPreview } from "./prepared-preview.ts";

/** An owned validated snapshot fixes all non-contour fields. Point/edge previews
 * use changed-edge checks; offset and insertion retain full target contour validation.
 */
export function prepareHatchContourPreview(session: EditSession): PreparedDirectEditPreview {
  if (
    session.target.kind !== "hatch" ||
    !["point", "edge", "offset", "insert"].includes(session.action)
  )
    throw Error("Unsupported hatch preview");
  const source = session.base,
    base = createProjectSnapshot(source),
    level = storeyOf(base);
  const hatch = level.hatches.find((h) => h.id === session.target.id);
  const index = session.index ?? (session.action === "offset" ? 0 : null);
  if (!hatch || index === null || !Number.isInteger(index) || !hatch.points[index])
    throw Error("Invalid hatch grip");
  if (session.action === "insert" && hatch.points.length >= MAX_HATCH_POINTS)
    throw Error("Maximale Anzahl der Schraffurpunkte erreicht.");
  const insert = session.action === "insert" ? prepareContourInsertion(hatch.points, index) : null;
  const edge = session.action === "edge" ? prepareSessionContourEdge(session, hatch.points) : null;
  const contour =
    session.action === "point" ? preparePolygonVertexEdit(hatch.points, [index]) : null;
  const target = Object.freeze({ ...session.target });
  const anchor = Object.freeze({ ...session.anchor });
  const pinned: EditSession = Object.freeze({ ...session, base, target, anchor });
  const offset = session.action === "offset";
  if (offset) offsetDirection(pinned); // Prepare the existing geometry once; reject unsupported contours now.
  const replacedIds = Object.freeze([hatch.id]);
  function resolve(current: Project, selection: ElementTarget | null, point: Point) {
    if (current !== source || selection?.id !== target.id || selection.kind !== target.kind)
      throw Error("Bearbeitungskontext geaendert.");
    let points: Point[];
    if (insert) {
      points = insert(point);
      points.forEach(Object.freeze);
    } else if (offset) {
      points = offsetContourPoints(pinned, point);
      const result = validateSimplePolygon(points);
      if (!result.valid)
        throw Error(`Invalid hatch contour: ${result.reason} (${result.indices.join(", ")})`);
      points.forEach(Object.freeze);
    } else if (edge) {
      points = edge.edit(point);
      points.forEach(Object.freeze);
    } else {
      const delta = { x: point.x - anchor.x, y: point.y - anchor.y };
      if (!Number.isFinite(delta.x) || !Number.isFinite(delta.y))
        throw Error("Ungueltige Zielposition.");
      points = hatch!.points.map((p, i) =>
        i === index ? Object.freeze(translatePoint(p, delta)) : p,
      );
      const result = contour!.validate(points);
      if (!result.valid)
        throw Error(`Invalid hatch contour: ${result.reason} (${result.indices.join(", ")})`);
    }
    Object.freeze(points);
    return Object.freeze({ ...hatch!, points });
  }
  return Object.freeze({
    evaluate(current, selection, point) {
      const changed = resolve(current, selection, point);
      const geometry = {
        storey: {
          ...level,
          walls: [],
          windows: [],
          lines: [],
          wallJoins: [],
          wallTJunctions: [],
          references: [],
          hatches: [changed],
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
      // Legacy 2D consumer still needs a Project-shaped derived view. Reuse every
      // unaffected entity; validation/publication remains exclusively at fullEdit.
      return replaceStorey(base, {
        ...level,
        hatches: level.hatches.map((h) => (h.id === changed.id ? changed : h)),
      });
    },
  } satisfies PreparedDirectEditPreview);
}
