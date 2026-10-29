import { storeyOf } from "../../domain/storeys/access.ts";
import type { Project } from "../../domain/project/schema.ts";
import type { ElementTarget } from "../selection/target.ts";

// Read-only source query shared by edge and offset actions; no geometry mutation.
export function closedContour(project: Project, target: ElementTarget) {
  if (target.kind === "hatch")
    return storeyOf(project).hatches.find((h) => h.id === target.id)?.points ?? null;
  if (target.kind === "slab")
    return storeyOf(project).slabs?.find((s) => s.id === target.id)?.points ?? null;
  if (target.kind === "roof")
    return storeyOf(project).roofs?.find((r) => r.id === target.id)?.points ?? null;
  if (target.kind === "room")
    return storeyOf(project).rooms?.find((r) => r.id === target.id)?.points ?? null;
  if (target.kind !== "line") return null;
  const line = storeyOf(project).lines?.find((l) => l.id === target.id);
  if (!line || line.kind !== "polyline" || line.points.length < 4) return null;
  const a = line.points[0]!,
    b = line.points.at(-1)!;
  return a.x === b.x && a.y === b.y ? line.points.slice(0, -1) : null;
}
