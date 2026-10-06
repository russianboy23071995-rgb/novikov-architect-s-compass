import {
  beginWallChain,
  appendWallChain,
  finishWallChain,
  previewWallChain,
} from "../drawing/wall-chain.ts";
import { drawingInteraction } from "../tools/adapters.ts";
import test from "node:test";
import assert from "node:assert/strict";
import {
  createProject,
  addWall,
  addWindow,
  updateWall,
  updateWindow,
  serializeProject,
  deserializeProject,
} from "../../lib/bim/model.ts";
import { previewTConnection } from "./t-connections.ts";
import {
  connectedWallContours,
  connectedWallSolids,
} from "../../domain/elements/wall/connections.ts";
import { moveElement } from "../direct-edit/transforms.ts";
import { createHistory, commitProject, undoProject, redoProject } from "../../lib/bim/history.ts";
import { exportIfc } from "../../lib/bim/ifc.ts";
import { buildSolid } from "../../lib/bim/geometry.ts";
import { wallPlanOutlines } from "../../rendering/viewport/wall-plan-outline.ts";

const dimensions = { thickness: 0.36, height: 2.8, bodyOffset: 0.18 };
const request = {
  projectId: "p",
  kind: "connect" as const,
  relation: { hostWallId: "H", incoming: { wallId: "N", endpoint: 1 as const } },
};
function fixture(offset = 0.18, side = -1, angle = 0, cornerFirst = true) {
  const at = (x: number, y: number) => ({
    x: 10 + x * Math.cos(angle) - y * Math.sin(angle),
    y: -20 + x * Math.sin(angle) + y * Math.cos(angle),
  });
  const spec = { ...dimensions, bodyOffset: offset };
  let p = addWall(createProject("p", "s"), { id: "H", start: at(0, 0), end: at(6, 0), ...spec });
  const corner = { id: "E", start: at(0, 0), end: at(0, 3), ...spec };
  if (cornerFirst) p = addWall(p, corner);
  p = addWall(p, { id: "N", start: at(3, side * 3), end: at(3, 0), ...spec });
  const before = p;
  p = previewTConnection(p, p, request);
  if (!cornerFirst) p = addWall(p, corner);
  return { p, before };
}
for (const offset of [-0.18, 0, 0.18])
  for (const side of [-1, 1])
    for (const angle of [0, 0.63]) {
      test(`corner+T preserves composed contours: offset ${offset}, side ${side}, angle ${angle}`, () => {
        const { p, before } = fixture(offset, side, angle);
        for (const id of ["H", "E"])
          assert.deepEqual(connectedWallContours(p).get(id), connectedWallContours(before).get(id));
        assert.equal(p.storey.wallJoins.length, 1);
        assert.equal(p.storey.wallTJunctions.length, 1);
        assert.deepEqual(deserializeProject(serializeProject(p)), p);
        for (const s of connectedWallSolids(p))
          assert.deepEqual(s.contour, connectedWallContours(p).get(s.wallId));
        const reversed = fixture(offset, side, angle, false).p;
        assert.deepEqual(connectedWallContours(reversed), connectedWallContours(p));
      });
    }

