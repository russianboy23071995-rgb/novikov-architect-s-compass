import test from "node:test";
import assert from "node:assert/strict";
import { createStandardProject } from "../projects/create.ts";
import { addObject, updateObject } from "./actions.ts";
import { chooseObject, objectSettings, objectToolDefaults, objectValues } from "./defaults.ts";
import { objectOutline, objectSolids, objectSymbol } from "../../domain/elements/object/model.ts";
import {
  objectRule,
  tableChairCounts,
  sofaSeats,
  tableChairTotal,
  type ObjectOptions,
} from "../../domain/elements/object/rules.ts";
import { objectBody } from "../../rendering/viewport/object-solid.ts";
import { objectAxonometricPreview } from "../../rendering/viewport/object-preview.ts";
import { storeyOf } from "../../domain/storeys/access.ts";
import { PROJECT_SCHEMA_VERSION } from "../../domain/project/format.ts";
import { deserializeProject, serializeProject } from "../../lib/bim/model.ts";

// docs/OBJEKTBIBLIOTHEK.md, M2.
const table = (width: number, options: ObjectOptions = {}) => ({
  id: "t",
  catalogId: "table" as const,
  position: { x: 0, y: 0 },
  rotation: 0,
  width,
  depth: 0.9,
  height: 0.75,
  baseOffset: 0,
  options,
});
const extent = (ring: readonly { x: number }[]) => {
  const xs = ring.map((p) => p.x);
  return Math.max(...xs) - Math.min(...xs);
};

test("a wider table keeps its leg and top thickness, the top follows the width", () => {
  const narrow = objectRule("table")!.shape(table(1.2)),
    wide = objectRule("table")!.shape(table(3));
  const legs = (s: typeof narrow) => s.parts.filter((p) => p.slot === "frame");
  assert.equal(legs(wide).length, 4);
  assert.ok(Math.abs(extent(legs(wide)[0]!.ring) - extent(legs(narrow)[0]!.ring)) < 1e-9);
  const top = (s: typeof narrow) => s.parts.find((p) => p.slot === "top")!;
  assert.ok(Math.abs(extent(top(wide).ring) - 3) < 1e-9);
  assert.equal(top(wide).top - top(wide).bottom, top(narrow).top - top(narrow).bottom);
});

test("chairs: automatic by length, fixed by number, ends on request", () => {
  assert.equal(tableChairTotal(table(1.6, { chairs: "auto" })), 4);
  assert.equal(tableChairTotal(table(2.4, { chairs: "auto" })), 8);
  assert.equal(tableChairTotal(table(2.4, { chairs: "auto", headChairs: true })), 10);
  assert.equal(tableChairTotal(table(2.4)), 0);
  assert.deepEqual(tableChairCounts(table(2.4, { chairs: 5 })), { front: 2, back: 3, ends: 0 });
  assert.deepEqual(tableChairCounts(table(2.4, { chairs: 5, headChairs: true })), {
    front: 1,
    back: 2,
    ends: 2,
  });
  // More than the length holds is capped, not stacked.
  assert.equal(tableChairTotal(table(1, { chairs: 40 })), 4);
  // Longer table, more chairs in the parts and the plan.
  const seats = (w: number) =>
    objectRule("table")!
      .shape(table(w, { chairs: "auto" }))
      .parts.filter((p) => p.slot === "seat").length;
  assert.equal(seats(1.6), 4);
  assert.equal(seats(3), 10);
  assert.equal(objectSymbol(table(2.4, { chairs: "auto" })).length, 1 + 8 * 2);
});

test("every outline is convex and counterclockwise, also mirrored and turned", () => {
  for (const tableTop of ["rectangle", "rounded", "oval"] as const)
    for (const mirrored of [false, true]) {
      const o = {
        ...table(2.4, { tableTop, chairs: "auto", headChairs: true }),
        rotation: 30,
        mirrored,
      };
      for (const { ring } of objectSolids(o))
        ring.forEach((a, i) => {
          const b = ring[(i + 1) % ring.length]!,
            c = ring[(i + 2) % ring.length]!;
          const cross = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
          assert.ok(cross > -1e-9, `${tableTop} ${mirrored}`);
        });
    }
});

