import test from "node:test";
import assert from "node:assert/strict";
import { createRecoveryStatusTracker, type RecoveryStatus } from "./recovery-status.ts";
import { saveProjectRecovery, type RecoveryCatalog } from "./recovery-catalog.ts";
import { createExampleProject } from "../../components/cad/bim-view.ts";
import { ensureDocumentFolder } from "../views/documents.ts";
import { changeProjectScale, projectScaleContext } from "../views/project-scale.ts";
import { createEditingState, editingReducer } from "../direct-edit/controller.ts";
import type { Project } from "../../domain/project/schema.ts";

function fixture() {
  const records = new Map<string, string>();
  let failure = false;
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
        if (failure) throw new Error("quota");
        if ((records.get(id) ?? null) !== expected) throw new Error("conflict");
        records.set(id, next);
      },
    }),
  };
  const events: { status: RecoveryStatus; project: Project; context: unknown }[] = [];
  const tracker = createRecoveryStatusTracker(catalog, (status, project, context) =>
    events.push({ status, project, context }),
  );
  return {
    catalog,
    records,
    tracker,
    events,
    last: () => events.at(-1)!.status,
    fail: () => {
      failure = true;
    },
  };
}
const project = ensureDocumentFolder(createExampleProject());
const instant = new Date("2026-10-10T12:00:00Z");

