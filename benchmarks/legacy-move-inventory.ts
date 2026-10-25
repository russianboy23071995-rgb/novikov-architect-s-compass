import assert from "node:assert/strict";
import { cpus } from "node:os";
import { hatchPointFixture } from "./hatch-point-fixture.ts";
import { storeyOf } from "../src/domain/storeys/access.ts";
import { validateProject } from "../src/domain/project/schema.ts";
import { createProjectSnapshot } from "../src/domain/project/owned-snapshot.ts";
import { defaultLineAppearance } from "../src/lib/bim/lines.ts";
import { editAnchor, type EditSession } from "../src/lib/bim/direct-edit.ts";
import { previewEdit } from "../src/application/direct-edit/controller.ts";
import { prepareDirectEditPreview } from "../src/application/direct-edit/prepared-preview.ts";
import {
  beginSelectionMove,
  previewSelectionMove,
  previewSelectionGeometry,
} from "../src/application/selection/move.ts";
const time = <T>(fn: () => T) => {
  const start = performance.now();
  const value = fn();
  return { value, ms: performance.now() - start };
};
const rows = [];
for (const size of [10, 100])
  for (const kind of ["line", "hatch"] as const) {
    const input = hatchPointFixture(size, 100);
    storeyOf(input).lines!.push({
      id: "inventory-line",
      kind: "line",
      layerId: input.defaultLayerIds.line,
      points: [
        { x: 0, y: 0 },
        { x: 3, y: 0 },
      ],
      ...defaultLineAppearance,
    });
    const base = createProjectSnapshot(validateProject(input));
    const target = { kind, id: kind === "line" ? "inventory-line" : "h0" };
    const anchor = editAnchor(base, target);
    const session: EditSession = { base, target, action: "move", index: null, anchor };
    assert.equal(
      prepareDirectEditPreview(session),
      null,
      "Existing direct free-move path is unregistered",
    );
    const prepared = time(() => beginSelectionMove(base, [target], anchor));
    const samples = [];
    for (let i = 0; i < 9; i++) {
      const point = { x: anchor.x + (i + 1) * 0.02, y: anchor.y + 0.1 };
      let legacy!: ReturnType<typeof previewEdit>,
        patch!: ReturnType<typeof previewSelectionGeometry>;
      let legacyMs = 0,
        patchMs = 0;
      const order = i % 2 ? ["patch", "legacy"] : ["legacy", "patch"];
      for (const path of order) {
        if (path === "legacy") {
          const m = time(() => previewEdit(session, base, target, point));
          legacy = m.value;
          legacyMs = m.ms;
        } else {
          const m = time(() => previewSelectionGeometry(prepared.value, base, [target], point));
          patch = m.value;
          patchMs = m.ms;
        }
      }
      // Independent complete project and target geometry comparison outside timings.
      assert.deepEqual(previewSelectionMove(prepared.value, base, [target], point), legacy);
      const scoped = storeyOf(patch.geometry),
        full = storeyOf(legacy);
      if (kind === "line")
        assert.deepEqual(
          scoped.lines?.find((e) => e.id === target.id),
          full.lines?.find((e) => e.id === target.id),
        );
      else
        assert.deepEqual(
          scoped.hatches.find((e) => e.id === target.id),
          full.hatches.find((e) => e.id === target.id),
        );
      samples.push({ order, legacyMs, patchMs });
    }
    const median = (values: number[]) => {
      const s = values.slice(1).sort((a, b) => a - b);
      return (s[3]! + s[4]!) / 2;
    };
    rows.push({
      kind,
      size,
      preparationMs: prepared.ms,
      legacyWarmMedianMs: median(samples.map((s) => s.legacyMs)),
      sharedPatchWarmMedianMs: median(samples.map((s) => s.patchMs)),
      samples,
    });
  }
console.log(
  JSON.stringify(
    {
      basis: "main df3dcd5 (PR420)",
      runtime: process.version,
      cpu: cpus()[0]?.model,
      method:
        "Inventory probe, no product routing changes. 10/100 hatches x100 points plus one line. Owned input, one preparation, first+8 warm samples; order alternates. 36 complete projects and 36 scoped targets equal, including hatch pattern origin. No plan/React/snapping/commit/GPU/frame/browser claim. Node/JIT/GC/fixed fixture limits.",
      rows,
    },
    null,
    2,
  ),
);
