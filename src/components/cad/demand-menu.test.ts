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
test("door information opens the along-wall menu with its own measures", async () => {
  const { addDoor } = await import("../../application/doors/actions.ts");
  const { DOOR_DEFAULTS } = await import("../../domain/elements/door/model.ts");
  const wide = updateWall(createExampleProject(), "wall-1", { end: { x: 6, y: 0 } });
  const p = addDoor(wide, { id: "d", wallId: "wall-1", position: 0.15, ...DOOR_DEFAULTS });
  assert.deepEqual(selectionSummary(p, { kind: "door", id: "d" }), {
    title: "Tür",
    details: "Breite 1,01 m · Höhe 2,14 m · Z-Versatz 0,00 m · DIN rechts",
  });
  assert.equal(selectionSummary(p, { kind: "door", id: "missing" }), null);
});

test("the menu never covers the command bar: above, else left, else right of it", () => {
  // 1000 × 700 viewport, command bar 190–810 × 560–680, menu 176 × 200.
  const bar = { left: 190, top: 560, right: 810, bottom: 680 };
  const bounds = { width: 1000, height: 700, menuWidth: 176, menuHeight: 200, obstacles: [bar] };
  const covers = (p: { x: number; y: number }, b = bounds) =>
    p.x < bar.right &&
    p.x + b.menuWidth > bar.left &&
    p.y < bar.bottom &&
    p.y + b.menuHeight > bar.top;
  // Clicked element just above the bar: the menu moves up to end 8 px above the bar.
  assert.deepEqual(clampMenuPosition({ x: 400, y: 500 }, bounds), { x: 400, y: 352 });
  // Away from the bar nothing changes.
  assert.deepEqual(clampMenuPosition({ x: 400, y: 100 }, bounds), { x: 400, y: 100 });
  // A tall menu that cannot fit above goes to the left of the bar.
  const tall = { ...bounds, menuHeight: 600, obstacles: [{ ...bar, left: 300 }] };
  assert.deepEqual(clampMenuPosition({ x: 400, y: 300 }, tall), { x: 300 - 176 - 8, y: 92 });
  // No room left either: right of the bar.
  const wideBar = { left: 100, top: 100, right: 700, bottom: 680 };
  const right = clampMenuPosition({ x: 300, y: 300 }, { ...tall, obstacles: [wideBar] });
  assert.equal(right.x, 708);
  // Dragging onto the bar is clamped the same way.
  for (const y of [520, 600, 650])
    assert.equal(covers(clampMenuPosition({ x: 300, y }, bounds)), false);
});
