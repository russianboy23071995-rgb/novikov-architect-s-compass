import type { Project } from "../../project/schema.ts";
import type { CornerTarget } from "./corner-openings.ts";
import { resolveIsolatedTPair } from "./t-openings.ts";
import { deriveTPairSolids } from "./t-pair.ts";

/** Public validated entry; internal project validation must use t-pair directly. */
export function deriveTSolids(project: Project, hostId: string, incoming: CornerTarget) {
  const pair = resolveIsolatedTPair(project, hostId, incoming);
  return deriveTPairSolids(pair.host, pair.incoming, pair.windows);
}