test("missing snapshot, committed save and content-equal reload are distinguished", async () => {
  const f = fixture();
  f.tracker.update(project, "session");
  await f.tracker.refresh();
  assert.equal(f.last().kind, "missing");
  await saveProjectRecovery(project, f.catalog, instant);
  await f.tracker.refresh();
  assert.deepEqual(f.last(), { kind: "current", savedAt: instant.toISOString() });
  f.tracker.update(JSON.parse(JSON.stringify(project)), "new load");
  assert.equal(f.last().kind, "checking");
  await f.tracker.refresh();
  assert.equal(f.last().kind, "current");
});
test("edit, Undo and Redo compare content; changing the same committed reference does no work", async () => {
  const f = fixture();
  await saveProjectRecovery(project, f.catalog, instant);
  f.tracker.update(project, 0);
  await f.tracker.refresh();
  const modified = {
    ...project,
    storey: { ...project.storey, walls: project.storey.walls.map((w) => ({ ...w, height: 3 })) },
  };
  let editing = createEditingState(project);
  editing = editingReducer(editing, { type: "load-project", project: modified });
  f.tracker.update(editing.history.present, 0);
  assert.equal(f.last().kind, "changed");
  editing = editingReducer(editing, { type: "undo" });
  f.tracker.update(editing.history.present, 0);
  assert.equal(f.last().kind, "current");
  editing = editingReducer(editing, { type: "redo" });
  f.tracker.update(editing.history.present, 0);
  assert.equal(f.last().kind, "changed");
  const count = f.events.length;
  f.tracker.update(editing.history.present, 0);
  assert.equal(f.events.length, count);
});
test("persisted scale and layer visibility count, even though outside model Undo", async () => {
  const f = fixture();
  await saveProjectRecovery(project, f.catalog, instant);
  f.tracker.update(project, 0);
  await f.tracker.refresh();
  const scaled = changeProjectScale(project, projectScaleContext(project).view, 50);
  f.tracker.update(scaled, 0);
  assert.equal(f.last().kind, "changed");
  f.tracker.update({ ...project, bimVisibility: { hiddenLayerIds: [project.layers![0]!.id] } }, 0);
  assert.equal(f.last().kind, "changed");
  f.tracker.update(project, 0);
  assert.equal(f.last().kind, "current");
});
test("failed save cannot mark changed content as secured", async () => {
  const f = fixture();
  await saveProjectRecovery(project, f.catalog, instant);
  f.tracker.update(project, 0);
  await f.tracker.refresh();
  const changed = {
    ...project,
    storey: { ...project.storey, walls: project.storey.walls.map((w) => ({ ...w, height: 3 })) },
  };
  f.tracker.update(changed, 0);
  f.fail();
  await assert.rejects(saveProjectRecovery(changed, f.catalog), /quota/);
  assert.equal(f.last().kind, "changed");
  await f.tracker.refresh();
  assert.equal(f.last().kind, "changed");
});
test("separate project IDs and same-ID load contexts discard late reads", async () => {
  const f = fixture();
  await saveProjectRecovery(project, f.catalog, instant);
  const oldPort = f.catalog.project;
  let resolve!: (raw: string | null) => void;
  f.catalog.project = (id) => ({
    ...oldPort(id),
    read: () =>
      new Promise((r) => {
        resolve = r;
      }),
  });
  f.tracker.update(project, "first");
  const late = resolve;
  f.catalog.project = oldPort;
  const other = { ...project, id: "other" };
  f.tracker.update(other, "second");
  await f.tracker.refresh();
  late(f.records.get(project.id)!);
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(f.last().kind, "missing");
  assert.equal(f.events.at(-1)?.project.id, "other");
  f.catalog.project = (id) => ({
    ...oldPort(id),
    read: () =>
      new Promise((r) => {
        resolve = r;
      }),
  });
  f.tracker.update(project, "third");
  const sameIdLate = resolve;
  f.catalog.project = oldPort;
  f.tracker.update(
    {
      ...project,
      storey: { ...project.storey, walls: project.storey.walls.map((w) => ({ ...w, height: 3 })) },
    },
    "fourth",
  );
  await f.tracker.refresh();
  sameIdLate(f.records.get(project.id)!);
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(f.last().kind, "changed");
  assert.equal(f.events.at(-1)?.context, "fourth");
});
test("disposal suppresses late errors; unavailable storage never reports current", async () => {
  const f = fixture();
  let reject!: (error: Error) => void;
  const broken: RecoveryCatalog = {
    ...f.catalog,
    project: () => ({
      read: () =>
        new Promise((_r, fail) => {
          reject = fail;
        }),
      replace: async () => {},
    }),
  };
  const events: RecoveryStatus[] = [];
  const tracker = createRecoveryStatusTracker(broken, (s) => events.push(s));
  tracker.update(project, 0);
  tracker.dispose();
  reject(new Error("late"));
  await Promise.resolve();
  await Promise.resolve();
  assert.deepEqual(events, [{ kind: "checking" }]);
  f.catalog.project = () => ({
    read: async () => {
      throw new Error("blocked");
    },
    replace: async () => {},
  });
  f.tracker.update(project, 0);
  await f.tracker.refresh();
  assert.equal(f.last().kind, "unavailable");
});
test("external successful replacement invalidates current state on refresh", async () => {
  const f = fixture();
  await saveProjectRecovery(project, f.catalog, instant);
  f.tracker.update(project, 0);
  await f.tracker.refresh();
  await saveProjectRecovery(
    {
      ...project,
      storey: { ...project.storey, walls: project.storey.walls.map((w) => ({ ...w, height: 3 })) },
    },
    f.catalog,
  );
  await f.tracker.refresh();
  assert.equal(f.last().kind, "changed");
});

test("pending transaction and edits during its completion never publish a false current status", async () => {
  const f = fixture();
  await saveProjectRecovery(project, f.catalog, instant);
  f.tracker.update(project, 0);
  await f.tracker.refresh();
  const changed = {
    ...project,
    storey: { ...project.storey, walls: project.storey.walls.map((w) => ({ ...w, height: 3 })) },
  };
  const newer = {
    ...project,
    storey: { ...project.storey, walls: project.storey.walls.map((w) => ({ ...w, height: 4 })) },
  };
  f.tracker.update(changed, 0);
  const original = f.catalog.project;
  let finish!: () => void;
  const started = new Promise<void>((ready) => {
    f.catalog.project = (id) => ({
      ...original(id),
      replace: async (expected, next) => {
        await new Promise<void>((r) => {
          finish = r;
          ready();
        });
        await original(id).replace(expected, next);
      },
    });
  });
  const saving = saveProjectRecovery(changed, f.catalog, instant);
  await started;
  await f.tracker.refresh();
  assert.equal(f.last().kind, "changed");
  f.tracker.update(newer, 0);
  finish();
  await saving;
  await f.tracker.refresh();
  assert.equal(f.last().kind, "changed");
  f.tracker.update(changed, 0);
  assert.equal(f.last().kind, "current");
});
