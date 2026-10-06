import test from "node:test";
import assert from "node:assert/strict";
import { cornerPreviewReducer, currentCornerPreview } from "./corner-preview.ts";
import { createProject, addWall, addWindow } from "../../lib/bim/model.ts";
import { buildSolid } from "../../lib/bim/geometry.ts";
import { cornerPreviewSurfaces } from "../../rendering/viewport/corner-preview.ts";
import { faceTriangles } from "../../geometry/solids/face-triangles.ts";
import { nearestWallSurface } from "../../rendering/viewport/wall-depth.ts";
import { inspectTOpenings } from "../../domain/elements/wall/t-openings.ts";
import { deriveTPreview } from "./t-preview.ts";
import { deriveTPairSolids, inspectTPair } from "../../domain/elements/wall/t-pair.ts";
import { resolveIsolatedTPair } from "../../domain/elements/wall/t-openings.ts";

test("resolved T kernel needs no Project and matches the validated entry without mutating inputs", () => {
  const project = addWindow(tFixture(), {
    id: "w",
    wallId: "incoming",
    width: 1,
    height: 1,
    sillHeight: 0.9,
    position: 2.32 / 3,
  });
  const target = { wallId: "incoming", endpoint: 1 as const };
  const expected = deriveTPreview(project, "host", target);
  const pair = resolveIsolatedTPair(project, "host", target);
  for (const wall of [pair.host, pair.incoming.wall]) {
    Object.freeze(wall.start);
    Object.freeze(wall.end);
    Object.freeze(wall);
  }
  pair.windows.forEach(Object.freeze);
  Object.freeze(pair.windows);
  project.storey.walls[0]!.height = 7;
  project.storey.windows[0]!.width = 0.5;
  assert.deepEqual(deriveTPairSolids(pair.host, pair.incoming, pair.windows), expected);
  assert.equal(
    inspectTPair(pair.host, pair.incoming, pair.windows).openings[0]!.status,
    "touching",
  );
  const overlapping = pair.windows.map((w) => ({ ...w, position: 2.33 / 3 }));
  assert.throws(() => deriveTPairSolids(pair.host, pair.incoming, overlapping), /überschneidet/);
});

test("public T entries still reject malformed full snapshots beyond the selected pair", () => {
  const p = tFixture();
  p.storey.walls[2]!.height = -1;
  assert.throws(() => deriveTPreview(p, "host", { wallId: "incoming", endpoint: 1 }));
  assert.throws(() => inspectTOpenings(p, "host", { wallId: "incoming", endpoint: 1 }));
  assert.throws(() => resolveIsolatedTPair(p, "host", { wallId: "incoming", endpoint: 1 }));
});

test("T windows may touch either contact, but crossing it rejects without mutation", () => {
  for (const wallId of ["host", "incoming"])
    for (const [centre, expected] of [
      [2.31, "free"],
      [2.32, "touching"],
      [2.33, "overlapping"],
    ] as const) {
      const p = addWindow(tFixture(), {
        id: "w",
        wallId,
        width: 1,
        height: 1,
        sillHeight: 0.9,
        position: centre / (wallId === "host" ? 6 : 3),
      });
      const before = structuredClone(p);
      assert.equal(
        inspectTOpenings(p, "host", { wallId: "incoming", endpoint: 1 }).openings[0]!.status,
        expected,
      );
      if (expected === "overlapping")
        assert.throws(
          () => deriveTPreview(p, "host", { wallId: "incoming", endpoint: 1 }),
          /überschneidet/,
        );
      else
        assert.ok(
          Math.abs(
            deriveTPreview(p, "host", { wallId: "incoming", endpoint: 1 }).volume - 8.53056,
          ) < 1e-8,
        );
      assert.deepEqual(p, before);
    }
  for (const [centre, expected] of [
    [3.69, "free"],
    [3.68, "touching"],
    [3.67, "overlapping"],
    [3.7, "free"],
  ] as const) {
    // Right contact edge is 3.18; a 1 m window touching it has centre 3.68.
    const p = addWindow(tFixture(), {
      id: "w",
      wallId: "host",
      width: 1,
      height: 1,
      sillHeight: 0.9,
      position: centre / 6,
    });
    assert.equal(
      inspectTOpenings(p, "host", { wallId: "incoming", endpoint: 1 }).openings[0]!.status,
      expected,
    );
  }
});

