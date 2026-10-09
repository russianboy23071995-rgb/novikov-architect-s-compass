import test from "node:test";
import assert from "node:assert/strict";
import { assignPenSet, loadPens, savePenSet } from "./library.ts";
import { defaultPenSet, penSetSchema } from "../../domain/pens/model.ts";
import { addLine, createProject, serializeProject, updateLine } from "../../lib/bim/model.ts";
import { createHistory, commitProject, undoProject, redoProject } from "../../lib/bim/history.ts";
import { loadProjectData } from "../../interop/project-file/load.ts";
const memory = () => {
  let raw: string | null = null;
  return {
    read: () => raw,
    write: (value: string) => {
      raw = value;
    },
  };
};
test("pen packages preserve names, colors and ordered inventory in storage", () => {
  const storage = memory(),
    initial = loadPens(storage);
  const set = { ...defaultPenSet, id: "masonry", name: "Mauerwerk", inventory: ["red", "black"] };
  const next = savePenSet(storage, initial, set);
  assert.deepEqual(loadPens(storage), next);
  assert.equal(initial.sets.length, 1);
  assert.deepEqual(next.sets[1]!.inventory, ["red", "black"]);
  assert.throws(() => savePenSet(storage, initial, set), /andernorts/);
});
test("invalid colors, duplicate IDs, dangling inventory and more than ten entries are rejected", () => {
  for (const bad of [
    { ...defaultPenSet, name: " " },
    { ...defaultPenSet, pens: [{ id: "x", name: "x", color: "red" }] },
    { ...defaultPenSet, pens: [...defaultPenSet.pens, defaultPenSet.pens[0]] },
    { ...defaultPenSet, inventory: ["missing"] },
    { ...defaultPenSet, inventory: ["red", "red"] },
    {
      ...defaultPenSet,
      pens: Array.from({ length: 11 }, (_, i) => ({
        id: String(i),
        name: String(i),
        color: "#123456",
      })),
      inventory: Array.from({ length: 11 }, (_, i) => String(i)),
    },
  ])
    assert.throws(() => penSetSchema.parse(bad));
});
test("quota failure and corrupt storage preserve previous library", () => {
  const storage = memory();
  const initial = loadPens(storage);
  assert.throws(
    () =>
      savePenSet(
        {
          ...storage,
          write: () => {
            throw new Error("quota");
          },
        },
        initial,
        defaultPenSet,
      ),
    /quota/,
  );
  assert.equal(storage.read(), null);
  storage.write("broken");
  assert.throws(() => loadPens(storage));
  assert.throws(() => savePenSet(storage, initial, defaultPenSet));
  assert.equal(storage.read(), "broken");
});
test("project palette is portable and changes never recolor existing lines", () => {
  let p = addLine(createProject("p", "s"), {
    id: "l",
    kind: "line",
    points: [
      { x: 0, y: 0 },
      { x: 2, y: 0 },
    ],
    color: "#dc2626",
    penWidth: 0.2,
    style: "solid",
  });
  p = assignPenSet(p, p, defaultPenSet);
  const copy = loadProjectData(JSON.parse(serializeProject(p)));
  assert.deepEqual(copy.penSet, defaultPenSet);
  const changed = {
    ...defaultPenSet,
    pens: defaultPenSet.pens.map((p) => (p.id === "red" ? { ...p, color: "#112233" } : p)),
  };
  const next = assignPenSet(p, p, changed);
  assert.deepEqual(next.storey, p.storey);
  assert.equal(next.storey.lines![0]!.color, "#dc2626");
  assert.equal(assignPenSet(next, next, changed), next);
  assert.throws(() => assignPenSet(p, next, changed), /geändert/);
});
test("direct color property commits once, supports Undo/Redo and no-op adds no history", () => {
  const p = addLine(createProject("p", "s"), {
    id: "l",
    kind: "line",
    points: [
      { x: 0, y: 0 },
      { x: 2, y: 0 },
    ],
    color: "#000000",
    penWidth: 0.2,
    style: "solid",
  });
  const before = createHistory(p);
  const changed = commitProject(before, updateLine(p, "l", { color: "#112233" }));
  assert.equal(changed.past.length, 1);
  assert.equal(undoProject(changed).present.storey.lines![0]!.color, "#000000");
  assert.equal(redoProject(undoProject(changed)).present.storey.lines![0]!.color, "#112233");
  assert.equal(
    commitProject(changed, updateLine(changed.present, "l", { color: "#112233" })),
    changed,
  );
  assert.throws(() => updateLine(p, "l", { penWidth: NaN }));
  assert.equal(before.past.length, 0);
});
test("strict schema 13 migration retains geometry and rejects future palette field", () => {
  const p = createProject("p", "s");
  const old = { ...p, schemaVersion: 13 };
  const migrated = loadProjectData(old);
  assert.equal(migrated.schemaVersion, 15);
  assert.deepEqual(migrated.storey, p.storey);
  assert.equal(migrated.penSet, undefined);
  assert.throws(() => loadProjectData({ ...old, penSet: defaultPenSet }));
});

import { hsvToHex, hexToHsv } from "./color.ts";
test("custom palette preserves exact RGB values through HSV and covers primary colors", () => {
  for (const color of ["#000000", "#ffffff", "#334155", "#dc2626", "#40c4c4", "#123456"]) {
    const p = hexToHsv(color);
    assert.equal(hsvToHex(p.h, p.s, p.v), color);
  }
  assert.equal(hsvToHex(0, 1, 1), "#ff0000");
  assert.equal(hsvToHex(120, 1, 1), "#00ff00");
  assert.equal(hsvToHex(240, 1, 1), "#0000ff");
});
