import test from "node:test";
import assert from "node:assert/strict";
import { gesamtFixture } from "./gesamt-fixture.ts";
import {
  createProjectSnapshot,
  storeyValidationReuseCount,
} from "../src/domain/project/owned-snapshot.ts";
import { createEditingState, editingReducer } from "../src/application/direct-edit/controller.ts";
import {
  spaceEditingReducer,
  spaceLens,
  type SpaceEditingState,
} from "../src/application/views/title-block-space.ts";
import { createDrawing } from "../src/application/drawing/actions.ts";
import { updateWall } from "../src/application/walls/actions.ts";
import { updateSection } from "../src/application/sections/actions.ts";
import { defaultLineAppearance } from "../src/lib/bim/lines.ts";
import { serializeProject } from "../src/lib/bim/model.ts";
import { loadProjectData } from "../src/interop/project-file/load.ts";
import type { Project } from "../src/domain/project/schema.ts";

// docs/performance/STOREY_KEYS.md: a storey is checked again only when something it reads
// changed; the result always equals a full check without reuse.
test("storey checks: reused for layout, project and section edits, equal to a full check", () => {
  let state: SpaceEditingState = createEditingState(createProjectSnapshot(gesamtFixture(600)));
  const present = () => state.history.present;
  const step = (name: string, run: () => void, revalidated: number) => {
    const before = storeyValidationReuseCount();
    run();
    assert.equal(state.error, "", name);
    const reused = storeyValidationReuseCount() - before;
    assert.equal(present().storeys.length - reused, revalidated, name);
    // Equal to a full check of the same content without any reuse.
    assert.deepEqual(loadProjectData(JSON.parse(serializeProject(present()))), present(), name);
  };
  const layout = present().layouts![0]!.id;
  step(
    "line on a layout",
    () => {
      const space = { kind: "layout" as const, id: layout };
      let s = spaceEditingReducer(state, { type: "space", space });
      const lens = spaceLens(s.history.present, space);
      s = spaceEditingReducer(s, {
        type: "project",
        project: createDrawing(lens, lens, "messlinie", {
          kind: "line",
          points: [
            { x: 0.02, y: 0.02 },
            { x: 0.1, y: 0.02 },
          ],
          lineKind: "line",
          appearance: defaultLineAppearance,
        }),
      });
      state = spaceEditingReducer(s, { type: "space", space: null });
    },
    0,
  );
  step(
    "project information",
    () =>
      (state = editingReducer(state, {
        type: "project-info",
        base: present(),
        info: { name: "Schule" },
      })),
    0,
  );
  step(
    "section moved",
    () =>
      (state = editingReducer(state, {
        type: "project",
        project: updateSection(present(), "schnitt-0", { start: { x: 30, y: -3 } }),
      })),
    0,
  );
  step(
    "section document scale",
    () =>
      (state = editingReducer(state, {
        type: "document",
        base: present(),
        action: { kind: "scale", id: "abbild-schnitt-0", denominator: 200 },
      })),
    0,
  );
  step(
    "plan document of storey 2",
    () =>
      (state = editingReducer(state, {
        type: "document",
        base: present(),
        action: { kind: "scale", id: "abbild-s2", denominator: 200 },
      })),
    1,
  );
  step(
    "wall of the working storey",
    () =>
      (state = editingReducer(state, {
        type: "project",
        project: updateWall(present(), present().storeys[2]!.walls[0]!.id, { height: 2.5 }),
      })),
    1,
  );
});

test("storey checks: values a storey reads still refuse invalid projects after reuse", () => {
  const project = createProjectSnapshot(gesamtFixture(600));
  const change = (patch: Partial<Project>) => () => createProjectSnapshot({ ...project, ...patch });
  // Visibility is checked for the project, not per storey.
  assert.throws(change({ bimVisibility: { hiddenLayerIds: ["unbekannt"] } }), /hidden layer/i);
  // A layer the storeys use, a pattern, a document folder of a storey's plan document.
  const used = project.storeys[0]!.walls[0]!.layerId;
  assert.throws(change({ layers: project.layers.filter((l) => l.id !== used) }));
  assert.throws(
    change({
      drawingDocuments: project.drawingDocuments!.map((d) =>
        d.id === "abbild-s0" ? { ...d, folderId: "fehlt" } : d,
      ),
    }),
    /Abbildordner/,
  );
});
