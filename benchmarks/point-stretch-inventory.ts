import assert from "node:assert/strict";
import { isDeepStrictEqual as equal } from "node:util";
import { hatchPointFixture } from "./hatch-point-fixture.ts";
import { createProjectSnapshot } from "../src/domain/project/owned-snapshot.ts";
import { storeyOf } from "../src/domain/storeys/access.ts";
import { validateProject, type Point } from "../src/domain/project/schema.ts";
import { defaultLineAppearance } from "../src/lib/bim/lines.ts";
import { editAtPointer, type EditSession } from "../src/lib/bim/direct-edit.ts";
import {
  previewEdit,
  createEditingState,
  editingReducer,
} from "../src/application/direct-edit/controller.ts";
import { prepareDirectEditPreview } from "../src/application/direct-edit/prepared-preview.ts";
import { editDirection } from "../src/application/direct-edit/snapping.ts";
import { previewNumericMove } from "../src/application/direct-edit/numeric.ts";

const timed = <T>(fn: () => T) => {
  const start = performance.now();
  const value = fn();
  return { value, ms: performance.now() - start };
};
const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)]!;
};
const preparedStretch = process.argv.includes("--prepared-stretch");
const rows = [];
let comparisons = 0,
  commits = 0,
  invalidChecks = 0;
