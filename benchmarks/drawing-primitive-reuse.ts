import assert from "node:assert/strict";
import { drawingPrimitiveCandidate } from "./drawing-primitive-candidate.ts";
import { hatchPointFixture } from "./hatch-point-fixture.ts";
import { storeyOf } from "../src/domain/storeys/access.ts";
import { projectSnapPrimitives } from "../src/application/snapping/project-references.ts";
import { createPrimitiveSourceIndex } from "../src/constraints/snapping/local-source-index.ts";
import { referenceKey } from "../src/constraints/inference/construction-reference.ts";
import { createEditingState, editingReducer } from "../src/application/direct-edit/controller.ts";
import type { Project } from "../src/domain/project/schema.ts";
let comparisons = 0;
function compare(project: Project, cache: ReturnType<typeof drawingPrimitiveCandidate>) {
  const original = projectSnapPrimitives(project),
    candidate = cache.build(project);
  assert.deepEqual(candidate, original);
  const a = createPrimitiveSourceIndex(original),
    b = createPrimitiveSourceIndex(candidate);
  for (const cursor of [
    { x: -18, y: 1 },
    { x: 10, y: 0 },
    { x: 0, y: 10 },
    { x: 300, y: 0 },
  ])
    for (const allowed of [() => true, (r: { entityId: string }) => r.entityId !== "h0"])
      for (const scale of [2, 200]) {
        assert.deepEqual(b.query(cursor, scale, 12, allowed), a.query(cursor, scale, 12, allowed));
        comparisons++;
      }
  for (const ref of original.references) assert.deepEqual(b.lookup(referenceKey(ref)), ref);
  assert.deepEqual(b.allSegments, a.allSegments);
  return candidate;
}
const small = hatchPointFixture(3, 10);
const cache = drawingPrimitiveCandidate(100, 5);
const first = compare(small, cache);
const copied = structuredClone(small);
const second = compare(copied, cache);
assert.equal(second.references[0], first.references[0]);
assert.equal(cache.stats().hits, 3);
// Mutable caller data cannot mutate retained signatures or derived data.
storeyOf(copied).hatches[0]!.points[0]!.x += 0.1;
compare(copied, cache);
assert.equal(cache.stats().hits, 2);
assert.throws(() => {
  first.references[0]!.point.x = 999;
}, TypeError);
storeyOf(copied).hatches.splice(1, 1);
compare(copied, cache);
assert.equal(cache.stats().entries, 2);
compare({ ...small, id: "different-project" }, cache);
assert.equal(cache.stats().hits, 0);
compare({ ...small, workingStoreyId: "upper" }, cache);
assert.equal(cache.stats().entries, 0);
compare(small, cache);
assert.equal(cache.stats().hits, 0);
const bounded = drawingPrimitiveCandidate(15, 1);
compare(small, bounded);
compare(small, bounded);
assert.equal(bounded.stats().entries, 1);
assert.equal(bounded.stats().hits, 1);

const rows = [];
for (const size of [100, 1000])
  for (const kind of ["line", "hatch"] as const) {
    const input = hatchPointFixture(size, 100);
    const points = [
      { x: -20, y: 0 },
      { x: -17, y: 1 },
      { x: -17, y: 4 },
      { x: -20, y: 4 },
    ];
    if (kind === "hatch")
      storeyOf(input).hatches.push({ ...storeyOf(input).hatches[0]!, id: "target", points });
    else
      storeyOf(input).lines = [
        {
          id: "target",
          kind: "polyline",
          points: [...points, { ...points[0]! }],
          layerId: input.defaultLayerIds.line,
          color: "#334155",
          penWidth: 0.2,
          style: "solid",
        },
      ];
    const start = createEditingState(input),
      base = start.history.present;
    const target = { kind, id: "target" };
    const editing = editingReducer(start, {
      type: "begin",
      target,
      action: "stretch",
      index: 1,
      anchor: points[1]!,
    });
    assert.ok(editing.session);
    const committed = editingReducer(editing, {
      type: "confirm",
      session: editing.session,
      selection: target,
      point: { x: -16.8, y: 1 },
    });
    assert.equal(committed.error, "");
    const next = committed.history.present;
    const check = drawingPrimitiveCandidate();
    compare(base, check);
    compare(next, check);
    assert.equal(check.stats().hits, size);
    compare(editingReducer(committed, { type: "undo" }).history.present, check);
    compare(
      editingReducer(editingReducer(committed, { type: "undo" }), { type: "redo" }).history.present,
      check,
    );
    for (let repeat = 0; repeat < 4; repeat++) {
      const pilot = drawingPrimitiveCandidate();
      const measure = (project: Project, candidate: boolean) => {
        global.gc?.();
        const before = process.memoryUsage().heapUsed,
          start = performance.now();
        const index = createPrimitiveSourceIndex(
          candidate ? pilot.build(project) : projectSnapPrimitives(project),
        );
        const ms = performance.now() - start,
          allocatedHeapDelta = process.memoryUsage().heapUsed - before;
        global.gc?.();
        const retainedHeapDelta = process.memoryUsage().heapUsed - before;
        assert.equal(index.sourceCount, size * 200 + (kind === "line" ? 9 : 8));
        return { ms, allocatedHeapDelta, retainedHeapDelta };
      };
      for (const [phase, project] of [
        ["cold", base],
        ["changed", next],
      ] as const) {
        const order = repeat % 2 ? [true, false] : [false, true];
        const measured = order.map((candidate) => ({ candidate, ...measure(project, candidate) }));
        rows.push({ size, kind, repeat, phase, measured, cache: pilot.stats() });
      }
    }
  }
console.log(
  JSON.stringify(
    {
      basis: "PR436 7cd7145",
      runtime: process.version,
      comparisons,
      method:
        "Full primitive + spatial index build; four alternating orders per phase/type/size. Separate GC retained heap delta, not peak RAM. No browser/frame claim. Exact full data, lookup and ordered local queries; real commit/undo/redo, deletion/context/mutation/budget checks.",
      rows,
    },
    null,
    2,
  ),
);
