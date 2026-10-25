import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { tTransitionFixture } from "./t-transition-fixture.ts";
import { editAtPointer, type EditSession } from "../src/lib/bim/direct-edit.ts";
import { connectSnappedT } from "../src/application/walls/t-axis-snap.ts";
import { validateProject } from "../src/domain/project/schema.ts";
import { storeyOf } from "../src/domain/storeys/access.ts";

// Browser downloads, in order: before, placed, undo, redo, cancelled.
// Compare complete storeys, not just the edited wall or a screenshot.
const paths = process.argv.slice(2);
assert.equal(paths.length, 5, "Pass five exported project paths");
const projects = paths.map((path) => validateProject(JSON.parse(readFileSync(path, "utf8"))));
const base = tTransitionFixture();
const session: EditSession = {
  base,
  target: { kind: "wall", id: "wall-2" },
  action: "point",
  index: 1,
  anchor: { ...storeyOf(base).walls.find((w) => w.id === "wall-2")!.end },
};
const point = { x: 3, y: 3 };
const full = connectSnappedT(session, editAtPointer(session, base, point), point, {
  kind: "endpoint",
  worldPoint: point,
  sourceEntityId: "new-host",
  sourceFeature: "t-axis",
  distanceOnScreen: 0,
  priority: 0,
});
for (const [index, expected] of [base, full, base, full, full].entries()) {
  assert.deepEqual(projects[index]!.storeys, expected.storeys, `Browser export ${index}`);
}
console.log("PASS: before / placed / one undo / redo / cancelled match full model path.");
