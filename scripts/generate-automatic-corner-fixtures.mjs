import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { addWall, addWindow, createProject, serializeProject } from "../src/lib/bim/model.ts";
import { moveElement } from "../src/application/direct-edit/transforms.ts";
import { exportIfc } from "../src/lib/bim/ifc.ts";
import { connectedWallSolids } from "../src/domain/elements/wall/connections.ts";
const directory = process.argv[2];
if (!directory) throw new Error("Output directory required");
await mkdir(directory, { recursive: true });
const dimensions = { thickness: 0.36, height: 2.8, bodyOffset: 0.18 };
let p = addWall(createProject("automatic-corner", "storey-1"), {
  id: "A",
  start: { x: 0, y: 0 },
  end: { x: 3, y: 0 },
  ...dimensions,
});
p = addWall(p, { id: "B", start: { x: 4, y: 0 }, end: { x: 4, y: 3 }, ...dimensions });
for (const id of ["A", "B"])
  p = addWindow(p, {
    id: "window-" + id,
    wallId: id,
    width: 1.2,
    height: 1.35,
    sillHeight: 0.9,
    position: 0.5,
  });
await writeFile(join(directory, "start.project.json"), serializeProject(p));
p = moveElement(p, { kind: "wall", id: "B" }, { x: -1, y: 0 });
for (const name of ["automatic-corner", "closed-rectangle"]) {
  if (name === "closed-rectangle") {
    p = addWall(p, { id: "C", start: { x: 3, y: 3 }, end: { x: 0, y: 3 }, ...dimensions });
    p = addWall(p, { id: "D", start: { x: 0, y: 3 }, end: { x: 0, y: 0 }, ...dimensions });
  }
  const bodies = connectedWallSolids(p);
  await writeFile(join(directory, name + ".project.json"), serializeProject(p));
  await writeFile(
    join(directory, name + ".ifc"),
    await exportIfc(p, new Date("2026-10-05T12:00:00Z")),
  );
  await writeFile(
    join(directory, name + ".json"),
    JSON.stringify(
      {
        project: p,
        profiles: Object.fromEntries(bodies.map((w) => [w.wallId, w.localProfile])),
        contours: Object.fromEntries(bodies.map((w) => [w.wallId, w.contour])),
        volumes: Object.fromEntries(bodies.map((w) => [w.wallId, w.volume])),
      },
      null,
      2,
    ),
  );
}
console.log("Generated automatic join and closed rectangle, normal project export.");
