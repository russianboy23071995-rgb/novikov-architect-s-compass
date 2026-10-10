import { createEditingState, editingReducer } from "../direct-edit/controller.ts";
import test from "node:test";
import assert from "node:assert/strict";
import {
  createAutosaveController,
  AUTOSAVE_DELAY_MS,
  type AutosaveState,
  type RecoveryTimer,
} from "./autosave.ts";
import { type RecoveryCatalog, readProjectRecovery } from "./recovery-catalog.ts";
import { createExampleProject } from "../../components/cad/bim-view.ts";
import { ensureDocumentFolder } from "../views/documents.ts";
import { changeProjectScale, projectScaleContext } from "../views/project-scale.ts";
const project = ensureDocumentFolder(createExampleProject());
const changed = (height: number) => ({
  ...project,
  storey: { ...project.storey, walls: project.storey.walls.map((w) => ({ ...w, height })) },
});
async function flush() {
  for (let i = 0; i < 80; i++) await Promise.resolve();
}
function clock() {
  const jobs = new Set<() => void>();
  const port: RecoveryTimer = {
    schedule(callback, delay) {
      assert.equal(delay, AUTOSAVE_DELAY_MS);
      jobs.add(callback);
      return () => {
        jobs.delete(callback);
      };
    },
  };
  return {
    port,
    jobs,
    async fire() {
      const work = [...jobs];
      jobs.clear();
      work.forEach((f) => f());
      await flush();
    },
  };
}
function memory() {
  const records = new Map<string, string>();
  let writes = 0;
  let fail = false;
  const catalog: RecoveryCatalog = {
    legacy: {
      read: async () => null,
      replace: async () => {
        throw new Error("unused");
      },
    },
    list: async () => [],
    project: (id) => ({
      read: async () => records.get(id) ?? null,
      replace: async (expected, next) => {
        if (fail) throw new Error("QuotaExceededError");
        if ((records.get(id) ?? null) !== expected) throw new Error("another writer");
        records.set(id, next);
        writes++;
      },
    }),
  };
  return {
    catalog,
    records,
    writes: () => writes,
    fail() {
      fail = true;
    },
  };
}
function setup(store = memory()) {
  const timer = clock();
  const states: AutosaveState[] = [];
  const controller = createAutosaveController(store.catalog, (s) => states.push(s), timer.port);
  controller.update(project, 0);
  return { ...store, timer, states, controller, last: () => states.at(-1)! };
}

