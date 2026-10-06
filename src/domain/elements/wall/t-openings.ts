import { validateProject, type Project } from "../../project/schema.ts";
import type { CornerTarget } from "./corner-openings.ts";
import { inspectTPair } from "./t-pair.ts";

/** Public boundary: validates/copies the complete snapshot before resolving IDs. */
export function resolveIsolatedTPair(input: Project, hostId: string, incoming: CornerTarget) {
  const project = validateProject(input);
  const host = project.storey.walls.find((w) => w.id === hostId);
  const wall = project.storey.walls.find((w) => w.id === incoming.wallId);
  if (!host || !wall) throw new Error("Beide Wände müssen im aktuellen Modell vorhanden sein.");
  const ids = new Set([hostId, wall.id]);
  if (project.storey.wallJoins.some((j) => ids.has(j.first.wallId) || ids.has(j.second.wallId)))
    throw new Error("T-Vorschau unterstützt zunächst nur Wände ohne weitere Anschlüsse.");
  return { host, incoming: { wall, endpoint: incoming.endpoint }, windows: project.storey.windows };
}

export function inspectTOpenings(input: Project, hostId: string, incoming: CornerTarget) {
  const pair = resolveIsolatedTPair(input, hostId, incoming);
  return inspectTPair(pair.host, pair.incoming, pair.windows);
}
