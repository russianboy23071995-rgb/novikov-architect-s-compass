// Archicad acceptance of walls trimmed at a roof (docs/TRIMMEN_L04B.md, L04b): the roof
// acceptance house with all OG walls trimmed at the OG roof – eave wall, two inclined gables
// and the back wall raised up to the roof underside. Built through the normal actions.
import { trimWallsToRoof } from "../src/application/walls/roof-trim.ts";
import type { Project } from "../src/domain/project/schema.ts";
import { roofAcceptanceProject } from "./roof-ifc-acceptance.ts";

export function trimAcceptanceProject(): Project {
  const p = roofAcceptanceProject();
  const og = p.storeys.find((s) => s.id === "og")!;
  return trimWallsToRoof(
    p,
    og.walls.map((w) => w.id),
    "og-dach",
  );
}
