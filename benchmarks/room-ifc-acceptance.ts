// Archicad acceptance of rooms as IfcSpace (docs/ROOM_ELEMENT.md, R4): the roof acceptance
// house with one room per storey, taken from the walls like the room tool's click. EG: room
// "Wohnen" under the EG ceiling with floor build-up; OG: room "Dachraum" under the pitched roof
// with an extra height line 2,30 m to the outer roof skin. Built through the normal actions.
import { addRoom } from "../src/application/rooms/actions.ts";
import { enclosedRoomOutline } from "../src/application/rooms/enclosure.ts";
import { selectWorkingStorey } from "../src/application/storeys/working-storey.ts";
import { clearHeightLine, defaultHeightLines } from "../src/domain/elements/room/height-line.ts";
import type { Project } from "../src/domain/project/schema.ts";
import { roofAcceptanceProject } from "./roof-ifc-acceptance.ts";

export function roomAcceptanceProject(): Project {
  const base = roofAcceptanceProject();
  let p = selectWorkingStorey(base, base, "eg");
  p = addRoom(p, {
    id: "eg-wohnen",
    points: enclosedRoomOutline(p, { x: 4, y: 3 }),
    name: "Wohnen",
    floorBuildUp: 0.12,
  });
  p = selectWorkingStorey(p, p, "og");
  return addRoom(p, {
    id: "og-dachraum",
    points: enclosedRoomOutline(p, { x: 4, y: 3 }),
    name: "Dachraum",
    heightLines: [
      ...defaultHeightLines(),
      { ...clearHeightLine("h3", 2.3), upper: "outerSkin", color: "#dc2626" },
    ],
  });
}
