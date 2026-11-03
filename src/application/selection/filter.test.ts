import test from "node:test";
import assert from "node:assert/strict";
import { serializeProject } from "../../lib/bim/model.ts";
import { createProject } from "../projects/create.ts";
import { addWall } from "../walls/actions.ts";
import { createDrawing, defaultHatchFill } from "../drawing/actions.ts";
import { defaultLineAppearance } from "../../lib/bim/lines.ts";
import { createLayerVisibilityPolicy } from "../layers/visibility.ts";
import { addStorey, setStoreyHeight } from "../storeys/actions.ts";
import { selectWorkingStorey } from "../storeys/working-storey.ts";
import { storeyOf } from "../../domain/storeys/access.ts";
import {
  applyFilter,
  filterElements,
  filterOptions,
  NO_CRITERIA,
  similarCriteria,
} from "./filter.ts";

const BLUE = "#2563eb";
function fixture() {
  let p = createProject("p", "s");
  const inner = p.layers.find((l) => l.name === "Innenwand")!.id;
  const wall = (id: string, y: number, layerId?: string) =>
    (p = addWall(p, {
      id,
      start: { x: 0, y },
      end: { x: 3, y },
      thickness: 0.2,
      height: 2.8,
      ...(layerId ? { layerId } : {}),
    }));
  wall("outer", 0);
  wall("inner", 2, inner);
  const line = (id: string, y: number, appearance = defaultLineAppearance) =>
    (p = createDrawing(p, p, id, {
      kind: "line",
      points: [
        { x: 0, y },
        { x: 3, y },
      ],
      lineKind: "line",
      appearance,
    }));
  line("grey", 4);
  line("blue", 5, { ...defaultLineAppearance, color: BLUE });
  line("blue-dashed", 6, { color: "#2563EB", penWidth: 0.5, style: "dashed" });
  p = createDrawing(p, p, "hatch", {
    kind: "hatch",
    points: [
      { x: 4, y: 0 },
      { x: 5, y: 0 },
      { x: 5, y: 1 },
    ],
    fill: { ...defaultHatchFill, color: BLUE },
  });
  return { p, inner };
}
const ids = (targets: { id: string }[]) => targets.map((t) => t.id);

test("filter: by layer, colour, line type and pen width; criteria combine, values alternate", () => {
  const { p, inner } = fixture();
  const snapshot = serializeProject(p);
  const storey = { kind: "storey" } as const;
  const run = (criteria: Partial<typeof NO_CRITERIA>) =>
    ids(filterElements(p, undefined, storey, { ...NO_CRITERIA, ...criteria }));
  assert.deepEqual(run({ layerIds: [inner] }), ["inner"]);
  // Colour regardless of case; walls have no colour of their own.
  assert.deepEqual(run({ colors: [BLUE] }), ["blue", "blue-dashed", "hatch"]);
  assert.deepEqual(run({ colors: [BLUE], kinds: ["line"] }), ["blue", "blue-dashed"]);
  assert.deepEqual(run({ lineStyles: ["dashed"] }), ["blue-dashed"]);
  assert.deepEqual(run({ lineStyles: ["dashed", "solid"] }), ["grey", "blue", "blue-dashed"]);
  assert.deepEqual(run({ penWidths: [0.5] }), ["blue-dashed"]);
  assert.deepEqual(run({ kinds: ["wall"] }), ["outer", "inner"]);
  assert.equal(run({}).length, 6);
  assert.equal(serializeProject(p), snapshot, "the filter never changes the model");
});

test("filter: hidden layers stay out, options count what occurs", () => {
  const { p, inner } = fixture();
  const policy = createLayerVisibilityPolicy(p, {
    scope: { kind: "bim-project" },
    hiddenLayerIds: [inner],
  });
  assert.deepEqual(
    ids(filterElements(p, policy, { kind: "storey" }, { ...NO_CRITERIA, kinds: ["wall"] })),
    ["outer"],
  );
  const options = filterOptions(p, undefined, { kind: "storey" });
  assert.deepEqual(
    options.kinds.map((o) => [o.label, o.count]),
    [
      ["Wand", 2],
      ["Linie", 3],
      ["Schraffur", 1],
    ],
  );
  assert.deepEqual(
    options.colors.find((o) => o.value === BLUE),
    { value: BLUE, label: BLUE, count: 3 },
  );
  assert.deepEqual(
    options.lineStyles.map((o) => [o.label, o.count]),
    [
      ["Gestrichelt", 1],
      ["Durchgezogen", 2],
    ],
  );
  assert.deepEqual(
    options.penWidths.map((o) => o.label),
    ["0,25 mm", "0,5 mm"],
  );
  assert.ok(options.layers.some((o) => o.value === inner && o.count === 1));
});

test("filter: scope storey, all storeys or what a section shows", () => {
  const { p: base } = fixture();
  const first = storeyOf(base).id;
  let p = setStoreyHeight(base, base, { projectId: base.id, storeyId: first, height: 2.8 });
  p = addStorey(p, p, {
    projectId: base.id,
    storeyId: first,
    id: "og",
    side: "above",
    height: 2.8,
  });
  p = selectWorkingStorey(p, p, "og");
  p = addWall(p, {
    id: "upper",
    start: { x: 0, y: 0 },
    end: { x: 3, y: 0 },
    thickness: 0.2,
    height: 2.8,
  });
  const walls = { ...NO_CRITERIA, kinds: ["wall" as const] };
  assert.deepEqual(ids(filterElements(p, undefined, { kind: "storey" }, walls)), ["upper"]);
  assert.deepEqual(ids(filterElements(p, undefined, { kind: "all" }, walls)), [
    "outer",
    "inner",
    "upper",
  ]);
  const shown = { kind: "shown", ids: new Set(["inner", "upper", "blue"]) } as const;
  assert.deepEqual(ids(filterElements(p, undefined, shown, walls)), ["inner", "upper"]);
});

test("filter: replace, add to or remove from the selection; similar elements", () => {
  const { p } = fixture();
  const wall = { kind: "wall", id: "outer" } as const;
  const blue = filterElements(p, undefined, { kind: "storey" }, { ...NO_CRITERIA, colors: [BLUE] });
  assert.deepEqual(ids(applyFilter([wall], blue, "replace")), ["blue", "blue-dashed", "hatch"]);
  assert.deepEqual(ids(applyFilter([wall, blue[0]!], blue, "add")), [
    "outer",
    "blue",
    "blue-dashed",
    "hatch",
  ]);
  assert.deepEqual(ids(applyFilter([wall, blue[0]!], blue, "remove")), ["outer"]);
  const similar = similarCriteria(p, { kind: "line", id: "blue" });
  assert.deepEqual(similar.colors, [BLUE]);
  assert.deepEqual(ids(filterElements(p, undefined, { kind: "storey" }, similar)), [
    "blue",
    "blue-dashed",
  ]);
});
