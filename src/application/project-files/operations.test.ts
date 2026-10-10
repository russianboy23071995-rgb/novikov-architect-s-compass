import assert from "node:assert/strict";
import test from "node:test";
import { prepareProjectOpen, requestProjectDownload } from "./operations.ts";
import { createExampleProject } from "../../components/cad/bim-view.ts";
import { serializeProject } from "../../lib/bim/model.ts";
import { PROJECT_FILE_LIMIT } from "../../interop/project-file/size.ts";
import { createEditingState, editingReducer } from "../direct-edit/controller.ts";

const file = (text: string) => ({
  name: "test.json",
  size: new TextEncoder().encode(text).length,
  text: async () => text,
});

test("download reports initiation only and leaves the snapshot unchanged", () => {
  const project = createExampleProject();
  const before = serializeProject(project);
  let received = "";
  assert.deepEqual(
    requestProjectDownload(project, (text, name) => {
      received = text;
      assert.equal(name, "novikov-project.json");
    }),
    { status: "download-requested" },
  );
  assert.equal(received, before);
  assert.equal(serializeProject(project), before);
});

test("download adapter failure cannot produce a success result or alter history", () => {
  const state = createEditingState(createExampleProject());
  const history = state.history;
  assert.throws(
    () =>
      requestProjectDownload(history.present, () => {
        throw new Error("blocked");
      }),
    /blocked/,
  );
  assert.equal(state.history, history);
});

test("oversized file is rejected before reading; actual UTF-8 content is checked too", async () => {
  let reads = 0;
  await assert.rejects(
    prepareProjectOpen({
      name: "large.json",
      size: PROJECT_FILE_LIMIT + 1,
      text: async () => {
        reads++;
        return "";
      },
    }),
    /10 MB/,
  );
  assert.equal(reads, 0);
  await assert.rejects(
    prepareProjectOpen({
      name: "large.json",
      size: 1,
      text: async () => "ä".repeat(PROJECT_FILE_LIMIT / 2 + 1),
    }),
    /10 MB/,
  );
});

test("corrupt JSON, invalid model and read failure preserve the current state", async () => {
  const state = createEditingState(createExampleProject());
  const before = JSON.stringify(state);
  await assert.rejects(prepareProjectOpen(file("{broken")), /Ungültige Projektdatei/);
  await assert.rejects(
    prepareProjectOpen(file(JSON.stringify({ schemaVersion: 20 }))),
    /Ungültige Projektdatei/,
  );
  await assert.rejects(
    prepareProjectOpen({
      name: "missing.json",
      size: 1,
      text: async () => {
        throw new Error("read failed");
      },
    }),
    /read failed/,
  );
  assert.equal(JSON.stringify(state), before);
});

test("preparing then cancelling a valid open leaves project and undo/redo untouched", async () => {
  const state = createEditingState(createExampleProject());
  const history = state.history;
  const candidate = await prepareProjectOpen(file(serializeProject(history.present)));
  assert.ok(candidate.project.documentFolders?.length);
  assert.equal(state.history, history);
  assert.equal(state.projectLoad, undefined);
});

test("rejected load preserves model and both palette histories, without success acknowledgement", () => {
  const state = {
    ...createEditingState(createExampleProject()),
    visibilityHistory: { past: [[]], future: [] },
    documentVisibilityHistories: { doc: { past: [[]], future: [] } },
  };
  const next = editingReducer(state, {
    type: "load-project",
    project: {
      ...state.history.present,
      schemaVersion: -1,
    } as unknown as typeof state.history.present,
  });
  assert.ok(next.error);
  assert.equal(next.history, state.history);
  assert.equal(next.visibilityHistory, state.visibilityHistory);
  assert.equal(next.documentVisibilityHistories, state.documentVisibilityHistories);
  assert.deepEqual(next.projectLoad, { accepted: false });
});

test("confirmed open is acknowledged only after validation and can be undone", async () => {
  const state = createEditingState(createExampleProject());
  const candidate = await prepareProjectOpen(
    file(serializeProject({ ...state.history.present, id: "loaded-project" })),
  );
  const loaded = editingReducer(state, { type: "load-project", project: candidate.project });
  assert.equal(loaded.error, "");
  assert.deepEqual(loaded.projectLoad, { accepted: true });
  assert.equal(loaded.history.present.id, "loaded-project");
  assert.equal(
    editingReducer(loaded, { type: "undo" }).history.present.id,
    state.history.present.id,
  );
});
