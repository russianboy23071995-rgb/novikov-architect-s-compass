import test from "node:test";
import assert from "node:assert/strict";
import {
  resolveStoreyLevels,
  changeStoreyHeight,
  insertStorey,
  type StoreyHeight,
} from "./heights.ts";
import { roofFaceRings, roofTopAt, roofUndersideAt } from "../elements/roof/geometry.ts";
import { roofSchema, roofStoreyElevation } from "../elements/roof/model.ts";
import { addRoof, defaultRoofLayerId, updateRoof } from "../../application/roofs/actions.ts";
import { createStandardProject } from "../../application/projects/create.ts";
import { selectWorkingStorey } from "../../application/storeys/working-storey.ts";
import { setStoreyHeight } from "../../application/storeys/actions.ts";
import { storeyOf } from "./access.ts";

const building = Object.freeze([
  Object.freeze({ id: "ug2", height: 2.5, name: "Archiv" }),
  Object.freeze({ id: "ug1", height: 2.8, name: "Keller" }),
  Object.freeze({ id: "eg", height: 3.2, name: "Eingang" }),
  Object.freeze({ id: "og", height: 3, name: "Büro" }),
]);
test("datum offsets upper and lower levels without changing storey intervals", () => {
  const zero = resolveStoreyLevels(building, "eg");
  const shifted = resolveStoreyLevels(building, "eg", 0.5);
  shifted.forEach((level, i) => {
    assert.equal(level.elevation, zero[i]!.elevation! + 0.5);
    assert.equal(level.upperElevation, zero[i]!.upperElevation! + 0.5);
  });
  assert.throws(() => resolveStoreyLevels(building, "eg", NaN));
  assert.throws(() => resolveStoreyLevels(building, "eg", Infinity));
});
function levels(storeys: readonly StoreyHeight[]) {
  return resolveStoreyLevels(storeys, "eg").map((s) => s.elevation);
}
function near(actual: readonly (number | null)[], expected: readonly number[]) {
  assert.equal(actual.length, expected.length);
  actual.forEach((value, i) => assert.ok(value !== null && Math.abs(value - expected[i]!) < 1e-12));
}

test("ground datum anchors both sides and derives the top without a phantom storey", () => {
  near(levels(building), [-5.3, -2.8, 0, 3.2]);
  const resolved = resolveStoreyLevels(building, "eg");
  assert.equal(resolved.at(-1)!.upperElevation, 6.2);
  assert.deepEqual(
    resolved.map((s) => s.storeyId),
    building.map((s) => s.id),
  );
  assert.ok(Object.isFrozen(resolved) && resolved.every(Object.isFrozen));
});

test("increasing or reducing EG height moves OG only and leaves input unchanged", () => {
  near(levels(changeStoreyHeight(building, "eg", "eg", 3.5)), [-5.3, -2.8, 0, 3.5]);
  near(levels(changeStoreyHeight(building, "eg", "eg", 2.5)), [-5.3, -2.8, 0, 2.5]);
  const changed = changeStoreyHeight(building, "eg", "eg", 3.5);
  assert.equal(changed[0], building[0]);
  assert.equal(changed[2]!.name, "Eingang");
  assert.equal(changeStoreyHeight(building, "eg", "eg", 3.2), building);
  assert.equal(building[2]!.height, 3.2);
});

test("basement changes move only that floor and deeper floors away from fixed EG", () => {
  near(levels(changeStoreyHeight(building, "eg", "ug1", 3.1)), [-5.6, -3.1, 0, 3.2]);
  near(levels(changeStoreyHeight(building, "eg", "ug2", 2.9)), [-5.7, -2.8, 0, 3.2]);
  near(levels(changeStoreyHeight(building, "eg", "ug1", 2)), [-4.5, -2, 0, 3.2]);
});

test("insertion above and below EG adds an interval, preserves names and existing heights", () => {
  const added = { id: "new", name: "Zwischengeschoss", height: 2.6 };
  const above = insertStorey(building, "eg", "eg", "above", added);
  near(levels(above), [-5.3, -2.8, 0, 3.2, 5.8]);
  const below = insertStorey(building, "eg", "eg", "below", added);
  near(levels(below), [-7.9, -5.4, -2.6, 0, 3.2]);
  assert.equal(above[4], building[3]);
  assert.equal(below[0], building[0]);
  assert.equal(building.length, 4);
});