test("T windows reuse shared cut solids, independently of visibility and axis direction", () => {
  let original = addWindow(tFixture(), {
    id: "h",
    wallId: "host",
    width: 1,
    height: 1,
    sillHeight: 0.9,
    position: 2.32 / 6,
  });
  original = addWindow(original, {
    id: "i",
    wallId: "incoming",
    width: 1,
    height: 1,
    sillHeight: 0.9,
    position: 2.32 / 3,
  });
  for (const reverse of [false, true])
    for (const angle of [0, 0.7]) {
      const p = structuredClone(original);
      const tr = (q: { x: number; y: number }) => ({
        x: 1000 + q.x * Math.cos(angle) - q.y * Math.sin(angle),
        y: -2000 + q.x * Math.sin(angle) + q.y * Math.cos(angle),
      });
      for (const wall of p.storey.walls) {
        const start = wall.start,
          end = wall.end;
        wall.start = tr(reverse ? end : start);
        wall.end = tr(reverse ? start : end);
        if (reverse) wall.bodyOffset = -wall.bodyOffset;
      }
      if (reverse) for (const w of p.storey.windows) w.position = 1 - w.position;
      p.bimVisibility.hiddenLayerIds = [p.defaultLayerIds.window];
      const target = { wallId: "incoming", endpoint: (reverse ? 0 : 1) as 0 | 1 };
      const report = inspectTOpenings(p, "host", target);
      assert.ok(report.openings.every((o) => o.status === "touching"));
      const preview = deriveTPreview(p, "host", target);
      assert.ok(Math.abs(preview.volume - 8.17056) < 1e-8);
      assert.ok(preview.walls.every((w) => w.faces.length > 6));
    }
});

function tFixture() {
  let p = createProject("t", "s");
  for (const w of [
    { id: "host", start: { x: 0, y: 0 }, end: { x: 6, y: 0 } },
    { id: "incoming", start: { x: 3, y: -3 }, end: { x: 3, y: 0 } },
    { id: "unrelated", start: { x: 9, y: 0 }, end: { x: 12, y: 0 } },
  ])
    p = addWall(p, { ...w, thickness: 0.36, height: 2.8, bodyOffset: 0 });
  return p;
}

test("T clearance uses actual contact width for shifted axes and either approach side", () => {
  for (const sign of [-1, 1])
    for (const hostOffset of [-0.18, 0, 0.18])
      for (const incomingOffset of [-0.18, 0, 0.18]) {
        const p = tFixture();
        p.storey.walls[0]!.bodyOffset = hostOffset;
        p.storey.walls[1]!.bodyOffset = incomingOffset;
        p.storey.walls[1]!.start.y = sign * 3;
        // Incoming normal points right when approaching from above, left from below.
        const contactLeft = 3 + sign * incomingOffset - 0.18;
        for (const delta of [-0.01, 0, 0.01]) {
          const project = addWindow(p, {
            id: "h",
            wallId: "host",
            width: 1,
            height: 1,
            sillHeight: 0.9,
            position: (contactLeft - 0.5 + delta) / 6,
          });
          const report = inspectTOpenings(project, "host", { wallId: "incoming", endpoint: 1 });
          assert.equal(
            report.openings[0]!.status,
            delta < 0 ? "free" : delta === 0 ? "touching" : "overlapping",
          );
        }
      }
});
test("T preview shares profiles/surfaces, preserves unrelated geometry and never changes the project", () => {
  const project = tFixture(),
    before = structuredClone(project);
  const state = cornerPreviewReducer(
    { preview: null, error: "" },
    { type: "t-preview", project, hostId: "host", incoming: { wallId: "incoming", endpoint: 1 } },
  );
  assert.equal(state.error, "");
  const preview = currentCornerPreview(state, project)!;
  assert.ok(Math.abs(preview.geometry.volume - 8.89056) < 1e-8);
  const base = buildSolid(project),
    displayed = cornerPreviewSurfaces(project, base, preview);
  assert.deepEqual(
    displayed.faces.filter((f) => f.wallId === "unrelated"),
    base.faces.filter((f) => f.wallId === "unrelated"),
  );
  for (const wall of preview.geometry.walls) {
    assert.deepEqual(
      displayed.faces.filter((f) => f.wallId === wall.wallId),
      wall.faces,
    );
    assert.equal(wall.localProfile.length, wall.contour.length);
  }
  assert.deepEqual(project, before);
  assert.equal(project.storey.wallJoins.length, 0);
  assert.equal(currentCornerPreview(state, structuredClone(project)), null);
  assert.deepEqual(cornerPreviewReducer(state, { type: "clear" }), { preview: null, error: "" });
  const invalid = cornerPreviewReducer(state, {
    type: "t-preview",
    project,
    hostId: "host",
    incoming: { wallId: "incoming", endpoint: 0 },
  });
  assert.equal(invalid.preview, null);
  assert.ok(invalid.error);
});

