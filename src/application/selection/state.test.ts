import test from "node:test";
import assert from "node:assert/strict";
import { serializeProject } from "../../lib/bim/model.ts";
import { createProject } from "../projects/create.ts";
import { addWindow } from "../windows/actions.ts";
import { addWall } from "../walls/actions.ts";
import { createDrawing, defaultHatchFill } from "../drawing/actions.ts";
import { defaultLineAppearance } from "../../lib/bim/lines.ts";
import { eligibleSelection, selectTargets, singleTarget } from "./state.ts";
import { planSelectionShapes, enclosedTargets } from "../../rendering/viewport/selection-shapes.ts";
import { createLayerVisibilityPolicy } from "../layers/visibility.ts";

function fixture() {
  let p = addWall(createProject("p", "s"), {
    id: "wall",
    start: { x: 0, y: 0 },
    end: { x: 3, y: 0 },
    thickness: 0.36,
    height: 2.8,
    bodyOffset: 0.18,
  });
  p = addWindow(p, {
    id: "window",
    wallId: "wall",
    width: 1.2,
    height: 1.2,
    sillHeight: 0.9,
    position: 0.5,
  });
  for (const [id, points] of [
    [
      "line",
      [
        { x: 0, y: 1 },
        { x: 3, y: 1 },
      ],
    ],
    [
      "polyline",
      [
        { x: 0, y: 2 },
        { x: 1, y: 2 },
        { x: 1, y: 3 },
        { x: 0, y: 2 },
      ],
    ],
  ] as const)
    p = createDrawing(p, p, id, {
      kind: "line",
      points: [...points],
      lineKind: id === "line" ? "line" : "polyline",
      appearance: defaultLineAppearance,
    });
  return createDrawing(p, p, "hatch", {
    kind: "hatch",
    points: [
      { x: 2, y: 2 },
      { x: 3, y: 2 },
      { x: 3, y: 3 },
      { x: 2, y: 3 },
    ],
    fill: defaultHatchFill,
  });
}
const a = { x: -1, y: -1 },
  b = { x: 4, y: 4 };
test("all current types share click, mixed toggle, replacement and a single-target action gate", () => {
  const p = fixture(),
    targets = planSelectionShapes(p).map((s) => s.target),
    snapshot = serializeProject(p);
  let chosen = selectTargets([], targets.slice(0, 1));
  assert.deepEqual(singleTarget(chosen), targets[0]);
  chosen = selectTargets(chosen, targets.slice(1), "toggle");
  assert.equal(chosen.length, 5);
  assert.equal(singleTarget(chosen), null);
  chosen = selectTargets(chosen, [targets[0]!, targets[0]!], "toggle");
  assert.equal(chosen.length, 4);
  assert.equal(selectTargets(chosen, targets).length, 5);
  assert.deepEqual(selectTargets(chosen, []), []);
  assert.equal(serializeProject(p), snapshot);
});
test("marquee contains full geometry in either direction, includes boundary and excludes partial hits", () => {
  const shapes = planSelectionShapes(fixture());
  assert.equal(enclosedTargets(shapes, a, b).length, 5);
  assert.deepEqual(enclosedTargets(shapes, b, a), enclosedTargets(shapes, a, b));
  assert.deepEqual(enclosedTargets(shapes, { x: 2, y: 2 }, { x: 3, y: 3 }), [
    { kind: "hatch", id: "hatch" },
  ]);
  assert.deepEqual(enclosedTargets(shapes, { x: 0.1, y: -0.1 }, { x: 2.9, y: 0.4 }), [
    { kind: "window", id: "window" },
  ]);
  assert.deepEqual(enclosedTargets(shapes, { x: NaN, y: 0 }, b), []);
});
test("marquee uses offset and connected wall contours, not merely axis endpoints", () => {
  let p = fixture();
  assert.ok(
    !enclosedTargets(planSelectionShapes(p), { x: 0, y: 0 }, { x: 3, y: 0.1 }).some(
      (t) => t.id === "wall",
    ),
  );
  p = addWall(p, {
    id: "corner",
    start: { x: 0, y: 0 },
    end: { x: 0, y: 3 },
    thickness: 0.36,
    height: 2.8,
    bodyOffset: 0.18,
  });
  assert.ok(
    !enclosedTargets(planSelectionShapes(p), { x: 0, y: 0 }, { x: 3, y: 0.36 }).some(
      (t) => t.id === "wall",
    ),
  );
});
test("one eligibility gate removes hidden, stale, wrong-kind and duplicate targets including hidden hosts", () => {
  const p = fixture(),
    targets = planSelectionShapes(p).map((s) => s.target);
  const visible = createLayerVisibilityPolicy(p, {
    scope: { kind: "bim-project" },
    hiddenLayerIds: [],
  });
  assert.equal(
    eligibleSelection(p, visible, [
      ...targets,
      ...targets,
      { kind: "wall", id: "missing" },
      { kind: "wall", id: "hatch" },
    ]).length,
    5,
  );
  const hidden = createLayerVisibilityPolicy(p, {
    scope: { kind: "bim-project" },
    hiddenLayerIds: [p.defaultLayerIds.wall],
  });
  assert.deepEqual(
    eligibleSelection(p, hidden, targets).map((t) => t.id),
    ["line", "polyline", "hatch"],
  );
  const noWindow = createLayerVisibilityPolicy(p, {
    scope: { kind: "bim-project" },
    hiddenLayerIds: [p.defaultLayerIds.window],
  });
  assert.ok(eligibleSelection(p, noWindow, targets).some((t) => t.id === "wall"));
  assert.ok(!eligibleSelection(p, noWindow, targets).some((t) => t.id === "window"));
  assert.deepEqual(eligibleSelection({ ...p }, visible, targets), []);
});
test("frame works for thin segments and arbitrary future straight-edge shape adapters", () => {
  const shapes = [
    {
      target: { kind: "line" as const, id: "thin" },
      points: [
        { x: 1, y: 1 },
        { x: 1, y: 3 },
      ],
    },
  ];
  assert.equal(enclosedTargets(shapes, { x: 1, y: 1 }, { x: 1, y: 3 }).length, 1);
  assert.equal(enclosedTargets(shapes, { x: 0, y: 0 }, { x: 2, y: 2 }).length, 0);
});

