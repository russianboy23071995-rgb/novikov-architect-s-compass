import test from "node:test";
import assert from "node:assert/strict";
import { createProject } from "../../application/projects/create.ts";
import { addLine } from "../../application/lines/actions.ts";
import { createHistory, commitProject } from "../../application/history/project-history.ts";
import { defaultLineAppearance } from "../../lib/bim/lines.ts";
import { storeyOf, replaceStorey } from "../storeys/access.ts";
import { validateProject, type Project } from "./schema.ts";
import {
  createProjectSnapshot,
  elementValidationReuseCount,
  isOwnedProjectSnapshot,
} from "./owned-snapshot.ts";

const line = (id: string, y: number) => ({
  id,
  kind: "polyline" as const,
  points: [
    { x: 0, y },
    { x: 4, y },
  ],
  ...defaultLineAppearance,
});
function owned(): Project {
  let p = createProject("p", "s0");
  for (let i = 0; i < 6; i++) p = addLine(p, line(`l${i}`, i));
  return createHistory(p).present;
}
/** The changed storey with one line replaced; the other lines stay the owned objects. */
const withLines = (p: Project, lines: unknown[]) =>
  replaceStorey(p, { ...storeyOf(p), lines: lines as never });

test("known elements of a changed storey skip parsing and give the full validation result", () => {
  const p = owned();
  assert.equal(isOwnedProjectSnapshot(p), true);
  const lines = [...storeyOf(p).lines!];
  lines[2] = { ...line("l2", 9), layerId: lines[2]!.layerId };
  const before = elementValidationReuseCount();
  const next = createProjectSnapshot(withLines(p, lines), undefined, p);
  assert.equal(elementValidationReuseCount() - before, 5);
  assert.deepEqual(
    JSON.parse(JSON.stringify(next)),
    JSON.parse(JSON.stringify(validateProject(JSON.parse(JSON.stringify(withLines(p, lines)))))),
  );
  // Unchanged lines keep their identity, the changed one is new.
  assert.equal(storeyOf(next).lines![0], storeyOf(p).lines![0]);
  assert.notEqual(storeyOf(next).lines![2], storeyOf(p).lines![2]);
});

test("new invalid elements and duplicates are still rejected next to known elements", () => {
  const p = owned();
  const known = storeyOf(p).lines!;
  // An invalid new line among reused ones fails parsing.
  const invalid = { ...line("bad", 1), layerId: known[0]!.layerId, points: [{ x: 0, y: 0 }] };
  assert.throws(() => createProjectSnapshot(withLines(p, [...known, invalid]), undefined, p));
  // A known element listed twice fails the ID check over the reassembled list.
  assert.throws(
    () => createProjectSnapshot(withLines(p, [...known, known[0]]), undefined, p),
    /Duplicate ID/,
  );
  // A mutable copy of a known element is parsed in full, never trusted.
  const copy = { ...known[1]!, penWidth: 99 };
  assert.throws(() => createProjectSnapshot(withLines(p, [known[0], copy]), undefined, p));
});

test("public validation of plain data never reuses elements", () => {
  const p = owned();
  const before = elementValidationReuseCount();
  validateProject(JSON.parse(JSON.stringify(p)));
  commitProject(createHistory(JSON.parse(JSON.stringify(p))), JSON.parse(JSON.stringify(p)));
  assert.equal(elementValidationReuseCount(), before);
});
