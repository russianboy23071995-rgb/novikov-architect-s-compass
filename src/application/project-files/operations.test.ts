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
    /128 MiB/,
  );
  assert.equal(reads, 0);
  await assert.rejects(
    prepareProjectOpen({
      name: "large.json",
      size: 1,
      text: async () => "ä".repeat(PROJECT_FILE_LIMIT / 2 + 1),
    }),
    /128 MiB/,
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

test("24 MiB multi-asset project supports commit, file roundtrip, undo and recovery", async () => {
  const { createImageAssetHandle } = await import("../../domain/elements/reference/model.ts");
  const { createHistory, commitProject, undoProject, redoProject } =
    await import("../../lib/bim/history.ts");
  const { saveRecovery, readRecovery } = await import("./recovery.ts");
  const { ensureDocumentFolder } = await import("../views/documents.ts");
  const original = ensureDocumentFolder(createExampleProject());
  const project = {
    ...original,
    assets: Array.from({ length: 3 }, (_, i) =>
      createImageAssetHandle({
        id: `large-${i}`,
        mimeType: "image/png",
        pixelWidth: 1,
        pixelHeight: 1,
        data: (i === 0 ? "AAAA" : i === 1 ? "BBBB" : "CCCC").repeat(2 * 1024 * 1024),
      }),
    ),
  };
  // Storage-boundary fixture, not a browser-decoding/real-image benchmark.
  const history = commitProject(createHistory(original), project);
  const raw = serializeProject(history.present);
  assert.ok(Buffer.byteLength(raw) > 24 * 1024 * 1024);
  assert.equal(serializeProject(redoProject(undoProject(history)).present), raw);
  assert.equal(serializeProject((await prepareProjectOpen(file(raw))).project), raw);
  let downloaded = "";
  requestProjectDownload(history.present, (text) => {
    downloaded = text;
  });
  assert.equal(downloaded, raw);
  let record: string | null = null;
  const storage = {
    read: async () => record,
    replace: async (expected: string | null, next: string) => {
      assert.equal(record, expected);
      record = next;
    },
  };
  await saveRecovery(original, storage);
  await saveRecovery(history.present, storage);
  assert.equal(serializeProject((await readRecovery(storage))!.project), raw);
  const saved = record;
  await assert.rejects(
    saveRecovery(
      {
        ...project,
        layers: project.layers.map((l, i) =>
          i === 0 ? { ...l, name: "x".repeat(PROJECT_FILE_LIMIT) } : l,
        ),
      },
      storage,
    ),
    /128 MiB/,
  );
  assert.equal(record, saved);
});

test("aggregate UTF-8 boundary is inclusive and individual asset budget stays independent", async () => {
  const { assertProjectFileSize } = await import("../../interop/project-file/size.ts");
  const { IMAGE_SOURCE_FILE_LIMIT } = await import("../../interop/images/import.ts");
  const { createImageAssetHandle } = await import("../../domain/elements/reference/model.ts");
  assert.equal(PROJECT_FILE_LIMIT, 128 * 1024 * 1024);
  assert.equal(IMAGE_SOURCE_FILE_LIMIT, 10 * 1024 * 1024);
  assert.doesNotThrow(() => assertProjectFileSize("ä".repeat(PROJECT_FILE_LIMIT / 2)));
  assert.throws(() => assertProjectFileSize("ä".repeat(PROJECT_FILE_LIMIT / 2) + "x"), /128 MiB/);
  assert.throws(() =>
    createImageAssetHandle({
      id: "too-large",
      mimeType: "image/png",
      pixelWidth: 1,
      pixelHeight: 1,
      data: "AAAA".repeat(IMAGE_SOURCE_FILE_LIMIT / 4 + 1),
    }),
  );
});
