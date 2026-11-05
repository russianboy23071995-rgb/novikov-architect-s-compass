// node --experimental-strip-types benchmarks/junction-equality.ts <baseRootUrl> [out.json]
// Equality proof for docs/WALL_JUNCTIONS.md: every model that was valid before the junction
// change keeps exactly the same wall contours and solids on every storey. The base checkout
// (state before the change) is passed as a file URL; the fixtures come from this checkout.
import { writeFileSync } from "node:fs";
import { deepStrictEqual } from "node:assert/strict";
import { schoolPlanFixture } from "./school-plan-fixture.ts";
import { schoolFixture } from "./school-fixture.ts";
import { boundHeightFixture } from "./bound-height-fixture.ts";
import { createExampleProject } from "../src/components/cad/bim-view.ts";

const baseRoot = process.argv[2];
if (!baseRoot) throw new Error("base checkout URL required");
const here = new URL("../", import.meta.url).href;
const load = (root: string, path: string) =>
  import(new URL(path, root.endsWith("/") ? root : root + "/").href);
const derive = async (root: string, project: unknown) => {
  const { validateProject } = await load(root, "src/domain/project/schema.ts");
  const { connectedWallContours, connectedWallSolids } = await load(
    root,
    "src/domain/elements/wall/connections.ts",
  );
  const p = validateProject(JSON.parse(JSON.stringify(project)));
  return p.storeys.map((s: { id: string }) => {
    const scoped = { ...p, workingStoreyId: s.id };
    return {
      storey: s.id,
      contours: [...connectedWallContours(scoped)].sort(),
      solids: connectedWallSolids(scoped),
    };
  });
};

const models: Record<string, unknown> = {
  example: createExampleProject(),
  "school-s": schoolPlanFixture(),
  "school-l": schoolPlanFixture({ wings: 3, desksPerRoom: 50 }),
  "school-x": schoolFixture(20000),
  "bound-height": boundHeightFixture(),
};
const results: { model: string; storeys: number; walls: number }[] = [];
for (const [name, model] of Object.entries(models)) {
  const before = await derive(baseRoot, model),
    after = await derive(here, model);
  deepStrictEqual(after, before, `${name}: contours or solids changed`);
  results.push({
    model: name,
    storeys: after.length,
    walls: after.reduce((n: number, s: { solids: unknown[] }) => n + s.solids.length, 0),
  });
}

// Counter-check: a changed contour point must be detected.
const sample = await derive(here, models["school-s"]);
const tampered = structuredClone(sample);
tampered[0]!.contours[0]![1][0]!.x += 1e-9;
let detected = false;
try {
  deepStrictEqual(tampered, sample);
} catch {
  detected = true;
}
if (!detected) throw new Error("counter-check failed");

const report = {
  runtime: `node ${process.version} ${process.platform} ${process.arch}`,
  date: new Date().toISOString(),
  models: results.length,
  identical: results.length,
  counterCheckDetected: detected,
  results,
};
const text = JSON.stringify(report, null, 2);
if (process.argv[3]) writeFileSync(process.argv[3], text + "\n");
process.stdout.write(text + "\n");
