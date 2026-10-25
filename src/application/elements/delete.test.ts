import test from "node:test";
import assert from "node:assert/strict";
import { tPairFixture } from "../../../benchmarks/t-pair-fixture.ts";
import { hatchPointFixture } from "../../../benchmarks/hatch-point-fixture.ts";
import { addLine } from "../lines/actions.ts";
import { createProject } from "../projects/create.ts";
import { validateProject } from "../../domain/project/schema.ts";
import { addWall } from "../walls/actions.ts";
import { defaultLineAppearance } from "../../lib/bim/lines.ts";
import { createHistory, commitProject, undoProject } from "../history/project-history.ts";
import { normalizeSpeech } from "../../lib/bim/voice.ts";
import { storeyOf } from "../../domain/storeys/access.ts";
import { DOOR_DEFAULTS } from "../../domain/elements/door/model.ts";
import { addDoor } from "../doors/actions.ts";
import { previewCreateReference } from "../references/actions.ts";
import { createLayerVisibilityPolicy } from "../layers/visibility.ts";
import { previewSelectionCommand } from "../commands/selection-command.ts";
import type { SelectionSet } from "../selection/state.ts";
import type { Project } from "../../domain/project/schema.ts";
import { previewDeleteSelection } from "./delete.ts";

const visible = (p: Project) =>
  createLayerVisibilityPolicy(p, { scope: { kind: "bim-project" }, hiddenLayerIds: [] });
const remove = (p: Project, targets: SelectionSet) =>
  previewDeleteSelection(p, targets, visible(p));

/** T pair with two windows, a door on the host and a corner wall at the host's end. */
function building(): Project {
  let p = tPairFixture();
  p = addWall(p, {
    id: "wall-3",
    start: { x: 6, y: 0 },
    end: { x: 6, y: 3 },
    height: 2.8,
    thickness: 0.36,
    bodyOffset: 0.18,
  });
  p = validateProject({
    ...p,
    storeys: p.storeys.map((s) => ({
      ...s,
      wallJoins: [
        { first: { wallId: "wall-1", endpoint: 1 }, second: { wallId: "wall-3", endpoint: 0 } },
      ],
    })),
  });
  return addDoor(p, { id: "door", wallId: "wall-1", position: 0.2, ...DOOR_DEFAULTS });
}

test("deleting a wall takes its windows and doors and dissolves its corner and T", () => {
  const p = building();
  const { result, summary } = remove(p, [{ kind: "wall", id: "wall-1" }]);
  const s = storeyOf(result);
  assert.deepEqual(
    s.walls.map((w) => w.id),
    ["wall-2", "wall-3"],
  );
  assert.deepEqual(
    s.windows.map((w) => w.id),
    ["window-1"],
  );
  assert.deepEqual(s.doors, []);
  assert.deepEqual(s.wallJoins, []);
  assert.deepEqual(s.wallTJunctions, []);
  // Neighbours keep their geometry; only the connection is gone.
  for (const id of ["wall-2", "wall-3"])
    assert.deepEqual(
      s.walls.find((w) => w.id === id),
      storeyOf(p).walls.find((w) => w.id === id),
    );
  assert.equal(
    summary,
    "1 Element löschen; 2 Fenster/Türen der Wände werden mitgelöscht; 2 Wandanschlüsse werden gelöst",
  );
});

test("each element kind deletes alone; selected openings are not counted twice", () => {
  const p = addLine(building(), {
    id: "line",
    kind: "line",
    points: [
      { x: 0, y: 5 },
      { x: 2, y: 5 },
    ],
    ...defaultLineAppearance,
  });
  for (const target of [
    { kind: "window", id: "window-0" },
    { kind: "door", id: "door" },
    { kind: "line", id: "line" },
    { kind: "wall", id: "wall-3" },
  ] as const) {
    const { result, summary } = remove(p, [target]);
    assert.equal(
      [
        ...storeyOf(result).walls,
        ...storeyOf(result).windows,
        ...storeyOf(result).doors!,
        ...storeyOf(result).lines!,
      ].some((e) => e.id === target.id),
      false,
    );
    assert.match(summary, /^1 Element löschen/);
  }
  // Wall-3 has no openings: only its corner dissolves; wall-1 keeps its T.
  const corner = storeyOf(remove(p, [{ kind: "wall", id: "wall-3" }]).result);
  assert.deepEqual(corner.wallJoins, []);
  assert.equal(corner.wallTJunctions.length, 1);
  const both = remove(p, [
    { kind: "wall", id: "wall-1" },
    { kind: "door", id: "door" },
  ]);
  assert.match(both.summary, /^2 Elemente löschen; 1 Fenster\/Tür der Wand wird mitgelöscht/);
});

