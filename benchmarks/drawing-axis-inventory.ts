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
import { editMovementAxis } from "../src/application/tools/adapters.ts";
import {
  createLayerVisibilityPolicy,
  ALL_LAYERS_VISIBLE,
} from "../src/application/layers/visibility.ts";
import {
  beginSelectionMove,
  previewSelectionMove,
  previewSelectionGeometry,
  selectionMoveInteraction,
} from "../src/application/selection/move.ts";
const timed = <T>(fn: () => T) => {
  const start = performance.now();
  const value = fn();
  return { value, ms: performance.now() - start };
};
const rows = [];
const fixedAdapters = process.argv.includes("--fixed-adapter");
const sharedAxis = process.argv.includes("--shared-axis");
const elementAdapters = process.argv.includes("--element-adapter");
assert.ok(
  [fixedAdapters, sharedAxis, elementAdapters].filter(Boolean).length <= 1,
  "Choose one protocol variant",
);
const actions: readonly ("x" | "y" | "axis")[] = fixedAdapters
  ? ["x", "y"]
  : elementAdapters
    ? ["axis"]
    : ["x", "y", "axis"];
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
    for (const action of actions) {
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
      let published: typeof base | null = null;
      const policy = createLayerVisibilityPolicy(base, ALL_LAYERS_VISIBLE);
      const adapterPreparation = timed(() =>
        (fixedAdapters && action !== "axis") || elementAdapters
          ? selectionMoveInteraction(
              preparation.value,
              base,
              [target],
              policy,
              (next) => {
                published = next;
              },
              () => {},
              action === "axis" ? editMovementAxis(session)! : action,
            )
          : null,
      );
      const adapter = adapterPreparation.value;
      // Preserve the raw pinned contour vector; pre-normalizing changes exact arithmetic.
      const axisDirection =
        (sharedAxis || elementAdapters) && action === "axis" ? direction : undefined;
      const sharedProject = (point: typeof anchor) =>
        previewSelectionMove(preparation.value, base, [target], point, undefined, axisDirection);
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
              adapter
                ? adapter.geometryPreview!.evaluate(projected)
                : previewSelectionGeometry(
                    preparation.value,
                    base,
                    [target],
                    projected,
                    undefined,
                    axisDirection,
                  ),
            );
            patch = r.value;
            patchMs = r.ms;
          }
        }
        const equal = isDeepStrictEqual;
        const field = kind === "line" ? "lines" : "hatches";
        const projectEqual = equal(sharedProject(projected), full);
        const targetEqual = equal(storeyOf(patch.geometry)[field]?.[0], storeyOf(full)[field]?.[0]);
        if (!projectEqual) projectMismatches++;
        if (!targetEqual) targetMismatches++;
        const numeric = previewNumericMove(session, base, target, String((i - 4) * 0.17));
        if (adapter)
          assert.deepEqual(adapter.preview("", String((i - 4) * 0.17), null).point, numeric.point);
        if (!equal(sharedProject(numeric.point), numeric.project)) numericMismatches++;
        const maxNumericDifference = numericDifference(sharedProject(projected), full);
        const numericMaxDifference = numericDifference(
          sharedProject(numeric.point),
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
          if (adapter) {
            adapter.confirm!(projected);
            assert.deepEqual(published, full);
          }
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
        if (sharedAxis || elementAdapters) {
          assert.ok(projectEqual);
          assert.ok(targetEqual);
          assert.deepEqual(sharedProject(numeric.point), numeric.project);
        }
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
        adapterPreparationMs: adapterPreparation.ms,
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
      basis: elementAdapters
        ? "main 3fb1943 after PR426 plus shared element-axis adapter"
        : fixedAdapters
          ? "main be0c9b4 after PR424 plus shared fixed XY adapter"
          : sharedAxis
            ? "main 4020047 after PR425 plus common direction-offset calculation"
            : "Current working tree; original PR423 comparison protocol",
      fixedAdapters,
      sharedAxis,
      elementAdapters,
      runtime: process.version,
      method:
        "Projected mouse targets and signed numeric targets; index1, arbitrary origin. Full path reprojects axis targets as production does. Exact comparisons outside timings, axis mismatches explicitly retained. One preparation, first+8 warm, alternating path order. API only, no snap/React/render/commit/frame timing.",
      rows,
    },
    null,
    2,
  ),
);
