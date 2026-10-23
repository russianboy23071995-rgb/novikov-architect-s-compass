import assert from "node:assert/strict";
import { hatchPointFixture } from "./hatch-point-fixture.ts";
import { createProjectSnapshot } from "../src/domain/project/owned-snapshot.ts";
import { storeyOf } from "../src/domain/storeys/access.ts";
import { validateProject } from "../src/lib/bim/model.ts";
import { editAtPointer, type EditSession } from "../src/lib/bim/direct-edit.ts";
import { prepareDirectEditPreview } from "../src/application/direct-edit/prepared-preview.ts";
import { previewEdit } from "../src/application/direct-edit/controller.ts";
import { derivePlanScene, planSceneRuns } from "../src/rendering/viewport/plan-scene.ts";
import { drawingWallVisibility } from "../src/rendering/viewport/layer-display.ts";
import { createLayerVisibilityPolicy } from "../src/application/layers/visibility.ts";
import { getLocalSnapSources } from "../src/application/snapping/local-sources.ts";
import { createVisibleToolSourceQuery } from "../src/application/tools/snapping.ts";
const timed = <T>(fn: () => T) => {
  const start = performance.now();
  const value = fn();
  return { value, ms: performance.now() - start };
};
const rows = [];
for (const size of [10, 100, 1000])
  for (const kind of ["line", "hatch"] as const)
    for (const hidden of [false, true]) {
      const input = hatchPointFixture(size, 100);
      const level = storeyOf(input);
      const points = [
        { x: -20, y: 0 },
        { x: -17, y: 1 },
        { x: -17, y: 4 },
        { x: -20, y: 4 },
      ];
      // Keep target small, and spatially separated from the growing unchanged remainder.
      for (const h of level.hatches) h.layerId = input.defaultLayerIds.wall;
      if (kind === "line")
        level.lines = [
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
      else
        level.hatches.push({
          ...level.hatches[0]!,
          id: "target",
          layerId: input.defaultLayerIds.line,
          points,
        });
      const base = createProjectSnapshot(validateProject(input));
      const target = { kind, id: "target" };
      const session: EditSession = {
        base,
        target,
        action: "stretch",
        index: 1,
        anchor: points[1]!,
      };
      const preparation = timed(() => prepareDirectEditPreview(session)!);
      const visibility = timed(() =>
        createLayerVisibilityPolicy(base, {
          scope: { kind: "bim-project" },
          hiddenLayerIds: hidden ? [input.defaultLayerIds.wall] : [],
        }),
      );
      const sources = timed(() => getLocalSnapSources(base));
      const query = createVisibleToolSourceQuery(
        base,
        visibility.value,
        visibility.value.context,
        null,
      );
      const samples: Record<string, number>[] = [];
      for (let i = 0; i < 9; i++) {
        const cursor = { x: -17 + (i - 4) * 0.02, y: 1.03 };
        const cachedSources = timed(() => getLocalSnapSources(base));
        assert.equal(cachedSources.value, sources.value);
        const snap = timed(() => query(cursor, 200, 12, []));
        const patch = timed(() => preparation.value.evaluate(base, target, cursor));
        const materialized = timed(() => previewEdit(session, base, target, cursor));
        const allows = timed(() =>
          drawingWallVisibility(base, materialized.value, visibility.value),
        );
        const scene = timed(() =>
          derivePlanScene(materialized.value, allows.value, base.hatchPatterns),
        );
        const runs = timed(() => planSceneRuns(scene.value, []));
        const full = editAtPointer(session, base, cursor);
        assert.deepEqual(materialized.value, full);
        assert.deepEqual(
          scene.value,
          derivePlanScene(
            full,
            drawingWallVisibility(base, full, visibility.value),
            base.hatchPatterns,
          ),
        );
        assert.deepEqual(runs.value, planSceneRuns(scene.value, []));
        const collection = kind === "line" ? "lines" : "hatches";
        assert.deepEqual(
          storeyOf(patch.value.geometry)[collection]!.find((e) => e.id === "target"),
          storeyOf(full)[collection]!.find((e) => e.id === "target"),
        );
        samples.push({
          cachedSourcesMs: cachedSources.ms,
          snapQueryMs: snap.ms,
          patchMs: patch.ms,
          materializeMs: materialized.ms,
          visibilityMs: allows.ms,
          sceneMs: scene.ms,
          runsMs: runs.ms,
          visibleHatches: scene.value.plan.hatches.length,
          snapReferences: snap.value.length,
        });
      }
      const medians = Object.fromEntries(
        Object.keys(samples[0]!)
          .filter((k) => k.endsWith("Ms"))
          .map((key) => [
            key,
            samples
              .slice(1)
              .map((s) => s[key as keyof typeof s])
              .sort((a, b) => a! - b!)[4],
          ]),
      );
      rows.push({
        size,
        kind,
        hidden,
        prepareMs: preparation.ms,
        visibilityPreparationMs: visibility.ms,
        snapIndexPreparationMs: sources.ms,
        medians,
        samples,
      });
    }
console.log(
  JSON.stringify(
    {
      basis: "PR430 a64ae44",
      runtime: process.version,
      method:
        "Actual BimPlan queries on committed base and materialized preview; fixed four-point target, 10/100/1000 unrelated 100-point patterned hatches. First plus eight warm calls. Exact full-path comparisons outside timing. Source query uses neutral tool policy, not complete inference/Shift. No React reconciliation, SVG paint, GPU or frame timing. No production changes.",
      comparisons: rows.length * 9,
      rows,
    },
    null,
    2,
  ),
);
