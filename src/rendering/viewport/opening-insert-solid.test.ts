import test from "node:test";
import assert from "node:assert/strict";
import { storeyOf } from "../../domain/storeys/access.ts";
import { createProject } from "../../application/projects/create.ts";
import { addWall } from "../../application/walls/actions.ts";
import { addWindow } from "../../application/windows/actions.ts";
import { addDoor } from "../../application/doors/actions.ts";
import { DOOR_DEFAULTS } from "../../domain/elements/door/model.ts";
import {
  DOOR_INSERT_DEFAULTS,
  WINDOW_INSERT_DEFAULTS,
} from "../../domain/elements/window/insert.ts";
import { GLASS_THICKNESS, openingInsertBodies } from "./opening-insert-solid.ts";
import { buildBuildingSolid } from "./building-solid.ts";
import { sectionDrawing } from "./section-drawing.ts";

// docs/FENSTER_TUEREN.md, FT2. Wall along x, 0,24 m thick, axis on y = 0.
const project = (insert = true) =>
  addDoor(
    addWindow(
      addWall(createProject("p", "eg"), {
        id: "w",
        start: { x: 0, y: 0 },
        end: { x: 6, y: 0 },
        thickness: 0.24,
        height: 2.8,
      }),
      {
        id: "f",
        wallId: "w",
        width: 1.2,
        height: 1.35,
        sillHeight: 0.9,
        position: 0.25,
        ...(insert ? { insert: WINDOW_INSERT_DEFAULTS } : {}),
      },
    ),
    {
      id: "d",
      wallId: "w",
      position: 0.75,
      ...DOOR_DEFAULTS,
      ...(insert ? { insert: DOOR_INSERT_DEFAULTS } : {}),
    },
  );
const extent = (faces: readonly { vertices: number[][] }[], axis: number) => {
  const values = faces.flatMap((f) => f.vertices.map((p) => p[axis]!));
  return [Math.min(...values), Math.max(...values)];
};
const near = (a: number[], b: number[]) => a.every((v, i) => Math.abs(v - b[i]!) < 1e-9);

test("window element: frame in the opening, glass in the middle of the frame, boards beyond the wall", () => {
  const [window, door] = openingInsertBodies(storeyOf(project()), 0);
  const faces = window!.faces;
  assert.ok(faces.every((f) => f.wallId === "f" && f.opening === "window"));
  // Opening 1,2 × 1,35 m centred at x = 1,5, sill at 0,9.
  assert.ok(near(extent(faces, 0), [0.9, 2.1]));
  assert.ok(near(extent(faces, 2), [0.9, 2.25]));
  // Boards: outside (right of the wall direction, y < 0) 4 cm, inside 2 cm beyond the faces.
  assert.ok(near(extent(faces, 1), [-0.12 - 0.04, 0.12 + 0.02]));
  const glass = faces.filter((f) => f.glass);
  assert.equal(glass.length, 6);
  assert.ok(near(extent(glass, 1), [-GLASS_THICKNESS / 2, GLASS_THICKNESS / 2]));
  assert.ok(near(extent(glass, 0), [0.97, 2.03]));
  // Frame 8 cm deep in the middle of the wall: the jambs (above the boards) span y −0,04 … 0,04.
  const jamb = faces.filter(
    (f) => !f.glass && f.vertices.every((p) => p[0]! <= 0.97 + 1e-9 && p[2]! > 1),
  );
  assert.ok(near(extent(jamb, 1), [-0.04, 0.04]));
  // Door: frame flush with the face it opens to (left: y = +0,12), leaf 4 cm, closed.
  assert.ok(door!.faces.every((f) => f.wallId === "d" && f.opening === "door"));
  assert.ok(near(extent(door!.faces, 1), [-0.12, 0.12]));
  assert.ok(near(extent(door!.faces, 2), [0, 2.135]));
});

test("location and outside side move the frame; plain openings give no bodies", () => {
  const outside = { ...WINDOW_INSERT_DEFAULTS, location: "outside" as const, offset: 0.02 };
  const storey = storeyOf(project());
  const moved = openingInsertBodies(
    { ...storey, windows: [{ ...storey.windows[0]!, insert: outside }], doors: [] },
    0,
  )[0]!.faces.filter((f) => !f.glass && f.vertices.every((p) => p[0]! <= 0.97 + 1e-9 && p[2]! > 1));
  assert.ok(near(extent(moved, 1), [-0.1, -0.02]));
  const turned = openingInsertBodies(
    {
      ...storey,
      windows: [{ ...storey.windows[0]!, insert: { ...outside, exterior: "left" } }],
      doors: [],
    },
    0,
  )[0]!.faces.filter((f) => !f.glass && f.vertices.every((p) => p[0]! <= 0.97 + 1e-9 && p[2]! > 1));
  assert.ok(near(extent(turned, 1), [0.02, 0.1]));
  assert.deepEqual(openingInsertBodies(storeyOf(project(false)), 0), []);
});

test("the elements are part of the building in 3D and appear in the section as outlines", () => {
  const plain = buildBuildingSolid(project(false));
  const filled = buildBuildingSolid(project());
  assert.ok(filled.faces.some((f) => f.opening === "window" && f.glass));
  assert.ok(filled.faces.some((f) => f.opening === "door"));
  assert.ok(filled.volume > plain.volume);
  // Section across the window at x = 1,5: frame top and bottom, glass, boards; wall above
  // and below stays a building part.
  const drawing = sectionDrawing(project(), {
    id: "s",
    name: "S",
    mark: "A",
    start: { x: 1.5, y: -1 },
    end: { x: 1.5, y: 1 },
    look: "left",
  });
  const kinds = (id: string) => drawing.cuts.filter((c) => c.id === id).map((c) => c.kind);
  assert.deepEqual(kinds("w"), ["part"]);
  assert.deepEqual(kinds("f").sort(), ["frame", "glass"]);
  const glass = drawing.cuts.find((c) => c.kind === "glass")!;
  assert.equal(glass.loops.length, 1);
  // The frame cut: bottom and top frame and both boards as closed outlines.
  assert.equal(drawing.cuts.find((c) => c.kind === "frame")!.loops.length, 4);
});
