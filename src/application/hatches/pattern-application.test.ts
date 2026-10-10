import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createProject,
  serializeProject,
  deserializeProject,
  validateProject,
} from "../../lib/bim/model.ts";
import { createHistory, commitProject, undoProject, redoProject } from "../../lib/bim/history.ts";
import { createDrawing } from "../drawing/actions.ts";
import { previewHatch } from "./actions.ts";
import { moveElement, moveElementPoint } from "../direct-edit/transforms.ts";
import { prepareTranslation } from "../../domain/project/prepared-translation.ts";
import { pickupToolDefaults } from "../tools/pickup.ts";
import { createLayerVisibilityPolicy, ALL_LAYERS_VISIBLE } from "../layers/visibility.ts";
import { derivePlanScene } from "../../rendering/viewport/plan-scene.ts";
const definition = {
  id: "diagonal",
  name: "Diagonal",
  width: 0.1,
  height: 0.1,
  lines: [{ start: { x: 0, y: 0 }, end: { x: 0.1, y: 0.1 } }],
};
const ring = [
  { x: 0, y: 0 },
  { x: 3, y: 0 },
  { x: 3, y: 2 },
  { x: 0, y: 2 },
];
function draw(base = createProject("project", "storey"), id = "h") {
  return createDrawing(base, base, id, {
    kind: "hatch",
    points: ring,
    fill: { color: "#112233", opacity: 0.5 },
    patternDefinition: definition,
  });
}
test("two hatch applications share one portable definition and one-step Undo", () => {
  const base = createProject("project", "storey"),
    one = draw(base),
    two = createDrawing(one, one, "other", {
      kind: "hatch",
      points: [
        { x: 4, y: 0 },
        { x: 7, y: 0 },
        { x: 7, y: 1 },
        { x: 5, y: 1 },
        { x: 5, y: 2 },
        { x: 4, y: 2 },
      ],
      fill: { color: "#112233", opacity: 0.5 },
      patternDefinition: definition,
    });
  assert.equal(two.hatchPatterns.length, 1);
  assert.equal(two.storey.hatches.length, 2);
  const history = commitProject(createHistory(base), two);
  assert.deepEqual(undoProject(history).present, base);
  assert.deepEqual(redoProject(undoProject(history)).present, two);
  assert.deepEqual(deserializeProject(serializeProject(two)), two);
  definition.lines[0]!.end.x = 0.05;
  assert.equal(two.hatchPatterns[0]!.lines[0]!.end.x, 0.1);
  definition.lines[0]!.end.x = 0.1;
});
test("schema 10 migrates existing solid hatches without a library", () => {
  const base = createProject("project", "storey");
  const p = createDrawing(base, base, "solid", {
    kind: "hatch",
    points: ring,
    fill: { color: "#112233", opacity: 0.5 },
  });
  const { hatchPatterns: _unused, ...old } = p;
  const reopened = deserializeProject(JSON.stringify({ ...old, schemaVersion: 10 }));
  assert.equal(reopened.schemaVersion, 19);
  assert.deepEqual(reopened.hatchPatterns, []);
  assert.deepEqual(reopened.storey.hatches, p.storey.hatches);
});
test("translation moves anchor, reshape retains it; prepared path matches full action", () => {
  const p = draw();
  const moved = moveElement(p, { kind: "hatch", id: "h" }, { x: 4, y: 5 });
  assert.deepEqual(moved.storey.hatches[0]!.pattern!.origin, { x: 4, y: 5 });
  const prepared = prepareTranslation(p, ["h"]).materialize(p, { x: 4, y: 5 });
  assert.deepEqual(prepared, moved);
  const reshaped = moveElementPoint(moved, { kind: "hatch", id: "h" }, 2, { x: 6, y: 6 });
  assert.deepEqual(reshaped.storey.hatches[0]!.pattern!.origin, { x: 4, y: 5 });
});
test("invalid reference, conflicting ID and stale action do not mutate project", () => {
  const p = draw(),
    json = serializeProject(p);
  assert.throws(() => validateProject({ ...p, hatchPatterns: [] }));
  assert.throws(() =>
    validateProject({ ...p, hatchPatterns: [...p.hatchPatterns, ...p.hatchPatterns] }),
  );
  assert.throws(() =>
    previewHatch(p, p, {
      projectId: p.id,
      kind: "update",
      id: "h",
      changes: {},
      patternDefinition: { ...definition, name: "Conflict" },
    }),
  );
  assert.throws(() =>
    previewHatch(p, { ...p }, { projectId: p.id, kind: "update", id: "h", changes: {} }),
  );
  const solid = previewHatch(p, p, {
    projectId: p.id,
    kind: "update",
    id: "h",
    changes: {},
    patternDefinition: null,
  });
  assert.equal(solid.storey.hatches[0]!.pattern, null);
  assert.equal(serializeProject(p), json);
});
test("pickup copies pattern definition but creates a fresh contour anchor", () => {
  const p = draw();
  const visibility = createLayerVisibilityPolicy(p, ALL_LAYERS_VISIBLE);
  const picked = pickupToolDefaults(p, visibility, { kind: "hatch", id: "h" });
  assert.equal(picked?.tool, "hatch");
  if (picked?.tool !== "hatch") throw new Error("No hatch");
  const next = createDrawing(p, p, "copy", {
    kind: "hatch",
    points: ring.map((q) => ({ x: q.x + 7, y: q.y + 8 })),
    ...picked.values,
  });
  assert.deepEqual(next.storey.hatches[1]!.pattern!.origin, { x: 7, y: 8 });
  assert.equal(next.hatchPatterns.length, 1);
  const scene = derivePlanScene(next, () => true, next.hatchPatterns);
  assert.equal(scene.hatchPatterns.size, 1);
  assert.equal(scene.plan.hatches.length, 2);
});
