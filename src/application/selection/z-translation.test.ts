import test from "node:test";
import assert from "node:assert/strict";
import { prepareZTranslation } from "./z-translation.ts";
import { prepareTranslation } from "../../domain/project/prepared-translation.ts";
import { fullConfirmationCount } from "../../domain/project/prepared-snapshot.ts";
import { createProject } from "../projects/create.ts";
import { addWindow } from "../windows/actions.ts";
import { addWall } from "../walls/actions.ts";
import { createHistory, undoProject, redoProject } from "../history/project-history.ts";
import { validateProject } from "../../domain/project/schema.ts";
import { storeyOf } from "../../domain/storeys/access.ts";
import { buildBuildingSolid } from "../../rendering/viewport/building-solid.ts";
import {
  selectionMoveSurfaces,
  selectionMoveWindows,
} from "../../rendering/viewport/selection-move-preview.ts";
import { windowSelectionSurfaces } from "../../rendering/viewport/window-selection.ts";
function fixture() {
  let p = createProject("p", "eg");
  for (const [id, start, end] of [
    ["a", { x: 0, y: 0 }, { x: 4, y: 0 }],
    ["b", { x: 4, y: 0 }, { x: 4, y: 4 }],
    ["c", { x: 4, y: 4 }, { x: 8, y: 4 }],
  ] as const)
    p = addWall(p, { id, start, end, height: 2.8, thickness: 0.36 });
  return addWindow(p, {
    id: "win",
    wallId: "a",
    width: 1.2,
    height: 1.2,
    sillHeight: 0.9,
    position: 0.5,
  });
}
const pair = [
  { kind: "wall", id: "a" },
  { kind: "wall", id: "b" },
  { kind: "window", id: "win" },
] as const;
test("Z preview matches full commit with internal join, detached neighbour and window exactly once", () => {
  const h = createHistory(fixture()),
    p = h.present,
    action = prepareZTranslation(p, pair);
  for (const dz of [-0.5, 0, 0.7]) {
    const preview = action.evaluate(p, pair, dz),
      next = action.materialize(p, pair, dz);
    assert.deepEqual(
      selectionMoveSurfaces(buildBuildingSolid(p), p, preview).faces,
      buildBuildingSolid(next).faces,
    );
    assert.deepEqual(
      selectionMoveWindows(
        windowSelectionSurfaces(p, () => true),
        p,
        preview,
        () => true,
      ),
      windowSelectionSurfaces(next, () => true),
    );
    assert.equal(storeyOf(next).walls[0]!.baseOffset ?? 0, dz);
    assert.equal(storeyOf(next).walls[2]!.baseOffset ?? 0, 0);
    assert.deepEqual(storeyOf(next).windows, storeyOf(p).windows);
    assert.equal(storeyOf(next).wallJoins.length, dz === 0 ? 2 : 1);
  }
  assert.equal(storeyOf(p).wallJoins.length, 2);
  const moved = action.commit(h, pair, 0.5);
  assert.equal(moved.past.length, 1);
  assert.deepEqual(undoProject(moved).present, p);
  assert.deepEqual(redoProject(undoProject(moved)).present, moved.present);
  assert.equal(action.commit(h, pair, 0), h);
});
test("Z action rejects invalid/stale inputs and mutated base; cancellation changes no model", () => {
  const p = fixture(),
    before = JSON.stringify(p),
    a = prepareZTranslation(p, pair);
  for (const dz of [NaN, Infinity, Number.MAX_VALUE]) assert.throws(() => a.evaluate(p, pair, dz));
  assert.throws(() => a.evaluate({ ...p }, pair, 1));
  assert.throws(() => a.evaluate(p, [pair[0]], 1));
  assert.throws(() => prepareZTranslation(p, [pair[2]]));
  assert.throws(() => prepareZTranslation(p, [{ kind: "line", id: "a" }]));
  a.evaluate(p, pair, 1);
  assert.equal(JSON.stringify(p), before);
  storeyOf(p).walls[0]!.height = 3;
  assert.throws(() => a.materialize(p, pair, 1));
});
test("Z detaches external T and preserves a selected T pair", () => {
  let p = addWall(createProject("p", "eg"), {
    id: "host",
    start: { x: 0, y: 0 },
    end: { x: 5, y: 0 },
    height: 2.8,
    thickness: 0.36,
  });
  p = addWall(p, {
    id: "in",
    start: { x: 2, y: -3 },
    end: { x: 2, y: 0 },
    height: 2.8,
    thickness: 0.36,
  });
  storeyOf(p).wallTJunctions = [{ hostWallId: "host", incoming: { wallId: "in", endpoint: 1 } }];
  p = validateProject(p);
  for (const ids of [["host"], ["host", "in"]]) {
    const targets = ids.map((id) => ({ kind: "wall" as const, id }));
    const a = prepareZTranslation(p, targets),
      next = a.materialize(p, targets, 0.5);
    assert.equal(storeyOf(next).wallTJunctions.length, ids.length === 1 ? 0 : 1);
    assert.deepEqual(
      selectionMoveSurfaces(buildBuildingSolid(p), p, a.evaluate(p, targets, 0.5)).faces,
      buildBuildingSolid(next).faces,
    );
  }
});

