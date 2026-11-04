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
import { slabOpeningSymbol } from "../../domain/elements/slab/opening.ts";
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
const near = (p: { x: number; y: number }, q: { x: number; y: number }) =>
  Math.hypot(p.x - q.x, p.y - q.y) < 1e-12;
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
  assert.equal(opening.points!.length, 4);
  assert.equal(ELEMENT_KINDS.slabOpening.label, "Deckendurchbruch");
  assert.deepEqual(storeyElements(storeyOf(drawn), "slabOpening"), [opening]);
  assert.deepEqual(loadProjectData(JSON.parse(serializeProject(drawn))), drawn);
  // Schema 50 files load without openings and cannot smuggle one in.
  const stored = JSON.parse(serializeProject(b));
  assert.equal(stored.schemaVersion, 56);
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
  assert.equal(hostSlabId(b, { points: HOLE }), "s");
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

test("plan symbol: black corner wedge, delete with the slab, move, corner edit, text, snapping", () => {
  const p = withHole();
  const scene = derivePlanScene(p, () => true);
  assert.deepEqual(
    planSceneRuns(scene, []).map((r) => r.kind),
    ["slab", "slabOpening"],
  );
  // Template of the user: a black wedge in the upper left corner, tapering to both neighbours.
  const symbol = scene.slabOpenings.get("o")!.symbol;
  assert.equal(symbol.kind, "outline");
  // Symmetric wedge (review 03.11.2026): equal legs, inner point on the bisector, 12 % of a leg
  // from both sides.
  const wedge = (points: { x: number; y: number }[]) => {
    const symbol = slabOpeningSymbol({ points });
    assert.ok(symbol.kind === "outline" && symbol.wedge);
    return symbol.wedge;
  };
  const square = wedge(HOLE);
  assert.deepEqual(square.slice(0, 2), [
    { x: 2, y: 2 },
    { x: 3, y: 2 },
  ]);
  assert.ok(near(square[2]!, { x: 2.12, y: 1.88 }));
  assert.deepEqual(square[3], { x: 2, y: 1 });
  // A long rectangle: both legs as long as the short side, mirrored at the bisector.
  const long = wedge(rect(0, 0, 3, 1));
  assert.ok(near(long[1]!, { x: 1, y: 1 }) && near(long[3]!, { x: 0, y: 0 }));
  assert.ok(near(long[2]!, { x: 0.12, y: 0.88 }));
  // A polygon: legs equal along both sides at its leftmost upper corner, same distance to both.
  const notch = wedge([
    { x: 0, y: 0 },
    { x: 2, y: 0 },
    { x: 2, y: 2 },
    { x: 1, y: 2 },
    { x: 0.5, y: 1.2 },
    { x: 0, y: 2 },
  ]);
  const [a, t1, mid, t2] = notch as [
    (typeof HOLE)[0],
    (typeof HOLE)[0],
    (typeof HOLE)[0],
    (typeof HOLE)[0],
  ];
  assert.deepEqual(a, { x: 0, y: 2 });
  const leg = (t: typeof a) => Math.hypot(t.x - a.x, t.y - a.y);
  assert.ok(Math.abs(leg(t1) - leg(t2)) < 1e-12);
  const toLine = (t: typeof a) =>
    Math.abs((t.x - a.x) * (mid.y - a.y) - (t.y - a.y) * (mid.x - a.x)) / leg(t);
  assert.ok(Math.abs(toLine(t1) - toLine(t2)) < 1e-12);
  assert.ok(Math.abs(toLine(t1) - 0.12 * leg(t1)) < 1e-12);
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
  assert.deepEqual(storeyOf(moved).slabOpenings![0]!.points![0], { x: 3, y: 3 });
  const hole = [{ kind: "slabOpening" as const, id: "o" }];
  const session = beginSelectionMove(p, hole, { x: 0, y: 0 });
  assert.deepEqual(
    storeyOf(previewSelectionMove(session, p, hole, { x: 1, y: 0 })).slabOpenings![0]!.points![0],
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
  assert.deepEqual(storeyOf(full).slabOpenings![0]!.points![2], { x: 3.5, y: 2.5 });
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

test("round slab opening (schema 52): half black, hole, quantities, IFC circle, move, diameter", async () => {
  const b = base();
  const drawn = createDrawing(b, b, "k", {
    kind: "slabOpening",
    circle: { center: { x: 4, y: 2 }, diameter: 0.2 },
  });
  const opening = storeyOf(drawn).slabOpenings![0]!;
  assert.equal(opening.slabId, "s");
  assert.equal(opening.points, undefined);
  assert.deepEqual(loadProjectData(JSON.parse(serializeProject(drawn))), drawn);
  // Schema 51 files stay outlines; a circle cannot be smuggled into one.
  const stored = JSON.parse(serializeProject(drawn));
  assert.equal(stored.schemaVersion, 56);
  assert.throws(() => loadProjectData({ ...stored, schemaVersion: 51 }));
  const outlined = JSON.parse(serializeProject(withHole()));
  assert.deepEqual(loadProjectData({ ...outlined, schemaVersion: 51 }), withHole());
  // Exactly one of outline and circle.
  assert.throws(() =>
    addSlabOpening(b, { id: "x", points: HOLE, circle: { center: { x: 4, y: 2 }, diameter: 0.2 } }),
  );
  // The upper left half in black, bounded by the diameter from lower left to upper right.
  const symbol = slabOpeningSymbol(opening);
  assert.ok(symbol.kind === "circle");
  assert.equal(symbol.radius, 0.1);
  const d = 0.1 / Math.SQRT2;
  assert.ok(near(symbol.half[0], { x: 4 + d, y: 2 + d }));
  assert.ok(near(symbol.half[1], { x: 4 - d, y: 2 - d }));
  // Hole in the body, exact area in the quantities, a true circle in IFC.
  const solid = buildBuildingSolid(drawn);
  assert.ok(Math.abs(solid.volume - (24 - Math.PI * 0.01 * 1.0027) * 0.2) < 1e-3);
  assert.equal(solid.faces.filter((f) => f.normal[2] === 0).length, 4 + 96);
  // Its side facets are one smooth surface: no edges between them in a section or elevation.
  assert.equal(solid.faces.filter((f) => (f as { smooth?: true }).smooth).length, 96);
  const elevation = sectionDrawing(drawn, {
    id: "e",
    name: "Ansicht",
    mark: "1",
    look: "left",
    kind: "elevation",
    start: { x: 4, y: 5 },
    end: { x: 4, y: -1 },
  });
  const within = (x: number) => x > 0.75 && x < 5.25;
  const facetEdges = elevation.views
    .filter((v) => v.id === "s")
    .flatMap((v) => v.edges)
    .filter(([p, q]) => p.x === q.x && within(p.x) && Math.abs(p.y - q.y) > 0.1);
  assert.deepEqual(facetEdges, []);
  const area = quantitySchedule(drawn).slabs.sums["area"]!;
  assert.ok(Math.abs(area - (24 - Math.PI * 0.01)) < 1e-9);
  const ifc = await exportIfc(drawn, new Date(0));
  assert.match(ifc, /IFCCIRCLEPROFILEDEF\(\.AREA\.,\$,#\d+,0\.1\)/);
  assert.match(ifc, /IFCOPENINGELEMENT\([^\n]*'Deckendurchbruch k'/);
  // Too close to the slab edge or another opening: refused by the polygon around the circle.
  assert.throws(
    () => addSlabOpening(b, { id: "r", circle: { center: { x: 5.9, y: 2 }, diameter: 0.2 } }),
    /ganz in einer/,
  );
  assert.throws(
    () =>
      addSlabOpening(withHole(), {
        id: "r",
        circle: { center: { x: 3.1, y: 1.5 }, diameter: 0.2 },
      }),
    /überschneiden/,
  );
  // Moves with its centre; diameter through the shared action; no corners to edit.
  const target = [{ kind: "slabOpening" as const, id: "k" }];
  const moved = previewSelectionMove(
    beginSelectionMove(drawn, target, { x: 0, y: 0 }),
    drawn,
    target,
    {
      x: -1,
      y: 1,
    },
  );
  assert.deepEqual(storeyOf(moved).slabOpenings![0]!.circle!.center, { x: 3, y: 3 });
  const wider = updateSlabOpening(drawn, "k", { circle: { ...opening.circle!, diameter: 0.5 } });
  assert.equal(storeyOf(wider).slabOpenings![0]!.circle!.diameter, 0.5);
  assert.throws(() =>
    updateSlabOpening(drawn, "k", { circle: { ...opening.circle!, diameter: 5 } }),
  );
  assert.throws(() =>
    editAtPointer(
      { base: drawn, target: target[0]!, action: "point", index: 0, anchor: { x: 4, y: 2 } },
      drawn,
      { x: 4.5, y: 2 },
    ),
  );
  // Text and voice: „Deckendurchbruch ø 20 cm“ in the middle of the selected slab.
  const command = previewSlabCommand(b, { kind: "slab", id: "s" }, "Deckendurchbruch ø 20 cm")!;
  assert.deepEqual(storeyOf(command.result).slabOpenings![0]!.circle, {
    center: { x: 3, y: 2 },
    diameter: 0.2,
  });
  // Snap points: centre and four quadrants.
  const features = projectSnapPrimitives(drawn)
    .references.filter((r) => r.entityId === "k")
    .map((r) => r.feature);
  assert.deepEqual(features, ["centre", "quadrant-0", "quadrant-1", "quadrant-2", "quadrant-3"]);
});

test("triangulation with holes leaves no T-junction where a bridge runs along a hole edge", () => {
  // Browser finding 03.11.2026: the bridge from the pointed hole to (6, 0) lies on the line of
  // its edge (4,5 | 3)–(5 | 2); dropping (5 | 2) as straight drew a seam across the slab.
  const outer = rect(0, 0, 6, 4);
  const holes = [
    rect(1, 1, 2.5, 2.5),
    [
      { x: 4, y: 1 },
      { x: 5, y: 1 },
      { x: 5, y: 2 },
      { x: 4.5, y: 3 },
      { x: 4, y: 2 },
    ],
  ];
  const all = [...outer, ...holes.flat()];
  const key = (i: number) => `${all[i]!.x},${all[i]!.y}`;
  const edge = (p: number, q: number) => [key(p), key(q)].sort().join("|");
  const count = new Map<string, number>();
  for (const [a, b, c] of triangulatePolygonWithHoles(outer, holes))
    for (const k of [edge(a, b), edge(b, c), edge(c, a)]) count.set(k, (count.get(k) ?? 0) + 1);
  const boundary = new Set(
    [outer, ...holes].flatMap((ring) =>
      ring.map((p, i) => {
        const q = ring[(i + 1) % ring.length]!;
        return [`${p.x},${p.y}`, `${q.x},${q.y}`].sort().join("|");
      }),
    ),
  );
  // Every boundary edge once, every inner edge twice: nothing is left open.
  for (const [k, n] of count) assert.equal(n, boundary.has(k) ? 1 : 2, k);
});

test("a section through the centre of a round opening cuts the slab into two closed parts", () => {
  // Browser finding 03.11.2026: a corner of the circle polygon on the section plane left the cut
  // open (no fill). The corners now sit half a step off the axes.
  const p = addSlabOpening(base(), { id: "k", circle: { center: { x: 3, y: 2 }, diameter: 0.8 } });
  const line = { name: "K-K", mark: "K", look: "left" as const };
  for (const [start, end] of [
    [
      { x: 3, y: -1 },
      { x: 3, y: 5 },
    ],
    [
      { x: -1, y: 2 },
      { x: 7, y: 2 },
    ],
  ] as const) {
    const cut = sectionDrawing(p, { id: "k-k", ...line, start, end }).cuts.find(
      (c) => c.id === "s",
    )!;
    assert.equal(cut.loops.length, 2);
    assert.equal(cut.open.length, 0);
  }
});
