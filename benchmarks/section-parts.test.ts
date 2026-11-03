import test from "node:test";
import assert from "node:assert/strict";
import { gesamtFixture } from "./gesamt-fixture.ts";
import { sectionDrawing as reference } from "./section-drawing-reference.ts";
import { sectionDrawing } from "../src/rendering/viewport/section-drawing.ts";
import { createProjectSnapshot } from "../src/domain/project/owned-snapshot.ts";
import { createEditingState, editingReducer } from "../src/application/direct-edit/controller.ts";
import { updateWall } from "../src/application/walls/actions.ts";
import { createProject } from "../src/application/projects/create.ts";
import { setStoreyHeight } from "../src/application/storeys/actions.ts";
import { addWall } from "../src/application/walls/actions.ts";
import { addSlab } from "../src/application/slabs/actions.ts";
import { addSlabOpening } from "../src/application/slabs/openings.ts";
import { addSection } from "../src/application/sections/actions.ts";

/** Plain (not owned) project: walls, a slab with a round opening (smooth facets), a section. */
function slabOpeningFixture() {
  let p = createProject("p", "eg");
  p = setStoreyHeight(p, p, { projectId: "p", storeyId: "eg", height: 3 });
  p = addWall(p, {
    id: "w",
    start: { x: 0, y: 0 },
    end: { x: 6, y: 0 },
    thickness: 0.24,
    height: 3,
  });
  p = addSlab(p, {
    id: "s",
    points: [
      { x: -0.12, y: -0.12 },
      { x: 6.12, y: -0.12 },
      { x: 6.12, y: 4 },
      { x: -0.12, y: 4 },
    ],
    thickness: 0.2,
    topOffset: 0,
  });
  p = addSlabOpening(p, { id: "k", circle: { center: { x: 3, y: 2 }, diameter: 0.8 } });
  p = addSection(p, { id: "a", start: { x: 3.1, y: -1 }, end: { x: 3.1, y: 5 }, look: "left" });
  return addSection(p, {
    id: "b",
    start: { x: -1, y: 5 },
    end: { x: 7, y: 5 },
    look: "left",
    kind: "elevation",
  });
}

// docs/performance/SECTION_PARTS.md: the per-part drawing equals the single pass over all faces.
test("section drawing per storey part equals the former single pass, also after an edit", () => {
  const project = createProjectSnapshot(gesamtFixture(600));
  for (const section of project.sections!)
    assert.deepEqual(sectionDrawing(project, section), reference(project, section), section.name);
  // After an edit the unchanged storeys come from memory; still equal to a full pass.
  let state = createEditingState(project);
  const wall = state.history.present.storeys[2]!.walls[0]!.id;
  state = editingReducer(state, {
    type: "project",
    project: updateWall(state.history.present, wall, { height: 2.5 }),
  });
  const edited = state.history.present;
  for (const section of edited.sections!)
    assert.deepEqual(sectionDrawing(edited, section), reference(edited, section), section.name);
  // Not an owned snapshot: computed without memory, same result.
  const plain = slabOpeningFixture();
  for (const section of plain.sections!)
    assert.deepEqual(sectionDrawing(plain, section), reference(plain, section), section.name);
});
