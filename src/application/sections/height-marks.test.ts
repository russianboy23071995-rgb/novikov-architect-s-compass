import test from "node:test";
import assert from "node:assert/strict";
import { createStandardProject } from "../projects/create.ts";
import { addSection } from "./actions.ts";
import { addHeightMarks, removeHeightMarks, updateHeightMarks } from "./height-marks.ts";
import { serializeProject } from "../../lib/bim/model.ts";
import { loadProjectData } from "../../interop/project-file/load.ts";
import { snapSectionPoint } from "../../rendering/viewport/section-snap.ts";

// docs/SCHNITT.md, BS2.
const withSection = () =>
  addSection(createStandardProject("p", "eg", "og"), {
    id: "s1",
    start: { x: 0, y: 0 },
    end: { x: 6, y: 0 },
    look: "left",
  });

test("height marks: add one per height, move, switch kind, delete, keep in the file", () => {
  let p = addHeightMarks(withSection(), "s1", {
    id: "h1",
    x: 7,
    kind: "shell",
    points: [
      { x: 1, z: 0 },
      { x: 2, z: 2.8 },
      { x: 3, z: 2.8004 },
    ],
  });
  const marks = () => p.sections![0]!.heightMarks!;
  assert.deepEqual(
    marks()[0]!.points.map((q) => q.z),
    [0, 2.8],
  );
  p = updateHeightMarks(p, "s1", "h1", { x: -1, kind: "finish" });
  assert.equal(marks()[0]!.x, -1);
  assert.equal(marks()[0]!.kind, "finish");
  const loaded = loadProjectData(JSON.parse(serializeProject(p)));
  assert.deepEqual(loaded.sections![0]!.heightMarks, marks());
  p = removeHeightMarks(p, "s1", "h1");
  assert.deepEqual(marks(), []);
  assert.throws(() => removeHeightMarks(p, "s1", "h1"), /nicht gefunden/);
  assert.throws(() => addHeightMarks(p, "s1", { id: "h2", x: 0, kind: "shell", points: [] }));
  assert.throws(() => addHeightMarks(p, "nope", { id: "h3", x: 0, kind: "shell", points: [] }));
});

test("section snap: a corner wins, else a storey level, else the cursor", () => {
  const corners = [
    { x: 1, y: 0 },
    { x: 1.3, y: 2.8 },
  ];
  assert.deepEqual(snapSectionPoint(corners, [0, 3], { x: 1.28, y: 2.79 }, 0.1), {
    point: { x: 1.3, y: 2.8 },
    kind: "corner",
  });
  assert.deepEqual(snapSectionPoint(corners, [0, 3], { x: 4, y: 2.95 }, 0.1), {
    point: { x: 4, y: 3 },
    kind: "level",
  });
  assert.deepEqual(snapSectionPoint(corners, [0, 3], { x: 4, y: 1.5 }, 0.1).kind, "free");
});
