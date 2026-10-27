import assert from "node:assert/strict";
import { readFile, writeFile, unlink } from "node:fs/promises";
import { cpus } from "node:os";
import { boundHeightFixture } from "./bound-height-fixture.ts";
import { createProjectSnapshot } from "../src/domain/project/owned-snapshot.ts";
import { buildBuildingSolid } from "../src/rendering/viewport/building-solid.ts";
import { buildPreviewSolid } from "../src/rendering/viewport/storey-solid.ts";
import { buildingViewFixture } from "./building-view-fixture.ts";

const generated = new URL(
  "../src/rendering/viewport/storey-solid.bounds-pilot.ts",
  import.meta.url,
);
let source = (
  await readFile(new URL("../src/rendering/viewport/storey-solid.ts", import.meta.url), "utf8")
).replaceAll("\r\n", "\n");
// Isolate XYZ bounds only; transformation and point arrays remain unchanged.
const original = `      for (const p of vertices)
        for (const axis of [0, 1, 2] as const) {
          solid.min[axis] = Math.min(solid.min[axis], p[axis]);
          solid.max[axis] = Math.max(solid.max[axis], p[axis]);
        }`;
const candidate = `      for (const p of vertices) {
        solid.min[0] = Math.min(solid.min[0], p[0]);
        solid.max[0] = Math.max(solid.max[0], p[0]);
        solid.min[1] = Math.min(solid.min[1], p[1]);
        solid.max[1] = Math.max(solid.max[1], p[1]);
        solid.min[2] = Math.min(solid.min[2], p[2]);
        solid.max[2] = Math.max(solid.max[2], p[2]);
      }`;
assert.equal(source.split(original).length, 2, "Unique free-face bounds anchor");
source = source.replace(original, candidate);
await writeFile(generated, source, { flag: "wx" });
try {
  const pilot = (await import(generated.href)) as {
    buildBuildingSolid: typeof buildBuildingSolid;
    buildPreviewSolid: typeof buildPreviewSolid;
  };
  // Exact untimed scope oracle: overlapping openings are supported by the solid
  // union algorithm independently of application-level placement constraints.
  for (const coordinate of [0, 1e9]) {
    for (const openingCount of [0, 1, 3]) {
      const p = structuredClone(buildingViewFixture(3));
      const storey = p.storeys[0]!;
      const first = storey.windows[0]!;
      storey.windows = [
        { ...first, width: 0.5, position: 0.2 },
        { ...first, id: "overlap", width: 0.4, position: 0.22 },
        { ...first, id: "second", width: 0.5, position: 0.7 },
      ].slice(0, openingCount);
      for (const wall of storey.walls) {
        wall.start.x += coordinate;
        wall.end.x += coordinate;
        wall.end.y += 0.75;
        wall.baseOffset = -0.2;
      }
      const scope = { storey, assets: p.assets };
      const before = structuredClone(scope);
      assert.deepEqual(buildPreviewSolid(scope, 3.5), pilot.buildPreviewSolid(scope, 3.5));
      assert.deepEqual(scope, before);
    }
  }
  const rows = [];
  for (const extra of [0, 100, 1000])
    for (let trial = 0; trial < 7; trial++) {
      const p = structuredClone(boundHeightFixture());
      const eg = p.storeys[0]!;
      eg.walls[0]!.thickness += trial * 0.0001;
      eg.walls[1]!.thickness = eg.walls[0]!.thickness;
      for (let i = 0; i < extra; i++) {
        eg.walls.push({
          ...eg.walls[0]!,
          id: `rest-${i}`,
          start: { x: 20 + i * 5, y: 10 },
          end: { x: 23 + i * 5, y: 10 + (trial % 3) },
          baseOffset: trial % 2 ? -0.2 : 0.15,
        });
        eg.windows.push({ ...eg.windows[0]!, id: `window-${i}`, wallId: `rest-${i}` });
      }
      const model = createProjectSnapshot(p);
      const values = new Map<string, ReturnType<typeof buildBuildingSolid>>();
      const times: Record<string, number> = {};
      const paths = trial % 2 ? ["new", "old"] : ["old", "new"];
      for (const path of paths) {
        const start = performance.now();
        const solid = (path === "new" ? pilot.buildBuildingSolid : buildBuildingSolid)(model);
        times[path] = performance.now() - start;
        values.set(path, solid);
      }
      assert.deepEqual(values.get("new"), values.get("old"));
      rows.push({ extra, trial, paths, times });
    }
  console.log(
    JSON.stringify(
      {
        runtime: process.version,
        cpu: cpus()[0]?.model,
        method:
          "Isolated XYZ bounds candidate installed against PR414 product in exclusive temporary sibling; finally cleanup. Six untimed scope comparisons cover empty/single/overlapping openings, oblique walls, large coordinates, height offset and nonmutation. 7 distinct owned scenes per size, alternating execution order, 21 complete faces/volume/bounds comparisons. Snapshot preparation outside timing. Shared lower-level caches/JIT/GC uncontrolled; CPU not browser/frame/GPU.",
        rows,
      },
      null,
      2,
    ),
  );
} finally {
  await unlink(generated);
}