test("Z action moves across storeys without changing ownership or floor heights", () => {
  let p = fixture();
  const eg = storeyOf(p);
  p = validateProject({
    ...p,
    storeys: [
      { ...eg, height: 3 },
      {
        ...eg,
        id: "og",
        name: "OG",
        height: 3,
        walls: eg.walls.map((w) => ({ ...w, id: w.id + "2" })),
        windows: eg.windows.map((w) => ({ ...w, id: w.id + "2", wallId: w.wallId + "2" })),
        wallJoins: eg.wallJoins.map((j) => ({
          first: { ...j.first, wallId: j.first.wallId + "2" },
          second: { ...j.second, wallId: j.second.wallId + "2" },
        })),
      },
    ],
  });
  const targets = [
    { kind: "wall", id: "a" },
    { kind: "wall", id: "a2" },
  ] as const;
  const a = prepareZTranslation(p, targets),
    next = a.materialize(p, targets, -0.4);
  assert.deepEqual(
    next.storeys.map((s) => [s.id, s.height, s.walls.map((w) => w.id)]),
    p.storeys.map((s) => [s.id, s.height, s.walls.map((w) => w.id)]),
  );
  const preview = selectionMoveSurfaces(buildBuildingSolid(p), p, a.evaluate(p, targets, -0.4));
  assert.deepEqual(
    preview.faces.map((f) => JSON.stringify(f)).sort(),
    buildBuildingSolid(next)
      .faces.map((f) => JSON.stringify(f))
      .sort(),
  );
  for (const s of next.storeys) assert.equal(s.walls[0]!.baseOffset, -0.4);
});

// Confirming a move on an owned project without a whole-project validation (user decision
// 27.10.2026, docs/performance/OWNED_MOVE_CONFIRMATION.md).
test("owned projects confirm Z and XY moves without a full check and with identical results", () => {
  const owned = createHistory(fixture()).present;
  const mutable = validateProject(owned);
  const targets = [{ kind: "wall", id: "a" }] as const;
  const before = fullConfirmationCount();
  const z = prepareZTranslation(owned, [...targets]).materialize(owned, [...targets], 0.5);
  const xy = prepareTranslation(owned, ["a"]).materialize(owned, { x: 0.25, y: 0 });
  assert.equal(fullConfirmationCount(), before);
  // A mutable caller copy still takes the full check and yields the same models.
  const zMutable = prepareZTranslation(mutable, [...targets]).materialize(
    mutable,
    [...targets],
    0.5,
  );
  const xyMutable = prepareTranslation(mutable, ["a"]).materialize(mutable, { x: 0.25, y: 0 });
  assert.equal(fullConfirmationCount(), before + 2);
  assert.equal(JSON.stringify(z), JSON.stringify(zMutable));
  assert.equal(JSON.stringify(xy), JSON.stringify(xyMutable));
});

test("changed models are still rejected on confirmation (counter-checks)", () => {
  const owned = createHistory(fixture()).present;
  const targets = [{ kind: "wall", id: "a" }] as const;
  // Another project object, even with the same content, ends the move.
  const z = prepareZTranslation(owned, [...targets]);
  assert.throws(() => z.materialize(validateProject(owned), [...targets], 0.5), /geändert/);
  assert.throws(
    () =>
      prepareTranslation(owned, ["a"]).materialize(createHistory(fixture()).present, {
        x: 1,
        y: 0,
      }),
    /geändert/,
  );
  // A mutable input changed in place after preparation is detected by the full check.
  const mutable = validateProject(owned);
  const xy = prepareTranslation(mutable, ["a"]);
  storeyOf(mutable).walls[0]!.thickness = 0.3;
  assert.throws(() => xy.materialize(mutable, { x: 1, y: 0 }), /geändert/);
});
