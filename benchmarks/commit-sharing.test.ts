import test from "node:test";
import assert from "node:assert/strict";
import { schoolFixture } from "./school-fixture.ts";
import { operations, scriptedRun } from "./commit-sharing.ts";
import { serializeProject } from "../src/lib/bim/model.ts";
import {
  commitProject,
  readProjectFile,
  undoProject,
  redoProject,
} from "../src/lib/bim/history.ts";
import { isOwnedProjectSnapshot } from "../src/domain/project/owned-snapshot.ts";
import { exportIfc } from "../src/lib/bim/ifc.ts";

for (const size of [100, 1000])
  test(`shared commit equals the legacy full path on a ${size}-element 5-storey school`, async () => {
    const base = schoolFixture(size);
    const legacy = scriptedRun("legacy", base),
      current = scriptedRun("current", base);
    assert.deepEqual(current.steps, legacy.steps);
    // Unchanged storeys keep the identity of the owned state before the commit.
    const h = commitProject(current.history, operations.wallReshape(current.history.present, 7));
    const before = current.history.present;
    assert.ok(isOwnedProjectSnapshot(before));
    h.present.storeys.forEach((s, i) =>
      s.id === h.present.workingStoreyId
        ? assert.notEqual(s, before.storeys[i])
        : assert.equal(s, before.storeys[i]),
    );
    assert.equal(undoProject(h).present, before);
    assert.equal(redoProject(undoProject(h)).present, h.present);
    assert.deepEqual(readProjectFile(serializeProject(h.present)), h.present);
    const at = new Date("2026-10-24T12:00:00Z");
    assert.equal(
      await exportIfc(current.history.present, at),
      await exportIfc(legacy.history.present, at),
    );
  });
