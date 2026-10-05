import test from "node:test";
import assert from "node:assert/strict";
import { inspectCornerOpenings, type CornerTarget } from "./corner-openings.ts";
import { createProject, addWall, addWindow, updateWall } from "../../../lib/bim/model.ts";
import { measureHalfPlane } from "../../../geometry/projections/half-plane.ts";

const targets: [CornerTarget, CornerTarget] = [
  { wallId: "A", endpoint: 1 },
  { wallId: "B", endpoint: 0 },
];
const project = (a = 0, b = 0) =>
  addWall(
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
const opening = (id: string, wallId: string, position: number) => ({
  id,
  wallId,
  width: 1.2,
  height: 1.35,
  sillHeight: 0.9,
  position,
});
const report = (p: ReturnType<typeof project>) => inspectCornerOpenings(p, ...targets);

test("centred windows span the wall thickness without false end-contact; inputs unchanged", () => {
  const p = addWindow(addWindow(project(), opening("wA", "A", 0.5)), opening("wB", "B", 0.5));
  const before = structuredClone(p),
    r = report(p);
  assert.deepEqual(p, before);
  assert.deepEqual(
    r.openings.map((w) => w.status),
    ["contained", "contained"],
  );
  for (const w of r.openings) {
    assert.ok(
      w.boundaries.filter((b) => b.boundary === "side").every((b) => b.relation === "touching"),
    );
    assert.ok(w.boundaries.filter((b) => b.boundary !== "side").every((b) => b.clearance > 0));
  }
  assert.deepEqual(inspectCornerOpenings(p, targets[1], targets[0]), r);
});

test("nine signed offset pairs classify full opening footprints on BOTH hosts", () => {
  for (const a of [-0.18, 0, 0.18])
    for (const b of [-0.18, 0, 0.18]) {
      const p = addWindow(
        addWindow(project(a, b), opening("wA", "A", 2.22 / 3)),
        opening("wB", "B", 0.78 / 3),
      );
      const r = report(p);
      const expected = (offset: number) =>
        offset < 0 ? "contained" : offset > 0 ? "outside" : "touching";
      assert.equal(r.openings[0]!.status, expected(b));
      assert.equal(r.openings[1]!.status, expected(a));
      for (const w of r.openings) {
        const seam = w.boundaries.find((b) => b.boundary === "join")!;
        assert.equal(seam.relation, w.status === "contained" ? "inside" : w.status);
      }
    }
});

test("tiny positive gaps, true contact and penetration are distinct; far end reported separately", () => {
  for (const [delta, status] of [
    [-1e-6, "contained"],
    [0, "touching"],
    [1e-6, "outside"],
  ] as const) {
    const r = report(addWindow(project(), opening("w", "A", (2.22 + delta) / 3))).openings[0]!;
    assert.equal(r.status, status);
  }
  const w = report(addWindow(project(), opening("w", "A", 0.2))).openings[0]!;
  assert.equal(w.status, "touching");
  assert.equal(w.boundaries.find((b) => b.boundary === "far-end")!.relation, "touching");
  assert.equal(w.boundaries.find((b) => b.boundary === "join")!.relation, "inside");
  // Centre still lies before the seam, but one footprint corner lies beyond it.
  const hit = report(addWindow(project(), opening("w", "A", 2.3 / 3))).openings[0]!;
  assert.equal(hit.status, "outside");
  assert.ok(hit.boundaries.find((b) => b.boundary === "join")!.clearance < 0);
});

test("reports survive rotation, reflection, translation and reversed wall directions", () => {
  for (const offset of [-0.18, 0, 0.18])
    for (const angle of [0, 0.7])
      for (const mirror of [1, -1])
        for (const mask of [0, 1, 2, 3]) {
          const p = addWindow(
            addWindow(project(offset, offset), opening("wA", "A", 2.22 / 3)),
            opening("wB", "B", 0.78 / 3),
          );
          const expected = report(p),
            next = structuredClone(p);
          const transform = (q: { x: number; y: number }) => ({
            x: 1000 + Math.cos(angle) * q.x - Math.sin(angle) * q.y * mirror,
            y: -2000 + Math.sin(angle) * q.x + Math.cos(angle) * q.y * mirror,
          });
          next.storey.walls = next.storey.walls.map((w, i) => ({
            ...w,
            start: transform(mask & (1 << i) ? w.end : w.start),
            end: transform(mask & (1 << i) ? w.start : w.end),
            bodyOffset: w.bodyOffset * mirror * (mask & (1 << i) ? -1 : 1),
          }));
          next.storey.windows = next.storey.windows.map((w) => ({
            ...w,
            position: mask & (w.wallId === "A" ? 1 : 2) ? 1 - w.position : w.position,
          }));
          const ends = targets.map((t, i) => ({
            ...t,
            endpoint: mask & (1 << i) ? ((1 - t.endpoint) as 0 | 1) : t.endpoint,
          })) as [CornerTarget, CornerTarget];
          const actual = inspectCornerOpenings(next, ...ends);
          assert.deepEqual(
            actual.openings.map((w) => w.status),
            expected.openings.map((w) => w.status),
          );
          actual.openings.forEach((w, i) =>
            w.footprint.forEach((q) =>
              assert.ok(
                expected.openings[i]!.footprint.map(transform).some(
                  (p) => Math.hypot(p.x - q.x, p.y - q.y) < 1e-8,
                ),
              ),
            ),
          );
        }
});

test("only requested hosts assessed, hidden layers still checked, fresh geometry on model change", () => {
  let p = addWall(project(), {
    id: "C",
    start: { x: 6, y: 0 },
    end: { x: 9, y: 0 },
    thickness: 0.36,
    height: 2.8,
  });
  p = addWindow(addWindow(p, opening("other", "C", 0.5)), opening("w", "A", 2.22 / 3));
  p.bimVisibility.hiddenLayerIds = [p.defaultLayerIds.wall, p.defaultLayerIds.window];
  assert.equal(report(p).openings.length, 1);
  assert.equal(report(p).openings[0]!.status, "touching");
  assert.equal(report(updateWall(p, "B", { bodyOffset: 0.18 })).openings[0]!.status, "outside");
  assert.equal(report(p).openings[0]!.status, "touching");
  assert.throws(() => inspectCornerOpenings(p, { wallId: "missing", endpoint: 0 }, targets[1]));
  const bad = structuredClone(p);
  bad.storey.windows[0]!.width = -1;
  assert.throws(() => report(bad));
  const high = structuredClone(p);
  high.storey.windows[0]!.height = 5;
  assert.throws(() => report(high));
});

test("generic half-plane uses signed metre distance and rejects degenerate/nonfinite input", () => {
  assert.deepEqual(measureHalfPlane([{ x: 2, y: 3 }], { x: 0, y: 0 }, { x: 10, y: 0 }), {
    relation: "inside",
    clearance: 3,
  });
  assert.equal(
    measureHalfPlane([{ x: 2, y: -0.1 }], { x: 0, y: 0 }, { x: 10, y: 0 }).relation,
    "outside",
  );
  assert.equal(
    measureHalfPlane([{ x: 2, y: 1e-10 }], { x: 0, y: 0 }, { x: 10, y: 0 }).relation,
    "touching",
  );
  assert.throws(() => measureHalfPlane([], { x: 0, y: 0 }, { x: 1, y: 0 }));
  assert.throws(() => measureHalfPlane([{ x: 1, y: 0 }], { x: 0, y: 0 }, { x: 0, y: 0 }));
  assert.throws(() => measureHalfPlane([{ x: Infinity, y: 0 }], { x: 0, y: 0 }, { x: 1, y: 0 }));
});
