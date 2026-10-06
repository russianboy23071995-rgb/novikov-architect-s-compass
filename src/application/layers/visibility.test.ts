import assert from "node:assert/strict";
import { test } from "node:test";
import { createExampleProject } from "../../components/cad/bim-view.ts";
import { defaultLineAppearance } from "../../lib/bim/lines.ts";
import { addLine, serializeProject, updateWall } from "../../lib/bim/model.ts";
import { buildSolid } from "../../lib/bim/geometry.ts";
import { exportIfc } from "../../lib/bim/ifc.ts";
import { createLayerVisibilityPolicy } from "./visibility.ts";

const fixture = () =>
  addLine(createExampleProject(), {
    id: "line-1",
    kind: "line",
    points: [
      { x: 0, y: 1 },
      { x: 2, y: 1 },
    ],
    ...defaultLineAppearance,
  });

test("BIM and independent drawing contexts evaluate the same elements without an upstream mask", () => {
  const p = fixture();
  const bim = createLayerVisibilityPolicy(p, {
    scope: { kind: "bim-project" },
    hiddenLayerIds: [p.defaultLayerIds.wall, p.defaultLayerIds.line],
  });
  const drawing = createLayerVisibilityPolicy(p, {
    scope: { kind: "drawing-document", documentId: "drawing-1" },
    hiddenLayerIds: [],
  });
  const other = createLayerVisibilityPolicy(p, {
    scope: { kind: "drawing-document", documentId: "drawing-2" },
    hiddenLayerIds: [p.defaultLayerIds.window],
  });
  for (const id of ["wall-1", "window-1", "line-1"]) {
    assert.equal(bim.evaluate(p, bim.context, id).eligible, false);
    assert.equal(drawing.evaluate(p, drawing.context, id).eligible, true);
  }
  assert.equal(other.evaluate(p, other.context, "wall-1").eligible, true);
  assert.equal(other.evaluate(p, other.context, "window-1").eligible, false);
  assert.equal(bim.evaluate(p, drawing.context, "wall-1").reason, "stale-context");
});

test("all window/host visibility combinations obey one host rule", () => {
  const p = fixture();
  for (const hideWall of [false, true])
    for (const hideWindow of [false, true]) {
      const policy = createLayerVisibilityPolicy(p, {
        scope: { kind: "bim-project" },
        hiddenLayerIds: [
          ...(hideWall ? [p.defaultLayerIds.wall] : []),
          ...(hideWindow ? [p.defaultLayerIds.window] : []),
        ],
      });
      assert.equal(policy.evaluate(p, policy.context, "wall-1").eligible, !hideWall);
      assert.equal(policy.evaluate(p, policy.context, "line-1").eligible, true);
      assert.equal(
        policy.evaluate(p, policy.context, "window-1").reason,
        hideWindow ? "hidden-layer" : hideWall ? "hidden-host" : "visible",
      );
    }
});

test("missing targets, stale snapshots and changed contexts fail closed", () => {
  const p = fixture();
  const policy = createLayerVisibilityPolicy(p, {
    scope: { kind: "bim-project" },
    hiddenLayerIds: [],
  });
  assert.equal(policy.evaluate(p, policy.context, "missing").reason, "unknown-element");
  assert.equal(policy.evaluate(p, policy.context, p.id).reason, "unknown-element");
  const changed = updateWall(p, "wall-1", { height: 3 });
  assert.equal(policy.evaluate(changed, policy.context, "wall-1").reason, "stale-project");
  const replacement = createLayerVisibilityPolicy(p, {
    scope: { kind: "bim-project" },
    hiddenLayerIds: [p.defaultLayerIds.wall],
  });
  assert.equal(policy.evaluate(p, replacement.context, "wall-1").reason, "stale-context");
  assert.throws(
    () =>
      createLayerVisibilityPolicy(p, {
        scope: { kind: "bim-project" },
        hiddenLayerIds: ["missing"],
      }),
    /Unknown visibility layer/,
  );
  assert.throws(() =>
    createLayerVisibilityPolicy(p, {
      scope: { kind: "drawing-document", documentId: " " },
      hiddenLayerIds: [],
    }),
  );
});

test("policy owns an immutable context and does not mutate model, openings or IFC", async () => {
  const p = fixture(),
    json = serializeProject(p),
    solid = buildSolid(p);
  const date = new Date("2026-10-05T00:00:00Z"),
    ifc = await exportIfc(p, date);
  const hidden = [p.defaultLayerIds.window];
  const scope = { kind: "drawing-document" as const, documentId: "drawing-1" };
  const policy = createLayerVisibilityPolicy(p, { scope, hiddenLayerIds: hidden });
  hidden.push(p.defaultLayerIds.wall);
  scope.documentId = "changed";
  assert.equal(policy.evaluate(p, policy.context, "wall-1").eligible, true);
  assert.equal(policy.evaluate(p, policy.context, "window-1").eligible, false);
  assert.deepEqual(policy.context.scope, { kind: "drawing-document", documentId: "drawing-1" });
  assert.ok(
    Object.isFrozen(policy.context) &&
      Object.isFrozen(policy.context.scope) &&
      Object.isFrozen(policy.context.hiddenLayerIds),
  );
  assert.equal(serializeProject(p), json);
  assert.deepEqual(buildSolid(p), solid);
  assert.equal(await exportIfc(p, date), ifc);
});
