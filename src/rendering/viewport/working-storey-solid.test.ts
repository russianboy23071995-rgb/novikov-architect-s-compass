import test from "node:test";
import assert from "node:assert/strict";
import { createExampleProject } from "../../components/cad/bim-view.ts";
import { createHistory } from "../../application/history/project-history.ts";
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
