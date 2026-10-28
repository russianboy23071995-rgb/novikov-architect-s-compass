import test from "node:test";
import assert from "node:assert/strict";
import { createExampleProject } from "../../components/cad/bim-view.ts";
import {
  commitProject,
  createHistory,
  redoProject,
  undoProject,
} from "../../application/history/project-history.ts";
import { schoolPlanFixture } from "../../../benchmarks/school-plan-fixture.ts";
import { updateWall } from "../../application/walls/actions.ts";
import { storeyOf } from "../../domain/storeys/access.ts";
import { validateProject } from "../../domain/project/schema.ts";
import { buildSolid } from "./storey-solid.ts";
import { buildBuildingSolid, workingStoreySolid } from "./building-solid.ts";
import { getWallFootSources } from "./wall-foot-sources.ts";

// Wall foot sources reuse the storey part of the building scene (docs/performance/RECOVERY_STATUS.md).
test("the working storey solid equals the former derivation and shares the building part", () => {
  const owned = createHistory(createExampleProject()).present;
  const solid = workingStoreySolid(owned);
  assert.deepEqual(
    JSON.parse(JSON.stringify(solid)),
    JSON.parse(JSON.stringify(buildSolid(owned))),
  );
  // After the building scene, the working storey part is the very same object.
  buildBuildingSolid(owned);
  assert.equal(workingStoreySolid(owned), workingStoreySolid(owned));
  assert.ok(buildBuildingSolid(owned).faces.includes(workingStoreySolid(owned).faces[0]!));
  // A mutable copy derives the same geometry without sharing.
  const copy = structuredClone(owned);
  assert.notEqual(workingStoreySolid(copy), workingStoreySolid(owned));
  assert.deepEqual(
    JSON.parse(JSON.stringify(workingStoreySolid(copy))),
    JSON.parse(JSON.stringify(solid)),
  );
  // Foot sources keep their content.
  assert.equal(getWallFootSources(owned).sourceCount, getWallFootSources(copy).sourceCount);
});

// Undo and redo reuse the storey part and wall foot sources of earlier versions (user decision
// 27.10.2026, docs/performance/UNDO_STOREY_REUSE.md).
const allFootFeatures = (index: ReturnType<typeof getWallFootSources>) => {
  const b = index.bounds!;
  return index
    .queryPrimitives(
      { x: (b.minX + b.maxX) / 2, y: (b.minY + b.maxY) / 2 },
      1,
      Math.hypot(b.maxX - b.minX, b.maxY - b.minY),
    )
    .references.map((r) => r.feature);
};
test("undo and redo find the storey part and foot sources again, equal to a fresh build", () => {
  let history = createHistory(schoolPlanFixture());
  const before = history.present;
  const part = workingStoreySolid(before);
  const foot = getWallFootSources(before);
  const wall = storeyOf(before).walls[3]!;
  history = commitProject(
    history,
    updateWall(before, wall.id, { end: { x: wall.end.x + 0.4, y: wall.end.y } }),
  );
  const edited = history.present;
  const editedPart = workingStoreySolid(edited);
  const editedFoot = getWallFootSources(edited);
  // Counter-check: the edit is a new storey version with new parts and changed sources.
  assert.notEqual(editedPart, part);
  assert.notEqual(editedFoot, foot);
  assert.notDeepEqual(allFootFeatures(editedFoot), allFootFeatures(foot));
  const undone = undoProject(history);
  assert.equal(workingStoreySolid(undone.present), part);
  assert.equal(getWallFootSources(undone.present), foot);
  const redone = redoProject(undone);
  assert.equal(workingStoreySolid(redone.present), editedPart);
  assert.equal(getWallFootSources(redone.present), editedFoot);
  // Reused results equal a fresh derivation from a mutable copy (no reuse on that path).
  for (const project of [undone.present, redone.present]) {
    const copy = validateProject(project);
    assert.deepEqual(
      JSON.stringify(buildBuildingSolid(project).faces),
      JSON.stringify(buildBuildingSolid(copy).faces),
    );
    assert.deepEqual(
      allFootFeatures(getWallFootSources(project)),
      allFootFeatures(getWallFootSources(copy)),
    );
  }
});

test("only a few versions per storey are kept (bounded)", () => {
  let history = createHistory(schoolPlanFixture());
  const first = workingStoreySolid(history.present);
  for (let i = 0; i < 5; i++) {
    const wall = storeyOf(history.present).walls[3]!;
    history = commitProject(
      history,
      updateWall(history.present, wall.id, { end: { x: wall.end.x + 0.1, y: wall.end.y } }),
    );
    workingStoreySolid(history.present);
  }
  let back = history;
  for (let i = 0; i < 5; i++) back = undoProject(back);
  // Five edits later the oldest version has left the cache and is rebuilt with equal faces.
  const rebuilt = workingStoreySolid(back.present);
  assert.notEqual(rebuilt, first);
  assert.equal(JSON.stringify(rebuilt.faces), JSON.stringify(first.faces));
});

