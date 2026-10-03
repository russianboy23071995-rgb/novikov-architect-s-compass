import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { exportIfc } from "../src/lib/bim/ifc.ts";
import { createExampleProject } from "../src/components/cad/bim-view.ts";
import {
  addWall,
  addWindow,
  createProject,
  updateWall,
  updateWindow,
} from "../src/lib/bim/model.ts";
import { buildSolid } from "../src/lib/bim/geometry.ts";

const directory = process.argv[2];
if (!directory)
  throw new Error(
    "Usage: node --experimental-strip-types scripts/generate-ifc-fixtures.mjs <output-directory>",
  );
await mkdir(directory, { recursive: true });
const reference = createExampleProject();
const diagonal = addWall(
  updateWall(reference, "wall-1", { start: { x: 5, y: 6 }, end: { x: 2, y: 2 } }),
  {
    id: "wall-2",
    start: { x: -2, y: -3 },
    end: { x: -2, y: 1 },
    thickness: 0.2,
    height: 3,
  },
);
const unusual = addWall(createProject("Projekt 'Ä' \\ 🏠\n#99", "Étage"), {
  id: "Wand 'ß' \\ 🏠",
  start: { x: -1e-7, y: 1e-7 },
  end: { x: 3, y: 1e-7 },
  thickness: 0.36,
  height: 2.8,
});
const fixtures = {
  reference,
  extended: updateWall(reference, "wall-1", { end: { x: 6, y: 0 }, height: 3.5, thickness: 0.5 }),
  diagonal,
  overlap: addWindow(reference, { ...reference.storey.windows[0], id: "window-2", position: 0.6 }),
  floor: updateWindow(reference, "window-1", { sillHeight: 0, height: 2.1 }),
  full: updateWindow(reference, "window-1", { width: 3, height: 2.8, sillHeight: 0 }),
  unusual,
  empty: createProject("empty", "storey"),
};
for (const [name, project] of Object.entries(fixtures)) {
  const ifc = await exportIfc(project, new Date("2026-09-30T12:00:00Z"));
  await writeFile(join(directory, `${name}.ifc`), ifc);
  const volumes = Object.fromEntries(
    project.storey.walls.map((wall) => [
      wall.id,
      buildSolid({
        ...project,
        storey: {
          ...project.storey,
          walls: [wall],
          windows: project.storey.windows.filter((w) => w.wallId === wall.id),
        },
      }).volume,
    ]),
  );
  await writeFile(join(directory, `${name}.json`), JSON.stringify({ project, volumes }, null, 2));
}
console.log(`Generated ${Object.keys(fixtures).length} IFC fixtures in ${directory}`);