for (const size of [10, 100])
  for (const kind of ["line", "hatch"] as const)
    for (const coordinate of [0, 1e9])
      for (const index of [0, 1, 3]) {
        const input = hatchPointFixture(size, 100);
        const points = [
          { x: 0, y: 0 },
          { x: 3, y: 1 },
          { x: 3, y: 4 },
          { x: 1.5, y: 2 },
          { x: 0, y: 4 },
        ].map((p) => ({ x: p.x + coordinate, y: p.y - coordinate }));
        if (kind === "line")
          storeyOf(input).lines!.push({
            id: "target",
            kind: "polyline",
            layerId: input.defaultLayerIds.line,
            points: [...points, { ...points[0]! }],
            ...defaultLineAppearance,
          });
        else storeyOf(input).hatches[0]!.points = points;
        const base = createProjectSnapshot(validateProject(input));
        const target = { kind, id: kind === "line" ? "target" : "h0" };
        const anchor = { x: points[index]!.x + 0.125, y: points[index]!.y - 0.25 };
        const session: EditSession = { base, target, action: "stretch", index, anchor };
        assert.equal(!!prepareDirectEditPreview(session), true);
        const preparation = timed(() =>
          prepareDirectEditPreview({ ...session, action: preparedStretch ? "stretch" : "point" })!,
        );
        const candidate = preparation.value;
        const direction = editDirection(session)!;
        const norm = Math.hypot(direction.x, direction.y);
        // Diagnostic bridge only: reproduces original stretch arithmetic, including its guard.
        // The extra absolute-target round trip is deliberately tested, not assumed exact.
        const bridge = (cursor: Point) => {
          if (preparedStretch) return cursor;
          const distance =
            ((cursor.x - anchor.x) * direction.x + (cursor.y - anchor.y) * direction.y) / norm;
          if (!Number.isFinite(distance) || norm + distance <= 1e-9)
            throw Error("stretch boundary");
          return {
            x: anchor.x + (direction.x / norm) * distance,
            y: anchor.y + (direction.y / norm) * distance,
          };
        };
        const samples = [];
        let projectMismatches = 0,
          targetMismatches = 0,
          numericMismatches = 0;
        for (let i = 0; i < 9; i++) {
          const cursor = { x: anchor.x + (i - 4) * 0.037, y: anchor.y + (i % 2 ? 0.029 : -0.043) };
          const fullRun = () => timed(() => editAtPointer(session, base, cursor));
          const patchRun = () => timed(() => candidate.evaluate(base, target, bridge(cursor)));
          const first = i % 2 ? patchRun() : fullRun();
          const second = i % 2 ? fullRun() : patchRun();
          const full = (i % 2 ? second : first) as ReturnType<typeof fullRun>;
          const patch = (i % 2 ? first : second) as ReturnType<typeof patchRun>;
          assert.deepEqual(full.value, editAtPointer(session, base, cursor));
          const materializeRun = timed(() => candidate.materialize!(base, target, bridge(cursor)));
          const materialized = materializeRun.value;
          const collection = kind === "line" ? "lines" : "hatches";
          const expected = storeyOf(full.value)[collection]!.find((v) => v.id === target.id);
          const actual = storeyOf(patch.value.geometry)[collection]!.find(
            (v) => v.id === target.id,
          );
          projectMismatches += Number(!equal(materialized, full.value));
          targetMismatches += Number(!equal(actual, expected));
          const numeric = previewNumericMove(session, base, target, String((i - 4) * 0.037));
          if (preparedStretch)
            assert.deepEqual(numeric.project, editAtPointer(session, base, numeric.point));
          numericMismatches += Number(
            !equal(candidate.materialize!(base, target, bridge(numeric.point)), numeric.project),
          );
          comparisons++;
          samples.push({
            fullMs: full.ms,
            patchMs: patch.ms,
            materializeMs: materializeRun.ms,
            projectEqual: equal(materialized, full.value),
            targetEqual: equal(actual, expected),
            ...(i === 0 && !equal(actual, expected)
              ? { expectedPoints: expected!.points, candidatePoints: actual!.points }
              : {}),
          });
          if (i === 8) {
            const start = editingReducer(createEditingState(base), {
              type: "begin",
              target,
              action: "stretch",
              index,
              anchor,
            });
            assert.ok(start.session);
            const committed = editingReducer(start, {
              type: "confirm",
              session: start.session,
              selection: target,
              point: cursor,
            });
            assert.equal(committed.error, "");
            assert.deepEqual(committed.history.present, full.value);
            const undone = editingReducer(committed, { type: "undo" });
            assert.deepEqual(undone.history.present, base);
            assert.deepEqual(editingReducer(undone, { type: "redo" }).history.present, full.value);
            assert.deepEqual(editingReducer(start, { type: "cancel" }).history.present, base);
            commits++;
          }
        }
        const crossing = { x: anchor.x - direction.x * 2, y: anchor.y - direction.y * 2 };
        assert.throws(() => previewEdit(session, base, target, crossing));
        if (preparedStretch) assert.throws(() => candidate.evaluate(base, target, crossing));
        else assert.throws(() => bridge(crossing));
        let unconstrainedPointAcceptsCrossing = true;
        try {
          candidate.evaluate(base, target, crossing);
        } catch {
          unconstrainedPointAcceptsCrossing = false;
        }
        assert.throws(() => previewEdit(session, base, target, { x: NaN, y: 0 }));
        assert.throws(() => candidate.evaluate({ ...base }, target, anchor));
        invalidChecks += 3;
        if (preparedStretch) {
          assert.equal(projectMismatches, 0);
          assert.equal(targetMismatches, 0);
          assert.equal(numericMismatches, 0);
          assert.equal(unconstrainedPointAcceptsCrossing, false);
        }
        rows.push({
          size,
          kind,
          coordinate,
          index,
          preparedStretch,
          preparationMs: preparation.ms,
          fullWarmMedianMs: median(samples.slice(1).map((s) => s.fullMs)),
          patchWarmMedianMs: median(samples.slice(1).map((s) => s.patchMs)),
          materializeWarmMedianMs: median(samples.slice(1).map((s) => s.materializeMs)),
          projectMismatches,
          targetMismatches,
          numericMismatches,
          unconstrainedPointAcceptsCrossing,
          samples,
        });
      }
console.log(
  JSON.stringify(
    {
      basis: preparedStretch
        ? "PR429 plus prepared drawing stretch"
        : "legacy bridge replay after PR429",
      runtime: process.version,
      method: preparedStretch
        ? "Full stretch vs actual prepared stretch adapter. Fixed five-vertex concave target, 10/100 unrelated 100-vertex hatches; preparation, patch and materialization separately. First plus eight warm calls, alternating full/patch order. Exact mouse and numeric checks against full path outside timing. No frame claim."
        : "Existing full stretch vs diagnostic bridge into existing prepared point action. Fixed five-vertex concave target, 10/100 unrelated 100-vertex hatches. Preparation separate; first plus eight warm alternating calls. Exact checks outside timing. No product changes or frame claim.",
      comparisons,
      commits,
      invalidChecks,
      rows,
    },
    null,
    2,
  ),
);
