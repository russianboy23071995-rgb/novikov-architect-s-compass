import test from "node:test";
import assert from "node:assert/strict";
import {
  createSolidBufferCache,
  packSolidFaces,
  SLAB_DISPLAY_PRIORITY,
  SOLID_VERTEX_FLOATS,
} from "../src/rendering/viewport/solid-buffer.ts";
import { slabOverlapAcceptanceProject } from "./slab-ifc-acceptance.ts";
// One quad: two triangles, six vertices of SOLID_VERTEX_FLOATS Float32 values.
const ONE_QUAD_BYTES = 6 * SOLID_VERTEX_FLOATS * 4;
import { createSolidRenderer } from "../src/rendering/viewport/solid-renderer.ts";
import { recordingCanvas, resourceFixture, resourceProjection } from "./solid-resource-fixture.ts";
import { boundHeightFixture } from "./bound-height-fixture.ts";
import { buildBuildingSolid } from "../src/rendering/viewport/building-solid.ts";
import { prepareSelectionTranslation } from "../src/application/selection/storey-translation.ts";
import { selectionMoveSurfaces } from "../src/rendering/viewport/selection-move-preview.ts";
import {
  composeSurfacePatch,
  surfaceFaces,
  surfaceFaceCount,
} from "../src/rendering/viewport/surface-patch.ts";
import { selectionEdges } from "../src/rendering/viewport/selection-outline.ts";
import { visibleSurfaces } from "../src/rendering/viewport/layer-display.ts";

// Frozen pre-optimization oracle: retain the previous double arithmetic and
// final conversion; do not use the new packer to generate its own expectation.
// 29.10.2026 (C3 Variante A): every vertex additionally carries its display priority
// (slab faces 1, all others 0) as a seventh float.
function previousPack(
  faces: Parameters<typeof packSolidFaces>[0],
  origin: Parameters<typeof packSolidFaces>[1],
  selected: boolean,
) {
  const data: number[] = [];
  for (const face of faces) {
    const light =
      0.5 + 0.5 * Math.max(0, face.normal[0] * 0.3 - face.normal[1] * 0.4 + face.normal[2] * 0.866);
    const tint = selected ? [0.38, 0.65, 0.78] : [0.72, 0.75, 0.79];
    for (let i = 1; i + 1 < face.vertices.length; i++)
      for (const index of [0, i, i + 1])
        data.push(
          ...face.vertices[index]!.map((v, k) => v - origin[k]!),
          ...tint.map((v) => v * light),
          "slab" in face && face.slab ? 1 : 0,
          // Opacity (G1): these fixtures have no glass, so every vertex is opaque.
          1,
        );
  }
  return new Float32Array(data);
}

test("direct packing is byte-identical to previous packing for polygon fans and rebasing", () => {
  const faces = Array.from({ length: 33 }, (_, n) => ({
    wallId: `polygon-${n}`,
    normal: [Math.sin(n), Math.cos(n), n % 2 ? -0 : 1] as [number, number, number],
    vertices: Array.from(
      { length: n },
      (_, i) =>
        [
          1e9 + Math.cos((i * Math.PI * 2) / n) / 7,
          -1e8 + Math.sin((i * Math.PI * 2) / n) * 12,
          n / 11,
        ] as [number, number, number],
    ),
  }));
  const building = buildBuildingSolid(boundHeightFixture());
  const original = structuredClone(faces);
  for (const input of [[], faces, building.faces])
    for (const origin of [
      [0, 0, 0],
      [1e9, -1e8, 0.1],
      [-0, 0, -0],
    ] as [number, number, number][])
      for (const selected of [false, true]) {
        const actual = packSolidFaces(input, origin, selected);
        const expected = previousPack(input, origin, selected);
        assert.deepEqual(new Uint8Array(actual.buffer), new Uint8Array(expected.buffer));
      }
  assert.deepEqual(faces, original);
});

test("empty-state counts match flat faces without materializing replacement previews", () => {
  const base = resourceFixture(2);
  const empty = { ...base, faces: [] };
  for (const solid of [
    base,
    empty,
    composeSurfacePatch(base, new Set(["w0", "w1"]), [], base.min, base.max),
    composeSurfacePatch(empty, new Set(["w0"]), [base.faces[0]!], base.min, base.max),
    composeSurfacePatch(base, new Set(["w0"]), [], base.min, base.max),
  ]) {
    const expected = solid.faces.length;
    if (solid !== base && solid !== empty)
      Object.defineProperty(solid, "faces", {
        get() {
          throw new Error("flattened");
        },
      });
    assert.equal(surfaceFaceCount(solid), expected);
  }
});

