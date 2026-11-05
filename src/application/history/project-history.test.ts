import test from "node:test";
import assert from "node:assert/strict";
import {
  commitProject,
  createHistory,
  historyModelBytes,
  redoProject,
  undoProject,
  type ProjectHistory,
} from "./project-history.ts";
import { createProject } from "../projects/create.ts";
import { addWall, updateWall } from "../walls/actions.ts";
import { createDerivedCache } from "../../domain/project/derived-cache.ts";
import { storeyStorageData } from "../../domain/project/storage-data.ts";
import type { Project } from "../../domain/project/schema.ts";

const base = () =>
  addWall(createProject("p", "s0"), {
    id: "w",
    start: { x: 0, y: 0 },
    end: { x: 5, y: 0 },
    thickness: 0.3,
    height: 3,
  });
const stretch = (h: ProjectHistory, x: number, budget?: number) =>
  commitProject(
    h,
    updateWall(h.present, "w", { end: { x, y: 0 } }),
    budget === undefined ? {} : { byteBudget: budget },
  );
const storeyBytes = (p: Project) =>
  p.storeys.reduce(
    (n, s) => n + new TextEncoder().encode(JSON.stringify(storeyStorageData(s))).byteLength,
    0,
  );

test("kept history steps release their derived data; only the present keeps it", () => {
  const cache = createDerivedCache<Project, string>();
  let h = createHistory(base());
  const first = h.present;
  cache.set(first, "first");
  h = stretch(h, 6);
  assert.equal(cache.has(first), false);
  const second = h.present;
  cache.set(second, "second");
  // A late request for a former present is released again by the next transition.
  cache.set(first, "late");
  h = undoProject(h);
  assert.equal(cache.has(second), false);
  assert.equal(cache.has(first), h.present === first);
  cache.set(h.present, "undone");
  const undone = h.present;
  h = redoProject(h);
  assert.equal(cache.has(undone), false);
  // The redone step lost its entry while kept; it is rebuilt on request.
  assert.equal(cache.has(h.present), false);
  // Undo/redo still restore the complete model.
  assert.deepEqual(undoProject(h).present.storeys, first.storeys);
});

test("history model bytes count every shared storey once", () => {
  let h = createHistory(base());
  const once = historyModelBytes(h);
  assert.equal(once, storeyBytes(h.present));
  h = stretch(h, 6);
  assert.equal(historyModelBytes(h), once + storeyBytes(h.present));
  h = undoProject(h);
  assert.equal(historyModelBytes(h), once + storeyBytes(h.future[0]!));
});

test("byte budget drops the oldest steps, keeps present and marks the history trimmed", () => {
  let h = createHistory(base());
  h = stretch(h, 6);
  h = stretch(h, 7);
  const budget = historyModelBytes(h);
  assert.equal(h.trimmed, undefined);
  for (const x of [8, 9, 10]) h = stretch(h, x, budget);
  assert.equal(h.trimmed, true);
  assert.ok(historyModelBytes(h) <= budget);
  assert.ok(h.past.length >= 1 && h.past.length < 5);
  assert.equal(h.present.storeys[0]!.walls[0]!.end.x, 10);
  // The mark survives undo/redo; a new history starts unmarked.
  h = redoProject(undoProject(h));
  assert.equal(h.trimmed, true);
  assert.equal(createHistory(h.present).trimmed, undefined);
  // Without pressure nothing is dropped.
  let free = createHistory(base());
  for (const x of [6, 7, 8, 9, 10]) free = stretch(free, x);
  assert.equal(free.past.length, 5);
  assert.equal(free.trimmed, undefined);
});
