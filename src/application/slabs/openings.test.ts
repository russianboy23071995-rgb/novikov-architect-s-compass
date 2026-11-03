import test from "node:test";
import assert from "node:assert/strict";
import { storeyOf } from "../../domain/storeys/access.ts";
import { createProject } from "../projects/create.ts";
import { setStoreyHeight } from "../storeys/actions.ts";
import { addSlab, updateSlab } from "./actions.ts";
import { addSlabOpening, hostSlabId, updateSlabOpening } from "./openings.ts";
import { previewSlabCommand } from "./command.ts";
import { createDrawing } from "../drawing/actions.ts";
import { SLAB_DEFAULTS } from "../../domain/elements/slab/model.ts";
import { slabOpeningCross } from "../../domain/elements/slab/opening.ts";
import { ELEMENT_KINDS, storeyElements } from "../../domain/elements/registry.ts";
import { serializeProject } from "../../lib/bim/model.ts";
import { loadProjectData } from "../../interop/project-file/load.ts";
import { buildBuildingSolid } from "../../rendering/viewport/building-solid.ts";
import { sectionDrawing } from "../../rendering/viewport/section-drawing.ts";
import { derivePlanScene, planSceneRuns } from "../../rendering/viewport/plan-scene.ts";
import { triangulatePolygonWithHoles } from "../../geometry/polygons/triangulate.ts";
import { previewDeleteSelection } from "../elements/delete.ts";
import { beginSelectionMove, previewSelectionMove } from "../selection/move.ts";
import { editAtPointer, type EditSession } from "../direct-edit/session.ts";
import { prepareDirectEditPreview } from "../direct-edit/prepared-preview.ts";
import { quantitySchedule } from "../quantities/schedule.ts";
import { projectSnapPrimitives } from "../snapping/project-references.ts";
import { filterElements, NO_CRITERIA } from "../selection/filter.ts";
import { exportIfc } from "../../lib/bim/ifc.ts";
import type { Project } from "../../domain/project/schema.ts";

// Deckendurchbruch (docs/DECKENDURCHBRUCH.md, L40).
const rect = (x0: number, y0: number, x1: number, y1: number) => [
  { x: x0, y: y0 },
  { x: x1, y: y0 },
  { x: x1, y: y1 },
  { x: x0, y: y1 },
];
const SLAB = rect(0, 0, 6, 4);
const HOLE = rect(2, 1, 3, 2);
function base(): Project {
  const p = createProject("p", "eg");
  const high = setStoreyHeight(p, p, { projectId: "p", storeyId: "eg", height: 3 });
  return addSlab(high, { id: "s", points: SLAB, ...SLAB_DEFAULTS });
}
const withHole = () => addSlabOpening(base(), { id: "o", points: HOLE });

test("slab opening: own element on the Decke layer, found slab, file round trip, schema 51", () => {
  const b = base();
  const drawn = createDrawing(b, b, "o", {
    kind: "slabOpening",
    points: [...HOLE, { ...HOLE[0]! }],
  });
  const opening = storeyOf(drawn).slabOpenings![0]!;
  assert.equal(opening.slabId, "s");
  assert.equal(opening.layerId, "layer:slab");
  assert.equal(opening.points.length, 4);
  assert.equal(ELEMENT_KINDS.slabOpening.label, "Deckendurchbruch");
  assert.deepEqual(storeyElements(storeyOf(drawn), "slabOpening"), [opening]);
  assert.deepEqual(loadProjectData(JSON.parse(serializeProject(drawn))), drawn);
  // Schema 50 files load without openings and cannot smuggle one in.
  const stored = JSON.parse(serializeProject(b));
  assert.equal(stored.schemaVersion, 51);
  assert.deepEqual(loadProjectData({ ...stored, schemaVersion: 50 }), b);
  const smuggled = JSON.parse(serializeProject(drawn));
  assert.throws(() => loadProjectData({ ...smuggled, schemaVersion: 50 }));
  // Filter knows the kind like every element (L45).
  assert.deepEqual(
    filterElements(
      drawn,
      undefined,
      { kind: "storey" },
      { ...NO_CRITERIA, kinds: ["slabOpening"] },
    ),
    [{ kind: "slabOpening", id: "o" }],
  );
});

