import test from "node:test";
import assert from "node:assert/strict";
import { createStandardProject } from "../projects/create.ts";
import { addObject } from "./actions.ts";
import { objectToolDefaults, chooseObject, objectValues } from "./defaults.ts";
import { copyTransformed } from "../selection/copy-transform.ts";
import { beginSelectionMirror, previewSelectionMirror } from "../selection/mirror.ts";
import { beginSelectionMove, previewSelectionMove } from "../selection/move.ts";
import { beginSelectionRotation, previewSelectionRotation } from "../selection/rotate.ts";
import type { SelectionSet } from "../selection/state.ts";
import type { ObjectCatalogId } from "../../domain/elements/object/catalog.ts";
import { objectSolids, type PlacedObject } from "../../domain/elements/object/model.ts";
import type { ObjectFinishes, ObjectOptions } from "../../domain/elements/object/rules.ts";
import { storeyOf } from "../../domain/storeys/access.ts";
import type { Project, Point } from "../../domain/project/schema.ts";

// docs/TASTENKUERZEL.md, B4: the movement commands against the objects with build rules.
const CASES: [ObjectCatalogId, ObjectOptions, ObjectFinishes][] = [
  ["table", { tableTop: "oval", chairs: "auto", headChairs: true }, { top: { color: "#112233" } }],
  ["chair", {}, { seat: { color: "#445566" } }],
  ["sofa", { sofaArms: "left" }, { body: { color: "#778899" } }],
  ["television", { tvMount: "stand" }, { screen: { color: "#aabbcc" } }],
  ["car", {}, { glass: { color: "#ddeeff" } }],
];
const target: SelectionSet = [{ kind: "object", id: "o" }];
function placed(id: ObjectCatalogId, options: ObjectOptions, finishes: ObjectFinishes): Project {
  const p = createStandardProject("p", "eg", "og");
  const values = chooseObject(objectToolDefaults(p.layers[0]!.id, "wc"), id);
  return addObject(p, {
    id: "o",
    position: { x: 1, y: 2 },
    ...objectValues({ ...values, rotation: 30, options, finishes }),
  });
}
const object = (p: Project) => storeyOf(p).objects!.find((o) => o.id === "o")!;
/** Every corner of every part, in a fixed order, so two bodies compare point by point. */
const corners = (o: PlacedObject, at: (q: Point) => Point = (q) => q) =>
  objectSolids(o)
    .flatMap(({ ring, bottom, top }) =>
      ring
        .map(at)
        .map((q) => [q.x, q.y, bottom, top].map((n) => Math.round(n * 1e7) / 1e7 || 0).join(" ")),
    )
    .sort();

for (const [id, options, finishes] of CASES) {
  const keeps = (o: PlacedObject) => {
    // Empty options are not stored.
    assert.deepEqual(o.options ?? {}, options, id);
    assert.deepEqual(o.finishes, finishes, id);
  };

  test(`${id}: moving, turning and mirroring carry the whole body and its values`, () => {
    const p = placed(id, options, finishes);
    const start = object(p);

    const moved = object(
      previewSelectionMove(beginSelectionMove(p, target, { x: 0, y: 0 }), p, target, {
        x: 3,
        y: -1,
      }),
    );
    keeps(moved);
    assert.deepEqual(
      corners(moved),
      corners(start, (q) => ({ x: q.x + 3, y: q.y - 1 })),
    );

    const turnedProject = previewSelectionRotation(
      beginSelectionRotation(p, target, { x: 0, y: 0 }, { x: 1, y: 0 }),
      p,
      target,
      90,
    );
    keeps(object(turnedProject));
    assert.deepEqual(
      corners(object(turnedProject)),
      corners(start, (q) => ({ x: -q.y, y: q.x })),
    );

    const mirror = (from: Project) =>
      previewSelectionMirror(beginSelectionMirror(from, target, { x: 5, y: 0 }), from, target, 90);
    const flipped = mirror(p);
    keeps(object(flipped));
    assert.equal(object(flipped).mirrored, true);
    assert.deepEqual(
      corners(object(flipped)),
      corners(start, (q) => ({ x: 10 - q.x, y: q.y })),
    );
    // A second mirror at the same axis gives the same body back.
    assert.deepEqual(corners(object(mirror(flipped))), corners(start));
  });

  test(`${id}: a copy keeps options and finishes, the original stays`, () => {
    const p = placed(id, options, finishes);
    const moved = previewSelectionMove(beginSelectionMove(p, target, { x: 0, y: 0 }), p, target, {
      x: 6,
      y: 0,
    });
    const result = copyTransformed(p, moved, target, (kind) => `${kind}-neu`);
    const objects = storeyOf(result.project).objects!;
    assert.equal(objects.length, 2);
    assert.deepEqual(objects[0], object(p));
    keeps(objects[1]!);
    assert.deepEqual(objects[1]!.position, { x: 7, y: 2 });
  });
}
