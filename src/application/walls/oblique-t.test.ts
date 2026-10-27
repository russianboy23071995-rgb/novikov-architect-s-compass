import test from "node:test";
import assert from "node:assert/strict";
import { createProject } from "../projects/create.ts";
import { addWall } from "./actions.ts";
import { addWindow } from "../windows/actions.ts";
import { previewTConnection } from "./t-connections.ts";
import { storeyOf } from "../../domain/storeys/access.ts";
import {
  connectedWallContours,
  connectedWallSolids,
} from "../../domain/elements/wall/connections.ts";
import { PARALLEL_T_MESSAGE } from "../../domain/elements/wall/t-junction.ts";
import { exportIfc } from "../../lib/bim/ifc.ts";
import { wallPlanOutlines } from "../../rendering/viewport/wall-plan-outline.ts";
import { beginWallChain, appendWallChain, finishWallChain } from "../drawing/wall-chain.ts";
import { drawingInteraction } from "../tools/adapters.ts";
import type { Project } from "../../domain/project/schema.ts";
import type { SnapContext } from "../../constraints/snapping/engine.ts";
import {
  T_ACCEPTANCE_HEIGHT,
  T_ACCEPTANCE_WINDOW,
  boundaryDistance,
  isConvex,
  overlapArea,
  polygonArea,
  readIfcWalls,
  tAcceptanceProject,
  tAcceptanceVariants,
  tVariantProject,
  type IfcWall,
} from "../../../benchmarks/t-ifc-acceptance.ts";

// Oblique T junctions (user decision 26.10.2026, docs/OBLIQUE_T_JUNCTIONS.md).
const host = { id: "H", start: { x: 0, y: 0 }, end: { x: 10, y: 0 }, thickness: 0.3, height: 3 };
// Very acute angles need a long host and incoming wall for their long contact (t / sin).
function oblique(degrees: number): Project {
  const r = (degrees * Math.PI) / 180;
  const p = addWall(addWall(createProject("p", "s0"), { ...host, end: { x: 30, y: 0 } }), {
    id: "N",
    start: { x: 5 + 20 * Math.cos(r), y: 20 * Math.sin(r) },
    end: { x: 5, y: 0 },
    thickness: 0.24,
    height: 3,
  });
  return previewTConnection(p, p, {
    projectId: "p",
    kind: "connect",
    relation: { hostWallId: "H", incoming: { wallId: "N", endpoint: 1 } },
  });
}

for (const degrees of [90, 60, 45, 30, 15, 10, 5, 2, 1]) {
  test(`an oblique T at ${degrees}° ends on the host face with the contact width t / sin`, async () => {
    const p = oblique(degrees);
    const ring = connectedWallContours(p).get("N")!;
    // End points (indices 1, 2) lie on the host face y = 0.15.
    for (const index of [1, 2]) assert.ok(Math.abs(ring[index]!.y - 0.15) < 1e-9);
    const width = Math.abs(ring[2]!.x - ring[1]!.x);
    assert.ok(Math.abs(width - 0.24 / Math.sin((degrees * Math.PI) / 180)) < 1e-9);
    assert.ok(connectedWallSolids(p).every((s) => s.volume > 0));
    assert.match(await exportIfc(p), /IFCWALL/);
    assert.equal(wallPlanOutlines(p, new Set(["H", "N"])).size, 2);
    // A window in the incoming wall behaves as with a right angle.
    const withWindow = addWindow(p, {
      id: "w",
      wallId: "N",
      position: 0.5,
      width: 1,
      height: 1,
      sillHeight: 0.9,
    });
    assert.equal(storeyOf(withWindow).windows.length, 1);
  });
}

