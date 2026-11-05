import test from "node:test";
import assert from "node:assert/strict";
import { createStandardProject } from "../projects/create.ts";
import { addWall } from "../walls/actions.ts";
import { addWindow } from "../windows/actions.ts";
import { addDoor } from "../doors/actions.ts";
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
import { DOOR_DEFAULTS, doorDinHand } from "../../domain/elements/door/model.ts";
import { wallBody } from "../../domain/elements/wall/body.ts";
import { reflectionTransform } from "../../domain/project/prepared-translation.ts";
import { storeyOf } from "../../domain/storeys/access.ts";
import { validateProject, type Project, type Point } from "../../domain/project/schema.ts";
import type { SelectionSet } from "./state.ts";
import { createLayerVisibilityPolicy, ALL_LAYERS_VISIBLE } from "../layers/visibility.ts";
import {
  assertMirrorableSelection,
  beginSelectionMirror,
  mirrorAxisAngle,
  previewSelectionMirror,
  selectionMirrorInteraction,
} from "./mirror.ts";
import { copyTransformed } from "./copy-transform.ts";

// docs/TASTENKUERZEL.md, B3.
const O = { x: 0, y: 0 };
function fixture(): Project {
  let p = createStandardProject("p", "eg", "og");
  p = addWall(p, { id: "w1", start: O, end: { x: 4, y: 0 }, thickness: 0.24, height: 2.5 });
  p = addWall(p, {
    id: "w2",
    start: { x: 4, y: 0 },
    end: { x: 4, y: 3 },
    thickness: 0.24,
    height: 2.5,
  });
  p = {
    ...p,
    storeys: p.storeys.map((s, i) =>
      i === 0
        ? {
            ...s,
            walls: s.walls.map((w) => (w.id === "w1" ? { ...w, bodyOffset: 0.12 } : w)),
            wallJoins: [
              { first: { wallId: "w1", endpoint: 1 }, second: { wallId: "w2", endpoint: 0 } },
            ],
          }
        : s,
    ),
  };
  p = validateProject(p);
  p = addWindow(p, {
    id: "f1",
    wallId: "w1",
    width: 1,
    height: 1.2,
    sillHeight: 0.9,
    position: 0.25,
  });
  p = addDoor(p, { id: "t1", wallId: "w2", ...DOOR_DEFAULTS, position: 0.4 });
  p = addColumn(p, {
    id: "s1",
    position: { x: 6, y: 1 },
    rotation: 30,
    shape: COLUMN_DEFAULTS.rectangle,
  });
  p = addObject(p, { id: "wc", catalogId: "table", position: { x: 1, y: 2 } });
  p = addText(p, { id: "tx", position: { x: 2, y: 3 }, content: "Bad", ...TEXT_DEFAULTS });
  p = addStair(p, { id: "tr", start: { x: 1, y: 5 }, axis: "left" });
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
  { kind: "wall", id: "w2" },
  { kind: "column", id: "s1" },
  { kind: "object", id: "wc" },
  { kind: "text", id: "tx" },
  { kind: "stair", id: "tr" },
  { kind: "dimension", id: "m1" },
];
const mirrored = (
  p: Project,
  targets: SelectionSet,
  axis: number,
  origin: Point = { x: 5, y: 0 },
) => previewSelectionMirror(beginSelectionMirror(p, targets, origin), p, targets, axis);
const sorted = (points: readonly Point[]) =>
  [...points]
    .map((q) => ({ x: Math.round(q.x * 1e9) / 1e9 || 0, y: Math.round(q.y * 1e9) / 1e9 || 0 }))
    .sort((a, b) => a.x - b.x || a.y - b.y);

test("transform: axes in 45° steps are exact, a second reflection restores every point", () => {
  assert.deepEqual(reflectionTransform({ x: 5, y: 0 }, 90).point({ x: 1, y: 2 }), { x: 9, y: 2 });
  assert.deepEqual(reflectionTransform({ x: 0, y: 1 }, 0).point({ x: 3, y: 4 }), { x: 3, y: -2 });
  assert.deepEqual(reflectionTransform(O, 45).point({ x: 2, y: 0 }), { x: 0, y: 2 });
  assert.deepEqual(reflectionTransform(O, 135).point({ x: 2, y: 0 }), { x: 0, y: -2 });
  const t = reflectionTransform({ x: 1, y: 1 }, 30);
  const back = t.point(t.point({ x: 3, y: -2 }));
  assert.ok(Math.abs(back.x - 3) < 1e-12 && Math.abs(back.y + 2) < 1e-12);
  assert.equal(mirrorAxisAngle(-90), 90);
  assert.equal(mirrorAxisAngle(180), 0);
  assert.equal(mirrorAxisAngle(225), 45);
  assert.equal(mirrorAxisAngle(89.9999999999), 90);
});

