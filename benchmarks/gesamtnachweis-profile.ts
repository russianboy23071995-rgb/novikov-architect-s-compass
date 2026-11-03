import { writeFile } from "node:fs/promises";
import { cpus } from "node:os";
import { gesamtCounts, gesamtFixture } from "./gesamt-fixture.ts";
import { gesamtImages } from "./gesamt-images.ts";
import { serializeProject } from "../src/lib/bim/model.ts";
import { loadProjectData } from "../src/interop/project-file/load.ts";
import {
  createProjectSnapshot,
  elementValidationReuseCount,
  storeyValidationReuseCount,
} from "../src/domain/project/owned-snapshot.ts";
import { createEditingState, editingReducer } from "../src/application/direct-edit/controller.ts";
import { spaceEditingReducer, spaceLens } from "../src/application/views/title-block-space.ts";
import { createDrawing } from "../src/application/drawing/actions.ts";
import { updateWall } from "../src/application/walls/actions.ts";
import { defaultLineAppearance } from "../src/lib/bim/lines.ts";
import { buildBuildingSolid, buildingFacePart } from "../src/rendering/viewport/building-solid.ts";
import { sectionDrawing } from "../src/rendering/viewport/section-drawing.ts";
import { exportIfc } from "../src/lib/bim/ifc.ts";
import { rememberedSectionDrawing as cachedSectionDrawing } from "../src/rendering/viewport/section-drawing.ts";
import type { Project } from "../src/domain/project/schema.ts";
import { resolveRoofTrims } from "../src/domain/elements/wall/roof-trim.ts";
import { resolveBoundWallHeights } from "../src/domain/elements/wall/height-binding.ts";

/**
 * Gesamtnachweis große Projekte, Node part (docs/performance/GESAMTNACHWEIS_2026-11.md).
 * Measures only; changes no product code. Per model size: open, local changes through the
 * editing reducer the workspace uses, undo/redo, storey switch, the derived building and all
 * section drawings after a change, IFC and serialisation. Counters show how many storeys and
 * elements the validation reused and how many storey parts of the building were rebuilt.
 *
 * Usage: node --experimental-strip-types benchmarks/gesamtnachweis-profile.ts [sizes] [out.json]
 * sizes: comma separated element counts, default 3000,10000,20000.
 */
const sizes = (process.argv[2] ?? "3000,10000,20000").split(",").map(Number);
const out = process.argv[3];
const SAMPLES = 9;

const stats = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const at = (q: number) => sorted[Math.min(sorted.length - 1, Math.ceil(q * sorted.length) - 1)]!;
  const round = (n: number) => Math.round(n * 10) / 10;
  return { median: round(at(0.5)), p95: round(at(0.95)), max: round(sorted.at(-1)!) };
};
type Counters = { storeysRevalidated: number; elementsReused: number };
/** Time a step; counters are the validation reuse during that step. */
function measure<T>(run: (i: number) => T, samples = SAMPLES) {
  const times: number[] = [];
  const counters: Counters[] = [];
  let last: T | undefined;
  for (let i = -1; i < samples; i++) {
    const storeys = storeyValidationReuseCount(),
      elements = elementValidationReuseCount();
    const t = performance.now();
    last = run(i);
    const ms = performance.now() - t;
    if (i < 0) continue; // warm-up
    times.push(ms);
    counters.push({
      storeysRevalidated: storeyValidationReuseCount() - storeys,
      elementsReused: elementValidationReuseCount() - elements,
    });
  }
  return { ms: stats(times), counters: counters[counters.length - 1]!, last: last! };
}
/** Storey parts of the building that are new objects compared to the previous building. */
function rebuiltParts(before: Project, after: Project) {
  const parts = (p: Project) =>
    new Set(
      buildBuildingSolid(p)
        .faces.map((f) => buildingFacePart(f))
        .filter(Boolean),
    );
  const old = parts(before);
  const now = parts(after);
  return { parts: now.size, rebuilt: [...now].filter((part) => !old.has(part)).length };
}