import { shapesAt, planElementCaption } from "../../rendering/viewport/selection-shapes.ts";
import { hoverCycle, stepCycle, cycleTarget } from "./cycle.ts";
import { addSlab } from "../slabs/actions.ts";
import { addRoof } from "../roofs/actions.ts";
import { addRoom } from "../rooms/actions.ts";
import { setStoreyHeight } from "../storeys/actions.ts";
import { SLAB_DEFAULTS } from "../../domain/elements/slab/model.ts";
import { ELEMENT_KINDS, type ElementKind } from "../../domain/elements/registry.ts";

test("Tab cycling: every element under a plan point, topmost first, captions, cycle", () => {
  // docs/TAB_AUSWAHL.md: room under slab under roof, wall with window, line over hatch.
  let p = createProject("tab", "eg");
  p = setStoreyHeight(p, p, { projectId: "tab", storeyId: "eg", height: 3 });
  const square = [
    { x: 0, y: 0 },
    { x: 6, y: 0 },
    { x: 6, y: 4 },
    { x: 0, y: 4 },
  ];
  p = addRoom(p, { id: "room", points: square, name: "Wohnen" });
  p = addSlab(p, { id: "slab-a", points: square, ...SLAB_DEFAULTS });
  p = addSlab(p, { id: "slab-b", points: square, ...SLAB_DEFAULTS });
  p = addRoof(p, {
    id: "roof",
    points: square,
    referenceLine: { start: { x: 0, y: 0 }, end: { x: 6, y: 0 } },
    rise: "left",
    referenceHeight: 1,
    pitch: 30,
    thickness: 0.2,
    eaveCut: "vertical",
    topCut: "vertical",
  });
  p = addWall(p, {
    id: "w",
    start: { x: 0, y: 6 },
    end: { x: 6, y: 6 },
    thickness: 0.3,
    height: 2.5,
  });
  p = addWindow(p, {
    id: "f",
    wallId: "w",
    width: 1,
    height: 1,
    sillHeight: 1,
    position: 0.5,
    mark: "F7",
  });
  p = createDrawing(p, p, "h", {
    kind: "hatch",
    points: [
      { x: 8, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 2 },
    ],
    fill: defaultHatchFill,
  });
  p = createDrawing(p, p, "l", {
    kind: "line",
    points: [
      { x: 8, y: 0.5 },
      { x: 10, y: 0.5 },
    ],
    lineKind: "line",
    appearance: defaultLineAppearance,
  });
  const shapes = planSelectionShapes(p);
  // Slabs, roofs and rooms now take part in box selection as well.
  for (const kind of ["slab", "roof", "room"] as const)
    assert.ok(shapes.some((s) => s.target.kind === kind));
  const ids = (point: { x: number; y: number }) =>
    shapesAt(shapes, point, 0.05).map((s) => s.target.id);
  assert.deepEqual(ids({ x: 2, y: 2 }), ["roof", "slab-b", "slab-a", "room"]);
  assert.deepEqual(ids({ x: 3, y: 6 }), ["f", "w"]);
  assert.deepEqual(ids({ x: 1, y: 6 }), ["w"]);
  assert.deepEqual(ids({ x: 9.5, y: 0.52 }), ["l", "h"]);
  assert.deepEqual(ids({ x: 20, y: 20 }), []);
  assert.deepEqual(ids({ x: NaN, y: 0 }), []);
  // Outline tolerance: just outside the room still counts within the pick distance.
  assert.ok(ids({ x: 6.03, y: 2 }).includes("room"));
  assert.ok(!ids({ x: 6.2, y: 2 }).includes("room"));
  // Captions: kind plus number or mark.
  assert.equal(planElementCaption(p, { kind: "room", id: "room" }), "Raum R-001 Wohnen");
  assert.equal(planElementCaption(p, { kind: "window", id: "f" }), "Fenster F7");
  assert.equal(planElementCaption(p, { kind: "slab", id: "slab-a" }), "Decke");
  // Cycle: Tab forward once around, Shift+Tab back; same set keeps, new set restarts.
  const targets = shapesAt(shapes, { x: 2, y: 2 }, 0.05).map((s) => s.target);
  let cycle = hoverCycle(null, targets)!;
  assert.equal(cycleTarget(cycle).id, "roof");
  cycle = stepCycle(cycle);
  assert.equal(cycleTarget(cycle).id, "slab-b");
  assert.equal(hoverCycle(cycle, [...targets]), cycle);
  for (let i = 0; i < 3; i++) cycle = stepCycle(cycle);
  assert.equal(cycleTarget(cycle).id, "roof");
  assert.equal(cycleTarget(stepCycle(cycle, true)).id, "room");
  assert.equal(hoverCycle(cycle, targets.slice(0, 1)), null);
  assert.equal(cycleTarget(hoverCycle(cycle, targets.slice(1))!).id, "slab-b");
  // Every registered element kind supplies a footprint and a caption (new kinds included).
  for (const kind of Object.keys(ELEMENT_KINDS) as ElementKind[])
    assert.equal(typeof planElementCaption(p, { kind, id: "missing" } as never), "string");
});
