import test from "node:test";
import assert from "node:assert/strict";
import { validateSimplePolygon } from "../src/geometry/polygons/simple-polygon.ts";
import { validateSimplePolygon as full } from "./polygon-validation-oracle.ts";

function ring(n: number, concave = false) {
  return Array.from({ length: n }, (_, i) => {
    const a = (i * 2 * Math.PI) / n,
      r = concave && i % 2 ? 7 : 10;
    return { x: r * Math.cos(a), y: r * Math.sin(a) };
  });
}
test("indexed contour validation matches full pairs including exact diagnostics", () => {
  let seed = 873;
  const random = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32;
  for (const n of [3, 32, 128, 129, 200, 500]) {
    for (const concave of [false, true]) {
      const base = ring(n, concave);
      const cases = [base, [...base].reverse(), base.map((p) => ({ x: p.x + 1e9, y: p.y - 1e9 }))];
      for (let k = 0; k < 12; k++) {
        const points = base.map((p) => ({ ...p }));
        const i = Math.floor(random() * n),
          j = Math.floor(random() * n);
        if (k % 3 === 0) points[i] = { ...points[j]! };
        else if (k % 3 === 1) [points[i], points[j]] = [points[j]!, points[i]!];
        else points[i] = { x: random() * 30 - 15, y: random() * 30 - 15 };
        cases.push(points);
      }
      for (const points of cases) assert.deepEqual(validateSimplePolygon(points), full(points));
    }
  }
});
test("index preserves tolerance contacts, precision collapse and overflow rejection", () => {
  const base = ring(256);
  for (const offset of [0, 1e6, 1e9, 1e16, 1e308]) {
    for (const gap of [0, 1e-10, 1e-9, 1e-7, 1e-6, 2e-6, 3e-6]) {
      const points = base.map((p) => ({ x: p.x + offset, y: p.y + offset }));
      points[20] = { x: points[0]!.x + gap, y: points[0]!.y + gap };
      assert.deepEqual(validateSimplePolygon(points), full(points));
    }
  }
  for (const value of [NaN, Infinity, -Infinity]) {
    const points = base.map((p) => ({ ...p }));
    points[40]!.x = value;
    assert.deepEqual(validateSimplePolygon(points), full(points));
  }
});

test("large hatch movement keeps full-path geometry, context guards and one undo", async () => {
  const { createProject, validateProject } = await import("../src/lib/bim/model.ts");
  const { storeyOf } = await import("../src/domain/storeys/access.ts");
  const { defaultHatchAppearance } = await import("../src/domain/elements/hatch/model.ts");
  const { beginSelectionMove, previewSelectionGeometry, previewSelectionMove } =
    await import("../src/application/selection/move.ts");
  const { fullSelectionMove } = await import("./selection-move-oracle.ts");
  const { createHistory, commitProject, undoProject } = await import("../src/lib/bim/history.ts");
  const project = createProject("hatch-contact", "s");
  storeyOf(project).lines = [];
  storeyOf(project).hatches.push({
    id: "h",
    kind: "hatch",
    layerId: project.defaultLayerIds.line,
    points: ring(500, true),
    fill: { color: "#334455", opacity: 0.6 },
    ...defaultHatchAppearance,
  });
  const history = createHistory(project),
    base = history.present;
  const targets = [{ kind: "hatch" as const, id: "h" }];
  const session = beginSelectionMove(base, targets, { x: 0, y: 0 });
  for (const point of [
    { x: 0, y: 0 },
    { x: 2, y: -3 },
    { x: 1e9, y: -1e9 },
  ]) {
    const fullProject = fullSelectionMove(base, targets, point);
    const patch = previewSelectionGeometry(session, base, targets, point);
    assert.deepEqual(storeyOf(patch.geometry).hatches, storeyOf(fullProject).hatches);
    assert.deepEqual(previewSelectionMove(session, base, targets, point), fullProject);
    assert.equal(history.past.length, 0);
  }
  assert.throws(() =>
    previewSelectionGeometry(session, validateProject(base), targets, { x: 1, y: 1 }),
  );
  assert.throws(() => previewSelectionGeometry(session, base, targets, { x: 1e20, y: 1e20 }));
  const next = commitProject(
    history,
    previewSelectionMove(session, base, targets, { x: 2, y: -3 }),
  );
  assert.equal(next.past.length, 1);
  assert.deepEqual(undoProject(next).present, base);
});