test("parallel walls and a contact beyond the host end are rejected (counter-check)", () => {
  assert.throws(() => oblique(0), new RegExp(PARALLEL_T_MESSAGE));
  assert.throws(() => oblique(180), new RegExp(PARALLEL_T_MESSAGE));
  // At 2° the contact (6.9 m) no longer fits on a 10 m host beside x = 5.
  const short = addWall(addWall(createProject("p", "s0"), host), {
    id: "N",
    start: { x: 5 + 20 * Math.cos(Math.PI / 90), y: 20 * Math.sin(Math.PI / 90) },
    end: { x: 5, y: 0 },
    thickness: 0.24,
    height: 3,
  });
  assert.throws(
    () =>
      previewTConnection(short, short, {
        projectId: "p",
        kind: "connect",
        relation: { hostWallId: "H", incoming: { wallId: "N", endpoint: 1 } },
      }),
    /Hauptwandende/,
  );
  // Two oblique Ts on the same host side may still not overlap.
  const p = oblique(30);
  const crowded = addWall(p, {
    id: "Q",
    start: { x: 5.2 + 4 * Math.cos(Math.PI / 6), y: 4 * Math.sin(Math.PI / 6) },
    end: { x: 5.2, y: 0 },
    thickness: 0.24,
    height: 3,
  });
  assert.throws(
    () =>
      previewTConnection(crowded, crowded, {
        projectId: "p",
        kind: "connect",
        relation: { hostWallId: "H", incoming: { wallId: "Q", endpoint: 1 } },
      }),
    /überschneiden/,
  );
});

test("drawing snaps an oblique end onto the host axis as a T; a right angle still snaps square", () => {
  const base = addWall(createProject("t", "s"), { ...host, end: { x: 6, y: 0 } });
  const origin = { x: 1.5, y: -3 };
  const context: SnapContext = {
    enabled: true,
    includeInteractionTargets: true,
    pixelsPerMetre: 100,
    endpointRadiusPx: 10,
    gridSpacing: 0.1,
    orthoOrigin: null,
    angleOrigin: null,
    references: [
      {
        entityId: "H",
        feature: "axis-midpoint:0",
        point: { x: 3, y: 0 },
        segment: { start: { x: 0, y: 0 }, end: { x: 6, y: 0 } },
      },
    ],
  };
  const chain = beginWallChain(base, origin);
  const adapter = drawingInteraction(
    base,
    base,
    origin,
    () => {},
    () => {},
    chain.points,
    chain,
  );
  // Oblique: the cursor foot on the axis.
  const tilted = adapter.snapping.resolve({ x: 4.04, y: -0.03 }, context);
  assert.equal(tilted.candidate?.sourceFeature, "t-axis");
  assert.deepEqual(tilted.point, { x: 4.04, y: 0 });
  const p = finishWallChain(
    appendWallChain(chain, base, "n", tilted.point, tilted.candidate),
    base,
  );
  assert.equal(storeyOf(p).wallTJunctions.length, 1);
  // Near the perpendicular foot the square T wins.
  const square = adapter.snapping.resolve({ x: 1.54, y: -0.03 }, context);
  assert.equal(square.candidate?.sourceFeature, "t-axis");
  assert.deepEqual(square.point, { x: 1.5, y: 0 });
  // A flat approach (about 7°) is a T as well (26.10.2026); only a parallel one offers none.
  for (const [origin, expected] of [
    [{ x: -20, y: -3 }, true],
    [{ x: -20, y: 0 }, false],
  ] as const) {
    const flatChain = beginWallChain(base, origin);
    const flatAdapter = drawingInteraction(
      base,
      base,
      origin,
      () => {},
      () => {},
      flatChain.points,
      flatChain,
    );
    assert.equal(
      flatAdapter.snapping.resolve({ x: 4.04, y: -0.03 }, context).candidate?.sourceFeature ===
        "t-axis",
      expected,
    );
  }
});

