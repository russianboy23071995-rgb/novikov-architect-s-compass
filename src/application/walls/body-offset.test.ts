import test from "node:test";
import assert from "node:assert/strict";
import { createExampleProject } from "../../components/cad/bim-view.ts";
import { wallBody } from "../../domain/elements/wall/body.ts";
import { previewWallOffset, commitWallOffset } from "./body-offset.ts";
import {
  updateWall,
  windowCentre,
  serializeProject,
  deserializeProject,
  validateProject,
} from "../../lib/bim/model.ts";
import { createHistory, undoProject, redoProject } from "../../lib/bim/history.ts";
import { buildSolid } from "../../lib/bim/geometry.ts";
import { projectSnapPrimitives } from "../snapping/project-references.ts";
import { editAtPointer, editAnchor } from "../../lib/bim/direct-edit.ts";
import { exportIfc } from "../../lib/bim/ifc.ts";
import { loadProjectData } from "../../interop/project-file/load.ts";
import { createEditingState, editingReducer } from "../direct-edit/controller.ts";
import { createLayerVisibilityPolicy } from "../layers/visibility.ts";
import { createLayerDisplay } from "../../rendering/viewport/layer-display.ts";
import { wallPlanHandles, wallAxisAnchor } from "../../rendering/viewport/wall-axis.ts";
import { createDrawing, defaultDrawingWall } from "../drawing/actions.ts";
const target = { kind: "wall" as const, id: "wall-1" };
const request = (offset: number) => ({ projectId: "project-1", wallId: "wall-1", offset });
const close = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`);

test("new drawing uses a boundary axis; axis grips move exact endpoints through shared edits", () => {
  const original = createExampleProject();
  const base = createDrawing(original, original, "edge-wall", {
    kind: "wall",
    start: { x: 5, y: 1 },
    end: { x: 8, y: 1 },
    ...defaultDrawingWall,
  });
  const wall = base.storey.walls.at(-1)!;
  assert.equal(wall.bodyOffset, wall.thickness / 2);
  assert.deepEqual(wallBody(wall).corner(0, -1), wall.start);
  const handles = wallPlanHandles(wall);
  assert.equal(handles.length, 4);
  assert.equal(handles.filter((h) => h.axis).length, 2);
  assert.deepEqual(wallAxisAnchor(wall, { x: 6, y: 1.01 }), { x: 6, y: 1 });
  const moved = editAtPointer(
    { base, target: { kind: "wall", id: wall.id }, action: "point", index: 1, anchor: wall.end },
    base,
    { x: 9, y: 3 },
  );
  assert.deepEqual(moved.storey.walls.at(-1)!.end, { x: 9, y: 3 });
  assert.deepEqual(moved.storey.walls.at(-1)!.start, wall.start);
  assert.equal(moved.storey.walls.at(-1)!.bodyOffset, 0.18);
  assert.deepEqual(deserializeProject(serializeProject(moved)), moved);
});

test("axis placement cannot leave wall; changing thickness retains edge or relative interior placement", () => {
  const base = createExampleProject();
  for (const offset of [-0.180001, 0.180001, 0.6, -0.6]) {
    assert.throws(() => previewWallOffset(base, base, target, request(offset)), /Wandachse/);
    assert.throws(() => updateWall(base, target.id, { bodyOffset: offset }), /Wandachse/);
  }
  for (const offset of [-0.18, -0.09, 0, 0.09, 0.18]) {
    const positioned = updateWall(base, target.id, { bodyOffset: offset });
    const thinner = updateWall(positioned, target.id, { thickness: 0.12 });
    const wall = thinner.storey.walls[0]!;
    close(wall.bodyOffset, offset / 3);
    assert.deepEqual(wall.start, positioned.storey.walls[0]!.start);
    assert.deepEqual(wall.end, positioned.storey.walls[0]!.end);
  }
  // Previously valid files must not move physical geometry silently on load.
  const legacy = structuredClone(base);
  legacy.storey.walls[0]!.bodyOffset = 0.6;
  assert.deepEqual(deserializeProject(serializeProject(legacy)), legacy);
  assert.throws(() => previewWallOffset(legacy, legacy, target, request(0.6)), /Wandachse/);
});

test("wall offset keeps drawing axis and hosted window parameters, moves body and corner sources in every orientation", () => {
  for (const angle of [0, Math.PI / 2, 0.73, Math.PI])
    for (const offset of [-0.18, 0, 0.09, 0.18]) {
      const base = updateWall(createExampleProject(), "wall-1", {
        end: { x: 3 * Math.cos(angle), y: 3 * Math.sin(angle) },
      });
      const initial = serializeProject(base);
      const next = previewWallOffset(base, base, target, request(offset));
      const wall = next.storey.walls[0]!,
        body = wallBody(wall),
        normal = { x: -Math.sin(angle), y: Math.cos(angle) };
      assert.deepEqual(wall.start, base.storey.walls[0]!.start);
      assert.deepEqual(wall.end, base.storey.walls[0]!.end);
      assert.deepEqual(next.storey.windows, base.storey.windows);
      close(body.start.x, normal.x * offset);
      close(body.start.y, normal.y * offset);
      const centre = windowCentre(next, "window-1");
      close(centre.x, wall.end.x / 2 + normal.x * offset);
      close(centre.y, wall.end.y / 2 + normal.y * offset);
      assert.deepEqual(editAnchor(next, { kind: "window", id: "window-1" }), centre);
      const refs = projectSnapPrimitives(next).references;
      assert.deepEqual(refs.find((r) => r.feature === "axis-start")!.point, wall.start);
      assert.deepEqual(refs.find((r) => r.feature === "corner-0-1")!.point, body.corner(0, 1));
      const originalSolid = buildSolid(base),
        solid = buildSolid(next);
      close(solid.volume, originalSolid.volume);
      solid.faces.forEach((f, i) =>
        f.vertices.forEach((p, j) => {
          close(p[0], originalSolid.faces[i]!.vertices[j]![0] + normal.x * offset);
          close(p[1], originalSolid.faces[i]!.vertices[j]![1] + normal.y * offset);
          close(p[2], originalSolid.faces[i]!.vertices[j]![2]);
        }),
      );
      assert.equal(serializeProject(base), initial, "preview/cancel does not mutate base");
      assert.deepEqual(deserializeProject(serializeProject(next)), next);
    }
});

test("offset action is atomic, rejects stale context and non-finite/overflow values, supports undo and visibility", () => {
  const original = createHistory(createExampleProject()),
    base = original.present;
  const history = commitWallOffset(original, base, target, request(0.18));
  assert.equal(history.past.length, 1);
  assert.deepEqual(undoProject(history).present, base);
  assert.deepEqual(redoProject(undoProject(history)), history);
  assert.equal(commitWallOffset(history, history.present, target, request(0.18)), history);
  for (const value of [NaN, Infinity, -Infinity])
    assert.throws(() => previewWallOffset(base, base, target, request(value)));
  assert.throws(() => previewWallOffset(base, history.present, target, request(0.2)));
  assert.throws(() =>
    previewWallOffset(base, base, { kind: "window", id: "window-1" }, request(0.2)),
  );
  assert.throws(() =>
    previewWallOffset(base, base, target, { ...request(0.2), projectId: "other" }),
  );
  const huge = updateWall(base, "wall-1", { start: { x: 0, y: 1e308 }, end: { x: 3, y: 1e308 } });
  assert.throws(() => previewWallOffset(huge, huge, target, request(1e308)));
  const next = history.present;
  const policy = createLayerVisibilityPolicy(next, {
    scope: { kind: "bim-project" },
    hiddenLayerIds: [next.defaultLayerIds.wall],
  });
  const display = createLayerDisplay(next, policy, policy.context);
  assert.equal(display.plan.walls.length, 0);
  assert.equal(display.surfaces.faces.length, 0);
  const state = createEditingState(base);
  const applied = editingReducer(state, {
    type: "wall-offset",
    base: state.history.present,
    selection: target,
    request: request(-0.18),
  });
  assert.equal(applied.history.present.storey.walls[0]!.bodyOffset, -0.18);
  assert.equal(applied.history.past.length, 1);
});

test("offset corners remain exact direct-edit targets for both endpoints and both sides", () => {
  for (const offset of [-0.18, 0, 0.18])
    for (const index of [0, 1])
      for (const side of [-1, 1]) {
        const initial = createExampleProject();
        const base = previewWallOffset(initial, initial, target, request(offset));
        const anchor = wallBody(base.storey.walls[0]!).corner(index, side);
        const aim = { x: anchor.x + (index === 0 ? -0.3 : 0.3), y: anchor.y + 0.5 };
        const next = editAtPointer({ base, target, action: "point", index, anchor }, base, aim);
        const corner = wallBody(next.storey.walls[0]!).corner(index, side);
        close(corner.x, aim.x);
        close(corner.y, aim.y);
        assert.equal(next.storey.walls[0]!.bodyOffset, offset);
      }
});

test("strict V4 migration adds zero only at file boundary; V5 requires offset", () => {
  const current = createExampleProject();
  const { references, wallTJunctions, wallJoins, ...oldStorey } = current.storey;
  const { assets, ...legacyRoot } = current;
  const old = {
    ...legacyRoot,
    schemaVersion: 4,
    storey: { ...oldStorey, walls: current.storey.walls.map(({ bodyOffset, ...w }) => w) },
  };
  assert.deepEqual(loadProjectData(old), current);
  assert.throws(() => validateProject(old));
  assert.throws(() => loadProjectData({ ...old, schemaVersion: 5 }));
  assert.throws(() =>
    loadProjectData({
      ...old,
      storey: { ...old.storey, walls: [{ ...old.storey.walls[0], bodyOffset: 1 }] },
    }),
  );
});

test("IFC exports physical placement and offset while host-relative opening stays consistent", async () => {
  const base = createExampleProject(),
    next = previewWallOffset(base, base, target, request(0.18));
  const text = await exportIfc(next, new Date("2026-10-05T00:00:00Z"));
  assert.match(text, /IFCCARTESIANPOINT\(\(0\.,0\.18,0\.\)\)/);
  assert.match(text, /'BodyOffset',\$,IFCLENGTHMEASURE\(0\.18\)/);
  assert.match(text, /IFCOPENINGELEMENT/);
  assert.deepEqual(wallBody(next.storey.walls[0]!).corners, [
    { x: 0, y: 0 },
    { x: 3, y: 0 },
    { x: 3, y: 0.36 },
    { x: 0, y: 0.36 },
  ]);
});
