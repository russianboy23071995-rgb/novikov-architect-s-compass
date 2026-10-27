import assert from "node:assert/strict";
import { readFile, writeFile, unlink } from "node:fs/promises";
import { cpus } from "node:os";
import { boundHeightFixture } from "./bound-height-fixture.ts";
import { createProjectSnapshot } from "../src/domain/project/owned-snapshot.ts";
import { buildBuildingSolid } from "../src/rendering/viewport/building-solid.ts";

const generated = new URL(
  "../src/rendering/viewport/storey-solid.host-baseline.ts",
  import.meta.url,
);
let source = (
  await readFile(new URL("../src/rendering/viewport/storey-solid.ts", import.meta.url), "utf8")
).replaceAll("\r\n", "\n");
// Restore exactly the old global scan; all remaining production code is shared.
const index =
  / {2}\/\/ Derivation-local index:[\s\S]*?(?= {2}for \(const wall of storeyOf\(project\).walls\))/g;
assert.equal([...source.matchAll(index)].length, 1);
source = source.replace(index, "");
const lookup = "(windowsByHost.get(wall.id) ?? [])";
assert.equal(source.split(lookup).length, 2);
source = source.replace(lookup, "storeyOf(project).windows.filter((w) => w.wallId === wall.id)");
await writeFile(generated, source, { flag: "wx" });
try {
  const legacy = (await import(generated.href)) as {
    buildBuildingSolid: typeof buildBuildingSolid;
  };
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
          end: { x: 23 + i * 5, y: 10 },
        });
        eg.windows.push({ ...eg.windows[0]!, id: `window-${i}`, wallId: `rest-${i}` });
      }
      const model = createProjectSnapshot(p);
      const values = new Map<string, ReturnType<typeof buildBuildingSolid>>();
      const times: Record<string, number> = {};
      const paths = trial % 2 ? ["new", "old"] : ["old", "new"];
      for (const path of paths) {
        const start = performance.now();
        const solid = (path === "new" ? buildBuildingSolid : legacy.buildBuildingSolid)(model);
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
          "Old global scan restored in exclusive temporary sibling; finally cleanup. 7 distinct owned scenes per size, alternating execution order, 21 complete faces/volume/bounds comparisons. Snapshot preparation outside timing. Shared lower-level caches/JIT/GC uncontrolled; CPU not browser/frame/GPU.",
        rows,
      },
      null,
      2,
    ),
  );
} finally {
  await unlink(generated);
}
