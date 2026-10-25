import test from "node:test";
import assert from "node:assert/strict";
import { serializeProject } from "../../../lib/bim/model.ts";
import { addWindow } from "../../../application/windows/actions.ts";
import { createProject } from "../../../application/projects/create.ts";
import { addWall } from "../../../application/walls/actions.ts";
import { readProjectFile } from "../../../lib/bim/history.ts";
import { addStorey, setStoreyHeight } from "../../../application/storeys/actions.ts";
import { selectWorkingStorey } from "../../../application/storeys/working-storey.ts";
import { addDoor } from "../../../application/doors/actions.ts";
import { placeDoor } from "../../../application/drawing/door-placement.ts";
import { placeWindow } from "../../../application/drawing/window-placement.ts";
import { setOpeningMark } from "../../../application/openings/marks.ts";
import { previewDeleteSelection } from "../../../application/elements/delete.ts";
import { previewDoorCommand } from "../../../application/doors/command.ts";
import { openingOverlapHintFor } from "../../../application/openings/overlap-hint.ts";
import { createLayerVisibilityPolicy } from "../../../application/layers/visibility.ts";
import { selectionSummary } from "../../../components/cad/demand-menu.ts";
import { PROJECT_SCHEMA_VERSION } from "../../project/format.ts";
import { DOOR_DEFAULTS } from "../door/model.ts";
import { storeyOf } from "../../storeys/access.ts";
import type { Project } from "../../project/schema.ts";
import {
  duplicateMarkHint,
  nextOpeningMark,
  openingLabel,
  storeyCode,
  withOpeningMarks,
} from "./opening-marks.ts";

/** Three storeys (UG, EG, OG), one 6 m wall each. */
function building(): Project {
  let p = createProject("p", "eg");
  p = setStoreyHeight(p, p, { projectId: p.id, storeyId: "eg", height: 3 });
  p = addStorey(p, p, { projectId: p.id, storeyId: "eg", side: "above", id: "og", height: 3 });
  p = addStorey(p, p, { projectId: p.id, storeyId: "eg", side: "below", id: "ug", height: 3 });
  for (const s of ["ug", "eg", "og"]) {
    p = selectWorkingStorey(p, p, s);
    p = addWall(p, {
      id: `${s}-w`,
      start: { x: 0, y: 0 },
      end: { x: 6, y: 0 },
      thickness: 0.24,
      height: 2.8,
    });
  }
  return selectWorkingStorey(p, p, "eg");
}
const visible = (p: Project) =>
  createLayerVisibilityPolicy(p, { scope: { kind: "bim-project" }, hiddenLayerIds: [] });

test("storey codes follow the place relative to the ground storey, not the name", () => {
  const p = building();
  assert.deepEqual(
    ["ug", "eg", "og"].map((id) => storeyCode(p, id)),
    ["UG1", "EG", "OG1"],
  );
  assert.throws(() => storeyCode(p, "missing"), /Geschoss/);
});

test("placing numbers per kind and storey; gaps are not refilled; deletes keep numbers", () => {
  let p = building();
  const place = (q: Project, kind: "door" | "window", id: string, x: number) =>
    kind === "door"
      ? placeDoor(q, q, visible(q), id, { x, y: 0 })
      : placeWindow(q, q, visible(q), id, { x, y: 0 });
  p = place(p, "door", "d1", 1);
  p = place(p, "window", "f1", 3);
  p = place(p, "door", "d2", 5);
  const marks = (q: Project) =>
    Object.fromEntries(
      [...storeyOf(q).windows, ...(storeyOf(q).doors ?? [])].map((o) => [o.id, o.mark]),
    );
  assert.deepEqual(marks(p), { f1: "F-EG-01", d1: "T-EG-01", d2: "T-EG-02" });
  // Deleting T-EG-01 keeps T-EG-02; the next door gets 03, not the gap.
  p = previewDeleteSelection(p, [{ kind: "door", id: "d1" }], visible(p)).result;
  assert.equal(marks(p)["d2"], "T-EG-02");
  assert.equal(nextOpeningMark(p, "eg", "door"), "T-EG-03");
  // Other storeys count separately; foreign free-text numbers are ignored.
  const og = selectWorkingStorey(p, p, "og");
  assert.equal(marks(place(og, "door", "d3", 1))["d3"], "T-OG1-01");
  const named = setOpeningMark(p, { kind: "door", id: "d2" }, "Haustür");
  assert.equal(nextOpeningMark(named, "eg", "door"), "T-EG-01");
});