test("slab opening: only strictly inside one slab, apart from the others; model unchanged", () => {
  const b = base();
  const snapshot = serializeProject(b);
  assert.throws(() => addSlabOpening(b, { id: "o", points: rect(5, 1, 7, 2) }), /ganz in einer/);
  assert.throws(() => addSlabOpening(b, { id: "o", points: rect(0, 1, 1, 2) }), /ganz in einer/);
  assert.throws(
    () => addSlabOpening(b, { id: "o", slabId: "s", points: rect(5, 1, 7, 2) }),
    /nicht ganz in der Decke/,
  );
  assert.equal(hostSlabId(b, HOLE), "s");
  const one = withHole();
  assert.throws(
    () => addSlabOpening(one, { id: "o2", points: rect(2.5, 1.5, 3.5, 2.5) }),
    /überschneiden sich/,
  );
  assert.throws(() => addSlabOpening(one, { id: "o2", points: rect(2.2, 1.2, 2.8, 1.8) }));
  assert.throws(() => addSlabOpening(one, { id: "o", points: rect(4, 1, 5, 2) }), /Duplicate/);
  // A slab outline that would cut the opening is refused; the opening keeps it from shrinking.
  assert.throws(() => updateSlab(one, "s", { points: rect(0, 0, 2.5, 4) }), /nicht ganz/);
  assert.throws(() => updateSlabOpening(one, "o", { points: rect(5, 3, 7, 5) }), /nicht ganz/);
  assert.equal(serializeProject(b), snapshot);
  const two = addSlabOpening(one, { id: "o2", points: rect(4, 1, 5, 3) });
  assert.equal(storeyOf(two).slabOpenings!.length, 2);
});

test("slab opening: hole in the 3D body, the section and the quantities; IFC void", async () => {
  const plain = buildBuildingSolid(base());
  assert.equal(plain.faces.length, 8);
  const p = withHole();
  const solid = buildBuildingSolid(p);
  // Top and bottom triangulated around the hole, four outer and four inner side faces.
  const sides = solid.faces.filter((f) => f.normal[2] === 0);
  assert.equal(sides.length, 8);
  const area = (f: (typeof solid.faces)[number]) => {
    const [a, b, c] = f.vertices as [
      [number, number, number],
      [number, number, number],
      [number, number, number],
    ];
    return Math.abs((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])) / 2;
  };
  const top = solid.faces.filter((f) => f.normal[2] === 1);
  assert.ok(Math.abs(top.reduce((sum, f) => sum + area(f), 0) - 23) < 1e-9);
  assert.ok(Math.abs(solid.volume - 23 * 0.2) < 1e-9);
  // Inner side faces look into the opening.
  const inner = sides.filter((f) => f.vertices.every(([x]) => x === 2));
  assert.deepEqual(
    inner[0]!.normal.map((n) => n + 0),
    [1, 0, 0],
  );
  assert.ok(solid.faces.every((f) => f.wallId === "s"));
  // A section through the opening cuts the slab in two parts.
  const line = { name: "A-A", mark: "A", look: "left" as const };
  const cut = sectionDrawing(p, {
    id: "a",
    ...line,
    start: { x: 2.5, y: -1 },
    end: { x: 2.5, y: 5 },
  });
  assert.equal(cut.cuts.find((c) => c.id === "s")!.loops.length, 2);
  const beside = sectionDrawing(p, {
    id: "b",
    ...line,
    start: { x: 1, y: -1 },
    end: { x: 1, y: 5 },
  });
  assert.equal(beside.cuts.find((c) => c.id === "s")!.loops.length, 1);
  const slabs = quantitySchedule(p).slabs;
  assert.ok(Math.abs(slabs.sums["area"]! - 23) < 1e-9);
  const ifc = await exportIfc(p, new Date(0));
  assert.match(ifc, /IFCOPENINGELEMENT\([^)]*'Deckendurchbruch o'/);
  const slabRef = /#(\d+)=IFCSLAB\(/.exec(ifc)![1];
  const openingRef = /#(\d+)=IFCOPENINGELEMENT\([^\n]*Deckendurchbruch o/.exec(ifc)![1];
  assert.match(ifc, new RegExp(`IFCRELVOIDSELEMENT\\([^\\n]*#${slabRef},#${openingRef}\\)`));
});

