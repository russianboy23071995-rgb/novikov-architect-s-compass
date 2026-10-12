import test from "node:test";
import assert from "node:assert/strict";
import { deriveRightAngleTJunction } from "./t-junction.ts";
import type { CornerEnd } from "./corner.ts";
import { wallBody } from "./body.ts";
import { wallContourSolid } from "./contour-solid.ts";
import type { Wall } from "../../project/schema.ts";

const pair = (): [CornerEnd["wall"], CornerEnd] => [
  {
    id: "host",
    start: { x: 0, y: 0 },
    end: { x: 6, y: 0 },
    thickness: 0.36,
    height: 2.8,
    bodyOffset: 0,
  },
  {
    wall: {
      id: "incoming",
      start: { x: 3, y: -3 },
      end: { x: 3, y: 0 },
      thickness: 0.36,
      height: 2.8,
      bodyOffset: 0,
    },
    endpoint: 1,
  },
];
const close = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-8, `${a} != ${b}`);
const same = (a: { x: number; y: number }[], b: { x: number; y: number }[]) => {
  assert.equal(a.length, b.length);
  for (const p of a) assert.ok(b.some((q) => Math.hypot(p.x - q.x, p.y - q.y) < 1e-8));
};

test("T preserves host and axes, returns exact contact and independently expected solid volume", () => {
  const [host, incoming] = pair();
  const before = structuredClone([host, incoming]);
  const r = deriveRightAngleTJunction(host, incoming);
  assert.deepEqual(r.host.points, wallBody(host).corners);
  same(r.contact, [
    { x: 2.82, y: -0.18 },
    { x: 3.18, y: -0.18 },
  ]);
  close(r.host.area, 6 * 0.36);
  close(r.incoming.area, 2.82 * 0.36);
  const hostSolid = wallContourSolid({ ...host, layerId: "wall" } as Wall, r.host.points, []);
  const incomingSolid = wallContourSolid(
    { ...incoming.wall, layerId: "wall" } as Wall,
    r.incoming.points,
    [],
  );
  close(hostSolid.volume + incomingSolid.volume, 8.89056);
  assert.deepEqual([host, incoming], before);
  assert.equal(r.host.wallId, host.id);
  assert.equal(r.incoming.wallId, incoming.wall.id);
  r.host.points[0]!.x = 100;
  assert.deepEqual([host, incoming], before);
});

test("both sides and all axis offsets produce touching, non-overlapping bodies", () => {
  for (const sign of [-1, 1])
    for (const ho of [-0.18, 0, 0.18])
      for (const wo of [-0.18, 0, 0.18]) {
        const [host, incoming] = pair();
        host.bodyOffset = ho;
        incoming.wall.bodyOffset = wo;
        incoming.wall.start.y = sign * 3;
        const r = deriveRightAngleTJunction(host, incoming);
        const contactY = ho + sign * 0.18;
        for (const p of r.contact) close(p.y, contactY);
        assert.ok(r.incoming.points.every((p) => sign * (p.y - contactY) >= -1e-12));
        assert.ok(r.host.points.every((p) => sign * (p.y - contactY) <= 1e-12));
        close(r.incoming.area, (3 - sign * contactY) * 0.36);
        assert.deepEqual(r.host.points, wallBody(host).corners);
      }
});

test("T geometry is invariant under endpoint reversal, rotation, reflection and translation", () => {
  for (const mask of [0, 1, 2, 3])
    for (const angle of [0, 0.7, 2.4])
      for (const mirror of [-1, 1]) {
        const [host, incoming] = pair();
        host.bodyOffset = 0.18;
        incoming.wall.bodyOffset = -0.18;
        const expected = deriveRightAngleTJunction(host, incoming);
        const transform = (p: { x: number; y: number }) => ({
          x: 10000 + Math.cos(angle) * p.x - Math.sin(angle) * p.y * mirror,
          y: -20000 + Math.sin(angle) * p.x + Math.cos(angle) * p.y * mirror,
        });
        const map = (w: CornerEnd["wall"], reverse: boolean) => ({
          ...w,
          start: transform(reverse ? w.end : w.start),
          end: transform(reverse ? w.start : w.end),
          bodyOffset: w.bodyOffset * mirror * (reverse ? -1 : 1),
        });
        const actual = deriveRightAngleTJunction(map(host, !!(mask & 1)), {
          wall: map(incoming.wall, !!(mask & 2)),
          endpoint: mask & 2 ? 0 : 1,
        });
        same(actual.host.points, expected.host.points.map(transform));
        same(actual.incoming.points, expected.incoming.points.map(transform));
        same(actual.contact, expected.contact.map(transform));
        close(actual.host.area, expected.host.area);
        close(actual.incoming.area, expected.incoming.area);
      }
});

test("invalid pairs reject without changing inputs", () => {
  const changes: ((h: CornerEnd["wall"], i: CornerEnd) => void)[] = [
    (h, i) => {
      i.wall.id = h.id;
    },
    (h) => {
      h.id = " ";
    },
    (_, i) => {
      i.endpoint = 2 as 0;
    },
    (h) => {
      h.height = -1;
    },
    (h) => {
      h.thickness = 0;
    },
    (h) => {
      h.bodyOffset = 0.181;
    },
    (h) => {
      h.start.x = NaN;
    },
    (h) => {
      h.end.x = Infinity;
    },
    (h) => {
      h.end = { ...h.start };
    },
    (_, i) => {
      i.wall.height = 3;
    },
    (_, i) => {
      i.wall.thickness = 0.4;
    },
    (_, i) => {
      i.wall.end.y = 0.01;
    },
    (_, i) => {
      i.wall.start.x = 2;
    },
    (_, i) => {
      i.wall.start = { x: 1, y: 0 };
    },
    (_, i) => {
      i.wall.start.y = -0.18;
    },
    (_, i) => {
      i.wall.start.y = -0.1;
    },
    (_, i) => {
      i.wall.start.x = i.wall.end.x = 0;
    },
    (_, i) => {
      i.wall.start.x = i.wall.end.x = 0.18;
    },
    (_, i) => {
      i.wall.start.x = i.wall.end.x = 5.82;
    },
    (_, i) => {
      i.wall.start.x = i.wall.end.x = 6.1;
    },
  ];
  for (const change of changes) {
    const [h, i] = pair();
    change(h, i);
    const before = structuredClone([h, i]);
    assert.throws(() => deriveRightAngleTJunction(h, i));
    assert.deepEqual([h, i], before);
  }
  for (const x of [0.18001, 5.81999]) {
    const [h, i] = pair();
    i.wall.start.x = i.wall.end.x = x;
    assert.doesNotThrow(() => deriveRightAngleTJunction(h, i));
  }
});