test("sofa: armrests and back keep their size, cushions follow the length", () => {
  const sofa = (width: number, options: ObjectOptions = {}) => ({
    catalogId: "sofa" as const,
    position: { x: 0, y: 0 },
    rotation: 0,
    width,
    depth: 0.9,
    height: 0.8,
    baseOffset: 0,
    options,
  });
  assert.equal(sofaSeats(sofa(2)), 2);
  assert.equal(sofaSeats(sofa(3)), 4);
  assert.equal(sofaSeats(sofa(0.8)), 1);
  const shape = (o: ReturnType<typeof sofa>) => objectRule("sofa")!.shape(o);
  const arms = (o: ReturnType<typeof sofa>) =>
    shape(o).parts.filter((p) => p.slot === "body" && p.top < 0.7);
  // Base plus two arms; the arm stays 20 cm on a longer sofa.
  assert.equal(arms(sofa(2)).length, 3);
  assert.ok(Math.abs(extent(arms(sofa(3))[1]!.ring) - 0.2) < 1e-9);
  assert.equal(arms(sofa(2, { sofaArms: "left" })).length, 2);
  assert.equal(arms(sofa(2, { sofaArms: "none" })).length, 1);
  // Without arms the cushions reach further: three seats instead of two on 1,8 m.
  assert.equal(sofaSeats(sofa(1.8)), 2);
  assert.equal(sofaSeats(sofa(1.8, { sofaArms: "none" })), 3);
  for (const { ring, bottom, top } of objectSolids(sofa(2.4, { sofaArms: "right" }))) {
    assert.ok(top > bottom);
    ring.forEach((a, i) => {
      const b = ring[(i + 1) % ring.length]!,
        c = ring[(i + 2) % ring.length]!;
      assert.ok((b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x) > -1e-9);
    });
  }
  // Every part stays inside the box at the smallest sizes too.
  const tiny = { ...sofa(0.1), depth: 0.1, height: 0.02 };
  assert.ok(objectBody({ ...tiny, id: "s" }, 0).volume > 0);
});

test("the click outline holds the chairs; a chair on its own follows its size", () => {
  const plain = objectOutline(table(1.6));
  const seated = objectOutline(table(1.6, { chairs: "auto" }));
  const height = (ring: { y: number }[]) =>
    Math.max(...ring.map((p) => p.y)) - Math.min(...ring.map((p) => p.y));
  assert.ok(Math.abs(height(plain) - 0.9) < 1e-9);
  assert.ok(Math.abs(height(seated) - (0.9 + 2 * 0.52)) < 1e-9);
  const chair = objectRule("chair")!.shape({ width: 0.6, depth: 0.55, height: 0.9 });
  assert.ok(chair.parts.every((p) => p.top <= 0.9));
  assert.ok(Math.abs(extent(chair.parts.find((p) => p.slot === "seat")!.ring) - 0.6) < 1e-9);
});

test("finishes colour the 3D body and the preview; standard colours stay without one", () => {
  const painted = {
    ...table(1.6),
    finishes: { top: { color: "#ff0000" } },
  };
  const { faces, volume } = objectBody(painted, 0);
  assert.ok(volume > 0);
  assert.deepEqual(faces[0]!.color, [1, 0, 0]);
  assert.ok(faces.every((f) => f.object && f.color));
  assert.ok(objectAxonometricPreview(painted).faces.some((f) => f.color === "#ff0000"));
  // Entries without a rule keep their plain body.
  const wc = { ...table(1), catalogId: "wc" as const, depth: 0.65 };
  assert.ok(objectBody(wc, 0).faces.every((f) => !f.color));
});

test("tool values: a table starts with automatic chairs; values round-trip through the file", () => {
  let p = createStandardProject("p", "eg", "og");
  const start = chooseObject(objectToolDefaults(p.layers[0]!.id, "wc"), "table");
  assert.equal(start.options.chairs, "auto");
  assert.deepEqual(chooseObject(start, "wc").options, {});
  const values = {
    ...start,
    finishes: { seat: { color: "#112233", materialId: "material-putz" } },
  };
  p = addObject(p, { id: "o", position: { x: 1, y: 2 }, ...objectValues(values) });
  assert.deepEqual(objectSettings(storeyOf(p).objects![0]!), values);
  const back = deserializeProject(serializeProject(p));
  assert.deepEqual(storeyOf(back).objects, storeyOf(p).objects);
  assert.equal(back.schemaVersion, PROJECT_SCHEMA_VERSION);
  assert.throws(() => updateObject(p, "o", { options: { chairs: 41 } }));
  assert.throws(() => updateObject(p, "o", { finishes: { top: { color: "rot" } } }));
});

test("file 58: plain objects load, options or finishes are refused", () => {
  const p = addObject(createStandardProject("p", "eg", "og"), {
    id: "o",
    catalogId: "table",
    position: { x: 0, y: 0 },
  });
  const old = JSON.parse(serializeProject(p));
  old.schemaVersion = 58;
  assert.deepEqual(storeyOf(deserializeProject(JSON.stringify(old))).objects, storeyOf(p).objects);
  old.storeys[0].objects[0].options = { chairs: "auto" };
  assert.throws(() => deserializeProject(JSON.stringify(old)));
});
