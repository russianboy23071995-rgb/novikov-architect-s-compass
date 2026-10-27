import test from "node:test";
import assert from "node:assert/strict";
import { createExampleProject } from "../../components/cad/bim-view.ts";
import {
  commitProject,
  createHistory,
  redoProject,
  undoProject,
} from "../../application/history/project-history.ts";
import { schoolPlanFixture } from "../../../benchmarks/school-plan-fixture.ts";
import { updateWall } from "../../application/walls/actions.ts";
import { storeyOf } from "../../domain/storeys/access.ts";
import { validateProject } from "../../domain/project/schema.ts";
import { buildSolid } from "../../lib/bim/geometry.ts";
import { buildBuildingSolid, workingStoreySolid } from "./building-solid.ts";
import { getWallFootSources } from "./wall-foot-sources.ts";

// Wall foot sources reuse the storey part of the building scene (docs/performance/RECOVERY_STATUS.md).
test("the working storey solid equals the former derivation and shares the building part", () => {
  const owned = createHistory(createExampleProject()).present;
  const solid = workingStoreySolid(owned);
  assert.deepEqual(
    JSON.parse(JSON.stringify(solid)),
    JSON.parse(JSON.stringify(buildSolid(owned))),
  );
  // After the building scene, the working storey part is the very same object.
  buildBuildingSolid(owned);
  assert.equal(workingStoreySolid(owned), workingStoreySolid(owned));
  assert.ok(buildBuildingSolid(owned).faces.includes(workingStoreySolid(owned).faces[0]!));
  // A mutable copy derives the same geometry without sharing.
  const copy = structuredClone(owned);
  assert.notEqual(workingStoreySolid(copy), workingStoreySolid(owned));
  assert.deepEqual(
    JSON.parse(JSON.stringify(workingStoreySolid(copy))),
    JSON.parse(JSON.stringify(solid)),
  );
  // Foot sources keep their content.
  assert.equal(getWallFootSources(owned).sourceCount, getWallFootSources(copy).sourceCount);
});

// Undo and redo reuse the storey part and wall foot sources of earlier versions (user decision
// 27.10.2026, docs/performance/UNDO_STOREY_REUSE.md).
const allFootFeatures = (index: ReturnType<typeof getWallFootSources>) => {
  const b = index.bounds!;
  return index
    .queryPrimitives(
      { x: (b.minX + b.maxX) / 2, y: (b.minY + b.maxY) / 2 },
      1,
      Math.hypot(b.maxX - b.minX, b.maxY - b.minY),
    )
    .references.map((r) => r.feature);
};
test("undo and redo find the storey part and foot sources again, equal to a fresh build", () => {
  let history = createHistory(schoolPlanFixture());
  const before = history.present;
  const part = workingStoreySolid(before);
  const foot = getWallFootSources(before);
  const wall = storeyOf(before).walls[3]!;
  history = commitProject(
    history,
    updateWall(before, wall.id, { end: { x: wall.end.x + 0.4, y: wall.end.y } }),
  );
  const edited = history.present;
  const editedPart = workingStoreySolid(edited);
  const editedFoot = getWallFootSources(edited);
  // Counter-check: the edit is a new storey version with new parts and changed sources.
  assert.notEqual(editedPart, part);
  assert.notEqual(editedFoot, foot);
  assert.notDeepEqual(allFootFeatures(editedFoot), allFootFeatures(foot));
  const undone = undoProject(history);
  assert.equal(workingStoreySolid(undone.present), part);
  assert.equal(getWallFootSources(undone.present), foot);
  const redone = redoProject(undone);
  assert.equal(workingStoreySolid(redone.present), editedPart);
  assert.equal(getWallFootSources(redone.present), editedFoot);
  // Reused results equal a fresh derivation from a mutable copy (no reuse on that path).
  for (const project of [undone.present, redone.present]) {
    const copy = validateProject(project);
    assert.deepEqual(
      JSON.stringify(buildBuildingSolid(project).faces),
      JSON.stringify(buildBuildingSolid(copy).faces),
    );
    assert.deepEqual(
      allFootFeatures(getWallFootSources(project)),
      allFootFeatures(getWallFootSources(copy)),
    );
  }
});

test("only a few versions per storey are kept (bounded)", () => {
  let history = createHistory(schoolPlanFixture());
  const first = workingStoreySolid(history.present);
  for (let i = 0; i < 5; i++) {
    const wall = storeyOf(history.present).walls[3]!;
    history = commitProject(
      history,
      updateWall(history.present, wall.id, { end: { x: wall.end.x + 0.1, y: wall.end.y } }),
    );
    workingStoreySolid(history.present);
  }
  let back = history;
  for (let i = 0; i < 5; i++) back = undoProject(back);
  // Five edits later the oldest version has left the cache and is rebuilt with equal faces.
  const rebuilt = workingStoreySolid(back.present);
  assert.notEqual(rebuilt, first);
  assert.equal(JSON.stringify(rebuilt.faces), JSON.stringify(first.faces));
});
