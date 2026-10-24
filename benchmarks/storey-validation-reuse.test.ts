import test from "node:test";
import assert from "node:assert/strict";
import { fullHeightFixture } from "./bound-height-fixture.ts";
import { defaultHatchAppearance } from "../src/domain/elements/hatch/model.ts";
import { validateProject, type Project } from "../src/lib/bim/model.ts";
import {
  createProjectSnapshot,
  storeyValidationReuseCount,
} from "../src/domain/project/owned-snapshot.ts";

type Storey = Project["storeys"][number];
const random = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/** Height fixture (four storeys, bound and fixed walls, joins, windows) plus a pattern hatch. */
function fixture(): Project {
  const p = structuredClone(fullHeightFixture());
  p.hatchPatterns.push(
    {
      id: "diagonal",
      name: "Diagonal",
      width: 1,
      height: 1,
      lines: [{ start: { x: 0, y: 1 }, end: { x: 1, y: 0 } }],
    },
    {
      id: "spare",
      name: "Spare",
      width: 2,
      height: 2,
      lines: [{ start: { x: 0, y: 0 }, end: { x: 2, y: 2 } }],
    },
  );
  p.storeys[2]!.hatches.push({
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
    pattern: { patternId: "diagonal", mode: "model", origin: { x: 10, y: 0 }, rotation: 0 },
  });
  return validateProject(p);
}

/** Changes build on the owned state with spreads, so untouched storeys keep their identity. */
function mutation(p: Project, next: () => number): Project {
  const pick = <T>(items: readonly T[]) => items[Math.floor(next() * items.length)]!;
  const k = Math.floor(next() * p.storeys.length);
  const storey = (change: (s: Storey) => Storey) => ({
    ...p,
    storeys: p.storeys.map((s, i) => (i === k ? change(s) : s)),
  });
  switch (Math.floor(next() * 12)) {
    case 0:
      return storey((s) => ({
        ...s,
        walls: s.walls.map((w, i) =>
          i === 0 ? { ...w, end: { x: w.end.x + pick([-0.5, 0.3, 1]), y: w.end.y } } : w,
        ),
      }));
    case 1:
      return storey((s) => ({
        ...s,
        walls: s.walls.map((w, i) => (i === 1 ? { ...w, height: pick([-1, 2.5, 3.1, 9]) } : w)),
      }));
    case 2:
      return storey((s) => ({ ...s, height: pick([null, 0.5, 2.6, 3, 3.4]) }));
    case 3:
      return storey((s) => ({
        ...s,
        windows: s.windows.map((w) => ({ ...w, width: pick([0.6, 1.2, 1.5, 12]) })),
      }));
    case 4:
      return {
        ...p,
        layers: p.layers.map((l, i) => (i === 0 ? { ...l, name: pick(["A", "Außen", "  "]) } : l)),
      };
    case 5:
      return {
        ...p,
        bimVisibility: { hiddenLayerIds: pick([[], [p.defaultLayerIds.line], ["missing"]]) },
      };
    case 6: {
      const other = p.storeys[(k + 1) % p.storeys.length]!;
      return other.windows[0]
        ? storey((s) => ({ ...s, windows: [...s.windows, other.windows[0]!] }))
        : p;
    }
    case 7:
      return {
        ...p,
        hatchPatterns: p.hatchPatterns.map((h, i) =>
          i === 0 ? { ...h, width: pick([0.5, 1, -1]) } : h,
        ),
      };
    case 8:
      return { ...p, workingStoreyId: pick(p.storeys).id };
    case 9:
      return { ...p, groundDatum: pick([0, 1.5, -2]) };
    case 10:
      return storey((s) => ({
        ...s,
        hatches: s.hatches.map((h) => ({
          ...h,
          points: h.points.map((q, i) => (i ? q : { x: q.x + pick([1, -20]), y: q.y })),
        })),
      }));
    default:
      return p;
  }
}

const outcome = (run: () => Project) => {
  try {
    return { ok: JSON.stringify(run()) };
  } catch (error) {
    return { error: (error as Error).message };
  }
};

test("storey scope reuse matches full validation on random edits, errors included", () => {
  const next = random(20261024);
  let current = createProjectSnapshot(fixture());
  const before = storeyValidationReuseCount();
  let accepted = 0,
    rejected = 0;
  for (let step = 0; step < 600; step++) {
    const proposed = mutation(current, next);
    const full = outcome(() => validateProject(proposed));
    let snapshot: Project | undefined;
    const reused = outcome(() => (snapshot = createProjectSnapshot(proposed, undefined, current)));
    assert.deepEqual(reused, full, `step ${step}`);
    if (snapshot) {
      current = snapshot;
      accepted++;
    } else rejected++;
  }
  // Both outcomes occur, and unchanged storeys were actually reused.
  assert.ok(accepted > 100 && rejected > 50, `${accepted} accepted, ${rejected} rejected`);
  assert.ok(storeyValidationReuseCount() - before > 600);
});

test("a changed project-wide value revalidates an unchanged storey", () => {
  const base = createProjectSnapshot(fixture());
  // Only the untouched third storey uses this pattern; its scope rule must still reject.
  const proposed = {
    ...base,
    hatchPatterns: base.hatchPatterns.filter((p) => p.id !== "diagonal"),
  };
  assert.throws(() => validateProject(proposed), /Unbekanntes Schraffurmuster/);
  assert.throws(
    () => createProjectSnapshot(proposed, undefined, base),
    /Unbekanntes Schraffurmuster/,
  );
  // The pattern list is filtered by use across reused and validated storeys alike.
  const unused = createProjectSnapshot(
    { ...base, workingStoreyId: base.storeys[0]!.id },
    undefined,
    base,
  );
  const again = createProjectSnapshot(
    { ...unused, storeys: unused.storeys.map((s, i) => (i === 0 ? { ...s, name: "KG neu" } : s)) },
    undefined,
    unused,
  );
  assert.deepEqual(
    again.hatchPatterns.map((p) => p.id),
    ["diagonal"],
  );
});