test("off by default; activation and coalesced edits write only the latest committed state", async () => {
  const f = setup();
  f.controller.update(changed(3), 0);
  await f.timer.fire();
  assert.equal(f.writes(), 0);
  f.controller.setEnabled(true);
  await flush();
  f.controller.update(changed(4), 0);
  f.controller.update(changed(5), 0);
  assert.equal(f.timer.jobs.size, 1);
  await f.timer.fire();
  assert.equal(f.writes(), 1);
  assert.equal(
    (await readProjectRecovery(f.catalog, project.id))?.project.storey.walls[0]?.height,
    5,
  );
  assert.equal(f.timer.jobs.size, 0);
});
test("same committed reference is ignored; undo to secured content does not churn the predecessor", async () => {
  const f = setup();
  f.controller.setEnabled(true);
  await f.timer.fire();
  assert.equal(f.writes(), 1);
  f.controller.update(project, 0);
  assert.equal(f.timer.jobs.size, 0);
  f.controller.update(changed(3), 0);
  f.controller.update(project, 0);
  await f.timer.fire();
  assert.equal(f.writes(), 1);
  f.controller.update(changed(3), 0);
  await f.timer.fire();
  assert.equal(f.writes(), 2);
});
test("stored view scale is autosaved although outside model Undo", async () => {
  const f = setup();
  f.controller.setEnabled(true);
  await f.timer.fire();
  f.controller.update(changeProjectScale(project, projectScaleContext(project).view, 50), 0);
  await f.timer.fire();
  assert.equal(
    (await readProjectRecovery(f.catalog, project.id))?.project.workingViews?.[0]?.denominator,
    50,
  );
});
test("off, project switch, same-ID load and disposal cancel pending work", async () => {
  for (const stop of ["off", "project", "reload", "dispose"]) {
    const f = setup();
    f.controller.setEnabled(true);
    await flush();
    if (stop === "off") f.controller.setEnabled(false);
    else if (stop === "project") f.controller.update({ ...project, id: "B" }, 1);
    else if (stop === "reload") f.controller.update(project, 1);
    else f.controller.dispose();
    await f.timer.fire();
    assert.equal(f.writes(), 0, stop);
    assert.equal(f.timer.jobs.size, 0);
  }
});
test("quota pauses automatic retries; later model edits do not retry indefinitely", async () => {
  const f = setup();
  await f.controller.saveNow();
  const raw = f.records.get(project.id);
  f.fail();
  f.controller.setEnabled(true);
  f.controller.update(changed(3), 0);
  await f.timer.fire();
  assert.match(f.last().error!, /Quota/);
  assert.equal(f.last().enabled, true);
  assert.equal(f.records.get(project.id), raw);
  f.controller.update(changed(4), 0);
  await f.timer.fire();
  assert.equal(f.writes(), 1);
  assert.equal(f.timer.jobs.size, 0);
});
test("two activated sessions retain their revisions: losing writer pauses instead of overwriting", async () => {
  const store = memory(),
    a = setup(store),
    b = setup(store);
  a.controller.setEnabled(true);
  b.controller.setEnabled(true);
  await flush();
  a.controller.update(changed(3), 0);
  b.controller.update(changed(4), 0);
  await a.timer.fire();
  await b.timer.fire();
  assert.equal(store.writes(), 1);
  assert.match(b.last().error!, /another writer/);
  assert.equal(
    (await readProjectRecovery(store.catalog, project.id))?.project.storey.walls[0]?.height,
    3,
  );
  b.controller.update(changed(5), 0);
  await b.timer.fire();
  assert.equal(store.writes(), 1);
});
test("manual and automatic writes serialize; edits during a write schedule one successor", async () => {
  const f = setup();
  const original = f.catalog.project;
  let release!: () => void;
  const entered = new Promise<void>((ready) => {
    f.catalog.project = (id) => ({
      ...original(id),
      replace: async (expected, next) => {
        await new Promise<void>((resolve) => {
          release = resolve;
          ready();
        });
        await original(id).replace(expected, next);
      },
    });
  });
  f.controller.setEnabled(true);
  void f.timer.fire();
  await entered;
  assert.equal(f.last().busy, true);
  await assert.rejects(f.controller.saveNow(), /bereits/);
  f.controller.update(changed(3), 0);
  f.controller.update(changed(4), 0);
  assert.equal(f.timer.jobs.size, 0);
  release();
  await flush();
  assert.equal(f.writes(), 1);
  assert.equal(f.timer.jobs.size, 1);
  // The same lease retains its adapter; release the second transaction separately.
  void f.timer.fire();
  await flush();
  release();
  await flush();
  assert.equal(f.writes(), 2);
  assert.equal(
    (await readProjectRecovery(f.catalog, project.id))?.project.storey.walls[0]?.height,
    4,
  );
});
test("a begun transaction stays bound to its old project; switching never writes the new one", async () => {
  const f = setup();
  const original = f.catalog.project;
  let release!: () => void;
  const entered = new Promise<void>((ready) => {
    f.catalog.project = (id) => ({
      ...original(id),
      replace: async (expected, next) => {
        await new Promise<void>((resolve) => {
          release = resolve;
          ready();
        });
        await original(id).replace(expected, next);
      },
    });
  });
  f.controller.setEnabled(true);
  void f.timer.fire();
  await entered;
  f.controller.update({ ...project, id: "B" }, 1);
  release();
  await flush();
  assert.equal(f.records.has(project.id), true);
  assert.equal(f.records.has("B"), false);
  assert.equal(f.last().enabled, false);
  assert.equal(f.timer.jobs.size, 0);
});
test("late preparation is cancelled before publication after disabling", async () => {
  const f = setup();
  const original = f.catalog.project;
  let release!: (value: string | null) => void;
  f.catalog.project = (id) => ({
    ...original(id),
    read: () =>
      new Promise((r) => {
        release = r;
      }),
  });
  f.controller.setEnabled(true);
  await flush();
  void f.timer.fire();
  await flush();
  f.controller.setEnabled(false);
  release(null);
  await flush();
  assert.equal(f.writes(), 0);
  assert.equal(f.last().error, null);
});

test("real reducer keeps the load context stable through commits and Undo/Redo", async () => {
  const f = setup();
  let editing = editingReducer(createEditingState(project), { type: "load-project", project });
  const token = editing.projectLoad;
  f.controller.update(editing.history.present, token);
  f.controller.setEnabled(true);
  await f.timer.fire();
  for (const event of [
    { type: "project", project: changed(3) },
    { type: "undo" },
    { type: "redo" },
    { type: "cancel" },
  ] as const) {
    editing = editingReducer(editing, event);
    assert.equal(editing.projectLoad, token);
    f.controller.update(editing.history.present, editing.projectLoad);
    assert.equal(f.last().enabled, true);
  }
  await f.timer.fire();
  assert.equal(
    (await readProjectRecovery(f.catalog, project.id))?.project.storey.walls[0]?.height,
    3,
  );
  editing = editingReducer(editing, { type: "load-project", project });
  assert.notEqual(editing.projectLoad, token);
  f.controller.update(editing.history.present, editing.projectLoad);
  assert.equal(f.last().enabled, false);
});
