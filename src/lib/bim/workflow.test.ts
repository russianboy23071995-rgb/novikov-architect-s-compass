import test from "node:test";
import assert from "node:assert/strict";
import {
  createProject,
  addWall,
  addWindow,
  updateWall,
  serializeProject,
  wallLength,
} from "./model.ts";
import {
  createHistory,
  commitProject,
  undoProject,
  redoProject,
  readProjectFile,
} from "./history.ts";
import { exportIfc } from "./ifc.ts";

test("complete wall-window workflow retains dimensions, host and IDs through undo, file reload and IFC", async () => {
  let history = createHistory(createProject("workflow", "ground"));
  history = commitProject(
    history,
    addWall(history.present, {
      id: "wall",
      start: { x: 2, y: 3 },
      end: { x: 5, y: 3 },
      thickness: 0.36,
      height: 2.8,
    }),
  );
  history = commitProject(
    history,
    addWindow(history.present, {
      id: "window",
      wallId: "wall",
      width: 1.2,
      height: 1.35,
      sillHeight: 0.9,
      position: 0.5,
    }),
  );
  const before = serializeProject(history.present);
  assert.throws(() => updateWall(history.present, "wall", { end: { x: 2.5, y: 3 } }));
  assert.equal(serializeProject(history.present), before);
  history = commitProject(history, updateWall(history.present, "wall", { end: { x: 8, y: 3 } }));
  assert.equal(wallLength(history.present.storey.walls[0]!), 6);
  history = undoProject(history);
  assert.equal(serializeProject(history.present), before);
  history = redoProject(history);
  const saved = serializeProject(history.present);
  const restored = readProjectFile(saved);
  assert.deepEqual(restored, history.present);
  assert.equal(restored.storey.windows[0]!.position, 0.5);
  assert.equal(restored.storey.windows[0]!.wallId, "wall");
  const date = new Date("2026-10-01T12:00:00Z");
  const ifc = await exportIfc(restored, date);
  assert.equal(ifc, await exportIfc(history.present, date));
  for (const entity of [
    "IFCWALL",
    "IFCWINDOW",
    "IFCOPENINGELEMENT",
    "IFCRELVOIDSELEMENT",
    "IFCRELFILLSELEMENT",
  ])
    assert.equal(ifc.split("\n").filter((row) => row.includes(`=${entity}(`)).length, 1);
  assert.ok(ifc.includes("IFCLENGTHMEASURE(6.)"));
  assert.ok(ifc.includes("IFCRATIOMEASURE(0.5)"));
});