test("indexed pivot vertices preserve full-scan bounds including missing and hidden targets", () => {
  const project = boundHeightFixture();
  const base = buildBuildingSolid(project);
  const action = prepareSelectionTranslation(project, ["eg-a", "eg-b"]);
  const moved = selectionMoveSurfaces(base, project, action.evaluate({ x: -20, y: 30 }));
  const bounds = (faces: readonly (typeof base.faces)[number][]) =>
    [0, 1, 2].map((axis) => {
      const values = faces.flatMap((face) => face.vertices.map((v) => v[axis]!));
      return [Math.min(...values), Math.max(...values)];
    });
  for (const solid of [base, moved, visibleSurfaces(moved, (id) => id !== "eg-a"), base]) {
    for (const ids of [[], ["missing"], ["eg-a"], ["eg-b", "eg-a", "og-a"]]) {
      assert.deepEqual(
        bounds(ids.flatMap((id) => [...surfaceFaces(solid, id)])),
        bounds(solid.faces.filter((face) => ids.includes(face.wallId))),
      );
    }
  }
});

test("indexed outlines match full scans for movement, removal, visibility and cancel", () => {
  const project = boundHeightFixture();
  const base = buildBuildingSolid(project);
  const action = prepareSelectionTranslation(project, ["eg-a", "eg-b"]);
  const moved = selectionMoveSurfaces(base, project, action.evaluate({ x: 20, y: -30 }));
  const removed = composeSurfacePatch(base, new Set(["eg-a"]), [], base.min, base.max);
  const hidden = visibleSurfaces(moved, (id) => id !== "eg-b");
  for (const solid of [base, moved, removed, hidden, base]) {
    for (const id of ["eg-a", "eg-b", "og-a", "missing"]) {
      assert.deepEqual(
        selectionEdges(surfaceFaces(solid, id)),
        selectionEdges(solid.faces.filter((f) => f.wallId === id)),
      );
    }
  }
  assert.equal(surfaceFaces(removed, "eg-a").length, 0);
});

test("warm outline queries read no stationary IDs and never materialize patch faces", () => {
  for (const count of [10, 1000, 5000]) {
    const fixture = resourceFixture(count);
    let reads = 0;
    const base = {
      ...fixture,
      faces: fixture.faces.map((face) => ({
        ...face,
        get wallId() {
          reads++;
          return face.wallId;
        },
      })),
    };
    surfaceFaces(base, "w1"); // one cold shared index build
    const patch = composeSurfacePatch(
      base,
      new Set(["w0"]),
      [fixture.faces[0]!],
      base.min,
      base.max,
    );
    Object.defineProperty(patch, "faces", {
      get() {
        throw new Error("global patch materialization");
      },
    });
    reads = 0;
    assert.equal(surfaceFaceCount(patch), count);
    for (const id of ["w0", "w1", "missing"]) {
      assert.deepEqual(
        selectionEdges(surfaceFaces(patch, id)),
        selectionEdges(fixture.faces.filter((f) => f.wallId === id)),
      );
    }
    assert.equal(reads, 0);
  }
});

test("patch buffers match full packing across closure changes, cancel, visibility and topology", () => {
  const base = resourceFixture(20);
  const cache = createSolidBufferCache();
  const moved = (id: string) =>
    base.faces
      .filter((f) => f.wallId === id)
      .map((f) => ({
        ...f,
        vertices: f.vertices.map(([x, y, z]) => [x + 2, y, z] as [number, number, number]),
      }));
  const patch = (id: string) =>
    composeSurfacePatch(base, new Set([id]), moved(id), base.min, base.max);
  const smaller = visibleSurfaces(base, (id) => id !== "w0");
  const topology = composeSurfacePatch(
    base,
    new Set(["w0"]),
    moved("w0").map((f) => ({ ...f, vertices: f.vertices.slice(0, 3) })),
    base.min,
    base.max,
  );
  let gpu: Float32Array = new Float32Array();
  let order: string[] = [];
  for (const solid of [
    base,
    patch("w0"),
    patch("w1"),
    base,
    topology,
    patch("w0"),
    smaller,
    base,
  ]) {
    const selected = new Set([solid === base ? "w2" : "w1"]);
    const update = cache.update(solid, [0, 0, 0], selected);
    if (update.full) gpu = update.full;
    for (const p of update.patches) gpu.set(p.data, p.offset / 4);
    const ids = new Set(solid.faces.map((f) => f.wallId));
    order = [...order.filter((id) => ids.has(id)), ...[...ids].filter((id) => !order.includes(id))];
    const expected = new Float32Array(
      order.flatMap((id) =>
        Array.from(
          packSolidFaces(
            solid.faces.filter((f) => f.wallId === id),
            [0, 0, 0],
            selected.has(id),
          ),
        ),
      ),
    );
    assert.deepEqual(gpu, expected);
  }
});

