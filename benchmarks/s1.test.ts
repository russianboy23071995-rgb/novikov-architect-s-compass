import test from "node:test";
import assert from "node:assert/strict";
import { s1Fixture } from "./s1-fixture.ts";
import { checkS1 } from "./s1-check.ts";

test("S1: connected multi-storey preview, commit, history and portable/recovery/IFC equivalence", async () => {
  const p = s1Fixture();
  assert.deepEqual(
    p.storeys.map((s) => [
      s.walls.length,
      s.windows.length,
      s.hatches.length,
      s.lines?.length,
      s.wallJoins.length,
      s.wallTJunctions.length,
    ]),
    Array.from({ length: 5 }, () => [60, 40, 10, 100, 1, 10]),
  );
  assert.equal(p.drawingDocuments?.length, 5);
  assert.equal((await checkS1(p)).status, "PASS");
});
