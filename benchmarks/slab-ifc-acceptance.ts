// Small two-storey house for the Archicad acceptance of ceiling slabs (docs/SLAB_ELEMENT.md,
// Teil B2), built through the normal application actions: EG 3,00 m with a rectangular ceiling
// slab 0,20 m, OG 2,80 m with an L-shaped ceiling slab 0,25 m. Walls end at the slab underside.
import { createProject } from "../src/application/projects/create.ts";
import { addWall } from "../src/application/walls/actions.ts";
import { addWindow } from "../src/application/windows/actions.ts";
import { addSlab } from "../src/application/slabs/actions.ts";
import { addStorey, renameStorey, setStoreyHeight } from "../src/application/storeys/actions.ts";
import { selectWorkingStorey } from "../src/application/storeys/working-storey.ts";
import type { Project } from "../src/domain/project/schema.ts";

export const SLAB_ACCEPTANCE = {
  eg: { height: 3, slab: 0.2 },
  og: { height: 2.8, slab: 0.25 },
} as const;

/** Four walls of an 8 × 6 m rectangle (axes), thickness 0,30 m, joined at the corners. */
function ring(p: Project, prefix: string, height: number): Project {
  const corners = [
    { x: 0, y: 0 },
    { x: 8, y: 0 },
    { x: 8, y: 6 },
    { x: 0, y: 6 },
  ];
  corners.forEach((start, i) => {
    p = addWall(p, {
      id: `${prefix}-w${i + 1}`,
      start,
      end: corners[(i + 1) % 4]!,
      thickness: 0.3,
      height,
    });
  });
  return addWindow(p, {
    id: `${prefix}-f1`,
    wallId: `${prefix}-w1`,
    position: 0.5,
    width: 1.2,
    height: 1.3,
    sillHeight: 0.9,
  });
}

export function slabAcceptanceProject(): Project {
  const { eg, og } = SLAB_ACCEPTANCE;
  let p = createProject("novikov-decken-abnahme", "eg");
  p = setStoreyHeight(p, p, { projectId: p.id, storeyId: "eg", height: eg.height });
  p = renameStorey(p, p, { projectId: p.id, storeyId: "eg", name: "Erdgeschoss" });
  p = ring(p, "eg", eg.height - eg.slab);
  // EG ceiling over the outer wall faces.
  p = addSlab(p, {
    id: "eg-decke",
    points: [
      { x: -0.15, y: -0.15 },
      { x: 8.15, y: -0.15 },
      { x: 8.15, y: 6.15 },
      { x: -0.15, y: 6.15 },
    ],
    thickness: eg.slab,
    topOffset: 0,
  });
  p = addStorey(p, p, {
    projectId: p.id,
    storeyId: "eg",
    side: "above",
    id: "og",
    height: og.height,
  });
  p = selectWorkingStorey(p, p, "og");
  p = ring(p, "og", og.height - og.slab);
  // OG ceiling: L shape, one corner of the plan left open.
  p = addSlab(p, {
    id: "og-decke",
    points: [
      { x: -0.15, y: -0.15 },
      { x: 8.15, y: -0.15 },
      { x: 8.15, y: 3 },
      { x: 4, y: 3 },
      { x: 4, y: 6.15 },
      { x: -0.15, y: 6.15 },
    ],
    thickness: og.slab,
    topOffset: 0,
  });
  return p;
}
