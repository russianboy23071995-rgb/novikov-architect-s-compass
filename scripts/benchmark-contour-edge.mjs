import { performance } from "node:perf_hooks";
import {
  prepareContourEdge,
  contourEdge,
  capContourEdge,
} from "../src/geometry/polygons/edit-edge.ts";
import { createProject } from "../src/lib/bim/model.ts";
import { previewHatch } from "../src/application/hatches/actions.ts";
import { boundedEdgeTarget, previewContourEdge } from "../src/application/direct-edit/contour.ts";
const measure = (fn) => {
  const times = [];
  for (let i = 0; i < 7; i++) {
    const t = performance.now();
    fn(i);
    times.push(performance.now() - t);
  }
  times.sort((a, b) => a - b);
  return +times[3].toFixed(2);
};
console.log(
  `Node ${process.version}, ${process.platform}; milliseconds, median of 7; timings are diagnostic, not assertions`,
);
for (const n of [100, 200, 500])
  for (const shape of ["regular", "concave"]) {
    const points = Array.from({ length: n }, (_, i) => {
      const r = shape === "concave" && i % 2 ? 9 : 10,
        a = (2 * Math.PI * i) / n;
      return { x: r * Math.cos(a), y: r * Math.sin(a) };
    });
    const { a, b, normal } = contourEdge(points, 0),
      anchor = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    let p = createProject("benchmark", "s");
    p = previewHatch(p, p, {
      projectId: p.id,
      kind: "create",
      hatch: { id: "h", points, fill: { color: "#777777", opacity: 0.5 } },
    });
    const session = {
      base: p,
      target: { kind: "hatch", id: "h" },
      action: "edge",
      index: 0,
      anchor,
    };
    for (const distance of [-0.1, 0.1]) {
      const target = (i) => ({
        x: anchor.x + normal.x * distance * (1 + i * 0.001),
        y: anchor.y + normal.y * distance * (1 + i * 0.001),
      });
      const start = performance.now(),
        resolve = prepareContourEdge(points, 0, anchor),
        prepareMs = +(performance.now() - start).toFixed(2);
      for (let i = 0; i < 3; i++) resolve(target(i));
      const coldCapMs = measure((i) => capContourEdge(points, 0, anchor, target(i)));
      const preparedCapMs = measure((i) => resolve(target(i)));
      boundedEdgeTarget(session, anchor);
      const previewMs = measure((i) => {
        const point = boundedEdgeTarget(session, target(i));
        previewContourEdge(session, point);
      });
      console.log(
        JSON.stringify({ n, shape, distance, prepareMs, coldCapMs, preparedCapMs, previewMs }),
      );
    }
  }
