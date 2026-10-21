import assert from "node:assert/strict";
import { cpus } from "node:os";
import { boundHeightFixture } from "./bound-height-fixture.ts";
import { validateProject } from "../src/lib/bim/model.ts";
import { createProjectSnapshot } from "../src/domain/project/owned-snapshot.ts";
import { buildBuildingSolid } from "../src/lib/bim/geometry.ts";
import { prepareViewportModel } from "../src/rendering/viewport/prepared-model.ts";
import { visibleSurfaces } from "../src/rendering/viewport/layer-display.ts";
import { prepareSelectionTranslation } from "../src/application/selection/storey-translation.ts";
import {
  selectionMoveSurfaces,
  selectionMoveWindows,
} from "../src/rendering/viewport/selection-move-preview.ts";
import { buildingWindowSelectionSurfaces } from "../src/rendering/viewport/window-selection.ts";
import { createSolidBufferCache, packSolidFaces } from "../src/rendering/viewport/solid-buffer.ts";
import { surfaceGroups } from "../src/rendering/viewport/surface-patch.ts";

const allows = () => true;
const time = <T>(fn: () => T) => {
  const start = performance.now();
  const value = fn();
  return { value, ms: performance.now() - start };
};
const rows = [];
// Seven fresh scene identities per size; fixed order is recorded, not randomized.
for (const ownership of ["mutable", "owned"] as const) {
  for (const extra of [0, 100, 1000]) {
    for (let trial = 0; trial < 7; trial++) {
      const source = structuredClone(boundHeightFixture());
      const eg = source.storeys[0]!;
      for (let i = 0; i < extra; i++) {
        eg.walls.push({
          ...eg.walls[0]!,
          id: `rest-${i}`,
          start: { x: 20 + i * 5, y: 10 },
          end: { x: 23 + i * 5, y: 10 },
        });
        eg.windows.push({ ...eg.windows[0]!, id: `rest-window-${i}`, wallId: `rest-${i}` });
      }
      // Snapshot creation for the owned case belongs to the prior commit/load, not this scene.
      const project =
        ownership === "owned" ? createProjectSnapshot(source) : validateProject(source);
      const query = time(() => prepareViewportModel(project));
      const solid = time(() => buildBuildingSolid(query.value.model));
      const visible = time(() => visibleSurfaces(solid.value, allows));
      const base = visible.value;
      const cache = createSolidBufferCache();
      const initial = time(() => cache.update(base, [0, 0, 0], new Set()));
      const windows = time(() => buildingWindowSelectionSurfaces(project, allows));
      const phases = [];
      const checks = [];
      // B changes the replacement set on the same storey, without changing cardinality.
      // With no rest walls use the equivalent upper-storey pair as a small baseline.
      const b = extra ? ["rest-0", "rest-1"] : ["og-a", "og-b"];
      for (const [label, ids] of [
        ["firstA", ["eg-a", "eg-b"]],
        ["sameA", ["eg-a", "eg-b"]],
        ["switchB", b],
        ["returnA", ["eg-a", "eg-b"]],
      ] as const) {
        // A new gesture prepares a fresh action; scene/window/buffer resources persist.
        const action = time(() => prepareSelectionTranslation(project, ids));
        const delta: { x: number; y: number } = { x: 0.25 + phases.length * 0.1, y: 0.1 };
        const patch = time(() => action.value.evaluate(delta));
        const display = time(() => selectionMoveSurfaces(base, project, patch.value, allows));
        const packed = time(() => cache.update(display.value, [0, 0, 0], new Set(ids)));
        const shownWindows = time(() =>
          selectionMoveWindows(windows.value, project, patch.value, allows),
        );
        phases.push({
          label,
          actionMs: action.ms,
          evaluateMs: patch.ms,
          compositionMs: display.ms,
          bufferMs: packed.ms,
          windowsMs: shownWindows.ms,
          fullUpload: !!packed.value.full,
          plannedBytes:
            packed.value.full?.byteLength ??
            packed.value.patches.reduce((n, p) => n + p.data.byteLength, 0),
        });
        checks.push({
          action: action.value,
          delta,
          display: display.value,
          windows: shownWindows.value,
        });
      }
      // Independent probes AFTER the lifecycle sequence. Not additive phases of initial.update.
      const groupProbe = time(() => surfaceGroups({ ...base }));
      const packProbe = time(() =>
        [...groupProbe.value.values()].map((faces) => packSolidFaces(faces, [0, 0, 0], false)),
      );
      const joinProbe = time(() => {
        const all = new Float32Array(packProbe.value.reduce((n, p) => n + p.length, 0));
        let offset = 0;
        for (const part of packProbe.value) {
          all.set(part, offset);
          offset += part.length;
        }
        return all;
      });
      assert.deepEqual(joinProbe.value, initial.value.full);
      // Full-path equivalence after ALL timed phases; never materialize a preview mid-sequence.
      const group = (s: typeof base) =>
        [...surfaceGroups(s)].sort(([a], [b]) => a.localeCompare(b));
      for (const check of checks) {
        const full = check.action.materialize(project, check.delta);
        assert.deepEqual(group(check.display), group(buildBuildingSolid(full)));
        const sort = (ws: typeof check.windows) => [...ws].sort((a, b) => a.id.localeCompare(b.id));
        assert.deepEqual(sort(check.windows), sort(buildingWindowSelectionSurfaces(full, allows)));
      }
      rows.push({
        ownership,
        extra,
        trial,
        scene: {
          queryMs: query.ms,
          solidMs: solid.ms,
          visibleMs: visible.ms,
          initialBufferMs: initial.ms,
          windowBaseMs: windows.ms,
          bytes: initial.value.full?.byteLength,
        },
        phases,
        independentProbes: {
          groupMs: groupProbe.ms,
          packMs: packProbe.ms,
          concatenateMs: joinProbe.ms,
        },
      });
    }
  }
}
console.log(
  JSON.stringify(
    {
      basis: "main 0dc7fab (PR406)",
      runtime: process.version,
      cpu: cpus()[0]?.model,
      method:
        "7 fresh scene identities per size and input provenance, fixed mutable then owned, 0/100/1000 extra walls+windows. Owned snapshot creation excluded as prior commit/load; mutable input checks included in each public preparation. Scene setup once, then four new gestures: A/A/B/A with distinct deltas, same immutable display base and retained GPU-buffer plan. B is two rest walls (baseline: OG pair); B has two hosted windows versus A one. Independent pack probes run afterward and are not additive initial-buffer phases. 168 full wall/window comparisons and 42 exact packed-buffer comparisons outside timing. Node CPU only, no React/snapping/GPU/frame/native measurement; process-cold/JIT/GC effects uncontrolled. Raw samples retained; no percentile claim from seven trials.",
      rows,
    },
    null,
    2,
  ),
);
