import test from "node:test";
import assert from "node:assert/strict";
import { clampMenuPosition, selectionSummary } from "./demand-menu.ts";
import { createExampleProject } from "./bim-view.ts";
import { addLine, updateWall } from "../../lib/bim/model.ts";
import { defaultLineAppearance } from "../../lib/bim/lines.ts";

test("menu remains reachable at viewport edges and after viewport shrink", () => {
  const bounds = { width: 1000, height: 700, menuWidth: 240, menuHeight: 160 };
  assert.deepEqual(clampMenuPosition({ x: 980, y: 680 }, bounds), { x: 752, y: 532 });
  assert.deepEqual(clampMenuPosition({ x: -50, y: -10 }, bounds), { x: 8, y: 8 });
  assert.deepEqual(clampMenuPosition({ x: 500, y: 400 }, { ...bounds, width: 200, height: 120 }), {
    x: 8,
    y: 8,
  });
  assert.deepEqual(clampMenuPosition({ x: 100, y: 100 }, bounds), { x: 100, y: 100 });
});
test("wall information resolves stable ID and follows model changes", () => {
  const p = createExampleProject();
  const selection = { kind: "wall" as const, id: "wall-1" };
  assert.equal(
    selectionSummary(p, selection)?.details,
    "Länge 3,00 m · Höhe 2,80 m · Stärke 0,36 m",
  );
  const next = updateWall(p, "wall-1", { end: { x: 6, y: 0 } });
  assert.match(selectionSummary(next, selection)!.details, /6,00 m/);
  assert.equal(selectionSummary(next, { kind: "wall", id: "missing" }), null);
  assert.equal(selectionSummary(next, null), null);
});
test("window and polyline information use correct entity and geometry", () => {
  const p = addLine(createExampleProject(), {
    id: "line-1",
    kind: "polyline",
    points: [
      { x: 0, y: 0 },
      { x: 3, y: 0 },
      { x: 3, y: 4 },
    ],
    ...defaultLineAppearance,
  });
  assert.equal(
    selectionSummary(p, { kind: "window", id: "window-1" })?.details,
    "Breite 1,20 m · Höhe 1,35 m · Brüstung 0,90 m",
  );
  assert.deepEqual(selectionSummary(p, { kind: "line", id: "line-1" }), {
    title: "Polylinie",
    details: "Länge 7,00 m · 3 Punkte",
  });
  assert.equal(selectionSummary(p, { kind: "window", id: "wall-1" }), null);
  assert.equal(selectionSummary(p, { kind: "line", id: "missing" }), null);
});
