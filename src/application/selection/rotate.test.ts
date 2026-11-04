import test from "node:test";
import assert from "node:assert/strict";
import { createStandardProject } from "../projects/create.ts";
import { addWall } from "../walls/actions.ts";
import { addWindow } from "../windows/actions.ts";
import { addColumn } from "../columns/actions.ts";
import { addObject } from "../objects/actions.ts";
import { addText } from "../texts/actions.ts";
import { addStair } from "../stairs/actions.ts";
import { addDimension } from "../dimensions/actions.ts";
import { addRoof } from "../roofs/actions.ts";
import { addRoofWindow } from "../roof-windows/actions.ts";
import { COLUMN_DEFAULTS } from "../../domain/elements/column/model.ts";
import { TEXT_DEFAULTS } from "../../domain/elements/text/model.ts";
import { ROOF_DEFAULTS } from "../../domain/elements/roof/model.ts";
import { rotationTransform } from "../../domain/project/prepared-translation.ts";
import { storeyOf } from "../../domain/storeys/access.ts";
import type { Project } from "../../domain/project/schema.ts";
import type { SelectionSet } from "./state.ts";
import { createLayerVisibilityPolicy, ALL_LAYERS_VISIBLE } from "../layers/visibility.ts";
import {
  assertRotatableSelection,
  beginSelectionRotation,
  previewSelectionRotation,
  rotationAngle,
  selectionRotationInteraction,
} from "./rotate.ts";
import { copyTransformed } from "./copy-transform.ts";

// docs/TASTENKUERZEL.md, B2.
const O = { x: 0, y: 0 };
function fixture(): Project {
  let p = createStandardProject("p", "eg", "og");
  p = addWall(p, { id: "w1", start: O, end: { x: 4, y: 0 }, thickness: 0.24, height: 2.5 });
  p = addWindow(p, {
    id: "f1",
    wallId: "w1",
    width: 1,
    height: 1.2,
    sillHeight: 0.9,
    position: 0.5,
  });
  p = addColumn(p, { id: "s1", position: { x: 6, y: 0 }, shape: COLUMN_DEFAULTS.rectangle });
  p = addObject(p, { id: "tisch", catalogId: "table", position: { x: 6, y: 3 } });
  p = addText(p, { id: "t1", position: { x: 2, y: 3 }, content: "Wohnen", ...TEXT_DEFAULTS });
  p = addStair(p, { id: "tr", start: { x: 8, y: 2 } });
  p = addDimension(p, {
    id: "m1",
    orientation: "horizontal",
    offset: -1,
    points: [O, { x: 4, y: 0 }],
  });
  return p;
}
const all: SelectionSet = [
  { kind: "wall", id: "w1" },
  { kind: "column", id: "s1" },
  { kind: "object", id: "tisch" },
  { kind: "text", id: "t1" },
  { kind: "stair", id: "tr" },
  { kind: "dimension", id: "m1" },
];
const turned = (p: Project, targets: SelectionSet, degrees: number, pivot = O) =>
  previewSelectionRotation(
    beginSelectionRotation(p, targets, pivot, { x: pivot.x + 1, y: pivot.y }),
    p,
    targets,
    degrees,
  );

test("transform: quarter turns are exact, other angles turn counterclockwise", () => {
  assert.deepEqual(rotationTransform(O, 90).point({ x: 1, y: 0 }), { x: 0, y: 1 });
  assert.deepEqual(rotationTransform({ x: 1, y: 1 }, -90).point({ x: 2, y: 1 }), { x: 1, y: 0 });
  assert.deepEqual(rotationTransform(O, 180).point({ x: 2, y: 3 }), { x: -2, y: -3 });
  const p = rotationTransform(O, 45).point({ x: 1, y: 0 });
  assert.ok(Math.abs(p.x - Math.SQRT1_2) < 1e-12 && Math.abs(p.y - Math.SQRT1_2) < 1e-12);
  assert.equal(rotationAngle(350, 10), 20);
  assert.equal(rotationAngle(10, 350), -20);
  assert.equal(rotationAngle(0, 180), 180);
  assert.equal(rotationAngle(0, 90.0000000001), 90);
});

