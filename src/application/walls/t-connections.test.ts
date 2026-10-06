import test from "node:test";
import assert from "node:assert/strict";
import {
  createProject,
  addWall,
  addWindow,
  updateWall,
  updateWindow,
  validateProject,
  serializeProject,
  deserializeProject,
} from "../../lib/bim/model.ts";
import { previewTConnection, commitTConnection } from "./t-connections.ts";
import { moveElement } from "../direct-edit/transforms.ts";
import { createHistory, commitProject, undoProject, redoProject } from "../../lib/bim/history.ts";
import {
  connectedWallContours,
  connectedWallSolids,
} from "../../domain/elements/wall/connections.ts";
import { buildSolid } from "../../lib/bim/geometry.ts";
import { exportIfc } from "../../lib/bim/ifc.ts";
import { loadProjectData } from "../../interop/project-file/load.ts";
const relation = { hostWallId: "host", incoming: { wallId: "incoming", endpoint: 1 as const } };
const request = { projectId: "p", kind: "connect" as const, relation };
function pair(offset = 0, reverse = false) {
  let p = createProject("p", "s");
  p = addWall(p, {
    id: "host",
    start: { x: 0, y: 0 },
    end: { x: 6, y: 0 },
    thickness: 0.36,
    height: 2.8,
    bodyOffset: offset,
  });
  return addWall(p, {
    id: "incoming",
    start: { x: 3, y: reverse ? 0 : -3 },
    end: { x: 3, y: reverse ? -3 : 0 },
    thickness: 0.36,
    height: 2.8,
    bodyOffset: offset,
  });
}
const connected = () => {
  const p = pair();
  return previewTConnection(p, p, request);
};

test("persistent T preview, one history commit, disconnect and undo/redo preserve exact IDs", () => {
  let h = createHistory(pair());
  const base = h.present;
  const preview = previewTConnection(base, base, request);
  assert.equal(base.storey.wallTJunctions.length, 0);
  h = commitTConnection(h, base, request);
  assert.deepEqual(h.present, preview);
  assert.equal(h.past.length, 1);
  assert.deepEqual(undoProject(h).present, base);
  assert.deepEqual(redoProject(undoProject(h)).present, preview);
  const detached = commitTConnection(h, h.present, { ...request, kind: "disconnect" });
  assert.equal(detached.present.storey.wallTJunctions.length, 0);
  assert.deepEqual(undoProject(detached).present, preview);
  assert.throws(() => commitTConnection(h, base, request), /geändert/);
  assert.throws(() => previewTConnection(base, base, { ...request, projectId: "other" }));
  assert.throws(() => previewTConnection(base, base, { ...request, kind: "disconnect" }));
});

test("schema 8 roundtrip and strict V7 migration retain geometry without discovering Ts", () => {
  const p = connected();
  assert.deepEqual(deserializeProject(serializeProject(p)), p);
  const { wallTJunctions, ...storey } = p.storey;
  const old = { ...p, schemaVersion: 7, storey };
  const migrated = loadProjectData(old);
  assert.equal(migrated.schemaVersion, 8);
  assert.deepEqual(migrated.storey, { ...storey, wallTJunctions: [] });
  assert.throws(() => loadProjectData({ ...p, schemaVersion: 7 }));
  assert.throws(() => loadProjectData({ ...old, schemaVersion: 8 }));
  assert.throws(() => validateProject(old));
  assert.throws(() =>
    loadProjectData({
      ...p,
      storey: { ...p.storey, wallTJunctions: [{ ...wallTJunctions[0], extra: true }] },
    }),
  );
});

test("host resizing preserves world anchor, detaches outside and does not convert T into corner", () => {
  const p = connected();
  const extended = updateWall(p, "host", { start: { x: -2, y: 0 }, end: { x: 8, y: 0 } });
  assert.deepEqual(extended.storey.walls[1], p.storey.walls[1]);
  assert.deepEqual(extended.storey.wallTJunctions, p.storey.wallTJunctions);
  for (const x of [2, 3]) {
    const next = updateWall(p, "host", { end: { x, y: 0 } });
    assert.equal(next.storey.wallTJunctions.length, 0);
    assert.equal(next.storey.wallJoins.length, 0);
    assert.deepEqual(next.storey.walls[1], p.storey.walls[1]);
    const h = commitProject(createHistory(p), next);
    assert.deepEqual(undoProject(h).present, p);
    assert.deepEqual(redoProject(undoProject(h)).present, next);
  }
  const before = serializeProject(p);
  assert.throws(() => updateWall(p, "host", { end: { x: 3.1, y: 0 } }));
  assert.equal(serializeProject(p), before);
});

