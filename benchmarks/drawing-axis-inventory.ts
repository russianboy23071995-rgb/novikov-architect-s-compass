import assert from "node:assert/strict";
import { isDeepStrictEqual } from "node:util";
import { hatchPointFixture } from "./hatch-point-fixture.ts";
import { storeyOf } from "../src/domain/storeys/access.ts";
import { validateProject } from "../src/lib/bim/model.ts";
import { defaultLineAppearance } from "../src/lib/bim/lines.ts";
import { createProjectSnapshot } from "../src/domain/project/owned-snapshot.ts";
import { type EditSession } from "../src/lib/bim/direct-edit.ts";
import {
  previewEdit,
  createEditingState,
  editingReducer,
} from "../src/application/direct-edit/controller.ts";
import { editDirection } from "../src/application/direct-edit/snapping.ts";
import { numericMoveAxis, previewNumericMove } from "../src/application/direct-edit/numeric.ts";
import { projectDirection } from "../src/geometry/projections/direction.ts";
import {
  beginSelectionMove,
  previewSelectionMove,
  previewSelectionGeometry,
} from "../src/application/selection/move.ts";
const timed = <T>(fn: () => T) => {
  const start = performance.now();
  const value = fn();
  return { value, ms: performance.now() - start };
};
const rows = [];
function numericDifference(a: unknown, b: unknown): number {
  if (Object.is(a, b)) return 0;
  if (typeof a === "number" && typeof b === "number") {
    assert.ok(Number.isFinite(a) && Number.isFinite(b));
    return Math.abs(a - b);
  }
  assert.ok(
    a !== null && b !== null && typeof a === "object" && typeof b === "object",
    "Non-numeric difference",
  );
  assert.deepEqual(Object.keys(a), Object.keys(b));
  return Math.max(
    0,
    ...Object.keys(a).map((k) =>
      numericDifference((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]),
    ),
  );
}
for (const size of [10, 100])
  for (const kind of ["line", "hatch"] as const)
    for (const action of ["x", "y", "axis"] as const) {
      const input = hatchPointFixture(size, 100);
      storeyOf(input).lines!.push({
        id: "line",
        kind: "polyline",
        layerId: input.defaultLayerIds.line,
        points: [
          { x: 0, y: 0 },
          { x: 3, y: 4 },
          { x: 6, y: 2 },
        ],
        ...defaultLineAppearance,
      });
      const base = createProjectSnapshot(validateProject(input));
      const target = { kind, id: kind === "line" ? "line" : "h0" };
      const anchor = { x: -2.25, y: 1.75 };
      const session: EditSession = { base, target, action, index: 1, anchor };
      const direction = editDirection(session)!;
      const axis = numericMoveAxis(session)!;
      const preparation = timed(() => beginSelectionMove(base, [target], anchor));
      const samples = [];
      let projectMismatches = 0,
        targetMismatches = 0,
        numericMismatches = 0;
      for (let i = 0; i < 9; i++) {
        const cursor = { x: anchor.x + (i - 4) * 0.17, y: anchor.y + (i % 2 ? -0.37 : 0.29) };
        const projected = projectDirection(cursor, anchor, direction)!;
        let full!: ReturnType<typeof previewEdit>,
          patch!: ReturnType<typeof previewSelectionGeometry>;
        let fullMs = 0,
          patchMs = 0;
        const order = i % 2 ? ["patch", "full"] : ["full", "patch"];
        for (const path of order) {
          if (path === "full") {
            const r = timed(() => previewEdit(session, base, target, projected));
            full = r.value;
            fullMs = r.ms;
          } else {
            const r = timed(() =>
              previewSelectionGeometry(preparation.value, base, [target], projected),
            );
            patch = r.value;
            patchMs = r.ms;
          }
        }
        const equal = isDeepStrictEqual;
        const field = kind === "line" ? "lines" : "hatches";
        const projectEqual = equal(
          previewSelectionMove(preparation.value, base, [target], projected),
          full,
        );
        const targetEqual = equal(storeyOf(patch.geometry)[field]?.[0], storeyOf(full)[field]?.[0]);
        if (!projectEqual) projectMismatches++;
        if (!targetEqual) targetMismatches++;
        const numeric = previewNumericMove(session, base, target, String((i - 4) * 0.17));
        if (
          !equal(
            previewSelectionMove(preparation.value, base, [target], numeric.point),
            numeric.project,
          )
        )
          numericMismatches++;
        const maxNumericDifference = numericDifference(
          previewSelectionMove(preparation.value, base, [target], projected),
          full,
        );
        const numericMaxDifference = numericDifference(
          previewSelectionMove(preparation.value, base, [target], numeric.point),
          numeric.project,
        );
        if (i === 8) {
          const started = editingReducer(createEditingState(base), {
            type: "begin",
            target,
            action,
            index: 1,
            anchor,
          });
          assert.ok(started.session);
          const committed = editingReducer(started, {
            type: "confirm",
            session: started.session,
            selection: target,
            point: projected,
          });
          assert.equal(committed.error, "");
          assert.deepEqual(committed.history.present, full);
          const undone = editingReducer(committed, { type: "undo" });
          assert.deepEqual(undone.history.present, base);
          assert.deepEqual(editingReducer(undone, { type: "redo" }).history.present, full);
        }
        samples.push({
          order,
          fullMs,
          patchMs,
          projectEqual,
          targetEqual,
          maxNumericDifference,
          numericMaxDifference,
        });
      }
      const median = (values: number[]) => {
        const sorted = values.slice(1).sort((a, b) => a - b);
        return (sorted[3]! + sorted[4]!) / 2;
      };
      rows.push({
        size,
        kind,
        action,
        direction,
        numericAxis: axis,
        preparationMs: preparation.ms,
        fullWarmMedianMs: median(samples.map((s) => s.fullMs)),
        patchWarmMedianMs: median(samples.map((s) => s.patchMs)),
        projectMismatches,
        targetMismatches,
        numericMismatches,
        samples,
      });
    }
console.log(
  JSON.stringify(
    {
      basis: "main 28db1af after PR422 (CI39654061739 green)",
      runtime: process.version,
      method:
        "Projected mouse targets and signed numeric targets; index1, arbitrary origin. Full path reprojects axis targets as production does. Exact comparisons outside timings, axis mismatches explicitly retained. One preparation, first+8 warm, alternating path order. API only, no snap/React/render/commit/frame timing.",
      rows,
    },
    null,
    2,
  ),
);
