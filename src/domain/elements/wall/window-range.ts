import type { Project, Wall } from "../../project/schema.ts";
import { wallLength } from "../../project/schema.ts";
import { deriveWallCorner } from "./corner.ts";

/** Centre interval in metres. T junctions deliberately do not restrict openings. */
export function boundedWindowPosition(
  project: Project,
  wall: Wall,
  width: number,
  position: number,
) {
  const length = wallLength(wall);
  if (!Number.isFinite(position) || !Number.isFinite(width) || width <= 0 || width > length)
    throw new Error("Fenster passt nicht in die Wand oder Position ist ungültig.");
  const ux = (wall.end.x - wall.start.x) / length,
    uy = (wall.end.y - wall.start.y) / length;
  let min = width / 2,
    max = length - width / 2;
  for (const join of project.storey.wallJoins) {
    const end = [join.first, join.second].find((e) => e.wallId === wall.id);
    if (!end) continue;
    const resolve = (e: typeof join.first) => ({
      wall: project.storey.walls.find((w) => w.id === e.wallId)!,
      endpoint: e.endpoint,
    });
    const contour = deriveWallCorner(resolve(join.first), resolve(join.second)).walls.find(
      (w) => w.wallId === wall.id,
    )!;
    const a = contour.points[0]!,
      b = contour.points[3]!;
    const distances = [a, b].map((p) => (p.x - wall.start.x) * ux + (p.y - wall.start.y) * uy);
    // Keep strictly inside the seam, including the half-plane numerical tolerance.
    const normalProjection = Math.abs(
      ((b.x - a.x) * uy - (b.y - a.y) * ux) / Math.hypot(b.x - a.x, b.y - a.y),
    );
    const margin = 1e-8 / normalProjection;
    if (end.endpoint === 0) min = Math.max(min, Math.max(...distances) + width / 2 + margin);
    else max = Math.min(max, Math.min(...distances) - width / 2 - margin);
  }
  if (min > max) throw new Error("Kein zulässiger Fensterbereich auf dieser Wand.");
  // Avoid roundoff at strict length checks when converting centre distance to a fraction.
  const inset = Math.min(1e-12 * Math.max(1, length), (max - min) / 2);
  return Math.max((min + inset) / length, Math.min((max - inset) / length, position));
}
