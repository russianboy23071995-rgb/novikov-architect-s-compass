import test from "node:test";
import assert from "node:assert/strict";
import { beginWallChain, appendWallChain, finishWallChain } from "./wall-chain.ts";
import { createProject, serializeProject, deserializeProject } from "../../lib/bim/model.ts";
import { createHistory, commitProject, undoProject, redoProject } from "../../lib/bim/history.ts";
import { exportIfc } from "../../lib/bim/ifc.ts";
import { drawingInteraction } from "../tools/adapters.ts";
import { buildSolid } from "../../lib/bim/geometry.ts";

test("closed triangular wall chain composes two oblique ends per wall and undoes as a whole", () => {
  const base = createProject("triangle", "s");
  let chain = beginWallChain(base, { x: 0, y: 0 });
  for (const [i, point] of [
    { x: 4, y: 0 },
    { x: 2, y: 3 },
    { x: 0, y: 0 },
  ].entries())
    chain = appendWallChain(chain, base, `wall-${i}`, point);
  const p = finishWallChain(chain, base);
  assert.equal(p.storey.wallJoins.length, 3);
  const inradius = 12 / (4 + 2 * Math.sqrt(13));
  const expected = 6 * (1 - (1 - 0.36 / inradius) ** 2) * 2.8;
  assert.ok(Math.abs(buildSolid(p).volume - expected) < 1e-8);
  assert.deepEqual(deserializeProject(serializeProject(p)), p);
  const history = commitProject(createHistory(base), p);
  assert.equal(history.past.length, 1);
  assert.deepEqual(undoProject(history).present, base);
  assert.deepEqual(redoProject(undoProject(history)).present, p);
});

