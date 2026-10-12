import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { addWall, addWindow, createProject, serializeProject } from "../src/lib/bim/model.ts";
import { previewTConnection } from "../src/application/walls/t-connections.ts";
import { exportIfc } from "../src/lib/bim/ifc.ts";
const directory = process.argv[2];
if (!directory) throw new Error("Output directory required");
await mkdir(directory, { recursive: true });
let p = createProject("two-corner-t-acceptance", "level-01");
for (const wall of [
  { id: "south", start: { x: 0, y: 0 }, end: { x: 6, y: 0 } },
  { id: "east", start: { x: 6, y: 0 }, end: { x: 6, y: 4 } },
  { id: "north", start: { x: 6, y: 4 }, end: { x: 0, y: 4 } },
  { id: "west", start: { x: 0, y: 4 }, end: { x: 0, y: 0 } },
  { id: "partition", start: { x: 3, y: 2 }, end: { x: 3, y: 0 } },
])
  p = addWall(p, { ...wall, thickness: 0.36, height: 2.8, bodyOffset: 0 });
p = addWindow(p, {
  id: "south-window",
  wallId: "south",
  width: 1.2,
  height: 1.35,
  sillHeight: 0.9,
  position: 0.25,
});
await writeFile(join(directory, "before-t.project.json"), serializeProject(p));
p = previewTConnection(p, p, {
  projectId: p.id,
  kind: "connect",
  relation: { hostWallId: "south", incoming: { wallId: "partition", endpoint: 1 } },
});
await writeFile(join(directory, "two-corner-t.project.json"), serializeProject(p));
await writeFile(
  join(directory, "two-corner-t.ifc"),
  await exportIfc(p, new Date("2026-10-06T12:00:00Z")),
);
console.log("Generated closed 6 x 4 m axis rectangle, 5 walls, 4 corners, 1 T, 1 window.");
