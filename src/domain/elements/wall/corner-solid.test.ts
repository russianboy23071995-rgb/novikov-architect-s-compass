import test from "node:test";
import assert from "node:assert/strict";
import { deriveCornerSolids } from "./corner-solid.ts";
import { deriveRightAngleCorner } from "./corner.ts";
import { createProject, addWall, addWindow } from "../../../lib/bim/model.ts";
import { buildSolid } from "../../../lib/bim/geometry.ts";
import {
  extrudeProfileWithOpenings,
  type ProfileFace,
  type Vertex3,
} from "../../../geometry/solids/profile-openings.ts";
const targets = [
  { wallId: "A", endpoint: 1 as const },
  { wallId: "B", endpoint: 0 as const },
] as const;
const project = (a = 0, b = 0) => {
  const result = addWall(
    addWall(createProject("p", "s"), {
      id: "A",
      start: { x: 0, y: 0 },
      end: { x: 3, y: 0 },
      thickness: 0.36,
      height: 2.8,
      bodyOffset: a,
    }),
    {
      id: "B",
      start: { x: 3, y: 0 },
      end: { x: 3, y: 3 },
      thickness: 0.36,
      height: 2.8,
      bodyOffset: b,
    },
  );
  // This suite inspects an explicit pair without a persisted connection.
  result.storey.wallJoins = [];
  return result;
};
const opening = (id: string, wallId = "A", position = 0.5) => ({
  id,
  wallId,
  width: 1.2,
  height: 1.35,
  sillHeight: 0.9,
  position,
});
const derive = (p: ReturnType<typeof project>) => deriveCornerSolids(p, ...targets);
const close = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-7, `${a} != ${b}`);
function shell(faces: ProfileFace[], expected: number) {
  const edges = new Map<string, number[]>();
  let volume = 0;
  const key = (v: Vertex3) => v.map((x) => Math.round(x * 1e8)).join(",");
  const origin = faces[0]!.vertices[0]!;
  const sub = (v: Vertex3): Vertex3 => [v[0] - origin[0], v[1] - origin[1], v[2] - origin[2]];
  for (const f of faces) {
    close(Math.hypot(...f.normal), 1);
    for (let i = 0; i < f.vertices.length; i++) {
      const a = key(f.vertices[i]!),
        b = key(f.vertices[(i + 1) % f.vertices.length]!);
      assert.notEqual(a, b);
      const id = a < b ? `${a}|${b}` : `${b}|${a}`;
      edges.set(id, [...(edges.get(id) ?? []), a < b ? 1 : -1]);
    }
    for (let i = 1; i < f.vertices.length - 1; i++) {
      const a = sub(f.vertices[0]!),
        b = sub(f.vertices[i]!),
        c = sub(f.vertices[i + 1]!);
      const cross: Vertex3 = [
        b[1] * c[2] - b[2] * c[1],
        b[2] * c[0] - b[0] * c[2],
        b[0] * c[1] - b[1] * c[0],
      ];
      volume += (a[0] * cross[0] + a[1] * cross[1] + a[2] * cross[2]) / 6;
    }
  }
  for (const [id, directions] of edges) {
    assert.equal(directions.length, 2, id);
    assert.equal(directions[0]! + directions[1]!, 0, id);
  }
  close(volume, expected);
}

test("nine offset profiles extrude to closed outward shells and independent signed mesh volumes", () => {
  for (const a of [-0.18, 0, 0.18])
    for (const b of [-0.18, 0, 0.18]) {
      const p = project(a, b),
        before = structuredClone(p),
        r = derive(p);
      const contour = deriveRightAngleCorner(
        { wall: p.storey.walls[0]!, endpoint: 1 },
        { wall: p.storey.walls[1]!, endpoint: 0 },
      );
      close(
        r.volume,
        contour.walls.reduce((v, w) => v + w.area * 2.8, 0),
      );
      for (const w of r.walls) {
        shell(w.faces, w.volume);
        assert.ok(w.faces.every((f) => f.wallId === w.wallId));
      }
      assert.deepEqual(p, before);
      assert.deepEqual(deriveCornerSolids(p, targets[1], targets[0]), r);
    }
});

test("through windows create reveals and no internal partition faces", () => {
  const p = addWindow(addWindow(project(), opening("wA")), opening("wB", "B")),
    r = derive(p);
  close(r.volume, 2.16 * 2.8 - 2 * 1.2 * 1.35 * 0.36);
  for (const w of r.walls) shell(w.faces, w.volume);
  const a = r.walls[0]!;
  // No material or partition face across the middle of the window opening.
  assert.ok(!a.faces.some((f) => f.vertices.every((v) => Math.abs(v[0] - 1.5) < 1e-8)));
  assert.ok(
    a.faces.some((f) => f.vertices.every((v) => Math.abs(v[2] - 0.9) < 1e-8) && f.normal[2] === 1),
  );
  assert.ok(
    a.faces.some(
      (f) => f.vertices.every((v) => Math.abs(v[2] - 2.25) < 1e-8) && f.normal[2] === -1,
    ),
  );
});