test("warm patch composition and packing do not traverse stationary faces", () => {
  for (const count of [10, 1000, 5000]) {
    const fixture = resourceFixture(count);
    let reads = 0;
    const base = {
      ...fixture,
      faces: fixture.faces.map((face) => ({
        ...face,
        get wallId() {
          reads++;
          return face.wallId;
        },
      })),
    };
    const cache = createSolidBufferCache();
    cache.update(base, [0, 0, 0], new Set());
    const make = (x: number) =>
      composeSurfacePatch(
        base,
        new Set(["w0"]),
        [
          {
            ...fixture.faces[0]!,
            vertices: fixture.faces[0]!.vertices.map((p) => [p[0] + x, p[1], p[2]]),
          },
        ],
        base.min,
        base.max,
      );
    cache.update(make(1), [0, 0, 0], new Set());
    reads = 0;
    const update = cache.update(make(2), [0, 0, 0], new Set());
    assert.equal(reads, 0);
    assert.equal(update.full, null);
    assert.equal(
      update.patches.reduce((n, p) => n + p.data.byteLength, 0),
      ONE_QUAD_BYTES,
    );
  }
});

test("filtering before the shared patch preserves visible geometry and conservative bounds", () => {
  const project = boundHeightFixture();
  const base = buildBuildingSolid(project);
  const action = prepareSelectionTranslation(project, ["eg-a", "eg-b"]);
  const patch = action.evaluate({ x: 20, y: -30 });
  const allows = (id: string) => id !== "eg-a" && id !== "og-a";
  assert.deepEqual(
    selectionMoveSurfaces(visibleSurfaces(base, allows), project, patch, allows),
    visibleSurfaces(selectionMoveSurfaces(base, project, patch), allows),
  );
});

test("preview bounds preserve the full-scan result without reading unchanged vertices", () => {
  const project = boundHeightFixture();
  const base = buildBuildingSolid(project);
  const action = prepareSelectionTranslation(project, ["eg-a", "eg-b"]);
  for (const delta of [
    { x: 0, y: 0 },
    { x: 20, y: -30 },
    { x: -40, y: 50 },
  ]) {
    const patch = action.evaluate(delta);
    let stationaryReads = 0;
    const watched = {
      ...base,
      faces: base.faces.map((face) =>
        face.wallId.startsWith("og-")
          ? {
              ...face,
              get vertices() {
                stationaryReads++;
                return face.vertices;
              },
            }
          : face,
      ),
    };
    const result = selectionMoveSurfaces(watched, project, patch);
    assert.equal(stationaryReads, 0);
    const min = [...base.min],
      max = [...base.max];
    for (const face of result.faces)
      for (const point of face.vertices)
        for (const i of [0, 1, 2]) {
          min[i] = Math.min(min[i]!, point[i]!);
          max[i] = Math.max(max[i]!, point[i]!);
        }
    assert.deepEqual(result.min, min);
    assert.deepEqual(result.max, max);
    for (const face of watched.faces.filter((f) => f.wallId.startsWith("og-")))
      assert.ok(result.faces.includes(face));
    const byWall = (a: (typeof base.faces)[number], b: (typeof base.faces)[number]) =>
      a.wallId.localeCompare(b.wallId);
    assert.deepEqual(
      [...result.faces].sort(byWall),
      [...buildBuildingSolid(action.materialize(project, delta)).faces].sort(byWall),
    );
  }
});

test("selection and small movement retain program/buffers with bounded uploads as rest grows", () => {
  for (const count of [10, 1000, 5000]) {
    const { canvas, stats } = recordingCanvas(),
      renderer = createSolidRenderer(canvas),
      solid = resourceFixture(count),
      projection = resourceProjection();
    renderer.draw(solid, projection, new Set(), [], []);
    const full = stats.fullBytes;
    renderer.draw(solid, projection, new Set(["w0"]), [], []);
    assert.equal(stats.partialBytes, ONE_QUAD_BYTES);
    renderer.draw(
      {
        ...solid,
        faces: [
          ...solid.faces.slice(1),
          {
            ...solid.faces[0]!,
            vertices: solid.faces[0]!.vertices.map(([x, y, z]) => [x + 0.1, y, z]),
          },
        ],
      },
      projection,
      new Set(["w0"]),
      [],
      [],
    );
    assert.equal(stats.partialBytes, 2 * ONE_QUAD_BYTES);
    assert.equal(stats.fullBytes, full);
    assert.equal(stats.programs, 1);
    assert.equal(stats.buffers, 2);
    renderer.draw(solid, projection, new Set(), [], []); // cancel
    assert.equal(stats.fullBytes, full);
    renderer.dispose();
    renderer.dispose();
    assert.equal(stats.deletedPrograms, 1);
    assert.equal(stats.deletedBuffers, 2);
    assert.throws(() => renderer.draw(solid, projection, new Set(), [], []));
    const restored = createSolidRenderer(canvas);
    restored.draw(solid, projection, new Set(), [], []);
    assert.equal(stats.programs, 2);
    restored.dispose();
  }
});

