import { PROJECT_SCHEMA_VERSION } from "../../project/format.ts";
import test from "node:test";
import assert from "node:assert/strict";
import { wallBase, wallHeights } from "./heights.ts";
import { serializeProject, deserializeProject } from "../../../lib/bim/model.ts";
import { createProject } from "../../../application/projects/create.ts";
import { addWindow } from "../../../application/windows/actions.ts";
import { addWall, updateWall } from "../../../application/walls/actions.ts";
import { validateProject } from "../../project/schema.ts";
import { buildBuildingSolid } from "../../../rendering/viewport/building-solid.ts";
import { buildSolid } from "../../../rendering/viewport/storey-solid.ts";
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
  assert.equal(restored.schemaVersion, PROJECT_SCHEMA_VERSION);
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

import { DEFAULT_RAW_SLAB_THICKNESS, resolveWallHeightRule } from "./heights.ts";

test("underside binding subtracts slab thickness, includes both offsets and follows storeys", () => {
  const rule = { kind: "slab-underside", topOffset: -0.1 } as const;
  for (const floor of [-3, 0, 3]) {
    const result = resolveWallHeightRule({ baseOffset: 0.1 }, floor, rule, {
      topElevation: floor + 3,
      thickness: DEFAULT_RAW_SLAB_THICKNESS,
    });
    assert.ok(Math.abs(result.height - 2.6) < 1e-12);
    assert.ok(Math.abs(result.top - (floor + 2.7)) < 1e-12);
  }
  const taller = resolveWallHeightRule(
    {},
    0,
    { kind: "slab-underside", topOffset: 0 },
    {
      topElevation: 4,
      thickness: 0.3,
    },
  );
  assert.equal(taller.height, 3.7);
});

test("fixed rule preserves legacy height regardless of upper slab", () => {
  assert.deepEqual(resolveWallHeightRule({ baseOffset: 0.5 }, 3, { kind: "fixed", height: 2.8 }), {
    bottom: 3.5,
    top: 6.3,
    height: 2.8,
  });
});

test("underside rule rejects missing, invalid or collapsed references instead of guessing", () => {
  const rule = { kind: "slab-underside", topOffset: 0 } as const;
  assert.throws(() => resolveWallHeightRule({}, 0, rule));
  for (const thickness of [0, -0.2, NaN, Infinity])
    assert.throws(() => resolveWallHeightRule({}, 0, rule, { topElevation: 3, thickness }));
  for (const topElevation of [0.2, -1, NaN, Infinity, Number.MAX_VALUE])
    assert.throws(() => resolveWallHeightRule({}, 0, rule, { topElevation, thickness: 0.2 }));
  for (const topOffset of [NaN, Infinity, -3])
    assert.throws(() =>
      resolveWallHeightRule(
        {},
        0,
        { ...rule, topOffset },
        {
          topElevation: 3,
          thickness: 0.2,
        },
      ),
    );
});

