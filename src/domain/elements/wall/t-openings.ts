import { storeyOf, replaceStorey } from "../../storeys/access.ts";
import { validateProject, type Project } from "../../project/schema.ts";
import type { CornerTarget } from "./corner-openings.ts";
import { inspectTPair } from "./t-pair.ts";

/** Public boundary: validates/copies the complete snapshot before resolving IDs. */
export function resolveIsolatedTPair(input: Project, hostId: string, incoming: CornerTarget) {
  const project = validateProject(input);
  const host = storeyOf(project).walls.find((w) => w.id === hostId);
  const wall = storeyOf(project).walls.find((w) => w.id === incoming.wallId);
  if (!host || !wall) throw new Error("Beide Wände müssen im aktuellen Modell vorhanden sein.");
  const ids = new Set([hostId, wall.id]);
  if (
    storeyOf(project).wallTJunctions.some(
      (j) =>
        j.incoming.wallId === hostId || j.incoming.wallId === wall.id || j.hostWallId === wall.id,
    )
  )
    throw new Error("Wände sind bereits durch einen T-Anschluss verbunden.");
  if (storeyOf(project).wallJoins.some((j) => ids.has(j.first.wallId) || ids.has(j.second.wallId)))
    throw new Error("T-Vorschau unterstützt zunächst nur Wände ohne weitere Anschlüsse.");
  if (storeyOf(project).wallTJunctions.some((j) => j.hostWallId === hostId)) {
    validateProject({
      ...replaceStorey(project, {
        ...storeyOf(project),
        wallTJunctions: [...storeyOf(project).wallTJunctions, { hostWallId: hostId, incoming }],
      }),
    });
  }
  return {
    host,
    incoming: { wall, endpoint: incoming.endpoint },
    windows: storeyOf(project).windows,
  };
}

export function inspectTOpenings(input: Project, hostId: string, incoming: CornerTarget) {
  const pair = resolveIsolatedTPair(input, hostId, incoming);
  return inspectTPair(pair.host, pair.incoming, pair.windows);
}
