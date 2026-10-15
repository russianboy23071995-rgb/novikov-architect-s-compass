import { wallPatchFixture } from "./wall-patch-fixture.ts";
import { prepareDirectEditPreview } from "../src/application/direct-edit/prepared-preview.ts";
import { editAtPointer } from "../src/lib/bim/direct-edit.ts";
import { storeyOf } from "../src/domain/storeys/access.ts";
import type { EditSession } from "../src/lib/bim/direct-edit.ts";
import { buildBuildingSolid } from "../src/lib/bim/geometry.ts";
import { selectionMoveSurfaces } from "../src/rendering/viewport/selection-move-preview.ts";
for (const size of [10, 100]) {
  for (const mode of ["start", "shorten", "oblique"]) {
    const p = wallPatchFixture(size),
      target = { kind: "wall" as const, id: "wall-1" };
    const session: EditSession = {
      base: p,
      target,
      action: "point",
      index: mode === "start" ? 0 : 1,
      anchor: { x: mode === "start" ? 0 : 6, y: -10 },
    };
    const base = buildBuildingSolid(p),
      start = performance.now(),
      prepared = prepareDirectEditPreview(session)!;
    const preparationMs = performance.now() - start,
      runs = [];
    for (let i = 0; i < 9; i++) {
      const step = 0.1 + i * 0.1;
      const point = {
        x: mode === "start" ? step : mode === "shorten" ? 6 - step : 6 + step,
        y: mode === "oblique" ? -10 + step : -10,
      };
      let oldMs = 0,
        preparedMs = 0,
        affectedWalls = 0;
      const old = () => {
        const t = performance.now();
        buildBuildingSolid(editAtPointer(session, p, point));
        oldMs = performance.now() - t;
      };
      const current = () => {
        const t = performance.now();
        const patch = prepared.evaluate(p, target, point);
        selectionMoveSurfaces(base, p, patch);
        preparedMs = performance.now() - t;
        affectedWalls = storeyOf(patch.geometry).walls.length;
      };
      if (i % 2) {
        current();
        old();
      } else {
        old();
        current();
      }
      runs.push({ oldMs, preparedMs, affectedWalls });
    }
    console.log(
      JSON.stringify({
        mode,
        walls: size * 5 + 2,
        windows: size * 5 + 2,
        preparationMs,
        first: runs[0],
        warm: runs.slice(1),
      }),
    );
  }
}
