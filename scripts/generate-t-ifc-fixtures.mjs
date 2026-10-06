import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { addWall, addWindow, createProject, serializeProject } from "../src/lib/bim/model.ts";
import { deriveTSolids } from "../src/domain/elements/wall/t-solid.ts";
import { exportTJunctionIfc } from "../src/interop/ifc/t-junction.ts";
const directory = process.argv[2];
if (!directory) throw new Error("Output directory required");
await mkdir(directory, { recursive: true });
for (const name of ["t-free", "t-touch", "t-touch-rotated"]) {
  let p = createProject(name, "storey-1");
  for (const wall of [
    { id: "host", start: { x: 0, y: 0 }, end: { x: 6, y: 0 } },
    { id: "incoming", start: { x: 3, y: -3 }, end: { x: 3, y: 0 } },
  ])
    p = addWall(p, { ...wall, thickness: 0.36, height: 2.8, bodyOffset: 0 });
  for (const [wallId, length] of [
    ["host", 6],
    ["incoming", 3],
  ])
    p = addWindow(p, {
      id: `window-${wallId}`,
      wallId,
      width: 1,
      height: 1,
      sillHeight: 0.9,
      position: (name === "t-free" ? 1.5 : 2.32) / length,
    });
  if (name === "t-touch-rotated") {
    const transform = (q) => ({
      x: 1000 + Math.cos(0.7) * q.x - Math.sin(0.7) * q.y,
      y: -2000 + Math.sin(0.7) * q.x + Math.cos(0.7) * q.y,
    });
    for (const wall of p.storey.walls) {
      wall.start = transform(wall.start);
      wall.end = transform(wall.end);
    }
  }
  const solids = deriveTSolids(p, "host", { wallId: "incoming", endpoint: 1 });
  await writeFile(
    join(directory, `${name}.ifc`),
    await exportTJunctionIfc(
      p,
      "host",
      { wallId: "incoming", endpoint: 1 },
      new Date("2026-10-06T12:00:00Z"),
    ),
  );
  await writeFile(join(directory, `${name}.project.json`), serializeProject(p));
  await writeFile(
    join(directory, `${name}.json`),
    JSON.stringify(
      {
        project: p,
        profiles: Object.fromEntries(solids.walls.map((w) => [w.wallId, w.localProfile])),
        contours: Object.fromEntries(solids.walls.map((w) => [w.wallId, w.contour])),
        // Independent analytic expectations, not volumes copied from the derivation.
        volumes: { host: 6 * 0.36 * 2.8 - 0.36, incoming: 2.82 * 0.36 * 2.8 - 0.36 },
      },
      null,
      2,
    ),
  );
}
console.log("Generated three isolated T acceptance exports; project files contain no T relation.");
