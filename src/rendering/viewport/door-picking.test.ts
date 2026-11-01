import test from "node:test";
import assert from "node:assert/strict";
import { createExampleProject } from "../../components/cad/bim-view.ts";
import { updateWall } from "../../application/walls/actions.ts";
import { initialCamera } from "../../lib/bim/geometry.ts";
import { buildSolid } from "./storey-solid.ts";
import {
  createProjectionFrame,
  projectOrthographic,
} from "../../geometry/projections/orthographic.ts";
import { addDoor } from "../../application/doors/actions.ts";
import { DOOR_DEFAULTS } from "../../domain/elements/door/model.ts";
import { pickSolidElement, windowSelectionSurfaces } from "./window-selection.ts";
import { planSelectionShapes } from "./selection-shapes.ts";

const front = { ...initialCamera, yaw: 0, pitch: 0 };
function scene() {
  const wide = updateWall(createExampleProject(), "wall-1", { end: { x: 6, y: 0 } });
  return addDoor(wide, {
    id: "door-1",
    wallId: "wall-1",
    position: 0.15,
    ...DOOR_DEFAULTS,
    zOffset: 0.1,
  });
}

test("a door gets an opening hit surface at its storey-relative height", () => {
  const surfaces = windowSelectionSurfaces(scene(), () => true);
  const door = surfaces.find((s) => s.id === "door-1")!;
  assert.equal(door.kind, "door");
  const zs = door.vertices.map((v) => v[2]);
  assert.equal(Math.min(...zs), 0.1);
  assert.equal(Math.max(...zs), 0.1 + 2.135);
  assert.equal(surfaces.find((s) => s.id === "window-1")!.kind, "window");
  assert.equal(windowSelectionSurfaces(scene(), (id) => id !== "door-1").length, 1);
});

test("clicking into the door opening in 3D selects the door, not the wall", () => {
  const p = scene();
  const solid = buildSolid(p);
  const project = (point: readonly [number, number, number]) =>
    projectOrthographic(point, createProjectionFrame(solid), front, 1);
  const [x, y] = project([0.9, 0, 1.2]);
  assert.deepEqual(
    pickSolidElement(
      solid,
      windowSelectionSurfaces(p, () => true),
      project,
      x,
      y,
    ),
    {
      kind: "door",
      id: "door-1",
    },
  );
});

test("plan box selection knows doors by their wall footprint", () => {
  const shapes = planSelectionShapes(scene());
  assert.ok(shapes.some((s) => s.target.kind === "door" && s.target.id === "door-1"));
});

test("window and door elements are picked as window and door in 3D, also through the index", async () => {
  // S1 (docs/FENSTER_TUEREN.md): frame, glass and leaf faces belong to their window or door.
  const { setOpeningInsert } = await import("../../application/openings/inserts.ts");
  const { DOOR_INSERT_DEFAULTS, WINDOW_INSERT_DEFAULTS } =
    await import("../../domain/elements/window/insert.ts");
  const { prepareWorldPicking } = await import("./world-picking.ts");
  const { createProjectionState } = await import("./projection-state.ts");
  let p = scene();
  p = setOpeningInsert(p, { kind: "window", id: "window-1", insert: WINDOW_INSERT_DEFAULTS });
  p = setOpeningInsert(p, { kind: "door", id: "door-1", insert: DOOR_INSERT_DEFAULTS });
  const solid = buildSolid(p);
  const projection = createProjectionState(
    createProjectionFrame(solid),
    front,
    { left: 0, top: 0, width: 100, height: 100 },
    { width: 100, height: 100 },
  )!;
  const project = projection.project;
  const windows = windowSelectionSurfaces(p, () => true);
  const index = prepareWorldPicking(solid, windows);
  // Window glass (opening 1,2 m wide at 0,9 m sill, centred at x = 3), door leaf at x = 0,9.
  for (const [point, kind, id] of [
    [[3, 0, 1.6], "window", "window-1"],
    [[2.45, 0, 1.6], "window", "window-1"],
    [[0.9, 0, 1.2], "door", "door-1"],
    [[5, 0, 1.2], "wall", "wall-1"],
  ] as const) {
    const [x, y] = project(point);
    assert.deepEqual(pickSolidElement(solid, windows, project, x, y), { kind, id });
    assert.deepEqual(index.query(solid, windows, projection, x, y).target, { kind, id });
  }
});
