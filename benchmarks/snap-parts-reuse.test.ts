import test from "node:test";
import assert from "node:assert/strict";
import { fullHeightFixture } from "./bound-height-fixture.ts";
import { tPairFixture } from "./t-pair-fixture.ts";
import { legacySnapPrimitives } from "./legacy-snap-primitives.ts";
import { defaultHatchAppearance } from "../src/domain/elements/hatch/model.ts";
import { defaultLineAppearance } from "../src/lib/bim/lines.ts";
import { storeyOf } from "../src/domain/storeys/access.ts";
import { validateProject, type Project } from "../src/lib/bim/model.ts";
import { createProjectSnapshot } from "../src/domain/project/owned-snapshot.ts";
import { projectSnapPrimitives } from "../src/application/snapping/project-references.ts";
import { createPrimitiveSourceIndex } from "../src/constraints/snapping/local-source-index.ts";

type Storey = Project["storeys"][number];
const random = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/** Joined, bound and T-connected walls with windows, a hatch and lines on the working storey. */
function fixture(kind: "height" | "t"): Project {
  const p = structuredClone(kind === "height" ? fullHeightFixture() : tPairFixture());
  const s = storeyOf(p);
  s.hatches.push({
    id: "hatch",
    kind: "hatch",
    layerId: p.defaultLayerIds.line,
    points: [
      { x: 10, y: 0 },
      { x: 14, y: 0 },
      { x: 14, y: 4 },
      { x: 10, y: 4 },
    ],
    fill: { color: "#33aabb", opacity: 0.6 },
    ...defaultHatchAppearance,
  });
  s.lines = Array.from({ length: 6 }, (_, i) => ({
    id: `line-${i}`,
    layerId: p.defaultLayerIds.line,
    kind: "line" as const,
    points: [
      { x: i, y: -3 },
      { x: i + 0.5, y: -2 },
    ],
    ...defaultLineAppearance,
  }));
  return validateProject(p);
}

function mutation(p: Project, next: () => number): Project {
  const pick = <T>(items: readonly T[]) => items[Math.floor(next() * items.length)]!;
  const storey = (change: (s: Storey) => Storey) => ({
    ...p,
    storeys: p.storeys.map((s) => (s === storeyOf(p) ? change(s) : s)),
  });
  switch (Math.floor(next() * 7)) {
    case 0:
      return storey((s) => ({
        ...s,
        walls: s.walls.map((w, i) =>
          i === 0 ? { ...w, end: { x: w.end.x + pick([-0.4, 0.3]), y: w.end.y } } : w,
        ),
      }));
    case 1:
      return storey((s) => ({
        ...s,
        hatches: s.hatches.map((h) => ({
          ...h,
          points: h.points.map((q, i) => (i ? q : { x: q.x + pick([-0.5, 0.5]), y: q.y })),
        })),
      }));
    case 2:
      return storey((s) => ({
        ...s,
        lines: s.lines!.map((l, i) =>
          i === Math.floor(next() * s.lines!.length)
            ? { ...l, points: l.points.map((q, k) => (k ? q : { x: q.x, y: q.y + 0.25 })) }
            : l,
        ),
      }));
    case 3:
      return storey((s) => ({
        ...s,
        windows: s.windows.map((w, i) => (i ? w : { ...w, width: pick([0.8, 1, 1.2]) })),
      }));
    case 4:
      return storey((s) => ({ ...s, lines: s.lines!.slice(0, -1) }));
    case 5:
      return { ...p, bimVisibility: { hiddenLayerIds: pick([[], [p.defaultLayerIds.line]]) } };
    default:
      return p;
  }
}

const plain = (primitives: { references: unknown[]; segments: unknown[] }) =>
  JSON.stringify(primitives);

for (const kind of ["height", "t"] as const)
  test(`reused snap parts equal the legacy full derivation (${kind} walls)`, () => {
    const next = random(kind === "height" ? 7 : 11);
    let current = createProjectSnapshot(fixture(kind));
    let checked = 0;
    for (let step = 0; step < 250; step++) {
      let snapshot: Project;
      try {
        snapshot = createProjectSnapshot(mutation(current, next), undefined, current);
      } catch {
        continue;
      }
      const reused = projectSnapPrimitives(snapshot);
      const legacy = legacySnapPrimitives(snapshot);
      assert.equal(plain(reused), plain(legacy), `step ${step}`);
      // Segments still point at the reference objects of the same result.
      reused.segments.forEach((s) => assert.ok(reused.references.includes(s.source)));
      const a = createPrimitiveSourceIndex(reused),
        b = createPrimitiveSourceIndex(legacy);
      for (const cursor of [
        { x: 0, y: 0 },
        { x: 4, y: 0.2 },
        { x: 12, y: 2 },
        { x: 2, y: -2.5 },
      ])
        assert.equal(
          JSON.stringify(a.query(cursor, 100, 40)),
          JSON.stringify(b.query(cursor, 100, 40)),
        );
      current = snapshot;
      checked++;
    }
    assert.ok(checked > 150, `${checked} accepted steps`);
  });

test("unchanged elements reuse their parts; mutable inputs are never cached", () => {
  const base = createProjectSnapshot(fixture("height"));
  const first = projectSnapPrimitives(base);
  const lines = storeyOf(base).lines!;
  const moved = createProjectSnapshot(
    mutation(base, () => 0.4), // case 2: one line changes
    undefined,
    base,
  );
  const second = projectSnapPrimitives(moved);
  const wallRefs = (r: typeof first) => r.references.filter((x) => x.entityId.includes("-"));
  assert.equal(wallRefs(second)[0], wallRefs(first)[0]);
  assert.equal(storeyOf(moved).walls, storeyOf(base).walls);
  assert.notEqual(storeyOf(moved).lines, lines);
  const mutable = structuredClone(base);
  assert.notEqual(projectSnapPrimitives(mutable).references[0], first.references[0]);
  // A mutable project may change in place; its parts must follow every change.
  const line = storeyOf(mutable).lines![0]!;
  const before = plain(projectSnapPrimitives(mutable));
  line.points[0] = { x: line.points[0]!.x + 7, y: line.points[0]!.y };
  assert.notEqual(plain(projectSnapPrimitives(mutable)), before);
  assert.equal(plain(projectSnapPrimitives(mutable)), plain(legacySnapPrimitives(mutable)));
});