import { setWallHeightRule } from "../../../application/walls/height-binding.ts";
import {
  createHistory,
  commitProject,
  undoProject,
  redoProject,
} from "../../../application/history/project-history.ts";
import { prepareZTranslation } from "../../../application/selection/z-translation.ts";
import {
  createAssetPreparation,
  restoreCheckedSnapshot,
} from "../../../interop/project-file/recovery-codec.ts";
function heightFixture() {
  let p = fixture();
  p = setStoreyHeight(p, p, { projectId: "p", storeyId: "eg", height: 3 });
  return addStorey(p, p, { projectId: "p", storeyId: "eg", side: "above", id: "og", height: 3 });
}
function bind(p: ReturnType<typeof heightFixture>) {
  return setWallHeightRule(p, p, {
    projectId: "p",
    storeyId: "eg",
    wallIds: ["w"],
    rule: { kind: "slab-underside", storeyId: "og", topOffset: 0 },
  });
}
test("bound heights follow storeys atomically, serialize only source rule, undo and IFC agree", async () => {
  const p = bind(heightFixture());
  assert.equal(p.storeys[0]!.walls[0]!.height, 2.8);
  const changed = setStoreyHeight(p, p, { projectId: "p", storeyId: "eg", height: 4 });
  assert.equal(changed.storeys[0]!.walls[0]!.height, 3.8);
  assert.equal(buildBuildingSolid(changed).max[2], 3.8);
  assert.match(await exportIfc(changed), /'Height',\$,IFCLENGTHMEASURE\(3\.8\)/);
  const raw = JSON.parse(serializeProject(changed));
  assert.equal(raw.schemaVersion, PROJECT_SCHEMA_VERSION);
  assert.equal(raw.storeys[0].walls[0].height, undefined);
  assert.deepEqual(deserializeProject(JSON.stringify(raw)), changed);
  const h = commitProject(createHistory(p), changed);
  assert.equal(h.past.length, 1);
  assert.deepEqual(undoProject(h).present, p);
  assert.deepEqual(redoProject(undoProject(h)).present, changed);
  const before = serializeProject(changed);
  assert.throws(
    () => setStoreyHeight(changed, changed, { projectId: "p", storeyId: "eg", height: 2 }),
    /window|height/i,
  );
  assert.equal(serializeProject(changed), before);
});
test("V25 remains fixed; bound rule cannot be smuggled into old format; stale height is never authoritative", () => {
  const p = heightFixture();
  const raw = JSON.parse(serializeProject(p));
  raw.schemaVersion = 25;
  const restored = deserializeProject(JSON.stringify(raw));
  const taller = setStoreyHeight(restored, restored, { projectId: "p", storeyId: "eg", height: 4 });
  assert.equal(taller.storeys[0]!.walls[0]!.height, 2.8);
  raw.storeys[0].walls[0].topBinding = bind(p).storeys[0]!.walls[0]!.topBinding;
  assert.throws(() => deserializeProject(JSON.stringify(raw)));
  raw.schemaVersion = 26;
  raw.storeys[0].walls[0].height = 90;
  assert.equal(deserializeProject(JSON.stringify(raw)).storeys[0]!.walls[0]!.height, 2.8);
  const bound = bind(p);
  assert.throws(() => updateWall(bound, "w", { height: 4 }), /Höhenaktion/);
  const fixed = setWallHeightRule(bound, bound, {
    projectId: "p",
    storeyId: "eg",
    wallIds: ["w"],
    rule: { kind: "fixed", height: 2.7 },
  });
  assert.equal(fixed.storeys[0]!.walls[0]!.topBinding, undefined);
  assert.equal(fixed.storeys[0]!.walls[0]!.height, 2.7);
});
test("binding validates explicit context, upper target and insertion without silently rebinding", () => {
  const p = bind(heightFixture());
  assert.throws(() => bind(fixture()), /Rohdeckenbezug/);
  assert.throws(
    () => addStorey(p, p, { projectId: "p", storeyId: "eg", side: "above", id: "mid", height: 3 }),
    /Bindung/,
  );
  assert.throws(
    () =>
      setWallHeightRule(p, heightFixture(), {
        projectId: "p",
        storeyId: "eg",
        wallIds: ["w"],
        rule: { kind: "fixed", height: 3 },
      }),
    /kontext/i,
  );
  assert.throws(
    () =>
      setWallHeightRule(p, p, {
        projectId: "p",
        storeyId: "eg",
        wallIds: ["missing"],
        rule: { kind: "fixed", height: 3 },
      }),
    /Wandauswahl/,
  );
});
test("bound recovery and rigid Z preview preserve rule and full-path geometry", async () => {
  const p = bind(heightFixture());
  const codec = createAssetPreparation({ maxBytes: 1024, maxPixels: 1024 });
  const doc = await codec.prepare(p);
  assert.equal("height" in doc.model.storeys[0]!.walls[0]!, false);
  assert.deepEqual(await restoreCheckedSnapshot(doc), p);
  const targets = [{ kind: "wall", id: "w" }] as const;
  const action = prepareZTranslation(p, targets);
  const preview = action.evaluate(p, targets, 0.5);
  const moved = action.materialize(p, targets, 0.5);
  assert.equal(moved.storeys[0]!.walls[0]!.topBinding!.topOffset, 0.5);
  assert.equal(moved.storeys[0]!.walls[0]!.height, 2.8);
  assert.deepEqual(storeyOf(preview.geometry).walls, moved.storeys[0]!.walls);
});

