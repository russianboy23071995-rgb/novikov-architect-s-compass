import { buildingViewFixture } from "./building-view-fixture.ts";
import { prepareWindowAxisPreview } from "../src/application/direct-edit/prepared-window.ts";
import { editAnchor, editAtPointer, type EditSession } from "../src/lib/bim/direct-edit.ts";
import { buildBuildingSolid } from "../src/lib/bim/geometry.ts";
import { selectionMoveSurfaces } from "../src/rendering/viewport/selection-move-preview.ts";
const p = buildingViewFixture(100),
  target = { kind: "window" as const, id: p.storeys[0]!.windows[0]!.id };
const session: EditSession = {
    base: p,
    target,
    action: "axis",
    index: null,
    anchor: editAnchor(p, target),
  },
  solid = buildBuildingSolid(p);
const t = performance.now(),
  prepared = prepareWindowAxisPreview(session),
  preparationMs = performance.now() - t;
const runs = [];
for (let i = 0; i < 7; i++) {
  const point = { x: session.anchor.x + i * 0.1, y: 0 };
  let start = performance.now();
  buildBuildingSolid(editAtPointer(session, p, point));
  const fullMs = performance.now() - start;
  start = performance.now();
  selectionMoveSurfaces(solid, p, prepared.evaluate(p, target, point));
  const preparedMs = performance.now() - start;
  runs.push({ fullMs, preparedMs });
}
console.log(
  JSON.stringify({
    walls: 500,
    windows: 500,
    affectedWalls: prepared.affectedWalls,
    preparationMs,
    first: runs[0],
    warm: runs.slice(1),
  }),
);
