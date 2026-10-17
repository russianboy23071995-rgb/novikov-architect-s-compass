import test from "node:test";
import assert from "node:assert/strict";
import { createSolidBufferCache, packSolidFaces } from "../src/rendering/viewport/solid-buffer.ts";
import { createSolidRenderer } from "../src/rendering/viewport/solid-renderer.ts";
import { recordingCanvas, resourceFixture, resourceProjection } from "./solid-resource-fixture.ts";
import { boundHeightFixture } from "./bound-height-fixture.ts";
import { buildBuildingSolid } from "../src/lib/bim/geometry.ts";
import { prepareSelectionTranslation } from "../src/application/selection/storey-translation.ts";
import { selectionMoveSurfaces } from "../src/rendering/viewport/selection-move-preview.ts";

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
    assert.equal(stats.partialBytes, 144);
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
    assert.equal(stats.partialBytes, 288);
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
