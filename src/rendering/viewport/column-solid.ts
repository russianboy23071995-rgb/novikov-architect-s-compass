import { columnLevels, columnOutline, type Column } from "../../domain/elements/column/model.ts";

type Vec3 = [number, number, number];
/** A column face in the storey solid; `column` keeps it out of every wall-only path. */
export type ColumnFace = { wallId: string; vertices: Vec3[]; normal: Vec3; column: true };

/**
 * Closed prism of one column (docs/STUETZEN.md): outline extruded from the foot to the top,
 * both relative to the storey floor at `elevation`. Null while a bound top meets an unknown
 * storey height: no invented level.
 */
export function columnBody(
  column: Pick<
    Column,
    "id" | "position" | "shape" | "rotation" | "baseOffset" | "height" | "topBinding"
  >,
  elevation: number,
  storeyHeight: number | null,
): { faces: ColumnFace[]; volume: number } | null {
  const levels = columnLevels(column, storeyHeight);
  if (!levels) return null;
  const bottom = elevation + levels.bottom,
    top = elevation + levels.top;
  const ring = columnOutline(column);
  const centre: Vec3 = [column.position.x, column.position.y, 0];
  const faces: ColumnFace[] = [];
  let area = 0;
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i]!,
      b = ring[(i + 1) % ring.length]!;
    area += (a.x * b.y - b.x * a.y) / 2;
    // Convex outline: a fan from the centre closes top and underside.
    faces.push({
      wallId: column.id,
      vertices: [
        [centre[0], centre[1], top],
        [a.x, a.y, top],
        [b.x, b.y, top],
      ],
      normal: [0, 0, 1],
      column: true,
    });
    faces.push({
      wallId: column.id,
      vertices: [
        [centre[0], centre[1], bottom],
        [b.x, b.y, bottom],
        [a.x, a.y, bottom],
      ],
      normal: [0, 0, -1],
      column: true,
    });
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    faces.push({
      wallId: column.id,
      vertices: [
        [a.x, a.y, bottom],
        [b.x, b.y, bottom],
        [b.x, b.y, top],
        [a.x, a.y, top],
      ],
      normal: [(b.y - a.y) / length, -(b.x - a.x) / length, 0],
      column: true,
    });
  }
  return { faces, volume: area * (top - bottom) };
}
