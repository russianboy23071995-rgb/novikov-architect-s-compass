import test from "node:test";
import assert from "node:assert/strict";
import {
  advanceHoverReference,
  emptyHoverReference,
  suspendHoverReference,
  suspendHoverSnapshot,
} from "./hover-reference.ts";
import type { HoverContext } from "./hover-reference.ts";
import type { SnapReference } from "../snapping/engine.ts";

const ref: SnapReference = { entityId: "w", feature: "start", point: { x: 1, y: 2 } };

test("unchanged suspension and departure keep the acquisition state identity", () => {
  const pending = advanceHoverReference(emptyHoverReference(), ref, 0, 600);
  const suspended = suspendHoverReference(pending, false);
  assert.notEqual(suspended, pending);
  assert.equal(suspendHoverReference(suspended, false), suspended);
  assert.equal(suspendHoverReference(suspended, true), suspended);
  const acquired = advanceHoverReference(pending, ref, 600, 600);
  const left = suspendHoverReference(acquired, true);
  assert.equal(left.consumed, null);
  assert.equal(suspendHoverReference(left, true), left);
  assert.equal(suspendHoverReference(acquired, false), acquired);
  const departed = advanceHoverReference(acquired, null, 700, 600);
  assert.equal(advanceHoverReference(departed, null, 800, 600), departed);
  assert.equal(advanceHoverReference(pending, ref, 300, 600), pending);
});

test("a new context identity of the same session renders a suspension at most once", () => {
  // Reproduces an adapter that rebuilds its context on every render (24.10.2026 loop).
  const sessionKey = {};
  const context = (): HoverContext => ({
    enabled: true,
    suspended: true,
    references: [],
    pixelsPerMetre: 100,
    sessionKey,
  });
  let current = {
    context: context(),
    value: advanceHoverReference(emptyHoverReference(), ref, 0, 600),
    cursor: null,
    guides: [],
  };
  let renders = 0;
  for (let effect = 0; effect < 10; effect++) {
    const step = suspendHoverSnapshot(current, context(), true, true);
    current = step.snapshot;
    if (step.changed) renders++;
  }
  assert.equal(renders, 1);
  assert.equal(current.value.pending, null);
});

test("an unpublished snapshot is always rendered", () => {
  const current = {
    context: { enabled: true, references: [], pixelsPerMetre: 100 },
    value: emptyHoverReference(),
  };
  const step = suspendHoverSnapshot(current, current.context, true, false);
  assert.equal(step.changed, true);
  assert.equal(step.snapshot.value, current.value);
});