test("turn 90°: points map, columns, objects, texts and stairs turn, the window stays on its wall", () => {
  const p = turned(fixture(), all, 90);
  const s = storeyOf(p);
  const wall = s.walls.find((w) => w.id === "w1")!;
  assert.deepEqual([wall.start, wall.end], [O, { x: 0, y: 4 }]);
  assert.equal(s.windows.find((w) => w.id === "f1")!.position, 0.5);
  const column = s.columns!.find((c) => c.id === "s1")!;
  assert.deepEqual([column.position, column.rotation], [{ x: 0, y: 6 }, 90]);
  const object = s.objects!.find((o) => o.id === "tisch")!;
  assert.deepEqual([object.position, object.rotation], [{ x: -3, y: 6 }, 90]);
  const text = s.texts!.find((t) => t.id === "t1")!;
  assert.deepEqual([text.position, text.rotation], [{ x: -3, y: 2 }, 90]);
  const stair = s.stairs!.find((t) => t.id === "tr")!;
  assert.deepEqual([stair.start, stair.direction], [{ x: -2, y: 8 }, 90]);
  // The dimension line y = −1 becomes the vertical line x = 1.
  const d = s.dimensions!.find((m) => m.id === "m1")!;
  assert.deepEqual([d.orientation, d.offset, d.points], ["vertical", 1, [O, { x: 0, y: 4 }]]);
  // Four quarter turns give the start back exactly; angles stay within [0, 360).
  let q = fixture();
  for (let i = 0; i < 4; i++) q = turned(q, all, 90);
  assert.deepEqual(storeyOf(q).walls, storeyOf(fixture()).walls);
  assert.equal(storeyOf(q).objects![0]!.rotation, 0);
  assert.equal(storeyOf(turned(fixture(), all, -90)).columns![0]!.rotation, 270);
});

test("refused: dimensions off the quarter turns, a roof window without its roof", () => {
  assert.throws(() => turned(fixture(), all, 45), /90°-Schritten/);
  assert.equal(storeyOf(turned(fixture(), all.slice(0, 5), 45)).objects![0]!.rotation, 45);
  let p = addRoof(createStandardProject("p", "eg", "og"), {
    id: "dach",
    points: [O, { x: 8, y: 0 }, { x: 8, y: 5 }, { x: 0, y: 5 }],
    referenceLine: { start: O, end: { x: 8, y: 0 } },
    ...ROOF_DEFAULTS,
    referenceHeight: 2.5,
  });
  p = addRoofWindow(p, { id: "rw", roofId: "dach", along: 2, slope: 2 });
  assert.throws(
    () => assertRotatableSelection(p, [{ kind: "roofWindow", id: "rw" }]),
    /nur mit ihrem Dach/,
  );
  // With its roof it follows: its place in the roof plane is unchanged.
  const roofTurned = turned(p, [{ kind: "roof", id: "dach" }], 30, { x: 4, y: 2 });
  const before = storeyOf(p).roofWindows![0]!,
    after = storeyOf(roofTurned).roofWindows![0]!;
  assert.deepEqual([after.along, after.slope], [before.along, before.slope]);
  assert.notDeepEqual(storeyOf(roofTurned).roofs![0]!.points, storeyOf(p).roofs![0]!.points);
});

test("interaction: Shift rests in 45° steps from the reference, Tab types the turn", () => {
  const p = fixture();
  const targets = all.slice(0, 5);
  const visibility = createLayerVisibilityPolicy(p, ALL_LAYERS_VISIBLE);
  // Reference along 30°: Shift snaps the pointer at ~70° to 30° + 45° = 75°.
  const ref = { x: Math.cos(Math.PI / 6), y: Math.sin(Math.PI / 6) };
  const session = beginSelectionRotation(p, targets, O, ref, visibility);
  const a = (70 * Math.PI) / 180;
  const ctx = {
    references: [],
    pixelsPerMetre: 50,
    enabled: true,
    endpointRadiusPx: 10,
    gridSpacing: null,
    orthoOrigin: null,
    angleOrigin: O,
  };
  const snapped = session.snapping.resolve!({ x: 2 * Math.cos(a), y: 2 * Math.sin(a) }, ctx);
  const at = (Math.atan2(snapped.point.y, snapped.point.x) * 180) / Math.PI;
  assert.ok(Math.abs(at - 75) < 1e-9);
  let committed: { project: Project; degrees: number } | null = null;
  const interaction = selectionRotationInteraction(
    session,
    p,
    targets,
    visibility,
    (project, degrees) => (committed = { project, degrees }),
    () => {},
  );
  const typed = interaction.preview("90", "", null);
  assert.equal(typed.degrees, 90);
  interaction.confirm!(typed.point);
  assert.equal(committed!.degrees, 90);
  assert.equal(storeyOf(committed!.project).objects![0]!.rotation, 90);
  assert.throws(() => interaction.preview("", "", null), /Winkel eingeben/);
  assert.throws(() => beginSelectionRotation(p, targets, O, O), /verschieden/);
});

test("copy turn: the original stays, the turned copy gets new ids, one change", () => {
  const p = fixture();
  const targets: SelectionSet = [{ kind: "object", id: "tisch" }];
  const result = copyTransformed(p, turned(p, targets, 90), targets, (kind) => `${kind}-neu`);
  const objects = storeyOf(result.project).objects!;
  assert.deepEqual(
    objects.map((o) => [o.id, o.position, o.rotation]),
    [
      ["tisch", { x: 6, y: 3 }, 0],
      ["object-neu", { x: -3, y: 6 }, 90],
    ],
  );
});