test("editing numbers trims, rejects empty input and only hints at duplicates", () => {
  let p = building();
  p = placeDoor(p, p, visible(p), "d1", { x: 1, y: 0 });
  p = placeDoor(p, p, visible(p), "d2", { x: 5, y: 0 });
  assert.throws(() => setOpeningMark(p, { kind: "door", id: "d1" }, "   "), /leer/);
  assert.throws(() => setOpeningMark(p, { kind: "window", id: "d1" }, "F1"), /nicht gefunden/);
  const twice = setOpeningMark(p, { kind: "door", id: "d2" }, "  T-EG-01 ");
  assert.equal(storeyOf(twice).doors![1]!.mark, "T-EG-01");
  assert.equal(duplicateMarkHint(twice, "d1"), "Hinweis: Nummer T-EG-01 ist 2-mal vergeben");
  assert.equal(duplicateMarkHint(p, "d1"), "");
});

test("schema 27 files receive numbers in stored order; schema 28 keeps them strictly", () => {
  let p = building();
  p = addWindow(p, {
    id: "f-old",
    wallId: "eg-w",
    width: 1,
    height: 1,
    sillHeight: 1,
    position: 0.7,
  });
  p = addDoor(p, { id: "d-old", wallId: "eg-w", position: 0.2, ...DOOR_DEFAULTS });
  const og = selectWorkingStorey(p, p, "og");
  p = addDoor(og, { id: "d-og", wallId: "og-w", position: 0.5, ...DOOR_DEFAULTS });
  const v27 = JSON.parse(serializeProject(p));
  v27.schemaVersion = 27;
  const loaded = readProjectFile(JSON.stringify(v27));
  assert.equal(loaded.schemaVersion, PROJECT_SCHEMA_VERSION);
  const all = loaded.storeys.flatMap((s) => [...s.windows, ...(s.doors ?? [])]);
  assert.deepEqual(
    all.map((o) => [o.id, o.mark]),
    [
      ["f-old", "F-EG-01"],
      ["d-old", "T-EG-01"],
      ["d-og", "T-OG1-01"],
    ],
  );
  assert.deepEqual(readProjectFile(serializeProject(loaded)), loaded);
  assert.deepEqual(withOpeningMarks(loaded), loaded);
  // Schema 27 never carried numbers: a number there is an invalid file.
  v27.storeys[1].doors[0].mark = "X";
  assert.throws(() => readProjectFile(JSON.stringify(v27)));
});

test("hints, door commands and the menu name the number instead of the ID", () => {
  let p = building();
  p = placeWindow(p, p, visible(p), "f1", { x: 3, y: 0 });
  p = placeDoor(p, p, visible(p), "d1", { x: 3, y: 0 });
  assert.equal(openingOverlapHintFor(p, "d1"), "Hinweis: Fenster F-EG-01 überlappt Tür T-EG-01");
  const door = { kind: "door", id: "d1" } as const;
  assert.match(previewDoorCommand(p, door, "Tür DIN links")!.summary, /^T-EG-01 · DIN/);
  assert.equal(selectionSummary(p, door)?.title, "Tür T-EG-01");
  assert.equal(selectionSummary(p, { kind: "window", id: "f1" })?.title, "Fenster F-EG-01");
  assert.equal(openingLabel({ id: "x" }), "x");
});
