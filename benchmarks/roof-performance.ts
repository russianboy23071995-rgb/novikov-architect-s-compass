// node --experimental-strip-types benchmarks/roof-performance.ts
// Dach D5 (docs/ROOF_ELEMENT.md): cold build of building solid, plan scene and IFC export of the
// school plan fixture (3 wings, 50 desks per room) without and with 20 roofs (5 x 4 grid over the top storey).
import { schoolPlanFixture } from "./school-plan-fixture.ts";
import { selectWorkingStorey } from "../src/application/storeys/working-storey.ts";
import { addRoof } from "../src/application/roofs/actions.ts";
import { buildBuildingSolid } from "../src/rendering/viewport/building-solid.ts";
import { derivePlanScene } from "../src/rendering/viewport/plan-scene.ts";
import { exportIfc } from "../src/lib/bim/ifc.ts";
import { storeyOf } from "../src/domain/storeys/access.ts";

const base = schoolPlanFixture({ wings: 3, desksPerRoom: 50 });
const top = base.storeys.at(-1)!;
let p = selectWorkingStorey(base, base, top.id);
const xs = top.walls.flatMap((w) => [w.start.x, w.end.x]),
  ys = top.walls.flatMap((w) => [w.start.y, w.end.y]);
const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
const n = 5,
  w = (x1 - x0) / n,
  h = (y1 - y0) / 4;
let count = 0;
for (let i = 0; i < n; i++)
  for (let j = 0; j < 4; j++) {
    const ax = x0 + i * w,
      ay = y0 + j * h;
    p = addRoof(p, {
      id: `r${i}-${j}`,
      points: [
        { x: ax, y: ay },
        { x: ax + w, y: ay },
        { x: ax + w, y: ay + h },
        { x: ax, y: ay + h },
      ],
      referenceLine: { start: { x: ax, y: ay }, end: { x: ax + w, y: ay } },
      rise: "left",
      referenceHeight: 0,
      pitch: 25,
      thickness: 0.24,
      eaveCut: "horizontal",
      topCut: "perpendicular",
    });
    count++;
  }
const time = (label: string, f: () => unknown, runs = 5) => {
  const t: number[] = [];
  for (let r = 0; r < runs; r++) {
    const s = performance.now();
    f();
    t.push(performance.now() - s);
  }
  t.sort((a, b) => a - b);
  console.log(label.padEnd(36), "Median", t[Math.floor(runs / 2)]!.toFixed(1), "ms");
};
const fresh = (q: typeof p) => JSON.parse(JSON.stringify(q));
console.log(
  "Waende gesamt",
  base.storeys.reduce((n, s) => n + s.walls.length, 0),
  "Daecher",
  count,
  "Flaeche je Dach",
  w.toFixed(1),
  "x",
  h.toFixed(1),
  "m",
);
const pTop = selectWorkingStorey(base, base, top.id);
time("Gebaeudekoerper ohne Daecher (kalt)", () => buildBuildingSolid(fresh(pTop)));
time("Gebaeudekoerper mit 20 Daechern (kalt)", () => buildBuildingSolid(fresh(p)));
time("Grundriss OG ohne Daecher", () => derivePlanScene(fresh(pTop), () => true));
time("Grundriss OG mit 20 Daechern", () => derivePlanScene(fresh(p), () => true));
const ifcTime = async (label: string, q: typeof p) => {
  const t: number[] = [];
  for (let r = 0; r < 3; r++) {
    const s = performance.now();
    await exportIfc(q, new Date(0));
    t.push(performance.now() - s);
  }
  t.sort((a, b) => a - b);
  console.log(label.padEnd(36), "Median", t[1]!.toFixed(1), "ms");
};
await ifcTime("IFC ohne Daecher", pTop);
await ifcTime("IFC mit 20 Daechern", p);
console.log(
  "Dachflaechen im Koerper",
  buildBuildingSolid(fresh(p)).faces.filter((f) => f.roof).length,
  "Schnitte im Grundriss",
  [...derivePlanScene(fresh(p), () => true).roofViews.values()].filter((v) => v.cut.length).length,
  storeyOf(p).roofs!.length,
);
