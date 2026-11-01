import test from "node:test";
import assert from "node:assert/strict";
import { createProject } from "../../application/projects/create.ts";
import { addWall } from "../../application/walls/actions.ts";
import { addSlab } from "../../application/slabs/actions.ts";
import { addStorey, setStoreyHeight } from "../../application/storeys/actions.ts";
import { selectWorkingStorey } from "../../application/storeys/working-storey.ts";
import { sectionDrawing } from "./section-drawing.ts";
import type { Section } from "../../domain/views/sections.ts";
import { setWallAssembly } from "../../application/walls/assembly.ts";

// docs/SCHNITT.md, SC3.
const area = (points: readonly { x: number; y: number }[]) =>
  Math.abs(
    points.reduce((sum, p, i) => {
      const q = points[(i + 1) % points.length]!;
      return sum + (p.x * q.y - q.x * p.y) / 2;
    }, 0),
  );
const project = () =>
  addWall(
    addWall(createProject("p", "eg"), {
      id: "w1",
      start: { x: 0, y: 0 },
      end: { x: 4, y: 0 },
      thickness: 0.24,
      height: 2.8,
    }),
    { id: "w2", start: { x: -1, y: -2 }, end: { x: -1, y: 2 }, thickness: 0.24, height: 2.8 },
  );
const section: Section = {
  id: "s",
  name: "Schnitt A-A",
  mark: "A",
  start: { x: 2, y: -2 },
  end: { x: 2, y: 2 },
  look: "left",
};

test("the cut wall becomes a closed outline; the wall beyond is a view with its edges", () => {
  const drawing = sectionDrawing(project(), section);
  assert.equal(drawing.width, 4);
  assert.deepEqual(
    drawing.cuts.map((c) => c.id),
    ["w1"],
  );
  const [cut] = drawing.cuts;
  assert.equal(cut!.loops.length, 1);
  assert.equal(cut!.open.length, 0);
  assert.ok(Math.abs(area(cut!.loops[0]!) - 0.24 * 2.8) < 1e-6);
  // The cut lies where the line crosses the wall: 2 m from the start of the line.
  for (const p of cut!.loops[0]!) assert.ok(Math.abs(p.x - 2) <= 0.12 + 1e-9);
  // Seen beyond: the face of w2 turned to the viewer, 4 m wide (clipped to the line), 2.8 high.
  const facing = drawing.views.filter((v) => area(v.points) > 1);
  assert.equal(facing.length, 1);
  assert.ok(Math.abs(area(facing[0]!.points) - 4 * 2.8) < 1e-6);
  assert.ok(facing[0]!.edges.length >= 2);
  assert.deepEqual(
    drawing.levels.map((l) => [l.name, l.elevation]),
    [["Level 01", 0]],
  );
});

test("looking the other way mirrors the drawing and drops what is now in front", () => {
  const drawing = sectionDrawing(project(), { ...section, look: "right" });
  assert.equal(drawing.views.filter((v) => area(v.points) > 1).length, 0);
  const [cut] = drawing.cuts;
  assert.ok(Math.abs(area(cut!.loops[0]!) - 0.24 * 2.8) < 1e-6);
  // Mirrored: x runs from the end of the line, the cut stays in the middle.
  for (const p of cut!.loops[0]!) assert.ok(Math.abs(p.x - 2) <= 0.12 + 1e-9);
  // A line beside the building meets nothing.
  const empty = sectionDrawing(project(), {
    ...section,
    start: { x: 10, y: -2 },
    end: { x: 10, y: 2 },
  });
  assert.equal(empty.cuts.length, 0);
});

test("parts the line starts in stay closed: slab and the wall of the storey above are filled", () => {
  let p = project();
  const eg = p.storeys[0]!.id;
  p = addSlab(p, {
    id: "d1",
    points: [
      { x: -2, y: -1 },
      { x: 5, y: -1 },
      { x: 5, y: 1 },
      { x: -2, y: 1 },
    ],
    thickness: 0.2,
    topOffset: 0,
  });
  p = setStoreyHeight(p, p, { projectId: p.id, storeyId: eg, height: 3 });
  p = addStorey(p, p, { projectId: p.id, storeyId: eg, side: "above", id: "og", height: 3 });
  p = selectWorkingStorey(p, p, "og");
  p = addWall(p, {
    id: "w3",
    start: { x: 0, y: 0 },
    end: { x: 4, y: 0 },
    thickness: 0.24,
    height: 2.8,
  });
  // The line starts inside the walls and the slab (y = −0,05).
  const drawing = sectionDrawing(p, { ...section, start: { x: 2, y: -0.05 } });
  const cuts = new Map(drawing.cuts.map((c) => [c.id, c]));
  for (const id of ["w1", "d1", "w3"]) {
    assert.equal(cuts.get(id)?.loops.length, 1, id);
    assert.equal(cuts.get(id)?.open.length, 0, id);
  }
  assert.ok(Math.abs(area(cuts.get("w1")!.loops[0]!) - 0.17 * 2.8) < 1e-6);
  assert.ok(Math.abs(area(cuts.get("d1")!.loops[0]!) - 1.05 * 0.2) < 1e-6);
  assert.ok(Math.abs(area(cuts.get("w3")!.loops[0]!) - 0.17 * 2.8) < 1e-6);
});

test("a cut wall with a build-up is parted into its layers, outside first (WANDAUFBAU SA3)", () => {
  const p = setWallAssembly(
    addWall(createProject("p", "eg"), {
      id: "w1",
      start: { x: 0, y: 0 },
      end: { x: 4, y: 0 },
      thickness: 0.36,
      height: 2.8,
    }),
    ["w1"],
    "assembly-ks175-wdvs160",
  );
  const [cut] = sectionDrawing(p, section).cuts;
  const layers = cut!.layers!;
  assert.deepEqual(
    layers.map((l) => l.material.id),
    ["material-putz", "material-daemmung", "material-kalksandstein", "material-putz"],
  );
  // The right face (outside) lies at y = −0,18, 1,82 m along the line.
  const near = (a: number, b: number) => Math.abs(a - b) < 1e-9;
  assert.ok(near(layers[0]!.from, 1.82) && near(layers[1]!.from, 1.83));
  assert.ok(near(layers[2]!.from, 1.99) && near(layers.at(-1)!.to, 2.18));
  // Looking the other way mirrors the order.
  const [back] = sectionDrawing(p, { ...section, look: "right" }).cuts;
  assert.equal(back!.layers![0]!.material.id, "material-putz");
  assert.equal(back!.layers![1]!.material.id, "material-kalksandstein");
  // A line along the wall stays in one layer.
  const along = sectionDrawing(p, {
    ...section,
    start: { x: -1, y: 0.1 },
    end: { x: 5, y: 0.1 },
  }).cuts.find((c) => c.id === "w1")!;
  assert.deepEqual(
    along.layers!.map((l) => l.material.id),
    ["material-kalksandstein"],
  );
  // Without a build-up nothing changes.
  assert.equal(sectionDrawing(project(), section).cuts[0]!.layers, undefined);
});
