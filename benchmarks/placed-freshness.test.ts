import test from "node:test";
import assert from "node:assert/strict";
import { gesamtFixture } from "./gesamt-fixture.ts";
import { createProjectSnapshot } from "../src/domain/project/owned-snapshot.ts";
import { createEditingState, editingReducer } from "../src/application/direct-edit/controller.ts";
import { updateWall } from "../src/application/walls/actions.ts";
import { placedDrawingKey, sameDrawingKey } from "../src/rendering/viewport/placed-freshness.ts";

// docs/LAYOUTBUCH.md: a placed drawing is out of date exactly when what it shows changed.
test("placed drawings: out of date after model or document changes, not after layout edits", () => {
  let state = createEditingState(createProjectSnapshot(gesamtFixture(600)));
  const present = () => state.history.present;
  const plan = "abbild-s2",
    other = "abbild-s0",
    section = "abbild-schnitt-0";
  const keys = () => [plan, other, section].map((id) => placedDrawingKey(present(), id));
  const unchanged = (before: ReturnType<typeof keys>) =>
    keys().map((key, i) => sameDrawingKey(key, before[i]!));
  let before = keys();
  assert.ok(before.every(Boolean));
  // Project information and storey switches change nothing a drawing shows.
  state = editingReducer(state, {
    type: "project-info",
    base: present(),
    info: { name: "Schule" },
  });
  state = editingReducer(state, { type: "working-storey", base: present(), storeyId: "s3" });
  state = editingReducer(state, { type: "working-storey", base: present(), storeyId: "s2" });
  assert.deepEqual(unchanged(before), [true, true, true]);
  // A wall of storey 2: its plan and every section are out of date, the plan of storey 0 not.
  const wall = present().storeys[2]!.walls[0]!.id;
  state = editingReducer(state, {
    type: "project",
    project: updateWall(present(), wall, { height: 2.5 }),
  });
  assert.deepEqual(unchanged(before), [false, true, false]);
  // The document itself (scale) is part of what the drawing shows.
  before = keys();
  state = editingReducer(state, {
    type: "document",
    base: present(),
    action: { kind: "scale", id: plan, denominator: 200 },
  });
  assert.deepEqual(unchanged(before), [false, true, true]);
  assert.equal(placedDrawingKey(present(), "nope"), null);
  assert.equal(sameDrawingKey(null, null), false);
});
