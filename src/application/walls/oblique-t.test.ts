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
import { MIN_T_ANGLE_DEGREES } from "../../domain/elements/wall/t-junction.ts";
import { exportIfc } from "../../lib/bim/ifc.ts";
import { wallPlanOutlines } from "../../rendering/viewport/wall-plan-outline.ts";
import { beginWallChain, appendWallChain, finishWallChain } from "../drawing/wall-chain.ts";
import { drawingInteraction } from "../tools/adapters.ts";
import type { Project } from "../../domain/project/schema.ts";
import type { SnapContext } from "../../constraints/snapping/engine.ts";

// Oblique T junctions (user decision 26.10.2026, docs/OBLIQUE_T_JUNCTIONS.md).
const host = { id: "H", start: { x: 0, y: 0 }, end: { x: 10, y: 0 }, thickness: 0.3, height: 3 };
function oblique(degrees: number): Project {
  const r = (degrees * Math.PI) / 180;
  const p = addWall(addWall(createProject("p", "s0"), host), {
    id: "N",
    start: { x: 5 + 4 * Math.cos(r), y: 4 * Math.sin(r) },
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

for (const degrees of [90, 60, 45, 30, 15]) {
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

test(`flatter than ${MIN_T_ANGLE_DEGREES}° and parallel walls are rejected (counter-check)`, () => {
  assert.throws(() => oblique(14), /15°/);
  assert.throws(() => oblique(5), /15°/);
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
  // A cursor foot flatter than the minimum offers no T.
  const flatChain = beginWallChain(base, { x: -20, y: -3 });
  const flatAdapter = drawingInteraction(
    base,
    base,
    { x: -20, y: -3 },
    () => {},
    () => {},
    flatChain.points,
    flatChain,
  );
  assert.notEqual(
    flatAdapter.snapping.resolve({ x: 4.04, y: -0.03 }, context).candidate?.sourceFeature,
    "t-axis",
  );
});
