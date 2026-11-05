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

test("in 3D the glass is see-through, frames and doors stay opaque; selected glass is solid", async () => {
  // docs/FENSTER_TUEREN.md, G1.
  const { packSolidFaces, GLASS_OPACITY, SOLID_VERTEX_FLOATS } = await import("./solid-buffer.ts");
  const faces = openingInsertBodies(storeyOf(project()), 0).flatMap((b) => b.faces);
  const opacity = (face: (typeof faces)[number], selected = false) =>
    packSolidFaces([face], [0, 0, 0], selected)[SOLID_VERTEX_FLOATS - 1];
  assert.equal(opacity(faces.find((f) => f.glass)!), Math.fround(GLASS_OPACITY));
  assert.equal(opacity(faces.find((f) => f.opening === "window" && !f.glass)!), 1);
  assert.equal(opacity(faces.find((f) => f.opening === "door")!), 1);
  assert.equal(
    opacity(
      faces.find((f) => f.glass)!,
      true,
    ),
    1,
  );
});

test("sashes: frame rings, mullion, transom and a pane per sash; cut in the section as outlines", async () => {
  // docs/FENSTER_TUEREN.md, FL2. Opening 1,2 × 1,35 m from x 0,9, sill 0,9; frame 7 cm.
  const { windowInsertBoxes } = await import("../../domain/elements/window/insert-geometry.ts");
  const { withDivision } = await import("../../domain/elements/window/insert.ts");
  const { windowPlanSymbol } = await import("./opening-plan-symbol.ts");
  const s = storeyOf(project());
  const wall = s.walls[0]!;
  const window = (division: "double" | "transom") => ({
    ...s.windows[0]!,
    insert: withDivision(WINDOW_INSERT_DEFAULTS, division),
  });
  const parts = (boxes: { part: string }[]) =>
    boxes.reduce<Record<string, number>>((n, b) => ({ ...n, [b.part]: (n[b.part] ?? 0) + 1 }), {});
  const double = windowInsertBoxes(window("double"), wall);
  assert.deepEqual(parts(double), { jamb: 2, rail: 2, mullion: 1, sash: 8, glass: 2, sill: 2 });
  const mullion = double.find((b) => b.part === "mullion")!;
  assert.ok(near(mullion.x, [1.46, 1.54]));
  // Each pane: (1,06 − 0,08) / 2 = 0,49 m sash width, less two 6 cm sash stiles.
  for (const glass of double.filter((b) => b.part === "glass"))
    assert.ok(Math.abs(glass.x[1] - glass.x[0] - 0.37) < 1e-9);
  const transom = windowInsertBoxes(window("transom"), wall);
  assert.deepEqual(parts(transom), { jamb: 2, rail: 2, mullion: 1, sash: 4, glass: 2, sill: 2 });
  // Top light 40 cm clear below the head rail (2,18), transom 8 cm below it.
  assert.ok(near(transom.find((b) => b.part === "mullion")!.z, [1.7, 1.78]));
  assert.ok(transom.some((b) => b.part === "glass" && near(b.z, [1.78, 2.18])));
  assert.ok(transom.some((b) => b.part === "sash" && near(b.z, [0.97, 1.7])));
  // Plan: cut uprights are the frame jambs, the mullion and the sash stiles; both panes shown.
  const plan = windowPlanSymbol(window("double"), wall)!;
  assert.equal(plan.jambs.length, 7);
  assert.equal(plan.glasses.length, 2);
  // Section through the transom window: sill rail, sash rails, transom, head rail and both
  // boards are frame outlines, top light and sash pane glass outlines.
  const p = project();
  const withTransom = {
    ...p,
    storeys: p.storeys.map((st) => ({ ...st, windows: [window("transom")] })),
  };
  const drawing = sectionDrawing(withTransom, {
    id: "s",
    name: "S",
    mark: "A",
    start: { x: 1.5, y: -1 },
    end: { x: 1.5, y: 1 },
    look: "left",
  });
  assert.equal(drawing.cuts.find((c) => c.kind === "frame")!.loops.length, 7);
  assert.equal(drawing.cuts.find((c) => c.kind === "glass")!.loops.length, 2);
});

test("opening symbols: lines meet on the hinge side or at the bottom, dashed seen from outside", async () => {
  // docs/FENSTER_TUEREN.md, FL3. Outside right of the wall direction (y < 0), inside y > 0.
  const { withDivision } = await import("../../domain/elements/window/insert.ts");
  const p = project();
  const doubled = {
    ...p,
    storeys: p.storeys.map((st) => ({
      ...st,
      windows: st.windows.map((w) => ({
        ...w,
        // Left from inside: turn, hinged left; right: turn-tilt, hinged right (outer jambs).
        insert: withDivision(WINDOW_INSERT_DEFAULTS, "double"),
      })),
      doors: [],
    })),
  };
  const view = (start: { x: number; y: number }, end: { x: number; y: number }) =>
    sectionDrawing(doubled, {
      id: "e",
      name: "E",
      mark: "1",
      start,
      end,
      look: "left",
      kind: "elevation",
    }).views.filter((v) => v.marks);
  // From inside (line at y = 2 running to −x, looking at −y): turn 2 lines, turn-tilt 4.
  const inside = view({ x: 6, y: 2 }, { x: 0, y: 2 });
  assert.deepEqual(inside.map((v) => v.marks!.segments.length).sort(), [2, 4]);
  assert.ok(inside.every((v) => !v.marks!.dashed));
  // The turn sash is the left one seen from inside: its lines meet on its left edge.
  const turn = inside.find((v) => v.marks!.segments.length === 2)!;
  const left = Math.min(...turn.points.map((q) => q.x));
  // Segment ends come sorted along the line, so the apex may be either end.
  for (const segment of turn.marks!.segments)
    assert.ok(
      segment.some((p) => Math.abs(p.x - left) < 1e-9 && Math.abs(p.y - (0.97 + 2.18) / 2) < 1e-9),
    );
  // The tilt lines of the turn-tilt sash meet at the bottom middle.
  const tilt = inside.find((v) => v.marks!.segments.length === 4)!;
  const bottom = Math.min(...tilt.points.map((q) => q.y));
  assert.ok(
    tilt
      .marks!.segments.slice(2)
      .every((segment) => segment.some((p) => Math.abs(p.y - bottom) < 1e-9)),
  );
  // From outside the same symbols are dashed: the sashes open away from the viewer.
  const outside = view({ x: 0, y: -2 }, { x: 6, y: -2 });
  assert.deepEqual(outside.map((v) => v.marks!.segments.length).sort(), [2, 4]);
  assert.ok(outside.every((v) => v.marks!.dashed));
  // A fixed light has no symbol.
  assert.equal(
    sectionDrawing(project(), {
      id: "e",
      name: "E",
      mark: "1",
      start: { x: 0, y: -2 },
      end: { x: 6, y: -2 },
      look: "left",
      kind: "elevation",
    }).views.filter((v) => v.marks).length,
    0,
  );
});
