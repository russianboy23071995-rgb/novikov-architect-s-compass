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
import { roofBody } from "./roof-solid.ts";
import { packSolidFaces, SLAB_DISPLAY_PRIORITY } from "./solid-buffer.ts";
import { createStandardProject } from "../../application/projects/create.ts";
import { selectWorkingStorey } from "../../application/storeys/working-storey.ts";
import { addRoof } from "../../application/roofs/actions.ts";
import { beginSelectionMove, previewSelectionMove } from "../../application/selection/move.ts";
import { moveElement, moveElementPoint } from "../../application/direct-edit/transforms.ts";

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

// Dach D2 (docs/ROOF_ELEMENT.md): closed roof body in the storey part, picking and colours.
const ROOF_SQUARE = {
  id: "dach",
  points: [
    { x: 0, y: 0 },
    { x: 4, y: 0 },
    { x: 4, y: 4 },
    { x: 0, y: 4 },
  ],
  referenceLine: { start: { x: 0, y: 0 }, end: { x: 4, y: 0 } },
  rise: "left" as const,
  referenceHeight: 0,
  pitch: 45,
  thickness: 0.2,
  eaveCut: "vertical" as const,
  topCut: "vertical" as const,
};
/** Every directed edge is matched by exactly one reverse edge: a closed, consistently oriented surface. */
function assertClosed(faces: readonly { vertices: number[][] }[]) {
  const key = (a: number[], b: number[]) => `${a.join(",")}>${b.join(",")}`;
  const edges = new Map<string, number>();
  for (const face of faces)
    for (let i = 0; i < face.vertices.length; i++) {
      const k = key(face.vertices[i]!, face.vertices[(i + 1) % face.vertices.length]!);
      edges.set(k, (edges.get(k) ?? 0) + 1);
    }
  for (const [k, count] of edges) {
    const [a, b] = k.split(">");
    assert.equal(count, 1, `edge ${k} used twice in one direction`);
    assert.equal(edges.get(`${b}>${a}`), 1, `edge ${k} has no partner`);
  }
}

test("a roof is a closed inclined body in its storey; volume and heights match the definition", () => {
  const near = (a: number, b: number, label: string) =>
    assert.ok(Math.abs(a - b) < 1e-9, `${label}: ${a} != ${b}`);
  const base = createStandardProject("p", "eg", "og");
  const og = selectWorkingStorey(base, base, "og");
  const project = addRoof(og, ROOF_SQUARE);
  const roofFaces = buildBuildingSolid(project).faces.filter((f) => f.roof);
  assert.ok(roofFaces.length > 0 && roofFaces.every((f) => f.wallId === "dach" && !f.slab));
  assertClosed(roofFaces);
  const z = roofFaces.flatMap((f) => f.vertices.map((v) => v[2]));
  // OG floor at 3,00 m: underside from 3,00 (eave) to 7,00 (top edge), top 0,283 m higher.
  near(Math.min(...z), 3, "lowest point");
  near(Math.max(...z), 7 + 0.2 * Math.SQRT2, "highest point");
  // Vertical cuts: 4 m wide plan × 4 m × vertical thickness d/cos.
  near(roofBody(storeyOf(project).roofs![0]!, 3).volume, 16 * 0.2 * Math.SQRT2, "volume");
  // Perpendicular cuts at both ends: a d-thick band, (4 - d·sin)/cos long along the slope.
  const cut = {
    ...storeyOf(project).roofs![0]!,
    eaveCut: "perpendicular",
    topCut: "perpendicular",
  } as const;
  const cutBody = roofBody(cut, 3);
  assertClosed(cutBody.faces);
  near(cutBody.volume, 4 * 0.2 * ((4 - 0.2 * Math.SQRT1_2) / Math.SQRT1_2), "perpendicular volume");
  // Horizontal eave: the soffit face is horizontal and faces down.
  const soffit = roofBody({ ...cut, eaveCut: "horizontal" }, 3).faces.find(
    (f) => f.vertices.length === 4 && f.normal[2] < -0.999,
  );
  assert.ok(soffit);
  assert.ok(soffit.vertices.every((v) => Math.abs(v[2] - soffit.vertices[0]![2]) < 1e-9));
  // L-shaped roof stays closed.
  const lRoof = {
    ...ROOF_SQUARE,
    id: "l",
    layerId: "layer:roof",
    points: [
      { x: 0, y: 0 },
      { x: 6, y: 0 },
      { x: 6, y: 3 },
      { x: 3, y: 3 },
      { x: 3, y: 5 },
      { x: 0, y: 5 },
    ],
    eaveCut: "horizontal" as const,
    topCut: "perpendicular" as const,
  };
  assertClosed(roofBody(lRoof, 0).faces);
  // Changing the EG height moves the roof with its storey; the OG's own height does not.
  const egHigher = setStoreyHeight(project, project, {
    projectId: "p",
    storeyId: "eg",
    height: 3.5,
  });
  const lifted = buildBuildingSolid(egHigher).faces.filter((f) => f.roof);
  near(Math.min(...lifted.flatMap((f) => f.vertices.map((v) => v[2]))), 3.5, "after EG change");
  const ogHigher = setStoreyHeight(project, project, { projectId: "p", storeyId: "og", height: 4 });
  assert.deepEqual(
    buildBuildingSolid(ogHigher).faces.filter((f) => f.roof),
    roofFaces,
  );
  // Roof faces are drawn with the slab display priority and a colour of their own.
  const packed = packSolidFaces(roofFaces.slice(0, 1), [0, 0, 0], false);
  assert.equal(packed[6], SLAB_DISPLAY_PRIORITY);
  const { roof: _roof, ...asWall } = roofFaces[0]!;
  const wallPacked = packSolidFaces([asWall], [0, 0, 0], false);
  assert.notDeepEqual([...packed.slice(3, 6)], [...wallPacked.slice(3, 6)]);
  // Picking from above at the roof centre selects the roof itself, not a wall.
  const topDown = (p: readonly number[]) =>
    [p[0]! / 10, p[1]! / 10, -p[2]! / 100] as [number, number, number];
  assert.deepEqual(pickSolidElement(buildBuildingSolid(project), [], topDown, 0.2, 0.2), {
    kind: "roof",
    id: "dach",
  });
  // D3: a roof moves with its reference line, in the group move and as a single element.
  const targets = [{ kind: "roof", id: "dach" }] as const;
  const session = beginSelectionMove(project, [...targets], { x: 0, y: 0 });
  const moved = storeyOf(previewSelectionMove(session, project, [...targets], { x: 1, y: 2 }))
    .roofs![0]!;
  assert.deepEqual(moved.points[0], { x: 1, y: 2 });
  assert.deepEqual(moved.referenceLine, { start: { x: 1, y: 2 }, end: { x: 5, y: 2 } });
  const single = storeyOf(moveElement(project, targets[0], { x: 1, y: 2 })).roofs![0]!;
  assert.deepEqual(single, moved);
  // Outline edits keep the reference line.
  const corner = storeyOf(moveElementPoint(project, targets[0], 2, { x: 5, y: 4 })).roofs![0]!;
  assert.deepEqual(corner.referenceLine, ROOF_SQUARE.referenceLine);
  assert.deepEqual(corner.points[2], { x: 5, y: 4 });
});
