import { stretchOffset } from "../../geometry/projections/direction.ts";
import { editDirection } from "./snapping.ts";
import { prepareContourInsertion } from "../../geometry/polygons/edit-edge.ts";
import { MAX_HATCH_POINTS } from "../../domain/elements/hatch/model.ts";
import { MAX_SLAB_POINTS } from "../../domain/elements/slab/model.ts";
import { offsetContourPoints, offsetDirection } from "./offset.ts";
import { prepareSessionContourEdge } from "./contour.ts";
import {
  preparePolygonVertexEdit,
  validateSimplePolygon,
} from "../../geometry/polygons/simple-polygon.ts";
import { mergeOntoVertex } from "../../geometry/polygons/vertex-merge.ts";
import { translatePoint } from "../../geometry/primitives/point.ts";
import { createProjectSnapshot } from "../../domain/project/owned-snapshot.ts";
import { storeyOf, replaceStorey } from "../../domain/storeys/access.ts";
import type { EditSession } from "./session.ts";
import type { Project, Point } from "../../domain/project/schema.ts";
import type { Hatch } from "../../domain/elements/hatch/model.ts";
import type { Slab } from "../../domain/elements/slab/model.ts";
import type { ElementTarget } from "../selection/target.ts";
import type { PreparedDirectEditPreview } from "./prepared-preview.ts";

/** An owned validated snapshot fixes all non-contour fields. Point/edge previews
 * use changed-edge checks; offset and insertion retain full target contour validation.
 * Shared by hatches and ceiling slab outlines (docs/SLAB_ELEMENT.md, E1); the slab patch
 * carries the storey height so the 3D preview places the slab at its level.
 */
export function prepareHatchContourPreview(session: EditSession): PreparedDirectEditPreview {
  const kind = session.target.kind;
  if (
    (kind !== "hatch" && kind !== "slab") ||
    !["point", "stretch", "edge", "offset", "insert"].includes(session.action)
  )
    throw Error("Unsupported contour preview");
  const source = session.base,
    base = createProjectSnapshot(source),
    level = storeyOf(base);
  const items: readonly { id: string; points: readonly Point[] }[] =
    kind === "slab" ? (level.slabs ?? []) : level.hatches;
  const hatch = items.find((h) => h.id === session.target.id);
  const index = session.index ?? (session.action === "offset" ? 0 : null);
  if (!hatch || index === null || !Number.isInteger(index) || !hatch.points[index])
    throw Error("Invalid contour grip");
  if (
    session.action === "insert" &&
    hatch.points.length >= (kind === "slab" ? MAX_SLAB_POINTS : MAX_HATCH_POINTS)
  )
    throw Error(
      kind === "slab"
        ? "Maximale Anzahl der Deckenpunkte erreicht."
        : "Maximale Anzahl der Schraffurpunkte erreicht.",
    );
  const ring = hatch.points as Point[];
  const insert = session.action === "insert" ? prepareContourInsertion(ring, index) : null;
  const edge = session.action === "edge" ? prepareSessionContourEdge(session, ring) : null;
  const contour = ["point", "stretch"].includes(session.action)
    ? preparePolygonVertexEdit(ring, [index])
    : null;
  const target = Object.freeze({ ...session.target });
  const anchor = Object.freeze({ ...session.anchor });
  const pinned: EditSession = Object.freeze({ ...session, base, target, anchor });
  const stretchDirection = session.action === "stretch" ? editDirection(pinned) : null;
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
      points.forEach(Object.freeze);
    } else if (edge) {
      points = edge.edit(point);
      points.forEach(Object.freeze);
    } else {
      const delta = stretchDirection
        ? stretchOffset(point, anchor, stretchDirection)
        : { x: point.x - anchor.x, y: point.y - anchor.y };
      if (!Number.isFinite(delta.x) || !Number.isFinite(delta.y))
        throw Error("Ungueltige Zielposition.");
      const moved = translatePoint(hatch!.points[index!]!, delta);
      // A corner placed on another corner is deleted (POLYGON_REGELN Regel 2); the shorter
      // ring then needs the full check instead of the prepared changed-edge check.
      const merged = mergeOntoVertex(hatch!.points, index!, moved, "ring");
      if (merged) merged.forEach(Object.freeze);
      points = merged ?? hatch!.points.map((p, i) => (i === index ? Object.freeze(moved) : p));
      const result = merged ? validateSimplePolygon(points) : contour!.validate(points);
      if (!result.valid)
        throw Error(`Invalid contour: ${result.reason} (${result.indices.join(", ")})`);
    }
    Object.freeze(points);
    return Object.freeze({ ...hatch!, points }) as typeof hatch & { id: string };
  }
  return Object.freeze({
    evaluate(current, selection, point) {
      const changed = resolve(current, selection, point);
      const geometry = {
        storey:
          kind === "slab"
            ? {
                ...level,
                walls: [],
                windows: [],
                doors: [],
                lines: [],
                wallJoins: [],
                wallTJunctions: [],
                references: [],
                hatches: [],
                slabs: [changed as Slab],
              }
            : {
                ...level,
                walls: [],
                windows: [],
                lines: [],
                wallJoins: [],
                wallTJunctions: [],
                references: [],
                hatches: [changed as Hatch],
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
      return replaceStorey(
        base,
        kind === "slab"
          ? {
              ...level,
              slabs: (level.slabs ?? []).map((s) => (s.id === changed.id ? (changed as Slab) : s)),
            }
          : {
              ...level,
              hatches: level.hatches.map((h) => (h.id === changed.id ? (changed as Hatch) : h)),
            },
      );
    },
  } satisfies PreparedDirectEditPreview);
}