test("unused image assets and hatch patterns leave with their last user", () => {
  const png =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=";
  const base = createProject("p", "s");
  const one = previewCreateReference(base, base, {
    projectId: base.id,
    asset: { id: "asset", mimeType: "image/png", pixelWidth: 1, pixelHeight: 1, data: png },
    reference: {
      id: "ref-1",
      kind: "image-reference",
      assetId: "asset",
      layerId: base.defaultLayerIds.line,
      origin: { x: 0, y: 0 },
      rotation: 0,
      metresPerPixel: 1,
    },
  });
  assert.deepEqual(remove(one, [{ kind: "reference", id: "ref-1" }]).result.assets, []);
  // A second reference keeps the shared image.
  const two = validateProject({
    ...one,
    storeys: one.storeys.map((st) => ({
      ...st,
      references: [...st.references, { ...st.references[0]!, id: "ref-2" }],
    })),
  });
  assert.deepEqual(
    remove(two, [{ kind: "reference", id: "ref-1" }]).result.assets.map((a) => a.id),
    ["asset"],
  );
  const hatches = hatchPointFixture(2, 8);
  const first = remove(hatches, [{ kind: "hatch", id: "h0" }]).result;
  assert.deepEqual(
    first.hatchPatterns.map((h) => h.id),
    ["pattern"],
  );
  const last = remove(first, [{ kind: "hatch", id: "h1" }]).result;
  assert.deepEqual(last.hatchPatterns, []);
});

test("stale, foreign-storey and hidden selections are rejected; Undo restores exactly", () => {
  const p = building();
  assert.throws(() => remove(p, []), /aktuelle Auswahl/);
  assert.throws(() => remove(p, [{ kind: "wall", id: "missing" }]), /aktuelle Auswahl/);
  assert.throws(() => remove(p, [{ kind: "door", id: "window-0" }]), /aktuelle Auswahl/);
  const hidden = createLayerVisibilityPolicy(p, {
    scope: { kind: "bim-project" },
    hiddenLayerIds: [p.defaultLayerIds.wall],
  });
  assert.throws(
    () => previewDeleteSelection(p, [{ kind: "wall", id: "wall-1" }], hidden),
    /aktuelle Auswahl/,
  );
  const twoStoreys = validateProject({
    ...p,
    storeys: [
      ...p.storeys,
      {
        ...p.storeys[0]!,
        id: "upper",
        name: "OG",
        walls: [{ ...storeyOf(p).walls[0]!, id: "up" }],
        windows: [],
        doors: [],
        wallJoins: [],
        wallTJunctions: [],
      },
    ],
  });
  assert.throws(
    () =>
      remove(twoStoreys, [
        { kind: "wall", id: "wall-2" },
        { kind: "wall", id: "up" },
      ]),
    /einem Geschoss/,
  );
  const h = createHistory(p);
  const committed = commitProject(h, remove(h.present, [{ kind: "wall", id: "wall-1" }]).result);
  assert.equal(committed.past.length, 1);
  assert.equal(undoProject(committed).present, h.present);
});

test("text and voice use the same delete operation", () => {
  const p = building();
  const targets = [{ kind: "wall", id: "wall-1" }] as const;
  const direct = remove(p, targets);
  for (const text of [
    "Auswahl löschen",
    "auswahl entfernen",
    normalizeSpeech("Auswahl löschen."),
  ]) {
    const preview = previewSelectionCommand(p, targets, visible(p), text);
    assert.deepEqual(preview.result, direct.result, text);
    assert.equal(preview.summary, direct.summary);
  }
  assert.throws(
    () => previewSelectionCommand(p, targets, visible(p), "Auswahl wegwerfen"),
    /Auswahl löschen/,
  );
});