test("range patches reproduce fresh packing exactly including reorder, selection and changed normals", () => {
  const cache = createSolidBufferCache(),
    base = resourceFixture(4),
    origin = [1e9, 1e9, 0] as const;
  let gpu: Float32Array = new Float32Array();
  for (const [solid, selected] of [
    [base, new Set<string>()],
    [{ ...base, faces: [...base.faces].reverse() }, new Set(["w1"])],
    [
      {
        ...base,
        faces: base.faces.map((f) =>
          f.wallId === "w1"
            ? { ...f, normal: [0, 0, 1], vertices: f.vertices.map(([x, y, z]) => [x + 0.2, y, z]) }
            : f,
        ),
      },
      new Set(["w1"]),
    ],
    [base, new Set<string>()],
  ] as const) {
    const changed = cache.update(solid as typeof base, [...origin], selected);
    if (changed.full) gpu = changed.full;
    for (const p of changed.patches) gpu.set(p.data, p.offset / 4);
    const expected = new Float32Array(
      base.faces.flatMap((original) =>
        Array.from(
          packSolidFaces(
            (solid as typeof base).faces.filter((f) => f.wallId === original.wallId),
            [...origin],
            selected.has(original.wallId),
          ),
        ),
      ),
    );
    assert.deepEqual(gpu, expected);
  }
});

test("topology, visibility and local-origin changes rebuild layout without stale ranges", () => {
  const cache = createSolidBufferCache(),
    solid = resourceFixture(2),
    selected = new Set<string>();
  assert.ok(cache.update(solid, [0, 0, 0], selected).full);
  assert.equal(cache.update(structuredClone(solid), [0, 0, 0], selected).patches.length, 0);
  assert.ok(cache.update({ ...solid, faces: solid.faces.slice(1) }, [0, 0, 0], selected).full);
  const empty = cache.update({ ...solid, faces: [] }, [0, 0, 0], selected);
  assert.equal(empty.full?.length, 0);
  assert.equal(empty.vertexCount, 0);
  assert.ok(cache.update(solid, [1e9, 0, 0], selected).full);
  const triangle = {
    ...solid,
    faces: solid.faces.map((f) => ({ ...f, vertices: f.vertices.slice(0, 3) })),
  };
  assert.ok(cache.update(triangle, [1e9, 0, 0], selected).full);
});

test("C3 Variante A: bound walls reach the slab top; slab faces win coincident surfaces", () => {
  const project = slabOverlapAcceptanceProject();
  const solid = buildBuildingSolid(project);
  const slabFaces = solid.faces.filter((f) => "slab" in f && f.slab);
  const wallFaces = solid.faces.filter((f) => !("slab" in f && f.slab));
  const top = (faces: typeof solid.faces) =>
    Math.max(...faces.flatMap((f) => f.vertices.map((v) => v[2])));
  // Walls and slabs share their top surface (EG 3,00 m, OG 5,80 m): coincident planes.
  const egWalls = wallFaces.filter((f) => f.wallId.startsWith("eg-"));
  const egSlab = slabFaces.filter((f) => f.wallId === "eg-decke");
  assert.equal(top(egWalls), 3);
  assert.equal(top(egSlab), 3);
  assert.equal(top(slabFaces), 5.8);
  // Packed priority: 1 on every slab vertex, 0 on every wall vertex.
  const priorities = (faces: typeof solid.faces) => {
    const data = packSolidFaces(faces, [0, 0, 0], false);
    return new Set(
      Array.from(
        { length: data.length / SOLID_VERTEX_FLOATS },
        (_, i) => data[i * SOLID_VERTEX_FLOATS + 6],
      ),
    );
  };
  assert.deepEqual(priorities(slabFaces), new Set([SLAB_DISPLAY_PRIORITY]));
  assert.deepEqual(priorities(wallFaces), new Set([0]));
  // Selection keeps the priority; only the colour changes.
  const selected = packSolidFaces(egSlab, [0, 0, 0], true);
  assert.equal(selected[6], SLAB_DISPLAY_PRIORITY);
});
