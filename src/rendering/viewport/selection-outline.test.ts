import test from "node:test";
import assert from "node:assert/strict";
import { selectionEdges, outlineTriangles } from "./selection-outline.ts";
import { buildSolid, initialCamera } from "../../lib/bim/geometry.ts";
import { createExampleProject } from "../../components/cad/bim-view.ts";
import { updateWall, addWall } from "../../lib/bim/model.ts";
import { createProjectionFrame } from "../../geometry/projections/orthographic.ts";
import { createProjectionState } from "./projection-state.ts";
import { nearestWallSurface } from "./wall-depth.ts";

const example = createExampleProject();
const near = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-8, `${a} != ${b}`);

test("wall outline retains outer and opening edges, removing every coplanar partition seam", () => {
  for (const angle of [0, 0.7, Math.PI]) {
    const project = updateWall(example, "wall-1", {
      end: { x: 3 * Math.cos(angle), y: 3 * Math.sin(angle) },
    });
    const solid = buildSolid(project),
      edges = selectionEdges(solid.faces);
    const length = edges.reduce(
      (sum, [a, b]) => sum + Math.hypot(...a.map((v, i) => v - b[i]!)),
      0,
    );
    near(length, 4 * (3 + 0.36 + 2.8) + 4 * (1.2 + 1.35) + 4 * 0.36);
    // Every retained segment is at an actual outside or opening corner of the cross-section.
    for (const [a, b] of edges) {
      const mid = a.map((v, i) => (v + b[i]!) / 2);
      const x = mid[0]! * Math.cos(angle) + mid[1]! * Math.sin(angle),
        z = mid[2]!;
      const on = (v: number, candidates: number[]) =>
        candidates.some((c) => Math.abs(v - c) < 1e-8);
      assert.ok(
        on(x, [0, 3]) ||
          on(z, [0, 2.8]) ||
          (on(x, [0.9, 2.1]) && z >= 0.9 - 1e-8 && z <= 2.25 + 1e-8) ||
          (on(z, [0.9, 2.25]) && x >= 0.9 - 1e-8 && x <= 2.1 + 1e-8),
      );
    }
  }
});

test("generic triangle faces omit their shared diagonal; absent selection emits nothing", () => {
  const edges = selectionEdges([
    {
      vertices: [
        [0, 0, 0],
        [1, 0, 0],
        [1, 1, 0],
      ],
      normal: [0, 0, 1],
    },
    {
      vertices: [
        [0, 0, 0],
        [1, 1, 0],
        [0, 1, 0],
      ],
      normal: [0, 0, 1],
    },
  ]);
  assert.equal(edges.length, 4);
  assert.deepEqual(selectionEdges([]), []);
});

test("outline is derived from selected displayed geometry, including preview and replacement", () => {
  const original = buildSolid(example);
  const changed = updateWall(example, "wall-1", { end: { x: 5, y: 0 } });
  const next = buildSolid(
    addWall(changed, {
      id: "other",
      start: { x: 8, y: 0 },
      end: { x: 10, y: 0 },
      height: 2.8,
      thickness: 0.36,
    }),
  );
  const chosen = (id: string) => selectionEdges(next.faces.filter((f) => f.wallId === id));
  assert.equal(
    Math.max(
      ...chosen("wall-1")
        .flat()
        .map((v) => v[0]),
    ),
    5,
  );
  assert.equal(
    Math.min(
      ...chosen("other")
        .flat()
        .map((v) => v[0]),
    ),
    8,
  );
  assert.deepEqual(chosen("deleted"), []);
  assert.equal(
    Math.max(
      ...selectionEdges(original.faces)
        .flat()
        .map((v) => v[0]),
    ),
    3,
  );
  assert.deepEqual(buildSolid(example), original);
});

test("ribbons preserve displayed depth and CSS width across camera, zoom, resize and DPR", () => {
  const solid = buildSolid(example),
    edges = selectionEdges(solid.faces);
  for (const yaw of [0, 0.8])
    for (const zoom of [0.5, 2])
      for (const dpr of [1, 2]) {
        const w = 801,
          h = 503;
        const projection = createProjectionState(
          createProjectionFrame(solid),
          { ...initialCamera, yaw, zoom },
          { left: 30, top: 70, width: w, height: h },
          { width: w * dpr, height: h * dpr },
        )!;
        const data = outlineTriangles([edges[0]!], projection);
        assert.equal(data.length, 36);
        near(Math.hypot(((data[0]! - data[6]!) * w) / 2, ((data[1]! - data[7]!) * h) / 2), 1.5);
        near(data[2]!, projection.project([...edges[0]![0]])[2] - 1e-6);
        near(data[14]!, projection.project([...edges[0]![1]])[2] - 1e-6);
        assert.ok(data.every(Number.isFinite));
        assert.deepEqual(outlineTriangles([], projection), []);
      }
});

test("outline depth stays behind an opaque foreground wall, allowing GPU occlusion", () => {
  const model = addWall(example, {
    id: "front",
    start: { x: -1, y: -1 },
    end: { x: 4, y: -1 },
    height: 4,
    thickness: 0.36,
  });
  const solid = buildSolid(model);
  const projection = createProjectionState(
    createProjectionFrame(solid),
    { ...initialCamera, yaw: 0, pitch: 0, zoom: 0.7 },
    { left: 0, top: 0, width: 800, height: 600 },
    { width: 800, height: 600 },
  )!;
  const edges = selectionEdges(solid.faces.filter((f) => f.wallId === "wall-1"));
  let hidden = 0;
  for (const [a, b] of edges) {
    const mid = projection.project([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]);
    const surface = nearestWallSurface(solid, projection.project, mid[0], mid[1]);
    if (surface?.wallId === "front") {
      assert.ok(mid[2] - 1e-6 > surface.depth);
      hidden++;
    }
  }
  assert.ok(hidden > 0);
});
