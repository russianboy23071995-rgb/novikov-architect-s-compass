import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { deserializeProject } from "../src/interop/project-file/load.ts";
import { fullHeightFixture } from "./bound-height-fixture.ts";
import { beginSelectionMove, previewSelectionMove } from "../src/application/selection/move.ts";
import { setStoreyHeight } from "../src/application/storeys/actions.ts";
import { selectWorkingStorey } from "../src/application/storeys/working-storey.ts";
import { updateWindow } from "../src/application/windows/actions.ts";

// Real UI downloads, in order: placed, Undo, Redo+cancel, height, storey switch.
const paths = process.argv.slice(2);
assert.ok(
  paths.length === 5 || paths.length === 6,
  "Pass five exports, optionally followed by OG window width 1.5 m",
);
const base = fullHeightFixture();
const targets = [
  { kind: "wall" as const, id: "eg-a" },
  { kind: "wall" as const, id: "eg-b" },
];
const session = beginSelectionMove(base, targets, { x: 0, y: 0 });
const moved = previewSelectionMove(session, base, targets, { x: 0.5, y: 0 });
const height = setStoreyHeight(moved, moved, { projectId: moved.id, storeyId: "eg", height: 3.5 });
const switched = selectWorkingStorey(height, height, "og");
const expected = [
  moved,
  base,
  moved,
  height,
  switched,
  updateWindow(switched, "og-window", { width: 1.5 }),
];
const stages = [
  "placed",
  "undo",
  "redo-and-cancel",
  "height",
  "storey-switch",
  "window-width",
].slice(0, paths.length);
for (let i = 0; i < paths.length; i++) {
  // Bound wall heights are intentionally derived, not duplicated in JSON.
  const actual = deserializeProject(readFileSync(paths[i]!, "utf8"));
  assert.deepEqual(actual.storeys, expected[i]!.storeys, stages[i]);
  assert.equal(actual.workingStoreyId, expected[i]!.workingStoreyId, stages[i]);
  assert.equal(actual.groundStoreyId, expected[i]!.groundStoreyId, stages[i]);
  assert.deepEqual(actual.bimVisibility, expected[i]!.bimVisibility, stages[i]);
}
console.log(
  JSON.stringify(
    {
      stages,
      passed: true,
      comparison:
        "Complete storeys, working/ground storey against common full-project actions; no GPU/frame claim",
    },
    null,
    2,
  ),
);
