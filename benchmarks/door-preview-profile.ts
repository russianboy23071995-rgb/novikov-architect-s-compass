import { buildingDoorFixture } from "./building-view-fixture.ts";
import { prepareOpeningAxisPreview } from "../src/application/direct-edit/prepared-opening.ts";
import {
  editAnchor,
  editAtPointer,
  type EditSession,
} from "../src/application/direct-edit/session.ts";
import { buildBuildingSolid } from "../src/rendering/viewport/building-solid.ts";
import { selectionMoveSurfaces } from "../src/rendering/viewport/selection-move-preview.ts";

// 500 walls with 500 windows (centre) and 500 doors (left) across five storeys.
const p = buildingDoorFixture(100);

function profile(kind: "door" | "window") {
  const storey = p.storeys[0]!;
  const target = { kind, id: kind === "door" ? storey.doors![0]!.id : storey.windows[0]!.id };
  const session: EditSession = {
    base: p,
    target,
    action: "axis",
    index: null,
    anchor: editAnchor(p, target),
  };
  const solid = buildBuildingSolid(p);
  const t = performance.now(),
    prepared = prepareOpeningAxisPreview(session),
    preparationMs = performance.now() - t;
  const runs = [];
  for (let i = 0; i < 7; i++) {
    // Small steps stay inside the free range left of the window (door) or right of the door.
    const point = { x: session.anchor.x + (kind === "door" ? -0.02 : 0.05) * i, y: 0 };
    let start = performance.now();
    buildBuildingSolid(editAtPointer(session, p, point));
    const fullMs = performance.now() - start;
    start = performance.now();
    selectionMoveSurfaces(solid, p, prepared.evaluate(p, target, point));
    const preparedMs = performance.now() - start;
    runs.push({ fullMs, preparedMs });
  }
  return {
    kind,
    affectedWalls: prepared.affectedWalls,
    preparationMs,
    first: runs[0],
    warm: runs.slice(1),
  };
}

const median = (values: number[]) => values.sort((a, b) => a - b)[Math.floor(values.length / 2)]!;
const results = (["door", "window"] as const).map(profile);
console.log(
  JSON.stringify(
    {
      walls: 500,
      windows: 500,
      doors: 500,
      results,
      warmMedian: results.map((r) => ({
        kind: r.kind,
        fullMs: median(r.warm.map((w) => w.fullMs)),
        preparedMs: median(r.warm.map((w) => w.preparedMs)),
      })),
    },
    null,
    2,
  ),
);
