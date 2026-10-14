import test from "node:test";
import assert from "node:assert/strict";
import { wallBase, wallHeights } from "./heights.ts";
import {
  createProject,
  addWall,
  addWindow,
  updateWall,
  serializeProject,
  deserializeProject,
} from "../../../lib/bim/model.ts";
import { validateProject } from "../../project/schema.ts";
import { buildSolid, buildBuildingSolid } from "../../../lib/bim/geometry.ts";
import { storeyOf } from "../../storeys/access.ts";
import {
  addStorey,
  setStoreyHeight,
  setGroundDatum,
} from "../../../application/storeys/actions.ts";
import { selectWorkingStorey } from "../../../application/storeys/working-storey.ts";
import { windowSelectionSurfaces } from "../../../rendering/viewport/window-selection.ts";
import { movementCorners } from "../../../rendering/viewport/movement-origin.ts";
import { exportIfc } from "../../../lib/bim/ifc.ts";
import { prepareSelectionTranslation } from "../../../application/selection/storey-translation.ts";
import { selectionMoveSurfaces } from "../../../rendering/viewport/selection-move-preview.ts";
function fixture(offset = 0) {
  const p = addWall(createProject("p", "eg"), {
    id: "w",
    start: { x: 0, y: 0 },
    end: { x: 3, y: 0 },
    thickness: 0.36,
    height: 2.8,
    baseOffset: offset,
  });
  return addWindow(p, {
    id: "win",
    wallId: "w",
    width: 1.2,
    height: 1.2,
    sillHeight: 0.9,
    position: 0.5,
  });
}
test("wall heights preserve signed offsets, reject overflow and precision collapse", () => {
  assert.deepEqual(wallHeights({ height: 2.8, baseOffset: -0.5 }, 3), { bottom: 2.5, top: 5.3 });
  assert.equal(wallBase({}), 0);
  for (const offset of [NaN, Infinity, -Infinity, Number.MAX_VALUE])
    assert.throws(() => fixture(offset));
});
test("V24 migrates at zero with identical material and rejects forged legacy offsets", () => {
  const p = fixture();
  const old = JSON.parse(serializeProject(p));
  old.schemaVersion = 24;
  delete old.storeys[0].walls[0].baseOffset;
  const restored = deserializeProject(JSON.stringify(old));
  assert.equal(restored.schemaVersion, 25);
  assert.equal(wallBase(storeyOf(restored).walls[0]!), 0);
  assert.deepEqual(buildSolid(restored), buildSolid(p));
  old.storeys[0].walls[0].baseOffset = 2;
  assert.throws(() => deserializeProject(JSON.stringify(old)));
});
test("signed base offsets align material, windows, corners and project roundtrip", () => {
  for (const offset of [-1.2, 0, 0.7]) {
    const p = fixture(offset),
      s = buildSolid(p);
    assert.equal(s.min[2], offset);
    assert.equal(s.max[2], offset + 2.8);
    assert.equal(windowSelectionSurfaces(p, () => true)[0]!.vertices[0]![2], offset + 0.9);
    assert.ok(movementCorners(p).some((c) => c.point[2] === offset));
    assert.deepEqual(deserializeProject(serializeProject(p)), p);
    assert.ok(Math.abs(s.volume - buildSolid(fixture()).volume) < 1e-10);
  }
});
test("offset follows OG and KG storey levels while absolute datum remains annotation", () => {
  let p = fixture();
  p = setStoreyHeight(p, p, { projectId: p.id, storeyId: "eg", height: 3 });
  p = addStorey(p, p, { projectId: p.id, storeyId: "eg", side: "above", id: "og", height: 3.1 });
  p = addStorey(p, p, { projectId: p.id, storeyId: "eg", side: "below", id: "kg", height: 2.5 });
  for (const [id, z] of [
    ["og", 3],
    ["kg", -2.5],
  ] as const) {
    p = selectWorkingStorey(p, p, id);
    p = addWall(p, {
      id: id + "w",
      start: { x: 0, y: 0 },
      end: { x: 3, y: 0 },
      thickness: 0.36,
      height: 2.8,
      baseOffset: 0.4,
    });
    assert.equal(buildSolid(p).min[2], z + 0.4);
  }
  p = setStoreyHeight(p, p, { projectId: p.id, storeyId: "eg", height: 4 });
  p = selectWorkingStorey(p, p, "og");
  assert.equal(buildSolid(p).min[2], 4.4);
  const before = buildBuildingSolid(p);
  p = setGroundDatum(p, p, { projectId: p.id, storeyId: "eg", elevation: 100 });
  assert.deepEqual(buildBuildingSolid(p), before);
});
test("equal elevated corner keeps geometry; unequal foot heights reject and do not autojoin", () => {
  let p = fixture(0.5);
  p = addWall(p, {
    id: "b",
    start: { x: 3, y: 0 },
    end: { x: 3, y: 3 },
    thickness: 0.36,
    height: 2.8,
    baseOffset: 0.5,
  });
  assert.equal(storeyOf(p).wallJoins.length, 1);
  assert.equal(buildSolid(p).min[2], 0.5);
  assert.throws(() => updateWall(p, "b", { baseOffset: 0.6 }), /Fußhöhen/);
  const raw = structuredClone(p);
  storeyOf(raw).walls[1]!.baseOffset = 0.6;
  assert.throws(() => validateProject(raw), /Fußhöhen/);
  let free = fixture(0.5);
  free = addWall(free, {
    id: "b",
    start: { x: 3, y: 0 },
    end: { x: 3, y: 3 },
    thickness: 0.36,
    height: 2.8,
    baseOffset: 0.6,
  });
  assert.equal(storeyOf(free).wallJoins.length, 0);
  const action = prepareSelectionTranslation(p, ["w", "b"]),
    delta = { x: 1, y: 2 };
  const preview = selectionMoveSurfaces(buildBuildingSolid(p), p, action.evaluate(delta));
  assert.deepEqual(preview.faces, buildBuildingSolid(action.materialize(p, delta)).faces);
});
test("IFC wall placement carries signed offset once and opening stays relative to host", async () => {
  const p = fixture(-0.7),
    text = await exportIfc(p, new Date("2026-10-14T00:00:00Z"));
  const rows = new Map([...text.matchAll(/^(#\d+)=(.*);$/gm)].map((m) => [m[1]!, m[2]!]));
  const entity = (kind: string) => [...rows.values()].find((r) => r.startsWith(kind + "("))!;
  const placementZ = (ref: string): number => {
    const row = rows.get(ref)!;
    const refs = row.match(/#\d+/g)!;
    if (row.startsWith("IFCLOCALPLACEMENT")) return refs.reduce((sum, r) => sum + placementZ(r), 0);
    if (row.startsWith("IFCAXIS2PLACEMENT3D")) return placementZ(refs[0]!);
    if (row.startsWith("IFCCARTESIANPOINT"))
      return Number(row.match(/\(\((.*)\)\)/)![1]!.split(",")[2]);
    throw new Error(row);
  };
  const wallZ = placementZ(entity("IFCWALL").split(",")[5]!);
  const openingZ = placementZ(entity("IFCOPENINGELEMENT").split(",")[5]!);
  assert.equal(wallZ, -0.7);
  assert.ok(Math.abs(openingZ - 0.2) < 1e-10);
});

test("T connections require matching bases; equal signed offsets retain cut bodies", () => {
  let p = fixture(-0.5);
  p = addWall(p, {
    id: "b",
    start: { x: 1.5, y: -3 },
    end: { x: 1.5, y: 0 },
    thickness: 0.36,
    height: 2.8,
    baseOffset: -0.5,
  });
  const raw = structuredClone(p);
  storeyOf(raw).wallTJunctions = [{ hostWallId: "w", incoming: { wallId: "b", endpoint: 1 } }];
  const connected = validateProject(raw);
  assert.equal(buildSolid(connected).min[2], -0.5);
  storeyOf(raw).walls[1]!.baseOffset = 0;
  assert.throws(() => validateProject(raw), /Fußhöhen/);
});
test("prepared XY move ignores coincident join nodes at different heights", () => {
  let p = fixture();
  p = addWall(p, {
    id: "b",
    start: { x: 3, y: 0 },
    end: { x: 3, y: 3 },
    thickness: 0.36,
    height: 2.8,
  });
  p = addWall(p, {
    id: "c",
    start: { x: 4, y: 0 },
    end: { x: 6, y: 0 },
    thickness: 0.36,
    height: 2.8,
    baseOffset: 1,
  });
  const action = prepareSelectionTranslation(p, ["c"]),
    delta = { x: -1, y: 0 };
  const preview = selectionMoveSurfaces(buildBuildingSolid(p), p, action.evaluate(delta));
  assert.deepEqual(preview.faces, buildBuildingSolid(action.materialize(p, delta)).faces);
});