const results: Record<string, unknown>[] = [];
for (const elements of sizes) {
  const t0 = performance.now();
  const fixture = gesamtFixture(elements, gesamtImages());
  const buildMs = performance.now() - t0;
  const json = serializeProject(fixture);
  const storeyCount = fixture.storeys.length;

  const open = measure(() => createProjectSnapshot(loadProjectData(JSON.parse(json))), 3);
  let state = createEditingState(open.last);
  const reused = (c: Counters) => ({
    storeysReused: c.storeysRevalidated,
    storeysRevalidated: storeyCount - c.storeysRevalidated,
    elementsReused: c.elementsReused,
  });

  // A local change: one wall of storey 2, alternating heights.
  const wall = state.history.present.storeys[2]!.walls[0]!.id;
  const before = state.history.present;
  const wallEdit = measure((i) => {
    const present = state.history.present;
    const changed = updateWall(present, wall, { height: i % 2 ? 2.8 : 2.9 });
    state = editingReducer(state, { type: "project", project: changed });
    return state.history.present;
  });
  const wallBuilding = rebuiltParts(before, wallEdit.last);
  const wallBuildingMs = measure((i) => {
    const present = state.history.present;
    const changed = editingReducer(state, {
      type: "project",
      project: updateWall(present, wall, { height: i % 2 ? 2.85 : 2.95 }),
    });
    state = changed;
    return buildBuildingSolid(changed.history.present);
  }, 5);

  // Derived wall heights run over the whole model in every validation.
  const roofTrims = measure(() => resolveRoofTrims(state.history.present));
  const boundHeights = measure(() => resolveBoundWallHeights(state.history.present));
  // A local change in the storey whose walls are all trimmed at the roof.
  const trimmedWall = state.history.present.storeys[4]!.walls[0]!.id;
  const toStorey = (storeyId: string) =>
    (state = editingReducer(state, {
      type: "working-storey",
      base: state.history.present,
      storeyId,
    }));
  toStorey("s4");
  const trimmedEdit = measure((i) => {
    const present = state.history.present;
    const changed = updateWall(present, trimmedWall, { thickness: i % 2 ? 0.24 : 0.25 });
    state = editingReducer(state, { type: "project", project: changed });
    if (state.error) throw new Error(state.error);
    return state.history.present;
  });
  toStorey("s2");

  // All section and elevation drawings after one model change (each drawn layout needs them;
  // the drawing cache is per project object).
  const sections = state.history.present.sections ?? [];
  // Each sample first changes one wall of storey 2, then draws every section of the new state.
  const sectionTimes: number[] = [];
  for (let i = -1; i < 3; i++) {
    state = editingReducer(state, {
      type: "project",
      project: updateWall(state.history.present, wall, { height: i % 2 ? 2.7 : 2.75 }),
    });
    const p = state.history.present;
    const t = performance.now();
    for (const s of sections) sectionDrawing(p, s);
    if (i >= 0) sectionTimes.push(performance.now() - t);
  }
  const sectionAll = { ms: stats(sectionTimes) };

  // A line drawn on a layout: no building element changes.
  const layoutId = state.history.present.layouts![0]!.id;
  const beforeLayout = state.history.present;
  const layoutLine = measure((i) => {
    const space = { kind: "layout" as const, id: layoutId };
    let s = spaceEditingReducer(state, { type: "space", space });
    const lens = spaceLens(s.history.present, space);
    s = spaceEditingReducer(s, {
      type: "project",
      project: createDrawing(lens, lens, `messlinie-${elements}-${i}`, {
        kind: "line",
        points: [
          { x: 0.02, y: 0.02 + i * 0.001 },
          { x: 0.1, y: 0.02 + i * 0.001 },
        ],
        lineKind: "line",
        appearance: defaultLineAppearance,
      }),
    });
    if (s.error) throw new Error(s.error);
    state = s;
    return s.history.present;
  });
  const layoutBuilding = rebuiltParts(beforeLayout, layoutLine.last);
  // The drawings a layout shows, after a change on the layout (nothing they show changed).
  const sectionsAfterLayout = measure((i) => {
    const before = state.history.present;
    for (const s of sections) cachedSectionDrawing(before, s);
    const space = { kind: "layout" as const, id: layoutId };
    let next = spaceEditingReducer(state, { type: "space", space });
    const lens = spaceLens(next.history.present, space);
    next = spaceEditingReducer(next, {
      type: "project",
      project: createDrawing(lens, lens, `messlinie-b-${elements}-${i}`, {
        kind: "line",
        points: [
          { x: 0.02, y: 0.05 + i * 0.001 },
          { x: 0.1, y: 0.05 + i * 0.001 },
        ],
        lineKind: "line",
        appearance: defaultLineAppearance,
      }),
    });
    state = next;
    const t = performance.now();
    for (const s of sections) cachedSectionDrawing(state.history.present, s);
    return performance.now() - t;
  }, 3);

  // Project information (title block data): no building element changes.
  const info = measure((i) => {
    state = editingReducer(state, {
      type: "project-info",
      base: state.history.present,
      info: { name: `Schule ${i}` },
    });
    return state.history.present;
  });

  const undo = measure(() => {
    state = editingReducer(state, { type: "undo" });
    return state;
  });
  const redo = measure(() => {
    state = editingReducer(state, { type: "redo" });
    return state;
  });
  const storeySwitch = measure((i) => {
    state = editingReducer(state, {
      type: "working-storey",
      base: state.history.present,
      storeyId: `s${i % 2 ? 2 : 3}`,
    });
    return state;
  });
  const serialize = measure(() => serializeProject(state.history.present), 3);
  const ifcTimes: number[] = [];
  for (let i = 0; i < 2; i++) {
    const t = performance.now();
    await exportIfc(state.history.present, new Date(0));
    ifcTimes.push(performance.now() - t);
  }
  const heap = process.memoryUsage();
  results.push({
    elements,
    counts: gesamtCounts(fixture),
    fileMB: Math.round((json.length / 1024 / 1024) * 10) / 10,
    buildMs: Math.round(buildMs),
    openMs: open.ms,
    wallEdit: { ms: wallEdit.ms, ...reused(wallEdit.counters), building: wallBuilding },
    wallEditWithBuildingMs: wallBuildingMs.ms,
    trimmedStoreyWallEdit: { ms: trimmedEdit.ms, ...reused(trimmedEdit.counters) },
    resolveRoofTrimsMs: roofTrims.ms,
    resolveBoundWallHeightsMs: boundHeights.ms,
    sectionsAfterChange: { count: sections.length, ms: sectionAll.ms },
    // Only the drawing part of each sample (the layout edit itself is timed in layoutLine).
    sectionsAfterLayoutChangeMs: Math.round(sectionsAfterLayout.last * 10) / 10,
    layoutLine: { ms: layoutLine.ms, ...reused(layoutLine.counters), building: layoutBuilding },
    projectInfo: { ms: info.ms, ...reused(info.counters) },
    undoMs: undo.ms,
    redoMs: redo.ms,
    storeySwitchMs: storeySwitch.ms,
    serializeMs: serialize.ms,
    ifcMs: stats(ifcTimes),
    heapUsedMB: Math.round(heap.heapUsed / 1024 / 1024),
    rssMB: Math.round(heap.rss / 1024 / 1024),
  });
  console.log(JSON.stringify(results.at(-1)));
}
const report = {
  date: new Date().toISOString(),
  node: process.version,
  cpu: cpus()[0]?.model,
  samples: SAMPLES,
  results,
};
if (out) await writeFile(out, JSON.stringify(report, null, 2) + "\n");