test("overlapping/duplicate openings are subtracted as a union, not repeatedly", () => {
  let p = addWindow(project(), opening("w1"));
  p = addWindow(p, opening("w2", "A", 0.6));
  const r = derive(p);
  close(r.volume, 2.16 * 2.8 - 1.5 * 1.35 * 0.36);
  for (const w of r.walls) shell(w.faces, w.volume);
  const duplicate = derive(addWindow(p, opening("w3")));
  close(duplicate.volume, r.volume);
  assert.deepEqual(duplicate, r);
});

test("rotated, translated and reversed axes retain volume and closed shells; other walls untouched", () => {
  const p = addWindow(project(0.18, -0.18), opening("w"));
  const expected = derive(p);
  for (const angle of [0, 0.7])
    for (const mask of [0, 1, 2, 3]) {
      const q = structuredClone(p),
        rot = (p: { x: number; y: number }) => ({
          x: 100 + Math.cos(angle) * p.x - Math.sin(angle) * p.y,
          y: -50 + Math.sin(angle) * p.x + Math.cos(angle) * p.y,
        });
      q.storey.walls = q.storey.walls.map((w, i) => ({
        ...w,
        start: rot(mask & (1 << i) ? w.end : w.start),
        end: rot(mask & (1 << i) ? w.start : w.end),
        bodyOffset: w.bodyOffset * (mask & (1 << i) ? -1 : 1),
      }));
      if (mask & 1) q.storey.windows[0]!.position = 1 - q.storey.windows[0]!.position;
      const result = deriveCornerSolids(
        q,
        { wallId: "A", endpoint: mask & 1 ? 0 : 1 },
        { wallId: "B", endpoint: mask & 2 ? 1 : 0 },
      );
      close(result.volume, expected.volume);
      for (const w of result.walls) shell(w.faces, w.volume);
    }
  const withOther = addWall(p, {
    id: "C",
    start: { x: 5, y: 0 },
    end: { x: 8, y: 0 },
    thickness: 0.36,
    height: 2.8,
  });
  const existing = buildSolid(withOther);
  assert.equal(derive(withOther).walls.length, 2);
  assert.deepEqual(buildSolid(withOther), existing);
});

test("end contact/overflow remain unsupported and cannot silently lose a window", () => {
  assert.throws(() => derive(addWindow(project(), opening("touch", "A", 2.22 / 3))), /touching/);
  assert.throws(() => derive(addWindow(project(), opening("outside", "A", 2.3 / 3))), /outside/);
  assert.throws(() => derive(addWindow(project(), opening("far", "A", 0.2))), /touching/);
});

test("generic extruder validates inputs and handles openings touching top or bottom", () => {
  const profile = [
    { x: 0, y: 0 },
    { x: 3, y: 0 },
    { x: 3, y: 0.36 },
    { x: 0, y: 0.36 },
  ];
  for (const [bottom, top] of [
    [0, 1],
    [1, 2.8],
    [0, 2.8],
  ]) {
    const r = extrudeProfileWithOpenings(profile, 2.8, [
      { left: 1, right: 2, bottom: bottom!, top: top! },
    ]);
    close(r.volume, 3 * 0.36 * 2.8 - (top! - bottom!) * 0.36);
    shell(r.faces, r.volume);
  }
  assert.throws(() => extrudeProfileWithOpenings(profile, -1, []));
  assert.throws(() => extrudeProfileWithOpenings([...profile].reverse(), 2.8, []));
  assert.throws(() =>
    extrudeProfileWithOpenings(profile, 2.8, [{ left: -1, right: 2, bottom: 0, top: 1 }]),
  );
  assert.throws(() =>
    extrudeProfileWithOpenings(profile, 2.8, [{ left: 1, right: 2, bottom: 0, top: Infinity }]),
  );
});

test("edge-only contacts fail closed, adjacent and vertically overlapping cuts remain a union", () => {
  const profile = [
    { x: 0, y: 0 },
    { x: 3, y: 0 },
    { x: 3, y: 0.36 },
    { x: 0, y: 0.36 },
  ];
  assert.throws(
    () =>
      extrudeProfileWithOpenings(profile, 2.8, [
        { left: 0.5, right: 1.5, bottom: 0.5, top: 1.5 },
        { left: 1.5, right: 2.5, bottom: 1.5, top: 2.5 },
      ]),
    /Hülle/,
  );
  for (const second of [
    { left: 1.5, right: 2.5, bottom: 0.5, top: 1.5 },
    { left: 1, right: 2, bottom: 1, top: 2 },
  ]) {
    const result = extrudeProfileWithOpenings(profile, 2.8, [
      { left: 0.5, right: 1.5, bottom: 0.5, top: 1.5 },
      second,
    ]);
    const removed = second.left === 1.5 ? 2 : 1.75;
    close(result.volume, (3 * 2.8 - removed) * 0.36);
    shell(result.faces, result.volume);
  }
});