test("whole wall translation detaches even when translated host still contains anchor", () => {
  const p = connected();
  for (const id of ["host", "incoming"]) {
    const next = moveElement(p, { kind: "wall", id }, { x: 1, y: 0 });
    assert.equal(next.storey.wallTJunctions.length, 0);
    assert.equal(next.storey.wallJoins.length, 0);
    assert.deepEqual(
      next.storey.walls.find((w) => w.id !== id),
      p.storey.walls.find((w) => w.id !== id),
    );
  }
  assert.deepEqual(moveElement(p, { kind: "wall", id: "host" }, { x: 0, y: 0 }), p);
  assert.equal(
    updateWall(p, "incoming", { start: { x: 3, y: -4 } }).storey.wallTJunctions.length,
    1,
  );
  assert.equal(
    updateWall(p, "incoming", { end: { x: 3, y: -0.5 } }).storey.wallTJunctions.length,
    0,
  );
});

test("invalid persisted identities, duplicate/shared relations and competing corners fail atomically", () => {
  const p = connected(),
    before = serializeProject(p);
  for (const r of [
    { ...relation, hostWallId: "missing" },
    { ...relation, hostWallId: "incoming" },
    { ...relation, incoming: { wallId: "incoming", endpoint: 2 } },
    { ...relation, incoming: { wallId: "incoming", endpoint: 0 } },
  ])
    assert.throws(() => loadProjectData({ ...p, storey: { ...p.storey, wallTJunctions: [r] } }));
  assert.throws(() => previewTConnection(p, p, request));
  assert.throws(() =>
    addWall(p, {
      id: "corner",
      start: { x: 0, y: 0 },
      end: { x: 0, y: 3 },
      thickness: 0.36,
      height: 2.8,
    }),
  );
  const third = addWall(p, {
    id: "third",
    start: { x: 4, y: -3 },
    end: { x: 4, y: 0 },
    thickness: 0.36,
    height: 2.8,
  });
  assert.throws(() =>
    previewTConnection(third, third, {
      ...request,
      relation: { ...relation, incoming: { wallId: "third", endpoint: 1 } },
    }),
  );
  for (const changes of [{ thickness: 0.4 }, { height: 3 }, { bodyOffset: 0.5 }])
    assert.throws(() => updateWall(p, "host", changes));
  assert.equal(serializeProject(p), before);
});

test("touching T windows work in normal solid/IFC and roundtrip; overlap rejected even when hidden", async () => {
  let p = connected();
  for (const [wallId, length] of [
    ["host", 6],
    ["incoming", 3],
  ] as const)
    p = addWindow(p, {
      id: "window-" + wallId,
      wallId,
      width: 1,
      height: 1,
      sillHeight: 0.9,
      position: 2.32 / length,
    });
  const solids = connectedWallSolids(p);
  assert.ok(Math.abs(buildSolid(p).volume - 8.17056) < 1e-9);
  for (const solid of solids)
    assert.deepEqual(connectedWallContours(p).get(solid.wallId), solid.contour);
  const restored = deserializeProject(serializeProject(p));
  assert.deepEqual(buildSolid(restored), buildSolid(p));
  const date = new Date("2026-10-06T12:00:00Z");
  assert.equal(await exportIfc(restored, date), await exportIfc(p, date));
  p = validateProject({ ...p, bimVisibility: { hiddenLayerIds: [p.defaultLayerIds.window] } });
  for (const id of ["window-incoming"])
    assert.throws(() => updateWindow(p, id, { position: 0.8 }), /überschneidet|fit/);
  assert.throws(() => updateWindow(p, "window-host", { position: 0.5 }), /überschneidet/);
});

for (const offset of [-0.18, 0, 0.18])
  for (const reverse of [false, true])
    test(`T supports axis offset ${offset}, incoming reversal ${reverse}`, () => {
      const base = pair(offset, reverse);
      const p = previewTConnection(base, base, {
        ...request,
        relation: { ...relation, incoming: { wallId: "incoming", endpoint: reverse ? 0 : 1 } },
      });
      assert.deepEqual(deserializeProject(serializeProject(p)), p);
      assert.equal(connectedWallSolids(p).length, 2);
    });
