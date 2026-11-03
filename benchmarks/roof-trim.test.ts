import test from "node:test";
import assert from "node:assert/strict";
import { gesamtFixture } from "./gesamt-fixture.ts";
import { createProjectSnapshot } from "../src/domain/project/owned-snapshot.ts";
import { createEditingState, editingReducer } from "../src/application/direct-edit/controller.ts";
import { updateWall } from "../src/application/walls/actions.ts";
import { updateRoof } from "../src/application/roofs/actions.ts";
import { setStoreyHeight } from "../src/application/storeys/actions.ts";
import { resolveRoofTrims, roofTrimReuseCount } from "../src/domain/elements/wall/roof-trim.ts";
import { serializeProject } from "../src/lib/bim/model.ts";
import { loadProjectData } from "../src/interop/project-file/load.ts";
import type { Project } from "../src/domain/project/schema.ts";

// docs/performance/ROOF_TRIM.md: the trims of a storey are reused only while the storey, its
// floor and the roofs it is trimmed at (with their floors) are unchanged; the result always
// equals a full validation without reuse.
test("roof trims: reused for edits elsewhere, recomputed for the roof storey, roof and heights", () => {
  const base = createProjectSnapshot(gesamtFixture(600));
  let state = createEditingState(createProjectSnapshot({ ...base, workingStoreyId: "s4" }));
  const present = () => state.history.present;
  const step = (name: string, project: (p: Project) => Project, reuse: boolean) => {
    const before = roofTrimReuseCount();
    state = editingReducer(state, { type: "project", project: project(present()) });
    assert.equal(state.error, "", name);
    assert.equal(roofTrimReuseCount() > before, reuse, name);
    assert.deepEqual(loadProjectData(JSON.parse(serializeProject(present()))), present(), name);
  };
  const roofWall = () => present().storeys[4]!.walls[0]!;
  step("wall of the roof storey", (p) => updateWall(p, roofWall().id, { thickness: 0.3 }), false);
  const plane = roofWall().trimPlane!;
  step("roof higher", (p) => updateRoof(p, "dach", { referenceHeight: 2.9 }), false);
  assert.ok(roofWall().trimPlane!.a > plane.a + 0.29);
  step(
    "height of a storey below",
    (p) => setStoreyHeight(p, p, { projectId: p.id, storeyId: "s1", height: 3.5 }),
    false,
  );
  step(
    "wall of another storey",
    (p) => {
      // The working storey switched like the storey navigator does, then a wall edited there.
      const other = createProjectSnapshot({ ...p, workingStoreyId: "s2" });
      return updateWall(other, other.storeys[2]!.walls[0]!.id, { height: 2.7 });
    },
    true,
  );
  // Unchanged: the same storey object comes back.
  assert.equal(resolveRoofTrims(present()).storeys[4], present().storeys[4]);
});

test("roof trims: refusals hold although the storey was resolved before", () => {
  const project = createProjectSnapshot(gesamtFixture(600));
  const roofStorey = project.storeys[4]!;
  const withRoofStorey = (storey: Project["storeys"][number]) => ({
    ...project,
    storeys: project.storeys.map((s, i) => (i === 4 ? storey : s)),
  });
  const host = roofStorey.walls[0]!;
  // A window reaching above the roof underside.
  assert.throws(
    () =>
      resolveRoofTrims(
        withRoofStorey({
          ...roofStorey,
          windows: [
            ...roofStorey.windows,
            {
              ...project.storeys[2]!.windows[0]!,
              id: "zu-hoch",
              wallId: host.id,
              position: 0.5,
              sillHeight: 0.5,
              height: 3,
            },
          ],
        }),
      ),
    /ragt über die Dachfläche/,
  );
  // The roof missing, the roof below the wall foot: the unchanged storey is not reused.
  assert.throws(
    () => resolveRoofTrims(withRoofStorey({ ...roofStorey, roofs: [] })),
    /Das Dach dach für die Trimmung der Wand .* fehlt/,
  );
  assert.throws(
    () =>
      resolveRoofTrims(
        withRoofStorey({
          ...roofStorey,
          roofs: roofStorey.roofs!.map((r) => ({ ...r, referenceHeight: -1 })),
        }),
      ),
    /unter dem Fuß der Wand/,
  );
  const lowered = { ...project.storeys[4]!.roofs![0]!, referenceHeight: -1 };
  assert.throws(
    () =>
      resolveRoofTrims({
        ...project,
        storeys: project.storeys.map((s, i) => (i === 4 ? { ...s, roofs: [lowered] } : s)),
      }),
    /unter dem Fuß der Wand/,
  );
});