test("connected bound walls resize together; mixed heights keep their join as a butt corner", () => {
  let p = heightFixture();
  p = addWall(p, {
    id: "b",
    start: { x: 3, y: 0 },
    end: { x: 3, y: 3 },
    thickness: 0.36,
    height: 2.8,
  });
  assert.equal(storeyOf(p).wallJoins.length, 1);
  const mixed = bind(p);
  // Mixed heights at a corner are a butt joint since 26.10.2026 (docs/WALL_JUNCTIONS.md).
  assert.doesNotThrow(() =>
    setStoreyHeight(mixed, mixed, { projectId: "p", storeyId: "eg", height: 4 }),
  );
  assert.equal(storeyOf(mixed).walls[0]!.height, 2.8);
  const bound = setWallHeightRule(p, p, {
    projectId: "p",
    storeyId: "eg",
    wallIds: ["w", "b"],
    rule: { kind: "slab-underside", storeyId: "og", topOffset: 0 },
  });
  const taller = setStoreyHeight(bound, bound, { projectId: "p", storeyId: "eg", height: 4 });
  assert.equal(storeyOf(taller).wallJoins.length, 1);
  assert.ok(storeyOf(taller).walls.every((w) => w.height === 3.8));
  assert.equal(buildBuildingSolid(taller).max[2], 3.8);
  const datum = setGroundDatum(taller, taller, { projectId: "p", storeyId: "eg", elevation: 150 });
  assert.deepEqual(buildBuildingSolid(datum), buildBuildingSolid(taller));
  const targets = [
    { kind: "wall", id: "w" },
    { kind: "wall", id: "b" },
  ] as const;
  const action = prepareZTranslation(taller, targets);
  for (const delta of [-0.7, 0.5, 3.2]) {
    const preview = action.evaluate(taller, targets, delta);
    const result = action.materialize(taller, targets, delta);
    assert.deepEqual(storeyOf(preview.geometry).walls, storeyOf(result).walls);
  }
});

test("bound T junctions and prepared XY movement agree with committed geometry", () => {
  let p = heightFixture();
  p = addWall(p, {
    id: "b",
    start: { x: 1.5, y: -3 },
    end: { x: 1.5, y: 0 },
    thickness: 0.36,
    height: 2.8,
  });
  const raw = structuredClone(p);
  storeyOf(raw).wallTJunctions = [{ hostWallId: "w", incoming: { wallId: "b", endpoint: 1 } }];
  p = validateProject(raw);
  p = setWallHeightRule(p, p, {
    projectId: "p",
    storeyId: "eg",
    wallIds: ["w", "b"],
    rule: { kind: "slab-underside", storeyId: "og", topOffset: 0 },
  });
  p = setStoreyHeight(p, p, { projectId: "p", storeyId: "eg", height: 3.5 });
  const action = prepareSelectionTranslation(p, ["w", "b"]);
  const delta = { x: 2, y: -1 };
  assert.deepEqual(
    selectionMoveSurfaces(buildBuildingSolid(p), p, action.evaluate(delta)).faces,
    buildBuildingSolid(action.materialize(p, delta)).faces,
  );
  const z = prepareZTranslation(p, [
    { kind: "wall", id: "w" },
    { kind: "wall", id: "b" },
  ]);
  assert.deepEqual(
    selectionMoveSurfaces(
      buildBuildingSolid(p),
      p,
      z.evaluate(
        p,
        [
          { kind: "wall", id: "w" },
          { kind: "wall", id: "b" },
        ],
        0.5,
      ),
    ).faces,
    buildBuildingSolid(
      z.materialize(
        p,
        [
          { kind: "wall", id: "w" },
          { kind: "wall", id: "b" },
        ],
        0.5,
      ),
    ).faces,
  );
});

test("bound snapshots retain canonical content order through validation, file and recovery", async () => {
  const p = bind(heightFixture());
  assert.equal(JSON.stringify(validateProject(p)), JSON.stringify(p));
  assert.equal(JSON.stringify(deserializeProject(serializeProject(p))), JSON.stringify(p));
  const codec = createAssetPreparation({ maxBytes: 1024, maxPixels: 1024 });
  assert.equal(
    JSON.stringify(await restoreCheckedSnapshot(await codec.prepare(p))),
    JSON.stringify(p),
  );
  const history = createHistory(p);
  assert.equal(commitProject(history, deserializeProject(serializeProject(p))), history);
});