test("mixed corner and T: windows cross T, corner clipping remains forbidden, JSON/IFC and history agree", async () => {
  const { before } = fixture();
  let { p } = fixture();
  p = addWindow(p, {
    id: "F",
    wallId: "H",
    width: 1.2,
    height: 1.2,
    sillHeight: 0.9,
    position: 0.5,
  });
  for (const position of [0.3, 0.5, 0.7]) {
    const moved = updateWindow(p, "F", { position });
    assert.equal(moved.storey.windows[0]!.wallId, "H");
    assert.deepEqual(moved.storey.wallTJunctions, p.storey.wallTJunctions);
  }
  // At the corner, this offset leaves the window on the miter's inner vertex.
  assert.throws(() => updateWindow(p, "F", { position: 0.1 }));
  const h = commitProject(createHistory(before), p);
  assert.deepEqual(undoProject(h).present, before);
  assert.deepEqual(redoProject(undoProject(h)).present, p);
  const restored = deserializeProject(serializeProject(p));
  assert.deepEqual(buildSolid(restored), buildSolid(p));
  const stamp = new Date("2026-10-06T12:00:00Z");
  const ifc = await exportIfc(p, stamp);
  assert.equal(ifc, await exportIfc(restored, stamp));
  assert.equal((ifc.match(/=IFCWALL\(/g) ?? []).length, 3);
  assert.equal((ifc.match(/=IFCWINDOW\(/g) ?? []).length, 1);
  assert.ok(buildSolid(p).volume > 0);
});

test("mixed connections resize at fixed T anchor and detach only affected relations on translation", () => {
  const { p } = fixture();
  const enlarged = updateWall(p, "H", { end: { x: 18, y: -20 } });
  assert.deepEqual(enlarged.storey.wallTJunctions, p.storey.wallTJunctions);
  assert.deepEqual(
    enlarged.storey.walls.find((w) => w.id === "N"),
    p.storey.walls.find((w) => w.id === "N"),
  );
  const shortened = updateWall(p, "H", { end: { x: 12, y: -20 } });
  assert.equal(shortened.storey.wallTJunctions.length, 0);
  assert.equal(shortened.storey.wallJoins.length, 1);
  const moved = moveElement(p, { kind: "wall", id: "N" }, { x: 1, y: 0 });
  assert.equal(moved.storey.wallTJunctions.length, 0);
  assert.equal(moved.storey.wallJoins.length, 1);
  const host = moveElement(p, { kind: "wall", id: "H" }, { x: 1, y: 0 });
  assert.equal(host.storey.wallJoins.length, 0);
  assert.equal(host.storey.wallTJunctions.length, 0);
  const snapshot = serializeProject(p);
  assert.throws(() => updateWall(p, "E", { end: { x: 11, y: -17 } }));
  assert.equal(serializeProject(p), snapshot);
});

test("T near inner miter, touching corner partner, and excluded topologies fail atomically", () => {
  let base = addWall(createProject("p", "s"), {
    id: "H",
    start: { x: 0, y: 0 },
    end: { x: 6, y: 0 },
    ...dimensions,
  });
  base = addWall(base, { id: "E", start: { x: 0, y: 0 }, end: { x: 0, y: -3 }, ...dimensions });
  for (const x of [0.5, 0.72]) {
    const p = addWall(base, { id: "N", start: { x, y: -3 }, end: { x, y: 0 }, ...dimensions });
    const snapshot = serializeProject(p);
    assert.throws(() => previewTConnection(p, p, request), /Eck/);
    assert.equal(serializeProject(p), snapshot);
  }
  const clear = addWall(base, {
    id: "N",
    start: { x: 0.73, y: -3 },
    end: { x: 0.73, y: 0 },
    ...dimensions,
  });
  assert.equal(previewTConnection(clear, clear, request).storey.wallTJunctions.length, 1);
  const { before } = fixture();
  const two = addWall(before, {
    id: "E2",
    start: { x: 16, y: -20 },
    end: { x: 16, y: -17 },
    ...dimensions,
  });
  assert.throws(() => previewTConnection(two, two, request), /nur einen Eck/);
  const incomingCorner = addWall(before, {
    id: "E3",
    start: { x: 13, y: -23 },
    end: { x: 15, y: -23 },
    ...dimensions,
  });
  assert.throws(() => previewTConnection(incomingCorner, incomingCorner, request), /Nebenwand/);
  const oblique = updateWall(before, "E", { end: { x: 11, y: -17 } });
  assert.throws(() => previewTConnection(oblique, oblique, request), /rechtwinklige Ecke/);
});

test("mixed plan outlines hide both contact seams, hidden partners restore host outline", () => {
  const { p } = fixture();
  const all = wallPlanOutlines(p, new Set(["H", "E", "N"]));
  const hostOnly = wallPlanOutlines(p, new Set(["H"]));
  const length = (edges: { start: { x: number; y: number }; end: { x: number; y: number } }[]) =>
    edges.reduce((sum, e) => sum + Math.hypot(e.end.x - e.start.x, e.end.y - e.start.y), 0);
  assert.ok(length(all.get("H")!) < length(hostOnly.get("H")!) - 0.7);
  assert.equal(hostOnly.get("H")!.length, 4);
  assert.equal(p.storey.wallJoins.length, 1);
  assert.equal(p.storey.wallTJunctions.length, 1);
});

test("shared drawing adapter previews and commits T on a corner host, with one undo", () => {
  const { before } = fixture();
  const base = {
    ...before,
    storey: { ...before.storey, walls: before.storey.walls.filter((w) => w.id !== "N") },
  };
  const origin = { x: 13, y: -23 };
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
  const hit = adapter.snapping.resolve(
    { x: 13.02, y: -20.02 },
    {
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
          point: { x: 13, y: -20 },
          segment: { start: { x: 10, y: -20 }, end: { x: 16, y: -20 } },
        },
      ],
    },
  );
  assert.equal(hit.candidate?.sourceFeature, "t-axis");
  adapter.validate(hit.point, hit.candidate);
  const preview = previewWallChain(chain, base, hit.point, hit.candidate);
  const placed = finishWallChain(appendWallChain(chain, base, "N", hit.point, hit.candidate), base);
  assert.deepEqual(connectedWallContours(preview).get("H"), connectedWallContours(placed).get("H"));
  assert.deepEqual(
    connectedWallContours(preview).get("@wall-preview"),
    connectedWallContours(placed).get("N"),
  );
  assert.equal(base.storey.walls.length, 2);
  assert.equal(base.storey.wallTJunctions.length, 0);
  const h = commitProject(createHistory(base), placed);
  assert.equal(h.past.length, 1);
  assert.deepEqual(undoProject(h).present, base);
  assert.deepEqual(redoProject(undoProject(h)).present, placed);
});

test("corner at host end and reversed incoming endpoint retain the composed profiles", () => {
  let p = addWall(createProject("p", "s"), {
    id: "H",
    start: { x: 0, y: 0 },
    end: { x: 6, y: 0 },
    ...dimensions,
  });
  p = addWall(p, { id: "E", start: { x: 6, y: 0 }, end: { x: 6, y: 3 }, ...dimensions });
  p = addWall(p, { id: "N", start: { x: 3, y: 0 }, end: { x: 3, y: -3 }, ...dimensions });
  const contour = connectedWallContours(p).get("H");
  const next = previewTConnection(p, p, {
    ...request,
    relation: { hostWallId: "H", incoming: { wallId: "N", endpoint: 0 } },
  });
  assert.deepEqual(connectedWallContours(next).get("H"), contour);
  assert.deepEqual(deserializeProject(serializeProject(next)), next);
});

test("existing single endpoint edit detaches the corner; partner is not moved implicitly", () => {
  const { p } = fixture();
  const next = updateWall(p, "H", { start: { x: 9, y: -20 } });
  assert.equal(next.storey.wallJoins.length, 0);
  assert.equal(next.storey.wallTJunctions.length, 1);
  assert.deepEqual(
    next.storey.walls.find((w) => w.id === "E"),
    p.storey.walls.find((w) => w.id === "E"),
  );
});