test("closed wall chain is one atomic history action, persisted with stable IDs and all joins", async () => {
  const history = createHistory(createProject("p", "s")),
    base = history.present;
  const before = serializeProject(base);
  let chain = beginWallChain(base, { x: 0, y: 0 });
  for (const [i, point] of [
    { x: 3, y: 0 },
    { x: 3, y: 3 },
    { x: 0, y: 3 },
    { x: 0, y: 0 },
  ].entries())
    chain = appendWallChain(chain, base, `wall-${i}`, point);
  assert.equal(serializeProject(base), before);
  assert.equal(history.past.length, 0);
  assert.equal(chain.preview.storey.wallJoins.length, 4);
  assert.deepEqual(
    chain.preview.storey.walls.map((w) => w.id),
    chain.wallIds,
  );
  assert.ok(chain.preview.storey.walls.every((w) => w.bodyOffset === 0.18));
  const committed = commitProject(history, finishWallChain(chain, base));
  assert.equal(committed.past.length, 1);
  const undone = undoProject(committed);
  assert.deepEqual(undone.present, base);
  assert.deepEqual(redoProject(undone).present, committed.present);
  assert.deepEqual(deserializeProject(serializeProject(committed.present)), committed.present);
  const ifc = await exportIfc(committed.present);
  assert.equal((ifc.match(/=IFCARBITRARYCLOSEDPROFILEDEF\(/g) ?? []).length, 4);
});

test("invalid continuation preserves valid draft and allows correction; abandoned drafts never mutate base", () => {
  const base = createProject("p", "s");
  const start = beginWallChain(base, { x: 0, y: 0 });
  assert.throws(() => finishWallChain(start, base));
  const first = appendWallChain(start, base, "a", { x: 3, y: 0 });
  const snapshot = serializeProject(first.preview);
  for (const point of [
    { x: 3, y: 0 },
    { x: 4, y: 0 },
    { x: NaN, y: 0 },
  ])
    assert.throws(() => appendWallChain(first, base, "b", point));
  assert.equal(serializeProject(first.preview), snapshot);
  assert.equal(base.storey.walls.length, 0);
  assert.equal(
    appendWallChain(first, base, "b", { x: 3, y: 3 }).preview.storey.wallJoins.length,
    1,
  );
  assert.equal(finishWallChain(first, base).storey.walls.length, 1);
  assert.throws(() => beginWallChain(base, { x: Infinity, y: 0 }));
});

test("stale model contexts cannot append or commit a wall chain", () => {
  const base = createProject("p", "s");
  const chain = appendWallChain(beginWallChain(base, { x: 0, y: 0 }), base, "a", { x: 3, y: 0 });
  const changed = deserializeProject(serializeProject(base));
  assert.throws(() => appendWallChain(chain, changed, "b", { x: 3, y: 3 }), /geändert/);
  assert.throws(() => finishWallChain(chain, changed), /geändert/);
});

test("successive chain origins reuse the shared precision and snapping interaction", () => {
  const base = createProject("p", "s");
  let chain = beginWallChain(base, { x: 0, y: 0 });
  for (const [i, angle] of ["0", "90"].entries()) {
    const adapter = drawingInteraction(
      base,
      base,
      chain.points.at(-1)!,
      (point) => {
        chain = appendWallChain(chain, base, `wall-${i}`, point);
      },
      () => {},
      chain.points,
    );
    const result = adapter.preview(angle, "3", null);
    adapter.commit(result.point);
    assert.ok(adapter.snapping);
  }
  assert.deepEqual(chain.points, [
    { x: 0, y: 0 },
    { x: 3, y: 0 },
    { x: 3, y: 3 },
  ]);
  assert.equal(chain.preview.storey.wallJoins.length, 1);
});

import { addWall } from "../../lib/bim/model.ts";
import type { SnapContext } from "../../constraints/snapping/engine.ts";

function tDrawing() {
  const base = addWall(createProject("t-drawing", "s"), {
    id: "host",
    start: { x: 0, y: 0 },
    end: { x: 6, y: 0 },
    thickness: 0.36,
    height: 2.8,
    bodyOffset: 0.18,
  });
  const origin = { x: 3, y: -3 };
  const chain = beginWallChain(base, origin);
  const adapter = drawingInteraction(
    base,
    base,
    origin,
    () => {},
    () => {},
    chain.points,
    chain,
  );
  const context: SnapContext = {
    enabled: true,
    includeInteractionTargets: true,
    pixelsPerMetre: 100,
    endpointRadiusPx: 10,
    gridSpacing: 0.1,
    orthoOrigin: null,
    angleOrigin: null,
    references: [
      {
        entityId: "host",
        feature: "axis-midpoint:0",
        point: { x: 3, y: 0 },
        segment: { start: { x: 0, y: 0 }, end: { x: 6, y: 0 } },
      },
    ],
  };
  return { base, chain, adapter, context };
}

test("drawing T snap creates a persisted relation with one atomic undo and IFC", async () => {
  const { base, chain, adapter, context } = tDrawing();
  const snap = adapter.snapping.resolve({ x: 3.04, y: -0.03 }, context);
  assert.equal(snap.candidate?.sourceFeature, "t-axis");
  assert.deepEqual(snap.point, { x: 3, y: 0 });
  adapter.validate(snap.point, snap.candidate);
  assert.equal(base.storey.walls.length, 1);
  const draft = appendWallChain(chain, base, "new", snap.point, snap.candidate);
  const p = finishWallChain(draft, base);
  assert.equal(p.storey.wallTJunctions.length, 1);
  assert.deepEqual(deserializeProject(serializeProject(p)), p);
  assert.ok(buildSolid(p).volume > 0);
  assert.match(await exportIfc(p), /IFCWALL/);
  const history = commitProject(createHistory(base), p);
  assert.equal(history.past.length, 1);
  assert.deepEqual(undoProject(history).present, base);
  assert.deepEqual(redoProject(undoProject(history)).present, p);
});

test("drawing numeric coordinates alone do not create a T; stale intent is rejected atomically", () => {
  const { base, chain, adapter, context } = tDrawing();
  const snap = adapter.snapping.resolve({ x: 3, y: 0 }, context);
  assert.equal(
    appendWallChain(chain, base, "plain", snap.point).preview.storey.wallTJunctions.length,
    0,
  );
  assert.throws(
    () => appendWallChain(chain, base, "bad", { x: 3, y: 1 }, snap.candidate),
    /Fangziel/,
  );
  assert.equal(chain.preview, base);
  assert.throws(
    () =>
      appendWallChain(
        chain,
        deserializeProject(serializeProject(base)),
        "stale",
        snap.point,
        snap.candidate,
      ),
    /erneut beginnen/,
  );
});

test("drawing T snap respects disabled snapping, ambiguity and held direction", () => {
  const { adapter, context } = tDrawing();
  const cursor = { x: 3.04, y: -0.03 };
  assert.notEqual(
    adapter.snapping.resolve(cursor, { ...context, enabled: false }).candidate?.sourceFeature,
    "t-axis",
  );
  assert.notEqual(
    adapter.snapping.resolve(cursor, {
      ...context,
      references: [...context.references, { ...context.references[0]!, entityId: "other" }],
    }).candidate?.sourceFeature,
    "t-axis",
  );
  assert.notEqual(
    adapter.snapping.resolve(cursor, {
      ...context,
      fixedAxis: { origin: { x: 3, y: -3 }, direction: { x: 1, y: 0 } },
    }).candidate?.sourceFeature,
    "t-axis",
  );
});

test("continuing a T-connected draft into an unsupported corner leaves the accepted draft intact", () => {
  const { base, chain, adapter, context } = tDrawing();
  const snap = adapter.snapping.resolve({ x: 3, y: 0 }, context);
  const draft = appendWallChain(chain, base, "new", snap.point, snap.candidate);
  const saved = serializeProject(draft.preview);
  assert.throws(() => appendWallChain(draft, base, "next", { x: 5, y: 0 }));
  assert.equal(serializeProject(draft.preview), saved);
});

import { wallStartSnapPolicy } from "../tools/adapters.ts";
import { toolPinnedReferences } from "../tools/snapping.ts";

test("T start snaps locally without pinning a fake origin and commits with one undo", async () => {
  const { base, context } = tDrawing();
  assert.deepEqual(toolPinnedReferences(wallStartSnapPolicy), []);
  const snap = wallStartSnapPolicy.resolve({ x: 2.4, y: 0.03 }, context);
  assert.deepEqual(snap.point, { x: 2.4, y: 0 });
  assert.equal(snap.candidate?.sourceFeature, "t-axis");
  const chain = beginWallChain(base, snap.point, snap.candidate);
  assert.equal(chain.preview, base);
  const draft = appendWallChain(chain, base, "branch", { x: 2.4, y: -2 });
  const p = finishWallChain(draft, base);
  assert.deepEqual(p.storey.wallTJunctions, [
    { hostWallId: "host", incoming: { wallId: "branch", endpoint: 0 } },
  ]);
  assert.deepEqual(deserializeProject(serializeProject(p)), p);
  assert.ok(buildSolid(p).volume > 0);
  assert.match(await exportIfc(p), /IFCWALL/);
  const history = commitProject(createHistory(base), p);
  assert.equal(history.past.length, 1);
  assert.deepEqual(undoProject(history).present, base);
  assert.deepEqual(redoProject(undoProject(history)).present, p);
  assert.throws(() => appendWallChain(draft, base, "corner", { x: 4, y: -2 }), /T-Anschluss/);
});

test("T start validates both sides, rejects oblique and stale targets without mutation", () => {
  const { base, context } = tDrawing();
  const snap = wallStartSnapPolicy.resolve({ x: 2.4, y: 0 }, context);
  const chain = beginWallChain(base, snap.point, snap.candidate);
  assert.equal(
    appendWallChain(chain, base, "upper", { x: 2.4, y: 2 }).preview.storey.wallTJunctions.length,
    1,
  );
  assert.throws(() => appendWallChain(chain, base, "oblique", { x: 4, y: 2 }));
  assert.equal(chain.preview, base);
  assert.throws(() => beginWallChain(base, { x: 1, y: 1 }, snap.candidate));
  assert.throws(() =>
    appendWallChain(chain, deserializeProject(serializeProject(base)), "stale", { x: 2.4, y: 2 }),
  );
  assert.equal(
    appendWallChain(beginWallChain(base, snap.point), base, "plain", { x: 2.4, y: 2 }).preview
      .storey.wallTJunctions.length,
    0,
  );
});

test("T start respects source visibility, ambiguity, snap off and strict host interior", () => {
  const { context } = tDrawing();
  for (const request of [
    { ...context, enabled: false },
    { ...context, references: [] },
    { ...context, includeInteractionTargets: false },
    {
      ...context,
      references: [...context.references, { ...context.references[0]!, entityId: "other" }],
    },
    { ...context, selectedSegments: new Set<string>() },
  ])
    assert.notEqual(
      wallStartSnapPolicy.resolve({ x: 2.4, y: 0.03 }, request).candidate?.sourceFeature,
      "t-axis",
    );
  assert.notEqual(
    wallStartSnapPolicy.resolve({ x: 0, y: 0 }, context).candidate?.sourceFeature,
    "t-axis",
  );
});
