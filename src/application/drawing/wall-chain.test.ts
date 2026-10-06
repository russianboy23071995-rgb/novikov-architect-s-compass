import test from "node:test";
import assert from "node:assert/strict";
import { beginWallChain, appendWallChain, finishWallChain } from "./wall-chain.ts";
import { createProject, serializeProject, deserializeProject } from "../../lib/bim/model.ts";
import { createHistory, commitProject, undoProject, redoProject } from "../../lib/bim/history.ts";
import { exportIfc } from "../../lib/bim/ifc.ts";
import { drawingInteraction } from "../tools/adapters.ts";

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
    { x: 4, y: 1 },
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
