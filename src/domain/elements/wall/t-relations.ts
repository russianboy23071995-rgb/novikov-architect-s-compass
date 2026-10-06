import type { Project } from "../../project/schema.ts";
import { inspectTPair } from "./t-pair.ts";
import { coordinatesCompatible, pointsCompatible } from "../../../geometry/tolerances/model.ts";

export type TJunction = Project["storey"]["wallTJunctions"][number];

/** Strict persisted relationships: loading never repairs or discovers neighbours. */
export function tConnectionContours(project: Project) {
  const walls = new Map(project.storey.walls.map((w) => [w.id, w]));
  const occupied = new Set(
    project.storey.wallJoins.flatMap((j) => [j.first.wallId, j.second.wallId]),
  );
  const contours = new Map<string, { x: number; y: number }[]>();
  for (const relation of project.storey.wallTJunctions) {
    const host = walls.get(relation.hostWallId),
      incoming = walls.get(relation.incoming.wallId);
    if (!host || !incoming || host.id === incoming.id)
      throw new Error("Ungültige T-Verbindung: Wände fehlen oder sind identisch.");
    if (occupied.has(host.id) || occupied.has(incoming.id))
      throw new Error(
        "Mehrfachanschlüsse und Kombinationen aus Ecke und T sind noch nicht unterstützt.",
      );
    occupied.add(host.id);
    occupied.add(incoming.id);
    const result = inspectTPair(
      host,
      { wall: incoming, endpoint: relation.incoming.endpoint },
      project.storey.windows,
    );
    if (result.openings.some((o) => o.status === "overlapping"))
      throw new Error("Fenster überschneidet den T-Anschluss. Berührung ist erlaubt.");
    contours.set(host.id, result.geometry.host.points);
    contours.set(incoming.id, result.geometry.incoming.points);
  }
  return contours;
}

/** Explicit edit intent distinguishes translation from changing a host end. */
export function reconcileTJunctions(
  project: Project,
  changedId: string,
  intent: "move" | "reshape",
): Project {
  const relations = project.storey.wallTJunctions.filter((relation) => {
    if (relation.hostWallId !== changedId && relation.incoming.wallId !== changedId) return true;
    if (intent === "move") return false;
    const host = project.storey.walls.find((w) => w.id === relation.hostWallId)!;
    const incoming = project.storey.walls.find((w) => w.id === relation.incoming.wallId)!;
    const anchor = relation.incoming.endpoint === 0 ? incoming.start : incoming.end;
    const dx = host.end.x - host.start.x,
      dy = host.end.y - host.start.y;
    const length = Math.hypot(dx, dy);
    const distance = ((anchor.x - host.start.x) * dx + (anchor.y - host.start.y) * dy) / length;
    const onAxis = {
      x: host.start.x + (dx * distance) / length,
      y: host.start.y + (dy * distance) / length,
    };
    return (
      distance > 0 &&
      distance < length &&
      !coordinatesCompatible(distance, 0) &&
      !coordinatesCompatible(distance, length) &&
      pointsCompatible(anchor, onAxis)
    );
  });
  return { ...project, storey: { ...project.storey, wallTJunctions: relations } };
}
