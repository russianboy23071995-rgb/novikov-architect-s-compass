import { validateLike } from "../../domain/project/owned-snapshot.ts";
import { storeyOf, replaceStorey } from "../../domain/storeys/access.ts";
import type { DrawingLine, Project } from "../../domain/project/schema.ts";

type Creation<T extends { layerId: string }> = Omit<T, "layerId"> & { layerId?: string };

/** Line creation and editing, moved unchanged from lib/bim/model.ts (25.10.2026). */
export function addLine(project: Project, line: Creation<DrawingLine>): Project {
  return validateLike(project, {
    ...replaceStorey(project, {
      ...storeyOf(project),
      lines: [
        ...(storeyOf(project).lines ?? []),
        { layerId: project.defaultLayerIds.line, ...line },
      ],
    }),
  });
}

export function updateLine(
  project: Project,
  lineId: string,
  changes: Partial<Omit<DrawingLine, "id">>,
): Project {
  if (!storeyOf(project).lines?.some((line) => line.id === lineId))
    throw new Error(`Unknown line: ${lineId}`);
  return validateLike(project, {
    ...replaceStorey(project, {
      ...storeyOf(project),
      lines: storeyOf(project).lines!.map((line) =>
        line.id === lineId ? { ...line, ...changes, id: line.id } : line,
      ),
    }),
  });
}

/** Which end moves when a segment gets a new length (S3): its end, its start, or both evenly. */
export type LengthDirection = "end" | "start" | "both";

/**
 * New length of one segment of a line (docs/LINIEN.md, S3): the segment keeps its direction;
 * the end, the start or both ends move, and the neighbouring segments follow the moved points.
 * A closed polyline moves its repeated first point along with the first one.
 */
export function setLineSegmentLength(
  project: Project,
  lineId: string,
  segment: number,
  length: number,
  direction: LengthDirection,
): Project {
  const line = storeyOf(project).lines?.find((l) => l.id === lineId);
  if (!line) throw new Error(`Unknown line: ${lineId}`);
  if (!Number.isFinite(length) || length <= 1e-6)
    throw new Error("Die Länge muss größer als null sein.");
  const points = line.points;
  const a = points[segment],
    b = points[segment + 1];
  if (!a || !b) throw new Error("Unbekannter Linienabschnitt.");
  const current = Math.hypot(b.x - a.x, b.y - a.y);
  if (current <= 1e-9) throw new Error("Ein Abschnitt ohne Länge hat keine Richtung.");
  const ux = (b.x - a.x) / current,
    uy = (b.y - a.y) / current;
  const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  const start =
    direction === "start"
      ? { x: b.x - ux * length, y: b.y - uy * length }
      : direction === "both"
        ? { x: mid.x - (ux * length) / 2, y: mid.y - (uy * length) / 2 }
        : a;
  const end =
    direction === "end"
      ? { x: a.x + ux * length, y: a.y + uy * length }
      : direction === "both"
        ? { x: mid.x + (ux * length) / 2, y: mid.y + (uy * length) / 2 }
        : b;
  const last = points.length - 1;
  const closed =
    points.length > 3 && points[0]!.x === points[last]!.x && points[0]!.y === points[last]!.y;
  const moved = points.map((p, i) => {
    if (i === segment) return start;
    if (i === segment + 1) return end;
    if (closed && i === last && segment === 0) return start;
    if (closed && i === 0 && segment + 1 === last) return end;
    return p;
  });
  return updateLine(project, lineId, { points: moved });
}