test("adding a top or bottom storey does not move existing floor levels", () => {
  near(
    levels(insertStorey(building, "eg", "og", "above", { id: "og2", height: 4, name: "Oben" })),
    [-5.3, -2.8, 0, 3.2, 6.2],
  );
  near(
    levels(insertStorey(building, "eg", "ug2", "below", { id: "ug3", height: 2, name: "Unten" })),
    [-7.3, -5.3, -2.8, 0, 3.2],
  );
});

test("legacy unknown heights stay unknown without losing the known EG reference", () => {
  const legacy = [{ id: "eg", height: null }];
  assert.deepEqual(resolveStoreyLevels(legacy, "eg"), [
    { storeyId: "eg", elevation: 0, upperElevation: null },
  ]);
  assert.throws(() =>
    insertStorey<StoreyHeight>(legacy, "eg", "eg", "above", { id: "og", height: 3 }),
  );
  const supplied = changeStoreyHeight(legacy, "eg", "eg", 3.2);
  near(
    levels(insertStorey<StoreyHeight>(supplied, "eg", "eg", "above", { id: "og", height: 3 })),
    [0, 3.2],
  );
  const unknown = [
    { id: "ug2", height: 2 },
    { id: "ug1", height: null },
    { id: "eg", height: 3 },
  ];
  const result = resolveStoreyLevels(unknown, "eg");
  assert.deepEqual(
    result.map((s) => s.elevation),
    [null, null, 0],
  );
  assert.equal(result[1]!.upperElevation, 0);
});

test("reject invalid IDs, missing datum, unsupported direction and invalid numeric heights", () => {
  assert.throws(() => resolveStoreyLevels([], "eg"));
  assert.throws(() => resolveStoreyLevels(building, "missing"));
  for (const id of ["", " ", "eg", " new "])
    assert.throws(() =>
      insertStorey(building, "eg", "eg", "above", { id, height: 3, name: "Bad" }),
    );
  for (const height of [0, -1, NaN, Infinity, -Infinity]) {
    assert.throws(() => changeStoreyHeight(building, "eg", "eg", height));
    assert.throws(() => resolveStoreyLevels([{ id: "eg", height }], "eg"));
  }
  assert.throws(() => changeStoreyHeight(building, "eg", "missing", 3));
  assert.throws(() =>
    insertStorey<StoreyHeight>(building, "eg", "eg", "above", { id: "new", height: null }),
  );
  assert.throws(() =>
    insertStorey(building, "eg", "missing", "above", { id: "new", height: 3, name: "Bad" }),
  );
  assert.throws(() =>
    insertStorey(building, "eg", "eg", "invalid" as "above", { id: "new", height: 3, name: "Bad" }),
  );
});

test("overflow and lost numeric separation are rejected atomically on both sides", () => {
  for (const heights of [
    [Number.MAX_VALUE, Number.MAX_VALUE],
    [1e20, 1],
  ]) {
    assert.throws(() =>
      resolveStoreyLevels(
        [
          { id: "eg", height: heights[0]! },
          { id: "og", height: heights[1]! },
        ],
        "eg",
      ),
    );
    assert.throws(() =>
      resolveStoreyLevels(
        [
          { id: "ug2", height: heights[1]! },
          { id: "ug1", height: heights[0]! },
          { id: "eg", height: 3 },
        ],
        "eg",
      ),
    );
  }
  assert.throws(() => changeStoreyHeight(building, "eg", "eg", Number.MAX_VALUE));
  near(levels(building), [-5.3, -2.8, 0, 3.2]);
});

// Dach D1 (docs/ROOF_ELEMENT.md): single inclined roof surface. Expected values are computed by
// hand from the definitions (underside through the reference line, thickness perpendicular).
const SQUARE = [
  { x: 0, y: 0 },
  { x: 4, y: 0 },
  { x: 4, y: 4 },
  { x: 0, y: 4 },
];
const roof45 = {
  points: SQUARE,
  referenceLine: { start: { x: 0, y: 0 }, end: { x: 1, y: 0 } },
  rise: "left" as const,
  referenceHeight: 0,
  pitch: 45,
  thickness: 0.2,
  eaveCut: "vertical" as const,
  topCut: "vertical" as const,
};
const roofNear = (actual: number, expected: number, label = "") =>
  assert.ok(Math.abs(actual - expected) < 1e-9, `${label}: ${actual} != ${expected}`);
const D_SIN = 0.2 * Math.SQRT1_2; // 0,141421…
const D_OVER_SIN = 0.2 * Math.SQRT2; // 0,282842…

