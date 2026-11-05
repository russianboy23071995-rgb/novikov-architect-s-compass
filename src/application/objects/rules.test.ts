import test from "node:test";
import assert from "node:assert/strict";
import { createStandardProject } from "../projects/create.ts";
import { addObject, updateObject } from "./actions.ts";
import { chooseObject, objectSettings, objectToolDefaults, objectValues } from "./defaults.ts";
import {
  objectOutline,
  objectPickRings,
  objectSolids,
  objectSymbol,
} from "../../domain/elements/object/model.ts";
import { hoverCycle, stepCycle, cycleTarget } from "../selection/cycle.ts";
import { shapesAt } from "../../rendering/viewport/selection-shapes.ts";
import {
  OBJECT_CATALOG,
  OBJECT_CATALOG_IDS,
  searchObjects,
  type ObjectCatalogId,
} from "../../domain/elements/object/catalog.ts";
import { exportIfc } from "../../lib/bim/ifc.ts";
import {
  objectBoards,
  objectFronts,
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

const placedAt = (catalogId: "car" | "television", size: object, options: ObjectOptions = {}) => ({
  id: catalogId,
  catalogId,
  position: { x: 0, y: 0 },
  rotation: 0,
  baseOffset: 0,
  options,
  ...(size as { width: number; depth: number; height: number }),
});
const convex = (ring: readonly { x: number; y: number }[]) =>
  ring.every((a, i) => {
    const b = ring[(i + 1) % ring.length]!,
      c = ring[(i + 2) % ring.length]!;
    return (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x) > -1e-9;
  });

test("car: wheels show a circle, the cabin narrows upwards, every size stays closed", () => {
  const car = placedAt("car", { width: 4.7, depth: 1.85, height: 1.5 });
  const shape = objectRule("car")!.shape(car);
  const wheels = shape.parts.filter((p) => p.slot === "frame");
  assert.equal(wheels.length, 4 * 12);
  // One wheel: narrow at the ground, widest at the axle.
  const wheel = wheels.slice(0, 12).map((p) => extent(p.ring));
  assert.ok(wheel[0]! < wheel[5]! && wheel[11]! < wheel[6]!);
  const glass = shape.parts.filter((p) => p.slot === "glass").map((p) => extent(p.ring));
  assert.ok(glass.every((w, i) => i === 0 || w < glass[i - 1]!));
  assert.ok(Math.max(...shape.parts.map((p) => p.top)) === 1.5);
  // Length and height stay inside the box the fields show.
  assert.ok(Math.abs(extent(objectOutline(car)) - 4.7) < 1e-9);
  for (const o of [car, placedAt("car", { width: 0.1, depth: 0.1, height: 0.02 })]) {
    assert.ok(objectBody(o, 0).volume > 0);
    for (const { ring, bottom, top } of objectSolids(o)) {
      assert.ok(top > bottom);
      assert.ok(convex(ring));
    }
  }
});

test("television: foot or wall, the screen sits in front and takes its own colour", () => {
  const size = { width: 1.45, depth: 0.1, height: 0.9 };
  const stand = placedAt("television", size, { tvMount: "stand" });
  const wall = placedAt("television", size, { tvMount: "wall" });
  const parts = (o: typeof stand) => objectRule("television")!.shape(o).parts;
  assert.equal(parts(stand).filter((p) => p.slot === "frame").length, 2);
  assert.equal(parts(wall).filter((p) => p.slot === "frame").length, 0);
  assert.equal(parts(wall).find((p) => p.slot === "body")!.bottom, 0);
  assert.ok(parts(stand).find((p) => p.slot === "body")!.bottom > 0);
  const screen = parts(stand).find((p) => p.slot === "screen")!;
  assert.ok(Math.min(...screen.ring.map((p) => p.y)) === -0.05);
  // The foot is deeper than the set; the click outline holds it.
  const ys = objectOutline(stand).map((p) => p.y);
  assert.ok(Math.max(...ys) - Math.min(...ys) > 0.2);
  const red = { ...wall, finishes: { screen: { color: "#ff0000" } } };
  assert.ok(objectBody(red, 0).faces.some((f) => f.color?.[0] === 1));
  for (const o of [stand, wall, placedAt("television", { width: 0.1, depth: 0.1, height: 0.02 })]) {
    assert.ok(objectBody(o, 0).volume > 0);
    assert.ok(objectSolids(o).every(({ ring, bottom, top }) => top > bottom && convex(ring)));
  }
});

test("search: names, other words, genres, umlauts, several words", () => {
  assert.deepEqual(searchObjects("sofa"), ["sofa"]);
  assert.deepEqual(searchObjects("COUCH"), ["coffee-table", "sofa"]);
  assert.deepEqual(searchObjects("wc"), ["wc"]);
  assert.deepEqual(searchObjects("klo"), ["wc"]);
  assert.deepEqual(searchObjects("tv"), ["television"]);
  assert.deepEqual(searchObjects("auto"), ["car"]);
  assert.deepEqual(searchObjects("  "), []);
  assert.deepEqual(searchObjects("xyz"), []);
  // A name that starts with the word comes first.
  const bath = searchObjects("bad");
  assert.equal(bath[0], "bathtub");
  assert.deepEqual([...bath].sort(), ["bathtub", "shower", "washbasin", "wc"]);
  assert.ok(
    ["table", "washbasin", "desk"].every((id) => searchObjects("tisch").includes(id as never)),
  );
  assert.deepEqual(searchObjects("kuehlschrank"), ["fridge"]);
  assert.deepEqual(searchObjects("kühlschrank"), ["fridge"]);
  assert.deepEqual(searchObjects("kuhlschrank"), ["fridge"]);
  assert.deepEqual(searchObjects("bett schlaf").length, 3);
  assert.deepEqual(searchObjects("bett doppel"), ["bed-double"]);
  assert.equal(searchObjects("küche").length, 4 + 2);
});

test("IFC: television and car leave as their own classes", async () => {
  let p = createStandardProject("p", "eg", "og");
  p = addObject(p, { id: "tv", catalogId: "television", position: { x: 0, y: 0 } });
  p = addObject(p, { id: "car", catalogId: "car", position: { x: 5, y: 0 } });
  const ifc = await exportIfc(p, new Date("2026-11-05T12:00:00Z"));
  assert.match(ifc, /=IFCAUDIOVISUALAPPLIANCE\(.*\.DISPLAY\.\)/);
  assert.match(ifc, /=IFCBUILDINGELEMENTPROXY\(.*'Pkw'.*\.USERDEFINED\.\)/);
});

test("pick area: the parts, not the box; a free corner of a turned sofa selects nothing", () => {
  const sofa = {
    id: "s",
    catalogId: "sofa" as const,
    position: { x: 0, y: 0 },
    rotation: 45,
    width: 2,
    depth: 0.9,
    height: 0.8,
    baseOffset: 0,
    options: { sofaArms: "none" as const },
  };
  const shape = {
    target: { kind: "object" as const, id: "s" },
    points: objectOutline(sofa),
    closed: true,
    pick: objectPickRings(sofa),
  };
  assert.equal(shapesAt([shape], { x: 0, y: 0 }, 0).length, 1);
  // In the box corner at the front, but outside the sofa: nothing without its arm.
  const corner = objectOutline(sofa)[0]!;
  assert.equal(shapesAt([shape], { x: corner.x * 0.99, y: corner.y * 0.99 }, 0).length, 0);
  // Between table and chairs nothing either.
  assert.ok(objectPickRings(table(1.6, { chairs: "auto" })).length > 4);
  // The seam between two cushions belongs to the sofa, few outlines hold it all.
  assert.ok(objectPickRings(sofa).length <= 3);
});

test("overlap: a choice made with Tab stays until the click", () => {
  const a = { kind: "wall", id: "a" } as const,
    b = { kind: "hatch", id: "b" } as const,
    c = { kind: "slab", id: "c" } as const;
  let cycle = hoverCycle(null, [a, b])!;
  assert.equal(cycle.expanded, false);
  cycle = stepCycle(stepCycle(cycle));
  assert.deepEqual(cycleTarget(cycle), b);
  // Another element joins, the order changes: b stays chosen.
  cycle = hoverCycle(cycle, [c, a, b])!;
  assert.deepEqual([cycleTarget(cycle), cycle.expanded], [b, true]);
  // b alone under the cursor stays chosen as well.
  cycle = hoverCycle(cycle, [b])!;
  assert.deepEqual([cycleTarget(cycle), cycle.expanded], [b, true]);
  // Off b the choice waits, and comes back on the way in.
  cycle = hoverCycle(cycle, [])!;
  assert.deepEqual([cycle.expanded, cycle.pin], [false, b]);
  cycle = hoverCycle(cycle, [a])!;
  assert.equal(cycle.expanded, false);
  cycle = hoverCycle(cycle, [a, b])!;
  assert.deepEqual([cycleTarget(cycle), cycle.expanded], [b, true]);
  // Without a choice everything stays as before.
  assert.equal(hoverCycle(hoverCycle(null, [a, b]), [a]), null);
});

const piece = (catalogId: ObjectCatalogId, options: ObjectOptions = {}) => ({
  id: "m",
  catalogId,
  position: { x: 0, y: 0 },
  rotation: 0,
  baseOffset: 0,
  options,
  ...OBJECT_CATALOG[catalogId].size,
});

test("every piece with a rule is closed and convex, also at the smallest size", () => {
  for (const id of OBJECT_CATALOG_IDS)
    if (objectRule(id))
      for (const o of [piece(id), { ...piece(id), width: 0.1, depth: 0.1, height: 0.02 }]) {
        assert.ok(objectBody(o, 0).volume > 0, id);
        for (const { ring, bottom, top } of objectSolids(o)) {
          assert.ok(top >= bottom, id);
          assert.ok(convex(ring), id);
        }
        assert.ok(objectSymbol(o).length > 0, id);
      }
});

test("beds: the rails keep their size, two pillows from a double width", () => {
  const seat = (id: "bed-single" | "bed-double") =>
    objectRule(id)!
      .shape(piece(id))
      .parts.filter((p) => p.top > piece(id).height + 0.05).length;
  // The headboard rises too; pillows are the rest.
  assert.equal(seat("bed-single") - 1, 1);
  assert.equal(seat("bed-double") - 1, 2);
});

test("cabinets and shelves: doors and boards follow the size or a fixed number", () => {
  assert.equal(objectFronts(piece("wardrobe", { fronts: "auto" })), 2);
  assert.equal(objectFronts({ ...piece("wardrobe"), width: 2.4 }), 4);
  assert.equal(objectFronts(piece("wardrobe", { fronts: 3 })), 3);
  const fronts = (o: ReturnType<typeof piece>) =>
    objectRule(o.catalogId)!
      .shape(o)
      .parts.filter((p) => p.slot === "top").length;
  assert.equal(fronts(piece("sideboard", { fronts: "auto" })), 3);
  assert.equal(fronts(piece("nightstand")), 2);
  assert.equal(objectBoards(piece("shelf", { boards: "auto" })), 7);
  assert.equal(objectBoards(piece("shelf", { boards: 4 })), 4);
  assert.equal(fronts(piece("shelf", { boards: 4 })), 4);
  // A 2.40 m wardrobe keeps its door depth; the body stays inside the box.
  const wide = { ...piece("wardrobe"), width: 2.4 };
  assert.ok(objectSolids(wide).every(({ top }) => top <= 2.1 + 1e-9));
});

test("new pieces reuse the table and the sofa", () => {
  assert.equal(tableChairTotal(piece("coffee-table")), 0);
  const oval = objectRule("coffee-table")!.shape(piece("coffee-table", { tableTop: "oval" }));
  assert.ok(oval.parts.find((p) => p.slot === "top")!.ring.length > 20);
  assert.equal(sofaSeats(piece("armchair")), 1);
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

test("kitchen and bathroom: options change the parts", () => {
  const parts = (o: ReturnType<typeof piece>) => objectRule(o.catalogId)!.shape(o).parts;
  const fridgeDoors = (fridgeDoors: "one" | "two") =>
    parts(piece("fridge", { fridgeDoors })).filter((p) => p.slot === "top").length;
  assert.deepEqual([fridgeDoors("two"), fridgeDoors("one")], [2, 1]);
  const panes = (showerGlass: "none" | "side" | "corner") =>
    parts(piece("shower", { showerGlass })).filter((p) => p.slot === "glass").length;
  assert.deepEqual([panes("none"), panes("side"), panes("corner")], [0, 1, 2]);
  const lowest = (basinMount: "wall" | "cabinet") =>
    Math.min(...parts(piece("washbasin", { basinMount })).map((p) => p.bottom));
  assert.ok(lowest("wall") > 0.5);
  assert.equal(lowest("cabinet"), 0);
  // The worktop runs through, the fronts follow the width.
  const counter = parts(piece("kitchen-counter", { fronts: "auto" }));
  assert.equal(counter.filter((p) => p.slot === "top").length, 1);
  assert.equal(counter.filter((p) => p.slot === "seat").length, 4);
  // A basin leaves its middle open: the edge is four bars, the floor lies lower.
  const sink = parts(piece("sink"));
  assert.equal(sink.filter((p) => p.slot === "top").length, 4);
  assert.ok(sink.find((p) => p.slot === "glass")!.top < 0.9);
  const stove = parts(piece("stove"));
  assert.equal(stove.filter((p) => p.slot === "screen").length, 4);
});

test("file 61: old entries load, the new options are refused", () => {
  const p = addObject(createStandardProject("p", "eg", "og"), {
    id: "o",
    catalogId: "shower",
    position: { x: 0, y: 0 },
  });
  const file = () => {
    const old = JSON.parse(serializeProject(p));
    old.schemaVersion = 61;
    delete old.storeys[0].objects[0].options;
    return old;
  };
  assert.equal(deserializeProject(JSON.stringify(file())).schemaVersion, PROJECT_SCHEMA_VERSION);
  const glass = file();
  glass.storeys[0].objects[0].options = { showerGlass: "side" };
  assert.throws(() => deserializeProject(JSON.stringify(glass)));
});

test("file 60: old entries load, new furniture and options are refused", () => {
  const p = addObject(createStandardProject("p", "eg", "og"), {
    id: "o",
    catalogId: "wardrobe",
    position: { x: 0, y: 0 },
  });
  const file = () => {
    const old = JSON.parse(serializeProject(p));
    old.schemaVersion = 60;
    delete old.storeys[0].objects[0].options;
    return old;
  };
  assert.equal(deserializeProject(JSON.stringify(file())).schemaVersion, PROJECT_SCHEMA_VERSION);
  const desk = file();
  desk.storeys[0].objects[0].catalogId = "desk";
  assert.throws(() => deserializeProject(JSON.stringify(desk)));
  const doors = file();
  doors.storeys[0].objects[0].options = { fronts: 3 };
  assert.throws(() => deserializeProject(JSON.stringify(doors)));
});

test("file 59: old entries load, car, television and their parts are refused", () => {
  const p = addObject(createStandardProject("p", "eg", "og"), {
    id: "o",
    catalogId: "table",
    position: { x: 0, y: 0 },
  });
  const file = () => {
    const old = JSON.parse(serializeProject(p));
    old.schemaVersion = 59;
    return old;
  };
  assert.deepEqual(
    storeyOf(deserializeProject(JSON.stringify(file()))).objects,
    storeyOf(p).objects,
  );
  const car = file();
  car.storeys[0].objects[0].catalogId = "car";
  car.storeys[0].objects[0].options = {};
  assert.throws(() => deserializeProject(JSON.stringify(car)));
  const mount = file();
  mount.storeys[0].objects[0].options = { tvMount: "wall" };
  assert.throws(() => deserializeProject(JSON.stringify(mount)));
  const glass = file();
  glass.storeys[0].objects[0].finishes = { glass: { color: "#000000" } };
  assert.throws(() => deserializeProject(JSON.stringify(glass)));
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
