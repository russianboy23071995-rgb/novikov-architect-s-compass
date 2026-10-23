import assert from "node:assert/strict";
import { isDeepStrictEqual as equal } from "node:util";
import { hatchPointFixture } from "./hatch-point-fixture.ts";
import { storeyOf } from "../src/domain/storeys/access.ts";
import {
  createEditingState,
  editingReducer,
  previewEdit,
} from "../src/application/direct-edit/controller.ts";
import { getLocalSnapSources } from "../src/application/snapping/local-sources.ts";
import { projectSnapPrimitives } from "../src/application/snapping/project-references.ts";
import { referenceKey } from "../src/constraints/inference/construction-reference.ts";
import { createLayerVisibilityPolicy } from "../src/application/layers/visibility.ts";
import { createVisibleToolSourceQuery } from "../src/application/tools/snapping.ts";
import { editInteraction } from "../src/application/tools/adapters.ts";
import { snapshotWithWorkingStorey } from "../src/domain/project/owned-snapshot.ts";
const timed = <T>(run: () => T) => {
  const start = performance.now();
  const value = run();
  return { value, ms: performance.now() - start };
};
const rows = [];
for (const size of [10, 100, 1000])
  for (const kind of ["line", "hatch"] as const) {
    const input = hatchPointFixture(size, 100),
      points = [
        { x: -20, y: 0 },
        { x: -17, y: 1 },
        { x: -17, y: 4 },
        { x: -20, y: 4 },
      ];
    if (kind === "line")
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
    else storeyOf(input).hatches.push({ ...storeyOf(input).hatches[0]!, id: "target", points });
    storeyOf(input).height = 3;
    const start = createEditingState(input),
      base = start.history.present,
      target = { kind, id: "target" };
    const initial = timed(() => getLocalSnapSources(base));
    const editing = editingReducer(start, {
      type: "begin",
      target,
      action: "stretch",
      index: 1,
      anchor: points[1]!,
    });
    assert.ok(editing.session);
    const session = editing.session;
    const control = [];
    for (let i = 0; i < 3; i++) {
      previewEdit(session, base, target, { x: -16.9 + i * 0.01, y: 1 });
      const cached = timed(() => getLocalSnapSources(base));
      assert.equal(cached.value, initial.value);
      control.push(cached.ms);
    }
    const visibility = createLayerVisibilityPolicy(base, {
      scope: { kind: "bim-project" },
      hiddenLayerIds: [base.defaultLayerIds.line],
    });
    for (const policy of [
      null,
      editInteraction(
        session,
        base,
        target,
        () => {},
        () => {},
      ).snapping,
    ]) {
      const query = createVisibleToolSourceQuery(base, visibility, visibility.context, policy);
      assert.ok(!query(points[1]!, 200, 12, []).some((r) => r.entityId === "target"));
      assert.equal(getLocalSnapSources(base), initial.value);
    }
    const commit = timed(() =>
      editingReducer(editing, {
        type: "confirm",
        session,
        selection: target,
        point: { x: -16.8, y: 1 },
      }),
    );
    assert.equal(commit.value.error, "");
    const next = commit.value.history.present;
    assert.notEqual(next, base);
    const rebuilt = timed(() => getLocalSnapSources(next));
    assert.notEqual(rebuilt.value, initial.value);
    assert.throws(() => previewEdit(session, next, target, points[1]!));
    const oldData = projectSnapPrimitives(base),
      newData = projectSnapPrimitives(next);
    const oldMap = new Map(oldData.references.map((r) => [referenceKey(r), r]));
    const unchanged = newData.references.filter((r) =>
      equal(oldMap.get(referenceKey(r)), r),
    ).length;
    const unchangedOther = newData.references.filter(
      (r) => r.entityId !== "target" && equal(oldMap.get(referenceKey(r)), r),
    ).length;
    assert.equal(unchangedOther, newData.references.filter((r) => r.entityId !== "target").length);
    const targetChanged = newData.references.filter(
      (r) => r.entityId === "target" && !equal(oldMap.get(referenceKey(r)), r),
    ).length;
    assert.ok(targetChanged > 0);
    const undone = editingReducer(commit.value, { type: "undo" }),
      redone = editingReducer(undone, { type: "redo" });
    const undoIndex = getLocalSnapSources(undone.history.present),
      redoIndex = getLocalSnapSources(redone.history.present);
    assert.equal(undoIndex, initial.value);
    assert.equal(redoIndex, rebuilt.value);
    const upper = snapshotWithWorkingStorey(base, "upper");
    const other = timed(() => getLocalSnapSources(upper));
    assert.notEqual(other.value, initial.value);
    assert.equal(other.value.sourceCount, 0);
    assert.equal(getLocalSnapSources(base), initial.value);
    rows.push({
      size,
      kind,
      initialMs: initial.ms,
      commitMs: commit.ms,
      rebuildMs: rebuilt.ms,
      previewBaseCacheMs: control,
      sourceCount: newData.references.length,
      unchangedSources: unchanged,
      unchangedOtherSources: unchangedOther,
      changedOrNewSources: newData.references.length - unchanged,
      targetChanged,
      unchangedHatchObjectIdentities: storeyOf(next).hatches.filter(
        (h, i) => h === storeyOf(base).hatches[i],
      ).length,
      upperMs: other.ms,
      undoReuses: true,
      redoReuses: true,
    });
  }
console.log(
  JSON.stringify(
    {
      basis: "PR4350fa04f0",
      runtime: process.version,
      method:
        "One real EditingReducer stretch commit per size/type. Index build measured separately from commit; reference comparison outside timing. Same-base preview/tool/visibility controls; undo/redo identity, stale preview rejection. Synthetic valid upper-storey context is empty; not a building-height action test. No browser/frame/peak-memory claim.",
      rows,
    },
    null,
    2,
  ),
);
