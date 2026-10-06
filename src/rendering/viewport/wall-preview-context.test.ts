import test from "node:test";
import assert from "node:assert/strict";
import { createExampleProject } from "../../components/cad/bim-view.ts";
import { buildSolid, initialCamera } from "../../lib/bim/geometry.ts";
import { updateWall } from "../../lib/bim/model.ts";
import { createProjectionFrame } from "../../geometry/projections/orthographic.ts";
import { createProjectionState } from "./projection-state.ts";
import { createWallPreviewContext } from "./wall-preview-context.ts";
import {
  advanceHoverReference,
  emptyHoverReference,
  sameHoverSession,
  suspendHoverReference,
} from "../../constraints/inference/hover-reference.ts";

const project = createExampleProject();
function projection(yaw = 0, pitch = 0.5, zoom = 1) {
  return createProjectionState(
    createProjectionFrame(buildSolid(project)),
    { ...initialCamera, yaw, pitch, zoom },
    { left: 0, top: 0, width: 800, height: 600 },
    { width: 800, height: 600 },
  )!;
}
test("visible-only preview uses real footpoints and excludes generated/hidden references", () => {
  const { context } = createWallPreviewContext(project, projection(), true, 0);
  const refs = context.sourceQuery!({ x: 0, y: -0.18 }, 1, 10, []);
  const corner = refs.find((r) => r.feature === "corner-0--1")!;
  assert.ok(corner);
  assert.equal(context.acceptReference!(corner), true);
  assert.equal(corner.segment, undefined);
  assert.equal(context.acceptReference!({ ...corner, feature: "imaginary" }), false);
  const reverse = createWallPreviewContext(project, projection(Math.PI), true, 0);
  assert.equal(reverse.context.acceptReference!(corner), false);
});
test("3D preview preserves the shared 600ms toggle and navigation suspension", () => {
  const { context } = createWallPreviewContext(project, projection(), true, 0);
  const r = context.sourceQuery!({ x: 0, y: -0.18 }, 1, 10, [])[0]!;
  let state = advanceHoverReference(emptyHoverReference(), r, 0, 600);
  state = advanceHoverReference(state, r, 599, 600);
  assert.equal(state.references.length, 0);
  state = advanceHoverReference(state, r, 600, 600);
  assert.equal(state.references.length, 1);
  state = advanceHoverReference(state, r, 2000, 600);
  assert.equal(state.references.length, 1);
  state = suspendHoverReference(state, true);
  state = advanceHoverReference(state, r, 3000, 600);
  state = suspendHoverReference(state, false);
  assert.equal(state.pending, null);
  assert.equal(state.references.length, 1);
  state = advanceHoverReference(state, r, 5000, 600);
  state = advanceHoverReference(state, r, 5600, 600);
  assert.equal(state.references.length, 0);
});
test("camera/resize suspension retains session, model/escape/Snap changes invalidate it", () => {
  const a = createWallPreviewContext(project, projection(), true, 0).context;
  const b = createWallPreviewContext(project, projection(0.2, 0.6, 2), true, 0).context;
  assert.equal(sameHoverSession(a, b), true);
  const lost = createWallPreviewContext(project, null, true, 0).context;
  assert.equal(lost.suspended, true);
  assert.equal(sameHoverSession(a, lost), true);
  assert.equal(
    createWallPreviewContext(project, projection(0, 0), true, 0).context.suspended,
    true,
  );
  assert.equal(
    sameHoverSession(a, createWallPreviewContext(project, projection(), true, 1).context),
    false,
  );
  assert.equal(
    sameHoverSession(a, createWallPreviewContext(project, projection(), false, 0).context),
    false,
  );
  const changed = updateWall(project, "wall-1", { height: 3 });
  assert.equal(
    sameHoverSession(a, createWallPreviewContext(changed, projection(), true, 0).context),
    false,
  );
});
