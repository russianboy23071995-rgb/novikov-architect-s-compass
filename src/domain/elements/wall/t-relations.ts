import { storeyOpenings } from "./openings.ts";
import { assertSameWallBase } from "./heights.ts";
import { storeyOf, replaceStorey } from "../../storeys/access.ts";
import type { WallGeometry } from "../../project/geometry-scope.ts";
import { validateCornerTContact } from "./corner-t-contact.ts";
import type { Point, Project } from "../../project/schema.ts";
import { inspectTPair } from "./t-pair.ts";
import { coordinatesCompatible, pointsCompatible } from "../../../geometry/tolerances/model.ts";
import { validateSimplePolygon } from "../../../geometry/polygons/simple-polygon.ts";

export type TJunction = Project["storeys"][number]["wallTJunctions"][number];

/** Strict persisted relationships: loading never repairs or discovers neighbours. */
export function tConnectionContours(
  project: WallGeometry,
  cornerContours: ReadonlyMap<string, Point[]>,
) {
  const walls = new Map(storeyOf(project).walls.map((w) => [w.id, w]));
  // Each axis end takes at most one join: a corner or one T. A wall may carry Ts at both ends,
  // a T and a corner, and be host and incoming at once (user decision 26.10.2026,
  // docs/WALL_JUNCTIONS.md); every junction trims only its own end of the ring.
  const end = (wallId: string, endpoint: number) => `${wallId}:${endpoint}`;
  const occupied = new Set(
    storeyOf(project).wallJoins.flatMap((j) => [
      end(j.first.wallId, j.first.endpoint),
      end(j.second.wallId, j.second.endpoint),
    ]),
  );
  const pairs = new Set<string>();
  const contacts = new Map<string, { side: number; min: number; max: number }[]>();
  const contours = new Map<string, { x: number; y: number }[]>();
  for (const relation of storeyOf(project).wallTJunctions) {
    const host = walls.get(relation.hostWallId),
      incoming = walls.get(relation.incoming.wallId);
    if (!host || !incoming || host.id === incoming.id)
      throw new Error("Ungültige T-Verbindung: Wände fehlen oder sind identisch.");
    const incomingEnd = end(incoming.id, relation.incoming.endpoint);
    if (occupied.has(incomingEnd))
      throw new Error("Ein Wandende darf nur einen Anschluss haben (Ecke oder T-Anschluss).");
    if (pairs.has(`${incoming.id}>${host.id}`))
      throw new Error("Zwei Wände dürfen nicht gegenseitig T-angeschlossen sein.");
    assertSameWallBase(host, incoming);
    occupied.add(incomingEnd);
    pairs.add(`${host.id}>${incoming.id}`);
    const result = inspectTPair(
      host,
      { wall: incoming, endpoint: relation.incoming.endpoint },
      storeyOpenings(storeyOf(project)),
    );
    validateCornerTContact(
      project,
      host,
      result.geometry.incoming.points,
      result.geometry.contact,
      cornerContours,
    );
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
    // A host keeps its ring (its own trims stay); the incoming wall takes this trim at one end.
    if (!contours.has(host.id))
      contours.set(host.id, cornerContours.get(host.id) ?? result.geometry.host.points);
    const base = contours.get(incoming.id) ?? cornerContours.get(incoming.id);
    const trimmed = result.geometry.incoming.points;
    if (!base) contours.set(incoming.id, trimmed);
    else {
      const ring = base.map((p) => ({ ...p }));
      for (const index of relation.incoming.endpoint === 0 ? [0, 3] : [1, 2])
        ring[index] = trimmed[index]!;
      const checked = validateSimplePolygon(ring);
      if (!checked.valid || checked.signedArea <= 0)
        throw new Error("Ungültige Anschlusskontur der Nebenwand.");
      contours.set(incoming.id, ring);
    }
  }
  return contours;
}

/** Explicit edit intent distinguishes translation from changing a host end. */
export function reconcileTJunctions(
  project: Project,
  changedId: string,
  intent: "move" | "reshape",
): Project {
  const relations = storeyOf(project).wallTJunctions.filter((relation) => {
    if (relation.hostWallId !== changedId && relation.incoming.wallId !== changedId) return true;
    if (intent === "move") return false;
    const host = storeyOf(project).walls.find((w) => w.id === relation.hostWallId)!;
    const incoming = storeyOf(project).walls.find((w) => w.id === relation.incoming.wallId)!;
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
  return { ...replaceStorey(project, { ...storeyOf(project), wallTJunctions: relations }) };
}
