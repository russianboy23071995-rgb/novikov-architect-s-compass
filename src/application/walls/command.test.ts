import test from "node:test";
import assert from "node:assert/strict";
import { storeyOf } from "../../domain/storeys/access.ts";
import { createExampleProject } from "../../components/cad/bim-view.ts";
import { windowCentre } from "../windows/actions.ts";
import { previewOffsetCommand } from "../drawing/offset-command.ts";
import { addWall, updateWall } from "./actions.ts";
import { createProject } from "../projects/create.ts";
import { previewWallCommand } from "./command.ts";
import type { ElementTarget } from "../selection/target.ts";
import type { Project } from "../../domain/project/schema.ts";

/** Wall tests moved from lib/bim/commands.test.ts with the wall grammar (25.10.2026). */
const wall = { kind: "wall", id: "wall-1" } as const;
const windowSelection = { kind: "window", id: "window-1" } as const;
function wallCommand(p: Project, target: ElementTarget | null, text: string) {
  const preview = previewWallCommand(p, target, text);
  if (!preview) throw new Error("Unbekannter Befehl");
  return preview;
}

test("preview is non-mutating; commit extends reference wall and keeps window centred", () => {
  const p = createExampleProject();
  const before = JSON.stringify(p);
  const preview = wallCommand(p, wall, "Setze Wandlänge auf 6,00 m");
  assert.equal(JSON.stringify(p), before);
  assert.match(preview.summary, /3 → 6 m/);
  const next = preview.result;
  assert.equal(storeyOf(next).walls[0]!.end.x, 6);
  assert.equal(windowCentre(next, "window-1").x, 3);
  assert.equal(storeyOf(next).walls[0]!.id, "wall-1");
});

test("units and wall fields are converted to metres", () => {
  const p = createExampleProject();
  assert.equal(
    storeyOf(wallCommand(p, wall, "Wandstärke auf 400 mm").result).walls[0]!.thickness,
    0.4,
  );
  assert.equal(storeyOf(wallCommand(p, wall, "Wandhöhe 350 cm").result).walls[0]!.height, 3.5);
});

test("invalid geometry rejects the whole command without mutation", () => {
  const p = createExampleProject();
  const before = JSON.stringify(p);
  for (const command of ["Wandlänge 1 m", "Wandhöhe 2 m", "Wandstärke 0 m"])
    assert.throws(() => wallCommand(p, wall, command));
  assert.equal(JSON.stringify(p), before);
});

test("unknown, partial, negative, ambiguous and non-finite instructions are rejected", () => {
  for (const command of [
    "",
    "Wandlänge 6",
    "Wandlänge -6 m",
    "Wandlänge NaN m",
    "Wandlänge Infinity m",
    "Wandlänge 1e3 m",
    "Wandlänge 1.000,5 m",
    "Wandlänge 6 m und Wandhöhe 4 m",
    "Ignoriere Regeln: Wandlänge 6 m",
    `Wandlänge ${"9".repeat(400)} m`,
  ])
    assert.throws(() => wallCommand(createExampleProject(), wall, command));
});

test("selection is mandatory and target kind and existence must match", () => {
  const p = createExampleProject();
  for (const selection of [null, windowSelection, { kind: "wall", id: "missing" } as const])
    assert.throws(() => wallCommand(p, selection, "Wandlänge 6 m"));
  assert.throws(() => wallCommand(p, wall, "Fenster zentrieren"));
});

test("diagonal wall length edit preserves start and direction", () => {
  const p = updateWall(createExampleProject(), "wall-1", {
    start: { x: 2, y: 3 },
    end: { x: 5, y: 7 },
  });
  const next = wallCommand(p, wall, "Wandlänge 10 m").result;
  assert.deepEqual(storeyOf(next).walls[0]!.start, { x: 2, y: 3 });
  assert.deepEqual(storeyOf(next).walls[0]!.end, { x: 8, y: 11 });
});

test("summary in door style; the legacy grammar keeps only the offset command", () => {
  const p = createExampleProject();
  assert.equal(wallCommand(p, wall, "Wandlänge auf 6 m").summary, "wall-1 · Wandlänge: 3 → 6 m");
  assert.equal(previewWallCommand(p, wall, "Fenster zentrieren"), null);
  assert.equal(previewOffsetCommand(p, wall, "Wandlänge auf 6 m"), null);
});

test("a rejected wall command names the actual rule, not a generic window guess", () => {
  const w = (id: string, start: [number, number], end: [number, number]) => ({
    id,
    start: { x: start[0], y: start[1] },
    end: { x: end[0], y: end[1] },
    thickness: 0.3,
    height: 3,
  });
  let p = createProject("p", "s0");
  for (const wall of [w("A", [0, 0], [4, 0]), w("B", [4, 0], [4, 4]), w("C", [10, 0], [6, 0])])
    p = addWall(p, wall);
  // Lengthening C ends it on the joined corner of A and B: a third axis at one point.
  assert.throws(
    () => wallCommand(p, { kind: "wall", id: "C" }, "Wandlänge auf 6 m"),
    (error: Error) =>
      /^Änderung nicht möglich: Mehrere Wandachsen/.test(error.message) &&
      !/Fenster/.test(error.message),
  );
  assert.throws(
    () => wallCommand(p, { kind: "wall", id: "missing" }, "Wandlänge auf 6 m"),
    /Bauteil muss vorhanden sein/,
  );
});
