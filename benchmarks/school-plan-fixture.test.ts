import test from "node:test";
import assert from "node:assert/strict";
import { schoolPlanCounts, schoolPlanFixture } from "./school-plan-fixture.ts";
import { serializeProject } from "../src/lib/bim/model.ts";
import { readProjectFile } from "../src/lib/bim/history.ts";

test("school plan sizes validate, round-trip and carry the intended composition", () => {
  const small = schoolPlanFixture();
  assert.deepEqual(schoolPlanCounts(small), {
    walls: 80,
    windows: 120,
    doors: 60,
    lines: 2640,
    hatches: 65,
    references: 0,
    total: 2965,
  });
  assert.equal(schoolPlanCounts(schoolPlanFixture({ wings: 3, desksPerRoom: 50 })).total, 9975);
  const s0 = small.storeys[0]!;
  assert.equal(small.storeys.length, 5);
  assert.equal(s0.wallJoins.length, 4);
  assert.equal(s0.wallTJunctions.length, 10);
  assert.equal(s0.walls.filter((w) => w.topBinding).length, 16);
  assert.equal(small.storeys[4]!.walls.filter((w) => w.topBinding).length, 0);
  assert.equal(s0.doors![0]!.mark, "T-EG-01");
  assert.equal(small.storeys[2]!.windows[0]!.mark, "F-OG2-01");
  assert.deepEqual(readProjectFile(serializeProject(small)), small);
});