// Archicad acceptance of T junctions: the regular IFC export read back (user decision
// 27.10.2026, docs/T_IFC_ACCEPTANCE.md).
const near = (a: number, b: number) => Math.abs(a - b) < 1e-9 * Math.max(1, Math.abs(b));
function checkVariantIfc(
  variant: ReturnType<typeof tAcceptanceVariants>[number],
  walls: IfcWall[],
  prefix = "",
) {
  const byName = new Map(walls.map((w) => [w.name, w]));
  for (const [id, expected] of Object.entries(variant.expected)) {
    const wall = byName.get(prefix + id)!;
    assert.ok(wall, `${variant.name}: ${id} exported`);
    assert.equal(wall.depth, T_ACCEPTANCE_HEIGHT);
    // Plan area from axis length and thickness only, not from the wall derivation.
    assert.ok(near(polygonArea(wall.profile), expected.area), `${variant.name} ${id} area`);
    assert.equal(wall.openings.length, expected.windows, `${variant.name} ${id} openings`);
    for (const o of wall.openings) {
      assert.deepEqual(
        [o.width, o.height],
        [T_ACCEPTANCE_WINDOW.width, T_ACCEPTANCE_WINDOW.height],
      );
      assert.ok(near(o.thickness, expected.thickness));
      assert.ok(o.x >= 0);
    }
  }
  for (const [incoming, host] of variant.contacts) {
    const a = byName.get(prefix + incoming)!.profile,
      b = byName.get(prefix + host)!.profile;
    assert.ok(isConvex(b), `${variant.name}: ${host} profile convex`);
    // Touching without volume overlap and without a gap: an edge lies on the host boundary.
    assert.ok(overlapArea(a, b) < 1e-9, `${variant.name}: ${incoming} overlaps ${host}`);
    const touching = a.filter((p) => boundaryDistance(p, b) < 1e-9).length;
    assert.ok(touching >= 2, `${variant.name}: ${incoming} touches ${host} along an edge`);
  }
}

for (const variant of tAcceptanceVariants())
  test(`IFC acceptance ${variant.label}: profiles equal the plan, touch without overlap`, async () => {
    const p = tVariantProject(variant);
    const walls = readIfcWalls(await exportIfc(p, new Date("2026-10-27T12:00:00Z")));
    checkVariantIfc(variant, walls);
    // The written profiles are the plan contours of the program, point for point.
    const contours = connectedWallContours(p);
    for (const wall of walls) {
      const ring = contours.get(wall.name)!;
      assert.equal(wall.profile.length, ring.length);
      for (const point of wall.profile)
        assert.ok(ring.some((q) => Math.hypot(q.x - point.x, q.y - point.y) < 1e-9));
    }
  });

test("the combined IFC acceptance file holds every variant side by side", async () => {
  const walls = readIfcWalls(
    await exportIfc(tAcceptanceProject(), new Date("2026-10-27T12:00:00Z")),
  );
  const variants = tAcceptanceVariants();
  assert.equal(
    walls.length,
    variants.reduce((n, v) => n + Object.keys(v.expected).length, 0),
  );
  for (const variant of variants) checkVariantIfc(variant, walls, `${variant.name}-`);
});

test("the IFC acceptance checks detect overlap, gaps and wrong areas (counter-checks)", async () => {
  const variant = tAcceptanceVariants().find((v) => v.name === "t-30")!;
  const walls = readIfcWalls(await exportIfc(tVariantProject(variant)));
  const host = walls.find((w) => w.name === "H")!.profile;
  const incoming = walls.find((w) => w.name === "N")!.profile;
  const shifted = (dy: number) => incoming.map((p) => ({ x: p.x, y: p.y + dy }));
  // 5 cm into the host: overlap; 5 cm away: no edge on the host boundary.
  assert.ok(overlapArea(shifted(-0.05), host) > 1e-4);
  assert.equal(shifted(0.05).filter((p) => boundaryDistance(p, host) < 1e-9).length, 0);
  // The naive expectation (axis length × thickness, host ignored) does not match.
  assert.ok(!near(polygonArea(incoming), 8 * 0.24));
});
