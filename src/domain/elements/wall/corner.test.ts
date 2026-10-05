import test from "node:test";
import assert from "node:assert/strict";
import { deriveRightAngleCorner, type CornerEnd } from "./corner.ts";
import { validateSimplePolygon } from "../../../geometry/polygons/simple-polygon.ts";

const pair = (a = 0, b = 0): [CornerEnd, CornerEnd] => [
  {
    wall: {
      id: "A",
      start: { x: 0, y: 0 },
      end: { x: 3, y: 0 },
      thickness: 0.36,
      height: 2.8,
      bodyOffset: a,
    },
    endpoint: 1,
  },
  {
    wall: {
      id: "B",
      start: { x: 3, y: 0 },
      end: { x: 3, y: 3 },
      thickness: 0.36,
      height: 2.8,
      bodyOffset: b,
    },
    endpoint: 0,
  },
];
const close = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-8, `${a} != ${b}`);
const samePoints = (a: { x: number; y: number }[], b: { x: number; y: number }[]) => {
  assert.equal(a.length, b.length);
  for (const p of a) assert.ok(b.some((q) => Math.hypot(p.x - q.x, p.y - q.y) < 1e-8));
};
const fixtures = [
  [-0.18, -0.18, 3, 0, 3.36, -0.36, 2.2896],
  [-0.18, 0, 2.82, 0, 3.18, -0.36, 2.2248],
  [-0.18, 0.18, 2.64, 0, 3, -0.36, 2.16],
  [0, -0.18, 3, 0.18, 3.36, -0.18, 2.2248],
  [0, 0, 2.82, 0.18, 3.18, -0.18, 2.16],
  [0, 0.18, 2.64, 0.18, 3, -0.18, 2.0952],
  [0.18, -0.18, 3, 0.36, 3.36, 0, 2.16],
  [0.18, 0, 2.82, 0.36, 3.18, 0, 2.0952],
  [0.18, 0.18, 2.64, 0.36, 3, 0, 2.0304],
];
for (const f of fixtures)
  test(`corner offsets ${f[0]}, ${f[1]} have exact seam and disjoint valid contours`, () => {
    const [a, b, ix, iy, ox, oy, area] = f as [
      number,
      number,
      number,
      number,
      number,
      number,
      number,
    ];
    const inputs = pair(a, b),
      before = JSON.stringify(inputs);
    for (const e of inputs) {
      Object.freeze(e.wall.start);
      Object.freeze(e.wall.end);
      Object.freeze(e.wall);
      Object.freeze(e);
    }
    const r = deriveRightAngleCorner(...inputs);
    assert.equal(JSON.stringify(inputs), before);
    samePoints(r.seam, [
      { x: ix, y: iy },
      { x: ox, y: oy },
    ]);
    close(
      r.walls.reduce((n, w) => n + w.area, 0),
      area,
    );
    close(r.walls[0]!.area, 0.36 * (3 - b));
    close(r.walls[1]!.area, 0.36 * (3 - a));
    const [s, t] = r.seam as [{ x: number; y: number }, { x: number; y: number }];
    const side = (p: { x: number; y: number }) =>
      (t.x - s.x) * (p.y - s.y) - (t.y - s.y) * (p.x - s.x);
    const signs: number[] = [];
    for (const w of r.walls) {
      const valid = validateSimplePolygon(w.points);
      assert.ok(valid.valid && valid.signedArea > 0);
      close(valid.signedArea, w.area);
      assert.ok(w.points.some((p) => p.x === s.x && p.y === s.y));
      assert.ok(w.points.some((p) => p.x === t.x && p.y === t.y));
      const far = w.points.filter((p) => Math.abs(side(p)) > 1e-8).map(side);
      assert.equal(far.length, 2);
      assert.ok(far[0]! * far[1]! > 0);
      signs.push(far[0]!);
    }
    assert.ok(signs[0]! * signs[1]! < 0);
    assert.deepEqual(deriveRightAngleCorner(inputs[1], inputs[0]), r);
  });

test("corner is invariant under endpoint reversal, rotation, reflection and translation", () => {
  for (const a of [-0.18, 0, 0.18])
    for (const b of [-0.18, 0, 0.18])
      for (const mask of [0, 1, 2, 3])
        for (const angle of [0, 0.7, Math.PI])
          for (const mirror of [1, -1]) {
            const original = pair(a, b),
              expected = deriveRightAngleCorner(...original);
            const transform = (p: { x: number; y: number }) => ({
              x: 10000 + Math.cos(angle) * p.x - Math.sin(angle) * p.y * mirror,
              y: -20000 + Math.sin(angle) * p.x + Math.cos(angle) * p.y * mirror,
            });
            const ends = original.map((e, i) => {
              const reverse = !!(mask & (1 << i));
              return {
                endpoint: reverse ? ((1 - e.endpoint) as 0 | 1) : e.endpoint,
                wall: {
                  ...e.wall,
                  start: transform(reverse ? e.wall.end : e.wall.start),
                  end: transform(reverse ? e.wall.start : e.wall.end),
                  bodyOffset: e.wall.bodyOffset * mirror * (reverse ? -1 : 1),
                },
              };
            }) as [CornerEnd, CornerEnd];
            const actual = deriveRightAngleCorner(...ends);
            samePoints(actual.seam, expected.seam.map(transform));
            for (let i = 0; i < 2; i++) {
              samePoints(actual.walls[i]!.points, expected.walls[i]!.points.map(transform));
              close(actual.walls[i]!.area, expected.walls[i]!.area);
            }
          }
});

test("unsupported or degenerate inputs fail without repairing their parameters", () => {
  const bad: ((p: [CornerEnd, CornerEnd]) => void)[] = [
    (p) => {
      p[0].endpoint = 2 as 0;
    },
    (p) => {
      p[1].wall.id = "A";
    },
    (p) => {
      p[0].wall.id = " ";
    },
    (p) => {
      p[0].wall.thickness = 0;
    },
    (p) => {
      p[0].wall.height = -1;
    },
    (p) => {
      p[0].wall.bodyOffset = 0.181;
    },
    (p) => {
      p[0].wall.start.x = NaN;
    },
    (p) => {
      p[1].wall.height = Infinity;
    },
    (p) => {
      p[0].wall.bodyOffset = NaN;
    },
    (p) => {
      p[1].wall.thickness = 0.4;
    },
    (p) => {
      p[1].wall.height = 3;
    },
    (p) => {
      p[0].wall.start = { ...p[0].wall.end };
    },
    (p) => {
      p[1].wall.start.x = 3.001;
    },
    (p) => {
      p[1].wall.end = { x: 4, y: 3 };
    },
    (p) => {
      p[1].wall.end = { x: 6, y: 0 };
    },
    (p) => {
      p[0].wall.start = { x: 2.9, y: 0 };
    },
    (p) => {
      p[1].wall.end = { x: 3, y: 0.1 };
    },
    (p) => {
      p[0].wall.start = { x: -1e308, y: 0 };
      p[0].wall.end = { x: 1e308, y: 0 };
    },
  ];
  for (const change of bad) {
    const p = pair();
    change(p);
    const before = structuredClone(p);
    assert.throws(() => deriveRightAngleCorner(...p));
    assert.deepEqual(p, before);
  }
});
