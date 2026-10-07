import { imageReferenceCorners } from "./image-reference.ts";
import type { Project, Point } from "../../domain/project/schema.ts";
import type { ElementTarget } from "../../application/selection/target.ts";
import { connectedWallContours } from "../../domain/elements/wall/connections.ts";
import { wallBody } from "../../domain/elements/wall/body.ts";
export type SelectionShape = { target: ElementTarget; points: readonly Point[] };
/** World-space plan geometry; contains no selection state or gesture rules. */
export function planSelectionShapes(project: Project): SelectionShape[] {
  const contours = connectedWallContours(project);
  const walls = new Map(project.storey.walls.map((w) => [w.id, w]));
  return [
    ...project.storey.references.map((r) => ({
      target: { kind: "reference" as const, id: r.id },
      points: imageReferenceCorners(
        r,
        project.assets.find((a) => a.id === r.assetId)!,
      ),
    })),
    ...project.storey.walls.map((w) => ({
      target: { kind: "wall" as const, id: w.id },
      points: contours.get(w.id) ?? wallBody(w).corners,
    })),
    ...project.storey.windows.map((w) => {
      const host = walls.get(w.wallId)!;
      const length = Math.hypot(host.end.x - host.start.x, host.end.y - host.start.y);
      const at = (d: number) => ({
        x: host.start.x + ((host.end.x - host.start.x) * d) / length,
        y: host.start.y + ((host.end.y - host.start.y) * d) / length,
      });
      return {
        target: { kind: "window" as const, id: w.id },
        points: wallBody({
          ...host,
          start: at(w.position * length - w.width / 2),
          end: at(w.position * length + w.width / 2),
        }).corners,
      };
    }),
    ...(project.storey.lines ?? []).map((l) => ({
      target: { kind: "line" as const, id: l.id },
      points: l.points,
    })),
    ...project.storey.hatches.map((h) => ({
      target: { kind: "hatch" as const, id: h.id },
      points: h.points,
    })),
  ];
}
/** A rectangle is convex: containing every vertex contains every straight edge too. */
export function enclosedTargets(
  shapes: readonly SelectionShape[],
  a: Point,
  b: Point,
): ElementTarget[] {
  if (![a.x, a.y, b.x, b.y].every(Number.isFinite)) return [];
  const minX = Math.min(a.x, b.x),
    maxX = Math.max(a.x, b.x),
    minY = Math.min(a.y, b.y),
    maxY = Math.max(a.y, b.y);
  return shapes
    .filter(
      (s) =>
        s.points.length > 0 &&
        s.points.every((p) => p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY),
    )
    .map((s) => s.target);
}
