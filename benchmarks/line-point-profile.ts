import assert from "node:assert/strict";
import { hatchPointFixture } from "./hatch-point-fixture.ts";
import { buildingViewFixture } from "./building-view-fixture.ts";
import { previewEdit } from "../src/application/direct-edit/controller.ts";
import { prepareDirectEditPreview } from "../src/application/direct-edit/prepared-preview.ts";
import {
  editAtPointer,
  editAnchor,
  type EditSession,
} from "../src/application/direct-edit/session.ts";
import { storeyOf } from "../src/domain/storeys/access.ts";
import { derivePlanScene } from "../src/rendering/viewport/plan-scene.ts";
import { defaultLineAppearance } from "../src/lib/bim/lines.ts";
import { validateProject } from "../src/domain/project/schema.ts";
const profiles = [];
for (const size of [10, 100])
  for (const kind of ["hatch-point", "line-point", "window-axis", "wall-stretch"] as const) {
    let base =
      kind.startsWith("hatch") || kind.startsWith("line")
        ? hatchPointFixture(size, 100)
        : buildingViewFixture(size);
    if (kind === "line-point") {
      storeyOf(base).lines!.push({
        id: "audit-line",
        kind: "line",
        layerId: base.defaultLayerIds.line,
        points: [
          { x: 0, y: 0 },
          { x: 3, y: 0 },
        ],
        ...defaultLineAppearance,
      });
      base = validateProject(base);
    }
    const level = storeyOf(base);
    const target =
      kind === "hatch-point"
        ? { kind: "hatch" as const, id: "h0" }
        : kind === "line-point"
          ? { kind: "line" as const, id: "audit-line" }
          : kind === "window-axis"
            ? { kind: "window" as const, id: level.windows[0]!.id }
            : { kind: "wall" as const, id: level.walls[0]!.id };
    const anchor = kind === "wall-stretch" ? { ...level.walls[0]!.end } : editAnchor(base, target);
    const session: EditSession = {
      base,
      target,
      anchor,
      action: kind === "window-axis" ? "axis" : kind === "wall-stretch" ? "stretch" : "point",
      index: kind === "window-axis" ? null : kind === "wall-stretch" ? 1 : 0,
    };
    const start = performance.now();
    const prepared = prepareDirectEditPreview(session);
    const preparationMs = performance.now() - start;
    const samples: Record<string, number>[] = [];
    for (let i = 0; i < 9; i++) {
      const point = { x: anchor.x + (i + 1) * 0.01, y: anchor.y };
      const times: Record<string, number> = {};
      const readProject = () => {
        let t = performance.now();
        const next = previewEdit(session, base, target, point);
        times["projectPreviewMs"] = performance.now() - t;
        t = performance.now();
        derivePlanScene(next, () => true, base.hatchPatterns);
        times["fullPlanMs"] = performance.now() - t;
        t = performance.now();
        const full = editAtPointer(session, base, point);
        times["fullActionMs"] = performance.now() - t;
        assert.deepEqual(next, full);
      };
      const readPatch = () => {
        if (!prepared) return;
        let t = performance.now();
        const patch = prepared.evaluate(base, target, point);
        times["patchMs"] = performance.now() - t;
        t = performance.now();
        derivePlanScene(patch.geometry, () => true, base.hatchPatterns);
        times["patchPlanMs"] = performance.now() - t;
      };
      if (i % 2) {
        readPatch();
        readProject();
      } else {
        readProject();
        readPatch();
      }
      samples.push(times);
    }
    const medians = Object.fromEntries(
      Object.keys(samples[0]!).map((key) => {
        const values = samples
          .slice(1)
          .map((s) => s[key]!)
          .sort((a, b) => a - b);
        return [key, (values[3]! + values[4]!) / 2];
      }),
    );
    profiles.push({
      kind,
      size,
      storeys: base.storeys.length,
      hatches: base.storeys.reduce((n, s) => n + s.hatches.length, 0),
      walls: base.storeys.reduce((n, s) => n + s.walls.length, 0),
      preparedCapability: !!prepared,
      preparationMs,
      samples,
      warmMedians: medians,
    });
  }
console.log(
  JSON.stringify(
    {
      method:
        "Node, one first and eight warm samples, alternating project/patch order, full action timed separately, equality checked outside timings. Plan derivation only, no DOM/GPU/frame or snapping measurement. Synthetic unconnected fixtures; not a worst-case guarantee.",
      profiles,
    },
    null,
    2,
  ),
);
