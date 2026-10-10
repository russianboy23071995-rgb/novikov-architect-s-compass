import assert from "node:assert/strict";
import test from "node:test";
import { recoveryFixture, summary } from "./recovery-capacity-fixture.ts";
import { serializeProject } from "../src/lib/bim/model.ts";
import { prepareProjectOpen } from "../src/application/project-files/operations.ts";
import { sameRecoveryContent } from "../src/application/project-files/recovery-status.ts";

test("capacity fixture retains all synthetic geometry through the real file boundary", async () => {
  const project = recoveryFixture("capacity-test", 1000);
  const json = serializeProject(project);
  const loaded = await prepareProjectOpen({
    name: "fixture.json",
    size: new TextEncoder().encode(json).length,
    text: async () => json,
  });
  assert.equal(project.storey.lines!.length, 1000);
  assert.equal(new Set(project.storey.lines!.map((line) => line.id)).size, 1000);
  assert.equal(project.storey.walls.length, 1);
  assert.equal(project.storey.windows.length, 1);
  assert.ok(sameRecoveryContent(project, loaded.project));
});

test("measurement median and nearest-rank p95 are independent of input order", () => {
  const input = [5, 1, 4, 2, 3];
  assert.deepEqual(summary(input), { median: 3, p95: 5 });
  assert.deepEqual(input, [5, 1, 4, 2, 3]);
  assert.deepEqual(summary([4, 1, 2, 3]), { median: 2.5, p95: 4 });
  assert.deepEqual(summary(Array.from({ length: 100 }, (_, i) => i + 1)), {
    median: 50.5,
    p95: 95,
  });
  for (const invalid of [[], [-1], [NaN], [Infinity]]) assert.throws(() => summary(invalid));
});
