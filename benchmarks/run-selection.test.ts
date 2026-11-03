import test from "node:test";
import assert from "node:assert/strict";
import { runSelection, selectedRunKinds } from "../src/components/cad/run-selection.ts";

// docs/TABS.md (Auswahlklick): only the runs that draw a selected element get the selection.
test("run selection: windows and doors count to the wall run, other kinds to their own", () => {
  assert.deepEqual([...selectedRunKinds([{ kind: "window" }, { kind: "door" }])], ["wall"]);
  assert.deepEqual(
    [...selectedRunKinds([{ kind: "wall" }, { kind: "line" }, { kind: "room" }])].sort(),
    ["line", "room", "wall"],
  );
  assert.equal(selectedRunKinds([]).size, 0);
  const ids = new Set(["w1", "f1"]);
  const none = new Set<string>();
  const kinds = selectedRunKinds([{ kind: "wall" }, { kind: "window" }]);
  assert.equal(runSelection("wall", kinds, ids, none), ids);
  // Runs without a selected element always get the same empty set: their memo holds.
  assert.equal(runSelection("line", kinds, ids, none), none);
  assert.equal(runSelection("room", kinds, ids, none), none);
});
