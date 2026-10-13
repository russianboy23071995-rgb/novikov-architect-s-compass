import test from "node:test";
import assert from "node:assert/strict";
import {
  resolveStoreyLevels,
  changeStoreyHeight,
  insertStorey,
  type StoreyHeight,
} from "./heights.ts";

const building = Object.freeze([
  Object.freeze({ id: "ug2", height: 2.5, name: "Archiv" }),
  Object.freeze({ id: "ug1", height: 2.8, name: "Keller" }),
  Object.freeze({ id: "eg", height: 3.2, name: "Eingang" }),
  Object.freeze({ id: "og", height: 3, name: "Büro" }),
]);
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
