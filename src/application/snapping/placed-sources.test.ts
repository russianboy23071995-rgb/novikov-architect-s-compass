import test from "node:test";
import assert from "node:assert/strict";
import { createProject } from "../projects/create.ts";
import { addWall } from "../walls/actions.ts";
import { createDrawing } from "../drawing/actions.ts";
import { defaultLineAppearance } from "../../lib/bim/lines.ts";
import { placedDrawingSnap, type PlacedSnapDrawing } from "./placed-sources.ts";

// docs/LAYOUTBUCH.md: what a placed drawing shows snaps on the paper, read only.
function plan() {
  let p = createProject("p", "eg");
  p = addWall(p, {
    id: "w",
    start: { x: 0, y: 0 },
    end: { x: 4, y: 0 },
    thickness: 0.2,
    height: 3,
  });
  const hidden = p.layers.find((l) => l.name === "2D-Zeichnungen")!.id;
  p = createDrawing(p, p, "l", {
    kind: "line",
    points: [
      { x: 0, y: 2 },
      { x: 1, y: 2 },
    ],
    lineKind: "line",
    appearance: defaultLineAppearance,
  });
  return { p, hidden };
}
const near = (index: NonNullable<ReturnType<typeof placedDrawingSnap>>, x: number, y: number) =>
  index.sources
    .queryPrimitives({ x, y }, 10000, 2)
    .references.filter((r) => Math.hypot(r.point.x - x, r.point.y - y) < 1e-9)
    .map((r) => r.entityId);

test("placed drawing snap: wall corners on the paper, inside the mask, hidden layers left out", () => {
  const { p, hidden } = plan();
  // 1:100, model point (2, 0) at paper (0,2 | 0,1); the mask shows model x −3…3, y −1…3.
  const drawing: PlacedSnapDrawing = {
    id: "z",
    position: { x: 0.2, y: 0.1 },
    mask: { x0: -0.05, x1: 0.01, y0: -0.03, y1: 0.01 },
    center: { x: 2, y: 0 },
    denominator: 100,
    content: { kind: "plan", source: p, hiddenLayerIds: [] },
  };
  const snap = placedDrawingSnap([drawing])!;
  // Wall start (0, 0) → paper (0,18 | 0,1); its end (4, 0) lies outside the mask (x 0,22).
  assert.deepEqual(near(snap, 0.18, 0.1), ["z/w"]);
  assert.deepEqual(near(snap, 0.22, 0.1), []);
  // The line (0, 2)–(1, 2) → paper y 0,12 > mask top 0,11: outside.
  assert.deepEqual(near(snap, 0.18, 0.12), []);
  assert.ok(snap.ids.has("z/w"));
  // A wider mask shows the line; a hidden layer takes it out again.
  const wide = { ...drawing, mask: { x0: -0.05, x1: 0.05, y0: -0.05, y1: 0.05 } };
  assert.deepEqual(near(placedDrawingSnap([wide])!, 0.18, 0.12), ["z/l"]);
  const hiding = {
    ...wide,
    content: { kind: "plan" as const, source: p, hiddenLayerIds: [hidden] },
  };
  assert.deepEqual(near(placedDrawingSnap([hiding])!, 0.18, 0.12), []);
  assert.deepEqual(near(placedDrawingSnap([hiding])!, 0.18, 0.1), ["z/w"]);
});

test("placed drawing snap: section outlines and edges; nothing to snap gives null", () => {
  const section: PlacedSnapDrawing = {
    id: "s",
    position: { x: 0.1, y: 0.1 },
    mask: { x0: -0.1, x1: 0.1, y0: -0.1, y1: 0.1 },
    center: { x: 0, y: 0 },
    denominator: 50,
    content: {
      kind: "section",
      drawing: {},
      rings: [
        [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 1, y: 3 },
          { x: 0, y: 3 },
        ],
      ],
      paths: [
        [
          { x: 2, y: 0 },
          { x: 2, y: 3 },
        ],
      ],
    },
  };
  const snap = placedDrawingSnap([section])!;
  assert.deepEqual(near(snap, 0.12, 0.16), ["s/ring-0"]);
  assert.deepEqual(near(snap, 0.14, 0.16), ["s/path-0"]);
  assert.equal(placedDrawingSnap([]), null);
});