test("mirror at x = 5: walls swap ends, openings and every turned field follow", () => {
  const p = fixture();
  const s = storeyOf(mirrored(p, all, 90));
  const w1 = s.walls.find((w) => w.id === "w1")!;
  assert.deepEqual(
    [w1.start, w1.end],
    [
      { x: 6, y: 0 },
      { x: 10, y: 0 },
    ],
  );
  // The wall body is the exact mirror image: build-up side and axis offset held.
  const before = storeyOf(p).walls.find((w) => w.id === "w1")!;
  assert.deepEqual(
    sorted(wallBody(w1).corners),
    sorted(wallBody(before).corners.map((q) => ({ x: 10 - q.x, y: q.y }))),
  );
  // The join of w1's end and w2's start now joins w1's start and w2's end.
  assert.deepEqual(s.wallJoins, [
    { first: { wallId: "w1", endpoint: 0 }, second: { wallId: "w2", endpoint: 1 } },
  ]);
  assert.equal(s.windows.find((w) => w.id === "f1")!.position, 0.75);
  const door = s.doors!.find((d) => d.id === "t1")!;
  const doorBefore = storeyOf(p).doors!.find((d) => d.id === "t1")!;
  assert.deepEqual([door.position, door.hinge, door.opensTo], [0.6, "end", "left"]);
  assert.notEqual(doorDinHand(door), doorDinHand(doorBefore));
  const column = s.columns!.find((c) => c.id === "s1")!;
  assert.deepEqual([column.position, column.rotation], [{ x: 4, y: 1 }, 150]);
  // The object becomes its mirror image: flipped, angle 2·90 − 0 + 180 = 0.
  const object = s.objects!.find((o) => o.id === "wc")!;
  assert.deepEqual([object.position, object.rotation, object.mirrored], [{ x: 9, y: 2 }, 0, true]);
  // Text: reading right to left would be unreadable, so it reads left to right, right aligned.
  const text = s.texts!.find((t) => t.id === "tx")!;
  assert.deepEqual(
    [text.position, text.rotation, text.align, text.anchor],
    [{ x: 8, y: 3 }, 0, "right", TEXT_DEFAULTS.anchor],
  );
  const stair = s.stairs!.find((t) => t.id === "tr")!;
  assert.deepEqual([stair.start, stair.direction, stair.axis], [{ x: 9, y: 5 }, 180, "right"]);
  // A vertical axis keeps a horizontal dimension horizontal.
  const d = s.dimensions!.find((m) => m.id === "m1")!;
  assert.deepEqual(
    [d.orientation, d.offset, d.points],
    [
      "horizontal",
      -1,
      [
        { x: 10, y: 0 },
        { x: 6, y: 0 },
      ],
    ],
  );
});

test("a second mirror at the same axis restores the selection exactly", () => {
  const p = fixture();
  const twice = mirrored(mirrored(p, all, 90), all, 90);
  assert.deepEqual(storeyOf(twice), storeyOf(p));
  const diagonal = mirrored(mirrored(p, all, 45, { x: 1, y: 1 }), all, 45, { x: 1, y: 1 });
  assert.deepEqual(storeyOf(diagonal), storeyOf(p));
});

test("horizontal axis: text swaps top and bottom, a diagonal axis swaps dimension orientation", () => {
  const p = fixture();
  const s = storeyOf(mirrored(p, [{ kind: "text", id: "tx" }], 0, { x: 0, y: 1 }));
  const text = s.texts![0]!;
  assert.deepEqual([text.position, text.rotation, text.align], [{ x: 2, y: -1 }, 0, "left"]);
  assert.equal(text.anchor, TEXT_DEFAULTS.anchor === "bottom" ? "top" : "bottom");
  const d = storeyOf(mirrored(p, [{ kind: "dimension", id: "m1" }], 45, O)).dimensions![0]!;
  // y = −1 mirrored at y = x is the vertical line x = −1.
  assert.deepEqual([d.orientation, d.offset], ["vertical", -1]);
});

