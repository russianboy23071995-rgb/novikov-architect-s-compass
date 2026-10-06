import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { exportCornerIfc } from "../src/interop/ifc/corner.ts";
import { deriveCornerSolids } from "../src/domain/elements/wall/corner-solid.ts";
import { createProject, addWall, addWindow } from "../src/lib/bim/model.ts";
const directory = process.argv[2];
if (!directory) throw new Error("Output directory required");
await mkdir(directory, { recursive: true });
let count = 0;
for (const a of [-0.18, 0, 0.18])
  for (const b of [-0.18, 0, 0.18]) {
    let p = addWall(
      addWall(createProject("corner-acceptance", "storey-1"), {
        id: "A",
        start: { x: 0, y: 0 },
        end: { x: 3, y: 0 },
        thickness: 0.36,
        height: 2.8,
        bodyOffset: a,
      }),
      {
        id: "B",
        start: { x: 3, y: 0 },
        end: { x: 3, y: 3 },
        thickness: 0.36,
        height: 2.8,
        bodyOffset: b,
      },
    );
    p.storey.wallJoins = []; // This fixture explicitly tests temporary pair geometry.
    for (const id of ["A", "B"])
      p = addWindow(p, {
        id: "window-" + id,
        wallId: id,
        width: 1.2,
        height: 1.35,
        sillHeight: 0.9,
        position: 0.5,
      });
    const variants = a === 0 && b === 0 ? ["base", "rotated", "reversed", "overlap"] : ["base"];
    for (const variant of variants) {
      const q = structuredClone(p),
        targets = [
          { wallId: "A", endpoint: 1 },
          { wallId: "B", endpoint: 0 },
        ];
      if (variant === "rotated")
        for (const w of q.storey.walls)
          for (const key of ["start", "end"]) {
            const { x, y } = w[key];
            w[key] = {
              x: 10 + Math.cos(0.7) * x - Math.sin(0.7) * y,
              y: 20 + Math.sin(0.7) * x + Math.cos(0.7) * y,
            };
          }
      if (variant === "reversed")
        for (const [i, w] of q.storey.walls.entries()) {
          [w.start, w.end] = [w.end, w.start];
          w.bodyOffset = -w.bodyOffset;
          targets[i].endpoint = 1 - targets[i].endpoint;
        }
      if (variant === "overlap")
        q.storey.windows.push({ ...q.storey.windows[0], id: "window-overlap", position: 0.6 });
      const solid = deriveCornerSolids(q, ...targets);
      const name =
        a === 0 && b === 0 && variant === "base"
          ? "NOVIKOV-Eckanschluss-Test"
          : `corner-${a}-${b}-${variant}`;
      await writeFile(
        join(directory, name + ".ifc"),
        await exportCornerIfc(q, ...targets, new Date("2026-10-05T00:00:00Z")),
      );
      await writeFile(
        join(directory, name + ".json"),
        JSON.stringify(
          {
            project: q,
            targets,
            volumes: Object.fromEntries(solid.walls.map((w) => [w.wallId, w.volume])),
            profiles: Object.fromEntries(solid.walls.map((w) => [w.wallId, w.localProfile])),
            contours: Object.fromEntries(solid.walls.map((w) => [w.wallId, w.contour])),
          },
          null,
          2,
        ),
      );
      count++;
    }
  }
console.log(`Generated ${count} corner acceptance IFC fixtures in ${directory}`);
