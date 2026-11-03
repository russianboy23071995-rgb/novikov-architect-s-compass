import type { Project } from "../../domain/project/schema.ts";
import type { Point2 } from "../../geometry/primitives/point.ts";
import type { SnapReference } from "../../constraints/snapping/engine.ts";
import type { SnapSegment } from "../../constraints/snapping/segment-references.ts";
import {
  combineSourceIndexes,
  createPrimitiveSourceIndex,
} from "../../constraints/snapping/local-source-index.ts";
import { storeyOf } from "../../domain/storeys/access.ts";
import { allStoreyElements } from "../../domain/elements/registry.ts";
import type { DrawingMask } from "../../domain/elements/drawing/model.ts";
import {
  pathSnapPart,
  projectSnapParts,
  ringSnapPart,
  type SnapPart,
} from "./project-references.ts";
import type { LocalSnapSources } from "./local-sources.ts";

/**
 * A drawing placed on a layout, as the snap engine needs it (docs/LAYOUTBUCH.md, user wish
 * 03.11.2026): the drawing stays read only, but what it shows can be snapped to while drawing on
 * the layout, e.g. a hatch around a wall. Its content is the shown state, also when the layout
 * waits for an update.
 */
export type PlacedSnapDrawing = {
  id: string;
  position: Point2;
  mask: DrawingMask;
  center: Point2;
  denominator: number;
  content:
    | { kind: "plan"; source: Project; hiddenLayerIds: readonly string[] }
    /** Section or elevation: cut outlines, open cut pieces and visible edges (drawing x, y). */
    | {
        kind: "section";
        drawing: object;
        rings: readonly (readonly Point2[])[];
        paths: readonly (readonly Point2[])[];
      };
};

// Snap parts of what a drawing shows, in its own coordinates; per shown content object and, for
// a plan, per set of hidden layers.
const contentParts = new WeakMap<object, Map<string, readonly SnapPart[]>>();
function partsOf(content: PlacedSnapDrawing["content"]): readonly SnapPart[] {
  const key = content.kind === "plan" ? content.source : content.drawing;
  const layers = content.kind === "plan" ? [...content.hiddenLayerIds].sort().join("|") : "";
  let byLayers = contentParts.get(key);
  if (!byLayers) contentParts.set(key, (byLayers = new Map()));
  let parts = byLayers.get(layers);
  if (parts) return parts;
  if (content.kind === "plan") {
    // Elements on layers the document hides do not snap; they are not drawn either.
    const hidden = new Set(content.hiddenLayerIds);
    const hiddenIds = new Set(
      allStoreyElements(storeyOf(content.source))
        .filter((e) => hidden.has(e.layerId))
        .map((e) => e.id),
    );
    parts = projectSnapParts(content.source)
      .flat()
      .filter((p) => !p.references.some((r) => hiddenIds.has(r.entityId)));
  } else
    parts = [
      ...content.rings.map((ring, i) => ringSnapPart(`ring-${i}`, ring)),
      ...content.paths.map((path, i) => pathSnapPart(`path-${i}`, path)),
    ];
  byLayers.set(layers, parts);
  return parts;
}

/**
 * Snap sources of the drawings placed on a layout, on the paper: every point of their content
 * moved by the placement (position, scale, centre) and kept only inside the mask. The ids name
 * the snappable entities, `<drawing>/<element>`, which belong to no layout element. Null when
 * nothing snaps.
 */
export function placedDrawingSnap(
  drawings: readonly PlacedSnapDrawing[],
): { sources: LocalSnapSources; ids: ReadonlySet<string> } | null {
  const ids = new Set<string>();
  const references: SnapReference[] = [];
  const segments: SnapSegment[] = [];
  for (const drawing of drawings) {
    const { position, center, denominator, mask } = drawing;
    const at = (p: Point2): Point2 => ({
      x: position.x + (p.x - center.x) / denominator,
      y: position.y + (p.y - center.y) / denominator,
    });
    const inside = (p: Point2) =>
      p.x >= position.x + mask.x0 - 1e-9 &&
      p.x <= position.x + mask.x1 + 1e-9 &&
      p.y >= position.y + mask.y0 - 1e-9 &&
      p.y <= position.y + mask.y1 + 1e-9;
    const moved = new Map<SnapReference, SnapReference>();
    const move = (r: SnapReference): SnapReference => {
      let m = moved.get(r);
      if (!m) {
        m = {
          ...r,
          point: at(r.point),
          entityId: `${drawing.id}/${r.entityId}`,
          ...(r.segment ? { segment: { start: at(r.segment.start), end: at(r.segment.end) } } : {}),
          ...(r.dependencies ? { dependencies: r.dependencies.map(move) } : {}),
        };
        moved.set(r, m);
      }
      return m;
    };
    for (const part of partsOf(drawing.content)) {
      for (const r of part.references) {
        const m = move(r);
        if (!inside(m.point)) continue;
        references.push(m);
        ids.add(m.entityId);
      }
      for (const s of part.segments) {
        const start = at(s.start),
          end = at(s.end);
        // Only edges wholly inside the mask: a cut-off edge would offer points that are not shown.
        if (!inside(start) || !inside(end)) continue;
        const source = move(s.source);
        segments.push({ start, end, source });
        ids.add(source.entityId);
      }
    }
  }
  if (!references.length && !segments.length) return null;
  return {
    sources: combineSourceIndexes([createPrimitiveSourceIndex({ references, segments })]),
    ids,
  };
}