test("roof surface: reference line along X, rise +Y, 45° – two metres away it is two metres higher", () => {
  roofNear(roofUndersideAt(roof45, { x: 2, y: 0 }), 0, "underside on the line");
  roofNear(roofUndersideAt(roof45, { x: 2, y: 2 }), 2, "underside 2 m uphill");
  roofNear(roofTopAt(roof45, { x: 2, y: 0 }), D_OVER_SIN, "top on the line");
  roofNear(roofTopAt(roof45, { x: 2, y: 2 }) - roofTopAt(roof45, { x: 2, y: 0 }), 2, "top rise");
  // The position along the line does not matter; only the side does.
  roofNear(roofUndersideAt({ ...roof45, referenceHeight: 2.5 }, { x: -7, y: 1 }), 3.5, "height");
  roofNear(roofUndersideAt({ ...roof45, rise: "right" }, { x: 2, y: 2 }), -2, "rise right");
  const reversed = { ...roof45, referenceLine: { start: { x: 1, y: 0 }, end: { x: 0, y: 0 } } };
  roofNear(roofUndersideAt({ ...reversed, rise: "right" }, { x: 2, y: 2 }), 2, "reversed line");
  roofNear(roofUndersideAt({ ...roof45, pitch: 30 }, { x: 0, y: 3 }), 3 * Math.tan(Math.PI / 6));
  assert.deepEqual(roofFaceRings(roof45).roles, ["eave", "verge", "top", "verge"]);
});

test("roof end cuts: vertical, perpendicular and horizontal inset the inner edge as defined", () => {
  const ys = (ring: { x: number; y: number }[]) => ring.map((p) => p.y);
  // Vertical: both faces on the outline.
  let rings = roofFaceRings(roof45);
  assert.deepEqual(rings.top, SQUARE);
  assert.deepEqual(rings.bottom, SQUARE);
  // Eave perpendicular: the top edge stays on the outline, the underside moves in by d·sin.
  rings = roofFaceRings({ ...roof45, eaveCut: "perpendicular" });
  assert.deepEqual(ys(rings.top), [0, 0, 4, 4]);
  roofNear(Math.min(...ys(rings.bottom)), D_SIN, "eave perpendicular underside");
  // The end face is perpendicular to the surface and exactly d long.
  const bottomEdgeZ = roofUndersideAt(roof45, { x: 2, y: D_SIN });
  const topEdgeZ = roofTopAt(roof45, { x: 2, y: 0 });
  roofNear(Math.hypot(D_SIN, topEdgeZ - bottomEdgeZ), 0.2, "perpendicular face length");
  roofNear(-D_SIN + (topEdgeZ - bottomEdgeZ), 0, "perpendicular to the slope (1, 1)");
  // Eave horizontal: the underside moves in by d/sin and meets the top edge's height.
  rings = roofFaceRings({ ...roof45, eaveCut: "horizontal" });
  roofNear(Math.min(...ys(rings.bottom)), D_OVER_SIN, "eave horizontal underside");
  roofNear(roofUndersideAt(roof45, { x: 2, y: D_OVER_SIN }), roofTopAt(roof45, { x: 2, y: 0 }));
  // Top edge: the underside stays on the outline, the top moves in.
  rings = roofFaceRings({ ...roof45, topCut: "perpendicular" });
  assert.deepEqual(ys(rings.bottom), [0, 0, 4, 4]);
  roofNear(Math.max(...ys(rings.top)), 4 - D_SIN, "top perpendicular");
  rings = roofFaceRings({ ...roof45, topCut: "horizontal" });
  roofNear(Math.max(...ys(rings.top)), 4 - D_OVER_SIN, "top horizontal");
  roofNear(roofTopAt(roof45, { x: 2, y: 4 - D_OVER_SIN }), roofUndersideAt(roof45, { x: 2, y: 4 }));
  // Verges stay vertical whatever the eave and top cuts are.
  rings = roofFaceRings({ ...roof45, eaveCut: "horizontal", topCut: "perpendicular" });
  for (const ring of [rings.top, rings.bottom])
    assert.deepEqual(
      ring.map((p) => p.x),
      [0, 4, 4, 0],
    );
});

