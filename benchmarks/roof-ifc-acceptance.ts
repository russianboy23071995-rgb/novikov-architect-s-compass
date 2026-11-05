// Archicad acceptance of the roof (docs/ROOF_ELEMENT.md, D5): the slab acceptance house with a
// single-pitch roof over the OG instead of the OG ceiling. The roof rests on the OG walls
// (underside at the wall top on the outer wall face), 0,50 m overhang, 15°, 0,24 m thick,
// horizontal eave (soffit) and perpendicular top edge. Built through the normal actions.
import { addRoof } from "../src/application/roofs/actions.ts";
import { replaceStorey, storeyOf } from "../src/domain/storeys/access.ts";
import { validateProject, type Project } from "../src/domain/project/schema.ts";
import type { Roof } from "../src/domain/elements/roof/model.ts";
import { SLAB_ACCEPTANCE, slabAcceptanceProject } from "./slab-ifc-acceptance.ts";

/** The OG roof; its underside meets the OG wall top (2,55 m) on the outer wall face y = −0,15. */
export function roofAcceptanceRoof(): Omit<Roof, "layerId"> {
  return {
    id: "og-dach",
    points: [
      { x: -0.65, y: -0.65 },
      { x: 8.65, y: -0.65 },
      { x: 8.65, y: 6.65 },
      { x: -0.65, y: 6.65 },
    ],
    referenceLine: { start: { x: -0.15, y: -0.15 }, end: { x: 8.15, y: -0.15 } },
    rise: "left",
    referenceHeight: SLAB_ACCEPTANCE.og.height - SLAB_ACCEPTANCE.og.slab,
    pitch: 15,
    thickness: 0.24,
    eaveCut: "horizontal",
    topCut: "perpendicular",
  };
}

/** EG with its ceiling slab, OG walls and the roof; the OG ceiling slab is left out. */
export function roofAcceptanceProject(): Project {
  let p = slabAcceptanceProject();
  p = validateProject(replaceStorey(p, { ...storeyOf(p), slabs: [] }));
  return addRoof(p, roofAcceptanceRoof());
}
