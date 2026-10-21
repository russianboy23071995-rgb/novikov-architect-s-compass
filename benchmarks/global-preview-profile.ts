import assert from "node:assert/strict";
import { cpus, platform } from "node:os";
import { boundHeightFixture } from "./bound-height-fixture.ts";
import { validateProject } from "../src/lib/bim/model.ts";
import { buildBuildingSolid } from "../src/lib/bim/geometry.ts";
import { prepareSelectionTranslation } from "../src/application/selection/storey-translation.ts";
import {
  selectionMoveSurfaces,
  selectionMoveWindows,
} from "../src/rendering/viewport/selection-move-preview.ts";
import {
  buildingWindowSelectionSurfaces,
  windowSelectionEdges,
} from "../src/rendering/viewport/window-selection.ts";
import { createSolidBufferCache } from "../src/rendering/viewport/solid-buffer.ts";
import { surfaceFaces, surfaceFaceCount } from "../src/rendering/viewport/surface-patch.ts";
import { selectionEdges } from "../src/rendering/viewport/selection-outline.ts";

// Mirrors the CPU services called by BimSolidView, not React scheduling or a GPU frame.
const allows = () => true;
const selected = new Set(["eg-a", "eg-b"]);
const selectedWindows = new Set<string>(); // Windows follow hosts without being selected.
const summary = (values: number[]) => {
  const xs = [...values].sort((a, b) => a - b);
  return { median: xs[Math.floor(xs.length / 2)]!, p95: xs[Math.floor(xs.length * 0.95)]! };
};
const rows = [];
for (const withWindows of [false, true]) {
  for (const extra of [0, 100, 1000]) {
    const source = structuredClone(boundHeightFixture());
    const eg = source.storeys[0]!;
    eg.walls.push(
      ...Array.from({ length: extra }, (_, i) => ({
        ...eg.walls[0]!,
        id: `rest-${i}`,
        start: { x: 20 + i * 5, y: 10 },
        end: { x: 23 + i * 5, y: 10 },
      })),
    );
    if (withWindows)
      eg.windows.push(
        ...Array.from({ length: extra }, (_, i) => ({
          ...eg.windows[0]!,
          id: `rest-window-${i}`,
          wallId: `rest-${i}`,
        })),
      );
    const project = validateProject(source);
    const t0 = performance.now();
    const action = prepareSelectionTranslation(project, [...selected]);
    const t1 = performance.now();
    const solid = buildBuildingSolid(project);
    const t2 = performance.now();
    const cache = createSolidBufferCache();
    const initial = cache.update(solid, [0, 0, 0], selected);
    const t3 = performance.now();
    const stableWindows = buildingWindowSelectionSurfaces(project, allows);
    const t4 = performance.now();
    const samples: Record<string, number>[] = [];
    const uploads: number[] = [];
    let fullRebuilds = 0;
    for (let i = 0; i < 200; i++) {
      const times: Record<string, number> = {};
      let last = performance.now();
      const mark = (key: string) => {
        const now = performance.now();
        times[key] = now - last;
        last = now;
      };
      const patch = action.evaluate({ x: 0.01 + i / 1000, y: 0.1 });
      mark("evaluateMs");
      const display = selectionMoveSurfaces(solid, project, patch, allows);
      mark("surfaceCompositionMs");
      const packed = cache.update(display, [0, 0, 0], selected);
      mark("bufferUpdateMs");
      // Current BimSolidView recomputes this base when geometryPatch changes.
      const windows = buildingWindowSelectionSurfaces(project, allows);
      mark("windowBaseMs");
      const shown = selectionMoveWindows(windows, project, patch, allows);
      mark("windowCompositionMs");
      windowSelectionEdges(shown, selectedWindows);
      mark("windowOutlineMs");
      for (const id of selected) selectionEdges(surfaceFaces(display, id));
      surfaceFaceCount(display);
      mark("wallOutlineAndEmptyMs");
      // Separate diagnostic: cost remaining if only the base were memoized.
      selectionMoveWindows(stableWindows, project, patch, allows);
      mark("stableWindowCompositionMs");
      samples.push(times);
      uploads.push(
        packed.full?.byteLength ?? packed.patches.reduce((n, p) => n + p.data.byteLength, 0),
      );
      if (packed.full) fullRebuilds++;
    }
    // Full-model comparison outside all timed loops; no flat-face getter contaminates warm work.
    const delta = { x: 0.25, y: 0.1 };
    const patch = action.evaluate(delta);
    const fullProject = action.materialize(project, delta);
    const composed = selectionMoveSurfaces(solid, project, patch, allows);
    const full = buildBuildingSolid(fullProject);
    const groups = (faces: typeof full.faces) =>
      [...new Set(faces.map((f) => f.wallId))]
        .sort()
        .map((id) => [id, faces.filter((f) => f.wallId === id)]);
    assert.deepEqual(groups(composed.faces), groups(full.faces));
    const sortWindows = (windows: typeof stableWindows) =>
      [...windows].sort((a, b) => a.id.localeCompare(b.id));
    assert.deepEqual(
      sortWindows(selectionMoveWindows(stableWindows, project, patch, allows)),
      sortWindows(buildingWindowSelectionSurfaces(fullProject, allows)),
    );
    for (const face of full.faces)
      for (const v of face.vertices)
        for (const axis of [0, 1, 2] as const) {
          assert.ok(v[axis] >= composed.min[axis] && v[axis] <= composed.max[axis]);
        }
    rows.push({
      extraWalls: extra,
      extraWindows: withWindows ? extra : 0,
      totalWalls: project.storeys.reduce((n, s) => n + s.walls.length, 0),
      totalWindows: stableWindows.length,
      selectedWalls: selected.size,
      preparation: {
        actionMs: t1 - t0,
        solidMs: t2 - t1,
        bufferMs: t3 - t2,
        windowBaseMs: t4 - t3,
        plannedInitialUploadBytes: initial.full?.byteLength ?? 0,
      },
      first: samples[0],
      warm: Object.fromEntries(
        Object.keys(samples[0]!).map((key) => [
          key,
          summary(samples.slice(50).map((s) => s[key]!)),
        ]),
      ),
      plannedWarmUploadBytes: summary(uploads.slice(50)),
      fullRebuilds,
      samples,
      equivalence:
        "complete wall faces/windows against materialized validated project; conservative bounds contain full geometry",
    });
  }
}
console.log(
  JSON.stringify(
    {
      runtime: process.version,
      platform: platform(),
      cpu: cpus()[0]?.model,
      method:
        "Fixed two-wall selection; 200 samples, first separately, 50 warmup then 150 measured. Six synthetic cases in fixed order. Preparations are session-cold, not process-cold. CPU service timings and planned upload bytes only; no React, snapping, GPU, native or frame claim. stableWindowCompositionMs is a separate diagnostic, not part of current path. Validation outside timing.",
      rows,
    },
    null,
    2,
  ),
);
