import test from "node:test";
import assert from "node:assert/strict";
import { applySelectionCommand, previewSelectionCommand } from "./selection-command.ts";
import { createLayerVisibilityPolicy, ALL_LAYERS_VISIBLE } from "../layers/visibility.ts";
import { createProject } from "../projects/create.ts";
import { addWall, updateWall } from "../walls/actions.ts";
import { createHistory } from "../history/project-history.ts";
import { storeyOf } from "../../domain/storeys/access.ts";
import { validateProject, wallLength, type Project } from "../../domain/project/schema.ts";
import { isOwnedProjectSnapshot } from "../../domain/project/owned-snapshot.ts";
import {
  connectedWallSolids,
  createWallSolidReuse,
} from "../../domain/elements/wall/connections.ts";
import { wallExtrusionCount } from "../../domain/elements/wall/contour-solid.ts";

// Three walls joined at two corners (U shape), so all take part in the connected solids.
const wall = (id: string, start: [number, number], end: [number, number]) => ({
  id,
  start: { x: start[0], y: start[1] },
  end: { x: end[0], y: end[1] },
  thickness: 0.3,
  height: 3,
});
const owned = () =>
  createHistory(
    addWall(
      addWall(
        addWall(createProject("p", "s0"), wall("a", [0, 0], [4, 0])),
        wall("b", [4, 0], [4, 4]),
      ),
      wall("c", [4, 4], [0, 4]),
    ),
  ).present;
const targets = [{ kind: "wall" as const, id: "a" }];
const prepare = (p: Project, text = "Wandlänge auf 5 m") => {
  const visibility = createLayerVisibilityPolicy(p, ALL_LAYERS_VISIBLE);
  return { visibility, preview: previewSelectionCommand(p, targets, visibility, text) };
};

test("apply commits the owned validated preview result it issued, without re-running", () => {
  const p = owned();
  const { visibility, preview } = prepare(p);
  assert.equal(isOwnedProjectSnapshot(preview.result), true);
  assert.equal(applySelectionCommand(p, targets, visibility, preview), preview.result);
});

test("a copied, retargeted or edited preview re-runs the validated action", () => {
  const p = owned();
  const { visibility, preview } = prepare(p);
  // A copy was never issued: the action runs again with the same outcome.
  const copy = { ...preview };
  const rerun = applySelectionCommand(p, targets, visibility, copy);
  assert.notEqual(rerun, preview.result);
  assert.deepEqual(rerun, preview.result);
  // A swapped result is never trusted, even an owned one.
  const swapped = { ...preview, result: p };
  assert.deepEqual(applySelectionCommand(p, targets, visibility, swapped), preview.result);
  // An edited text applies the edited command, not the stored result.
  const edited = previewSelectionCommand(p, targets, visibility, "Wandlänge auf 5 m");
  edited.text = "Wandlänge auf 6 m";
  const six = applySelectionCommand(p, targets, visibility, edited);
  assert.equal(wallLength(storeyOf(six).walls.find((w) => w.id === "a")!), 6);
  // A stale base is still refused.
  const changed = updateWall(p, "c", { end: { x: -1, y: 4 } });
  assert.throws(() => applySelectionCommand(changed, targets, visibility, preview), /geändert/);
});

test("a mutable model is never trusted and keeps re-running", () => {
  const p = validateProject(owned());
  assert.equal(isOwnedProjectSnapshot(p), false);
  const { visibility, preview } = prepare(p);
  const applied = applySelectionCommand(p, targets, visibility, preview);
  assert.notEqual(applied, preview.result);
  assert.deepEqual(applied, preview.result);
});

test("wall extrusions are shared across snapshots and equal the uncached derivation", () => {
  const p = owned();
  connectedWallSolids(p);
  const before = wallExtrusionCount();
  // Moving the free end of c changes c only; a and b keep their contours.
  const next = updateWall(p, "c", { end: { x: -1, y: 4 } });
  const solids = connectedWallSolids(next);
  // Validation and display extruded only the changed wall, not the two unchanged ones.
  assert.equal(wallExtrusionCount() - before, 1);
  assert.deepEqual(solids, connectedWallSolids(structuredClone(next), createWallSolidReuse([])));
  // Equal inputs from an unrelated project reuse the same extrusion.
  const again = wallExtrusionCount();
  connectedWallSolids(structuredClone(next));
  assert.equal(wallExtrusionCount(), again);
});