test("roof outlines: non-convex L, any winding; too narrow, degenerate or invalid input is refused", () => {
  const l = [
    { x: 0, y: 0 },
    { x: 6, y: 0 },
    { x: 6, y: 3 },
    { x: 3, y: 3 },
    { x: 3, y: 5 },
    { x: 0, y: 5 },
  ];
  const lRoof = {
    ...roof45,
    points: l,
    eaveCut: "perpendicular" as const,
    topCut: "horizontal" as const,
  };
  const rings = roofFaceRings(lRoof);
  assert.deepEqual(rings.roles, ["eave", "verge", "top", "verge", "top", "verge"]);
  assert.equal(rings.top.length, 6);
  // Both top edges (y = 3 and y = 5) move in by d/sin, the eave underside by d·sin.
  roofNear(rings.top[2]!.y, 3 - D_OVER_SIN);
  roofNear(rings.top[4]!.y, 5 - D_OVER_SIN);
  roofNear(rings.bottom[0]!.y, D_SIN);
  // Clockwise input gives the same rings.
  assert.deepEqual(roofFaceRings({ ...lRoof, points: [...l].reverse() }).top, rings.top);
  // Roof parse: valid values pass, invalid values give readable messages.
  assert.equal(roofSchema.parse({ ...roof45, id: "r", layerId: "layer:roof" }).pitch, 45);
  const narrow = {
    ...roof45,
    id: "r",
    layerId: "layer:roof",
    points: [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 4, y: 0.25 },
      { x: 0, y: 0.25 },
    ],
    eaveCut: "horizontal" as const,
    topCut: "horizontal" as const,
  };
  assert.throws(() => roofSchema.parse(narrow), /zu schmal/);
  // 0,25 m deep: each horizontal cut needs d/sin = 0,283 m; vertical cuts fit.
  assert.equal(roofSchema.parse({ ...narrow, eaveCut: "vertical", topCut: "vertical" }).id, "r");
  // 0,50 m deep with both horizontal cuts is valid: a sheared section, top and underside offset.
  assert.equal(
    roofFaceRings({ ...narrow, points: narrow.points.map((p) => ({ x: p.x, y: p.y * 2 })) }).top
      .length,
    4,
  );
  for (const change of [
    { pitch: 0.5 },
    { pitch: 85 },
    { thickness: 0 },
    { referenceLine: { start: { x: 1, y: 1 }, end: { x: 1, y: 1 } } },
    { points: [SQUARE[0], SQUARE[2], SQUARE[1], SQUARE[3]] },
    { eaveCut: "diagonal" },
  ])
    assert.throws(() => roofSchema.parse({ ...roof45, id: "r", layerId: "l", ...change }));
});

test("roof actions: default layer, one checked update, storey elevation from the storey sequence", () => {
  const base = createStandardProject("p", "eg", "og");
  const upper = selectWorkingStorey(base, base, "og");
  const withRoof = addRoof(upper, { ...roof45, id: "dach" });
  const roof = storeyOf(withRoof).roofs![0]!;
  assert.equal(roof.layerId, defaultRoofLayerId(withRoof));
  assert.equal(withRoof.layers.find((l) => l.id === roof.layerId)!.name, "Dach");
  // The roof hangs at the OG floor (EG 3,00 m); nothing absolute is stored.
  assert.equal(roofStoreyElevation(withRoof, "og"), 3);
  const updated = updateRoof(withRoof, "dach", { pitch: 30, thickness: 0.3 });
  assert.deepEqual(
    [storeyOf(updated).roofs![0]!.pitch, storeyOf(updated).roofs![0]!.thickness],
    [30, 0.3],
  );
  assert.throws(() => updateRoof(withRoof, "dach", { pitch: 90 }));
  assert.throws(() => updateRoof(withRoof, "unbekannt", { pitch: 30 }), /Unbekanntes Dach/);
  assert.equal(storeyOf(withRoof).roofs![0]!.pitch, 45, "refused change keeps the project");
  assert.throws(() => addRoof(withRoof, { ...roof45, id: "dach" }), /Duplicate ID/);
  // Changing the EG height moves the roof; changing the OG's own height does not.
  const egHigher = setStoreyHeight(withRoof, withRoof, {
    projectId: "p",
    storeyId: "eg",
    height: 3.5,
  });
  assert.equal(roofStoreyElevation(egHigher, "og"), 3.5);
  const ogHigher = setStoreyHeight(withRoof, withRoof, {
    projectId: "p",
    storeyId: "og",
    height: 4,
  });
  assert.equal(roofStoreyElevation(ogHigher, "og"), 3);
  assert.deepEqual(storeyOf(egHigher).roofs, storeyOf(withRoof).roofs);
});