// Ceiling slabs in 3D, Teil B1 (docs/SLAB_ELEMENT.md).
import { addSlab, updateSlab } from "../../application/slabs/actions.ts";
import { SLAB_DEFAULTS } from "../../domain/elements/slab/model.ts";
import { setStoreyHeight } from "../../application/storeys/actions.ts";
import { addWall } from "../../application/walls/actions.ts";
import { createProject } from "../../application/projects/create.ts";
import { movementCorners } from "./movement-origin.ts";
import { pickSolidElement } from "./window-selection.ts";
import { createProjectionFrame as slabFrame } from "../../geometry/projections/orthographic.ts";
import { createProjectionState as slabProjection } from "./projection-state.ts";

const slabProject = () => {
  const p = addWall(createProject("p", "eg"), {
    id: "w",
    start: { x: 0, y: 0 },
    end: { x: 6, y: 0 },
    thickness: 0.24,
    height: 2.8,
  });
  return setStoreyHeight(p, p, { projectId: "p", storeyId: "eg", height: 3 });
};
const slabOutline = [
  { x: 0, y: 0 },
  { x: 6, y: 0 },
  { x: 6, y: 3 },
  { x: 3, y: 3 },
  { x: 3, y: 5 },
  { x: 0, y: 5 },
];

test("a ceiling slab is a closed body under the next raw floor, marked as slab", () => {
  const base = slabProject();
  const p = addSlab(base, { id: "s", points: slabOutline, ...SLAB_DEFAULTS });
  const before = buildBuildingSolid(base);
  const solid = buildBuildingSolid(p);
  const slabFaces = solid.faces.filter((f) => f.slab);
  // Walls unchanged; 4 top + 4 bottom triangles and 6 sides.
  assert.deepEqual(
    solid.faces.filter((f) => !f.slab),
    before.faces,
  );
  assert.equal(slabFaces.length, 14);
  assert.ok(slabFaces.every((f) => f.wallId === "s"));
  const zs = slabFaces.flatMap((f) => f.vertices.map((v) => v[2]));
  assert.equal(Math.max(...zs), 3);
  assert.ok(Math.abs(Math.min(...zs) - 2.8) < 1e-12);
  assert.ok(Math.abs(buildSolid(p).volume - buildSolid(base).volume - 24 * 0.2) < 1e-9);
  // Thickness keeps the top; the storey height moves the slab.
  const thicker = buildBuildingSolid(updateSlab(p, "s", { thickness: 0.3 }));
  const tz = thicker.faces.filter((f) => f.slab).flatMap((f) => f.vertices.map((v) => v[2]));
  assert.equal(Math.max(...tz), 3);
  assert.ok(Math.abs(Math.min(...tz) - 2.7) < 1e-12);
  const higher = setStoreyHeight(p, p, { projectId: "p", storeyId: "eg", height: 3.2 });
  assert.equal(
    Math.max(...buildBuildingSolid(higher).faces.flatMap((f) => f.vertices.map((v) => v[2]))),
    3.2,
  );
  // Unknown storey height: no body.
  const unknown = addSlab(createProject("q", "eg"), {
    id: "s",
    points: slabOutline,
    ...SLAB_DEFAULTS,
  });
  assert.equal(buildBuildingSolid(unknown).faces.length, 0);
});

test("slab faces stay out of wall feet; slab corners are movement origins; picking names the slab", () => {
  const base = slabProject();
  const p = addSlab(base, { id: "s", points: slabOutline, ...SLAB_DEFAULTS });
  assert.deepEqual(getWallFootSources(p).bounds, getWallFootSources(base).bounds);
  // Movement corners: walls unchanged, plus the slab's outline corners at top and underside (B3).
  const corners = movementCorners(p);
  assert.deepEqual(
    corners.filter((c) => c.id !== "s").map((c) => [c.id, ...c.point]),
    movementCorners(base).map((c) => [c.id, ...c.point]),
  );
  assert.equal(corners.filter((c) => c.id === "s").length, 12);
  const solid = buildBuildingSolid(p);
  const projection = slabProjection(
    slabFrame(solid),
    { yaw: 0.3, pitch: 1.2, zoom: 1, panX: 0, panY: 0 },
    { left: 0, top: 0, width: 400, height: 400 },
    { width: 400, height: 400 },
  )!;
  // Seen from above, the centre of the slab's wide part is slab.
  const [x, y] = projection.project([1.5, 2.5, 3]);
  assert.deepEqual(pickSolidElement(solid, [], projection.project, x, y), {
    kind: "slab",
    id: "s",
  });
});