test("refused: dimensions off 45° axes, a roof window without its roof; a roof keeps its window", () => {
  assert.throws(() => mirrored(fixture(), all, 30), /45°-Schritten/);
  assert.equal(storeyOf(mirrored(fixture(), all.slice(0, 6), 30)).walls.length, 2);
  let p = addRoof(createStandardProject("p", "eg", "og"), {
    id: "dach",
    points: [O, { x: 8, y: 0 }, { x: 8, y: 5 }, { x: 0, y: 5 }],
    referenceLine: { start: O, end: { x: 8, y: 0 } },
    ...ROOF_DEFAULTS,
    referenceHeight: 2.5,
  });
  p = addRoofWindow(p, { id: "rw", roofId: "dach", along: 2, slope: 2 });
  assert.throws(
    () => assertMirrorableSelection(p, [{ kind: "roofWindow", id: "rw" }]),
    /spiegeln nur mit ihrem Dach/,
  );
  const roofMirrored = mirrored(p, [{ kind: "roof", id: "dach" }], 0, { x: 0, y: -1 });
  const roof = storeyOf(roofMirrored).roofs![0]!;
  assert.equal(roof.rise, "right");
  assert.deepEqual(roof.referenceLine, { start: { x: 0, y: -2 }, end: { x: 8, y: -2 } });
  const before = storeyOf(p).roofWindows![0]!,
    after = storeyOf(roofMirrored).roofWindows![0]!;
  assert.deepEqual([after.along, after.slope], [before.along, before.slope]);
});

test("interaction: Shift rests the axis in absolute 45° steps, Tab types the axis angle", () => {
  const p = fixture();
  const targets = all.slice(2, 6);
  const visibility = createLayerVisibilityPolicy(p, ALL_LAYERS_VISIBLE);
  const session = beginSelectionMirror(p, targets, { x: 5, y: 0 }, visibility);
  const ctx = {
    references: [],
    pixelsPerMetre: 50,
    enabled: true,
    endpointRadiusPx: 10,
    gridSpacing: null,
    orthoOrigin: null,
    angleOrigin: { x: 5, y: 0 },
  };
  const a = (80 * Math.PI) / 180;
  const snapped = session.snapping.resolve!({ x: 5 + 2 * Math.cos(a), y: 2 * Math.sin(a) }, ctx);
  assert.ok(Math.abs(snapped.point.x - 5) < 1e-9);
  let committed: { project: Project; axis: number } | null = null;
  const interaction = selectionMirrorInteraction(
    session,
    p,
    targets,
    visibility,
    (project, axis) => (committed = { project, axis }),
    () => {},
  );
  assert.equal(interaction.input?.angleLabel, "Achswinkel");
  const typed = interaction.preview("90", "", null);
  assert.equal(typed.degrees, 90);
  interaction.confirm!(typed.point);
  assert.equal(committed!.axis, 90);
  assert.equal(storeyOf(committed!.project).objects![0]!.mirrored, true);
  assert.throws(() => interaction.preview("", "", null), /Achswinkel eingeben/);
  assert.throws(() => interaction.confirm!({ x: 5, y: 0 }), /verschieden/);
});

test("copy mirror: the original stays, the mirrored copy gets new ids", () => {
  const p = fixture();
  const targets: SelectionSet = [{ kind: "object", id: "wc" }];
  const result = copyTransformed(p, mirrored(p, targets, 90), targets, (kind) => `${kind}-neu`);
  assert.deepEqual(
    storeyOf(result.project).objects!.map((o) => [o.id, o.position, !!o.mirrored]),
    [
      ["wc", { x: 1, y: 2 }, false],
      ["object-neu", { x: 9, y: 2 }, true],
    ],
  );
});

test("a door in the selection follows its wall; alone it is refused", () => {
  const p = fixture();
  const targets: SelectionSet = [
    { kind: "wall", id: "w2" },
    { kind: "door", id: "t1" },
  ];
  const door = storeyOf(mirrored(p, targets, 90)).doors![0]!;
  assert.deepEqual([door.position, door.hinge], [0.6, "end"]);
  assert.throws(
    () => assertMirrorableSelection(p, [{ kind: "door", id: "t1" }]),
    /Türen für die freie Gruppenbewegung/,
  );
});
