import test from "node:test";
import assert from "node:assert/strict";
import { prepareToolReferences, resolveToolSnap, drawingSnapPolicy } from "./snapping.ts";
import { editInteraction } from "./adapters.ts";
import { resolveEditSnap } from "../direct-edit/snapping.ts";
import { projectSnapReferences } from "../snapping/project-references.ts";
import { createEditingState, editingReducer } from "../direct-edit/controller.ts";
import { addWall, addWindow, addLine, createProject } from "../../lib/bim/model.ts";
import { defaultLineAppearance } from "../../lib/bim/lines.ts";
import { sameHoverSession } from "../../constraints/inference/hover-reference.ts";
const base = addLine(
  addWindow(
    addWall(createProject("p", "s"), {
      id: "w",
      start: { x: 0, y: 0 },
      end: { x: 3, y: 0 },
      thickness: 0.36,
      height: 2.8,
    }),
    { id: "o", wallId: "w", width: 1.2, height: 1.35, sillHeight: 0.9, position: 0.5 },
  ),
  {
    id: "l",
    kind: "line",
    points: [
      { x: 5, y: 0 },
      { x: 6, y: 2 },
    ],
    ...defaultLineAppearance,
  },
);
const noop = () => {};
test("one snap entry preserves every edit constraint including hosted windows", () => {
  for (const target of [
    { kind: "wall", id: "w" },
    { kind: "line", id: "l" },
    { kind: "window", id: "o" },
  ] as const)
    for (const action of (target.kind === "window"
      ? ["move"]
      : ["point", "move", "stretch", "axis", "x", "y"]) as Array<
      "point" | "move" | "stretch" | "axis" | "x" | "y"
    >) {
      const state = editingReducer(createEditingState(base), {
        type: "begin",
        target,
        action,
        index: target.kind === "window" ? null : 1,
      });
      const session = state.session!,
        policy = editInteraction(session, state.history.present, target, noop, noop).snapping;
      const refs = prepareToolReferences(policy, projectSnapReferences(base));
      assert.equal(
        refs.some((r) => r.entityId === target.id),
        false,
      );
      if (target.kind === "window")
        assert.equal(
          refs.some((r) => r.entityId === "w"),
          false,
        );
      assert.deepEqual(policy.origin.point, session.anchor);
      for (const enabled of [true, false])
        for (const shift of [true, false]) {
          const context = {
            references: refs,
            pixelsPerMetre: 100,
            enabled,
            endpointRadiusPx: 10,
            gridSpacing: 0.1,
            activeReferences: [policy.origin],
          };
          const cursor = { x: 4.03, y: 1.12 };
          const actual = resolveToolSnap(policy, cursor, context, {
            ortho: true,
            shift,
            featureSnap: true,
          });
          const expected = resolveEditSnap(session, cursor, {
            ...context,
            orthoOrigin: session.anchor,
            angleOrigin: shift ? session.anchor : null,
          });
          assert.deepEqual(actual, expected);
        }
    }
});
test("view-only changes preserve policy and reference identity; new interaction replaces it", () => {
  const state = editingReducer(createEditingState(base), {
    type: "begin",
    target: { kind: "wall", id: "w" },
    action: "point",
    index: 1,
  });
  const session = state.session!;
  const a = editInteraction(session, state.history.present, session.target, noop, noop).snapping;
  const b = editInteraction(session, state.history.present, session.target, noop, noop).snapping;
  assert.equal(a, b);
  const refs = prepareToolReferences(a, projectSnapReferences(base));
  assert.ok(
    sameHoverSession(
      { enabled: true, references: refs, pixelsPerMetre: 50 },
      { enabled: true, references: refs, pixelsPerMetre: 200 },
    ),
  );
  const origin = { x: 1, y: 2 },
    draw = drawingSnapPolicy(origin);
  assert.equal(draw, drawingSnapPolicy(origin));
  assert.notEqual(draw, drawingSnapPolicy({ ...origin }));
  assert.equal(
    prepareToolReferences(null, projectSnapReferences(base)).some(
      (r) => r.entityId === "@edit-origin",
    ),
    false,
  );
});
test("drawing and idle hover use same resolver with Shift origin and Snap off respected", () => {
  const origin = { x: 1, y: 2 },
    policy = drawingSnapPolicy(origin),
    refs = prepareToolReferences(policy, []);
  const context = {
    references: refs,
    pixelsPerMetre: 100,
    enabled: true,
    endpointRadiusPx: 10,
    gridSpacing: null,
    activeReferences: [policy.origin],
  };
  const result = resolveToolSnap(policy, { x: 3, y: 3.9 }, context, {
    ortho: false,
    shift: true,
    featureSnap: true,
  });
  assert.equal(result.candidate?.kind, "angle");
  assert.ok(Math.abs(result.point.x - 1 - (result.point.y - 2)) < 1e-10);
  const disabled = resolveToolSnap(
    policy,
    { x: 3, y: 3.9 },
    { ...context, enabled: false },
    { ortho: false, shift: false, featureSnap: true },
  );
  assert.deepEqual(disabled.point, { x: 3, y: 3.9 });
  const idle = resolveToolSnap(null, origin, context, {
    ortho: false,
    shift: false,
    featureSnap: true,
  });
  assert.deepEqual(idle.point, origin);
});
