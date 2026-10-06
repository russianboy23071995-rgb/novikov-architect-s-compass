import type { Project } from "../../project/schema.ts";
import { inspectTPair } from "./t-pair.ts";
import { coordinatesCompatible, pointsCompatible } from "../../../geometry/tolerances/model.ts";

export type TJunction = Project["storey"]["wallTJunctions"][number];

/** Strict persisted relationships: loading never repairs or discovers neighbours. */
export function tConnectionContours(project: Project) {
  const walls = new Map(project.storey.walls.map((w) => [w.id, w]));
  const cornerWalls = new Set(
    project.storey.wallJoins.flatMap((j) => [j.first.wallId, j.second.wallId]),
  );
  const incomingIds = new Set<string>();
  const hostIds = new Set(project.storey.wallTJunctions.map((r) => r.hostWallId));
  const contacts = new Map<string, { side: number; min: number; max: number }[]>();
  const contours = new Map<string, { x: number; y: number }[]>();
  for (const relation of project.storey.wallTJunctions) {
    const host = walls.get(relation.hostWallId),
      incoming = walls.get(relation.incoming.wallId);
    if (!host || !incoming || host.id === incoming.id)
      throw new Error("Ungültige T-Verbindung: Wände fehlen oder sind identisch.");
    if (cornerWalls.has(host.id) || cornerWalls.has(incoming.id))
      throw new Error(
        "Eine beteiligte Wand besitzt einen Eckanschluss. Kombinationen aus Ecke und T sind noch nicht unterstützt.",
      );
    if (incomingIds.has(incoming.id) || hostIds.has(incoming.id))
      throw new Error(
        "Eine Nebenwand darf vorerst nur einen T-Anschluss haben und nicht zugleich Hauptwand sein.",
      );
    incomingIds.add(incoming.id);
    const result = inspectTPair(
      host,
      { wall: incoming, endpoint: relation.incoming.endpoint },
      project.storey.windows,
    );
    if (result.openings.some((o) => o.status === "overlapping"))
      throw new Error("Fenster überschneidet den T-Anschluss. Berührung ist erlaubt.");
    const dx = host.end.x - host.start.x,
      dy = host.end.y - host.start.y;
    const length = Math.hypot(dx, dy);
    const anchor = relation.incoming.endpoint === 0 ? incoming.start : incoming.end;
    const far = relation.incoming.endpoint === 0 ? incoming.end : incoming.start;
    const side = Math.sign(dx * (far.y - anchor.y) - dy * (far.x - anchor.x));
    const positions = result.geometry.contact.map(
      (p) => ((p.x - host.start.x) * dx + (p.y - host.start.y) * dy) / length,
    );
    const contact = { side, min: Math.min(...positions), max: Math.max(...positions) };
    const previous = contacts.get(host.id) ?? [];
    if (
      previous.some((c) => {
        const overlap = Math.min(c.max, contact.max) - Math.max(c.min, contact.min);
        return c.side === side && overlap > 0 && !coordinatesCompatible(overlap, 0);
      })
    )
      throw new Error("T-Anschlüsse auf derselben Wandseite dürfen sich nicht überschneiden.");
    previous.push(contact);
    contacts.set(host.id, previous);
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