test("triangulation with holes covers outline minus holes, also an L slab with two openings", () => {
  const l = [
    { x: 0, y: 0 },
    { x: 6, y: 0 },
    { x: 6, y: 3 },
    { x: 3, y: 3 },
    { x: 3, y: 5 },
    { x: 0, y: 5 },
  ];
  const holes = [rect(1, 1, 2, 2), [...rect(4, 1, 5, 2)].reverse(), rect(1, 3.5, 2, 4.5)];
  const all = [...l, ...holes.flat()];
  const triangles = triangulatePolygonWithHoles(l, holes);
  const sum = triangles.reduce((s, [a, b, c]) => {
    const [p, q, r] = [all[a]!, all[b]!, all[c]!];
    const twice = (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
    assert.ok(twice > 0, "counterclockwise");
    return s + twice / 2;
  }, 0);
  assert.ok(Math.abs(sum - (24 - 3)) < 1e-9);
});

test("plan symbol after DIN 1356-1, delete with the slab, move, corner edit, text, snapping", () => {
  const p = withHole();
  const scene = derivePlanScene(p, () => true);
  assert.deepEqual(
    planSceneRuns(scene, []).map((r) => r.kind),
    ["slab", "slabOpening"],
  );
  assert.deepEqual(scene.slabOpenings.get("o")!.cross, [
    [HOLE[0], HOLE[2]],
    [HOLE[1], HOLE[3]],
  ]);
  // Other outlines: the diagonals of the outline box, kept to the outline.
  const triangle = slabOpeningCross([
    { x: 0, y: 0 },
    { x: 2, y: 0 },
    { x: 0, y: 2 },
  ]);
  // The second diagonal of its box is the long edge itself and adds nothing.
  assert.deepEqual(triangle, [
    [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
    ],
  ]);
  // Deleting the slab deletes its openings, one step.
  const deleted = previewDeleteSelection(p, [{ kind: "slab", id: "s" }], undefined);
  assert.deepEqual(storeyOf(deleted.result).slabOpenings, []);
  assert.match(deleted.summary, /1 Deckendurchbruch der Decke wird mitgelöscht/);
  const alone = previewDeleteSelection(p, [{ kind: "slabOpening", id: "o" }], undefined);
  assert.equal(storeyOf(alone.result).slabs!.length, 1);
  // The slab takes its openings along; an opening moves alone only within its slab.
  const slab = [{ kind: "slab" as const, id: "s" }];
  const moved = previewSelectionMove(beginSelectionMove(p, slab, { x: 0, y: 0 }), p, slab, {
    x: 1,
    y: 2,
  });
  assert.deepEqual(storeyOf(moved).slabOpenings![0]!.points[0], { x: 3, y: 3 });
  const hole = [{ kind: "slabOpening" as const, id: "o" }];
  const session = beginSelectionMove(p, hole, { x: 0, y: 0 });
  assert.deepEqual(
    storeyOf(previewSelectionMove(session, p, hole, { x: 1, y: 0 })).slabOpenings![0]!.points[0],
    { x: 3, y: 1 },
  );
  assert.throws(() => previewSelectionMove(session, p, hole, { x: 4, y: 0 }), /nicht ganz/);
  // A corner edit through the shared contour path: preview equals commit, kept in the slab.
  const edit: EditSession = {
    base: p,
    target: { kind: "slabOpening", id: "o" },
    action: "point",
    index: 2,
    anchor: { x: 3, y: 2 },
  };
  const full = editAtPointer(edit, p, { x: 3.5, y: 2.5 });
  assert.deepEqual(storeyOf(full).slabOpenings![0]!.points[2], { x: 3.5, y: 2.5 });
  const prepared = prepareDirectEditPreview(edit)!;
  const target = { kind: "slabOpening", id: "o" } as const;
  assert.deepEqual(
    storeyOf(prepared.materialize!(p, target, { x: 3.5, y: 2.5 })).slabOpenings,
    storeyOf(full).slabOpenings,
  );
  const patch = prepared.evaluate(p, target, { x: 3.5, y: 2.5 });
  assert.ok(patch.replacedIds.includes("s"));
  assert.throws(() => prepared.evaluate(p, target, { x: 7, y: 2.5 }), /nicht ganz/);
  // Text and voice with a selected slab.
  const command = previewSlabCommand(
    base(),
    { kind: "slab", id: "s" },
    "Deckendurchbruch 1,2 m x 80 cm",
  )!;
  assert.deepEqual(storeyOf(command.result).slabOpenings![0]!.points, rect(2.4, 1.6, 3.6, 2.4));
  assert.match(command.summary, /1,2 × 0,8 m/);
  assert.throws(() => previewSlabCommand(base(), null, "Durchbruch 1 x 1"), /Decke auswählen/);
  // Corners and edge midpoints snap like a slab outline.
  const features = projectSnapPrimitives(p)
    .references.filter((r) => r.entityId === "o")
    .map((r) => r.feature);
  assert.equal(features.filter((f) => f.startsWith("vertex-")).length, 4);
});
