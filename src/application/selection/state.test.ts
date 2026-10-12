import test from "node:test";
import assert from "node:assert/strict";
import { createProject, addWall, addWindow, serializeProject } from "../../lib/bim/model.ts";
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
