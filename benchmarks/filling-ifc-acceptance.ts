// Archicad trial of window and door sizes (docs/T_IFC_ACCEPTANCE.md, 29.10.2026): one storey,
// 6 × 4 m room (axes), walls 0,30 m thick and 2,80 m high, two windows of different size and one
// door, built through the normal application actions. Exported in three filling variants.
import { createProject } from "../src/application/projects/create.ts";
import { addWall } from "../src/application/walls/actions.ts";
import { addWindow } from "../src/application/windows/actions.ts";
import { addDoor } from "../src/application/doors/actions.ts";
import { renameStorey, setStoreyHeight } from "../src/application/storeys/actions.ts";
import { DOOR_DEFAULTS } from "../src/domain/elements/door/model.ts";
import { connectedWallSolids } from "../src/domain/elements/wall/connections.ts";
import { writeIfc, type IfcFillingOptions } from "../src/interop/ifc/writer.ts";
import type { Project } from "../src/domain/project/schema.ts";

export const FILLING_VARIANTS = [
  ["V1-Platzhalter-schlank", { fillingBody: "thin" }],
  ["V2-Platzhalter-Wandstaerke", { fillingBody: "full" }],
  ["V3-Typ-und-Mengen", { fillingTypes: true }],
] as const satisfies readonly (readonly [string, IfcFillingOptions])[];

export function fillingAcceptanceProject(): Project {
  let p = createProject("novikov-fenster-abnahme", "eg");
  p = setStoreyHeight(p, p, { projectId: p.id, storeyId: "eg", height: 3 });
  p = renameStorey(p, p, { projectId: p.id, storeyId: "eg", name: "Erdgeschoss" });
  const corners = [
    { x: 0, y: 0 },
    { x: 6, y: 0 },
    { x: 6, y: 4 },
    { x: 0, y: 4 },
  ];
  corners.forEach((start, i) => {
    p = addWall(p, {
      id: `w${i + 1}`,
      start,
      end: corners[(i + 1) % 4]!,
      thickness: 0.3,
      height: 2.8,
    });
  });
  p = addWindow(p, {
    id: "fenster-gross",
    wallId: "w1",
    position: 0.3,
    width: 1.2,
    height: 1.35,
    sillHeight: 0.9,
  });
  p = addWindow(p, {
    id: "fenster-klein",
    wallId: "w2",
    position: 0.5,
    width: 0.8,
    height: 1,
    sillHeight: 1.1,
  });
  return addDoor(p, { id: "tuer", wallId: "w3", position: 0.5, ...DOOR_DEFAULTS });
}

/** Same wall profiles as the regular export (lib/bim/ifc.ts), plus one filling variant. */
export function exportFillingVariant(
  project: Project,
  options: IfcFillingOptions,
  timestamp: Date,
): Promise<string> {
  return writeIfc(
    project,
    timestamp,
    new Map(
      project.storeys
        .flatMap((storey) => connectedWallSolids({ storey }))
        .map((w) => [w.wallId, w.localProfile]),
    ),
    undefined,
    options,
  );
}