test("T preview allows windows away from contact, rejects joins and invalid targets", () => {
  const base = tFixture();
  for (const wallId of ["host", "incoming"]) {
    const project = addWindow(base, {
      id: "window",
      wallId,
      width: 1,
      height: 1,
      sillHeight: 0.9,
      position: wallId === "host" ? 0.2 : 0.5,
    });
    const result = cornerPreviewReducer(
      { preview: null, error: "" },
      { type: "t-preview", project, hostId: "host", incoming: { wallId: "incoming", endpoint: 1 } },
    );
    assert.ok(result.preview);
    assert.equal(result.error, "");
  }
  const joined = addWall(base, {
    id: "corner",
    start: { x: 6, y: 0 },
    end: { x: 6, y: 3 },
    thickness: 0.36,
    height: 2.8,
    bodyOffset: 0,
  });
  const result = cornerPreviewReducer(
    { preview: null, error: "" },
    {
      type: "t-preview",
      project: joined,
      hostId: "host",
      incoming: { wallId: "incoming", endpoint: 1 },
    },
  );
  assert.equal(result.preview, null);
  assert.match(result.error, /ohne weitere Anschlüsse/);
  for (const hostId of ["missing", "incoming"]) {
    const result = cornerPreviewReducer(
      { preview: null, error: "" },
      { type: "t-preview", project: base, hostId, incoming: { wallId: "incoming", endpoint: 1 } },
    );
    assert.equal(result.preview, null);
    assert.ok(result.error);
  }
});
const targets = [
  { wallId: "A", endpoint: 1 as const },
  { wallId: "B", endpoint: 0 as const },
] as const;
function fixture() {
  let p = createProject("p", "s");
  for (const w of [
    { id: "A", start: { x: 0, y: 0 }, end: { x: 3, y: 0 } },
    { id: "B", start: { x: 3, y: 0 }, end: { x: 3, y: 3 } },
    { id: "C", start: { x: 8, y: 0 }, end: { x: 11, y: 0 } },
  ])
    p = addWall(p, { ...w, thickness: 0.36, height: 2.8 });
  return addWindow(p, {
    id: "w",
    wallId: "A",
    width: 1.2,
    height: 1.35,
    sillHeight: 0.9,
    position: 0.5,
  });
}
test("explicit preview replaces both wall bodies, preserves unrelated walls and the authoritative model", () => {
  const p = fixture(),
    before = structuredClone(p),
    base = buildSolid(p);
  const state = cornerPreviewReducer(
    { preview: null, error: "" },
    { type: "preview", project: p, first: targets[0], second: targets[1] },
  );
  assert.equal(state.error, "");
  const preview = currentCornerPreview(state, p)!;
  const surfaces = cornerPreviewSurfaces(p, base, preview);
  for (const id of ["A", "B"])
    assert.deepEqual(
      surfaces.faces.filter((f) => f.wallId === id),
      preview.geometry.walls.find((w) => w.wallId === id)!.faces,
    );
  assert.deepEqual(
    surfaces.faces.filter((f) => f.wallId === "C"),
    base.faces.filter((f) => f.wallId === "C"),
  );
  assert.deepEqual(p, before);
  assert.ok(Math.abs(preview.geometry.volume - (6.048 - 1.2 * 1.35 * 0.36)) < 1e-8);
  for (const w of preview.geometry.walls) assert.equal(w.localProfile.length, w.contour.length);
});
test("preview rejects changed snapshots, invalid pairs and clears without history or mutation", () => {
  const p = fixture(),
    state = cornerPreviewReducer(
      { preview: null, error: "" },
      { type: "preview", project: p, first: targets[0], second: targets[1] },
    );
  const changed = structuredClone(p);
  assert.equal(currentCornerPreview(state, changed), null);
  assert.throws(() => cornerPreviewSurfaces(changed, buildSolid(changed), state.preview!));
  const invalid = cornerPreviewReducer(state, {
    type: "preview",
    project: p,
    first: targets[0],
    second: { wallId: "C", endpoint: 0 },
  });
  assert.equal(invalid.preview, null);
  assert.ok(invalid.error);
  assert.deepEqual(cornerPreviewReducer(state, { type: "clear" }), { preview: null, error: "" });
});
test("rendering and depth picking cover the complete convex face rather than just its first quad", () => {
  assert.deepEqual(
    [...faceTriangles(5)],
    [
      [0, 1, 2],
      [0, 2, 3],
      [0, 3, 4],
    ],
  );
  const vertices: [number, number, number][] = [
    [-0.8, -0.8, 0],
    [0.8, -0.8, 0],
    [0.8, 0.4, 0],
    [0, 0.9, 0],
    [-0.8, 0.4, 0],
  ];
  assert.deepEqual(
    nearestWallSurface(
      { faces: [{ wallId: "p", vertices, normal: [0, 0, 1] }] },
      (p) => p,
      -0.6,
      0.3,
    ),
    { wallId: "p", depth: 0 },
  );
  assert.equal(
    nearestWallSurface(
      { faces: [{ wallId: "p", vertices, normal: [0, 0, 1] }] },
      (p) => p,
      -0.95,
      0.3,
    ),
    null,
  );
});
