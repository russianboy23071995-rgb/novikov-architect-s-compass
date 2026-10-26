import test from "node:test";
import assert from "node:assert/strict";
import { createProject } from "../projects/create.ts";
import { addWall } from "../walls/actions.ts";
import { storeyOf } from "../../domain/storeys/access.ts";
import { createLayerVisibilityPolicy } from "../layers/visibility.ts";
import { confirmInteraction } from "../tools/interaction.ts";
import {
  findOpeningHost,
  openingHostTolerance,
  OPENING_HOST_RADIUS_PX,
  windowPlacementInteraction,
} from "./window-placement.ts";
import { defaultDoorDraft, doorPlacementInteraction } from "./door-placement.ts";
import type { Project } from "../../domain/project/schema.ts";

// Opening host picking with a screen tolerance (user decision 26.10.2026,
// docs/OPENING_HIT_TOLERANCE.md).
const wall = (id: string, x: number, thickness: number) => ({
  id,
  start: { x, y: 0 },
  end: { x, y: 8 },
  thickness,
  height: 3,
});
// A 24 cm partition at x = 5 (body 4.88–5.12) and an 80 cm wall at x = 5.6 (body 5.2–6.0).
const project: Project = addWall(
  addWall(createProject("p", "s0"), wall("thin", 5, 0.24)),
  wall("thick", 5.6, 0.8),
);
const visibility = createLayerVisibilityPolicy(project, {
  scope: { kind: "bim-project" },
  hiddenLayerIds: [],
});
// About the scale of the school run l: 8 px are roughly one metre.
const zoomedOut = 8;
const context = (pixelsPerMetre: number, enabled = true) => ({
  references: [],
  pixelsPerMetre,
  enabled,
  endpointRadiusPx: 10,
  gridSpacing: null,
  orthoOrigin: null,
});

test("the tolerance follows the view scale and is zero without one", () => {
  assert.equal(openingHostTolerance(100), OPENING_HOST_RADIUS_PX / 100);
  assert.equal(openingHostTolerance(0), 0);
  assert.equal(openingHostTolerance(Number.NaN), 0);
});

test("a thin wall is found within the screen tolerance and not beyond it", () => {
  // 0.3 m beside the thin axis, i.e. 0.18 m outside its body: missed without tolerance.
  const near = { x: 4.7, y: 4 };
  assert.equal(findOpeningHost(project, visibility, near), undefined);
  assert.equal(
    findOpeningHost(project, visibility, near, openingHostTolerance(zoomedOut))?.wall.id,
    "thin",
  );
  // Zoomed in (100 px/m) the same point is 18 px away: still missed.
  assert.equal(findOpeningHost(project, visibility, near, openingHostTolerance(100)), undefined);
  // 1.2 m outside the body at 8 px/m (9.6 px): beyond the tolerance.
  assert.equal(
    findOpeningHost(project, visibility, { x: 3.68, y: 4 }, openingHostTolerance(zoomedOut)),
    undefined,
  );
});

test("a wall whose body contains the point wins over a nearer-axis neighbour in tolerance", () => {
  // x = 5.25 lies inside the thick body although the thin axis (0.25 m) is nearer than the
  // thick axis (0.35 m): the containing body wins.
  const point = { x: 5.25, y: 4 };
  const tolerance = openingHostTolerance(zoomedOut);
  assert.equal(findOpeningHost(project, visibility, point, tolerance)?.wall.id, "thick");
  // Between both bodies (5.15): neither contains it, the nearer face (thin, 0.03 m) wins.
  assert.equal(findOpeningHost(project, visibility, { x: 5.15, y: 4 }, tolerance)?.wall.id, "thin");
});

test("tolerance 0 keeps the strict body test (counter-check)", () => {
  for (const x of [4.88, 5.12, 5.2, 6.0])
    assert.ok(findOpeningHost(project, visibility, { x, y: 4 }), `inside at ${x}`);
  for (const x of [4.87, 5.13, 5.19, 6.01])
    assert.equal(findOpeningHost(project, visibility, { x, y: 4 }), undefined, `outside at ${x}`);
});

test("window and door placement at a small scale snap onto the thin wall and commit, also without snapping", () => {
  for (const enabled of [true, false]) {
    for (const kind of ["window", "door"] as const) {
      let committed: Project | null = null;
      const commit = (next: Project) => {
        committed = next;
      };
      const current = () => ({ project, visibility });
      const tool =
        kind === "window"
          ? windowPlacementInteraction(project, visibility, "opening", current, commit, () => {})
          : doorPlacementInteraction(project, visibility, "opening", current, commit, () => {}, {
              draft: defaultDoorDraft,
              currentDraft: () => defaultDoorDraft,
            });
      const snap = tool.snapping.resolve({ x: 4.7, y: 4 }, context(zoomedOut, enabled));
      assert.ok(Math.abs(snap.point.x - 5) < 1e-9, "snapped onto the thin axis");
      confirmInteraction(tool, snap.point);
      const storey = storeyOf(committed!);
      const opening = [...storey.windows, ...(storey.doors ?? [])].find((o) => o.id === "opening");
      assert.equal(opening?.wallId, "thin");
    }
  }
});
