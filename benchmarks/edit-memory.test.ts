import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { gesamtFixture } from "./gesamt-fixture.ts";
import { createProjectSnapshot } from "../src/domain/project/owned-snapshot.ts";
import { createEditingState, editingReducer } from "../src/application/direct-edit/controller.ts";
import { updateWall } from "../src/application/walls/actions.ts";
import {
  rememberedSectionDrawing,
  sectionDrawing,
} from "../src/rendering/viewport/section-drawing.ts";
import { spaceLens } from "../src/application/views/title-block-space.ts";
import { documentSource } from "../src/application/drawings/sources.ts";

// docs/performance/EDIT_MEMORY.md: a snapshot the undo history keeps holds model data only;
// what was derived from it is released and rebuilt equal when the step becomes current again.
test("edit memory: kept steps release section drawings, lenses and sources; undo rebuilds them", () => {
  let state = createEditingState(createProjectSnapshot(gesamtFixture(600)));
  const first = state.history.present;
  const section = first.sections![0]!;
  const layout = { kind: "layout" as const, id: first.layouts![0]!.id };
  const drawing = rememberedSectionDrawing(first, section);
  const lens = spaceLens(first, layout);
  const source = documentSource(first, first.storeys[0]!.id);
  assert.equal(rememberedSectionDrawing(first, section), drawing);
  assert.equal(spaceLens(first, layout), lens);

  const wall = first.storeys[2]!.walls[0]!;
  state = editingReducer(state, {
    type: "project",
    project: updateWall(first, wall.id, { height: 2.6 }),
  });
  assert.equal(state.history.past.at(-1), first);
  // The workspace draws the current state; the last drawing per section then is that one.
  assert.notEqual(rememberedSectionDrawing(state.history.present, section), drawing);
  // Released: the kept step derives anew.
  assert.notEqual(rememberedSectionDrawing(first, section), drawing);
  assert.notEqual(spaceLens(first, layout), lens);
  assert.notEqual(documentSource(first, first.storeys[0]!.id), source);

  state = editingReducer(state, { type: "undo" });
  const back = state.history.present;
  assert.deepEqual(rememberedSectionDrawing(back, back.sections![0]!), drawing);
  assert.deepEqual(
    rememberedSectionDrawing(back, back.sections![0]!),
    sectionDrawing(back, section),
  );
});

// Every cache keyed by a project snapshot is a derived cache (released with kept steps) or
// named here with the reason it may stay.
const ALLOWED: Record<string, string> = {
  "src/application/history/project-history.ts": "sharing base of a view-only undo result",
  "src/application/snapping/sheet-frames.ts": "keyed by a space lens, released with the lens",
  "src/components/cad/BimPlan.tsx": "keyed by a document source, released with the source",
  "src/components/cad/property-form-key.ts": "one number per snapshot",
  "src/domain/storeys/elevation.ts": "one number per snapshot",
};
test("edit memory: project keyed caches are released with kept history steps", () => {
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) walk(path);
      else if (/\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name)) files.push(path);
    }
  };
  walk("src");
  const found = files
    .filter((f) => /new WeakMap<Project\b/.test(readFileSync(f, "utf8")))
    .map((f) => f.replaceAll("\\", "/"))
    .sort();
  assert.deepEqual(found, Object.keys(ALLOWED).sort());
});
